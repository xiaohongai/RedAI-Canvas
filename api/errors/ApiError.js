export const ErrorType = {
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  DNS_ERROR: "DNS_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  FORBIDDEN: "FORBIDDEN",
  RATE_LIMIT: "RATE_LIMIT",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  INVALID_PARAMS: "INVALID_PARAMS",
  CONTENT_FILTERED: "CONTENT_FILTERED",
  MODEL_UNAVAILABLE: "MODEL_UNAVAILABLE",
  SERVER_ERROR: "SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  TASK_FAILED: "TASK_FAILED",
  TASK_TIMEOUT: "TASK_TIMEOUT",
  UNKNOWN: "UNKNOWN",
};
const ERROR_MESSAGES = {
  [ErrorType["NETWORK_ERROR"]]: "网络连接失败，请检查网络或代理设置",
  [ErrorType["TIMEOUT"]]: "请求超时，请稍后重试",
  [ErrorType["DNS_ERROR"]]: "无法解析服务器地址，请检查网络配置",
  [ErrorType["AUTH_ERROR"]]: "API\x20Key\x20无效或已过期，请检查配置",
  [ErrorType["FORBIDDEN"]]: "权限不足，无法访问该资源",
  [ErrorType["RATE_LIMIT"]]: "请求过于频繁，请稍后再试",
  [ErrorType["INSUFFICIENT_BALANCE"]]: "账户余额不足，请充值",
  [ErrorType["INVALID_PARAMS"]]: "请求参数错误，请检查输入",
  [ErrorType["CONTENT_FILTERED"]]: "生成内容被安全过滤，请修改提示词",
  [ErrorType["MODEL_UNAVAILABLE"]]: "当前模型不可用，请更换模型或稍后再试",
  [ErrorType["SERVER_ERROR"]]: "服务器内部错误，请稍后再试",
  [ErrorType["SERVICE_UNAVAILABLE"]]: "服务暂时不可用，请稍后再试",
  [ErrorType["TASK_FAILED"]]: "生成任务执行失败",
  [ErrorType["TASK_TIMEOUT"]]: "任务处理超时，请稍后查询结果",
  [ErrorType["UNKNOWN"]]: "发生未知错误，请稍后重试",
};
export class ApiError extends Error {
  constructor(v0) {
    const {
      type: v1,
      message: v2,
      provider: v3,
      code: v4,
      retryable: v5,
      raw: v6,
      status: v7,
    } = v0;
    (super(v2 || ERROR_MESSAGES[v1] || ERROR_MESSAGES[ErrorType["UNKNOWN"]]),
      (this["name"] = "ApiError"),
      (this["type"] = v1 || ErrorType["UNKNOWN"]),
      (this["provider"] = v3 || "unknown"),
      (this["code"] = v4),
      (this["retryable"] = v5 ?? this["_isRetryable"](v1)),
      (this["raw"] = v6),
      (this["status"] = v7),
      Error["captureStackTrace"] && Error["captureStackTrace"](this, ApiError));
  }
  ["_isRetryable"](v8) {
    const v9 = [
      ErrorType["TIMEOUT"],
      ErrorType["RATE_LIMIT"],
      ErrorType["SERVER_ERROR"],
      ErrorType["SERVICE_UNAVAILABLE"],
      ErrorType["NETWORK_ERROR"],
    ];
    return v9["includes"](v8);
  }
  ["getUserMessage"](v10 = true) {
    let v11 = this["message"];
    if (v10 && this["provider"] && this["provider"] !== "unknown") {
      const v12 = {
          grsai: "GRSAI",
          ppio: "PPIO",
          apimart: "APIMart",
          runninghub: "RunningHUB",
          gemini: "Gemini",
          openai: "OpenAI",
        },
        v13 = v12[this["provider"]] || this["provider"];
      v11 = "[" + v13 + "]\x20" + v11;
    }
    return (this["code"] && (v11 += " (错误码: " + this["code"] + ")"), v11);
  }
  ["toLogString"]() {
    return (
      "[" +
      this["provider"] +
      "]\x20" +
      this["type"] +
      "(" +
      (this["code"] || "N/A") +
      "):\x20" +
      this["message"]
    );
  }
  static ["networkError"](v14, v15) {
    return new ApiError({
      type: ErrorType["NETWORK_ERROR"],
      provider: v14,
      message: "网络请求失败: " + (v15?.["message"] || "未知网络错误"),
      raw: v15,
      retryable: true,
    });
  }
  static ["timeout"](v16, v17) {
    return new ApiError({
      type: ErrorType["TIMEOUT"],
      provider: v16,
      message:
        "请求超时（" +
        (v17 ? Math["round"](v17 / 1000) + "秒" : "未知") +
        "），请检查网络连接或稍后重试",
      retryable: true,
    });
  }
  static ["insufficientBalance"](v18, v19) {
    return new ApiError({
      type: ErrorType["INSUFFICIENT_BALANCE"],
      provider: v18,
      code: v19,
      message: "账户余额不足，请充值或更换 API Key",
      retryable: false,
    });
  }
  static ["authError"](v20, v21, v22) {
    return new ApiError({
      type: ErrorType["AUTH_ERROR"],
      provider: v20,
      code: v21,
      message: v22 || "API Key 无效或已过期",
      retryable: false,
    });
  }
  static ["rateLimit"](v23, v24) {
    return new ApiError({
      type: ErrorType["RATE_LIMIT"],
      provider: v23,
      code: v24,
      message: "请求过于频繁，请稍后再试",
      retryable: true,
    });
  }
  static ["contentFiltered"](v25, v26) {
    return new ApiError({
      type: ErrorType["CONTENT_FILTERED"],
      provider: v25,
      message: v26 || "生成内容被安全过滤，请修改提示词后重试",
      retryable: false,
    });
  }
  static ["taskFailed"](v27, v28) {
    return new ApiError({
      type: ErrorType["TASK_FAILED"],
      provider: v27,
      message: "生成任务失败: " + (v28 || "未知原因"),
      retryable: false,
    });
  }
  static ["taskTimeout"](v29) {
    return new ApiError({
      type: ErrorType["TASK_TIMEOUT"],
      provider: v29,
      message: "任务处理超时，请稍后查询结果",
      retryable: false,
    });
  }
  static ["fromHttpStatus"](v30, v31, v32) {
    let v33 = ErrorType["UNKNOWN"];
    switch (v30) {
      case 400:
        v33 = ErrorType["INVALID_PARAMS"];
        break;
      case 401:
        v33 = ErrorType["AUTH_ERROR"];
        break;
      case 403:
        v33 = ErrorType["FORBIDDEN"];
        break;
      case 429:
        v33 = ErrorType["RATE_LIMIT"];
        break;
      case 500:
        v33 = ErrorType["SERVER_ERROR"];
        break;
      case 503:
        v33 = ErrorType["SERVICE_UNAVAILABLE"];
        break;
    }
    return new ApiError({
      type: v33,
      provider: v31,
      status: v30,
      message: v32 || ERROR_MESSAGES[v33],
      retryable: v30 >= 500 || v30 === 429,
    });
  }
}
export default ApiError;
