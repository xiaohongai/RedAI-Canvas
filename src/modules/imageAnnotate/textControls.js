export const TEXT_CONTROL_BUTTON_RADIUS = 9;
export const TEXT_CONTROL_SIDE_HANDLE_RADIUS = 7;
export const TEXT_CONTROL_HIT_RADIUS = 13;
export const TEXT_CONTROL_MIN_SCALE = 0.1;
export const TEXT_CONTROL_MAX_SCALE = 20;
export const TEXT_COPY_OFFSET_WORLD = 16;
export const clampTextScale = (v0) => {
  const v1 = Number(v0);
  if (!Number["isFinite"](v1)) return 1;
  return Math["max"](
    TEXT_CONTROL_MIN_SCALE,
    Math["min"](TEXT_CONTROL_MAX_SCALE, v1),
  );
};
export const getTextScalePair = (v2 = {}) => {
  const v3 = clampTextScale(v2["scale"]);
  return {
    scaleX: clampTextScale(
      v2["scaleX"] === undefined || v2["scaleX"] === null ? v3 : v2["scaleX"],
    ),
    scaleY: clampTextScale(
      v2["scaleY"] === undefined || v2["scaleY"] === null ? v3 : v2["scaleY"],
    ),
  };
};
export const getTextLayout = ({ canvasEl: v4, cmd: v5, viewport: v6 } = {}) => {
  if (!v4 || !v5) return null;
  const v7 = v6?.["zoom"] || 1,
    v8 = Math["max"](1, Number(v5["sizeWorld"] || 0) * v7),
    v9 = Number(v5["x"] || 0) * v7,
    v10 = Number(v5["y"] || 0) * v7,
    v11 = v4["getContext"]("2d");
  (v11["save"](), (v11["font"] = v8 + "px sans-serif"));
  const v12 = String(v5["text"] || ""),
    v13 = v11["measureText"](v12 || "\x20");
  v11["restore"]();
  const v14 = Math["max"](1, Number(v13["width"]) || v8),
    v15 = Number(v13["actualBoundingBoxAscent"]) || v8 * 0.8,
    v16 = Number(v13["actualBoundingBoxDescent"]) || v8 * 0.2,
    v17 = Math["max"](1, v15 + v16);
  return { x: v9, y: v10, width: v14, height: v17, fontSize: v8 };
};
export const getTextGeometry = ({
  canvasEl: v18,
  cmd: v19,
  viewport: v20,
} = {}) => {
  const v21 = getTextLayout({ canvasEl: v18, cmd: v19, viewport: v20 });
  if (!v21) return null;
  const { scaleX: v22, scaleY: v23 } = getTextScalePair(v19),
    v24 = Number(v19?.["rotation"]) || 0,
    v25 = v21["width"] * v22,
    v26 = v21["height"] * v23,
    v27 = v21["x"],
    v28 = v21["y"],
    v29 = (v30, v31) => {
      const v32 = v30 - v27,
        v33 = v31 - v28,
        v34 = Math["cos"](v24),
        v35 = Math["sin"](v24);
      return { x: v27 + v32 * v34 - v33 * v35, y: v28 + v32 * v35 + v33 * v34 };
    },
    v36 = v29(v27, v28),
    v37 = v29(v27 + v25, v28),
    v38 = v29(v27 + v25, v28 + v26),
    v39 = v29(v27, v28 + v26);
  return {
    ...v21,
    scale: Math["max"](v22, v23),
    scaleX: v22,
    scaleY: v23,
    rotation: v24,
    corners: [v36, v37, v38, v39],
    center: { x: (v36["x"] + v38["x"]) / 2, y: (v36["y"] + v38["y"]) / 2 },
    anchor: { x: v27, y: v28 },
    handles: {
      corners: [v36, v37, v38, v39],
      top: { x: (v36["x"] + v37["x"]) / 2, y: (v36["y"] + v37["y"]) / 2 },
      right: { x: (v37["x"] + v38["x"]) / 2, y: (v37["y"] + v38["y"]) / 2 },
      bottom: { x: (v38["x"] + v39["x"]) / 2, y: (v38["y"] + v39["y"]) / 2 },
      left: { x: (v39["x"] + v36["x"]) / 2, y: (v39["y"] + v36["y"]) / 2 },
    },
  };
};
export const distanceToPoint = (v40, v41) =>
  Math["hypot"](
    Number(v40?.["x"] || 0) - Number(v41?.["x"] || 0),
    Number(v40?.["y"] || 0) - Number(v41?.["y"] || 0),
  );
export const toTextLocalTransformSpace = (v42, v43, v44) => {
  const v45 = Number(v42?.["x"] || 0) - Number(v43?.["x"] || 0),
    v46 = Number(v42?.["y"] || 0) - Number(v43?.["y"] || 0),
    v47 = Math["cos"](-(Number(v44) || 0)),
    v48 = Math["sin"](-(Number(v44) || 0));
  return { x: v45 * v47 - v46 * v48, y: v45 * v48 + v46 * v47 };
};
export const rotateTextLocalPoint = (v49, v50) => {
  const v51 = Math["cos"](Number(v50) || 0),
    v52 = Math["sin"](Number(v50) || 0),
    v53 = Number(v49?.["x"] || 0),
    v54 = Number(v49?.["y"] || 0);
  return { x: v53 * v51 - v54 * v52, y: v53 * v52 + v54 * v51 };
};
export const resolveAxisTextScale = (v55, v56) => {
  const v57 = toTextLocalTransformSpace(v56, v55["anchorPx"], v55["rotation"]);
  let v58 = v55["baseScaleX"],
    v59 = v55["baseScaleY"],
    v60 = { x: 0, y: 0 };
  if (v55["handle"] === "right")
    v58 = clampTextScale(v57["x"] / v55["layoutWidth"]);
  else {
    if (v55["handle"] === "left")
      ((v58 = clampTextScale(-v57["x"] / v55["layoutWidth"])),
        (v60 = { x: -v55["layoutWidth"] * v58, y: 0 }));
    else {
      if (v55["handle"] === "bottom")
        v59 = clampTextScale(v57["y"] / v55["layoutHeight"]);
      else
        v55["handle"] === "top" &&
          ((v59 = clampTextScale(-v57["y"] / v55["layoutHeight"])),
          (v60 = { x: 0, y: -v55["layoutHeight"] * v59 }));
    }
  }
  const v61 = rotateTextLocalPoint(v60, v55["rotation"]);
  return {
    scaleX: v58,
    scaleY: v59,
    originPx: {
      x: v55["anchorPx"]["x"] + v61["x"],
      y: v55["anchorPx"]["y"] + v61["y"],
    },
  };
};
export const isPointInPolygon = (v62, v63) => {
  let v64 = false;
  for (let v65 = 0, v66 = v63["length"] - 1; v65 < v63["length"]; v66 = v65++) {
    const v67 = v63[v65]["x"],
      v68 = v63[v65]["y"],
      v69 = v63[v66]["x"],
      v70 = v63[v66]["y"],
      v71 =
        v68 > v62["y"] !== v70 > v62["y"] &&
        v62["x"] <
          ((v69 - v67) * (v62["y"] - v68)) / (v70 - v68 || 0.000001) + v67;
    if (v71) v64 = !v64;
  }
  return v64;
};
export const findTextHit = ({
  commands: v72,
  selectedTextCommandIndex: v73,
  local: v74,
  viewport: v75,
  canvasEl: v76,
} = {}) => {
  const v77 = v75?.["zoom"] || 1,
    v78 = {
      x: Number(v74?.["x"] || 0) * v77,
      y: Number(v74?.["y"] || 0) * v77,
    },
    v79 = Number(v73);
  if (
    Number["isInteger"](v79) &&
    v79 >= 0 &&
    v79 < v72["length"] &&
    v72[v79]?.["type"] === "text"
  ) {
    const v80 = getTextGeometry({
      canvasEl: v76,
      cmd: v72[v79],
      viewport: v75,
    });
    if (v80) {
      const [v81, v82, v83, v84] = v80["corners"],
        v85 = [
          { point: v81, mode: "delete" },
          { point: v84, mode: "copy" },
          { point: v82, mode: "rotate" },
          { point: v83, mode: "scale-uniform" },
        ],
        v86 = [
          { point: v80["handles"]["top"], mode: "scale-y", handle: "top" },
          { point: v80["handles"]["right"], mode: "scale-x", handle: "right" },
          {
            point: v80["handles"]["bottom"],
            mode: "scale-y",
            handle: "bottom",
          },
          { point: v80["handles"]["left"], mode: "scale-x", handle: "left" },
        ],
        v87 = [
          ...v85["map"]((v88) => ({
            ...v88,
            distance: distanceToPoint(v78, v88["point"]),
            radius: TEXT_CONTROL_HIT_RADIUS,
          })),
          ...v86["map"]((v89) => ({
            ...v89,
            distance: distanceToPoint(v78, v89["point"]),
            radius: TEXT_CONTROL_SIDE_HANDLE_RADIUS + 4,
          })),
        ]
          ["filter"]((v90) => v90["distance"] <= v90["radius"])
          ["sort"]((v91, v92) => v91["distance"] - v92["distance"]);
      if (v87["length"] > 0) {
        const v93 = v87[0];
        return {
          index: v79,
          mode: v93["mode"],
          handle: v93["handle"],
          geom: v80,
        };
      }
      if (isPointInPolygon(v78, v80["corners"]))
        return { index: v79, mode: "move", geom: v80 };
    }
  }
  for (let v94 = v72["length"] - 1; v94 >= 0; v94 -= 1) {
    const v95 = v72[v94];
    if (v95?.["type"] !== "text") continue;
    const v96 = getTextGeometry({ canvasEl: v76, cmd: v95, viewport: v75 });
    if (!v96) continue;
    if (isPointInPolygon(v78, v96["corners"]))
      return { index: v94, mode: "move", geom: v96 };
  }
  return null;
};
export const createTextTransformState = ({
  commands: v97,
  hit: v98,
  local: v99,
  viewport: v100,
  canvasEl: v101,
} = {}) => {
  const v102 = v100?.["zoom"] || 1,
    v103 = {
      x: Number(v99?.["x"] || 0) * v102,
      y: Number(v99?.["y"] || 0) * v102,
    },
    v104 = v97[v98["index"]],
    v105 =
      v98["geom"] ||
      getTextGeometry({ canvasEl: v101, cmd: v104, viewport: v100 });
  if (!v105) return null;
  if (v98["mode"] === "move")
    return {
      index: v98["index"],
      mode: "move",
      offsetWorldX: Number(v99?.["x"] || 0) - Number(v104?.["x"] || 0),
      offsetWorldY: Number(v99?.["y"] || 0) - Number(v104?.["y"] || 0),
    };
  if (v98["mode"] === "scale") return null;
  if (v98["mode"] === "scale-x" || v98["mode"] === "scale-y") {
    const v106 = String(v98["handle"] || ""),
      v107 = {
        right: v105["corners"][0],
        bottom: v105["corners"][0],
        left: v105["corners"][1],
        top: v105["corners"][3],
      },
      v108 = v107[v106] || v105["corners"][0];
    return {
      index: v98["index"],
      mode: v98["mode"],
      handle: v106,
      anchorPx: { x: v108["x"], y: v108["y"] },
      baseScaleX: v105["scaleX"],
      baseScaleY: v105["scaleY"],
      layoutWidth: Math["max"](1, Number(v105["width"]) || 1),
      layoutHeight: Math["max"](1, Number(v105["height"]) || 1),
      rotation: Number(v104?.["rotation"]) || 0,
    };
  }
  if (v98["mode"] === "scale-uniform")
    return {
      index: v98["index"],
      mode: "scale-uniform",
      originPx: { x: v105["anchor"]["x"], y: v105["anchor"]["y"] },
      baseWidthPx: Math["max"](1, Number(v105["width"]) || 1) * v105["scaleX"],
      baseHeightPx:
        Math["max"](1, Number(v105["height"]) || 1) * v105["scaleY"],
      baseScaleX: v105["scaleX"],
      baseScaleY: v105["scaleY"],
      rotation: Number(v104?.["rotation"]) || 0,
    };
  if (v98["mode"] === "rotate")
    return {
      index: v98["index"],
      mode: "rotate",
      centerPx: { x: v105["center"]["x"], y: v105["center"]["y"] },
      baseAngle: Math["atan2"](
        v103["y"] - v105["center"]["y"],
        v103["x"] - v105["center"]["x"],
      ),
      baseRotation: Number(v104?.["rotation"]) || 0,
      layoutWidth: Math["max"](1, Number(v105["width"]) || 1),
      layoutHeight: Math["max"](1, Number(v105["height"]) || 1),
    };
  return null;
};
export const buildCopiedTextCommand = (v109, v110) => {
  const v111 = v110?.["zoom"] || 1,
    v112 = TEXT_COPY_OFFSET_WORLD / v111;
  return {
    ...v109,
    x: Number(v109["x"] || 0) + v112,
    y: Number(v109["y"] || 0) + v112,
  };
};
