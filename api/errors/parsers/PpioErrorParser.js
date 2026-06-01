import { ApiError, ErrorType } from "../ApiError.js";
const PP_MEDIA_ERROR_CODES = {
    INVALID_REQUEST_BODY: {
      type: ErrorType["INVALID_PARAMS"],
      message: "请求参数校验失败",
      retryable: false,
    },
    IMAGE_FILE_EXCEEDS_MAX_SIZE: {
      type: ErrorType["INVALID_PARAMS"],
      message: "图片大小超出限制",
      retryable: false,
    },
    INVALID_IMAGE_FORMAT: {
      type: ErrorType["INVALID_PARAMS"],
      message: "图片格式与要求不符",
      retryable: false,
    },
    IMAGE_EXCEEDS_MAX_RESOLUTION: {
      type: ErrorType["INVALID_PARAMS"],
      message: "图片分辨率超出限制",
      retryable: false,
    },
    INVALID_IMAGE_SIZE: {
      type: ErrorType["INVALID_PARAMS"],
      message: "图片长或宽超出限制",
      retryable: false,
    },
    IMAGE_NO_FACE_DETECTED: {
      type: ErrorType["INVALID_PARAMS"],
      message: "未检测到人脸",
      retryable: false,
    },
    INVALID_CUSTOM_OUTPUT_PATH: {
      type: ErrorType["INVALID_PARAMS"],
      message: "OSS 路径不合法",
      retryable: false,
    },
    ILLEGAL_PROMPT: {
      type: ErrorType["CONTENT_FILTERED"],
      message: "Prompt 含不适宜内容",
      retryable: false,
    },
    ILLEGAL_IMAGE_CONTENT: {
      type: ErrorType["CONTENT_FILTERED"],
      message: "图片含不适宜内容",
      retryable: false,
    },
    INVALID_AUDIO_FILE: {
      type: ErrorType["INVALID_PARAMS"],
      message: "输入音频不合法",
      retryable: false,
    },
    BILLING_BALANCE_NOT_ENOUGH: {
      type: ErrorType["INSUFFICIENT_BALANCE"],
      message: "余额不足",
      retryable: false,
    },
    MISSING_API_KEY: {
      type: ErrorType["AUTH_ERROR"],
      message: "未提供 API Key",
      retryable: false,
    },
    BILLING_AUTH_FAILED: {
      type: ErrorType["AUTH_ERROR"],
      message: "计费服务鉴权失败",
      retryable: false,
    },
    INVALID_API_KEY: {
      type: ErrorType["AUTH_ERROR"],
      message: "API\x20Key\x20校验失败",
      retryable: false,
    },
    FEATURE_NOT_ALLOWED: {
      type: ErrorType["FORBIDDEN"],
      message: "没有模型上传权限",
      retryable: false,
    },
    API_NOT_ALLOWED: {
      type: ErrorType["FORBIDDEN"],
      message: "无权限使用该 API",
      retryable: false,
    },
    NEED_REAL_NAME_VERIFY: {
      type: ErrorType["FORBIDDEN"],
      message: "未完成企业认证",
      retryable: false,
    },
    API_NOT_FOUND: {
      type: ErrorType["MODEL_UNAVAILABLE"],
      message: "API\x20不存在",
      retryable: false,
    },
    TASK_NOT_FOUND: {
      type: ErrorType["TASK_FAILED"],
      message: "任务不存在",
      retryable: false,
    },
    RATE_LIMIT_EXCEEDED: {
      type: ErrorType["RATE_LIMIT"],
      message: "触发频率控制限制，请稍后重试",
      retryable: true,
    },
    BILLING_FAILED: {
      type: ErrorType["SERVER_ERROR"],
      message: "计费服务异常，请稍后重试",
      retryable: true,
    },
    CREATE_TASK_FAILED: {
      type: ErrorType["SERVER_ERROR"],
      message: "创建任务失败，请稍后重试",
      retryable: true,
    },
    GET_RESULT_FAILED: {
      type: ErrorType["SERVER_ERROR"],
      message: "获取任务结果失败，请稍后重试",
      retryable: true,
    },
    TASK_FAILED: {
      type: ErrorType["TASK_FAILED"],
      message: "任务执行失败",
      retryable: false,
    },
  },
  PP_LLM_ERROR_CODES = {
    INVALID_REQUEST_BODY: {
      type: ErrorType["INVALID_PARAMS"],
      message: "请求体格式错误",
      retryable: false,
    },
    FAILED_TO_AUTH: {
      type: ErrorType["AUTH_ERROR"],
      message: "认证失败",
      retryable: false,
    },
    INVALID_API_KEY: {
      type: ErrorType["AUTH_ERROR"],
      message: "未提供\x20API\x20Key",
      retryable: false,
    },
    NOT_ENOUGH_BALANCE: {
      type: ErrorType["INSUFFICIENT_BALANCE"],
      message: "余额不足",
      retryable: false,
    },
    ACCESS_DENY: {
      type: ErrorType["FORBIDDEN"],
      message: "无权限访问",
      retryable: false,
    },
    MODEL_NOT_FOUND: {
      type: ErrorType["MODEL_UNAVAILABLE"],
      message: "模型不存在",
      retryable: false,
    },
    RATE_LIMIT_EXCEEDED: {
      type: ErrorType["RATE_LIMIT"],
      message: "请求过快，请稍后重试",
      retryable: true,
    },
    TOKEN_LIMIT_EXCEEDED: {
      type: ErrorType["RATE_LIMIT"],
      message: "Token 数超限，请稍后重试",
      retryable: true,
    },
    SERVICE_NOT_AVAILABLE: {
      type: ErrorType["SERVICE_UNAVAILABLE"],
      message: "服务不可用，请稍后重试",
      retryable: true,
    },
  },
  PP_BILLING_ERROR_CODES = {
    UNKNOWN: {
      type: ErrorType["SERVER_ERROR"],
      message: "未知错误，请联系我们",
      retryable: false,
    },
    LIST_BILL_TOO_FAST: {
      type: ErrorType["RATE_LIMIT"],
      message: "请求过于频繁，请稍后重试",
      retryable: true,
    },
    INVALID_PRODUCT_CATEGORY: {
      type: ErrorType["INVALID_PARAMS"],
      message: "productCategory 参数错误",
      retryable: false,
    },
    INVALID_BILL_CYCLE: {
      type: ErrorType["INVALID_PARAMS"],
      message: "cycle 参数错误",
      retryable: false,
    },
    LIST_BILL_ERROR: {
      type: ErrorType["SERVER_ERROR"],
      message: "查询错误，请联系我们",
      retryable: false,
    },
  },
  PP_ALL_ERROR_CODES = {
    ...PP_MEDIA_ERROR_CODES,
    ...PP_LLM_ERROR_CODES,
    ...PP_BILLING_ERROR_CODES,
    insufficient_quota: {
      type: ErrorType["INSUFFICIENT_BALANCE"],
      message: "额度不足",
      retryable: false,
    },
    rate_limit_exceeded: {
      type: ErrorType["RATE_LIMIT"],
      message: "请求过于频繁",
      retryable: true,
    },
    invalid_api_key: {
      type: ErrorType["AUTH_ERROR"],
      message: "API Key 无效",
      retryable: false,
    },
    invalid_request_error: {
      type: ErrorType["INVALID_PARAMS"],
      message: "请求参数错误",
      retryable: false,
    },
    model_not_found: {
      type: ErrorType["MODEL_UNAVAILABLE"],
      message: "模型不存在",
      retryable: false,
    },
    server_error: {
      type: ErrorType["SERVER_ERROR"],
      message: "服务器错误",
      retryable: true,
    },
    timeout: {
      type: ErrorType["TIMEOUT"],
      message: "请求超时",
      retryable: true,
    },
  },
  PP_HTTP_STATUS_MAP = {
    400: {
      type: ErrorType["INVALID_PARAMS"],
      message: "请求参数错误",
      retryable: false,
    },
    401: {
      type: ErrorType["AUTH_ERROR"],
      message: "认证失败",
      retryable: false,
    },
    403: {
      type: ErrorType["FORBIDDEN"],
      message: "没有访问权限",
      retryable: false,
    },
    404: {
      type: ErrorType["MODEL_UNAVAILABLE"],
      message: "资源不存在",
      retryable: false,
    },
    429: {
      type: ErrorType["RATE_LIMIT"],
      message: "请求过于频繁，请稍后重试",
      retryable: true,
    },
    500: {
      type: ErrorType["SERVER_ERROR"],
      message: "服务器内部错误",
      retryable: true,
    },
    502: {
      type: ErrorType["SERVICE_UNAVAILABLE"],
      message: "网关错误",
      retryable: true,
    },
    503: {
      type: ErrorType["SERVICE_UNAVAILABLE"],
      message: "服务不可用",
      retryable: true,
    },
  };
function extractErrorCode(v0, v1) {
  const v2 = v0?.["error"] || v0,
    v3 = v2?.["code"] || v2?.["error_code"] || v2?.["error_name"] || "";
  if (v3 && typeof v3 === "string") return v3;
  const v4 = v2?.["code"] || v2?.["status"] || v1;
  if (v4 && typeof v4 === "number") return v4;
  return v1;
}
function extractErrorMessage(v5) {
  const v6 = v5?.["error"] || v5;
  return (
    v6?.["message"] ||
    v6?.["error_message"] ||
    v6?.["msg"] ||
    v5?.["message"] ||
    ""
  );
}
export function parseError(v7, v8) {
  if (!v7) return null;
  const v9 = extractErrorCode(v7, v8),
    v10 = extractErrorMessage(v7),
    v11 = String(v9)["toUpperCase"](),
    v12 = String(v10)["toUpperCase"]();
  if (PP_ALL_ERROR_CODES[v9]) {
    const v13 = PP_ALL_ERROR_CODES[v9];
    return new ApiError({
      type: v13["type"],
      provider: "ppio",
      code: v9,
      message: v10 || v13["message"],
      status: v8,
      retryable: v13["retryable"],
    });
  }
  if (PP_ALL_ERROR_CODES[v11]) {
    const v14 = PP_ALL_ERROR_CODES[v11];
    return new ApiError({
      type: v14["type"],
      provider: "ppio",
      code: v9,
      message: v10 || v14["message"],
      status: v8,
      retryable: v14["retryable"],
    });
  }
  if (PP_HTTP_STATUS_MAP[v8]) {
    const v15 = PP_HTTP_STATUS_MAP[v8];
    return new ApiError({
      type: v15["type"],
      provider: "ppio",
      code: v8,
      message: v10 || v15["message"],
      status: v8,
      retryable: v15["retryable"],
    });
  }
  if (
    v12["includes"]("BALANCE") ||
    v12["includes"]("余额") ||
    v12["includes"]("QUOTA")
  )
    return ApiError["insufficientBalance"]("ppio", v9);
  if (
    v12["includes"]("RATE") ||
    v12["includes"]("LIMIT") ||
    v12["includes"]("频繁")
  )
    return ApiError["rateLimit"]("ppio", v9);
  if (
    v12["includes"]("AUTH") ||
    v12["includes"]("API_KEY") ||
    v12["includes"]("认证")
  )
    return ApiError["authError"]("ppio", v9, v10);
  if (
    v12["includes"]("CONTENT") ||
    v12["includes"]("PROMPT") ||
    v12["includes"]("不适宜")
  )
    return ApiError["contentFiltered"]("ppio", v10);
  if (v8 >= 400) return ApiError["fromHttpStatus"](v8, "ppio", v10);
  return null;
}
export function parseTaskError(v16) {
  if (!v16) return null;
  const v17 = (v16["status"] || "")["toLowerCase"]();
  if (v17 === "failed" || v17 === "error") {
    const v18 =
        v16["error"] || v16["errorMessage"] || v16["message"] || "未知错误",
      v19 = String(v18)["toUpperCase"]();
    for (const [v20, v21] of Object["entries"](PP_ALL_ERROR_CODES)) {
      if (v19["includes"](v20))
        return new ApiError({
          type: v21["type"],
          provider: "ppio",
          message: v21["message"] + ":\x20" + v18,
          retryable: v21["retryable"],
        });
    }
    return ApiError["taskFailed"]("ppio", v18);
  }
  return null;
}
export default { parseError: parseError, parseTaskError: parseTaskError };
