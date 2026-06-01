import {
  getModelsByKind,
  normalizeProviderId,
  resolveModelExecution,
} from "../manifests/index.js";
export const DREAMINA_VIDEO_ROUTE_MODES = [
  "multimodal2video",
  "frames2video",
  "multiframe2video",
];
export const DREAMINA_VIDEO_TASK_TYPES = [
  "text2video",
  "image2video",
  "frames2video",
  "multiframe2video",
  "multimodal2video",
];
export const DREAMINA_VIDEO_ALLOWED_RATIOS = [
  "1:1",
  "3:4",
  "16:9",
  "4:3",
  "9:16",
  "21:9",
];
export const DREAMINA_VIDEO_ADAPTIVE_RATIO_OPTIONS = [
  { label: "1:1", w: 1, h: 1, calc: 1 / 1 },
  { label: "3:4", w: 3, h: 4, calc: 3 / 4 },
  { label: "16:9", w: 16, h: 9, calc: 16 / 9 },
  { label: "4:3", w: 4, h: 3, calc: 4 / 3 },
  { label: "9:16", w: 9, h: 16, calc: 9 / 16 },
  { label: "21:9", w: 21, h: 9, calc: 21 / 9 },
];
function getDreaminaStyleVideoExtension(v0) {
  const v1 = v0?.["extensions"]?.["dreaminaStyleVideo"];
  return v1 && typeof v1 === "object" ? v1 : null;
}
function getDreaminaStyleVideoCounterpartKey(v2) {
  return String(getDreaminaStyleVideoExtension(v2)?.["counterpartKey"] || "")[
    "trim"
  ]();
}
function normalizeStyleProvider(v3) {
  const v4 = normalizeProviderId(v3);
  return v4 === "apimart" || v4 === "dreamina" || v4 === "volcengine" ? v4 : "";
}
function toDreaminaStyleVideoOption(v5) {
  const v6 = getDreaminaStyleVideoExtension(v5) || {};
  return Object["freeze"]({
    model: v5["modelId"],
    title: v6["title"] || v5["displayName"] || v5["modelId"],
    subtitle: v6["subtitle"] || v5["description"] || "",
    subtitleByTaskType: v6["subtitleByTaskType"] || Object["freeze"]({}),
    taskTypes: Array["isArray"](v6["taskTypes"])
      ? Object["freeze"](v6["taskTypes"]["slice"]())
      : Object["freeze"]([]),
    order: Number(v6["order"] || 0),
    counterpartKey: getDreaminaStyleVideoCounterpartKey(v5),
    vip: v5["vip"] === true,
  });
}
function getDreaminaStyleVideoOptions(v7) {
  const v8 = normalizeStyleProvider(v7);
  return getModelsByKind("video")
    ["filter"]((v9) => {
      if (!getDreaminaStyleVideoExtension(v9)) return false;
      if (v8 && v9["provider"] !== v8) return false;
      return true;
    })
    ["sort"]((v10, v11) => {
      const v12 = getDreaminaStyleVideoExtension(v10) || {},
        v13 = getDreaminaStyleVideoExtension(v11) || {};
      return (
        (Number(v12["order"] || 0) || 0) - (Number(v13["order"] || 0) || 0)
      );
    })
    ["map"](toDreaminaStyleVideoOption);
}
function resolveDreaminaStyleVideoManifest(v14, v15 = "") {
  const v16 = String(v14 || "")["trim"](),
    v17 = normalizeStyleProvider(v15),
    v18 = Array["from"](new Set([v17, ""]["filter"](Boolean)));
  for (const v19 of v18) {
    const v20 = resolveModelExecution(v16, { providerHint: v19 }),
      v21 = v20?.["modelManifest"] || null;
    if (!v21 || !getDreaminaStyleVideoExtension(v21)) continue;
    if (v17 && v21["provider"] !== v17) continue;
    return v21;
  }
  if (!v16) return null;
  const v22 = resolveModelExecution(v16),
    v23 = v22?.["modelManifest"] || null;
  if (!v23 || !getDreaminaStyleVideoExtension(v23)) return null;
  if (v17 && v23["provider"] !== v17) return null;
  return v23;
}
function getDefaultDreaminaStyleVideoModel(v24, v25) {
  const v26 = normalizeStyleProvider(v25) || "dreamina",
    v27 = String(v24 || "")["trim"](),
    v28 = getDreaminaStyleVideoOptions(v26),
    v29 = v28["find"]((v30) => {
      const v31 = resolveDreaminaStyleVideoManifest(v30["model"], v26),
        v32 =
          getDreaminaStyleVideoExtension(v31)?.["defaultForTaskTypes"] || [];
      return Array["isArray"](v32) && v32["includes"](v27);
    });
  if (v29) return v29["model"];
  const v33 = v28["find"]((v34) => v34["taskTypes"]["includes"](v27));
  return v33?.["model"] || "";
}
export const APIMART_DREAMINA_VIDEO_DEFAULT_MODEL =
  getDefaultDreaminaStyleVideoModel("text2video", "apimart");
export const APIMART_DREAMINA_VIDEO_MODEL_OPTIONS = Object["freeze"](
  getDreaminaStyleVideoOptions("apimart"),
);
export const VOLCENGINE_DREAMINA_VIDEO_MODEL_OPTIONS = Object["freeze"](
  getDreaminaStyleVideoOptions("volcengine"),
);
export const DREAMINA_VIDEO_MODEL_OPTIONS = Object["freeze"](
  getDreaminaStyleVideoOptions("dreamina"),
);
const IMAGE_ROUTE_EXTRA_MODELS = DREAMINA_VIDEO_MODEL_OPTIONS["filter"]((v35) =>
    v35["taskTypes"]["includes"]("image2video"),
  ),
  FRAMES_ROUTE_EXTRA_MODELS = DREAMINA_VIDEO_MODEL_OPTIONS["filter"]((v36) =>
    v36["taskTypes"]["includes"]("frames2video"),
  ),
  DREAMINA_VIDEO_MODEL_META = new Map(
    DREAMINA_VIDEO_MODEL_OPTIONS["map"]((v37) => [v37["model"], v37]),
  ),
  APIMART_DREAMINA_VIDEO_MODEL_META = new Map(
    APIMART_DREAMINA_VIDEO_MODEL_OPTIONS["map"]((v38) => [v38["model"], v38]),
  ),
  VOLCENGINE_DREAMINA_VIDEO_MODEL_META = new Map(
    VOLCENGINE_DREAMINA_VIDEO_MODEL_OPTIONS["map"]((v39) => [
      v39["model"],
      v39,
    ]),
  ),
  DREAMINA_ROUTE_LABELS = {
    multimodal2video: "全能参考",
    frames2video: "首尾帧",
    multiframe2video: "智能多帧",
  },
  DREAMINA_TASK_LABELS = {
    text2video: "文生视频",
    image2video: "首帧生视频",
    frames2video: "首尾帧",
    multiframe2video: "智能多帧",
    multimodal2video: "全能参考",
  },
  DREAMINA_MODE_DISABLED_MAP = {
    multimodal2video: false,
    frames2video: false,
    multiframe2video: true,
  };
function pickFirstNonEmpty(...v40) {
  for (const v41 of v40) {
    const v42 = String(v41 || "")["trim"]();
    if (v42) return v42;
  }
  return "";
}
export function isDreaminaVideoModel(v43, v44) {
  const v45 = normalizeStyleProvider(v44);
  if (v45 === "dreamina") return true;
  return resolveDreaminaStyleVideoManifest(v43, "dreamina") !== null;
}
export function isApimartDreaminaVideoModel(v46, v47) {
  const v48 = normalizeStyleProvider(v47);
  if (v48 === "apimart" && !String(v46 || "")["trim"]()) return true;
  return resolveDreaminaStyleVideoManifest(v46, "apimart") !== null;
}
export function isDreaminaStyleVideoModel(v49, v50) {
  return (
    isDreaminaVideoModel(v49, v50) ||
    isApimartDreaminaVideoModel(v49, v50) ||
    resolveDreaminaStyleVideoManifest(v49, "volcengine") !== null ||
    (normalizeStyleProvider(v50) === "volcengine" &&
      resolveDreaminaStyleVideoManifest(v49, "volcengine") !== null)
  );
}
export function resolveDreaminaStyleVideoProvider(v51, v52) {
  const v53 = normalizeStyleProvider(v52);
  if (v53) return v53;
  const v54 = resolveDreaminaStyleVideoManifest(v51);
  return normalizeStyleProvider(v54?.["provider"]) || "dreamina";
}
export function resolveDreaminaStyleVideoCounterpartModel(
  v55,
  v56,
  { taskType: taskType = "" } = {},
) {
  const v57 = resolveDreaminaStyleVideoManifest(v55),
    v58 = getDreaminaStyleVideoCounterpartKey(v57),
    v59 = normalizeStyleProvider(v56);
  if (!v57 || !v58 || !v59) return "";
  const v60 = String(taskType || "")["trim"](),
    v61 = v57["vip"] === true,
    v62 = getModelsByKind("video")
      ["filter"]((v63) => {
        if (v63["provider"] !== v59) return false;
        const v64 = getDreaminaStyleVideoExtension(v63);
        if (!v64) return false;
        if (getDreaminaStyleVideoCounterpartKey(v63) !== v58) return false;
        const v65 = Array["isArray"](v64["taskTypes"]) ? v64["taskTypes"] : [];
        return !v60 || v65["includes"](v60);
      })
      ["sort"]((v66, v67) => {
        const v68 = v66["vip"] === v61 ? 0 : 1,
          v69 = v67["vip"] === v61 ? 0 : 1;
        if (v68 !== v69) return v68 - v69;
        const v70 =
            Number(getDreaminaStyleVideoExtension(v66)?.["order"] || 0) || 0,
          v71 =
            Number(getDreaminaStyleVideoExtension(v67)?.["order"] || 0) || 0;
        return v70 - v71;
      });
  return v62[0]?.["modelId"] || "";
}
export function isDreaminaVideoRouteModeEnabled(v72) {
  const v73 = normalizeDreaminaVideoRouteMode(v72);
  return DREAMINA_MODE_DISABLED_MAP[v73] !== true;
}
export function normalizeDreaminaVideoRouteMode(v74, v75 = "") {
  const v76 = String(v74 || "")["trim"]();
  if (DREAMINA_VIDEO_ROUTE_MODES["includes"](v76)) return v76;
  const v77 = String(v75 || "")["trim"]();
  if (v77 === "首尾帧") return "frames2video";
  if (v77 === "智能多帧") return "multiframe2video";
  return "multimodal2video";
}
export function normalizeDreaminaVideoModel(v78, v79) {
  const v80 = resolveDreaminaStyleVideoManifest(v78, "dreamina");
  if (v80) return v80["modelId"];
  if (normalizeStyleProvider(v79) === "dreamina")
    return getDefaultDreaminaStyleVideoModel("text2video", "dreamina");
  return String(v78 || "")["trim"]();
}
export function getDreaminaVideoModelVersion(v81, v82) {
  const v83 = normalizeDreaminaVideoModel(v81, v82),
    v84 = resolveDreaminaStyleVideoManifest(v83, "dreamina");
  return v84 ? v83["replace"](/^dreamina\//, "")["trim"]() : "";
}
export function getDreaminaVideoModelMeta(v85, v86) {
  const v87 = normalizeDreaminaVideoModel(v85, v86);
  return DREAMINA_VIDEO_MODEL_META["get"](v87) || null;
}
export function getDreaminaVideoTaskDisplayName(v88) {
  return DREAMINA_TASK_LABELS[String(v88 || "")["trim"]()] || "即梦视频";
}
export function getDreaminaVideoRouteDisplayName(v89) {
  return (
    DREAMINA_ROUTE_LABELS[normalizeDreaminaVideoRouteMode(v89)] || "全能参考"
  );
}
export function buildDreaminaVideoRouteLabel(v90) {
  return getDreaminaVideoRouteDisplayName(v90);
}
export function resolveDreaminaVideoTaskType({
  routeMode: routeMode = "multimodal2video",
  imageCount: imageCount = 0,
  videoCount: videoCount = 0,
  audioCount: audioCount = 0,
} = {}) {
  const v91 = normalizeDreaminaVideoRouteMode(routeMode),
    v92 = Number(imageCount) || 0,
    v93 = Number(videoCount) || 0,
    v94 = Number(audioCount) || 0;
  if (v91 === "frames2video") {
    if (v92 >= 2) return "frames2video";
    if (v92 === 1) return "image2video";
    return "text2video";
  }
  if (v91 === "multiframe2video") return "multiframe2video";
  if (v92 <= 0 && v93 <= 0) return v94 > 0 ? "multimodal2video" : "text2video";
  return "multimodal2video";
}
export function getDreaminaVideoAllowedModels(v95) {
  const v96 = String(v95 || "")["trim"]();
  return DREAMINA_VIDEO_MODEL_OPTIONS["filter"]((v97) =>
    v97["taskTypes"]["includes"](v96),
  );
}
export function getDreaminaVideoDefaultModel(v98) {
  const v99 = String(v98 || "")["trim"]();
  return getDefaultDreaminaStyleVideoModel(v99, "dreamina");
}
export function isDreaminaVideoTaskModelSupported(v100, v101, v102) {
  const v103 = normalizeDreaminaVideoModel(v101, v102);
  return getDreaminaVideoAllowedModels(v100)["some"](
    (v104) => v104["model"] === v103,
  );
}
export function ensureDreaminaVideoModelForTask(v105, v106, v107) {
  const v108 = String(v105 || "")["trim"](),
    v109 = normalizeDreaminaVideoModel(v106, v107);
  if (v109 && isDreaminaVideoTaskModelSupported(v108, v109, "dreamina"))
    return v109;
  return getDreaminaVideoDefaultModel(v108);
}
export function normalizeDreaminaVideoAspectRatio(v110, v111 = {}) {
  const v112 =
      v111 === true ||
      (v111 && typeof v111 === "object" && v111["preserveAdaptive"] === true),
    v113 = String(v110 || "")["trim"]();
  if (!v113) return v112 ? "自适应" : "1:1";
  if (v113 === "自适应" || v113 === "自适应" || v113 === "auto")
    return v112 ? "自适应" : "1:1";
  if (v113 === "5:4") return "4:3";
  if (v113 === "4:5") return "3:4";
  if (DREAMINA_VIDEO_ALLOWED_RATIOS["includes"](v113)) return v113;
  return v112 ? "自适应" : "1:1";
}
export function pickClosestDreaminaVideoAdaptiveRatio(v114, v115) {
  const v116 = Number(v114),
    v117 = Number(v115);
  if (
    !(
      Number["isFinite"](v116) &&
      v116 > 0 &&
      Number["isFinite"](v117) &&
      v117 > 0
    )
  )
    return DREAMINA_VIDEO_ADAPTIVE_RATIO_OPTIONS[0];
  const v118 = v116 / v117;
  let v119 = DREAMINA_VIDEO_ADAPTIVE_RATIO_OPTIONS[0],
    v120 = Math["abs"](v118 - v119["calc"]);
  for (
    let v121 = 1;
    v121 < DREAMINA_VIDEO_ADAPTIVE_RATIO_OPTIONS["length"];
    v121 += 1
  ) {
    const v122 = DREAMINA_VIDEO_ADAPTIVE_RATIO_OPTIONS[v121],
      v123 = Math["abs"](v118 - v122["calc"]);
    v123 < v120 && ((v120 = v123), (v119 = v122));
  }
  return v119;
}
export function getDreaminaVideoTaskParamVisibility(v124) {
  const v125 = String(v124 || "")["trim"]();
  return {
    ratio: true,
    duration: v125 !== "multiframe2video",
    mode: true,
    model: true,
    multiframeAdvanced: false,
    ratioChoices: v125 !== "image2video" && v125 !== "frames2video",
  };
}
export function getDreaminaVideoResolutionOptions(v126, v127, v128) {
  const v129 = String(v126 || "")["trim"](),
    v130 = ensureDreaminaVideoModelForTask(v129, v127, v128),
    v131 = resolveDreaminaStyleVideoManifest(v130, "dreamina"),
    v132 =
      getDreaminaStyleVideoExtension(v131)?.["resolutionOptionsByTaskType"]?.[
        v129
      ];
  return Array["isArray"](v132) ? v132["slice"]() : [];
}
export function normalizeDreaminaVideoResolution(v133, v134, v135, v136) {
  const v137 = getDreaminaVideoResolutionOptions(v133, v134, v136);
  if (!v137["length"]) return "";
  const v138 = pickFirstNonEmpty(v135, v137[0]);
  return v137["includes"](v138) ? v138 : v137[0];
}
export function getDreaminaVideoDurationRange(v139, v140, v141) {
  const v142 = String(v139 || "")["trim"]();
  if (v142 === "multiframe2video") return { min: 3, max: 3, step: 1 };
  const v143 = ensureDreaminaVideoModelForTask(v142, v140, v141),
    v144 = resolveDreaminaStyleVideoManifest(v143, "dreamina"),
    v145 =
      getDreaminaStyleVideoExtension(v144)?.["durationRangeByTaskType"]?.[v142];
  return v145 && typeof v145 === "object"
    ? { min: v145["min"], max: v145["max"], step: v145["step"] || 1 }
    : { min: 4, max: 15, step: 1 };
}
export function normalizeDreaminaVideoDuration(v146, v147, v148, v149) {
  const v150 = getDreaminaVideoDurationRange(v146, v147, v149),
    v151 = Number(v148);
  if (!Number["isFinite"](v151)) return v150["min"];
  return Math["max"](
    v150["min"],
    Math["min"](v150["max"], Math["trunc"](v151)),
  );
}
export function validateDreaminaVideoRouteSelection({
  routeMode: routeMode = "multimodal2video",
  taskType: taskType = "",
  imageCount: imageCount = 0,
  videoCount: videoCount = 0,
  audioCount: audioCount = 0,
} = {}) {
  const v152 = normalizeDreaminaVideoRouteMode(routeMode),
    v153 = String(taskType || "")["trim"](),
    v154 = Number(imageCount) || 0,
    v155 = Number(videoCount) || 0,
    v156 = Number(audioCount) || 0;
  if (v152 === "frames2video") {
    if (v155 > 0 || v156 > 0) return "首尾帧模式仅支持图片参考";
  }
  if (v153 === "text2video") return "";
  if (v153 === "image2video") {
    if (v155 > 0 || v156 > 0) return "首尾帧模式仅支持图片参考";
    if (v154 < 1) return "首尾帧模式至少需要 1 张图片";
    if (v154 > 1) return "首尾帧模式最多支持 1 张图片进入单图链路";
    return "";
  }
  if (v153 === "frames2video") {
    if (v155 > 0 || v156 > 0) return "首尾帧模式仅支持图片参考";
    if (v154 < 2) return "首尾帧模式需要 2 张图片";
    if (v154 > 2) return "首尾帧模式最多支持\x202\x20张图片";
    return "";
  }
  if (v153 === "multimodal2video") {
    if (v154 <= 0 && v155 <= 0)
      return v156 > 0
        ? "全能参考至少需要 1 张图片或 1 个视频，音频不能单独使用"
        : "";
    if (v154 > 9) return "全能参考最多支持 9 张图片";
    if (v155 > 3) return "全能参考最多支持\x203\x20个视频";
    if (v156 > 3) return "全能参考最多支持\x203\x20个音频";
    return "";
  }
  if (v153 === "multiframe2video") {
    if (v155 > 0 || v156 > 0) return "智能多帧仅支持图片参考";
    if (v154 < 2) return "智能多帧至少需要\x202\x20张图片";
    if (v154 > 20) return "智能多帧最多支持 20 张图片";
    return "";
  }
  return "";
}
export function normalizeDreaminaStyleVideoModel(v157, v158) {
  const v159 = resolveDreaminaStyleVideoProvider(v157, v158);
  if (v159 === "dreamina") return normalizeDreaminaVideoModel(v157, v158);
  const v160 = resolveDreaminaStyleVideoManifest(v157, v159);
  return (
    v160?.["modelId"] || getDefaultDreaminaStyleVideoModel("text2video", v159)
  );
}
export function getDreaminaStyleVideoModelVersion(v161, v162) {
  const v163 = resolveDreaminaStyleVideoProvider(v161, v162);
  if (v163 === "dreamina") return getDreaminaVideoModelVersion(v161, v162);
  const v164 = normalizeDreaminaStyleVideoModel(v161, v163),
    v165 = resolveDreaminaStyleVideoManifest(v164, v163);
  return v165
    ? v164["replace"](new RegExp("^" + v163 + "/"), "")["trim"]()
    : "";
}
export function getDreaminaStyleVideoModelMeta(v166, v167) {
  const v168 = resolveDreaminaStyleVideoProvider(v166, v167);
  if (v168 === "dreamina") return getDreaminaVideoModelMeta(v166, v167);
  const v169 = normalizeDreaminaStyleVideoModel(v166, v168);
  if (v168 === "apimart")
    return APIMART_DREAMINA_VIDEO_MODEL_META["get"](v169) || null;
  if (v168 === "volcengine")
    return VOLCENGINE_DREAMINA_VIDEO_MODEL_META["get"](v169) || null;
  return null;
}
export function getDreaminaStyleVideoAllowedModels(v170, v171) {
  const v172 = normalizeStyleProvider(v171) || "dreamina";
  if (v172 === "dreamina") return getDreaminaVideoAllowedModels(v170);
  const v173 = String(v170 || "")["trim"]();
  return getDreaminaStyleVideoOptions(v172)["filter"]((v174) =>
    v174["taskTypes"]["includes"](v173),
  );
}
export function getDreaminaStyleVideoDefaultModel(v175, v176) {
  const v177 = normalizeStyleProvider(v176) || "dreamina";
  if (v177 === "dreamina") return getDreaminaVideoDefaultModel(v175);
  return getDefaultDreaminaStyleVideoModel(v175, v177);
}
export function isDreaminaStyleVideoTaskModelSupported(v178, v179, v180) {
  const v181 = resolveDreaminaStyleVideoProvider(v179, v180),
    v182 = normalizeDreaminaStyleVideoModel(v179, v181);
  return getDreaminaStyleVideoAllowedModels(v178, v181)["some"](
    (v183) => v183["model"] === v182,
  );
}
export function ensureDreaminaStyleVideoModelForTask(v184, v185, v186) {
  const v187 = resolveDreaminaStyleVideoProvider(v185, v186);
  if (v187 === "dreamina")
    return ensureDreaminaVideoModelForTask(v184, v185, v186);
  const v188 = String(v184 || "")["trim"](),
    v189 = normalizeDreaminaStyleVideoModel(v185, v187);
  if (v189 && isDreaminaStyleVideoTaskModelSupported(v188, v189, v187))
    return v189;
  return getDreaminaStyleVideoDefaultModel(v188, v187);
}
export function getDreaminaStyleVideoResolutionOptions(v190, v191, v192) {
  const v193 = resolveDreaminaStyleVideoProvider(v191, v192);
  if (v193 === "dreamina")
    return getDreaminaVideoResolutionOptions(v190, v191, v192);
  const v194 = String(v190 || "")["trim"](),
    v195 = ensureDreaminaStyleVideoModelForTask(v194, v191, v193),
    v196 = resolveDreaminaStyleVideoManifest(v195, v193),
    v197 =
      getDreaminaStyleVideoExtension(v196)?.["resolutionOptionsByTaskType"]?.[
        v194
      ];
  return Array["isArray"](v197) ? v197["slice"]() : [];
}
export function normalizeDreaminaStyleVideoResolution(v198, v199, v200, v201) {
  const v202 = getDreaminaStyleVideoResolutionOptions(v198, v199, v201);
  if (!v202["length"]) return "";
  const v203 = pickFirstNonEmpty(
    v200,
    v202["includes"]("720p") ? "720p" : v202[0],
  );
  return v202["includes"](v203) ? v203 : v202[0];
}
export function getDreaminaStyleVideoDurationRange(v204, v205, v206) {
  const v207 = resolveDreaminaStyleVideoProvider(v205, v206);
  if (v207 === "dreamina")
    return getDreaminaVideoDurationRange(v204, v205, v206);
  const v208 = String(v204 || "")["trim"]();
  if (v208 === "multiframe2video") return { min: 3, max: 3, step: 1 };
  const v209 = normalizeDreaminaStyleVideoModel(v205, v207),
    v210 = resolveDreaminaStyleVideoManifest(v209, v207),
    v211 =
      getDreaminaStyleVideoExtension(v210)?.["durationRangeByTaskType"]?.[v208];
  return v211 && typeof v211 === "object"
    ? { min: v211["min"], max: v211["max"], step: v211["step"] || 1 }
    : { min: 4, max: 15, step: 1 };
}
export function normalizeDreaminaStyleVideoDuration(v212, v213, v214, v215) {
  const v216 = getDreaminaStyleVideoDurationRange(v212, v213, v215),
    v217 = Number(v214);
  if (!Number["isFinite"](v217)) return v216["min"];
  return Math["max"](
    v216["min"],
    Math["min"](v216["max"], Math["trunc"](v217)),
  );
}
export function buildDreaminaStyleVideoNodeNormalizationPatch(v218) {
  const v219 = v218 && typeof v218 === "object" ? v218 : {};
  if (!isDreaminaStyleVideoModel(v219["model"], v219["provider"])) return null;
  const v220 = resolveDreaminaStyleVideoProvider(
    v219["model"],
    v219["provider"],
  );
  if (v220 === "dreamina")
    return buildDreaminaVideoNodeNormalizationPatch(v218);
  const v221 = normalizeDreaminaStyleVideoModel(v219["model"], v220),
    v222 = normalizeDreaminaVideoRouteMode(
      v219["dreaminaRouteMode"],
      v219["mode"],
    ),
    v223 = normalizeDreaminaVideoAspectRatio(v219["aspectRatio"], {
      preserveAdaptive: true,
    }),
    v224 = resolveDreaminaVideoTaskType({ routeMode: v222 }),
    v225 = normalizeDreaminaStyleVideoResolution(
      v224,
      v221,
      v219["resolution"] || v219["videoSize"],
      v220,
    ),
    v226 = normalizeDreaminaStyleVideoDuration(
      v224,
      v221,
      v219["duration"],
      v220,
    ),
    v227 = {};
  return (
    String(v219["provider"] || "")
      ["trim"]()
      ["toLowerCase"]() !== v220 && (v227["provider"] = v220),
    v221 &&
      v221 !== String(v219["model"] || "")["trim"]() &&
      (v227["model"] = v221),
    v222 !== String(v219["dreaminaRouteMode"] || "")["trim"]() &&
      (v227["dreaminaRouteMode"] = v222),
    v223 !== String(v219["aspectRatio"] || "")["trim"]() &&
      String(v219["aspectRatio"] || "")["trim"]() &&
      (v227["aspectRatio"] = v223),
    v225 &&
      v225 !== String(v219["resolution"] || "")["trim"]() &&
      (v227["resolution"] = v225),
    Number(v226) !== Number(v219["duration"]) && (v227["duration"] = v226),
    Object["keys"](v227)["length"] > 0 ? v227 : null
  );
}
export function buildDreaminaVideoNodeNormalizationPatch(v228) {
  const v229 = v228 && typeof v228 === "object" ? v228 : {};
  if (!isDreaminaVideoModel(v229["model"], v229["provider"])) return null;
  const v230 = normalizeDreaminaVideoModel(v229["model"], v229["provider"]),
    v231 = normalizeDreaminaVideoRouteMode(
      v229["dreaminaRouteMode"],
      v229["mode"],
    ),
    v232 = normalizeDreaminaVideoAspectRatio(v229["aspectRatio"], {
      preserveAdaptive: true,
    }),
    v233 = {};
  return (
    String(v229["provider"] || "")
      ["trim"]()
      ["toLowerCase"]() !== "dreamina" && (v233["provider"] = "dreamina"),
    v230 &&
      v230 !== String(v229["model"] || "")["trim"]() &&
      (v233["model"] = v230),
    v231 !== String(v229["dreaminaRouteMode"] || "")["trim"]() &&
      (v233["dreaminaRouteMode"] = v231),
    v232 !== String(v229["aspectRatio"] || "")["trim"]() &&
      String(v229["aspectRatio"] || "")["trim"]() &&
      (v233["aspectRatio"] = v232),
    Object["keys"](v233)["length"] > 0 ? v233 : null
  );
}
