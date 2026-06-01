import {
  IMAGE_MODELS,
  getModelDisplayName,
  getModelProvider,
} from "../config/modelConfig.js";
import {
  bindToolbarUpMenus,
  renderToolbarUpMenu,
} from "./imageToolbarUpMenu.js";
import {
  NANO_BANANA_FAMILIES,
  getDefaultModeForNanoBananaFamily,
  getNanoBananaModeLabel,
  getNanoBananaModeOptions,
  getNanoBananaSelectionFromModel,
  isNanoBananaFamily,
  resolveNanoBananaModelBySelection,
} from "./nanoBananaModeRules.js";
import {
  CONTROL_CAMERA_MODEL_ID,
  getModelManifest,
  getModelsByKind,
} from "../manifests/index.js";
const IMAGE_FUNCTION_PROVIDER_META = Object["freeze"]({
    grsai: Object["freeze"]({
      name: "GRSAI",
      icon: "images/grsai.png",
      description: "高性能\x20AI\x20图像生成服务",
    }),
    apimart: Object["freeze"]({
      name: "APIMart",
      icon: "AM",
      description: "一个 API 搞定一切——节省 30-70%",
      isTextIcon: true,
      modelIconStrategy: "provider",
    }),
    runninghub: Object["freeze"]({
      name: "RunningHUB模型",
      icon: "images/RH.png",
      description: "模型 API：文生图/图生图/图片编辑",
      modelIconStrategy: "provider",
    }),
  }),
  IMAGE_FUNCTION_MENU_PROVIDER_BY_GROUP = Object["freeze"]({
    grsaiModel: "grsai",
    apimart: "apimart",
    runninghubModel: "runninghub",
  }),
  DEFAULT_IMAGE_FUNCTION_PROVIDER = "runninghub",
  DEFAULT_FREE_ANGLE_PROVIDER = "runninghubwf",
  DEFAULT_FREE_ANGLE_MODEL = CONTROL_CAMERA_MODEL_ID,
  FREE_ANGLE_ONLY_MODEL_IDS = Object["freeze"]([CONTROL_CAMERA_MODEL_ID]),
  IMAGE_FUNCTION_ALLOWED_FAMILIES = Object["freeze"](
    new Set([
      NANO_BANANA_FAMILIES["NANOBANANA_2"],
      NANO_BANANA_FAMILIES["NANOBANANA_PRO"],
      NANO_BANANA_FAMILIES["GPT_IMAGE_2"],
    ]),
  );
export function isImageFreeAngleOnlyModel(v0) {
  const v1 = String(v0 || "")["trim"]();
  return FREE_ANGLE_ONLY_MODEL_IDS["includes"](v1);
}
const escapeHtmlAttr = (v2) =>
    String(v2 || "")
      ["replace"](/&/g, "&amp;")
      ["replace"](/"/g, "&quot;")
      ["replace"](/</g, "&lt;")
      ["replace"](/>/g, "&gt;"),
  escapeHtmlText = (v3) =>
    String(v3 || "")
      ["replace"](/&/g, "&amp;")
      ["replace"](/</g, "&lt;")
      ["replace"](/>/g, "&gt;"),
  canShowDevOnlyModels = () =>
    typeof window !== "undefined" && window["DEV_MODE"] === true;
function buildImageFunctionModelFromManifest(v4) {
  if (!v4) return null;
  const v5 = v4["extensions"]?.["imageMenu"] || {},
    v6 = v5["icon"] || v4["icon"] || "images/RH.png";
  return {
    id: v4["modelId"],
    family: v5["family"] || "",
    name: v5["title"] || v4["displayName"] || v4["modelId"],
    description: v5["subtitle"] || v4["description"] || "",
    icon: v6,
    isTextIcon:
      v5["isTextIcon"] === true ||
      !/\.(?:png|svg|jpg|jpeg|webp)$/i["test"](String(v6 || "")),
  };
}
function getImageFunctionFamily(v7) {
  return String(
    v7?.["extensions"]?.["imageFunctionMenu"]?.["family"] ||
      v7?.["extensions"]?.["nanoBanana"]?.["family"] ||
      "",
  )["trim"]();
}
function isAllowedImageFunctionManifest(v8) {
  return IMAGE_FUNCTION_ALLOWED_FAMILIES["has"](getImageFunctionFamily(v8));
}
function isAllowedImageFunctionModel(v9) {
  return isAllowedImageFunctionManifest(getModelManifest(v9));
}
function buildImageGenerationNodeCatalog() {
  const v10 = {};
  return (
    getModelsByKind("image")
      ["map"]((v11) => ({
        manifest: v11,
        imageMenu: v11?.["extensions"]?.["imageMenu"] || null,
      }))
      ["filter"](
        ({ manifest: v12, imageMenu: v13 }) =>
          v13?.["group"] && isAllowedImageFunctionManifest(v12),
      )
      ["sort"]((v14, v15) => {
        const v16 = Number(v14["imageMenu"]?.["order"] ?? 999),
          v17 = Number(v15["imageMenu"]?.["order"] ?? 999);
        return v16 - v17;
      })
      ["forEach"](({ manifest: v18, imageMenu: v19 }) => {
        const v20 =
            IMAGE_FUNCTION_MENU_PROVIDER_BY_GROUP[v19["group"]] ||
            v18["provider"],
          v21 = IMAGE_FUNCTION_PROVIDER_META[v20];
        if (!v21) return;
        !v10[v20] && (v10[v20] = { ...v21, models: [] });
        const v22 = buildImageFunctionModelFromManifest(v18);
        if (v22) v10[v20]["models"]["push"](v22);
      }),
    v10
  );
}
function buildFreeAngleOnlyProvider() {
  const v23 = FREE_ANGLE_ONLY_MODEL_IDS["map"]((v24) =>
    buildImageFunctionModelFromManifest(getModelManifest(v24)),
  )["filter"](Boolean);
  return {
    name: "RunningHUB工作流",
    icon: "images/RH.png",
    description: "控制角度专用工作流",
    models: v23,
  };
}
export function buildImageFreeAngleModelCatalog() {
  const v25 = buildImageGenerationNodeCatalog(),
    v26 = buildFreeAngleOnlyProvider();
  return (v26["models"]["length"] > 0 && (v25["runninghubwf"] = v26), v25);
}
export function getDefaultImageFreeAngleModelState(
  v27 = buildImageFreeAngleModelCatalog(),
) {
  const v28 = v27?.[DEFAULT_FREE_ANGLE_PROVIDER]?.["models"]?.["find"](
    (v29) => v29?.["id"] === DEFAULT_FREE_ANGLE_MODEL,
  );
  if (v28) return { provider: DEFAULT_FREE_ANGLE_PROVIDER, model: v28["id"] };
  return getDefaultImageFunctionModelState(v27);
}
function buildRawImageModelCatalog(v30 = IMAGE_MODELS) {
  const v31 = {};
  return (
    Object["entries"](v30 || {})["forEach"](([v32, v33]) => {
      if (v33?.["devOnly"] && !canShowDevOnlyModels()) return;
      const v34 = Array["isArray"](v33?.["models"]) ? v33["models"] : [],
        v35 = v34["filter"]((v36) => {
          if (!v36 || typeof v36 !== "object") return false;
          return v36["disabled"] !== true;
        });
      if (v35["length"] === 0) return;
      v31[v32] = { ...v33, models: v35 };
    }),
    v31
  );
}
export function buildImageFunctionModelCatalog(v37 = IMAGE_MODELS) {
  if (v37 === IMAGE_MODELS) return buildImageGenerationNodeCatalog();
  return buildRawImageModelCatalog(v37);
}
export function findImageFunctionProviderByModel(v38, v39) {
  const v40 = String(v39 || "")["trim"]();
  if (!v40) return null;
  for (const [v41, v42] of Object["entries"](v38 || {})) {
    const v43 = Array["isArray"](v42?.["models"]) ? v42["models"] : [];
    if (v43["some"]((v44) => v44?.["id"] === v40)) return v41;
  }
  const v45 = getModelProvider(v40);
  return v38?.[v45] && isAllowedImageFunctionModel(v40) ? v45 : null;
}
export function getDefaultImageFunctionModelState(
  v46 = buildImageFunctionModelCatalog(),
) {
  const v47 =
      v46?.[DEFAULT_IMAGE_FUNCTION_PROVIDER]?.["models"]?.["find"](
        (v48) => v48?.["family"] === "nanobanana-pro",
      )?.["id"] || "",
    v49 = v46?.[DEFAULT_IMAGE_FUNCTION_PROVIDER]?.["models"]?.["find"](
      (v50) => v50?.["id"] === v47,
    );
  if (v49)
    return { provider: DEFAULT_IMAGE_FUNCTION_PROVIDER, model: v49["id"] };
  const v51 = Object["keys"](v46 || {}),
    v52 = v51[0] || Object["keys"](IMAGE_MODELS)[0] || "",
    v53 = v46?.[v52]?.["models"]?.[0];
  return { provider: v52 || null, model: v53?.["id"] || null };
}
export function getImageFunctionModelDisplayName(
  v54,
  v55 = buildImageFunctionModelCatalog(),
) {
  const v56 = String(v54 || "")["trim"]();
  if (!v56) return "";
  for (const v57 of Object["values"](v55 || {})) {
    const v58 = Array["isArray"](v57?.["models"]) ? v57["models"] : [],
      v59 = v58["find"]((v60) => v60?.["id"] === v56);
    if (v59) return v59["name"] || v59["id"] || v56;
  }
  return getModelDisplayName(v56);
}
export function getImageFunctionNanoSelection(v61, v62 = "", v63 = "2K") {
  const v64 = getNanoBananaSelectionFromModel(v61, v63, v62);
  if (!v64 || !isNanoBananaFamily(v64["family"])) return null;
  if (v64["family"] === "gpt-image-2") return null;
  const v65 = String(v62 || "")
      ["trim"]()
      ["toLowerCase"](),
    v66 = String(v64["provider"] || "")
      ["trim"]()
      ["toLowerCase"]();
  if (v65 && v66 !== v65) return null;
  return v64;
}
export function resolveImageFunctionModelFromMenuItem({
  model: v67,
  provider: v68,
  family: v69,
  imageSize: imageSize = "2K",
} = {}) {
  const v70 = String(v68 || "")["trim"](),
    v71 = String(v69 || "")["trim"]();
  if (v71 && isNanoBananaFamily(v71)) {
    const v72 = getDefaultModeForNanoBananaFamily(v71, v70);
    return {
      model: resolveNanoBananaModelBySelection({
        family: v71,
        mode: v72,
        imageSize: imageSize,
        provider: v70,
      }),
      provider: v70,
      family: v71,
      mode: v72,
    };
  }
  return {
    model: String(v67 || "")["trim"](),
    provider: v70,
    family: "",
    mode: "",
  };
}
export function resolveImageFunctionModelByMode({
  model: v73,
  provider: v74,
  imageSize: imageSize = "2K",
  mode: v75,
} = {}) {
  const v76 = getImageFunctionNanoSelection(v73, v74, imageSize);
  if (!v76) return null;
  const v77 = String(v75 || "")["trim"]();
  if (!v77) return null;
  return {
    model: resolveNanoBananaModelBySelection({
      family: v76["family"],
      mode: v77,
      imageSize: imageSize,
      provider: v76["provider"],
    }),
    provider: v76["provider"],
    family: v76["family"],
    mode: v77,
  };
}
export function buildImageFunctionModeMenuHTML({
  model: model = "",
  provider: provider = "",
  imageSize: imageSize = "2K",
} = {}) {
  const v78 = getImageFunctionNanoSelection(model, provider, imageSize);
  if (!v78) return "";
  return renderToolbarUpMenu({
    fieldId: "mode",
    value: v78["mode"],
    options: getNanoBananaModeOptions(v78["family"], v78["provider"])["map"](
      (v79) => ({
        value: v79["mode"],
        label: v79["label"],
        tooltip: v79["tooltip"],
      }),
    ),
    itemClass: "",
    itemsOnly: true,
    itemValueAttrs: ["data-nb-mode"],
  });
}
export function getImageFunctionModeLabel({
  model: model = "",
  provider: provider = "",
  imageSize: imageSize = "2K",
} = {}) {
  const v80 = getImageFunctionNanoSelection(model, provider, imageSize);
  if (!v80) return "常规";
  return getNanoBananaModeLabel(v80["family"], v80["mode"], v80["provider"]);
}
export function isImageFunctionModeVisible({
  model: model = "",
  provider: provider = "",
  imageSize: imageSize = "2K",
} = {}) {
  return !!getImageFunctionNanoSelection(model, provider, imageSize);
}
export function buildImageFunctionModeControlHTML({
  model: model = "",
  provider: provider = "",
  imageSize: imageSize = "2K",
  wrapClass: wrapClass = "v2-expand-wrap",
  buttonClass: buttonClass = "v2-expand-toolbar-btn",
} = {}) {
  const v81 = isImageFunctionModeVisible({
      model: model,
      provider: provider,
      imageSize: imageSize,
    }),
    v82 = getImageFunctionModeLabel({
      model: model,
      provider: provider,
      imageSize: imageSize,
    }),
    v83 = getImageFunctionNanoSelection(model, provider, imageSize);
  return (
    "\x0a\x20\x20\x20\x20" +
    renderToolbarUpMenu({
      fieldId: "mode",
      value: v83?.["mode"] || "",
      options: v83
        ? getNanoBananaModeOptions(v83["family"], v83["provider"])["map"](
            (v84) => ({
              value: v84["mode"],
              label: v84["label"],
              tooltip: v84["tooltip"],
            }),
          )
        : [],
      wrapClass:
        wrapClass + " image-function-mode-wrap " + (v81 ? "" : "is-hidden"),
      buttonClass: buttonClass + " image-function-mode-toggle",
      labelClass: "image-function-mode-label",
      menuClass: "nb-mode-menu image-function-mode-menu",
      openClass: "show",
      selectedLabel: v82,
      itemClass: "",
      itemValueAttrs: ["data-nb-mode"],
    })
  );
}
export function syncImageFunctionModeControl({
  root: v85,
  model: v86,
  provider: provider = "",
  imageSize: imageSize = "2K",
} = {}) {
  if (!v85) return null;
  const v87 = v85["querySelector"](".image-function-mode-wrap"),
    v88 = v85["querySelector"](".image-function-mode-label"),
    v89 = v85["querySelector"](".image-function-mode-menu"),
    v90 = isImageFunctionModeVisible({
      model: v86,
      provider: provider,
      imageSize: imageSize,
    });
  v87?.["classList"]["toggle"]("is-hidden", !v90);
  v88 &&
    (v88["textContent"] = getImageFunctionModeLabel({
      model: v86,
      provider: provider,
      imageSize: imageSize,
    }));
  if (v89) {
    v89["innerHTML"] = buildImageFunctionModeMenuHTML({
      model: v86,
      provider: provider,
      imageSize: imageSize,
    });
    if (!v90) v89["classList"]["remove"]("show");
  }
  return getImageFunctionNanoSelection(v86, provider, imageSize);
}
export function bindImageFunctionModeMenu({
  modeMenu: v91,
  onSelect: v92,
} = {}) {
  if (!v91 || typeof v92 !== "function") return () => {};
  return bindToolbarUpMenus(v91, {
    onSelect: ({ value: v93, item: v94 }) => {
      const v95 = String(v93 || v94?.["dataset"]?.["nbMode"] || "")["trim"]();
      if (!v95) return;
      v92({ mode: v95, item: v94 });
    },
  });
}
function getProviderIconHtml(v96, v97, v98 = "") {
  if (v96?.["isTextIcon"])
    return (
      '<span class="image-function-model-icon image-function-model-icon-text ' +
      escapeHtmlAttr(v98) +
      "\x22>" +
      escapeHtmlText(v96["icon"]) +
      "</span>"
    );
  const v99 = v96?.["icon"] || "";
  if (!v99) return "";
  return (
    '<img class="image-function-model-icon ' +
    escapeHtmlAttr(v98) +
    '" src="' +
    escapeHtmlAttr(v99) +
    '" alt="' +
    escapeHtmlAttr(v97) +
    "\x22>"
  );
}
function getModelIconHtml(v100, v101, v102, v103 = "") {
  if (v101?.["modelIconStrategy"] === "provider")
    return getProviderIconHtml(v101, v102, v103);
  const v104 = v100?.["icon"] || v101?.["icon"] || "";
  if (v100?.["isTextIcon"])
    return (
      "<span\x20class=\x22image-function-model-icon\x20image-function-model-icon-text\x20" +
      escapeHtmlAttr(v103) +
      "\x22>" +
      escapeHtmlText(v100["icon"] || v100["name"] || v101?.["icon"] || "") +
      "</span>"
    );
  if (v101?.["isTextIcon"] && !v104)
    return (
      "<span\x20class=\x22image-function-model-icon\x20image-function-model-icon-text\x20" +
      escapeHtmlAttr(v103) +
      "\x22>" +
      escapeHtmlText(v101["icon"]) +
      "</span>"
    );
  if (!v104) return "";
  return (
    '<img class="image-function-model-icon ' +
    escapeHtmlAttr(v103) +
    '" src="' +
    escapeHtmlAttr(v104) +
    '" alt="' +
    escapeHtmlAttr(v102) +
    "\x22>"
  );
}
export function getImageFunctionModelTriggerIconHTML(
  v105,
  v106 = "",
  v107 = buildImageFunctionModelCatalog(),
) {
  const v108 = v107,
    v109 = v106 || findImageFunctionProviderByModel(v108, v105) || "grsai",
    v110 = v108[v109] || v108["grsai"];
  return getProviderIconHtml(v110, v109, "image-function-model-trigger-icon");
}
export function buildImageFunctionModelMenuHTML({
  activeModel: activeModel = "",
  activeProvider: activeProvider = "",
  modelCatalog: modelCatalog = buildImageFunctionModelCatalog(),
} = {}) {
  const v111 = String(activeModel || "")["trim"](),
    v112 = String(activeProvider || "")["trim"]();
  return Object["entries"](modelCatalog || {})
    ["map"](([v113, v114]) => {
      const v115 = v114?.["devOnly"] === true;
      if (v115) return "";
      const v116 = v114?.["disabled"] === true,
        v117 = getProviderIconHtml(v114, v113),
        v118 = (v114["models"] || [])
          ["map"]((v119) => {
            const v120 = v116 || v119?.["disabled"] === true,
              v121 =
                v111 === v119["id"] ||
                (v119["family"] &&
                  getImageFunctionNanoSelection(v111, v113)?.["family"] ===
                    v119["family"]) ||
                (!v111 && v112 && v112 === v113);
            return (
              '\n            <div class="floating-menu-item ' +
              (v121 ? "active" : "") +
              '" data-value="' +
              escapeHtmlAttr(v119["id"]) +
              "\x22\x20data-provider=\x22" +
              escapeHtmlAttr(v113) +
              "\x22\x20" +
              (v119["family"]
                ? 'data-image-function-family="' +
                  escapeHtmlAttr(v119["family"]) +
                  "\x22"
                : "") +
              "\x20" +
              (v120 ? 'data-disabled="true"' : "") +
              ">\n              " +
              getModelIconHtml(v119, v114, v113) +
              "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22fmi-content\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22fmi-title\x22>" +
              escapeHtmlText(v119["name"] || v119["id"]) +
              '</div>\n                <div class="fmi-sub">' +
              escapeHtmlText(v119["description"] || v114["description"] || "") +
              "</div>\n              </div>\n              " +
              (v120
                ? '<span class="floating-menu-badge floating-menu-badge-danger">不可用</span>'
                : "") +
              "\n            </div>"
            );
          })
          ["join"]("");
      return (
        '\n        <div class="' +
        escapeHtmlAttr(v113) +
        '-group-header floating-menu-item" data-image-function-provider="' +
        escapeHtmlAttr(v113) +
        '" data-' +
        escapeHtmlAttr(v113) +
        "-toggle>\n          " +
        v117 +
        '\n          <div class="fmi-content">\n            <div class="fmi-title">' +
        escapeHtmlText(v114["name"] || v113) +
        "</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22fmi-sub\x22>" +
        escapeHtmlText(v114["description"] || "") +
        "</div>\n          </div>\n          " +
        (v116
          ? '<span class="floating-menu-badge floating-menu-badge-danger floating-menu-badge-inline">不可用</span>'
          : "") +
        '\n          <svg class="image-function-model-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>\n        </div>\n        <div class="' +
        escapeHtmlAttr(v113) +
        '-submenu image-function-model-submenu">\n          ' +
        v118 +
        "\n        </div>"
      );
    })
    ["join"]("");
}
export function syncImageFunctionModelMenuActive({
  modelMenu: v122,
  model: v123,
  provider: provider = "",
} = {}) {
  if (!v122) return;
  const v124 = String(v123 || "")["trim"](),
    v125 = String(provider || "")["trim"](),
    v126 = getImageFunctionNanoSelection(v124, v125);
  v122["querySelectorAll"](".floating-menu-item")["forEach"]((v127) => {
    if (!v127["dataset"]["value"]) {
      v127["classList"]["remove"]("active");
      return;
    }
    const v128 = String(v127["dataset"]["imageFunctionFamily"] || "")["trim"](),
      v129 =
        v127["dataset"]["value"] === v124 ||
        (!!v128 &&
          v126?.["provider"] === v127["dataset"]["provider"] &&
          v126?.["family"] === v128) ||
        (!v124 && v125 && v127["dataset"]["provider"] === v125);
    v127["classList"]["toggle"]("active", v129);
  });
}
export function closeImageFunctionModelSubmenus(v130) {
  v130?.["querySelectorAll"](".image-function-model-submenu")["forEach"](
    (v131) => {
      v131["style"]["display"] = "none";
    },
  );
}
export function bindImageFunctionModelMenu({
  modelMenu: v132,
  onSelect: v133,
  closeMenu: v134,
  onOpenSubmenu: v135,
} = {}) {
  if (!v132 || typeof v133 !== "function") return () => {};
  const v136 = [];
  let v137 = 0;
  const v138 = () => {
      if (v137) clearTimeout(v137);
      v137 = 0;
    },
    v139 = (v140, v141 = 120) => {
      (v138(),
        (v137 = setTimeout(() => {
          ((v140["style"]["display"] = "none"), (v137 = 0));
        }, v141)));
    };
  v132["querySelectorAll"]("[data-image-function-provider]")["forEach"](
    (v142) => {
      const v143 = v142["dataset"]["imageFunctionProvider"],
        v144 = v132["querySelector"]("." + v143 + "-submenu");
      if (!v144) return;
      const v145 = () => {
          (v138(),
            closeImageFunctionModelSubmenus(v132),
            (v144["style"]["display"] = "flex"),
            v135?.({ header: v142, submenu: v144, providerKey: v143 }));
        },
        v146 = () => v139(v144);
      (v142["addEventListener"]("mouseenter", v145),
        v142["addEventListener"]("mouseleave", v146),
        v144["addEventListener"]("mouseenter", v145),
        v144["addEventListener"]("mouseleave", v146),
        v136["push"](() => {
          (v142["removeEventListener"]("mouseenter", v145),
            v142["removeEventListener"]("mouseleave", v146),
            v144["removeEventListener"]("mouseenter", v145),
            v144["removeEventListener"]("mouseleave", v146));
        }));
    },
  );
  const v147 = (v148) => {
    const v149 = v148["target"]["closest"](".floating-menu-item[data-value]");
    if (!v149 || !v132["contains"](v149)) return;
    v148["stopPropagation"]();
    if (v149["dataset"]["disabled"] === "true") return;
    const v150 = String(v149["dataset"]["value"] || "")["trim"](),
      v151 = String(
        v149["dataset"]["provider"] || getModelProvider(v150) || "",
      )["trim"](),
      v152 = resolveImageFunctionModelFromMenuItem({
        model: v150,
        provider: v151,
        family: v149["dataset"]["imageFunctionFamily"],
      });
    if (!v152["model"] || !v152["provider"]) return;
    (v133({ ...v152, item: v149 }),
      syncImageFunctionModelMenuActive({
        modelMenu: v132,
        model: v152["model"],
        provider: v152["provider"],
      }),
      closeImageFunctionModelSubmenus(v132),
      v134?.());
  };
  return (
    v132["addEventListener"]("click", v147),
    v136["push"](() => v132["removeEventListener"]("click", v147)),
    () => {
      (v138(), v136["forEach"]((v153) => v153()));
    }
  );
}
export { getModelDisplayName };
