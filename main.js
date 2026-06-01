import appStore, {
  graphStore,
  uiStore,
  workspaceStore,
} from "./src/core/stores/appStore.js";
import { initRenderer, clearRendererCache } from "./src/core/renderer.js";
import {
  initRendererUiEvents,
  installRendererEventBindingGuard,
} from "./src/ui/rendererUiEvents.js";
import {
  executeCommand,
  getDragContext,
  handleContextMenu,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handleWheel,
  initCanvasContextMenu,
  initConnectionHandles,
  initPickConnect,
} from "./src/core/interaction.js";
import { registerNode } from "./src/modules/registry.js";
import { getNodeTypeAliases } from "./src/modules/nodeMeta.js";
import { SourceTextNode } from "./src/components/SourceTextNode.js";
import { SourceImageNode } from "./src/components/SourceImageNode.js";
import { SourceVideoNode } from "./src/components/SourceVideoNode.js";
import { SourceAudioNode } from "./src/components/SourceAudioNode.js";
import { WebPreviewNode } from "./src/components/WebPreviewNode.js";
import { MediaClipNode } from "./src/components/MediaClipNode.js";
import { CommentNoteNode } from "./src/components/CommentNoteNode.js";
import { AIGenerateNode } from "./src/components/AIGenerateNode.js";
import { AIGenTextNode } from "./src/components/AIGenTextNode.js";
import { AIGenVideoNode } from "./src/components/AIGenVideoNode.js";
import { AIGenAudioNode } from "./src/components/AIGenAudioNode.js";
import { GroupNode } from "./src/components/GroupNode.js";
import { DebugNode } from "./src/components/DebugNode.js";
import { SceneDetectionNode } from "./src/components/SceneDetectionNode.js";
import { showDevToast } from "./src/components/NodeToolbarConfig.js";
import { setTextWithLineBreaks } from "./src/utils/dom.js";
import { StoryboardNode } from "./src/components/StoryboardNode.js";
import { StoryboardScriptNode } from "./src/components/StoryboardScriptNode.js";
import { CollageNode } from "./src/components/CollageNode.js";
import { PanoramaSceneNode } from "./src/components/PanoramaSceneNode.js";
import { undo, redo, commit, onCommit } from "./src/modules/history.js";
import * as project from "./src/modules/project.js";
import { closeShortcuts } from "./src/modules/shortcuts.js";
import {
  applySnapGridEnabled,
  readSnapGridEnabled,
} from "./src/modules/snapGridState.js";
import {
  initToastService,
  initKeyboardService,
  addShortcutListener,
  handleFileDrop,
  handleWebImageUrlDrop,
  getBaseName,
  getNodeDefaultSize,
  getAIGenerationDefaultSizeByType,
  getAIGenerationNodeSize,
  processFile,
  showError,
  initDesktopMediaWakeService,
  initStoreRuntimeEffects,
} from "./src/services/index.js";
import { uploadFile } from "./src/services/projectService.js";
import { migrateLegacyThumbnailsInMultiData } from "./src/services/thumbnailCacheService.js";
import { initWebPreviewViewSyncService } from "./src/services/webPreviewViewSyncService.js";
import { sanitizeMultiCanvasDataForPersistence } from "./src/utils/thumbnailPersistence.js";
import { loadCustomPresets } from "./src/modules/promptPresets.js";
import {
  getProjects as getProjects,
  createProject as createProject,
  deleteProject as deleteProject,
  fetchApiConfigFromServer,
  saveApiConfigToServer,
  testProviderConnections,
  fetchDreaminaCliStatusFromServer,
  startDreaminaHeadlessLoginFromServer,
  startDreaminaHeadlessReloginFromServer,
  startDreaminaWebLoginFromServer,
  importDreaminaLoginResponseFromServer,
  logoutDreaminaFromServer,
  buildDreaminaQrImageUrl,
  startServerConnectionMonitor,
  fetchAppRuntimeInfoFromServer,
} from "./api/index.js";
import { initMinimap } from "./src/modules/minimap.js";
import ImageAnnotateController from "./src/modules/ImageAnnotateController.js";
import ImageMattingController from "./src/modules/ImageMattingController.js";
import AudioClipController from "./src/modules/AudioClipController.js";
import { CanvasTabManager } from "./src/modules/CanvasTabManager.js";
import { CanvasProjectDropdownManager } from "./src/modules/CanvasProjectDropdownManager.js";
import { SettingsManager } from "./src/modules/SettingsManager.js";
import { MascotManager } from "./src/modules/MascotManager.js";
import { initAutoUpdate } from "./src/modules/AutoUpdate.js";
import { initDiagnosticsService } from "./src/services/diagnosticsService.js";
import { initExternalLinkHandlers } from "./src/services/externalLinkService.js";
import { initDevEntries } from "./src/modules/devEntry.js";
import { initFloatingMenuKeyboard } from "./src/modules/floatingMenuKeyboard.js";
import { initTextInputContextMenu } from "./src/modules/textInputContextMenu.js";
import { initTaskCenterManager } from "./src/modules/TaskCenterManager.js";
import { installTooltipUnifier } from "./src/modules/tooltipUnifier.js";
import {
  createDefaultSubscriptionState,
  isModelAllowed,
  isSubscriptionActive,
  isActivationRequestAccepted,
  normalizeSubscriptionPayload,
  ensureInstallId,
  pullSubscriptionState,
  submitCdkey,
  clearSubscriptionAuthorization,
  DEFAULT_VIP_GATE_MODEL_ID,
  getVipModelDisplayName,
} from "./src/modules/subscriptionAccess.js";
import { createAppBusinessEvents } from "./src/modules/app/appBusinessEvents.js";
import { createAppCanvasNodeFlows } from "./src/modules/app/canvasNodeFlows.js";
import { createAppTopbarAndConfig } from "./src/modules/app/appTopbarAndConfig.js";
import { createAppPanels } from "./src/modules/app/appPanels.js";
import { createAppViewport } from "./src/modules/app/appViewport.js";
import { installAppCanvasPointerBindings } from "./src/modules/app/appCanvasPointerBindings.js";
import { initAppShellUi } from "./src/modules/app/appShellUi.js";
import {
  createSpecialNodeDataByType,
  initAppNodeEntry,
} from "./src/modules/app/appNodeEntry.js";
import { bootstrapAppProject } from "./src/modules/app/projectBootstrap.js";
((window["_isSessionActive"] = true),
  initToastService(),
  initDiagnosticsService(),
  initExternalLinkHandlers(),
  initKeyboardService(),
  initFloatingMenuKeyboard(),
  initTextInputContextMenu(),
  initTaskCenterManager(),
  installTooltipUnifier(),
  initDesktopMediaWakeService(),
  startServerConnectionMonitor(),
  (window["AI_CANVAS_IS_DEV_BUILD"] = false));
function publishRuntimeInfo(v0 = {}) {
  ((window["AI_CANVAS_IS_DEV_BUILD"] = Boolean(v0?.["isDevBuild"])),
    (window["ADVANCED_MODE"] = Boolean(v0?.["isAdvancedMode"])),
    window["dispatchEvent"](
      new CustomEvent("aicanvas:runtime-info", { detail: v0 }),
    ));
}
async function initLocalDevModeFromRuntime() {
  try {
    const v1 = await fetchAppRuntimeInfoFromServer();
    (publishRuntimeInfo(v1),
      initDevEntries({ isDevBuild: Boolean(v1?.["isDevBuild"]) }));
  } catch (v2) {
    (publishRuntimeInfo({ isDevBuild: false, isAdvancedMode: false }),
      initDevEntries({ isDevBuild: false }));
  }
}
initLocalDevModeFromRuntime();
const NODE_COMPONENTS = {
  "source-text": SourceTextNode,
  "comment-note": CommentNoteNode,
  "source-image": SourceImageNode,
  "source-video": SourceVideoNode,
  "source-audio": SourceAudioNode,
  "web-preview": WebPreviewNode,
  "media-clip": MediaClipNode,
  "ai-image": AIGenerateNode,
  "ai-text": AIGenTextNode,
  "ai-video": AIGenVideoNode,
  "ai-audio": AIGenAudioNode,
  "scene-detection": SceneDetectionNode,
  group: GroupNode,
  debug: DebugNode,
  collage: CollageNode,
  storyboard: StoryboardNode,
  "storyboard-script": StoryboardScriptNode,
  "panorama-scene": PanoramaSceneNode,
  "panorama-360": PanoramaSceneNode,
};
for (const [type, ComponentClass] of Object["entries"](NODE_COMPONENTS)) {
  registerNode(type, ComponentClass);
  for (const alias of getNodeTypeAliases(type)) {
    registerNode(alias, ComponentClass);
  }
}
const wrap = document["getElementById"]("v2-wrap"),
  canvas = document["getElementById"]("v2-canvas"),
  debug = document["getElementById"]("v2-debug");
(installRendererEventBindingGuard(),
  initRenderer(wrap, canvas, appStore),
  initRendererUiEvents({ wrap: wrap, store: appStore }),
  initWebPreviewViewSyncService({ graphStore: graphStore, root: document }),
  initStoreRuntimeEffects(appStore),
  workspaceStore["setSubscriptionState"](createDefaultSubscriptionState()),
  (window["CanvasTabManager"] = CanvasTabManager),
  document["getElementById"]("btnAddCanvas")?.["addEventListener"](
    "click",
    () => CanvasTabManager["addCanvas"](),
  ),
  bootstrapAppProject({
    store: appStore,
    CanvasTabManager: CanvasTabManager,
    project: project,
    loadCustomPresets: loadCustomPresets,
    migrateLegacyThumbnailsInMultiData: migrateLegacyThumbnailsInMultiData,
    sanitizeMultiCanvasDataForPersistence:
      sanitizeMultiCanvasDataForPersistence,
    commit: commit,
    patchStoreSourceNodeNamesFromFileName:
      _v2PatchStoreSourceNodeNamesFromFileName,
    applySourceNamesFromFileNameToCanvas:
      _v2ApplySourceNamesFromFileNameToCanvas,
    uploadFile: uploadFile,
    getBaseName: getBaseName,
  }),
  initAppShellUi({
    store: graphStore,
    initMinimap: initMinimap,
    minimapEl: document["getElementById"]("minimap"),
    btnMinimapEl: document["getElementById"]("btnMinimap"),
    minimapWrapperEl: document["getElementById"]("minimapWrapper"),
    btnToggleDotsEl: document["getElementById"]("btnToggleDots"),
    applySnapGridEnabled: applySnapGridEnabled,
    readSnapGridEnabled: readSnapGridEnabled,
    applyGridDotsPrefFromStorage:
      SettingsManager["applyGridDotsPrefFromStorage"],
    showDevToast: showDevToast,
  }));
const appViewport = createAppViewport({
  graphStore: graphStore,
  uiStore: uiStore,
  wrap: wrap,
  debugEl: debug,
  zoomSliderEl: document["getElementById"]("zoomSlider"),
  zoomPercentEl: document["getElementById"]("zoomPercent"),
  fitActionEl: document["getElementById"]("btnFitAction"),
});
(appViewport["installWindowBindings"](window),
  import("./src/modules/AssetManager.js")["then"](({ assetManager: v3 }) => {}),
  import("./src/modules/workflows/WorkflowManager.js")["then"](
    ({ workflowManager: v4 }) => {},
  ),
  import("./src/modules/GenerationHistoryFileManager.js")["then"](
    ({ generationHistoryFileManager: v5 }) => {},
  ),
  initAppNodeEntry({
    graphStore: graphStore,
    wrap: wrap,
    btnAddEl: document["getElementById"]("btnAdd"),
    nodeMenuEl: document["getElementById"]("nodeMenu"),
    initCanvasContextMenu: initCanvasContextMenu,
    getNodeDefaultSize: getNodeDefaultSize,
    commit: commit,
  }));
const appCanvasPointerBindings = installAppCanvasPointerBindings({
  graphStore: graphStore,
  uiStore: uiStore,
  wrap: wrap,
  appViewport: appViewport,
  interaction: {
    getDragContext: getDragContext,
    handleContextMenu: handleContextMenu,
    handlePointerDown: handlePointerDown,
    handlePointerMove: handlePointerMove,
    handlePointerUp: handlePointerUp,
    handleWheel: handleWheel,
    initConnectionHandles: initConnectionHandles,
    initPickConnect: initPickConnect,
  },
});
function _v2GetDefaultNodeName(v6) {
  const v7 = String(v6 || "");
  if (v7["includes"]("image")) return "图片";
  if (v7["includes"]("video")) return "视频";
  if (v7["includes"]("audio")) return "音频";
  if (v7["includes"]("text")) return "文本";
  return "节点";
}
function _v2ApplySourceNameFromFileNameToNode(v8) {
  if (!v8 || !v8["type"]) return v8;
  if (!String(v8["type"])["startsWith"]("source-")) return v8;
  const v9 = getBaseName(v8["fileName"]);
  if (!v9) return v8;
  const v10 = _v2GetDefaultNodeName(v8["type"]);
  if (!v8["name"] || v8["name"] === v10) v8["name"] = v9;
  return v8;
}
function _v2ApplySourceNamesFromFileNameToCanvas(v11) {
  if (!v11 || !v11["nodes"]) return v11;
  if (Array["isArray"](v11["nodes"]))
    return (v11["nodes"]["forEach"](_v2ApplySourceNameFromFileNameToNode), v11);
  return (
    typeof v11["nodes"] === "object" &&
      Object["values"](v11["nodes"])["forEach"](
        _v2ApplySourceNameFromFileNameToNode,
      ),
    v11
  );
}
function _v2PatchStoreSourceNodeNamesFromFileName() {
  const v12 = graphStore["getState"](),
    v13 = v12?.["nodes"] || {};
  Object["keys"](v13)["forEach"]((v14) => {
    const v15 = v13[v14];
    if (!v15 || !v15["type"] || !String(v15["type"])["startsWith"]("source-"))
      return;
    const v16 = getBaseName(v15["fileName"]);
    if (!v16) return;
    const v17 = _v2GetDefaultNodeName(v15["type"]);
    if (!v15["name"] || v15["name"] === v17) graphStore["renameNode"](v14, v16);
  });
}
(wrap["addEventListener"]("dragover", (v18) => {
  v18["preventDefault"]();
}),
  wrap["addEventListener"]("drop", async (v19) => {
    const v20 = window["currentProjectId"] || "default_v2_project",
      v21 = await handleFileDrop(v19, v20);
    if (v21) {
      commit();
      return;
    }
    const v22 = await handleWebImageUrlDrop(v19);
    v22 && commit();
  }));
const appCanvasNodeFlows = createAppCanvasNodeFlows({
  graphStore: graphStore,
  commit: commit,
  getCursorScreenPosition: appCanvasPointerBindings["getCursorScreenPosition"],
  getNodeDefaultSize: getNodeDefaultSize,
  getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType,
  getAIGenerationNodeSize: getAIGenerationNodeSize,
  createPanoramaNodeDataByType: createSpecialNodeDataByType,
  processFile: processFile,
  executeCommand: executeCommand,
  getCurrentProjectId: () => window["currentProjectId"],
  showToast: (...v23) => window["showToast"]?.(...v23),
});
function createBlobFromBase64(v24, v25 = "image/png") {
  const v26 = atob(String(v24 || "")),
    v27 = [];
  for (let v28 = 0; v28 < v26["length"]; v28 += 8192) {
    const v29 = v26["slice"](v28, v28 + 8192),
      v30 = new Uint8Array(v29["length"]);
    for (let v31 = 0; v31 < v29["length"]; v31 += 1) {
      v30[v31] = v29["charCodeAt"](v31);
    }
    v27["push"](v30);
  }
  return new Blob(v27, { type: v25 });
}
function installGlobalScreenshotBridge() {
  const v32 = window["electronAPI"]?.["screenshot"];
  (v32?.["onGlobalCapture"]?.(async (v33 = {}) => {
    try {
      const v34 = String(v33?.["pngBase64"] || "")["trim"]();
      if (!v34) return;
      const v35 = String(v33?.["mimeType"] || "image/png") || "image/png",
        v36 = createBlobFromBase64(v34, v35),
        v37 = await appCanvasNodeFlows["createMediaNodeFromBlob"](v36, v35, {
          name: "全局截图",
          placement: "viewport-center-sequence",
          sequenceKey: "global-screenshot",
        });
      v37
        ? window["showToast"]?.("截图已添加到画布", "success")
        : window["showToast"]?.("截图回填失败", "error");
    } catch (v38) {
      (console["error"](
        "[screenshot]\x20failed\x20to\x20import\x20global\x20capture",
        v38,
      ),
        window["showToast"]?.("截图回填失败", "error"));
    }
  }),
    v32?.["onGlobalShortcutStatus"]?.((v39 = {}) => {
      if (
        v39?.["registered"] === false &&
        v39?.["reason"] === "registration-failed"
      ) {
        window["showToast"]?.(
          "全局 Alt+Q 注册失败，仍可在应用内使用 Alt+Q",
          "warn",
        );
        return;
      }
      v39?.["registered"] === true &&
        v39?.["ok"] === false &&
        window["showToast"]?.(
          "全局截图失败，请检查屏幕录制权限或稍后重试",
          "error",
        );
    }));
}
installGlobalScreenshotBridge();
const appBusinessEvents = createAppBusinessEvents({
  store: appStore,
  wrap: wrap,
  addShortcutListener: addShortcutListener,
  executeCommand: executeCommand,
  undo: undo,
  redo: redo,
  commit: commit,
  closeShortcuts: closeShortcuts,
  getNodeDefaultSize: getNodeDefaultSize,
  getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType,
  createNodeAtCursor: appCanvasNodeFlows["createNodeAtCursor"],
  createImageNodeFromBlob: appCanvasNodeFlows["createMediaNodeFromBlob"],
  animateViewport: appViewport["animateViewport"],
  focusNodeAtZoomPercent: appViewport["focusNodeAtZoomPercent"],
  focusNodes: appViewport["focusNodes"],
  clearTrackedFocus: appViewport["clearTrackedFocus"],
  handlePasteFromClipboard: appCanvasNodeFlows["handlePasteFromClipboard"],
  initCanvasContextMenu: initCanvasContextMenu,
  ImageAnnotateController: ImageAnnotateController,
  ImageMattingController: ImageMattingController,
  AudioClipController: AudioClipController,
});
appBusinessEvents["bindAll"]();
const appTopbarAndConfig = createAppTopbarAndConfig({
  store: appStore,
  fetchApiConfigFromServer: fetchApiConfigFromServer,
  saveApiConfigToServer: saveApiConfigToServer,
  testProviderConnections: testProviderConnections,
  fetchDreaminaCliStatusFromServer: fetchDreaminaCliStatusFromServer,
  startDreaminaHeadlessLoginFromServer: startDreaminaHeadlessLoginFromServer,
  startDreaminaHeadlessReloginFromServer:
    startDreaminaHeadlessReloginFromServer,
  startDreaminaWebLoginFromServer: startDreaminaWebLoginFromServer,
  importDreaminaLoginResponseFromServer: importDreaminaLoginResponseFromServer,
  logoutDreaminaFromServer: logoutDreaminaFromServer,
  buildDreaminaQrImageUrl: buildDreaminaQrImageUrl,
  showError: showError,
});
appTopbarAndConfig["init"]();
const appPanels = createAppPanels({
  store: appStore,
  setTextWithLineBreaks: setTextWithLineBreaks,
  getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType,
  createDefaultSubscriptionState: createDefaultSubscriptionState,
  isModelAllowed: isModelAllowed,
  isSubscriptionActive: isSubscriptionActive,
  isActivationRequestAccepted: isActivationRequestAccepted,
  normalizeSubscriptionPayload: normalizeSubscriptionPayload,
  ensureInstallId: ensureInstallId,
  pullSubscriptionState: pullSubscriptionState,
  submitCdkey: submitCdkey,
  clearSubscriptionAuthorization: clearSubscriptionAuthorization,
  DEFAULT_VIP_GATE_MODEL_ID: DEFAULT_VIP_GATE_MODEL_ID,
  getVipModelDisplayName: getVipModelDisplayName,
});
(appPanels["init"](),
  CanvasProjectDropdownManager["init"](),
  SettingsManager["init"]({ uiStore: uiStore }),
  MascotManager["init"](),
  initAutoUpdate());
