import appStore from "../core/stores/appStore.js";
import {
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from "../services/fileService.js";
import {
  captureVideoFrameSnapshot,
  getVideoFrameSource,
  isVideoFrameReady,
  saveVideoFrameSnapshot,
  waitForVideoFrame,
} from "../components/videoFrameCapture.js";
import { saveOutputBlob } from "./project.js";
import { calcSafeSpawnPosNearNode } from "./nodeSpawn.js";
function getToast(v0) {
  if (typeof v0 === "function") return v0;
  return globalThis["window"]?.["showToast"];
}
function createCapturePreviewUrl(v1) {
  const v2 = globalThis["window"]?.["URL"] || globalThis["URL"];
  if (!v1 || typeof v2?.["createObjectURL"] !== "function") return "";
  try {
    return v2["createObjectURL"](v1);
  } catch {
    return "";
  }
}
export function resolveVideoFrameCaptureIndex(
  v3,
  {
    currentTimeSec: currentTimeSec = 0,
    fallbackDurationSec: fallbackDurationSec = 0,
  } = {},
) {
  const v4 = Number(v3?.["videoFps"]),
    v5 = Number(v3?.["videoFrameCount"]),
    v6 = Number(v3?.["videoDuration"]),
    v7 = Number["isFinite"](v6) && v6 > 0 ? v6 : Number(fallbackDurationSec),
    v8 =
      Number["isFinite"](v4) && v4 > 0
        ? v4
        : Number["isFinite"](v5) && v5 > 0 && Number["isFinite"](v7) && v7 > 0
          ? v5 / v7
          : 0;
  if (Number["isFinite"](v8) && v8 > 0) {
    let v9 =
      Math["floor"](Math["max"](0, Number(currentTimeSec) || 0) * v8) + 1;
    return (
      Number["isFinite"](v5) && v5 > 0
        ? (v9 = Math["max"](1, Math["min"](Math["round"](v5), v9)))
        : (v9 = Math["max"](1, v9)),
      { frameIndex: v9, nextSnapSeq: null, usedSequence: false }
    );
  }
  const v10 = Math["max"](1, Math["floor"](Number(v3?.["snapSeq"]) || 0) + 1);
  return { frameIndex: v10, nextSnapSeq: v10, usedSequence: true };
}
export async function extractCurrentVideoFrameToImageNode({
  videoEl: v11,
  anchorNodeId: v12,
  fallbackDurationSec: fallbackDurationSec = 0,
  fileNamePrefix: fileNamePrefix = "source_video_frame",
  onMissingMetadata: v13,
  logPrefix: logPrefix = "[VideoFrameExtraction]",
  showToast: v14,
} = {}) {
  const v15 = getToast(v14),
    v16 = v11;
  if (!v16 || !getVideoFrameSource(v16))
    return (
      v15?.("当前视频还未加载完成", "info"),
      { ok: false, reason: "video-not-loaded" }
    );
  if (!isVideoFrameReady(v16)) {
    const v17 = await waitForVideoFrame(v16);
    if (!v17)
      return (
        v15?.("当前视频还未加载完成", "info"),
        { ok: false, reason: "frame-not-ready" }
      );
  }
  const v18 = Number(v16["videoWidth"]) || 0,
    v19 = Number(v16["videoHeight"]) || 0;
  if (!v18 || !v19) return { ok: false, reason: "missing-size" };
  let v20 = null;
  try {
    v20 = await captureVideoFrameSnapshot(v16, {
      fileNamePrefix: fileNamePrefix,
    });
  } catch (v21) {
    return (
      console["warn"](logPrefix + " capture frame failed:", v21),
      v15?.("当前视频源暂不支持截帧", "error"),
      { ok: false, reason: "capture-failed", error: v21 }
    );
  }
  if (!v20?.["blob"]) return { ok: false, reason: "missing-blob" };
  const v22 = String(v12 || "")["trim"](),
    v23 = appStore["getState"]()["nodes"] || {},
    v24 = v23[v22];
  if (!v24) return { ok: false, reason: "missing-anchor-node" };
  const {
    frameIndex: v25,
    nextSnapSeq: v26,
    usedSequence: v27,
  } = resolveVideoFrameCaptureIndex(v24, {
    currentTimeSec: Number(v16["currentTime"]) || 0,
    fallbackDurationSec: fallbackDurationSec,
  });
  if (v26) {
    appStore["updateNodeData"](v22, { snapSeq: v26 });
    if (typeof v13 === "function") v13(v24);
  }
  const v28 = getAutoMediaSizeByShortSide(v18, v19),
    v29 = calcSafeSpawnPosNearNode(
      appStore["getState"]()["nodes"],
      v24,
      v28["width"],
      v28["height"],
    ),
    v30 = "src-img-" + Date["now"](),
    v31 = createCapturePreviewUrl(v20["blob"]);
  return (
    appStore["addNode"](
      buildSourceMediaNodePayload({
        id: v30,
        type: "source-image",
        name: "截取第" + v25 + "帧",
        capturePreviewUrl: v31,
        captureSavePending: true,
        captureSaveError: null,
        originalWidth: v20["originalWidth"],
        originalHeight: v20["originalHeight"],
        fileName: v20["fileName"],
        x: v29["x"],
        y: v29["y"],
        width: v28["width"],
        height: v28["height"],
        needsAutoResize: false,
      }),
    ),
    saveVideoFrameSnapshot(v20, saveOutputBlob)
      ["then"]((v32) => {
        if (!appStore["getStateRaw"]()["nodes"]?.[v30]) return;
        appStore["updateNodeData"](v30, {
          src: v32["src"],
          localPath: v32["localPath"],
          originalLocalPath: v32["originalLocalPath"],
          displayLocalPath: v32["displayLocalPath"],
          thumbLocalPath: v32["thumbLocalPath"],
          originalWidth: v32["originalWidth"],
          originalHeight: v32["originalHeight"],
          fileName: v32["fileName"],
          captureSavePending: false,
          captureSaveError: null,
        });
      })
      ["catch"]((v33) => {
        const v34 = String(v33?.["message"] || "本地保存失败");
        (console["warn"](
          logPrefix + "\x20save\x20captured\x20frame\x20failed:",
          v33,
        ),
          appStore["getStateRaw"]()["nodes"]?.[v30] &&
            appStore["updateNodeData"](v30, {
              captureSavePending: false,
              captureSaveError: v34,
            }),
          v15?.("截图已显示，但本地保存失败", "warning"));
      }),
    { ok: true, nodeId: v30, frameIndex: v25, usedSequence: v27 }
  );
}
