import appStore from "../../core/stores/appStore.js";
import { generateId } from "../../core/math.js";
import { submitTask } from "../../core/generationTaskRuntime.js";
import ImageCropController from "../../modules/ImageCropController.js";
import ImageAnnotateController from "../../modules/ImageAnnotateController.js";
import ImageExpandController from "../../modules/ImageExpandController.js";
import ImageFreeAngleController, {
  createRunningHubTaskStateMachine,
} from "../../modules/ImageFreeAngleController.js";
import ImageMattingController from "../../modules/ImageMattingController.js";
import VideoClipController from "../../modules/VideoClipController.js";
import VideoKeyingController from "../../modules/VideoKeyingController.js";
import { openNodeImagePreview } from "../../modules/imagePreview.js";
import { getImage } from "../../modules/storage.js";
import { showError, showWarning } from "../../services/index.js";
import { buildSourceMediaNodePayload } from "../../services/fileService.js";
import { resolveCanvasImagePreviewUrl } from "../../services/canvasMediaLocalService.js";
import { localPathToUrl } from "../../utils/localMediaPath.js";
import {
  buildImageGenerationFailurePatch,
  buildImageGenerationResultPatch,
} from "../aigenImage/imageGenerationResultRenderer.js";
import {
  buildStoryboardNodePayload,
  computePreparedStoryboardSize,
  resolveNearestStoryboardAspect,
} from "../../core/storyboardFactory.js";
import { calcDisplaySizeByMedia } from "../../services/mediaRatioService.js";
import { registerStaticInnerHTML } from "../../utils/dom.js";
import {
  fetchRemoteBlob,
  saveOutputToServer,
} from "../../../api/projectsV2Api.js";
import { resumeRunningHubImageTask } from "../../../api/aiImageApi.js";
import {
  runRunninghubAiApp,
  runRunninghubWorkflow,
  resumeRunninghubWorkflowTask,
} from "../../../api/runninghubWorkflowApi.js";
import { processInputVideos } from "../../../api/videoUploadApi.js";
import { buildApiUrl } from "../../../api/apiBase.js";
import { processInputImages } from "../../../api/imageUploadApi.js";
import { getProviderConfig, ensureConfig } from "../../../api/configApi.js";
import { calcSafeSpawnPosNearNode } from "../../modules/nodeSpawn.js";
import { executeCommand } from "../../core/interaction.js";
import { commit } from "../../modules/history.js";
import { IMAGE_TOOLBAR_HTML } from "./imageToolbarHtml.js";
import { showDevToast } from "./toolbarShared.js";
import { bindImageToolbarLayoutUi } from "./imageToolbarLayoutUi.js";
import {
  bindRunningHubToolbarTaskButton,
  cancelRunningHubRemoteTaskQuietly,
  cancelRunningHubResultTask,
  findRunningHubToolbarTaskForNode,
  isRunningHubToolbarTaskCancelled,
  notifyRunningHubToolbarTasksChanged,
} from "./runningHubToolbarTaskButton.js";
import {
  IMAGE_TOOLBAR_ACTIONS,
  normalizeImageToolbarLayout,
  serializeImageToolbarLayout,
} from "../../modules/imageToolbarLayoutMemory.js";
import {
  executeGridCrop,
  prepareGridCells,
} from "../../modules/imageToolbarGridCrop.js";
import {
  buildToolbarImageFields,
  saveOutputImageResult,
  saveRemoteImageResultLocally,
} from "../../modules/imageToolbarOutputActions.js";
import {
  extractFirstImageUrl,
  parseRhCode,
  parseRhTaskId,
  resolveApiInputRatioBasis,
  resolveFinalResultDisplaySize,
} from "../../modules/imageToolbarHelpers.js";
import { bindImageAnnotateCloneActions } from "./imageActions/annotateCloneAction.js";
import { bindImageMattingAction } from "./imageActions/mattingAction.js";
import { bindImageAutoSubjectAction } from "./imageActions/autoSubjectAction.js";
import { bindImagePanorama360Action } from "./imageActions/panorama360Action.js";
import { bindImageHdAction } from "./imageActions/hdAction.js";
import { bindImageCropAction } from "./imageActions/cropAction.js";
import { bindImageExpandAction } from "./imageActions/expandAction.js";
import { bindImageAnnotateAction } from "./imageActions/annotateAction.js";
import { bindImageFreeAngleAction } from "./imageActions/freeAngleAction.js";
import { bindImageMultigridAction } from "./imageActions/multigridAction.js";
import { bindImageDownloadAction } from "./imageActions/downloadAction.js";
import { bindImageFullscreenAction } from "./imageActions/fullscreenAction.js";
import { bindImageResetSizeAction } from "./imageActions/resetSizeAction.js";
import { bindApimartPrivateAvatarAction } from "./apimartPrivateAvatarAction.js";
const getStateSnapshot = () =>
  typeof appStore["getStateRaw"] === "function"
    ? appStore["getStateRaw"]()
    : appStore["getState"]();
function createViewportSnapshotTracker() {
  let v0 = getStateSnapshot()["viewport"] || {},
    v1 =
      typeof appStore["subscribeSelector"] === "function"
        ? appStore["subscribeSelector"](
            (v2) => v2["viewport"],
            (v3) => {
              v0 = v3 || {};
            },
          )
        : null;
  return {
    openedViewport: { ...v0 },
    getViewport: () => v0,
    dispose: () => {
      (v1?.(), (v1 = null));
    },
  };
}
const TOOLBAR_TASK_CANCELLED_MESSAGE = "任务已取消",
  IMAGE_LOCAL_SAVE_FAILURE_MESSAGE = "已生成但本地保存失败";
function createToolbarCancelledError() {
  const v4 = new Error(TOOLBAR_TASK_CANCELLED_MESSAGE);
  return ((v4["name"] = "AbortError"), v4);
}
function isToolbarCancelledError(v5) {
  const v6 = String(v5?.["message"] || v5 || "");
  return (
    v5?.["name"] === "AbortError" ||
    v6 === TOOLBAR_TASK_CANCELLED_MESSAGE ||
    v6 === "CANCELLED" ||
    v6["toLowerCase"]()["includes"]("aborted")
  );
}
function createLocalSaveFailureError() {
  const v7 = new Error(IMAGE_LOCAL_SAVE_FAILURE_MESSAGE);
  return ((v7["isLocalSaveFailure"] = true), v7);
}
function isLocalSaveFailure(v8) {
  return (
    v8?.["isLocalSaveFailure"] === true ||
    String(v8?.["message"] || v8 || "") === IMAGE_LOCAL_SAVE_FAILURE_MESSAGE
  );
}
function throwIfToolbarTaskCancelled(v9) {
  if (isRunningHubToolbarTaskCancelled(v9)) throw createToolbarCancelledError();
}
function focusToolbarTaskNodes(v10, v11) {
  (appStore["setSelectedNodes"]([v11]),
    typeof window["v2FocusOnNodes"] === "function"
      ? window["v2FocusOnNodes"]([v10, v11])
      : window["v2FocusOnNode"]?.(v11));
}
function notifyImageToolbarTaskChange({
  sourceNodeId: v12,
  targetNodeId: v13,
}) {
  (notifyRunningHubToolbarTasksChanged({ sourceNodeId: v12, outId: v13 }),
    window["_triggerLocalCacheSave"]?.());
}
function buildClearedImageMediaFields() {
  return { imageUrl: "", sourceUrl: "", thumbUrl: "", src: "", localPath: "" };
}
export { IMAGE_TOOLBAR_HTML };
registerStaticInnerHTML("toolbar:image", IMAGE_TOOLBAR_HTML);
function getToolbarActionFromButton(v14) {
  if (!v14?.["classList"]) return "";
  for (const v15 of v14["classList"]) {
    if (!v15["startsWith"]("act-")) continue;
    const v16 = v15["slice"](4);
    if (IMAGE_TOOLBAR_ACTIONS["includes"](v16)) return v16;
  }
  return "";
}
export function bindImageToolbarEvents(v17, v18) {
  if (!v17) return;
  const v19 = typeof v18 === "string" ? v18 : v18?.["id"];
  if (!v19) return;
  const v20 = () =>
    getStateSnapshot()["nodes"]?.[v19] ||
    (typeof v18 === "object" ? v18 : null);
  (v17["addEventListener"]("pointerdown", (v21) => v21["stopPropagation"]()),
    v17["addEventListener"]("dblclick", (v22) => {
      (v22["preventDefault"](), v22["stopPropagation"]());
    }));
  const v23 = bindImageToolbarLayoutUi(v17, {
      store: appStore,
      getStateSnapshot: getStateSnapshot,
      imageToolbarActions: IMAGE_TOOLBAR_ACTIONS,
      normalizeImageToolbarLayout: normalizeImageToolbarLayout,
      serializeImageToolbarLayout: serializeImageToolbarLayout,
      getToolbarActionFromButton: getToolbarActionFromButton,
    }),
    v24 = createRunningHubTaskStateMachine(),
    v25 = v24["state"],
    v26 = {
      toolbarEl: v17,
      nodeId: v19,
      mediaKind: "image",
      getNodeData: v20,
      getStateSnapshot: getStateSnapshot,
      _hdTaskMachine: v24,
      _hdState: v25,
      store: appStore,
      generateId: generateId,
      submitTask: submitTask,
      ImageCropController: ImageCropController,
      ImageAnnotateController: ImageAnnotateController,
      ImageExpandController: ImageExpandController,
      ImageMattingController: ImageMattingController,
      openNodeImagePreview: openNodeImagePreview,
      getImage: getImage,
      buildSourceMediaNodePayload: buildSourceMediaNodePayload,
      resolveCanvasImagePreviewUrl: resolveCanvasImagePreviewUrl,
      localPathToUrl: localPathToUrl,
      buildImageGenerationFailurePatch: buildImageGenerationFailurePatch,
      buildImageGenerationResultPatch: buildImageGenerationResultPatch,
      buildStoryboardNodePayload: buildStoryboardNodePayload,
      computePreparedStoryboardSize: computePreparedStoryboardSize,
      resolveNearestStoryboardAspect: resolveNearestStoryboardAspect,
      calcDisplaySizeByMedia: calcDisplaySizeByMedia,
      fetchRemoteBlob: fetchRemoteBlob,
      resumeRunningHubImageTask: resumeRunningHubImageTask,
      runRunninghubAiApp: runRunninghubAiApp,
      runRunninghubWorkflow: runRunninghubWorkflow,
      resumeRunninghubWorkflowTask: resumeRunninghubWorkflowTask,
      processInputImages: processInputImages,
      getProviderConfig: getProviderConfig,
      ensureConfig: ensureConfig,
      calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
      executeCommand: executeCommand,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
      cancelRunningHubRemoteTaskQuietly: cancelRunningHubRemoteTaskQuietly,
      cancelRunningHubResultTask: cancelRunningHubResultTask,
      findRunningHubToolbarTaskForNode: findRunningHubToolbarTaskForNode,
      isRunningHubToolbarTaskCancelled: isRunningHubToolbarTaskCancelled,
      executeGridCrop: executeGridCrop,
      prepareGridCells: prepareGridCells,
      buildToolbarImageFields: buildToolbarImageFields,
      saveOutputImageResult: saveOutputImageResult,
      saveRemoteImageResultLocally: saveRemoteImageResultLocally,
      extractFirstImageUrl: extractFirstImageUrl,
      parseRhCode: parseRhCode,
      parseRhTaskId: parseRhTaskId,
      resolveApiInputRatioBasis: resolveApiInputRatioBasis,
      resolveFinalResultDisplaySize: resolveFinalResultDisplaySize,
      createViewportSnapshotTracker: createViewportSnapshotTracker,
      createToolbarCancelledError: createToolbarCancelledError,
      isToolbarCancelledError: isToolbarCancelledError,
      createLocalSaveFailureError: createLocalSaveFailureError,
      isLocalSaveFailure: isLocalSaveFailure,
      throwIfToolbarTaskCancelled: throwIfToolbarTaskCancelled,
      focusToolbarTaskNodes: focusToolbarTaskNodes,
      notifyImageToolbarTaskChange: notifyImageToolbarTaskChange,
      buildClearedImageMediaFields: buildClearedImageMediaFields,
      IMAGE_LOCAL_SAVE_FAILURE_MESSAGE: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
    };
  (bindImageAnnotateCloneActions(v26),
    bindImageMattingAction(v26),
    bindImageAutoSubjectAction(v26),
    bindImagePanorama360Action(v26),
    bindApimartPrivateAvatarAction(v26),
    bindImageHdAction(v26),
    bindImageCropAction(v26),
    bindImageExpandAction(v26),
    bindImageAnnotateAction(v26),
    bindImageFreeAngleAction(v26),
    bindImageMultigridAction(v26),
    bindImageDownloadAction(v26),
    bindImageFullscreenAction(v26),
    bindImageResetSizeAction(v26));
}
