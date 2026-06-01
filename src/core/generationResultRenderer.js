import {
  buildGenerationFailurePatch,
  buildGenerationSuccessPatch,
} from "./generationTaskLifecycle.js";
function asObject(v0) {
  return v0 && typeof v0 === "object" && !Array["isArray"](v0) ? v0 : null;
}
export function firstNonEmptyString(...v1) {
  for (const v2 of v1) {
    const v3 = String(v2 || "")["trim"]();
    if (v3) return v3;
  }
  return "";
}
export function normalizeGenerationResultItems(
  v4,
  {
    collectionField: collectionField = "",
    singleItemFields: singleItemFields = [],
  } = {},
) {
  if (v4?.["outputType"] && Array["isArray"](v4["items"])) return v4["items"];
  if (collectionField && Array["isArray"](v4?.[collectionField]))
    return v4[collectionField];
  if (Array["isArray"](v4)) return v4;
  const v5 = asObject(v4);
  if (!v5) return [];
  if (firstNonEmptyString(v5["error"])) return [v5];
  for (const v6 of singleItemFields) {
    if (firstNonEmptyString(v5[v6])) return [v5];
  }
  return [];
}
export function getFirstGenerationResultError(
  v7,
  {
    collectionField: collectionField = "",
    singleItemFields: singleItemFields = [],
  } = {},
) {
  const v8 = normalizeGenerationResultItems(v7, {
      collectionField: collectionField,
      singleItemFields: singleItemFields,
    }),
    v9 = v8["find"]((v10) => firstNonEmptyString(v10?.["error"]));
  return firstNonEmptyString(v9?.["error"]);
}
export function buildGenerationCollectionResultPatch(
  v11,
  {
    collectionField: v12,
    mainIndexField: v13,
    expandedField: expandedField = "",
    startedAt: startedAt = 0,
    duration: duration = null,
    normalizeItem: normalizeItem = (v14) => v14,
    buildFirstItemPatch: buildFirstItemPatch = () => ({}),
    extraPatch: extraPatch = {},
    singleItemFields: singleItemFields = [],
  } = {},
) {
  if (!v12 || !v13)
    throw new Error(
      "[generationResultRenderer]\x20collection\x20and\x20main\x20index\x20fields\x20are\x20required",
    );
  const v15 = normalizeGenerationResultItems(v11, {
      collectionField: v12,
      singleItemFields: singleItemFields,
    }),
    v16 = v15["map"]((v17) => normalizeItem(v17));
  if (v16["length"] === 0) return null;
  const v18 = v16[0] || {},
    v19 = firstNonEmptyString(v18["error"]),
    v20 = v19
      ? buildGenerationFailurePatch({
          error: v19,
          startedAt: startedAt,
          duration: duration,
        })
      : buildGenerationSuccessPatch({
          startedAt: startedAt,
          duration: duration,
        }),
    v21 = typeof extraPatch === "function" ? extraPatch(v18, v16) : extraPatch;
  return {
    [v12]: v16,
    [v13]: 0,
    ...(expandedField ? { [expandedField]: false } : {}),
    ...v20,
    ...buildFirstItemPatch(v18, v16),
    ...(v21 && typeof v21 === "object" ? v21 : {}),
  };
}
export function buildGenerationSingleResultPatch(
  v22,
  {
    collectionField: collectionField = "",
    startedAt: startedAt = 0,
    duration: duration = null,
    normalizeItem: normalizeItem = (v23) => v23,
    buildItemPatch: buildItemPatch = () => ({}),
    extraPatch: extraPatch = {},
    singleItemFields: singleItemFields = [],
  } = {},
) {
  const v24 = normalizeGenerationResultItems(v22, {
    collectionField: collectionField,
    singleItemFields: singleItemFields,
  });
  if (v24["length"] === 0) return null;
  const v25 = normalizeItem(v24[0]),
    v26 = firstNonEmptyString(v25?.["error"]),
    v27 = v26
      ? buildGenerationFailurePatch({
          error: v26,
          startedAt: startedAt,
          duration: duration,
        })
      : buildGenerationSuccessPatch({
          startedAt: startedAt,
          duration: duration,
        }),
    v28 = typeof extraPatch === "function" ? extraPatch(v25) : extraPatch;
  return {
    ...v27,
    ...buildItemPatch(v25),
    ...(v28 && typeof v28 === "object" ? v28 : {}),
  };
}
