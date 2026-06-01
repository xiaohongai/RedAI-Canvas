export const PROMPT_PRESET_USER_INPUT_PLACEHOLDER = "{用户输入}";
export const PROMPT_PRESET_TEMPLATE_TYPE_STATIC = "static";
export const PROMPT_PRESET_TEMPLATE_TYPE_CONDITIONAL_BY_IMAGE_INPUT =
  "conditionalByImageInput";
const PROMPT_PRESET_USER_INPUT_PATTERN =
  /\{\{?\s*用户输入(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g;
function isPlainTemplateObject(v0) {
  return v0 !== null && typeof v0 === "object" && !Array["isArray"](v0);
}
function resolveContextFlag(v1, v2) {
  const v3 = v1?.[v2];
  return typeof v3 === "function" ? !!v3() : v3 === true;
}
export function isConditionalPromptPresetTemplate(v4 = null) {
  return (
    isPlainTemplateObject(v4) &&
    v4["type"] === PROMPT_PRESET_TEMPLATE_TYPE_CONDITIONAL_BY_IMAGE_INPUT
  );
}
export function isStaticPromptPresetTemplate(v5 = null) {
  return (
    isPlainTemplateObject(v5) &&
    v5["type"] === PROMPT_PRESET_TEMPLATE_TYPE_STATIC
  );
}
export function isObjectPromptPresetTemplate(v6 = null) {
  return (
    isStaticPromptPresetTemplate(v6) || isConditionalPromptPresetTemplate(v6)
  );
}
export function requiresPromptPresetInput(v7 = null) {
  if (isConditionalPromptPresetTemplate(v7)) return true;
  if (isStaticPromptPresetTemplate(v7)) return v7["requireInput"] === true;
  return false;
}
export function hasPromptPresetTemplateContent(v8 = null) {
  if (typeof v8 === "string") return v8["trim"]()["length"] > 0;
  if (isStaticPromptPresetTemplate(v8))
    return String(v8["text"] || "")["trim"]()["length"] > 0;
  if (isConditionalPromptPresetTemplate(v8))
    return (
      String(v8["imageInputTemplate"] || "")["trim"]()["length"] > 0 ||
      String(v8["textInputTemplate"] || "")["trim"]()["length"] > 0
    );
  return false;
}
export function getPromptPresetTemplateEmptyInputMessage(v9 = null) {
  return requiresPromptPresetInput(v9)
    ? String(v9["emptyInputMessage"] || "")
    : "";
}
export function resolvePromptPresetTemplate(v10 = "", v11 = "", v12 = {}) {
  const v13 = String(v11 ?? "")["trim"]();
  if (isStaticPromptPresetTemplate(v10)) {
    const v14 = resolveContextFlag(v12, "hasImageInput");
    if (v10["requireInput"] === true && !v13 && !v14) return "";
    return resolvePromptPresetTemplate(v10["text"] || "", v13, v12);
  }
  if (isConditionalPromptPresetTemplate(v10)) {
    const v15 = resolveContextFlag(v12, "hasImageInput");
    if (v15)
      return resolvePromptPresetTemplate(
        v10["imageInputTemplate"] || "",
        v13,
        v12,
      );
    if (v13)
      return resolvePromptPresetTemplate(
        v10["textInputTemplate"] || "",
        v13,
        v12,
      );
    return "";
  }
  const v16 = String(v10 ?? "");
  if (!v16) return v13;
  return v16["replace"](
    PROMPT_PRESET_USER_INPUT_PATTERN,
    (v17, v18) => v13 || v18 || "",
  );
}
