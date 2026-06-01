import { getShortcutLabelByAction } from "./settingsShared.js";
const FONT_SIZE_MAP = { small: "16px", medium: "21px", large: "26px" },
  BASE_APP_THEMES = new Set(["dark", "light"]),
  APP_THEME_PRESET_STORAGE_KEY = "v2-app-theme-preset",
  APP_THEME_PRESETS = new Set(["dusk", "dawn", "day"]),
  CURSOR_SIZE_STORAGE_KEY = "v2-cursor-style",
  CURSOR_SIZES = new Set(["small", "medium", "large"]),
  CURSOR_ASSET_ROOT = "../images/cursors/windows11-concept-v2",
  PROMPT_ACTION_SURFACES = new Set(["transparent", "themed"]),
  THEME_REVEAL_DURATION_MS = 880,
  CURSOR_ROLE_MAP = {
    "--pointer-cursor": { file: "pointer", fallback: "default" },
    "--link-cursor": { file: "link", fallback: "pointer" },
    "--grab-cursor": { file: "move", fallback: "grab" },
    "--grabbing-cursor": { file: "move", fallback: "grabbing" },
    "--text-cursor": { file: "beam", fallback: "text" },
    "--precision-cursor": { file: "precision", fallback: "crosshair" },
    "--move-cursor": { file: "move", fallback: "move" },
    "--help-cursor": { file: "help", fallback: "help" },
    "--unavailable-cursor": { file: "unavailable", fallback: "not-allowed" },
    "--resize-ns-cursor": { file: "vert", fallback: "ns-resize" },
    "--resize-ew-cursor": { file: "horz", fallback: "ew-resize" },
    "--resize-nwse-cursor": { file: "dgn1", fallback: "nwse-resize" },
    "--resize-nesw-cursor": { file: "dgn2", fallback: "nesw-resize" },
    "--alternate-cursor": { file: "alternate", fallback: "default" },
    "--handwriting-cursor": { file: "handwriting", fallback: "default" },
    "--pin-cursor": { file: "pin", fallback: "pointer" },
    "--person-cursor": { file: "person", fallback: "pointer" },
  },
  CURSOR_ANIMATED_ROLE_MAP = {
    "--wait-cursor": { file: "busy.ani", fallback: "wait" },
    "--progress-cursor": { file: "working.ani", fallback: "progress" },
  };
function isReducedMotionPreferred() {
  try {
    return (
      window?.["matchMedia"]?.("(prefers-reduced-motion:\x20reduce)")?.[
        "matches"
      ] === true
    );
  } catch {
    return false;
  }
}
function getViewportSize() {
  const v0 = document?.["documentElement"];
  return {
    width: window?.["innerWidth"] || v0?.["clientWidth"] || 1024,
    height: window?.["innerHeight"] || v0?.["clientHeight"] || 768,
  };
}
function resolveThemeRevealPoint(v1) {
  const { width: v2, height: v3 } = getViewportSize(),
    v4 = { x: v2 / 2, y: v3 / 2 },
    v5 = Number(v1?.["clientX"]),
    v6 = Number(v1?.["clientY"]);
  if (
    Number["isFinite"](v5) &&
    Number["isFinite"](v6) &&
    (v5 !== 0 || v6 !== 0)
  )
    return { x: v5, y: v6 };
  const v7 = v1?.["currentTarget"] || v1?.["target"];
  if (typeof v7?.["getBoundingClientRect"] === "function") {
    const v8 = v7["getBoundingClientRect"]();
    return { x: v8["left"] + v8["width"] / 2, y: v8["top"] + v8["height"] / 2 };
  }
  return v4;
}
function getThemeRevealRadius(v9, v10) {
  const { width: v11, height: v12 } = getViewportSize();
  return Math["ceil"](
    Math["max"](
      Math["hypot"](v9, v10),
      Math["hypot"](v11 - v9, v10),
      Math["hypot"](v9, v12 - v10),
      Math["hypot"](v11 - v9, v12 - v10),
    ),
  );
}
function runThemeRevealTransition(v13, v14) {
  if (
    typeof v14 !== "function" ||
    isReducedMotionPreferred() ||
    typeof document?.["startViewTransition"] !== "function" ||
    typeof document?.["documentElement"]?.["animate"] !== "function"
  ) {
    v14?.();
    return;
  }
  const { x: v15, y: v16 } = resolveThemeRevealPoint(v13),
    v17 = document["documentElement"];
  v17["classList"]?.["add"]("theme-reveal-transitioning");
  const v18 = document["startViewTransition"](() => {
      v14();
    }),
    v19 = () => {
      v17["classList"]?.["remove"]("theme-reveal-transitioning");
    },
    v20 = v18["ready"]
      ?.["then"](() => {
        const v21 = getThemeRevealRadius(v15, v16),
          v22 = v17["animate"](
            {
              clipPath: [
                "circle(0px\x20at\x20" + v15 + "px " + v16 + "px)",
                "circle(" + v21 + "px\x20at\x20" + v15 + "px\x20" + v16 + "px)",
              ],
            },
            {
              duration: THEME_REVEAL_DURATION_MS,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              pseudoElement: "::view-transition-new(root)",
            },
          );
        return v22["finished"];
      })
      ["catch"](() => {});
  Promise["allSettled"](
    [v20, v18["finished"]]["filter"](
      (v23) => v23 && typeof v23["then"] === "function",
    ),
  )["finally"](v19);
}
function normalizeBaseAppTheme(v24) {
  return BASE_APP_THEMES["has"](v24) ? v24 : "dark";
}
function normalizeAppThemePreset(v25) {
  return APP_THEME_PRESETS["has"](v25) ? v25 : "dusk";
}
function normalizeCursorSize(v26) {
  return CURSOR_SIZES["has"](v26) ? v26 : "small";
}
function getBaseThemeForPreset(v27) {
  return normalizeAppThemePreset(v27) === "day" ? "light" : "dark";
}
function isLightCanvasPreset(v28) {
  return normalizeAppThemePreset(v28) !== "dusk";
}
function getCursorThemeForPreset(v29) {
  return normalizeAppThemePreset(v29) === "day" ? "dark" : "light";
}
function getCursorFallbackPreset() {
  return normalizeAppThemePreset(
    localStorage["getItem"](APP_THEME_PRESET_STORAGE_KEY),
  );
}
function applyCursorStyle({ size: v30, preset: v31 } = {}) {
  const v32 = normalizeCursorSize(
      v30 || localStorage["getItem"](CURSOR_SIZE_STORAGE_KEY),
    ),
    v33 = getCursorThemeForPreset(v31 || getCursorFallbackPreset()),
    v34 = document["documentElement"];
  (Object["entries"](CURSOR_ROLE_MAP)["forEach"](([v35, v36]) => {
    v34["style"]["setProperty"](
      v35,
      "url('" +
        CURSOR_ASSET_ROOT +
        "/" +
        v33 +
        "/" +
        v36["file"] +
        "-" +
        v32 +
        ".cur'), " +
        v36["fallback"],
    );
  }),
    Object["entries"](CURSOR_ANIMATED_ROLE_MAP)["forEach"](([v37, v38]) => {
      v34["style"]["setProperty"](
        v37,
        "url('" +
          CURSOR_ASSET_ROOT +
          "/" +
          v33 +
          "/" +
          v38["file"] +
          "\x27),\x20" +
          v38["fallback"],
      );
    }));
}
function getUiStoreTheme(v39) {
  try {
    const v40 = v39?.["getStateRaw"]?.() || v39?.["getState"]?.() || {};
    return normalizeBaseAppTheme(v40["theme"]);
  } catch {
    return "dark";
  }
}
function getSavedAppThemePreset(v41) {
  const v42 = normalizeAppThemePreset(
      localStorage["getItem"](APP_THEME_PRESET_STORAGE_KEY),
    ),
    v43 = getUiStoreTheme(v41);
  if (getBaseThemeForPreset(v42) === v43) return v42;
  return v43 === "light" ? "day" : "dusk";
}
function syncAppThemeButtons(v44) {
  const v45 = normalizeAppThemePreset(v44);
  document["querySelectorAll"](".cursor-size-btn[data-app-theme]")["forEach"](
    (v46) => {
      const v47 = v46["dataset"]["appTheme"] === v45;
      (v46["classList"]["toggle"]("active", v47),
        v46["classList"]["remove"]("is-disabled"),
        v46["setAttribute"]("aria-disabled", "false"),
        (v46["title"] = ""));
    },
  );
}
function syncCanvasTheme(v48) {
  const v49 = document["getElementById"]("v2-wrap"),
    v50 = normalizeAppThemePreset(v48),
    v51 = isLightCanvasPreset(v48);
  document["documentElement"]?.["classList"]?.["toggle"](
    "is-canvas-theme-light",
    v51,
  );
  if (!v49) return;
  (v49["classList"]["toggle"]("theme-light", v51),
    APP_THEME_PRESETS["forEach"]((v52) => {
      v49["classList"]["toggle"]("canvas-theme-" + v52, v52 === v50);
    }));
}
function normalizePromptActionSurface(v53) {
  return PROMPT_ACTION_SURFACES["has"](v53) ? v53 : "themed";
}
function applyPromptActionSurface(v54) {
  const v55 = normalizePromptActionSurface(v54);
  (localStorage["setItem"]("v2-prompt-action-surface", v55),
    document["querySelectorAll"](
      ".cursor-size-btn[data-prompt-action-surface]",
    )["forEach"]((v56) => {
      v56["classList"]["toggle"](
        "active",
        v56["dataset"]["promptActionSurface"] === v55,
      );
    }),
    document["body"]?.["classList"]["toggle"](
      "prompt-action-surface-themed",
      v55 === "themed",
    ));
  const v57 = document["getElementById"]("v2-wrap");
  if (!v57) return;
  v57["classList"]["toggle"]("prompt-action-surface-themed", v55 === "themed");
}
export function initApplicationTheme({ uiStore: v58 } = {}) {
  let v59 = getSavedAppThemePreset(v58);
  const v60 = (v61 = v59) => syncAppThemeButtons(v61),
    v62 = (v63 = v59) => {
      ((v59 = normalizeAppThemePreset(v63)),
        localStorage["setItem"](APP_THEME_PRESET_STORAGE_KEY, v59),
        v60(v59),
        syncCanvasTheme(v59),
        applyCursorStyle({ preset: v59 }));
    },
    v64 = (v65) => {
      const v66 = normalizeAppThemePreset(v65);
      v62(v66);
      const v67 = getBaseThemeForPreset(v66);
      typeof v58?.["setTheme"] === "function" &&
        v67 !== getUiStoreTheme(v58) &&
        v58["setTheme"](v67);
    };
  (v62(),
    document["querySelectorAll"](".cursor-size-btn[data-app-theme]")["forEach"](
      (v68) => {
        v68["addEventListener"]("click", (v69) => {
          const v70 = normalizeAppThemePreset(v68["dataset"]["appTheme"]);
          if (v70 === v59) {
            v64(v70);
            return;
          }
          runThemeRevealTransition(v69, () => v64(v70));
        });
      },
    ),
    typeof v58?.["subscribeSelector"] === "function" &&
      v58["subscribeSelector"](
        (v71) => v71["theme"],
        (v72) => {
          const v73 = normalizeBaseAppTheme(v72);
          if (getBaseThemeForPreset(v59) !== v73) {
            v62(v73 === "light" ? "day" : "dusk");
            return;
          }
          v62(v59);
        },
      ),
    window["addEventListener"]?.("aicanvas:runtime-info", () => v60()));
}
export function applyGridDotsPref(v74) {
  const v75 = document["getElementById"]("v2-wrap");
  if (!v75) return;
  v75["classList"]["toggle"]("has-grid-dots", !!v74);
}
export function readGridDotsPref() {
  const v76 = localStorage["getItem"]("v2-grid-dots");
  if (v76 != null) return v76 === "true" || v76 === "1";
  const v77 = localStorage["getItem"]("v2-snap-grid") === "true";
  return (localStorage["setItem"]("v2-grid-dots", v77 ? "true" : "false"), v77);
}
export function setGridDotsPref(v78) {
  const v79 = v78 !== false;
  (localStorage["setItem"]("v2-grid-dots", v79 ? "true" : "false"),
    applyGridDotsPref(v79));
  const v80 = document["getElementById"]("btnGridDotsOn"),
    v81 = document["getElementById"]("btnGridDotsOff");
  if (v80) v80["classList"]["toggle"]("active", v79);
  if (v81) v81["classList"]["toggle"]("active", !v79);
  return v79;
}
export function applyGridDotsPrefFromStorage() {
  applyGridDotsPref(readGridDotsPref());
}
function initCursorSettings() {
  const v82 = (v83) => {
      const v84 = normalizeCursorSize(v83);
      (localStorage["setItem"](CURSOR_SIZE_STORAGE_KEY, v84),
        document["querySelectorAll"](".cursor-size-btn[data-size]")["forEach"](
          (v85) => {
            v85["classList"]["toggle"](
              "active",
              v85["dataset"]["size"] === v84,
            );
          },
        ),
        applyCursorStyle({ size: v84 }));
    },
    v86 = localStorage["getItem"](CURSOR_SIZE_STORAGE_KEY) || "small";
  (v82(v86),
    document["querySelectorAll"](".cursor-size-btn[data-size]")["forEach"](
      (v87) => {
        v87["addEventListener"]("click", () => v82(v87["dataset"]["size"]));
      },
    ));
}
function initPromptActionSurface() {
  const v88 = normalizePromptActionSurface(
    localStorage["getItem"]("v2-prompt-action-surface"),
  );
  (applyPromptActionSurface(v88),
    document["querySelectorAll"](
      ".cursor-size-btn[data-prompt-action-surface]",
    )["forEach"]((v89) => {
      v89["addEventListener"]("click", () =>
        applyPromptActionSurface(v89["dataset"]["promptActionSurface"]),
      );
    }));
}
function initGridDots() {
  const v90 = document["getElementById"]("btnGridDotsOn"),
    v91 = document["getElementById"]("btnGridDotsOff"),
    v92 = document["getElementById"]("gridDotsShortcutLabel");
  if (!v90 || !v91) return;
  const v93 = () => {
    if (!v92) return;
    v92["textContent"] = getShortcutLabelByAction("grid-dots", ".");
  };
  (setGridDotsPref(readGridDotsPref()),
    v93(),
    v90["addEventListener"]("click", () => setGridDotsPref(true)),
    v91["addEventListener"]("click", () => setGridDotsPref(false)),
    window["addEventListener"]("shortcuts-updated", v93));
}
function initFontSize() {
  const v94 = (v95) => {
      if (!FONT_SIZE_MAP[v95]) v95 = "small";
      (localStorage["setItem"]("v2-input-font-size", v95),
        document["querySelectorAll"](".cursor-size-btn[data-fontsize]")[
          "forEach"
        ]((v96) => {
          v96["classList"]["toggle"](
            "active",
            v96["dataset"]["fontsize"] === v95,
          );
        }),
        document["documentElement"]["style"]["setProperty"](
          "--prompt-font-size",
          FONT_SIZE_MAP[v95],
        ));
    },
    v97 = localStorage["getItem"]("v2-input-font-size") || "small";
  (v94(v97),
    document["querySelectorAll"](".cursor-size-btn[data-fontsize]")["forEach"](
      (v98) => {
        v98["addEventListener"]("click", () => v94(v98["dataset"]["fontsize"]));
      },
    ));
}
export function initAppearanceSettings(v99 = {}) {
  (initApplicationTheme({ uiStore: v99["uiStore"] }),
    initCursorSettings(),
    initPromptActionSurface(),
    initGridDots(),
    initFontSize());
}
