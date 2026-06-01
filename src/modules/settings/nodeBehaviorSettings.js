import appStore from "../../core/stores/appStore.js";
const COMMENT_NOTE_JUMP_FOCUS_X_STORAGE_KEY = "v2-comment-note-jump-focus-x",
  COMMENT_NOTE_JUMP_FOCUS_Y_STORAGE_KEY = "v2-comment-note-jump-focus-y",
  DEFAULT_COMMENT_NOTE_JUMP_FOCUS_X_PERCENT = 50,
  DEFAULT_COMMENT_NOTE_JUMP_FOCUS_Y_PERCENT = 20;
function getRuntimeRoot() {
  if (typeof window !== "undefined") return window;
  return globalThis;
}
function getRuntimeStorage() {
  const v0 = getRuntimeRoot();
  try {
    if (v0?.["localStorage"]) return v0["localStorage"];
  } catch {}
  try {
    if (typeof localStorage !== "undefined" && localStorage)
      return localStorage;
  } catch {}
  return null;
}
function normalizePercent(v1, v2) {
  if (v1 === null || v1 === undefined || v1 === "") return v2;
  const v3 = Number(v1);
  if (!Number["isFinite"](v3)) return v2;
  return Math["max"](0, Math["min"](100, Math["round"](v3)));
}
function readPercentPref(v4, v5) {
  let v6 = null;
  try {
    v6 = getRuntimeStorage()?.["getItem"](v4) ?? null;
  } catch {}
  return normalizePercent(v6, v5);
}
function writePercentPref(v7, v8, v9) {
  const v10 = normalizePercent(v8, v9);
  try {
    getRuntimeStorage()?.["setItem"](v7, String(v10));
  } catch {}
  return v10;
}
export function readCommentNoteJumpFocusPref() {
  return {
    viewportAlignX:
      readPercentPref(
        COMMENT_NOTE_JUMP_FOCUS_X_STORAGE_KEY,
        DEFAULT_COMMENT_NOTE_JUMP_FOCUS_X_PERCENT,
      ) / 100,
    viewportAlignY:
      readPercentPref(
        COMMENT_NOTE_JUMP_FOCUS_Y_STORAGE_KEY,
        DEFAULT_COMMENT_NOTE_JUMP_FOCUS_Y_PERCENT,
      ) / 100,
  };
}
export function applyImageVideoNodeResizePref(v11) {
  if (typeof document === "undefined") return;
  const v12 = document["getElementById"]("v2-wrap");
  if (!v12) return;
  v12["classList"]["toggle"]("v2-media-node-resize-enabled", v11 === true);
}
function syncButtonPair(v13, v14, v15) {
  if (typeof document === "undefined") return;
  const v16 = v15 === true;
  (document["getElementById"](v13)?.["classList"]["toggle"]("active", v16),
    document["getElementById"](v14)?.["classList"]["toggle"]("active", !v16));
}
function syncNodeAvoidOverlapButtons(v17) {
  if (typeof document === "undefined") return;
  const v18 = v17 !== false;
  document["querySelectorAll"]("#nodeAvoidOverlapGroup .cursor-size-btn")[
    "forEach"
  ]((v19) => {
    const v20 = v19["dataset"]["avoid"] === "on";
    v19["classList"]["toggle"]("active", v20 === v18);
  });
}
export function setVideoMetaPref(v21, v22 = appStore) {
  const v23 = v21 === true;
  return (
    v22["setShowVideoMeta"](v23),
    syncButtonPair("btnVideoMetaOn", "btnVideoMetaOff", v23),
    v23
  );
}
export function setImageVideoNodeResizePref(v24, v25 = appStore) {
  const v26 = v24 === true;
  return (
    v25["setImageVideoNodeResizeEnabled"](v26),
    applyImageVideoNodeResizePref(v26),
    syncButtonPair("btnMediaNodeResizeOn", "btnMediaNodeResizeOff", v26),
    v26
  );
}
export function setTitleFollowsCanvasZoomPref(v27, v28 = appStore) {
  const v29 = v27 === true;
  return (
    v28["setTitleFollowsCanvasZoom"](v29),
    syncButtonPair("btnTitleFollowsZoomOn", "btnTitleFollowsZoomOff", v29),
    v29
  );
}
export function setPromptBoxResizePref(v30, v31 = appStore) {
  const v32 = v30 !== false;
  return (
    v31["setPromptBoxResizeEnabled"](v32),
    syncButtonPair("btnPromptBoxResizeOn", "btnPromptBoxResizeOff", v32),
    v32
  );
}
export function setNodeAvoidOverlapPref(v33) {
  const v34 = v33 !== false,
    v35 = typeof window !== "undefined" ? window : globalThis;
  v35["v2NodeAvoidOverlap"] = v34;
  try {
    v35?.["localStorage"]?.["setItem"](
      "v2-node-avoid-overlap",
      v34 ? "1" : "0",
    );
  } catch {}
  return (syncNodeAvoidOverlapButtons(v34), v34);
}
function initVideoMeta() {
  const v36 = document["getElementById"]("btnVideoMetaOn"),
    v37 = document["getElementById"]("btnVideoMetaOff");
  if (!v36 || !v37) return;
  const v38 = appStore["getState"](),
    v39 = v38?.["ui"]?.["showVideoMeta"] === true;
  (setVideoMetaPref(v39),
    v36["addEventListener"]("click", () => setVideoMetaPref(true)),
    v37["addEventListener"]("click", () => setVideoMetaPref(false)));
}
function initImageVideoNodeResize() {
  const v40 = document["getElementById"]("btnMediaNodeResizeOn"),
    v41 = document["getElementById"]("btnMediaNodeResizeOff");
  if (!v40 || !v41) return;
  const v42 = appStore["getState"](),
    v43 = v42?.["ui"]?.["imageVideoNodeResizeEnabled"] === true;
  (setImageVideoNodeResizePref(v43),
    v40["addEventListener"]("click", () => setImageVideoNodeResizePref(true)),
    v41["addEventListener"]("click", () => setImageVideoNodeResizePref(false)));
}
function initTitleFollowsCanvasZoom() {
  const v44 = document["getElementById"]("btnTitleFollowsZoomOn"),
    v45 = document["getElementById"]("btnTitleFollowsZoomOff");
  if (!v44 || !v45) return;
  const v46 = appStore["getState"](),
    v47 = v46?.["ui"]?.["titleFollowsCanvasZoom"] === true;
  (setTitleFollowsCanvasZoomPref(v47),
    v44["addEventListener"]("click", () => setTitleFollowsCanvasZoomPref(true)),
    v45["addEventListener"]("click", () =>
      setTitleFollowsCanvasZoomPref(false),
    ));
}
function initPromptBoxResize() {
  const v48 = document["getElementById"]("btnPromptBoxResizeOn"),
    v49 = document["getElementById"]("btnPromptBoxResizeOff");
  if (!v48 || !v49) return;
  const v50 = appStore["getState"](),
    v51 = v50?.["ui"]?.["promptBoxResizeEnabled"] !== false;
  (setPromptBoxResizePref(v51),
    v48["addEventListener"]("click", () => setPromptBoxResizePref(true)),
    v49["addEventListener"]("click", () => setPromptBoxResizePref(false)));
}
function initCommentNoteJumpFocus() {
  const v52 = ({
    sliderId: v53,
    valueId: v54,
    storageKey: v55,
    fallback: v56,
  }) => {
    const v57 = document["getElementById"](v53),
      v58 = document["getElementById"](v54);
    if (!v57) return;
    const v59 = (v60) => {
      const v61 = normalizePercent(v60, v56);
      v57["value"] = String(v61);
      if (v58) v58["textContent"] = v61 + "%";
      return v61;
    };
    (v59(readPercentPref(v55, v56)),
      v57["addEventListener"]("input", (v62) => {
        v59(v62["target"]?.["value"]);
      }),
      v57["addEventListener"]("change", (v63) => {
        v59(writePercentPref(v55, v63["target"]?.["value"], v56));
      }));
  };
  (v52({
    sliderId: "commentNoteJumpFocusXSlider",
    valueId: "commentNoteJumpFocusXValue",
    storageKey: COMMENT_NOTE_JUMP_FOCUS_X_STORAGE_KEY,
    fallback: DEFAULT_COMMENT_NOTE_JUMP_FOCUS_X_PERCENT,
  }),
    v52({
      sliderId: "commentNoteJumpFocusYSlider",
      valueId: "commentNoteJumpFocusYValue",
      storageKey: COMMENT_NOTE_JUMP_FOCUS_Y_STORAGE_KEY,
      fallback: DEFAULT_COMMENT_NOTE_JUMP_FOCUS_Y_PERCENT,
    }));
}
function initNodeSpacing() {
  const v64 = document["getElementById"]("nodeSpacingSlider"),
    v65 = document["getElementById"]("nodeSpacingValue");
  let v66 = parseInt(localStorage["getItem"]("v2-node-spacing"), 10);
  if (isNaN(v66)) v66 = 120;
  window["v2NodeSpacing"] = v66;
  if (v64) {
    v64["value"] = v66;
    if (v65) v65["textContent"] = v66;
  }
  (v64?.["addEventListener"]("input", (v67) => {
    const v68 = parseInt(v67["target"]["value"], 10);
    if (v65) v65["textContent"] = v68;
  }),
    v64?.["addEventListener"]("change", (v69) => {
      const v70 = parseInt(v69["target"]["value"], 10);
      ((window["v2NodeSpacing"] = v70),
        localStorage["setItem"]("v2-node-spacing", v70));
    }));
}
function initNodeDirection() {
  const v71 = localStorage["getItem"]("v2-node-direction") || "right";
  window["v2NodeDirection"] = v71;
  const v72 = document["querySelectorAll"](
    "#nodeDirectionGroup .cursor-size-btn",
  );
  v72["forEach"]((v73) => {
    (v73["classList"]["toggle"]("active", v73["dataset"]["dir"] === v71),
      v73["addEventListener"]("click", () => {
        (v72["forEach"]((v74) => v74["classList"]["remove"]("active")),
          v73["classList"]["add"]("active"),
          (window["v2NodeDirection"] = v73["dataset"]["dir"]),
          localStorage["setItem"]("v2-node-direction", v73["dataset"]["dir"]));
      }));
  });
}
function initNodeAvoidOverlap() {
  const v75 = localStorage["getItem"]("v2-node-avoid-overlap");
  let v76 = true;
  v75 == null
    ? localStorage["setItem"]("v2-node-avoid-overlap", "1")
    : (v76 = v75 === "1" || v75 === "true");
  setNodeAvoidOverlapPref(v76);
  const v77 = document["querySelectorAll"](
    "#nodeAvoidOverlapGroup\x20.cursor-size-btn",
  );
  v77["forEach"]((v78) => {
    v78["addEventListener"]("click", () => {
      setNodeAvoidOverlapPref(v78["dataset"]["avoid"] === "on");
    });
  });
}
export function initNodeBehaviorSettings() {
  (initVideoMeta(),
    initImageVideoNodeResize(),
    initTitleFollowsCanvasZoom(),
    initPromptBoxResize(),
    initCommentNoteJumpFocus(),
    initNodeSpacing(),
    initNodeDirection(),
    initNodeAvoidOverlap());
}
