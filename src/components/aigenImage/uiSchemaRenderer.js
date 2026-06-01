import {
  getModelManifest,
  normalizeUiSchemaFieldValue,
  resolveModelExecution,
  sanitizeModelUiSchemaParams,
} from "../../manifests/index.js";
import { escapeHtmlAttr } from "./uiModuleModelHelpers.js";
export { sanitizeModelUiSchemaParams };
const SUPPORTED_CONTROL_TYPES = new Set([
    "segmented",
    "select",
    "slider",
    "stepper",
    "toggle",
    "text",
    "textarea",
    "image input",
    "video input",
    "audio\x20input",
  ]),
  ALLOWED_PLACEMENTS = new Set([
    "mode",
    "resolution",
    "advanced",
    "videoadvanced",
    "videoparams",
    "instance",
    "batch",
  ]);
function escapeCssString(v0) {
  return String(v0 ?? "")
    ["replace"](/\\/g, "\x5c\x5c")
    ["replace"](/"/g, "\x5c\x22");
}
function normalizePlacement(v1) {
  const v2 = String(v1 || "")
    ["trim"]()
    ["toLowerCase"]();
  return ALLOWED_PLACEMENTS["has"](v2) ? v2 : "";
}
function filterUiSchemaFields(
  v3,
  {
    placement: v4,
    excludeFieldIds: v5,
    ignorePlacementFilter: ignorePlacementFilter = false,
  } = {},
) {
  if (!Array["isArray"](v3)) return [];
  const v6 = String(v4 ?? "")["trim"]() !== "",
    v7 = normalizePlacement(v4),
    v8 = new Set(
      (Array["isArray"](v5) ? v5 : [])["map"]((v9) =>
        String(v9 || "")["trim"](),
      ),
    );
  return v3["filter"]((v10) => {
    const v11 = String(v10?.["id"] || "")["trim"]();
    if (v8["has"](v11)) return false;
    if (v6 && !v7 && !ignorePlacementFilter) return false;
    if (!v7 || ignorePlacementFilter) return true;
    return normalizePlacement(v10?.["placement"]) === v7;
  });
}
function getUiSchemaFields(v12, { placement: v13, excludeFieldIds: v14 } = {}) {
  const v15 = getModelManifest(v12);
  return filterUiSchemaFields(v15?.["uiSchema"]?.["fields"], {
    placement: v13,
    excludeFieldIds: v14,
  });
}
function getUiSchemaModelIdForNode(v16 = {}) {
  const v17 = String(v16?.["model"] || "")["trim"]();
  if (!v17) return "";
  if (getModelManifest(v17)) return v17;
  const v18 =
    resolveModelExecution(v17, { providerHint: v16?.["provider"] }) ||
    resolveModelExecution(v17);
  return String(
    v18?.["canonicalModelId"] || v18?.["modelManifest"]?.["modelId"] || v17,
  )["trim"]();
}
function assertSupportedField(v19) {
  const v20 = String(v19?.["id"] || "")["trim"](),
    v21 = normalizeControlType(v19?.["type"]);
  if (!v20) throw new Error("[uiSchema]\x20field\x20id\x20is\x20required");
  if (!SUPPORTED_CONTROL_TYPES["has"](v21))
    throw new Error(
      "[uiSchema] unsupported control type for " +
        v20 +
        ":\x20" +
        v19?.["type"],
    );
  if (v19?.["defaultValue"] === undefined)
    throw new Error("[uiSchema] defaultValue is required for " + v20);
  if (
    (v21 === "segmented" || v21 === "select") &&
    (!Array["isArray"](v19?.["options"]) || v19["options"]["length"] === 0)
  )
    throw new Error("[uiSchema] options are required for " + v20);
}
function getFieldValue(v22, v23) {
  const v24 = String(v23?.["id"] || "")["trim"]();
  if (!v24) return v23?.["defaultValue"] ?? "";
  const v25 = getUiSchemaParamContext(v22),
    v26 = v22?.["generationParams"];
  if (
    v26 &&
    typeof v26 === "object" &&
    !Array["isArray"](v26) &&
    v26[v24] !== undefined
  )
    return normalizeUiSchemaFieldValue(v23, v26[v24], { params: v25 });
  if (
    v22 &&
    typeof v22 === "object" &&
    !Array["isArray"](v22) &&
    v22[v24] !== undefined
  )
    return normalizeUiSchemaFieldValue(v23, v22[v24], { params: v25 });
  return normalizeUiSchemaFieldValue(v23, v23?.["defaultValue"], {
    params: v25,
  });
}
function getNodeFieldValue(v27, v28, v29 = "") {
  const v30 = String(v28 || "")["trim"]();
  if (!v30) return v29;
  const v31 = v27?.["generationParams"];
  if (
    v31 &&
    typeof v31 === "object" &&
    !Array["isArray"](v31) &&
    v31[v30] !== undefined
  )
    return v31[v30];
  if (
    v27 &&
    typeof v27 === "object" &&
    !Array["isArray"](v27) &&
    v27[v30] !== undefined
  )
    return v27[v30];
  return v29;
}
function getPlainGenerationParams(v32) {
  return v32 && typeof v32 === "object" && !Array["isArray"](v32)
    ? { ...v32 }
    : {};
}
function getUiSchemaParamContext(v33 = {}) {
  const v34 = getPlainGenerationParams(v33?.["generationParams"]),
    v35 = v33 && typeof v33 === "object" && !Array["isArray"](v33) ? v33 : {};
  return { ...v35, ...v34 };
}
function getGenerationParamsMemoryKey(v36) {
  return String(v36?.["model"] || "")["trim"]();
}
function normalizeControlType(v37) {
  return String(v37 || "")
    ["trim"]()
    ["toLowerCase"]();
}
function getRenderableOptions(v38) {
  const v39 = Array["isArray"](v38?.["options"]) ? v38["options"] : [],
    v40 =
      Array["isArray"](v38?.["advancedOptions"]) &&
      globalThis["window"]?.["ADVANCED_MODE"]
        ? v38["advancedOptions"]
        : [];
  return [...v39, ...v40];
}
function getVisibleOptions(v41) {
  return getRenderableOptions(v41)["filter"]((v42) => v42?.["hidden"] !== true);
}
function renderOptions(v43, v44, v45 = {}) {
  const v46 = getVisibleOptions(v43);
  return v46["map"]((v47) => {
    const v48 = v47 && typeof v47 === "object" && !Array["isArray"](v47),
      v49 = String(v48 ? (v47["value"] ?? "") : v47),
      v50 = String(v48 ? (v47["label"] ?? v49) : v49),
      v51 = String(v48 ? v47["tooltip"] || "" : "")["trim"](),
      v52 = String(v44 ?? "") === v49,
      v53 = isOptionDisabled(v43, v47, v45),
      v54 = v51
        ? ' title="' +
          escapeHtmlAttr(v51) +
          '" data-tooltip="' +
          escapeHtmlAttr(v51) +
          "\x22"
        : "";
    return (
      '<button type="button" class="img-rp-quality-item ui-schema-option ' +
      (v52 ? "active" : "") +
      "\x20" +
      (v53 ? "disabled" : "") +
      "\x22\x20data-ui-schema-value=\x22" +
      escapeHtmlAttr(v49) +
      "\x22" +
      v54 +
      getOptionDisabledAttrs(v43, v47, { nodeData: v45 }) +
      ">" +
      escapeHtmlAttr(v50) +
      "</button>"
    );
  })["join"]("");
}
function renderControl(v55, v56, v57, v58 = {}) {
  if (v57 === "segmented") {
    if (v58?.["advanced"])
      return renderAdvancedSelectionControl(v55, v56, v58?.["nodeData"] || {});
    const v59 = v58?.["advanced"] ? " rh-adv-seg rh-v5-fps-seg" : "";
    return (
      '<div class="img-rp-quality-segmented ui-schema-segmented' +
      v59 +
      "\x22>" +
      renderOptions(v55, v56, v58?.["nodeData"] || {}) +
      "</div>"
    );
  }
  if (v57 === "select") return renderSelect(v55, v56);
  if (v57 === "slider" || v57 === "stepper") return renderRange(v55, v56, v57);
  if (v57 === "toggle")
    return renderAdvancedSelectionControl(v55, v56, v58?.["nodeData"] || {});
  if (v57 === "text" || v57 === "textarea")
    return renderTextInput(v55, v56, v57);
  return renderAssetInput(v55, v57);
}
function getOptionLabel(v60, v61) {
  const v62 = getRenderableOptions(v60),
    v63 = String(v61 ?? ""),
    v64 = v62["find"]((v65) => String(v65?.["value"] ?? v65) === v63);
  return String(
    v64?.["displayLabel"] ?? v64?.["selectedLabel"] ?? v64?.["label"] ?? v63,
  );
}
function getFieldById(v66, v67) {
  return (Array["isArray"](v66) ? v66 : [])["find"](
    (v68) => String(v68?.["id"] || "")["trim"]() === v67,
  );
}
function getOptionValue(v69) {
  return String(v69?.["value"] ?? v69);
}
function isFieldDisabled(v70) {
  return v70?.["disabled"] === true || v70?.["readOnly"] === true;
}
function normalizeCompareValue(v71) {
  return String(v71 ?? "")
    ["trim"]()
    ["toLowerCase"]();
}
function getOptionDisableWhen(v72) {
  if (!v72 || typeof v72 !== "object" || Array["isArray"](v72)) return null;
  const v73 = v72["disableWhen"] || v72["disabledWhen"];
  return v73 &&
    (Array["isArray"](v73) ||
      (typeof v73 === "object" && !Array["isArray"](v73)))
    ? v73
    : null;
}
function optionDisableWhenMatches(v74, v75 = {}) {
  if (Array["isArray"](v74))
    return v74["some"]((v76) => optionDisableWhenMatches(v76, v75));
  if (!v74 || typeof v74 !== "object") return false;
  if (Array["isArray"](v74["any"]))
    return v74["any"]["some"]((v77) => optionDisableWhenMatches(v77, v75));
  if (Array["isArray"](v74["all"]))
    return v74["all"]["every"]((v78) => optionDisableWhenMatches(v78, v75));
  const v79 = String(v74?.["field"] || v74?.["param"] || "")["trim"]();
  if (!v79) return false;
  const v80 = v74["values"] !== undefined ? v74["values"] : v74["value"],
    v81 = Array["isArray"](v80) ? v80 : [v80],
    v82 = v81["map"](normalizeCompareValue);
  return v82["includes"](
    normalizeCompareValue(getNodeFieldValue(v75, v79, "")),
  );
}
function uiSchemaConditionMatches(v83, v84 = {}) {
  if (Array["isArray"](v83))
    return v83["some"]((v85) => uiSchemaConditionMatches(v85, v84));
  if (!v83 || typeof v83 !== "object") return false;
  if (Array["isArray"](v83["any"]))
    return v83["any"]["some"]((v86) => uiSchemaConditionMatches(v86, v84));
  if (Array["isArray"](v83["all"]))
    return v83["all"]["every"]((v87) => uiSchemaConditionMatches(v87, v84));
  const v88 = String(v83?.["field"] || v83?.["param"] || "")["trim"]();
  if (!v88) return false;
  const v89 = v83["values"] !== undefined ? v83["values"] : v83["value"],
    v90 = Array["isArray"](v89) ? v89 : [v89],
    v91 = v90["map"](normalizeCompareValue);
  return v91["includes"](
    normalizeCompareValue(getNodeFieldValue(v84, v88, "")),
  );
}
function filterVisibleUiSchemaFields(v92 = [], v93 = {}) {
  return (Array["isArray"](v92) ? v92 : [])["filter"]((v94) => {
    if (v94?.["showWhen"] && !uiSchemaConditionMatches(v94["showWhen"], v93))
      return false;
    if (v94?.["hideWhen"] && uiSchemaConditionMatches(v94["hideWhen"], v93))
      return false;
    return true;
  });
}
function getOptionDisableWhenAttrs(v95) {
  const v96 = getOptionDisableWhen(v95);
  if (!v96) return "";
  if (
    Array["isArray"](v96) ||
    Array["isArray"](v96["any"]) ||
    Array["isArray"](v96["all"])
  )
    return (
      ' data-ui-schema-disable-when-json="' +
      escapeHtmlAttr(JSON["stringify"](v96)) +
      "\x22"
    );
  const v97 = String(v96["field"] || v96["param"] || "")["trim"](),
    v98 = v96["values"] !== undefined ? v96["values"] : v96["value"],
    v99 = Array["isArray"](v98) ? v98 : [v98];
  if (!v97 || v99["length"] === 0) return "";
  return (
    ' data-ui-schema-disable-when-field="' +
    escapeHtmlAttr(v97) +
    '" data-ui-schema-disable-when-values="' +
    escapeHtmlAttr(v99["join"](",")) +
    "\x22"
  );
}
function getFieldDefaultAliasAttrs(v100) {
  const v101 = (
    Array["isArray"](v100?.["defaultValueAliases"])
      ? v100["defaultValueAliases"]
      : []
  )
    ["map"]((v102) => String(v102 ?? "")["trim"]())
    ["filter"](Boolean);
  return v101["length"]
    ? ' data-ui-schema-default-aliases="' +
        escapeHtmlAttr(JSON["stringify"](v101)) +
        "\x22"
    : "";
}
function isOptionDisabled(v103, v104, v105 = {}) {
  return (
    isFieldDisabled(v103) ||
    (v104 &&
      typeof v104 === "object" &&
      !Array["isArray"](v104) &&
      (v104["disabled"] === true ||
        optionDisableWhenMatches(getOptionDisableWhen(v104), v105)))
  );
}
function getOptionDisabledAttrs(
  v106,
  v107,
  { button: button = true, nodeData: nodeData = {} } = {},
) {
  const v108 = getOptionDisableWhenAttrs(v107),
    v109 =
      isFieldDisabled(v106) ||
      (v107 &&
        typeof v107 === "object" &&
        !Array["isArray"](v107) &&
        v107["disabled"] === true),
    v110 = isOptionDisabled(v106, v107, nodeData);
  if (!v110) return v108;
  const v111 = v109 ? ' data-ui-schema-static-disabled="true"' : "",
    v112 = button
      ? ' data-ui-schema-disabled="true" disabled aria-disabled="true"'
      : ' data-ui-schema-disabled="true" aria-disabled="true"';
  return "" + v108 + v111 + v112;
}
function isAdaptiveRatioOption(v113, v114) {
  const v115 = getOptionValue(v114)["trim"](),
    v116 = String(v114?.["label"] ?? v115)["trim"](),
    v117 = v115["toLowerCase"](),
    v118 = v116["toLowerCase"]();
  return (
    v117 === "auto" ||
    v117 === "adaptive" ||
    v117 === "自适应" ||
    v118 === "auto" ||
    v118 === "adaptive" ||
    v118 === "自适应" ||
    (v115 === String(v113?.["defaultValue"] ?? "") && v118 === "auto")
  );
}
function getRatioOptionLabel(v119, v120) {
  const v121 = getRenderableOptions(v119),
    v122 = String(v120 ?? ""),
    v123 = v121["find"]((v124) => getOptionValue(v124) === v122);
  if (v123 && isAdaptiveRatioOption(v119, v123)) return "自适应";
  if (!v123 && isAdaptiveRatioOption(v119, v122)) return "自适应";
  return String(
    v123?.["displayLabel"] ??
      v123?.["selectedLabel"] ??
      v123?.["label"] ??
      v122,
  );
}
function getRatioIconClass(v125) {
  const v126 = String(v125 || "")["trim"](),
    v127 = {
      "1:1": "img-rp-sq",
      "9:16": "img-rp-tall",
      "16:9": "img-rp-wide",
      "3:4": "img-rp-p34",
      "4:3": "img-rp-l43",
      "1:4": "img-rp-p14",
      "4:1": "img-rp-l41",
      "1:8": "img-rp-p18",
      "8:1": "img-rp-l81",
      "3:2": "img-rp-l32",
      "2:3": "img-rp-p23",
      "5:4": "img-rp-l54",
      "4:5": "img-rp-p45",
      "21:9": "img-rp-ultra",
    };
  if (v127[v126]) return v127[v126];
  const v128 = v126["match"](/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!v128) return "img-rp-sq";
  const v129 = Number(v128[1]),
    v130 = Number(v128[2]);
  if (!Number["isFinite"](v129) || !Number["isFinite"](v130) || v129 === v130)
    return "img-rp-sq";
  return v129 > v130 ? "img-rp-wide" : "img-rp-tall";
}
function renderQualityButtons(v131, v132, v133 = {}) {
  assertSupportedField(v131);
  const v134 =
      String(v131?.["id"] || "")["trim"]() === "imageSize"
        ? "画质"
        : String(v131?.["label"] || "画质"),
    v135 = String(v131?.["description"] || v131?.["tooltip"] || "")["trim"](),
    v136 =
      String(v131?.["variant"] || "")["trim"]() === "sectionMenu" ||
      v131?.["showInfoTip"] === true,
    v137 =
      v135 && v136
        ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' +
          escapeHtmlAttr(v135) +
          '">!</span>'
        : "",
    v138 = getVisibleOptions(v131),
    v139 = v138["some"]((v140) =>
      String(v140?.["groupLabel"] || v140?.["sectionLabel"] || "")["trim"](),
    );
  if (v139) {
    const v141 = [];
    return (
      v138["forEach"]((v142) => {
        const v143 = String(
          v142?.["groupLabel"] || v142?.["sectionLabel"] || v134,
        )["trim"]();
        let v144 = v141["find"]((v145) => v145["label"] === v143);
        (!v144 && ((v144 = { label: v143, options: [] }), v141["push"](v144)),
          v144["options"]["push"](v142));
      }),
      "<div\x20class=\x22img-rp-quality-area\x22\x20data-ui-schema-field=\x22" +
        escapeHtmlAttr(v131["id"]) +
        "\x22\x20data-ui-schema-type=\x22segmented\x22\x20data-ui-schema-default=\x22" +
        escapeHtmlAttr(v131?.["defaultValue"] ?? "") +
        '">\n      ' +
        v141["map"](
          (v146) =>
            "<div\x20class=\x22img-rp-section-label\x22>" +
            escapeHtmlAttr(v146["label"]) +
            (v146["label"] === v134 ? v137 : "") +
            '</div>\n            <div class="img-rp-quality-segmented">\n              ' +
            v146["options"]
              ["map"]((v147) => {
                const v148 = getOptionValue(v147),
                  v149 = String(v147?.["label"] ?? v148),
                  v150 = String(
                    v147?.["displayLabel"] ?? v147?.["selectedLabel"] ?? v149,
                  ),
                  v151 = String(v132 ?? "") === v148,
                  v152 = isOptionDisabled(v131, v147, v133);
                return (
                  '<button type="button" class="img-rp-quality-item ui-schema-option ' +
                  (v151 ? "active" : "") +
                  "\x20" +
                  (v152 ? "disabled" : "") +
                  '" data-ui-schema-value="' +
                  escapeHtmlAttr(v148) +
                  '" data-ui-schema-option-label="' +
                  escapeHtmlAttr(v150) +
                  "\x22" +
                  getOptionDisabledAttrs(v131, v147, { nodeData: v133 }) +
                  ">" +
                  escapeHtmlAttr(v149) +
                  "</button>"
                );
              })
              ["join"]("") +
            "\n            </div>",
        )["join"]("") +
        "\n    </div>"
    );
  }
  return (
    '<div class="img-rp-quality-area" data-ui-schema-field="' +
    escapeHtmlAttr(v131["id"]) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(v131?.["defaultValue"] ?? "") +
    '">\n    <div class="img-rp-section-label">' +
    escapeHtmlAttr(v134) +
    v137 +
    '</div>\n    <div class="img-rp-quality-segmented">\n      ' +
    v138["map"]((v153) => {
      const v154 = getOptionValue(v153),
        v155 = String(v153?.["label"] ?? v154),
        v156 = String(
          v153?.["displayLabel"] ?? v153?.["selectedLabel"] ?? v155,
        ),
        v157 = String(v132 ?? "") === v154,
        v158 = isOptionDisabled(v131, v153, v133);
      return (
        '<button type="button" class="img-rp-quality-item ui-schema-option ' +
        (v157 ? "active" : "") +
        "\x20" +
        (v158 ? "disabled" : "") +
        '" data-ui-schema-value="' +
        escapeHtmlAttr(v154) +
        "\x22\x20data-ui-schema-option-label=\x22" +
        escapeHtmlAttr(v156) +
        "\x22" +
        getOptionDisabledAttrs(v131, v153, { nodeData: v133 }) +
        ">" +
        escapeHtmlAttr(v155) +
        "</button>"
      );
    })["join"]("") +
    "\n    </div>\n  </div>"
  );
}
function renderSectionMenuField(v159, v160) {
  const v161 = String(v159?.["id"] || "")["trim"](),
    v162 = getFieldValue(v160, v159),
    v163 = getOptionLabel(v159, v162);
  return (
    '<div class="ui-schema-field ui-schema-section-menu" data-ui-schema-field="' +
    escapeHtmlAttr(v161) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(v159?.["defaultValue"] ?? "") +
    "\x22>\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22img-pill-btn\x20ui-schema-menu-trigger\x22\x20data-ui-schema-menu-trigger=\x22" +
    escapeHtmlAttr(v161) +
    "\x22>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22ui-schema-pill-label\x22>" +
    escapeHtmlAttr(v163) +
    '</span>\n    </button>\n    <div class="img-ratio-popup ui-schema-popup ui-schema-section-menu-popup" style="display:none;">\n      ' +
    renderQualityButtons(v159, v162, v160) +
    "\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</div>"
  );
}
function renderRatioButtons(v164, v165, v166 = {}) {
  assertSupportedField(v164);
  const v167 = getVisibleOptions(v164),
    v168 = v167["find"]((v169) => isAdaptiveRatioOption(v164, v169)),
    v170 = v167["filter"]((v171) => !isAdaptiveRatioOption(v164, v171)),
    v172 = String(v165 ?? ""),
    v173 = v168 ? getOptionValue(v168) : "",
    v174 = v168 && String(v172) === String(v173),
    v175 = v168
      ? '<button type="button" class="img-rp-large-adaptive ui-schema-option ' +
        (v174 ? "active" : "") +
        '" data-label="自适应" data-ui-schema-value="' +
        escapeHtmlAttr(v173) +
        "\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x2224\x22\x20height=\x2224\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22><rect\x20x=\x223\x22\x20y=\x223\x22\x20width=\x2218\x22\x20height=\x2218\x22\x20rx=\x222\x22/><path\x20d=\x22M3\x209h18\x22/><path\x20d=\x22M9\x2021V9\x22/></svg>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span>自适应</span>\x0a\x20\x20\x20\x20\x20\x20</button>"
      : "",
    v176 = v168 ? "img-rp-ratio-split has-adaptive" : "img-rp-ratio-split";
  return (
    "<div\x20class=\x22img-rp-ratio-area\x22\x20data-ui-schema-field=\x22" +
    escapeHtmlAttr(v164["id"]) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(v164?.["defaultValue"] ?? "") +
    "\x22>\x0a\x20\x20\x20\x20<div\x20class=\x22img-rp-section-label\x22>比例</div>\x0a\x20\x20\x20\x20<div\x20class=\x22" +
    v176 +
    '">\n      ' +
    (v168 ? '<div class="img-rp-ratio-left">' + v175 + "</div>" : "") +
    '\n      <div class="img-rp-ratio-right">\n        ' +
    v170["map"]((v177) => {
      const v178 = getOptionValue(v177),
        v179 = String(v177?.["label"] ?? v178),
        v180 = v172 === v178,
        v181 = isOptionDisabled(v164, v177, v166);
      return (
        '<button type="button" class="img-rp-ratio-item ui-schema-option ' +
        (v180 ? "active" : "") +
        "\x20" +
        (v181 ? "disabled" : "") +
        '" data-label="' +
        escapeHtmlAttr(v178) +
        '" data-ui-schema-value="' +
        escapeHtmlAttr(v178) +
        "\x22" +
        getOptionDisabledAttrs(v164, v177, { nodeData: v166 }) +
        '><span class="img-rp-icon ' +
        getRatioIconClass(v178) +
        '"></span><span>' +
        escapeHtmlAttr(v179) +
        "</span></button>"
      );
    })["join"]("") +
    "\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</div>"
  );
}
function renderQualityRatioField(v182, v183, v184) {
  const v185 = (Array["isArray"](v182) ? v182 : [v182])["filter"](Boolean);
  (v185["forEach"](assertSupportedField), assertSupportedField(v183));
  const v186 = getFieldValue(v184, v183),
    v187 = v185["map"]((v188) =>
      getOptionLabel(v188, getFieldValue(v184, v188)),
    ),
    v189 = getRatioOptionLabel(v183, v186),
    v190 = String(
      v185[0]?.["qualityRatioLabelOrder"] ||
        v185[0]?.["compositeLabelOrder"] ||
        "",
    )["trim"](),
    v191 =
      v187["length"] > 1
        ? [...v187, v189]["join"](" · ")
        : v190 === "fieldFirst"
          ? (v187[0] || "") + " · " + v189
          : v189 + " · " + (v187[0] || ""),
    v192 = v190
      ? "\x20data-ui-schema-label-order=\x22" + escapeHtmlAttr(v190) + "\x22"
      : "";
  return (
    '<div class="ui-schema-quality-ratio-pill" data-ui-schema-composite-field="qualityRatio"' +
    v192 +
    '>\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="qualityRatio">\n      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>\n      <span class="ui-schema-pill-label ui-schema-quality-ratio-label">' +
    escapeHtmlAttr(v191) +
    '</span>\n    </button>\n    <div class="img-ratio-popup ui-schema-popup ui-schema-quality-ratio-popup" style="display:none;">\n      ' +
    v185["map"]((v193) =>
      renderQualityButtons(v193, getFieldValue(v184, v193), v184),
    )["join"]("") +
    "\x0a\x20\x20\x20\x20\x20\x20" +
    renderRatioButtons(v183, v186, v184) +
    "\n    </div>\n  </div>"
  );
}
function renderSectionPairField(v194, v195) {
  const v196 = (Array["isArray"](v194) ? v194 : [])["filter"](Boolean);
  v196["forEach"](assertSupportedField);
  const v197 = v196["map"]((v198) =>
      getOptionLabel(v198, getFieldValue(v195, v198)),
    )["join"](" · "),
    v199 = v196["map"]((v200) => String(v200?.["id"] || "")["trim"]())[
      "filter"
    ](Boolean),
    v201 = v199[0] || "",
    v202 = v199[1] || "";
  return (
    '<div class="ui-schema-section-pair-pill" data-ui-schema-composite-field="sectionPair" data-ui-schema-primary-field="' +
    escapeHtmlAttr(v201) +
    '" data-ui-schema-secondary-field="' +
    escapeHtmlAttr(v202) +
    '">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="sectionPair">\n      <span class="ui-schema-pill-label ui-schema-section-pair-label">' +
    escapeHtmlAttr(v197) +
    '</span>\n    </button>\n    <div class="img-ratio-popup ui-schema-popup ui-schema-section-pair-popup" style="display:none;">\n      ' +
    v196["map"]((v203) =>
      renderQualityButtons(v203, getFieldValue(v195, v203), v195),
    )["join"]("") +
    "\n    </div>\n  </div>"
  );
}
function renderVideoResolutionField(v204, v205) {
  const v206 =
    getFieldById(v204, "rhVideoResolution") ||
    getFieldById(v204, "videoResolution");
  if (!v206) return "";
  assertSupportedField(v206);
  const v207 = getFieldById(v204, "rhVideoFps"),
    v208 = getFieldById(v204, "rhVideoFrames");
  if (v207) assertSupportedField(v207);
  if (v208) assertSupportedField(v208);
  const v209 = getFieldValue(v205, v206),
    v210 = v207 ? getFieldValue(v205, v207) : "",
    v211 = v208 ? getFieldValue(v205, v208) : "",
    v212 = Number(v211) === 0 ? "全长" : String(v211 || ""),
    v213 =
      v207 && v208
        ? "帧数" + v212 + "·帧率" + v210 + "·分辨率" + v209
        : "分辨率" + v209;
  return (
    '<div class="ui-schema-video-resolution-pill" data-ui-schema-composite-field="videoResolution">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="videoResolution">\n      <span class="ui-schema-pill-label ui-schema-video-resolution-label">' +
    escapeHtmlAttr(v213) +
    "</span>\x0a\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20<div\x20class=\x22img-ratio-popup\x20ui-schema-popup\x20ui-schema-video-resolution-popup\x22\x20style=\x22display:none;\x22>\x0a\x20\x20\x20\x20\x20\x20" +
    renderQualityButtons({ ...v206, label: "分辨率" }, v209, v205) +
    "\x0a\x20\x20\x20\x20\x20\x20" +
    (v207
      ? '<div class="rh-v5-meta-panel"><div class="rh-vram-adv-row"><div class="rh-vram-adv-label"><span>帧率</span></div><div class="img-rp-quality-segmented rh-adv-seg rh-v5-fps-seg" data-ui-schema-field="' +
        escapeHtmlAttr(v207["id"]) +
        '" data-ui-schema-type="segmented" data-ui-schema-default="' +
        escapeHtmlAttr(v207["defaultValue"] ?? "") +
        "\x22>" +
        renderOptions(v207, v210, v205) +
        "</div></div></div>"
      : "") +
    "\n    </div>\n  </div>"
  );
}
function normalizeNumberValue(
  v214,
  v215,
  { min: min = -Infinity, max: max = Infinity } = {},
) {
  const v216 = Number(v214),
    v217 = Number["isFinite"](v216) ? Math["trunc"](v216) : v215;
  return Math["max"](min, Math["min"](max, v217));
}
export function evaluateUiSchemaNumberExpression(v218) {
  if (typeof v218 === "number") return Number["isFinite"](v218) ? v218 : NaN;
  const v219 = String(v218 ?? "")["trim"]();
  if (!v219) return NaN;
  let v220 = 0;
  const v221 = () => {
      while (/\s/["test"](v219[v220] || "")) v220 += 1;
    },
    v222 = () => {
      v221();
      const v223 = v220;
      let v224 = false;
      while (/\d/["test"](v219[v220] || "")) {
        ((v224 = true), (v220 += 1));
      }
      if (v219[v220] === ".") {
        v220 += 1;
        while (/\d/["test"](v219[v220] || "")) {
          ((v224 = true), (v220 += 1));
        }
      }
      if (!v224) return NaN;
      return Number(v219["slice"](v223, v220));
    },
    v225 = () => {
      v221();
      const v226 = v219[v220];
      if (v226 === "+" || v226 === "-") {
        v220 += 1;
        const v227 = v225();
        return v226 === "-" ? -v227 : v227;
      }
      if (v219[v220] === "(") {
        v220 += 1;
        const v228 = v229();
        v221();
        if (v219[v220] !== ")") return NaN;
        return ((v220 += 1), v228);
      }
      return v222();
    },
    v230 = () => {
      let v231 = v225();
      while (true) {
        v221();
        const v232 = v219[v220];
        if (v232 !== "*" && v232 !== "/") return v231;
        v220 += 1;
        const v233 = v225();
        if (!Number["isFinite"](v231) || !Number["isFinite"](v233)) return NaN;
        if (v232 === "/" && v233 === 0) return NaN;
        v231 = v232 === "*" ? v231 * v233 : v231 / v233;
      }
    };
  function v229() {
    let v234 = v230();
    while (true) {
      v221();
      const v235 = v219[v220];
      if (v235 !== "+" && v235 !== "-") return v234;
      v220 += 1;
      const v236 = v230();
      if (!Number["isFinite"](v234) || !Number["isFinite"](v236)) return NaN;
      v234 = v235 === "+" ? v234 + v236 : v234 - v236;
    }
  }
  const v237 = v229();
  return (
    v221(),
    v220 === v219["length"] && Number["isFinite"](v237) ? v237 : NaN
  );
}
function renderRhVideoParamsIcon() {
  return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M7 6V4"/><path d="M12 6V4"/><path d="M17 6V4"/><path d="M8 10h1"/><path d="M8 14h1"/><path d="M8 18h1"/><path d="M15 12l4 2-4 2z"/></svg>';
}
function getRhVideoParamsKind(v238) {
  if (getFieldById(v238, "rhVideoSeconds")) return "seconds";
  if (getFieldById(v238, "rhVideoFrames")) return "frames";
  return "resolution";
}
function buildRhVideoParamsLabel(v239, v240) {
  const v241 = getFieldById(v239, "rhVideoResolution"),
    v242 = getFieldById(v239, "rhVideoFps"),
    v243 = getFieldById(v239, "rhVideoFrames"),
    v244 = getFieldById(v239, "rhVideoSeconds"),
    v245 = v241
      ? normalizeNumberValue(
          getFieldValue(v240, v241),
          Number(v241["defaultValue"] ?? 832),
          { min: 832 },
        )
      : 832;
  if (v244) {
    const v246 = v242
        ? normalizeNumberValue(
            getFieldValue(v240, v242),
            Number(v242["defaultValue"] ?? 24),
          )
        : 24,
      v247 = normalizeNumberValue(
        getFieldValue(v240, v244),
        Number(v244["defaultValue"] ?? 5),
        { min: Number(v244["min"] ?? 1), max: Number(v244["max"] ?? 600) },
      );
    return "秒数" + v247 + "·帧率" + v246 + "·分辨率" + v245;
  }
  if (v243) {
    const v248 = normalizeNumberValue(
        getFieldValue(v240, v243),
        Number(v243["defaultValue"] ?? 77),
        { min: Number(v243["min"] ?? 0), max: Number(v243["max"] ?? 999999) },
      ),
      v249 = v248 === 0 ? "全长" : String(v248);
    if (!v242) return "帧数" + v249 + "·分辨率" + v245;
    const v250 = normalizeNumberValue(
      getFieldValue(v240, v242),
      Number(v242["defaultValue"] ?? 24),
    );
    return "帧数" + v249 + "·帧率" + v250 + "·分辨率" + v245;
  }
  return "分辨率" + v245;
}
function getRhVideoFpsOptions(v251, v252 = {}) {
  if (
    Array["isArray"](v252?.["rhVideoFpsOptions"]) &&
    v252["rhVideoFpsOptions"]["length"]
  )
    return v252["rhVideoFpsOptions"]
      ["map"]((v253) => Number(v253))
      ["filter"](Number["isFinite"])
      ["map"]((v254) => Object["freeze"]({ value: v254, label: v254 + "帧" }));
  return getRenderableOptions(v251);
}
function renderRhVideoParamsResolutionField(v255, v256, { buttonClass: v257 }) {
  assertSupportedField(v255);
  const v258 = normalizeNumberValue(
    getFieldValue(v256, v255),
    Number(v255["defaultValue"] ?? 832),
    { min: 832 },
  );
  return (
    '<div class="img-rp-quality-area" data-ui-schema-field="' +
    escapeHtmlAttr(v255["id"]) +
    '" data-ui-schema-type="segmented" data-ui-schema-value-type="number" data-ui-schema-default="' +
    escapeHtmlAttr(v255?.["defaultValue"] ?? "") +
    '">\n                  <div class="img-rp-section-label">分辨率<span class="rh-tip" data-tooltip="分辨率越高细节越清晰、边缘更稳定。&#10;同时显存占用与生成耗时会明显增加。">!</span></div>\n                  <div class="img-rp-quality-segmented rh-video-resolution-seg">\n                    ' +
    (Array["isArray"](v255?.["options"]) ? v255["options"] : [])
      ["map"]((v259) => {
        const v260 = Number(getOptionValue(v259)),
          v261 = Number(v258) === Number(v260),
          v262 = Number(v260) > 1440 ? " dev-mode-only" : "";
        return (
          '<button type="button" class="img-rp-quality-item' +
          v262 +
          "\x20" +
          (v261 ? "active" : "") +
          "\x20" +
          v257 +
          ' ui-schema-option" data-value="' +
          escapeHtmlAttr(v260) +
          '" data-ui-schema-value="' +
          escapeHtmlAttr(v260) +
          "\x22>" +
          escapeHtmlAttr(v260) +
          "</button>"
        );
      })
      ["join"]("") +
    "\n                  </div>\n                </div>"
  );
}
function renderRhVideoParamsFpsRow(v263, v264, v265 = {}) {
  assertSupportedField(v263);
  const v266 = normalizeNumberValue(
      getFieldValue(v264, v263),
      Number(v263["defaultValue"] ?? 24),
    ),
    v267 = v265?.["buttonClass"] || "rh-v5-fps-btn",
    v268 = v265?.["hidden"] ? " hidden" : "";
  return (
    '<div class="rh-vram-adv-row"' +
    v268 +
    '>\n                    <div class="rh-vram-adv-label">\n                      <span>帧率</span>\n                      <span class="rh-tip" data-tooltip="帧率越高运动更顺滑、动作更连贯。&#10;但生成更慢、成本更高。&#10;常用 24 帧；想更快或更省可选 16 帧。">!</span>\n                    </div>\n                    <div class="img-rp-quality-segmented rh-adv-seg rh-v5-fps-seg" data-ui-schema-field="' +
    escapeHtmlAttr(v263["id"]) +
    '" data-ui-schema-type="segmented" data-ui-schema-value-type="number" data-ui-schema-default="' +
    escapeHtmlAttr(v263?.["defaultValue"] ?? "") +
    '">\n                      ' +
    getRhVideoFpsOptions(v263, v265)
      ["map"]((v269) => {
        const v270 = Number(getOptionValue(v269)),
          v271 = String(v269?.["label"] ?? v270 + "帧");
        return (
          "<button\x20type=\x22button\x22\x20class=\x22img-rp-quality-item\x20" +
          v267 +
          "\x20" +
          (Number(v266) === Number(v270) ? "active" : "") +
          ' ui-schema-option" data-value="' +
          escapeHtmlAttr(v270) +
          '" data-ui-schema-value="' +
          escapeHtmlAttr(v270) +
          "\x22>" +
          escapeHtmlAttr(v271) +
          "</button>"
        );
      })
      ["join"]("") +
    "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>"
  );
}
function renderRhVideoParamsStepperRow(v272, v273, v274 = {}) {
  assertSupportedField(v272);
  const v275 = String(v272?.["id"] || "")["trim"](),
    v276 = v275 === "rhVideoFrames",
    v277 = Number(v272?.["min"] ?? (v276 ? 0 : 1)),
    v278 = Number(v272?.["max"] ?? (v276 ? 999999 : 600)),
    v279 = Number(v272?.["defaultValue"] ?? (v276 ? 77 : 5)),
    v280 = normalizeNumberValue(getFieldValue(v273, v272), v279, {
      min: v277,
      max: v278,
    }),
    v281 = Number(v273?.["rhVideoSourceFrameCount"] || 0),
    v282 = v276 ? "rh-v5-frames-stepper" : "rh-ltx-seconds-stepper",
    v283 = v276 ? "生成时长（帧数）" : "生成秒数",
    v284 = v276
      ? "帧数决定生成片段的长度：数值越大视频越长、耗时越高。&#10;填 0 表示按源视频全长处理（适合整段替换）。"
      : "秒数决定生成视频的时长：数值越大视频越长、耗时与成本越高。",
    v285 = v276 && v280 === 0 ? "全长" : String(v280);
  return (
    '<div class="rh-vram-adv-row ui-schema-rh-video-stepper" data-ui-schema-field="' +
    escapeHtmlAttr(v275) +
    '" data-ui-schema-type="stepper" data-ui-schema-value-type="number" data-ui-schema-default="' +
    escapeHtmlAttr(v272?.["defaultValue"] ?? "") +
    '" data-ui-schema-min="' +
    escapeHtmlAttr(v277) +
    '" data-ui-schema-max="' +
    escapeHtmlAttr(v278) +
    "\x22\x20data-ui-schema-step=\x22" +
    escapeHtmlAttr(v272?.["step"] ?? 1) +
    '">\n                    <div class="rh-vram-adv-label">\n                      <span>' +
    v283 +
    '</span>\n                      <span class="rh-tip" data-tooltip="' +
    v284 +
    '">!</span>\n                    </div>\n                    <div class="rh-stepper ' +
    v282 +
    '">\n                      ' +
    (v276
      ? '<div class="rh-v5-source-framecount" aria-label="源视频总帧数">' +
        (v281 ? String(v281) : "—") +
        "</div>"
      : "") +
    '\n                      <div class="rh-stepper-value" role="spinbutton" aria-label="' +
    (v276 ? "生成帧数" : "生成秒数") +
    '" aria-valuenow="' +
    escapeHtmlAttr(v280) +
    '" tabindex="0">' +
    escapeHtmlAttr(v285) +
    "</div>\n                    </div>\n                  </div>"
  );
}
function renderRhVideoParamsPlacementFields(v286, v287, v288 = {}) {
  const v289 = getFieldById(v286, "rhVideoResolution");
  if (!v289)
    return v286["map"]((v290) => renderField(v290, v287, v288))["join"]("");
  const v291 = getFieldById(v286, "rhVideoFps"),
    v292 = getFieldById(v286, "rhVideoFrames"),
    v293 = getFieldById(v286, "rhVideoSeconds"),
    v294 = getRhVideoParamsKind(v286),
    v295 = v294 === "seconds",
    v296 = Boolean(v292 && !v291),
    v297 = v295 ? "rh-ltx-res-btn" : "rh-v5-res-btn",
    v298 = v295 ? "rh-ltx-fps-btn" : "rh-v5-fps-btn",
    v299 = buildRhVideoParamsLabel(v286, v287),
    v300 = v295 ? "rh-ltx-meta-panel" : "rh-v5-meta-panel",
    v301 = v295
      ? "" +
        (v291
          ? renderRhVideoParamsFpsRow(v291, v287, {
              ...v288,
              buttonClass: v298,
            })
          : "") +
        (v293 ? renderRhVideoParamsStepperRow(v293, v287, v288) : "")
      : "" +
        (v291
          ? renderRhVideoParamsFpsRow(v291, v287, {
              ...v288,
              buttonClass: v298,
            })
          : "") +
        (v296 && v288?.["preserveHiddenFpsRow"] ? "" : "") +
        (v292 ? renderRhVideoParamsStepperRow(v292, v287, v288) : ""),
    v302 =
      v296 && v288?.["preserveHiddenFpsRow"]
        ? renderRhVideoParamsFpsRow(
            {
              id: "rhVideoFps",
              type: "segmented",
              label: "帧率",
              defaultValue: 24,
              options: Object["freeze"]([
                Object["freeze"]({ value: 16, label: "16帧" }),
                Object["freeze"]({ value: 24, label: "24帧" }),
              ]),
            },
            { generationParams: { rhVideoFps: 24 } },
            { ...v288, buttonClass: v298, hidden: true },
          )
        : "";
  return (
    '<div class="img-ratio-wrap ui-schema-rh-video-params" style="position:relative;" data-ui-schema-composite-field="rhVideoParams">\n              <button type="button" class="img-pill-btn img-ratio-btn">\n                <span class="img-ratio-icon-slot">' +
    renderRhVideoParamsIcon() +
    "</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22img-ratio-label\x22>" +
    escapeHtmlAttr(v299) +
    '</span>\n              </button>\n              <div class="img-ratio-popup" style="display:none;">\n                ' +
    renderRhVideoParamsResolutionField(v289, v287, { buttonClass: v297 }) +
    '\n                <div class="' +
    v300 +
    '" style="display:flex;flex-direction:column;gap:10px;">\n                  ' +
    v302 +
    v301 +
    "\n                </div>\n              </div>\n            </div>"
  );
}
function renderFloatingMenuItems(v303, v304, v305 = {}) {
  const v306 = getVisibleOptions(v303);
  return v306["map"]((v307) => {
    const v308 = String(v307?.["value"] ?? v307),
      v309 = String(v307?.["label"] ?? v308),
      v310 = String(v307?.["displayLabel"] ?? v307?.["selectedLabel"] ?? v309),
      v311 = String(v307?.["tooltip"] || "")["trim"](),
      v312 = String(v304 ?? "") === v308,
      v313 = isOptionDisabled(v303, v307, v305),
      v314 = v311
        ? ' title="' +
          escapeHtmlAttr(v311) +
          '" data-tooltip="' +
          escapeHtmlAttr(v311) +
          "\x22"
        : "",
      v315 = v311
        ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' +
          escapeHtmlAttr(v311) +
          '">!</span>'
        : "";
    return (
      "<div\x20class=\x22floating-menu-item\x20" +
      (v312 ? "active" : "") +
      "\x20" +
      (v313 ? "disabled" : "") +
      '" data-ui-schema-value="' +
      escapeHtmlAttr(v308) +
      '" data-ui-schema-option-label="' +
      escapeHtmlAttr(v310) +
      "\x22" +
      v314 +
      getOptionDisabledAttrs(v303, v307, { button: false, nodeData: v305 }) +
      '><span class="floating-menu-label">' +
      escapeHtmlAttr(v309) +
      "</span>" +
      v315 +
      "</div>"
    );
  })["join"]("");
}
function renderPillMenuField(v316, v317) {
  const v318 = String(v316?.["id"] || "")["trim"](),
    v319 = getFieldValue(v317, v316),
    v320 = getOptionLabel(v316, v319),
    v321 = isFieldDisabled(v316)
      ? "\x20disabled\x20aria-disabled=\x22true\x22\x20data-ui-schema-disabled=\x22true\x22"
      : "";
  return (
    '<div class="ui-schema-field ui-schema-pill-menu" data-ui-schema-field="' +
    escapeHtmlAttr(v318) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(v316?.["defaultValue"] ?? "") +
    '">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
    escapeHtmlAttr(v318) +
    "\x22" +
    v321 +
    '>\n      <span class="ui-schema-pill-label">' +
    escapeHtmlAttr(v320) +
    '</span>\n    </button>\n    <div class="floating-menu ui-schema-floating-menu">\n      ' +
    renderFloatingMenuItems(v316, v319, v317) +
    "\n    </div>\n  </div>"
  );
}
function renderResolutionPillField(v322, v323) {
  const v324 = String(v322?.["id"] || "")["trim"](),
    v325 = getFieldValue(v323, v322),
    v326 = getVisibleOptions(v322),
    v327 = v326["map"]((v328) => Number(v328?.["value"] ?? v328))["filter"](
      Number["isFinite"],
    ),
    v329 = Number["isFinite"](Number(v325))
      ? Number(v325)
      : Number(v322?.["defaultValue"] ?? v327[0] ?? 0),
    v330 = Math["max"](0, v327["indexOf"](v329)),
    v331 = Math["max"](0, v327["length"] - 1),
    v332 = v322?.["label"] || "Resolution",
    v333 = String(v322?.["description"] || v322?.["tooltip"] || "")["trim"](),
    v334 =
      v333 && v322?.["showInfoTip"] === true
        ? "<span\x20class=\x22rh-tip\x20ui-schema-info-tip\x22\x20data-tooltip=\x22" +
          escapeHtmlAttr(v333) +
          '">!</span>'
        : "";
  return (
    '<div class="ui-schema-field ui-schema-resolution-pill" data-ui-schema-field="' +
    escapeHtmlAttr(v324) +
    '" data-ui-schema-type="slider" data-ui-schema-default="' +
    escapeHtmlAttr(v322?.["defaultValue"] ?? "") +
    '" data-ui-schema-range-values="' +
    escapeHtmlAttr(v327["join"](",")) +
    '">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
    escapeHtmlAttr(v324) +
    '">\n      <span class="ui-schema-pill-label ui-schema-resolution-label">\n        <span class="ui-schema-resolution-title">' +
    escapeHtmlAttr(v332) +
    '</span>\n        <span class="ui-schema-resolution-value">' +
    escapeHtmlAttr(v329) +
    '</span>\n      </span>\n    </button>\n    <div class="rh-res-popup ui-schema-popup" style="display:none;">\n      <div class="rh-res-title">' +
    escapeHtmlAttr(v332) +
    v334 +
    '</div>\n      <input type="range" class="rh-res-slider ui-schema-range-index" data-ui-schema-input="' +
    escapeHtmlAttr(v324) +
    '" min="0" max="' +
    escapeHtmlAttr(v331) +
    '" step="1" value="' +
    escapeHtmlAttr(v330) +
    '">\n      <div class="rh-res-ticks">' +
    v327["map"]((v335) => "<span>" + escapeHtmlAttr(v335) + "</span>")["join"](
      "",
    ) +
    "</div>\n    </div>\n  </div>"
  );
}
function renderDurationPillField(v336, v337) {
  const v338 = String(v336?.["id"] || "")["trim"](),
    v339 = getFieldValue(v337, v336),
    v340 = getVisibleOptions(v336)
      ["map"]((v341) => Number(v341?.["value"] ?? v341))
      ["filter"](Number["isFinite"]),
    v342 = v340["length"] > 0,
    v343 = Number(v336?.["min"] ?? 1),
    v344 = Number(v336?.["max"] ?? 15),
    v345 = Number(v336?.["step"] ?? 1),
    v346 = Number["isFinite"](Number(v339))
      ? Number(v339)
      : Number(v336?.["defaultValue"] ?? v343),
    v347 = Math["max"](0, v340["indexOf"](v346)),
    v348 = v342 ? 0 : v343,
    v349 = v342 ? Math["max"](0, v340["length"] - 1) : v344,
    v350 = v342 ? 1 : v345,
    v351 = v342 ? v347 : v346,
    v352 = v342 ? v340[0] : v343,
    v353 = v342 ? v340[v340["length"] - 1] : v344,
    v354 = v342
      ? ' data-ui-schema-range-values="' +
        escapeHtmlAttr(v340["join"](",")) +
        "\x22"
      : "",
    v355 = isFieldDisabled(v336)
      ? ' disabled aria-disabled="true" data-ui-schema-disabled="true"'
      : "";
  return (
    '<div class="ui-schema-field ui-schema-duration-pill" data-ui-schema-field="' +
    escapeHtmlAttr(v338) +
    '" data-ui-schema-type="slider" data-ui-schema-default="' +
    escapeHtmlAttr(v336?.["defaultValue"] ?? "") +
    "\x22" +
    v354 +
    '>\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
    escapeHtmlAttr(v338) +
    "\x22" +
    v355 +
    '>\n      <span class="ui-schema-pill-label ui-schema-duration-label">' +
    escapeHtmlAttr(v346) +
    'S</span>\n    </button>\n    <div class="floating-menu ui-schema-popup ui-schema-duration-pop">\n      <div class="ui-schema-duration-title">' +
    escapeHtmlAttr(v336?.["label"] || "视频时长") +
    '</div>\n      <input type="range" class="ui-schema-range ui-schema-duration-slider" data-ui-schema-input="' +
    escapeHtmlAttr(v338) +
    '" min="' +
    escapeHtmlAttr(v348) +
    '" max="' +
    escapeHtmlAttr(v349) +
    '" step="' +
    escapeHtmlAttr(v350) +
    '" value="' +
    escapeHtmlAttr(v351) +
    "\x22>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22ui-schema-duration-bounds\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span>" +
    escapeHtmlAttr(v352) +
    "S</span>\n        <span>" +
    escapeHtmlAttr(v353) +
    "S</span>\n      </div>\n    </div>\n  </div>"
  );
}
function renderInstanceToggleField(v356, v357) {
  const v358 = String(v356?.["id"] || "")["trim"](),
    v359 = String(getFieldValue(v357, v356) || v356?.["defaultValue"] || ""),
    v360 = getVisibleOptions(v356),
    v361 = Math["max"](
      0,
      v360["findIndex"]((v362) => String(v362?.["value"] ?? v362) === v359),
    ),
    v363 = v360[v361] || v360[0] || {},
    v364 = v360[(v361 + 1) % Math["max"](1, v360["length"])] || v363;
  return (
    '<div class="ui-schema-field rh-vram-wrap ui-schema-instance-toggle" data-ui-schema-field="' +
    escapeHtmlAttr(v358) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(v356?.["defaultValue"] ?? "") +
    "\x22>\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22img-pill-btn\x20rh-vram-btn\x22\x20data-ui-schema-value=\x22" +
    escapeHtmlAttr(v364?.["value"] ?? v364) +
    '">\n      <span class="rh-vram-label ui-schema-pill-label">' +
    escapeHtmlAttr(v363?.["label"] ?? v363?.["value"] ?? v359) +
    "</span>\x0a\x20\x20\x20\x20</button>\x0a\x20\x20</div>"
  );
}
function syncInstanceToggleField(v365, v366) {
  if (!v365?.["classList"]?.["contains"]("ui-schema-instance-toggle")) return;
  const v367 = String(v366) === "plus",
    v368 = v365["querySelector"](".ui-schema-pill-label");
  if (v368) v368["textContent"] = v367 ? "48G" : "24G";
  const v369 = v365["querySelector"]("[data-ui-schema-value]");
  if (v369) v369["dataset"]["uiSchemaValue"] = v367 ? "default" : "plus";
}
function syncStepperField(v370, v371) {
  if (!v370?.["classList"]?.["contains"]("ui-schema-rh-video-stepper")) return;
  const v372 = Number(v370["dataset"]["uiSchemaDefault"] ?? 0),
    v373 = v370["dataset"]["uiSchemaMin"],
    v374 = v370["dataset"]["uiSchemaMax"],
    v375 = normalizeNumberValue(v371, Number["isFinite"](v372) ? v372 : 0, {
      min: v373 === undefined ? -Infinity : Number(v373),
      max: v374 === undefined ? Infinity : Number(v374),
    }),
    v376 = v370["querySelector"](".rh-stepper-value");
  if (!v376) return;
  const v377 = String(v370["dataset"]["uiSchemaField"] || "")["trim"]();
  ((v376["textContent"] =
    v377 === "rhVideoFrames" && v375 === 0 ? "全长" : String(v375)),
    v376["setAttribute"]("aria-valuenow", String(v375)));
}
function renderSelect(v378, v379) {
  const v380 = getVisibleOptions(v378);
  return (
    '<select class="ui-schema-select" data-ui-schema-input="' +
    escapeHtmlAttr(v378["id"]) +
    '">\n    ' +
    v380["map"]((v381) => {
      const v382 = String(v381?.["value"] ?? ""),
        v383 = String(v379 ?? "") === v382 ? " selected" : "";
      return (
        "<option\x20value=\x22" +
        escapeHtmlAttr(v382) +
        "\x22" +
        v383 +
        ">" +
        escapeHtmlAttr(v381?.["label"] ?? v382) +
        "</option>"
      );
    })["join"]("") +
    "\n  </select>"
  );
}
function renderRange(v384, v385, v386) {
  const v387 = getVisibleOptions(v384),
    v388 = v387["map"]((v389) => Number(v389?.["value"] ?? v389))["filter"](
      Number["isFinite"],
    ),
    v390 = Number(v384?.["defaultValue"] ?? v388[0] ?? 0),
    v391 = Number["isFinite"](Number(v385)) ? Number(v385) : v390;
  if (v386 === "stepper")
    return (
      "<div\x20class=\x22rh-stepper\x22\x20data-key=\x22" +
      escapeHtmlAttr(v384["id"]) +
      '">\n      <div class="rh-stepper-value" role="spinbutton" aria-label="' +
      escapeHtmlAttr(
        v384?.["ariaLabel"] || (v384?.["label"] || v384["id"]) + "数值",
      ) +
      '" aria-valuenow="' +
      escapeHtmlAttr(v391) +
      "\x22\x20tabindex=\x220\x22>" +
      escapeHtmlAttr(v391) +
      "</div>\n    </div>"
    );
  const v392 = Number(v384?.["min"] ?? v388[0] ?? 0),
    v393 = Number(v384?.["max"] ?? v388[v388["length"] - 1] ?? v392),
    v394 = Number(v384?.["step"] ?? 1);
  return (
    '<div class="ui-schema-range-line">\n    <input class="ui-schema-range" data-ui-schema-input="' +
    escapeHtmlAttr(v384["id"]) +
    '" type="range" min="' +
    escapeHtmlAttr(v392) +
    "\x22\x20max=\x22" +
    escapeHtmlAttr(v393) +
    '" step="' +
    escapeHtmlAttr(v394) +
    "\x22\x20value=\x22" +
    escapeHtmlAttr(v391) +
    '">\n    <span class="ui-schema-value">' +
    escapeHtmlAttr(v391) +
    "</span>\n  </div>"
  );
}
function renderStepperAttrs(v395, v396) {
  if (v396 !== "stepper") return "";
  const v397 = [];
  return (
    v395?.["min"] !== undefined &&
      v395?.["min"] !== null &&
      v397["push"](
        ' data-ui-schema-min="' + escapeHtmlAttr(v395["min"]) + "\x22",
      ),
    v395?.["max"] !== undefined &&
      v395?.["max"] !== null &&
      v397["push"](
        ' data-ui-schema-max="' + escapeHtmlAttr(v395["max"]) + "\x22",
      ),
    v397["push"](
      ' data-ui-schema-step="' + escapeHtmlAttr(v395?.["step"] ?? 1) + "\x22",
    ),
    v397["join"]("")
  );
}
function renderTextInput(v398, v399, v400) {
  if (v400 === "textarea")
    return (
      '<textarea class="ui-schema-textarea" data-ui-schema-input="' +
      escapeHtmlAttr(v398["id"]) +
      "\x22>" +
      escapeHtmlAttr(v399) +
      "</textarea>"
    );
  return (
    '<input class="ui-schema-text" data-ui-schema-input="' +
    escapeHtmlAttr(v398["id"]) +
    "\x22\x20type=\x22text\x22\x20value=\x22" +
    escapeHtmlAttr(v399) +
    "\x22>"
  );
}
function renderAssetInput(v401, v402) {
  const v403 =
    v402 === "video\x20input"
      ? "Video"
      : v402 === "audio input"
        ? "Audio"
        : "Image";
  return (
    '<button type="button" class="img-rp-quality-item ui-schema-asset-input" data-ui-schema-input="' +
    escapeHtmlAttr(v401["id"]) +
    '" data-ui-schema-asset-kind="' +
    escapeHtmlAttr(v402["split"]("\x20")[0]) +
    "\x22>" +
    v403 +
    "</button>"
  );
}
function renderAdvancedRowField(v404, v405) {
  assertSupportedField(v404);
  const v406 = String(v404?.["id"] || "")["trim"](),
    v407 = normalizeControlType(v404?.["type"]),
    v408 = getFieldValue(v405, v404),
    v409 = String(v404?.["label"] || v406),
    v410 = String(v404?.["description"] || v404?.["tooltip"] || "")["trim"](),
    v411 = v410
      ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' +
        escapeHtmlAttr(v410) +
        "\x22>!</span>"
      : "",
    v412 =
      typeof v404?.["defaultValue"] === "boolean"
        ? ' data-ui-schema-value-type="boolean"'
        : v407 === "stepper"
          ? ' data-ui-schema-value-type="number"'
          : "",
    v413 = v407 === "stepper" ? " ui-schema-rh-video-stepper" : "";
  return (
    "<div\x20class=\x22ui-schema-field\x20rh-vram-adv-row" +
    v413 +
    '" data-ui-schema-field="' +
    escapeHtmlAttr(v406) +
    "\x22\x20data-ui-schema-type=\x22" +
    escapeHtmlAttr(v407) +
    '" data-ui-schema-default="' +
    escapeHtmlAttr(v404?.["defaultValue"] ?? "") +
    "\x22" +
    getFieldDefaultAliasAttrs(v404) +
    v412 +
    renderStepperAttrs(v404, v407) +
    '>\n    <div class="rh-vram-adv-label">\n      <span class="rh-adv-title ui-schema-field-label">' +
    escapeHtmlAttr(v409) +
    "</span>\n      " +
    v411 +
    '\n    </div>\n    <div class="rh-adv-control-line">' +
    renderControl(v404, v408, v407, { advanced: true, nodeData: v405 }) +
    "</div>\n  </div>"
  );
}
function normalizeRhV54SinglePreset(v414, v415 = "efficiency") {
  const v416 = String(v414 ?? "")["trim"]();
  return v416 === "efficiency" || v416 === "stable" || v416 === "quality"
    ? v416
    : v415;
}
function normalizeRhV54SpecialMode(v417) {
  const v418 = String(v417 ?? "")["trim"]();
  return v418 === "longVideoOverlay" || v418 === "cameraMove" ? v418 : "";
}
function normalizeRhV54MaskExpand(v419, v420 = 25) {
  const v421 = Number(v419);
  return Number["isFinite"](v421)
    ? Math["max"](-9999, Math["min"](9999, Math["trunc"](v421)))
    : v420;
}
function getStepPrecision(v422) {
  const v423 = String(v422 ?? ""),
    v424 = v423["includes"](".") ? v423["split"](".")[1] : "";
  return Math["min"](Math["max"](v424["length"], 0), 8);
}
function normalizeRhV54BreastJiggle(
  v425,
  {
    min: min = 0,
    max: max = 1,
    step: step = 0.05,
    fallback: fallback = 0,
  } = {},
) {
  const v426 = Number(v425),
    v427 = Number(fallback),
    v428 = Number(min),
    v429 = Number(max),
    v430 = Number(step),
    v431 = Number["isFinite"](v428) ? v428 : 0,
    v432 = Number["isFinite"](v429) ? v429 : 1,
    v433 = Number["isFinite"](v427) ? v427 : v431,
    v434 = Math["max"](
      Math["min"](v431, v432),
      Math["min"](
        Math["max"](v431, v432),
        Number["isFinite"](v426) ? v426 : v433,
      ),
    );
  if (!Number["isFinite"](v430) || v430 <= 0) return v434;
  const v435 = v431 + Math["round"]((v434 - v431) / v430) * v430;
  return Math["max"](
    Math["min"](v431, v432),
    Math["min"](Math["max"](v431, v432), v435),
  );
}
function formatRhV54BreastJiggle(v436, v437 = {}) {
  const v438 = normalizeRhV54BreastJiggle(v436, v437);
  return String(
    Number(v438["toFixed"](getStepPrecision(v437["step"] ?? 0.05))),
  );
}
function getRhV54BreastJiggleRangeFromFieldEl(v439) {
  const v440 = Number(v439?.["dataset"]?.["uiSchemaMin"] ?? 0),
    v441 = Number(v439?.["dataset"]?.["uiSchemaMax"] ?? 1),
    v442 = Number(v439?.["dataset"]?.["uiSchemaStep"] ?? 0.05),
    v443 = Number(v439?.["dataset"]?.["uiSchemaDefault"] ?? v440);
  return { min: v440, max: v441, step: v442, fallback: v443 };
}
function renderRhV54FieldLabel(v444) {
  const v445 = String(v444?.["id"] || "")["trim"](),
    v446 = String(v444?.["label"] || v445),
    v447 = String(v444?.["description"] || v444?.["tooltip"] || "")["trim"](),
    v448 = v447
      ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' +
        escapeHtmlAttr(v447) +
        '">!</span>'
      : "";
  return (
    "<div\x20class=\x22rh-vram-adv-label\x22><span>" +
    escapeHtmlAttr(v446) +
    "</span>" +
    v448 +
    "</div>"
  );
}
function renderRhV54SegmentButton({
  key: v449,
  value: v450,
  label: v451,
  active: v452,
  disabled: disabled = false,
  attrs: attrs = "",
}) {
  const v453 =
      attrs ||
      (disabled
        ? ' disabled aria-disabled="true" data-ui-schema-disabled="true"'
        : ""),
    v454 = [
      "img-rp-quality-item",
      "rh-adv-seg-btn",
      v452 ? "active" : "",
      disabled ? "disabled" : "",
    ]
      ["filter"](Boolean)
      ["join"]("\x20");
  return (
    '<button type="button" class="' +
    v454 +
    "\x22\x20data-key=\x22" +
    escapeHtmlAttr(v449) +
    "\x22\x20data-value=\x22" +
    escapeHtmlAttr(v450) +
    '" data-ui-schema-value="' +
    escapeHtmlAttr(v450) +
    "\x22" +
    v453 +
    ">" +
    escapeHtmlAttr(v451) +
    "</button>"
  );
}
function renderAdvancedSelectionControl(v455, v456, v457 = {}) {
  const v458 = String(v455?.["id"] || "")["trim"](),
    v459 = normalizeControlType(v455?.["type"]),
    v460 =
      v459 === "toggle" && !Array["isArray"](v455?.["options"])
        ? [
            Object["freeze"]({ value: true, label: "是" }),
            Object["freeze"]({ value: false, label: "否" }),
          ]
        : getVisibleOptions(v455),
    v461 = v460["length"]
      ? v460
      : [
          Object["freeze"]({ value: true, label: "是" }),
          Object["freeze"]({ value: false, label: "否" }),
        ];
  return (
    '<div class="img-rp-quality-segmented rh-adv-seg">\n      ' +
    v461["map"]((v462) => {
      const v463 = getOptionValue(v462),
        v464 = String(v462?.["label"] ?? v463),
        v465 = String(v456 ?? "") === v463,
        v466 = isOptionDisabled(v455, v462, v457);
      return renderRhV54SegmentButton({
        key: v458,
        value: v463,
        label: v464,
        active: v465,
        disabled: v466,
        attrs: getOptionDisabledAttrs(v455, v462, { nodeData: v457 }),
      });
    })["join"]("") +
    "\n    </div>"
  );
}
function renderRhV54ControlModeField(v467, v468) {
  assertSupportedField(v467);
  const v469 = String(v467?.["id"] || "")["trim"](),
    v470 = String(
      getNodeFieldValue(v468, "rhControlMode", "single") || "single",
    ),
    v471 = normalizeRhV54SinglePreset(
      getNodeFieldValue(v468, "rhSingleControlPreset", v467?.["defaultValue"]),
      String(v467?.["defaultValue"] || "efficiency"),
    ),
    v472 = v470 === "multi" ? "multi" : v471;
  return (
    '<div class="ui-schema-field rh-vram-adv-row ui-schema-rh-v54-control-mode" data-ui-schema-field="' +
    escapeHtmlAttr(v469) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(v467?.["defaultValue"] ?? "") +
    '">\n    ' +
    renderRhV54FieldLabel(v467) +
    '\n    <div class="rh-adv-control-line">\n      <div class="rh-adv-single-group ' +
    (v470 !== "multi" ? "active" : "") +
    '">\n        <span class="rh-adv-single-title">单人控制</span>\n        <span class="rh-adv-single-colon" aria-hidden="true">：</span>\n        <div class="img-rp-quality-segmented rh-adv-seg rh-adv-control-seg">\n          ' +
    renderRhV54SegmentButton({
      key: "rhSingleControlPreset",
      value: "efficiency",
      label: "效率",
      active: v472 === "efficiency",
    }) +
    "\n          " +
    renderRhV54SegmentButton({
      key: "rhSingleControlPreset",
      value: "stable",
      label: "稳定",
      active: v472 === "stable",
    }) +
    '\n        </div>\n      </div>\n      <span class="rh-adv-control-split" aria-hidden="true"></span>\n      <div class="rh-adv-multi-group ' +
    (v470 === "multi" ? "active" : "") +
    '">\n        ' +
    renderRhV54SegmentButton({
      key: "rhControlMode",
      value: "multi",
      label: "多人控制",
      active: v472 === "multi",
    }) +
    "\n      </div>\n    </div>\n  </div>"
  );
}
function renderRhV54BooleanRowField(v473, v474) {
  assertSupportedField(v473);
  const v475 = String(v473?.["id"] || "")["trim"](),
    v476 =
      v473?.["disableWhenSpecialMode"] === "cameraMove" &&
      normalizeRhV54SpecialMode(
        getNodeFieldValue(v474, "rhSpecialMode", ""),
      ) === "cameraMove",
    v477 = v475 === "rhSubtractSubject" && v474?.["rhV54HasMaskVideo"] === true,
    v478 = v477
      ? false
      : getNodeFieldValue(v474, v475, v473?.["defaultValue"]) === true;
  return (
    '<div class="ui-schema-field rh-vram-adv-row ui-schema-rh-v54-boolean-row ' +
    (v476 || v477 ? "is-rh-disabled" : "") +
    '" data-ui-schema-field="' +
    escapeHtmlAttr(v475) +
    '" data-ui-schema-type="segmented" data-ui-schema-value-type="boolean" data-ui-schema-default="' +
    escapeHtmlAttr(v473?.["defaultValue"] ?? "") +
    "\x22" +
    (v473?.["disableWhenSpecialMode"]
      ? ' data-rh-v54-disable-on-special="' +
        escapeHtmlAttr(v473["disableWhenSpecialMode"]) +
        "\x22"
      : "") +
    (v477 ? ' data-rh-v54-disable-on-mask-video="true"' : "") +
    ">\n    " +
    renderRhV54FieldLabel(v473) +
    '\n    <div class="img-rp-quality-segmented rh-adv-seg">\n      ' +
    renderRhV54SegmentButton({
      key: v475,
      value: "true",
      label: "是",
      active: v478,
    }) +
    "\n      " +
    renderRhV54SegmentButton({
      key: v475,
      value: "false",
      label: "否",
      active: !v478,
    }) +
    "\n    </div>\n  </div>"
  );
}
function renderRhV54MaskExpandField(v479, v480) {
  assertSupportedField(v479);
  const v481 = String(v479?.["id"] || "")["trim"](),
    v482 = getNodeFieldValue(v480, v481, v479?.["defaultValue"] ?? 25),
    v483 = normalizeRhV54MaskExpand(v482, Number(v479?.["defaultValue"] ?? 25)),
    v484 =
      v479?.["disableWhenSpecialMode"] === "cameraMove" &&
      normalizeRhV54SpecialMode(
        getNodeFieldValue(v480, "rhSpecialMode", ""),
      ) === "cameraMove";
  return (
    '<div class="ui-schema-field rh-vram-adv-row ui-schema-rh-v54-mask-expand ' +
    (v484 ? "is-rh-disabled" : "") +
    '" data-ui-schema-field="' +
    escapeHtmlAttr(v481) +
    '" data-ui-schema-type="stepper" data-ui-schema-value-type="number" data-ui-schema-default="' +
    escapeHtmlAttr(v479?.["defaultValue"] ?? "") +
    '" data-ui-schema-min="' +
    escapeHtmlAttr(v479?.["min"] ?? -9999) +
    '" data-ui-schema-max="' +
    escapeHtmlAttr(v479?.["max"] ?? 9999) +
    '" data-ui-schema-step="' +
    escapeHtmlAttr(v479?.["step"] ?? 1) +
    "\x22" +
    (v479?.["disableWhenSpecialMode"]
      ? ' data-rh-v54-disable-on-special="' +
        escapeHtmlAttr(v479["disableWhenSpecialMode"]) +
        "\x22"
      : "") +
    ">\n    " +
    renderRhV54FieldLabel(v479) +
    "\x0a\x20\x20\x20\x20<div\x20class=\x22rh-stepper\x22\x20data-key=\x22" +
    escapeHtmlAttr(v481) +
    '">\n      <div class="rh-stepper-value" role="spinbutton" aria-label="' +
    escapeHtmlAttr(v479?.["ariaLabel"] || (v479?.["label"] || v481) + "数值") +
    '" aria-valuenow="' +
    escapeHtmlAttr(v483) +
    "\x22\x20tabindex=\x220\x22>" +
    escapeHtmlAttr(v483) +
    "</div>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</div>"
  );
}
function renderRhV54SpecialModeField(v485, v486) {
  assertSupportedField(v485);
  const v487 = String(v485?.["id"] || "")["trim"](),
    v488 = normalizeRhV54SpecialMode(getNodeFieldValue(v486, v487, "")),
    v489 = getRenderableOptions(v485)["filter"](
      (v490) => v490?.["hidden"] !== true,
    );
  return (
    '<div class="ui-schema-field rh-vram-adv-row ui-schema-rh-v54-special-mode" data-ui-schema-field="' +
    escapeHtmlAttr(v487) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(v485?.["defaultValue"] ?? "") +
    '">\n    ' +
    renderRhV54FieldLabel(v485) +
    '\n    <div class="img-rp-quality-segmented rh-adv-seg">\n      ' +
    v489["map"]((v491) => {
      const v492 = getOptionValue(v491);
      return renderRhV54SegmentButton({
        key: v487,
        value: v492,
        label: String(v491?.["label"] ?? v492),
        active: v488 === v492,
      });
    })["join"]("") +
    "\n    </div>\n  </div>"
  );
}
function renderRhV54BreastJiggleField(v493, v494) {
  assertSupportedField(v493);
  const v495 = String(v493?.["id"] || "")["trim"](),
    v496 = Number(v493?.["min"] ?? 0),
    v497 = Number(v493?.["max"] ?? 1),
    v498 = Number(v493?.["step"] ?? 0.05),
    v499 = Number(v493?.["defaultValue"] ?? v496),
    v500 = formatRhV54BreastJiggle(
      getNodeFieldValue(v494, v495, v493?.["defaultValue"] ?? 0),
      { min: v496, max: v497, step: v498, fallback: v499 },
    );
  return (
    '<div class="ui-schema-field rh-vram-adv-row rh-breast-jiggle-row ui-schema-rh-v54-breast-jiggle" data-ui-schema-field="' +
    escapeHtmlAttr(v495) +
    '" data-ui-schema-type="slider" data-ui-schema-default="' +
    escapeHtmlAttr(v493?.["defaultValue"] ?? "") +
    '" data-ui-schema-min="' +
    escapeHtmlAttr(v496) +
    "\x22\x20data-ui-schema-max=\x22" +
    escapeHtmlAttr(v497) +
    "\x22\x20data-ui-schema-step=\x22" +
    escapeHtmlAttr(v498) +
    '">\n    ' +
    renderRhV54FieldLabel(v493) +
    "\x0a\x20\x20\x20\x20<div\x20class=\x22rh-breast-jiggle-control\x22>\x0a\x20\x20\x20\x20\x20\x20<input\x20type=\x22range\x22\x20class=\x22rh-breast-jiggle-slider\x22\x20data-ui-schema-input=\x22" +
    escapeHtmlAttr(v495) +
    '" min="' +
    escapeHtmlAttr(v496) +
    "\x22\x20max=\x22" +
    escapeHtmlAttr(v497) +
    '" step="' +
    escapeHtmlAttr(v498) +
    '" value="' +
    escapeHtmlAttr(v500) +
    '" aria-label="' +
    escapeHtmlAttr(v493?.["ariaLabel"] || v493?.["label"] || v495) +
    "\x22>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22rh-breast-jiggle-value\x22>" +
    escapeHtmlAttr(v500) +
    "</span>\n    </div>\n  </div>"
  );
}
function renderField(v501, v502, v503 = {}) {
  assertSupportedField(v501);
  const v504 = String(v501?.["id"] || "")["trim"](),
    v505 = normalizeControlType(v501?.["type"]),
    v506 = v501?.["variant"] || v503?.["variant"];
  if (v506 === "rhV54ControlMode")
    return renderRhV54ControlModeField(v501, v502);
  if (v506 === "rhV54BooleanRow") return renderRhV54BooleanRowField(v501, v502);
  if (v506 === "rhV54MaskExpand") return renderRhV54MaskExpandField(v501, v502);
  if (v506 === "rhV54SpecialMode")
    return renderRhV54SpecialModeField(v501, v502);
  if (v506 === "rhV54BreastJiggle")
    return renderRhV54BreastJiggleField(v501, v502);
  if (v506 === "advancedRow") return renderAdvancedRowField(v501, v502);
  if (v506 === "pillMenu" && v505 === "segmented")
    return renderPillMenuField(v501, v502);
  if (v506 === "sectionMenu" && v505 === "segmented")
    return renderSectionMenuField(v501, v502);
  if (v506 === "resolutionPill" && v505 === "segmented")
    return renderPillMenuField(v501, v502);
  if (v506 === "resolutionPill" && v505 === "slider")
    return renderResolutionPillField(v501, v502);
  if (v506 === "durationPill" && v505 === "slider")
    return renderDurationPillField(v501, v502);
  if (v506 === "instanceToggle" && v505 === "segmented")
    return renderInstanceToggleField(v501, v502);
  const v507 = getFieldValue(v502, v501),
    v508 = String(v501?.["label"] || v504),
    v509 = v501?.["defaultValue"] ?? "",
    v510 = renderControl(v501, v507, v505, { nodeData: v502 }),
    v511 = v505 === "stepper" ? " ui-schema-rh-video-stepper" : "",
    v512 = v505 === "stepper" ? ' data-ui-schema-value-type="number"' : "";
  return (
    '<div class="ui-schema-field' +
    v511 +
    '" data-ui-schema-field="' +
    escapeHtmlAttr(v504) +
    '" data-ui-schema-type="' +
    escapeHtmlAttr(v505) +
    '" data-ui-schema-default="' +
    escapeHtmlAttr(v509) +
    "\x22" +
    v512 +
    renderStepperAttrs(v501, v505) +
    '>\n    <div class="rh-adv-title ui-schema-field-label">' +
    escapeHtmlAttr(v508) +
    "</div>\x0a\x20\x20\x20\x20<div\x20class=\x22ui-schema-field-control\x22>" +
    v510 +
    "</div>\x0a\x20\x20</div>"
  );
}
function renderResolutionPlacementFields(v513, v514, v515 = {}) {
  const v516 =
    getFieldById(v513, "rhVideoResolution") ||
    getFieldById(v513, "videoResolution");
  if (v516) {
    const v517 = new Set([
        "rhVideoResolution",
        "videoResolution",
        "rhVideoFps",
        "rhVideoFrames",
      ]),
      v518 = v513["filter"](
        (v519) => !v517["has"](String(v519?.["id"] || "")["trim"]()),
      );
    return [
      renderVideoResolutionField(v513, v514),
      ...v518["map"]((v520) => renderField(v520, v514, v515)),
    ]["join"]("");
  }
  const v521 = new Set(["imageSize", "resolution", "videoSize", "quality"]),
    v522 = v513["filter"]((v523) => {
      const v524 = String(v523?.["id"] || "")["trim"](),
        v525 = String(v523?.["displayRole"] || "")["trim"]();
      return v525 === "resolution" || v521["has"](v524);
    }),
    v526 = v522[0] || null,
    v527 = getFieldById(v513, "aspectRatio");
  if (v526 && v527) {
    const v528 = v513["filter"]((v529) => {
      const v530 = String(v529?.["id"] || "")["trim"]();
      return (
        !v522["some"](
          (v531) => String(v531?.["id"] || "")["trim"]() === v530,
        ) && v530 !== "aspectRatio"
      );
    });
    return [
      renderQualityRatioField(v522, v527, v514),
      ...v528["map"]((v532) => renderField(v532, v514, v515)),
    ]["join"]("");
  }
  return v513["map"]((v533) => renderField(v533, v514, v515))["join"]("");
}
function renderModePlacementFields(v534, v535, v536 = {}) {
  const v537 = v534["filter"](
    (v538) => String(v538?.["variant"] || "")["trim"]() === "sectionMenu",
  );
  if (v537["length"] >= 2) {
    const v539 = new Set(
        v537["map"]((v540) => String(v540?.["id"] || "")["trim"]()),
      ),
      v541 = v534["filter"](
        (v542) => !v539["has"](String(v542?.["id"] || "")["trim"]()),
      );
    return [
      renderSectionPairField(v537, v535),
      ...v541["map"]((v543) => renderField(v543, v535, v536)),
    ]["join"]("");
  }
  return v534["map"]((v544) => renderField(v544, v535, v536))["join"]("");
}
export function hasModelUiSchema(v545, v546 = {}) {
  const v547 = getUiSchemaFields(v545, v546);
  return (v547["forEach"](assertSupportedField), v547["length"] > 0);
}
function renderUiSchemaControls(v548, v549 = {}, v550 = {}) {
  const v551 = filterVisibleUiSchemaFields(
    filterUiSchemaFields(v548, v550),
    v549,
  );
  if (!v551["length"]) return "";
  const v552 = normalizePlacement(v550?.["placement"]),
    v553 =
      v552 === "resolution"
        ? renderResolutionPlacementFields(v551, v549, v550)
        : v552 === "mode"
          ? renderModePlacementFields(v551, v549, v550)
          : v552 === "videoparams"
            ? renderRhVideoParamsPlacementFields(v551, v549, v550)
            : v551["map"]((v554) => renderField(v554, v549, v550))["join"]("");
  if (!v553) return "";
  if (v550?.["unwrap"] === true) return v553;
  const v555 = v552
      ? "\x20data-ui-schema-placement=\x22" + escapeHtmlAttr(v552) + "\x22"
      : "",
    v556 = v550?.["modelId"]
      ? "\x20data-ui-schema-model=\x22" +
        escapeHtmlAttr(v550["modelId"]) +
        "\x22"
      : "",
    v557 = v550?.["sourceId"]
      ? "\x20data-ui-schema-source=\x22" +
        escapeHtmlAttr(v550["sourceId"]) +
        "\x22"
      : "";
  return (
    "<div\x20class=\x22ui-schema-renderer\x22" +
    v556 +
    v557 +
    v555 +
    ">" +
    v553 +
    "</div>"
  );
}
export function renderModelUiSchemaControls(v558, v559 = {}, v560 = {}) {
  const v561 = getUiSchemaFields(v558, v560);
  return renderUiSchemaControls(v561, v559, { ...v560, modelId: v558 });
}
export function renderUiSchemaFields(v562, v563 = {}, v564 = {}) {
  return renderUiSchemaControls(v562, v563, {
    ...v564,
    ignorePlacementFilter: true,
  });
}
export function buildUiSchemaParamPatch(v565 = {}, v566 = "", v567 = "") {
  const v568 = String(v566 || "")["trim"]();
  if (!v568) return {};
  const v569 = getUiSchemaModelIdForNode(v565),
    v570 = getModelManifest(v569),
    v571 = Array["isArray"](v570?.["uiSchema"]?.["fields"])
      ? v570["uiSchema"]["fields"]["find"](
          (v572) => String(v572?.["id"] || "")["trim"]() === v568,
        )
      : null,
    v573 = v571 ? normalizeUiSchemaFieldValue(v571, v567) : v567,
    v574 = getPlainGenerationParams(v565["generationParams"]);
  v574[v568] = v573;
  const v575 = sanitizeModelUiSchemaParams(v569 || v565?.["model"], v574, {
      includeDefaults: false,
    }),
    v576 = { generationParams: v575 },
    v577 = getGenerationParamsMemoryKey(v565);
  return (
    v577 &&
      (v576["generationParamsByModel"] = {
        ...getPlainGenerationParams(v565["generationParamsByModel"]),
        [v577]: v575,
      }),
    v576
  );
}
export function buildModelUiSchemaDefaultParams(v578) {
  const v579 = getUiSchemaFields(v578);
  return (
    v579["forEach"](assertSupportedField),
    sanitizeModelUiSchemaParams(v578)
  );
}
function bindUiSchemaControls(
  v580,
  { getNodeData: v581, commitFieldValue: v582 } = {},
) {
  if (!v580 || typeof v582 !== "function") return () => {};
  const v583 = (v584, v585) => {
    const v586 = typeof v581 === "function" ? v581() || {} : {},
      v587 = v582(v584, v585, v586),
      v588 =
        v587 && typeof v587 === "object"
          ? v587
          : typeof v581 === "function"
            ? v581() || v586
            : v586;
    syncModelUiSchemaControls(v580, { ...v586, ...v588 });
  };
  let v589 = null,
    v590 = false,
    v591 = null,
    v592 = false;
  const v593 = (v594) => {
      if (!v594?.["addEventListener"]) return false;
      let v595 = null;
      const v596 = () => {
          (v594["removeEventListener"]("click", v597, true),
            v595 && (clearTimeout(v595), (v595 = null)));
        },
        v597 = (v598) => {
          (v598["preventDefault"]?.(),
            v598["stopPropagation"]?.(),
            v598["stopImmediatePropagation"]?.(),
            v596());
        };
      return (
        v594["addEventListener"]("click", v597, true),
        (v595 = setTimeout(v596, 350)),
        true
      );
    },
    v599 = (v600, v601) => {
      const v602 = Number(v600);
      return Number["isFinite"](v602) ? v602 : v601;
    },
    v603 = (v604, v605) => {
      const v606 = v599(v604?.["dataset"]?.["uiSchemaDefault"], 0),
        v607 = v599(v604?.["dataset"]?.["uiSchemaMin"], -Infinity),
        v608 = v599(v604?.["dataset"]?.["uiSchemaMax"], Infinity),
        v609 = evaluateUiSchemaNumberExpression(v605),
        v610 = Number["isFinite"](v609) ? Math["trunc"](v609) : v606;
      return Math["max"](v607, Math["min"](v608, v610));
    },
    v611 = (v612, v613) => {
      const v614 = String(v612?.["dataset"]?.["uiSchemaField"] || "")["trim"]();
      return v614 === "rhVideoFrames" && Number(v613) === 0
        ? "全长"
        : String(v613);
    },
    v615 = (v616, v617) => {
      const v618 = v603(v616, v617),
        v619 = v616?.["querySelector"]?.(".rh-stepper-value");
      return (
        v619 &&
          ((v619["textContent"] = v611(v616, v618)),
          v619["setAttribute"]("aria-valuenow", String(v618))),
        v618
      );
    },
    v620 = (v621) => {
      const v622 = String(v621?.["dataset"]?.["uiSchemaField"] || "")["trim"](),
        v623 = typeof v581 === "function" ? v581() || {} : {};
      return v603(
        v621,
        getNodeFieldValue(
          v623,
          v622,
          v621?.["dataset"]?.["uiSchemaDefault"] ?? 0,
        ),
      );
    },
    v624 = (v625) => {
      const v626 = v625?.["closest"]?.(".ui-schema-rh-video-stepper"),
        v627 = String(v626?.["dataset"]?.["uiSchemaField"] || "")["trim"]();
      if (!v626 || !v627) return;
      const v628 = v620(v626),
        v629 = v580["ownerDocument"]?.["createElement"]?.("input");
      if (!v629) return;
      ((v629["className"] = "rh-stepper-input"),
        (v629["type"] = "text"),
        (v629["autocomplete"] = "off"),
        (v629["step"] = String(v626["dataset"]["uiSchemaStep"] || "1")),
        (v629["min"] = String(v626["dataset"]["uiSchemaMin"] || "0")),
        (v629["max"] = String(v626["dataset"]["uiSchemaMax"] || "")),
        (v629["value"] = String(v628)));
      let v630 = false;
      const v631 = (v632) => {
        if (v630) return;
        v630 = true;
        const v633 = v632 ? v603(v626, v629["value"]) : v628,
          v634 = v580["ownerDocument"]["createElement"]("div");
        ((v634["className"] = "rh-stepper-value"),
          v634["setAttribute"]("role", "spinbutton"),
          v634["setAttribute"]("tabindex", "0"),
          v634["setAttribute"](
            "aria-label",
            v625["getAttribute"]("aria-label") ||
              v626["querySelector"](".rh-vram-adv-label span")?.[
                "textContent"
              ] ||
              v627,
          ),
          (v634["textContent"] = v611(v626, v633)),
          v634["setAttribute"]("aria-valuenow", String(v633)),
          v629["replaceWith"](v634));
        if (v632) v583(v627, v633);
      };
      (v629["addEventListener"]("click", (v635) => v635["stopPropagation"]()),
        v629["addEventListener"]("mousedown", (v636) =>
          v636["stopPropagation"](),
        ),
        v629["addEventListener"]("keydown", (v637) => {
          if (v637["key"] === "Enter") v631(true);
          if (v637["key"] === "Escape") v631(false);
        }),
        v629["addEventListener"]("blur", () => v631(true)),
        v625["replaceWith"](v629),
        v629["focus"](),
        v629["select"]());
    },
    v638 = () => {
      if (!v591) return;
      (v591["el"]?.["classList"]?.["remove"]("is-dragging"),
        v591["doc"]?.["removeEventListener"]?.("mousemove", v639),
        v591["doc"]?.["removeEventListener"]?.("mouseup", v640),
        (v591 = null));
    },
    v639 = (v641) => {
      if (!v591) return;
      const v642 = v641["clientX"] - v591["x"];
      if (Math["abs"](v642) >= 2) v591["dragged"] = true;
      const v643 = Math["trunc"](v642 / 6),
        v644 = v603(v591["fieldEl"], v591["base"] + v643);
      v644 !== v591["last"] &&
        ((v591["moved"] = true),
        (v591["last"] = v644),
        v615(v591["fieldEl"], v644));
    },
    v640 = () => {
      if (!v591) return;
      const v645 = v591;
      (v638(),
        (v645["dragged"] || v645["moved"]) && (v592 = !v593(v645["doc"])),
        v645["moved"] && v583(v645["fieldId"], v645["last"]));
    },
    v646 = (v647, v648) => {
      const v649 = v599(v647?.["dataset"]?.["uiSchemaDefault"], 25),
        v650 = v599(v647?.["dataset"]?.["uiSchemaMin"], -9999),
        v651 = v599(v647?.["dataset"]?.["uiSchemaMax"], 9999),
        v652 = normalizeRhV54MaskExpand(v648, v649);
      return Math["max"](v650, Math["min"](v651, v652));
    },
    v653 = (v654, v655) => {
      const v656 = v646(v654, v655),
        v657 = v654?.["querySelector"]?.(".rh-stepper-value");
      return (
        v657 &&
          ((v657["textContent"] = String(v656)),
          v657["setAttribute"]("aria-valuenow", String(v656))),
        v656
      );
    },
    v658 = (v659) => {
      const v660 = String(v659?.["dataset"]?.["uiSchemaField"] || "")["trim"](),
        v661 = typeof v581 === "function" ? v581() || {} : {};
      return v646(
        v659,
        getNodeFieldValue(
          v661,
          v660,
          v659?.["dataset"]?.["uiSchemaDefault"] ?? 25,
        ),
      );
    },
    v662 = (v663) => {
      const v664 = v663?.["closest"]?.(".ui-schema-rh-v54-mask-expand"),
        v665 = String(v664?.["dataset"]?.["uiSchemaField"] || "")["trim"]();
      if (!v664 || !v665 || v664["classList"]?.["contains"]("is-rh-disabled"))
        return;
      const v666 = v658(v664),
        v667 = v580["ownerDocument"]?.["createElement"]?.("input");
      if (!v667) return;
      ((v667["className"] = "rh-stepper-input"),
        (v667["type"] = "number"),
        (v667["step"] = String(v664["dataset"]["uiSchemaStep"] || "1")),
        (v667["min"] = String(v664["dataset"]["uiSchemaMin"] || "-9999")),
        (v667["max"] = String(v664["dataset"]["uiSchemaMax"] || "9999")),
        (v667["value"] = String(v666)));
      let v668 = false;
      const v669 = (v670) => {
        if (v668) return;
        v668 = true;
        const v671 = v670 ? v646(v664, v667["value"]) : v666,
          v672 = v580["ownerDocument"]["createElement"]("div");
        ((v672["className"] = "rh-stepper-value"),
          v672["setAttribute"]("role", "spinbutton"),
          v672["setAttribute"]("tabindex", "0"),
          v672["setAttribute"](
            "aria-label",
            v663["getAttribute"]("aria-label") || "外扩遮罩数值",
          ),
          (v672["textContent"] = String(v671)),
          v672["setAttribute"]("aria-valuenow", String(v671)),
          v667["replaceWith"](v672));
        if (v670) v583(v665, v671);
      };
      (v667["addEventListener"]("click", (v673) => v673["stopPropagation"]()),
        v667["addEventListener"]("mousedown", (v674) =>
          v674["stopPropagation"](),
        ),
        v667["addEventListener"]("keydown", (v675) => {
          if (v675["key"] === "Enter") v669(true);
          if (v675["key"] === "Escape") v669(false);
        }),
        v667["addEventListener"]("blur", () => v669(true)),
        v663["replaceWith"](v667),
        v667["focus"](),
        v667["select"]());
    },
    v676 = () => {
      if (!v589) return;
      (v589["el"]?.["classList"]?.["remove"]("is-dragging"),
        v589["doc"]?.["removeEventListener"]?.("mousemove", v677),
        v589["doc"]?.["removeEventListener"]?.("mouseup", v678),
        (v589 = null));
    },
    v677 = (v679) => {
      if (!v589) return;
      const v680 = v679["clientX"] - v589["x"];
      if (Math["abs"](v680) >= 2) v589["dragged"] = true;
      const v681 = Math["trunc"](v680 / 6),
        v682 = v646(v589["fieldEl"], v589["base"] + v681);
      v682 !== v589["last"] &&
        ((v589["moved"] = true),
        (v589["last"] = v682),
        v653(v589["fieldEl"], v682));
    },
    v678 = () => {
      if (!v589) return;
      const v683 = v589;
      (v676(),
        (v683["dragged"] || v683["moved"]) && (v590 = !v593(v683["doc"])),
        v683["moved"] && v583(v683["fieldId"], v683["last"]));
    },
    v684 = (v685) => {
      const v686 = v685["target"]?.["closest"]?.(
        ".ui-schema-rh-video-stepper .rh-stepper-value",
      );
      if (v686 && v685["button"] === 0) {
        const v687 = v686["closest"](".ui-schema-rh-video-stepper"),
          v688 = String(v687?.["dataset"]?.["uiSchemaField"] || "")["trim"]();
        if (!v687 || !v688) return;
        const v689 = v580["ownerDocument"] || globalThis["document"];
        if (!v689) return;
        (v685["preventDefault"](), v685["stopPropagation"]());
        const v690 = v620(v687);
        (v638(),
          (v591 = {
            x: v685["clientX"],
            base: v690,
            last: v690,
            moved: false,
            dragged: false,
            fieldEl: v687,
            fieldId: v688,
            el: v686,
            doc: v689,
          }),
          v686["classList"]["add"]("is-dragging"),
          v689["addEventListener"]("mousemove", v639),
          v689["addEventListener"]("mouseup", v640));
        return;
      }
      const v691 = v685["target"]?.["closest"]?.(
        ".ui-schema-rh-v54-mask-expand\x20.rh-stepper-value",
      );
      if (!v691 || v685["button"] !== 0) return;
      const v692 = v691["closest"](".ui-schema-rh-v54-mask-expand"),
        v693 = String(v692?.["dataset"]?.["uiSchemaField"] || "")["trim"]();
      if (!v692 || !v693 || v692["classList"]?.["contains"]("is-rh-disabled"))
        return;
      const v694 = v580["ownerDocument"] || globalThis["document"];
      if (!v694) return;
      (v685["preventDefault"](), v685["stopPropagation"]());
      const v695 = v658(v692);
      (v676(),
        (v589 = {
          x: v685["clientX"],
          base: v695,
          last: v695,
          moved: false,
          dragged: false,
          fieldEl: v692,
          fieldId: v693,
          el: v691,
          doc: v694,
        }),
        v691["classList"]["add"]("is-dragging"),
        v694["addEventListener"]("mousemove", v677),
        v694["addEventListener"]("mouseup", v678));
    },
    v696 = (v697) => {
      const v698 = v697["target"]?.["closest"]?.(
        ".ui-schema-rh-video-stepper .rh-stepper-value",
      );
      if (v698) {
        v697["stopPropagation"]();
        if (v592) {
          v592 = false;
          return;
        }
        v624(v698);
        return;
      }
      const v699 = v697["target"]?.["closest"]?.(
        ".ui-schema-rh-v54-mask-expand .rh-stepper-value",
      );
      if (v699) {
        v697["stopPropagation"]();
        if (v590) {
          v590 = false;
          return;
        }
        v662(v699);
        return;
      }
      const v700 = v697["target"]?.["closest"]?.(
        "[data-ui-schema-menu-trigger]",
      );
      if (v700) {
        v697["stopPropagation"]();
        const v701 = v700["closest"](
            "[data-ui-schema-field], [data-ui-schema-composite-field]",
          ),
          v702 =
            v701?.["querySelector"](".ui-schema-floating-menu") ||
            v701?.["querySelector"](".ui-schema-popup"),
          v703 = v702?.["classList"]?.["contains"]("floating-menu")
            ? !v702["classList"]["contains"]("show")
            : v702
              ? v702["style"]["display"] === "none"
              : false;
        (v580["dispatchEvent"](
          new CustomEvent("ui-schema-menu-before-open", {
            detail: { fieldEl: v701, popup: v702, shouldOpen: v703 },
          }),
        ),
          v580["querySelectorAll"](".ui-schema-floating-menu")["forEach"](
            (v704) => {
              if (v704 !== v702) v704["classList"]["remove"]("show");
            },
          ),
          v580["querySelectorAll"](".ui-schema-popup")["forEach"]((v705) => {
            if (v705 === v702) return;
            if (v705["classList"]?.["contains"]("floating-menu")) {
              (v705["classList"]["remove"]("show"),
                (v705["style"]["display"] = ""));
              return;
            }
            v705["style"]["display"] = "none";
          }));
        if (v702?.["classList"]?.["contains"]("floating-menu"))
          ((v702["style"]["display"] = ""),
            v702["classList"]["toggle"]("show", v703));
        else
          v702 &&
            (v702["style"]["display"] = v703
              ? v702["classList"]?.["contains"]("ui-schema-duration-pop")
                ? "flex"
                : "block"
              : "none");
        return;
      }
      v697["target"]?.["closest"]?.(
        ".ui-schema-popup, .ui-schema-floating-menu, .img-ratio-popup, .rh-res-popup",
      ) && v697["stopPropagation"]();
      const v706 = v697["target"]?.["closest"]?.("[data-ui-schema-field]");
      if (!v706) return;
      const v707 = String(v706["dataset"]["uiSchemaField"] || "")["trim"]();
      if (!v707) return;
      const v708 = v697["target"]["closest"]("[data-ui-schema-value]");
      if (!v708) return;
      if (
        v708["dataset"]["uiSchemaDisabled"] === "true" ||
        v708["disabled"] === true
      )
        return;
      v697["stopPropagation"]();
      const v709 = String(v706["dataset"]["uiSchemaType"] || ""),
        v710 = v708["dataset"]["uiSchemaValue"],
        v711 =
          v706["dataset"]["uiSchemaValueType"] === "boolean"
            ? v710 === "true"
            : v706["dataset"]["uiSchemaValueType"] === "number"
              ? Number(v710)
              : v709 === "toggle"
                ? v710 === "true"
                : v710;
      (v706["querySelectorAll"]("[data-ui-schema-value]")["forEach"]((v712) =>
        v712["classList"]["remove"]("active"),
      ),
        v708["classList"]["add"]("active"));
      const v713 = v706["querySelector"](
        ".ui-schema-menu-trigger .ui-schema-pill-label",
      );
      if (v713) {
        const v714 =
          v708["dataset"]["uiSchemaOptionLabel"] ||
          v708["textContent"]?.["trim"]?.() ||
          String(v711);
        v713["textContent"] = v714;
      }
      (syncInstanceToggleField(v706, v711),
        v583(v707, v711),
        v708["closest"](".floating-menu")?.["classList"]["remove"]("show"));
    },
    v715 = (v716) => {
      const v717 = v716["target"]?.["closest"]?.("[data-ui-schema-input]");
      if (!v717) return;
      const v718 = String(v717["dataset"]["uiSchemaInput"] || "")["trim"]();
      if (!v718) return;
      const v719 = v717["closest"]("[data-ui-schema-range-values]")
          ?.["dataset"]["uiSchemaRangeValues"]?.["split"](",")
          ["map"]((v720) => Number(v720))
          ["filter"](Number["isFinite"]),
        v721 =
          v717["type"] === "range" && v719?.["length"]
            ? v719[
                Math["max"](
                  0,
                  Math["min"](v719["length"] - 1, Number(v717["value"])),
                )
              ]
            : v717["type"] === "range" || v717["type"] === "number"
              ? Number(v717["value"])
              : v717["value"],
        v722 =
          v717["closest"](".ui-schema-field")?.["querySelector"](
            ".ui-schema-value",
          );
      if (v722) v722["textContent"] = String(v721);
      const v723 = v717["closest"](".ui-schema-rh-v54-breast-jiggle"),
        v724 = v723?.["querySelector"](".rh-breast-jiggle-value");
      v724 &&
        (v724["textContent"] = formatRhV54BreastJiggle(
          v721,
          getRhV54BreastJiggleRangeFromFieldEl(v723),
        ));
      const v725 = v717["closest"](".ui-schema-duration-pill")?.[
        "querySelector"
      ](".ui-schema-duration-label");
      if (v725) v725["textContent"] = v721 + "S";
      const v726 = v717["closest"](".ui-schema-field")?.["querySelector"](
          ".ui-schema-pill-label",
        ),
        v727 =
          v717["closest"](".ui-schema-field")?.["querySelector"](
            ".rh-res-title",
          );
      if (v726 && v727) {
        const v728 = v726["querySelector"](".ui-schema-resolution-value");
        v728
          ? (v728["textContent"] = String(v721))
          : (v726["textContent"] =
              (v727["textContent"] || "Resolution") + "\x20" + v721);
      }
      v583(v718, v721);
    };
  return (
    v580["addEventListener"]("click", v696, true),
    v580["addEventListener"]("mousedown", v684, true),
    v580["addEventListener"]("input", v715),
    v580["addEventListener"]("change", v715),
    () => {
      (v676(),
        v638(),
        v580["removeEventListener"]("click", v696, true),
        v580["removeEventListener"]("mousedown", v684, true),
        v580["removeEventListener"]("input", v715),
        v580["removeEventListener"]("change", v715));
    }
  );
}
export function bindModelUiSchemaControls(
  v729,
  {
    nodeId: v730,
    nodeData: v731,
    store: v732,
    buildPatch: v733,
    decorateNodeData: v734,
    afterCommit: v735,
  } = {},
) {
  if (!v729 || !v732 || !v730) return () => {};
  const v736 = () => {
    const v737 = v732["getState"]?.()["nodes"]?.[v730] || v731 || {};
    return typeof v734 === "function" ? v734(v737) : v737;
  };
  return bindUiSchemaControls(v729, {
    getNodeData: v736,
    commitFieldValue: (v738, v739, v740) => {
      const v741 = buildUiSchemaParamPatch(v740, v738, v739),
        v742 = typeof v733 === "function" ? v733(v740, v738, v739, v741) : {},
        v743 = { ...v741, ...(v742 && typeof v742 === "object" ? v742 : {}) };
      v732["updateNodeData"](v730, v743);
      const v744 = { ...v740, ...v743 },
        v745 = typeof v734 === "function" ? v734(v744) : v744;
      return (v735?.(v738, v739, v745, { latest: v740, patch: v743 }), v745);
    },
  });
}
export function bindUiSchemaFieldControls(
  v746,
  { getNodeData: v747, commitFieldValue: v748 } = {},
) {
  return bindUiSchemaControls(v746, {
    getNodeData: v747,
    commitFieldValue: v748,
  });
}
export function syncModelUiSchemaControls(v749, v750 = {}) {
  if (!v749) return;
  (syncDynamicOptionDisabled(v749, v750),
    v749["querySelectorAll"]("[data-ui-schema-field]")["forEach"]((v751) => {
      const v752 = String(v751["dataset"]["uiSchemaField"] || "")["trim"]();
      if (!v752) return;
      let v753 = getNodeFieldValue(
        v750,
        v752,
        v751["dataset"]["uiSchemaDefault"],
      );
      const v754 = String(v751["dataset"]["uiSchemaDefaultAliases"] || "")[
        "trim"
      ]();
      if (v754)
        try {
          const v755 = JSON["parse"](v754)
            ["map"]((v756) =>
              String(v756 ?? "")
                ["trim"]()
                ["toLowerCase"](),
            )
            ["filter"](Boolean);
          v755["includes"](
            String(v753 ?? "")
              ["trim"]()
              ["toLowerCase"](),
          ) && (v753 = v751["dataset"]["uiSchemaDefault"]);
        } catch {}
      const v757 = v751["querySelector"](
        '[data-ui-schema-value="' + escapeCssString(v753) + "\x22]",
      );
      if (v757?.["dataset"]?.["uiSchemaDisabled"] === "true") {
        const v758 = v751["dataset"]["uiSchemaDefault"],
          v759 = v751["querySelector"](
            "[data-ui-schema-value=\x22" + escapeCssString(v758) + "\x22]",
          ),
          v760 =
            v759?.["dataset"]?.["uiSchemaDisabled"] === "true"
              ? v751["querySelector"](
                  '[data-ui-schema-value]:not([data-ui-schema-disabled="true"])',
                )
              : v759;
        v760?.["dataset"]?.["uiSchemaValue"] !== undefined &&
          (v753 = v760["dataset"]["uiSchemaValue"]);
      }
      v751["querySelectorAll"]("[data-ui-schema-value]")["forEach"]((v761) => {
        v761["classList"]["toggle"](
          "active",
          String(v761["dataset"]["uiSchemaValue"]) === String(v753),
        );
      });
      const v762 = v751["querySelector"](
          "[data-ui-schema-value=\x22" + escapeCssString(v753) + "\x22]",
        ),
        v763 = v751["querySelector"](".ui-schema-pill-label");
      v763 &&
        v762?.["dataset"]?.["uiSchemaOptionLabel"] &&
        (v763["textContent"] = v762["dataset"]["uiSchemaOptionLabel"]);
      (syncInstanceToggleField(v751, v753), syncStepperField(v751, v753));
      const v764 = v751["querySelector"]("[data-ui-schema-input]");
      if (v764 && v753 !== undefined) {
        const v765 = v751["dataset"]["uiSchemaRangeValues"]
          ?.["split"](",")
          ["map"]((v766) => Number(v766))
          ["filter"](Number["isFinite"]);
        v764["value"] = v765?.["length"]
          ? String(Math["max"](0, v765["indexOf"](Number(v753))))
          : String(v753);
        const v767 = v751["querySelector"](".ui-schema-value");
        if (v767) v767["textContent"] = String(v753);
        const v768 = v751["querySelector"](".ui-schema-duration-label");
        if (v768) v768["textContent"] = v753 + "S";
        const v769 = v751["querySelector"](".ui-schema-pill-label"),
          v770 = v769?.["querySelector"](".ui-schema-resolution-value");
        if (v770) v770["textContent"] = String(v753);
        else {
          if (v751["classList"]?.["contains"]("ui-schema-resolution-pill")) {
            const v771 =
              v751["querySelector"](".rh-res-title")?.["textContent"] ||
              "Resolution";
            if (v769) v769["textContent"] = v771 + "\x20" + v753;
          }
        }
      }
      syncRhV54CustomField(v751, v750);
    }),
    syncCompositeUiSchemaControls(v749, v750));
}
function syncDynamicOptionDisabled(v772, v773 = {}) {
  v772["querySelectorAll"](
    "[data-ui-schema-disable-when-field],\x20[data-ui-schema-disable-when-json]",
  )["forEach"]((v774) => {
    const v775 = String(v774["dataset"]["uiSchemaDisableWhenField"] || "")[
        "trim"
      ](),
      v776 = String(v774["dataset"]["uiSchemaDisableWhenValues"] || "")
        ["split"](",")
        ["map"](normalizeCompareValue)
        ["filter"](Boolean);
    let v777 = false;
    const v778 = String(v774["dataset"]["uiSchemaDisableWhenJson"] || "")[
      "trim"
    ]();
    if (v778)
      try {
        v777 = optionDisableWhenMatches(JSON["parse"](v778), v773);
      } catch {
        v777 = false;
      }
    else
      v777 =
        v775 &&
        v776["includes"](
          normalizeCompareValue(getNodeFieldValue(v773, v775, "")),
        );
    const v779 =
        v774["dataset"]["uiSchemaStaticDisabled"] === "true" ||
        v774["hasAttribute"]("data-ui-schema-static-disabled"),
      v780 = Boolean(v779 || v777);
    v774["classList"]?.["toggle"]("disabled", v780);
    if (v780) {
      ((v774["dataset"]["uiSchemaDisabled"] = "true"),
        v774["setAttribute"]("aria-disabled", "true"));
      if ("disabled" in v774) v774["disabled"] = true;
    } else {
      (delete v774["dataset"]["uiSchemaDisabled"],
        v774["removeAttribute"]("data-ui-schema-disabled"),
        v774["removeAttribute"]("aria-disabled"));
      if ("disabled" in v774) v774["disabled"] = false;
    }
  });
}
function syncRhV54CustomField(v781, v782 = {}) {
  const v783 = String(v781?.["dataset"]?.["uiSchemaField"] || "")["trim"](),
    v784 = String(v781?.["dataset"]?.["rhV54DisableOnSpecial"] || "")["trim"](),
    v785 =
      v784 &&
      normalizeRhV54SpecialMode(
        getNodeFieldValue(v782, "rhSpecialMode", ""),
      ) === v784,
    v786 = v783 === "rhSubtractSubject" && v782?.["rhV54HasMaskVideo"] === true;
  (v784 || v786) &&
    v781["classList"]["toggle"]("is-rh-disabled", Boolean(v785 || v786));
  if (v781["classList"]?.["contains"]("ui-schema-rh-v54-control-mode")) {
    const v787 = String(
        getNodeFieldValue(v782, "rhControlMode", "single") || "single",
      ),
      v788 = normalizeRhV54SinglePreset(
        getNodeFieldValue(v782, "rhSingleControlPreset", "efficiency"),
      );
    (v781["querySelectorAll"]('[data-key="rhSingleControlPreset"]')["forEach"](
      (v789) =>
        v789["classList"]["toggle"](
          "active",
          v787 !== "multi" && v789["dataset"]["value"] === v788,
        ),
    ),
      v781["querySelectorAll"]("[data-key=\x22rhControlMode\x22]")["forEach"](
        (v790) =>
          v790["classList"]["toggle"](
            "active",
            v787 === "multi" && v790["dataset"]["value"] === "multi",
          ),
      ),
      v781["querySelector"](".rh-adv-single-group")?.["classList"]["toggle"](
        "active",
        v787 !== "multi",
      ),
      v781["querySelector"](".rh-adv-multi-group")?.["classList"]["toggle"](
        "active",
        v787 === "multi",
      ));
  }
  if (v781["classList"]?.["contains"]("ui-schema-rh-v54-mask-expand")) {
    const v791 = normalizeRhV54MaskExpand(
        getNodeFieldValue(
          v782,
          "rhMaskExpand",
          v781["dataset"]["uiSchemaDefault"] || 25,
        ),
        Number(v781["dataset"]["uiSchemaDefault"] || 25),
      ),
      v792 = v781["querySelector"](".rh-stepper-value");
    v792 &&
      ((v792["textContent"] = String(v791)),
      v792["setAttribute"]("aria-valuenow", String(v791)));
  }
  if (v781["classList"]?.["contains"]("ui-schema-rh-v54-breast-jiggle")) {
    const v793 = String(v781["dataset"]["uiSchemaField"] || "")["trim"](),
      v794 = formatRhV54BreastJiggle(
        getNodeFieldValue(v782, v793, v781["dataset"]["uiSchemaDefault"] || 0),
        getRhV54BreastJiggleRangeFromFieldEl(v781),
      ),
      v795 = v781["querySelector"](".rh-breast-jiggle-slider");
    if (v795) v795["value"] = v794;
    const v796 = v781["querySelector"](".rh-breast-jiggle-value");
    if (v796) v796["textContent"] = v794;
  }
}
function getSyncedFieldValue(v797, v798 = {}) {
  const v799 = String(v797?.["dataset"]?.["uiSchemaField"] || "")["trim"]();
  if (!v799) return "";
  const v800 = getNodeFieldValue(
      v798,
      v799,
      v797?.["dataset"]?.["uiSchemaDefault"] ?? "",
    ),
    v801 = v797?.["querySelector"]?.(
      '[data-ui-schema-value="' + escapeCssString(v800) + "\x22]",
    );
  if (v801?.["dataset"]?.["uiSchemaDisabled"] !== "true") return v800;
  const v802 = v797?.["dataset"]?.["uiSchemaDefault"] ?? "",
    v803 = v797?.["querySelector"]?.(
      "[data-ui-schema-value=\x22" + escapeCssString(v802) + "\x22]",
    );
  if (v803?.["dataset"]?.["uiSchemaDisabled"] !== "true") return v802;
  const v804 = v797?.["querySelector"]?.(
    "[data-ui-schema-value]:not([data-ui-schema-disabled=\x22true\x22])",
  );
  return v804?.["dataset"]?.["uiSchemaValue"] ?? v800;
}
function getSyncedOptionLabel(v805, v806, { adaptive: adaptive = false } = {}) {
  const v807 = v805?.["querySelector"]?.(
      '[data-ui-schema-value="' + escapeCssString(v806) + "\x22]",
    ),
    v808 = String(
      v807?.["dataset"]?.["uiSchemaOptionLabel"] ||
        v807?.["textContent"] ||
        v806 ||
        "",
    )["trim"](),
    v809 = v808["toLowerCase"](),
    v810 = String(v806 || "")
      ["trim"]()
      ["toLowerCase"]();
  if (
    adaptive &&
    (v809 === "auto" ||
      v809 === "adaptive" ||
      v809 === "自适应" ||
      v810 === "auto" ||
      v810 === "adaptive" ||
      v810 === "自适应")
  )
    return "自适应";
  return v808;
}
function syncQualityRatioComposite(v811, v812 = {}) {
  const v813 = v811?.["querySelector"]?.(
      '[data-ui-schema-field="aspectRatio"]',
    ),
    v814 =
      v811?.["querySelector"]?.('[data-ui-schema-field="imageSize"]') ||
      v811?.["querySelector"]?.('[data-ui-schema-field="resolution"]') ||
      v811?.["querySelector"]?.("[data-ui-schema-field=\x22videoSize\x22]") ||
      v811?.["querySelector"]?.('[data-ui-schema-field="quality"]'),
    v815 = Array["from"](
      v811?.["querySelectorAll"]?.("[data-ui-schema-field]") || [],
    )["filter"]((v816) => v816 !== v813);
  v815["length"] === 0 && v814 && v815["push"](v814);
  const v817 = v811?.["querySelector"]?.(".ui-schema-quality-ratio-label");
  if (!v815["length"] || !v813 || !v817) return;
  const v818 = getSyncedFieldValue(v813, v812),
    v819 = v815["map"]((v820) =>
      getSyncedOptionLabel(v820, getSyncedFieldValue(v820, v812)),
    ),
    v821 = getSyncedOptionLabel(v813, v818, { adaptive: true });
  v817["textContent"] =
    v819["length"] > 1
      ? [...v819, v821]["join"](" · ")
      : String(v811?.["dataset"]?.["uiSchemaLabelOrder"] || "")["trim"]() ===
          "fieldFirst"
        ? (v819[0] || "") + " · " + v821
        : v821 + " · " + (v819[0] || "");
}
function syncSectionPairComposite(v822, v823 = {}) {
  const v824 = Array["from"](
      v822?.["querySelectorAll"]?.("[data-ui-schema-field]") || [],
    ),
    v825 = v822?.["querySelector"]?.(".ui-schema-section-pair-label");
  if (v824["length"] < 2 || !v825) return;
  const v826 = v824["map"]((v827) =>
    getSyncedOptionLabel(v827, getSyncedFieldValue(v827, v823)),
  )["filter"](Boolean);
  v826["length"] >= 2 && (v825["textContent"] = v826["join"](" · "));
}
function syncVideoResolutionComposite(v828, v829 = {}) {
  const v830 =
      v828?.["querySelector"]?.(
        "[data-ui-schema-field=\x22rhVideoResolution\x22]",
      ) ||
      v828?.["querySelector"]?.('[data-ui-schema-field="videoResolution"]'),
    v831 = v828?.["querySelector"]?.(".ui-schema-video-resolution-label");
  if (!v830 || !v831) return;
  const v832 = v828["querySelector"]('[data-ui-schema-field="rhVideoFps"]'),
    v833 = v828["querySelector"]('[data-ui-schema-field="rhVideoFrames"]'),
    v834 = getSyncedFieldValue(v830, v829);
  if (!v832 || !v833) {
    v831["textContent"] = "分辨率" + v834;
    return;
  }
  const v835 = getSyncedFieldValue(v832, v829),
    v836 = getSyncedFieldValue(v833, v829),
    v837 = Number(v836) === 0 ? "全长" : String(v836 || "");
  v831["textContent"] = "帧数" + v837 + "·帧率" + v835 + "·分辨率" + v834;
}
function syncRhVideoParamsComposite(v838, v839 = {}) {
  const v840 = v838?.["querySelector"]?.(".img-ratio-label"),
    v841 = Array["from"](
      v838?.["querySelectorAll"]?.("[data-ui-schema-field]") || [],
    )["map"]((v842) => ({
      id: v842["dataset"]["uiSchemaField"],
      defaultValue: v842["dataset"]["uiSchemaDefault"],
      min: v842["dataset"]["uiSchemaMin"],
      max: v842["dataset"]["uiSchemaMax"],
    })),
    v843 = (v844) => v841["find"]((v845) => v845["id"] === v844),
    v846 = v843("rhVideoResolution"),
    v847 = v843("rhVideoFps"),
    v848 = v843("rhVideoFrames"),
    v849 = v843("rhVideoSeconds"),
    v850 = (v851, v852, v853 = {}) =>
      normalizeNumberValue(
        getNodeFieldValue(v839, v851?.["id"], v851?.["defaultValue"] ?? v852),
        Number(v852),
        v853,
      ),
    v854 = v846 ? v850(v846, v846["defaultValue"] || 832, { min: 832 }) : 832;
  if (v840 && v849) {
    const v855 = v847 ? v850(v847, v847["defaultValue"] || 24) : 24,
      v856 = v850(v849, v849["defaultValue"] || 5, {
        min: Number(v849["min"] || 1),
        max: Number(v849["max"] || 600),
      });
    v840["textContent"] = "秒数" + v856 + "·帧率" + v855 + "·分辨率" + v854;
  } else {
    if (v840 && v848) {
      const v857 = v850(v848, v848["defaultValue"] || 77, {
          min: Number(v848["min"] || 0),
          max: Number(v848["max"] || 999999),
        }),
        v858 = v857 === 0 ? "全长" : String(v857);
      if (v847) {
        const v859 = v850(v847, v847["defaultValue"] || 24);
        v840["textContent"] = "帧数" + v858 + "·帧率" + v859 + "·分辨率" + v854;
      } else v840["textContent"] = "帧数" + v858 + "·分辨率" + v854;
    } else v840 && (v840["textContent"] = "分辨率" + v854);
  }
  const v860 = v838?.["querySelector"]?.(
    '[data-ui-schema-field="rhVideoFrames"] .rh-stepper-value',
  );
  if (v848 && v860) {
    const v861 = v850(v848, v848["defaultValue"] || 77, {
      min: Number(v848["min"] || 0),
      max: Number(v848["max"] || 999999),
    });
    ((v860["textContent"] = v861 === 0 ? "全长" : String(v861)),
      v860["setAttribute"]("aria-valuenow", String(v861)));
  }
  const v862 = v838?.["querySelector"]?.(
    '[data-ui-schema-field="rhVideoSeconds"] .rh-stepper-value',
  );
  if (v849 && v862) {
    const v863 = v850(v849, v849["defaultValue"] || 5, {
      min: Number(v849["min"] || 1),
      max: Number(v849["max"] || 600),
    });
    ((v862["textContent"] = String(v863)),
      v862["setAttribute"]("aria-valuenow", String(v863)));
  }
  const v864 = v838?.["querySelector"]?.(".rh-v5-source-framecount");
  if (v864) {
    const v865 = Number(v839?.["rhVideoSourceFrameCount"] || 0);
    v864["textContent"] = v865 ? String(v865) : "—";
  }
}
function syncCompositeUiSchemaControls(v866, v867 = {}) {
  (v866["querySelectorAll"]('[data-ui-schema-composite-field="qualityRatio"]')[
    "forEach"
  ]((v868) => syncQualityRatioComposite(v868, v867)),
    v866["querySelectorAll"]('[data-ui-schema-composite-field="sectionPair"]')[
      "forEach"
    ]((v869) => syncSectionPairComposite(v869, v867)),
    v866["querySelectorAll"](
      "[data-ui-schema-composite-field=\x22videoResolution\x22]",
    )["forEach"]((v870) => syncVideoResolutionComposite(v870, v867)),
    v866["querySelectorAll"](
      '[data-ui-schema-composite-field="rhVideoParams"]',
    )["forEach"]((v871) => syncRhVideoParamsComposite(v871, v867)));
}
