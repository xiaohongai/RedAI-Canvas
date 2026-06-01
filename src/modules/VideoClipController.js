import appStore from "../core/stores/appStore.js";
import { findAvailablePosition, generateId } from "../core/math.js";
import { commit } from "./history.js";
import {
  calcSafeSpawnPosNearNode,
  calcSpawnStartFromAnchor,
  getNodeSpawnPrefs,
} from "./nodeSpawn.js";
import { requester } from "../../api/requester.js";
import {
  canUseElectronMediaTask,
  enqueueElectronMediaTask,
} from "../../api/localMediaTaskApi.js";
import { fetchVideoMetaFromServer } from "../../api/videoMetaApi.js";
import { fetchVideoFirstFrameThumbFromServer } from "../../api/videoThumbApi.js";
import {
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from "../services/fileService.js";
import { resolveCanvasVideoUrl } from "../services/canvasMediaLocalService.js";
import {
  localPathToUrl,
  pickResultLocalPath,
} from "../utils/localMediaPath.js";
import { attachDesktopMediaPlaybackSource } from "../services/desktopMediaBlobSource.js";
import { extractCurrentVideoFrameToImageNode } from "./videoFrameExtraction.js";
import {
  captureVideoFrameSnapshot,
  saveVideoFrameSnapshot,
  waitForVideoFrame,
} from "../components/videoFrameCapture.js";
import { playVideoWithRecovery } from "../components/video-node/mediaPlaybackRecovery.js";
import { saveOutputBlob } from "./project.js";
export function normalizeVideoCutResultLocalPath(v0) {
  return pickResultLocalPath(v0);
}
const SMART_CLIP_MIN_SEGMENTS = 2,
  SMART_CLIP_MAX_SEGMENTS = 25,
  SMART_CLIP_DEFAULT_SEGMENTS = 20,
  SMART_CLIP_FPS_OPTIONS = Object["freeze"]([16, 24, 30]),
  SMART_CLIP_DEFAULT_FPS = 24,
  SMART_CLIP_OUTPUT_MODE_SEGMENTS = "videoSegments",
  SMART_CLIP_OUTPUT_MODE_KEYFRAMES = "keyframes",
  SMART_CLIP_DEFAULT_OUTPUT_MODE = SMART_CLIP_OUTPUT_MODE_SEGMENTS,
  SMART_CLIP_MODE_OPTIONS = Object["freeze"]([
    "stable",
    "balanced",
    "sensitive",
  ]),
  SMART_CLIP_IMAGE_EXT_RE = /\.(?:png|jpe?g|webp|bmp|gif)(?:[?#]|$)/i,
  VIDEO_CLIP_SEEK_EPSILON_SEC = 0.035,
  VIDEO_CLIP_PLAY_SEEK_TIMEOUT_MS = 900;
export const SMART_CLIP_KEYFRAME_DEFAULT_OPTIONS = Object["freeze"]({
  mode: "stable",
  maxSegments: SMART_CLIP_DEFAULT_SEGMENTS,
  fps: SMART_CLIP_DEFAULT_FPS,
  outputMode: SMART_CLIP_OUTPUT_MODE_KEYFRAMES,
});
export function normalizeSmartClipMaxSegments(v1) {
  const v2 = Number(v1),
    v3 = Number["isFinite"](v2)
      ? Math["round"](v2)
      : SMART_CLIP_DEFAULT_SEGMENTS;
  return Math["max"](
    SMART_CLIP_MIN_SEGMENTS,
    Math["min"](SMART_CLIP_MAX_SEGMENTS, v3),
  );
}
export function normalizeSmartClipFps(v4) {
  const v5 = Number(v4),
    v6 = Number["isFinite"](v5) ? Math["round"](v5) : SMART_CLIP_DEFAULT_FPS;
  return SMART_CLIP_FPS_OPTIONS["includes"](v6) ? v6 : SMART_CLIP_DEFAULT_FPS;
}
export function normalizeSmartClipOutputMode(v7) {
  const v8 = String(v7 || "")["trim"]();
  return v8 === SMART_CLIP_OUTPUT_MODE_KEYFRAMES
    ? SMART_CLIP_OUTPUT_MODE_KEYFRAMES
    : SMART_CLIP_DEFAULT_OUTPUT_MODE;
}
function normalizeSmartClipMode(v9) {
  const v10 = String(v9 || "")
    ["trim"]()
    ["toLowerCase"]();
  return SMART_CLIP_MODE_OPTIONS["includes"](v10) ? v10 : "stable";
}
function normalizeSmartClipRunOptions(v11 = {}) {
  const v12 = v11 && typeof v11 === "object" ? v11 : {};
  return {
    mode: normalizeSmartClipMode(v12["mode"]),
    maxSegments: normalizeSmartClipMaxSegments(v12["maxSegments"]),
    fps: normalizeSmartClipFps(v12["fps"]),
    outputMode: normalizeSmartClipOutputMode(v12["outputMode"]),
  };
}
export function isSmartClipImageResult(v13, v14 = pickResultLocalPath(v13)) {
  const v15 = String(v13?.["outputType"] || v13?.["type"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v16 = String(v13?.["mimeType"] || v13?.["contentType"] || "")
      ["trim"]()
      ["toLowerCase"]();
  return (
    v15 === "image" ||
    v16["startsWith"]("image/") ||
    SMART_CLIP_IMAGE_EXT_RE["test"](
      String(v14 || v13?.["url"] || v13?.["path"] || ""),
    )
  );
}
function resolveSmartClipResultUrl(v17, v18) {
  return (
    localPathToUrl(v18) ||
    String(v17?.["url"] || v17?.["src"] || v17?.["imageUrl"] || "")["trim"]()
  );
}
function getWindowTimer(v19) {
  const v20 = globalThis["window"]?.[v19] || globalThis[v19];
  return typeof v20 === "function"
    ? v20["bind"](globalThis["window"] || globalThis)
    : null;
}
function waitForSmartClipVideoEvent(v21, v22, v23 = 10000) {
  const v24 = getWindowTimer("setTimeout"),
    v25 = getWindowTimer("clearTimeout");
  if (!v21 || typeof v24 !== "function") return Promise["resolve"](false);
  return new Promise((v26) => {
    let v27 = false,
      v28 = null;
    const v29 = () => {
        for (const v30 of v22) {
          v21["removeEventListener"]?.(v30, v31);
        }
        (v21["removeEventListener"]?.("error", v32),
          v21["removeEventListener"]?.("abort", v32));
        if (v28 && typeof v25 === "function") v25(v28);
      },
      v33 = (v34) => {
        if (v27) return;
        ((v27 = true), v29(), v26(v34 === true));
      },
      v31 = () => v33(true),
      v32 = () => v33(false);
    for (const v35 of v22) {
      v21["addEventListener"]?.(v35, v31, { once: true });
    }
    (v21["addEventListener"]?.("error", v32, { once: true }),
      v21["addEventListener"]?.("abort", v32, { once: true }),
      (v28 = v24(() => v33(false), v23)));
  });
}
async function captureSmartClipVideoFirstFrame(v36, v37) {
  const v38 = globalThis["document"];
  if (!v38 || !v36) throw new Error("missing video url");
  const v39 = v38["createElement"]("video");
  ((v39["muted"] = true),
    (v39["playsInline"] = true),
    (v39["preload"] = "auto"),
    (v39["crossOrigin"] = "anonymous"),
    (v39["style"]["position"] = "fixed"),
    (v39["style"]["left"] = "-10000px"),
    (v39["style"]["top"] = "-10000px"),
    (v39["style"]["width"] = "1px"),
    (v39["style"]["height"] = "1px"),
    (v39["style"]["opacity"] = "0"),
    v38["body"]?.["appendChild"](v39));
  try {
    v39["src"] = v36;
    try {
      v39["load"]?.();
    } catch {}
    const v40 = await waitForVideoFrame(v39, { timeoutMs: 10000 });
    if (!v40) throw new Error("video\x20frame\x20is\x20not\x20ready");
    return (
      Number(v39["currentTime"] || 0) > 0.001 &&
        ((v39["currentTime"] = 0),
        await waitForSmartClipVideoEvent(v39, ["seeked", "timeupdate"], 5000)),
      await captureVideoFrameSnapshot(v39, { fileNamePrefix: v37 })
    );
  } finally {
    try {
      (v39["pause"]?.(), v39["removeAttribute"]?.("src"), v39["load"]?.());
    } catch {}
    v39["remove"]?.();
  }
}
async function extractSmartClipVideoResultFirstFrame(v41, v42, v43) {
  const v44 = resolveSmartClipResultUrl(v41, v42);
  if (!v44) throw new Error("missing\x20video\x20segment\x20url");
  const v45 = await captureSmartClipVideoFirstFrame(
    v44,
    "smart_clip_keyframe_" + (v43 + 1),
  );
  return saveVideoFrameSnapshot(v45, saveOutputBlob);
}
function emitSmartClipProgress(v46, v47) {
  if (typeof v46 !== "function") return;
  try {
    v46(v47);
  } catch {}
}
function getSmartClipStageText(v48) {
  if (v48 === "detect") return "分析中";
  if (v48 === "cut") return "裁剪中";
  if (v48 === "frame") return "提帧中";
  return "处理中";
}
function buildSmartClipProgressPayload(v49 = {}) {
  const v50 = Math["max"](0, Math["min"](1, Number(v49["progress"] || 0))),
    v51 = Math["round"](v50 * 100),
    v52 = Number(v49["doneCount"] || 0),
    v53 = Number(v49["total"] || 0),
    v54 = String(v49["stage"] || ""),
    v55 = getSmartClipStageText(v54);
  return {
    stage: v54,
    stageText: v55,
    progress: v50,
    pct: v51,
    doneCount: v52,
    total: v53,
    text:
      v53 > 0
        ? v55 + "\x20" + v52 + "/" + v53 + "\x20(" + v51 + "%)"
        : v55 + "\x20(" + v51 + "%)",
  };
}
function pickPositiveNumber(...v56) {
  for (const v57 of v56) {
    const v58 = Number(v57);
    if (Number["isFinite"](v58) && v58 > 0) return v58;
  }
  return 0;
}
function pickSelectedVideoItem(v59) {
  const v60 = Array["isArray"](v59?.["videos"]) ? v59["videos"] : [];
  if (!v60["length"]) return null;
  const v61 = Number(v59?.["mainVideoIndex"]),
    v62 = Number["isFinite"](v61) ? Math["max"](0, Math["trunc"](v61)) : 0;
  return v60[Math["min"](v62, v60["length"] - 1)] || v60[0] || null;
}
const DIRECT_VIDEO_SOURCE_RE = /^(?:https?:|blob:|data:)/i,
  BLOCKED_VIDEO_SOURCE_RE = /^(?:file|javascript):/i;
function normalizeDirectVideoSource(v63) {
  const v64 = String(v63 || "")["trim"]();
  if (!v64 || BLOCKED_VIDEO_SOURCE_RE["test"](v64)) return "";
  const v65 = localPathToUrl(v64);
  if (v65) return v65;
  if (v64["startsWith"]("/") && !v64["startsWith"]("//")) return v64;
  return DIRECT_VIDEO_SOURCE_RE["test"](v64) ? v64 : "";
}
export function resolveVideoClipSourceUrl(v66) {
  if (!v66) return "";
  const v67 = pickSelectedVideoItem(v66),
    v68 = v67 ? [v67, v66] : [v66];
  for (const v69 of v68) {
    const v70 = resolveCanvasVideoUrl(v69);
    if (v70) return v70;
    for (const v71 of ["src", "videoUrl", "url", "resultUrl", "sourceUrl"]) {
      const v72 = normalizeDirectVideoSource(v69?.[v71]);
      if (v72) return v72;
    }
  }
  return "";
}
export function buildVideoCutNodeMeta(v73, v74, v75, v76) {
  const v77 = Number(v74),
    v78 = Number(v75),
    v79 =
      Number["isFinite"](v77) && Number["isFinite"](v78) && v78 > v77
        ? v78 - v77
        : 0,
    v80 = pickSelectedVideoItem(v73),
    v81 = pickPositiveNumber(
      v80?.["videoDuration"],
      v80?.["duration"],
      v73?.["videoDuration"],
      v73?.["duration"],
    ),
    v82 = pickPositiveNumber(
      v80?.["videoFrameCount"],
      v80?.["frameCount"],
      v73?.["videoFrameCount"],
      v73?.["frameCount"],
    ),
    v83 =
      pickPositiveNumber(
        v76,
        v80?.["videoFps"],
        v80?.["fps"],
        v73?.["videoFps"],
        v73?.["fps"],
      ) || (v82 > 0 && v81 > 0 ? v82 / v81 : 0),
    v84 = pickPositiveNumber(
      v80?.["videoWidth"],
      v80?.["width"],
      v73?.["videoWidth"],
      v73?.["selectedVideoWidth"],
    ),
    v85 = pickPositiveNumber(
      v80?.["videoHeight"],
      v80?.["height"],
      v73?.["videoHeight"],
      v73?.["selectedVideoHeight"],
    ),
    v86 = {};
  if (v79 > 0) v86["videoDuration"] = v79;
  if (v83 > 0) v86["videoFps"] = v83;
  v79 > 0 &&
    v83 > 0 &&
    (v86["videoFrameCount"] = Math["max"](1, Math["round"](v79 * v83)));
  if (v84 > 0) v86["videoWidth"] = Math["round"](v84);
  if (v85 > 0) v86["videoHeight"] = Math["round"](v85);
  return v86;
}
export function buildVideoCutNodePlaybackFields(v87) {
  const v88 = pickResultLocalPath({ localPath: v87 }),
    v89 = localPathToUrl(v88);
  return {
    src: v89,
    videoUrl: v89,
    localPath: v88,
    originalLocalPath: v88,
    videoThumbSrc: v89,
  };
}
function applyVideoCutThumbResultToNode(v90, v91, v92 = {}) {
  const v93 = String(v90 || "")["trim"](),
    v94 = String(v91 || "")["trim"]();
  if (!v93 || !v94) return;
  const v95 = String(v92["thumbUrl"] || v92["url"] || "")["trim"](),
    v96 = pickResultLocalPath(v92);
  if (!v95 && !v96) return;
  const v97 = appStore["getState"]()["nodes"]?.[v93];
  if (!v97) return;
  const v98 = resolveCanvasVideoUrl(v97);
  if (v98 && v98 !== v94) return;
  const v99 = { videoThumbSrc: v94, videoThumbUnavailableSource: "" };
  (v95 && !String(v97["thumbUrl"] || "")["trim"]() && (v99["thumbUrl"] = v95),
    v96 &&
      !String(v97["posterLocalPath"] || "")["trim"]() &&
      (v99["posterLocalPath"] = v96),
    appStore["updateNodeData"](v93, v99));
}
function ensureVideoCutNodeThumb(v100, v101) {
  const v102 = localPathToUrl(v101);
  if (!v102) return;
  fetchVideoFirstFrameThumbFromServer(v102)
    ["then"]((v103) => applyVideoCutThumbResultToNode(v100, v102, v103))
    ["catch"](() => {});
}
export async function runSmartClipFromVideoNode({
  nodeId: v104,
  options: v105,
  onProgress: v106,
  shouldContinue: v107,
} = {}) {
  const v108 = normalizeSmartClipRunOptions(v105),
    v109 = String(v104 || "")["trim"](),
    v110 = appStore["getState"]()["nodes"],
    v111 = v110[v109];
  if (!v111) throw new Error("找不到视频节点");
  const v112 =
    localPathToUrl(v111["localPath"]) ||
    v111["src"] ||
    v111["videoUrl"] ||
    v111["resultUrl"] ||
    "";
  if (!v112) throw new Error("视频源无效");
  emitSmartClipProgress(v106, {
    stage: "prepare",
    stageText: "准备中",
    text: "准备中...",
    outputMode: v108["outputMode"],
  });
  const v113 = await requester({
    url: "/api/v2/video/smart_clip",
    method: "POST",
    provider: "local",
    headers: { "Content-Type": "application/json" },
    body: JSON["stringify"]({ src: v112, options: v108 }),
    allow404Null: true,
    returnMeta: true,
  });
  if (v113?.["status"] === 404 || v113?.["data"] == null)
    throw new Error(
      "后端接口不存在：/api/v2/video/smart_clip（请重启 server.py）",
    );
  if (!v113?.["data"]?.["success"])
    throw new Error(v113?.["data"]?.["error"] || "启动失败");
  const v114 = v113["data"]["jobId"];
  if (!v114) throw new Error("启动失败：缺少\x20jobId");
  for (;;) {
    if (typeof v107 === "function" && v107() === false)
      throw new Error("已退出裁剪模式");
    const v115 = await requester({
        url:
          "/api/v2/video/smart_clip/status?jobId=" + encodeURIComponent(v114),
        method: "GET",
        provider: "local",
        timeout: 20000,
        returnMeta: true,
      }),
      v116 = v115["data"] || {};
    if (v116["status"] === "error")
      throw new Error(v116["error"] || "智能剪辑失败");
    emitSmartClipProgress(v106, {
      ...buildSmartClipProgressPayload(v116),
      outputMode: v108["outputMode"],
    });
    if (v116["status"] !== "done") {
      await new Promise((v117) => setTimeout(v117, 800));
      continue;
    }
    const v118 = Array["isArray"](v116["segments"]) ? v116["segments"] : [];
    if (!v118["length"])
      return {
        ok: false,
        reason: "no-segments",
        nodeIds: [],
        outputMode: v108["outputMode"],
      };
    const v119 = appStore["getState"]()["nodes"][v109];
    if (!v119) throw new Error("找不到原节点");
    const v120 = normalizeSmartClipOutputMode(
        v116["outputMode"] || v108["outputMode"],
      ),
      v121 = v120 === SMART_CLIP_OUTPUT_MODE_KEYFRAMES,
      v122 = getAutoMediaSizeByShortSide(
        v119["width"] || 512,
        v119["height"] || 288,
      ),
      {
        spacing: v123,
        direction: v124,
        avoidOverlap: v125,
      } = getNodeSpawnPrefs(),
      { startX: v126, startY: v127 } = calcSpawnStartFromAnchor(
        v119,
        v123,
        v124,
      ),
      v128 = [],
      v129 = { ...(appStore["getState"]()["nodes"] || {}) };
    for (let v130 = 0; v130 < v118["length"]; v130++) {
      const v131 = v118[v130] || {},
        v132 = pickResultLocalPath(v131);
      if (!v132) continue;
      let v133 = v131,
        v134 = v132;
      if (v121 && !isSmartClipImageResult(v131, v132)) {
        emitSmartClipProgress(v106, {
          stage: "frame",
          stageText: "提帧中",
          progress: v118["length"] > 0 ? v130 / v118["length"] : 0,
          pct:
            v118["length"] > 0
              ? Math["round"]((v130 / v118["length"]) * 100)
              : 0,
          doneCount: v130,
          total: v118["length"],
          text: "提帧中 " + (v130 + 1) + "/" + v118["length"],
          outputMode: v120,
        });
        try {
          ((v133 = await extractSmartClipVideoResultFirstFrame(
            v131,
            v132,
            v130,
          )),
            (v134 = pickResultLocalPath(v133)));
        } catch (v135) {
          console["warn"](
            "[VideoClipController] smart clip keyframe fallback failed:",
            v135,
          );
          continue;
        }
        if (!v134) continue;
      }
      const v136 = normalizeSmartClipFps(v131["fps"] || v108["fps"]),
        v137 = Number(v131["duration"]) > 0 ? Number(v131["duration"]) : 0,
        v138 = pickPositiveNumber(
          v133["width"],
          v133["imageWidth"],
          v133["originalWidth"],
          v119["videoWidth"],
          v119["selectedVideoWidth"],
          v119["originalWidth"],
          v119["width"],
          512,
        ),
        v139 = pickPositiveNumber(
          v133["height"],
          v133["imageHeight"],
          v133["originalHeight"],
          v119["videoHeight"],
          v119["selectedVideoHeight"],
          v119["originalHeight"],
          v119["height"],
          288,
        ),
        v140 = v121 ? getAutoMediaSizeByShortSide(v138, v139) : v122,
        v141 = v125
          ? findAvailablePosition(
              v129,
              v126,
              v127,
              v140["width"],
              v140["height"],
              v123,
              v124,
            )
          : { x: v126, y: v127 },
        v142 = generateId(
          v121 ? "source-image-smart-frame" : "source-video-scene",
        ),
        v143 = v121
          ? buildSourceMediaNodePayload({
              id: v142,
              type: "source-image",
              x: v141["x"],
              y: v141["y"],
              width: v140["width"],
              height: v140["height"],
              name: "智能剪辑关键帧\x20" + (v130 + 1),
              src: localPathToUrl(v134),
              localPath: v134,
              originalLocalPath: v133["originalLocalPath"] || v134,
              displayLocalPath: v133["displayLocalPath"] || "",
              thumbLocalPath: v133["thumbLocalPath"] || "",
              fileName: v133["fileName"] || v131["fileName"] || "",
              naturalWidth: v138,
              naturalHeight: v139,
              originalWidth: v138,
              originalHeight: v139,
              needsAutoResize: false,
              fixedSize: true,
            })
          : buildSourceMediaNodePayload({
              id: v142,
              type: "source-video",
              x: v141["x"],
              y: v141["y"],
              width: v140["width"],
              height: v140["height"],
              name: "智能剪辑 " + (v130 + 1),
              src: localPathToUrl(v134),
              localPath: v134,
              videoDuration: v137 || undefined,
              videoFps: v136,
              videoFrameCount:
                v137 > 0
                  ? Math["max"](1, Math["round"](v137 * v136))
                  : undefined,
              needsAutoResize: false,
              fixedSize: true,
            });
      (appStore["addNode"](v143), (v129[v142] = v143), v128["push"](v142));
    }
    if (!v128["length"])
      return {
        ok: false,
        reason: v121 ? "no-keyframes" : "no-results",
        nodeIds: [],
        outputMode: v120,
      };
    return (
      appStore["setSelectedNodes"](v128),
      commit(),
      window["v2FocusOnNodes"]?.([v109, ...v128]),
      window["_triggerLocalCacheSave"]?.(),
      { ok: true, nodeIds: v128, outputMode: v120 }
    );
  }
}
export function runSmartClipKeyframeExtractionFromVideoNode({
  nodeId: v144,
  options: v145,
  onProgress: v146,
  shouldContinue: v147,
} = {}) {
  return runSmartClipFromVideoNode({
    nodeId: v144,
    options: {
      ...SMART_CLIP_KEYFRAME_DEFAULT_OPTIONS,
      ...(v145 && typeof v145 === "object" ? v145 : {}),
      outputMode: SMART_CLIP_OUTPUT_MODE_KEYFRAMES,
    },
    onProgress: v146,
    shouldContinue: v147,
  });
}
const VideoClipController = {
  active: false,
  nodeId: null,
  anchorNodeId: null,
  wrapperEl: null,
  barEl: null,
  trackEl: null,
  selectionEl: null,
  leftHandleEl: null,
  rightHandleEl: null,
  playheadEl: null,
  labelEl: null,
  cancelBtnEl: null,
  confirmBtnEl: null,
  thumbEls: null,
  videoEl: null,
  durationSec: 0,
  startSec: 0,
  endSec: 0,
  _dragMode: null,
  _dragOffsetPx: 0,
  _onKeyDown: null,
  _onDocClick: null,
  _onLoadedMeta: null,
  _onDurationChange: null,
  _onPointerMove: null,
  _onPointerUp: null,
  _smartClipFps: SMART_CLIP_DEFAULT_FPS,
  _smartClipMaxSegmentDrag: null,
  _onSmartClipMaxSegmentDragMove: null,
  _onSmartClipMaxSegmentDragUp: null,
  _suppressSmartClipMaxSegmentClick: false,
  _retryRaf: 0,
  _retryCount: 0,
  _thumbToken: 0,
  _sourceToken: 0,
  _playheadRaf: 0,
  _rangeLoopSeekPending: false,
  _rangePlaybackSeq: 0,
  _hiddenEls: null,
  init(v148) {
    if (!v148) return;
    if (this["active"]) this["exit"]({ silent: true });
    const v149 = appStore["getState"]()["nodes"][v148];
    if (!v149) return;
    ((this["active"] = true),
      (this["nodeId"] = v148),
      (this["anchorNodeId"] = v148),
      (this["_rangeLoopSeekPending"] = false),
      (this["_rangePlaybackSeq"] += 1),
      appStore["setVideoClipState"]({ active: true, nodeId: v148 }),
      (this["_retryCount"] = 0),
      this["_mountWhenReady"]());
  },
  _applyDimMode(v150) {
    const v151 = document["getElementById"]("v2-wrap");
    if (v151) {
      if (v150) v151["classList"]["add"]("is-video-clip-mode");
      else v151["classList"]["remove"]("is-video-clip-mode");
    }
    if (this["wrapperEl"]) {
      if (v150) this["wrapperEl"]["classList"]["add"]("is-video-clip-target");
      else this["wrapperEl"]["classList"]["remove"]("is-video-clip-target");
    }
  },
  _applyFrozenUI(v152) {
    if (!this["wrapperEl"]) return;
    const v153 = "is-video-clipping";
    if (v152) this["wrapperEl"]["classList"]["add"](v153);
    else this["wrapperEl"]["classList"]["remove"](v153);
    this["_applyFrozenOverlaysHidden"](v152);
  },
  _applyFrozenOverlaysHidden(v154) {
    if (!this["wrapperEl"]) return;
    if (v154) {
      if (Array["isArray"](this["_hiddenEls"]) && this["_hiddenEls"]["length"])
        return;
      const v155 = [
          ".video-controls",
          ".video-mute-btn",
          ".node-upload-hint",
          ".video-center-indicator",
          ".gen-video-center-indicator",
          ".multi-toggle-btn",
        ],
        v156 = [];
      (v155["forEach"]((v157) => {
        this["wrapperEl"]["querySelectorAll"](v157)["forEach"]((v158) => {
          (v156["push"]({ el: v158, prevDisplay: v158["style"]["display"] }),
            (v158["style"]["display"] = "none"));
        });
      }),
        (this["_hiddenEls"] = v156));
      return;
    }
    const v159 = Array["isArray"](this["_hiddenEls"]) ? this["_hiddenEls"] : [];
    ((this["_hiddenEls"] = null),
      v159["forEach"](({ el: v160, prevDisplay: v161 }) => {
        if (!v160 || !v160["isConnected"]) return;
        v160["style"]["display"] = v161 || "";
      }));
  },
  _mountWhenReady() {
    const v162 = this["nodeId"],
      v163 = () => {
        if (!this["active"] || this["nodeId"] !== v162) return;
        const v164 = document["getElementById"](v162);
        if (!v164) {
          this["_retryCount"]++;
          if (this["_retryCount"] > 10) {
            this["exit"]({ silent: true });
            return;
          }
          this["_retryRaf"] = requestAnimationFrame(v163);
          return;
        }
        ((this["wrapperEl"] = v164),
          this["_applyFrozenUI"](true),
          this["_applyDimMode"](true),
          this["_createUI"](),
          this["_bindEvents"](),
          this["_syncDurationAndDefaults"](),
          this["_render"]());
      };
    this["_retryRaf"] = requestAnimationFrame(v163);
  },
  _createUI() {
    if (!this["wrapperEl"]) return;
    this["wrapperEl"]
      ["querySelectorAll"](".v2-video-clipbar")
      ["forEach"]((v165) => v165["remove"]());
    const v166 = document["createElement"]("div");
    ((v166["className"] = "v2-video-clipbar"),
      v166["addEventListener"]("pointerdown", (v167) =>
        v167["stopPropagation"](),
      ),
      v166["addEventListener"]("click", (v168) => v168["stopPropagation"]()),
      v166["addEventListener"]("dblclick", (v169) => {
        (v169["preventDefault"](), v169["stopPropagation"]());
      }));
    const v170 = document["createElement"]("button");
    ((v170["type"] = "button"),
      (v170["className"] = "v2-video-clipbtn cancel"),
      (v170["title"] = "取消"));
    {
      const v171 = "http://www.w3.org/2000/svg",
        v172 = document["createElementNS"](v171, "svg");
      (v172["setAttribute"]("width", "20"),
        v172["setAttribute"]("height", "20"),
        v172["setAttribute"]("viewBox", "0\x200\x2024\x2024"),
        v172["setAttribute"]("fill", "none"),
        v172["setAttribute"]("stroke", "currentColor"),
        v172["setAttribute"]("stroke-width", "2"));
      const v173 = document["createElementNS"](v171, "path");
      v173["setAttribute"]("d", "M18 6L6 18");
      const v174 = document["createElementNS"](v171, "path");
      (v174["setAttribute"]("d", "M6 6l12 12"),
        v172["appendChild"](v173),
        v172["appendChild"](v174),
        v170["appendChild"](v172));
    }
    const v175 = document["createElement"]("button");
    ((v175["type"] = "button"),
      (v175["className"] = "v2-video-clipbtn\x20confirm"),
      (v175["title"] = "完成"));
    {
      const v176 = "http://www.w3.org/2000/svg",
        v177 = document["createElementNS"](v176, "svg");
      (v177["setAttribute"]("width", "24"),
        v177["setAttribute"]("height", "24"),
        v177["setAttribute"]("viewBox", "0\x200\x2024\x2024"),
        v177["setAttribute"]("fill", "none"),
        v177["setAttribute"]("stroke", "currentColor"),
        v177["setAttribute"]("stroke-width", "2.5"));
      const v178 = document["createElementNS"](v176, "polyline");
      (v178["setAttribute"]("points", "20 6 9 17 4 12"),
        v177["appendChild"](v178),
        v175["appendChild"](v177));
    }
    const v179 = document["createElement"]("div");
    v179["className"] = "v2-video-cliprow";
    const v180 = document["createElement"]("div");
    v180["className"] = "v2-video-cliptrack";
    const v181 = document["createElement"]("div");
    v181["className"] = "v2-video-clipticks";
    const v182 = document["createElement"]("div");
    v182["className"] = "v2-video-clipthumbs";
    const v183 = [];
    for (let v184 = 0; v184 < 10; v184++) {
      const v185 = document["createElement"]("div");
      ((v185["className"] = "v2-video-clipthumb"),
        v182["appendChild"](v185),
        v183["push"](v185));
    }
    const v186 = document["createElement"]("div");
    v186["className"] = "v2-video-cliprange";
    const v187 = document["createElement"]("div");
    v187["className"] = "v2-video-clipselection";
    const v188 = document["createElement"]("div");
    v188["className"] = "v2-video-clipplayhead";
    const v189 = document["createElement"]("div");
    ((v189["className"] = "v2-video-cliphandle left"),
      (v189["dataset"]["handle"] = "left"));
    const v190 = document["createElement"]("div");
    ((v190["className"] = "v2-video-cliphandle right"),
      (v190["dataset"]["handle"] = "right"));
    const v191 = document["createElement"]("div");
    ((v191["className"] = "v2-video-cliplabel"),
      (v191["textContent"] = "0.00s"));
    const v192 = document["createElement"]("div");
    v192["className"] = "v2-video-cliphelper-row";
    const v193 = document["createElement"]("div");
    v193["className"] = "v2-video-cliphelper-left";
    const v194 = [
      {
        html: '<span class="v2-video-cliphelperkbd">Esc</span><span>取消</span>\n               <span style="display:flex;align-items:center;margin-left:4px;">\n                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><path d="M6 8h.001"></path><path d="M10 8h.001"></path><path d="M14 8h.001"></path><path d="M18 8h.001"></path><path d="M8 12h.001"></path><path d="M12 12h.001"></path><path d="M16 12h.001"></path><path d="M7 16h10"></path></svg>\n               </span>',
      },
      {
        html: '<span class="v2-video-cliphelperkbd">Space</span><span>区间播放/暂停</span>',
      },
      {
        html: "<span\x20class=\x22v2-video-cliphelperkbd\x22>←</span>\x20<span\x20class=\x22v2-video-cliphelperkbd\x22>→</span>\x20<span>逐帧移动裁剪区域</span>",
      },
      {
        html: '<span class="v2-video-cliphelperkbd">Shift</span> + <span class="v2-video-cliphelperkbd">←</span>/<span class="v2-video-cliphelperkbd">→</span> <span>大步移动裁剪区 (10帧)</span>',
      },
      {
        html: "<span\x20class=\x22v2-video-cliphelperkbd\x22>I</span>/<span\x20class=\x22v2-video-cliphelperkbd\x22>O</span>\x20<span>设置入点/出点</span>",
      },
      {
        html: '<span class="v2-video-cliphelperkbd">Ctrl</span> + <span class="v2-video-cliphelperkbd">←</span>/<span class="v2-video-cliphelperkbd">→</span> <span>微调入点 (1帧)</span>',
      },
      {
        html: '<span class="v2-video-cliphelperkbd">Alt</span> + <span class="v2-video-cliphelperkbd">←</span>/<span class="v2-video-cliphelperkbd">→</span> <span>微调出点 (1帧)</span>',
      },
      {
        html: '<span class="v2-video-cliphelperkbd">滚轮</span><span>同方向键 (上滚=←)</span>',
      },
      {
        html: "<span\x20class=\x22v2-video-cliphelperkbd\x22>鼠标点击</span><span>播放头跳转</span>",
      },
      {
        html: '<span class="v2-video-cliphelperkbd">双击选区</span><span>恢复默认 3s</span>',
      },
    ];
    this["_msgEls"] = v194["map"]((v195, v196) => {
      const v197 = document["createElement"]("div");
      v197["className"] = "v2-video-cliphelper-msg";
      if (v196 !== 0) v197["classList"]["add"]("hide-down");
      return (
        (v197["innerHTML"] = v195["html"]),
        v193["appendChild"](v197),
        v197
      );
    });
    let v198 = 0;
    ((this["_msgInterval"] = setInterval(() => {
      if (!this["active"] || !this["_msgEls"]) return;
      const v199 = this["_msgEls"][v198];
      v198 = (v198 + 1) % this["_msgEls"]["length"];
      const v200 = this["_msgEls"][v198];
      (v199["classList"]["remove"]("hide-down"),
        v199["classList"]["add"]("hide-up"),
        v200["classList"]["remove"]("hide-up"),
        v200["classList"]["remove"]("hide-down"),
        setTimeout(() => {
          v199 &&
            v199["classList"]["contains"]("hide-up") &&
            (v199["classList"]["remove"]("hide-up"),
            v199["classList"]["add"]("hide-down"));
        }, 300));
    }, 4000)),
      (this["_smartClipMode"] = this["_smartClipMode"] || "stable"),
      (this["_smartClipMaxSegments"] = normalizeSmartClipMaxSegments(
        this["_smartClipMaxSegments"],
      )),
      (this["_smartClipFps"] = normalizeSmartClipFps(this["_smartClipFps"])),
      (this["_smartClipOutputMode"] = normalizeSmartClipOutputMode(
        this["_smartClipOutputMode"],
      )));
    const v201 = document["createElement"]("div");
    v201["className"] = "v2-video-clip-actions";
    const v202 = document["createElement"]("div");
    v202["className"] = "v2-video-clip-smartwrap";
    const v203 = document["createElement"]("button");
    v203["className"] = "v2-video-clip-smartbtn";
    const v204 =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
      v205 =
        "<svg\x20width=\x2214\x22\x20height=\x2214\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22><g\x20style=\x22animation:spin\x201s\x20linear\x20infinite;transform-origin:50%\x2050%;transform-box:fill-box;\x22><path\x20d=\x22M21\x2012a9\x209\x200\x201\x201-6.219-8.56\x22/></g></svg>";
    v203["innerHTML"] = v204 + " 智能剪辑";
    const v206 = document["createElement"]("button");
    ((v206["type"] = "button"),
      (v206["className"] = "v2-video-clip-smartbtn v2-video-clip-framebtn"),
      (v206["title"] = "提取视频帧"),
      v206["setAttribute"]("aria-label", "提取视频帧"));
    const v207 =
      "<svg\x20width=\x2214\x22\x20height=\x2214\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20stroke-linecap=\x22round\x22\x20stroke-linejoin=\x22round\x22><path\x20d=\x22M23\x2019a2\x202\x200\x200\x201-2\x202H3a2\x202\x200\x200\x201-2-2V8a2\x202\x200\x200\x201\x202-2h4l2-3h6l2\x203h4a2\x202\x200\x200\x201\x202\x202z\x22></path><circle\x20cx=\x2212\x22\x20cy=\x2213\x22\x20r=\x224\x22></circle></svg>";
    v206["innerHTML"] = v207;
    const v208 = document["createElement"]("div");
    v208["className"] = "v2-video-clip-smartpanel";
    const v209 = document["createElement"]("div");
    ((v209["className"] = "v2-video-clip-smartpanel-title"),
      (v209["textContent"] = "智能剪辑设置"));
    const v210 = document["createElement"]("div");
    v210["className"] = "v2-video-clip-smartpanel-row";
    const v211 = document["createElement"]("div");
    ((v211["className"] = "v2-video-clip-smartpanel-label"),
      (v211["textContent"] = "输出"));
    const v212 = document["createElement"]("span");
    ((v212["className"] = "rh-tip"),
      v212["setAttribute"](
        "data-tooltip",
        "提取视频片段：生成视频节点\n提取视频关键帧：每段只取开头第一帧，生成图片节点",
      ),
      (v212["textContent"] = "!"),
      v211["appendChild"](v212));
    const v213 = document["createElement"]("div");
    v213["className"] = "v2-video-clip-modegroup v2-video-clip-outputgroup";
    const v214 = document["createElement"]("button");
    ((v214["type"] = "button"),
      (v214["className"] = "v2-video-clip-modebtn"),
      (v214["dataset"]["outputMode"] = SMART_CLIP_OUTPUT_MODE_SEGMENTS),
      (v214["textContent"] = "提取视频片段"));
    const v215 = document["createElement"]("button");
    ((v215["type"] = "button"),
      (v215["className"] = "v2-video-clip-modebtn"),
      (v215["dataset"]["outputMode"] = SMART_CLIP_OUTPUT_MODE_KEYFRAMES),
      (v215["textContent"] = "提取视频关键帧"),
      v213["appendChild"](v214),
      v213["appendChild"](v215),
      v210["appendChild"](v211),
      v210["appendChild"](v213));
    const v216 = document["createElement"]("div");
    v216["className"] = "v2-video-clip-smartpanel-row";
    const v217 = document["createElement"]("div");
    ((v217["className"] = "v2-video-clip-smartpanel-label"),
      (v217["textContent"] = "模式"));
    const v218 = document["createElement"]("span");
    ((v218["className"] = "rh-tip"),
      v218["setAttribute"](
        "data-tooltip",
        "稳：适合口播/影视，结果更干净\x0a均衡：更容易切出更多镜头\x0a敏感：适合快剪/混剪，优先保证能切出来",
      ),
      (v218["textContent"] = "!"),
      v217["appendChild"](v218));
    const v219 = document["createElement"]("div");
    v219["className"] = "v2-video-clip-modegroup";
    const v220 = document["createElement"]("button");
    ((v220["type"] = "button"),
      (v220["className"] = "v2-video-clip-modebtn"),
      (v220["dataset"]["mode"] = "stable"),
      (v220["textContent"] = "稳"));
    const v221 = document["createElement"]("button");
    ((v221["type"] = "button"),
      (v221["className"] = "v2-video-clip-modebtn"),
      (v221["dataset"]["mode"] = "balanced"),
      (v221["textContent"] = "均衡"));
    const v222 = document["createElement"]("button");
    ((v222["type"] = "button"),
      (v222["className"] = "v2-video-clip-modebtn"),
      (v222["dataset"]["mode"] = "sensitive"),
      (v222["textContent"] = "敏感"),
      v219["appendChild"](v220),
      v219["appendChild"](v221),
      v219["appendChild"](v222),
      v216["appendChild"](v217),
      v216["appendChild"](v219));
    const v223 = document["createElement"]("div");
    v223["className"] = "v2-video-clip-smartpanel-row";
    const v224 = document["createElement"]("div");
    ((v224["className"] = "v2-video-clip-smartpanel-label"),
      (v224["textContent"] = "帧率"));
    const v225 = document["createElement"]("span");
    ((v225["className"] = "rh-tip"),
      v225["setAttribute"](
        "data-tooltip",
        "16\x20帧更省时，24\x20帧更通用，30\x20帧更顺滑但处理更慢",
      ),
      (v225["textContent"] = "!"),
      v224["appendChild"](v225));
    const v226 = document["createElement"]("div");
    v226["className"] = "v2-video-clip-modegroup v2-video-clip-fpsgroup";
    const v227 = SMART_CLIP_FPS_OPTIONS["map"]((v228) => {
      const v229 = document["createElement"]("button");
      return (
        (v229["type"] = "button"),
        (v229["className"] = "v2-video-clip-modebtn v2-video-clip-fpsbtn"),
        (v229["dataset"]["fps"] = String(v228)),
        (v229["textContent"] = v228 + "帧"),
        v226["appendChild"](v229),
        v229
      );
    });
    (v223["appendChild"](v224), v223["appendChild"](v226));
    const v230 = document["createElement"]("div");
    v230["className"] = "v2-video-clip-smartpanel-row";
    const v231 = document["createElement"]("div");
    ((v231["className"] = "v2-video-clip-smartpanel-label"),
      (v231["textContent"] = "最多生成"));
    const v232 = document["createElement"]("span");
    ((v232["className"] = "rh-tip"),
      v232["setAttribute"](
        "data-tooltip",
        "最多生成 25 段，避免镜头太碎导致画布一次出现大量节点\n按住数字左右拖动调整，点击可输入",
      ),
      (v232["textContent"] = "!"),
      v231["appendChild"](v232));
    const v233 = document["createElement"]("div");
    v233["className"] = "v2-video-clip-maxsegwrap";
    const v234 = document["createElement"]("div");
    ((v234["className"] = "rh-stepper-value v2-video-clip-maxseg"),
      v234["setAttribute"]("role", "spinbutton"),
      v234["setAttribute"]("aria-label", "最多生成段数"),
      v234["setAttribute"]("aria-valuemin", String(SMART_CLIP_MIN_SEGMENTS)),
      v234["setAttribute"]("aria-valuemax", String(SMART_CLIP_MAX_SEGMENTS)),
      (v234["tabIndex"] = 0));
    const v235 = document["createElement"]("span");
    ((v235["className"] = "v2-video-clip-maxseg-suffix"),
      (v235["textContent"] = "段"),
      v233["appendChild"](v234),
      v233["appendChild"](v235),
      v230["appendChild"](v231),
      v230["appendChild"](v233));
    const v236 = document["createElement"]("div");
    ((v236["className"] = "v2-video-clip-smartpanel-hint"),
      (v236["textContent"] = "镜头很碎时会自动降级，保证能生成结果"));
    const v237 = document["createElement"]("div");
    v237["className"] = "v2-video-clip-smartpanel-actions";
    const v238 = document["createElement"]("button");
    ((v238["type"] = "button"),
      (v238["className"] = "v2-video-clip-panelbtn"),
      (v238["textContent"] = "取消"));
    const v239 = document["createElement"]("button");
    ((v239["type"] = "button"),
      (v239["className"] = "v2-video-clip-panelbtn\x20primary"),
      (v239["textContent"] = "开始"),
      v237["appendChild"](v238),
      v237["appendChild"](v239),
      v208["appendChild"](v209),
      v208["appendChild"](v210),
      v208["appendChild"](v216),
      v208["appendChild"](v223),
      v208["appendChild"](v230),
      v208["appendChild"](v236),
      v208["appendChild"](v237));
    const v240 = [v214, v215],
      v241 = () => {
        const v242 = normalizeSmartClipOutputMode(this["_smartClipOutputMode"]);
        ((this["_smartClipOutputMode"] = v242),
          v240["forEach"]((v243) => {
            v243["classList"]["toggle"](
              "is-active",
              v243["dataset"]["outputMode"] === v242,
            );
          }));
        const v244 = v242 === SMART_CLIP_OUTPUT_MODE_KEYFRAMES;
        (v223["classList"]["toggle"]("is-disabled", v244),
          v227["forEach"]((v245) => {
            ((v245["disabled"] = v244),
              v245["setAttribute"]("aria-disabled", v244 ? "true" : "false"));
          }),
          (v236["textContent"] = v244
            ? "关键帧模式会为每段生成开头第一帧图片"
            : "镜头很碎时会自动降级，保证能生成结果"));
        const v246 = this["_smartClipMode"] || "stable";
        [v220, v221, v222]["forEach"]((v247) => {
          if (!v247) return;
          if (v247["dataset"]["mode"] === v246)
            v247["classList"]["add"]("is-active");
          else v247["classList"]["remove"]("is-active");
        });
        const v248 = normalizeSmartClipFps(this["_smartClipFps"]);
        ((this["_smartClipFps"] = v248),
          v227["forEach"]((v249) => {
            v249["classList"]["toggle"](
              "is-active",
              Number(v249["dataset"]["fps"]) === v248,
            );
          }));
        const v250 = normalizeSmartClipMaxSegments(
          this["_smartClipMaxSegments"],
        );
        ((this["_smartClipMaxSegments"] = v250),
          (v234["textContent"] = String(v250)),
          v234["setAttribute"]("aria-valuenow", String(v250)));
      };
    v241();
    const v251 = () => {
        if (!this["_smartClipMaxSegmentDrag"]) return;
        (this["_smartClipMaxSegmentDrag"]["el"]?.["classList"]?.["remove"](
          "is-dragging",
        ),
          this["_smartClipMaxSegmentDrag"]["doc"]?.["removeEventListener"]?.(
            "mousemove",
            this["_onSmartClipMaxSegmentDragMove"],
          ),
          this["_smartClipMaxSegmentDrag"]["doc"]?.["removeEventListener"]?.(
            "mouseup",
            this["_onSmartClipMaxSegmentDragUp"],
          ),
          (this["_smartClipMaxSegmentDrag"] = null));
      },
      v252 = (v253) => {
        ((this["_smartClipMaxSegments"] = normalizeSmartClipMaxSegments(v253)),
          v241());
      },
      v254 = () => {
        if (!v234?.["isConnected"]) return;
        const v255 = normalizeSmartClipMaxSegments(
            this["_smartClipMaxSegments"],
          ),
          v256 = document["createElement"]("input");
        ((v256["className"] = "rh-stepper-input v2-video-clip-maxseg-input"),
          (v256["type"] = "number"),
          (v256["min"] = String(SMART_CLIP_MIN_SEGMENTS)),
          (v256["max"] = String(SMART_CLIP_MAX_SEGMENTS)),
          (v256["step"] = "1"),
          (v256["value"] = String(v255)));
        let v257 = false;
        const v258 = (v259) => {
          if (v257) return;
          ((v257 = true),
            v252(v259 ? v256["value"] : v255),
            v256["replaceWith"](v234),
            v241());
        };
        (v256["addEventListener"]("click", (v260) => v260["stopPropagation"]()),
          v256["addEventListener"]("mousedown", (v261) =>
            v261["stopPropagation"](),
          ),
          v256["addEventListener"]("keydown", (v262) => {
            v262["stopPropagation"]();
            if (v262["key"] === "Enter") v258(true);
            if (v262["key"] === "Escape") v258(false);
          }),
          v256["addEventListener"]("blur", () => v258(true)),
          v234["replaceWith"](v256),
          v256["focus"](),
          v256["select"]());
      };
    ((this["_onSmartClipMaxSegmentDragMove"] = (v263) => {
      const v264 = this["_smartClipMaxSegmentDrag"];
      if (!v264) return;
      const v265 = v263["clientX"] - v264["x"],
        v266 = Math["trunc"](v265 / 6),
        v267 = normalizeSmartClipMaxSegments(v264["base"] + v266);
      v267 !== v264["last"] &&
        ((v264["moved"] = true), (v264["last"] = v267), v252(v267));
    }),
      (this["_onSmartClipMaxSegmentDragUp"] = () => {
        const v268 = this["_smartClipMaxSegmentDrag"];
        if (!v268) return;
        (v251(),
          v268["moved"] &&
            ((this["_suppressSmartClipMaxSegmentClick"] = true),
            v252(v268["last"])));
      }));
    const v269 = () => {
        (v208["classList"]["remove"]("is-open"),
          this["_onSmartClipDocDown"] &&
            (document["removeEventListener"](
              "pointerdown",
              this["_onSmartClipDocDown"],
              true,
            ),
            (this["_onSmartClipDocDown"] = null)));
      },
      v270 = () => {
        if (v203["dataset"]["loading"] === "true") return;
        (v241(),
          v208["classList"]["add"]("is-open"),
          !this["_onSmartClipDocDown"] &&
            ((this["_onSmartClipDocDown"] = (v271) => {
              if (!this["active"]) return;
              const v272 = v271?.["target"];
              if (!v272) return;
              if (v202["contains"](v272)) return;
              v269();
            }),
            document["addEventListener"](
              "pointerdown",
              this["_onSmartClipDocDown"],
              true,
            )));
      },
      v273 = () => {
        if (v208["classList"]["contains"]("is-open")) v269();
        else v270();
      },
      v274 = (v275) => {
        ((this["_smartClipMode"] = v275), v241());
      },
      v276 = (v277) => {
        ((this["_smartClipOutputMode"] = normalizeSmartClipOutputMode(v277)),
          v241());
      },
      v278 = (v279) => {
        ((this["_smartClipFps"] = normalizeSmartClipFps(v279)), v241());
      };
    (v240["forEach"]((v280) => {
      v280["onclick"] = (v281) => {
        (v281["stopPropagation"](), v276(v280["dataset"]["outputMode"]));
      };
    }),
      [v220, v221, v222]["forEach"]((v282) => {
        v282["onclick"] = (v283) => {
          (v283["stopPropagation"](),
            v274(v282["dataset"]["mode"] || "stable"));
        };
      }),
      v227["forEach"]((v284) => {
        v284["onclick"] = (v285) => {
          (v285["stopPropagation"](), v278(v284["dataset"]["fps"]));
        };
      }),
      (v234["onmousedown"] = (v286) => {
        if (v286["button"] !== 0) return;
        (v286["preventDefault"](), v286["stopPropagation"]());
        const v287 = document,
          v288 = normalizeSmartClipMaxSegments(this["_smartClipMaxSegments"]);
        (v251(),
          (this["_smartClipMaxSegmentDrag"] = {
            x: v286["clientX"],
            base: v288,
            last: v288,
            moved: false,
            el: v234,
            doc: v287,
          }),
          v234["classList"]["add"]("is-dragging"),
          v287["addEventListener"](
            "mousemove",
            this["_onSmartClipMaxSegmentDragMove"],
          ),
          v287["addEventListener"](
            "mouseup",
            this["_onSmartClipMaxSegmentDragUp"],
          ));
      }),
      (v234["onclick"] = (v289) => {
        v289["stopPropagation"]();
        if (this["_suppressSmartClipMaxSegmentClick"]) {
          this["_suppressSmartClipMaxSegmentClick"] = false;
          return;
        }
        v254();
      }),
      (v234["onkeydown"] = (v290) => {
        v290["stopPropagation"]();
        if (v290["key"] === "Enter" || v290["key"] === "\x20") {
          (v290["preventDefault"](), v254());
          return;
        }
        if (v290["key"] === "ArrowRight" || v290["key"] === "ArrowUp") {
          (v290["preventDefault"](),
            v252(Number(this["_smartClipMaxSegments"]) + 1));
          return;
        }
        (v290["key"] === "ArrowLeft" || v290["key"] === "ArrowDown") &&
          (v290["preventDefault"](),
          v252(Number(this["_smartClipMaxSegments"]) - 1));
      }),
      (v238["onclick"] = (v291) => {
        (v291["stopPropagation"](), v269());
      }));
    const v292 = async ({
      mode: v293,
      maxSegments: v294,
      fps: v295,
      outputMode: v296,
    }) => {
      const v297 = normalizeSmartClipOutputMode(v296),
        v298 = v297 === SMART_CLIP_OUTPUT_MODE_KEYFRAMES;
      ((v203["dataset"]["loading"] = "true"),
        (v203["disabled"] = true),
        (v203["innerHTML"] = v205 + "\x20准备中..."),
        window["showToast"]?.(
          v298
            ? "⏳ 正在智能剪辑：分析场景并提取关键帧..."
            : "⏳ 正在智能剪辑：分析场景并裁剪为多个文件...",
          "info",
        ));
      try {
        const v299 = await runSmartClipFromVideoNode({
          nodeId: this["anchorNodeId"],
          options: {
            mode: v293,
            maxSegments: v294,
            fps: v295,
            outputMode: v297,
          },
          shouldContinue: () => this["active"],
          onProgress: (v300) => {
            if (!v203?.["isConnected"] || !v300?.["text"]) return;
            v203["innerHTML"] = v205 + "\x20" + v300["text"];
          },
        });
        if (!v299?.["ok"]) {
          window["showToast"]?.(
            v299?.["reason"] === "no-segments"
              ? "未检测到场景变化"
              : v298
                ? "智能剪辑没有生成有效关键帧"
                : "智能剪辑没有生成有效片段",
            v299?.["reason"] === "no-segments" ? "info" : "error",
          );
          return;
        }
        (window["showToast"]?.(
          v298
            ? "✅ 智能剪辑完成，已生成 " +
                v299["nodeIds"]["length"] +
                "\x20张关键帧"
            : "✅ 智能剪辑完成，已生成 " + v299["nodeIds"]["length"] + "\x20段",
          "success",
        ),
          this["exit"]({ silent: true }));
      } catch (v301) {
        const v302 =
          v301 instanceof Error
            ? v301["message"]
            : String(v301 || "智能剪辑失败");
        window["showToast"]?.("❌ 智能剪辑失败: " + v302, "error");
      } finally {
        (v269(),
          v203 &&
            v203["isConnected"] &&
            ((v203["dataset"]["loading"] = "false"),
            (v203["disabled"] = false),
            (v203["innerHTML"] = v204 + "\x20智能剪辑")));
      }
    };
    ((v239["onclick"] = async (v303) => {
      (v303["stopPropagation"](), v269());
      const v304 = this["_smartClipMode"] || "stable",
        v305 = normalizeSmartClipMaxSegments(this["_smartClipMaxSegments"]),
        v306 = normalizeSmartClipFps(this["_smartClipFps"]),
        v307 = normalizeSmartClipOutputMode(this["_smartClipOutputMode"]);
      await v292({
        mode: v304,
        maxSegments: v305,
        fps: v306,
        outputMode: v307,
      });
    }),
      (v203["onclick"] = (v308) => {
        (v308["stopPropagation"](), v273());
      }),
      (v206["onclick"] = async (v309) => {
        (v309["stopPropagation"](), v269());
        if (v206["dataset"]["loading"] === "true") return;
        ((v206["dataset"]["loading"] = "true"),
          (v206["disabled"] = true),
          (v206["innerHTML"] = v205));
        try {
          const v310 = this["videoEl"] || this["_getVideoEl"]();
          await extractCurrentVideoFrameToImageNode({
            videoEl: v310,
            anchorNodeId: this["anchorNodeId"],
            fallbackDurationSec:
              this["_readDurationSec"](v310) || this["durationSec"],
            logPrefix: "[VideoClipController]",
          });
        } finally {
          v206 &&
            v206["isConnected"] &&
            ((v206["dataset"]["loading"] = "false"),
            (v206["disabled"] = false),
            (v206["innerHTML"] = v207));
        }
      }),
      v202["appendChild"](v203),
      v202["appendChild"](v208),
      v201["appendChild"](v202),
      v201["appendChild"](v206),
      v192["appendChild"](v193),
      v192["appendChild"](v201),
      v186["appendChild"](v187),
      v186["appendChild"](v189),
      v186["appendChild"](v190),
      v180["appendChild"](v182),
      v180["appendChild"](v186),
      v180["appendChild"](v188),
      v180["appendChild"](v181),
      v180["appendChild"](v191),
      v179["appendChild"](v170),
      v179["appendChild"](v180),
      v179["appendChild"](v175),
      v166["appendChild"](v179),
      v166["appendChild"](v192),
      this["wrapperEl"]["appendChild"](v166),
      (this["barEl"] = v166),
      (this["cancelBtnEl"] = v170),
      (this["confirmBtnEl"] = v175),
      (this["trackEl"] = v180),
      (this["selectionEl"] = v187),
      (this["leftHandleEl"] = v189),
      (this["rightHandleEl"] = v190),
      (this["playheadEl"] = v188),
      (this["labelEl"] = v191),
      (this["thumbEls"] = v183));
  },
  _bindEvents() {
    if (!this["barEl"]) return;
    (this["cancelBtnEl"]?.["addEventListener"]("click", (v311) => {
      (v311["stopPropagation"](), this["exit"]());
    }),
      this["confirmBtnEl"]?.["addEventListener"]("click", (v312) => {
        (v312["stopPropagation"](), this["_confirm"]());
      }));
    const v313 = (v314) => {
      if (!this["trackEl"] || !this["active"] || this["_dragMode"]) return;
      const v315 = v314["clientX"],
        v316 = this["selectionEl"]["getBoundingClientRect"](),
        v317 = 20,
        v318 = Math["abs"](v315 - v316["left"]) < v317,
        v319 = Math["abs"](v315 - v316["right"]) < v317;
      if (v318)
        (this["leftHandleEl"]["classList"]["add"]("hover-active"),
          this["rightHandleEl"]["classList"]["remove"]("hover-active"),
          (this["selectionEl"]["style"]["cursor"] = "var(--resize-ew-cursor)"));
      else
        v319
          ? (this["rightHandleEl"]["classList"]["add"]("hover-active"),
            this["leftHandleEl"]["classList"]["remove"]("hover-active"),
            (this["selectionEl"]["style"]["cursor"] =
              "var(--resize-ew-cursor)"))
          : (this["leftHandleEl"]["classList"]["remove"]("hover-active"),
            this["rightHandleEl"]["classList"]["remove"]("hover-active"),
            (this["selectionEl"]["style"]["cursor"] = "var(--grab-cursor)"));
    };
    this["trackEl"]?.["addEventListener"]("pointermove", v313);
    const v320 = 30,
      v321 = (v322) => (Number(v322 || 1) / v320) * 1,
      v323 = () => {
        const v324 = this["durationSec"];
        if (!Number["isFinite"](v324) || v324 <= 0) return 0.1;
        return Math["min"](0.1, v324);
      },
      v325 = (v326, v327, v328) => Math["max"](v327, Math["min"](v328, v326)),
      v329 = (v330) => {
        if (!this["trackEl"] || !this["active"]) return;
        const v331 = this["durationSec"];
        if (!Number["isFinite"](v331) || v331 <= 0) return;
        const v332 = this["videoEl"] || this["_getVideoEl"]();
        if (!v332) return;
        const v333 = this["trackEl"]["getBoundingClientRect"]();
        if (!v333["width"]) return;
        const v334 = v330 - v333["left"],
          v335 = v325(v334 / v333["width"], 0, 1),
          v336 = v335 * v331,
          v337 = Math["max"](0, v331 - 0.001);
        try {
          v332["currentTime"] = v325(v336, 0, v337);
        } catch (v338) {}
        this["_renderPlayhead"]();
      },
      v339 = () => {
        const v340 = this["videoEl"] || this["_getVideoEl"]();
        if (!v340) return;
        if (!v340["paused"]) return;
        const v341 = Number(v340["currentTime"]) || 0;
        if (v341 >= this["startSec"] && v341 <= this["endSec"]) return;
        try {
          v340["currentTime"] = this["startSec"];
        } catch (v342) {}
      },
      v343 = (v344, v345) => {
        const v346 = this["durationSec"];
        if (!Number["isFinite"](v346) || v346 <= 0) return;
        const v347 = this["_pauseRangePlaybackForRangeEdit"](),
          v348 = v321(v345) * (v344 >= 0 ? 1 : -1),
          v349 = v323(),
          v350 = Math["max"](v349, this["endSec"] - this["startSec"]);
        let v351 = this["startSec"] + v348,
          v352 = this["endSec"] + v348;
        v351 < 0 && ((v351 = 0), (v352 = v350));
        v352 > v346 && ((v352 = v346), (v351 = Math["max"](0, v346 - v350)));
        ((this["startSec"] = v351), (this["endSec"] = v352));
        if (v347)
          try {
            v347["currentTime"] = v351;
          } catch (v353) {}
        else v339();
        this["_render"]();
      },
      v354 = (v355) => {
        const v356 = this["durationSec"];
        if (!Number["isFinite"](v356) || v356 <= 0) return;
        const v357 = this["_pauseRangePlaybackForRangeEdit"](),
          v358 = v321(1) * (v355 >= 0 ? 1 : -1),
          v359 = v323(),
          v360 = Math["max"](0, this["endSec"] - v359);
        this["startSec"] = v325(this["startSec"] + v358, 0, v360);
        if (v357)
          try {
            v357["currentTime"] = this["startSec"];
          } catch (v361) {}
        this["_render"]();
      },
      v362 = (v363) => {
        const v364 = this["durationSec"];
        if (!Number["isFinite"](v364) || v364 <= 0) return;
        const v365 = this["_pauseRangePlaybackForRangeEdit"](),
          v366 = v321(1) * (v363 >= 0 ? 1 : -1),
          v367 = v323(),
          v368 = Math["min"](v364, this["startSec"] + v367);
        this["endSec"] = v325(this["endSec"] + v366, v368, v364);
        if (v365)
          try {
            v365["currentTime"] = this["endSec"];
          } catch (v369) {}
        this["_render"]();
      },
      v370 = (v371) => {
        const v372 = this["durationSec"];
        if (!Number["isFinite"](v372) || v372 <= 0) return;
        const v373 = this["videoEl"] || this["_getVideoEl"]();
        if (!v373) return;
        this["_pauseRangePlaybackForRangeEdit"](v373);
        let v374 = Number(v373["currentTime"]) || 0;
        v374 = v325(v374, 0, v372);
        const v375 = v323();
        if (v371 === "in") {
          const v376 = Math["max"](0, this["endSec"] - v375);
          this["startSec"] = v325(v374, 0, v376);
        } else {
          const v377 = Math["min"](v372, this["startSec"] + v375);
          this["endSec"] = v325(v374, v377, v372);
        }
        this["_render"]();
      },
      v378 = (v379) => {
        if (!this["trackEl"] || !this["active"]) return;
        const v380 = v379["target"]["closest"](".v2-video-cliphandle"),
          v381 = !!v379["target"]["closest"](".v2-video-clipselection"),
          v382 = this["trackEl"]["getBoundingClientRect"]();
        if (!v382["width"]) return;
        const v383 = v379["clientX"],
          v384 = this["selectionEl"]["getBoundingClientRect"](),
          v385 = 20,
          v386 = Math["abs"](v383 - v384["left"]) < v385,
          v387 = Math["abs"](v383 - v384["right"]) < v385;
        if (v386 || (v380 && v380["dataset"]["handle"] === "left"))
          ((this["_dragMode"] = "left"),
            this["leftHandleEl"]["classList"]["add"]("hover-active"));
        else {
          if (v387 || (v380 && v380["dataset"]["handle"] === "right"))
            ((this["_dragMode"] = "right"),
              this["rightHandleEl"]["classList"]["add"]("hover-active"));
          else {
            if (v381) this["_dragMode"] = "move";
            else {
              this["_dragMode"] = "scrub";
              const v388 = this["videoEl"] || this["_getVideoEl"]();
              if (v388)
                try {
                  if (!v388["paused"]) v388["pause"]();
                } catch (v389) {}
            }
          }
        }
        if (this["_dragMode"] === "move") {
          const v390 = this["selectionEl"]["getBoundingClientRect"]();
          this["_dragOffsetPx"] = v379["clientX"] - v390["left"];
        } else this["_dragOffsetPx"] = 0;
        (v379["preventDefault"](), v379["stopPropagation"]());
        if (this["_dragMode"] === "scrub") v329(v379["clientX"]);
        else this["_handleDragAtClientX"](v379["clientX"]);
        ((this["_onPointerMove"] = (v391) => {
          (v391["preventDefault"](), v391["stopPropagation"]());
          if (this["_dragMode"] === "scrub") v329(v391["clientX"]);
          else this["_handleDragAtClientX"](v391["clientX"]);
        }),
          (this["_onPointerUp"] = (v392) => {
            (v392["preventDefault"](),
              v392["stopPropagation"](),
              window["removeEventListener"](
                "pointermove",
                this["_onPointerMove"],
                true,
              ),
              window["removeEventListener"](
                "pointerup",
                this["_onPointerUp"],
                true,
              ),
              (this["_dragMode"] = null),
              this["leftHandleEl"]?.["classList"]["remove"]("hover-active"),
              this["rightHandleEl"]?.["classList"]["remove"]("hover-active"));
          }),
          window["addEventListener"](
            "pointermove",
            this["_onPointerMove"],
            true,
          ),
          window["addEventListener"]("pointerup", this["_onPointerUp"], true));
      };
    (this["trackEl"]?.["addEventListener"]("pointerdown", v378),
      this["trackEl"]?.["addEventListener"](
        "wheel",
        (v393) => {
          if (!this["active"]) return;
          (v393["preventDefault"](), v393["stopPropagation"]());
          const v394 = Number(v393["deltaX"]) || 0,
            v395 = Number(v393["deltaY"]) || 0,
            v396 = Math["abs"](v394) > Math["abs"](v395) ? v394 : v395;
          if (!v396) return;
          const v397 = v396 > 0 ? 1 : -1;
          if (v393["ctrlKey"] || v393["metaKey"]) v354(v397);
          else {
            if (v393["altKey"]) v362(v397);
            else {
              const v398 = v393["shiftKey"] ? 10 : 1;
              v343(v397, v398);
            }
          }
        },
        { passive: false },
      ),
      this["selectionEl"]?.["addEventListener"]("dblclick", (v399) => {
        if (!this["active"]) return;
        (v399["preventDefault"](), v399["stopPropagation"]());
        const v400 = this["durationSec"];
        if (!v400 || !Number["isFinite"](v400) || v400 <= 0) return;
        const v401 = this["selectionEl"]["getBoundingClientRect"](),
          v402 = v399["clientX"],
          v403 = 24;
        if (v402 - v401["left"] < v403 || v401["right"] - v402 < v403) return;
        const v404 = Math["min"](3, v400),
          v405 = (this["startSec"] + this["endSec"]) / 2,
          v406 = Math["max"](0, Math["min"](v400 - v404, v405 - v404 / 2)),
          v407 = this["_pauseRangePlaybackForRangeEdit"]();
        ((this["startSec"] = v406), (this["endSec"] = v406 + v404));
        if (v407 && v407["paused"]) v407["currentTime"] = this["startSec"];
        this["_render"]();
      }),
      (this["_onKeyDown"] = (v408) => {
        if (!this["active"]) return;
        if (v408["key"] === "Escape") {
          (v408["preventDefault"](), this["exit"]());
          return;
        }
        if (v408["key"] === "\x20" || v408["code"] === "Space") {
          this["_handlePlaybackShortcutKey"](v408);
          return;
        }
        if (v408["key"] === "i" || v408["key"] === "I") {
          (v408["preventDefault"](), v370("in"));
          return;
        }
        if (v408["key"] === "o" || v408["key"] === "O") {
          (v408["preventDefault"](), v370("out"));
          return;
        }
        if (v408["key"] === "ArrowLeft" || v408["key"] === "ArrowRight") {
          v408["preventDefault"]();
          const v409 = v408["key"] === "ArrowRight" ? 1 : -1;
          if (v408["ctrlKey"] || v408["metaKey"]) {
            v354(v409);
            return;
          }
          if (v408["altKey"]) {
            v362(v409);
            return;
          }
          const v410 = v408["shiftKey"] ? 10 : 1;
          v343(v409, v410);
        }
      }),
      window["addEventListener"]("keydown", this["_onKeyDown"], true),
      this["_onDocClick"] &&
        (document["removeEventListener"](
          "pointerdown",
          this["_onDocClick"],
          true,
        ),
        (this["_onDocClick"] = null)),
      (this["_onDocClick"] = (v411) => {
        if (!this["active"] || !this["barEl"]) return;
        if (this["barEl"]["contains"](v411["target"])) return;
        this["exit"]({ silent: true });
      }),
      document["addEventListener"]("pointerdown", this["_onDocClick"], true));
  },
  _getVideoEl() {
    if (!this["wrapperEl"]) return null;
    const v412 = Array["from"](this["wrapperEl"]["querySelectorAll"]("video"));
    let v413 = null,
      v414 = null;
    for (const v415 of v412) {
      if (!v415) continue;
      const v416 = window["getComputedStyle"](v415);
      if (v416["display"] === "none" || v416["visibility"] === "hidden")
        continue;
      const v417 = Number(v416["opacity"]);
      if (Number["isFinite"](v417) && v417 <= 0) continue;
      const v418 = v415["getBoundingClientRect"]();
      if (!v418["width"] || !v418["height"]) continue;
      if (!v413) v413 = v415;
      const v419 = String(
        v415["currentSrc"] || v415["getAttribute"]("src") || "",
      )["trim"]();
      if (v419) {
        v414 = v415;
        break;
      }
    }
    return ((this["videoEl"] = v414 || v413 || null), this["videoEl"]);
  },
  _getVideoElementSource(v420) {
    return String(
      v420?.["getAttribute"]?.("src") ||
        v420?.["currentSrc"] ||
        v420?.["src"] ||
        "",
    )["trim"]();
  },
  _setClipMediaKeepAlive(v421, v422) {
    if (!v421?.["dataset"]) return;
    if (v422) {
      v421["dataset"]["desktopMediaKeepAlive"] = "video-clip";
      return;
    }
    v421["dataset"]["desktopMediaKeepAlive"] === "video-clip" &&
      delete v421["dataset"]["desktopMediaKeepAlive"];
  },
  _readDurationSec(v423) {
    if (!v423) return 0;
    const v424 = Number(v423["duration"]);
    if (Number["isFinite"](v424) && v424 > 0) return v424;
    const v425 = v423["seekable"];
    if (v425 && v425["length"]) {
      const v426 = Number(v425["end"](v425["length"] - 1));
      if (Number["isFinite"](v426) && v426 > 0) return v426;
    }
    return 0;
  },
  _resolveKnownDurationSec(v427) {
    const v428 = pickSelectedVideoItem(v427),
      v429 = pickPositiveNumber(
        v428?.["videoDuration"],
        v428?.["duration"],
        v427?.["videoDuration"],
        v427?.["duration"],
      );
    if (v429 > 0) return v429;
    const v430 = pickPositiveNumber(
        v428?.["videoFrameCount"],
        v428?.["frameCount"],
        v427?.["videoFrameCount"],
        v427?.["frameCount"],
      ),
      v431 = pickPositiveNumber(
        v428?.["videoFps"],
        v428?.["fps"],
        v427?.["videoFps"],
        v427?.["fps"],
      );
    return v430 > 0 && v431 > 0 ? v430 / v431 : 0;
  },
  _applyDurationSec(v432) {
    const v433 = Number(v432);
    if (!Number["isFinite"](v433) || v433 <= 0) return false;
    this["durationSec"] = v433;
    if (!(this["endSec"] > this["startSec"])) {
      const v434 = Math["min"](3, v433),
        v435 = Math["max"](0, (v433 - v434) / 2);
      return ((this["startSec"] = v435), (this["endSec"] = v435 + v434), true);
    }
    ((this["startSec"] = Math["max"](0, Math["min"](this["startSec"], v433))),
      (this["endSec"] = Math["max"](0, Math["min"](this["endSec"], v433))));
    if (this["endSec"] <= this["startSec"]) {
      const v436 = Math["min"](3, v433);
      ((this["startSec"] = 0), (this["endSec"] = v436));
    }
    return true;
  },
  async _applyVideoMetaDurationFallback(v437, v438) {
    const v439 = String(v437 || "")["trim"]();
    if (!v439) return;
    try {
      const v440 = await fetchVideoMetaFromServer(v439);
      if (!this["active"] || v438 !== this["_sourceToken"]) return;
      const v441 =
          v440 && typeof v440 === "object" && v440["data"]
            ? v440["data"]
            : v440,
        v442 = pickPositiveNumber(
          v441?.["duration"],
          v441?.["videoDuration"],
          v441?.["format"]?.["duration"],
          v441?.["stream"]?.["duration"],
        );
      this["_applyDurationSec"](v442) &&
        (this["_render"](), this["_startPlayheadLoop"]());
    } catch (v443) {}
  },
  async _syncDurationAndDefaults() {
    const v444 = appStore["getState"]()["nodes"]?.[this["nodeId"]],
      v445 = this["_resolveVideoSrcFromNode"](v444),
      v446 = String(v445 || "")["trim"](),
      v447 = ++this["_sourceToken"];
    this["videoEl"] = this["_getVideoEl"]();
    this["_applyDurationSec"](this["_resolveKnownDurationSec"](v444)) &&
      this["_render"]();
    if (this["videoEl"]) {
      const v448 = String(
        this["videoEl"]["dataset"]?.["videoClipSourceUrl"] || "",
      )["trim"]();
      this["_setClipMediaKeepAlive"](this["videoEl"], true);
      try {
        this["videoEl"]["pause"]();
      } catch (v449) {}
      try {
        this["videoEl"]["loop"] = false;
      } catch (v450) {}
      if (v446 && v448 !== v446) {
        await attachDesktopMediaPlaybackSource(this["videoEl"], v446);
        if (!this["active"] || v447 !== this["_sourceToken"]) return;
        if (!this["_getVideoElementSource"](this["videoEl"])) {
          ((this["videoEl"]["preload"] = "metadata"),
            (this["videoEl"]["src"] = v446));
          try {
            this["videoEl"]["load"]?.();
          } catch (v451) {}
        }
        this["videoEl"]["dataset"] &&
          (this["videoEl"]["dataset"]["videoClipSourceUrl"] = v446);
      }
    }
    const v452 = this["_readDurationSec"](this["videoEl"]);
    if (this["_applyDurationSec"](v452)) this["_render"]();
    else
      !(this["durationSec"] > 0) &&
        v446 &&
        void this["_applyVideoMetaDurationFallback"](v446, v447);
    (this["videoEl"] &&
      ((this["_onLoadedMeta"] = () => {
        if (!this["active"]) return;
        const v453 = this["_readDurationSec"](this["videoEl"]);
        (this["_applyDurationSec"](v453, this["videoEl"]), this["_render"]());
      }),
      (this["_onDurationChange"] = () => {
        if (!this["active"]) return;
        const v454 = this["_readDurationSec"](this["videoEl"]);
        (this["_applyDurationSec"](v454, this["videoEl"]), this["_render"]());
      }),
      this["videoEl"]["addEventListener"](
        "loadedmetadata",
        this["_onLoadedMeta"],
        { once: true },
      ),
      this["videoEl"]["addEventListener"](
        "durationchange",
        this["_onDurationChange"],
      )),
      this["_renderThumbs"](),
      this["_startPlayheadLoop"]());
  },
  _startPlayheadLoop() {
    if (this["_playheadRaf"]) cancelAnimationFrame(this["_playheadRaf"]);
    const v455 = () => {
      if (!this["active"]) return;
      (this["_renderPlayhead"](),
        (this["_playheadRaf"] = requestAnimationFrame(v455)));
    };
    this["_playheadRaf"] = requestAnimationFrame(v455);
  },
  _renderPlayhead() {
    if (!this["playheadEl"] || !this["trackEl"]) return;
    const v456 = this["durationSec"];
    if (!Number["isFinite"](v456) || v456 <= 0) {
      this["playheadEl"]["style"]["display"] = "none";
      return;
    }
    const v457 = this["videoEl"] || this["_getVideoEl"]();
    if (!v457) {
      this["playheadEl"]["style"]["display"] = "none";
      return;
    }
    let v458 = Number(v457["currentTime"]) || 0;
    if (v458 < this["startSec"] || v458 > this["endSec"]) {
      if (
        !v457["paused"] &&
        !v457["seeking"] &&
        this["_rangeLoopSeekPending"] !== true
      ) {
        this["_rangeLoopSeekPending"] = true;
        try {
          v457["currentTime"] = this["startSec"];
        } catch (v459) {}
        v458 = this["startSec"];
      }
    } else !v457["seeking"] && (this["_rangeLoopSeekPending"] = false);
    const v460 = Math["max"](0, Math["min"](1, v458 / v456));
    ((this["playheadEl"]["style"]["display"] = "block"),
      (this["playheadEl"]["style"]["left"] = v460 * 100 + "%"));
  },
  _handlePlaybackShortcutKey(v461) {
    if (!this["active"]) return false;
    if (!(v461?.["key"] === "\x20" || v461?.["code"] === "Space")) return false;
    (v461["preventDefault"]?.(), v461["stopPropagation"]?.());
    if (!v461["repeat"]) void this["_togglePlayRange"]();
    return true;
  },
  _pauseRangePlaybackForRangeEdit(
    v462 = this["videoEl"] || this["_getVideoEl"](),
  ) {
    ((this["_rangePlaybackSeq"] += 1), (this["_rangeLoopSeekPending"] = false));
    if (!v462) return null;
    try {
      if (!v462["paused"]) v462["pause"]();
    } catch (v463) {}
    return v462;
  },
  async _togglePlayRange() {
    const v464 = ++this["_rangePlaybackSeq"],
      v465 = this["_getVideoEl"]();
    if (!v465) return false;
    await this["_ensureVideoPlaybackSource"](v465);
    if (!this["active"] || v464 !== this["_rangePlaybackSeq"]) return false;
    let v466 = Number(this["durationSec"]);
    if (!Number["isFinite"](v466) || v466 <= 0) {
      v466 = this["_readDurationSec"](v465);
      if (!Number["isFinite"](v466) || v466 <= 0) return false;
      if (this["_applyDurationSec"](v466)) this["_render"]();
    }
    try {
      if (!v465["paused"])
        return (v465["pause"](), this["_renderPlayhead"](), true);
    } catch (v467) {}
    const v468 = Math["max"](0, Math["min"](this["startSec"], v466)),
      v469 = Math["max"](v468, Math["min"](this["endSec"], v466));
    if (!(v469 > v468)) return false;
    const v470 = Number(v465["currentTime"]) || 0;
    (v470 < v468 || v470 >= v469) &&
      (await this["_seekVideoForRangePlayback"](v465, v468));
    if (!this["active"] || v464 !== this["_rangePlaybackSeq"]) return false;
    const v471 = await playVideoWithRecovery(v465, {
      label: "video-clip:" + (this["nodeId"] || "unknown") + ":range",
      ensureSrc: () => this["_ensureVideoPlaybackSource"](v465),
      minBufferAhead: 0.5,
      readyTimeoutMs: 500,
      recoveryDebounceMs: 150,
      recoveryCooldownMs: 500,
      shouldRecover: (v472) =>
        this["active"] === true &&
        this["videoEl"] === v472 &&
        v472?.["isConnected"] !== false &&
        !v472?.["paused"],
      shouldContinue: () =>
        this["active"] === true &&
        v464 === this["_rangePlaybackSeq"] &&
        this["videoEl"] === v465,
    });
    return (
      v471 &&
        ((this["_rangeLoopSeekPending"] = false), this["_renderPlayhead"]()),
      v471
    );
  },
  async _ensureVideoPlaybackSource(v473 = this["videoEl"]) {
    if (!v473) return false;
    if (this["_getVideoElementSource"](v473)) {
      if (v473["preload"] !== "auto") v473["preload"] = "auto";
      return true;
    }
    const v474 = appStore["getState"]()["nodes"]?.[this["nodeId"]],
      v475 = String(this["_resolveVideoSrcFromNode"](v474) || "")["trim"]();
    if (!v475) return false;
    await attachDesktopMediaPlaybackSource(v473, v475, { preload: "auto" });
    if (v473["dataset"]) v473["dataset"]["videoClipSourceUrl"] = v475;
    return !!this["_getVideoElementSource"](v473);
  },
  async _seekVideoForRangePlayback(v476, v477) {
    if (!v476) return false;
    const v478 = Math["max"](0, Number(v477) || 0),
      v479 = Number(v476["currentTime"] || 0);
    if (
      Math["abs"](v479 - v478) <= VIDEO_CLIP_SEEK_EPSILON_SEC &&
      Number(v476["readyState"] || 0) >= 2 &&
      !v476["seeking"]
    )
      return true;
    this["_rangeLoopSeekPending"] = true;
    try {
      v476["currentTime"] = v478;
    } catch (v480) {}
    return (
      await this["_waitForRangePlaybackSeek"](v476),
      (this["_rangeLoopSeekPending"] = false),
      true
    );
  },
  _waitForRangePlaybackSeek(v481) {
    if (!v481 || (Number(v481["readyState"] || 0) >= 2 && !v481["seeking"]))
      return Promise["resolve"](true);
    return new Promise((v482) => {
      let v483 = false;
      const v484 = [
          "seeked",
          "canplay",
          "canplaythrough",
          "loadeddata",
          "timeupdate",
        ],
        v485 = () => {
          if (v483) return;
          ((v483 = true),
            clearTimeout(v486),
            v484["forEach"]((v487) =>
              v481["removeEventListener"]?.(v487, v488),
            ),
            v481["removeEventListener"]?.("error", v488),
            v481["removeEventListener"]?.("abort", v488),
            v482(true));
        },
        v488 = () => {
          if (Number(v481["readyState"] || 0) >= 2 || !v481["seeking"]) v485();
        },
        v486 = setTimeout(v485, VIDEO_CLIP_PLAY_SEEK_TIMEOUT_MS);
      (v484["forEach"]((v489) => v481["addEventListener"]?.(v489, v488)),
        v481["addEventListener"]?.("error", v488),
        v481["addEventListener"]?.("abort", v488));
    });
  },
  _resolveVideoSrcFromNode(v490) {
    return resolveVideoClipSourceUrl(v490);
  },
  async _renderThumbs() {
    const v491 = ++this["_thumbToken"],
      v492 = Array["isArray"](this["thumbEls"]) ? this["thumbEls"] : [];
    if (!v492["length"]) return;
    const v493 = appStore["getState"]()["nodes"][this["nodeId"]],
      v494 = this["_resolveVideoSrcFromNode"](v493);
    if (!v494) return;
    const v495 = v492["length"];
    let v496, v497, v498;
    const v499 = (v500, v501) =>
      new Promise((v502, v503) => {
        let v504 = false;
        const v505 = () => {
            (v500["removeEventListener"]("seeked", v506),
              v500["removeEventListener"]("error", v507));
          },
          v506 = () => {
            if (v504) return;
            ((v504 = true), v505(), v502());
          },
          v507 = () => {
            if (v504) return;
            ((v504 = true), v505(), v503(new Error("video seek error")));
          };
        (v500["addEventListener"]("seeked", v506),
          v500["addEventListener"]("error", v507));
        const v508 = Math["max"](0, (Number(v500["duration"]) || 0) - 0.05),
          v509 = Math["max"](0, Math["min"](v508, v501));
        try {
          v500["currentTime"] = v509;
        } catch (v510) {
          v507();
        }
        window["setTimeout"](() => {
          if (v504) return;
          ((v504 = true), v505(), v502());
        }, 450);
      });
    try {
      ((v496 = document["createElement"]("video")),
        (v496["muted"] = true),
        (v496["playsInline"] = true),
        (v496["preload"] = "auto"),
        (v496["crossOrigin"] = "anonymous"),
        await attachDesktopMediaPlaybackSource(v496, v494));
      if (!this["_getVideoElementSource"](v496)) {
        v496["src"] = v494;
        try {
          v496["load"]?.();
        } catch (v511) {}
      }
      await new Promise((v512, v513) => {
        let v514 = false,
          v515 = null;
        const v516 = () => {
            (v496["removeEventListener"]("loadedmetadata", v517),
              v496["removeEventListener"]("error", v518));
            if (v515) window["clearTimeout"](v515);
          },
          v517 = () => {
            if (v514) return;
            ((v514 = true), v516(), v512());
          },
          v518 = () => {
            if (v514) return;
            ((v514 = true), v516(), v513(new Error("video load error")));
          };
        (v496["addEventListener"]("loadedmetadata", v517, { once: true }),
          v496["addEventListener"]("error", v518),
          (v515 = window["setTimeout"](() => {
            if (v514) return;
            if (
              Number(v496["readyState"] || 0) >= 1 ||
              this["_readDurationSec"](v496) > 0
            ) {
              ((v514 = true), v516(), v512());
              return;
            }
            ((v514 = true), v516(), v513(new Error("video metadata timeout")));
          }, 8000)));
      });
      const v519 = await waitForVideoFrame(v496, { timeoutMs: 3000 });
      if (!v519) throw new Error("video frame timeout");
      if (!this["active"] || this["_thumbToken"] !== v491) return;
      const v520 = this["_readDurationSec"](v496);
      if (!v520 || !Number["isFinite"](v520)) return;
      if (this["_applyDurationSec"](v520, v496)) this["_render"]();
      const v521 = v496["videoWidth"] || 1,
        v522 = v496["videoHeight"] || 1,
        v523 = 44,
        v524 = Math["max"](1, Math["round"]((v521 / v522) * v523));
      ((v497 = document["createElement"]("canvas")),
        (v497["width"] = v524),
        (v497["height"] = v523),
        (v498 = v497["getContext"]("2d")));
      if (!v498) return;
      for (let v525 = 0; v525 < v495; v525++) {
        if (!this["active"] || this["_thumbToken"] !== v491) return;
        const v526 = ((v525 + 0.5) / v495) * v520;
        (await v499(v496, v526),
          await waitForVideoFrame(v496, { timeoutMs: 1200 }));
        if (!this["active"] || this["_thumbToken"] !== v491) return;
        (v498["clearRect"](0, 0, v524, v523),
          v498["drawImage"](v496, 0, 0, v524, v523));
        let v527;
        try {
          v527 = v497["toDataURL"]("image/jpeg", 0.7);
        } catch (v528) {
          return;
        }
        if (!v527) return;
        v492[v525]["style"]["backgroundImage"] = "url(" + v527 + ")";
      }
    } catch (v529) {
      return;
    } finally {
      if (v496) {
        try {
          v496["pause"]();
        } catch (v530) {}
        v496["removeAttribute"]("src");
        try {
          v496["load"]();
        } catch (v531) {}
      }
      ((v497 = null), (v498 = null));
    }
  },
  _handleDragAtClientX(v532) {
    if (!this["trackEl"] || !this["active"]) return;
    const v533 = this["durationSec"];
    if (!v533 || !Number["isFinite"](v533) || v533 <= 0) {
      this["_render"]();
      return;
    }
    const v534 = this["trackEl"]["getBoundingClientRect"]();
    if (!v534["width"]) return;
    const v535 = v532 - v534["left"],
      v536 = Math["max"](0, Math["min"](1, v535 / v534["width"])),
      v537 = v536 * v533,
      v538 = Math["min"](0.1, v533),
      v539 = Math["max"](v538, this["endSec"] - this["startSec"]),
      v540 =
        this["_dragMode"] === "left" ||
        this["_dragMode"] === "right" ||
        this["_dragMode"] === "move" ||
        this["_dragMode"] === "set"
          ? this["_pauseRangePlaybackForRangeEdit"]()
          : null;
    if (this["_dragMode"] === "left") {
      const v541 = Math["max"](0, Math["min"](v537, this["endSec"] - v538));
      this["startSec"] = v541;
      if (v540)
        try {
          v540["currentTime"] = v541;
        } catch (v542) {}
    } else {
      if (this["_dragMode"] === "right") {
        const v543 = Math["max"](
          this["startSec"] + v538,
          Math["min"](v533, v537),
        );
        this["endSec"] = v543;
      } else {
        if (this["_dragMode"] === "move") {
          const v544 =
              this["selectionEl"]["getBoundingClientRect"]()["left"] -
              v534["left"],
            v545 = v532 - v534["left"] - this["_dragOffsetPx"],
            v546 = v545 - v544,
            v547 = (v546 / v534["width"]) * v533,
            v548 = Math["max"](
              0,
              Math["min"](v533 - v539, this["startSec"] + v547),
            );
          ((this["startSec"] = v548), (this["endSec"] = v548 + v539));
          if (v540)
            try {
              v540["currentTime"] = v548;
            } catch (v549) {}
        } else {
          if (this["_dragMode"] === "set") {
            const v550 = Math["min"](3, v533),
              v551 = Math["max"](0, Math["min"](v533 - v550, v537 - v550 / 2));
            ((this["startSec"] = v551), (this["endSec"] = v551 + v550));
          }
        }
      }
    }
    this["_render"]();
  },
  _render() {
    if (
      !this["active"] ||
      !this["trackEl"] ||
      !this["selectionEl"] ||
      !this["leftHandleEl"] ||
      !this["rightHandleEl"]
    )
      return;
    const v552 = this["durationSec"],
      v553 = Number["isFinite"](v552) && v552 > 0,
      v554 = v553 ? Math["max"](0, Math["min"](this["startSec"], v552)) : 0,
      v555 = v553 ? Math["max"](0, Math["min"](this["endSec"], v552)) : 0,
      v556 = Math["max"](0, v555 - v554);
    if (v553) {
      const v557 = (v554 / v552) * 100,
        v558 = (v556 / v552) * 100;
      ((this["selectionEl"]["style"]["left"] = v557 + "%"),
        (this["selectionEl"]["style"]["width"] = v558 + "%"),
        (this["leftHandleEl"]["style"]["left"] = v557 + "%"),
        (this["rightHandleEl"]["style"]["left"] = v557 + v558 + "%"),
        this["labelEl"] &&
          ((this["labelEl"]["textContent"] = v556["toFixed"](2) + "s"),
          (this["labelEl"]["style"]["left"] = v557 + v558 / 2 + "%")));
    } else
      ((this["selectionEl"]["style"]["left"] = "0%"),
        (this["selectionEl"]["style"]["width"] = "0%"),
        (this["leftHandleEl"]["style"]["left"] = "0%"),
        (this["rightHandleEl"]["style"]["left"] = "0%"),
        this["labelEl"] &&
          ((this["labelEl"]["textContent"] = "加载中..."),
          (this["labelEl"]["style"]["left"] = "50%")));
    this["_renderPlayhead"]();
    if (this["confirmBtnEl"]) {
      const v559 = v553 && v556 >= 0.1;
      ((this["confirmBtnEl"]["disabled"] = !v559),
        (this["confirmBtnEl"]["dataset"]["disabled"] = v559 ? "false" : "true"),
        this["confirmBtnEl"]["dataset"]["loading"] !== "true" &&
          (this["confirmBtnEl"]["innerHTML"] =
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'));
    }
  },
  async _confirm() {
    if (!this["confirmBtnEl"]) return;
    const v560 = this["confirmBtnEl"];
    if (v560["dataset"]["disabled"] === "true") return;
    const v561 = appStore["getState"]()["nodes"],
      v562 = v561[this["anchorNodeId"]];
    if (!v562) {
      this["exit"]({ silent: true });
      return;
    }
    const v563 = this["durationSec"];
    if (!v563 || !Number["isFinite"](v563) || v563 <= 0) return;
    const v564 = Math["max"](0, Math["min"](this["startSec"], v563)),
      v565 = Math["max"](0, Math["min"](this["endSec"], v563));
    if (!(v565 > v564)) return;
    const v566 =
      localPathToUrl(v562["localPath"]) ||
      v562["src"] ||
      v562["videoUrl"] ||
      v562["resultUrl"] ||
      "";
    if (!v566) return;
    ((v560["dataset"]["disabled"] = "true"),
      (v560["dataset"]["loading"] = "true"),
      (v560["innerHTML"] =
        "<svg\x20width=\x2218\x22\x20height=\x2218\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22><g\x20style=\x22animation:spin\x201s\x20linear\x20infinite;transform-origin:50%\x2050%;transform-box:fill-box;\x22><path\x20d=\x22M21\x2012a9\x209\x200\x201\x201-6.219-8.56\x22/></g></svg>"),
      window["showToast"]?.("⏳ 正在后端裁剪视频...", "info"));
    try {
      let v567 = null;
      if (canUseElectronMediaTask())
        v567 = await enqueueElectronMediaTask(
          {
            kind: "videoCut",
            nodeId: this["anchorNodeId"],
            src: v566,
            args: { start: v564, end: v565 },
          },
          { wait: true, timeout: 300000 },
        );
      else {
        const v568 = await requester({
          url: "/api/v2/video/cut",
          method: "POST",
          provider: "local",
          headers: { "Content-Type": "application/json" },
          body: JSON["stringify"]({ src: v566, start: v564, end: v565 }),
          allow404Null: true,
          returnMeta: true,
        });
        if (v568?.["status"] === 404 || v568?.["data"] == null)
          throw new Error(
            "后端接口不存在：/api/v2/video/cut（请重启 server.py）",
          );
        v567 = v568["data"] || {};
      }
      const v569 =
          v567?.["result"] && typeof v567["result"] === "object"
            ? v567["result"]
            : v567,
        v570 = normalizeVideoCutResultLocalPath(v567);
      if (!v570 || v567?.["success"] === false || v569?.["success"] === false)
        throw new Error(
          v569?.["error"] ||
            v567?.["error"] ||
            v567?.["message"] ||
            "视频裁剪失败",
        );
      const { width: v571, height: v572 } = getAutoMediaSizeByShortSide(
          v562["width"] || 512,
          v562["height"] || 288,
        ),
        v573 = calcSafeSpawnPosNearNode(
          appStore["getState"]()["nodes"],
          v562,
          v571,
          v572,
        ),
        v574 = generateId("source-video-cut"),
        v575 = pickPositiveNumber(v569?.["fps"], v567?.["fps"]),
        v576 = buildVideoCutNodeMeta(v562, v564, v565, v575),
        v577 = buildVideoCutNodePlaybackFields(v570);
      (appStore["addNode"](
        buildSourceMediaNodePayload({
          id: v574,
          type: "source-video",
          x: v573["x"],
          y: v573["y"],
          width: v571,
          height: v572,
          name: "剪辑自\x20" + (v562["name"] || "视频"),
          ...v577,
          ...v576,
          needsAutoResize: false,
          fixedSize: true,
        }),
      ),
        appStore["setSelectedNodes"]([v574]),
        commit(),
        ensureVideoCutNodeThumb(v574, v570),
        window["v2FocusOnNodes"]?.([this["anchorNodeId"], v574]),
        window["_triggerLocalCacheSave"]?.(),
        window["showToast"]?.("✅ 视频裁剪成功，已生成新文件", "success"),
        this["exit"]({ silent: true }));
    } catch (v578) {
      const v579 =
        v578 instanceof Error
          ? v578["message"]
          : String(v578 || "视频裁剪失败");
      (window["showToast"]?.("❌ 视频裁剪失败: " + v579, "error"),
        (v560["dataset"]["loading"] = "false"),
        this["_render"](),
        (v560["dataset"]["loading"] = "false"));
    }
    v560["dataset"]["loading"] = "false";
  },
  exit({ silent: silent = false } = {}) {
    if (!this["active"]) return;
    ((this["active"] = false),
      this["_thumbToken"]++,
      this["_sourceToken"]++,
      (this["_rangeLoopSeekPending"] = false),
      (this["_rangePlaybackSeq"] += 1),
      appStore["setVideoClipState"]({ active: false, nodeId: null }));
    if (this["_playheadRaf"]) cancelAnimationFrame(this["_playheadRaf"]);
    this["_playheadRaf"] = 0;
    if (this["_retryRaf"]) cancelAnimationFrame(this["_retryRaf"]);
    this["_retryRaf"] = 0;
    if (this["videoEl"]) {
      this["_setClipMediaKeepAlive"](this["videoEl"], false);
      if (this["_onLoadedMeta"])
        this["videoEl"]["removeEventListener"](
          "loadedmetadata",
          this["_onLoadedMeta"],
        );
      if (this["_onDurationChange"])
        this["videoEl"]["removeEventListener"](
          "durationchange",
          this["_onDurationChange"],
        );
    }
    this["_onKeyDown"] &&
      (window["removeEventListener"]("keydown", this["_onKeyDown"], true),
      (this["_onKeyDown"] = null));
    this["_onSmartClipDocDown"] &&
      (document["removeEventListener"](
        "pointerdown",
        this["_onSmartClipDocDown"],
        true,
      ),
      (this["_onSmartClipDocDown"] = null));
    this["_smartClipMaxSegmentDrag"] &&
      (this["_smartClipMaxSegmentDrag"]["el"]?.["classList"]?.["remove"](
        "is-dragging",
      ),
      this["_smartClipMaxSegmentDrag"]["doc"]?.["removeEventListener"]?.(
        "mousemove",
        this["_onSmartClipMaxSegmentDragMove"],
      ),
      this["_smartClipMaxSegmentDrag"]["doc"]?.["removeEventListener"]?.(
        "mouseup",
        this["_onSmartClipMaxSegmentDragUp"],
      ),
      (this["_smartClipMaxSegmentDrag"] = null));
    ((this["_onSmartClipMaxSegmentDragMove"] = null),
      (this["_onSmartClipMaxSegmentDragUp"] = null),
      (this["_suppressSmartClipMaxSegmentClick"] = false));
    if (this["_onPointerMove"])
      window["removeEventListener"](
        "pointermove",
        this["_onPointerMove"],
        true,
      );
    if (this["_onPointerUp"])
      window["removeEventListener"]("pointerup", this["_onPointerUp"], true);
    ((this["_onLoadedMeta"] = null),
      (this["_onDurationChange"] = null),
      (this["_onPointerMove"] = null),
      (this["_onPointerUp"] = null),
      (this["_dragMode"] = null),
      (this["_dragOffsetPx"] = 0));
    this["_onDocClick"] &&
      (document["removeEventListener"](
        "pointerdown",
        this["_onDocClick"],
        true,
      ),
      (this["_onDocClick"] = null));
    ((this["durationSec"] = 0),
      (this["startSec"] = 0),
      (this["endSec"] = 0),
      (this["nodeId"] = null),
      (this["anchorNodeId"] = null),
      (this["videoEl"] = null),
      (this["trackEl"] = null),
      (this["selectionEl"] = null),
      (this["leftHandleEl"] = null),
      (this["rightHandleEl"] = null),
      (this["playheadEl"] = null),
      (this["labelEl"] = null),
      (this["cancelBtnEl"] = null),
      (this["confirmBtnEl"] = null),
      (this["thumbEls"] = null));
    this["_msgInterval"] &&
      (clearInterval(this["_msgInterval"]), (this["_msgInterval"] = null));
    ((this["_msgEls"] = null),
      this["_applyFrozenUI"](false),
      this["_applyDimMode"](false));
    if (this["barEl"]) this["barEl"]["remove"]();
    ((this["barEl"] = null), (this["wrapperEl"] = null));
    if (!silent) window["showToast"]?.("已取消裁剪视频", "info");
  },
};
export default VideoClipController;
