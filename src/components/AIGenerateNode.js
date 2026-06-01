import appStore from "../core/stores/appStore.js";
import { getDisplayModelName } from "../modules/providers.js";
import {
  _handlePillHover,
  _handlePillOut,
  _syncEdgesOrderFromPills,
  _syncPillLabels,
  _checkAtTrigger,
  _populateMentionMenu,
  _insertMentionPill,
  _handlePillKeyboard,
  _rehydratePromptPills,
  _handleMentionMenuKeyboard,
} from "../modules/nodePromptShared.js";
import {
  TEXT_TOOLBAR_HTML,
  bindTextToolbarEvents,
  IMAGE_TOOLBAR_HTML,
  bindImageToolbarEvents,
  showDevToast,
} from "./NodeToolbarConfig.js";
import { getImage } from "../modules/storage.js";
import { openNodeImagePreview } from "../modules/imagePreview.js";
import {
  getPromptPresets,
  openCustomPresetsManager,
} from "../modules/promptPresets.js";
import { startLoading, stopLoading } from "../modules/loadingOverlay.js";
import { bindRefThumbHoverPreview } from "../modules/refThumbHoverPreview.js";
import {
  ensureThumbDecoded,
  revealRefThumbMedia,
} from "../modules/refThumbMediaReveal.js";
import { getRefKindByNodeType } from "../modules/nodeMeta.js";
import { uploadFile } from "../modules/project.js";
import { ensureConfig, getProviderConfig } from "../../api/configApi.js";
import {
  buildGenerateImageRequest,
  cancelRunningHubImageTask,
  generateImage,
  resumeAsyncImageTask,
  resumeDreaminaImageTask,
  resumeRunningHubImageTask,
} from "../../api/aiImageApi.js";
import { generateId } from "../core/math.js";
import {
  checkSlashTrigger,
  handleSlashKeyboardNavigation,
  closeSlashMenu,
} from "../modules/slashMenu.js";
import { activateMenuKeyboard } from "../modules/floatingMenuKeyboard.js";
import ImageFreeAngleController from "../modules/ImageFreeAngleController.js";
import { createAIGenerateNodeUiModule } from "./aigenImage/uiModule.js";
import { hasAIGenMaskPreviewBaseImage } from "./aigenImage/maskPreviewPolicy.js";
import { createAIGenerateNodeStateSyncModule } from "./aigenImage/stateSyncModule.js";
import { createAIGenerateNodeTaskOrchestrationModule } from "./aigenImage/taskOrchestrationModule.js";
const api = {
    buildGenerateImageRequest: buildGenerateImageRequest,
    cancelRunningHubWorkflowTask: cancelRunningHubImageTask,
    generateImage: generateImage,
    resumeAsyncImageTask: resumeAsyncImageTask,
    resumeDreaminaImageTask: resumeDreaminaImageTask,
    resumeRunningHubImageTask: resumeRunningHubImageTask,
  },
  AI_GENERATE_NODE_MODULE_DEPS = {
    store: appStore,
    api: api,
    getDisplayModelName: getDisplayModelName,
    _handlePillHover: _handlePillHover,
    _handlePillOut: _handlePillOut,
    _syncEdgesOrderFromPills: _syncEdgesOrderFromPills,
    _syncPillLabels: _syncPillLabels,
    _checkAtTrigger: _checkAtTrigger,
    _populateMentionMenu: _populateMentionMenu,
    _insertMentionPill: _insertMentionPill,
    _handlePillKeyboard: _handlePillKeyboard,
    _rehydratePromptPills: _rehydratePromptPills,
    _handleMentionMenuKeyboard: _handleMentionMenuKeyboard,
    TEXT_TOOLBAR_HTML: TEXT_TOOLBAR_HTML,
    bindTextToolbarEvents: bindTextToolbarEvents,
    IMAGE_TOOLBAR_HTML: IMAGE_TOOLBAR_HTML,
    bindImageToolbarEvents: bindImageToolbarEvents,
    showDevToast: showDevToast,
    getImage: getImage,
    openNodeImagePreview: openNodeImagePreview,
    getPromptPresets: getPromptPresets,
    openCustomPresetsManager: openCustomPresetsManager,
    startLoading: startLoading,
    stopLoading: stopLoading,
    bindRefThumbHoverPreview: bindRefThumbHoverPreview,
    ensureThumbDecoded: ensureThumbDecoded,
    revealRefThumbMedia: revealRefThumbMedia,
    getRefKindByNodeType: getRefKindByNodeType,
    uploadFile: uploadFile,
    ensureConfig: ensureConfig,
    getProviderConfig: getProviderConfig,
    generateId: generateId,
    checkSlashTrigger: checkSlashTrigger,
    handleSlashKeyboardNavigation: handleSlashKeyboardNavigation,
    closeSlashMenu: closeSlashMenu,
    activateMenuKeyboard: activateMenuKeyboard,
    ImageFreeAngleController: ImageFreeAngleController,
  };
export class AIGenerateNode {
  constructor(v0) {
    ((this["_data"] = v0),
      (this["nodeId"] = v0["id"]),
      (this["previewEl"] = null),
      (this["imgEl"] = null),
      (this["refBarEl"] = null),
      (this["promptEl"] = null),
      (this["btnEl"] = null),
      (this["_dragSrcIdx"] = null),
      (this["_dragBounds"] = []),
      (this["_cachedThumbUrl"] = null),
      (this["_currentThumbId"] = null),
      (this["_cachedSourceUrl"] = null),
      (this["_currentSourceId"] = null),
      (this["_currentLocalPath"] = null),
      (this["_thumbObjectUrls"] = new Map()),
      (this["_refThumbObjectUrls"] = new Map()),
      (this["_currentMaskPreview"] = null),
      (this["_suppressedEmptyMaskPreview"] = null),
      (this["_resolvedUrlsKey"] = null),
      (this["_resolvedMainUrls"] = null),
      (this["_resolvedAuxUrls"] = null),
      (this["_lastImagesKeyStr"] = null),
      (this["_lastMainIdx"] = null),
      (this["_lastIsExpanded"] = null),
      (this["_multiStackWrap"] = null),
      (this["_multiLayerEls"] = []),
      (this["_multiErrorEls"] = []),
      (this["_multiToggleBtn"] = null),
      (this["_maskOverlay"] = null),
      (this["_qualityBtns"] = []),
      (this["_attachBtnIcon"] = null),
      (this["_lastEdgeSig"] = null),
      (this["_renderRefBarLock"] = null),
      (this["_ratioAnimTimer"] = null),
      (this["_ratioFlipAnim"] = null),
      (this["_rhAbortController"] = null),
      (this["_rhTaskId"] = null),
      (this["_rhApiKey"] = null),
      (this["_rhCancelRequested"] = false),
      (this["_rhResumeAbortController"] = null),
      (this["_rhResumeTaskId"] = ""),
      (this["_rhResumePromise"] = null),
      (this["_dreaminaResumeAbortController"] = null),
      (this["_dreaminaResumeSubmitId"] = ""),
      (this["_dreaminaResumePromise"] = null),
      (this["_dreaminaActiveSubmitId"] = ""),
      (this["_asyncResumeAbortController"] = null),
      (this["_asyncResumeTaskId"] = ""),
      (this["_asyncResumePromise"] = null),
      (this["_statusOverlayEl"] = null),
      (this["_assetMentionRegistryUnsubscribe"] = null),
      (this["_assetMentionRegistryRefreshPending"] = false),
      (this["_generationNodeHelpTip"] = null),
      (this["_footerControllerCleanup"] = null),
      (this["_uiSchemaCleanup"] = null));
  }
  ["_hideMaskPreview"]() {
    if (!this["_maskOverlay"]) return;
    ((this["_maskOverlay"]["src"] = ""),
      (this["_maskOverlay"]["style"]["display"] = "none"),
      (this["_currentMaskPreview"] = null));
  }
  ["_applyMaskPreview"](v1) {
    if (!this["_maskOverlay"]) return;
    const v2 = String(v1 || "")["trim"]();
    if (!v2) {
      ((this["_suppressedEmptyMaskPreview"] = null),
        this["_hideMaskPreview"]());
      return;
    }
    if (!hasAIGenMaskPreviewBaseImage(this["_data"])) {
      ((this["_suppressedEmptyMaskPreview"] = v2), this["_hideMaskPreview"]());
      return;
    }
    if (this["_suppressedEmptyMaskPreview"] === v2) {
      this["_hideMaskPreview"]();
      return;
    }
    this["_suppressedEmptyMaskPreview"] = null;
    if (this["_currentMaskPreview"] === v2) return;
    const v3 =
      v2["startsWith"]("blob:") ||
      v2["startsWith"]("data:") ||
      v2["startsWith"]("/")
        ? v2
        : "/" + v2["replace"](/^\//, "");
    ((this["_maskOverlay"]["src"] = encodeURI(v3)),
      (this["_maskOverlay"]["style"]["display"] = "block"),
      (this["_currentMaskPreview"] = v2));
  }
  ["_checkAtTrigger"](v4) {
    return _checkAtTrigger(this, v4);
  }
  ["_populateMentionMenu"](v5, v6, v7, v8 = null, v9 = "", v10 = -1) {
    return _populateMentionMenu(this, {
      x: v5,
      y: v6,
      triggerRange: v7,
      pillToEdit: v8,
      query: v9,
      atIndex: v10,
    });
  }
  ["_insertMentionPill"](v11, v12, v13, v14 = -1) {
    return _insertMentionPill(this, {
      label: v11,
      nodeId: v12,
      triggerRange: v13,
      atIndex: v14,
    });
  }
  ["_handlePillKeyboard"](v15) {
    return _handlePillKeyboard(this, v15);
  }
  ["_buildFloatingMenu"](v16, v17, v18, v19, v20) {
    const v21 = document["createElement"]("div");
    v21["style"]["position"] = "relative";
    const v22 = document["createElement"]("button");
    ((v22["type"] = "button"),
      (v22["className"] = "img-pill-btn"),
      (v22["id"] = v16));
    const v23 = document["createElement"]("span");
    ((v23["className"] = v17),
      (v23["textContent"] = v18),
      v22["appendChild"](v23));
    const v24 = document["createElement"]("svg");
    (v24["setAttribute"]("width", "10"),
      v24["setAttribute"]("height", "10"),
      v24["setAttribute"]("viewBox", "0 0 24 24"),
      v24["setAttribute"]("fill", "none"),
      v24["setAttribute"]("stroke", "currentColor"),
      v24["setAttribute"]("stroke-width", "2"),
      (v24["style"]["opacity"] = "0.5"),
      (v24["innerHTML"] = '<polyline points="6 9 12 15 18 9"/>'),
      v22["appendChild"](v24));
    const v25 = document["createElement"]("div");
    return (
      (v25["className"] = "floating-menu"),
      v19["forEach"]((v26) => {
        const v27 = document["createElement"]("div");
        ((v27["className"] =
          "floating-menu-item" +
          (v26["v"] === v18 || v26["l"] === v18 ? "\x20active" : "")),
          (v27["dataset"]["value"] = v26["v"]),
          (v27["textContent"] = v26["l"]),
          v27["addEventListener"]("mousedown", (v28) => {
            (v28["preventDefault"](),
              (v23["textContent"] = v26["l"]),
              v25["querySelectorAll"](".floating-menu-item")["forEach"]((v29) =>
                v29["classList"]["remove"]("active"),
              ),
              v27["classList"]["add"]("active"),
              v25["classList"]["remove"]("open"),
              v20(v26["v"]));
          }),
          v25["appendChild"](v27));
      }),
      v22["addEventListener"]("mousedown", (v30) => {
        (v30["preventDefault"](), v30["stopPropagation"]());
        const v31 = v25["classList"]["contains"]("open");
        document["querySelectorAll"](".floating-menu.open")["forEach"]((v32) =>
          v32["classList"]["remove"]("open"),
        );
        if (!v31) v25["classList"]["add"]("open");
      }),
      document["addEventListener"](
        "mousedown",
        (v33) => {
          if (!v21["contains"](v33["target"]))
            v25["classList"]["remove"]("open");
        },
        true,
      ),
      v21["appendChild"](v22),
      v21["appendChild"](v25),
      { modelWrap: v21, trig: v22, menu: v25 }
    );
  }
}
const aiGenerateNodeUiModule = createAIGenerateNodeUiModule(
    AI_GENERATE_NODE_MODULE_DEPS,
  ),
  aiGenerateNodeStateSyncModule = createAIGenerateNodeStateSyncModule(
    AI_GENERATE_NODE_MODULE_DEPS,
  ),
  aiGenerateNodeTaskOrchestrationModule =
    createAIGenerateNodeTaskOrchestrationModule(AI_GENERATE_NODE_MODULE_DEPS);
function applyClassPrototypeMethods(v34, v35) {
  if (!v35) return;
  const v36 = Object["getOwnPropertyDescriptors"](v35);
  (delete v36["constructor"], Object["defineProperties"](v34, v36));
}
(applyClassPrototypeMethods(
  AIGenerateNode["prototype"],
  aiGenerateNodeUiModule,
),
  applyClassPrototypeMethods(
    AIGenerateNode["prototype"],
    aiGenerateNodeStateSyncModule,
  ),
  applyClassPrototypeMethods(
    AIGenerateNode["prototype"],
    aiGenerateNodeTaskOrchestrationModule,
  ));
