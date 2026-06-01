import appStore from "../../core/stores/appStore.js";
import { findAvailablePosition, generateId } from "../../core/math.js";
import {
  clampPanoramaPitch,
  SCENE_DEFAULT_FOCAL_LENGTH_MM,
  cameraPoseToPanoramaView,
  cameraPoseToSceneViewFromReference,
  clampSceneFocalLength,
  computeGridPlacement,
  resolveBatchPlacementOrigin,
  resolveObjectPlacementPoint,
} from "../../core/panoramaSceneMath.js";
import { buildSourceMediaNodePayload } from "../../services/fileService.js";
import { resolveOutputMediaSize } from "../../services/mediaRatioService.js";
import { ensurePersistedPanoramaInputPng } from "../../services/panoramaInputImageService.js";
import { uploadFile, saveOutputBlob } from "../../services/projectService.js";
import {
  showError,
  showSuccess,
  showWarning,
} from "../../services/toastService.js";
import {
  localPathToUrl,
  normalizeLocalPath,
  pickResultLocalPath,
} from "../../utils/localMediaPath.js";
import { commit } from "../history.js";
import { calcSafeSpawnPosNearNode } from "../nodeSpawn.js";
import {
  PANORAMA_SCENE_CAMERA_LIMIT,
  PANORAMA_SCENE_COLLAPSED_MAX_SIZE,
  PANORAMA_SCENE_DEFAULT_SIZE,
  createDefaultPanoramaView,
  createDefaultSceneView,
  getPanoramaStateFieldByNodeType,
  isPanorama360NodeType,
  normalizePanorama360State,
  normalizePanoramaSceneState,
  normalizeSceneOnlyPanoramaSceneState,
} from "./sceneNode.js";
function getStoreNode(v0, v1) {
  return v0?.["getStateRaw"]?.()["nodes"]?.[v1] || null;
}
function normalizeSceneStateByNode(v2, v3) {
  if (isPanorama360NodeType(v2?.["type"])) return normalizePanorama360State(v3);
  return normalizeSceneOnlyPanoramaSceneState(v3);
}
const EQUIRECTANGULAR_RATIO = 2,
  EQUIRECTANGULAR_RATIO_TOLERANCE = 0.02,
  MANNEQUIN_FORWARD_PLACEMENT_DISTANCE = 3.2,
  CUBE_FORWARD_PLACEMENT_DISTANCE = 3,
  _panorama360SyncVersionByNodeId = new Map(),
  _panorama360SyncInflightByNodeId = new Map();
function isNearEquirectangularRatio(v4) {
  const v5 = Number(v4?.["width"]),
    v6 = Number(v4?.["height"]);
  if (!Number["isFinite"](v5) || !Number["isFinite"](v6) || v5 <= 0 || v6 <= 0)
    return true;
  const v7 = v5 / v6;
  return (
    Math["abs"](v7 - EQUIRECTANGULAR_RATIO) <= EQUIRECTANGULAR_RATIO_TOLERANCE
  );
}
function getSceneState(v8, v9) {
  const v10 = getStoreNode(v8, v9);
  if (!v10) return normalizeSceneOnlyPanoramaSceneState(null);
  const v11 = getPanoramaStateFieldByNodeType(v10["type"]);
  return normalizeSceneStateByNode(v10, v11 ? v10[v11] : null);
}
function writeSceneState(v12, v13, v14) {
  const v15 = getStoreNode(v12, v13);
  if (!v15) return null;
  const v16 = getPanoramaStateFieldByNodeType(v15["type"]);
  if (!v16) return null;
  const v17 = normalizeSceneStateByNode(v15, v15[v16]),
    v18 = typeof v14 === "function" ? v14(v17, v15) : v14;
  if (!v18) return v17;
  const v19 = normalizeSceneStateByNode(v15, v18);
  return (v12["updateNodeData"](v13, { [v16]: v19 }), v19);
}
function cloneSceneState(v20) {
  return normalizePanoramaSceneState(v20);
}
function pickViewYaw(v21) {
  if (Number["isFinite"](v21?.["yaw"])) return v21["yaw"];
  if (Number["isFinite"](v21?.["rotation"]?.["y"])) return v21["rotation"]["y"];
  return 0;
}
function pickFacingCameraYaw(v22) {
  const v23 = pickViewYaw(v22) + Math["PI"];
  return Math["atan2"](Math["sin"](v23), Math["cos"](v23));
}
function sanitizeObjectPose(v24 = {}) {
  const v25 = {
      x: Number["isFinite"](v24?.["rotation"]?.["x"])
        ? v24["rotation"]["x"]
        : 0,
      y: Number["isFinite"](v24?.["rotation"]?.["y"])
        ? v24["rotation"]["y"]
        : 0,
      z: Number["isFinite"](v24?.["rotation"]?.["z"])
        ? v24["rotation"]["z"]
        : 0,
    },
    v26 =
      Number["isFinite"](Number(v24?.["quaternion"]?.["x"])) &&
      Number["isFinite"](Number(v24?.["quaternion"]?.["y"])) &&
      Number["isFinite"](Number(v24?.["quaternion"]?.["z"])) &&
      Number["isFinite"](Number(v24?.["quaternion"]?.["w"])),
    v27 = v26
      ? normalizeQuaternion(v24["quaternion"], quaternionFromEulerXYZ(v25))
      : null,
    v28 = v26 ? eulerFromQuaternionXYZ(v27) : v25,
    v29 = Number["isFinite"](v24?.["scale"])
      ? Math["max"](0.01, Number(v24["scale"]) || 1)
      : v24?.["scale"] &&
          Number["isFinite"](v24["scale"]["x"]) &&
          Number["isFinite"](v24["scale"]["y"]) &&
          Number["isFinite"](v24["scale"]["z"])
        ? {
            x: Math["max"](0.01, Number(v24["scale"]["x"]) || 1),
            y: Math["max"](0.01, Number(v24["scale"]["y"]) || 1),
            z: Math["max"](0.01, Number(v24["scale"]["z"]) || 1),
          }
        : null;
  return {
    position: {
      x: Number["isFinite"](v24?.["position"]?.["x"])
        ? v24["position"]["x"]
        : 0,
      y: Number["isFinite"](v24?.["position"]?.["y"])
        ? v24["position"]["y"]
        : 0,
      z: Number["isFinite"](v24?.["position"]?.["z"])
        ? v24["position"]["z"]
        : 0,
    },
    rotation: v28,
    quaternion: v27,
    fov: Number["isFinite"](v24?.["fov"]) ? v24["fov"] : 58,
    scale: v29,
  };
}
function normalizeQuaternion(v30, v31 = { x: 0, y: 0, z: 0, w: 1 }) {
  const v32 = Number(v30?.["x"]),
    v33 = Number(v30?.["y"]),
    v34 = Number(v30?.["z"]),
    v35 = Number(v30?.["w"]);
  if (
    !Number["isFinite"](v32) ||
    !Number["isFinite"](v33) ||
    !Number["isFinite"](v34) ||
    !Number["isFinite"](v35)
  )
    return { ...v31 };
  const v36 = Math["hypot"](v32, v33, v34, v35);
  if (v36 < 0.000001) return { ...v31 };
  return { x: v32 / v36, y: v33 / v36, z: v34 / v36, w: v35 / v36 };
}
function quaternionFromEulerYXZ(v37) {
  const v38 = Number(v37?.["x"]) || 0,
    v39 = Number(v37?.["y"]) || 0,
    v40 = Number(v37?.["z"]) || 0,
    v41 = Math["cos"](v38 / 2),
    v42 = Math["cos"](v39 / 2),
    v43 = Math["cos"](v40 / 2),
    v44 = Math["sin"](v38 / 2),
    v45 = Math["sin"](v39 / 2),
    v46 = Math["sin"](v40 / 2);
  return normalizeQuaternion({
    x: v44 * v42 * v43 + v41 * v45 * v46,
    y: v41 * v45 * v43 - v44 * v42 * v46,
    z: v41 * v42 * v46 - v44 * v45 * v43,
    w: v41 * v42 * v43 + v44 * v45 * v46,
  });
}
function eulerFromQuaternionYXZ(v47) {
  const v48 = normalizeQuaternion(v47),
    v49 = v48["x"] * v48["x"],
    v50 = v48["y"] * v48["y"],
    v51 = v48["z"] * v48["z"],
    v52 = v48["x"] * v48["y"],
    v53 = v48["x"] * v48["z"],
    v54 = v48["y"] * v48["z"],
    v55 = v48["x"] * v48["w"],
    v56 = v48["y"] * v48["w"],
    v57 = v48["z"] * v48["w"],
    v58 = 1 - 2 * (v50 + v51),
    v59 = 2 * (v53 + v56),
    v60 = 2 * (v52 + v57),
    v61 = 1 - 2 * (v49 + v51),
    v62 = 2 * (v54 - v55),
    v63 = 2 * (v53 - v56),
    v64 = 1 - 2 * (v49 + v50),
    v65 = Math["asin"](-clamp(v62, -1, 1));
  if (Math["abs"](v62) < 0.9999999)
    return { x: v65, y: Math["atan2"](v59, v64), z: Math["atan2"](v60, v61) };
  return { x: v65, y: Math["atan2"](-v63, v58), z: 0 };
}
function quaternionFromEulerXYZ(v66) {
  const v67 = Number(v66?.["x"]) || 0,
    v68 = Number(v66?.["y"]) || 0,
    v69 = Number(v66?.["z"]) || 0,
    v70 = Math["cos"](v67 / 2),
    v71 = Math["cos"](v68 / 2),
    v72 = Math["cos"](v69 / 2),
    v73 = Math["sin"](v67 / 2),
    v74 = Math["sin"](v68 / 2),
    v75 = Math["sin"](v69 / 2);
  return normalizeQuaternion({
    x: v73 * v71 * v72 + v70 * v74 * v75,
    y: v70 * v74 * v72 - v73 * v71 * v75,
    z: v70 * v71 * v75 + v73 * v74 * v72,
    w: v70 * v71 * v72 - v73 * v74 * v75,
  });
}
function eulerFromQuaternionXYZ(v76) {
  const v77 = normalizeQuaternion(v76),
    v78 = v77["x"] * v77["x"],
    v79 = v77["y"] * v77["y"],
    v80 = v77["z"] * v77["z"],
    v81 = v77["x"] * v77["y"],
    v82 = v77["x"] * v77["z"],
    v83 = v77["y"] * v77["z"],
    v84 = v77["x"] * v77["w"],
    v85 = v77["y"] * v77["w"],
    v86 = v77["z"] * v77["w"],
    v87 = 1 - 2 * (v79 + v80),
    v88 = 2 * (v81 - v86),
    v89 = 2 * (v82 + v85),
    v90 = 2 * (v83 - v84),
    v91 = 1 - 2 * (v78 + v79),
    v92 = 2 * (v83 + v84),
    v93 = 1 - 2 * (v78 + v80),
    v94 = Math["asin"](clamp(v89, -1, 1));
  if (Math["abs"](v89) < 0.9999999)
    return { x: Math["atan2"](-v90, v91), y: v94, z: Math["atan2"](-v88, v87) };
  return { x: Math["atan2"](v92, v93), y: v94, z: 0 };
}
function sanitizeCameraPose(v95 = {}) {
  const v96 = {
      x: Number["isFinite"](v95?.["position"]?.["x"])
        ? v95["position"]["x"]
        : 0,
      y: Number["isFinite"](v95?.["position"]?.["y"])
        ? v95["position"]["y"]
        : 0,
      z: Number["isFinite"](v95?.["position"]?.["z"])
        ? v95["position"]["z"]
        : 0,
    },
    v97 = {
      x: Number["isFinite"](v95?.["rotation"]?.["x"])
        ? v95["rotation"]["x"]
        : 0,
      y: Number["isFinite"](v95?.["rotation"]?.["y"])
        ? v95["rotation"]["y"]
        : 0,
      z: Number["isFinite"](v95?.["rotation"]?.["z"])
        ? v95["rotation"]["z"]
        : 0,
    },
    v98 =
      Number["isFinite"](Number(v95?.["quaternion"]?.["x"])) &&
      Number["isFinite"](Number(v95?.["quaternion"]?.["y"])) &&
      Number["isFinite"](Number(v95?.["quaternion"]?.["z"])) &&
      Number["isFinite"](Number(v95?.["quaternion"]?.["w"])),
    v99 = v98
      ? normalizeQuaternion(v95["quaternion"], quaternionFromEulerYXZ(v97))
      : quaternionFromEulerYXZ(v97),
    v100 = v98 ? eulerFromQuaternionYXZ(v99) : v97;
  return {
    position: v96,
    rotation: v100,
    quaternion: v99,
    focalLength: Object["prototype"]["hasOwnProperty"]["call"](
      v95 || {},
      "focalLength",
    )
      ? clampSceneFocalLength(v95["focalLength"])
      : Object["prototype"]["hasOwnProperty"]["call"](v95 || {}, "fov")
        ? SCENE_DEFAULT_FOCAL_LENGTH_MM
        : SCENE_DEFAULT_FOCAL_LENGTH_MM,
  };
}
function normalizeCameraSlot(v101) {
  const v102 = Number(v101);
  if (!Number["isInteger"](v102)) return null;
  if (v102 < 1 || v102 > PANORAMA_SCENE_CAMERA_LIMIT) return null;
  return v102;
}
function toCameraSlotLabel(v103) {
  return String(Number(v103) || 1);
}
function resolveCameraSlotEntries(v104 = []) {
  const v105 = Array["isArray"](v104) ? v104 : [],
    v106 = new Set(),
    v107 = [];
  v105["forEach"]((v108) => {
    const v109 = normalizeCameraSlot(v108?.["slot"]);
    if (!v109 || v106["has"](v109)) return;
    (v106["add"](v109), v107["push"]({ camera: v108, slot: v109 }));
  });
  const v110 = () => {
    for (let v111 = 1; v111 <= PANORAMA_SCENE_CAMERA_LIMIT; v111 += 1) {
      if (!v106["has"](v111)) return (v106["add"](v111), v111);
    }
    return null;
  };
  return (
    v105["forEach"]((v112) => {
      if (v107["some"]((v113) => v113["camera"]?.["id"] === v112?.["id"]))
        return;
      const v114 = v110();
      if (!v114) return;
      v107["push"]({ camera: v112, slot: v114 });
    }),
    v107["sort"]((v115, v116) => v115["slot"] - v116["slot"])
  );
}
function resolveFirstFreeCameraSlot(v117 = []) {
  const v118 = new Set(
    resolveCameraSlotEntries(v117)["map"]((v119) => v119["slot"]),
  );
  for (let v120 = 1; v120 <= PANORAMA_SCENE_CAMERA_LIMIT; v120 += 1) {
    if (!v118["has"](v120)) return v120;
  }
  return null;
}
function resolveCameraBySlot(v121 = [], v122) {
  const v123 = normalizeCameraSlot(v122);
  if (!v123) return null;
  const v124 = resolveCameraSlotEntries(v121)["find"](
    (v125) => v125["slot"] === v123,
  );
  return v124 ? { camera: v124["camera"], slot: v124["slot"] } : null;
}
function normalizeScaleVector(v126, v127 = 1) {
  if (Number["isFinite"](v126)) {
    const v128 = Math["max"](0.01, Number(v126) || Number(v127) || 1);
    return { x: v128, y: v128, z: v128 };
  }
  if (
    v126 &&
    Number["isFinite"](v126["x"]) &&
    Number["isFinite"](v126["y"]) &&
    Number["isFinite"](v126["z"])
  )
    return {
      x: Math["max"](0.01, Number(v126["x"]) || 1),
      y: Math["max"](0.01, Number(v126["y"]) || 1),
      z: Math["max"](0.01, Number(v126["z"]) || 1),
    };
  const v129 = Math["max"](0.01, Number(v127) || 1);
  return { x: v129, y: v129, z: v129 };
}
function composeCompatibleScale(v130, v131 = 1) {
  if (v130 == null) return v131;
  if (Number["isFinite"](v130))
    return Math["max"](0.01, Math["min"](8, Number(v130) || 1));
  const v132 = normalizeScaleVector(v130, v131),
    v133 = 0.0001;
  if (
    Math["abs"](v132["x"] - v132["y"]) < v133 &&
    Math["abs"](v132["y"] - v132["z"]) < v133
  )
    return Math["max"](
      0.01,
      Math["min"](8, (v132["x"] + v132["y"] + v132["z"]) / 3),
    );
  return {
    x: Math["max"](0.01, Math["min"](8, v132["x"])),
    y: Math["max"](0.01, Math["min"](8, v132["y"])),
    z: Math["max"](0.01, Math["min"](8, v132["z"])),
  };
}
function clamp(v134, v135, v136) {
  return Math["min"](v136, Math["max"](v135, v134));
}
function computeCollapsedDimensions(v137, v138) {
  const v139 = Math["max"](
      180,
      Number(v137) || PANORAMA_SCENE_DEFAULT_SIZE["width"],
    ),
    v140 = Math["max"](
      140,
      Number(v138) || PANORAMA_SCENE_DEFAULT_SIZE["height"],
    ),
    v141 = Math["min"](v139, v140),
    v142 =
      v141 > PANORAMA_SCENE_COLLAPSED_MAX_SIZE
        ? PANORAMA_SCENE_COLLAPSED_MAX_SIZE / v141
        : 1;
  return {
    width: Math["round"](v139 * v142),
    height: Math["round"](v140 * v142),
  };
}
function getSelectedObject(v143) {
  const { selectedObjectType: v144, selectedObjectId: v145 } =
    v143?.["selection"] || {};
  if (!v144 || !v145) return null;
  const v146 = getSceneObjectList(v143, v144),
    v147 = v146["find"]((v148) => v148["id"] === v145) || null;
  if (!v147) return null;
  return { objectType: v144, item: v147 };
}
function getSceneObjectList(v149, v150) {
  if (v150 === "camera")
    return Array["isArray"](v149?.["cameras"]) ? v149["cameras"] : [];
  if (v150 === "cube")
    return Array["isArray"](v149?.["cubes"]) ? v149["cubes"] : [];
  return Array["isArray"](v149?.["mannequins"]) ? v149["mannequins"] : [];
}
function getSceneObjectHeightOffset(v151) {
  if (v151 === "cube") return 0;
  if (v151 === "mannequin") return 1.1;
  return 0;
}
function getSelectionPoolByType(v152, v153) {
  if (v153 === "cube")
    return Array["isArray"](v152?.["cubes"]) ? v152["cubes"] : [];
  if (v153 === "mannequin")
    return Array["isArray"](v152?.["mannequins"]) ? v152["mannequins"] : [];
  return [];
}
function normalizeSelectionObjectsInput(v154, v155 = []) {
  const v156 = new Set(),
    v157 = [],
    v158 = Array["isArray"](v155) ? v155 : [];
  return (
    v158["forEach"]((v159) => {
      const v160 =
          v159?.["objectType"] === "cube" ||
          v159?.["objectType"] === "mannequin"
            ? v159["objectType"]
            : null,
        v161 = String(v159?.["objectId"] || "")["trim"]();
      if (!v160 || !v161) return;
      const v162 = getSelectionPoolByType(v154, v160)["some"](
        (v163) => v163["id"] === v161,
      );
      if (!v162) return;
      const v164 = v160 + ":" + v161;
      if (v156["has"](v164)) return;
      (v156["add"](v164), v157["push"]({ objectType: v160, objectId: v161 }));
    }),
    v157
  );
}
function collectSelectionObjects(v165) {
  const v166 = normalizeSelectionObjectsInput(
    v165,
    v165?.["selection"]?.["selectedObjects"] || [],
  );
  if (v166["length"] > 0) return v166;
  const v167 =
    v165?.["selection"]?.["selectedObjectType"] === "cube" ||
    v165?.["selection"]?.["selectedObjectType"] === "mannequin"
      ? v165["selection"]["selectedObjectType"]
      : null;
  if (!v167) return [];
  const v168 = Array["isArray"](v165?.["selection"]?.["selectedObjectIds"])
    ? v165["selection"]["selectedObjectIds"]
    : v165?.["selection"]?.["selectedObjectId"]
      ? [v165["selection"]["selectedObjectId"]]
      : [];
  return normalizeSelectionObjectsInput(
    v165,
    v168["map"]((v169) => ({ objectType: v167, objectId: v169 })),
  );
}
function clearSelection(v170) {
  ((v170["selection"]["selectedObjectType"] = null),
    (v170["selection"]["selectedObjectId"] = null),
    (v170["selection"]["selectedObjectIds"] = []),
    (v170["selection"]["selectedObjects"] = []),
    (v170["selection"]["selectedGroupId"] = null));
}
function setSelectionFromObjects(
  v171,
  v172,
  {
    preferredGroupId: preferredGroupId = null,
    preferredActiveType: preferredActiveType = null,
    preferredActiveId: preferredActiveId = null,
  } = {},
) {
  const v173 = normalizeSelectionObjectsInput(v171, v172);
  if (v173["length"] === 0) {
    clearSelection(v171);
    return;
  }
  const v174 = preferredGroupId ? String(preferredGroupId) : null;
  if (v174) {
    const v175 = (v171["groups"] || [])["find"]((v176) => v176["id"] === v174);
    if (v175) {
      const v177 = v173["filter"]((v178) => v178["objectType"] === "mannequin")[
          "map"
        ]((v179) => v179["objectId"]),
        v180 = new Set(v177),
        v181 =
          v173["every"]((v182) => v182["objectType"] === "mannequin") &&
          v175["memberIds"]["length"] > 0 &&
          v175["memberIds"]["length"] === v177["length"] &&
          v175["memberIds"]["every"]((v183) => v180["has"](v183));
      if (v181) {
        ((v171["selection"]["selectedObjectType"] = "mannequin"),
          (v171["selection"]["selectedObjectId"] =
            v175["memberIds"][0] || null),
          (v171["selection"]["selectedObjectIds"] = [...v175["memberIds"]]),
          (v171["selection"]["selectedObjects"] = v175["memberIds"]["map"](
            (v184) => ({ objectType: "mannequin", objectId: v184 }),
          )),
          (v171["selection"]["selectedGroupId"] = v174));
        return;
      }
    }
  }
  const v185 =
      preferredActiveType === "cube" || preferredActiveType === "mannequin"
        ? preferredActiveType
        : null,
    v186 =
      v185 && v173["some"]((v187) => v187["objectType"] === v185)
        ? v185
        : v173[0]["objectType"],
    v188 = v173["filter"]((v189) => v189["objectType"] === v186)["map"](
      (v190) => v190["objectId"],
    ),
    v191 =
      preferredActiveId &&
      v173["some"](
        (v192) =>
          v192["objectType"] === v186 && v192["objectId"] === preferredActiveId,
      )
        ? preferredActiveId
        : v188[0] || null;
  ((v171["selection"]["selectedObjectType"] = v186),
    (v171["selection"]["selectedObjectId"] = v191),
    (v171["selection"]["selectedObjectIds"] = v188),
    (v171["selection"]["selectedObjects"] = v173),
    (v171["selection"]["selectedGroupId"] = null));
}
function setSingleSelection(v193, v194, v195) {
  setSelectionFromObjects(
    v193,
    v194 && v195 ? [{ objectType: v194, objectId: v195 }] : [],
    { preferredActiveType: v194, preferredActiveId: v195 || null },
  );
}
function finalizeSelectedObjectRemoval(v196, v197, v198) {
  const v199 = cloneSceneState(v196),
    v200 = collectSelectionObjects(v199)["filter"](
      (v201) => !(v201["objectType"] === v197 && v201["objectId"] === v198),
    );
  return (
    setSelectionFromObjects(v199, v200, {
      preferredActiveType: v199?.["selection"]?.["selectedObjectType"] || null,
      preferredActiveId: v199?.["selection"]?.["selectedObjectId"] || null,
      preferredGroupId: v199?.["selection"]?.["selectedGroupId"] || null,
    }),
    v197 === "camera" &&
      v199["viewport"]["activeCameraId"] === v198 &&
      ((v199["viewport"]["activeCameraId"] = null),
      (v199["viewport"]["activeView"] = "default")),
    v199
  );
}
function pruneGroups(v202, v203 = []) {
  if (!Array["isArray"](v202)) return [];
  if (!Array["isArray"](v203) || v203["length"] === 0) return v202;
  const v204 = new Set(v203);
  return v202["map"]((v205) => ({
    ...v205,
    memberIds: Array["isArray"](v205["memberIds"])
      ? v205["memberIds"]["filter"]((v206) => !v204["has"](v206))
      : [],
  }))["filter"]((v207) => v207["memberIds"]["length"] > 0);
}
function resolveGroupByMember(v208, v209, v210) {
  if (v209 !== "mannequin" || !v210) return null;
  const v211 = Array["isArray"](v208?.["groups"]) ? v208["groups"] : [];
  return v211["find"]((v212) => v212["memberIds"]?.["includes"](v210)) || null;
}
function createNodeActionContext(v213 = {}) {
  return {
    storeInstance: v213["storeInstance"] || appStore,
    getCurrentProjectId:
      v213["getCurrentProjectId"] ||
      (() => window["currentProjectId"] || "default_v2_project"),
  };
}
const DEFAULT_NODE_SPAWN_SPACING = 120,
  PANORAMA_360_IMAGE_SOURCE_TYPES = new Set([
    "source-image",
    "ai-image",
    "image",
  ]);
function resolveNodeSpawnSpacing() {
  const v214 = Number(globalThis?.["window"]?.["v2NodeSpacing"]);
  return Number["isFinite"](v214)
    ? Math["max"](0, v214)
    : DEFAULT_NODE_SPAWN_SPACING;
}
function shouldAvoidNodeOverlap() {
  return globalThis?.["window"]?.["v2NodeAvoidOverlap"] !== false;
}
function isPanorama360IncomingImageSourceType(v215) {
  return PANORAMA_360_IMAGE_SOURCE_TYPES["has"](String(v215 || "")["trim"]());
}
function pickFirstNonEmptyString(...v216) {
  for (const v217 of v216) {
    const v218 = String(v217 || "")["trim"]();
    if (v218) return v218;
  }
  return "";
}
function inferFileNameFromPath(v219) {
  const v220 = String(v219 || "")["trim"]();
  if (!v220) return "";
  const v221 = v220["split"]("?")[0]["split"]("#")[0],
    v222 = v221["split"](/[\\/]/)["filter"](Boolean);
  return v222["length"] > 0 ? v222[v222["length"] - 1] : "";
}
function resolveMainImageEntry(v223) {
  const v224 = Array["isArray"](v223?.["images"]) ? v223["images"] : [];
  if (v224["length"] <= 0) return null;
  const v225 = Number(v223?.["mainImageIndex"]),
    v226 = Number["isFinite"](v225)
      ? Math["max"](0, Math["min"](v224["length"] - 1, Math["trunc"](v225)))
      : 0;
  return v224[v226] || v224[0] || null;
}
function resolveMainImageIndex(v227) {
  const v228 = Array["isArray"](v227?.["images"]) ? v227["images"] : [];
  if (v228["length"] <= 0) return 0;
  const v229 = Number(v227?.["mainImageIndex"]);
  if (!Number["isFinite"](v229)) return 0;
  return Math["max"](0, Math["min"](v228["length"] - 1, Math["trunc"](v229)));
}
function resolvePanoramaImagePayloadFromSourceNode(v230) {
  if (!v230 || !isPanorama360IncomingImageSourceType(v230["type"])) return null;
  const v231 = resolveMainImageEntry(v230),
    v232 = pickFirstNonEmptyString(v231?.["localPath"], v230["localPath"]),
    v233 = pickFirstNonEmptyString(
      v231?.["imageUrl"],
      v231?.["src"],
      v231?.["sourceUrl"],
      v231?.["url"],
      v230["imageUrl"],
      v230["src"],
      v230["sourceUrl"],
      v230["thumbUrl"],
    );
  if (!v232 && !v233) return null;
  const v234 = pickFirstNonEmptyString(
    v231?.["fileName"],
    v230["fileName"],
    inferFileNameFromPath(v232),
    inferFileNameFromPath(v233),
  );
  return {
    localPath: v232 || null,
    imageUrl: v233 || null,
    fileName: v234 || null,
    mainImageIndex: resolveMainImageIndex(v230),
  };
}
function buildPanoramaSourceSignature(v235) {
  if (!v235 || typeof v235 !== "object") return "";
  return JSON["stringify"]({
    localPath: String(v235["localPath"] || "")["trim"](),
    imageUrl: String(v235["imageUrl"] || "")["trim"](),
    fileName: String(v235["fileName"] || "")["trim"](),
    mainImageIndex: Number(v235["mainImageIndex"] || 0) || 0,
  });
}
function hasPersistentPanoramaLocalPath(v236) {
  const v237 = String(v236 || "")["trim"]();
  if (!v237) return false;
  return !/^(blob:|data:|https?:)/i["test"](v237);
}
function bumpPanorama360SyncVersion(v238) {
  const v239 = String(v238 || "")["trim"](),
    v240 = Number(_panorama360SyncVersionByNodeId["get"](v239) || 0) + 1;
  return (_panorama360SyncVersionByNodeId["set"](v239, v240), v240);
}
function isPanorama360SyncCurrent(v241, v242) {
  return (
    Number(
      _panorama360SyncVersionByNodeId["get"](String(v241 || "")["trim"]()) || 0,
    ) === Number(v242 || 0)
  );
}
function getPanoramaIncomingEdgeSortValue(v243) {
  const v244 = Number(v243?.["createdAt"]);
  if (Number["isFinite"](v244) && v244 > 0) return v244;
  const v245 = Number(v243?.["updatedAt"]);
  if (Number["isFinite"](v245) && v245 > 0) return v245;
  return 0;
}
function comparePanoramaIncomingCandidatesDesc(v246, v247) {
  const v248 =
    getPanoramaIncomingEdgeSortValue(v247["edge"]) -
    getPanoramaIncomingEdgeSortValue(v246["edge"]);
  if (v248 !== 0) return v248;
  return String(v247["edge"]?.["id"] || "")["localeCompare"](
    String(v246["edge"]?.["id"] || ""),
  );
}
function buildPanoramaUploadSourceNodeData({
  storeInstance: v249,
  anchorNode: v250,
  localPath: v251,
  imageUrl: v252,
  fileName: v253,
  uploadedSize: v254,
}) {
  if (!v249 || !v250) return null;
  const v255 = Number(v254?.["width"]),
    v256 = Number(v254?.["height"]),
    v257 = buildSourceMediaNodePayload({
      id: "__seed__",
      type: "source-image",
      x: 0,
      y: 0,
      src: v252 || "",
      localPath: v251 || "",
      fileName: v253 || "",
      ...(v255 > 0 && v256 > 0
        ? { naturalWidth: v255, naturalHeight: v256 }
        : null),
    }),
    v258 = resolveNodeSpawnSpacing(),
    v259 = Number(v250["x"]) || 0,
    v260 = Number(v250["y"]) || 0,
    v261 = Number(v250["height"]) || v257["height"],
    v262 = v259 - v257["width"] - v258,
    v263 = v260 + Math["round"]((v261 - v257["height"]) / 2),
    v264 = v249["getStateRaw"]?.()["nodes"] || {},
    v265 = shouldAvoidNodeOverlap()
      ? findAvailablePosition(
          v264,
          v262,
          v263,
          v257["width"],
          v257["height"],
          v258,
          "left",
        )
      : { x: v262, y: v263 };
  return {
    ...v257,
    id: generateId("source-image"),
    x: v265["x"],
    y: v265["y"],
  };
}
export function setPanoramaSceneMode({
  nodeId: v266,
  mode: v267,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v266, (v268, v269) => {
    const v270 = cloneSceneState(v268);
    return (
      (v270["mode"] = isPanorama360NodeType(v269?.["type"])
        ? "panorama"
        : "scene"),
      (v270["viewport"]["activeView"] = "default"),
      (v270["viewport"]["activeCameraId"] = null),
      v270
    );
  });
}
export function setPanoramaSceneEnvironmentMode({
  nodeId: v271,
  environmentMode: v272,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v271, (v273) => {
    const v274 = cloneSceneState(v273);
    return (
      (v274["environmentMode"] = v272 === "night" ? "night" : "day"),
      v274
    );
  });
}
export function setPanoramaSceneTool({
  nodeId: v275,
  tool: v276,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v275, (v277) => {
    const v278 = cloneSceneState(v277),
      v279 =
        v276 === "move" ||
        v276 === "rotate" ||
        v276 === "scale" ||
        v276 === "box-select"
          ? v276
          : "navigate";
    return (
      v279 === "box-select" || v279 === "navigate"
        ? (v278["ui"]["mouseTool"] = v279)
        : (v278["ui"]["transformTool"] = v279),
      (v278["ui"]["activeTool"] = v279),
      v278
    );
  });
}
export function setPanoramaSceneTransformSpace({
  nodeId: v280,
  transformSpace: v281,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v280, (v282) => {
    const v283 = cloneSceneState(v282);
    return ((v283["ui"]["transformSpace"] = "local"), v283);
  });
}
export function setPanoramaScenePivotMode({
  nodeId: v284,
  pivotMode: v285,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v284, (v286) => {
    const v287 = cloneSceneState(v286);
    return ((v287["ui"]["pivotMode"] = "active"), v287);
  });
}
export function setPanoramaSceneNavigationPreset({
  nodeId: v288,
  navigationPreset: v289,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v288, (v290) => {
    const v291 = cloneSceneState(v290);
    return (
      (v291["ui"]["navigationPreset"] = v289 === "dcc" ? "dcc" : "dcc"),
      v291
    );
  });
}
export function setPanoramaSceneEditing({
  nodeId: v292,
  isEditing: v293,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v292, (v294) => {
    const v295 = cloneSceneState(v294);
    return (
      (v295["ui"]["isEditing"] = v293 === true),
      !v295["ui"]["isEditing"] && (v295["ui"]["showCameraList"] = false),
      v295
    );
  });
}
export function setPanoramaSceneSelection({
  nodeId: v296,
  objectType: v297,
  objectId: v298,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v296, (v299) => {
    const v300 = cloneSceneState(v299);
    if (v297 === "camera") return v300;
    const v301 = v297 === "mannequin" || v297 === "cube" ? v297 : null,
      v302 = v298 ? String(v298) : null;
    if (!v301 || !v302) return (clearSelection(v300), v300);
    const v303 = resolveGroupByMember(v300, v301, v302);
    if (v303)
      return (
        setSelectionFromObjects(
          v300,
          v303["memberIds"]["map"]((v304) => ({
            objectType: "mannequin",
            objectId: v304,
          })),
          {
            preferredGroupId: v303["id"],
            preferredActiveType: "mannequin",
            preferredActiveId: v302,
          },
        ),
        v300
      );
    return (
      setSelectionFromObjects(v300, [{ objectType: v301, objectId: v302 }], {
        preferredActiveType: v301,
        preferredActiveId: v302,
      }),
      v300
    );
  });
}
export function setPanoramaSceneSelectionBatch({
  nodeId: v305,
  objectType: v306,
  objectIds: objectIds = [],
  groupId: groupId = null,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v305, (v307) => {
    const v308 = cloneSceneState(v307);
    if (v306 === "camera") return v308;
    const v309 = v306 === "mannequin" || v306 === "cube" ? v306 : null,
      v310 = [
        ...new Set(
          (Array["isArray"](objectIds) ? objectIds : [])
            ["map"]((v311) => String(v311 || "")["trim"]())
            ["filter"](Boolean),
        ),
      ];
    if (!v309 || v310["length"] === 0) return (clearSelection(v308), v308);
    let v312 = groupId ? String(groupId) : null;
    if (v312) {
      const v313 = (v308["groups"] || [])["find"](
        (v314) => v314["id"] === v312,
      );
      if (!v313) v312 = null;
      else
        return (
          setSelectionFromObjects(
            v308,
            v313["memberIds"]["map"]((v315) => ({
              objectType: "mannequin",
              objectId: v315,
            })),
            {
              preferredGroupId: v312,
              preferredActiveType: "mannequin",
              preferredActiveId: v313["memberIds"][0] || null,
            },
          ),
          v308
        );
    }
    return (
      setSelectionFromObjects(
        v308,
        v310["map"]((v316) => ({ objectType: v309, objectId: v316 })),
        { preferredActiveType: v309, preferredActiveId: v310[0] || null },
      ),
      v308
    );
  });
}
export function setPanoramaSceneSelectionObjects({
  nodeId: v317,
  objects: objects = [],
  activeObjectType: activeObjectType = null,
  activeObjectId: activeObjectId = null,
  groupId: groupId = null,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v317, (v318) => {
    const v319 = cloneSceneState(v318);
    return (
      setSelectionFromObjects(v319, objects, {
        preferredGroupId: groupId,
        preferredActiveType: activeObjectType,
        preferredActiveId: activeObjectId,
      }),
      v319
    );
  });
}
export function clearPanoramaSceneSelection({
  nodeId: v320,
  storeInstance: storeInstance = appStore,
}) {
  setPanoramaSceneSelection({
    nodeId: v320,
    objectType: null,
    objectId: null,
    storeInstance: storeInstance,
  });
}
export function setPanoramaSceneCameraListVisible({
  nodeId: v321,
  visible: v322,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v321, (v323) => {
    const v324 = cloneSceneState(v323);
    return ((v324["ui"]["showCameraList"] = v322 === true), v324);
  });
}
export function setPanoramaSceneGridPlacement({
  nodeId: v325,
  patch: v326,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v325, (v327) => {
    const v328 = cloneSceneState(v327);
    return (
      (v328["gridPlacement"] = { ...v328["gridPlacement"], ...(v326 || {}) }),
      normalizePanoramaSceneState(v328)
    );
  });
}
export function resetPanoramaSceneView({
  nodeId: v329,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v329, (v330) => {
    const v331 = cloneSceneState(v330);
    return (
      (v331["viewport"]["activeView"] = "default"),
      (v331["viewport"]["activeCameraId"] = null),
      v331["mode"] === "panorama"
        ? (v331["viewport"]["panoramaView"] = createDefaultPanoramaView())
        : (v331["viewport"]["sceneView"] = createDefaultSceneView()),
      v331
    );
  });
}
export function applyPanoramaSceneViewCommit({
  nodeId: v332,
  sceneView: v333,
  panoramaView: v334,
  activeView: activeView = "default",
  activeCameraId: activeCameraId = null,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v332, (v335) => {
    const v336 = cloneSceneState(v335);
    return (
      (v336["viewport"]["activeView"] =
        activeView === "camera" ? "camera" : "default"),
      (v336["viewport"]["activeCameraId"] =
        v336["viewport"]["activeView"] === "camera" && activeCameraId
          ? String(activeCameraId)
          : null),
      v333 &&
        (v336["viewport"]["sceneView"] = {
          ...v336["viewport"]["sceneView"],
          ...v333,
        }),
      v334 &&
        (v336["viewport"]["panoramaView"] = {
          ...v336["viewport"]["panoramaView"],
          ...v334,
        }),
      normalizePanoramaSceneState(v336)
    );
  });
}
export function activatePanoramaSceneCamera({
  nodeId: v337,
  cameraId: v338,
  storeInstance: storeInstance = appStore,
}) {
  const v339 = getStoreNode(storeInstance, v337);
  if (isPanorama360NodeType(v339?.["type"])) return;
  writeSceneState(storeInstance, v337, (v340) => {
    const v341 = cloneSceneState(v340),
      v342 = v341["cameras"]["find"]((v343) => v343["id"] === v338) || null;
    if (!v342) return v341;
    return (
      v341["mode"] === "panorama"
        ? ((v341["viewport"]["activeView"] = "camera"),
          (v341["viewport"]["activeCameraId"] = String(v338)),
          (v341["viewport"]["panoramaView"] = cameraPoseToPanoramaView(v342)))
        : ((v341["viewport"]["activeView"] = "default"),
          (v341["viewport"]["activeCameraId"] = null),
          (v341["viewport"]["sceneView"] = cameraPoseToSceneViewFromReference(
            v342,
            v341["viewport"]["sceneView"] || createDefaultSceneView(),
          ))),
      v341
    );
  });
}
export function setPanoramaSceneCaptureMode({
  nodeId: v344,
  mode: v345,
  showSafeFrame: showSafeFrame = true,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v344, (v346) => {
    const v347 = cloneSceneState(v346),
      v348 = v345 === "9:16" || v345 === "2.35:1" ? v345 : "adaptive";
    return (
      (v347["capture"]["mode"] = v348),
      (v347["capture"]["showSafeFrame"] =
        v348 === "adaptive" ? false : showSafeFrame === true),
      normalizePanoramaSceneState(v347)
    );
  });
}
export function setPanoramaSceneSafeFrameVisible({
  nodeId: v349,
  visible: v350,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v349, (v351) => {
    const v352 = cloneSceneState(v351);
    return (
      (v352["capture"]["showSafeFrame"] = v350 === true),
      normalizePanoramaSceneState(v352)
    );
  });
}
export function activatePanoramaSceneCameraSlot({
  nodeId: v353,
  slot: v354,
  storeInstance: storeInstance = appStore,
}) {
  const v355 = getStoreNode(storeInstance, v353);
  if (isPanorama360NodeType(v355?.["type"])) return null;
  const v356 = getSceneState(storeInstance, v353),
    v357 = resolveCameraBySlot(v356["cameras"], v354);
  if (!v357?.["camera"]?.["id"]) return null;
  return (
    activatePanoramaSceneCamera({
      nodeId: v353,
      cameraId: v357["camera"]["id"],
      storeInstance: storeInstance,
    }),
    v357["camera"]["id"]
  );
}
export function upsertPanoramaSceneCameraAtSlot({
  nodeId: v358,
  slot: v359,
  viewPose: v360,
  storeInstance: storeInstance = appStore,
}) {
  const v361 = getStoreNode(storeInstance, v358);
  if (isPanorama360NodeType(v361?.["type"])) return null;
  const v362 = normalizeCameraSlot(v359);
  if (!v362) return null;
  const v363 = getSceneState(storeInstance, v358),
    v364 = sanitizeCameraPose(v360),
    v365 = resolveCameraBySlot(v363["cameras"], v362);
  let v366 = v365?.["camera"]?.["id"] || null,
    v367 = false;
  writeSceneState(storeInstance, v358, (v368) => {
    const v369 = cloneSceneState(v368),
      v370 = resolveCameraBySlot(v369["cameras"], v362);
    if (v370?.["camera"]?.["id"]) {
      const v371 = v370["camera"]["id"];
      return (
        (v366 = v371),
        (v369["cameras"] = v369["cameras"]["map"]((v372) =>
          v372["id"] === v371
            ? {
                ...v372,
                slot: v362,
                name: v372["name"] || "机位 " + toCameraSlotLabel(v362),
                position: v364["position"],
                quaternion: v364["quaternion"],
                rotation: v364["rotation"],
                focalLength: v364["focalLength"],
              }
            : v372,
        )),
        v369["mode"] === "panorama" &&
          ((v369["viewport"]["activeCameraId"] = v371),
          (v369["viewport"]["activeView"] = "camera")),
        (v367 = true),
        v369
      );
    }
    if (v369["cameras"]["length"] >= PANORAMA_SCENE_CAMERA_LIMIT) return v369;
    const v373 = generateId("scene-camera");
    return (
      (v366 = v373),
      v369["cameras"]["push"]({
        id: v373,
        slot: v362,
        name: "机位\x20" + toCameraSlotLabel(v362),
        position: v364["position"],
        quaternion: v364["quaternion"],
        rotation: v364["rotation"],
        focalLength: v364["focalLength"],
      }),
      v369["mode"] === "panorama" &&
        ((v369["viewport"]["activeCameraId"] = v373),
        (v369["viewport"]["activeView"] = "camera")),
      (v367 = true),
      v369
    );
  });
  if (!v367)
    return (
      showWarning("最多只能创建 " + PANORAMA_SCENE_CAMERA_LIMIT + " 个机位"),
      null
    );
  return (commit(), v366);
}
export function activatePanoramaSceneDefaultView({
  nodeId: v374,
  pose: v375,
  storeInstance: storeInstance = appStore,
}) {
  const v376 = getSceneState(storeInstance, v374);
  if (v376["mode"] === "panorama") {
    const v377 = v375
      ? cameraPoseToPanoramaView(v375)
      : v376["viewport"]["panoramaView"];
    applyPanoramaSceneViewCommit({
      nodeId: v374,
      panoramaView: v377,
      activeView: "default",
      activeCameraId: null,
      storeInstance: storeInstance,
    });
    return;
  }
  const v378 = v375
    ? cameraPoseToSceneViewFromReference(
        v375,
        v376["viewport"]["sceneView"] || createDefaultSceneView(),
      )
    : v376["viewport"]["sceneView"];
  applyPanoramaSceneViewCommit({
    nodeId: v374,
    sceneView: v378,
    activeView: "default",
    activeCameraId: null,
    storeInstance: storeInstance,
  });
}
export async function uploadPanoramaSceneImage({
  nodeId: v379,
  file: v380,
  storeInstance: storeInstance = appStore,
  getCurrentProjectId: getCurrentProjectId = () =>
    window["currentProjectId"] || "default_v2_project",
}) {
  if (!v380) return null;
  const v381 = getStoreNode(storeInstance, v379);
  if (!v381) return null;
  if (!isPanorama360NodeType(v381["type"]))
    return (
      showWarning("3D导演台不支持上传全景图，请使用 360全景图 节点"),
      null
    );
  try {
    const v382 = await uploadFile(v380, getCurrentProjectId()),
      v383 = v382["filename"] || v380["name"],
      v384 = pickResultLocalPath(v382),
      v385 =
        localPathToUrl(v384) || String(v382["url"] || "")["trim"]() || null,
      v386 = await resolveOutputMediaSize({ localPath: v384, imageUrl: v385 });
    if (v386 && !isNearEquirectangularRatio(v386)) {
      const v387 = v386["width"] / v386["height"];
      showWarning(
        "当前图片为 " +
          v386["width"] +
          "×" +
          v386["height"] +
          "（比例\x20" +
          v387["toFixed"](3) +
          "），不是标准 2:1 全景图，显示可能出现拉伸。",
      );
    }
    const v388 = buildPanoramaUploadSourceNodeData({
        storeInstance: storeInstance,
        anchorNode: v381,
        localPath: v384,
        imageUrl: v385,
        fileName: v383,
        uploadedSize: v386,
      }),
      v389 = Date["now"]();
    return (
      storeInstance["batch"](() => {
        (writeSceneState(storeInstance, v379, (v390) => {
          const v391 = cloneSceneState(v390);
          return (
            (v391["mode"] = "panorama"),
            (v391["viewport"]["activeView"] = "default"),
            (v391["viewport"]["activeCameraId"] = null),
            (v391["panorama"] = {
              localPath: v384,
              imageUrl: v385,
              fileName: v383,
              sourceSignature: null,
              isLoaded: false,
              error: null,
            }),
            v391
          );
        }),
          v388 &&
            (storeInstance["addNode"](v388),
            storeInstance["addEdge"]({
              id: generateId("edge"),
              sourceId: v388["id"],
              targetId: v379,
              createdAt: v389,
            })),
          storeInstance["setSelectedNodes"]([v379]));
      }),
      commit(),
      showSuccess("全景图已上传"),
      {
        localPath: v384,
        imageUrl: v385,
        fileName: v383,
        sourceNodeId: v388?.["id"] || null,
      }
    );
  } catch (v392) {
    const v393 = String(v392?.["message"] || "上传失败");
    return (
      writeSceneState(storeInstance, v379, (v394) => {
        const v395 = cloneSceneState(v394);
        return (
          (v395["panorama"]["error"] = v393),
          (v395["panorama"]["isLoaded"] = false),
          v395
        );
      }),
      showError("全景图上传失败：" + v393),
      null
    );
  }
}
export function syncPanorama360FromIncomingImageEdge({
  nodeId: v396,
  storeInstance: storeInstance = appStore,
}) {
  const v397 = String(v396 || "")["trim"](),
    v398 = getStoreNode(storeInstance, v397);
  if (!v398 || !isPanorama360NodeType(v398["type"]))
    return (bumpPanorama360SyncVersion(v397), null);
  const v399 =
      typeof storeInstance?.["getIncomingEdges"] === "function"
        ? storeInstance["getIncomingEdges"](v397)
        : Object["values"](storeInstance["getStateRaw"]?.()["edges"] || {})[
            "filter"
          ]((v400) => v400?.["targetId"] === v397),
    v401 = storeInstance["getStateRaw"]?.()["nodes"] || {},
    v402 = (Array["isArray"](v399) ? v399 : [])
      ["map"]((v403) => {
        const v404 = v401[v403?.["sourceId"]] || null,
          v405 = resolvePanoramaImagePayloadFromSourceNode(v404);
        if (!v404 || !v405) return null;
        return { edge: v403, sourceNode: v404, payload: v405 };
      })
      ["filter"](Boolean)
      ["sort"](comparePanoramaIncomingCandidatesDesc),
    v406 = v402[0] || null;
  if (!v406?.["payload"]) return (bumpPanorama360SyncVersion(v397), null);
  const v407 = buildPanoramaSourceSignature(v406["payload"]),
    v408 = getSceneState(storeInstance, v397),
    v409 = v408?.["panorama"] || {},
    v410 = v409["isLoaded"] === false && !v409["error"],
    v411 =
      String(v409["sourceSignature"] || "") === v407 &&
      hasPersistentPanoramaLocalPath(v409["localPath"]);
  if (v411) {
    const v412 = {
      localPath:
        String(v409["localPath"] || "")["trim"]() ||
        v406["payload"]["localPath"],
      imageUrl:
        String(v409["imageUrl"] || "")["trim"]() || v406["payload"]["imageUrl"],
      fileName:
        String(v409["fileName"] || "")["trim"]() || v406["payload"]["fileName"],
      sourceSignature: v407,
      isLoaded: false,
      error: null,
    };
    if (v410)
      return {
        ...v412,
        sourceNodeId: v406["sourceNode"]["id"],
        updated: false,
      };
    return (
      writeSceneState(storeInstance, v397, (v413) => {
        const v414 = cloneSceneState(v413);
        return (
          (v414["mode"] = "panorama"),
          (v414["viewport"]["activeView"] = "default"),
          (v414["viewport"]["activeCameraId"] = null),
          (v414["panorama"] = v412),
          v414
        );
      }),
      { ...v412, sourceNodeId: v406["sourceNode"]["id"], updated: true }
    );
  }
  const v415 = _panorama360SyncInflightByNodeId["get"](v397);
  if (v415?.["signature"] === v407 && v415?.["promise"]) return v415["promise"];
  const v416 = bumpPanorama360SyncVersion(v397),
    v417 = (async () => {
      try {
        const v418 = await ensurePersistedPanoramaInputPng({
          localPath: v406["payload"]["localPath"],
          imageUrl: v406["payload"]["imageUrl"],
          fileName: v406["payload"]["fileName"],
          sourceSignature: v407,
        });
        if (!isPanorama360SyncCurrent(v397, v416))
          return {
            ...v418,
            sourceNodeId: v406["sourceNode"]["id"],
            updated: false,
            stale: true,
          };
        const v419 = getStoreNode(storeInstance, v397);
        if (!v419 || !isPanorama360NodeType(v419["type"])) return null;
        const v420 = getSceneState(storeInstance, v397),
          v421 = v420?.["panorama"] || {},
          v422 = {
            localPath: v418["localPath"],
            imageUrl: v418["imageUrl"],
            fileName: v418["fileName"],
            sourceSignature: v407,
            isLoaded: false,
            error: null,
          },
          v423 =
            String(v421["localPath"] || "") ===
              String(v422["localPath"] || "") &&
            String(v421["imageUrl"] || "") === String(v422["imageUrl"] || "") &&
            String(v421["fileName"] || "") === String(v422["fileName"] || "") &&
            String(v421["sourceSignature"] || "") === v407,
          v424 = v421["isLoaded"] === false && !v421["error"];
        if (v423 && v424)
          return {
            ...v422,
            sourceNodeId: v406["sourceNode"]["id"],
            updated: false,
          };
        return (
          writeSceneState(storeInstance, v397, (v425) => {
            const v426 = cloneSceneState(v425);
            return (
              (v426["mode"] = "panorama"),
              (v426["viewport"]["activeView"] = "default"),
              (v426["viewport"]["activeCameraId"] = null),
              (v426["panorama"] = v422),
              v426
            );
          }),
          { ...v422, sourceNodeId: v406["sourceNode"]["id"], updated: true }
        );
      } catch (v427) {
        if (!isPanorama360SyncCurrent(v397, v416))
          return {
            updated: false,
            stale: true,
            error: String(v427?.["message"] || v427 || "未知错误"),
          };
        const v428 = String(
          v427?.["message"] || "360\x20全景图\x20PNG\x20归一化失败",
        );
        return (showError(v428), { updated: false, error: v428 });
      } finally {
        const v429 = _panorama360SyncInflightByNodeId["get"](v397);
        v429?.["promise"] === v417 &&
          _panorama360SyncInflightByNodeId["delete"](v397);
      }
    })();
  return (
    _panorama360SyncInflightByNodeId["set"](v397, {
      signature: v407,
      version: v416,
      promise: v417,
    }),
    v417
  );
}
export function updatePanoramaSceneLoadState({
  nodeId: v430,
  isLoaded: v431,
  error: error = null,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v430, (v432) => {
    const v433 = cloneSceneState(v432);
    return (
      (v433["panorama"]["isLoaded"] = v431 === true),
      (v433["panorama"]["error"] = error ? String(error) : null),
      v433
    );
  });
}
export function addPanoramaSceneMannequin({
  nodeId: v434,
  gender: gender = "male",
  colorKey: colorKey = "blue",
  viewPose: v435,
  storeInstance: storeInstance = appStore,
}) {
  const v436 = getSceneState(storeInstance, v434),
    v437 = resolveObjectPlacementPoint({
      sceneMode: v436["mode"],
      sceneViewTarget: v436?.["viewport"]?.["sceneView"]?.["target"],
      pose: v435,
      groundY: 0,
      forwardDistance: MANNEQUIN_FORWARD_PLACEMENT_DISTANCE,
    }),
    v438 = pickFacingCameraYaw(v435),
    v439 = generateId("mannequin");
  return (
    writeSceneState(storeInstance, v434, (v440) => {
      const v441 = cloneSceneState(v440);
      return (
        v441["mannequins"]["push"]({
          id: v439,
          gender: gender === "female" ? "female" : "male",
          colorKey: colorKey,
          position: v437,
          rotation: { x: 0, y: v438, z: 0 },
          scale: 1,
        }),
        (v441["gridPlacement"]["gender"] =
          gender === "female" ? "female" : "male"),
        (v441["gridPlacement"]["colorKey"] = colorKey),
        setSingleSelection(v441, "mannequin", v439),
        v441
      );
    }),
    commit(),
    v439
  );
}
export function addPanoramaSceneCube({
  nodeId: v442,
  colorKey: colorKey = "blue",
  viewPose: v443,
  storeInstance: storeInstance = appStore,
}) {
  const v444 = getStoreNode(storeInstance, v442);
  if (isPanorama360NodeType(v444?.["type"])) return null;
  const v445 = getSceneState(storeInstance, v442),
    v446 = resolveObjectPlacementPoint({
      sceneMode: v445["mode"],
      sceneViewTarget: v445?.["viewport"]?.["sceneView"]?.["target"],
      pose: v443,
      groundY: 0,
      forwardDistance: CUBE_FORWARD_PLACEMENT_DISTANCE,
    }),
    v447 = { x: v446["x"], y: 0, z: v446["z"] },
    v448 = generateId("cube");
  return (
    writeSceneState(storeInstance, v442, (v449) => {
      const v450 = cloneSceneState(v449);
      return (
        v450["cubes"]["push"]({
          id: v448,
          colorKey: colorKey,
          position: v447,
          rotation: { x: 0, y: 0, z: 0 },
          scale: 1,
        }),
        setSingleSelection(v450, "cube", v448),
        v450
      );
    }),
    commit(),
    v448
  );
}
export function addPanoramaSceneMannequinGrid({
  nodeId: v451,
  viewPose: v452,
  storeInstance: storeInstance = appStore,
}) {
  const v453 = getSceneState(storeInstance, v451),
    v454 = pickFacingCameraYaw(v452),
    v455 = resolveBatchPlacementOrigin({
      sceneMode: v453["mode"],
      sceneViewTarget: v453?.["viewport"]?.["sceneView"]?.["target"],
      pose: v452,
      groundY: 0,
      forwardDistance: MANNEQUIN_FORWARD_PLACEMENT_DISTANCE,
    }),
    v456 = computeGridPlacement({
      rows: v453["gridPlacement"]["rows"],
      cols: v453["gridPlacement"]["cols"],
      spacingX: v453["gridPlacement"]["spacingX"],
      spacingZ: v453["gridPlacement"]["spacingZ"],
      origin: v455,
      yaw: v454,
    });
  if (v456["length"] === 0) return [];
  const v457 = [],
    v458 = generateId("mannequin-group");
  return (
    writeSceneState(storeInstance, v451, (v459) => {
      const v460 = cloneSceneState(v459);
      for (const v461 of v456) {
        const v462 = generateId("mannequin");
        (v457["push"](v462),
          v460["mannequins"]["push"]({
            id: v462,
            gender: v460["gridPlacement"]["gender"],
            colorKey: v460["gridPlacement"]["colorKey"],
            position: v461,
            rotation: { x: 0, y: v454, z: 0 },
            scale: 1,
          }));
      }
      return (
        (v460["groups"] = Array["isArray"](v460["groups"])
          ? v460["groups"]
          : []),
        v460["groups"]["push"]({
          id: v458,
          type: "mannequin-grid",
          memberObjectType: "mannequin",
          memberIds: [...v457],
        }),
        setSelectionFromObjects(
          v460,
          v457["map"]((v463) => ({ objectType: "mannequin", objectId: v463 })),
          {
            preferredGroupId: v458,
            preferredActiveType: "mannequin",
            preferredActiveId: v457[0] || null,
          },
        ),
        v460
      );
    }),
    commit(),
    v457
  );
}
export function addPanoramaSceneCamera({
  nodeId: v464,
  viewPose: v465,
  storeInstance: storeInstance = appStore,
}) {
  const v466 = getStoreNode(storeInstance, v464);
  if (isPanorama360NodeType(v466?.["type"])) return null;
  const v467 = getSceneState(storeInstance, v464);
  if (v467["cameras"]["length"] >= PANORAMA_SCENE_CAMERA_LIMIT)
    return (
      showWarning("最多只能创建\x20" + PANORAMA_SCENE_CAMERA_LIMIT + " 个机位"),
      null
    );
  const v468 = sanitizeCameraPose(v465),
    v469 = generateId("scene-camera"),
    v470 = resolveFirstFreeCameraSlot(v467["cameras"]);
  if (!v470)
    return (
      showWarning("最多只能创建\x20" + PANORAMA_SCENE_CAMERA_LIMIT + " 个机位"),
      null
    );
  return (
    writeSceneState(storeInstance, v464, (v471) => {
      const v472 = cloneSceneState(v471);
      return (
        v472["cameras"]["push"]({
          id: v469,
          slot: v470,
          name: "机位\x20" + toCameraSlotLabel(v470),
          position: v468["position"],
          quaternion: v468["quaternion"],
          rotation: v468["rotation"],
          focalLength: v468["focalLength"],
        }),
        v472["mode"] === "panorama" &&
          ((v472["viewport"]["activeView"] = "camera"),
          (v472["viewport"]["activeCameraId"] = v469)),
        v472
      );
    }),
    commit(),
    v469
  );
}
export function updatePanoramaSceneObjectTransform({
  nodeId: v473,
  objectType: v474,
  objectId: v475,
  pose: v476,
  targets: v477,
  storeInstance: storeInstance = appStore,
}) {
  const v478 = Array["isArray"](v477) ? v477 : [],
    v479 = v476 ? sanitizeObjectPose(v476) : null;
  (writeSceneState(storeInstance, v473, (v480) => {
    const v481 = cloneSceneState(v480);
    if (v478["length"] > 0) {
      const v482 = new Map(),
        v483 = new Map();
      v478["forEach"]((v484) => {
        if (!v484?.["objectId"] || !v484?.["objectType"] || !v484?.["pose"])
          return;
        const v485 = sanitizeObjectPose(v484["pose"]);
        if (v484["objectType"] === "mannequin")
          v482["set"](String(v484["objectId"]), v485);
        else
          v484["objectType"] === "cube" &&
            v483["set"](String(v484["objectId"]), v485);
      });
      v482["size"] > 0 &&
        (v481["mannequins"] = v481["mannequins"]["map"]((v486) => {
          const v487 = v482["get"](v486["id"]);
          if (!v487) return v486;
          const v488 = composeCompatibleScale(v487["scale"], v486["scale"]);
          return {
            ...v486,
            position: v487["position"],
            rotation: v487["rotation"],
            quaternion: v487["quaternion"],
            scale: v488,
          };
        }));
      v483["size"] > 0 &&
        (v481["cubes"] = v481["cubes"]["map"]((v489) => {
          const v490 = v483["get"](v489["id"]);
          if (!v490) return v489;
          const v491 = composeCompatibleScale(v490["scale"], v489["scale"]);
          return {
            ...v489,
            position: v490["position"],
            rotation: v490["rotation"],
            quaternion: v490["quaternion"],
            scale: v491,
          };
        }));
      if (v481["selection"]["selectedGroupId"]) {
        const v492 = (v481["groups"] || [])["find"](
          (v493) => v493["id"] === v481["selection"]["selectedGroupId"],
        );
        v492 &&
          setSelectionFromObjects(
            v481,
            v492["memberIds"]["map"]((v494) => ({
              objectType: "mannequin",
              objectId: v494,
            })),
            {
              preferredGroupId: v492["id"],
              preferredActiveType: "mannequin",
              preferredActiveId: v492["memberIds"][0] || null,
            },
          );
      }
      return v481;
    }
    if (v474 === "camera") return v481;
    if (v474 === "mannequin" && v479 && v475)
      ((v481["mannequins"] = v481["mannequins"]["map"]((v495) =>
        v495["id"] === v475
          ? {
              ...v495,
              position: v479["position"],
              rotation: v479["rotation"],
              quaternion: v479["quaternion"],
              scale: composeCompatibleScale(v479["scale"], v495["scale"]),
            }
          : v495,
      )),
        setSingleSelection(v481, "mannequin", v475));
    else
      v474 === "cube" &&
        v479 &&
        v475 &&
        ((v481["cubes"] = v481["cubes"]["map"]((v496) =>
          v496["id"] === v475
            ? {
                ...v496,
                position: v479["position"],
                rotation: v479["rotation"],
                quaternion: v479["quaternion"],
                scale: composeCompatibleScale(v479["scale"], v496["scale"]),
              }
            : v496,
        )),
        setSingleSelection(v481, "cube", v475));
    return v481;
  }),
    commit());
}
export function deletePanoramaSceneCamera({
  nodeId: v497,
  cameraId: v498,
  storeInstance: storeInstance = appStore,
}) {
  const v499 = getStoreNode(storeInstance, v497);
  if (isPanorama360NodeType(v499?.["type"])) return;
  const v500 = getSceneState(storeInstance, v497);
  if (!v500["cameras"]["some"]((v501) => v501["id"] === v498)) return;
  (writeSceneState(storeInstance, v497, (v502) => {
    const v503 = finalizeSelectedObjectRemoval(v502, "camera", v498);
    return (
      (v503["cameras"] = v503["cameras"]["filter"](
        (v504) => v504["id"] !== v498,
      )),
      v503
    );
  }),
    commit());
}
export function deleteSelectedPanoramaSceneObject({
  nodeId: v505,
  storeInstance: storeInstance = appStore,
}) {
  const v506 = getSceneState(storeInstance, v505),
    v507 = collectSelectionObjects(v506),
    v508 = v506["selection"]["selectedObjectType"],
    v509 = v506["selection"]["selectedObjectId"],
    v510 =
      v506?.["viewport"]?.["activeView"] === "camera" &&
      v506?.["viewport"]?.["activeCameraId"]
        ? String(v506["viewport"]["activeCameraId"])
        : null,
    v511 = v506["selection"]["selectedGroupId"] || null;
  if (v511) {
    (writeSceneState(storeInstance, v505, (v512) => {
      const v513 = cloneSceneState(v512),
        v514 = (v513["groups"] || [])["find"]((v515) => v515["id"] === v511);
      if (!v514) return (clearSelection(v513), v513);
      const v516 = new Set(v514["memberIds"]);
      return (
        (v513["mannequins"] = v513["mannequins"]["filter"](
          (v517) => !v516["has"](v517["id"]),
        )),
        (v513["groups"] = pruneGroups(v513["groups"], [...v516])["filter"](
          (v518) => v518["id"] !== v511,
        )),
        clearSelection(v513),
        v513
      );
    }),
      commit());
    return;
  }
  if (v507["length"] > 1) {
    (writeSceneState(storeInstance, v505, (v519) => {
      const v520 = cloneSceneState(v519),
        v521 = new Set(
          v507["filter"]((v522) => v522["objectType"] === "cube")["map"](
            (v523) => v523["objectId"],
          ),
        ),
        v524 = new Set(
          v507["filter"]((v525) => v525["objectType"] === "mannequin")["map"](
            (v526) => v526["objectId"],
          ),
        );
      v521["size"] > 0 &&
        (v520["cubes"] = v520["cubes"]["filter"](
          (v527) => !v521["has"](v527["id"]),
        ));
      if (v524["size"] > 0) {
        const v528 = [...v524];
        ((v520["mannequins"] = v520["mannequins"]["filter"](
          (v529) => !v524["has"](v529["id"]),
        )),
          (v520["groups"] = pruneGroups(v520["groups"], v528)));
      }
      return (clearSelection(v520), v520);
    }),
      commit());
    return;
  }
  const v530 =
    v507["length"] === 1
      ? v507[0]
      : v508 && v509
        ? { objectType: v508, objectId: v509 }
        : v510
          ? { objectType: "camera", objectId: v510 }
          : null;
  if (!v530?.["objectType"] || !v530?.["objectId"]) return;
  (writeSceneState(storeInstance, v505, (v531) => {
    const v532 = finalizeSelectedObjectRemoval(
      v531,
      v530["objectType"],
      v530["objectId"],
    );
    if (v530["objectType"] === "camera")
      v532["cameras"] = v532["cameras"]["filter"](
        (v533) => v533["id"] !== v530["objectId"],
      );
    else
      v530["objectType"] === "cube"
        ? (v532["cubes"] = v532["cubes"]["filter"](
            (v534) => v534["id"] !== v530["objectId"],
          ))
        : ((v532["mannequins"] = v532["mannequins"]["filter"](
            (v535) => v535["id"] !== v530["objectId"],
          )),
          (v532["groups"] = pruneGroups(v532["groups"], [v530["objectId"]])));
    return v532;
  }),
    commit());
}
function createCapturePreviewUrl(v536) {
  const v537 = globalThis["window"]?.["URL"] || globalThis["URL"];
  if (!v536 || typeof v537?.["createObjectURL"] !== "function") return "";
  try {
    return v537["createObjectURL"](v536);
  } catch {
    return "";
  }
}
function buildSavedCapturePatch(v538, v539 = {}) {
  const v540 = pickResultLocalPath(v538),
    v541 = localPathToUrl(v540) || String(v538?.["url"] || "")["trim"]();
  if (!v540 || !v541) throw new Error("截图已显示，但本地保存未返回有效路径");
  const v542 = {
      src: v541,
      localPath: v540,
      originalLocalPath: normalizeLocalPath(
        v538?.["originalLocalPath"] || v540,
      ),
      displayLocalPath: normalizeLocalPath(v538?.["displayLocalPath"]),
      thumbLocalPath: normalizeLocalPath(v538?.["thumbLocalPath"]),
      fileName: v538?.["filename"] || v539["fileName"] || "",
      captureSavePending: false,
      captureSaveError: null,
    },
    v543 = Number(
      v538?.["originalWidth"] || v539["originalWidth"] || v539["width"] || 0,
    ),
    v544 = Number(
      v538?.["originalHeight"] || v539["originalHeight"] || v539["height"] || 0,
    );
  if (v543 > 0) v542["originalWidth"] = v543;
  if (v544 > 0) v542["originalHeight"] = v544;
  return v542;
}
export async function capturePanoramaSceneViewport({
  nodeId: v545,
  captureViewport: v546,
  captureBlob: v547,
  storeInstance: storeInstance = appStore,
  saveBlob: saveBlob = saveOutputBlob,
  createPreviewUrl: createPreviewUrl = createCapturePreviewUrl,
}) {
  const v548 =
    typeof v547 === "function"
      ? v547
      : typeof v546 === "function"
        ? v546
        : null;
  if (!v548) return null;
  const v549 = createNodeActionContext({ storeInstance: storeInstance }),
    v550 = getStoreNode(v549["storeInstance"], v545);
  if (!v550) return null;
  const v551 = getSceneState(v549["storeInstance"], v545);
  if (v551["capture"]["pending"]) return (showWarning("截图正在进行中"), null);
  writeSceneState(v549["storeInstance"], v545, (v552) => {
    const v553 = cloneSceneState(v552);
    return (
      (v553["capture"]["pending"] = true),
      (v553["capture"]["error"] = null),
      v553
    );
  });
  try {
    const v554 = await v548();
    if (!v554) throw new Error("未获取到截图图像");
    const v555 = "scene_capture_" + Date["now"]() + ".png",
      v556 = buildSourceMediaNodePayload({
        id: "__seed__",
        type: "source-image",
        x: 0,
        y: 0,
        name: "场景截图",
        fileName: v555,
      }),
      v557 = v549["storeInstance"]["getStateRaw"](),
      v558 = calcSafeSpawnPosNearNode(
        v557["nodes"] || {},
        v550,
        v556["width"],
        v556["height"],
      ),
      v559 = generateId("source-image"),
      v560 = createPreviewUrl(v554) || "";
    return (
      v549["storeInstance"]["batch"](() => {
        (writeSceneState(v549["storeInstance"], v545, (v561) => {
          const v562 = cloneSceneState(v561);
          return (
            (v562["capture"]["pending"] = false),
            (v562["capture"]["error"] = null),
            (v562["capture"]["lastCaptureAt"] = Date["now"]()),
            v562
          );
        }),
          v549["storeInstance"]["addNode"](
            buildSourceMediaNodePayload({
              id: v559,
              type: "source-image",
              x: v558["x"],
              y: v558["y"],
              name: "场景截图",
              fileName: v555,
              capturePreviewUrl: v560,
              captureSavePending: true,
              captureSaveError: null,
            }),
          ));
      }),
      commit(),
      showSuccess("截图已生成源图像节点"),
      Promise["resolve"]()
        ["then"](() => saveBlob(v554, { ext: "png" }))
        ["then"]((v563) => {
          if (!v549["storeInstance"]["getStateRaw"]()["nodes"]?.[v559]) return;
          v549["storeInstance"]["updateNodeData"](
            v559,
            buildSavedCapturePatch(v563, {
              fileName: v555,
              width: v556["width"],
              height: v556["height"],
            }),
          );
        })
        ["catch"]((v564) => {
          const v565 = String(v564?.["message"] || "本地保存失败");
          (console["warn"]("[PanoramaScene] save capture failed:", v564),
            v549["storeInstance"]["getStateRaw"]()["nodes"]?.[v559] &&
              v549["storeInstance"]["updateNodeData"](v559, {
                captureSavePending: false,
                captureSaveError: v565,
              }),
            showWarning("截图已显示，但本地保存失败"));
        }),
      v559
    );
  } catch (v566) {
    const v567 = String(v566?.["message"] || "截图失败");
    return (
      writeSceneState(v549["storeInstance"], v545, (v568) => {
        const v569 = cloneSceneState(v568);
        return (
          (v569["capture"]["pending"] = false),
          (v569["capture"]["error"] = v567),
          v569
        );
      }),
      showError("截图失败：" + v567),
      null
    );
  }
}
export function renamePanoramaSceneCamera({
  nodeId: v570,
  cameraId: v571,
  name: v572,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, v570, (v573) => {
    const v574 = cloneSceneState(v573);
    return (
      (v574["cameras"] = v574["cameras"]["map"]((v575) =>
        v575["id"] === v571
          ? {
              ...v575,
              name:
                String(v572 || v575["name"] || "机位")["trim"]() ||
                v575["name"],
            }
          : v575,
      )),
      v574
    );
  });
}
export function setPanoramaSceneCollapsed({
  nodeId: v576,
  isCollapsed: v577,
  enterEditingOnExpand: enterEditingOnExpand = false,
  storeInstance: storeInstance = appStore,
}) {
  const v578 = getStoreNode(storeInstance, v576);
  if (!v578) return;
  const v579 = typeof v577 === "boolean" ? v577 : v578["isCollapsed"] !== true;
  if (v579 === (v578["isCollapsed"] === true)) return;
  const v580 = enterEditingOnExpand === true && v579 === false,
    v581 =
      Number(v578["_originalWidth"]) ||
      Number(v578["width"]) ||
      PANORAMA_SCENE_DEFAULT_SIZE["width"],
    v582 =
      Number(v578["_originalHeight"]) ||
      Number(v578["height"]) ||
      PANORAMA_SCENE_DEFAULT_SIZE["height"],
    v583 = computeCollapsedDimensions(v581, v582);
  (storeInstance["batch"](() => {
    (writeSceneState(storeInstance, v576, (v584) => {
      const v585 = cloneSceneState(v584);
      return (
        (v585["ui"]["isEditing"] = v580),
        (v585["ui"]["showCameraList"] = false),
        v585
      );
    }),
      storeInstance["updateNodeData"](v576, {
        isCollapsed: v579,
        _originalWidth: v581,
        _originalHeight: v582,
        width: v579 ? v583["width"] : v581,
        height: v579 ? v583["height"] : v582,
      }));
  }),
    commit());
}
export function focusPanoramaSceneSelection({
  nodeId: v586,
  storeInstance: storeInstance = appStore,
}) {
  const v587 = getSceneState(storeInstance, v586),
    v588 = getSelectedObject(v587);
  if (!v588) return false;
  if (v588["objectType"] === "camera")
    return (
      activatePanoramaSceneCamera({
        nodeId: v586,
        cameraId: v588["item"]["id"],
        storeInstance: storeInstance,
      }),
      true
    );
  const v589 = v588["item"],
    v590 = getSceneObjectHeightOffset(v588["objectType"]);
  if (v587["mode"] === "panorama") {
    const v591 = (Number(v589["position"]?.["y"]) || 0) + v590,
      v592 = Number(v589["position"]?.["x"]) || 0,
      v593 = v591 - 1.6,
      v594 = Number(v589["position"]?.["z"]) || 0,
      v595 = Math["hypot"](v592, v593, v594) || 1;
    return (
      applyPanoramaSceneViewCommit({
        nodeId: v586,
        panoramaView: {
          ...v587["viewport"]["panoramaView"],
          yaw: Math["atan2"](v592, v594 || 0.0001),
          pitch: clampPanoramaPitch(Math["asin"](v593 / v595)),
        },
        activeView: "default",
        activeCameraId: null,
        storeInstance: storeInstance,
      }),
      true
    );
  }
  return (
    applyPanoramaSceneViewCommit({
      nodeId: v586,
      sceneView: {
        ...v587["viewport"]["sceneView"],
        target: {
          x: Number(v589["position"]?.["x"]) || 0,
          y: (Number(v589["position"]?.["y"]) || 0) + v590,
          z: Number(v589["position"]?.["z"]) || 0,
        },
      },
      activeView: "default",
      activeCameraId: null,
      storeInstance: storeInstance,
    }),
    true
  );
}
