import { beginZoomFpsSession, endZoomFpsSession } from "../perf/perfProbe.js";
export function createZoomController({ store: v0 }) {
  let v1 = 0,
    v2 = 0,
    v3 = 0,
    v4 = 0,
    v5 = 0,
    v6 = null;
  const v7 = "is-edge-interaction-lite",
    v8 = 0.24,
    v9 = 0.48,
    v10 = 3,
    v11 = 160;
  function v12(v13, v14) {
    const v15 = Object["keys"](v13?.["edges"] || {})["length"],
      v16 = typeof window !== "undefined" ? window["_edgeDomCache"] : null;
    return v14 >= v8 && v14 <= v9 && v15 >= v10 && v16 && v16["size"] > 0;
  }
  function v17(v18) {
    if (typeof document === "undefined" || !document?.["body"]?.["classList"])
      return;
    document["body"]["classList"]["toggle"](v7, !!v18);
  }
  function v19(v20) {
    if (typeof requestAnimationFrame === "function")
      return requestAnimationFrame(v20);
    return setTimeout(v20, 0);
  }
  function v21() {
    v3 = 0;
    if (!v6) return;
    const { x: v22, y: v23, zoom: v24 } = v6;
    ((v6 = null), v0["updateViewport"](v22, v23, v24));
  }
  function v25(v26) {
    v6 = v26;
    if (v3) return;
    v3 = v19(v21);
  }
  function v27(v28) {
    const v29 = v6 || v28?.["viewport"] || {},
      v30 =
        Number["isFinite"](v29["zoom"]) && v29["zoom"] > 0 ? v29["zoom"] : 1;
    return {
      x: Number["isFinite"](v29["x"]) ? v29["x"] : 0,
      y: Number["isFinite"](v29["y"]) ? v29["y"] : 0,
      zoom: v30,
    };
  }
  function v31(v32, v33, v34) {
    const v35 = v0["getStateRaw"](),
      v36 = typeof document !== "undefined" && document && document["body"];
    if (v36) document["body"]["classList"]["add"]("is-zooming");
    beginZoomFpsSession("wheel-zoom");
    const v37 = v27(v35),
      v38 = v34 > 0 ? 0.9 : 1.1,
      v39 = Math["min"](2, Math["max"](0.2, v37["zoom"] * v38)),
      v40 = v32 - (v32 - v37["x"]) * (v39 / v37["zoom"]),
      v41 = v33 - (v33 - v37["y"]) * (v39 / v37["zoom"]);
    (v25({ x: v40, y: v41, zoom: v39 }), v17(v12(v35, v39)));
    if (v1) clearTimeout(v1);
    v1 = setTimeout(() => {
      ((v1 = 0), v21());
      if (v36) document["body"]["classList"]["remove"]("is-zooming");
      (v17(false),
        endZoomFpsSession("wheel-zoom"),
        v0["markViewportPersist"]());
    }, v11);
    const v42 = typeof window !== "undefined" ? window : null;
    ((v4 = v42?.["_lastMx"] || v32), (v5 = v42?.["_lastMy"] || v33));
    if (v2) return;
    v2 = v19(() => {
      v2 = 0;
      const v43 =
        typeof v42?.["_v2UpdateSidePlusNow"] === "function"
          ? v42["_v2UpdateSidePlusNow"]
          : v42?.["_v2UpdateSidePlus"];
      typeof v43 === "function" && v43(v4, v5);
    });
  }
  return { handleWheel: v31 };
}
