import { isNodeType } from "../modules/registry.js";
import { getNodeMediaLodMode } from "./rendererNodeMediaLod.js";
export function buildRendererNodeSignature({
  node: v0,
  inEdgeSig: inEdgeSig = "",
  pickMode: pickMode = null,
  isSelected: isSelected = false,
  isSelectionRelated: isSelectionRelated = false,
  showVideoMeta: showVideoMeta = false,
  viewport: viewport = null,
} = {}) {
  void isSelectionRelated;
  const v1 = v0 || {},
    v2 =
      pickMode && pickMode["active"] && pickMode["sourceNodeId"] === v1["id"]
        ? "1"
        : "0",
    v3 = isSelected ? "1" : "0",
    v4 = typeof v1["_bizRev"] === "number" ? v1["_bizRev"] : 0,
    v5 =
      isNodeType(v1, ["source-video", "ai-video"]) && showVideoMeta === true
        ? "1"
        : "0",
    v6 = getNodeMediaLodMode(v1, viewport);
  return v4 + "|" + inEdgeSig + "|" + v2 + "|" + v3 + "|" + v5 + "|" + v6;
}
