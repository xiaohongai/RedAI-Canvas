import appStore from "../core/stores/appStore.js";
import { generateId, screenToWorld } from "../core/math.js";
import { commit } from "../modules/history.js";
import { calcSafeSpawnPosNearNode } from "../modules/nodeSpawn.js";
import { saveOutputBlob } from "../modules/project.js";
import {
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from "../services/fileService.js";
import {
  buildCollageAspectRatioPatch,
  buildCollageCollapsePatch,
  buildCollageDividerDragPatch,
  buildCollageItemSwapPatch,
  buildCollageLayoutPatch,
  COLLAGE_ASPECT_RATIO_OPTIONS,
  COLLAGE_BACKGROUND_OPTIONS,
  COLLAGE_EXPORT_RESOLUTIONS,
  COLLAGE_TEMPLATE_GROUPS,
  getCollageAspectRatioOption,
  getCollageBackgroundOption,
  getCollageExportResolution,
  getCollageLayoutStyle,
  getCollageLayoutPreset,
  isCollageBackgroundTransparent,
  isCollageItemEmpty,
  normalizeCollageImageScale,
  normalizeCollageBackgroundColor,
  normalizeEmptyCollageItem,
  normalizeCollageStyleValue,
  resolveCollageExportSize,
  resolveCollageEditableDividers,
  resolveCollageItemFrames,
  resolveCollageItemPreviewUrl,
  resolveCollageSizeByShortSide,
  resolveCollageItemSourceImage,
} from "../modules/collage/collageFactory.js";
const COLLAGE_IMAGE_DRAG_OUT_THRESHOLD_PX = 8,
  COLLAGE_IMAGE_LOAD_CACHE_LIMIT = 48,
  collageImageLoadCache = new Map();
function toPositiveNumber(v0, v1 = 0) {
  const v2 = Number(v0);
  return Number["isFinite"](v2) && v2 > 0 ? v2 : v1;
}
function clamp01(v3, v4 = 0.5) {
  const v5 = Number(v3);
  if (!Number["isFinite"](v5)) return v4;
  return Math["min"](1, Math["max"](0, v5));
}
function createSvgIcon(v6) {
  const v7 = "http://www.w3.org/2000/svg",
    v8 = document["createElementNS"](v7, "svg");
  (v8["setAttribute"]("width", "16"),
    v8["setAttribute"]("height", "16"),
    v8["setAttribute"]("viewBox", "0\x200\x2024\x2024"),
    v8["setAttribute"]("fill", "none"),
    v8["setAttribute"]("stroke", "currentColor"),
    v8["setAttribute"]("stroke-width", "2"),
    v8["setAttribute"]("stroke-linecap", "round"),
    v8["setAttribute"]("stroke-linejoin", "round"));
  for (const v9 of v6) {
    const v10 = document["createElementNS"](v7, "path");
    (v10["setAttribute"]("d", v9), v8["appendChild"](v10));
  }
  return v8;
}
function canvasToBlob(v11, v12, v13) {
  return new Promise((v14, v15) => {
    v11["toBlob"](
      (v16) => {
        if (v16) v14(v16);
        else v15(new Error("拼图导出失败"));
      },
      v12,
      v13,
    );
  });
}
function loadImage(v17) {
  const v18 = String(v17 || "")["trim"]();
  if (!v18) return Promise["reject"](new Error("图片地址为空"));
  const v19 = collageImageLoadCache["get"](v18);
  if (v19)
    return (
      collageImageLoadCache["delete"](v18),
      collageImageLoadCache["set"](v18, v19),
      v19
    );
  const v20 = new Promise((v21, v22) => {
    const v23 = new Image();
    ((v23["crossOrigin"] = "anonymous"),
      (v23["onload"] = () => {
        typeof v23["decode"] === "function"
          ? v23["decode"]()
              ["catch"](() => {})
              ["finally"](() => v21(v23))
          : v21(v23);
      }),
      (v23["onerror"] = () => {
        (collageImageLoadCache["delete"](v18), v22(new Error("图片加载失败")));
      }),
      (v23["src"] = v18));
  });
  collageImageLoadCache["set"](v18, v20);
  while (collageImageLoadCache["size"] > COLLAGE_IMAGE_LOAD_CACHE_LIMIT) {
    const v24 = collageImageLoadCache["keys"]()["next"]()["value"];
    collageImageLoadCache["delete"](v24);
  }
  return v20;
}
function drawImageCover(v25, v26, v27, v28, v29, v30, v31, v32, v33 = 1) {
  const v34 = v26["naturalWidth"] || v26["width"],
    v35 = v26["naturalHeight"] || v26["height"];
  if (!(v34 > 0 && v35 > 0 && v29 > 0 && v30 > 0)) return false;
  const v36 = v29 / v30,
    v37 = v34 / v35,
    v38 = normalizeCollageImageScale(v33);
  let v39 = 0,
    v40 = 0,
    v41 = v34,
    v42 = v35;
  return (
    v37 > v36
      ? ((v41 = (v35 * v36) / v38),
        (v42 = v35 / v38),
        (v39 = (v34 - v41) * clamp01(v31)),
        (v40 = (v35 - v42) * clamp01(v32)))
      : ((v41 = v34 / v38),
        (v42 = v34 / v36 / v38),
        (v39 = (v34 - v41) * clamp01(v31)),
        (v40 = (v35 - v42) * clamp01(v32))),
    v25["drawImage"](v26, v39, v40, v41, v42, v27, v28, v29, v30),
    true
  );
}
function drawRoundedRectPath(v43, v44, v45, v46, v47, v48) {
  const v49 = Math["max"](0, Math["min"](v48, v46 / 2, v47 / 2));
  v43["beginPath"]();
  if (typeof v43["roundRect"] === "function") {
    v43["roundRect"](v44, v45, v46, v47, v49);
    return;
  }
  (v43["moveTo"](v44 + v49, v45),
    v43["lineTo"](v44 + v46 - v49, v45),
    v43["quadraticCurveTo"](v44 + v46, v45, v44 + v46, v45 + v49),
    v43["lineTo"](v44 + v46, v45 + v47 - v49),
    v43["quadraticCurveTo"](v44 + v46, v45 + v47, v44 + v46 - v49, v45 + v47),
    v43["lineTo"](v44 + v49, v45 + v47),
    v43["quadraticCurveTo"](v44, v45 + v47, v44, v45 + v47 - v49),
    v43["lineTo"](v44, v45 + v49),
    v43["quadraticCurveTo"](v44, v45, v44 + v49, v45));
}
function drawRoundedImageCover(v50, v51, v52, v53, v54, v55, v56) {
  v53 > 0 &&
    (v50["save"](),
    drawRoundedRectPath(
      v50,
      v52["x"],
      v52["y"],
      v52["width"],
      v52["height"],
      v53,
    ),
    v50["clip"]());
  const v57 = drawImageCover(
    v50,
    v51,
    v52["x"],
    v52["y"],
    v52["width"],
    v52["height"],
    v54,
    v55,
    v56,
  );
  if (v53 > 0) v50["restore"]();
  return v57;
}
function getDocumentCssVar(v58) {
  try {
    return getComputedStyle(document["documentElement"])
      ["getPropertyValue"](v58)
      ["trim"]();
  } catch {
    return "";
  }
}
function resolveCssColorValue(v59) {
  const v60 = normalizeCollageBackgroundColor(v59);
  if (isCollageBackgroundTransparent(v60)) return "transparent";
  const v61 = v60["match"](/^var\(\s*(--[\w-]+)\s*\)$/);
  if (v61) return getDocumentCssVar(v61[1]);
  return v60;
}
function createBlobObjectUrl(v62) {
  const v63 = globalThis["URL"] || globalThis["window"]?.["URL"];
  if (!v62 || typeof v63?.["createObjectURL"] !== "function") return "";
  try {
    return v63["createObjectURL"](v62);
  } catch (v64) {
    return "";
  }
}
function revokeBlobObjectUrl(v65) {
  if (!v65 || !String(v65)["startsWith"]("blob:")) return;
  const v66 = globalThis["URL"] || globalThis["window"]?.["URL"];
  if (typeof v66?.["revokeObjectURL"] !== "function") return;
  try {
    v66["revokeObjectURL"](v65);
  } catch (v67) {}
}
export class CollageNode {
  constructor(v68) {
    ((this["_data"] = v68 && typeof v68 === "object" ? v68 : {}),
      (this["id"] = this["_data"]["id"]),
      (this["el"] = document["createElement"]("div")),
      (this["el"]["className"] = "v2-node-component collage-node"),
      (this["_isEditing"] = !!this["_data"]["isEditing"]),
      (this["_isCollapsed"] = !!this["_data"]["isCollapsed"]),
      (this["_isExporting"] = false),
      (this["_isCompositing"] = false),
      (this["_openMenuKey"] = ""),
      (this["_menuOutsideListeners"] = []),
      (this["_activeImageDrag"] = null),
      (this["_activeDividerDrag"] = null),
      (this["_itemsCommitTimer"] = null),
      (this["_previewSignature"] = ""),
      (this["_highlightedSlotIndex"] = -1));
  }
  ["mount"]() {
    (this["_removeMenuOutsideListeners"](),
      this["el"]["replaceChildren"](),
      (this["_isEditing"] = !!this["_data"]["isEditing"]),
      (this["_isCollapsed"] = !!this["_data"]["isCollapsed"]),
      this["_syncRootState"](),
      (this["_toolbarEl"] = this["_createToolbar"]()),
      this["el"]["appendChild"](this["_toolbarEl"]));
    const v69 = document["createElement"]("div");
    v69["className"] = "collage-board";
    const v70 = getCollageBackgroundOption(this["_data"]["backgroundColor"]);
    return (
      (v69["dataset"]["collageBackground"] = v70["id"]),
      v69["addEventListener"]("dblclick", (v71) => {
        (v71["preventDefault"](),
          v71["stopPropagation"](),
          this["_toggleEdit"](true));
      }),
      v69["appendChild"](this["_createPreviewLayer"]()),
      this["el"]["appendChild"](v69),
      (this["_boardEl"] = v69),
      (this["_previewSignature"] = this["_getPreviewSignature"]()),
      this["el"]
    );
  }
  ["update"](v72) {
    ((this["_data"] = v72 && typeof v72 === "object" ? v72 : {}),
      (this["_isEditing"] = !!this["_data"]["isEditing"]),
      (this["_isCollapsed"] = !!this["_data"]["isCollapsed"]));
    if (!this["_boardEl"] || !this["_toolbarEl"]) {
      this["mount"]();
      return;
    }
    (this["_syncBoardBackground"](), this["_syncToolbarState"]());
    const v73 = this["_getPreviewSignature"]();
    v73 !== this["_previewSignature"]
      ? this["_syncPreviewLayer"]()
      : this["_syncEditingState"]();
  }
  ["unmount"]() {
    (this["_endImageDrag"]({ shouldCommit: false }),
      this["_endDividerDrag"]({ shouldCommit: false }),
      this["_removeMenuOutsideListeners"](),
      this["_itemsCommitTimer"] &&
        (clearTimeout(this["_itemsCommitTimer"]),
        (this["_itemsCommitTimer"] = null)),
      (this["_openMenuKey"] = ""));
  }
  ["highlightSlot"](v74) {
    const v75 = Number(v74),
      v76 = Number["isInteger"](v75) && v75 >= 0 ? v75 : -1;
    if (this["_highlightedSlotIndex"] === v76) return;
    const v77 = this["_highlightedSlotIndex"];
    this["_highlightedSlotIndex"] = v76;
    v77 >= 0
      ? this["_getTileByIndex"](v77)?.["classList"]["remove"](
          "is-drop-highlight",
        )
      : this["el"]
          ["querySelectorAll"](".collage-item.is-drop-highlight")
          ["forEach"]((v78) => v78["classList"]["remove"]("is-drop-highlight"));
    if (v76 < 0) return;
    this["_getTileByIndex"](v76)?.["classList"]["add"]("is-drop-highlight");
  }
  ["previewItems"](v79) {
    if (!Array["isArray"](v79)) return;
    ((this["_data"] = { ...this["_data"], items: v79 }),
      this["_syncPreviewLayer"]());
  }
  ["_getPreviewSignature"](v80 = this["_data"]) {
    const v81 = getCollageLayoutStyle(v80),
      v82 = (Array["isArray"](v80?.["items"]) ? v80["items"] : [])["map"](
        (v83) => ({
          id: v83?.["id"] || "",
          slotIndex: v83?.["slotIndex"] ?? null,
          x: Number(v83?.["x"]) || 0,
          y: Number(v83?.["y"]) || 0,
          width: Number(v83?.["width"]) || 0,
          height: Number(v83?.["height"]) || 0,
          url: String(v83?.["url"] || ""),
          localPath: String(v83?.["localPath"] || ""),
          thumbLocalPath: String(v83?.["thumbLocalPath"] || ""),
          sourceLocalPath: String(v83?.["sourceLocalPath"] || ""),
          sourceUrl: String(v83?.["sourceUrl"] || ""),
          sourceDisplayWidth: Number(v83?.["sourceDisplayWidth"]) || 0,
          sourceDisplayHeight: Number(v83?.["sourceDisplayHeight"]) || 0,
          label: String(v83?.["label"] || ""),
          fit: String(v83?.["fit"] || ""),
          focusX: clamp01(v83?.["focusX"]),
          focusY: clamp01(v83?.["focusY"]),
          imageScale: normalizeCollageImageScale(v83?.["imageScale"]),
          isEmpty: !!v83?.["isEmpty"],
        }),
      );
    return JSON["stringify"]({
      width: toPositiveNumber(v80?.["width"], 1),
      height: toPositiveNumber(v80?.["height"], 1),
      outerPadding: v81["outerPadding"],
      gap: v81["gap"],
      cornerRadius: v81["cornerRadius"],
      items: v82,
    });
  }
  ["_createToolbar"]() {
    const v84 = document["createElement"]("div");
    return (
      (v84["className"] = "node-floating-toolbar\x20collage-toolbar"),
      v84["appendChild"](this["_createAspectRatioPicker"]()),
      v84["appendChild"](this["_createTemplatePicker"]()),
      v84["appendChild"](this["_createToolbarDivider"]()),
      v84["appendChild"](this["_createEditButton"]()),
      v84["appendChild"](this["_createBackgroundColorPicker"]()),
      v84["appendChild"](
        this["_createRangeControl"]({
          field: "outerPadding",
          label: "外边框",
          icon: ["M4 4h16v16H4z", "M8 8h8v8H8z"],
        }),
      ),
      v84["appendChild"](
        this["_createRangeControl"]({
          field: "gap",
          label: "格子间距",
          icon: ["M4 4h6v16H4z", "M14 4h6v16h-6z"],
        }),
      ),
      v84["appendChild"](
        this["_createRangeControl"]({
          field: "cornerRadius",
          label: "格子圆角",
          icon: [
            "M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z",
          ],
        }),
      ),
      v84["appendChild"](this["_createCompositeButton"]()),
      v84["appendChild"](this["_createExportButton"]()),
      v84["appendChild"](this["_createCollapseButton"]()),
      v84
    );
  }
  ["_createToolbarDivider"]() {
    const v85 = document["createElement"]("span");
    return (
      (v85["className"] = "collage-toolbar-divider"),
      (v85["textContent"] = "|"),
      v85["setAttribute"]("aria-hidden", "true"),
      v85
    );
  }
  ["_createEditButton"]() {
    const v86 = document["createElement"]("button");
    return (
      (v86["type"] = "button"),
      (v86["className"] = "ftb-btn icon-only act-edit collage-edit-btn"),
      v86["classList"]["toggle"]("active", this["_isEditing"]),
      (v86["dataset"]["tooltip"] = this["_isEditing"]
        ? "退出编辑拼图"
        : "编辑拼图"),
      v86["setAttribute"](
        "aria-label",
        this["_isEditing"] ? "退出编辑拼图" : "编辑拼图",
      ),
      v86["appendChild"](
        createSvgIcon([
          "M12 20h9",
          "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z",
        ]),
      ),
      v86["addEventListener"]("pointerdown", (v87) => v87["stopPropagation"]()),
      v86["addEventListener"]("dblclick", (v88) => v88["stopPropagation"]()),
      v86["addEventListener"]("click", (v89) => {
        (v89["stopPropagation"](), this["_toggleEdit"](!this["_isEditing"]));
      }),
      v86
    );
  }
  ["_createAspectRatioPicker"]() {
    const v90 = getCollageAspectRatioOption(this["_data"]["aspectRatio"]),
      v91 = document["createElement"]("div");
    ((v91["className"] = "collage-ratio-wrap"),
      v91["addEventListener"]("pointerdown", (v92) =>
        v92["stopPropagation"](),
      ));
    const v93 = document["createElement"]("button");
    ((v93["type"] = "button"),
      (v93["className"] = "ftb-btn collage-ratio-trigger"),
      (v93["dataset"]["tooltip"] = "拼图比例"),
      v93["setAttribute"]("aria-label", "拼图比例"),
      v93["appendChild"](createSvgIcon(["M4 6h16v12H4z"])));
    const v94 = document["createElement"]("span");
    ((v94["textContent"] = v90?.["label"] || "比例"), v93["appendChild"](v94));
    const v95 = document["createElement"]("div");
    v95["className"] = "collage-menu\x20collage-ratio-menu";
    for (const v96 of COLLAGE_ASPECT_RATIO_OPTIONS) {
      const v97 = document["createElement"]("button");
      ((v97["type"] = "button"),
        (v97["className"] = "collage-ratio-option"),
        (v97["dataset"]["collageRatio"] = v96["label"]),
        v97["classList"]["toggle"](
          "is-active",
          v96["label"] === v90?.["label"],
        ),
        v97["setAttribute"]("aria-label", "拼图比例" + v96["label"]));
      const v98 = document["createElement"]("span");
      ((v98["className"] = "collage-ratio-mark"),
        (v98["dataset"]["collageRatio"] = v96["label"]),
        v97["appendChild"](v98));
      const v99 = document["createElement"]("span");
      ((v99["textContent"] = v96["label"]),
        v97["appendChild"](v99),
        v97["addEventListener"]("click", (v100) => {
          v100["stopPropagation"]();
          const v101 = buildCollageAspectRatioPatch(
            this["_data"],
            v96["value"],
          );
          (appStore["updateNodeData"](this["id"], v101), commit());
        }),
        v95["appendChild"](v97));
    }
    return (
      v93["addEventListener"]("click", (v102) => {
        (v102["stopPropagation"](), this["_toggleMenu"](v95));
      }),
      this["_registerMenu"](v95, v91, "ratio"),
      v91["appendChild"](v93),
      v91["appendChild"](v95),
      v91
    );
  }
  ["_createTemplatePicker"]() {
    const v103 = document["createElement"]("div");
    ((v103["className"] = "collage-grid-wrap"),
      v103["addEventListener"]("pointerdown", (v104) =>
        v104["stopPropagation"](),
      ));
    const v105 = document["createElement"]("button");
    ((v105["type"] = "button"),
      (v105["className"] = "ftb-btn\x20collage-grid-trigger"),
      (v105["dataset"]["tooltip"] = "拼图网格"),
      v105["setAttribute"]("aria-label", "拼图网格"),
      v105["appendChild"](
        createSvgIcon(["M3 3h18v18H3z", "M3 11h18", "M11 3v18"]),
      ));
    const v106 = document["createElement"]("span");
    ((v106["textContent"] = "拼图网格"), v105["appendChild"](v106));
    const v107 = document["createElement"]("div");
    v107["className"] = "collage-menu\x20collage-grid-menu";
    const v108 = document["createElement"]("div");
    v108["className"] = "collage-grid-count-list";
    const v109 = document["createElement"]("div");
    ((v109["className"] = "collage-template-panel"),
      v107["appendChild"](v108),
      v107["appendChild"](v109));
    let v110 =
      getCollageLayoutPreset(this["_data"]["layoutPresetId"])["slotCount"] || 2;
    if (![2, 3, 4]["includes"](v110)) v110 = 2;
    const v111 = (v112) => {
      ((v110 = v112),
        v108["querySelectorAll"](".collage-grid-count-btn")["forEach"]((v113) =>
          v113["classList"]["toggle"](
            "is-active",
            Number(v113["dataset"]["slotCount"]) === v112,
          ),
        ),
        v109["replaceChildren"]());
      const v114 = COLLAGE_TEMPLATE_GROUPS["find"](
        (v115) => v115["slotCount"] === v112,
      );
      for (const v116 of v114?.["presets"] || []) {
        const v117 = document["createElement"]("button");
        ((v117["type"] = "button"),
          (v117["className"] = "collage-template-option"),
          (v117["dataset"]["collagePresetId"] = v116["id"]),
          v117["classList"]["toggle"](
            "is-active",
            v116["id"] === this["_data"]["layoutPresetId"],
          ),
          (v117["title"] = v116["label"]),
          v117["setAttribute"]("aria-label", v116["label"]),
          v117["appendChild"](this["_createTemplatePreview"](v116)),
          v117["addEventListener"]("click", (v118) => {
            v118["stopPropagation"]();
            const v119 = buildCollageLayoutPatch(this["_data"], v116["id"]);
            (appStore["updateNodeData"](this["id"], v119), commit());
          }),
          v109["appendChild"](v117));
      }
    };
    for (const v120 of COLLAGE_TEMPLATE_GROUPS) {
      const v121 = document["createElement"]("button");
      ((v121["type"] = "button"),
        (v121["className"] = "collage-grid-count-btn"),
        (v121["dataset"]["slotCount"] = String(v120["slotCount"])),
        (v121["textContent"] = v120["label"]),
        v121["setAttribute"]("aria-label", v120["label"] + "图模板"),
        v121["addEventListener"]("pointerenter", () => v111(v120["slotCount"])),
        v121["addEventListener"]("focus", () => v111(v120["slotCount"])),
        v121["addEventListener"]("click", (v122) => {
          (v122["stopPropagation"](), v111(v120["slotCount"]));
        }),
        v108["appendChild"](v121));
    }
    return (
      v111(v110),
      v105["addEventListener"]("click", (v123) => {
        (v123["stopPropagation"](), this["_toggleMenu"](v107));
      }),
      this["_registerMenu"](v107, v103, "grid"),
      v103["appendChild"](v105),
      v103["appendChild"](v107),
      v103
    );
  }
  ["_createTemplatePreview"](v124) {
    const v125 = document["createElement"]("span");
    v125["className"] = "collage-template-preview";
    for (const v126 of v124["slots"] || []) {
      const v127 = document["createElement"]("span");
      ((v127["className"] = "collage-template-preview-slot"),
        (v127["style"]["left"] = (v126["x"] / v124["width"]) * 100 + "%"),
        (v127["style"]["top"] = (v126["y"] / v124["height"]) * 100 + "%"),
        (v127["style"]["width"] = (v126["width"] / v124["width"]) * 100 + "%"),
        (v127["style"]["height"] =
          (v126["height"] / v124["height"]) * 100 + "%"),
        v125["appendChild"](v127));
    }
    return v125;
  }
  ["_createBackgroundColorPicker"]() {
    const v128 = getCollageBackgroundOption(this["_data"]["backgroundColor"]),
      v129 = document["createElement"]("div");
    ((v129["className"] = "collage-bg-wrap"),
      v129["addEventListener"]("pointerdown", (v130) =>
        v130["stopPropagation"](),
      ));
    const v131 = document["createElement"]("button");
    ((v131["type"] = "button"),
      (v131["className"] = "ftb-btn\x20icon-only\x20collage-bg-btn"),
      (v131["dataset"]["tooltip"] = "背景颜色"),
      v131["setAttribute"]("aria-label", "背景颜色"));
    const v132 = document["createElement"]("span");
    ((v132["className"] = "collage-bg-dot"),
      (v132["dataset"]["collageBackground"] = v128["id"]),
      v131["appendChild"](v132));
    const v133 = document["createElement"]("div");
    ((v133["className"] = "collage-menu collage-bg-menu"),
      v131["addEventListener"]("click", (v134) => {
        (v134["stopPropagation"](), this["_toggleMenu"](v133));
      }));
    for (const v135 of COLLAGE_BACKGROUND_OPTIONS) {
      const v136 = document["createElement"]("button");
      ((v136["type"] = "button"),
        (v136["className"] = "collage-bg-option"),
        (v136["dataset"]["collageBackground"] = v135["id"]),
        (v136["dataset"]["collageBackgroundValue"] = v135["value"]),
        v136["classList"]["toggle"]("is-active", v135["id"] === v128["id"]),
        (v136["title"] = v135["label"]),
        v136["setAttribute"]("aria-label", "背景" + v135["label"]),
        v136["addEventListener"]("click", (v137) => {
          (v137["stopPropagation"](),
            this["_setBackgroundColor"](v135["value"]));
        }),
        v133["appendChild"](v136));
    }
    return (
      this["_registerMenu"](v133, v129, "background"),
      v129["appendChild"](v131),
      v129["appendChild"](v133),
      v129
    );
  }
  ["_createRangeControl"]({ field: v138, label: v139, icon: v140 }) {
    const v141 = getCollageLayoutStyle(this["_data"]),
      v142 = document["createElement"]("div");
    ((v142["className"] = "collage-range-wrap"),
      (v142["dataset"]["collageRangeField"] = v138),
      v142["addEventListener"]("pointerdown", (v143) =>
        v143["stopPropagation"](),
      ));
    const v144 = document["createElement"]("button");
    ((v144["type"] = "button"),
      (v144["className"] = "ftb-btn icon-only collage-range-btn"),
      (v144["dataset"]["tooltip"] = v139),
      v144["setAttribute"]("aria-label", v139),
      v144["appendChild"](createSvgIcon(v140)));
    const v145 = document["createElement"]("div");
    v145["className"] = "collage-menu collage-range-menu";
    const v146 = document["createElement"]("span");
    ((v146["className"] = "collage-range-value"),
      (v146["textContent"] = String(v141[v138])));
    const v147 = document["createElement"]("input");
    return (
      (v147["type"] = "range"),
      (v147["min"] = "0"),
      (v147["max"] = "100"),
      (v147["step"] = "1"),
      (v147["value"] = String(v141[v138])),
      v147["setAttribute"]("aria-label", v139),
      v147["addEventListener"]("input", () => {
        const v148 = normalizeCollageStyleValue(v147["value"], v141[v138]);
        ((v146["textContent"] = String(v148)),
          (this["_data"] = { ...this["_data"], [v138]: v148 }),
          this["_syncPreviewLayoutStyle"]({ updateSignature: false }));
      }),
      v147["addEventListener"]("change", () => {
        const v149 = normalizeCollageStyleValue(v147["value"], v141[v138]);
        ((this["_data"] = { ...this["_data"], [v138]: v149 }),
          this["_syncPreviewLayoutStyle"](),
          appStore["updateNodeData"](this["id"], { [v138]: v149 }),
          commit());
      }),
      v145["appendChild"](v146),
      v145["appendChild"](v147),
      v144["addEventListener"]("click", (v150) => {
        (v150["stopPropagation"](), this["_toggleMenu"](v145));
      }),
      this["_registerMenu"](v145, v142, "range:" + v138),
      v142["appendChild"](v144),
      v142["appendChild"](v145),
      v142
    );
  }
  ["_createCompositeButton"]() {
    const v151 = document["createElement"]("div");
    ((v151["className"] = "collage-compose-wrap"),
      v151["addEventListener"]("pointerdown", (v152) =>
        v152["stopPropagation"](),
      ));
    const v153 = document["createElement"]("button");
    ((v153["type"] = "button"),
      (v153["className"] =
        "ftb-btn icon-only act-compose collage-compose-btn"));
    const v154 = this["_isExporting"] || this["_isCompositing"];
    ((v153["dataset"]["tooltip"] = this["_isCompositing"] ? "合成中" : "合成"),
      v153["setAttribute"](
        "aria-label",
        this["_isCompositing"] ? "合成中" : "合成",
      ),
      (v153["disabled"] = v154),
      v153["appendChild"](createSvgIcon(["M12 3v18", "M21 12H3"])));
    const v155 = document["createElement"]("div");
    v155["className"] = "collage-menu\x20collage-export-menu";
    for (const v156 of COLLAGE_EXPORT_RESOLUTIONS) {
      const v157 = document["createElement"]("button");
      ((v157["type"] = "button"),
        (v157["className"] = "collage-export-option"),
        (v157["textContent"] = v156["label"]),
        v157["setAttribute"]("aria-label", "合成" + v156["label"]),
        v157["addEventListener"]("click", (v158) => {
          (v158["stopPropagation"](),
            this["_composeCollage"](v156["longSide"], v153));
        }),
        v155["appendChild"](v157));
    }
    return (
      v153["addEventListener"]("click", (v159) => {
        (v159["stopPropagation"](), this["_toggleMenu"](v155));
      }),
      this["_registerMenu"](v155, v151, "compose"),
      v151["appendChild"](v153),
      v151["appendChild"](v155),
      v151
    );
  }
  ["_createExportButton"]() {
    const v160 = document["createElement"]("div");
    ((v160["className"] = "collage-export-wrap"),
      v160["addEventListener"]("pointerdown", (v161) =>
        v161["stopPropagation"](),
      ));
    const v162 = document["createElement"]("button");
    ((v162["type"] = "button"),
      (v162["className"] = "ftb-btn icon-only collage-export-btn"),
      (v162["dataset"]["tooltip"] = this["_isExporting"] ? "导出中" : "导出"),
      v162["setAttribute"](
        "aria-label",
        this["_isExporting"] ? "导出中" : "导出",
      ),
      (v162["disabled"] = this["_isExporting"] || this["_isCompositing"]),
      v162["appendChild"](
        createSvgIcon([
          "M21\x2015v4a2\x202\x200\x200\x201-2\x202H5a2\x202\x200\x200\x201-2-2v-4",
          "M7 10l5 5 5-5",
          "M12 15V3",
        ]),
      ));
    const v163 = document["createElement"]("div");
    v163["className"] = "collage-menu collage-export-menu";
    for (const v164 of COLLAGE_EXPORT_RESOLUTIONS) {
      const v165 = document["createElement"]("button");
      ((v165["type"] = "button"),
        (v165["className"] = "collage-export-option"),
        (v165["textContent"] = v164["label"]),
        v165["setAttribute"]("aria-label", "导出" + v164["label"]),
        v165["addEventListener"]("click", (v166) => {
          (v166["stopPropagation"](), this["_exportCollage"](v164["longSide"]));
        }),
        v163["appendChild"](v165));
    }
    return (
      v162["addEventListener"]("click", (v167) => {
        (v167["stopPropagation"](), this["_toggleMenu"](v163));
      }),
      this["_registerMenu"](v163, v160, "export"),
      v160["appendChild"](v162),
      v160["appendChild"](v163),
      v160
    );
  }
  ["_getCollapseIconPath"]() {
    return this["_isCollapsed"] ? "M6 9l6 6 6-6" : "M18 15l-6-6-6 6";
  }
  ["_createCollapseButton"]() {
    const v168 = document["createElement"]("button");
    return (
      (v168["type"] = "button"),
      (v168["className"] = "ftb-btn icon-only collage-collapse-btn"),
      (v168["dataset"]["tooltip"] = this["_isCollapsed"] ? "展开" : "折叠"),
      v168["setAttribute"](
        "aria-label",
        this["_isCollapsed"] ? "展开" : "折叠",
      ),
      v168["appendChild"](createSvgIcon([this["_getCollapseIconPath"]()])),
      v168["addEventListener"]("pointerdown", (v169) =>
        v169["stopPropagation"](),
      ),
      v168["addEventListener"]("dblclick", (v170) => v170["stopPropagation"]()),
      v168["addEventListener"]("click", (v171) => {
        (v171["stopPropagation"](),
          v171["currentTarget"]?.["blur"]?.(),
          this["_toggleCollapse"](!this["_isCollapsed"]));
      }),
      v168
    );
  }
  ["_registerMenu"](v172, v173, v174) {
    v172["dataset"]["collageMenuKey"] = v174;
    if (this["_openMenuKey"] === v174) v172["classList"]["add"]("show");
    this["_addOutsideMenuListener"](v172, v173);
  }
  ["_addOutsideMenuListener"](v175, v176) {
    const v177 = (v178) => {
      if (v175["contains"](v178["target"]) || v176["contains"](v178["target"]))
        return;
      if (!v175["classList"]["contains"]("show")) return;
      (v175["classList"]["remove"]("show"),
        this["_openMenuKey"] === v175["dataset"]["collageMenuKey"] &&
          (this["_openMenuKey"] = ""));
    };
    (window["addEventListener"]("pointerdown", v177),
      this["_menuOutsideListeners"]["push"](v177));
  }
  ["_removeMenuOutsideListeners"]() {
    for (const v179 of this["_menuOutsideListeners"]) {
      window["removeEventListener"]("pointerdown", v179);
    }
    this["_menuOutsideListeners"] = [];
  }
  ["_closeMenus"]({ clearKey: clearKey = true } = {}) {
    this["el"]
      ["querySelectorAll"](".collage-menu.show")
      ["forEach"]((v180) => v180["classList"]["remove"]("show"));
    if (clearKey) this["_openMenuKey"] = "";
  }
  ["_toggleMenu"](v181) {
    const v182 = v181["classList"]["contains"]("show");
    this["_closeMenus"]({ clearKey: false });
    if (v182) {
      this["_openMenuKey"] = "";
      return;
    }
    ((this["_openMenuKey"] = v181["dataset"]["collageMenuKey"] || ""),
      v181["classList"]["add"]("show"));
  }
  ["_syncBoardBackground"]() {
    const v183 = getCollageBackgroundOption(this["_data"]["backgroundColor"]);
    this["_boardEl"] &&
      (this["_boardEl"]["dataset"]["collageBackground"] = v183["id"]);
  }
  ["_syncRootState"]() {
    (this["el"]["classList"]["toggle"]("is-editing-mode", this["_isEditing"]),
      this["el"]["classList"]["toggle"]("is-collapsed", this["_isCollapsed"]));
  }
  ["_syncToolbarState"]() {
    const v184 =
      this["_toolbarEl"] || this["el"]["querySelector"](".collage-toolbar");
    if (!v184) return;
    const v185 = v184["querySelector"](".collage-edit-btn");
    v185 &&
      (v185["classList"]["toggle"]("active", this["_isEditing"]),
      (v185["dataset"]["tooltip"] = this["_isEditing"]
        ? "退出编辑拼图"
        : "编辑拼图"),
      v185["setAttribute"](
        "aria-label",
        this["_isEditing"] ? "退出编辑拼图" : "编辑拼图",
      ));
    const v186 = getCollageAspectRatioOption(this["_data"]["aspectRatio"]),
      v187 = v184["querySelector"](".collage-ratio-trigger span");
    if (v187) v187["textContent"] = v186?.["label"] || "比例";
    (v184["querySelectorAll"](".collage-ratio-option")["forEach"]((v188) => {
      v188["classList"]["toggle"](
        "is-active",
        v188["dataset"]["collageRatio"] === v186?.["label"],
      );
    }),
      v184["querySelectorAll"](".collage-template-option")["forEach"](
        (v189) => {
          v189["classList"]["toggle"](
            "is-active",
            v189["dataset"]["collagePresetId"] ===
              this["_data"]["layoutPresetId"],
          );
        },
      ));
    const v190 = getCollageBackgroundOption(this["_data"]["backgroundColor"]),
      v191 = v184["querySelector"](".collage-bg-dot");
    if (v191) v191["dataset"]["collageBackground"] = v190["id"];
    v184["querySelectorAll"](".collage-bg-option")["forEach"]((v192) => {
      v192["classList"]["toggle"](
        "is-active",
        v192["dataset"]["collageBackground"] === v190["id"],
      );
    });
    const v193 = getCollageLayoutStyle(this["_data"]);
    v184["querySelectorAll"](".collage-range-wrap")["forEach"]((v194) => {
      const v195 = v194["dataset"]["collageRangeField"];
      if (!v195 || !(v195 in v193)) return;
      const v196 = v193[v195],
        v197 = v194["querySelector"](".collage-range-value"),
        v198 = v194["querySelector"]('input[type="range"]');
      if (v197) v197["textContent"] = String(v196);
      if (v198 && v198["value"] !== String(v196)) v198["value"] = String(v196);
    });
    const v199 = v184["querySelector"](".collage-compose-btn");
    v199 &&
      ((v199["disabled"] = this["_isExporting"] || this["_isCompositing"]),
      (v199["dataset"]["tooltip"] = this["_isCompositing"] ? "合成中" : "合成"),
      v199["setAttribute"](
        "aria-label",
        this["_isCompositing"] ? "合成中" : "合成",
      ));
    const v200 = v184["querySelector"](".collage-export-btn");
    v200 &&
      ((v200["disabled"] = this["_isExporting"] || this["_isCompositing"]),
      (v200["dataset"]["tooltip"] = this["_isExporting"] ? "导出中" : "导出"),
      v200["setAttribute"](
        "aria-label",
        this["_isExporting"] ? "导出中" : "导出",
      ));
    const v201 = v184["querySelector"](".collage-collapse-btn");
    if (v201) {
      ((v201["dataset"]["tooltip"] = this["_isCollapsed"] ? "展开" : "折叠"),
        v201["setAttribute"](
          "aria-label",
          this["_isCollapsed"] ? "展开" : "折叠",
        ));
      const v202 = v201["querySelector"]("svg path");
      v202?.["setAttribute"]("d", this["_getCollapseIconPath"]());
    }
  }
  ["_syncDividerLayer"]() {
    const v203 = this["_boardEl"]?.["querySelector"]?.(
      ".collage-preview-layer",
    );
    if (!v203) return;
    v203["querySelectorAll"](".collage-divider-layer")["forEach"]((v204) =>
      v204["remove"](),
    );
    if (!this["_isEditing"]) return;
    v203["appendChild"](
      this["_createDividerLayer"](
        toPositiveNumber(this["_data"]["width"], 1),
        toPositiveNumber(this["_data"]["height"], 1),
      ),
    );
  }
  ["_syncDividerGeometry"]() {
    const v205 = this["_boardEl"]?.["querySelector"]?.(
      ".collage-preview-layer",
    );
    if (!v205) return;
    if (!this["_isEditing"]) {
      v205["querySelectorAll"](".collage-divider-layer")["forEach"]((v206) =>
        v206["remove"](),
      );
      return;
    }
    const v207 = v205["querySelector"](".collage-divider-layer");
    if (!v207) {
      this["_syncDividerLayer"]();
      return;
    }
    const v208 = resolveCollageEditableDividers(this["_data"]),
      v209 = Array["from"](v207["querySelectorAll"](".collage-divider-handle"));
    if (v208["length"] !== v209["length"]) {
      this["_syncDividerLayer"]();
      return;
    }
    const v210 = toPositiveNumber(this["_data"]["width"], 1),
      v211 = toPositiveNumber(this["_data"]["height"], 1);
    v208["forEach"]((v212, v213) => {
      this["_applyDividerHandleGeometry"](v209[v213], v212, v210, v211);
    });
  }
  ["_syncEditingState"]() {
    (this["_syncRootState"](),
      this["el"]
        ["querySelectorAll"](".collage-item")
        [
          "forEach"
        ]((v214) => v214["classList"]["toggle"]("is-editable", this["_isEditing"])),
      this["_syncDividerLayer"](),
      this["_syncToolbarState"]());
  }
  ["_setComposeButtonBusy"](v215) {
    if (!v215) return null;
    const v216 = Array["from"](v215["childNodes"])["map"]((v217) =>
        v217["cloneNode"](true),
      ),
      v218 = v215["dataset"]["tooltip"],
      v219 = v215["getAttribute"]("aria-label");
    (v215["replaceChildren"](),
      (v215["dataset"]["tooltip"] = "合成中..."),
      v215["setAttribute"]("aria-label", "合成中"),
      (v215["disabled"] = true));
    const v220 = createSvgIcon(["M21 12a9 9 0 1 1-6.219-8.56"]);
    return (
      v220["classList"]["add"]("v2-spinning"),
      v220["setAttribute"]("width", "14"),
      v220["setAttribute"]("height", "14"),
      v215["appendChild"](v220),
      () => {
        (v215["replaceChildren"](
          ...v216["map"]((v221) => v221["cloneNode"](true)),
        ),
          (v215["dataset"]["tooltip"] = v218 || "合成"),
          v215["setAttribute"]("aria-label", v219 || "合成"),
          (v215["disabled"] = false));
      }
    );
  }
  ["_toggleEdit"](v222) {
    const v223 = !!v222;
    if (v223 && this["_isCollapsed"]) {
      this["_toggleCollapse"](false);
      return;
    }
    ((this["_isEditing"] = v223),
      (this["_data"] = { ...this["_data"], isEditing: v223 }),
      this["_syncEditingState"](),
      appStore["updateNodeData"](this["id"], { isEditing: v223 }));
  }
  ["_toggleCollapse"](v224) {
    const v225 = buildCollageCollapsePatch(this["_data"], v224);
    ((this["_data"] = { ...this["_data"], ...v225 }),
      (this["_isCollapsed"] = !!v225["isCollapsed"]),
      (this["_isEditing"] = !!this["_data"]["isEditing"]),
      this["_syncRootState"](),
      this["_syncToolbarState"](),
      appStore["updateNodeData"](this["id"], v225));
  }
  ["_setBackgroundColor"](v226) {
    const v227 = normalizeCollageBackgroundColor(v226);
    ((this["_data"] = { ...this["_data"], backgroundColor: v227 }),
      this["_syncBoardBackground"](),
      this["_syncToolbarState"](),
      appStore["updateNodeData"](this["id"], { backgroundColor: v227 }),
      commit());
  }
  ["_refreshPreviewLayer"]() {
    if (!this["_boardEl"]) return;
    ((this["_highlightedSlotIndex"] = -1),
      this["_boardEl"]
        ["querySelectorAll"](".collage-preview-layer")
        ["forEach"]((v228) => v228["remove"]()),
      this["_boardEl"]["appendChild"](this["_createPreviewLayer"]()),
      (this["_previewSignature"] = this["_getPreviewSignature"]()),
      this["_syncEditingState"]());
  }
  ["_applyTileFrame"](v229, v230, v231, v232, v233) {
    if (!v229 || !v230) return;
    ((v229["style"]["left"] = (v230["x"] / v231) * 100 + "%"),
      (v229["style"]["top"] = (v230["y"] / v232) * 100 + "%"),
      (v229["style"]["width"] = (v230["width"] / v231) * 100 + "%"),
      (v229["style"]["height"] = (v230["height"] / v232) * 100 + "%"),
      (v229["style"]["borderRadius"] = v233 + "px"));
  }
  ["_syncTileContent"](v234, v235, v236, v237, v238) {
    if (!v234) return;
    ((v234["dataset"]["collageSlotIndex"] = String(v236)),
      v234["classList"]["toggle"]("is-empty", v237),
      v234["classList"]["toggle"]("is-editable", this["_isEditing"]));
    const v239 = resolveCollageItemPreviewUrl(v235);
    if (v239 && !v237) {
      let v240 = v234["querySelector"](".collage-item-img");
      !v240
        ? (v234["replaceChildren"](),
          (v240 = document["createElement"]("img")),
          (v240["className"] = "collage-item-img"),
          (v240["decoding"] = "async"),
          (v240["loading"] = "eager"),
          v234["appendChild"](v240))
        : v234["querySelectorAll"](".collage-slot-empty")["forEach"]((v241) =>
            v241["remove"](),
          );
      v240["alt"] = v235["label"] || "拼图图片";
      v240["dataset"]["collagePreviewUrl"] !== v239 &&
        ((v240["dataset"]["collagePreviewUrl"] = v239), (v240["src"] = v239));
      (this["_applyImagePlacement"](v240, v235),
        (v240["style"]["borderRadius"] = v238 + "px"));
      return;
    }
    const v242 = !!v234["querySelector"](".collage-slot-empty");
    if (!v242 || v234["querySelector"](".collage-item-img")) {
      const v243 = document["createElement"]("div");
      ((v243["className"] = "collage-slot-empty"),
        v234["replaceChildren"](v243));
    }
  }
  ["_createPreviewTile"]({
    item: v244,
    index: v245,
    frame: v246,
    isEmpty: v247,
    nodeWidth: v248,
    nodeHeight: v249,
    cornerRadius: v250,
  }) {
    const v251 = document["createElement"]("div");
    return (
      (v251["className"] = "collage-item"),
      this["_applyTileFrame"](v251, v246, v248, v249, v250),
      v251["addEventListener"]("pointerdown", (v252) =>
        this["_beginImageDrag"](v252, v245),
      ),
      v251["addEventListener"](
        "wheel",
        (v253) => this["_handleItemWheel"](v253, v245),
        { passive: false },
      ),
      this["_syncTileContent"](v251, v244, v245, v247, v250),
      v251
    );
  }
  ["_syncPreviewLayer"]({ updateSignature: updateSignature = true } = {}) {
    const v254 = this["_boardEl"]?.["querySelector"]?.(
      ".collage-preview-layer",
    );
    if (!v254) {
      this["_refreshPreviewLayer"]();
      return;
    }
    const v255 = resolveCollageItemFrames(this["_data"]);
    if (v255["length"] === 0) {
      this["_refreshPreviewLayer"]();
      return;
    }
    const v256 = toPositiveNumber(this["_data"]["width"], 1),
      v257 = toPositiveNumber(this["_data"]["height"], 1),
      { cornerRadius: v258 } = getCollageLayoutStyle(this["_data"]),
      v259 = new Map(
        Array["from"](v254["querySelectorAll"](".collage-item"))["map"](
          (v260) => [Number(v260["dataset"]["collageSlotIndex"]), v260],
        ),
      ),
      v261 = new Set();
    v254["querySelectorAll"](
      ".collage-empty, .collage-divider-layer, .collage-collapsed-badge",
    )["forEach"]((v262) => v262["remove"]());
    for (const {
      item: v263,
      index: v264,
      frame: v265,
      isEmpty: v266,
    } of v255) {
      v261["add"](v264);
      let v267 = v259["get"](v264);
      (!v267
        ? (v267 = this["_createPreviewTile"]({
            item: v263,
            index: v264,
            frame: v265,
            isEmpty: v266,
            nodeWidth: v256,
            nodeHeight: v257,
            cornerRadius: v258,
          }))
        : (this["_applyTileFrame"](v267, v265, v256, v257, v258),
          this["_syncTileContent"](v267, v263, v264, v266, v258)),
        v254["appendChild"](v267));
    }
    for (const [v268, v269] of v259) {
      if (!v261["has"](v268)) v269["remove"]();
    }
    this["_isEditing"] &&
      v254["appendChild"](this["_createDividerLayer"](v256, v257));
    this["_appendCollapsedBadge"](v254);
    this["_highlightedSlotIndex"] >= 0 &&
      this["_getTileByIndex"](this["_highlightedSlotIndex"])?.["classList"][
        "add"
      ]("is-drop-highlight");
    if (updateSignature)
      this["_previewSignature"] = this["_getPreviewSignature"]();
    (this["_syncRootState"](), this["_syncToolbarState"]());
  }
  ["_syncPreviewLayoutStyle"]({
    updateSignature: updateSignature = true,
  } = {}) {
    const v270 = this["_boardEl"]?.["querySelector"]?.(
      ".collage-preview-layer",
    );
    if (!v270) {
      this["_refreshPreviewLayer"]();
      return;
    }
    const v271 = resolveCollageItemFrames(this["_data"]),
      v272 = Array["from"](v270["querySelectorAll"](".collage-item"));
    if (v271["length"] !== v272["length"]) {
      this["_refreshPreviewLayer"]();
      return;
    }
    const v273 = toPositiveNumber(this["_data"]["width"], 1),
      v274 = toPositiveNumber(this["_data"]["height"], 1),
      { cornerRadius: v275 } = getCollageLayoutStyle(this["_data"]),
      v276 = new Map(
        v271["map"]((v277) => [Number(v277["index"]), v277["frame"]]),
      );
    for (const v278 of v272) {
      const v279 = Number(v278["dataset"]["collageSlotIndex"]),
        v280 = v276["get"](v279);
      if (!v280) {
        this["_refreshPreviewLayer"]();
        return;
      }
      this["_applyTileFrame"](v278, v280, v273, v274, v275);
      const v281 = v278["querySelector"](".collage-item-img");
      if (v281) v281["style"]["borderRadius"] = v275 + "px";
    }
    this["_syncDividerGeometry"]();
    if (updateSignature)
      this["_previewSignature"] = this["_getPreviewSignature"]();
  }
  ["_createPreviewLayer"]() {
    const v282 = document["createElement"]("div");
    v282["className"] = "collage-preview-layer";
    const v283 = resolveCollageItemFrames(this["_data"]);
    if (v283["length"] === 0) {
      const v284 = document["createElement"]("div");
      return (
        (v284["className"] = "collage-empty"),
        (v284["textContent"] = "空拼图"),
        v282["appendChild"](v284),
        this["_appendCollapsedBadge"](v282),
        v282
      );
    }
    const v285 = toPositiveNumber(this["_data"]["width"], 1),
      v286 = toPositiveNumber(this["_data"]["height"], 1),
      { cornerRadius: v287 } = getCollageLayoutStyle(this["_data"]);
    for (const {
      item: v288,
      index: v289,
      frame: v290,
      isEmpty: v291,
    } of v283) {
      const v292 = this["_createPreviewTile"]({
        item: v288,
        index: v289,
        frame: v290,
        isEmpty: v291,
        nodeWidth: v285,
        nodeHeight: v286,
        cornerRadius: v287,
      });
      v282["appendChild"](v292);
    }
    return (
      this["_isEditing"] &&
        v282["appendChild"](this["_createDividerLayer"](v285, v286)),
      this["_appendCollapsedBadge"](v282),
      v282
    );
  }
  ["_appendCollapsedBadge"](v293) {
    if (!this["_isCollapsed"] || !v293) return;
    v293["appendChild"](this["_createCollapsedBadge"]());
  }
  ["_createCollapsedBadge"]() {
    const v294 = document["createElement"]("button");
    ((v294["type"] = "button"),
      (v294["className"] = "collage-collapsed-badge"),
      (v294["dataset"]["tooltip"] = "展开"),
      v294["setAttribute"]("aria-label", "展开拼图"),
      v294["appendChild"](
        createSvgIcon([
          "M3\x203h7v7H3z",
          "M14 3h7v7h-7z",
          "M14 14h7v7h-7z",
          "M3 14h7v7H3z",
        ]),
      ));
    const v295 = document["createElement"]("span"),
      v296 = Array["isArray"](this["_data"]["items"])
        ? this["_data"]["items"]["length"]
        : 0;
    return (
      (v295["textContent"] = String(v296)),
      v294["appendChild"](v295),
      v294["addEventListener"]("pointerdown", (v297) =>
        v297["stopPropagation"](),
      ),
      v294["addEventListener"]("dblclick", (v298) => v298["stopPropagation"]()),
      v294["addEventListener"]("click", (v299) => {
        (v299["stopPropagation"](), this["_toggleCollapse"](false));
      }),
      v294
    );
  }
  ["_applyImagePlacement"](v300, v301) {
    if (!v300) return;
    const v302 = clamp01(v301?.["focusX"]),
      v303 = clamp01(v301?.["focusY"]),
      v304 = normalizeCollageImageScale(v301?.["imageScale"]);
    ((v300["style"]["objectPosition"] =
      v302 * 100 + "%\x20" + v303 * 100 + "%"),
      (v300["style"]["transform"] = "scale(" + v304 + ")"),
      (v300["style"]["transformOrigin"] =
        v302 * 100 + "%\x20" + v303 * 100 + "%"));
  }
  ["_createDividerLayer"](v305, v306) {
    const v307 = document["createElement"]("div");
    v307["className"] = "collage-divider-layer";
    for (const v308 of resolveCollageEditableDividers(this["_data"])) {
      const v309 = document["createElement"]("button");
      ((v309["type"] = "button"),
        (v309["className"] =
          "collage-divider-handle " +
          (v308["axis"] === "x" ? "is-vertical" : "is-horizontal")),
        v309["setAttribute"]("aria-label", "调整拼图间距"),
        v309["addEventListener"]("pointerdown", (v310) =>
          this["_beginDividerDrag"](v310, v308),
        ),
        this["_applyDividerHandleGeometry"](v309, v308, v305, v306),
        v307["appendChild"](v309));
    }
    return v307;
  }
  ["_applyDividerHandleGeometry"](
    v311,
    v312,
    v313 = toPositiveNumber(this["_data"]["width"], 1),
    v314 = toPositiveNumber(this["_data"]["height"], 1),
  ) {
    if (!v311 || !v312) return;
    const { outerPadding: v315 } = getCollageLayoutStyle(this["_data"]),
      v316 = Math["min"](
        v315,
        Math["max"](0, v313 * 0.45),
        Math["max"](0, v314 * 0.45),
      ),
      v317 = Math["max"](1, v313 - v316 * 2),
      v318 = Math["max"](1, v314 - v316 * 2),
      v319 = v317 / v313,
      v320 = v318 / v314;
    if (v312["axis"] === "x") {
      const v321 = v316 + (Number(v312["position"]) || 0) * v319,
        v322 = v316 + (Number(v312["spanStart"]) || 0) * v320,
        v323 = v316 + (Number(v312["spanEnd"]) || 0) * v320;
      ((v311["style"]["left"] =
        "calc(" +
        (v321 / v313) * 100 +
        "% - var(--collage-divider-hit-offset))"),
        (v311["style"]["top"] = (v322 / v314) * 100 + "%"),
        (v311["style"]["width"] = "var(--collage-divider-hit-size)"),
        (v311["style"]["height"] =
          (Math["max"](1, v323 - v322) / v314) * 100 + "%"));
    } else {
      const v324 = v316 + (Number(v312["position"]) || 0) * v320,
        v325 = v316 + (Number(v312["spanStart"]) || 0) * v319,
        v326 = v316 + (Number(v312["spanEnd"]) || 0) * v319;
      ((v311["style"]["left"] = (v325 / v313) * 100 + "%"),
        (v311["style"]["top"] =
          "calc(" +
          (v324 / v314) * 100 +
          "% - var(--collage-divider-hit-offset))"),
        (v311["style"]["width"] =
          (Math["max"](1, v326 - v325) / v313) * 100 + "%"),
        (v311["style"]["height"] = "var(--collage-divider-hit-size)"));
    }
  }
  ["_getItemsCopy"]() {
    return (
      Array["isArray"](this["_data"]["items"]) ? this["_data"]["items"] : []
    )["map"]((v327) => ({ ...v327 }));
  }
  ["_setItemAt"](v328, v329) {
    const v330 = this["_getItemsCopy"]();
    if (v328 < 0 || v328 >= v330["length"]) return null;
    return (
      (v330[v328] = v329),
      (this["_data"] = { ...this["_data"], items: v330 }),
      v330
    );
  }
  ["_commitItems"]({ commitHistory: commitHistory = true } = {}) {
    this["_itemsCommitTimer"] &&
      (clearTimeout(this["_itemsCommitTimer"]),
      (this["_itemsCommitTimer"] = null));
    const v331 = this["_getItemsCopy"]();
    ((this["_previewSignature"] = this["_getPreviewSignature"]()),
      appStore["updateNodeData"](this["id"], { items: v331 }));
    if (commitHistory) commit();
  }
  ["_scheduleItemsCommit"]() {
    if (this["_itemsCommitTimer"]) clearTimeout(this["_itemsCommitTimer"]);
    this["_itemsCommitTimer"] = setTimeout(() => {
      ((this["_itemsCommitTimer"] = null), this["_commitItems"]());
    }, 160);
  }
  ["_getTileByIndex"](v332) {
    return this["el"]["querySelector"](
      ".collage-item[data-collage-slot-index=\x22" + v332 + "\x22]",
    );
  }
  ["_applyTileGeometry"](v333, v334 = null) {
    const v335 = this["_getTileByIndex"](v333);
    if (!v335) return;
    const v336 = Array["isArray"](v334)
        ? v334
        : resolveCollageItemFrames(this["_data"]),
      v337 = v336["find"]((v338) => v338["index"] === v333);
    if (!v337) return;
    const v339 = toPositiveNumber(this["_data"]["width"], 1),
      v340 = toPositiveNumber(this["_data"]["height"], 1),
      { frame: v341 } = v337;
    ((v335["style"]["left"] = (v341["x"] / v339) * 100 + "%"),
      (v335["style"]["top"] = (v341["y"] / v340) * 100 + "%"),
      (v335["style"]["width"] = (v341["width"] / v339) * 100 + "%"),
      (v335["style"]["height"] = (v341["height"] / v340) * 100 + "%"));
  }
  ["_applyTileImagePlacement"](v342) {
    const v343 = this["_getTileByIndex"](v342),
      v344 = v343?.["querySelector"]?.(".collage-item-img"),
      v345 = (this["_data"]["items"] || [])[v342];
    this["_applyImagePlacement"](v344, v345);
  }
  ["_collectSlotHitRects"]({ excludeIndex: excludeIndex = -1 } = {}) {
    const v346 = Array["from"](this["el"]["querySelectorAll"](".collage-item"));
    return v346["map"]((v347) => {
      const v348 = Number(v347["dataset"]["collageSlotIndex"]);
      if (!Number["isInteger"](v348) || v348 === excludeIndex) return null;
      const v349 = v347["getBoundingClientRect"]?.();
      if (!v349) return null;
      return {
        slotIndex: v348,
        left: v349["left"],
        top: v349["top"],
        right: v349["right"],
        bottom: v349["bottom"],
      };
    })["filter"](Boolean);
  }
  ["_getSlotIndexAtClientPoint"](
    v350,
    v351,
    { excludeIndex: excludeIndex = -1, slotHitRects: slotHitRects = null } = {},
  ) {
    if (!Number["isFinite"](v350) || !Number["isFinite"](v351)) return -1;
    const v352 = Array["isArray"](slotHitRects)
      ? slotHitRects
      : this["_collectSlotHitRects"]({ excludeIndex: excludeIndex });
    for (let v353 = v352["length"] - 1; v353 >= 0; v353 -= 1) {
      const v354 = v352[v353];
      if (!v354 || v354["slotIndex"] === excludeIndex) continue;
      if (
        v350 >= v354["left"] &&
        v350 <= v354["right"] &&
        v351 >= v354["top"] &&
        v351 <= v354["bottom"]
      )
        return v354["slotIndex"];
    }
    return -1;
  }
  ["_swapImageItemIntoSlot"](v355, v356) {
    const v357 = buildCollageItemSwapPatch(this["_data"], v355, v356);
    if (!v357) return false;
    return (
      (this["_data"] = { ...this["_data"], items: v357["items"] }),
      this["_syncPreviewLayer"](),
      this["_commitItems"](),
      true
    );
  }
  ["_createImageDragGhost"](
    v358,
    v359,
    v360,
    v361,
    { hidden: hidden = false } = {},
  ) {
    if (typeof document === "undefined" || !document["body"] || !v358)
      return null;
    const v362 = v358["getBoundingClientRect"]?.(),
      v363 = resolveCollageItemSourceImage(v359),
      v364 = v358["querySelector"](".collage-item-img"),
      v365 = toPositiveNumber(v364?.["naturalWidth"], 0),
      v366 = toPositiveNumber(v364?.["naturalHeight"], 0),
      v367 = (v363["hasIntrinsicSize"] ? v363["width"] : 0) || v365,
      v368 = (v363["hasIntrinsicSize"] ? v363["height"] : 0) || v366,
      v369 = v367 > 0 && v368 > 0 ? v367 / v368 : 0,
      v370 = Math["max"](1, Math["round"](Number(v362?.["width"]) || 1)),
      v371 = Math["max"](1, Math["round"](Number(v362?.["height"]) || 1)),
      v372 =
        typeof appStore["getStateRaw"] === "function"
          ? appStore["getStateRaw"]()
          : appStore["getState"](),
      v373 = toPositiveNumber(v372?.["viewport"]?.["zoom"], 1),
      v374 = toPositiveNumber(v359?.["sourceDisplayWidth"], 0),
      v375 = toPositiveNumber(v359?.["sourceDisplayHeight"], 0);
    let v376 = v370,
      v377 = v371;
    if (v374 > 0 && v375 > 0)
      ((v376 = Math["max"](1, Math["round"](v374 * v373))),
        (v377 = Math["max"](1, Math["round"](v375 * v373))));
    else {
      if (v369 > 0) {
        const v378 = resolveCollageSizeByShortSide({
          width: v367,
          height: v368,
          shortSide: Math["min"](v370, v371),
        });
        ((v376 = v378["width"]), (v377 = v378["height"]));
      }
    }
    const v379 = document["createElement"]("div");
    ((v379["className"] = "v2-ghost-image collage-drag-ghost"),
      Object["assign"](v379["style"], {
        position: "fixed",
        left: "0",
        top: "0",
        width: v376 + "px",
        height: v377 + "px",
        transform:
          "translate(" + v360 + "px,\x20" + v361 + "px) translate(-50%, -50%)",
        opacity: hidden ? "0" : "0.9",
        visibility: hidden ? "hidden" : "visible",
        pointerEvents: "none",
        zIndex: "10000",
        borderRadius: "8px",
        border: "none",
        boxShadow:
          "0 0 0 2px var(--white-80), 0 0 30px 0 var(--white-40), 0 12px 40px var(--black-60)",
        overflow: "hidden",
        willChange: "transform, opacity",
        transition: "none",
        background: "var(--bg-node)",
      }));
    const v380 =
        v363["src"] || v363["localPath"]
          ? document["createElement"]("img")
          : v364?.["cloneNode"](false) || document["createElement"]("img"),
      v381 =
        v363["src"] ||
        (v363["localPath"]
          ? "/" + String(v363["localPath"])["replace"](/^\/+/, "")
          : "") ||
        String(v359?.["url"] || "")["trim"]() ||
        (v359?.["localPath"]
          ? "/" + String(v359["localPath"])["replace"](/^\/+/, "")
          : "") ||
        String(v359?.["sourceUrl"] || "")["trim"]();
    return (
      v381 && v380["setAttribute"]("src", v381),
      Object["assign"](v380["style"], {
        width: "100%",
        height: "100%",
        objectFit: v363["isOriginalSource"] ? "contain" : "cover",
        display: "block",
        pointerEvents: "none",
        transition: "none",
      }),
      v379["appendChild"](v380),
      document["body"]["appendChild"](v379),
      v379
    );
  }
  ["_ensureImageDragGhost"](v382, v383, v384 = {}) {
    if (!v382 || v382["ghostEl"]) return v382?.["ghostEl"] || null;
    const v385 = (this["_data"]["items"] || [])[v382["index"]];
    return (
      (v382["ghostEl"] = this["_createImageDragGhost"](
        v382["tile"],
        v385,
        Number(v383?.["clientX"]) || v382["startClientX"],
        Number(v383?.["clientY"]) || v382["startClientY"],
        v384,
      )),
      v382["ghostEl"]
    );
  }
  ["_activateImageDragGhost"](
    v386,
    v387,
    { markSource: markSource = false } = {},
  ) {
    const v388 = this["_ensureImageDragGhost"](v386, v387);
    if (!v388) return null;
    return (
      (v386["ghostActive"] = true),
      (v388["style"]["visibility"] = "visible"),
      (v388["style"]["opacity"] = "0.9"),
      (v388["style"]["transition"] = "none"),
      v386["tile"]?.["classList"]?.["toggle"]("is-drag-source", markSource),
      v388
    );
  }
  ["_moveImageDragGhost"](v389, v390, v391) {
    if (!v389?.["ghostEl"]) return;
    v389["ghostEl"]["style"]["transform"] =
      "translate(" + v390 + "px, " + v391 + "px) translate(-50%, -50%)";
  }
  ["_removeImageDragGhost"](v392, { fade: fade = false } = {}) {
    const v393 = v392?.["ghostEl"] || null;
    if (!v393) return;
    (fade
      ? ((v393["style"]["transition"] =
          "opacity 0.16s cubic-bezier(0.4, 0, 0.2, 1)"),
        (v393["style"]["opacity"] = "0"),
        setTimeout(() => v393["remove"](), 160))
      : v393["remove"](),
      v392 &&
        ((v392["ghostEl"] = null),
        (v392["ghostActive"] = false),
        v392["tile"]?.["classList"]?.["remove"]("is-drag-source")));
  }
  ["_removeImageDragGhostWhenSourceReady"](v394, v395) {
    if (!v394) return;
    const v396 = () => this["_removeImageDragGhost"]({ ghostEl: v394 });
    if (typeof document === "undefined" || !v395) {
      v396();
      return;
    }
    const v397 =
        typeof requestAnimationFrame === "function"
          ? requestAnimationFrame
          : (v398) => setTimeout(v398, 16),
      v399 = () =>
        typeof performance !== "undefined" &&
        typeof performance["now"] === "function"
          ? performance["now"]()
          : Date["now"](),
      v400 = v399();
    let v401 = 0;
    const v402 = () => {
      const v403 = document["getElementById"]?.(v395),
        v404 = v403?.["querySelector"]?.("img.node-img"),
        v405 =
          !!v404 &&
          v404["style"]["display"] !== "none" &&
          v404["complete"] === true &&
          Number(v404["naturalWidth"] || 0) > 0;
      if (v405) {
        v401 += 1;
        if (v401 >= 2) {
          v396();
          return;
        }
      } else v401 = 0;
      if (v399() - v400 > 1200) {
        v396();
        return;
      }
      v397(v402);
    };
    v397(v402);
  }
  ["_beginImageDrag"](v406, v407) {
    if (!this["_isEditing"]) return;
    if (v406["target"]?.["closest"]?.(".collage-divider-handle")) return;
    (v406["preventDefault"](), v406["stopPropagation"]());
    const v408 = (this["_data"]["items"] || [])[v407];
    if (!v408 || isCollageItemEmpty(v408)) return;
    this["_endImageDrag"]({ shouldCommit: false });
    const v409 = this["_getTileByIndex"](v407),
      v410 = this["_boardEl"]?.["getBoundingClientRect"]?.(),
      v411 = v409?.["getBoundingClientRect"]?.();
    if (!v409 || !v410 || !v411) return;
    const v412 = (v413) => this["_updateImageDrag"](v413),
      v414 = (v415) => this["_endImageDrag"]({ event: v415 });
    ((this["_activeImageDrag"] = {
      index: v407,
      tile: v409,
      boardRect: v410,
      tileRect: v411,
      startClientX: Number(v406["clientX"]) || 0,
      startClientY: Number(v406["clientY"]) || 0,
      startFocusX: clamp01(v408["focusX"]),
      startFocusY: clamp01(v408["focusY"]),
      imageScale: normalizeCollageImageScale(v408["imageScale"]),
      slotHitRects: this["_collectSlotHitRects"]({ excludeIndex: v407 }),
      moved: false,
      ghostEl: this["_createImageDragGhost"](
        v409,
        v408,
        Number(v406["clientX"]) || 0,
        Number(v406["clientY"]) || 0,
        { hidden: true },
      ),
      ghostActive: false,
      onMove: v412,
      onEnd: v414,
    }),
      v409["classList"]["add"]("is-image-editing"));
    try {
      v409["setPointerCapture"]?.(v406["pointerId"]);
    } catch (v416) {}
    (document["addEventListener"]("pointermove", v412),
      document["addEventListener"]("pointerup", v414, { once: true }),
      document["addEventListener"]("pointercancel", v414, { once: true }));
  }
  ["_updateImageDrag"](v417) {
    const v418 = this["_activeImageDrag"];
    if (!v418) return;
    v417["preventDefault"]?.();
    const v419 = Number(v417["clientX"]) || v418["startClientX"],
      v420 = Number(v417["clientY"]) || v418["startClientY"],
      v421 = v419 - v418["startClientX"],
      v422 = v420 - v418["startClientY"];
    if (Math["hypot"](v421, v422) > 3) v418["moved"] = true;
    const v423 = Math["hypot"](v421, v422),
      v424 = this["_isOutsideRect"](v419, v420, v418["tileRect"], 2);
    if (
      v418["ghostActive"] ||
      (v418["moved"] && v423 > COLLAGE_IMAGE_DRAG_OUT_THRESHOLD_PX && v424)
    ) {
      (this["_activateImageDragGhost"](v418, v417, { markSource: true }),
        this["_moveImageDragGhost"](v418, v419, v420));
      const v425 = this["_getSlotIndexAtClientPoint"](v419, v420, {
        excludeIndex: v418["index"],
        slotHitRects: v418["slotHitRects"],
      });
      this["highlightSlot"](v425);
      return;
    }
    this["highlightSlot"](-1);
    const v426 = Math["max"](0.35, v418["imageScale"]),
      v427 = clamp01(
        v418["startFocusX"] -
          v421 / Math["max"](1, v418["tileRect"]["width"]) / v426,
      ),
      v428 = clamp01(
        v418["startFocusY"] -
          v422 / Math["max"](1, v418["tileRect"]["height"]) / v426,
      ),
      v429 = Array["isArray"](this["_data"]["items"])
        ? [...this["_data"]["items"]]
        : [],
      v430 = v429[v418["index"]];
    if (!v430) return;
    ((v429[v418["index"]] = { ...v430, focusX: v427, focusY: v428 }),
      (this["_data"] = { ...this["_data"], items: v429 }),
      this["_applyTileImagePlacement"](v418["index"]),
      this["_applyImagePlacement"](
        v418["ghostEl"]?.["querySelector"]?.(".collage-item-img, img"),
        v429[v418["index"]],
      ));
  }
  ["_endImageDrag"]({
    event: event = null,
    shouldCommit: shouldCommit = true,
  } = {}) {
    const v431 = this["_activeImageDrag"];
    if (!v431) return;
    (document["removeEventListener"]("pointermove", v431["onMove"]),
      document["removeEventListener"]("pointerup", v431["onEnd"]),
      document["removeEventListener"]("pointercancel", v431["onEnd"]),
      v431["tile"]?.["classList"]?.["remove"]("is-image-editing"),
      v431["tile"]?.["classList"]?.["remove"]("is-drag-source"),
      this["highlightSlot"](-1),
      (this["_activeImageDrag"] = null));
    if (!shouldCommit) {
      this["_removeImageDragGhost"](v431);
      return;
    }
    const v432 = Number(event?.["clientX"]),
      v433 = Number(event?.["clientY"]),
      v434 = Math["hypot"](
        (Number["isFinite"](v432) ? v432 : v431["startClientX"]) -
          v431["startClientX"],
        (Number["isFinite"](v433) ? v433 : v431["startClientY"]) -
          v431["startClientY"],
      ),
      v435 =
        Number["isFinite"](v432) &&
        Number["isFinite"](v433) &&
        this["_isOutsideBoard"](v432, v433),
      v436 =
        v431["ghostActive"] &&
        Number["isFinite"](v432) &&
        Number["isFinite"](v433)
          ? this["_getSlotIndexAtClientPoint"](v432, v433, {
              excludeIndex: v431["index"],
              slotHitRects: v431["slotHitRects"],
            })
          : -1;
    if (v436 >= 0 && v436 !== v431["index"]) {
      this["_removeImageDragGhost"](v431);
      if (this["_swapImageItemIntoSlot"](v431["index"], v436)) return;
    }
    if (v431["moved"] && v434 > COLLAGE_IMAGE_DRAG_OUT_THRESHOLD_PX && v435) {
      (this["_activateImageDragGhost"](v431, event, { markSource: true }),
        this["_moveImageDragGhost"](v431, v432, v433),
        v431["tile"]?.["classList"]?.["remove"]("is-drag-source"),
        this["_extractItemToSourceNode"](
          v431["index"],
          v432,
          v433,
          v431["ghostEl"],
        ));
      return;
    }
    (this["_removeImageDragGhost"](v431), this["_commitItems"]());
  }
  ["_isOutsideRect"](v437, v438, v439, v440 = 0) {
    if (!v439) return false;
    const v441 = Math["max"](0, Number(v440) || 0);
    return (
      v437 < v439["left"] - v441 ||
      v437 > v439["right"] + v441 ||
      v438 < v439["top"] - v441 ||
      v438 > v439["bottom"] + v441
    );
  }
  ["_isOutsideBoard"](v442, v443) {
    const v444 = this["_boardEl"]?.["getBoundingClientRect"]?.();
    return this["_isOutsideRect"](v442, v443, v444);
  }
  ["_handleItemWheel"](v445, v446) {
    if (!this["_isEditing"]) return;
    const v447 = (this["_data"]["items"] || [])[v446];
    if (!v447 || isCollageItemEmpty(v447)) return;
    (v445["preventDefault"](), v445["stopPropagation"]());
    const v448 = normalizeCollageImageScale(v447["imageScale"]),
      v449 = Math["exp"](-(Number(v445["deltaY"]) || 0) * 0.0015),
      v450 = normalizeCollageImageScale(v448 * v449);
    if (Math["abs"](v450 - v448) < 0.001) return;
    const v451 = Array["isArray"](this["_data"]["items"])
      ? [...this["_data"]["items"]]
      : [];
    ((v451[v446] = { ...v451[v446], imageScale: v450 }),
      (this["_data"] = { ...this["_data"], items: v451 }),
      this["_applyTileImagePlacement"](v446),
      this["_scheduleItemsCommit"]());
  }
  ["_beginDividerDrag"](v452, v453) {
    if (!this["_isEditing"]) return;
    (v452["preventDefault"](), v452["stopPropagation"]());
    if (!v453) return;
    this["_endDividerDrag"]({ shouldCommit: false });
    const v454 = this["_boardEl"]?.["getBoundingClientRect"]?.();
    if (!v454) return;
    const v455 = v452["currentTarget"],
      v456 = (v457) => this["_updateDividerDrag"](v457),
      v458 = () => this["_endDividerDrag"]();
    ((this["_activeDividerDrag"] = {
      divider: v453,
      handle: v455,
      startClientX: Number(v452["clientX"]) || 0,
      startClientY: Number(v452["clientY"]) || 0,
      startItems: this["_getItemsCopy"](),
      boardRect: v454,
      onMove: v456,
      onEnd: v458,
    }),
      v455?.["classList"]?.["add"]("is-active"));
    try {
      v452["currentTarget"]?.["setPointerCapture"]?.(v452["pointerId"]);
    } catch (v459) {}
    (document["addEventListener"]("pointermove", v456),
      document["addEventListener"]("pointerup", v458, { once: true }),
      document["addEventListener"]("pointercancel", v458, { once: true }));
  }
  ["_updateDividerDrag"](v460) {
    const v461 = this["_activeDividerDrag"];
    if (!v461) return;
    v460["preventDefault"]?.();
    const v462 = toPositiveNumber(this["_data"]["width"], 1),
      v463 = toPositiveNumber(this["_data"]["height"], 1),
      v464 =
        (((Number(v460["clientX"]) || 0) - v461["startClientX"]) /
          Math["max"](1, v461["boardRect"]["width"])) *
        v462,
      v465 =
        (((Number(v460["clientY"]) || 0) - v461["startClientY"]) /
          Math["max"](1, v461["boardRect"]["height"])) *
        v463,
      v466 = v461["divider"]["axis"] === "x" ? v464 : v465,
      v467 = buildCollageDividerDragPatch(
        { ...this["_data"], items: v461["startItems"] },
        v461["divider"],
        v466,
      );
    this["_data"] = { ...this["_data"], items: v467["items"] };
    const v468 = resolveCollageItemFrames(this["_data"]),
      v469 = Array["isArray"](v467["moveIndexes"])
        ? v467["moveIndexes"]
        : v467["items"]["map"]((v470, v471) => v471);
    for (const v472 of v469) {
      this["_applyTileGeometry"](v472, v468);
    }
    this["_applyDividerHandleGeometry"](
      v461["handle"],
      {
        ...v461["divider"],
        position: (Number(v461["divider"]["position"]) || 0) + v467["delta"],
      },
      v462,
      v463,
    );
  }
  ["_endDividerDrag"]({ shouldCommit: shouldCommit = true } = {}) {
    const v473 = this["_activeDividerDrag"];
    if (!v473) return;
    (document["removeEventListener"]("pointermove", v473["onMove"]),
      document["removeEventListener"]("pointerup", v473["onEnd"]),
      document["removeEventListener"]("pointercancel", v473["onEnd"]),
      v473["handle"]?.["classList"]?.["remove"]("is-active"),
      (this["_activeDividerDrag"] = null));
    if (shouldCommit) this["_commitItems"]();
  }
  ["_extractItemToSourceNode"](v474, v475, v476, v477 = null) {
    const v478 = (this["_data"]["items"] || [])[v474];
    if (!v478 || isCollageItemEmpty(v478)) {
      this["_commitItems"]();
      return;
    }
    const v479 =
        typeof appStore["getStateRaw"] === "function"
          ? appStore["getStateRaw"]()
          : appStore["getState"](),
      v480 = v479?.["viewport"] || { x: 0, y: 0, zoom: 1 },
      v481 = screenToWorld(v475, v476, v480),
      v482 = resolveCollageItemFrames(this["_data"])["find"](
        (v483) => v483["index"] === v474,
      ),
      v484 = resolveCollageItemSourceImage(v478),
      v485 =
        this["_getTileByIndex"](v474)?.["querySelector"](".collage-item-img"),
      v486 = v477?.["querySelector"]?.("img"),
      v487 = toPositiveNumber(v485?.["naturalWidth"], 0),
      v488 = toPositiveNumber(v485?.["naturalHeight"], 0),
      v489 = toPositiveNumber(v486?.["naturalWidth"], 0),
      v490 = toPositiveNumber(v486?.["naturalHeight"], 0),
      v491 =
        (v484["hasIntrinsicSize"] ? toPositiveNumber(v484["width"], 0) : 0) ||
        v487 ||
        v489 ||
        toPositiveNumber(v484["width"], 0) ||
        toPositiveNumber(v482?.["frame"]?.["width"], v478["width"] || 1),
      v492 =
        (v484["hasIntrinsicSize"] ? toPositiveNumber(v484["height"], 0) : 0) ||
        v488 ||
        v490 ||
        toPositiveNumber(v484["height"], 0) ||
        toPositiveNumber(v482?.["frame"]?.["height"], v478["height"] || 1),
      v493 = toPositiveNumber(v478?.["sourceDisplayWidth"], 0),
      v494 = toPositiveNumber(v478?.["sourceDisplayHeight"], 0),
      v495 =
        v493 > 0 && v494 > 0
          ? {
              width: Math["max"](1, Math["round"](v493)),
              height: Math["max"](1, Math["round"](v494)),
            }
          : getAutoMediaSizeByShortSide(v491, v492),
      v496 = generateId("source-image"),
      v497 = v484["localPath"],
      v498 = v484["src"] || (v497 ? "/" + v497["replace"](/^\/+/, "") : "");
    if (!v498 && !v497) return;
    const v499 = this["_getItemsCopy"]();
    ((v499[v474] = normalizeEmptyCollageItem(v478, v474)),
      (this["_data"] = { ...this["_data"], items: v499 }));
    const v500 = () => {
      (appStore["addNode"](
        buildSourceMediaNodePayload({
          id: v496,
          type: "source-image",
          src: v498,
          localPath: v497,
          thumbLocalPath: v484["isOriginalSource"]
            ? ""
            : v478["thumbLocalPath"] || "",
          sourceLocalPath: "",
          sourceUrl: "",
          sourceWidth: null,
          sourceHeight: null,
          imageWidth: v491,
          imageHeight: v492,
          x: v481["x"] - v495["width"] / 2,
          y: v481["y"] - v495["height"] / 2,
          width: v495["width"],
          height: v495["height"],
          fileName: v478["fileName"] || "",
          name: v478["label"] || "拼图图片",
          fixedSize: true,
          needsAutoResize: false,
        }),
      ),
        appStore["updateNodeData"](this["id"], { items: v499 }),
        appStore["setSelectedNodes"]([v496]));
    };
    if (typeof appStore["batch"] === "function") appStore["batch"](v500);
    else v500();
    (commit(),
      window["_triggerLocalCacheSave"]?.(),
      this["_removeImageDragGhostWhenSourceReady"](v477, v496));
  }
  ["_resolveItemLocalPath"](v501) {
    const v502 =
      String(v501?.["localPath"] || "")["trim"]() ||
      String(v501?.["sourceLocalPath"] || "")["trim"]() ||
      String(v501?.["thumbLocalPath"] || "")["trim"]() ||
      (String(v501?.["url"] || "")["startsWith"]("/")
        ? String(v501["url"])["trim"]()
        : "");
    if (!v502 || /^(?:https?:|blob:|data:)/i["test"](v502)) return "";
    return v502["replace"](/^\/+/, "");
  }
  async ["_renderCollageOutput"](v503) {
    const v504 = resolveCollageItemFrames(this["_data"])["filter"](
      ({ item: v505 }) => !isCollageItemEmpty(v505),
    );
    if (v504["length"] === 0) throw new Error("拼图里没有图片可处理");
    const v506 = getCollageExportResolution(v503),
      v507 = resolveCollageExportSize(this["_data"], v506["longSide"]),
      v508 = document["createElement"]("canvas");
    ((v508["width"] = v507["width"]), (v508["height"] = v507["height"]));
    const v509 = v508["getContext"]("2d");
    if (!v509) throw new Error("拼图画布创建失败");
    const v510 = normalizeCollageBackgroundColor(
        this["_data"]["backgroundColor"],
      ),
      v511 = isCollageBackgroundTransparent(v510),
      v512 = v511
        ? ""
        : resolveCssColorValue(v510) || getDocumentCssVar("--white");
    !v511 &&
      v512 &&
      ((v509["fillStyle"] = v512),
      v509["fillRect"](0, 0, v508["width"], v508["height"]));
    const v513 = toPositiveNumber(this["_data"]["width"], 1),
      v514 = toPositiveNumber(this["_data"]["height"], 1),
      v515 = v508["width"] / v513,
      v516 = v508["height"] / v514,
      v517 = Math["min"](v515, v516),
      { cornerRadius: v518 } = getCollageLayoutStyle(this["_data"]);
    let v519 = 0;
    const v520 = await Promise["all"](
      v504["map"](async ({ item: v521, frame: v522, index: v523 }) => {
        try {
          const v524 = resolveCollageItemPreviewUrl(v521),
            v525 =
              this["_getTileByIndex"](v523)?.["querySelector"]?.(
                ".collage-item-img",
              );
          if (
            v525?.["complete"] === true &&
            Number(v525["naturalWidth"] || 0) > 0
          )
            return { item: v521, frame: v522, img: v525 };
          if (!v524) return null;
          const v526 = await loadImage(v524);
          return { item: v521, frame: v522, img: v526 };
        } catch (v527) {
          return (
            console["warn"]("[CollageNode]\x20skip\x20image:", v527),
            null
          );
        }
      }),
    );
    for (const v528 of v520) {
      if (!v528) continue;
      const { item: v529, frame: v530, img: v531 } = v528,
        v532 = {
          x: Math["round"](v530["x"] * v515),
          y: Math["round"](v530["y"] * v516),
          width: Math["max"](1, Math["round"](v530["width"] * v515)),
          height: Math["max"](1, Math["round"](v530["height"] * v516)),
        };
      drawRoundedImageCover(
        v509,
        v531,
        v532,
        v518 * v517,
        v529["focusX"],
        v529["focusY"],
        v529["imageScale"],
      ) && (v519 += 1);
    }
    if (v519 === 0) throw new Error("没有图片成功绘制");
    const v533 = v511 ? "image/png" : "image/jpeg",
      v534 = v511 ? "png" : "jpg",
      v535 = await canvasToBlob(v508, v533, v511 ? undefined : 0.92),
      v536 = generateId("collage"),
      v537 = "collage_" + v536 + "." + v534;
    return {
      blob: v535,
      mimeType: v533,
      extension: v534,
      fileName: v537,
      resolution: v506,
      width: v508["width"],
      height: v508["height"],
    };
  }
  async ["_saveCollageOutput"](v538) {
    const v539 = new File([v538["blob"]], v538["fileName"], {
        type: v538["mimeType"],
      }),
      v540 = await saveOutputBlob(v539, { ext: v538["extension"] }),
      v541 = String(v540["localPath"] || v540["path"] || "")["replace"](
        /^\//,
        "",
      ),
      v542 = String(v540["url"] || "")["trim"]() || (v541 ? "/" + v541 : "");
    return { saved: v540, localPath: v541, srcUrl: v542 };
  }
  ["_resolveCompositeNodePosition"](v543) {
    const v544 =
        typeof appStore["getStateRaw"] === "function"
          ? appStore["getStateRaw"]()
          : appStore["getState"](),
      v545 = v544?.["nodes"] || {},
      v546 = v545[this["id"]] || this["_data"];
    return calcSafeSpawnPosNearNode(v545, v546, v543["width"], v543["height"]);
  }
  ["_createCompositeSourceNode"](v547, v548) {
    const v549 = getAutoMediaSizeByShortSide(v547["width"], v547["height"]),
      v550 = this["_resolveCompositeNodePosition"](v549),
      v551 = generateId("node");
    return buildSourceMediaNodePayload({
      id: v551,
      type: "source-image",
      x: v550["x"],
      y: v550["y"],
      width: v549["width"],
      height: v549["height"],
      naturalWidth: v547["width"],
      naturalHeight: v547["height"],
      src: v548["srcUrl"],
      localPath: v548["localPath"],
      fileName: v548["saved"]?.["filename"] || v547["fileName"],
      name: "拼图_" + v547["resolution"]["label"],
      needsAutoResize: false,
    });
  }
  ["_addCompositeSourceNode"](v552, v553) {
    const v554 = this["_createCompositeSourceNode"](v552, v553),
      v555 = () => {
        (appStore["addNode"](v554), appStore["setSelectedNodes"]([v554["id"]]));
      };
    if (typeof appStore["batch"] === "function") appStore["batch"](v555);
    else v555();
    return (
      commit(),
      window["_triggerLocalCacheSave"]?.(),
      window["v2FocusOnNodes"] &&
        requestAnimationFrame(() =>
          window["v2FocusOnNodes"]([this["id"], v554["id"]]),
        ),
      v554
    );
  }
  async ["_composeCollage"](v556, v557 = null) {
    if (this["_isExporting"] || this["_isCompositing"]) return;
    ((this["_isCompositing"] = true), this["_closeMenus"]());
    const v558 = this["_setComposeButtonBusy"](
        v557 || this["el"]["querySelector"](".collage-compose-btn"),
      ),
      v559 = (v560) => {
        if (!v560) return;
        setTimeout(() => revokeBlobObjectUrl(v560), 4000);
      };
    try {
      const v561 = await this["_renderCollageOutput"](v556),
        v562 = createBlobObjectUrl(v561["blob"]);
      if (v562) {
        const v563 = this["_addCompositeSourceNode"](v561, {
          saved: { filename: v561["fileName"] },
          localPath: "",
          srcUrl: v562,
        });
        try {
          const v564 = await this["_saveCollageOutput"](v561);
          (appStore["updateNodeData"](v563["id"], {
            src: v564["srcUrl"],
            localPath: v564["localPath"],
            fileName: v564["saved"]?.["filename"] || v561["fileName"],
          }),
            window["_triggerLocalCacheSave"]?.(),
            v559(v562),
            window["showToast"]?.("合成成功，源图像节点已生成", "success"));
        } catch (v565) {
          (console["error"]("[CollageNode] compose save failed:", v565),
            window["showToast"]?.("合成节点已生成，但保存失败", "warning"));
        }
        return;
      }
      const v566 = await this["_saveCollageOutput"](v561);
      (this["_addCompositeSourceNode"](v561, v566),
        window["showToast"]?.("合成成功，源图像节点已生成", "success"));
    } catch (v567) {
      (console["error"]("[CollageNode] compose failed:", v567),
        window["showToast"]?.(v567?.["message"] || "拼图合成失败", "error"));
    } finally {
      ((this["_isCompositing"] = false), v558?.(), this["_syncToolbarState"]());
    }
  }
  async ["_exportCollage"](v568) {
    if (this["_isExporting"] || this["_isCompositing"]) return;
    ((this["_isExporting"] = true),
      this["_closeMenus"](),
      this["_syncToolbarState"]());
    try {
      const v569 = await this["_renderCollageOutput"](v568);
      (await this["_saveCollageOutput"](v569),
        window["showToast"]?.("拼图已导出", "success"));
    } catch (v570) {
      (console["error"]("[CollageNode]\x20export\x20failed:", v570),
        window["showToast"]?.(v570?.["message"] || "拼图导出失败", "error"));
    } finally {
      ((this["_isExporting"] = false), this["_syncToolbarState"]());
    }
  }
}
