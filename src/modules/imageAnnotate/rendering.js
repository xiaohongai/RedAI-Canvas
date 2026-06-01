import { getCachedSealedFillRegion, paintFilledRegion } from "../bucketFill.js";
import {
  createEraseCheckerboardPattern,
  drawEraseMaskCommand,
  drawEraseBrushCommand,
  compositeSolidMaskPreview,
} from "../eraseBrushRenderer.js";
import {
  drawRoundBrushStroke,
  getEraserClearLineWidth,
  getBrushLineWidth,
  mapBrushPoints,
} from "../imageEditorBrushStyle.js";
import {
  getTextScalePair,
  TEXT_CONTROL_BUTTON_RADIUS,
  TEXT_CONTROL_SIDE_HANDLE_RADIUS,
} from "./textControls.js";
const getCanvasRenderSize = (v0) => ({
    width: Number(v0?.["style"]?.["width"]?.["replace"]("px", "")) || 1,
    height: Number(v0?.["style"]?.["height"]?.["replace"]("px", "")) || 1,
  }),
  getCommandPoints = (v1, v2) => mapBrushPoints(v1?.["points"], v2, v2),
  drawTextControlButton = (v3, v4, v5, v6) => {
    (v3["save"](),
      v3["beginPath"](),
      v3["arc"](
        v4["x"],
        v4["y"],
        TEXT_CONTROL_BUTTON_RADIUS,
        0,
        Math["PI"] * 2,
      ),
      (v3["fillStyle"] = v6["fill"]),
      (v3["strokeStyle"] = v6["stroke"]),
      (v3["lineWidth"] = 1.5),
      v3["fill"](),
      v3["stroke"](),
      (v3["strokeStyle"] = v6["icon"]),
      (v3["fillStyle"] = v6["icon"]),
      (v3["lineWidth"] = 1.6),
      (v3["lineCap"] = "round"),
      (v3["lineJoin"] = "round"),
      v5(v3, v4),
      v3["restore"]());
  },
  getBoundaryCommands = (v7, v8) =>
    v7["slice"](0, v8)["filter"](
      (v9) =>
        v9?.["type"] === "brush" ||
        v9?.["type"] === "rect" ||
        v9?.["type"] === "eraser",
    );
export const drawTextSelectionControls = ({
  ctx: v10,
  geom: v11,
  resolveCssVar: v12,
} = {}) => {
  if (!v10 || !v11) return;
  const v13 = v12("--blue-border-focus") || v10["strokeStyle"],
    v14 = v12("--canvas-white") || v10["fillStyle"],
    v15 = v12("--bg") || v12("--text-primary") || v13,
    v16 = { stroke: v13, fill: v14, icon: v15 },
    [v17, v18, v19, v20] = v11["corners"];
  (v10["save"](),
    (v10["strokeStyle"] = v13),
    (v10["lineWidth"] = 1.5),
    v10["setLineDash"]([]),
    v10["beginPath"](),
    v10["moveTo"](v17["x"], v17["y"]),
    v10["lineTo"](v18["x"], v18["y"]),
    v10["lineTo"](v19["x"], v19["y"]),
    v10["lineTo"](v20["x"], v20["y"]),
    v10["closePath"](),
    v10["stroke"](),
    Object["values"](v11["handles"] || {})
      ["filter"]((v21) => v21 && !Array["isArray"](v21))
      ["forEach"]((v22) => {
        (v10["beginPath"](),
          v10["arc"](
            v22["x"],
            v22["y"],
            TEXT_CONTROL_SIDE_HANDLE_RADIUS,
            0,
            Math["PI"] * 2,
          ),
          (v10["fillStyle"] = v14),
          (v10["strokeStyle"] = v13),
          (v10["lineWidth"] = 1.5),
          v10["fill"](),
          v10["stroke"]());
      }),
    v10["restore"](),
    drawTextControlButton(
      v10,
      v17,
      (v23, v24) => {
        (v23["beginPath"](),
          v23["moveTo"](v24["x"] - 3, v24["y"] - 3),
          v23["lineTo"](v24["x"] + 3, v24["y"] + 3),
          v23["moveTo"](v24["x"] + 3, v24["y"] - 3),
          v23["lineTo"](v24["x"] - 3, v24["y"] + 3),
          v23["stroke"]());
      },
      v16,
    ),
    drawTextControlButton(
      v10,
      v20,
      (v25, v26) => {
        (v25["strokeRect"](v26["x"] - 2, v26["y"] - 4, 6, 6),
          v25["strokeRect"](v26["x"] - 5, v26["y"] - 1, 6, 6));
      },
      v16,
    ),
    drawTextControlButton(
      v10,
      v18,
      (v27, v28) => {
        (v27["beginPath"](),
          v27["arc"](
            v28["x"],
            v28["y"],
            4,
            Math["PI"] * 0.15,
            Math["PI"] * 1.55,
          ),
          v27["stroke"](),
          v27["beginPath"](),
          v27["moveTo"](v28["x"] + 4, v28["y"] - 3),
          v27["lineTo"](v28["x"] + 5, v28["y"] + 2),
          v27["lineTo"](v28["x"] + 1, v28["y"]),
          v27["stroke"]());
      },
      v16,
    ),
    drawTextControlButton(
      v10,
      v19,
      (v29, v30) => {
        (v29["beginPath"](),
          v29["moveTo"](v30["x"] - 4, v30["y"] + 4),
          v29["lineTo"](v30["x"] + 4, v30["y"] - 4),
          v29["moveTo"](v30["x"] + 1, v30["y"] - 4),
          v29["lineTo"](v30["x"] + 4, v30["y"] - 4),
          v29["lineTo"](v30["x"] + 4, v30["y"] - 1),
          v29["moveTo"](v30["x"] - 1, v30["y"] + 4),
          v29["lineTo"](v30["x"] - 4, v30["y"] + 4),
          v29["lineTo"](v30["x"] - 4, v30["y"] + 1),
          v29["stroke"]());
      },
      v16,
    ));
};
export const renderEraseSceneCommands = ({
  documentRef: documentRef = null,
  canvasEl: v31,
  ctx: v32,
  viewport: v33,
  commands: commands = [],
  draft: draft = null,
  checkerPattern: v34,
  eraseMaskCanvasEl: eraseMaskCanvasEl = null,
} = {}) => {
  if (!v31 || !v32) return eraseMaskCanvasEl;
  const v35 = documentRef || globalThis["document"],
    v36 = v33?.["zoom"] || 1,
    v37 = getCanvasRenderSize(v31),
    v38 = Math["max"](1, Math["round"](v37["width"])),
    v39 = Math["max"](1, Math["round"](v37["height"]));
  let v40 = eraseMaskCanvasEl;
  (!v40 || v40["width"] !== v38 || v40["height"] !== v39) &&
    ((v40 = v35["createElement"]("canvas")),
    (v40["width"] = v38),
    (v40["height"] = v39));
  const v41 = v40["getContext"]("2d");
  if (!v41) return v40;
  (v41["clearRect"](0, 0, v38, v39),
    (v41["lineCap"] = "round"),
    (v41["lineJoin"] = "round"));
  const v42 = (v43) => {
    if (!v43 || (v43["type"] !== "brush" && v43["type"] !== "eraser")) return;
    const v44 = getCommandPoints(v43, v36);
    if (!v44["length"]) return;
    drawEraseMaskCommand(v41, {
      type: v43["type"],
      points: v44,
      lineWidth: getBrushLineWidth(v43["sizeWorld"], v36, v43["type"]),
    });
  };
  (Array["isArray"](commands) ? commands : [])["forEach"](v42);
  if (draft) v42(draft);
  return (
    compositeSolidMaskPreview(v32, {
      maskCanvas: v40,
      width: v37["width"],
      height: v37["height"],
    }),
    v40
  );
};
export const renderCommands = ({
  ctx: v45,
  viewport: v46,
  canvasEl: v47,
  commands: commands = [],
  isDraft: isDraft = false,
  isEraseScene: isEraseScene = false,
  checkerPattern: v48,
  defaultTextColor: v49,
  getTextGeometry: v50,
  selectedTextCommandIndex: selectedTextCommandIndex = null,
  selectedCommandsRef: selectedCommandsRef = null,
  resolveCssVar: v51,
  fillRegionCache: fillRegionCache = null,
} = {}) => {
  if (!v45 || !v47) return;
  const v52 = v46?.["zoom"] || 1,
    v53 = getCanvasRenderSize(v47);
  commands["forEach"]((v54, v55) => {
    if (v54["type"] === "brush") {
      v45["save"]();
      const v56 = getCommandPoints(v54, v52);
      if (!v56["length"]) {
        v45["restore"]();
        return;
      }
      const v57 = getBrushLineWidth(v54["sizeWorld"], v52, "brush");
      if (isEraseScene) {
        const v58 =
          createEraseCheckerboardPattern(v45, v52) ||
          v48 ||
          v51?.("--white-20") ||
          "transparent";
        drawEraseBrushCommand(v45, {
          type: "brush",
          points: v56,
          lineWidth: v57,
          checkerPattern: v58,
          checkerZoom: v52,
          checkerAlpha: 0.8,
          includeErasePass: false,
        });
      } else
        drawRoundBrushStroke(v45, {
          points: v56,
          lineWidth: v57,
          strokeStyle: v54["color"],
          fillStyle: v54["color"],
          globalCompositeOperation: "source-over",
        });
      v45["restore"]();
      return;
    }
    if (v54["type"] === "eraser") {
      v45["save"]();
      const v59 = getCommandPoints(v54, v52);
      if (!v59["length"]) {
        v45["restore"]();
        return;
      }
      (drawRoundBrushStroke(v45, {
        points: v59,
        lineWidth: getEraserClearLineWidth(
          getBrushLineWidth(v54["sizeWorld"], v52, "eraser"),
        ),
        strokeStyle: "black",
        fillStyle: "black",
        globalCompositeOperation: "destination-out",
      }),
        v45["restore"]());
      return;
    }
    if (v54["type"] === "rect") {
      const v60 = v54["x1"] * v52,
        v61 = v54["y1"] * v52,
        v62 = v54["x2"] * v52,
        v63 = v54["y2"] * v52,
        v64 = Math["min"](v60, v62),
        v65 = Math["min"](v61, v63),
        v66 = Math["abs"](v62 - v60),
        v67 = Math["abs"](v63 - v61);
      (v45["save"](),
        (v45["globalCompositeOperation"] = "source-over"),
        (v45["strokeStyle"] = v54["color"]),
        (v45["lineWidth"] = getBrushLineWidth(v54["sizeWorld"], v52, "brush")));
      if (isDraft) v45["setLineDash"]([6, 5]);
      (v45["strokeRect"](v64, v65, v66, v67), v45["restore"]());
      return;
    }
    if (v54["type"] === "text") {
      const v68 = v54["x"] * v52,
        v69 = v54["y"] * v52,
        v70 = Math["max"](1, v54["sizeWorld"] * v52),
        { scaleX: v71, scaleY: v72 } = getTextScalePair(v54),
        v73 = Number(v54["rotation"]) || 0;
      (v45["save"](),
        (v45["globalCompositeOperation"] = "source-over"),
        (v45["fillStyle"] = v54["color"] || v49),
        (v45["font"] = v70 + "px sans-serif"),
        (v45["textBaseline"] = "top"));
      const v74 = String(v54["text"] || "");
      (v45["translate"](v68, v69),
        v45["rotate"](v73),
        v45["scale"](v71, v72),
        v45["fillText"](v74, 0, 0),
        v45["restore"]());
      if (
        !isDraft &&
        commands === selectedCommandsRef &&
        selectedTextCommandIndex === v55
      ) {
        const v75 = v50?.(v54, v46);
        v75 &&
          drawTextSelectionControls({
            ctx: v45,
            geom: v75,
            resolveCssVar: v51,
          });
      }
      return;
    }
    if (v54["type"] === "fill") {
      const v76 = Math["floor"](Number(v54["x"] || 0) * v52),
        v77 = Math["floor"](Number(v54["y"] || 0) * v52),
        v78 = v54["color"] || v49,
        v79 = getCachedSealedFillRegion({
          cache: fillRegionCache,
          width: v53["width"],
          height: v53["height"],
          zoom: v52,
          fillCommand: v54,
          boundaryCommands: getBoundaryCommands(commands, v55),
          seedX: v76,
          seedY: v77,
          extraKey: "color:" + v78,
          pointToPixel: (v80) => ({
            x: Number(v80?.["x"] || 0) * v52,
            y: Number(v80?.["y"] || 0) * v52,
          }),
          getStrokeWidth: (v81) =>
            getBrushLineWidth(v81?.["sizeWorld"], v52, v81?.["type"]),
        });
      (v45["save"](),
        paintFilledRegion(v45, v79, v53["width"], v53["height"], {
          fillStyle: v78,
          globalCompositeOperation: "source-over",
        }),
        v45["restore"]());
    }
  });
};
