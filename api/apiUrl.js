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
