import {
  resumeAudioSeparationTask,
  runAudioSeparation,
} from "../../api/aiAudioApi.js";
import { ensureConfig, getProviderConfig } from "../../api/configApi.js";
import { cancelRunningHubTask } from "../../api/runninghubTaskApi.js";
import { buildGenerationStartPatch } from "../core/generationTaskLifecycle.js";
import { findAvailablePosition, generateId } from "../core/math.js";
import appStore from "../core/stores/appStore.js";
import {
  buildCanvasLocalAudioFields,
  resolveCanvasAudioUrl,
} from "../services/canvasMediaLocalService.js";
import {
  buildSourceAudioNodePayload,
  getNodeDefaultSize,
} from "../services/fileService.js";
import { saveRemoteAudioLocallyDetailed } from "../services/projectService.js";
import {
  normalizeLocalPath,
  pickResultLocalPath,
} from "../utils/localMediaPath.js";
import {
  RH_AUDIO_SEPARATION_MODEL_ID,
  resolveModelExecution,
} from "../manifests/index.js";
import { buildLocalAudioGenerationResultPatch } from "../components/audio-node/audioGenerationResultRenderer.js";
import { getNodeSpawnPrefs } from "./nodeSpawn.js";
const AUDIO_SPLIT_MODEL_ID = RH_AUDIO_SEPARATION_MODEL_ID,
  AUDIO_SPLIT_ROLE_VOCALS = "vocals",
  AUDIO_SPLIT_ROLE_BACKGROUND = "background";
function _resolveAudioSplitModelId() {
  const v0 = resolveModelExecution(AUDIO_SPLIT_MODEL_ID),
    v1 = String(v0?.["modelManifest"]?.["modelId"] || "")["trim"]();
  if (!v1)
    throw new Error(
      "RunningHub audio workflow manifest missing: " + AUDIO_SPLIT_MODEL_ID,
    );
  return v1;
}
const AUDIO_SPLIT_MODEL = _resolveAudioSplitModelId();
let _runAudioSeparationImpl = runAudioSeparation,
  _resumeAudioSeparationTaskImpl = resumeAudioSeparationTask,
  _saveRemoteAudioLocallyDetailedImpl = saveRemoteAudioLocallyDetailed;
const _runtimeByLeaderId = new Map();
function _getState() {
  return typeof appStore["getStateRaw"] === "function"
    ? appStore["getStateRaw"]()
    : appStore["getState"]();
}
function _getNode(v2) {
  return _getState()["nodes"]?.[v2] || null;
}
function _isAudioNodeType(v3) {
  const v4 = String(v3 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v4 === "source-audio" || v4 === "ai-audio" || v4 === "audio";
}
function _fileNameFromPath(v5) {
  const v6 = normalizeLocalPath(v5);
  if (!v6) return "";
  const v7 = v6["split"]("/");
  return String(v7[v7["length"] - 1] || "")["trim"]();
}
function _buildRunningHubTaskPatch({
  taskId: taskId = "",
  status: status = "pending",
  startedAt: startedAt = 0,
  recovering: recovering = false,
  useOpenapiQuery: useOpenapiQuery = true,
} = {}) {
  return {
    rhTaskId: String(taskId || "")["trim"](),
    rhTaskStatus: String(status || "pending")["trim"]() || "pending",
    rhTaskStartedAt: Number(startedAt || 0),
    rhTaskRecovering: recovering === true,
    rhTaskUseOpenapiQuery: useOpenapiQuery === true,
  };
}
function _isAudioSplitLeader(v8) {
  if (!v8 || typeof v8 !== "object") return false;
  return (
    String(v8["type"] || "")
      ["trim"]()
      ["toLowerCase"]() === "source-audio" &&
    String(v8["audioSplitRole"] || "")
      ["trim"]()
      ["toLowerCase"]() === AUDIO_SPLIT_ROLE_VOCALS &&
    String(v8["provider"] || "")
      ["trim"]()
      ["toLowerCase"]() === "runninghubwf" &&
    String(v8["model"] || "")["trim"]() === AUDIO_SPLIT_MODEL &&
    !!String(v8["audioSplitPeerId"] || "")["trim"]()
  );
}
function _isRunningTaskStatus(v9) {
  const v10 = String(v9 || "")
    ["trim"]()
    ["toLowerCase"]();
  return !["success", "failed", "idle", "cancelled"]["includes"](v10);
}
function _resolveAudioSplitLeaderId(v11) {
  const v12 = String(v11 || "")["trim"]();
  if (!v12) return "";
  const v13 = _getNode(v12);
  if (_isAudioSplitLeader(v13)) return v12;
  const v14 = String(v13?.["audioSplitPeerId"] || "")["trim"]();
  if (v14 && _isAudioSplitLeader(_getNode(v14))) return v14;
  const v15 = _getState()["nodes"] || {},
    v16 = Object["values"](v15)["find"](
      (v17) =>
        _isAudioSplitLeader(v17) &&
        (String(v17["audioSplitPeerId"] || "") === v12 ||
          String(v17["rhSourceNodeId"] || "") === v12),
    );
  return String(v16?.["id"] || "");
}
function _getSpawnLayout(v18) {
  const v19 = getNodeDefaultSize("source-audio"),
    v20 = Number(v18?.["width"]) > 0 ? Number(v18["width"]) : v19["width"],
    v21 = Number(v18?.["height"]) > 0 ? Number(v18["height"]) : v19["height"],
    { spacing: v22, direction: v23, avoidOverlap: v24 } = getNodeSpawnPrefs(),
    v25 = v23 === "down" ? "down" : "right",
    v26 = Math["max"](24, Math["min"](80, Math["round"](v22 / 2))),
    v27 = Number(v18?.["x"]) || 0,
    v28 = Number(v18?.["y"]) || 0,
    v29 = Number(v18?.["width"]) || v19["width"],
    v30 = Number(v18?.["height"]) || v19["height"];
  let v31 =
      v25 === "right" ? v27 + v29 + v22 : v27 + Math["round"]((v29 - v20) / 2),
    v32 =
      v25 === "down" ? v28 + v30 + v22 : v28 + Math["round"]((v30 - v21) / 2);
  const v33 = v25 === "right" ? v20 * 2 + v26 : v20,
    v34 = v25 === "down" ? v21 * 2 + v26 : v21;
  if (v24) {
    const v35 = findAvailablePosition(
      _getState()["nodes"] || {},
      v31,
      v32,
      v33,
      v34,
      v22,
      v25,
    );
    ((v31 = v35["x"]), (v32 = v35["y"]));
  }
  return {
    width: v20,
    height: v21,
    resolvedDirection: v25,
    innerGap: v26,
    vocals: { x: v31, y: v32 },
    background:
      v25 === "right"
        ? { x: v31 + v20 + v26, y: v32 }
        : { x: v31, y: v32 + v21 + v26 },
  };
}
async function _persistAudioResult(v36) {
  const v37 = await _saveRemoteAudioLocallyDetailedImpl(v36),
    v38 = pickResultLocalPath(v37),
    v39 = String(v37?.["localUrl"] || v37?.["audioUrl"] || "")["trim"](),
    v40 = buildCanvasLocalAudioFields({ localPath: v38, audioUrl: v39 });
  if (!v40["audioUrl"] || !v40["localPath"])
    throw new Error("已生成但本地保存失败");
  return { ...v40, fileName: _fileNameFromPath(v40["localPath"]) };
}
function _updateNodeIfExists(v41, v42) {
  if (!String(v41 || "")["trim"]()) return;
  if (!_getNode(v41)) return;
  appStore["updateNodeData"](v41, v42);
}
function _focusCreatedNodes(v43, v44) {
  const v45 = Array["isArray"](v44)
    ? v44["map"]((v46) => String(v46 || "")["trim"]())["filter"](Boolean)
    : [];
  if (!v45["length"]) return;
  appStore["setSelectedNodes"](v45);
  if (typeof window["v2FocusOnNodes"] === "function")
    window["v2FocusOnNodes"]([v43, ...v45]);
  else
    typeof window["v2FocusOnNode"] === "function" &&
      window["v2FocusOnNode"](v45[0]);
}
function _persistLocalCache() {
  try {
    window["_triggerLocalCacheSave"]?.();
  } catch {}
}
function _resolveSeparationResultUrls(v47) {
  const v48 = Array["isArray"](v47?.["audios"]) ? v47["audios"] : [],
    v49 = String(
      v47?.["vocalsAudioUrl"] ||
        v48["find"](
          (v50) =>
            String(v50?.["role"] || "")
              ["trim"]()
              ["toLowerCase"]() === "vocals" ||
            String(v50?.["nodeId"] || "")["trim"]() === "5",
        )?.["audioUrl"] ||
        v48[0]?.["audioUrl"] ||
        "",
    )["trim"](),
    v51 = String(
      v47?.["backgroundAudioUrl"] ||
        v48["find"](
          (v52) =>
            String(v52?.["role"] || "")
              ["trim"]()
              ["toLowerCase"]() === "background" ||
            String(v52?.["nodeId"] || "")["trim"]() === "7",
        )?.["audioUrl"] ||
        v48[1]?.["audioUrl"] ||
        "",
    )["trim"]();
  return { vocalsUrl: v49, backgroundUrl: v51 };
}
function _createPlaceholderPair(v53) {
  const v54 = _getSpawnLayout(v53),
    v55 = Date["now"](),
    v56 = generateId("source-audio-split-vocals"),
    v57 = generateId("source-audio-split-background"),
    v58 = buildSourceAudioNodePayload({
      id: v56,
      x: v54["vocals"]["x"],
      y: v54["vocals"]["y"],
      width: v54["width"],
      height: v54["height"],
      name: "人声 (处理中)",
      audioSplitRole: AUDIO_SPLIT_ROLE_VOCALS,
      audioSplitPeerId: v57,
      rhSourceNodeId: v53["id"],
      rhToolbarTaskType: "audio-separation",
      provider: "runninghubwf",
      model: AUDIO_SPLIT_MODEL,
      rhInstanceType:
        String(v53?.["rhInstanceType"] || "")["trim"]() === "plus"
          ? "plus"
          : "default",
      ...buildGenerationStartPatch({ startedAt: v55 }),
      ..._buildRunningHubTaskPatch({
        taskId: "",
        status: "pending",
        startedAt: v55,
        recovering: false,
        useOpenapiQuery: true,
      }),
    }),
    v59 = buildSourceAudioNodePayload({
      id: v57,
      x: v54["background"]["x"],
      y: v54["background"]["y"],
      width: v54["width"],
      height: v54["height"],
      name: "背景声 (处理中)",
      audioSplitRole: AUDIO_SPLIT_ROLE_BACKGROUND,
      audioSplitPeerId: v56,
      rhSourceNodeId: v53["id"],
      rhToolbarTaskType: "audio-separation",
      ...buildGenerationStartPatch({ startedAt: v55 }),
    });
  return (
    appStore["batch"](() => {
      (appStore["addNode"](v58), appStore["addNode"](v59));
    }),
    _focusCreatedNodes(v53["id"], [v56, v57]),
    _persistLocalCache(),
    { leaderId: v56, peerId: v57, startedAt: v55 }
  );
}
async function _applySuccessResult({
  leaderId: v60,
  peerId: v61,
  result: v62,
  startedAt: v63,
}) {
  const { vocalsUrl: v64, backgroundUrl: v65 } =
    _resolveSeparationResultUrls(v62);
  if (!v64 || !v65)
    throw new Error("任务已完成，但未提取到人声和背景声音频地址");
  const [v66, v67] = await Promise["all"]([
      _persistAudioResult(v64),
      _persistAudioResult(v65),
    ]),
    v68 = _getNode(v60),
    v69 = String(v68?.["rhTaskId"] || v62?.["taskId"] || "")["trim"]();
  (appStore["batch"](() => {
    (_updateNodeIfExists(v60, {
      name: "人声",
      ...buildLocalAudioGenerationResultPatch(v66, { startedAt: v63 }),
      ..._buildRunningHubTaskPatch({
        taskId: v69,
        status: "success",
        startedAt: v63,
        recovering: false,
        useOpenapiQuery: true,
      }),
    }),
      _updateNodeIfExists(v61, {
        name: "背景声",
        ...buildLocalAudioGenerationResultPatch(v67, { startedAt: v63 }),
      }));
  }),
    _persistLocalCache(),
    window["showToast"]?.("人声分离完成", "success"));
}
function _buildEmptyAudioFields() {
  return buildCanvasLocalAudioFields({
    localPath: "",
    audioUrl: "",
    fileName: "",
  });
}
function _applyFailureResult({
  leaderId: v70,
  peerId: v71,
  startedAt: v72,
  message: v73,
}) {
  const v74 = String(v73 || "人声分离失败")["trim"]() || "人声分离失败",
    v75 = _getNode(v70),
    v76 = _buildEmptyAudioFields();
  (appStore["batch"](() => {
    (_updateNodeIfExists(v70, {
      name: "人声 (失败)",
      ...buildLocalAudioGenerationResultPatch(
        { error: v74 },
        { startedAt: v72 },
      ),
      ...v76,
      rhStatusMessage: v74,
      rhStatusCode: null,
      ..._buildRunningHubTaskPatch({
        taskId: String(v75?.["rhTaskId"] || "")["trim"](),
        status: "failed",
        startedAt: v72,
        recovering: false,
        useOpenapiQuery: true,
      }),
    }),
      _updateNodeIfExists(v71, {
        name: "背景声 (失败)",
        ...buildLocalAudioGenerationResultPatch(
          { error: v74 },
          { startedAt: v72 },
        ),
        ...v76,
      }));
  }),
    _persistLocalCache(),
    window["showToast"]?.("人声分离失败: " + v74, "error"));
}
async function _executeTask({
  leaderId: v77,
  peerId: v78,
  sourceAudioUrl: v79,
  rhInstanceType: rhInstanceType = "default",
  startedAt: v80,
  resume: resume = false,
  runtime: v81,
}) {
  const v82 = (v83) => {
    const v84 = _runtimeByLeaderId["get"](v77) || {};
    _runtimeByLeaderId["set"](v77, {
      ...v84,
      taskId: String(v83 || "")["trim"](),
    });
  };
  try {
    let v85 = null;
    if (resume) {
      const v86 = _getNode(v77),
        v87 = String(v86?.["rhTaskId"] || v81["taskId"] || "")["trim"]();
      if (!v87) throw new Error("缺少\x20RunningHub\x20音频任务ID");
      v85 = await _resumeAudioSeparationTaskImpl(
        v87,
        { rhInstanceType: rhInstanceType },
        { signal: v81["abortController"]?.["signal"] },
      );
    } else
      (window["showToast"]?.("正在提交\x20RH\x20人声分离任务...", "info"),
        (v85 = await _runAudioSeparationImpl(
          { nodeId: v77, audioUrl: v79, rhInstanceType: rhInstanceType },
          {
            signal: v81["abortController"]?.["signal"],
            onTaskMeta: ({ taskId: v88, useOpenapiQuery: v89 }) => {
              (v82(v88),
                _updateNodeIfExists(v77, {
                  ..._buildRunningHubTaskPatch({
                    taskId: v88,
                    status: "pending",
                    startedAt: v80,
                    recovering: false,
                    useOpenapiQuery: v89 === true,
                  }),
                }),
                _persistLocalCache());
            },
            onTaskId: (v90) => {
              (v82(v90),
                _updateNodeIfExists(v77, {
                  ..._buildRunningHubTaskPatch({
                    taskId: v90,
                    status: "pending",
                    startedAt: v80,
                    recovering: false,
                    useOpenapiQuery: true,
                  }),
                }),
                _persistLocalCache());
            },
          },
        )));
    await _applySuccessResult({
      leaderId: v77,
      peerId: v78,
      result: v85,
      startedAt: v80,
    });
  } catch (v91) {
    if (v81["abortController"]?.["signal"]?.["aborted"]) return;
    const v92 =
      v91 instanceof Error ? v91["message"] : String(v91 || "人声分离失败");
    _applyFailureResult({
      leaderId: v77,
      peerId: v78,
      startedAt: v80,
      message: v92,
    });
  } finally {
    const v93 = _runtimeByLeaderId["get"](v77);
    v93?.["promise"] === v81["promise"] && _runtimeByLeaderId["delete"](v77);
  }
}
export async function runAudioSeparationFromNode(v94) {
  const v95 = _getNode(v94);
  if (!v95 || !_isAudioNodeType(v95["type"]))
    return (window["showToast"]?.("当前节点不支持人声分离", "warn"), null);
  if (v95["isGenerating"])
    return (
      window["showToast"]?.("当前音频正在处理中，请稍后再试", "info"),
      null
    );
  const v96 = resolveCanvasAudioUrl(v95);
  if (!v96)
    return (window["showToast"]?.("当前节点还没有可用音频", "warn"), null);
  const {
      leaderId: v97,
      peerId: v98,
      startedAt: v99,
    } = _createPlaceholderPair(v95),
    v100 = {
      abortController: new AbortController(),
      promise: null,
      taskId: "",
    };
  _runtimeByLeaderId["set"](v97, v100);
  const v101 = _executeTask({
    leaderId: v97,
    peerId: v98,
    sourceAudioUrl: v96,
    rhInstanceType: v95?.["rhInstanceType"] || "default",
    startedAt: v99,
    resume: false,
    runtime: v100,
  });
  return (
    (v100["promise"] = v101),
    _runtimeByLeaderId["set"](v97, v100),
    await v101,
    { leaderId: v97, peerId: v98 }
  );
}
export function getRunningAudioSeparationTaskForNode(v102) {
  const v103 = _resolveAudioSplitLeaderId(v102);
  if (!v103) return null;
  const v104 = _getNode(v103);
  if (!_isAudioSplitLeader(v104)) return null;
  if (!_isRunningTaskStatus(v104?.["rhTaskStatus"])) return null;
  return {
    sourceNodeId: String(v104["rhSourceNodeId"] || ""),
    outId: v103,
    peerId: String(v104["audioSplitPeerId"] || ""),
    taskId: String(
      v104["rhTaskId"] || _runtimeByLeaderId["get"](v103)?.["taskId"] || "",
    ),
    mode: "audio-separation",
  };
}
export function hasRunningAudioSeparationTaskForNode(v105) {
  return !!getRunningAudioSeparationTaskForNode(v105);
}
async function _resolveRunningHubWorkflowApiKey() {
  try {
    return (
      await ensureConfig(),
      String(getProviderConfig("runninghubwf")?.["apiKey"] || "")["trim"]()
    );
  } catch {
    return "";
  }
}
export async function cancelAudioSeparationTaskForNode(
  v106,
  { notify: notify = false } = {},
) {
  const v107 = getRunningAudioSeparationTaskForNode(v106);
  if (!v107?.["outId"]) return false;
  const v108 = v107["outId"],
    v109 = v107["peerId"],
    v110 = _runtimeByLeaderId["get"](v108);
  try {
    v110?.["abortController"]?.["abort"]?.();
  } catch {}
  _runtimeByLeaderId["delete"](v108);
  const v111 = _getNode(v108),
    v112 =
      Number(v111?.["generationStartTime"] || v111?.["rhTaskStartedAt"] || 0) ||
      Date["now"](),
    v113 = Date["now"]() - v112,
    v114 = _buildEmptyAudioFields();
  (appStore["batch"](() => {
    (_updateNodeIfExists(v108, {
      name: "人声 (已取消)",
      ...v114,
      isGenerating: false,
      jobStatus: null,
      jobError: null,
      generationDuration: v113,
      rhTaskStatus: "cancelled",
      rhTaskRecovering: false,
      rhStatusMessage: null,
    }),
      _updateNodeIfExists(v109, {
        name: "背景声 (已取消)",
        ...v114,
        isGenerating: false,
        jobStatus: null,
        jobError: null,
        generationDuration: v113,
      }));
  }),
    _persistLocalCache());
  const v115 = await _resolveRunningHubWorkflowApiKey();
  if (v115 && v107["taskId"])
    try {
      await cancelRunningHubTask({ apiKey: v115, taskId: v107["taskId"] });
    } catch (v116) {
      console["warn"](
        "[AudioSeparationController] cancel request failed:",
        v116,
      );
    }
  if (notify) window["showToast"]?.("已取消人声分离任务", "info");
  return true;
}
export function maybeResumeAudioSeparationLeader(v117) {
  const v118 = _getNode(v117);
  if (!_isAudioSplitLeader(v118)) return null;
  if (!_isRunningTaskStatus(v118?.["rhTaskStatus"])) return null;
  const v119 = String(v118?.["rhTaskId"] || "")["trim"]();
  if (!v119) return null;
  const v120 = _runtimeByLeaderId["get"](v117);
  if (v120?.["promise"] && v120["taskId"] === v119) return v120["promise"];
  const v121 =
    Number(v118?.["rhTaskStartedAt"] || v118?.["generationStartTime"] || 0) ||
    Date["now"]();
  (appStore["batch"](() => {
    (_updateNodeIfExists(v117, {
      ...buildGenerationStartPatch({ startedAt: v121 }),
      ..._buildRunningHubTaskPatch({
        taskId: v119,
        status:
          String(v118?.["rhTaskStatus"] || "")
            ["trim"]()
            ["toLowerCase"]() === "pending"
            ? "pending"
            : "running",
        startedAt: v121,
        recovering: true,
        useOpenapiQuery: v118?.["rhTaskUseOpenapiQuery"] === true,
      }),
    }),
      _updateNodeIfExists(v118?.["audioSplitPeerId"], {
        ...buildGenerationStartPatch({ startedAt: v121 }),
        jobError: null,
      }));
  }),
    _persistLocalCache());
  const v122 = {
    abortController: new AbortController(),
    promise: null,
    taskId: v119,
  };
  _runtimeByLeaderId["set"](v117, v122);
  const v123 = _executeTask({
    leaderId: v117,
    peerId: v118["audioSplitPeerId"],
    sourceAudioUrl: "",
    rhInstanceType: v118?.["rhInstanceType"] || "default",
    startedAt: v121,
    resume: true,
    runtime: v122,
  });
  return (
    (v122["promise"] = v123),
    _runtimeByLeaderId["set"](v117, v122),
    v123
  );
}
export function __setAudioSeparationDepsForTest({
  runAudioSeparationImpl: v124,
  resumeAudioSeparationTaskImpl: v125,
  saveRemoteAudioLocallyDetailedImpl: v126,
} = {}) {
  ((_runAudioSeparationImpl =
    typeof v124 === "function" ? v124 : runAudioSeparation),
    (_resumeAudioSeparationTaskImpl =
      typeof v125 === "function" ? v125 : resumeAudioSeparationTask),
    (_saveRemoteAudioLocallyDetailedImpl =
      typeof v126 === "function" ? v126 : saveRemoteAudioLocallyDetailed));
}
export function __resetAudioSeparationDepsForTest() {
  ((_runAudioSeparationImpl = runAudioSeparation),
    (_resumeAudioSeparationTaskImpl = resumeAudioSeparationTask),
    (_saveRemoteAudioLocallyDetailedImpl = saveRemoteAudioLocallyDetailed),
    _runtimeByLeaderId["forEach"]((v127) => {
      try {
        v127?.["abortController"]?.["abort"]?.();
      } catch {}
    }),
    _runtimeByLeaderId["clear"]());
}
