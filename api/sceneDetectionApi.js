import { requester } from "./requester.js";
import { ensureConfig, getProviderConfig } from "./configApi.js";
import {
  ApiError,
  ErrorType,
  parseError,
  parseTaskError,
  parseNetworkError,
} from "./errors/index.js";
const DETECTION_TIMEOUT = 5 * 60 * 1000;
export async function buildSceneDetectionRequest(v0) {
  await ensureConfig();
  const v1 = v0["provider"] || "grsai",
    v2 = getProviderConfig(v1),
    v3 = v2["apiUrl"]["replace"](/\/+$/, ""),
    v4 = v0["apiKey"] || v2["apiKey"];
  if (!v4)
    throw ApiError["authError"](
      v1,
      null,
      "API\x20Key\x20未配置（厂商：" + v1 + "），无法发起场景检测请求",
    );
  if (v1 === "grsai")
    return {
      url: "/api/v2/proxy/image",
      headers: { "Content-Type": "application/json" },
      body: {
        apiUrl: v3 + "/v1/video/scene-detection",
        apiKey: v4,
        videoUrl: v0["videoUrl"],
        sensitivity: v0["sensitivity"] || 0.5,
      },
    };
  if (v1 === "runninghubwf")
    return {
      url: "/api/v2/runninghubwf/scene-detection",
      headers: { "Content-Type": "application/json" },
      body: {
        apiKey: v4,
        videoUrl: v0["videoUrl"],
        sensitivity: v0["sensitivity"] || 0.5,
      },
    };
  throw new ApiError({
    type: "UNSUPPORTED_PROVIDER",
    provider: v1,
    message: "暂不支持厂商\x20" + v1 + " 的场景检测",
    retryable: false,
  });
}
async function pollSceneDetectionTask(v5, v6, v7) {
  const v8 = getProviderConfig(v6);
  for (let v9 = 0; v9 < 300; v9++) {
    await new Promise((v10) => setTimeout(v10, 2000));
    const v11 =
      v6 === "runninghubwf"
        ? "/api/v2/runninghubwf/query"
        : v8["apiUrl"] + "/v1/tasks/" + v5;
    try {
      const v12 = await requester({
          url: v11,
          method: "POST",
          provider: v6,
          timeout: 30000,
          headers: { "Content-Type": "application/json" },
          body:
            v6 === "runninghubwf"
              ? JSON["stringify"]({ apiKey: v7, taskId: v5 })
              : JSON["stringify"]({ apiUrl: v11, apiKey: v7 }),
        }),
        v13 = v12["data"] || v12,
        v14 = parseError(v6, v13, 200);
      if (v14) throw v14;
      const v15 = (v13["status"] || "")["toUpperCase"]();
      if (["COMPLETED", "SUCCEEDED", "SUCCESS"]["includes"](v15)) return v13;
    } catch (v16) {
      if (v16 instanceof ApiError) {
        if (
          v16["type"] === ErrorType["TASK_FAILED"] ||
          v16["type"] === ErrorType["TASK_TIMEOUT"] ||
          v16["type"] === ErrorType["AUTH_ERROR"] ||
          v16["type"] === ErrorType["FORBIDDEN"] ||
          v16["type"] === ErrorType["INVALID_PARAMS"] ||
          v16["type"] === ErrorType["INSUFFICIENT_BALANCE"]
        )
          throw v16;
      }
    }
  }
  throw ApiError["taskTimeout"](v6);
}
function extractSceneChanges(v17) {
  if (v17["result"]?.["sceneChanges"]) return v17["result"]["sceneChanges"];
  else {
    if (v17["data"]?.["sceneChanges"]) return v17["data"]["sceneChanges"];
    else {
      if (v17["sceneChanges"]) return v17["sceneChanges"];
    }
  }
  return [];
}
function processSceneDetectionResult(v18, v19) {
  const v20 = extractSceneChanges(v18);
  if (!Array["isArray"](v20)) {
    const v21 = parseError(v19, v18, 200);
    if (v21) throw v21;
    const v22 = parseTaskError(v19, v18);
    if (v22)
      throw new ApiError({
        type: "TASK_FAILED",
        provider: v19,
        message: v22["getUserMessage"](),
        retryable: false,
      });
    const v23 =
      v18["error"] ||
      v18["errorMessage"] ||
      v18["message"] ||
      v18["failure_reason"];
    if (v23)
      throw new ApiError({
        type: "TASK_FAILED",
        provider: v19,
        message: v23,
        retryable: false,
      });
    throw new ApiError({
      type: "PARSE_ERROR",
      provider: v19,
      message: "无法从服务器响应中提取场景检测结果",
      raw: v18,
      retryable: false,
    });
  }
  return { sceneChanges: v20, sceneCount: v20["length"] + 1 };
}
export async function detectScenes(v24, v25) {
  const v26 = v24["provider"] || "grsai",
    v27 = await buildSceneDetectionRequest(v24);
  let v28;
  try {
    v28 = await requester({
      url: v27["url"],
      method: "POST",
      provider: v26,
      timeout: DETECTION_TIMEOUT,
      headers: v27["headers"],
      body: JSON["stringify"](v27["body"]),
    });
  } catch (v29) {
    if (v29 instanceof ApiError) throw v29;
    throw parseNetworkError(v26, v29, DETECTION_TIMEOUT);
  }
  let v30 = v28,
    v31 = null;
  if (v30["task_id"] || v30["taskId"]) {
    const v32 = v30["task_id"] || v30["taskId"];
    v25?.["onTaskId"]?.(String(v32));
    const v33 = getProviderConfig(v26),
      v34 = v24["apiKey"] || v33["apiKey"],
      v35 = await pollSceneDetectionTask(v32, v26, v34);
    v31 = processSceneDetectionResult(v35, v26);
  } else v31 = processSceneDetectionResult(v30, v26);
  return v31;
}
