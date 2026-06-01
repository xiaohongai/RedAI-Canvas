import {
  getModelManifest,
  resolveModelExecution,
} from "../../manifests/index.js";
import { buildModelUiSchemaDefaultParams } from "../aigenImage/uiSchemaRenderer.js";
const VIDEO_WORKFLOW_DISPLAY_FIELDS = Object["freeze"]([
    "rhVideoResolution",
    "rhVideoFps",
    "rhVideoFrames",
    "rhVideoSeconds",
  ]),
  RUNNINGHUB_VIDEO_V54_PAYLOAD_RESOLVER = "runninghubVideoV54";
export function getPlainGenerationParams(v0) {
  return v0 && typeof v0 === "object" && !Array["isArray"](v0) ? { ...v0 } : {};
}
function normalizeUiPlacement(v1) {
  return String(v1 || "")
    ["trim"]()
    ["toLowerCase"]();
}
function getRunningHubVideoWorkflowManifest(v2) {
  const v3 = getModelManifest(v2);
  return v3?.["provider"] === "runninghubwf" &&
    v3?.["adapterType"] === "workflow" &&
    v3?.["kind"] === "video"
    ? v3
    : null;
}
function isToolbarOnlyWorkflowManifest(v4) {
  const v5 = Array["isArray"](v4?.["uiPlacement"]) ? v4["uiPlacement"] : [];
  return v5["includes"]("toolbar") && !v5["includes"]("modelMenu");
}
function getRunningHubVideoWorkflowFields(
  v6,
  { includeToolbarOnly: includeToolbarOnly = false } = {},
) {
  const v7 = getRunningHubVideoWorkflowManifest(v6);
  if (!v7) return [];
  if (!includeToolbarOnly && isToolbarOnlyWorkflowManifest(v7)) return [];
  const v8 = v7?.["uiSchema"]?.["fields"];
  return Array["isArray"](v8) ? v8 : [];
}
export function hasRunningHubVideoWorkflowUiPlacement(v9, v10, v11 = {}) {
  const v12 = normalizeUiPlacement(v10);
  if (!v12) return false;
  return getRunningHubVideoWorkflowFields(v9, v11)["some"](
    (v13) => normalizeUiPlacement(v13?.["placement"]) === v12,
  );
}
export function hasRunningHubVideoWorkflowUiField(v14, v15, v16 = {}) {
  const v17 = String(v15 || "")["trim"]();
  if (!v17) return false;
  return getRunningHubVideoWorkflowFields(v14, v16)["some"](
    (v18) => String(v18?.["id"] || "")["trim"]() === v17,
  );
}
export function getRunningHubVideoWorkflowFpsOptions(
  v19,
  { v54FpsOptions: v54FpsOptions = [16, 24, 30] } = {},
) {
  const v20 = getRunningHubVideoWorkflowFields(v19),
    v21 = v20["some"](
      (v22) => String(v22?.["id"] || "")["trim"]() === "rhVideoSeconds",
    );
  return v21 ? [16, 24] : v54FpsOptions;
}
function getManifestDisplayFieldIds(v23) {
  const v24 = getModelManifest(v23)?.["uiSchema"]?.["fields"],
    v25 = new Set(
      (Array["isArray"](v24) ? v24 : [])["map"]((v26) =>
        String(v26?.["id"] || "")["trim"](),
      ),
    ),
    v27 = VIDEO_WORKFLOW_DISPLAY_FIELDS["filter"]((v28) => v25["has"](v28));
  return v27["length"] ? v27 : VIDEO_WORKFLOW_DISPLAY_FIELDS;
}
function getDeclaredManifestDisplayFields(v29) {
  const v30 = getModelManifest(v29)?.["uiSchema"]?.["fields"],
    v31 = new Set(VIDEO_WORKFLOW_DISPLAY_FIELDS);
  return (Array["isArray"](v30) ? v30 : [])["filter"]((v32) =>
    v31["has"](String(v32?.["id"] || "")["trim"]()),
  );
}
function getDeclaredManifestField(v33, v34) {
  const v35 = String(v34 || "")["trim"]();
  if (!v35) return null;
  const v36 = getModelManifest(v33)?.["uiSchema"]?.["fields"];
  return (
    (Array["isArray"](v36) ? v36 : [])["find"](
      (v37) => String(v37?.["id"] || "")["trim"]() === v35,
    ) || null
  );
}
function getRunningHubVideoExecution(v38) {
  try {
    const v39 = resolveModelExecution(v38);
    return v39?.["executionManifest"] || null;
  } catch {
    return null;
  }
}
export function getRunningHubVideoParameterPanelPolicy(v40) {
  const v41 = getModelManifest(v40)?.["extensions"]?.["videoParameterPanel"];
  return v41 && typeof v41 === "object" && !Array["isArray"](v41) ? v41 : {};
}
function getTopLevelDisplayParams(v42, v43) {
  const v44 = {};
  return (
    getManifestDisplayFieldIds(v43)["forEach"]((v45) => {
      Object["prototype"]["hasOwnProperty"]["call"](v42 || {}, v45) &&
        (v44[v45] = v42[v45]);
    }),
    v44
  );
}
function normalizeRhV54SinglePreset(v46) {
  const v47 = String(v46 ?? "")["trim"]();
  return v47 === "efficiency" || v47 === "stable" || v47 === "quality"
    ? v47
    : "efficiency";
}
function normalizeRhV54SpecialMode(v48) {
  const v49 = String(v48 ?? "")["trim"]();
  return v49 === "longVideoOverlay" || v49 === "cameraMove" ? v49 : null;
}
function normalizeRhV54MaskExpand(v50) {
  const v51 = Number(v50);
  return Number["isFinite"](v51)
    ? Math["max"](-9999, Math["min"](9999, Math["trunc"](v51)))
    : 25;
}
function normalizeRhV54BreastJiggle(v52) {
  const v53 = Number(v52);
  if (!Number["isFinite"](v53)) return 0;
  return Math["max"](0, Math["min"](1, Math["round"](v53 * 20) / 20));
}
function normalizeBooleanParam(v54, v55 = false) {
  if (v54 === true || String(v54)["trim"]() === "true") return true;
  if (v54 === false || String(v54)["trim"]() === "false") return false;
  return v55;
}
function buildRhV54AdvancedDisplayPatch(v56) {
  const v57 =
      String(v56["rhControlMode"] || "single") === "multi" ? "multi" : "single",
    v58 = {
      rhBlendIntoScene: v56["rhBlendIntoScene"] === true,
      rhControlMode: v57,
      rhSingleControlPreset:
        v57 === "multi"
          ? null
          : normalizeRhV54SinglePreset(v56["rhSingleControlPreset"]),
      rhSubtractSubject: v56["rhSubtractSubject"] !== false,
      rhMaskExpand: normalizeRhV54MaskExpand(v56["rhMaskExpand"]),
      rhMaskRect: v56["rhMaskRect"] === true,
      rhSpecialMode: normalizeRhV54SpecialMode(v56["rhSpecialMode"]),
      rhBreastJiggle: normalizeRhV54BreastJiggle(v56["rhBreastJiggle"]),
    };
  return v58;
}
function getFieldDefaultNumber(v59, v60) {
  const v61 = Number(v59?.["defaultValue"]);
  return Number["isFinite"](v61) ? v61 : v60;
}
function getFieldMinNumber(v62, v63) {
  const v64 = Number(v62?.["min"]);
  return Number["isFinite"](v64) ? v64 : v63;
}
function getNormalizedDisplayFieldValue(v65, v66, v67, v68 = {}) {
  const v69 = String(v66?.["id"] || "")["trim"](),
    v70 = v67[v69],
    v71 = Number(v70);
  if (v69 === "rhVideoResolution") {
    const v72 = getFieldDefaultNumber(v66, 832);
    return Number["isFinite"](v71) ? Math["max"](832, Math["trunc"](v71)) : v72;
  }
  if (v69 === "rhVideoFps") {
    const v73 = getFieldDefaultNumber(v66, 24),
      v74 = getRunningHubVideoExecution(v65),
      v75 =
        v74?.["extensions"]?.["payloadResolver"] ===
        RUNNINGHUB_VIDEO_V54_PAYLOAD_RESOLVER
          ? v68["v54FpsOptions"]
          : v66?.["options"],
      v76 = (Array["isArray"](v75) ? v75 : [])
        ["map"]((v77) => Number(v77?.["value"] ?? v77))
        ["filter"](Number["isFinite"]),
      v78 = v76["length"] ? v76 : [16, 24];
    return v78["includes"](v71) ? v71 : v73;
  }
  if (v69 === "rhVideoFrames") {
    const v79 = getFieldDefaultNumber(v66, 77),
      v80 = getFieldMinNumber(v66, 0);
    return Number["isFinite"](v71) ? Math["max"](v80, Math["trunc"](v71)) : v79;
  }
  if (v69 === "rhVideoSeconds") {
    const v81 = getFieldDefaultNumber(v66, 5),
      v82 = getFieldMinNumber(v66, 1);
    return Number["isFinite"](v71) ? Math["max"](v82, Math["trunc"](v71)) : v81;
  }
  return undefined;
}
export function isRunningHubVideoWorkflowManifest(v83) {
  return !!getRunningHubVideoWorkflowManifest(v83);
}
export function buildVideoWorkflowGenerationParamsPatch(v84, v85, v86 = {}) {
  const v87 = String(v84?.["model"] || "")["trim"](),
    v88 = String(v85 || "")["trim"]();
  if (!isRunningHubVideoWorkflowManifest(v88)) return {};
  const v89 = getPlainGenerationParams(v84?.["generationParamsByModel"]);
  v87 &&
    (v89[v87] = {
      ...getPlainGenerationParams(v84?.["generationParams"]),
      ...getTopLevelDisplayParams(v84, v87),
    });
  const v90 = buildModelUiSchemaDefaultParams(v88),
    v91 = getPlainGenerationParams(v89[v88]),
    v92 = !v87 || v87 === v88 ? getTopLevelDisplayParams(v84, v88) : {},
    v93 = { ...v90, ...v91, ...v92, ...getPlainGenerationParams(v86) };
  return (
    (v89[v88] = v93),
    { generationParams: v93, generationParamsByModel: v89 }
  );
}
export function buildVideoWorkflowDisplayParamsPatch(v94, v95, v96 = {}) {
  const v97 = String(v94 || "")["trim"](),
    v98 = getPlainGenerationParams(v95),
    v99 = Array["isArray"](v96?.["v54FpsOptions"])
      ? v96["v54FpsOptions"]
          ["map"]((v100) => Number(v100))
          ["filter"](Number["isFinite"])
      : [16, 24, 30],
    v101 = {};
  getDeclaredManifestDisplayFields(v97)["forEach"]((v102) => {
    const v103 = String(v102?.["id"] || "")["trim"](),
      v104 = getNormalizedDisplayFieldValue(v97, v102, v98, {
        v54FpsOptions: v99,
      });
    if (v104 !== undefined) v101[v103] = v104;
  });
  const v105 = getRunningHubVideoParameterPanelPolicy(v97);
  v105["advancedDisplayPatch"] === "runningHubVideoV54" &&
    Object["assign"](v101, buildRhV54AdvancedDisplayPatch(v98));
  getDeclaredManifestField(v97, "rhEnableMask") &&
    (v101["rhEnableMask"] = normalizeBooleanParam(v98["rhEnableMask"], false));
  const v106 = Number(v105["forceDisplayFps"]);
  return (Number["isFinite"](v106) && (v101["rhVideoFps"] = v106), v101);
}
function buildVideoWorkflowSelectionStatePatch(v107, v108, v109 = {}) {
  const v110 = {},
    v111 = getRunningHubVideoParameterPanelPolicy(v108),
    v112 = v111["frameStateDefaults"];
  if (v112 && typeof v112 === "object") {
    const v113 = Number(v112["frameRate"]),
      v114 = Number(v112["frameCount"]);
    ((v110["frameRate"] = Number["isFinite"](v107?.["frameRate"])
      ? v107["frameRate"]
      : Number["isFinite"](v113)
        ? v113
        : 24),
      (v110["frameCount"] = Number["isFinite"](v107?.["frameCount"])
        ? v107["frameCount"]
        : Number["isFinite"](v114)
          ? v114
          : 77),
      (v109["preserveMaskTouchedState"] || v111["preserveMaskTouchedState"]) &&
        (v110["rhMaskExpandTouched"] = v107?.["rhMaskExpandTouched"] === true));
  }
  const v115 =
    v111["defaultSelectionState"] &&
    typeof v111["defaultSelectionState"] === "object"
      ? v111["defaultSelectionState"]
      : null;
  return (
    v115 &&
      Object["entries"](v115)["forEach"](([v116, v117]) => {
        v110[v116] = v107?.[v116] || v117;
      }),
    v110
  );
}
export function buildVideoWorkflowModelSelectionPatch(v118, v119, v120 = {}) {
  if (!isRunningHubVideoWorkflowManifest(v119)) return {};
  const v121 = buildVideoWorkflowGenerationParamsPatch(v118, v119),
    v122 = buildVideoWorkflowSelectionStatePatch(v118 || {}, v119, v120),
    v123 = buildVideoWorkflowDisplayParamsPatch(
      v119,
      v121["generationParams"],
      v120,
    );
  return { ...v121, ...v122, ...v123 };
}
export function resolveVideoWorkflowSchemaParam(v124, v125, v126) {
  const v127 = getModelManifest(v125),
    v128 = String(v126 || "")["trim"](),
    v129 = v127?.["uiSchema"]?.["fields"],
    v130 = Array["isArray"](v129)
      ? v129["find"]((v131) => String(v131?.["id"] || "")["trim"]() === v128)
      : null;
  if (!v130)
    throw new Error("RunningHub video manifest " + v125 + " missing " + v128);
  if (v130["defaultValue"] === undefined)
    throw new Error(
      "RunningHub video manifest " +
        v125 +
        " missing " +
        v128 +
        " defaultValue",
    );
  const v132 = getPlainGenerationParams(v124?.["generationParams"]);
  if (!Object["prototype"]["hasOwnProperty"]["call"](v132, v128))
    throw new Error(
      "RunningHub video node " + v125 + " missing generationParams." + v128,
    );
  const v133 = v132[v128];
  if (v133 === undefined || v133 === null || String(v133)["trim"]() === "")
    throw new Error(
      "RunningHub\x20video\x20node\x20" +
        v125 +
        "\x20missing\x20generationParams." +
        v128,
    );
  return v133;
}
