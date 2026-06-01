import { del, get, post, put } from "./requester.js";

export async function fetchComfyuiInstances() {
  return (await get("/api/v2/comfyui/instances", { provider: "local" })) || {};
}

export async function saveComfyuiInstances(instances) {
  return put(
    "/api/v2/comfyui/instances",
    { instances: Array.isArray(instances) ? instances : [] },
    { provider: "local" },
  );
}

export async function fetchComfyuiWorkflows() {
  return (await get("/api/v2/comfyui/workflows", { provider: "local" })) || {};
}

export async function fetchComfyuiWorkflow(name) {
  const encoded = encodeURIComponent(String(name || ""));
  return get("/api/v2/comfyui/workflows/" + encoded, { provider: "local" });
}

export async function uploadComfyuiWorkflow({ name, workflow }) {
  return post(
    "/api/v2/comfyui/workflows",
    { name, workflow },
    { provider: "local" },
  );
}

export async function saveComfyuiWorkflowConfig(name, config) {
  const encoded = encodeURIComponent(String(name || ""));
  return put(
    "/api/v2/comfyui/workflows/" + encoded + "/config",
    config || {},
    { provider: "local" },
  );
}

export async function deleteComfyuiWorkflow(name) {
  const encoded = encodeURIComponent(String(name || ""));
  return del("/api/v2/comfyui/workflows/" + encoded, { provider: "local" });
}

export async function uploadComfyuiImage(url) {
  return post("/api/v2/comfyui/upload", { url }, { provider: "local", timeout: 60000 });
}

export async function generateComfyuiImage(payload) {
  return post("/api/v2/comfyui/generate", payload || {}, {
    provider: "local",
    timeout: 600000,
  });
}

export async function runComfyuiWorkflowTest(name, { config, fields }) {
  const encoded = encodeURIComponent(String(name || ""));
  return post(
    "/api/v2/comfyui/workflows/" + encoded + "/run",
    { config, fields },
    { provider: "local", timeout: 600000 },
  );
}

export async function fetchComfyuiResult({ backend, promptId }) {
  const params = new URLSearchParams({
    backend: String(backend || ""),
    prompt_id: String(promptId || ""),
  });
  return get("/api/v2/comfyui/result?" + params.toString(), { provider: "local" });
}
