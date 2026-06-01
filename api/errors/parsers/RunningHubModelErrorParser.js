import { ApiError, ErrorType } from "../ApiError.js";
const MODEL_ERROR_CODE_MAP = {
    1000: {
      type: ErrorType["SERVER_ERROR"],
      message: "未知错误，请联系技术支持排查。",
      retryable: false,
    },
    1001: {
      type: ErrorType["INVALID_PARAMS"],
      message: "请求链接无效，请检查调用的\x20API\x20Endpoint\x20是否正确。",
      retryable: false,
    },
    1002: {
      type: ErrorType["AUTH_ERROR"],
      message: "API Key 无效，请检查 API Key 是否配置正确或已被禁用。",
      retryable: false,
    },
    1003: {
      type: ErrorType["RATE_LIMIT"],
      message: "请求频率超限，请降低并发请求频率。",
      retryable: true,
    },
    1004: {
      type: ErrorType["TASK_FAILED"],
      message: "任务不存在或已过期，请确认任务 ID 是否正确。",
      retryable: false,
    },
    1005: {
      type: ErrorType["SERVER_ERROR"],
      message: "系统内部错误，请稍后重试。",
      retryable: true,
    },
    1006: {
      type: ErrorType["TASK_TIMEOUT"],
      message: "任务执行超时，请尝试重新提交。",
      retryable: true,
    },
    1007: {
      type: ErrorType["INVALID_PARAMS"],
      message: "请求参数校验失败，请检查参数格式、类型或文件有效性。",
      retryable: false,
    },
    1008: {
      type: ErrorType["INVALID_PARAMS"],
      message: "文件大小超出限制，请参考文档中的文件大小上限。",
      retryable: false,
    },
    1009: {
      type: ErrorType["INVALID_PARAMS"],
      message: "请求方法不支持，请确认请求方式是否正确。",
      retryable: false,
    },
    1010: {
      type: ErrorType["SERVICE_UNAVAILABLE"],
      message: "服务暂不可用，系统维护或临时故障，请稍后重试。",
      retryable: true,
    },
    1011: {
      type: ErrorType["RATE_LIMIT"],
      message: "模型负载较高，请稍后重试。",
      retryable: true,
    },
    1012: {
      type: ErrorType["SERVER_ERROR"],
      message: "模型响应异常，请重试。",
      retryable: true,
    },
    1013: {
      type: ErrorType["SERVER_ERROR"],
      message: "文件处理失败，请检查输入文件链接或文件完整性。",
      retryable: true,
    },
    1014: {
      type: ErrorType["FORBIDDEN"],
      message: "权限不足，标准模型 API 仅限企业级共享 API Key 调用。",
      retryable: false,
    },
    1015: {
      type: ErrorType["TASK_FAILED"],
      message: "生成失败，任务处理过程中出现异常，请尝试重新提交。",
      retryable: true,
    },
    1501: {
      type: ErrorType["CONTENT_FILTERED"],
      message: "内容安全审查未通过，请修改提示词或图片。",
      retryable: false,
    },
    1504: {
      type: ErrorType["TIMEOUT"],
      message: "模型响应超时，请稍后重试。",
      retryable: true,
    },
    1505: {
      type: ErrorType["CONTENT_FILTERED"],
      message: "不支持真人图像处理，请修改提示词或参考图。",
      retryable: false,
    },
    1506: {
      type: ErrorType["INVALID_PARAMS"],
      message: "音频克隆 ID 重复，请更换唯一的 voiceId。",
      retryable: false,
    },
    1516: {
      type: ErrorType["INVALID_PARAMS"],
      message: "外部文件下载失败，请检查 URL 是否可访问后重试。",
      retryable: true,
    },
    1517: {
      type: ErrorType["SERVER_ERROR"],
      message: "文件上传失败，请重试。",
      retryable: true,
    },
    1518: {
      type: ErrorType["INVALID_PARAMS"],
      message: "Base64 解码失败，请检查 Base64 字符串格式。",
      retryable: false,
    },
    1519: {
      type: ErrorType["SERVER_ERROR"],
      message: "内容处理异常，处理输入内容时出现非预期错误，请重试。",
      retryable: true,
    },
    1520: {
      type: ErrorType["RATE_LIMIT"],
      message: "账号并发达到上限，请等待已有任务完成后再发起新请求。",
      retryable: true,
    },
  },
  MESSAGE_HINT_TO_CODE = {
    "UNKNOWN\x20ERROR": 1000,
    "INVALID\x20URL": 1001,
    "INVALID\x20API\x20KEY": 1002,
    "RATE\x20LIMIT\x20EXCEEDED": 1003,
    "TASK\x20NOT\x20FOUND": 1004,
    "INTERNAL\x20SERVER\x20ERROR": 1005,
    "TASK\x20EXECUTION\x20TIMED\x20OUT": 1006,
    "INVALID\x20PARAMETERS": 1007,
    "FILE\x20SIZE\x20LIMIT\x20EXCEEDED": 1008,
    "HTTP\x20METHOD\x20NOT\x20SUPPORTED": 1009,
    "SERVICE\x20UNAVAILABLE": 1010,
    "MODEL\x20IS\x20CURRENTLY\x20BUSY": 1011,
    "MODEL\x20RESPONSE\x20EXCEPTION": 1012,
    "FILE\x20PROCESSING\x20FAILED": 1013,
    "ACCESS\x20DENIED": 1014,
    "GENERATION\x20FAILED": 1015,
    "CONTENT\x20SECURITY\x20AUDIT\x20FAILED": 1501,
    "MODEL\x20TIMED\x20OUT": 1504,
    "REAL\x20PEOPLE\x20PROHIBITED": 1505,
    "VOICE\x20ID\x20DUPLICATE": 1506,
    "EXTERNAL\x20DOWNLOAD\x20FAILED": 1516,
    "UPLOAD\x20FAILED": 1517,
    "BASE64\x20DECODE\x20FAILED": 1518,
    "CONTENT\x20PROCESSING\x20EXCEPTION": 1519,
    "CONCURRENCY\x20LIMIT\x20REACHED": 1520,
  };
function toNumberCode(v0) {
  if (typeof v0 === "number" && Number["isFinite"](v0)) return v0;
  if (typeof v0 === "string") {
    const v1 = v0["trim"]();
    if (/^\d+$/["test"](v1)) return Number(v1);
  }
  return null;
}
function collectCandidateObjects(v2) {
  if (!v2 || typeof v2 !== "object") return [];
  const v3 = [v2],
    v4 = (v5) => {
      if (v5 && typeof v5 === "object") v3["push"](v5);
    },
    v6 = (v7) => {
      if (!Array["isArray"](v7)) return;
      for (const v8 of v7) {
        if (v8 && typeof v8 === "object") v3["push"](v8);
      }
    };
  return (
    v4(v2["data"]),
    v4(v2["result"]),
    v4(v2["output"]),
    v4(v2["response"]),
    v6(v2["data"]),
    v6(v2["results"]),
    v3
  );
}
function extractMessage(v9) {
  const v10 = collectCandidateObjects(v9);
  for (const v11 of v10) {
    const v12 = String(
      v11?.["errorMessage"] ||
        v11?.["error"] ||
        v11?.["message"] ||
        v11?.["msg"] ||
        "",
    )["trim"]();
    if (v12) return v12;
  }
  return "";
}
function extractErrorCode(v13) {
  const v14 = collectCandidateObjects(v13);
  for (const v15 of v14) {
    const v16 =
      toNumberCode(v15["code"]) ??
      toNumberCode(v15["errorCode"]) ??
      toNumberCode(v15["error_code"]);
    if (v16 !== null) return v16;
  }
  for (const v17 of v14) {
    const v18 = String(
      v17["errorMessage"] || v17["error"] || v17["message"] || v17["msg"] || "",
    )["toUpperCase"]();
    if (!v18) continue;
    for (const [v19, v20] of Object["entries"](MESSAGE_HINT_TO_CODE)) {
      if (v18["includes"](v19)) return v20;
    }
  }
  return null;
}
function buildMappedError(v21, v22, v23) {
  const v24 = MODEL_ERROR_CODE_MAP[v21];
  if (!v24) return null;
  return new ApiError({
    type: v24["type"],
    provider: "runninghub",
    code: v21,
    message: v24["message"] || v23,
    status: v22,
    retryable: v24["retryable"],
  });
}
export function parseError(v25, v26) {
  if (!v25) return null;
  const v27 = extractErrorCode(v25);
  if (v27 !== null) {
    const v28 = buildMappedError(v27, v26);
    if (v28) return v28;
  }
  const v29 = extractMessage(v25);
  if (v26 >= 400) return ApiError["fromHttpStatus"](v26, "runninghub", v29);
  return null;
}
export function parseTaskError(v30) {
  if (!v30 || typeof v30 !== "object") return null;
  const v31 = extractErrorCode(v30);
  if (v31 !== null) {
    const v32 = buildMappedError(v31, null);
    if (v32) return v32;
  }
  const v33 = collectCandidateObjects(v30)
      ["map"]((v34) =>
        String(v34["status"] || v34["taskStatus"] || v34["task_status"] || "")[
          "toUpperCase"
        ](),
      )
      ["filter"](Boolean),
    v35 = v33[0] || "";
  if (v35 === "TIMEOUT") return ApiError["taskTimeout"]("runninghub");
  if (v35 === "FAILED" || v35 === "ERROR") {
    const v36 = extractMessage(v30) || "任务执行失败";
    return ApiError["taskFailed"]("runninghub", v36);
  }
  return null;
}
export default { parseError: parseError, parseTaskError: parseTaskError };
