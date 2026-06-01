import appStore from "../core/stores/appStore.js";
import { fetchVideoFirstFrameThumbFromServer } from "../../api/videoThumbApi.js";
import { fetchVideoMetaFromServer } from "../../api/videoMetaApi.js";
import {
  buildGenerateVideoRequest,
  cancelRunningHubVideoTask,
  generateVideo,
  resumeAsyncVideoTask,
  resumeDreaminaVideoTask,
  resumeRunningHubVideoTask,
} from "../../api/aiVideoApi.js";
import { getDisplayModelName, PROVIDERS_META } from "../modules/providers.js";
import {
  _handlePillHover,
  _handlePillOut,
  _syncEdgesOrderFromPills,
  _syncPillLabels,
  _checkAtTrigger,
  _populateMentionMenu,
  _insertMentionPill,
  _rehydratePromptPills,
  _handlePillKeyboard,
  _handleMentionMenuKeyboard,
  _getMentionMenu,
  _closeMentionMenu,
  flushPromptHtmlCommit,
  handlePromptPaste,
  handlePromptSelectAll,
  handleRefThumbDeleteClick,
  schedulePromptHtmlCommit,
} from "../modules/nodePromptShared.js";
import {
  VIDEO_TOOLBAR_HTML,
  bindVideoToolbarEvents,
  showDevToast,
} from "./NodeToolbarConfig.js";
import { getImage } from "../modules/storage.js";
import { startLoading, stopLoading } from "../modules/loadingOverlay.js";
import { bindRefThumbHoverPreview } from "../modules/refThumbHoverPreview.js";
import {
  ensureThumbDecoded,
  revealRefThumbMedia,
} from "../modules/refThumbMediaReveal.js";
import {
  getAIGenerationNodeSize,
  getAutoMediaSizeByShortSide,
  buildSourceMediaNodePayload,
} from "../services/fileService.js";
import { buildApiUrl } from "../../api/apiBase.js";
import { ensureConfig, getProviderConfig } from "../../api/configApi.js";
import { commit } from "../modules/history.js";
import { startNodeResizePreview } from "../modules/interaction/nodeResizePreview.js";
import { saveOutputBlob, uploadFile } from "../modules/project.js";
import {
  getNodeSpawnPrefs,
  calcSafeSpawnPosNearNode,
} from "../modules/nodeSpawn.js";
import {
  VIDEO_VIP_MODEL_IDS,
  isVipModel as isVipModel,
  getVipModelDisplayName,
  resolveVipGateModelId,
} from "../modules/subscriptionAccess.js";
import VideoKeyingController from "../modules/VideoKeyingController.js";
import { generateId, findAvailablePosition } from "../core/math.js";
import {
  getDisplayedMediaSizeFromNode,
  sanitizePromptHtml,
} from "../utils/dom.js";
import {
  checkSlashTrigger,
  handleSlashKeyboardNavigation,
  closeSlashMenu,
} from "../modules/slashMenu.js";
import { activateMenuKeyboard } from "../modules/floatingMenuKeyboard.js";
import {
  stopPreviewNodeLoading,
  syncPreviewNodeLoading,
} from "../modules/previewMode.js";
import {
  isTaskTerminal,
  shouldShowGenerationBusyUi,
} from "../core/generationTaskUiState.js";
import { hasDisplayableVideoResult } from "../core/rendererNodeResultState.js";
import { videoUiRenderMixin } from "./aigenVideo/uiRenderMixin.js";
import { videoStateSyncMixin } from "./aigenVideo/stateSyncMixin.js";
import { videoTaskOrchestrationMixin } from "./aigenVideo/taskOrchestrationMixin.js";
import { createVideoNodeReferenceInputModule } from "./video-node/referenceInputModule.js";
import { subscribeAssetMentionRegistry } from "../modules/assetMentionRegistry.js";
import { removeCoveredAssetInputRefForConnection } from "../modules/promptAssetInputOverride.js";
import {
  localPathToUrl,
  pickResultLocalPath,
  urlToLocalPath,
} from "../utils/localMediaPath.js";
import {
  createGenerationNodeHelpTipController,
  getGenerationNodeHelpTooltip,
} from "./generationNodeHelpTip.js";
import {
  hasModelUiSchema,
  syncModelUiSchemaControls,
} from "./aigenImage/uiSchemaRenderer.js";
import { createVideoNodeParameterPanelModule } from "./video-node/parameterPanelModule.js";
import {
  hasRunningHubVideoWorkflowUiField,
  hasRunningHubVideoWorkflowUiPlacement,
} from "./video-node/runningHubVideoUiSchema.js";
import { createVideoNodeTaskOrchestrationModule } from "./video-node/taskOrchestrationModule.js";
import { createVideoNodeResultRenderModule } from "./video-node/resultRenderModule.js";
import { createVideoNodePreviewControlsModule } from "./video-node/previewControlsModule.js";
import {
  setupPromptBoxResize,
  syncPromptBoxSizeFromData,
} from "./promptBoxResizeUi.js";
import { createPromptAttachmentButtonHTML } from "./refAttachmentButton.js";
import {
  getExclusiveSlotsForFixedSlot,
  getFixedInputSlotConfigFromManifest,
} from "../modules/fixedInputAssetRefs.js";
const VIDEO_VIP_MODEL_ID_SET = new Set(VIDEO_VIP_MODEL_IDS),
  VIDEO_VIP_MODEL_NAME_MAP = VIDEO_VIP_MODEL_IDS["reduce"]((v0, v1) => {
    return ((v0[v1] = getVipModelDisplayName(v1)), v0);
  }, {});
let _vipSessionRecheckDone = false;
const AI_VIDEO_MIN_SIZE = 150,
  api = {
    buildGenerateVideoRequest: buildGenerateVideoRequest,
    cancelRunningHubWorkflowTask: cancelRunningHubVideoTask,
    fetchVideoFirstFrameThumbFromServer: fetchVideoFirstFrameThumbFromServer,
    fetchVideoMetaFromServer: fetchVideoMetaFromServer,
    generateVideo: generateVideo,
    resumeAsyncVideoTask: resumeAsyncVideoTask,
    resumeDreaminaVideoTask: resumeDreaminaVideoTask,
    resumeRunningHubVideoTask: resumeRunningHubVideoTask,
  };
function readStoreState() {
  return typeof appStore["getStateRaw"] === "function"
    ? appStore["getStateRaw"]()
    : appStore["getState"]();
}
function getFixedInputSlotKind(v2, v3) {
  const v4 = String(v3 || "")["trim"](),
    v5 = getFixedInputSlotConfigFromManifest(v2 || {}),
    v6 = String(v5?.["slotKindById"]?.[v4] || "")["trim"]();
  if (v6) return v6;
  if (v4 === "audio" || v4["startsWith"]("audio")) return "audio";
  if (v4 === "sourceVideo" || v4 === "videoMask") return "video";
  if (v4 === "refImage" || v4 === "firstFrame") return "image";
  return "";
}
function getFixedInputSlotsToReplace(v7, v8) {
  const v9 = String(v8 || "")["trim"](),
    v10 = getFixedInputSlotConfigFromManifest(v7 || {}),
    v11 = getExclusiveSlotsForFixedSlot(v10?.["exclusiveGroups"], v9);
  return new Set(v11["length"] ? v11 : [v9]["filter"](Boolean));
}
function getFixedInputAcceptForKind(v12) {
  if (v12 === "image") return "image/*";
  if (v12 === "video") return "video/*";
  if (v12 === "audio") return "audio/*";
  return "*/*";
}
function isTerminalGenerationUiState(v13) {
  return isTaskTerminal(v13);
}
function isVideoVipModel(v14, v15 = "") {
  return isVipModel(v14, v15);
}
function getVideoVipModelName(v16, v17 = "") {
  const v18 = resolveVipGateModelId(v16, v17);
  return VIDEO_VIP_MODEL_NAME_MAP[v18] || v18 || "该模型";
}
async function ensureVipSessionRecheck(v19, v20 = "") {
  if (!isVideoVipModel(v19, v20)) return;
  if (_vipSessionRecheckDone) return;
  _vipSessionRecheckDone = true;
  if (typeof window["refreshSubscriptionState"] === "function")
    try {
      await window["refreshSubscriptionState"]();
    } catch {}
}
const VIDEO_NODE_MODULE_DEPS = {
  store: appStore,
  api: api,
  getDisplayModelName: getDisplayModelName,
  PROVIDERS_META: PROVIDERS_META,
  _handlePillHover: _handlePillHover,
  _handlePillOut: _handlePillOut,
  _syncEdgesOrderFromPills: _syncEdgesOrderFromPills,
  _syncPillLabels: _syncPillLabels,
  _getMentionMenu: _getMentionMenu,
  _closeMentionMenu: _closeMentionMenu,
  VIDEO_TOOLBAR_HTML: VIDEO_TOOLBAR_HTML,
  bindVideoToolbarEvents: bindVideoToolbarEvents,
  showDevToast: showDevToast,
  getImage: getImage,
  startLoading: startLoading,
  stopLoading: stopLoading,
  bindRefThumbHoverPreview: bindRefThumbHoverPreview,
  ensureThumbDecoded: ensureThumbDecoded,
  revealRefThumbMedia: revealRefThumbMedia,
  buildApiUrl: buildApiUrl,
  ensureConfig: ensureConfig,
  getProviderConfig: getProviderConfig,
  saveOutputBlob: saveOutputBlob,
  uploadFile: uploadFile,
  getNodeSpawnPrefs: getNodeSpawnPrefs,
  getAIGenerationNodeSize: getAIGenerationNodeSize,
  getAutoMediaSizeByShortSide: getAutoMediaSizeByShortSide,
  buildSourceMediaNodePayload: buildSourceMediaNodePayload,
  calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
  VideoKeyingController: VideoKeyingController,
  generateId: generateId,
  findAvailablePosition: findAvailablePosition,
  getDisplayedMediaSizeFromNode: getDisplayedMediaSizeFromNode,
  checkSlashTrigger: checkSlashTrigger,
  handleSlashKeyboardNavigation: handleSlashKeyboardNavigation,
  closeSlashMenu: closeSlashMenu,
  activateMenuKeyboard: activateMenuKeyboard,
  isVideoVipModel: isVideoVipModel,
  getVideoVipModelName: getVideoVipModelName,
  ensureVipSessionRecheck: ensureVipSessionRecheck,
  VIDEO_VIP_MODEL_IDS: VIDEO_VIP_MODEL_IDS,
  VIDEO_VIP_MODEL_ID_SET: VIDEO_VIP_MODEL_ID_SET,
  VIDEO_VIP_MODEL_NAME_MAP: VIDEO_VIP_MODEL_NAME_MAP,
};
export class AIGenVideoNode {
  constructor(v21) {
    ((this["_data"] = v21),
      (this["nodeId"] = v21["id"]),
      (this["previewEl"] = null),
      (this["videoEl"] = null),
      (this["refBarEl"] = null),
      (this["promptEl"] = null),
      (this["btnEl"] = null),
      (this["footerEl"] = null),
      (this["_promptPanel"] = null),
      (this["_promptInputWrap"] = null),
      (this["_promptResizeHandle"] = null),
      (this["_isPromptBoxResizing"] = false),
      (this["_promptResizeCleanup"] = null),
      (this["_qualityBtns"] = []),
      (this["_attachBtnIcon"] = null),
      (this["_lastImgKey"] = null),
      (this["_lastFooterSig"] = null),
      (this["_lastEdgeSig"] = null),
      (this["_lastRefModeSig"] = ""),
      (this["_docClickBound"] = false),
      (this["_v5RefUploadInput"] = null),
      (this["_v5RefUploadSlot"] = ""),
      (this["_v5RefUploadAnchorNodeId"] = ""),
      (this["_fixedSlotRefThumbObjectUrls"] = new Map()),
      (this["_ltxRefUploadInput"] = null),
      (this["_ltxRefUploadSlot"] = ""),
      (this["_ltxRefUploadAnchorNodeId"] = ""),
      (this["_adaptiveSrcRetryToken"] = 0),
      (this["_refThumbObjectUrls"] = new Map()),
      (this["_lastSpecialModeSig"] = ""),
      (this["_lastSubtractSubjectSig"] = ""),
      (this["_renderRefBarLock"] = null),
      (this["_renderRefBarPending"] = false),
      (this["_ratioAnimTimer"] = null),
      (this["_ratioFlipAnim"] = null),
      (this["_rhAbortController"] = null),
      (this["_rhTaskId"] = null),
      (this["_rhApiKey"] = null),
      (this["_rhCancelRequested"] = false),
      (this["_rhResumeAbortController"] = null),
      (this["_rhResumeTaskId"] = ""),
      (this["_rhResumePromise"] = null),
      (this["_asyncResumeAbortController"] = null),
      (this["_asyncResumeTaskId"] = ""),
      (this["_asyncResumePromise"] = null),
      (this["_statusOverlayEl"] = null),
      (this["_lastAdaptiveEdgeSig"] = null),
      (this["_lastVideoViewSig"] = null),
      (this["_lastHasInputConnections"] = null),
      (this["_multiStackWrap"] = null),
      (this["_multiLayerEls"] = []),
      (this["_multiErrorEls"] = []),
      (this["_multiToggleBtn"] = null),
      (this["_multiVideosContainer"] = null),
      (this["_cachedVideoUrls"] = new Map()),
      (this["_lastVideosKeyStr"] = null),
      (this["_lastMainIdx"] = null),
      (this["_lastIsExpanded"] = null),
      (this["_expandPanel"] = null),
      (this["_isMuted"] = true),
      (this["_videoClickTimer"] = null),
      (this["_muteBtnEl"] = null),
      (this["_muteIconMutedEl"] = null),
      (this["_muteIconUnmutedEl"] = null),
      (this["_centerIndicatorEl"] = null),
      (this["_centerIndicatorInnerEl"] = null),
      (this["_centerIndicatorTimer"] = null),
      (this["_controlsEl"] = null),
      (this["_playBtnEl"] = null),
      (this["_timeCurrentEl"] = null),
      (this["_timeTotalEl"] = null),
      (this["_progressBarEl"] = null),
      (this["_progressFillEl"] = null),
      (this["_snapBtnEl"] = null),
      (this["_isProgressSeeking"] = false),
      (this["_isProgressDragging"] = false),
      (this["_progressSeekToken"] = 0),
      (this["_isManualControl"] = false),
      (this["_isHovered"] = false),
      (this["_hoverManualPause"] = false),
      (this["_isManualLoopPlayback"] = false),
      (this["_autoPlayToken"] = 0),
      (this["_metaFetchToken"] = 0),
      (this["_videoThumbPending"] = new Set()),
      (this["_blobResolveToken"] = 0),
      (this["_resultThumbToken"] = 0),
      (this["_isExpandedPickClosing"] = false),
      (this["_vipSelectionRetryInProgress"] = false),
      (this["_assetMentionRegistryUnsubscribe"] = null),
      (this["_assetMentionRegistryRefreshPending"] = false),
      (this["_generationNodeHelpTip"] = null),
      (this["_uiSchemaCleanup"] = null),
      (this["_footerControllerCleanup"] = null));
  }
  get ["isNoResult"]() {
    return !hasDisplayableVideoResult(this["_data"]);
  }
  ["_syncNoResultClass"]() {
    if (!this["_root"]?.["classList"]) return;
    this["isNoResult"]
      ? this["_root"]["classList"]["add"]("no-result")
      : this["_root"]["classList"]["remove"]("no-result");
  }
  ["mount"]() {
    typeof this["_normalizeDreaminaNodeData"] === "function" &&
      (this["_data"] =
        this["_normalizeDreaminaNodeData"](this["_data"], {
          syncStore: true,
        }) || this["_data"]);
    const v22 = document["createElement"]("div");
    if (this["isNoResult"]) v22["classList"]["add"]("no-result");
    ((this["_root"] = v22),
      Object["assign"](v22["style"], {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        pointerEvents: "auto",
        cursor: "default",
      }),
      v22["style"]["setProperty"]("overflow", "visible", "important"),
      (v22["innerHTML"] = VIDEO_TOOLBAR_HTML),
      (this["previewEl"] = document["createElement"]("div")),
      (this["previewEl"]["className"] = "img-node-preview"),
      Object["assign"](this["previewEl"]["style"], {
        background: "var(--white-05)",
        border: "1px solid var(--stroke-10)",
        borderRadius: "18px",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        transition: "none",
      }),
      this["previewEl"]["style"]["setProperty"]("width", "100%", "important"),
      this["previewEl"]["style"]["setProperty"]("height", "100%", "important"),
      this["previewEl"]["style"]["setProperty"](
        "min-height",
        "260px",
        "important",
      ));
    const v23 = document["createElement"]("div");
    ((v23["className"] = "img-node-placeholder"),
      Object["assign"](v23["style"], {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        color: "var(--text-muted)",
        pointerEvents: "none",
        userSelect: "none",
      }),
      (v23["innerHTML"] =
        '\n            <svg class="placeholder-icon-svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="transition:all 0.2s;">\n                <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>\n            </svg>'),
      this["previewEl"]["appendChild"](v23),
      (this["_placeholderEl"] = v23),
      syncPreviewNodeLoading(
        this["nodeId"],
        this["previewEl"],
        this["_getPreviewGenerateButtonLoadingOptions"]?.(),
      ),
      this["_ensurePreviewVideoOverlays"](),
      v22["appendChild"](this["previewEl"]));
    const v24 = document["createElement"]("div");
    ((v24["className"] = "node-resizer"),
      v22["appendChild"](v24),
      this["_loadAndDisplayVideo"]());
    typeof this["_maybeResumeDreaminaTaskImpl"] === "function" &&
      queueMicrotask(() => {
        appStore["getState"]()["nodes"]?.[this["nodeId"]] &&
          this["_maybeResumeDreaminaTaskImpl"]();
      });
    typeof this["_maybeResumeRunningHubTaskImpl"] === "function" &&
      queueMicrotask(() => {
        appStore["getState"]()["nodes"]?.[this["nodeId"]] &&
          this["_maybeResumeRunningHubTaskImpl"]();
      });
    typeof this["_maybeResumeAsyncTaskImpl"] === "function" &&
      queueMicrotask(() => {
        appStore["getState"]()["nodes"]?.[this["nodeId"]] &&
          this["_maybeResumeAsyncTaskImpl"]();
      });
    (this["previewEl"]["addEventListener"]("mouseenter", () => {
      const v25 = appStore["getState"]()["videoClip"];
      if (v25 && v25["active"] && v25["nodeId"] === this["nodeId"]) return;
      const v26 =
        appStore["getState"]()["nodes"][this["nodeId"]] || this["_data"] || {};
      if (v26["isVideosExpanded"]) return;
      const v27 = this["_getActivePreviewVideoEl"]();
      if (!v27) return;
      this["_isHovered"] = true;
      if (VideoKeyingController["isActiveFor"](this["nodeId"])) {
        v27["pause"]();
        return;
      }
      if (this["_hoverManualPause"]) return;
      if (this["_isManualLoopPlayback"]) return;
      v27["loop"] = true;
      const v28 = ++this["_autoPlayToken"];
      typeof this["_logPreviewVideoPlaybackEvent"] === "function" &&
        this["_logPreviewVideoPlaybackEvent"](v27, "hover-enter", "hover");
      const v29 = () => {
        if (typeof this["_playPreviewVideoWithRecovery"] === "function") {
          void this["_playPreviewVideoWithRecovery"](v27, {
            reason: "hover",
            shouldContinue: () =>
              this["_autoPlayToken"] === v28 && !this["_hoverManualPause"],
          });
          return;
        }
        if (this["_autoPlayToken"] !== v28) {
          v27["pause"]();
          return;
        }
        const v30 = v27["play"]();
        if (v30 && typeof v30["catch"] === "function") v30["catch"](() => {});
      };
      v29();
    }),
      this["previewEl"]["addEventListener"]("mouseleave", () => {
        const v31 = appStore["getState"]()["videoClip"];
        if (v31 && v31["active"] && v31["nodeId"] === this["nodeId"]) return;
        const v32 =
          appStore["getState"]()["nodes"][this["nodeId"]] ||
          this["_data"] ||
          {};
        if (v32["isVideosExpanded"]) return;
        const v33 = this["_getActivePreviewVideoEl"]();
        if (!v33) return;
        const v34 = this["_isManualControl"];
        ((this["_isHovered"] = false), this["_autoPlayToken"]++);
        if (!this["_isManualLoopPlayback"]) v33["loop"] = false;
        typeof this["_logPreviewVideoPlaybackEvent"] === "function" &&
          this["_logPreviewVideoPlaybackEvent"](v33, "hover-leave", "hover");
        if (!v34) v33["pause"]();
        this["_hoverManualPause"] = false;
        if (!this["_isManualLoopPlayback"]) this["_isManualControl"] = false;
      }));
    const v35 = document["createElement"]("div");
    ((v35["className"] = "text-prompt-panel"),
      (this["_promptPanel"] = v35),
      v35["addEventListener"]("pointerdown", (v36) => {
        v36["stopPropagation"]();
      }),
      (this["refBarEl"] = document["createElement"]("div")),
      (this["refBarEl"]["className"] = "node-ref-bar"),
      (this["refBarEl"]["innerHTML"] = createPromptAttachmentButtonHTML({
        stroke: "var(--white-90)",
      })),
      v35["appendChild"](this["refBarEl"]),
      this["refBarEl"]["addEventListener"]("pointerdown", (v37) => {
        if (
          v37["target"]["closest"](
            ".prompt-attachment-btn, .ref-thumb-wrap, .ref-thumb-delete",
          )
        )
          v37["stopPropagation"]();
      }),
      this["refBarEl"]["addEventListener"]("click", (v38) => {
        if (handleRefThumbDeleteClick(this, v38)) return;
        const v39 = v38["target"]["closest"](".prompt-attachment-btn");
        if (!v39) return;
        (v38["stopPropagation"](), v38["preventDefault"]());
        const v40 = appStore["getState"]()["pickConnectMode"];
        v40?.["active"] && v40["sourceNodeId"] === this["nodeId"]
          ? appStore["setPickConnectMode"]({ active: false })
          : appStore["setPickConnectMode"]({
              active: true,
              sourceNodeId: this["nodeId"],
              handleDirection: "left",
            });
      }),
      (this["_unbindRefThumbHoverPreview"] = bindRefThumbHoverPreview(
        this["refBarEl"],
      )),
      (this["_v5RefUploadInput"] = document["createElement"]("input")),
      (this["_v5RefUploadInput"]["type"] = "file"),
      (this["_v5RefUploadInput"]["accept"] = "*/*"),
      (this["_v5RefUploadInput"]["style"]["display"] = "none"),
      v35["appendChild"](this["_v5RefUploadInput"]),
      this["_v5RefUploadInput"]["addEventListener"]("change", async (v41) => {
        const v42 = v41["target"]["files"]?.[0],
          v43 = this["_v5RefUploadSlot"],
          v44 = this["_v5RefUploadAnchorNodeId"];
        if (!v42 || !v43 || !v44) {
          this["_v5RefUploadInput"]["value"] = "";
          return;
        }
        try {
          const v45 = window["currentProjectId"] || "default_v2_project",
            v46 = await uploadFile(v42, v45),
            v47 = v46?.["url"] || "";
          if (!v47) throw new Error("上传失败：未返回文件地址");
          const v48 = appStore["getState"](),
            v49 = v48["nodes"]?.[v44];
          if (!v49) throw new Error("上传失败：找不到锚点节点");
          const v50 = pickResultLocalPath(v46) || urlToLocalPath(v47),
            v51 = getFixedInputSlotKind(v49, v43),
            v52 = v51 === "video",
            v53 = v51 === "image";
          if (v52 && !v42["type"]["startsWith"]("video/"))
            throw new Error("该位置只支持上传视频文件");
          if (v53 && !v42["type"]["startsWith"]("image/"))
            throw new Error("该位置只支持上传图片文件");
          if (!v52 && !v53) throw new Error("该位置不支持上传此类素材");
          const v54 = v52 ? "source-video" : "source-image";
          let v55 = 300,
            v56 = 300;
          if (v52) {
            const v57 = document["createElement"]("video");
            ((v57["src"] = URL["createObjectURL"](v42)),
              await new Promise((v58) => {
                ((v57["onloadedmetadata"] = () => {
                  const v59 = v57["videoWidth"] || 420,
                    v60 = v57["videoHeight"] || 260,
                    v61 = Math["min"](v59, v60),
                    v62 = 300 / (v61 || 1);
                  ((v55 = Math["round"](v59 * v62)),
                    (v56 = Math["round"](v60 * v62)),
                    URL["revokeObjectURL"](v57["src"]),
                    v58());
                }),
                  (v57["onerror"] = () => {
                    (URL["revokeObjectURL"](v57["src"]), v58());
                  }));
              }));
          } else {
            if (v53) {
              const v63 = new Image();
              await new Promise((v64) => {
                ((v63["onload"] = () => {
                  const v65 = v63["naturalWidth"] || 260,
                    v66 = v63["naturalHeight"] || 260,
                    v67 = Math["min"](v65, v66),
                    v68 = 300 / (v67 || 1);
                  ((v55 = Math["round"](v65 * v68)),
                    (v56 = Math["round"](v66 * v68)),
                    v64());
                }),
                  (v63["onerror"] = () => {
                    v64();
                  }),
                  (v63["src"] = v47));
              });
            }
          }
          const {
              spacing: v69,
              direction: v70,
              avoidOverlap: v71,
            } = getNodeSpawnPrefs(),
            v72 = v70 === "down" ? "down" : "left",
            v73 = Number(v49["x"]) || 0,
            v74 = Number(v49["y"]) || 0,
            v75 = Number(v49["width"]) || 360,
            v76 = Number(v49["height"]) || 360,
            v77 = v73 - v69 - v55,
            v78 =
              v72 === "down"
                ? v74 + v76 + v69
                : v74 + Math["round"]((v76 - v56) / 2),
            v79 = v71
              ? findAvailablePosition(
                  v48["nodes"] || {},
                  v77,
                  v78,
                  v55,
                  v56,
                  v69,
                  v72,
                )
              : { x: v77, y: v78 },
            v80 = getFixedInputSlotsToReplace(v49, v43);
          (appStore["batch"](() => {
            const v81 = appStore["getIncomingEdges"](this["nodeId"]);
            for (const v82 of v81) {
              if (v80["has"](String(v82?.["refSlot"] || "")))
                appStore["removeEdge"](v82["id"]);
            }
            const v83 = generateId("node"),
              v84 = {
                id: v83,
                type: v54,
                x: v79["x"],
                y: v79["y"],
                width: v55,
                height: v56,
                src: v47,
                localPath: v50,
                assetId: v46["assetId"] || "",
                originalLocalPath:
                  v46["originalLocalPath"] || v46["localPath"] || "",
                posterLocalPath: v46["posterLocalPath"] || "",
                waveformLocalPath: v46["waveformLocalPath"] || "",
                derivativeStatus:
                  v46["derivativeStatus"] || v46["status"] || "",
                mediaTaskId: v46["mediaTaskId"] || "",
                mediaTaskKind: v46["mediaTaskKind"] || "",
                mediaTaskStatus: v46["mediaTaskStatus"] || "",
                mediaTaskProgress: Number(v46["mediaTaskProgress"] || 0) || 0,
                mediaTaskError: v46["mediaTaskError"] || "",
                fileName: v46["filename"] || v42["name"] || "",
                thumbUrl: v46["posterUrl"] || v46["thumbUrl"] || null,
              };
            if (v52)
              v84["name"] =
                v42["name"] || (v43 === "videoMask" ? "遮罩视频" : "源视频");
            (removeCoveredAssetInputRefForConnection({
              targetId: this["nodeId"],
              sourceKind: v52 ? "video" : "image",
              refSlot: v43,
            }),
              appStore["addNode"](v84),
              appStore["addEdge"]({
                id: generateId("edge"),
                sourceId: v83,
                targetId: this["nodeId"],
                refSlot: v43,
              }),
              appStore["setSelectedNodes"]([this["nodeId"]]));
          }),
            this["_updateSubmitButtonState"]());
          if (v52)
            try {
              const v85 = localPathToUrl(v50),
                v86 = await fetchVideoFirstFrameThumbFromServer(v85),
                v87 = String(v86?.["url"] || "")["trim"]();
              if (v87) {
                const v88 = appStore["getState"]()["nodes"]?.[newNodeId];
                if (v88)
                  appStore["updateNodeData"](newNodeId, {
                    thumbUrl: v87,
                    videoThumbSrc: v85,
                  });
              }
            } catch {}
          if (!v52) {
          }
        } catch (v89) {
          window["showToast"]?.(
            v89?.["message"] || "上传失败，请重试",
            "error",
          );
        } finally {
          ((this["_v5RefUploadInput"]["value"] = ""),
            (this["_v5RefUploadSlot"] = ""),
            (this["_v5RefUploadAnchorNodeId"] = ""));
        }
      }),
      (this["_ltxRefUploadInput"] = document["createElement"]("input")),
      (this["_ltxRefUploadInput"]["type"] = "file"),
      (this["_ltxRefUploadInput"]["accept"] = "*/*"),
      (this["_ltxRefUploadInput"]["style"]["display"] = "none"),
      v35["appendChild"](this["_ltxRefUploadInput"]),
      this["_ltxRefUploadInput"]["addEventListener"]("change", async (v90) => {
        const v91 = v90["target"]["files"]?.[0],
          v92 = this["_ltxRefUploadSlot"],
          v93 = this["_ltxRefUploadAnchorNodeId"];
        if (!v91 || !v92 || !v93) {
          this["_ltxRefUploadInput"]["value"] = "";
          return;
        }
        try {
          const v94 = window["currentProjectId"] || "default_v2_project",
            v95 = await uploadFile(v91, v94),
            v96 = v95?.["url"] || "";
          if (!v96) throw new Error("上传失败：未返回文件地址");
          const v97 = appStore["getState"](),
            v98 = v97["nodes"]?.[v93];
          if (!v98) throw new Error("上传失败：找不到锚点节点");
          const v99 = pickResultLocalPath(v95) || urlToLocalPath(v96),
            v100 = getFixedInputSlotKind(v98, v92),
            v101 = v100 === "image",
            v102 = v100 === "video",
            v103 = v100 === "audio";
          if (v101 && !v91["type"]["startsWith"]("image/"))
            throw new Error("该位置只支持上传图片文件");
          if (v102 && !v91["type"]["startsWith"]("video/"))
            throw new Error("该位置只支持上传视频文件");
          if (v103 && !v91["type"]["startsWith"]("audio/"))
            throw new Error("该位置只支持上传音频文件");
          if (!v101 && !v102 && !v103)
            throw new Error("该位置不支持上传此类素材");
          const v104 = v103
            ? "source-audio"
            : v102
              ? "source-video"
              : "source-image";
          let v105 = v103 ? 320 : v102 ? 360 : 300,
            v106 = v103 ? 140 : v102 ? 220 : 300;
          if (v101) {
            const v107 = new Image();
            await new Promise((v108) => {
              ((v107["onload"] = () => {
                const v109 = v107["naturalWidth"] || 260,
                  v110 = v107["naturalHeight"] || 260,
                  v111 = Math["min"](v109, v110),
                  v112 = 300 / (v111 || 1);
                ((v105 = Math["round"](v109 * v112)),
                  (v106 = Math["round"](v110 * v112)),
                  v108());
              }),
                (v107["onerror"] = () => v108()),
                (v107["src"] = v96));
            });
          }
          const {
              spacing: v113,
              direction: v114,
              avoidOverlap: v115,
            } = getNodeSpawnPrefs(),
            v116 = v114 === "down" ? "down" : "left",
            v117 = Number(v98["x"]) || 0,
            v118 = Number(v98["y"]) || 0,
            v119 = Number(v98["width"]) || 360,
            v120 = Number(v98["height"]) || 360,
            v121 = v117 - v113 - v105,
            v122 =
              v116 === "down"
                ? v118 + v120 + v113
                : v118 + Math["round"]((v120 - v106) / 2),
            v123 = v115
              ? findAvailablePosition(
                  v97["nodes"] || {},
                  v121,
                  v122,
                  v105,
                  v106,
                  v113,
                  v116,
                )
              : { x: v121, y: v122 },
            v124 = getFixedInputSlotsToReplace(v98, v92);
          (appStore["batch"](() => {
            const v125 = appStore["getIncomingEdges"](this["nodeId"]);
            for (const v126 of v125) {
              if (v124["has"](String(v126?.["refSlot"] || "")))
                appStore["removeEdge"](v126["id"]);
            }
            const v127 = generateId("node"),
              v128 = {
                id: v127,
                type: v104,
                x: v123["x"],
                y: v123["y"],
                width: v105,
                height: v106,
                src: v96,
                localPath: v99,
                assetId: v95["assetId"] || "",
                originalLocalPath:
                  v95["originalLocalPath"] || v95["localPath"] || "",
                posterLocalPath: v95["posterLocalPath"] || "",
                waveformLocalPath: v95["waveformLocalPath"] || "",
                derivativeStatus:
                  v95["derivativeStatus"] || v95["status"] || "",
                mediaTaskId: v95["mediaTaskId"] || "",
                mediaTaskKind: v95["mediaTaskKind"] || "",
                mediaTaskStatus: v95["mediaTaskStatus"] || "",
                mediaTaskProgress: Number(v95["mediaTaskProgress"] || 0) || 0,
                mediaTaskError: v95["mediaTaskError"] || "",
                fileName: v95["filename"] || v91["name"] || "",
              };
            if (v103) v128["name"] = v91["name"] || "源音频";
            if (v102) v128["name"] = v91["name"] || "源视频";
            (removeCoveredAssetInputRefForConnection({
              targetId: this["nodeId"],
              sourceKind: v103 ? "audio" : v102 ? "video" : "image",
              refSlot: v92,
            }),
              appStore["addNode"](v128),
              appStore["addEdge"]({
                id: generateId("edge"),
                sourceId: v127,
                targetId: this["nodeId"],
                refSlot: v92,
              }),
              appStore["setSelectedNodes"]([this["nodeId"]]));
          }),
            this["_updateSubmitButtonState"]());
        } catch (v129) {
          window["showToast"]?.(
            v129?.["message"] || "上传失败，请重试",
            "error",
          );
        } finally {
          ((this["_ltxRefUploadInput"]["value"] = ""),
            (this["_ltxRefUploadSlot"] = ""),
            (this["_ltxRefUploadAnchorNodeId"] = ""));
        }
      }),
      this["refBarEl"]["addEventListener"]("click", (v130) => {
        const v131 = v130["target"]["closest"](".rh-v5-ref-box");
        if (!v131) return;
        const v132 = appStore["getState"]()["nodes"]?.[this["nodeId"]],
          v133 = getFixedInputSlotConfigFromManifest(v132 || {});
        if (!v133) return;
        const v134 = v130["target"]["closest"](".ref-thumb-delete");
        if (v134) {
          (v130["stopPropagation"](), v130["preventDefault"]());
          const v135 = v131["dataset"]["edgeId"] || "";
          v135 &&
            (appStore["removeEdge"](v135), this["_updateSubmitButtonState"]());
          return;
        }
        (v130["stopPropagation"](), v130["preventDefault"]());
        const v136 = v131["dataset"]["slot"] || "";
        if (!v136) return;
        const v137 = v133["slotKindById"]?.[v136] || "";
        if (!v137 || !v133["visibleSlots"]["includes"](v136)) return;
        const v138 = getFixedInputAcceptForKind(v137);
        if (v137 === "audio") {
          ((this["_ltxRefUploadSlot"] = v136),
            (this["_ltxRefUploadAnchorNodeId"] = this["nodeId"]),
            (this["_ltxRefUploadInput"]["accept"] = v138),
            this["_ltxRefUploadInput"]["click"]());
          return;
        }
        ((this["_v5RefUploadSlot"] = v136),
          (this["_v5RefUploadAnchorNodeId"] = this["nodeId"]),
          (this["_v5RefUploadInput"]["accept"] = v138),
          this["_v5RefUploadInput"]["click"]());
      }));
    const v139 = document["createElement"]("div");
    ((v139["className"] = "prompt-input-wrapper"),
      v139["classList"]["add"]("is-resizable"),
      (this["_promptInputWrap"] = v139),
      (this["promptEl"] = document["createElement"]("div")),
      (this["promptEl"]["className"] = "prompt-textarea\x20custom-textarea"),
      (this["promptEl"]["contentEditable"] = "true"),
      (this["promptEl"]["spellcheck"] = false),
      (this["promptEl"]["dataset"]["placeholder"] =
        "描述视频内容，按\x20@\x20引用素材，/呼出指令..."),
      (this["_flushPromptHtmlCommit"] = () => flushPromptHtmlCommit(this)),
      this["promptEl"]["addEventListener"]("input", (v140) => {
        (schedulePromptHtmlCommit(this),
          this["_checkAtTrigger"](v140),
          checkSlashTrigger(v140, {
            promptEl: this["promptEl"],
            nodeType: this["_data"]["type"],
            nodeId: this["nodeId"],
            onGenerate: (v141, v142) => this["_onGenerate"](v141, v142),
          }),
          _syncEdgesOrderFromPills(this),
          this["_updateSubmitButtonState"]());
      }),
      this["promptEl"]["addEventListener"]("blur", () => {
        flushPromptHtmlCommit(this);
      }),
      this["promptEl"]["addEventListener"]("mouseover", (v143) => {
        _handlePillHover(v143, this);
      }),
      this["promptEl"]["addEventListener"]("mouseout", (v144) => {
        _handlePillOut(v144, this);
      }),
      this["promptEl"]["addEventListener"]("keydown", (v145) => {
        if (handlePromptSelectAll(this, v145)) return;
        if (_handleMentionMenuKeyboard(v145)) return;
        if (handleSlashKeyboardNavigation(v145)) return;
        if (v145["key"] === "Enter" && !v145["shiftKey"]) {
          (v145["preventDefault"](),
            flushPromptHtmlCommit(this),
            this["btnEl"]?.["click"]());
          return;
        }
        _handlePillKeyboard(this, v145);
      }),
      this["promptEl"]["addEventListener"]("paste", (v146) => {
        handlePromptPaste(this, v146);
      }),
      v139["appendChild"](this["promptEl"]),
      this["_syncPromptBoxSizeFromData"](this["_data"]),
      this["_setupPromptBoxResize"]());
    this["_data"]["prompt"] &&
      ((this["promptEl"]["innerHTML"] = sanitizePromptHtml(
        this["_data"]["prompt"],
      )),
      this["_initPromptPills"]());
    (v35["appendChild"](v139), this["_syncGenerationNodeHelpTip"]());
    const v147 = document["createElement"]("div");
    ((v147["className"] = "prompt-panel-footer"),
      (this["footerEl"] = v147),
      this["_renderFooter"](v147),
      v35["appendChild"](v147),
      v22["appendChild"](v35),
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
      )));
    const v148 = v22["querySelector"](".node-floating-toolbar");
    return (
      bindVideoToolbarEvents(v148, this["_data"]),
      v24 &&
        v24["addEventListener"]("pointerdown", (v149) => {
          const v150 =
              appStore["getStateRaw"]()["ui"]?.[
                "imageVideoNodeResizeEnabled"
              ] === true,
            v151 = document["getElementById"]("v2-wrap")?.["classList"][
              "contains"
            ]("v2-media-node-resize-enabled");
          if (!(v150 && v151)) return;
          if (v149["button"] !== 0) return;
          startNodeResizePreview({
            event: v149,
            nodeId: this["nodeId"],
            getNode: () =>
              appStore["getStateRaw"]()["nodes"]?.[this["nodeId"]] ||
              this["_data"],
            getViewport: () => appStore["getStateRaw"]()["viewport"],
            resolveSize: ({
              startWidth: v152,
              startHeight: v153,
              dx: v154,
              dy: v155,
            }) => {
              const v156 = v152 / v153,
                v157 = Math["max"](v154 / v152, v155 / v153),
                v158 = Math["max"](
                  AI_VIDEO_MIN_SIZE / v152,
                  AI_VIDEO_MIN_SIZE / v153,
                ),
                v159 = Math["max"](v158, 1 + v157),
                v160 = Math["max"](
                  AI_VIDEO_MIN_SIZE,
                  Math["round"](v152 * v159),
                ),
                v161 = Math["max"](
                  AI_VIDEO_MIN_SIZE,
                  Math["round"](v160 / v156),
                );
              return { width: v160, height: v161 };
            },
            buildFinalPatch: ({ startNode: v162 }) =>
              v162?.["needsAutoResize"] ? { needsAutoResize: false } : {},
            applyPatch: (v163) =>
              appStore["updateNodeData"](this["nodeId"], v163),
            commit: commit,
          });
        }),
      (this["_attachBtnIcon"] = this["refBarEl"]["querySelector"](".btn-icon")),
      this["_updateSubmitButtonState"](),
      v22
    );
  }
  ["_initPromptPills"]() {
    _rehydratePromptPills(this);
  }
  ["_syncPromptBoxSizeFromData"](v164 = this["_data"]) {
    syncPromptBoxSizeFromData(this, v164);
  }
  ["_setupPromptBoxResize"]() {
    setupPromptBoxResize(this, {
      store: appStore,
      getStateSnapshot: () =>
        typeof appStore["getStateRaw"] === "function"
          ? appStore["getStateRaw"]()
          : appStore["getState"](),
    });
  }
  ["update"](v165) {
    const v166 = () => readStoreState()?.["nodes"]?.[this["nodeId"]] || v165;
    v165 = v166() || v165;
    typeof this["_normalizeDreaminaNodeData"] === "function"
      ? (this["_data"] =
          this["_normalizeDreaminaNodeData"](v165, { syncStore: true }) || v165)
      : (this["_data"] = v165);
    ((v165 = v166() || this["_data"]),
      (this["_data"] = v165),
      (v165 = this["_data"]),
      this["_syncNoResultClass"]());
    if (shouldShowGenerationBusyUi(v165)) {
      this["_isGenerating"] = true;
      if (this["previewEl"]) startLoading(this["previewEl"]);
    } else {
      if (isTerminalGenerationUiState(v165)) {
        ((this["_isGenerating"] = false),
          stopPreviewNodeLoading(this["nodeId"]));
        if (this["previewEl"]) stopLoading(this["previewEl"]);
      }
    }
    const v167 = String(v165?.["model"] || "")["trim"](),
      v168 = this["_isRunninghubWorkflowModel"](v167, v165?.["provider"]),
      v169 = getFixedInputSlotConfigFromManifest(v165 || {}),
      v170 = !!v169,
      v171 =
        (v169?.["slotOrderByType"]?.["video"] || [])["includes"](
          "sourceVideo",
        ) &&
        (v169?.["slotOrderByType"]?.["image"] || [])["includes"]("refImage");
    let v172 = appStore["getIncomingEdges"](this["nodeId"]);
    v170 &&
      (v172 = v172["filter"]((v173) => v173?.["targetId"] === this["nodeId"]));
    const v174 = v172["length"] > 0,
      v175 = Array["isArray"](v165?.["videos"]) ? v165["videos"] : [],
      v176 = JSON["stringify"]({
        videos: v175["map"]((v177) => ({
          videoUrl: String(v177?.["videoUrl"] || ""),
          resultUrl: String(v177?.["resultUrl"] || ""),
          sourceUrl: String(v177?.["sourceUrl"] || ""),
          localPath: String(v177?.["localPath"] || ""),
          displayLocalPath: String(v177?.["displayLocalPath"] || ""),
          originalLocalPath: String(v177?.["originalLocalPath"] || ""),
          thumbId: String(v177?.["thumbId"] || ""),
          thumbUrl: String(v177?.["thumbUrl"] || ""),
          thumbLocalPath: String(v177?.["thumbLocalPath"] || ""),
          posterUrl: String(v177?.["posterUrl"] || ""),
          posterLocalPath: String(v177?.["posterLocalPath"] || ""),
          error: String(v177?.["error"] || ""),
          mediaUnavailable: v177?.["mediaUnavailable"] === true,
          mediaUnavailableSource: String(
            v177?.["mediaUnavailableSource"] || "",
          ),
          videoWidth: Number(v177?.["videoWidth"] || v177?.["width"] || 0),
          videoHeight: Number(v177?.["videoHeight"] || v177?.["height"] || 0),
        })),
        videoUrl: String(v165?.["videoUrl"] || ""),
        resultUrl: String(v165?.["resultUrl"] || ""),
        sourceUrl: String(v165?.["sourceUrl"] || ""),
        localPath: String(v165?.["localPath"] || ""),
        displayLocalPath: String(v165?.["displayLocalPath"] || ""),
        originalLocalPath: String(v165?.["originalLocalPath"] || ""),
        thumbId: String(v165?.["thumbId"] || ""),
        thumbUrl: String(v165?.["thumbUrl"] || ""),
        thumbLocalPath: String(v165?.["thumbLocalPath"] || ""),
        posterUrl: String(v165?.["posterUrl"] || ""),
        posterLocalPath: String(v165?.["posterLocalPath"] || ""),
        selectedVideoWidth: Number(v165?.["selectedVideoWidth"] || 0),
        selectedVideoHeight: Number(v165?.["selectedVideoHeight"] || 0),
        videoWidth: Number(v165?.["videoWidth"] || 0),
        videoHeight: Number(v165?.["videoHeight"] || 0),
        mainVideoIndex: Number(v165?.["mainVideoIndex"] || 0),
        isVideosExpanded: !!v165?.["isVideosExpanded"],
        isGenerating: v165?.["isGenerating"] === true,
        jobStatus: String(v165?.["jobStatus"] || ""),
        jobError: String(v165?.["jobError"] || ""),
        error: String(v165?.["error"] || ""),
        statusMessage: String(v165?.["statusMessage"] || ""),
        rhStatus: String(v165?.["rhStatus"] || ""),
        rhStatusMessage: String(v165?.["rhStatusMessage"] || ""),
        rhStatusCode: String(v165?.["rhStatusCode"] || ""),
        rhTaskId: String(v165?.["rhTaskId"] || ""),
        rhTaskStatus: String(v165?.["rhTaskStatus"] || ""),
        rhTaskStartedAt: Number(v165?.["rhTaskStartedAt"] || 0),
        rhTaskRecovering: !!v165?.["rhTaskRecovering"],
        rhTaskUseOpenapiQuery: !!v165?.["rhTaskUseOpenapiQuery"],
        dreaminaSubmitId: String(v165?.["dreaminaSubmitId"] || ""),
        dreaminaTaskStatus: String(v165?.["dreaminaTaskStatus"] || ""),
        dreaminaTaskPhase: String(v165?.["dreaminaTaskPhase"] || ""),
        dreaminaTaskLabel: String(v165?.["dreaminaTaskLabel"] || ""),
        dreaminaTaskStartedAt: Number(v165?.["dreaminaTaskStartedAt"] || 0),
        dreaminaTaskLastCheckedAt: Number(
          v165?.["dreaminaTaskLastCheckedAt"] || 0,
        ),
        dreaminaTaskRecovering: !!v165?.["dreaminaTaskRecovering"],
        asyncTaskId: String(v165?.["asyncTaskId"] || ""),
        asyncTaskStatus: String(v165?.["asyncTaskStatus"] || ""),
        asyncTaskError: String(v165?.["asyncTaskError"] || ""),
        asyncTaskRecovering: !!v165?.["asyncTaskRecovering"],
      }),
      v178 = v176 !== this["_lastVideoViewSig"];
    this["_lastVideoViewSig"] = v176;
    const v179 = v174 !== this["_lastHasInputConnections"];
    this["_lastHasInputConnections"] = v174;
    (v178 || v179) && this["_loadAndDisplayVideo"]();
    typeof this["_maybeResumeDreaminaTaskImpl"] === "function" &&
      this["_maybeResumeDreaminaTaskImpl"]();
    typeof this["_maybeResumeRunningHubTaskImpl"] === "function" &&
      this["_maybeResumeRunningHubTaskImpl"]();
    typeof this["_maybeResumeAsyncTaskImpl"] === "function" &&
      this["_maybeResumeAsyncTaskImpl"]();
    const v180 = v172["map"](
        (v181) =>
          String(v181?.["sourceId"] || "") +
          ":" +
          String(v181?.["refSlot"] || ""),
      )["join"]("|"),
      v182 = (v183) => {
        const v184 = String(v183 || "")
          ["trim"]()
          ["toLowerCase"]();
        return (
          !v184 || v184 === "自适应" || v184 === "auto" || v184 === "adaptive"
        );
      },
      v185 = (v186) => {
        const v187 =
            typeof this["_getDreaminaEffectiveNodeData"] === "function"
              ? this["_getDreaminaEffectiveNodeData"](v186 || {})
              : v186 || {},
          v188 = v187?.["generationParams"];
        return v188 &&
          typeof v188 === "object" &&
          !Array["isArray"](v188) &&
          Object["prototype"]["hasOwnProperty"]["call"](v188, "aspectRatio")
          ? v188["aspectRatio"]
          : v187?.["aspectRatio"];
      };
    if (
      this["_lastAdaptiveEdgeSig"] !== null &&
      v180 !== this["_lastAdaptiveEdgeSig"]
    ) {
      const v189 = v185(this["_data"]);
      v182(v189) &&
        typeof this["_runAdaptiveRatio"] === "function" &&
        !v168 &&
        setTimeout(() => {
          if (readStoreState()["nodes"][this["nodeId"]])
            this["_runAdaptiveRatio"]();
        }, 50);
    }
    ((this["_lastAdaptiveEdgeSig"] = v180),
      (v165 = v166() || this["_data"] || v165),
      (this["_data"] = v165));
    const v190 =
        typeof this["_isDreaminaVideoNode"] === "function" &&
        this["_isDreaminaVideoNode"](v165)
          ? (v165["dreaminaRouteMode"] || "") +
            "|" +
            (this["_getDreaminaReferenceSummary"]?.(v165)?.["signature"] || "")
          : "",
      v191 =
        (v165["model"] || "") +
        "|" +
        (v165["provider"] || "") +
        "|" +
        (v165["rhSpecialMode"] || "") +
        "|" +
        v190;
    let v192 = false;
    this["footerEl"] &&
      v191 !== this["_lastFooterSig"] &&
      ((this["_lastFooterSig"] = v191),
      this["_renderFooter"](this["footerEl"]),
      (v165 = v166() || this["_data"] || v165),
      (this["_data"] = v165),
      (v192 = true));
    if (
      v192 &&
      typeof this["_isDreaminaVideoNode"] === "function" &&
      this["_isDreaminaVideoNode"](v165)
    ) {
      const v193 =
        readStoreState()["nodes"]?.[this["nodeId"]] || this["_data"] || {};
      v182(v185(v193)) &&
        typeof this["_runAdaptiveRatio"] === "function" &&
        setTimeout(() => {
          if (readStoreState()["nodes"][this["nodeId"]])
            this["_runAdaptiveRatio"]();
        }, 50);
    }
    const v194 = readStoreState()["pickConnectMode"];
    if (this["_placeholderEl"]) {
      const v195 = this["_placeholderEl"]["querySelector"](
        ".placeholder-icon-svg",
      );
      if (v195) {
        if (v194?.["active"] && v194["sourceNodeId"] === this["nodeId"])
          v195["classList"]["add"]("is-pick-connecting");
        else v195["classList"]["remove"]("is-pick-connecting");
      }
    }
    if (
      document["activeElement"] !== this["promptEl"] &&
      v165["prompt"] !== undefined
    ) {
      const v196 = sanitizePromptHtml(v165["prompt"] || "");
      this["promptEl"]["innerHTML"] !== v196 &&
        ((this["promptEl"]["innerHTML"] = v196), this["_initPromptPills"]());
    }
    typeof this["_syncDreaminaPromptPlaceholder"] === "function" &&
      this["_syncDreaminaPromptPlaceholder"](v165);
    (this["_syncPromptBoxSizeFromData"](v165),
      this["_syncGenerationNodeHelpTip"](),
      (v172 = appStore["getIncomingEdges"](this["nodeId"])));
    v170 &&
      (v172 = v172["filter"]((v197) => v197?.["targetId"] === this["nodeId"]));
    const v198 = readStoreState()["nodes"] || {},
      v199 = v172["map"]((v200) => {
        const v201 = v198?.[v200["sourceId"]] || null,
          v202 =
            typeof this["_getRefSourceStateKey"] === "function"
              ? this["_getRefSourceStateKey"](v201)
              : "";
        return (
          v200["id"] +
          ":" +
          v200["sourceId"] +
          ":" +
          (v200["refSlot"] || "") +
          ":" +
          (v200["sourceMediaKey"] || "") +
          ":" +
          v202
        );
      })["join"]("|"),
      v203 = v169
        ? String(
            v169["visibilityLayoutKey"] ||
              v169["visibleSlots"]?.["join"]("|") ||
              "",
          )
        : "",
      v204 =
        (v165?.["model"] || "") + "|" + (v165?.["provider"] || "") + "|" + v203,
      v205 = String(v165?.["rhSpecialMode"] || ""),
      v206 = String(v165?.["rhSubtractSubject"] || "");
    if (
      v199 !== this["_lastEdgeSig"] ||
      v204 !== this["_lastRefModeSig"] ||
      v205 !== this["_lastSpecialModeSig"] ||
      v206 !== this["_lastSubtractSubjectSig"]
    ) {
      ((this["_lastEdgeSig"] = v199),
        (this["_lastRefModeSig"] = v204),
        (this["_lastSpecialModeSig"] = v205),
        (this["_lastSubtractSubjectSig"] = v206),
        this["_renderRefBar"]());
      if (v174 && this["_placeholderEl"]) {
        const v207 =
          (Array["isArray"](v165?.["videos"]) &&
            v165["videos"]["length"] > 0) ||
          !!String(v165?.["videoUrl"] || "")["trim"]() ||
          !!String(v165?.["localPath"] || "")["trim"]() ||
          !!String(v165?.["thumbId"] || "")["trim"]();
        ((this["_placeholderEl"]["style"]["display"] = v207 ? "none" : "flex"),
          this["_setVideoOverlaysVisible"](v207));
      }
      v171 && this["_loadAndDisplayVideo"]();
    } else this["_syncBtnIconState"]();
    this["_updateSubmitButtonState"]();
    if (this["footerEl"]) {
      ((v165 = v166() || this["_data"] || v165), (this["_data"] = v165));
      const v208 = String(v165?.["model"] || "")["trim"](),
        v209 = this["_isRunninghubWorkflowModel"](v208, v165?.["provider"]),
        v210 = hasRunningHubVideoWorkflowUiPlacement(v208, "videoParams"),
        v211 = v209,
        v212 = hasRunningHubVideoWorkflowUiPlacement(v208, "videoAdvanced"),
        v213 =
          typeof this["_resolveModelExecution"] === "function"
            ? this["_resolveModelExecution"](v208, v165?.["provider"])
            : null,
        v214 =
          v213?.["modelManifest"]?.["adapterType"] === "modelApi" &&
          v213?.["modelManifest"]?.["kind"] === "video"
            ? String(
                v213?.["canonicalModelId"] ||
                  v213?.["modelManifest"]?.["modelId"] ||
                  v208,
              )["trim"]()
            : "",
        v215 = !!v214 && hasModelUiSchema(v214, { placement: "advanced" }),
        v216 = v212 || v215;
      if (hasRunningHubVideoWorkflowUiField(v208, "rhMaskExpand")) {
        const v217 = v165?.["rhMaskExpandTouched"] === true,
          v218 = Number(v165?.["rhMaskExpand"]);
        Number["isFinite"](v218) &&
          v218 === 0 &&
          !v217 &&
          appStore["updateNodeData"](this["nodeId"], { rhMaskExpand: 25 });
      }
      const v219 = this["footerEl"]["querySelector"](".rh-adv2-btn");
      if (v219) v219["style"]["display"] = v216 ? "" : "none";
      const v220 = this["footerEl"]["querySelector"](
        ".ui-schema-instance-slot",
      );
      if (v220) v220["style"]["display"] = v211 ? "" : "none";
      const v221 =
        typeof this["_getRhVideoAdvancedSchemaNodeData"] === "function"
          ? this["_getRhVideoAdvancedSchemaNodeData"](v165)
          : v165;
      syncModelUiSchemaControls(this["footerEl"], v221);
      const v222 = this["footerEl"]["querySelector"](".img-ratio-label");
      if (v222 && !v210) {
        if (
          typeof this["_isDreaminaVideoNode"] === "function" &&
          this["_isDreaminaVideoNode"](v165) &&
          typeof this["_getDreaminaRatioDisplayState"] === "function"
        ) {
          const v223 = this["_getDreaminaRatioDisplayState"](v165);
          v222["textContent"] =
            v223?.["ratioLabelText"] ||
            (v165?.["aspectRatio"] || "自适应") +
              " · " +
              (v165?.["resolution"] || "1080p");
          const v224 = this["footerEl"]["querySelector"](
            ".img-ratio-icon-slot",
          );
          v224 &&
            typeof this["_getRatioIconHTML"] === "function" &&
            (v224["innerHTML"] = this["_getRatioIconHTML"](
              v223?.["ratioIconLabel"] || v165?.["aspectRatio"] || "自适应",
            ));
        } else
          v222["textContent"] =
            (v165?.["aspectRatio"] || "自适应") +
            " · " +
            (v165?.["resolution"] || "1080p");
      }
      const v225 = this["footerEl"]["querySelector"](".rh-vram-adv-panel");
      if (v225 && !v216) v225["classList"]["remove"]("show");
    }
  }
  ["_syncBtnIconStateImpl"]() {
    const v226 = readStoreState()["pickConnectMode"],
      v227 = this["refBarEl"]?.["querySelector"](".btn-icon");
    if (!v227) return;
    v226?.["active"] && v226["sourceNodeId"] === this["nodeId"]
      ? ((v227["style"]["opacity"] = "0"),
        (v227["style"]["transform"] = "scale(0.4)"))
      : ((v227["style"]["opacity"] = "1"),
        (v227["style"]["transform"] = "scale(1)"));
  }
  ["_checkAtTrigger"](v228) {
    return _checkAtTrigger(this, v228);
  }
  ["_populateMentionMenu"](
    v229,
    v230,
    v231,
    v232 = null,
    v233 = "",
    v234 = -1,
  ) {
    return _populateMentionMenu(this, {
      x: v229,
      y: v230,
      triggerRange: v231,
      pillToEdit: v232,
      query: v233,
      atIndex: v234,
    });
  }
  ["_insertMentionPill"](v235, v236, v237, v238 = -1) {
    return _insertMentionPill(this, {
      label: v235,
      nodeId: v236,
      triggerRange: v237,
      atIndex: v238,
    });
  }
  ["_handlePillKeyboard"](v239) {
    return _handlePillKeyboard(this, v239);
  }
  ["_getGenerationNodeHelpText"]() {
    const v240 = String(this["_data"]?.["model"] || "")["trim"]();
    return getGenerationNodeHelpTooltip({
      kind: "video",
      key: v240,
      model: v240,
      label: getDisplayModelName(v240),
      nodeData: this["_data"] || {},
    });
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
  ["_syncGenerationNodeHelpTip"]() {
    this["_ensureGenerationNodeHelpTip"]()?.["sync"]();
  }
  ["unmount"]() {
    (this["_flushPromptHtmlCommit"]?.(),
      this["_assetMentionRegistryUnsubscribe"]?.(),
      (this["_assetMentionRegistryUnsubscribe"] = null),
      (this["_assetMentionRegistryRefreshPending"] = false));
    typeof this["_stopDreaminaRecovery"] === "function" &&
      this["_stopDreaminaRecovery"](false);
    typeof this["_stopRunningHubRecovery"] === "function" &&
      this["_stopRunningHubRecovery"](false);
    typeof this["_stopAsyncRecovery"] === "function" &&
      this["_stopAsyncRecovery"](false);
    typeof this["_promptResizeCleanup"] === "function" &&
      (this["_promptResizeCleanup"](), (this["_promptResizeCleanup"] = null));
    (this["_generationNodeHelpTip"]?.["remove"](),
      (this["_generationNodeHelpTip"] = null),
      this["_uiSchemaCleanup"]?.(),
      (this["_uiSchemaCleanup"] = null),
      this["_footerControllerCleanup"]?.(),
      (this["_footerControllerCleanup"] = null),
      (this["_isPromptBoxResizing"] = false),
      this["_blobResolveToken"]++);
    this["_videoClickTimer"] &&
      (clearTimeout(this["_videoClickTimer"]),
      (this["_videoClickTimer"] = null));
    this["_centerIndicatorTimer"] &&
      (clearTimeout(this["_centerIndicatorTimer"]),
      (this["_centerIndicatorTimer"] = null));
    this["_isManualLoopPlayback"] = false;
    try {
      this["previewEl"]?.["querySelectorAll"]("video")["forEach"]((v241) => {
        try {
          v241["pause"]();
        } catch {}
        (v241["removeAttribute"]("src"), v241["load"]?.());
      });
    } catch {}
    for (const v242 of this["_cachedVideoUrls"]["values"]()) {
      if (v242 && String(v242)["startsWith"]("blob:"))
        try {
          URL["revokeObjectURL"](v242);
        } catch {}
    }
    this["_cachedVideoUrls"]["clear"]();
    const v243 = [
      this["_fixedSlotRefThumbObjectUrls"],
      this["_refThumbObjectUrls"],
    ];
    for (const v244 of v243) {
      if (!(v244 && typeof v244["entries"] === "function")) continue;
      for (const v245 of v244["values"]()) {
        if (v245 && String(v245)["startsWith"]("blob:"))
          try {
            URL["revokeObjectURL"](v245);
          } catch {}
      }
      try {
        v244["clear"]();
      } catch {}
    }
    this["_videoThumbPending"]["clear"]();
  }
}
const videoNodeReferenceInputModule = createVideoNodeReferenceInputModule(
    VIDEO_NODE_MODULE_DEPS,
  ),
  videoNodeParameterPanelModule = createVideoNodeParameterPanelModule(
    VIDEO_NODE_MODULE_DEPS,
  ),
  videoNodeTaskOrchestrationModule = createVideoNodeTaskOrchestrationModule(
    VIDEO_NODE_MODULE_DEPS,
  ),
  videoNodeResultRenderModule = createVideoNodeResultRenderModule(
    VIDEO_NODE_MODULE_DEPS,
  ),
  videoNodePreviewControlsModule = createVideoNodePreviewControlsModule(
    VIDEO_NODE_MODULE_DEPS,
  );
function applyClassPrototypeMethods(v246, v247) {
  if (!v247) return;
  const v248 = Object["getOwnPropertyDescriptors"](v247);
  (delete v248["constructor"], Object["defineProperties"](v246, v248));
}
(applyClassPrototypeMethods(
  AIGenVideoNode["prototype"],
  videoNodeReferenceInputModule,
),
  applyClassPrototypeMethods(
    AIGenVideoNode["prototype"],
    videoNodeParameterPanelModule,
  ),
  applyClassPrototypeMethods(
    AIGenVideoNode["prototype"],
    videoNodeTaskOrchestrationModule,
  ),
  applyClassPrototypeMethods(
    AIGenVideoNode["prototype"],
    videoNodeResultRenderModule,
  ),
  applyClassPrototypeMethods(
    AIGenVideoNode["prototype"],
    videoNodePreviewControlsModule,
  ),
  Object["assign"](
    AIGenVideoNode["prototype"],
    videoUiRenderMixin,
    videoStateSyncMixin,
    videoTaskOrchestrationMixin,
  ));
