import {
  DREAMINA_VIDEO_ALLOWED_RATIOS,
  ensureDreaminaStyleVideoModelForTask,
  isDreaminaVideoRouteModeEnabled,
  normalizeDreaminaStyleVideoDuration,
  normalizeDreaminaStyleVideoResolution,
  normalizeDreaminaVideoAspectRatio,
  normalizeDreaminaVideoRouteMode,
  resolveDreaminaStyleVideoCounterpartModel,
  resolveDreaminaStyleVideoProvider,
  resolveDreaminaVideoTaskType,
  isDreaminaStyleVideoTaskModelSupported,
} from "../../modules/dreaminaVideoModelHelper.js";
import { getPlainGenerationParams } from "./runningHubVideoUiSchema.js";
export const DREAMINA_VIDEO_PARAM_FIELD_IDS = new Set([
  "dreaminaRouteMode",
  "aspectRatio",
  "resolution",
  "duration",
]);
const DREAMINA_ROUTE_MODEL_MEMORY_FIELD = "dreaminaModelByRouteMode";
function hasOwnParam(v0, v1) {
  return Object["prototype"]["hasOwnProperty"]["call"](v0 || {}, v1);
}
export function getDreaminaEffectiveNodeData(v2 = {}) {
  const v3 = v2 && typeof v2 === "object" ? v2 : {},
    v4 = getPlainGenerationParams(v3["generationParams"]),
    v5 = { ...v3 };
  DREAMINA_VIDEO_PARAM_FIELD_IDS["forEach"]((v6) => {
    hasOwnParam(v4, v6) && (v5[v6] = v4[v6]);
  });
  const v7 = normalizeDreaminaVideoRouteMode(
    v5["dreaminaRouteMode"],
    v5["mode"],
  );
  if (v7) v5["dreaminaRouteMode"] = v7;
  hasOwnParam(v4, "resolution") && (v5["videoSize"] = v4["resolution"]);
  const v8 = { ...v4 };
  !hasOwnParam(v8, "dreaminaRouteMode") && v7 && (v8["dreaminaRouteMode"] = v7);
  !hasOwnParam(v8, "aspectRatio") &&
    (v8["aspectRatio"] = v5["aspectRatio"] || "自适应");
  if (!hasOwnParam(v8, "resolution")) {
    const v9 = v5["resolution"] || v5["videoSize"];
    if (v9) v8["resolution"] = v9;
  }
  return (
    !hasOwnParam(v8, "duration") &&
      v5["duration"] !== undefined &&
      (v8["duration"] = v5["duration"]),
    (v5["generationParams"] = v8),
    v5
  );
}
export function buildDreaminaParamPatch(v10 = {}, v11 = {}) {
  const v12 = getPlainGenerationParams(v10?.["generationParams"]);
  Object["entries"](v11 || {})["forEach"](([v13, v14]) => {
    if (!DREAMINA_VIDEO_PARAM_FIELD_IDS["has"](v13)) return;
    v12[v13] = v14;
  });
  const v15 = { generationParams: v12 },
    v16 = String(v10?.["model"] || "")["trim"]();
  return (
    v16 &&
      (v15["generationParamsByModel"] = {
        ...getPlainGenerationParams(v10?.["generationParamsByModel"]),
        [v16]: v12,
      }),
    v15
  );
}
function buildDreaminaModelParamSnapshot(v17 = {}) {
  const v18 = getDreaminaEffectiveNodeData(v17),
    v19 = getPlainGenerationParams(v18?.["generationParams"]),
    v20 = { ...v19 };
  return (
    DREAMINA_VIDEO_PARAM_FIELD_IDS["forEach"]((v21) => {
      if (v20[v21] !== undefined) return;
      v18?.[v21] !== undefined && (v20[v21] = v18[v21]);
    }),
    v20["resolution"] === undefined &&
      v18?.["videoSize"] !== undefined &&
      (v20["resolution"] = v18["videoSize"]),
    v20[DREAMINA_ROUTE_MODEL_MEMORY_FIELD] === undefined &&
      v18?.[DREAMINA_ROUTE_MODEL_MEMORY_FIELD] !== undefined &&
      (v20[DREAMINA_ROUTE_MODEL_MEMORY_FIELD] = getPlainGenerationParams(
        v18[DREAMINA_ROUTE_MODEL_MEMORY_FIELD],
      )),
    v20["dreaminaRouteMode"] !== undefined &&
      (v20["dreaminaRouteMode"] = normalizeDreaminaVideoRouteMode(
        v20["dreaminaRouteMode"],
        v18?.["mode"],
      )),
    v20
  );
}
function getDreaminaRouteModelMemory(v22 = {}) {
  const v23 = getPlainGenerationParams(v22?.["generationParams"]),
    v24 = getPlainGenerationParams(v22?.["generationParamsByModel"]),
    v25 = {};
  return (
    Object["values"](v24)["forEach"]((v26) => {
      Object["assign"](
        v25,
        getPlainGenerationParams(v26?.[DREAMINA_ROUTE_MODEL_MEMORY_FIELD]),
      );
    }),
    {
      ...v25,
      ...getPlainGenerationParams(v23[DREAMINA_ROUTE_MODEL_MEMORY_FIELD]),
      ...getPlainGenerationParams(v22?.[DREAMINA_ROUTE_MODEL_MEMORY_FIELD]),
    }
  );
}
function getDreaminaRouteModelMemoryKey(v27, v28) {
  const v29 = String(v27 || "dreamina")
      ["trim"]()
      ["toLowerCase"](),
    v30 = normalizeDreaminaVideoRouteMode(v28);
  return v29 + ":" + v30;
}
function rememberDreaminaRouteModel(v31, v32, v33, v34) {
  const v35 = v31 && typeof v31 === "object" ? v31 : {},
    v36 = String(v34 || "")["trim"]();
  if (!v36) return v35;
  return ((v35[getDreaminaRouteModelMemoryKey(v32, v33)] = v36), v35);
}
function getRememberedDreaminaRouteModel(v37, v38, v39) {
  const v40 = v37?.[getDreaminaRouteModelMemoryKey(v38, v39)];
  return String(v40 || "")["trim"]();
}
function ensureSupportedRouteModel(v41, v42, v43) {
  const v44 = String(v42 || "")["trim"]();
  if (!v44) return "";
  if (!isDreaminaStyleVideoTaskModelSupported(v41, v44, v43)) return "";
  return ensureDreaminaStyleVideoModelForTask(v41, v44, v43);
}
function getSavedDreaminaProviderRouteModel(
  v45 = {},
  { provider: v46, routeMode: v47, taskType: v48, fallbackModel: v49 } = {},
) {
  const v50 = getPlainGenerationParams(v45?.["generationParamsByModel"]),
    v51 = [];
  Object["entries"](v50)["forEach"](([v52, v53]) => {
    const v54 = String(v52 || "")["trim"]();
    if (!v54) return;
    const v55 = resolveDreaminaStyleVideoProvider(v54, v46);
    if (v55 !== v46) return;
    const v56 = ensureSupportedRouteModel(v48, v54, v46);
    if (!v56) return;
    const v57 = normalizeDreaminaVideoRouteMode(
      v53?.["dreaminaRouteMode"],
      v45?.["mode"],
    );
    if (v57 !== v47) return;
    v51["push"](v56);
  });
  if (!v51["length"]) return "";
  const v58 = ensureSupportedRouteModel(v48, v49, v46),
    v59 = v51["slice"]()
      ["reverse"]()
      ["find"]((v60) => v60 !== v58);
  return v59 || v51[v51["length"] - 1] || "";
}
export function resolveDreaminaRememberedRouteModel(
  v61 = {},
  { provider: v62, routeMode: v63, taskType: v64, fallbackModel: v65 } = {},
) {
  const v66 = getDreaminaEffectiveNodeData(v61),
    v67 = resolveDreaminaStyleVideoProvider(v65, v62 || v66?.["provider"]),
    v68 = normalizeDreaminaVideoRouteMode(
      v63 || v66?.["dreaminaRouteMode"],
      v66?.["mode"],
    ),
    v69 =
      String(v64 || "")["trim"]() ||
      resolveDreaminaVideoTaskType({ routeMode: v68 }),
    v70 = getRememberedDreaminaRouteModel(
      getDreaminaRouteModelMemory(v66),
      v67,
      v68,
    ),
    v71 = ensureSupportedRouteModel(v69, v70, v67);
  if (v71) return v71;
  const v72 = String(v66?.["model"] || "")["trim"](),
    v73 = resolveDreaminaStyleVideoProvider(v72, v66?.["provider"]),
    v74 = v73 === v67 ? ensureSupportedRouteModel(v69, v72, v67) : "";
  if (v74) return v74;
  const v75 = getSavedDreaminaProviderRouteModel(v66, {
    provider: v67,
    routeMode: v68,
    taskType: v69,
    fallbackModel: v65,
  });
  if (v75) return v75;
  const v76 = resolveDreaminaStyleVideoCounterpartModel(v72, v67, {
      taskType: v69,
    }),
    v77 = ensureSupportedRouteModel(v69, v76, v67);
  if (v77) return v77;
  return ensureDreaminaStyleVideoModelForTask(v69, v65, v67);
}
export function buildDreaminaModelSelectionParamPatch(
  v78 = {},
  {
    model: v79,
    provider: v80,
    taskType: v81,
    fallbackValues: fallbackValues = {},
    restoreTargetParams: restoreTargetParams = true,
    rememberCurrentModel: rememberCurrentModel = true,
  } = {},
) {
  const v82 = getDreaminaEffectiveNodeData(v78),
    v83 = String(v79 || "")["trim"]();
  if (!v83) return {};
  const v84 = resolveDreaminaStyleVideoProvider(v83, v80 || v82?.["provider"]),
    v85 = getPlainGenerationParams(v82?.["generationParamsByModel"]),
    v86 = String(v82?.["model"] || "")["trim"](),
    v87 = resolveDreaminaStyleVideoProvider(v86, v82?.["provider"]),
    v88 = normalizeDreaminaVideoRouteMode(
      v82?.["dreaminaRouteMode"],
      v82?.["mode"],
    ),
    v89 = getDreaminaRouteModelMemory(v82),
    v90 = getPlainGenerationParams(v85[v83]);
  Object["assign"](
    v89,
    getPlainGenerationParams(v90[DREAMINA_ROUTE_MODEL_MEMORY_FIELD]),
  );
  v86 &&
    rememberCurrentModel &&
    (rememberDreaminaRouteModel(v89, v87, v88, v86),
    (v85[v86] = {
      ...buildDreaminaModelParamSnapshot(v82),
      [DREAMINA_ROUTE_MODEL_MEMORY_FIELD]: v89,
    }));
  const v91 = {
      ...buildDreaminaModelParamSnapshot(v82),
      ...getPlainGenerationParams(fallbackValues),
    },
    v92 = restoreTargetParams ? v90 : {},
    v93 = normalizeDreaminaVideoRouteMode(
      v91["dreaminaRouteMode"],
      v82?.["mode"],
    ),
    v94 = String(v81 || "")["trim"](),
    v95 = v94 || resolveDreaminaVideoTaskType({ routeMode: v93 }),
    v96 = { ...v91, ...v92, dreaminaRouteMode: v93 },
    v97 = normalizeDreaminaVideoAspectRatio(v96["aspectRatio"], {
      preserveAdaptive: true,
    }),
    v98 = normalizeDreaminaStyleVideoResolution(
      v95,
      v83,
      v96["resolution"],
      v84,
    ),
    v99 = normalizeDreaminaStyleVideoDuration(v95, v83, v96["duration"], v84),
    v100 = {
      ...v92,
      dreaminaRouteMode: v93,
      aspectRatio: v97,
      duration: v99,
      [DREAMINA_ROUTE_MODEL_MEMORY_FIELD]: v89,
    };
  if (v98) v100["resolution"] = v98;
  return (
    rememberDreaminaRouteModel(v89, v84, v93, v83),
    (v85[v83] = v100),
    {
      dreaminaRouteMode: v93,
      [DREAMINA_ROUTE_MODEL_MEMORY_FIELD]: v89,
      generationParams: v100,
      generationParamsByModel: v85,
    }
  );
}
export function buildDreaminaStorePatchFromNormalization(v101 = {}, v102 = {}) {
  const v103 = getDreaminaEffectiveNodeData(v101),
    v104 = {},
    v105 = {};
  Object["entries"](v102 || {})["forEach"](([v106, v107]) => {
    DREAMINA_VIDEO_PARAM_FIELD_IDS["has"](v106)
      ? (v105[v106] = v107)
      : (v104[v106] = v107);
  });
  const v108 = Object["keys"](v105)["length"]
    ? buildDreaminaParamPatch({ ...v103, ...v104 }, v105)
    : {};
  return { ...v104, ...v108 };
}
export function buildDreaminaRouteModeUpdate({
  nextRouteMode: v109,
  baseNodeData: baseNodeData = {},
  incoming: incoming = [],
  nodes: nodes = {},
} = {}) {
  const v110 = normalizeDreaminaVideoRouteMode(v109),
    v111 = getDreaminaEffectiveNodeData(baseNodeData);
  if (!v110) return { nodeData: v111, patch: {}, edgeIdsToRemove: [] };
  if (!isDreaminaVideoRouteModeEnabled(v110))
    return { disabled: true, nodeData: v111, patch: {}, edgeIdsToRemove: [] };
  const v112 = (v113) => {
      const v114 = Number(v113?.["createdAt"]);
      if (Number["isFinite"](v114) && v114 > 0) return v114;
      const v115 = String(v113?.["id"] || ""),
        v116 = v115["match"](/(\d{10,})/g);
      return v116 && v116["length"] ? Number(v116[v116["length"] - 1]) || 0 : 0;
    },
    v117 = [],
    v118 = [],
    v119 = [],
    v120 = [];
  for (const v121 of incoming || []) {
    const v122 = nodes?.[v121["sourceId"]],
      v123 = String(v122?.["type"] || "")["toLowerCase"]();
    if (v123["includes"]("image")) v117["push"](v121);
    else {
      if (v123["includes"]("video")) v118["push"](v121);
      else {
        if (v123["includes"]("audio")) v119["push"](v121);
        else {
          if (v110 === "frames2video") v120["push"](v121["id"]);
        }
      }
    }
  }
  if (v110 === "frames2video") {
    (v118["forEach"]((v124) => v120["push"](v124["id"])),
      v119["forEach"]((v125) => v120["push"](v125["id"])),
      v117["sort"]((v126, v127) => v112(v126) - v112(v127)));
    while (v117["length"] > 2) {
      const v128 = v117["shift"]();
      if (v128?.["id"]) v120["push"](v128["id"]);
    }
  } else {
    if (v110 === "multimodal2video") {
      (v117["sort"]((v129, v130) => v112(v129) - v112(v130)),
        v118["sort"]((v131, v132) => v112(v131) - v112(v132)),
        v119["sort"]((v133, v134) => v112(v133) - v112(v134)));
      while (v117["length"] > 9) {
        const v135 = v117["shift"]();
        if (v135?.["id"]) v120["push"](v135["id"]);
      }
      while (v118["length"] > 3) {
        const v136 = v118["shift"]();
        if (v136?.["id"]) v120["push"](v136["id"]);
      }
      while (v119["length"] > 3) {
        const v137 = v119["shift"]();
        if (v137?.["id"]) v120["push"](v137["id"]);
      }
    }
  }
  const v138 = {
      imageCount: v117["length"],
      videoCount: v118["length"],
      audioCount: v119["length"],
    },
    v139 = resolveDreaminaVideoTaskType({
      routeMode: v110,
      imageCount: v138["imageCount"],
      videoCount: v138["videoCount"],
      audioCount: v138["audioCount"],
    }),
    v140 = resolveDreaminaStyleVideoProvider(
      v111?.["model"],
      v111?.["provider"],
    ),
    v141 = { provider: v140 },
    v142 = getPlainGenerationParams(v111?.["generationParamsByModel"]),
    v143 = getDreaminaRouteModelMemory(v111),
    v144 = normalizeDreaminaVideoRouteMode(
      v111?.["dreaminaRouteMode"],
      v111?.["mode"],
    ),
    v145 = String(v111?.["model"] || "")["trim"]();
  v145 &&
    (rememberDreaminaRouteModel(v143, v140, v144, v145),
    (v142[v145] = {
      ...buildDreaminaModelParamSnapshot(v111),
      [DREAMINA_ROUTE_MODEL_MEMORY_FIELD]: v143,
    }));
  const v146 = getRememberedDreaminaRouteModel(v143, v140, v110),
    v147 =
      v146 && isDreaminaStyleVideoTaskModelSupported(v139, v146, v140)
        ? ensureDreaminaStyleVideoModelForTask(v139, v146, v140)
        : "",
    v148 =
      v147 || ensureDreaminaStyleVideoModelForTask(v139, v111?.["model"], v140);
  if (v148) v141["model"] = v148;
  const v149 = normalizeDreaminaStyleVideoResolution(
      v139,
      v148,
      v111?.["resolution"] || v111?.["videoSize"],
      v140,
    ),
    v150 = normalizeDreaminaStyleVideoDuration(
      v139,
      v148,
      v111?.["duration"],
      v140,
    ),
    v151 = { dreaminaRouteMode: v110, duration: v150 };
  if (v149) v151["resolution"] = v149;
  const v152 = buildDreaminaModelSelectionParamPatch(
      {
        ...v111,
        ...v141,
        generationParamsByModel: v142,
        [DREAMINA_ROUTE_MODEL_MEMORY_FIELD]: v143,
      },
      {
        model: v148,
        provider: v140,
        taskType: v139,
        fallbackValues: v151,
        rememberCurrentModel: false,
      },
    ),
    v153 = { ...v141, ...v152 };
  return {
    disabled: false,
    edgeIdsToRemove: v120,
    nodeData: getDreaminaEffectiveNodeData({ ...v111, ...v153 }),
    patch: v153,
  };
}
export function buildDreaminaParamSchemaFields({
  routeMode: v154,
  currentRatio: v155,
  currentResolution: v156,
  currentDuration: v157,
  durationRange: v158,
  resolutionOptions: v159,
} = {}) {
  const v160 = normalizeDreaminaVideoRouteMode(v154),
    v161 = [
      "自适应",
      "1:1",
      "9:16",
      "16:9",
      "3:4",
      "4:3",
      "3:2",
      "2:3",
      "5:4",
      "4:5",
      "21:9",
    ]["map"]((v162) => ({
      value: v162,
      label: v162,
      disabled:
        v162 !== "自适应" && !DREAMINA_VIDEO_ALLOWED_RATIOS["includes"](v162),
    })),
    v163 = Array["isArray"](v159) ? v159["filter"](Boolean) : [],
    v164 = v163["length"] ? v163 : v156 ? [v156] : ["720p"];
  return {
    mode: {
      id: "dreaminaRouteMode",
      type: "segmented",
      label: "模式",
      defaultValue: v160 || "multimodal2video",
      variant: "pillMenu",
      options: [
        {
          value: "multimodal2video",
          label: "全能参考",
          selectedLabel: "全能参考",
        },
        { value: "frames2video", label: "首尾帧", selectedLabel: "首尾帧" },
      ],
    },
    resolution: {
      id: "resolution",
      type: "segmented",
      label: "分辨率",
      defaultValue: v156 || v164[0] || "720p",
      options: v164["map"]((v165) => ({
        value: v165,
        label: v165,
        disabled: v164["length"] === 1,
      })),
    },
    aspectRatio: {
      id: "aspectRatio",
      type: "segmented",
      label: "比例",
      defaultValue: v155 || "自适应",
      options: v161,
    },
    duration: {
      id: "duration",
      type: "slider",
      label: "视频时长",
      defaultValue: Number(v157) || Number(v158?.["min"]) || 5,
      min: Number(v158?.["min"]) || 4,
      max: Number(v158?.["max"]) || 15,
      step: Number(v158?.["step"]) || 1,
      variant: "durationPill",
    },
  };
}
