import appStore from "../core/stores/appStore.js";
import {
  buildCanvasLocalAudioFields,
  buildCanvasLocalImageFields,
  buildCanvasLocalVideoFields,
  assertCanvasMediaPatchLocalOnly,
  normalizeCanvasLocalPath,
  toCanvasLocalUrl,
} from "../services/canvasMediaLocalService.js";
import { stopPreviewNodeLoading } from "./previewMode.js";
import { buildImageGenerationResultPatch } from "../components/aigenImage/imageGenerationResultRenderer.js";
import { buildLocalAudioGenerationResultPatch } from "../components/audio-node/audioGenerationResultRenderer.js";
import { buildVideoGenerationResultPatch } from "../components/video-node/videoGenerationResultRenderer.js";
function normalizeText(v0) {
  return String(v0 || "")["trim"]();
}
function resolveRequiredLocalUrl(v1 = {}, v2 = "媒体") {
  const v3 = normalizeCanvasLocalPath(
      v1?.["localPath"] || v1?.["originalLocalPath"] || v1?.["url"] || "",
    ),
    v4 = toCanvasLocalUrl(v3);
  if (!v4) throw new Error("上传结果无效：缺少" + v2 + "本地路径");
  return { localPath: v3, localUrl: v4 };
}
function resolveFileName(v5 = {}, v6 = "") {
  return (
    normalizeText(v5?.["filename"]) ||
    normalizeText(v5?.["fileName"]) ||
    normalizeText(v6)
  );
}
function buildCommonSuccessPatch(v7 = Date["now"]()) {
  return {
    generationStartTime: v7,
    generationDuration: 0,
    rhStatusMessage: null,
    rhStatusCode: null,
  };
}
function buildImageTaskResetPatch() {
  return {
    rhTaskId: "",
    rhTaskStatus: "idle",
    rhTaskStartedAt: 0,
    rhTaskRecovering: false,
    rhTaskUseOpenapiQuery: false,
    dreaminaSubmitId: "",
    dreaminaTaskStatus: "idle",
    dreaminaTaskPhase: "done",
    dreaminaTaskLabel: "",
    dreaminaTaskStartedAt: 0,
    dreaminaTaskLastCheckedAt: null,
    dreaminaTaskLastRaw: {},
    dreaminaTaskRecovering: false,
    asyncTaskProvider: "",
    asyncTaskKind: "image",
    asyncTaskId: "",
    asyncTaskStatus: "idle",
    asyncTaskStartedAt: 0,
    asyncTaskRecovering: false,
  };
}
function buildVideoTaskResetPatch() {
  return {
    rhTaskId: "",
    rhTaskStatus: "idle",
    rhTaskStartedAt: 0,
    rhTaskRecovering: false,
    rhTaskUseOpenapiQuery: false,
    asyncTaskProvider: "",
    asyncTaskKind: "video",
    asyncTaskId: "",
    asyncTaskStatus: "idle",
    asyncTaskStartedAt: 0,
    asyncTaskRecovering: false,
    dreaminaSubmitId: "",
    dreaminaTaskStatus: "idle",
    dreaminaTaskPhase: "done",
    dreaminaTaskLabel: "",
    dreaminaTaskStartedAt: 0,
    dreaminaTaskLastCheckedAt: null,
    dreaminaTaskLastRaw: {},
    dreaminaTaskRecovering: false,
  };
}
function buildAudioTaskResetPatch() {
  return {
    rhTaskId: "",
    rhTaskStatus: "idle",
    rhTaskStartedAt: 0,
    rhTaskRecovering: false,
    rhTaskUseOpenapiQuery: false,
  };
}
export function applyUploadedPreviewImageResult({
  nodeId: v8,
  uploadRes: v9,
  fileName: fileName = "",
} = {}) {
  const v10 = normalizeText(v8);
  if (!v10) throw new Error("上传结果无效：缺少节点 ID");
  resolveRequiredLocalUrl(v9, "图片");
  const v11 = Date["now"](),
    v12 = resolveFileName(v9, fileName),
    v13 = {
      ...buildCanvasLocalImageFields(
        { ...v9, fileName: v12 },
        { includeSrc: false },
      ),
    };
  (assertCanvasMediaPatchLocalOnly(v13), stopPreviewNodeLoading(v10));
  const v14 = {
    ...buildImageGenerationResultPatch(
      { outputType: "image", items: [v13] },
      { duration: 0 },
    ),
    fileName: v12,
    ...buildCommonSuccessPatch(v11),
    ...buildImageTaskResetPatch(),
  };
  (assertCanvasMediaPatchLocalOnly(v14), appStore["updateNodeData"](v10, v14));
}
export function applyUploadedPreviewVideoResult({
  nodeId: v15,
  uploadRes: v16,
  fileName: fileName = "",
} = {}) {
  const v17 = normalizeText(v15);
  if (!v17) throw new Error("上传结果无效：缺少节点 ID");
  resolveRequiredLocalUrl(v16, "视频");
  const v18 = Date["now"](),
    v19 = resolveFileName(v16, fileName),
    v20 = buildCanvasLocalVideoFields(
      { ...v16, fileName: v19 },
      { includeCanonicalUrl: false, includeResultUrl: false },
    );
  (assertCanvasMediaPatchLocalOnly(v20), stopPreviewNodeLoading(v17));
  const v21 = {
    ...buildVideoGenerationResultPatch(
      { outputType: "video", items: [v20] },
      { duration: 0 },
    ),
    thumbId: v20["thumbId"],
    fileName: v19,
    videoMetaSrc: "",
    videoFps: null,
    videoFrameCount: null,
    videoDuration: null,
    videoWidth: null,
    videoHeight: null,
    ...buildCommonSuccessPatch(v18),
    ...buildVideoTaskResetPatch(),
  };
  (assertCanvasMediaPatchLocalOnly(v21), appStore["updateNodeData"](v17, v21));
}
export function applyUploadedPreviewAudioResult({
  nodeId: v22,
  uploadRes: v23,
  fileName: fileName = "",
} = {}) {
  const v24 = normalizeText(v22);
  if (!v24) throw new Error("上传结果无效：缺少节点\x20ID");
  resolveRequiredLocalUrl(v23, "音频");
  const v25 = Date["now"](),
    v26 = resolveFileName(v23, fileName),
    v27 = {
      ...buildLocalAudioGenerationResultPatch(
        buildCanvasLocalAudioFields(
          { ...v23, fileName: v26 },
          { includeCanonicalUrl: false, includeResultUrl: false },
        ),
        { duration: 0 },
      ),
      fileName: v26,
      ...buildCommonSuccessPatch(v25),
      ...buildAudioTaskResetPatch(),
    };
  (assertCanvasMediaPatchLocalOnly(v27),
    stopPreviewNodeLoading(v24),
    appStore["updateNodeData"](v24, v27));
}
