import appStore from "../core/stores/appStore.js";
import { saveOutputBlob } from "./project.js";
import { generateId, screenToWorld, worldToScreen } from "../core/math.js";
import { calcSafeSpawnPosNearNode } from "./nodeSpawn.js";
import {
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from "../services/fileService.js";
import {
  localPathToUrl,
  pickResultLocalPath,
} from "../utils/localMediaPath.js";
export const IMAGE_CROP_MIN_SIZE = 20;
function toFiniteNumber(v0, v1 = 0) {
  const v2 = Number(v0);
  return Number["isFinite"](v2) ? v2 : v1;
}
function clamp(v3, v4, v5) {
  return Math["max"](v4, Math["min"](v5, v3));
}
function normalizeCropNodeBounds(v6) {
  if (!v6 || typeof v6 !== "object") return null;
  const v7 = toFiniteNumber(v6["x"]),
    v8 = toFiniteNumber(v6["y"]),
    v9 = Math["max"](0, toFiniteNumber(v6["width"] ?? v6["w"])),
    v10 = Math["max"](0, toFiniteNumber(v6["height"] ?? v6["h"]));
  if (!(v9 > 0 && v10 > 0)) return null;
  return {
    x: v7,
    y: v8,
    width: v9,
    height: v10,
    right: v7 + v9,
    bottom: v8 + v10,
  };
}
function normalizeCropAspectRatio(v11) {
  const v12 = Number(v11);
  return Number["isFinite"](v12) && v12 > 0 ? v12 : null;
}
function clampPointToNode(v13, v14) {
  return {
    x: clamp(toFiniteNumber(v13?.["x"]), v14["x"], v14["right"]),
    y: clamp(toFiniteNumber(v13?.["y"]), v14["y"], v14["bottom"]),
  };
}
export function buildImageCropDragRect({
  startPoint: v15,
  currentPoint: v16,
  node: v17,
  aspectRatio: aspectRatio = null,
  minSize: minSize = IMAGE_CROP_MIN_SIZE,
} = {}) {
  const v18 = normalizeCropNodeBounds(v17);
  if (!v18) return null;
  const v19 = clampPointToNode(v15, v18),
    v20 = clampPointToNode(v16, v18),
    v21 = v20["x"] - v19["x"],
    v22 = v20["y"] - v19["y"],
    v23 = v21 < 0 ? -1 : 1,
    v24 = v22 < 0 ? -1 : 1;
  let v25 = Math["abs"](v21),
    v26 = Math["abs"](v22);
  const v27 = normalizeCropAspectRatio(aspectRatio);
  if (v27) {
    const v28 = v23 < 0 ? v19["x"] - v18["x"] : v18["right"] - v19["x"],
      v29 = v24 < 0 ? v19["y"] - v18["y"] : v18["bottom"] - v19["y"];
    if (v25 > 0 && v26 > 0)
      v25 / v26 > v27 ? (v25 = v26 * v27) : (v26 = v25 / v27);
    else {
      if (v25 > 0) v26 = v25 / v27;
      else v26 > 0 && (v25 = v26 * v27);
    }
    (v25 > v28 && ((v25 = v28), (v26 = v25 / v27)),
      v26 > v29 && ((v26 = v29), (v25 = v26 * v27)));
  }
  if (!(v25 > 0 && v26 > 0)) return null;
  const v30 = {
      x: v23 < 0 ? v19["x"] - v25 : v19["x"],
      y: v24 < 0 ? v19["y"] - v26 : v19["y"],
      w: v25,
      h: v26,
    },
    v31 = Math["max"](0, toFiniteNumber(minSize, IMAGE_CROP_MIN_SIZE));
  return { rect: v30, isValid: v30["w"] >= v31 && v30["h"] >= v31 };
}
const ImageCropController = {
  active: false,
  nodeData: null,
  cropRect: { x: 0, y: 0, w: 0, h: 0 },
  aspectRatio: null,
  overlayEl: null,
  boxEl: null,
  toolbarEl: null,
  ratioMenuEl: null,
  _unsubscribe: null,
  _view: null,
  _redrawSelection: null,
  init(v32) {
    if (this["active"]) return;
    const v33 = appStore["getStateRaw"](),
      v34 = v33["nodes"]?.[v32];
    if (!v34) return;
    ((this["active"] = true),
      (this["nodeData"] = v34),
      (this["aspectRatio"] = null),
      (this["_view"] = { viewport: v33["viewport"], node: v34 }),
      (this["_redrawSelection"] = null));
    const v35 = 0.1;
    this["cropRect"] = {
      x: v34["x"] + (v34["width"] * v35) / 2,
      y: v34["y"] + (v34["height"] * v35) / 2,
      w: v34["width"] * (1 - v35),
      h: v34["height"] * (1 - v35),
    };
    const v36 = () => {
      (this["_createUI"](),
        this["_bindEvents"](),
        (this["_unsubscribe"] = appStore["subscribeSelector"](
          (v37) => {
            const v38 = v37["nodes"]?.[v32],
              v39 = v37["viewport"] || { x: 0, y: 0, zoom: 1 };
            return {
              hasNode: !!v38,
              nx: v38 ? v38["x"] : 0,
              ny: v38 ? v38["y"] : 0,
              nw: v38 ? v38["width"] : 0,
              nh: v38 ? v38["height"] : 0,
              vx: v39["x"],
              vy: v39["y"],
              vz: v39["zoom"] || 1,
            };
          },
          (v40) => {
            if (!v40?.["hasNode"]) return;
            const v41 = appStore["getStateRaw"]()["nodes"]?.[v32];
            if (!v41) return;
            ((this["_view"] = {
              viewport: { x: v40["vx"], y: v40["vy"], zoom: v40["vz"] },
              node: v41,
            }),
              this["_updateView"](this["_view"]));
          },
        )),
        requestAnimationFrame(() => {
          if (this["overlayEl"])
            this["overlayEl"]["classList"]["add"]("visible");
          if (this["dimMaskEl"])
            this["dimMaskEl"]["classList"]["add"]("visible");
        }));
    };
    typeof requestIdleCallback !== "undefined"
      ? requestIdleCallback(v36, { timeout: 50 })
      : setTimeout(v36, 0);
  },
  _createUI() {
    const v42 = document["createDocumentFragment"](),
      v43 = document["createElement"]("div");
    ((v43["className"] = "v2-crop-overlay"),
      (v43["style"]["willChange"] = "opacity"));
    const v44 = document["createElement"]("div");
    v44["className"] = "v2-crop-dim-mask";
    const v45 = document["createElement"]("div");
    ((v45["className"] = "v2-crop-container"),
      (v45["style"]["transform"] = "translateZ(0)"));
    const v46 = document["createElement"]("div");
    ((v46["className"] = "v2-crop-box"),
      (v46["style"]["willChange"] = "transform, width, height"),
      (v46["style"]["transform"] = "translateZ(0)"));
    const v47 = document["createElement"]("div");
    ((v47["className"] = "v2-crop-grid"), v47["replaceChildren"]());
    for (let v48 = 0; v48 < 9; v48++)
      v47["appendChild"](document["createElement"]("div"));
    v46["appendChild"](v47);
    const v49 = ["tl", "tm", "tr", "rm", "br", "bm", "bl", "lm"];
    (v49["forEach"]((v50) => {
      const v51 = document["createElement"]("div");
      ((v51["className"] = "v2-crop-handle " + v50),
        (v51["dataset"]["handle"] = v50),
        v46["appendChild"](v51));
    }),
      v45["appendChild"](v46),
      v43["appendChild"](v45),
      v42["appendChild"](v44),
      v42["appendChild"](v43));
    const v52 = document["createElement"]("div");
    ((v52["className"] = "v2-crop-size-label"),
      (v52["textContent"] = "--\x20x\x20--"),
      v42["appendChild"](v52),
      (this["sizeLabelEl"] = v52),
      (this["dimMaskEl"] = v44));
    const v53 = document["createElement"]("div");
    ((v53["className"] = "v2-crop-toolbar"),
      (v53["style"]["willChange"] = "opacity, transform"));
    const v54 = "http://www.w3.org/2000/svg",
      v55 = (v56, v57, v58) => {
        const v59 = document["createElementNS"](v54, "svg");
        return (
          v59["setAttribute"]("width", String(v56)),
          v59["setAttribute"]("height", String(v57)),
          v59["setAttribute"]("viewBox", "0 0 24 24"),
          v59["setAttribute"]("fill", "none"),
          v59["setAttribute"]("stroke", "currentColor"),
          v59["setAttribute"]("stroke-width", String(v58)),
          v59
        );
      },
      v60 = document["createElement"]("button");
    ((v60["className"] = "v2-crop-toolbar-btn exit"),
      (v60["title"] = "退出 (Esc)"));
    const v61 = v55(18, 18, 2),
      v62 = document["createElementNS"](v54, "path");
    v62["setAttribute"]("d", "M18 6L6 18");
    const v63 = document["createElementNS"](v54, "path");
    (v63["setAttribute"]("d", "M6 6l12 12"),
      v61["appendChild"](v62),
      v61["appendChild"](v63),
      v60["appendChild"](v61));
    const v64 = document["createElement"]("div");
    v64["className"] = "v2-crop-divider";
    const v65 = document["createElement"]("div");
    v65["className"] = "v2-expand-wrap";
    const v66 = document["createElement"]("button");
    v66["className"] = "v2-crop-toolbar-btn ratio-toggle";
    const v67 = v55(16, 16, 2),
      v68 = document["createElementNS"](v54, "rect");
    (v68["setAttribute"]("x", "3"),
      v68["setAttribute"]("y", "3"),
      v68["setAttribute"]("width", "18"),
      v68["setAttribute"]("height", "18"),
      v68["setAttribute"]("rx", "2"));
    const v69 = document["createElementNS"](v54, "path");
    (v69["setAttribute"]("d", "M3 9h18M9 21V9"),
      v67["appendChild"](v68),
      v67["appendChild"](v69));
    const v70 = document["createElement"]("span");
    ((v70["className"] = "ratio-text"),
      (v70["textContent"] = "自由比例"),
      v66["appendChild"](v67),
      v66["appendChild"](v70));
    const v71 = document["createElement"]("div");
    v71["className"] = "floating-menu v2-expand-menu v2-crop-ratio-menu";
    const v72 = [
      { v: "free", t: "自由比例", active: true },
      { v: "original", t: "原图比例" },
      { v: "21:9", t: "21:9" },
      { v: "16:9", t: "16:9" },
      { v: "9:16", t: "9:16" },
      { v: "4:3", t: "4:3" },
      { v: "3:4", t: "3:4" },
      { v: "1:1", t: "1:1" },
    ];
    (v72["forEach"]((v73) => {
      const v74 = document["createElement"]("div");
      ((v74["className"] =
        "floating-menu-item v2-expand-menu-item v2-crop-ratio-item" +
        (v73["active"] ? "\x20active" : "")),
        (v74["dataset"]["ratio"] = v73["v"]));
      const v75 = document["createElement"]("span");
      ((v75["className"] = "floating-menu-label"),
        (v75["textContent"] = v73["t"]),
        v74["appendChild"](v75),
        v71["appendChild"](v74));
    }),
      v65["appendChild"](v66),
      v65["appendChild"](v71));
    const v76 = document["createElement"]("div");
    v76["className"] = "v2-crop-divider";
    const v77 = document["createElement"]("button");
    v77["className"] = "v2-crop-toolbar-btn\x20confirm";
    const v78 = v55(18, 18, 2),
      v79 = document["createElementNS"](v54, "polyline");
    (v79["setAttribute"]("points", "20 6 9 17 4 12"),
      v78["appendChild"](v79),
      v77["appendChild"](v78),
      v77["appendChild"](document["createTextNode"](" 确认裁剪")),
      v53["appendChild"](v60),
      v53["appendChild"](v64),
      v53["appendChild"](v65),
      v53["appendChild"](v76),
      v53["appendChild"](v77),
      document["body"]["appendChild"](v42),
      document["body"]["appendChild"](v53),
      (this["overlayEl"] = v43),
      (this["boxEl"] = v46),
      (this["toolbarEl"] = v53),
      (this["ratioMenuEl"] = v71),
      requestAnimationFrame(() => {
        if (this["_containerEl"]) this["_containerEl"]["_lastTransform"] = null;
        if (this["boxEl"]) this["boxEl"]["_lastTransform"] = null;
        this["_updateView"]();
      }));
  },
  _updateView(v80 = this["_view"]) {
    if (!this["active"]) return;
    const v81 = v80?.["node"],
      v82 = v80?.["viewport"];
    if (!v81) return;
    this["nodeData"] = v81;
    const v83 = worldToScreen(
        this["nodeData"]["x"],
        this["nodeData"]["y"],
        v82,
      ),
      v84 = {
        w: Math["round"](this["nodeData"]["width"] * v82["zoom"]),
        h: Math["round"](this["nodeData"]["height"] * v82["zoom"]),
      };
    !this["_containerEl"] &&
      (this["_containerEl"] =
        this["overlayEl"]["querySelector"](".v2-crop-container"));
    const v85 = this["_containerEl"],
      v86 =
        "translate(" +
        Math["round"](v83["x"]) +
        "px, " +
        Math["round"](v83["y"]) +
        "px)\x20translateZ(0)";
    v85["_lastTransform"] !== v86 &&
      ((v85["style"]["transform"] = v86), (v85["_lastTransform"] = v86));
    ((v85["style"]["width"] = v84["w"] + "px"),
      (v85["style"]["height"] = v84["h"] + "px"),
      (v85["style"]["position"] = "fixed"));
    const v87 = {
      x: Math["max"](
        0,
        Math["round"](
          (this["cropRect"]["x"] - this["nodeData"]["x"]) * v82["zoom"],
        ),
      ),
      y: Math["max"](
        0,
        Math["round"](
          (this["cropRect"]["y"] - this["nodeData"]["y"]) * v82["zoom"],
        ),
      ),
      w: Math["round"](this["cropRect"]["w"] * v82["zoom"]),
      h: Math["round"](this["cropRect"]["h"] * v82["zoom"]),
    };
    v87["x"] + v87["w"] > v84["w"] && (v87["w"] = v84["w"] - v87["x"]);
    v87["y"] + v87["h"] > v84["h"] && (v87["h"] = v84["h"] - v87["y"]);
    const v88 =
      "translate(" + v87["x"] + "px, " + v87["y"] + "px) translateZ(0)";
    this["boxEl"]["_lastTransform"] !== v88 &&
      ((this["boxEl"]["style"]["transform"] = v88),
      (this["boxEl"]["_lastTransform"] = v88));
    ((this["boxEl"]["style"]["width"] = v87["w"] + "px"),
      (this["boxEl"]["style"]["height"] = v87["h"] + "px"),
      (this["boxEl"]["style"]["left"] = "0"),
      (this["boxEl"]["style"]["top"] = "0"));
    if (this["sizeLabelEl"]) {
      const v89 = Math["round"](this["cropRect"]["w"]),
        v90 = Math["round"](this["cropRect"]["h"]);
      this["sizeLabelEl"]["textContent"] = v89 + " × " + v90;
      const v91 = v83["y"] + v87["y"] - 32,
        v92 = v83["x"] + v87["x"] + v87["w"] / 2;
      ((this["sizeLabelEl"]["style"]["top"] = v91 + "px"),
        (this["sizeLabelEl"]["style"]["left"] = v92 + "px"));
    }
    if (this["toolbarEl"]) {
      const v93 = v83["y"] + v84["h"] + 14 * v82["zoom"],
        v94 = v83["x"] + v84["w"] / 2;
      ((this["toolbarEl"]["style"]["top"] = v93 + "px"),
        (this["toolbarEl"]["style"]["left"] = v94 + "px"),
        (this["toolbarEl"]["style"]["transform"] = "translateX(-50%)"));
    }
    if (this["dimMaskEl"]) {
      const v95 = v83["x"] + v87["x"],
        v96 = v83["y"] + v87["y"],
        v97 = v87["w"],
        v98 = v87["h"],
        v99 =
          "polygon(\n        0% 0%, 100% 0%, 100% 100%, 0% 100%,\n        0% 0%,\n        " +
          v95 +
          "px\x20" +
          v96 +
          "px,\n        " +
          v95 +
          "px " +
          (v96 + v98) +
          "px,\x0a\x20\x20\x20\x20\x20\x20\x20\x20" +
          (v95 + v97) +
          "px " +
          (v96 + v98) +
          "px,\n        " +
          (v95 + v97) +
          "px " +
          v96 +
          "px,\n        " +
          v95 +
          "px " +
          v96 +
          "px\n      )";
      this["dimMaskEl"]["style"]["clipPath"] = v99;
    }
  },
  _applyRedrawVisualState() {
    const v100 = this["_redrawSelection"]?.["mode"] || "",
      v101 = v100 === "armed" || v100 === "dragging",
      v102 = v100 === "dragging";
    for (const v103 of [
      this["overlayEl"],
      this["dimMaskEl"],
      this["sizeLabelEl"],
    ]) {
      (v103?.["classList"]?.["toggle"]("is-redraw-armed", v101),
        v103?.["classList"]?.["toggle"]("is-redraw-dragging", v102));
    }
  },
  _isPointInsideNode(v104) {
    if (!this["nodeData"] || !v104) return false;
    return (
      v104["x"] >= this["nodeData"]["x"] &&
      v104["x"] <= this["nodeData"]["x"] + this["nodeData"]["width"] &&
      v104["y"] >= this["nodeData"]["y"] &&
      v104["y"] <= this["nodeData"]["y"] + this["nodeData"]["height"]
    );
  },
  _getWorldPointFromEvent(v105) {
    const v106 = this["_view"]?.["viewport"] || { x: 0, y: 0, zoom: 1 };
    return screenToWorld(v105["clientX"], v105["clientY"], v106);
  },
  _enterRedrawSelectionMode() {
    if (!this["active"]) return;
    const v107 = this["_redrawSelection"]?.["mode"] || "";
    if (v107 === "dragging") return;
    (v107 !== "armed" &&
      (this["_redrawSelection"] = {
        mode: "armed",
        previousRect: { ...this["cropRect"] },
        pointerId: null,
        startPoint: null,
      }),
      this["_applyRedrawVisualState"]());
  },
  _exitRedrawSelectionMode({ restore: restore = true } = {}) {
    const v108 = this["_redrawSelection"]?.["previousRect"];
    ((this["_redrawSelection"] = null),
      restore &&
        v108 &&
        ((this["cropRect"] = { ...v108 }), this["_updateView"](this["_view"])),
      this["_applyRedrawVisualState"]());
  },
  _beginRedrawSelection(v109) {
    const v110 = this["_getWorldPointFromEvent"](v109);
    if (!this["_isPointInsideNode"](v110)) return false;
    const v111 = this["_redrawSelection"]?.["previousRect"] || {
      ...this["cropRect"],
    };
    return (
      (this["_redrawSelection"] = {
        mode: "dragging",
        previousRect: v111,
        pointerId: v109["pointerId"],
        startPoint: v110,
        lastResult: null,
      }),
      (this["cropRect"] = { x: v110["x"], y: v110["y"], w: 0, h: 0 }),
      this["_applyRedrawVisualState"](),
      this["_updateView"](this["_view"]),
      this["overlayEl"]?.["setPointerCapture"]?.(v109["pointerId"]),
      true
    );
  },
  _updateRedrawSelection(v112) {
    const v113 = this["_redrawSelection"];
    if (v113?.["mode"] !== "dragging") return;
    const v114 = this["_getWorldPointFromEvent"](v112),
      v115 = buildImageCropDragRect({
        startPoint: v113["startPoint"],
        currentPoint: v114,
        node: this["nodeData"],
        aspectRatio: this["aspectRatio"],
        minSize: IMAGE_CROP_MIN_SIZE,
      });
    ((v113["lastResult"] = v115),
      v115?.["rect"] &&
        ((this["cropRect"] = { ...v115["rect"] }),
        this["_updateView"](this["_view"])));
  },
  _finishRedrawSelection(v116, { cancel: cancel = false } = {}) {
    const v117 = this["_redrawSelection"];
    if (v117?.["mode"] !== "dragging") return;
    !cancel && this["_updateRedrawSelection"](v116);
    const v118 = v117["lastResult"],
      v119 = v117["previousRect"],
      v120 =
        !cancel && v118?.["isValid"] && v118?.["rect"]
          ? { ...v118["rect"] }
          : v119;
    this["_redrawSelection"] = null;
    v120 && (this["cropRect"] = { ...v120 });
    try {
      this["overlayEl"]?.["releasePointerCapture"]?.(v117["pointerId"]);
    } catch {}
    (this["_applyRedrawVisualState"](), this["_updateView"](this["_view"]));
  },
  _bindEvents() {
    const v121 = (v122) => v122["stopPropagation"]();
    this["overlayEl"]["addEventListener"]("wheel", v121, { passive: false });
    const v123 = () => this["_updateView"](this["_view"]);
    window["addEventListener"]("resize", v123);
    let v124 = false,
      v125 = { x: 0, y: 0 },
      v126 = { ...this["cropRect"] },
      v127 = null;
    const v128 = (v129) => {
      if (v129["key"] === "Escape") {
        if (this["_redrawSelection"]?.["mode"] === "dragging") {
          this["_finishRedrawSelection"](v129, { cancel: true });
          return;
        }
        this["exit"]();
        return;
      }
      v129["key"] === "Control" &&
        !v124 &&
        !v127 &&
        this["_enterRedrawSelectionMode"]();
    };
    window["addEventListener"]("keydown", v128);
    const v130 = (v131) => {
      if (v131["key"] !== "Control") return;
      this["_redrawSelection"]?.["mode"] === "armed" &&
        this["_exitRedrawSelectionMode"]({ restore: true });
    };
    window["addEventListener"]("keyup", v130);
    const v132 = (v133) => {
        if (!v133["ctrlKey"] || v124 || v127) return;
        if (!this["_beginRedrawSelection"](v133)) return;
        (v133["preventDefault"](), v133["stopPropagation"]());
      },
      v134 = (v135) => {
        if (
          this["_redrawSelection"]?.["mode"] !== "dragging" ||
          this["_redrawSelection"]["pointerId"] !== v135["pointerId"]
        )
          return;
        (v135["preventDefault"](),
          v135["stopPropagation"](),
          this["_updateRedrawSelection"](v135));
      },
      v136 = (v137) => {
        if (
          this["_redrawSelection"]?.["mode"] !== "dragging" ||
          this["_redrawSelection"]["pointerId"] !== v137["pointerId"]
        )
          return;
        (v137["preventDefault"](),
          v137["stopPropagation"](),
          this["_finishRedrawSelection"](v137));
      },
      v138 = (v139) => {
        if (
          this["_redrawSelection"]?.["mode"] !== "dragging" ||
          this["_redrawSelection"]["pointerId"] !== v139["pointerId"]
        )
          return;
        (v139["preventDefault"](),
          v139["stopPropagation"](),
          this["_finishRedrawSelection"](v139, { cancel: true }));
      };
    (this["overlayEl"]["addEventListener"]("pointerdown", v132, true),
      this["overlayEl"]["addEventListener"]("pointermove", v134, true),
      this["overlayEl"]["addEventListener"]("pointerup", v136, true),
      this["overlayEl"]["addEventListener"]("pointercancel", v138, true),
      this["boxEl"]["addEventListener"]("pointerdown", (v140) => {
        if (v140["target"]["classList"]["contains"]("v2-crop-handle")) return;
        if (v140["ctrlKey"]) return;
        (v140["stopPropagation"](),
          (v124 = true),
          (v125 = { x: v140["clientX"], y: v140["clientY"] }),
          (v126 = { ...this["cropRect"] }),
          this["boxEl"]["setPointerCapture"](v140["pointerId"]));
      }),
      this["boxEl"]["addEventListener"]("pointermove", (v141) => {
        if (!v124) return;
        const v142 = this["_view"]?.["viewport"]?.["zoom"] || 1,
          v143 = (v141["clientX"] - v125["x"]) / v142,
          v144 = (v141["clientY"] - v125["y"]) / v142;
        let v145 = v126["x"] + v143,
          v146 = v126["y"] + v144;
        const v147 = IMAGE_CROP_MIN_SIZE,
          v148 = IMAGE_CROP_MIN_SIZE;
        ((v145 = Math["max"](
          this["nodeData"]["x"],
          Math["min"](
            v145,
            this["nodeData"]["x"] +
              this["nodeData"]["width"] -
              this["cropRect"]["w"],
          ),
        )),
          (v146 = Math["max"](
            this["nodeData"]["y"],
            Math["min"](
              v146,
              this["nodeData"]["y"] +
                this["nodeData"]["height"] -
                this["cropRect"]["h"],
            ),
          )),
          (this["cropRect"]["x"] = v145),
          (this["cropRect"]["y"] = v146),
          this["_updateView"](this["_view"]));
      }));
    const v149 = () => {
      v124 = false;
    };
    (this["boxEl"]["addEventListener"]("pointerup", v149),
      this["boxEl"]["addEventListener"]("pointercancel", v149),
      this["boxEl"]["addEventListener"]("pointerdown", (v150) => {
        const v151 = v150["target"]["closest"](".v2-crop-handle");
        if (!v151) return;
        if (v150["ctrlKey"]) return;
        (v150["stopPropagation"](),
          (v127 = v151["dataset"]["handle"]),
          (v125 = { x: v150["clientX"], y: v150["clientY"] }),
          (v126 = { ...this["cropRect"] }),
          v151["setPointerCapture"](v150["pointerId"]));
      }),
      this["boxEl"]["addEventListener"]("pointermove", (v152) => {
        if (!v127) return;
        const v153 = this["_view"]?.["viewport"]?.["zoom"] || 1,
          v154 = (v152["clientX"] - v125["x"]) / v153,
          v155 = (v152["clientY"] - v125["y"]) / v153;
        let { x: v156, y: v157, w: v158, h: v159 } = v126;
        const v160 = (v161, v162) => {
            const v163 = IMAGE_CROP_MIN_SIZE;
            if (v162) {
              const v164 = v126["x"] + v126["w"] - v163;
              ((v156 = Math["max"](
                this["nodeData"]["x"],
                Math["min"](v126["x"] + v154, v164),
              )),
                (v158 = v126["w"] - (v156 - v126["x"])));
            } else
              v158 = Math["max"](
                v163,
                Math["min"](
                  v161,
                  this["nodeData"]["x"] + this["nodeData"]["width"] - v156,
                ),
              );
          },
          v165 = (v166, v167) => {
            const v168 = IMAGE_CROP_MIN_SIZE;
            if (v167) {
              const v169 = v126["y"] + v126["h"] - v168;
              ((v157 = Math["max"](
                this["nodeData"]["y"],
                Math["min"](v126["y"] + v155, v169),
              )),
                (v159 = v126["h"] - (v157 - v126["y"])));
            } else
              v159 = Math["max"](
                v168,
                Math["min"](
                  v166,
                  this["nodeData"]["y"] + this["nodeData"]["height"] - v157,
                ),
              );
          };
        if (v127["includes"]("r")) v160(v126["w"] + v154, false);
        if (v127["includes"]("l")) v160(v126["w"] - v154, true);
        if (v127["includes"]("b")) v165(v126["h"] + v155, false);
        if (v127["includes"]("t")) v165(v126["h"] - v155, true);
        if (this["aspectRatio"]) {
          if (v127 === "tm" || v127 === "bm" || v127 === "lm" || v127 === "rm")
            v127["includes"]("m") &&
              (v127 === "tm" || v127 === "bm"
                ? ((v158 = v159 * this["aspectRatio"]),
                  (v156 = v126["x"] + (v126["w"] - v158) / 2))
                : ((v159 = v158 / this["aspectRatio"]),
                  (v157 = v126["y"] + (v126["h"] - v159) / 2)));
          else {
            const v170 = v158 / v159;
            v170 > this["aspectRatio"]
              ? (v159 = v158 / this["aspectRatio"])
              : (v158 = v159 * this["aspectRatio"]);
            if (v127["includes"]("t")) v157 = v126["y"] + v126["h"] - v159;
            if (v127["includes"]("l")) v156 = v126["x"] + v126["w"] - v158;
          }
          (v156 < this["nodeData"]["x"] &&
            ((v156 = this["nodeData"]["x"]),
            (v158 = v159 * this["aspectRatio"])),
            v157 < this["nodeData"]["y"] &&
              ((v157 = this["nodeData"]["y"]),
              (v159 = v158 / this["aspectRatio"])),
            v156 + v158 > this["nodeData"]["x"] + this["nodeData"]["width"] &&
              ((v158 =
                this["nodeData"]["x"] + this["nodeData"]["width"] - v156),
              (v159 = v158 / this["aspectRatio"])),
            v157 + v159 > this["nodeData"]["y"] + this["nodeData"]["height"] &&
              ((v159 =
                this["nodeData"]["y"] + this["nodeData"]["height"] - v157),
              (v158 = v159 * this["aspectRatio"])));
        }
        ((this["cropRect"] = { x: v156, y: v157, w: v158, h: v159 }),
          this["_updateView"]());
      }));
    const v171 = () => {
      v127 = null;
    };
    (this["boxEl"]["addEventListener"]("pointerup", v171),
      this["boxEl"]["addEventListener"]("pointercancel", v171),
      (this["toolbarEl"]["querySelector"](".exit")["onclick"] = () =>
        this["exit"]()));
    const v172 = this["toolbarEl"]["querySelector"](".ratio-toggle");
    ((v172["onclick"] = (v173) => {
      (v173["stopPropagation"](),
        this["ratioMenuEl"]["classList"]["toggle"]("open"));
    }),
      (this["ratioMenuEl"]["onclick"] = (v174) => {
        const v175 = v174["target"]["closest"](".v2-crop-ratio-item");
        if (!v175) return;
        (this["ratioMenuEl"]
          ["querySelectorAll"](".v2-crop-ratio-item")
          ["forEach"]((v176) => v176["classList"]["remove"]("active")),
          v175["classList"]["add"]("active"),
          this["ratioMenuEl"]["classList"]["remove"]("open"));
        const v177 = v175["dataset"]["ratio"];
        this["toolbarEl"]["querySelector"](".ratio-text")["textContent"] =
          v175["textContent"];
        if (v177 === "free") {
          ((this["aspectRatio"] = null), this["_updateView"](this["_view"]));
          return;
        }
        if (v177 === "original")
          this["aspectRatio"] =
            this["nodeData"]["width"] / this["nodeData"]["height"];
        else {
          const [v178, v179] = v177["split"](":")["map"](Number);
          if (
            !Number["isFinite"](v178) ||
            !Number["isFinite"](v179) ||
            v178 <= 0 ||
            v179 <= 0
          ) {
            ((this["aspectRatio"] = null), this["_updateView"](this["_view"]));
            return;
          }
          this["aspectRatio"] = v178 / v179;
        }
        let v180 = this["cropRect"]["w"],
          v181 = v180 / this["aspectRatio"];
        (v181 > this["nodeData"]["height"] &&
          ((v181 = this["nodeData"]["height"]),
          (v180 = v181 * this["aspectRatio"])),
          v180 > this["nodeData"]["width"] &&
            ((v180 = this["nodeData"]["width"]),
            (v181 = v180 / this["aspectRatio"])),
          (this["cropRect"]["w"] = v180),
          (this["cropRect"]["h"] = v181),
          (this["cropRect"]["x"] =
            this["nodeData"]["x"] + (this["nodeData"]["width"] - v180) / 2),
          (this["cropRect"]["y"] =
            this["nodeData"]["y"] + (this["nodeData"]["height"] - v181) / 2),
          this["_updateView"](this["_view"]));
      }),
      (this["toolbarEl"]["querySelector"](".confirm")["onclick"] = () =>
        this["confirm"]()));
    const v182 = (v183) => {
      !this["ratioMenuEl"]["contains"](v183["target"]) &&
        !v172["contains"](v183["target"]) &&
        this["ratioMenuEl"]["classList"]["remove"]("open");
    };
    (document["addEventListener"]("pointerdown", v182),
      (this["cleanup"] = () => {
        (window["removeEventListener"]("resize", v123),
          window["removeEventListener"]("keydown", v128),
          window["removeEventListener"]("keyup", v130),
          document["removeEventListener"]("pointerdown", v182),
          this["overlayEl"]["removeEventListener"]("wheel", v121),
          this["overlayEl"]["removeEventListener"]("pointerdown", v132, true),
          this["overlayEl"]["removeEventListener"]("pointermove", v134, true),
          this["overlayEl"]["removeEventListener"]("pointerup", v136, true),
          this["overlayEl"]["removeEventListener"](
            "pointercancel",
            v138,
            true,
          ));
      }));
  },
  exit() {
    if (!this["active"]) return;
    this["active"] = false;
    this["_unsubscribe"] &&
      (this["_unsubscribe"](), (this["_unsubscribe"] = null));
    this["_containerEl"] = null;
    this["boxEl"] && (this["boxEl"]["_lastTransform"] = null);
    if (this["overlayEl"]) this["overlayEl"]["classList"]["remove"]("visible");
    if (this["dimMaskEl"]) this["dimMaskEl"]["classList"]["remove"]("visible");
    setTimeout(() => {
      if (this["overlayEl"]) this["overlayEl"]["remove"]();
      if (this["toolbarEl"]) this["toolbarEl"]["remove"]();
      if (this["dimMaskEl"]) this["dimMaskEl"]["remove"]();
      if (this["sizeLabelEl"]) this["sizeLabelEl"]["remove"]();
      (this["cleanup"]?.(),
        (this["overlayEl"] = null),
        (this["boxEl"] = null),
        (this["toolbarEl"] = null),
        (this["ratioMenuEl"] = null),
        (this["dimMaskEl"] = null),
        (this["sizeLabelEl"] = null),
        (this["_view"] = null),
        (this["_redrawSelection"] = null));
    }, 300);
  },
  async confirm() {
    const v184 = this["toolbarEl"]["querySelector"](".confirm"),
      v185 = Array["from"](v184["childNodes"])["map"]((v186) =>
        v186["cloneNode"](true),
      );
    ((v184["textContent"] = "处理中..."),
      (v184["style"]["pointerEvents"] = "none"));
    try {
      const v187 = this["nodeData"]["localPath"]
          ? "/" + this["nodeData"]["localPath"]
          : this["nodeData"]["src"] || this["nodeData"]["sourceUrl"],
        v188 = await this["_loadImage"](v187),
        v189 = v188["naturalWidth"] / this["nodeData"]["width"],
        v190 = v188["naturalHeight"] / this["nodeData"]["height"],
        v191 = (this["cropRect"]["x"] - this["nodeData"]["x"]) * v189,
        v192 = (this["cropRect"]["y"] - this["nodeData"]["y"]) * v190,
        v193 = this["cropRect"]["w"] * v189,
        v194 = this["cropRect"]["h"] * v190,
        v195 = document["createElement"]("canvas");
      ((v195["width"] = v193), (v195["height"] = v194));
      const v196 = v195["getContext"]("2d");
      v196["drawImage"](v188, v191, v192, v193, v194, 0, 0, v193, v194);
      const v197 = await new Promise((v198) =>
          v195["toBlob"](v198, "image/jpeg", 0.9),
        ),
        v199 = new File([v197], "crop_" + Date["now"]() + ".jpg", {
          type: "image/jpeg",
        }),
        v200 = await saveOutputBlob(v199, { ext: "jpg" }),
        v201 = pickResultLocalPath(v200),
        v202 = String(v200["url"] || "")["trim"]() || localPathToUrl(v201),
        v203 = getAutoMediaSizeByShortSide(
          this["cropRect"]["w"],
          this["cropRect"]["h"],
        ),
        v204 = calcSafeSpawnPosNearNode(
          appStore["getStateRaw"]()["nodes"],
          this["nodeData"],
          v203["width"],
          v203["height"],
        ),
        v205 = v204["x"],
        v206 = v204["y"],
        v207 = generateId("source-image-crop");
      (appStore["addNode"](
        buildSourceMediaNodePayload({
          id: v207,
          type: "source-image",
          x: v205,
          y: v206,
          width: v203["width"],
          height: v203["height"],
          name: "裁剪自 " + (this["nodeData"]["name"] || "图片"),
          src: v202,
          localPath: v201,
          fileName: v200["filename"] || v199["name"],
          needsAutoResize: false,
        }),
      ),
        appStore["setSelectedNodes"]([v207]),
        window["v2FocusOnNodes"] &&
          window["v2FocusOnNodes"]([this["nodeData"]["id"], v207]),
        window["_triggerLocalCacheSave"]?.(),
        window["showToast"]?.("裁剪成功", "success"),
        this["exit"]());
    } catch (v208) {
      (console["error"]("[Crop] Failed:", v208),
        window["showToast"]?.("裁剪失败: " + v208["message"], "error"),
        v184["replaceChildren"](
          ...v185["map"]((v209) => v209["cloneNode"](true)),
        ),
        (v184["style"]["pointerEvents"] = "auto"));
    }
  },
  _loadImage(v210) {
    return new Promise((v211, v212) => {
      const v213 = new Image();
      ((v213["crossOrigin"] = "anonymous"),
        (v213["onload"] = () => v211(v213)),
        (v213["onerror"] = () => v212(new Error("原图加载失败"))),
        (v213["src"] = v210));
    });
  },
};
export default ImageCropController;
