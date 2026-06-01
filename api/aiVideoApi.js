import * as RunningHubAdapter from "./adapters/RunningHubAdapter.js";
import {
  buildVideoRequestFromManifest,
  resolveManifestTaskPolling,
} from "./adapters/ModelApiManifestNormalizer.js";
import {
  resolveMappedResponseValue,
  resolveMappedResponseValues,
} from "./adapters/modelApiMappingEngine.js";
import { ensureConfig, getProviderConfig } from "./configApi.js";
import { applyCameraAngleToPrompt } from "./cameraPromptApi.js";
import { processInputImages } from "./imageUploadApi.js";
import { processInputVideos } from "./videoUploadApi.js";
import { processInputAudios } from "./audioUploadApi.js";
import { uploadInputsToVolcengineFiles } from "./volcengineFileApi.js";
import { fetchRemoteBlob } from "./projectsV2Api.js";
import { cancelRunningHubTask } from "./runninghubTaskApi.js";
import {
  buildDreaminaVideoSubmitRequest,
  normalizeDreaminaTaskSnapshot,
  pollDreaminaUntilDone,
  runDreaminaVideoGeneration,
} from "./dreaminaGenApi.js";
import {
  isModelApiModel,
  normalizeProviderId,
  resolveModelExecution,
} from "../src/manifests/index.js";
import {
  localPathToUrl,
  pickResultLocalPath,
  urlToLocalPath,
} from "../src/utils/localMediaPath.js";
import { requester } from "./requester.js";
import { runTaskSingleFlight } from "./taskSingleFlight.js";
import {
  ApiError,
  ErrorType,
  parseError,
  parseTaskError,
  parseNetworkError,
} from "./errors/index.js";
const GENERATION_TIMEOUT = 10 * 60 * 1000;
export async function cancelRunningHubVideoTask({
  apiKey: v0,
  taskId: v1,
} = {}) {
  return cancelRunningHubTask({ apiKey: v0, taskId: v1 });
}
function resolveVideoExecution(v2 = {}) {
  const v3 = normalizeProviderId(v2?.["provider"]);
  return resolveModelExecution(v2?.["model"], { providerHint: v3 });
}
function resolveVideoProviderId(v4 = {}, v5 = null) {
  return normalizeProviderId(
    v5?.["modelManifest"]?.["provider"] || v4?.["provider"],
  );
}
function resolveVideoTaskRuntimeOptions(v6 = {}, v7 = "", v8 = {}) {
  const v9 = String(v6?.["model"] || "")["trim"]();
  if (!v9) return v8 || {};
  const v10 = normalizeProviderId(v7 || v6?.["provider"]),
    v11 = resolveModelExecution(v9, { providerHint: v10 }),
    v12 = v11?.["executionManifest"];
  if (!v12 || v12["adapterType"] !== "modelApi" || v12["kind"] !== "video")
    return v8 || {};
  const v13 = normalizeProviderId(v12["provider"] || v10),
    v14 = getProviderConfig(v13),
    v15 = resolveManifestTaskPolling(v13, v14, v12, {
      modelManifest: v11?.["modelManifest"] || null,
    });
  return {
    ...(v8 || {}),
    ...(!v8?.["responseMapping"] && v12["responseMapping"]
      ? { responseMapping: v12["responseMapping"] }
      : {}),
    ...(!v8?.["taskPolling"] && v15 ? { taskPolling: v15 } : {}),
  };
}
export async function buildGenerateVideoRequest(v16) {
  const v17 = applyCameraAngleToPrompt(v16["prompt"], v16["cameraAngle"]),
    v18 = resolveVideoExecution(v16),
    v19 = resolveVideoProviderId(v16, v18),
    v20 = v18?.["executionManifest"],
    v21 = v18?.["modelManifest"];
  if (
    v20?.["adapterType"] === "localRuntime" &&
    v20?.["runtime"] === "dreaminaVideo"
  ) {
    const v22 = buildDreaminaVideoSubmitRequest({ ...v16, prompt: v17 });
    return {
      url: v22["url"],
      headers: { "Content-Type": "application/json" },
      body: v22["body"],
    };
  }
  if (!v19 || !v20) {
    const v23 = String(v16?.["model"] || "")["trim"]() || "(empty)";
    throw new Error("Video\x20model\x20API\x20manifest\x20missing:\x20" + v23);
  }
  await ensureConfig();
  if (v20["adapterType"] === "modelApi") {
    const v24 = await buildVideoRequestFromManifest(
      v16,
      v17,
      {
        getProviderConfig: getProviderConfig,
        processInputImages: processInputImages,
        processInputVideos: processInputVideos,
        processInputAudios: processInputAudios,
        uploadInputsToVolcengineFiles: uploadInputsToVolcengineFiles,
      },
      { expectedProvider: v21?.["provider"] || v19 },
    );
    if (v24) return v24;
    throw new Error(
      (v21?.["provider"] || v19) +
        " video model API manifest missing: " +
        v16["model"],
    );
  }
  if (v20["adapterType"] === "workflow")
    return RunningHubAdapter["buildVideoRequest"](v16, v17, {
      getProviderConfig: getProviderConfig,
      processInputImages: processInputImages,
      processInputVideos: processInputVideos,
    });
  throw new ApiError({
    type: "UNSUPPORTED_PROVIDER",
    provider: v19,
    message: "暂不支持厂商 " + v19 + " 的视频生成",
    retryable: false,
  });
}
async function pollRunningHubVideoTask(v25, v26, v27, v28) {
  const v29 = isModelApiModel(v26["model"], "runninghub"),
    v30 = v28?.["useOpenapiQuery"] === true || v29,
    v31 = getProviderConfig(v29 ? "runninghub" : "runninghubwf"),
    v32 = v29
      ? v31["modelApiKey"] || v26["apiKey"]
      : v31["apiKey"] || v26["apiKey"];
  for (let v33 = 0; v33 < 1200; v33++) {
    if (v28?.["signal"]?.["aborted"]) throw new Error("CANCELLED");
    await new Promise((v34) => setTimeout(v34, 2000));
    try {
      const v35 = await requester({
        url: v30 ? "/api/v2/proxy/image" : "/api/v2/runninghubwf/query",
        method: "POST",
        provider: v27,
        timeout: 30000,
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"](
          v30
            ? {
                apiUrl: "https://www.runninghub.cn/openapi/v2/query",
                apiKey: v32,
                taskId: v25,
              }
            : { apiKey: v32, taskId: v25 },
        ),
      });
      if (v30) {
        const v36 = typeof v35?.["code"] === "number" ? v35["code"] : null;
        if (v36 === 804 || v36 === 813) continue;
        if (v36 !== null && v36 !== 0) throw parseError(v27, v35, 200);
        if (extractVideoUrls(v35, v28?.["responseMapping"])["length"] > 0)
          return v35;
      }
      if (!v30) {
        const v37 = typeof v35?.["code"] === "number" ? v35["code"] : null;
        if (
          v37 === 0 &&
          Array["isArray"](v35["data"]) &&
          v35["data"]["length"] > 0
        ) {
          if (extractVideoUrls(v35, v28?.["responseMapping"])["length"] > 0)
            return v35;
          const v38 = v35["data"]
            ["map"]((v39) =>
              String(v39?.["status"] || v39?.["taskStatus"] || "")
                ["trim"]()
                ["toUpperCase"](),
            )
            ["filter"](Boolean);
          if (
            v38["some"]((v40) =>
              ["FAILED", "FAIL", "ERROR", "CANCELLED", "CANCELED"]["includes"](
                v40,
              ),
            )
          ) {
            const v41 = parseError(v27, v35, 200);
            throw (
              v41 ||
              new ApiError({
                type: "TASK_FAILED",
                provider: v27,
                message: "视频任务执行失败",
                raw: v35,
                retryable: false,
              })
            );
          }
          continue;
        }
        if (v37 === 804 || v37 === 813) continue;
        if (v37 !== null && v37 !== 0) throw parseError(v27, v35, 200);
      }
      const v42 =
        v35["data"] && Object["keys"](v35["data"])["length"] > 0
          ? v35["data"]
          : v35;
      if (extractVideoUrls(v42, v28?.["responseMapping"])["length"] > 0)
        return v42;
      const v43 = parseTaskError(v27, v42);
      if (v43) throw v43;
      const v44 = (v42["status"] || "")["toUpperCase"]();
      if (["COMPLETED", "SUCCEEDED", "SUCCESS"]["includes"](v44)) {
        if (extractVideoUrls(v42, v28?.["responseMapping"])["length"] === 0)
          continue;
        return v42;
      }
    } catch (v45) {
      if (v45 instanceof ApiError) {
        if (
          v45["type"] === ErrorType["TASK_FAILED"] ||
          v45["type"] === ErrorType["TASK_TIMEOUT"] ||
          v45["type"] === ErrorType["AUTH_ERROR"] ||
          v45["type"] === ErrorType["FORBIDDEN"] ||
          v45["type"] === ErrorType["INVALID_PARAMS"] ||
          v45["type"] === ErrorType["INSUFFICIENT_BALANCE"]
        )
          throw v45;
      }
    }
  }
  throw ApiError["taskTimeout"](v27);
}
function parseVideoResponseData(v46) {
  if (!v46) return {};
  if (typeof v46 === "object") return v46;
  const v47 = String(v46 || "")["trim"]();
  if (!v47) return {};
  try {
    return JSON["parse"](v47["replace"](/^data:\s*/, ""));
  } catch {
    const v48 = extractSseJsonSnapshots(v47);
    if (v48["length"] > 0) {
      for (const v49 of v48) {
        if (resolveAsyncVideoTaskId(v49)) return v49;
      }
      return v48[v48["length"] - 1];
    }
    throw new ApiError({
      type: "PARSE_ERROR",
      message: "无法解析服务端响应",
      retryable: false,
    });
  }
}
function extractSseJsonSnapshots(v50) {
  const v51 = String(v50 || "")
    ["split"]("\x0a")
    ["filter"]((v52) => v52["trim"]()["startsWith"]("data:"));
  if (v51["length"] === 0) return [];
  const v53 = [];
  for (const v54 of v51) {
    const v55 = String(v54 || "")
      ["trim"]()
      ["replace"](/^data:\s*/, "")
      ["trim"]();
    if (!v55 || v55 === "[DONE]") continue;
    try {
      v53["push"](JSON["parse"](v55));
    } catch {}
  }
  return v53;
}
function extractRunningHubTaskIdFromRawText(v56) {
  const v57 = String(v56 || "");
  if (!v57) return "";
  const v58 = [
    /"task_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskid"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /\btask[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /(?:\?|&)(?:task_id|taskId|taskid)=([a-zA-Z0-9._:-]+)/i,
  ];
  for (const v59 of v58) {
    const v60 = v57["match"](v59),
      v61 = String(v60?.[1] || "")
        ["replace"](/,/g, "")
        ["trim"]();
    if (v61) return v61;
  }
  return "";
}
function extractTaskIdFromResponseHeaders(v62) {
  if (!v62 || typeof v62["get"] !== "function") return "";
  const v63 = [
    "x-task-id",
    "x-taskid",
    "x-request-id",
    "x-requestid",
    "x-job-id",
    "x-jobid",
    "task-id",
    "taskid",
    "request-id",
    "requestid",
    "job-id",
    "jobid",
  ];
  for (const v64 of v63) {
    const v65 = String(v62["get"](v64) || "")["trim"]();
    if (v65) return v65;
  }
  if (typeof v62["forEach"] === "function") {
    let v66 = "";
    v62["forEach"]((v67, v68) => {
      if (v66) return;
      const v69 = String(v68 || "")
          ["trim"]()
          ["toLowerCase"](),
        v70 = String(v67 || "")["trim"]();
      if (!v70) return;
      ((v69["includes"]("task") && v69["includes"]("id")) ||
        (v69["includes"]("job") && v69["includes"]("id")) ||
        (v69["includes"]("request") && v69["includes"]("id"))) &&
        (v66 = v70);
    });
    if (v66) return v66;
  }
  return "";
}
function normalizeTaskIdValue(v71) {
  return String(v71 ?? "")
    ["replace"](/,/g, "")
    ["trim"]();
}
function looksLikeTaskToken(v72) {
  const v73 = String(v72 ?? "")["trim"]();
  if (!v73 || v73["length"] < 8) return false;
  const v74 = v73["toLowerCase"]();
  if (
    [
      "pending",
      "running",
      "success",
      "succeeded",
      "completed",
      "failed",
      "queued",
      "submitted",
    ]["includes"](v74)
  )
    return false;
  return /^[a-zA-Z0-9._:-]+$/["test"](v73);
}
function findFirstDeepValueByKeyPattern(v75, v76, v77 = 8) {
  if (!v75 || typeof v75 !== "object") return "";
  const v78 = new WeakSet(),
    v79 = [{ value: v75, depth: 0 }];
  while (v79["length"] > 0) {
    const { value: v80, depth: v81 } = v79["shift"]();
    if (!v80 || typeof v80 !== "object") continue;
    if (v78["has"](v80)) continue;
    v78["add"](v80);
    if (v81 > v77) continue;
    const v82 = Array["isArray"](v80)
      ? v80["map"]((v83, v84) => [String(v84), v83])
      : Object["entries"](v80);
    for (const [v85, v86] of v82) {
      const v87 = String(v85 || "")
        ["trim"]()
        ["toLowerCase"]();
      if (v76["test"](v87)) {
        const v88 = String(v86 ?? "")["trim"]();
        if (v88) return v88;
      }
      v86 &&
        typeof v86 === "object" &&
        v79["push"]({ value: v86, depth: v81 + 1 });
    }
  }
  return "";
}
function resolveRunningHubVideoTaskId(v89, v90 = "", v91 = null, v92 = null) {
  const v93 = resolveMappedResponseValue(v89, v92?.["taskIdPath"]);
  if (v93) return normalizeTaskIdValue(v93);
  const v94 = extractRunningHubTaskIdFromRawText(v90);
  if (v94) return v94;
  const v95 = resolveAsyncVideoTaskId(v89, v92);
  if (v95) return normalizeTaskIdValue(v95);
  return normalizeTaskIdValue(extractTaskIdFromResponseHeaders(v91));
}
export async function resumeRunningHubVideoTask(v96, v97, v98 = {}) {
  const v99 = resolveVideoExecution(v97),
    v100 = resolveVideoProviderId(v97, v99);
  if (v100 !== "runninghubwf")
    throw new Error("仅支持恢复 RunningHub 工作流视频任务");
  const v101 = String(v96 || "")["trim"]();
  if (!v101) throw new Error("缺少 RunningHub 视频任务ID，无法恢复");
  const v102 = v98?.["useOpenapiQuery"] === true;
  return runTaskSingleFlight(
    { provider: v100, kind: "video", taskId: v101 },
    async () => {
      const v103 = await pollRunningHubVideoTask(v101, v97 || {}, v100, {
          ...v98,
          useOpenapiQuery: v102,
        }),
        v104 = processVideoTaskResult(v103, v100, v98);
      return await postProcessVideoResult(v104, {
        providerId: v100,
        taskKey: v100 + ":video:" + v101,
      });
    },
  );
}
export async function resumeAsyncVideoTask(v105, v106 = {}, v107 = {}) {
  const v108 = resolveVideoExecution(v106),
    v109 = resolveVideoProviderId(v106, v108);
  if (v109 === "runninghubwf" || v109 === "dreamina")
    throw new Error("仅支持恢复非 RunningHub/Dreamina 的异步视频任务");
  const v110 = String(v105 || "")["trim"]();
  if (!v110) throw new Error("缺少异步视频任务ID，无法恢复");
  await ensureConfig();
  const v111 = resolveVideoTaskRuntimeOptions(v106 || {}, v109, v107),
    v112 = getProviderConfig(v109),
    v113 = String(
      v106?.["apiKey"] ||
        (v109 === "runninghub" ? v112?.["modelApiKey"] : "") ||
        v112?.["apiKey"] ||
        "",
    )["trim"]();
  if (!v113)
    throw new Error("API Key 未配置（厂商：" + v109 + "），无法恢复视频任务");
  return runTaskSingleFlight(
    { provider: v109, kind: "video", taskId: v110 },
    async () => {
      if (v109 === "runninghub") {
        const v114 = await pollRunningHubVideoTask(
            v110,
            { ...v106, apiKey: v113 },
            v109,
            { ...v111, useOpenapiQuery: true },
          ),
          v115 = processVideoTaskResult(v114, v109, v111);
        return await postProcessVideoResult(v115, {
          providerId: v109,
          taskKey: v109 + ":video:" + v110,
        });
      }
      const v116 = await pollVideoTask(v110, v109, v113, v111);
      return await postProcessVideoResult(v116, {
        providerId: v109,
        taskKey: v109 + ":video:" + v110,
      });
    },
  );
}
export async function resumeDreaminaVideoTask(v117, v118 = {}) {
  const v119 = String(v117 || "")["trim"]();
  if (!v119) throw new Error("缺少 Dreamina 提交ID，无法恢复视频任务");
  const v120 = await pollDreaminaUntilDone(v119, {
      ...v118,
      taskKind: "video",
    }),
    v121 = normalizeDreaminaTaskSnapshot(v120, { submitId: v119 });
  if (v121?.["phase"] === "failed") {
    const v122 = new Error(
      v121?.["failReason"] || v121?.["label"] || "查询失败",
    );
    v122["dreaminaSnapshot"] = v121;
    throw v122;
  }
  const v123 = Array["isArray"](v121?.["outputs"]) ? v121["outputs"] : [],
    v124 = v123["map"]((v125) => {
      const v126 = pickResultLocalPath(v125);
      return {
        videoUrl: localPathToUrl(v126) || v125["localUrl"] || v125["url"],
        localPath: v126,
      };
    });
  return {
    isBatch: v124["length"] > 1,
    dreaminaSnapshot: v121,
    videos: v124,
    videoUrl:
      localPathToUrl(pickResultLocalPath(v123[0])) ||
      v123[0]?.["localUrl"] ||
      v123[0]?.["url"] ||
      "",
    localPath: pickResultLocalPath(v123[0]),
  };
}
function buildManifestVideoTaskPollUrl(v127, v128) {
  if (!v128 || typeof v128 !== "object") return "";
  const v129 = String(v128["urlTemplate"] || "")["trim"]();
  if (!v129) return "";
  return v129["replace"]("{taskId}", encodeURIComponent(String(v127)));
}
async function pollVideoTask(v130, v131, v132, v133 = {}) {
  const v134 = getProviderConfig(v131);
  for (let v135 = 0; v135 < 600; v135++) {
    if (v133?.["signal"]?.["aborted"]) throw new Error("CANCELLED");
    await new Promise((v136) => setTimeout(v136, 2000));
    if (v133?.["signal"]?.["aborted"]) throw new Error("CANCELLED");
    const v137 = encodeURIComponent(String(v130)),
      v138 =
        String(v134["apiUrl"] || "")["replace"](/\/+$/, "") +
        "/v1/tasks/" +
        v137 +
        (String(v131 || "")
          ["trim"]()
          ["toLowerCase"]() === "apimart"
          ? "?language=zh"
          : ""),
      v139 = buildManifestVideoTaskPollUrl(v130, v133?.["taskPolling"]) || v138;
    try {
      const v140 = await requester({
          url: "/api/v2/proxy/task?apiUrl=" + encodeURIComponent(v139),
          method: "GET",
          headers: { Authorization: "Bearer " + v132 },
          provider: v131,
          timeout: 30000,
          signal: v133?.["signal"],
        }),
        v141 = normalizeAsyncVideoTaskInfo(v140),
        v142 = resolveAsyncVideoTaskStatus(v141),
        v143 = parseTaskError(v131, v141);
      if (v143) throw v143;
      if (v142 === "completed" || v142 === "succeeded" || v142 === "success")
        return processVideoTaskResult(v141, v131, v133);
      if (extractVideoUrls(v141, v133?.["responseMapping"])["length"] > 0)
        return processVideoTaskResult(v141, v131, v133);
      if (isAsyncVideoTaskFailureStatus(v142))
        throw ApiError["taskFailed"](
          v131,
          extractAsyncVideoTaskFailureReason(v141) || "任务状态异常",
        );
    } catch (v144) {
      if (v144 instanceof ApiError) {
        if (
          v144["type"] === ErrorType["TASK_FAILED"] ||
          v144["type"] === ErrorType["CONTENT_FILTERED"] ||
          v144["type"] === ErrorType["TASK_TIMEOUT"] ||
          v144["type"] === ErrorType["AUTH_ERROR"] ||
          v144["type"] === ErrorType["FORBIDDEN"] ||
          v144["type"] === ErrorType["INVALID_PARAMS"] ||
          v144["type"] === ErrorType["INSUFFICIENT_BALANCE"] ||
          v144["type"] === ErrorType["MODEL_UNAVAILABLE"]
        )
          throw v144;
      }
    }
  }
  throw ApiError["taskTimeout"](v131);
}
function normalizeTaskSnapshotPayload(v145) {
  if (v145 && typeof v145 === "object") return v145;
  const v146 = String(v145 || "")["trim"]();
  if (!v146) return {};
  try {
    return JSON["parse"](v146);
  } catch {
    return { rawText: v146 };
  }
}
function normalizeAsyncVideoTaskInfo(v147) {
  const v148 = normalizeTaskSnapshotPayload(v147),
    v149 =
      v148 &&
      typeof v148 === "object" &&
      v148["data"] &&
      typeof v148["data"] === "object" &&
      !Array["isArray"](v148["data"]);
  return v149
    ? { ...v148, ...v148["data"] }
    : normalizeTaskSnapshotPayload(v148?.["data"] || v148);
}
function resolveAsyncVideoTaskStatus(v150) {
  const v151 = Array["isArray"](v150?.["data"])
      ? v150["data"][0]
      : v150?.["data"] && typeof v150["data"] === "object"
        ? v150["data"]
        : null,
    v152 = Array["isArray"](v150?.["results"])
      ? v150["results"][0]
      : v150?.["results"] && typeof v150["results"] === "object"
        ? v150["results"]
        : null,
    v153 =
      v150?.["result"] && typeof v150["result"] === "object"
        ? v150["result"]
        : null,
    v154 =
      v150?.["output"] && typeof v150["output"] === "object"
        ? v150["output"]
        : null;
  return String(
    v151?.["status"] ||
      v150?.["status"] ||
      v150?.["taskStatus"] ||
      v150?.["task_status"] ||
      v150?.["data"]?.["status"] ||
      v153?.["status"] ||
      v153?.["taskStatus"] ||
      v153?.["task_status"] ||
      v154?.["status"] ||
      v154?.["taskStatus"] ||
      v154?.["task_status"] ||
      v152?.["status"] ||
      v150?.["state"] ||
      v150?.["phase"] ||
      "",
  )
    ["trim"]()
    ["toLowerCase"]();
}
function isAsyncVideoTaskFailureStatus(v155) {
  return ["failed", "fail", "error", "cancelled", "canceled", "expired"][
    "includes"
  ](
    String(v155 || "")
      ["trim"]()
      ["toLowerCase"](),
  );
}
function stringifyTaskFailureValue(v156) {
  if (v156 == null) return "";
  if (typeof v156 === "string") return v156["trim"]();
  if (typeof v156 === "number" || typeof v156 === "boolean")
    return String(v156);
  if (typeof v156 === "object") {
    const v157 =
      v156["message"] ||
      v156["errorMessage"] ||
      v156["error_message"] ||
      v156["detail"] ||
      v156["reason"] ||
      v156["type"] ||
      v156["status"] ||
      v156["code"];
    if (v157) return stringifyTaskFailureValue(v157);
    try {
      return JSON["stringify"](v156);
    } catch {
      return String(v156 || "")["trim"]();
    }
  }
  return String(v156 || "")["trim"]();
}
function extractAsyncVideoTaskFailureReason(v158) {
  const v159 = [
    v158?.["error"]?.["message"],
    v158?.["error"]?.["error"]?.["message"],
    v158?.["errorMessage"],
    v158?.["error_message"],
    v158?.["message"],
    v158?.["failedReason"],
    v158?.["failReason"],
    v158?.["failure_reason"],
    v158?.["data"]?.["error"]?.["message"],
    v158?.["data"]?.["error"]?.["error"]?.["message"],
    v158?.["data"]?.["errorMessage"],
    v158?.["data"]?.["error_message"],
    v158?.["data"]?.["message"],
    v158?.["data"]?.["failedReason"],
    v158?.["data"]?.["failReason"],
    v158?.["data"]?.["failure_reason"],
    v158?.["result"]?.["error"]?.["message"],
    v158?.["result"]?.["errorMessage"],
    v158?.["result"]?.["message"],
    v158?.["rawText"],
  ];
  for (const v160 of v159) {
    const v161 = stringifyTaskFailureValue(v160);
    if (v161) return v161;
  }
  return (
    stringifyTaskFailureValue(v158?.["error"]) ||
    stringifyTaskFailureValue(v158?.["data"]?.["error"]) ||
    stringifyTaskFailureValue(v158?.["result"]?.["error"]) ||
    ""
  );
}
function isLikelyVideoUrl(v162) {
  const v163 = String(v162 || "")["trim"]();
  if (!v163) return false;
  if (!/^https?:\/\//i["test"](v163) && !v163["startsWith"]("/")) return false;
  return /\.(mp4|mov|webm|mkv|avi|m4v|m3u8)(\?|#|$)/i["test"](v163);
}
const RESULT_MEDIA_KIND_FIELDS = [
  "mediaKind",
  "mediaType",
  "mimeType",
  "contentType",
  "fileType",
  "outputType",
  "type",
  "format",
  "extension",
  "ext",
];
function inferVideoResultMediaKind(v164 = {}, v165 = "") {
  const v166 = String(v165 || "")["toLowerCase"]();
  if (/(^|[_-])video($|[_-])/["test"](v166) || v166 === "videourl")
    return "video";
  if (/(^|[_-])audio($|[_-])/["test"](v166) || v166 === "audiourl")
    return "audio";
  if (/(^|[_-])(image|img|thumb|thumbnail|poster|cover)($|[_-])/["test"](v166))
    return "image";
  if (!v164 || typeof v164 !== "object" || Array["isArray"](v164)) return "";
  for (const v167 of RESULT_MEDIA_KIND_FIELDS) {
    const v168 = String(v164[v167] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (!v168) continue;
    if (/video|mp4|mov|webm|mkv|avi|m4v|m3u8/["test"](v168)) return "video";
    if (/audio|mp3|wav|aac|m4a|flac|ogg/["test"](v168)) return "audio";
    if (/image|png|jpe?g|webp|gif/["test"](v168)) return "image";
  }
  return "";
}
function extractVideoResultEntries(v169) {
  const v170 = [],
    v171 = new WeakSet(),
    v172 = [
      "videoUrl",
      "video_url",
      "url",
      "fileUrl",
      "file_url",
      "downloadUrl",
      "download_url",
      "output",
      "mediaUrl",
      "media_url",
      "resultUrl",
      "result_url",
    ],
    v173 = [
      "thumbUrl",
      "thumbnailUrl",
      "thumbnail_url",
      "posterUrl",
      "poster_url",
    ],
    v174 = (v175, v176 = "") => {
      if (!v175 || typeof v175 !== "object" || Array["isArray"](v175))
        return String(v176 || "")["trim"]();
      for (const v177 of v173) {
        const v178 = String(v175[v177] || "")["trim"]();
        if (v178) return v178;
      }
      return String(v176 || "")["trim"]();
    },
    v179 = (v180, v181 = {}, v182 = "") => {
      if (v180 == null) return;
      if (Array["isArray"](v180)) {
        v180["forEach"]((v183) => v179(v183, v181, v182));
        return;
      }
      if (typeof v180 === "object") {
        v184(v180, v181);
        return;
      }
      const v185 = String(v180 || "")["trim"]();
      if (!v185) return;
      v170["push"]({
        videoUrl: v185,
        thumbUrl: v174(v181),
        mediaKind: inferVideoResultMediaKind(v181, v182),
      });
    },
    v184 = (v186, v187 = {}) => {
      if (v186 == null) return;
      if (Array["isArray"](v186)) {
        v186["forEach"]((v188) => v184(v188, v187));
        return;
      }
      if (typeof v186 !== "object") return;
      if (v171["has"](v186)) return;
      v171["add"](v186);
      const v189 = {
        ...v187,
        ...v186,
        thumbUrl: v174(v186, v174(v187)),
        mediaKind:
          inferVideoResultMediaKind(v186) || inferVideoResultMediaKind(v187),
      };
      (v172["forEach"]((v190) => {
        Object["prototype"]["hasOwnProperty"]["call"](v186, v190) &&
          v179(v186[v190], v189, v190);
      }),
        Object["entries"](v186)["forEach"](([v191, v192]) => {
          if (v172["includes"](v191) || v173["includes"](v191)) return;
          if (v192 && typeof v192 === "object") v184(v192, v189);
        }));
    };
  v184(v169);
  const v193 = [],
    v194 = new Set();
  for (const v195 of v170) {
    const v196 = String(v195?.["videoUrl"] || "")["trim"]();
    if (!v196 || v194["has"](v196)) continue;
    v194["add"](v196);
    const v197 = String(v195?.["thumbUrl"] || "")["trim"]();
    v193["push"]({
      videoUrl: v196,
      ...(v197 ? { thumbUrl: v197 } : {}),
      mediaKind: String(v195?.["mediaKind"] || "")["trim"](),
    });
  }
  const v198 = v193["filter"](
      (v199) =>
        v199["mediaKind"] === "video" || isLikelyVideoUrl(v199["videoUrl"]),
    ),
    v200 = v198["length"] ? v198 : v193;
  return v200["map"](({ mediaKind: v201, ...v202 }) => v202);
}
function resolveAsyncVideoTaskId(v203, v204 = null) {
  const v205 = resolveMappedResponseValue(v203, v204?.["taskIdPath"]);
  if (v205) return v205;
  if (
    typeof v203?.["data"] === "string" ||
    typeof v203?.["data"] === "number"
  ) {
    const v206 = String(v203["data"])["trim"]();
    if (looksLikeTaskToken(v206)) return v206;
  }
  if (typeof v203 === "string" || typeof v203 === "number") {
    const v207 = String(v203)["trim"]();
    if (looksLikeTaskToken(v207)) return v207;
  }
  const v208 = Array["isArray"](v203?.["data"])
      ? v203["data"][0]
      : v203?.["data"] && typeof v203["data"] === "object"
        ? v203["data"]
        : Array["isArray"](v203?.["results"])
          ? v203["results"][0]
          : v203?.["results"] && typeof v203["results"] === "object"
            ? v203["results"]
            : null,
    v209 =
      v203?.["result"] && typeof v203["result"] === "object"
        ? v203["result"]
        : null,
    v210 =
      v203?.["output"] && typeof v203["output"] === "object"
        ? v203["output"]
        : null,
    v211 =
      v203?.["response"] && typeof v203["response"] === "object"
        ? v203["response"]
        : null,
    v212 =
      v208?.["task_id"] ||
      v208?.["taskId"] ||
      v208?.["id"] ||
      v203?.["task_id"] ||
      v203?.["taskId"] ||
      v203?.["id"] ||
      v203?.["data"]?.["task_id"] ||
      v203?.["data"]?.["taskId"] ||
      v203?.["data"]?.["id"] ||
      v209?.["task_id"] ||
      v209?.["taskId"] ||
      v209?.["id"] ||
      v210?.["task_id"] ||
      v210?.["taskId"] ||
      v210?.["id"] ||
      v211?.["task_id"] ||
      v211?.["taskId"] ||
      v211?.["id"] ||
      findFirstDeepValueByKeyPattern(
        v203,
        /^(task_?id|taskid|request_?id|requestid)$/i,
      ) ||
      findFirstDeepValueByKeyPattern(v203, /^id$/i) ||
      "";
  return String(v212 || "")["trim"]();
}
function extractVideoUrls(v213, v214 = null) {
  const v215 = resolveMappedResponseValues(v213, v214?.["resultPaths"]);
  if (v215["length"] > 0) return v215;
  const v216 = extractVideoResultEntries(v213);
  if (v216["length"] > 0) return v216["map"]((v217) => v217["videoUrl"]);
  const v218 = [],
    v219 = (v220) => {
      if (v220 == null) return;
      if (Array["isArray"](v220)) {
        for (const v221 of v220) v219(v221);
        return;
      }
      if (typeof v220 === "object") {
        v219(
          v220["videoUrl"] ||
            v220["video_url"] ||
            v220["url"] ||
            v220["fileUrl"] ||
            v220["video"] ||
            v220["output"] ||
            v220["mediaUrl"],
        );
        return;
      }
      const v222 = String(v220 || "")["trim"]();
      if (v222) v218["push"](v222);
    },
    v223 = (v224) => {
      const v225 = [],
        v226 = new Set();
      let v227 = 0;
      const v228 = (v229, v230) => {
        if (v227 > 8000) return;
        if (v230 > 6) return;
        v227++;
        if (!v229) return;
        if (typeof v229 === "string") {
          const v231 = v229["trim"]();
          isLikelyVideoUrl(v231) &&
            !v226["has"](v231) &&
            (v226["add"](v231), v225["push"](v231));
          return;
        }
        if (Array["isArray"](v229)) {
          for (const v232 of v229) v228(v232, v230 + 1);
          return;
        }
        if (typeof v229 === "object") {
          for (const v233 of Object["values"](v229)) v228(v233, v230 + 1);
        }
      };
      return (v228(v224, 0), v225);
    };
  if (
    v213["result"]?.["videos"] &&
    Array["isArray"](v213["result"]["videos"])
  ) {
    for (const v234 of v213["result"]["videos"]) v219(v234?.["url"] || v234);
  } else {
    if (v213["status"] === "succeeded" && v213["results"]) {
      for (const v235 of v213["results"]) v219(v235);
    } else {
      if (v213["data"]?.[0]?.["url"]) {
        for (const v236 of v213["data"]) v219(v236);
      } else {
        if (v213["data"]?.[0]?.["fileUrl"]) {
          for (const v237 of v213["data"]) v219(v237?.["fileUrl"]);
        } else {
          if (v213["data"]?.["results"]) {
            for (const v238 of v213["data"]["results"]) v219(v238);
          } else {
            if (v213["data"]?.[0]?.["video"]) {
              for (const v239 of v213["data"]) v219(v239?.["video"]);
            } else {
              if (Array["isArray"](v213["data"])) {
                for (const v240 of v213["data"]) v219(v240);
              } else {
                if (Array["isArray"](v213["videos"])) {
                  for (const v241 of v213["videos"]) v219(v241);
                } else {
                  if (v213["status"] === "COMPLETED" && v213["results"]) {
                    for (const v242 of v213["results"]) v219(v242);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  const v243 = v218["filter"](Boolean),
    v244 = v243["filter"](isLikelyVideoUrl);
  if (v244["length"] > 0) return Array["from"](new Set(v244));
  if (v243["length"] > 0) return Array["from"](new Set(v243));
  return v223(v213);
}
function extractVideoEntries(v245, v246 = null) {
  const v247 = extractVideoResultEntries(v245);
  if (v247["length"] > 0) return v247;
  const v248 = resolveMappedResponseValues(v245, v246?.["resultPaths"]);
  if (v248["length"] > 0)
    return v248["map"]((v249) => ({ videoUrl: String(v249 || "")["trim"]() }))[
      "filter"
    ]((v250) => v250["videoUrl"]);
  return extractVideoUrls(v245, v246)
    ["map"]((v251) => ({ videoUrl: String(v251 || "")["trim"]() }))
    ["filter"]((v252) => v252["videoUrl"]);
}
function processVideoTaskResult(v253, v254, v255 = {}) {
  const v256 = extractVideoEntries(v253, v255?.["responseMapping"]);
  if (v256["length"] === 0) {
    const v257 = parseError(v254, v253, 200);
    if (v257) throw v257;
    const v258 = parseTaskError(v254, v253);
    if (v258)
      throw new ApiError({
        type: "TASK_FAILED",
        provider: v254,
        message: v258["getUserMessage"](),
        retryable: false,
      });
    const v259 = extractAsyncVideoTaskFailureReason(v253);
    if (v259)
      throw new ApiError({
        type: "TASK_FAILED",
        provider: v254,
        message: v259,
        retryable: false,
      });
    throw new ApiError({
      type: "PARSE_ERROR",
      provider: v254,
      message: "无法从服务器响应中提取视频地址",
      raw: v253,
      retryable: false,
    });
  }
  return {
    videoUrl: v256[0]["videoUrl"],
    thumbUrl: v256[0]["thumbUrl"],
    isBatch: v256["length"] > 1,
    videos: v256,
  };
}
function extractVideoUrl(v260) {
  return (
    v260["videoUrl"] ||
    v260["url"] ||
    (v260["data"] && v260["data"][0]?.["url"]) ||
    null
  );
}
function _normalizeRemoteUrl(v261) {
  const v262 = String(v261 || "")["trim"]();
  if (!v262) return "";
  if (v262["startsWith"]("/")) return v262;
  if (/^data:/i["test"](v262)) return v262;
  if (/^blob:/i["test"](v262)) return v262;
  if (v262["startsWith"]("//")) return "https:" + v262;
  if (/^https?:\/\//i["test"](v262)) return v262;
  return "https://" + v262["replace"](/^\/+/, "");
}
function _guessExtFromUrl(v263, v264) {
  try {
    const v265 = new URL(String(v263 || ""), location?.["href"] || undefined),
      v266 = String(v265["pathname"] || ""),
      v267 = v266["split"]("/")["filter"](Boolean)["pop"]() || "",
      v268 = v267["lastIndexOf"](".");
    if (v268 > 0 && v268 < v267["length"] - 1) {
      const v269 = v267["slice"](v268 + 1)["toLowerCase"]();
      if (/^[a-z0-9]{1,5}$/["test"](v269)) return v269;
    }
  } catch {}
  return v264;
}
function _toLocalPathIfSameOrigin(v270) {
  return urlToLocalPath(v270);
}
async function _trySaveOutputByClientDownload(v271, v272) {
  const v273 = String(v271 || "")["trim"]();
  if (!(v273["startsWith"]("http://") || v273["startsWith"]("https://")))
    return { localPath: null, error: "invalid url" };
  const v274 = new AbortController(),
    v275 = setTimeout(() => v274["abort"](), 120000);
  let v276 = null;
  try {
    v276 = await fetchRemoteBlob(v273, { signal: v274["signal"] });
  } catch (v277) {
    const v278 = v277 instanceof Error ? v277["message"] : String(v277 || "");
    return { localPath: null, error: v278 || "client download failed" };
  } finally {
    clearTimeout(v275);
  }
  if (!v276) return { localPath: null, error: "empty blob" };
  const v279 =
      String(v272 || "")
        ["trim"]()
        ["toLowerCase"]() || "bin",
    v280 = new URLSearchParams({ ext: v279 });
  try {
    const v281 = await requester({
      url: "/api/v2/save_output?" + v280["toString"](),
      method: "POST",
      provider: "local",
      timeout: 8 * 60 * 1000,
      headers: { "Content-Type": "application/octet-stream" },
      body: v276,
    });
    return { localPath: pickResultLocalPath(v281) || null, error: null };
  } catch (v282) {
    const v283 = v282 instanceof Error ? v282["message"] : String(v282 || "");
    return { localPath: null, error: v283 || "save failed" };
  }
}
async function trySaveOutputFromUrl(v284, v285 = {}) {
  const v286 = _toLocalPathIfSameOrigin(v284);
  if (v286) return { localPath: v286, error: null };
  const v287 = _normalizeRemoteUrl(v284);
  if (!v287) return { localPath: null, error: "empty\x20url" };
  const v288 = _guessExtFromUrl(v287, "mp4");
  try {
    const v289 = await requester({
      url: "/api/v2/save_output_from_url",
      method: "POST",
      provider: "local",
      timeout: 8 * 60 * 1000,
      headers: { "Content-Type": "application/json" },
      body: JSON["stringify"]({
        url: v287,
        ext: v288,
        maxBytes: 1024 * 1024 * 1024,
        dedupeKey: v285?.["dedupeKey"],
      }),
    });
    return { localPath: pickResultLocalPath(v289) || null, error: null };
  } catch (v290) {
    const v291 =
        v290 instanceof Error
          ? String(v290["message"] || "")
          : String(v290 || ""),
      v292 = v290 instanceof ApiError ? v290["status"] : null,
      v293 =
        v292 === 400 ||
        v292 === 401 ||
        v292 === 403 ||
        v292 === 502 ||
        v292 === 504;
    if (v293) {
      const v294 = await _trySaveOutputByClientDownload(v287, v288);
      if (v294["localPath"]) return v294;
      if (v294["error"])
        return {
          localPath: null,
          error:
            "" +
            v291 +
            (v294["error"] ? "；浏览器兜底失败：" + v294["error"] : ""),
        };
    }
    return { localPath: null, error: v291 || "save failed" };
  }
}
function getVideoResultSourceUrl(v295) {
  if (typeof v295 === "string") return String(v295 || "")["trim"]();
  if (!v295 || typeof v295 !== "object" || Array["isArray"](v295)) return "";
  return String(
    v295["videoUrl"] ||
      v295["url"] ||
      v295["localUrl"] ||
      localPathToUrl(v295["localPath"]) ||
      "",
  )["trim"]();
}
function buildPostProcessedVideoItem(v296, v297 = {}) {
  const v298 =
      v296 && typeof v296 === "object" && !Array["isArray"](v296)
        ? v296
        : { videoUrl: v296 },
    v299 = getVideoResultSourceUrl(v298),
    v300 = pickResultLocalPath(v297) || pickResultLocalPath(v298),
    v301 = localPathToUrl(v300),
    v302 = v301 || v299,
    v303 = { ...v298, videoUrl: v302 };
  v299 &&
    v299 !== v302 &&
    !String(v303["sourceUrl"] || "")["trim"]() &&
    (v303["sourceUrl"] = v299);
  if (v300) v303["localPath"] = v300;
  else delete v303["localPath"];
  for (const v304 of [
    "displayLocalPath",
    "posterLocalPath",
    "thumbLocalPath",
    "videoProxyStatus",
    "videoCodec",
  ]) {
    if (v297?.[v304]) v303[v304] = v297[v304];
  }
  if (v297?.["error"]) v303["saveError"] = v297["error"];
  else delete v303["saveError"];
  return v303;
}
async function postProcessVideoResult(v305, v306 = {}) {
  if (!v305) return v305;
  if (Array["isArray"](v305["videos"])) {
    const v307 = [];
    for (const v308 of v305["videos"]) {
      const v309 = getVideoResultSourceUrl(v308);
      if (!v309) continue;
      const v310 = await trySaveOutputFromUrl(v309, {
        dedupeKey: v306?.["taskKey"] ? v306["taskKey"] + ":" + v309 : undefined,
      });
      v307["push"](buildPostProcessedVideoItem(v308, v310));
    }
    if (v307["length"] === 0 && getVideoResultSourceUrl(v305)) {
      const v311 = { ...v305 };
      return (
        delete v311["isBatch"],
        delete v311["videos"],
        await postProcessVideoResult(v311, v306)
      );
    }
    if (v307["length"] === 0)
      throw new ApiError({
        type: "PARSE_ERROR",
        provider: v306?.["providerId"] || "unknown",
        message: "无法从服务器响应中提取视频地址",
        raw: v305,
        retryable: false,
      });
    return {
      isBatch: Boolean(v305["isBatch"] || v307["length"] > 1),
      videos: v307,
      videoUrl: v307[0]?.["videoUrl"],
      sourceUrl: v307[0]?.["sourceUrl"],
      thumbUrl: v307[0]?.["thumbUrl"],
      localPath: v307[0]?.["localPath"],
      displayLocalPath: v307[0]?.["displayLocalPath"],
      posterLocalPath: v307[0]?.["posterLocalPath"],
      videoProxyStatus: v307[0]?.["videoProxyStatus"],
      videoCodec: v307[0]?.["videoCodec"],
      saveError: v307[0]?.["saveError"],
    };
  }
  if (v305["videoUrl"]) {
    const v312 = await trySaveOutputFromUrl(v305["videoUrl"], {
      dedupeKey: v306?.["taskKey"]
        ? v306["taskKey"] + ":" + v305["videoUrl"]
        : undefined,
    });
    return buildPostProcessedVideoItem(v305, v312);
  }
  return v305;
}
export async function generateVideo(v313, v314) {
  const v315 = resolveVideoExecution(v313),
    v316 = resolveVideoProviderId(v313, v315),
    v317 = v315?.["executionManifest"],
    v318 = v317?.["adapterType"] === "workflow";
  if (
    v317?.["adapterType"] === "localRuntime" &&
    v317?.["runtime"] === "dreaminaVideo"
  ) {
    const v319 = {
      ...v313,
      prompt: applyCameraAngleToPrompt(v313["prompt"], v313["cameraAngle"]),
    };
    return await runDreaminaVideoGeneration(v319, v314);
  }
  const v320 = await buildGenerateVideoRequest(v313),
    v321 = v320?.["responseMapping"] || null,
    v322 = {
      ...(v314 || {}),
      ...(v321 ? { responseMapping: v321 } : {}),
      ...(v320?.["taskPolling"] ? { taskPolling: v320["taskPolling"] } : {}),
    },
    v323 = { ...(v320["headers"] || {}) },
    v324 = String(v313?.["installId"] || "")["trim"]();
  if (v324) v323["X-AIC-Install-Id"] = v324;
  let v325,
    v326 = "",
    v327 = null;
  try {
    if (v318) {
      const v328 = await requester({
        url: v320["url"],
        method: "POST",
        provider: v316,
        timeout: GENERATION_TIMEOUT,
        signal: v314?.["signal"],
        headers: v323,
        body: JSON["stringify"](v320["body"]),
        responseType: "text",
        returnMeta: true,
      });
      ((v326 = String(v328?.["data"] ?? "")),
        (v327 = v328?.["headers"] || null),
        (v325 = parseVideoResponseData(v326)));
    } else
      v325 = await requester({
        url: v320["url"],
        method: "POST",
        provider: v316,
        timeout: GENERATION_TIMEOUT,
        signal: v314?.["signal"],
        headers: v323,
        body: JSON["stringify"](v320["body"]),
      });
  } catch (v329) {
    if (v329 instanceof ApiError) throw v329;
    throw parseNetworkError(v316, v329, GENERATION_TIMEOUT);
  }
  let v330 = null;
  if (v318) {
    if (String(v325?.["code"] || "") === "SUBSCRIPTION_REQUIRED") {
      const v331 = new Error(
        v325?.["message"] || "该模型为\x20VIP，请先激活\x20CDKEY/订阅",
      );
      ((v331["code"] = "SUBSCRIPTION_REQUIRED"),
        (v331["contactText"] = v325?.["contactText"] || ""),
        (v331["contactUrl"] = v325?.["contactUrl"] || ""));
      throw v331;
    }
    const v332 = typeof v325?.["code"] === "number" ? v325["code"] : null;
    if (v332 !== null && v332 !== 0) throw parseError(v316, v325, 200);
    const v333 = resolveRunningHubVideoTaskId(v325, v326, v327, v321) || null;
    if (v333) {
      const v334 =
        v320["useOpenapiQuery"] === true ||
        v320["url"] === "/api/v2/proxy/image";
      (v314?.["onTaskMeta"]?.({ taskId: String(v333), useOpenapiQuery: v334 }),
        v314?.["onTaskId"]?.(String(v333)));
      const v335 = await pollRunningHubVideoTask(String(v333), v313, v316, {
        ...v322,
        useOpenapiQuery: v334,
      });
      v330 = processVideoTaskResult(v335, v316, v322);
    }
  }
  if (!v330) {
    const v336 = resolveAsyncVideoTaskId(v325, v321);
    if (v336) {
      const v337 = getProviderConfig(v316),
        v338 =
          v320["useOpenapiQuery"] === true ||
          (v316 === "runninghub" && v320["url"] === "/api/v2/proxy/image"),
        v339 =
          v313["apiKey"] ||
          (v316 === "runninghub" ? v337["modelApiKey"] : "") ||
          v337["apiKey"];
      (v314?.["onTaskMeta"]?.({
        taskId: String(v336),
        provider: v316,
        kind: "video",
        ...(v338 ? { useOpenapiQuery: true } : {}),
      }),
        v314?.["onTaskId"]?.(String(v336)));
      if (v338) {
        const v340 = await pollRunningHubVideoTask(
          String(v336),
          { ...v313, apiKey: v339 },
          v316,
          { ...v322, useOpenapiQuery: true },
        );
        v330 = processVideoTaskResult(v340, v316, v322);
      } else v330 = await pollVideoTask(v336, v316, v339, v322);
    }
  }
  if (!v330) {
    const v341 = extractVideoUrls(v325, v321)[0] || extractVideoUrl(v325);
    if (!v341) {
      const v342 = parseError(v316, v325, 200);
      if (v342) throw new Error(v342["getUserMessage"]());
      throw new ApiError({
        type: "PARSE_ERROR",
        provider: v316,
        message: "无法获取视频地址",
        raw: v325,
        retryable: false,
      });
    }
    v330 = { videoUrl: v341 };
  }
  return await postProcessVideoResult(v330, { providerId: v316 });
}
export const __test__ = {
  extractVideoEntries: extractVideoEntries,
  extractVideoUrls: extractVideoUrls,
  processVideoTaskResult: processVideoTaskResult,
};
