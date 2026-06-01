const DEFAULT_TIMEOUT = 30000;
export function getApiBase() {
  try {
    if (typeof location !== "undefined" && location["protocol"] === "file:")
      return "http://127.0.0.1:8777";
  } catch {}
  return "";
}
export function buildApiUrl(v0) {
  const v1 = getApiBase(),
    v2 = String(v0 || "");
  if (!v2) return v1 || "";
  if (!v2["startsWith"]("/")) return v1 + "/" + v2;
  return "" + v1 + v2;
}
export function fetchWithTimeout(v3, v4 = {}, v5 = DEFAULT_TIMEOUT) {
  const v6 = new AbortController(),
    v7 = setTimeout(() => v6["abort"](), v5);
  return fetch(v3, { ...v4, signal: v6["signal"] })["finally"](() =>
    clearTimeout(v7),
  );
}
export function fetchWithTimeoutWithSignal(
  v8,
  v9 = {},
  v10 = DEFAULT_TIMEOUT,
  v11,
) {
  const v12 = new AbortController(),
    v13 = setTimeout(() => v12["abort"](), v10);
  let v14 = null;
  if (v11) {
    if (v11["aborted"]) v12["abort"]();
    else
      ((v14 = () => v12["abort"]()),
        v11["addEventListener"]("abort", v14, { once: true }));
  }
  return fetch(v8, { ...v9, signal: v12["signal"] })["finally"](() => {
    clearTimeout(v13);
    if (v11 && v14) v11["removeEventListener"]("abort", v14);
  });
}
async function parseErrorBody(v15) {
  try {
    const v16 = await v15["text"](),
      v17 = JSON["parse"](v16);
    return (
      v17["error"] ||
      v17["message"] ||
      v17["data"]?.["error"] ||
      v17["data"]?.["message"] ||
      v16
    );
  } catch {
    return await v15["text"]()["catch"](() => "HTTP\x20" + v15["status"]);
  }
}
export async function request(v18, v19 = {}, v20 = DEFAULT_TIMEOUT) {
  const v21 = v18["startsWith"]("http") ? v18 : buildApiUrl(v18);
  try {
    const v22 = await fetchWithTimeout(v21, v19, v20);
    if (v22["status"] === 404)
      return { success: true, data: null, status: 404 };
    if (!v22["ok"]) {
      const v23 = await parseErrorBody(v22);
      return {
        success: false,
        error:
          "请求失败:\x20HTTP\x20" +
          v22["status"] +
          (v23 ? "\x20—\x20" + v23 : ""),
        status: v22["status"],
      };
    }
    const v24 = v22["headers"]["get"]("content-type") || "";
    let v25;
    if (v24["includes"]("application/json")) v25 = await v22["json"]();
    else {
      const v26 = await v22["text"]();
      try {
        v25 = JSON["parse"](v26);
      } catch {
        v25 = v26;
      }
    }
    return { success: true, data: v25, status: v22["status"] };
  } catch (v27) {
    if (v27["name"] === "AbortError")
      return {
        success: false,
        error: "请求超时，请检查网络连接或服务器状态",
        status: 0,
      };
    if (v27["message"]?.["includes"]("Failed to fetch"))
      return {
        success: false,
        error:
          "网络请求失败。请检查：\x0a1.\x20网络连接是否正常\x0a2.\x20本地\x20Python\x20服务器(server.py)是否已启动\x0a3.\x20浏览器是否可以访问\x20http://localhost:8777\x0a4.\x20是否有防火墙拦截了\x208777\x20端口",
        status: 0,
      };
    return {
      success: false,
      error: v27["message"] || "未知网络错误",
      status: 0,
    };
  }
}
export function get(v28, v29) {
  return request(v28, { method: "GET" }, v29);
}
export function post(v30, v31, v32) {
  const v33 = { method: "POST", headers: {} };
  if (v31 !== undefined) {
    if (
      v31 instanceof FormData ||
      v31 instanceof Blob ||
      v31 instanceof ArrayBuffer
    )
      v33["body"] = v31;
    else
      typeof v31 === "object"
        ? ((v33["headers"]["Content-Type"] = "application/json"),
          (v33["body"] = JSON["stringify"](v31)))
        : (v33["body"] = v31);
  }
  return request(v30, v33, v32);
}
export function del(v34, v35) {
  return request(v34, { method: "DELETE" }, v35);
}
