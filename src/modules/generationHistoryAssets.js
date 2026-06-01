import { buildImageNodeStorageFields } from "../services/imageDerivativeService.js";
import { createStableSignature } from "../utils/stableSignature.js";
import {
  localPathToUrl,
  normalizeLocalPath as normalizeLocalPathImpl,
} from "../utils/localMediaPath.js";
export const GENERATION_HISTORY_CATEGORY = "出图历史";
export const GENERATION_HISTORY_KIND = "generation-history";
export const GENERATION_HISTORY_EVENT = "aicanvas:generation-history:add";
export const GENERATION_HISTORY_MEDIA_KINDS = Object["freeze"]({
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
});
function firstNonEmptyString(...v0) {
  for (const v1 of v0) {
    const v2 = String(v1 || "")["trim"]();
    if (v2) return v2;
  }
  return "";
}
function normalizeProjectId(v3) {
  return String(v3 || "")["trim"]() || "default_v2_project";
}
function normalizeCanvasId(v4) {
  return String(v4 || "")["trim"]() || "canvas_1";
}
function normalizeLocalPath(v5) {
  return normalizeLocalPathImpl(v5);
}
function toLocalUrl(v6) {
  return localPathToUrl(v6);
}
function hashString(v7) {
  const v8 = String(v7 || "");
  let v9 = 2166136261;
  for (let v10 = 0; v10 < v8["length"]; v10 += 1) {
    ((v9 ^= v8["charCodeAt"](v10)), (v9 = Math["imul"](v9, 16777619)));
  }
  return (v9 >>> 0)["toString"](36);
}
function sanitizeIdPart(v11) {
  return String(v11 || "")
    ["trim"]()
    ["replace"](/[\\/:*?"<>|\s]+/g, "_")
    ["replace"](/^_+|_+$/g, "")
    ["slice"](0, 64);
}
function pickImageLocalPath(v12 = {}) {
  return firstNonEmptyString(
    normalizeLocalPath(v12["localPath"]),
    normalizeLocalPath(v12["originalLocalPath"]),
    normalizeLocalPath(v12["displayLocalPath"]),
    normalizeLocalPath(v12["imageUrl"]),
    normalizeLocalPath(v12["sourceUrl"]),
    normalizeLocalPath(v12["url"]),
    normalizeLocalPath(v12["resultUrl"]),
  );
}
function pickVideoLocalPath(v13 = {}) {
  return firstNonEmptyString(
    normalizeLocalPath(v13["localPath"]),
    normalizeLocalPath(v13["originalLocalPath"]),
    normalizeLocalPath(v13["displayLocalPath"]),
    normalizeLocalPath(v13["videoUrl"]),
    normalizeLocalPath(v13["sourceUrl"]),
    normalizeLocalPath(v13["url"]),
    normalizeLocalPath(v13["resultUrl"]),
  );
}
function pickAudioLocalPath(v14 = {}) {
  return firstNonEmptyString(
    normalizeLocalPath(v14["localPath"]),
    normalizeLocalPath(v14["originalLocalPath"]),
    normalizeLocalPath(v14["displayLocalPath"]),
    normalizeLocalPath(v14["audioUrl"]),
    normalizeLocalPath(v14["sourceUrl"]),
    normalizeLocalPath(v14["url"]),
    normalizeLocalPath(v14["resultUrl"]),
  );
}
function pickImageDisplayUrl(v15 = {}) {
  return firstNonEmptyString(
    toLocalUrl(v15["displayLocalPath"]),
    toLocalUrl(v15["localPath"]),
    toLocalUrl(v15["originalLocalPath"]),
    toLocalUrl(v15["imageUrl"]),
    toLocalUrl(v15["sourceUrl"]),
    String(v15["imageUrl"] || "")["trim"](),
    String(v15["sourceUrl"] || "")["trim"](),
  );
}
function pickImageThumbUrl(v16 = {}) {
  return firstNonEmptyString(
    toLocalUrl(v16["thumbLocalPath"]),
    toLocalUrl(v16["displayLocalPath"]),
    toLocalUrl(v16["localPath"]),
    toLocalUrl(v16["thumbUrl"]),
    String(v16["thumbUrl"] || "")["trim"](),
  );
}
function pickVideoDisplayUrl(v17 = {}) {
  return firstNonEmptyString(
    toLocalUrl(v17["displayLocalPath"]),
    toLocalUrl(v17["localPath"]),
    toLocalUrl(v17["originalLocalPath"]),
    toLocalUrl(v17["videoUrl"]),
    toLocalUrl(v17["sourceUrl"]),
    String(v17["videoUrl"] || "")["trim"](),
    String(v17["sourceUrl"] || "")["trim"](),
    String(v17["url"] || "")["trim"](),
  );
}
function pickVideoThumbUrl(v18 = {}) {
  return firstNonEmptyString(
    toLocalUrl(v18["thumbLocalPath"]),
    toLocalUrl(v18["thumbUrl"]),
    String(v18["thumbUrl"] || "")["trim"](),
    toLocalUrl(v18["posterLocalPath"]),
    String(v18["posterUrl"] || "")["trim"](),
    toLocalUrl(v18["coverLocalPath"]),
    String(v18["coverUrl"] || "")["trim"](),
    toLocalUrl(v18["displayLocalPath"]),
    toLocalUrl(v18["localPath"]),
  );
}
function pickAudioDisplayUrl(v19 = {}) {
  return firstNonEmptyString(
    toLocalUrl(v19["displayLocalPath"]),
    toLocalUrl(v19["localPath"]),
    toLocalUrl(v19["originalLocalPath"]),
    toLocalUrl(v19["audioUrl"]),
    toLocalUrl(v19["sourceUrl"]),
    String(v19["audioUrl"] || "")["trim"](),
    String(v19["sourceUrl"] || "")["trim"](),
    String(v19["url"] || "")["trim"](),
  );
}
function hasUsableImageResult(v20 = {}) {
  if (!v20 || typeof v20 !== "object") return false;
  if (String(v20["error"] || "")["trim"]()) return false;
  return Boolean(
    firstNonEmptyString(
      v20["localPath"],
      v20["originalLocalPath"],
      v20["displayLocalPath"],
      v20["thumbLocalPath"],
      v20["imageUrl"],
      v20["sourceUrl"],
      v20["thumbUrl"],
      v20["sourceId"],
      v20["thumbId"],
    ),
  );
}
function hasUsableVideoResult(v21 = {}) {
  if (!v21 || typeof v21 !== "object") return false;
  if (String(v21["error"] || "")["trim"]()) return false;
  return Boolean(
    firstNonEmptyString(
      v21["localPath"],
      v21["originalLocalPath"],
      v21["displayLocalPath"],
      v21["thumbLocalPath"],
      v21["videoUrl"],
      v21["sourceUrl"],
      v21["thumbUrl"],
      v21["sourceId"],
      v21["thumbId"],
    ),
  );
}
function hasUsableAudioResult(v22 = {}) {
  if (!v22 || typeof v22 !== "object") return false;
  if (String(v22["error"] || "")["trim"]()) return false;
  return Boolean(
    firstNonEmptyString(
      v22["localPath"],
      v22["originalLocalPath"],
      v22["displayLocalPath"],
      v22["audioUrl"],
      v22["sourceUrl"],
      v22["sourceId"],
    ),
  );
}
function resolveNodeSize(v23 = {}, v24 = {}) {
  const v25 =
      Number(
        v23["originalWidth"] || v23["imageWidth"] || v24["imageWidth"] || 0,
      ) || 0,
    v26 =
      Number(
        v23["originalHeight"] || v23["imageHeight"] || v24["imageHeight"] || 0,
      ) || 0;
  if (v25 > 0 && v26 > 0) {
    const v27 = 260,
      v28 = v27 / Math["min"](v25, v26);
    return {
      width: Math["max"](120, Math["round"](v25 * v28)),
      height: Math["max"](120, Math["round"](v26 * v28)),
    };
  }
  return {
    width: Number(v24["width"] || 0) || 260,
    height: Number(v24["height"] || 0) || 260,
  };
}
function resolveVideoNodeSize(v29 = {}, v30 = {}) {
  const v31 =
      Number(v29["videoWidth"] || v29["width"] || v30["videoWidth"] || 0) || 0,
    v32 =
      Number(v29["videoHeight"] || v29["height"] || v30["videoHeight"] || 0) ||
      0;
  if (v31 > 0 && v32 > 0) {
    const v33 = 260,
      v34 = v33 / Math["min"](v31, v32);
    return {
      width: Math["max"](160, Math["round"](v31 * v34)),
      height: Math["max"](120, Math["round"](v32 * v34)),
    };
  }
  return {
    width: Number(v30["width"] || 0) || 512,
    height: Number(v30["height"] || 0) || 288,
  };
}
function resolveAudioNodeSize(v35 = {}) {
  return {
    width: Number(v35["width"] || 0) || 320,
    height: Number(v35["height"] || 0) || 140,
  };
}
export function buildGenerationHistoryFingerprint(v36 = {}) {
  const v37 = pickImageLocalPath(v36),
    v38 = createStableSignature(
      v37
        ? { kind: GENERATION_HISTORY_MEDIA_KINDS["IMAGE"], localPath: v37 }
        : {
            kind: GENERATION_HISTORY_MEDIA_KINDS["IMAGE"],
            imageUrl: String(v36["imageUrl"] || "")["trim"](),
            sourceUrl: String(v36["sourceUrl"] || "")["trim"](),
            thumbUrl: String(v36["thumbUrl"] || "")["trim"](),
            sourceId: String(v36["sourceId"] || "")["trim"](),
            thumbId: String(v36["thumbId"] || "")["trim"](),
          },
    );
  return hashString(v38);
}
export function buildGenerationHistoryMediaFingerprint(
  v39 = {},
  v40 = "image",
) {
  const v41 = String(v40 || "image")["trim"]() || "image",
    v42 =
      v41 === GENERATION_HISTORY_MEDIA_KINDS["VIDEO"]
        ? pickVideoLocalPath(v39)
        : v41 === GENERATION_HISTORY_MEDIA_KINDS["AUDIO"]
          ? pickAudioLocalPath(v39)
          : pickImageLocalPath(v39),
    v43 = createStableSignature(
      v42
        ? { kind: v41, localPath: v42 }
        : {
            kind: v41,
            imageUrl: String(v39["imageUrl"] || "")["trim"](),
            videoUrl: String(v39["videoUrl"] || "")["trim"](),
            audioUrl: String(v39["audioUrl"] || "")["trim"](),
            sourceUrl: String(v39["sourceUrl"] || "")["trim"](),
            thumbUrl: String(v39["thumbUrl"] || "")["trim"](),
            sourceId: String(v39["sourceId"] || "")["trim"](),
            thumbId: String(v39["thumbId"] || "")["trim"](),
          },
    );
  return hashString(v43);
}
export function isGenerationHistoryAsset(v44) {
  return String(v44?.["kind"] || "") === GENERATION_HISTORY_KIND;
}
export function isAssetVisibleInTab(v45, v46, v47) {
  const v48 = String(v46 || "")["trim"]();
  if (v48 === GENERATION_HISTORY_CATEGORY)
    return (
      isGenerationHistoryAsset(v45) &&
      normalizeProjectId(v45?.["projectId"]) === normalizeProjectId(v47)
    );
  if (isGenerationHistoryAsset(v45)) return false;
  return String(v45?.["category"] || "") === v48;
}
export function buildGenerationHistoryAsset({
  image: v49,
  nodeData: v50,
  projectId: v51,
  canvasId: v52,
  index: index = 0,
  now: now = Date["now"](),
} = {}) {
  if (!hasUsableImageResult(v49)) return null;
  const v53 = normalizeProjectId(v51),
    v54 = normalizeCanvasId(v52),
    v55 = buildGenerationHistoryFingerprint(v49),
    v56 = hashString(v53),
    v57 = hashString(v54),
    v58 = Math["max"](0, Math["trunc"](Number(index) || 0)),
    v59 = "gen-history-" + v56 + "-" + v57 + "-" + v55,
    v60 = buildImageNodeStorageFields(v49),
    v61 = v60["localPath"] || pickImageLocalPath(v49),
    v62 = pickImageDisplayUrl({ ...v49, ...v60 }),
    v63 = pickImageThumbUrl({ ...v49, ...v60 }),
    { width: v64, height: v65 } = resolveNodeSize(v49, v50),
    v66 = String(v50?.["id"] || "")["trim"](),
    v67 =
      String(v49?.["fileName"] || "")["trim"]() ||
      String(v61 || "")
        ["split"](/[\\/]/)
        ["pop"]() ||
      "出图历史\x20" + new Date(now)["toLocaleString"]("zh-CN"),
    v68 = {
      id: "source-image-history-" + v55,
      type: "source-image",
      name: v67,
      x: 0,
      y: 0,
      width: v64,
      height: v65,
      src: v62 || v63,
      imageUrl: v62 || v63,
      sourceUrl: v62 || v63,
      thumbUrl: v63,
      localPath: v61,
      ...v60,
      sourceId: String(v49?.["sourceId"] || "")["trim"](),
      thumbId: String(v49?.["thumbId"] || "")["trim"](),
      fileName: v67,
      needsAutoResize: true,
    },
    v69 = sanitizeIdPart(v53) || "project",
    v70 = sanitizeIdPart(v66) || "node",
    v71 = new Date(now)["toLocaleString"]("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  return {
    id: v59,
    kind: GENERATION_HISTORY_KIND,
    mediaKind: GENERATION_HISTORY_MEDIA_KINDS["IMAGE"],
    projectId: v53,
    canvasId: v54,
    sourceNodeId: v66,
    resultFingerprint: v55,
    name: "出图 " + v71,
    category: GENERATION_HISTORY_CATEGORY,
    coverUrl: v63 || v62,
    coverType: "image",
    items: [
      { type: "source-image", name: v67, thumbSrc: v63 || v62, nodeData: v68 },
    ],
    nodes: [v68],
    edges: [],
    model: String(v50?.["model"] || "")["trim"](),
    provider: String(v50?.["provider"] || "")["trim"](),
    prompt: String(v50?.["prompt"] || "")["trim"](),
    aspectRatio: String(v50?.["aspectRatio"] || "")["trim"](),
    imageSize: String(v50?.["imageSize"] || "")["trim"](),
    sourceIndex: v58,
    createdAt: Number(now) || Date["now"](),
    updatedAt: Number(now) || Date["now"](),
    metaKey: v69 + ":" + v70 + ":" + v55,
  };
}
export function buildVideoGenerationHistoryAsset({
  video: v72,
  nodeData: v73,
  projectId: v74,
  canvasId: v75,
  index: index = 0,
  now: now = Date["now"](),
} = {}) {
  if (!hasUsableVideoResult(v72)) return null;
  const v76 = normalizeProjectId(v74),
    v77 = normalizeCanvasId(v75),
    v78 = buildGenerationHistoryMediaFingerprint(v72, "video"),
    v79 = hashString(v76),
    v80 = hashString(v77),
    v81 = Math["max"](0, Math["trunc"](Number(index) || 0)),
    v82 = "gen-history-" + v79 + "-" + v80 + "-" + v78,
    v83 = pickVideoLocalPath(v72),
    v84 = pickVideoDisplayUrl(v72),
    v85 = pickVideoThumbUrl(v72),
    { width: v86, height: v87 } = resolveVideoNodeSize(v72, v73),
    v88 = String(v73?.["id"] || "")["trim"](),
    v89 =
      String(v72?.["fileName"] || "")["trim"]() ||
      String(v83 || v84 || "")
        ["split"](/[\\/]/)
        ["pop"]() ||
      "视频历史 " + new Date(now)["toLocaleString"]("zh-CN"),
    v90 = v84 || (v83 ? "/" + v83 : ""),
    v91 = {
      id: "source-video-history-" + v78,
      type: "source-video",
      name: v89,
      x: 0,
      y: 0,
      width: v86,
      height: v87,
      src: v90,
      videoUrl: v90,
      thumbUrl: v85,
      videoThumbSrc: v85,
      localPath: v83,
      sourceId: String(v72?.["sourceId"] || "")["trim"](),
      thumbId: String(v72?.["thumbId"] || "")["trim"](),
      fileName: v89,
      videoWidth:
        Number(v72?.["videoWidth"] || v72?.["width"] || 0) || undefined,
      videoHeight:
        Number(v72?.["videoHeight"] || v72?.["height"] || 0) || undefined,
      duration:
        Number(v72?.["duration"] || v72?.["videoDuration"] || 0) || undefined,
      needsAutoResize: true,
    },
    v92 = sanitizeIdPart(v76) || "project",
    v93 = sanitizeIdPart(v88) || "node",
    v94 = new Date(now)["toLocaleString"]("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  return {
    id: v82,
    kind: GENERATION_HISTORY_KIND,
    mediaKind: GENERATION_HISTORY_MEDIA_KINDS["VIDEO"],
    projectId: v76,
    canvasId: v77,
    sourceNodeId: v88,
    resultFingerprint: v78,
    name: "视频 " + v94,
    category: GENERATION_HISTORY_CATEGORY,
    coverUrl: v85 || v90,
    coverType: "video",
    items: [
      { type: "source-video", name: v89, thumbSrc: v85 || v90, nodeData: v91 },
    ],
    nodes: [v91],
    edges: [],
    model: String(v73?.["model"] || "")["trim"](),
    provider: String(v73?.["provider"] || "")["trim"](),
    prompt: String(v73?.["prompt"] || "")["trim"](),
    aspectRatio: String(v73?.["aspectRatio"] || "")["trim"](),
    videoSize: String(v73?.["videoSize"] || v73?.["resolution"] || "")[
      "trim"
    ](),
    duration: Number(v72?.["duration"] || v73?.["duration"] || 0) || undefined,
    sourceIndex: v81,
    createdAt: Number(now) || Date["now"](),
    updatedAt: Number(now) || Date["now"](),
    metaKey: v92 + ":" + v93 + ":" + v78,
  };
}
export function buildAudioGenerationHistoryAsset({
  audio: v95,
  nodeData: v96,
  projectId: v97,
  canvasId: v98,
  index: index = 0,
  now: now = Date["now"](),
} = {}) {
  if (!hasUsableAudioResult(v95)) return null;
  const v99 = normalizeProjectId(v97),
    v100 = normalizeCanvasId(v98),
    v101 = buildGenerationHistoryMediaFingerprint(v95, "audio"),
    v102 = hashString(v99),
    v103 = hashString(v100),
    v104 = Math["max"](0, Math["trunc"](Number(index) || 0)),
    v105 = "gen-history-" + v102 + "-" + v103 + "-" + v101,
    v106 = pickAudioLocalPath(v95),
    v107 = pickAudioDisplayUrl(v95),
    { width: v108, height: v109 } = resolveAudioNodeSize(v96),
    v110 = String(v96?.["id"] || "")["trim"](),
    v111 =
      String(v95?.["fileName"] || "")["trim"]() ||
      String(v106 || v107 || "")
        ["split"](/[\\/]/)
        ["pop"]() ||
      "声音历史 " + new Date(now)["toLocaleString"]("zh-CN"),
    v112 = {
      id: "source-audio-history-" + v101,
      type: "source-audio",
      name: v111,
      x: 0,
      y: 0,
      width: v108,
      height: v109,
      src: v107,
      audioUrl: v107,
      localPath: v106,
      fileName: v111,
      duration:
        Number(v95?.["duration"] || v95?.["audioDuration"] || 0) || undefined,
    },
    v113 = sanitizeIdPart(v99) || "project",
    v114 = sanitizeIdPart(v110) || "node",
    v115 = new Date(now)["toLocaleString"]("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  return {
    id: v105,
    kind: GENERATION_HISTORY_KIND,
    mediaKind: GENERATION_HISTORY_MEDIA_KINDS["AUDIO"],
    projectId: v99,
    canvasId: v100,
    sourceNodeId: v110,
    resultFingerprint: v101,
    name: "声音 " + v115,
    category: GENERATION_HISTORY_CATEGORY,
    coverUrl: "",
    coverType: "audio",
    items: [{ type: "source-audio", name: v111, thumbSrc: "", nodeData: v112 }],
    nodes: [v112],
    edges: [],
    model: String(v96?.["model"] || v96?.["audioWorkflowKey"] || "")["trim"](),
    provider: String(v96?.["provider"] || "")["trim"](),
    prompt: String(v96?.["prompt"] || "")["trim"](),
    audioWorkflowKey: String(v96?.["audioWorkflowKey"] || "")["trim"](),
    audioWorkflowLabel: String(v96?.["audioWorkflowLabel"] || "")["trim"](),
    duration: Number(v95?.["duration"] || v96?.["duration"] || 0) || undefined,
    sourceIndex: v104,
    createdAt: Number(now) || Date["now"](),
    updatedAt: Number(now) || Date["now"](),
    metaKey: v113 + ":" + v114 + ":" + v101,
  };
}
export function buildGenerationHistoryAssetsFromNode({
  images: v116,
  videos: v117,
  audios: v118,
  nodeData: v119,
  projectId: v120,
  canvasId: v121,
  now: now = Date["now"](),
} = {}) {
  const v122 = Array["isArray"](v116)
      ? v116
      : Array["isArray"](v119?.["images"])
        ? v119["images"]
        : [],
    v123 = Array["isArray"](v117)
      ? v117
      : Array["isArray"](v119?.["videos"])
        ? v119["videos"]
        : [],
    v124 = String(v119?.["type"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v125 = Array["isArray"](v118)
      ? v118
      : v124["includes"]("audio") &&
          firstNonEmptyString(v119?.["audioUrl"], v119?.["localPath"])
        ? [v119]
        : [];
  return [
    ...v122["map"]((v126, v127) =>
      buildGenerationHistoryAsset({
        image: v126,
        nodeData: v119,
        projectId: v120,
        canvasId: v121,
        index: v127,
        now: now + v127,
      }),
    ),
    ...v123["map"]((v128, v129) =>
      buildVideoGenerationHistoryAsset({
        video: v128,
        nodeData: v119,
        projectId: v120,
        canvasId: v121,
        index: v129,
        now: now + v122["length"] + v129,
      }),
    ),
    ...v125["map"]((v130, v131) =>
      buildAudioGenerationHistoryAsset({
        audio: v130,
        nodeData: v119,
        projectId: v120,
        canvasId: v121,
        index: v131,
        now: now + v122["length"] + v123["length"] + v131,
      }),
    ),
  ]["filter"](Boolean);
}
