const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);
export function normalizeExternalUrl(v0) {
  try {
    const v1 = new URL(String(v0 || "")["trim"]());
    if (!ALLOWED_EXTERNAL_PROTOCOLS["has"](v1["protocol"])) return "";
    return ((v1["username"] = ""), (v1["password"] = ""), v1["toString"]());
  } catch {
    return "";
  }
}
export function isExternalUrlAllowed(v2) {
  return Boolean(normalizeExternalUrl(v2));
}
export function formatExternalUrlForLog(v3) {
  const v4 = normalizeExternalUrl(v3);
  if (!v4) return "";
  try {
    const v5 = new URL(v4);
    return "" + v5["origin"] + v5["pathname"];
  } catch {
    return "";
  }
}
