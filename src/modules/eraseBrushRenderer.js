import {
  drawRoundBrushStroke,
  getEraserClearLineWidth,
} from "./imageEditorBrushStyle.js";
import {
  createPixelCheckerboardPattern,
  getPixelToolPalette,
} from "./pixelToolPalette.js";
export function getEraseCanvasPalette() {
  const v0 = getPixelToolPalette();
  return {
    eraseDark: v0["maskPreviewStroke"],
    maskPreviewFill: v0["maskPreviewFill"],
    brushLight: v0["checkerLight"],
    checkerAccent: v0["checkerDark"],
  };
}
export function createEraseCheckerboardPattern(v1, v2 = 1) {
  return createPixelCheckerboardPattern(v1, v2);
}
const OPAQUE_ERASER_SOURCE = "black",
  OPAQUE_MASK_SOURCE = "white";
export function drawEraseBrushCommand(
  v3,
  {
    type: type = "brush",
    points: points = [],
    lineWidth: lineWidth = 1,
    checkerPattern: checkerPattern = null,
    checkerZoom: checkerZoom = 1,
    checkerAlpha: checkerAlpha = 0.8,
    includeErasePass: includeErasePass = true,
  } = {},
) {
  if (!v3 || !Array["isArray"](points) || !points["length"]) return;
  const v4 = type === "eraser" ? "eraser" : "brush",
    v5 = Math["max"](1, Number(lineWidth) || 1);
  (v3["save"](),
    (v3["lineCap"] = "round"),
    (v3["lineJoin"] = "round"),
    (v3["lineWidth"] = v5));
  if (v4 === "eraser") {
    const v6 = getEraserClearLineWidth(v5);
    (drawRoundBrushStroke(v3, {
      points: points,
      lineWidth: v6,
      strokeStyle: OPAQUE_ERASER_SOURCE,
      fillStyle: OPAQUE_ERASER_SOURCE,
      globalCompositeOperation: "destination-out",
    }),
      v3["restore"]());
    return;
  }
  const v7 =
    checkerPattern ||
    createEraseCheckerboardPattern(v3, checkerZoom) ||
    palette["checkerAccent"];
  if (includeErasePass) {
    const v8 = getEraserClearLineWidth(v5);
    drawRoundBrushStroke(v3, {
      points: points,
      lineWidth: v8,
      strokeStyle: OPAQUE_ERASER_SOURCE,
      fillStyle: OPAQUE_ERASER_SOURCE,
      globalCompositeOperation: "destination-out",
    });
  }
  (drawRoundBrushStroke(v3, {
    points: points,
    lineWidth: v5,
    strokeStyle: v7,
    fillStyle: v7,
    globalCompositeOperation: "source-over",
    globalAlpha: Math["max"](0, Math["min"](1, Number(checkerAlpha) || 0.8)),
  }),
    v3["restore"]());
}
export function drawEraseMaskCommand(
  v9,
  { type: type = "brush", points: points = [], lineWidth: lineWidth = 1 } = {},
) {
  if (!v9 || !Array["isArray"](points) || !points["length"]) return;
  const v10 = getEraseCanvasPalette(),
    v11 = type === "eraser" ? "eraser" : "brush",
    v12 = Math["max"](1, Number(lineWidth) || 1);
  v9["save"]();
  const v13 = v11 === "eraser" ? OPAQUE_ERASER_SOURCE : OPAQUE_MASK_SOURCE,
    v14 = v11 === "eraser" ? getEraserClearLineWidth(v12) : v12;
  (drawRoundBrushStroke(v9, {
    points: points,
    lineWidth: v14,
    strokeStyle: v13,
    fillStyle: v13,
    globalCompositeOperation:
      v11 === "eraser" ? "destination-out" : "source-over",
  }),
    v9["restore"]());
}
export function compositeCheckerMask(
  v15,
  {
    maskCanvas: maskCanvas = null,
    width: width = 0,
    height: height = 0,
    checkerPattern: checkerPattern = null,
    checkerZoom: checkerZoom = 1,
    checkerAlpha: checkerAlpha = 0.8,
  } = {},
) {
  if (!v15 || !maskCanvas) return;
  const v16 = getEraseCanvasPalette(),
    v17 = Math["max"](1, Number(width) || 0),
    v18 = Math["max"](1, Number(height) || 0),
    v19 =
      checkerPattern ||
      createEraseCheckerboardPattern(v15, checkerZoom) ||
      v16["checkerAccent"],
    v20 = Math["max"](0, Math["min"](1, Number(checkerAlpha) || 0.8));
  (v15["save"](),
    (v15["globalCompositeOperation"] = "source-over"),
    (v15["globalAlpha"] = v20),
    (v15["fillStyle"] = v19),
    v15["fillRect"](0, 0, v17, v18),
    (v15["globalCompositeOperation"] = "destination-in"),
    (v15["globalAlpha"] = 1),
    v15["drawImage"](maskCanvas, 0, 0, v17, v18),
    v15["restore"]());
}
export function compositeSolidMaskPreview(
  v21,
  { maskCanvas: maskCanvas = null, width: width = 0, height: height = 0 } = {},
) {
  if (!v21 || !maskCanvas) return;
  const v22 = getEraseCanvasPalette(),
    v23 = Math["max"](1, Number(width) || 0),
    v24 = Math["max"](1, Number(height) || 0),
    v25 = v22["maskPreviewFill"] || v22["eraseDark"];
  (v21["save"](),
    (v21["globalCompositeOperation"] = "source-over"),
    (v21["globalAlpha"] = 1),
    (v21["fillStyle"] = v25),
    v21["fillRect"](0, 0, v23, v24),
    (v21["globalCompositeOperation"] = "destination-in"),
    v21["drawImage"](maskCanvas, 0, 0, v23, v24),
    v21["restore"]());
}
