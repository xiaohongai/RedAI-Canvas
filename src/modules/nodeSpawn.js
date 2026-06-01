import { findAvailablePosition } from "../core/math.js";
function toFiniteNumber(v0, v1) {
  const v2 = Number(v0);
  return Number["isFinite"](v2) ? v2 : v1;
}
function clampPositiveInteger(v3, v4) {
  const v5 = Math["trunc"](Number(v3));
  return Number["isFinite"](v5) && v5 > 0 ? v5 : v4;
}
function normalizeSpawnDirection(v6) {
  if (v6 === "down" || v6 === "left") return v6;
  return "right";
}
export function getNodeSpawnPrefs() {
  const v7 = globalThis["window"] || {};
  return {
    spacing: v7["v2NodeSpacing"] ?? 120,
    direction: v7["v2NodeDirection"] ?? "right",
    avoidOverlap: v7["v2NodeAvoidOverlap"] ?? true,
  };
}
export function calcSpawnStartFromAnchor(v8, v9, v10) {
  const v11 = v8?.["x"] || 0,
    v12 = v8?.["y"] || 0,
    v13 = v8?.["width"] || 300,
    v14 = v8?.["height"] || 300;
  return {
    startX: v11 + (v10 === "right" ? v13 + v9 : 0),
    startY: v12 + (v10 === "down" ? v14 + v9 : 0),
  };
}
export function calcSafeSpawnPosNearNode(v15, v16, v17, v18) {
  const {
      spacing: v19,
      direction: v20,
      avoidOverlap: v21,
    } = getNodeSpawnPrefs(),
    v22 = normalizeSpawnDirection(v20),
    v23 = v16?.["x"] || 0,
    v24 = v16?.["y"] || 0,
    v25 = v16?.["width"] || 300,
    v26 = v16?.["height"] || 300,
    v27 = Number(v17) || 300,
    v28 = Number(v18) || 300,
    v29 =
      v22 === "left"
        ? v23 - v19 - v27
        : v23 + (v22 === "right" ? v25 + v19 : 0),
    v30 = v24 + (v22 === "down" ? v26 + v19 : 0);
  if (!v21) return { x: v29, y: v30 };
  return findAvailablePosition(v15, v29, v30, v27, v28, v19, v22);
}
export function createBatchSpawnLayoutNearNode({
  nodes: nodes = {},
  anchorNode: v31,
  itemCount: v32,
  itemWidth: v33,
  itemHeight: v34,
  maxPerLine: maxPerLine = 5,
  padding: padding = 0,
  titleHeight: titleHeight = 0,
  itemGap: v35,
} = {}) {
  const v36 = getNodeSpawnPrefs(),
    v37 = Math["max"](0, toFiniteNumber(v36["spacing"], 120)),
    v38 = normalizeSpawnDirection(v36["direction"]),
    v39 = v36["avoidOverlap"] !== false,
    v40 = clampPositiveInteger(v32, 1),
    v41 = Math["max"](1, toFiniteNumber(v33, 300)),
    v42 = Math["max"](1, toFiniteNumber(v34, 300)),
    v43 = Math["max"](0, toFiniteNumber(v35, v37)),
    v44 = Math["max"](0, toFiniteNumber(padding, 0)),
    v45 = Math["max"](0, toFiniteNumber(titleHeight, 0)),
    v46 = Math["min"](
      clampPositiveInteger(maxPerLine, 5),
      Math["max"](1, Math["ceil"](Math["sqrt"](v40))),
    ),
    v47 = v38 === "down" ? Math["max"](1, Math["ceil"](v40 / v46)) : v46,
    v48 = v38 === "down" ? v46 : Math["max"](1, Math["ceil"](v40 / v46)),
    v49 = v47 * v41 + (v47 - 1) * v43 + v44 * 2,
    v50 = v48 * v42 + (v48 - 1) * v43 + v44 * 2 + v45,
    v51 = toFiniteNumber(v31?.["x"], 0),
    v52 = toFiniteNumber(v31?.["y"], 0),
    v53 = toFiniteNumber(v31?.["width"], 300),
    v54 = toFiniteNumber(v31?.["height"], 300);
  let v55 = v51 + v53 + v37,
    v56 = v52;
  if (v38 === "down") ((v55 = v51), (v56 = v52 + v54 + v37));
  else v38 === "left" && ((v55 = v51 - v37 - v49), (v56 = v52));
  if (v39) {
    const v57 = findAvailablePosition(nodes, v55, v56, v49, v50, v37, v38);
    ((v55 = v57["x"]), (v56 = v57["y"]));
  }
  const v58 = v55 + v44,
    v59 = v56 + v44 + v45,
    v60 = (v61) => {
      const v62 = Math["max"](0, Math["trunc"](Number(v61)) || 0),
        v63 = v38 === "down" ? Math["floor"](v62 / v48) : v62 % v47,
        v64 = v38 === "down" ? v62 % v48 : Math["floor"](v62 / v47);
      return {
        x: v58 + v63 * (v41 + v43),
        y: v59 + v64 * (v42 + v43),
        col: v63,
        row: v64,
      };
    };
  return {
    direction: v38,
    spacing: v37,
    itemGap: v43,
    columns: v47,
    rows: v48,
    groupX: v55,
    groupY: v56,
    groupWidth: v49,
    groupHeight: v50,
    itemStartX: v58,
    itemStartY: v59,
    getItemPosition: v60,
  };
}
