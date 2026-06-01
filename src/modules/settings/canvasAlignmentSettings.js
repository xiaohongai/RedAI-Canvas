import appStore from "../../core/stores/appStore.js";
import { getShortcuts } from "../shortcuts.js";
import {
  applySnapGridEnabled,
  readSnapGridEnabled,
  subscribeSnapGridChanges,
} from "../snapGridState.js";
import { getShortcutLabelByAction } from "./settingsShared.js";
const SELECTION_RELATED_HIGHLIGHT_COLORS = [
  "white",
  "blue",
  "green",
  "cyan",
  "purple",
  "red",
  "yellow",
];
function normalizeSelectionRelatedHighlightColor(v0) {
  const v1 = String(v0 || "")["trim"]();
  return SELECTION_RELATED_HIGHLIGHT_COLORS["includes"](v1) ? v1 : "white";
}
function getSelectionRelatedHighlightElements() {
  if (typeof document === "undefined")
    return { btnOn: null, btnOff: null, colorRow: null, colorButtons: [] };
  return {
    btnOn: document["getElementById"]("btnSelectionRelatedHighlightOn"),
    btnOff: document["getElementById"]("btnSelectionRelatedHighlightOff"),
    colorRow: document["getElementById"]("selectionRelatedHighlightColorRow"),
    colorButtons: Array["from"](
      document["querySelectorAll"]("[data-highlight-color]"),
    ),
  };
}
function syncSelectionRelatedHighlightColorButtons(v2) {
  const v3 = normalizeSelectionRelatedHighlightColor(v2),
    { colorButtons: v4 } = getSelectionRelatedHighlightElements();
  v4["forEach"]((v5) => {
    v5["classList"]["toggle"]("active", v5["dataset"]["highlightColor"] === v3);
  });
}
function syncSelectionRelatedHighlightEnabled(v6) {
  const v7 = v6 !== false,
    {
      btnOn: v8,
      btnOff: v9,
      colorRow: v10,
      colorButtons: v11,
    } = getSelectionRelatedHighlightElements();
  (v8?.["classList"]["toggle"]("active", v7),
    v9?.["classList"]["toggle"]("active", !v7),
    v10?.["classList"]["toggle"]("settings-row-disabled", !v7),
    v11["forEach"]((v12) => {
      ((v12["disabled"] = !v7),
        v12["setAttribute"]("aria-disabled", v7 ? "false" : "true"));
    }));
}
export function setSelectionRelatedHighlightPref(v13, v14 = appStore) {
  const v15 = v13 !== false;
  return (
    v14["setSelectionRelatedHighlightEnabled"](v15),
    syncSelectionRelatedHighlightEnabled(v15),
    v15
  );
}
export function setSelectionRelatedHighlightColorPref(v16, v17 = appStore) {
  const v18 = normalizeSelectionRelatedHighlightColor(v16);
  return (
    v17["setSelectionRelatedHighlightColor"](v18),
    syncSelectionRelatedHighlightColorButtons(v18),
    v18
  );
}
function initSelectionRelatedHighlight() {
  const v19 = document["getElementById"]("btnSelectionRelatedHighlightOn"),
    v20 = document["getElementById"]("btnSelectionRelatedHighlightOff"),
    v21 = Array["from"](document["querySelectorAll"]("[data-highlight-color]"));
  if (!v19 || !v20) return;
  const v22 = appStore["getState"](),
    v23 = v22?.["ui"]?.["selectionRelatedHighlightEnabled"] !== false,
    v24 = normalizeSelectionRelatedHighlightColor(
      v22?.["ui"]?.["selectionRelatedHighlightColor"],
    );
  (setSelectionRelatedHighlightPref(v23),
    setSelectionRelatedHighlightColorPref(v24),
    v19["addEventListener"]("click", () =>
      setSelectionRelatedHighlightPref(true),
    ),
    v20["addEventListener"]("click", () =>
      setSelectionRelatedHighlightPref(false),
    ),
    v21["forEach"]((v25) => {
      v25["addEventListener"]("click", () => {
        if (v25["disabled"]) return;
        setSelectionRelatedHighlightColorPref(v25["dataset"]["highlightColor"]);
      });
    }));
}
function initAlignFeature() {
  const v26 = document["getElementById"]("btnAlignTriggerHold"),
    v27 = document["getElementById"]("btnAlignTriggerClick"),
    v28 = document["getElementById"]("btnAlignTriggerOff"),
    v29 = document["getElementById"]("alignDistributeGapSlider"),
    v30 = document["getElementById"]("alignDistributeGapValue"),
    v31 = document["getElementById"]("alignShortcutLabelMain"),
    v32 = document["getElementById"]("alignShortcutLabelHold"),
    v33 = document["getElementById"]("alignShortcutLabelClick");
  if (!v26 || !v27 || !v28 || !v29 || !v30) return;
  const v34 = (v35) => {
      const v36 = String(v35 || "")["trim"]();
      return v36 === "hold" || v36 === "click" || v36 === "off" ? v36 : "click";
    },
    v37 = () => {
      try {
        const v38 = getShortcuts?.() || {},
          v39 = v38?.["align-feature"]?.["keys"];
        if (Array["isArray"](v39) && v39["length"] > 0) return v39["join"]("+");
      } catch {}
      return "Tab";
    },
    v40 = () => {
      const v41 = v37();
      if (v31) v31["textContent"] = v41;
      if (v32) v32["textContent"] = v41;
      if (v33) v33["textContent"] = v41;
    },
    v42 = (v43) => {
      const v44 = v34(v43);
      appStore["setAlignFeatureTriggerMode"](v44);
      const v45 = v44 !== "off";
      (v26["classList"]["toggle"]("active", v44 === "hold"),
        v27["classList"]["toggle"]("active", v44 === "click"),
        v28["classList"]["toggle"]("active", v44 === "off"),
        window["dispatchEvent"](
          new CustomEvent("v2-align-feature-changed", {
            detail: { enabled: v45, mode: v44 },
          }),
        ));
    },
    v46 = (v47) => {
      const v48 = Number(v47),
        v49 = Number["isFinite"](v48)
          ? Math["max"](0, Math["min"](200, Math["round"](v48 / 5) * 5))
          : 40;
      ((v29["value"] = String(v49)),
        (v30["textContent"] = String(v49)),
        appStore["setAlignDistributeGap"](v49));
    },
    v50 = appStore["getState"]()?.["ui"] || {},
    v51 = v34(v50["alignFeatureTriggerMode"]),
    v52 = Number["isFinite"](Number(v50["alignDistributeGap"]))
      ? Number(v50["alignDistributeGap"])
      : 40;
  (v42(v51),
    v46(v52),
    v40(),
    v26["addEventListener"]("click", () => v42("hold")),
    v27["addEventListener"]("click", () => v42("click")),
    v28["addEventListener"]("click", () => v42("off")),
    v29["addEventListener"]("input", (v53) => v46(v53["target"]?.["value"])),
    window["addEventListener"]("shortcuts-updated", v40));
}
function initConnectionLines() {
  const v54 = document["getElementById"]("btnConnectionLinesOn"),
    v55 = document["getElementById"]("btnConnectionLinesOff"),
    v56 = document["getElementById"]("connectionLinesShortcutLabel");
  if (!v54 || !v55) return;
  const v57 = (v58) => {
      const v59 = v58 !== false;
      (v54["classList"]["toggle"]("active", v59),
        v55["classList"]["toggle"]("active", !v59));
    },
    v60 = (v61) => {
      const v62 = v61 !== false;
      (appStore["setConnectionLinesVisible"](v62),
        v57(v62),
        window["dispatchEvent"](
          new CustomEvent("v2-connection-lines-visibility-changed", {
            detail: { visible: v62 },
          }),
        ));
    },
    v63 = () => {
      if (!v56) return;
      v56["textContent"] = getShortcutLabelByAction(
        "toggle-connection-lines",
        "B",
      );
    };
  (v60(appStore["getState"]()?.["ui"]?.["connectionLinesVisible"] !== false),
    v63(),
    v54["addEventListener"]("click", () => v60(true)),
    v55["addEventListener"]("click", () => v60(false)),
    window["addEventListener"]("shortcuts-updated", v63),
    window["addEventListener"](
      "v2-connection-lines-visibility-changed",
      (v64) => {
        v57(v64?.["detail"]?.["visible"] !== false);
      },
    ));
}
function ensureSnapGuideOverlay() {
  let v65 = document["getElementById"]("v2-snap-guide-overlay");
  (!v65 &&
    ((v65 = document["createElement"]("div")),
    (v65["id"] = "v2-snap-guide-overlay"),
    (v65["className"] = "v2-snap-guide-overlay"),
    document["body"]["appendChild"](v65)),
    (window["_showSnapGuideLines"] = (v66) => {
      if (!v65) return;
      v65["replaceChildren"]();
      if (!Array["isArray"](v66) || v66["length"] === 0) return;
      const v67 = document["createDocumentFragment"]();
      (v66["forEach"]((v68) => {
        if (!v68 || (v68["type"] !== "v" && v68["type"] !== "h")) return;
        const v69 = document["createElement"]("div");
        v69["className"] =
          v68["type"] === "v"
            ? "v2-snap-guide-line is-vertical"
            : "v2-snap-guide-line is-horizontal";
        if (v68["type"] === "v") {
          const v70 = Number["isFinite"](v68["start"]) ? v68["start"] : 0,
            v71 = Number["isFinite"](v68["end"]) ? v68["end"] : v70,
            v72 = Math["min"](v70, v71),
            v73 = Math["max"](1, Math["abs"](v71 - v70));
          ((v69["style"]["left"] = (Number(v68["pos"]) || 0) + "px"),
            (v69["style"]["top"] = v72 + "px"),
            (v69["style"]["height"] = v73 + "px"));
        } else {
          const v74 = Number["isFinite"](v68["start"]) ? v68["start"] : 0,
            v75 = Number["isFinite"](v68["end"]) ? v68["end"] : v74,
            v76 = Math["min"](v74, v75),
            v77 = Math["max"](1, Math["abs"](v75 - v74));
          ((v69["style"]["top"] = (Number(v68["pos"]) || 0) + "px"),
            (v69["style"]["left"] = v76 + "px"),
            (v69["style"]["width"] = v77 + "px"));
        }
        v67["appendChild"](v69);
      }),
        v65["appendChild"](v67));
    }),
    (window["_clearSnapGuideLines"] = () => {
      v65?.["replaceChildren"]();
    }));
}
function initSnapGuides() {
  const v78 = document["getElementById"]("btnSnapGuidesOn"),
    v79 = document["getElementById"]("btnSnapGuidesOff"),
    v80 = document["getElementById"]("snapGuidesShortcutLabel");
  if (!v78 || !v79) return;
  ensureSnapGuideOverlay();
  const v81 = () => {
      const v82 = localStorage["getItem"]("v2-snap-guides");
      if (v82 == null) return true;
      return v82 === "1" || v82 === "true";
    },
    v83 = (v84) => {
      const v85 = v84 !== false;
      (v78["classList"]["toggle"]("active", v85),
        v79["classList"]["toggle"]("active", !v85));
    },
    v86 = (v87) => {
      const v88 = v87 !== false;
      (appStore["setSnapGuidesEnabled"](v88),
        (window["v2SnapGuides"] = v88),
        v83(v88));
      if (!v88) window["_clearSnapGuideLines"]?.();
      window["dispatchEvent"](
        new CustomEvent("v2-snap-guides-changed", { detail: { enabled: v88 } }),
      );
    },
    v89 = () => {
      if (!v80) return;
      v80["textContent"] = getShortcutLabelByAction("snap-guides", "；");
    },
    v90 = appStore["getState"]()?.["ui"]?.["snapGuidesEnabled"],
    v91 = typeof v90 === "boolean" ? v90 : v81();
  (v86(v91),
    v89(),
    v78["addEventListener"]("click", () => v86(true)),
    v79["addEventListener"]("click", () => v86(false)),
    window["addEventListener"]("shortcuts-updated", v89),
    window["addEventListener"]("v2-snap-guides-changed", (v92) => {
      v83(v92?.["detail"]?.["enabled"] !== false);
    }));
}
function initSnapGrid() {
  const v93 = document["getElementById"]("btnSnapGridOn"),
    v94 = document["getElementById"]("btnSnapGridOff"),
    v95 = document["getElementById"]("snapGridShortcutLabel");
  if (!v93 || !v94) return;
  const v96 = () => {
      if (!v95) return;
      v95["textContent"] = getShortcutLabelByAction("snap-grid", "L");
    },
    v97 = readSnapGridEnabled();
  (applySnapGridEnabled(v97, { emitEvent: false }),
    v96(),
    v93["addEventListener"]("click", () => applySnapGridEnabled(true)),
    v94["addEventListener"]("click", () => applySnapGridEnabled(false)),
    window["addEventListener"]("shortcuts-updated", v96),
    subscribeSnapGridChanges((v98) => {
      (v93["classList"]["toggle"]("active", v98 === true),
        v94["classList"]["toggle"]("active", v98 !== true));
    }));
}
export function initCanvasAlignmentSettings() {
  (initSelectionRelatedHighlight(),
    initConnectionLines(),
    initSnapGuides(),
    initSnapGrid(),
    initAlignFeature());
}
