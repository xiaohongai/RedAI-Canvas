import {
  resolveCanvasImagePreviewUrl,
  resolveCanvasImageThumbUrl,
} from "./canvasMediaLocalService.js";
function pickResultItem(v0, v1) {
  if (!Array["isArray"](v0) || v0["length"] === 0) return null;
  const v2 = Number(v1),
    v3 = Number["isFinite"](v2) ? Math["max"](0, Math["trunc"](v2)) : 0;
  return v0[Math["min"](v3, v0["length"] - 1)] || null;
}
function firstNonEmptyUrl(...v4) {
  for (const v5 of v4) {
    const v6 = String(v5 || "")["trim"]();
    if (v6) return v6;
  }
  return "";
}
export function resolveGenerationInputImageUrl(v7) {
  if (!v7 || typeof v7 !== "object") return "";
  if (String(v7["type"] || "") === "ai-image") {
    const v8 = pickResultItem(v7["images"], v7["mainImageIndex"]);
    return firstNonEmptyUrl(
      resolveCanvasImagePreviewUrl(v8),
      resolveCanvasImagePreviewUrl(v7),
      resolveCanvasImageThumbUrl(v8),
      resolveCanvasImageThumbUrl(v7),
    );
  }
  return firstNonEmptyUrl(
    resolveCanvasImagePreviewUrl(v7),
    resolveCanvasImageThumbUrl(v7),
  );
}
