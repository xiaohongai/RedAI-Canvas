import { isNodeType } from "../modules/registry.js";
import {
  CANVAS_LOW_ZOOM_LOD_THRESHOLD,
  MEDIA_LOD_MODE_ATTR,
  MEDIA_LOD_MODE_FULL,
  MEDIA_LOD_MODE_THUMB,
} from "../modules/canvasImageLod.js";
export function getNodeMediaLodMode(v0, v1) {
  if (!isNodeType(v0, ["source-image", "ai-image"])) return "";
  const v2 = Number["isFinite"](v1?.["zoom"]) ? v1["zoom"] : 1;
  return v2 <= CANVAS_LOW_ZOOM_LOD_THRESHOLD
    ? MEDIA_LOD_MODE_THUMB
    : MEDIA_LOD_MODE_FULL;
}
export function syncNodeMediaLodMode(v3, v4, v5) {
  if (!v3?.["dataset"]) return "";
  const v6 = getNodeMediaLodMode(v4, v5);
  if (!v6)
    return (
      MEDIA_LOD_MODE_ATTR in v3["dataset"] &&
        delete v3["dataset"][MEDIA_LOD_MODE_ATTR],
      ""
    );
  return (
    v3["dataset"][MEDIA_LOD_MODE_ATTR] !== v6 &&
      (v3["dataset"][MEDIA_LOD_MODE_ATTR] = v6),
    v6
  );
}
