import {
  getPerfProbeSnapshot,
  isPerfProbeEnabled,
  resetPerfProbeData,
  setPerfProbeEnabled,
} from "./perfProbe.js";
const PERF_PANEL_ID = "perfProbePanel",
  REFRESH_INTERVAL_MS = 500;
function getDefaultDocument() {
  if (typeof document === "undefined") return null;
  return document;
}
function getDefaultWindow() {
  if (typeof window === "undefined") return null;
  return window;
}
function toFiniteNumber(v0, v1 = null) {
  const v2 = Number(v0);
  return Number["isFinite"](v2) ? v2 : v1;
}
function asArray(v3) {
  return Array["isArray"](v3) ? v3 : [];
}
function latestSample(v4) {
  const v5 = asArray(v4);
  return v5["length"] > 0 ? v5[v5["length"] - 1] : null;
}
function averageField(v6, v7) {
  const v8 = asArray(v6)
    ["map"]((v9) => toFiniteNumber(v9?.[v7]))
    ["filter"]((v10) => v10 !== null && v10 >= 0);
  if (v8["length"] === 0) return null;
  return v8["reduce"]((v11, v12) => v11 + v12, 0) / v8["length"];
}
function formatMs(v13) {
  const v14 = toFiniteNumber(v13);
  if (v14 === null) return "-";
  if (v14 === 0) return "0\x20ms";
  return v14["toFixed"](v14 >= 10 ? 1 : 2) + "\x20ms";
}
function formatFps(v15) {
  const v16 = toFiniteNumber(v15);
  if (v16 === null) return "-";
  return v16["toFixed"](v16 >= 100 ? 0 : 1) + " fps";
}
function formatCount(v17) {
  const v18 = toFiniteNumber(v17);
  if (v18 === null) return "-";
  return String(Math["round"](v18));
}
function formatDurationWithAverage(v19, v20) {
  if (!v20) return "-";
  const v21 = averageField(v19, "durationMs");
  return formatMs(v20["durationMs"]) + "\x20/\x20avg\x20" + formatMs(v21);
}
function formatFpsSession(v22) {
  if (!v22) return "-";
  return (
    formatFps(v22["avgFps"]) +
    " / " +
    formatCount(v22["frameCount"]) +
    " frames"
  );
}
export function formatPerfPanelRows(v23 = {}) {
  const v24 = asArray(v23["renderFrameSamples"]),
    v25 = asArray(v23["edgeRedrawSamples"]),
    v26 = asArray(v23["canvasPanSamples"]),
    v27 = asArray(v23["minimapUpdateSamples"]),
    v28 = latestSample(v24),
    v29 = latestSample(v25),
    v30 = latestSample(v26),
    v31 = latestSample(v27),
    v32 = latestSample(v23["panFpsSessions"]),
    v33 = latestSample(v23["zoomFpsSessions"]),
    v34 = latestSample(v23["dragFpsSessions"]),
    v35 = latestSample(v23["resizeFpsSessions"]),
    v36 = v28 || v30 || {},
    v37 = v23["staticMediaResourceSummary"] || {};
  return [
    { label: "Probe", value: v23["enabled"] === true ? "on" : "off" },
    { label: "Render", value: formatDurationWithAverage(v24, v28) },
    {
      label: "Nodes",
      value:
        formatCount(v36["mountedNodeCount"]) +
        " mounted / " +
        formatCount(v36["nodeCount"]) +
        " total",
    },
    {
      label: "Edges",
      value: v29
        ? formatDurationWithAverage(v25, v29) +
          " / " +
          formatCount(v29["visibleEdgeCount"]) +
          " visible"
        : "-",
    },
    {
      label: "Pan",
      value: v30
        ? formatDurationWithAverage(v26, v30) +
          " / " +
          formatCount(v30["moveCount"]) +
          " moves"
        : "-",
    },
    { label: "Pan FPS", value: formatFpsSession(v32) },
    { label: "Zoom FPS", value: formatFpsSession(v33) },
    { label: "Drag FPS", value: formatFpsSession(v34 || v35) },
    {
      label: "Minimap",
      value: v31
        ? formatDurationWithAverage(v27, v31) +
          " / " +
          formatCount(v31["dotCount"]) +
          " dots"
        : "-",
    },
    {
      label: "Media",
      value:
        formatCount(v37["staticMediaCount"]) +
        " static / " +
        formatCount(v37["derivedMediaCount"]) +
        " thumbs / " +
        formatCount(v37["cacheHitLikeCount"]) +
        " cached",
    },
  ];
}
function createTextElement(v38, v39, v40, v41) {
  const v42 = v38["createElement"](v39);
  return ((v42["className"] = v40), (v42["textContent"] = v41), v42);
}
function createPanelButton(v43, v44, v45, v46) {
  const v47 = v43["createElement"]("button");
  return (
    (v47["type"] = "button"),
    (v47["className"] = v44),
    (v47["title"] = v46),
    v47["setAttribute"]("aria-label", v46),
    (v47["textContent"] = v45),
    v47
  );
}
function createPerfPanel(v48) {
  const v49 = v48["createElement"]("section");
  ((v49["id"] = PERF_PANEL_ID),
    (v49["className"] = "perf-panel"),
    (v49["hidden"] = true),
    v49["setAttribute"]("aria-label", "Performance panel"),
    v49["setAttribute"]("aria-live", "polite"));
  const v50 = v48["createElement"]("div");
  v50["className"] = "perf-panel-head";
  const v51 = createTextElement(v48, "div", "perf-panel-title", "Perf"),
    v52 = v48["createElement"]("div");
  v52["className"] = "perf-panel-actions";
  const v53 = createPanelButton(
      v48,
      "perf-panel-action",
      "Reset",
      "Reset\x20performance\x20samples",
    ),
    v54 = createPanelButton(
      v48,
      "perf-panel-action perf-panel-action-close",
      "Close",
      "Close performance panel",
    );
  (v52["appendChild"](v53),
    v52["appendChild"](v54),
    v50["appendChild"](v51),
    v50["appendChild"](v52));
  const v55 = v48["createElement"]("div");
  return (
    (v55["className"] = "perf-panel-grid"),
    v49["appendChild"](v50),
    v49["appendChild"](v55),
    (v49["__perfPanelParts"] = {
      grid: v55,
      resetBtn: v53,
      closeBtn: v54,
      rows: [],
    }),
    v48["body"]?.["appendChild"](v49),
    v49
  );
}
function ensurePerfPanel(v56) {
  const v57 = v56["getElementById"](PERF_PANEL_ID);
  if (v57?.["__perfPanelParts"]) return v57;
  return (v57?.["remove"](), createPerfPanel(v56));
}
function renderPerfPanel(v58, v59) {
  const v60 = v58["__perfPanelParts"];
  if (!v60?.["grid"]) return;
  const v61 = v58["ownerDocument"];
  while (v60["rows"]["length"] < v59["length"]) {
    const v62 = v61["createElement"]("div");
    v62["className"] = "perf-panel-row";
    const v63 = createTextElement(v61, "span", "perf-panel-row-label", ""),
      v64 = createTextElement(v61, "span", "perf-panel-row-value", "");
    (v62["appendChild"](v63),
      v62["appendChild"](v64),
      v60["grid"]["appendChild"](v62),
      v60["rows"]["push"]({ row: v62, label: v63, value: v64 }));
  }
  while (v60["rows"]["length"] > v59["length"]) {
    const v65 = v60["rows"]["pop"]();
    v65?.["row"]?.["remove"]();
  }
  v59["forEach"]((v66, v67) => {
    const v68 = v60["rows"][v67];
    ((v68["label"]["textContent"] = v66["label"]),
      (v68["value"]["textContent"] = v66["value"]));
  });
}
export function initPerfPanelDevEntry({
  button: v69,
  documentRef: documentRef = getDefaultDocument(),
  windowRef: windowRef = getDefaultWindow(),
} = {}) {
  if (!v69 || !documentRef || !windowRef) return null;
  let v70 = false,
    v71 = null,
    v72 = false,
    v73 = false;
  const v74 = ensurePerfPanel(documentRef),
    v75 = v74["__perfPanelParts"];
  function v76() {
    return (
      windowRef["DEV_MODE"] === true ||
      documentRef["body"]?.["classList"]?.["contains"]("dev-mode") === true
    );
  }
  function v77(v78) {
    (v69["classList"]["toggle"]("is-active", v78 === true),
      v69["setAttribute"]("aria-pressed", v78 === true ? "true" : "false"),
      (v69["title"] =
        v78 === true ? "Close performance panel" : "Open performance panel"),
      v69["setAttribute"]("aria-label", v69["title"]));
  }
  function v79() {
    if (!v70) return;
    renderPerfPanel(v74, formatPerfPanelRows(getPerfProbeSnapshot()));
  }
  function v80() {
    if (v71 !== null) return;
    const v81 = windowRef["setInterval"]?.["bind"](windowRef) || setInterval;
    v71 = v81(v79, REFRESH_INTERVAL_MS);
  }
  function v82() {
    if (v71 === null) return;
    const v83 =
      windowRef["clearInterval"]?.["bind"](windowRef) || clearInterval;
    (v83(v71), (v71 = null));
  }
  function v84(v85) {
    const v86 = v85 === true && v76();
    if (v86 === v70) {
      if (v70) v79();
      return v70;
    }
    return (
      (v70 = v86),
      (v74["hidden"] = !v70),
      v77(v70),
      v70
        ? ((v72 = isPerfProbeEnabled()),
          (v73 = true),
          setPerfProbeEnabled(true),
          v79(),
          v80())
        : (v82(),
          v73 && (setPerfProbeEnabled(v72), (v73 = false), (v72 = false))),
      v70
    );
  }
  function v87(v88) {
    (v88?.["preventDefault"]?.(), v84(!v70));
  }
  function v89() {
    (resetPerfProbeData(), v79());
  }
  function v90() {
    v84(false);
  }
  function v91(v92) {
    const v93 = Boolean(v92?.["detail"]?.["enabled"] ?? windowRef["DEV_MODE"]);
    if (!v93) v84(false);
  }
  return (
    v69["addEventListener"]("click", v87),
    v75?.["resetBtn"]?.["addEventListener"]("click", v89),
    v75?.["closeBtn"]?.["addEventListener"]("click", v90),
    windowRef["addEventListener"]?.("dev-mode-changed", v91),
    v77(false),
    {
      isVisible() {
        return v70;
      },
      refresh: v79,
      setVisible: v84,
      destroy() {
        (v84(false),
          v69["removeEventListener"]("click", v87),
          v75?.["resetBtn"]?.["removeEventListener"]("click", v89),
          v75?.["closeBtn"]?.["removeEventListener"]("click", v90),
          windowRef["removeEventListener"]?.("dev-mode-changed", v91),
          v74["remove"]());
      },
    }
  );
}
