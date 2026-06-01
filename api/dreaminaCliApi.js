import { buildApiUrl, get, post } from "./apiBase.js";
export async function fetchDreaminaCliStatusFromServer(v0 = {}) {
  const v1 = v0?.["refresh"] ? "?refresh=1" : "",
    v2 = await get("/api/v2/dreamina/status" + v1);
  if (!v2["success"])
    throw new Error(v2["error"] || "获取\x20Dreamina\x20CLI\x20状态失败");
  return v2["data"] || {};
}
export async function fetchDreaminaCliLoginRuntimeFromServer() {
  const v3 = await get("/api/v2/dreamina/login/runtime");
  if (!v3["success"])
    throw new Error(v3["error"] || "获取 Dreamina 登录运行态失败");
  return v3["data"] || {};
}
export async function startDreaminaHeadlessLoginFromServer() {
  const v4 = await post("/api/v2/dreamina/login", { mode: "headless" });
  if (!v4["success"])
    throw new Error(v4["error"] || "发起 Dreamina headless 登录失败");
  return v4["data"] || {};
}
export async function startDreaminaHeadlessReloginFromServer() {
  const v5 = await post("/api/v2/dreamina/relogin", { mode: "headless" });
  if (!v5["success"])
    throw new Error(
      v5["error"] || "发起\x20Dreamina\x20headless\x20重新登录失败",
    );
  return v5["data"] || {};
}
export async function startDreaminaWebLoginFromServer(v6 = {}) {
  const v7 = await post("/api/v2/dreamina/login/web", {
    mode: "web",
    force: !!v6?.["force"],
  });
  if (!v7["success"])
    throw new Error(v7["error"] || "发起 Dreamina OAuth 登录失败");
  return v7["data"] || {};
}
export async function importDreaminaLoginResponseFromServer(v8) {
  const v9 = await post("/api/v2/dreamina/login/import", { loginResponse: v8 });
  if (!v9["success"])
    throw new Error(v9["error"] || "导入 Dreamina 登录态失败");
  return v9["data"] || {};
}
export async function logoutDreaminaFromServer() {
  const v10 = await post("/api/v2/dreamina/logout", {});
  if (!v10["success"])
    throw new Error(v10["error"] || "退出 Dreamina 登录失败");
  return v10["data"] || {};
}
export function buildDreaminaQrImageUrl(v11 = 0) {
  const v12 = v11 ? "?v=" + encodeURIComponent(String(v11)) : "";
  return buildApiUrl("/api/v2/dreamina/login/qr" + v12);
}
