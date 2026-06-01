import {
  qwenImageEditExecutionManifest,
  qwenImageEditModelManifest,
} from "./image/runninghub/qwenImageEditManifest.js";
import {
  animeRealExecutionManifest,
  animeRealModelManifest,
} from "./image/runninghub/animeRealManifest.js";
import {
  personReplaceV21ExecutionManifest,
  personReplaceV21ModelManifest,
} from "./image/runninghub/personReplaceV21Manifest.js";
import {
  personReplaceV3ExecutionManifest,
  personReplaceV3ModelManifest,
} from "./image/runninghub/personReplaceV3Manifest.js";
import {
  controlCameraExecutionManifest,
  controlCameraModelManifest,
} from "./image/runninghub/controlCameraManifest.js";
import {
  rhVideoBasicExecutionManifest,
  rhVideoBasicModelManifest,
} from "./video/runninghub/runningHubVideoBasicManifest.js";
import {
  rhVideoLtx23ExecutionManifest,
  rhVideoLtx23ModelManifest,
} from "./video/runninghub/runningHubVideoLtx23Manifest.js";
import {
  rhVideoCommercialDigitalHumanExecutionManifest,
  rhVideoCommercialDigitalHumanModelManifest,
} from "./video/runninghub/runningHubVideoCommercialDigitalHumanManifest.js";
import {
  rhVideoLipSyncExecutionManifest,
  rhVideoLipSyncModelManifest,
} from "./video/runninghub/runningHubVideoLipSyncManifest.js";
import {
  rhVideoV54ExecutionManifest,
  rhVideoV54ModelManifest,
} from "./video/runninghub/runningHubVideoV54Manifest.js";
import {
  rhVideoMattingExecutionManifest,
  rhVideoMattingModelManifest,
} from "./video/runninghub/runningHubVideoMattingManifest.js";
import {
  rhVideoHdVipExecutionManifest,
  rhVideoHdVipModelManifest,
} from "./video/runninghub/runningHubVideoHdVipManifest.js";
import {
  rhVideoFrameInterpolationExecutionManifest,
  rhVideoFrameInterpolationModelManifest,
} from "./video/runninghub/runningHubVideoFrameInterpolationManifest.js";
import {
  rhAudioIndexTts2CloneExecutionManifest,
  rhAudioIndexTts2CloneModelManifest,
} from "./audio/runninghub/runningHubAudioIndexTts2CloneManifest.js";
import {
  rhAudioVoiceConvertExecutionManifest,
  rhAudioVoiceConvertModelManifest,
} from "./audio/runninghub/runningHubAudioVoiceConvertManifest.js";
import {
  rhAudioAdvancedVoiceCloneExecutionManifest,
  rhAudioAdvancedVoiceCloneModelManifest,
} from "./audio/runninghub/runningHubAudioAdvancedVoiceCloneManifest.js";
import {
  rhAudioSeparationExecutionManifest,
  rhAudioSeparationModelManifest,
} from "./audio/runninghub/runningHubAudioSeparationManifest.js";
import {
  vendorImageModelApiExecutionManifests,
  vendorImageModelApiModelManifests,
} from "./image/modelApi/index.js";
import {
  dreaminaImageExecutionManifests,
  dreaminaImageModelManifests,
} from "./image/dreamina/dreaminaImageManifest.js";
import {
  vendorVideoModelApiExecutionManifests,
  vendorVideoModelApiModelManifests,
} from "./video/modelApi/vendorVideoModelApiManifests.js";
import {
  dreaminaVideoExecutionManifests,
  dreaminaVideoModelManifests,
} from "./video/dreamina/dreaminaVideoManifest.js";
import {
  vendorTextModelApiExecutionManifests,
  vendorTextModelApiModelManifests,
} from "./text/modelApi/vendorTextModelApiManifests.js";
const ALLOWED_ADAPTER_TYPES = new Set(["workflow", "modelApi", "localRuntime"]),
  SUPPORTED_UI_CONTROL_TYPES = new Set([
    "segmented",
    "select",
    "slider",
    "stepper",
    "toggle",
    "text",
    "textarea",
    "image\x20input",
    "video input",
    "audio input",
  ]),
  REQUIRED_MODEL_FIELDS = Object["freeze"]([
    "schemaVersion",
    "modelId",
    "provider",
    "kind",
    "adapterType",
    "executionId",
    "displayName",
    "uiSchema",
    "inputSlots",
    "outputType",
  ]),
  REQUIRED_EXECUTION_FIELDS = Object["freeze"]([
    "schemaVersion",
    "id",
    "provider",
    "kind",
    "adapterType",
    "result",
  ]),
  REQUIRED_WORKFLOW_EXECUTION_FIELDS = Object["freeze"]([
    "submitMode",
    "queryMode",
    "mapping",
  ]),
  REQUIRED_MODEL_API_EXECUTION_FIELDS = Object["freeze"]([
    "endpoint",
    "method",
    "model",
    "bodyMapping",
    "responseMapping",
  ]),
  REQUIRED_LOCAL_RUNTIME_EXECUTION_FIELDS = Object["freeze"](["runtime"]),
  _models = new Map(),
  _executions = new Map();
function assertPlainObject(v0, v1) {
  if (!v0 || typeof v0 !== "object" || Array["isArray"](v0))
    throw new TypeError("[manifest] " + v1 + " must be an object");
}
function isPlainObject(v2) {
  if (!v2 || typeof v2 !== "object" || Array["isArray"](v2)) return false;
  const v3 = Object["getPrototypeOf"](v2);
  return v3 === Object["prototype"] || v3 === null;
}
function assertPlainData(v4, v5, v6 = new WeakSet()) {
  if (v4 === null) return;
  const v7 = typeof v4;
  if (v7 === "string" || v7 === "number" || v7 === "boolean") return;
  if (
    v7 === "function" ||
    v7 === "symbol" ||
    v7 === "undefined" ||
    v7 === "bigint"
  )
    throw new TypeError("[manifest] " + v5 + " must be plain data");
  if (v6["has"](v4))
    throw new TypeError(
      "[manifest]\x20" + v5 + " cannot contain circular references",
    );
  v6["add"](v4);
  if (Array["isArray"](v4)) {
    v4["forEach"]((v8, v9) => {
      assertPlainData(v8, v5 + "[" + v9 + "]", v6);
    });
    return;
  }
  if (!isPlainObject(v4))
    throw new TypeError("[manifest] " + v5 + " must be plain data");
  Object["entries"](v4)["forEach"](([v10, v11]) => {
    assertPlainData(v11, v5 + "." + v10, v6);
  });
}
function assertRequiredFields(v12, v13, v14) {
  const v15 = v13["filter"](
    (v16) => v12[v16] === undefined || v12[v16] === null || v12[v16] === "",
  );
  if (v15["length"] > 0)
    throw new Error(
      "[manifest] " + v14 + " missing required fields: " + v15["join"](",\x20"),
    );
}
function normalizeRegistryKey(v17) {
  return String(v17 || "")["trim"]();
}
function getUiSchemaOptionValue(v18) {
  return String(v18?.["value"] ?? v18);
}
function normalizeUiSchemaCompareValue(v19) {
  return String(v19 ?? "")
    ["trim"]()
    ["toLowerCase"]();
}
function isAdaptiveUiSchemaValue(v20) {
  const v21 = String(v20 || "")["trim"](),
    v22 = v21["toLowerCase"]();
  return (
    v22 === "auto" ||
    v22 === "adaptive" ||
    v22 === "default" ||
    v21 === "自适应" ||
    v21 === "默认"
  );
}
function getUiSchemaDisableWhen(v23) {
  if (!v23 || typeof v23 !== "object" || Array["isArray"](v23)) return null;
  const v24 = v23["disableWhen"] || v23["disabledWhen"];
  return v24 &&
    (Array["isArray"](v24) ||
      (typeof v24 === "object" && !Array["isArray"](v24)))
    ? v24
    : null;
}
function uiSchemaDisableWhenMatches(v25, v26 = {}) {
  if (Array["isArray"](v25))
    return v25["some"]((v27) => uiSchemaDisableWhenMatches(v27, v26));
  if (!v25 || typeof v25 !== "object") return false;
  if (Array["isArray"](v25["any"]))
    return v25["any"]["some"]((v28) => uiSchemaDisableWhenMatches(v28, v26));
  if (Array["isArray"](v25["all"]))
    return v25["all"]["every"]((v29) => uiSchemaDisableWhenMatches(v29, v26));
  const v30 = normalizeRegistryKey(v25?.["field"] || v25?.["param"]);
  if (!v30) return false;
  const v31 = v25["values"] !== undefined ? v25["values"] : v25["value"],
    v32 = Array["isArray"](v31) ? v31 : [v31],
    v33 = v32["map"](normalizeUiSchemaCompareValue),
    v34 = normalizeUiSchemaCompareValue(v26?.[v30]);
  return v33["includes"](v34);
}
function isUiSchemaOptionDisabled(v35, v36, v37 = {}) {
  if (v35?.["disabled"] === true || v35?.["readOnly"] === true) return true;
  if (!v36 || typeof v36 !== "object" || Array["isArray"](v36)) return false;
  if (v36["disabled"] === true) return true;
  const v38 = getUiSchemaDisableWhen(v36);
  return v38 ? uiSchemaDisableWhenMatches(v38, v37) : false;
}
function findUiSchemaOptionByValue(v39, v40) {
  const v41 = Array["isArray"](v39?.["options"]) ? v39["options"] : [],
    v42 = String(v40 ?? "")["trim"](),
    v43 = v42["toLowerCase"]();
  return (
    v41["find"]((v44) => getUiSchemaOptionValue(v44) === v42) ||
    v41["find"](
      (v45) => getUiSchemaOptionValue(v45)["trim"]()["toLowerCase"]() === v43,
    ) ||
    null
  );
}
function findAdaptiveUiSchemaOption(v46) {
  const v47 = Array["isArray"](v46?.["options"]) ? v46["options"] : [];
  return (
    v47["find"]((v48) => {
      const v49 = getUiSchemaOptionValue(v48),
        v50 = String(v48?.["label"] ?? v49)["trim"]();
      return isAdaptiveUiSchemaValue(v49) || isAdaptiveUiSchemaValue(v50);
    }) || null
  );
}
function findEnabledUiSchemaOption(v51, v52, v53 = {}) {
  const v54 = findUiSchemaOptionByValue(v51, v52);
  return v54 && !isUiSchemaOptionDisabled(v51, v54, v53) ? v54 : null;
}
function findFirstEnabledUiSchemaOption(v55, v56 = {}) {
  const v57 = Array["isArray"](v55?.["options"]) ? v55["options"] : [];
  return (
    v57["find"](
      (v58) =>
        v58?.["hidden"] !== true && !isUiSchemaOptionDisabled(v55, v58, v56),
    ) || null
  );
}
function getUiSchemaDefaultValueAliases(v59) {
  return (
    Array["isArray"](v59?.["defaultValueAliases"])
      ? v59["defaultValueAliases"]
      : []
  )
    ["map"]((v60) =>
      String(v60 ?? "")
        ["trim"]()
        ["toLowerCase"](),
    )
    ["filter"](Boolean);
}
export function normalizeUiSchemaFieldValue(
  v61,
  v62,
  { params: params = {} } = {},
) {
  const v63 = String(v61?.["type"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v62 === undefined || v62 === null || String(v62)["trim"]() === "")
    return v61?.["defaultValue"] ?? "";
  const v64 = String(v62)["trim"]()["toLowerCase"]();
  if (getUiSchemaDefaultValueAliases(v61)["includes"](v64))
    return v61?.["defaultValue"] ?? "";
  if (v63 === "toggle") {
    if (v62 === true || v62 === false) return v62;
    if (["true", "1", "yes", "on"]["includes"](v64)) return true;
    if (["false", "0", "no", "off"]["includes"](v64)) return false;
    return v61?.["defaultValue"] === true;
  }
  if (
    v63 === "slider" &&
    Array["isArray"](v61?.["options"]) &&
    v61["options"]["length"]
  ) {
    const v65 = findEnabledUiSchemaOption(v61, v62, params);
    if (v65) return v65["value"] ?? v65;
    const v66 = findEnabledUiSchemaOption(v61, v61?.["defaultValue"], params);
    if (v66) return v66["value"] ?? v66;
    const v67 = findFirstEnabledUiSchemaOption(v61, params);
    if (v67) return v67["value"] ?? v67;
    return v61?.["defaultValue"] ?? "";
  }
  if (v63 !== "segmented" && v63 !== "select") return v62;
  const v68 = findEnabledUiSchemaOption(v61, v62, params);
  if (v68) return v68["value"] ?? v68;
  if (isAdaptiveUiSchemaValue(v62)) {
    const v69 = findAdaptiveUiSchemaOption(v61);
    if (v69 && !isUiSchemaOptionDisabled(v61, v69, params))
      return v69["value"] ?? v69;
  }
  const v70 = findEnabledUiSchemaOption(v61, v61?.["defaultValue"], params);
  if (v70) return v70["value"] ?? v70;
  const v71 = findFirstEnabledUiSchemaOption(v61, params);
  if (v71) return v71["value"] ?? v71;
  return v61?.["defaultValue"] ?? "";
}
export function sanitizeModelUiSchemaParams(
  v72,
  v73 = {},
  { includeDefaults: includeDefaults = true } = {},
) {
  const v74 = getModelManifest(v72),
    v75 = Array["isArray"](v74?.["uiSchema"]?.["fields"])
      ? v74["uiSchema"]["fields"]
      : [],
    v76 = v73 && typeof v73 === "object" && !Array["isArray"](v73) ? v73 : {},
    v77 = {};
  return v75["reduce"]((v78, v79) => {
    const v80 = normalizeRegistryKey(v79?.["id"]);
    if (!v80) return v78;
    const v81 = { ...v76, ...v77, ...v78 };
    if (Object["prototype"]["hasOwnProperty"]["call"](v76, v80))
      ((v78[v80] = normalizeUiSchemaFieldValue(v79, v76[v80], { params: v81 })),
        (v77[v80] = v78[v80]));
    else
      includeDefaults
        ? ((v78[v80] = normalizeUiSchemaFieldValue(v79, v79?.["defaultValue"], {
            params: v81,
          })),
          (v77[v80] = v78[v80]))
        : (v77[v80] = normalizeUiSchemaFieldValue(v79, v79?.["defaultValue"], {
            params: v81,
          }));
    return v78;
  }, {});
}
function getManifestRegistryKeys(v82, v83, v84) {
  const v85 = normalizeRegistryKey(v82[v83]);
  if (!v85) throw new Error("[manifest]\x20" + v84 + " has empty " + v83);
  const v86 = [v85];
  if (v82["aliases"] !== undefined) {
    if (!Array["isArray"](v82["aliases"]))
      throw new Error("[manifest] " + v84 + " aliases must be an array");
    v82["aliases"]["forEach"]((v87) => {
      const v88 = normalizeRegistryKey(v87);
      if (v88) v86["push"](v88);
    });
  }
  return v86;
}
function assertRegistryKeysAvailable(v89, v90, v91, v92) {
  const v93 = new Set();
  return (
    v89["forEach"]((v94, v95) => {
      const v96 = getManifestRegistryKeys(v94, v91, v92 + "[" + v95 + "]");
      v96["forEach"]((v97) => {
        if (v90["has"](v97))
          throw new Error("[manifest] " + v92 + " duplicate key: " + v97);
        if (v93["has"](v97))
          throw new Error(
            "[manifest] " +
              v92 +
              "\x20duplicate\x20key\x20in\x20bundle:\x20" +
              v97,
          );
        v93["add"](v97);
      });
    }),
    v93
  );
}
function buildManifestKeyMap(v98, v99, v100) {
  const v101 = new Map();
  return (
    v98["forEach"]((v102, v103) => {
      getManifestRegistryKeys(v102, v99, v100 + "[" + v103 + "]")["forEach"](
        (v104) => {
          v101["set"](v104, v102);
        },
      );
    }),
    v101
  );
}
function assertModelExecutionContract(v105, v106) {
  ["adapterType", "kind", "provider"]["forEach"]((v107) => {
    const v108 = normalizeRegistryKey(v105[v107]),
      v109 = normalizeRegistryKey(v106[v107]);
    if (v108 !== v109)
      throw new Error(
        "[manifest] model manifest " +
          v105["modelId"] +
          "\x20" +
          v107 +
          "\x20(" +
          v105[v107] +
          ") does not match execution manifest " +
          v106["id"] +
          "\x20" +
          v107 +
          "\x20(" +
          v106[v107] +
          ")",
      );
  });
}
function assertBundleModelExecutionLinks(v110, v111) {
  v110["forEach"]((v112) => {
    const v113 = normalizeRegistryKey(v112["executionId"]),
      v114 = _executions["get"](v113) || v111["get"](v113);
    if (!v114)
      throw new Error(
        "[manifest] model manifest " +
          v112["modelId"] +
          "\x20references\x20unknown\x20executionId:\x20" +
          v112["executionId"],
      );
    assertModelExecutionContract(v112, v114);
  });
}
function assertAdapterType(v115, v116) {
  if (!ALLOWED_ADAPTER_TYPES["has"](String(v115 || "")))
    throw new Error(
      "[manifest] " + v116 + " has unsupported adapterType: " + v115,
    );
}
function assertExecutionTarget(v117) {
  if (v117["adapterType"] !== "workflow") return;
  if (!v117["workflowId"] && !v117["appId"])
    throw new Error("[manifest] workflow execution missing workflowId/appId");
}
function assertUiSchema(v118) {
  const v119 = v118["uiSchema"];
  assertPlainObject(v119, "model manifest uiSchema");
  if (!Array["isArray"](v119["fields"]))
    throw new Error(
      "[manifest]\x20model\x20manifest\x20uiSchema.fields\x20must\x20be\x20an\x20array",
    );
  v119["fields"]["forEach"]((v120, v121) => {
    (assertPlainObject(v120, "model manifest uiSchema.fields[" + v121 + "]"),
      assertRequiredFields(
        v120,
        ["id", "type", "defaultValue"],
        "model manifest uiSchema.fields[" + v121 + "]",
      ));
    const v122 = String(v120["type"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (!SUPPORTED_UI_CONTROL_TYPES["has"](v122))
      throw new Error(
        "[manifest]\x20unsupported\x20uiSchema\x20control\x20type:\x20" +
          v120["type"],
      );
    if (
      (v122 === "segmented" || v122 === "select") &&
      (!Array["isArray"](v120["options"]) || v120["options"]["length"] === 0)
    )
      throw new Error(
        "[manifest]\x20uiSchema\x20field\x20" +
          v120["id"] +
          " requires non-empty options",
      );
  });
}
function assertInputSlots(v123) {
  const v124 = v123["inputSlots"];
  assertPlainObject(v124, "model\x20manifest\x20inputSlots");
  const v125 =
    v124["fixedSlots"] === undefined || v124["fixedSlots"] === null
      ? []
      : v124["fixedSlots"];
  if (!Array["isArray"](v125))
    throw new Error(
      "[manifest]\x20model\x20manifest\x20inputSlots.fixedSlots\x20must\x20be\x20an\x20array",
    );
  const v126 = new Map(),
    v127 = new Map(),
    v128 = new Set();
  v125["forEach"]((v129, v130) => {
    (assertPlainObject(
      v129,
      "model manifest inputSlots.fixedSlots[" + v130 + "]",
    ),
      assertRequiredFields(
        v129,
        ["id", "kind"],
        "model manifest inputSlots.fixedSlots[" + v130 + "]",
      ));
    const v131 = normalizeRegistryKey(v129["kind"]),
      v132 = String(v129["id"] || "")["trim"]();
    if (v132) v128["add"](v132);
    v126["set"](v131, (v126["get"](v131) || 0) + 1);
    if (
      v129["required"] !== undefined &&
      v129["required"] !== null &&
      typeof v129["required"] !== "boolean"
    )
      throw new Error(
        "[manifest]\x20fixed\x20slot\x20" +
          v129["id"] +
          " required must be a boolean",
      );
    v129["required"] === true &&
      v127["set"](v131, (v127["get"](v131) || 0) + 1);
  });
  const v133 = v124["minByKind"] || {};
  if (v133 && !isPlainObject(v133))
    throw new Error(
      "[manifest] model manifest inputSlots.minByKind must be an object",
    );
  Object["entries"](v133 || {})["forEach"](([v134, v135]) => {
    const v136 = Number(v135);
    if (!Number["isFinite"](v136) || v136 < 0)
      throw new Error(
        "[manifest] model manifest inputSlots.minByKind." +
          v134 +
          "\x20must\x20be\x20a\x20non-negative\x20number",
      );
    const v137 = normalizeRegistryKey(v134),
      v138 = v126["get"](v137) || 0;
    if (v138 === 0 || v136 <= 0) return;
    const v139 = v127["get"](v137) || 0;
    if (v139 < v136)
      throw new Error(
        "[manifest] model manifest " +
          v123["modelId"] +
          "\x20inputSlots." +
          v137 +
          "\x20requires\x20" +
          v136 +
          " input(s), but only " +
          v139 +
          " fixed slot(s) are marked required",
      );
  });
  const v140 = v124["exclusiveGroups"] || [];
  if (v140 && !Array["isArray"](v140))
    throw new Error(
      "[manifest] model manifest inputSlots.exclusiveGroups must be an array",
    );
  (v140 || [])["forEach"]((v141, v142) => {
    assertPlainObject(
      v141,
      "model manifest inputSlots.exclusiveGroups[" + v142 + "]",
    );
    if (!Array["isArray"](v141["slots"]) || v141["slots"]["length"] < 2)
      throw new Error(
        "[manifest] model manifest inputSlots.exclusiveGroups[" +
          v142 +
          "].slots must contain at least two slots",
      );
    (v141["slots"]["forEach"]((v143) => {
      const v144 = String(v143 || "")["trim"]();
      if (!v128["has"](v144))
        throw new Error(
          "[manifest] model manifest inputSlots.exclusiveGroups[" +
            v142 +
            "] references unknown fixed slot: " +
            v144,
        );
    }),
      ["min", "max"]["forEach"]((v145) => {
        if (v141[v145] === undefined || v141[v145] === null) return;
        const v146 = Number(v141[v145]);
        if (!Number["isFinite"](v146) || v146 < 0)
          throw new Error(
            "[manifest]\x20model\x20manifest\x20inputSlots.exclusiveGroups[" +
              v142 +
              "]." +
              v145 +
              "\x20must\x20be\x20a\x20non-negative\x20number",
          );
      }));
  });
}
export function validateModelManifest(v147) {
  return (
    assertPlainObject(v147, "model manifest"),
    assertRequiredFields(v147, REQUIRED_MODEL_FIELDS, "model manifest"),
    assertAdapterType(v147["adapterType"], "model manifest"),
    assertUiSchema(v147),
    assertInputSlots(v147),
    true
  );
}
export function validateExecutionManifest(v148) {
  return (
    assertPlainObject(v148, "execution manifest"),
    assertRequiredFields(
      v148,
      REQUIRED_EXECUTION_FIELDS,
      "execution\x20manifest",
    ),
    assertAdapterType(v148["adapterType"], "execution manifest"),
    v148["adapterType"] === "workflow" &&
      assertRequiredFields(
        v148,
        REQUIRED_WORKFLOW_EXECUTION_FIELDS,
        "workflow\x20execution\x20manifest",
      ),
    v148["adapterType"] === "modelApi" &&
      assertRequiredFields(
        v148,
        REQUIRED_MODEL_API_EXECUTION_FIELDS,
        "modelApi execution manifest",
      ),
    v148["adapterType"] === "localRuntime" &&
      assertRequiredFields(
        v148,
        REQUIRED_LOCAL_RUNTIME_EXECUTION_FIELDS,
        "localRuntime\x20execution\x20manifest",
      ),
    assertExecutionTarget(v148),
    true
  );
}
function addModelManifestToRegistry(v149) {
  const v150 = String(v149["modelId"] || "")["trim"]();
  (_models["set"](v150, v149),
    Array["isArray"](v149["aliases"]) &&
      v149["aliases"]["forEach"]((v151) => {
        const v152 = String(v151 || "")["trim"]();
        if (v152) _models["set"](v152, v149);
      }));
}
function addExecutionManifestToRegistry(v153) {
  (_executions["set"](String(v153["id"]), v153),
    Array["isArray"](v153["aliases"]) &&
      v153["aliases"]["forEach"]((v154) => {
        const v155 = String(v154 || "")["trim"]();
        if (v155) _executions["set"](v155, v153);
      }));
}
function registerModelManifest(v156) {
  validateModelManifest(v156);
  const v157 = getExecutionManifest(v156["executionId"]);
  if (v157) assertModelExecutionContract(v156, v157);
  addModelManifestToRegistry(v156);
}
function registerExecutionManifest(v158) {
  (validateExecutionManifest(v158), addExecutionManifestToRegistry(v158));
}
export function registerManifestBundle(v159) {
  (assertPlainObject(v159, "manifest bundle"),
    assertPlainData(v159, "manifest bundle"),
    assertRequiredFields(v159, ["sourceId"], "manifest bundle"));
  if (!normalizeRegistryKey(v159["sourceId"]))
    throw new Error(
      "[manifest]\x20manifest\x20bundle\x20sourceId\x20must\x20be\x20non-empty",
    );
  if (!Array["isArray"](v159["models"]))
    throw new TypeError(
      "[manifest]\x20manifest\x20bundle.models\x20must\x20be\x20an\x20array",
    );
  if (!Array["isArray"](v159["executions"]))
    throw new TypeError(
      "[manifest] manifest bundle.executions must be an array",
    );
  const v160 = v159["executions"],
    v161 = v159["models"];
  (v160["forEach"](validateExecutionManifest),
    v161["forEach"](validateModelManifest),
    assertRegistryKeysAvailable(v160, _executions, "id", "execution manifest"));
  const v162 = buildManifestKeyMap(v160, "id", "execution manifest");
  return (
    assertRegistryKeysAvailable(v161, _models, "modelId", "model manifest"),
    assertBundleModelExecutionLinks(v161, v162),
    v160["forEach"](addExecutionManifestToRegistry),
    v161["forEach"](addModelManifestToRegistry),
    true
  );
}
(registerExecutionManifest(qwenImageEditExecutionManifest),
  registerModelManifest(qwenImageEditModelManifest),
  registerExecutionManifest(animeRealExecutionManifest),
  registerModelManifest(animeRealModelManifest),
  registerExecutionManifest(personReplaceV21ExecutionManifest),
  registerModelManifest(personReplaceV21ModelManifest),
  registerExecutionManifest(personReplaceV3ExecutionManifest),
  registerModelManifest(personReplaceV3ModelManifest),
  registerExecutionManifest(controlCameraExecutionManifest),
  registerModelManifest(controlCameraModelManifest),
  registerExecutionManifest(rhVideoBasicExecutionManifest),
  registerModelManifest(rhVideoBasicModelManifest),
  registerExecutionManifest(rhVideoLtx23ExecutionManifest),
  registerModelManifest(rhVideoLtx23ModelManifest),
  registerExecutionManifest(rhVideoCommercialDigitalHumanExecutionManifest),
  registerModelManifest(rhVideoCommercialDigitalHumanModelManifest),
  registerExecutionManifest(rhVideoLipSyncExecutionManifest),
  registerModelManifest(rhVideoLipSyncModelManifest),
  registerExecutionManifest(rhVideoV54ExecutionManifest),
  registerModelManifest(rhVideoV54ModelManifest),
  registerExecutionManifest(rhVideoMattingExecutionManifest),
  registerModelManifest(rhVideoMattingModelManifest),
  registerExecutionManifest(rhVideoHdVipExecutionManifest),
  registerModelManifest(rhVideoHdVipModelManifest),
  registerExecutionManifest(rhVideoFrameInterpolationExecutionManifest),
  registerModelManifest(rhVideoFrameInterpolationModelManifest),
  registerExecutionManifest(rhAudioIndexTts2CloneExecutionManifest),
  registerModelManifest(rhAudioIndexTts2CloneModelManifest),
  registerExecutionManifest(rhAudioVoiceConvertExecutionManifest),
  registerModelManifest(rhAudioVoiceConvertModelManifest),
  registerExecutionManifest(rhAudioAdvancedVoiceCloneExecutionManifest),
  registerModelManifest(rhAudioAdvancedVoiceCloneModelManifest),
  registerExecutionManifest(rhAudioSeparationExecutionManifest),
  registerModelManifest(rhAudioSeparationModelManifest),
  vendorImageModelApiExecutionManifests["forEach"](registerExecutionManifest),
  vendorImageModelApiModelManifests["forEach"](registerModelManifest),
  dreaminaImageExecutionManifests["forEach"](registerExecutionManifest),
  dreaminaImageModelManifests["forEach"](registerModelManifest),
  vendorVideoModelApiExecutionManifests["forEach"](registerExecutionManifest),
  vendorVideoModelApiModelManifests["forEach"](registerModelManifest),
  dreaminaVideoExecutionManifests["forEach"](registerExecutionManifest),
  dreaminaVideoModelManifests["forEach"](registerModelManifest),
  vendorTextModelApiExecutionManifests["forEach"](registerExecutionManifest),
  vendorTextModelApiModelManifests["forEach"](registerModelManifest));
export { registerModelManifest, registerExecutionManifest };
export function getModelManifest(v163) {
  const v164 = String(v163 || "")["trim"]();
  return _models["get"](v164) || null;
}
export function resolveModelManifest(v165, v166 = "") {
  const v167 = getModelManifest(v165);
  if (!v167) return null;
  const v168 = String(v166 || "")["trim"]();
  if (v168 && v167["provider"] !== v168) return null;
  return v167;
}
export function getExecutionManifest(v169) {
  return _executions["get"](String(v169 || "")["trim"]()) || null;
}
export function resolveExecutionManifest(v170) {
  return getExecutionManifest(v170);
}
const PROVIDER_PREFIXES = Object["freeze"]({
  "runninghub-model": "runninghub",
  runninghub: "runninghubwf",
  dreamina: "dreamina",
  apimart: "apimart",
  ppio: "ppio",
  grsai: "grsai",
  volcengine: "volcengine",
});
export function normalizeProviderId(v171) {
  const v172 = String(v171 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v172 === "runninghub-workflow" || v172 === "runninghubwf")
    return "runninghubwf";
  if (v172 === "runninghub-model") return "runninghub";
  return v172;
}
function inferProviderFromModelPrefix(v173) {
  const v174 = String(v173 || "")
      ["trim"]()
      ["toLowerCase"](),
    v175 = v174["includes"]("/") ? v174["split"]("/")[0] : "";
  return PROVIDER_PREFIXES[v175] || "";
}
function resolveModelManifestCandidate(v176, v177 = "") {
  const v178 = normalizeRegistryKey(v176),
    v179 = normalizeProviderId(v177);
  if (!v178) return null;
  const v180 = getModelManifest(v178);
  if (v180 && (!v179 || normalizeProviderId(v180["provider"]) === v179))
    return {
      modelManifest: v180,
      inputModelId: v178,
      canonicalModelId: v180["modelId"],
      source: "exact",
    };
  if (v179 && v178["includes"]("/")) {
    const [v181, ...v182] = v178["split"]("/"),
      v183 = inferProviderFromModelPrefix(v178),
      v184 = v182["join"]("/");
    if (v184 && (!v183 || v183 === v179)) {
      const v185 = getModelManifest(v184);
      if (v185 && normalizeProviderId(v185["provider"]) === v179)
        return {
          modelManifest: v185,
          inputModelId: v178,
          canonicalModelId: v185["modelId"],
          source: "stripped:" + v181,
        };
    }
  }
  if (v179 && !v178["includes"]("/")) {
    const v186 = getModelManifest(v179 + "/" + v178);
    if (v186 && normalizeProviderId(v186["provider"]) === v179)
      return {
        modelManifest: v186,
        inputModelId: v178,
        canonicalModelId: v186["modelId"],
        source: "prefixed",
      };
  }
  return null;
}
export function resolveModelProvider(
  v187,
  v188 = "",
  {
    allowProviderHint: allowProviderHint = true,
    allowPrefixInference: allowPrefixInference = true,
  } = {},
) {
  const v189 = normalizeProviderId(v188);
  if (v189 && allowProviderHint) return v189;
  const v190 = resolveModelManifestCandidate(v187, v189);
  if (v190?.["modelManifest"]?.["provider"])
    return normalizeProviderId(v190["modelManifest"]["provider"]);
  return allowPrefixInference ? inferProviderFromModelPrefix(v187) : "";
}
export function resolveModelExecution(v191, v192 = {}) {
  const v193 =
      typeof v192 === "string"
        ? v192
        : v192?.["providerHint"] || v192?.["provider"] || "",
    v194 = resolveModelManifestCandidate(v191, v193),
    v195 = v194?.["modelManifest"] || null;
  if (!v195) return null;
  const v196 = getExecutionManifest(v195["executionId"]);
  if (!v196) return null;
  return {
    modelManifest: v195,
    executionManifest: v196,
    inputModelId: v194["inputModelId"],
    canonicalModelId: v194["canonicalModelId"],
    source: v194["source"],
  };
}
export function isModelApiModel(v197, v198 = "") {
  const v199 = resolveModelExecution(v197, { providerHint: v198 });
  return (
    v199?.["modelManifest"]?.["adapterType"] === "modelApi" &&
    v199?.["executionManifest"]?.["adapterType"] === "modelApi"
  );
}
export function isWorkflowModel(v200, v201 = "") {
  const v202 = resolveModelExecution(v200, { providerHint: v201 });
  return (
    v202?.["modelManifest"]?.["adapterType"] === "workflow" &&
    v202?.["executionManifest"]?.["adapterType"] === "workflow"
  );
}
export function isLocalRuntimeModel(v203, v204 = "") {
  const v205 = resolveModelExecution(v203, { providerHint: v204 });
  return (
    v205?.["modelManifest"]?.["adapterType"] === "localRuntime" &&
    v205?.["executionManifest"]?.["adapterType"] === "localRuntime"
  );
}
export function getModelsByKind(v206) {
  const v207 = String(v206 || "")["trim"]();
  return Array["from"](new Set(_models["values"]()))["filter"](
    (v208) => !v207 || v208["kind"] === v207,
  );
}
export function listModelManifests() {
  return Array["from"](new Set(_models["values"]()));
}
