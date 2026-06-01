const CUSTOM_TEXT_MODELS_KEY = "v2-custom-text-models";
export function getCustomTextModels() {
  try {
    if (typeof localStorage === "undefined") return [];
    return JSON["parse"](localStorage["getItem"](CUSTOM_TEXT_MODELS_KEY)) || [];
  } catch {
    return [];
  }
}
export function saveCustomTextModels(v0) {
  if (typeof localStorage === "undefined") return;
  localStorage["setItem"](CUSTOM_TEXT_MODELS_KEY, JSON["stringify"](v0));
}
