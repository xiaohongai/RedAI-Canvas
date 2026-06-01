import {
  buildGenerationCollectionResultPatch,
  firstNonEmptyString,
  normalizeGenerationResultItems,
} from "../../core/generationResultRenderer.js";
import { buildImageNodeStorageFields } from "../../services/imageDerivativeService.js";
function asObject(v0) {
  return v0 && typeof v0 === "object" && !Array["isArray"](v0) ? v0 : null;
}
function firstString(...v1) {
  return firstNonEmptyString(...v1);
}
function normalizeLegacyResultItems(v2) {
  return normalizeGenerationResultItems(v2, {
    collectionField: "images",
    singleItemFields: ["sourceUrl", "imageUrl", "thumbUrl", "localPath"],
  });
}
function normalizeImageResultItem(v3) {
  const v4 = asObject(v3);
  if (!v4) throw new Error("[imageGenerationResult] item must be an object");
  const v5 = firstString(v4["error"]),
    v6 = firstString(
      v4["url"],
      v4["imageUrl"],
      v4["sourceUrl"],
      v4["thumbUrl"],
    ),
    v7 = {
      ...v4,
      outputType: "image",
      url: v6,
      sourceUrl: firstString(v4["sourceUrl"], v4["url"], v4["imageUrl"]),
      imageUrl: firstString(v4["imageUrl"], v4["url"], v4["sourceUrl"]),
      thumbUrl: firstString(
        v4["thumbUrl"],
        v4["imageUrl"],
        v4["url"],
        v4["sourceUrl"],
      ),
      localPath: firstString(v4["localPath"]),
      metadata:
        v4["metadata"] && typeof v4["metadata"] === "object"
          ? { ...v4["metadata"] }
          : {},
      ...buildImageNodeStorageFields(v4),
    };
  if (v5) v7["error"] = v5;
  return v7;
}
function removeMediaFieldPatch(v8) {
  if (!v8 || typeof v8 !== "object") return v8;
  for (const v9 of [
    "imageUrl",
    "sourceUrl",
    "thumbUrl",
    "sourceId",
    "thumbId",
    "localPath",
    "originalLocalPath",
    "displayLocalPath",
    "thumbLocalPath",
    "originalWidth",
    "originalHeight",
  ]) {
    delete v8[v9];
  }
  return v8;
}
export function normalizeImageGenerationResult(v10) {
  const v11 = normalizeLegacyResultItems(v10);
  if (v11["length"] === 0) return { outputType: "image", items: [] };
  return {
    outputType: "image",
    items: v11["map"]((v12) => normalizeImageResultItem(v12)),
  };
}
export function getImageGenerationResultError(v13) {
  const v14 = normalizeImageGenerationResult(v13),
    v15 = v14["items"]["find"]((v16) => v16?.["error"])?.["error"];
  return String(v15 || "")["trim"]();
}
export function getSuccessfulImageGenerationItems(v17) {
  const v18 =
    v17?.["outputType"] === "image" && Array["isArray"](v17["items"])
      ? v17
      : normalizeImageGenerationResult(v17);
  return v18["items"]["filter"]((v19) => v19 && !v19["error"]);
}
export function buildImageGenerationResultPatch(
  v20,
  { startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const v21 =
    v20?.["outputType"] === "image" && Array["isArray"](v20["items"])
      ? v20
      : normalizeImageGenerationResult(v20);
  return buildGenerationCollectionResultPatch(v21, {
    collectionField: "images",
    mainIndexField: "mainImageIndex",
    expandedField: "isImagesExpanded",
    startedAt: startedAt,
    buildFirstItemPatch: (v22) => ({
      imageUrl: v22["imageUrl"],
      sourceUrl: v22["sourceUrl"],
      thumbUrl: v22["thumbUrl"],
      sourceId: v22["sourceId"],
      thumbId: v22["thumbId"],
      ...buildImageNodeStorageFields(v22),
    }),
    duration: duration,
    extraPatch: { rhStatusMessage: null, rhStatusCode: null },
  });
}
export function buildImageGenerationFailurePatch({
  error: error = "",
  startedAt: startedAt = 0,
  duration: duration = null,
  clearMediaFields: clearMediaFields = true,
} = {}) {
  const v23 = firstString(error, "生成失败"),
    v24 = buildImageGenerationResultPatch(
      { error: v23, thumbUrl: "", imageUrl: "" },
      { startedAt: startedAt, duration: duration },
    );
  return clearMediaFields ? v24 : removeMediaFieldPatch(v24);
}
