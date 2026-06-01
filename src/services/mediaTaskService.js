import appStore from "../core/stores/appStore.js";
import {
  buildCanvasLocalAudioFields,
  buildCanvasLocalVideoFields,
} from "./canvasMediaLocalService.js";
import { logDiagnosticEvent } from "./diagnosticsService.js";
let installed = false;
function normalizeStatus(v0) {
  return String(v0 || "")["trim"]();
}
function buildStatusPatch(v1 = {}) {
  const v2 = normalizeStatus(v1["status"]),
    v3 = {
      mediaTaskId: String(v1["taskId"] || ""),
      mediaTaskKind: String(v1["kind"] || ""),
      mediaTaskStatus: v2,
      mediaTaskProgress: Number(v1["progress"] || 0) || 0,
      mediaTaskError: String(v1["error"] || ""),
    };
  if (v2 === "waiting" || v2 === "processing")
    ((v3["isGenerating"] = true),
      (v3["jobStatus"] = "running"),
      (v3["jobError"] = null));
  else {
    if (v2 === "complete")
      ((v3["isGenerating"] = false),
        (v3["jobStatus"] = "success"),
        (v3["jobError"] = null));
    else {
      if (v2 === "failed")
        ((v3["isGenerating"] = false),
          (v3["jobStatus"] = "error"),
          (v3["jobError"] = v3["mediaTaskError"] || "Media task failed"),
          void logDiagnosticEvent({
            type: "generation.media_task_failed",
            level: "error",
            source: "renderer",
            message: v3["jobError"],
            context: {
              taskId: v3["mediaTaskId"],
              kind: v3["mediaTaskKind"],
              nodeId: v1["nodeId"] || "",
              assetId: v1["assetId"] || "",
            },
          }));
      else
        v2 === "cancelled" &&
          ((v3["isGenerating"] = false),
          (v3["jobStatus"] = null),
          (v3["jobError"] = null));
    }
  }
  return v3;
}
function buildResultPatch(v4 = {}) {
  const v5 =
      v4["result"] && typeof v4["result"] === "object" ? v4["result"] : {},
    v6 = String(v4["kind"] || "");
  if (!v5 || Object["keys"](v5)["length"] === 0) return {};
  if (v6 === "videoPoster" || v6 === "videoFirstFrame") {
    const v7 = buildCanvasLocalVideoFields({
      ...(v6 === "videoPoster" && v5["displayLocalPath"]
        ? { displayLocalPath: v5["displayLocalPath"] }
        : {}),
      ...(v6 === "videoPoster"
        ? {
            videoProxyStatus: v5["videoProxyStatus"] || "",
            videoCodec: v5["videoCodec"] || "",
          }
        : {}),
      posterLocalPath:
        v5["posterLocalPath"] || v5["thumbLocalPath"] || v5["localPath"] || "",
      thumbUrl: v5["posterUrl"] || v5["thumbUrl"] || v5["url"] || "",
      videoThumbSrc: v5["src"] || "",
    });
    if (v6 === "videoPoster") v7["capturePreviewUrl"] = "";
    return v7;
  }
  if (v6 === "audioWaveform")
    return buildCanvasLocalAudioFields({
      waveformLocalPath: v5["waveformLocalPath"] || "",
    });
  return {};
}
function getMatchingNodeIds(v8 = {}) {
  const v9 =
      typeof appStore["getStateRaw"] === "function"
        ? appStore["getStateRaw"]()
        : appStore["getState"](),
    v10 = v9?.["nodes"] || {},
    v11 = String(v8["nodeId"] || "")["trim"]();
  if (v11 && v10[v11]) return [v11];
  const v12 = String(v8["assetId"] || "")["trim"]();
  if (!v12) return [];
  return Object["values"](v10)
    ["filter"]((v13) => String(v13?.["assetId"] || "")["trim"]() === v12)
    ["map"]((v14) => v14["id"])
    ["filter"](Boolean);
}
function applyMediaTaskUpdate(v15 = {}) {
  const v16 = getMatchingNodeIds(v15);
  if (!v16["length"]) return;
  const v17 = {
      ...buildStatusPatch(v15),
      ...(normalizeStatus(v15["status"]) === "complete"
        ? buildResultPatch(v15)
        : {}),
    },
    v18 = {};
  v16["forEach"]((v19) => {
    v18[v19] = v17;
  });
  if (typeof appStore["updateNodesData"] === "function" && v16["length"] > 1) {
    appStore["updateNodesData"](v18);
    return;
  }
  v16["forEach"]((v20) => appStore["updateNodeData"](v20, v17));
}
export function installMediaTaskUpdateListener() {
  if (installed) return;
  installed = true;
  const v21 =
    globalThis["window"]?.["electronAPI"]?.["mediaTask"]?.["onUpdate"];
  if (typeof v21 !== "function") return;
  v21((v22) => {
    try {
      applyMediaTaskUpdate(v22 || {});
    } catch (v23) {
      console["warn"](
        "[mediaTaskService]\x20failed\x20to\x20apply\x20media\x20task\x20update:",
        v23,
      );
    }
  });
}
export function __buildMediaTaskStatusPatchForTest(v24 = {}) {
  return buildStatusPatch(v24);
}
export function __buildMediaTaskResultPatchForTest(v25 = {}) {
  return buildResultPatch(v25);
}
