import { separateVideoAudio } from "../../api/videoAudioSeparationApi.js";
import { findAvailablePosition, generateId } from "../core/math.js";
import appStore from "../core/stores/appStore.js";
import { resolveCanvasVideoLocalPath } from "../services/canvasMediaLocalService.js";
import {
  buildSourceAudioNodePayload,
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
  getNodeDefaultSize,
} from "../services/fileService.js";
import {
  localPathToUrl,
  normalizeLocalPath,
  pickResultLocalPath,
} from "../utils/localMediaPath.js";
import { buildLocalAudioGenerationResultPatch } from "../components/audio-node/audioGenerationResultRenderer.js";
import { buildVideoGenerationResultPatch } from "../components/video-node/videoGenerationResultRenderer.js";
import { commit } from "./history.js";
import { getNodeSpawnPrefs } from "./nodeSpawn.js";
let _separateVideoAudioImpl = separateVideoAudio;
function _getState() {
  return typeof appStore["getStateRaw"] === "function"
    ? appStore["getStateRaw"]()
    : appStore["getState"]();
}
function _getNode(v0) {
  return _getState()["nodes"]?.[v0] || null;
}
function _isVideoNodeType(v1) {
  const v2 = String(v1 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v2 === "source-video" || v2 === "ai-video" || v2 === "video";
}
function _cleanLocalPath(v3) {
  return normalizeLocalPath(v3);
}
function _resolveSourcePath(v4) {
  return _cleanLocalPath(resolveCanvasVideoLocalPath(v4));
}
function _getResultLocalPath(v5) {
  return pickResultLocalPath(v5);
}
function _fileNameFromPath(v6) {
  const v7 = _cleanLocalPath(v6);
  if (!v7) return "";
  const v8 = v7["split"]("/");
  return String(v8[v8["length"] - 1] || "")["trim"]();
}
function _getSpawnLayout(v9) {
  const {
      spacing: v10,
      direction: v11,
      avoidOverlap: v12,
    } = getNodeSpawnPrefs(),
    v13 = v11 === "down" ? "down" : "right",
    v14 = Math["max"](24, Math["min"](80, Math["round"](Number(v10 || 0) / 2))),
    v15 = getAutoMediaSizeByShortSide(
      Number(v9?.["width"]) || 512,
      Number(v9?.["height"]) || 288,
    ),
    v16 = getNodeDefaultSize("source-audio"),
    v17 = Number(v9?.["x"]) || 0,
    v18 = Number(v9?.["y"]) || 0,
    v19 = Number(v9?.["width"]) || 512,
    v20 = Number(v9?.["height"]) || 288;
  let v21 =
      v13 === "right"
        ? v17 + v19 + v10
        : v17 +
          Math["round"]((v19 - Math["max"](v15["width"], v16["width"])) / 2),
    v22 =
      v13 === "down"
        ? v18 + v20 + v10
        : v18 +
          Math["round"]((v20 - Math["max"](v15["height"], v16["height"])) / 2);
  const v23 =
      v13 === "right"
        ? v15["width"] + v16["width"] + v14
        : Math["max"](v15["width"], v16["width"]),
    v24 =
      v13 === "down"
        ? v15["height"] + v16["height"] + v14
        : Math["max"](v15["height"], v16["height"]);
  if (v12) {
    const v25 = findAvailablePosition(
      _getState()["nodes"] || {},
      v21,
      v22,
      v23,
      v24,
      v10,
      v13,
    );
    ((v21 = v25["x"]), (v22 = v25["y"]));
  }
  return {
    video: { x: v21, y: v22, width: v15["width"], height: v15["height"] },
    audio:
      v13 === "right"
        ? {
            x: v21 + v15["width"] + v14,
            y: v22 + Math["round"]((v15["height"] - v16["height"]) / 2),
            width: v16["width"],
            height: v16["height"],
          }
        : {
            x: v21 + Math["round"]((v15["width"] - v16["width"]) / 2),
            y: v22 + v15["height"] + v14,
            width: v16["width"],
            height: v16["height"],
          },
  };
}
function _focusCreatedNodes(v26, v27) {
  const v28 = Array["isArray"](v27)
    ? v27["map"]((v29) => String(v29 || "")["trim"]())["filter"](Boolean)
    : [];
  if (!v28["length"]) return;
  appStore["setSelectedNodes"](v28);
  if (typeof window["v2FocusOnNodes"] === "function")
    window["v2FocusOnNodes"]([v26, ...v28]);
  else
    typeof window["v2FocusOnNode"] === "function" &&
      window["v2FocusOnNode"](v28[0]);
}
function _persistLocalCache() {
  try {
    window["_triggerLocalCacheSave"]?.();
  } catch {}
}
function _createResultNodes(v30, v31) {
  const v32 = _getResultLocalPath(v31?.["video"]),
    v33 = _getResultLocalPath(v31?.["audio"]);
  if (!v32 || !v33) throw new Error("音画分离返回结果不完整");
  const v34 = _getSpawnLayout(v30),
    v35 = String(v30?.["name"] || "")["trim"]() || "视频",
    v36 = generateId("source-video-separate-av"),
    v37 = generateId("source-audio-separate-av"),
    v38 = v31?.["video"]?.["filename"] || _fileNameFromPath(v32),
    v39 = v31?.["audio"]?.["filename"] || _fileNameFromPath(v33),
    v40 =
      buildVideoGenerationResultPatch({
        localPath: v32,
        videoUrl: v31?.["video"]?.["url"],
        fileName: v38,
      }) || {},
    v41 =
      buildLocalAudioGenerationResultPatch({
        localPath: v33,
        audioUrl: v31?.["audio"]?.["url"],
        fileName: v39,
      }) || {},
    v42 = buildSourceMediaNodePayload({
      id: v36,
      type: "source-video",
      x: v34["video"]["x"],
      y: v34["video"]["y"],
      width: v34["video"]["width"],
      height: v34["video"]["height"],
      name: "画面自 " + v35,
      ...v40,
      src: localPathToUrl(v40["localPath"]) || v40["videoUrl"] || "",
      fileName: v38,
      needsAutoResize: false,
      fixedSize: true,
    }),
    v43 = buildSourceAudioNodePayload({
      id: v37,
      x: v34["audio"]["x"],
      y: v34["audio"]["y"],
      width: v34["audio"]["width"],
      height: v34["audio"]["height"],
      name: "音频自 " + v35,
      ...v41,
      fileName: v39,
    });
  return (
    typeof appStore["batch"] === "function"
      ? appStore["batch"](() => {
          (appStore["addNode"](v42), appStore["addNode"](v43));
        })
      : (appStore["addNode"](v42), appStore["addNode"](v43)),
    { videoId: v36, audioId: v37 }
  );
}
export async function runVideoAudioSeparationFromNode(v44) {
  const v45 = _getNode(v44);
  if (!v45 || !_isVideoNodeType(v45["type"]))
    return (window["showToast"]?.("当前节点不支持音画分离", "warn"), null);
  if (v45["isGenerating"])
    return (
      window["showToast"]?.("当前视频正在处理中，请稍后再试", "info"),
      null
    );
  const v46 = _resolveSourcePath(v45);
  if (!v46)
    return (
      window["showToast"]?.("当前视频不是可处理的本地文件", "warn"),
      null
    );
  window["showToast"]?.("正在音画分离...", "info");
  try {
    const v47 = await _separateVideoAudioImpl({ src: v46 }),
      { videoId: v48, audioId: v49 } = _createResultNodes(v45, v47);
    return (
      _focusCreatedNodes(v45["id"], [v48, v49]),
      commit(),
      _persistLocalCache(),
      window["showToast"]?.("音画分离完成，已生成画面和音频节点", "success"),
      { videoId: v48, audioId: v49 }
    );
  } catch (v50) {
    const v51 =
      v50 instanceof Error ? v50["message"] : String(v50 || "音画分离失败");
    return (window["showToast"]?.("音画分离失败:\x20" + v51, "error"), null);
  }
}
export function __setVideoAudioSeparationDepsForTest({
  separateVideoAudioImpl: v52,
} = {}) {
  _separateVideoAudioImpl =
    typeof v52 === "function" ? v52 : separateVideoAudio;
}
export function __resetVideoAudioSeparationDepsForTest() {
  _separateVideoAudioImpl = separateVideoAudio;
}
