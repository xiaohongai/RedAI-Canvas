import {
  resolveStoryboardCellAssetSrc,
  resolveStoryboardCellPreviewSrc,
} from "../../core/storyboardCellUtils.js";
import {
  localPathToUrl,
  normalizeLocalPath,
} from "../../utils/localMediaPath.js";
import {
  IMAGE_RATIO_OPTIONS,
  parseRatioLabel,
} from "../../../api/imageRatioPolicy.js";
import { AI_GENERATION_NODE_SHORT_SIDE } from "../../services/mediaSizingPolicy.js";
export const COLLAGE_NODE_TYPE = "collage";
export const COLLAGE_SCHEMA_VERSION = "collage.v1";
export const COLLAGE_COLLAPSED_SHORT_SIDE = 300;
export const COLLAGE_SLOT_SHORT_SIDE = AI_GENERATION_NODE_SHORT_SIDE;
export const COLLAGE_EXPANDED_SHORT_SIDE = COLLAGE_SLOT_SHORT_SIDE * 2;
export const COLLAGE_DEFAULT_SIZE = Object["freeze"]({
  width: COLLAGE_EXPANDED_SHORT_SIDE,
  height: COLLAGE_EXPANDED_SHORT_SIDE,
});
export const COLLAGE_INITIAL_ASPECT_RATIO = "1:1";
export const COLLAGE_INITIAL_LAYOUT_PRESET_ID = "puzzle-2-rows";
export const COLLAGE_EXPORT_RESOLUTIONS = Object["freeze"]([
  { label: "1K", longSide: 1024 },
  { label: "2K", longSide: 2048 },
  { label: "4K", longSide: 4096 },
]);
const COLLAGE_ASPECT_RATIO_LABELS = Object["freeze"]([
    "1:1",
    "16:9",
    "9:16",
    "3:4",
    "4:3",
    "3:2",
    "2:3",
    "5:4",
    "4:5",
    "21:9",
  ]),
  imageRatioOptionsByLabel = new Map(
    IMAGE_RATIO_OPTIONS["map"]((v0) => [v0["label"], v0]),
  );
function createCollageAspectRatioOption(v1) {
  const v2 = imageRatioOptionsByLabel["get"](v1),
    v3 = parseRatioLabel(v2?.["label"] || v1);
  if (!v3) return null;
  return Object["freeze"]({
    label: v3["label"],
    value: v3["label"],
    w: v3["w"],
    h: v3["h"],
  });
}
export const COLLAGE_ASPECT_RATIO_OPTIONS = Object["freeze"](
  COLLAGE_ASPECT_RATIO_LABELS["map"](createCollageAspectRatioOption)["filter"](
    Boolean,
  ),
);
export const COLLAGE_BACKGROUND_TRANSPARENT = "transparent";
export const COLLAGE_BACKGROUND_DEFAULT = COLLAGE_BACKGROUND_TRANSPARENT;
export const COLLAGE_BACKGROUND_OPTIONS = Object["freeze"]([
  { id: "transparent", label: "透明", value: COLLAGE_BACKGROUND_TRANSPARENT },
  { id: "white", label: "白色", value: "var(--white)" },
  { id: "black", label: "黑色", value: "var(--black)" },
  { id: "indigo", label: "靛蓝", value: "var(--indigo)" },
  { id: "green", label: "绿色", value: "var(--green)" },
  { id: "gold", label: "金色", value: "var(--gold)" },
  { id: "red", label: "红色", value: "var(--red)" },
  { id: "purple", label: "紫色", value: "var(--purple)" },
  { id: "pink", label: "粉色", value: "var(--group-pink)" },
  { id: "slate", label: "灰蓝", value: "var(--group-slate)" },
  { id: "cyan", label: "青色", value: "var(--cyan)" },
]);
export const COLLAGE_LAYOUT_STYLE_DEFAULTS = Object["freeze"]({
  outerPadding: 20,
  gap: 10,
  cornerRadius: 0,
});
export const COLLAGE_IMAGE_SCALE_DEFAULT = 1;
export const COLLAGE_IMAGE_SCALE_MIN = 1;
export const COLLAGE_IMAGE_SCALE_MAX = 4;
const COLLAGE_DIVIDER_MIN_SIZE = 4,
  COLLAGE_DIVIDER_MAX_MIN_SIZE = 24,
  COLLAGE_DIVIDER_MIN_SIZE_RATIO = 0.02,
  slot = (v4, v5, v6, v7) => ({ x: v4, y: v5, width: v6, height: v7 });
export const COLLAGE_LAYOUT_PRESETS = Object["freeze"]([
  { id: "freeform", label: "自由", slotCount: 0 },
  {
    id: "puzzle-2-rows",
    label: "上下",
    slotCount: 2,
    width: 1000,
    height: 1000,
    slots: [slot(0, 0, 1000, 500), slot(0, 500, 1000, 500)],
  },
  {
    id: "puzzle-2-cols",
    label: "左右",
    slotCount: 2,
    width: 1000,
    height: 1000,
    slots: [slot(0, 0, 500, 1000), slot(500, 0, 500, 1000)],
  },
  {
    id: "puzzle-3-rows",
    label: "三横",
    slotCount: 3,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 1000, 333.333),
      slot(0, 333.333, 1000, 333.334),
      slot(0, 666.667, 1000, 333.333),
    ],
  },
  {
    id: "puzzle-3-cols",
    label: "三竖",
    slotCount: 3,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 333.333, 1000),
      slot(333.333, 0, 333.334, 1000),
      slot(666.667, 0, 333.333, 1000),
    ],
  },
  {
    id: "puzzle-3-top-wide",
    label: "上1下2",
    slotCount: 3,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 1000, 500),
      slot(0, 500, 500, 500),
      slot(500, 500, 500, 500),
    ],
  },
  {
    id: "puzzle-3-bottom-wide",
    label: "上2下1",
    slotCount: 3,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 500, 500),
      slot(500, 0, 500, 500),
      slot(0, 500, 1000, 500),
    ],
  },
  {
    id: "puzzle-3-left-tall",
    label: "左1右2",
    slotCount: 3,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 500, 1000),
      slot(500, 0, 500, 500),
      slot(500, 500, 500, 500),
    ],
  },
  {
    id: "puzzle-3-right-tall",
    label: "左2右1",
    slotCount: 3,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 500, 500),
      slot(0, 500, 500, 500),
      slot(500, 0, 500, 1000),
    ],
  },
  {
    id: "puzzle-3-hero-top",
    label: "大上",
    slotCount: 3,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 1000, 640),
      slot(0, 640, 360, 360),
      slot(360, 640, 640, 360),
    ],
  },
  {
    id: "puzzle-3-hero-left",
    label: "大左",
    slotCount: 3,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 640, 1000),
      slot(640, 0, 360, 500),
      slot(640, 500, 360, 500),
    ],
  },
  {
    id: "puzzle-4-even",
    label: "四宫格",
    slotCount: 4,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 500, 500),
      slot(500, 0, 500, 500),
      slot(0, 500, 500, 500),
      slot(500, 500, 500, 500),
    ],
  },
  {
    id: "puzzle-4-rows",
    label: "四横",
    slotCount: 4,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 1000, 250),
      slot(0, 250, 1000, 250),
      slot(0, 500, 1000, 250),
      slot(0, 750, 1000, 250),
    ],
  },
  {
    id: "puzzle-4-cols",
    label: "四竖",
    slotCount: 4,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 250, 1000),
      slot(250, 0, 250, 1000),
      slot(500, 0, 250, 1000),
      slot(750, 0, 250, 1000),
    ],
  },
  {
    id: "puzzle-4-top-wide",
    label: "上1下3",
    slotCount: 4,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 1000, 500),
      slot(0, 500, 333.333, 500),
      slot(333.333, 500, 333.334, 500),
      slot(666.667, 500, 333.333, 500),
    ],
  },
  {
    id: "puzzle-4-bottom-wide",
    label: "上3下1",
    slotCount: 4,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 333.333, 500),
      slot(333.333, 0, 333.334, 500),
      slot(666.667, 0, 333.333, 500),
      slot(0, 500, 1000, 500),
    ],
  },
  {
    id: "puzzle-4-left-wide",
    label: "左1右3",
    slotCount: 4,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 500, 1000),
      slot(500, 0, 500, 333.333),
      slot(500, 333.333, 500, 333.334),
      slot(500, 666.667, 500, 333.333),
    ],
  },
  {
    id: "puzzle-4-right-wide",
    label: "左3右1",
    slotCount: 4,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 500, 333.333),
      slot(0, 333.333, 500, 333.334),
      slot(0, 666.667, 500, 333.333),
      slot(500, 0, 500, 1000),
    ],
  },
  {
    id: "puzzle-4-bands",
    label: "横向组合",
    slotCount: 4,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 1000, 300),
      slot(0, 300, 500, 400),
      slot(500, 300, 500, 400),
      slot(0, 700, 1000, 300),
    ],
  },
  {
    id: "puzzle-4-hero-top",
    label: "大上",
    slotCount: 4,
    width: 1000,
    height: 1000,
    slots: [
      slot(0, 0, 1000, 600),
      slot(0, 600, 333.333, 400),
      slot(333.333, 600, 333.334, 400),
      slot(666.667, 600, 333.333, 400),
    ],
  },
]);
export const COLLAGE_TEMPLATE_GROUPS = Object["freeze"](
  [2, 3, 4]["map"]((v8) => ({
    slotCount: v8,
    label: String(v8),
    presets: COLLAGE_LAYOUT_PRESETS["filter"]((v9) => v9["slotCount"] === v8),
  })),
);
function trimString(v10) {
  return typeof v10 === "string" ? v10["trim"]() : "";
}
function toPositiveNumber(v11, v12 = 0) {
  const v13 = Number(v11);
  return Number["isFinite"](v13) && v13 > 0 ? v13 : v12;
}
function roundDimension(v14, v15 = 1) {
  return Math["max"](1, Math["round"](toPositiveNumber(v14, v15)));
}
export function resolveCollageSizeByShortSide({
  width: v16,
  height: v17,
  shortSide: shortSide = COLLAGE_EXPANDED_SHORT_SIDE,
} = {}) {
  const v18 = roundDimension(shortSide, COLLAGE_EXPANDED_SHORT_SIDE),
    v19 = toPositiveNumber(v16, 0),
    v20 = toPositiveNumber(v17, 0);
  if (!(v19 > 0 && v20 > 0)) return { width: v18, height: v18 };
  const v21 = v19 / v20;
  if (!Number["isFinite"](v21) || v21 <= 0) return { width: v18, height: v18 };
  if (v21 >= 1) return { width: roundDimension(v18 * v21, v18), height: v18 };
  return { width: v18, height: roundDimension(v18 / v21, v18) };
}
export function resolveCollagePresetSizeBySlotShortSide(
  v22,
  {
    aspectRatio: aspectRatio = "",
    slotShortSide: slotShortSide = COLLAGE_SLOT_SHORT_SIDE,
  } = {},
) {
  const v23 = v22 && typeof v22 === "object" ? v22 : {},
    v24 = toPositiveNumber(v23["width"], COLLAGE_DEFAULT_SIZE["width"]),
    v25 = toPositiveNumber(v23["height"], COLLAGE_DEFAULT_SIZE["height"]),
    v26 = getCollageAspectRatioOption(aspectRatio),
    v27 = v26?.["w"] || v24,
    v28 = v26?.["h"] || v25,
    v29 = v28 / v27,
    v30 = roundDimension(slotShortSide, COLLAGE_SLOT_SHORT_SIDE),
    v31 = Array["isArray"](v23["slots"]) ? v23["slots"] : [];
  let v32 = Infinity;
  for (const v33 of v31) {
    const v34 = toPositiveNumber(v33?.["width"], 0) / v24,
      v35 = (toPositiveNumber(v33?.["height"], 0) / v25) * v29,
      v36 = Math["min"](v34, v35);
    Number["isFinite"](v36) && v36 > 0 && (v32 = Math["min"](v32, v36));
  }
  (!Number["isFinite"](v32) || v32 <= 0) && (v32 = Math["min"](1, v29));
  const v37 = v30 / v32,
    v38 = v37 * v29;
  return {
    width: roundDimension(v37, COLLAGE_DEFAULT_SIZE["width"]),
    height: roundDimension(v38, COLLAGE_DEFAULT_SIZE["height"]),
  };
}
function normalizeMediaUrl(v39) {
  const v40 = trimString(v39);
  if (!v40) return "";
  if (/^(https?:|blob:|data:)/i["test"](v40)) return v40;
  const v41 = localPathToUrl(v40);
  return v41 || "";
}
function pickMediaUrl(...v42) {
  for (const v43 of v42) {
    const v44 = normalizeMediaUrl(v43);
    if (v44) return v44;
  }
  return "";
}
function pickLocalPath(...v45) {
  for (const v46 of v45) {
    const v47 = normalizeLocalPath(v46);
    if (v47) return v47;
  }
  return "";
}
export function resolveCollageItemPreviewUrl(v48) {
  return pickMediaUrl(
    v48?.["url"],
    v48?.["localPath"],
    v48?.["thumbLocalPath"],
    v48?.["sourceUrl"],
    v48?.["sourceLocalPath"],
  );
}
export function resolveCollageItemSourceImage(v49) {
  const v50 = pickLocalPath(v49?.["sourceLocalPath"]),
    v51 = normalizeMediaUrl(v49?.["sourceUrl"]),
    v52 = toPositiveNumber(v49?.["sourceWidth"], 0),
    v53 = toPositiveNumber(v49?.["sourceHeight"], 0),
    v54 = toPositiveNumber(v49?.["imageWidth"], 0),
    v55 = toPositiveNumber(v49?.["imageHeight"], 0),
    v56 = v52 || v54,
    v57 = v53 || v55,
    v58 = v56 > 0 && v57 > 0,
    v59 = !!(v50 || v51);
  if (v59)
    return {
      src: v51 || normalizeMediaUrl(v50),
      localPath: v50 || pickLocalPath(v51),
      width: v56 || toPositiveNumber(v49?.["width"], 0),
      height: v57 || toPositiveNumber(v49?.["height"], 0),
      hasIntrinsicSize: v58,
      isOriginalSource: true,
    };
  const v60 = pickLocalPath(
    v49?.["localPath"],
    v49?.["url"],
    v49?.["thumbLocalPath"],
  );
  return {
    src: pickMediaUrl(
      v49?.["url"],
      v49?.["localPath"],
      v49?.["thumbLocalPath"],
    ),
    localPath: v60,
    width: v54 || toPositiveNumber(v49?.["width"], 0),
    height: v55 || toPositiveNumber(v49?.["height"], 0),
    hasIntrinsicSize: v54 > 0 && v55 > 0,
    isOriginalSource: false,
  };
}
function pickMainImageItem(v61, v62) {
  if (!Array["isArray"](v61) || v61["length"] === 0) return null;
  const v63 = Number(v62),
    v64 = Number["isFinite"](v63) ? Math["max"](0, Math["trunc"](v63)) : 0;
  return v61[v64] || v61[0] || null;
}
export function getCollageLayoutPreset(v65) {
  const v66 = trimString(v65) || "freeform";
  return (
    COLLAGE_LAYOUT_PRESETS["find"]((v67) => v67["id"] === v66) ||
    COLLAGE_LAYOUT_PRESETS[0]
  );
}
export function getCollageExportResolution(v68) {
  const v69 = roundDimension(v68, 2048);
  return (
    COLLAGE_EXPORT_RESOLUTIONS["find"]((v70) => v70["longSide"] === v69) ||
    COLLAGE_EXPORT_RESOLUTIONS[1]
  );
}
export function getCollageAspectRatioOption(v71) {
  const v72 = parseRatioLabel(v71);
  if (!v72) return null;
  return (
    COLLAGE_ASPECT_RATIO_OPTIONS["find"](
      (v73) => v73["label"] === v72["label"],
    ) || null
  );
}
export function getCollageBackgroundOption(v74) {
  const v75 = trimString(v74),
    v76 = v75 || COLLAGE_BACKGROUND_DEFAULT;
  return (
    COLLAGE_BACKGROUND_OPTIONS["find"](
      (v77) => v77["id"] === v76 || v77["value"] === v76,
    ) ||
    COLLAGE_BACKGROUND_OPTIONS["find"](
      (v78) => v78["value"] === COLLAGE_BACKGROUND_DEFAULT,
    )
  );
}
export function normalizeCollageBackgroundColor(v79) {
  return getCollageBackgroundOption(v79)["value"];
}
export function isCollageBackgroundTransparent(v80) {
  return getCollageBackgroundOption(v80)["id"] === "transparent";
}
export function normalizeCollageStyleValue(v81, v82 = 0) {
  const v83 = Number(v81);
  if (!Number["isFinite"](v83)) return v82;
  return Math["min"](100, Math["max"](0, Math["round"](v83)));
}
export function normalizeCollageImageScale(
  v84,
  v85 = COLLAGE_IMAGE_SCALE_DEFAULT,
) {
  const v86 = Number(v84),
    v87 = Number["isFinite"](Number(v85))
      ? Number(v85)
      : COLLAGE_IMAGE_SCALE_DEFAULT,
    v88 = Number["isFinite"](v86) ? v86 : v87,
    v89 = Math["min"](
      COLLAGE_IMAGE_SCALE_MAX,
      Math["max"](COLLAGE_IMAGE_SCALE_MIN, v88),
    );
  return Math["round"](v89 * 100) / 100;
}
export function getCollageLayoutStyle(v90) {
  return {
    outerPadding: normalizeCollageStyleValue(
      v90?.["outerPadding"],
      COLLAGE_LAYOUT_STYLE_DEFAULTS["outerPadding"],
    ),
    gap: normalizeCollageStyleValue(
      v90?.["gap"],
      COLLAGE_LAYOUT_STYLE_DEFAULTS["gap"],
    ),
    cornerRadius: normalizeCollageStyleValue(
      v90?.["cornerRadius"],
      COLLAGE_LAYOUT_STYLE_DEFAULTS["cornerRadius"],
    ),
  };
}
export function isCollageItemEmpty(v91) {
  return !(
    trimString(v91?.["url"]) ||
    trimString(v91?.["localPath"]) ||
    trimString(v91?.["thumbLocalPath"]) ||
    trimString(v91?.["sourceUrl"]) ||
    trimString(v91?.["sourceLocalPath"])
  );
}
export function normalizeEmptyCollageItem(v92 = {}, v93 = 0) {
  return {
    id: trimString(v92?.["id"]) || "collage-slot-" + v93,
    slotIndex: Number["isFinite"](Number(v92?.["slotIndex"]))
      ? Number(v92["slotIndex"])
      : v93,
    isEmpty: true,
    x: Number(v92?.["x"]) || 0,
    y: Number(v92?.["y"]) || 0,
    width: toPositiveNumber(v92?.["width"], 1),
    height: toPositiveNumber(v92?.["height"], 1),
    fit: trimString(v92?.["fit"]) || "cover",
    focusX: 0.5,
    focusY: 0.5,
    imageScale: COLLAGE_IMAGE_SCALE_DEFAULT,
    sourceNodeId: "",
    url: "",
    localPath: "",
    thumbLocalPath: "",
    sourceLocalPath: "",
    sourceUrl: "",
    sourceDisplayWidth: null,
    sourceDisplayHeight: null,
    label: "",
  };
}
function resolveSlotInset(v94, v95) {
  const v96 = Math["min"](
    normalizeCollageStyleValue(v95, 0),
    Math["max"](0, v94["width"] * 0.45),
    Math["max"](0, v94["height"] * 0.45),
  );
  return v96 / 2;
}
export function resolveCollageItemFrames(v97) {
  const v98 = toPositiveNumber(v97?.["width"], COLLAGE_DEFAULT_SIZE["width"]),
    v99 = toPositiveNumber(v97?.["height"], COLLAGE_DEFAULT_SIZE["height"]),
    {
      outerPadding: v100,
      gap: v101,
      cornerRadius: v102,
    } = getCollageLayoutStyle(v97),
    v103 = Math["min"](
      v100,
      Math["max"](0, v98 * 0.45),
      Math["max"](0, v99 * 0.45),
    ),
    v104 = Math["max"](1, v98 - v103 * 2),
    v105 = Math["max"](1, v99 - v103 * 2),
    v106 = v104 / v98,
    v107 = v105 / v99,
    v108 = Array["isArray"](v97?.["items"]) ? v97["items"] : [];
  return v108["map"]((v109, v110) => {
    const v111 = {
        x: v103 + (Number(v109?.["x"]) || 0) * v106,
        y: v103 + (Number(v109?.["y"]) || 0) * v107,
        width: toPositiveNumber(v109?.["width"], 1) * v106,
        height: toPositiveNumber(v109?.["height"], 1) * v107,
      },
      v112 = resolveSlotInset(v111, v101),
      v113 = {
        x: v111["x"] + v112,
        y: v111["y"] + v112,
        width: Math["max"](1, v111["width"] - v112 * 2),
        height: Math["max"](1, v111["height"] - v112 * 2),
      };
    return {
      item: v109,
      index: v110,
      frame: v113,
      style: { outerPadding: v103, gap: v101, cornerRadius: v102 },
      isEmpty: isCollageItemEmpty(v109),
    };
  });
}
export function getCollageItemIndexAtWorldPoint(v114, v115, v116) {
  if (!v114 || v114["type"] !== COLLAGE_NODE_TYPE) return -1;
  const v117 = Number(v115) - (Number(v114["x"]) || 0),
    v118 = Number(v116) - (Number(v114["y"]) || 0);
  if (!Number["isFinite"](v117) || !Number["isFinite"](v118)) return -1;
  const v119 = resolveCollageItemFrames(v114);
  for (let v120 = v119["length"] - 1; v120 >= 0; v120 -= 1) {
    const { frame: v121 } = v119[v120];
    if (
      v117 >= v121["x"] &&
      v117 <= v121["x"] + v121["width"] &&
      v118 >= v121["y"] &&
      v118 <= v121["y"] + v121["height"]
    )
      return v119[v120]["index"];
  }
  return -1;
}
function getCollageSlotGeometry(v122, v123) {
  const v124 = getRawCollageItemFrame(v122);
  return {
    slotIndex: v123,
    x: v124["x"],
    y: v124["y"],
    width: v124["width"],
    height: v124["height"],
    freeformX: Number["isFinite"](Number(v122?.["freeformX"]))
      ? Number(v122["freeformX"])
      : v124["x"],
    freeformY: Number["isFinite"](Number(v122?.["freeformY"]))
      ? Number(v122["freeformY"])
      : v124["y"],
    freeformWidth: toPositiveNumber(v122?.["freeformWidth"], v124["width"]),
    freeformHeight: toPositiveNumber(v122?.["freeformHeight"], v124["height"]),
  };
}
function createEmptyCollageSlotFromGeometry(v125, v126) {
  return {
    ...normalizeEmptyCollageItem({ ...v125, id: "collage-slot-" + v126 }, v126),
    freeformX: v125["freeformX"],
    freeformY: v125["freeformY"],
    freeformWidth: v125["freeformWidth"],
    freeformHeight: v125["freeformHeight"],
  };
}
function placeCollageItemIntoSlot(v127, v128, v129) {
  return {
    ...v127,
    slotIndex: v129,
    isEmpty: false,
    x: v128["x"],
    y: v128["y"],
    width: v128["width"],
    height: v128["height"],
    freeformX: v128["freeformX"],
    freeformY: v128["freeformY"],
    freeformWidth: v128["freeformWidth"],
    freeformHeight: v128["freeformHeight"],
  };
}
export function buildCollageItemSwapPatch(v130, v131, v132) {
  const v133 = (Array["isArray"](v130?.["items"]) ? v130["items"] : [])["map"](
      (v134) => ({ ...v134 }),
    ),
    v135 = v133[v131],
    v136 = v133[v132];
  if (!v135 || !v136 || v131 === v132 || isCollageItemEmpty(v135)) return null;
  const v137 = getCollageSlotGeometry(v135, v131),
    v138 = getCollageSlotGeometry(v136, v132);
  return (
    (v133[v132] = placeCollageItemIntoSlot(v135, v138, v132)),
    (v133[v131] = isCollageItemEmpty(v136)
      ? createEmptyCollageSlotFromGeometry(v137, v131)
      : placeCollageItemIntoSlot(v136, v137, v131)),
    { items: v133 }
  );
}
function roundCollageGeometryValue(v139) {
  return Math["round"]((Number(v139) || 0) * 100) / 100;
}
function getRawCollageItemFrame(v140) {
  return {
    x: Number(v140?.["x"]) || 0,
    y: Number(v140?.["y"]) || 0,
    width: toPositiveNumber(v140?.["width"], 1),
    height: toPositiveNumber(v140?.["height"], 1),
  };
}
function getCollageDividerMinSize(v141) {
  const v142 = toPositiveNumber(v141, 1);
  return Math["min"](
    COLLAGE_DIVIDER_MAX_MIN_SIZE,
    Math["max"](
      COLLAGE_DIVIDER_MIN_SIZE,
      v142 * COLLAGE_DIVIDER_MIN_SIZE_RATIO,
    ),
    v142 * 0.45,
  );
}
function collectCollageDividerBoundary(v143, v144, v145, v146) {
  const v147 = 0.5,
    v148 = [],
    v149 = [],
    v150 = [],
    v151 = v144 === "x",
    v152 = v151 ? "y" : "x",
    v153 = v151 ? "height" : "width",
    v154 = v151 ? "x" : "y",
    v155 = v151 ? "width" : "height";
  if (v145 <= v147 || v145 >= v146 - v147) return null;
  v143["forEach"]((v156, v157) => {
    const v158 = getRawCollageItemFrame(v156),
      v159 = v158[v154],
      v160 = v159 + v158[v155];
    if (Math["abs"](v160 - v145) <= v147) v148["push"](v157);
    if (Math["abs"](v159 - v145) <= v147) v149["push"](v157);
  });
  if (v148["length"] === 0 || v149["length"] === 0) return null;
  for (const v161 of v148) {
    const v162 = getRawCollageItemFrame(v143[v161]);
    for (const v163 of v149) {
      const v164 = getRawCollageItemFrame(v143[v163]),
        v165 = Math["max"](v162[v152], v164[v152]),
        v166 = Math["min"](v162[v152] + v162[v153], v164[v152] + v164[v153]);
      v166 - v165 > 1 && v150["push"]({ start: v165, end: v166 });
    }
  }
  if (v150["length"] === 0) return null;
  const v167 = Math["min"](...v150["map"]((v168) => v168["start"])),
    v169 = Math["max"](...v150["map"]((v170) => v170["end"])),
    v171 = roundCollageGeometryValue(v145);
  return {
    id: v144 + "-" + v171,
    axis: v144,
    position: v171,
    spanStart: roundCollageGeometryValue(v167),
    spanEnd: roundCollageGeometryValue(v169),
    beforeIndexes: Array["from"](new Set(v148)),
    afterIndexes: Array["from"](new Set(v149)),
  };
}
function rawFrameRangesOverlap(v172, v173, v174, v175) {
  const v176 = Math["max"](v172[v174], v173[v174]),
    v177 = Math["min"](v172[v174] + v172[v175], v173[v174] + v173[v175]);
  return v177 - v176 > 1;
}
function collectCollageAxisDividers(v178, v179, v180) {
  const v181 = 0.5,
    v182 = v179 === "x",
    v183 = v182 ? "x" : "y",
    v184 = v182 ? "width" : "height",
    v185 = v182 ? "y" : "x",
    v186 = v182 ? "height" : "width",
    v187 = new Map();
  return (
    v178["forEach"]((v188, v189) => {
      const v190 = getRawCollageItemFrame(v188),
        v191 = v190[v183];
      if (v191 <= v181 || v191 >= v180 - v181) return;
      let v192 = -Infinity,
        v193 = [];
      v178["forEach"]((v194, v195) => {
        if (v195 === v189) return;
        const v196 = getRawCollageItemFrame(v194),
          v197 = v196[v183] + v196[v184];
        if (v197 > v191 + v181) return;
        if (!rawFrameRangesOverlap(v196, v190, v185, v186)) return;
        if (v197 > v192 + v181) ((v192 = v197), (v193 = [v195]));
        else Math["abs"](v197 - v192) <= v181 && v193["push"](v195);
      });
      if (v193["length"] === 0) return;
      const v198 = v179 + "-" + roundCollageGeometryValue(v191),
        v199 = v187["get"](v198) || {
          id: v198,
          axis: v179,
          position: roundCollageGeometryValue(v191),
          spanStart: Infinity,
          spanEnd: -Infinity,
          beforeIndexes: new Set(),
          afterIndexes: new Set(),
        };
      v199["afterIndexes"]["add"](v189);
      for (const v200 of v193) {
        v199["beforeIndexes"]["add"](v200);
        const v201 = getRawCollageItemFrame(v178[v200]);
        ((v199["spanStart"] = Math["min"](
          v199["spanStart"],
          Math["max"](v201[v185], v190[v185]),
        )),
          (v199["spanEnd"] = Math["max"](
            v199["spanEnd"],
            Math["min"](v201[v185] + v201[v186], v190[v185] + v190[v186]),
          )));
      }
      v187["set"](v198, v199);
    }),
    Array["from"](v187["values"]())
      ["filter"]((v202) => v202["spanEnd"] - v202["spanStart"] > 1)
      ["map"]((v203) => ({
        ...v203,
        spanStart: roundCollageGeometryValue(v203["spanStart"]),
        spanEnd: roundCollageGeometryValue(v203["spanEnd"]),
        beforeIndexes: Array["from"](v203["beforeIndexes"]),
        afterIndexes: Array["from"](v203["afterIndexes"]),
      }))
  );
}
export function resolveCollageEditableDividers(v204) {
  const v205 = toPositiveNumber(v204?.["width"], COLLAGE_DEFAULT_SIZE["width"]),
    v206 = toPositiveNumber(v204?.["height"], COLLAGE_DEFAULT_SIZE["height"]),
    v207 = Array["isArray"](v204?.["items"]) ? v204["items"] : [],
    v208 = [
      ...collectCollageAxisDividers(v207, "x", v205),
      ...collectCollageAxisDividers(v207, "y", v206),
    ];
  return v208["sort"]((v209, v210) =>
    v209["axis"] === v210["axis"]
      ? v209["position"] - v210["position"]
      : v209["axis"]["localeCompare"](v210["axis"]),
  );
}
export function buildCollageDividerDragPatch(v211, v212, v213) {
  const v214 = v212?.["axis"] === "y" ? "y" : "x",
    v215 = v214 === "x" ? "width" : "height",
    v216 = v214 === "x" ? "x" : "y",
    v217 = toPositiveNumber(
      v214 === "x" ? v211?.["width"] : v211?.["height"],
      v214 === "x"
        ? COLLAGE_DEFAULT_SIZE["width"]
        : COLLAGE_DEFAULT_SIZE["height"],
    ),
    v218 = (Array["isArray"](v211?.["items"]) ? v211["items"] : [])["map"](
      (v219) => ({ ...v219 }),
    ),
    v220 = Array["isArray"](v212?.["beforeIndexes"])
      ? v212["beforeIndexes"]
      : [],
    v221 = Array["isArray"](v212?.["afterIndexes"]) ? v212["afterIndexes"] : [];
  if (v220["length"] === 0 || v221["length"] === 0)
    return { items: v218, delta: 0 };
  const v222 = new Set(v220),
    v223 = new Set(v221),
    v224 = new Set([...v222, ...v223]),
    v225 = Number(v212?.["position"]) || 0,
    v226 = getCollageDividerMinSize(v217);
  let v227 = -Infinity,
    v228 = Infinity;
  for (const v229 of v222) {
    const v230 = v218[v229];
    if (!v230) continue;
    const v231 = getRawCollageItemFrame(v230);
    ((v227 = Math["max"](v227, v226 - v231[v215])),
      (v228 = Math["min"](v228, v217 - (v231[v216] + v231[v215]))));
  }
  for (const v232 of v223) {
    const v233 = v218[v232];
    if (!v233) continue;
    const v234 = getRawCollageItemFrame(v233);
    ((v227 = Math["max"](v227, -v234[v216])),
      (v228 = Math["min"](v228, v234[v215] - v226)));
  }
  const v235 = Math["min"](v228, Math["max"](v227, Number(v213) || 0));
  for (const v236 of v222) {
    const v237 = v218[v236];
    if (!v237) continue;
    const v238 = getRawCollageItemFrame(v237);
    v218[v236] = {
      ...v237,
      [v215]: roundCollageGeometryValue(v238[v215] + v235),
    };
  }
  for (const v239 of v223) {
    const v240 = v218[v239];
    if (!v240) continue;
    const v241 = getRawCollageItemFrame(v240);
    v218[v239] = {
      ...v240,
      [v216]: roundCollageGeometryValue(v241[v216] + v235),
      [v215]: roundCollageGeometryValue(v241[v215] - v235),
    };
  }
  return {
    items: v218,
    delta: roundCollageGeometryValue(v235),
    moveIndexes: Array["from"](v224),
  };
}
export function resolveCollageNodeImage(v242) {
  if (!v242 || typeof v242 !== "object")
    return { url: "", localPath: "", label: "" };
  const v243 = trimString(v242["type"]);
  let v244 = "",
    v245 = "",
    v246 = "",
    v247 = "",
    v248 = "",
    v249 = 0,
    v250 = 0,
    v251 = 0,
    v252 = 0;
  if (v243 === "source-image")
    ((v244 = pickMediaUrl(
      v242["displayLocalPath"],
      v242["localPath"],
      v242["originalLocalPath"],
      v242["src"],
      v242["sourceUrl"],
      v242["imageUrl"],
      v242["thumbLocalPath"],
      v242["thumbUrl"],
    )),
      (v245 = pickLocalPath(
        v242["displayLocalPath"],
        v242["localPath"],
        v242["originalLocalPath"],
        v242["src"],
        v242["sourceUrl"],
        v242["imageUrl"],
        v242["thumbLocalPath"],
        v242["thumbUrl"],
      )),
      (v246 = pickLocalPath(v242["thumbLocalPath"], v242["thumbUrl"])),
      (v247 = pickLocalPath(v242["sourceLocalPath"])),
      (v248 = normalizeMediaUrl(v242["sourceUrl"])),
      (v249 = toPositiveNumber(v242["sourceWidth"], 0)),
      (v250 = toPositiveNumber(v242["sourceHeight"], 0)),
      (v251 = toPositiveNumber(v242["imageWidth"], 0)),
      (v252 = toPositiveNumber(v242["imageHeight"], 0)));
  else {
    if (v243 === "ai-image") {
      const v253 = pickMainImageItem(v242["images"], v242["mainImageIndex"]);
      ((v244 = pickMediaUrl(
        v253?.["displayLocalPath"],
        v253?.["localPath"],
        v253?.["originalLocalPath"],
        v253?.["sourceUrl"],
        v253?.["imageUrl"],
        v253?.["url"],
        v253?.["thumbLocalPath"],
        v253?.["thumbUrl"],
        v242["displayLocalPath"],
        v242["localPath"],
        v242["originalLocalPath"],
        v242["sourceUrl"],
        v242["imageUrl"],
        v242["src"],
        v242["thumbLocalPath"],
        v242["thumbUrl"],
      )),
        (v245 = pickLocalPath(
          v253?.["displayLocalPath"],
          v253?.["localPath"],
          v253?.["originalLocalPath"],
          v253?.["sourceUrl"],
          v253?.["imageUrl"],
          v253?.["url"],
          v253?.["thumbLocalPath"],
          v253?.["thumbUrl"],
          v242["displayLocalPath"],
          v242["localPath"],
          v242["originalLocalPath"],
          v242["sourceUrl"],
          v242["imageUrl"],
          v242["src"],
          v242["thumbLocalPath"],
          v242["thumbUrl"],
        )),
        (v246 = pickLocalPath(
          v253?.["thumbLocalPath"],
          v253?.["thumbUrl"],
          v242["thumbLocalPath"],
          v242["thumbUrl"],
        )),
        (v247 = pickLocalPath(
          v253?.["sourceLocalPath"],
          v242["sourceLocalPath"],
        )),
        (v248 = normalizeMediaUrl(v253?.["sourceUrl"] || v242["sourceUrl"])),
        (v249 =
          toPositiveNumber(v253?.["sourceWidth"], 0) ||
          toPositiveNumber(v242["sourceWidth"], 0)),
        (v250 =
          toPositiveNumber(v253?.["sourceHeight"], 0) ||
          toPositiveNumber(v242["sourceHeight"], 0)),
        (v251 =
          toPositiveNumber(v253?.["imageWidth"] || v253?.["width"], 0) ||
          toPositiveNumber(v242["imageWidth"] || v242["width"], 0)),
        (v252 =
          toPositiveNumber(v253?.["imageHeight"] || v253?.["height"], 0) ||
          toPositiveNumber(v242["imageHeight"] || v242["height"], 0)));
    } else {
      if (v243 === "storyboard") {
        const v254 = Array["isArray"](v242["cells"]) ? v242["cells"] : [],
          v255 = v254["find"](
            (v256) =>
              resolveStoryboardCellAssetSrc(v256) ||
              resolveStoryboardCellPreviewSrc(v256),
          ),
          v257 =
            resolveStoryboardCellAssetSrc(v255) ||
            resolveStoryboardCellPreviewSrc(v255);
        ((v244 = pickMediaUrl(
          v257,
          v242["localPath"],
          v242["sourceUrl"],
          v242["imageUrl"],
          v242["src"],
        )),
          (v245 = pickLocalPath(
            v255?.["localPath"],
            v255?.["displayLocalPath"],
            v255?.["originalLocalPath"],
            v257,
            v242["localPath"],
            v242["sourceUrl"],
            v242["imageUrl"],
            v242["src"],
          )),
          (v246 = pickLocalPath(
            v255?.["thumbLocalPath"],
            v242["thumbLocalPath"],
          )),
          (v247 = pickLocalPath(
            v255?.["sourceLocalPath"],
            v242["sourceLocalPath"],
          )),
          (v248 = normalizeMediaUrl(v255?.["sourceUrl"] || v242["sourceUrl"])),
          (v249 =
            toPositiveNumber(v255?.["sourceWidth"], 0) ||
            toPositiveNumber(v242["sourceWidth"], 0)),
          (v250 =
            toPositiveNumber(v255?.["sourceHeight"], 0) ||
            toPositiveNumber(v242["sourceHeight"], 0)),
          (v251 =
            toPositiveNumber(v255?.["imageWidth"], 0) ||
            toPositiveNumber(v242["imageWidth"], 0)),
          (v252 =
            toPositiveNumber(v255?.["imageHeight"], 0) ||
            toPositiveNumber(v242["imageHeight"], 0)));
      }
    }
  }
  return {
    url: v244,
    localPath: v245,
    thumbLocalPath: v246,
    sourceLocalPath: v247,
    sourceUrl: v248,
    sourceWidth: v249,
    sourceHeight: v250,
    imageWidth: v251,
    imageHeight: v252,
    label: trimString(v242["name"]) || trimString(v242["fileName"]) || "",
  };
}
export function isCollageImageNode(v258) {
  return !!resolveCollageNodeImage(v258)["url"];
}
export function computeCollageBounds(v259) {
  if (!Array["isArray"](v259) || v259["length"] === 0) return null;
  let v260 = Infinity,
    v261 = Infinity,
    v262 = -Infinity,
    v263 = -Infinity;
  for (const v264 of v259) {
    if (!v264 || typeof v264 !== "object") continue;
    const v265 = Number(v264["x"]),
      v266 = Number(v264["y"]),
      v267 = toPositiveNumber(v264["width"], 0),
      v268 = toPositiveNumber(v264["height"], 0);
    if (
      !Number["isFinite"](v265) ||
      !Number["isFinite"](v266) ||
      v267 <= 0 ||
      v268 <= 0
    )
      continue;
    ((v260 = Math["min"](v260, v265)),
      (v261 = Math["min"](v261, v266)),
      (v262 = Math["max"](v262, v265 + v267)),
      (v263 = Math["max"](v263, v266 + v268)));
  }
  if (!Number["isFinite"](v260) || !Number["isFinite"](v261)) return null;
  return {
    x: v260,
    y: v261,
    width: Math["max"](1, v262 - v260),
    height: Math["max"](1, v263 - v261),
  };
}
export function buildCollageItemsFromNodes(v269, v270, v271 = null) {
  const v272 = v270 || computeCollageBounds(v269);
  if (!v272) return [];
  const v273 = toPositiveNumber(v271?.["width"], v272["width"]),
    v274 = toPositiveNumber(v271?.["height"], v272["height"]),
    v275 = v273 / v272["width"],
    v276 = v274 / v272["height"];
  return (Array["isArray"](v269) ? v269 : [])
    ["map"]((v277, v278) => {
      const v279 = resolveCollageNodeImage(v277);
      if (!v279["url"]) return null;
      const v280 = Number(v277["x"]) || 0,
        v281 = Number(v277["y"]) || 0,
        v282 = toPositiveNumber(v277["width"], 1),
        v283 = toPositiveNumber(v277["height"], 1),
        v284 = {
          id: "item-" + (trimString(v277["id"]) || v278),
          sourceNodeId: trimString(v277["id"]),
          url: v279["url"],
          localPath: v279["localPath"],
          thumbLocalPath: v279["thumbLocalPath"],
          sourceLocalPath: v279["sourceLocalPath"],
          sourceUrl: v279["sourceUrl"],
          sourceWidth: v279["sourceWidth"] || null,
          sourceHeight: v279["sourceHeight"] || null,
          imageWidth: v279["imageWidth"] || null,
          imageHeight: v279["imageHeight"] || null,
          sourceDisplayWidth: v282,
          sourceDisplayHeight: v283,
          label: v279["label"],
          x: roundCollageGeometryValue((v280 - v272["x"]) * v275),
          y: roundCollageGeometryValue((v281 - v272["y"]) * v276),
          width: roundCollageGeometryValue(v282 * v275),
          height: roundCollageGeometryValue(v283 * v276),
          fit: "cover",
          focusX: 0.5,
          focusY: 0.5,
        };
      return {
        ...v284,
        freeformX: v284["x"],
        freeformY: v284["y"],
        freeformWidth: v284["width"],
        freeformHeight: v284["height"],
      };
    })
    ["filter"](Boolean);
}
function createCollageBaseNodeData({
  id: v285,
  x: x = 0,
  y: y = 0,
  width: width = COLLAGE_DEFAULT_SIZE["width"],
  height: height = COLLAGE_DEFAULT_SIZE["height"],
  name: name = "拼图",
} = {}) {
  return {
    id: v285,
    type: COLLAGE_NODE_TYPE,
    schemaVersion: COLLAGE_SCHEMA_VERSION,
    name: name,
    x: x,
    y: y,
    width: roundDimension(width, COLLAGE_DEFAULT_SIZE["width"]),
    height: roundDimension(height, COLLAGE_DEFAULT_SIZE["height"]),
    aspectRatio: "",
    layoutPresetId: "freeform",
    exportLongSide: 2048,
    backgroundColor: COLLAGE_BACKGROUND_DEFAULT,
    outerPadding: COLLAGE_LAYOUT_STYLE_DEFAULTS["outerPadding"],
    gap: COLLAGE_LAYOUT_STYLE_DEFAULTS["gap"],
    cornerRadius: COLLAGE_LAYOUT_STYLE_DEFAULTS["cornerRadius"],
    items: [],
  };
}
export function createEmptyCollageNodeData(v286 = {}) {
  const v287 = {
    ...createCollageBaseNodeData(v286),
    aspectRatio: COLLAGE_INITIAL_ASPECT_RATIO,
    layoutPresetId: COLLAGE_INITIAL_LAYOUT_PRESET_ID,
  };
  return {
    ...v287,
    ...buildCollageLayoutPatch(v287, COLLAGE_INITIAL_LAYOUT_PRESET_ID),
  };
}
export function buildCollageNodeDataFromSelection({
  id: v288,
  nodes: v289,
  name: name = "拼图",
} = {}) {
  const v290 = (Array["isArray"](v289) ? v289 : [])["filter"](
      isCollageImageNode,
    ),
    v291 = computeCollageBounds(v290);
  if (!v291) return null;
  return {
    ...createCollageBaseNodeData({
      id: v288,
      name: name,
      x: v291["x"],
      y: v291["y"],
      width: v291["width"],
      height: v291["height"],
    }),
    aspectRatio: "",
    layoutPresetId: "freeform",
    sourceBounds: { width: v291["width"], height: v291["height"] },
    items: buildCollageItemsFromNodes(v290, v291),
  };
}
function cloneFreeformItem(v292) {
  const v293 = Number["isFinite"](Number(v292["freeformX"]))
      ? Number(v292["freeformX"])
      : Number(v292["x"]) || 0,
    v294 = Number["isFinite"](Number(v292["freeformY"]))
      ? Number(v292["freeformY"])
      : Number(v292["y"]) || 0,
    v295 = toPositiveNumber(v292["freeformWidth"], v292["width"] || 1),
    v296 = toPositiveNumber(v292["freeformHeight"], v292["height"] || 1);
  return {
    ...v292,
    x: v293,
    y: v294,
    width: v295,
    height: v296,
    freeformX: v293,
    freeformY: v294,
    freeformWidth: v295,
    freeformHeight: v296,
  };
}
function getFreeformSize(v297) {
  const v298 = toPositiveNumber(v297?.["sourceBounds"]?.["width"], 0),
    v299 = toPositiveNumber(v297?.["sourceBounds"]?.["height"], 0);
  return {
    width: roundDimension(
      v298 || v297?.["width"],
      COLLAGE_DEFAULT_SIZE["width"],
    ),
    height: roundDimension(
      v299 || v297?.["height"],
      COLLAGE_DEFAULT_SIZE["height"],
    ),
  };
}
function buildLayoutSlotItem({
  item: v300,
  preset: v301,
  slotIndex: v302,
  slotBounds: v303,
  scaleX: v304,
  scaleY: v305,
}) {
  const v306 = v300 && !isCollageItemEmpty(v300);
  return {
    ...(v306 ? v300 : {}),
    id: trimString(v300?.["id"]) || v301["id"] + "-slot-" + v302,
    sourceNodeId: trimString(v300?.["sourceNodeId"]),
    url: trimString(v300?.["url"]),
    localPath: trimString(v300?.["localPath"]),
    label: trimString(v300?.["label"]),
    fit: trimString(v300?.["fit"]) || "cover",
    focusX: Number["isFinite"](Number(v300?.["focusX"]))
      ? Number(v300["focusX"])
      : 0.5,
    focusY: Number["isFinite"](Number(v300?.["focusY"]))
      ? Number(v300["focusY"])
      : 0.5,
    imageScale: normalizeCollageImageScale(v300?.["imageScale"]),
    slotIndex: v302,
    isEmpty: !v306,
    x: v303["x"] * v304,
    y: v303["y"] * v305,
    width: v303["width"] * v304,
    height: v303["height"] * v305,
  };
}
function scaleCollageItemGeometry(v307, v308, v309, v310) {
  const v311 = {
    ...v307,
    x: (Number(v307?.["x"]) || 0) * v308,
    y: (Number(v307?.["y"]) || 0) * v309,
    width: toPositiveNumber(v307?.["width"], 1) * v308,
    height: toPositiveNumber(v307?.["height"], 1) * v309,
  };
  if (!v310) return v311;
  return {
    ...v311,
    freeformX: (Number(v307?.["freeformX"]) || 0) * v308,
    freeformY: (Number(v307?.["freeformY"]) || 0) * v309,
    freeformWidth:
      toPositiveNumber(v307?.["freeformWidth"], v307?.["width"] || 1) * v308,
    freeformHeight:
      toPositiveNumber(v307?.["freeformHeight"], v307?.["height"] || 1) * v309,
  };
}
function getCollageCurrentSize(v312) {
  return {
    width: roundDimension(v312?.["width"], COLLAGE_DEFAULT_SIZE["width"]),
    height: roundDimension(v312?.["height"], COLLAGE_DEFAULT_SIZE["height"]),
  };
}
function getCollageCurrentShortSide(v313) {
  const v314 = getCollageCurrentSize(v313);
  return Math["max"](1, Math["min"](v314["width"], v314["height"]));
}
function buildCollageResizePatch(
  v315,
  v316,
  { includeFreeform: includeFreeform = false } = {},
) {
  const v317 = getCollageCurrentSize(v315),
    v318 = {
      width: roundDimension(v316?.["width"], v317["width"]),
      height: roundDimension(v316?.["height"], v317["height"]),
    },
    v319 = v318["width"] / v317["width"],
    v320 = v318["height"] / v317["height"],
    v321 = Array["isArray"](v315?.["items"]) ? v315["items"] : [];
  return {
    width: v318["width"],
    height: v318["height"],
    items: v321["map"]((v322) =>
      scaleCollageItemGeometry(v322, v319, v320, includeFreeform),
    ),
  };
}
export function buildCollageCollapsePatch(v323, v324) {
  const v325 = !!v324,
    v326 = getCollageCurrentSize(v323),
    v327 = getCollageLayoutPreset(v323?.["layoutPresetId"]),
    v328 = v327["id"] === "freeform";
  if (v325) {
    const v329 = resolveCollageSizeByShortSide({
      width: v326["width"],
      height: v326["height"],
      shortSide: COLLAGE_COLLAPSED_SHORT_SIDE,
    });
    return {
      ...buildCollageResizePatch(v323, v329, { includeFreeform: v328 }),
      isCollapsed: true,
      isEditing: false,
      _originalWidth: v326["width"],
      _originalHeight: v326["height"],
    };
  }
  const v330 =
      toPositiveNumber(v323?.["_originalWidth"], 0) > 0 &&
      toPositiveNumber(v323?.["_originalHeight"], 0) > 0,
    v331 = {
      ...(v330
        ? {
            width: roundDimension(v323?.["_originalWidth"], v326["width"]),
            height: roundDimension(v323?.["_originalHeight"], v326["height"]),
          }
        : resolveCollageSizeByShortSide({
            width: v326["width"],
            height: v326["height"],
            shortSide: COLLAGE_EXPANDED_SHORT_SIDE,
          })),
    };
  return {
    ...buildCollageResizePatch(v323, v331, { includeFreeform: v328 }),
    isCollapsed: false,
  };
}
export function buildCollageAspectRatioPatch(v332, v333) {
  const v334 =
      getCollageAspectRatioOption(v333) || COLLAGE_ASPECT_RATIO_OPTIONS[0],
    v335 = getCollageLayoutPreset(v332?.["layoutPresetId"]),
    v336 =
      v335["id"] === "freeform" || !Array["isArray"](v335["slots"])
        ? resolveCollageSizeByShortSide({
            width: v334["w"],
            height: v334["h"],
            shortSide: getCollageCurrentShortSide(v332),
          })
        : resolveCollagePresetSizeBySlotShortSide(v335, {
            aspectRatio: v334["label"],
          });
  return {
    ...buildCollageResizePatch(v332, v336, {
      includeFreeform: v335["id"] === "freeform",
    }),
    aspectRatio: v334["label"],
  };
}
export function buildCollageLayoutPatch(v337, v338) {
  const v339 = getCollageLayoutPreset(v338),
    v340 = Array["isArray"](v337?.["items"]) ? v337["items"] : [];
  if (v339["id"] === "freeform" || !Array["isArray"](v339["slots"])) {
    const v341 = getFreeformSize(v337);
    return {
      layoutPresetId: "freeform",
      aspectRatio: "",
      width: v341["width"],
      height: v341["height"],
      items: v340["map"](cloneFreeformItem),
    };
  }
  const v342 = toPositiveNumber(v339["width"], COLLAGE_DEFAULT_SIZE["width"]),
    v343 = toPositiveNumber(v339["height"], COLLAGE_DEFAULT_SIZE["height"]),
    v344 = getCollageAspectRatioOption(v337?.["aspectRatio"]),
    v345 = resolveCollagePresetSizeBySlotShortSide(v339, {
      aspectRatio: v344?.["label"] || "",
    }),
    v346 = v345["width"],
    v347 = v345["height"],
    v348 = v346 / v342,
    v349 = v347 / v343,
    v350 = v340["filter"]((v351) => !isCollageItemEmpty(v351)),
    v352 = v339["slots"]["map"]((v353, v354) =>
      buildLayoutSlotItem({
        item: v350[v354],
        preset: v339,
        slotIndex: v354,
        slotBounds: v353,
        scaleX: v348,
        scaleY: v349,
      }),
    );
  return {
    layoutPresetId: v339["id"],
    aspectRatio: v344?.["label"] || "",
    width: v346,
    height: v347,
    items: v352,
  };
}
export function resolveCollageExportSize(v355, v356) {
  const v357 = toPositiveNumber(v355?.["width"], COLLAGE_DEFAULT_SIZE["width"]),
    v358 = toPositiveNumber(v355?.["height"], COLLAGE_DEFAULT_SIZE["height"]),
    v359 = getCollageExportResolution(v356)["longSide"],
    v360 = v357 / v358;
  if (!Number["isFinite"](v360) || v360 <= 0)
    return { width: v359, height: v359 };
  if (v360 >= 1)
    return { width: v359, height: roundDimension(v359 / v360, v359) };
  return { width: roundDimension(v359 * v360, v359), height: v359 };
}
