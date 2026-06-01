const CANVAS_ID = "v2-canvas",
  SIDE_PLUS_HOLDER_ID = "v2-side-plus-holder";
let active = false,
  dirty = false,
  canvasEl = null,
  sidePlusHolderEl = null,
  sidePlusHolderInitialTransform = "",
  rafId = 0,
  latestViewport = null,
  pendingViewport = null,
  previewStartViewport = null;
function toFiniteNumber(v0, v1 = 0) {
  const v2 = Number(v0);
  return Number["isFinite"](v2) ? v2 : v1;
}
function normalizeViewport(v3 = {}) {
  const v4 = toFiniteNumber(v3["zoom"], 1);
  return {
    x: toFiniteNumber(v3["x"], 0),
    y: toFiniteNumber(v3["y"], 0),
    zoom: v4 > 0 ? v4 : 1,
  };
}
function resolveCanvasEl(v5 = null) {
  if (v5) return v5;
  if (canvasEl) return canvasEl;
  if (typeof document === "undefined") return null;
  return document["getElementById"]?.(CANVAS_ID) || null;
}
function resolveSidePlusHolderEl(v6 = null) {
  if (v6) return v6;
  if (sidePlusHolderEl) return sidePlusHolderEl;
  if (typeof document === "undefined") return null;
  return document["getElementById"]?.(SIDE_PLUS_HOLDER_ID) || null;
}
function buildViewportTransform(v7) {
  return (
    "translate3d(" +
    v7["x"] +
    "px, " +
    v7["y"] +
    "px, 0) scale(" +
    v7["zoom"] +
    ")"
  );
}
function buildSidePlusPreviewTransform(v8) {
  if (!previewStartViewport) return sidePlusHolderInitialTransform;
  const v9 = v8["x"] - previewStartViewport["x"],
    v10 = v8["y"] - previewStartViewport["y"];
  if (!v9 && !v10) return sidePlusHolderInitialTransform;
  return "translate3d(" + v9 + "px, " + v10 + "px, 0)";
}
function applySidePlusPreviewTransform(v11) {
  const v12 = resolveSidePlusHolderEl();
  if (!v12?.["style"]) return false;
  const v13 = buildSidePlusPreviewTransform(v11);
  return (
    v12["style"]["transform"] !== v13 && (v12["style"]["transform"] = v13),
    (v12["_lastPanPreviewTransform"] = v13),
    true
  );
}
function clearSidePlusPreviewTransform() {
  const v14 = resolveSidePlusHolderEl();
  (v14?.["style"] &&
    ((v14["style"]["transform"] = sidePlusHolderInitialTransform),
    (v14["_lastPanPreviewTransform"] = "")),
    (sidePlusHolderEl = null),
    (sidePlusHolderInitialTransform = ""));
}
function applyViewportTransform(v15) {
  const v16 = resolveCanvasEl();
  if (!v16) return false;
  const v17 = buildViewportTransform(v15);
  return (
    v16["style"]["transform"] !== v17 && (v16["style"]["transform"] = v17),
    (v16["_lastTransform"] = v17),
    applySidePlusPreviewTransform(v15),
    true
  );
}
function cancelScheduledFrame() {
  if (!rafId) return;
  (typeof cancelAnimationFrame === "function" && cancelAnimationFrame(rafId),
    (rafId = 0));
}
function flushPreviewFrame() {
  rafId = 0;
  if (!pendingViewport) return;
  const v18 = pendingViewport;
  ((pendingViewport = null),
    (latestViewport = v18),
    applyViewportTransform(v18));
}
function schedulePreviewFrame() {
  if (rafId) return;
  if (typeof requestAnimationFrame === "function") {
    rafId = requestAnimationFrame(flushPreviewFrame);
    return;
  }
  flushPreviewFrame();
}
export function beginViewportPanPreview(v19, v20 = {}) {
  ((active = true),
    (dirty = false),
    (canvasEl = resolveCanvasEl(v20["canvasEl"] || null)),
    (sidePlusHolderEl = resolveSidePlusHolderEl(
      v20["sidePlusHolderEl"] || null,
    )),
    (sidePlusHolderInitialTransform =
      sidePlusHolderEl?.["style"]?.["transform"] || ""),
    (latestViewport = normalizeViewport(v19)),
    (previewStartViewport = latestViewport),
    (pendingViewport = null),
    canvasEl?.["style"] && (canvasEl["style"]["willChange"] = "transform"));
}
export function updateViewportPanPreview(v21, v22, v23) {
  !active && beginViewportPanPreview({ x: v21, y: v22, zoom: v23 });
  const v24 = normalizeViewport({ x: v21, y: v22, zoom: v23 });
  ((dirty = true),
    (latestViewport = v24),
    (pendingViewport = v24),
    schedulePreviewFrame());
}
export function getViewportPanPreview() {
  if (!active) return null;
  return pendingViewport || latestViewport;
}
export function flushViewportPanPreview() {
  cancelScheduledFrame();
  pendingViewport && flushPreviewFrame();
  const v25 = dirty && latestViewport ? { ...latestViewport } : null;
  return (
    (active = false),
    (dirty = false),
    (pendingViewport = null),
    (latestViewport = null),
    (previewStartViewport = null),
    (canvasEl = null),
    clearSidePlusPreviewTransform(),
    v25
  );
}
export function cancelViewportPanPreview() {
  (cancelScheduledFrame(),
    (active = false),
    (dirty = false),
    (pendingViewport = null),
    (latestViewport = null),
    (previewStartViewport = null),
    (canvasEl = null),
    clearSidePlusPreviewTransform());
}
export function isViewportPanPreviewActive() {
  return active;
}
