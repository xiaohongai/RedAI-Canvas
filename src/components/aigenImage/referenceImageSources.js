import {
  resolveCanvasImageDisplayUrl,
  resolveCanvasImageSourceUrl,
  resolveCanvasImageThumbUrl,
} from "../../services/canvasMediaLocalService.js";
function resolveAiImagePrimaryItem(v0) {
  if (!v0 || String(v0["type"] || "") !== "ai-image") return null;
  const v1 = Array["isArray"](v0["images"]) ? v0["images"] : [];
  if (v1["length"] === 0) return null;
  const v2 = Number(v0["mainImageIndex"]),
    v3 = Number["isFinite"](v2) ? Math["max"](0, Math["trunc"](v2)) : 0;
  return v1[Math["min"](v3, v1["length"] - 1)] || null;
}
function firstNonEmptyUrl(...v4) {
  for (const v5 of v4) {
    const v6 = String(v5 || "")["trim"]();
    if (v6) return v6;
  }
  return "";
}
export function collectRefThumbIds(v7) {
  const v8 = [],
    v9 = (v10) => {
      const v11 = String(v10 || "")["trim"]();
      if (!v11 || v8["includes"](v11)) return;
      v8["push"](v11);
    },
    v12 = resolveAiImagePrimaryItem(v7);
  return (v9(v7?.["thumbId"]), v9(v12?.["thumbId"]), v8);
}
export function resolveRefImageRenderSources(v13, v14 = {}) {
  const v15 = resolveAiImagePrimaryItem(v13),
    v16 = String(v14?.["thumbBlobUrl"] || "")["trim"](),
    v17 = firstNonEmptyUrl(
      resolveCanvasImageThumbUrl(v13),
      resolveCanvasImageThumbUrl(v15),
      v16,
    ),
    v18 = firstNonEmptyUrl(
      resolveCanvasImageDisplayUrl(v13),
      resolveCanvasImageSourceUrl(v13),
      resolveCanvasImageDisplayUrl(v15),
      resolveCanvasImageSourceUrl(v15),
      v17,
    );
  return { thumbSrc: v17, previewSrc: v18 };
}
export function resolveRefImageCandidateUrls(v19) {
  const { thumbSrc: v20, previewSrc: v21 } = resolveRefImageRenderSources(v19),
    v22 = [v20, v21]["filter"](Boolean);
  return Array["from"](new Set(v22));
}
