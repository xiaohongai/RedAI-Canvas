const VIDEO_COMPOSE_TYPES = new Set(["source-video", "video", "ai-video"]),
  AUDIO_COMPOSE_TYPES = new Set(["source-audio", "audio", "ai-audio"]),
  VIDEO_SOURCE_FIELDS = Object["freeze"]([
    "localPath",
    "src",
    "videoUrl",
    "url",
    "resultUrl",
  ]),
  AUDIO_SOURCE_FIELDS = Object["freeze"]([
    "localPath",
    "audioUrl",
    "src",
    "url",
    "resultUrl",
  ]);
function hasAnyMediaSource(v0, v1) {
  if (!v0) return false;
  return v1["some"]((v2) => String(v0?.[v2] || "")["trim"]());
}
export function getNodeMediaComposeKind(v3) {
  const v4 = String(v3?.["type"] || "")["trim"]();
  if (
    VIDEO_COMPOSE_TYPES["has"](v4) &&
    hasAnyMediaSource(v3, VIDEO_SOURCE_FIELDS)
  )
    return "video";
  if (
    AUDIO_COMPOSE_TYPES["has"](v4) &&
    hasAnyMediaSource(v3, AUDIO_SOURCE_FIELDS)
  )
    return "audio";
  return "";
}
export function getSelectedMediaComposeKind(v5 = {}, v6 = []) {
  const v7 = Array["isArray"](v6) ? v6 : [];
  if (v7["length"] < 2) return "";
  let v8 = "";
  for (const v9 of v7) {
    const v10 = getNodeMediaComposeKind(v5?.[v9]);
    if (!v10) return "";
    if (!v8) {
      v8 = v10;
      continue;
    }
    if (v8 !== v10) return "";
  }
  return v8;
}
export function getMediaComposeButtonLabel(v11) {
  if (v11 === "audio") return "合并音频";
  if (v11 === "video") return "合成视频";
  return "合成";
}
export function getOrderedMediaComposeIds(v12 = {}, v13 = [], v14 = {}) {
  const v15 = Array["isArray"](v13) ? v13["slice"]() : [],
    v16 = getSelectedMediaComposeKind(v12, v15);
  if (!v16) return [];
  const v17 = v15["filter"](
    (v18) => getNodeMediaComposeKind(v12?.[v18]) === v16,
  );
  if (v14?.["source"] === "shift") return v17;
  return v17["slice"]()["sort"]((v19, v20) => {
    const v21 = v12?.[v19],
      v22 = v12?.[v20],
      v23 = Number(v21?.["x"]) || 0,
      v24 = Number(v22?.["x"]) || 0;
    if (v23 !== v24) return v23 - v24;
    const v25 = Number(v21?.["y"]) || 0,
      v26 = Number(v22?.["y"]) || 0;
    if (v25 !== v26) return v25 - v26;
    return String(v19)["localeCompare"](String(v20));
  });
}
