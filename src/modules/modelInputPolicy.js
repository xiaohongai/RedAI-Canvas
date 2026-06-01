import {
  isDreaminaStyleVideoModel,
  normalizeDreaminaVideoRouteMode,
} from "./dreaminaVideoModelHelper.js";
import {
  PERSON_REPLACE_V3_MODEL_ID,
  PERSON_REPLACE_V21_MODEL_ID,
  QWEN_IMAGE_EDIT_MODEL_ID,
  getModelManifest,
  normalizeProviderId,
  resolveModelExecution,
  resolveModelProvider,
} from "../manifests/index.js";
export const INPUT_KIND_ORDER = Object["freeze"]([
  "text",
  "image",
  "video",
  "audio",
]);
export const INPUT_KIND_LABELS = Object["freeze"]({
  text: "文本",
  image: "图片",
  video: "视频",
  audio: "音频",
});
export const RH_PERSON_REPLACE_V21_MODEL = PERSON_REPLACE_V21_MODEL_ID;
export const RH_QWEN_IMAGE_EDIT_MODEL = QWEN_IMAGE_EDIT_MODEL_ID;
const HAPPYHORSE_BODY_RESOLVERS = new Set([
    "apimartHappyHorseVideo",
    "runninghubHappyHorseVideo",
  ]),
  SEEDANCE_2_BODY_RESOLVERS = new Set([
    "runninghubSeedance2Video",
    "volcengineSeedance2Video",
  ]),
  APIMART_WAN27_MODEL_ID = "apimart/wan2.7",
  APIMART_KLING_V3_OMNI_MODEL_ID = "apimart/kling-v3-omni",
  APIMART_VIDU_Q3_MODEL_ID = "apimart/viduq3",
  RH_PERSON_REPLACE_FIXED_IMAGE_SLOTS = Object["freeze"]([
    "replaceTarget",
    "replacedImage",
  ]),
  INPUT_TARGET_NODE_TYPES = new Set([
    "ai-image",
    "ai-video",
    "ai-audio",
    "ai-text",
    "group",
    "media-clip",
    "panorama-360",
    "panorama_360",
    "panorama360",
    "storyboard",
    "storyboard-script",
  ]);
function normalizeText(v0) {
  return String(v0 || "")["trim"]();
}
export function isRhPersonReplaceV3Model(v1) {
  return getModelManifest(v1)?.["modelId"] === PERSON_REPLACE_V3_MODEL_ID;
}
function hasExactPersonReplaceFixedImageSlotCapability(v2) {
  const v3 = v2?.["capabilities"]?.["fixedImageSlots"];
  return (
    Array["isArray"](v3) &&
    v3["length"] === RH_PERSON_REPLACE_FIXED_IMAGE_SLOTS["length"] &&
    v3["every"]((v4, v5) => v4 === RH_PERSON_REPLACE_FIXED_IMAGE_SLOTS[v5])
  );
}
function hasPersonReplaceFixedImageInputSlots(v6) {
  const v7 = v6?.["inputSlots"]?.["fixedSlots"];
  if (!Array["isArray"](v7)) return false;
  return RH_PERSON_REPLACE_FIXED_IMAGE_SLOTS["every"]((v8) =>
    v7["some"]((v9) => v9?.["id"] === v8 && v9?.["kind"] === "image"),
  );
}
function isDreaminaManifestOrModel(v10, v11 = "") {
  return resolveTargetProvider(v10, v11) === "dreamina";
}
function isHappyHorseVideoModel(v12, v13 = "") {
  const v14 =
      resolveModelExecution(v12, { providerHint: v13 }) ||
      resolveModelExecution(v12),
    v15 = normalizeText(
      v14?.["executionManifest"]?.["extensions"]?.["bodyResolver"],
    );
  return v15 && HAPPYHORSE_BODY_RESOLVERS["has"](v15);
}
function isSeedance2VideoModel(v16, v17 = "") {
  const v18 =
      resolveModelExecution(v16, { providerHint: v17 }) ||
      resolveModelExecution(v16),
    v19 = normalizeText(
      v18?.["executionManifest"]?.["extensions"]?.["bodyResolver"],
    );
  return v19 && SEEDANCE_2_BODY_RESOLVERS["has"](v19);
}
function isApimartWan27VideoModel(v20, v21 = "") {
  const v22 =
      resolveModelExecution(v20, { providerHint: v21 }) ||
      resolveModelExecution(v20),
    v23 = v22?.["modelManifest"] || getModelManifest(v20),
    v24 = normalizeText(v22?.["canonicalModelId"] || v23?.["modelId"] || v20);
  if (v24 !== APIMART_WAN27_MODEL_ID) return false;
  const v25 =
    normalizeProviderId(v23?.["provider"]) || resolveTargetProvider(v20, v21);
  return !v25 || v25 === "apimart";
}
function isApimartKlingV3OmniVideoModel(v26, v27 = "") {
  const v28 =
      resolveModelExecution(v26, { providerHint: v27 }) ||
      resolveModelExecution(v26),
    v29 = v28?.["modelManifest"] || getModelManifest(v26),
    v30 = normalizeText(v28?.["canonicalModelId"] || v29?.["modelId"] || v26);
  if (v30 !== APIMART_KLING_V3_OMNI_MODEL_ID) return false;
  const v31 =
    normalizeProviderId(v29?.["provider"]) || resolveTargetProvider(v26, v27);
  return !v31 || v31 === "apimart";
}
function isApimartViduQ3VideoModel(v32, v33 = "") {
  const v34 =
      resolveModelExecution(v32, { providerHint: v33 }) ||
      resolveModelExecution(v32),
    v35 = v34?.["modelManifest"] || getModelManifest(v32),
    v36 = normalizeText(v34?.["canonicalModelId"] || v35?.["modelId"] || v32);
  if (v36 !== APIMART_VIDU_Q3_MODEL_ID) return false;
  const v37 =
    normalizeProviderId(v35?.["provider"]) || resolveTargetProvider(v32, v33);
  return !v37 || v37 === "apimart";
}
function resolveTargetProvider(v38, v39 = "") {
  const v40 = normalizeProviderId(v39);
  if (v40) return v40;
  return (
    resolveModelProvider(v38, "", {
      allowProviderHint: false,
      allowPrefixInference: false,
    }) || normalizeProviderId(getModelManifest(v38)?.["provider"])
  );
}
export function isRhPersonReplaceWorkflowModel(v41) {
  const v42 = getModelManifest(v41);
  return (
    v42?.["kind"] === "image" &&
    hasExactPersonReplaceFixedImageSlotCapability(v42) &&
    hasPersonReplaceFixedImageInputSlots(v42)
  );
}
export function isRhQwenImageEditModel(v43) {
  return normalizeText(v43) === RH_QWEN_IMAGE_EDIT_MODEL;
}
const VIDEO_PATH_RE =
    /\.(?:mp4|mov|m4v|webm|mkv|avi|mpeg|mpg|3gp)(?:[?#].*)?$/i,
  AUDIO_PATH_RE = /\.(?:mp3|wav|m4a|aac|flac|ogg|opus|wma)(?:[?#].*)?$/i,
  IMAGE_PATH_RE = /\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif)(?:[?#].*)?$/i;
export function normalizeInputKind(v44) {
  const v45 =
    v44 && typeof v44 === "object"
      ? normalizeText(v44["type"])
      : normalizeText(v44);
  if (!v45) return "";
  if (v45 === "text" || v45 === "source-text" || v45 === "ai-text")
    return "text";
  if (v45 === "image" || v45 === "source-image" || v45 === "ai-image")
    return "image";
  if (v45 === "video" || v45 === "source-video" || v45 === "ai-video")
    return "video";
  if (v45 === "audio" || v45 === "source-audio" || v45 === "ai-audio")
    return "audio";
  if (v45["includes"]("text")) return "text";
  if (v45["includes"]("video")) return "video";
  if (v45["includes"]("audio")) return "audio";
  if (v45["includes"]("image")) return "image";
  return "";
}
function normalizeExplicitMediaKind(v46) {
  const v47 = normalizeText(v46)["toLowerCase"]();
  if (!v47) return "";
  if (v47 === "text" || v47 === "source-text" || v47 === "ai-text")
    return "text";
  if (
    v47 === "image" ||
    v47 === "source-image" ||
    v47 === "ai-image" ||
    v47 === "asset-image" ||
    v47["startsWith"]("image/")
  )
    return "image";
  if (
    v47 === "video" ||
    v47 === "source-video" ||
    v47 === "ai-video" ||
    v47 === "asset-video" ||
    v47["startsWith"]("video/")
  )
    return "video";
  if (
    v47 === "audio" ||
    v47 === "source-audio" ||
    v47 === "ai-audio" ||
    v47 === "asset-audio" ||
    v47["startsWith"]("audio/")
  )
    return "audio";
  return "";
}
function hasPathLikeValue(v48, v49, v50) {
  if (!v48 || typeof v48 !== "object") return false;
  return v49["some"]((v51) => v50(normalizeText(v48?.[v51])));
}
function isVideoPath(v52) {
  return VIDEO_PATH_RE["test"](normalizeText(v52));
}
function isAudioPath(v53) {
  return AUDIO_PATH_RE["test"](normalizeText(v53));
}
function isImagePath(v54) {
  return IMAGE_PATH_RE["test"](normalizeText(v54));
}
function hasExplicitKind(v55, v56) {
  if (!v55 || typeof v55 !== "object") return false;
  const v57 = [
    "kind",
    "mediaKind",
    "mediaTaskKind",
    "asyncTaskKind",
    "assetKind",
    "assetType",
    "mediaType",
    "mimeType",
  ];
  return v57["some"]((v58) => normalizeExplicitMediaKind(v55?.[v58]) === v56);
}
function hasVideoEvidence(v59 = {}, v60 = null) {
  if (!v59 || typeof v59 !== "object") return false;
  if (hasExplicitKind(v59, "video")) return true;
  const v61 = Array["isArray"](v59["videos"]) ? v59["videos"] : [];
  if (
    v61["some"](
      (v62) => getVideoSourceKey(v62) || hasExplicitKind(v62, "video"),
    )
  )
    return true;
  if (
    hasPathLikeValue(
      v59,
      [
        "videoUrl",
        "videoLocalPath",
        "originalVideoUrl",
        "localPath",
        "originalLocalPath",
        "displayLocalPath",
        "src",
        "url",
        "resultUrl",
        "sourceUrl",
      ],
      isVideoPath,
    )
  )
    return true;
  return hasPathLikeValue(
    v60,
    ["sourceMediaKey", "videoUrl", "localPath"],
    isVideoPath,
  );
}
function hasAudioEvidence(v63 = {}, v64 = null) {
  if (!v63 || typeof v63 !== "object") return false;
  if (hasExplicitKind(v63, "audio")) return true;
  if (Array["isArray"](v63["audios"]) && v63["audios"]["length"] > 0)
    return true;
  if (
    hasPathLikeValue(
      v63,
      [
        "audioUrl",
        "audioLocalPath",
        "localPath",
        "originalLocalPath",
        "displayLocalPath",
        "src",
        "url",
        "resultUrl",
        "sourceUrl",
      ],
      isAudioPath,
    )
  )
    return true;
  return hasPathLikeValue(
    v64,
    ["sourceMediaKey", "audioUrl", "localPath"],
    isAudioPath,
  );
}
function hasImageEvidence(v65 = {}, v66 = null) {
  if (!v65 || typeof v65 !== "object") return false;
  if (hasExplicitKind(v65, "image")) return true;
  if (Array["isArray"](v65["images"]) && v65["images"]["length"] > 0)
    return true;
  if (
    v65["thumbId"] ||
    v65["thumbUrl"] ||
    v65["imageUrl"] ||
    v65["posterLocalPath"]
  )
    return true;
  if (
    hasPathLikeValue(
      v65,
      [
        "imageUrl",
        "localPath",
        "originalLocalPath",
        "displayLocalPath",
        "src",
        "url",
        "resultUrl",
        "sourceUrl",
      ],
      isImagePath,
    )
  )
    return true;
  return hasPathLikeValue(
    v66,
    ["sourceMediaKey", "imageUrl", "localPath"],
    isImagePath,
  );
}
export function resolveEffectiveInputKind(v67, v68 = null) {
  if (!v67 || typeof v67 !== "object") return normalizeInputKind(v67);
  const v69 = normalizeInputKind(v67);
  if (hasVideoEvidence(v67, v68)) return "video";
  if (hasAudioEvidence(v67, v68)) return "audio";
  if (v69) return v69;
  if (hasImageEvidence(v67, v68)) return "image";
  return "";
}
function makePolicy(v70, v71 = {}) {
  const v72 = new Set(
    ["text", ...(Array["isArray"](v70) ? v70 : [])]
      ["map"]((v73) => normalizeInputKind(v73))
      ["filter"](Boolean),
  );
  return {
    allowedKinds: INPUT_KIND_ORDER["filter"]((v74) => v72["has"](v74)),
    maxByKind: { ...v71 },
  };
}
function makeManifestInputPolicy(v75) {
  if (!v75 || typeof v75 !== "object") return null;
  const v76 = Array["isArray"](v75["allowedKinds"]) ? v75["allowedKinds"] : [];
  return {
    allowedKinds: INPUT_KIND_ORDER["filter"]((v77) => v76["includes"](v77)),
    maxByKind: { ...(v75["maxByKind"] || {}) },
  };
}
function makeDreaminaStyleVideoPolicy(v78) {
  const v79 =
      v78?.["generationParams"] && typeof v78["generationParams"] === "object"
        ? v78["generationParams"]
        : {},
    v80 = normalizeDreaminaVideoRouteMode(
      v79["dreaminaRouteMode"] ?? v78?.["dreaminaRouteMode"],
      v78?.["mode"],
    );
  if (v80 === "frames2video")
    return makePolicy(["text", "image"], { image: 2, video: 0, audio: 0 });
  if (v80 === "multiframe2video")
    return makePolicy(["text", "image"], { image: 20, video: 0, audio: 0 });
  return makePolicy(["text", "image", "video", "audio"], {
    image: 9,
    video: 3,
    audio: 3,
  });
}
function normalizeHappyHorseVideoMode(v81) {
  const v82 = normalizeText(v81)["toLowerCase"]();
  return v82 === "image" || v82 === "reference" || v82 === "edit"
    ? v82
    : "auto";
}
function getHappyHorseVideoMode(v83 = {}) {
  const v84 =
    v83?.["generationParams"] && typeof v83["generationParams"] === "object"
      ? v83["generationParams"]
      : {};
  return normalizeHappyHorseVideoMode(
    v84["happyhorse_mode"] ?? v83?.["happyhorse_mode"],
  );
}
function makeHappyHorseVideoPolicy(v85) {
  const v86 = getHappyHorseVideoMode(v85);
  if (v86 === "image")
    return makePolicy(["text", "image"], { image: 1, video: 0, audio: 0 });
  if (v86 === "reference")
    return makePolicy(["text", "image"], { image: 9, video: 0, audio: 0 });
  if (v86 === "edit")
    return makePolicy(["text", "image", "video"], {
      image: 5,
      video: 1,
      audio: 0,
    });
  return makePolicy(["text"], { image: 0, video: 0, audio: 0 });
}
function normalizeSeedance2VideoMode(v87, v88 = "text2video") {
  const v89 = normalizeText(v87)["toLowerCase"]();
  if (v89 === "multimodal2video" || v89 === "reference")
    return "multimodal2video";
  if (v89 === "frames2video" || v89 === "frames") return "frames2video";
  if (v89 === "image2video" || v89 === "image" || v89 === "frame")
    return "image2video";
  if (v89 === "text2video" || v89 === "text") return "text2video";
  return v88 === "multimodal2video" ? "multimodal2video" : "text2video";
}
function getSeedance2VideoMode(v90 = {}) {
  const v91 =
      v90?.["generationParams"] && typeof v90["generationParams"] === "object"
        ? v90["generationParams"]
        : {},
    v92 = normalizeText(v90?.["provider"])["toLowerCase"](),
    v93 = normalizeText(v90?.["model"])["toLowerCase"](),
    v94 = v92 === "volcengine" || v93["startsWith"]("volcengine/");
  return normalizeSeedance2VideoMode(
    v91["rh_seedance_2_mode"] ??
      v91["volcengine_seedance_2_mode"] ??
      v90?.["rh_seedance_2_mode"] ??
      v90?.["volcengine_seedance_2_mode"],
    v94 ? "multimodal2video" : "text2video",
  );
}
function makeSeedance2VideoPolicy(v95) {
  const v96 = getSeedance2VideoMode(v95);
  if (v96 === "multimodal2video")
    return makePolicy(["text", "image", "video", "audio"], {
      image: 9,
      video: 3,
      audio: 3,
    });
  if (v96 === "frames2video")
    return makePolicy(["text", "image"], { image: 2, video: 0, audio: 0 });
  if (v96 === "image2video")
    return makePolicy(["text", "image"], { image: 1, video: 0, audio: 0 });
  return makePolicy(["text"], { image: 0, video: 0, audio: 0 });
}
function normalizeWan27VideoMode(v97) {
  const v98 = normalizeText(v97)["toLowerCase"]();
  return v98 === "video" || v98 === "reference" || v98 === "edit"
    ? v98
    : "image";
}
function getWan27VideoMode(v99 = {}) {
  const v100 =
    v99?.["generationParams"] && typeof v99["generationParams"] === "object"
      ? v99["generationParams"]
      : {};
  return normalizeWan27VideoMode(v100["wan27_mode"] ?? v99?.["wan27_mode"]);
}
function makeWan27VideoPolicy(v101) {
  const v102 = getWan27VideoMode(v101);
  if (v102 === "video")
    return makePolicy(["text", "video"], { image: 0, video: 1, audio: 0 });
  if (v102 === "reference")
    return makePolicy(["text", "image", "video", "audio"], {
      image: 1,
      video: 1,
      audio: 1,
    });
  if (v102 === "edit")
    return makePolicy(["text", "video"], { image: 0, video: 2, audio: 0 });
  return makePolicy(["text", "image", "audio"], {
    image: 2,
    video: 0,
    audio: 1,
  });
}
function normalizeKlingV3OmniVideoMode(v103) {
  const v104 = normalizeText(v103)["toLowerCase"]();
  return v104 === "reference" || v104 === "edit" ? v104 : "image";
}
function getKlingV3OmniVideoMode(v105 = {}) {
  const v106 =
    v105?.["generationParams"] && typeof v105["generationParams"] === "object"
      ? v105["generationParams"]
      : {};
  return normalizeKlingV3OmniVideoMode(
    v106["kling_v3_omni_mode"] ?? v105?.["kling_v3_omni_mode"],
  );
}
function makeKlingV3OmniVideoPolicy(v107) {
  const v108 = getKlingV3OmniVideoMode(v107);
  if (v108 === "reference")
    return makePolicy(["text", "image", "video"], {
      image: 1,
      video: 1,
      audio: 0,
    });
  if (v108 === "edit")
    return makePolicy(["text", "video"], { image: 0, video: 1, audio: 0 });
  return makePolicy(["text", "image"], { image: 2, video: 0, audio: 0 });
}
function normalizeViduQ3GenerationMode(v109) {
  const v110 = normalizeText(v109)["toLowerCase"]();
  return v110 === "reference" ? "reference" : "video";
}
function getViduQ3GenerationMode(v111 = {}) {
  const v112 =
    v111?.["generationParams"] && typeof v111["generationParams"] === "object"
      ? v111["generationParams"]
      : {};
  return normalizeViduQ3GenerationMode(
    v112["vidu_q3_generation_mode"] ?? v111?.["vidu_q3_generation_mode"],
  );
}
function makeViduQ3VideoPolicy(v113) {
  const v114 = getViduQ3GenerationMode(v113);
  return makePolicy(["text", "image"], {
    image: v114 === "reference" ? 7 : 2,
    video: 0,
    audio: 0,
  });
}
export function getTargetInputPolicy(v115 = {}) {
  const v116 = normalizeText(v115?.["type"]),
    v117 = normalizeText(v115?.["model"]),
    v118 = normalizeText(v115?.["provider"])["toLowerCase"](),
    v119 = normalizeText(v115?.["audioWorkflowKey"]);
  if (v116 === "ai-image") {
    const v120 = makeManifestInputPolicy(
      getModelManifest(v117)?.["inputSlots"],
    );
    if (v120) return v120;
    const v121 = isRhPersonReplaceWorkflowModel(v117)
      ? 2
      : isDreaminaManifestOrModel(v117, v118)
        ? 1
        : 9;
    return makePolicy(["text", "image"], { image: v121, video: 0, audio: 0 });
  }
  if (v116 === "ai-video") {
    if (isDreaminaStyleVideoModel(v117, v118))
      return makeDreaminaStyleVideoPolicy(v115);
    if (isHappyHorseVideoModel(v117, v118))
      return makeHappyHorseVideoPolicy(v115);
    if (isSeedance2VideoModel(v117, v118))
      return makeSeedance2VideoPolicy(v115);
    if (isApimartWan27VideoModel(v117, v118)) return makeWan27VideoPolicy(v115);
    if (isApimartKlingV3OmniVideoModel(v117, v118))
      return makeKlingV3OmniVideoPolicy(v115);
    if (isApimartViduQ3VideoModel(v117, v118))
      return makeViduQ3VideoPolicy(v115);
    const v122 = makeManifestInputPolicy(
      getModelManifest(v117)?.["inputSlots"],
    );
    if (v122) return v122;
    return makePolicy(["text", "image", "video"], { audio: 0 });
  }
  if (v116 === "ai-audio") {
    const v123 = makeManifestInputPolicy(
      getModelManifest(v119 || v117)?.["inputSlots"],
    );
    if (v123) return v123;
    return makePolicy(["text", "audio"], {
      image: 0,
      video: 0,
      audio: v119 === "voice_convert" ? 2 : 1,
    });
  }
  if (v116 === "ai-text") {
    const v124 = getModelManifest(v117),
      v125 =
        resolveTargetProvider(v117, v118) ||
        normalizeProviderId(v124?.["provider"]);
    if (v125 === "apimart")
      return makePolicy(["text", "image"], { video: 0, audio: 0 });
    return makePolicy(["text", "image", "video", "audio"], {});
  }
  if (v116 === "media-clip")
    return {
      allowedKinds: ["image", "video", "audio"],
      maxByKind: { text: 0 },
    };
  if (v116 === "storyboard" || v116 === "storyboard-script")
    return makePolicy(["text", "image", "video"], { audio: 0 });
  return makePolicy(["text", "image", "video", "audio"], {});
}
export function canTargetReceiveInputs(v126 = {}) {
  return INPUT_TARGET_NODE_TYPES["has"](normalizeText(v126?.["type"]));
}
function getVideoSourceKey(v127) {
  if (!v127 || typeof v127 !== "object") return "";
  return (
    normalizeText(v127["localPath"]) ||
    normalizeText(v127["displayLocalPath"]) ||
    normalizeText(v127["originalLocalPath"]) ||
    normalizeText(v127["videoLocalPath"]) ||
    normalizeText(v127["videoUrl"]) ||
    normalizeText(v127["src"]) ||
    normalizeText(v127["url"]) ||
    normalizeText(v127["resultUrl"]) ||
    normalizeText(v127["sourceUrl"])
  );
}
function isUnavailableVideoRecord(v128) {
  const v129 = getVideoSourceKey(v128);
  if (!v129) return false;
  return (
    v128?.["mediaUnavailable"] === true &&
    normalizeText(v128?.["mediaUnavailableSource"]) === v129
  );
}
export function hasUsableInputNodeSource(v130 = {}, v131 = {}) {
  const v132 = v131?.["edge"] || v131 || null,
    v133 =
      normalizeInputKind(v131?.["kind"]) ||
      resolveEffectiveInputKind(v130, v132);
  if (!v133) return false;
  if (v133 !== "video") return true;
  const v134 = Array["isArray"](v130?.["videos"]) ? v130["videos"] : [];
  if (
    v134["some"](
      (v135) => getVideoSourceKey(v135) && !isUnavailableVideoRecord(v135),
    )
  )
    return true;
  if (getVideoSourceKey(v130) && !isUnavailableVideoRecord(v130)) return true;
  const v136 = isVideoPath(v132?.["sourceMediaKey"])
    ? normalizeText(v132?.["sourceMediaKey"])
    : "";
  return Boolean(v136);
}
export function isInputNodeCompatibleWithTarget(
  v137 = {},
  v138 = {},
  v139 = null,
) {
  if (!canTargetReceiveInputs(v138)) return false;
  const v140 = resolveEffectiveInputKind(v137, v139);
  if (!v140) return false;
  if (!isInputKindAllowed(getTargetInputPolicy(v138), v140)) return false;
  return hasUsableInputNodeSource(v137, { edge: v139, kind: v140 });
}
export function canAppendInputKindWithinLimit(v141, v142, v143 = {}) {
  const v144 = normalizeInputKind(v142);
  if (!v144) return false;
  if (!isInputKindAllowed(v141, v144)) return false;
  const v145 = Number(v141?.["maxByKind"]?.[v144]);
  if (!Number["isFinite"](v145)) return true;
  if (v145 <= 0) return false;
  return Number(v143?.[v144] || 0) < v145;
}
export function isInputKindAllowed(v146, v147) {
  const v148 = normalizeInputKind(v147);
  if (!v148) return false;
  const v149 = Array["isArray"](v146?.["allowedKinds"])
    ? v146["allowedKinds"]
    : INPUT_KIND_ORDER;
  return v149["includes"](v148);
}
export function getInputLimitReason(v150, v151, v152 = {}) {
  const v153 = normalizeInputKind(v151);
  if (!v153) return "";
  if (!isInputKindAllowed(v150, v153)) return "当前模型不支持这种素材";
  const v154 = Number(v150?.["maxByKind"]?.[v153]);
  if (!Number["isFinite"](v154)) return "";
  if (v154 <= 0) return "当前模型不支持这种素材";
  const v155 = Number(v152?.[v153] || 0);
  if (v155 < v154) return "";
  const v156 = INPUT_KIND_LABELS[v153] || "素材";
  return (
    "当前模型只支持\x20" + v154 + "\x20个" + v156 + "，请先删除已有 @ 引用"
  );
}
