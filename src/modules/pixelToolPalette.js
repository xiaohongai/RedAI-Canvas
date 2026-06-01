const FALLBACK_PIXEL_TOOL_PALETTE = Object["freeze"]({
    checkerLight: "white",
    checkerDark: "rgba(0,\x200,\x200,\x200.12)",
    maskPreviewFill: "rgba(0,\x200,\x200,\x200.5)",
    maskPreviewStroke: "rgba(0, 0, 0, 0.9)",
    toolCursorStroke: "white",
    toolCursorFill: "transparent",
    selectionOverlay: "rgba(0, 0, 0, 0.5)",
  }),
  TOKEN_BY_KEY = Object["freeze"]({
    checkerLight: "--pixel-checker-light",
    checkerDark: "--pixel-checker-dark",
    maskPreviewFill: "--pixel-mask-preview-fill",
    maskPreviewStroke: "--pixel-mask-preview-stroke",
    toolCursorStroke: "--pixel-tool-cursor-stroke",
    toolCursorFill: "--pixel-tool-cursor-fill",
    selectionOverlay: "--pixel-selection-overlay",
  });
function getRootElement() {
  try {
    return typeof document !== "undefined" ? document["documentElement"] : null;
  } catch {
    return null;
  }
}
function readCssToken(v0) {
  try {
    const v1 = getRootElement();
    if (!v1 || typeof getComputedStyle !== "function") return "";
    if (v1["classList"]?.["contains"]("is-canvas-theme-light")) {
      const v2 = getComputedStyle(v1)["getPropertyValue"](v0)["trim"]();
      if (v2) return v2;
    }
    const v3 = document["getElementById"]?.("v2-wrap");
    if (v3?.["classList"]?.["contains"]("theme-light")) {
      const v4 = getComputedStyle(v3)["getPropertyValue"](v0)["trim"]();
      if (v4) return v4;
    }
    return getComputedStyle(v1)["getPropertyValue"](v0)["trim"]();
  } catch {
    return "";
  }
}
export function getPixelToolPalette() {
  return Object["fromEntries"](
    Object["entries"](TOKEN_BY_KEY)["map"](([v5, v6]) => [
      v5,
      readCssToken(v6) || FALLBACK_PIXEL_TOOL_PALETTE[v5],
    ]),
  );
}
export function createPixelCheckerboardPattern(v7, v8 = 1) {
  if (!v7) return null;
  const v9 =
    (typeof document !== "undefined" && document) ||
    v7["canvas"]?.["ownerDocument"] ||
    null;
  if (!v9?.["createElement"]) return null;
  const v10 = getPixelToolPalette(),
    v11 = v9["createElement"]("canvas"),
    v12 = Math["max"](4, Math["round"](8 * (Number(v8) || 1)));
  ((v11["width"] = v12 * 2), (v11["height"] = v12 * 2));
  const v13 = v11["getContext"]("2d");
  if (!v13) return null;
  return (
    (v13["fillStyle"] = v10["checkerLight"]),
    v13["fillRect"](0, 0, v12 * 2, v12 * 2),
    (v13["fillStyle"] = v10["checkerDark"]),
    v13["fillRect"](0, 0, v12, v12),
    v13["fillRect"](v12, v12, v12, v12),
    v7["createPattern"](v11, "repeat")
  );
}
