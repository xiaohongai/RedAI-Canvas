import {
  buildImageNodeStorageFields,
  pickCanvasImageLocalPath,
  pickCanvasThumbLocalPath,
  pickPreviewFallbackLocalPath,
  pickPreviewImageLocalPath,
  toLocalPathUrl,
} from "./imageDerivativeService.js";
import {
  isSafeVirtualLocalPath,
  localPathToUrl,
  normalizeLocalPath,
} from "../utils/localMediaPath.js";
const REMOTE_HTTP_RE = /^https?:\/\//i,
  IMAGE_NODE_TYPES = new Set(["source-image", "image", "ai-image"]),
  VIDEO_NODE_TYPES = new Set(["source-video", "video", "ai-video"]),
  AUDIO_NODE_TYPES = new Set(["source-audio", "audio", "ai-audio"]),
  IMAGE_TRIGGER_KEYS = [
    "src",
    "imageUrl",
    "sourceUrl",
    "thumbUrl",
    "url",
    "resultUrl",
    "localPath",
    "originalLocalPath",
    "displayLocalPath",
    "thumbLocalPath",
  ],
  VIDEO_TRIGGER_KEYS = [
    "src",
    "videoUrl",
    "thumbUrl",
    "url",
    "resultUrl",
    "localPath",
    "originalLocalPath",
    "displayLocalPath",
    "posterLocalPath",
    "videoThumbSrc",
    "videoMetaSrc",
  ],
  AUDIO_TRIGGER_KEYS = ["src", "audioUrl", "url", "resultUrl", "localPath"];
function hasOwn(v0, v1) {
  return !!v0 && Object["prototype"]["hasOwnProperty"]["call"](v0, v1);
}
function normalizeText(v2) {
  return String(v2 || "")["trim"]();
}
function firstNonEmptyString(...v3) {
  for (const v4 of v3) {
    const v5 = normalizeText(v4);
    if (v5) return v5;
  }
  return "";
}
function touchesAnyKey(v6, v7) {
  return Array["isArray"](v7) && v7["some"]((v8) => hasOwn(v6, v8));
}
function normalizeLocalUrlText(v9) {
  const v10 = normalizeCanvasLocalPath(v9);
  return localPathToUrl(v10);
}
function pickLocalPath(v11, v12) {
  for (const v13 of v12) {
    const v14 = normalizeCanvasLocalPath(v11?.[v13]);
    if (v14) return v14;
  }
  return "";
}
function copyCommonImageMeta(v15, v16) {
  if (hasOwn(v16, "assetId")) v15["assetId"] = normalizeText(v16["assetId"]);
  if (hasOwn(v16, "sourceId")) v15["sourceId"] = normalizeText(v16["sourceId"]);
  if (hasOwn(v16, "thumbId")) v15["thumbId"] = normalizeText(v16["thumbId"]);
  if (hasOwn(v16, "fileName")) v15["fileName"] = v16["fileName"];
  if (hasOwn(v16, "error")) v15["error"] = v16["error"];
  hasOwn(v16, "derivativeStatus") &&
    (v15["derivativeStatus"] = normalizeText(v16["derivativeStatus"]));
}
function copyCommonVideoMeta(v17, v18) {
  if (hasOwn(v18, "assetId")) v17["assetId"] = normalizeText(v18["assetId"]);
  if (hasOwn(v18, "fileName")) v17["fileName"] = v18["fileName"];
  if (hasOwn(v18, "thumbId")) v17["thumbId"] = normalizeText(v18["thumbId"]);
  hasOwn(v18, "videoProxyStatus") &&
    (v17["videoProxyStatus"] = normalizeText(v18["videoProxyStatus"]));
  if (hasOwn(v18, "videoCodec"))
    v17["videoCodec"] = normalizeText(v18["videoCodec"]);
  if (hasOwn(v18, "videoWidth"))
    v17["videoWidth"] = Number(v18["videoWidth"] || 0) || 0;
  if (hasOwn(v18, "videoHeight"))
    v17["videoHeight"] = Number(v18["videoHeight"] || 0) || 0;
  if (hasOwn(v18, "videoDuration"))
    v17["videoDuration"] = Number(v18["videoDuration"] || 0) || 0;
  if (hasOwn(v18, "videoFps"))
    v17["videoFps"] = Number(v18["videoFps"] || 0) || 0;
  hasOwn(v18, "derivativeStatus") &&
    (v17["derivativeStatus"] = normalizeText(v18["derivativeStatus"]));
}
function buildNormalizedImageStorage(v19 = {}) {
  const v20 = pickLocalPath(v19, [
      "localPath",
      "originalLocalPath",
      "displayLocalPath",
      "imageUrl",
      "sourceUrl",
      "src",
      "url",
      "resultUrl",
    ]),
    v21 = pickLocalPath(v19, [
      "originalLocalPath",
      "localPath",
      "sourceUrl",
      "imageUrl",
      "src",
      "url",
      "resultUrl",
    ]),
    v22 = pickLocalPath(v19, [
      "displayLocalPath",
      "imageUrl",
      "src",
      "url",
      "resultUrl",
    ]),
    v23 = pickLocalPath(v19, ["thumbLocalPath", "thumbUrl"]);
  return buildImageNodeStorageFields({
    ...v19,
    localPath: v20,
    originalLocalPath: v21,
    displayLocalPath: v22,
    thumbLocalPath: v23,
  });
}
export function resolveCanvasImageSourceUrl(v24 = {}) {
  const v25 = buildNormalizedImageStorage(v24),
    v26 =
      pickPreviewImageLocalPath(v25) ||
      v25["originalLocalPath"] ||
      v25["localPath"];
  return toLocalPathUrl(v26);
}
function resolveCanvasImageDisplayPath(v27 = {}) {
  return pickCanvasImageLocalPath(buildNormalizedImageStorage(v27));
}
function resolveCanvasImageThumbPath(v28 = {}) {
  return pickCanvasThumbLocalPath(buildNormalizedImageStorage(v28));
}
export function isRemoteHttpUrl(v29) {
  return REMOTE_HTTP_RE["test"](normalizeText(v29));
}
export function normalizeCanvasLocalPath(v30) {
  return normalizeLocalPath(v30);
}
export function toCanvasLocalUrl(v31) {
  return localPathToUrl(v31);
}
export function resolveCanvasImageDisplayUrl(v32 = {}) {
  return toLocalPathUrl(resolveCanvasImageDisplayPath(v32));
}
export function resolveCanvasImageThumbUrl(v33 = {}) {
  return toLocalPathUrl(resolveCanvasImageThumbPath(v33));
}
export function resolveCanvasImageLowZoomUrl(v34 = {}) {
  return (
    resolveCanvasImageThumbUrl(v34) ||
    resolveCanvasImageDisplayUrl(v34) ||
    resolveCanvasImageSourceUrl(v34)
  );
}
export function resolveCanvasImagePreviewUrl(v35 = {}) {
  const v36 = buildNormalizedImageStorage(v35),
    v37 = firstNonEmptyString(
      pickPreviewImageLocalPath(v36),
      pickPreviewFallbackLocalPath(v36),
    );
  return toLocalPathUrl(v37);
}
export function resolveCanvasVideoLocalPath(v38 = {}) {
  const v39 = pickLocalPath(v38, ["displayLocalPath"]);
  if (v39) return v39;
  const v40 = normalizeText(v38?.["videoProxyStatus"]);
  if (v40 === "processing" || v40 === "waiting") return "";
  return pickLocalPath(v38, [
    "src",
    "videoUrl",
    "url",
    "resultUrl",
    "localPath",
  ]);
}
export function resolveCanvasVideoUrl(v41 = {}) {
  return toCanvasLocalUrl(resolveCanvasVideoLocalPath(v41));
}
export function resolveCanvasAudioLocalPath(v42 = {}) {
  return pickLocalPath(v42, [
    "localPath",
    "audioUrl",
    "src",
    "url",
    "resultUrl",
  ]);
}
export function resolveCanvasAudioUrl(v43 = {}) {
  return toCanvasLocalUrl(resolveCanvasAudioLocalPath(v43));
}
export function buildCanvasLocalImageFields(v44 = {}, v45 = {}) {
  const v46 = buildNormalizedImageStorage(v44),
    v47 = toLocalPathUrl(pickCanvasImageLocalPath(v46)),
    v48 = resolveCanvasImageSourceUrl(v46),
    v49 = toLocalPathUrl(pickCanvasThumbLocalPath(v46)),
    v50 = v45["includeSrc"] === true || hasOwn(v44, "src"),
    v51 = v45["includeCanonicalUrl"] === true || hasOwn(v44, "url"),
    v52 = v45["includeResultUrl"] === true || hasOwn(v44, "resultUrl"),
    v53 = {};
  (hasOwn(v44, "localPath") || v46["localPath"] || v46["originalLocalPath"]) &&
    ((v53["localPath"] = v46["localPath"] || ""),
    (v53["originalLocalPath"] = v46["originalLocalPath"] || ""));
  (hasOwn(v44, "displayLocalPath") || v46["displayLocalPath"]) &&
    (v53["displayLocalPath"] = v46["displayLocalPath"] || "");
  (hasOwn(v44, "thumbLocalPath") ||
    hasOwn(v44, "thumbUrl") ||
    v46["thumbLocalPath"]) &&
    (v53["thumbLocalPath"] = v46["thumbLocalPath"] || "");
  (touchesAnyKey(v44, [
    "imageUrl",
    "sourceUrl",
    "thumbUrl",
    "localPath",
    "originalLocalPath",
    "displayLocalPath",
    "thumbLocalPath",
    "src",
    "url",
    "resultUrl",
  ]) ||
    v47 ||
    v48 ||
    v49) &&
    ((v53["imageUrl"] = v47 || ""),
    (v53["sourceUrl"] = v48 || ""),
    (v53["thumbUrl"] = v49 || ""));
  if (v50) v53["src"] = v47 || "";
  if (v51) v53["url"] = v47 || "";
  if (v52) v53["resultUrl"] = v47 || "";
  return (copyCommonImageMeta(v53, v44), v53);
}
export function buildCanvasLocalVideoFields(v54 = {}, v55 = {}) {
  const v56 = pickLocalPath(v54, [
      "localPath",
      "originalLocalPath",
      "videoUrl",
      "src",
      "url",
      "resultUrl",
    ]),
    v57 = pickLocalPath(v54, ["originalLocalPath"]),
    v58 = pickLocalPath(v54, ["displayLocalPath"]),
    v59 = resolveCanvasVideoLocalPath(v54),
    v60 = toLocalPathUrl(v59),
    v61 = toCanvasLocalUrl(v54?.["thumbUrl"]),
    v62 = pickLocalPath(v54, ["posterLocalPath"]),
    v63 = toLocalPathUrl(v62),
    v64 = toCanvasLocalUrl(v54?.["videoThumbSrc"] || v59),
    v65 = v55["includeCanonicalUrl"] === true || hasOwn(v54, "url"),
    v66 = v55["includeResultUrl"] === true || hasOwn(v54, "resultUrl"),
    v67 = {};
  (hasOwn(v54, "localPath") ||
    hasOwn(v54, "videoUrl") ||
    hasOwn(v54, "src") ||
    hasOwn(v54, "url") ||
    hasOwn(v54, "resultUrl") ||
    hasOwn(v54, "displayLocalPath") ||
    v59) &&
    ((hasOwn(v54, "localPath") ||
      hasOwn(v54, "videoUrl") ||
      hasOwn(v54, "src") ||
      hasOwn(v54, "url") ||
      hasOwn(v54, "resultUrl") ||
      v56) &&
      (v67["localPath"] = v56 || ""),
    (hasOwn(v54, "originalLocalPath") || v57) &&
      (v67["originalLocalPath"] = v57 || ""),
    (hasOwn(v54, "displayLocalPath") || v58) &&
      (v67["displayLocalPath"] = v58 || ""),
    (v67["videoUrl"] = v60 || ""),
    (v67["src"] = v60 || ""));
  (hasOwn(v54, "thumbUrl") || v61) && (v67["thumbUrl"] = v61 || v63 || "");
  if (hasOwn(v54, "posterLocalPath") || v62) {
    v67["posterLocalPath"] = v62 || "";
    if (!v67["thumbUrl"]) v67["thumbUrl"] = v63 || "";
  }
  hasOwn(v54, "videoThumbSrc") && (v67["videoThumbSrc"] = v64 || "");
  hasOwn(v54, "videoMetaSrc") &&
    (v67["videoMetaSrc"] = toCanvasLocalUrl(v54["videoMetaSrc"] || v59));
  if (v65) v67["url"] = v60 || "";
  if (v66) v67["resultUrl"] = v60 || "";
  return (copyCommonVideoMeta(v67, v54), v67);
}
export function buildCanvasLocalAudioFields(v68 = {}, v69 = {}) {
  const v70 = resolveCanvasAudioLocalPath(v68),
    v71 = toLocalPathUrl(v70),
    v72 = pickLocalPath(v68, ["waveformLocalPath"]),
    v73 = v69["includeCanonicalUrl"] === true || hasOwn(v68, "url"),
    v74 = v69["includeResultUrl"] === true || hasOwn(v68, "resultUrl"),
    v75 = {};
  (hasOwn(v68, "localPath") ||
    hasOwn(v68, "audioUrl") ||
    hasOwn(v68, "src") ||
    hasOwn(v68, "url") ||
    hasOwn(v68, "resultUrl") ||
    v70) &&
    ((v75["localPath"] = v70 || ""),
    (v75["audioUrl"] = v71 || ""),
    (v75["src"] = v71 || ""));
  if (v73) v75["url"] = v71 || "";
  if (v74) v75["resultUrl"] = v71 || "";
  (hasOwn(v68, "waveformLocalPath") || v72) &&
    (v75["waveformLocalPath"] = v72 || "");
  if (hasOwn(v68, "assetId")) v75["assetId"] = normalizeText(v68["assetId"]);
  hasOwn(v68, "derivativeStatus") &&
    (v75["derivativeStatus"] = normalizeText(v68["derivativeStatus"]));
  if (hasOwn(v68, "fileName")) v75["fileName"] = v68["fileName"];
  return v75;
}
function normalizeImageCollection(v76) {
  if (!Array["isArray"](v76)) return v76;
  return v76["map"]((v77) => {
    if (!v77 || typeof v77 !== "object") return v77;
    return {
      ...v77,
      ...buildCanvasLocalImageFields(v77, {
        includeSrc: hasOwn(v77, "src"),
        includeCanonicalUrl: hasOwn(v77, "url"),
        includeResultUrl: hasOwn(v77, "resultUrl"),
      }),
    };
  });
}
function normalizeVideoCollection(v78) {
  if (!Array["isArray"](v78)) return v78;
  return v78["map"]((v79) => {
    if (!v79 || typeof v79 !== "object") return v79;
    return {
      ...v79,
      ...buildCanvasLocalVideoFields(v79, {
        includeCanonicalUrl: hasOwn(v79, "url"),
        includeResultUrl: hasOwn(v79, "resultUrl"),
      }),
    };
  });
}
function validateUrlField(v80, v81) {
  const v82 = normalizeText(v81);
  if (!v82) return;
  if (normalizeLocalUrlText(v82) !== v82)
    throw new Error("[canvasMediaLocalService]\x20" + v80 + " 必须是本地 URL");
}
function validatePathField(v83, v84) {
  const v85 = normalizeText(v84);
  if (!v85) return;
  const v86 = normalizeCanvasLocalPath(v85);
  if (!v86 || !isSafeVirtualLocalPath(v86))
    throw new Error("[canvasMediaLocalService] " + v83 + " 必须是本地路径");
}
export function assertCanvasMediaPatchLocalOnly(v87 = {}) {
  if (!v87 || typeof v87 !== "object") return;
  const v88 = (v89) => {
    if (!v89 || typeof v89 !== "object") return;
    for (const v90 of [
      "src",
      "imageUrl",
      "sourceUrl",
      "thumbUrl",
      "videoUrl",
      "audioUrl",
      "url",
      "resultUrl",
      "videoThumbSrc",
      "videoMetaSrc",
    ]) {
      if (hasOwn(v89, v90)) validateUrlField(v90, v89[v90]);
    }
    for (const v91 of [
      "localPath",
      "originalLocalPath",
      "displayLocalPath",
      "thumbLocalPath",
      "posterLocalPath",
      "waveformLocalPath",
      "path",
    ]) {
      if (hasOwn(v89, v91)) validatePathField(v91, v89[v91]);
    }
  };
  v88(v87);
  if (Array["isArray"](v87["images"])) {
    for (const v92 of v87["images"]) v88(v92);
  }
  if (Array["isArray"](v87["videos"])) {
    for (const v93 of v87["videos"]) v88(v93);
  }
}
export function sanitizeCanvasNodeMediaPatchForStore(v94 = {}, v95 = null) {
  if (!v94 || typeof v94 !== "object" || Array["isArray"](v94)) return v94;
  const v96 = normalizeText(v94["type"] || v95?.["type"]),
    v97 = { ...v94 };
  hasOwn(v94, "images") &&
    (v97["images"] = normalizeImageCollection(v94["images"]));
  hasOwn(v94, "videos") &&
    (v97["videos"] = normalizeVideoCollection(v94["videos"]));
  const v98 =
    hasOwn(v94, "images") ||
    touchesAnyKey(v94, IMAGE_TRIGGER_KEYS) ||
    (IMAGE_NODE_TYPES["has"](v96) &&
      touchesAnyKey(v94, ["src", "localPath", "fileName"]));
  v98 &&
    Object["assign"](
      v97,
      buildCanvasLocalImageFields(v94, {
        includeSrc: hasOwn(v94, "src") || IMAGE_NODE_TYPES["has"](v96),
        includeCanonicalUrl: hasOwn(v94, "url"),
        includeResultUrl: hasOwn(v94, "resultUrl"),
      }),
    );
  const v99 =
    hasOwn(v94, "videos") ||
    touchesAnyKey(v94, [
      "videoUrl",
      "videoThumbSrc",
      "videoMetaSrc",
      "posterLocalPath",
      "videoProxyStatus",
    ]) ||
    (VIDEO_NODE_TYPES["has"](v96) && touchesAnyKey(v94, VIDEO_TRIGGER_KEYS));
  v99 &&
    Object["assign"](
      v97,
      buildCanvasLocalVideoFields(v94, {
        includeCanonicalUrl: hasOwn(v94, "url"),
        includeResultUrl: hasOwn(v94, "resultUrl"),
      }),
    );
  const v100 =
    hasOwn(v94, "audioUrl") ||
    (AUDIO_NODE_TYPES["has"](v96) &&
      touchesAnyKey(v94, [
        "src",
        "localPath",
        "waveformLocalPath",
        "fileName",
      ]));
  return (
    v100 &&
      Object["assign"](
        v97,
        buildCanvasLocalAudioFields(v94, {
          includeCanonicalUrl: hasOwn(v94, "url"),
          includeResultUrl: hasOwn(v94, "resultUrl"),
        }),
      ),
    v97
  );
}
