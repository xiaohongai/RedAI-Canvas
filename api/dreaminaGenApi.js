import { requester } from "./requester.js";
import { runTaskSingleFlight } from "./taskSingleFlight.js";
import {
  ensureDreaminaVideoModelForTask,
  getDreaminaVideoModelVersion,
  normalizeDreaminaVideoDuration,
  normalizeDreaminaVideoAspectRatio,
  normalizeDreaminaVideoModel,
  normalizeDreaminaVideoResolution,
  normalizeDreaminaVideoRouteMode,
  resolveDreaminaVideoTaskType,
  validateDreaminaVideoRouteSelection,
} from "../src/modules/dreaminaVideoModelHelper.js";
import {
  localPathToUrl,
  normalizeLocalPath,
} from "../src/utils/localMediaPath.js";
const DREAMINA_SUBMIT_TIMEOUT = 45000,
  DREAMINA_QUERY_TIMEOUT = 60000,
  DREAMINA_POLL_INTERVAL = 2000,
  DREAMINA_MAX_WAIT = 10 * 60 * 1000,
  DREAMINA_QUERY_RETRIES = 2,
  DREAMINA_QUERY_RETRY_DELAY = 350,
  DREAMINA_MAX_TRANSIENT_ERRORS = 12;
export const DREAMINA_POLL_TIMEOUT_CODE = "DREAMINA_POLL_TIMEOUT";
const DREAMINA_QUEUE_HINTS = ["queue", "queued", "waiting", "wait", "pending"],
  DREAMINA_TRANSIENT_ERROR_HINTS = [
    "timeout",
    "time out",
    "timed\x20out",
    "超时",
    "网络",
    "network",
    "connect",
    "connection",
    "socket",
    "econn",
    "enotfound",
    "eai_again",
    "temporary",
    "temporarily",
    "暂时",
    "稍后",
    "busy",
    "service unavailable",
    "rate limit",
    "too many requests",
    "429",
    "500",
    "502",
    "503",
    "504",
  ];
function toStatus(v0) {
  const v1 = String(v0 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (["success", "succeeded", "done", "finish", "finished"]["includes"](v1))
    return "success";
  if (["fail", "failed", "error"]["includes"](v1)) return "failed";
  return "pending";
}
function collectPayloadObjects(...v2) {
  const v3 = [],
    v4 = new Set(),
    v5 = (v6, v7 = 0) => {
      if (!v6 || v7 > 5) return;
      if (Array["isArray"](v6)) {
        v6["forEach"]((v8) => v5(v8, v7 + 1));
        return;
      }
      if (typeof v6 !== "object") return;
      if (v4["has"](v6)) return;
      (v4["add"](v6),
        v3["push"](v6),
        ["data", "result", "queryResult", "listTask", "task", "tasks"][
          "forEach"
        ]((v9) => v5(v6[v9], v7 + 1)));
    };
  return (v2["forEach"]((v10) => v5(v10, 0)), v3);
}
function firstPayloadString(v11, v12) {
  for (const v13 of v11) {
    for (const v14 of v12) {
      const v15 = String(v13?.[v14] || "")["trim"]();
      if (v15) return v15;
    }
  }
  return "";
}
function extractDreaminaRawStatus(v16, v17) {
  const v18 = collectPayloadObjects(v16, v17)
    ["map"]((v19) =>
      firstPayloadString([v19], ["status", "gen_status", "genStatus"])[
        "toLowerCase"
      ](),
    )
    ["filter"](Boolean);
  if (v18["some"]((v20) => ["fail", "failed", "error"]["includes"](v20)))
    return "failed";
  if (
    v18["some"]((v21) =>
      ["success", "succeeded", "done", "finish", "finished"]["includes"](v21),
    )
  )
    return "success";
  return "";
}
function extractDreaminaRawFailReason(v22, v23) {
  return firstPayloadString(collectPayloadObjects(v22, v23), [
    "failReason",
    "fail_reason",
    "failureReason",
    "failure_reason",
  ]);
}
function extractDreaminaRawErrorMessage(v24, v25) {
  return firstPayloadString(collectPayloadObjects(v24, v25), [
    "error",
    "errorMessage",
    "message",
    "msg",
  ]);
}
function isDreaminaTerminalFailureMessage(v26) {
  const v27 = String(v26 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (!v27) return false;
  return [
    "失败",
    "审核未通过",
    "内容安全",
    "安全审核",
    "违规",
    "敏感",
    "不符合",
    "拦截",
    "风控",
    "failed",
    "failure",
    "error",
    "review\x20failed",
    "content safety",
    "content filter",
    "violation",
    "sensitive",
    "flagged",
    "blocked",
    "not allowed",
  ]["some"]((v28) => v27["includes"](v28));
}
function normalizeResolutionType(v29) {
  const v30 = String(v29 || "")["trim"]();
  if (!v30) return "";
  return v30["toLowerCase"]();
}
function toTrimmedArray(v31) {
  if (!Array["isArray"](v31)) return [];
  const v32 = [];
  return (
    v31["forEach"]((v33) => {
      const v34 = String(v33 || "")["trim"]();
      if (v34) v32["push"](v34);
    }),
    v32
  );
}
function basenameFromPath(v35) {
  const v36 = String(v35 || "")
    ["trim"]()
    ["replace"](/\\/g, "/");
  if (!v36) return "";
  return v36["split"]("/")["filter"](Boolean)["pop"]() || "";
}
export function normalizeDreaminaErrorMessage(v37) {
  const v38 = String(v37 || "")["trim"]();
  if (!v38) return "";
  const v39 = v38["toLowerCase"]();
  if (
    v39["includes"]("do\x20request:") &&
    (v39["includes"]("context\x20deadline\x20exceeded") ||
      v39["includes"]("client.timeout") ||
      v39["includes"]("awaiting headers"))
  )
    return "即梦官方生成接口响应超时，本次没有拿到任务ID。网页可用不代表 CLI 生成接口稳定，请稍后重试；如果连续出现，请切换网络/代理或重新登录即梦后再试。";
  let v40 = v38["match"](
    /upload resource\s+"([^"]+)"\s*:\s*upload (video|audio)\s*:\s*duration\s+([0-9.]+)\s+seconds\s+is\s+out\s+of\s+allowed\s+range\s+\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]/i,
  );
  !v40 &&
    ((v40 = v38["match"](
      /upload (video|audio)\s*:\s*duration\s+([0-9.]+)\s+seconds\s+is\s+out\s+of\s+allowed\s+range\s+\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]/i,
    )),
    v40 && (v40 = ["", "", ...v40["slice"](1)]));
  if (v40) {
    const [, v41, v42, v43, v44, v45] = v40,
      v46 = String(v42 || "")["toLowerCase"]() === "audio",
      v47 = basenameFromPath(v41),
      v48 = v46 ? "源音频" : "源视频",
      v49 = v47 ? "“" + v47 + "”" : v48,
      v50 = v46
        ? "请将音频裁剪到 " + v45 + " 秒以内后再上传。"
        : "请将视频裁剪到\x20" +
          v45 +
          "\x20秒以内，建议裁到\x2014.9\x20秒后再上传。";
    return (
      "上传" +
      v48 +
      "失败：" +
      v49 +
      "时长\x20" +
      v43 +
      " 秒，超出即梦允许范围（" +
      v44 +
      "-" +
      v45 +
      "\x20秒）。" +
      v50
    );
  }
  return v38;
}
function normalizeDreaminaThrownError(v51) {
  if (v51 && typeof v51 === "object") {
    const v52 = normalizeDreaminaErrorMessage(v51["message"]);
    if (v52) v51["message"] = v52;
  }
  return v51;
}
function normalizeModelVersion(v53) {
  const v54 = String(v53?.["modelVersion"] || "")["trim"]();
  if (v54) return v54;
  const v55 = String(v53?.["model"] || "")["trim"]();
  if (!v55["startsWith"]("dreamina/")) return "";
  const v56 = v55["slice"]("dreamina/"["length"])["trim"]();
  if (
    v56 === "text2image" ||
    v56 === "image2image" ||
    v56 === "text2video" ||
    v56 === "image2video"
  )
    return "";
  return v56;
}
function normalizeDreaminaRatio(v57, v58) {
  const v59 = String(v57?.["aspectRatio"] || "")["trim"]();
  if (!v59) return "";
  if (v59 === "自适应" || v59 === "auto") return v58 ? "" : "1:1";
  return v59;
}
function toLocalPath(v60) {
  return normalizeLocalPath(v60);
}
function toLocalUrl(v61) {
  return localPathToUrl(v61);
}
function normalizeOutputsArray(v62) {
  const v63 = [],
    v64 = new Set(),
    v65 = new Set([
      "data",
      "result",
      "results",
      "output",
      "outputs",
      "raw",
      "queryResult",
      "image",
      "images",
      "image_list",
      "imageList",
      "image_infos",
      "imageInfos",
      "video",
      "videos",
      "video_list",
      "videoList",
      "video_infos",
      "videoInfos",
      "media",
      "medias",
      "media_list",
      "mediaList",
      "file",
      "files",
      "file_list",
      "fileList",
      "resource",
      "resources",
      "download",
      "downloads",
      "content",
      "contents",
    ]),
    v66 = [
      "url",
      "uri",
      "download_url",
      "downloadUrl",
      "file_url",
      "fileUrl",
      "media_url",
      "mediaUrl",
      "image_url",
      "imageUrl",
      "origin_image_url",
      "originImageUrl",
      "original_image_url",
      "originalImageUrl",
      "result_image_url",
      "resultImageUrl",
      "video_url",
      "videoUrl",
      "cover_url",
      "coverUrl",
      "src",
    ],
    v67 = [
      "local_path",
      "localPath",
      "path",
      "file_path",
      "filePath",
      "download_path",
      "downloadPath",
      "local_uri",
      "localUri",
    ],
    v68 = (v69, v70) => {
      for (const v71 of v70) {
        const v72 = String(v69?.[v71] || "")["trim"]();
        if (v72) return v72;
      }
      return "";
    },
    v73 = (v74) => {
      if (!v74 || typeof v74 !== "object") return;
      const v75 = v68(v74, v66),
        v76 = v68(v74, v67),
        v77 = String(v74?.["mimeType"] || v74?.["mime_type"] || "")["trim"]();
      if (!v75 && !v76) return;
      const v78 = [v75, v76, v77]["join"]("|");
      if (v64["has"](v78)) return;
      (v64["add"](v78), v63["push"](v74));
    },
    v79 = (v80) => {
      const v81 = String(v80 || "")["trim"](),
        v82 = v81["toLowerCase"]();
      if (
        v82["includes"]("input") ||
        v82["includes"]("reference") ||
        v82["includes"]("prompt")
      )
        return false;
      return (
        v65["has"](v81) ||
        v82["includes"]("output") ||
        v82["includes"]("result") ||
        v82["includes"]("image") ||
        v82["includes"]("video") ||
        v82["includes"]("media") ||
        v82["includes"]("file") ||
        v82["includes"]("url") ||
        v82["includes"]("uri")
      );
    },
    v83 = (v84, v85 = 0) => {
      if (!v84 || v85 > 8) return;
      if (typeof v84 === "string") {
        const v86 = v84["trim"]();
        if (/^https?:\/\//i["test"](v86)) v73({ url: v86 });
        return;
      }
      if (Array["isArray"](v84)) {
        v84["forEach"]((v87) => v83(v87, v85 + 1));
        return;
      }
      if (typeof v84 !== "object") return;
      (v73({
        url: v68(v84, v66),
        localPath: v68(v84, v67),
        mimeType: String(v84?.["mimeType"] || v84?.["mime_type"] || "")[
          "trim"
        ](),
      }),
        Object["entries"](v84)["forEach"](([v88, v89]) => {
          if (v79(v88)) v83(v89, v85 + 1);
        }));
    };
  return (
    v83(v62),
    v63["map"]((v90) => {
      const v91 = toLocalPath(v90?.["localPath"]);
      return {
        url: String(v90?.["url"] || "")["trim"](),
        localPath: v91,
        localUrl: toLocalUrl(v91),
        mimeType: String(v90?.["mimeType"] || "")["trim"](),
      };
    })["filter"]((v92) => v92["url"] || v92["localPath"])
  );
}
function hasDreaminaUsableOutputs(v93) {
  return normalizeOutputsArray(v93)["length"] > 0;
}
function normalizeQueueMetric(v94) {
  const v95 = Number(v94);
  if (!Number["isFinite"](v95) || v95 < 0) return null;
  return Math["trunc"](v95);
}
function normalizeQueueStatus(v96) {
  return String(v96 || "")
    ["trim"]()
    ["toLowerCase"]();
}
function isDreaminaQueuedState(v97, v98) {
  if (v97 !== "pending") return false;
  if (!v98) return false;
  return DREAMINA_QUEUE_HINTS["some"]((v99) => v98["includes"](v99));
}
function phaseToLabel(v100, v101 = "") {
  if (v100 === "queued") return "排队中";
  if (v100 === "generating") return "生成中";
  if (v100 === "syncing") return "正在同步结果";
  if (v100 === "done") return "已完成";
  if (v100 === "failed") return String(v101 || "")["trim"]() || "查询失败";
  return "处理中";
}
function sleep(v102) {
  return new Promise((v103) => setTimeout(v103, v102));
}
function includesTransientHint(v104) {
  const v105 = String(v104 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (!v105) return false;
  return DREAMINA_TRANSIENT_ERROR_HINTS["some"]((v106) =>
    v105["includes"](v106),
  );
}
function isTransientDreaminaError(v107) {
  if (v107?.["dreaminaReturnedError"] === true) return false;
  const v108 = String(v107?.["code"] || "")
      ["trim"]()
      ["toUpperCase"](),
    v109 = String(v107?.["type"] || "")
      ["trim"]()
      ["toUpperCase"](),
    v110 = Number(v107?.["status"]);
  if (
    v108 === "TIMEOUT" ||
    v108 === "ETIMEDOUT" ||
    v108 === "ECONNRESET" ||
    v108 === "ECONNREFUSED" ||
    v108 === "ENOTFOUND" ||
    v108 === "EAI_AGAIN"
  )
    return true;
  if (
    v109 === "TIMEOUT" ||
    v109 === "NETWORK_ERROR" ||
    v109 === "DNS_ERROR" ||
    v109 === "RATE_LIMIT" ||
    v109 === "SERVER_ERROR" ||
    v109 === "SERVICE_UNAVAILABLE"
  )
    return true;
  if (v110 === 429 || v110 >= 500) return true;
  return includesTransientHint(v107?.["message"] || v107);
}
export function normalizeDreaminaTaskSnapshot(v111, v112 = {}) {
  const v113 = String(
      v112?.["submitId"] ||
        v111?.["submitId"] ||
        v111?.["raw"]?.["submitId"] ||
        "",
    )["trim"](),
    v114 = normalizeOutputsArray(v111),
    v115 = toStatus(v111?.["status"]),
    v116 =
      v111?.["raw"] &&
      typeof v111["raw"] === "object" &&
      !Array["isArray"](v111["raw"])
        ? v111["raw"]
        : {},
    v117 = extractDreaminaRawStatus(v111, v116),
    v118 = normalizeQueueStatus(
      v116["queue_status"] || v116["queueStatus"] || v111?.["queueStatus"],
    ),
    v119 = normalizeQueueMetric(
      v116["queue_idx"] ?? v116["queueIndex"] ?? v111?.["queueIndex"],
    ),
    v120 = normalizeQueueMetric(
      v116["queue_length"] ?? v116["queueLength"] ?? v111?.["queueLength"],
    ),
    v121 = extractDreaminaRawFailReason(v111, v116),
    v122 = extractDreaminaRawErrorMessage(v111, v116),
    v123 = v117 === "failed" || v115 === "failed",
    v124 = v123 || isDreaminaTerminalFailureMessage(v122) ? v122 : "",
    v125 = v121 || v124,
    v126 = v123 || v125 ? "failed" : v117 || v115;
  let v127 = "generating";
  if (v126 === "failed") v127 = "failed";
  else {
    if (v126 === "success") v127 = v114["length"] > 0 ? "done" : "syncing";
    else isDreaminaQueuedState(v126, v118) && (v127 = "queued");
  }
  const v128 =
    v126 === "failed"
      ? "failed"
      : v126 === "success" && v114["length"] > 0
        ? "success"
        : "pending";
  return {
    submitId: v113,
    status: v128,
    phase: v127,
    label: phaseToLabel(v127, v125),
    queueStatus: v118,
    queueIndex: v119,
    queueLength: v120,
    outputs: v114,
    failReason: v125,
    raw: v116,
    isTerminal: v127 === "done" || v127 === "failed",
    hasOutputs: v114["length"] > 0,
    lastCheckedAt: Date["now"](),
  };
}
function postJson(v129, v130) {
  return requester({
    url: v129,
    method: "POST",
    provider: "dreamina",
    timeout: DREAMINA_SUBMIT_TIMEOUT,
    headers: { "Content-Type": "application/json" },
    body: JSON["stringify"](v130 || {}),
  });
}
export async function submitDreaminaText2Image(v131) {
  return postJson("/api/v2/dreamina/text2image", v131);
}
export async function submitDreaminaImage2Image(v132) {
  return postJson("/api/v2/dreamina/image2image", v132);
}
export async function submitDreaminaText2Video(v133) {
  return postJson("/api/v2/dreamina/text2video", v133);
}
export async function submitDreaminaImage2Video(v134) {
  return postJson("/api/v2/dreamina/image2video", v134);
}
export async function submitDreaminaFrames2Video(v135) {
  return postJson("/api/v2/dreamina/frames2video", v135);
}
export async function submitDreaminaMultiframe2Video(v136) {
  return postJson("/api/v2/dreamina/multiframe2video", v136);
}
export async function submitDreaminaMultimodal2Video(v137) {
  return postJson("/api/v2/dreamina/multimodal2video", v137);
}
export async function queryDreaminaResult(v138, v139 = {}) {
  const v140 = String(v138 || "")["trim"]();
  if (!v140) throw new Error("submitId 不能为空");
  const v141 = v139?.["autoDownload"] !== false,
    v142 = new URLSearchParams({
      submitId: v140,
      autoDownload: v141 ? "1" : "0",
    }),
    v143 = await requester({
      url: "/api/v2/dreamina/query_result?" + v142["toString"](),
      method: "GET",
      provider: "dreamina",
      timeout: DREAMINA_QUERY_TIMEOUT,
      retries: Number["isFinite"](Number(v139?.["retries"]))
        ? Math["max"](0, Math["trunc"](Number(v139["retries"])))
        : DREAMINA_QUERY_RETRIES,
      retryDelay: Number["isFinite"](Number(v139?.["retryDelay"]))
        ? Math["max"](0, Math["trunc"](Number(v139["retryDelay"])))
        : DREAMINA_QUERY_RETRY_DELAY,
    });
  if (v143?.["success"] === false) {
    const v144 = new Error(
      normalizeDreaminaErrorMessage(v143?.["message"]) || "即梦任务查询失败",
    );
    ((v144["code"] = "DREAMINA_RETURNED_ERROR"),
      (v144["dreaminaReturnedError"] = true));
    throw v144;
  }
  return v143 || {};
}
async function pollDreaminaUntilDoneOnce(v145, v146 = {}) {
  const v147 = Number(v146?.["maxWaitMs"] || DREAMINA_MAX_WAIT),
    v148 = Number(v146?.["intervalMs"] || DREAMINA_POLL_INTERVAL),
    v149 = Number["isFinite"](Number(v146?.["maxTransientErrors"]))
      ? Math["max"](0, Math["trunc"](Number(v146["maxTransientErrors"])))
      : DREAMINA_MAX_TRANSIENT_ERRORS,
    v150 = Date["now"]();
  let v151 = null,
    v152 = 0;
  while (Date["now"]() - v150 < v147) {
    if (v146?.["signal"]?.["aborted"]) throw new Error("CANCELLED");
    let v153 = null;
    try {
      ((v151 = await queryDreaminaResult(v145, { autoDownload: true })),
        (v153 = normalizeDreaminaTaskSnapshot(v151, { submitId: v145 })));
    } catch (v154) {
      if (
        v146?.["signal"]?.["aborted"] ||
        v154?.["name"] === "AbortError" ||
        v154?.["message"] === "CANCELLED"
      )
        throw v154;
      if (isTransientDreaminaError(v154)) {
        v152 += 1;
        if (v152 > v149) {
          const v155 = new Error(
            "即梦任务查询连续异常（" + v152 + " 次），请稍后重试",
          );
          ((v155["code"] = "DREAMINA_QUERY_TRANSIENT_EXHAUSTED"),
            (v155["submitId"] = String(v145 || "")["trim"]()),
            (v155["cause"] = v154));
          throw v155;
        }
        await sleep(v148);
        continue;
      }
      throw v154;
    }
    v152 = 0;
    typeof v146?.["onProgress"] === "function" &&
      (await v146["onProgress"](v153));
    const v156 = toStatus(v153?.["status"]);
    if (v156 === "failed") return v151;
    if (v156 === "success" && hasDreaminaUsableOutputs(v151)) return v151;
    await sleep(v148);
  }
  try {
    const v157 = await queryDreaminaResult(v145, { autoDownload: true }),
      v158 = normalizeDreaminaTaskSnapshot(v157, { submitId: v145 });
    typeof v146?.["onProgress"] === "function" &&
      (await v146["onProgress"](v158));
    const v159 = toStatus(v158?.["status"]);
    if (v159 === "failed") return v157;
    if (v159 === "success" && hasDreaminaUsableOutputs(v157)) return v157;
    v151 = v157;
  } catch (v160) {
    throw v160;
  }
  const v161 =
      Number["isFinite"](v147) && v147 > 0
        ? Math["max"](1, Math["ceil"](v147 / 60000))
        : 0,
    v162 = new Error(
      v161 > 0
        ? "即梦任务处理超时（已等待约 " + v161 + " 分钟）"
        : "即梦任务处理超时，请稍后重试",
    );
  ((v162["code"] = DREAMINA_POLL_TIMEOUT_CODE),
    (v162["submitId"] = String(v145 || "")["trim"]()));
  throw v162;
}
export async function pollDreaminaUntilDone(v163, v164 = {}) {
  const v165 = String(v163 || "")["trim"](),
    v166 =
      String(v164?.["taskKind"] || v164?.["kind"] || "task")["trim"]() ||
      "task";
  return runTaskSingleFlight(
    { provider: "dreamina", kind: v166, submitId: v165 },
    () => pollDreaminaUntilDoneOnce(v165, v164),
  );
}
export async function runDreaminaImageGeneration(v167, v168 = {}) {
  const v169 = String(v167?.["prompt"] || "")["trim"](),
    v170 = Array["isArray"](v167?.["inputUrls"])
      ? v167["inputUrls"]["filter"](Boolean)
      : [],
    v171 = v170["length"] > 0,
    v172 = normalizeDreaminaRatio(v167, v171),
    v173 = normalizeResolutionType(v167?.["imageSize"]),
    v174 = normalizeModelVersion(v167),
    v175 = { prompt: v169 };
  if (v172) v175["ratio"] = v172;
  if (v173) v175["resolutionType"] = v173;
  if (v174) v175["modelVersion"] = v174;
  let v176 = null;
  v170["length"] > 0
    ? (v176 = await submitDreaminaImage2Image({ images: v170, ...v175 }))
    : (v176 = await submitDreaminaText2Image({ ...v175 }));
  if (v176?.["success"] === false)
    throw new Error(
      normalizeDreaminaErrorMessage(v176?.["message"]) ||
        "即梦图片任务提交失败",
    );
  const v177 = String(v176?.["submitId"] || "")["trim"]();
  if (!v177) throw new Error("即梦图片任务提交失败：未返回\x20submitId");
  (v168?.["onTaskMeta"]?.({
    taskId: v177,
    submitId: v177,
    provider: "dreamina",
    kind: "image",
  }),
    v168?.["onTaskId"]?.(v177));
  const v178 = await pollDreaminaUntilDone(v177, {
      ...v168,
      taskKind: "image",
    }),
    v179 = normalizeDreaminaTaskSnapshot(v178, { submitId: v177 });
  if (v179?.["phase"] === "failed")
    throw new Error(
      normalizeDreaminaErrorMessage(v179?.["failReason"]) || "即梦图片生成失败",
    );
  const v180 = Array["isArray"](v179?.["outputs"]) ? v179["outputs"] : [];
  if (!v180["length"]) throw new Error("即梦图片生成完成，但没有可用输出");
  return v180["map"]((v181) => {
    const v182 = v181["localUrl"] || v181["url"];
    return {
      sourceId: null,
      thumbId: null,
      sourceUrl: v181["url"] || v182,
      thumbUrl: v182,
      imageUrl: v182,
      localPath: v181["localPath"] || "",
    };
  });
}
export function buildDreaminaVideoSubmitRequest(v183 = {}) {
  const v184 = toTrimmedArray(
      Array["isArray"](v183?.["images"]) && v183["images"]["length"]
        ? v183["images"]
        : v183?.["inputUrls"],
    ),
    v185 = toTrimmedArray(v183?.["videos"]),
    v186 = toTrimmedArray(v183?.["audios"]),
    v187 = normalizeDreaminaVideoRouteMode(
      v183?.["dreaminaRouteMode"],
      v183?.["mode"],
    ),
    v188 =
      String(v183?.["dreaminaTaskType"] || "")["trim"]() ||
      resolveDreaminaVideoTaskType({
        routeMode: v187,
        imageCount: v184["length"],
        videoCount: v185["length"],
        audioCount: v186["length"],
      }),
    v189 = validateDreaminaVideoRouteSelection({
      routeMode: v187,
      taskType: v188,
      imageCount: v184["length"],
      videoCount: v185["length"],
      audioCount: v186["length"],
    });
  if (v189) throw new Error(v189);
  const v190 = String(v183?.["prompt"] || "")["trim"](),
    v191 = normalizeDreaminaVideoModel(v183?.["model"], v183?.["provider"]),
    v192 = ensureDreaminaVideoModelForTask(v188, v191, "dreamina") || v191,
    v193 =
      String(v183?.["modelVersion"] || "")["trim"]() ||
      getDreaminaVideoModelVersion(v192, "dreamina") ||
      normalizeModelVersion(v183),
    v194 = String(v183?.["installId"] || "")["trim"](),
    v195 = normalizeDreaminaVideoResolution(
      v188,
      v192,
      v183?.["videoResolution"] || v183?.["videoSize"] || v183?.["resolution"],
      "dreamina",
    ),
    v196 = normalizeDreaminaVideoAspectRatio(v183?.["aspectRatio"]),
    v197 = normalizeDreaminaVideoDuration(
      v188,
      v192,
      v183?.["duration"],
      "dreamina",
    );
  if (v188 === "text2video") {
    if (!v190) throw new Error("文生视频需要填写提示词");
    return {
      taskType: v188,
      url: "/api/v2/dreamina/text2video",
      body: {
        prompt: v190,
        duration: v197,
        ratio: v196,
        videoResolution: v195,
        ...(v194 ? { installId: v194 } : {}),
        ...(v193 ? { modelVersion: v193 } : {}),
      },
    };
  }
  if (v188 === "image2video") {
    const v198 = String(v183?.["image"] || v184[0] || "")["trim"]();
    if (!v190) throw new Error("首帧生视频需要填写提示词");
    if (!v198) throw new Error("首帧生视频至少需要 1 张图片");
    return {
      taskType: v188,
      url: "/api/v2/dreamina/image2video",
      body: {
        image: v198,
        prompt: v190,
        duration: v197,
        videoResolution: v195,
        ...(v194 ? { installId: v194 } : {}),
        ...(v193 ? { modelVersion: v193 } : {}),
      },
    };
  }
  if (v188 === "frames2video") {
    const v199 = String(v183?.["first"] || v184[0] || "")["trim"](),
      v200 = String(v183?.["last"] || v184[1] || "")["trim"]();
    if (!v190) throw new Error("首尾帧模式需要填写提示词");
    if (!v199 || !v200) throw new Error("首尾帧模式至少需要 2 张图片");
    return {
      taskType: v188,
      url: "/api/v2/dreamina/frames2video",
      body: {
        first: v199,
        last: v200,
        prompt: v190,
        duration: v197,
        videoResolution: v195,
        ...(v194 ? { installId: v194 } : {}),
        ...(v193 ? { modelVersion: v193 } : {}),
      },
    };
  }
  if (v188 === "multiframe2video") {
    const v201 = v184["slice"](0, 20);
    if (v201["length"] < 2) throw new Error("多帧叙事至少需要 2 张图片");
    const v202 = Array["isArray"](v183?.["transitionPrompts"])
        ? v183["transitionPrompts"]["map"]((v203) =>
            String(v203 || "")["trim"](),
          )
        : [],
      v204 = Array["isArray"](v183?.["transitionDurations"])
        ? v183["transitionDurations"]
        : [],
      v205 = Math["max"](0, v201["length"] - 1),
      v206 = [],
      v207 = [];
    for (let v208 = 0; v208 < v205; v208 += 1) {
      v206["push"](String(v202[v208] || "")["trim"]() || v190);
      const v209 = Number(v204[v208]);
      v207["push"](
        Number["isFinite"](v209) && v209 > 0
          ? Math["max"](1, Math["trunc"](v209))
          : 3,
      );
    }
    const v210 = { images: v201 };
    if (v194) v210["installId"] = v194;
    if (v201["length"] === 2) {
      if (!(v206[0] || v190)) throw new Error("两张图的多帧叙事需要提示词");
      ((v210["prompt"] = v206[0] || v190),
        (v210["duration"] = v207[0] || v197 || 3));
    } else {
      if (!v206["every"]((v211) => String(v211 || "")["trim"]()))
        throw new Error("多帧叙事的每段 transition prompt 都不能为空");
      ((v210["transitionPrompts"] = v206),
        (v210["transitionDurations"] = v207));
    }
    return {
      taskType: v188,
      url: "/api/v2/dreamina/multiframe2video",
      body: v210,
    };
  }
  if (v188 === "multimodal2video") {
    if (!v184["length"] && !v185["length"])
      throw new Error("全能参考至少需要 1 个图片或视频参考");
    return {
      taskType: v188,
      url: "/api/v2/dreamina/multimodal2video",
      body: {
        images: v184,
        videos: v185,
        audios: v186,
        prompt: v190,
        duration: v197,
        ratio: v196,
        videoResolution: v195,
        ...(v194 ? { installId: v194 } : {}),
        ...(v193 ? { modelVersion: v193 } : {}),
      },
    };
  }
  throw new Error("未识别的即梦视频任务类型");
}
export async function runDreaminaVideoGeneration(v212, v213 = {}) {
  const v214 = buildDreaminaVideoSubmitRequest(v212 || {});
  let v215 = null;
  try {
    if (v214["url"] === "/api/v2/dreamina/text2video")
      v215 = await submitDreaminaText2Video(v214["body"]);
    else {
      if (v214["url"] === "/api/v2/dreamina/image2video")
        v215 = await submitDreaminaImage2Video(v214["body"]);
      else {
        if (v214["url"] === "/api/v2/dreamina/frames2video")
          v215 = await submitDreaminaFrames2Video(v214["body"]);
        else {
          if (v214["url"] === "/api/v2/dreamina/multiframe2video")
            v215 = await submitDreaminaMultiframe2Video(v214["body"]);
          else {
            if (v214["url"] === "/api/v2/dreamina/multimodal2video")
              v215 = await submitDreaminaMultimodal2Video(v214["body"]);
            else throw new Error("未知的即梦视频请求路由");
          }
        }
      }
    }
  } catch (v216) {
    throw normalizeDreaminaThrownError(v216);
  }
  if (v215?.["success"] === false) {
    const v217 = new Error(
      normalizeDreaminaErrorMessage(v215?.["message"]) ||
        "即梦视频任务提交失败",
    );
    if (v215?.["code"] != null) v217["code"] = String(v215["code"] || "");
    v215?.["requiredModelId"] != null &&
      (v217["requiredModelId"] = String(v215["requiredModelId"] || "")[
        "trim"
      ]());
    v215?.["subscriptionStatus"] != null &&
      (v217["subscriptionStatus"] = String(v215["subscriptionStatus"] || "")[
        "trim"
      ]());
    v215?.["reasonCode"] != null &&
      (v217["reasonCode"] = String(v215["reasonCode"] || "")["trim"]());
    ((v217["contactText"] = String(v215?.["contactText"] || "")["trim"]()),
      (v217["contactUrl"] = String(v215?.["contactUrl"] || "")["trim"]()));
    throw v217;
  }
  const v218 = String(v215?.["submitId"] || "")["trim"]();
  if (!v218) throw new Error("即梦视频任务提交失败：未返回 submitId");
  (v213?.["onTaskMeta"]?.({
    taskId: v218,
    submitId: v218,
    provider: "dreamina",
    kind: "video",
  }),
    v213?.["onTaskId"]?.(v218));
  const v219 = await pollDreaminaUntilDone(v218, {
      ...v213,
      taskKind: "video",
    }),
    v220 = normalizeDreaminaTaskSnapshot(v219, { submitId: v218 });
  if (v220?.["phase"] === "failed")
    throw new Error(
      normalizeDreaminaErrorMessage(v220?.["failReason"]) || "即梦视频生成失败",
    );
  const v221 = Array["isArray"](v220?.["outputs"]) ? v220["outputs"] : [];
  if (!v221["length"]) throw new Error("即梦视频生成完成，但没有可用输出");
  const v222 = v221["map"]((v223) => ({
    videoUrl: v223["localUrl"] || v223["url"],
    localPath: v223["localPath"] || "",
  }));
  return {
    isBatch: v222["length"] > 1,
    videos: v222,
    videoUrl: v222[0]?.["videoUrl"] || "",
    localPath: v222[0]?.["localPath"] || "",
  };
}
