function isBlobLike(v0) {
  return !!v0 && typeof v0["arrayBuffer"] === "function";
}
function normalizeImageMimeType(v1) {
  const v2 = String(v1 || "")
    ["split"](";")[0]
    ["trim"]()
    ["toLowerCase"]();
  if (!v2["startsWith"]("image/")) return "";
  return v2;
}
function inferImageMimeTypeFromUrl(v3) {
  const v4 = String(v3 || "")["trim"]();
  if (!v4) return "";
  const v5 = v4["match"](/^data:([^;,]+)/i),
    v6 = normalizeImageMimeType(v5?.[1] || "");
  if (v6) return v6;
  const v7 = v4["toLowerCase"]()["split"]("#")[0]["split"]("?")[0];
  if (v7["endsWith"](".png")) return "image/png";
  if (v7["endsWith"](".jpg") || v7["endsWith"](".jpeg")) return "image/jpeg";
  if (v7["endsWith"](".webp")) return "image/webp";
  if (v7["endsWith"](".gif")) return "image/gif";
  if (v7["endsWith"](".bmp")) return "image/bmp";
  if (v7["endsWith"](".avif")) return "image/avif";
  if (v7["endsWith"](".svg")) return "image/svg+xml";
  return "";
}
function resolveImageMimeType(v8, v9) {
  return normalizeImageMimeType(v8?.["type"]) || inferImageMimeTypeFromUrl(v9);
}
function hasDomCanvasRuntime() {
  return (
    typeof document !== "undefined" &&
    typeof document["createElement"] === "function" &&
    typeof globalThis?.["Image"] === "function"
  );
}
function loadImage(v10) {
  return new Promise((v11, v12) => {
    const v13 = globalThis?.["Image"];
    if (typeof v13 !== "function") {
      v12(new Error("image-not-supported"));
      return;
    }
    const v14 = new v13();
    ("crossOrigin" in v14 && (v14["crossOrigin"] = "anonymous"),
      (v14["onload"] = () => v11(v14)),
      (v14["onerror"] = () => v12(new Error("image-load-failed"))),
      (v14["src"] = v10));
  });
}
function canvasToBlob(v15, v16 = "image/png") {
  return new Promise((v17) => {
    if (!v15 || typeof v15["toBlob"] !== "function") {
      v17(null);
      return;
    }
    v15["toBlob"]((v18) => v17(v18), v16);
  });
}
async function renderImageElementToPngBlob(v19) {
  if (!hasDomCanvasRuntime()) return null;
  const v20 = Number(v19?.["naturalWidth"] || v19?.["width"] || 0),
    v21 = Number(v19?.["naturalHeight"] || v19?.["height"] || 0);
  if (!v20 || !v21) return null;
  const v22 = document["createElement"]("canvas");
  ((v22["width"] = v20), (v22["height"] = v21));
  const v23 = v22["getContext"]("2d");
  if (!v23) return null;
  return (v23["drawImage"](v19, 0, 0), canvasToBlob(v22, "image/png"));
}
async function convertImageBlobToPngBlob(v24) {
  if (!isBlobLike(v24)) return null;
  const v25 = globalThis?.["createImageBitmap"],
    v26 = globalThis?.["OffscreenCanvas"];
  if (typeof v25 === "function" && typeof v26 === "function") {
    let v27 = null;
    try {
      v27 = await v25(v24);
      const v28 = Number(v27?.["width"] || 0),
        v29 = Number(v27?.["height"] || 0);
      if (!v28 || !v29) return null;
      const v30 = new v26(v28, v29),
        v31 = v30["getContext"]("2d");
      if (!v31) return null;
      v31["drawImage"](v27, 0, 0);
      if (typeof v30["convertToBlob"] === "function")
        return await v30["convertToBlob"]({ type: "image/png" });
    } catch {
    } finally {
      v27?.["close"]?.();
    }
  }
  if (!hasDomCanvasRuntime()) return null;
  const v32 = globalThis?.["URL"];
  if (typeof v32?.["createObjectURL"] !== "function") return null;
  const v33 = v32["createObjectURL"](v24);
  try {
    const v34 = await loadImage(v33);
    return await renderImageElementToPngBlob(v34);
  } catch {
    return null;
  } finally {
    v32["revokeObjectURL"]?.(v33);
  }
}
async function convertImageUrlToPngBlob(v35) {
  if (!hasDomCanvasRuntime()) return null;
  try {
    const v36 = await loadImage(v35);
    return await renderImageElementToPngBlob(v36);
  } catch {
    return null;
  }
}
export {
  convertImageBlobToPngBlob,
  convertImageUrlToPngBlob,
  inferImageMimeTypeFromUrl,
  isBlobLike,
  normalizeImageMimeType,
  resolveImageMimeType,
};
