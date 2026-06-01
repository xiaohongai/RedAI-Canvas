import copy
import json
import unittest

from backend.services.comfyui_route_service import (
    apply_params_to_workflow,
    normalize_comfy_instance,
    ComfyuiRouteService,
)


class ComfyuiRouteServiceTest(unittest.TestCase):
    def test_apply_params_to_workflow(self):
        workflow = {
            "57:27": {
                "class_type": "CLIPTextEncode",
                "inputs": {"text": "old"},
            }
        }
        updated = apply_params_to_workflow(workflow, {"57:27": {"text": "new prompt"}})
        self.assertEqual(updated["57:27"]["inputs"]["text"], "new prompt")
        self.assertEqual(workflow["57:27"]["inputs"]["text"], "old")

    def test_normalize_comfy_instance(self):
        self.assertEqual(normalize_comfy_instance("http://127.0.0.1:8188/"), "127.0.0.1:8188")
        with self.assertRaises(ValueError):
            normalize_comfy_instance("127.0.0.1")

    def test_save_workflow_config(self):
        import os
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            workflows_dir = os.path.join(tmp, "workflows")
            custom_dir = os.path.join(workflows_dir, "custom")
            os.makedirs(custom_dir, exist_ok=True)
            wf_name = "custom/demo.json"
            wf_path = os.path.join(workflows_dir, "custom", "demo.json")
            with open(wf_path, "w", encoding="utf-8") as f:
                json.dump({"1": {"class_type": "SaveImage", "inputs": {}}}, f)

            settings = {"comfyui": {"instances": ["127.0.0.1:8188"]}}

            def read_settings():
                return copy.deepcopy(settings)

            def write_settings(data, migrate=True):
                settings.clear()
                settings.update(data)

            service = ComfyuiRouteService(
                workflows_dir_getter=lambda: workflows_dir,
                output_dir_getter=lambda: tmp,
                read_user_settings=read_settings,
                write_user_settings=write_settings,
            )
            response = service.handle_put(
                None,
                "/api/v2/comfyui/workflows/custom/demo.json/config",
                json.dumps({"title": "Demo", "fields": []}).encode("utf-8"),
            )
            self.assertEqual(response["kind"], "json_ok")
            cfg_path = os.path.join(workflows_dir, "custom", "demo.config.json")
            self.assertTrue(os.path.exists(cfg_path))


if __name__ == "__main__":
    unittest.main()
