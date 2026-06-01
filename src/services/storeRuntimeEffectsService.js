import {
  FEATURE_SELECTIONS_STORAGE_KEY,
  sanitizeFeatureSelectionsRecord,
} from "../modules/featureSelectionMemory.js";
import {
  normalizeImageToolbarLayout,
  serializeImageToolbarLayout,
} from "../modules/imageToolbarLayoutMemory.js";
import {
  normalizeVideoToolbarLayout,
  serializeVideoToolbarLayout,
} from "../modules/videoToolbarLayoutMemory.js";
const THEME_STORAGE_KEY = "ai-canvas-theme",
  SHOW_VIDEO_META_STORAGE_KEY = "v2-show-video-meta",
  TITLE_FOLLOWS_CANVAS_ZOOM_STORAGE_KEY = "v2-title-follows-canvas-zoom",
  PROMPT_BOX_RESIZE_ENABLED_STORAGE_KEY = "v2-prompt-box-resize-enabled",
  IMAGE_VIDEO_NODE_RESIZE_ENABLED_STORAGE_KEY =
    "v2-image-video-node-resize-enabled",
  SELECTION_RELATED_HIGHLIGHT_ENABLED_STORAGE_KEY =
    "v2-selection-related-highlight-enabled",
  SELECTION_RELATED_HIGHLIGHT_COLOR_STORAGE_KEY =
    "v2-selection-related-highlight-color",
  CONNECTION_LINES_VISIBLE_STORAGE_KEY = "v2-connection-lines-visible",
  IMAGE_TOOLBAR_LAYOUT_STORAGE_KEY = "v2-image-toolbar-layout",
  VIDEO_TOOLBAR_LAYOUT_STORAGE_KEY = "v2-video-toolbar-layout",
  ALIGN_FEATURE_ENABLED_STORAGE_KEY = "v2-align-enabled",
  ALIGN_TRIGGER_MODE_STORAGE_KEY = "v2-align-trigger-mode",
  ALIGN_DISTRIBUTE_GAP_STORAGE_KEY = "v2-align-distribute-gap",
  SNAP_GUIDES_ENABLED_STORAGE_KEY = "v2-snap-guides";
function getStorage() {
  try {
    if (typeof localStorage !== "undefined" && localStorage)
      return localStorage;
  } catch {}
  return null;
}
function safeStorageGet(v0, v1 = "") {
  const v2 = getStorage();
  if (!v2) return v1;
  try {
    const v3 = v2["getItem"](v0);
    return v3 == null ? v1 : v3;
  } catch {
    return v1;
  }
}
function safeStorageSet(v4, v5) {
  const v6 = getStorage();
  if (!v6) return;
  try {
    v6["setItem"](v4, String(v5));
  } catch {}
}
function parseJsonObject(v7) {
  if (!v7) return {};
  try {
    const v8 = JSON["parse"](v7);
    return v8 && typeof v8 === "object" && !Array["isArray"](v8) ? v8 : {};
  } catch {
    return {};
  }
}
function normalizeSelectionRelatedHighlightColor(v9) {
  const v10 = String(v9 || "")["trim"]();
  return ["white", "blue", "green", "cyan", "purple", "red", "yellow"][
    "includes"
  ](v10)
    ? v10
    : "white";
}
export function normalizeThemeName(v11) {
  return v11 === "light" ? "light" : "dark";
}
export function readThemeFromStorage() {
  return normalizeThemeName(safeStorageGet(THEME_STORAGE_KEY, "dark"));
}
export function applyThemeToDom(v12) {
  const v13 = normalizeThemeName(v12);
  try {
    const v14 =
      typeof document !== "undefined" ? document?.["documentElement"] : null;
    v14 &&
      typeof v14["setAttribute"] === "function" &&
      v14["setAttribute"]("data-theme", v13);
  } catch {}
}
export function persistThemeToStorage(v15) {
  safeStorageSet(THEME_STORAGE_KEY, normalizeThemeName(v15));
}
export function readUiPrefsFromStorage() {
  const v16 = safeStorageGet(SHOW_VIDEO_META_STORAGE_KEY, "0"),
    v17 = safeStorageGet(TITLE_FOLLOWS_CANVAS_ZOOM_STORAGE_KEY, "0"),
    v18 = safeStorageGet(PROMPT_BOX_RESIZE_ENABLED_STORAGE_KEY, "1"),
    v19 = safeStorageGet(IMAGE_VIDEO_NODE_RESIZE_ENABLED_STORAGE_KEY, "0"),
    v20 = safeStorageGet(SELECTION_RELATED_HIGHLIGHT_ENABLED_STORAGE_KEY, "1"),
    v21 = safeStorageGet(
      SELECTION_RELATED_HIGHLIGHT_COLOR_STORAGE_KEY,
      "white",
    ),
    v22 = safeStorageGet(CONNECTION_LINES_VISIBLE_STORAGE_KEY, "1"),
    v23 = safeStorageGet(IMAGE_TOOLBAR_LAYOUT_STORAGE_KEY, ""),
    v24 = safeStorageGet(VIDEO_TOOLBAR_LAYOUT_STORAGE_KEY, ""),
    v25 = safeStorageGet(ALIGN_FEATURE_ENABLED_STORAGE_KEY, "1"),
    v26 = safeStorageGet(ALIGN_TRIGGER_MODE_STORAGE_KEY, ""),
    v27 = safeStorageGet(ALIGN_DISTRIBUTE_GAP_STORAGE_KEY, "40"),
    v28 = safeStorageGet(SNAP_GUIDES_ENABLED_STORAGE_KEY, "1"),
    v29 = safeStorageGet(FEATURE_SELECTIONS_STORAGE_KEY, "{}"),
    v30 =
      v26 === "hold" || v26 === "click" || v26 === "off"
        ? v26
        : String(v25) === "0"
          ? "off"
          : "click",
    v31 = Number(v27),
    v32 = Number["isFinite"](v31)
      ? Math["max"](0, Math["min"](200, Math["round"](v31)))
      : 40;
  return {
    showVideoMeta: String(v16) === "1",
    titleFollowsCanvasZoom: String(v17) === "1",
    promptBoxResizeEnabled: String(v18) !== "0",
    imageVideoNodeResizeEnabled: String(v19) === "1",
    selectionRelatedHighlightEnabled: String(v20) !== "0",
    selectionRelatedHighlightColor:
      normalizeSelectionRelatedHighlightColor(v21),
    connectionLinesVisible: String(v22) !== "0",
    imageToolbarLayout: normalizeImageToolbarLayout(parseJsonObject(v23)),
    videoToolbarLayout: normalizeVideoToolbarLayout(parseJsonObject(v24)),
    alignFeatureEnabled: v30 !== "off",
    alignFeatureTriggerMode: v30,
    alignDistributeGap: v32,
    snapGuidesEnabled: String(v28) !== "0",
    featureSelections: sanitizeFeatureSelectionsRecord(parseJsonObject(v29)),
  };
}
export function persistUiPrefsToStorage(v33) {
  const v34 = v33?.["showVideoMeta"] === true,
    v35 = v33?.["titleFollowsCanvasZoom"] === true,
    v36 = v33?.["promptBoxResizeEnabled"] !== false,
    v37 = v33?.["imageVideoNodeResizeEnabled"] === true,
    v38 = v33?.["selectionRelatedHighlightEnabled"] !== false,
    v39 = normalizeSelectionRelatedHighlightColor(
      v33?.["selectionRelatedHighlightColor"],
    ),
    v40 = v33?.["connectionLinesVisible"] !== false,
    v41 = normalizeImageToolbarLayout(v33?.["imageToolbarLayout"]),
    v42 = normalizeVideoToolbarLayout(v33?.["videoToolbarLayout"]),
    v43 =
      v33?.["alignFeatureTriggerMode"] === "hold" ||
      v33?.["alignFeatureTriggerMode"] === "click" ||
      v33?.["alignFeatureTriggerMode"] === "off"
        ? v33["alignFeatureTriggerMode"]
        : v33?.["alignFeatureEnabled"] === false
          ? "off"
          : "click",
    v44 = v43 !== "off",
    v45 = Number(v33?.["alignDistributeGap"]),
    v46 = Number["isFinite"](v45)
      ? Math["max"](0, Math["min"](200, Math["round"](v45)))
      : 40,
    v47 = v33?.["snapGuidesEnabled"] !== false,
    v48 = sanitizeFeatureSelectionsRecord(v33?.["featureSelections"] || {});
  (safeStorageSet(SHOW_VIDEO_META_STORAGE_KEY, v34 ? "1" : "0"),
    safeStorageSet(TITLE_FOLLOWS_CANVAS_ZOOM_STORAGE_KEY, v35 ? "1" : "0"),
    safeStorageSet(PROMPT_BOX_RESIZE_ENABLED_STORAGE_KEY, v36 ? "1" : "0"),
    safeStorageSet(
      IMAGE_VIDEO_NODE_RESIZE_ENABLED_STORAGE_KEY,
      v37 ? "1" : "0",
    ),
    safeStorageSet(
      SELECTION_RELATED_HIGHLIGHT_ENABLED_STORAGE_KEY,
      v38 ? "1" : "0",
    ),
    safeStorageSet(SELECTION_RELATED_HIGHLIGHT_COLOR_STORAGE_KEY, v39),
    safeStorageSet(CONNECTION_LINES_VISIBLE_STORAGE_KEY, v40 ? "1" : "0"),
    safeStorageSet(
      IMAGE_TOOLBAR_LAYOUT_STORAGE_KEY,
      serializeImageToolbarLayout(v41),
    ),
    safeStorageSet(
      VIDEO_TOOLBAR_LAYOUT_STORAGE_KEY,
      serializeVideoToolbarLayout(v42),
    ),
    safeStorageSet(ALIGN_FEATURE_ENABLED_STORAGE_KEY, v44 ? "1" : "0"),
    safeStorageSet(ALIGN_TRIGGER_MODE_STORAGE_KEY, v43),
    safeStorageSet(ALIGN_DISTRIBUTE_GAP_STORAGE_KEY, String(v46)),
    safeStorageSet(SNAP_GUIDES_ENABLED_STORAGE_KEY, v47 ? "1" : "0"),
    safeStorageSet(FEATURE_SELECTIONS_STORAGE_KEY, JSON["stringify"](v48)));
}
function isViewportAnimating() {
  try {
    const v49 = typeof document !== "undefined" ? document?.["body"] : null;
    if (!v49?.["classList"]) return false;
    return (
      v49["classList"]["contains"]("is-panning") ||
      v49["classList"]["contains"]("is-viewport-animating") ||
      v49["classList"]["contains"]("is-zooming")
    );
  } catch {
    return false;
  }
}
export function shouldBumpViewportPersistOnZoom() {
  return !isViewportAnimating();
}
function resolveStoreBundle(v50) {
  if (!v50 || typeof v50 !== "object")
    return { uiStore: null, graphStore: null };
  if (v50["uiStore"] && v50["graphStore"])
    return { uiStore: v50["uiStore"], graphStore: v50["graphStore"] };
  if (typeof v50["getDomainStores"] === "function") {
    const v51 = v50["getDomainStores"]() || {};
    if (v51["uiStore"] && v51["graphStore"])
      return { uiStore: v51["uiStore"], graphStore: v51["graphStore"] };
  }
  return { uiStore: v50, graphStore: v50 };
}
export function initStoreRuntimeEffects(v52) {
  const { uiStore: v53, graphStore: v54 } = resolveStoreBundle(v52);
  if (!v53 || !v54) return () => {};
  const v55 = readThemeFromStorage(),
    v56 = readUiPrefsFromStorage();
  (v53["initTheme"](v55),
    v53["initUiPrefs"](v56),
    applyThemeToDom(v55),
    v54["setViewportPersistPolicy"](shouldBumpViewportPersistOnZoom));
  const v57 = v53["subscribeSelector"](
      (v58) => v58["theme"],
      (v59) => {
        const v60 = normalizeThemeName(v59);
        (applyThemeToDom(v60), persistThemeToStorage(v60));
      },
    ),
    v61 = v53["subscribeSelector"](
      (v62) => v62["ui"]?.["showVideoMeta"] === true,
      (v63) => {
        safeStorageSet(SHOW_VIDEO_META_STORAGE_KEY, v63 ? "1" : "0");
      },
    ),
    v64 = v53["subscribeSelector"](
      (v65) => v65["ui"]?.["titleFollowsCanvasZoom"] === true,
      (v66) => {
        safeStorageSet(TITLE_FOLLOWS_CANVAS_ZOOM_STORAGE_KEY, v66 ? "1" : "0");
      },
    ),
    v67 = v53["subscribeSelector"](
      (v68) => v68["ui"]?.["promptBoxResizeEnabled"] !== false,
      (v69) => {
        safeStorageSet(PROMPT_BOX_RESIZE_ENABLED_STORAGE_KEY, v69 ? "1" : "0");
      },
    ),
    v70 = v53["subscribeSelector"](
      (v71) => v71["ui"]?.["imageVideoNodeResizeEnabled"] === true,
      (v72) => {
        safeStorageSet(
          IMAGE_VIDEO_NODE_RESIZE_ENABLED_STORAGE_KEY,
          v72 ? "1" : "0",
        );
      },
    ),
    v73 = v53["subscribeSelector"](
      (v74) => v74["ui"]?.["selectionRelatedHighlightEnabled"] !== false,
      (v75) => {
        safeStorageSet(
          SELECTION_RELATED_HIGHLIGHT_ENABLED_STORAGE_KEY,
          v75 ? "1" : "0",
        );
      },
    ),
    v76 = v53["subscribeSelector"](
      (v77) =>
        normalizeSelectionRelatedHighlightColor(
          v77["ui"]?.["selectionRelatedHighlightColor"],
        ),
      (v78) => {
        safeStorageSet(SELECTION_RELATED_HIGHLIGHT_COLOR_STORAGE_KEY, v78);
      },
    ),
    v79 = v53["subscribeSelector"](
      (v80) => v80["ui"]?.["connectionLinesVisible"] !== false,
      (v81) => {
        safeStorageSet(CONNECTION_LINES_VISIBLE_STORAGE_KEY, v81 ? "1" : "0");
      },
    ),
    v82 = v53["subscribeSelector"](
      (v83) => serializeImageToolbarLayout(v83["ui"]?.["imageToolbarLayout"]),
      (v84) => {
        safeStorageSet(IMAGE_TOOLBAR_LAYOUT_STORAGE_KEY, v84);
      },
    ),
    v85 = v53["subscribeSelector"](
      (v86) => serializeVideoToolbarLayout(v86["ui"]?.["videoToolbarLayout"]),
      (v87) => {
        safeStorageSet(VIDEO_TOOLBAR_LAYOUT_STORAGE_KEY, v87);
      },
    ),
    v88 = v53["subscribeSelector"](
      (v89) => v89["ui"]?.["alignFeatureEnabled"] !== false,
      (v90) => {
        safeStorageSet(ALIGN_FEATURE_ENABLED_STORAGE_KEY, v90 ? "1" : "0");
      },
    ),
    v91 = v53["subscribeSelector"](
      (v92) => {
        const v93 = v92["ui"]?.["alignFeatureTriggerMode"];
        return v93 === "hold" || v93 === "click" || v93 === "off"
          ? v93
          : "click";
      },
      (v94) => {
        (safeStorageSet(ALIGN_TRIGGER_MODE_STORAGE_KEY, v94),
          safeStorageSet(
            ALIGN_FEATURE_ENABLED_STORAGE_KEY,
            v94 === "off" ? "0" : "1",
          ));
      },
    ),
    v95 = v53["subscribeSelector"](
      (v96) => {
        const v97 = Number(v96["ui"]?.["alignDistributeGap"]);
        return Number["isFinite"](v97)
          ? Math["max"](0, Math["min"](200, Math["round"](v97)))
          : 40;
      },
      (v98) => {
        safeStorageSet(ALIGN_DISTRIBUTE_GAP_STORAGE_KEY, String(v98));
      },
    ),
    v99 = v53["subscribeSelector"](
      (v100) => v100["ui"]?.["snapGuidesEnabled"] !== false,
      (v101) => {
        safeStorageSet(SNAP_GUIDES_ENABLED_STORAGE_KEY, v101 ? "1" : "0");
      },
    ),
    v102 = v53["subscribeSelector"](
      (v103) => {
        try {
          return JSON["stringify"](v103["ui"]?.["featureSelections"] || {});
        } catch {
          return "{}";
        }
      },
      (v104) => {
        const v105 = parseJsonObject(v104);
        safeStorageSet(
          FEATURE_SELECTIONS_STORAGE_KEY,
          JSON["stringify"](sanitizeFeatureSelectionsRecord(v105)),
        );
      },
    );
  return () => {
    (v57?.(),
      v61?.(),
      v64?.(),
      v67?.(),
      v70?.(),
      v73?.(),
      v76?.(),
      v79?.(),
      v82?.(),
      v85?.(),
      v88?.(),
      v91?.(),
      v95?.(),
      v99?.(),
      v102?.(),
      v54["setViewportPersistPolicy"](() => true));
  };
}
