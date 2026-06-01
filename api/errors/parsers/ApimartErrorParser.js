import { ApiError, ErrorType } from "../ApiError.js";
const APIMART_HTTP_STATUS_MAP = {
    400: {
      type: ErrorType["INVALID_PARAMS"],
      message: "无效的请求参数：请检查请求参数是否正确",
      retryable: false,
    },
    401: {
      type: ErrorType["AUTH_ERROR"],
      message: "认证失败：请检查 API Key 是否正确",
      retryable: false,
    },
    402: {
      type: ErrorType["INSUFFICIENT_BALANCE"],
      message: "余额不足：请充值",
      retryable: false,
    },
    403: {
      type: ErrorType["FORBIDDEN"],
      message: "没有访问权限：无法访问该资源",
      retryable: false,
    },
    404: {
      type: ErrorType["MODEL_UNAVAILABLE"],
      message: "找不到指定的模型：请检查模型 ID 是否正确",
      retryable: false,
    },
    429: {
      type: ErrorType["RATE_LIMIT"],
      message: "请求过于频繁：请稍后重试",
      retryable: true,
    },
    500: {
      type: ErrorType["SERVER_ERROR"],
      message: "服务器内部错误：请稍后重试",
      retryable: true,
    },
    502: {
      type: ErrorType["SERVICE_UNAVAILABLE"],
      message: "网关错误：服务暂时不可用，请稍后重试",
      retryable: true,
    },
    503: {
      type: ErrorType["SERVICE_UNAVAILABLE"],
      message: "服务暂时不可用：请稍后重试",
      retryable: true,
    },
  },
  APIMART_BUSINESS_CODES = {
    605: {
      type: ErrorType["INSUFFICIENT_BALANCE"],
      message: "账户余额不足：请充值或更换 API Key",
      retryable: false,
    },
  },
  APIMART_ERROR_KEYWORDS = {
    NOT_ENOUGH_BALANCE: {
      type: ErrorType["INSUFFICIENT_BALANCE"],
      message: "账户余额不足",
    },
    INVALID_API_KEY: { type: ErrorType["AUTH_ERROR"], message: "API Key 无效" },
    RATE_LIMIT_EXCEEDED: {
      type: ErrorType["RATE_LIMIT"],
      message: "请求过于频繁",
    },
    INVALID_PARAMETERS: {
      type: ErrorType["INVALID_PARAMS"],
      message: "请求参数错误",
    },
    MODEL_NOT_AVAILABLE: {
      type: ErrorType["MODEL_UNAVAILABLE"],
      message: "模型不可用",
    },
    CONTENT_VIOLATION: {
      type: ErrorType["CONTENT_FILTERED"],
      message: "内容违规",
    },
    TASK_FAILED: { type: ErrorType["TASK_FAILED"], message: "任务执行失败" },
    INVALID_ARGUMENT: {
      type: ErrorType["INVALID_PARAMS"],
      message: "无效的请求参数",
    },
  };
function extractErrorCode(v0, v1) {
  if (APIMART_HTTP_STATUS_MAP[v1]) return v1;
  const v2 =
    v0?.["error"]?.["code"] ??
    v0?.["code"] ??
    v0?.["errorCode"] ??
    v0?.["error_code"] ??
    v0?.["errCode"] ??
    v1;
  return v2;
}
function extractErrorMessage(v3) {
  if (v3?.["error"]?.["message"]) return v3["error"]["message"];
  return (
    v3?.["errorMessage"] ||
    v3?.["error_message"] ||
    v3?.["message"] ||
    v3?.["msg"] ||
    (typeof v3?.["error"] === "string" ? v3["error"] : "") ||
    ""
  );
}
function stringifyErrorValue(v4) {
  if (v4 == null) return "";
  if (typeof v4 === "string") return v4["trim"]();
  if (typeof v4 === "number" || typeof v4 === "boolean") return String(v4);
  if (typeof v4 === "object") {
    const v5 =
      v4["message"] ||
      v4["errorMessage"] ||
      v4["error_message"] ||
      v4["detail"] ||
      v4["reason"] ||
      v4["type"] ||
      v4["status"] ||
      v4["code"];
    if (v5) return stringifyErrorValue(v5);
    try {
      return JSON["stringify"](v4);
    } catch {
      return String(v4 || "")["trim"]();
    }
  }
  return String(v4 || "")["trim"]();
}
function extractTaskStatus(v6) {
  return String(
    v6?.["status"] ||
      v6?.["taskStatus"] ||
      v6?.["task_status"] ||
      v6?.["state"] ||
      v6?.["phase"] ||
      v6?.["data"]?.["status"] ||
      v6?.["data"]?.["taskStatus"] ||
      v6?.["data"]?.["task_status"] ||
      "",
  )
    ["trim"]()
    ["toLowerCase"]();
}
function extractTaskFailureReason(v7) {
  const v8 = [
    v7?.["error"]?.["message"],
    v7?.["error"]?.["error"]?.["message"],
    v7?.["errorMessage"],
    v7?.["error_message"],
    v7?.["message"],
    v7?.["failedReason"],
    v7?.["failReason"],
    v7?.["failure_reason"],
    v7?.["data"]?.["error"]?.["message"],
    v7?.["data"]?.["error"]?.["error"]?.["message"],
    v7?.["data"]?.["errorMessage"],
    v7?.["data"]?.["error_message"],
    v7?.["data"]?.["message"],
    v7?.["data"]?.["failedReason"],
    v7?.["data"]?.["failReason"],
    v7?.["data"]?.["failure_reason"],
    v7?.["result"]?.["error"]?.["message"],
    v7?.["result"]?.["errorMessage"],
    v7?.["result"]?.["message"],
  ];
  for (const v9 of v8) {
    const v10 = stringifyErrorValue(v9);
    if (v10) return v10;
  }
  return (
    stringifyErrorValue(v7?.["error"]) ||
    stringifyErrorValue(v7?.["data"]?.["error"]) ||
    stringifyErrorValue(v7?.["result"]?.["error"]) ||
    ""
  );
}
export function parseError(v11, v12) {
  if (!v11) return null;
  const v13 = extractErrorCode(v11, v12),
    v14 = extractErrorMessage(v11),
    v15 = String(v14)["toUpperCase"]();
  if (APIMART_HTTP_STATUS_MAP[v13]) {
    const v16 = APIMART_HTTP_STATUS_MAP[v13];
    return new ApiError({
      type: v16["type"],
      provider: "apimart",
      code: v13,
      message: v14 || v16["message"],
      status: v12,
      retryable: v16["retryable"],
    });
  }
  if (APIMART_BUSINESS_CODES[v13]) {
    const v17 = APIMART_BUSINESS_CODES[v13];
    return new ApiError({
      type: v17["type"],
      provider: "apimart",
      code: v13,
      message: v14 || v17["message"],
      status: v12,
      retryable: v17["retryable"],
    });
  }
  for (const [v18, v19] of Object["entries"](APIMART_ERROR_KEYWORDS)) {
    if (v15["includes"](v18))
      return new ApiError({
        type: v19["type"],
        provider: "apimart",
        code: v13,
        message: v14 || v19["message"],
        status: v12,
        retryable: false,
      });
  }
  if (v12 >= 400) return ApiError["fromHttpStatus"](v12, "apimart", v14);
  return null;
}
export function parseTaskError(v20) {
  if (!v20) return null;
  const v21 = extractTaskStatus(v20);
  if (
    v21 === "failed" ||
    v21 === "fail" ||
    v21 === "error" ||
    v21 === "cancelled" ||
    v21 === "canceled"
  ) {
    const v22 =
        extractTaskFailureReason(v20) ||
        (v21 === "cancelled" || v21 === "canceled" ? "任务已取消" : "未知错误"),
      v23 = String(v22)["toUpperCase"]();
    for (const [v24, v25] of Object["entries"](APIMART_ERROR_KEYWORDS)) {
      if (v23["includes"](v24))
        return new ApiError({
          type: v25["type"],
          provider: "apimart",
          message: v25["message"] + ":\x20" + v22,
          retryable: false,
        });
    }
    return ApiError["taskFailed"]("apimart", v22);
  }
  return null;
}
export default { parseError: parseError, parseTaskError: parseTaskError };
