const GENERATION_NODE_TYPES = ["ai-image", "ai-text", "ai-video", "ai-audio"],
  IMAGE_RESULT_FIELDS = [
    "src",
    "url",
    "imageUrl",
    "sourceUrl",
    "resultUrl",
    "thumbUrl",
    "localPath",
    "originalLocalPath",
    "displayLocalPath",
    "thumbLocalPath",
    "thumbId",
  ],
  VIDEO_RESULT_FIELDS = [
    "src",
    "url",
    "videoUrl",
    "sourceUrl",
    "resultUrl",
    "videoLocalPath",
    "localPath",
    "originalLocalPath",
    "displayLocalPath",
    "thumbId",
    "thumbUrl",
    "posterUrl",
    "posterLocalPath",
    "thumbLocalPath",
    "videoThumbSrc",
    "videoMetaSrc",
  ],
  AUDIO_RESULT_FIELDS = ["audioUrl", "url", "src", "resultUrl", "localPath"];
function matchesNodeType(v0, v1, v2) {
  if (typeof v2 === "function") return v2(v0, v1);
  return String(v0?.["type"] || "") === v1;
}
function hasStringValue(v3) {
  return String(v3 || "")["trim"]()["length"] > 0;
}
function hasAnyField(v4, v5) {
  if (!v4 || typeof v4 !== "object") return false;
  return v5["some"]((v6) => hasStringValue(v4[v6]));
}
function hasAnyResultItem(v7, v8) {
  if (!Array["isArray"](v7)) return false;
  return v7["some"]((v9) => hasAnyField(v9, v8));
}
export function hasDisplayableImageResult(v10) {
  return (
    hasAnyField(v10, IMAGE_RESULT_FIELDS) ||
    hasAnyResultItem(v10?.["images"], IMAGE_RESULT_FIELDS)
  );
}
export function hasDisplayableVideoResult(v11) {
  return (
    hasAnyField(v11, VIDEO_RESULT_FIELDS) ||
    hasAnyResultItem(v11?.["videos"], VIDEO_RESULT_FIELDS)
  );
}
export function hasDisplayableAudioResult(v12) {
  return (
    hasAnyField(v12, AUDIO_RESULT_FIELDS) ||
    hasAnyResultItem(v12?.["audios"], AUDIO_RESULT_FIELDS)
  );
}
export function hasDisplayableNodeResult(v13, v14) {
  if (matchesNodeType(v13, "ai-image", v14))
    return hasDisplayableImageResult(v13);
  if (matchesNodeType(v13, "ai-text", v14))
    return hasStringValue(v13?.["outputText"]);
  if (matchesNodeType(v13, "ai-video", v14))
    return hasDisplayableVideoResult(v13);
  if (matchesNodeType(v13, "ai-audio", v14))
    return hasDisplayableAudioResult(v13);
  return false;
}
export function isNodeMissingResult(v15, v16) {
  if (
    !v15 ||
    !GENERATION_NODE_TYPES["some"]((v17) => matchesNodeType(v15, v17, v16))
  )
    return false;
  return !hasDisplayableNodeResult(v15, v16);
}
export function syncNodeResultClass(v18, v19, v20) {
  if (!v18?.["classList"]) return;
  isNodeMissingResult(v19, v20)
    ? v18["classList"]["add"]("no-result")
    : v18["classList"]["remove"]("no-result");
}
