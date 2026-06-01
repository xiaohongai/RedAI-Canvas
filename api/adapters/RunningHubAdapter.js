import { resolveModelExecution } from "../../src/manifests/index.js";
import { normalizeRatioLabelText } from "../imageRatioPolicy.js";
import { buildImageRequestFromManifest } from "./ModelApiManifestNormalizer.js";
import { getRunningHubWorkflowPayloadResolver } from "./runninghubWorkflowResolvers/index.js";
const RH_V54_SOURCE_VIDEO_MISSING_MESSAGE =
    "未获取到源视频 URL，请重新连接或重新上传源视频后再生成。",
  RH_V54_SOURCE_VIDEO_UPLOAD_FAILED_MESSAGE =
    "源视频上传失败，可能是网络延迟或视频文件暂时无法访问，请稍后重试，或重新上传源视频。",
  RH_VIDEO_FPS_OPTIONS = Object["freeze"]([16, 24, 30]),
  RH_MIN_VIDEO_RESOLUTION = 832,
  RUNNINGHUB_WORKFLOW_DEFAULT_RATIO = "1:1",
  RUNNINGHUB_WORKFLOW_RATIO_SET = new Set([
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
  ]);
function isAdvancedModeEnabled() {
  return typeof window !== "undefined" && window["ADVANCED_MODE"] === true;
}
function normalizeRhVideoFps(v0) {
  const v1 = Math["trunc"](Number(v0));
  return RH_VIDEO_FPS_OPTIONS["includes"](v1) ? v1 : 24;
}
function normalizeRhVideoResolution(v2, v3 = RH_MIN_VIDEO_RESOLUTION) {
  const v4 = Number(v2);
  return Number["isFinite"](v4)
    ? Math["max"](RH_MIN_VIDEO_RESOLUTION, Math["trunc"](v4))
    : v3;
}
function normalizeRunningHubWorkflowRatio(v5) {
  const v6 = String(v5 || "")["trim"]();
  if (!v6) return RUNNINGHUB_WORKFLOW_DEFAULT_RATIO;
  const v7 = normalizeRatioLabelText(v6),
    v8 = v7["toLowerCase"]();
  if (
    v8 === "auto" ||
    v8 === "default" ||
    v7 === "默认" ||
    v7 === "自适应" ||
    v8 === "original" ||
    v7 === "原图比例"
  )
    return RUNNINGHUB_WORKFLOW_DEFAULT_RATIO;
  if (!v7["includes"](":")) return RUNNINGHUB_WORKFLOW_DEFAULT_RATIO;
  const [v9, v10] = v7["split"](":"),
    v11 = Number["parseFloat"](v9),
    v12 = Number["parseFloat"](v10);
  if (!(v11 > 0 && v12 > 0)) return RUNNINGHUB_WORKFLOW_DEFAULT_RATIO;
  const v13 = v11 + ":" + v12;
  return RUNNINGHUB_WORKFLOW_RATIO_SET["has"](v13)
    ? v13
    : RUNNINGHUB_WORKFLOW_DEFAULT_RATIO;
}
function normalizeQwenImageEditModeIndex(v14) {
  const v15 = String(v14 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v15 === "0" || v15 === "qwen2509" || v15 === "2509") return "0";
  return "1";
}
function normalizeQwenFirstImageModeIndex(v16) {
  const v17 = String(v16 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v17 === "1" || v17 === "pose" || v17 === "姿势图") return "1";
  if (v17 === "2" || v17 === "depth" || v17 === "深度图") return "2";
  return "0";
}
function normalizeQwenImageEditQuality(v18) {
  const v19 = String(v18 || "")
    ["trim"]()
    ["toUpperCase"]();
  if (v19 === "1.5K") return "1.5K";
  return v19 === "1K" ? "1K" : "2K";
}
function resolveQwenImageEditDimensions(v20, v21) {
  const v22 = normalizeQwenImageEditQuality(v20),
    v23 = v22 === "1K" ? 1024 : v22 === "1.5K" ? 1536 : 1920,
    v24 = normalizeRunningHubWorkflowRatio(v21),
    [v25, v26] = v24["split"](":"),
    v27 = Number["parseFloat"](v25) || 1,
    v28 = Number["parseFloat"](v26) || 1,
    v29 = v27 >= v28,
    v30 = v29 ? v23 : (v23 * v27) / v28,
    v31 = v29 ? (v23 * v28) / v27 : v23,
    v32 = 64,
    v33 = (v34) =>
      Math["max"](512, Math["round"](Number(v34 || 0) / v32) * v32);
  return { width: v33(v30), height: v33(v31) };
}
function normalizeManifestMappedValue(v35, v36) {
  const v37 = String(v35 ?? v36?.["defaultValue"] ?? "")["trim"](),
    v38 = v36?.["valueMap"] || {};
  return (
    v38[v37] ||
    v38[v37["toLowerCase"]()] ||
    v38[String(v36?.["defaultValue"] || "")] ||
    v37
  );
}
function formatManifestPromptNodeValue(v39, v40) {
  const v41 = String(v39 || "")["trim"](),
    v42 = String(v40?.["defaultValue"] ?? ""),
    v43 = v41 || v42;
  if (!v43) return "";
  return (
    "" + String(v40?.["prefix"] ?? "") + v43 + String(v40?.["suffix"] ?? "")
  );
}
function normalizeManifestImageNode(v44, v45) {
  if (v44 && typeof v44 === "object" && !Array["isArray"](v44))
    return {
      nodeId: String(v44["nodeId"] || "")["trim"](),
      fieldName: String(v44["fieldName"] || "image")["trim"]() || "image",
      description: v44["description"] || "图" + (v45 + 1),
    };
  return {
    nodeId: String(v44 || "")["trim"](),
    fieldName: "image",
    description: "图" + (v45 + 1),
  };
}
function getManifestPayloadPathValue(v46, v47) {
  const v48 = String(v47 || "")["trim"]();
  if (!v48) return undefined;
  return v48["split"](".")["reduce"]((v49, v50) => {
    if (v49 === undefined || v49 === null) return undefined;
    return v49[v50];
  }, v46);
}
function resolveManifestPayloadValue(v51, v52 = [], v53 = "") {
  const v54 = Array["isArray"](v52) ? v52 : [v52];
  for (const v55 of v54["filter"](Boolean)) {
    const v56 = getManifestPayloadPathValue(v51, v55);
    if (v56 !== undefined && v56 !== null && String(v56)["trim"]() !== "")
      return v56;
  }
  return v53;
}
function normalizeManifestValueNodeValue(v57, v58) {
  const v59 = [
    ...(Array["isArray"](v58?.["allowedValues"]) ? v58["allowedValues"] : []),
    ...(isAdvancedModeEnabled() &&
    Array["isArray"](v58?.["advancedAllowedValues"])
      ? v58["advancedAllowedValues"]
      : []),
  ]
    ["map"]((v60) => Number(v60))
    ["filter"](Number["isFinite"]);
  if (v59["length"] === 0) return v57;
  const v61 = Number(v57),
    v62 = Number(v58?.["defaultValue"]),
    v63 = Number["isFinite"](v61)
      ? v61
      : Number["isFinite"](v62)
        ? v62
        : v59[0];
  return v59["reduce"](
    (v64, v65) => (Math["abs"](v65 - v63) < Math["abs"](v64 - v63) ? v65 : v64),
    v59[0],
  );
}
async function buildOpenApiAiAppWorkflowRequestFromManifest({
  executionManifest: v66,
  payload: v67,
  finalPrompt: v68,
  finalUrls: v69,
  apiKey: v70,
  ctx: v71,
}) {
  if (
    !v66 ||
    v66["adapterType"] !== "workflow" ||
    v66["submitMode"] !== "openapi-v2-ai-app"
  )
    return null;
  const v72 = v66["mapping"] || {},
    v73 = v66["validation"] || {},
    v74 = Math["max"](1, Number(v72["maxInputImages"]) || 1),
    v75 = v69["filter"](Boolean)["slice"](0, v74),
    v76 = Math["max"](0, Number(v73["minInputImages"]) || 0);
  if (v75["length"] < v76)
    throw new Error(
      v73["missingInputMessage"] || "请先添加至少一张参考图再生成",
    );
  const v77 = [],
    v78 = Array["isArray"](v72["imageNodes"]) ? v72["imageNodes"] : [];
  v75["forEach"]((v79, v80) => {
    const v81 = normalizeManifestImageNode(v78[v80], v80),
      v82 = v81["nodeId"];
    if (!v82) return;
    v77["push"]({
      nodeId: v82,
      fieldName: v81["fieldName"],
      fieldValue: v79,
      description: v81["description"],
    });
  });
  const v83 = Array["isArray"](v72["optionalImageNodes"])
    ? v72["optionalImageNodes"]
    : [];
  if (v83["length"] > 0) {
    const v84 = v83["map"]((v85) =>
        String(resolveManifestPayloadValue(v67, v85["fields"], "") || "")[
          "trim"
        ](),
      ),
      v86 =
        v71?.["processInputImagesPreserveOrder"] && v84["some"](Boolean)
          ? await v71["processInputImagesPreserveOrder"](v84, v70, {
              compress: false,
              provider: "runninghub",
            })
          : v84;
    v83["forEach"]((v87, v88) => {
      const v89 = String(v86?.[v88] || "")["trim"]();
      if (!v89 || !v87?.["nodeId"] || !v87?.["fieldName"]) return;
      (v77["push"]({
        nodeId: String(v87["nodeId"]),
        fieldName: String(v87["fieldName"]),
        fieldValue: v89,
        description: v87["description"] || String(v87["fieldName"]),
      }),
        v87["enableNode"]?.["nodeId"] &&
          v87["enableNode"]?.["fieldName"] &&
          v77["push"]({
            nodeId: String(v87["enableNode"]["nodeId"]),
            fieldName: String(v87["enableNode"]["fieldName"]),
            fieldValue: String(v87["enableNode"]["value"] ?? "true"),
            description:
              v87["enableNode"]["description"] ||
              String(v87["enableNode"]["fieldName"]),
          }));
    });
  }
  v72["promptNode"]?.["nodeId"] &&
    v72["promptNode"]?.["fieldName"] &&
    v77["push"]({
      nodeId: String(v72["promptNode"]["nodeId"]),
      fieldName: String(v72["promptNode"]["fieldName"]),
      fieldValue: formatManifestPromptNodeValue(v68, v72["promptNode"]),
      description: v72["promptNode"]["description"] || "提示词",
    });
  if (v72["dimensionsNode"]?.["nodeId"]) {
    const v90 = resolveQwenImageEditDimensions(
      v67["imageSize"],
      v67["resolvedRatioLabel"] || v67["aspectRatio"],
    );
    (v77["push"]({
      nodeId: String(v72["dimensionsNode"]["nodeId"]),
      fieldName: "width",
      fieldValue: String(v90["width"]),
      description: "width",
    }),
      v77["push"]({
        nodeId: String(v72["dimensionsNode"]["nodeId"]),
        fieldName: "height",
        fieldValue: String(v90["height"]),
        description: "height",
      }));
  }
  [v72["firstImageModeNode"], v72["editModeNode"]]["forEach"]((v91) => {
    if (!v91?.["nodeId"] || !v91?.["fieldName"] || !v91?.["field"]) return;
    v77["push"]({
      nodeId: String(v91["nodeId"]),
      fieldName: String(v91["fieldName"]),
      fieldValue: normalizeManifestMappedValue(v67[v91["field"]], v91),
      description:
        v91 === v72["firstImageModeNode"] ? "把第一张图变为" : "模式选择",
    });
  });
  Array["isArray"](v72["valueNodes"]) &&
    v72["valueNodes"]["forEach"]((v92) => {
      if (!v92?.["nodeId"] || !v92?.["fieldName"]) return;
      const v93 = [
        v92["field"],
        ...(Array["isArray"](v92["fallbackFields"])
          ? v92["fallbackFields"]
          : []),
      ]["filter"](Boolean);
      let v94 = "";
      for (const v95 of v93) {
        const v96 = getManifestPayloadPathValue(v67, v95);
        if (v96 !== undefined && v96 !== null && String(v96)["trim"]() !== "") {
          v94 = v96;
          break;
        }
      }
      if (v94 === "") v94 = v92["defaultValue"] ?? "";
      ((v94 = normalizeManifestValueNodeValue(v94, v92)),
        v77["push"]({
          nodeId: String(v92["nodeId"]),
          fieldName: String(v92["fieldName"]),
          fieldValue: String(v94),
          description: v92["description"] || String(v92["fieldName"]),
        }));
    });
  if (
    v72["imageCountNode"]?.["nodeId"] &&
    v72["imageCountNode"]?.["fieldName"]
  ) {
    const v97 = Number(v72["imageCountNode"]["offset"]) || 0;
    v77["push"]({
      nodeId: String(v72["imageCountNode"]["nodeId"]),
      fieldName: String(v72["imageCountNode"]["fieldName"]),
      fieldValue: String(Math["max"](0, v75["length"] + v97)),
      description: "入参多少张图片",
    });
  }
  const v98 =
      v67[v66["instanceType"]?.["field"]] === "plus" ? "plus" : "default",
    v99 = String(v66["appId"] || v66["workflowId"] || "")["trim"]();
  return {
    url: "/api/v2/proxy/image",
    headers: { "Content-Type": "application/json" },
    body: {
      apiUrl: "https://www.runninghub.cn/openapi/v2/run/ai-app/" + v99,
      apiKey: v70,
      nodeInfoList: v77,
      instanceType: v98,
      usePersonalQueue: "false",
    },
    isAsync: true,
    taskIdPath: v66["result"]?.["taskIdPath"] || "taskId",
    adapterTrace: {
      source: "manifest",
      executionId: v66["id"],
      modelId: v67["model"],
    },
    pollUrlBuilder: () => "https://www.runninghub.cn/openapi/v2/query",
    resultExtractor: (v100) => {
      if (v100["status"] === "COMPLETED" && Array["isArray"](v100["results"]))
        return v100["results"]
          ["map"]((v101) => v101["url"] || v101["imageUrl"])
          ["filter"](Boolean);
      return [];
    },
  };
}
function normalizeVideoMattingMaskModeIndex(v102) {
  const v103 = String(v102 || "")["trim"]();
  if (!v103 || v103 === "0") return "0";
  if (v103 === "1") return "1";
  if (v103 === "2") return "2";
  const v104 = v103["toLowerCase"]();
  if (v104 === "sam3") return "1";
  if (v104 === "ma2" || v104 === "matanyone2") return "2";
  return "0";
}
function buildRunningHubVideoResultExtractor() {
  return (v105) => {
    if (v105["status"] === "COMPLETED" && Array["isArray"](v105["results"]))
      return v105["results"]
        ["map"]((v106) => v106["videoUrl"] || v106["url"])
        ["filter"](Boolean);
    return [];
  };
}
function buildOpenApiVideoWorkflowRequest({
  executionManifest: v107,
  payload: v108,
  apiKey: v109,
  nodeInfoList: v110,
}) {
  const v111 =
      v108[v107["instanceType"]?.["field"]] === "plus" ? "plus" : "default",
    v112 = String(v107["appId"] || v107["workflowId"] || "")["trim"]();
  return {
    url: "/api/v2/proxy/image",
    headers: { "Content-Type": "application/json" },
    body: {
      apiUrl: "https://www.runninghub.cn/openapi/v2/run/ai-app/" + v112,
      apiKey: v109,
      nodeInfoList: v110,
      instanceType: v111,
      usePersonalQueue: "false",
    },
    isAsync: true,
    taskIdPath: v107["result"]?.["taskIdPath"] || "taskId",
    adapterTrace: {
      source: "manifest",
      executionId: v107["id"],
      modelId: v108["model"],
    },
    pollUrlBuilder: () => "https://www.runninghub.cn/openapi/v2/query",
    resultExtractor: buildRunningHubVideoResultExtractor(),
  };
}
function buildTaskCreateVideoWorkflowRequest({
  executionManifest: v113,
  payload: v114,
  apiKey: v115,
  nodeInfoList: v116,
}) {
  const v117 =
    v114[v113["instanceType"]?.["field"]] === "plus" ? "plus" : "default";
  return {
    url: "/api/v2/runninghubwf/run",
    apiUrl: "https://www.runninghub.cn/task/openapi/create",
    headers: { "Content-Type": "application/json" },
    body: {
      apiKey: v115,
      workflowId: String(v113["workflowId"] || v113["appId"] || ""),
      addMetadata: false,
      nodeInfoList: v116,
      instanceType: v117,
      usePersonalQueue: "false",
    },
    isAsync: true,
    taskIdPath: v113["result"]?.["taskIdPath"] || "taskId",
    adapterTrace: {
      source: "manifest",
      executionId: v113["id"],
      modelId: v114["model"],
    },
    pollUrlBuilder: () => "https://www.runninghub.cn/openapi/v2/query",
    resultExtractor: buildRunningHubVideoResultExtractor(),
  };
}
function pushManifestNode(v118, v119, v120, v121 = {}) {
  if (!v119?.["nodeId"] || !v119?.["fieldName"]) return;
  v118["push"]({
    nodeId: String(v119["nodeId"]),
    fieldName: String(v121["fieldName"] || v119["fieldName"]),
    fieldValue: String(v120),
    ...(v119["description"] || v121["description"]
      ? { description: v121["description"] || v119["description"] }
      : {}),
  });
}
function getMappedValue(v122, v123, v124 = "") {
  const v125 = String(v122 ?? "")["trim"](),
    v126 = v123?.["valueMap"] || {};
  if (v125 && v126[v125] !== undefined) return v126[v125];
  if (v125 && v126[v125["toLowerCase"]()] !== undefined)
    return v126[v125["toLowerCase"]()];
  return v123?.["defaultValue"] ?? v124;
}
async function resolveRunningHubVideoInput(
  v127,
  v128,
  {
    urlField: urlField = "videoUrl",
    fileField: fileField = "videoFile",
    missingMessage: missingMessage = "请接入源视频",
    uploadFailedMessage: uploadFailedMessage = "源视频上传失败",
  } = {},
) {
  let v129 = "";
  const v130 = String(v127[urlField] || "")["trim"]();
  if (v130) {
    const { processInputVideos: v131 } = await import("../videoUploadApi.js"),
      v132 = await v131([v130], v128);
    if (v132["length"] > 0) v129 = v132[0];
  } else {
    if (v127[fileField]) {
      const { uploadVideoToRunningHub: v133 } =
        await import("../videoUploadApi.js");
      v129 = await v133(v127[fileField], v128);
    }
  }
  if (!v129)
    throw new Error(
      v130 || v127[fileField] ? uploadFailedMessage : missingMessage,
    );
  return v129;
}
async function resolveRunningHubOptionalVideoInput(v134, v135, v136) {
  const v137 = String(v134[v136] || "")["trim"]();
  if (!v137) return "";
  const { processInputVideos: v138 } = await import("../videoUploadApi.js"),
    v139 = await v138([v137], v135);
  return String(v139?.[0] || "")["trim"]();
}
async function resolveRunningHubAudioInput(
  v140,
  v141,
  {
    urlField: urlField = "audioUrl",
    fileField: fileField = "audioFile",
    required: required = false,
    missingMessage: missingMessage = "请接入音频",
  } = {},
) {
  let v142 = "";
  const v143 = String(v140[urlField] || "")["trim"]();
  if (v143) {
    const { processInputAudios: v144 } = await import("../audioUploadApi.js"),
      v145 = await v144([v143], v141);
    if (v145["length"] > 0) v142 = v145[0];
  } else {
    if (v140[fileField]) {
      const { uploadAudioToRunningHub: v146 } =
        await import("../audioUploadApi.js");
      v142 = await v146(v140[fileField], v141);
    }
  }
  if (required && !v142) throw new Error(missingMessage);
  return v142;
}
async function resolveRunningHubFirstImageInput(
  v147,
  v148,
  v149,
  {
    field: field = "inputUrls",
    required: required = false,
    missingMessage: missingMessage = "请接入参考图",
    compress: compress = true,
  } = {},
) {
  const v150 = Array["isArray"](v147[field])
    ? v147[field]
    : String(v147[field] || "")["trim"]()
      ? [v147[field]]
      : [];
  if (!v150["length"]) {
    if (required) throw new Error(missingMessage);
    return "";
  }
  const v151 = await v149["processInputImages"](v150, v148, {
      applyInputQualityProfile: compress,
      provider: "runninghub",
    }),
    v152 = String(v151?.[0] || "")["trim"]();
  if (required && !v152) throw new Error(missingMessage);
  return v152;
}
function hasOwnManifestValue(v153, v154) {
  return Object["prototype"]["hasOwnProperty"]["call"](v153 || {}, v154);
}
function isPresentManifestValue(v155) {
  if (v155 === undefined || v155 === null) return false;
  if (typeof v155 === "string") return v155["trim"]() !== "";
  return true;
}
function normalizeManifestFieldList(v156, v157 = "") {
  const v158 =
      v156?.["fields"] !== undefined ? v156["fields"] : v156?.["field"],
    v159 = Array["isArray"](v158) ? v158 : [v158 || v157];
  return v159["map"]((v160) => String(v160 || "")["trim"]())["filter"](Boolean);
}
function manifestValuesEqual(v161, v162) {
  if (typeof v162 === "boolean") {
    const v163 = String(v161 ?? "")
      ["trim"]()
      ["toLowerCase"]();
    return v161 === v162 || v163 === String(v162);
  }
  if (typeof v162 === "number") return Number(v161) === v162;
  return String(v161 ?? "")["trim"]() === String(v162 ?? "")["trim"]();
}
function evaluateManifestWhenRule(v164, v165) {
  if (!v164 || typeof v164 !== "object") return true;
  const v166 = v164["field"]
      ? getManifestPayloadPathValue(v165, v164["field"])
      : undefined,
    v167 = isPresentManifestValue(v166);
  if (hasOwnManifestValue(v164, "exists") && Boolean(v164["exists"]) !== v167)
    return false;
  if (v164["truthy"] === true && !Boolean(v166)) return false;
  if (v164["falsy"] === true && Boolean(v166)) return false;
  if (
    hasOwnManifestValue(v164, "equals") &&
    !manifestValuesEqual(v166, v164["equals"])
  )
    return false;
  if (
    hasOwnManifestValue(v164, "notEquals") &&
    manifestValuesEqual(v166, v164["notEquals"])
  )
    return false;
  if (
    Array["isArray"](v164["in"]) &&
    !v164["in"]["some"]((v168) => manifestValuesEqual(v166, v168))
  )
    return false;
  if (
    Array["isArray"](v164["notIn"]) &&
    v164["notIn"]["some"]((v169) => manifestValuesEqual(v166, v169))
  )
    return false;
  return true;
}
function shouldUseManifestNodeMapping(v170, v171) {
  const v172 = v170?.["when"];
  if (v172 === undefined || v172 === null) return true;
  if (Array["isArray"](v172))
    return v172["every"]((v173) => evaluateManifestWhenRule(v173, v171));
  return evaluateManifestWhenRule(v172, v171);
}
function applyManifestNodeValueMap(v174, v175) {
  const v176 = v175?.["valueMap"] || v175?.["values"] || {},
    v177 = String(v174 ?? "")["trim"]();
  if (v177 && v176[v177] !== undefined) return v176[v177];
  const v178 = v177["toLowerCase"]();
  if (v177 && v176[v178] !== undefined) return v176[v178];
  return v174;
}
function normalizeManifestTransformSpec(v179) {
  if (!v179) return { name: "" };
  if (typeof v179 === "string") return { name: v179 };
  if (typeof v179 === "object" && !Array["isArray"](v179))
    return { ...v179, name: String(v179["name"] || "")["trim"]() };
  return { name: "" };
}
function clampManifestNumber(v180, v181) {
  let v182 = v180;
  return (
    Number["isFinite"](Number(v181["min"])) &&
      (v182 = Math["max"](Number(v181["min"]), v182)),
    Number["isFinite"](Number(v181["max"])) &&
      (v182 = Math["min"](Number(v181["max"]), v182)),
    v182
  );
}
function applyManifestNodeTransform(v183, v184) {
  const v185 = normalizeManifestTransformSpec(v184?.["transform"]);
  switch (v185["name"]) {
    case "":
      return v183;
    case "trim":
      return String(v183 ?? "")["trim"]();
    case "string":
      return String(v183 ?? "");
    case "booleanString": {
      const v186 = String(v183 ?? "")
        ["trim"]()
        ["toLowerCase"]();
      return v183 === true || v186 === "true" || v186 === "1"
        ? "true"
        : "false";
    }
    case "integer": {
      const v187 = Number(v183),
        v188 = Number(v185["defaultValue"] ?? v184?.["defaultValue"] ?? 0),
        v189 = Number["isFinite"](v187)
          ? Math["trunc"](v187)
          : Number["isFinite"](v188)
            ? Math["trunc"](v188)
            : 0;
      return clampManifestNumber(v189, v185);
    }
    case "normalizeRhVideoFps":
      return normalizeRhVideoFps(v183);
    case "normalizeRhVideoResolution":
      return normalizeRhVideoResolution(
        v183,
        Number["isFinite"](Number(v185["fallback"]))
          ? Number(v185["fallback"])
          : RH_MIN_VIDEO_RESOLUTION,
      );
    default:
      throw new Error(
        "Unsupported RunningHub workflow transform: " + v185["name"],
      );
  }
}
async function resolveRunningHubManifestVideoInput(v190, v191, v192) {
  const v193 = String(v192?.["urlField"] || v192?.["field"] || "videoUrl")[
      "trim"
    ](),
    v194 = String(v192?.["fileField"] || "videoFile")["trim"](),
    v195 = String(v190[v193] || "")["trim"](),
    v196 = v190[v194];
  if (!v192?.["required"] && !v195 && !v196) return "";
  return resolveRunningHubVideoInput(v190, v191, {
    urlField: v193,
    fileField: v194,
    missingMessage: v192?.["missingMessage"] || "请接入源视频",
    uploadFailedMessage: v192?.["uploadFailedMessage"] || "源视频上传失败",
  });
}
async function resolveRunningHubManifestAudioInput(v197, v198, v199) {
  const v200 = String(v199?.["urlField"] || v199?.["field"] || "audioUrl")[
      "trim"
    ](),
    v201 = String(v199?.["fileField"] || "audioFile")["trim"](),
    v202 = String(v197[v200] || "")["trim"](),
    v203 = v197[v201];
  if (!v199?.["required"] && !v202 && !v203) return "";
  return resolveRunningHubAudioInput(v197, v198, {
    urlField: v200,
    fileField: v201,
    required: v199?.["required"] === true,
    missingMessage: v199?.["missingMessage"] || "请接入音频",
  });
}
async function resolveRunningHubManifestNodeValue({
  item: v204,
  payload: v205,
  finalPrompt: v206,
  apiKey: v207,
  ctx: v208,
}) {
  const v209 = String(v204?.["source"] || "param")["trim"]();
  if (v209 === "constant")
    return hasOwnManifestValue(v204, "value")
      ? v204["value"]
      : v204["defaultValue"];
  if (v209 === "prompt") {
    const v210 = resolveManifestPayloadValue(
      v205,
      normalizeManifestFieldList(v204),
      "",
    );
    return isPresentManifestValue(v210) ? v210 : v206;
  }
  if (v209 === "param")
    return resolveManifestPayloadValue(
      v205,
      normalizeManifestFieldList(v204),
      undefined,
    );
  if (v209 === "imageInput")
    return resolveRunningHubFirstImageInput(v205, v207, v208, {
      field: String(v204?.["field"] || "inputUrls")["trim"](),
      required: v204?.["required"] === true,
      missingMessage: v204?.["missingMessage"] || "请接入参考图",
      compress: v204?.["compress"] !== false,
    });
  if (v209 === "videoInput")
    return resolveRunningHubManifestVideoInput(v205, v207, v204);
  if (v209 === "audioInput")
    return resolveRunningHubManifestAudioInput(v205, v207, v204);
  throw new Error("Unsupported RunningHub workflow mapping source: " + v209);
}
async function buildRunningHubNodeInfoListFromManifest({
  mapping: v211,
  payload: v212,
  finalPrompt: v213,
  apiKey: v214,
  ctx: v215,
}) {
  const v216 = Array["isArray"](v211?.["nodeInfoList"])
    ? v211["nodeInfoList"]
    : [];
  if (v216["length"] === 0) return null;
  const v217 = [];
  for (const v218 of v216) {
    if (!v218?.["nodeId"] || !v218?.["fieldName"]) continue;
    if (!shouldUseManifestNodeMapping(v218, v212)) continue;
    const v219 = await resolveRunningHubManifestNodeValue({
        item: v218,
        payload: v212,
        finalPrompt: v213,
        apiKey: v214,
        ctx: v215,
      }),
      v220 = hasOwnManifestValue(v218, "defaultValue");
    let v221 = v219;
    if (!isPresentManifestValue(v221) && v220) v221 = v218["defaultValue"];
    if (!isPresentManifestValue(v221)) {
      if (v218["required"])
        throw new Error(
          v218["missingMessage"] ||
            "缺少\x20RunningHub\x20节点入参：" + v218["fieldName"],
        );
      continue;
    }
    ((v221 = applyManifestNodeValueMap(v221, v218)),
      (v221 = applyManifestNodeTransform(v221, v218)));
    if (!isPresentManifestValue(v221) && v218["required"])
      throw new Error(
        v218["missingMessage"] ||
          "缺少 RunningHub 节点入参：" + v218["fieldName"],
      );
    pushManifestNode(v217, v218, v221);
  }
  return v217;
}
function getRunningHubWorkflowResolverHelpers() {
  return {
    buildOpenApiVideoWorkflowRequest: buildOpenApiVideoWorkflowRequest,
    buildTaskCreateVideoWorkflowRequest: buildTaskCreateVideoWorkflowRequest,
    getMappedValue: getMappedValue,
    normalizeRhVideoFps: normalizeRhVideoFps,
    normalizeRhVideoResolution: normalizeRhVideoResolution,
    normalizeVideoMattingMaskModeIndex: normalizeVideoMattingMaskModeIndex,
    pushManifestNode: pushManifestNode,
    resolveRunningHubFirstImageInput: resolveRunningHubFirstImageInput,
    resolveRunningHubOptionalVideoInput: resolveRunningHubOptionalVideoInput,
    resolveRunningHubVideoInput: resolveRunningHubVideoInput,
    sourceVideoMissingMessage: RH_V54_SOURCE_VIDEO_MISSING_MESSAGE,
    sourceVideoUploadFailedMessage: RH_V54_SOURCE_VIDEO_UPLOAD_FAILED_MESSAGE,
  };
}
async function buildVideoWorkflowRequestFromManifest({
  executionManifest: v222,
  payload: v223,
  finalPrompt: v224,
  apiKey: v225,
  ctx: v226,
}) {
  if (!v222 || v222["adapterType"] !== "workflow") return null;
  const v227 = v222["mapping"] || {},
    v228 = String(v222["extensions"]?.["payloadResolver"] || "")["trim"]();
  if (v228) {
    const v229 = getRunningHubWorkflowPayloadResolver(v228);
    if (!v229)
      throw new Error(
        "Unsupported RunningHub workflow payloadResolver: " + v228,
      );
    return v229({
      executionManifest: v222,
      payload: v223,
      finalPrompt: v224,
      apiKey: v225,
      ctx: v226,
      helpers: getRunningHubWorkflowResolverHelpers(),
    });
  }
  const v230 = await buildRunningHubNodeInfoListFromManifest({
    mapping: v227,
    payload: v223,
    finalPrompt: v224,
    apiKey: v225,
    ctx: v226,
  });
  if (!v230) return null;
  if (v222["submitMode"] === "openapi-v2-ai-app")
    return buildOpenApiVideoWorkflowRequest({
      executionManifest: v222,
      payload: v223,
      apiKey: v225,
      nodeInfoList: v230,
    });
  if (v222["submitMode"] === "runninghub-task-create")
    return buildTaskCreateVideoWorkflowRequest({
      executionManifest: v222,
      payload: v223,
      apiKey: v225,
      nodeInfoList: v230,
    });
  throw new Error(
    "Unsupported RunningHub video workflow submitMode: " + v222["submitMode"],
  );
}
export async function buildImageRequest(v231, v232, v233) {
  if (!v231["model"]) throw new Error("未指定模型，无法发起图像生成请求");
  const v234 = v233["getProviderConfig"]("runninghubwf"),
    v235 = v234["apiKey"] || v231["apiKey"];
  if (!v235) throw new Error("API Key 未配置，无法发起 RunningHUB 请求");
  const v236 =
      v233["processInputImagesPreserveOrder"] || v233["processInputImages"],
    v237 = await v236(v231["inputUrls"], v235, {
      applyInputQualityProfile: true,
      provider: "runninghub",
    }),
    v238 = Array["isArray"](v237)
      ? v237["map"]((v239) => String(v239 || "")["trim"]())
      : [],
    v240 = resolveModelExecution(v231["model"]),
    v241 = await buildOpenApiAiAppWorkflowRequestFromManifest({
      executionManifest: v240?.["executionManifest"],
      payload: v231,
      finalPrompt: v232,
      finalUrls: v238,
      apiKey: v235,
      ctx: v233,
    });
  if (v241) return v241;
  throw new Error(
    "RunningHub\x20workflow\x20manifest\x20missing:\x20" + v231["model"],
  );
}
export async function buildVideoRequest(v242, v243, v244) {
  const v245 = v244["getProviderConfig"]("runninghubwf"),
    v246 = v242["apiKey"] || v245["apiKey"];
  if (!v246)
    throw new Error("API Key 未配置，无法发起 RunningHUB 视频生成请求");
  const v247 = resolveModelExecution(v242["model"]),
    v248 = await buildVideoWorkflowRequestFromManifest({
      executionManifest: v247?.["executionManifest"],
      payload: v242,
      finalPrompt: v243,
      apiKey: v246,
      ctx: v244,
    });
  if (v248) return v248;
  throw new Error(
    "RunningHub\x20video\x20workflow\x20manifest\x20missing:\x20" +
      v242["model"],
  );
}
export async function buildModelRequest(v249, v250, v251) {
  const v252 = await buildImageRequestFromManifest(v249, v250, v251, {
    expectedProvider: "runninghub",
  });
  if (v252) return v252;
  throw new Error("RunningHub model API manifest missing: " + v249["model"]);
}
