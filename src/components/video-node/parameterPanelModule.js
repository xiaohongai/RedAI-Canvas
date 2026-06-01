import {
  APIMART_DREAMINA_VIDEO_DEFAULT_MODEL,
  buildDreaminaStyleVideoNodeNormalizationPatch,
  ensureDreaminaStyleVideoModelForTask,
  getDreaminaStyleVideoDurationRange,
  getDreaminaStyleVideoResolutionOptions,
  getDreaminaVideoTaskParamVisibility,
  isApimartDreaminaVideoModel,
  isDreaminaStyleVideoModel,
  isDreaminaVideoRouteModeEnabled,
  normalizeDreaminaVideoAspectRatio,
  normalizeDreaminaStyleVideoDuration,
  getDreaminaStyleVideoDefaultModel,
  normalizeDreaminaStyleVideoModel,
  normalizeDreaminaStyleVideoResolution,
  normalizeDreaminaVideoRouteMode,
  resolveDreaminaStyleVideoProvider,
  resolveDreaminaVideoTaskType,
  validateDreaminaVideoRouteSelection,
} from "../../modules/dreaminaVideoModelHelper.js";
import {
  getModelManifest,
  normalizeProviderId,
  resolveModelExecution,
  resolveModelProvider,
} from "../../manifests/index.js";
import {
  buildFixedInputAssetSlotMap,
  getFixedInputSlotConfigFromManifest,
  resolveFixedInputSlotForRef,
} from "../../modules/fixedInputAssetRefs.js";
import {
  flushPromptHtmlCommit,
  resolvePromptTextWithTextRefs,
} from "../../modules/nodePromptShared.js";
import { resolveEffectiveInputKind } from "../../modules/modelInputPolicy.js";
import {
  DEBUG_WRENCH_ICON_HTML,
  formatFinalApiDebugRequest,
} from "../../utils/debugRequestPreview.js";
import { resolveGenerationButtonMode } from "../../core/generationTaskUiState.js";
import {
  resetGenerateButtonIdleUi,
  setGenerateButtonCancellableUi,
  setGenerateButtonLoadingUi,
} from "../../modules/previewGenerateButtonUi.js";
import {
  buildModelUiSchemaDefaultParams,
  bindUiSchemaFieldControls,
  bindModelUiSchemaControls,
  hasModelUiSchema,
  renderModelUiSchemaControls,
  renderUiSchemaFields,
  sanitizeModelUiSchemaParams,
  syncModelUiSchemaControls,
} from "../aigenImage/uiSchemaRenderer.js";
import {
  applyImageSchemaRatioResizeAnimation,
  buildImageSchemaAspectRatioDisplayPatch,
} from "../aigenImage/uiModuleModelHelpers.js";
import {
  renderNodeModelMenu,
  renderNodeModelTrigger,
} from "../shared/nodeModelMenu.js";
import {
  bindNodeFooterController,
  bindNodeSubmenus,
  closeNodeFooterMenus,
} from "../shared/nodeFooterControls.js";
import {
  buildVideoWorkflowDisplayParamsPatch,
  buildVideoWorkflowGenerationParamsPatch,
  buildVideoWorkflowModelSelectionPatch,
  getRunningHubVideoWorkflowFpsOptions,
  getRunningHubVideoParameterPanelPolicy,
  getPlainGenerationParams,
  hasRunningHubVideoWorkflowUiPlacement,
  isRunningHubVideoWorkflowManifest,
} from "./runningHubVideoUiSchema.js";
import {
  arePlainObjectsEqual,
  buildApimartVideoMenuItemsHtml,
  buildApimartVideoLogoHTML,
  buildDreaminaVideoLogoHTML,
  buildDreaminaOfficialVideoMenuItems,
  buildDreaminaTaskModelMenuHtml,
  buildRunningHubVideoModelApiMenuItems,
  buildRunningHubVideoWorkflowMenuItems,
  buildVolcengineOfficialVideoMenuItems,
  buildVolcengineVideoLogoHTML,
  getDefaultRunningHubVideoWorkflowModelId,
  getDreaminaTaskModelMenuItems,
  getDreaminaTaskModelMenuMeta,
  getRhV54FpsOptions,
  normalizeRhStandardFps,
  normalizeRhV54Fps,
} from "./parameterPanelModelHelpers.js";
import {
  buildDreaminaParamPatch,
  buildDreaminaModelSelectionParamPatch,
  buildDreaminaParamSchemaFields,
  buildDreaminaRouteModeUpdate,
  buildDreaminaStorePatchFromNormalization,
  getDreaminaEffectiveNodeData,
  resolveDreaminaRememberedRouteModel,
} from "./dreaminaParameterSchema.js";
const VIDEO_GENERATE_TITLE = "生成视频",
  VIDEO_CANCEL_TOOLTIP = "点击生成，再次点击可以取消运行",
  DEFAULT_VIDEO_PROMPT_PLACEHOLDER =
    "描述视频内容，按 @ 引用素材，/呼出指令...",
  APIMART_KLING_V3_OMNI_MODEL_ID = "apimart/kling-v3-omni",
  HAPPYHORSE_BODY_RESOLVERS = new Set([
    "apimartHappyHorseVideo",
    "runninghubHappyHorseVideo",
  ]),
  WAN27_BODY_RESOLVERS = new Set(["apimartWan27Video", "runninghubWan27Video"]),
  RH_WORKFLOW_DISPLAY_FIELD_IDS = new Set([
    "rhVideoResolution",
    "rhVideoFps",
    "rhVideoFrames",
    "rhVideoSeconds",
  ]),
  RH_V54_BOOLEAN_FIELD_IDS = new Set([
    "rhBlendIntoScene",
    "rhSubtractSubject",
    "rhMaskRect",
  ]),
  RH_WORKFLOW_BOOLEAN_FIELD_IDS = new Set([
    ...RH_V54_BOOLEAN_FIELD_IDS,
    "rhEnableMask",
  ]);
function getDefaultVideoModelId() {
  return getDefaultRunningHubVideoWorkflowModelId();
}
function normalizeRhVideoFpsByPolicy(v0, v1) {
  return v0?.["sourceFrameCountFps"] === "v54"
    ? normalizeRhV54Fps(v1)
    : normalizeRhStandardFps(v1);
}
function findPreferredVideoEdge(v2, v3) {
  return v2["find"]((v4) => {
    const v5 = v3?.["nodes"]?.[v4?.["sourceId"]],
      v6 = String(v5?.["type"] || "");
    return v6 === "source-video" || v6 === "video" || v6 === "ai-video";
  });
}
function normalizeRhV54SingleControlPreset(v7) {
  const v8 = String(v7 ?? "")["trim"]();
  return v8 === "efficiency" || v8 === "stable" || v8 === "quality"
    ? v8
    : "efficiency";
}
function normalizeRhV54SpecialModeValue(v9) {
  const v10 = String(v9 ?? "")["trim"]();
  return v10 === "longVideoOverlay" || v10 === "cameraMove" ? v10 : null;
}
function normalizeRhV54MaskExpandValue(v11) {
  const v12 = Number(v11);
  return Number["isFinite"](v12)
    ? Math["max"](-9999, Math["min"](9999, Math["trunc"](v12)))
    : 25;
}
function normalizeRhV54BreastJiggleValue(v13) {
  const v14 = Number(v13);
  if (!Number["isFinite"](v14)) return 0;
  return Math["max"](0, Math["min"](1, Math["round"](v14 * 20) / 20));
}
function isApimartPanelModel(v15 = {}, v16 = "") {
  const v17 = String(v15?.["provider"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v18 = String(v15?.["model"] || "")["trim"](),
    v19 =
      resolveModelExecution(v18, { providerHint: v17 }) ||
      resolveModelExecution(v18),
    v20 = String(
      v19?.["canonicalModelId"] || v19?.["modelManifest"]?.["modelId"] || v18,
    )["trim"](),
    v21 = String(v19?.["modelManifest"]?.["provider"] || v17)
      ["trim"]()
      ["toLowerCase"]();
  return v20 === v16 && (!v21 || v21 === "apimart");
}
function isHappyHorsePanelModel(v22 = {}) {
  return isPanelModelUsingBodyResolver(v22, HAPPYHORSE_BODY_RESOLVERS);
}
function isPanelModelUsingBodyResolver(v23 = {}, v24 = new Set()) {
  const v25 = String(v23?.["provider"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v26 = String(v23?.["model"] || "")["trim"](),
    v27 =
      resolveModelExecution(v26, { providerHint: v25 }) ||
      resolveModelExecution(v26),
    v28 = String(
      v27?.["executionManifest"]?.["extensions"]?.["bodyResolver"] || "",
    )["trim"]();
  return v28 && v24["has"](v28);
}
function isWan27PanelModel(v29 = {}) {
  return isPanelModelUsingBodyResolver(v29, WAN27_BODY_RESOLVERS);
}
function isKlingV3OmniPanelModel(v30 = {}) {
  return isApimartPanelModel(v30, APIMART_KLING_V3_OMNI_MODEL_ID);
}
function getPanelModelManifest(v31 = {}) {
  const v32 = String(v31?.["model"] || "")["trim"]();
  if (!v32) return null;
  const v33 =
    resolveModelExecution(v32, { providerHint: v31?.["provider"] }) ||
    resolveModelExecution(v32);
  return v33?.["modelManifest"] || getModelManifest(v32) || null;
}
function getManifestConditionFieldValue(v34 = {}, v35 = "") {
  const v36 = String(v35 || "")["trim"]();
  if (!v36) return undefined;
  const v37 = getPlainGenerationParams(v34?.["generationParams"]);
  if (Object["prototype"]["hasOwnProperty"]["call"](v37, v36)) return v37[v36];
  if (Object["prototype"]["hasOwnProperty"]["call"](v34 || {}, v36))
    return v34[v36];
  const v38 = v36["split"](".")["filter"](Boolean);
  if (v38["length"] <= 1) return undefined;
  let v39 = v34;
  for (const v40 of v38) {
    if (!v39 || typeof v39 !== "object") return undefined;
    v39 = v39[v40];
  }
  return v39;
}
function manifestConditionMatches(v41, v42 = {}) {
  if (Array["isArray"](v41))
    return v41["some"]((v43) => manifestConditionMatches(v43, v42));
  if (!v41 || typeof v41 !== "object") return false;
  if (Array["isArray"](v41["any"]))
    return v41["any"]["some"]((v44) => manifestConditionMatches(v44, v42));
  if (Array["isArray"](v41["all"]))
    return v41["all"]["every"]((v45) => manifestConditionMatches(v45, v42));
  const v46 = String(v41["field"] || v41["param"] || "")["trim"]();
  if (!v46) return false;
  const v47 = getManifestConditionFieldValue(v42, v46),
    v48 = Array["isArray"](v41["values"])
      ? v41["values"]
      : Object["prototype"]["hasOwnProperty"]["call"](v41, "value")
        ? [v41["value"]]
        : [];
  if (v48["length"] === 0) return Boolean(v47);
  return v48["some"](
    (v49) => v47 === v49 || String(v47 ?? "") === String(v49 ?? ""),
  );
}
function resolveManifestPromptPlaceholder(v50, v51 = {}) {
  if (!v50 || typeof v50 !== "object") return "";
  const v52 = Array["isArray"](v50["variants"]) ? v50["variants"] : [];
  for (const v53 of v52) {
    if (
      v53 &&
      typeof v53 === "object" &&
      manifestConditionMatches(v53["when"], v51)
    ) {
      const v54 = String(v53["placeholder"] || "")["trim"]();
      if (v54) return v54;
    }
  }
  return String(v50["placeholder"] || "")["trim"]();
}
export function resolveVideoPromptPlaceholder(
  v55,
  v56 = {},
  v57 = DEFAULT_VIDEO_PROMPT_PLACEHOLDER,
) {
  const v58 = resolveManifestPromptPlaceholder(v55?.["prompt"], v56);
  return v58 || String(v57 || "")["trim"]();
}
function fieldConditionReferences(v59, v60) {
  const v61 = String(v60 || "")["trim"]();
  if (Array["isArray"](v59))
    return v59["some"]((v62) => fieldConditionReferences(v62, v61));
  if (!v61 || !v59 || typeof v59 !== "object") return false;
  if (String(v59["field"] || v59["param"] || "")["trim"]() === v61) return true;
  return ["all", "any"]["some"](
    (v63) =>
      Array["isArray"](v59[v63]) &&
      v59[v63]["some"]((v64) => fieldConditionReferences(v64, v61)),
  );
}
function manifestHelpVariantsReferenceField(v65, v66) {
  const v67 = Array["isArray"](v65?.["help"]?.["variants"])
    ? v65["help"]["variants"]
    : [];
  return v67["some"]((v68) => fieldConditionReferences(v68?.["when"], v66));
}
function manifestPromptVariantsReferenceField(v69, v70) {
  const v71 = Array["isArray"](v69?.["prompt"]?.["variants"])
    ? v69["prompt"]["variants"]
    : [];
  return v71["some"]((v72) => fieldConditionReferences(v72?.["when"], v70));
}
function manifestFixedSlotVisibilityReferencesField(v73, v74) {
  const v75 = Array["isArray"](v73?.["inputSlots"]?.["fixedSlots"])
    ? v73["inputSlots"]["fixedSlots"]
    : [];
  return v75["some"](
    (v76) =>
      fieldConditionReferences(v76?.["showWhen"], v74) ||
      fieldConditionReferences(v76?.["hideWhen"], v74),
  );
}
function normalizeHappyHorsePanelMode(v77) {
  const v78 = String(v77 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v78 === "image" || v78 === "reference" || v78 === "edit"
    ? v78
    : "auto";
}
function normalizeWan27PanelMode(v79) {
  const v80 = String(v79 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v80 === "video" || v80 === "reference" || v80 === "edit"
    ? v80
    : "image";
}
function normalizeKlingV3OmniPanelMode(v81) {
  const v82 = String(v81 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v82 === "reference" || v82 === "edit" ? v82 : "image";
}
function getPanelInputKind(v83, v84) {
  const v85 = resolveEffectiveInputKind(v83, v84);
  if (v85) return v85;
  const v86 = String(v83?.["type"] || "")["toLowerCase"]();
  if (v86["includes"]("video")) return "video";
  if (v86["includes"]("image")) return "image";
  if (v86["includes"]("audio")) return "audio";
  if (v86["includes"]("text")) return "text";
  return "";
}
function getHappyHorseModeEdgeIdsToRemove({
  nextMode: v87,
  inEdges: inEdges = [],
  nodes: nodes = {},
} = {}) {
  const v88 = normalizeHappyHorsePanelMode(v87),
    v89 = [];
  let v90 = 0,
    v91 = 0;
  for (const v92 of Array["isArray"](inEdges) ? inEdges : []) {
    const v93 = nodes?.[v92?.["sourceId"]],
      v94 = getPanelInputKind(v93, v92);
    if (v94 === "video") {
      if (v88 === "edit" && v91 < 1) v91 += 1;
      else v92?.["id"] && v89["push"](v92["id"]);
      continue;
    }
    if (v94 === "image") {
      if (v88 === "image") {
        if (v90 < 1) v90 += 1;
        else {
          if (v92?.["id"]) v89["push"](v92["id"]);
        }
      } else {
        if (v88 === "edit") {
          if (v90 < 5) v90 += 1;
          else {
            if (v92?.["id"]) v89["push"](v92["id"]);
          }
        } else {
          if (v88 === "reference") {
            if (v90 < 9) v90 += 1;
            else {
              if (v92?.["id"]) v89["push"](v92["id"]);
            }
          }
        }
      }
      continue;
    }
    v94 === "audio" && v92?.["id"] && v89["push"](v92["id"]);
  }
  return v89;
}
function getWan27ModeEdgeIdsToRemove({
  nextMode: v95,
  inEdges: inEdges = [],
  nodes: nodes = {},
} = {}) {
  const v96 = normalizeWan27PanelMode(v95),
    v97 = [];
  let v98 = 0,
    v99 = 0,
    v100 = 0;
  for (const v101 of Array["isArray"](inEdges) ? inEdges : []) {
    const v102 = nodes?.[v101?.["sourceId"]],
      v103 = getPanelInputKind(v102, v101);
    if (v103 === "image") {
      if (v96 === "image" && v98 < 2) v98 += 1;
      else {
        if (v96 === "reference" && v98 < 1) v98 += 1;
        else v101?.["id"] && v97["push"](v101["id"]);
      }
      continue;
    }
    if (v103 === "video") {
      if (v96 === "video" && v99 < 1) v99 += 1;
      else {
        if (v96 === "reference" && v99 < 1) v99 += 1;
        else {
          if (v96 === "edit" && v99 < 2) v99 += 1;
          else v101?.["id"] && v97["push"](v101["id"]);
        }
      }
      continue;
    }
    if (v103 === "audio") {
      if ((v96 === "image" || v96 === "reference") && v100 < 1) v100 += 1;
      else v101?.["id"] && v97["push"](v101["id"]);
    }
  }
  return v97;
}
function getKlingV3OmniModeEdgeIdsToRemove({
  nextMode: v104,
  inEdges: inEdges = [],
  nodes: nodes = {},
} = {}) {
  const v105 = normalizeKlingV3OmniPanelMode(v104),
    v106 = [];
  let v107 = 0,
    v108 = 0;
  for (const v109 of Array["isArray"](inEdges) ? inEdges : []) {
    const v110 = nodes?.[v109?.["sourceId"]],
      v111 = getPanelInputKind(v110, v109);
    if (v111 === "image") {
      if (v105 === "image" && v107 < 2) v107 += 1;
      else {
        if (v105 === "reference" && v107 < 1) v107 += 1;
        else v109?.["id"] && v106["push"](v109["id"]);
      }
      continue;
    }
    if (v111 === "video") {
      if ((v105 === "reference" || v105 === "edit") && v108 < 1) v108 += 1;
      else v109?.["id"] && v106["push"](v109["id"]);
      continue;
    }
    v111 === "audio" && v109?.["id"] && v106["push"](v109["id"]);
  }
  return v106;
}
function buildSchemaParamsPatch(v112, v113, v114 = {}) {
  const v115 = {
      ...getPlainGenerationParams(v112?.["generationParams"]),
      ...getPlainGenerationParams(v114?.["generationParams"]),
      ...(v113 && typeof v113 === "object" ? v113 : {}),
    },
    v116 = { generationParams: v115 },
    v117 = String(v112?.["model"] || "")["trim"]();
  return (
    v117 &&
      (v116["generationParamsByModel"] = {
        ...getPlainGenerationParams(v112?.["generationParamsByModel"]),
        [v117]: v115,
      }),
    v116
  );
}
function getUiSchemaFieldIds(v118) {
  const v119 = getModelManifest(v118);
  return new Set(
    (Array["isArray"](v119?.["uiSchema"]?.["fields"])
      ? v119["uiSchema"]["fields"]
      : [])
      ["map"]((v120) => String(v120?.["id"] || "")["trim"]())
      ["filter"](Boolean),
  );
}
const DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER = Object["freeze"]([
  "resolution",
  "mode",
]);
function resolveVideoModelApiFooterPlacementOrder(v121 = {}) {
  const v122 = new Set(DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER),
    v123 = [],
    v124 = Array["isArray"](v121?.["uiSchema"]?.["footerPlacementOrder"])
      ? v121["uiSchema"]["footerPlacementOrder"]
      : [];
  return (
    v124["forEach"]((v125) => {
      const v126 = String(v125 || "")
        ["trim"]()
        ["toLowerCase"]();
      v122["has"](v126) && !v123["includes"](v126) && v123["push"](v126);
    }),
    DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER["forEach"]((v127) => {
      if (!v123["includes"](v127)) v123["push"](v127);
    }),
    v123
  );
}
function wrapUiSchemaPlacementControls(v128) {
  return v128 ? '<div class="ui-schema-placement">' + v128 + "</div>" : "";
}
function sanitizeVideoModelApiParams(v129, v130 = {}, v131 = {}) {
  const v132 = getPlainGenerationParams(v130);
  try {
    return sanitizeModelUiSchemaParams(v129, v132, v131);
  } catch {
    return v132;
  }
}
export function buildVideoModelApiModelSelectionPatch(
  v133 = {},
  v134 = "",
  v135 = null,
  v136 = {},
) {
  const v137 = String(v134 || "")["trim"]();
  if (!v137) return {};
  const v138 = String(v133?.["model"] || "")["trim"](),
    v139 = getPlainGenerationParams(v133?.["generationParamsByModel"]);
  v138 &&
    (v139[v138] = sanitizeVideoModelApiParams(
      v138,
      v133?.["generationParams"],
      { includeDefaults: false },
    ));
  const v140 = getUiSchemaFieldIds(v137),
    v141 = buildModelUiSchemaDefaultParams(v137),
    v142 = getPlainGenerationParams(v139[v137]),
    v143 = Object["prototype"]["hasOwnProperty"]["call"](
      v136,
      "generationParams",
    ),
    v144 = v143 ? getPlainGenerationParams(v136["generationParams"]) : {},
    v145 = {};
  Object["entries"](v136 || {})["forEach"](([v146, v147]) => {
    if (v140["has"](v146)) v145[v146] = v147;
  });
  const v148 = { ...v141, ...v142, ...v144, ...v145 },
    v149 = Object["fromEntries"](
      Object["entries"](v148)["filter"](([v150]) => v140["has"](v150)),
    ),
    v151 = sanitizeVideoModelApiParams(v137, v149, { includeDefaults: true }),
    { generationParams: v152, ...v153 } = v136 || {},
    v154 = { ...v153 };
  return (
    v140["forEach"]((v155) => {
      delete v154[v155];
    }),
    {
      ...v154,
      model: v137,
      provider: v135,
      generationParams: v151,
      generationParamsByModel: v139,
    }
  );
}
function buildRhWorkflowFieldPatch(v156, v157, v158, v159 = {}) {
  const v160 = String(v157 || "")["trim"]();
  if (RH_WORKFLOW_DISPLAY_FIELD_IDS["has"](v160)) return { [v160]: v158 };
  if (v160 === "rhSingleControlPreset" || v160 === "rhControlMode") {
    const v161 = String(v158 || "")["trim"](),
      v162 =
        v161 === "multi"
          ? { rhControlMode: "multi", rhSingleControlPreset: null }
          : {
              rhControlMode: "single",
              rhSingleControlPreset: normalizeRhV54SingleControlPreset(v161),
            };
    return { ...buildSchemaParamsPatch(v156, v162, v159), ...v162 };
  }
  if (RH_WORKFLOW_BOOLEAN_FIELD_IDS["has"](v160)) {
    const v163 = v158 === true || String(v158) === "true",
      v164 = { [v160]: v163 };
    return { ...buildSchemaParamsPatch(v156, v164, v159), ...v164 };
  }
  if (v160 === "rhSpecialMode") {
    const v165 = getPlainGenerationParams(v156?.["generationParams"]),
      v166 = normalizeRhV54SpecialModeValue(
        v165["rhSpecialMode"] !== undefined
          ? v165["rhSpecialMode"]
          : v156?.["rhSpecialMode"],
      ),
      v167 = normalizeRhV54SpecialModeValue(v158),
      v168 = v166 === v167 ? null : v167,
      v169 = { rhSpecialMode: v168 };
    return { ...buildSchemaParamsPatch(v156, v169, v159), ...v169 };
  }
  if (v160 === "rhMaskExpand") {
    const v170 = normalizeRhV54MaskExpandValue(v158),
      v171 = { rhMaskExpand: v170 };
    return {
      ...buildSchemaParamsPatch(v156, v171, v159),
      rhMaskExpand: v170,
      rhMaskExpandTouched: true,
    };
  }
  if (v160 === "rhBreastJiggle") {
    const v172 = normalizeRhV54BreastJiggleValue(v158),
      v173 = { rhBreastJiggle: v172 };
    return {
      ...buildSchemaParamsPatch(v156, v173, v159),
      rhBreastJiggle: v172,
    };
  }
  return {};
}
export function createVideoNodeParameterPanelModule(v174) {
  const {
    store: v175,
    api: v176,
    getDisplayModelName: v177,
    PROVIDERS_META: v178,
    getAIGenerationNodeSize: v179,
    getDisplayedMediaSizeFromNode: v180,
    activateMenuKeyboard: v181,
    isVideoVipModel: v182,
  } = v174;
  class v183 {
    ["_getRhVideoAdvancedSchemaNodeData"](v184 = {}) {
      const v185 = String(v184?.["model"] || "")["trim"](),
        v186 = getRunningHubVideoParameterPanelPolicy(v185);
      let v187 = v184;
      if (v186["sourceFrameCountFps"]) {
        const v188 = normalizeRhVideoFpsByPolicy(v186, v184?.["rhVideoFps"]);
        v187 = {
          ...v187,
          rhVideoSourceFrameCount:
            this["_getRhV5SourceVideoFrameCount"]?.(v188) || 0,
        };
      }
      if (v186["maskVideoDisablesSubtractSubject"] !== true) return v187;
      const v189 = (v175["getIncomingEdges"](this["nodeId"]) || [])["some"](
        (v190) => {
          const v191 = String(v190?.["refSlot"] || "")["trim"]();
          return v191 === "videoMask" || v191 === "maskVideo";
        },
      );
      if (!v189) return v187;
      return {
        ...v187,
        rhV54HasMaskVideo: true,
        rhSubtractSubject: false,
        generationParams: {
          ...getPlainGenerationParams(v187?.["generationParams"]),
          rhSubtractSubject: false,
        },
      };
    }
    ["_buildVideoModelMenuHtml"](v192 = "") {
      const v193 =
        String(v192 || this["_data"]?.["model"] || "")["trim"]() ||
        getDefaultVideoModelId();
      return renderNodeModelMenu({
        kind: "video",
        activeModel: v193,
        items: [
          ...buildDreaminaOfficialVideoMenuItems(),
          ...buildVolcengineOfficialVideoMenuItems(
            v193,
            this["_data"]?.["provider"],
          ),
        ],
        groups: [
          {
            id: "apimart-video",
            headerClass: "apimart-video-group-header",
            submenuClass: "apimart-video-submenu",
            toggleAttr: "data-apimart-video-toggle",
            label: "APIMart",
            subtitle: "视频生成模型",
            iconHtml: buildApimartVideoLogoHTML(20),
            itemsHtml: buildApimartVideoMenuItemsHtml(
              v193,
              this["_data"]?.["provider"],
            ),
          },
          {
            id: "runninghub",
            label: "RunningHUB工作流",
            subtitle: "AI\x20工作流",
            icon: "images/RH.png",
            iconAlt: "runninghub",
            itemsHtml: buildRunningHubVideoWorkflowMenuItems(v193),
          },
          {
            id: "runninghub-model",
            label: "RunningHUB模型",
            subtitle: "标准模型 API",
            icon: "images/RH.png",
            iconAlt: "runninghub",
            itemsHtml: buildRunningHubVideoModelApiMenuItems(v193),
          },
        ],
      });
    }
    ["_renderFooterImpl"](v194) {
      let v195 = false;
      const v196 = v194["querySelector"](".rh-vram-adv-panel");
      v196 && (v195 = v196["classList"]["contains"]("show"));
      const v197 = this["_isDreaminaVideoNode"](this["_data"])
        ? this["_syncDreaminaTaskState"](this["_data"], { syncStore: true })
        : null;
      v197?.["nodeData"] && (this["_data"] = v197["nodeData"]);
      const v198 = Boolean(v197),
        v199 =
          String(this["_data"]["model"] || "")["trim"]() ||
          getDefaultVideoModelId();
      if (isRunningHubVideoWorkflowManifest(v199)) {
        const v200 = buildVideoWorkflowGenerationParamsPatch(
            this["_data"],
            v199,
          ),
          v201 = buildVideoWorkflowDisplayParamsPatch(
            v199,
            v200["generationParams"],
            { v54FpsOptions: getRhV54FpsOptions() },
          ),
          v202 = Object["entries"](v201)["some"](
            ([v203, v204]) => this["_data"]?.[v203] !== v204,
          );
        if (
          v200["generationParams"] &&
          (!arePlainObjectsEqual(
            v200["generationParams"],
            getPlainGenerationParams(this["_data"]["generationParams"]),
          ) ||
            !arePlainObjectsEqual(
              v200["generationParamsByModel"],
              getPlainGenerationParams(
                this["_data"]["generationParamsByModel"],
              ),
            ) ||
            v202)
        ) {
          const v205 = { ...v200, ...v201 };
          (v175["updateNodeData"](this["nodeId"], v205),
            (this["_data"] = { ...this["_data"], ...v205 }));
        }
      }
      const v206 = v199["includes"]("seedance"),
        v207 =
          v197?.["nodeData"]?.["resolution"] ||
          this["_data"]["resolution"] ||
          (v206 ? "720p" : "1080p"),
        v208 = this["_getModelParamVisibility"](
          v199,
          this["_data"]["provider"],
        ),
        v209 = this["_isRunninghubWorkflowModel"](
          v199,
          this["_data"]["provider"],
        ),
        v210 = this["_resolveModelExecution"](v199, this["_data"]["provider"]),
        v211 =
          !v198 &&
          !v209 &&
          v210?.["modelManifest"]?.["adapterType"] === "modelApi" &&
          v210?.["modelManifest"]?.["kind"] === "video",
        v212 = v211
          ? String(
              v210?.["canonicalModelId"] ||
                v210?.["modelManifest"]?.["modelId"] ||
                v199,
            )["trim"]()
          : v199,
        v213 = v209,
        v214 = v213
          ? renderModelUiSchemaControls(v199, this["_data"], {
              placement: "instance",
              variant: "instanceToggle",
            })
          : "",
        v215 = hasRunningHubVideoWorkflowUiPlacement(v199, "videoAdvanced"),
        v216 = hasRunningHubVideoWorkflowUiPlacement(v199, "videoParams"),
        v217 = v216
          ? this["_getRhVideoAdvancedSchemaNodeData"](this["_data"])
          : this["_data"],
        v218 = v216
          ? renderModelUiSchemaControls(v199, v217, {
              placement: "videoParams",
              unwrap: true,
              rhVideoFpsOptions: getRunningHubVideoWorkflowFpsOptions(v199, {
                v54FpsOptions: getRhV54FpsOptions(),
              }),
            })
          : "",
        v219 = v211
          ? renderModelUiSchemaControls(v212, this["_data"], {
              placement: "mode",
            })
          : "",
        v220 = v211
          ? renderModelUiSchemaControls(v212, this["_data"], {
              placement: "resolution",
            })
          : "",
        v221 = v211
          ? renderModelUiSchemaControls(v212, this["_data"], {
              placement: "advanced",
            })
          : "",
        v222 = v211 && hasModelUiSchema(v212, { placement: "advanced" }),
        v223 = v215 || v222,
        v224 = this["_getModelIconHTML"](v199, this["_data"]["provider"]),
        v225 = this["_getRatioIconHTML"](
          this["_data"]["aspectRatio"] || "自适应",
        ),
        v226 = (this["_data"]["aspectRatio"] || "自适应") + "\x20·\x20" + v207,
        v227 =
          "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22img-rp-quality-area\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22img-rp-section-label\x22>分辨率</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22img-rp-quality-segmented\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22img-rp-quality-item\x20" +
          (v207 === "480p" ? "active" : "") +
          "\x20" +
          (v206 ? "is-disabled" : "") +
          '" data-value="480p" ' +
          (v206 ? 'disabled title="该模型不可用此分辨率"' : "") +
          ">480p</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22img-rp-quality-item\x20" +
          (v207 === "720p" ? "active" : "") +
          "\x22\x20data-value=\x22720p\x22>720p</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22img-rp-quality-item\x20" +
          (v207 === "1080p" ? "active" : "") +
          "\x20" +
          (v206 ? "is-disabled" : "") +
          '" data-value="1080p" ' +
          (v206 ? 'disabled title="该模型不可用此分辨率"' : "") +
          '>1080p</button>\n                  </div>\n                </div>\n                <div class="img-rp-ratio-area">\n                  <div class="img-rp-section-label">比例</div>\n                  <div class="img-rp-ratio-split">\n                    <div class="img-rp-ratio-left">\n                      <button type="button" class="img-rp-large-adaptive active" data-label="自适应" data-w="1" data-h="1">\n                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>\n                        <span>自适应</span>\n                      </button>\n                    </div>\n                    <div class="img-rp-ratio-right">\n                      <button type="button" class="img-rp-ratio-item" data-label="1:1" data-w="1" data-h="1"><span class="img-rp-icon img-rp-sq"></span><span>1:1</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="9:16" data-w="9" data-h="16"><span class="img-rp-icon img-rp-tall"></span><span>9:16</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="16:9" data-w="16" data-h="9"><span class="img-rp-icon img-rp-wide"></span><span>16:9</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="3:4" data-w="3" data-h="4"><span class="img-rp-icon img-rp-p34"></span><span>3:4</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="4:3" data-w="4" data-h="3"><span class="img-rp-icon img-rp-l43"></span><span>4:3</span></button>\n                      <button type="button" class="img-rp-ratio-item is-disabled" data-label="3:2" data-w="3" data-h="2" disabled><span class="img-rp-icon img-rp-l32"></span><span>3:2</span></button>\n                      <button type="button" class="img-rp-ratio-item is-disabled" data-label="2:3" data-w="2" data-h="3" disabled><span class="img-rp-icon img-rp-p23"></span><span>2:3</span></button>\n                      <button type="button" class="img-rp-ratio-item is-disabled" data-label="5:4" data-w="5" data-h="4" disabled><span class="img-rp-icon img-rp-l54"></span><span>5:4</span></button>\n                      <button type="button" class="img-rp-ratio-item is-disabled" data-label="4:5" data-w="4" data-h="5" disabled><span class="img-rp-icon img-rp-p45"></span><span>4:5</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="21:9" data-w="21" data-h="9"><span class="img-rp-icon img-rp-ultra"></span><span>21:9</span></button>\n                    </div>\n                  </div>\n                </div>\n      ',
        v228 = v211
          ? resolveVideoModelApiFooterPlacementOrder(v210?.["modelManifest"])
          : DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER,
        v229 = v228["indexOf"]("mode"),
        v230 = v228["indexOf"]("resolution"),
        v231 = v211 && v219 && v229 >= 0 && v230 >= 0 && v229 < v230,
        v232 = wrapUiSchemaPlacementControls(v219),
        v233 = wrapUiSchemaPlacementControls(v220);
      v194["innerHTML"] =
        '\n          <div class="img-model-pills">\n            <div class="img-model-wrap">\n              ' +
        renderNodeModelTrigger({ iconHtml: v224, label: v177(v199) }) +
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22floating-menu\x20img-model-menu\x20node-model-menu\x22\x20data-node-menu-kind=\x22video\x22\x20data-lazy-model-menu=\x22video\x22></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20" +
        (v198 ? "" : v231 ? v232 : "") +
        "\n            " +
        (v198
          ? ""
          : v216 && v218
            ? v218
            : v220
              ? v233
              : '<div class="img-ratio-wrap"' +
                (v208["ratio"] ? "" : " hidden") +
                '>\n              <button type="button" class="img-pill-btn img-ratio-btn">\n                <span class="img-ratio-icon-slot">' +
                v225 +
                '</span>\n                <span class="img-ratio-label">' +
                v226 +
                "</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22img-ratio-popup\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20" +
                v227 +
                "\n              </div>\n            </div>") +
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20" +
        (v198
          ? ""
          : v211
            ? v231
              ? ""
              : v219
                ? v232
                : ""
            : "<div\x20class=\x22vid-mode-wrap\x22" +
              (v208["mode"] ? "" : " hidden") +
              ">\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22img-pill-btn\x20vid-mode-btn\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22vid-mode-label\x22>" +
              (this["_data"]["mode"] || "全能参考") +
              '</span>\n              </button>\n              <div class="floating-menu vid-mode-menu">\n                <div class="floating-menu-item video-mode-item ' +
              (!this["_data"]["mode"] || this["_data"]["mode"] === "全能参考"
                ? "active"
                : "") +
              '" data-value="全能参考">\n                  <svg class="video-mode-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>\n                  <span class="floating-menu-label">全能参考</span>\n                </div>\n                <div class="floating-menu-item video-mode-item ' +
              (this["_data"]["mode"] === "首尾帧" ? "active" : "") +
              '" data-value="首尾帧">\n                  <svg class="video-mode-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10M7 17h10"/></svg>\n                  <span class="floating-menu-label">首尾帧</span>\n                </div>\n              </div>\n            </div>') +
        "\n            " +
        (v198 || v211
          ? ""
          : "<div\x20class=\x22vid-duration-wrap\x22" +
            (v208["duration"] ? "" : " hidden") +
            '>\n              <button type="button" class="img-pill-btn vid-duration-btn">\n                <span class="vid-duration-label">' +
            (this["_data"]["duration"] || "5") +
            'S</span>\n              </button>\n              <div class="floating-menu vid-duration-pop">\n                <div class="vid-duration-title">视频时长</div>\n                <input type="range" class="vid-duration-slider" min="4" max="15" step="1" value="' +
            (this["_data"]["duration"] || 5) +
            "\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22vid-duration-bounds\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22vid-duration-min\x22>4S</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22vid-duration-max\x22>15S</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>") +
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22prompt-actions\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22img-pill-btn\x20rh-adv2-btn\x22" +
        (v223 ? "" : " hidden") +
        '>\n              <span class="rh-adv2-label">高级设置</span>\n            </button>\n            <div class="ui-schema-placement ui-schema-instance-slot"' +
        (v213 && v214 ? "" : " hidden") +
        ">\n              " +
        v214 +
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22prompt-submit\x20debug-wrench-btn\x22\x20title=\x22调试\x20API\x20参数\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20" +
        DEBUG_WRENCH_ICON_HTML +
        '\n            </button>\n                  <button type="button" class="prompt-submit img-gen-btn" ' +
        (v209
          ? "data-tooltip=\x22点击生成，再次点击可以取消运行\x22"
          : 'title="生成视频"') +
        ">\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x2214\x22\x20height=\x2214\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22><line\x20x1=\x2212\x22\x20y1=\x2219\x22\x20x2=\x2212\x22\x20y2=\x225\x22/><polyline\x20points=\x225\x2012\x2012\x205\x2019\x2012\x22/></svg>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>";
      const v234 = this["_getRhVideoAdvancedSchemaNodeData"](this["_data"]),
        v235 = v215
          ? renderModelUiSchemaControls(v199, v234, {
              placement: "videoAdvanced",
            })
          : v221,
        v236 = v235
          ? '\n          <div class="rh-vram-adv-panel">\n            ' +
            v235 +
            "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20"
          : "";
      v197 && this["_decorateDreaminaFooter"](v194, v197);
      if (v236) v194["insertAdjacentHTML"]("beforeend", v236);
      ((this["rhVramAdvPanelEl"] = v194["querySelector"](".rh-vram-adv-panel")),
        this["_uiSchemaCleanup"]?.(),
        (this["_uiSchemaCleanup"] = v197
          ? bindUiSchemaFieldControls(v194, {
              getNodeData: () =>
                this["_getDreaminaEffectiveNodeData"](
                  v175["getState"]?.()["nodes"]?.[this["nodeId"]] ||
                    this["_data"] ||
                    {},
                ),
              commitFieldValue: (v237, v238, v239) =>
                this["_commitDreaminaSchemaField"](v237, v238, v239),
            })
          : bindModelUiSchemaControls(v194, {
              nodeId: this["nodeId"],
              nodeData: this["_data"],
              store: v175,
              decorateNodeData: (v240) =>
                this["_getRhVideoAdvancedSchemaNodeData"](v240),
              buildPatch: (v241, v242, v243, v244) => {
                const v245 = String(v242 || "")["trim"]();
                let v246 = [];
                if (
                  isHappyHorsePanelModel(v241) &&
                  v245 === "happyhorse_mode"
                ) {
                  const v247 = v175["getState"]?.() || {};
                  v246 = getHappyHorseModeEdgeIdsToRemove({
                    nextMode: v243,
                    inEdges: v175["getIncomingEdges"]?.(this["nodeId"]) || [],
                    nodes: v247["nodes"] || {},
                  });
                } else {
                  if (isWan27PanelModel(v241) && v245 === "wan27_mode") {
                    const v248 = v175["getState"]?.() || {};
                    v246 = getWan27ModeEdgeIdsToRemove({
                      nextMode: v243,
                      inEdges: v175["getIncomingEdges"]?.(this["nodeId"]) || [],
                      nodes: v248["nodes"] || {},
                    });
                  } else {
                    if (
                      isKlingV3OmniPanelModel(v241) &&
                      v245 === "kling_v3_omni_mode"
                    ) {
                      const v249 = v175["getState"]?.() || {};
                      v246 = getKlingV3OmniModeEdgeIdsToRemove({
                        nextMode: v243,
                        inEdges:
                          v175["getIncomingEdges"]?.(this["nodeId"]) || [],
                        nodes: v249["nodes"] || {},
                      });
                    }
                  }
                }
                if (v246["length"] > 0) {
                  const v250 = () => {
                    v246["forEach"]((v251) => v175["removeEdge"]?.(v251));
                  };
                  if (typeof v175["batch"] === "function") v175["batch"](v250);
                  else v250();
                }
                return {
                  ...buildRhWorkflowFieldPatch(v241, v242, v243, v244),
                  ...this["_buildModelApiAspectRatioDisplayPatch"](
                    v241,
                    v242,
                    v243,
                    v244,
                  ),
                };
              },
              afterCommit: (v252, v253, v254) => {
                const v255 = String(v252 || "")["trim"](),
                  v256 = getPanelModelManifest(v254),
                  v257 = manifestHelpVariantsReferenceField(v256, v255),
                  v258 = manifestPromptVariantsReferenceField(v256, v255),
                  v259 = manifestFixedSlotVisibilityReferencesField(v256, v255);
                (v257 || v258 || v259) &&
                  ((this["_data"] = {
                    ...(this["_data"] || {}),
                    ...(v254 || {}),
                  }),
                  v257 && this["_syncGenerationNodeHelpTip"]?.(),
                  v258 &&
                    this["_syncDreaminaPromptPlaceholder"]?.(this["_data"]),
                  v259 && this["_renderRefBar"]?.(),
                  this["_updateSubmitButtonState"]?.());
              },
            })),
        this["_footerControllerCleanup"]?.(),
        (this["_footerControllerCleanup"] = bindNodeFooterController(v194)),
        v195 &&
          this["rhVramAdvPanelEl"] &&
          this["rhVramAdvPanelEl"]["classList"]["add"]("show"),
        (this["btnEl"] = v194["querySelector"](".img-gen-btn")),
        this["_bindFooterEvents"](v194));
    }
    ["_runVipRetryOnce"](v260) {
      let v261 = false;
      return () => {
        if (v261) return;
        ((v261 = true), (this["_vipSelectionRetryInProgress"] = true));
        try {
          v260();
        } finally {
          this["_vipSelectionRetryInProgress"] = false;
        }
      };
    }
    ["_guardVipSelection"](v262, v263 = null, v264 = null) {
      const v265 = String(v262 || "");
      let v266 = "",
        v267 = v264;
      typeof v263 === "function"
        ? (v267 = v263)
        : (v266 = String(v263 || "")["trim"]());
      if (!v182(v265, v266)) return true;
      const v268 = window["isModelAllowedBySubscription"],
        v269 = typeof v268 === "function" ? v268(v265, v266) : true;
      if (v269) return true;
      if (this["_vipSelectionRetryInProgress"]) return false;
      return (
        typeof window["openSubscriptionDialog"] === "function"
          ? window["openSubscriptionDialog"]({
              modelId: v265,
              provider: v266,
              onSuccess: v267,
            })
          : window["showToast"]?.("需要VIP授权，请先激活CDKEY", "warn"),
        false
      );
    }
    ["_bindFooterEvents"](v270) {
      const v271 = v270["querySelector"](".img-model-btn-trigger"),
        v272 = v270["querySelector"](".img-model-menu"),
        v273 = v270["querySelector"](".dreamina-task-model-btn"),
        v274 = v270["querySelector"](".dreamina-task-model-menu"),
        v275 = v270["querySelector"](".img-ratio-btn"),
        v276 = v270["querySelector"](".img-ratio-popup"),
        v277 = v270["querySelector"](".img-ratio-label"),
        v278 = v270["querySelector"](".img-ratio-icon-slot"),
        v279 = v270["querySelector"](".vid-mode-btn"),
        v280 = v270["querySelector"](".vid-mode-menu"),
        v281 = v270["querySelector"](".vid-mode-label"),
        v282 = v270["querySelector"](".vid-duration-btn"),
        v283 = v270["querySelector"](".vid-duration-pop"),
        v284 = v270["querySelector"](".vid-duration-slider"),
        v285 = v270["querySelector"](".vid-duration-label"),
        v286 = v270["querySelector"](".rh-adv2-btn"),
        v287 = v270["querySelector"](".rh-vram-adv-panel"),
        v288 = () => {
          v276?.["classList"]["remove"]("show");
          if (v276) v276["style"]["display"] = "";
        },
        v289 = () => {
          v283?.["classList"]["remove"]("show");
          if (v283) v283["style"]["display"] = "";
        },
        v290 = this["_isDreaminaVideoNode"](this["_data"]),
        v291 = v290
          ? this["_getDreaminaEffectiveNodeData"](this["_data"])
          : this["_getRhVideoAdvancedSchemaNodeData"](this["_data"]);
      syncModelUiSchemaControls(v270, v291);
      const v292 = (v293) => {
          const v294 = {
            ...(v175["getState"]()["nodes"]?.[this["nodeId"]] ||
              this["_data"] ||
              {}),
            ...(v293 && typeof v293 === "object" ? v293 : {}),
          };
          return (
            v175["updateNodeData"](this["nodeId"], v293),
            (this["_data"] = v294),
            (this["_lastFooterSig"] = ""),
            this["_renderFooter"](v270),
            v294
          );
        },
        v295 = () =>
          v175["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {},
        v296 = ({
          model: v297,
          provider: v298,
          useRememberedRouteModel: useRememberedRouteModel = false,
        } = {}) => {
          const v299 = String(v297 || "")["trim"]();
          if (!v299) return null;
          const v300 = v295(),
            v301 = this["_getDreaminaEffectiveNodeData"](v300),
            v302 = this["_syncDreaminaTaskState"](v300, { syncStore: false }),
            v303 = v302?.["nodeData"] || v301 || v300,
            v304 = resolveDreaminaStyleVideoProvider(
              v299,
              v298 || v303?.["provider"] || "dreamina",
            ),
            v305 =
              v302?.["resolvedTaskType"] ||
              this["_getResolvedDreaminaTaskType"](v303, v302?.["summary"]),
            v306 =
              v302?.["routeMode"] ||
              normalizeDreaminaVideoRouteMode(
                v303?.["dreaminaRouteMode"],
                v303?.["mode"],
              ),
            v307 =
              ensureDreaminaStyleVideoModelForTask(v305, v299, v304) || v299,
            v308 = useRememberedRouteModel
              ? resolveDreaminaRememberedRouteModel(v303, {
                  provider: v304,
                  routeMode: v306,
                  taskType: v305,
                  fallbackModel: v307,
                }) || v307
              : v307,
            v309 = normalizeDreaminaStyleVideoResolution(
              v305,
              v308,
              v303?.["resolution"] || v303?.["videoSize"],
              v304,
            ),
            v310 = normalizeDreaminaStyleVideoDuration(
              v305,
              v308,
              v303?.["duration"],
              v304,
            ),
            v311 = { provider: v304, model: v308 };
          return v292({
            ...v311,
            ...this["_buildDreaminaModelSelectionParamPatch"](v303, {
              model: v308,
              provider: v304,
              taskType: v305,
              fallbackValues: {
                dreaminaRouteMode: v306,
                aspectRatio: v303?.["aspectRatio"],
                ...(v309 ? { resolution: v309 } : {}),
                duration: v310,
              },
            }),
          });
        };
      let v312 = null;
      const v313 = () => {
        if (!v272) return null;
        if (v272["dataset"]["lazyMounted"] === "1") return v272;
        const v314 = v295(),
          v315 =
            String(v314?.["model"] || this["_data"]?.["model"] || "")[
              "trim"
            ]() || getDefaultVideoModelId(),
          v316 = document["createElement"]("template");
        v316["innerHTML"] = this["_buildVideoModelMenuHtml"](v315)["trim"]();
        const v317 = v316["content"]["firstElementChild"];
        return (
          (v272["innerHTML"] = v317?.["innerHTML"] || ""),
          (v272["dataset"]["lazyMounted"] = "1"),
          (v272["dataset"]["nodeMenuKind"] =
            v317?.["dataset"]?.["nodeMenuKind"] || "video"),
          v312?.(),
          (v312 = bindNodeSubmenus(v272)),
          v272
        );
      };
      v271 &&
        v272 &&
        v271["addEventListener"]("click", (v318) => {
          v318["stopPropagation"]();
          const v319 = v313();
          if (!v319) return;
          const v320 = !v319["classList"]["contains"]("show");
          (closeNodeFooterMenus(v270, v272),
            v274?.["classList"]["remove"]("show"),
            v319["classList"]["toggle"]("show", v320));
          if (v320) v181(v319);
        });
      v275 &&
        v276 &&
        (v275["onclick"] = (v321) => {
          v321["stopPropagation"]();
          if (v275["disabled"] || !String(v276["innerHTML"] || "")["trim"]())
            return;
          ((v276["style"]["display"] = ""),
            v276["classList"]["toggle"]("show"),
            v272["classList"]["remove"]("show"),
            v274?.["classList"]["remove"]("show"));
          if (v280) v280["classList"]["remove"]("show");
          (v289(), v287?.["classList"]["remove"]("show"));
        });
      v273 &&
        v274 &&
        (v273["onclick"] = (v322) => {
          v322["stopPropagation"]();
          if (v273["disabled"]) return;
          (v274["classList"]["toggle"]("show"),
            v272["classList"]["remove"]("show"),
            v288());
          if (v280) v280["classList"]["remove"]("show");
          (v289(),
            v287?.["classList"]["remove"]("show"),
            v274["classList"]["contains"]("show") && v181(v274));
        });
      v279 &&
        v280 &&
        (v279["onclick"] = (v323) => {
          (v323["stopPropagation"](),
            v280["classList"]["toggle"]("show"),
            v272["classList"]["remove"]("show"),
            v274?.["classList"]["remove"]("show"),
            v288(),
            v289(),
            v287?.["classList"]["remove"]("show"),
            v280["classList"]["contains"]("show") && v181(v280));
        });
      v282 &&
        v283 &&
        (v282["onclick"] = (v324) => {
          (v324["stopPropagation"](),
            (v283["style"]["display"] = ""),
            v283["classList"]["toggle"]("show"),
            v272["classList"]["remove"]("show"),
            v274?.["classList"]["remove"]("show"),
            v288());
          if (v280) v280["classList"]["remove"]("show");
          v287?.["classList"]["remove"]("show");
        });
      const v325 = () => {
        (v272?.["classList"]["remove"]("show"),
          v272?.["querySelectorAll"](
            ".node-model-submenu,\x20.node-menu-submenu",
          )["forEach"]((v326) => {
            v326["style"]["display"] = "none";
          }));
      };
      (v272?.["addEventListener"]("click", (v327) => {
        v327["stopPropagation"]();
        const v328 = v327["target"]?.["closest"]?.(".floating-menu-item");
        if (!v328 || !v272["contains"](v328)) return;
        if (v328["hasAttribute"]("data-node-menu-submenu")) return;
        if (v328["closest"](".apimart-video-submenu")) {
          const v329 =
            v328["dataset"]["value"] || APIMART_DREAMINA_VIDEO_DEFAULT_MODEL;
          if (isApimartDreaminaVideoModel(v329, "apimart")) {
            v296({
              model: v329,
              provider: "apimart",
              useRememberedRouteModel: true,
            });
            return;
          }
        }
        if (v328["closest"](".runninghub-submenu")) {
          if (v328["dataset"]["disabled"] === "true") {
            (window["showToast"]?.("视频生成功能目前不可用", "warn"), v325());
            return;
          }
          const v330 = v328["dataset"]["value"];
          if (!v330) return;
          const v331 = this["_runVipRetryOnce"](() => v328["click"]());
          if (!this["_guardVipSelection"](v330, v331)) {
            v325();
            return;
          }
          const v332 = v328["dataset"]["provider"] || null,
            v333 = v175["getState"]()["nodes"]?.[this["nodeId"]] || {},
            v334 = { model: v330, provider: v332 };
          if (this["_isRunninghubWorkflowModel"](v330, v332))
            Object["assign"](
              v334,
              buildVideoWorkflowModelSelectionPatch(v333, v330, {
                preserveMaskTouchedState: true,
                v54FpsOptions: getRhV54FpsOptions(),
              }),
            );
          else {
            const v335 = resolveModelExecution(v330, { providerHint: v332 });
            v335?.["modelManifest"]?.["kind"] === "video" &&
              v335?.["modelManifest"]?.["adapterType"] === "modelApi" &&
              Object["assign"](
                v334,
                buildVideoModelApiModelSelectionPatch(
                  v333,
                  v335["canonicalModelId"] || v330,
                  v332 || v335?.["modelManifest"]?.["provider"] || null,
                  v334,
                ),
              );
          }
          v292(v334);
          return;
        }
        if (v328["dataset"]["disabled"] === "true") {
          (window["showToast"]?.("视频生成功能目前不可用", "warn"), v325());
          return;
        }
        const v336 = v328["dataset"]["value"];
        if (!v336) return;
        const v337 = v328["dataset"]["provider"] || "dreamina";
        if (isDreaminaStyleVideoModel(v336, v337)) {
          const v338 = resolveDreaminaStyleVideoProvider(v336, v337),
            v339 = this["_runVipRetryOnce"](() => v328["click"]());
          if (!this["_guardVipSelection"](v336, v338, v339)) {
            v325();
            return;
          }
          v296({ model: v336, provider: v338, useRememberedRouteModel: true });
          return;
        }
        const v340 = this["_runVipRetryOnce"](() => v328["click"]());
        if (!this["_guardVipSelection"](v336, v340)) {
          v325();
          return;
        }
        const v341 = { model: v336 };
        v341["provider"] = v328["dataset"]["provider"] || null;
        const v342 = v175["getState"]()["nodes"]?.[this["nodeId"]] || {};
        if (this["_isRunninghubWorkflowModel"](v336, v341["provider"]))
          Object["assign"](
            v341,
            buildVideoWorkflowModelSelectionPatch(v342, v336, {
              v54FpsOptions: getRhV54FpsOptions(),
            }),
          );
        else {
          const v343 = resolveModelExecution(v336, {
            providerHint: v341["provider"],
          });
          v343?.["modelManifest"]?.["kind"] === "video" &&
            v343?.["modelManifest"]?.["adapterType"] === "modelApi" &&
            Object["assign"](
              v341,
              buildVideoModelApiModelSelectionPatch(
                v342,
                v343["canonicalModelId"] || v336,
                v341["provider"] ||
                  v343?.["modelManifest"]?.["provider"] ||
                  null,
                v341,
              ),
            );
        }
        (v336["includes"]("seedance") &&
          (!this["_data"]["resolution"] ||
            this["_data"]["resolution"] !== "720p") &&
          (v341["resolution"] = "720p"),
          v292(v341));
      }),
        v274?.["querySelectorAll"](".floating-menu-item")["forEach"](
          (v344) =>
            (v344["onclick"] = () => {
              if (v344["dataset"]["disabled"] === "true") {
                (window["showToast"]?.("智能多帧暂未开放", "warn"),
                  v274["classList"]["remove"]("show"));
                return;
              }
              const v345 = String(v344["dataset"]["value"] || "")["trim"]();
              if (!v345) return;
              const v346 = resolveDreaminaStyleVideoProvider(
                  v345,
                  v344["dataset"]["provider"] ||
                    this["_data"]?.["provider"] ||
                    "dreamina",
                ),
                v347 = this["_runVipRetryOnce"](() => v344["click"]());
              if (!this["_guardVipSelection"](v345, v346, v347)) {
                v274["classList"]["remove"]("show");
                return;
              }
              v296({
                model: v345,
                provider: v346,
                useRememberedRouteModel: false,
              });
            }),
        ));
      v286 &&
        v287 &&
        ((v286["onclick"] = (v348) => {
          v348["stopPropagation"]();
          const v349 = !v287["classList"]["contains"]("show");
          ((v287["style"]["display"] = ""),
            v287["classList"]["toggle"]("show", v349),
            v272["classList"]["remove"]("show"),
            v288());
          if (v280) v280["classList"]["remove"]("show");
          v289();
        }),
        (v287["onclick"] = (v350) => v350["stopPropagation"]()));
      v280 &&
        v281 &&
        v280["querySelectorAll"](".floating-menu-item")["forEach"](
          (v351) =>
            (v351["onclick"] = () => {
              if (v290) {
                const v352 = normalizeDreaminaVideoRouteMode(
                  v351["dataset"]["routeMode"] || v351["dataset"]["value"],
                );
                if (!v352) return;
                (this["_commitDreaminaRouteMode"](v352, this["_data"]),
                  v280["classList"]["remove"]("show"));
                return;
              }
              const v353 = v351["dataset"]["value"];
              (v175["updateNodeData"](this["nodeId"], { mode: v353 }),
                (v281["textContent"] = v353),
                v280["classList"]["remove"]("show"),
                v280["querySelectorAll"](".floating-menu-item")["forEach"](
                  (v354) =>
                    v354["classList"]["toggle"]("active", v354 === v351),
                ));
            }),
        );
      if (v290 && v280) {
        const v355 = () => {
          const v356 = [];
          v280["querySelectorAll"](".dreamina-transition-prompt")["forEach"](
            (v357) => {
              const v358 = Number(v357["dataset"]["index"]);
              Number["isFinite"](v358) && (v356[v358] = v357["value"]);
            },
          );
          const v359 = [];
          (v280["querySelectorAll"](".dreamina-transition-duration")["forEach"](
            (v360) => {
              const v361 = Number(v360["dataset"]["index"]);
              Number["isFinite"](v361) && (v359[v361] = v360["value"]);
            },
          ),
            v175["updateNodeData"](this["nodeId"], {
              dreaminaTransitionPrompts: v356,
              dreaminaTransitionDurations: v359,
            }));
        };
        (v280["querySelectorAll"](".dreamina-transition-prompt")["forEach"](
          (v362) => {
            (v362["addEventListener"]("input", v355),
              v362["addEventListener"]("click", (v363) =>
                v363["stopPropagation"](),
              ));
          },
        ),
          v280["querySelectorAll"](".dreamina-transition-duration")["forEach"](
            (v364) => {
              (v364["addEventListener"]("input", v355),
                v364["addEventListener"]("change", v355),
                v364["addEventListener"]("click", (v365) =>
                  v365["stopPropagation"](),
                ));
            },
          ));
      }
      v284 &&
        v285 &&
        (v284["oninput"] = () => {
          if (v290) {
            const v366 = this["_syncDreaminaTaskState"](this["_data"], {
                syncStore: false,
              }),
              v367 =
                v366?.["resolvedTaskType"] ||
                this["_getResolvedDreaminaTaskType"](),
              v368 = resolveDreaminaStyleVideoProvider(
                this["_data"]?.["model"],
                this["_data"]?.["provider"],
              ),
              v369 = ensureDreaminaStyleVideoModelForTask(
                v367,
                this["_data"]?.["model"],
                v368,
              ),
              v370 = normalizeDreaminaStyleVideoDuration(
                v367,
                v369,
                v284["value"],
                v368,
              );
            ((v285["textContent"] = v370 + "S"),
              this["_commitDreaminaParamValues"](
                { duration: v370 },
                this["_data"],
              ));
            return;
          }
          const v371 = v284["value"];
          ((v285["textContent"] = v371 + "S"),
            v175["updateNodeData"](this["nodeId"], {
              duration: parseInt(v371, 10),
            }));
        });
      v277 &&
        v276?.["querySelectorAll"](".img-rp-quality-item")["forEach"](
          (v372) =>
            (v372["onclick"] = () => {
              if (v372["hasAttribute"]("disabled")) return;
              if (v372["closest"]("[data-ui-schema-field]")) return;
              if (v290 && v372["dataset"]["dreaminaKind"] === "resolution") {
                const v373 = String(v372["dataset"]["value"] || "")["trim"]();
                if (!v373) return;
                this["_commitDreaminaParamValues"](
                  { resolution: v373 },
                  this["_data"],
                );
                const v374 = {
                    ...this["_getDreaminaEffectiveNodeData"](
                      v175["getState"]()["nodes"]?.[this["nodeId"]] ||
                        this["_data"] ||
                        {},
                    ),
                  },
                  v375 = this["_getDreaminaRatioDisplayState"](v374);
                v277["textContent"] =
                  v375?.["ratioLabelText"] ||
                  (v374["aspectRatio"] || "1:1") + "\x20·\x20" + v373;
                v278 &&
                  (v278["innerHTML"] = this["_getRatioIconHTML"](
                    v375?.["ratioIconLabel"] || v374["aspectRatio"] || "1:1",
                  ));
                const v376 = v372["parentElement"];
                (v376?.["querySelectorAll"](".img-rp-quality-item")["forEach"](
                  (v377) => v377["classList"]["remove"]("active"),
                ),
                  v372["classList"]["add"]("active"));
                return;
              }
              (v175["updateNodeData"](this["nodeId"], {
                resolution: v372["dataset"]["value"],
              }),
                (v277["textContent"] =
                  (this["_data"]["aspectRatio"] || "自适应") +
                  " · " +
                  v372["dataset"]["value"]));
              const v378 = v372["parentElement"];
              (v378?.["querySelectorAll"](".img-rp-quality-item")["forEach"](
                (v379) => v379["classList"]["remove"]("active"),
              ),
                v372["classList"]["add"]("active"));
            }),
        );
      const v380 = 280,
        v381 = (v382) => {
          const v383 = String(v382 || "")["trim"]();
          if (!v383 || v383 === "自适应")
            return { w: 1, h: 1, label: "自适应" };
          const v384 = v383["match"](/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
          if (!v384) return null;
          return {
            w: parseFloat(v384[1]),
            h: parseFloat(v384[2]),
            label: v384[1] + ":" + v384[2],
          };
        },
        v385 = (v386 = "", v387 = false) => {
          const v388 = String(v386 || "")["trim"](),
            v389 = !!v387 || v388 === "自适应";
          v270["querySelectorAll"](".img-rp-ratio-item,.img-rp-large-adaptive")[
            "forEach"
          ]((v390) => v390["classList"]["remove"]("active"));
          if (v389) {
            v270["querySelector"](".img-rp-large-adaptive")?.["classList"][
              "add"
            ]("active");
            return;
          }
          v270["querySelectorAll"](".img-rp-ratio-item")["forEach"]((v391) =>
            v391["classList"]["toggle"](
              "active",
              String(v391["dataset"]["label"] || "")["trim"]() === v388,
            ),
          );
        },
        v392 = (v393, v394, v395, v396 = {}) => {
          const v397 = v396?.["persistAspectRatio"] !== false,
            v398 = (v399) => {
              const v400 = document["getElementById"](this["nodeId"]);
              if (!v400) return;
              v400["classList"]["add"]("is-ratio-animating");
              if (this["_ratioAnimTimer"])
                clearTimeout(this["_ratioAnimTimer"]);
              this["_ratioAnimTimer"] = setTimeout(() => {
                const v401 = document["getElementById"](this["nodeId"]);
                if (v401) v401["classList"]["remove"]("is-ratio-animating");
                this["_ratioAnimTimer"] = null;
              }, v399 + 80);
            },
            v402 = this["_data"]["width"] || 300,
            v403 = this["_data"]["height"] || 300,
            v404 = v179(v393, v394),
            v405 = v404["width"],
            v406 = v404["height"],
            v407 = v405 - v402,
            v408 = v406 - v403;
          if (v407 !== 0 || v408 !== 0) v398(v380);
          const v409 = {
            width: v405,
            height: v406,
            x: Math["round"](this["_data"]["x"] - v407 / 2),
            y: Math["round"](this["_data"]["y"] - v408),
          };
          v397 &&
            (this["_isDreaminaVideoNode"](this["_data"])
              ? Object["assign"](
                  v409,
                  this["_buildDreaminaParamPatch"](this["_data"], {
                    aspectRatio: v395,
                  }),
                )
              : (v409["aspectRatio"] = v395));
          v175["updateNodeData"](this["nodeId"], v409);
          const v410 =
              v175["getState"]()["nodes"]?.[this["nodeId"]] ||
              this["_data"] ||
              {},
            v411 = this["_getDreaminaRatioDisplayState"](v410);
          v277 &&
            (v277["textContent"] =
              v411?.["ratioLabelText"] ||
              v395 + " · " + (v410["resolution"] || "1080p"));
          v278 &&
            (v278["innerHTML"] = this["_getRatioIconHTML"](
              v411?.["ratioIconLabel"] || v395,
            ));
          ((this["previewEl"]["style"]["transition"] = "none"),
            (this["previewEl"]["style"]["transformOrigin"] = "bottom center"),
            (this["previewEl"]["style"]["transform"] =
              "scaleX(" + v402 / v405 + ") scaleY(" + v403 / v406 + ")"),
            void this["previewEl"]["offsetWidth"]);
          if (this["_ratioFlipAnim"]) this["_ratioFlipAnim"]["cancel"]();
          const v412 =
            "scaleX(" + v402 / v405 + ") scaleY(" + v403 / v406 + ")";
          this["_ratioFlipAnim"] = this["previewEl"]["animate"](
            [{ transform: v412 }, { transform: "none" }],
            {
              duration: v380,
              easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              fill: "forwards",
            },
          );
          const v413 = () => {
            ((this["_ratioFlipAnim"] = null),
              (this["previewEl"]["style"]["transformOrigin"] = ""),
              (this["previewEl"]["style"]["transform"] = ""));
          };
          ((this["_ratioFlipAnim"]["onfinish"] = v413),
            (this["_ratioFlipAnim"]["oncancel"] = v413));
        },
        v414 = (v415, v416 = {}) => {
          const v417 = v381(v415);
          if (!v417) return;
          (v392(v417["w"], v417["h"], v417["label"], v416),
            v385(v417["label"], false));
        };
      !v290 &&
        v270["querySelectorAll"](".img-rp-ratio-item")["forEach"](
          (v418) =>
            (v418["onclick"] = () => {
              if (
                v418["hasAttribute"]("disabled") ||
                v418["classList"]["contains"]("disabled") ||
                v418["getAttribute"]("aria-disabled") === "true"
              )
                return;
              v414(v418["dataset"]["label"]);
            }),
        );
      const v419 = () => {
        const v420 = v175["getState"](),
          v421 = v420["nodes"]?.[this["nodeId"]],
          v422 = String(v421?.["model"] || ""),
          v423 =
            getRunningHubVideoParameterPanelPolicy(v422)["adaptiveRatio"] || {},
          v424 =
            v423["preferSlot"] &&
            v423["preferVideoKind"] === true &&
            v423["fallbackSquareWhenNoVideo"] !== true,
          v425 = v423["preferSlot"] && v423["preferVideoKind"] !== true,
          v426 =
            v423["preferSlot"] &&
            v423["preferVideoKind"] === true &&
            v423["fallbackSquareWhenNoVideo"] === true;
        let v427 = v175["getIncomingEdges"](this["nodeId"]);
        v423["scopeTargetEdges"] === true &&
          (v427 = v427["filter"](
            (v428) => v428?.["targetId"] === this["nodeId"],
          ));
        const v429 = (v430, v431) => {
          const v432 = Number(v430),
            v433 = Number(v431);
          if (!(Number["isFinite"](v432) && v432 > 0)) return false;
          if (!(Number["isFinite"](v433) && v433 > 0)) return false;
          return (v392(v432, v433, "自适应"), true);
        };
        if (v427["length"] > 0) {
          let v434 = v427[0];
          if (v424) {
            const v435 = v427["find"](
              (v436) => String(v436?.["refSlot"] || "") === "sourceVideo",
            );
            if (v435) v434 = v435;
            else {
              const v437 = v427["find"]((v438) => {
                const v439 = v420["nodes"]?.[v438?.["sourceId"]],
                  v440 = String(v439?.["type"] || "");
                return (
                  v440 === "source-video" ||
                  v440 === "video" ||
                  v440 === "ai-video"
                );
              });
              if (v437) v434 = v437;
            }
          } else {
            if (v425 || v426) {
              const v441 = v427["find"](
                (v442) => String(v442?.["refSlot"] || "") === "sourceVideo",
              );
              if (v441) v434 = v441;
              else {
                if (v426) {
                  const v443 = v427["find"]((v444) => {
                    const v445 = v420["nodes"]?.[v444?.["sourceId"]],
                      v446 = String(v445?.["type"] || "");
                    return (
                      v446 === "source-video" ||
                      v446 === "video" ||
                      v446 === "ai-video"
                    );
                  });
                  if (v443) v434 = v443;
                  else {
                    v392(1, 1, "自适应");
                    return;
                  }
                }
              }
            }
          }
          const v447 = v434["sourceId"],
            v448 = v420["nodes"][v447],
            v449 = String(v448?.["type"] || ""),
            v450 =
              v449 === "ai-video" ||
              v449 === "source-video" ||
              v449 === "video";
          if (v450) {
            const v451 = v180(v447, "video"),
              v452 = Number(v451?.["w"] || 0),
              v453 = Number(v451?.["h"] || 0);
            if (v429(v452, v453)) return;
            const v454 = Number(v434?.["sourceMediaW"] || 0),
              v455 = Number(v434?.["sourceMediaH"] || 0);
            if (v429(v454, v455)) return;
            const v456 = Number(v448?.["mainVideoIndex"]),
              v457 = Number["isFinite"](v456)
                ? Math["max"](0, Math["trunc"](v456))
                : 0,
              v458 = Array["isArray"](v448?.["videos"]) ? v448["videos"] : [];
            let v459 = v457;
            const v460 = String(v434?.["sourceMediaKey"] || "")["trim"]();
            if (v460 && v458["length"]) {
              const v461 = v458["findIndex"]((v462) => {
                const v463 =
                  String(v462?.["localPath"] || "")["trim"]() ||
                  String(v462?.["videoUrl"] || "")["trim"]();
                return v463 === v460;
              });
              if (v461 >= 0) v459 = v461;
            }
            const v464 = v458[v459],
              v465 = Number(v464?.["videoWidth"] || 0),
              v466 = Number(v464?.["videoHeight"] || 0);
            if (v429(v465, v466)) return;
            const v467 = Number(v448?.["selectedVideoWidth"] || 0),
              v468 = Number(v448?.["selectedVideoHeight"] || 0);
            if (v429(v467, v468)) return;
            const v469 = ++this["_adaptiveSrcRetryToken"];
            (setTimeout(() => {
              if (v469 !== this["_adaptiveSrcRetryToken"]) return;
              const v470 = v175["getState"]()["nodes"]?.[this["nodeId"]];
              if (!v470) return;
              const v471 = this["_getDreaminaEffectiveNodeData"](v470);
              if (String(v471["aspectRatio"] || "自适应") !== "自适应") return;
              const v472 = v175["getState"]()["nodes"]?.[v447];
              if (v472) {
                const v473 = Number(v434?.["sourceMediaW"] || 0),
                  v474 = Number(v434?.["sourceMediaH"] || 0);
                if (v429(v473, v474)) return;
                const v475 = Number(v472["mainVideoIndex"]),
                  v476 = Number["isFinite"](v475)
                    ? Math["max"](0, Math["trunc"](v475))
                    : 0,
                  v477 = Array["isArray"](v472["videos"]) ? v472["videos"] : [];
                let v478 = v476;
                const v479 = String(v434?.["sourceMediaKey"] || "")["trim"]();
                if (v479 && v477["length"]) {
                  const v480 = v477["findIndex"]((v481) => {
                    const v482 =
                      String(v481?.["localPath"] || "")["trim"]() ||
                      String(v481?.["videoUrl"] || "")["trim"]();
                    return v482 === v479;
                  });
                  if (v480 >= 0) v478 = v480;
                }
                const v483 = v477[v478],
                  v484 = Number(v483?.["videoWidth"] || 0),
                  v485 = Number(v483?.["videoHeight"] || 0);
                if (v429(v484, v485)) return;
                const v486 = Number(v472["selectedVideoWidth"] || 0),
                  v487 = Number(v472["selectedVideoHeight"] || 0);
                if (v429(v486, v487)) return;
              }
              const v488 = v180(v447, "video"),
                v489 = Number(v488?.["w"] || 0),
                v490 = Number(v488?.["h"] || 0);
              if (v489 > 0 && v490 > 0) v392(v489, v490, "自适应");
            }, 160),
              v392(1, 1, "自适应"));
            return;
          }
          const v491 = v180(v447, "image"),
            v492 = Number(v491?.["w"] || 0),
            v493 = Number(v491?.["h"] || 0);
          if (v429(v492, v493)) return;
          if (v448) {
            const v494 = Number(v448["width"] || 0),
              v495 = Number(v448["height"] || 0);
            if (v429(v494, v495)) return;
          }
          v392(1, 1, "自适应");
          return;
        }
        const v496 = Boolean(
          (v421?.["videos"] && v421["videos"]["length"]) ||
          v421?.["localPath"] ||
          v421?.["thumbUrl"] ||
          v421?.["videoUrl"] ||
          v421?.["src"],
        );
        if (v496) {
          const v497 = this["videoEl"]?.["videoWidth"] || 0,
            v498 = this["videoEl"]?.["videoHeight"] || 0;
          if (v429(v497, v498)) return;
          return;
        }
        v392(1, 1, "自适应");
      };
      ((this["_runAdaptiveRatio"] = () => {
        const v499 =
          v175["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {};
        if (
          this["_isRunninghubWorkflowModel"](
            v499?.["model"],
            v499?.["provider"],
          )
        )
          return;
        const v500 = v270["querySelector"](".img-rp-large-adaptive");
        if (this["_isDreaminaVideoNode"](v499)) {
          (this["_commitDreaminaSchemaAspectRatio"]("自适应", v499),
            v385("自适应", true),
            v500?.["classList"]["add"]("active"));
          return;
        }
        (v419(), v385("自适应", true), v500?.["classList"]["add"]("active"));
      }),
        (this["_applyStoredAspectRatio"] = () => {
          const v501 =
              v175["getState"]()["nodes"]?.[this["nodeId"]] ||
              this["_data"] ||
              {},
            v502 = this["_getDreaminaRatioDisplayState"](v501),
            v503 = String(v502?.["currentRatio"] || "")["trim"]() || "自适应";
          if (v503 === "自适应") {
            this["_runAdaptiveRatio"]?.();
            return;
          }
          v414(v503, { persistAspectRatio: true });
        }),
        (this["_applyDreaminaSchemaAspectRatio"] = (v504) => {
          const v505 =
            v175["getState"]()["nodes"]?.[this["nodeId"]] ||
            this["_data"] ||
            {};
          this["_commitDreaminaSchemaAspectRatio"](v504, v505);
        }));
      const v506 = v270["querySelector"](".img-rp-large-adaptive");
      v506 && !v290 && (v506["onclick"] = () => this["_runAdaptiveRatio"]());
      this["btnEl"]["onclick"] = () => {
        (flushPromptHtmlCommit(this), this["_handleGenerateOrCancel"]());
      };
      const v507 = v270["querySelector"](".debug-wrench-btn");
      v507?.["addEventListener"]("click", async (v508) => {
        (v508["stopPropagation"](), flushPromptHtmlCommit(this));
        const v509 = await this["_buildPayload"]();
        if (!v509) {
          window["showToast"]?.("缺少提示词或引用媒体，无法生成", "warn");
          return;
        }
        try {
          const v510 = await v176["buildGenerateVideoRequest"](v509),
            v511 = formatFinalApiDebugRequest(v510),
            v512 = v175["getState"](),
            v513 = this["_data"]["x"] + (this["_data"]["width"] || 380) + 50,
            v514 = this["_data"]["y"];
          let v515 = Object["values"](v512["nodes"])["find"](
            (v516) => v516["type"] === "debug",
          );
          (!v515
            ? v175["addNode"]({
                id: "debug-" + Date["now"](),
                type: "debug",
                x: v513,
                y: v514,
                width: 380,
                height: 300,
                name: "调试节点",
                outputText: v511,
              })
            : v175["updateNodeData"](v515["id"], {
                outputText: v511,
                x: v513,
                y: v514,
              }),
            window["showToast"]?.("🔧 已展示最终 API 参数", "warn"));
        } catch (v517) {
          window["showToast"]?.("构造请求失败: " + v517["message"], "error");
        }
      });
      !this["_docClickBound"] &&
        (document["addEventListener"]("click", () => {
          if (this["_suppressDocClickOnce"]) {
            this["_suppressDocClickOnce"] = false;
            return;
          }
          const v518 = this["footerEl"];
          if (!v518) return;
          (v518["querySelector"](".img-model-menu")?.["classList"]["remove"](
            "show",
          ),
            v518["querySelector"](".dreamina-task-model-menu")?.["classList"][
              "remove"
            ]("show"));
          const v519 = v518["querySelector"](".img-ratio-popup");
          v519?.["classList"]["remove"]("show");
          if (v519) v519["style"]["display"] = "";
          v518["querySelector"](".vid-mode-menu")?.["classList"]["remove"](
            "show",
          );
          const v520 = v518["querySelector"](".vid-duration-pop");
          v520?.["classList"]["remove"]("show");
          if (v520) v520["style"]["display"] = "";
          v518["querySelector"](".rh-vram-adv-panel")?.["classList"]["remove"](
            "show",
          );
        }),
        (this["_docClickBound"] = true));
      if (v276) v276["onclick"] = (v521) => v521["stopPropagation"]();
      if (v283) v283["onclick"] = (v522) => v522["stopPropagation"]();
      if (v280) v280["onclick"] = (v523) => v523["stopPropagation"]();
      if (v274) v274["onclick"] = (v524) => v524["stopPropagation"]();
    }
    ["_isDreaminaVideoNode"](v525 = this["_data"]) {
      return isDreaminaStyleVideoModel(v525?.["model"], v525?.["provider"]);
    }
    ["_getDreaminaEffectiveNodeData"](v526 = this["_data"]) {
      return getDreaminaEffectiveNodeData(v526);
    }
    ["_buildDreaminaParamPatch"](v527 = this["_data"], v528 = {}) {
      return buildDreaminaParamPatch(v527, v528);
    }
    ["_buildDreaminaModelSelectionParamPatch"](
      v529 = this["_data"],
      v530 = {},
    ) {
      return buildDreaminaModelSelectionParamPatch(v529, v530);
    }
    ["_commitDreaminaParamValues"](v531 = {}, v532 = this["_data"], v533 = {}) {
      const v534 =
          this["_getDreaminaEffectiveNodeData"](v532) ||
          this["_getDreaminaEffectiveNodeData"](
            v175["getState"]()["nodes"]?.[this["nodeId"]] ||
              this["_data"] ||
              {},
          ),
        v535 = { ...v534, ...v533 },
        v536 = this["_buildDreaminaParamPatch"](v535, v531),
        v537 = { ...(v533 && typeof v533 === "object" ? v533 : {}), ...v536 };
      return (
        v175["updateNodeData"](this["nodeId"], v537),
        (this["_data"] = this["_getDreaminaEffectiveNodeData"]({
          ...v534,
          ...v537,
        })),
        this["_data"]
      );
    }
    ["_commitDreaminaRouteMode"](v538, v539 = this["_data"]) {
      const v540 = v175["getState"](),
        v541 = buildDreaminaRouteModeUpdate({
          nextRouteMode: v538,
          baseNodeData: v539,
          incoming: v175["getIncomingEdges"](this["nodeId"]) || [],
          nodes: v540["nodes"] || {},
        });
      if (v541["disabled"])
        return (
          window["showToast"]?.("智能多帧暂未开放", "warn"),
          (this["_data"] = v541["nodeData"]),
          this["_data"]
        );
      const v542 = Array["isArray"](v541["edgeIdsToRemove"])
          ? v541["edgeIdsToRemove"]
          : [],
        v543 = v541["patch"] || {};
      return (
        (v542["length"] > 0 || Object["keys"](v543)["length"] > 0) &&
          v175["batch"](() => {
            (v542["forEach"]((v544) => v175["removeEdge"](v544)),
              Object["keys"](v543)["length"] > 0 &&
                v175["updateNodeData"](this["nodeId"], v543));
          }),
        (this["_data"] =
          v541["nodeData"] ||
          this["_getDreaminaEffectiveNodeData"]({ ...v539, ...v543 })),
        this["_data"]
      );
    }
    ["_commitDreaminaSchemaField"](v545, v546, v547 = this["_data"]) {
      const v548 = String(v545 || "")["trim"](),
        v549 = this["_getDreaminaEffectiveNodeData"](v547);
      if (v548 === "dreaminaRouteMode")
        return this["_commitDreaminaRouteMode"](v546, v549);
      const v550 = this["_getResolvedDreaminaTaskType"](v549),
        v551 = resolveDreaminaStyleVideoProvider(
          v549?.["model"],
          v549?.["provider"],
        ),
        v552 = ensureDreaminaStyleVideoModelForTask(
          v550,
          v549?.["model"],
          v551,
        );
      if (v548 === "resolution") {
        const v553 = normalizeDreaminaStyleVideoResolution(
          v550,
          v552,
          v546,
          v551,
        );
        return this["_commitDreaminaParamValues"]({ resolution: v553 }, v549);
      }
      if (v548 === "duration") {
        const v554 = normalizeDreaminaStyleVideoDuration(
          v550,
          v552,
          v546,
          v551,
        );
        return this["_commitDreaminaParamValues"]({ duration: v554 }, v549);
      }
      if (v548 === "aspectRatio")
        return this["_commitDreaminaSchemaAspectRatio"](v546, v549);
      return v549;
    }
    ["_normalizeDreaminaNodeData"](v555, v556 = {}) {
      const v557 = v556?.["syncStore"] !== false,
        v558 = this["_getDreaminaEffectiveNodeData"](v555),
        v559 = buildDreaminaStyleVideoNodeNormalizationPatch(v558);
      if (!v559) return v558;
      const v560 = buildDreaminaStorePatchFromNormalization(v558, v559),
        v561 = this["_getDreaminaEffectiveNodeData"]({ ...v558, ...v560 }),
        v562 = v175["getState"]()["nodes"]?.[this["nodeId"]];
      return (
        v557 &&
          v562 &&
          Object["keys"](v560)["length"] > 0 &&
          v175["updateNodeData"](this["nodeId"], v560),
        v561
      );
    }
    ["_getDreaminaReferenceSummary"](v563 = this["_data"]) {
      const v564 = v175["getIncomingEdges"](this["nodeId"]) || [],
        v565 = v175["getState"]()["nodes"] || {},
        v566 = [];
      for (const v567 of v564) {
        const v568 = v565?.[v567["sourceId"]];
        if (!v568) continue;
        const v569 = String(v568["type"] || "");
        let v570 = "";
        if (v569["includes"]("video")) v570 = "video";
        else {
          if (v569["includes"]("audio")) v570 = "audio";
          else {
            if (v569["includes"]("image")) v570 = "image";
            else {
              if (v569["includes"]("text")) v570 = "text";
            }
          }
        }
        if (!v570) continue;
        if (v570 === "image") {
          const v571 =
            !!v568["thumbId"] ||
            !!v568["thumbUrl"] ||
            !!v568["imageUrl"] ||
            !!v568["src"] ||
            !!v568["localPath"];
          if (!v571) continue;
        } else {
          if (v570 === "video") {
            const v572 =
              (Array["isArray"](v568["videos"]) &&
                v568["videos"]["length"] > 0) ||
              !!v568["thumbId"] ||
              !!v568["thumbUrl"] ||
              !!v568["videoUrl"] ||
              !!v568["src"] ||
              !!v568["localPath"];
            if (!v572) continue;
          } else {
            if (v570 === "audio") {
              const v573 =
                !!v568["audioUrl"] || !!v568["src"] || !!v568["localPath"];
              if (!v573) continue;
            } else {
              if (v570 === "text") {
                const v574 = !!String(
                  v568["outputText"] || v568["text"] || v568["content"] || "",
                )["trim"]();
                if (!v574) continue;
              }
            }
          }
        }
        v566["push"]({
          edgeId: String(v567["id"] || ""),
          sourceId: String(v567["sourceId"] || ""),
          kind: v570,
          refSlot: String(v567["refSlot"] || ""),
        });
      }
      const v575 = v566["filter"]((v576) => v576["kind"] === "image"),
        v577 = v566["filter"]((v578) => v578["kind"] === "video"),
        v579 = v566["filter"]((v580) => v580["kind"] === "audio"),
        v581 = v566["filter"]((v582) => v582["kind"] === "text");
      return {
        items: v566,
        images: v575,
        videos: v577,
        audios: v579,
        texts: v581,
        imageCount: v575["length"],
        videoCount: v577["length"],
        audioCount: v579["length"],
        textCount: v581["length"],
        signature: v566["map"](
          (v583, v584) =>
            v584 +
            ":" +
            v583["edgeId"] +
            ":" +
            v583["sourceId"] +
            ":" +
            v583["kind"] +
            ":" +
            v583["refSlot"],
        )["join"]("|"),
      };
    }
    ["_getResolvedDreaminaTaskType"](v585 = this["_data"], v586 = null) {
      if (!this["_isDreaminaVideoNode"](v585)) return "";
      const v587 = this["_getDreaminaEffectiveNodeData"](v585),
        v588 = v586 || this["_getDreaminaReferenceSummary"](v587);
      return resolveDreaminaVideoTaskType({
        routeMode: normalizeDreaminaVideoRouteMode(
          v587?.["dreaminaRouteMode"],
          v587?.["mode"],
        ),
        imageCount: v588["imageCount"],
        videoCount: v588["videoCount"],
        audioCount: v588["audioCount"],
      });
    }
    ["_commitDreaminaSchemaAspectRatio"](v589, v590 = this["_data"]) {
      const v591 = this["_getDreaminaEffectiveNodeData"](v590),
        v592 = normalizeDreaminaVideoAspectRatio(v589, {
          preserveAdaptive: true,
        }),
        v593 = buildImageSchemaAspectRatioDisplayPatch({
          store: v175,
          nodeId: this["nodeId"],
          nodeData: v591,
          fallbackNodeData: this["_data"],
          ratioValue: v592,
          minSide: v179()["width"],
          inputKinds: ["image", "video"],
          resultMediaElement: this["videoEl"],
          resultFields: ["videos", "localPath", "thumbUrl", "videoUrl", "src"],
        }),
        v594 = this["_buildDreaminaParamPatch"](v591, { aspectRatio: v592 }),
        v595 = { ...v593, ...v594 };
      return (
        applyImageSchemaRatioResizeAnimation(this, {
          nodeId: this["nodeId"],
          previewEl: this["previewEl"],
          nodeData: v591,
          patch: v593,
        }),
        v175["updateNodeData"](this["nodeId"], v595),
        (this["_data"] = this["_getDreaminaEffectiveNodeData"]({
          ...v591,
          ...v595,
        })),
        this["_data"]
      );
    }
    ["_buildModelApiAspectRatioDisplayPatch"](v596, v597, v598, v599 = {}) {
      const v600 = String(v597 || "")["trim"]();
      if (!v600) return {};
      const v601 = this["_resolveModelExecution"](
        v596?.["model"],
        v596?.["provider"],
      );
      if (
        v601?.["modelManifest"]?.["kind"] !== "video" ||
        v601?.["modelManifest"]?.["adapterType"] !== "modelApi" ||
        v601?.["executionManifest"]?.["adapterType"] !== "modelApi"
      )
        return {};
      const v602 = Array["isArray"](
          v601?.["modelManifest"]?.["uiSchema"]?.["fields"],
        )
          ? v601["modelManifest"]["uiSchema"]["fields"]
          : [],
        v603 = v602["find"](
          (v604) => String(v604?.["id"] || "")["trim"]() === v600,
        );
      if (v600 !== "aspectRatio" && v603?.["displayRole"] !== "aspectRatio")
        return {};
      const v605 = getPlainGenerationParams(v599?.["generationParams"]),
        v606 = Object["prototype"]["hasOwnProperty"]["call"](v605, v600)
          ? v605[v600]
          : Object["prototype"]["hasOwnProperty"]["call"](v605, "aspectRatio")
            ? v605["aspectRatio"]
            : v598,
        v607 = String(v606 || "")["trim"]();
      if (!v607) return {};
      const v608 = buildImageSchemaAspectRatioDisplayPatch({
        store: v175,
        nodeId: this["nodeId"],
        nodeData: v596,
        fallbackNodeData: this["_data"],
        ratioValue: v607,
        minSide: v179()["width"],
        inputKinds: ["image", "video"],
        resultMediaElement: this["videoEl"],
        resultFields: ["videos", "localPath", "thumbUrl", "videoUrl", "src"],
      });
      return (
        applyImageSchemaRatioResizeAnimation(this, {
          nodeId: this["nodeId"],
          previewEl: this["previewEl"],
          nodeData: v596,
          patch: v608,
        }),
        { aspectRatio: v607, ...v608 }
      );
    }
    ["_getDreaminaRatioDisplayState"](v609 = this["_data"], v610 = null) {
      if (!this["_isDreaminaVideoNode"](v609)) return null;
      const v611 =
          v610 || this["_syncDreaminaTaskState"](v609, { syncStore: false }),
        v612 = v611?.["nodeData"] || v609,
        v613 = v611?.["summary"] || this["_getDreaminaReferenceSummary"](v612),
        v614 =
          v611?.["resolvedTaskType"] ||
          this["_getResolvedDreaminaTaskType"](v612, v613),
        v615 =
          ensureDreaminaStyleVideoModelForTask(
            v614,
            v612?.["model"],
            v612?.["provider"],
          ) ||
          normalizeDreaminaStyleVideoModel(v612?.["model"], v612?.["provider"]),
        v616 = normalizeDreaminaStyleVideoResolution(
          v614,
          v615,
          v612?.["resolution"] || v612?.["videoSize"],
          v612?.["provider"],
        ),
        v617 = String(v612?.["aspectRatio"] || "")["trim"](),
        v618 =
          v617 === "自适应" || v617 === "自适应" || v617 === "auto"
            ? "自适应"
            : v617 === "5:4"
              ? "4:3"
              : v617 === "4:5"
                ? "3:4"
                : v617
                  ? normalizeDreaminaVideoAspectRatio(v617)
                  : "自适应",
        v619 = getDreaminaStyleVideoResolutionOptions(
          v614,
          v615,
          v612?.["provider"],
        ),
        v620 = Number(v613?.["imageCount"] || 0) > 0;
      return {
        nodeData: v612,
        summary: v613,
        resolvedTaskType: v614,
        currentModel: v615,
        currentResolution: v616,
        currentRatio: v618,
        resolutionOptions: v619,
        hasImageRefs: v620,
        ratioLabelText: v618 + " · " + (v616 || "720p"),
        ratioIconLabel: v618,
      };
    }
    ["_syncDreaminaTaskState"](v621 = this["_data"], v622 = {}) {
      if (!this["_isDreaminaVideoNode"](v621))
        return {
          nodeData: v621,
          summary: this["_getDreaminaReferenceSummary"](v621),
          resolvedTaskType: "",
          routeMode: "",
        };
      const v623 = v622?.["syncStore"] !== false;
      let v624 = this["_normalizeDreaminaNodeData"](v621, { syncStore: v623 });
      const v625 = this["_getDreaminaReferenceSummary"](v624),
        v626 = normalizeDreaminaVideoRouteMode(
          v624?.["dreaminaRouteMode"],
          v624?.["mode"],
        ),
        v627 = resolveDreaminaVideoTaskType({
          routeMode: v626,
          imageCount: v625["imageCount"],
          videoCount: v625["videoCount"],
          audioCount: v625["audioCount"],
        }),
        v628 = {};
      if (v627 !== "multiframe2video") {
        const v629 = resolveDreaminaStyleVideoProvider(
            v624?.["model"],
            v624?.["provider"],
          ),
          v630 = ensureDreaminaStyleVideoModelForTask(
            v627,
            v624?.["model"],
            v629,
          );
        v630 &&
          v630 !== String(v624?.["model"] || "")["trim"]() &&
          (v628["model"] = v630);
        const v631 = normalizeDreaminaStyleVideoResolution(
          v627,
          v630 || v624?.["model"],
          v624?.["resolution"] || v624?.["videoSize"],
          v629,
        );
        v631 &&
          v631 !== String(v624?.["resolution"] || "")["trim"]() &&
          (v628["resolution"] = v631);
        const v632 = normalizeDreaminaStyleVideoDuration(
          v627,
          v630 || v624?.["model"],
          v624?.["duration"],
          v629,
        );
        Number(v632) !== Number(v624?.["duration"]) &&
          (v628["duration"] = v632);
      }
      if (v625["imageCount"] <= 0) {
        const v633 = normalizeDreaminaVideoAspectRatio(v624?.["aspectRatio"], {
          preserveAdaptive: true,
        });
        v633 !== String(v624?.["aspectRatio"] || "")["trim"]() &&
          String(v624?.["aspectRatio"] || "")["trim"]() &&
          (v628["aspectRatio"] = v633);
      }
      v626 !== String(v624?.["dreaminaRouteMode"] || "")["trim"]() &&
        (v628["dreaminaRouteMode"] = v626);
      const v634 = resolveDreaminaStyleVideoProvider(
        v624?.["model"],
        v624?.["provider"],
      );
      String(v624?.["provider"] || "")
        ["trim"]()
        ["toLowerCase"]() !== v634 && (v628["provider"] = v634);
      if (Object["keys"](v628)["length"] > 0) {
        const v635 = buildDreaminaStorePatchFromNormalization(v624, v628);
        v624 = this["_getDreaminaEffectiveNodeData"]({ ...v624, ...v635 });
        const v636 = v175["getState"]()["nodes"]?.[this["nodeId"]];
        v623 && v636 && v175["updateNodeData"](this["nodeId"], v635);
      }
      return {
        nodeData: v624,
        summary: v625,
        resolvedTaskType: v627,
        routeMode: v626,
      };
    }
    ["_syncDreaminaPromptPlaceholder"](v637 = this["_data"]) {
      if (!this["promptEl"]) return;
      const v638 =
        this["promptEl"]["dataset"] || (this["promptEl"]["dataset"] = {});
      if (!this["_isDreaminaVideoNode"](v637)) {
        const v639 = this["_resolveModelExecution"](
          v637?.["model"],
          v637?.["provider"],
        );
        v638["placeholder"] = resolveVideoPromptPlaceholder(
          v639?.["modelManifest"],
          v637,
        );
        return;
      }
      const v640 = this["_getDreaminaEffectiveNodeData"](v637),
        v641 = normalizeDreaminaVideoRouteMode(
          v640?.["dreaminaRouteMode"],
          v640?.["mode"],
        );
      v638["placeholder"] =
        v641 === "frames2video"
          ? "输入文字，描述你想创作的画面内容、运动方式等。例如：一个3D形象的小男孩，在公园滑滑板。"
          : "上传1-12个参考素材、输入文字，自由组合图、文、音、视频多元素，定义精彩互动。例如：@图片1 模仿 @视频1 的动作，音色参考 @音频1。";
    }
    ["_decorateDreaminaFooter"](v642, v643) {
      const v644 =
          v643 ||
          this["_syncDreaminaTaskState"](this["_data"], { syncStore: false }),
        v645 = v644?.["nodeData"] || this["_data"],
        v646 = this["_getDreaminaRatioDisplayState"](v645, v644),
        v647 =
          v646?.["resolvedTaskType"] ||
          v644?.["resolvedTaskType"] ||
          "text2video",
        v648 = v644?.["routeMode"] || "auto",
        v649 =
          v646?.["summary"] ||
          v644?.["summary"] ||
          this["_getDreaminaReferenceSummary"](v645),
        v650 = getDreaminaVideoTaskParamVisibility(v647),
        v651 = resolveDreaminaStyleVideoProvider(
          v645?.["model"],
          v645?.["provider"],
        ),
        v652 =
          v646?.["currentModel"] ||
          ensureDreaminaStyleVideoModelForTask(v647, v645?.["model"], v651) ||
          normalizeDreaminaStyleVideoModel(v645?.["model"], v651),
        v653 =
          v646?.["currentResolution"] ||
          normalizeDreaminaStyleVideoResolution(
            v647,
            v652,
            v645?.["resolution"] || v645?.["videoSize"],
            v651,
          ),
        v654 =
          v646?.["currentRatio"] ||
          normalizeDreaminaVideoAspectRatio(v645?.["aspectRatio"]),
        v655 = normalizeDreaminaStyleVideoDuration(
          v647,
          v652,
          v645?.["duration"],
          v651,
        ),
        v656 = getDreaminaStyleVideoDurationRange(v647, v652, v651),
        v657 = v642["querySelector"](".img-model-pills"),
        v658 = v642["querySelector"](".img-model-wrap"),
        v659 = v642["querySelector"](".img-model-btn-trigger"),
        v660 = v642["querySelector"](".img-model-label"),
        v661 = v642["querySelector"](".img-model-menu");
      if (v658) v658["hidden"] = false;
      v660 &&
        (v660["textContent"] =
          v651 === "dreamina"
            ? "即梦官方"
            : v651 === "volcengine"
              ? "火山方舟"
              : "即梦视频");
      if (v659) {
        const v662 = this["_getModelIconHTML"](v652, v651),
          v663 = v659["firstElementChild"];
        if (v663) v663["outerHTML"] = v662;
        else v659["insertAdjacentHTML"]("afterbegin", v662);
      }
      v661?.["querySelectorAll"](".floating-menu-item")["forEach"]((v664) => {
        const v665 = String(v664["dataset"]["value"] || "")["trim"](),
          v666 = String(v664["dataset"]["provider"] || "")
            ["trim"]()
            ["toLowerCase"](),
          v667 =
            v651 === "dreamina"
              ? v666 === "dreamina" || v665 === "dreamina/text2video"
              : v651 === "apimart"
                ? v666 === "apimart" && isApimartDreaminaVideoModel(v665, v666)
                : v666 === v651 && isDreaminaStyleVideoModel(v665, v666);
        v664["classList"]["toggle"]("active", v667);
      });
      let v668 = v642["querySelector"](".dreamina-task-model-wrap");
      !v668 &&
        ((v668 = document["createElement"]("div")),
        (v668["className"] = "dreamina-task-model-wrap"),
        (v668["innerHTML"] =
          "\x0a\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22img-pill-btn\x20dreamina-task-model-btn\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22dreamina-task-model-label\x22></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22floating-menu\x20dreamina-task-model-menu\x22></div>\x0a\x20\x20\x20\x20\x20\x20"),
        v658?.["insertAdjacentElement"]("afterend", v668));
      const v669 = v668["querySelector"](".dreamina-task-model-btn"),
        v670 = v668["querySelector"](".dreamina-task-model-label"),
        v671 = v668["querySelector"](".dreamina-task-model-menu"),
        v672 = getDreaminaTaskModelMenuMeta(v652, v651);
      v670 &&
        (v670["textContent"] =
          v672?.["title"] ||
          v177(v652 || getDreaminaStyleVideoDefaultModel(v647, v651)));
      v671 &&
        (v671["innerHTML"] = buildDreaminaTaskModelMenuHtml(v652, v647, v651));
      const v673 =
        !isDreaminaVideoRouteModeEnabled(v648) ||
        getDreaminaTaskModelMenuItems(v647, v651)["length"] <= 0;
      v669 && (v669["disabled"] = v673);
      (v642["querySelector"](".img-ratio-wrap")?.["remove"](),
        v642["querySelector"](".vid-mode-wrap")?.["remove"](),
        v642["querySelector"](".vid-duration-wrap")?.["remove"](),
        v642["querySelectorAll"]("[data-dreamina-video-param-schema]")[
          "forEach"
        ]((v674) => v674["remove"]()));
      const v675 = this["_getDreaminaEffectiveNodeData"]({
          ...v645,
          provider: v651,
          model: v652,
          generationParams: {
            ...getPlainGenerationParams(v645?.["generationParams"]),
            dreaminaRouteMode: v648,
            aspectRatio: v654,
            duration: v655,
            ...(v653 ? { resolution: v653 } : {}),
          },
        }),
        v676 = buildDreaminaParamSchemaFields({
          routeMode: v648,
          currentRatio: v654,
          currentResolution: v653,
          currentDuration: v655,
          durationRange: v656,
          resolutionOptions: v646?.["resolutionOptions"] || [],
        }),
        v677 = (v678, v679, v680 = {}) => {
          if (!v679["length"]) return null;
          const v681 = renderUiSchemaFields(v679, v675, {
            sourceId: "dreamina-video-normal-params",
            ...v680,
          });
          if (!v681) return null;
          const v682 = document["createElement"]("div");
          return (
            (v682["className"] = "ui-schema-placement " + v678),
            (v682["dataset"]["dreaminaVideoParamSchema"] = "1"),
            (v682["innerHTML"] = v681),
            v682
          );
        },
        v683 = v650["mode"]
          ? v677("dreamina-video-mode-schema", [v676["mode"]])
          : null,
        v684 = v650["ratio"]
          ? v677(
              "dreamina-video-ratio-schema",
              [v676["resolution"], v676["aspectRatio"]],
              { placement: "resolution" },
            )
          : null,
        v685 = v650["duration"]
          ? v677("dreamina-video-duration-schema", [v676["duration"]])
          : null;
      if (v657) {
        const v686 = [v658, v668, v683, v684, v685]["filter"](Boolean);
        v686["forEach"]((v687) => v657["appendChild"](v687));
      }
      this["_syncDreaminaPromptPlaceholder"](v675);
    }
    ["_resolveModelExecution"](v688, v689) {
      return (
        resolveModelExecution(v688, { providerHint: v689 }) ||
        resolveModelExecution(v688) ||
        null
      );
    }
    ["_getModelProviderId"](v690, v691) {
      const v692 = this["_resolveModelExecution"](v690, v691),
        v693 = normalizeProviderId(v692?.["modelManifest"]?.["provider"]);
      if (v693) return v693;
      return (
        resolveModelProvider(v690, v691, { allowPrefixInference: false }) ||
        null
      );
    }
    ["_isRunninghubWorkflowModel"](v694, v695) {
      const v696 = this["_resolveModelExecution"](v694, v695);
      return (
        normalizeProviderId(v696?.["modelManifest"]?.["provider"]) ===
          "runninghubwf" &&
        v696?.["modelManifest"]?.["adapterType"] === "workflow" &&
        v696?.["executionManifest"]?.["adapterType"] === "workflow"
      );
    }
    ["_getModelIconHTML"](v697, v698) {
      const v699 = this["_resolveModelExecution"](v697, v698),
        v700 = this["_getModelProviderId"](v697, v698);
      if (v700 === "apimart") return buildApimartVideoLogoHTML(12);
      if (v700 === "volcengine") return buildVolcengineVideoLogoHTML(12);
      if (
        v700 === "dreamina" ||
        v699?.["modelManifest"]?.["extensions"]?.["dreaminaStyleVideo"]
      )
        return buildDreaminaVideoLogoHTML(12);
      const v701 = v700 ? v178?.[v700]?.["logoPath"] : null;
      if (v701)
        return (
          '<img src="' +
          v701 +
          '" class="node-menu-icon-small" alt="' +
          v700 +
          "\x22>"
        );
      return '<div class="node-menu-icon-small node-menu-icon-badge video-model-fallback-icon">VM</div>';
    }
    ["_getModelParamVisibility"](v702, v703) {
      if (isDreaminaStyleVideoModel(v702, v703)) {
        const v704 = this["_getResolvedDreaminaTaskType"]();
        return getDreaminaVideoTaskParamVisibility(v704);
      }
      const v705 = this["_getModelProviderId"](v702, v703);
      if (v705 === "runninghub" || v705 === "runninghubwf")
        return { ratio: true, mode: false, duration: false };
      return { ratio: true, mode: true, duration: true };
    }
    ["_getRatioIconHTML"](v706) {
      if (v706 === "自适应")
        return '<svg class="video-ratio-auto-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>';
      const v707 = {
          "1:1": "img-rp-sq",
          "9:16": "img-rp-tall",
          "16:9": "img-rp-wide",
          "3:4": "img-rp-p34",
          "4:3": "img-rp-l43",
          "3:2": "img-rp-l32",
          "2:3": "img-rp-p23",
          "5:4": "img-rp-l54",
          "4:5": "img-rp-p45",
          "21:9": "img-rp-ultra",
        },
        v708 = v707[v706] || "img-rp-sq";
      return (
        '<span class="img-rp-icon video-ratio-icon ' + v708 + "\x22></span>"
      );
    }
    ["_updateSubmitButtonState"]() {
      if (!this["btnEl"]) return;
      const v709 =
          typeof v175["getState"] === "function" ? v175["getState"]() : {},
        v710 = v709?.["nodes"] || {},
        v711 =
          typeof v175["getIncomingEdges"] === "function"
            ? v175["getIncomingEdges"](this["nodeId"])
            : [],
        v712 = v710?.[this["nodeId"]] || this["_data"] || {},
        v713 = this["_isRunninghubWorkflowModel"](
          v712?.["model"],
          v712?.["provider"],
        ),
        v714 = resolveGenerationButtonMode(v712, {
          cancellable: v713,
          cancelInFlight: this["_rhCancelInFlight"] === true,
        });
      if (v714["busy"]) {
        v713
          ? setGenerateButtonCancellableUi(this["btnEl"], {
              title: VIDEO_CANCEL_TOOLTIP,
              tooltip: VIDEO_CANCEL_TOOLTIP,
              ariaLabel: "取消生成视频",
              color: "var(--red)",
              busy: true,
            })
          : setGenerateButtonLoadingUi(this["btnEl"], {
              title: VIDEO_GENERATE_TITLE,
              disabled: true,
              ariaLabel: VIDEO_GENERATE_TITLE,
            });
        ((this["btnEl"]["disabled"] = v714["disabled"]),
          (this["btnEl"]["style"]["cursor"] = v714["cursor"]));
        return;
      }
      resetGenerateButtonIdleUi(this["btnEl"], VIDEO_GENERATE_TITLE);
      const v715 = resolvePromptTextWithTextRefs({
        promptEl: this["promptEl"],
        inEdges: v711,
        nodes: v710,
      });
      if (this["_isDreaminaVideoNode"](v712)) {
        const v716 = this["_syncDreaminaTaskState"](v712, { syncStore: true });
        this["_data"] = v716["nodeData"] || this["_data"];
        const v717 = v716["summary"] || this["_getDreaminaReferenceSummary"](),
          v718 =
            v716["resolvedTaskType"] || this["_getResolvedDreaminaTaskType"](),
          v719 = v716["routeMode"] || "multimodal2video";
        if (!isDreaminaVideoRouteModeEnabled(v719)) {
          ((this["btnEl"]["disabled"] = true),
            (this["btnEl"]["style"]["cursor"] = "var(--unavailable-cursor)"));
          return;
        }
        const v720 = validateDreaminaVideoRouteSelection({
          routeMode: v719,
          taskType: v718,
          imageCount: v717["imageCount"],
          videoCount: v717["videoCount"],
          audioCount: v717["audioCount"],
        });
        let v721 = !v720;
        if (v721) {
          if (v718 === "text2video") v721 = !!v715;
          else {
            if (v718 === "image2video")
              v721 = !!v715 && v717["imageCount"] === 1;
            else {
              if (v718 === "frames2video")
                v721 = !!v715 && v717["imageCount"] === 2;
              else {
                if (v718 === "multiframe2video") v721 = false;
                else
                  v718 === "multimodal2video" &&
                    (v721 = v717["imageCount"] > 0 || v717["videoCount"] > 0);
              }
            }
          }
        }
        ((this["btnEl"]["disabled"] = !v721),
          (this["btnEl"]["style"]["cursor"] = this["btnEl"]["disabled"]
            ? "var(--unavailable-cursor)"
            : ""));
        return;
      }
      const v722 = !!v711["length"];
      if (isHappyHorsePanelModel(v712)) {
        ((this["btnEl"]["disabled"] = !v715),
          (this["btnEl"]["style"]["cursor"] = this["btnEl"]["disabled"]
            ? "var(--unavailable-cursor)"
            : ""));
        return;
      }
      const v723 = getFixedInputSlotConfigFromManifest(this["_data"] || {}),
        v724 = (v723?.["fixedSlots"] || [])["filter"](
          (v725) => v725?.["required"] === true,
        ),
        v726 = (v723?.["exclusiveGroups"] || [])["filter"](
          (v727) =>
            v727?.["required"] === true || Number(v727?.["min"] || 0) > 0,
        );
      if (v724["length"] > 0 || v726["length"] > 0) {
        const v728 = v710?.[this["nodeId"]] || this["_data"] || {},
          v729 = new Set(),
          v730 = new Set(v723["visibleSlots"] || []);
        for (const v731 of v711) {
          const v732 = v710[v731["sourceId"]];
          if (!v732) continue;
          const v733 = resolveEffectiveInputKind(v732, v731),
            { slot: v734 } = resolveFixedInputSlotForRef({
              fixedInputConfig: v723,
              refSlot: v731?.["refSlot"],
              kind: v733,
              occupiedSlots: v729,
            });
          if (v734 && v730["has"](v734)) v729["add"](v734);
        }
        const v735 = buildFixedInputAssetSlotMap(this["promptEl"], {
            slotOrderByType: v723["slotOrderByType"],
            visibleSlots: v723["visibleSlots"],
            exclusiveGroups: v723["exclusiveGroups"],
            occupiedSlots: v729,
            nodeData: v728,
          }),
          v736 = v724["every"]((v737) => {
            const v738 = String(v737?.["id"] || "")["trim"]();
            return !!v738 && (v729["has"](v738) || !!v735[v738]);
          }),
          v739 = v726["every"]((v740) => {
            const v741 = Array["isArray"](v740?.["slots"]) ? v740["slots"] : [];
            return v741["some"]((v742) => v729["has"](v742) || !!v735[v742]);
          }),
          v743 = v736 && v739;
        ((this["btnEl"]["disabled"] = !v743),
          (this["btnEl"]["style"]["cursor"] = this["btnEl"]["disabled"]
            ? "var(--unavailable-cursor)"
            : ""));
        return;
      }
      ((this["btnEl"]["disabled"] = v713 ? false : !v715 && !v722),
        (this["btnEl"]["style"]["cursor"] = this["btnEl"]["disabled"]
          ? "var(--unavailable-cursor)"
          : ""));
    }
  }
  return v183["prototype"];
}
