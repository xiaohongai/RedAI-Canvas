import { post as post } from "./requester.js";
const DEFAULT_APIMART_BASE_URL = "https://api.apimart.ai",
  APIMART_UPLOAD_CDN_HOSTS = Object["freeze"]([
    "cdn.apimart.ai",
    "upload.apimart.ai",
  ]);
export function normalizeApimartBaseUrl(v0) {
  return String(v0 || DEFAULT_APIMART_BASE_URL)
    ["trim"]()
    ["replace"](/\/+$/, "")
    ["replace"](/\/v1$/i, "");
}
function getBlobType(v1, v2) {
  return String(v1?.["type"] || v2 || "application/octet-stream")["trim"]();
}
function extensionFromContentType(v3, v4) {
  const v5 = String(v3 || "")["toLowerCase"](),
    v6 = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/bmp": "bmp",
      "video/mp4": "mp4",
      "video/quicktime": "mov",
      "video/webm": "webm",
      "audio/mpeg": "mp3",
      "audio/mp3": "mp3",
      "audio/wav": "wav",
      "audio/x-wav": "wav",
      "audio/mp4": "m4a",
      "audio/aac": "aac",
      "audio/ogg": "ogg",
      "audio/flac": "flac",
      "audio/webm": "webm",
    };
  return v6[v5] || String(v4 || "")["replace"](/^\./, "") || "bin";
}
function isApimartUploadUrl(v7) {
  try {
    const v8 = new URL(String(v7 || ""));
    return APIMART_UPLOAD_CDN_HOSTS["includes"](
      v8["hostname"]["toLowerCase"](),
    );
  } catch {
    return false;
  }
}
export function isApimartAssetUrl(v9) {
  return /^asset:\/\//i["test"](String(v9 || "")["trim"]());
}
export function isApimartReusableUrl(v10) {
  return isApimartAssetUrl(v10) || isApimartUploadUrl(v10);
}
export async function uploadBlobToApimart(v11, v12 = {}) {
  if (!v11) throw new Error("APIMART 上传文件不能为空");
  const v13 = String(v12["apiKey"] || "")
    ["trim"]()
    ["replace"](/^Bearer\s+/i, "");
  if (!v13) throw new Error("APIMART API Key 未配置，无法上传素材");
  const v14 = getBlobType(v11, v12["contentType"]),
    v15 = extensionFromContentType(v14, v12["fileExtension"]),
    v16 = new FormData();
  (v16["append"]("file", v11, v12["filename"] || "upload." + v15),
    v16["append"]("contentType", v14),
    v16["append"]("fileExtension", v15),
    v16["append"]("permanent", v12["permanent"] === true ? "1" : "0"),
    v16["append"]("apiKey", v13),
    v16["append"]("apiUrl", normalizeApimartBaseUrl(v12["apiUrl"])));
  const v17 = await post("/api/v2/proxy/apimart-upload", v16, {
      provider: "apimart",
      timeout: v12["uploadTimeout"] || 5 * 60 * 1000,
    }),
    v18 = v17?.["cdnUrl"] || v17?.["url"] || "";
  if (!v18) throw new Error("APIMART\x20上传返回\x20URL\x20为空");
  return String(v18)["trim"]();
}
export async function uploadImageToApimart(v19, v20 = {}) {
  return await uploadBlobToApimart(v19, {
    ...v20,
    contentType: v20["contentType"] || getBlobType(v19, "image/jpeg"),
    fileExtension: v20["fileExtension"] || "jpg",
  });
}
export async function uploadVideoToApimart(v21, v22 = {}) {
  return await uploadBlobToApimart(v21, {
    ...v22,
    contentType: v22["contentType"] || getBlobType(v21, "video/mp4"),
    fileExtension: v22["fileExtension"] || "mp4",
  });
}
export function isApimartUploadedUrl(v23) {
  return isApimartUploadUrl(v23);
}
