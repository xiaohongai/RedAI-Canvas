function isPlainObject(v0) {
  return v0 && typeof v0 === "object" && !Array["isArray"](v0);
}
export function isInlineImageDataUrl(v1) {
  return String(v1 || "")
    ["trim"]()
    ["startsWith"]("data:image/");
}
export function isBlobObjectUrl(v2) {
  return String(v2 || "")
    ["trim"]()
    ["startsWith"]("blob:");
}
export function isVolatileMediaUrl(v3) {
  return isBlobObjectUrl(v3);
}
function hasMeaningfulValue(v4) {
  return String(v4 || "")["trim"]()["length"] > 0;
}
function isStableUrlFallbackValue(v5) {
  const v6 = String(v5 || "")["trim"]();
  if (!v6) return false;
  if (isInlineImageDataUrl(v6)) return false;
  if (isBlobObjectUrl(v6)) return false;
  return true;
}
const INLINE_THUMBNAIL_FIELDS = Object["freeze"]([
    "thumbUrl",
    "thumbSrc",
    "firstFrameThumbUrl",
  ]),
  THUMBNAIL_FALLBACK_FIELDS = Object["freeze"]([
    "localPath",
    "src",
    "imageUrl",
    "sourceUrl",
    "videoUrl",
    "audioUrl",
    "firstFrameUrl",
    "thumbUrl",
    "firstFrameThumbUrl",
    "thumbId",
    "sourceId",
  ]),
  VOLATILE_MEDIA_URL_FIELDS = Object["freeze"]([
    "thumbUrl",
    "thumbSrc",
    "firstFrameThumbUrl",
    "imageUrl",
    "videoUrl",
    "audioUrl",
    "src",
  ]),
  CAPTURE_TRANSIENT_FIELDS = Object["freeze"]([
    "capturePreviewUrl",
    "captureSavePending",
    "captureSaveError",
  ]);
export function hasStableThumbnailFallback(v7) {
  if (!v7 || typeof v7 !== "object") return false;
  return THUMBNAIL_FALLBACK_FIELDS["some"]((v8) => {
    const v9 = v7[v8];
    if (!hasMeaningfulValue(v9)) return false;
    if (
      (v8 === "thumbUrl" || v8 === "firstFrameThumbUrl") &&
      (isInlineImageDataUrl(v9) || isBlobObjectUrl(v9))
    )
      return false;
    if (
      v8 === "src" ||
      v8 === "imageUrl" ||
      v8 === "sourceUrl" ||
      v8 === "videoUrl" ||
      v8 === "audioUrl" ||
      v8 === "firstFrameUrl"
    )
      return isStableUrlFallbackValue(v9);
    return true;
  });
}
function sanitizeInlineThumbnailFieldsInPlace(v10) {
  if (!v10 || typeof v10 !== "object") return;
  if (!hasStableThumbnailFallback(v10)) return;
  for (const v11 of INLINE_THUMBNAIL_FIELDS) {
    isInlineImageDataUrl(v10[v11]) && delete v10[v11];
  }
}
function sanitizeVolatileMediaUrlFieldsInPlace(v12) {
  if (!v12 || typeof v12 !== "object") return;
  if (!hasStableThumbnailFallback(v12)) return;
  for (const v13 of VOLATILE_MEDIA_URL_FIELDS) {
    isVolatileMediaUrl(v12[v13]) && delete v12[v13];
  }
}
function sanitizeRecordForPersistence(v14) {
  if (Array["isArray"](v14))
    return v14["map"]((v15) => sanitizeRecordForPersistence(v15));
  if (!isPlainObject(v14)) return v14;
  const v16 = { ...v14 };
  (sanitizeInlineThumbnailFieldsInPlace(v16),
    sanitizeVolatileMediaUrlFieldsInPlace(v16));
  Array["isArray"](v16["nodes"]) &&
    (v16["nodes"] = v16["nodes"]["map"]((v17) =>
      sanitizeNodeForPersistence(v17),
    ));
  Array["isArray"](v16["items"]) &&
    (v16["items"] = v16["items"]["map"]((v18) =>
      sanitizeRecordForPersistence(v18),
    ));
  Array["isArray"](v16["edges"]) &&
    (v16["edges"] = v16["edges"]["map"]((v19) =>
      isPlainObject(v19) ? { ...v19 } : v19,
    ));
  isPlainObject(v16["nodeData"]) &&
    (v16["nodeData"] = sanitizeNodeForPersistence(v16["nodeData"]));
  for (const [v20, v21] of Object["entries"](v16)) {
    if (
      v20 === "nodes" ||
      v20 === "items" ||
      v20 === "edges" ||
      v20 === "nodeData"
    )
      continue;
    if (Array["isArray"](v21)) {
      v16[v20] = v21["map"]((v22) => sanitizeRecordForPersistence(v22));
      continue;
    }
    isPlainObject(v21) && (v16[v20] = sanitizeRecordForPersistence(v21));
  }
  return v16;
}
export function sanitizeNodeForPersistence(v23) {
  if (!isPlainObject(v23)) return v23;
  const v24 = { ...v23 };
  (sanitizeInlineThumbnailFieldsInPlace(v24),
    sanitizeVolatileMediaUrlFieldsInPlace(v24),
    delete v24["dreaminaTaskLastRaw"]);
  const v25 = hasStableThumbnailFallback(v24);
  for (const v26 of CAPTURE_TRANSIENT_FIELDS) {
    if (v26 === "capturePreviewUrl") {
      const v27 = v24[v26];
      (v25 || isBlobObjectUrl(v27) || !isInlineImageDataUrl(v27)) &&
        delete v24[v26];
      continue;
    }
    delete v24[v26];
  }
  return (
    Array["isArray"](v24["images"]) &&
      (v24["images"] = v24["images"]["map"]((v28) =>
        sanitizeRecordForPersistence(v28),
      )),
    Array["isArray"](v24["videos"]) &&
      (v24["videos"] = v24["videos"]["map"]((v29) =>
        sanitizeRecordForPersistence(v29),
      )),
    Array["isArray"](v24["cells"]) &&
      (v24["cells"] = v24["cells"]["map"]((v30) =>
        sanitizeRecordForPersistence(v30),
      )),
    v24
  );
}
export function sanitizeSerializedCanvasData(v31) {
  if (!isPlainObject(v31)) return v31;
  const v32 = { ...v31 };
  delete v32["_persistRevHint"];
  if (Array["isArray"](v32["nodes"]))
    v32["nodes"] = v32["nodes"]["map"]((v33) =>
      sanitizeNodeForPersistence(v33),
    );
  else {
    if (isPlainObject(v32["nodes"])) {
      const v34 = {};
      for (const [v35, v36] of Object["entries"](v32["nodes"])) {
        v34[v35] = sanitizeNodeForPersistence(v36);
      }
      v32["nodes"] = v34;
    }
  }
  return (
    Array["isArray"](v32["assets"]) &&
      (v32["assets"] = v32["assets"]["map"]((v37) =>
        sanitizeRecordForPersistence(v37),
      )),
    v32
  );
}
export function sanitizeMultiCanvasDataForPersistence(v38) {
  if (!isPlainObject(v38)) return v38;
  const v39 = { ...v38 };
  if (!Array["isArray"](v39["canvases"])) return v39;
  return (
    (v39["canvases"] = v39["canvases"]["map"]((v40) => {
      if (!isPlainObject(v40)) return v40;
      return sanitizeSerializedCanvasData(v40);
    })),
    v39
  );
}
