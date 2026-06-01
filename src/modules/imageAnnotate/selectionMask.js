import {
  buildBinaryBoundaryMask,
  floodFillRegion,
  paintFilledRegion,
  sealRegionToBoundary,
} from "../bucketFill.js";
import {
  drawRoundBrushStroke,
  getEraserClearLineWidth,
  getBrushLineWidth,
  mapBrushPoints,
} from "../imageEditorBrushStyle.js";
const getBoundaryCommands = (v0, v1) =>
  (Array["isArray"](v0) ? v0 : [])
    ["slice"](0, v1)
    [
      "filter"
    ]((v2) => v2?.["type"] === "brush" || v2?.["type"] === "rect" || v2?.["type"] === "eraser");
export const buildSelectionMaskCanvas = ({
  documentRef: documentRef = null,
  commands: v3,
  naturalW: v4,
  naturalH: v5,
  scaleX: v6,
  scaleY: v7,
} = {}) => {
  const v8 = documentRef || globalThis["document"],
    v9 = v8["createElement"]("canvas");
  ((v9["width"] = v4), (v9["height"] = v5));
  const v10 = v9["getContext"]("2d");
  if (!v10) return v9;
  return (
    (v10["lineCap"] = "round"),
    (v10["lineJoin"] = "round"),
    (Array["isArray"](v3) ? v3 : [])["forEach"]((v11, v12) => {
      if (v11["type"] === "brush") {
        (v10["save"](),
          drawRoundBrushStroke(v10, {
            points: mapBrushPoints(v11["points"], v6, v7),
            lineWidth: getBrushLineWidth(v11["sizeWorld"], v6, "brush"),
            strokeStyle: "#fff",
            fillStyle: "#fff",
            globalCompositeOperation: "source-over",
          }),
          v10["restore"]());
        return;
      }
      if (v11["type"] === "rect") {
        const v13 = v11["x1"] * v6,
          v14 = v11["y1"] * v7,
          v15 = v11["x2"] * v6,
          v16 = v11["y2"] * v7,
          v17 = Math["min"](v13, v15),
          v18 = Math["min"](v14, v16),
          v19 = Math["abs"](v15 - v13),
          v20 = Math["abs"](v16 - v14);
        (v10["save"](),
          (v10["globalCompositeOperation"] = "source-over"),
          (v10["fillStyle"] = "#fff"),
          v10["fillRect"](v17, v18, v19, v20),
          v10["restore"]());
        return;
      }
      if (v11["type"] === "eraser") {
        (v10["save"](),
          drawRoundBrushStroke(v10, {
            points: mapBrushPoints(v11["points"], v6, v7),
            lineWidth: getEraserClearLineWidth(
              getBrushLineWidth(v11["sizeWorld"], v6, "eraser"),
            ),
            strokeStyle: "#000",
            fillStyle: "#000",
            globalCompositeOperation: "destination-out",
          }),
          v10["restore"]());
        return;
      }
      if (v11["type"] === "fill") {
        const v21 = buildBinaryBoundaryMask({
            width: v4,
            height: v5,
            commands: getBoundaryCommands(v3, v12),
            pointToPixel: (v22) => ({
              x: Number(v22?.["x"] || 0) * v6,
              y: Number(v22?.["y"] || 0) * v7,
            }),
            getStrokeWidth: (v23) =>
              getBrushLineWidth(v23?.["sizeWorld"], v6, v23?.["type"]),
          }),
          v24 = floodFillRegion(
            v21["mask"],
            v21["width"],
            v21["height"],
            Math["floor"](Number(v11["x"] || 0) * v6),
            Math["floor"](Number(v11["y"] || 0) * v7),
          ),
          v25 = sealRegionToBoundary(
            v24,
            v21["mask"],
            v21["width"],
            v21["height"],
          );
        (v10["save"](),
          paintFilledRegion(v10, v25, v4, v5, {
            fillStyle: "#fff",
            globalCompositeOperation: "source-over",
          }),
          v10["restore"]());
      }
    }),
    v9
  );
};
