import appStore from "../core/stores/appStore.js";
import {
  buildGenerateAudioRequest,
  cancelRunningHubAudioTask,
  generateAudio,
  resumeRunningHubAudioTask,
} from "../../api/aiAudioApi.js";
import { ensureConfig, getProviderConfig } from "../../api/configApi.js";
import { uploadFile } from "../modules/project.js";
import { saveRemoteAudioLocallyDetailed } from "../modules/project.js";
import { subscribeAssetMentionRegistry } from "../modules/assetMentionRegistry.js";
import { removeCoveredAssetInputRefForConnection } from "../modules/promptAssetInputOverride.js";
import {
  cancelAudioSeparationTaskForNode,
  getRunningAudioSeparationTaskForNode,
  runAudioSeparationFromNode,
} from "../modules/AudioSeparationController.js";
import { bindRunningHubToolbarTaskButton } from "./nodeToolbar/runningHubToolbarTaskButton.js";
import {
  _handlePillHover,
  _handlePillOut,
  _checkAtTrigger,
  _handleMentionMenuKeyboard,
  _handlePillKeyboard,
  _rehydratePromptPills,
  _syncEdgesOrderFromPills,
  _syncPillLabels,
  getAssetInputRefsFromPromptAndNode,
  getPromptAssetInputRefsFromNode,
  removeAssetMentionPillFromPrompt,
  removePromptAssetInputRefFromNode,
  insertPresetPromptIntoEditor,
  previewPresetPromptInEditor,
  resolvePresetPromptTextWithTextRefs,
  shouldUsePromptPreviewForPreset,
  flushPromptHtmlCommit,
  handlePromptPaste,
  handlePromptSelectAll,
  schedulePromptHtmlCommit,
} from "../modules/nodePromptShared.js";
import {
  isPreviewModeEnabled,
  isPreviewNodeLoading,
  startPreviewNodeLoading,
  stopPreviewNodeLoading,
  syncPreviewNodeLoading,
} from "../modules/previewMode.js";
import {
  createPreviewGenerateButtonCallbacks,
  resetGenerateButtonIdleUi,
  setGenerateButtonCancellableUi,
  setGenerateButtonLoadingUi,
} from "../modules/previewGenerateButtonUi.js";
import { AUDIO_TOOLBAR_HTML } from "./NodeToolbarConfig.js";
import { startLoading, stopLoading } from "../modules/loadingOverlay.js";
import AudioClipController from "../modules/AudioClipController.js";
import { findAvailablePosition, generateId } from "../core/math.js";
import { getNodeSpawnPrefs } from "../modules/nodeSpawn.js";
import {
  ensureThumbDecoded,
  revealRefThumbMedia,
} from "../modules/refThumbMediaReveal.js";
import { createReferenceFallbackThumbHtml } from "../modules/referenceThumbnailFallback.js";
import {
  checkSlashTrigger,
  handleSlashKeyboardNavigation,
} from "../modules/slashMenu.js";
import { activateMenuKeyboard } from "../modules/floatingMenuKeyboard.js";
import { bindRefThumbHoverPreview } from "../modules/refThumbHoverPreview.js";
import { bindRefThumbFixedSlotDrag } from "../modules/refThumbDragController.js";
import {
  deferWaveformPathUntilAudioReady,
  getWaveformBarsPathFromPersistedUrl,
  getWaveformBarsPathFromUrl,
} from "../utils/audioWaveform.js";
import { createAudioPlaybackProgressController } from "../utils/audioPlaybackProgress.js";
import {
  beginAudioPlayback,
  registerAudioPlaybackClient,
} from "../modules/audioPlaybackCoordinator.js";
import { sanitizePromptHtml } from "../utils/dom.js";
import { GENERATION_HISTORY_EVENT } from "../modules/generationHistoryAssets.js";
import {
  applyPromptBoxHeight,
  getPromptBoxHeightBounds,
  normalizePromptBoxHeight,
} from "./promptBoxResize.js";
import {
  buildCanvasLocalVideoFields,
  resolveCanvasAudioUrl,
  resolveCanvasVideoUrl,
} from "../services/canvasMediaLocalService.js";
import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
  getMediaElementCurrentSource,
  getMediaElementPlaybackSourceKey,
  isMediaElementPlaybackSource,
} from "../services/desktopMediaBlobSource.js";
import {
  localPathToUrl,
  normalizeLocalPath,
  pickResultLocalPath,
} from "../utils/localMediaPath.js";
import {
  DEBUG_WRENCH_ICON_HTML,
  formatFinalApiDebugRequest,
} from "../utils/debugRequestPreview.js";
import { createPromptAttachmentButtonHTML } from "./refAttachmentButton.js";
import {
  getModelManifest,
  RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
} from "../manifests/index.js";
import {
  isVipModel as isVipModel,
  resolveVipGateModelId,
} from "../modules/subscriptionAccess.js";
import {
  bindModelUiSchemaControls,
  buildModelUiSchemaDefaultParams,
  renderModelUiSchemaControls,
  syncModelUiSchemaControls,
} from "./aigenImage/uiSchemaRenderer.js";
import {
  buildAudioModelMenuHtml,
  buildAudioModelTriggerHtml,
  buildAudioWorkflowItems,
} from "./audio-node/audioModelMenuHelpers.js";
import { buildAudioGenerationResultPatch } from "./audio-node/audioGenerationResultRenderer.js";
import { bindAudioDownloadAction } from "./nodeToolbar/audioActions/downloadAction.js";
import {
  bindNodeFooterController,
  bindNodeModelMenuTrigger,
} from "./shared/nodeFooterControls.js";
import {
  createGenerationNodeHelpTipController,
  getGenerationNodeHelpTooltip,
} from "./generationNodeHelpTip.js";
import {
  getTaskMessage,
  resolveGenerationButtonMode,
  shouldAllowCancel,
  shouldShowGenerationBusyUi,
} from "../core/generationTaskUiState.js";
import {
  cancelTask,
  resumeTask,
  submitTask,
} from "../core/generationTaskRuntime.js";
const WAVE_PATH =
    "M10,40 L10,40 M20,20 L20,60 M30,25 L30,55 M40,30 L40,50 M50,22 L50,58 M60,28 L60,52 M70,24 L70,56 M80,20 L80,60 M90,26 L90,54 M100,22 L100,58 M110,30 L110,50 M120,15 L120,65 M130,35 L130,45 M140,30 L140,50 M150,40 L150,40 M160,30 L160,50 M170,22 L170,58 M180,28 L180,52 M190,24 L190,56",
  ADVANCED_VOICE_CLONE_WORKFLOW_KEY = RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
  ADVANCED_VOICE_CLONE_MIN_SECONDS = 3,
  ADVANCED_VOICE_CLONE_MAX_SECONDS = 15.05,
  AUDIO_WORKFLOW_VALIDATORS = Object["freeze"]({
    indextts2_clone(v0) {
      const v1 = Array["isArray"](v0?.["audioRefs"]) ? v0["audioRefs"] : [],
        v2 = v1["some"]((v3) => String(v3?.["refSlot"] || "") === "audioRef");
      if (!String(v0?.["prompt"] || "")["trim"]()) return "请输入提示词";
      if (!v2) return "请接入参考音色";
      return "";
    },
    voice_convert(v4) {
      const v5 = Array["isArray"](v4?.["audioRefs"]) ? v4["audioRefs"] : [],
        v6 = v5["some"]((v7) => String(v7?.["refSlot"] || "") === "audioRef"),
        v8 = v5["some"](
          (v9) => String(v9?.["refSlot"] || "") === "audioTarget",
        );
      if (!v6 || !v8) return "音色转换需要参考音色和目标音色";
      return "";
    },
    [ADVANCED_VOICE_CLONE_WORKFLOW_KEY](v10) {
      if (!String(v10?.["prompt"] || "")["trim"]()) return "请输入提示词";
      return "";
    },
  }),
  AUDIO_WORKFLOW_ITEMS = buildAudioWorkflowItems(AUDIO_WORKFLOW_VALIDATORS),
  AUDIO_WORKFLOW_MAP = new Map(
    AUDIO_WORKFLOW_ITEMS["map"]((v11) => [v11["key"], v11]),
  ),
  AUDIO_WORKFLOW_LABEL_MAP = new Map(
    AUDIO_WORKFLOW_ITEMS["map"]((v12) => [v12["label"], v12["key"]]),
  ),
  TEXT_INPUT_TYPES = new Set([
    "source-text",
    "text",
    "ai-text",
    "custom-ai-text",
  ]),
  AUDIO_INPUT_TYPES = new Set(["source-audio", "audio", "ai-audio"]),
  VIDEO_INPUT_TYPES = new Set(["source-video", "video", "ai-video"]),
  AUDIO_RESULT_WIDTH = 420,
  AUDIO_RESULT_HEIGHT = 180,
  AUDIO_RESULT_RATIO = AUDIO_RESULT_WIDTH / AUDIO_RESULT_HEIGHT,
  getStoreSnapshot = () =>
    typeof appStore["getStateRaw"] === "function"
      ? appStore["getStateRaw"]()
      : appStore["getState"]();
function getWorkflowAudioInputLimit(v13) {
  return getWorkflowAudioSlots(v13)["length"] || 1;
}
function getWorkflowAudioSlots(v14) {
  const v15 = getModelManifest(v14)?.["inputSlots"]?.["fixedSlots"];
  if (Array["isArray"](v15) && v15["length"] > 0)
    return v15["map"]((v16) => ({
      slot: String(v16?.["id"] || ""),
      label: String(v16?.["label"] || v16?.["id"] || ""),
    }))["filter"]((v17) => v17["slot"]);
  return [{ slot: "audioRef", label: "参考音色" }];
}
function getWorkflowGateModelId(v18) {
  if (!isVipModel(v18, "runninghubwf")) return "";
  return resolveVipGateModelId(v18, "runninghubwf");
}
function getWorkflowByKey(v19) {
  return AUDIO_WORKFLOW_MAP["get"](String(v19 || "")["trim"]());
}
function resolveWorkflowKeyFromNodeData(v20 = {}) {
  const v21 = [
    v20["audioWorkflowKey"],
    v20["model"],
    v20["audioWorkflowLabel"],
  ]["map"]((v22) => String(v22 || "")["trim"]());
  for (const v23 of v21) {
    if (!v23) continue;
    const v24 =
      (AUDIO_WORKFLOW_MAP["has"](v23) ? v23 : "") ||
      AUDIO_WORKFLOW_LABEL_MAP["get"](v23) ||
      "";
    if (v24) return v24;
  }
  return "";
}
function getDefaultWorkflow() {
  return AUDIO_WORKFLOW_ITEMS[0];
}
function getPlainGenerationParams(v25) {
  return v25 && typeof v25 === "object" && !Array["isArray"](v25)
    ? { ...v25 }
    : {};
}
function getWorkflowUiSchemaField(v26, v27) {
  const v28 = getModelManifest(v26)?.["uiSchema"]?.["fields"];
  if (!Array["isArray"](v28)) return null;
  return (
    v28["find"]((v29) => String(v29?.["id"] || "")["trim"]() === v27) || null
  );
}
function resolveWorkflowSchemaParam(v30, v31, v32) {
  const v33 = getWorkflowUiSchemaField(v31, v32);
  if (!v33)
    throw new Error("RunningHub audio manifest " + v31 + " missing " + v32);
  if (v33["defaultValue"] === undefined)
    throw new Error(
      "RunningHub audio manifest " +
        v31 +
        " missing " +
        v32 +
        "\x20defaultValue",
    );
  const v34 = getPlainGenerationParams(v30?.["generationParams"]),
    v35 = Object["prototype"]["hasOwnProperty"]["call"](v34, v32)
      ? v34[v32]
      : v33["defaultValue"];
  if (v35 === undefined || v35 === null || String(v35)["trim"]() === "")
    throw new Error(
      "RunningHub\x20audio\x20manifest\x20" + v31 + " missing " + v32,
    );
  return v35;
}
function buildWorkflowGenerationParamsPatch(v36, v37, v38 = {}) {
  const v39 = String(v36?.["model"] || v36?.["audioWorkflowKey"] || "")[
      "trim"
    ](),
    v40 = String(v37 || "")["trim"](),
    v41 = getPlainGenerationParams(v36?.["generationParamsByModel"]);
  v39 && (v41[v39] = getPlainGenerationParams(v36?.["generationParams"]));
  const v42 = buildModelUiSchemaDefaultParams(v40),
    v43 = getPlainGenerationParams(v41[v40]),
    v44 = { ...v42, ...v43, ...getPlainGenerationParams(v38) };
  if (v40) v41[v40] = v44;
  return { generationParams: v44, generationParamsByModel: v41 };
}
function normalizePromptForBackend(v45, v46) {
  const v47 = String(v46 || "")["trim"]();
  if (v45 !== ADVANCED_VOICE_CLONE_WORKFLOW_KEY) return v47;
  return v47["replace"](/(^|\s+)@?音频1\s*[:：]?\s*/g, "$1[speaker_1]: ")
    ["replace"](/(^|\s+)@?音频2\s*[:：]?\s*/g, "$1[speaker_2]: ")
    ["replace"](/\s+(\[speaker_[12]\]:)/g, "\n$1")
    ["trim"]();
}
function toLocalAssetUrl(v48) {
  return localPathToUrl(v48);
}
function isLikelyImageUrl(v49) {
  const v50 = String(v49 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (!v50) return false;
  if (v50["startsWith"]("data:image/")) return true;
  return /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?|#|$)/i["test"](v50);
}
function localUrlFromPath(v51) {
  return localPathToUrl(v51);
}
function normalizeAudioRemoteUrl(v52) {
  const v53 = String(v52 || "")["trim"]();
  if (!v53) return "";
  if (v53["startsWith"]("/")) return v53;
  if (/^data:/i["test"](v53)) return v53;
  if (/^blob:/i["test"](v53)) return v53;
  if (v53["startsWith"]("//")) return "https:" + v53;
  if (/^https?:\/\//i["test"](v53)) return v53;
  return "https://" + v53["replace"](/^\/+/, "");
}
export class AIGenAudioNode {
  constructor(v54) {
    ((this["_data"] = v54),
      (this["nodeId"] = v54["id"]),
      (this["previewEl"] = null),
      (this["audioEl"] = null),
      (this["_placeholderEl"] = null),
      (this["refBarEl"] = null),
      (this["promptEl"] = null),
      (this["btnEl"] = null),
      (this["modelWrap"] = null),
      (this["_currentSrc"] = null),
      (this["_lastEdgeSig"] = null),
      (this["_isGenerating"] = false),
      (this["_modelMenu"] = null),
      (this["_runninghubSubmenu"] = null),
      (this["_modelLabelEl"] = null),
      (this["_docClickHandler"] = null),
      (this["_submenuCloseTimer"] = null),
      (this["_unbindRefThumbHoverPreview"] = null),
      (this["_attachBtnIcon"] = null),
      (this["_audioRefUploadInput"] = null),
      (this["_audioRefUploadSlot"] = ""),
      (this["_audioRefUploadAnchorNodeId"] = ""),
      (this["_lastRefMediaSig"] = ""),
      (this["_lastWorkflowKey"] = ""),
      (this["_refBarWorkflowKey"] = ""),
      (this["_speedIdx"] = 0),
      (this["_audioCard"] = null),
      (this["_waveBgEl"] = null),
      (this["_wavePlayed"] = null),
      (this["_progressLine"] = null),
      (this["_bar"] = null),
      (this["_controlsEl"] = null),
      (this["_playBtn"] = null),
      (this["_timeEl"] = null),
      (this["_waveBgPath"] = null),
      (this["_waveFgPath"] = null),
      (this["_waveToken"] = 0),
      (this["_cancelDeferredWaveform"] = null),
      (this["_statusOverlayEl"] = null),
      (this["_isSeeking"] = false),
      (this["_progressController"] = null),
      (this["_promptPanel"] = null),
      (this["_promptInputWrap"] = null),
      (this["_isPromptBoxResizing"] = false),
      (this["_promptResizeHandle"] = false),
      (this["_promptResizeCleanup"] = null),
      (this["_rhTaskId"] = ""),
      (this["_rhApiKey"] = ""),
      (this["_rhAbortController"] = null),
      (this["_rhCancelRequested"] = false),
      (this["_rhCancelInFlight"] = false),
      (this["_rhRemoteCancelSent"] = false),
      (this["_rhResumeAbortController"] = null),
      (this["_rhResumeTaskId"] = ""),
      (this["_rhResumePromise"] = null),
      (this["_assetMentionRegistryUnsubscribe"] = null),
      (this["_assetMentionRegistryRefreshPending"] = false),
      (this["_vipInstallId"] = ""),
      (this["_vipSelectionRetryInProgress"] = false),
      (this["_generationNodeHelpTip"] = null),
      (this["_uiSchemaCleanup"] = null),
      (this["_footerControllerCleanup"] = null));
  }
  ["_getCurrentWorkflow"]() {
    const v55 = resolveWorkflowKeyFromNodeData(this["_data"]);
    return getWorkflowByKey(v55) || getDefaultWorkflow();
  }
  ["_syncWorkflowDefaults"]() {
    const v56 = this["_getCurrentWorkflow"](),
      v57 = {};
    if (this["_data"]["provider"] !== "runninghubwf")
      v57["provider"] = "runninghubwf";
    if (this["_data"]["audioWorkflowKey"] !== v56["key"])
      v57["audioWorkflowKey"] = v56["key"];
    if (this["_data"]["audioWorkflowLabel"] !== v56["label"])
      v57["audioWorkflowLabel"] = v56["label"];
    if (this["_data"]["model"] !== v56["key"]) v57["model"] = v56["key"];
    const v58 = buildWorkflowGenerationParamsPatch(this["_data"], v56["key"]);
    (JSON["stringify"](v58["generationParams"]) !==
      JSON["stringify"](
        getPlainGenerationParams(this["_data"]["generationParams"]),
      ) ||
      JSON["stringify"](v58["generationParamsByModel"]) !==
        JSON["stringify"](
          getPlainGenerationParams(this["_data"]["generationParamsByModel"]),
        )) &&
      ((v57["generationParams"] = v58["generationParams"]),
      (v57["generationParamsByModel"] = v58["generationParamsByModel"]));
    if (!Object["keys"](v57)["length"]) return;
    (appStore["updateNodeData"](this["nodeId"], v57),
      (this["_data"] = { ...this["_data"], ...v57 }));
  }
  ["_setSelectedWorkflow"](v59) {
    const v60 = getWorkflowByKey(v59);
    if (!v60) return;
    if (
      !this["_guardVipWorkflowSelection"](v60["key"], () => {
        this["_vipSelectionRetryInProgress"] = true;
        try {
          this["_setSelectedWorkflow"](v60["key"]);
        } finally {
          this["_vipSelectionRetryInProgress"] = false;
        }
      })
    )
      return;
    const v61 = {
      provider: "runninghubwf",
      audioWorkflowKey: v60["key"],
      audioWorkflowLabel: v60["label"],
      model: v60["key"],
      ...buildWorkflowGenerationParamsPatch(this["_data"], v60["key"]),
    };
    (appStore["updateNodeData"](this["nodeId"], v61),
      (this["_data"] = { ...this["_data"], ...v61 }),
      this["_enforceWorkflowAudioInputLimit"](),
      (this["_lastEdgeSig"] = null),
      (this["_lastRefMediaSig"] = ""),
      (this["_lastWorkflowKey"] = ""),
      (this["_refBarWorkflowKey"] = ""),
      this["_renderRefBar"](),
      this["_refreshWorkflowUi"](),
      this["_updateSubmitButtonState"]());
  }
  ["_closeModelMenu"]() {
    this["_modelMenu"]?.["classList"]["remove"]("show");
    if (this["_runninghubSubmenu"])
      this["_runninghubSubmenu"]["style"]["display"] = "none";
    this["_submenuCloseTimer"] &&
      (clearTimeout(this["_submenuCloseTimer"]),
      (this["_submenuCloseTimer"] = null));
  }
  ["_openSubmenu"]() {
    if (!this["_runninghubSubmenu"]) return;
    (this["_submenuCloseTimer"] &&
      (clearTimeout(this["_submenuCloseTimer"]),
      (this["_submenuCloseTimer"] = null)),
      (this["_runninghubSubmenu"]["style"]["display"] = "flex"));
  }
  ["_scheduleCloseSubmenu"]() {
    if (this["_submenuCloseTimer"]) clearTimeout(this["_submenuCloseTimer"]);
    this["_submenuCloseTimer"] = setTimeout(() => {
      if (this["_runninghubSubmenu"])
        this["_runninghubSubmenu"]["style"]["display"] = "none";
      this["_submenuCloseTimer"] = null;
    }, 150);
  }
  ["_refreshWorkflowUi"]() {
    const v62 = this["_getCurrentWorkflow"]();
    if (this["_modelLabelEl"])
      this["_modelLabelEl"]["textContent"] = v62["label"];
    (this["_syncAudioPromptHelpTip"](v62["key"]),
      syncModelUiSchemaControls(this["_root"], this["_data"]),
      this["_runninghubSubmenu"]
        ?.["querySelectorAll"](".floating-menu-item")
        ["forEach"]((v63) => {
          v63["classList"]["toggle"](
            "active",
            v63["dataset"]["value"] === v62["key"],
          );
        }));
  }
  ["_getGenerationNodeHelpText"](v64 = this["_getCurrentWorkflow"]()["key"]) {
    return getGenerationNodeHelpTooltip({ kind: "audio", key: v64 });
  }
  ["_ensureGenerationNodeHelpTip"]() {
    if (this["_generationNodeHelpTip"] || !this["_promptPanel"])
      return this["_generationNodeHelpTip"];
    return (
      (this["_generationNodeHelpTip"] = createGenerationNodeHelpTipController({
        panel: this["_promptPanel"],
        getHelpText: () => this["_getGenerationNodeHelpText"](),
        ariaLabel: "生成节点说明",
      })),
      this["_generationNodeHelpTip"]
    );
  }
  ["_syncAudioPromptHelpTip"]() {
    this["_ensureGenerationNodeHelpTip"]()?.["sync"]();
  }
  ["_resolveAudioRefUrl"](v65) {
    return resolveCanvasAudioUrl(v65);
  }
  ["_resolveNodeAudioUrl"](v66) {
    return resolveCanvasAudioUrl(v66);
  }
  ["_resolveVideoRefUrl"](v67) {
    const v68 = Number["isFinite"](Number(v67?.["mainVideoIndex"]))
        ? Math["max"](0, Math["trunc"](Number(v67["mainVideoIndex"])))
        : 0,
      v69 = Array["isArray"](v67?.["videos"])
        ? v67["videos"][v68] || v67["videos"][0]
        : null;
    return resolveCanvasVideoUrl(v69) || resolveCanvasVideoUrl(v67);
  }
  async ["_persistAudioOutput"](v70) {
    const v71 = normalizeAudioRemoteUrl(v70);
    if (!v71) return { localPath: "", audioUrl: "" };
    const v72 = normalizeLocalPath(v71);
    if (v72) {
      const v73 = v72;
      return { localPath: v73, audioUrl: localUrlFromPath(v73) };
    }
    try {
      const v74 = await saveRemoteAudioLocallyDetailed(v71),
        v75 = pickResultLocalPath(v74);
      if (v75) return { localPath: v75, audioUrl: localUrlFromPath(v75) };
    } catch (v76) {
      console["warn"]("[AIGenAudioNode] 音频落盘失败:", v76);
    }
    throw new Error("已生成但本地保存失败");
  }
  ["_persistRunningHubResumeCache"]() {
    try {
      window["_triggerLocalCacheSave"]?.();
    } catch {}
  }
  ["_isRunningHubRecoverableRunningTask"](v77 = this["_data"]) {
    const v78 = String(v77?.["provider"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (v78 !== "runninghubwf") return false;
    const v79 = String(v77?.["rhTaskId"] || "")["trim"]();
    if (!v79) return false;
    const v80 = String(v77?.["rhTaskStatus"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (
      v80 === "success" ||
      v80 === "failed" ||
      v80 === "idle" ||
      v80 === "cancelled"
    )
      return false;
    return true;
  }
  ["_buildRunningHubTaskPatch"]({
    taskId: taskId = "",
    status: status = "pending",
    startedAt: startedAt = 0,
    recovering: recovering = false,
    useOpenapiQuery: useOpenapiQuery = true,
  } = {}) {
    return {
      rhTaskId: String(taskId || "")["trim"](),
      rhTaskStatus: String(status || "pending")["trim"]() || "pending",
      rhTaskStartedAt: Number(startedAt || 0),
      rhTaskRecovering: recovering === true,
      rhTaskUseOpenapiQuery: useOpenapiQuery === true,
    };
  }
  ["_stopRunningHubRecovery"](v81 = false) {
    this["_rhResumeAbortController"] &&
      !this["_rhResumeAbortController"]["signal"]["aborted"] &&
      this["_rhResumeAbortController"]["abort"]();
    ((this["_rhResumeAbortController"] = null),
      (this["_rhResumeTaskId"] = ""),
      (this["_rhResumePromise"] = null));
    if (v81) {
      const v82 = appStore["getState"]()["nodes"]?.[this["nodeId"]];
      v82?.["rhTaskRecovering"] &&
        (appStore["updateNodeData"](this["nodeId"], {
          rhTaskRecovering: false,
        }),
        this["_persistRunningHubResumeCache"]());
    }
  }
  ["_setGeneratingUi"]() {
    if (!this["btnEl"]) return;
    const v83 =
        appStore["getState"]()["nodes"]?.[this["nodeId"]] ||
        this["_data"] ||
        {},
      v84 =
        String(v83?.["provider"] || "runninghubwf")["toLowerCase"]() ===
        "runninghubwf",
      v85 = resolveGenerationButtonMode(v83, {
        cancellable: v84,
        cancelInFlight: this["_rhCancelInFlight"] === true,
      });
    if (v85["busy"]) {
      v84
        ? setGenerateButtonCancellableUi(this["btnEl"], {
            title: "点击生成，再次点击可以取消运行",
            tooltip: "点击生成，再次点击可以取消运行",
            ariaLabel: "取消生成音频",
            color: "var(--red)",
            busy: true,
          })
        : setGenerateButtonLoadingUi(this["btnEl"], {
            title: "生成",
            disabled: true,
            ariaLabel: "生成",
          });
      ((this["btnEl"]["disabled"] = v85["disabled"]),
        (this["btnEl"]["style"]["cursor"] = v85["cursor"]));
      return;
    }
    (resetGenerateButtonIdleUi(this["btnEl"], "生成"),
      this["_updateSubmitButtonState"]());
  }
  ["_guardVipWorkflowSelection"](v86, v87 = null) {
    const v88 = getWorkflowGateModelId(v86);
    if (!v88) return true;
    const v89 = window["isModelAllowedBySubscription"],
      v90 = typeof v89 === "function" ? v89(v88, "runninghubwf") : true;
    if (v90) return true;
    if (this["_vipSelectionRetryInProgress"]) return false;
    return (
      typeof window["openSubscriptionDialog"] === "function"
        ? window["openSubscriptionDialog"]({
            modelId: v88,
            provider: "runninghubwf",
            onSuccess: v87,
          })
        : window["showToast"]?.("需要VIP授权，请先激活CDKEY", "warn"),
      false
    );
  }
  async ["_handleGenerateOrCancel"](v91 = null) {
    const v92 =
        appStore["getState"]()["nodes"]?.[this["nodeId"]] ||
        this["_data"] ||
        {},
      v93 = String(v92?.["provider"] || "runninghubwf")
        ["trim"]()
        ["toLowerCase"](),
      v94 = v93 === "runninghubwf";
    if (
      shouldAllowCancel(v92, {
        cancellable: v94,
        cancelInFlight: this["_rhCancelInFlight"] === true,
      })
    ) {
      await this["_cancelRunningHubWorkflowTask"]();
      return;
    }
    await this["_onGenerate"](v91);
  }
  async ["_cancelRunningHubWorkflowTask"]() {
    let v95 = this["_rhApiKey"] || "";
    const v96 =
        appStore["getState"]()["nodes"]?.[this["nodeId"]] ||
        this["_data"] ||
        {},
      v97 =
        String(this["_rhTaskId"] || "")["trim"]() ||
        String(v96?.["rhTaskId"] || "")["trim"](),
      v98 = Date["now"](),
      v99 = Number(v96?.["generationStartTime"]),
      v100 =
        v96?.["generationDuration"] != null
          ? v96["generationDuration"]
          : Number["isFinite"](v99) && v99 > 0
            ? Math["max"](0, v98 - v99)
            : 0;
    this["_rhCancelRequested"] = true;
    if (this["_rhCancelInFlight"]) return;
    this["_stopRunningHubRecovery"](false);
    if (!v95)
      try {
        await ensureConfig();
        const v101 = getProviderConfig("runninghubwf");
        v95 = String(v101?.["apiKey"] || "")["trim"]();
      } catch {}
    if (v95) this["_rhApiKey"] = v95;
    const v102 = !v97,
      v103 = ({ remoteResult: v104, remoteError: v105, startedAt: v106 }) => {
        const v107 = Number(v104?.["code"]),
          v108 = v102 ? "生成已中断：任务尚未返回\x20ID" : "",
          v109 =
            v108 ||
            (v105
              ? v105["message"] || "取消失败"
              : v107 === 0
                ? "取消成功"
                : v107 === 807
                  ? "任务不存在"
                  : v104?.["msg"] || "取消失败");
        return {
          audioUrl: "",
          src: "",
          localPath: "",
          generationDuration: v100,
          rhStatusMessage: v109,
          rhStatusCode: v102 ? 813 : Number["isFinite"](v107) ? v107 : null,
          ...this["_buildRunningHubTaskPatch"]({
            taskId: v97,
            status: "cancelled",
            startedAt: Number(
              v106 ||
                v96?.["rhTaskStartedAt"] ||
                v96?.["generationStartTime"] ||
                0,
            ),
            recovering: false,
            useOpenapiQuery: v96?.["rhTaskUseOpenapiQuery"] === true,
          }),
        };
      };
    try {
      ((this["_rhCancelInFlight"] = true),
        (this["_rhRemoteCancelSent"] = true),
        await cancelTask(this["nodeId"], {
          store: appStore,
          taskId: v97,
          cancellable: true,
          cancel: async ({ taskId: v110 }) => {
            if (!v95) throw new Error("取消失败：缺少 API Key");
            return cancelRunningHubAudioTask({ apiKey: v95, taskId: v110 });
          },
          cancelledBuilder: v103,
          spec: {
            sourceNodeId: this["nodeId"],
            targetNodeId: this["nodeId"],
            trigger: "node",
            taskType: "audio-generation",
            provider: "runninghubwf",
            adapterType: "workflow",
            modelId: v96?.["audioWorkflowKey"] || v96?.["model"] || "",
            executionId:
              "runninghub.audio." + (v96?.["audioWorkflowKey"] || "workflow"),
            payload: v96,
            cancellable: true,
            resumable: true,
            resultBuilder: () => ({}),
            cancelledBuilder: v103,
          },
        }),
        this["_persistRunningHubResumeCache"]());
    } finally {
      ((this["_rhCancelInFlight"] = false),
        (this["_rhRemoteCancelSent"] = false),
        (this["_rhCancelRequested"] = false),
        (this["_isGenerating"] = false),
        (this["_rhAbortController"] = null),
        (this["_rhTaskId"] = ""),
        (this["_rhApiKey"] = ""),
        this["_setGeneratingUi"](),
        stopLoading(this["previewEl"]));
    }
  }
  async ["_applyAudioResultAndStore"](
    v111,
    v112,
    { writeStore: writeStore = true } = {},
  ) {
    const v113 = await buildAudioGenerationResultPatch(v111, {
      startedAt: v112,
      persistAudioOutput: (v114) => this["_persistAudioOutput"](v114),
    });
    if (!v113?.["audioUrl"] || !v113?.["localPath"])
      throw new Error("已生成但本地保存失败");
    writeStore && appStore["updateNodeData"](this["nodeId"], v113);
    const v115 = {
      audioUrl: v113["audioUrl"],
      src: v113["src"],
      localPath: v113["localPath"],
      waveformLocalPath: v113["waveformLocalPath"],
      assetId: v113["assetId"],
      derivativeStatus: v113["derivativeStatus"],
      fileName: v113["fileName"],
    };
    return (
      this["_dispatchGenerationHistoryAudio"](v115, v112),
      this["_applyResultWideLayout"]({ ...this["_data"], ...v115 }, true),
      {
        finalUrl: v115["audioUrl"],
        finalLocalPath: v115["localPath"],
        patch: v113,
      }
    );
  }
  ["_dispatchGenerationHistoryAudio"](v116, v117) {
    if (
      typeof window === "undefined" ||
      typeof window["dispatchEvent"] !== "function"
    )
      return;
    if (!v116 || typeof v116 !== "object") return;
    if (!String(v116["audioUrl"] || v116["localPath"] || "")["trim"]()) return;
    const v118 =
      appStore["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {};
    try {
      window["dispatchEvent"](
        new CustomEvent(GENERATION_HISTORY_EVENT, {
          detail: {
            kind: "audio",
            sourceNodeId: this["nodeId"],
            nodeData: v118,
            audios: [v116],
            startedAt: v117,
            createdAt: Date["now"](),
          },
        }),
      );
    } catch {}
  }
  async ["_maybeResumeRunningHubTask"]() {
    const v119 =
      appStore["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {};
    if (this["_isGenerating"] && v119?.["rhTaskRecovering"] !== true) return;
    if (!this["_isRunningHubRecoverableRunningTask"](v119)) {
      this["_stopRunningHubRecovery"](false);
      return;
    }
    const v120 = String(v119?.["rhTaskId"] || "")["trim"]();
    if (!v120) {
      this["_stopRunningHubRecovery"](false);
      return;
    }
    if (this["_rhResumeTaskId"] === v120 && this["_rhResumePromise"]) return;
    this["_stopRunningHubRecovery"](false);
    const v121 = Number(
      v119?.["rhTaskStartedAt"] ||
        v119?.["generationStartTime"] ||
        Date["now"](),
    );
    this["_rhResumeTaskId"] = v120;
    const v122 = (async () => {
      let v123 = null;
      try {
        const v124 = await this["_buildPayload"]();
        if (!v124) return;
        ((v123 = new AbortController()),
          (this["_rhResumeAbortController"] = v123),
          (this["_rhTaskId"] = v120));
        let v125 =
          String(v124?.["apiKey"] || "")["trim"]() || this["_rhApiKey"] || "";
        if (!v125)
          try {
            await ensureConfig();
            const v126 = getProviderConfig("runninghubwf");
            v125 = String(v126?.["apiKey"] || "")["trim"]();
          } catch {}
        ((this["_rhApiKey"] = v125 || ""),
          (this["_isGenerating"] = true),
          this["_setGeneratingUi"](),
          startLoading(this["previewEl"]));
        const v127 = await resumeTask(
          {
            sourceNodeId: this["nodeId"],
            targetNodeId: this["nodeId"],
            trigger: "node",
            taskType: "audio-generation",
            provider: "runninghubwf",
            adapterType: "workflow",
            modelId: v124["audioWorkflowKey"] || v119?.["model"] || "",
            executionId:
              "runninghub.audio." + (v124["audioWorkflowKey"] || "workflow"),
            payload: v124,
            taskId: v120,
            cancellable: true,
            resumable: true,
            startBuilder: () => ({
              provider: v124["provider"],
              audioWorkflowKey: v124["audioWorkflowKey"],
              audioWorkflowLabel: v124["audioWorkflowLabel"],
              model: v124["audioWorkflowKey"],
              rhInstanceType: v124["rhInstanceType"],
              rhTaskUseOpenapiQuery: true,
            }),
            onTaskStart: () => {
              this["_persistRunningHubResumeCache"]();
            },
            poll: async () =>
              resumeRunningHubAudioTask(v120, v124, {
                signal: v123["signal"],
                useOpenapiQuery: true,
              }),
            resultBuilder: async (v128, v129) => {
              const v130 = await this["_applyAudioResultAndStore"](
                v128,
                v129["startedAt"],
                { writeStore: false },
              );
              return {
                ...v130["patch"],
                rhStatusMessage: null,
                rhStatusCode: null,
                ...this["_buildRunningHubTaskPatch"]({
                  taskId: v120,
                  status: "success",
                  startedAt: v129["startedAt"],
                  recovering: false,
                  useOpenapiQuery: true,
                }),
              };
            },
            failureBuilder: (v131, v132) => ({
              rhStatusMessage: v131?.["message"] || "音频生成失败",
              rhStatusCode: Number["isFinite"](Number(v131?.["code"]))
                ? Number(v131["code"])
                : null,
              ...this["_buildRunningHubTaskPatch"]({
                taskId: v120,
                status: "failed",
                startedAt: v132["startedAt"],
                recovering: false,
                useOpenapiQuery: true,
              }),
            }),
            cancelledBuilder: (v133) => ({
              audioUrl: "",
              src: "",
              localPath: "",
              rhStatusMessage: "生成已中断",
              rhStatusCode: null,
              ...this["_buildRunningHubTaskPatch"]({
                taskId: v120,
                status: "cancelled",
                startedAt: v133["startedAt"],
                recovering: false,
                useOpenapiQuery: true,
              }),
            }),
            parseError: (v134) => v134?.["message"] || "音频生成失败",
          },
          { store: appStore, startedAt: v121, abortController: v123 },
        );
        if (v127["status"] === "pending") {
          this["_persistRunningHubResumeCache"]();
          return;
        }
        this["_persistRunningHubResumeCache"]();
      } catch (v135) {
        if (
          v123?.["signal"]?.["aborted"] ||
          v135?.["message"] === "CANCELLED" ||
          v135?.["name"] === "AbortError"
        )
          return;
        (appStore["updateNodeData"](this["nodeId"], {
          isGenerating: false,
          jobStatus: "error",
          generationDuration: Math["max"](0, Date["now"]() - v121),
          rhStatusMessage: v135?.["message"] || "音频生成失败",
          rhStatusCode: Number["isFinite"](Number(v135?.["code"]))
            ? Number(v135["code"])
            : null,
          ...this["_buildRunningHubTaskPatch"]({
            taskId: v120,
            status: "failed",
            startedAt: v121,
            recovering: false,
            useOpenapiQuery: true,
          }),
        }),
          this["_persistRunningHubResumeCache"]());
      } finally {
        v123 &&
          this["_rhResumeAbortController"] === v123 &&
          (this["_rhResumeAbortController"] = null);
        this["_rhResumeTaskId"] === v120 && (this["_rhResumeTaskId"] = "");
        this["_rhResumePromise"] = null;
        const v136 = appStore["getState"]()["nodes"]?.[this["nodeId"]] || {},
          v137 = shouldShowGenerationBusyUi(v136);
        ((this["_isGenerating"] = v137),
          (this["_rhTaskId"] = v137
            ? String(v136?.["rhTaskId"] || v120 || "")["trim"]()
            : ""),
          this["_setGeneratingUi"]());
        if (!v137) stopLoading(this["previewEl"]);
      }
    })();
    this["_rhResumePromise"] = v122;
  }
  ["_applyResultWideLayout"](v138 = null, v139 = false) {
    const v140 = v138 || this["_data"] || {},
      v141 = this["_resolveNodeAudioUrl"](v140);
    if (!v141) return;
    const v142 = Number(v140["width"] || 0),
      v143 = Number(v140["height"] || 0);
    if (!v139 && v142 > 0 && v143 > 0) {
      const v144 = v142 / v143,
        v145 =
          v144 >= 2 &&
          v142 >= AUDIO_RESULT_WIDTH - 20 &&
          v143 <= AUDIO_RESULT_HEIGHT + 40,
        v146 = Math["abs"](v144 - AUDIO_RESULT_RATIO) <= 0.08;
      if (v145 || v146) return;
    }
    const v147 = v142 > 0 ? v142 : AUDIO_RESULT_WIDTH,
      v148 = v143 > 0 ? v143 : AUDIO_RESULT_HEIGHT,
      v149 = Number(v140["x"] || 0) + v147 / 2,
      v150 = Number(v140["y"] || 0) + v148 / 2,
      v151 = Math["round"](v149 - AUDIO_RESULT_WIDTH / 2),
      v152 = Math["round"](v150 - AUDIO_RESULT_HEIGHT / 2);
    if (
      v142 === AUDIO_RESULT_WIDTH &&
      v143 === AUDIO_RESULT_HEIGHT &&
      Number(v140["x"] || 0) === v151 &&
      Number(v140["y"] || 0) === v152
    )
      return;
    appStore["updateNodeData"](this["nodeId"], {
      width: AUDIO_RESULT_WIDTH,
      height: AUDIO_RESULT_HEIGHT,
      x: v151,
      y: v152,
    });
  }
  ["_collectInputs"](v153 = null) {
    const v154 = appStore["getIncomingEdges"](this["nodeId"]),
      v155 = appStore["getState"]()["nodes"] || {},
      v156 = [],
      v157 = [],
      v158 = [];
    v154["forEach"]((v159) => {
      const v160 = v155[v159["sourceId"]];
      if (!v160) return;
      const v161 = String(v160["type"] || "");
      if (TEXT_INPUT_TYPES["has"](v161)) {
        const v162 = String(
          v160["outputText"] ||
            v160["text"] ||
            v160["content"] ||
            v160["prompt"] ||
            "",
        )["trim"]();
        if (!v162) return;
        v156["push"]({
          edgeId: v159["id"],
          sourceId: v159["sourceId"],
          sourceType: v161,
          text: v162,
        });
        return;
      }
      if (AUDIO_INPUT_TYPES["has"](v161)) {
        const v163 = this["_resolveAudioRefUrl"](v160);
        if (!v163) return;
        v157["push"]({
          edgeId: v159["id"],
          sourceId: v159["sourceId"],
          sourceType: v161,
          refSlot: String(v159?.["refSlot"] || ""),
          url: v163,
        });
        return;
      }
      if (VIDEO_INPUT_TYPES["has"](v161)) {
        const v164 = this["_resolveVideoRefUrl"](v160);
        if (!v164) return;
        v158["push"]({
          edgeId: v159["id"],
          sourceId: v159["sourceId"],
          sourceType: v161,
          url: v164,
        });
      }
    });
    const v165 = [],
      v166 = resolvePresetPromptTextWithTextRefs({
        template: v153,
        promptEl: this["promptEl"],
        inEdges: v154,
        nodes: v155,
        assetInputRefs: v165,
        assetMediaCounts: { image: 0, video: 0, audio: 0 },
        allowedAssetTypes: ["text", "audio"],
      }),
      v167 = v155?.[this["nodeId"]] || this["_data"] || {};
    v165["push"](
      ...getPromptAssetInputRefsFromNode(v167, { allowedTypes: ["audio"] }),
    );
    const v168 = this["_getCurrentWorkflow"]()["key"],
      v169 = getWorkflowAudioSlots(v168)["map"]((v170) => v170["slot"]),
      v171 = new Set(
        v157["map"]((v172) => String(v172?.["refSlot"] || ""))["filter"](
          Boolean,
        ),
      );
    return (
      v165["forEach"]((v173) => {
        if (v173["type"] !== "audio" || !v173["url"]) return;
        const v174 = v169["find"]((v175) => !v171["has"](v175)) || "";
        if (!v174) return;
        (v171["add"](v174),
          v157["push"]({
            edgeId: "",
            sourceId: "",
            sourceType: "asset-audio",
            refSlot: v174,
            url: v173["url"],
            assetId: v173["assetId"],
            assetIndex: v173["itemIndex"],
          }));
      }),
      {
        prompt: String(v166 || "")["trim"](),
        textInputs: v156,
        audioRefs: v157,
        videoRefs: v158,
      }
    );
  }
  ["_validatePayload"](v176) {
    const v177 =
        getWorkflowByKey(v176?.["audioWorkflowKey"]) || getDefaultWorkflow(),
      v178 = v177["validate"](v176);
    return { ok: !v178, message: v178 };
  }
  ["_buildPayloadSnapshot"](v179 = null) {
    const v180 = this["_getCurrentWorkflow"](),
      v181 = this["_collectInputs"](v179),
      v182 = {
        nodeId: this["nodeId"],
        provider: "runninghubwf",
        audioWorkflowKey: v180["key"],
        audioWorkflowLabel: v180["label"],
        rhInstanceType:
          String(
            resolveWorkflowSchemaParam(
              this["_data"],
              v180["key"],
              "rhInstanceType",
            ),
          ) === "plus"
            ? "plus"
            : "default",
        prompt: normalizePromptForBackend(v180["key"], v181["prompt"]),
        textInputs: v181["textInputs"]["map"]((v183) => v183["text"]),
        audioRefs: v181["audioRefs"],
        videoRefs: v181["videoRefs"],
        installId: String(
          this["_vipInstallId"] || window["__aicInstallId"] || "",
        )["trim"](),
      },
      v184 = this["_validatePayload"](v182);
    return { payload: v182, validation: v184 };
  }
  ["_enforceWorkflowAudioInputLimit"]() {
    const v185 = this["_getCurrentWorkflow"](),
      v186 = getWorkflowAudioInputLimit(v185["key"]),
      v187 = appStore["getIncomingEdges"](this["nodeId"]),
      v188 = appStore["getState"]()["nodes"] || {},
      v189 = v187["filter"]((v190) => {
        const v191 = v188[v190["sourceId"]];
        return AUDIO_INPUT_TYPES["has"](String(v191?.["type"] || ""));
      });
    if (v189["length"] <= v186) return;
    const v192 = [...v189]["sort"]((v193, v194) => {
        const v195 = Number(v193?.["createdAt"] || 0),
          v196 = Number(v194?.["createdAt"] || 0);
        return v195 - v196;
      }),
      v197 = v192["slice"](0, Math["max"](0, v192["length"] - v186));
    if (!v197["length"]) return;
    appStore["batch"](() => {
      v197["forEach"]((v198) => appStore["removeEdge"](v198["id"]));
    });
  }
  ["_syncPickConnectVisualState"]() {
    const v199 = appStore["getState"]()["pickConnectMode"] || {},
      v200 = !!(v199["active"] && v199["sourceNodeId"] === this["nodeId"]),
      v201 =
        this["refBarEl"]?.["querySelector"](
          ".prompt-attachment-btn .btn-icon",
        ) || this["_attachBtnIcon"];
    v201 &&
      ((this["_attachBtnIcon"] = v201),
      (v201["style"]["transition"] = "opacity 0.2s ease, transform 0.2s ease"),
      (v201["style"]["opacity"] = v200 ? "0" : ""),
      (v201["style"]["transform"] = v200 ? "scale(0.4)" : ""),
      (v201["style"]["pointerEvents"] = v200 ? "none" : ""));
    if (this["_placeholderEl"]) {
      const v202 = this["_placeholderEl"]["querySelector"](
        ".placeholder-icon-svg",
      );
      if (v202) {
        if (v200) v202["classList"]["add"]("is-pick-connecting");
        else v202["classList"]["remove"]("is-pick-connecting");
      }
    }
  }
  ["_fmtTime"](v203) {
    if (!v203 || isNaN(v203)) return "0:00";
    return (
      Math["floor"](v203 / 60) +
      ":" +
      String(Math["floor"](v203 % 60))["padStart"](2, "0")
    );
  }
  ["_setPlayIcon"](v204) {
    const v205 = this["_playBtn"]?.["querySelector"]?.("svg");
    if (!v205) return;
    const v206 = "http://www.w3.org/2000/svg";
    while (v205["firstChild"]) v205["removeChild"](v205["firstChild"]);
    if (v204) {
      const v207 = document["createElementNS"](v206, "polygon");
      (v207["setAttribute"]("points", "5 3 19 12 5 21 5 3"),
        v205["appendChild"](v207));
      return;
    }
    const v208 = document["createElementNS"](v206, "rect");
    (v208["setAttribute"]("x", "6"),
      v208["setAttribute"]("y", "4"),
      v208["setAttribute"]("width", "4"),
      v208["setAttribute"]("height", "16"));
    const v209 = document["createElementNS"](v206, "rect");
    (v209["setAttribute"]("x", "14"),
      v209["setAttribute"]("y", "4"),
      v209["setAttribute"]("width", "4"),
      v209["setAttribute"]("height", "16"),
      v205["appendChild"](v208),
      v205["appendChild"](v209));
  }
  ["_seekTo"](v210) {
    const v211 = this["_readAudioDurationSec"]();
    if (!this["audioEl"] || v211 <= 0 || !this["_bar"]) return;
    const v212 = this["_bar"]["getBoundingClientRect"]();
    if (!v212["width"]) return;
    let v213 = (v210 - v212["left"]) / v212["width"];
    v213 = Math["max"](0, Math["min"](1, v213));
    const v214 = v213 * v211;
    if (!isFinite(v214)) return;
    ((this["_isSeeking"] = true),
      (this["audioEl"]["currentTime"] = v214),
      this["_progressController"]?.["sync"]({
        currentTime: v214,
        duration: v211,
        force: true,
        showLine: true,
      }),
      this["audioEl"]["addEventListener"](
        "seeked",
        () => {
          ((this["_isSeeking"] = false),
            this["_progressController"]?.["sync"]({
              force: true,
              showLine: true,
            }));
        },
        { once: true },
      ));
  }
  ["_setAudioPreviewResultState"](v215) {
    const v216 = !!v215;
    if (this["_waveBgEl"])
      this["_waveBgEl"]["style"]["display"] = v216 ? "" : "none";
    if (this["_wavePlayed"])
      this["_wavePlayed"]["style"]["display"] = v216 ? "" : "none";
    if (this["_progressLine"])
      this["_progressLine"]["style"]["display"] = v216 ? "" : "none";
    if (this["_bar"]) this["_bar"]["style"]["display"] = v216 ? "" : "none";
    if (this["_controlsEl"])
      this["_controlsEl"]["style"]["display"] = v216 ? "" : "none";
    if (this["_placeholderEl"])
      this["_placeholderEl"]["style"]["display"] = v216 ? "none" : "";
  }
  ["_getCurrentGateModelId"]() {
    return getWorkflowGateModelId(this["_getCurrentWorkflow"]()["key"]);
  }
  async ["_ensureVipAccessForCurrentWorkflow"]() {
    const v217 = this["_getCurrentGateModelId"]();
    if (!v217) return ((this["_vipInstallId"] = ""), true);
    const v218 = window["isModelAllowedBySubscription"],
      v219 = typeof v218 === "function" ? v218(v217, "runninghubwf") : true;
    if (!v219)
      return (
        typeof window["openSubscriptionDialog"] === "function"
          ? window["openSubscriptionDialog"]({
              modelId: v217,
              provider: "runninghubwf",
            })
          : window["showToast"]?.("需要VIP授权，请先激活CDKEY", "warn"),
        false
      );
    if (typeof window["ensureSubscriptionInstallId"] === "function")
      try {
        this["_vipInstallId"] = String(
          await window["ensureSubscriptionInstallId"](),
        )["trim"]();
      } catch {
        this["_vipInstallId"] = "";
      }
    else
      this["_vipInstallId"] = String(window["__aicInstallId"] || "")["trim"]();
    return true;
  }
  async ["_resolveAudioDurationSec"](v220) {
    const v221 = String(v220 || "")["trim"]();
    if (!v221 || typeof Audio !== "function") return 0;
    return await new Promise((v222) => {
      const v223 = new Audio();
      let v224 = false;
      const v225 = (v226) => {
          if (v224) return;
          ((v224 = true),
            clearTimeout(v227),
            v223["removeEventListener"]("loadedmetadata", v228),
            v223["removeEventListener"]("durationchange", v228),
            v223["removeEventListener"]("error", v229),
            v223["removeAttribute"]?.("src"),
            v223["load"]?.(),
            v222(v226));
        },
        v228 = () => {
          const v230 = Number(v223["duration"]);
          v225(Number["isFinite"](v230) && v230 > 0 ? v230 : 0);
        },
        v229 = () => v225(0),
        v227 = setTimeout(() => v225(0), 5000);
      ((v223["preload"] = "metadata"),
        v223["addEventListener"]("loadedmetadata", v228, { once: true }),
        v223["addEventListener"]("durationchange", v228, { once: true }),
        v223["addEventListener"]("error", v229, { once: true }),
        void attachMediaElementPlaybackSource(v223, v221, {
          preload: "metadata",
        })["catch"](() => {
          !String(v223["getAttribute"]?.("src") || v223["src"] || "")[
            "trim"
          ]() && ((v223["src"] = v221), v223["load"]?.());
        }));
    });
  }
  async ["_validateAdvancedVoiceCloneDurations"](v231 = []) {
    if (
      this["_getCurrentWorkflow"]()["key"] !== ADVANCED_VOICE_CLONE_WORKFLOW_KEY
    )
      return true;
    const v232 = Array["isArray"](v231) ? v231 : [];
    for (const v233 of v232) {
      const v234 = await this["_resolveAudioDurationSec"](v233?.["url"]);
      if (
        Number["isFinite"](v234) &&
        v234 > 0 &&
        (v234 < ADVANCED_VOICE_CLONE_MIN_SECONDS ||
          v234 > ADVANCED_VOICE_CLONE_MAX_SECONDS)
      ) {
        const v235 =
          String(v233?.["refSlot"] || "") === "audio2" ? "音频2" : "音频1";
        return (
          window["showToast"]?.(
            v235 +
              "时长约 " +
              v234["toFixed"](1) +
              "\x20秒，进阶声音克隆仅支持\x203~15\x20秒音频",
            "warn",
          ),
          false
        );
      }
    }
    return true;
  }
  ["_createStatusCard"](v236, v237) {
    const v238 = document["createElement"]("div");
    ((v238["className"] = "gen-status-card"),
      Object["assign"](v238["style"], {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        gap: "8px",
        padding: "16px",
        boxSizing: "border-box",
        background: "var(--bg-panel-card)",
        textAlign: "center",
      }));
    const v239 = Number(v237) === 0,
      v240 = v239 ? "var(--green)" : "var(--white-80)";
    return (
      (v238["innerHTML"] =
        '\n      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' +
        v240 +
        "\x22\x20stroke-width=\x222\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<circle\x20cx=\x2212\x22\x20cy=\x2212\x22\x20r=\x2210\x22/><path\x20d=\x22" +
        (v239 ? "M8 12l2.5 2.5L16 9" : "M12 8v5") +
        '" />' +
        (v239 ? "" : '<line x1="12" y1="16" x2="12.01" y2="16" />') +
        '\n      </svg>\n      <span style="color:' +
        v240 +
        ';font-size:12px;font-weight:600;line-height:1.4;">' +
        v236 +
        "</span>\n    "),
      v238
    );
  }
  ["_ensureStatusOverlayEl"]() {
    if (this["_statusOverlayEl"]) return this["_statusOverlayEl"];
    return (
      (this["_statusOverlayEl"] = document["createElement"]("div")),
      (this["_statusOverlayEl"]["className"] = "dreamina-status-overlay"),
      Object["assign"](this["_statusOverlayEl"]["style"], {
        position: "absolute",
        inset: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        padding: "16px",
        boxSizing: "border-box",
        zIndex: "11",
      }),
      this["previewEl"]?.["appendChild"](this["_statusOverlayEl"]),
      this["_statusOverlayEl"]
    );
  }
  ["_clearStatusOverlay"]() {
    if (!this["_statusOverlayEl"]) return;
    (this["_statusOverlayEl"]["remove"](), (this["_statusOverlayEl"] = null));
  }
  ["_syncStatusOverlay"](v241 = this["_data"], v242 = false) {
    const v243 =
        String(v241?.["rhStatusMessage"] || "")["trim"]() ||
        (String(v241?.["jobStatus"] || "")["toLowerCase"]() === "error"
          ? getTaskMessage(v241)
          : ""),
      v244 = v241?.["rhStatusCode"];
    if (!v242 && v243) {
      const v245 = this["_ensureStatusOverlayEl"]();
      ((v245["innerHTML"] = ""),
        v245["appendChild"](this["_createStatusCard"](v243, v244)));
      if (this["_placeholderEl"])
        this["_placeholderEl"]["style"]["display"] = "none";
      return;
    }
    this["_clearStatusOverlay"]();
  }
  async ["_ensureWaveform"](
    v246,
    { persistedOnly: persistedOnly = false } = {},
  ) {
    const v247 = String(v246 || "")["trim"]();
    if (!v247) return;
    const v248 = ++this["_waveToken"],
      v249 = localPathToUrl(this["_data"]?.["waveformLocalPath"]),
      v250 = { width: 200, height: 80, samples: 190 };
    let v251 = "";
    v249 && (v251 = await getWaveformBarsPathFromPersistedUrl(v249, v250));
    !v251 &&
      !persistedOnly &&
      (v251 = await getWaveformBarsPathFromUrl(v247, v250));
    if (!this["audioEl"] || !this["_root"] || !this["_root"]["isConnected"])
      return;
    if (v248 !== this["_waveToken"]) return;
    if (!v251) return;
    if (this["_waveBgPath"]) this["_waveBgPath"]["setAttribute"]("d", v251);
    if (this["_waveFgPath"]) this["_waveFgPath"]["setAttribute"]("d", v251);
  }
  ["mount"]() {
    const v252 = document["createElement"]("div");
    (Object["assign"](v252["style"], {
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "visible",
      pointerEvents: "auto",
      cursor: "default",
    }),
      (this["_root"] = v252),
      (v252["innerHTML"] = AUDIO_TOOLBAR_HTML),
      (this["previewEl"] = document["createElement"]("div")),
      (this["previewEl"]["className"] =
        "node-card\x20media-card\x20audio-card\x20aigen-audio-preview"),
      this["previewEl"]["style"]["setProperty"]("width", "100%", "important"),
      this["previewEl"]["style"]["setProperty"]("height", "100%", "important"),
      this["previewEl"]["style"]["setProperty"](
        "min-height",
        "160px",
        "important",
      ),
      this["previewEl"]["style"]["setProperty"](
        "flex-shrink",
        "0",
        "important",
      ),
      this["previewEl"]["style"]["setProperty"]("flex-grow", "0", "important"),
      (this["_audioCard"] = this["previewEl"]));
    const v253 = document["createElement"]("div");
    ((v253["className"] = "waveform waveform-bg"),
      (v253["innerHTML"] =
        '<svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">\n      <path d="' +
        WAVE_PATH +
        '" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"/>\n      <path d="M0,40 L200,40" stroke="var(--blue)" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>\n    </svg>'),
      this["previewEl"]["appendChild"](v253),
      (this["_waveBgEl"] = v253));
    const v254 = document["createElement"]("div");
    ((v254["className"] = "waveform\x20waveform-unplayed"),
      (v254["innerHTML"] =
        '<svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">\n      <path d="' +
        WAVE_PATH +
        '" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"/>\n      <path d="M0,40 L200,40" stroke="var(--blue)" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>\n    </svg>'),
      this["previewEl"]["appendChild"](v254),
      (this["_wavePlayed"] = v254));
    const v255 = this["previewEl"]["querySelectorAll"](".waveform-bg svg path"),
      v256 = this["previewEl"]["querySelectorAll"](
        ".waveform-unplayed svg path",
      );
    ((this["_waveBgPath"] = v255 && v255["length"] ? v255[0] : null),
      (this["_waveFgPath"] = v256 && v256["length"] ? v256[0] : null));
    const v257 = document["createElement"]("div");
    ((v257["className"] = "media-progress-line"),
      this["previewEl"]["appendChild"](v257),
      (this["_progressLine"] = v257));
    const v258 = document["createElement"]("div");
    ((v258["className"] = "media-progress-bar"),
      this["previewEl"]["appendChild"](v258),
      (this["_bar"] = v258));
    const v259 = document["createElement"]("div");
    ((v259["className"] = "audio-controls"),
      (v259["innerHTML"] =
        '\n      <button type="button" class="audio-play-btn">\n        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>\n      </button>\n      <div class="audio-time-wrap">\n        <span class="audio-time-display">0:00 / 0:00</span>\n      </div>'),
      this["previewEl"]["appendChild"](v259),
      (this["_controlsEl"] = v259),
      (this["_playBtn"] = v259["querySelector"](".audio-play-btn")),
      (this["_timeEl"] = v259["querySelector"](".audio-time-display")),
      (this["audioEl"] = document["createElement"]("audio")),
      (this["audioEl"]["className"] = "audio-player"),
      (this["audioEl"]["controls"] = false),
      (this["audioEl"]["draggable"] = false),
      (this["audioEl"]["preload"] = "none"),
      (this["_progressController"] = createAudioPlaybackProgressController({
        audioEl: this["audioEl"],
        wavePlayedEl: this["_wavePlayed"],
        progressLineEl: this["_progressLine"],
        timeEl: this["_timeEl"],
        trackEl: this["_bar"],
        formatTime: (v260) => this["_fmtTime"](v260),
        shouldSuppressSync: () => this["_isSeeking"],
      })["attach"]()));
    const v261 = document["createElement"]("div");
    ((v261["className"] = "img-node-placeholder"),
      Object["assign"](v261["style"], {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        color: "var(--text-muted)",
        pointerEvents: "none",
        userSelect: "none",
      }),
      (v261["innerHTML"] =
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20class=\x22placeholder-icon-svg\x22\x20width=\x2232\x22\x20height=\x2232\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x221.2\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<path\x20d=\x22M9\x2018V5l12-2v13\x22/><circle\x20cx=\x226\x22\x20cy=\x2218\x22\x20r=\x223\x22/><circle\x20cx=\x2218\x22\x20cy=\x2216\x22\x20r=\x223\x22/>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</svg>"),
      (this["_placeholderEl"] = v261),
      this["previewEl"]["appendChild"](this["audioEl"]),
      this["previewEl"]["appendChild"](v261),
      syncPreviewNodeLoading(
        this["nodeId"],
        this["previewEl"],
        this["_getPreviewGenerateButtonLoadingOptions"](),
      ));
    let v262 = { x: 0, y: 0 };
    (this["previewEl"]["addEventListener"]("pointerdown", (v263) => {
      if (v263["target"]["closest"](".media-progress-bar")) return;
      v262 = { x: v263["clientX"], y: v263["clientY"] };
    }),
      this["previewEl"]["addEventListener"]("pointerup", (v264) => {
        if (
          v264["target"]["closest"](".media-progress-bar") ||
          v264["target"]["closest"](".audio-play-btn") ||
          v264["target"]["closest"](".audio-controls")
        )
          return;
        const v265 = Math["hypot"](
          v264["clientX"] - v262["x"],
          v264["clientY"] - v262["y"],
        );
        if (v265 >= 5) return;
        if (!this["audioEl"] || !this["audioEl"]["duration"]) return;
        const v266 = this["previewEl"]["getBoundingClientRect"](),
          v267 = Math["max"](
            0,
            Math["min"](1, (v264["clientX"] - v266["left"]) / v266["width"]),
          ),
          v268 = v267 * this["audioEl"]["duration"];
        ((this["audioEl"]["currentTime"] = v268),
          this["_progressController"]?.["sync"]({
            currentTime: v268,
            duration: this["audioEl"]["duration"],
            force: true,
            showLine: true,
          }));
      }),
      this["_bar"]?.["addEventListener"]("click", (v269) => {
        this["_seekTo"](v269["clientX"]);
      }),
      this["_playBtn"]?.["addEventListener"]("pointerdown", (v270) => {
        v270["stopPropagation"]();
        if (!this["_currentSrc"]) return;
        if (this["audioEl"]["paused"]) this["_playAudio"]();
        else this["audioEl"]["pause"]();
      }),
      this["audioEl"]["addEventListener"]("play", () =>
        this["_setPlayIcon"](false),
      ),
      this["audioEl"]["addEventListener"]("pause", () =>
        this["_setPlayIcon"](true),
      ),
      this["_unregisterAudioPlaybackClient"]?.(),
      (this["_unregisterAudioPlaybackClient"] = registerAudioPlaybackClient(
        this["nodeId"],
        {
          stopForExternalPlayback: () =>
            this["_stopAudioForExternalPlayback"](),
        },
      )));
    const v271 = this["_resolveNodeAudioUrl"](this["_data"]);
    v271
      ? (this["_prepareAudio"](v271),
        this["_applyResultWideLayout"](this["_data"], false),
        this["_setAudioPreviewResultState"](true))
      : (this["_setAudioPreviewResultState"](false),
        this["_syncStatusOverlay"](this["_data"], false));
    v252["appendChild"](this["previewEl"]);
    const v272 = document["createElement"]("div");
    ((v272["className"] = "text-prompt-panel"),
      (this["_promptPanel"] = v272),
      v272["addEventListener"]("pointerdown", (v273) => {
        v273["stopPropagation"]();
      }),
      v272["addEventListener"]("dblclick", (v274) => {
        !v274["target"]["closest"](".prompt-textarea") &&
          (v274["preventDefault"](), v274["stopPropagation"]());
      }),
      (this["refBarEl"] = document["createElement"]("div")),
      (this["refBarEl"]["className"] = "node-ref-bar"),
      v272["appendChild"](this["refBarEl"]),
      this["refBarEl"]["addEventListener"]("click", (v275) => {
        const v276 = v275["target"]["closest"](".ref-thumb-delete");
        if (v276) {
          (v275["stopPropagation"](), v275["preventDefault"]());
          const v277 = v276["closest"](".ref-thumb-wrap");
          if (v277?.["dataset"]?.["refOrigin"] === "asset") {
            const v278 = {
                assetId: v277["dataset"]["assetId"],
                assetIndex: v277["dataset"]["assetIndex"],
                type:
                  v277["dataset"]["refType"] ||
                  v277["dataset"]["kind"] ||
                  "audio",
                occurrence: v277["dataset"]["assetOccurrence"],
              },
              v279 = String(v277["dataset"]["assetRefSource"] || "")["trim"](),
              v280 =
                v279 === "hidden"
                  ? removePromptAssetInputRefFromNode(this, v278)
                  : removeAssetMentionPillFromPrompt(this, v278) ||
                    removePromptAssetInputRefFromNode(this, v278);
            if (v280) return;
          }
          const v281 = v277?.["dataset"]["edgeId"];
          if (v281) appStore["removeEdge"](v281);
          return;
        }
        const v282 = v275["target"]["closest"](".rh-v5-ref-box[data-slot]");
        if (v282) {
          (v275["stopPropagation"](), v275["preventDefault"]());
          const v283 = String(v282["dataset"]["slot"] || "")["trim"]();
          if (!v283 || !this["_audioRefUploadInput"]) return;
          ((this["_audioRefUploadSlot"] = v283),
            (this["_audioRefUploadAnchorNodeId"] = this["nodeId"]),
            (this["_audioRefUploadInput"]["accept"] = "audio/*"),
            this["_audioRefUploadInput"]["click"]());
          return;
        }
        const v284 = v275["target"]["closest"](".prompt-attachment-btn");
        if (!v284 || v275["_pickConnectHandled"]) return;
        (v275["stopPropagation"](), v275["preventDefault"]());
        const v285 = appStore["getState"]()["pickConnectMode"];
        (v285 && v285["active"] && v285["sourceNodeId"] === this["nodeId"]
          ? appStore["setPickConnectMode"]({ active: false })
          : appStore["setPickConnectMode"]({
              active: true,
              sourceNodeId: this["nodeId"],
              handleDirection: "left",
              preferredRefSlot: undefined,
            }),
          this["_syncPickConnectVisualState"]());
      }),
      this["refBarEl"]["addEventListener"]("pointerdown", (v286) => {
        if (
          v286["target"]["closest"](
            ".prompt-attachment-btn,\x20.ref-thumb-delete,\x20.ref-upload-slot,\x20.rh-v5-ref-box",
          )
        )
          v286["stopPropagation"]();
      }),
      (this["_unbindRefThumbHoverPreview"] = bindRefThumbHoverPreview(
        this["refBarEl"],
      )),
      (this["_audioRefUploadInput"] = document["createElement"]("input")),
      (this["_audioRefUploadInput"]["type"] = "file"),
      (this["_audioRefUploadInput"]["accept"] = "audio/*"),
      (this["_audioRefUploadInput"]["style"]["display"] = "none"),
      v272["appendChild"](this["_audioRefUploadInput"]),
      this["_audioRefUploadInput"]["addEventListener"](
        "change",
        async (v287) => {
          const v288 = v287["target"]["files"]?.[0],
            v289 = String(this["_audioRefUploadSlot"] || "")["trim"](),
            v290 = String(this["_audioRefUploadAnchorNodeId"] || "")["trim"]();
          if (!v288 || !v289 || !v290) {
            this["_audioRefUploadInput"]["value"] = "";
            return;
          }
          try {
            if (!String(v288["type"] || "")["startsWith"]("audio/"))
              throw new Error("该位置只支持上传音频文件");
            const v291 = window["currentProjectId"] || "default_v2_project",
              v292 = await uploadFile(v288, v291),
              v293 = String(v292?.["url"] || "")["trim"]();
            if (!v293) throw new Error("上传失败：未返回文件地址");
            const v294 = appStore["getState"](),
              v295 = v294["nodes"]?.[v290];
            if (!v295) throw new Error("上传失败：找不到锚点节点");
            const v296 = pickResultLocalPath(v292) || normalizeLocalPath(v293),
              v297 = 320,
              v298 = 140,
              {
                spacing: v299,
                direction: v300,
                avoidOverlap: v301,
              } = getNodeSpawnPrefs(),
              v302 = v300 === "down" ? "down" : "left",
              v303 = Number(v295["x"]) || 0,
              v304 = Number(v295["y"]) || 0,
              v305 = Number(v295["width"]) || 360,
              v306 = Number(v295["height"]) || 360,
              v307 = v304 + Math["round"]((v306 - v298) / 2);
            let v308 = v307;
            if (
              v289 === "audioRef" &&
              this["_getCurrentWorkflow"]()["key"] === "voice_convert"
            )
              v308 = v307 - Math["round"](v298 / 2) - 8;
            else
              v289 === "audioTarget" &&
                this["_getCurrentWorkflow"]()["key"] === "voice_convert" &&
                (v308 = v307 + Math["round"](v298 / 2) + 8);
            const v309 = v303 - v299 - v297,
              v310 = v301
                ? findAvailablePosition(
                    v294["nodes"] || {},
                    v309,
                    v302 === "down" ? v304 + v306 + v299 : v308,
                    v297,
                    v298,
                    v299,
                    v302,
                  )
                : { x: v309, y: v302 === "down" ? v304 + v306 + v299 : v308 };
            (appStore["batch"](() => {
              const v311 = appStore["getIncomingEdges"](this["nodeId"]);
              for (const v312 of v311) {
                if (String(v312?.["refSlot"] || "") === v289)
                  appStore["removeEdge"](v312["id"]);
              }
              removeCoveredAssetInputRefForConnection({
                targetId: this["nodeId"],
                sourceKind: "audio",
                refSlot: v289,
              });
              const v313 = generateId("node");
              (appStore["addNode"]({
                id: v313,
                type: "source-audio",
                x: v310["x"],
                y: v310["y"],
                width: v297,
                height: v298,
                src: v293,
                localPath: v296,
                assetId: v292["assetId"] || "",
                originalLocalPath:
                  v292["originalLocalPath"] || v292["localPath"] || "",
                waveformLocalPath: v292["waveformLocalPath"] || "",
                derivativeStatus:
                  v292["derivativeStatus"] || v292["status"] || "",
                mediaTaskId: v292["mediaTaskId"] || "",
                mediaTaskKind: v292["mediaTaskKind"] || "",
                mediaTaskStatus: v292["mediaTaskStatus"] || "",
                mediaTaskProgress: Number(v292["mediaTaskProgress"] || 0) || 0,
                mediaTaskError: v292["mediaTaskError"] || "",
                fileName: v292["filename"] || v288["name"] || "",
                name: v288["name"] || "源音频",
              }),
                appStore["addEdge"]({
                  id: generateId("edge"),
                  sourceId: v313,
                  targetId: this["nodeId"],
                  refSlot: v289,
                  createdAt: Date["now"](),
                }),
                appStore["setSelectedNodes"]([this["nodeId"]]));
            }),
              this["_updateSubmitButtonState"]());
          } catch (v314) {
            window["showToast"]?.(
              v314?.["message"] || "上传失败，请重试",
              "error",
            );
          } finally {
            ((this["_audioRefUploadInput"]["value"] = ""),
              (this["_audioRefUploadSlot"] = ""),
              (this["_audioRefUploadAnchorNodeId"] = ""));
          }
        },
      ));
    const v315 = document["createElement"]("div");
    ((v315["className"] = "prompt-input-wrapper"),
      (this["_promptInputWrap"] = v315),
      (this["promptEl"] = document["createElement"]("div")),
      (this["promptEl"]["className"] = "prompt-textarea\x20custom-textarea"),
      (this["promptEl"]["contentEditable"] = "true"),
      (this["promptEl"]["spellcheck"] = false),
      (this["promptEl"]["dataset"]["placeholder"] =
        "描述你想要生成的音频内容。"),
      (this["_flushPromptHtmlCommit"] = () => flushPromptHtmlCommit(this)),
      this["promptEl"]["addEventListener"]("input", (v316) => {
        (schedulePromptHtmlCommit(this),
          checkSlashTrigger(v316, {
            promptEl: this["promptEl"],
            nodeType: this["_data"]["type"],
            nodeId: this["nodeId"],
            onGenerate: (v317, v318) => this["_onGenerate"](v317, v318),
          }),
          _checkAtTrigger(this, v316),
          _syncEdgesOrderFromPills(this),
          this["_updateSubmitButtonState"]());
      }),
      this["promptEl"]["addEventListener"]("blur", () => {
        flushPromptHtmlCommit(this);
      }),
      this["promptEl"]["addEventListener"]("mouseover", (v319) =>
        _handlePillHover(v319, this),
      ),
      this["promptEl"]["addEventListener"]("mouseout", (v320) =>
        _handlePillOut(v320, this),
      ),
      this["promptEl"]["addEventListener"]("keydown", (v321) => {
        if (handlePromptSelectAll(this, v321)) return;
        if (_handleMentionMenuKeyboard(v321)) return;
        if (handleSlashKeyboardNavigation(v321)) return;
        (v321["key"] === "Enter" &&
          !v321["shiftKey"] &&
          (v321["preventDefault"](),
          flushPromptHtmlCommit(this),
          this["btnEl"]?.["click"]()),
          _handlePillKeyboard(this, v321));
      }),
      this["promptEl"]["addEventListener"]("paste", (v322) => {
        handlePromptPaste(this, v322);
      }));
    this["_data"]["prompt"] &&
      ((this["promptEl"]["innerHTML"] = sanitizePromptHtml(
        this["_data"]["prompt"],
      )),
      _rehydratePromptPills(this));
    (v315["appendChild"](this["promptEl"]),
      this["_syncPromptBoxSizeFromData"](this["_data"]),
      this["_setupPromptBoxResize"](),
      v272["appendChild"](v315),
      this["_syncWorkflowDefaults"](),
      this["_syncAudioPromptHelpTip"]());
    const v323 = this["_getCurrentWorkflow"](),
      v324 = renderModelUiSchemaControls(v323["key"], this["_data"], {
        placement: "instance",
        variant: "instanceToggle",
      }),
      v325 = buildAudioModelMenuHtml({
        activeModel: v323["key"],
        workflowItems: AUDIO_WORKFLOW_ITEMS,
      }),
      v326 = document["createElement"]("div");
    ((v326["className"] = "prompt-panel-footer"),
      (v326["innerHTML"] =
        '\n          <div class="img-model-pills">\n            <div class="img-model-wrap" style="position:relative;">\n              ' +
        buildAudioModelTriggerHtml({ label: v323["label"] }) +
        "\n              " +
        v325 +
        '\n            </div>\n          </div>\n          <div class="prompt-actions">\n            <button type="button" class="prompt-submit debug-wrench-btn" title="调试 API 参数">\n              ' +
        DEBUG_WRENCH_ICON_HTML +
        '\n            </button>\n            <div class="ui-schema-placement ui-schema-instance-slot" style="' +
        (v324 ? "" : "display:none;") +
        '">\n              ' +
        v324 +
        '\n            </div>\n            <button type="button" class="prompt-submit img-gen-btn" title="生成">\n              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n            </button>\n          </div>'),
      (this["modelWrap"] = v326["querySelector"](".img-model-wrap")),
      (this["btnEl"] = v326["querySelector"](".img-gen-btn")));
    const v327 = v326["querySelector"](".debug-wrench-btn"),
      v328 = v326["querySelector"](".img-model-btn-trigger"),
      v329 = v326["querySelector"](".img-model-menu"),
      v330 = v326["querySelector"]("[data-runninghub-toggle]"),
      v331 = v326["querySelector"](".runninghub-submenu"),
      v332 = v326["querySelector"](".img-model-label");
    ((this["_modelMenu"] = v329),
      (this["_runninghubSubmenu"] = v331),
      (this["_modelLabelEl"] = v332),
      this["_footerControllerCleanup"]?.(),
      (this["_footerControllerCleanup"] = bindNodeFooterController(v326, {
        onOutsideClose: () => this["_closeModelMenu"](),
      })),
      this["_uiSchemaCleanup"]?.(),
      (this["_uiSchemaCleanup"] = bindModelUiSchemaControls(v326, {
        nodeId: this["nodeId"],
        nodeData: this["_data"],
        store: appStore,
      })),
      v327?.["addEventListener"]("click", async (v333) => {
        (v333["stopPropagation"](), flushPromptHtmlCommit(this));
        const v334 = await this["_buildPayload"]();
        if (!v334) return;
        try {
          const v335 = await buildGenerateAudioRequest(v334),
            v336 = formatFinalApiDebugRequest(v335),
            v337 = appStore["getState"](),
            v338 = this["_data"]["x"] + (this["_data"]["width"] || 300) + 50,
            v339 = this["_data"]["y"];
          let v340 = Object["values"](v337["nodes"])["find"](
            (v341) => v341["type"] === "debug",
          );
          if (!v340) {
            const v342 = "debug-" + Date["now"]();
            appStore["addNode"]({
              id: v342,
              type: "debug",
              x: v338,
              y: v339,
              width: 380,
              height: 300,
              name: "调试节点",
              outputText: v336,
            });
          } else
            appStore["updateNodeData"](v340["id"], {
              outputText: v336,
              x: v338,
              y: v339,
            });
          window["showToast"]?.("🔧 已展示最终 API 参数", "warn");
        } catch (v343) {
          window["showToast"]?.("构造请求失败: " + v343["message"], "error");
        }
      }),
      bindNodeModelMenuTrigger({
        root: v326,
        trigger: v328,
        menu: v329,
        activateMenuKeyboard: activateMenuKeyboard,
      }),
      v330?.["addEventListener"]("click", (v344) => {
        v344["stopPropagation"]();
      }),
      v331?.["querySelectorAll"](".floating-menu-item")["forEach"]((v345) => {
        v345["addEventListener"]("click", (v346) => {
          v346["stopPropagation"]();
          const v347 = this["_getCurrentWorkflow"]()["key"];
          (this["_setSelectedWorkflow"](v345["dataset"]["value"]),
            this["_getCurrentWorkflow"]()["key"] !== v347 &&
              this["_closeModelMenu"]());
        });
      }),
      this["btnEl"]["addEventListener"]("click", () => {
        (flushPromptHtmlCommit(this), this["_handleGenerateOrCancel"]());
      }),
      (this["_docClickHandler"] = null),
      v272["appendChild"](v326),
      v252["appendChild"](v272));
    const v348 = v252["querySelector"](".node-floating-toolbar");
    if (v348) {
      v348["addEventListener"]("pointerdown", (v349) =>
        v349["stopPropagation"](),
      );
      const v350 = v348["querySelector"](".act-clip, .clip-btn"),
        v351 = v348["querySelector"](".act-separate, .separate-btn"),
        v352 = v348["querySelector"](".act-speed, .speed-btn"),
        v353 = v348["querySelector"](".act-download, .download-btn"),
        v354 = [1, 1.25, 1.5, 2];
      (v350?.["addEventListener"]("pointerdown", (v355) => {
        (v355["stopPropagation"](),
          AudioClipController["init"](this["nodeId"]));
      }),
        bindRunningHubToolbarTaskButton({
          button: v351,
          getTask: () => getRunningAudioSeparationTaskForNode(this["nodeId"]),
          cancelTask: () =>
            cancelAudioSeparationTaskForNode(this["nodeId"], { notify: true }),
          cancelTooltip: "取消人声分离",
          eventTypes: ["pointerdown", "click"],
        }),
        v351?.["addEventListener"]("pointerdown", (v356) => {
          if (getRunningAudioSeparationTaskForNode(this["nodeId"])) {
            (v356["preventDefault"](),
              v356["stopPropagation"](),
              void cancelAudioSeparationTaskForNode(this["nodeId"], {
                notify: true,
              }));
            return;
          }
          (v356["stopPropagation"](),
            void runAudioSeparationFromNode(this["nodeId"]));
        }),
        v352?.["addEventListener"]("pointerdown", (v357) => {
          (v357["stopPropagation"](),
            (this["_speedIdx"] = (this["_speedIdx"] + 1) % v354["length"]));
          const v358 = v354[this["_speedIdx"]];
          if (this["audioEl"]) this["audioEl"]["playbackRate"] = v358;
          v352["textContent"] = v358["toFixed"](1) + "x";
        }),
        bindAudioDownloadAction({
          button: v353,
          getNodeData: () =>
            appStore["getState"]()["nodes"]?.[this["nodeId"]] ||
            this["_data"] ||
            {},
          getAudioElement: () => this["audioEl"],
          notifyMissing: () =>
            window["showToast"]?.("没有可下载的音频", "warn"),
        }));
    }
    return (
      this["_renderRefBar"](),
      this["_assetMentionRegistryUnsubscribe"]?.(),
      (this["_assetMentionRegistryUnsubscribe"] = subscribeAssetMentionRegistry(
        () => {
          if (this["_assetMentionRegistryRefreshPending"]) return;
          ((this["_assetMentionRegistryRefreshPending"] = true),
            queueMicrotask(() => {
              this["_assetMentionRegistryRefreshPending"] = false;
              if (!appStore["getState"]()["nodes"]?.[this["nodeId"]]) return;
              (_rehydratePromptPills(this),
                this["_renderRefBar"](),
                this["_updateSubmitButtonState"]());
            }));
        },
      )),
      this["_syncPickConnectVisualState"](),
      this["_updateSubmitButtonState"](),
      queueMicrotask(() => {
        appStore["getState"]()["nodes"]?.[this["nodeId"]] &&
          this["_maybeResumeRunningHubTask"]();
      }),
      v252
    );
  }
  ["_updateSubmitButtonState"]() {
    if (!this["btnEl"]) return;
    const v359 =
        appStore["getState"]()["nodes"]?.[this["nodeId"]] ||
        this["_data"] ||
        {},
      v360 = resolveGenerationButtonMode(v359, {
        cancellable:
          String(v359?.["provider"] || "runninghubwf")["toLowerCase"]() ===
          "runninghubwf",
        cancelInFlight: this["_rhCancelInFlight"] === true,
      });
    if (v360["busy"]) {
      String(v359?.["provider"] || "runninghubwf")["toLowerCase"]() ===
      "runninghubwf"
        ? setGenerateButtonCancellableUi(this["btnEl"], {
            title: "点击生成，再次点击可以取消运行",
            tooltip: "点击生成，再次点击可以取消运行",
            ariaLabel: "取消生成音频",
            color: "var(--red)",
            busy: true,
          })
        : setGenerateButtonLoadingUi(this["btnEl"], {
            title: "生成",
            disabled: true,
            ariaLabel: "生成",
          });
      ((this["btnEl"]["disabled"] = v360["disabled"]),
        (this["btnEl"]["style"]["cursor"] = v360["cursor"]));
      return;
    }
    resetGenerateButtonIdleUi(this["btnEl"], "生成");
    const { payload: v361, validation: v362 } = this["_buildPayloadSnapshot"](),
      v363 = v362["ok"] && !!v361["audioWorkflowKey"];
    !v363
      ? ((this["btnEl"]["disabled"] = true),
        (this["btnEl"]["style"]["cursor"] = "var(--unavailable-cursor)"))
      : ((this["btnEl"]["disabled"] = false),
        (this["btnEl"]["style"]["cursor"] = ""));
  }
  ["_getAudioElementSource"]() {
    return getMediaElementPlaybackSourceKey(this["audioEl"]);
  }
  ["_getAudioElementCurrentSource"]() {
    return getMediaElementCurrentSource(this["audioEl"]);
  }
  ["_isAudioElementReady"]() {
    if (!this["audioEl"] || !this["_getAudioElementCurrentSource"]())
      return false;
    const v364 = Number(this["audioEl"]["readyState"] || 0);
    return v364 >= 2;
  }
  ["_readAudioDurationSec"]() {
    const v365 = Number(this["audioEl"]?.["duration"]);
    return Number["isFinite"](v365) && v365 > 0 ? v365 : 0;
  }
  ["_rewindEndedAudioIfNeeded"]() {
    if (!this["audioEl"]) return;
    const v366 = this["_readAudioDurationSec"]();
    if (!(v366 > 0)) return;
    const v367 = Number(this["audioEl"]["currentTime"] || 0),
      v368 = Number["isFinite"](v367) && v367 >= v366 - 0.05;
    if (this["audioEl"]["ended"] !== true && !v368) return;
    try {
      this["audioEl"]["currentTime"] = 0;
    } catch {}
    this["_progressController"]?.["sync"]({
      currentTime: 0,
      duration: v366,
      force: true,
      showLine: true,
    });
  }
  ["_clearAudioElementSource"]() {
    if (!this["audioEl"]) return;
    try {
      this["audioEl"]["pause"]?.();
    } catch {}
    (this["audioEl"]["removeAttribute"]?.("src"),
      clearDesktopMediaPlaybackSourceMetadata(this["audioEl"]),
      (this["audioEl"]["preload"] = "none"));
    try {
      this["audioEl"]["load"]?.();
    } catch {}
  }
  ["_bindAudioLoadHandlers"](v369) {
    if (!this["audioEl"]) return;
    const v370 = () => {
      if (this["_currentSrc"] === v369) stopLoading(this["previewEl"]);
    };
    ((this["audioEl"]["onloadeddata"] = v370),
      (this["audioEl"]["oncanplay"] = v370),
      (this["audioEl"]["onplaying"] = v370),
      (this["audioEl"]["onerror"] = () => {
        if (this["_currentSrc"] === v369) stopLoading(this["previewEl"]);
      }));
  }
  ["_prepareAudio"](v371) {
    const v372 = String(v371 || "")["trim"]();
    if (!v372)
      return (
        typeof this["_cancelDeferredWaveform"] === "function" &&
          (this["_cancelDeferredWaveform"](),
          (this["_cancelDeferredWaveform"] = null)),
        this["_clearAudioElementSource"](),
        (this["_currentSrc"] = null),
        this["_progressController"]?.["reset"](),
        false
      );
    const v373 = this["_currentSrc"] !== v372;
    ((this["_currentSrc"] = v372), this["_clearStatusOverlay"]());
    if (v373) this["_progressController"]?.["reset"]();
    this["_getAudioElementSource"]() && this["_clearAudioElementSource"]();
    ((this["audioEl"]["preload"] = "none"),
      this["_bindAudioLoadHandlers"](v372),
      stopLoading(this["previewEl"]),
      void this["_ensureWaveform"](v372, { persistedOnly: true }));
    if (this["_placeholderEl"])
      this["_placeholderEl"]["style"]["display"] = "none";
    return (
      this["_setAudioPreviewResultState"](true),
      this["_syncStatusOverlay"](this["_data"], true),
      true
    );
  }
  async ["_loadAudio"](v374, { showLoading: showLoading = true } = {}) {
    const v375 = String(v374 || "")["trim"]();
    if (!v375) return this["_prepareAudio"]("");
    const v376 = this["_currentSrc"] !== v375;
    ((this["_currentSrc"] = v375), this["_clearStatusOverlay"]());
    if (v376) this["_progressController"]?.["reset"]();
    this["_bindAudioLoadHandlers"](v375);
    const v377 = !!this["_getAudioElementCurrentSource"](),
      v378 = !isMediaElementPlaybackSource(this["audioEl"], v375) || !v377;
    if (!v378 && this["_isAudioElementReady"]()) {
      if (this["audioEl"]["preload"] !== "auto")
        this["audioEl"]["preload"] = "auto";
      return (stopLoading(this["previewEl"]), true);
    }
    if (showLoading && v378) startLoading(this["previewEl"]);
    if (!v378) {
      if (this["audioEl"]["preload"] !== "auto")
        this["audioEl"]["preload"] = "auto";
      try {
        this["audioEl"]["load"]?.();
      } catch {}
    } else
      await attachMediaElementPlaybackSource(this["audioEl"], v375, {
        preload: "auto",
        warmRanges: false,
      });
    if (this["_isAudioElementReady"]()) stopLoading(this["previewEl"]);
    typeof this["_cancelDeferredWaveform"] === "function" &&
      (this["_cancelDeferredWaveform"](),
      (this["_cancelDeferredWaveform"] = null));
    this["_cancelDeferredWaveform"] = deferWaveformPathUntilAudioReady(
      this["audioEl"],
      () => {
        this["_cancelDeferredWaveform"] = null;
        if (this["_currentSrc"] !== v375) return;
        void this["_ensureWaveform"](v375);
      },
    );
    if (this["_placeholderEl"])
      this["_placeholderEl"]["style"]["display"] = "none";
    return (
      this["_setAudioPreviewResultState"](true),
      this["_syncStatusOverlay"](this["_data"], true),
      true
    );
  }
  async ["_playAudio"]() {
    if (!this["audioEl"] || !this["_currentSrc"]) return;
    (beginAudioPlayback(this["nodeId"]),
      await this["_loadAudio"](this["_currentSrc"], { showLoading: true }),
      this["_rewindEndedAudioIfNeeded"]());
    const v379 = this["audioEl"]["play"]();
    v379 && typeof v379["catch"] === "function"
      ? v379["then"](() => stopLoading(this["previewEl"]))["catch"]((v380) => {
          stopLoading(this["previewEl"]);
          if (v380?.["name"] === "AbortError") return;
          console["warn"]("[AIGenAudioNode] play failed:", v380);
        })
      : stopLoading(this["previewEl"]);
  }
  ["_stopAudioForExternalPlayback"]() {
    if (!this["audioEl"]) return;
    typeof this["_cancelDeferredWaveform"] === "function" &&
      (this["_cancelDeferredWaveform"](),
      (this["_cancelDeferredWaveform"] = null));
    try {
      this["audioEl"]["pause"]?.();
    } catch {}
    (!this["_getAudioElementCurrentSource"]() &&
      this["_progressController"]?.["reset"](),
      stopLoading(this["previewEl"]),
      this["_setPlayIcon"](true));
  }
  ["_syncPromptBoxSizeFromData"](v381 = this["_data"]) {
    if (!this["promptEl"] || this["_isPromptBoxResizing"]) return;
    const v382 = getPromptBoxHeightBounds(this["_promptPanel"]),
      v383 = normalizePromptBoxHeight(v381?.["promptBoxHeight"], v382);
    applyPromptBoxHeight(this["promptEl"], v383);
  }
  ["_setupPromptBoxResize"]() {
    if (!this["_promptPanel"] || this["_promptResizeHandle"]) return;
    this["_promptResizeHandle"] = true;
    const v384 = 20,
      v385 = 10,
      v386 = () =>
        getStoreSnapshot()["ui"]?.["promptBoxResizeEnabled"] !== false,
      v387 = (v388) => !!v388?.["closest"](".floating-menu, .img-model-menu"),
      v389 = (v390) => {
        const v391 = this["_promptPanel"]["getBoundingClientRect"]();
        return v390 >= v391["bottom"] - v384 && v390 <= v391["bottom"] + v385;
      },
      v392 = (v393) => {
        if (!this["_promptPanel"]) return;
        if (!v386()) {
          this["_promptPanel"]["classList"]["remove"]("is-resize-hover");
          return;
        }
        if (this["_isPromptBoxResizing"]) {
          this["_promptPanel"]["classList"]["add"]("is-resize-hover");
          return;
        }
        const v394 = !v387(v393?.["target"]) && v389(v393["clientY"]);
        this["_promptPanel"]["classList"]["toggle"]("is-resize-hover", v394);
      };
    (this["_promptPanel"]["addEventListener"]("pointermove", v392),
      this["_promptPanel"]["addEventListener"]("pointerleave", () => {
        !this["_isPromptBoxResizing"] &&
          this["_promptPanel"]?.["classList"]["remove"]("is-resize-hover");
      }));
    const v395 = (v396) => {
      if (!this["_promptInputWrap"] || !this["promptEl"]) return;
      if (!v386()) return;
      if (v396["button"] !== 0) return;
      if (!v389(v396["clientY"])) return;
      if (v396["target"]?.["closest"](".prompt-submit") || v387(v396["target"]))
        return;
      (v396["stopPropagation"](), v396["preventDefault"]());
      const v397 = getPromptBoxHeightBounds(this["_promptPanel"]),
        v398 = v396["clientY"],
        v399 = this["promptEl"]["getBoundingClientRect"]()["height"];
      ((this["_isPromptBoxResizing"] = true),
        this["_promptInputWrap"]["classList"]["add"]("is-resizing"),
        this["_promptPanel"]["classList"]["add"]("is-resize-hover"));
      const v400 = (v401) => {
          v401["preventDefault"]();
          const v402 = normalizePromptBoxHeight(
            v399 + (v401["clientY"] - v398),
            v397,
          );
          applyPromptBoxHeight(this["promptEl"], v402);
        },
        v403 = (v404) => {
          (v404["preventDefault"](),
            window["removeEventListener"]("pointermove", v400),
            window["removeEventListener"]("pointerup", v403),
            window["removeEventListener"]("pointercancel", v403));
          const v405 = normalizePromptBoxHeight(
            this["promptEl"]?.["getBoundingClientRect"]()["height"],
            v397,
          );
          (applyPromptBoxHeight(this["promptEl"], v405),
            this["_promptInputWrap"]["classList"]["remove"]("is-resizing"),
            (this["_isPromptBoxResizing"] = false),
            this["_promptPanel"]["classList"]["remove"]("is-resize-hover"),
            v392(v404),
            appStore["updateNodeData"](this["nodeId"], {
              promptBoxHeight: v405,
            }));
        };
      (window["addEventListener"]("pointermove", v400),
        window["addEventListener"]("pointerup", v403),
        window["addEventListener"]("pointercancel", v403),
        (this["_promptResizeCleanup"] = () => {
          (this["_promptPanel"]?.["removeEventListener"]("pointerdown", v395),
            this["_promptPanel"]?.["removeEventListener"]("pointermove", v392),
            window["removeEventListener"]("pointermove", v400),
            window["removeEventListener"]("pointerup", v403),
            window["removeEventListener"]("pointercancel", v403));
        }));
    };
    (this["_promptPanel"]["addEventListener"]("pointerdown", v395),
      (this["_promptResizeCleanup"] = () => {
        (this["_promptPanel"]?.["removeEventListener"]("pointerdown", v395),
          this["_promptPanel"]?.["removeEventListener"]("pointermove", v392),
          this["_promptPanel"]?.["classList"]["remove"]("is-resize-hover"));
      }));
  }
  ["update"](v406) {
    ((this["_data"] = v406),
      this["_syncPromptBoxSizeFromData"](v406),
      this["_syncWorkflowDefaults"]());
    const v407 = this["_getCurrentWorkflow"]()["key"];
    this["_enforceWorkflowAudioInputLimit"]();
    const v408 = this["_resolveNodeAudioUrl"](v406);
    if (v408 && v408 !== this["_currentSrc"] && this["audioEl"])
      (this["_prepareAudio"](v408),
        this["_applyResultWideLayout"](v406, false),
        this["_syncStatusOverlay"](v406, true));
    else {
      if (!v408 && this["audioEl"])
        (typeof this["_cancelDeferredWaveform"] === "function" &&
          (this["_cancelDeferredWaveform"](),
          (this["_cancelDeferredWaveform"] = null)),
          this["_clearAudioElementSource"](),
          (this["_currentSrc"] = null),
          this["_progressController"]?.["reset"](),
          this["_setAudioPreviewResultState"](false),
          this["_syncStatusOverlay"](v406, false));
      else
        v408
          ? (this["_applyResultWideLayout"](v406, false),
            this["_setAudioPreviewResultState"](true),
            this["_syncStatusOverlay"](v406, true))
          : this["_syncStatusOverlay"](v406, false);
    }
    shouldShowGenerationBusyUi(v406) &&
      ((this["_isGenerating"] = true), startLoading(this["previewEl"]));
    if (
      document["activeElement"] !== this["promptEl"] &&
      v406["prompt"] !== undefined
    ) {
      const v409 = sanitizePromptHtml(v406["prompt"] || "");
      this["promptEl"]?.["innerHTML"] !== v409 &&
        ((this["promptEl"]["innerHTML"] = v409), _rehydratePromptPills(this));
    }
    this["_refreshWorkflowUi"]();
    const v410 = appStore["getIncomingEdges"](this["nodeId"]),
      v411 = [...v410],
      v412 = v411["map"]((v413) =>
        [
          String(v413?.["id"] || ""),
          String(v413?.["sourceId"] || ""),
          String(v413?.["refSlot"] || ""),
          String(v413?.["sourceMediaKey"] || ""),
        ]["join"](":"),
      )["join"]("|"),
      v414 = v411["map"]((v415) => {
        const v416 = appStore["getState"]()["nodes"]?.[v415["sourceId"]] || {},
          v417 = Number(v416["_bizRev"] || 0),
          v418 = Number["isFinite"](Number(v416["mainVideoIndex"]))
            ? Math["max"](0, Math["trunc"](Number(v416["mainVideoIndex"])))
            : 0,
          v419 = Array["isArray"](v416["videos"])
            ? v416["videos"][v418] || v416["videos"][0]
            : null,
          v420 = [
            String(v416["thumbId"] || ""),
            String(v416["thumbUrl"] || ""),
            String(v419?.["thumbId"] || ""),
            String(v419?.["thumbUrl"] || ""),
            String(v419?.["localPath"] || ""),
            String(v419?.["videoUrl"] || ""),
            String(v416["localPath"] || ""),
            String(v416["src"] || ""),
            String(v416["imageUrl"] || ""),
            String(v416["videoUrl"] || ""),
            String(v416["audioUrl"] || ""),
          ]["join"]("|");
        return (
          v415["id"] +
          ":" +
          v415["sourceId"] +
          ":" +
          String(v415?.["refSlot"] || "") +
          ":" +
          String(v415?.["sourceMediaKey"] || "") +
          ":" +
          v417 +
          ":" +
          v420
        );
      })["join"]("||");
    ((v412 !== this["_lastEdgeSig"] ||
      v414 !== this["_lastRefMediaSig"] ||
      v407 !== this["_lastWorkflowKey"]) &&
      ((this["_lastEdgeSig"] = v412),
      (this["_lastRefMediaSig"] = v414),
      (this["_lastWorkflowKey"] = v407),
      this["_renderRefBar"]()),
      this["_syncPickConnectVisualState"](),
      this["_maybeResumeRunningHubTask"](),
      this["_updateSubmitButtonState"]());
  }
  async ["_buildPayload"](v421 = null) {
    this["_enforceWorkflowAudioInputLimit"]();
    const { payload: v422, validation: v423 } =
      this["_buildPayloadSnapshot"](v421);
    if (!v423["ok"])
      return (window["showToast"]?.(v423["message"], "warn"), null);
    if (
      !(await this["_validateAdvancedVoiceCloneDurations"](v422["audioRefs"]))
    )
      return null;
    return v422;
  }
  ["_getPreviewGenerateButtonLoadingOptions"]() {
    return createPreviewGenerateButtonCallbacks(this, "生成");
  }
  async ["_onGenerate"](v424 = null, v425 = {}) {
    if (this["_isGenerating"]) return;
    if (v425?.["insertPrompt"] === true) {
      (insertPresetPromptIntoEditor({
        storeApi: appStore,
        nodeId: this["nodeId"],
        promptEl: this["promptEl"],
        template: v424,
        inEdges: appStore["getIncomingEdges"](this["nodeId"]),
        nodes: appStore["getState"]()["nodes"] || {},
        allowedAssetTypes: ["text", "audio"],
      }),
        this["_updateSubmitButtonState"]());
      return;
    }
    if (shouldUsePromptPreviewForPreset(v424)) {
      const v426 = await this["_buildPayload"](v424);
      if (!v426) {
        this["_updateSubmitButtonState"]();
        return;
      }
      (previewPresetPromptInEditor({
        storeApi: appStore,
        nodeId: this["nodeId"],
        promptEl: this["promptEl"],
        promptText: v426["prompt"],
      }),
        this["_updateSubmitButtonState"]());
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
    if (!(await this["_ensureVipAccessForCurrentWorkflow"]())) {
      this["_updateSubmitButtonState"]();
      return;
    }
    const v427 = await this["_buildPayload"](v424);
    if (!v427) {
      this["_updateSubmitButtonState"]();
      return;
    }
    (this["_stopRunningHubRecovery"](true),
      (this["_rhCancelRequested"] = false),
      (this["_rhCancelInFlight"] = false),
      (this["_rhRemoteCancelSent"] = false),
      (this["_isGenerating"] = true),
      (this["_rhAbortController"] = new AbortController()));
    const v428 = Date["now"]();
    (this["_setGeneratingUi"](),
      startLoading(this["previewEl"]),
      (this["_rhTaskId"] = ""),
      (this["_rhApiKey"] = String(v427?.["apiKey"] || "")["trim"]()));
    let v429 = null;
    try {
      v429 = await submitTask(
        {
          sourceNodeId: this["nodeId"],
          targetNodeId: this["nodeId"],
          trigger: "node",
          taskType: "audio-generation",
          provider: "runninghubwf",
          adapterType: "workflow",
          modelId: v427["audioWorkflowKey"] || this["_data"]?.["model"] || "",
          executionId:
            "runninghub.audio." + (v427["audioWorkflowKey"] || "workflow"),
          payload: v427,
          cancellable: true,
          resumable: true,
          startBuilder: () => ({
            provider: v427["provider"],
            audioWorkflowKey: v427["audioWorkflowKey"],
            audioWorkflowLabel: v427["audioWorkflowLabel"],
            model: v427["audioWorkflowKey"],
            rhInstanceType: v427["rhInstanceType"],
            rhTaskUseOpenapiQuery: true,
          }),
          onTaskStart: () => {
            this["_persistRunningHubResumeCache"]();
          },
          submit: async (v430, v431) => {
            return generateAudio(v427, {
              signal: this["_rhAbortController"]["signal"],
              onTaskMeta: ({
                taskId: v432,
                useOpenapiQuery: v433,
                apiKey: v434,
              }) => {
                const v435 = String(v432 || "")["trim"]();
                if (!v435) return;
                ((this["_rhTaskId"] = v435),
                  (this["_rhApiKey"] =
                    String(v434 || "")["trim"]() ||
                    String(v427?.["apiKey"] || "")["trim"]() ||
                    this["_rhApiKey"] ||
                    ""),
                  v431["onTaskId"](v435),
                  appStore["updateNodeData"](this["nodeId"], {
                    rhTaskUseOpenapiQuery: v433 === true,
                  }),
                  this["_persistRunningHubResumeCache"](),
                  this["_rhCancelRequested"] &&
                    !this["_rhCancelInFlight"] &&
                    !this["_rhRemoteCancelSent"] &&
                    this["_cancelRunningHubWorkflowTask"]());
              },
              onTaskId: (v436) => {
                const v437 = String(v436 || "")["trim"]();
                if (!v437) return;
                ((this["_rhTaskId"] = v437),
                  v431["onTaskId"](v437),
                  appStore["updateNodeData"](this["nodeId"], {
                    rhTaskUseOpenapiQuery: true,
                  }),
                  this["_persistRunningHubResumeCache"](),
                  this["_rhCancelRequested"] &&
                    !this["_rhCancelInFlight"] &&
                    !this["_rhRemoteCancelSent"] &&
                    this["_cancelRunningHubWorkflowTask"]());
              },
            });
          },
          cancel: async ({ taskId: v438 }) => {
            const v439 = String(this["_rhApiKey"] || v427?.["apiKey"] || "")[
              "trim"
            ]();
            if (!v439 || !v438) return;
            await cancelRunningHubAudioTask({ apiKey: v439, taskId: v438 });
          },
          resultBuilder: async (v440, v441) => {
            const v442 = await this["_applyAudioResultAndStore"](
              v440,
              v441["startedAt"],
              { writeStore: false },
            );
            return {
              ...v442["patch"],
              rhStatusMessage: null,
              rhStatusCode: null,
            };
          },
          failureBuilder: (v443) => ({
            rhStatusMessage: v443?.["message"] || "音频生成失败",
            rhStatusCode: Number["isFinite"](Number(v443?.["code"]))
              ? Number(v443["code"])
              : null,
          }),
          cancelledBuilder: () => ({
            audioUrl: "",
            src: "",
            localPath: "",
            rhStatusMessage: "生成已中断",
          }),
          parseError: (v444) => v444?.["message"] || "音频生成失败",
        },
        {
          store: appStore,
          startedAt: v428,
          abortController: this["_rhAbortController"],
        },
      );
      if (v429["status"] === "success")
        return (
          this["_persistRunningHubResumeCache"](),
          window["showToast"]?.("音频生成完成", "success"),
          v429
        );
      const v445 = v429["error"];
      if (
        v429["status"] === "failed" &&
        String(v445?.["code"] || "") === "SUBSCRIPTION_REQUIRED"
      ) {
        const v446 =
          String(v445?.["requiredModelId"] || "")["trim"]() ||
          this["_getCurrentGateModelId"]() ||
          this["_data"]?.["model"] ||
          "";
        if (typeof window["handleSubscriptionRequired"] === "function")
          await window["handleSubscriptionRequired"]({
            modelId: v446,
            provider: "runninghubwf",
            error: v445,
          });
        else
          typeof window["openSubscriptionDialog"] === "function"
            ? window["openSubscriptionDialog"]({
                modelId: v446,
                provider: "runninghubwf",
              })
            : window["showToast"]?.(
                v445?.["message"] || "该模型为 VIP，请先激活 CDKEY/订阅",
                "warn",
              );
      } else
        v429["status"] === "failed" &&
          (console["error"]("[AIGenAudioNode] 生成失败:", v445),
          window["showToast"]?.(
            "音频生成失败: " + (v445?.["message"] || v445),
            "error",
          ),
          this["_persistRunningHubResumeCache"]());
      return v429;
    } finally {
      const v447 = appStore["getState"]()["nodes"]?.[this["nodeId"]] || {},
        v448 = shouldShowGenerationBusyUi(v447);
      ((this["_isGenerating"] = v448), (this["_rhAbortController"] = null));
      if (v448) {
        const v449 = String(v447?.["rhTaskId"] || "")["trim"]();
        if (v449) this["_rhTaskId"] = v449;
      } else this["_rhTaskId"] = "";
      if (!this["_rhCancelRequested"]) this["_rhApiKey"] = "";
      ((this["_rhCancelRequested"] = false),
        (this["_rhCancelInFlight"] = false),
        (this["_rhRemoteCancelSent"] = false),
        this["_setGeneratingUi"]());
      if (!v448) stopLoading(this["previewEl"]);
    }
  }
  ["_renderRefBar"]() {
    if (!this["refBarEl"]) return;
    const v450 = this["_getCurrentWorkflow"]()["key"];
    this["_refBarWorkflowKey"] !== v450 &&
      ((this["_refBarWorkflowKey"] = v450),
      (this["refBarEl"]["innerHTML"] = ""),
      this["refBarEl"]["classList"]["remove"]("active", "rh-v5-refbar"));
    const v451 = getWorkflowAudioSlots(v450),
      v452 = createPromptAttachmentButtonHTML(),
      v453 = appStore["getIncomingEdges"](this["nodeId"]),
      v454 = appStore["getState"]()["nodes"] || {},
      v455 = {},
      v456 = { text: 0, image: 0, video: 0, audio: 0 },
      v457 = { text: "文本", image: "图片", video: "视频", audio: "音频" },
      v458 = {};
    v451["forEach"]((v459) => (v458[v459["slot"]] = null));
    const v460 = [...v451["map"]((v461) => v461["slot"])],
      v462 = [];
    for (const v463 of v453) {
      const v464 = v454[v463["sourceId"]];
      if (!v464) continue;
      const v465 = String(v464["type"] || "");
      let v466 = "image";
      if (v465["includes"]("text")) v466 = "text";
      else {
        if (v465["includes"]("video")) v466 = "video";
        else {
          if (v465["includes"]("audio")) v466 = "audio";
        }
      }
      (v456[v466]++, (v455[v463["sourceId"]] = "@" + v457[v466] + v456[v466]));
      if (v466 === "audio") v462["push"]({ edge: v463, src: v464 });
    }
    for (const v467 of v462) {
      const { edge: v468, src: v469 } = v467;
      let v470 = String(v468?.["refSlot"] || "");
      if (!v458[v470]) {
        if (!v460["includes"](v470)) v470 = "";
      }
      !v470 && (v470 = v460["find"]((v471) => !v458[v471]) || "");
      if (!v470 || v458[v470]) continue;
      const v472 = [
          String(v469?.["thumbUrl"] || "")["trim"](),
          String(v469?.["imageUrl"] || "")["trim"](),
          String(v469?.["src"] || "")["trim"](),
          toLocalAssetUrl(v469?.["localPath"]),
          String(v469?.["audioUrl"] || "")["trim"](),
        ]["filter"](Boolean),
        v473 = v472["find"]((v474) => isLikelyImageUrl(v474)) || "";
      if (v473) ensureThumbDecoded(v473);
      const v475 =
        v470 +
        "|" +
        v468["id"] +
        "|" +
        v468["sourceId"] +
        "|" +
        (v473 || "audio-fallback");
      v458[v470] = {
        edgeId: v468["id"],
        sourceId: v468["sourceId"],
        sig: v475,
        html: v473
          ? '<img src="' +
            v473 +
            '" class="ref-thumb-media is-pending" draggable="false">'
          : createReferenceFallbackThumbHtml("audio"),
      };
    }
    const v476 = v454?.[this["nodeId"]] || this["_data"] || {};
    (getAssetInputRefsFromPromptAndNode(this["promptEl"], {
      nodeData: v476,
      allowedTypes: ["audio"],
    })["forEach"]((v477) => {
      const v478 = v460["find"]((v479) => !v458[v479]) || "";
      if (!v478 || !v477["url"]) return;
      const v480 = [
          String(v477?.["thumbUrl"] || "")["trim"](),
          String(v477?.["nodeData"]?.["thumbUrl"] || "")["trim"](),
          String(v477?.["nodeData"]?.["imageUrl"] || "")["trim"](),
          String(v477?.["nodeData"]?.["src"] || "")["trim"](),
          toLocalAssetUrl(v477?.["nodeData"]?.["localPath"]),
        ]["filter"](Boolean),
        v481 = v480["find"]((v482) => isLikelyImageUrl(v482)) || "";
      if (v481) ensureThumbDecoded(v481);
      const v483 = String(v477["assetId"] || ""),
        v484 = String(v477["itemIndex"] ?? ""),
        v485 = String(v477["assetMentionOccurrence"] ?? ""),
        v486 = String(v477["assetRefSource"] || "prompt"),
        v487 =
          v478 +
          "|asset:" +
          v483 +
          ":" +
          v484 +
          ":" +
          v485 +
          "|" +
          (v481 || "audio-fallback");
      v458[v478] = {
        edgeId: "",
        sourceId: "asset:" + v483 + ":" + v484,
        sig: v487,
        html: v481
          ? '<img src="' +
            v481 +
            "\x22\x20class=\x22ref-thumb-media\x20is-pending\x22\x20draggable=\x22false\x22>"
          : createReferenceFallbackThumbHtml("audio"),
        virtual: true,
        assetId: v483,
        assetIndex: v484,
        assetOccurrence: v485,
        assetRefSource: v486,
        refType: "audio",
      };
    }),
      this["refBarEl"]["classList"]["add"]("active", "rh-v5-refbar"));
    let v488 = this["refBarEl"]["querySelector"](".rh-v5-ref-container");
    const v489 =
      !v488 ||
      !this["refBarEl"]["querySelector"](".prompt-attachment-btn") ||
      v488["querySelectorAll"]("[data-slot]")["length"] !== v451["length"];
    v489 &&
      ((this["refBarEl"]["innerHTML"] =
        v452 +
        ' <div class="ref-thumb-container rh-v5-ref-container" aria-label="音频入参">\n        ' +
        v451["map"](
          (v490) =>
            '<button type="button" class="ref-thumb-wrap ref-upload-slot rh-v5-ref-box" data-slot="' +
            v490["slot"] +
            '" title="连接音频"><span class="ref-upload-label">' +
            v490["label"] +
            "</span></button>",
        )["join"]("") +
        "\n      </div>"),
      (v488 = this["refBarEl"]["querySelector"](".rh-v5-ref-container")));
    const v491 = (v492, v493, v494) => {
      if (!v488) return;
      const v495 = v488["querySelector"]('[data-slot="' + v492 + "\x22]");
      if (!v493) {
        if (
          v495 &&
          v495["tagName"] === "BUTTON" &&
          v495["classList"]["contains"]("ref-upload-slot")
        )
          return;
        const v496 = document["createElement"]("button");
        ((v496["type"] = "button"),
          (v496["className"] = "ref-thumb-wrap ref-upload-slot rh-v5-ref-box"),
          (v496["dataset"]["slot"] = v492),
          (v496["title"] = "连接音频"));
        const v497 = document["createElement"]("span");
        ((v497["className"] = "ref-upload-label"),
          (v497["textContent"] = v494),
          v496["appendChild"](v497));
        if (v495) v495["replaceWith"](v496);
        else v488["appendChild"](v496);
        return;
      }
      const v498 = document["createElement"]("div");
      ((v498["className"] =
        "ref-thumb-wrap rh-v5-ref-box" +
        (v493["virtual"] ? " ref-thumb-wrap--asset" : "")),
        v498["setAttribute"]("draggable", v493["virtual"] ? "false" : "true"),
        (v498["dataset"]["slot"] = v492),
        (v498["dataset"]["edgeId"] = v493["edgeId"]),
        (v498["dataset"]["sourceId"] = v493["sourceId"]),
        (v498["dataset"]["sig"] = v493["sig"]),
        (v498["dataset"]["refOrigin"] = v493["virtual"] ? "asset" : "node"));
      v493["virtual"] &&
        ((v498["dataset"]["assetId"] = v493["assetId"] || ""),
        (v498["dataset"]["assetIndex"] = v493["assetIndex"] || ""),
        (v498["dataset"]["assetOccurrence"] = v493["assetOccurrence"] || ""),
        (v498["dataset"]["assetRefSource"] =
          v493["assetRefSource"] || "prompt"),
        (v498["dataset"]["refType"] = v493["refType"] || "audio"));
      ((v498["innerHTML"] =
        v493["html"] +
        "<button\x20type=\x22button\x22\x20class=\x22ref-thumb-delete\x22\x20title=\x22移除\x22>&times;</button>"),
        revealRefThumbMedia(v498, v493["sig"]));
      if (v495) v495["replaceWith"](v498);
      else v488["appendChild"](v498);
    };
    (v451["forEach"]((v499) =>
      v491(v499["slot"], v458[v499["slot"]], v499["label"]),
    ),
      bindRefThumbFixedSlotDrag({
        owner: this,
        container: v488,
        store: appStore,
        nodeId: this["nodeId"],
        acceptMap: Object["fromEntries"](
          v451["map"]((v500) => [v500["slot"], "audio"]),
        ),
      }),
      (this["_attachBtnIcon"] =
        this["refBarEl"]?.["querySelector"](
          ".prompt-attachment-btn .btn-icon",
        ) || null),
      this["_syncPickConnectVisualState"](),
      _syncPillLabels(this, v455));
  }
  ["unmount"]() {
    (this["_unregisterAudioPlaybackClient"]?.(),
      (this["_unregisterAudioPlaybackClient"] = null),
      this["_flushPromptHtmlCommit"]?.(),
      this["_assetMentionRegistryUnsubscribe"]?.(),
      (this["_assetMentionRegistryUnsubscribe"] = null),
      (this["_assetMentionRegistryRefreshPending"] = false),
      this["_stopRunningHubRecovery"](false),
      this["_rhAbortController"] &&
        !this["_rhAbortController"]["signal"]["aborted"] &&
        this["_rhAbortController"]["abort"](),
      (this["_rhAbortController"] = null),
      this["_clearStatusOverlay"](),
      this["_closeModelMenu"](),
      this["_docClickHandler"] &&
        (document["removeEventListener"]("click", this["_docClickHandler"]),
        (this["_docClickHandler"] = null)),
      this["_unbindRefThumbHoverPreview"] &&
        (this["_unbindRefThumbHoverPreview"](),
        (this["_unbindRefThumbHoverPreview"] = null)),
      this["_progressController"]?.["destroy"](),
      (this["_progressController"] = null),
      typeof this["_cancelDeferredWaveform"] === "function" &&
        (this["_cancelDeferredWaveform"](),
        (this["_cancelDeferredWaveform"] = null)),
      this["_clearAudioElementSource"](),
      this["_promptResizeCleanup"] &&
        (this["_promptResizeCleanup"](), (this["_promptResizeCleanup"] = null)),
      this["_uiSchemaCleanup"]?.(),
      (this["_uiSchemaCleanup"] = null),
      this["_footerControllerCleanup"]?.(),
      (this["_footerControllerCleanup"] = null),
      this["_generationNodeHelpTip"]?.["remove"](),
      (this["_generationNodeHelpTip"] = null),
      this["_promptPanel"]?.["classList"]["remove"]("is-resize-hover"),
      this["_promptInputWrap"]?.["classList"]["remove"]("is-resizing"),
      (this["_isPromptBoxResizing"] = false));
  }
}
