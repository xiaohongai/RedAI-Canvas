const SAFE_LOCAL_PATH_PREFIXES = Object["freeze"]([
    "data/uploads/",
    "data/assets/",
    "output/",
  ]),
  BLOCKED_SCHEME_RE = /^(?:blob|data|file|javascript):/i,
  HTTP_SCHEME_RE = /^https?:/i,
  ANY_SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i,
  WINDOWS_ABSOLUTE_RE = /^[a-zA-Z]:\//;
function normalizeText(v0) {
  return String(v0 || "")["trim"]();
}
function safeDecode(v1) {
  try {
    return decodeURIComponent(v1);
  } catch {
    return v1;
  }
}
function isLocalHttpUrl(v2) {
  const v3 = String(v2?.["hostname"] || "")["toLowerCase"]();
  if (!v3) return false;
  if (
    v3 === "localhost" ||
    v3 === "127.0.0.1" ||
    v3 === "0.0.0.0" ||
    v3 === "::1" ||
    v3 === "[::1]"
  )
    return true;
  const v4 = normalizeText(globalThis["location"]?.["origin"]);
  return !!v4 && v2["origin"] === v4;
}
function extractPathCandidate(v5) {
  if (!v5 || typeof v5 !== "object" || Array["isArray"](v5)) return v5;
  const v6 =
      v5["result"] && typeof v5["result"] === "object" ? v5["result"] : null,
    v7 = v5["video"] && typeof v5["video"] === "object" ? v5["video"] : null,
    v8 = v5["audio"] && typeof v5["audio"] === "object" ? v5["audio"] : null;
  return (
    v5["localPath"] ??
    v5["path"] ??
    v5["url"] ??
    v5["posterLocalPath"] ??
    v5["coverLocalPath"] ??
    v5["thumbLocalPath"] ??
    v5["displayLocalPath"] ??
    v5["originalLocalPath"] ??
    v5["waveformLocalPath"] ??
    v7?.["localPath"] ??
    v7?.["path"] ??
    v7?.["url"] ??
    v8?.["localPath"] ??
    v8?.["path"] ??
    v8?.["url"] ??
    v6?.["localPath"] ??
    v6?.["path"] ??
    v6?.["url"] ??
    v6?.["posterLocalPath"] ??
    v6?.["coverLocalPath"] ??
    v6?.["thumbLocalPath"] ??
    v6?.["displayLocalPath"] ??
    v6?.["originalLocalPath"] ??
    v6?.["waveformLocalPath"] ??
    ""
  );
}
function hasSafeLocalPathPrefix(v9) {
  const v10 = normalizeText(v9)["replace"](/\\/g, "/");
  return SAFE_LOCAL_PATH_PREFIXES["some"]((v11) => v10["startsWith"](v11));
}
export function isSafeVirtualLocalPath(v12) {
  const v13 = normalizeText(v12)["replace"](/\\/g, "/");
  if (!v13 || BLOCKED_SCHEME_RE["test"](v13) || HTTP_SCHEME_RE["test"](v13))
    return false;
  if (
    ANY_SCHEME_RE["test"](v13) ||
    WINDOWS_ABSOLUTE_RE["test"](v13) ||
    v13["startsWith"]("//")
  )
    return false;
  const v14 = safeDecode(v13["split"](/[?#]/, 1)[0])["replace"](/^\/+/, ""),
    v15 = v14["split"]("/")["filter"](Boolean);
  if (v15["some"]((v16) => v16 === "." || v16 === "..")) return false;
  return hasSafeLocalPathPrefix(v15["join"]("/"));
}
export function normalizeLocalPath(v17) {
  const v18 = extractPathCandidate(v17),
    v19 = normalizeText(v18);
  if (!v19 || BLOCKED_SCHEME_RE["test"](v19)) return "";
  if (HTTP_SCHEME_RE["test"](v19)) return urlToLocalPath(v19);
  if (ANY_SCHEME_RE["test"](v19)) return "";
  let v20 = v19["replace"](/\\/g, "/");
  if (WINDOWS_ABSOLUTE_RE["test"](v20) || v20["startsWith"]("//")) return "";
  v20 = safeDecode(v20["split"](/[?#]/, 1)[0])["replace"](/^\/+/, "");
  const v21 = [];
  for (const v22 of v20["split"]("/")) {
    const v23 = v22["trim"]();
    if (!v23 || v23 === ".") continue;
    if (v23 === "..") return "";
    v21["push"](v23);
  }
  const v24 = v21["join"]("/");
  return hasSafeLocalPathPrefix(v24) ? v24 : "";
}
export function localPathToUrl(v25) {
  const v26 = normalizeLocalPath(v25);
  return v26 ? "/" + v26 : "";
}
export function urlToLocalPath(v27) {
  const v28 = normalizeText(v27);
  if (!v28 || BLOCKED_SCHEME_RE["test"](v28)) return "";
  if (HTTP_SCHEME_RE["test"](v28))
    try {
      const v29 = new URL(v28);
      if (!isLocalHttpUrl(v29)) return "";
      return normalizeLocalPath(v29["pathname"]);
    } catch {
      return "";
    }
  return normalizeLocalPath(v28);
}
export function pickResultLocalPath(v30) {
  return normalizeLocalPath(v30);
}
