import {
  getDefaultDreaminaImageModelId,
  getDreaminaImageModelVersion,
  isDreaminaImageModel,
  normalizeDreaminaImageAspectRatio,
  normalizeDreaminaImageModel,
  normalizeDreaminaImageSize,
} from "./dreaminaModelMenuHelper.js";
import {
  NANO_BANANA_FAMILIES,
  resolveNanoBananaModelBySelection,
  resolveNanoBananaSelectionFromModel,
} from "../../modules/nanoBananaModeRules.js";
import {
  getRatioCapability,
  isAdaptiveRatioLabel,
  parseRatioLabel,
  pickClosestRatioForProviderModel,
  resolveAdaptiveSourceSize,
  resolveProviderRatioPayload,
} from "../../../api/imageRatioPolicy.js";
import {
  appendAssetMentionToPrompt,
  getPromptAssetInputRefsFromNode,
  insertPresetPromptIntoEditor,
  isRunningHubWorkflowNode,
  previewPresetPromptInEditor,
  shouldUsePromptPreviewForPreset,
} from "../../modules/nodePromptShared.js";
import { getFixedInputSlotConfigFromManifest } from "../../modules/fixedInputAssetRefs.js";
import {
  getPromptPresetTemplateEmptyInputMessage,
  requiresPromptPresetInput,
  resolvePromptPresetTemplate,
} from "../../modules/promptPresetTemplate.js";
import { normalizeImageSizeForProviderModel } from "../../modules/imageModelCapabilities.js";
import {
  getGenerationRatioSizeWithDom,
  pickGenerationRatioSourceEdge,
} from "../../modules/generationRatioSource.js";
import {
  getTargetInputPolicy,
  isRhPersonReplaceWorkflowModel,
  isRhQwenImageEditModel,
  isInputKindAllowed,
  resolveEffectiveInputKind,
} from "../../modules/modelInputPolicy.js";
import {
  getModelManifest,
  isModelApiModel,
  isWorkflowModel,
  resolveModelExecution,
  resolveModelProvider,
  sanitizeModelUiSchemaParams,
} from "../../manifests/index.js";
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
import {
  buildGenerationCancelledPatch,
  buildGenerationStartPatch,
} from "../../core/generationTaskLifecycle.js";
import {
  cancelTask,
  resumeTask,
  submitTask,
} from "../../core/generationTaskRuntime.js";
import {
  shouldAllowCancel,
  shouldShowGenerationBusyUi,
} from "../../core/generationTaskUiState.js";
import { resolveGenerationInputImageUrl } from "../../services/imageReferenceUrlService.js";
import { generateComfyuiImage } from "../../../api/comfyuiApi.js";
import {
  ensureComfyWorkflowConfig,
  isComfyuiEngine,
  readComfyFooterParams,
  loadComfyWorkflowBundle,
} from "../../modules/comfyui/comfyEngineUi.js";
import { buildComfyParams, applyComfyQualityRatioToParams, stripComfyAutoDimensionParams } from "../../modules/comfyui/comfyParamMapper.js";
import { getImageFields } from "../../modules/comfyui/comfyWorkflowParser.js";
import { logDiagnosticEvent } from "../../services/diagnosticsService.js";
import { GENERATION_HISTORY_EVENT } from "../../modules/generationHistoryAssets.js";
import {
  buildImageGenerationFailurePatch,
  buildImageGenerationResultPatch,
  getImageGenerationResultError,
  getSuccessfulImageGenerationItems,
  normalizeImageGenerationResult,
} from "./imageGenerationResultRenderer.js";
import {
  getImageInputGateMissingMessage,
  getImageInputGateUploadedUrl,
  getImageNodeInputGate,
  shouldUseImageWorkflowBusyButton,
} from "./imageNodeManifestPolicies.js";
const DREAMINA_STALE_ACTIVE_RESUME_MS = 15 * 1000,
  DREAMINA_NON_RECOVERABLE_STATUSES = new Set([
    "cancelled",
    "canceled",
    "complete",
    "completed",
    "done",
    "error",
    "fail",
    "failed",
    "finish",
    "finished",
    "idle",
    "success",
    "succeeded",
  ]),
  DREAMINA_NON_RECOVERABLE_PHASES = new Set([
    "cancelled",
    "canceled",
    "complete",
    "completed",
    "done",
    "error",
    "fail",
    "failed",
    "finish",
    "finished",
    "success",
    "succeeded",
  ]),
  ASYNC_IMAGE_MODEL_API_PROVIDERS = new Set(["apimart", "grsai", "ppio"]);
function normalizeTaskStatus(v0) {
  return String(v0 || "")
    ["trim"]()
    ["toLowerCase"]();
}
function isAsyncImageModelApiProvider(v1) {
  return ASYNC_IMAGE_MODEL_API_PROVIDERS["has"](
    String(v1 || "")
      ["trim"]()
      ["toLowerCase"](),
  );
}
function getImageProviderApiKeyMissingMessage(v2 = {}) {
  if (String(v2?.["apiKey"] || "")["trim"]()) return "";
  const v3 = String(v2?.["provider"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (!v3) return "";
  if (v3 === "volcengine") return "请先在设置里填写火山方舟 API Key";
  if (v3 === "runninghub")
    return isModelApiModel(v2?.["model"], "runninghub")
      ? "请先在设置里填写 RunningHub Model API Key"
      : "请先在设置里填写\x20RunningHub\x20API\x20Key";
  if (v3 === "runninghubwf")
    return "请先在设置里填写\x20RunningHub\x20API\x20Key";
  if (v3 === "apimart") return "请先在设置里填写 APIMart API Key";
  if (v3 === "ppio") return "请先在设置里填写 PPIO API Key";
  if (v3 === "grsai") return "请先在设置里填写 GRSAI API Key";
  return "";
}
function createSchemaParamAccess({
  model: v4,
  data: v5,
  generationParams: v6,
  manifestFields: v7,
}) {
  const v8 = (v9) =>
      v7["find"]((v10) => String(v10?.["id"] || "") === v9) || null,
    v11 = (v12) => {
      const v13 = v8(v12);
      if (!v13) return undefined;
      if (v6[v12] !== undefined) return v6[v12];
      return v13["defaultValue"];
    },
    v14 = (v15) => {
      const v16 = v11(v15);
      if (v16 === undefined || v16 === null || String(v16)["trim"]() === "")
        throw new Error("Manifest model " + v4 + " missing " + v15);
      return v16;
    };
  return {
    getManifestField: v8,
    readSchemaParam: v11,
    requireSchemaParam: v14,
  };
}
function isGrsaiGptImage2Model(v17, v18) {
  const v19 = resolveNanoBananaSelectionFromModel(v18, "2K", v17 || "grsai");
  return (
    v19?.["provider"] === "grsai" &&
    v19["family"] === NANO_BANANA_FAMILIES["GPT_IMAGE_2"]
  );
}
function resolveGrsaiGptImage2ModelForSize({
  provider: v20,
  model: v21,
  imageSize: v22,
} = {}) {
  if (!isGrsaiGptImage2Model(v20, v21)) return v21;
  const v23 = String(v22 || "1K")
      ["trim"]()
      ["toUpperCase"](),
    v24 =
      resolveModelExecution(v21, { providerHint: "grsai" }) ||
      resolveModelExecution(
        resolveNanoBananaSelectionFromModel(v21, v23, "grsai")?.["model"],
        { providerHint: "grsai" },
      ),
    v25 = v24?.["executionManifest"]?.["imageSizeModels"];
  if (!v25 || typeof v25 !== "object") return v21;
  return (
    v25[v23] || v25["default"] || v24?.["modelManifest"]?.["modelId"] || v21
  );
}
function resolveImageSizeForProviderModel({
  provider: v26,
  model: v27,
  imageSize: v28,
} = {}) {
  const v29 = normalizeImageSizeForProviderModel({
    provider: v26,
    model: v27,
    imageSize: v28,
  });
  if (v29) return v29;
  const v30 = String(v28 || (isGrsaiGptImage2Model(v26, v27) ? "1K" : "2K"))
    ["trim"]()
    ["toUpperCase"]();
  return v30 || "2K";
}
function shouldUseGrsaiNanoBananaApiAuto({ provider: v31, model: v32 } = {}) {
  const v33 = String(v31 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v33 !== "grsai") return false;
  const v34 = resolveNanoBananaSelectionFromModel(v32, "2K", v31);
  if (!v34) return false;
  return v34["family"] !== NANO_BANANA_FAMILIES["GPT_IMAGE_2"];
}
function shouldUseApimartSeedreamApiAuto({
  provider: v35,
  model: v36,
  hasInputImages: v37,
} = {}) {
  const v38 = String(v35 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v38 !== "apimart" || !v37) return false;
  const v39 = resolveModelExecution(v36, { providerHint: v38 });
  return (
    v39?.["executionManifest"]?.["extensions"]?.["apimartSeedream"]?.[
      "preserveAdaptiveInputRatio"
    ] === true
  );
}
function sanitizeTaskGenerationParams(v40, v41 = {}) {
  const v42 =
      v41 && typeof v41 === "object" && !Array["isArray"](v41) ? v41 : {},
    v43 = sanitizeModelUiSchemaParams(v40, v42, { includeDefaults: false });
  return (
    Object["prototype"]["hasOwnProperty"]["call"](v42, "aspectRatio") &&
      (v43["aspectRatio"] = v42["aspectRatio"]),
    { ...v42, ...v43 }
  );
}
function normalizeTaskBooleanParam(v44) {
  if (v44 === true || v44 === false) return v44;
  const v45 = String(v44 ?? "")
    ["trim"]()
    ["toLowerCase"]();
  if (["true", "1", "yes", "on"]["includes"](v45)) return true;
  if (["false", "0", "no", "off", ""]["includes"](v45)) return false;
  return Boolean(v44);
}
const MODEL_API_PAYLOAD_SCHEMA_PARAM_EXCLUDES = Object["freeze"](
  new Set([
    "mode",
    "rhModelRoute",
    "imageSize",
    "aspectRatio",
    "batchSize",
    "google_search",
    "google_image_search",
  ]),
);
function buildModelApiSchemaPayloadParams({
  isModelApiManifest: v46,
  manifestFields: v47,
  readSchemaParam: v48,
} = {}) {
  if (!v46 || !Array["isArray"](v47)) return {};
  return v47["reduce"]((v49, v50) => {
    const v51 = String(v50?.["id"] || "")["trim"]();
    if (!v51 || MODEL_API_PAYLOAD_SCHEMA_PARAM_EXCLUDES["has"](v51)) return v49;
    return ((v49[v51] = v48(v51)), v49);
  }, {});
}
function reorderImageInputUrlsByRefOrder(v52 = [], v53 = []) {
  const v54 = (Array["isArray"](v52) ? v52 : [])
    ["map"]((v55) => String(v55 || "")["trim"]())
    ["filter"](Boolean);
  if (v54["length"] <= 1) return v54;
  const v56 = new Set(v54),
    v57 = [],
    v58 = (v59) => {
      const v60 = String(v59 || "")["trim"]();
      if (!v60 || !v56["has"](v60)) return;
      (v57["push"](v60), v56["delete"](v60));
    };
  return (
    (Array["isArray"](v53) ? v53 : [])["forEach"]((v61) => {
      v58(v61?.["url"]);
    }),
    v54["forEach"](v58),
    v57
  );
}
function buildInputUrlsByFixedImageSlot({
  fixedInputConfig: fixedInputConfig = null,
  imageRefs: imageRefs = [],
  assetInputRefs: assetInputRefs = [],
} = {}) {
  const v62 = (fixedInputConfig?.["visibleSlots"] || [])
    ["map"]((v63) => String(v63 || "")["trim"]())
    [
      "filter"
    ]((v64) => v64 && String(fixedInputConfig?.["slotKindById"]?.[v64] || "") === "image");
  if (v62["length"] === 0) return {};
  const v65 = {},
    v66 = new Set(),
    v67 = (v68, v69) => {
      const v70 = String(v68 || "")["trim"](),
        v71 = String(v69 || "")["trim"]();
      if (!v70 || !v71 || v65[v70]) return false;
      if (!v62["includes"](v70)) return false;
      return ((v65[v70] = v71), v66["add"](v71), true);
    },
    v72 = (v73) => {
      const v74 = String(v73 || "")["trim"]();
      if (!v74 || v66["has"](v74)) return false;
      const v75 = v62["find"]((v76) => !v65[v76]);
      return v67(v75, v74);
    };
  return (
    (Array["isArray"](imageRefs) ? imageRefs : [])["forEach"]((v77) => {
      v67(v77?.["refSlot"], v77?.["url"]);
    }),
    (Array["isArray"](assetInputRefs) ? assetInputRefs : [])["forEach"](
      (v78) => {
        v67(v78?.["refSlot"], v78?.["url"]);
      },
    ),
    (Array["isArray"](imageRefs) ? imageRefs : [])["forEach"]((v79) => {
      v72(v79?.["url"]);
    }),
    (Array["isArray"](assetInputRefs) ? assetInputRefs : [])["forEach"](
      (v80) => {
        const v81 = resolveEffectiveInputKind(v80) || v80?.["type"];
        if (v81 === "image") v72(v80?.["url"]);
      },
    ),
    v65
  );
}
export function createAIGenerateNodeTaskOrchestrationModule(v82) {
  const {
    store: v83,
    api: v84,
    getDisplayModelName: v85,
    _handlePillHover: v86,
    _handlePillOut: v87,
    _syncEdgesOrderFromPills: v88,
    _syncPillLabels: v89,
    _checkAtTrigger: v90,
    _populateMentionMenu: v91,
    _insertMentionPill: v92,
    _handlePillKeyboard: v93,
    _rehydratePromptPills: v94,
    _handleMentionMenuKeyboard: v95,
    TEXT_TOOLBAR_HTML: v96,
    bindTextToolbarEvents: v97,
    IMAGE_TOOLBAR_HTML: v98,
    bindImageToolbarEvents: v99,
    showDevToast: v100,
    getImage: v101,
    openNodeImagePreview: v102,
    getPromptPresets: v103,
    openCustomPresetsManager: v104,
    startLoading: v105,
    stopLoading: v106,
    bindRefThumbHoverPreview: v107,
    ensureThumbDecoded: v108,
    revealRefThumbMedia: v109,
    getRefKindByNodeType: v110,
    uploadFile: v111,
    ensureConfig: v112,
    getProviderConfig: v113,
    generateId: v114,
    checkSlashTrigger: v115,
    handleSlashKeyboardNavigation: v116,
    closeSlashMenu: v117,
    activateMenuKeyboard: v118,
    ImageFreeAngleController: v119,
  } = v82;
  class v120 {
    ["_persistRunningHubResumeCache"]() {
      try {
        window["_triggerLocalCacheSave"]?.();
      } catch {}
    }
    ["_persistDreaminaResumeCache"]() {
      this["_persistRunningHubResumeCache"]();
    }
    ["_persistAsyncResumeCache"]() {
      this["_persistRunningHubResumeCache"]();
    }
    ["_isDreaminaImageNode"](v121 = this["_data"]) {
      return (
        resolveModelProvider(v121?.["model"], v121?.["provider"]) === "dreamina"
      );
    }
    ["_inferProviderFromModel"](v122, v123 = "") {
      return (
        resolveModelProvider(v122, "", { allowProviderHint: false }) ||
        resolveModelProvider(v122, v123) ||
        resolveModelProvider(v122, "grsai")
      );
    }
    ["_isRunninghubTaskModel"](v124, v125) {
      const v126 = resolveModelProvider(v124, v125, {
          allowProviderHint: false,
        }),
        v127 = String(v125 || v126 || "")
          ["trim"]()
          ["toLowerCase"]();
      return (
        ((v127 === "runninghub" || v126 === "runninghub") &&
          isModelApiModel(v124, "runninghub")) ||
        this["_isRunninghubWorkflowModel"](v124, v125)
      );
    }
    ["_isRunningHubNanoBananaModel"](v128 = this["_data"]?.["model"]) {
      const v129 = resolveNanoBananaSelectionFromModel(
        v128,
        "2K",
        "runninghub",
      );
      return (
        v129?.["provider"] === "runninghub" &&
        v129["family"] === NANO_BANANA_FAMILIES["NANOBANANA"]
      );
    }
    ["_isRunningHubRecoverableRunningTask"](v130 = this["_data"]) {
      if (!this["_isRunninghubTaskModel"](v130?.["model"], v130?.["provider"]))
        return false;
      const v131 = String(v130?.["rhTaskId"] || "")["trim"]();
      if (!v131) return false;
      const v132 = String(v130?.["rhTaskStatus"] || "")
        ["trim"]()
        ["toLowerCase"]();
      if (
        v132 === "complete" ||
        v132 === "completed" ||
        v132 === "done" ||
        v132 === "error" ||
        v132 === "finish" ||
        v132 === "finished" ||
        v132 === "success" ||
        v132 === "succeeded" ||
        v132 === "failed" ||
        v132 === "fail" ||
        v132 === "idle" ||
        v132 === "cancelled" ||
        v132 === "canceled"
      )
        return false;
      return true;
    }
    ["_isDreaminaRecoverableRunningTask"](v133 = this["_data"]) {
      if (!this["_isDreaminaImageNode"](v133)) return false;
      const v134 = String(v133?.["dreaminaSubmitId"] || "")["trim"]();
      if (!v134) return false;
      const v135 = normalizeTaskStatus(v133?.["jobStatus"]),
        v136 = normalizeTaskStatus(v133?.["dreaminaTaskPhase"]),
        v137 = normalizeTaskStatus(v133?.["dreaminaTaskStatus"]);
      if (DREAMINA_NON_RECOVERABLE_STATUSES["has"](v135)) return false;
      if (DREAMINA_NON_RECOVERABLE_PHASES["has"](v136)) return false;
      if (DREAMINA_NON_RECOVERABLE_STATUSES["has"](v137)) return false;
      return true;
    }
    ["_isStaleActiveDreaminaTask"](v138 = this["_data"]) {
      if (!this["_isGenerating"]) return false;
      if (v138?.["dreaminaTaskRecovering"] === true) return false;
      if (this["_dreaminaResumePromise"]) return false;
      const v139 = Number(
        v138?.["dreaminaTaskLastCheckedAt"] ||
          v138?.["dreaminaTaskStartedAt"] ||
          v138?.["generationStartTime"] ||
          0,
      );
      if (!Number["isFinite"](v139) || v139 <= 0) return false;
      return Date["now"]() - v139 >= DREAMINA_STALE_ACTIVE_RESUME_MS;
    }
    ["_isAsyncRecoverableRunningTask"](v140 = this["_data"]) {
      const v141 = String(v140?.["asyncTaskId"] || "")["trim"]();
      if (!v141) return false;
      const v142 = this["_inferProviderFromModel"](
        v140?.["model"],
        v140?.["asyncTaskProvider"] || v140?.["provider"] || "",
      );
      if (
        !v142 ||
        v142 === "runninghubwf" ||
        v142 === "runninghub" ||
        v142 === "dreamina"
      )
        return false;
      const v143 = String(v140?.["asyncTaskKind"] || "")
        ["trim"]()
        ["toLowerCase"]();
      if (v143 && v143 !== "image") return false;
      const v144 = String(v140?.["asyncTaskStatus"] || "")
        ["trim"]()
        ["toLowerCase"]();
      if (
        v144 === "success" ||
        v144 === "failed" ||
        v144 === "idle" ||
        v144 === "cancelled"
      )
        return false;
      return true;
    }
    ["_hasImageGenerationResult"](v145 = this["_data"]) {
      const v146 = Array["isArray"](v145?.["images"]) ? v145["images"] : [],
        v147 = v146["some"]((v148) => {
          if (!v148 || typeof v148 !== "object") return false;
          if (String(v148?.["error"] || "")["trim"]()) return false;
          return !!String(
            v148?.["localPath"] ||
              v148?.["imageUrl"] ||
              v148?.["sourceUrl"] ||
              v148?.["thumbUrl"] ||
              "",
          )["trim"]();
        });
      if (v147) return true;
      return !!String(
        v145?.["localPath"] ||
          v145?.["imageUrl"] ||
          v145?.["sourceUrl"] ||
          v145?.["thumbUrl"] ||
          "",
      )["trim"]();
    }
    ["_shouldFallbackRegenerateAsyncTask"](v149 = this["_data"]) {
      const v150 = String(v149?.["asyncTaskId"] || "")["trim"]();
      if (v150) return false;
      const v151 = this["_inferProviderFromModel"](
        v149?.["model"],
        v149?.["asyncTaskProvider"] || v149?.["provider"] || "",
      );
      if (!["ppio", "apimart"]["includes"](v151)) return false;
      const v152 = String(v149?.["asyncTaskStatus"] || "")
          ["trim"]()
          ["toLowerCase"](),
        v153 = [
          "submitted",
          "pending",
          "queued",
          "waiting",
          "running",
          "processing",
          "querying",
          "in_progress",
        ]["includes"](v152);
      if (!v153) return false;
      if (this["_hasImageGenerationResult"](v149)) return false;
      if (v149?.["generationDuration"] != null) return false;
      return true;
    }
    async ["_maybeFallbackRegenerateAsyncTask"](v154 = this["_data"]) {
      if (!this["_shouldFallbackRegenerateAsyncTask"](v154)) return false;
      if (this["_asyncFallbackRegeneratePromise"]) return true;
      if (this["_isGenerating"]) return true;
      const v155 = (async () => {
        const v156 = v83["getState"]()["nodes"]?.[this["nodeId"]] || v154 || {},
          v157 =
            Number(v156?.["generationStartTime"] || 0) > 0
              ? Number(v156["generationStartTime"])
              : Date["now"]();
        (v83["updateNodeData"](
          this["nodeId"],
          this["_buildAsyncTaskPatch"]({
            provider: this["_inferProviderFromModel"](
              v156?.["model"],
              v156?.["asyncTaskProvider"] || v156?.["provider"] || "",
            ),
            kind: "image",
            taskId: "",
            status: "pending",
            startedAt: v157,
            recovering: true,
          }),
        ),
          this["_persistAsyncResumeCache"](),
          await this["_onGenerate"]());
      })();
      return (
        (this["_asyncFallbackRegeneratePromise"] = v155["finally"](() => {
          this["_asyncFallbackRegeneratePromise"] = null;
        })),
        true
      );
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
    ["_buildDreaminaTaskPatch"]({
      submitId: submitId = "",
      status: status = "pending",
      phase: phase = "generating",
      label: label = "生成中",
      startedAt: startedAt = 0,
      lastCheckedAt: lastCheckedAt = Date["now"](),
      recovering: recovering = false,
      raw: raw = {},
    } = {}) {
      return {
        dreaminaSubmitId: String(submitId || "")["trim"](),
        dreaminaTaskStatus: String(status || "pending")["trim"]() || "pending",
        dreaminaTaskPhase:
          String(phase || "generating")["trim"]() || "generating",
        dreaminaTaskLabel: String(label || "生成中")["trim"]() || "生成中",
        dreaminaTaskStartedAt: Number(startedAt || 0),
        dreaminaTaskLastCheckedAt: Number(lastCheckedAt || Date["now"]()),
        dreaminaTaskRecovering: recovering === true,
        dreaminaTaskLastRaw:
          raw && typeof raw === "object" && !Array["isArray"](raw) ? raw : {},
      };
    }
    ["_buildDreaminaFailurePatch"]({
      error: error = "",
      startedAt: startedAt = 0,
      submitId: submitId = "",
      lastCheckedAt: lastCheckedAt = Date["now"](),
      raw: raw = {},
    } = {}) {
      const v158 =
          v83["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {},
        v159 =
          String(error?.["message"] || error || "生成失败")["trim"]() ||
          "生成失败",
        v160 =
          String(submitId || "")["trim"]() ||
          String(v158?.["dreaminaSubmitId"] || "")["trim"](),
        v161 =
          Number(startedAt) > 0
            ? Number(startedAt)
            : Number(
                v158?.["dreaminaTaskStartedAt"] ||
                  v158?.["generationStartTime"] ||
                  Date["now"](),
              );
      return {
        ...buildImageGenerationFailurePatch({ error: v159, startedAt: v161 }),
        ...this["_buildDreaminaTaskPatch"]({
          submitId: v160,
          status: "failed",
          phase: "failed",
          label: v159,
          startedAt: v161,
          lastCheckedAt: Number(lastCheckedAt || Date["now"]()),
          recovering: false,
          raw: raw,
        }),
      };
    }
    ["_finalizeDreaminaImageFailure"](v162 = {}) {
      const v163 = this["_buildDreaminaFailurePatch"](v162);
      return (
        v83["updateNodeData"](this["nodeId"], v163),
        this["_persistDreaminaResumeCache"](),
        (this["_isGenerating"] = false),
        (this["_dreaminaActiveSubmitId"] = ""),
        this["btnEl"] && resetGenerateButtonIdleUi(this["btnEl"]),
        v106(this["previewEl"]),
        this["_updateSubmitButtonState"]?.(),
        v163
      );
    }
    ["_buildAsyncTaskPatch"]({
      provider: provider = "",
      kind: kind = "image",
      taskId: taskId = "",
      status: status = "pending",
      startedAt: startedAt = 0,
      recovering: recovering = false,
    } = {}) {
      const v164 = String(status || "pending")["trim"]() || "pending",
        v165 = String(taskId || "")["trim"]();
      let v166 = String(provider || "")
        ["trim"]()
        ["toLowerCase"]();
      return (
        !v166 &&
          (v165 || v164 !== "idle") &&
          (v166 = this["_inferProviderFromModel"](
            this["_data"]?.["model"] || "",
            "",
          )),
        {
          asyncTaskProvider: v166,
          asyncTaskKind: String(kind || "image")["trim"]() || "image",
          asyncTaskId: v165,
          asyncTaskStatus: v164,
          asyncTaskStartedAt: Number(startedAt || 0),
          asyncTaskRecovering: recovering === true,
        }
      );
    }
    ["_syncLocalTaskNodeData"]() {
      const v167 = v83["getState"]()["nodes"]?.[this["nodeId"]];
      if (v167) this["_data"] = v167;
      return this["_data"] || {};
    }
    ["_applyDreaminaTaskPatch"](v168 = {}, v169 = {}) {
      const v170 =
          v83["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {},
        v171 = {
          generationStartTime:
            Number(v170?.["generationStartTime"]) > 0
              ? Number(v170["generationStartTime"])
              : Number(v168?.["startedAt"] || Date["now"]()),
          generationDuration: null,
          ...this["_buildDreaminaTaskPatch"](v168),
          ...v169,
        };
      return (
        v83["updateNodeData"](this["nodeId"], v171),
        this["_syncLocalTaskNodeData"](),
        this["_persistDreaminaResumeCache"](),
        v171
      );
    }
    ["_stopRunningHubRecovery"](v172 = false) {
      this["_rhResumeAbortController"] &&
        !this["_rhResumeAbortController"]["signal"]["aborted"] &&
        this["_rhResumeAbortController"]["abort"]();
      ((this["_rhResumeAbortController"] = null),
        (this["_rhResumeTaskId"] = ""),
        (this["_rhResumePromise"] = null));
      if (v172) {
        const v173 = v83["getState"]()["nodes"]?.[this["nodeId"]];
        v173?.["rhTaskRecovering"] &&
          (v83["updateNodeData"](this["nodeId"], { rhTaskRecovering: false }),
          this["_persistRunningHubResumeCache"]());
      }
    }
    ["_stopDreaminaRecovery"](v174 = false) {
      this["_dreaminaResumeAbortController"] &&
        !this["_dreaminaResumeAbortController"]["signal"]["aborted"] &&
        this["_dreaminaResumeAbortController"]["abort"]();
      ((this["_dreaminaResumeAbortController"] = null),
        (this["_dreaminaResumeSubmitId"] = ""),
        (this["_dreaminaResumePromise"] = null));
      if (v174) {
        const v175 = v83["getState"]()["nodes"]?.[this["nodeId"]];
        v175?.["dreaminaTaskRecovering"] &&
          (v83["updateNodeData"](this["nodeId"], {
            dreaminaTaskRecovering: false,
          }),
          this["_persistDreaminaResumeCache"]());
      }
    }
    ["_stopAsyncRecovery"](v176 = false) {
      this["_asyncResumeAbortController"] &&
        !this["_asyncResumeAbortController"]["signal"]["aborted"] &&
        this["_asyncResumeAbortController"]["abort"]();
      ((this["_asyncResumeAbortController"] = null),
        (this["_asyncResumeTaskId"] = ""),
        (this["_asyncResumePromise"] = null));
      if (v176) {
        const v177 = v83["getState"]()["nodes"]?.[this["nodeId"]];
        v177?.["asyncTaskRecovering"] &&
          (v83["updateNodeData"](this["nodeId"], {
            asyncTaskRecovering: false,
          }),
          this["_persistAsyncResumeCache"]());
      }
    }
    ["_applyImageGenerationResult"](
      v178,
      v179,
      { writeStore: writeStore = true } = {},
    ) {
      const v180 = normalizeImageGenerationResult(v178),
        v181 = buildImageGenerationResultPatch(v180, { startedAt: v179 });
      if (!v181) return null;
      return (
        writeStore && v83["updateNodeData"](this["nodeId"], v181),
        this["_dispatchGenerationHistoryAssets"](
          getSuccessfulImageGenerationItems(v180),
          v179,
        ),
        {
          patch: v181,
          normalizedResult: v180,
          items: getSuccessfulImageGenerationItems(v180),
        }
      );
    }
    ["_dispatchGenerationHistoryAssets"](v182, v183) {
      if (
        typeof window === "undefined" ||
        typeof window["dispatchEvent"] !== "function"
      )
        return;
      const v184 = Array["isArray"](v182)
        ? v182["filter"](
            (v185) => v185 && typeof v185 === "object" && !v185["error"],
          )
        : [];
      if (v184["length"] === 0) return;
      const v186 =
        v83["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {};
      try {
        window["dispatchEvent"](
          new CustomEvent(GENERATION_HISTORY_EVENT, {
            detail: {
              kind: "image",
              sourceNodeId: this["nodeId"],
              nodeData: v186,
              images: v184,
              startedAt: v183,
              createdAt: Date["now"](),
            },
          }),
        );
      } catch {}
    }
    ["_getImageGenerationResultError"](v187) {
      return getImageGenerationResultError(v187);
    }
    async ["_buildResumePayload"](v188 = this["_data"], v189 = {}) {
      const v190 = v188 || {};
      let v191 = String(
        normalizeDreaminaImageModel(v190?.["model"], v190?.["provider"]) ||
          v190?.["model"] ||
          "",
      )["trim"]();
      const v192 =
          v190["generationParams"] &&
          typeof v190["generationParams"] === "object" &&
          !Array["isArray"](v190["generationParams"])
            ? v190["generationParams"]
            : {},
        v193 = getModelManifest(v191);
      if (!v193) throw new Error("Missing model manifest: " + v191);
      const v194 = sanitizeTaskGenerationParams(v191, v192),
        v195 = v193["adapterType"] === "modelApi",
        v196 = Array["isArray"](v193?.["uiSchema"]?.["fields"])
          ? v193["uiSchema"]["fields"]
          : [],
        {
          getManifestField: v197,
          readSchemaParam: v198,
          requireSchemaParam: v199,
        } = createSchemaParamAccess({
          model: v191,
          data: this["_data"],
          generationParams: v194,
          manifestFields: v196,
        }),
        v200 = v197("imageSize") ? v199("imageSize") : undefined,
        v201 = v195 ? v198("mode") : undefined,
        v202 = resolveNanoBananaSelectionFromModel(
          v191,
          v200 || "2K",
          v190?.["provider"],
        );
      if (v202) {
        if (!v195 && v201 !== undefined)
          v191 = resolveNanoBananaModelBySelection({
            family: v202["family"],
            mode: v201,
            imageSize: v200 || "2K",
            provider: v202["provider"] || v190?.["provider"],
          });
        else !v195 && (v191 = v202["model"]);
      }
      const v203 = String(v189?.["providerHint"] || v190?.["provider"] || "")
        ["trim"]()
        ["toLowerCase"]();
      isDreaminaImageModel(v191, v203) &&
        (v191 =
          normalizeDreaminaImageModel(v191, v203) ||
          v191 ||
          getDefaultDreaminaImageModelId());
      const v204 = this["_inferProviderFromModel"](v191, v203),
        v205 = resolveImageSizeForProviderModel({
          provider: v204,
          model: v191,
          imageSize: v200,
        });
      !getModelManifest(v191) &&
        (v191 = resolveGrsaiGptImage2ModelForSize({
          provider: v204,
          model: v191,
          imageSize: v205,
        }));
      await v112();
      const v206 = v113(v204) || {};
      let v207 = "";
      if (v204 === "runninghub")
        v207 = isModelApiModel(v191, v204)
          ? v206["modelApiKey"] || ""
          : v206["apiKey"] || "";
      else
        v204 === "runninghubwf"
          ? (v207 = v206["apiKey"] || "")
          : (v207 = v206["apiKey"] || window["_appApiKey"] || "");
      return {
        nodeId: this["nodeId"],
        model: v191,
        provider: v204,
        apiKey: v207,
      };
    }
    async ["_maybeResumeRunningHubTaskImpl"]() {
      const v208 =
        v83["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {};
      if (this["_isGenerating"] && v208?.["rhTaskRecovering"] !== true) return;
      if (
        !this["_isRunninghubTaskModel"](v208?.["model"], v208?.["provider"])
      ) {
        this["_stopRunningHubRecovery"](false);
        return;
      }
      if (!this["_isRunningHubRecoverableRunningTask"](v208)) {
        this["_stopRunningHubRecovery"](false);
        return;
      }
      const v209 = String(v208?.["rhTaskId"] || "")["trim"]();
      if (!v209) {
        this["_stopRunningHubRecovery"](false);
        return;
      }
      if (this["_rhResumeTaskId"] === v209 && this["_rhResumePromise"]) return;
      this["_stopRunningHubRecovery"](false);
      const v210 = Number(
          v208?.["rhTaskStartedAt"] ||
            v208?.["generationStartTime"] ||
            Date["now"](),
        ),
        v211 =
          v208?.["rhTaskUseOpenapiQuery"] === true ||
          isModelApiModel(v208?.["model"], v208?.["provider"] || "runninghub");
      this["_rhResumeTaskId"] = v209;
      const v212 = (async () => {
        let v213 = null;
        const v214 = this["_isRunninghubWorkflowModel"](
            v208?.["model"],
            v208?.["provider"],
          ),
          v215 = shouldUseImageWorkflowBusyButton(v208?.["model"]);
        try {
          const v216 = await this["_buildResumePayload"](v208);
          if (!v216) return;
          ((v213 = new AbortController()),
            (this["_rhResumeAbortController"] = v213),
            (this["_rhTaskId"] = v209),
            (this["_rhApiKey"] =
              String(v216?.["apiKey"] || "")["trim"]() ||
              this["_rhApiKey"] ||
              null),
            (this["_rhCancelRequested"] = false),
            (this["_isGenerating"] = true));
          this["btnEl"] &&
            (v214
              ? setGenerateButtonCancellableUi(this["btnEl"], { busy: v215 })
              : setGenerateButtonLoadingUi(this["btnEl"]));
          v105(this["previewEl"]);
          const v217 = await resumeTask(
            {
              sourceNodeId: this["nodeId"],
              targetNodeId: this["nodeId"],
              trigger: "node",
              taskType: "image-generation",
              provider:
                v216["provider"] || v208?.["provider"] || "runninghubwf",
              adapterType: "workflow",
              modelId: v216["model"] || v208?.["model"] || "",
              executionId:
                "runninghub.image." +
                (v216["model"] || v208?.["model"] || "workflow"),
              payload: v216,
              taskId: v209,
              cancellable: v214,
              resumable: true,
              pauseOnAbort: true,
              startBuilder: () => ({
                rhStatusMessage: null,
                rhStatusCode: null,
                rhTaskUseOpenapiQuery: v211,
              }),
              onTaskStart: () => {
                this["_persistRunningHubResumeCache"]();
              },
              poll: async () =>
                v84["resumeRunningHubImageTask"](v209, v216, {
                  signal: v213["signal"],
                  useOpenapiQuery: v211,
                }),
              resultBuilder: async (v218, v219) => {
                const v220 = this["_getImageGenerationResultError"](v218);
                if (v220) throw new Error(v220);
                const v221 = this["_applyImageGenerationResult"](
                  v218,
                  v219["startedAt"],
                  { writeStore: false },
                );
                return {
                  ...(v221?.["patch"] || {}),
                  ...this["_buildRunningHubTaskPatch"]({
                    taskId: v209,
                    status: "success",
                    startedAt: v219["startedAt"],
                    recovering: false,
                    useOpenapiQuery: v211,
                  }),
                };
              },
              failureBuilder: (v222, v223) => ({
                ...buildImageGenerationFailurePatch({
                  error: v222?.["message"] || "生成失败",
                  startedAt: v223["startedAt"],
                }),
                rhStatusMessage: v222?.["message"] || "生成失败",
                rhStatusCode: Number["isFinite"](Number(v222?.["code"]))
                  ? Number(v222["code"])
                  : null,
                ...this["_buildRunningHubTaskPatch"]({
                  taskId: v209,
                  status: "failed",
                  startedAt: v223["startedAt"],
                  recovering: false,
                  useOpenapiQuery: v211,
                }),
              }),
              cancelledBuilder: (v224) => {
                const v225 = v83["getState"]()["nodes"]?.[this["nodeId"]] || {},
                  v226 =
                    v225["generationDuration"] == null
                      ? Date["now"]() - v224["startedAt"]
                      : v225["generationDuration"];
                return this["_buildRunningHubCancelResultPatch"]({
                  latest: v225,
                  message: v225["rhStatusMessage"] || "生成已中断",
                  code: v225["rhStatusCode"],
                  duration: v226,
                  taskId: v209,
                });
              },
              parseError: (v227) => v227?.["message"] || "生成失败",
            },
            { store: v83, startedAt: v210, abortController: v213 },
          );
          if (v217["status"] === "pending") {
            this["_persistRunningHubResumeCache"]();
            return;
          }
          this["_persistRunningHubResumeCache"]();
        } catch (v228) {
          if (
            v213?.["signal"]?.["aborted"] ||
            v228?.["message"] === "CANCELLED" ||
            v228?.["name"] === "AbortError"
          )
            return;
          (v83["updateNodeData"](this["nodeId"], {
            generationDuration: Math["max"](0, Date["now"]() - v210),
            rhStatusMessage: v228?.["message"] || "生成失败",
            rhStatusCode: Number["isFinite"](Number(v228?.["code"]))
              ? Number(v228["code"])
              : null,
            ...this["_buildRunningHubTaskPatch"]({
              taskId: v209,
              status: "failed",
              startedAt: v210,
              recovering: false,
              useOpenapiQuery: v211,
            }),
          }),
            this["_persistRunningHubResumeCache"]());
        } finally {
          v213 &&
            this["_rhResumeAbortController"] === v213 &&
            (this["_rhResumeAbortController"] = null);
          this["_rhResumeTaskId"] === v209 && (this["_rhResumeTaskId"] = "");
          this["_rhResumePromise"] = null;
          const v229 = this["_syncLocalTaskNodeData"](),
            v230 = shouldShowGenerationBusyUi(v229);
          this["_isGenerating"] = v230;
          if (v230)
            this["_rhTaskId"] = String(v229?.["rhTaskId"] || v209 || "")[
              "trim"
            ]();
          else {
            this["_rhTaskId"] = null;
            if (!this["_rhCancelRequested"]) this["_rhApiKey"] = null;
            (this["btnEl"] && resetGenerateButtonIdleUi(this["btnEl"]),
              v106(this["previewEl"]));
          }
          this["_updateSubmitButtonState"]();
        }
      })();
      this["_rhResumePromise"] = v212;
    }
    async ["_maybeResumeDreaminaTaskImpl"]() {
      const v231 =
          v83["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {},
        v232 = String(v231?.["dreaminaSubmitId"] || "")["trim"](),
        v233 = String(this["_dreaminaActiveSubmitId"] || "")["trim"]();
      if (
        this["_isGenerating"] &&
        v231?.["dreaminaTaskRecovering"] !== true &&
        v233 &&
        v233 === v232 &&
        !this["_isStaleActiveDreaminaTask"](v231)
      )
        return;
      if (!this["_isDreaminaImageNode"](v231)) {
        this["_stopDreaminaRecovery"](false);
        return;
      }
      if (!this["_isDreaminaRecoverableRunningTask"](v231)) {
        this["_stopDreaminaRecovery"](false);
        return;
      }
      if (!v232) {
        this["_stopDreaminaRecovery"](false);
        return;
      }
      if (this["_dreaminaResumeSubmitId"] === v232) return;
      this["_stopDreaminaRecovery"](false);
      const v234 = Number(
        v231?.["dreaminaTaskStartedAt"] ||
          v231?.["generationStartTime"] ||
          Date["now"](),
      );
      this["_dreaminaResumeSubmitId"] = v232;
      const v235 = (async () => {
        let v236 = null;
        try {
          const v237 = await this["_buildResumePayload"](v231);
          if (!v237) return;
          ((v236 = new AbortController()),
            (this["_dreaminaResumeAbortController"] = v236),
            (this["_isGenerating"] = true));
          this["btnEl"] && setGenerateButtonLoadingUi(this["btnEl"]);
          v105(this["previewEl"]);
          const v238 = await resumeTask(
            {
              sourceNodeId: this["nodeId"],
              targetNodeId: this["nodeId"],
              trigger: "node",
              taskType: "image-generation",
              provider: "dreamina",
              adapterType: "localRuntime",
              modelId: v237["model"] || v231?.["model"] || "",
              executionId:
                "dreamina.image." + (v237["model"] || v231?.["model"] || "cli"),
              payload: v237,
              taskId: v232,
              cancellable: false,
              resumable: true,
              pauseOnAbort: true,
              startBuilder: () =>
                this["_buildDreaminaTaskPatch"]({
                  submitId: v232,
                  status: "pending",
                  phase: "generating",
                  label:
                    String(v231?.["dreaminaTaskLabel"] || "")["trim"]() ||
                    "生成中",
                  startedAt: v234,
                  lastCheckedAt: Date["now"](),
                  recovering: true,
                  raw: v231?.["dreaminaTaskLastRaw"] || {},
                }),
              onTaskStart: () => {
                this["_persistDreaminaResumeCache"]();
              },
              pauseBuilder: (v239) =>
                this["_buildDreaminaTaskPatch"]({
                  submitId: v232,
                  status:
                    String(v231?.["dreaminaTaskStatus"] || "")["trim"]() ||
                    "pending",
                  phase:
                    String(v231?.["dreaminaTaskPhase"] || "")["trim"]() ||
                    "generating",
                  label:
                    String(v231?.["dreaminaTaskLabel"] || "")["trim"]() ||
                    "生成中",
                  startedAt: v239["startedAt"],
                  lastCheckedAt: Date["now"](),
                  recovering: false,
                  raw: v231?.["dreaminaTaskLastRaw"] || {},
                }),
              poll: async () =>
                v84["resumeDreaminaImageTask"](v232, v237, {
                  signal: v236["signal"],
                }),
              resultBuilder: async (v240, v241) => {
                const v242 = this["_getImageGenerationResultError"](v240);
                if (v242) throw new Error(v242);
                const v243 = this["_applyImageGenerationResult"](
                  v240,
                  v241["startedAt"],
                  { writeStore: false },
                );
                return {
                  ...(v243?.["patch"] || {}),
                  ...this["_buildDreaminaTaskPatch"]({
                    submitId: v232,
                    status: "success",
                    phase: "done",
                    label: "已完成",
                    startedAt: v241["startedAt"],
                    lastCheckedAt: Date["now"](),
                    recovering: false,
                    raw: {},
                  }),
                };
              },
              failureBuilder: (v244, v245) =>
                this["_buildDreaminaFailurePatch"]({
                  error: v244,
                  startedAt: v245["startedAt"],
                  submitId: v232,
                  lastCheckedAt: Date["now"](),
                  raw: {},
                }),
              cancelledBuilder: (v246) => ({
                generationDuration: Date["now"]() - v246["startedAt"],
                ...this["_buildDreaminaTaskPatch"]({
                  submitId: v232,
                  status: "pending",
                  phase: "generating",
                  label:
                    String(v231?.["dreaminaTaskLabel"] || "")["trim"]() ||
                    "生成中",
                  startedAt: v246["startedAt"],
                  lastCheckedAt: Date["now"](),
                  recovering: false,
                  raw: v231?.["dreaminaTaskLastRaw"] || {},
                }),
              }),
              parseError: (v247) => v247?.["message"] || "生成失败",
            },
            { store: v83, startedAt: v234, abortController: v236 },
          );
          if (v238["status"] === "pending") {
            this["_persistDreaminaResumeCache"]();
            return;
          }
          (v238["status"] === "failed" &&
            (this["_dreaminaActiveSubmitId"] = ""),
            this["_persistDreaminaResumeCache"]());
        } catch (v248) {
          if (
            v236?.["signal"]?.["aborted"] ||
            v248?.["message"] === "CANCELLED" ||
            v248?.["name"] === "AbortError"
          )
            return;
          this["_finalizeDreaminaImageFailure"]({
            error: v248,
            startedAt: v234,
            submitId: v232,
            lastCheckedAt: Date["now"](),
            raw: {},
          });
        } finally {
          v236 &&
            this["_dreaminaResumeAbortController"] === v236 &&
            (this["_dreaminaResumeAbortController"] = null);
          this["_dreaminaResumeSubmitId"] === v232 &&
            (this["_dreaminaResumeSubmitId"] = "");
          this["_dreaminaResumePromise"] = null;
          const v249 = this["_syncLocalTaskNodeData"](),
            v250 = shouldShowGenerationBusyUi(v249);
          ((this["_isGenerating"] = v250),
            !v250 &&
              (this["btnEl"] && resetGenerateButtonIdleUi(this["btnEl"]),
              v106(this["previewEl"])),
            this["_updateSubmitButtonState"]());
        }
      })();
      this["_dreaminaResumePromise"] = v235;
    }
    async ["_maybeResumeAsyncTaskImpl"]() {
      const v251 =
        v83["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {};
      if (this["_isGenerating"] && v251?.["asyncTaskRecovering"] !== true)
        return;
      if (!this["_isAsyncRecoverableRunningTask"](v251)) {
        const v252 = await this["_maybeFallbackRegenerateAsyncTask"](v251);
        if (v252) return;
        this["_stopAsyncRecovery"](false);
        return;
      }
      const v253 = String(v251?.["asyncTaskId"] || "")["trim"]();
      if (!v253) {
        const v254 = await this["_maybeFallbackRegenerateAsyncTask"](v251);
        if (v254) return;
        this["_stopAsyncRecovery"](false);
        return;
      }
      if (this["_asyncResumeTaskId"] === v253 && this["_asyncResumePromise"])
        return;
      this["_stopAsyncRecovery"](false);
      const v255 = Number(
          v251?.["asyncTaskStartedAt"] ||
            v251?.["generationStartTime"] ||
            Date["now"](),
        ),
        v256 = this["_inferProviderFromModel"](
          v251?.["model"],
          v251?.["asyncTaskProvider"] || v251?.["provider"] || "",
        );
      this["_asyncResumeTaskId"] = v253;
      const v257 = (async () => {
        let v258 = null;
        try {
          const v259 = await this["_buildResumePayload"](v251, {
            providerHint: v256,
          });
          if (!v259) return;
          ((v258 = new AbortController()),
            (this["_asyncResumeAbortController"] = v258),
            (this["_isGenerating"] = true));
          this["btnEl"] && setGenerateButtonLoadingUi(this["btnEl"]);
          v105(this["previewEl"]);
          const v260 = await resumeTask(
            {
              sourceNodeId: this["nodeId"],
              targetNodeId: this["nodeId"],
              trigger: "node",
              taskType: "image-generation",
              provider: v256 || v259["provider"] || v251?.["provider"] || "",
              adapterType: "modelApi",
              modelId: v259["model"] || v251?.["model"] || "",
              executionId:
                (v256 || v259["provider"] || "model") + ".image.async",
              payload: v259,
              taskId: v253,
              async: true,
              cancellable: false,
              resumable: true,
              pauseOnAbort: true,
              startBuilder: () =>
                this["_buildAsyncTaskPatch"]({
                  provider: v256,
                  kind: "image",
                  taskId: v253,
                  status: "running",
                  startedAt: v255,
                  recovering: true,
                }),
              onTaskStart: () => {
                this["_persistAsyncResumeCache"]();
              },
              poll: async () =>
                v84["resumeAsyncImageTask"](v253, v259, {
                  signal: v258["signal"],
                }),
              resultBuilder: async (v261, v262) => {
                const v263 = this["_getImageGenerationResultError"](v261);
                if (v263) throw new Error(v263);
                const v264 = this["_applyImageGenerationResult"](
                  v261,
                  v262["startedAt"],
                  { writeStore: false },
                );
                return {
                  ...(v264?.["patch"] || {}),
                  ...this["_buildAsyncTaskPatch"]({
                    provider: v256,
                    kind: "image",
                    taskId: v253,
                    status: "success",
                    startedAt: v262["startedAt"],
                    recovering: false,
                  }),
                };
              },
              failureBuilder: (v265, v266) => ({
                ...buildImageGenerationFailurePatch({
                  error: v265?.["message"] || "生成失败",
                  startedAt: v266["startedAt"],
                }),
                ...this["_buildAsyncTaskPatch"]({
                  provider: v256,
                  kind: "image",
                  taskId: v253,
                  status: "failed",
                  startedAt: v266["startedAt"],
                  recovering: false,
                }),
              }),
              cancelledBuilder: (v267) => ({
                images: [],
                imageUrl: "",
                src: "",
                localPath: "",
                generationDuration: Date["now"]() - v267["startedAt"],
                ...this["_buildAsyncTaskPatch"]({
                  provider: v256,
                  kind: "image",
                  taskId: v253,
                  status: "cancelled",
                  startedAt: v267["startedAt"],
                  recovering: false,
                }),
              }),
              parseError: (v268) => v268?.["message"] || "生成失败",
            },
            { store: v83, startedAt: v255, abortController: v258 },
          );
          if (v260["status"] === "pending") {
            this["_persistAsyncResumeCache"]();
            return;
          }
          this["_persistAsyncResumeCache"]();
        } catch (v269) {
          if (
            v258?.["signal"]?.["aborted"] ||
            v269?.["message"] === "CANCELLED" ||
            v269?.["name"] === "AbortError"
          )
            return;
          (v83["updateNodeData"](this["nodeId"], {
            generationDuration: Math["max"](0, Date["now"]() - v255),
            ...this["_buildAsyncTaskPatch"]({
              provider: v256,
              kind: "image",
              taskId: v253,
              status: "failed",
              startedAt: v255,
              recovering: false,
            }),
          }),
            this["_persistAsyncResumeCache"]());
        } finally {
          v258 &&
            this["_asyncResumeAbortController"] === v258 &&
            (this["_asyncResumeAbortController"] = null);
          this["_asyncResumeTaskId"] === v253 &&
            (this["_asyncResumeTaskId"] = "");
          this["_asyncResumePromise"] = null;
          const v270 = this["_syncLocalTaskNodeData"](),
            v271 = shouldShowGenerationBusyUi(v270);
          ((this["_isGenerating"] = v271),
            !v271 &&
              (this["btnEl"] && resetGenerateButtonIdleUi(this["btnEl"]),
              v106(this["previewEl"])),
            this["_updateSubmitButtonState"]());
        }
      })();
      this["_asyncResumePromise"] = v257;
    }
    async ["_buildPayload"](v272 = null) {
      const v273 = v83["getState"](),
        v274 = v83["getIncomingEdges"](this["nodeId"]),
        v275 = v273["nodes"] || {},
        v276 = getTargetInputPolicy(
          v275?.[this["nodeId"]] || this["_data"] || {},
        ),
        v277 = getFixedInputSlotConfigFromManifest(
          v275?.[this["nodeId"]] || this["_data"] || {},
        ),
        v278 = getImageNodeInputGate(this["_data"]?.["model"]),
        v279 = String(v278["kind"] || "")["trim"](),
        v280 = Number(v278["max"]),
        v281 = isRhPersonReplaceWorkflowModel(this["_data"]?.["model"]),
        v282 = isRhQwenImageEditModel(this["_data"]?.["model"]),
        v283 = getModelManifest(this["_data"]?.["model"])?.["inputSlots"],
        v284 = Math["max"](0, Number(v283?.["maxByKind"]?.["image"]) || 0),
        v285 = v284 || 3,
        v286 = getImageInputGateUploadedUrl(this["_data"], v278),
        v287 = { text: [], image: [], video: [], audio: [] },
        v288 = { text: 0, image: 0, video: 0, audio: 0 },
        v289 = new Map();
      for (const v290 of v274) {
        const v291 = v275[v290["sourceId"]];
        if (!v291) continue;
        const v292 = resolveEffectiveInputKind(v291, v290);
        if (!v292) continue;
        if (!isInputKindAllowed(v276, v292)) continue;
        if (v279 && v292 !== v279) continue;
        if (v279 && Number["isFinite"](v280) && v288[v279] >= v280) continue;
        if (v281 && v292 !== "image") continue;
        if (v281 && v288["image"] >= 2) continue;
        if (v282 && v292 !== "image") continue;
        if (v282 && v288["image"] >= v285) continue;
        let v293 = "",
          v294 = "";
        if (v292 === "text") {
          v293 = (v291["outputText"] ||
            v291["text"] ||
            v291["content"] ||
            v291["prompt"] ||
            v291["label"] ||
            "")["trim"]();
          if (!v293) continue;
        } else {
          v292 === "image" && (v294 = resolveGenerationInputImageUrl(v291));
          if (!v294 && v291["sourceId"]) {
            const v295 = await v101(v291["sourceId"]);
            if (v295) v294 = URL["createObjectURL"](v295);
          }
          if (!v294)
            v294 = v291["src"] || v291["imageUrl"] || v291["thumbUrl"] || "";
          if (!v294) continue;
        }
        v288[v292]++;
        const v296 = {
            text: "文本",
            image: "图片",
            video: "视频",
            audio: "音频",
          },
          v297 = "@" + v296[v292] + v288[v292],
          v298 = v292 === "image" ? String(v291["mask"] || "") : "",
          v299 = v298["trim"](),
          v300 =
            v292 === "image" && v299
              ? v299["startsWith"]("/")
                ? v299
                : "/" + v299["replace"](/^\//, "")
              : "";
        if (v292 === "image" && v300) v289["set"](v294, v300);
        v287[v292]["push"]({
          label: v297,
          content: v293,
          url: v294,
          maskUrl: v300,
          used: false,
          sourceId: v290["sourceId"],
          refSlot: v290["refSlot"] || "",
        });
      }
      const v301 = [
          ...v287["text"],
          ...v287["image"],
          ...v287["video"],
          ...v287["audio"],
        ],
        v302 = {};
      v301["forEach"]((v303) => {
        v302[v303["label"]["replace"](/\s+/g, "")] = v303;
      });
      const v304 = {};
      v301["forEach"]((v305) => {
        if (v305["sourceId"]) v304[v305["sourceId"]] = v305;
      });
      let v306 = [];
      const v307 = [],
        v308 = { image: 0, video: 0, audio: 0 },
        v309 = v275?.[this["nodeId"]] || this["_data"] || {},
        v310 = getPromptAssetInputRefsFromNode(v309, {
          allowedTypes: ["image"],
        }),
        v311 = () =>
          (v287["image"] || [])["some"]((v312) => !!v312["url"]) ||
          v306["some"](Boolean) ||
          v307["some"]((v313) => v313["type"] === "image" && v313["url"]) ||
          v310["some"]((v314) => {
            const v315 = resolveEffectiveInputKind(v314) || v314["type"];
            return v315 === "image" && !!v314["url"];
          }),
        v316 = (v317) => {
          let v318 = "";
          const v319 = (v320) => {
            for (const v321 of v320["childNodes"]) {
              if (v321["nodeType"] === Node["TEXT_NODE"])
                v318 += v321["textContent"];
              else {
                if (v321["nodeType"] === Node["ELEMENT_NODE"]) {
                  if (v321["classList"]["contains"]("ref-pill")) {
                    const v322 = v321["dataset"]["nodeId"] || "",
                      v323 =
                        v321["dataset"]["label"] ||
                        v321["textContent"]["trim"](),
                      v324 = [];
                    if (
                      appendAssetMentionToPrompt({
                        domNode: v321,
                        rawLabel: v323,
                        promptParts: v324,
                        inputRefs: v307,
                        mediaCounts: v308,
                        allowedTypes: ["text", "image"],
                      })
                    ) {
                      ((v318 += v324["join"]("")),
                        v307["forEach"]((v325) => {
                          v325["type"] === "image" &&
                            v325["url"] &&
                            !v306["includes"](v325["url"]) &&
                            v306["push"](v325["url"]);
                        }));
                      continue;
                    }
                    const v326 = v323["replace"](/\s+/g, ""),
                      v327 = (v322 && v304[v322]) || v302[v326];
                    if (v327) {
                      v327["used"] = true;
                      if (v327["content"])
                        v318 += "\x20" + v327["content"] + "\x20";
                      else {
                        if (v327["url"]) {
                          v318 += "\x20" + v323 + "\x20";
                          if (!v281 && !v306["includes"](v327["url"]))
                            v306["push"](v327["url"]);
                        }
                      }
                    } else v318 += "\x20" + v323 + "\x20";
                  } else
                    v321["tagName"] === "BR" ? (v318 += "\x0a") : v319(v321);
                }
              }
            }
          };
          v319(v317);
          let v328 = v318["replace"](/[\s\u00A0\u200B-\u200D\uFEFF]+/g, "\x20")[
            "trim"
          ]();
          if (v272) {
            let v329 = v328;
            if (requiresPromptPresetInput(v272)) {
              const v330 = [];
              (v287["text"]["forEach"]((v331) => {
                const v332 = new RegExp(
                  v331["label"]
                    ["replace"](/[.*+?^${}()|[\]\\]/g, "\x5c$&")
                    ["replace"](/\s+/g, "[\\s\\u00A0]*"),
                  "g",
                );
                !v331["used"] &&
                  v331["content"] &&
                  !v332["test"](v328) &&
                  (v330["push"](v331["content"]), (v331["used"] = true));
              }),
                (v329 = [...v330, v328]
                  ["filter"](Boolean)
                  ["join"]("\x0a")
                  ["trim"]()));
            }
            v328 = resolvePromptPresetTemplate(v272, v329, {
              hasImageInput: v311,
            });
          } else v328 = v328 || "";
          return v328;
        };
      let v333 = v316(this["promptEl"]);
      v301["forEach"]((v334) => {
        if (!v334["used"]) {
          const v335 = new RegExp(
            v334["label"]
              ["replace"](/[.*+?^${}()|[\]\\]/g, "\\$&")
              ["replace"](/\s+/g, "[\x5cs\x5cu00A0]*"),
            "g",
          );
          if (v335["test"](v333)) {
            v334["used"] = true;
            if (v334["content"])
              v333 = v333["replace"](v335, "\x20" + v334["content"] + "\x20");
            else {
              if (v334["url"]) {
                v333 = v333["replace"](
                  v335,
                  "\x20" + v334["label"]["trim"]() + "\x20",
                );
                if (!v281 && !v306["includes"](v334["url"]))
                  v306["push"](v334["url"]);
              }
            }
          }
        }
      });
      let v336 = "";
      v287["text"]["forEach"]((v337) => {
        !v337["used"] &&
          v337["content"] &&
          ((v336 += v337["content"] + "\x0a"), (v337["used"] = true));
      });
      v336 && (v333 = v336 + v333);
      !v281 &&
        v301["forEach"]((v338) => {
          !v338["used"] &&
            v338["url"] &&
            !v306["includes"](v338["url"]) &&
            v306["push"](v338["url"]);
        });
      requiresPromptPresetInput(v272) &&
        v310["forEach"]((v339) => {
          const v340 = resolveEffectiveInputKind(v339) || v339["type"];
          v340 === "image" &&
            v339["url"] &&
            !v306["includes"](v339["url"]) &&
            v306["push"](v339["url"]);
        });
      v306 = reorderImageInputUrlsByRefOrder(v306, v287["image"]);
      if (v279 === "image") {
        if (v286) v306 = [v286];
        else Number["isFinite"](v280) && (v306 = v306["slice"](0, v280));
      }
      if (v281) {
        const v341 = ["replaceTarget", "replacedImage"],
          v342 = v287["image"] || [],
          v343 = (v344) =>
            String(
              v342["find"]((v345) => String(v345["refSlot"] || "") === v344)?.[
                "url"
              ] || "",
            ),
          v346 = String(v342[0]?.["url"] || ""),
          v347 = String(
            v342["find"]((v348) => String(v348["url"] || "") !== v346)?.[
              "url"
            ] || "",
          ),
          v349 = v343(v341[0]) || v346,
          v350 = v343(v341[1]) || v347;
        v306 = [v349, v350]["filter"](Boolean);
      }
      v282 && (v306 = v306["filter"](Boolean)["slice"](0, v285));
      const v351 = v281
          ? {}
          : buildInputUrlsByFixedImageSlot({
              fixedInputConfig: v277,
              imageRefs: v287["image"],
              assetInputRefs: v307,
            }),
        v352 =
          this["_data"]["generationParams"] &&
          typeof this["_data"]["generationParams"] === "object" &&
          !Array["isArray"](this["_data"]["generationParams"])
            ? this["_data"]["generationParams"]
            : {},
        v353 =
          normalizeDreaminaImageModel(
            this["_data"]["model"],
            this["_data"]["provider"],
          ) || this["_data"]["model"],
        v354 = getModelManifest(v353);
      if (!v354)
        throw new Error("Missing model manifest: " + this["_data"]["model"]);
      const v355 = sanitizeTaskGenerationParams(v353, v352),
        v356 = v354["adapterType"] === "modelApi",
        v357 = Array["isArray"](v354?.["uiSchema"]?.["fields"])
          ? v354["uiSchema"]["fields"]
          : [],
        {
          getManifestField: v358,
          readSchemaParam: v359,
          requireSchemaParam: v360,
        } = createSchemaParamAccess({
          model: v353,
          data: this["_data"],
          generationParams: v355,
          manifestFields: v357,
        }),
        v361 = v358("imageSize") ? v360("imageSize") : undefined,
        v362 = v358("aspectRatio") ? v360("aspectRatio") : "自适应",
        v363 = v358("batchSize") ? v360("batchSize") : 1,
        v364 =
          v356 && v358("google_image_search")
            ? normalizeTaskBooleanParam(v359("google_image_search"))
            : undefined,
        v365 =
          v356 && v358("google_search")
            ? normalizeTaskBooleanParam(v359("google_search")) || v364 === true
            : undefined,
        v366 = buildModelApiSchemaPayloadParams({
          isModelApiManifest: v356,
          manifestFields: v357,
          readSchemaParam: v359,
        });
      let v367 = v353 || "nano-banana-2";
      const v368 = v356 ? v359("mode") : undefined,
        v369 = v359("rhModelRoute"),
        v370 = resolveNanoBananaSelectionFromModel(
          v367,
          v361 || "2K",
          this["_data"]["provider"],
        );
      if (v370) {
        if (!v356 && v368 !== undefined)
          v367 = resolveNanoBananaModelBySelection({
            family: v370["family"],
            mode: v368,
            imageSize: v361 || "2K",
            provider: v370["provider"] || this["_data"]["provider"],
          });
        else !v356 && (v367 = v370["model"]);
      }
      isDreaminaImageModel(v367, this["_data"]["provider"]) &&
        (v367 =
          normalizeDreaminaImageModel(v367, this["_data"]["provider"]) ||
          getDefaultDreaminaImageModelId());
      const v371 = this["_inferProviderFromModel"](
          v367,
          this["_data"]["provider"],
        ),
        v372 = resolveImageSizeForProviderModel({
          provider: v371,
          model: v367,
          imageSize: v361,
        });
      !getModelManifest(v367) &&
        (v367 = resolveGrsaiGptImage2ModelForSize({
          provider: v371,
          model: v367,
          imageSize: v372,
        }));
      const v373 = isRunningHubWorkflowNode({
        ...this["_data"],
        model: v367,
        provider: v371,
      });
      if (v373) {
        const v374 = v275?.[this["nodeId"]] || this["_data"] || {};
        getPromptAssetInputRefsFromNode(v374, { allowedTypes: ["image"] })[
          "forEach"
        ]((v375) => {
          if (resolveEffectiveInputKind(v375) !== "image") return;
          if (v375["url"] && !v306["includes"](v375["url"]))
            v306["push"](v375["url"]);
        });
      }
      if (v371 === "dreamina") {
        const v376 = [],
          v377 = (v378) => {
            const v379 = String(v378 || "")["trim"]();
            if (!v379 || v379["startsWith"]("blob:")) return;
            if (!v376["includes"](v379)) v376["push"](v379);
          };
        ((v287["image"] || [])["forEach"]((v380) => {
          const v381 = v275?.[v380?.["sourceId"]] || null,
            v382 = v381 ? resolveGenerationInputImageUrl(v381) : "";
          (v377(v382), v377(v380?.["url"]));
        }),
          (v306 = v376["slice"](0, 1)));
      }
      const v383 = v306["map"]((v384) => String(v289["get"](v384) || ""));
      if (v279 === "image" && v306["length"] === 0)
        return (
          window["showToast"]?.(
            getImageInputGateMissingMessage(v278) ||
              "请先添加至少一张参考图再生成",
            "warn",
          ),
          null
        );
      if (v281 && v306["length"] < 2)
        return (
          window["showToast"]?.("请先添加两张图片：替换目标、被替换图", "warn"),
          null
        );
      if (v282 && v306["length"] < 1)
        return (
          window["showToast"]?.("请先添加至少一张参考图再生成", "warn"),
          null
        );
      const v385 = getPromptPresetTemplateEmptyInputMessage(v272);
      if (v385 && !v333 && v306["length"] === 0)
        return (window["showToast"]?.(v385, "warn"), null);
      if (!v373 && !v333 && v306["length"] === 0)
        return (
          console["warn"]("[AIGenerateNode]\x20prompt\x20为空，跳过生成"),
          window["showToast"]?.("请输入提示词或添加参考素材", "warn"),
          null
        );
      await v112();
      const v386 = v113(v371);
      let v387 = "";
      if (v371 === "runninghub")
        v387 = isModelApiModel(v367, v371)
          ? v386["modelApiKey"] || ""
          : v386["apiKey"] || "";
      else
        v371 === "runninghubwf"
          ? (v387 = v386["apiKey"] || "")
          : (v387 = v386["apiKey"] || window["_appApiKey"] || "");
      let v388 = String(window["__aicInstallId"] || "")["trim"]();
      if (typeof window["ensureSubscriptionInstallId"] === "function")
        try {
          v388 = String(await window["ensureSubscriptionInstallId"]())[
            "trim"
          ]();
        } catch {}
      const v389 = String(v362 || "自适应")["trim"](),
        v390 = isAdaptiveRatioLabel(v389),
        v391 = v274["filter"]((v392) => {
          const v393 = String(v392?.["refSlot"] || "")["toLowerCase"]();
          if (v393["includes"]("mask")) return false;
          const v394 = v275?.[v392?.["sourceId"]];
          return resolveEffectiveInputKind(v394, v392) === "image";
        }),
        v395 = pickGenerationRatioSourceEdge(
          v391,
          v275?.[this["nodeId"]] || this["_data"] || {},
        );
      let v396 = 0,
        v397 = 0;
      if (v395?.["sourceId"]) {
        const v398 = v395["sourceId"],
          v399 = getGenerationRatioSizeWithDom({
            nodeId: v398,
            nodeData: v275[v398],
            edge: v395,
            includeNodeFrame: true,
          });
        v399 && ((v396 = v399["width"]), (v397 = v399["height"]));
      }
      const v400 = v275?.[this["nodeId"]] || {},
        v401 = resolveAdaptiveSourceSize({
          displayWidth: Number(
            v400?.["width"] || this["_data"]?.["width"] || 0,
          ),
          displayHeight: Number(
            v400?.["height"] || this["_data"]?.["height"] || 0,
          ),
          inputWidth: v396,
          inputHeight: v397,
        }),
        v402 =
          v390 && v396 > 0 && v397 > 0
            ? { width: v396, height: v397, source: "input-media" }
            : v401,
        v403 =
          v371 === "dreamina" ? normalizeDreaminaImageAspectRatio(v389) : v389,
        v404 = parseRatioLabel(v403)?.["label"] || "",
        v405 = v372,
        v406 =
          v390 &&
          (shouldUseGrsaiNanoBananaApiAuto({ provider: v371, model: v367 }) ||
            shouldUseApimartSeedreamApiAuto({
              provider: v371,
              model: v367,
              hasInputImages: v306["length"] > 0,
            })),
        v407 = v390
          ? v406
            ? "auto"
            : pickClosestRatioForProviderModel({
                provider: v371,
                model: v367,
                width: v402["width"],
                height: v402["height"],
                imageSize: v405,
              })
          : pickClosestRatioForProviderModel({
              provider: v371,
              model: v367,
              ratioLabel: v404 || v403 || "1:1",
              imageSize: v405,
            }),
        v408 = v406
          ? { resolvedRatioLabel: "auto" }
          : resolveProviderRatioPayload({
              provider: v371,
              model: v367,
              ratioLabel: v407,
              imageSize: v405,
            }),
        v409 = getRatioCapability(v371, v367),
        v410 = v409 === "none",
        v411 =
          v371 === "dreamina"
            ? normalizeDreaminaImageSize(v361 || "2K")
            : v282 && String(v372)["toUpperCase"]() === "4K"
              ? "2K"
              : v372,
        v412 =
          v371 === "dreamina" ? getDreaminaImageModelVersion(v367, v371) : "";
      return {
        prompt: v333,
        model: v367,
        aspectRatio: v408["resolvedRatioLabel"],
        resolvedRatioLabel: v408["resolvedRatioLabel"],
        adaptiveSource: v402["source"],
        ratioCapability: v409,
        imageSize: v411,
        modelVersion: v412,
        ...v366,
        ...(v368 !== undefined ? { mode: v368 } : {}),
        ...(v369 !== undefined ? { rhModelRoute: v369 } : {}),
        ...(v365 !== undefined ? { google_search: v365 } : {}),
        ...(v364 !== undefined ? { google_image_search: v364 } : {}),
        batchSize: parseInt(v363) || 1,
        inputUrls: v306,
        ...(Object["keys"](v351)["length"] > 0
          ? { inputUrlsBySlot: v351 }
          : {}),
        inputMaskUrls: v383,
        apiKey: v387,
        installId: v388,
        rhResolution: v359("rhResolution") ?? v359("rhAnimeRealResolution"),
        rhAnimeRealResolution: v359("rhAnimeRealResolution"),
        rhInstanceType: v359("rhInstanceType"),
        rhQwenEditMode: v282
          ? String(v359("rhQwenEditMode") || "")["trim"]()
          : undefined,
        rhQwenFirstImageMode: v282
          ? String(v359("rhQwenFirstImageMode") || "")["trim"]()
          : undefined,
        provider: v371,
        cameraAngle: this["_data"]["cameraAngle"] || null,
        ratioNotice: v408["notice"] || "",
        ...(v410 ? { suppressAspectRatio: true } : {}),
      };
    }
    async ["_handleGenerateOrCancel"](v413 = null) {
      const v414 =
          v83["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {},
        v415 = this["_isRunninghubWorkflowModel"](
          v414?.["model"],
          v414?.["provider"],
        );
      if (
        shouldAllowCancel(v414, {
          cancellable: v415,
          cancelInFlight: this["_rhCancelInFlight"] === true,
        })
      ) {
        await this["_cancelRunningHubWorkflowTask"]();
        return;
      }
      await this["_onGenerate"](v413);
    }
    ["_buildRunningHubCancelResultPatch"]({
      latest: latest = {},
      message: message = "生成已中断",
      code: code = null,
      duration: duration = null,
      taskId: taskId = "",
    } = {}) {
      const v416 = Number(
          latest?.["rhTaskStartedAt"] || latest?.["generationStartTime"] || 0,
        ),
        v417 = String(message || "生成已中断")["trim"]() || "生成已中断",
        v418 =
          code === null || code === undefined || code === ""
            ? null
            : Number(code);
      return {
        rhStatusMessage: v417,
        rhStatusCode: Number["isFinite"](v418) ? v418 : null,
        images: [],
        imageUrl: "",
        thumbUrl: "",
        localPath: "",
        ...buildGenerationCancelledPatch({
          startedAt: v416,
          duration: duration,
        }),
        ...this["_buildRunningHubTaskPatch"]({
          taskId: taskId,
          status: "cancelled",
          startedAt: v416,
          recovering: false,
          useOpenapiQuery: latest?.["rhTaskUseOpenapiQuery"] === true,
        }),
      };
    }
    async ["_cancelRunningHubWorkflowTask"]() {
      const v419 =
          v83["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {},
        v420 = this["_rhApiKey"] || "",
        v421 =
          String(this["_rhTaskId"] || "")["trim"]() ||
          String(v419?.["rhTaskId"] || "")["trim"](),
        v422 = Date["now"](),
        v423 = Number(v419?.["generationStartTime"]),
        v424 =
          v419?.["generationDuration"] != null
            ? v419["generationDuration"]
            : Number["isFinite"](v423) && v423 > 0
              ? Math["max"](0, v422 - v423)
              : 0;
      this["_rhCancelRequested"] = true;
      if (this["_rhCancelInFlight"]) return;
      this["_rhAbortController"] &&
        !this["_rhAbortController"]["signal"]["aborted"] &&
        this["_rhAbortController"]["abort"]();
      const v425 = !v420,
        v426 = !v421;
      try {
        this["_rhCancelInFlight"] = true;
        const v427 = ({ remoteResult: v428, remoteError: v429 }) => {
          const v430 = Number(v428?.["code"]),
            v431 = String(v428?.["msg"] || v428?.["message"] || "")["trim"](),
            v432 = v425
              ? "取消失败：缺少\x20API\x20Key"
              : v426
                ? "生成已中断：任务尚未返回 ID"
                : "",
            v433 =
              v432 ||
              (v429
                ? v429["message"] || "取消失败"
                : v430 === 0
                  ? v431 || "取消成功"
                  : v430 === 807
                    ? v431 || "任务不存在"
                    : v431 || "取消失败");
          return this["_buildRunningHubCancelResultPatch"]({
            latest: v419,
            message: v433,
            code: v426 ? 813 : v430,
            duration: v424,
          });
        };
        (await cancelTask(this["nodeId"], {
          store: v83,
          taskId: v421,
          cancellable: true,
          cancel: ({ taskId: v434 }) => {
            if (!v420) throw new Error("取消失败：缺少 API Key");
            return v84["cancelRunningHubWorkflowTask"]({
              apiKey: v420,
              taskId: v434,
            });
          },
          cancelledBuilder: v427,
          spec: {
            sourceNodeId: this["nodeId"],
            targetNodeId: this["nodeId"],
            trigger: "node",
            taskType: "image-generation",
            provider: v419?.["provider"] || "runninghubwf",
            adapterType: "workflow",
            modelId: v419?.["model"] || "",
            executionId: "runninghub.image." + (v419?.["model"] || "workflow"),
            payload: v419,
            cancellable: true,
            resumable: true,
            resultBuilder: () => ({}),
            cancelledBuilder: v427,
          },
        }),
          this["_persistRunningHubResumeCache"]());
        const v435 = v83["getState"]()["nodes"]?.[this["nodeId"]] || {},
          v436 = Number(v435?.["rhStatusCode"]),
          v437 = String(v435?.["rhStatusMessage"] || "")["trim"]();
        if (!v425 && !v426) {
          if (v436 === 0) window["showToast"]?.("已取消任务", "success");
          else {
            if (v437) window["showToast"]?.(v437, "error");
          }
        }
      } finally {
        ((this["_rhCancelInFlight"] = false),
          (this["_isGenerating"] = false),
          (this["_rhAbortController"] = null),
          (this["_rhTaskId"] = null),
          (this["_rhApiKey"] = null),
          this["btnEl"] &&
            (resetGenerateButtonIdleUi(this["btnEl"]),
            this["_updateSubmitButtonState"]()),
          v106(this["previewEl"]));
      }
    }
    ["_getPreviewGenerateButtonLoadingOptions"]() {
      return createPreviewGenerateButtonCallbacks(this, "生成");
    }
    async ["_collectComfyImageBindings"](config) {
      const imageFields = getImageFields(config);
      if (!imageFields.length) return [];
      const v273 = v83["getState"](),
        v274 = v83["getIncomingEdges"](this["nodeId"]),
        v275 = v273["nodes"] || {},
        bindings = [];
      const urls = [];
      for (const v290 of v274) {
        const v291 = v275[v290["sourceId"]];
        if (!v291) continue;
        if (resolveEffectiveInputKind(v291, v290) !== "image") continue;
        let v294 = resolveGenerationInputImageUrl(v291);
        if (!v294) v294 = v291["src"] || v291["imageUrl"] || v291["thumbUrl"] || "";
        if (v294) urls.push(v294);
      }
      const v309 = v275?.[this["nodeId"]] || this["_data"] || {};
      getPromptAssetInputRefsFromNode(v309, { allowedTypes: ["image"] }).forEach((ref) => {
        if (ref?.url) urls.push(ref.url);
      });
      imageFields.forEach((field, index) => {
        const url = urls[index] || urls[0] || "";
        if (!url) return;
        bindings.push({ fieldId: field.id, node: field.node, url });
      });
      return bindings;
    }
    async ["_onGenerateComfyui"](v438 = null, v439 = {}) {
      if (v439?.["insertPrompt"] === true) return;
      if (shouldUsePromptPreviewForPreset(v438)) return;
      if (isPreviewModeEnabled()) {
        !isPreviewNodeLoading(this["nodeId"]) &&
          startPreviewNodeLoading(
            this["nodeId"],
            this["previewEl"],
            this["_getPreviewGenerateButtonLoadingOptions"](),
          );
        return;
      }
      const workflowName = String(this["_data"]?.["comfyWorkflow"] || "").trim();
      if (!workflowName) {
        window["showToast"]?.("请先选择 ComfyUI 工作流", "warn");
        return;
      }
      const nodeData =
        v83["getState"]?.()?.["nodes"]?.[this["nodeId"]] || this["_data"] || {};
      const config = await ensureComfyWorkflowConfig(workflowName);
      const bundle = await loadComfyWorkflowBundle(workflowName);
      const workflow = bundle?.workflow || null;
      const promptText = String(
        this["promptEl"]?.["innerText"] || this["promptEl"]?.["textContent"] || "",
      ).trim();
      const footerParams = readComfyFooterParams(this["footerEl"]);
      const comfyParams = applyComfyQualityRatioToParams({
        config,
        workflow,
        nodeData,
        comfyParams: {
          ...(nodeData?.["comfyParams"] || {}),
          ...footerParams,
        },
      });
      const imageBindings = await this["_collectComfyImageBindings"](config);
      const { params, imageInputs } = buildComfyParams({
        config,
        workflow,
        nodeData,
        comfyParams,
        promptText,
        imageBindings,
      });
      const startedAt = Date.now();
      v83["updateNodeData"](
        this["nodeId"],
        buildGenerationStartPatch({ startedAt, label: "ComfyUI 生成中" }),
      );
      this["_isGenerating"] = true;
      this["btnEl"] && setGenerateButtonLoadingUi(this["btnEl"]);
      try {
        const result = await generateComfyuiImage({
          workflow: workflowName,
          params,
          imageInputs,
          type: "comfyui-image",
        });
        const images = Array.isArray(result?.images) ? result.images : [];
        if (!images.length) {
          throw new Error("ComfyUI 未返回图片");
        }
        this["_applyImageGenerationResult"](
          {
            images: images.map((url) => ({ url, imageUrl: url, sourceUrl: url })),
          },
          startedAt,
        );
        v83["updateNodeData"](this["nodeId"], {
          comfyParams: stripComfyAutoDimensionParams(comfyParams, config, workflow),
          generationState: "success",
        });
      } catch (err) {
        v83["updateNodeData"](
          this["nodeId"],
          buildGenerationCancelledPatch({
            startedAt,
            error: err?.message || String(err),
          }),
        );
        window["showToast"]?.(err?.message || "ComfyUI 生成失败", "warn");
      } finally {
        this["_isGenerating"] = false;
        this["btnEl"] && resetGenerateButtonIdleUi(this["btnEl"]);
        this["_updateSubmitButtonState"]?.();
      }
    }
    async ["_onGenerate"](v438 = null, v439 = {}) {
      if (this["_isGenerating"]) return;
      if (isComfyuiEngine(this["_data"])) {
        return this["_onGenerateComfyui"](v438, v439);
      }
      if (v439?.["insertPrompt"] === true) {
        (insertPresetPromptIntoEditor({
          storeApi: v83,
          nodeId: this["nodeId"],
          promptEl: this["promptEl"],
          template: v438,
          inEdges: v83["getIncomingEdges"](this["nodeId"]),
          nodes: v83["getState"]()["nodes"] || {},
          allowedAssetTypes: ["text", "image"],
        }),
          this["_updateSubmitButtonState"]?.());
        return;
      }
      if (shouldUsePromptPreviewForPreset(v438)) {
        const v440 = await this["_buildPayload"](v438);
        if (!v440) return;
        previewPresetPromptInEditor({
          storeApi: v83,
          nodeId: this["nodeId"],
          promptEl: this["promptEl"],
          promptText: v440["prompt"],
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
      const v441 = await this["_buildPayload"](v438);
      if (!v441) return;
      const v442 = getImageProviderApiKeyMissingMessage(v441);
      if (v442) {
        window["showToast"]?.(v442, "warn");
        return;
      }
      const v443 = this["_isRunninghubTaskModel"](
          v441["model"],
          v441["provider"],
        ),
        v444 = this["_isRunninghubWorkflowModel"](
          v441["model"],
          v441["provider"],
        ),
        v445 = this["_isDreaminaImageNode"](v441),
        v446 = this["_inferProviderFromModel"](
          v441?.["model"],
          v441?.["provider"] || this["_data"]?.["provider"] || "",
        ),
        v447 = !v443 && !v445 && isAsyncImageModelApiProvider(v446),
        v448 =
          resolveModelProvider(v441?.["model"], v441?.["provider"], {
            allowProviderHint: false,
          }) === "runninghub" && isModelApiModel(v441?.["model"], "runninghub"),
        v449 = shouldUseImageWorkflowBusyButton(v441["model"]);
      v443 && this["_stopRunningHubRecovery"](true);
      v445 && this["_stopDreaminaRecovery"](true);
      v447 && this["_stopAsyncRecovery"](true);
      this["_rhCancelRequested"] = false;
      const v450 = v443 || v445 || v447;
      ((this["_rhApiKey"] = v443 ? v441["apiKey"] : null),
        (this["_rhTaskId"] = null),
        (this["_rhAbortController"] = v450 ? new AbortController() : null),
        (this["_isGenerating"] = true));
      this["btnEl"] &&
        (v444
          ? setGenerateButtonCancellableUi(this["btnEl"], { busy: v449 })
          : setGenerateButtonLoadingUi(this["btnEl"]));
      v105(this["previewEl"]);
      const v451 = Date["now"](),
        v452 = {
          ...buildGenerationStartPatch({ startedAt: v451 }),
          rhStatusMessage: null,
          rhStatusCode: null,
        };
      v443 &&
        (Object["assign"](
          v452,
          this["_buildRunningHubTaskPatch"]({
            taskId: "",
            status: "pending",
            startedAt: v451,
            recovering: false,
            useOpenapiQuery: v448,
          }),
        ),
        Object["assign"](v452, {
          ...this["_buildDreaminaTaskPatch"]({
            submitId: "",
            status: "idle",
            phase: "done",
            label: "",
            startedAt: 0,
            lastCheckedAt: 0,
            recovering: false,
            raw: {},
          }),
          ...this["_buildAsyncTaskPatch"]({
            provider: "",
            kind: "image",
            taskId: "",
            status: "idle",
            startedAt: 0,
            recovering: false,
          }),
        }));
      v445 &&
        (Object["assign"](
          v452,
          this["_buildDreaminaTaskPatch"]({
            submitId: "",
            status: "pending",
            phase: "generating",
            label: "提交中",
            startedAt: v451,
            lastCheckedAt: 0,
            recovering: false,
            raw: {},
          }),
        ),
        Object["assign"](v452, {
          ...this["_buildRunningHubTaskPatch"]({
            taskId: "",
            status: "idle",
            startedAt: 0,
            recovering: false,
            useOpenapiQuery: false,
          }),
          ...this["_buildAsyncTaskPatch"]({
            provider: "",
            kind: "image",
            taskId: "",
            status: "idle",
            startedAt: 0,
            recovering: false,
          }),
        }));
      v447 &&
        (Object["assign"](
          v452,
          this["_buildAsyncTaskPatch"]({
            provider: v446,
            kind: "image",
            taskId: "",
            status: "pending",
            startedAt: v451,
            recovering: false,
          }),
        ),
        Object["assign"](v452, {
          ...this["_buildRunningHubTaskPatch"]({
            taskId: "",
            status: "idle",
            startedAt: 0,
            recovering: false,
            useOpenapiQuery: false,
          }),
          ...this["_buildDreaminaTaskPatch"]({
            submitId: "",
            status: "idle",
            phase: "done",
            label: "",
            startedAt: 0,
            lastCheckedAt: 0,
            recovering: false,
            raw: {},
          }),
        }));
      !v443 &&
        !v445 &&
        !v447 &&
        Object["assign"](v452, {
          ...this["_buildAsyncTaskPatch"]({
            provider: "",
            kind: "image",
            taskId: "",
            status: "idle",
            startedAt: 0,
            recovering: false,
          }),
        });
      v452["ratioNotice"] = String(v441?.["ratioNotice"] || "");
      let v453 = null;
      try {
        v453 = await submitTask(
          {
            sourceNodeId: this["nodeId"],
            targetNodeId: this["nodeId"],
            trigger: "node",
            taskType: "image-generation",
            provider:
              v441["provider"] || v446 || this["_data"]?.["provider"] || "",
            adapterType: v444 ? "workflow" : "modelApi",
            modelId: v441["model"] || this["_data"]?.["model"] || "",
            executionId:
              "image." +
              (v441["provider"] || v446 || "modelApi") +
              "." +
              (v441["model"] || "default"),
            payload: v441,
            cancellable: v444,
            resumable: v443 || v445 || v447,
            async: v447,
            pauseOnAbort: v450,
            startBuilder: () => v452,
            pauseBuilder: (v454) => {
              const v455 = v83["getState"]()["nodes"]?.[this["nodeId"]] || {};
              if (v445)
                return this["_buildDreaminaTaskPatch"]({
                  submitId:
                    String(this["_dreaminaActiveSubmitId"] || "")["trim"]() ||
                    String(v455?.["dreaminaSubmitId"] || "")["trim"](),
                  status:
                    String(v455?.["dreaminaTaskStatus"] || "")["trim"]() ||
                    "pending",
                  phase:
                    String(v455?.["dreaminaTaskPhase"] || "")["trim"]() ||
                    "generating",
                  label:
                    String(v455?.["dreaminaTaskLabel"] || "")["trim"]() ||
                    "生成中",
                  startedAt: v454["startedAt"],
                  lastCheckedAt: Date["now"](),
                  recovering: false,
                  raw: v455?.["dreaminaTaskLastRaw"] || {},
                });
              if (v443)
                return this["_buildRunningHubTaskPatch"]({
                  taskId:
                    String(this["_rhTaskId"] || "")["trim"]() ||
                    String(v455?.["rhTaskId"] || "")["trim"]() ||
                    String(v454?.["taskId"] || "")["trim"](),
                  status:
                    String(v455?.["rhTaskStatus"] || "")["trim"]() || "running",
                  startedAt: v454["startedAt"],
                  recovering: false,
                  useOpenapiQuery:
                    v455?.["rhTaskUseOpenapiQuery"] === true || v448,
                });
              return {};
            },
            onTaskStart: () => {
              this["_syncLocalTaskNodeData"]();
              if (v443) this["_persistRunningHubResumeCache"]();
              if (v445) this["_persistDreaminaResumeCache"]();
              if (v447) this["_persistAsyncResumeCache"]();
            },
            submit: async (v456, v457 = {}) =>
              v84["generateImage"](v441, {
                ...(this["_rhAbortController"]
                  ? { signal: this["_rhAbortController"]["signal"] }
                  : {}),
                onProgress: v445
                  ? (v458 = {}) => {
                      const v459 =
                          String(v458?.["status"] || "pending")["trim"]() ||
                          "pending",
                        v460 =
                          String(v458?.["phase"] || "generating")["trim"]() ||
                          "generating",
                        v461 = String(
                          v458?.["failReason"] ||
                            v458?.["failureReason"] ||
                            v458?.["error"] ||
                            v458?.["message"] ||
                            v458?.["label"] ||
                            "",
                        )["trim"]();
                      if (
                        v459["toLowerCase"]() === "failed" ||
                        v459["toLowerCase"]() === "fail" ||
                        v459["toLowerCase"]() === "error" ||
                        v460["toLowerCase"]() === "failed" ||
                        v460["toLowerCase"]() === "fail" ||
                        v460["toLowerCase"]() === "error"
                      ) {
                        this["_finalizeDreaminaImageFailure"]({
                          error: v461 || "生成失败",
                          startedAt: v451,
                          submitId:
                            String(v458?.["submitId"] || "")["trim"]() ||
                            String(
                              v83["getState"]()["nodes"]?.[this["nodeId"]]?.[
                                "dreaminaSubmitId"
                              ] || "",
                            )["trim"](),
                          lastCheckedAt: Number(
                            v458?.["lastCheckedAt"] || Date["now"](),
                          ),
                          raw: v458?.["raw"] || {},
                        });
                        return;
                      }
                      this["_applyDreaminaTaskPatch"]({
                        submitId:
                          String(v458?.["submitId"] || "")["trim"]() ||
                          String(
                            v83["getState"]()["nodes"]?.[this["nodeId"]]?.[
                              "dreaminaSubmitId"
                            ] || "",
                          )["trim"](),
                        status: v459,
                        phase: v460,
                        label:
                          String(v458?.["label"] || "生成中")["trim"]() ||
                          "生成中",
                        startedAt: v451,
                        lastCheckedAt: Number(
                          v458?.["lastCheckedAt"] || Date["now"](),
                        ),
                        recovering: false,
                        raw: v458?.["raw"] || {},
                      });
                    }
                  : undefined,
                onTaskMeta: ({
                  taskId: v462,
                  useOpenapiQuery: v463,
                  provider: v464,
                }) => {
                  const v465 = String(v462 || "")["trim"]();
                  if (!v465) return;
                  if (v443) {
                    ((this["_rhTaskId"] = v465),
                      v457["onTaskId"]?.(v465),
                      v83["updateNodeData"](this["nodeId"], {
                        rhStatusMessage: null,
                        rhStatusCode: null,
                        rhTaskUseOpenapiQuery: v463 === true,
                      }),
                      this["_syncLocalTaskNodeData"](),
                      this["_persistRunningHubResumeCache"]());
                    v444 &&
                      this["_rhCancelRequested"] &&
                      this["_cancelRunningHubWorkflowTask"]();
                    return;
                  }
                  if (v445) {
                    ((this["_dreaminaActiveSubmitId"] = v465),
                      this["_applyDreaminaTaskPatch"]({
                        submitId: v465,
                        status: "pending",
                        phase: "generating",
                        label: "生成中",
                        startedAt: v451,
                        lastCheckedAt: Date["now"](),
                        recovering: false,
                        raw: {},
                      }),
                      v457["onTaskId"]?.(v465));
                    return;
                  }
                  v447 &&
                    (v457["onTaskId"]?.(v465),
                    v83["updateNodeData"](this["nodeId"], {
                      asyncTaskProvider: this["_inferProviderFromModel"](
                        v441?.["model"],
                        v464 || v446 || this["_data"]?.["provider"] || "",
                      ),
                      asyncTaskKind: "image",
                    }),
                    this["_syncLocalTaskNodeData"](),
                    this["_persistAsyncResumeCache"]());
                },
                onTaskId: (v466) => {
                  const v467 = String(v466 || "")["trim"]();
                  if (!v467) return;
                  if (v443) {
                    ((this["_rhTaskId"] = v467), v457["onTaskId"]?.(v467));
                    const v468 =
                      v83["getState"]()["nodes"]?.[this["nodeId"]] || {};
                    (v83["updateNodeData"](this["nodeId"], {
                      rhStatusMessage: null,
                      rhStatusCode: null,
                      rhTaskUseOpenapiQuery:
                        v468?.["rhTaskUseOpenapiQuery"] === true || v448,
                    }),
                      this["_syncLocalTaskNodeData"](),
                      this["_persistRunningHubResumeCache"]());
                    v444 &&
                      this["_rhCancelRequested"] &&
                      this["_cancelRunningHubWorkflowTask"]();
                    return;
                  }
                  if (v445) {
                    ((this["_dreaminaActiveSubmitId"] = v467),
                      this["_applyDreaminaTaskPatch"]({
                        submitId: v467,
                        status: "pending",
                        phase: "generating",
                        label: "生成中",
                        startedAt: v451,
                        lastCheckedAt: Date["now"](),
                        recovering: false,
                        raw: {},
                      }),
                      v457["onTaskId"]?.(v467));
                    return;
                  }
                  if (v447) {
                    const v469 =
                      v83["getState"]()["nodes"]?.[this["nodeId"]] || {};
                    (v457["onTaskId"]?.(v467),
                      v83["updateNodeData"](this["nodeId"], {
                        asyncTaskProvider: this["_inferProviderFromModel"](
                          v469?.["model"] || v441?.["model"],
                          v469?.["asyncTaskProvider"] ||
                            v446 ||
                            this["_data"]?.["provider"] ||
                            "",
                        ),
                        asyncTaskKind: "image",
                      }),
                      this["_syncLocalTaskNodeData"](),
                      this["_persistAsyncResumeCache"]());
                  }
                },
              }),
            cancel: v444
              ? async ({ taskId: v470 }) => {
                  const v471 = this["_rhApiKey"] || v441["apiKey"] || "",
                    v472 = String(v470 || "")["trim"]();
                  if (!v471 || !v472) return null;
                  return v84["cancelRunningHubWorkflowTask"]({
                    apiKey: v471,
                    taskId: v472,
                  });
                }
              : undefined,
            resultBuilder: async (v473, v474) => {
              const v475 = this["_getImageGenerationResultError"](v473);
              if (v475) throw new Error(v475);
              const v476 = this["_applyImageGenerationResult"](
                  v473,
                  v474["startedAt"],
                  { writeStore: false },
                ),
                v477 = { ...(v476?.["patch"] || {}) };
              if (v443) {
                const v478 = v83["getState"]()["nodes"]?.[this["nodeId"]] || {};
                (Object["assign"](
                  v477,
                  this["_buildRunningHubTaskPatch"]({
                    taskId:
                      String(this["_rhTaskId"] || "")["trim"]() ||
                      String(v478?.["rhTaskId"] || "")["trim"](),
                    status: "success",
                    startedAt: v474["startedAt"],
                    recovering: false,
                    useOpenapiQuery:
                      v478?.["rhTaskUseOpenapiQuery"] === true || v448,
                  }),
                ),
                  this["_persistRunningHubResumeCache"]());
              } else {
                if (v445) {
                  const v479 =
                    v83["getState"]()["nodes"]?.[this["nodeId"]] || {};
                  (Object["assign"](
                    v477,
                    this["_buildDreaminaTaskPatch"]({
                      submitId: String(v479?.["dreaminaSubmitId"] || "")[
                        "trim"
                      ](),
                      status: "success",
                      phase: "done",
                      label: "已完成",
                      startedAt: v474["startedAt"],
                      lastCheckedAt: Date["now"](),
                      recovering: false,
                      raw: {},
                    }),
                  ),
                    this["_persistDreaminaResumeCache"]());
                } else {
                  if (v447) {
                    const v480 =
                      v83["getState"]()["nodes"]?.[this["nodeId"]] || {};
                    (Object["assign"](
                      v477,
                      this["_buildAsyncTaskPatch"]({
                        provider: this["_inferProviderFromModel"](
                          v480?.["model"] || v441?.["model"],
                          v480?.["asyncTaskProvider"] || v446 || "",
                        ),
                        kind: "image",
                        taskId:
                          String(v480?.["asyncTaskId"] || "")["trim"]() ||
                          String(v474?.["taskId"] || "")["trim"](),
                        status: "success",
                        startedAt: v474["startedAt"],
                        recovering: false,
                      }),
                    ),
                      this["_persistAsyncResumeCache"]());
                  }
                }
              }
              return v477;
            },
            failureBuilder: (v481, v482) => {
              if (v445) {
                const v483 = v83["getState"]()["nodes"]?.[this["nodeId"]] || {};
                return this["_buildDreaminaFailurePatch"]({
                  error: v481,
                  startedAt: v482["startedAt"],
                  submitId:
                    String(this["_dreaminaActiveSubmitId"] || "")["trim"]() ||
                    String(v483?.["dreaminaSubmitId"] || "")["trim"](),
                  lastCheckedAt: Date["now"](),
                  raw: v483?.["dreaminaTaskLastRaw"] || {},
                });
              }
              const v484 = {
                ...buildImageGenerationFailurePatch({
                  error: v481?.["message"] || "生成失败",
                  startedAt: v482["startedAt"],
                }),
              };
              if (v443) {
                const v485 = v83["getState"]()["nodes"]?.[this["nodeId"]] || {};
                Object["assign"](
                  v484,
                  {
                    rhStatusMessage: v481?.["message"] || "生成失败",
                    rhStatusCode: Number["isFinite"](Number(v481?.["code"]))
                      ? Number(v481["code"])
                      : null,
                  },
                  this["_buildRunningHubTaskPatch"]({
                    taskId:
                      String(this["_rhTaskId"] || "")["trim"]() ||
                      String(v485?.["rhTaskId"] || "")["trim"](),
                    status: "failed",
                    startedAt: v482["startedAt"],
                    recovering: false,
                    useOpenapiQuery:
                      v485?.["rhTaskUseOpenapiQuery"] === true || v448,
                  }),
                );
              } else {
                if (v447) {
                  const v486 =
                    v83["getState"]()["nodes"]?.[this["nodeId"]] || {};
                  Object["assign"](
                    v484,
                    this["_buildAsyncTaskPatch"]({
                      provider: this["_inferProviderFromModel"](
                        v486?.["model"] || v441?.["model"],
                        v486?.["asyncTaskProvider"] || v446 || "",
                      ),
                      kind: "image",
                      taskId:
                        String(v486?.["asyncTaskId"] || "")["trim"]() ||
                        String(v482?.["taskId"] || "")["trim"](),
                      status: "failed",
                      startedAt: v482["startedAt"],
                      recovering: false,
                    }),
                  );
                }
              }
              return v484;
            },
            cancelledBuilder: (v487) => {
              const v488 = v83["getState"]()["nodes"]?.[this["nodeId"]] || {},
                v489 =
                  v488["generationDuration"] == null
                    ? Date["now"]() - v487["startedAt"]
                    : v488["generationDuration"];
              if (v444)
                return this["_buildRunningHubCancelResultPatch"]({
                  latest: v488,
                  message: v488["rhStatusMessage"] || "生成已中断",
                  code: v488["rhStatusCode"],
                  duration: v489,
                  taskId:
                    String(this["_rhTaskId"] || "")["trim"]() ||
                    String(v488?.["rhTaskId"] || "")["trim"](),
                });
              return { images: [], imageUrl: "", thumbUrl: "", localPath: "" };
            },
            parseError: (v490) => v490?.["message"] || "生成失败",
          },
          {
            store: v83,
            startedAt: v451,
            abortController: this["_rhAbortController"],
          },
        );
        if (v453["status"] === "failed") {
          const v491 = v453["error"];
          (console["error"]("[AIGenerateNode]\x20生成失败:", v491),
            void logDiagnosticEvent({
              type: "generation.image_failed",
              level: "error",
              source: "renderer",
              message: v491?.["message"] || "图像生成失败",
              error: v491,
              context: {
                nodeId: this["nodeId"],
                provider: v441?.["provider"] || "",
                model: v441?.["model"] || "",
                isRhTaskModel: v443,
                isDreaminaTask: v445,
                isAsyncTaskModel: v447,
              },
            }));
        }
        if (v443) this["_persistRunningHubResumeCache"]();
        if (v445) this["_persistDreaminaResumeCache"]();
        if (v447) this["_persistAsyncResumeCache"]();
        return v453;
      } finally {
        const v492 = this["_syncLocalTaskNodeData"](),
          v493 = shouldShowGenerationBusyUi(v492);
        ((this["_isGenerating"] = v493),
          (this["_dreaminaActiveSubmitId"] = ""),
          (this["_rhAbortController"] = null));
        if (v443 && v493) {
          const v494 = String(v492?.["rhTaskId"] || "")["trim"]();
          if (v494) this["_rhTaskId"] = v494;
        } else {
          this["_rhTaskId"] = null;
          if (!this["_rhCancelRequested"]) this["_rhApiKey"] = null;
        }
        this["btnEl"] && this["_updateSubmitButtonState"]?.();
        if (!v493) {
          if (this["btnEl"]) resetGenerateButtonIdleUi(this["btnEl"]);
          v106(this["previewEl"]);
        }
      }
    }
    ["unmount"]() {
      (this["_flushPromptHtmlCommit"]?.(),
        this["_assetMentionRegistryUnsubscribe"]?.(),
        (this["_assetMentionRegistryUnsubscribe"] = null),
        (this["_assetMentionRegistryRefreshPending"] = false),
        this["_stopRunningHubRecovery"](false),
        this["_stopDreaminaRecovery"](false),
        this["_stopAsyncRecovery"](false),
        this["_rhAbortController"] &&
          !this["_rhAbortController"]["signal"]["aborted"] &&
          this["_rhAbortController"]["abort"](),
        (this["_rhAbortController"] = null),
        this["_generationNodeHelpTip"]?.["remove"](),
        (this["_generationNodeHelpTip"] = null),
        this["_uiSchemaCleanup"]?.(),
        (this["_uiSchemaCleanup"] = null),
        this["_footerControllerCleanup"]?.(),
        (this["_footerControllerCleanup"] = null));
    }
  }
  return v120["prototype"];
}
