import { startLoading, stopLoading } from "./loadingOverlay.js";
const PREVIEW_MODE_EVENT = "preview-mode-changed",
  previewLoadingRegistry = new Map();
function normalizeNodeId(v0) {
  return String(v0 || "")["trim"]();
}
function getBody() {
  return globalThis["document"]?.["body"] || null;
}
function broadcastPreviewMode(v1) {
  try {
    globalThis["window"]?.["dispatchEvent"]?.(
      new CustomEvent(PREVIEW_MODE_EVENT, { detail: { enabled: v1 === true } }),
    );
  } catch {}
}
function setBodyPreviewModeClass(v2) {
  getBody()?.["classList"]?.["toggle"]("preview-mode", v2 === true);
}
function callPreviewLoadingCallback(v3, v4) {
  const v5 = v3?.["options"]?.[v4];
  if (typeof v5 !== "function") return;
  try {
    v5();
  } catch {}
}
function stopPreviewLoadingEntry(v6) {
  if (!v6?.["containerEl"]) return;
  (stopLoading(v6["containerEl"]), callPreviewLoadingCallback(v6, "onStop"));
}
export function isPreviewModeEnabled() {
  return globalThis["window"]?.["PREVIEW_MODE"] === true;
}
export function setPreviewMode(v7) {
  const v8 = v7 === true;
  return (
    globalThis["window"] && (globalThis["window"]["PREVIEW_MODE"] = v8),
    setBodyPreviewModeClass(v8),
    !v8 && clearAllPreviewNodeLoadings(),
    broadcastPreviewMode(v8),
    v8
  );
}
export function isPreviewNodeLoading(v9) {
  const v10 = normalizeNodeId(v9);
  if (!v10) return false;
  return previewLoadingRegistry["has"](v10);
}
export function startPreviewNodeLoading(v11, v12, v13 = {}) {
  const v14 = normalizeNodeId(v11);
  if (!v14 || !v12) return false;
  const v15 = previewLoadingRegistry["get"](v14);
  v15 && stopPreviewLoadingEntry(v15);
  const v16 = { containerEl: v12, options: v13 };
  return (
    previewLoadingRegistry["set"](v14, v16),
    startLoading(v12, v13),
    callPreviewLoadingCallback(v16, "onStart"),
    true
  );
}
export function syncPreviewNodeLoading(v17, v18, v19 = null) {
  const v20 = normalizeNodeId(v17);
  if (!v20 || !v18) return false;
  const v21 = previewLoadingRegistry["get"](v20);
  if (!v21) return false;
  const v22 =
      v19 && typeof v19 === "object"
        ? { ...(v21["options"] || {}), ...v19 }
        : v21["options"] || {},
    v23 = v21["containerEl"] !== v18 || v19 != null;
  v23 && stopPreviewLoadingEntry(v21);
  const v24 = { ...v21, containerEl: v18, options: v22 };
  return (
    previewLoadingRegistry["set"](v20, v24),
    startLoading(v18, v22),
    v23 && callPreviewLoadingCallback(v24, "onStart"),
    true
  );
}
export function stopPreviewNodeLoading(v25) {
  const v26 = normalizeNodeId(v25);
  if (!v26) return false;
  const v27 = previewLoadingRegistry["get"](v26);
  if (!v27) return false;
  return (
    previewLoadingRegistry["delete"](v26),
    stopPreviewLoadingEntry(v27),
    true
  );
}
export function clearAllPreviewNodeLoadings() {
  for (const v28 of previewLoadingRegistry["values"]()) {
    stopPreviewLoadingEntry(v28);
  }
  previewLoadingRegistry["clear"]();
}
export function _resetPreviewRuntimeForTests() {
  (clearAllPreviewNodeLoadings(),
    globalThis["window"] && (globalThis["window"]["PREVIEW_MODE"] = false),
    setBodyPreviewModeClass(false));
}
