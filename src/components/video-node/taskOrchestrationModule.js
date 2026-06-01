import {
  APIMART_DREAMINA_VIDEO_DEFAULT_MODEL,
  ensureDreaminaStyleVideoModelForTask,
  getDreaminaStyleVideoDefaultModel,
  getDreaminaStyleVideoModelVersion,
  isDreaminaStyleVideoModel,
  isDreaminaVideoRouteModeEnabled,
  normalizeDreaminaStyleVideoDuration,
  normalizeDreaminaVideoAspectRatio,
  normalizeDreaminaStyleVideoModel,
  normalizeDreaminaStyleVideoResolution,
  normalizeDreaminaVideoRouteMode,
  resolveDreaminaStyleVideoProvider,
  resolveDreaminaVideoTaskType,
  validateDreaminaVideoRouteSelection,
} from "../../modules/dreaminaVideoModelHelper.js";
import {
  isAdaptiveRatioLabel,
  pickClosestRatioForProviderModel,
} from "../../../api/imageRatioPolicy.js";
import { getGenerationRatioSizeWithDom } from "../../modules/generationRatioSource.js";
import {
  getPromptAssetInputRefsFromNode,
  insertPresetPromptIntoEditor,
  isRunningHubWorkflowNode,
  previewPresetPromptInEditor,
  resolvePresetPromptTextWithTextRefs,
  shouldUsePromptPreviewForPreset,
} from "../../modules/nodePromptShared.js";
import {
  isPreviewModeEnabled,
  isPreviewNodeLoading,
  startPreviewNodeLoading,
} from "../../modules/previewMode.js";
import {
  createPreviewGenerateButtonCallbacks,
  resetGenerateButtonIdleUi,
  setGenerateButtonCancellableUi,
  setGenerateButtonLoadingUi,
} from "../../modules/previewGenerateButtonUi.js";
import { resolveGenerationInputImageUrl } from "../../services/imageReferenceUrlService.js";
import { logDiagnosticEvent } from "../../services/diagnosticsService.js";
import { buildGenerationStartPatch } from "../../core/generationTaskLifecycle.js";
import {
  cancelTask,
  resumeTask,
  submitTask,
} from "../../core/generationTaskRuntime.js";
import {
  shouldAllowCancel,
  shouldShowGenerationBusyUi,
} from "../../core/generationTaskUiState.js";
import { GENERATION_HISTORY_EVENT } from "../../modules/generationHistoryAssets.js";
import { localPathToUrl } from "../../utils/localMediaPath.js";
import { resolveVideoWorkflowSchemaParam } from "./runningHubVideoUiSchema.js";
import {
  buildVideoGenerationFailurePatch,
  buildVideoGenerationResultPatch,
  normalizeVideoGenerationResult,
} from "./videoGenerationResultRenderer.js";
import {
  buildRunningHubVideoWorkflowSubmitPatch,
  getDefaultRunningHubVideoWorkflowModelId,
  shouldScopeRunningHubVideoSubmitEdges,
} from "./runningHubVideoSubmitPayload.js";
import {
  isModelApiModel,
  resolveModelExecution,
  resolveModelProvider,
} from "../../manifests/index.js";
import {
  getFixedInputSlotConfigFromManifest,
  resolveFixedInputSlotForRef,
} from "../../modules/fixedInputAssetRefs.js";
import { resolveEffectiveInputKind } from "../../modules/modelInputPolicy.js";
import { appendApimartPrivateAvatarProviderAssetRefs } from "../../modules/apimartPrivateAvatarAssets.js";
const DREAMINA_UPLOAD_DURATION_ERROR_TOAST_MS = 9000,
  VIDEO_GENERATE_TITLE = "生成视频",
  VIDEO_CANCEL_TOOLTIP = "点击生成，再次点击可以取消运行",
  APIMART_KLING_V3_OMNI_MODEL_ID = "apimart/kling-v3-omni",
  APIMART_KLING_O1_MODEL_ID = "apimart/kling-video-o1",
  HAPPYHORSE_BODY_RESOLVERS = new Set([
    "apimartHappyHorseVideo",
    "runninghubHappyHorseVideo",
  ]),
  WAN27_BODY_RESOLVERS = new Set(["apimartWan27Video", "runninghubWan27Video"]),
  HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS = 15,
  WAN27_AUDIO_INPUT_MIN_SECONDS = 2,
  WAN27_AUDIO_INPUT_MAX_SECONDS = 30,
  WAN27_AUDIO_INPUT_MAX_BYTES = 15 * 1024 * 1024,
  WAN27_VIDEO_EXTEND_MAX_SECONDS = 10,
  WAN27_REFERENCE_VIDEO_MAX_SECONDS = 30,
  WAN27_EDIT_VIDEO_MIN_SECONDS = 2,
  WAN27_EDIT_VIDEO_MAX_SECONDS = 10,
  KLING_V3_OMNI_VIDEO_MIN_SECONDS = 3,
  KLING_V3_OMNI_EDIT_VIDEO_MAX_SECONDS = 10,
  KLING_O1_VIDEO_MIN_SECONDS = 3,
  KLING_O1_VIDEO_MAX_SECONDS = 10;
function isDreaminaUploadDurationErrorMessage(v0) {
  const v1 = String(v0 || "")["trim"]();
  return (
    v1["startsWith"]("上传源视频失败：") || v1["startsWith"]("上传源音频失败：")
  );
}
function pickVideoAdaptiveSourceSize({
  inEdges: inEdges = [],
  nodes: nodes = {},
} = {}) {
  const v2 = [],
    v3 = [];
  for (const v4 of inEdges) {
    const v5 = nodes?.[v4?.["sourceId"]];
    if (!v5) continue;
    const v6 = String(v5?.["type"] || "")["toLowerCase"](),
      v7 = getGenerationRatioSizeWithDom({
        nodeId: v4?.["sourceId"],
        nodeData: v5,
        edge: v4,
        includeNodeFrame: true,
      });
    if (!(v7?.["width"] > 0 && v7?.["height"] > 0)) continue;
    if (v6["includes"]("image")) v2["push"](v7);
    else {
      if (v6["includes"]("video")) v3["push"](v7);
    }
  }
  return v2[0] || v3[0] || null;
}
function findVideoAspectRatioField(v8) {
  return (
    Array["isArray"](v8?.["uiSchema"]?.["fields"])
      ? v8["uiSchema"]["fields"]
      : []
  )["find"]((v9) => String(v9?.["id"] || "")["trim"]() === "aspectRatio");
}
function pickManifestDefaultVideoRatio(v10) {
  const v11 = findVideoAspectRatioField(v10),
    v12 = Array["isArray"](v11?.["options"]) ? v11["options"] : [];
  for (const v13 of v12) {
    const v14 = String(v13?.["value"] ?? v13 ?? "")["trim"]();
    if (v14 && v14["includes"](":") && !isAdaptiveRatioLabel(v14)) return v14;
  }
  return "";
}
function resolveVideoAspectRatioInput({
  nodeData: nodeData = {},
  payload: payload = {},
  modelManifest: modelManifest = null,
} = {}) {
  const v15 =
      nodeData?.["generationParams"] &&
      typeof nodeData["generationParams"] === "object" &&
      !Array["isArray"](nodeData["generationParams"])
        ? nodeData["generationParams"]
        : {},
    v16 =
      payload?.["generationParams"] &&
      typeof payload["generationParams"] === "object" &&
      !Array["isArray"](payload["generationParams"])
        ? payload["generationParams"]
        : {};
  if (Object["prototype"]["hasOwnProperty"]["call"](v15, "aspectRatio"))
    return v15["aspectRatio"];
  if (
    Object["prototype"]["hasOwnProperty"]["call"](nodeData || {}, "aspectRatio")
  )
    return nodeData["aspectRatio"];
  if (Object["prototype"]["hasOwnProperty"]["call"](v16, "aspectRatio"))
    return v16["aspectRatio"];
  if (
    Object["prototype"]["hasOwnProperty"]["call"](payload || {}, "aspectRatio")
  )
    return payload["aspectRatio"];
  return findVideoAspectRatioField(modelManifest)?.["defaultValue"] ?? "";
}
function resolveModelApiVideoAdaptiveRatio({
  inEdges: inEdges = [],
  nodes: nodes = {},
  nodeData: nodeData = {},
  provider: provider = "",
  model: model = "",
  modelManifest: modelManifest = null,
} = {}) {
  const v17 = pickVideoAdaptiveSourceSize({ inEdges: inEdges, nodes: nodes });
  if (v17?.["width"] > 0 && v17?.["height"] > 0)
    return pickClosestRatioForProviderModel({
      provider: provider,
      model: model,
      width: v17["width"],
      height: v17["height"],
    });
  const v18 = Number(nodeData?.["width"] || 0),
    v19 = Number(nodeData?.["height"] || 0);
  if (Number["isFinite"](v18) && v18 > 0 && Number["isFinite"](v19) && v19 > 0)
    return pickClosestRatioForProviderModel({
      provider: provider,
      model: model,
      width: v18,
      height: v19,
    });
  return pickManifestDefaultVideoRatio(modelManifest);
}
function applyModelApiVideoAdaptiveRatio(v20, v21 = {}) {
  const v22 = v21?.["modelManifest"] || null;
  if (!findVideoAspectRatioField(v22)) return v20;
  const v23 = resolveVideoAspectRatioInput({
    nodeData: v21?.["nodeData"],
    payload: v20,
    modelManifest: v22,
  });
  if (!isAdaptiveRatioLabel(v23)) return v20;
  const v24 = resolveModelApiVideoAdaptiveRatio(v21);
  return (
    v24 && !isAdaptiveRatioLabel(v24) && (v20["resolvedRatioLabel"] = v24),
    v20
  );
}
function pickDreaminaAdaptiveSourceRatio({
  inEdges: inEdges = [],
  nodes: nodes = {},
  provider: provider = "",
  model: model = "",
} = {}) {
  const v25 = pickVideoAdaptiveSourceSize({ inEdges: inEdges, nodes: nodes });
  if (!v25) return "";
  return pickClosestRatioForProviderModel({
    provider: provider,
    model: model,
    width: v25["width"],
    height: v25["height"],
  });
}
function isHappyHorseVideoModel(v26, v27) {
  return isModelUsingBodyResolver(v26, v27, HAPPYHORSE_BODY_RESOLVERS);
}
function isModelUsingBodyResolver(v28, v29, v30 = new Set()) {
  const v31 =
      resolveModelExecution(v28, { providerHint: v29 }) ||
      resolveModelExecution(v28),
    v32 = String(
      v31?.["executionManifest"]?.["extensions"]?.["bodyResolver"] || "",
    )["trim"]();
  return v32 && v30["has"](v32);
}
function getHappyHorseVideoInputMaxSeconds(v33, v34) {
  const v35 =
      resolveModelExecution(v33, { providerHint: v34 }) ||
      resolveModelExecution(v33),
    v36 = String(
      v35?.["executionManifest"]?.["extensions"]?.["bodyResolver"] || "",
    )["trim"]();
  return v36 === "runninghubHappyHorseVideo"
    ? 60
    : HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS;
}
function isWan27VideoModel(v37, v38) {
  return isModelUsingBodyResolver(v37, v38, WAN27_BODY_RESOLVERS);
}
function isKlingV3OmniVideoModel(v39, v40) {
  const v41 =
      resolveModelExecution(v39, { providerHint: v40 }) ||
      resolveModelExecution(v39),
    v42 = String(
      v41?.["canonicalModelId"] ||
        v41?.["modelManifest"]?.["modelId"] ||
        v39 ||
        "",
    )["trim"](),
    v43 = String(v41?.["modelManifest"]?.["provider"] || v40 || "")
      ["trim"]()
      ["toLowerCase"]();
  return v42 === APIMART_KLING_V3_OMNI_MODEL_ID && (!v43 || v43 === "apimart");
}
function isKlingO1VideoModel(v44, v45) {
  const v46 =
      resolveModelExecution(v44, { providerHint: v45 }) ||
      resolveModelExecution(v44),
    v47 = String(
      v46?.["canonicalModelId"] ||
        v46?.["modelManifest"]?.["modelId"] ||
        v44 ||
        "",
    )["trim"](),
    v48 = String(v46?.["modelManifest"]?.["provider"] || v45 || "")
      ["trim"]()
      ["toLowerCase"]();
  return v47 === APIMART_KLING_O1_MODEL_ID && (!v48 || v48 === "apimart");
}
function getPlainObject(v49) {
  return v49 && typeof v49 === "object" && !Array["isArray"](v49) ? v49 : {};
}
function normalizeHappyHorseMode(v50) {
  const v51 = String(v50 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v51 === "image" || v51 === "reference" || v51 === "edit"
    ? v51
    : "auto";
}
function getHappyHorseMode(v52 = {}) {
  const v53 = getPlainObject(v52?.["generationParams"]);
  return normalizeHappyHorseMode(
    v53["happyhorse_mode"] ?? v52?.["happyhorse_mode"],
  );
}
function normalizeWan27Mode(v54) {
  const v55 = String(v54 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v55 === "video" || v55 === "reference" || v55 === "edit"
    ? v55
    : "image";
}
function getWan27Mode(v56 = {}) {
  const v57 = getPlainObject(v56?.["generationParams"]);
  return normalizeWan27Mode(v57["wan27_mode"] ?? v56?.["wan27_mode"]);
}
function normalizeKlingV3OmniMode(v58) {
  const v59 = String(v58 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v59 === "reference" || v59 === "edit" ? v59 : "image";
}
function getKlingV3OmniMode(v60 = {}) {
  const v61 = getPlainObject(v60?.["generationParams"]);
  return normalizeKlingV3OmniMode(
    v61["kling_v3_omni_mode"] ?? v60?.["kling_v3_omni_mode"],
  );
}
function normalizeMediaDurationSeconds(...v62) {
  for (const v63 of v62) {
    const v64 = Number(v63);
    if (Number["isFinite"](v64) && v64 > 0) return v64;
  }
  return 0;
}
function getVideoDurationFromSource(v65 = {}, v66 = null) {
  return normalizeMediaDurationSeconds(
    v66?.["videoDuration"],
    v66?.["duration"],
    v65?.["videoDuration"],
    v65?.["duration"],
  );
}
function getVideoDurationFromAssetRef(v67 = {}) {
  return normalizeMediaDurationSeconds(
    v67?.["videoDuration"],
    v67?.["duration"],
    v67?.["nodeData"]?.["videoDuration"],
    v67?.["nodeData"]?.["duration"],
  );
}
function normalizeMediaSizeBytes(...v68) {
  for (const v69 of v68) {
    const v70 = Number(v69);
    if (Number["isFinite"](v70) && v70 > 0) return v70;
  }
  return 0;
}
function getAudioDurationFromSource(v71 = {}) {
  return normalizeMediaDurationSeconds(
    v71?.["audioDuration"],
    v71?.["duration"],
  );
}
function getAudioDurationFromAssetRef(v72 = {}) {
  return normalizeMediaDurationSeconds(
    v72?.["audioDuration"],
    v72?.["duration"],
    v72?.["nodeData"]?.["audioDuration"],
    v72?.["nodeData"]?.["duration"],
  );
}
function getAudioSizeBytesFromSource(v73 = {}) {
  return normalizeMediaSizeBytes(
    v73?.["audioSizeBytes"],
    v73?.["audioByteSize"],
    v73?.["fileSize"],
    v73?.["sizeBytes"],
    v73?.["byteSize"],
  );
}
function getAudioSizeBytesFromAssetRef(v74 = {}) {
  return normalizeMediaSizeBytes(
    v74?.["audioSizeBytes"],
    v74?.["audioByteSize"],
    v74?.["fileSize"],
    v74?.["sizeBytes"],
    v74?.["byteSize"],
    v74?.["nodeData"]?.["audioSizeBytes"],
    v74?.["nodeData"]?.["audioByteSize"],
    v74?.["nodeData"]?.["fileSize"],
    v74?.["nodeData"]?.["sizeBytes"],
    v74?.["nodeData"]?.["byteSize"],
  );
}
function buildVideoInputUrlsByFixedKindSlot({
  fixedInputConfig: fixedInputConfig = null,
  refs: refs = [],
  assetInputRefs: assetInputRefs = [],
  kind: kind = "image",
} = {}) {
  const v75 = String(kind || "")["trim"](),
    v76 = (fixedInputConfig?.["visibleSlots"] || [])
      ["map"]((v77) => String(v77 || "")["trim"]())
      [
        "filter"
      ]((v78) => v78 && String(fixedInputConfig?.["slotKindById"]?.[v78] || "") === v75);
  if (v76["length"] === 0) return {};
  const v79 = {},
    v80 = new Set(),
    v81 = (v82, v83) => {
      const v84 = String(v82 || "")["trim"](),
        v85 = String(v83 || "")["trim"]();
      if (!v84 || !v85 || v79[v84]) return false;
      if (!v76["includes"](v84)) return false;
      return ((v79[v84] = v85), v80["add"](v85), true);
    },
    v86 = (v87, { allowAuto: allowAuto = true } = {}) => {
      const v88 = String(v87?.["url"] || "")["trim"]();
      if (!v88 || v80["has"](v88)) return false;
      const v89 = resolveEffectiveInputKind(v87) || v87?.["type"] || v75;
      if (String(v89 || "")["trim"]() !== v75) return false;
      const v90 = resolveFixedInputSlotForRef({
        fixedInputConfig: fixedInputConfig,
        refSlot: v87?.["refSlot"],
        kind: v75,
        occupiedSlots: v79,
      });
      if (!allowAuto && v90["reason"] !== "explicit") return false;
      return v81(v90["slot"], v88);
    },
    v91 = (v92) => {
      const v93 = String(v92 || "")["trim"]();
      if (!v93 || v80["has"](v93)) return false;
      const v94 = resolveFixedInputSlotForRef({
        fixedInputConfig: fixedInputConfig,
        refSlot: "",
        kind: v75,
        occupiedSlots: v79,
      });
      return v81(v94["slot"], v93);
    },
    v95 = [
      ...(Array["isArray"](refs) ? refs : []),
      ...(Array["isArray"](assetInputRefs) ? assetInputRefs : []),
    ];
  return (
    v95["forEach"]((v96) => {
      v86(v96, { allowAuto: false });
    }),
    (Array["isArray"](refs) ? refs : [])["forEach"]((v97) => {
      v86(v97);
    }),
    (Array["isArray"](assetInputRefs) ? assetInputRefs : [])["forEach"](
      (v98) => {
        const v99 = resolveEffectiveInputKind(v98) || v98?.["type"];
        if (v99 === v75) v91(v98?.["url"]);
      },
    ),
    v79
  );
}
function buildVideoInputUrlsByFixedImageSlot({
  fixedInputConfig: fixedInputConfig = null,
  imageRefs: imageRefs = [],
  assetInputRefs: assetInputRefs = [],
} = {}) {
  return buildVideoInputUrlsByFixedKindSlot({
    fixedInputConfig: fixedInputConfig,
    refs: imageRefs,
    assetInputRefs: assetInputRefs,
    kind: "image",
  });
}
function buildHappyHorseMediaPayload({
  prompt: prompt = "",
  mode: mode = "auto",
  images: images = [],
  videos: videos = [],
  videoEntries: videoEntries = [],
  assetVideoCount: assetVideoCount = 0,
  maxVideoSeconds: maxVideoSeconds = HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS,
} = {}) {
  const v100 = String(prompt || "")["trim"]();
  if (!v100)
    return { ok: false, message: "HappyHorse\x201.0\x20必须填写提示词" };
  const v101 = Array["from"](
      new Set(
        (Array["isArray"](images) ? images : [])
          ["map"]((v102) => String(v102 || "")["trim"]())
          ["filter"](Boolean),
      ),
    ),
    v103 = Array["from"](
      new Set(
        (Array["isArray"](videos) ? videos : [])
          ["map"]((v104) => String(v104 || "")["trim"]())
          ["filter"](Boolean),
      ),
    ),
    v105 = normalizeHappyHorseMode(mode),
    v106 = v101["length"] > 0 || v103["length"] > 0,
    v107 = { ok: true, images: [], videos: [], inputUrls: [], mode: "auto" },
    v108 = assetVideoCount > 0 ? "，请移除提示词里的 @视频 引用" : "";
  if (v105 === "auto") {
    if (v101["length"] > 0 || v103["length"] > 0)
      return {
        ok: false,
        message: "请选择\x20HappyHorse\x201.0\x20的模式后再生成",
      };
    return v107;
  }
  if (v105 === "image") {
    if (v103["length"] > 0)
      return { ok: false, message: "图生视频模式不接受视频入参" + v108 };
    if (!v101[0]) {
      if (!v106) return v107;
      return { ok: false, message: "图生视频模式需要\x201\x20张首帧图" };
    }
    return {
      ok: true,
      images: v101["slice"](0, 1),
      videos: [],
      inputUrls: v101["slice"](0, 1),
      mode: "image",
    };
  }
  if (v105 === "reference") {
    if (v103["length"] > 0)
      return { ok: false, message: "参考图生视频模式不接受视频入参" + v108 };
    if (v101["length"] <= 0) {
      if (!v106) return v107;
      return { ok: false, message: "参考图生视频模式需要至少 1 张参考图" };
    }
    const v109 = v101["slice"](0, 9);
    return {
      ok: true,
      images: v109,
      videos: [],
      inputUrls: v109,
      mode: "reference",
    };
  }
  if (!v103[0]) {
    if (!v106) return v107;
    return { ok: false, message: "视频编辑模式需要\x201\x20个视频入参" };
  }
  const v110 = v103[0],
    v111 =
      (Array["isArray"](videoEntries) ? videoEntries : [])["find"](
        (v112) => String(v112?.["url"] || "")["trim"]() === v110,
      ) || {},
    v113 = normalizeMediaDurationSeconds(v111["duration"]),
    v114 = Number(maxVideoSeconds),
    v115 =
      Number["isFinite"](v114) && v114 > 0
        ? v114
        : HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS;
  if (v113 > v115)
    return {
      ok: false,
      message:
        "HappyHorse 1.0 视频编辑入参不能超过 " + v115 + " 秒，请裁剪后再生成",
    };
  return {
    ok: true,
    images: v101["slice"](0, 5),
    videos: [v110],
    inputUrls: v101["slice"](0, 5),
    mode: "edit",
  };
}
function orderHappyHorseImageUrls({
  mode: mode = "auto",
  images: images = [],
  slotUrls: slotUrls = {},
} = {}) {
  const v116 = normalizeHappyHorseMode(mode),
    v117 = [],
    v118 = (v119) => {
      const v120 = String(v119 || "")["trim"]();
      if (v120 && !v117["includes"](v120)) v117["push"](v120);
    };
  if (v116 === "image") v118(slotUrls["firstFrame"]);
  else {
    if (v116 === "reference") v118(slotUrls["referenceImage"]);
    else v116 === "edit" && v118(slotUrls["editRefImage"]);
  }
  return ((Array["isArray"](images) ? images : [])["forEach"](v118), v117);
}
function buildWan27MediaPayload({
  mode: mode = "image",
  images: images = [],
  videos: videos = [],
  audios: audios = [],
  videoEntries: videoEntries = [],
  audioEntries: audioEntries = [],
  assetVideoCount: assetVideoCount = 0,
} = {}) {
  const v121 = normalizeWan27Mode(mode),
    v122 = (v123) =>
      Array["from"](
        new Set(
          (Array["isArray"](v123) ? v123 : [])
            ["map"]((v124) => String(v124 || "")["trim"]())
            ["filter"](Boolean),
        ),
      ),
    v125 = v122(images),
    v126 = v122(videos),
    v127 = v122(audios),
    v128 = assetVideoCount > 0 ? "，请移除提示词里的 @视频 引用" : "",
    v129 = (v130) => {
      if (!v130) return null;
      const v131 =
          (Array["isArray"](audioEntries) ? audioEntries : [])["find"](
            (v132) => String(v132?.["url"] || "")["trim"]() === v130,
          ) || {},
        v133 = normalizeMediaDurationSeconds(v131["duration"]);
      if (
        v133 > 0 &&
        (v133 < WAN27_AUDIO_INPUT_MIN_SECONDS ||
          v133 > WAN27_AUDIO_INPUT_MAX_SECONDS)
      )
        return "Wan2.7 音频必须为 2-30 秒，请更换或裁剪后再生成";
      const v134 = normalizeMediaSizeBytes(v131["sizeBytes"]);
      if (v134 > WAN27_AUDIO_INPUT_MAX_BYTES)
        return "Wan2.7\x20音频必须小于\x2015MB，请压缩后再生成";
      return null;
    },
    v135 = (v136) =>
      (Array["isArray"](videoEntries) ? videoEntries : [])["find"](
        (v137) => String(v137?.["url"] || "")["trim"]() === v136,
      ) || {},
    v138 = (v139) => normalizeMediaDurationSeconds(v135(v139)["duration"]);
  if (v121 === "video") {
    if (v125["length"] > 0)
      return { ok: false, message: "视频续写模式不接受图片入参" + v128 };
    if (v127["length"] > 0)
      return { ok: false, message: "视频续写模式不支持音频入参" };
    if (!v126[0])
      return { ok: true, images: [], videos: [], audios: [], inputUrls: [] };
    const v140 = v126[0],
      v141 = v138(v140);
    if (v141 > WAN27_VIDEO_EXTEND_MAX_SECONDS)
      return {
        ok: false,
        message: "Wan2.7 视频续写入参不能超过 10 秒，请裁剪后再生成",
      };
    return { ok: true, images: [], videos: [v140], audios: [], inputUrls: [] };
  }
  if (v121 === "reference") {
    const v142 = v125["slice"](0, 1),
      v143 = v126["slice"](0, 1);
    if (v142["length"] <= 0 && v143["length"] <= 0)
      return { ok: false, message: "参考生视频模式需要参考图或参考视频" };
    const v144 = v143[0] || "",
      v145 = v138(v144);
    if (v145 > WAN27_REFERENCE_VIDEO_MAX_SECONDS)
      return {
        ok: false,
        message: "Wan2.7 参考视频不能超过 30 秒，请裁剪后再生成",
      };
    const v146 = v127[0] || "",
      v147 = v129(v146);
    if (v147) return { ok: false, message: v147 };
    if (v146 && v142["length"] <= 0)
      return {
        ok: false,
        message: "参考生视频音频需要搭配参考图，用于参考音色",
      };
    return {
      ok: true,
      images: v142,
      videos: v143,
      audios: v146 ? [v146] : [],
      inputUrls: v142,
    };
  }
  if (v121 === "edit") {
    if (!v126[0])
      return { ok: false, message: "视频编辑模式需要 1 个原视频入参" };
    if (v125["length"] > 0)
      return {
        ok: false,
        message: "视频编辑模式不支持图片入参，请使用参考视频",
      };
    if (v127["length"] > 0)
      return { ok: false, message: "视频编辑模式不支持音频入参" };
    const v148 = v126[0],
      v149 = v138(v148);
    if (
      v149 > 0 &&
      (v149 < WAN27_EDIT_VIDEO_MIN_SECONDS ||
        v149 > WAN27_EDIT_VIDEO_MAX_SECONDS)
    )
      return {
        ok: false,
        message: "Wan2.7 视频编辑原视频必须为 2-10 秒，请裁剪后再生成",
      };
    return {
      ok: true,
      images: [],
      videos: v126["slice"](0, 2),
      audios: [],
      inputUrls: [],
    };
  }
  if (v126["length"] > 0)
    return { ok: false, message: "图生视频模式不接受视频入参" + v128 };
  const v150 = v127[0] || "",
    v151 = v129(v150);
  if (v151) return { ok: false, message: v151 };
  const v152 = v125["slice"](0, 2);
  return {
    ok: true,
    images: v152,
    videos: [],
    audios: v150 ? [v150] : [],
    inputUrls: v152,
  };
}
function buildKlingV3OmniMediaPayload({
  mode: mode = "image",
  images: images = [],
  videos: videos = [],
  videoEntries: videoEntries = [],
  assetVideoCount: assetVideoCount = 0,
} = {}) {
  const v153 = normalizeKlingV3OmniMode(mode),
    v154 = (v155) =>
      Array["from"](
        new Set(
          (Array["isArray"](v155) ? v155 : [])
            ["map"]((v156) => String(v156 || "")["trim"]())
            ["filter"](Boolean),
        ),
      ),
    v157 = v154(images),
    v158 = v154(videos),
    v159 = assetVideoCount > 0 ? "，请移除提示词里的 @视频 引用" : "",
    v160 = (v161) =>
      (Array["isArray"](videoEntries) ? videoEntries : [])["find"](
        (v162) => String(v162?.["url"] || "")["trim"]() === v161,
      ) || {},
    v163 = (v164) => normalizeMediaDurationSeconds(v160(v164)["duration"]);
  if (v153 === "reference") {
    const v165 = v157["slice"](0, 1),
      v166 = v158["slice"](0, 1);
    if (v165["length"] <= 0 && v166["length"] <= 0)
      return { ok: false, message: "参考生视频模式需要参考图或参考视频" };
    return {
      ok: true,
      images: v165,
      videos: v166,
      audios: [],
      inputUrls: v165,
    };
  }
  if (v153 === "edit") {
    if (!v158[0])
      return { ok: false, message: "视频编辑模式需要\x201\x20个原视频入参" };
    if (v157["length"] > 0)
      return { ok: false, message: "视频编辑模式不支持图片入参" };
    const v167 = v158[0],
      v168 = v163(v167);
    if (
      v168 > 0 &&
      (v168 < KLING_V3_OMNI_VIDEO_MIN_SECONDS ||
        v168 > KLING_V3_OMNI_EDIT_VIDEO_MAX_SECONDS)
    )
      return {
        ok: false,
        message: "Kling V3 Omni 视频编辑原视频必须为 3-10 秒，请裁剪后再生成",
      };
    return { ok: true, images: [], videos: [v167], audios: [], inputUrls: [] };
  }
  if (v158["length"] > 0)
    return { ok: false, message: "图生视频模式不接受视频入参" + v159 };
  return {
    ok: true,
    images: v157["slice"](0, 2),
    videos: [],
    audios: [],
    inputUrls: v157["slice"](0, 2),
  };
}
function replaceKlingO1PromptImageReferences(v169, v170) {
  const v171 = Math["max"](0, Math["trunc"](Number(v170) || 0));
  if (v171 <= 0) return String(v169 || "");
  return String(v169 || "")["replace"](/@?图片\s*([1-9]\d*)/g, (v172, v173) => {
    const v174 = Number["parseInt"](String(v173 || ""), 10);
    if (!Number["isFinite"](v174) || v174 < 1 || v174 > v171) return v172;
    return "<<<image_" + v174 + ">>>";
  });
}
function buildKlingO1MediaPayload({
  prompt: prompt = "",
  images: images = [],
  videos: videos = [],
  videoEntries: videoEntries = [],
  videoRole: videoRole = "",
  hasEditVideo: hasEditVideo = false,
  hasFeatureVideo: hasFeatureVideo = false,
} = {}) {
  const v175 = (v176) =>
      Array["from"](
        new Set(
          (Array["isArray"](v176) ? v176 : [])
            ["map"]((v177) => String(v177 || "")["trim"]())
            ["filter"](Boolean),
        ),
      ),
    v178 = v175(images),
    v179 = v175(videos),
    v180 = String(videoRole || "")["trim"]() === "feature" ? "feature" : "base",
    v181 = (v182) =>
      (Array["isArray"](videoEntries) ? videoEntries : [])["find"](
        (v183) => String(v183?.["url"] || "")["trim"]() === v182,
      ) || {},
    v184 = (v185) => normalizeMediaDurationSeconds(v181(v185)["duration"]);
  if (hasEditVideo && hasFeatureVideo)
    return {
      ok: false,
      message: "Kling\x20O1\x20编辑视频和特征参考视频只能接入其中一个",
    };
  if (v179["length"] > 1)
    return {
      ok: false,
      message:
        "Kling O1 只能接入 1 个视频，请保留编辑视频或特征参考视频其中一个",
    };
  const v186 = v179[0] || "";
  if (v186) {
    const v187 = v184(v186);
    if (
      v187 > 0 &&
      (v187 < KLING_O1_VIDEO_MIN_SECONDS || v187 > KLING_O1_VIDEO_MAX_SECONDS)
    )
      return {
        ok: false,
        message: "Kling\x20O1\x20参考视频必须为\x203-10\x20秒，请裁剪后再生成",
      };
    if (v180 === "base") {
      if (v178["length"] > 0)
        return {
          ok: false,
          message:
            "Kling\x20O1\x20编辑视频不能同时接参考图片，请移除参考图片后再生成",
        };
      return {
        ok: true,
        prompt: replaceKlingO1PromptImageReferences(prompt, 0),
        images: [],
        videos: [v186],
        inputUrls: [],
        videoRole: "base",
      };
    }
    if (v178["length"] > 1)
      return {
        ok: false,
        message: "Kling\x20O1\x20特征参考视频同时只能使用\x201\x20张参考图片",
      };
    const v188 = v178["slice"](0, 1);
    return {
      ok: true,
      prompt: replaceKlingO1PromptImageReferences(prompt, v188["length"]),
      images: v188,
      videos: [v186],
      inputUrls: v188,
      videoRole: "feature",
    };
  }
  const v189 = v178["slice"](0, 2);
  return {
    ok: true,
    prompt: replaceKlingO1PromptImageReferences(prompt, v189["length"]),
    images: v189,
    videos: [],
    inputUrls: v189,
    videoRole: "",
  };
}
export function createVideoNodeTaskOrchestrationModule(v190) {
  const {
      store: v191,
      api: v192,
      getImage: v193,
      startLoading: v194,
      stopLoading: v195,
      ensureConfig: v196,
      getProviderConfig: v197,
      isVideoVipModel: v198,
      ensureVipSessionRecheck: v199,
    } = v190,
    v200 = "DREAMINA_POLL_TIMEOUT",
    v201 = 20 * 60 * 1000,
    v202 = 20 * 1000,
    v203 = 24 * 60 * 60 * 1000,
    v204 = () =>
      typeof v191["getStateRaw"] === "function"
        ? v191["getStateRaw"]()
        : v191["getState"]();
  class v205 {
    ["_isDreaminaPollTimeoutError"](v206) {
      const v207 = String(v206?.["code"] || "")
        ["trim"]()
        ["toUpperCase"]();
      if (v207 === v200 || v207 === "TIMEOUT") return true;
      const v208 = String(v206?.["type"] || "")
        ["trim"]()
        ["toUpperCase"]();
      if (v208 === "TIMEOUT" || v208 === "TASK_TIMEOUT") return true;
      const v209 = String(v206?.["message"] || "")
        ["trim"]()
        ["toLowerCase"]();
      return v209["includes"]("timeout") || v209["includes"]("超时");
    }
    ["_buildDreaminaBackgroundPendingSnapshot"](v210 = "") {
      return this["_buildDreaminaPendingSnapshot"]({
        submitId: v210,
        phase: "generating",
        label: "排队中（后台查询）",
      });
    }
    ["_resolveDreaminaAdaptiveAspectRatioFromNode"](v211 = this["_data"]) {
      const v212 = Number(v211?.["width"] || 0),
        v213 = Number(v211?.["height"] || 0);
      return (
        pickClosestRatioForProviderModel({
          provider: resolveDreaminaStyleVideoProvider(
            v211?.["model"],
            v211?.["provider"],
          ),
          model: v211?.["model"],
          width: v212,
          height: v213,
        }) || "1:1"
      );
    }
    ["_hasResolvedVideoResult"](v214 = this["_data"]) {
      const v215 = Array["isArray"](v214?.["videos"]) ? v214["videos"] : [];
      if (v215["length"] > 0) return true;
      return (
        !!String(v214?.["videoUrl"] || "")["trim"]() ||
        !!String(v214?.["localPath"] || "")["trim"]()
      );
    }
    ["_persistDreaminaResumeCache"]() {
      try {
        window["_triggerLocalCacheSave"]?.();
      } catch {}
    }
    ["_persistRunningHubResumeCache"]() {
      try {
        window["_triggerLocalCacheSave"]?.();
      } catch {}
    }
    ["_persistAsyncResumeCache"]() {
      this["_persistRunningHubResumeCache"]();
    }
    ["_isDreaminaRecoverableRunningTask"](v216 = this["_data"]) {
      if (!this["_isDreaminaVideoNode"](v216)) return false;
      const v217 = String(v216?.["dreaminaSubmitId"] || "")["trim"]();
      if (!v217) return false;
      const v218 = String(v216?.["dreaminaTaskPhase"] || "")
          ["trim"]()
          ["toLowerCase"](),
        v219 = String(v216?.["dreaminaTaskStatus"] || "")
          ["trim"]()
          ["toLowerCase"]();
      if (v218 === "done" || v218 === "failed") return false;
      if (v219 === "failed") return false;
      return true;
    }
    ["_shouldKeepDreaminaLoading"](
      v220 = v191["getState"]()["nodes"]?.[this["nodeId"]] ||
        this["_data"] ||
        {},
    ) {
      if (!this["_isDreaminaVideoNode"](v220)) return false;
      const v221 = String(v220?.["dreaminaTaskPhase"] || "")
          ["trim"]()
          ["toLowerCase"](),
        v222 = String(v220?.["dreaminaTaskStatus"] || "")
          ["trim"]()
          ["toLowerCase"]();
      if (v221 === "done" || v221 === "failed") return false;
      if (v222 === "success" || v222 === "failed") return false;
      if (v220?.["isGenerating"] === true) return true;
      if (
        String(v220?.["jobStatus"] || "")
          ["trim"]()
          ["toLowerCase"]() === "running"
      )
        return true;
      if (v220?.["dreaminaTaskRecovering"] === true) return true;
      if (this["_dreaminaResumePromise"]) return true;
      return this["_isDreaminaRecoverableRunningTask"](v220);
    }
    ["_inferAsyncProviderFromModel"](v223, v224 = "") {
      const v225 = resolveModelProvider(v223, "", { allowProviderHint: false });
      if (v225) return v225;
      const v226 = String(v224 || "")
        ["trim"]()
        ["toLowerCase"]();
      if (v226) return v226;
      const v227 = String(v223 || "")["trim"]();
      if (v227 && !v227["includes"]("/")) return "grsai";
      return "";
    }
    ["_isRunningHubRecoverableRunningTask"](v228 = this["_data"]) {
      if (
        !this["_isRunninghubWorkflowModel"](v228?.["model"], v228?.["provider"])
      )
        return false;
      const v229 = String(v228?.["rhTaskId"] || "")["trim"]();
      if (!v229) return false;
      const v230 = String(v228?.["rhTaskStatus"] || "")
        ["trim"]()
        ["toLowerCase"]();
      if (
        v230 === "success" ||
        v230 === "failed" ||
        v230 === "idle" ||
        v230 === "cancelled"
      )
        return false;
      return true;
    }
    ["_isAsyncRecoverableRunningTask"](v231 = this["_data"]) {
      const v232 = String(v231?.["asyncTaskId"] || "")["trim"]();
      if (!v232) return false;
      const v233 = this["_inferAsyncProviderFromModel"](
        v231?.["model"],
        v231?.["asyncTaskProvider"] || v231?.["provider"] || "",
      );
      if (
        !v233 ||
        v233 === "runninghubwf" ||
        v233 === "runninghub" ||
        v233 === "dreamina"
      )
        return false;
      const v234 = String(v231?.["asyncTaskKind"] || "")
        ["trim"]()
        ["toLowerCase"]();
      if (v234 && v234 !== "video") return false;
      const v235 = String(v231?.["asyncTaskStatus"] || "")
        ["trim"]()
        ["toLowerCase"]();
      if (
        v235 === "success" ||
        v235 === "failed" ||
        v235 === "idle" ||
        v235 === "cancelled"
      )
        return false;
      return true;
    }
    ["_buildRunningHubTaskPatch"]({
      taskId: taskId = "",
      status: status = "pending",
      startedAt: startedAt = 0,
      recovering: recovering = false,
      useOpenapiQuery: useOpenapiQuery = false,
    } = {}) {
      return {
        rhTaskId: String(taskId || "")["trim"](),
        rhTaskStatus: String(status || "pending")["trim"]() || "pending",
        rhTaskStartedAt: Number(startedAt || 0),
        rhTaskRecovering: recovering === true,
        rhTaskUseOpenapiQuery: useOpenapiQuery === true,
      };
    }
    ["_buildAsyncTaskPatch"]({
      provider: provider = "",
      kind: kind = "video",
      taskId: taskId = "",
      status: status = "pending",
      startedAt: startedAt = 0,
      recovering: recovering = false,
    } = {}) {
      return {
        asyncTaskProvider: String(provider || "")["trim"](),
        asyncTaskKind: String(kind || "video")["trim"]() || "video",
        asyncTaskId: String(taskId || "")["trim"](),
        asyncTaskStatus: String(status || "pending")["trim"]() || "pending",
        asyncTaskStartedAt: Number(startedAt || 0),
        asyncTaskRecovering: recovering === true,
      };
    }
    async ["_buildResumePayload"](v236 = this["_data"], v237 = {}) {
      const v238 = v236 || {},
        v239 = String(v238?.["model"] || "")["trim"](),
        v240 = this["_inferAsyncProviderFromModel"](
          v239,
          v237?.["providerHint"] ||
            v238?.["asyncTaskProvider"] ||
            v238?.["provider"] ||
            "",
        );
      if (!v239 || !v240)
        throw new Error("缺少异步视频恢复所需的模型或厂商信息");
      await v196();
      const v241 = v197(v240) || {},
        v242 = String(
          v240 === "runninghub"
            ? v241["modelApiKey"] || v241["apiKey"] || ""
            : v241["apiKey"] || window["_appApiKey"] || "",
        )["trim"]();
      return {
        nodeId: this["nodeId"],
        model: v239,
        provider: v240,
        apiKey: v242,
      };
    }
    ["_syncLocalTaskNodeData"]() {
      const v243 = v191["getState"]()["nodes"]?.[this["nodeId"]];
      if (v243) this["_data"] = v243;
      return this["_data"] || {};
    }
    ["_buildDreaminaTaskPatch"](v244, v245 = {}) {
      const v246 = {
        dreaminaSubmitId: String(v244?.["submitId"] || "")["trim"](),
        dreaminaTaskStatus:
          String(v244?.["status"] || "pending")["trim"]() || "pending",
        dreaminaTaskPhase:
          String(v244?.["phase"] || "generating")["trim"]() || "generating",
        dreaminaTaskLabel:
          String(v244?.["label"] || "生成中")["trim"]() || "生成中",
        dreaminaTaskLastCheckedAt: Number(
          v244?.["lastCheckedAt"] || Date["now"](),
        ),
        dreaminaTaskRecovering: v245["recovering"] === true,
        dreaminaTaskLastRaw:
          v244?.["raw"] &&
          typeof v244["raw"] === "object" &&
          !Array["isArray"](v244["raw"])
            ? v244["raw"]
            : {},
      };
      return (
        v245["startedAt"] != null &&
          (v246["dreaminaTaskStartedAt"] = Number(v245["startedAt"] || 0)),
        v246
      );
    }
    ["_applyDreaminaTaskSnapshot"](v247, v248 = {}) {
      const v249 =
          v191["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {},
        v250 = this["_buildDreaminaTaskPatch"](v247, {
          recovering: v248["recovering"] === true,
          startedAt:
            v248["startedAt"] != null
              ? v248["startedAt"]
              : v249?.["dreaminaTaskStartedAt"],
        });
      return (
        v191["updateNodeData"](this["nodeId"], v250),
        this["_syncLocalTaskNodeData"](),
        this["_persistDreaminaResumeCache"](),
        v250
      );
    }
    ["_stopDreaminaRecovery"](v251 = false) {
      this["_dreaminaResumeAbortController"] &&
        !this["_dreaminaResumeAbortController"]["signal"]["aborted"] &&
        this["_dreaminaResumeAbortController"]["abort"]();
      ((this["_dreaminaResumeAbortController"] = null),
        (this["_dreaminaResumeSubmitId"] = ""),
        (this["_dreaminaResumePromise"] = null));
      if (v251) {
        const v252 = v191["getState"]()["nodes"]?.[this["nodeId"]];
        v252?.["dreaminaTaskRecovering"] &&
          v191["updateNodeData"](this["nodeId"], {
            dreaminaTaskRecovering: false,
          });
      }
    }
    ["_stopRunningHubRecovery"](v253 = false) {
      this["_rhResumeAbortController"] &&
        !this["_rhResumeAbortController"]["signal"]["aborted"] &&
        this["_rhResumeAbortController"]["abort"]();
      ((this["_rhResumeAbortController"] = null),
        (this["_rhResumeTaskId"] = ""),
        (this["_rhResumePromise"] = null));
      if (v253) {
        const v254 = v191["getState"]()["nodes"]?.[this["nodeId"]];
        v254?.["rhTaskRecovering"] &&
          (v191["updateNodeData"](this["nodeId"], { rhTaskRecovering: false }),
          this["_persistRunningHubResumeCache"]());
      }
    }
    ["_stopAsyncRecovery"](v255 = false) {
      this["_asyncResumeAbortController"] &&
        !this["_asyncResumeAbortController"]["signal"]["aborted"] &&
        this["_asyncResumeAbortController"]["abort"]();
      ((this["_asyncResumeAbortController"] = null),
        (this["_asyncResumeTaskId"] = ""),
        (this["_asyncResumePromise"] = null));
      if (v255) {
        const v256 = v191["getState"]()["nodes"]?.[this["nodeId"]];
        v256?.["asyncTaskRecovering"] &&
          (v191["updateNodeData"](this["nodeId"], {
            asyncTaskRecovering: false,
          }),
          this["_persistAsyncResumeCache"]());
      }
    }
    ["_buildDreaminaPendingSnapshot"]({
      submitId: submitId = "",
      phase: phase = "generating",
      label: label = "生成中",
      raw: raw = {},
    } = {}) {
      return {
        submitId: String(submitId || "")["trim"](),
        status: "pending",
        phase: phase,
        label: label,
        queueStatus: "",
        queueIndex: null,
        queueLength: null,
        outputs: [],
        failReason: "",
        raw:
          raw && typeof raw === "object" && !Array["isArray"](raw) ? raw : {},
        isTerminal: false,
        hasOutputs: false,
        lastCheckedAt: Date["now"](),
      };
    }
    ["_buildDreaminaFailedSnapshot"](v257, v258, v259 = {}) {
      return {
        submitId: String(v257 || "")["trim"](),
        status: "failed",
        phase: "failed",
        label: String(v258 || "")["trim"]() || "查询失败",
        queueStatus: "",
        queueIndex: null,
        queueLength: null,
        outputs: [],
        failReason: String(v258 || "")["trim"](),
        raw:
          v259 && typeof v259 === "object" && !Array["isArray"](v259)
            ? v259
            : {},
        isTerminal: true,
        hasOutputs: false,
        lastCheckedAt: Date["now"](),
      };
    }
    ["_applyDreaminaSuccessResult"](
      v260,
      v261,
      v262 = null,
      { writeStore: writeStore = true, returnPatch: returnPatch = false } = {},
    ) {
      const v263 = normalizeVideoGenerationResult(v260),
        v264 = v263["items"],
        v265 = this["_isDreaminaVideoNode"](
          v191["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {},
        ),
        v266 =
          String(v262?.["submitId"] || "")["trim"]() ||
          String(
            v191["getState"]()["nodes"]?.[this["nodeId"]]?.[
              "dreaminaSubmitId"
            ] || "",
          )["trim"](),
        v267 = v265
          ? v262
            ? this["_buildDreaminaTaskPatch"](v262, {
                recovering: false,
                startedAt: v261,
              })
            : {
                isGenerating: false,
                jobStatus: "success",
                dreaminaSubmitId: v266,
                dreaminaTaskStatus: "success",
                dreaminaTaskPhase: "done",
                dreaminaTaskLabel: "已完成",
                dreaminaTaskStartedAt: v261,
                dreaminaTaskLastCheckedAt: Date["now"](),
                dreaminaTaskLastRaw: {},
                dreaminaTaskRecovering: false,
              }
          : {},
        v268 = buildVideoGenerationResultPatch(v263, { startedAt: v261 }),
        v269 = v268 ? { ...v268, ...v267 } : null;
      v268 &&
        writeStore &&
        (v191["updateNodeData"](this["nodeId"], v269),
        this["_persistDreaminaResumeCache"]());
      if (returnPatch)
        return { videos: v264, patch: v269 || {}, normalizedResult: v263 };
      return v264;
    }
    ["_scheduleDreaminaResultEnrichment"](v270) {
      if (!(Array["isArray"](v270) && v270["length"] > 0)) return;
      {
        const v271 = this["nodeId"],
          v272 = ++this["_resultThumbToken"];
        (async () => {
          for (let v273 = 0; v273 < v270["length"]; v273++) {
            if (v272 !== this["_resultThumbToken"]) return;
            const v274 = v191["getState"]()["nodes"]?.[v271];
            if (!v274) return;
            const v275 = Array["isArray"](v274["videos"]) ? v274["videos"] : [],
              v276 = v275[v273];
            if (!v276 || typeof v276 !== "object") continue;
            const v277 = !!String(v276["thumbUrl"] || "")["trim"]();
            if (v277) {
              const v278 = Number(v274["mainVideoIndex"]),
                v279 = Number["isFinite"](v278)
                  ? Math["max"](0, Math["trunc"](v278))
                  : 0;
              v273 === v279 &&
                !String(v274["thumbUrl"] || "")["trim"]() &&
                v191["updateNodeData"](v271, {
                  thumbUrl: String(v276["thumbUrl"])["trim"](),
                });
              continue;
            }
            const v280 = this["_resolveVideoMetaSrcFromVideoData"](v276);
            if (!v280) continue;
            if (
              !(v280["startsWith"]("/output/") || v280["startsWith"]("/data/"))
            )
              continue;
            const v281 = "gen|" + v271 + "|" + v273 + "|" + v280;
            if (this["_videoThumbPending"]["has"](v281)) continue;
            this["_videoThumbPending"]["add"](v281);
            let v282 = null;
            try {
              v282 = await v192["fetchVideoFirstFrameThumbFromServer"](v280, {
                nodeId: v271,
                assetId: String(v276["assetId"] || v276["thumbId"] || ""),
              });
            } catch {
              v282 = null;
            } finally {
              this["_videoThumbPending"]["delete"](v281);
            }
            if (v272 !== this["_resultThumbToken"]) return;
            const v283 = String(v282?.["thumbUrl"] || v282?.["url"] || "")[
              "trim"
            ]();
            if (!v283) continue;
            const v284 = v191["getState"]()["nodes"]?.[v271];
            if (!v284) return;
            const v285 = Array["isArray"](v284["videos"]) ? v284["videos"] : [],
              v286 = v285[v273];
            if (!v286 || typeof v286 !== "object") continue;
            const v287 = { ...v286 };
            if (!String(v287["thumbUrl"] || "")["trim"]() && v283)
              v287["thumbUrl"] = v283;
            const v288 = v285["slice"]();
            v288[v273] = v287;
            const v289 = { videos: v288 },
              v290 = Number(v284["mainVideoIndex"]),
              v291 = Number["isFinite"](v290)
                ? Math["max"](0, Math["trunc"](v290))
                : 0;
            if (v273 === v291) {
              if (!String(v284["thumbUrl"] || "")["trim"]() && v283)
                v289["thumbUrl"] = v283;
            }
            v191["updateNodeData"](v271, v289);
          }
        })();
      }
      {
        const v292 = this["nodeId"],
          v293 = ++this["_metaFetchToken"];
        (async () => {
          for (let v294 = 0; v294 < v270["length"]; v294++) {
            if (v293 !== this["_metaFetchToken"]) return;
            const v295 = v191["getState"]()["nodes"]?.[v292];
            if (!v295) return;
            const v296 = Array["isArray"](v295["videos"]) ? v295["videos"] : [],
              v297 = v296[v294];
            if (!v297 || typeof v297 !== "object") continue;
            const v298 = Number(v297["videoWidth"] || 0),
              v299 = Number(v297["videoHeight"] || 0);
            if (v298 > 0 && v299 > 0) continue;
            const v300 = this["_resolveVideoMetaSrcFromVideoData"](v297);
            if (!v300) continue;
            let v301 = null;
            try {
              v301 = await v192["fetchVideoMetaFromServer"](v300);
            } catch {
              v301 = null;
            }
            if (v293 !== this["_metaFetchToken"]) return;
            if (!v301 || v301["success"] !== true) continue;
            const v302 = Math["round"](Number(v301["width"]) || 0),
              v303 = Math["round"](Number(v301["height"]) || 0),
              v304 = Number(v301["duration"]);
            if (!(v302 > 0 && v303 > 0)) continue;
            const v305 = v191["getState"]()["nodes"]?.[v292];
            if (!v305) return;
            const v306 = Array["isArray"](v305["videos"]) ? v305["videos"] : [],
              v307 = v306[v294];
            if (!v307 || typeof v307 !== "object") continue;
            const v308 = Number(v307["videoWidth"] || 0),
              v309 = Number(v307["videoHeight"] || 0);
            if (v308 > 0 && v309 > 0) continue;
            const v310 = { ...v307, videoWidth: v302, videoHeight: v303 };
            Number["isFinite"](v304) &&
              v304 > 0 &&
              !(Number(v310["duration"]) > 0) &&
              (v310["duration"] = v304);
            const v311 = v306["slice"]();
            v311[v294] = v310;
            const v312 = { videos: v311 },
              v313 = Number(v305["mainVideoIndex"]),
              v314 = Number["isFinite"](v313)
                ? Math["max"](0, Math["trunc"](v313))
                : 0;
            if (v294 === v314) {
              ((v312["videoWidth"] = v302),
                (v312["videoHeight"] = v303),
                (v312["selectedVideoWidth"] = v302),
                (v312["selectedVideoHeight"] = v303));
              if (Number["isFinite"](v304) && v304 > 0)
                v312["videoDuration"] = v304;
            }
            v191["updateNodeData"](v292, v312);
          }
        })();
      }
    }
    ["_finalizeVideoSuccessSideEffects"](v315, v316) {
      (this["_scheduleDreaminaResultEnrichment"](v315),
        this["_dispatchGenerationHistoryVideos"](v315, v316));
      const v317 = v315["find"]((v318) => v318?.["saveError"])?.["saveError"];
      v317 &&
        window["showToast"]?.(
          "视频已生成，但本地保存到 output 失败：" + v317,
          "warning",
        );
    }
    ["_finalizeDreaminaSuccessResult"](v319, v320, v321 = null, v322 = {}) {
      const v323 = this["_applyDreaminaSuccessResult"](v319, v320, v321, {
          writeStore: v322["writeStore"] !== false,
          returnPatch: v322["returnPatch"] === true,
        }),
        v324 = Array["isArray"](v323) ? v323 : v323?.["videos"] || [];
      return (
        this["_finalizeVideoSuccessSideEffects"](v324, v320),
        v322["returnPatch"] === true
          ? { ...(v323 && !Array["isArray"](v323) ? v323 : {}), videos: v324 }
          : v324
      );
    }
    ["_dispatchGenerationHistoryVideos"](v325, v326) {
      if (
        typeof window === "undefined" ||
        typeof window["dispatchEvent"] !== "function"
      )
        return;
      const v327 = Array["isArray"](v325)
        ? v325["filter"](
            (v328) => v328 && typeof v328 === "object" && !v328["error"],
          )
        : [];
      if (v327["length"] === 0) return;
      const v329 =
        v191["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {};
      try {
        window["dispatchEvent"](
          new CustomEvent(GENERATION_HISTORY_EVENT, {
            detail: {
              kind: "video",
              sourceNodeId: this["nodeId"],
              nodeData: v329,
              videos: v327,
              startedAt: v326,
              createdAt: Date["now"](),
            },
          }),
        );
      } catch {}
    }
    async ["_maybeResumeDreaminaTaskImpl"]() {
      const v330 = v204()["nodes"]?.[this["nodeId"]] || this["_data"] || {};
      if (!this["_isDreaminaVideoNode"](v330)) {
        this["_stopDreaminaRecovery"](false);
        return;
      }
      if (!this["_isDreaminaRecoverableRunningTask"](v330)) {
        this["_stopDreaminaRecovery"](false);
        return;
      }
      const v331 = String(v330?.["dreaminaSubmitId"] || "")["trim"]();
      if (!v331) {
        this["_stopDreaminaRecovery"](false);
        return;
      }
      if (this["_dreaminaResumeSubmitId"] === v331) return;
      this["_stopDreaminaRecovery"](false);
      const v332 = Number(
        v330?.["dreaminaTaskStartedAt"] ||
          v330?.["generationStartTime"] ||
          Date["now"](),
      );
      this["_dreaminaResumeSubmitId"] = v331;
      const v333 = (async () => {
        let v334 = null;
        try {
          ((v334 = new AbortController()),
            (this["_dreaminaResumeAbortController"] = v334),
            (this["_isGenerating"] = true),
            this["_setGenerateButtonBusyUi"]({ cancellable: false }),
            v194(this["previewEl"]));
          const v335 = resolveDreaminaStyleVideoProvider(
              v330?.["model"],
              v330?.["provider"],
            ),
            v336 = await resumeTask(
              {
                sourceNodeId: this["nodeId"],
                targetNodeId: this["nodeId"],
                trigger: "node",
                taskType: "video-generation",
                provider: v335 || "dreamina",
                adapterType: v335 === "dreamina" ? "localRuntime" : "modelApi",
                modelId: v330?.["model"] || "",
                executionId: (v335 || "dreamina") + ".video.cli",
                payload: {
                  ...v330,
                  provider: v335 || v330?.["provider"] || "dreamina",
                  model:
                    v335 === "apimart"
                      ? v330?.["model"] || APIMART_DREAMINA_VIDEO_DEFAULT_MODEL
                      : v330?.["model"] || "",
                },
                taskId: v331,
                cancellable: false,
                resumable: true,
                startBuilder: () => ({
                  ...this["_buildDreaminaTaskPatch"](
                    this["_buildDreaminaPendingSnapshot"]({
                      submitId: v331,
                      phase: "generating",
                      label:
                        String(v330?.["dreaminaTaskLabel"] || "")["trim"]() ||
                        "生成中",
                      raw: v330?.["dreaminaTaskLastRaw"] || {},
                    }),
                    { recovering: true, startedAt: v332 },
                  ),
                }),
                onTaskStart: () => {
                  this["_persistDreaminaResumeCache"]();
                },
                poll: async ({ payload: v337 }) => {
                  if (v335 && v335 !== "dreamina")
                    return v192["resumeAsyncVideoTask"](v331, v337, {
                      signal: v334["signal"],
                    });
                  return v192["resumeDreaminaVideoTask"](v331, {
                    signal: v334["signal"],
                    intervalMs: v202,
                    maxWaitMs: v203,
                    onProgress: async (v338) => {
                      if (v334["signal"]["aborted"]) return;
                      this["_applyDreaminaTaskSnapshot"](v338, {
                        recovering: true,
                        startedAt: v332,
                      });
                    },
                  });
                },
                resultBuilder: async (v339, v340) => {
                  const v341 = v339?.["dreaminaSnapshot"] || null,
                    v342 = this["_applyDreaminaSuccessResult"](
                      v339,
                      v340["startedAt"],
                      v341,
                      { writeStore: false, returnPatch: true },
                    );
                  return v342?.["patch"] || {};
                },
                failureBuilder: (v343, v344) => {
                  if (this["_isDreaminaPollTimeoutError"](v343)) {
                    const v345 =
                      this["_buildDreaminaBackgroundPendingSnapshot"](v331);
                    return Object["assign"](
                      {
                        isGenerating: true,
                        jobStatus: "running",
                        jobError: null,
                        generationDuration: Date["now"]() - v344["startedAt"],
                      },
                      this["_buildDreaminaTaskPatch"](v345, {
                        recovering: false,
                        startedAt: v344["startedAt"],
                      }),
                    );
                  }
                  const v346 = v343?.["dreaminaSnapshot"] || null,
                    v347 =
                      v343?.["message"] ||
                      v346?.["failReason"] ||
                      v346?.["label"] ||
                      "查询失败";
                  return Object["assign"](
                    buildVideoGenerationFailurePatch({
                      error: v347,
                      startedAt: v344["startedAt"],
                    }),
                    v346
                      ? this["_buildDreaminaTaskPatch"](v346, {
                          recovering: false,
                          startedAt: v344["startedAt"],
                        })
                      : this["_buildDreaminaTaskPatch"](
                          this["_buildDreaminaFailedSnapshot"](v331, v347),
                          { recovering: false, startedAt: v344["startedAt"] },
                        ),
                  );
                },
                cancelledBuilder: (v348) =>
                  Object["assign"](
                    { generationDuration: Date["now"]() - v348["startedAt"] },
                    this["_buildDreaminaTaskPatch"](
                      this["_buildDreaminaPendingSnapshot"]({
                        submitId: v331,
                        phase: "generating",
                        label:
                          String(v330?.["dreaminaTaskLabel"] || "")["trim"]() ||
                          "生成中",
                        raw: v330?.["dreaminaTaskLastRaw"] || {},
                      }),
                      { recovering: false, startedAt: v348["startedAt"] },
                    ),
                  ),
                parseError: (v349) => v349?.["message"] || "查询失败",
              },
              { store: v191, startedAt: v332, abortController: v334 },
            );
          if (v336["status"] === "pending") {
            this["_persistDreaminaResumeCache"]();
            return;
          }
          if (v336["status"] === "success") {
            const v350 = normalizeVideoGenerationResult(v336["result"])[
              "items"
            ];
            this["_finalizeVideoSuccessSideEffects"](v350, v332);
          }
          (v336["status"] === "failed" &&
            this["_isDreaminaPollTimeoutError"](v336["error"]) &&
            window["showToast"]?.("即梦排队较久，已转为后台查询", "warning"),
            this["_persistDreaminaResumeCache"]());
        } catch (v351) {
          if (
            v334?.["signal"]?.["aborted"] ||
            v351?.["message"] === "CANCELLED" ||
            v351?.["name"] === "AbortError"
          )
            return;
          const v352 = v351?.["message"] || "查询失败",
            v353 = this["_buildDreaminaFailedSnapshot"](v331, v352);
          (v191["updateNodeData"](
            this["nodeId"],
            Object["assign"](
              buildVideoGenerationFailurePatch({
                error: v352,
                startedAt: v332,
              }),
              this["_buildDreaminaTaskPatch"](v353, {
                recovering: false,
                startedAt: v332,
              }),
            ),
          ),
            this["_persistDreaminaResumeCache"]());
        } finally {
          v334 &&
            this["_dreaminaResumeAbortController"] === v334 &&
            (this["_dreaminaResumeAbortController"] = null);
          this["_dreaminaResumeSubmitId"] === v331 &&
            (this["_dreaminaResumeSubmitId"] = "");
          this["_dreaminaResumePromise"] = null;
          const v354 = this["_syncLocalTaskNodeData"](),
            v355 =
              shouldShowGenerationBusyUi(v354) ||
              this["_shouldKeepDreaminaLoading"](v354);
          ((this["_isGenerating"] = v355),
            v355
              ? this["_updateSubmitButtonState"]?.()
              : (this["_resetGenerateButtonIdleUi"]({ cancellable: false }),
                v195(this["previewEl"]),
                this["_updateSubmitButtonState"]?.()));
        }
      })();
      this["_dreaminaResumePromise"] = v333;
    }
    async ["_maybeResumeRunningHubTaskImpl"]() {
      const v356 = v204()["nodes"]?.[this["nodeId"]] || this["_data"] || {};
      if (
        !this["_isRunninghubWorkflowModel"](v356?.["model"], v356?.["provider"])
      ) {
        this["_stopRunningHubRecovery"](false);
        return;
      }
      if (!this["_isRunningHubRecoverableRunningTask"](v356)) {
        this["_stopRunningHubRecovery"](false);
        return;
      }
      const v357 = String(v356?.["rhTaskId"] || "")["trim"]();
      if (!v357) {
        this["_stopRunningHubRecovery"](false);
        return;
      }
      if (this["_rhResumeTaskId"] === v357 && this["_rhResumePromise"]) return;
      this["_stopRunningHubRecovery"](false);
      const v358 = Number(
          v356?.["rhTaskStartedAt"] ||
            v356?.["generationStartTime"] ||
            Date["now"](),
        ),
        v359 = v356?.["rhTaskUseOpenapiQuery"] === true;
      this["_rhResumeTaskId"] = v357;
      const v360 = (async () => {
        let v361 = null;
        try {
          const v362 = await this["_buildPayload"]();
          if (!v362) return;
          ((v361 = new AbortController()),
            (this["_rhResumeAbortController"] = v361),
            (this["_rhAbortController"] = v361),
            (this["_rhTaskId"] = v357),
            (this["_rhApiKey"] =
              String(v362?.["apiKey"] || "")["trim"]() ||
              this["_rhApiKey"] ||
              null),
            (this["_rhCancelRequested"] = false),
            (this["_rhRemoteCancelSent"] = false),
            (this["_isGenerating"] = true),
            this["_setGenerateButtonBusyUi"]({ cancellable: true }),
            v194(this["previewEl"]));
          const v363 = await resumeTask(
            {
              sourceNodeId: this["nodeId"],
              targetNodeId: this["nodeId"],
              trigger: "node",
              taskType: "video-generation",
              provider:
                v362["provider"] || v356?.["provider"] || "runninghubwf",
              adapterType: "workflow",
              modelId: v362["model"] || v356?.["model"] || "",
              executionId:
                "runninghub.video." +
                (v362["model"] || v356?.["model"] || "workflow"),
              payload: v362,
              taskId: v357,
              cancellable: true,
              resumable: true,
              pauseOnAbort: true,
              startBuilder: () => ({
                rhStatusMessage: null,
                rhStatusCode: null,
                rhTaskUseOpenapiQuery: v359,
              }),
              onTaskStart: () => {
                this["_persistRunningHubResumeCache"]();
              },
              poll: async () =>
                v192["resumeRunningHubVideoTask"](v357, v362, {
                  signal: v361["signal"],
                  useOpenapiQuery: v359,
                }),
              resultBuilder: async (v364, v365) => {
                const v366 = this["_applyDreaminaSuccessResult"](
                  v364,
                  v365["startedAt"],
                  null,
                  { writeStore: false, returnPatch: true },
                );
                return {
                  ...(v366?.["patch"] || {}),
                  rhStatusMessage: null,
                  rhStatusCode: null,
                  ...this["_buildRunningHubTaskPatch"]({
                    taskId: v357,
                    status: "success",
                    startedAt: v365["startedAt"],
                    recovering: false,
                    useOpenapiQuery: v359,
                  }),
                };
              },
              failureBuilder: (v367, v368) => ({
                ...buildVideoGenerationFailurePatch({
                  error: v367?.["message"] || "生成失败",
                  startedAt: v368["startedAt"],
                  duration: Date["now"]() - v368["startedAt"],
                }),
                rhStatusMessage: v367?.["message"] || "生成失败",
                rhStatusCode: Number["isFinite"](Number(v367?.["code"]))
                  ? Number(v367["code"])
                  : null,
                ...this["_buildRunningHubTaskPatch"]({
                  taskId: v357,
                  status: "failed",
                  startedAt: v368["startedAt"],
                  recovering: false,
                  useOpenapiQuery: v359,
                }),
              }),
              cancelledBuilder: (v369) => ({
                videos: [],
                videoUrl: "",
                localPath: "",
                generationDuration: Date["now"]() - v369["startedAt"],
                rhStatusMessage: "生成已中断",
                rhStatusCode: null,
                ...this["_buildRunningHubTaskPatch"]({
                  taskId: v357,
                  status: "cancelled",
                  startedAt: v369["startedAt"],
                  recovering: false,
                  useOpenapiQuery: v359,
                }),
              }),
              parseError: (v370) => v370?.["message"] || "生成失败",
            },
            { store: v191, startedAt: v358, abortController: v361 },
          );
          if (v363["status"] === "pending") {
            this["_persistRunningHubResumeCache"]();
            return;
          }
          if (v363["status"] === "success") {
            const v371 = normalizeVideoGenerationResult(v363["result"])[
              "items"
            ];
            this["_finalizeVideoSuccessSideEffects"](v371, v358);
          }
          this["_persistRunningHubResumeCache"]();
        } catch (v372) {
          if (
            v361?.["signal"]?.["aborted"] ||
            v372?.["message"] === "CANCELLED" ||
            v372?.["name"] === "AbortError"
          )
            return;
          (v191["updateNodeData"](this["nodeId"], {
            generationDuration: Math["max"](0, Date["now"]() - v358),
            rhStatusMessage: v372?.["message"] || "生成失败",
            rhStatusCode: Number["isFinite"](Number(v372?.["code"]))
              ? Number(v372["code"])
              : null,
            ...this["_buildRunningHubTaskPatch"]({
              taskId: v357,
              status: "failed",
              startedAt: v358,
              recovering: false,
              useOpenapiQuery: v359,
            }),
          }),
            this["_persistRunningHubResumeCache"]());
        } finally {
          v361 &&
            this["_rhResumeAbortController"] === v361 &&
            (this["_rhResumeAbortController"] = null);
          v361 &&
            this["_rhAbortController"] === v361 &&
            (this["_rhAbortController"] = null);
          this["_rhResumeTaskId"] === v357 && (this["_rhResumeTaskId"] = "");
          this["_rhResumePromise"] = null;
          const v373 = this["_syncLocalTaskNodeData"](),
            v374 = shouldShowGenerationBusyUi(v373);
          this["_isGenerating"] = v374;
          if (v374)
            this["_rhTaskId"] = String(v373?.["rhTaskId"] || v357 || "")[
              "trim"
            ]();
          else {
            this["_rhTaskId"] = null;
            if (!this["_rhCancelRequested"]) this["_rhApiKey"] = null;
            (this["_resetGenerateButtonIdleUi"]({ cancellable: true }),
              v195(this["previewEl"]));
          }
          this["_updateSubmitButtonState"]();
        }
      })();
      this["_rhResumePromise"] = v360;
    }
    async ["_maybeResumeAsyncTaskImpl"]() {
      const v375 = v204()["nodes"]?.[this["nodeId"]] || this["_data"] || {};
      if (this["_isGenerating"] && v375?.["asyncTaskRecovering"] !== true)
        return;
      if (!this["_isAsyncRecoverableRunningTask"](v375)) {
        this["_stopAsyncRecovery"](false);
        return;
      }
      const v376 = String(v375?.["asyncTaskId"] || "")["trim"]();
      if (!v376) {
        this["_stopAsyncRecovery"](false);
        return;
      }
      if (this["_asyncResumeTaskId"] === v376 && this["_asyncResumePromise"])
        return;
      this["_stopAsyncRecovery"](false);
      const v377 = Number(
          v375?.["asyncTaskStartedAt"] ||
            v375?.["generationStartTime"] ||
            Date["now"](),
        ),
        v378 = this["_inferAsyncProviderFromModel"](
          v375?.["model"],
          v375?.["asyncTaskProvider"] || v375?.["provider"] || "",
        );
      this["_asyncResumeTaskId"] = v376;
      const v379 = (async () => {
        let v380 = null;
        try {
          const v381 = await this["_buildResumePayload"](v375, {
            providerHint: v378,
          });
          if (!v381) return;
          ((v380 = new AbortController()),
            (this["_asyncResumeAbortController"] = v380),
            (this["_isGenerating"] = true),
            this["_setGenerateButtonBusyUi"]({ cancellable: false }),
            v194(this["previewEl"]));
          const v382 = await resumeTask(
            {
              sourceNodeId: this["nodeId"],
              targetNodeId: this["nodeId"],
              trigger: "node",
              taskType: "video-generation",
              provider: v378 || v381["provider"] || v375?.["provider"] || "",
              adapterType: "modelApi",
              modelId: v381["model"] || v375?.["model"] || "",
              executionId:
                (v378 || v381["provider"] || "model") + ".video.async",
              payload: v381,
              taskId: v376,
              async: true,
              cancellable: false,
              resumable: true,
              pauseOnAbort: true,
              startBuilder: () =>
                this["_buildAsyncTaskPatch"]({
                  provider: v378,
                  kind: "video",
                  taskId: v376,
                  status: "running",
                  startedAt: v377,
                  recovering: true,
                }),
              onTaskStart: () => {
                this["_persistAsyncResumeCache"]();
              },
              poll: async () =>
                v192["resumeAsyncVideoTask"](v376, v381, {
                  signal: v380["signal"],
                }),
              resultBuilder: async (v383, v384) => {
                const v385 = this["_applyDreaminaSuccessResult"](
                  v383,
                  v384["startedAt"],
                  null,
                  { writeStore: false, returnPatch: true },
                );
                return {
                  ...(v385?.["patch"] || {}),
                  ...this["_buildAsyncTaskPatch"]({
                    provider: v378,
                    kind: "video",
                    taskId: v376,
                    status: "success",
                    startedAt: v384["startedAt"],
                    recovering: false,
                  }),
                };
              },
              failureBuilder: (v386, v387) => ({
                ...buildVideoGenerationFailurePatch({
                  error: v386?.["message"] || "生成失败",
                  startedAt: v387["startedAt"],
                  duration: Math["max"](0, Date["now"]() - v387["startedAt"]),
                }),
                ...this["_buildAsyncTaskPatch"]({
                  provider: v378,
                  kind: "video",
                  taskId: v376,
                  status: "failed",
                  startedAt: v387["startedAt"],
                  recovering: false,
                }),
              }),
              cancelledBuilder: (v388) => ({
                videos: [],
                videoUrl: "",
                localPath: "",
                generationDuration: Date["now"]() - v388["startedAt"],
                ...this["_buildAsyncTaskPatch"]({
                  provider: v378,
                  kind: "video",
                  taskId: v376,
                  status: "cancelled",
                  startedAt: v388["startedAt"],
                  recovering: false,
                }),
              }),
              parseError: (v389) => v389?.["message"] || "生成失败",
            },
            { store: v191, startedAt: v377, abortController: v380 },
          );
          if (v382["status"] === "pending") {
            this["_persistAsyncResumeCache"]();
            return;
          }
          if (v382["status"] === "success") {
            const v390 = normalizeVideoGenerationResult(v382["result"])[
              "items"
            ];
            this["_finalizeVideoSuccessSideEffects"](v390, v377);
          }
          this["_persistAsyncResumeCache"]();
        } catch (v391) {
          if (
            v380?.["signal"]?.["aborted"] ||
            v391?.["message"] === "CANCELLED" ||
            v391?.["name"] === "AbortError"
          )
            return;
          (v191["updateNodeData"](this["nodeId"], {
            ...buildVideoGenerationFailurePatch({
              error: v391?.["message"] || "生成失败",
              startedAt: v377,
              duration: Math["max"](0, Date["now"]() - v377),
            }),
            ...this["_buildAsyncTaskPatch"]({
              provider: v378,
              kind: "video",
              taskId: v376,
              status: "failed",
              startedAt: v377,
              recovering: false,
            }),
          }),
            this["_persistAsyncResumeCache"]());
        } finally {
          v380 &&
            this["_asyncResumeAbortController"] === v380 &&
            (this["_asyncResumeAbortController"] = null);
          this["_asyncResumeTaskId"] === v376 &&
            (this["_asyncResumeTaskId"] = "");
          this["_asyncResumePromise"] = null;
          const v392 = this["_syncLocalTaskNodeData"](),
            v393 = shouldShowGenerationBusyUi(v392);
          ((this["_isGenerating"] = v393),
            !v393 &&
              (this["_resetGenerateButtonIdleUi"]({ cancellable: false }),
              v195(this["previewEl"])),
            this["_updateSubmitButtonState"]());
        }
      })();
      this["_asyncResumePromise"] = v379;
    }
    async ["_handleGenerateOrCancelImpl"](v394 = null) {
      const v395 =
          v191["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {},
        v396 = this["_isRunninghubWorkflowModel"](
          v395?.["model"],
          v395?.["provider"],
        );
      !v396 &&
        this["_dreaminaResumePromise"] &&
        this["_stopDreaminaRecovery"](true);
      !v396 && this["_asyncResumePromise"] && this["_stopAsyncRecovery"](true);
      if (
        shouldAllowCancel(v395, {
          cancellable: v396,
          cancelInFlight: this["_rhCancelInFlight"] === true,
        })
      ) {
        await this["_cancelRunningHubWorkflowTask"]();
        return;
      }
      await this["_onGenerate"](v394);
    }
    async ["_cancelRunningHubWorkflowTaskImpl"]() {
      const v397 =
          v191["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {},
        v398 = this["_rhApiKey"] || "",
        v399 =
          String(this["_rhTaskId"] || "")["trim"]() ||
          String(v397?.["rhTaskId"] || "")["trim"](),
        v400 = Date["now"](),
        v401 = Number(v397?.["generationStartTime"]),
        v402 =
          v397?.["generationDuration"] != null
            ? v397["generationDuration"]
            : Number["isFinite"](v401) && v401 > 0
              ? Math["max"](0, v400 - v401)
              : 0;
      this["_rhCancelRequested"] = true;
      this["_rhAbortController"] &&
        !this["_rhAbortController"]["signal"]["aborted"] &&
        this["_rhAbortController"]["abort"]();
      const v403 = !v398,
        v404 = !v399;
      try {
        this["_rhRemoteCancelSent"] = !v403 && !v404;
        const v405 = ({
          remoteResult: v406,
          remoteError: v407,
          startedAt: v408,
        }) => {
          const v409 = Number(v406?.["code"]),
            v410 = v403
              ? "取消失败：缺少\x20API\x20Key"
              : v404
                ? "生成已中断：任务尚未返回 ID"
                : "",
            v411 =
              v410 ||
              (v407
                ? v407["message"] || "取消失败"
                : v409 === 0
                  ? "取消成功"
                  : v409 === 807
                    ? "任务不存在"
                    : v406?.["msg"] || "取消失败");
          return {
            rhStatusMessage: v411,
            rhStatusCode: v404 ? 813 : Number["isFinite"](v409) ? v409 : null,
            videos: [],
            videoUrl: "",
            localPath: "",
            generationDuration: v402,
            ...this["_buildRunningHubTaskPatch"]({
              taskId: v399,
              status: "cancelled",
              startedAt: Number(
                v408 ||
                  v397?.["rhTaskStartedAt"] ||
                  v397?.["generationStartTime"] ||
                  0,
              ),
              recovering: false,
              useOpenapiQuery: v397?.["rhTaskUseOpenapiQuery"] === true,
            }),
          };
        };
        (await cancelTask(this["nodeId"], {
          store: v191,
          taskId: v399,
          cancellable: true,
          cancel: ({ taskId: v412 }) => {
            if (!v398) throw new Error("取消失败：缺少 API Key");
            return v192["cancelRunningHubWorkflowTask"]({
              apiKey: v398,
              taskId: v412,
            });
          },
          cancelledBuilder: v405,
          spec: {
            sourceNodeId: this["nodeId"],
            targetNodeId: this["nodeId"],
            trigger: "node",
            taskType: "video-generation",
            provider: v397?.["provider"] || "runninghubwf",
            adapterType: "workflow",
            modelId: v397?.["model"] || "",
            executionId: "runninghub.video." + (v397?.["model"] || "workflow"),
            payload: v397,
            cancellable: true,
            resumable: true,
            resultBuilder: () => ({}),
            cancelledBuilder: v405,
          },
        }),
          this["_persistRunningHubResumeCache"]());
      } finally {
        ((this["_isGenerating"] = false),
          (this["_rhAbortController"] = null),
          (this["_rhTaskId"] = null),
          (this["_rhApiKey"] = null),
          (this["_rhRemoteCancelSent"] = false),
          this["_stopRunningHubRecovery"](true),
          this["_resetGenerateButtonIdleUi"]({ cancellable: true }),
          v195(this["previewEl"]),
          this["_updateSubmitButtonState"]());
      }
    }
    ["_setGenerateButtonBusyUi"]({ cancellable: cancellable = false } = {}) {
      if (!this["btnEl"]) return;
      if (cancellable) {
        setGenerateButtonCancellableUi(this["btnEl"], {
          title: VIDEO_CANCEL_TOOLTIP,
          tooltip: VIDEO_CANCEL_TOOLTIP,
          ariaLabel: "取消生成视频",
          color: "var(--red)",
          busy: true,
        });
        return;
      }
      setGenerateButtonLoadingUi(this["btnEl"], {
        title: VIDEO_GENERATE_TITLE,
        disabled: true,
        ariaLabel: VIDEO_GENERATE_TITLE,
      });
    }
    ["_resetGenerateButtonIdleUi"]({ cancellable: cancellable = false } = {}) {
      if (!this["btnEl"]) return;
      resetGenerateButtonIdleUi(this["btnEl"], VIDEO_GENERATE_TITLE);
      if (cancellable) {
        (this["btnEl"]["removeAttribute"]("title"),
          this["btnEl"]["setAttribute"]("data-tooltip", VIDEO_CANCEL_TOOLTIP));
        return;
      }
      (this["btnEl"]["removeAttribute"]("data-tooltip"),
        (this["btnEl"]["title"] = VIDEO_GENERATE_TITLE));
    }
    ["_getPreviewGenerateButtonLoadingOptions"]() {
      return createPreviewGenerateButtonCallbacks(this, VIDEO_GENERATE_TITLE);
    }
    async ["_onGenerateImpl"](v413 = null, v414 = {}) {
      if (this["_isGenerating"]) return;
      if (v414?.["insertPrompt"] === true) {
        (insertPresetPromptIntoEditor({
          storeApi: v191,
          nodeId: this["nodeId"],
          promptEl: this["promptEl"],
          template: v413,
          inEdges: v191["getIncomingEdges"](this["nodeId"]),
          nodes: v191["getState"]()["nodes"] || {},
          allowedAssetTypes: ["text", "image", "video", "audio"],
        }),
          this["_updateSubmitButtonState"]?.());
        return;
      }
      if (shouldUsePromptPreviewForPreset(v413)) {
        const v415 = await this["_buildPayload"](v413);
        if (!v415) return;
        previewPresetPromptInEditor({
          storeApi: v191,
          nodeId: this["nodeId"],
          promptEl: this["promptEl"],
          promptText: v415["prompt"],
        });
        return;
      }
      if (isPreviewModeEnabled()) {
        !isPreviewNodeLoading(this["nodeId"]) &&
          startPreviewNodeLoading(
            this["nodeId"],
            this["previewEl"],
            this["_getPreviewGenerateButtonLoadingOptions"](),
          );
        return;
      }
      const v416 = String(this["_data"]?.["model"] || "")["trim"](),
        v417 = String(this["_data"]?.["provider"] || "")["trim"]();
      await v199(v416, v417);
      if (!this["_guardVipSelection"](this["_data"]?.["model"] || "", v417))
        return;
      if (typeof window["ensureSubscriptionInstallId"] === "function")
        try {
          await window["ensureSubscriptionInstallId"]();
        } catch {}
      const v418 = await this["_buildPayload"](v413);
      if (!v418) return;
      const v419 = String(v418["model"] || "")["trim"]();
      if (
        v198(v419, v418["provider"]) &&
        !String(v418["installId"] || "")["trim"]()
      ) {
        window["showToast"]?.(
          "缺少\x20installId，无法校验订阅，请刷新后重试",
          "error",
        );
        return;
      }
      const v420 = this["_isRunninghubWorkflowModel"](
          v418["model"],
          v418["provider"],
        ),
        v421 = this["_isDreaminaVideoNode"](v418),
        v422 = String(v418?.["provider"] || this["_data"]?.["provider"] || "")
          ["trim"]()
          ["toLowerCase"](),
        v423 = !v420 && !v421;
      v421 && this["_stopDreaminaRecovery"](true);
      v420 && this["_stopRunningHubRecovery"](true);
      v423 && this["_stopAsyncRecovery"](true);
      this["_rhGenToken"] = (this["_rhGenToken"] || 0) + 1;
      const v424 = this["_rhGenToken"];
      ((this["_rhCancelRequested"] = false),
        (this["_rhRemoteCancelSent"] = false),
        (this["_rhApiKey"] = v420 ? v418["apiKey"] : null),
        (this["_rhTaskId"] = null),
        (this["_rhAbortController"] = v420 ? new AbortController() : null),
        (this["_isGenerating"] = true),
        this["_setGenerateButtonBusyUi"]({ cancellable: v420 }),
        v194(this["previewEl"]));
      const v425 = Date["now"](),
        v426 = {
          ...buildGenerationStartPatch({ startedAt: v425 }),
          generationStartTime: v425,
          generationDuration: null,
          rhStatusMessage: null,
          rhStatusCode: null,
        };
      v421 &&
        (Object["assign"](v426, {
          dreaminaSubmitId: "",
          dreaminaTaskStatus: "pending",
          dreaminaTaskPhase: "generating",
          dreaminaTaskLabel: "提交中",
          dreaminaTaskStartedAt: v425,
          dreaminaTaskLastCheckedAt: null,
          dreaminaTaskLastRaw: {},
          dreaminaTaskRecovering: false,
        }),
        Object["assign"](v426, {
          ...this["_buildRunningHubTaskPatch"]({
            taskId: "",
            status: "idle",
            startedAt: 0,
            recovering: false,
            useOpenapiQuery: false,
          }),
          ...this["_buildAsyncTaskPatch"]({
            provider: "",
            kind: "video",
            taskId: "",
            status: "idle",
            startedAt: 0,
            recovering: false,
          }),
        }));
      v420 &&
        (Object["assign"](v426, {
          rhTaskId: "",
          rhTaskStatus: "pending",
          rhTaskStartedAt: v425,
          rhTaskRecovering: false,
          rhTaskUseOpenapiQuery: false,
        }),
        Object["assign"](v426, {
          dreaminaSubmitId: "",
          dreaminaTaskStatus: "idle",
          dreaminaTaskPhase: "done",
          dreaminaTaskLabel: "",
          dreaminaTaskStartedAt: 0,
          dreaminaTaskLastCheckedAt: null,
          dreaminaTaskLastRaw: {},
          dreaminaTaskRecovering: false,
          ...this["_buildAsyncTaskPatch"]({
            provider: "",
            kind: "video",
            taskId: "",
            status: "idle",
            startedAt: 0,
            recovering: false,
          }),
        }));
      v423 &&
        (Object["assign"](
          v426,
          this["_buildAsyncTaskPatch"]({
            provider: v422,
            kind: "video",
            taskId: "",
            status: "pending",
            startedAt: v425,
            recovering: false,
          }),
        ),
        Object["assign"](v426, {
          ...this["_buildRunningHubTaskPatch"]({
            taskId: "",
            status: "idle",
            startedAt: 0,
            recovering: false,
            useOpenapiQuery: false,
          }),
          dreaminaSubmitId: "",
          dreaminaTaskStatus: "idle",
          dreaminaTaskPhase: "done",
          dreaminaTaskLabel: "",
          dreaminaTaskStartedAt: 0,
          dreaminaTaskLastCheckedAt: null,
          dreaminaTaskLastRaw: {},
          dreaminaTaskRecovering: false,
        }));
      try {
        const v427 = await submitTask(
          {
            sourceNodeId: this["nodeId"],
            targetNodeId: this["nodeId"],
            trigger: "node",
            taskType: "video-generation",
            provider:
              v418["provider"] || v422 || this["_data"]?.["provider"] || "",
            adapterType: v420 ? "workflow" : "modelApi",
            modelId: v418["model"] || this["_data"]?.["model"] || "",
            executionId:
              "video." +
              (v418["provider"] || v422 || "modelApi") +
              "." +
              (v418["model"] || "default"),
            payload: v418,
            cancellable: v420,
            resumable: v421 || v420 || v423,
            async: v423,
            startBuilder: () => v426,
            onTaskStart: () => {
              this["_syncLocalTaskNodeData"]();
              if (v421) this["_persistDreaminaResumeCache"]();
              if (v420) this["_persistRunningHubResumeCache"]();
              if (v423) this["_persistAsyncResumeCache"]();
            },
            submit: async (v428, v429 = {}) =>
              v192["generateVideo"](v418, {
                ...(v420
                  ? { signal: this["_rhAbortController"]["signal"] }
                  : {}),
                ...(v421 ? { maxWaitMs: v201 } : {}),
                onTaskMeta: ({
                  taskId: v430,
                  useOpenapiQuery: v431,
                  provider: v432,
                }) => {
                  if (v424 !== this["_rhGenToken"]) return;
                  const v433 = String(v430 || "")["trim"]();
                  if (!v433) return;
                  if (v420) {
                    ((this["_rhTaskId"] = v433),
                      v429["onTaskId"]?.(v433),
                      v191["updateNodeData"](this["nodeId"], {
                        rhStatusMessage: null,
                        rhStatusCode: null,
                        rhTaskUseOpenapiQuery: v431 === true,
                      }),
                      this["_syncLocalTaskNodeData"](),
                      this["_persistRunningHubResumeCache"]());
                    return;
                  }
                  if (v421) {
                    const v434 = this["_buildDreaminaPendingSnapshot"]({
                      submitId: v433,
                      phase: "generating",
                      label: "生成中",
                    });
                    (this["_applyDreaminaTaskSnapshot"](v434, {
                      recovering: false,
                      startedAt: v425,
                    }),
                      v429["onTaskId"]?.(v433));
                    return;
                  }
                  v423 &&
                    (v429["onTaskId"]?.(v433),
                    v191["updateNodeData"](this["nodeId"], {
                      asyncTaskProvider: String(
                        v432 || v422 || this["_data"]?.["provider"] || "",
                      )
                        ["trim"]()
                        ["toLowerCase"](),
                      asyncTaskKind: "video",
                    }),
                    this["_syncLocalTaskNodeData"](),
                    this["_persistAsyncResumeCache"]());
                },
                onTaskId: (v435) => {
                  if (v424 !== this["_rhGenToken"]) return;
                  const v436 = String(v435 || "")["trim"]();
                  if (!v436) return;
                  if (v421) {
                    const v437 = this["_buildDreaminaPendingSnapshot"]({
                      submitId: v436,
                      phase: "generating",
                      label: "生成中",
                    });
                    (this["_applyDreaminaTaskSnapshot"](v437, {
                      recovering: false,
                      startedAt: v425,
                    }),
                      v429["onTaskId"]?.(v436));
                    return;
                  }
                  if (v420) {
                    ((this["_rhTaskId"] = v436),
                      v429["onTaskId"]?.(v436),
                      v191["updateNodeData"](this["nodeId"], {
                        rhStatusMessage: null,
                        rhStatusCode: null,
                        rhTaskUseOpenapiQuery:
                          v191["getState"]()["nodes"]?.[this["nodeId"]]?.[
                            "rhTaskUseOpenapiQuery"
                          ] === true,
                      }),
                      this["_syncLocalTaskNodeData"](),
                      this["_persistRunningHubResumeCache"]());
                    const v438 = this["_rhApiKey"] || "";
                    this["_rhCancelRequested"] &&
                      !this["_rhRemoteCancelSent"] &&
                      v438 &&
                      v436 &&
                      ((this["_rhRemoteCancelSent"] = true),
                      (async () => {
                        if (v424 !== this["_rhGenToken"]) return;
                        const v439 = ({
                          remoteResult: v440,
                          remoteError: v441,
                        }) => {
                          const v442 = Number(v440?.["code"]),
                            v443 = v441
                              ? v441["message"] || "取消失败"
                              : v442 === 0
                                ? "取消成功"
                                : v442 === 807
                                  ? "任务不存在"
                                  : v440?.["msg"] || "取消失败";
                          return {
                            rhStatusMessage: v443,
                            rhStatusCode: Number["isFinite"](v442)
                              ? v442
                              : null,
                            videos: [],
                            videoUrl: "",
                            localPath: "",
                            ...this["_buildRunningHubTaskPatch"]({
                              taskId: v436,
                              status: "cancelled",
                              startedAt: v425,
                              recovering: false,
                              useOpenapiQuery:
                                v191["getState"]()["nodes"]?.[this["nodeId"]]?.[
                                  "rhTaskUseOpenapiQuery"
                                ] === true,
                            }),
                          };
                        };
                        await cancelTask(this["nodeId"], {
                          store: v191,
                          taskId: v436,
                          cancellable: true,
                          cancel: ({ taskId: v444 }) =>
                            v192["cancelRunningHubWorkflowTask"]({
                              apiKey: v438,
                              taskId: v444,
                            }),
                          cancelledBuilder: v439,
                          spec: {
                            sourceNodeId: this["nodeId"],
                            targetNodeId: this["nodeId"],
                            trigger: "node",
                            taskType: "video-generation",
                            provider: "runninghubwf",
                            adapterType: "workflow",
                            modelId: v418?.["model"] || "",
                            executionId:
                              "runninghub.video." +
                              (v418?.["model"] || "workflow"),
                            payload: v418,
                            cancellable: true,
                            resumable: true,
                            resultBuilder: () => ({}),
                            cancelledBuilder: v439,
                          },
                        });
                        if (v424 !== this["_rhGenToken"]) return;
                        this["_persistRunningHubResumeCache"]();
                      })());
                    return;
                  }
                  if (v423) {
                    const v445 =
                      v191["getState"]()["nodes"]?.[this["nodeId"]] || {};
                    (v429["onTaskId"]?.(v436),
                      v191["updateNodeData"](this["nodeId"], {
                        asyncTaskProvider: String(
                          v445?.["asyncTaskProvider"] ||
                            v422 ||
                            this["_data"]?.["provider"] ||
                            "",
                        )
                          ["trim"]()
                          ["toLowerCase"](),
                        asyncTaskKind: "video",
                      }),
                      this["_syncLocalTaskNodeData"](),
                      this["_persistAsyncResumeCache"]());
                  }
                },
                onProgress: v421
                  ? async (v446) => {
                      if (v424 !== this["_rhGenToken"]) return;
                      this["_applyDreaminaTaskSnapshot"](v446, {
                        recovering: false,
                        startedAt: v425,
                      });
                    }
                  : undefined,
              }),
            cancel: v420
              ? async ({ taskId: v447 }) => {
                  const v448 = this["_rhApiKey"] || v418["apiKey"] || "",
                    v449 = String(v447 || "")["trim"]();
                  if (!v448 || !v449) return null;
                  return v192["cancelRunningHubWorkflowTask"]({
                    apiKey: v448,
                    taskId: v449,
                  });
                }
              : undefined,
            resultBuilder: (v450, v451) => {
              const v452 = this["_applyDreaminaSuccessResult"](
                  v450,
                  v451["startedAt"],
                  null,
                  { writeStore: false, returnPatch: true },
                ),
                v453 = { ...(v452?.["patch"] || {}) };
              if (v420) {
                const v454 =
                  v191["getState"]()["nodes"]?.[this["nodeId"]] || {};
                Object["assign"](
                  v453,
                  { rhStatusMessage: null, rhStatusCode: null },
                  this["_buildRunningHubTaskPatch"]({
                    taskId:
                      String(this["_rhTaskId"] || "")["trim"]() ||
                      String(v454?.["rhTaskId"] || "")["trim"](),
                    status: "success",
                    startedAt: v451["startedAt"],
                    recovering: false,
                    useOpenapiQuery: v454?.["rhTaskUseOpenapiQuery"] === true,
                  }),
                );
              } else {
                if (v423) {
                  const v455 =
                    v191["getState"]()["nodes"]?.[this["nodeId"]] || {};
                  Object["assign"](
                    v453,
                    this["_buildAsyncTaskPatch"]({
                      provider: String(
                        v455?.["asyncTaskProvider"] || v422 || "",
                      )["trim"](),
                      kind: "video",
                      taskId: String(v455?.["asyncTaskId"] || "")["trim"](),
                      status: "success",
                      startedAt: v451["startedAt"],
                      recovering: false,
                    }),
                  );
                }
              }
              return v453;
            },
            failureBuilder: (v456, v457) => {
              const v458 = v456?.["message"] || "生成失败";
              if (v421 && this["_isDreaminaPollTimeoutError"](v456)) {
                const v459 =
                    v191["getState"]()["nodes"]?.[this["nodeId"]] || {},
                  v460 = String(v459?.["dreaminaSubmitId"] || "")["trim"](),
                  v461 = this["_buildDreaminaBackgroundPendingSnapshot"](v460);
                return Object["assign"](
                  {
                    isGenerating: true,
                    jobStatus: "running",
                    jobError: null,
                    generationDuration: Date["now"]() - v457["startedAt"],
                  },
                  this["_buildDreaminaTaskPatch"](v461, {
                    recovering: false,
                    startedAt: Number(
                      v459?.["dreaminaTaskStartedAt"] ||
                        v459?.["generationStartTime"] ||
                        v457["startedAt"],
                    ),
                  }),
                );
              }
              const v462 =
                String(v456?.["code"] || "") === "SUBSCRIPTION_REQUIRED"
                  ? {}
                  : buildVideoGenerationFailurePatch({
                      error: v458,
                      startedAt: v457["startedAt"],
                      duration: Date["now"]() - v457["startedAt"],
                    });
              v421 &&
                Object["assign"](
                  v462,
                  this["_buildDreaminaTaskPatch"](
                    this["_buildDreaminaFailedSnapshot"](
                      v191["getState"]()["nodes"]?.[this["nodeId"]]?.[
                        "dreaminaSubmitId"
                      ] || "",
                      v458,
                    ),
                    { recovering: false, startedAt: v457["startedAt"] },
                  ),
                );
              if (v420) {
                const v463 =
                  v191["getState"]()["nodes"]?.[this["nodeId"]] || {};
                Object["assign"](
                  v462,
                  {
                    rhStatusMessage: v458,
                    rhStatusCode: Number["isFinite"](Number(v456?.["code"]))
                      ? Number(v456["code"])
                      : null,
                  },
                  this["_buildRunningHubTaskPatch"]({
                    taskId:
                      String(this["_rhTaskId"] || "")["trim"]() ||
                      String(v463?.["rhTaskId"] || "")["trim"](),
                    status: "failed",
                    startedAt: v457["startedAt"],
                    recovering: false,
                    useOpenapiQuery: v463?.["rhTaskUseOpenapiQuery"] === true,
                  }),
                );
              }
              if (v423) {
                const v464 =
                  v191["getState"]()["nodes"]?.[this["nodeId"]] || {};
                Object["assign"](
                  v462,
                  this["_buildAsyncTaskPatch"]({
                    provider: String(v464?.["asyncTaskProvider"] || v422 || "")[
                      "trim"
                    ](),
                    kind: "video",
                    taskId: String(v464?.["asyncTaskId"] || "")["trim"](),
                    status: "failed",
                    startedAt: v457["startedAt"],
                    recovering: false,
                  }),
                );
              }
              return v462;
            },
            cancelledBuilder: (v465) => ({
              videos: [],
              videoUrl: "",
              localPath: "",
              generationDuration: Date["now"]() - v465["startedAt"],
              ...(v420
                ? {
                    rhStatusMessage: "生成已取消",
                    rhStatusCode: null,
                    ...this["_buildRunningHubTaskPatch"]({
                      taskId:
                        String(this["_rhTaskId"] || "")["trim"]() ||
                        String(
                          v191["getState"]()["nodes"]?.[this["nodeId"]]?.[
                            "rhTaskId"
                          ] || "",
                        )["trim"](),
                      status: "cancelled",
                      startedAt: v465["startedAt"],
                      recovering: false,
                      useOpenapiQuery:
                        v191["getState"]()["nodes"]?.[this["nodeId"]]?.[
                          "rhTaskUseOpenapiQuery"
                        ] === true,
                    }),
                  }
                : {}),
            }),
            parseError: (v466) => v466?.["message"] || "生成失败",
          },
          {
            store: v191,
            startedAt: v425,
            abortController: this["_rhAbortController"],
          },
        );
        if (v427["status"] === "pending") return v427;
        if (v427["status"] === "success") {
          const v467 = normalizeVideoGenerationResult(v427["result"])["items"];
          this["_finalizeVideoSuccessSideEffects"](v467, v425);
          if (v421) this["_persistDreaminaResumeCache"]();
          if (v420) this["_persistRunningHubResumeCache"]();
          if (v423) this["_persistAsyncResumeCache"]();
          return v427;
        }
        const v468 = v427["error"];
        if (
          v427["status"] === "failed" &&
          String(v468?.["code"] || "") === "SUBSCRIPTION_REQUIRED"
        ) {
          const v469 = String(v468?.["requiredModelId"] || "")["trim"](),
            v470 = v469 || this["_data"]?.["model"] || "",
            v471 = String(this["_data"]?.["provider"] || "")["trim"](),
            v472 = window["handleSubscriptionRequired"];
          if (typeof v472 === "function")
            await v472({ modelId: v470, provider: v471, error: v468 });
          else {
            if (typeof window["openSubscriptionDialog"] === "function") {
              const v473 = window["getSubscriptionState"]?.() || {};
              String(v473["status"] || "")["toLowerCase"]() !== "active"
                ? window["openSubscriptionDialog"]({
                    modelId: v470,
                    provider: v471,
                  })
                : window["showToast"]?.(
                    v468?.["message"] || "订阅状态同步中，请稍后再试",
                    "warning",
                  );
            }
          }
          return v427;
        }
        if (
          v427["status"] === "failed" &&
          v421 &&
          this["_isDreaminaPollTimeoutError"](v468)
        )
          return (
            this["_persistDreaminaResumeCache"](),
            window["showToast"]?.("即梦排队较久，已转为后台查询", "warning"),
            v427
          );
        if (v427["status"] === "failed") {
          const v474 = v468?.["message"] || "";
          (void logDiagnosticEvent({
            type: "generation.video_failed",
            level: "error",
            source: "renderer",
            message: v474 || "视频生成失败",
            error: v468,
            context: {
              nodeId: this["nodeId"],
              provider: v418?.["provider"] || "",
              model: v418?.["model"] || "",
              isDreamina: v421,
              isRhWorkflow: v420,
              isAsyncTaskModel: v423,
            },
          }),
            window["showToast"]?.(
              v474,
              "error",
              isDreaminaUploadDurationErrorMessage(v474)
                ? DREAMINA_UPLOAD_DURATION_ERROR_TOAST_MS
                : undefined,
            ));
          if (v421) this["_persistDreaminaResumeCache"]();
          if (v420) this["_persistRunningHubResumeCache"]();
          if (v423) this["_persistAsyncResumeCache"]();
          return v427;
        }
        return v427;
      } catch (v475) {
        if (
          v420 &&
          (this["_rhCancelRequested"] ||
            v475?.["message"] === "CANCELLED" ||
            v475?.["name"] === "AbortError")
        )
          return;
        if (String(v475?.["code"] || "") === "SUBSCRIPTION_REQUIRED") {
          const v476 = String(v475?.["requiredModelId"] || "")["trim"](),
            v477 = v476 || this["_data"]?.["model"] || "",
            v478 = String(this["_data"]?.["provider"] || "")["trim"](),
            v479 = window["handleSubscriptionRequired"];
          if (typeof v479 === "function")
            await v479({ modelId: v477, provider: v478, error: v475 });
          else {
            if (typeof window["openSubscriptionDialog"] === "function") {
              const v480 = window["getSubscriptionState"]?.() || {};
              String(v480["status"] || "")["toLowerCase"]() !== "active"
                ? window["openSubscriptionDialog"]({
                    modelId: v477,
                    provider: v478,
                  })
                : window["showToast"]?.(
                    v475?.["message"] || "订阅状态同步中，请稍后再试",
                    "warning",
                  );
            }
          }
          return;
        }
        if (v421 && this["_isDreaminaPollTimeoutError"](v475)) {
          const v481 = v191["getState"]()["nodes"]?.[this["nodeId"]] || {},
            v482 = String(v481?.["dreaminaSubmitId"] || "")["trim"](),
            v483 = this["_buildDreaminaBackgroundPendingSnapshot"](v482);
          (v191["updateNodeData"](
            this["nodeId"],
            Object["assign"](
              {
                isGenerating: true,
                jobStatus: "running",
                jobError: null,
                generationDuration: Date["now"]() - v425,
              },
              this["_buildDreaminaTaskPatch"](v483, {
                recovering: false,
                startedAt: Number(
                  v481?.["dreaminaTaskStartedAt"] ||
                    v481?.["generationStartTime"] ||
                    v425,
                ),
              }),
            ),
          ),
            this["_persistDreaminaResumeCache"](),
            window["showToast"]?.("即梦排队较久，已转为后台查询", "warning"));
          return;
        }
        const v484 = v475?.["message"] || "";
        (void logDiagnosticEvent({
          type: "generation.video_failed",
          level: "error",
          source: "renderer",
          message: v484 || "视频生成失败",
          error: v475,
          context: {
            nodeId: this["nodeId"],
            provider: v418?.["provider"] || "",
            model: v418?.["model"] || "",
            isDreamina: v421,
            isRhWorkflow: v420,
            isAsyncTaskModel: v423,
          },
        }),
          window["showToast"]?.(
            v484,
            "error",
            isDreaminaUploadDurationErrorMessage(v484)
              ? DREAMINA_UPLOAD_DURATION_ERROR_TOAST_MS
              : undefined,
          ));
        const v485 = buildVideoGenerationFailurePatch({
          error: v484 || "生成失败",
          startedAt: v425,
          duration: Date["now"]() - v425,
        });
        v421 &&
          Object["assign"](
            v485,
            this["_buildDreaminaTaskPatch"](
              this["_buildDreaminaFailedSnapshot"](
                v191["getState"]()["nodes"]?.[this["nodeId"]]?.[
                  "dreaminaSubmitId"
                ] || "",
                v475?.["message"] || "生成失败",
              ),
              { recovering: false, startedAt: v425 },
            ),
          );
        v420 &&
          Object["assign"](
            v485,
            {
              rhStatusMessage: v475?.["message"] || "生成失败",
              rhStatusCode: Number["isFinite"](Number(v475?.["code"]))
                ? Number(v475["code"])
                : null,
            },
            this["_buildRunningHubTaskPatch"]({
              taskId:
                String(this["_rhTaskId"] || "")["trim"]() ||
                String(
                  v191["getState"]()["nodes"]?.[this["nodeId"]]?.["rhTaskId"] ||
                    "",
                )["trim"](),
              status: "failed",
              startedAt: v425,
              recovering: false,
              useOpenapiQuery:
                v191["getState"]()["nodes"]?.[this["nodeId"]]?.[
                  "rhTaskUseOpenapiQuery"
                ] === true,
            }),
          );
        if (v423) {
          const v486 = v191["getState"]()["nodes"]?.[this["nodeId"]] || {};
          Object["assign"](
            v485,
            this["_buildAsyncTaskPatch"]({
              provider: String(v486?.["asyncTaskProvider"] || v422 || "")[
                "trim"
              ](),
              kind: "video",
              taskId: String(v486?.["asyncTaskId"] || "")["trim"](),
              status: "failed",
              startedAt: v425,
              recovering: false,
            }),
          );
        }
        v191["updateNodeData"](this["nodeId"], v485);
        if (v421) this["_persistDreaminaResumeCache"]();
        if (v420) this["_persistRunningHubResumeCache"]();
        if (v423) this["_persistAsyncResumeCache"]();
      } finally {
        const v487 = this["_syncLocalTaskNodeData"](),
          v488 = shouldShowGenerationBusyUi(v487);
        ((this["_isGenerating"] = v488), (this["_rhAbortController"] = null));
        if (v420 && v488) {
          const v489 = String(v487?.["rhTaskId"] || "")["trim"]();
          if (v489) this["_rhTaskId"] = v489;
        } else {
          this["_rhTaskId"] = null;
          if (!this["_rhCancelRequested"]) this["_rhApiKey"] = null;
        }
        v488
          ? this["_updateSubmitButtonState"]?.()
          : (this["_resetGenerateButtonIdleUi"]({ cancellable: v420 }),
            v195(this["previewEl"]),
            this["_updateSubmitButtonState"]?.());
      }
    }
    async ["_buildPayloadImpl"](v490 = null) {
      let v491 = v191["getIncomingEdges"](this["nodeId"]);
      shouldScopeRunningHubVideoSubmitEdges(this["_data"] || {}) &&
        (v491 = v491["filter"](
          (v492) => v492?.["targetId"] === this["nodeId"],
        ));
      const v493 = v191["getState"]()["nodes"];
      let v494 = [],
        v495 = [];
      for (const v496 of v491) {
        const v497 = v493[v496["sourceId"]],
          v498 = String(v497?.["type"] || "")["toLowerCase"](),
          v499 =
            v498 === "source-image" || v498 === "image" || v498 === "ai-image";
        let v500 = "";
        v499 && (v500 = resolveGenerationInputImageUrl(v497));
        let v501 = v499 ? v500 : v497?.["videoUrl"] || v497?.["imageUrl"] || "";
        if (String(v497?.["type"] || "") === "ai-video") {
          const v502 = String(v496?.["sourceMediaKey"] || "")["trim"]();
          if (v502) {
            const v503 = Array["isArray"](v497?.["videos"])
                ? v497["videos"]
                : [],
              v504 = v503["find"]((v505) => {
                const v506 =
                  String(v505?.["localPath"] || "")["trim"]() ||
                  String(v505?.["videoUrl"] || "")["trim"]();
                return v506 === v502;
              });
            v504 &&
              (v501 =
                localPathToUrl(v504["localPath"]) ||
                String(v504["videoUrl"] || "")["trim"]() ||
                v501);
          }
        }
        if (!v501 && v493[v496["sourceId"]]?.["sourceId"]) {
          const v507 = await v193(v493[v496["sourceId"]]["sourceId"]);
          if (v507) v501 = URL["createObjectURL"](v507);
        }
        if (v501 && !v494["includes"](v501)) v494["push"](v501);
        if (v499) {
          const v508 = String(v500 || v501 || "")["trim"]();
          v508 &&
            !v508["startsWith"]("blob:") &&
            !v495["includes"](v508) &&
            v495["push"](v508);
        }
      }
      const v509 = [],
        v510 = resolvePresetPromptTextWithTextRefs({
          template: v490,
          promptEl: this["promptEl"],
          inEdges: v491,
          nodes: v493,
          assetInputRefs: v509,
          assetMediaCounts: { image: 0, video: 0, audio: 0 },
          allowedAssetTypes: ["text", "image", "video", "audio"],
        }),
        v511 =
          this["_data"]["model"] || getDefaultRunningHubVideoWorkflowModelId(),
        v512 = isDreaminaStyleVideoModel(v511, this["_data"]["provider"])
          ? resolveDreaminaStyleVideoProvider(v511, this["_data"]["provider"])
          : "",
        v513 =
          this["_data"]["provider"] ||
          v512 ||
          resolveModelProvider(v511) ||
          "grsai",
        v514 = isRunningHubWorkflowNode({
          ...this["_data"],
          model: v511,
          provider: v513,
        });
      if (v514) {
        const v515 = v493?.[this["nodeId"]] || this["_data"] || {};
        v509["push"](
          ...getPromptAssetInputRefsFromNode(v515, {
            allowedTypes: ["image", "video", "audio"],
          }),
        );
      }
      const v516 = v509["filter"](
          (v517) => v517["type"] === "image" && v517["url"],
        )["map"]((v518) => v518["url"]),
        v519 = v509["filter"](
          (v520) => v520["type"] === "video" && v520["url"],
        )["map"]((v521) => v521["url"]),
        v522 = v509["filter"](
          (v523) => v523["type"] === "audio" && v523["url"],
        )["map"]((v524) => v524["url"]);
      for (const v525 of v509) {
        if (v525["url"] && !v494["includes"](v525["url"]))
          v494["push"](v525["url"]);
        v525["type"] === "image" &&
          v525["url"] &&
          !v495["includes"](v525["url"]) &&
          v495["push"](v525["url"]);
      }
      const v526 = isDreaminaStyleVideoModel(v511, v513),
        v527 = v526 ? v495["slice"](0, 1) : v494,
        v528 =
          resolveModelExecution(v511, { providerHint: v513 }) ||
          resolveModelExecution(v511),
        v529 =
          v528?.["modelManifest"]?.["adapterType"] === "modelApi" &&
          v528?.["modelManifest"]?.["kind"] === "video" &&
          v528?.["executionManifest"]?.["adapterType"] === "modelApi",
        v530 = this["_isRunninghubWorkflowModel"](v511, v513) || v514;
      if (isHappyHorseVideoModel(v511, v513) && !v510)
        return (
          window["showToast"]?.("HappyHorse 1.0 必须填写提示词", "warn"),
          null
        );
      if (!v526 && !v530 && !v510 && !v527["length"]) return null;
      const v531 = this["_data"]["resolution"] || "1080p",
        v532 = v530
          ? String(
              resolveVideoWorkflowSchemaParam(
                this["_data"],
                v511,
                "rhInstanceType",
              ),
            ) === "plus"
            ? "plus"
            : "default"
          : this["_data"]["rhInstanceType"];
      await v196();
      const v533 = v197(v513);
      let v534 = "";
      if (v513 === "runninghub")
        v534 = isModelApiModel(v511, v513)
          ? v533["modelApiKey"] || ""
          : v533["apiKey"] || "";
      else
        v513 === "runninghubwf"
          ? (v534 = v533["apiKey"] || "")
          : (v534 = v533["apiKey"] || "");
      const v535 = {
          prompt: v510,
          model: v511,
          generationParams: {
            ...getPlainObject(this["_data"]["generationParams"]),
          },
          aspectRatio: this["_data"]["aspectRatio"] || "1:1",
          resolution: v531,
          videoSize: v531,
          duration: this["_data"]["duration"] || 5,
          mode: this["_data"]["mode"] || "全能参考",
          provider: v513,
          apiKey: v534,
          cameraAngle: this["_data"]["cameraAngle"],
          inputUrls: v527,
          rhInstanceType: v532,
          installId: String(window["__aicInstallId"] || "")["trim"](),
        },
        v536 = (v537, v538) => {
          const v539 = Array["isArray"](v537?.["videos"]) ? v537["videos"] : [];
          if (!v539["length"]) return null;
          const v540 = String(v538?.["sourceMediaKey"] || "")["trim"]();
          if (v540) {
            const v541 = v539["find"]((v542) => {
              const v543 =
                String(v542?.["localPath"] || "")["trim"]() ||
                String(v542?.["videoUrl"] || "")["trim"]();
              return v543 === v540;
            });
            if (v541) return v541;
          }
          const v544 = Number(v537?.["mainVideoIndex"]),
            v545 = Number["isFinite"](v544)
              ? Math["max"](0, Math["trunc"](v544))
              : 0;
          return v539[Math["min"](v545, v539["length"] - 1)] || null;
        },
        v546 = (v547, v548 = null) => {
          const v549 =
              String(v547?.["type"] || "") === "ai-video"
                ? v536(v547, v548)
                : null,
            v550 = String(v549?.["localPath"] || "")["trim"](),
            v551 = localPathToUrl(v550);
          if (v551) return this["_resolveMediaUrl"](v551);
          const v552 = String(v549?.["displayLocalPath"] || "")["trim"](),
            v553 = localPathToUrl(v552);
          if (v553) return this["_resolveMediaUrl"](v553);
          const v554 = String(v549?.["originalLocalPath"] || "")["trim"](),
            v555 = localPathToUrl(v554);
          if (v555) return this["_resolveMediaUrl"](v555);
          const v556 = String(v549?.["videoUrl"] || "")["trim"]();
          if (v556) return this["_resolveMediaUrl"](v556);
          const v557 = String(v547?.["localPath"] || "")["trim"](),
            v558 = localPathToUrl(v557);
          if (v558) return this["_resolveMediaUrl"](v558);
          const v559 = String(v547?.["displayLocalPath"] || "")["trim"](),
            v560 = localPathToUrl(v559);
          if (v560) return this["_resolveMediaUrl"](v560);
          const v561 = String(v547?.["originalLocalPath"] || "")["trim"](),
            v562 = localPathToUrl(v561);
          if (v562) return this["_resolveMediaUrl"](v562);
          const v563 = String(v547?.["videoLocalPath"] || "")["trim"](),
            v564 = localPathToUrl(v563);
          if (v564) return this["_resolveMediaUrl"](v564);
          const v565 = String(v547?.["videoUrl"] || "")["trim"]();
          if (v565) return this["_resolveMediaUrl"](v565);
          const v566 = String(v547?.["src"] || "")["trim"]();
          if (v566) return this["_resolveMediaUrl"](v566);
          const v567 = String(v547?.["url"] || "")["trim"]();
          if (v567) return this["_resolveMediaUrl"](v567);
          const v568 = String(v547?.["resultUrl"] || "")["trim"]();
          if (v568) return this["_resolveMediaUrl"](v568);
          const v569 = String(v547?.["sourceUrl"] || "")["trim"]();
          if (v569) return this["_resolveMediaUrl"](v569);
          return "";
        },
        v570 = (v571) => {
          const v572 = resolveGenerationInputImageUrl(v571);
          return v572 ? this["_resolveMediaUrl"](v572) : "";
        },
        v573 = (v574) => {
          const v575 = String(v574?.["localPath"] || "")["trim"](),
            v576 = localPathToUrl(v575);
          if (v576) return this["_resolveMediaUrl"](v576);
          const v577 = String(v574?.["audioUrl"] || "")["trim"]();
          if (v577) return this["_resolveMediaUrl"](v577);
          const v578 = String(v574?.["src"] || "")["trim"]();
          if (v578) return this["_resolveMediaUrl"](v578);
          return "";
        };
      if (v526) {
        let v579 = this["_data"];
        typeof this["_normalizeDreaminaNodeData"] === "function" &&
          ((v579 =
            this["_normalizeDreaminaNodeData"](this["_data"], {
              syncStore: true,
            }) || this["_data"]),
          (this["_data"] = v579));
        const v580 = resolveDreaminaStyleVideoProvider(
            v579?.["model"] || v511,
            v579?.["provider"] || v513,
          ),
          v581 = v516["slice"](),
          v582 = v519["slice"](),
          v583 = v522["slice"](),
          v584 = [];
        for (const v585 of v491) {
          const v586 = v493[v585["sourceId"]];
          if (!v586) continue;
          const v587 = String(v586?.["type"] || "")["toLowerCase"]();
          if (v587["includes"]("image")) {
            const v588 = v570(v586);
            v588 &&
              (v581["push"](v588),
              appendApimartPrivateAvatarProviderAssetRefs(v584, v586, {
                kind: "image",
                sourceUrl: v588,
                refSlot: v585?.["refSlot"],
                edgeId: v585?.["id"],
              }));
            continue;
          }
          if (v587["includes"]("video")) {
            const v589 = v546(v586, v585);
            v589 &&
              (v582["push"](v589),
              appendApimartPrivateAvatarProviderAssetRefs(v584, v586, {
                kind: "video",
                sourceUrl: v589,
                refSlot: v585?.["refSlot"],
                edgeId: v585?.["id"],
              }));
            continue;
          }
          if (v587["includes"]("audio")) {
            const v590 = v573(v586);
            if (v590) v583["push"](v590);
          }
        }
        const v591 = normalizeDreaminaVideoRouteMode(
          v579?.["dreaminaRouteMode"],
          v579?.["mode"],
        );
        if (!isDreaminaVideoRouteModeEnabled(v591))
          return (window["showToast"]?.("智能多帧暂未开放", "warn"), null);
        const v592 = resolveDreaminaVideoTaskType({
            routeMode: v591,
            imageCount: v581["length"],
            videoCount: v582["length"],
            audioCount: v583["length"],
          }),
          v593 = validateDreaminaVideoRouteSelection({
            routeMode: v591,
            taskType: v592,
            imageCount: v581["length"],
            videoCount: v582["length"],
            audioCount: v583["length"],
          });
        if (v593) return (window["showToast"]?.(v593, "warn"), null);
        const v594 =
            ensureDreaminaStyleVideoModelForTask(
              v592,
              normalizeDreaminaStyleVideoModel(v579?.["model"], v580),
              v580,
            ) || normalizeDreaminaStyleVideoModel(v579?.["model"], v580),
          v595 = normalizeDreaminaStyleVideoResolution(
            v592,
            v594,
            v579?.["resolution"] || v579?.["videoSize"],
            v580,
          ),
          v596 = normalizeDreaminaVideoAspectRatio(v579?.["aspectRatio"]);
        let v597 = v596;
        const v598 = String(v579?.["aspectRatio"] || "")["trim"](),
          v599 = isAdaptiveRatioLabel(v598);
        if (v599) {
          const v600 = pickDreaminaAdaptiveSourceRatio({
              inEdges: v491,
              nodes: v493,
              provider: v580,
              model: v594,
            }),
            v601 =
              v600 || this["_resolveDreaminaAdaptiveAspectRatioFromNode"](v579);
          v597 = v601;
        }
        const v602 = normalizeDreaminaStyleVideoDuration(
            v592,
            v594,
            v579?.["duration"],
            v580,
          ),
          v603 = getDreaminaStyleVideoDefaultModel(v592, v580),
          v604 = {
            prompt: v510,
            provider: v580,
            model: v594 || v603,
            modelVersion:
              v580 === "dreamina"
                ? getDreaminaStyleVideoModelVersion(v594, v580)
                : "",
            dreaminaRouteMode: v591,
            dreaminaTaskType: v592,
            aspectRatio: v597,
            duration: v602,
            resolution: v595,
            videoResolution: v595,
            videoSize: v595,
            images: v581,
            videos: v582,
            audios: v583,
            inputUrls: v581["slice"](),
            providerAssetRefs: v584,
            installId: String(window["__aicInstallId"] || "")["trim"](),
          };
        if (v584["length"] <= 0) delete v604["providerAssetRefs"];
        if (!v604["modelVersion"]) delete v604["modelVersion"];
        !v595 &&
          (delete v604["resolution"],
          delete v604["videoResolution"],
          delete v604["videoSize"]);
        if (v592 === "text2video") {
          if (!v510) return null;
          return (
            (v604["inputUrls"] = []),
            (v604["images"] = []),
            (v604["videos"] = []),
            (v604["audios"] = []),
            v604
          );
        }
        if (v592 === "image2video") {
          if (!v510 || !v581[0]) return null;
          ((v604["image"] = v581[0]),
            (v604["inputUrls"] = [v581[0]]),
            (v604["images"] = [v581[0]]));
          if (v580 === "dreamina") delete v604["aspectRatio"];
          return v604;
        }
        if (v592 === "frames2video") {
          if (!v510 || v581["length"] < 2) return null;
          ((v604["first"] = v581[0]),
            (v604["last"] = v581[1]),
            (v604["inputUrls"] = v581["slice"](0, 2)),
            (v604["images"] = v581["slice"](0, 2)));
          if (v580 === "dreamina") delete v604["aspectRatio"];
          return v604;
        }
        if (v592 === "multiframe2video") {
          const v605 = v581["slice"](0, 20);
          if (v605["length"] < 2) return null;
          const v606 = Math["max"](0, v605["length"] - 1),
            v607 = Array["isArray"](v579?.["dreaminaTransitionPrompts"])
              ? v579["dreaminaTransitionPrompts"]
              : [],
            v608 = Array["isArray"](v579?.["dreaminaTransitionDurations"])
              ? v579["dreaminaTransitionDurations"]
              : [],
            v609 = [],
            v610 = [];
          for (let v611 = 0; v611 < v606; v611 += 1) {
            const v612 = String(v607[v611] || "")["trim"]() || v510,
              v613 = Number(v608[v611]),
              v614 =
                Number["isFinite"](v613) && v613 > 0
                  ? Math["max"](1, Math["trunc"](v613))
                  : 3;
            (v609["push"](v612), v610["push"](v614));
          }
          if (!v510 && !v609["some"]((v615) => String(v615 || "")["trim"]()))
            return null;
          return (
            (v604["images"] = v605),
            (v604["inputUrls"] = v605["slice"]()),
            (v604["transitionPrompts"] = v609),
            (v604["transitionDurations"] = v610),
            v605["length"] === 2 &&
              ((v604["prompt"] = v609[0] || v510),
              (v604["duration"] = v610[0] || 3),
              delete v604["transitionPrompts"],
              delete v604["transitionDurations"]),
            delete v604["modelVersion"],
            delete v604["model"],
            delete v604["aspectRatio"],
            delete v604["resolution"],
            delete v604["videoResolution"],
            delete v604["videoSize"],
            v604
          );
        }
        if (v592 === "multimodal2video") {
          if (v581["length"] <= 0 && v582["length"] <= 0) return null;
          if (!v604["modelVersion"]) {
            if (v580 === "dreamina")
              ((v604["model"] = v603 || v604["model"]),
                (v604["modelVersion"] = getDreaminaStyleVideoModelVersion(
                  v604["model"],
                  v580,
                )));
            else
              !v604["model"] &&
                (v604["model"] = APIMART_DREAMINA_VIDEO_DEFAULT_MODEL);
          }
          return v604;
        }
        return null;
      }
      if (v530) {
        const v616 = await buildRunningHubVideoWorkflowSubmitPatch({
          model: v511,
          nodeData: this["_data"],
          inEdges: v491,
          nodes: v493,
          assetInputRefs: v509,
          prompt: v510,
          helpers: { getVideoUrl: v546, getImageUrl: v570, getAudioUrl: v573 },
        });
        if (v616 === null) return null;
        return (
          Object["assign"](v535, v616["payloadPatch"] || {}),
          Object["keys"](v616["updateData"] || {})["length"] > 0 &&
            v191["updateNodeData"](this["nodeId"], v616["updateData"]),
          v535
        );
      }
      if (v529 && !v526) {
        const v617 = v495["slice"](),
          v618 = [],
          v619 = [],
          v620 = [],
          v621 = [],
          v622 = [],
          v623 = [],
          v624 = [],
          v625 = (v626, v627) => {
            const v628 = String(v627 || "")["trim"]();
            if (v628 && !v626["includes"](v628)) v626["push"](v628);
          },
          v629 = (v630, v631 = {}) => {
            const v632 = String(v630 || "")["trim"]();
            if (!v632) return;
            const v633 = v620["indexOf"](v632),
              v634 = { ...v631, url: v632 };
            if (v633 < 0) {
              (v620["push"](v632), v621["push"](v634));
              return;
            }
            const v635 = v621[v633] || {};
            !(Number(v635["duration"]) > 0) &&
              Number(v634["duration"]) > 0 &&
              (v621[v633] = { ...v635, ...v634 });
          },
          v636 = (v637, v638 = {}) => {
            const v639 = String(v637 || "")["trim"]();
            if (!v639) return;
            const v640 = v622["indexOf"](v639),
              v641 = { ...v638, url: v639 };
            if (v640 < 0) {
              (v622["push"](v639), v623["push"](v641));
              return;
            }
            const v642 = v623[v640] || {};
            v623[v640] = {
              ...v642,
              ...Object["fromEntries"](
                Object["entries"](v641)["filter"](([, v643]) => {
                  if (v643 === "" || v643 == null) return false;
                  if (Number(v643) === 0) return false;
                  return true;
                }),
              ),
            };
          };
        (v509["filter"]((v644) => v644?.["type"] === "audio" && v644?.["url"])[
          "forEach"
        ]((v645) => {
          v636(v645["url"], {
            duration: getAudioDurationFromAssetRef(v645),
            sizeBytes: getAudioSizeBytesFromAssetRef(v645),
            assetRefSource: v645["assetRefSource"] || "",
          });
        }),
          v509["filter"]((v646) => v646?.["type"] === "video" && v646?.["url"])[
            "forEach"
          ]((v647) => {
            (v629(v647["url"], {
              duration: getVideoDurationFromAssetRef(v647),
              assetRefSource: v647["assetRefSource"] || "",
            }),
              v619["push"]({
                refSlot: v647?.["refSlot"] || "",
                url: v647["url"],
              }));
          }));
        for (const v648 of v491) {
          const v649 = v493[v648["sourceId"]];
          if (!v649) continue;
          const v650 = String(v649?.["type"] || "")["toLowerCase"]();
          if (v650["includes"]("image")) {
            const v651 =
              v570(v649) ||
              v649?.["imageUrl"] ||
              v649?.["src"] ||
              v649?.["url"];
            (v625(v617, v651),
              String(v651 || "")["trim"]() &&
                (v618["push"]({ refSlot: v648?.["refSlot"] || "", url: v651 }),
                appendApimartPrivateAvatarProviderAssetRefs(v624, v649, {
                  kind: "image",
                  sourceUrl: v651,
                  refSlot: v648?.["refSlot"],
                  edgeId: v648?.["id"],
                })));
          } else {
            if (v650["includes"]("video")) {
              const v652 =
                  String(v649?.["type"] || "") === "ai-video"
                    ? v536(v649, v648)
                    : null,
                v653 = v546(v649, v648);
              (v629(v653, {
                duration: getVideoDurationFromSource(v649, v652),
                edgeId: v648?.["id"],
              }),
                String(v653 || "")["trim"]() &&
                  (v619["push"]({
                    refSlot: v648?.["refSlot"] || "",
                    url: v653,
                  }),
                  appendApimartPrivateAvatarProviderAssetRefs(v624, v649, {
                    kind: "video",
                    sourceUrl: v653,
                    refSlot: v648?.["refSlot"],
                    edgeId: v648?.["id"],
                  })));
            } else
              v650["includes"]("audio") &&
                v636(v573(v649), {
                  duration: getAudioDurationFromSource(v649),
                  sizeBytes: getAudioSizeBytesFromSource(v649),
                  edgeId: v648?.["id"],
                });
          }
        }
        applyModelApiVideoAdaptiveRatio(v535, {
          inEdges: v491,
          nodes: v493,
          nodeData: this["_data"],
          provider: v513,
          model: v511,
          modelManifest: v528?.["modelManifest"] || null,
        });
        if (isHappyHorseVideoModel(v511, v513)) {
          const v654 = getHappyHorseMode(this["_data"]),
            v655 = getFixedInputSlotConfigFromManifest(this["_data"] || {}),
            v656 = buildVideoInputUrlsByFixedImageSlot({
              fixedInputConfig: v655,
              imageRefs: v618,
              assetInputRefs: v509,
            }),
            v657 = orderHappyHorseImageUrls({
              mode: v654,
              images: v617,
              slotUrls: v656,
            }),
            v658 = buildHappyHorseMediaPayload({
              prompt: v510,
              mode: v654,
              images: v657,
              videos: v620,
              videoEntries: v621,
              assetVideoCount: v519["length"],
              maxVideoSeconds: getHappyHorseVideoInputMaxSeconds(v511, v513),
            });
          if (!v658["ok"])
            return (window["showToast"]?.(v658["message"], "warn"), null);
          const v659 = v658["mode"] || v654;
          return (
            (v535["generationParams"] = {
              ...v535["generationParams"],
              happyhorse_mode: v659,
            }),
            (v535["images"] = v658["images"]),
            (v535["videos"] = v658["videos"]),
            (v535["audios"] = []),
            (v535["inputUrls"] = v658["inputUrls"]),
            v535
          );
        }
        if (isWan27VideoModel(v511, v513)) {
          const v660 = getWan27Mode(this["_data"]),
            v661 = getFixedInputSlotConfigFromManifest(this["_data"] || {}),
            v662 = buildVideoInputUrlsByFixedKindSlot({
              fixedInputConfig: v661,
              refs: v619,
              assetInputRefs: v509,
              kind: "video",
            }),
            v663 = [],
            v664 = (v665) => {
              const v666 = String(v665 || "")["trim"]();
              v666 && !v663["includes"](v666) && v663["push"](v666);
            };
          if (v660 === "video") v664(v662["sourceVideo"]);
          else {
            if (v660 === "reference") v664(v662["referenceVideo"]);
            else
              v660 === "edit" &&
                (v664(v662["originalVideo"]), v664(v662["referenceVideo"]));
          }
          v620["forEach"](v664);
          const v667 = buildWan27MediaPayload({
            mode: v660,
            images: v617,
            videos: v663,
            audios: v622,
            videoEntries: v621,
            audioEntries: v623,
            assetVideoCount: v519["length"],
          });
          if (!v667["ok"])
            return (window["showToast"]?.(v667["message"], "warn"), null);
          ((v535["generationParams"] = {
            ...v535["generationParams"],
            wan27_mode: v660,
          }),
            (v535["images"] = v667["images"]),
            (v535["videos"] = v667["videos"]),
            (v535["audios"] = v667["audios"]),
            (v535["inputUrls"] = v667["inputUrls"]));
          if (v660 === "image" || v660 === "reference") {
            const v668 = buildVideoInputUrlsByFixedImageSlot({
              fixedInputConfig: v661,
              imageRefs: v618,
              assetInputRefs: v509,
            });
            Object["keys"](v668)["length"] > 0 &&
              (v535["inputUrlsBySlot"] = v668);
          }
          return v535;
        }
        if (isKlingV3OmniVideoModel(v511, v513)) {
          const v669 = getKlingV3OmniMode(this["_data"]),
            v670 = getFixedInputSlotConfigFromManifest(this["_data"] || {}),
            v671 = buildVideoInputUrlsByFixedImageSlot({
              fixedInputConfig: v670,
              imageRefs: v618,
              assetInputRefs: v509,
            }),
            v672 = [],
            v673 = (v674) => {
              const v675 = String(v674 || "")["trim"]();
              v675 && !v672["includes"](v675) && v672["push"](v675);
            };
          if (v669 === "image")
            (v673(v671["firstFrame"]), v673(v671["lastFrame"]));
          else v669 === "reference" && v673(v671["referenceImage"]);
          v617["forEach"](v673);
          const v676 = buildVideoInputUrlsByFixedKindSlot({
              fixedInputConfig: v670,
              refs: v619,
              assetInputRefs: v509,
              kind: "video",
            }),
            v677 = [],
            v678 = (v679) => {
              const v680 = String(v679 || "")["trim"]();
              v680 && !v677["includes"](v680) && v677["push"](v680);
            };
          if (v669 === "reference") v678(v676["referenceVideo"]);
          else v669 === "edit" && v678(v676["editVideo"]);
          v620["forEach"](v678);
          const v681 = buildKlingV3OmniMediaPayload({
            mode: v669,
            images: v672,
            videos: v677,
            videoEntries: v621,
            assetVideoCount: v519["length"],
          });
          if (!v681["ok"])
            return (window["showToast"]?.(v681["message"], "warn"), null);
          ((v535["generationParams"] = {
            ...v535["generationParams"],
            kling_v3_omni_mode: v669,
          }),
            (v535["images"] = v681["images"]),
            (v535["videos"] = v681["videos"]),
            (v535["audios"] = []),
            (v535["inputUrls"] = v681["inputUrls"]));
          if (v669 === "image" || v669 === "reference") {
            const v682 = {};
            if (v669 === "image")
              (v671["firstFrame"] && (v682["firstFrame"] = v671["firstFrame"]),
                v671["lastFrame"] && (v682["lastFrame"] = v671["lastFrame"]));
            else
              v671["referenceImage"] &&
                (v682["referenceImage"] = v671["referenceImage"]);
            Object["keys"](v682)["length"] > 0 &&
              (v535["inputUrlsBySlot"] = v682);
          }
          return v535;
        }
        if (isKlingO1VideoModel(v511, v513)) {
          const v683 = getFixedInputSlotConfigFromManifest(this["_data"] || {}),
            v684 = buildVideoInputUrlsByFixedImageSlot({
              fixedInputConfig: v683,
              imageRefs: v618,
              assetInputRefs: v509,
            }),
            v685 = [],
            v686 = (v687) => {
              const v688 = String(v687 || "")["trim"]();
              v688 && !v685["includes"](v688) && v685["push"](v688);
            };
          (v686(v684["referenceImage"]), v617["forEach"](v686));
          const v689 = buildVideoInputUrlsByFixedKindSlot({
              fixedInputConfig: v683,
              refs: v619,
              assetInputRefs: v509,
              kind: "video",
            }),
            v690 = !!v689["editVideo"],
            v691 = !!v689["featureReferenceVideo"],
            v692 = [],
            v693 = (v694) => {
              const v695 = String(v694 || "")["trim"]();
              v695 && !v692["includes"](v695) && v692["push"](v695);
            };
          (v693(v689["editVideo"]),
            v693(v689["featureReferenceVideo"]),
            v620["forEach"](v693));
          const v696 = buildKlingO1MediaPayload({
            prompt: v535["prompt"],
            images: v685,
            videos: v692,
            videoEntries: v621,
            videoRole: v691 ? "feature" : "base",
            hasEditVideo: v690,
            hasFeatureVideo: v691,
          });
          if (!v696["ok"])
            return (window["showToast"]?.(v696["message"], "warn"), null);
          return (
            (v535["prompt"] = v696["prompt"]),
            (v535["images"] = v696["images"]),
            (v535["videos"] = v696["videos"]),
            (v535["audios"] = []),
            (v535["inputUrls"] = v696["inputUrls"]),
            v696["videoRole"]
              ? (v535["klingO1VideoRole"] = v696["videoRole"])
              : delete v535["klingO1VideoRole"],
            v535
          );
        }
        ((v535["images"] = v617),
          (v535["videos"] = v620),
          (v535["audios"] = v622),
          (v535["inputUrls"] = v617));
        v624["length"] > 0 && (v535["providerAssetRefs"] = v624);
        const v697 = getFixedInputSlotConfigFromManifest(this["_data"] || {}),
          v698 = buildVideoInputUrlsByFixedImageSlot({
            fixedInputConfig: v697,
            imageRefs: v618,
            assetInputRefs: v509,
          });
        Object["keys"](v698)["length"] > 0 && (v535["inputUrlsBySlot"] = v698);
      }
      return v535;
    }
  }
  return v205["prototype"];
}
