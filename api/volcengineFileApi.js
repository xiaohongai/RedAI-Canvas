import { buildApiUrl } from "./apiBase.js";
import { get as get, post as post } from "./requester.js";
const VOLCENGINE_DEFAULT_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3",
  VOLCENGINE_FILE_POLL_INTERVAL_MS = 2000,
  VOLCENGINE_FILE_POLL_TIMEOUT_MS = 2 * 60 * 1000;
function normalizeBaseUrl(v0) {
  return String(v0 || VOLCENGINE_DEFAULT_BASE_URL)
    ["trim"]()
    ["replace"](/\/+$/, "");
}
function isVolcengineFileId(v1) {
  return /^file-[A-Za-z0-9_-]+/["test"](String(v1 || "")["trim"]());
}
function extensionFromContentType(v2, v3 = "bin") {
  const v4 = String(v2 || "")
      ["trim"]()
      ["toLowerCase"](),
    v5 = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "video/mp4": "mp4",
      "video/quicktime": "mov",
      "video/webm": "webm",
      "video/x-matroska": "mkv",
    };
  return v5[v4] || String(v3 || "bin")["replace"](/^\./, "");
}
function guessFileName(v6, v7, v8) {
  try {
    const v9 = new URL(String(v6 || ""), "http://local.invalid"),
      v10 = v9["pathname"]["split"]("/")["filter"](Boolean)["pop"]() || "";
    if (v10 && v10["includes"](".")) return v10;
  } catch {}
  const v11 = extensionFromContentType(v8, v7 === "video" ? "mp4" : "png");
  return "volcengine-input." + v11;
}
function resolveInputFetchUrl(v12) {
  const v13 = String(v12 || "")["trim"]();
  if (!v13) return "";
  if (/^(?:https?:|data:|blob:)/i["test"](v13)) return v13;
  if (v13["startsWith"]("/")) return buildApiUrl(v13);
  return buildApiUrl("/" + v13);
}
function normalizeFileObject(v14) {
  const v15 =
    v14?.["data"] && typeof v14["data"] === "object" ? v14["data"] : v14;
  return v15 && typeof v15 === "object" ? v15 : {};
}
async function fetchInputBlob(v16) {
  const v17 = resolveInputFetchUrl(v16);
  if (!v17) throw new Error("火山方舟上传文件地址为空");
  return await get(v17, {
    provider: "remote",
    buildUrl: false,
    responseType: "blob",
    timeout: 5 * 60 * 1000,
  });
}
export async function retrieveVolcengineFile(v18, v19, v20 = {}) {
  const v21 = String(v18 || "")["trim"]();
  if (!v21) throw new Error("火山方舟文件 ID 为空");
  if (!v19) throw new Error("火山方舟 API Key 未配置，无法检索文件");
  const v22 =
      normalizeBaseUrl(v20["baseUrl"]) + "/files/" + encodeURIComponent(v21),
    v23 = await get("/api/v2/proxy/task?apiUrl=" + encodeURIComponent(v22), {
      headers: { Authorization: "Bearer " + v19 },
      provider: "volcengine",
      timeout: v20["timeout"] || 30000,
    });
  return normalizeFileObject(v23);
}
async function waitForVolcengineFileActive(v24, v25, v26 = {}) {
  let v27 = normalizeFileObject(v24);
  const v28 = String(v27["id"] || "")["trim"]();
  if (!v28) throw new Error("火山方舟文件上传未返回 file id");
  const v29 = Date["now"]();
  while (true) {
    const v30 = String(v27["status"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (!v30 || v30 === "active") return v27;
    if (v30 === "failed") {
      const v31 =
        v27["error"]?.["message"] || v27["message"] || "火山方舟文件处理失败";
      throw new Error(v31);
    }
    if (
      Date["now"]() - v29 >
      (v26["timeout"] || VOLCENGINE_FILE_POLL_TIMEOUT_MS)
    )
      throw new Error("火山方舟文件处理超时，请稍后重试");
    (await new Promise((v32) =>
      setTimeout(v32, v26["interval"] || VOLCENGINE_FILE_POLL_INTERVAL_MS),
    ),
      (v27 = await retrieveVolcengineFile(v28, v25, v26)));
  }
}
export async function uploadBlobToVolcengineFile(v33, v34, v35 = {}) {
  if (!v33) throw new Error("火山方舟上传文件不能为空");
  if (!v34) throw new Error("火山方舟 API Key 未配置，无法上传文件");
  const v36 = String(v35["kind"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v37 = String(v33["type"] || v35["contentType"] || "")["trim"](),
    v38 =
      v35["filename"] ||
      guessFileName(v35["sourceUrl"], v36, v37 || v35["contentType"]),
    v39 = normalizeBaseUrl(v35["baseUrl"]) + "/files",
    v40 = new FormData();
  (v40["append"]("purpose", "user_data"), v40["append"]("file", v33, v38));
  v36 === "video" &&
    (v40["append"](
      "preprocess_configs[video][fps]",
      String(v35["videoFps"] ?? 0.3),
    ),
    v35["model"] &&
      v40["append"]("preprocess_configs[video][model]", String(v35["model"])));
  const v41 = await post(
    "/api/v2/proxy/upload?apiUrl=" + encodeURIComponent(v39),
    v40,
    {
      headers: { Authorization: "Bearer " + v34 },
      provider: "volcengine",
      timeout: v35["uploadTimeout"] || 5 * 60 * 1000,
    },
  );
  return await waitForVolcengineFileActive(v41, v34, v35);
}
export async function uploadInputToVolcengineFile(v42, v43, v44 = {}) {
  const v45 = String(v42 || "")["trim"]();
  if (!v45) return "";
  if (isVolcengineFileId(v45)) return v45;
  const v46 = await fetchInputBlob(v45),
    v47 = await uploadBlobToVolcengineFile(v46, v43, {
      ...v44,
      sourceUrl: v45,
    }),
    v48 = String(v47["id"] || "")["trim"]();
  if (!v48) throw new Error("火山方舟文件上传未返回 file id");
  return v48;
}
export async function uploadInputsToVolcengineFiles(v49, v50, v51 = {}) {
  const v52 = Array["isArray"](v49)
      ? v49["map"]((v53) => String(v53 || "")["trim"]())["filter"](Boolean)
      : [],
    v54 = new Array(v52["length"])["fill"]("");
  for (let v55 = 0; v55 < v52["length"]; v55 += 1) {
    v54[v55] = await uploadInputToVolcengineFile(v52[v55], v50, v51);
  }
  return v54;
}
