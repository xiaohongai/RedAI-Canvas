import { buildApiUrl } from "./apiUrl.js";
import { ApiError } from "./errors/ApiError.js";
import { parseError, parseNetworkError } from "./errors/ErrorParser.js";
import { logDiagnosticEvent } from "../src/services/diagnosticsService.js";
const DEFAULT_TIMEOUT = 30000;
function isAbsoluteUrl(v0) {
  return /^https?:\/\//i["test"](v0);
}
function getRuntimeDeviceId() {
  return String(
    globalThis["window"]?.["__aicDeviceId"] ||
      globalThis["__aicDeviceId"] ||
      "",
  )["trim"]();
}
function shouldAttachDeviceIdHeader(v1, v2, v3) {
  if (
    String(v2 || "")
      ["trim"]()
      ["toLowerCase"]() === "local"
  )
    return true;
  if (v3 === false) return false;
  return !isAbsoluteUrl(String(v1 || ""));
}
function withDeviceIdHeader(v4, v5, v6, v7) {
  const v8 = getRuntimeDeviceId();
  if (!v8 || !shouldAttachDeviceIdHeader(v5, v6, v7)) return v4 || {};
  const v9 = "X-AIC-Device-Id";
  if (typeof Headers !== "undefined" && v4 instanceof Headers) {
    const v10 = new Headers(v4);
    if (!v10["has"](v9)) v10["set"](v9, v8);
    return v10;
  }
  const v11 = { ...(v4 || {}) },
    v12 = Object["keys"](v11)["some"](
      (v13) => String(v13 || "")["toLowerCase"]() === v9["toLowerCase"](),
    );
  if (!v12) v11[v9] = v8;
  return v11;
}
function sleep(v14) {
  return new Promise((v15) => setTimeout(v15, v14));
}
function fetchWithTimeout(v16, v17 = {}, v18 = DEFAULT_TIMEOUT) {
  const v19 = new AbortController(),
    v20 = setTimeout(() => v19["abort"](), v18);
  return fetch(v16, { ...v17, signal: v19["signal"] })["finally"](() =>
    clearTimeout(v20),
  );
}
function fetchWithTimeoutWithSignal(v21, v22 = {}, v23 = DEFAULT_TIMEOUT, v24) {
  const v25 = new AbortController(),
    v26 = setTimeout(() => v25["abort"](), v23);
  let v27 = null;
  if (v24) {
    if (v24["aborted"]) v25["abort"]();
    else
      ((v27 = () => v25["abort"]()),
        v24["addEventListener"]("abort", v27, { once: true }));
  }
  return fetch(v21, { ...v22, signal: v25["signal"] })["finally"](() => {
    clearTimeout(v26);
    if (v24 && v27) v24["removeEventListener"]("abort", v27);
  });
}
function shouldRetryError(v28, v29, v30, v31) {
  if (v31?.["aborted"]) return false;
  return !!v28?.["retryable"] && v29 < v30;
}
function safeUrlForDiagnostics(v32) {
  const v33 = String(v32 || "");
  try {
    const v34 = new URL(v33, "http://local.invalid");
    if (v33["startsWith"]("/") || v33["startsWith"]("http://local.invalid"))
      return v34["pathname"];
    return "" + v34["origin"] + v34["pathname"];
  } catch {
    return v33["split"](/[?#]/, 1)[0] || "";
  }
}
function reportRequestFailure({
  fullUrl: v35,
  method: v36,
  provider: v37,
  apiErr: v38,
  attempt: v39,
  retries: v40,
}) {
  void logDiagnosticEvent({
    type: "api.request_failed",
    level: "warn",
    source: "renderer",
    message: v38?.["message"] || "API request failed",
    context: {
      method: v36,
      url: safeUrlForDiagnostics(v35),
      provider: v37,
      status: v38?.["status"] || v38?.["statusCode"] || 0,
      errorType: v38?.["type"] || v38?.["name"] || "",
      retryable: Boolean(v38?.["retryable"]),
      attempts: v39 + 1,
      retries: v40,
    },
    stack: v38?.["stack"] || "",
  });
}
async function parseResponseBody(v41, v42) {
  if (v42 === "blob") return await v41["blob"]();
  if (v42 === "text") return await v41["text"]();
  if (v42 === "auto") {
    const v43 = v41["headers"]["get"]("content-type") || "";
    if (v43["includes"]("application/json")) return await v41["json"]();
    const v44 = await v41["text"]();
    try {
      return JSON["parse"](v44);
    } catch {
      return v44;
    }
  }
  return await v41["json"]();
}
async function parseErrorBody(v45) {
  try {
    const v46 = await v45["text"]();
    try {
      const v47 = JSON["parse"](v46);
      return v47;
    } catch {
      return { error: v46 || "HTTP\x20" + v45["status"] };
    }
  } catch {
    return { error: "HTTP " + v45["status"] };
  }
}
export async function requester(v48) {
  const {
    url: v49,
    method: method = "GET",
    headers: headers = {},
    body: v50,
    timeout: timeout = DEFAULT_TIMEOUT,
    signal: v51,
    retries: retries = 0,
    retryDelay: retryDelay = 600,
    responseType: responseType = "auto",
    allow404Null: allow404Null = false,
    provider: provider = "unknown",
    errorParser: v52,
    buildUrl: buildUrl = true,
    returnMeta: returnMeta = false,
  } = v48 || {};
  let v53 = v49 || "";
  buildUrl && !isAbsoluteUrl(v53) && (v53 = buildApiUrl(v53));
  const v54 = withDeviceIdHeader(headers, v49, provider, buildUrl),
    v55 = v51 ? fetchWithTimeoutWithSignal : fetchWithTimeout;
  let v56 = 0;
  while (true) {
    try {
      const v57 = await v55(
        v53,
        { method: method, headers: v54, body: v50 },
        timeout,
        v51,
      );
      if (v57["status"] === 404 && allow404Null)
        return returnMeta
          ? { data: null, status: 404, headers: v57["headers"] }
          : null;
      if (!v57["ok"]) {
        const v58 = await parseErrorBody(v57),
          v59 =
            typeof v52 === "function"
              ? v52(provider, v58, v57["status"])
              : parseError(provider, v58, v57["status"]);
        if (v59 && shouldRetryError(v59, v56, retries, v51)) {
          (v56++, await sleep(retryDelay * v56));
          continue;
        }
        reportRequestFailure({
          fullUrl: v53,
          method: method,
          provider: provider,
          apiErr: v59,
          attempt: v56,
          retries: retries,
        });
        throw v59 || ApiError["fromHttpStatus"](v57["status"], provider);
      }
      const v60 = await parseResponseBody(v57, responseType);
      return returnMeta
        ? { data: v60, status: v57["status"], headers: v57["headers"] }
        : v60;
    } catch (v61) {
      const v62 =
        v61 instanceof ApiError
          ? v61
          : parseNetworkError(provider, v61, timeout);
      if (shouldRetryError(v62, v56, retries, v51)) {
        (v56++, await sleep(retryDelay * v56));
        continue;
      }
      reportRequestFailure({
        fullUrl: v53,
        method: method,
        provider: provider,
        apiErr: v62,
        attempt: v56,
        retries: retries,
      });
      throw v62;
    }
  }
}
export function get(v63, v64 = {}) {
  return requester({ url: v63, method: "GET", ...v64 });
}
export function del(v65, v66 = {}) {
  return requester({ url: v65, method: "DELETE", ...v66 });
}
export function post(v67, v68, v69 = {}) {
  const v70 = { ...(v69["headers"] || {}) };
  let v71 = v68;
  return (
    v68 !== undefined &&
      !(v68 instanceof FormData) &&
      !(v68 instanceof Blob) &&
      !(v68 instanceof ArrayBuffer) &&
      ((v70["Content-Type"] = v70["Content-Type"] || "application/json"),
      (v71 = typeof v68 === "string" ? v68 : JSON["stringify"](v68))),
    requester({ url: v67, method: "POST", headers: v70, body: v71, ...v69 })
  );
}
export function put(v72, v73, v74 = {}) {
  const v75 = { ...(v74["headers"] || {}) };
  let v76 = v73;
  if (
    v73 !== undefined &&
    !(v73 instanceof FormData) &&
    !(v73 instanceof Blob) &&
    !(v73 instanceof ArrayBuffer)
  ) {
    v75["Content-Type"] = v75["Content-Type"] || "application/json";
    v76 = typeof v73 === "string" ? v73 : JSON.stringify(v73);
  }
  return requester({ url: v72, method: "PUT", headers: v75, body: v76, ...v74 });
}
