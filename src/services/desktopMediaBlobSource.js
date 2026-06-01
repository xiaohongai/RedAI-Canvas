const DESKTOP_PREVIEW_URL_CACHE_TTL_MS = 30 * 60 * 1000,
  desktopPreviewUrlCache = new Map(),
  LOCAL_MEDIA_PATH_PREFIX_RE =
    /^(?:\/)?(?:output\/|data\/assets\/|data\/uploads\/)/i,
  LOCAL_PREVIEW_SCHEME_RE = /^aic-local-preview:/i,
  MEDIA_MIME_BY_EXT = {
    mp4: "video/mp4",
    m4v: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    aac: "audio/aac",
    ogg: "audio/ogg",
    flac: "audio/flac",
  };
function normalizeUrl(v0) {
  const v1 = String(v0 || "")["trim"]();
  if (!v1) return "";
  try {
    return new URL(v1, globalThis["location"]?.["href"] || "http://127.0.0.1/")[
      "href"
    ];
  } catch {
    return v1;
  }
}
function isDesktopRenderer() {
  return !!globalThis["window"]?.["electronAPI"];
}
function isDesktopBlobCandidate(v2) {
  return (void v2, false);
}
function isLoopbackHost(v3) {
  const v4 = String(v3 || "")["toLowerCase"]();
  return (
    v4 === "localhost" || v4 === "127.0.0.1" || v4 === "::1" || v4 === "[::1]"
  );
}
function normalizeDesktopLocalMediaPath(v5) {
  const v6 = String(v5 || "")["trim"]();
  if (
    !v6 ||
    /^(?:blob:|data:|file:)/i["test"](v6) ||
    LOCAL_PREVIEW_SCHEME_RE["test"](v6)
  )
    return "";
  let v7 = v6;
  try {
    const v8 = new URL(
        v6,
        globalThis["location"]?.["href"] || "http://127.0.0.1:8777/",
      ),
      v9 = String(globalThis["location"]?.["origin"] || ""),
      v10 =
        /^https?:$/i["test"](v8["protocol"]) &&
        ((v9 && v8["origin"] === v9) || isLoopbackHost(v8["hostname"]));
    if (!v10) return "";
    v7 = v8["pathname"];
  } catch {
    v7 = v6["split"](/[?#]/, 1)[0];
  }
  v7 = String(v7 || "")
    ["replace"](/\\/g, "/")
    ["split"](/[?#]/, 1)[0];
  try {
    v7 = decodeURIComponent(v7);
  } catch {}
  v7 = v7["replace"](/^\/+/, "");
  if (!LOCAL_MEDIA_PATH_PREFIX_RE["test"](v7)) return "";
  return "/" + v7;
}
function inferMediaMimeType(v11) {
  const v12 = String(v11 || "")
    ["split"](/[?#]/, 1)[0]
    ["match"](/\.([a-z0-9]+)$/i);
  if (!v12) return "";
  return MEDIA_MIME_BY_EXT[String(v12[1] || "")["toLowerCase"]()] || "";
}
function readPreviewCache(v13) {
  const v14 = desktopPreviewUrlCache["get"](v13);
  if (!v14) return "";
  if (Number(v14["expiresAt"] || 0) <= Date["now"]())
    return (desktopPreviewUrlCache["delete"](v13), "");
  return String(v14["url"] || "");
}
function writePreviewCache(v15, v16) {
  if (!v15 || !v16) return;
  desktopPreviewUrlCache["set"](v15, {
    url: v16,
    expiresAt: Date["now"]() + DESKTOP_PREVIEW_URL_CACHE_TTL_MS,
  });
}
function getMediaElementSource(v17) {
  return String(
    v17?.["getAttribute"]?.("src") || v17?.["currentSrc"] || v17?.["src"] || "",
  )["trim"]();
}
export function getMediaElementCurrentSource(v18) {
  return getMediaElementSource(v18);
}
export function getMediaElementPlaybackSourceKey(v19) {
  const v20 = getMediaElementSource(v19);
  if (!v20) return "";
  const v21 = String(v19?.["dataset"]?.["desktopMediaSourceUrl"] || "")[
    "trim"
  ]();
  if (v21) return v21;
  return v20;
}
export function normalizeMediaPlaybackSourceUrl(v22) {
  return normalizeUrl(v22);
}
export function isMediaElementPlaybackSource(v23, v24) {
  const v25 = getMediaElementPlaybackSourceKey(v23),
    v26 = normalizeUrl(v24);
  return !!v25 && !!v26 && normalizeUrl(v25) === v26;
}
export function clearDesktopMediaPlaybackSourceMetadata(v27) {
  if (!v27?.["dataset"]) return;
  delete v27["dataset"]["desktopMediaSourceUrl"];
}
function assignMediaElementSource(v28, v29, v30 = "auto", v31 = {}) {
  if (!v28 || !v29) return "";
  const v32 = normalizeUrl(v31["originalSourceUrl"] || v29),
    v33 = normalizeUrl(v29),
    v34 = getMediaElementSource(v28),
    v35 = String(v28?.["dataset"]?.["desktopMediaSourceUrl"] || "")["trim"]();
  if (v34 && (normalizeUrl(v34) === v33 || (v35 && normalizeUrl(v35) === v32)))
    return v34;
  v28["preload"] = v30 || v28["preload"] || "auto";
  v28["dataset"] &&
    (v32 && v33 !== v32
      ? (v28["dataset"]["desktopMediaSourceUrl"] = v32)
      : delete v28["dataset"]["desktopMediaSourceUrl"]);
  typeof v28["setAttribute"] === "function"
    ? v28["setAttribute"]("src", v29)
    : (v28["src"] = v29);
  if (v31["load"] !== false)
    try {
      v28["load"]?.();
    } catch {}
  return v29;
}
export async function resolveDesktopMediaPlaybackUrl(v36) {
  const v37 = normalizeUrl(v36);
  if (!isDesktopRenderer()) return v37;
  const v38 = normalizeDesktopLocalMediaPath(v37 || v36);
  if (!v38) return v37;
  const v39 = readPreviewCache(v38);
  if (v39) return v39;
  const v40 = globalThis["window"]?.["electronAPI"];
  if (typeof v40?.["getLocalPreviewUrl"] !== "function") return v37;
  try {
    const v41 = await v40["getLocalPreviewUrl"]({
        localPath: v38,
        type: inferMediaMimeType(v38),
      }),
      v42 = String(v41?.["url"] || v41 || "")["trim"]();
    if (v42) return (writePreviewCache(v38, v42), v42);
  } catch {}
  return v37;
}
export async function attachDesktopMediaPlaybackSource(v43, v44, v45 = {}) {
  if (!v43) return "";
  const v46 = normalizeUrl(v44),
    v47 = isDesktopRenderer() ? await resolveDesktopMediaPlaybackUrl(v44) : v44;
  return assignMediaElementSource(v43, v47, v45["preload"] || v43["preload"], {
    originalSourceUrl: v46,
    load: v45["load"],
  });
}
export async function attachMediaElementPlaybackSource(v48, v49, v50 = {}) {
  if (!v48) return "";
  const v51 = normalizeUrl(v49);
  if (!v51) return "";
  const v52 = isDesktopRenderer()
    ? await resolveDesktopMediaPlaybackUrl(v49)
    : v49;
  return assignMediaElementSource(v48, v52, v50["preload"] || v48["preload"], {
    originalSourceUrl: v51,
    load: v50["load"],
  });
}
export const __desktopMediaBlobSourceForTest = {
  clearBlobCacheForTest() {
    desktopPreviewUrlCache["clear"]();
  },
  isDesktopBlobCandidate: isDesktopBlobCandidate,
  normalizeDesktopLocalMediaPath: normalizeDesktopLocalMediaPath,
  normalizeUrl: normalizeUrl,
  resolveDesktopMediaPlaybackUrl: resolveDesktopMediaPlaybackUrl,
};
