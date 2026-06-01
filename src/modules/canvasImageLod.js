const LOW_ZOOM_BODY_CLASS = "is-zoom-low";
export const CANVAS_LOW_ZOOM_LOD_THRESHOLD = 0.45;
export const MEDIA_LOD_MODE_ATTR = "mediaLodMode";
export const MEDIA_LOD_MODE_THUMB = "thumb";
export const MEDIA_LOD_MODE_FULL = "full";
const PROMOTED_NODE_CLASSES = [
  "selected",
  "v2-selected",
  "selection-related",
  "conn-src",
  "conn-hoverTarget",
];
function getStateSnapshot(v0) {
  if (!v0) return {};
  if (typeof v0["getStateRaw"] === "function") return v0["getStateRaw"]() || {};
  if (typeof v0["getState"] === "function") return v0["getState"]() || {};
  return {};
}
function getNodeElement({
  nodeId: nodeId = "",
  rootEl: rootEl = null,
  documentRef: documentRef = globalThis["document"],
} = {}) {
  const v1 = rootEl?.["closest"]?.(".v2-node");
  if (v1) return v1;
  const v2 = String(nodeId || "")["trim"]();
  return v2 ? documentRef?.["getElementById"]?.(v2) || null : null;
}
function isNodeHovered(v3) {
  if (!v3 || typeof v3["matches"] !== "function") return false;
  try {
    return v3["matches"](":hover");
  } catch {
    return false;
  }
}
export function isCanvasLowZoomActive(v4 = globalThis["document"]) {
  return !!v4?.["body"]?.["classList"]?.["contains"](LOW_ZOOM_BODY_CLASS);
}
function isNodeMediaLodThumbActive({
  nodeId: nodeId = "",
  rootEl: rootEl = null,
  documentRef: documentRef = globalThis["document"],
} = {}) {
  const v5 = getNodeElement({
      nodeId: nodeId,
      rootEl: rootEl,
      documentRef: documentRef,
    }),
    v6 = String(v5?.["dataset"]?.[MEDIA_LOD_MODE_ATTR] || "")["trim"]();
  if (v6) return v6 === MEDIA_LOD_MODE_THUMB;
  return isCanvasLowZoomActive(documentRef);
}
export function isNodePromotedForFullImage({
  nodeId: nodeId = "",
  rootEl: rootEl = null,
  store: store = null,
  documentRef: documentRef = globalThis["document"],
} = {}) {
  const v7 = String(nodeId || "")["trim"](),
    v8 = getStateSnapshot(store),
    v9 = Array["isArray"](v8?.["selectedNodeIds"]) ? v8["selectedNodeIds"] : [];
  if (v7 && v9["some"]((v10) => String(v10 || "") === v7)) return true;
  const v11 = getNodeElement({
    nodeId: v7,
    rootEl: rootEl,
    documentRef: documentRef,
  });
  if (!v11) return false;
  if (isNodeHovered(v11)) return true;
  return PROMOTED_NODE_CLASSES["some"]((v12) =>
    v11["classList"]?.["contains"](v12),
  );
}
export function shouldUseLowZoomImageThumbnail({
  nodeId: nodeId = "",
  rootEl: rootEl = null,
  store: store = null,
  documentRef: documentRef = globalThis["document"],
} = {}) {
  if (
    !isNodeMediaLodThumbActive({
      nodeId: nodeId,
      rootEl: rootEl,
      documentRef: documentRef,
    })
  )
    return false;
  return !isNodePromotedForFullImage({
    nodeId: nodeId,
    rootEl: rootEl,
    store: store,
    documentRef: documentRef,
  });
}
export function pickImageLodUrl({
  mainUrl: mainUrl = "",
  thumbUrl: thumbUrl = "",
  lowZoomThumbnail: lowZoomThumbnail = false,
} = {}) {
  const v13 = String(mainUrl || "")["trim"](),
    v14 = String(thumbUrl || "")["trim"]();
  if (lowZoomThumbnail && v14)
    return { url: v14, lod: v14 && v14 !== v13 ? "thumb" : "full" };
  return { url: v13 || v14, lod: "full" };
}
