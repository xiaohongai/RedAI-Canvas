import { fetchRemoteBlob } from "../../api/projectsV2Api.js";
import {
  convertImageBlobToPngBlob,
  convertImageUrlToPngBlob,
  inferImageMimeTypeFromUrl,
  isBlobLike,
  resolveImageMimeType,
} from "./imagePngConversionService.js";
import { saveOutputBlob } from "./projectService.js";
import {
  localPathToUrl,
  normalizeLocalPath as normalizeLocalPathImpl,
} from "../utils/localMediaPath.js";
function normalizeMediaUrl(v0) {
  const v1 = String(v0 || "")["trim"]();
  if (!v1) return "";
  if (/^(https?:|blob:|data:)/i["test"](v1)) return v1;
  return localPathToUrl(v1);
}
function normalizeLocalPath(v2) {
  return normalizeLocalPathImpl(v2);
}
function inferFileNameFromPath(v3) {
  const v4 = String(v3 || "")["trim"]();
  if (!v4) return "";
  const v5 = v4["split"]("#")[0]["split"]("?")[0],
    v6 = v5["split"](/[\\/]/)["filter"](Boolean);
  return v6[v6["length"] - 1] || "";
}
function stripKnownImageExtension(v7) {
  return String(v7 || "")["replace"](
    /\.(png|jpg|jpeg|webp|gif|bmp|avif|svg)$/i,
    "",
  );
}
function ensurePngFileName(v8) {
  const v9 =
    stripKnownImageExtension(String(v8 || "")["trim"]()) || "panorama_input";
  return v9 + ".png";
}
function isPngMimeType(v10) {
  return (
    String(v10 || "")
      ["trim"]()
      ["toLowerCase"]() === "image/png"
  );
}
function isPngLikePath(v11) {
  const v12 = String(v11 || "")
    ["trim"]()
    ["split"]("#")[0]
    ["split"]("?")[0]
    ["toLowerCase"]();
  return v12["endsWith"](".png");
}
function resolvePersistentPngSource(v13, v14) {
  const v15 = normalizeLocalPath(v13);
  if (v15 && isPngLikePath(v15))
    return { localPath: v15, imageUrl: normalizeMediaUrl(v15) };
  const v16 = normalizeMediaUrl(v14),
    v17 = normalizeLocalPath(v16);
  if (v17 && isPngLikePath(v17))
    return { localPath: v17, imageUrl: normalizeMediaUrl(v17) };
  return null;
}
function resolvePreferredSourceUrl(v18, v19) {
  const v20 = normalizeMediaUrl(v18);
  if (v20) return v20;
  return normalizeMediaUrl(v19);
}
function normalizeSavedPngResult(v21, v22, v23) {
  const v24 = normalizeLocalPath(
      v21?.["originalLocalPath"] || v21?.["localPath"] || v21?.["path"] || "",
    ),
    v25 = normalizeMediaUrl(v21?.["originalUrl"] || v21?.["url"] || v24);
  if (!v24 || !v25) throw new Error("PNG\x20落盘失败：未返回有效路径");
  const v26 =
    String(v21?.["filename"] || "")["trim"]() ||
    inferFileNameFromPath(v24) ||
    ensurePngFileName(v22);
  return {
    localPath: v24,
    imageUrl: v25,
    fileName: v26,
    sourceSignature: v23 || null,
  };
}
export async function ensurePersistedPanoramaInputPng({
  localPath: v27,
  imageUrl: v28,
  fileName: v29,
  sourceSignature: v30,
} = {}) {
  const v31 = normalizeLocalPath(v27),
    v32 = normalizeMediaUrl(v28),
    v33 =
      String(v29 || "")["trim"]() ||
      inferFileNameFromPath(v31) ||
      inferFileNameFromPath(v32) ||
      "panorama_input.png",
    v34 = resolvePersistentPngSource(v31, v32);
  if (v34)
    return {
      localPath: v34["localPath"],
      imageUrl: v34["imageUrl"],
      fileName:
        inferFileNameFromPath(v34["localPath"]) || ensurePngFileName(v33),
      sourceSignature: v30 || null,
    };
  const v35 = resolvePreferredSourceUrl(v31, v32);
  if (!v35) throw new Error("360 全景图缺少可用图片入参");
  let v36 = null;
  try {
    v36 = await fetchRemoteBlob(v35, { timeout: 30000 });
  } catch (v37) {
    throw new Error(
      "读取 360 全景图入参失败：" +
        String(v37?.["message"] || v37 || "未知错误"),
    );
  }
  if (!isBlobLike(v36))
    throw new Error("读取\x20360\x20全景图入参失败：返回内容为空");
  const v38 = resolveImageMimeType(v36, v35) || inferImageMimeTypeFromUrl(v35);
  let v39 = v36;
  !isPngMimeType(v38) && (v39 = await convertImageBlobToPngBlob(v36));
  !isBlobLike(v39) && (v39 = await convertImageUrlToPngBlob(v35));
  if (!isBlobLike(v39))
    throw new Error("360 全景图 PNG 归一化失败：无法转换为 PNG");
  const v40 = await saveOutputBlob(v39, {
    ext: "png",
    subDir: "panorama_input_png",
    kind: "panorama-input-png",
  });
  return normalizeSavedPngResult(v40, v33, v30);
}
