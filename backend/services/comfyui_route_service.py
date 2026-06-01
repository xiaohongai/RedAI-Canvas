import copy
import json
import os
import random
import re
import shutil
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

WORKFLOW_NAME_RE = re.compile(r"^[a-zA-Z0-9_\u4e00-\u9fff./-]+\.json$")
CUSTOM_WORKFLOW_FOLDER = "custom"
COMFYUI_HISTORY_TIMEOUT = 300
CLIENT_ID = "redai-canvas"


def _json_ok(data):
    return {"kind": "json_ok", "data": data}


def _json_err(code, message):
    return {
        "kind": "json_err",
        "code": int(code),
        "message": str(message or ""),
    }


def _parse_json_object(body):
    try:
        data = json.loads(body) if body else {}
    except json.JSONDecodeError:
        return None, _json_err(400, "Invalid JSON")
    if not isinstance(data, dict):
        return None, _json_err(400, "Invalid JSON")
    return data, None


def _is_connection_ref(value):
    return isinstance(value, list) and len(value) == 2 and isinstance(value[0], str) and isinstance(value[1], int)


def apply_params_to_workflow(workflow, params):
    if not isinstance(workflow, dict) or not isinstance(params, dict):
        return workflow
    result = copy.deepcopy(workflow)
    for node_id, node_inputs in params.items():
        if node_id not in result or not isinstance(node_inputs, dict):
            continue
        if "inputs" not in result[node_id] or not isinstance(result[node_id]["inputs"], dict):
            result[node_id]["inputs"] = {}
        for input_name, value in node_inputs.items():
            result[node_id]["inputs"][input_name] = value
    return result


def normalize_comfy_instance(value):
    s = str(value or "").strip()
    if not s:
        return ""
    s = re.sub(r"^https?://", "", s)
    s = s.rstrip("/")
    if ":" not in s:
        raise ValueError(f"地址缺少端口号：{value}（应为 host:port，例如 127.0.0.1:8188）")
    host, _, port = s.rpartition(":")
    if not host or not port.isdigit():
        raise ValueError(f"地址不合法：{value}（应为 host:port，例如 127.0.0.1:8188）")
    return s


def comfy_output_extension(item):
    filename = str((item or {}).get("filename") or "")
    ext = os.path.splitext(filename)[1].lower()
    if ext in {".png", ".jpg", ".jpeg", ".webp", ".mp4", ".webm", ".mov", ".m4v", ".gif"}:
        return ext
    fmt = str((item or {}).get("format") or "").lower()
    if "webm" in fmt:
        return ".webm"
    if "quicktime" in fmt or "mov" in fmt:
        return ".mov"
    if "mp4" in fmt or "h264" in fmt or "video" in fmt:
        return ".mp4"
    return ".png"


def collect_comfy_history_outputs(history_data, backend, output_dir, output_type="comfyui"):
    local_images = []
    local_urls = []
    current_timestamp = time.time()
    if not isinstance(history_data, dict) or "outputs" not in history_data:
        return {"images": local_images, "outputs": local_urls}
    for node_id in history_data["outputs"]:
        node_output = history_data["outputs"][node_id]
        if "images" not in node_output:
            continue
        for img in node_output["images"]:
            prefix = f"{output_type}_{int(current_timestamp)}_"
            local_path = download_comfy_output(backend, img, output_dir, prefix=prefix)
            if local_path:
                local_images.append(local_path)
                local_urls.append(local_path)
    return {"images": local_images, "outputs": local_urls}


def download_comfy_output(comfy_address, item, output_dir, prefix="comfy_"):
    ext = comfy_output_extension(item)
    filename = f"{prefix}{uuid.uuid4().hex[:10]}{ext}"
    os.makedirs(output_dir, exist_ok=True)
    local_path = os.path.join(output_dir, filename)
    subfolder = urllib.parse.quote(str(item.get("subfolder") or ""))
    file_type = urllib.parse.quote(str(item.get("type") or "output"))
    comfy_url_path = (
        f"/view?filename={urllib.parse.quote(str(item['filename']))}"
        f"&subfolder={subfolder}&type={file_type}"
    )
    full_url = f"http://{comfy_address}{comfy_url_path}"
    try:
        with urllib.request.urlopen(full_url, timeout=60) as response, open(local_path, "wb") as out_file:
            shutil.copyfileobj(response, out_file)
        return f"/output/{filename}"
    except Exception:
        return ""


def get_comfy_history(comfy_address, prompt_id):
    try:
        with urllib.request.urlopen(f"http://{comfy_address}/history/{prompt_id}", timeout=10) as response:
            return json.loads(response.read())
    except Exception:
        return {}


def get_best_backend(instances, required_images=None):
    cleaned = [str(x).strip() for x in (instances or []) if str(x).strip()]
    if not cleaned:
        raise RuntimeError("未配置 ComfyUI 后端地址")
    return cleaned[0]


class ComfyuiRouteService:
    def __init__(
        self,
        *,
        workflows_dir_getter,
        output_dir_getter,
        read_user_settings,
        write_user_settings,
        uploads_dir_getter=None,
    ):
        self._get_workflows_dir = workflows_dir_getter
        self._get_output_dir = output_dir_getter
        self._read_user_settings = read_user_settings
        self._write_user_settings = write_user_settings
        self._get_uploads_dir = uploads_dir_getter or (lambda: "")

    def _workflows_root(self):
        return os.path.abspath(self._get_workflows_dir())

    def _workflow_path_from_name(self, name):
        root = self._workflows_root()
        rel = str(name or "").replace("\\", "/").lstrip("/")
        path = os.path.abspath(os.path.join(root, rel))
        if not path.startswith(root + os.sep) and path != root:
            raise ValueError("Invalid workflow path")
        return path

    def _config_path_from_name(self, name):
        workflow_path = self._workflow_path_from_name(name)
        if workflow_path.endswith(".json"):
            return workflow_path[:-5] + ".config.json"
        return workflow_path + ".config.json"

    def _read_instances(self):
        settings = self._read_user_settings() or {}
        comfy = settings.get("comfyui") if isinstance(settings.get("comfyui"), dict) else {}
        raw = comfy.get("instances")
        if isinstance(raw, list):
            return [str(x).strip() for x in raw if str(x).strip()]
        return ["127.0.0.1:8188"]

    def _write_instances(self, instances):
        settings = dict(self._read_user_settings() or {})
        comfy = dict(settings.get("comfyui") or {})
        comfy["instances"] = instances
        settings["comfyui"] = comfy
        self._write_user_settings(settings, migrate=False)

    def _list_workflows(self):
        root = self._workflows_root()
        if not os.path.isdir(root):
            return []
        items = []
        for dir_root, dirs, files in os.walk(root):
            if os.path.abspath(dir_root) == os.path.abspath(root):
                dirs[:] = [d for d in dirs if d in {CUSTOM_WORKFLOW_FOLDER}]
            for fn in sorted(files):
                if not fn.endswith(".json") or fn.endswith(".config.json"):
                    continue
                rel = os.path.relpath(os.path.join(dir_root, fn), root).replace("\\", "/")
                cfg = {}
                cfg_path = self._config_path_from_name(rel)
                if os.path.exists(cfg_path):
                    try:
                        with open(cfg_path, "r", encoding="utf-8") as f:
                            cfg = json.load(f) or {}
                    except Exception:
                        cfg = {}
                items.append(
                    {
                        "name": rel,
                        "title": cfg.get("title") or fn.replace(".json", ""),
                        "field_count": len(cfg.get("fields") or []),
                    }
                )
        items.sort(key=lambda item: (0 if item["name"].startswith(f"{CUSTOM_WORKFLOW_FOLDER}/") else 1, item["title"]))
        return items

    def _load_workflow_bundle(self, name):
        workflow_path = self._workflow_path_from_name(name)
        if not os.path.exists(workflow_path):
            return None
        with open(workflow_path, "r", encoding="utf-8") as f:
            workflow = json.load(f)
        cfg = {"title": name.replace(".json", ""), "fields": []}
        cfg_path = self._config_path_from_name(name)
        if os.path.exists(cfg_path):
            try:
                with open(cfg_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f) or cfg
            except Exception:
                pass
        return {"name": name, "workflow": workflow, "config": cfg}

    def _resolve_local_image_bytes(self, url):
        raw = str(url or "").strip()
        if not raw:
            return None, ""
        if raw.startswith("/output/"):
            path = os.path.join(self._get_output_dir(), raw[len("/output/") :])
            if os.path.isfile(path):
                with open(path, "rb") as f:
                    return f.read(), os.path.basename(path)
        if raw.startswith("/data/uploads/") or raw.startswith("data/uploads/"):
            rel = raw.split("data/uploads/", 1)[-1].lstrip("/")
            path = os.path.join(self._get_uploads_dir(), rel)
            if os.path.isfile(path):
                with open(path, "rb") as f:
                    return f.read(), os.path.basename(path)
        if raw.startswith("/"):
            return None, ""
        if raw.startswith("http://127.0.0.1") or raw.startswith("http://localhost"):
            try:
                with urllib.request.urlopen(raw, timeout=30) as response:
                    return response.read(), os.path.basename(urllib.parse.urlparse(raw).path) or "upload.png"
            except Exception:
                return None, ""
        return None, ""

    def _upload_image_to_comfy(self, backend, image_url):
        content, filename = self._resolve_local_image_bytes(image_url)
        if not content:
            raise RuntimeError(f"无法读取图片：{image_url}")
        boundary = f"----RedAICanvas{uuid.uuid4().hex}"
        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="image"; filename="{filename}"\r\n'
            f"Content-Type: application/octet-stream\r\n\r\n"
        ).encode("utf-8") + content + f"\r\n--{boundary}--\r\n".encode("utf-8")
        req = urllib.request.Request(
            f"http://{backend}/upload/image",
            data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            payload = json.loads(response.read())
        name = str(payload.get("name") or payload.get("filename") or filename)
        return name

    def _run_generation(self, *, workflow_name, params, image_inputs=None, output_type="comfyui"):
        bundle = self._load_workflow_bundle(workflow_name)
        if not bundle:
            raise RuntimeError(f"工作流不存在：{workflow_name}")
        workflow = apply_params_to_workflow(bundle["workflow"], params or {})
        backend = get_best_backend(self._read_instances())
        for key, spec in (image_inputs or {}).items():
            if not isinstance(spec, dict):
                continue
            node_id = str(spec.get("node") or key or "").strip()
            input_name = str(spec.get("input") or "image").strip()
            image_url = str(spec.get("url") or "").strip()
            if not node_id or not image_url:
                continue
            comfy_name = self._upload_image_to_comfy(backend, image_url)
            if node_id not in workflow:
                continue
            if "inputs" not in workflow[node_id]:
                workflow[node_id]["inputs"] = {}
            workflow[node_id]["inputs"][input_name] = comfy_name

        seed = random.randint(1, 10**15)
        payload = {"prompt": workflow, "client_id": CLIENT_ID}
        data = json.dumps(payload).encode("utf-8")
        try:
            post_req = urllib.request.Request(f"http://{backend}/prompt", data=data, method="POST")
            prompt_id = json.loads(urllib.request.urlopen(post_req, timeout=15).read())["prompt_id"]
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"ComfyUI HTTP {exc.code}: {error_body}") from exc

        history_data = None
        for _ in range(COMFYUI_HISTORY_TIMEOUT):
            res = get_comfy_history(backend, prompt_id)
            if prompt_id in res:
                history_data = res[prompt_id]
                break
            time.sleep(1)
        if not history_data:
            raise RuntimeError("ComfyUI 渲染超时")

        collected = collect_comfy_history_outputs(
            history_data,
            backend,
            self._get_output_dir(),
            output_type=output_type,
        )
        return {
            "images": collected["images"],
            "outputs": collected["outputs"],
            "seed": seed,
            "prompt_id": prompt_id,
            "backend": backend,
            "workflow": workflow_name,
        }

    def handle_get(self, handler, path):
        if path == "/api/v2/comfyui/instances":
            return _json_ok({"instances": self._read_instances()})
        if path == "/api/v2/comfyui/workflows":
            return _json_ok({"workflows": self._list_workflows()})
        if path.startswith("/api/v2/comfyui/workflows/"):
            name = urllib.parse.unquote(path[len("/api/v2/comfyui/workflows/") :])
            if name.endswith("/config"):
                return None
            bundle = self._load_workflow_bundle(name)
            if not bundle:
                return _json_err(404, "Workflow not found")
            return _json_ok(bundle)
        if path == "/api/v2/comfyui/result":
            query = urllib.parse.parse_qs(urllib.parse.urlparse(handler.path).query)
            backend = (query.get("backend") or [""])[0].strip()
            prompt_id = (query.get("prompt_id") or query.get("promptId") or [""])[0].strip()
            if not backend or not prompt_id:
                return _json_err(400, "Missing backend or prompt_id")
            history = get_comfy_history(backend, prompt_id)
            item = history.get(prompt_id)
            if not item:
                return _json_ok({"ready": False})
            collected = collect_comfy_history_outputs(
                item,
                backend,
                self._get_output_dir(),
            )
            return _json_ok({"ready": True, **collected, "prompt_id": prompt_id, "backend": backend})
        return None

    def handle_put(self, handler, path, body):
        if path == "/api/v2/comfyui/instances":
            data, err = _parse_json_object(body)
            if err:
                return err
            raw = data.get("instances")
            if not isinstance(raw, list):
                return _json_err(400, "instances must be an array")
            cleaned = []
            try:
                for item in raw:
                    normalized = normalize_comfy_instance(item)
                    if normalized and normalized not in cleaned:
                        cleaned.append(normalized)
            except ValueError as exc:
                return _json_err(400, str(exc))
            if not cleaned:
                return _json_err(400, "至少保留一个 ComfyUI 后端地址")
            self._write_instances(cleaned)
            return _json_ok({"instances": cleaned})
        if path.startswith("/api/v2/comfyui/workflows/") and path.endswith("/config"):
            name = urllib.parse.unquote(path[len("/api/v2/comfyui/workflows/") : -len("/config")])
            data, err = _parse_json_object(body)
            if err:
                return err
            if not WORKFLOW_NAME_RE.match(name):
                return _json_err(400, "Invalid workflow name")
            if not os.path.exists(self._workflow_path_from_name(name)):
                return _json_err(404, "Workflow not found")
            fields = data.get("fields")
            if fields is not None and not isinstance(fields, list):
                return _json_err(400, "fields must be an array")
            cfg = {
                "title": str(data.get("title") or name.replace(".json", "")),
                "fields": fields if isinstance(fields, list) else [],
            }
            cfg_path = self._config_path_from_name(name)
            os.makedirs(os.path.dirname(cfg_path), exist_ok=True)
            with open(cfg_path, "w", encoding="utf-8") as f:
                json.dump(cfg, f, ensure_ascii=False, indent=2)
            return _json_ok({"config": cfg})
        return None

    def handle_post(self, handler, path, body):
        if path == "/api/v2/comfyui/workflows":
            data, err = _parse_json_object(body)
            if err:
                return err
            name = os.path.basename(str(data.get("name") or "").strip())
            if not name.endswith(".json"):
                name = name + ".json"
            if not WORKFLOW_NAME_RE.match(name):
                return _json_err(400, "工作流名称不合法")
            workflow = data.get("workflow")
            if not isinstance(workflow, dict) or not workflow:
                return _json_err(400, "工作流 JSON 为空")
            sample = next(iter(workflow.values()), None)
            if not isinstance(sample, dict) or "class_type" not in sample:
                return _json_err(400, "不是有效的 ComfyUI API 工作流 JSON（需包含 class_type）")
            custom_dir = os.path.join(self._workflows_root(), CUSTOM_WORKFLOW_FOLDER)
            os.makedirs(custom_dir, exist_ok=True)
            stored_name = f"{CUSTOM_WORKFLOW_FOLDER}/{name}"
            wf_path = self._workflow_path_from_name(stored_name)
            with open(wf_path, "w", encoding="utf-8") as f:
                json.dump(workflow, f, ensure_ascii=False, indent=2)
            return _json_ok({"name": stored_name})

        if path == "/api/v2/comfyui/upload":
            data, err = _parse_json_object(body)
            if err:
                return err
            image_url = str(data.get("url") or data.get("imageUrl") or "").strip()
            if not image_url:
                return _json_err(400, "Missing url")
            backend = get_best_backend(self._read_instances())
            try:
                comfy_name = self._upload_image_to_comfy(backend, image_url)
            except Exception as exc:
                return _json_err(500, str(exc))
            return _json_ok({"comfy_name": comfy_name, "backend": backend})

        if path == "/api/v2/comfyui/generate":
            data, err = _parse_json_object(body)
            if err:
                return err
            workflow_name = str(data.get("workflow") or data.get("workflow_json") or "").strip()
            if not workflow_name:
                return _json_err(400, "Missing workflow")
            params = data.get("params") if isinstance(data.get("params"), dict) else {}
            image_inputs = data.get("imageInputs") if isinstance(data.get("imageInputs"), dict) else {}
            output_type = str(data.get("type") or "comfyui")
            try:
                result = self._run_generation(
                    workflow_name=workflow_name,
                    params=params,
                    image_inputs=image_inputs,
                    output_type=output_type,
                )
            except Exception as exc:
                return _json_err(500, str(exc))
            return _json_ok(result)

        if path.startswith("/api/v2/comfyui/workflows/") and path.endswith("/run"):
            name = urllib.parse.unquote(path[len("/api/v2/comfyui/workflows/") : -len("/run")])
            data, err = _parse_json_object(body)
            if err:
                return err
            config = data.get("config") if isinstance(data.get("config"), dict) else {}
            fields = config.get("fields") if isinstance(config.get("fields"), list) else []
            field_values = data.get("fields") if isinstance(data.get("fields"), dict) else {}
            params = {}
            for field in fields:
                if not isinstance(field, dict):
                    continue
                node_id = str(field.get("node") or "").strip()
                input_name = str(field.get("input") or "").strip()
                field_id = str(field.get("id") or "").strip()
                if not node_id or not input_name or field_id not in field_values:
                    continue
                value = field_values[field_id]
                field_type = str(field.get("type") or "text")
                if field_type in ("number", "slider"):
                    try:
                        step = field.get("step")
                        value = float(value) if step and float(step) < 1 else int(float(value))
                    except Exception:
                        pass
                elif field_type == "boolean":
                    value = bool(value)
                params.setdefault(node_id, {})[input_name] = value
            try:
                result = self._run_generation(
                    workflow_name=name,
                    params=params,
                    output_type="workflow-test",
                )
            except Exception as exc:
                return _json_err(500, str(exc))
            return _json_ok(result)

        return None

    def handle_delete(self, handler, path):
        if not path.startswith("/api/v2/comfyui/workflows/"):
            return None
        name = urllib.parse.unquote(path[len("/api/v2/comfyui/workflows/") :])
        if not WORKFLOW_NAME_RE.match(name):
            return _json_err(400, "Invalid workflow name")
        workflow_path = self._workflow_path_from_name(name)
        cfg_path = self._config_path_from_name(name)
        if not os.path.exists(workflow_path):
            return _json_err(404, "Workflow not found")
        os.remove(workflow_path)
        if os.path.exists(cfg_path):
            os.remove(cfg_path)
        return _json_ok({"ok": True})
