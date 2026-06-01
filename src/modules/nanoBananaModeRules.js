import {
  getModelsByKind,
  normalizeProviderId as normalizeProviderId,
  resolveModelExecution,
} from "../manifests/index.js";
const DEFAULT_IMAGE_SIZE = "2K";
export const NANO_BANANA_FAMILIES = Object["freeze"]({
  NANOBANANA: "nanobanana",
  NANOBANANA_PRO: "nanobanana-pro",
  NANOBANANA_2: "nanobanana-2",
  GPT_IMAGE_2: "gpt-image-2",
});
export const NANO_BANANA_MODES = Object["freeze"]({
  NORMAL: "normal",
  FAST: "fast",
  VT: "vt",
  CL: "cl",
  VIP: "vip",
  OFFICIAL: "official",
});
const NANO_BANANA_MODE_OPTIONS = Object["freeze"]({
    [NANO_BANANA_FAMILIES["NANOBANANA"]]: Object["freeze"]([
      Object["freeze"]({
        mode: NANO_BANANA_MODES["NORMAL"],
        label: "常规",
        tooltip: "",
      }),
      Object["freeze"]({
        mode: NANO_BANANA_MODES["FAST"],
        label: "快速",
        tooltip: "",
      }),
    ]),
    [NANO_BANANA_FAMILIES["NANOBANANA_PRO"]]: Object["freeze"]([
      Object["freeze"]({
        mode: NANO_BANANA_MODES["NORMAL"],
        label: "常规",
        tooltip: "低价线路",
      }),
      Object["freeze"]({
        mode: NANO_BANANA_MODES["VT"],
        label: "VT",
        tooltip: "",
      }),
      Object["freeze"]({
        mode: NANO_BANANA_MODES["CL"],
        label: "CL",
        tooltip: "",
      }),
      Object["freeze"]({
        mode: NANO_BANANA_MODES["VIP"],
        label: "VIP",
        tooltip: "",
      }),
    ]),
    [NANO_BANANA_FAMILIES["NANOBANANA_2"]]: Object["freeze"]([
      Object["freeze"]({
        mode: NANO_BANANA_MODES["NORMAL"],
        label: "常规",
        tooltip: "低价线路",
      }),
      Object["freeze"]({
        mode: NANO_BANANA_MODES["CL"],
        label: "CL",
        tooltip: "低价线路2",
      }),
    ]),
  }),
  RUNNINGHUB_NANO_BANANA_MODE_OPTIONS = Object["freeze"]([
    Object["freeze"]({
      mode: NANO_BANANA_MODES["NORMAL"],
      label: "低价版",
      tooltip: "高性价比线路",
    }),
    Object["freeze"]({
      mode: NANO_BANANA_MODES["OFFICIAL"],
      label: "官方版",
      tooltip: "官方直连线路",
    }),
  ]),
  DEFAULT_RATIO_OPTIONS = Object["freeze"]([
    Object["freeze"]({ label: "1:1", w: 1, h: 1, value: 1 }),
    Object["freeze"]({ label: "9:16", w: 9, h: 16, value: 9 / 16 }),
    Object["freeze"]({ label: "16:9", w: 16, h: 9, value: 16 / 9 }),
    Object["freeze"]({ label: "3:4", w: 3, h: 4, value: 3 / 4 }),
    Object["freeze"]({ label: "4:3", w: 4, h: 3, value: 4 / 3 }),
    Object["freeze"]({ label: "3:2", w: 3, h: 2, value: 3 / 2 }),
    Object["freeze"]({ label: "2:3", w: 2, h: 3, value: 2 / 3 }),
    Object["freeze"]({ label: "5:4", w: 5, h: 4, value: 5 / 4 }),
    Object["freeze"]({ label: "4:5", w: 4, h: 5, value: 4 / 5 }),
    Object["freeze"]({ label: "21:9", w: 21, h: 9, value: 21 / 9 }),
  ]),
  NANO_BANANA_2_EXTRA_RATIO_OPTIONS = Object["freeze"]([
    Object["freeze"]({ label: "1:4", w: 1, h: 4, value: 1 / 4 }),
    Object["freeze"]({ label: "4:1", w: 4, h: 1, value: 4 }),
    Object["freeze"]({ label: "1:8", w: 1, h: 8, value: 1 / 8 }),
    Object["freeze"]({ label: "8:1", w: 8, h: 1, value: 8 }),
  ]),
  GPT_IMAGE_2_RATIO_OPTIONS = Object["freeze"]([
    Object["freeze"]({ label: "1:1", w: 1, h: 1, value: 1 }),
    Object["freeze"]({ label: "3:2", w: 3, h: 2, value: 3 / 2 }),
    Object["freeze"]({ label: "2:3", w: 2, h: 3, value: 2 / 3 }),
    Object["freeze"]({ label: "4:3", w: 4, h: 3, value: 4 / 3 }),
    Object["freeze"]({ label: "3:4", w: 3, h: 4, value: 3 / 4 }),
    Object["freeze"]({ label: "5:4", w: 5, h: 4, value: 5 / 4 }),
    Object["freeze"]({ label: "4:5", w: 4, h: 5, value: 4 / 5 }),
    Object["freeze"]({ label: "16:9", w: 16, h: 9, value: 16 / 9 }),
    Object["freeze"]({ label: "9:16", w: 9, h: 16, value: 9 / 16 }),
    Object["freeze"]({ label: "2:1", w: 2, h: 1, value: 2 }),
    Object["freeze"]({ label: "1:2", w: 1, h: 2, value: 1 / 2 }),
    Object["freeze"]({ label: "21:9", w: 21, h: 9, value: 21 / 9 }),
    Object["freeze"]({ label: "9:21", w: 9, h: 21, value: 9 / 21 }),
  ]);
function normalizeModelToken(v0) {
  return String(v0 || "")
    ["trim"]()
    ["toLowerCase"]();
}
function normalizeProvider(v1) {
  return normalizeProviderId(v1);
}
function collectStringValues(v2, v3 = []) {
  if (typeof v2 === "string") {
    const v4 = normalizeModelToken(v2);
    if (v4) v3["push"](v4);
    return v3;
  }
  if (Array["isArray"](v2))
    return (v2["forEach"]((v5) => collectStringValues(v5, v3)), v3);
  return (
    v2 &&
      typeof v2 === "object" &&
      Object["values"](v2)["forEach"]((v6) => collectStringValues(v6, v3)),
    v3
  );
}
function getExecutionModelTokens(v7) {
  return collectStringValues([
    v7?.["model"],
    v7?.["routeModels"],
    v7?.["modeModels"],
    v7?.["imageSizeModels"],
  ]);
}
function getNanoBananaExtension(v8) {
  const v9 = v8?.["extensions"]?.["nanoBanana"];
  if (!v9 || typeof v9 !== "object") return null;
  const v10 = String(v9["family"] || "")["trim"](),
    v11 = normalizeMode(v9["mode"]);
  if (!isNanoBananaFamily(v10)) return null;
  return { family: v10, mode: v11 };
}
function getNanoBananaManifestRecords(v12 = "") {
  const v13 = normalizeProvider(v12);
  return getModelsByKind("image")
    ["map"]((v14) => ({
      manifest: v14,
      provider: normalizeProvider(v14?.["provider"]),
      nanoBanana: getNanoBananaExtension(v14),
      imageSizePolicy: v14?.["extensions"]?.["imageSizePolicy"] || null,
      executionManifest: resolveModelExecution(v14?.["modelId"])?.[
        "executionManifest"
      ],
    }))
    ["filter"]((v15) => {
      return v15["nanoBanana"] && (!v13 || v15["provider"] === v13);
    });
}
function resolveNanoBananaModelFromExecutionToken(v16, v17 = "") {
  const v18 = normalizeModelToken(v16);
  if (!v18 || v18["includes"]("/")) return null;
  const v19 = getNanoBananaManifestRecords(v17),
    v20 = v19["find"](
      ({ executionManifest: v21 }) =>
        normalizeModelToken(v21?.["model"]) === v18,
    ),
    v22 =
      v20 ||
      v19["find"](({ executionManifest: v23 }) =>
        getExecutionModelTokens(v23)["includes"](v18),
      );
  if (!v22) return null;
  return {
    modelManifest: v22["manifest"],
    executionManifest: v22["executionManifest"],
    canonicalModelId: v22["manifest"]["modelId"],
    source: "execution-model-token",
  };
}
function resolveNanoBananaModelContext(v24, v25 = "") {
  const v26 = normalizeProvider(v25),
    v27 =
      resolveModelExecution(v24, { providerHint: v26 }) ||
      resolveNanoBananaModelFromExecutionToken(v24, v26) ||
      (v26 ? null : resolveModelExecution(v24)),
    v28 = v27?.["modelManifest"] || null;
  return {
    modelManifest: v28,
    executionManifest: v27?.["executionManifest"] || null,
    provider: normalizeProvider(v28?.["provider"] || v26),
    modelId: String(v27?.["canonicalModelId"] || v28?.["modelId"] || v24 || "")
      ["trim"]()
      ["toLowerCase"](),
    nanoBanana: getNanoBananaExtension(v28),
  };
}
function isRunningHubNanoProvider(v29) {
  return normalizeProvider(v29) === "runninghub";
}
function normalizeMode(v30) {
  const v31 = String(v30 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (!v31) return NANO_BANANA_MODES["NORMAL"];
  if (v31 === NANO_BANANA_MODES["NORMAL"] || v31 === "常规" || v31 === "normal")
    return NANO_BANANA_MODES["NORMAL"];
  if (v31 === NANO_BANANA_MODES["FAST"] || v31 === "快速")
    return NANO_BANANA_MODES["FAST"];
  if (v31 === NANO_BANANA_MODES["VT"]) return NANO_BANANA_MODES["VT"];
  if (v31 === NANO_BANANA_MODES["CL"]) return NANO_BANANA_MODES["CL"];
  if (v31 === NANO_BANANA_MODES["VIP"]) return NANO_BANANA_MODES["VIP"];
  if (
    v31 === NANO_BANANA_MODES["OFFICIAL"] ||
    v31 === "官方" ||
    v31 === "官方版"
  )
    return NANO_BANANA_MODES["OFFICIAL"];
  if (v31 === "低价" || v31 === "低价版") return NANO_BANANA_MODES["NORMAL"];
  return NANO_BANANA_MODES["NORMAL"];
}
function parseRatioLabel(v32) {
  const v33 = String(v32 || "")
    ["trim"]()
    ["replace"](/[：∶]/g, ":")
    ["replace"](/\s+/g, "");
  if (!v33["includes"](":")) return null;
  const [v34, v35] = v33["split"](":"),
    v36 = Number["parseFloat"](v34),
    v37 = Number["parseFloat"](v35);
  if (!(v36 > 0 && v37 > 0)) return null;
  return { w: v36, h: v37, label: v36 + ":" + v37 };
}
function getRatioValue(v38) {
  const v39 = Number(v38?.["value"]);
  if (Number["isFinite"](v39) && v39 > 0) return v39;
  const v40 = Number(v38?.["w"]),
    v41 = Number(v38?.["h"]);
  if (Number["isFinite"](v40) && v40 > 0 && Number["isFinite"](v41) && v41 > 0)
    return v40 / v41;
  const v42 = parseRatioLabel(v38?.["label"]);
  if (v42) return v42["w"] / v42["h"];
  return 1;
}
export function normalizeNanoBananaImageSize(v43) {
  const v44 = String(v43 || "")
    ["trim"]()
    ["toUpperCase"]();
  if (v44 === "1K" || v44 === "2K" || v44 === "4K") return v44;
  return DEFAULT_IMAGE_SIZE;
}
export function isNanoBananaFamily(v45) {
  return (
    v45 === NANO_BANANA_FAMILIES["NANOBANANA"] ||
    v45 === NANO_BANANA_FAMILIES["NANOBANANA_PRO"] ||
    v45 === NANO_BANANA_FAMILIES["NANOBANANA_2"] ||
    v45 === NANO_BANANA_FAMILIES["GPT_IMAGE_2"]
  );
}
export function getNanoBananaFamilyOptions() {
  return [
    {
      family: NANO_BANANA_FAMILIES["NANOBANANA"],
      label: "Nanobanana",
      description: "基础模型",
      disabled: false,
    },
    {
      family: NANO_BANANA_FAMILIES["NANOBANANA_PRO"],
      label: "NanobananaPRO",
      description: "专业增强模型",
      disabled: false,
    },
    {
      family: NANO_BANANA_FAMILIES["NANOBANANA_2"],
      label: "Nanobanana2",
      description: "第二代模型",
      disabled: false,
    },
  ];
}
export function getDefaultModeForNanoBananaFamily(v46, v47 = "") {
  if (!isNanoBananaFamily(v46)) return NANO_BANANA_MODES["NORMAL"];
  if (isRunningHubNanoProvider(v47)) return NANO_BANANA_MODES["NORMAL"];
  return NANO_BANANA_MODES["NORMAL"];
}
export function getNanoBananaModeOptions(v48, v49 = "") {
  if (!isNanoBananaFamily(v48)) return [];
  if (isRunningHubNanoProvider(v49)) return RUNNINGHUB_NANO_BANANA_MODE_OPTIONS;
  const v50 = NANO_BANANA_MODE_OPTIONS[v48];
  return Array["isArray"](v50) ? v50 : [];
}
export function getNanoBananaModeLabel(v51, v52, v53 = "") {
  const v54 = getNanoBananaModeOptions(v51, v53),
    v55 = normalizeMode(v52),
    v56 = v54["find"]((v57) => v57["mode"] === v55);
  return v56?.["label"] || (isRunningHubNanoProvider(v53) ? "低价版" : "常规");
}
export function resolveNanoBananaModelBySelection({
  family: v58,
  mode: v59,
  imageSize: imageSize = DEFAULT_IMAGE_SIZE,
  provider: provider = "",
} = {}) {
  const v60 = String(v58 || "")["trim"]();
  if (!isNanoBananaFamily(v60)) return normalizeModelToken(v58);
  const v61 = normalizeProvider(provider) || "grsai",
    v62 = isRunningHubNanoProvider(v61)
      ? normalizeMode(v59) === NANO_BANANA_MODES["OFFICIAL"]
        ? NANO_BANANA_MODES["OFFICIAL"]
        : NANO_BANANA_MODES["NORMAL"]
      : normalizeMode(v59),
    v63 = normalizeNanoBananaImageSize(imageSize),
    v64 = getNanoBananaManifestRecords(v61)["filter"](
      (v65) =>
        v65["nanoBanana"]["family"] === v60 &&
        v65["nanoBanana"]["mode"] === v62,
    );
  if (v64["length"] <= 0) return normalizeModelToken(v58);
  if (v61 === "grsai") {
    const v66 = v64["filter"]((v67) => {
        const v68 = v67["imageSizePolicy"]?.["fixedSize"]
          ? normalizeNanoBananaImageSize(v67["imageSizePolicy"]["fixedSize"])
          : "";
        return v68 === v63;
      }),
      v69 = v64["filter"]((v70) => !v70["imageSizePolicy"]?.["fixedSize"]);
    if (v63 === "4K" && v66["length"] > 0) return v66[0]["manifest"]["modelId"];
    if (v69["length"] > 0) return v69[0]["manifest"]["modelId"];
  }
  return v64[0]["manifest"]["modelId"];
}
export function resolveNanoBananaSelectionFromModel(
  v71,
  v72 = DEFAULT_IMAGE_SIZE,
  v73 = "",
) {
  const v74 = resolveNanoBananaModelContext(v71, v73);
  if (!v74["nanoBanana"]) return null;
  const v75 = v74["nanoBanana"]["family"],
    v76 = v74["nanoBanana"]["mode"],
    v77 = normalizeProvider(v73),
    v78 = v74["provider"] || v77 || "grsai";
  return {
    family: v75,
    mode: v76,
    provider: v78,
    model: resolveNanoBananaModelBySelection({
      family: v75,
      mode: v76,
      imageSize: v72,
      provider: v78,
    }),
    rawModel: v74["modelId"],
  };
}
export function getNanoBananaSelectionFromModel(
  v79,
  v80 = DEFAULT_IMAGE_SIZE,
  v81 = "",
) {
  return resolveNanoBananaSelectionFromModel(v79, v80, v81);
}
export function getNanoBananaAllowedRatioOptions(v82) {
  if (v82 === NANO_BANANA_FAMILIES["GPT_IMAGE_2"])
    return GPT_IMAGE_2_RATIO_OPTIONS;
  if (v82 === NANO_BANANA_FAMILIES["NANOBANANA_2"])
    return [...DEFAULT_RATIO_OPTIONS, ...NANO_BANANA_2_EXTRA_RATIO_OPTIONS];
  return DEFAULT_RATIO_OPTIONS;
}
export function getNanoBananaAllowedRatioLabels(v83) {
  return getNanoBananaAllowedRatioOptions(v83)["map"]((v84) => v84["label"]);
}
export function pickClosestRatioLabelByOptions(v85, v86 = []) {
  const v87 =
      Array["isArray"](v86) && v86["length"] > 0 ? v86 : DEFAULT_RATIO_OPTIONS,
    v88 = parseRatioLabel(v85),
    v89 = v88 ? v88["w"] / v88["h"] : 1;
  let v90 = v87[0],
    v91 = Math["abs"](v89 - getRatioValue(v90));
  for (let v92 = 1; v92 < v87["length"]; v92 += 1) {
    const v93 = v87[v92],
      v94 = Math["abs"](v89 - getRatioValue(v93));
    v94 < v91 && ((v91 = v94), (v90 = v93));
  }
  return v90["label"];
}
export function normalizeNanoBananaRatioForFamily(v95, v96) {
  const v97 = getNanoBananaAllowedRatioOptions(v96),
    v98 = v97["map"]((v99) => v99["label"]),
    v100 = parseRatioLabel(v95);
  if (!v100) return v95;
  if (v98["includes"](v100["label"])) return v100["label"];
  return pickClosestRatioLabelByOptions(v100["label"], v97);
}
