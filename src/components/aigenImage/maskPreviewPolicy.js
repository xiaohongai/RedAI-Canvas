const TOP_LEVEL_IMAGE_FIELDS = Object["freeze"]([
    "imageUrl",
    "localPath",
    "thumbUrl",
    "thumbId",
  ]),
  IMAGE_RECORD_FIELDS = Object["freeze"]([
    "imageUrl",
    "sourceUrl",
    "localPath",
    "originalLocalPath",
    "displayLocalPath",
    "thumbLocalPath",
    "thumbUrl",
    "thumbId",
  ]);
function hasValue(v0) {
  return String(v0 || "")["trim"]()["length"] > 0;
}
function hasDisplayableImageRecord(v1) {
  if (!v1 || typeof v1 !== "object") return false;
  if (v1["error"]) return false;
  return IMAGE_RECORD_FIELDS["some"]((v2) => hasValue(v1[v2]));
}
export function hasAIGenMaskPreviewBaseImage(v3) {
  if (!v3 || typeof v3 !== "object") return false;
  const v4 = Array["isArray"](v3["images"]) ? v3["images"] : [];
  if (v4["some"]((v5) => hasDisplayableImageRecord(v5))) return true;
  return TOP_LEVEL_IMAGE_FIELDS["some"]((v6) => hasValue(v3[v6]));
}
