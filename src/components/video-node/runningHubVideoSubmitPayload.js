import {
  RH_VIDEO_BASIC_EXECUTION_ID,
  RH_VIDEO_BASIC_MODEL_ID,
  RH_VIDEO_LIPSYNC_EXECUTION_ID,
  RH_VIDEO_LTX23_EXECUTION_ID,
  resolveModelExecution,
} from "../../manifests/index.js";
import {
  buildVideoWorkflowDisplayParamsPatch,
  getPlainGenerationParams,
} from "./runningHubVideoUiSchema.js";
import {
  buildFixedInputAssetSlotMapFromRefs,
  getFixedInputSlotConfigFromManifest,
  resolveFixedInputSlotForRef,
} from "../../modules/fixedInputAssetRefs.js";
import { resolveEffectiveInputKind } from "../../modules/modelInputPolicy.js";
import { attachMediaElementPlaybackSource } from "../../services/desktopMediaBlobSource.js";
const RH_STANDARD_FPS_OPTIONS = Object["freeze"]([16, 24]),
  RH_V54_FPS_OPTIONS = Object["freeze"]([16, 24, 30]),
  RH_MIN_VIDEO_RESOLUTION = 832,
  RH_VIDEO_V54_PAYLOAD_RESOLVER = "runninghubVideoV54";
function normalizeRhStandardFps(v0) {
  const v1 = Number(v0);
  return RH_STANDARD_FPS_OPTIONS["includes"](v1) ? v1 : 24;
}
function normalizeRhV54Fps(v2) {
  const v3 = Number(v2);
  return RH_V54_FPS_OPTIONS["includes"](v3) ? v3 : 24;
}
function normalizeRhVideoResolution(v4) {
  const v5 = Number(v4);
  return Number["isFinite"](v5)
    ? Math["max"](RH_MIN_VIDEO_RESOLUTION, Math["trunc"](v5))
    : RH_MIN_VIDEO_RESOLUTION;
}
function getRunningHubVideoExecution(v6) {
  try {
    return resolveModelExecution(v6)?.["executionManifest"] || null;
  } catch {
    return null;
  }
}
export function getDefaultRunningHubVideoWorkflowModelId() {
  return RH_VIDEO_BASIC_MODEL_ID;
}
export function shouldScopeRunningHubVideoSubmitEdges(v7 = {}) {
  const v8 = getRunningHubVideoExecution(v7?.["model"]);
  return (
    v8?.["extensions"]?.["payloadResolver"] === RH_VIDEO_V54_PAYLOAD_RESOLVER ||
    v8?.["id"] === RH_VIDEO_BASIC_EXECUTION_ID
  );
}
function getUrlForKind(v9, v10, v11, v12) {
  if (v9 === "video") return v12["getVideoUrl"](v10, v11);
  if (v9 === "image") return v12["getImageUrl"](v10);
  if (v9 === "audio") return v12["getAudioUrl"](v10);
  return "";
}
function assignSlotPayload(v13, v14, v15) {
  const v16 = String(v15?.["url"] || "")["trim"]();
  if (!v16) return;
  if (v14 === "sourceVideo" && !v13["videoUrl"]) v13["videoUrl"] = v16;
  else {
    if (v14 === "refImage") v13["inputUrls"] = [v16];
    else {
      if (v14 === "audio" && !v13["audioUrl"]) v13["audioUrl"] = v16;
      else {
        if (v14 === "firstFrame" && !v13["firstFrameUrl"])
          v13["firstFrameUrl"] = v16;
        else {
          if (v14 === "videoMask" && !v13["maskVideoUrl"])
            v13["maskVideoUrl"] = v16;
        }
      }
    }
  }
}
function resolveManifestFixedSlotInputs({
  nodeData: v17,
  inEdges: v18,
  nodes: v19,
  assetInputRefs: v20,
  helpers: v21,
}) {
  const v22 = getFixedInputSlotConfigFromManifest(v17 || {});
  if (!v22) return { config: null, slotEntries: {} };
  const v23 = {};
  for (const v24 of v18 || []) {
    const v25 = v19?.[v24?.["sourceId"]];
    if (!v25) continue;
    const v26 = String(resolveEffectiveInputKind(v25, v24) || ""),
      { slot: v27 } = resolveFixedInputSlotForRef({
        fixedInputConfig: v22,
        refSlot: v24?.["refSlot"],
        kind: v26,
        occupiedSlots: v23,
      });
    if (!v27 || v23[v27]) continue;
    const v28 = String(v22["slotKindById"]?.[v27] || ""),
      v29 = getUrlForKind(v28, v25, v24, v21);
    v29 && (v23[v27] = { url: v29, node: v25, edge: v24 });
  }
  const v30 = new Set(Object["keys"](v23)),
    v31 = buildFixedInputAssetSlotMapFromRefs(v20, {
      slotOrderByType: v22["slotOrderByType"],
      visibleSlots: v22["visibleSlots"],
      exclusiveGroups: v22["exclusiveGroups"],
      occupiedSlots: v30,
    });
  return (
    Object["entries"](v31)["forEach"](([v32, v33]) => {
      !v23[v32] &&
        v33?.["url"] &&
        (v23[v32] = {
          url: v33["url"],
          node: v33["nodeData"] || null,
          ref: v33,
        });
    }),
    { config: v22, slotEntries: v23 }
  );
}
function buildGenericFixedSlotPayloadPatchFromEntries(v34 = {}) {
  const v35 = {};
  return (
    Object["entries"](v34)["forEach"](([v36, v37]) => {
      assignSlotPayload(v35, v36, v37);
    }),
    v35
  );
}
function edgeTimeKey(v38) {
  const v39 = Number(v38?.["createdAt"]);
  if (Number["isFinite"](v39) && v39 > 0) return v39;
  const v40 = String(v38?.["id"] || ""),
    v41 = v40["match"](/(\d{10,})/g);
  if (v41 && v41["length"]) return Number(v41[v41["length"] - 1]) || 0;
  return 0;
}
function buildV54FixedSlotPatch({
  nodeData: v42,
  inEdges: v43,
  nodes: v44,
  assetInputRefs: v45,
  helpers: v46,
}) {
  const v47 = getFixedInputSlotConfigFromManifest(v42 || {}),
    v48 = {};
  if (!v47) return v48;
  const v49 = {};
  for (const v50 of v43 || []) {
    const v51 = v44?.[v50?.["sourceId"]];
    if (!v51) continue;
    const v52 = String(resolveEffectiveInputKind(v51, v50) || ""),
      { slot: v53 } = resolveFixedInputSlotForRef({
        fixedInputConfig: v47,
        refSlot: v50?.["refSlot"],
        kind: v52,
        occupiedSlots: v49,
      });
    if (!v53 || v49[v53]) continue;
    const v54 = String(v47["slotKindById"]?.[v53] || "");
    if (!v54) continue;
    const v55 = getUrlForKind(v54, v51, v50, v46);
    if (v55) v49[v53] = { url: v55, node: v51, edge: v50 };
  }
  const v56 = new Set(Object["keys"](v49)),
    v57 = buildFixedInputAssetSlotMapFromRefs(v45, {
      slotOrderByType: v47["slotOrderByType"],
      visibleSlots: v47["visibleSlots"],
      exclusiveGroups: v47["exclusiveGroups"],
      occupiedSlots: v56,
    });
  Object["entries"](v57)["forEach"](([v58, v59]) => {
    !v49[v58] &&
      v59?.["url"] &&
      (v49[v58] = { url: v59["url"], node: v59["nodeData"] || null, ref: v59 });
  });
  if (!v49["sourceVideo"]) {
    const v60 = (v43 || [])
        ["map"]((v61) => ({ edge: v61, node: v44?.[v61?.["sourceId"]] }))
        ["filter"](({ node: v62 }) =>
          String(v62?.["type"] || "")["includes"]("video"),
        )
        ["sort"](
          (v63, v64) => edgeTimeKey(v63["edge"]) - edgeTimeKey(v64["edge"]),
        ),
      v65 = v60[0],
      v66 = v65 ? v46["getVideoUrl"](v65["node"], v65["edge"]) : "";
    v66 &&
      (v49["sourceVideo"] = { url: v66, node: v65["node"], edge: v65["edge"] });
  }
  return (
    ["sourceVideo", "refImage", "firstFrame", "videoMask"]["forEach"]((v67) => {
      assignSlotPayload(v48, v67, v49[v67]);
    }),
    v48
  );
}
function buildV54SubmitPatch(v68) {
  const { nodeData: v69 } = v68,
    v70 = {},
    v71 = {},
    v72 =
      v69["rhBlendIntoScene"] !== undefined ? v69["rhBlendIntoScene"] : false;
  if (v69["rhBlendIntoScene"] === undefined) v70["rhBlendIntoScene"] = false;
  v71["characterIntegration"] = v72;
  const v73 = v69["rhControlMode"] || "single";
  if (!v69["rhControlMode"]) v70["rhControlMode"] = "single";
  const v74 = v69["rhSingleControlPreset"],
    v75 =
      v74 === "efficiency" || v74 === "stable" || v74 === "quality"
        ? v74
        : "efficiency";
  if (v73 !== "multi") {
    if (v74 !== v75) v70["rhSingleControlPreset"] = v75;
  } else
    v69["rhSingleControlPreset"] !== null &&
      (v70["rhSingleControlPreset"] = null);
  v71["controlMode"] = v73 === "multi" ? "multi" : v75;
  (v69["rhSpecialMode"] === "longVideoOverlay" ||
    v69["rhSpecialMode"] === "cameraMove") &&
    (v71["specialMode"] = v69["rhSpecialMode"]);
  const v76 = Number(v69["rhBreastJiggle"]),
    v77 = Number["isFinite"](v76)
      ? Math["max"](0, Math["min"](1, Math["round"](v76 * 20) / 20))
      : 0;
  if (v69["rhBreastJiggle"] === undefined) v70["rhBreastJiggle"] = 0;
  v71["rhBreastJiggle"] = v77;
  const v78 = v69["rhMaskExpandTouched"] === true,
    v79 = Number(v69["rhMaskExpand"]),
    v80 = Number["isFinite"](v79) && (v79 !== 0 || v78),
    v81 = v80 ? v79 : 25;
  if (!v80) v70["rhMaskExpand"] = 25;
  ((v71["maskExpansion"] = v81),
    (v71["maskRect"] = v69["rhMaskRect"] === true));
  const v82 = v69["rhSubtractSubject"] !== false;
  if (v69["rhSubtractSubject"] === undefined) v70["rhSubtractSubject"] = true;
  const v83 = normalizeRhV54Fps(v69["rhVideoFps"]);
  v71["frameRate"] = v83;
  const v84 = Number["isFinite"](v69["rhVideoFrames"])
    ? Math["max"](0, Math["trunc"](v69["rhVideoFrames"]))
    : 77;
  v71["frameCount"] = v84;
  const v85 = Number(v69["rhVideoResolution"]),
    v86 = normalizeRhVideoResolution(v85);
  return (
    (!Number["isFinite"](v85) || v86 !== v85) &&
      (v70["rhVideoResolution"] = v86),
    (v71["rhVideoResolution"] = v86),
    (v71["rhVideoFps"] = v83),
    Object["assign"](v71, buildV54FixedSlotPatch(v68)),
    v71["maskVideoUrl"] && v82
      ? ((v70["rhSubtractSubject"] = false), (v71["subtractSubject"] = false))
      : (v71["subtractSubject"] = v82),
    { payloadPatch: v71, updateData: v70 }
  );
}
function buildBasicSubmitPatch({ nodeData: v87, slotEntries: v88 }) {
  const v89 = {},
    v90 = {},
    v91 = normalizeRhStandardFps(v87["rhVideoFps"]);
  if (![16, 24]["includes"](Number(v87["rhVideoFps"]))) v89["rhVideoFps"] = 24;
  v90["rhVideoFps"] = v91;
  const v92 = Number(v87["rhVideoFrames"]),
    v93 = Number["isFinite"](v92) ? Math["max"](0, Math["trunc"](v92)) : 77;
  if (!Number["isFinite"](v92)) v89["rhVideoFrames"] = 77;
  v90["rhVideoFrames"] = v93;
  const v94 = Number(v87["rhVideoResolution"]),
    v95 = normalizeRhVideoResolution(v94);
  (!Number["isFinite"](v94) || v95 !== v94) && (v89["rhVideoResolution"] = v95);
  v90["rhVideoResolution"] = v95;
  if (v87["rhEnableMask"] === undefined) v89["rhEnableMask"] = false;
  return (
    (v90["rhEnableMask"] = v87["rhEnableMask"] === true),
    assignSlotPayload(v90, "sourceVideo", v88["sourceVideo"]),
    assignSlotPayload(v90, "refImage", v88["refImage"]),
    { payloadPatch: v90, updateData: v89 }
  );
}
function buildLtxSubmitPatch({ nodeData: v96, slotEntries: v97 }) {
  const v98 = {},
    v99 = {},
    v100 = normalizeRhStandardFps(v96["rhVideoFps"]);
  if (![16, 24]["includes"](Number(v96["rhVideoFps"]))) v98["rhVideoFps"] = 24;
  v99["rhVideoFps"] = v100;
  const v101 = Number(v96["rhVideoSeconds"]),
    v102 = Number["isFinite"](v101) ? Math["max"](1, Math["trunc"](v101)) : 5;
  if (!Number["isFinite"](v101)) v98["rhVideoSeconds"] = 5;
  v99["rhVideoSeconds"] = v102;
  const v103 = Number(v96["rhVideoResolution"]),
    v104 = normalizeRhVideoResolution(v103);
  (!Number["isFinite"](v103) || v104 !== v103) &&
    (v98["rhVideoResolution"] = v104);
  v99["rhVideoResolution"] = v104;
  const v105 = v96["rhLtxMode"] || "singing_voice";
  if (!v96["rhLtxMode"]) v98["rhLtxMode"] = "singing_voice";
  return (
    (v99["rhLtxMode"] = v105),
    assignSlotPayload(v99, "refImage", v97["refImage"]),
    assignSlotPayload(v99, "audio", v97["audio"]),
    { payloadPatch: v99, updateData: v98 }
  );
}
function getVideoDurationSec(v106) {
  const v107 = Number(v106?.["videoDuration"]);
  if (Number["isFinite"](v107) && v107 > 0) return v107;
  const v108 = Number(v106?.["videoFrameCount"]),
    v109 = Number(v106?.["videoFps"]);
  if (
    Number["isFinite"](v108) &&
    v108 > 0 &&
    Number["isFinite"](v109) &&
    v109 > 0
  )
    return v108 / v109;
  const v110 = Number(v106?.["duration"]);
  return Number["isFinite"](v110) && v110 > 0 ? v110 : 0;
}
async function loadAudioDurationSec(v111) {
  if (typeof Audio !== "function") return 0;
  return await new Promise((v112) => {
    const v113 = new Audio();
    let v114 = false;
    const v115 = (v116) => {
        if (v114) return;
        ((v114 = true),
          v113["removeAttribute"]("src"),
          v113["load"]?.(),
          v112(v116));
      },
      v117 = setTimeout(() => v115(0), 6000);
    (v113["addEventListener"](
      "loadedmetadata",
      () => {
        clearTimeout(v117);
        const v118 = Number(v113["duration"]);
        v115(Number["isFinite"](v118) && v118 > 0 ? v118 : 0);
      },
      { once: true },
    ),
      v113["addEventListener"](
        "error",
        () => {
          (clearTimeout(v117), v115(0));
        },
        { once: true },
      ),
      (v113["preload"] = "metadata"),
      void attachMediaElementPlaybackSource(v113, v111, {
        preload: "metadata",
      })["catch"](() => {
        !String(v113["getAttribute"]?.("src") || v113["src"] || "")["trim"]() &&
          ((v113["src"] = v111), v113["load"]?.());
      }));
  });
}
async function getAudioDurationSec(v119, v120) {
  const v121 = Number(v119?.["duration"]);
  if (Number["isFinite"](v121) && v121 > 0) return v121;
  const v122 = Number(v119?.["audioDuration"]);
  if (Number["isFinite"](v122) && v122 > 0) return v122;
  return await loadAudioDurationSec(v120);
}
async function buildLipSyncSubmitPatch({
  nodeData: v123,
  slotEntries: v124,
  prompt: v125,
}) {
  const v126 = {},
    v127 = { prompt: v125, inputUrls: [], rhVideoFps: 24 },
    v128 = Number(v123["rhVideoFrames"]);
  let v129 = Number["isFinite"](v128)
    ? Math["max"](0, Math["trunc"](v128))
    : 77;
  if (!Number["isFinite"](v128)) v126["rhVideoFrames"] = 77;
  const v130 = Number(v123["rhVideoResolution"]),
    v131 = normalizeRhVideoResolution(v130);
  (!Number["isFinite"](v130) || v131 !== v130) &&
    (v126["rhVideoResolution"] = v131);
  v127["rhVideoResolution"] = v131;
  const v132 = v124["sourceVideo"],
    v133 = v124["refImage"],
    v134 = v124["audio"],
    v135 = v133?.["url"] ? "image" : v132?.["url"] ? "video" : "";
  if (!v135)
    return (
      globalThis["window"]?.["showToast"]?.(
        "请接入一个视频或参考图输入",
        "warn",
      ),
      null
    );
  if (!v134?.["url"])
    return (
      globalThis["window"]?.["showToast"]?.("请接入一个音频输入", "warn"),
      null
    );
  const v136 = v135 === "video" ? getVideoDurationSec(v132["node"]) : 0;
  if (v129 === 0) {
    if (v135 === "image")
      return (
        globalThis["window"]?.["showToast"]?.(
          "参考图入参请设置大于 0 的帧数",
          "warn",
        ),
        null
      );
    if (!(Number["isFinite"](v136) && v136 > 0))
      return (
        globalThis["window"]?.["showToast"]?.(
          "无法读取视频时长，请等待视频信息加载后再生成",
          "warn",
        ),
        null
      );
    v129 = Math["max"](1, Math["round"](v136 * 24));
  }
  const v137 = await getAudioDurationSec(v134["node"], v134["url"]);
  if (!(Number["isFinite"](v137) && v137 > 0))
    return (
      globalThis["window"]?.["showToast"]?.(
        "无法读取音频时长，请等待音频加载后再生成",
        "warn",
      ),
      null
    );
  if (v129 / 24 > v137 + 0.001)
    return (
      globalThis["window"]?.["showToast"]?.(
        "生成视频时长不能超过音频时长",
        "warn",
      ),
      null
    );
  return (
    (v127["rhVideoFrames"] = v129),
    (v127["frameCount"] = v129),
    (v127["rhLipSyncInputIndex"] = v135 === "image" ? 0 : 1),
    v135 === "image"
      ? (v127["inputUrls"] = [v133["url"]])
      : ((v127["inputUrls"] = []), (v127["videoUrl"] = v132["url"])),
    (v127["audioUrl"] = v134["url"]),
    { payloadPatch: v127, updateData: v126 }
  );
}
function getAudioDurationGuard(v138) {
  const v139 = v138?.["extensions"]?.["audioDurationGuard"];
  return v139 && typeof v139 === "object" && !Array["isArray"](v139)
    ? v139
    : null;
}
function resolveFrameCountForAudioDurationGuard(v140, v141) {
  const v142 = Array["isArray"](v141?.["frameFields"])
    ? v141["frameFields"]
    : [v141?.["frameField"] || "rhVideoFrames"];
  for (const v143 of v142) {
    const v144 = String(v143 || "")["trim"]();
    if (!v144) continue;
    const v145 = Number(v140?.[v144]);
    if (Number["isFinite"](v145)) return Math["max"](0, Math["trunc"](v145));
  }
  const v146 = Number(v141?.["defaultFrames"]);
  return Number["isFinite"](v146) ? Math["max"](0, Math["trunc"](v146)) : 0;
}
async function validateAudioDurationGuard({
  execution: v147,
  payloadPatch: v148,
  slotEntries: v149,
} = {}) {
  const v150 = getAudioDurationGuard(v147);
  if (!v150) return true;
  const v151 = Number(v150["fps"]);
  if (!(Number["isFinite"](v151) && v151 > 0)) return true;
  const v152 = resolveFrameCountForAudioDurationGuard(v148, v150);
  if (!(Number["isFinite"](v152) && v152 > 0)) return true;
  const v153 = String(v150["audioSlot"] || "audio")["trim"]() || "audio",
    v154 = v149?.[v153] || {},
    v155 = String(v148?.["audioUrl"] || v154?.["url"] || "")["trim"](),
    v156 = await getAudioDurationSec(v154["node"], v155);
  if (!(Number["isFinite"](v156) && v156 > 0))
    return (
      globalThis["window"]?.["showToast"]?.(
        v150["missingDurationMessage"] ||
          "无法读取音频时长，请等待音频加载后再生成",
        "warn",
      ),
      false
    );
  if (v152 / v151 > v156 + 0.001)
    return (
      globalThis["window"]?.["showToast"]?.(
        v150["message"] || "生成视频时长不能超过音频时长",
        "warn",
      ),
      false
    );
  return true;
}
async function buildSpecificSubmitPatch(v157, v158) {
  if (
    v158?.["extensions"]?.["payloadResolver"] === RH_VIDEO_V54_PAYLOAD_RESOLVER
  )
    return buildV54SubmitPatch(v157);
  const { slotEntries: v159 } = resolveManifestFixedSlotInputs(v157);
  if (v158?.["id"] === RH_VIDEO_BASIC_EXECUTION_ID)
    return buildBasicSubmitPatch({ ...v157, slotEntries: v159 });
  if (v158?.["id"] === RH_VIDEO_LTX23_EXECUTION_ID)
    return buildLtxSubmitPatch({ ...v157, slotEntries: v159 });
  if (v158?.["id"] === RH_VIDEO_LIPSYNC_EXECUTION_ID)
    return await buildLipSyncSubmitPatch({ ...v157, slotEntries: v159 });
  return { payloadPatch: {}, updateData: {} };
}
export async function buildRunningHubVideoWorkflowSubmitPatch(v160 = {}) {
  const v161 = String(v160["model"] || v160["nodeData"]?.["model"] || "")[
      "trim"
    ](),
    v162 = getRunningHubVideoExecution(v161),
    v163 = buildVideoWorkflowDisplayParamsPatch(
      v161,
      v160["nodeData"]?.["generationParams"],
    ),
    v164 = getPlainGenerationParams(v160["nodeData"]?.["generationParams"]),
    { slotEntries: v165 } = resolveManifestFixedSlotInputs(v160),
    v166 = buildGenericFixedSlotPayloadPatchFromEntries(v165),
    v167 = await buildSpecificSubmitPatch(v160, v162);
  if (v167 === null) return null;
  const v168 = {
      generationParams: v164,
      ...v163,
      ...v166,
      ...(v167?.["payloadPatch"] || {}),
    },
    v169 = await validateAudioDurationGuard({
      execution: v162,
      payloadPatch: v168,
      slotEntries: v165,
    });
  if (!v169) return null;
  return { payloadPatch: v168, updateData: v167?.["updateData"] || {} };
}
