import { requester } from "./requester.js";
const SUBSCRIPTION_STATUS_PATH = "/api/v2/subscription/status",
  SUBSCRIPTION_ACTIVATE_PATH = "/api/v2/subscription/activate",
  SUBSCRIPTION_CLEAR_AUTHORIZATION_PATH =
    "/api/v2/subscription/authorization/clear";
function buildDeviceIdHeaders(v0) {
  const v1 = String(v0 || "")["trim"]();
  return v1 ? { "X-AIC-Device-Id": v1 } : {};
}
export async function fetchSubscriptionStatus(v2, v3 = "") {
  const v4 = String(v2 || "")["trim"](),
    v5 = v4 ? "?installId=" + encodeURIComponent(v4) : "";
  return await requester({
    url: "" + SUBSCRIPTION_STATUS_PATH + v5,
    method: "GET",
    provider: "local",
    timeout: 15000,
    headers: buildDeviceIdHeaders(v3),
  });
}
export async function activateCdkey(v6) {
  const v7 = String(v6?.["installId"] || "")["trim"](),
    v8 = String(v6?.["cdkey"] || "")["trim"](),
    v9 = String(v6?.["deviceId"] || "")["trim"]();
  return await requester({
    url: SUBSCRIPTION_ACTIVATE_PATH,
    method: "POST",
    provider: "local",
    timeout: 20000,
    headers: {
      "Content-Type": "application/json",
      ...buildDeviceIdHeaders(v9),
    },
    body: JSON["stringify"]({
      installId: v7,
      cdkey: v8,
      ...(v9 ? { deviceId: v9 } : {}),
    }),
  });
}
export async function clearSubscriptionAuthorization(v10 = {}) {
  const v11 = String(v10?.["installId"] || "")["trim"](),
    v12 = String(v10?.["deviceId"] || "")["trim"]();
  return await requester({
    url: SUBSCRIPTION_CLEAR_AUTHORIZATION_PATH,
    method: "POST",
    provider: "local",
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
      ...buildDeviceIdHeaders(v12),
    },
    body: JSON["stringify"]({
      ...(v11 ? { installId: v11 } : {}),
      ...(v12 ? { deviceId: v12 } : {}),
    }),
  });
}
