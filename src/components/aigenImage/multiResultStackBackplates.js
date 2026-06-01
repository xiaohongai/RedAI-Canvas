export const MAX_MULTI_RESULT_BACKPLATES = 3;
export const MULTI_RESULT_STACK_PREVIEW_CLASS = "is-multi-result-stack";
export const MULTI_RESULT_STACK_EXPANDED_CLASS =
  "is-multi-result-stack-expanded";
export const MULTI_RESULT_STACK_WRAP_CLASS = "multi-stack-wrap";
export const MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS = "is-expanded";
export const MULTI_RESULT_BACKPLATES_CLASS = "multi-stack-backplates";
export const MULTI_RESULT_BACKPLATE_CLASS = "multi-stack-backplate";
function toFiniteCount(v0) {
  const v1 = Number(v0);
  if (!Number["isFinite"](v1) || v1 <= 0) return 0;
  return Math["floor"](v1);
}
export function getMultiResultBackplateCount(v2) {
  const v3 = toFiniteCount(v2);
  return Math["min"](Math["max"](v3 - 1, 0), MAX_MULTI_RESULT_BACKPLATES);
}
function normalizeBackplateItem(v4, v5) {
  const v6 = Number["isFinite"](Number(v4?.["imageIndex"]))
    ? Math["floor"](Number(v4["imageIndex"]))
    : v5;
  return { imageIndex: v6 };
}
export function buildMultiResultBackplateItems({
  imageCount: imageCount = 0,
  mainIndex: mainIndex = 0,
} = {}) {
  const v7 = toFiniteCount(imageCount);
  if (v7 <= 1) return [];
  const v8 =
      Number["isFinite"](Number(mainIndex)) && mainIndex >= 0 && mainIndex < v7
        ? Math["floor"](Number(mainIndex))
        : 0,
    v9 = [];
  for (let v10 = 0; v10 < v7; v10 += 1) {
    if (v10 === v8) continue;
    v9["push"]({ imageIndex: v10 });
    if (v9["length"] >= MAX_MULTI_RESULT_BACKPLATES) break;
  }
  return v9;
}
export function getMultiResultBackplateKey(v11 = []) {
  return (Array["isArray"](v11) ? v11 : [])
    ["map"]((v12, v13) => {
      const v14 = normalizeBackplateItem(v12, v13);
      return "" + v14["imageIndex"];
    })
    ["join"](",");
}
export function shouldRefreshMultiResultStackDom({
  imageCount: imageCount = 0,
  previewEl: previewEl = null,
  containerEl: containerEl = null,
  stackWrap: stackWrap = null,
  backdropWrap: backdropWrap = null,
} = {}) {
  const v15 = getMultiResultBackplateCount(imageCount);
  if (v15 <= 0) return false;
  if (!containerEl || !stackWrap || stackWrap["parentNode"] !== containerEl)
    return true;
  if (!backdropWrap || backdropWrap["parentNode"] !== stackWrap) return true;
  if ((Number(backdropWrap["children"]?.["length"]) || 0) !== v15) return true;
  return !previewEl?.["classList"]?.["contains"](
    MULTI_RESULT_STACK_PREVIEW_CLASS,
  );
}
export function createMultiResultBackplates(v16, v17, v18 = {}) {
  if (!v16?.["createElement"]) return null;
  const v19 = Array["isArray"](v18["items"]) ? v18["items"] : null,
    v20 = v19
      ? v19["slice"](0, MAX_MULTI_RESULT_BACKPLATES)["map"]((v21, v22) =>
          normalizeBackplateItem(v21, v22),
        )
      : Array["from"](
          { length: getMultiResultBackplateCount(v17) },
          (v23, v24) => normalizeBackplateItem({}, v24 + 1),
        );
  if (v20["length"] <= 0) return null;
  const v25 = v16["createElement"]("div");
  ((v25["className"] = MULTI_RESULT_BACKPLATES_CLASS),
    v25["setAttribute"]("aria-hidden", "true"));
  for (let v26 = 0; v26 < v20["length"]; v26 += 1) {
    const v27 = v20[v26],
      v28 = v16["createElement"]("div");
    ((v28["className"] = MULTI_RESULT_BACKPLATE_CLASS),
      (v28["dataset"]["stackIndex"] = String(v26 + 1)),
      (v28["dataset"]["imageIndex"] = String(v27["imageIndex"])),
      v25["appendChild"](v28));
  }
  return v25;
}
export function syncMultiResultStackClasses({
  previewEl: previewEl = null,
  stackWrap: stackWrap = null,
  isActive: isActive = false,
  isExpanded: isExpanded = false,
} = {}) {
  const v29 = !!isActive,
    v30 = v29 && !!isExpanded;
  (previewEl?.["classList"]?.["toggle"](MULTI_RESULT_STACK_PREVIEW_CLASS, v29),
    previewEl?.["classList"]?.["toggle"](
      MULTI_RESULT_STACK_EXPANDED_CLASS,
      v30,
    ),
    stackWrap?.["classList"]?.["toggle"](
      MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS,
      v30,
    ));
}
export function clearMultiResultStackClasses({
  previewEl: previewEl = null,
  stackWrap: stackWrap = null,
} = {}) {
  (previewEl?.["classList"]?.["remove"](
    MULTI_RESULT_STACK_PREVIEW_CLASS,
    MULTI_RESULT_STACK_EXPANDED_CLASS,
  ),
    stackWrap?.["classList"]?.["remove"](
      MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS,
    ));
}
