const HOST_PORT_RE = /^[^:/?#\s]+:\d+(?:[/?#]|$)/,
  EXPLICIT_PROTOCOL_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
export function normalizeWebPreviewUrl(v0) {
  const v1 = String(v0 || "")["trim"]();
  if (!v1) return "";
  const v2 = !EXPLICIT_PROTOCOL_RE["test"](v1) || HOST_PORT_RE["test"](v1),
    v3 = v2 ? "https://" + v1 : v1;
  try {
    const v4 = new URL(v3);
    if (v4["protocol"] !== "http:" && v4["protocol"] !== "https:") return "";
    return ((v4["username"] = ""), (v4["password"] = ""), v4["toString"]());
  } catch {
    return "";
  }
}
export function isAllowedWebPreviewUrl(v5) {
  return Boolean(normalizeWebPreviewUrl(v5));
}
