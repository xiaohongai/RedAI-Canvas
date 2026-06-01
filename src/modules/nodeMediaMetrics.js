import { isNodeType } from "./registry.js";
export const NODE_MEDIA_DATASET_KEYS = Object["freeze"]({
  imageW: "mediaImageW",
  imageH: "mediaImageH",
  videoW: "mediaVideoW",
  videoH: "mediaVideoH",
  videoSrc: "mediaVideoSrc",
});
function toPositiveNumber(v0) {
  const v1 = Number(v0);
  return Number["isFinite"](v1) && v1 > 0 ? v1 : 0;
}
function toText(v2) {
  return String(v2 || "")["trim"]();
}
function firstText(...v3) {
  for (const v4 of v3) {
    const v5 = toText(v4);
    if (v5) return v5;
  }
  return "";
}
function pickMainItem(v6, v7) {
  if (!Array["isArray"](v6) || v6["length"] === 0) return null;
  const v8 = Number(v7),
    v9 = Number["isFinite"](v8) ? Math["max"](0, Math["trunc"](v8)) : 0;
  return v6[v9] || v6[0] || null;
}
function hasImageSource(v10) {
  return !!firstText(
    v10?.["localPath"],
    v10?.["displayLocalPath"],
    v10?.["originalLocalPath"],
    v10?.["imageUrl"],
    v10?.["sourceUrl"],
    v10?.["thumbLocalPath"],
    v10?.["thumbUrl"],
    v10?.["thumbId"],
    v10?.["src"],
    v10?.["url"],
  );
}
function hasVideoSource(v11) {
  return !!firstText(
    v11?.["localPath"],
    v11?.["displayLocalPath"],
    v11?.["originalLocalPath"],
    v11?.["videoLocalPath"],
    v11?.["videoUrl"],
    v11?.["resultUrl"],
    v11?.["sourceUrl"],
    v11?.["thumbLocalPath"],
    v11?.["posterLocalPath"],
    v11?.["thumbUrl"],
    v11?.["posterUrl"],
    v11?.["thumbId"],
    v11?.["src"],
    v11?.["url"],
  );
}
function resolveImageMetrics(v12) {
  if (!v12 || typeof v12 !== "object") return null;
  if (isNodeType(v12, "source-image")) {
    if (!hasImageSource(v12)) return null;
    const v13 =
        toPositiveNumber(v12["imageWidth"]) ||
        toPositiveNumber(v12["naturalWidth"]),
      v14 =
        toPositiveNumber(v12["imageHeight"]) ||
        toPositiveNumber(v12["naturalHeight"]);
    return v13 > 0 && v14 > 0 ? { w: v13, h: v14 } : null;
  }
  if (isNodeType(v12, "ai-image")) {
    const v15 = pickMainItem(v12["images"], v12["mainImageIndex"]) || v12;
    if (!hasImageSource(v15) && !hasImageSource(v12)) return null;
    const v16 =
        toPositiveNumber(v15?.["imageWidth"]) ||
        toPositiveNumber(v15?.["naturalWidth"]) ||
        toPositiveNumber(v15?.["width"]) ||
        toPositiveNumber(v12["imageWidth"]) ||
        toPositiveNumber(v12["naturalWidth"]),
      v17 =
        toPositiveNumber(v15?.["imageHeight"]) ||
        toPositiveNumber(v15?.["naturalHeight"]) ||
        toPositiveNumber(v15?.["height"]) ||
        toPositiveNumber(v12["imageHeight"]) ||
        toPositiveNumber(v12["naturalHeight"]);
    return v16 > 0 && v17 > 0 ? { w: v16, h: v17 } : null;
  }
  return null;
}
function resolveVideoMetrics(v18) {
  if (!v18 || typeof v18 !== "object") return null;
  if (isNodeType(v18, "source-video")) {
    if (!hasVideoSource(v18)) return null;
    const v19 =
        toPositiveNumber(v18["selectedVideoWidth"]) ||
        toPositiveNumber(v18["videoWidth"]) ||
        toPositiveNumber(v18["naturalWidth"]),
      v20 =
        toPositiveNumber(v18["selectedVideoHeight"]) ||
        toPositiveNumber(v18["videoHeight"]) ||
        toPositiveNumber(v18["naturalHeight"]),
      v21 = firstText(
        v18["localPath"],
        v18["displayLocalPath"],
        v18["videoLocalPath"],
        v18["videoUrl"],
        v18["src"],
        v18["url"],
        v18["resultUrl"],
      );
    return v19 > 0 && v20 > 0 ? { w: v19, h: v20, src: v21 } : null;
  }
  if (isNodeType(v18, "ai-video")) {
    const v22 = pickMainItem(v18["videos"], v18["mainVideoIndex"]) || v18;
    if (!hasVideoSource(v22) && !hasVideoSource(v18)) return null;
    const v23 =
        toPositiveNumber(v18["selectedVideoWidth"]) ||
        toPositiveNumber(v22?.["videoWidth"]) ||
        toPositiveNumber(v22?.["width"]) ||
        toPositiveNumber(v18["videoWidth"]) ||
        toPositiveNumber(v18["naturalWidth"]),
      v24 =
        toPositiveNumber(v18["selectedVideoHeight"]) ||
        toPositiveNumber(v22?.["videoHeight"]) ||
        toPositiveNumber(v22?.["height"]) ||
        toPositiveNumber(v18["videoHeight"]) ||
        toPositiveNumber(v18["naturalHeight"]),
      v25 = firstText(
        v22?.["localPath"],
        v22?.["videoUrl"],
        v22?.["url"],
        v22?.["resultUrl"],
        v18["localPath"],
        v18["videoUrl"],
        v18["src"],
        v18["url"],
        v18["resultUrl"],
      );
    return v23 > 0 && v24 > 0 ? { w: v23, h: v24, src: v25 } : null;
  }
  return null;
}
export function resolveNodeDisplayedMediaMetrics(v26) {
  return { image: resolveImageMetrics(v26), video: resolveVideoMetrics(v26) };
}
function writeSize(v27, v28, v29, v30) {
  v30?.["w"] > 0 && v30?.["h"] > 0
    ? ((v27[v28] = String(Math["round"](v30["w"]))),
      (v27[v29] = String(Math["round"](v30["h"]))))
    : (delete v27[v28], delete v27[v29]);
}
export function syncNodeMediaMetricsDataset(v31, v32) {
  const v33 = v31?.["dataset"];
  if (!v33) return;
  const v34 = resolveNodeDisplayedMediaMetrics(v32);
  (writeSize(
    v33,
    NODE_MEDIA_DATASET_KEYS["imageW"],
    NODE_MEDIA_DATASET_KEYS["imageH"],
    v34["image"],
  ),
    writeSize(
      v33,
      NODE_MEDIA_DATASET_KEYS["videoW"],
      NODE_MEDIA_DATASET_KEYS["videoH"],
      v34["video"],
    ),
    v34["video"]?.["src"]
      ? (v33[NODE_MEDIA_DATASET_KEYS["videoSrc"]] = v34["video"]["src"])
      : delete v33[NODE_MEDIA_DATASET_KEYS["videoSrc"]]);
}
export function readNodeMediaMetricsDataset(v35, v36) {
  const v37 = v35?.["dataset"];
  if (!v37) return null;
  const v38 = NODE_MEDIA_DATASET_KEYS,
    v39 = String(v36 || "") === "video",
    v40 = toPositiveNumber(v37[v39 ? v38["videoW"] : v38["imageW"]]),
    v41 = toPositiveNumber(v37[v39 ? v38["videoH"] : v38["imageH"]]);
  if (!(v40 > 0 && v41 > 0)) return null;
  return { w: v40, h: v41, src: v39 ? toText(v37[v38["videoSrc"]]) : "" };
}
