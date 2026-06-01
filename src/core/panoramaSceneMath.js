export const PANORAMA_SCENE_CAMERA_CONSTRAINTS = Object["freeze"]({
  panorama: Object["freeze"]({
    pitch: Object["freeze"]({
      min: (-85 * Math["PI"]) / 180,
      max: (85 * Math["PI"]) / 180,
      default: 0,
    }),
    fov: Object["freeze"]({ min: 35, max: 80, default: 55 }),
  }),
  scene: Object["freeze"]({
    orbitPitch: Object["freeze"]({ min: -1.35, max: 1.35 }),
    orbitDistance: Object["freeze"]({ min: 0.05, max: 120 }),
    focalLength: Object["freeze"]({ min: 16, max: 135, default: 50 }),
    sensorWidthMm: 36,
  }),
});
const PANORAMA_PITCH_LIMIT =
    PANORAMA_SCENE_CAMERA_CONSTRAINTS["panorama"]["pitch"]["max"],
  SCENE_PITCH_MIN =
    PANORAMA_SCENE_CAMERA_CONSTRAINTS["scene"]["orbitPitch"]["min"],
  SCENE_PITCH_MAX =
    PANORAMA_SCENE_CAMERA_CONSTRAINTS["scene"]["orbitPitch"]["max"],
  PANORAMA_FOV_DEFAULT =
    PANORAMA_SCENE_CAMERA_CONSTRAINTS["panorama"]["fov"]["default"],
  PANORAMA_FOV_MIN =
    PANORAMA_SCENE_CAMERA_CONSTRAINTS["panorama"]["fov"]["min"],
  PANORAMA_FOV_MAX =
    PANORAMA_SCENE_CAMERA_CONSTRAINTS["panorama"]["fov"]["max"];
export const SCENE_ORBIT_DISTANCE_MIN =
  PANORAMA_SCENE_CAMERA_CONSTRAINTS["scene"]["orbitDistance"]["min"];
export const SCENE_ORBIT_DISTANCE_MAX =
  PANORAMA_SCENE_CAMERA_CONSTRAINTS["scene"]["orbitDistance"]["max"];
const SCENE_WHEEL_DOLLY_FACTOR = 0.0012,
  SCENE_DRAG_DOLLY_FACTOR = SCENE_WHEEL_DOLLY_FACTOR * 8;
export const SCENE_SENSOR_WIDTH_MM =
  PANORAMA_SCENE_CAMERA_CONSTRAINTS["scene"]["sensorWidthMm"];
export const SCENE_DEFAULT_FOCAL_LENGTH_MM =
  PANORAMA_SCENE_CAMERA_CONSTRAINTS["scene"]["focalLength"]["default"];
export const SCENE_FOCAL_LENGTH_MIN_MM =
  PANORAMA_SCENE_CAMERA_CONSTRAINTS["scene"]["focalLength"]["min"];
export const SCENE_FOCAL_LENGTH_MAX_MM =
  PANORAMA_SCENE_CAMERA_CONSTRAINTS["scene"]["focalLength"]["max"];
function clamp(v0, v1, v2) {
  return Math["min"](v2, Math["max"](v1, v0));
}
function resolveFullFrameSensorHeight(v3 = SCENE_SENSOR_WIDTH_MM) {
  const v4 = Math["max"](1, Number(v3) || SCENE_SENSOR_WIDTH_MM);
  return v4 * (2 / 3);
}
function smoothstep(v5, v6, v7) {
  if (!(v7 > v6)) return v5 >= v7 ? 1 : 0;
  const v8 = clamp((v5 - v6) / (v7 - v6), 0, 1);
  return v8 * v8 * (3 - 2 * v8);
}
function computeSceneOrbitDistanceResponse(v9) {
  const v10 = 1 - 0.35 * (1 - smoothstep(v9, SCENE_ORBIT_DISTANCE_MIN, 0.6)),
    v11 = 1 - 0.22 * smoothstep(v9, 18, 90);
  return v10 * v11;
}
function normalizeVector3(v12, v13 = { x: 0, y: 0, z: 0 }) {
  return {
    x: Number["isFinite"](v12?.["x"]) ? v12["x"] : v13["x"],
    y: Number["isFinite"](v12?.["y"]) ? v12["y"] : v13["y"],
    z: Number["isFinite"](v12?.["z"]) ? v12["z"] : v13["z"],
  };
}
function normalizeQuaternion(v14, v15 = { x: 0, y: 0, z: 0, w: 1 }) {
  const v16 = Number(v14?.["x"]),
    v17 = Number(v14?.["y"]),
    v18 = Number(v14?.["z"]),
    v19 = Number(v14?.["w"]);
  if (
    !Number["isFinite"](v16) ||
    !Number["isFinite"](v17) ||
    !Number["isFinite"](v18) ||
    !Number["isFinite"](v19)
  )
    return { ...v15 };
  const v20 = Math["hypot"](v16, v17, v18, v19);
  if (v20 < 0.000001) return { ...v15 };
  return { x: v16 / v20, y: v17 / v20, z: v18 / v20, w: v19 / v20 };
}
function quaternionToForwardVector(v21) {
  const v22 = normalizeQuaternion(v21);
  return {
    x: -(2 * (v22["x"] * v22["z"] + v22["w"] * v22["y"])),
    y: -(2 * (v22["y"] * v22["z"] - v22["w"] * v22["x"])),
    z: -(1 - 2 * (v22["x"] * v22["x"] + v22["y"] * v22["y"])),
  };
}
function resolvePoseForwardVector(v23, v24) {
  if (v23?.["quaternion"])
    return normalizeVector3(quaternionToForwardVector(v23["quaternion"]), v24);
  if (v23?.["rotation"])
    return normalizeVector3(rotationToForwardVector(v23["rotation"]), v24);
  if (v23?.["forward"]) return normalizeVector3(v23["forward"], v24);
  return { ...v24 };
}
function lengthXZ(v25) {
  return Math["hypot"](v25["x"], v25["z"]);
}
function length3(v26) {
  return Math["hypot"](v26["x"], v26["y"], v26["z"]);
}
function normalize3(v27, v28 = { x: 0, y: 0, z: 0 }) {
  const v29 = length3(v27) || 0;
  if (v29 < 0.000001) return { ...v28 };
  return { x: v27["x"] / v29, y: v27["y"] / v29, z: v27["z"] / v29 };
}
function cross(v30, v31) {
  return {
    x: v30["y"] * v31["z"] - v30["z"] * v31["y"],
    y: v30["z"] * v31["x"] - v30["x"] * v31["z"],
    z: v30["x"] * v31["y"] - v30["y"] * v31["x"],
  };
}
function dot(v32, v33) {
  return (
    (Number(v32?.["x"]) || 0) * (Number(v33?.["x"]) || 0) +
    (Number(v32?.["y"]) || 0) * (Number(v33?.["y"]) || 0) +
    (Number(v32?.["z"]) || 0) * (Number(v33?.["z"]) || 0)
  );
}
function subtract(v34, v35) {
  return {
    x: (Number(v34?.["x"]) || 0) - (Number(v35?.["x"]) || 0),
    y: (Number(v34?.["y"]) || 0) - (Number(v35?.["y"]) || 0),
    z: (Number(v34?.["z"]) || 0) - (Number(v35?.["z"]) || 0),
  };
}
function scale(v36, v37) {
  const v38 = Number(v37) || 0;
  return {
    x: (Number(v36?.["x"]) || 0) * v38,
    y: (Number(v36?.["y"]) || 0) * v38,
    z: (Number(v36?.["z"]) || 0) * v38,
  };
}
function subtractProjection(v39, v40) {
  const v41 = normalize3(v40, { x: 0, y: 1, z: 0 }),
    v42 = scale(v41, dot(v39, v41));
  return subtract(v39, v42);
}
function safeLength(v43) {
  return Math["hypot"](
    Number(v43?.["x"]) || 0,
    Number(v43?.["y"]) || 0,
    Number(v43?.["z"]) || 0,
  );
}
export function clampPanoramaPitch(v44) {
  return clamp(Number(v44) || 0, -PANORAMA_PITCH_LIMIT, PANORAMA_PITCH_LIMIT);
}
export function clampSceneOrbitPitch(v45) {
  return clamp(Number(v45) || 0, SCENE_PITCH_MIN, SCENE_PITCH_MAX);
}
export function normalizeAngle(v46) {
  const v47 = Number(v46) || 0,
    v48 =
      (((v47 + Math["PI"]) % (Math["PI"] * 2)) + Math["PI"] * 2) %
      (Math["PI"] * 2);
  return v48 - Math["PI"];
}
export function computeStableGridSnap(v49, v50, v51 = null, v52 = 0.12) {
  const v53 = Math["max"](0.0001, Number(v50) || 1),
    v54 = Number(v49) || 0,
    v55 = Math["round"](v54 / v53) * v53,
    v56 = Number(v51);
  if (!Number["isFinite"](v56)) return v55;
  if (Math["abs"](v55 - v56) < 0.000001) return v56;
  const v57 = clamp(Number(v52) || 0, 0, 0.45),
    v58 = v53 * (0.5 + v57);
  return Math["abs"](v54 - v56) < v58 ? v56 : v55;
}
export function computeDampingFactor(v59, v60 = 120) {
  const v61 = Math["max"](0, Number(v59) || 0),
    v62 = Math["max"](1, Number(v60) || 120);
  return 1 - Math["exp"](-v61 / v62);
}
export function dampScalar(v63, v64, v65, v66 = 120) {
  const v67 = computeDampingFactor(v65, v66),
    v68 = Number(v63) || 0,
    v69 = Number(v64) || 0;
  return v68 + (v69 - v68) * v67;
}
export function dampAngle(v70, v71, v72, v73 = 120) {
  const v74 = computeDampingFactor(v72, v73),
    v75 = Number(v70) || 0,
    v76 = Number(v71) || 0,
    v77 = normalizeAngle(v76 - v75);
  return normalizeAngle(v75 + v77 * v74);
}
export function forwardVectorFromYawPitch(v78, v79 = 0) {
  const v80 = Number(v78) || 0,
    v81 = Number(v79) || 0,
    v82 = Math["cos"](v81);
  return {
    x: Math["sin"](v80) * v82,
    y: Math["sin"](v81),
    z: Math["cos"](v80) * v82,
  };
}
export function rotationToForwardVector(v83) {
  const v84 = Number(v83?.["x"]) || 0,
    v85 = Number(v83?.["y"]) || 0;
  return forwardVectorFromYawPitch(v85, -v84);
}
export function clampSceneFocalLength(v86) {
  return clamp(
    Number(v86) || SCENE_DEFAULT_FOCAL_LENGTH_MM,
    SCENE_FOCAL_LENGTH_MIN_MM,
    SCENE_FOCAL_LENGTH_MAX_MM,
  );
}
export function focalLengthToFov(v87, v88 = SCENE_SENSOR_WIDTH_MM) {
  const v89 = clampSceneFocalLength(v87),
    v90 = resolveFullFrameSensorHeight(v88),
    v91 = 2 * Math["atan"](v90 / (2 * v89));
  return (v91 * 180) / Math["PI"];
}
export function fovToFocalLength(v92, v93 = SCENE_SENSOR_WIDTH_MM) {
  const v94 = clamp(
      Number(v92) || focalLengthToFov(SCENE_DEFAULT_FOCAL_LENGTH_MM),
      18,
      100,
    ),
    v95 = resolveFullFrameSensorHeight(v93),
    v96 = v95 / (2 * Math["tan"]((v94 * Math["PI"]) / 180 / 2));
  return clampSceneFocalLength(v96);
}
export function resolveSceneCameraPose(v97, v98 = 58) {
  const v99 = normalizeVector3(v97?.["target"], { x: 0, y: 1.2, z: 0 }),
    v100 = Math["max"](
      SCENE_ORBIT_DISTANCE_MIN,
      Number(v97?.["orbitDistance"]) || 8,
    ),
    v101 = Number(v97?.["orbitYaw"]) || 0,
    v102 = clampSceneOrbitPitch(v97?.["orbitPitch"]),
    v103 = Math["cos"](v102),
    v104 = {
      x: v99["x"] + v100 * Math["sin"](v101) * v103,
      y: v99["y"] + v100 * Math["sin"](v102),
      z: v99["z"] + v100 * Math["cos"](v101) * v103,
    };
  return {
    kind: "scene-default",
    position: v104,
    target: v99,
    yaw: v101,
    pitch: v102,
    distance: v100,
    fov: Math["max"](1, Number(v98) || 58),
  };
}
export function resolvePanoramaViewPose(v105, v106 = { x: 0, y: 0, z: 0 }) {
  const v107 = Number(v105?.["yaw"]) || 0,
    v108 = clampPanoramaPitch(v105?.["pitch"]);
  return {
    kind: "panorama-default",
    position: normalizeVector3(v106, { x: 0, y: 0, z: 0 }),
    yaw: v107,
    pitch: v108,
    fov: Math["max"](
      PANORAMA_FOV_MIN,
      Math["min"](
        PANORAMA_FOV_MAX,
        Number(v105?.["fov"]) || PANORAMA_FOV_DEFAULT,
      ),
    ),
  };
}
export function applyOrbitDelta(v109, v110, v111, v112) {
  const v113 = Math["max"](120, Number(v112?.["width"]) || 1),
    v114 = Math["max"](120, Number(v112?.["height"]) || 1),
    v115 = (v110 / v113) * Math["PI"] * 1.75,
    v116 = (v111 / v114) * Math["PI"] * 1.25;
  return {
    orbitYaw: normalizeAngle((Number(v109?.["orbitYaw"]) || 0) - v115),
    orbitPitch: clampSceneOrbitPitch(
      (Number(v109?.["orbitPitch"]) || 0) + v116,
    ),
  };
}
export function applyPanoramaLookDelta(v117, v118, v119, v120) {
  const v121 = Math["max"](120, Number(v120?.["width"]) || 1),
    v122 = Math["max"](120, Number(v120?.["height"]) || 1),
    v123 = (v118 / v121) * Math["PI"] * 1.75,
    v124 = (v119 / v122) * Math["PI"] * 1.25;
  return {
    yaw: normalizeAngle((Number(v117?.["yaw"]) || 0) - v123),
    pitch: clampPanoramaPitch((Number(v117?.["pitch"]) || 0) + v124),
  };
}
export function applyScenePanDelta(v125, v126, v127, v128, v129) {
  const v130 = Math["max"](120, Number(v129?.["height"]) || 1),
    v131 = Math["max"](
      SCENE_ORBIT_DISTANCE_MIN,
      Number(v125?.["orbitDistance"]) || Number(v126?.["distance"]) || 8,
    ),
    v132 = ((Number(v126?.["fov"]) || 58) * Math["PI"]) / 180,
    v133 = (2 * Math["tan"](v132 / 2) * v131) / v130,
    v134 = smoothstep(v131, SCENE_ORBIT_DISTANCE_MIN, 0.25),
    v135 = 0.92 + v134 * 0.18,
    v136 = 1 - 0.28 * smoothstep(v131, 6, 24),
    v137 = v133 * v135 * v136,
    v138 = normalize3(
      normalizeVector3(
        v126?.["forward"] ||
          forwardVectorFromYawPitch(v126?.["yaw"], v126?.["pitch"]),
        { x: 0, y: 0, z: 1 },
      ),
      { x: 0, y: 0, z: 1 },
    ),
    v139 = { x: 0, y: 1, z: 0 },
    v140 = { x: 0, y: 0, z: 1 },
    v141 = cross(v139, v138),
    v142 = cross(v140, v138),
    v143 =
      length3(v141) > 0.000001
        ? normalize3(v141, { x: 1, y: 0, z: 0 })
        : normalize3(v142, { x: 1, y: 0, z: 0 }),
    v144 = cross(v138, v143),
    v145 =
      length3(v144) > 0.000001
        ? normalize3(v144, { x: 0, y: 1, z: 0 })
        : { x: 0, y: 1, z: 0 },
    v146 = v127 * v137,
    v147 = v128 * v137,
    v148 = normalizeVector3(v125?.["target"], { x: 0, y: 1.2, z: 0 });
  return {
    target: {
      x: v148["x"] + v143["x"] * v146 + v145["x"] * v147,
      y: v148["y"] + v143["y"] * v146 + v145["y"] * v147,
      z: v148["z"] + v143["z"] * v146 + v145["z"] * v147,
    },
  };
}
function applySceneOrbitDistanceDelta(v149, v150, v151) {
  const v152 = clamp(
      Number(v149?.["orbitDistance"]) || 8,
      SCENE_ORBIT_DISTANCE_MIN,
      SCENE_ORBIT_DISTANCE_MAX,
    ),
    v153 = computeSceneOrbitDistanceResponse(v152),
    v154 = clamp(
      v152 * Math["exp"]((Number(v150) || 0) * v151 * v153),
      SCENE_ORBIT_DISTANCE_MIN,
      SCENE_ORBIT_DISTANCE_MAX,
    );
  return { orbitDistance: v154 };
}
export function applySceneZoomDelta(v155, v156) {
  return applySceneOrbitDistanceDelta(v155, v156, SCENE_WHEEL_DOLLY_FACTOR);
}
export function applySceneDollyDelta(v157, v158) {
  return applySceneOrbitDistanceDelta(v157, v158, SCENE_DRAG_DOLLY_FACTOR);
}
export function applyPanoramaZoomDelta(v159, v160) {
  return {
    fov: clamp(
      (Number(v159?.["fov"]) || PANORAMA_FOV_DEFAULT) *
        Math["exp"]((Number(v160) || 0) * 0.00045),
      PANORAMA_FOV_MIN,
      PANORAMA_FOV_MAX,
    ),
  };
}
export function computeForwardPlacement({
  pose: v161,
  distance: distance = 3,
  groundY: groundY = 0,
  eyeHeight: eyeHeight = 1.6,
} = {}) {
  const v162 = normalizeVector3(v161?.["position"], {
      x: 0,
      y: eyeHeight,
      z: 0,
    }),
    v163 = normalizeVector3(
      v161?.["forward"] ||
        (v161?.["rotation"]
          ? rotationToForwardVector(v161["rotation"])
          : forwardVectorFromYawPitch(v161?.["yaw"], v161?.["pitch"])),
      { x: 0, y: 0, z: 1 },
    ),
    v164 = lengthXZ(v163),
    v165 =
      v164 > 0.0001
        ? { x: v163["x"] / v164, y: 0, z: v163["z"] / v164 }
        : { x: 0, y: 0, z: 1 },
    v166 = Math["max"](0.6, Number(distance) || 3);
  return {
    x: v162["x"] + v165["x"] * v166,
    y: groundY,
    z: v162["z"] + v165["z"] * v166,
  };
}
export function computeSceneCenterGroundPlacement({
  pose: v167,
  groundY: groundY = 0,
  minDistance: minDistance = 0.6,
  maxDistance: maxDistance = 80,
} = {}) {
  const v168 = normalizeVector3(v167?.["position"], { x: 0, y: 1.6, z: 0 }),
    v169 = normalize3(
      normalizeVector3(
        v167?.["forward"] ||
          (v167?.["rotation"]
            ? rotationToForwardVector(v167["rotation"])
            : forwardVectorFromYawPitch(v167?.["yaw"], v167?.["pitch"])),
        { x: 0, y: -0.5, z: 1 },
      ),
      { x: 0, y: -0.5, z: 1 },
    ),
    v170 = 0.00001;
  if (Math["abs"](v169["y"]) <= v170) return null;
  const v171 = (groundY - v168["y"]) / v169["y"];
  if (!Number["isFinite"](v171) || v171 <= minDistance) return null;
  const v172 = Math["min"](v171, Math["max"](minDistance, maxDistance));
  return {
    x: v168["x"] + v169["x"] * v172,
    y: groundY,
    z: v168["z"] + v169["z"] * v172,
  };
}
function resolveSceneViewTargetGroundPoint(v173, v174 = 0) {
  return { x: Number(v173?.["x"]) || 0, y: v174, z: Number(v173?.["z"]) || 0 };
}
export function resolveObjectPlacementPoint({
  sceneMode: sceneMode = "scene",
  sceneViewTarget: sceneViewTarget = null,
  pose: v175,
  groundY: groundY = 0,
  forwardDistance: forwardDistance = 3,
} = {}) {
  const v176 =
    sceneMode === "scene"
      ? resolveSceneViewTargetGroundPoint(sceneViewTarget, groundY)
      : computeForwardPlacement({
          pose: v175,
          distance: forwardDistance,
          groundY: groundY,
        });
  if (sceneMode !== "scene") return v176;
  return (
    computeSceneCenterGroundPlacement({ pose: v175, groundY: groundY }) || v176
  );
}
export function resolveBatchPlacementOrigin(v177 = {}) {
  return resolveObjectPlacementPoint({ forwardDistance: 3.2, ...v177 });
}
export function computeGridPlacement({
  rows: rows = 1,
  cols: cols = 1,
  spacingX: spacingX = 1.8,
  spacingZ: spacingZ = 1.8,
  origin: origin = { x: 0, y: 0, z: 0 },
  yaw: yaw = 0,
} = {}) {
  const v178 = Math["max"](1, Math["round"](Number(rows) || 1)),
    v179 = Math["max"](1, Math["round"](Number(cols) || 1)),
    v180 = Math["max"](0.5, Number(spacingX) || 1.8),
    v181 = Math["max"](0.5, Number(spacingZ) || 1.8),
    v182 = normalizeVector3(origin, { x: 0, y: 0, z: 0 }),
    v183 = forwardVectorFromYawPitch(yaw, 0),
    v184 = lengthXZ(v183),
    v185 =
      v184 > 0.0001
        ? { x: v183["x"] / v184, y: 0, z: v183["z"] / v184 }
        : { x: 0, y: 0, z: 1 },
    v186 = { x: v185["z"], y: 0, z: -v185["x"] },
    v187 = [];
  for (let v188 = 0; v188 < v178; v188++) {
    for (let v189 = 0; v189 < v179; v189++) {
      const v190 = (v189 - (v179 - 1) / 2) * v180,
        v191 = (v188 - (v178 - 1) / 2) * v181;
      v187["push"]({
        x: v182["x"] + v186["x"] * v190 + v185["x"] * v191,
        y: v182["y"],
        z: v182["z"] + v186["z"] * v190 + v185["z"] * v191,
      });
    }
  }
  return v187;
}
export function cameraPoseToSceneView(v192, v193 = 8) {
  const v194 = normalizeVector3(v192?.["position"], { x: 0, y: 1.6, z: 4 }),
    v195 = resolvePoseForwardVector(v192, { x: 0, y: 0, z: -1 }),
    v196 = Math["max"](SCENE_ORBIT_DISTANCE_MIN, Number(v193) || 8),
    v197 = Math["hypot"](v195["x"], v195["y"], v195["z"]) || 1,
    v198 = { x: v195["x"] / v197, y: v195["y"] / v197, z: v195["z"] / v197 },
    v199 = {
      x: v194["x"] + v198["x"] * v196,
      y: v194["y"] + v198["y"] * v196,
      z: v194["z"] + v198["z"] * v196,
    },
    v200 = Math["atan2"](-v198["x"], -v198["z"]),
    v201 = Math["asin"](clamp(-v198["y"], -1, 1));
  return {
    target: v199,
    orbitYaw: normalizeAngle(v200),
    orbitPitch: clampSceneOrbitPitch(v201),
    orbitDistance: v196,
  };
}
export function cameraPoseToSceneViewFromReference(v202, v203) {
  const v204 = normalizeVector3(v202?.["position"], { x: 0, y: 1.6, z: 4 }),
    v205 = normalizeVector3(v203?.["target"], { x: 0, y: 1.2, z: 0 }),
    v206 = clamp(
      Number(v203?.["orbitDistance"]) || 8,
      SCENE_ORBIT_DISTANCE_MIN,
      SCENE_ORBIT_DISTANCE_MAX,
    ),
    v207 = resolvePoseForwardVector(v202, { x: 0, y: 0, z: -1 }),
    v208 = normalize3(v207, { x: 0, y: 0, z: -1 }),
    v209 = dot(subtract(v205, v204), v208),
    v210 =
      Number["isFinite"](v209) && v209 > SCENE_ORBIT_DISTANCE_MIN
        ? clamp(v209, SCENE_ORBIT_DISTANCE_MIN, SCENE_ORBIT_DISTANCE_MAX)
        : v206,
    v211 = {
      x: v204["x"] + v208["x"] * v210,
      y: v204["y"] + v208["y"] * v210,
      z: v204["z"] + v208["z"] * v210,
    },
    v212 = Math["atan2"](-v208["x"], -v208["z"]),
    v213 = Math["asin"](clamp(-v208["y"], -1, 1));
  return {
    target: v211,
    orbitYaw: normalizeAngle(v212),
    orbitPitch: clampSceneOrbitPitch(v213),
    orbitDistance: v210,
  };
}
export function cameraPoseToPanoramaView(v214) {
  const v215 = resolvePoseForwardVector(v214, { x: 0, y: 0, z: -1 }),
    v216 = Math["hypot"](v215["x"], v215["y"], v215["z"]) || 1,
    v217 = { x: v215["x"] / v216, y: v215["y"] / v216, z: v215["z"] / v216 };
  return {
    yaw: normalizeAngle(Math["atan2"](v217["x"], v217["z"])),
    pitch: clampPanoramaPitch(Math["asin"](clamp(v217["y"], -1, 1))),
    fov: clamp(
      Number(v214?.["fov"]) || PANORAMA_FOV_DEFAULT,
      PANORAMA_FOV_MIN,
      PANORAMA_FOV_MAX,
    ),
  };
}
export function computeConstrainedMoveDelta({
  startPoint: v218,
  currentPoint: v219,
  axis: v220,
  planeNormal: v221,
  mode: mode = "plane",
} = {}) {
  const v222 = normalizeVector3(v218, { x: 0, y: 0, z: 0 }),
    v223 = normalizeVector3(v219, v222),
    v224 = subtract(v223, v222);
  if (mode === "axis") {
    const v225 = normalize3(v220, { x: 1, y: 0, z: 0 }),
      v226 = dot(v224, v225);
    return scale(v225, v226);
  }
  return subtractProjection(v224, v221);
}
export function computeSignedRotationDelta({
  startPoint: v227,
  currentPoint: v228,
  pivot: v229,
  axis: v230,
} = {}) {
  const v231 = normalizeVector3(v229, { x: 0, y: 0, z: 0 }),
    v232 = normalize3(v230, { x: 0, y: 1, z: 0 }),
    v233 = subtractProjection(subtract(v227, v231), v232),
    v234 = subtractProjection(subtract(v228, v231), v232),
    v235 = safeLength(v233),
    v236 = safeLength(v234);
  if (v235 < 0.000001 || v236 < 0.000001) return 0;
  const v237 = scale(v233, 1 / v235),
    v238 = scale(v234, 1 / v236),
    v239 = cross(v237, v238),
    v240 = dot(v239, v232),
    v241 = clamp(dot(v237, v238), -1, 1);
  return Math["atan2"](v240, v241);
}
export function computeAxisScaleFactor({
  startPoint: v242,
  currentPoint: v243,
  pivot: v244,
  axis: v245,
  dragDirection: dragDirection = null,
  referenceDistance: referenceDistance = 1,
} = {}) {
  const v246 = normalize3(dragDirection || v245, { x: 1, y: 0, z: 0 }),
    v247 = normalizeVector3(v244, { x: 0, y: 0, z: 0 }),
    v248 = subtract(normalizeVector3(v242, { x: 0, y: 0, z: 0 }), v247),
    v249 = subtract(normalizeVector3(v243, { x: 0, y: 0, z: 0 }), v247),
    v250 = dot(v249, v246) - dot(v248, v246),
    v251 = Math["max"](0.2, Number(referenceDistance) || 1);
  return clamp(1 + v250 / v251, 0.01, 8);
}
export function computeAxisScaleFactorFromScreenDelta({
  startX: startX = 0,
  startY: startY = 0,
  currentX: currentX = 0,
  currentY: currentY = 0,
  axisDirection: v252,
  referencePixels: referencePixels = 96,
} = {}) {
  const v253 = Number(v252?.["x"]),
    v254 = Number(v252?.["y"]),
    v255 = Math["hypot"](v253, v254);
  if (!Number["isFinite"](v255) || v255 < 0.000001) return 1;
  const v256 = (Number(currentX) || 0) - (Number(startX) || 0),
    v257 = (Number(currentY) || 0) - (Number(startY) || 0),
    v258 = (v256 * v253 + v257 * v254) / v255,
    v259 = Math["max"](12, Number(referencePixels) || 96);
  return clamp(1 + v258 / v259, 0.01, 8);
}
export function computeUniformScaleFactor({
  startPoint: v260,
  currentPoint: v261,
  pivot: v262,
  minDistance: minDistance = 0.2,
} = {}) {
  const v263 = normalizeVector3(v262, { x: 0, y: 0, z: 0 }),
    v264 = Math["max"](
      Number(minDistance) || 0.2,
      safeLength(subtract(v260, v263)),
    ),
    v265 = Math["max"](0.0001, safeLength(subtract(v261, v263)));
  return clamp(v265 / v264, 0.01, 8);
}
