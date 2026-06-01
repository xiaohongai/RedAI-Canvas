import * as PpioErrorParser from "./parsers/PpioErrorParser.js";
import * as ApimartErrorParser from "./parsers/ApimartErrorParser.js";
import * as RunningHubErrorParser from "./parsers/RunningHubErrorParser.js";
import * as RunningHubModelErrorParser from "./parsers/RunningHubModelErrorParser.js";
import * as GrsaiErrorParser from "./parsers/GrsaiErrorParser.js";
import { ApiError, ErrorType } from "./ApiError.js";
const PARSERS = {
  ppio: PpioErrorParser,
  apimart: ApimartErrorParser,
  runninghub: RunningHubModelErrorParser,
  runninghubwf: RunningHubErrorParser,
  grsai: GrsaiErrorParser,
  "ppio/gemini": PpioErrorParser,
  "runninghub-model": RunningHubModelErrorParser,
};
function getParser(v0) {
  if (!v0) return null;
  const v1 = v0["toLowerCase"]()["trim"]();
  return PARSERS[v1] || null;
}
export function parseError(v2, v3, v4) {
  const v5 = getParser(v2);
  if (v5?.["parseError"]) {
    const v6 = v5["parseError"](v3, v4);
    if (v6) return v6;
  }
  return parseGenericError(v2, v3, v4);
}
export function parseTaskError(v7, v8) {
  const v9 = getParser(v7);
  if (v9?.["parseTaskError"]) return v9["parseTaskError"](v8);
  if (v8) {
    const v10 = (v8["status"] || "")["toLowerCase"]();
    if (v10 === "failed" || v10 === "error") {
      const v11 =
        v8["error"] || v8["errorMessage"] || v8["message"] || "未知错误";
      return ApiError["taskFailed"](v7, v11);
    }
  }
  return null;
}
export function parseNetworkError(v12, v13, v14) {
  const v15 = v13?.["message"] || "";
  if (
    v13?.["name"] === "AbortError" ||
    v15["includes"]("timeout") ||
    v15["includes"]("TIMEOUT")
  )
    return ApiError["timeout"](v12, v14);
  if (
    v15["includes"]("DNS") ||
    v15["includes"]("ENOTFOUND") ||
    v15["includes"]("getaddrinfo")
  )
    return new ApiError({
      type: ErrorType["DNS_ERROR"],
      provider: v12,
      message: "无法解析服务器地址，请检查网络配置",
      raw: v13,
      retryable: true,
    });
  if (
    v15["includes"]("Failed to fetch") ||
    v15["includes"]("NETWORK") ||
    v15["includes"]("ECONNREFUSED") ||
    v15["includes"]("ECONNRESET")
  )
    return new ApiError({
      type: ErrorType["NETWORK_ERROR"],
      provider: v12,
      message: "网络连接失败，请检查网络或代理设置",
      raw: v13,
      retryable: true,
    });
  return ApiError["networkError"](v12, v13);
}
function parseGenericError(v16, v17, v18) {
  let v19 = "",
    v20 = v18;
  if (typeof v17 === "string") v19 = v17;
  else
    v17 &&
      typeof v17 === "object" &&
      ((v19 =
        v17["error"] ||
        v17["message"] ||
        v17["errorMessage"] ||
        v17["error_message"] ||
        v17["error"]?.["message"] ||
        JSON["stringify"](v17)),
      (v20 = v17["code"] || v17["errorCode"] || v17["error_code"] || v18));
  const v21 = String(v19)["toUpperCase"]();
  if (
    v21["includes"]("BALANCE") ||
    v21["includes"]("余额") ||
    v21["includes"]("QUOTA")
  )
    return ApiError["insufficientBalance"](v16, v20);
  if (v21["includes"]("RATE") || v21["includes"]("LIMIT") || v18 === 429)
    return ApiError["rateLimit"](v16, v20);
  if (v21["includes"]("AUTH") || v21["includes"]("KEY") || v18 === 401)
    return ApiError["authError"](v16, v20, v19);
  if (
    v21["includes"]("CONTENT") ||
    v21["includes"]("FILTER") ||
    v21["includes"]("SAFETY")
  )
    return ApiError["contentFiltered"](v16, v19);
  if (v18 >= 400) return ApiError["fromHttpStatus"](v18, v16, v19);
  return new ApiError({
    type: ErrorType["UNKNOWN"],
    provider: v16,
    code: v20,
    message: v19 || "未知错误",
    status: v18,
  });
}
export function parseBatchErrors(v22, v23) {
  return v23["map"]((v24, v25) => {
    if (v24["success"]) return null;
    const v26 = parseError(v22, v24["error"], v24["status"]);
    return ((v26["batchIndex"] = v25), v26);
  })["filter"](Boolean);
}
export default {
  parseError: parseError,
  parseTaskError: parseTaskError,
  parseNetworkError: parseNetworkError,
  parseBatchErrors: parseBatchErrors,
};
