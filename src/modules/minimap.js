import { calcWorldBounds } from "../core/math.js";
import { recordMinimapUpdateSample } from "./perf/perfProbe.js";
import { isNodeType } from "./registry.js";
const PAN_PREVIEW_MIN_INTERVAL_MS = 96,
  PAN_NODE_UPDATE_DELAY_MS = 180;
export function initMinimap(v0, v1) {
  const v2 = document["getElementById"]("minimapViewport"),
    v3 = document["getElementById"]("minimapWrapper");
  if (!v0 || !v2 || !v3) return;
  const v4 = new Map();
  let v5 = null,
    v6 = 1,
    v7 = 0,
    v8 = 0,
    v9 = 0,
    v10 = 0,
    v11 = -1,
    v12 = false,
    v13 = 0,
    v14 = 0,
    v15 = 1,
    v16 = null,
    v17 = null,
    v18 = null,
    v19 = null,
    v20 = null,
    v21 = null,
    v22 = 0,
    v23 = 0,
    v24 = false;
  function v25() {
    return typeof performance !== "undefined" &&
      performance &&
      typeof performance["now"] === "function"
      ? performance["now"]()
      : Date["now"]();
  }
  function v26(v27) {
    const v28 = Number(v27?.["_nodeCount"]);
    if (Number["isFinite"](v28)) return v28;
    return Object["keys"](v27?.["nodes"] || {})["length"];
  }
  function v29() {
    return !!document?.["body"]?.["classList"]?.["contains"]?.("is-panning");
  }
  function v30(v31) {
    if (typeof requestAnimationFrame === "function")
      return requestAnimationFrame(v31);
    return setTimeout(v31, 16);
  }
  function v32(v33) {
    if (!v33) return;
    if (typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(v33);
      return;
    }
    clearTimeout(v33);
  }
  function v34() {
    return { mapW: v0["clientWidth"] || 200, mapH: v0["clientHeight"] || 140 };
  }
  function v35(v36) {
    if (v36 && v36["width"] !== 0) return v36;
    return {
      minX: -1000,
      minY: -1000,
      maxX: 1000,
      maxY: 1000,
      width: 2000,
      height: 2000,
    };
  }
  function v37(v38) {
    const v39 = Number(v38?.["_nodeCount"]);
    if (Number["isFinite"](v39)) return v39 <= 0;
    return !v38?.["nodes"] || Object["keys"](v38["nodes"])["length"] === 0;
  }
  function v40(v41) {
    return {
      x: Number["isFinite"](Number(v41?.["x"])) ? Number(v41["x"]) : 0,
      y: Number["isFinite"](Number(v41?.["y"])) ? Number(v41["y"]) : 0,
      zoom: Number["isFinite"](Number(v41?.["zoom"])) ? Number(v41["zoom"]) : 1,
    };
  }
  function v42(v43, v44, v45 = {}) {
    const v46 = v35(v43),
      { mapW: v47, mapH: v48 } = v34(),
      v49 = Math["max"](v46["width"], 1000),
      v50 = Math["max"](v46["height"], 1000),
      v51 = Math["min"](v47 / v49, v48 / v50),
      v52 = (v47 - v49 * v51) / 2,
      v53 = (v48 - v50 * v51) / 2;
    ((v5 = v46),
      (v6 = v51),
      (v7 = v52),
      (v8 = v53),
      (v9 = v47),
      (v10 = v48),
      (v11 = Number["isFinite"](v44) ? v44 : -1),
      (v12 = v45["trackViewport"] === true));
    const v54 = v40(v45["viewport"]);
    return (
      (v13 = v54["x"]),
      (v14 = v54["y"]),
      (v15 = v54["zoom"]),
      (window["_v2MinimapScale"] = v51),
      {
        bounds: v46,
        scale: v51,
        offsetX: v52,
        offsetY: v53,
        mapW: v47,
        mapH: v48,
      }
    );
  }
  function v55(v56) {
    const v57 = v37(v56),
      v58 = calcWorldBounds(v56?.["nodes"] || {}, v56?.["viewport"]);
    return v42(v58, v56?.["_persistRev"], {
      trackViewport: v57,
      viewport: v57 ? v56?.["viewport"] : null,
    });
  }
  function v59(v60, { allowCached: allowCached = true } = {}) {
    const v61 = Number["isFinite"](v60?.["_persistRev"])
        ? v60["_persistRev"]
        : -1,
      v62 = v37(v60),
      v63 = v40(v60?.["viewport"]),
      { mapW: v64, mapH: v65 } = v34(),
      v66 = !!v5,
      v67 = v66 && v11 === v61,
      v68 = v66 && v9 === v64 && v10 === v65,
      v69 =
        v66 &&
        v12 === true &&
        v62 === true &&
        v13 === v63["x"] &&
        v14 === v63["y"] &&
        v15 === v63["zoom"];
    if (allowCached && v67 && ((!v62 && !v12) || v69)) {
      if (v68)
        return (
          (window["_v2MinimapScale"] = v6),
          {
            bounds: v5,
            scale: v6,
            offsetX: v7,
            offsetY: v8,
            mapW: v64,
            mapH: v65,
          }
        );
      return v42(v5, v61, { trackViewport: v62, viewport: v62 ? v63 : null });
    }
    return v55(v60);
  }
  function v70() {
    v18 = null;
    if (v29()) {
      v18 = setTimeout(v70, PAN_NODE_UPDATE_DELAY_MS);
      return;
    }
    !v16 && (v16 = v30(v71));
  }
  function v72(v73) {
    if (v17 === "both" || v73 === "both") v17 = "both";
    else v17 !== v73 ? (v17 = "both") : (v17 = v73);
    if (v29() && (v17 === "nodes" || v17 === "both")) {
      !v18 && (v18 = setTimeout(v70, PAN_NODE_UPDATE_DELAY_MS));
      return;
    }
    !v16 && (v16 = v30(v71));
  }
  function v71() {
    v16 = null;
    const v74 = v17;
    v17 = null;
    if (!v74) return;
    const v75 = v1["getStateRaw"]();
    v74 === "nodes" || v74 === "both" ? v76(v75) : v77(v75);
  }
  function v76(v78) {
    const v79 = v25(),
      v80 = v78?.["nodes"] || {},
      v81 = v78?.["viewport"] || { x: 0, y: 0, zoom: 1 },
      { bounds: v82, scale: v83, offsetX: v84, offsetY: v85 } = v55(v78),
      v86 = new Set();
    let v87 = 0,
      v88 = 0,
      v89 = 0;
    ((window["_v2MinimapDotMap"] = v4),
      Object["values"](v80)["forEach"]((v90) => {
        if (isNodeType(v90, "group")) return;
        v86["add"](v90["id"]);
        let v91 = v4["get"](v90["id"]);
        const v92 = v84 + (v90["x"] - v82["minX"]) * v83,
          v93 = v85 + (v90["y"] - v82["minY"]) * v83,
          v94 = Math["max"]((v90["width"] || 200) * v83, 2),
          v95 = Math["max"]((v90["height"] || 100) * v83, 2);
        !v91
          ? ((v91 = document["createElement"]("div")),
            (v91["id"] = "minimap-node-" + v90["id"]),
            v4["set"](v90["id"], v91),
            v0["appendChild"](v91),
            (v87 += 1))
          : (v88 += 1);
        let v96 = "default";
        const v97 = v90["type"] || "";
        if (v97["includes"]("text")) v96 = "text";
        else {
          if (v97["includes"]("image")) v96 = "image";
          else {
            if (v97["includes"]("video")) v96 = "video";
            else {
              if (v97["includes"]("audio")) v96 = "audio";
            }
          }
        }
        v91["className"] !== "minimap-node " + v96 &&
          (v91["className"] = "minimap-node " + v96);
        if (v91["style"]["left"] !== v92 + "px")
          v91["style"]["left"] = v92 + "px";
        if (v91["style"]["top"] !== v93 + "px")
          v91["style"]["top"] = v93 + "px";
        if (v91["style"]["width"] !== v94 + "px")
          v91["style"]["width"] = v94 + "px";
        if (v91["style"]["height"] !== v95 + "px")
          v91["style"]["height"] = v95 + "px";
      }),
      v4["forEach"]((v98, v99) => {
        !v86["has"](v99) && (v98["remove"](), v4["delete"](v99), (v89 += 1));
      }),
      v100(v81, v82, v83, v84, v85),
      recordMinimapUpdateSample("nodes", v25() - v79, {
        nodeCount: v26(v78),
        dotCount: v4["size"],
        createdCount: v87,
        updatedCount: v88,
        removedCount: v89,
        viewportOnly: false,
      }));
  }
  function v77(v101) {
    const v102 = v25(),
      v103 = v101?.["viewport"] || { x: 0, y: 0, zoom: 1 };
    if (!v5) {
      v76(v1["getStateRaw"]());
      return;
    }
    const v104 = Number["isFinite"](v101?.["_persistRev"])
      ? v101["_persistRev"]
      : -1;
    if (v11 !== v104) {
      v76(v1["getStateRaw"]());
      return;
    }
    const {
      bounds: v105,
      scale: v106,
      offsetX: v107,
      offsetY: v108,
    } = v59(v101, { allowCached: true });
    (v100(v103, v105, v106, v107, v108),
      recordMinimapUpdateSample("viewport", v25() - v102, {
        nodeCount: v26(v101),
        dotCount: v4["size"],
        viewportOnly: true,
      }));
  }
  function v100(v109, v110, v111, v112, v113) {
    const v114 = window["innerWidth"] / v109["zoom"],
      v115 = window["innerHeight"] / v109["zoom"],
      v116 = -v109["x"] / v109["zoom"],
      v117 = -v109["y"] / v109["zoom"],
      v118 = v112 + (v116 - v110["minX"]) * v111,
      v119 = v113 + (v117 - v110["minY"]) * v111,
      v120 = v114 * v111,
      v121 = v115 * v111;
    (v2["style"]["left"] !== v118 + "px" && (v2["style"]["left"] = v118 + "px"),
      v2["style"]["top"] !== v119 + "px" && (v2["style"]["top"] = v119 + "px"),
      v2["style"]["width"] !== v120 + "px" &&
        (v2["style"]["width"] = v120 + "px"),
      v2["style"]["height"] !== v121 + "px" &&
        (v2["style"]["height"] = v121 + "px"));
  }
  function v122() {
    if (v19) return;
    v19 = v30(v123);
  }
  function v123() {
    v19 = null;
    if (!v21) return;
    const v124 = v21;
    v21 = null;
    const v125 = v1["getStateRaw"](),
      v126 = { ...v125, viewport: v124 },
      v127 = v25(),
      {
        bounds: v128,
        scale: v129,
        offsetX: v130,
        offsetY: v131,
      } = v59(v126, { allowCached: true });
    (v100(v124, v128, v129, v130, v131),
      (v22 = v25()),
      (v23 += 1),
      recordMinimapUpdateSample("pan-preview", v22 - v127, {
        nodeCount: v26(v125),
        dotCount: v4["size"],
        viewportOnly: true,
        delayed: v24,
      }),
      (v24 = false));
  }
  function v132(v133, v134 = {}) {
    v21 = v40(v133);
    const v135 = v134["force"] === true,
      v136 = v25() - v22,
      v137 = v135 ? 0 : Math["max"](0, PAN_PREVIEW_MIN_INTERVAL_MS - v136);
    if (v137 <= 0) {
      v20 && (clearTimeout(v20), (v20 = null));
      ((v24 = false), v122());
      return;
    }
    !v20 &&
      ((v24 = true),
      (v20 = setTimeout(() => {
        ((v20 = null), v122());
      }, v137)));
  }
  function v138(v139 = null) {
    if (v139) v21 = v40(v139);
    return (
      v20 && (clearTimeout(v20), (v20 = null)),
      v19 && (v32(v19), (v19 = null)),
      v123(),
      v23
    );
  }
  const v140 = (v141, v142 = {}) => v132(v141, v142),
    v143 = (v144 = null) => v138(v144),
    v145 = () => v23;
  ((window["_v2ScheduleMinimapViewportPreview"] = v140),
    (window["_v2FlushMinimapViewportPreview"] = v143),
    (window["_v2GetMinimapPreviewFlushCount"] = v145));
  const v146 = v1["subscribeSelector"](
      (v147) => v147["_persistRev"] || 0,
      () => v72("nodes"),
    ),
    v148 = v1["subscribeSelector"](
      (v149) => v149["viewport"],
      () => v72("viewport"),
    );
  v72("both");
  const v150 = document["getElementById"]("v2-wrap");
  v150 &&
    (v150["style"]["removeProperty"]("--bg-x"),
    v150["style"]["removeProperty"]("--bg-y"),
    v150["style"]["removeProperty"]("--bg-zoom"));
  let v151 = false;
  const v152 = (v153) => {
    const v154 = v1["getStateRaw"](),
      { viewport: v155 } = v154,
      {
        bounds: v156,
        scale: v157,
        offsetX: v158,
        offsetY: v159,
      } = v59(v154, { allowCached: true }),
      v160 = v0["getBoundingClientRect"](),
      v161 = v153["clientX"] - v160["left"] - v158,
      v162 = v153["clientY"] - v160["top"] - v159,
      v163 = v156["minX"] + v161 / v157,
      v164 = v156["minY"] + v162 / v157,
      v165 = window["innerWidth"] / 2 - v163 * v155["zoom"],
      v166 = window["innerHeight"] / 2 - v164 * v155["zoom"];
    v1["updateViewport"](v165, v166, v155["zoom"]);
  };
  return (
    v3["addEventListener"]("pointerdown", (v167) => {
      (v167["stopPropagation"](),
        (v151 = true),
        v3["setPointerCapture"](v167["pointerId"]),
        v152(v167));
    }),
    v3["addEventListener"]("pointermove", (v168) => {
      if (!v151) return;
      v152(v168);
    }),
    v3["addEventListener"]("pointerup", (v169) => {
      ((v151 = false), v3["releasePointerCapture"](v169["pointerId"]));
    }),
    function v170() {
      (v146(),
        v148(),
        v16 && (v32(v16), (v16 = null)),
        v18 && (clearTimeout(v18), (v18 = null)),
        v19 && (v32(v19), (v19 = null)),
        v20 && (clearTimeout(v20), (v20 = null)),
        window["_v2ScheduleMinimapViewportPreview"] === v140 &&
          delete window["_v2ScheduleMinimapViewportPreview"],
        window["_v2FlushMinimapViewportPreview"] === v143 &&
          delete window["_v2FlushMinimapViewportPreview"],
        window["_v2GetMinimapPreviewFlushCount"] === v145 &&
          delete window["_v2GetMinimapPreviewFlushCount"],
        v4["forEach"]((v171) => v171["remove"]()),
        v4["clear"]());
    }
  );
}
