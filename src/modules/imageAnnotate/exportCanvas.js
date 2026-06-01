import { getTextScalePair } from "./textControls.js";
import {
  drawRoundBrushStroke,
  getEraserClearLineWidth,
  getBrushLineWidth,
  mapBrushPoints,
} from "../imageEditorBrushStyle.js";
const canvasToBlob = (v0, v1, v2) =>
    new Promise((v3) => v0["toBlob"](v3, v1, v2)),
  renderCommandToNaturalCanvas = ({
    ctx: v4,
    cmd: v5,
    scaleX: v6,
    scaleY: v7,
    isEraseScene: v8,
    defaultTextColor: v9,
  } = {}) => {
    if (v8) return;
    if (v5["type"] === "brush") {
      (v4["save"](),
        drawRoundBrushStroke(v4, {
          points: mapBrushPoints(v5["points"], v6, v7),
          lineWidth: getBrushLineWidth(v5["sizeWorld"], v6, "brush"),
          strokeStyle: v5["color"],
          fillStyle: v5["color"],
          globalCompositeOperation: "source-over",
        }),
        v4["restore"]());
      return;
    }
    if (v5["type"] === "eraser") {
      (v4["save"](),
        drawRoundBrushStroke(v4, {
          points: mapBrushPoints(v5["points"], v6, v7),
          lineWidth: getEraserClearLineWidth(
            getBrushLineWidth(v5["sizeWorld"], v6, "eraser"),
          ),
          strokeStyle: "#000",
          fillStyle: "#000",
          globalCompositeOperation: "destination-out",
        }),
        v4["restore"]());
      return;
    }
    if (v5["type"] === "rect") {
      const v10 = v5["x1"] * v6,
        v11 = v5["y1"] * v7,
        v12 = v5["x2"] * v6,
        v13 = v5["y2"] * v7,
        v14 = Math["min"](v10, v12),
        v15 = Math["min"](v11, v13),
        v16 = Math["abs"](v12 - v10),
        v17 = Math["abs"](v13 - v11);
      (v4["save"](),
        (v4["globalCompositeOperation"] = "source-over"),
        (v4["strokeStyle"] = v5["color"]),
        (v4["lineWidth"] = getBrushLineWidth(v5["sizeWorld"], v6, "brush")),
        v4["strokeRect"](v14, v15, v16, v17),
        v4["restore"]());
      return;
    }
    if (v5["type"] === "text") {
      const v18 = v5["x"] * v6,
        v19 = v5["y"] * v7,
        v20 = Math["max"](1, v5["sizeWorld"] * v6),
        v21 = getTextScalePair(v5),
        v22 = Number(v5["rotation"]) || 0;
      (v4["save"](),
        (v4["globalCompositeOperation"] = "source-over"),
        (v4["fillStyle"] = v5["color"] || v9),
        (v4["font"] = v20 + "px sans-serif"),
        (v4["textBaseline"] = "top"),
        v4["translate"](v18, v19),
        v4["rotate"](v22),
        v4["scale"](v21["scaleX"], v21["scaleY"]),
        v4["fillText"](String(v5["text"] || ""), 0, 0),
        v4["restore"]());
    }
  };
export const exportAnnotateCanvasBlob = async ({
  documentRef: documentRef = null,
  node: v23,
  imgEl: v24,
  imgUrl: v25,
  commands: v26,
  useWhiteboardBase: v27,
  isEraseScene: v28,
  loadImage: v29,
  getCurrentFlipState: v30,
  applyFlipTransformToContext: v31,
  createSelectionMaskCanvas: v32,
  canvasWhiteColor: v33,
  defaultTextColor: v34,
} = {}) => {
  const v35 = documentRef || globalThis["document"];
  let v36 = null,
    v37 = 0,
    v38 = 0;
  v27 &&
    ((v37 = Number(v24?.["naturalWidth"] || v24?.["width"] || 0)),
    (v38 = Number(v24?.["naturalHeight"] || v24?.["height"] || 0)));
  (!v37 || !v38 || !v27) &&
    ((v36 = await v29(v25)),
    (v37 = v36["naturalWidth"] || v36["width"]),
    (v38 = v36["naturalHeight"] || v36["height"]));
  const v39 = v35["createElement"]("canvas");
  ((v39["width"] = v37), (v39["height"] = v38));
  const v40 = v39["getContext"]("2d"),
    v41 = v30();
  !v28 &&
    ((v40["fillStyle"] = v33),
    v40["fillRect"](0, 0, v37, v38),
    v40["save"](),
    v31(v40, v37, v38, v41));
  !v27 && v40["drawImage"](v36, 0, 0, v37, v38);
  const v42 = v37 / (v23?.["width"] || 1),
    v43 = v38 / (v23?.["height"] || 1);
  if (v28) {
    const v44 = v32(v37, v38, v42, v43);
    (v40["save"](),
      (v40["globalCompositeOperation"] = "destination-out"),
      v40["drawImage"](v44, 0, 0),
      v40["restore"]());
  }
  (Array["isArray"](v26) ? v26 : [])["forEach"]((v45) =>
    renderCommandToNaturalCanvas({
      ctx: v40,
      cmd: v45,
      scaleX: v42,
      scaleY: v43,
      isEraseScene: v28,
      defaultTextColor: v34,
    }),
  );
  !v28 && v40["restore"]();
  const v46 = v28 ? "image/png" : "image/jpeg",
    v47 = v28 ? undefined : 0.9,
    v48 = await canvasToBlob(v39, v46, v47);
  if (!v48) throw new Error("Canvas 导出失败");
  return { blob: v48, exportType: v46, naturalWidth: v37, naturalHeight: v38 };
};
