export const IMAGE_BRUSH_MIN_SIZE_PX = 1;
export const IMAGE_BRUSH_MAX_SIZE_PX = 120;
export const IMAGE_BRUSH_ERASER_MIN_WIDTH = 6;
export const IMAGE_BRUSH_ERASER_EDGE_CLEANUP_PX = 2;
export const IMAGE_BRUSH_DEFAULT_SIZE_PX = 40;
export function clampImageBrushSize(v0, v1 = IMAGE_BRUSH_DEFAULT_SIZE_PX) {
  const v2 = Number(v0),
    v3 = Number(v1),
    v4 = Number["isFinite"](v2)
      ? v2
      : Number["isFinite"](v3)
        ? v3
        : IMAGE_BRUSH_DEFAULT_SIZE_PX;
  return Math["max"](
    IMAGE_BRUSH_MIN_SIZE_PX,
    Math["min"](IMAGE_BRUSH_MAX_SIZE_PX, v4),
  );
}
export function getBrushLineWidth(v5, v6 = 1, v7 = "brush") {
  const v8 = Number(v5),
    v9 = Number(v6),
    v10 = (Number["isFinite"](v8) ? v8 : 0) * (Number["isFinite"](v9) ? v9 : 1);
  return Math["max"](v7 === "eraser" ? IMAGE_BRUSH_ERASER_MIN_WIDTH : 1, v10);
}
export function getEraserClearLineWidth(v11) {
  const v12 = Math["max"](1, Number(v11) || 1);
  return v12 + IMAGE_BRUSH_ERASER_EDGE_CLEANUP_PX;
}
export function mapBrushPoints(v13, v14 = 1, v15 = v14) {
  const v16 = Number["isFinite"](Number(v14)) ? Number(v14) : 1,
    v17 = Number["isFinite"](Number(v15)) ? Number(v15) : v16;
  return (Array["isArray"](v13) ? v13 : [])
    [
      "map"
    ]((v18) => ({ x: Number(v18?.["x"]) * v16, y: Number(v18?.["y"]) * v17 }))
    [
      "filter"
    ]((v19) => Number["isFinite"](v19["x"]) && Number["isFinite"](v19["y"]));
}
export function drawRoundBrushStroke(
  v20,
  {
    points: points = [],
    lineWidth: lineWidth = 1,
    strokeStyle: v21,
    fillStyle: fillStyle = v21,
    globalCompositeOperation: v22,
    globalAlpha: v23,
  } = {},
) {
  if (!v20 || !Array["isArray"](points) || !points["length"]) return false;
  const v24 = Math["max"](1, Number(lineWidth) || 1),
    v25 = mapBrushPoints(points, 1, 1);
  if (!v25["length"]) return false;
  ((v20["lineCap"] = "round"),
    (v20["lineJoin"] = "round"),
    (v20["lineWidth"] = v24));
  typeof v22 === "string" && (v20["globalCompositeOperation"] = v22);
  Number["isFinite"](Number(v23)) &&
    (v20["globalAlpha"] = Math["max"](0, Math["min"](1, Number(v23))));
  if (v21 !== undefined) v20["strokeStyle"] = v21;
  if (fillStyle !== undefined) v20["fillStyle"] = fillStyle;
  if (v25["length"] === 1) {
    const v26 = v25[0];
    return (
      v20["beginPath"](),
      typeof v20["arc"] === "function" && typeof v20["fill"] === "function"
        ? (v20["arc"](
            v26["x"],
            v26["y"],
            Math["max"](0.5, v24 / 2),
            0,
            Math["PI"] * 2,
          ),
          v20["fill"]())
        : (v20["moveTo"](v26["x"], v26["y"]),
          v20["lineTo"](v26["x"] + 0.001, v26["y"]),
          v20["stroke"]()),
      true
    );
  }
  return (
    v20["beginPath"](),
    v25["forEach"]((v27, v28) => {
      if (v28 === 0) v20["moveTo"](v27["x"], v27["y"]);
      else v20["lineTo"](v27["x"], v27["y"]);
    }),
    v20["stroke"](),
    true
  );
}
export function syncCircularBrushCursor({
  cursorEl: v29,
  canvasEl: v30,
  visible: visible = true,
  tool: tool = "brush",
  allowedTools: allowedTools = ["brush", "eraser", "bucket"],
  sizePx: sizePx = IMAGE_BRUSH_DEFAULT_SIZE_PX,
  cursorLast: cursorLast = { x: 0, y: 0 },
  isEraseBrush: isEraseBrush = false,
  hiddenCursor: hiddenCursor = "var(--precision-cursor)",
  activeCursor: activeCursor = "none",
  eraseClassName: eraseClassName = "is-erase-brush",
} = {}) {
  if (!v29) return false;
  const v31 = new Set(allowedTools);
  if (!visible || !v31["has"](tool)) {
    ((v29["style"]["display"] = "none"),
      v29["classList"]?.["remove"]?.(eraseClassName));
    if (v30) v30["style"]["cursor"] = hiddenCursor;
    return false;
  }
  const v32 = clampImageBrushSize(sizePx);
  ((v29["style"]["display"] = "block"),
    (v29["style"]["width"] = v32 + "px"),
    (v29["style"]["height"] = v32 + "px"),
    (v29["style"]["left"] = (Number(cursorLast?.["x"]) || 0) + "px"),
    (v29["style"]["top"] = (Number(cursorLast?.["y"]) || 0) + "px"),
    v29["classList"]?.["toggle"]?.(eraseClassName, Boolean(isEraseBrush)));
  if (v30) v30["style"]["cursor"] = activeCursor;
  return true;
}
