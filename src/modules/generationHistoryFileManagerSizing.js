import {
  getAutoMediaSizeByShortSide,
  getNodeDefaultSize,
} from "../services/fileService.js";
function pickPositiveNumber(...v0) {
  for (const v1 of v0) {
    const v2 = Number(v1 || 0);
    if (Number["isFinite"](v2) && v2 > 0) return v2;
  }
  return 0;
}
function getSourceMediaNodeNaturalSize(v3, v4) {
  if (!v3 || typeof v3 !== "object") return { width: 0, height: 0 };
  if (v4 === "source-video")
    return {
      width: pickPositiveNumber(
        v3["videoWidth"],
        v3["originalWidth"],
        v3["imageWidth"],
        v3["width"],
        v3["w"],
      ),
      height: pickPositiveNumber(
        v3["videoHeight"],
        v3["originalHeight"],
        v3["imageHeight"],
        v3["height"],
        v3["h"],
      ),
    };
  if (v4 === "source-image")
    return {
      width: pickPositiveNumber(
        v3["originalWidth"],
        v3["imageWidth"],
        v3["videoWidth"],
        v3["width"],
        v3["w"],
      ),
      height: pickPositiveNumber(
        v3["originalHeight"],
        v3["imageHeight"],
        v3["videoHeight"],
        v3["height"],
        v3["h"],
      ),
    };
  return { width: 0, height: 0 };
}
export function normalizeFileManagerSourceNodeForCanvas(v5 = {}) {
  const v6 = String(v5?.["type"] || "")["trim"]();
  if (v6 !== "source-image" && v6 !== "source-video") return { ...v5 };
  const v7 = getSourceMediaNodeNaturalSize(v5, v6),
    v8 =
      v7["width"] > 0 && v7["height"] > 0
        ? getAutoMediaSizeByShortSide(v7["width"], v7["height"])
        : getNodeDefaultSize(v6);
  return {
    ...v5,
    width: v8["width"],
    height: v8["height"],
    needsAutoResize: false,
  };
}
