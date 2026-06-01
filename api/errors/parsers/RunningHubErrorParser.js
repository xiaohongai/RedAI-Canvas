import { ApiError, ErrorType } from "../ApiError.js";
const RH_ERROR_CODE_MAP = {
    301: {
      type: ErrorType["INVALID_PARAMS"],
      message: "参数错误：必填参数缺失或类型不符，请核对文档",
    },
    380: {
      type: ErrorType["INVALID_PARAMS"],
      message: "工作流不存在：指定的工作流 ID 无效",
    },
    412: {
      type: ErrorType["INVALID_PARAMS"],
      message: "API 路径拼写错误：请检查接口 URL 是否正确",
    },
    415: {
      type: ErrorType["RATE_LIMIT"],
      message: "独占型 API 机器数不足：资源紧张，请等待 30-120 秒后重试",
      retryable: true,
    },
    416: {
      type: ErrorType["INSUFFICIENT_BALANCE"],
      message: "钱包余额不足：账户余额不足，请充值",
      retryable: false,
    },
    421: {
      type: ErrorType["RATE_LIMIT"],
      message: "共享型\x20API\x20并发上限：并发达上限，请自行排队或联系扩容",
      retryable: true,
    },
    423: {
      type: ErrorType["TASK_FAILED"],
      message: "未找到指定任务：任务\x20ID\x20错误或已被清理",
      retryable: false,
    },
    433: {
      type: ErrorType["INVALID_PARAMS"],
      message:
        "工作流校验未通过：节点参数或连接逻辑错误，请查看\x20msg\x20详情",
    },
    435: {
      type: ErrorType["INVALID_PARAMS"],
      message:
        '未找到任务用户 API 实例：48G显存机器调用时请添加参数 "instanceType": "plus"',
    },
    436: {
      type: ErrorType["FORBIDDEN"],
      message: "独占会员到期：独占资源服务已到期",
      retryable: false,
    },
    500: {
      type: ErrorType["SERVER_ERROR"],
      message: "未知错误：服务端异常，请联系技术支持",
      retryable: true,
    },
    801: {
      type: ErrorType["FORBIDDEN"],
      message: "免费用户不支持 API Key：请升级账户等级",
      retryable: false,
    },
    802: {
      type: ErrorType["AUTH_ERROR"],
      message: "API Key 未授权/已失效：密钥错误或已被禁用",
      retryable: false,
    },
    803: {
      type: ErrorType["INVALID_PARAMS"],
      message: "nodeInfoList 不匹配：节点 ID 或字段名与工作流定义不一致",
    },
    804: {
      type: ErrorType["INVALID_PARAMS"],
      message: "任务正在运行中：请勿重复提交，建议轮询结果",
      retryable: false,
    },
    805: {
      type: ErrorType["TASK_FAILED"],
      message: "任务状态异常：任务可能已被中断或取消",
      retryable: false,
    },
    806: {
      type: ErrorType["AUTH_ERROR"],
      message: "未找到对应用户：Key 关联的用户信息不存在",
      retryable: false,
    },
    807: {
      type: ErrorType["TASK_FAILED"],
      message: "未找到对应任务：无法查询到该 ID 的任务记录",
      retryable: false,
    },
    808: {
      type: ErrorType["SERVER_ERROR"],
      message: "文件上传失败：存储服务异常或网络中断",
      retryable: true,
    },
    809: {
      type: ErrorType["INVALID_PARAMS"],
      message: "文件大小超出限制：上传的文件体积过大",
      retryable: false,
    },
    810: {
      type: ErrorType["INVALID_PARAMS"],
      message: "未保存或未运行工作流：请在平台保存并手动运行一次该工作流",
      retryable: false,
    },
    811: {
      type: ErrorType["AUTH_ERROR"],
      message: "企业版 API Key 无效：密钥错误或无企业权限",
      retryable: false,
    },
    812: {
      type: ErrorType["INSUFFICIENT_BALANCE"],
      message: "企业版余额不足：企业账户资金耗尽",
      retryable: false,
    },
    813: {
      type: ErrorType["INVALID_PARAMS"],
      message: "任务已排队：任务已受理，无需重试",
      retryable: false,
    },
    901: {
      type: ErrorType["INVALID_PARAMS"],
      message: "WebApp\x20不存在：关联的应用\x20ID\x20错误",
      retryable: false,
    },
    1000: {
      type: ErrorType["SERVER_ERROR"],
      message: "未知错误：请重试或联系支持",
      retryable: true,
    },
    1001: {
      type: ErrorType["INVALID_PARAMS"],
      message: "请求链接无效：请检查您的调用链接",
      retryable: false,
    },
    1002: {
      type: ErrorType["AUTH_ERROR"],
      message: "API Key 无效：请检查您的密钥",
      retryable: false,
    },
    1003: {
      type: ErrorType["RATE_LIMIT"],
      message: "请求频率超限：请降低请求速度",
      retryable: true,
    },
    1004: {
      type: ErrorType["TASK_FAILED"],
      message: "任务不存在或已过期：请检查任务 ID",
      retryable: false,
    },
    1005: {
      type: ErrorType["SERVER_ERROR"],
      message: "系统内部错误：请稍后重试",
      retryable: true,
    },
    1006: {
      type: ErrorType["TASK_TIMEOUT"],
      message: "任务执行超时：请重试",
      retryable: true,
    },
    1007: {
      type: ErrorType["INVALID_PARAMS"],
      message: "参数校验失败：请检查输入参数",
      retryable: false,
    },
    1008: {
      type: ErrorType["INVALID_PARAMS"],
      message: "文件大小超出限制：请压缩文件后重试",
      retryable: false,
    },
    1009: {
      type: ErrorType["INVALID_PARAMS"],
      message: "请求方法不支持：请查阅文档确认 (GET/POST)",
      retryable: false,
    },
    1010: {
      type: ErrorType["SERVICE_UNAVAILABLE"],
      message: "服务暂不可用：请稍后重试",
      retryable: true,
    },
    1011: {
      type: ErrorType["RATE_LIMIT"],
      message: "系统繁忙：请求量大，请稍后重试",
      retryable: true,
    },
    1012: {
      type: ErrorType["SERVER_ERROR"],
      message: "上游服务响应异常：请联系技术支持或稍后重试",
      retryable: true,
    },
    1013: {
      type: ErrorType["SERVER_ERROR"],
      message: "文件处理失败：请检查链接或重新上传",
      retryable: true,
    },
    1014: {
      type: ErrorType["FORBIDDEN"],
      message: "访问被拒绝：标准模型 API 仅限企业级-共享 API Key 调用",
      retryable: false,
    },
    1015: {
      type: ErrorType["TASK_FAILED"],
      message: "生成失败：请重试",
      retryable: true,
    },
    1101: {
      type: ErrorType["INVALID_PARAMS"],
      message: "节点信息异常：工作流节点数据解析错误",
      retryable: false,
    },
    1501: {
      type: ErrorType["CONTENT_FILTERED"],
      message: "内容审核未通过：请修改提示词或图片",
      retryable: false,
    },
    1504: {
      type: ErrorType["TIMEOUT"],
      message: "模型响应超时：请稍后重试",
      retryable: true,
    },
    1505: {
      type: ErrorType["CONTENT_FILTERED"],
      message: "禁止生成真人：请修改提示词或参考图",
      retryable: false,
    },
  },
  RH_ERROR_MSG_MAP = {
    PARAMS_INVALID: 301,
    WORKFLOW_NOT_EXISTS: 380,
    TOKEN_INVALID: 412,
    TASK_INSTANCE_MAXED: 415,
    TASK_CREATE_FAILED_BY_NOT_ENOUGH_WALLET: 416,
    TASK_QUEUE_MAXED: 421,
    TASK_NOT_FOUNED: 423,
    VALIDATE_PROMPT_FAILED: 433,
    TASK_USER_EXCLAPI_INSTANCE_NOT_FOUND: 435,
    TASK_USER_EXCLAPI_REQUIRED: 436,
    UNKNOWN_ERROR: 500,
    APIKEY_UNSUPPORTED_FREE_USER: 801,
    APIKEY_UNAUTHORIZED: 802,
    APIKEY_INVALID_NODE_INFO: 803,
    APIKEY_TASK_IS_RUNNING: 804,
    APIKEY_TASK_STATUS_ERROR: 805,
    APIKEY_USER_NOT_FOUND: 806,
    APIKEY_TASK_NOT_FOUND: 807,
    APIKEY_UPLOAD_FAILED: 808,
    APIKEY_FILE_SIZE_EXCEEDED: 809,
    WORKFLOW_NOT_SAVED_OR_NOT_RUNNING: 810,
    CORPAPIKEY_INVALID: 811,
    CORPAPIKEY_INSUFFICIENT_FUNDS: 812,
    APIKEY_TASK_IS_QUEUED: 813,
    WEBAPP_NOT_EXISTS: 901,
  };
function isPlainObject(v0) {
  return !!v0 && typeof v0 === "object" && !Array["isArray"](v0);
}
function toNonEmptyString(v1) {
  const v2 = String(v1 ?? "")["trim"]();
  return v2 || "";
}
function toMessageString(v3) {
  if (isPlainObject(v3))
    return toNonEmptyString(
      v3["errorMessage"] || v3["message"] || v3["error"] || v3["msg"],
    );
  return toNonEmptyString(v3);
}
function collectCandidateObjects(v4) {
  if (!v4 || typeof v4 !== "object") return [];
  const v5 = [],
    v6 = (v7) => {
      if (isPlainObject(v7)) v5["push"](v7);
    },
    v8 = (v9) => {
      if (!Array["isArray"](v9)) return;
      v9["forEach"](v6);
    };
  return (
    v6(v4),
    v6(v4["data"]),
    v6(v4["result"]),
    v6(v4["output"]),
    v6(v4["response"]),
    v8(v4["data"]),
    v8(v4["results"]),
    v5
  );
}
function extractFailureBaseMessage(v10, v11) {
  const v12 = collectCandidateObjects(v10);
  for (const v13 of v12) {
    const v14 = [
      v13["errorMessage"],
      v13["error"],
      v13["message"],
      v13["msg"],
      v13["failure_reason"],
    ];
    for (const v15 of v14) {
      const v16 = toMessageString(v15);
      if (v16) return v16;
    }
  }
  return toNonEmptyString(v11) || "任务执行失败";
}
function extractFailedReasonDetails(v17) {
  const v18 = collectCandidateObjects(v17);
  for (const v19 of v18) {
    const v20 = isPlainObject(v19["failedReason"])
      ? v19["failedReason"]
      : isPlainObject(v19["failed_reason"])
        ? v19["failed_reason"]
        : null;
    if (!v20) continue;
    const v21 = toNonEmptyString(v20["node_id"] || v20["nodeId"]),
      v22 = toNonEmptyString(
        v20["exception_message"] || v20["exceptionMessage"],
      );
    if (v21 || v22) return { nodeId: v21, exceptionMessage: v22 };
  }
  return { nodeId: "", exceptionMessage: "" };
}
export function appendRunningHubFailureDetails(v23, v24) {
  const v25 = toNonEmptyString(v23) || "任务执行失败",
    { nodeId: v26, exceptionMessage: v27 } = extractFailedReasonDetails(v24),
    v28 = [v25];
  if (v26) v28["push"]("node_id: " + v26);
  if (v27) v28["push"]("exception_message: " + v27);
  return v28["join"]("\x0a");
}
export function formatRunningHubFailureMessage(v29, v30 = "任务执行失败") {
  return appendRunningHubFailureDetails(
    extractFailureBaseMessage(v29, v30),
    v29,
  );
}
function extractErrorCode(v31) {
  if (v31["code"] && typeof v31["code"] === "number") return v31["code"];
  const v32 =
    v31["msg"] || v31["message"] || v31["errorMessage"] || v31["error"] || "";
  for (const [v33, v34] of Object["entries"](RH_ERROR_MSG_MAP)) {
    if (v32["includes"](v33)) return v34;
  }
  return null;
}
export function parseError(v35, v36) {
  if (!v35) return null;
  const v37 = parseTaskError(v35);
  if (v37) return v37;
  const v38 = extractErrorCode(v35);
  if (v38 && RH_ERROR_CODE_MAP[v38]) {
    const v39 = RH_ERROR_CODE_MAP[v38];
    return new ApiError({
      type: v39["type"],
      provider: "runninghub",
      code: v38,
      message: appendRunningHubFailureDetails(v39["message"], v35),
      status: v36,
      retryable: v39["retryable"] ?? (v38 >= 1005 && v38 !== 1015),
    });
  }
  const v40 =
      v35["errorMessage"] || v35["error"] || v35["message"] || v35["msg"] || "",
    v41 = String(v40)["toUpperCase"]();
  if (
    v41["includes"]("BALANCE") ||
    v41["includes"]("WALLET") ||
    v41["includes"]("余额") ||
    v41["includes"]("资金")
  )
    return ApiError["insufficientBalance"]("runninghub", v38 || v36);
  if (
    v36 === 401 ||
    v41["includes"]("API_KEY") ||
    v41["includes"]("UNAUTHORIZED") ||
    v41["includes"]("AUTH")
  )
    return ApiError["authError"]("runninghub", v38 || v36, v40);
  if (
    v36 === 429 ||
    v41["includes"]("RATE_LIMIT") ||
    v41["includes"]("TOO_MANY") ||
    v41["includes"]("繁忙")
  )
    return ApiError["rateLimit"]("runninghub", v38 || v36);
  if (
    v41["includes"]("CONTENT") ||
    v41["includes"]("审核") ||
    v41["includes"]("真人") ||
    v41["includes"]("PHOTOREALISTIC")
  )
    return ApiError["contentFiltered"]("runninghub", v40);
  const v42 = (v35["status"] || "")["toUpperCase"]();
  if (v42 === "FAILED" || v42 === "ERROR")
    return ApiError["taskFailed"](
      "runninghub",
      formatRunningHubFailureMessage(v35, v40 || "任务执行失败"),
    );
  if (v36 >= 400) return ApiError["fromHttpStatus"](v36, "runninghub", v40);
  return null;
}
export function parseTaskError(v43) {
  if (!v43) return null;
  const v44 = collectCandidateObjects(v43)["find"]((v45) => {
      const v46 = String(
        v45["status"] || v45["taskStatus"] || v45["task_status"] || "",
      )["toUpperCase"]();
      return v46 === "FAILED" || v46 === "ERROR";
    }),
    v47 = v44
      ? "FAILED"
      : (v43["status"] || v43["taskStatus"] || "")["toUpperCase"]();
  if (v47 === "FAILED" || v47 === "ERROR") {
    const v48 = v44 || v43,
      v49 = extractFailureBaseMessage(v48, "未知错误");
    for (const [v50, v51] of Object["entries"](RH_ERROR_MSG_MAP)) {
      if (v49["includes"](v50) && RH_ERROR_CODE_MAP[v51]) {
        const v52 = RH_ERROR_CODE_MAP[v51];
        return new ApiError({
          type: v52["type"],
          provider: "runninghub",
          code: v51,
          message: appendRunningHubFailureDetails(v52["message"], v48),
          retryable: v52["retryable"] ?? false,
        });
      }
    }
    return ApiError["taskFailed"](
      "runninghub",
      formatRunningHubFailureMessage(v48, v49),
    );
  }
  if (v47 === "TIMEOUT") return ApiError["taskTimeout"]("runninghub");
  return null;
}
export default { parseError: parseError, parseTaskError: parseTaskError };
