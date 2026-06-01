import { logDiagnosticEvent } from "../src/services/diagnosticsService.js";
import { normalizeLocalPath } from "../src/utils/localMediaPath.js";
import { requester } from "./requester.js";
const TERMINAL_STATUSES = new Set(["complete", "failed", "cancelled"]),
  DIAGNOSTIC_SRC_TAIL_LENGTH = 96,
  SOURCE_REQUIRED_KINDS = new Set([
    "audioCut",
    "audioWaveform",
    "videoAudioSeparate",
    "videoCut",
    "mediaClipExport",
    "videoFirstFrame",
    "videoPoster",
  ]),
  MULTI_SOURCE_KINDS = new Set(["videoCompose", "audioCompose"]);
function toMessage(v0, v1 = "Media task failed") {
  if (typeof v0 === "string") return v0;
  if (v0?.["message"]) return String(v0["message"]);
  return String(v0 || v1);
}
function normalizeDiagnosticSrc(v2) {
  const v3 = String(v2 || "")["trim"]();
  return v3;
}
function digestDiagnosticSrc(v4) {
  const v5 = normalizeDiagnosticSrc(v4);
  if (!v5) return "";
  let v6 = 2166136261;
  for (let v7 = 0; v7 < v5["length"]; v7 += 1) {
    ((v6 ^= v5["charCodeAt"](v7)), (v6 = Math["imul"](v6, 16777619) >>> 0));
  }
  return v6["toString"](16)["padStart"](8, "0");
}
function summarizeDiagnosticSrc(v8) {
  const v9 = normalizeDiagnosticSrc(v8),
    v10 = v9["replace"](/\\/g, "/"),
    v11 = v10["split"]("/")["filter"](Boolean),
    v12 =
      v11["length"] > 2
        ? v11["slice"](-2)["join"]("/")
        : v11["join"]("/") || v10;
  return {
    srcDigest: digestDiagnosticSrc(v9),
    srcTail: v12 ? v12["slice"](-DIAGNOSTIC_SRC_TAIL_LENGTH) : "",
    srcLength: v9["length"],
  };
}
function firstDefined(...v13) {
  for (const v14 of v13) {
    if (v14 !== undefined && v14 !== null) return v14;
  }
  return "";
}
function normalizePayloadSrcs(v15 = {}) {
  return Array["isArray"](v15?.["srcs"])
    ? v15["srcs"]
    : Array["isArray"](v15?.["args"]?.["srcs"])
      ? v15["args"]["srcs"]
      : [];
}
function normalizeVirtualMediaSource(v16) {
  return normalizeLocalPath(v16);
}
function isValidMediaTaskSource(v17) {
  return !!normalizeVirtualMediaSource(v17);
}
function getPayloadSources(v18 = {}, v19 = undefined) {
  const v20 = normalizePayloadSrcs(v18),
    v21 =
      v19 !== undefined
        ? v19
        : firstDefined(
            v18?.["src"],
            v18?.["originalLocalPath"],
            v18?.["localPath"],
            v20[0],
          );
  return { ...summarizeDiagnosticSrc(v21), srcsCount: v20["length"] };
}
function validateMediaTaskSources(v22 = {}) {
  const v23 = String(v22?.["kind"] || "")["trim"](),
    v24 = normalizePayloadSrcs(v22),
    v25 = MULTI_SOURCE_KINDS["has"](v23) || v24["length"] > 0;
  if (v25) {
    const v26 = MULTI_SOURCE_KINDS["has"](v23) ? 2 : 1;
    if (v24["length"] < v26) return { index: 0, value: "", reason: "missing" };
    for (let v27 = 0; v27 < v24["length"]; v27 += 1) {
      if (!isValidMediaTaskSource(v24[v27]))
        return { index: v27, value: v24[v27], reason: "invalid" };
    }
    return null;
  }
  const v28 = firstDefined(
      v22?.["src"],
      v22?.["originalLocalPath"],
      v22?.["localPath"],
    ),
    v29 =
      v22?.["src"] !== undefined ||
      v22?.["originalLocalPath"] !== undefined ||
      v22?.["localPath"] !== undefined;
  if (!SOURCE_REQUIRED_KINDS["has"](v23) && !v29) return null;
  if (!isValidMediaTaskSource(v28))
    return {
      index: 0,
      value: v28,
      reason: normalizeDiagnosticSrc(v28) ? "invalid" : "missing",
    };
  if (v23 === "mediaClipExport") {
    const v30 = firstDefined(v22?.["args"]?.["audioSrc"], v22?.["audioSrc"]),
      v31 =
        v22?.["args"]?.["audioSrc"] !== undefined ||
        v22?.["audioSrc"] !== undefined;
    if (v31 && !isValidMediaTaskSource(v30))
      return {
        index: 1,
        value: v30,
        reason: normalizeDiagnosticSrc(v30) ? "invalid" : "missing",
      };
  }
  return null;
}
function buildDiagnosticContext(v32 = {}, v33 = {}) {
  const v34 = getPayloadSources(v32, v33["sourceValue"]),
    v35 = {
      taskId: String(v33["taskId"] || v32?.["taskId"] || ""),
      kind: String(v33["kind"] || v32?.["kind"] || ""),
      nodeId: String(v33["nodeId"] || v32?.["nodeId"] || ""),
      assetId: String(v33["assetId"] || v32?.["assetId"] || ""),
      srcDigest: v34["srcDigest"],
      srcTail: v34["srcTail"],
      srcLength: v34["srcLength"],
      srcsCount: v34["srcsCount"],
      status: String(v33["status"] || ""),
      error: toMessage(v33["error"] || ""),
    },
    v36 = Number(v33["invalidSourceIndex"]);
  return (Number["isFinite"](v36) && (v35["invalidSourceIndex"] = v36), v35);
}
function logMediaTaskFailure(v37, v38 = {}, v39 = {}) {
  void logDiagnosticEvent({
    type: v37,
    level: "error",
    source: "renderer",
    message: toMessage(v39["error"] || v39["status"] || v37),
    context: buildDiagnosticContext(v38, v39),
  });
}
function getMediaTaskBridge() {
  const v40 = globalThis["window"]?.["electronAPI"]?.["mediaTask"];
  if (
    typeof v40?.["enqueue"] === "function" &&
    typeof v40?.["cancel"] === "function" &&
    typeof v40?.["onUpdate"] === "function"
  )
    return v40;
  return null;
}
export function canUseElectronMediaTask() {
  return !!getMediaTaskBridge();
}
export function waitForElectronMediaTask(
  v41,
  { timeout: timeout = 0, diagnosticPayload: diagnosticPayload = {} } = {},
) {
  const v42 = getMediaTaskBridge(),
    v43 = String(v41 || "")["trim"]();
  if (!v42 || !v43) {
    const v44 = new Error("Electron media task API unavailable");
    return (
      logMediaTaskFailure("media_task.wait_failed", diagnosticPayload, {
        taskId: v43,
        status: !v42 ? "bridge_unavailable" : "missing_task_id",
        error: v44,
      }),
      Promise["reject"](v44)
    );
  }
  return new Promise((v45, v46) => {
    let v47 = false,
      v48 = null;
    const v49 = v42["onUpdate"]((v50) => {
      if (String(v50?.["taskId"] || "") !== v43) return;
      const v51 = String(v50?.["status"] || "");
      if (!TERMINAL_STATUSES["has"](v51)) return;
      if (v47) return;
      ((v47 = true), v49?.());
      if (v48) clearTimeout(v48);
      if (v51 === "complete") v45(v50?.["result"] || {});
      else {
        if (v51 === "cancelled") {
          const v52 = new Error("Media task cancelled");
          (logMediaTaskFailure("media_task.wait_failed", diagnosticPayload, {
            ...v50,
            taskId: v43,
            status: v51,
            error: v52,
          }),
            v46(v52));
        } else {
          const v53 = new Error(v50?.["error"] || "Media task failed");
          (logMediaTaskFailure("media_task.wait_failed", diagnosticPayload, {
            ...v50,
            taskId: v43,
            status: v51,
            error: v53,
          }),
            v46(v53));
        }
      }
    });
    timeout > 0 &&
      (v48 = setTimeout(() => {
        if (v47) return;
        ((v47 = true), v49?.());
        const v54 = new Error("Media task timeout");
        (logMediaTaskFailure("media_task.wait_failed", diagnosticPayload, {
          taskId: v43,
          status: "timeout",
          error: v54,
        }),
          v46(v54));
      }, timeout));
  });
}
export async function enqueueElectronMediaTask(v55 = {}, v56 = {}) {
  const v57 = getMediaTaskBridge();
  if (!v57) return null;
  const v58 = validateMediaTaskSources(v55);
  if (v58) {
    const v59 = new Error(
      v58["reason"] === "missing"
        ? "Missing media source path"
        : "Invalid media source path",
    );
    logMediaTaskFailure("media_task.enqueue_invalid_source", v55, {
      status: "invalid_source",
      error: v59,
      invalidSourceIndex: v58["index"],
      sourceValue: v58["value"],
    });
    throw v59;
  }
  let v60;
  try {
    v60 = await v57["enqueue"](v55);
  } catch (v61) {
    logMediaTaskFailure("media_task.enqueue_failed", v55, {
      status: "enqueue_failed",
      error: v61,
    });
    throw v61;
  }
  if (v56["wait"] === true) {
    const v62 = v60?.["taskId"] || v55?.["taskId"] || "";
    return await waitForElectronMediaTask(v62, {
      ...v56,
      diagnosticPayload: { ...v55, taskId: v62 },
    });
  }
  return v60;
}
export async function cancelElectronMediaTask(v63) {
  const v64 = getMediaTaskBridge();
  if (!v64) return { ok: false, error: "Electron media task API unavailable" };
  return await v64["cancel"]({ taskId: v63 });
}
function buildBackendBodyFromElectronPayload(v65 = {}) {
  const v66 = String(v65?.["kind"] || "")["trim"](),
    v67 = v65?.["args"] || {};
  if (v66 === "audioCut")
    return {
      src: v65["src"],
      start: v67["start"] ?? v65["start"],
      end: v67["end"] ?? v65["end"],
    };
  return {
    src: v65["src"],
    start:
      v67["videoStart"] ?? v67["start"] ?? v65["videoStart"] ?? v65["start"],
    end: v67["videoEnd"] ?? v67["end"] ?? v65["videoEnd"] ?? v65["end"],
    audioSrc: v67["audioSrc"] ?? v65["audioSrc"],
    audioStart: v67["audioStart"] ?? v65["audioStart"],
    audioEnd: v67["audioEnd"] ?? v65["audioEnd"],
    fps: v67["fps"] ?? v65["fps"],
  };
}
export async function runLocalMediaClipExport(v68 = {}, v69 = {}) {
  const v70 = v68?.["electronPayload"] || v68,
    v71 =
      v68?.["outputType"] === "audio" || v70?.["kind"] === "audioCut"
        ? "audio"
        : "video",
    v72 = Number(v69["timeout"] || 0) || 600000;
  if (canUseElectronMediaTask())
    return await enqueueElectronMediaTask(v70, { wait: true, timeout: v72 });
  const v73 = v68?.["backendBody"] || buildBackendBodyFromElectronPayload(v70),
    v74 = await requester({
      url: v71 === "audio" ? "/api/v2/audio/cut" : "/api/v2/video/clip_export",
      method: "POST",
      provider: "local",
      headers: { "Content-Type": "application/json" },
      body: JSON["stringify"](v73),
      timeout: v72,
      allow404Null: true,
      returnMeta: true,
    });
  if (!v74?.["data"])
    throw new Error("Local media clip export API unavailable");
  return v74["data"];
}
