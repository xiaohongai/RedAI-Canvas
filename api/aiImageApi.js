import { saveImage } from "../src/modules/storage.js";
import { compressImage } from "../src/modules/imageUtils.js";
import * as RunningHubAdapter from "./adapters/RunningHubAdapter.js";
import {
  buildImageRequestFromManifest,
  resolveManifestTaskPolling,
} from "./adapters/ModelApiManifestNormalizer.js";
import {
  resolveMappedResponseValue,
  resolveMappedResponseValues,
} from "./adapters/modelApiMappingEngine.js";
import { ensureConfig, getProviderConfig } from "./configApi.js";
import { applyCameraAngleToPrompt } from "./cameraPromptApi.js";
import {
  processInputImages,
  processInputImagesPreserveOrder,
} from "./imageUploadApi.js";
import { uploadInputsToVolcengineFiles } from "./volcengineFileApi.js";
import { cancelRunningHubTask } from "./runninghubTaskApi.js";
import {
  runDreaminaImageGeneration,
  pollDreaminaUntilDone,
  normalizeDreaminaTaskSnapshot,
} from "./dreaminaGenApi.js";
import {
  localPathToUrl,
  normalizeLocalPath,
  pickResultLocalPath,
} from "../src/utils/localMediaPath.js";
import {
  isModelApiModel,
  resolveModelExecution,
  resolveModelProvider,
} from "../src/manifests/index.js";
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
export async function cancelRunningHubImageTask({
  apiKey: v0,
  taskId: v1,
} = {}) {
  return cancelRunningHubTask({ apiKey: v0, taskId: v1 });
}
const GENERATION_RETRIES = 2,
  GENERATION_RETRY_DELAY = 1000;
function getProviderId(v2) {
  return resolveModelProvider(v2?.["model"], v2?.["provider"]);
}
function resolveModelApiExecutionForPayload(v3, v4) {
  const v5 = String(v4 || "")
      ["trim"]()
      ["toLowerCase"](),
    v6 = String(v3?.["model"] || "")["trim"]();
  if (!v6) return null;
  const v7 = resolveModelExecution(v6, { providerHint: v5 }),
    v8 = v7?.["executionManifest"];
  if (!v8 || v8["adapterType"] !== "modelApi" || v8["kind"] !== "image")
    return null;
  return v8;
}
function resolveImageTaskRuntimeOptions(v9 = {}, v10 = "", v11 = {}) {
  const v12 = String(v9?.["model"] || "")["trim"]();
  if (!v12) return v11 || {};
  const v13 = String(v10 || getProviderId(v9) || "")
      ["trim"]()
      ["toLowerCase"](),
    v14 = resolveModelExecution(v12, { providerHint: v13 }),
    v15 = v14?.["executionManifest"];
  if (!v15 || v15["adapterType"] !== "modelApi" || v15["kind"] !== "image")
    return v11 || {};
  const v16 = String(v15["provider"] || v13)
      ["trim"]()
      ["toLowerCase"](),
    v17 = getProviderConfig(v16),
    v18 = resolveManifestTaskPolling(v16, v17, v15, {
      modelManifest: v14?.["modelManifest"] || null,
    });
  return {
    ...(v11 || {}),
    ...(!v11?.["responseMapping"] && v15["responseMapping"]
      ? { responseMapping: v15["responseMapping"] }
      : {}),
    ...(!v11?.["taskPolling"] && v18 ? { taskPolling: v18 } : {}),
  };
}
function shouldSubmitProviderBatchOnce(v19, v20, v21) {
  if (!(Number["parseInt"](v21, 10) > 1)) return false;
  const v22 = resolveModelApiExecutionForPayload(v19, v20),
    v23 = v22?.["extensions"]?.["batchSubmitMode"];
  if (v23 === "providerN") return true;
  if (!v23 || typeof v23 !== "object" || Array["isArray"](v23)) return false;
  if (String(v23["type"] || "")["trim"]() !== "providerN") return false;
  if (v23["requiresInputImages"] === true) {
    const v24 = [
        v19?.["inputUrls"],
        v19?.["image_urls"],
        v19?.["imageUrls"],
        v19?.["images"],
      ],
      v25 = v24["some"]((v26) =>
        Array["isArray"](v26)
          ? v26["some"]((v27) => String(v27 || "")["trim"]())
          : String(v26 || "")["trim"](),
      );
    if (!v25) return false;
  }
  const v28 = String(v23["field"] || "")["trim"]();
  if (!v28) return true;
  const v29 = Array["isArray"](v23["values"]) ? v23["values"] : [v23["value"]],
    v30 = v29["map"]((v31) =>
      String(v31 ?? "")
        ["trim"]()
        ["toLowerCase"](),
    )["filter"](Boolean);
  if (v30["length"] === 0) return true;
  const v32 = String(v19?.[v28] ?? "")
    ["trim"]()
    ["toLowerCase"]();
  return v30["includes"](v32);
}
function resolveImageGenerationBatchSize(v33, v34) {
  const v35 = parseInt(v33?.["batchSize"], 10) || 1,
    v36 = resolveModelApiExecutionForPayload(v33, v34),
    v37 = Number["parseInt"](v36?.["extensions"]?.["fixedBatchSize"], 10);
  if (Number["isFinite"](v37) && v37 >= 1) return v37;
  const v38 = Number["parseInt"](v36?.["extensions"]?.["maxBatchSize"], 10);
  if (Number["isFinite"](v38) && v38 >= 1) return Math["min"](v35, v38);
  return v35;
}
function isRunningHubOpenApiV2AiApp(v39) {
  const v40 = String(v39?.["model"] || ""),
    v41 = resolveModelExecution(v40)?.["executionManifest"];
  if (
    v41?.["adapterType"] === "workflow" &&
    v41?.["submitMode"] === "openapi-v2-ai-app" &&
    v41?.["queryMode"] === "openapi-v2-query"
  )
    return true;
  return false;
}
function getDreaminaModelVersion(v42) {
  const v43 = String(v42?.["modelVersion"] || "")["trim"]();
  if (v43) return v43;
  const v44 = String(v42?.["model"] || "")["trim"]();
  if (resolveModelProvider(v44, v42?.["provider"]) !== "dreamina") return "";
  const v45 = (v44["split"]("/")[1] || "")["trim"]();
  return /^(4\.0|4\.1|4\.5|5\.0)$/["test"](v45) ? v45 : "";
}
function getDreaminaAspectRatio(v46, v47) {
  const v48 = String(v46?.["resolvedRatioLabel"] || "")["trim"]();
  if (v48) return v48;
  const v49 = String(v46?.["aspectRatio"] || "")["trim"]();
  if (!v49) return "";
  if (v49 === "自适应" || v49 === "auto") return v47 ? "" : "1:1";
  return v49;
}
function buildDreaminaImageSubmitRequest(v50, v51) {
  const v52 = Array["isArray"](v50["inputUrls"])
      ? v50["inputUrls"]["filter"](Boolean)
      : [],
    v53 = v52["length"] > 0,
    v54 = getDreaminaModelVersion(v50),
    v55 = getDreaminaAspectRatio(v50, v53),
    v56 = String(v50["imageSize"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v57 = { prompt: v51 };
  if (v55) v57["ratio"] = v55;
  if (v56) v57["resolutionType"] = v56;
  if (v54) v57["modelVersion"] = v54;
  if (v52["length"] > 0)
    return {
      url: "/api/v2/dreamina/image2image",
      headers: { "Content-Type": "application/json" },
      body: { ...v57, images: v52 },
    };
  return {
    url: "/api/v2/dreamina/text2image",
    headers: { "Content-Type": "application/json" },
    body: v57,
  };
}
function getImageExecution(v58, v59) {
  return resolveModelExecution(v58?.["model"], { providerHint: v59 });
}
function createMissingImageManifestError(v60, v61) {
  const v62 = String(v60?.["model"] || "")["trim"]() || "(empty)",
    v63 = String(v61 || "")
      ["trim"]()
      ["toLowerCase"]();
  if (v63 === "runninghubwf")
    return new Error(
      "RunningHub workflow manifest missing: " +
        v62 +
        "; RunningHUB request requires a manifest",
    );
  if (v63 === "runninghub")
    return new Error("RunningHub model API manifest missing: " + v62);
  const v64 = {
      apimart: "APIMart",
      grsai: "GRSAI",
      ppio: "PPIO",
      volcengine: "Volcengine",
    },
    v65 = v64[v63];
  if (v65)
    return new Error(
      v65 + "\x20image\x20model\x20API\x20manifest\x20missing:\x20" + v62,
    );
  return new Error("Image model API manifest missing: " + v62);
}
function collectDeepMediaUrls(v66, v67 = 0, v68 = new WeakSet()) {
  if (v66 === undefined || v66 === null || v67 > 8) return [];
  if (typeof v66 === "string") {
    const v69 = v66["trim"]();
    return /^https?:\/\//i["test"](v69) ? [v69] : [];
  }
  if (Array["isArray"](v66))
    return v66["flatMap"]((v70) => collectDeepMediaUrls(v70, v67 + 1, v68));
  if (typeof v66 !== "object") return [];
  if (v68["has"](v66)) return [];
  v68["add"](v66);
  const v71 = [
      "url",
      "imageUrl",
      "image_url",
      "fileUrl",
      "file_url",
      "downloadUrl",
      "download_url",
    ],
    v72 = [];
  for (const v73 of v71) {
    v72["push"](...collectDeepMediaUrls(v66[v73], v67 + 1, v68));
  }
  const v74 = [
    "results",
    "result",
    "images",
    "image",
    "outputs",
    "output",
    "data",
  ];
  for (const v75 of v74) {
    v72["push"](...collectDeepMediaUrls(v66[v75], v67 + 1, v68));
  }
  return Array["from"](new Set(v72["filter"](Boolean)));
}
function extractImageUrls(v76, v77 = null) {
  const v78 = resolveMappedResponseValues(v76, v77?.["resultPaths"]);
  if (v78["length"] > 0) return v78;
  const v79 = [];
  if (
    v76["data"]?.["result"]?.["images"] &&
    Array["isArray"](v76["data"]["result"]["images"])
  )
    v79["push"](
      ...v76["data"]["result"]["images"]["map"]((v80) =>
        Array["isArray"](v80["url"]) ? v80["url"][0] : v80["url"],
      ),
    );
  else {
    if (v76["result"]?.["images"] && Array["isArray"](v76["result"]["images"]))
      v79["push"](
        ...v76["result"]["images"]["map"]((v81) =>
          Array["isArray"](v81["url"]) ? v81["url"][0] : v81["url"],
        ),
      );
    else {
      if (v76["status"] === "succeeded" && v76["results"])
        v79["push"](...v76["results"]["map"]((v82) => v82["url"]));
      else {
        if (v76["data"]?.[0]?.["url"])
          v79["push"](...v76["data"]["map"]((v83) => v83["url"]));
        else {
          if (v76["data"]?.[0]?.["fileUrl"])
            v79["push"](...v76["data"]["map"]((v84) => v84["fileUrl"]));
          else {
            if (v76["data"]?.["results"])
              v79["push"](
                ...v76["data"]["results"]["map"]((v85) => v85["url"]),
              );
            else {
              if (v76["data"]?.[0]?.["image"])
                v79["push"](...v76["data"]["map"]((v86) => v86["image"]));
              else {
                if (Array["isArray"](v76["images"]))
                  v79["push"](
                    ...v76["images"]["map"]((v87) =>
                      typeof v87 === "string"
                        ? v87
                        : v87["url"] || v87["image_url"],
                    ),
                  );
                else {
                  if (Array["isArray"](v76["image_urls"]))
                    v79["push"](
                      ...v76["image_urls"]["map"]((v88) =>
                        typeof v88 === "string" ? v88 : v88["url"],
                      ),
                    );
                  else {
                    if (Array["isArray"](v76["results"]))
                      v79["push"](
                        ...v76["results"]["map"](
                          (v89) =>
                            v89["url"] ||
                            v89["imageUrl"] ||
                            v89["image_url"] ||
                            v89["image"],
                        ),
                      );
                    else
                      (v76["url"] ||
                        v76["image_url"] ||
                        v76["fileUrl"] ||
                        v76["file_url"] ||
                        v76["image"]) &&
                        v79["push"](
                          v76["url"] ||
                            v76["image_url"] ||
                            v76["fileUrl"] ||
                            v76["file_url"] ||
                            v76["image"],
                        );
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return (
    v79["length"] === 0 && v79["push"](...collectDeepMediaUrls(v76)),
    Array["from"](new Set(v79["filter"](Boolean)))
  );
}
export async function buildGenerateImageRequest(v90) {
  await ensureConfig();
  const v91 = applyCameraAngleToPrompt(v90["prompt"], v90["cameraAngle"]),
    v92 = getProviderId(v90 || {}),
    v93 = getImageExecution(v90, v92),
    v94 = v93?.["executionManifest"],
    v95 = v93?.["modelManifest"];
  if (
    v94?.["adapterType"] === "localRuntime" &&
    v94?.["runtime"] === "dreaminaImage"
  )
    return buildDreaminaImageSubmitRequest(v90, v91);
  const v96 = {
    getProviderConfig: getProviderConfig,
    processInputImages: processInputImages,
    processInputImagesPreserveOrder: processInputImagesPreserveOrder,
    uploadInputsToVolcengineFiles: uploadInputsToVolcengineFiles,
  };
  if (v94?.["adapterType"] === "modelApi") {
    const v97 = await buildImageRequestFromManifest(v90, v91, v96, {
      expectedProvider: v95?.["provider"] || v92,
    });
    if (v97) return v97;
    throw new Error(
      (v95?.["provider"] || v92) +
        " image model API manifest missing: " +
        v90["model"],
    );
  }
  if (v94?.["adapterType"] === "workflow")
    return RunningHubAdapter["buildImageRequest"](v90, v91, v96);
  throw createMissingImageManifestError(v90, v92);
}
function parseResponseData(v98) {
  const v99 = v98["trim"]()["replace"](/^data:\s*/, "");
  try {
    return JSON["parse"](v99);
  } catch {
    const v100 = extractSseJsonSnapshots(v98);
    if (v100["length"] > 0) {
      for (const v101 of v100) {
        if (resolveAsyncImageTaskId(v101)) return v101;
      }
      return v100[v100["length"] - 1];
    }
    throw new ApiError({
      type: "PARSE_ERROR",
      message: "无法解析服务端响应",
      retryable: false,
    });
  }
}
function extractSseJsonSnapshots(v102) {
  const v103 = String(v102 || "")
    ["split"]("\x0a")
    ["filter"]((v104) => v104["trim"]()["startsWith"]("data:"));
  if (v103["length"] === 0) return [];
  const v105 = [];
  for (const v106 of v103) {
    const v107 = String(v106 || "")
      ["trim"]()
      ["replace"](/^data:\s*/, "")
      ["trim"]();
    if (!v107 || v107 === "[DONE]") continue;
    try {
      v105["push"](JSON["parse"](v107));
    } catch {}
  }
  return v105;
}
function resolveDirectOutputSnapshotFromRawText(v108) {
  const v109 = extractSseJsonSnapshots(v108);
  for (let v110 = v109["length"] - 1; v110 >= 0; v110 -= 1) {
    const v111 = v109[v110];
    if (extractImageUrls(v111)["length"] > 0) return v111;
  }
  return null;
}
function extractTaskIdFromRawText(v112) {
  const v113 = String(v112 || "");
  if (!v113) return "";
  const v114 = [
    /"task_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskid"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"submit_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"submitId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"job_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"jobId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"request_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"requestId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"task"\s*:\s*"?([a-zA-Z0-9._:-]{8,})"?/i,
    /"job"\s*:\s*"?([a-zA-Z0-9._:-]{8,})"?/i,
    /"request"\s*:\s*"?([a-zA-Z0-9._:-]{8,})"?/i,
    /"submit"\s*:\s*"?([a-zA-Z0-9._:-]{8,})"?/i,
    /"id"\s*:\s*"([^"]+)"/i,
    /\btask[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /\bsubmit[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /\bjob[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /\brequest[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /(?:\?|&)(?:task_id|taskId|taskid|job_id|request_id)=([a-zA-Z0-9._:-]+)/i,
    /\bid\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]{8,})["']?/i,
  ];
  for (const v115 of v114) {
    const v116 = v113["match"](v115),
      v117 = String(v116?.[1] || "")["trim"]();
    if (v117) return v117;
  }
  return "";
}
function extractRunningHubTaskIdFromRawText(v118) {
  const v119 = String(v118 || "");
  if (!v119) return "";
  const v120 = [
    /"task_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskid"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /\btask[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /(?:\?|&)(?:task_id|taskId|taskid)=([a-zA-Z0-9._:-]+)/i,
  ];
  for (const v121 of v120) {
    const v122 = v119["match"](v121),
      v123 = String(v122?.[1] || "")
        ["replace"](/,/g, "")
        ["trim"]();
    if (v123) return v123;
  }
  return "";
}
function extractTaskIdFromResponseHeaders(v124) {
  if (!v124 || typeof v124["get"] !== "function") return "";
  const v125 = [
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
  for (const v126 of v125) {
    const v127 = String(v124["get"](v126) || "")["trim"]();
    if (v127) return v127;
  }
  if (typeof v124["forEach"] === "function") {
    let v128 = "";
    v124["forEach"]((v129, v130) => {
      if (v128) return;
      const v131 = String(v130 || "")
          ["trim"]()
          ["toLowerCase"](),
        v132 = String(v129 || "")["trim"]();
      if (!v132) return;
      ((v131["includes"]("task") && v131["includes"]("id")) ||
        (v131["includes"]("job") && v131["includes"]("id")) ||
        (v131["includes"]("request") && v131["includes"]("id")) ||
        (v131["includes"]("submit") && v131["includes"]("id"))) &&
        (v128 = v132);
    });
    if (v128) return v128;
  }
  return "";
}
function normalizeTaskIdValue(v133) {
  return String(v133 ?? "")
    ["replace"](/,/g, "")
    ["trim"]();
}
function resolveRunningHubTaskId(v134, v135, v136) {
  const v137 = extractRunningHubTaskIdFromRawText(v135);
  if (v137) return v137;
  const v138 = Array["isArray"](v134?.["data"])
      ? v134["data"][0]
      : v134?.["data"] && typeof v134["data"] === "object"
        ? v134["data"]
        : null,
    v139 = Array["isArray"](v134?.["results"])
      ? v134["results"][0]
      : v134?.["results"] && typeof v134["results"] === "object"
        ? v134["results"]
        : null,
    v140 =
      v134?.["result"] && typeof v134["result"] === "object"
        ? v134["result"]
        : null,
    v141 =
      v134?.["output"] && typeof v134["output"] === "object"
        ? v134["output"]
        : null,
    v142 =
      v134?.["response"] && typeof v134["response"] === "object"
        ? v134["response"]
        : null,
    v143 = [
      v134?.["taskId"],
      v134?.["task_id"],
      v134?.["data"]?.["taskId"],
      v134?.["data"]?.["task_id"],
      v138?.["taskId"],
      v138?.["task_id"],
      v140?.["taskId"],
      v140?.["task_id"],
      v141?.["taskId"],
      v141?.["task_id"],
      v142?.["taskId"],
      v142?.["task_id"],
      v139?.["taskId"],
      v139?.["task_id"],
    ];
  for (const v144 of v143) {
    const v145 = normalizeTaskIdValue(v144);
    if (v145) return v145;
  }
  return normalizeTaskIdValue(extractTaskIdFromResponseHeaders(v136));
}
function looksLikeTaskToken(v146) {
  const v147 = String(v146 ?? "")["trim"]();
  if (!v147) return false;
  if (v147["length"] < 8) return false;
  const v148 = v147["toLowerCase"]();
  if (
    v148 === "pending" ||
    v148 === "running" ||
    v148 === "success" ||
    v148 === "failed" ||
    v148 === "queued" ||
    v148 === "submitted"
  )
    return false;
  return /^[a-zA-Z0-9._:-]+$/["test"](v147);
}
function resolveAsyncImageTaskIdLoose(v149) {
  if (!v149 || typeof v149 !== "object") return "";
  const v150 = [
    v149?.["data"],
    v149?.["task"],
    v149?.["job"],
    v149?.["request"],
    v149?.["submit"],
    v149?.["payload"]?.["task"],
    v149?.["payload"]?.["task_id"],
    v149?.["payload"]?.["taskId"],
  ];
  for (const v151 of v150) {
    if (typeof v151 === "string" || typeof v151 === "number") {
      const v152 = String(v151)["trim"]();
      if (looksLikeTaskToken(v152)) return v152;
    }
  }
  const v153 = findFirstDeepValueByKeyPattern(
    v149,
    /^(task|job|request|submit|task_?id|job_?id|request_?id|submit_?id)$/i,
  );
  if (looksLikeTaskToken(v153)) return v153;
  return "";
}
function findFirstDeepValueByKeyPattern(v154, v155, v156 = 8) {
  if (!v154 || typeof v154 !== "object") return "";
  const v157 = new WeakSet(),
    v158 = [{ value: v154, depth: 0 }];
  while (v158["length"] > 0) {
    const { value: v159, depth: v160 } = v158["shift"]();
    if (!v159 || typeof v159 !== "object") continue;
    if (v157["has"](v159)) continue;
    v157["add"](v159);
    if (v160 > v156) continue;
    const v161 = Array["isArray"](v159)
      ? v159["map"]((v162, v163) => [String(v163), v162])
      : Object["entries"](v159);
    for (const [v164, v165] of v161) {
      const v166 = String(v164 || "")
        ["trim"]()
        ["toLowerCase"]();
      if (v155["test"](v166)) {
        const v167 = String(v165 ?? "")["trim"]();
        if (v167) return v167;
      }
      v165 &&
        typeof v165 === "object" &&
        v158["push"]({ value: v165, depth: v160 + 1 });
    }
  }
  return "";
}
function extractTaskStatusFromRawText(v168) {
  const v169 = String(v168 || "");
  if (!v169) return "";
  const v170 = [
    /"status"\s*:\s*"([^"]+)"/i,
    /"taskStatus"\s*:\s*"([^"]+)"/i,
    /"task_status"\s*:\s*"([^"]+)"/i,
    /"phase"\s*:\s*"([^"]+)"/i,
    /"state"\s*:\s*"([^"]+)"/i,
    /\bstatus\b\s*[:=]\s*["']?([a-zA-Z_]+)["']?/i,
    /\bphase\b\s*[:=]\s*["']?([a-zA-Z_]+)["']?/i,
    /\bstate\b\s*[:=]\s*["']?([a-zA-Z_]+)["']?/i,
  ];
  for (const v171 of v170) {
    const v172 = v169["match"](v171),
      v173 = String(v172?.[1] || "")["trim"]();
    if (v173) return v173["toLowerCase"]();
  }
  return "";
}
function resolveAsyncImageTaskId(v174, v175 = null) {
  const v176 = resolveMappedResponseValue(v174, v175?.["taskIdPath"]);
  if (v176) return v176;
  const v177 = Array["isArray"](v174?.["data"])
      ? v174["data"][0]
      : v174?.["data"] && typeof v174["data"] === "object"
        ? v174["data"]
        : null,
    v178 = Array["isArray"](v174?.["results"])
      ? v174["results"][0]
      : v174?.["results"] && typeof v174["results"] === "object"
        ? v174["results"]
        : null,
    v179 =
      v174?.["result"] && typeof v174["result"] === "object"
        ? v174["result"]
        : null,
    v180 =
      v174?.["output"] && typeof v174["output"] === "object"
        ? v174["output"]
        : null,
    v181 =
      v174?.["response"] && typeof v174["response"] === "object"
        ? v174["response"]
        : null,
    v182 =
      v177?.["task_id"] ||
      v177?.["taskId"] ||
      v177?.["id"] ||
      v179?.["task_id"] ||
      v179?.["taskId"] ||
      v179?.["id"] ||
      v180?.["task_id"] ||
      v180?.["taskId"] ||
      v180?.["id"] ||
      v181?.["task_id"] ||
      v181?.["taskId"] ||
      v181?.["id"] ||
      v174?.["task_id"] ||
      v174?.["taskId"] ||
      v174?.["data"]?.["task_id"] ||
      v174?.["data"]?.["taskId"] ||
      v174?.["data"]?.["id"] ||
      v174?.["id"] ||
      v178?.["task_id"] ||
      v178?.["taskId"] ||
      v178?.["id"] ||
      findFirstDeepValueByKeyPattern(
        v174,
        /^(task_?id|taskid|request_?id|requestid)$/i,
      ) ||
      findFirstDeepValueByKeyPattern(v174, /^id$/i) ||
      "";
  return String(v182 || "")["trim"]();
}
function resolveApimartTaskIdStrict(v183) {
  const v184 = Array["isArray"](v183?.["data"])
      ? v183["data"][0]
      : v183?.["data"] && typeof v183["data"] === "object"
        ? v183["data"]
        : null,
    v185 = Array["isArray"](v183?.["results"])
      ? v183["results"][0]
      : v183?.["results"] && typeof v183["results"] === "object"
        ? v183["results"]
        : null,
    v186 =
      v183?.["result"] && typeof v183["result"] === "object"
        ? v183["result"]
        : null,
    v187 =
      v183?.["output"] && typeof v183["output"] === "object"
        ? v183["output"]
        : null,
    v188 =
      v183?.["response"] && typeof v183["response"] === "object"
        ? v183["response"]
        : null,
    v189 =
      v184?.["task_id"] ||
      v184?.["taskId"] ||
      v186?.["task_id"] ||
      v186?.["taskId"] ||
      v187?.["task_id"] ||
      v187?.["taskId"] ||
      v188?.["task_id"] ||
      v188?.["taskId"] ||
      v183?.["task_id"] ||
      v183?.["taskId"] ||
      v183?.["data"]?.["task_id"] ||
      v183?.["data"]?.["taskId"] ||
      v185?.["task_id"] ||
      v185?.["taskId"] ||
      findFirstDeepValueByKeyPattern(v183, /^(task_?id|taskid)$/i) ||
      "";
  return String(v189 || "")["trim"]();
}
function collectApimartFallbackTaskIdCandidates(v190) {
  const v191 = [],
    v192 = (v193) => {
      const v194 = String(v193 || "")["trim"]();
      if (!v194 || v191["includes"](v194)) return;
      v191["push"](v194);
    },
    v195 = Array["isArray"](v190?.["data"])
      ? v190["data"][0]
      : v190?.["data"] && typeof v190["data"] === "object"
        ? v190["data"]
        : null,
    v196 = Array["isArray"](v190?.["results"])
      ? v190["results"][0]
      : v190?.["results"] && typeof v190["results"] === "object"
        ? v190["results"]
        : null,
    v197 =
      v190?.["result"] && typeof v190["result"] === "object"
        ? v190["result"]
        : null,
    v198 =
      v190?.["output"] && typeof v190["output"] === "object"
        ? v190["output"]
        : null,
    v199 =
      v190?.["response"] && typeof v190["response"] === "object"
        ? v190["response"]
        : null;
  return (
    v192(v195?.["id"]),
    v192(v197?.["id"]),
    v192(v198?.["id"]),
    v192(v199?.["id"]),
    v192(v196?.["id"]),
    v192(v190?.["data"]?.["id"]),
    v192(v190?.["id"]),
    v191
  );
}
function extractApimartTaskIdFromRawText(v200) {
  const v201 = String(v200 || "");
  if (!v201) return "";
  const v202 = [
    /"task_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskid"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /\btask[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /(?:\?|&)task_id=([a-zA-Z0-9._:-]+)/i,
  ];
  for (const v203 of v202) {
    const v204 = v201["match"](v203),
      v205 = String(v204?.[1] || "")["trim"]();
    if (v205) return v205;
  }
  return "";
}
function buildApimartTaskStatusUrl(v206, v207 = null) {
  const v208 = String(v206 || "")["trim"](),
    v209 = buildManifestPollCandidate(v208, v207);
  if (v209?.["url"]) return v209["url"];
  return (
    "https://api.apimart.ai/v1/tasks/" +
    encodeURIComponent(v208) +
    "?language=zh"
  );
}
async function probeApimartTaskIdCandidate(v210, v211, v212 = {}) {
  const v213 = String(v210 || "")["trim"]();
  if (!v213) return "";
  const v214 = getProviderConfig("apimart"),
    v215 = String(v211?.["apiKey"] || v214?.["apiKey"] || "")["trim"]();
  if (!v215) return "";
  try {
    const v216 = await requester({
        url:
          "/api/v2/proxy/task?apiUrl=" +
          encodeURIComponent(
            buildApimartTaskStatusUrl(v213, v212?.["taskPolling"]),
          ),
        method: "GET",
        headers: { Authorization: "Bearer " + v215 },
        provider: "apimart",
        timeout: 30000,
        signal: v212?.["signal"],
      }),
      v217 = normalizeTaskSnapshotPayload(v216),
      v218 =
        v217 &&
        typeof v217 === "object" &&
        v217["data"] &&
        typeof v217["data"] === "object" &&
        !Array["isArray"](v217["data"]),
      v219 = v218
        ? { ...v217, ...v217["data"] }
        : normalizeTaskSnapshotPayload(v216?.["data"] || v216),
      v220 = parseTaskError("apimart", v219);
    if (v220) return "";
    return v213;
  } catch {
    return "";
  }
}
async function resolveApimartTaskIdByProbe(v221, v222, v223 = {}) {
  const v224 = collectApimartFallbackTaskIdCandidates(v221);
  for (const v225 of v224) {
    const v226 = await probeApimartTaskIdCandidate(v225, v222, v223);
    if (v226) return v226;
  }
  return "";
}
function resolveAsyncImageTaskStatus(v227) {
  const v228 = Array["isArray"](v227?.["data"])
      ? v227["data"][0]
      : v227?.["data"] && typeof v227["data"] === "object"
        ? v227["data"]
        : null,
    v229 = Array["isArray"](v227?.["results"])
      ? v227["results"][0]
      : v227?.["results"] && typeof v227["results"] === "object"
        ? v227["results"]
        : null,
    v230 =
      v227?.["result"] && typeof v227["result"] === "object"
        ? v227["result"]
        : null,
    v231 =
      v227?.["output"] && typeof v227["output"] === "object"
        ? v227["output"]
        : null,
    v232 =
      v227?.["response"] && typeof v227["response"] === "object"
        ? v227["response"]
        : null;
  return String(
    v228?.["status"] ||
      v227?.["status"] ||
      v227?.["taskStatus"] ||
      v227?.["task_status"] ||
      v227?.["data"]?.["status"] ||
      v230?.["status"] ||
      v230?.["taskStatus"] ||
      v230?.["task_status"] ||
      v231?.["status"] ||
      v231?.["taskStatus"] ||
      v231?.["task_status"] ||
      v232?.["status"] ||
      v232?.["taskStatus"] ||
      v232?.["task_status"] ||
      v229?.["status"] ||
      v227?.["state"] ||
      v227?.["phase"] ||
      findFirstDeepValueByKeyPattern(
        v227,
        /^(task_?status|taskstatus|status|state|phase)$/i,
      ) ||
      "",
  )
    ["trim"]()
    ["toLowerCase"]();
}
function normalizeTaskSnapshotPayload(v233) {
  if (v233 && typeof v233 === "object") return v233;
  const v234 = String(v233 || "")["trim"]();
  if (!v234) return {};
  try {
    return parseResponseData(v234);
  } catch {
    try {
      return JSON["parse"](v234);
    } catch {
      return { rawText: v234 };
    }
  }
}
function isAsyncTaskTerminalStatus(v235) {
  const v236 = String(v235 || "")
    ["trim"]()
    ["toLowerCase"]();
  return [
    "success",
    "succeeded",
    "completed",
    "complete",
    "finished",
    "finish",
    "done",
    "failed",
    "fail",
    "error",
    "cancelled",
    "canceled",
    "idle",
  ]["includes"](v236);
}
function isAsyncTaskPendingStatus(v237) {
  const v238 = String(v237 || "")
    ["trim"]()
    ["toLowerCase"]();
  return [
    "submitted",
    "pending",
    "queued",
    "waiting",
    "running",
    "processing",
    "querying",
    "in_progress",
  ]["includes"](v238);
}
function isAsyncTaskFailureStatus(v239) {
  const v240 = String(v239 || "")
    ["trim"]()
    ["toLowerCase"]();
  return ["failed", "fail", "error", "cancelled", "canceled", "idle"][
    "includes"
  ](v240);
}
function supportsAsyncImageTaskPolling(v241, v242 = {}) {
  const v243 = String(v241 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (["apimart", "ppio", "grsai"]["includes"](v243)) return true;
  const v244 = v242?.["taskPolling"];
  return !!(
    v244 &&
    typeof v244 === "object" &&
    String(v244["urlTemplate"] || "")["trim"]()
  );
}
function buildManifestPollCandidate(v245, v246) {
  if (!v246 || typeof v246 !== "object") return null;
  const v247 = String(v246["urlTemplate"] || "")["trim"]();
  if (!v247) return null;
  return {
    method:
      String(v246["method"] || "GET")
        ["trim"]()
        ["toUpperCase"]() || "GET",
    mode: String(v246["mode"] || "task-proxy")["trim"]() || "task-proxy",
    url: v247["replace"]("{taskId}", encodeURIComponent(v245)),
  };
}
async function pollAsyncImageTask(v248, v249, v250, v251 = {}) {
  const v252 = String(v248 || "")["trim"]();
  if (!v252) throw new Error("缺少异步图片任务\x20ID");
  const v253 = String(v250 || "")
      ["trim"]()
      ["toLowerCase"](),
    v254 = getProviderConfig(v253),
    v255 = String(v249?.["apiKey"] || v254?.["apiKey"] || "")["trim"]();
  if (!v255)
    throw ApiError["authError"](
      v253,
      null,
      "API Key 未配置（厂商：" + v253 + "），无法轮询任务",
    );
  for (let v256 = 0; v256 < 450; v256++) {
    if (v251?.["signal"]?.["aborted"]) throw new Error("CANCELLED");
    await new Promise((v257) => setTimeout(v257, 2000));
    if (v251?.["signal"]?.["aborted"]) throw new Error("CANCELLED");
    const v258 = String(v254?.["apiUrl"] || "")["replace"](/\/+$/, ""),
      v259 = buildManifestPollCandidate(v252, v251?.["taskPolling"]),
      v260 =
        v253 === "apimart"
          ? [
              {
                method: "GET",
                mode: "task-proxy",
                url: buildApimartTaskStatusUrl(v252),
              },
            ]
          : v253 === "ppio"
            ? [
                {
                  method: "GET",
                  mode: "task-proxy",
                  url: v258 + "/v1/tasks/" + v252,
                },
              ]
            : [],
      v261 = v259 ? [v259] : v260;
    if (v261["length"] === 0)
      throw new Error("异步图片任务查询配置缺失（厂商：" + v253 + "）");
    try {
      let v262 = null,
        v263 = null;
      for (const v264 of v261) {
        try {
          v264["mode"] === "image-proxy"
            ? (v262 = await requester({
                url: "/api/v2/proxy/image",
                method: "POST",
                provider: v253,
                timeout: 30000,
                signal: v251?.["signal"],
                headers: { "Content-Type": "application/json" },
                body: JSON["stringify"]({
                  apiUrl: v264["url"],
                  apiKey: v255,
                  ...(v264["body"] || {}),
                }),
              }))
            : (v262 = await requester({
                url:
                  "/api/v2/proxy/task?apiUrl=" +
                  encodeURIComponent(v264["url"]),
                method: "GET",
                headers: { Authorization: "Bearer " + v255 },
                provider: v253,
                timeout: 30000,
                signal: v251?.["signal"],
              }));
          v263 = null;
          break;
        } catch (v265) {
          v263 = v265;
          if (v265 instanceof ApiError) {
            if (
              v265["type"] === ErrorType["AUTH_ERROR"] ||
              v265["type"] === ErrorType["FORBIDDEN"] ||
              v265["type"] === ErrorType["INSUFFICIENT_BALANCE"] ||
              v265["type"] === ErrorType["MODEL_UNAVAILABLE"]
            )
              throw v265;
            if (v265["type"] === ErrorType["INVALID_PARAMS"]) throw v265;
          }
        }
      }
      if (!v262) {
        if (v263 instanceof ApiError) throw v263;
        continue;
      }
      const v266 = normalizeTaskSnapshotPayload(v262),
        v267 =
          v266 &&
          typeof v266 === "object" &&
          v266["data"] &&
          typeof v266["data"] === "object" &&
          !Array["isArray"](v266["data"]),
        v268 = v267
          ? { ...v266, ...v266["data"] }
          : normalizeTaskSnapshotPayload(v262["data"] || v262),
        v269 = parseTaskError(v253, v268);
      if (v269) throw v269;
      const v270 = resolveAsyncImageTaskStatus(v268);
      if (["completed", "succeeded", "success"]["includes"](v270)) return v268;
      if (extractImageUrls(v268, v251?.["responseMapping"])["length"] > 0)
        return v268;
      if (isAsyncTaskPendingStatus(v270)) continue;
      if (isAsyncTaskTerminalStatus(v270)) {
        const v271 = String(v268?.["rawText"] || "");
        throw ApiError["taskFailed"](
          v253,
          String(
            v268?.["error"] ||
              v268?.["errorMessage"] ||
              v268?.["message"] ||
              extractTaskStatusFromRawText(v271) ||
              "任务状态异常",
          ),
        );
      }
    } catch (v272) {
      if (v272 instanceof ApiError) {
        if (
          v272["type"] === ErrorType["TASK_FAILED"] ||
          v272["type"] === ErrorType["CONTENT_FILTERED"] ||
          v272["type"] === ErrorType["TASK_TIMEOUT"] ||
          v272["type"] === ErrorType["AUTH_ERROR"] ||
          v272["type"] === ErrorType["FORBIDDEN"] ||
          v272["type"] === ErrorType["INVALID_PARAMS"] ||
          v272["type"] === ErrorType["INSUFFICIENT_BALANCE"]
        )
          throw v272;
      }
    }
  }
  throw ApiError["taskTimeout"](v253);
}
async function pollRunningHubTask(v273, v274, v275, v276) {
  const v277 = isModelApiModel(v274["model"], "runninghub"),
    v278 =
      v276?.["useOpenapiQuery"] === true ||
      v277 ||
      isRunningHubOpenApiV2AiApp(v274),
    v279 =
      v276?.["pollIntervalMs"] === undefined
        ? 2000
        : Math["max"](0, Number(v276["pollIntervalMs"]) || 0),
    v280 = Math["max"](1, Number(v276?.["maxPolls"]) || 450),
    v281 = v276?.["softTimeout"] === true,
    v282 = getProviderConfig(v277 ? "runninghub" : "runninghubwf"),
    v283 = v277
      ? v282["modelApiKey"] || v274["apiKey"]
      : v282["apiKey"] || v274["apiKey"];
  for (let v284 = 0; v284 < v280; v284++) {
    if (v276?.["signal"]?.["aborted"]) throw new Error("CANCELLED");
    v279 > 0 && (await new Promise((v285) => setTimeout(v285, v279)));
    if (v276?.["signal"]?.["aborted"]) throw new Error("CANCELLED");
    try {
      const v286 = await requester({
          url: v278 ? "/api/v2/proxy/image" : "/api/v2/runninghubwf/query",
          method: "POST",
          provider: v275,
          timeout: 30000,
          headers: { "Content-Type": "application/json" },
          body: JSON["stringify"](
            v278
              ? {
                  apiUrl: "https://www.runninghub.cn/openapi/v2/query",
                  apiKey: v283,
                  taskId: v273,
                }
              : { apiKey: v283, taskId: v273 },
          ),
        }),
        v287 = typeof v286?.["code"] === "number" ? v286["code"] : null;
      if (v287 === 804 || v287 === 813) continue;
      if (v287 !== null && v287 !== 0) throw parseError(v275, v286, 200);
      if (
        v278 &&
        extractImageUrls(v286, v276?.["responseMapping"])["length"] > 0
      )
        return v286;
      if (v287 === 0 && Array["isArray"](v286["data"])) {
        const v288 = v286["data"]["filter"](
          (v289) => v289 && typeof v289 === "object",
        );
        if (v288["length"] === 0) continue;
        for (const v290 of v288) {
          const v291 = parseTaskError(v275, v290);
          if (v291) throw v291;
        }
        const v292 = v288["some"](
          (v293) =>
            extractImageUrls(v293, v276?.["responseMapping"])["length"] > 0,
        );
        if (v292) return v286;
        const v294 = v288["map"]((v295) =>
            String(
              v295?.["status"] ||
                v295?.["taskStatus"] ||
                v295?.["task_status"] ||
                "",
            )
              ["trim"]()
              ["toUpperCase"](),
          )["filter"](Boolean),
          v296 = v288["find"]((v297) =>
            ["FAILED", "FAIL", "ERROR", "CANCELLED", "CANCELED"]["includes"](
              String(
                v297?.["status"] ||
                  v297?.["taskStatus"] ||
                  v297?.["task_status"] ||
                  "",
              )
                ["trim"]()
                ["toUpperCase"](),
            ),
          );
        if (v296)
          throw ApiError["taskFailed"](
            v275,
            String(
              v296?.["errorMessage"] ||
                v296?.["error"] ||
                v296?.["message"] ||
                "任务执行失败",
            ),
          );
        if (
          v294["some"]((v298) =>
            ["COMPLETED", "SUCCEEDED", "SUCCESS"]["includes"](v298),
          )
        )
          continue;
        if (
          v294["some"]((v299) =>
            ["RUNNING", "PENDING", "QUEUED", "SUBMITTED", "PROCESSING"][
              "includes"
            ](v299),
          )
        )
          continue;
      }
      const v300 =
          v286["data"] && Object["keys"](v286["data"])["length"] > 0
            ? v286["data"]
            : v286,
        v301 = parseTaskError(v275, v300);
      if (v301) throw v301;
      const v302 = (v300["status"] || "")["toUpperCase"]();
      if (
        ["FAILED", "FAIL", "ERROR", "CANCELLED", "CANCELED"]["includes"](v302)
      )
        throw ApiError["taskFailed"](
          v275,
          String(
            v300?.["errorMessage"] ||
              v300?.["error"] ||
              v300?.["message"] ||
              "任务执行失败",
          ),
        );
      if (["COMPLETED", "SUCCEEDED", "SUCCESS"]["includes"](v302)) {
        if (extractImageUrls(v300, v276?.["responseMapping"])["length"] === 0)
          continue;
        return v300;
      }
      if (
        ["RUNNING", "PENDING", "QUEUED", "SUBMITTED", "PROCESSING"]["includes"](
          v302,
        )
      )
        continue;
    } catch (v303) {
      if (v303 instanceof ApiError) {
        if (v303["type"] === ErrorType["TIMEOUT"]) continue;
        if (
          v303["type"] === ErrorType["TASK_FAILED"] ||
          v303["type"] === ErrorType["TASK_TIMEOUT"] ||
          v303["type"] === ErrorType["AUTH_ERROR"] ||
          v303["type"] === ErrorType["FORBIDDEN"] ||
          v303["type"] === ErrorType["INVALID_PARAMS"] ||
          v303["type"] === ErrorType["CONTENT_FILTERED"] ||
          v303["type"] === ErrorType["INSUFFICIENT_BALANCE"] ||
          (v303["provider"] === "runninghub" &&
            v303["code"] !== null &&
            v303["code"] !== undefined)
        )
          throw v303;
      }
    }
  }
  if (v281)
    return {
      pending: true,
      taskId: String(v273 || "")["trim"](),
      status: "running",
      message: "任务仍在 RunningHub 生成中",
    };
  throw ApiError["taskTimeout"](v275);
}
async function doGenerateOnce(v304, v305, v306) {
  const v307 = await buildGenerateImageRequest(v304),
    v308 = v307?.["responseMapping"] || null,
    v309 = {
      ...(v306 || {}),
      ...(v308 ? { responseMapping: v308 } : {}),
      ...(v307?.["taskPolling"] ? { taskPolling: v307["taskPolling"] } : {}),
    },
    v310 = v305 === "runninghubwf" || v305 === "runninghub",
    v311 = String(v307?.["body"]?.["apiUrl"] || ""),
    v312 =
      v306?.["useOpenapiQuery"] === true ||
      v307?.["useOpenapiQuery"] === true ||
      (v305 === "runninghubwf" &&
        v307?.["url"] === "/api/v2/proxy/image" &&
        (typeof v307?.["pollUrlBuilder"] === "function" ||
          v311["includes"]("/openapi/v2/run/ai-app/"))) ||
      isModelApiModel(v304?.["model"], v305) ||
      isRunningHubOpenApiV2AiApp(v304),
    v313 = !!v306?.["signal"] && v305 !== "runninghubwf",
    v314 = String(
      v304?.["installId"] ||
        globalThis["window"]?.["__aicInstallId"] ||
        globalThis["__aicInstallId"] ||
        "",
    )["trim"](),
    v315 = {
      ...(v307["headers"] || { "Content-Type": "application/json" }),
      ...(v314 ? { "X-AIC-Install-Id": v314 } : {}),
    },
    v316 = v307["body"];
  let v317,
    v318 = null;
  try {
    const v319 = await requester({
      url: v307["url"],
      method: "POST",
      provider: v305,
      timeout: GENERATION_TIMEOUT,
      retries: GENERATION_RETRIES,
      retryDelay: GENERATION_RETRY_DELAY,
      signal: v313 ? v306?.["signal"] : undefined,
      headers: v315,
      body: JSON["stringify"](v316),
      responseType: "text",
      returnMeta: true,
    });
    ((v317 = String(v319?.["data"] ?? "")), (v318 = v319?.["headers"] || null));
  } catch (v320) {
    if (v320 instanceof ApiError) throw v320;
    throw parseNetworkError(v305, v320, GENERATION_TIMEOUT);
  }
  let v321 = {},
    v322 = null;
  try {
    v321 = parseResponseData(v317);
  } catch (v323) {
    ((v322 = v323), (v321 = {}));
  }
  if (v305 === "runninghubwf") {
    const v324 = typeof v321?.["code"] === "number" ? v321["code"] : null;
    if (v324 !== null && v324 !== 0) throw parseError(v305, v321, 200);
    const v325 = resolveRunningHubTaskId(v321, v317, v318);
    if (v325) {
      (v306?.["onTaskMeta"]?.({ taskId: v325, useOpenapiQuery: v312 }),
        v306?.["onTaskId"]?.(v325));
      const v326 = await pollRunningHubTask(v325, v304, v305, {
        ...v309,
        useOpenapiQuery: v312,
      });
      return processTaskResult(v326, v305, v309);
    }
  }
  let v327 =
      v305 === "apimart"
        ? resolveApimartTaskIdStrict(v321)
        : resolveAsyncImageTaskId(v321, v308),
    v328 = resolveAsyncImageTaskStatus(v321);
  !v327 && v305 !== "apimart" && (v327 = resolveAsyncImageTaskIdLoose(v321));
  !v327 &&
    (v327 =
      v305 === "apimart"
        ? extractApimartTaskIdFromRawText(v317)
        : extractTaskIdFromRawText(v317));
  if (v327 && v305 === "apimart") {
    const v329 = await probeApimartTaskIdCandidate(v327, v304, v309);
    if (!v329) v327 = "";
  }
  !v327 &&
    v305 === "apimart" &&
    (v327 = await resolveApimartTaskIdByProbe(v321, v304, v309));
  !v327 &&
    v305 !== "apimart" &&
    (v327 = extractTaskIdFromResponseHeaders(v318));
  !v328 && (v328 = extractTaskStatusFromRawText(v317));
  const v330 = extractImageUrls(v321, v308)["length"] > 0;
  if (
    v330 &&
    (v305 === "grsai" || v305 === "volcengine") &&
    !isAsyncTaskFailureStatus(v328)
  )
    return processTaskResult(v321, v305, v309);
  if (!v330 && v305 === "grsai") {
    const v331 = resolveDirectOutputSnapshotFromRawText(v317);
    if (v331) return processTaskResult(v331, v305, v309);
  }
  v327 && !supportsAsyncImageTaskPolling(v305, v309) && (v327 = "");
  if (!v310 && v327 && !isAsyncTaskFailureStatus(v328)) {
    (v306?.["onTaskMeta"]?.({ taskId: v327, provider: v305, kind: "image" }),
      v306?.["onTaskId"]?.(v327));
    if (
      v330 &&
      ["success", "succeeded", "completed", "complete", "done"]["includes"](
        String(v328 || "")["toLowerCase"](),
      )
    )
      return processTaskResult(v321, v305, v309);
    const v332 = await pollAsyncImageTask(v327, v304, v305, v309);
    return processTaskResult(v332, v305, v309);
  }
  if (
    !v310 &&
    (v305 === "ppio" || v305 === "grsai") &&
    (!v327 || isAsyncTaskPendingStatus(v328))
  ) {
    const v333 = String(v317 || "")["slice"](0, 400);
    let v334 = {};
    if (v318 && typeof v318["forEach"] === "function") {
      const v335 = {};
      (v318["forEach"]((v336, v337) => {
        const v338 = String(v337 || "")["toLowerCase"]();
        (v338["includes"]("task") ||
          v338["includes"]("job") ||
          v338["includes"]("request") ||
          v338["includes"]("submit")) &&
          (v335[v337] = String(v336 || ""));
      }),
        (v334 = v335));
    }
    console["warn"]("[aiImageApi] async submit missing taskId", {
      providerId: v305,
      asyncTaskStatus: v328,
      previewText: v333,
      headerSnapshot: v334,
      parsedKeys:
        v321 && typeof v321 === "object" && !Array["isArray"](v321)
          ? Object["keys"](v321)["slice"](0, 20)
          : [],
    });
  }
  if (v322 && !v310) throw v322;
  const v339 = String(v321["status"] || v321?.["data"]?.["status"] || "")[
      "toUpperCase"
    ](),
    v340 = resolveRunningHubTaskId(v321, v317, v318);
  if (
    v310 &&
    v340 &&
    (!v339 || ["RUNNING", "PENDING", "QUEUED", "SUBMITTED"]["includes"](v339))
  ) {
    const v341 = v340;
    (v306?.["onTaskMeta"]?.({ taskId: v341, useOpenapiQuery: v312 }),
      v306?.["onTaskId"]?.(v341));
    const v342 = await pollRunningHubTask(v341, v304, v305, {
      ...v309,
      useOpenapiQuery: v312,
    });
    return processTaskResult(v342, v305, v309);
  }
  return processTaskResult(v321, v305, v309);
}
export async function resumeDreaminaImageTask(v343, v344 = {}, v345 = {}) {
  const v346 = getProviderId(v344 || {});
  if (v346 !== "dreamina") throw new Error("仅支持恢复 Dreamina 图片任务");
  const v347 = String(v343 || "")["trim"]();
  if (!v347) throw new Error("缺少\x20Dreamina\x20提交ID，无法恢复");
  const v348 = await pollDreaminaUntilDone(v347, {
      ...v345,
      taskKind: "image",
    }),
    v349 = normalizeDreaminaTaskSnapshot(v348, { submitId: v347 });
  if (v349?.["phase"] === "failed")
    throw new Error(v349["failReason"] || "即梦图片任务恢复失败");
  const v350 = Array["isArray"](v349?.["outputs"]) ? v349["outputs"] : [];
  if (v350["length"] === 0) throw new Error("即梦图片任务恢复失败：无可用输出");
  const v351 = v350["map"]((v352) => {
    const v353 = v352["localUrl"] || v352["url"];
    return {
      sourceId: null,
      thumbId: null,
      sourceUrl: v352["url"] || v353,
      thumbUrl: v353,
      imageUrl: v353,
      localPath: v352["localPath"] || "",
    };
  });
  return v351["length"] === 1 ? v351[0] : { isBatch: true, images: v351 };
}
export async function resumeAsyncImageTask(v354, v355 = {}, v356 = {}) {
  await ensureConfig();
  const v357 = getProviderId(v355 || {});
  if (v357 === "runninghubwf" || v357 === "runninghub" || v357 === "dreamina")
    throw new Error("仅支持恢复 APIMart/PPIO/GRSAI 等异步图片任务");
  const v358 = String(v354 || "")["trim"]();
  if (!v358) throw new Error("缺少异步图片任务ID，无法恢复");
  return runTaskSingleFlight(
    { provider: v357, kind: "image", taskId: v358 },
    async () => {
      const v359 = resolveImageTaskRuntimeOptions(v355 || {}, v357, v356),
        v360 = await pollAsyncImageTask(v358, v355 || {}, v357, v359),
        v361 = await processTaskResult(v360, v357, {
          taskKey: v357 + ":image:" + v358,
          ...(v359?.["responseMapping"]
            ? { responseMapping: v359["responseMapping"] }
            : {}),
        });
      if (v361["length"] === 1 && v361[0]?.["error"])
        throw new Error(v361[0]["error"] || "图片任务恢复失败");
      return v361["length"] === 1 ? v361[0] : { isBatch: true, images: v361 };
    },
  );
}
export async function resumeRunningHubImageTask(v362, v363, v364 = {}) {
  const v365 = getProviderId(v363 || {});
  if (v365 !== "runninghubwf" && v365 !== "runninghub")
    throw new Error("仅支持恢复 RunningHub 图片任务");
  const v366 = String(v362 || "")["trim"]();
  if (!v366) throw new Error("缺少\x20RunningHub\x20任务ID，无法恢复");
  const v367 =
    v364?.["useOpenapiQuery"] === true ||
    isModelApiModel(v363?.["model"], v365) ||
    isRunningHubOpenApiV2AiApp(v363);
  return runTaskSingleFlight(
    { provider: v365, kind: "image", taskId: v366 },
    async () => {
      const v368 = await pollRunningHubTask(v366, v363 || {}, v365, {
        ...v364,
        useOpenapiQuery: v367,
      });
      if (v368?.["pending"]) return v368;
      const v369 = await processTaskResult(v368, v365, {
        taskKey: v365 + ":image:" + v366,
      });
      if (v369["length"] === 1 && v369[0]?.["error"])
        throw new Error(v369[0]["error"] || "图片任务恢复失败");
      return v369["length"] === 1 ? v369[0] : { isBatch: true, images: v369 };
    },
  );
}
async function processTaskResult(v370, v371, v372 = {}) {
  const v373 = extractImageUrls(v370, v372?.["responseMapping"]);
  if (v373["length"] === 0) {
    const v374 = parseError(v371, v370, 200);
    if (v374) return [{ error: v374["getUserMessage"](), fullData: v370 }];
    const v375 = parseTaskError(v371, v370);
    if (v375) return [{ error: v375["getUserMessage"](), fullData: v370 }];
    const v376 =
      v370["error"] ||
      v370["errorMessage"] ||
      v370["message"] ||
      v370["failure_reason"];
    if (v376) return [{ error: v376, fullData: v370 }];
    throw new ApiError({
      type: "PARSE_ERROR",
      provider: v371,
      message: "无法从服务器响应中提取图片地址",
      raw: v370,
      retryable: false,
    });
  }
  return await processImages(v373, v372);
}
async function processImages(v377, v378 = {}) {
  const v379 = [],
    v380 = window["currentProjectId"] || "default_v2_project";
  for (const v381 of v377) {
    try {
      const { saveRemoteImageLocallyDetailed: v382 } =
          await import("../src/modules/project.js"),
        v383 = await v382(v381, v380, {
          taskKey: v378?.["taskKey"],
          dedupeKey: v378?.["taskKey"]
            ? v378["taskKey"] + ":" + v381
            : undefined,
        }),
        v384 = pickResultLocalPath(v383),
        v385 =
          String(v383?.["localUrl"] || "")["trim"]() || localPathToUrl(v384);
      v379["push"]({
        sourceId: null,
        thumbId: null,
        sourceUrl: v381,
        thumbUrl:
          String(v383?.["thumbUrl"] || "")["trim"]() ||
          String(v383?.["displayUrl"] || "")["trim"]() ||
          v385,
        imageUrl: String(v383?.["displayUrl"] || "")["trim"]() || v385,
        localPath: v384,
        originalLocalPath: normalizeLocalPath(
          v383?.["originalLocalPath"] || v383?.["localPath"],
        ),
        displayLocalPath: normalizeLocalPath(v383?.["displayLocalPath"]),
        thumbLocalPath: normalizeLocalPath(v383?.["thumbLocalPath"]),
        originalWidth: Number(v383?.["originalWidth"] || 0) || undefined,
        originalHeight: Number(v383?.["originalHeight"] || 0) || undefined,
      });
    } catch (v386) {
      v379["push"]({
        sourceUrl: v381,
        thumbUrl: "",
        imageUrl: "",
        localPath: "",
        error: "保存到本地失败，请重试生成",
      });
    }
  }
  return v379;
}
export async function generateImage(v387, v388) {
  const v389 = getProviderId(v387),
    v390 = getImageExecution(v387, v389)?.["executionManifest"],
    v391 = resolveImageGenerationBatchSize(v387, v389),
    v392 = shouldSubmitProviderBatchOnce(v387, v389, v391);
  if (
    v390?.["adapterType"] === "localRuntime" &&
    v390?.["runtime"] === "dreaminaImage"
  ) {
    if (v391 <= 1) {
      const v393 = await runDreaminaImageGeneration(v387, v388);
      return v393["length"] === 1 ? v393[0] : { isBatch: true, images: v393 };
    }
    const v394 = [];
    for (let v395 = 0; v395 < v391; v395++) {
      try {
        const v396 = await runDreaminaImageGeneration(v387, v388);
        v394["push"](...v396);
      } catch (v397) {
        v394["push"]({
          error: v397?.["message"] || "即梦图片生成失败",
          status: "failed",
          retryable: false,
        });
      }
    }
    if (v394["length"] === 1) return v394[0];
    return { isBatch: true, images: v394 };
  }
  if (v391 <= 1 || v392)
    try {
      const v398 = await doGenerateOnce(v387, v389, v388),
        v399 = Array["isArray"](v398) ? v398 : [v398];
      if (v399["length"] === 1 && v399[0]["error"])
        throw new Error(v399[0]["error"]);
      return v399["length"] === 1 ? v399[0] : { isBatch: true, images: v399 };
    } catch (v400) {
      if (v400 instanceof ApiError) throw new Error(v400["getUserMessage"]());
      throw v400;
    }
  const v401 = [];
  for (let v402 = 0; v402 < v391; v402++) {
    try {
      const v403 = await doGenerateOnce(v387, v389, v388);
      v401["push"](...v403);
    } catch (v404) {
      v404 instanceof ApiError
        ? v401["push"]({
            error: v404["getUserMessage"](),
            status: "failed",
            retryable: v404["retryable"],
          })
        : v401["push"]({
            error: v404["message"] || "未知错误",
            status: "failed",
            retryable: false,
          });
    }
  }
  if (v401["length"] === 0) throw new Error("批量生成全部失败");
  if (v401["length"] === 1) return v401[0];
  return { isBatch: true, images: v401 };
}
