import {
  beginResizeFpsSession,
  endResizeFpsSession,
} from "../perf/perfProbe.js";
const RESIZE_BODY_CLASS = "is-node-resizing",
  RESIZE_NODE_CLASS = "is-resizing";
function requestFrame(v0) {
  if (typeof requestAnimationFrame === "function")
    return requestAnimationFrame(v0);
  return setTimeout(v0, 0);
}
function cancelFrame(v1) {
  if (!v1) return;
  if (typeof cancelAnimationFrame === "function") {
    cancelAnimationFrame(v1);
    return;
  }
  clearTimeout(v1);
}
function toFiniteNumber(v2, v3) {
  const v4 = Number(v2);
  return Number["isFinite"](v4) ? v4 : v3;
}
function normalizeSize(v5, v6, v7) {
  return {
    width: Math["max"](1, toFiniteNumber(v5?.["width"], v6)),
    height: Math["max"](1, toFiniteNumber(v5?.["height"], v7)),
  };
}
function sizesEqual(v8, v9) {
  return (
    Math["round"](toFiniteNumber(v8?.["width"], 0)) ===
      Math["round"](toFiniteNumber(v9?.["width"], 0)) &&
    Math["round"](toFiniteNumber(v8?.["height"], 0)) ===
      Math["round"](toFiniteNumber(v9?.["height"], 0))
  );
}
function applyPreviewSize(v10, v11) {
  if (!v10?.["style"]) return;
  ((v10["style"]["width"] = v11["width"] + "px"),
    (v10["style"]["height"] = v11["height"] + "px"));
}
function syncPreviewGeometry(v12, v13, v14, v15) {
  const v16 = typeof window !== "undefined" ? window : null;
  if (!v16 || !v12 || !v13) return;
  v16["v2Renderer"]?.["previewNodeResizeGeometry"]?.({
    nodeId: v12,
    width: v13["width"],
    height: v13["height"],
  });
  const v17 =
    typeof v16["_v2UpdateSidePlusNow"] === "function"
      ? v16["_v2UpdateSidePlusNow"]
      : v16["_v2UpdateSidePlus"];
  if (typeof v17 !== "function") return;
  v17(
    Number["isFinite"](v16["_lastMx"]) ? v16["_lastMx"] : v14,
    Number["isFinite"](v16["_lastMy"]) ? v16["_lastMy"] : v15,
    {
      nodeSizeOverrides: {
        [v12]: { width: v13["width"], height: v13["height"] },
      },
    },
  );
}
function readViewportZoom(v18) {
  const v19 = (typeof v18 === "function" && v18()) || { zoom: 1 };
  return Math["max"](0.01, toFiniteNumber(v19["zoom"], 1));
}
export function startNodeResizePreview({
  event: v20,
  nodeId: v21,
  getNode: v22,
  getViewport: v23,
  resolveSize: v24,
  applyPatch: v25,
  buildFinalPatch: v26,
  afterApply: v27,
  onPreview: v28,
  onPreviewEnd: v29,
  commit: v30,
  label: label = "node-resize",
} = {}) {
  if (!v20 || !v21 || typeof v24 !== "function") return false;
  (v20["preventDefault"]?.(), v20["stopPropagation"]?.());
  const v31 = (typeof v22 === "function" && v22()) || {},
    v32 = toFiniteNumber(v20["clientX"], 0),
    v33 = toFiniteNumber(v20["clientY"], 0),
    v34 = Math["max"](1, toFiniteNumber(v31["width"], 260)),
    v35 = Math["max"](1, toFiniteNumber(v31["height"], 260)),
    v36 = { width: v34, height: v35 },
    v37 =
      typeof document !== "undefined" ? document["getElementById"](v21) : null,
    v38 = typeof document !== "undefined" ? document["body"] : null;
  let v39 = null,
    v40 = v36,
    v41 = v32,
    v42 = v33,
    v43 = 0,
    v44 = false;
  const v45 = () => {
      v43 = 0;
      if (!v39) return;
      ((v40 = v39),
        (v39 = null),
        applyPreviewSize(v37, v40),
        syncPreviewGeometry(v21, v40, v41, v42),
        v28?.(v40));
    },
    v46 = (v47) => {
      v39 = v47;
      if (v43) return;
      v43 = requestFrame(v45);
    },
    v48 = () => {
      (v43 && (cancelFrame(v43), (v43 = 0)),
        window["removeEventListener"]("pointermove", v49),
        window["removeEventListener"]("pointerup", v50),
        window["removeEventListener"]("pointercancel", v50),
        v38?.["classList"]?.["remove"](RESIZE_BODY_CLASS),
        v37?.["classList"]?.["remove"](RESIZE_NODE_CLASS),
        v29?.(),
        endResizeFpsSession(label));
    },
    v51 = () => {
      const v52 = v39 || v40;
      if (v39) v45();
      const v53 =
          (typeof v26 === "function" &&
            v26({ startNode: v31, startSize: v36, finalSize: v52 })) ||
          {},
        v54 = Object["keys"](v53)["length"] > 0,
        v55 = !sizesEqual(v52, v36);
      let v56 = false;
      (v55 || v54) &&
        typeof v25 === "function" &&
        (v25({ width: v52["width"], height: v52["height"], ...v53 }),
        (v56 = true));
      syncPreviewGeometry(v21, v52, v41, v42);
      const v57 =
        typeof v27 === "function" &&
        v27({
          startNode: v31,
          startSize: v36,
          finalSize: v52,
          didApply: v56,
        }) === true;
      (v56 || v57) && typeof v30 === "function" && v30();
    };
  function v49(v58) {
    if (v44) return;
    ((v41 = toFiniteNumber(v58["clientX"], v41)),
      (v42 = toFiniteNumber(v58["clientY"], v42)));
    const v59 = readViewportZoom(v23),
      v60 = (v41 - v32) / v59,
      v61 = (v42 - v33) / v59,
      v62 = normalizeSize(
        v24({
          startNode: v31,
          startWidth: v34,
          startHeight: v35,
          dx: v60,
          dy: v61,
          event: v58,
        }),
        v34,
        v35,
      );
    if (v39 && sizesEqual(v39, v62)) return;
    if (!v39 && sizesEqual(v40, v62)) return;
    v46(v62);
  }
  function v50() {
    if (v44) return;
    ((v44 = true), v48(), v51());
  }
  return (
    v38?.["classList"]?.["add"](RESIZE_BODY_CLASS),
    v37?.["classList"]?.["add"](RESIZE_NODE_CLASS),
    beginResizeFpsSession(label),
    window["addEventListener"]("pointermove", v49),
    window["addEventListener"]("pointerup", v50),
    window["addEventListener"]("pointercancel", v50),
    true
  );
}
