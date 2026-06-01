const PROMPT_BOX_MIN_HEIGHT = 96,
  PROMPT_BOX_MAX_HEIGHT = 520;
function toNumberOrNull(v0) {
  const v1 = Number(v0);
  return Number["isFinite"](v1) ? v1 : null;
}
function clamp(v2, v3, v4) {
  return Math["min"](v4, Math["max"](v3, v2));
}
export function getPromptBoxHeightBounds() {
  return { minHeight: PROMPT_BOX_MIN_HEIGHT, maxHeight: PROMPT_BOX_MAX_HEIGHT };
}
export function normalizePromptBoxHeight(v5, v6) {
  const v7 = toNumberOrNull(v5);
  if (v7 == null) return null;
  return Math["round"](clamp(v7, v6["minHeight"], v6["maxHeight"]));
}
export function applyPromptBoxHeight(v8, v9) {
  if (!v8) return;
  if (v9 == null) v8["style"]["removeProperty"]("height");
  else v8["style"]["height"] = v9 + "px";
}
