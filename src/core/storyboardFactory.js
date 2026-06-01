import {
  detachStoryboardCellSourceContext,
  isStoryboardCellEmpty,
  resolveStoryboardCellSourceIndex,
} from "./storyboardCellUtils.js";
const STORYBOARD_STANDARD_ASPECTS = Object["freeze"]([
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "1:1", value: 1 },
]);
function _trimString(v0) {
  return typeof v0 === "string" ? v0["trim"]() : "";
}
function _asPositiveNumber(v1) {
  const v2 = Number(v1);
  return Number["isFinite"](v2) && v2 > 0 ? v2 : 0;
}
function _getSafeGridCount(v3) {
  return Math["max"](1, Math["round"](_asPositiveNumber(v3)) || 0);
}
function _normalizeLocalPath(v4) {
  const v5 = _trimString(v4);
  if (!v5) return "";
  return v5["startsWith"]("/") ? v5 : "/" + v5;
}
function _findStoryboardSourceContext(v6 = []) {
  if (!Array["isArray"](v6)) return {};
  for (const v7 of v6) {
    if (!v7 || typeof v7 !== "object") continue;
    const v8 = _trimString(v7["sourceLocalPath"]),
      v9 = _trimString(v7["sourceUrl"]);
    if (!v8 && !v9) continue;
    return {
      storyboardSourceLocalPath: v8 || null,
      storyboardSourceUrl: v8 ? "" : v9,
      storyboardSourceWidth: v7["sourceWidth"] || null,
      storyboardSourceHeight: v7["sourceHeight"] || null,
    };
  }
  return {};
}
function _normalizeStoryboardPieceCell(v10, v11) {
  if (!v10 || typeof v10 !== "object") return v10;
  if (isStoryboardCellEmpty(v10)) return { ...v10 };
  return {
    ...detachStoryboardCellSourceContext(v10, {
      locked: true,
      extracted: v10["storyboardExtractedCell"] === true,
    }),
    storyboardPiece: true,
    storyboardSourceIndex: resolveStoryboardCellSourceIndex(v10, v11),
    isEmpty: false,
  };
}
function _parseAspectLabel(v12) {
  const v13 = String(v12 || "")
      ["trim"]()
      ["match"](/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/),
    v14 = _asPositiveNumber(v13?.[1]),
    v15 = _asPositiveNumber(v13?.[2]);
  if (v14 > 0 && v15 > 0) return { width: v14, height: v15 };
  return { width: 1, height: 1 };
}
export function resolveNearestStoryboardAspect(v16, v17) {
  const v18 = _asPositiveNumber(v16),
    v19 = _asPositiveNumber(v17);
  if (!(v18 > 0 && v19 > 0)) return "1:1";
  const v20 = v18 / v19;
  let v21 = STORYBOARD_STANDARD_ASPECTS[0],
    v22 = Math["abs"](v20 - v21["value"]);
  for (let v23 = 1; v23 < STORYBOARD_STANDARD_ASPECTS["length"]; v23++) {
    const v24 = STORYBOARD_STANDARD_ASPECTS[v23],
      v25 = Math["abs"](v20 - v24["value"]);
    v25 < v22 && ((v22 = v25), (v21 = v24));
  }
  return v21["label"];
}
export function resolveStoryboardSourceImageRef(v26) {
  if (!v26 || typeof v26 !== "object") return "";
  const v27 =
    _trimString(v26["sourceUrl"]) ||
    _trimString(v26["imageUrl"]) ||
    _trimString(v26["src"]);
  if (v27) return v27;
  return _normalizeLocalPath(v26["localPath"]);
}
export function buildQuickCreateStoryboardCells({
  cols: v28,
  rows: v29,
  imageRef: v30,
}) {
  const v31 = _getSafeGridCount(v28) * _getSafeGridCount(v29),
    v32 = _trimString(v30);
  return Array["from"]({ length: v31 }, (v33, v34) => {
    if (v34 === 0 && v32) return { url: v32 };
    return { url: "", isEmpty: true };
  });
}
export function computeQuickCreateStoryboardSize({
  sourceWidth: v35,
  sourceHeight: v36,
  baseShortSide: v37,
}) {
  const v38 = _asPositiveNumber(v35),
    v39 = _asPositiveNumber(v36),
    v40 = Math["max"](1, Math["round"](_asPositiveNumber(v37) || 1));
  if (!(v38 > 0 && v39 > 0)) return { width: v40, height: v40 };
  const v41 = v38 / v39;
  if (v41 >= 1) return { width: Math["round"](v40 * v41), height: v40 };
  return { width: v40, height: Math["round"](v40 / v41) };
}
export function computePreparedStoryboardSize({
  aspectLabel: v42,
  cols: v43,
  rows: v44,
  sourceWidth: v45,
  sourceHeight: v46,
  minCellShortSide: minCellShortSide = 300,
}) {
  const { width: v47, height: v48 } = _parseAspectLabel(v42),
    v49 = _getSafeGridCount(v43),
    v50 = _getSafeGridCount(v44),
    v51 = _asPositiveNumber(v45) / _asPositiveNumber(v46),
    v52 = Number["isFinite"](v51) && v51 > 0 ? v51 * (v50 / v49) : v47 / v48,
    v53 = Math["max"](
      1,
      Math["round"](_asPositiveNumber(minCellShortSide) || 300),
    );
  let v54 = v53,
    v55 = v53;
  return (
    v52 >= 1
      ? ((v55 = v53), (v54 = v55 * v52))
      : ((v54 = v53), (v55 = v54 / v52)),
    { width: Math["round"](v54 * v49), height: Math["round"](v55 * v50) }
  );
}
export function buildStoryboardNodePayload({
  id: v56,
  name: v57,
  x: v58,
  y: v59,
  cols: v60,
  rows: v61,
  width: v62,
  height: v63,
  aspectRatio: v64,
  cells: v65,
  isEditing: isEditing = false,
  storyboardSourceLocalPath: v66,
  storyboardSourceUrl: v67,
  storyboardSourceWidth: v68,
  storyboardSourceHeight: v69,
}) {
  const v70 = {
    ..._findStoryboardSourceContext(v65),
    ...Object["fromEntries"](
      Object["entries"]({
        storyboardSourceLocalPath: v66 || undefined,
        storyboardSourceUrl: v67 || undefined,
        storyboardSourceWidth: v68 || undefined,
        storyboardSourceHeight: v69 || undefined,
      })["filter"](([, v71]) => v71 !== undefined),
    ),
  };
  return {
    id: v56,
    type: "storyboard",
    name: v57,
    x: v58,
    y: v59,
    width: v62,
    height: v63,
    cells: Array["isArray"](v65)
      ? v65["map"]((v72, v73) => _normalizeStoryboardPieceCell(v72, v73))
      : [],
    cols: v60,
    rows: v61,
    aspectRatio: v64,
    isEditing: isEditing,
    ...v70,
  };
}
