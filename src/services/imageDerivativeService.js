import { localPathToUrl, normalizeLocalPath } from "../utils/localMediaPath.js";
function firstNonEmptyString(...v0) {
  for (const v1 of v0) {
    const v2 = normalizeLocalPath(v1);
    if (v2) return v2;
  }
  return "";
}
function toPositiveInt(v3) {
  const v4 = Number(v3);
  if (!Number["isFinite"](v4) || v4 <= 0) return 0;
  return Math["max"](1, Math["round"](v4));
}
export function toLocalPathUrl(v5) {
  return localPathToUrl(v5);
}
export function normalizeImageDerivativeFields(v6 = {}) {
  const v7 = firstNonEmptyString(v6?.["localPath"]),
    v8 = firstNonEmptyString(v6?.["originalLocalPath"], v7),
    v9 = firstNonEmptyString(v6?.["displayLocalPath"]),
    v10 = firstNonEmptyString(v6?.["thumbLocalPath"]),
    v11 = toPositiveInt(v6?.["originalWidth"]),
    v12 = toPositiveInt(v6?.["originalHeight"]);
  return {
    localPath: v7,
    originalLocalPath: v8,
    displayLocalPath: v9,
    thumbLocalPath: v10,
    originalWidth: v11,
    originalHeight: v12,
  };
}
export function hasImageDerivativeFields(v13 = {}) {
  return Boolean(
    firstNonEmptyString(
      v13?.["originalLocalPath"],
      v13?.["displayLocalPath"],
      v13?.["thumbLocalPath"],
    ) ||
    toPositiveInt(v13?.["originalWidth"]) ||
    toPositiveInt(v13?.["originalHeight"]),
  );
}
export function buildImageNodeStorageFields(v14 = {}) {
  const v15 = normalizeImageDerivativeFields(v14),
    v16 = {
      localPath: v15["localPath"] || v15["originalLocalPath"] || "",
      originalLocalPath: v15["originalLocalPath"] || "",
      displayLocalPath: v15["displayLocalPath"] || "",
      thumbLocalPath: v15["thumbLocalPath"] || "",
    };
  return (
    v15["originalWidth"] > 0 && (v16["originalWidth"] = v15["originalWidth"]),
    v15["originalHeight"] > 0 &&
      (v16["originalHeight"] = v15["originalHeight"]),
    v16
  );
}
export function pickCanvasImageLocalPath(v17 = {}) {
  const v18 = normalizeImageDerivativeFields(v17);
  return firstNonEmptyString(
    v18["displayLocalPath"],
    v18["originalLocalPath"],
    v18["localPath"],
    v18["thumbLocalPath"],
  );
}
export function pickCanvasThumbLocalPath(v19 = {}) {
  const v20 = normalizeImageDerivativeFields(v19);
  return firstNonEmptyString(
    v20["thumbLocalPath"],
    v20["displayLocalPath"],
    v20["originalLocalPath"],
    v20["localPath"],
  );
}
export function pickPreviewImageLocalPath(v21 = {}) {
  const v22 = normalizeImageDerivativeFields(v21);
  return firstNonEmptyString(v22["originalLocalPath"], v22["localPath"]);
}
export function pickPreviewFallbackLocalPath(v23 = {}) {
  const v24 = normalizeImageDerivativeFields(v23);
  return firstNonEmptyString(v24["displayLocalPath"], v24["thumbLocalPath"]);
}
