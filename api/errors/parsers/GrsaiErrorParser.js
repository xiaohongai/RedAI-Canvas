import { ApiError, ErrorType } from "../ApiError.js";
const GRSAI_OFFICIAL_CODES = {
    0: null,
    "-22": {
      type: ErrorType["TASK_FAILED"],
      message: "任务不存在",
      retryable: false,
    },
  },
  GRSAI_HTTP_STATUS_MAP = {
    400: {
      type: ErrorType["INVALID_PARAMS"],
      message: "请求参数错误",
      retryable: false,
    },
    401: {
      type: ErrorType["AUTH_ERROR"],
      message: "API\x20Key\x20无效或已过期",
      retryable: false,
    },
    403: {
      type: ErrorType["FORBIDDEN"],
      message: "没有访问权限",
      retryable: false,
    },
    404: {
      type: ErrorType["MODEL_UNAVAILABLE"],
      message: "模型或任务不存在",
      retryable: false,
    },
    429: {
      type: ErrorType["RATE_LIMIT"],
      message: "请求过于频繁，请稍后重试",
      retryable: true,
    },
    500: {
      type: ErrorType["SERVER_ERROR"],
      message: "服务器内部错误，请稍后重试",
      retryable: true,
    },
    502: {
      type: ErrorType["SERVICE_UNAVAILABLE"],
      message: "网关错误，请稍后重试",
      retryable: true,
    },
    503: {
      type: ErrorType["SERVICE_UNAVAILABLE"],
      message: "服务暂时不可用，请稍后重试",
      retryable: true,
    },
  };
function extractErrorCode(v0, v1) {
  if (v0?.["code"] !== undefined && v0?.["code"] !== 0) return v0["code"];
  if (v1 >= 400) return v1;
  return null;
}
function extractErrorMessage(v2) {
  return (
    v2?.["msg"] ||
    v2?.["message"] ||
    v2?.["error"] ||
    v2?.["errorMessage"] ||
    ""
  );
}
export function parseError(v3, v4) {
  if (!v3) return null;
  const v5 = extractErrorCode(v3, v4),
    v6 = extractErrorMessage(v3),
    v7 = String(v6)["toUpperCase"]();
  if (v5 === 0 || v5 === "0") return null;
  if (GRSAI_OFFICIAL_CODES[v5]) {
    const v8 = GRSAI_OFFICIAL_CODES[v5];
    return new ApiError({
      type: v8["type"],
      provider: "grsai",
      code: v5,
      message: v6 || v8["message"],
      status: v4,
      retryable: v8["retryable"],
    });
  }
  if (GRSAI_HTTP_STATUS_MAP[v4]) {
    const v9 = GRSAI_HTTP_STATUS_MAP[v4];
    return new ApiError({
      type: v9["type"],
      provider: "grsai",
      code: v5 || v4,
      message: v6 || v9["message"],
      status: v4,
      retryable: v9["retryable"],
    });
  }
  if (v7["includes"]("BALANCE") || v7["includes"]("余额"))
    return ApiError["insufficientBalance"]("grsai", v5);
  if (
    v7["includes"]("AUTH") ||
    v7["includes"]("API_KEY") ||
    v7["includes"]("KEY")
  )
    return ApiError["authError"]("grsai", v5, v6);
  if (
    v7["includes"]("RATE") ||
    v7["includes"]("LIMIT") ||
    v7["includes"]("频繁")
  )
    return ApiError["rateLimit"]("grsai", v5);
  if (
    v7["includes"]("CONTENT") ||
    v7["includes"]("FILTER") ||
    v7["includes"]("审核")
  )
    return ApiError["contentFiltered"]("grsai", v6);
  if (v7["includes"]("NOT_FOUND") || v7["includes"]("不存在") || v5 === -22)
    return new ApiError({
      type: ErrorType["TASK_FAILED"],
      provider: "grsai",
      code: v5,
      message: v6 || "任务不存在",
      status: v4,
      retryable: false,
    });
  if (v4 >= 400) return ApiError["fromHttpStatus"](v4, "grsai", v6);
  if (v5 !== null && v5 !== undefined)
    return new ApiError({
      type: ErrorType["UNKNOWN"],
      provider: "grsai",
      code: v5,
      message: v6 || "未知错误\x20(code:\x20" + v5 + ")",
      status: v4,
      retryable: false,
    });
  return null;
}
export function parseTaskError(v10) {
  if (!v10) return null;
  const v11 = String(v10["status"] || v10?.["data"]?.["status"] || "")[
      "toLowerCase"
    ](),
    v12 =
      Array["isArray"](v10?.["results"]) && v10["results"]["length"] > 0
        ? v10["results"][0]
        : null,
    v13 =
      v10["error"] ||
      v10["errorMessage"] ||
      v10["message"] ||
      v10["failure_reason"] ||
      v10?.["data"]?.["error"] ||
      v10?.["data"]?.["errorMessage"] ||
      v10?.["data"]?.["message"] ||
      v10?.["data"]?.["failure_reason"] ||
      v12?.["error"] ||
      v12?.["errorMessage"] ||
      v12?.["message"] ||
      "",
    v14 = String(v13 || ""),
    v15 = v14["toUpperCase"](),
    v16 =
      v15["includes"]("SENSITIVE") ||
      v15["includes"]("FLAGGED") ||
      v15["includes"]("CONTENT") ||
      v15["includes"]("FILTER") ||
      v15["includes"]("VIOLATION") ||
      v14["includes"]("违规") ||
      v14["includes"]("敏感") ||
      v14["includes"]("审核");
  if (v16)
    return ApiError["contentFiltered"](
      "grsai",
      v14 || "输入或输出触发内容风控",
    );
  if (v11 === "failed" || v11 === "error")
    return ApiError["taskFailed"]("grsai", v14 || "未知错误");
  const v17 = v10?.["code"] ?? v10?.["data"]?.["code"];
  if (String(v17) === "-22")
    return ApiError["taskFailed"]("grsai", v14 || "任务不存在");
  return null;
}
export default { parseError: parseError, parseTaskError: parseTaskError };
