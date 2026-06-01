import { getAutoMediaSizeByShortSide } from "./fileService.js";
import { localPathToUrl } from "../utils/localMediaPath.js";
export const OUTPUT_RATIO_SWITCH_THRESHOLD = 0.03;
function _toSafeNumber(v0) {
  const v1 = Number(v0);
  return Number["isFinite"](v1) ? v1 : 0;
}
function _normalizeDims(v2, v3) {
  const v4 = _toSafeNumber(v2),
    v5 = _toSafeNumber(v3);
  if (v4 <= 0 || v5 <= 0) return null;
  return {
    width: Math["max"](1, Math["round"](v4)),
    height: Math["max"](1, Math["round"](v5)),
  };
}
export function resolveInputRatioBasis(...v6) {
  for (const v7 of v6) {
    if (!v7 || typeof v7 !== "object") continue;
    const v8 = _normalizeDims(v7["width"], v7["height"]);
    if (v8) return { ...v8, valid: true };
  }
  return { width: 1, height: 1, valid: false };
}
export function calcDisplaySizeByMedia(v9, v10) {
  const v11 = resolveInputRatioBasis({ width: v9, height: v10 });
  return getAutoMediaSizeByShortSide(v11["width"], v11["height"]);
}
export function shouldSwitchToOutputRatio(
  v12,
  v13,
  v14,
  v15,
  v16 = OUTPUT_RATIO_SWITCH_THRESHOLD,
) {
  const v17 = _normalizeDims(v12, v13),
    v18 = _normalizeDims(v14, v15),
    v19 = Math["max"](0, _toSafeNumber(v16));
  if (!v17 || !v18) return false;
  const v20 = v17["width"] / v17["height"],
    v21 = v18["width"] / v18["height"];
  if (!Number["isFinite"](v20) || !Number["isFinite"](v21) || v20 <= 0)
    return false;
  const v22 = Math["abs"](v21 - v20) / v20;
  return v22 > v19;
}
export function normalizePathToLocalUrl(v23) {
  const v24 = String(v23 || "")["trim"]();
  if (!v24) return "";
  if (
    v24["startsWith"]("http://") ||
    v24["startsWith"]("https://") ||
    v24["startsWith"]("blob:") ||
    v24["startsWith"]("data:")
  )
    return v24;
  return localPathToUrl(v24);
}
export async function readImageNaturalSize(v25) {
  const v26 = String(v25 || "")["trim"]();
  if (!v26) return null;
  if (typeof Image === "undefined") return null;
  return new Promise((v27) => {
    const v28 = new Image();
    ((v28["crossOrigin"] = "anonymous"),
      (v28["onload"] = () => {
        const v29 = _normalizeDims(
          v28["naturalWidth"] || v28["width"],
          v28["naturalHeight"] || v28["height"],
        );
        v27(v29);
      }),
      (v28["onerror"] = () => v27(null)),
      (v28["src"] = v26));
  });
}
export async function resolveOutputMediaSize({
  localPath: localPath = "",
  imageUrl: imageUrl = "",
  sourceUrl: sourceUrl = "",
  thumbUrl: thumbUrl = "",
  src: src = "",
} = {}) {
  const v30 = normalizePathToLocalUrl(localPath),
    v31 = [
      v30,
      String(imageUrl || "")["trim"](),
      String(sourceUrl || "")["trim"](),
      String(thumbUrl || "")["trim"](),
      String(src || "")["trim"](),
    ]["filter"](Boolean);
  for (const v32 of v31) {
    const v33 = await readImageNaturalSize(v32);
    if (v33) return v33;
  }
  return null;
}
