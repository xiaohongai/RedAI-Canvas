import { createViewportFocusController } from "../../core/viewportFocus.js";
import { CANVAS_LOW_ZOOM_LOD_THRESHOLD } from "../canvasImageLod.js";
import { installProviderIconLodController } from "../providerIconLod.js";
const TEXT_LOD_ZOOM = CANVAS_LOW_ZOOM_LOD_THRESHOLD;
export function createAppViewport({
  graphStore: v0,
  uiStore: v1,
  wrap: v2,
  debugEl: v3,
  zoomSliderEl: v4,
  zoomPercentEl: v5,
  fitActionEl: v6,
} = {}) {
  let v7 = false,
    v8 = null,
    v9 = 0,
    v10 = null,
    v11 = true,
    v12 = 0;
  const v13 = installProviderIconLodController({
    rootEl: v2 || document,
    store: v0,
  });
  function v14(v15) {
    (document["body"]["classList"]["toggle"]("is-zoom-low", v15),
      v13?.["scheduleSync"]?.());
  }
  function v16(v17) {
    const v18 = Math["round"](((v17 - 0.2) / 1.8) * 100),
      v19 = Math["max"](0, Math["min"](v18, 100));
    if (v5) v5["textContent"] = v19 + "%";
    if (v4) v4["value"] = String(v19);
  }
  function v20(v21) {
    if (v11 === v21) return;
    v11 = v21;
    const v22 = document["getElementById"]("v2-server-disconnect-alert");
    v22 && (v22["style"]["display"] = v21 ? "none" : "block");
  }
  function v23() {
    const v24 =
      typeof window["_v2UpdateSidePlusNow"] === "function"
        ? window["_v2UpdateSidePlusNow"]
        : window["_v2UpdateSidePlus"];
    if (typeof v24 !== "function") return;
    const v25 = Number(window["_lastMx"]),
      v26 = Number(window["_lastMy"]);
    v24(
      Number["isFinite"](v25) ? v25 : undefined,
      Number["isFinite"](v26) ? v26 : undefined,
    );
  }
  (v0["subscribeSelector"](
    (v27) => v27["viewport"]?.["zoom"],
    (v28) => {
      if (typeof v28 !== "number") return;
      if (!v7) v16(v28);
      const v29 = v28 <= TEXT_LOD_ZOOM;
      v7 ? (v10 = v29) : ((v10 = null), v14(v29));
    },
  ),
    v1["subscribeSelector"](
      (v30) => v30["isServerConnected"],
      (v31) => {
        v20(v31);
      },
    ),
    v0["subscribeSelector"](
      (v32) => {
        const v33 = v32["viewport"] ?? {},
          v34 = Number(v33["x"]) || 0,
          v35 = Number(v33["y"]) || 0,
          v36 = Number(v33["zoom"]) || 1,
          v37 =
            v32["_nodeCount"] ?? Object["keys"](v32["nodes"] || {})["length"];
        return v34 + "|" + v35 + "|" + v36 + "|" + v37;
      },
      (v38) => {
        if (!v3) return;
        const v39 = performance["now"]();
        if (v39 - v12 < 120) return;
        v12 = v39;
        const [v40, v41, v42, v43] = String(v38 || "")["split"]("|"),
          v44 = Number(v40) || 0,
          v45 = Number(v41) || 0,
          v46 = Number(v42) || 1,
          v47 = Number(v43) || 0;
        v3["textContent"] =
          "V2 Sandbox | Nodes: " +
          v47 +
          "\x20|\x20x:\x20" +
          v44["toFixed"](0) +
          " y: " +
          v45["toFixed"](0) +
          " z: " +
          v46["toFixed"](2) +
          "\x20";
      },
    ));
  function v48(v49, v50, v51, v52, v53, v54, v55 = 800) {
    v8 !== null && (cancelAnimationFrame(v8), (v8 = null));
    const v56 = ++v9,
      v57 = performance["now"]();
    ((v7 = true),
      document["body"]["classList"]["add"]("is-viewport-animating"));
    const v58 = (v59) => 1 - Math["pow"](1 - v59, 3);
    function v60(v61) {
      if (v56 !== v9) return;
      const v62 = v61 - v57,
        v63 = Math["min"](v62 / v55, 1),
        v64 = v58(v63);
      (v0["updateViewport"](
        v49 + (v52 - v49) * v64,
        v50 + (v53 - v50) * v64,
        v51 + (v54 - v51) * v64,
      ),
        v23());
      if (v63 < 1) {
        v8 = requestAnimationFrame(v60);
        return;
      }
      ((v8 = null),
        (v7 = false),
        document["body"]["classList"]["remove"]("is-viewport-animating"),
        v10 !== null && (v14(v10), (v10 = null)),
        v0["markViewportPersist"]?.(),
        v16(v0["getState"]()["viewport"]["zoom"]),
        v23());
    }
    v8 = requestAnimationFrame(v60);
  }
  function v65() {
    (v8 !== null && (cancelAnimationFrame(v8), (v8 = null)),
      (v9 += 1),
      (v7 = false),
      document["body"]["classList"]["remove"]("is-viewport-animating"),
      v10 !== null && (v14(v10), (v10 = null)));
  }
  const v66 = createViewportFocusController({
    store: v0,
    animateViewport: v48,
    cancelAnimation: v65,
    containerEl: v2,
  });
  return (
    v4 &&
      v4["addEventListener"]("input", (v67) => {
        const v68 = parseInt(v67["target"]["value"], 10),
          v69 = 0.2 + (v68 / 100) * 1.8,
          { viewport: v70 } = v0["getState"]();
        v66?.["clearTrackedFocus"]("zoom-slider");
        if (v5) v5["textContent"] = v68 + "%";
        const v71 = window["innerWidth"] / 2,
          v72 = window["innerHeight"] / 2,
          v73 = v71 - (v71 - v70["x"]) * (v69 / v70["zoom"]),
          v74 = v72 - (v72 - v70["y"]) * (v69 / v70["zoom"]);
        v0["updateViewport"](v73, v74, v69);
      }),
    v6?.["addEventListener"]("click", () => {
      const v75 = Object["keys"](v0["getState"]()["nodes"] || {});
      v66?.["focusNodes"](v75, 80, 800);
    }),
    {
      animateViewport: v48,
      cancelViewportAnimation: v65,
      focusNode: (...v76) => v66?.["focusNode"](...v76),
      focusNodeAtZoomPercent: (...v77) =>
        v66?.["focusNodeAtZoomPercent"](...v77),
      focusNodes: (...v78) => v66?.["focusNodes"](...v78),
      clearTrackedFocus: (...v79) => v66?.["clearTrackedFocus"](...v79),
      installWindowBindings(v80 = window) {
        ((v80["v2AnimateViewport"] = v48),
          (v80["v2FocusOnNode"] = (v81, v82 = 120, v83 = 1500, v84) =>
            v66?.["focusNode"](v81, v82, v83, v84)),
          (v80["v2FocusOnNodeAtZoomPercent"] = (v85, v86 = 60, v87 = 800) =>
            v66?.["focusNodeAtZoomPercent"](v85, v86, v87)),
          (v80["v2FocusOnNodes"] = (v88, v89 = 80, v90 = 800, v91) =>
            v66?.["focusNodes"](v88, v89, v90, v91)));
      },
    }
  );
}
