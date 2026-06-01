const PREVIEW_VIDEO_META_RE =
  /^\[(?:previewVideoUrl|preview_video_url|videoUrl)\]\s*:\s*(\S+)\s*$/im;
function firstNonEmptyString(...v0) {
  for (const v1 of v0) {
    const v2 = String(v1 || "")["trim"]();
    if (v2) return v2;
  }
  return "";
}
function normalizeReleaseNotesItem(v3) {
  if (v3 && typeof v3 === "object")
    return firstNonEmptyString(v3["note"], v3["notes"], v3["body"]);
  return String(v3 || "");
}
export function normalizeReleaseNotes(v4) {
  if (Array["isArray"](v4))
    return v4["map"](normalizeReleaseNotesItem)
      ["filter"](Boolean)
      ["join"]("\x0a");
  return String(v4 || "");
}
export function extractPreviewVideoUrlFromNotes(v5) {
  const v6 = String(v5 || "")["match"](PREVIEW_VIDEO_META_RE);
  return String(v6?.[1] || "")["trim"]();
}
export function normalizeUpdaterInfoPayload(v7, v8 = {}) {
  const v9 = v7 && typeof v7 === "object" ? v7 : {},
    v10 = normalizeReleaseNotes(v9["releaseNotes"]),
    v11 = firstNonEmptyString(
      v9["previewVideoUrl"],
      v9["preview_video_url"],
      extractPreviewVideoUrlFromNotes(v10),
    ),
    v12 = v11
      ? ""
      : firstNonEmptyString(
          v8["localPreviewVideoUrl"],
          typeof v8["readLocalPreviewVideoUrl"] === "function"
            ? v8["readLocalPreviewVideoUrl"]()
            : "",
        );
  return {
    version: String(v9["version"] || ""),
    releaseName: String(v9["releaseName"] || ""),
    releaseDate: String(v9["releaseDate"] || ""),
    releaseNotes: v10,
    previewVideoUrl: v11 || v12,
  };
}
