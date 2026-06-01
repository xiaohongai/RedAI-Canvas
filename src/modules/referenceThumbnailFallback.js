const REFERENCE_FALLBACK_TYPES = new Set(["text", "audio"]);
function normalizeReferenceFallbackType(v0) {
  const v1 = String(v0 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v1["includes"]("text")) return "text";
  if (v1["includes"]("audio")) return "audio";
  return REFERENCE_FALLBACK_TYPES["has"](v1) ? v1 : "";
}
function normalizeClassName(v2) {
  return String(v2 || "")
    ["split"](/\s+/)
    ["map"]((v3) => v3["replace"](/[^A-Za-z0-9_-]/g, ""))
    ["filter"](Boolean)
    ["join"]("\x20");
}
export function getReferenceFallbackThumbLabel(v4) {
  const v5 = normalizeReferenceFallbackType(v4);
  return v5 ? v5["toUpperCase"]() : "";
}
export function createReferenceFallbackThumbElement(v6, v7 = "") {
  const v8 = normalizeReferenceFallbackType(v6);
  if (!v8) return null;
  if (
    typeof document === "undefined" ||
    typeof document["createElement"] !== "function"
  )
    return null;
  const v9 = document["createElement"]("span"),
    v10 = normalizeClassName(v7);
  return (
    (v9["className"] = [
      v10,
      "ref-thumb-fallback",
      "mention-ref-thumb-fallback",
      "mention-ref-thumb-" + v8,
      "ref-thumb-fallback-" + v8,
    ]
      ["filter"](Boolean)
      ["join"]("\x20")),
    (v9["textContent"] = getReferenceFallbackThumbLabel(v8)),
    v9["setAttribute"]("aria-hidden", "true"),
    (v9["draggable"] = false),
    (v9["contentEditable"] = "false"),
    v9
  );
}
export function createReferenceFallbackThumbHtml(v11, v12 = "ref-thumb-media") {
  const v13 = normalizeReferenceFallbackType(v11);
  if (!v13) return "";
  const v14 = normalizeClassName(v12) || "ref-thumb-media",
    v15 = [
      v14,
      "ref-thumb-fallback",
      "mention-ref-thumb-fallback",
      "mention-ref-thumb-" + v13,
      "ref-thumb-fallback-" + v13,
    ]["join"]("\x20");
  return (
    '<div class="' +
    v15 +
    '" aria-hidden="true">' +
    getReferenceFallbackThumbLabel(v13) +
    "</div>"
  );
}
