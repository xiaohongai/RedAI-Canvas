import {
  localPathToUrl,
  normalizeLocalPath,
  pickResultLocalPath,
} from "../utils/localMediaPath.js";
export function getVideoFrameSource(v0) {
  return String(
    v0?.["currentSrc"] || v0?.["src"] || v0?.["getAttribute"]?.("src") || "",
  )["trim"]();
}
export function isVideoFrameReady(v1) {
  return (
    !!getVideoFrameSource(v1) &&
    Number(v1?.["readyState"] || 0) >= 2 &&
    Number(v1?.["videoWidth"] || 0) > 0 &&
    Number(v1?.["videoHeight"] || 0) > 0
  );
}
function drawVideoFrameToCanvas(v2) {
  if (!isVideoFrameReady(v2)) throw new Error("video frame is not ready");
  const v3 = Math["max"](1, Math["trunc"](Number(v2["videoWidth"]) || 0)),
    v4 = Math["max"](1, Math["trunc"](Number(v2["videoHeight"]) || 0)),
    v5 = document["createElement"]("canvas");
  ((v5["width"] = v3), (v5["height"] = v4));
  const v6 = v5["getContext"]("2d");
  if (!v6) throw new Error("canvas\x20context\x20is\x20unavailable");
  return (
    v6["drawImage"](v2, 0, 0, v3, v4),
    { canvas: v5, width: v3, height: v4 }
  );
}
function dataUrlToBlob(v7) {
  const v8 = String(v7 || ""),
    v9 = v8["match"](/^data:([^;,]+)?(;base64)?,(.*)$/);
  if (!v9) throw new Error("invalid data url");
  const v10 = v9[1] || "application/octet-stream",
    v11 = v9[3] || "",
    v12 = v9[2] ? atob(v11) : decodeURIComponent(v11),
    v13 = new Uint8Array(v12["length"]);
  for (let v14 = 0; v14 < v12["length"]; v14 += 1) {
    v13[v14] = v12["charCodeAt"](v14);
  }
  return new Blob([v13], { type: v10 });
}
function extFromImageType(v15) {
  const v16 = String(v15 || "")["toLowerCase"]();
  if (v16["includes"]("jpeg") || v16["includes"]("jpg")) return "jpg";
  if (v16["includes"]("webp")) return "webp";
  return "png";
}
export function waitForVideoFrame(v17, { timeoutMs: timeoutMs = 2500 } = {}) {
  if (isVideoFrameReady(v17)) return Promise["resolve"](true);
  if (!getVideoFrameSource(v17)) return Promise["resolve"](false);
  return new Promise((v18) => {
    let v19 = false;
    const v20 = [
        "loadeddata",
        "canplay",
        "canplaythrough",
        "seeked",
        "timeupdate",
      ],
      v21 = (v22) => {
        if (v19) return;
        ((v19 = true), clearTimeout(v23));
        for (const v24 of v20) {
          v17["removeEventListener"]?.(v24, v25);
        }
        (v17["removeEventListener"]?.("error", v26),
          v17["removeEventListener"]?.("abort", v26),
          v18(v22 === true));
      },
      v25 = () => {
        if (isVideoFrameReady(v17)) v21(true);
      },
      v26 = () => v21(false),
      v23 = setTimeout(() => v21(isVideoFrameReady(v17)), timeoutMs);
    for (const v27 of v20) {
      v17["addEventListener"]?.(v27, v25);
    }
    (v17["addEventListener"]?.("error", v26),
      v17["addEventListener"]?.("abort", v26));
    if (Number(v17["readyState"] || 0) < 1)
      try {
        v17["load"]?.();
      } catch {}
  });
}
export function captureVideoFrameDataUrl(
  v28,
  { type: type = "image/png", quality: v29 } = {},
) {
  const { canvas: v30 } = drawVideoFrameToCanvas(v28);
  return v30["toDataURL"](type, v29);
}
export async function captureVideoFrameBlob(
  v31,
  { type: type = "image/png", quality: v32 } = {},
) {
  const { canvas: v33 } = drawVideoFrameToCanvas(v31);
  if (typeof v33["toBlob"] === "function") {
    const v34 = await new Promise((v35) => {
      v33["toBlob"](v35, type, v32);
    });
    if (!v34) throw new Error("video frame blob export failed");
    return v34;
  }
  return dataUrlToBlob(v33["toDataURL"](type, v32));
}
export async function captureVideoFrameSnapshot(
  v36,
  {
    type: type = "image/png",
    quality: v37,
    fileNamePrefix: fileNamePrefix = "video_frame",
  } = {},
) {
  const v38 = Math["max"](1, Math["trunc"](Number(v36?.["videoWidth"]) || 0)),
    v39 = Math["max"](1, Math["trunc"](Number(v36?.["videoHeight"]) || 0)),
    v40 = extFromImageType(type),
    v41 = fileNamePrefix + "_" + Date["now"]() + "." + v40,
    v42 = await captureVideoFrameBlob(v36, { type: type, quality: v37 });
  return {
    blob: v42,
    width: v38,
    height: v39,
    originalWidth: v38,
    originalHeight: v39,
    type: v42["type"] || type,
    ext: v40,
    fileName: v41,
  };
}
export async function saveVideoFrameSnapshot(v43, v44) {
  if (typeof v44 !== "function") throw new Error("saveOutputBlob is required");
  if (!v43?.["blob"]) throw new Error("video frame snapshot is required");
  const v45 = String(v43["type"] || v43["blob"]["type"] || "image/png"),
    v46 = String(v43["ext"] || extFromImageType(v45)),
    v47 = String(v43["fileName"] || "video_frame_" + Date["now"]() + "." + v46),
    v48 = Math["max"](
      1,
      Math["trunc"](Number(v43["width"] || v43["originalWidth"]) || 0),
    ),
    v49 = Math["max"](
      1,
      Math["trunc"](Number(v43["height"] || v43["originalHeight"]) || 0),
    ),
    v50 =
      typeof File === "function"
        ? new File([v43["blob"]], v47, { type: v45 })
        : v43["blob"],
    v51 = await v44(v50, { ext: v46 }),
    v52 = pickResultLocalPath(v51),
    v53 = String(v51?.["url"] || "")["trim"]() || localPathToUrl(v52);
  if (!v53 || !v52)
    throw new Error("saved video frame did not return a local image path");
  const v54 = normalizeLocalPath(v51?.["originalLocalPath"] || v52),
    v55 = normalizeLocalPath(v51?.["displayLocalPath"]),
    v56 = normalizeLocalPath(v51?.["thumbLocalPath"]);
  return {
    src: v53,
    localPath: v52,
    originalLocalPath: v54,
    displayLocalPath: v55,
    thumbLocalPath: v56,
    originalWidth: Number(v51?.["originalWidth"] || v48) || v48,
    originalHeight: Number(v51?.["originalHeight"] || v49) || v49,
    fileName: v51?.["filename"] || v47,
  };
}
export async function saveVideoFrameCapture(
  v57,
  v58,
  {
    type: type = "image/png",
    quality: v59,
    fileNamePrefix: fileNamePrefix = "video_frame",
  } = {},
) {
  const v60 = await captureVideoFrameSnapshot(v57, {
    type: type,
    quality: v59,
    fileNamePrefix: fileNamePrefix,
  });
  return saveVideoFrameSnapshot(v60, v58);
}
