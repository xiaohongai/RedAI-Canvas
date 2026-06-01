const PERF_STORE_KEY = "__aicPerfProbeStore",
  DRAG_FPS_SESSION_LIMIT = 50,
  PAN_FPS_SESSION_LIMIT = 50,
  ZOOM_FPS_SESSION_LIMIT = 50,
  RESIZE_FPS_SESSION_LIMIT = 50,
  CANVAS_PAN_SAMPLE_LIMIT = 120,
  EDGE_REDRAW_SAMPLE_LIMIT = 240,
  RENDER_FRAME_SAMPLE_LIMIT = 240,
  MINIMAP_UPDATE_SAMPLE_LIMIT = 240,
  STATIC_MEDIA_SAMPLE_LIMIT = 20,
  DERIVED_STATIC_MEDIA_PREFIXES = Object["freeze"]([
    "/data/uploads/_derived/",
    "/data/assets/_derived/",
    "/data/assets/derived/",
    "/output/_derived/",
    "/output/VideoThumbs/",
  ]),
  STATIC_VIDEO_PREFIXES = Object["freeze"]([
    "/output/",
    "/data/uploads/",
    "/data/assets/",
  ]),
  STATIC_VIDEO_EXTENSIONS = Object["freeze"]([
    ".mp4",
    ".webm",
    ".mov",
    ".m4v",
    ".mkv",
    ".mpeg",
    ".mpg",
    ".avi",
  ]);
function getGlobalWindow() {
  if (typeof window === "undefined") return null;
  return window;
}
function toFiniteNumber(v0, v1 = 0) {
  const v2 = Number(v0);
  return Number["isFinite"](v2) ? v2 : v1;
}
function pushCapped(v3, v4, v5) {
  if (!Array["isArray"](v3)) return;
  v3["push"](v4);
  const v6 = v3["length"] - v5;
  if (v6 > 0) v3["splice"](0, v6);
}
function normalizeResourcePath(v7) {
  const v8 = String(v7 || "")["trim"]();
  if (!v8) return "";
  try {
    const v9 = getGlobalWindow()?.["location"]?.["href"] || "http://127.0.0.1/";
    return new URL(v8, v9)["pathname"]["replace"](/\\/g, "/");
  } catch {
    return v8["split"]("?")[0]["split"]("#")[0]["replace"](/\\/g, "/");
  }
}
function hasAnyPrefix(v10, v11) {
  return v11["some"]((v12) => v10["startsWith"](v12));
}
function isDerivedStaticMediaPath(v13) {
  return hasAnyPrefix(v13, DERIVED_STATIC_MEDIA_PREFIXES);
}
function isStaticVideoPath(v14) {
  if (!hasAnyPrefix(v14, STATIC_VIDEO_PREFIXES)) return false;
  const v15 = v14["toLowerCase"]();
  return STATIC_VIDEO_EXTENSIONS["some"]((v16) => v15["endsWith"](v16));
}
function getDomMediaSources() {
  const v17 = getGlobalWindow()?.["document"];
  if (!v17 || typeof v17["querySelectorAll"] !== "function") return [];
  const v18 = [],
    v19 = v17["querySelectorAll"]("img, video, audio, source, image") || [];
  for (const v20 of v19) {
    const v21 =
        v20?.["currentSrc"] ||
        v20?.["src"] ||
        (typeof v20?.["getAttribute"] === "function" &&
          (v20["getAttribute"]("src") ||
            v20["getAttribute"]("href") ||
            v20["getAttribute"]("xlink:href"))) ||
        "",
      v22 = normalizeResourcePath(v21);
    if (!v22) continue;
    v18["push"]({
      path: v22,
      tagName: String(v20?.["tagName"] || "")["toLowerCase"](),
    });
  }
  return v18;
}
function createEmptyStaticMediaSummary(v23 = 0) {
  return {
    resourceCount: v23,
    staticMediaCount: 0,
    derivedMediaCount: 0,
    cacheableVideoCount: 0,
    cacheHitLikeCount: 0,
    transferSize: 0,
    encodedBodySize: 0,
    decodedBodySize: 0,
    domMediaElementCount: 0,
    sampledResources: [],
  };
}
function summarizeStaticMediaResources() {
  const v24 = getGlobalWindow(),
    v25 = v24?.["performance"] || globalThis["performance"],
    v26 =
      v25 && typeof v25["getEntriesByType"] === "function"
        ? v25["getEntriesByType"]["bind"](v25)
        : null,
    v27 = v26 ? v26("resource") || [] : [],
    v28 = [],
    v29 = createEmptyStaticMediaSummary(v27["length"]);
  v29["sampledResources"] = v28;
  const v30 = new Set();
  for (const v31 of v27) {
    const v32 = normalizeResourcePath(v31?.["name"]),
      v33 = isDerivedStaticMediaPath(v32),
      v34 = isStaticVideoPath(v32);
    if (!v33 && !v34) continue;
    v30["add"](v32);
    const v35 = toFiniteNumber(v31?.["transferSize"], 0),
      v36 = toFiniteNumber(v31?.["encodedBodySize"], 0),
      v37 = toFiniteNumber(v31?.["decodedBodySize"], 0);
    v29["staticMediaCount"] += 1;
    if (v33) v29["derivedMediaCount"] += 1;
    if (v34) v29["cacheableVideoCount"] += 1;
    if (v35 === 0 && v36 > 0) v29["cacheHitLikeCount"] += 1;
    ((v29["transferSize"] += v35),
      (v29["encodedBodySize"] += v36),
      (v29["decodedBodySize"] += v37),
      pushCapped(
        v28,
        {
          path: v32,
          initiatorType: String(v31?.["initiatorType"] || ""),
          transferSize: v35,
          encodedBodySize: v36,
          durationMs: toFiniteNumber(v31?.["duration"], 0),
          derived: v33,
          staticVideo: v34,
          source: "resource",
        },
        STATIC_MEDIA_SAMPLE_LIMIT,
      ));
  }
  for (const v38 of getDomMediaSources()) {
    const v39 = isDerivedStaticMediaPath(v38["path"]),
      v40 = isStaticVideoPath(v38["path"]);
    if (!v39 && !v40) continue;
    v29["domMediaElementCount"] += 1;
    if (v30["has"](v38["path"])) continue;
    (v30["add"](v38["path"]), (v29["staticMediaCount"] += 1));
    if (v39) v29["derivedMediaCount"] += 1;
    if (v40) v29["cacheableVideoCount"] += 1;
    pushCapped(
      v28,
      {
        path: v38["path"],
        initiatorType: v38["tagName"] || "dom",
        transferSize: 0,
        encodedBodySize: 0,
        durationMs: 0,
        derived: v39,
        staticVideo: v40,
        source: "dom",
      },
      STATIC_MEDIA_SAMPLE_LIMIT,
    );
  }
  return v29;
}
function percentile(v41, v42) {
  if (!Array["isArray"](v41) || v41["length"] === 0) return 0;
  const v43 = Math["min"](1, Math["max"](0, Number(v42) / 100)),
    v44 = Math["ceil"](v43 * v41["length"]) - 1;
  return v41[Math["max"](0, v44)];
}
function summarize(v45) {
  const v46 = (v45 || [])
    ["map"]((v47) => toFiniteNumber(v47, NaN))
    ["filter"]((v48) => Number["isFinite"](v48) && v48 > 0)
    ["sort"]((v49, v50) => v49 - v50);
  if (v46["length"] === 0) return { count: 0, avg: 0, p50: 0, p95: 0 };
  const v51 = v46["reduce"]((v52, v53) => v52 + v53, 0);
  return {
    count: v46["length"],
    avg: v51 / v46["length"],
    p50: percentile(v46, 50),
    p95: percentile(v46, 95),
  };
}
function bindHelpers(v54) {
  const v55 = getGlobalWindow();
  if (!v55) return;
  ((v55["__resetPerfProbe"] = resetPerfProbeData),
    (v55["__getPerfProbeSnapshot"] = getPerfProbeSnapshot),
    (v55["__setPerfProbeEnabled"] = (v56) => {
      v54["enabled"] = !!v56;
    }));
}
function ensureStore() {
  const v57 = getGlobalWindow();
  if (!v57) return null;
  !v57[PERF_STORE_KEY] &&
    (v57[PERF_STORE_KEY] = {
      enabled: v57["__perfProbeEnabled"] === true,
      dragSessions: {},
      dragFpsSessions: [],
      panSessions: {},
      panFpsSessions: [],
      canvasPanSamples: [],
      zoomSessions: {},
      zoomFpsSessions: [],
      resizeSessions: {},
      resizeFpsSessions: [],
      edgeRedrawSamples: [],
      renderFrameSamples: [],
      minimapUpdateSamples: [],
    });
  const v58 = v57[PERF_STORE_KEY];
  (!v58["dragSessions"] || typeof v58["dragSessions"] !== "object") &&
    (v58["dragSessions"] = {});
  if (!Array["isArray"](v58["dragFpsSessions"])) v58["dragFpsSessions"] = [];
  (!v58["panSessions"] || typeof v58["panSessions"] !== "object") &&
    (v58["panSessions"] = {});
  if (!Array["isArray"](v58["panFpsSessions"])) v58["panFpsSessions"] = [];
  if (!Array["isArray"](v58["canvasPanSamples"])) v58["canvasPanSamples"] = [];
  (!v58["zoomSessions"] || typeof v58["zoomSessions"] !== "object") &&
    (v58["zoomSessions"] = {});
  if (!Array["isArray"](v58["zoomFpsSessions"])) v58["zoomFpsSessions"] = [];
  (!v58["resizeSessions"] || typeof v58["resizeSessions"] !== "object") &&
    (v58["resizeSessions"] = {});
  if (!Array["isArray"](v58["resizeFpsSessions"]))
    v58["resizeFpsSessions"] = [];
  if (!Array["isArray"](v58["edgeRedrawSamples"]))
    v58["edgeRedrawSamples"] = [];
  if (!Array["isArray"](v58["renderFrameSamples"]))
    v58["renderFrameSamples"] = [];
  return (
    !Array["isArray"](v58["minimapUpdateSamples"]) &&
      (v58["minimapUpdateSamples"] = []),
    v57["__perfProbeEnabled"] === true && (v58["enabled"] = true),
    bindHelpers(v58),
    v58
  );
}
function isEnabled(v59) {
  return !!(v59 && v59["enabled"] === true);
}
export function isPerfProbeEnabled() {
  return isEnabled(ensureStore());
}
export function setPerfProbeEnabled(v60) {
  const v61 = ensureStore();
  if (!v61) return false;
  v61["enabled"] = v60 === true;
  const v62 = getGlobalWindow();
  if (v62) v62["__perfProbeEnabled"] = v61["enabled"];
  return v61["enabled"];
}
function nowMs() {
  if (
    typeof performance !== "undefined" &&
    typeof performance["now"] === "function"
  )
    return performance["now"]();
  return Date["now"]();
}
function requestProbeFrame(v63) {
  if (typeof requestAnimationFrame === "function")
    return requestAnimationFrame(v63);
  return setTimeout(() => v63(nowMs()), 16);
}
function cancelProbeFrame(v64) {
  if (v64 === null || v64 === undefined) return;
  if (typeof cancelAnimationFrame === "function") {
    cancelAnimationFrame(v64);
    return;
  }
  clearTimeout(v64);
}
function beginFpsSession(v65, v66, v67, v68) {
  if (!isEnabled(v65)) return;
  const v69 = String(v67 || v68),
    v70 = v65[v66] || {};
  v65[v66] = v70;
  if (v70[v69]) return;
  const v71 = {
      label: v69,
      startedAt: Date["now"](),
      startedAtPerf: nowMs(),
      prevTs: null,
      frameIntervals: [],
      rafId: null,
    },
    v72 = (v73) => {
      if (!v70[v69]) return;
      if (v71["prevTs"] !== null) {
        const v74 = v73 - v71["prevTs"];
        Number["isFinite"](v74) &&
          v74 > 0 &&
          v71["frameIntervals"]["push"](v74);
      }
      ((v71["prevTs"] = v73), (v71["rafId"] = requestProbeFrame(v72)));
    };
  ((v71["rafId"] = requestProbeFrame(v72)), (v70[v69] = v71));
}
function endFpsSession(v75, v76, v77, v78, v79, v80) {
  if (!isEnabled(v75)) return null;
  const v81 = String(v79 || v80),
    v82 = v75[v76] || {},
    v83 = v82[v81];
  if (!v83) return null;
  v83["rafId"] !== null && cancelProbeFrame(v83["rafId"]);
  const v84 = v83["frameIntervals"]
      ["map"]((v85) => (v85 > 0 ? 1000 / v85 : 0))
      ["filter"]((v86) => Number["isFinite"](v86) && v86 > 0),
    v87 = summarize(v84),
    v88 = {
      label: v83["label"],
      startedAt: v83["startedAt"],
      endedAt: Date["now"](),
      durationMs: Math["max"](0, nowMs() - v83["startedAtPerf"]),
      frameCount: v87["count"],
      avgFps: v87["avg"],
      p50Fps: v87["p50"],
      p95Fps: v87["p95"],
    };
  return (pushCapped(v75[v77], v88, v78), delete v82[v81], v88);
}
export function beginDragFpsSession(v89 = "node-drag") {
  beginFpsSession(ensureStore(), "dragSessions", v89, "node-drag");
}
export function endDragFpsSession(v90 = "node-drag") {
  return endFpsSession(
    ensureStore(),
    "dragSessions",
    "dragFpsSessions",
    DRAG_FPS_SESSION_LIMIT,
    v90,
    "node-drag",
  );
}
export function beginPanFpsSession(v91 = "canvas-pan") {
  beginFpsSession(ensureStore(), "panSessions", v91, "canvas-pan");
}
export function endPanFpsSession(v92 = "canvas-pan") {
  return endFpsSession(
    ensureStore(),
    "panSessions",
    "panFpsSessions",
    PAN_FPS_SESSION_LIMIT,
    v92,
    "canvas-pan",
  );
}
export function beginZoomFpsSession(v93 = "wheel-zoom") {
  beginFpsSession(ensureStore(), "zoomSessions", v93, "wheel-zoom");
}
export function endZoomFpsSession(v94 = "wheel-zoom") {
  return endFpsSession(
    ensureStore(),
    "zoomSessions",
    "zoomFpsSessions",
    ZOOM_FPS_SESSION_LIMIT,
    v94,
    "wheel-zoom",
  );
}
export function beginResizeFpsSession(v95 = "node-resize") {
  beginFpsSession(ensureStore(), "resizeSessions", v95, "node-resize");
}
export function endResizeFpsSession(v96 = "node-resize") {
  return endFpsSession(
    ensureStore(),
    "resizeSessions",
    "resizeFpsSessions",
    RESIZE_FPS_SESSION_LIMIT,
    v96,
    "node-resize",
  );
}
export function recordEdgeRedrawSample(v97, v98, v99 = {}) {
  const v100 = ensureStore();
  if (!isEnabled(v100)) return;
  const v101 = toFiniteNumber(v98, 0);
  if (!Number["isFinite"](v101) || v101 < 0) return;
  const v102 = {
    mode: String(v97 || "unknown"),
    durationMs: v101,
    reason: String(v99["reason"] || ""),
    edgeCount: toFiniteNumber(v99["edgeCount"], 0),
    visibleEdgeCount: toFiniteNumber(v99["visibleEdgeCount"], 0),
    updatedCount: toFiniteNumber(v99["updatedCount"], 0),
    createdCount: toFiniteNumber(v99["createdCount"], 0),
    removedCount: toFiniteNumber(v99["removedCount"], 0),
    reusedCount: toFiniteNumber(v99["reusedCount"], 0),
    skippedInvisibleCount: toFiniteNumber(v99["skippedInvisibleCount"], 0),
    cacheSize: toFiniteNumber(v99["cacheSize"], 0),
    layoutReadMs: toFiniteNumber(v99["layoutReadMs"], 0),
    pathBuildMs: toFiniteNumber(v99["pathBuildMs"], 0),
    domWriteMs: toFiniteNumber(v99["domWriteMs"], 0),
    clearedDom: v99["clearedDom"] === true,
    at: Date["now"](),
  };
  pushCapped(v100["edgeRedrawSamples"], v102, EDGE_REDRAW_SAMPLE_LIMIT);
}
export function recordCanvasPanSample(v103 = {}) {
  const v104 = ensureStore();
  if (!isEnabled(v104)) return;
  pushCapped(
    v104["canvasPanSamples"],
    {
      durationMs: toFiniteNumber(v103["durationMs"], 0),
      moveCount: toFiniteNumber(v103["moveCount"], 0),
      committed: v103["committed"] === true,
      nodeCount: toFiniteNumber(v103["nodeCount"], 0),
      edgeCount: toFiniteNumber(v103["edgeCount"], 0),
      mountedNodeCount: toFiniteNumber(v103["mountedNodeCount"], 0),
      minimapPreviewCount: toFiniteNumber(v103["minimapPreviewCount"], 0),
      finalX: toFiniteNumber(v103["finalX"], 0),
      finalY: toFiniteNumber(v103["finalY"], 0),
      finalZoom: toFiniteNumber(v103["finalZoom"], 1),
      at: Date["now"](),
    },
    CANVAS_PAN_SAMPLE_LIMIT,
  );
}
export function recordMinimapUpdateSample(v105, v106, v107 = {}) {
  const v108 = ensureStore();
  if (!isEnabled(v108)) return;
  pushCapped(
    v108["minimapUpdateSamples"],
    {
      mode: String(v105 || "unknown"),
      durationMs: toFiniteNumber(v106, 0),
      nodeCount: toFiniteNumber(v107["nodeCount"], 0),
      dotCount: toFiniteNumber(v107["dotCount"], 0),
      createdCount: toFiniteNumber(v107["createdCount"], 0),
      updatedCount: toFiniteNumber(v107["updatedCount"], 0),
      removedCount: toFiniteNumber(v107["removedCount"], 0),
      viewportOnly: v107["viewportOnly"] === true,
      delayed: v107["delayed"] === true,
      at: Date["now"](),
    },
    MINIMAP_UPDATE_SAMPLE_LIMIT,
  );
}
export function recordRenderFrameSample(v109 = {}) {
  const v110 = ensureStore();
  if (!isEnabled(v110)) return;
  const v111 = toFiniteNumber(v109["durationMs"], 0);
  if (!Number["isFinite"](v111) || v111 < 0) return;
  pushCapped(
    v110["renderFrameSamples"],
    {
      mode: String(v109["mode"] || "unknown"),
      durationMs: v111,
      nodeCount: toFiniteNumber(v109["nodeCount"], 0),
      edgeCount: toFiniteNumber(v109["edgeCount"], 0),
      mountedNodeCount: toFiniteNumber(v109["mountedNodeCount"], 0),
      parkedNodeCount: toFiniteNumber(v109["parkedNodeCount"], 0),
      at: Date["now"](),
    },
    RENDER_FRAME_SAMPLE_LIMIT,
  );
}
export function resetPerfProbeData() {
  const v112 = ensureStore();
  if (!v112) return;
  for (const v113 of Object["values"](v112["dragSessions"] || {})) {
    v113 && v113["rafId"] !== null && cancelProbeFrame(v113["rafId"]);
  }
  for (const v114 of Object["values"](v112["zoomSessions"] || {})) {
    v114 && v114["rafId"] !== null && cancelProbeFrame(v114["rafId"]);
  }
  for (const v115 of Object["values"](v112["resizeSessions"] || {})) {
    v115 && v115["rafId"] !== null && cancelProbeFrame(v115["rafId"]);
  }
  ((v112["dragSessions"] = {}), (v112["dragFpsSessions"] = []));
  for (const v116 of Object["values"](v112["panSessions"] || {})) {
    v116 && v116["rafId"] !== null && cancelProbeFrame(v116["rafId"]);
  }
  ((v112["panSessions"] = {}),
    (v112["panFpsSessions"] = []),
    (v112["canvasPanSamples"] = []),
    (v112["zoomSessions"] = {}),
    (v112["zoomFpsSessions"] = []),
    (v112["resizeSessions"] = {}),
    (v112["resizeFpsSessions"] = []),
    (v112["edgeRedrawSamples"] = []),
    (v112["renderFrameSamples"] = []),
    (v112["minimapUpdateSamples"] = []));
}
export function getPerfProbeSnapshot() {
  const v117 = ensureStore();
  if (!v117)
    return {
      version: 1,
      enabled: false,
      dragFpsSessions: [],
      panFpsSessions: [],
      canvasPanSamples: [],
      zoomFpsSessions: [],
      resizeFpsSessions: [],
      edgeRedrawSamples: [],
      renderFrameSamples: [],
      minimapUpdateSamples: [],
      staticMediaResourceSummary: summarizeStaticMediaResources(),
    };
  return {
    version: 1,
    enabled: !!v117["enabled"],
    dragFpsSessions: Array["isArray"](v117["dragFpsSessions"])
      ? v117["dragFpsSessions"]["map"]((v118) => ({ ...v118 }))
      : [],
    panFpsSessions: Array["isArray"](v117["panFpsSessions"])
      ? v117["panFpsSessions"]["map"]((v119) => ({ ...v119 }))
      : [],
    canvasPanSamples: Array["isArray"](v117["canvasPanSamples"])
      ? v117["canvasPanSamples"]["map"]((v120) => ({ ...v120 }))
      : [],
    zoomFpsSessions: Array["isArray"](v117["zoomFpsSessions"])
      ? v117["zoomFpsSessions"]["map"]((v121) => ({ ...v121 }))
      : [],
    resizeFpsSessions: Array["isArray"](v117["resizeFpsSessions"])
      ? v117["resizeFpsSessions"]["map"]((v122) => ({ ...v122 }))
      : [],
    edgeRedrawSamples: Array["isArray"](v117["edgeRedrawSamples"])
      ? v117["edgeRedrawSamples"]["map"]((v123) => ({ ...v123 }))
      : [],
    renderFrameSamples: Array["isArray"](v117["renderFrameSamples"])
      ? v117["renderFrameSamples"]["map"]((v124) => ({ ...v124 }))
      : [],
    minimapUpdateSamples: Array["isArray"](v117["minimapUpdateSamples"])
      ? v117["minimapUpdateSamples"]["map"]((v125) => ({ ...v125 }))
      : [],
    staticMediaResourceSummary: summarizeStaticMediaResources(),
  };
}
