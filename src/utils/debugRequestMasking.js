const SECRET_KEY_NAMES = new Set([
  "apikey",
  "api_key",
  "api-key",
  "modelapikey",
  "model_api_key",
  "model-api-key",
  "cdkey",
  "cd_key",
  "cd-key",
]);
function hasSecretValue(v0) {
  return String(v0 || "")["trim"]() !== "";
}
function isPlainObject(v1) {
  if (!v1 || typeof v1 !== "object") return false;
  const v2 = Object["getPrototypeOf"](v1);
  return v2 === Object["prototype"] || v2 === null;
}
export function maskDebugSecret(v3) {
  return hasSecretValue(v3) ? "***" : "";
}
export function maskDebugAuthorization(v4) {
  const v5 = String(v4 || "")["trim"]();
  if (!v5) return "";
  if (/^Bearer$/i["test"](v5)) return "";
  return /^Bearer\s+/i["test"](v5) ? "Bearer ***" : "***";
}
export function maskDebugBearer(v6) {
  return hasSecretValue(v6) ? "Bearer\x20***" : "";
}
export function maskDebugHeaders(v7) {
  if (!v7 || typeof v7 !== "object") return v7;
  const v8 = { ...v7 };
  for (const v9 of Object["keys"](v8)) {
    const v10 = v9["toLowerCase"]();
    if (v10 === "authorization") v8[v9] = maskDebugAuthorization(v8[v9]);
    else
      (v10 === "x-api-key" || v10 === "api-key" || v10 === "cdkey") &&
        (v8[v9] = maskDebugSecret(v8[v9]));
  }
  return v8;
}
export function maskDebugPayloadSecrets(v11) {
  if (Array["isArray"](v11))
    return v11["map"]((v12) => maskDebugPayloadSecrets(v12));
  if (!isPlainObject(v11)) return v11;
  const v13 = {};
  for (const [v14, v15] of Object["entries"](v11)) {
    const v16 = v14["toLowerCase"]();
    if (SECRET_KEY_NAMES["has"](v16)) v13[v14] = maskDebugSecret(v15);
    else
      v16 === "authorization"
        ? (v13[v14] = maskDebugAuthorization(v15))
        : (v13[v14] = maskDebugPayloadSecrets(v15));
  }
  return v13;
}
