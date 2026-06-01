export const IMAGE_INPUT_UPLOAD_QUALITY_STORAGE_KEY =
  "v2-image-input-upload-quality";
export const IMAGE_INPUT_UPLOAD_QUALITY_MODES = Object["freeze"]({
  STANDARD: "standard",
  HIGH_FIDELITY: "high-fidelity",
  ORIGINAL_FIRST: "original-first",
});
export const DEFAULT_IMAGE_INPUT_UPLOAD_QUALITY_MODE =
  IMAGE_INPUT_UPLOAD_QUALITY_MODES["HIGH_FIDELITY"];
const VALID_IMAGE_INPUT_UPLOAD_QUALITY_MODES = new Set(
  Object["values"](IMAGE_INPUT_UPLOAD_QUALITY_MODES),
);
export function normalizeImageInputUploadQualityMode(v0) {
  const v1 = String(v0 || "")["trim"]();
  return VALID_IMAGE_INPUT_UPLOAD_QUALITY_MODES["has"](v1)
    ? v1
    : DEFAULT_IMAGE_INPUT_UPLOAD_QUALITY_MODE;
}
export function getImageInputUploadQualityMode() {
  try {
    return normalizeImageInputUploadQualityMode(
      globalThis["localStorage"]?.["getItem"](
        IMAGE_INPUT_UPLOAD_QUALITY_STORAGE_KEY,
      ),
    );
  } catch {
    return DEFAULT_IMAGE_INPUT_UPLOAD_QUALITY_MODE;
  }
}
export function setImageInputUploadQualityMode(v2) {
  const v3 = normalizeImageInputUploadQualityMode(v2);
  try {
    globalThis["localStorage"]?.["setItem"](
      IMAGE_INPUT_UPLOAD_QUALITY_STORAGE_KEY,
      v3,
    );
  } catch {}
  return v3;
}
export function getImageInputUploadQualityOptions(v4) {
  const v5 = normalizeImageInputUploadQualityMode(v4);
  if (v5 === IMAGE_INPUT_UPLOAD_QUALITY_MODES["HIGH_FIDELITY"])
    return {
      imageInputUploadQualityMode: v5,
      compress: true,
      maxDim: 4096,
      quality: 0.95,
      fallbackCompressOnError: false,
    };
  if (v5 === IMAGE_INPUT_UPLOAD_QUALITY_MODES["ORIGINAL_FIRST"])
    return {
      imageInputUploadQualityMode: v5,
      compress: false,
      maxDim: 0,
      quality: 1,
      fallbackCompressOnError: true,
      fallbackMaxDim: 2048,
      fallbackQuality: 0.9,
    };
  return {
    imageInputUploadQualityMode: IMAGE_INPUT_UPLOAD_QUALITY_MODES["STANDARD"],
    compress: true,
    maxDim: 2048,
    quality: 0.9,
    fallbackCompressOnError: false,
  };
}
export function resolveImageInputUploadQualityOptions(v6 = {}) {
  const v7 = normalizeImageInputUploadQualityMode(
    v6["imageInputUploadQualityMode"] || getImageInputUploadQualityMode(),
  );
  return {
    ...v6,
    ...getImageInputUploadQualityOptions(v7),
    applyInputQualityProfile: true,
  };
}
