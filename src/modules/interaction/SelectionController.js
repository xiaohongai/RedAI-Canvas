import { addEdgeWithPolicies } from "./EdgeController.js";
export function createSelectionController({
  store: v0,
  screenToWorld: v1,
  isNodeType: v2,
  isValidConnection: v3,
}) {
  function v4(v5, v6, v7) {
    ((v5["isBoxSelecting"] = true),
      (v5["boxStartX"] = v6),
      (v5["boxStartY"] = v7),
      (v5["_boxSelectionActivated"] = false));
  }
  function v8(v9, v10, v11) {
    if (!v9["_boxSelectionActivated"]) {
      const v12 = Math["hypot"](v10 - v9["boxStartX"], v11 - v9["boxStartY"]);
      v12 > 3 && (v9["_boxSelectionActivated"] = true);
    }
    v9["_boxSelectionActivated"] &&
      v0["setSelectionBox"]({
        active: true,
        x1: Math["min"](v9["boxStartX"], v10),
        y1: Math["min"](v9["boxStartY"], v11),
        x2: Math["max"](v9["boxStartX"], v10),
        y2: Math["max"](v9["boxStartY"], v11),
      });
  }
  function v13(v14, v15, v16) {
    const v17 = v0["getState"](),
      v18 = v17["pickConnectMode"],
      { viewport: v19, nodes: v20 } = v17,
      { boxStartX: v21, boxStartY: v22 } = v14;
    if (
      !Number["isFinite"](v21) ||
      !Number["isFinite"](v22) ||
      !Number["isFinite"](v15) ||
      !Number["isFinite"](v16)
    )
      return (
        v0["setSelectionBox"]({ active: false }),
        (v14["isBoxSelecting"] = false),
        { earlyReturn: false, didAct: false }
      );
    const v23 = Math["min"](v21, v15),
      v24 = Math["max"](v21, v15),
      v25 = Math["min"](v22, v16),
      v26 = Math["max"](v22, v16),
      { x: v27, y: v28 } = v1(v23, v25, v19),
      { x: v29, y: v30 } = v1(v24, v26, v19);
    if (
      !Number["isFinite"](v27) ||
      !Number["isFinite"](v28) ||
      !Number["isFinite"](v29) ||
      !Number["isFinite"](v30)
    )
      return (
        v0["setSelectionBox"]({ active: false }),
        (v14["isBoxSelecting"] = false),
        { earlyReturn: false, didAct: false }
      );
    if (!v18?.["active"] && v17["connOverlay"]?.["srcId"])
      return (
        v0["setSelectionBox"]({ active: false }),
        (v14["isBoxSelecting"] = false),
        { earlyReturn: false, didAct: false }
      );
    if (v18 && v18["active"]) {
      for (const v31 of Object["values"](v20)) {
        if (v31["id"] === v18["sourceNodeId"] || v2(v31, "group")) continue;
        const v32 = v31["x"] + (v31["width"] || 260) / 2,
          v33 = v31["y"] + (v31["height"] || 100) / 2;
        if (v32 >= v27 && v32 <= v29 && v33 >= v28 && v33 <= v30) {
          const v34 = v18["handleDirection"] === "left",
            v35 = v34 ? v31["id"] : v18["sourceNodeId"],
            v36 = v34 ? v18["sourceNodeId"] : v31["id"];
          if (v20[v35] && v20[v35]["type"] === "group") continue;
          if (!v3(v20[v35], v20[v36])) continue;
          addEdgeWithPolicies({ sourceId: v35, targetId: v36 });
        }
      }
      return (
        v0["setSelectionBox"]({ active: false }),
        (v14["isBoxSelecting"] = false),
        { earlyReturn: true, didAct: true }
      );
    }
    const v37 = [];
    for (const v38 of Object["values"](v20)) {
      const v39 = v38["x"] + (v38["width"] || 260),
        v40 = v38["y"] + (v38["height"] || 100);
      if (v2(v38, "group")) {
        const v41 =
          v38["x"] >= v27 && v39 <= v29 && v38["y"] >= v28 && v40 <= v30;
        if (v41) v37["push"](v38["id"]);
      } else {
        const v42 = !(
          v38["x"] > v29 ||
          v39 < v27 ||
          v38["y"] > v30 ||
          v40 < v28
        );
        if (v42) v37["push"](v38["id"]);
      }
    }
    return (
      v0["setSelectionMeta"]({ source: "box" }),
      v0["setSelectedNodes"](v37),
      v0["setSelectionBox"]({ active: false }),
      (v14["isBoxSelecting"] = false),
      { earlyReturn: false, didAct: true }
    );
  }
  return {
    startBoxSelecting: v4,
    updateBoxSelecting: v8,
    finishBoxSelecting: v13,
  };
}
