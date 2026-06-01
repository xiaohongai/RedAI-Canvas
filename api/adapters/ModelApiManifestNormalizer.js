import {
  resolveModelExecution,
  sanitizeModelUiSchemaParams,
} from "../../src/manifests/index.js";
import {
  isAdaptiveRatioLabel,
  resolveProviderRatioPayload,
} from "../imageRatioPolicy.js";
import { ApiError } from "../errors/index.js";
import { buildBodyFromMapping } from "./modelApiMappingEngine.js";
import {
  getModelApiBodyResolver,
  getModelApiEndpointResolver,
  normalizeApimartNanoBanana2Resolution,
  normalizeApimartGptImage2Resolution,
} from "./modelApiResolvers/index.js";
function normalizeManifestOptionKey(v0) {
  return String(v0 || "")
    ["trim"]()
    ["toLowerCase"]();
}
function findVideoAspectRatioField(v1) {
  return (
    Array["isArray"](v1?.["uiSchema"]?.["fields"])
      ? v1["uiSchema"]["fields"]
      : []
  )["find"]((v2) => String(v2?.["id"] || "")["trim"]() === "aspectRatio");
}
function pickFirstConcreteVideoAspectRatio(v3) {
  const v4 = findVideoAspectRatioField(v3),
    v5 = Array["isArray"](v4?.["options"]) ? v4["options"] : [];
  for (const v6 of v5) {
    const v7 = String(v6?.["value"] ?? v6 ?? "")["trim"]();
    if (v7 && v7["includes"](":") && !isAdaptiveRatioLabel(v7)) return v7;
  }
  return "";
}
function resolvePayloadAspectRatioInput(v8 = {}, v9 = null) {
  const v10 =
    v8?.["generationParams"] &&
    typeof v8["generationParams"] === "object" &&
    !Array["isArray"](v8["generationParams"])
      ? v8["generationParams"]
      : {};
  if (Object["prototype"]["hasOwnProperty"]["call"](v10, "aspectRatio"))
    return v10["aspectRatio"];
  for (const v11 of ["aspectRatio", "aspect_ratio", "size"]) {
    if (Object["prototype"]["hasOwnProperty"]["call"](v8 || {}, v11))
      return v8[v11];
  }
  return findVideoAspectRatioField(v9)?.["defaultValue"] ?? "";
}
function applyVideoAspectRatioExecutionFallback(v12 = {}, v13 = null) {
  if (!findVideoAspectRatioField(v13)) return v12;
  const v14 =
    v13?.["extensions"]?.["ratioPolicy"] || v13?.["ratioPolicy"] || {};
  if (v14?.["preserveAdaptive"] === true) return v12;
  const v15 = resolvePayloadAspectRatioInput(v12, v13);
  if (!isAdaptiveRatioLabel(v15)) return v12;
  const v16 = String(v12?.["resolvedRatioLabel"] || "")["trim"](),
    v17 =
      v16 && !isAdaptiveRatioLabel(v16)
        ? v16
        : pickFirstConcreteVideoAspectRatio(v13);
  if (!v17) return v12;
  return {
    ...v12,
    aspectRatio: v17,
    resolvedRatioLabel: v17,
    generationParams: { ...(v12["generationParams"] || {}), aspectRatio: v17 },
  };
}
function mergeRootAspectRatioIntoGenerationParams(v18 = {}, v19 = {}) {
  const v20 =
      v19 && typeof v19 === "object" && !Array["isArray"](v19)
        ? { ...v19 }
        : {},
    v21 =
      v18?.["generationParams"] &&
      typeof v18["generationParams"] === "object" &&
      !Array["isArray"](v18["generationParams"])
        ? v18["generationParams"]
        : {};
  if (Object["prototype"]["hasOwnProperty"]["call"](v21, "aspectRatio"))
    return v20;
  if (String(v18?.["resolvedRatioLabel"] || "")["trim"]()) return v20;
  return (
    Object["prototype"]["hasOwnProperty"]["call"](v18 || {}, "aspectRatio") &&
      !isAdaptiveRatioLabel(v18["aspectRatio"]) &&
      (v20["aspectRatio"] = v18["aspectRatio"]),
    v20
  );
}
function resolveMappedModelValue(v22, v23) {
  if (!v22) return "";
  if (typeof v22 === "string") return v22;
  if (typeof v22 !== "object" || Array["isArray"](v22)) return "";
  const v24 = String(v23?.["imageSize"] || "")
      ["trim"]()
      ["toUpperCase"](),
    v25 = v22["byImageSize"] || {};
  return (v24 && v25[v24]) || v22["default"] || v22["model"] || "";
}
function resolveExecutionModelToken(v26, v27) {
  let v28 = v26["model"] || v27["model"] || "";
  const v29 = normalizeManifestOptionKey(
    v27["mode"] ?? v27["generationParams"]?.["mode"],
  );
  let v30 = false;
  if (v29 && v26["modeModels"]) {
    const v31 = resolveMappedModelValue(v26["modeModels"][v29], v27);
    v31 && ((v28 = v31), (v30 = true));
  }
  const v32 = normalizeManifestOptionKey(
    v27["rhModelRoute"] ?? v27["generationParams"]?.["rhModelRoute"],
  );
  if (v32 && v26["routeModels"]) {
    const v33 = resolveMappedModelValue(v26["routeModels"][v32], v27);
    v33 && ((v28 = v33), (v30 = true));
  }
  if (v26["imageSizeModels"] && !v30) {
    const v34 = String(v27["imageSize"] || "")
      ["trim"]()
      ["toUpperCase"]();
    v28 =
      v26["imageSizeModels"][v34] || v26["imageSizeModels"]["default"] || v28;
  }
  return v28;
}
function resolveApiKey(v35, v36, v37) {
  const v38 = v37["getProviderConfig"](v35);
  if (v35 === "runninghub") return v38["modelApiKey"] || v36["apiKey"];
  return v38["apiKey"] || v36["apiKey"];
}
function throwMissingApiKey(v39) {
  throw ApiError["authError"](
    v39,
    null,
    "API Key 未配置（厂商：" + (v39 || "unknown") + "）",
  );
}
function getManifestMaxInputCount(v40, v41) {
  const v42 = Number(v40?.["inputSlots"]?.["maxByKind"]?.[v41]);
  return Number["isFinite"](v42) ? Math["max"](0, v42) : null;
}
async function resolveInputImages(v43, v44, v45, v46, v47 = {}) {
  const v48 = getManifestMaxInputCount(v47["modelManifest"], "image");
  if (v48 === 0) return [];
  const v49 = Array["isArray"](v44["inputUrls"]) ? v44["inputUrls"] : [];
  if (v49["length"] === 0) return [];
  const v50 = v48 === null ? v49 : v49["slice"](0, v48);
  if (v43 === "ppio") {
    const v51 = v46["getProviderConfig"]("grsai"),
      v52 = v51["apiKey"] || v44["apiKey"],
      v53 = await v46["processInputImages"](v50, v52, {
        applyInputQualityProfile: true,
        provider: "grsai",
      });
    if (v53["length"] === 0)
      throw new Error("参考素材上传云端失败，无法继续生成");
    return v53;
  }
  if (v43 === "volcengine") {
    if (typeof v46["uploadInputsToVolcengineFiles"] !== "function")
      throw new Error("Volcengine file upload is not available");
    return v46["uploadInputsToVolcengineFiles"](v50, v45, {
      baseUrl: v47["baseUrl"],
      kind: "image",
      model: v47["executionManifest"]?.["model"],
    });
  }
  return v46["processInputImages"](v50, v45, {
    applyInputQualityProfile: true,
    provider: v43,
    strictUpload: v43 === "apimart" || v43 === "runninghub",
  });
}
function normalizeInputUrlsBySlot(v54) {
  if (!v54 || typeof v54 !== "object" || Array["isArray"](v54)) return {};
  return Object["fromEntries"](
    Object["entries"](v54)
      ["map"](([v55, v56]) => [
        String(v55 || "")["trim"](),
        String(v56 || "")["trim"](),
      ])
      ["filter"](([v57, v58]) => v57 && v58),
  );
}
function getOrderedInputSlotEntries(v59 = {}, v60 = null) {
  const v61 = normalizeInputUrlsBySlot(v59),
    v62 = Array["isArray"](v60?.["inputSlots"]?.["fixedSlots"])
      ? v60["inputSlots"]["fixedSlots"]
      : [],
    v63 = v62["filter"](
      (v64) => String(v64?.["kind"] || "")["trim"]() === "image",
    )
      ["map"]((v65) => String(v65?.["id"] || "")["trim"]())
      ["filter"](Boolean),
    v66 = new Set(),
    v67 = [];
  return (
    v63["forEach"]((v68) => {
      const v69 = v61[v68];
      if (!v69 || v66["has"](v68)) return;
      (v67["push"]({ slot: v68, url: v69 }), v66["add"](v68));
    }),
    Object["entries"](v61)["forEach"](([v70, v71]) => {
      if (v66["has"](v70)) return;
      (v67["push"]({ slot: v70, url: v71 }), v66["add"](v70));
    }),
    v67
  );
}
async function resolveInputImagesBySlot(v72, v73, v74, v75, v76 = {}) {
  const v77 = getOrderedInputSlotEntries(
    v73?.["inputUrlsBySlot"],
    v76["modelManifest"],
  );
  if (v77["length"] === 0) return {};
  const v78 = getManifestMaxInputCount(v76["modelManifest"], "image"),
    v79 = v78 === null ? v77 : v77["slice"](0, Math["max"](0, v78)),
    v80 = await resolveInputImages(
      v72,
      { ...v73, inputUrls: v79["map"]((v81) => v81["url"]) },
      v74,
      v75,
      v76,
    );
  return Object["fromEntries"](
    v79["map"]((v82, v83) => [v82["slot"], String(v80[v83] || "")["trim"]()])[
      "filter"
    ](([, v84]) => v84),
  );
}
function normalizeInputList(v85) {
  return Array["isArray"](v85)
    ? v85["map"]((v86) => String(v86 || "")["trim"]())["filter"](Boolean)
    : [];
}
function collectVideoInputUrls(v87) {
  return Array["from"](
    new Set(
      [
        String(v87["videoUrl"] || "")["trim"](),
        ...normalizeInputList(v87["videos"]),
        ...normalizeInputList(v87["videoUrls"]),
      ]["filter"](Boolean),
    ),
  );
}
function collectAudioInputUrls(v88) {
  return Array["from"](
    new Set(
      [
        String(v88["audioUrl"] || "")["trim"](),
        ...normalizeInputList(v88["audios"]),
        ...normalizeInputList(v88["audioUrls"]),
      ]["filter"](Boolean),
    ),
  );
}
function collectVideoImageInputUrls(v89) {
  const v90 = Array["isArray"](v89["images"])
    ? v89["images"]
    : Array["isArray"](v89["inputUrls"])
      ? v89["inputUrls"]
      : [];
  return Array["from"](
    new Set(
      v90["map"]((v91) => String(v91 || "")["trim"]())["filter"](Boolean),
    ),
  );
}
function omitSlotImageUrlsFromVideoInputs(v92 = {}) {
  const v93 = new Set(
    Object["values"](normalizeInputUrlsBySlot(v92["inputUrlsBySlot"]))
      ["map"]((v94) => String(v94 || "")["trim"]())
      ["filter"](Boolean),
  );
  if (v93["size"] === 0) return v92;
  const v95 = (v96) =>
    Array["isArray"](v96)
      ? v96["filter"]((v97) => !v93["has"](String(v97 || "")["trim"]()))
      : v96;
  return {
    ...v92,
    images: v95(v92["images"]),
    inputUrls: v95(v92["inputUrls"]),
  };
}
const VIDEO_MODEL_API_PROVIDERS = new Set([
  "apimart",
  "runninghub",
  "volcengine",
]);
function getProviderUploadLabel(v98) {
  const v99 = String(v98 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v99 === "runninghub") return "RunningHub";
  if (v99 === "apimart") return "APIMART";
  if (v99 === "volcengine") return "Volcengine";
  return v99 || "Model API";
}
async function uploadVolcengineVideoInputs(v100, v101, v102, v103 = {}) {
  if (typeof v102["uploadInputsToVolcengineFiles"] !== "function")
    throw new Error("Volcengine file upload is not available");
  return v102["uploadInputsToVolcengineFiles"](v100, v101, {
    baseUrl: v103["baseUrl"],
    kind: v103["kind"],
    model: v103["executionManifest"]?.["model"],
    videoFps:
      v103["executionManifest"]?.["extensions"]?.["volcengineFiles"]?.[
        "videoFps"
      ],
  });
}
async function resolveVideoInputImages(v104, v105, v106, v107 = {}) {
  const v108 = String(v107["provider"] || "apimart")
      ["trim"]()
      ["toLowerCase"](),
    v109 = getProviderUploadLabel(v108),
    v110 = getManifestMaxInputCount(v107["modelManifest"], "image");
  if (v110 === 0) return [];
  const v111 = collectVideoImageInputUrls(v104);
  if (v111["length"] === 0) return [];
  const v112 = v110 === null ? v111 : v111["slice"](0, Math["max"](0, v110));
  if (v108 === "volcengine")
    return uploadVolcengineVideoInputs(v112, v105, v106, {
      ...v107,
      kind: "image",
    });
  if (typeof v106["processInputImages"] !== "function")
    throw new Error(v109 + " image input upload is not available");
  const v113 = await v106["processInputImages"](v112, v105, {
    applyInputQualityProfile: true,
    provider: v108,
    strictUpload: true,
  });
  return Array["isArray"](v113)
    ? v113["map"]((v114) => String(v114 || "")["trim"]())["filter"](Boolean)
    : [];
}
async function resolveInputVideos(v115, v116, v117, v118 = {}) {
  const v119 = String(v118["provider"] || "apimart")
      ["trim"]()
      ["toLowerCase"](),
    v120 = getProviderUploadLabel(v119),
    v121 = getManifestMaxInputCount(v118["modelManifest"], "video");
  if (v121 === 0) return [];
  const v122 = collectVideoInputUrls(v115);
  if (v122["length"] === 0) return [];
  const v123 = v121 === null ? v122 : v122["slice"](0, v121);
  if (v119 === "volcengine") {
    const v124 = await uploadVolcengineVideoInputs(v123, v116, v117, {
      ...v118,
      kind: "video",
    });
    if (!Array["isArray"](v124) || v124["length"] === 0)
      throw new Error(v120 + "\x20video\x20upload\x20failed");
    return v124["map"]((v125) => String(v125 || "")["trim"]())["filter"](
      Boolean,
    );
  }
  if (typeof v117["processInputVideos"] !== "function")
    throw new Error(v120 + " video input upload is not available");
  const v126 = await v117["processInputVideos"](v123, v116, {
    provider: v119,
    strictUpload: true,
  });
  if (!Array["isArray"](v126) || v126["length"] === 0)
    throw new Error(v120 + "\x20video\x20upload\x20failed");
  return v126["map"]((v127) => String(v127 || "")["trim"]())["filter"](Boolean);
}
async function resolveInputAudios(v128, v129, v130, v131 = {}) {
  const v132 = String(v131["provider"] || "apimart")
      ["trim"]()
      ["toLowerCase"](),
    v133 = getProviderUploadLabel(v132),
    v134 = getManifestMaxInputCount(v131["modelManifest"], "audio");
  if (v134 === 0) return [];
  const v135 = collectAudioInputUrls(v128);
  if (v135["length"] === 0) return [];
  const v136 = v134 === null ? v135 : v135["slice"](0, v134);
  if (v132 === "volcengine") {
    const v137 = await uploadVolcengineVideoInputs(v136, v129, v130, {
      ...v131,
      kind: "audio",
    });
    if (!Array["isArray"](v137) || v137["length"] === 0)
      throw new Error(v133 + "\x20audio\x20upload\x20failed");
    return v137["map"]((v138) => String(v138 || "")["trim"]())["filter"](
      Boolean,
    );
  }
  if (typeof v130["processInputAudios"] !== "function")
    throw new Error(
      v133 + "\x20audio\x20input\x20upload\x20is\x20not\x20available",
    );
  const v139 = await v130["processInputAudios"](v136, v129, {
    provider: v132,
    strictUpload: true,
  });
  if (!Array["isArray"](v139) || v139["length"] === 0)
    throw new Error(v133 + " audio upload failed");
  return v139["map"]((v140) => String(v140 || "")["trim"]())["filter"](Boolean);
}
function resolveProviderRatioSize(v141, { context: v142 }) {
  const v143 = v142["payload"] || {};
  if (v143["suppressAspectRatio"]) return undefined;
  const v144 = String(
      v141 || v143["resolvedRatioLabel"] || v143["aspectRatio"] || "",
    )
      ["trim"]()
      ["toLowerCase"](),
    v145 =
      v144 === "auto" ||
      v144 === "adaptive" ||
      v144 === "default" ||
      v144 === "自适应",
    v146 = getApimartSeedreamPolicy(v142);
  if (
    v146["preserveAdaptiveInputRatio"] === true &&
    v145 &&
    hasSeedreamInputImages(v142)
  )
    return "auto";
  const v147 = v142["body"]?.["resolution"] || v143["imageSize"] || "2K",
    v148 = resolveProviderRatioPayload({
      provider: v142["provider"],
      model: v143["model"],
      ratioLabel: v141 || v143["resolvedRatioLabel"] || v143["aspectRatio"],
      imageSize: v147,
      suppressAspectRatio: v143["suppressAspectRatio"],
    });
  return v148?.["params"]?.["size"] || undefined;
}
function firstArrayItem(v149) {
  if (Array["isArray"](v149)) return v149[0] || undefined;
  return v149 || undefined;
}
function secondArrayItem(v150) {
  if (Array["isArray"](v150)) return v150[1] || undefined;
  return undefined;
}
function normalizeBooleanParam(v151) {
  if (v151 === true || v151 === false) return v151;
  const v152 = String(v151 ?? "")
    ["trim"]()
    ["toLowerCase"]();
  if (["true", "1", "yes", "on"]["includes"](v152)) return true;
  if (["false", "0", "no", "off", ""]["includes"](v152)) return false;
  return Boolean(v151);
}
function normalizeApimartImageCount(v153) {
  const v154 = Number["parseInt"](String(v153 ?? "")["trim"](), 10);
  if (!Number["isFinite"](v154)) return 1;
  return Math["max"](1, Math["min"](4, v154));
}
function normalizeApimartQwenImageCount(v155) {
  const v156 = Number["parseInt"](String(v155 ?? "")["trim"](), 10);
  if (!Number["isFinite"](v156)) return 1;
  return Math["max"](1, Math["min"](6, v156));
}
function normalizeApimartQwenImageResolution(v157) {
  const v158 = String(v157 || "1K")
    ["trim"]()
    ["toUpperCase"]();
  return v158 === "2K" ? "2K" : "1K";
}
function getApimartSeedreamPolicy(v159 = {}) {
  const v160 = v159["executionManifest"]?.["extensions"]?.["apimartSeedream"];
  return v160 && typeof v160 === "object" && !Array["isArray"](v160)
    ? v160
    : {};
}
function getVolcengineSeedreamPolicy(v161 = {}) {
  const v162 =
    v161["executionManifest"]?.["extensions"]?.["volcengineSeedream"];
  return v162 && typeof v162 === "object" && !Array["isArray"](v162)
    ? v162
    : {};
}
function normalizeResolutionList(v163) {
  return Array["isArray"](v163)
    ? v163["map"]((v164) =>
        String(v164 || "")
          ["trim"]()
          ["toUpperCase"](),
      )["filter"](Boolean)
    : [];
}
function normalizeApimartSeedreamResolution(v165, { context: v166 } = {}) {
  const v167 = getApimartSeedreamPolicy(v166),
    v168 = String(v165 || "2K")
      ["trim"]()
      ["toUpperCase"](),
    v169 = normalizeResolutionList(v167["allowedResolutions"]);
  return v169["includes"](v168) ? v168 : "2K";
}
function normalizeVolcengineSeedreamResolution(v170, { context: v171 } = {}) {
  const v172 = getVolcengineSeedreamPolicy(v171),
    v173 = String(v172["defaultResolution"] || "2K")
      ["trim"]()
      ["toUpperCase"](),
    v174 = String(v170 || v173)
      ["trim"]()
      ["toUpperCase"](),
    v175 = normalizeResolutionList(v172["allowedResolutions"]);
  return v175["includes"](v174) ? v174 : v173;
}
function hasSeedreamInputImages(v176 = {}) {
  if (
    Array["isArray"](v176["inputImages"]) &&
    v176["inputImages"]["length"] > 0
  )
    return true;
  const v177 = v176["payload"] || {},
    v178 = [
      v177["inputUrls"],
      v177["image_urls"],
      v177["imageUrls"],
      v177["image"],
      v177["images"],
    ];
  return v178["some"]((v179) =>
    Array["isArray"](v179)
      ? v179["some"]((v180) => String(v180 || "")["trim"]())
      : String(v179 || "")["trim"](),
  );
}
function hasManifestInputImages(v181 = {}) {
  if (
    Array["isArray"](v181["inputImages"]) &&
    v181["inputImages"]["length"] > 0
  )
    return true;
  const v182 = v181["payload"] || {},
    v183 = [
      v182["inputUrls"],
      v182["image_urls"],
      v182["imageUrls"],
      v182["image"],
      v182["images"],
    ];
  return (
    v183["some"]((v184) =>
      Array["isArray"](v184)
        ? v184["some"]((v185) => String(v185 || "")["trim"]())
        : String(v184 || "")["trim"](),
    ) ||
    Object["values"](normalizeInputUrlsBySlot(v182["inputUrlsBySlot"]))["some"](
      Boolean,
    )
  );
}
function normalizeApimartSeedreamImageCount(v186, { context: v187 } = {}) {
  const v188 = getApimartSeedreamPolicy(v187),
    v189 = Number["parseInt"](String(v186 ?? "")["trim"](), 10),
    v190 = Number["isFinite"](v189) ? v189 : 1,
    v191 = Number["parseInt"](String(v188["maxBatchSize"] ?? 1)["trim"](), 10),
    v192 = Number["isFinite"](v191) && v191 >= 1 ? v191 : 1,
    v193 = Math["max"](1, Math["min"](v192, v190));
  if (!hasSeedreamInputImages(v187)) {
    const v194 = Number["parseInt"](
      String(v188["textToImageBatchSize"] ?? "")["trim"](),
      10,
    );
    if (Number["isFinite"](v194) && v194 >= 1) return Math["min"](v193, v194);
  }
  return v193;
}
function normalizeVolcengineSeedreamCountValue(v195, v196 = {}) {
  const v197 = getVolcengineSeedreamPolicy(v196),
    v198 = Number["parseInt"](String(v195 ?? "")["trim"](), 10),
    v199 = Number["isFinite"](v198) ? v198 : 1,
    v200 = Number["parseInt"](String(v197["maxBatchSize"] ?? 1)["trim"](), 10),
    v201 = Number["isFinite"](v200) && v200 >= 1 ? v200 : 1;
  return Math["max"](1, Math["min"](v201, v199));
}
function normalizeVolcengineSeedreamImageCount(v202, { context: v203 } = {}) {
  const v204 = normalizeVolcengineSeedreamCountValue(v202, v203);
  return v204 > 1 ? v204 : undefined;
}
function resolveVolcengineSeedreamSequentialMode(v205, { context: v206 } = {}) {
  const v207 = normalizeVolcengineSeedreamCountValue(v205, v206);
  return v207 > 1 ? "auto" : "disabled";
}
function resolveVolcengineSeedreamSize(v208, { context: v209 } = {}) {
  const v210 = v209?.["payload"] || {},
    v211 = getVolcengineSeedreamPolicy(v209),
    v212 = normalizeVolcengineSeedreamResolution(v210["imageSize"], {
      context: v209,
    });
  if (v210["suppressAspectRatio"]) return v212;
  const v213 = String(
      v208 || v210["resolvedRatioLabel"] || v210["aspectRatio"] || "",
    )["trim"](),
    v214 = v213["toLowerCase"](),
    v215 = !v213 || v214 === "auto" || v214 === "adaptive" || v214 === "自适应";
  if (
    v211["preserveAdaptiveInputRatio"] === true &&
    v211["supportsAdaptiveSize"] === true &&
    v215 &&
    hasSeedreamInputImages(v209)
  )
    return "adaptive";
  const v216 = resolveProviderRatioPayload({
      provider: v209["provider"],
      model: v210["model"],
      ratioLabel:
        v213 || v210["resolvedRatioLabel"] || v210["aspectRatio"] || "1:1",
      imageSize: v212,
      suppressAspectRatio: false,
    }),
    v217 = v216?.["resolvedRatioLabel"] || "1:1",
    v218 =
      v211["dimensionMapByResolution"] &&
      typeof v211["dimensionMapByResolution"] === "object"
        ? v211["dimensionMapByResolution"][v212]
        : null;
  if (v218?.[v217]) return v218[v217];
  const v219 = Number(v216?.["params"]?.["width"]),
    v220 = Number(v216?.["params"]?.["height"]);
  if (
    Number["isFinite"](v219) &&
    v219 > 0 &&
    Number["isFinite"](v220) &&
    v220 > 0
  )
    return Math["round"](v219) + "x" + Math["round"](v220);
  return v212;
}
function normalizeApimartWanImageResolution(v221, { context: v222 } = {}) {
  const v223 = String(v221 || "2K")
      ["trim"]()
      ["toUpperCase"](),
    v224 = String(v222?.["modelToken"] || "")
      ["trim"]()
      ["toLowerCase"]();
  if (v223 === "1K") return "1K";
  if (
    v223 === "4K" &&
    v224 === "wan2.7-image-pro" &&
    !hasManifestInputImages(v222)
  )
    return "4K";
  return "2K";
}
function normalizeApimartVideoResolutionUpper(v225) {
  const v226 = String(v225 || "720P")
    ["trim"]()
    ["toUpperCase"]();
  if (v226 === "1080P") return "1080P";
  if (v226 === "720P") return "720P";
  if (v226 === "540P") return "540P";
  if (v226 === "480P") return "480P";
  return "720P";
}
function normalizeApimartVideoResolutionLower(v227) {
  const v228 = String(v227 || "720p")
    ["trim"]()
    ["toLowerCase"]();
  if (v228 === "1080p") return "1080p";
  return "720p";
}
function normalizeApimartVeo3VideoResolution(v229) {
  const v230 = String(v229 || "720p")
    ["trim"]()
    ["toLowerCase"]();
  if (v230 === "4k") return "4k";
  if (v230 === "1080p") return "1080p";
  return "720p";
}
function normalizeApimartViduQ3ModelToken(v231 = {}) {
  return String(
    v231?.["modelToken"] ||
      v231?.["body"]?.["model"] ||
      v231?.["payload"]?.["generationParams"]?.["mode"] ||
      v231?.["payload"]?.["mode"] ||
      "viduq3-turbo",
  )
    ["trim"]()
    ["toLowerCase"]();
}
function normalizeApimartViduVideoResolution(v232, { context: v233 } = {}) {
  const v234 = String(v232 || "720p")
      ["trim"]()
      ["toLowerCase"](),
    v235 = normalizeApimartViduQ3ModelToken(v233);
  if (v235 === "viduq3-mix") return v234 === "1080p" ? "1080p" : "720p";
  if (v234 === "540p" || v234 === "720p" || v234 === "1080p") return v234;
  return "720p";
}
function normalizeApimartViduVideoDuration(v236, { context: v237 } = {}) {
  const v238 = normalizeApimartViduQ3ModelToken(v237),
    v239 = v238 === "viduq3" ? 3 : 1,
    v240 = 16,
    v241 = Number(v236),
    v242 = 5,
    v243 = Number["isFinite"](v241) ? Math["trunc"](v241) : v242;
  return Math["min"](v240, Math["max"](v239, v243));
}
function normalizeApimartHailuoVideoResolution(v244) {
  const v245 = String(v244 || "768p")
    ["trim"]()
    ["toLowerCase"]();
  if (v245 === "512p" || v245 === "768p" || v245 === "1080p") return v245;
  return "768p";
}
function normalizeApimartHailuoVideoDuration(v246, { context: v247 } = {}) {
  const v248 = String(
    v247?.["body"]?.["resolution"] ||
      v247?.["payload"]?.["generationParams"]?.["resolution"] ||
      v247?.["payload"]?.["resolution"] ||
      "",
  )
    ["trim"]()
    ["toLowerCase"]();
  if (v248 === "1080p") return 5;
  return Number(v246) === 10 ? 10 : 5;
}
function normalizeApimartHailuo23VideoResolution(v249) {
  const v250 = String(v249 || "768p")
    ["trim"]()
    ["toLowerCase"]();
  if (v250 === "1080p") return "1080p";
  return "768p";
}
function normalizeApimartHailuo23VideoDuration(v251, { context: v252 } = {}) {
  const v253 = String(
    v252?.["body"]?.["resolution"] ||
      v252?.["payload"]?.["generationParams"]?.["resolution"] ||
      v252?.["payload"]?.["resolution"] ||
      "",
  )
    ["trim"]()
    ["toLowerCase"]();
  if (v253 === "1080p") return 6;
  return Number(v251) === 10 ? 10 : 6;
}
function normalizeApimartVideoRatio(v254) {
  const v255 = String(v254 ?? "")["trim"](),
    v256 = v255["toLowerCase"]();
  if (
    !v255 ||
    v256 === "auto" ||
    v256 === "adaptive" ||
    v256 === "default" ||
    v255 === "自适应" ||
    v255 === "默认"
  )
    return undefined;
  return v255;
}
function normalizeApimartOptionalText(v257) {
  const v258 = String(v257 ?? "")["trim"](),
    v259 = v258["toLowerCase"]();
  if (!v258 || v259 === "auto" || v259 === "none") return undefined;
  return v258;
}
function normalizeApimartOptionalInteger(v260) {
  const v261 = String(v260 ?? "")["trim"](),
    v262 = v261["toLowerCase"]();
  if (!v261 || v262 === "auto" || v262 === "none") return undefined;
  const v263 = Number(v261);
  return Number["isFinite"](v263) ? Math["trunc"](v263) : undefined;
}
function normalizeIntegerRange(v264, { spec: v265 } = {}) {
  const v266 = Number(v264),
    v267 = Number["isFinite"](Number(v265?.["fallback"]))
      ? Math["trunc"](Number(v265["fallback"]))
      : 0,
    v268 = Number["isFinite"](v266) ? Math["trunc"](v266) : v267,
    v269 = Number["isFinite"](Number(v265?.["min"]))
      ? Math["trunc"](Number(v265["min"]))
      : v268,
    v270 = Number["isFinite"](Number(v265?.["max"]))
      ? Math["trunc"](Number(v265["max"]))
      : v268;
  return Math["min"](Math["max"](v268, v269), v270);
}
function formatAllowedImageCounts(v271) {
  if (v271["length"] <= 1) return String(v271[0] ?? "");
  if (v271["length"] === 2) return v271[0] + "\x20or\x20" + v271[1];
  return v271["slice"](0, -1)["join"](",\x20") + ", or " + v271["at"](-1);
}
function normalizeImageCountOptions(v272, { spec: v273 } = {}) {
  const v274 = (Array["isArray"](v272) ? v272 : [])
    ["map"]((v275) => String(v275 || "")["trim"]())
    ["filter"](Boolean);
  if (v274["length"] === 0) return v274;
  const v276 = (
    Array["isArray"](v273?.["allowedCounts"]) ? v273["allowedCounts"] : []
  )
    ["map"]((v277) => Number(v277))
    ["filter"]((v278) => Number["isInteger"](v278) && v278 >= 0);
  if (v276["length"] === 0 || v276["includes"](v274["length"])) return v274;
  const v279 =
    String(v273?.["label"] || "This model")["trim"]() || "This model";
  throw new Error(
    v279 +
      " supports only " +
      formatAllowedImageCounts(v276) +
      " reference images",
  );
}
function normalizeApimartKlingVideoMode(v280) {
  const v281 = String(v280 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v281 === "pro" ? "pro" : "std";
}
function normalizeApimartKlingVideoMode4k(v282) {
  const v283 = String(v282 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v283 === "4k") return "4k";
  return v283 === "pro" ? "pro" : "std";
}
function normalizeRunningHubKlingVideoMode(v284) {
  return normalizeApimartKlingVideoMode(v284);
}
function normalizeRunningHubKlingV3Model(v285) {
  const v286 = String(v285 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v286 === "4k") return "4k";
  if (v286 === "pro") return "pro";
  return "std";
}
function normalizeRunningHubKlingV3AspectRatio(v287) {
  const v288 = normalizeApimartVideoRatio(v287);
  return ["16:9", "9:16", "1:1"]["includes"](v288) ? v288 : undefined;
}
function normalizeRunningHubKlingV3Duration(v289) {
  const v290 = Math["trunc"](Number(v289)),
    v291 = Number["isFinite"](v290) ? v290 : 5;
  return String(Math["min"](15, Math["max"](3, v291)));
}
function normalizeRunningHubKlingV3CfgScale(v292) {
  const v293 = Number(v292);
  if (!Number["isFinite"](v293)) return 0.5;
  return Math["min"](1, Math["max"](0, Math["round"](v293 * 10) / 10));
}
function normalizeRunningHubKlingV3ShotType(v294) {
  const v295 = String(v294 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v295 === "intelligence" ? "intelligence" : "customize";
}
function normalizeRunningHubKlingO3Model(v296) {
  return normalizeRunningHubKlingV3Model(v296);
}
function normalizeRunningHubKlingO3AspectRatio(v297) {
  return normalizeRunningHubKlingV3AspectRatio(v297);
}
function normalizeRunningHubKlingO3Duration(v298) {
  return normalizeRunningHubKlingV3Duration(v298);
}
function normalizeRunningHubKlingO3ShotType(v299) {
  return normalizeRunningHubKlingV3ShotType(v299);
}
function normalizeRunningHubKlingO1AspectRatio(v300) {
  const v301 = String(v300 || "9:16")["trim"]();
  return ["16:9", "9:16", "1:1"]["includes"](v301) ? v301 : "9:16";
}
function normalizeRunningHubKlingO1Duration(v302) {
  const v303 = Number(v302);
  return Number["isFinite"](v303) && Math["trunc"](v303) === 10 ? "10" : "5";
}
function normalizeRunningHubHailuo02Duration(v304) {
  const v305 = Number(v304);
  return Number["isFinite"](v305) && Math["trunc"](v305) === 10 ? "10" : "6";
}
function normalizeRunningHubHailuo23Duration(v306) {
  const v307 = Number(v306);
  return Number["isFinite"](v307) && Math["trunc"](v307) === 10 ? "10" : "6";
}
function normalizeRunningHubHappyHorseResolution(v308) {
  return normalizeApimartVideoResolutionLower(v308);
}
function normalizeRunningHubHappyHorseAspectRatio(v309) {
  const v310 = normalizeApimartVideoRatio(v309);
  return ["16:9", "9:16", "1:1", "4:3", "3:4"]["includes"](v310)
    ? v310
    : undefined;
}
function normalizeRunningHubHappyHorseDuration(v311) {
  const v312 = Math["trunc"](Number(v311)),
    v313 = Number["isFinite"](v312) ? v312 : 5;
  return String(Math["min"](15, Math["max"](3, v313)));
}
function normalizeRunningHubHappyHorseAudioSetting(v314) {
  const v315 = String(v314 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v315 === "origin" ? "origin" : "auto";
}
function normalizeRunningHubSeedance2Resolution(v316) {
  const v317 = String(v316 || "720p")
    ["trim"]()
    ["toLowerCase"]();
  if (v317 === "native1080p") return "native1080p";
  if (["480p", "720p", "1080p", "2k", "4k"]["includes"](v317)) return v317;
  return "720p";
}
function normalizeRunningHubSeedance2Duration(v318) {
  const v319 = Math["trunc"](Number(v318)),
    v320 = Number["isFinite"](v319) ? v319 : 5;
  return String(Math["min"](15, Math["max"](4, v320)));
}
function normalizeRunningHubSeedance2Ratio(v321) {
  const v322 = String(v321 ?? "")["trim"](),
    v323 = v322["toLowerCase"]();
  if (
    !v322 ||
    v323 === "auto" ||
    v323 === "adaptive" ||
    v323 === "default" ||
    v322 === "自适应" ||
    v322 === "默认"
  )
    return "adaptive";
  return ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"]["includes"](v322)
    ? v322
    : "adaptive";
}
function normalizeRunningHubVeo3Resolution(v324) {
  const v325 = String(v324 || "720p")
    ["trim"]()
    ["toLowerCase"]();
  if (v325 === "4k") return "4k";
  if (v325 === "1080p") return "1080p";
  return "720p";
}
function normalizeRunningHubVeo3AspectRatio(v326) {
  const v327 = normalizeApimartVideoRatio(v326);
  return ["16:9", "9:16"]["includes"](v327) ? v327 : undefined;
}
function normalizeRunningHubVeo3Duration(v328) {
  const v329 = Math["trunc"](Number(v328));
  return [4, 6, 8]["includes"](v329) ? String(v329) : "8";
}
function normalizeRunningHubWan27Mode(v330 = {}) {
  const v331 = String(
    v330?.["payload"]?.["generationParams"]?.["wan27_mode"] ||
      v330?.["payload"]?.["wan27_mode"] ||
      v330?.["body"]?.["wan27_mode"] ||
      "image",
  )
    ["trim"]()
    ["toLowerCase"]();
  return v331 === "video" || v331 === "reference" || v331 === "edit"
    ? v331
    : "image";
}
function normalizeRunningHubWan27Resolution(v332) {
  const v333 = String(v332 || "720P")
    ["trim"]()
    ["toUpperCase"]();
  return v333 === "1080P" ? "1080P" : "720P";
}
function normalizeRunningHubWan27AspectRatio(v334) {
  const v335 = normalizeApimartVideoRatio(v334);
  return ["16:9", "9:16", "1:1", "4:3", "3:4"]["includes"](v335)
    ? v335
    : undefined;
}
function normalizeRunningHubWan27Duration(v336, { context: v337 } = {}) {
  const v338 = Math["trunc"](Number(v336)),
    v339 = normalizeRunningHubWan27Mode(v337);
  if (v339 === "edit") {
    if (v338 === 0) return "0";
    const v340 = Number["isFinite"](v338) ? v338 : 5;
    return String(Math["min"](10, Math["max"](2, v340)));
  }
  const v341 = Number["isFinite"](v338) ? v338 : 5;
  return String(Math["min"](15, Math["max"](5, v341)));
}
function resolveApimartGoogleSearch(v342, { context: v343 }) {
  const v344 = v343?.["payload"] || {};
  return (
    normalizeBooleanParam(v342) ||
    normalizeBooleanParam(v344["google_image_search"])
  );
}
function resolveApimartGoogleImageSearch(v345, { context: v346 }) {
  const v347 = v346?.["body"] || {},
    v348 = v346?.["payload"] || {};
  return (
    normalizeBooleanParam(v345) &&
    normalizeBooleanParam(v347["google_search"] ?? v348["google_search"])
  );
}
const BODY_MAPPING_TRANSFORMS = Object["freeze"]({
  apimartNanoBanana2Resolution: (v349) =>
    normalizeApimartNanoBanana2Resolution(v349),
  apimartGptImage2Resolution: (v350) =>
    normalizeApimartGptImage2Resolution(v350),
  apimartImageCount: normalizeApimartImageCount,
  apimartQwenImageCount: normalizeApimartQwenImageCount,
  apimartQwenImageResolution: normalizeApimartQwenImageResolution,
  apimartSeedreamResolution: normalizeApimartSeedreamResolution,
  apimartSeedreamImageCount: normalizeApimartSeedreamImageCount,
  volcengineSeedreamSize: resolveVolcengineSeedreamSize,
  volcengineSeedreamImageCount: normalizeVolcengineSeedreamImageCount,
  volcengineSeedreamSequentialMode: resolveVolcengineSeedreamSequentialMode,
  apimartWanImageResolution: normalizeApimartWanImageResolution,
  apimartVideoResolutionUpper: normalizeApimartVideoResolutionUpper,
  apimartVideoResolutionLower: normalizeApimartVideoResolutionLower,
  apimartVeo3VideoResolution: normalizeApimartVeo3VideoResolution,
  apimartViduVideoResolution: normalizeApimartViduVideoResolution,
  apimartViduVideoDuration: normalizeApimartViduVideoDuration,
  apimartHailuoVideoResolution: normalizeApimartHailuoVideoResolution,
  apimartHailuoVideoDuration: normalizeApimartHailuoVideoDuration,
  apimartHailuo23VideoResolution: normalizeApimartHailuo23VideoResolution,
  apimartHailuo23VideoDuration: normalizeApimartHailuo23VideoDuration,
  apimartVideoRatio: normalizeApimartVideoRatio,
  apimartOptionalText: normalizeApimartOptionalText,
  apimartOptionalInteger: normalizeApimartOptionalInteger,
  integerRange: normalizeIntegerRange,
  imageCountOptions: normalizeImageCountOptions,
  apimartKlingVideoMode: normalizeApimartKlingVideoMode,
  apimartKlingVideoMode4k: normalizeApimartKlingVideoMode4k,
  runninghubKlingVideoMode: normalizeRunningHubKlingVideoMode,
  runninghubKlingV3Model: normalizeRunningHubKlingV3Model,
  runninghubKlingV3AspectRatio: normalizeRunningHubKlingV3AspectRatio,
  runninghubKlingV3Duration: normalizeRunningHubKlingV3Duration,
  runninghubKlingV3CfgScale: normalizeRunningHubKlingV3CfgScale,
  runninghubKlingV3ShotType: normalizeRunningHubKlingV3ShotType,
  runninghubKlingO3Model: normalizeRunningHubKlingO3Model,
  runninghubKlingO3AspectRatio: normalizeRunningHubKlingO3AspectRatio,
  runninghubKlingO3Duration: normalizeRunningHubKlingO3Duration,
  runninghubKlingO3ShotType: normalizeRunningHubKlingO3ShotType,
  runninghubKlingO1AspectRatio: normalizeRunningHubKlingO1AspectRatio,
  runninghubKlingO1Duration: normalizeRunningHubKlingO1Duration,
  runninghubHailuo02Duration: normalizeRunningHubHailuo02Duration,
  runninghubHailuo23Duration: normalizeRunningHubHailuo23Duration,
  runninghubHappyHorseResolution: normalizeRunningHubHappyHorseResolution,
  runninghubHappyHorseAspectRatio: normalizeRunningHubHappyHorseAspectRatio,
  runninghubHappyHorseDuration: normalizeRunningHubHappyHorseDuration,
  runninghubHappyHorseAudioSetting: normalizeRunningHubHappyHorseAudioSetting,
  runninghubSeedance2Resolution: normalizeRunningHubSeedance2Resolution,
  runninghubSeedance2Duration: normalizeRunningHubSeedance2Duration,
  runninghubSeedance2Ratio: normalizeRunningHubSeedance2Ratio,
  runninghubVeo3Resolution: normalizeRunningHubVeo3Resolution,
  runninghubVeo3AspectRatio: normalizeRunningHubVeo3AspectRatio,
  runninghubVeo3Duration: normalizeRunningHubVeo3Duration,
  runninghubWan27Resolution: normalizeRunningHubWan27Resolution,
  runninghubWan27AspectRatio: normalizeRunningHubWan27AspectRatio,
  runninghubWan27Duration: normalizeRunningHubWan27Duration,
  apimartGoogleSearch: resolveApimartGoogleSearch,
  apimartGoogleImageSearch: resolveApimartGoogleImageSearch,
  booleanParam: normalizeBooleanParam,
  first: firstArrayItem,
  second: secondArrayItem,
  providerRatioSize: resolveProviderRatioSize,
});
function resolveRequestManifest(v351, v352, v353) {
  let v354 = v351,
    v355 = resolveModelExecution(v351["model"], { providerHint: v352 });
  if (
    v352 &&
    (!v355?.["modelManifest"] || v355["modelManifest"]["provider"] !== v352) &&
    !String(v351["model"] || "")["includes"]("/")
  ) {
    const v356 = v352 + "/" + v351["model"],
      v357 = resolveModelExecution(v356);
    v357?.["modelManifest"]?.["provider"] === v352 &&
      ((v355 = v357), (v354 = { ...v351, model: v356 }));
  }
  v355?.["canonicalModelId"] &&
    v355["canonicalModelId"] !== String(v351["model"] || "")["trim"]() &&
    (v354 = { ...v351, model: v355["canonicalModelId"] });
  const v358 = v355?.["modelManifest"],
    v359 = v355?.["executionManifest"];
  if (
    !v358 ||
    !v359 ||
    v358["adapterType"] !== "modelApi" ||
    v359["adapterType"] !== "modelApi" ||
    v358["kind"] !== v353 ||
    v359["kind"] !== v353
  )
    return null;
  const v360 = v358["provider"];
  if (v352 && v360 !== v352) return null;
  return {
    provider: v360,
    modelManifest: v358,
    executionManifest: v359,
    effectivePayload: v354,
  };
}
async function buildManifestMappedBody(v361) {
  const v362 = await buildBodyFromMapping({
      bodyMapping: v361["executionManifest"]["bodyMapping"],
      context: v361,
      transforms: BODY_MAPPING_TRANSFORMS,
    }),
    v363 = v361["executionManifest"]["extensions"]?.["bodyResolver"];
  if (!v363) return v362;
  const v364 = getModelApiBodyResolver(v363);
  if (typeof v364 !== "function")
    throw new Error("Unsupported model API bodyResolver: " + v363);
  return v364({ ...v361, currentBody: v362 });
}
function resolveDefaultApiUrl(v365, v366, v367) {
  const v368 =
    v365 === "grsai"
      ? String(v366["apiUrl"] || "")
          ["replace"](/\/v1\/?$/, "")
          ["replace"](/\/+$/, "")
      : String(v366["apiUrl"] || "")["replace"](/\/+$/, "");
  return "" + v368 + v367["endpoint"];
}
export function resolveManifestTaskPolling(v369, v370, v371, v372) {
  const v373 = v371["extensions"]?.["taskPolling"];
  if (!v373 || typeof v373 !== "object" || Array["isArray"](v373)) return null;
  const v374 = String(v370["apiUrl"] || "")
      ["replace"](/\/v1\/?$/, "")
      ["replace"](/\/+$/, ""),
    v375 = String(v373["urlTemplate"] || "")["trim"]();
  return {
    method:
      String(v373["method"] || "GET")
        ["trim"]()
        ["toUpperCase"]() || "GET",
    mode: String(v373["mode"] || "task-proxy")["trim"]() || "task-proxy",
    urlTemplate: v375["replace"]("{baseUrl}", v374),
    headersMode: String(v373["headersMode"] || "bearer")["trim"]() || "bearer",
    provider: v369,
    executionId: v371["id"],
    modelId: v372?.["modelManifest"]?.["modelId"] || "",
  };
}
function resolveManifestApiUrl(v376, v377, v378, v379) {
  const v380 = v378["extensions"]?.["endpointResolver"];
  if (!v380) return resolveDefaultApiUrl(v376, v377, v378);
  const v381 = getModelApiEndpointResolver(v380);
  if (typeof v381 !== "function")
    throw new Error("Unsupported model API endpointResolver: " + v380);
  const v382 = v381({
    provider: v376,
    cfg: v377,
    executionManifest: v378,
    ...v379,
  });
  if (!v382)
    throw new Error("Model API endpointResolver returned empty url: " + v380);
  return v382;
}
export async function buildVideoRequestFromManifest(
  v383,
  v384,
  v385,
  v386 = {},
) {
  const v387 = String(v386["expectedProvider"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v388 = resolveRequestManifest(v383, v387, "video");
  if (!v388) return null;
  const {
    provider: v389,
    modelManifest: v390,
    executionManifest: v391,
    effectivePayload: v392,
  } = v388;
  if (!VIDEO_MODEL_API_PROVIDERS["has"](v389)) return null;
  const v393 = sanitizeModelUiSchemaParams(
      v390["modelId"],
      v392["generationParams"],
      { includeDefaults: true },
    ),
    v394 = applyVideoAspectRatioExecutionFallback(
      {
        ...v392,
        generationParams: mergeRootAspectRatioIntoGenerationParams(v392, v393),
      },
      v390,
    ),
    v395 = v385["getProviderConfig"](v389),
    v396 = resolveApiKey(v389, v394, v385);
  !v396 && throwMissingApiKey(v389);
  const v397 = v391["extensions"]?.["bodyResolver"] === "apimartSeedanceVideo",
    v398 = v397
      ? {}
      : await resolveInputImagesBySlot(v389, v394, v396, v385, {
          modelManifest: v390,
          baseUrl: v395["apiUrl"],
          executionManifest: v391,
        }),
    v399 = Object["keys"](v398)["length"] > 0,
    v400 = v399
      ? Object["values"](v398)
          ["map"]((v401) => String(v401 || "")["trim"]())
          ["filter"](Boolean)
      : [],
    v402 =
      !v397 && (!v399 || v389 === "runninghub")
        ? await resolveVideoInputImages(
            v399 && v389 === "runninghub"
              ? omitSlotImageUrlsFromVideoInputs(v394)
              : v394,
            v396,
            v385,
            {
              modelManifest: v391["extensions"]?.["bodyResolver"] ? null : v390,
              provider: v389,
              baseUrl: v395["apiUrl"],
              executionManifest: v391,
            },
          )
        : [],
    v403 = v397 ? [] : v399 ? Array["from"](new Set([...v400, ...v402])) : v402,
    v404 = v397
      ? []
      : await resolveInputVideos(v394, v396, v385, {
          modelManifest: v390,
          provider: v389,
          baseUrl: v395["apiUrl"],
          executionManifest: v391,
        }),
    v405 = v397
      ? []
      : await resolveInputAudios(v394, v396, v385, {
          modelManifest: v390,
          provider: v389,
          baseUrl: v395["apiUrl"],
          executionManifest: v391,
        }),
    v406 = resolveExecutionModelToken(v391, v394),
    v407 = {
      provider: v389,
      modelManifest: v390,
      executionManifest: v391,
      payload: v394,
      finalPrompt: v384,
      modelToken: v406,
      apiKey: v396,
      ctx: v385,
      finalUrls: v403,
      finalUrlsBySlot: v398,
      inputImages: v403,
      inputVideos: v404,
      inputAudios: v405,
    },
    v408 = await buildManifestMappedBody(v407);
  return {
    url: "/api/v2/proxy/image",
    headers: v391["headers"] || { "Content-Type": "application/json" },
    body: {
      apiUrl: resolveManifestApiUrl(v389, v395, v391, v407),
      apiKey: v396,
      ...v408,
    },
    responseMapping: v391["responseMapping"],
    taskPolling: resolveManifestTaskPolling(v389, v395, v391, v407),
    useOpenapiQuery: v389 === "runninghub",
    adapterTrace: {
      source: "manifest",
      executionId: v391["id"],
      modelId: v383["model"],
    },
  };
}
export async function buildTextRequestFromManifest(
  v409,
  v410,
  v411,
  v412 = {},
) {
  const v413 = String(v412["expectedProvider"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v414 = resolveRequestManifest(v409, v413, "text");
  if (!v414) return null;
  const {
      provider: v415,
      modelManifest: v416,
      executionManifest: v417,
      effectivePayload: v418,
    } = v414,
    v419 = v411["getProviderConfig"](v415),
    v420 = resolveApiKey(v415, v418, v411) || v419["apiKey"];
  if (!v420) throwMissingApiKey(v415);
  const v421 = resolveExecutionModelToken(v417, v418),
    v422 = {
      provider: v415,
      modelManifest: v416,
      executionManifest: v417,
      payload: v418,
      finalPrompt: v410,
      modelToken: v421,
      apiKey: v420,
      ctx: v411,
      inputImages: [],
      inputVideos: [],
      inputAudios: [],
    };
  if (v417["endpointMode"] === "responses") {
    if (typeof v411["buildVolcengineResponsesUserContent"] !== "function")
      throw new Error("responses text manifest requires user content resolver");
    const v423 =
        typeof v411["resolveChatCompletionInputUrls"] === "function"
          ? v411["resolveChatCompletionInputUrls"]({
              providerId: v415,
              mediaPolicy: v417["extensions"]?.["chatCompletionInputPolicy"],
              inputUrls: v418["inputUrls"] || [],
              inputImageUrls: v418["inputImageUrls"] || [],
              inputVideoUrls: v418["inputVideoUrls"] || [],
            })
          : v418["inputImageUrls"] || v418["inputUrls"] || [],
      v424 = await v411["buildVolcengineResponsesUserContent"](
        v410,
        v423,
        v420,
        v415,
        {
          mediaPolicy: v417["extensions"]?.["chatCompletionInputPolicy"],
          inputImageUrls: v418["inputImageUrls"] || [],
          inputVideoUrls: v418["inputVideoUrls"] || [],
          baseUrl: v419["apiUrl"],
          model: v421,
          videoFps: v417["extensions"]?.["volcengineFiles"]?.["videoFps"],
        },
      );
    return {
      url: "/api/v2/proxy/completions",
      headers: v417["headers"] || { "Content-Type": "application/json" },
      body: {
        apiUrl: resolveManifestApiUrl(v415, v419, v417, v422),
        apiKey: v420,
        model: v421,
        stream: false,
        ...(v418["systemPrompt"] ? { instructions: v418["systemPrompt"] } : {}),
        input: [{ role: "user", content: v424 }],
      },
      responseMapping: v417["responseMapping"],
      isProxy: true,
      adapterTrace: {
        source: "manifest",
        executionId: v417["id"],
        modelId: v418["model"],
      },
    };
  }
  if (v417["endpointMode"] === "chat-completion") {
    if (typeof v411["buildChatCompletionUserContent"] !== "function")
      throw new Error(
        "chat-completion text manifest requires user content resolver",
      );
    const v425 =
        typeof v411["resolveChatCompletionInputUrls"] === "function"
          ? v411["resolveChatCompletionInputUrls"]({
              providerId: v415,
              mediaPolicy: v417["extensions"]?.["chatCompletionInputPolicy"],
              inputUrls: v418["inputUrls"] || [],
              inputImageUrls: v418["inputImageUrls"] || [],
              inputVideoUrls: v418["inputVideoUrls"] || [],
            })
          : v418["inputImageUrls"] || v418["inputUrls"] || [],
      v426 = await v411["buildChatCompletionUserContent"](
        v410,
        v425,
        v420,
        v415,
        {
          mediaPolicy: v417["extensions"]?.["chatCompletionInputPolicy"],
          inputImageUrls: v418["inputImageUrls"] || [],
          inputVideoUrls: v418["inputVideoUrls"] || [],
        },
      );
    return {
      url: "/api/v2/proxy/completions",
      headers: v417["headers"] || { "Content-Type": "application/json" },
      body: {
        apiUrl: resolveManifestApiUrl(v415, v419, v417, v422),
        apiKey: v420,
        model: v421,
        stream: false,
        messages: [
          {
            role: "system",
            content: v418["systemPrompt"] || "You are a helpful assistant.",
          },
          { role: "user", content: v426 },
        ],
      },
      responseMapping: v417["responseMapping"],
      isProxy: true,
      adapterTrace: {
        source: "manifest",
        executionId: v417["id"],
        modelId: v418["model"],
      },
    };
  }
  const v427 = Array["isArray"](v418["inputImageUrls"])
    ? v418["inputImageUrls"]
    : [];
  if (v427["length"] === 0)
    throw new Error(
      "RunningHub\x20image-to-text\x20manifest\x20requires\x20an\x20image\x20input",
    );
  const v428 = await v411["buildRunningHubTextImageUrl"](v427, v420);
  if (!v428) throw new Error("RunningHub image-to-text image upload failed");
  return {
    url: "/api/v2/proxy/image",
    headers: v417["headers"] || { "Content-Type": "application/json" },
    body: {
      apiUrl: "https://www.runninghub.cn/openapi/v2/" + v417["model"],
      apiKey: v420,
      prompt: v410,
      imageUrl: v428,
    },
    responseMapping: v417["responseMapping"],
    isProxy: true,
    adapterTrace: {
      source: "manifest",
      executionId: v417["id"],
      modelId: v418["model"],
    },
  };
}
export async function buildImageRequestFromManifest(
  v429,
  v430,
  v431,
  v432 = {},
) {
  const v433 = String(v432["expectedProvider"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v434 = resolveRequestManifest(v429, v433, "image");
  if (!v434) return null;
  const {
    provider: v435,
    modelManifest: v436,
    executionManifest: v437,
    effectivePayload: v438,
  } = v434;
  if (
    !["apimart", "ppio", "grsai", "runninghub", "volcengine"]["includes"](v435)
  )
    return null;
  const v439 = v431["getProviderConfig"](v435),
    v440 = resolveApiKey(v435, v429, v431);
  !v440 && throwMissingApiKey(v435);
  const v441 = await resolveInputImagesBySlot(v435, v438, v440, v431, {
      modelManifest: v436,
      executionManifest: v437,
      baseUrl: v439["apiUrl"],
    }),
    v442 = Object["keys"](v441)["length"] > 0,
    v443 = v442
      ? Object["values"](v441)
      : await resolveInputImages(v435, v438, v440, v431, {
          modelManifest: v436,
          executionManifest: v437,
          baseUrl: v439["apiUrl"],
        }),
    v444 = resolveExecutionModelToken(v437, v438),
    v445 = {
      provider: v435,
      modelManifest: v436,
      executionManifest: v437,
      payload: v438,
      finalPrompt: v430,
      modelToken: v444,
      apiKey: v440,
      ctx: v431,
      finalUrls: v443,
      finalUrlsBySlot: v441,
      inputImages: v443,
      inputVideos: [],
      inputAudios: [],
    },
    v446 = await buildManifestMappedBody(v445),
    v447 = v435 === "runninghub";
  return {
    url: "/api/v2/proxy/image",
    headers: v437["headers"] || { "Content-Type": "application/json" },
    body: {
      apiUrl: resolveManifestApiUrl(v435, v439, v437, v445),
      apiKey: v440,
      ...v446,
    },
    responseMapping: v437["responseMapping"],
    taskPolling: resolveManifestTaskPolling(v435, v439, v437, v445),
    adapterTrace: {
      source: "manifest",
      executionId: v437["id"],
      modelId: v429["model"],
    },
    ...(v447
      ? {
          isAsync: true,
          taskIdPath:
            v437["responseMapping"]?.["taskIdPath"] ||
            v437["result"]?.["taskIdPath"] ||
            "taskId",
          useOpenapiQuery: true,
          pollUrlBuilder: () => "https://www.runninghub.cn/openapi/v2/query",
          resultExtractor: (v448) => {
            if (
              v448["status"] === "COMPLETED" &&
              Array["isArray"](v448["results"])
            )
              return v448["results"]
                [
                  "map"
                ]((v449) => v449["url"] || v449["imageUrl"] || v449["videoUrl"])
                ["filter"](Boolean);
            return [];
          },
        }
      : {}),
  };
}
