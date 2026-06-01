import {
  PANORAMA_SCENE_CAMERA_CONSTRAINTS,
  SCENE_DEFAULT_FOCAL_LENGTH_MM,
  SCENE_ORBIT_DISTANCE_MAX,
  SCENE_ORBIT_DISTANCE_MIN,
  clampPanoramaPitch,
  clampSceneFocalLength,
  clampSceneOrbitPitch,
} from "../../core/panoramaSceneMath.js";
const PANORAMA_SCENE_NODE_TYPE = "panorama-scene",
  PANORAMA_SCENE_NODE_ALIASES = ["panorama_scene"],
  PANORAMA_360_NODE_TYPE = "panorama-360",
  PANORAMA_360_NODE_ALIASES = ["panorama_360", "panorama360"],
  PANORAMA_SCENE_CAMERA_LIMIT = 10,
  PANORAMA_SCENE_DEFAULT_SIZE = Object["freeze"]({ width: 1024, height: 576 }),
  PANORAMA_SCENE_COLLAPSED_MAX_SIZE = 288,
  PANORAMA_SCENE_DEFAULT_NAME = "3D导演台",
  PANORAMA_360_DEFAULT_NAME = "360全景图",
  PANORAMA_SCENE_COLOR_TOKENS = Object["freeze"]({
    red: "--red",
    blue: "--blue",
    green: "--green",
    yellow: "--gold",
    purple: "--purple",
    cyan: "--cyan",
    black: "--black",
    white: "--white",
  }),
  DEFAULT_SCENE_VIEW = Object["freeze"]({
    target: Object["freeze"]({ x: 0, y: 1.2, z: 0 }),
    orbitYaw: Math["PI"] / 4,
    orbitPitch: Math["PI"] / 4,
    orbitDistance: 9,
  }),
  DEFAULT_PANORAMA_VIEW = Object["freeze"]({
    yaw: 0,
    pitch: PANORAMA_SCENE_CAMERA_CONSTRAINTS["panorama"]["pitch"]["default"],
    fov: PANORAMA_SCENE_CAMERA_CONSTRAINTS["panorama"]["fov"]["default"],
  }),
  DEFAULT_GRID_PLACEMENT = Object["freeze"]({
    rows: 2,
    cols: 3,
    spacingX: 1.8,
    spacingZ: 1.8,
    gender: "male",
    colorKey: "blue",
  });
function toFiniteNumber(v0, v1) {
  const v2 = Number(v0);
  return Number["isFinite"](v2) ? v2 : v1;
}
function normalizeVector3(v3, v4) {
  return {
    x: toFiniteNumber(v3?.["x"], v4["x"]),
    y: toFiniteNumber(v3?.["y"], v4["y"]),
    z: toFiniteNumber(v3?.["z"], v4["z"]),
  };
}
function normalizeEuler(v5, v6) {
  return {
    x: toFiniteNumber(v5?.["x"], v6["x"]),
    y: toFiniteNumber(v5?.["y"], v6["y"]),
    z: toFiniteNumber(v5?.["z"], v6["z"]),
  };
}
function normalizeScaleValue(v7, v8 = 1) {
  if (Number["isFinite"](v7)) return Math["max"](0.01, Number(v7) || 1);
  if (
    v7 &&
    Number["isFinite"](v7["x"]) &&
    Number["isFinite"](v7["y"]) &&
    Number["isFinite"](v7["z"])
  )
    return {
      x: Math["max"](0.01, Number(v7["x"]) || 1),
      y: Math["max"](0.01, Number(v7["y"]) || 1),
      z: Math["max"](0.01, Number(v7["z"]) || 1),
    };
  if (
    v8 &&
    Number["isFinite"](v8["x"]) &&
    Number["isFinite"](v8["y"]) &&
    Number["isFinite"](v8["z"])
  )
    return {
      x: Math["max"](0.01, Number(v8["x"]) || 1),
      y: Math["max"](0.01, Number(v8["y"]) || 1),
      z: Math["max"](0.01, Number(v8["z"]) || 1),
    };
  return Math["max"](0.01, Number(v8) || 1);
}
function clamp(v9, v10, v11) {
  return Math["min"](v11, Math["max"](v10, v9));
}
function normalizeQuaternion(v12, v13 = { x: 0, y: 0, z: 0, w: 1 }) {
  const v14 = Number(v12?.["x"]),
    v15 = Number(v12?.["y"]),
    v16 = Number(v12?.["z"]),
    v17 = Number(v12?.["w"]);
  if (
    !Number["isFinite"](v14) ||
    !Number["isFinite"](v15) ||
    !Number["isFinite"](v16) ||
    !Number["isFinite"](v17)
  )
    return { ...v13 };
  const v18 = Math["hypot"](v14, v15, v16, v17);
  if (v18 < 0.000001) return { ...v13 };
  return { x: v14 / v18, y: v15 / v18, z: v16 / v18, w: v17 / v18 };
}
function quaternionFromEulerYXZ(v19) {
  const v20 = Number(v19?.["x"]) || 0,
    v21 = Number(v19?.["y"]) || 0,
    v22 = Number(v19?.["z"]) || 0,
    v23 = Math["cos"](v20 / 2),
    v24 = Math["cos"](v21 / 2),
    v25 = Math["cos"](v22 / 2),
    v26 = Math["sin"](v20 / 2),
    v27 = Math["sin"](v21 / 2),
    v28 = Math["sin"](v22 / 2);
  return normalizeQuaternion({
    x: v26 * v24 * v25 + v23 * v27 * v28,
    y: v23 * v27 * v25 - v26 * v24 * v28,
    z: v23 * v24 * v28 - v26 * v27 * v25,
    w: v23 * v24 * v25 + v26 * v27 * v28,
  });
}
function eulerFromQuaternionYXZ(v29) {
  const v30 = normalizeQuaternion(v29),
    v31 = v30["x"] * v30["x"],
    v32 = v30["y"] * v30["y"],
    v33 = v30["z"] * v30["z"],
    v34 = v30["x"] * v30["y"],
    v35 = v30["x"] * v30["z"],
    v36 = v30["y"] * v30["z"],
    v37 = v30["x"] * v30["w"],
    v38 = v30["y"] * v30["w"],
    v39 = v30["z"] * v30["w"],
    v40 = 1 - 2 * (v32 + v33),
    v41 = 2 * (v35 + v38),
    v42 = 2 * (v34 + v39),
    v43 = 1 - 2 * (v31 + v33),
    v44 = 2 * (v36 - v37),
    v45 = 2 * (v35 - v38),
    v46 = 1 - 2 * (v31 + v32),
    v47 = Math["asin"](-clamp(v44, -1, 1));
  if (Math["abs"](v44) < 0.9999999)
    return { x: v47, y: Math["atan2"](v41, v46), z: Math["atan2"](v42, v43) };
  return { x: v47, y: Math["atan2"](-v45, v40), z: 0 };
}
function quaternionFromEulerXYZ(v48) {
  const v49 = Number(v48?.["x"]) || 0,
    v50 = Number(v48?.["y"]) || 0,
    v51 = Number(v48?.["z"]) || 0,
    v52 = Math["cos"](v49 / 2),
    v53 = Math["cos"](v50 / 2),
    v54 = Math["cos"](v51 / 2),
    v55 = Math["sin"](v49 / 2),
    v56 = Math["sin"](v50 / 2),
    v57 = Math["sin"](v51 / 2);
  return normalizeQuaternion({
    x: v55 * v53 * v54 + v52 * v56 * v57,
    y: v52 * v56 * v54 - v55 * v53 * v57,
    z: v52 * v53 * v57 + v55 * v56 * v54,
    w: v52 * v53 * v54 - v55 * v56 * v57,
  });
}
function eulerFromQuaternionXYZ(v58) {
  const v59 = normalizeQuaternion(v58),
    v60 = v59["x"] * v59["x"],
    v61 = v59["y"] * v59["y"],
    v62 = v59["z"] * v59["z"],
    v63 = v59["x"] * v59["y"],
    v64 = v59["x"] * v59["z"],
    v65 = v59["y"] * v59["z"],
    v66 = v59["x"] * v59["w"],
    v67 = v59["y"] * v59["w"],
    v68 = v59["z"] * v59["w"],
    v69 = 1 - 2 * (v61 + v62),
    v70 = 2 * (v63 - v68),
    v71 = 2 * (v64 + v67),
    v72 = 2 * (v65 - v66),
    v73 = 1 - 2 * (v60 + v61),
    v74 = 2 * (v65 + v66),
    v75 = 1 - 2 * (v60 + v62),
    v76 = Math["asin"](clamp(v71, -1, 1));
  if (Math["abs"](v71) < 0.9999999)
    return { x: Math["atan2"](-v72, v73), y: v76, z: Math["atan2"](-v70, v69) };
  return { x: Math["atan2"](v74, v75), y: v76, z: 0 };
}
function normalizeMode(v77) {
  return v77 === "panorama" ? "panorama" : "scene";
}
function normalizeNodeTypeValue(v78) {
  return String(v78 || "")["trim"]();
}
export function isPanoramaSceneNodeType(v79) {
  const v80 = normalizeNodeTypeValue(v79);
  return (
    v80 === PANORAMA_SCENE_NODE_TYPE ||
    PANORAMA_SCENE_NODE_ALIASES["includes"](v80)
  );
}
export function isPanorama360NodeType(v81) {
  const v82 = normalizeNodeTypeValue(v81);
  return (
    v82 === PANORAMA_360_NODE_TYPE || PANORAMA_360_NODE_ALIASES["includes"](v82)
  );
}
export function isPanoramaGraphNodeType(v83) {
  return isPanoramaSceneNodeType(v83) || isPanorama360NodeType(v83);
}
export function getPanoramaStateFieldByNodeType(v84) {
  if (isPanorama360NodeType(v84)) return "panorama360Node";
  if (isPanoramaSceneNodeType(v84)) return "sceneNode";
  return "";
}
function normalizeEnvironmentMode(v85) {
  return v85 === "night" ? "night" : "day";
}
function normalizeActiveView(v86) {
  return v86 === "camera" ? "camera" : "default";
}
function normalizeSelectionType(v87) {
  return v87 === "mannequin" || v87 === "cube" ? v87 : null;
}
function normalizeGender(v88) {
  return v88 === "female" ? "female" : "male";
}
function normalizeColorKey(v89) {
  return PANORAMA_SCENE_COLOR_TOKENS[v89] ? v89 : "blue";
}
function normalizeLegacyTool(v90) {
  return v90 === "move" ||
    v90 === "rotate" ||
    v90 === "scale" ||
    v90 === "box-select"
    ? v90
    : "navigate";
}
function normalizeMouseTool(v91) {
  return v91 === "box-select" ? "box-select" : "navigate";
}
function normalizeTransformTool(v92) {
  return v92 === "move" || v92 === "rotate" || v92 === "scale" ? v92 : "move";
}
function normalizeTransformSpace(v93) {
  return "local";
}
function normalizePivotMode(v94) {
  return "active";
}
function normalizeNavigationPreset(v95) {
  return v95 === "dcc" ? "dcc" : "dcc";
}
function normalizeCaptureMode(v96) {
  const v97 = String(v96 || "")["trim"]();
  if (v97 === "9:16" || v97 === "2.35:1") return v97;
  return "adaptive";
}
export function createDefaultSceneView() {
  return {
    target: { ...DEFAULT_SCENE_VIEW["target"] },
    orbitYaw: DEFAULT_SCENE_VIEW["orbitYaw"],
    orbitPitch: DEFAULT_SCENE_VIEW["orbitPitch"],
    orbitDistance: DEFAULT_SCENE_VIEW["orbitDistance"],
  };
}
export function createDefaultPanoramaView() {
  return { ...DEFAULT_PANORAMA_VIEW };
}
export function createDefaultGridPlacement() {
  return { ...DEFAULT_GRID_PLACEMENT };
}
export function createDefaultPanoramaSceneState() {
  return {
    version: 1,
    mode: "scene",
    environmentMode: "night",
    viewport: {
      activeView: "default",
      activeCameraId: null,
      sceneView: createDefaultSceneView(),
      panoramaView: createDefaultPanoramaView(),
    },
    panorama: {
      localPath: null,
      imageUrl: null,
      fileName: null,
      sourceSignature: null,
      isLoaded: false,
      error: null,
    },
    mannequins: [],
    cubes: [],
    cameras: [],
    selection: {
      selectedObjectType: null,
      selectedObjectId: null,
      selectedObjectIds: [],
      selectedObjects: [],
      selectedGroupId: null,
    },
    groups: [],
    gridPlacement: createDefaultGridPlacement(),
    capture: {
      pending: false,
      lastCaptureAt: null,
      error: null,
      mode: "adaptive",
      showSafeFrame: false,
    },
    ui: {
      mouseTool: "navigate",
      transformTool: "move",
      activeTool: "navigate",
      transformSpace: "local",
      pivotMode: "active",
      navigationPreset: "dcc",
      showCameraList: false,
      isEditing: false,
    },
  };
}
export function createDefaultPanorama360State() {
  const v98 = createDefaultPanoramaSceneState();
  return (
    (v98["mode"] = "panorama"),
    (v98["viewport"]["activeView"] = "default"),
    (v98["viewport"]["activeCameraId"] = null),
    (v98["cubes"] = []),
    (v98["cameras"] = []),
    (v98["ui"]["showCameraList"] = false),
    v98
  );
}
export function normalizePanoramaSceneState(v99) {
  const v100 = createDefaultPanoramaSceneState(),
    v101 = {
      ...v100["viewport"]["sceneView"],
      ...(v99?.["viewport"]?.["sceneView"] || {}),
    };
  (delete v101["fov"],
    (v101["target"] = normalizeVector3(
      v99?.["viewport"]?.["sceneView"]?.["target"],
      v100["viewport"]["sceneView"]["target"],
    )),
    (v101["orbitYaw"] = toFiniteNumber(
      v99?.["viewport"]?.["sceneView"]?.["orbitYaw"],
      v100["viewport"]["sceneView"]["orbitYaw"],
    )),
    (v101["orbitPitch"] = clampSceneOrbitPitch(
      toFiniteNumber(
        v99?.["viewport"]?.["sceneView"]?.["orbitPitch"],
        v100["viewport"]["sceneView"]["orbitPitch"],
      ),
    )),
    (v101["orbitDistance"] = clamp(
      toFiniteNumber(
        v99?.["viewport"]?.["sceneView"]?.["orbitDistance"],
        v100["viewport"]["sceneView"]["orbitDistance"],
      ),
      SCENE_ORBIT_DISTANCE_MIN,
      SCENE_ORBIT_DISTANCE_MAX,
    )));
  const v102 = {
    ...v100["viewport"]["panoramaView"],
    ...(v99?.["viewport"]?.["panoramaView"] || {}),
  };
  ((v102["yaw"] = toFiniteNumber(
    v99?.["viewport"]?.["panoramaView"]?.["yaw"],
    v100["viewport"]["panoramaView"]["yaw"],
  )),
    (v102["pitch"] = clampPanoramaPitch(
      toFiniteNumber(
        v99?.["viewport"]?.["panoramaView"]?.["pitch"],
        v100["viewport"]["panoramaView"]["pitch"],
      ),
    )),
    (v102["fov"] = Math["max"](
      PANORAMA_SCENE_CAMERA_CONSTRAINTS["panorama"]["fov"]["min"],
      Math["min"](
        PANORAMA_SCENE_CAMERA_CONSTRAINTS["panorama"]["fov"]["max"],
        toFiniteNumber(
          v99?.["viewport"]?.["panoramaView"]?.["fov"],
          v100["viewport"]["panoramaView"]["fov"],
        ),
      ),
    )));
  const v103 = Array["isArray"](v99?.["mannequins"])
      ? v99["mannequins"]
          ["filter"]((v104) => v104 && v104["id"])
          ["map"]((v105) => {
            const v106 = normalizeEuler(v105["rotation"], { x: 0, y: 0, z: 0 }),
              v107 =
                Number["isFinite"](Number(v105?.["quaternion"]?.["x"])) &&
                Number["isFinite"](Number(v105?.["quaternion"]?.["y"])) &&
                Number["isFinite"](Number(v105?.["quaternion"]?.["z"])) &&
                Number["isFinite"](Number(v105?.["quaternion"]?.["w"])),
              v108 = v107
                ? normalizeQuaternion(
                    v105["quaternion"],
                    quaternionFromEulerXYZ(v106),
                  )
                : quaternionFromEulerXYZ(v106),
              v109 = v107 ? eulerFromQuaternionXYZ(v108) : v106;
            return {
              id: v105["id"],
              gender: normalizeGender(v105["gender"]),
              colorKey: normalizeColorKey(v105["colorKey"] || v105["color"]),
              position: normalizeVector3(v105["position"], {
                x: 0,
                y: 0,
                z: 0,
              }),
              rotation: v109,
              quaternion: v108,
              scale: normalizeScaleValue(v105["scale"], 1),
            };
          })
      : [],
    v110 = Array["isArray"](v99?.["cubes"])
      ? v99["cubes"]
          ["filter"]((v111) => v111 && v111["id"])
          ["map"]((v112) => {
            const v113 = normalizeEuler(v112["rotation"], { x: 0, y: 0, z: 0 }),
              v114 =
                Number["isFinite"](Number(v112?.["quaternion"]?.["x"])) &&
                Number["isFinite"](Number(v112?.["quaternion"]?.["y"])) &&
                Number["isFinite"](Number(v112?.["quaternion"]?.["z"])) &&
                Number["isFinite"](Number(v112?.["quaternion"]?.["w"])),
              v115 = v114
                ? normalizeQuaternion(
                    v112["quaternion"],
                    quaternionFromEulerXYZ(v113),
                  )
                : quaternionFromEulerXYZ(v113),
              v116 = v114 ? eulerFromQuaternionXYZ(v115) : v113;
            return {
              id: v112["id"],
              colorKey: normalizeColorKey(v112["colorKey"] || v112["color"]),
              position: normalizeVector3(v112["position"], {
                x: 0,
                y: 0,
                z: 0,
              }),
              rotation: v116,
              quaternion: v115,
              scale: normalizeScaleValue(v112["scale"], 1),
            };
          })
      : [],
    v117 = Array["isArray"](v99?.["cameras"])
      ? v99["cameras"]
          ["filter"]((v118) => v118 && v118["id"])
          ["slice"](0, PANORAMA_SCENE_CAMERA_LIMIT)
          ["map"]((v119, v120) => {
            const v121 = normalizeEuler(v119["rotation"], { x: 0, y: 0, z: 0 }),
              v122 =
                Number["isFinite"](Number(v119?.["quaternion"]?.["x"])) &&
                Number["isFinite"](Number(v119?.["quaternion"]?.["y"])) &&
                Number["isFinite"](Number(v119?.["quaternion"]?.["z"])) &&
                Number["isFinite"](Number(v119?.["quaternion"]?.["w"])),
              v123 = v122
                ? normalizeQuaternion(
                    v119["quaternion"],
                    quaternionFromEulerYXZ(v121),
                  )
                : quaternionFromEulerYXZ(v121),
              v124 = v122 ? eulerFromQuaternionYXZ(v123) : v121;
            return {
              id: v119["id"],
              slot: Number["isInteger"](Number(v119["slot"]))
                ? Math["max"](
                    1,
                    Math["min"](
                      PANORAMA_SCENE_CAMERA_LIMIT,
                      Number(v119["slot"]),
                    ),
                  )
                : null,
              name:
                String(v119["name"] || "机位 " + (v120 + 1))["trim"]() ||
                "机位 " + (v120 + 1),
              position: normalizeVector3(v119["position"], {
                x: 0,
                y: 1.6,
                z: 4,
              }),
              quaternion: v123,
              rotation: v124,
              focalLength: clampSceneFocalLength(
                Object["prototype"]["hasOwnProperty"]["call"](
                  v119 || {},
                  "focalLength",
                )
                  ? toFiniteNumber(
                      v119["focalLength"],
                      SCENE_DEFAULT_FOCAL_LENGTH_MM,
                    )
                  : SCENE_DEFAULT_FOCAL_LENGTH_MM,
              ),
            };
          })
      : [],
    v125 = new Set(v103["map"]((v126) => v126["id"])),
    v127 = new Set(v110["map"]((v128) => v128["id"])),
    v129 = Array["isArray"](v99?.["groups"])
      ? v99["groups"]
          ["filter"]((v130) => v130 && v130["id"])
          ["map"]((v131) => {
            const v132 = Array["isArray"](v131["memberIds"])
                ? [
                    ...new Set(
                      v131["memberIds"]
                        ["map"]((v133) => String(v133 || "")["trim"]())
                        ["filter"](Boolean),
                    ),
                  ]
                : [],
              v134 = v132["filter"]((v135) => v125["has"](v135));
            return {
              id: String(v131["id"]),
              type:
                v131["type"] === "mannequin-grid"
                  ? "mannequin-grid"
                  : "mannequin-grid",
              memberObjectType:
                v131["memberObjectType"] === "mannequin"
                  ? "mannequin"
                  : "mannequin",
              memberIds: v134,
            };
          })
          ["filter"]((v136) => v136["memberIds"]["length"] > 0)
      : [],
    v137 =
      String(v99?.["viewport"]?.["activeCameraId"] || "")["trim"]() || null,
    v138 = v137 ? v117["some"]((v139) => v139["id"] === v137) : false,
    v140 = normalizeSelectionType(v99?.["selection"]?.["selectedObjectType"]),
    v141 = v99?.["selection"]?.["selectedObjectId"]
      ? String(v99["selection"]["selectedObjectId"])
      : null,
    v142 = Array["isArray"](v99?.["selection"]?.["selectedObjectIds"])
      ? [
          ...new Set(
            v99["selection"]["selectedObjectIds"]
              ["map"]((v143) => String(v143 || "")["trim"]())
              ["filter"](Boolean),
          ),
        ]
      : v141
        ? [v141]
        : [],
    v144 = v99?.["selection"]?.["selectedGroupId"]
      ? String(v99["selection"]["selectedGroupId"])["trim"]()
      : null,
    v145 = v144 ? v129["find"]((v146) => v146["id"] === v144) || null : null,
    v147 = new Set(v117["map"]((v148) => v148["id"])),
    v149 = Array["isArray"](v99?.["selection"]?.["selectedObjects"])
      ? v99["selection"]["selectedObjects"]
      : [],
    v150 = [],
    v151 = new Set();
  v149["forEach"]((v152) => {
    const v153 = normalizeSelectionType(v152?.["objectType"]),
      v154 = String(v152?.["objectId"] || "")["trim"]();
    if (!v153 || !v154) return;
    const v155 = v153 === "cube" ? v127["has"](v154) : v125["has"](v154);
    if (!v155) return;
    const v156 = v153 + ":" + v154;
    if (v151["has"](v156)) return;
    (v151["add"](v156), v150["push"]({ objectType: v153, objectId: v154 }));
  });
  const v157 = v140,
    v158 =
      v157 === "camera"
        ? v141 && v147["has"](v141)
          ? v141
          : null
        : v157 === "cube"
          ? v141 && v127["has"](v141)
            ? v141
            : null
          : v141 && v125["has"](v141)
            ? v141
            : null;
  let v159 = v142["filter"]((v160) =>
      v157 === "camera"
        ? v147["has"](v160)
        : v157 === "cube"
          ? v127["has"](v160)
          : v125["has"](v160),
    ),
    v161 = v157,
    v162 = v158,
    v163 = v145 ? v145["id"] : null;
  if (!v161 && v159["length"] > 0) {
    const v164 = v159[0];
    v127["has"](v164)
      ? ((v161 = "cube"), (v159 = v159["filter"]((v165) => v127["has"](v165))))
      : ((v161 = "mannequin"),
        (v159 = v159["filter"]((v166) => v125["has"](v166))));
  }
  if (v145)
    ((v161 = "mannequin"),
      (v159 = [...v145["memberIds"]]),
      (v162 = v145["memberIds"][0] || null));
  else {
    if (v159["length"] > 0)
      ((v162 = v159["includes"](v162) && v162 ? v162 : v159[0]),
        v161 !== "mannequin" && (v163 = null));
    else v162 ? (v159 = [v162]) : ((v162 = null), (v161 = null), (v163 = null));
  }
  let v167 = v150;
  if (v167["length"] === 0) {
    if (v145)
      v167 = v145["memberIds"]["map"]((v168) => ({
        objectType: "mannequin",
        objectId: v168,
      }));
    else {
      if (v161 === "cube" || v161 === "mannequin") {
        const v169 = v159["length"] > 0 ? v159 : v162 ? [v162] : [];
        v167 = v169["map"]((v170) => ({ objectType: v161, objectId: v170 }));
      }
    }
  }
  let v171 = null,
    v172 = null,
    v173 = [];
  if (v167["length"] > 0) {
    const v174 = v161 === "cube" || v161 === "mannequin" ? v161 : null,
      v175 = v174 ? v167["some"]((v176) => v176["objectType"] === v174) : false;
    ((v171 = v175 ? v174 : v167[0]["objectType"]),
      (v173 = v167["filter"]((v177) => v177["objectType"] === v171)["map"](
        (v178) => v178["objectId"],
      )));
    const v179 =
      v162 &&
      v167["some"](
        (v180) => v180["objectType"] === v171 && v180["objectId"] === v162,
      );
    v172 = v179 ? v162 : v173[0] || null;
  } else v163 = null;
  if (v163) {
    const v181 = v129["find"]((v182) => v182["id"] === v163) || null;
    if (!v181) v163 = null;
    else {
      const v183 = new Set(
          v167["filter"]((v184) => v184["objectType"] === "mannequin")["map"](
            (v185) => v185["objectId"],
          ),
        ),
        v186 =
          v167["every"]((v187) => v187["objectType"] === "mannequin") &&
          v181["memberIds"]["length"] > 0 &&
          v181["memberIds"]["every"]((v188) => v183["has"](v188)) &&
          v181["memberIds"]["length"] === v167["length"];
      !v186
        ? (v163 = null)
        : ((v171 = "mannequin"),
          (v173 = [...v181["memberIds"]]),
          (v172 = v181["memberIds"][0] || null),
          (v167 = v181["memberIds"]["map"]((v189) => ({
            objectType: "mannequin",
            objectId: v189,
          }))));
    }
  }
  const v190 = normalizeLegacyTool(v99?.["ui"]?.["activeTool"]),
    v191 = normalizeMouseTool(
      v99?.["ui"]?.["mouseTool"] != null
        ? v99["ui"]["mouseTool"]
        : v190 === "box-select"
          ? "box-select"
          : "navigate",
    ),
    v192 = normalizeTransformTool(
      v99?.["ui"]?.["transformTool"] != null
        ? v99["ui"]["transformTool"]
        : v190 === "move" || v190 === "rotate" || v190 === "scale"
          ? v190
          : "move",
    );
  return {
    version: 1,
    mode: normalizeMode(v99?.["mode"]),
    environmentMode: normalizeEnvironmentMode(v99?.["environmentMode"]),
    viewport: {
      activeView:
        normalizeActiveView(v99?.["viewport"]?.["activeView"]) === "camera" &&
        v138
          ? "camera"
          : "default",
      activeCameraId: v138 ? v137 : null,
      sceneView: v101,
      panoramaView: v102,
    },
    panorama: {
      localPath: v99?.["panorama"]?.["localPath"]
        ? String(v99["panorama"]["localPath"])["trim"]()
        : null,
      imageUrl: v99?.["panorama"]?.["imageUrl"]
        ? String(v99["panorama"]["imageUrl"])["trim"]()
        : null,
      fileName: v99?.["panorama"]?.["fileName"]
        ? String(v99["panorama"]["fileName"])["trim"]()
        : null,
      sourceSignature: v99?.["panorama"]?.["sourceSignature"]
        ? String(v99["panorama"]["sourceSignature"])["trim"]()
        : null,
      isLoaded: v99?.["panorama"]?.["isLoaded"] === true,
      error: v99?.["panorama"]?.["error"]
        ? String(v99["panorama"]["error"])
        : null,
    },
    mannequins: v103,
    cubes: v110,
    cameras: v117,
    selection: {
      selectedObjectType: v171,
      selectedObjectId: v172,
      selectedObjectIds: v173,
      selectedObjects: v167,
      selectedGroupId: v163,
    },
    groups: v129,
    gridPlacement: {
      rows: Math["max"](
        1,
        Math["min"](
          12,
          Math["round"](
            toFiniteNumber(
              v99?.["gridPlacement"]?.["rows"],
              v100["gridPlacement"]["rows"],
            ),
          ),
        ),
      ),
      cols: Math["max"](
        1,
        Math["min"](
          12,
          Math["round"](
            toFiniteNumber(
              v99?.["gridPlacement"]?.["cols"],
              v100["gridPlacement"]["cols"],
            ),
          ),
        ),
      ),
      spacingX: Math["max"](
        0.5,
        Math["min"](
          8,
          toFiniteNumber(
            v99?.["gridPlacement"]?.["spacingX"],
            v100["gridPlacement"]["spacingX"],
          ),
        ),
      ),
      spacingZ: Math["max"](
        0.5,
        Math["min"](
          8,
          toFiniteNumber(
            v99?.["gridPlacement"]?.["spacingZ"],
            v100["gridPlacement"]["spacingZ"],
          ),
        ),
      ),
      gender: normalizeGender(v99?.["gridPlacement"]?.["gender"]),
      colorKey: normalizeColorKey(
        v99?.["gridPlacement"]?.["colorKey"] ||
          v99?.["gridPlacement"]?.["color"],
      ),
    },
    capture: {
      pending: v99?.["capture"]?.["pending"] === true,
      lastCaptureAt:
        v99?.["capture"]?.["lastCaptureAt"] == null
          ? null
          : toFiniteNumber(v99["capture"]["lastCaptureAt"], null),
      error: v99?.["capture"]?.["error"]
        ? String(v99["capture"]["error"])
        : null,
      mode: normalizeCaptureMode(v99?.["capture"]?.["mode"]),
      showSafeFrame: v99?.["capture"]?.["showSafeFrame"] === true,
    },
    ui: {
      mouseTool: v191,
      transformTool: v192,
      activeTool: v190,
      transformSpace: normalizeTransformSpace(v99?.["ui"]?.["transformSpace"]),
      pivotMode: normalizePivotMode(v99?.["ui"]?.["pivotMode"]),
      navigationPreset: normalizeNavigationPreset(
        v99?.["ui"]?.["navigationPreset"],
      ),
      showCameraList: v99?.["ui"]?.["showCameraList"] === true,
      isEditing: v99?.["ui"]?.["isEditing"] === true,
    },
  };
}
export function normalizeSceneOnlyPanoramaSceneState(v193) {
  const v194 = normalizePanoramaSceneState(v193),
    v195 =
      String(v194?.["viewport"]?.["activeCameraId"] || "")["trim"]() || null,
    v196 = v195
      ? Array["isArray"](v194["cameras"]) &&
        v194["cameras"]["some"]((v197) => v197["id"] === v195)
      : false;
  return {
    ...v194,
    mode: "scene",
    viewport: {
      ...v194["viewport"],
      activeView:
        v194["viewport"]?.["activeView"] === "camera" && v196
          ? "camera"
          : "default",
      activeCameraId: v196 ? v195 : null,
    },
  };
}
export function normalizePanorama360State(v198) {
  const v199 = normalizePanoramaSceneState(v198),
    v200 = new Set(
      (Array["isArray"](v199["mannequins"]) ? v199["mannequins"] : [])
        ["map"]((v201) => String(v201?.["id"] || "")["trim"]())
        ["filter"](Boolean),
    ),
    v202 = Array["isArray"](v199["groups"]) ? v199["groups"] : [];
  let v203 = (
    Array["isArray"](v199["selection"]?.["selectedObjects"])
      ? v199["selection"]["selectedObjects"]
      : []
  )
    ["map"]((v204) => ({
      objectType: String(v204?.["objectType"] || "")["trim"](),
      objectId: String(v204?.["objectId"] || "")["trim"](),
    }))
    ["filter"](
      (v205) =>
        v205["objectType"] === "mannequin" && v200["has"](v205["objectId"]),
    );
  const v206 = String(v199["selection"]?.["selectedGroupId"] || "")["trim"](),
    v207 =
      v206 && v202["length"] > 0
        ? v202["find"](
            (v208) => String(v208?.["id"] || "")["trim"]() === v206,
          ) || null
        : null;
  let v209 = null;
  v207 &&
    ((v209 = v207["id"]),
    (v203 = v207["memberIds"]
      ["map"]((v210) => String(v210 || "")["trim"]())
      ["filter"]((v211) => v200["has"](v211))
      ["map"]((v212) => ({ objectType: "mannequin", objectId: v212 }))));
  if (v203["length"] === 0) {
    const v213 = String(v199["selection"]?.["selectedObjectId"] || "")[
      "trim"
    ]();
    String(v199["selection"]?.["selectedObjectType"] || "")["trim"]() ===
      "mannequin" &&
      v213 &&
      v200["has"](v213) &&
      (v203 = [{ objectType: "mannequin", objectId: v213 }]);
  }
  const v214 = new Set();
  v203 = v203["filter"]((v215) => {
    const v216 = v215["objectType"] + ":" + v215["objectId"];
    if (v214["has"](v216)) return false;
    return (v214["add"](v216), true);
  });
  const v217 = v203["map"]((v218) => v218["objectId"]),
    v219 = String(v199["selection"]?.["selectedObjectId"] || "")["trim"](),
    v220 = v219 && v217["includes"](v219) ? v219 : v217[0] || null;
  return {
    ...v199,
    mode: "panorama",
    cubes: [],
    cameras: [],
    viewport: {
      ...v199["viewport"],
      activeView: "default",
      activeCameraId: null,
    },
    selection: {
      selectedObjectType: v220 ? "mannequin" : null,
      selectedObjectId: v220,
      selectedObjectIds: v217,
      selectedObjects: v203,
      selectedGroupId: v209 && v203["length"] > 0 ? v209 : null,
    },
    ui: { ...v199["ui"], showCameraList: false },
  };
}
export function createPanoramaSceneNodeData({
  id: v221,
  x: x = 0,
  y: y = 0,
  width: width = PANORAMA_SCENE_DEFAULT_SIZE["width"],
  height: height = PANORAMA_SCENE_DEFAULT_SIZE["height"],
  name: name = PANORAMA_SCENE_DEFAULT_NAME,
} = {}) {
  return {
    id: v221,
    type: PANORAMA_SCENE_NODE_TYPE,
    x: x,
    y: y,
    width: width,
    height: height,
    name: name,
    sceneNode: createDefaultPanoramaSceneState(),
  };
}
export function createPanorama360NodeData({
  id: v222,
  x: x = 0,
  y: y = 0,
  width: width = PANORAMA_SCENE_DEFAULT_SIZE["width"],
  height: height = PANORAMA_SCENE_DEFAULT_SIZE["height"],
  name: name = PANORAMA_360_DEFAULT_NAME,
} = {}) {
  return {
    id: v222,
    type: PANORAMA_360_NODE_TYPE,
    x: x,
    y: y,
    width: width,
    height: height,
    name: name,
    panorama360Node: createDefaultPanorama360State(),
  };
}
export {
  PANORAMA_SCENE_NODE_TYPE,
  PANORAMA_SCENE_NODE_ALIASES,
  PANORAMA_360_NODE_TYPE,
  PANORAMA_360_NODE_ALIASES,
  PANORAMA_SCENE_CAMERA_LIMIT,
  PANORAMA_SCENE_DEFAULT_SIZE,
  PANORAMA_SCENE_COLLAPSED_MAX_SIZE,
  PANORAMA_SCENE_DEFAULT_NAME,
  PANORAMA_360_DEFAULT_NAME,
  PANORAMA_SCENE_COLOR_TOKENS,
};
