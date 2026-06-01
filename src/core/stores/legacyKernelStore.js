import { generateId } from "../math.js";
import {
  applyFeatureSelectionsToNodeData,
  captureFeatureSelectionsFromNodePatch,
  sanitizeFeatureSelectionsRecord,
} from "../../modules/featureSelectionMemory.js";
import {
  normalizeImageToolbarLayout,
  serializeImageToolbarLayout,
} from "../../modules/imageToolbarLayoutMemory.js";
import {
  normalizeVideoToolbarLayout,
  serializeVideoToolbarLayout,
} from "../../modules/videoToolbarLayoutMemory.js";
import { normalizeCommentNoteJumpShortcut } from "../../modules/commentNoteJumpShortcut.js";
import { sanitizeSerializedCanvasData } from "../../utils/thumbnailPersistence.js";
import { sanitizePromptHtml } from "../../utils/dom.js";
import {
  isGenerationTaskTerminalStatus,
  resolveJobStatusFromTaskStatus,
} from "../generationTaskLifecycle.js";
import { createDefaultStoryboardScriptState } from "../storyboardScriptFactory.js";
import {
  cloneStoryboardCellForSwap,
  cloneStoryboardCellForSwapDestination,
  isStoryboardCellEmpty,
  normalizeEmptyStoryboardCell,
  resolveStoryboardCellSourceIndex,
} from "../storyboardCellUtils.js";
import { sanitizeCanvasNodeMediaPatchForStore } from "../../services/canvasMediaLocalService.js";
import {
  canAppendInputKindWithinLimit,
  canTargetReceiveInputs,
  getTargetInputPolicy,
  hasUsableInputNodeSource,
  isInputKindAllowed,
  resolveEffectiveInputKind,
} from "../../modules/modelInputPolicy.js";
import {
  collectGroupOutputIncomingEdges,
  isGroupNodeData,
} from "../../modules/groupDynamicOutput.js";
import { getFixedInputSlotConfigFromManifest } from "../../modules/fixedInputAssetRefs.js";
import {
  isModelApiModel,
  isWorkflowModel as isWorkflowModel,
  RH_VIDEO_V54_MODEL_ID,
  resolveModelProvider,
} from "../../manifests/index.js";
import {
  createInitialState,
  createInitialWorkflowDraftState,
  createInitialWorkflowUiState,
} from "./legacyInitialState.js";
function deepClone(v0) {
  if (typeof structuredClone === "function")
    try {
      return structuredClone(v0);
    } catch {}
  return JSON["parse"](JSON["stringify"](v0));
}
function stripPersistedRichText(v1) {
  if (typeof v1 !== "string") return v1;
  return v1["replace"](/<[^>]*>/g, "");
}
function sanitizePersistedPromptHtml(v2) {
  if (typeof v2 !== "string") return v2;
  return sanitizePromptHtml(v2);
}
function cloneShallowObjectArray(v3) {
  if (!Array["isArray"](v3)) return v3;
  return v3["map"]((v4) => (v4 && typeof v4 === "object" ? { ...v4 } : v4));
}
function cloneViewportSnapshot(v5) {
  if (!v5 || typeof v5 !== "object") return v5;
  return { ...v5 };
}
function cloneEdgeSnapshot(v6) {
  if (!v6 || typeof v6 !== "object") return v6;
  return { ...v6 };
}
function cloneAssetSnapshot(v7) {
  if (!v7 || typeof v7 !== "object") return v7;
  if (typeof structuredClone === "function")
    try {
      return structuredClone(v7);
    } catch {}
  try {
    return JSON["parse"](JSON["stringify"](v7));
  } catch {}
  return { ...v7 };
}
function cloneWorkflowSnapshot(v8) {
  if (!v8 || typeof v8 !== "object") return v8;
  return deepClone(v8);
}
function isBlobLikeUrl(v9) {
  return typeof v9 === "string" && /^blob:/i["test"](v9["trim"]());
}
function sanitizePanoramaStateForPersistence(v10) {
  if (!v10 || typeof v10 !== "object") return v10;
  const v11 = deepClone(v10);
  return (
    v11["ui"] && typeof v11["ui"] === "object" && delete v11["ui"]["isEditing"],
    v11["panorama"] &&
      typeof v11["panorama"] === "object" &&
      (delete v11["panorama"]["isLoaded"],
      delete v11["panorama"]["error"],
      isBlobLikeUrl(v11["panorama"]["imageUrl"]) &&
        delete v11["panorama"]["imageUrl"],
      isBlobLikeUrl(v11["panorama"]["localPath"]) &&
        delete v11["panorama"]["localPath"]),
    v11["capture"] &&
      typeof v11["capture"] === "object" &&
      (delete v11["capture"]["pending"],
      delete v11["capture"]["error"],
      delete v11["capture"]["lastCaptureAt"]),
    v11
  );
}
function sanitizePanoramaStateForHistory(v12) {
  const v13 = sanitizePanoramaStateForPersistence(v12);
  if (!v13 || typeof v13 !== "object") return v13;
  return (delete v13["viewport"], v13);
}
function cloneNodeSnapshot(
  v14,
  {
    stripRichText: stripRichText = false,
    hydratedAt: hydratedAt = null,
    featureSelections: featureSelections = null,
    stripPanoramaViewport: stripPanoramaViewport = false,
    preserveLiveGeneration: preserveLiveGeneration = false,
  } = {},
) {
  if (!v14 || typeof v14 !== "object") return v14;
  const v15 = { ...v14 };
  normalizeNodeModel(v15);
  stripRichText &&
    (v15["content"] !== undefined &&
      (v15["content"] = stripPersistedRichText(v15["content"])),
    v15["prompt"] !== undefined &&
      (v15["prompt"] = sanitizePersistedPromptHtml(v15["prompt"])));
  Array["isArray"](v14["cells"]) &&
    (v15["cells"] = cloneShallowObjectArray(v14["cells"]));
  Array["isArray"](v14["images"]) &&
    (v15["images"] = cloneShallowObjectArray(v14["images"]));
  Array["isArray"](v14["videos"]) &&
    (v15["videos"] = cloneShallowObjectArray(v14["videos"]));
  v14["sceneNode"] &&
    typeof v14["sceneNode"] === "object" &&
    (v15["sceneNode"] = stripPanoramaViewport
      ? sanitizePanoramaStateForHistory(v14["sceneNode"])
      : sanitizePanoramaStateForPersistence(v14["sceneNode"]));
  v14["panorama360Node"] &&
    typeof v14["panorama360Node"] === "object" &&
    (v15["panorama360Node"] = stripPanoramaViewport
      ? sanitizePanoramaStateForHistory(v14["panorama360Node"])
      : sanitizePanoramaStateForPersistence(v14["panorama360Node"]));
  typeof hydratedAt === "number" &&
    Number["isFinite"](hydratedAt) &&
    typeof v15["generationStartTime"] === "number" &&
    Number["isFinite"](v15["generationStartTime"]) &&
    v15["generationDuration"] == null &&
    !shouldPreserveRunningGenerationOnHydrate(v15, {
      preserveLiveGeneration: preserveLiveGeneration,
    }) &&
    finalizeHydratedGenerationSnapshot(
      v15,
      Math["max"](1, hydratedAt - v15["generationStartTime"]),
    );
  if (typeof v15["_bizRev"] !== "number") v15["_bizRev"] = 1;
  return featureSelections
    ? applyFeatureSelectionsToNodeData(v15, featureSelections)
    : v15;
}
function shallowEqual(v16, v17) {
  if (v16 === v17) return true;
  if (typeof v16 !== typeof v17) return false;
  if (typeof v16 !== "object" || v16 === null || v17 === null) return false;
  const v18 = Object["keys"](v16),
    v19 = Object["keys"](v17);
  if (v18["length"] !== v19["length"]) return false;
  for (const v20 of v18) {
    if (!v19["includes"](v20) || v16[v20] !== v17[v20]) return false;
  }
  return true;
}
function isPlainObject(v21) {
  if (!v21 || typeof v21 !== "object" || Array["isArray"](v21)) return false;
  const v22 = Object["getPrototypeOf"](v21);
  return v22 === Object["prototype"] || v22 === null;
}
function snapshotSelectorValue(v23) {
  if (v23 == null || typeof v23 !== "object") return v23;
  if (Array["isArray"](v23)) return v23["slice"]();
  if (isPlainObject(v23)) return { ...v23 };
  if (typeof structuredClone === "function")
    try {
      return structuredClone(v23);
    } catch {}
  return v23;
}
function _isSameStoreValue(v24, v25) {
  return Object["is"](v24, v25);
}
function _isPatchNoop(v26, v27) {
  if (!v26 || !v27 || typeof v27 !== "object") return false;
  const v28 = Object["keys"](v27);
  if (v28["length"] === 0) return true;
  return v28["every"]((v29) => _isSameStoreValue(v26[v29], v27[v29]));
}
function _trimText(v30) {
  return typeof v30 === "string" ? v30["trim"]() : "";
}
const HISTORY_RUNNING_STATUSES = new Set([
    "pending",
    "queued",
    "queueing",
    "waiting",
    "submitted",
    "submitting",
    "submit",
    "running",
    "processing",
    "generating",
    "in_progress",
    "in-progress",
    "recovering",
  ]),
  HISTORY_GENERATION_STATUS_FIELDS = Object["freeze"]([
    "jobStatus",
    "rhTaskStatus",
    "dreaminaTaskStatus",
    "dreaminaTaskPhase",
    "asyncTaskStatus",
  ]);
function normalizeHistoryStatus(v31) {
  return String(v31 || "")
    ["trim"]()
    ["toLowerCase"]();
}
function hasUsableImageResultItem(v32) {
  if (!v32 || typeof v32 !== "object") return false;
  if (_trimText(v32["error"])) return false;
  return !!(
    _trimText(v32["imageUrl"]) ||
    _trimText(v32["sourceUrl"]) ||
    _trimText(v32["thumbUrl"]) ||
    _trimText(v32["localPath"]) ||
    _trimText(v32["originalLocalPath"]) ||
    _trimText(v32["displayLocalPath"]) ||
    _trimText(v32["thumbLocalPath"]) ||
    _trimText(v32["thumbId"]) ||
    _trimText(v32["sourceId"])
  );
}
function hasResolvedAiImageResultSnapshot(v33) {
  if (!v33 || typeof v33 !== "object") return false;
  if (String(v33["type"] || "") !== "ai-image") return false;
  const v34 = Array["isArray"](v33["images"]) ? v33["images"] : [];
  if (v34["some"]((v35) => hasUsableImageResultItem(v35))) return true;
  return hasUsableImageResultItem(v33);
}
function isRunningAiImageHistorySnapshot(v36) {
  if (!v36 || typeof v36 !== "object") return false;
  if (String(v36["type"] || "") !== "ai-image") return false;
  if (v36["isGenerating"] === true) return true;
  if (
    v36["rhTaskRecovering"] === true ||
    v36["dreaminaTaskRecovering"] === true ||
    v36["asyncTaskRecovering"] === true
  )
    return true;
  return HISTORY_GENERATION_STATUS_FIELDS["some"]((v37) =>
    HISTORY_RUNNING_STATUSES["has"](normalizeHistoryStatus(v36[v37])),
  );
}
function normalizeAiImageRunningHistorySnapshot(v38) {
  if (!isRunningAiImageHistorySnapshot(v38)) return v38;
  const v39 = hasResolvedAiImageResultSnapshot(v38);
  return (
    (v38["isGenerating"] = false),
    (v38["jobStatus"] = v39 ? "success" : null),
    (v38["jobError"] = null),
    (v38["rhStatusMessage"] = null),
    (v38["rhStatusCode"] = null),
    (v38["rhTaskId"] = ""),
    (v38["rhTaskStatus"] = "idle"),
    (v38["rhTaskRecovering"] = false),
    (v38["dreaminaSubmitId"] = ""),
    (v38["dreaminaTaskStatus"] = "idle"),
    (v38["dreaminaTaskPhase"] = "done"),
    (v38["dreaminaTaskLabel"] = ""),
    (v38["dreaminaTaskRecovering"] = false),
    (v38["dreaminaTaskLastRaw"] = {}),
    (v38["asyncTaskId"] = ""),
    (v38["asyncTaskStatus"] = "idle"),
    (v38["asyncTaskRecovering"] = false),
    v38
  );
}
function _getStoryboardCellPosition(v40, v41) {
  const v42 = Math["max"](1, Math["round"](Number(v40?.["cols"]) || 1));
  return { col: v41 % v42, row: Math["floor"](v41 / v42) };
}
function _placeStoryboardCellForSwap(v43, v44, v45, v46, v47, v48) {
  Object["assign"](v43, _getStoryboardCellPosition(v47, v48));
  if (isStoryboardCellEmpty(v44)) return normalizeEmptyStoryboardCell(v43);
  return (
    (v43["storyboardSourceIndex"] = resolveStoryboardCellSourceIndex(
      v44,
      v46,
      v45,
    )),
    v43
  );
}
function _isValidStoryboardCellTarget(v49, v50) {
  return (
    v49 &&
    v49["type"] === "storyboard" &&
    Array["isArray"](v49["cells"]) &&
    Number["isInteger"](v50) &&
    v50 >= 0 &&
    v50 < v49["cells"]["length"]
  );
}
const LEGACY_VIDEO_EDIT_V52_MODEL_ID = "runninghub/2037339851183366146";
function normalizeNodeModel(v51) {
  if (!v51 || typeof v51 !== "object") return;
  String(v51["model"] || "") === LEGACY_VIDEO_EDIT_V52_MODEL_ID &&
    (v51["model"] = RH_VIDEO_V54_MODEL_ID);
}
function normalizeNodesCollection(v52) {
  if (!v52) return;
  if (Array["isArray"](v52)) {
    v52["forEach"](normalizeNodeModel);
    return;
  }
  typeof v52 === "object" &&
    Object["values"](v52)["forEach"](normalizeNodeModel);
}
function isDreaminaTaskNodeSnapshot(v53) {
  if (!v53 || typeof v53 !== "object") return false;
  const v54 = String(v53["type"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (
    !["ai-video", "ai-image", "source-image", "source-video"]["includes"](v54)
  )
    return false;
  const v55 = String(v53["provider"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v56 = String(v53["model"] || "")["trim"]();
  return v55 === "dreamina" || resolveModelProvider(v56, v55) === "dreamina";
}
function inferAsyncProviderByModel(v57, v58 = "") {
  const v59 = resolveModelProvider(v57, "", { allowProviderHint: false });
  if (v59) return v59;
  const v60 = String(v58 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v60) return v60;
  const v61 = String(v57 || "")["trim"]();
  if (v61 && !v61["includes"]("/")) return "grsai";
  return "grsai";
}
function isAsyncTaskNodeSnapshot(v62) {
  if (!v62 || typeof v62 !== "object") return false;
  const v63 = String(v62["type"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (
    !["ai-video", "ai-image", "source-video", "source-image"]["includes"](v63)
  )
    return false;
  const v64 = inferAsyncProviderByModel(
    v62["model"],
    v62["asyncTaskProvider"] || v62["provider"] || "",
  );
  if (
    !v64 ||
    v64 === "runninghubwf" ||
    v64 === "runninghub" ||
    v64 === "dreamina"
  )
    return false;
  return true;
}
function isRunningHubTaskNodeSnapshot(v65) {
  if (!v65 || typeof v65 !== "object") return false;
  const v66 = String(v65["type"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v67 = String(v65["provider"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v68 = String(v65["model"] || "")["trim"](),
    v69 = resolveModelProvider(v68, v67, { allowProviderHint: false }),
    v70 = isWorkflowModel(v68, v67 || "runninghubwf"),
    v71 = v69 === "runninghub" && isModelApiModel(v68, "runninghub");
  if (v66 === "ai-audio") return v67 === "runninghubwf";
  if (v66 === "source-video") return v67 === "runninghubwf" || v70;
  if (v66 === "source-image")
    return v67 === "runninghubwf" || v67 === "runninghub" || v70 || v71;
  if (v66 === "source-audio") return v67 === "runninghubwf" && v70;
  if (v66 === "ai-video") return v67 === "runninghubwf" && v70;
  if (v66 === "ai-image")
    return v70 || v71 || v67 === "runninghub" || v67 === "runninghubwf";
  return false;
}
function hasResolvedVideoResultSnapshot(v72) {
  if (!v72 || typeof v72 !== "object") return false;
  const v73 = Array["isArray"](v72["videos"]) ? v72["videos"] : [];
  if (v73["length"] > 0) return true;
  return (
    !!String(v72["videoUrl"] || "")["trim"]() ||
    !!String(v72["localPath"] || "")["trim"]()
  );
}
const HYDRATE_ACTIVE_STATUS_FIELDS = Object["freeze"]([
    "jobStatus",
    "rhTaskStatus",
    "dreaminaTaskStatus",
    "dreaminaTaskPhase",
    "asyncTaskStatus",
    "mediaTaskStatus",
  ]),
  HYDRATE_RECOVERING_FIELDS = Object["freeze"]([
    "rhTaskRecovering",
    "dreaminaTaskRecovering",
    "asyncTaskRecovering",
  ]);
function finalizeHydratedGenerationSnapshot(v74, v75) {
  v74["generationDuration"] = v75;
  if (v74["isGenerating"] === true) v74["isGenerating"] = false;
  for (const v76 of HYDRATE_ACTIVE_STATUS_FIELDS) {
    const v77 = String(v74[v76] || "")["trim"]();
    if (v77 && !isGenerationTaskTerminalStatus(v77)) v74[v76] = "cancelled";
  }
  for (const v78 of HYDRATE_RECOVERING_FIELDS)
    if (v74[v78] === true) v74[v78] = false;
}
function shouldPreserveRunningGenerationOnHydrate(
  v79,
  { preserveLiveGeneration: preserveLiveGeneration = false } = {},
) {
  if (preserveLiveGeneration && v79?.["isGenerating"] === true) {
    const v80 = [
      v79["dreaminaTaskPhase"],
      v79["dreaminaTaskStatus"],
      v79["asyncTaskStatus"],
      v79["rhTaskStatus"],
      v79["mediaTaskStatus"],
      v79["jobStatus"],
    ]["some"]((v81) => {
      const v82 = String(v81 || "")
        ["trim"]()
        ["toLowerCase"]();
      return !!v82 && v82 !== "idle" && isGenerationTaskTerminalStatus(v82);
    });
    if (!v80) return true;
  }
  if (isDreaminaTaskNodeSnapshot(v79)) {
    const v83 = String(v79["dreaminaSubmitId"] || "")["trim"]();
    if (!v83) return false;
    const v84 = String(v79["dreaminaTaskPhase"] || "")
        ["trim"]()
        ["toLowerCase"](),
      v85 = String(v79["dreaminaTaskStatus"] || "")
        ["trim"]()
        ["toLowerCase"]();
    if (isGenerationTaskTerminalStatus(v84)) return false;
    if (isGenerationTaskTerminalStatus(v85)) return false;
    return true;
  }
  if (isAsyncTaskNodeSnapshot(v79)) {
    const v86 = String(v79["asyncTaskId"] || "")["trim"]();
    if (!v86) return false;
    const v87 = String(v79["asyncTaskKind"] || "")
        ["trim"]()
        ["toLowerCase"](),
      v88 = String(v79["type"] || "")
        ["trim"]()
        ["toLowerCase"]();
    if (v87 === "image" && !["ai-image", "source-image"]["includes"](v88))
      return false;
    if (v87 === "video" && !["ai-video", "source-video"]["includes"](v88))
      return false;
    const v89 = String(v79["asyncTaskStatus"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (isGenerationTaskTerminalStatus(v89)) return false;
    return true;
  }
  if (!isRunningHubTaskNodeSnapshot(v79)) return false;
  const v90 = String(v79["rhTaskId"] || "")["trim"]();
  if (!v90) return false;
  const v91 = String(v79["rhTaskStatus"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (isGenerationTaskTerminalStatus(v91)) return false;
  return true;
}
function createStore() {
  let v92 = createInitialState();
  const v93 = [],
    v94 = [],
    v95 = [];
  let v96 = 0,
    v97 = false,
    v98 = () => true;
  function v99() {
    v92["_persistRev"] = (v92["_persistRev"] || 0) + 1;
  }
  function v100() {
    v92["_edgesRev"] = (v92["_edgesRev"] || 0) + 1;
  }
  function v101(v102) {
    v98 = typeof v102 === "function" ? v102 : () => true;
  }
  function v103(v104, v105) {
    if (!v105 || typeof v105 !== "object") return v105;
    const v106 = { ...v105 },
      v107 = (v108) =>
        Object["prototype"]["hasOwnProperty"]["call"](v106, v108),
      v109 = () => {
        const v110 = [v106["images"], v106["videos"]]["filter"](
          Array["isArray"],
        );
        for (const v111 of v110) {
          let v112 = "",
            v113 = false;
          for (const v114 of v111) {
            if (!v114 || typeof v114 !== "object") continue;
            const v115 = String(v114["error"] || v114["message"] || "")[
              "trim"
            ]();
            if (v115 && !v112) v112 = v115;
            String(
              v114["localPath"] ||
                v114["originalLocalPath"] ||
                v114["displayLocalPath"] ||
                v114["thumbLocalPath"] ||
                v114["imageUrl"] ||
                v114["videoUrl"] ||
                v114["thumbUrl"] ||
                v114["sourceUrl"] ||
                "",
            )["trim"]() && (v113 = true);
          }
          if (v112 && !v113) return v112;
        }
        return String(v106["jobError"] || "")["trim"]();
      },
      v116 = v107("isGenerating"),
      v117 = v109(),
      v118 = (v119) =>
        String(v119 || "")
          ["trim"]()
          ["toLowerCase"](),
      v120 = (v121) =>
        ["error", "failed", "fail", "cancelled", "canceled"]["includes"](
          v118(v121),
        ),
      v122 = (v123) => {
        if (v107(v123)) return String(v106[v123] || "")["trim"]();
        return String(v104?.[v123] || "")["trim"]();
      },
      v124 = () => !!v122("dreaminaSubmitId"),
      v125 = (v126) => {
        if (v120(v126)) return true;
        if (v124()) return true;
        if (v118(v126) === "idle") return false;
        return v118(v106["dreaminaTaskStatus"]) !== "idle";
      },
      v127 = [
        {
          status: v107("asyncTaskStatus") ? v106["asyncTaskStatus"] : null,
          active:
            v120(v106["asyncTaskStatus"]) ||
            !!v122("asyncTaskId") ||
            v118(v106["asyncTaskStatus"]) !== "idle",
        },
        {
          status: v107("rhTaskStatus") ? v106["rhTaskStatus"] : null,
          active:
            v120(v106["rhTaskStatus"]) ||
            !!v122("rhTaskId") ||
            v118(v106["rhTaskStatus"]) !== "idle",
        },
        {
          status: v107("dreaminaTaskStatus")
            ? v106["dreaminaTaskStatus"]
            : null,
          active: v125(v106["dreaminaTaskStatus"]),
        },
        {
          status: v107("dreaminaTaskPhase") ? v106["dreaminaTaskPhase"] : null,
          active: v125(v106["dreaminaTaskPhase"]),
        },
        {
          status: v107("mediaTaskStatus") ? v106["mediaTaskStatus"] : null,
          active: true,
        },
      ]["filter"](
        (v128) =>
          v128["active"] === true && String(v128["status"] || "")["trim"](),
      ),
      v129 = v127["find"]((v130) =>
        isGenerationTaskTerminalStatus(v130["status"]),
      )?.["status"],
      v131 = v107("mediaTaskStatus")
        ? String(v106["mediaTaskStatus"] || "")
            ["trim"]()
            ["toLowerCase"]()
        : "";
    !v116 &&
      (v131 === "waiting" || v131 === "processing") &&
      (v106["isGenerating"] = true);
    if (v117) {
      ((v106["isGenerating"] = false),
        (v106["jobStatus"] = "error"),
        (v106["jobError"] = v117));
      if (v107("dreaminaTaskStatus")) v106["dreaminaTaskStatus"] = "failed";
      if (v107("dreaminaTaskPhase")) v106["dreaminaTaskPhase"] = "failed";
      if (v107("dreaminaTaskLabel")) v106["dreaminaTaskLabel"] = v117;
      if (v107("dreaminaTaskRecovering"))
        v106["dreaminaTaskRecovering"] = false;
      if (v107("asyncTaskStatus")) v106["asyncTaskStatus"] = "failed";
      if (v107("asyncTaskRecovering")) v106["asyncTaskRecovering"] = false;
      if (v107("rhTaskStatus")) v106["rhTaskStatus"] = "failed";
      if (v107("rhTaskRecovering")) v106["rhTaskRecovering"] = false;
    }
    if (v129) {
      v106["isGenerating"] = false;
      const v132 = resolveJobStatusFromTaskStatus(
        v129,
        v106["jobStatus"] ?? null,
      );
      if (v132 !== undefined) v106["jobStatus"] = v132;
      (v107("dreaminaTaskStatus") || v107("dreaminaTaskPhase")) &&
        (v106["dreaminaTaskRecovering"] = false);
      if (v107("asyncTaskStatus")) v106["asyncTaskRecovering"] = false;
      if (v107("rhTaskStatus")) v106["rhTaskRecovering"] = false;
    }
    if (v106["isGenerating"] === true) {
      if (!v107("jobStatus")) v106["jobStatus"] = "running";
      const v133 = Number(v106["generationStartTime"]);
      if (!Number["isFinite"](v133) || v133 <= 0) {
        const v134 = Number(v104?.["generationStartTime"]);
        v106["generationStartTime"] =
          Number["isFinite"](v134) && v134 > 0 ? v134 : Date["now"]();
      }
      return ((v106["generationDuration"] = null), v106);
    }
    const v135 = v104?.["isGenerating"] === true,
      v136 =
        v106["isGenerating"] === false &&
        v106["generationDuration"] == null &&
        (v135 || !!v117 || !!v129);
    if (v136) {
      const v137 = v107("generationStartTime")
        ? Number(v106["generationStartTime"])
        : Number(v104?.["generationStartTime"]);
      v106["generationDuration"] =
        Number["isFinite"](v137) && v137 > 0
          ? Math["max"](0, Date["now"]() - v137)
          : v135
            ? 0
            : v106["generationDuration"];
    }
    return v106;
  }
  function v138() {
    if (v96 > 0) {
      v97 = true;
      return;
    }
    for (const v139 of v94) {
      v139(v92);
    }
    if (v93["length"] > 0) {
      const v140 = deepClone(v92);
      for (const v141 of v93) {
        v141(v140);
      }
    }
    for (const {
      selector: v142,
      callback: v143,
      isEqual: v144,
      lastValue: v145,
    } of v95) {
      const v146 = v142(v92);
      !v144(v145["value"], v146) &&
        ((v145["value"] = snapshotSelectorValue(v146)), v143(v146));
    }
  }
  function v147(v148) {
    if (typeof v148 !== "function")
      throw new TypeError("[store] batch() 的参数必须是函数");
    v96++;
    try {
      return v148();
    } finally {
      (v96--, v96 === 0 && v97 && ((v97 = false), v138()));
    }
  }
  function v149() {
    v138();
  }
  function v150() {
    v138();
  }
  function v151(v152) {
    if (typeof v152 !== "function")
      throw new TypeError("[store]\x20subscribe()\x20的参数必须是一个函数");
    return (
      v93["push"](v152),
      v152(deepClone(v92)),
      function v153() {
        const v154 = v93["indexOf"](v152);
        v154 !== -1 && v93["splice"](v154, 1);
      }
    );
  }
  function v155(v156) {
    if (typeof v156 !== "function")
      throw new TypeError("[store]\x20subscribeRaw()\x20的参数必须是一个函数");
    return (
      v94["push"](v156),
      v156(v92),
      function v157() {
        const v158 = v94["indexOf"](v156);
        v158 !== -1 && v94["splice"](v158, 1);
      }
    );
  }
  function v159(v160, v161, v162 = {}) {
    if (typeof v160 !== "function")
      throw new TypeError(
        "[store]\x20subscribeSelector()\x20的\x20selector\x20必须是函数",
      );
    if (typeof v161 !== "function")
      throw new TypeError(
        "[store]\x20subscribeSelector()\x20的\x20callback\x20必须是函数",
      );
    const v163 = v162["isEqual"] || shallowEqual,
      v164 = v160(v92),
      v165 = {
        selector: v160,
        callback: v161,
        isEqual: v163,
        lastValue: { value: snapshotSelectorValue(v164) },
      };
    return (
      v95["push"](v165),
      v161(v164),
      function v166() {
        const v167 = v95["indexOf"](v165);
        v167 !== -1 && v95["splice"](v167, 1);
      }
    );
  }
  function v168(v169) {
    if (!v169 || !v169["id"])
      throw new Error("[store] addNode() 需要提供含有 id 字段的节点数据");
    const v170 = applyFeatureSelectionsToNodeData(
        JSON["parse"](JSON["stringify"](v169)),
        v92["ui"]?.["featureSelections"] || {},
      ),
      v171 = sanitizeCanvasNodeMediaPatchForStore(v170),
      v172 = {
        text: "文本块",
        "ai-text": "生成文本",
        "ai-image": "生成图像",
        "ai-video": "生成视频",
        "ai-audio": "生成音频",
        "source-text": "源文本",
        "comment-note": "",
        "source-image": "源图像",
        "source-video": "源视频",
        "source-audio": "源音频",
        "panorama-scene": "3D导演台",
        "panorama-360": "360全景图",
        "storyboard-script": "分镜脚本",
        group: "组合",
        storyboard: "宫格分镜",
        image: "源图像",
        audio: "源音频",
        video: "源视频",
      },
      v173 = Object["prototype"]["hasOwnProperty"]["call"](v172, v171["type"])
        ? v172[v171["type"]]
        : "未命名";
    v171["type"] === "storyboard" &&
      (!Array["isArray"](v171["cells"])
        ? (v171["cells"] = [])
        : (v171["cells"] = v171["cells"]["map"]((v174) => ({
            ...v174,
            id: generateId("cell"),
          }))));
    v171["type"] === "storyboard-script" &&
      (v171["storyboardScript"] = createDefaultStoryboardScriptState(
        v171["storyboardScript"],
      ));
    v171["type"] === "comment-note" &&
      (v171["jumpShortcut"] = normalizeCommentNoteJumpShortcut(
        v171["jumpShortcut"],
      ));
    const { _bizRev: v175, ...v176 } = v171,
      v177 = v103(null, v176),
      v178 = { parentId: null, name: v173, _bizRev: 1, ...v177 };
    (captureFeatureSelectionsFromNodePatch(
      v178,
      v178,
      v92["ui"]?.["featureSelections"] || {},
    ),
      (v92["nodes"][v178["id"]] = v178),
      (v92["_nodeCount"] = (v92["_nodeCount"] || 0) + 1),
      v99(),
      v178["parentId"] && v179(v178["id"], v178["parentId"]),
      v138());
  }
  function v179(v180, v181, v182 = null) {
    (v182 && v92["_parentToChildren"][v182]?.["delete"](v180),
      v181 &&
        (!v92["_parentToChildren"][v181] &&
          (v92["_parentToChildren"][v181] = new Set()),
        v92["_parentToChildren"][v181]["add"](v180)));
  }
  function v183(v184, v185 = null) {
    if (v185) {
      const v186 = v92["_parentToChildren"][v185];
      v186 &&
        (v186["delete"](v184),
        v186["size"] === 0 && delete v92["_parentToChildren"][v185]);
    }
    v92["_parentToChildren"][v184] && delete v92["_parentToChildren"][v184];
  }
  function v187(v188) {
    const v189 = new Set(v188),
      v190 = [...v188];
    while (v190["length"] > 0) {
      const v191 = v190["pop"](),
        v192 = v92["_parentToChildren"][v191];
      if (!v192) continue;
      for (const v193 of v192) {
        if (!v92["nodes"][v193]) continue;
        if (v189["has"](v193)) continue;
        (v189["add"](v193), v190["push"](v193));
      }
    }
    return v189;
  }
  function v194(v195, v196, v197) {
    v198([v195], v196, v197);
  }
  function v198(v199, v200, v201) {
    if (!v199 || v199["length"] === 0) return;
    const v202 = Number(v200),
      v203 = Number(v201);
    if (!Number["isFinite"](v202) || !Number["isFinite"](v203)) return;
    if (v202 === 0 && v203 === 0) return;
    const v204 = v187(v199);
    let v205 = false;
    for (const v206 of v204) {
      const v207 = v92["nodes"][v206];
      if (!v207) continue;
      const v208 = (v207["x"] || 0) + v202,
        v209 = (v207["y"] || 0) + v203;
      if (v208 === v207["x"] && v209 === v207["y"]) continue;
      ((v207["x"] = v208), (v207["y"] = v209), (v205 = true));
    }
    if (!v205) return;
    (v99(), v138());
  }
  function v210(v211, v212, v213, v214) {
    if (!v212) return;
    const v215 = v211[v212];
    if (v215) {
      ((v215["dx"] += v213), (v215["dy"] += v214));
      return;
    }
    v211[v212] = { dx: v213, dy: v214 };
  }
  function v216(v217) {
    if (!v217 || typeof v217 !== "object") return;
    const v218 = {};
    for (const [v219, v220] of Object["entries"](v217)) {
      if (!v219 || !v220 || !v92["nodes"][v219]) continue;
      const v221 = Number(v220["dx"]),
        v222 = Number(v220["dy"]);
      if (!Number["isFinite"](v221) || !Number["isFinite"](v222)) continue;
      if (v221 === 0 && v222 === 0) continue;
      v218[v219] = { dx: v221, dy: v222 };
    }
    const v223 = Object["keys"](v218);
    if (v223["length"] === 0) return;
    const v224 = new Set(v223),
      v225 = {};
    for (const v226 of v223) {
      const v227 = v218[v226];
      v210(v225, v226, v227["dx"], v227["dy"]);
      const v228 = [v226];
      while (v228["length"] > 0) {
        const v229 = v228["pop"](),
          v230 = v92["_parentToChildren"][v229];
        if (!v230) continue;
        for (const v231 of v230) {
          if (!v92["nodes"][v231]) continue;
          if (v224["has"](v231)) continue;
          (v210(v225, v231, v227["dx"], v227["dy"]), v228["push"](v231));
        }
      }
    }
    let v232 = false;
    for (const [v233, v234] of Object["entries"](v225)) {
      const v235 = v92["nodes"][v233];
      if (!v235) continue;
      const v236 = (v235["x"] || 0) + v234["dx"],
        v237 = (v235["y"] || 0) + v234["dy"];
      if (v236 === v235["x"] && v237 === v235["y"]) continue;
      ((v235["x"] = v236), (v235["y"] = v237), (v232 = true));
    }
    if (!v232) return;
    (v99(), v138());
  }
  function v238(v239, v240) {
    if (!Array["isArray"](v239) || v239["length"] === 0) return;
    const v241 = v240 || null;
    let v242 = false;
    v239["forEach"]((v243) => {
      const v244 = v92["nodes"][v243];
      if (v244) {
        const v245 = v244["parentId"] || null;
        if (v245 === v241) return;
        ((v244["parentId"] = v241),
          (v244["_bizRev"] =
            (typeof v244["_bizRev"] === "number" ? v244["_bizRev"] : 0) + 1),
          v179(v243, v241, v245),
          (v242 = true));
      }
    });
    if (!v242) return;
    (v99(), v138());
  }
  function v246(v247 = {}) {
    const v248 = getFixedInputSlotConfigFromManifest(v247);
    if (!v248) return null;
    const v249 = getTargetInputPolicy(v247),
      v250 = new Set(v248["visibleSlots"] || []),
      v251 = new Set(),
      v252 = new Set(),
      v253 = {},
      v254 = new Map();
    (v248["exclusiveGroups"] || [])["forEach"]((v255) => {
      (v255["slots"] || [])["forEach"]((v256) => {
        v254["set"](v256, v255["id"]);
      });
    });
    const v257 = (v258, v259) => {
      const v260 = Number(v249?.["maxByKind"]?.[v258]),
        v261 = Number(v253[v258] || 0);
      if (!Number["isFinite"](v260) || v260 <= v259 || v261 >= v260)
        return false;
      return ((v253[v258] = v261 + 1), true);
    };
    return {
      reserveSlot(v262, v263 = null) {
        const v264 = String(v262 || "")["trim"]();
        if (v264 === "text") return true;
        const v265 = String(v263?.["refSlot"] || "")["trim"](),
          v266 = (v248["slotOrderByType"]?.[v264] || [])["filter"]((v267) =>
            v250["has"](v267),
          );
        if (v266["length"] === 0) return v257(v264, 0);
        const v268 =
          v265 && v266["includes"](v265) && v250["has"](v265)
            ? v265
            : v266["find"]((v269) => !v251["has"](v269));
        if (!v268 || v251["has"](v268)) return v257(v264, v266["length"]);
        const v270 = v254["get"](v268);
        if (v270 && v252["has"](v270)) return v257(v264, v266["length"]);
        v251["add"](v268);
        if (v270) v252["add"](v270);
        return ((v253[v264] = Number(v253[v264] || 0) + 1), v268);
      },
      reserve(v271, v272 = null) {
        return !!this["reserveSlot"](v271, v272);
      },
    };
  }
  function v273(v274) {
    const v275 = v92,
      v276 = v275["nodes"][v274];
    if (!v276) return [];
    if (!canTargetReceiveInputs(v276)) return [];
    const v277 = v276["parentId"],
      v278 = getTargetInputPolicy(v276),
      v279 = v246(v276),
      v280 = { text: 0, image: 0, video: 0, audio: 0 },
      v281 = [],
      v282 = [],
      v283 = new Set(),
      v284 = (v285, v286 = null) => {
        const v287 = resolveEffectiveInputKind(v285, v286);
        if (!v287) return "";
        if (!isInputKindAllowed(v278, v287)) return "";
        if (!hasUsableInputNodeSource(v285, { edge: v286, kind: v287 }))
          return "";
        return v287;
      };
    return (
      Object["values"](v275["edges"] || {})["forEach"]((v288) => {
        if (!v288 || v288["targetId"] !== v274) return;
        const v289 = v275["nodes"][v288["sourceId"]];
        if (!v289) return;
        if (isGroupNodeData(v289)) return;
        const v290 = v284(v289, v288);
        if (!v290) return;
        const v291 = v279 ? v279["reserveSlot"](v290, v288) : "";
        if (v279 && !v291) return;
        (v291 && typeof v291 === "string" && !v288["refSlot"]
          ? v281["push"]({ ...v288, refSlot: v291 })
          : v281["push"](v288),
          v283["add"](v288["sourceId"]),
          (v280[v290] = (v280[v290] || 0) + 1));
      }),
      Object["values"](v275["edges"] || {})["forEach"]((v292) => {
        if (!v292 || v292["targetId"] !== v274) return;
        const v293 = v275["nodes"][v292["sourceId"]];
        if (!isGroupNodeData(v293)) return;
        v281["push"](
          ...collectGroupOutputIncomingEdges({
            edge: v292,
            groupNode: v293,
            nodes: v275["nodes"],
            targetId: v274,
            policy: v278,
            counts: v280,
            directSourceIds: v283,
            acceptSource: v284,
            canAppendInputKindWithinLimit: canAppendInputKindWithinLimit,
            reserveInputSlot: v279
              ? (v294, v295) => v279["reserveSlot"](v294, v295)
              : null,
          }),
        );
      }),
      v277 &&
        Object["values"](v275["edges"] || {})["forEach"]((v296) => {
          if (!v296 || v296["targetId"] !== v277) return;
          const v297 = v275["nodes"][v296["sourceId"]];
          if (!v297) return;
          if (isGroupNodeData(v297)) {
            const v298 = collectGroupOutputIncomingEdges({
              edge: v296,
              groupNode: v297,
              nodes: v275["nodes"],
              targetId: v274,
              policy: v278,
              counts: v280,
              directSourceIds: v283,
              acceptSource: v284,
              canAppendInputKindWithinLimit: canAppendInputKindWithinLimit,
              reserveInputSlot: v279
                ? (v299, v300) => v279["reserveSlot"](v299, v300)
                : null,
            });
            v282["push"](
              ...v298["map"]((v301) => ({
                ...v301,
                isGroupShared: true,
                sharedGroupId: v277,
              })),
            );
            return;
          }
          const v302 = v284(v297, v296);
          if (!v302) return;
          if (!canAppendInputKindWithinLimit(v278, v302, v280)) return;
          const v303 = v279 ? v279["reserveSlot"](v302, v296) : "";
          if (v279 && !v303) return;
          (v282["push"]({
            ...v296,
            ...(v303 && typeof v303 === "string" && !v296["refSlot"]
              ? { refSlot: v303 }
              : null),
            isGroupShared: true,
            sharedGroupId: v277,
            effectiveTargetId: v274,
          }),
            (v280[v302] = (v280[v302] || 0) + 1));
        }),
      [...v281, ...v282]["map"]((v304) => cloneEdgeSnapshot(v304))
    );
  }
  function v305(v306) {
    const v307 = new Set(v306),
      v308 = [];
    for (const v309 of v306) {
      const v310 = v92["nodes"][v309];
      if (!v310) continue;
      v308["push"]({ id: v309, parentId: v310["parentId"] || null });
    }
    for (const v311 of v306) {
      delete v92["nodes"][v311];
    }
    v92["_nodeCount"] = Object["keys"](v92["nodes"])["length"];
    for (const { id: v312, parentId: v313 } of v308) {
      v183(v312, v313);
    }
    let v314 = false;
    for (const v315 of Object["keys"](v92["edges"])) {
      const v316 = v92["edges"][v315];
      (v307["has"](v316["sourceId"]) || v307["has"](v316["targetId"])) &&
        (delete v92["edges"][v315], (v314 = true));
    }
    if (v314) v100();
    (v99(), v138());
  }
  function v317(v318) {
    if (!v318 || !v318["id"])
      throw new Error("[store] addEdge() 需要提供含有 id 字段的连线数据");
    ((v92["edges"][v318["id"]] = {
      isThumbnailActive: true,
      type: null,
      ...v318,
    }),
      v100(),
      v99(),
      v138());
  }
  function v319(v320, v321) {
    (v320["forEach"]((v322) => {
      if (v92["edges"][v322]) delete v92["edges"][v322];
    }),
      v321["forEach"]((v323) => {
        const {
          isGroupShared: v324,
          sharedGroupId: v325,
          effectiveTargetId: v326,
          ...v327
        } = v323 || {};
        if (!v327["id"]) return;
        v92["edges"][v327["id"]] = v327;
      }),
      v100(),
      v99(),
      v138());
  }
  function v328(v329, v330, v331) {
    const v332 = v92["viewport"] || {};
    if (v332["x"] === v329 && v332["y"] === v330 && v332["zoom"] === v331)
      return;
    const v333 = v332["zoom"];
    v92["viewport"] = { x: v329, y: v330, zoom: v331 };
    if (v333 !== v331) {
      if (v98()) v99();
    }
    v138();
  }
  function v334() {
    (v99(), v138());
  }
  function v335(v336, v337) {
    const v338 = v92["nodes"][v336];
    if (!v338)
      throw new Error(
        '[store] updateNodeData() 找不到 id 为 "' + v336 + '" 的节点',
      );
    const v339 = JSON["parse"](JSON["stringify"](v337)),
      { _bizRev: v340, ...v341 } = v339;
    v341["cells"] &&
      Array["isArray"](v341["cells"]) &&
      (v341["cells"] = v341["cells"]["map"]((v342) => ({ ...v342 })));
    const v343 = sanitizeCanvasNodeMediaPatchForStore(v341, v338),
      v344 = v103(v338, v343);
    if (_isPatchNoop(v338, v344)) return;
    const v345 = Object["prototype"]["hasOwnProperty"]["call"](v344, "parentId")
      ? v344["parentId"]
      : v338["parentId"];
    captureFeatureSelectionsFromNodePatch(
      v338,
      v344,
      v92["ui"]?.["featureSelections"] || {},
    );
    const v346 =
      (typeof v338["_bizRev"] === "number" ? v338["_bizRev"] : 0) + 1;
    ((v92["nodes"][v336] = { ...v338, ...v344, _bizRev: v346 }),
      v345 !== v338["parentId"] && v179(v336, v345, v338["parentId"]),
      v99(),
      v138());
  }
  function v347(v348) {
    let v349 = false;
    for (const [v350, v351] of Object["entries"](v348)) {
      const v352 = v92["nodes"][v350];
      if (v352) {
        const v353 = JSON["parse"](JSON["stringify"](v351)),
          { _bizRev: v354, ...v355 } = v353;
        v355["cells"] &&
          Array["isArray"](v355["cells"]) &&
          (v355["cells"] = v355["cells"]["map"]((v356) => ({ ...v356 })));
        const v357 = sanitizeCanvasNodeMediaPatchForStore(v355, v352),
          v358 = v103(v352, v357);
        if (_isPatchNoop(v352, v358)) continue;
        const v359 = Object["prototype"]["hasOwnProperty"]["call"](
          v358,
          "parentId",
        )
          ? v358["parentId"]
          : v352["parentId"];
        captureFeatureSelectionsFromNodePatch(
          v352,
          v358,
          v92["ui"]?.["featureSelections"] || {},
        );
        const v360 =
          (typeof v352["_bizRev"] === "number" ? v352["_bizRev"] : 0) + 1;
        ((v92["nodes"][v350] = { ...v352, ...v358, _bizRev: v360 }),
          v359 !== v352["parentId"] && v179(v350, v359, v352["parentId"]),
          (v349 = true));
      }
    }
    v349 && (v99(), v138());
  }
  function v361(v362, v363, v364, v365) {
    const v366 = v92["nodes"][v362],
      v367 = v92["nodes"][v364],
      v368 = Number(v363),
      v369 = Number(v365);
    if (
      !_isValidStoryboardCellTarget(v366, v368) ||
      !_isValidStoryboardCellTarget(v367, v369)
    )
      return false;
    if (v362 === v364 && v368 === v369) return false;
    const v370 = v366["cells"]["slice"](),
      v371 = v366["cells"][v368],
      v372 = v367["cells"][v369];
    if (v362 === v364)
      ((v370[v369] = _placeStoryboardCellForSwap(
        cloneStoryboardCellForSwapDestination(v371),
        v371,
        v366,
        v368,
        v366,
        v369,
      )),
        (v370[v368] = _placeStoryboardCellForSwap(
          cloneStoryboardCellForSwapDestination(v372),
          v372,
          v366,
          v369,
          v366,
          v368,
        )),
        (v92["nodes"][v362] = {
          ...v366,
          cells: v370,
          _bizRev:
            (typeof v366["_bizRev"] === "number" ? v366["_bizRev"] : 0) + 1,
        }));
    else {
      const v373 = v367["cells"]["slice"]();
      ((v373[v369] = _placeStoryboardCellForSwap(
        cloneStoryboardCellForSwapDestination(v371),
        v371,
        v366,
        v368,
        v367,
        v369,
      )),
        (v370[v368] = normalizeEmptyStoryboardCell({
          ...cloneStoryboardCellForSwap(v371),
          ..._getStoryboardCellPosition(v366, v368),
        })),
        (v92["nodes"][v362] = {
          ...v366,
          cells: v370,
          _bizRev:
            (typeof v366["_bizRev"] === "number" ? v366["_bizRev"] : 0) + 1,
        }),
        (v92["nodes"][v364] = {
          ...v367,
          cells: v373,
          _bizRev:
            (typeof v367["_bizRev"] === "number" ? v367["_bizRev"] : 0) + 1,
        }));
    }
    return (v99(), v138(), true);
  }
  function v374(v375, v376) {
    const v377 = v92["nodes"][v375];
    if (!v377) return;
    if (v377["name"] === v376) return;
    const v378 =
      (typeof v377["_bizRev"] === "number" ? v377["_bizRev"] : 0) + 1;
    ((v92["nodes"][v375] = { ...v377, name: v376, _bizRev: v378 }),
      v99(),
      v138());
  }
  function v379(v380) {
    v92["edges"][v380] && (delete v92["edges"][v380], v100(), v99(), v138());
  }
  function v381(v382, v383, v384, v385) {
    ((v92["picker"] = {
      visible: true,
      x: v384,
      y: v385,
      screenX: v382,
      screenY: v383,
    }),
      v138());
  }
  function v386() {
    if (v92["picker"]?.["visible"] === false) return;
    ((v92["picker"] = { ...v92["picker"], visible: false }), v138());
  }
  function v387() {
    return deepClone(v92);
  }
  function v388() {
    return v92;
  }
  function v389(v390) {
    if (!v390) return;
    v92["nodes"] = deepClone(v390["nodes"] ?? {});
    for (const [v391, v392] of Object["entries"](v92["nodes"])) {
      v92["nodes"][v391] = applyFeatureSelectionsToNodeData(
        v392,
        v92["ui"]?.["featureSelections"] || {},
      );
    }
    (normalizeNodesCollection(v92["nodes"]),
      (v92["edges"] = deepClone(v390["edges"] ?? {})),
      (v92["viewport"] = deepClone(
        v390["viewport"] ?? { x: 0, y: 0, zoom: 1 },
      )),
      (v92["_nodeCount"] = Object["keys"](v92["nodes"])["length"]));
    for (const v393 of Object["values"](v92["nodes"])) {
      if (!v393 || typeof v393 !== "object") continue;
      if (typeof v393["_bizRev"] !== "number") v393["_bizRev"] = 1;
    }
    v92["_parentToChildren"] = {};
    for (const [v394, v395] of Object["entries"](v92["nodes"])) {
      v395["parentId"] && v179(v394, v395["parentId"]);
    }
    (v100(), v99(), v138());
  }
  function v396() {
    const v397 = {};
    for (const [v398, v399] of Object["entries"](v92["nodes"] || {})) {
      v397[v398] = cloneNodeSnapshot(v399, { stripPanoramaViewport: true });
    }
    const v400 = {};
    for (const [v401, v402] of Object["entries"](v92["edges"] || {})) {
      v400[v401] = cloneEdgeSnapshot(v402);
    }
    return { nodes: v397, edges: v400 };
  }
  function v403(v404) {
    if (!v404) return;
    const v405 = v92["nodes"] || {},
      v406 = deepClone(v404["nodes"] ?? {});
    for (const [v407, v408] of Object["entries"](v406)) {
      if (!v408 || typeof v408 !== "object") continue;
      const v409 = v405[v407];
      if (v408["type"] === "panorama-scene") {
        const v410 = v409?.["sceneNode"]?.["viewport"];
        v410 &&
          (v408["sceneNode"] = {
            ...(v408["sceneNode"] || {}),
            viewport: deepClone(v410),
          });
      } else {
        if (v408["type"] === "panorama-360") {
          const v411 = v409?.["panorama360Node"]?.["viewport"];
          v411 &&
            (v408["panorama360Node"] = {
              ...(v408["panorama360Node"] || {}),
              viewport: deepClone(v411),
            });
        } else
          v408["type"] === "ai-image" &&
            normalizeAiImageRunningHistorySnapshot(v408);
      }
    }
    v389({
      ...v404,
      nodes: v406,
      viewport: cloneViewportSnapshot(v92["viewport"]),
    });
  }
  function v412(v413) {
    const v414 = Object["values"](v92["edges"])["filter"](
      (v415) => v415["targetId"] === v413,
    );
    return v414["map"]((v416) => v92["nodes"][v416["sourceId"]])["filter"](
      (v417) => !!v417,
    );
  }
  function v418(v419, v420) {
    if (!v420 || typeof v420 !== "object") return false;
    for (const [v421, v422] of Object["entries"](v420)) {
      if (v419?.[v421] !== v422) return true;
    }
    return false;
  }
  function v423(v424, v425) {
    if (v424 === v425) return true;
    if (!Array["isArray"](v424) || !Array["isArray"](v425)) return false;
    if (v424["length"] !== v425["length"]) return false;
    for (let v426 = 0; v426 < v424["length"]; v426 += 1) {
      if (!Object["is"](v424[v426], v425[v426])) return false;
    }
    return true;
  }
  function v427(v428, v429) {
    if (v428 === v429) return true;
    if (
      !v428 ||
      !v429 ||
      typeof v428 !== "object" ||
      typeof v429 !== "object" ||
      Array["isArray"](v428) ||
      Array["isArray"](v429)
    )
      return false;
    const v430 = Object["keys"](v428),
      v431 = Object["keys"](v429);
    if (v430["length"] !== v431["length"]) return false;
    for (const v432 of v430) {
      if (!Object["prototype"]["hasOwnProperty"]["call"](v429, v432))
        return false;
      const v433 = v428[v432],
        v434 = v429[v432];
      if (Array["isArray"](v433) || Array["isArray"](v434)) {
        if (!v423(v433, v434)) return false;
      } else {
        if (!Object["is"](v433, v434)) return false;
      }
    }
    return true;
  }
  function v435(v436) {
    if (!v436 || typeof v436 !== "object") return;
    if (!v418(v92["selectionBox"], v436)) return;
    ((v92["selectionBox"] = { ...v92["selectionBox"], ...v436 }), v138());
  }
  function v437(v438) {
    const v439 = v438 || {};
    if (!v418(v92["selectionMeta"], v439)) return;
    ((v92["selectionMeta"] = { ...v92["selectionMeta"], ...v439 }), v138());
  }
  function v440(v441) {
    const v442 = Array["from"](v441 || []);
    if (v423(v92["selectedNodeIds"], v442)) return;
    ((v92["selectedNodeIds"] = v442), v138());
  }
  function v443() {
    const v444 = v92["selectionBox"]?.["active"] === true,
      v445 = Array["isArray"](v92["selectedNodeIds"])
        ? v92["selectedNodeIds"]["length"] > 0
        : false,
      v446 = v92["selectionMeta"]?.["source"] != null;
    if (!v444 && !v445 && !v446) return;
    ((v92["selectionBox"]["active"] = false),
      (v92["selectedNodeIds"] = []),
      (v92["selectionMeta"]["source"] = null),
      v138());
  }
  function v447(v448, v449, v450) {
    ((v92["contextMenu"] = { visible: true, x: v448, y: v449, items: v450 }),
      v138());
  }
  function v451() {
    ((v92["contextMenu"] = { visible: false, x: 0, y: 0, items: [] }), v138());
  }
  function v452({
    srcId: v453,
    invalidNodeIds: v454,
    hoverId: v455,
    side: v456,
  }) {
    const v457 = {
      srcId: v453 !== undefined ? v453 : v92["connOverlay"]["srcId"],
      invalidNodeIds:
        v454 !== undefined
          ? Array["isArray"](v454)
            ? v454
            : []
          : v92["connOverlay"]["invalidNodeIds"],
      hoverId: v455 !== undefined ? v455 : v92["connOverlay"]["hoverId"],
      side: v456 !== undefined ? v456 : v92["connOverlay"]["side"],
    };
    if (v427(v92["connOverlay"], v457)) return;
    ((v92["connOverlay"] = v457), v138());
  }
  function v458() {
    const v459 = { srcId: null, invalidNodeIds: [], hoverId: null, side: null };
    if (v427(v92["connOverlay"], v459)) return;
    ((v92["connOverlay"] = v459), v138());
  }
  function v460() {
    const v461 = Object["values"](v92["nodes"] || {})["map"]((v462) =>
        cloneNodeSnapshot(v462, { stripRichText: true }),
      ),
      v463 = Object["values"](v92["edges"] || {})["map"]((v464) =>
        cloneEdgeSnapshot(v464),
      ),
      v465 = {
        nodes: v461,
        edges: v463,
        viewport: cloneViewportSnapshot(v92["viewport"]),
        assets: Array["isArray"](v92["assets"])
          ? v92["assets"]["map"]((v466) => cloneAssetSnapshot(v466))
          : [],
      };
    return sanitizeSerializedCanvasData(v465);
  }
  function v467(
    v468,
    { preserveLiveGeneration: preserveLiveGeneration = false } = {},
  ) {
    if (!v468) return;
    const v469 = Date["now"](),
      v470 = v92["ui"]?.["featureSelections"] || {};
    v468["viewport"] &&
      (v92["viewport"] = cloneViewportSnapshot(v468["viewport"]));
    ((v92["nodes"] = {}), (v92["_parentToChildren"] = {}));
    let v471 = 0;
    if (Array["isArray"](v468["nodes"]))
      v468["nodes"]["forEach"]((v472) => {
        if (!v472 || typeof v472 !== "object") return;
        const v473 = cloneNodeSnapshot(v472, {
          hydratedAt: v469,
          featureSelections: v470,
          preserveLiveGeneration: preserveLiveGeneration,
        });
        ((v92["nodes"][v473["id"]] = v473),
          (v471 += 1),
          v473["parentId"] && v179(v473["id"], v473["parentId"]));
      });
    else {
      if (v468["nodes"] && typeof v468["nodes"] === "object")
        for (const [v474, v475] of Object["entries"](v468["nodes"])) {
          if (!v475 || typeof v475 !== "object") continue;
          const v476 = cloneNodeSnapshot(
            v475["id"] ? v475 : { ...v475, id: v474 },
            {
              hydratedAt: v469,
              featureSelections: v470,
              preserveLiveGeneration: preserveLiveGeneration,
            },
          );
          ((v92["nodes"][v474] = v476),
            (v471 += 1),
            v476["parentId"] && v179(v474, v476["parentId"]));
        }
    }
    v92["_nodeCount"] = v471;
    const v477 = {};
    if (Array["isArray"](v468["edges"]))
      for (const v478 of v468["edges"]) {
        if (!v478 || typeof v478 !== "object") continue;
        v477[v478["id"]] = cloneEdgeSnapshot(v478);
      }
    else {
      if (v468["edges"] && typeof v468["edges"] === "object")
        for (const [v479, v480] of Object["entries"](v468["edges"])) {
          if (!v480 || typeof v480 !== "object") continue;
          const v481 = cloneEdgeSnapshot(v480);
          if (v481["id"] == null) v481["id"] = v479;
          v477[v481["id"]] = v481;
        }
    }
    ((v92["edges"] = v477),
      v100(),
      (v92["assets"] = Array["isArray"](v468["assets"])
        ? v468["assets"]["map"]((v482) => cloneAssetSnapshot(v482))
        : []),
      v99(),
      v138());
  }
  function v483(v484, v485 = {}) {
    v467(v484, v485);
  }
  function v486(v487) {
    if (!v487) return;
    const v488 = deepClone(v487);
    v467(v488);
  }
  function v489({
    active: v490,
    sourceNodeId: sourceNodeId = null,
    handleDirection: handleDirection = null,
    hoverNodeId: hoverNodeId = null,
  }) {
    ((v92["pickConnectMode"] = {
      active: v490,
      sourceNodeId: sourceNodeId,
      handleDirection: handleDirection,
      hoverNodeId: hoverNodeId,
    }),
      v138());
  }
  function v491(v492) {
    if (v92["isServerConnected"] === v492) return;
    ((v92["isServerConnected"] = v492), v138());
  }
  function v493(v494) {
    if (!v92["pickConnectMode"] || !v92["pickConnectMode"]["active"]) return;
    if (v92["pickConnectMode"]["hoverNodeId"] === v494) return;
    ((v92["pickConnectMode"] = {
      ...v92["pickConnectMode"],
      hoverNodeId: v494,
    }),
      v138());
  }
  function v495(v496) {
    const v497 = v92["annotate"] || {},
      v498 = v496 || {};
    if (!v418(v497, v498)) return;
    const v499 = { ...v497, ...v498 };
    ((v92["annotate"] = v499), v138());
  }
  function v500(v501) {
    const v502 = v92["matting"] || {},
      v503 = v501 || {};
    if (!v418(v502, v503)) return;
    const v504 = { ...v502, ...v503 };
    ((v92["matting"] = v504), v138());
  }
  function v505(v506) {
    const v507 = v92["videoKeying"] || {},
      v508 = v506 || {};
    if (!v418(v507, v508)) return;
    const v509 = { ...v507, ...v508 };
    ((v92["videoKeying"] = v509), v138());
  }
  function v510(v511) {
    const v512 = v92["videoClip"] || {},
      v513 = v511 || {};
    if (!v418(v512, v513)) return;
    const v514 = { ...v512, ...v513 };
    ((v92["videoClip"] = v514), v138());
  }
  function v515(v516) {
    if (v92["theme"] === v516) return;
    ((v92["theme"] = v516), v138());
  }
  function v517() {
    const v518 = v92["theme"] === "dark" ? "light" : "dark";
    v515(v518);
  }
  function v519(v520 = "dark") {
    const v521 = v520 === "light" ? "light" : "dark";
    v92["theme"] = v521;
  }
  function v522(v523 = {}) {
    if (!v92["ui"]) v92["ui"] = {};
    v92["ui"]["featureSelections"] = sanitizeFeatureSelectionsRecord(v523);
  }
  function v524(v525, v526, v527 = undefined) {
    const v528 = String(v525 || "")["trim"](),
      v529 = String(v526 || "")["trim"]();
    if (!v528 || !v529) return v527;
    const v530 = v92["ui"]?.["featureSelections"]?.[v528]?.[v529];
    return v530 === undefined ? v527 : v530;
  }
  function v531(v532, v533, v534) {
    const v535 = String(v532 || "")["trim"](),
      v536 = String(v533 || "")["trim"]();
    if (!v535 || !v536) return;
    if (!v92["ui"]) v92["ui"] = {};
    (!v92["ui"]["featureSelections"] ||
      typeof v92["ui"]["featureSelections"] !== "object") &&
      (v92["ui"]["featureSelections"] = {});
    const v537 = v92["ui"]["featureSelections"][v535] || {};
    if (v537[v536] === v534) return;
    ((v92["ui"]["featureSelections"] = {
      ...v92["ui"]["featureSelections"],
      [v535]: { ...v537, [v536]: v534 },
    }),
      v138());
  }
  function v538(v539) {
    const v540 = v539 === true;
    if (v92["ui"] && v92["ui"]["showVideoMeta"] === v540) return;
    if (!v92["ui"]) v92["ui"] = {};
    ((v92["ui"]["showVideoMeta"] = v540), v138());
  }
  function v541(v542) {
    const v543 = v542 === true;
    if (v92["ui"] && v92["ui"]["titleFollowsCanvasZoom"] === v543) return;
    if (!v92["ui"]) v92["ui"] = {};
    ((v92["ui"]["titleFollowsCanvasZoom"] = v543), v138());
  }
  function v544(v545) {
    const v546 = v545 !== false;
    if (v92["ui"] && v92["ui"]["promptBoxResizeEnabled"] === v546) return;
    if (!v92["ui"]) v92["ui"] = {};
    ((v92["ui"]["promptBoxResizeEnabled"] = v546), v138());
  }
  function v547(v548) {
    const v549 = v548 === true;
    if (v92["ui"] && v92["ui"]["imageVideoNodeResizeEnabled"] === v549) return;
    if (!v92["ui"]) v92["ui"] = {};
    ((v92["ui"]["imageVideoNodeResizeEnabled"] = v549), v138());
  }
  function v550(v551, v552, v553, v554) {
    const v555 = v553(v552);
    if (!v92["ui"]) v92["ui"] = {};
    if (v554(v92["ui"][v551]) === v554(v555)) return;
    ((v92["ui"][v551] = v555), v138());
  }
  function v556(v557) {
    v550(
      "imageToolbarLayout",
      v557,
      normalizeImageToolbarLayout,
      serializeImageToolbarLayout,
    );
  }
  function v558(v559) {
    v550(
      "videoToolbarLayout",
      v559,
      normalizeVideoToolbarLayout,
      serializeVideoToolbarLayout,
    );
  }
  function v560(v561) {
    const v562 = v561 !== false;
    if (v92["ui"] && v92["ui"]["alignFeatureEnabled"] === v562) return;
    if (!v92["ui"]) v92["ui"] = {};
    v92["ui"]["alignFeatureEnabled"] = v562;
    if (!v562)
      ((v92["ui"]["alignFeatureTriggerMode"] = "off"),
        (v92["ui"]["alignPanelVisible"] = false),
        (v92["ui"]["alignPanelAnchorWorld"] = null));
    else
      v92["ui"]["alignFeatureTriggerMode"] === "off" &&
        (v92["ui"]["alignFeatureTriggerMode"] = "click");
    v138();
  }
  function v563(v564) {
    const v565 =
      v564 === "hold" || v564 === "click" || v564 === "off" ? v564 : "click";
    if (!v92["ui"]) v92["ui"] = {};
    if (v92["ui"]["alignFeatureTriggerMode"] === v565) return;
    ((v92["ui"]["alignFeatureTriggerMode"] = v565),
      (v92["ui"]["alignFeatureEnabled"] = v565 !== "off"),
      v565 === "off" &&
        ((v92["ui"]["alignPanelVisible"] = false),
        (v92["ui"]["alignPanelAnchorWorld"] = null)),
      v138());
  }
  function v566(v567) {
    const v568 = Number(v567),
      v569 = Number["isFinite"](v568)
        ? Math["max"](0, Math["min"](200, Math["round"](v568)))
        : 40;
    if (v92["ui"] && v92["ui"]["alignDistributeGap"] === v569) return;
    if (!v92["ui"]) v92["ui"] = {};
    ((v92["ui"]["alignDistributeGap"] = v569), v138());
  }
  function v570(v571) {
    const v572 = v571 === true;
    if (!v92["ui"]) v92["ui"] = {};
    if (!v572) {
      const v573 = !!v92["ui"]["alignPanelAnchorWorld"];
      if (v92["ui"]["alignPanelVisible"] === v572 && !v573) return;
      ((v92["ui"]["alignPanelVisible"] = false),
        (v92["ui"]["alignPanelAnchorWorld"] = null),
        v138());
      return;
    }
    if (v92["ui"]["alignPanelVisible"] === v572) return;
    ((v92["ui"]["alignPanelVisible"] = v572), v138());
  }
  function v574(v575) {
    if (!v92["ui"]) v92["ui"] = {};
    let v576 = null;
    v575 &&
      Number["isFinite"](v575["x"]) &&
      Number["isFinite"](v575["y"]) &&
      (v576 = { x: Number(v575["x"]), y: Number(v575["y"]) });
    const v577 = v92["ui"]["alignPanelAnchorWorld"],
      v578 =
        (!v577 && !v576) ||
        (v577 &&
          v576 &&
          Number(v577["x"]) === Number(v576["x"]) &&
          Number(v577["y"]) === Number(v576["y"]));
    if (v578) return;
    ((v92["ui"]["alignPanelAnchorWorld"] = v576), v138());
  }
  function v579(v580) {
    const v581 = v580 !== false;
    if (v92["ui"] && v92["ui"]["snapGuidesEnabled"] === v581) return;
    if (!v92["ui"]) v92["ui"] = {};
    ((v92["ui"]["snapGuidesEnabled"] = v581), v138());
  }
  function v582(v583) {
    const v584 = v583 !== false;
    if (v92["ui"] && v92["ui"]["selectionRelatedHighlightEnabled"] === v584)
      return;
    if (!v92["ui"]) v92["ui"] = {};
    ((v92["ui"]["selectionRelatedHighlightEnabled"] = v584), v138());
  }
  function v585(v586) {
    const v587 = String(v586 || "")["trim"]();
    return ["white", "blue", "green", "cyan", "purple", "red", "yellow"][
      "includes"
    ](v587)
      ? v587
      : "white";
  }
  function v588(v589) {
    const v590 = v585(v589);
    if (v92["ui"] && v92["ui"]["selectionRelatedHighlightColor"] === v590)
      return;
    if (!v92["ui"]) v92["ui"] = {};
    ((v92["ui"]["selectionRelatedHighlightColor"] = v590), v138());
  }
  function v591(v592) {
    const v593 = v592 !== false;
    if (v92["ui"] && v92["ui"]["connectionLinesVisible"] === v593) return;
    if (!v92["ui"]) v92["ui"] = {};
    ((v92["ui"]["connectionLinesVisible"] = v593), v138());
  }
  function v594(v595 = {}) {
    const v596 = v595?.["showVideoMeta"] === true,
      v597 = v595?.["titleFollowsCanvasZoom"] === true,
      v598 = v595?.["promptBoxResizeEnabled"] !== false,
      v599 = v595?.["imageVideoNodeResizeEnabled"] === true,
      v600 = v595?.["selectionRelatedHighlightEnabled"] !== false,
      v601 = v585(v595?.["selectionRelatedHighlightColor"]),
      v602 = v595?.["connectionLinesVisible"] !== false,
      v603 = String(v595?.["alignFeatureTriggerMode"] || "")["trim"](),
      v604 =
        v603 === "hold" || v603 === "click" || v603 === "off"
          ? v603
          : v595?.["alignFeatureEnabled"] === false
            ? "off"
            : "click",
      v605 = v595?.["alignFeatureEnabled"] === false ? false : v604 !== "off",
      v606 = Number(v595?.["alignDistributeGap"]),
      v607 = Number["isFinite"](v606)
        ? Math["max"](0, Math["min"](200, Math["round"](v606)))
        : 40,
      v608 = v595?.["snapGuidesEnabled"] !== false;
    if (!v92["ui"]) v92["ui"] = {};
    ((v92["ui"]["showVideoMeta"] = v596),
      (v92["ui"]["titleFollowsCanvasZoom"] = v597),
      (v92["ui"]["promptBoxResizeEnabled"] = v598),
      (v92["ui"]["imageVideoNodeResizeEnabled"] = v599),
      (v92["ui"]["imageToolbarLayout"] = normalizeImageToolbarLayout(
        v595?.["imageToolbarLayout"],
      )),
      (v92["ui"]["videoToolbarLayout"] = normalizeVideoToolbarLayout(
        v595?.["videoToolbarLayout"],
      )),
      (v92["ui"]["selectionRelatedHighlightEnabled"] = v600),
      (v92["ui"]["selectionRelatedHighlightColor"] = v601),
      (v92["ui"]["connectionLinesVisible"] = v602),
      (v92["ui"]["alignFeatureEnabled"] = v605),
      (v92["ui"]["alignFeatureTriggerMode"] = v604),
      (v92["ui"]["alignDistributeGap"] = v607),
      (v92["ui"]["alignPanelVisible"] = false),
      (v92["ui"]["alignPanelAnchorWorld"] = null),
      (v92["ui"]["snapGuidesEnabled"] = v608),
      v522(v595?.["featureSelections"] || {}),
      v138());
  }
  function v609(v610) {
    const v611 = v92["subscription"] || {};
    ((v92["subscription"] = { ...v611, ...(v610 || {}) }), v138());
  }
  function v612(v613) {
    if (!v613 || !v613["id"])
      throw new Error(
        "[store]\x20addAsset()\x20需要提供含有\x20id\x20字段的资产数据",
      );
    const v614 = JSON["parse"](JSON["stringify"](v613));
    if (!v92["assets"]) v92["assets"] = [];
    (v92["assets"]["unshift"](v614), v99(), v138());
  }
  function v615(v616) {
    if (!v92["assets"]) return;
    const v617 = v92["assets"]["length"];
    ((v92["assets"] = v92["assets"]["filter"]((v618) => v618["id"] !== v616)),
      v92["assets"]["length"] !== v617 && (v99(), v138()));
  }
  function v619(v620, v621) {
    if (!v92["assets"]) return;
    const v622 = v92["assets"]["findIndex"]((v623) => v623["id"] === v620);
    if (v622 !== -1) {
      const v624 = v92["assets"][v622],
        v625 = { ...v624, ...v621 };
      if (shallowEqual(v624, v625)) return;
      ((v92["assets"][v622] = v625), v99(), v138());
    }
  }
  function v626() {
    ((!v92["workflows"] || typeof v92["workflows"] !== "object") &&
      (v92["workflows"] = {
        items: [],
        loading: false,
        error: null,
        loadedAt: 0,
      }),
      !Array["isArray"](v92["workflows"]["items"]) &&
        (v92["workflows"]["items"] = []),
      (!v92["workflowUi"] || typeof v92["workflowUi"] !== "object") &&
        (v92["workflowUi"] = createInitialWorkflowUiState()));
  }
  function v627(v628, v629 = null) {
    (v626(),
      (v92["workflows"] = {
        ...v92["workflows"],
        loading: v628 === true,
        error: v629 == null ? null : String(v629),
      }),
      v138());
  }
  function v630(v631) {
    (v626(),
      (v92["workflows"] = {
        ...v92["workflows"],
        items: Array["isArray"](v631)
          ? v631["map"]((v632) => cloneWorkflowSnapshot(v632))
          : [],
        loading: false,
        error: null,
        loadedAt: Date["now"](),
      }),
      v138());
  }
  function v633(v634) {
    if (!v634 || !v634["id"]) return;
    v626();
    const v635 = cloneWorkflowSnapshot(v634),
      v636 = v92["workflows"]["items"]["findIndex"](
        (v637) => v637?.["id"] === v635["id"],
      );
    (v636 >= 0
      ? (v92["workflows"]["items"][v636] = {
          ...v92["workflows"]["items"][v636],
          ...v635,
        })
      : v92["workflows"]["items"]["unshift"](v635),
      v138());
  }
  function v638(v639, v640) {
    const v641 = String(v639 || "")["trim"]();
    if (!v641 || !v640 || typeof v640 !== "object") return;
    v626();
    const v642 = v92["workflows"]["items"]["findIndex"](
      (v643) => v643?.["id"] === v641,
    );
    if (v642 < 0) return;
    ((v92["workflows"]["items"][v642] = {
      ...v92["workflows"]["items"][v642],
      ...cloneWorkflowSnapshot(v640),
    }),
      v138());
  }
  function v644(v645, v646 = Date["now"]()) {
    v638(v645, { lastUsedAt: v646 });
  }
  function v647(v648) {
    if (!v648 || typeof v648 !== "object") return;
    v626();
    const v649 = { ...v92["workflowUi"] };
    for (const [v650, v651] of Object["entries"](v648)) {
      v650 === "draft" && v651 && typeof v651 === "object"
        ? (v649["draft"] = { ...v649["draft"], ...cloneWorkflowSnapshot(v651) })
        : (v649[v650] = cloneWorkflowSnapshot(v651));
    }
    ((v92["workflowUi"] = v649), v138());
  }
  function v652(v653) {
    if (!v653 || typeof v653 !== "object") return;
    (v626(),
      (v92["workflowUi"] = {
        ...v92["workflowUi"],
        draft: {
          ...(v92["workflowUi"]["draft"] || createInitialWorkflowDraftState()),
          ...cloneWorkflowSnapshot(v653),
        },
      }),
      v138());
  }
  function v654(v655 = {}) {
    (v626(),
      (v92["workflowUi"] = {
        ...v92["workflowUi"],
        draft: {
          ...createInitialWorkflowDraftState(),
          ...cloneWorkflowSnapshot(v655),
        },
        tagDraft: "",
        updateConfirmOpen: false,
        error: null,
      }),
      v138());
  }
  function v656({
    tab: tab = "create",
    sourceGroupId: sourceGroupId = null,
  } = {}) {
    (v626(),
      (v92["workflowUi"] = {
        ...v92["workflowUi"],
        modalOpen: true,
        modalTab: tab === "update" ? "update" : "create",
        sourceGroupId:
          sourceGroupId == null
            ? null
            : String(sourceGroupId || "")["trim"]() || null,
        draft: createInitialWorkflowDraftState(),
        tagDraft: "",
        updateTargetId: null,
        updateSearchKeyword: "",
        updateConfirmOpen: false,
        saving: false,
        error: null,
      }),
      v138());
  }
  function v657() {
    (v626(),
      (v92["workflowUi"] = {
        ...v92["workflowUi"],
        modalOpen: false,
        modalTab: "create",
        sourceGroupId: null,
        draft: createInitialWorkflowDraftState(),
        tagDraft: "",
        updateTargetId: null,
        updateSearchKeyword: "",
        updateConfirmOpen: false,
        saving: false,
        error: null,
      }),
      v138());
  }
  function v658(v659) {
    v647({ saving: v659 === true });
  }
  function v660(v661) {
    const v662 = v661 == null ? null : String(v661);
    v647({ applyingWorkflowId: v662 || null });
  }
  return {
    subscribe: v151,
    subscribeRaw: v155,
    subscribeSelector: v159,
    batch: v147,
    requestRender: v149,
    invalidateUi: v150,
    addNode: v168,
    updateNodePosition: v194,
    moveNodes: v198,
    moveNodesByOffsets: v216,
    deleteNodes: v305,
    updateNodeData: v335,
    updateNodesData: v347,
    swapStoryboardCells: v361,
    addEdge: v317,
    removeEdge: v379,
    updateEdgesBatch: v319,
    updateViewport: v328,
    setViewportPersistPolicy: v101,
    markViewportPersist: v334,
    showPicker: v381,
    hidePicker: v386,
    loadState: v389,
    loadHistorySnapshot: v403,
    getState: v387,
    getStateRaw: v388,
    getHistorySnapshot: v396,
    getSourcesForNode: v412,
    setSelectionBox: v435,
    setSelectionMeta: v437,
    setSelectedNodes: v440,
    groupNodes: v238,
    getIncomingEdges: v273,
    renameNode: v374,
    clearSelection: v443,
    showContextMenu: v447,
    hideContextMenu: v451,
    setConnOverlay: v452,
    clearConnOverlay: v458,
    setPickConnectMode: v489,
    setPickConnectHover: v493,
    setServerConnection: v491,
    setAnnotateState: v495,
    setMattingState: v500,
    setVideoKeyingState: v505,
    setVideoClipState: v510,
    setTheme: v515,
    toggleTheme: v517,
    initTheme: v519,
    setFeatureSelection: v531,
    getFeatureSelection: v524,
    initFeatureSelections: v522,
    setShowVideoMeta: v538,
    setTitleFollowsCanvasZoom: v541,
    setPromptBoxResizeEnabled: v544,
    setImageVideoNodeResizeEnabled: v547,
    setImageToolbarLayout: v556,
    setVideoToolbarLayout: v558,
    setAlignFeatureEnabled: v560,
    setAlignFeatureTriggerMode: v563,
    setAlignDistributeGap: v566,
    setAlignPanelVisible: v570,
    setAlignPanelAnchorWorld: v574,
    setSnapGuidesEnabled: v579,
    setSelectionRelatedHighlightEnabled: v582,
    setSelectionRelatedHighlightColor: v588,
    setConnectionLinesVisible: v591,
    setSubscriptionState: v609,
    initUiPrefs: v594,
    addAsset: v612,
    deleteAsset: v615,
    updateAsset: v619,
    setWorkflowsLoading: v627,
    setWorkflows: v630,
    upsertWorkflow: v633,
    updateWorkflowLocal: v638,
    markWorkflowUsed: v644,
    setWorkflowUi: v647,
    setWorkflowDraft: v652,
    resetWorkflowDraft: v654,
    openWorkflowModal: v656,
    closeWorkflowModal: v657,
    setWorkflowSaving: v658,
    setWorkflowApplying: v660,
    serialize: v460,
    hydrate: v486,
    hydrateTrustedSnapshot: v483,
  };
}
const legacyKernelStore = createStore();
export default legacyKernelStore;
export { createStore, createStore as createLegacyKernelStore };
