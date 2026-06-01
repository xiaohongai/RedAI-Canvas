import { getModelManifest, getModelsByKind } from "../../manifests/index.js";
import {
  renderNodeMenuGroup,
  renderNodeMenuItem,
} from "../shared/nodeModelMenu.js";
const DREAMINA_IMAGE_ALLOWED_RATIOS = new Set([
    "21:9",
    "16:9",
    "3:2",
    "4:3",
    "1:1",
    "3:4",
    "2:3",
    "9:16",
  ]),
  DREAMINA_IMAGE_ADAPTIVE_RATIO_OPTIONS = [
    { label: "21:9", calc: 21 / 9 },
    { label: "16:9", calc: 16 / 9 },
    { label: "3:2", calc: 3 / 2 },
    { label: "4:3", calc: 4 / 3 },
    { label: "1:1", calc: 1 / 1 },
    { label: "3:4", calc: 3 / 4 },
    { label: "2:3", calc: 2 / 3 },
    { label: "9:16", calc: 9 / 16 },
  ],
  DREAMINA_IMAGE_ALLOWED_SIZES = new Set(["2K", "4K"]),
  DREAMINA_IMAGE_MENU_ICON_HTML =
    "<img\x20src=\x22images/jimeng.png\x22\x20class=\x22node-menu-icon\x22\x20alt=\x22dreamina\x22>";
function getDreaminaImageMenuMeta(v0) {
  const v1 = v0?.["extensions"]?.["imageMenu"];
  return v1 && v1["group"] === "dreamina" ? v1 : null;
}
function getDreaminaImageManifest(v2) {
  const v3 = getModelManifest(v2);
  return getDreaminaImageMenuMeta(v3) ? v3 : null;
}
export function getDreaminaImageModelMenuOptions() {
  return getModelsByKind("image")
    ["filter"]((v4) => getDreaminaImageMenuMeta(v4))
    ["sort"]((v5, v6) => {
      const v7 = getDreaminaImageMenuMeta(v5),
        v8 = getDreaminaImageMenuMeta(v6);
      return (v7?.["order"] || 0) - (v8?.["order"] || 0);
    })
    ["map"]((v9) => {
      const v10 = getDreaminaImageMenuMeta(v9);
      return {
        model: v9["modelId"],
        title: v10["title"] || v9["displayName"] || v9["modelId"],
        subtitle: v10["subtitle"] || v9["description"] || "",
        default: v10["default"] === true,
      };
    });
}
export function getDefaultDreaminaImageModelId() {
  const v11 = getDreaminaImageModelMenuOptions();
  return (
    v11["find"]((v12) => v12["default"] === true)?.["model"] ||
    v11[0]?.["model"] ||
    ""
  );
}
export const DREAMINA_IMAGE_MODEL_VERSIONS = Object["freeze"](
  getDreaminaImageModelMenuOptions()
    ["map"]((v13) =>
      String(v13["model"] || "")
        ["replace"](/^dreamina\//, "")
        ["trim"](),
    )
    ["filter"](Boolean),
);
const DREAMINA_IMAGE_MODEL_VERSION_SET = new Set(DREAMINA_IMAGE_MODEL_VERSIONS);
export function normalizeDreaminaImageModel(v14, v15) {
  const v16 = String(v14 || "")["trim"](),
    v17 = String(v15 || "")
      ["trim"]()
      ["toLowerCase"](),
    v18 = getDreaminaImageManifest(v16);
  if (v18) return v18["modelId"];
  if (!v16 && v17 === "dreamina") return getDefaultDreaminaImageModelId();
  return v16;
}
export function getDreaminaImageModelVersion(v19, v20) {
  const v21 = normalizeDreaminaImageModel(v19, v20);
  if (!v21["startsWith"]("dreamina/")) return "";
  const v22 = v21["slice"]("dreamina/"["length"])["trim"]();
  return DREAMINA_IMAGE_MODEL_VERSION_SET["has"](v22) ? v22 : "";
}
export function normalizeDreaminaImageSize(v23) {
  const v24 = String(v23 || "")
    ["trim"]()
    ["toUpperCase"]();
  if (!v24 || v24 === "1K") return "2K";
  if (DREAMINA_IMAGE_ALLOWED_SIZES["has"](v24)) return v24;
  return "2K";
}
export function normalizeDreaminaImageAspectRatio(v25) {
  const v26 = String(v25 || "")["trim"]();
  if (!v26) return v26;
  if (v26 === "auto") return "自适应";
  if (v26 === "5:4") return "4:3";
  if (v26 === "4:5") return "3:4";
  return v26;
}
export function isDreaminaImageRatioSupported(v27) {
  const v28 = String(v27 || "")["trim"]();
  if (!v28 || v28 === "自适应" || v28 === "auto") return true;
  return DREAMINA_IMAGE_ALLOWED_RATIOS["has"](v28);
}
export function pickClosestDreaminaImageAspectRatio(v29, v30) {
  const v31 = Number(v29),
    v32 = Number(v30);
  if (
    !(Number["isFinite"](v31) && v31 > 0 && Number["isFinite"](v32) && v32 > 0)
  )
    return "1:1";
  const v33 = v31 / v32;
  let v34 = DREAMINA_IMAGE_ADAPTIVE_RATIO_OPTIONS[0],
    v35 = Math["abs"](v33 - v34["calc"]);
  for (
    let v36 = 1;
    v36 < DREAMINA_IMAGE_ADAPTIVE_RATIO_OPTIONS["length"];
    v36 += 1
  ) {
    const v37 = DREAMINA_IMAGE_ADAPTIVE_RATIO_OPTIONS[v36],
      v38 = Math["abs"](v33 - v37["calc"]);
    v38 < v35 && ((v35 = v38), (v34 = v37));
  }
  return v34["label"];
}
export function buildDreaminaImageNodeNormalizationPatch(v39) {
  const v40 = v39 && typeof v39 === "object" ? v39 : {};
  if (!isDreaminaImageModel(v40["model"], v40["provider"])) return null;
  const v41 = normalizeDreaminaImageModel(v40["model"], v40["provider"]),
    v42 = normalizeDreaminaImageSize(v40["imageSize"]),
    v43 = normalizeDreaminaImageAspectRatio(v40["aspectRatio"]),
    v44 = {};
  v41 && v41 !== String(v40["model"] || "")["trim"]() && (v44["model"] = v41);
  String(v40["provider"] || "")
    ["trim"]()
    ["toLowerCase"]() !== "dreamina" && (v44["provider"] = "dreamina");
  v42 !==
    String(v40["imageSize"] || "2K")
      ["trim"]()
      ["toUpperCase"]() && (v44["imageSize"] = v42);
  if (v43 && !isDreaminaImageRatioSupported(v43)) v44["aspectRatio"] = "1:1";
  else
    v43 &&
      v43 !== String(v40["aspectRatio"] || "")["trim"]() &&
      (v44["aspectRatio"] = v43);
  return Object["keys"](v44)["length"] > 0 ? v44 : null;
}
export function isDreaminaImageModel(v45, v46) {
  const v47 = String(v45 || "")["trim"](),
    v48 = String(v46 || "")
      ["trim"]()
      ["toLowerCase"]();
  return v48 === "dreamina" || v47["startsWith"]("dreamina/");
}
export function getDreaminaImageTriggerIconHTML() {
  return '<img src="images/jimeng.png" class="image-model-trigger-icon image-model-trigger-icon-dreamina" alt="即梦">';
}
export function getDreaminaImageMenuGroupHTML(v49) {
  const v50 = String(v49 || "")["trim"](),
    v51 = isDreaminaImageModel(v50, "")
      ? normalizeDreaminaImageModel(v50, "dreamina")
      : "",
    v52 = (v53) => {
      const v54 = v51 === v53["model"];
      return renderNodeMenuItem({
        modelId: v53["model"],
        provider: "dreamina",
        label: v53["title"],
        description: v53["subtitle"],
        iconHtml: DREAMINA_IMAGE_MENU_ICON_HTML,
        active: v54,
      });
    };
  return renderNodeMenuGroup({
    id: "dreamina",
    headerClass: "dreamina-group-header",
    submenuClass: "dreamina-submenu",
    toggleAttr: "data-dreamina-toggle",
    label: "即梦",
    subtitle: "按版本直选，自动文生图/图生图",
    iconHtml: DREAMINA_IMAGE_MENU_ICON_HTML,
    itemsHtml: getDreaminaImageModelMenuOptions()
      ["map"]((v55) => v52(v55))
      ["join"](""),
  });
}
export function setDreaminaImageTriggerIcon(v56) {
  if (!v56) return;
  const v57 = v56["firstElementChild"];
  if (!v57) return;
  const v58 = document["createElement"]("img");
  ((v58["src"] = "images/jimeng.png"),
    (v58["className"] =
      "image-model-trigger-icon image-model-trigger-icon-dreamina"),
    v57["replaceWith"](v58));
}
export function bindDreaminaImageMenu(v59) {
  const {
    modelMenu: v60,
    modelTrigger: v61,
    modelLabel: v62,
    nodeId: v63,
    store: v64,
    buildModelPatch: v65,
  } = v59 || {};
  if (!v60 || !v61 || !v62 || !v63 || !v64) return null;
  const v66 = v60["querySelector"]("[data-dreamina-toggle]"),
    v67 = v60["querySelector"](".dreamina-submenu");
  if (!v66 || !v67) return null;
  let v68 = null;
  const v69 = () => {
      (v68 && (clearTimeout(v68), (v68 = null)),
        (v67["style"]["display"] = "flex"));
    },
    v70 = () => {
      if (v68) clearTimeout(v68);
      v68 = setTimeout(() => {
        v67["style"]["display"] = "none";
      }, 120);
    };
  return (
    v66["addEventListener"]("mouseenter", v69),
    v66["addEventListener"]("mouseleave", v70),
    v67["addEventListener"]("mouseenter", v69),
    v67["addEventListener"]("mouseleave", v70),
    v67["querySelectorAll"](".floating-menu-item")["forEach"]((v71) => {
      v71["addEventListener"]("click", () => {
        const v72 = String(
            v71["dataset"]["value"] || getDefaultDreaminaImageModelId(),
          )["trim"](),
          v73 = String(v71["dataset"]["provider"] || "dreamina")["trim"](),
          v74 = v71["querySelector"](".fmi-title");
        ((v62["textContent"] = v74 ? v74["textContent"] : v72),
          v60["querySelectorAll"](".floating-menu-item")["forEach"]((v75) =>
            v75["classList"]["remove"]("active"),
          ),
          v71["classList"]["add"]("active"),
          v60["classList"]["remove"]("show"),
          (v67["style"]["display"] = "none"));
        const v76 = v64["getState"]?.()["nodes"]?.[v63] || {},
          v77 =
            typeof v65 === "function"
              ? v65(v76, v72, v73)
              : { model: v72, provider: v73 };
        (v64["updateNodeData"](v63, v77), setDreaminaImageTriggerIcon(v61));
      });
    }),
    { header: v66, submenu: v67 }
  );
}
