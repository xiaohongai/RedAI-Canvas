import * as threeRuntime from "./threeRuntime.js";
import {
  PANORAMA_SCENE_CAMERA_CONSTRAINTS,
  SCENE_DEFAULT_FOCAL_LENGTH_MM,
  SCENE_FOCAL_LENGTH_MAX_MM,
  SCENE_FOCAL_LENGTH_MIN_MM,
  computeAxisScaleFactor,
  computeAxisScaleFactorFromScreenDelta,
  focalLengthToFov,
  fovToFocalLength,
  computeConstrainedMoveDelta,
  computeSignedRotationDelta,
  computeStableGridSnap,
  dampAngle,
  dampScalar,
  forwardVectorFromYawPitch,
  computeUniformScaleFactor,
  cameraPoseToSceneViewFromReference,
  normalizeAngle,
  resolvePanoramaViewPose,
  resolveSceneCameraPose,
} from "../../core/panoramaSceneMath.js";
import { PANORAMA_SCENE_COLOR_TOKENS } from "./sceneNode.js";
import {
  createPanoramaCharacterModelInstance,
  resolvePanoramaCharacterGender,
} from "./characterModelRegistry.js";
import {
  applySelectionEmphasis,
  clamp01,
  createSelectionRing,
  normalizePanoramaTextureUrl,
  resolveThemeColor,
  resolveThemeColorValue,
} from "./scene3dTheme.js";
import { resolveAxisScreenDragMetric } from "./scene3dScreenProjection.js";
const GRID_MINOR_STEP = 1,
  GRID_MAJOR_STEP = 10,
  GRID_BASE_SPAN = 220,
  GRID_SNAP_HYSTERESIS = 0.12,
  VIEW_DAMPING_TIME_CONSTANT_MS = 120,
  VIEW_DAMPING_WINDOW_MS = 220,
  VIEW_DAMPING_MAX_DT_MS = 64,
  POSE_SETTLE_EPSILON = 0.0005,
  GIZMO_BASE_AXIS_LENGTH = 1.35,
  GIZMO_BASE_SCALE_LENGTH = 1.22,
  GIZMO_BASE_ROTATE_RADIUS = GIZMO_BASE_SCALE_LENGTH * 0.5,
  GIZMO_BASE_PLANE_OFFSET = 0.38,
  GIZMO_BASE_PLANE_SIZE = 0.42,
  GIZMO_MOVE_SHAFT_LENGTH = 1.2,
  GIZMO_MOVE_HEAD_LENGTH = 0.18,
  GIZMO_MOVE_PICK_LENGTH = 1.6,
  GIZMO_SCALE_SHAFT_LENGTH = 1.05,
  GIZMO_SCALE_HEAD_SIZE = 0.135,
  GIZMO_SCALE_PICK_LENGTH = 1.5,
  GIZMO_MARGIN_WORLD_MIN = 0.12,
  GIZMO_MARGIN_WORLD_RATIO = 0.12,
  DEFAULT_BG_FALLBACK = { day: "--white-90", night: "--bg" };
function createLineGeometry(v0, v1) {
  return new threeRuntime["BufferGeometry"]()["setFromPoints"]([v0, v1]);
}
function setLineGeometryPoints(v2, v3, v4) {
  if (!v2?.["geometry"]) return;
  const v5 = v3?.["isVector3"] ? v3 : toVector3Like(v3),
    v6 = v4?.["isVector3"] ? v4 : toVector3Like(v4),
    v7 = v2["geometry"]["getAttribute"]("position");
  if (!v7 || v7["count"] < 2) {
    (v2["geometry"]["dispose"]?.(),
      (v2["geometry"] = createLineGeometry(v5, v6)));
    return;
  }
  (v7["setXYZ"](0, v5["x"], v5["y"], v5["z"]),
    v7["setXYZ"](1, v6["x"], v6["y"], v6["z"]),
    (v7["needsUpdate"] = true),
    v2["geometry"]["computeBoundingSphere"]?.(),
    v2["geometry"]["computeBoundingBox"]?.());
}
function configureGizmoMaterial(
  v8,
  { transparent: transparent = false, opacity: opacity = 1 } = {},
) {
  if (!v8) return v8;
  v8["transparent"] = transparent;
  if ("opacity" in v8) v8["opacity"] = opacity;
  return (
    (v8["depthWrite"] = false),
    (v8["depthTest"] = false),
    (v8["toneMapped"] = false),
    (v8["fog"] = false),
    v8
  );
}
function configureGizmoObject(v9) {
  if (!v9) return v9;
  return ((v9["frustumCulled"] = false), (v9["renderOrder"] = 100), v9);
}
function orientAxisHead(v10, v11) {
  if (!v10) return;
  v10["rotation"]["set"](0, 0, 0);
  if (v11 === "x") v10["rotation"]["z"] = -Math["PI"] / 2;
  if (v11 === "z") v10["rotation"]["x"] = Math["PI"] / 2;
}
function setAxisLineEnd(v12, v13, v14) {
  if (!v12?.["geometry"]) return;
  const v15 = vectorFromAxisName(v13),
    v16 = Math["max"](0, Number(v14) || 0),
    v17 = v12["geometry"]["getAttribute"]("position");
  if (!v17 || v17["count"] < 2) return;
  (v17["setXYZ"](0, 0, 0, 0),
    v17["setXYZ"](1, v15["x"] * v16, v15["y"] * v16, v15["z"] * v16),
    (v17["needsUpdate"] = true),
    v12["geometry"]["computeBoundingSphere"]?.(),
    v12["geometry"]["computeBoundingBox"]?.());
}
function setAxisHandleLayout(v18, v19, v20 = 0) {
  if (!v18) return;
  const v21 = v18["userData"]?.["axisName"] || v18["axisName"];
  if (!v21) return;
  const v22 = vectorFromAxisName(v21),
    v23 = Math["max"](0, Number(v19) || 0),
    v24 = Number(v20) || 0;
  v18["position"]["copy"](v22["multiplyScalar"](v23 + v24));
}
function createMoveAxis(v25, v26) {
  const v27 = v25["isColor"] ? v25["clone"]() : new threeRuntime["Color"](v25),
    v28 = vectorFromAxisName(v26),
    v29 = new threeRuntime["Group"]();
  configureGizmoObject(v29);
  const v30 = configureGizmoMaterial(
      new threeRuntime["LineBasicMaterial"]({
        color: v27["clone"](),
        transparent: true,
        opacity: 0.96,
      }),
      { transparent: true, opacity: 0.96 },
    ),
    v31 = new threeRuntime["Line"](
      createLineGeometry(
        new threeRuntime["Vector3"](0, 0, 0),
        v28["clone"]()["multiplyScalar"](GIZMO_MOVE_SHAFT_LENGTH),
      ),
      v30,
    );
  (configureGizmoObject(v31), v29["add"](v31));
  const v32 = configureGizmoMaterial(
      new threeRuntime["MeshBasicMaterial"]({
        color: v27["clone"](),
        transparent: true,
        opacity: 0.98,
      }),
      { transparent: true, opacity: 0.98 },
    ),
    v33 = new threeRuntime["Mesh"](
      new threeRuntime["ConeGeometry"](0.06, GIZMO_MOVE_HEAD_LENGTH, 14),
      v32,
    );
  ((v33["userData"]["axisName"] = v26),
    setAxisHandleLayout(
      v33,
      GIZMO_BASE_AXIS_LENGTH - GIZMO_MOVE_HEAD_LENGTH * 0.5,
      GIZMO_MOVE_HEAD_LENGTH * 0.5,
    ),
    orientAxisHead(v33, v26),
    configureGizmoObject(v33),
    v29["add"](v33));
  const v34 = new threeRuntime["Mesh"](
    new threeRuntime["CylinderGeometry"](
      0.14,
      0.14,
      GIZMO_MOVE_PICK_LENGTH,
      10,
    ),
    configureGizmoMaterial(
      new threeRuntime["MeshBasicMaterial"]({
        color: 16777215,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      { transparent: true, opacity: 0 },
    ),
  );
  return (
    (v34["userData"]["axisName"] = v26),
    setAxisHandleLayout(v34, GIZMO_MOVE_PICK_LENGTH * 0.5),
    orientAxisHead(v34, v26),
    configureGizmoObject(v34),
    v29["add"](v34),
    {
      axisName: v26,
      axis: v28["clone"](),
      group: v29,
      shaftLine: v31,
      headMesh: v33,
      visuals: [
        { material: v30, color: v27["clone"](), opacity: 1 },
        { material: v32, color: v27["clone"](), opacity: 1 },
      ],
      pickMesh: v34,
    }
  );
}
function createScaleAxis(v35, v36) {
  const v37 = v35["isColor"] ? v35["clone"]() : new threeRuntime["Color"](v35),
    v38 = vectorFromAxisName(v36),
    v39 = new threeRuntime["Group"]();
  configureGizmoObject(v39);
  const v40 = configureGizmoMaterial(
      new threeRuntime["LineBasicMaterial"]({
        color: v37["clone"](),
        transparent: true,
        opacity: 0.96,
      }),
      { transparent: true, opacity: 0.96 },
    ),
    v41 = new threeRuntime["Line"](
      createLineGeometry(
        new threeRuntime["Vector3"](0, 0, 0),
        v38["clone"]()["multiplyScalar"](GIZMO_SCALE_SHAFT_LENGTH),
      ),
      v40,
    );
  (configureGizmoObject(v41), v39["add"](v41));
  const v42 = configureGizmoMaterial(
      new threeRuntime["MeshBasicMaterial"]({
        color: v37["clone"](),
        transparent: true,
        opacity: 0.98,
      }),
      { transparent: true, opacity: 0.98 },
    ),
    v43 = new threeRuntime["Mesh"](
      new threeRuntime["BoxGeometry"](
        GIZMO_SCALE_HEAD_SIZE,
        GIZMO_SCALE_HEAD_SIZE,
        GIZMO_SCALE_HEAD_SIZE,
      ),
      v42,
    );
  ((v43["userData"]["axisName"] = v36),
    setAxisHandleLayout(
      v43,
      GIZMO_BASE_SCALE_LENGTH - GIZMO_SCALE_HEAD_SIZE * 0.5,
      GIZMO_SCALE_HEAD_SIZE * 0.5,
    ),
    orientAxisHead(v43, v36),
    configureGizmoObject(v43),
    v39["add"](v43));
  const v44 = new threeRuntime["Mesh"](
    new threeRuntime["CylinderGeometry"](
      0.14,
      0.14,
      GIZMO_SCALE_PICK_LENGTH,
      10,
    ),
    configureGizmoMaterial(
      new threeRuntime["MeshBasicMaterial"]({
        color: 16777215,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      { transparent: true, opacity: 0 },
    ),
  );
  return (
    (v44["userData"]["axisName"] = v36),
    setAxisHandleLayout(v44, GIZMO_SCALE_PICK_LENGTH * 0.5),
    orientAxisHead(v44, v36),
    configureGizmoObject(v44),
    v39["add"](v44),
    {
      axisName: v36,
      axis: v38["clone"](),
      group: v39,
      shaftLine: v41,
      headMesh: v43,
      visuals: [
        { material: v40, color: v37["clone"](), opacity: 1 },
        { material: v42, color: v37["clone"](), opacity: 1 },
      ],
      pickMesh: v44,
    }
  );
}
function createRotateRing(v45, v46) {
  const v47 = v45["isColor"] ? v45["clone"]() : new threeRuntime["Color"](v45),
    v48 = new threeRuntime["Group"]();
  configureGizmoObject(v48);
  const v49 = configureGizmoMaterial(
      new threeRuntime["MeshBasicMaterial"]({
        color: v47["clone"](),
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
      }),
      { transparent: true, opacity: 0.86 },
    ),
    v50 = new threeRuntime["Mesh"](
      new threeRuntime["TorusGeometry"](GIZMO_BASE_ROTATE_RADIUS, 0.016, 8, 64),
      v49,
    );
  if (v46 === "x") v50["rotation"]["y"] = Math["PI"] / 2;
  else v46 === "y" && (v50["rotation"]["x"] = Math["PI"] / 2);
  (configureGizmoObject(v50), v48["add"](v50));
  const v51 = new threeRuntime["Mesh"](
    new threeRuntime["TorusGeometry"](GIZMO_BASE_ROTATE_RADIUS, 0.11, 8, 64),
    configureGizmoMaterial(
      new threeRuntime["MeshBasicMaterial"]({
        color: 16777215,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      { transparent: true, opacity: 0 },
    ),
  );
  return (
    v51["rotation"]["copy"](v50["rotation"]),
    configureGizmoObject(v51),
    v48["add"](v51),
    {
      axisName: v46,
      group: v48,
      visuals: [{ material: v49, color: v47["clone"](), opacity: 0.9 }],
      pickMesh: v51,
    }
  );
}
function getPlaneCornerMetrics(v52 = GIZMO_BASE_PLANE_SIZE, v53 = 0) {
  const v54 = v52 * 0.56,
    v55 = Math["max"](v52 * 0.065, 0.012),
    v56 = v52 * 0.06,
    v57 = v52 * 0.5 - v56,
    v58 = v57 - v54,
    v59 = (v57 + v58) * 0.5,
    v60 = v55 * 0.5 + v53,
    v61 = v54 * 0.46 - v53 * 0.35;
  return {
    armLength: v54,
    armThickness: v55,
    cornerInset: v56,
    outer: v57,
    inner: v58,
    armCenter: v59,
    halfThickness: v60,
    diagonalStart: Math["max"](v58, v58 + v61),
    diagonalEnd: Math["max"](v58, v58 + v61),
  };
}
function createPlaneCornerPickGeometry(v62 = GIZMO_BASE_PLANE_SIZE) {
  const v63 = Math["max"](v62 * 0.018, 0.006),
    v64 = getPlaneCornerMetrics(v62, v63),
    v65 = new threeRuntime["Shape"]();
  return (
    v65["moveTo"](v64["inner"] - v63, v64["outer"] + v64["halfThickness"]),
    v65["lineTo"](
      v64["outer"] + v64["halfThickness"],
      v64["outer"] + v64["halfThickness"],
    ),
    v65["lineTo"](v64["outer"] + v64["halfThickness"], v64["inner"] - v63),
    v65["lineTo"](v64["outer"] - v64["halfThickness"], v64["inner"] - v63),
    v65["lineTo"](
      v64["outer"] - v64["halfThickness"],
      v64["diagonalEnd"] - v63,
    ),
    v65["lineTo"](
      v64["diagonalStart"] - v63,
      v64["outer"] - v64["halfThickness"],
    ),
    v65["lineTo"](v64["inner"] - v63, v64["outer"] - v64["halfThickness"]),
    v65["closePath"](),
    new threeRuntime["ShapeGeometry"](v65)
  );
}
function createPlaneCornerVisual(
  { horizontalColor: v66, verticalColor: v67 } = {},
  v68 = GIZMO_BASE_PLANE_SIZE,
) {
  const v69 = v66?.["isColor"]
      ? v66["clone"]()
      : v66
        ? new threeRuntime["Color"](v66)
        : resolveThemeColor("--white", "--white"),
    v70 = v67?.["isColor"]
      ? v67["clone"]()
      : v67
        ? new threeRuntime["Color"](v67)
        : resolveThemeColor("--white", "--white"),
    v71 = new threeRuntime["Group"]();
  configureGizmoObject(v71);
  const v72 = getPlaneCornerMetrics(v68),
    v73 = [],
    v74 = v69["clone"]()["lerp"](v70, 0.5),
    v75 = (v76, v77, v78, v79, v80) => {
      const v81 = configureGizmoMaterial(
          new threeRuntime["MeshBasicMaterial"]({
            color: v80["clone"](),
            transparent: true,
            opacity: 0.98,
            side: threeRuntime["DoubleSide"],
            depthWrite: false,
          }),
          { transparent: true, opacity: 0.98 },
        ),
        v82 = new threeRuntime["Mesh"](
          new threeRuntime["PlaneGeometry"](v76, v77),
          v81,
        );
      (v82["position"]["set"](v78, v79, 0),
        configureGizmoObject(v82),
        v71["add"](v82),
        v73["push"]({ material: v81, color: v80["clone"](), opacity: 0.98 }));
    };
  (v75(
    v72["armLength"],
    v72["armThickness"],
    v72["armCenter"],
    v72["outer"],
    v69,
  ),
    v75(
      v72["armThickness"],
      v72["armLength"],
      v72["outer"],
      v72["armCenter"],
      v70,
    ));
  {
    const v83 = configureGizmoMaterial(
        new threeRuntime["MeshBasicMaterial"]({
          color: v74["clone"](),
          transparent: true,
          opacity: 0.98,
          side: threeRuntime["DoubleSide"],
          depthWrite: false,
        }),
        { transparent: true, opacity: 0.98 },
      ),
      v84 = new threeRuntime["Mesh"](
        new threeRuntime["PlaneGeometry"](
          v72["armThickness"],
          v72["armThickness"],
        ),
        v83,
      );
    (v84["position"]["set"](v72["outer"], v72["outer"], 0),
      configureGizmoObject(v84),
      v71["add"](v84),
      v73["push"]({ material: v83, color: v74["clone"](), opacity: 0.98 }));
  }
  {
    const v85 = configureGizmoMaterial(
        new threeRuntime["MeshBasicMaterial"]({
          color: v74,
          transparent: true,
          opacity: 0.38,
          side: threeRuntime["DoubleSide"],
          depthWrite: false,
        }),
        { transparent: true, opacity: 0.38 },
      ),
      v86 = new threeRuntime["BufferGeometry"](),
      v87 = v72["armThickness"] * 0.5;
    (v86["setAttribute"](
      "position",
      new threeRuntime["Float32BufferAttribute"](
        [
          v72["diagonalStart"],
          v72["outer"] - v87,
          0,
          v72["outer"] - v87,
          v72["outer"] - v87,
          0,
          v72["outer"] - v87,
          v72["diagonalEnd"],
          0,
        ],
        3,
      ),
    ),
      v86["setIndex"]([0, 1, 2]),
      v86["computeVertexNormals"]());
    const v88 = new threeRuntime["Mesh"](v86, v85);
    (configureGizmoObject(v88),
      v71["add"](v88),
      v73["push"]({ material: v85, color: v74["clone"](), opacity: 0.38 }));
  }
  return { group: v71, visuals: v73 };
}
function createGizmoVisual() {
  const v89 = resolveThemeColor("--red", "--red"),
    v90 = resolveThemeColor("--green", "--green"),
    v91 = resolveThemeColor("--blue", "--blue"),
    v92 = new threeRuntime["Group"]();
  ((v92["visible"] = false), configureGizmoObject(v92));
  const v93 = new threeRuntime["Group"](),
    v94 = new Map(),
    v95 = [],
    v96 = {},
    v97 = {},
    v98 = {},
    v99 = {},
    v100 = {},
    v101 = createMoveAxis(v89, "x"),
    v102 = createMoveAxis(v90, "y"),
    v103 = createMoveAxis(v91, "z");
  (v93["add"](v101["group"]),
    v93["add"](v102["group"]),
    v93["add"](v103["group"]),
    (v96["x"] = v101),
    (v96["y"] = v102),
    (v96["z"] = v103),
    v94["set"]("axis-x", {
      key: "axis-x",
      mode: "axis",
      axis: "x",
      visuals: v101["visuals"],
    }),
    v94["set"]("axis-y", {
      key: "axis-y",
      mode: "axis",
      axis: "y",
      visuals: v102["visuals"],
    }),
    v94["set"]("axis-z", {
      key: "axis-z",
      mode: "axis",
      axis: "z",
      visuals: v103["visuals"],
    }),
    (v101["pickMesh"]["userData"]["gizmoHandleKey"] = "axis-x"),
    (v102["pickMesh"]["userData"]["gizmoHandleKey"] = "axis-y"),
    (v103["pickMesh"]["userData"]["gizmoHandleKey"] = "axis-z"),
    v95["push"](v101["pickMesh"], v102["pickMesh"], v103["pickMesh"]));
  const v104 = ({
    key: v105,
    group: v106,
    handleStore: v107,
    mode: mode = "plane",
    normalAxis: v108,
    offset: v109,
    horizontalColor: v110,
    verticalColor: v111,
    linkedAxes: v112,
    rotation: v113,
  }) => {
    const { group: v114, visuals: v115 } = createPlaneCornerVisual(
        { horizontalColor: v110, verticalColor: v111 },
        GIZMO_BASE_PLANE_SIZE,
      ),
      v116 = configureGizmoMaterial(
        new threeRuntime["MeshBasicMaterial"]({
          color: 16777215,
          transparent: true,
          opacity: 0,
          side: threeRuntime["DoubleSide"],
          depthWrite: false,
        }),
        { transparent: true, opacity: 0 },
      ),
      v117 = new threeRuntime["Mesh"](
        createPlaneCornerPickGeometry(GIZMO_BASE_PLANE_SIZE),
        v116,
      );
    (v114["position"]["copy"](v109),
      v117["position"]["copy"](v109),
      v113?.["x"] &&
        ((v114["rotation"]["x"] = v113["x"]),
        (v117["rotation"]["x"] = v113["x"])),
      v113?.["y"] &&
        ((v114["rotation"]["y"] = v113["y"]),
        (v117["rotation"]["y"] = v113["y"])),
      v113?.["z"] &&
        ((v114["rotation"]["z"] = v113["z"]),
        (v117["rotation"]["z"] = v113["z"])),
      configureGizmoObject(v114),
      configureGizmoObject(v117),
      (v117["userData"]["gizmoHandleKey"] = v105),
      v106["add"](v114),
      v106["add"](v117),
      v94["set"](v105, {
        key: v105,
        mode: mode,
        normalAxis: v108,
        linkedAxes: Array["isArray"](v112) ? [...v112] : [],
        visuals: v115,
      }),
      v95["push"](v117),
      (v107[v105] = { visualGroup: v114, pickMesh: v117 }));
  };
  (v104({
    key: "plane-xy",
    group: v93,
    handleStore: v99,
    normalAxis: "z",
    offset: new threeRuntime["Vector3"](0.38, 0.38, 0),
    horizontalColor: v91,
    verticalColor: v91,
    linkedAxes: ["x", "y"],
    rotation: null,
  }),
    v104({
      key: "plane-xz",
      group: v93,
      handleStore: v99,
      normalAxis: "y",
      offset: new threeRuntime["Vector3"](0.38, 0, 0.38),
      horizontalColor: v90,
      verticalColor: v90,
      linkedAxes: ["x", "z"],
      rotation: { x: -Math["PI"] / 2, z: -Math["PI"] / 2 },
    }),
    v104({
      key: "plane-yz",
      group: v93,
      handleStore: v99,
      normalAxis: "x",
      offset: new threeRuntime["Vector3"](0, 0.38, 0.38),
      horizontalColor: v89,
      verticalColor: v89,
      linkedAxes: ["y", "z"],
      rotation: { y: Math["PI"] / 2, z: Math["PI"] / 2 },
    }),
    v92["add"](v93));
  const v118 = new threeRuntime["Group"](),
    v119 = createRotateRing(v89, "x"),
    v120 = createRotateRing(v90, "y"),
    v121 = createRotateRing(v91, "z");
  (v118["add"](v119["group"]),
    v118["add"](v120["group"]),
    v118["add"](v121["group"]),
    (v98["x"] = v119),
    (v98["y"] = v120),
    (v98["z"] = v121),
    v94["set"]("rotate-x", {
      key: "rotate-x",
      mode: "rotate",
      axis: "x",
      visuals: v119["visuals"],
    }),
    v94["set"]("rotate-y", {
      key: "rotate-y",
      mode: "rotate",
      axis: "y",
      visuals: v120["visuals"],
    }),
    v94["set"]("rotate-z", {
      key: "rotate-z",
      mode: "rotate",
      axis: "z",
      visuals: v121["visuals"],
    }),
    (v119["pickMesh"]["userData"]["gizmoHandleKey"] = "rotate-x"),
    (v120["pickMesh"]["userData"]["gizmoHandleKey"] = "rotate-y"),
    (v121["pickMesh"]["userData"]["gizmoHandleKey"] = "rotate-z"),
    v95["push"](v119["pickMesh"], v120["pickMesh"], v121["pickMesh"]),
    v92["add"](v118));
  const v122 = new threeRuntime["Group"](),
    v123 = createScaleAxis(v89, "x"),
    v124 = createScaleAxis(v90, "y"),
    v125 = createScaleAxis(v91, "z");
  return (
    v122["add"](v123["group"]),
    v122["add"](v124["group"]),
    v122["add"](v125["group"]),
    (v97["x"] = v123),
    (v97["y"] = v124),
    (v97["z"] = v125),
    v94["set"]("scale-x", {
      key: "scale-x",
      mode: "scale-axis",
      axis: "x",
      visuals: v123["visuals"],
    }),
    v94["set"]("scale-y", {
      key: "scale-y",
      mode: "scale-axis",
      axis: "y",
      visuals: v124["visuals"],
    }),
    v94["set"]("scale-z", {
      key: "scale-z",
      mode: "scale-axis",
      axis: "z",
      visuals: v125["visuals"],
    }),
    (v123["pickMesh"]["userData"]["gizmoHandleKey"] = "scale-x"),
    (v124["pickMesh"]["userData"]["gizmoHandleKey"] = "scale-y"),
    (v125["pickMesh"]["userData"]["gizmoHandleKey"] = "scale-z"),
    v95["push"](v123["pickMesh"], v124["pickMesh"], v125["pickMesh"]),
    v104({
      key: "scale-plane-xy",
      group: v122,
      handleStore: v100,
      mode: "scale-uniform",
      normalAxis: "z",
      offset: new threeRuntime["Vector3"](0.38, 0.38, 0),
      horizontalColor: v91,
      verticalColor: v91,
      linkedAxes: ["x", "y"],
      rotation: null,
    }),
    v104({
      key: "scale-plane-xz",
      group: v122,
      handleStore: v100,
      mode: "scale-uniform",
      normalAxis: "y",
      offset: new threeRuntime["Vector3"](0.38, 0, 0.38),
      horizontalColor: v90,
      verticalColor: v90,
      linkedAxes: ["x", "z"],
      rotation: { x: -Math["PI"] / 2, z: -Math["PI"] / 2 },
    }),
    v104({
      key: "scale-plane-yz",
      group: v122,
      handleStore: v100,
      mode: "scale-uniform",
      normalAxis: "x",
      offset: new threeRuntime["Vector3"](0, 0.38, 0.38),
      horizontalColor: v89,
      verticalColor: v89,
      linkedAxes: ["y", "z"],
      rotation: { y: Math["PI"] / 2, z: Math["PI"] / 2 },
    }),
    v92["add"](v122),
    {
      root: v92,
      moveGroup: v93,
      rotateGroup: v118,
      scaleGroup: v122,
      handles: v94,
      pickMeshes: v95,
      hoverHandle: null,
      activeHandle: null,
      dragLock: null,
      currentTool: "move",
      moveAxes: v96,
      scaleAxes: v97,
      rotateRings: v98,
      planeHandles: v99,
      scalePlaneHandles: v100,
      baseLayout: {
        axisLength: GIZMO_BASE_AXIS_LENGTH,
        scaleLength: GIZMO_BASE_SCALE_LENGTH,
        rotateRadius: GIZMO_BASE_ROTATE_RADIUS,
        planeOffset: GIZMO_BASE_PLANE_OFFSET,
        planeSize: GIZMO_BASE_PLANE_SIZE,
      },
    }
  );
}
function eachMaterial(v126, v127) {
  if (!v126) return;
  if (Array["isArray"](v126)) {
    v126["forEach"]((v128) => v127(v128));
    return;
  }
  v127(v126);
}
function createMannequinVisual(v129) {
  const v130 = new threeRuntime["Group"](),
    v131 = new threeRuntime["Group"]();
  v130["add"](v131);
  const v132 = [],
    v133 = new threeRuntime["MeshStandardMaterial"]({
      color: v129,
      roughness: 0.62,
      metalness: 0.08,
    }),
    v134 = v133["clone"]();
  v134["color"] = v133["color"]["clone"]()["offsetHSL"](0, 0, 0.08);
  const v135 = new threeRuntime["Mesh"](
    new threeRuntime["SphereGeometry"](0.155, 18, 16),
    v134,
  );
  ((v135["position"]["y"] = 1.7),
    v135["scale"]["set"](0.96, 1.08, 0.94),
    v131["add"](v135),
    v132["push"](v135));
  const v136 = new threeRuntime["Mesh"](
    new threeRuntime["CylinderGeometry"](0.052, 0.064, 0.12, 12),
    v133,
  );
  ((v136["position"]["y"] = 1.51), v131["add"](v136), v132["push"](v136));
  const v137 = new threeRuntime["Mesh"](
    new threeRuntime["CapsuleGeometry"](0.17, 0.42, 6, 12),
    v133,
  );
  ((v137["position"]["y"] = 1.26),
    v137["scale"]["set"](1.38, 1.02, 0.92),
    v131["add"](v137),
    v132["push"](v137));
  const v138 = new threeRuntime["Mesh"](
    new threeRuntime["CapsuleGeometry"](0.105, 0.18, 5, 10),
    v133,
  );
  ((v138["position"]["y"] = 0.98),
    v138["scale"]["set"](1.02, 0.94, 0.86),
    v131["add"](v138),
    v132["push"](v138));
  const v139 = new threeRuntime["Mesh"](
    new threeRuntime["CapsuleGeometry"](0.14, 0.2, 5, 12),
    v133,
  );
  ((v139["position"]["y"] = 0.77),
    v139["scale"]["set"](1.28, 0.96, 0.98),
    v131["add"](v139),
    v132["push"](v139));
  const v140 = new threeRuntime["Mesh"](
    new threeRuntime["SphereGeometry"](0.07, 12, 12),
    v133,
  );
  (v140["position"]["set"](-0.31, 1.43, 0),
    v131["add"](v140),
    v132["push"](v140));
  const v141 = v140["clone"]();
  ((v141["position"]["x"] = 0.31), v131["add"](v141), v132["push"](v141));
  const v142 = new threeRuntime["Mesh"](
    new threeRuntime["CapsuleGeometry"](0.048, 0.28, 4, 10),
    v133,
  );
  (v142["position"]["set"](-0.39, 1.17, 0),
    (v142["rotation"]["z"] = 0.16),
    (v142["rotation"]["x"] = 0.03),
    v131["add"](v142),
    v132["push"](v142));
  const v143 = v142["clone"]();
  ((v143["position"]["x"] = 0.39),
    (v143["rotation"]["z"] = -0.16),
    (v143["rotation"]["x"] = -0.03),
    v131["add"](v143),
    v132["push"](v143));
  const v144 = new threeRuntime["Mesh"](
    new threeRuntime["CapsuleGeometry"](0.038, 0.26, 4, 10),
    v133,
  );
  (v144["position"]["set"](-0.42, 0.86, 0.01),
    (v144["rotation"]["z"] = 0.03),
    (v144["rotation"]["x"] = 0.04),
    v131["add"](v144),
    v132["push"](v144));
  const v145 = v144["clone"]();
  ((v145["position"]["x"] = 0.42),
    (v145["rotation"]["z"] = -0.03),
    (v145["rotation"]["x"] = -0.04),
    v131["add"](v145),
    v132["push"](v145));
  const v146 = new threeRuntime["Mesh"](
    new threeRuntime["SphereGeometry"](0.048, 10, 10),
    v133,
  );
  (v146["position"]["set"](-0.425, 0.62, 0.01),
    v146["scale"]["set"](0.9, 1, 0.72),
    v131["add"](v146),
    v132["push"](v146));
  const v147 = v146["clone"]();
  ((v147["position"]["x"] = 0.425), v131["add"](v147), v132["push"](v147));
  const v148 = new threeRuntime["Mesh"](
    new threeRuntime["CapsuleGeometry"](0.072, 0.34, 5, 12),
    v133,
  );
  (v148["position"]["set"](-0.12, 0.47, 0),
    (v148["rotation"]["z"] = 0.03),
    v131["add"](v148),
    v132["push"](v148));
  const v149 = v148["clone"]();
  ((v149["position"]["x"] = 0.12),
    (v149["rotation"]["z"] = -0.03),
    v131["add"](v149),
    v132["push"](v149));
  const v150 = new threeRuntime["Mesh"](
    new threeRuntime["CapsuleGeometry"](0.055, 0.34, 5, 12),
    v133,
  );
  (v150["position"]["set"](-0.12, 0.03, 0.01),
    v131["add"](v150),
    v132["push"](v150));
  const v151 = v150["clone"]();
  ((v151["position"]["x"] = 0.12), v131["add"](v151), v132["push"](v151));
  const v152 = new threeRuntime["Mesh"](
    new threeRuntime["BoxGeometry"](0.115, 0.075, 0.27),
    v133,
  );
  (v152["position"]["set"](-0.12, -0.19, 0.07),
    (v152["rotation"]["x"] = -0.08),
    v131["add"](v152),
    v132["push"](v152));
  const v153 = v152["clone"]();
  ((v153["position"]["x"] = 0.12), v131["add"](v153), v132["push"](v153));
  const v154 = createSelectionRing(8238335);
  return (
    v130["add"](v154),
    {
      group: v130,
      material: v133,
      headMaterial: v134,
      selectionRing: v154,
      proxyRoot: v131,
      fallbackObjects: v132,
      modelGender: null,
      modelLoadToken: 0,
      modelRoot: null,
      parts: {
        head: v135,
        neck: v136,
        chest: v137,
        waist: v138,
        pelvis: v139,
        shoulders: [v140, v141],
        upperArms: [v142, v143],
        lowerArms: [v144, v145],
        hands: [v146, v147],
        upperLegs: [v148, v149],
        lowerLegs: [v150, v151],
        feet: [v152, v153],
      },
    }
  );
}
function createCubeVisual(v155) {
  const v156 = new threeRuntime["Group"](),
    v157 = new threeRuntime["MeshStandardMaterial"]({
      color: v155,
      roughness: 0.42,
      metalness: 0.06,
    }),
    v158 = new threeRuntime["LineBasicMaterial"]({
      color: new threeRuntime["Color"](v155)
        ["clone"]()
        ["offsetHSL"](0, 0, -0.18),
      transparent: true,
      opacity: 0.9,
    }),
    v159 = new threeRuntime["Mesh"](
      new threeRuntime["BoxGeometry"](1, 1, 1),
      v157,
    );
  v156["add"](v159);
  const v160 = new threeRuntime["LineSegments"](
    new threeRuntime["EdgesGeometry"](new threeRuntime["BoxGeometry"](1, 1, 1)),
    v158,
  );
  v156["add"](v160);
  const v161 = createSelectionRing(8238335);
  return (
    v156["add"](v161),
    { group: v156, material: v157, edgeMaterial: v158, selectionRing: v161 }
  );
}
function setMannequinProxyMode(v162) {
  ((v162?.["fallbackObjects"] || [])["forEach"]((v163) => {
    v163["visible"] = true;
  }),
    [v162?.["material"], v162?.["headMaterial"]]["forEach"]((v164) => {
      if (!v164) return;
      ((v164["transparent"] = true),
        (v164["opacity"] = 0.001),
        (v164["depthWrite"] = false),
        (v164["colorWrite"] = false));
    }));
}
function createCharacterClayMaterial(v165) {
  return new threeRuntime["MeshStandardMaterial"]({
    color: v165?.["isColor"]
      ? v165["clone"]()
      : new threeRuntime["Color"](v165 || 16777215),
    roughness: 0.78,
    metalness: 0,
  });
}
function applyCharacterClayMaterial(v166, v167) {
  if (!v166?.["modelRoot"]) return;
  (!v166["modelMaterial"] &&
    ((v166["modelMaterial"] = createCharacterClayMaterial(v167)),
    v166["modelRoot"]["traverse"]((v168) => {
      if (!v168["isMesh"]) return;
      (disposeMaterial(v168["material"]),
        (v168["material"] = v166["modelMaterial"]));
    })),
    v166["modelMaterial"]["color"]["copy"](
      v167?.["isColor"] ? v167 : new threeRuntime["Color"](v167 || 16777215),
    ));
}
function applyObjectSelectionEmphasis(v169, v170, v171 = 0.12) {
  if (!v169) return;
  v169["traverse"]((v172) => {
    eachMaterial(v172["material"], (v173) => {
      applySelectionEmphasis(v173, v170, v171);
    });
  });
}
function createCameraVisual() {
  const v174 = new threeRuntime["Group"](),
    v175 = new threeRuntime["Group"]();
  v174["add"](v175);
  const v176 = new threeRuntime["LineBasicMaterial"]({
      color: resolveThemeColor("--white", "--white"),
      transparent: true,
      opacity: 0.8,
    }),
    v177 = new threeRuntime["LineBasicMaterial"]({
      color: resolveThemeColor("--blue", "--blue"),
      transparent: true,
      opacity: 0.8,
    }),
    v178 = (v179, v180, v181, v182) =>
      new threeRuntime["LineSegments"](
        new threeRuntime["EdgesGeometry"](
          new threeRuntime["BoxGeometry"](v179, v180, v181),
        ),
        v182,
      ),
    v183 = v178(0.26, 0.16, 0.14, v176);
  (v183["position"]["set"](0, 0, 0.075), v175["add"](v183));
  const v184 = v178(0.1, 0.045, 0.06, v176);
  (v184["position"]["set"](0, 0.102, 0.08), v175["add"](v184));
  const v185 = v178(0.06, 0.045, 0.08, v176);
  (v185["position"]["set"](-0.105, 0.05, 0.155), v175["add"](v185));
  const v186 = v178(0.12, 0.09, 0.02, v176);
  (v186["position"]["set"](0, 0, -0.01), v175["add"](v186));
  const v187 = new threeRuntime["BufferGeometry"]()["setFromPoints"]([
    new threeRuntime["Vector3"](-0.025, 0, 0),
    new threeRuntime["Vector3"](0.025, 0, 0),
    new threeRuntime["Vector3"](0, -0.025, 0),
    new threeRuntime["Vector3"](0, 0.025, 0),
  ]);
  v175["add"](new threeRuntime["LineSegments"](v187, v176));
  const v188 = new threeRuntime["Vector3"](0, 0, -0.02),
    v189 = 0.55,
    v190 = 0.18,
    v191 = 0.1,
    v192 = v188,
    v193 = new threeRuntime["Vector3"](
      v188["x"] - v190,
      v188["y"] + v191,
      v188["z"] - v189,
    ),
    v194 = new threeRuntime["Vector3"](
      v188["x"] + v190,
      v188["y"] + v191,
      v188["z"] - v189,
    ),
    v195 = new threeRuntime["Vector3"](
      v188["x"] - v190,
      v188["y"] - v191,
      v188["z"] - v189,
    ),
    v196 = new threeRuntime["Vector3"](
      v188["x"] + v190,
      v188["y"] - v191,
      v188["z"] - v189,
    ),
    v197 = new threeRuntime["BufferGeometry"]()["setFromPoints"]([
      v192,
      v193,
      v192,
      v194,
      v192,
      v195,
      v192,
      v196,
      v193,
      v194,
      v194,
      v196,
      v196,
      v195,
      v195,
      v193,
    ]),
    v198 = new threeRuntime["LineSegments"](v197, v177);
  return (
    v175["add"](v198),
    { group: v174, marker: v175, bodyMaterial: v176, helperLineMaterial: v177 }
  );
}
function applyGenderShape(v199, v200) {
  const v201 = v199?.["parts"];
  if (!v201) return;
  const [v202, v203] = v201["shoulders"] || [],
    [v204, v205] = v201["upperArms"] || [],
    [v206, v207] = v201["lowerArms"] || [],
    [v208, v209] = v201["hands"] || [],
    [v210, v211] = v201["upperLegs"] || [],
    [v212, v213] = v201["lowerLegs"] || [],
    [v214, v215] = v201["feet"] || [];
  if (v200 === "female") {
    (v201["head"]?.["scale"]["set"](0.94, 1.08, 0.92),
      v201["neck"]?.["scale"]["set"](0.92, 1, 0.92),
      v201["chest"]?.["scale"]["set"](1.2, 0.98, 0.82),
      v201["waist"]?.["scale"]["set"](0.84, 0.92, 0.72),
      v201["pelvis"]?.["scale"]["set"](1.38, 0.98, 1.08));
    if (v202) v202["position"]["set"](-0.27, 1.42, 0);
    if (v203) v203["position"]["set"](0.27, 1.42, 0);
    if (v204) v204["position"]["set"](-0.34, 1.14, 0);
    if (v205) v205["position"]["set"](0.34, 1.14, 0);
    if (v206) v206["position"]["set"](-0.37, 0.84, 0.01);
    if (v207) v207["position"]["set"](0.37, 0.84, 0.01);
    if (v208) v208["position"]["set"](-0.375, 0.59, 0.01);
    if (v209) v209["position"]["set"](0.375, 0.59, 0.01);
    v210 &&
      (v210["position"]["set"](-0.115, 0.45, 0),
      v210["scale"]["set"](0.94, 1, 0.94));
    v211 &&
      (v211["position"]["set"](0.115, 0.45, 0),
      v211["scale"]["set"](0.94, 1, 0.94));
    v212 &&
      (v212["position"]["set"](-0.115, 0.01, 0.01),
      v212["scale"]["set"](0.92, 1.02, 0.9));
    v213 &&
      (v213["position"]["set"](0.115, 0.01, 0.01),
      v213["scale"]["set"](0.92, 1.02, 0.9));
    if (v214) v214["scale"]["set"](0.88, 0.96, 0.95);
    if (v215) v215["scale"]["set"](0.88, 0.96, 0.95);
  } else {
    (v201["head"]?.["scale"]["set"](0.98, 1.08, 0.95),
      v201["neck"]?.["scale"]["set"](1.02, 1, 1.02),
      v201["chest"]?.["scale"]["set"](1.48, 1.04, 0.98),
      v201["waist"]?.["scale"]["set"](1.02, 0.96, 0.84),
      v201["pelvis"]?.["scale"]["set"](1.2, 0.94, 0.96));
    if (v202) v202["position"]["set"](-0.33, 1.44, 0);
    if (v203) v203["position"]["set"](0.33, 1.44, 0);
    if (v204) v204["position"]["set"](-0.42, 1.18, 0);
    if (v205) v205["position"]["set"](0.42, 1.18, 0);
    if (v206) v206["position"]["set"](-0.45, 0.87, 0.01);
    if (v207) v207["position"]["set"](0.45, 0.87, 0.01);
    if (v208) v208["position"]["set"](-0.455, 0.63, 0.01);
    if (v209) v209["position"]["set"](0.455, 0.63, 0.01);
    v210 &&
      (v210["position"]["set"](-0.125, 0.47, 0),
      v210["scale"]["set"](1.06, 1, 1.02));
    v211 &&
      (v211["position"]["set"](0.125, 0.47, 0),
      v211["scale"]["set"](1.06, 1, 1.02));
    v212 &&
      (v212["position"]["set"](-0.125, 0.03, 0.01),
      v212["scale"]["set"](1, 1, 1));
    v213 &&
      (v213["position"]["set"](0.125, 0.03, 0.01),
      v213["scale"]["set"](1, 1, 1));
    if (v214) v214["scale"]["set"](1, 1, 1);
    if (v215) v215["scale"]["set"](1, 1, 1);
  }
}
function disposeMaterial(v216) {
  if (!v216) return;
  if (Array["isArray"](v216)) {
    v216["forEach"](disposeMaterial);
    return;
  }
  (v216["map"] && (v216["map"]["dispose"](), (v216["map"] = null)),
    v216["dispose"]?.());
}
function disposeObject3D(v217) {
  v217["traverse"]((v218) => {
    (v218["geometry"]?.["dispose"]?.(), disposeMaterial(v218["material"]));
  });
}
function vectorFromAxisName(v219) {
  if (v219 === "x") return new threeRuntime["Vector3"](1, 0, 0);
  if (v219 === "y") return new threeRuntime["Vector3"](0, 1, 0);
  return new threeRuntime["Vector3"](0, 0, 1);
}
function toVector3Like(v220, v221 = { x: 0, y: 0, z: 0 }) {
  return new threeRuntime["Vector3"](
    Number["isFinite"](Number(v220?.["x"]))
      ? Number(v220["x"])
      : Number(v221?.["x"]) || 0,
    Number["isFinite"](Number(v220?.["y"]))
      ? Number(v220["y"])
      : Number(v221?.["y"]) || 0,
    Number["isFinite"](Number(v220?.["z"]))
      ? Number(v220["z"])
      : Number(v221?.["z"]) || 0,
  );
}
function toEulerLike(v222, v223 = { x: 0, y: 0, z: 0 }, v224 = "XYZ") {
  return new threeRuntime["Euler"](
    Number["isFinite"](Number(v222?.["x"]))
      ? Number(v222["x"])
      : Number(v223?.["x"]) || 0,
    Number["isFinite"](Number(v222?.["y"]))
      ? Number(v222["y"])
      : Number(v223?.["y"]) || 0,
    Number["isFinite"](Number(v222?.["z"]))
      ? Number(v222["z"])
      : Number(v223?.["z"]) || 0,
    v224,
  );
}
function toScaleVector(v225) {
  if (Number["isFinite"](v225)) {
    const v226 = Math["max"](0.01, Number(v225) || 1);
    return { x: v226, y: v226, z: v226 };
  }
  if (
    v225 &&
    Number["isFinite"](v225["x"]) &&
    Number["isFinite"](v225["y"]) &&
    Number["isFinite"](v225["z"])
  )
    return {
      x: Math["max"](0.01, Number(v225["x"]) || 1),
      y: Math["max"](0.01, Number(v225["y"]) || 1),
      z: Math["max"](0.01, Number(v225["z"]) || 1),
    };
  return { x: 1, y: 1, z: 1 };
}
function applyGroupScale(v227, v228) {
  const v229 = toScaleVector(v228);
  v227["scale"]["set"](v229["x"], v229["y"], v229["z"]);
}
function applyGroupTransform(v230, v231) {
  v230["position"]["set"](
    Number(v231?.["position"]?.["x"]) || 0,
    Number(v231?.["position"]?.["y"]) || 0,
    Number(v231?.["position"]?.["z"]) || 0,
  );
  if (hasFiniteQuaternion(v231?.["quaternion"])) {
    const v232 = normalizeQuaternionData(v231["quaternion"], {
      x: 0,
      y: 0,
      z: 0,
      w: 1,
    });
    v230["quaternion"]["set"](v232["x"], v232["y"], v232["z"], v232["w"]);
    return;
  }
  v230["rotation"]["set"](
    Number(v231?.["rotation"]?.["x"]) || 0,
    Number(v231?.["rotation"]?.["y"]) || 0,
    Number(v231?.["rotation"]?.["z"]) || 0,
  );
}
function hasFiniteQuaternion(v233) {
  return (
    Number["isFinite"](Number(v233?.["x"])) &&
    Number["isFinite"](Number(v233?.["y"])) &&
    Number["isFinite"](Number(v233?.["z"])) &&
    Number["isFinite"](Number(v233?.["w"]))
  );
}
function normalizeQuaternionData(v234, v235 = { x: 0, y: 0, z: 0, w: 1 }) {
  const v236 = Number(v234?.["x"]),
    v237 = Number(v234?.["y"]),
    v238 = Number(v234?.["z"]),
    v239 = Number(v234?.["w"]);
  if (
    !Number["isFinite"](v236) ||
    !Number["isFinite"](v237) ||
    !Number["isFinite"](v238) ||
    !Number["isFinite"](v239)
  )
    return { ...v235 };
  const v240 = Math["hypot"](v236, v237, v238, v239);
  if (v240 < 0.000001) return { ...v235 };
  return { x: v236 / v240, y: v237 / v240, z: v238 / v240, w: v239 / v240 };
}
function toQuaternionFromPose(
  v241,
  v242 = { x: 0, y: 0, z: 0, w: 1 },
  v243 = "XYZ",
) {
  if (hasFiniteQuaternion(v241?.["quaternion"])) {
    const v244 = normalizeQuaternionData(v241["quaternion"], v242);
    return new threeRuntime["Quaternion"](
      v244["x"],
      v244["y"],
      v244["z"],
      v244["w"],
    );
  }
  const v245 = toEulerLike(v241?.["rotation"], { x: 0, y: 0, z: 0 }, v243);
  return new threeRuntime["Quaternion"]()["setFromEuler"](v245);
}
function composeMatrixFromPose(v246 = {}, v247 = "XYZ") {
  const v248 = toVector3Like(v246?.["position"], { x: 0, y: 0, z: 0 }),
    v249 = toQuaternionFromPose(v246, { x: 0, y: 0, z: 0, w: 1 }, v247),
    v250 = toVector3Like(toScaleVector(v246?.["scale"]), { x: 1, y: 1, z: 1 });
  return new threeRuntime["Matrix4"]()["compose"](v248, v249, v250);
}
function quaternionFromRotationYXZ(v251) {
  const v252 = new threeRuntime["Quaternion"]()["setFromEuler"](
    new threeRuntime["Euler"](
      Number(v251?.["x"]) || 0,
      Number(v251?.["y"]) || 0,
      Number(v251?.["z"]) || 0,
      "YXZ",
    ),
  );
  return normalizeQuaternionData(v252);
}
function resolveObjectPivot(v253, v254) {
  if (
    Number["isFinite"](Number(v253?.["pivot"]?.["x"])) &&
    Number["isFinite"](Number(v253?.["pivot"]?.["y"])) &&
    Number["isFinite"](Number(v253?.["pivot"]?.["z"]))
  )
    return toVector3Like(v253["pivot"]);
  if (v253) {
    const v255 = composeMatrixFromPose(v253),
      v256 = new threeRuntime["Vector3"]();
    return (v256["setFromMatrixPosition"](v255), v256);
  }
  if (v254?.["group"]) {
    const v257 = new threeRuntime["Vector3"]();
    return (v254["group"]["getWorldPosition"](v257), v257);
  }
  return new threeRuntime["Vector3"]();
}
function resolveActiveTransformTool(v258) {
  const v259 = String(v258?.["ui"]?.["transformTool"] || "")["trim"]();
  if (v259 === "move" || v259 === "rotate" || v259 === "scale") return v259;
  const v260 = String(v258?.["ui"]?.["activeTool"] || "")["trim"]();
  if (v260 === "move" || v260 === "rotate" || v260 === "scale") return v260;
  return "move";
}
function resolveObjectOrientationQuaternion(v261, v262) {
  if (v262?.["group"]) {
    const v263 = new threeRuntime["Quaternion"]();
    return (v262["group"]["getWorldQuaternion"](v263), v263);
  }
  return toQuaternionFromPose(v261, { x: 0, y: 0, z: 0, w: 1 });
}
function areOrientationQuaternionsAligned(v264, v265, v266 = 0.00001) {
  if (!v264 || !v265) return false;
  const v267 = Math["abs"](
    (Number(v264["x"]) || 0) * (Number(v265["x"]) || 0) +
      (Number(v264["y"]) || 0) * (Number(v265["y"]) || 0) +
      (Number(v264["z"]) || 0) * (Number(v265["z"]) || 0) +
      (Number(v264["w"]) || 0) * (Number(v265["w"]) || 0),
  );
  return Math["abs"](1 - v267) <= v266;
}
function resolveSelectionGizmoOrientation(v268, v269, v270) {
  const v271 =
    v269?.["orientationQuaternion"]?.["clone"]?.() ||
    new threeRuntime["Quaternion"]();
  if (!v270) return { orientationQuaternion: v271, usesLocalOrientation: true };
  const v272 =
    v268["length"] > 0 &&
    v268["every"]((v273) =>
      areOrientationQuaternionsAligned(v271, v273["orientationQuaternion"]),
    );
  return {
    orientationQuaternion: v272 ? v271 : new threeRuntime["Quaternion"](),
    usesLocalOrientation: v272,
  };
}
function rotationFromQuaternionYXZ(v274) {
  const v275 = normalizeQuaternionData(v274),
    v276 = new threeRuntime["Euler"]()["setFromQuaternion"](
      new threeRuntime["Quaternion"](
        v275["x"],
        v275["y"],
        v275["z"],
        v275["w"],
      ),
      "YXZ",
    );
  return { x: v276["x"], y: v276["y"], z: v276["z"] };
}
function normalizeCameraPoseData(v277 = {}) {
  const v278 = {
      x: Number(v277?.["position"]?.["x"]) || 0,
      y: Number(v277?.["position"]?.["y"]) || 0,
      z: Number(v277?.["position"]?.["z"]) || 0,
    },
    v279 = hasFiniteQuaternion(v277?.["quaternion"]),
    v280 = v279
      ? normalizeQuaternionData(
          v277["quaternion"],
          quaternionFromRotationYXZ(v277?.["rotation"]),
        )
      : quaternionFromRotationYXZ(v277?.["rotation"]),
    v281 = v279
      ? rotationFromQuaternionYXZ(v280)
      : {
          x: Number(v277?.["rotation"]?.["x"]) || 0,
          y: Number(v277?.["rotation"]?.["y"]) || 0,
          z: Number(v277?.["rotation"]?.["z"]) || 0,
        };
  return {
    position: v278,
    quaternion: v280,
    rotation: v281,
    fov: Number["isFinite"](Number(v277?.["fov"]))
      ? Number(v277["fov"])
      : focalLengthToFov(
          Object["prototype"]["hasOwnProperty"]["call"](
            v277 || {},
            "focalLength",
          )
            ? v277["focalLength"]
            : SCENE_DEFAULT_FOCAL_LENGTH_MM,
        ),
    focalLength: Object["prototype"]["hasOwnProperty"]["call"](
      v277 || {},
      "focalLength",
    )
      ? Number(v277["focalLength"]) || SCENE_DEFAULT_FOCAL_LENGTH_MM
      : Number["isFinite"](Number(v277?.["fov"]))
        ? fovToFocalLength(v277["fov"])
        : SCENE_DEFAULT_FOCAL_LENGTH_MM,
  };
}
function collectSelectedObjects(v282) {
  const v283 = Array["isArray"](v282?.["cubes"]) ? v282["cubes"] : [],
    v284 = Array["isArray"](v282?.["mannequins"]) ? v282["mannequins"] : [],
    v285 = new Set(v283["map"]((v286) => v286["id"])),
    v287 = new Set(v284["map"]((v288) => v288["id"])),
    v289 = new Set(),
    v290 = [],
    v291 = (v292, v293) => {
      if (v292 !== "cube" && v292 !== "mannequin") return;
      const v294 = String(v293 || "")["trim"]();
      if (!v294) return;
      const v295 = v292 === "cube" ? v285["has"](v294) : v287["has"](v294);
      if (!v295) return;
      const v296 = v292 + ":" + v294;
      if (v289["has"](v296)) return;
      (v289["add"](v296), v290["push"]({ objectType: v292, objectId: v294 }));
    },
    v297 = Array["isArray"](v282?.["selection"]?.["selectedObjects"])
      ? v282["selection"]["selectedObjects"]
      : [];
  v297["forEach"]((v298) => {
    v291(v298?.["objectType"], v298?.["objectId"]);
  });
  if (v290["length"] > 0) return v290;
  const v299 = v282?.["selection"]?.["selectedGroupId"] || null;
  if (v299) {
    const v300 = (v282?.["groups"] || [])["find"](
        (v301) => v301["id"] === v299,
      ),
      v302 = Array["isArray"](v300?.["memberIds"]) ? v300["memberIds"] : [];
    v302["forEach"]((v303) => {
      v291("mannequin", v303);
    });
    if (v290["length"] > 0) return v290;
  }
  const v304 =
    v282?.["selection"]?.["selectedObjectType"] === "cube" ||
    v282?.["selection"]?.["selectedObjectType"] === "mannequin"
      ? v282["selection"]["selectedObjectType"]
      : null;
  if (!v304) return v290;
  const v305 = Array["isArray"](v282?.["selection"]?.["selectedObjectIds"])
    ? v282["selection"]["selectedObjectIds"]
    : [];
  if (v305["length"] > 0) {
    v305["forEach"]((v306) => {
      v291(v304, v306);
    });
    if (v290["length"] > 0) return v290;
  }
  return (v291(v304, v282?.["selection"]?.["selectedObjectId"] || null), v290);
}
function collectSelectedObjectIds(v307, v308) {
  return collectSelectedObjects(v307)
    ["filter"]((v309) => v309["objectType"] === v308)
    ["map"]((v310) => v310["objectId"]);
}
function buildTransformSelectionSignature(v311) {
  const v312 = collectSelectedObjects(v311);
  if (v312["length"] === 0) return "";
  return v312["map"]((v313) => v313["objectType"] + ":" + v313["objectId"])
    ["sort"]()
    ["join"]("|");
}
function cloneGizmoDisplayContext(v314) {
  if (!v314) return null;
  return {
    isMultiSelection: v314["isMultiSelection"] === true,
    usesLocalOrientation: v314["usesLocalOrientation"] === true,
    position: v314["position"]?.["clone"]?.() || new threeRuntime["Vector3"](),
    orientationQuaternion:
      v314["orientationQuaternion"]?.["clone"]?.() ||
      new threeRuntime["Quaternion"](),
    bounds: {
      box:
        v314["bounds"]?.["box"]?.["clone"]?.() || createFallbackBounds()["box"],
      size:
        v314["bounds"]?.["size"]?.["clone"]?.() ||
        new threeRuntime["Vector3"](1, 1, 1),
      sphere: v314["bounds"]?.["sphere"]
        ? new threeRuntime["Sphere"](
            v314["bounds"]["sphere"]["center"]?.["clone"]?.() ||
              new threeRuntime["Vector3"](),
            Number(v314["bounds"]["sphere"]["radius"]) || 0,
          )
        : new threeRuntime["Sphere"](
            new threeRuntime["Vector3"](0, 0.5, 0),
            Math["sqrt"](0.75),
          ),
      extents: {
        x: Number(v314["bounds"]?.["extents"]?.["x"]) || 0,
        y: Number(v314["bounds"]?.["extents"]?.["y"]) || 0,
        z: Number(v314["bounds"]?.["extents"]?.["z"]) || 0,
      },
    },
    gizmoWorldMetrics: {
      extents: {
        x: Number(v314["gizmoWorldMetrics"]?.["extents"]?.["x"]) || 0,
        y: Number(v314["gizmoWorldMetrics"]?.["extents"]?.["y"]) || 0,
        z: Number(v314["gizmoWorldMetrics"]?.["extents"]?.["z"]) || 0,
      },
      sphereRadius: Number(v314["gizmoWorldMetrics"]?.["sphereRadius"]) || 0.01,
      margin:
        Number(v314["gizmoWorldMetrics"]?.["margin"]) || GIZMO_MARGIN_WORLD_MIN,
    },
  };
}
function measureVisualBounds(v315) {
  const v316 = v315?.["proxyRoot"] || v315?.["group"];
  if (!v316) return null;
  const v317 = new threeRuntime["Box3"]()["setFromObject"](v316);
  if (v317["isEmpty"]()) return null;
  const v318 = new threeRuntime["Vector3"](),
    v319 = new threeRuntime["Sphere"]();
  return (
    v317["getSize"](v318),
    v317["getBoundingSphere"](v319),
    {
      box: v317,
      size: v318,
      sphere: v319,
      extents: {
        x: Math["max"](0, v318["x"] * 0.5),
        y: Math["max"](0, v318["y"] * 0.5),
        z: Math["max"](0, v318["z"] * 0.5),
      },
    }
  );
}
function resolveVisualBoundsCenter(v320) {
  const v321 = measureVisualBounds(v320);
  if (!v321?.["box"] || v321["box"]["isEmpty"]()) return null;
  const v322 = new threeRuntime["Vector3"]();
  return (v321["box"]["getCenter"](v322), v322);
}
function resolveObjectToolPivot(v323, v324, v325, v326) {
  const v327 = String(v326 || "")["trim"]();
  if (v327 !== "camera") {
    const v328 = resolveVisualBoundsCenter(v324);
    if (v328) return v328;
  }
  return resolveObjectPivot(v323, v324);
}
function measureVisualBoundsForSelection(v329 = []) {
  const v330 = new threeRuntime["Box3"]();
  let v331 = false;
  v329["forEach"]((v332) => {
    const v333 = v332?.["visual"]?.["proxyRoot"] || v332?.["visual"]?.["group"];
    if (!v333) return;
    const v334 = new threeRuntime["Box3"]()["setFromObject"](v333);
    if (v334["isEmpty"]()) return;
    if (!v331) {
      (v330["copy"](v334), (v331 = true));
      return;
    }
    v330["union"](v334);
  });
  if (!v331) return null;
  const v335 = new threeRuntime["Vector3"](),
    v336 = new threeRuntime["Sphere"]();
  return (
    v330["getSize"](v335),
    v330["getBoundingSphere"](v336),
    {
      box: v330,
      size: v335,
      sphere: v336,
      extents: {
        x: Math["max"](0, v335["x"] * 0.5),
        y: Math["max"](0, v335["y"] * 0.5),
        z: Math["max"](0, v335["z"] * 0.5),
      },
    }
  );
}
function createFallbackBounds() {
  return {
    box: new threeRuntime["Box3"](
      new threeRuntime["Vector3"](-0.5, 0, -0.5),
      new threeRuntime["Vector3"](0.5, 1, 0.5),
    ),
    size: new threeRuntime["Vector3"](1, 1, 1),
    sphere: new threeRuntime["Sphere"](
      new threeRuntime["Vector3"](0, 0.5, 0),
      Math["sqrt"](0.75),
    ),
    extents: { x: 0.5, y: 0.5, z: 0.5 },
  };
}
function computeGizmoWorldMetrics(v337) {
  const v338 = v337?.["extents"] || { x: 0.5, y: 0.5, z: 0.5 },
    v339 = Math["max"](
      0.01,
      Number(v338["x"]) || 0,
      Number(v338["y"]) || 0,
      Number(v338["z"]) || 0,
    ),
    v340 = Math["max"](0.01, Number(v337?.["sphere"]?.["radius"]) || 0.01),
    v341 = Math["max"](
      GIZMO_MARGIN_WORLD_MIN,
      v340 * GIZMO_MARGIN_WORLD_RATIO,
      v339 * 0.18,
    );
  return { extents: v338, maxExtent: v339, sphereRadius: v340, margin: v341 };
}
function cloneRenderPose(v342) {
  if (!v342) return null;
  if (v342["kind"] === "camera") {
    const v343 = normalizeCameraPoseData(v342);
    return {
      kind: "camera",
      position: { ...v343["position"] },
      quaternion: { ...v343["quaternion"] },
      rotation: { ...v343["rotation"] },
      fov: v343["fov"],
    };
  }
  if (v342["kind"] === "panorama-default")
    return {
      kind: "panorama-default",
      position: { ...v342["position"] },
      yaw: Number(v342["yaw"]) || 0,
      pitch: Number(v342["pitch"]) || 0,
      fov: Number(v342["fov"]) || 72,
    };
  return {
    kind: "scene-default",
    position: { ...v342["position"] },
    target: { ...v342["target"] },
    yaw: Number(v342["yaw"]) || 0,
    pitch: Number(v342["pitch"]) || 0,
    distance: Number(v342["distance"]) || 0,
    fov: Number(v342["fov"]) || 58,
  };
}
function measurePoseDistance(v344, v345) {
  if (!v344 || !v345 || v344["kind"] !== v345["kind"])
    return Number["POSITIVE_INFINITY"];
  if (v345["kind"] === "camera") {
    const v346 = normalizeCameraPoseData(v344),
      v347 = normalizeCameraPoseData(v345),
      v348 =
        Math["abs"](v347["position"]["x"] - v346["position"]["x"]) +
        Math["abs"](v347["position"]["y"] - v346["position"]["y"]) +
        Math["abs"](v347["position"]["z"] - v346["position"]["z"]),
      v349 = Math["abs"](
        v347["quaternion"]["x"] * v346["quaternion"]["x"] +
          v347["quaternion"]["y"] * v346["quaternion"]["y"] +
          v347["quaternion"]["z"] * v346["quaternion"]["z"] +
          v347["quaternion"]["w"] * v346["quaternion"]["w"],
      ),
      v350 = 1 - Math["min"](1, Math["max"](0, v349));
    return v348 + v350 + Math["abs"](v347["fov"] - v346["fov"]);
  }
  if (v345["kind"] === "panorama-default") {
    const v351 =
        Math["abs"](
          (v345["position"]?.["x"] || 0) - (v344["position"]?.["x"] || 0),
        ) +
        Math["abs"](
          (v345["position"]?.["y"] || 0) - (v344["position"]?.["y"] || 0),
        ) +
        Math["abs"](
          (v345["position"]?.["z"] || 0) - (v344["position"]?.["z"] || 0),
        ),
      v352 =
        Math["abs"]((v345["yaw"] || 0) - (v344["yaw"] || 0)) +
        Math["abs"]((v345["pitch"] || 0) - (v344["pitch"] || 0));
    return v351 + v352 + Math["abs"]((v345["fov"] || 0) - (v344["fov"] || 0));
  }
  const v353 =
      Math["abs"](
        (v345["position"]?.["x"] || 0) - (v344["position"]?.["x"] || 0),
      ) +
      Math["abs"](
        (v345["position"]?.["y"] || 0) - (v344["position"]?.["y"] || 0),
      ) +
      Math["abs"](
        (v345["position"]?.["z"] || 0) - (v344["position"]?.["z"] || 0),
      ),
    v354 =
      Math["abs"]((v345["target"]?.["x"] || 0) - (v344["target"]?.["x"] || 0)) +
      Math["abs"]((v345["target"]?.["y"] || 0) - (v344["target"]?.["y"] || 0)) +
      Math["abs"]((v345["target"]?.["z"] || 0) - (v344["target"]?.["z"] || 0));
  return v353 + v354 + Math["abs"]((v345["fov"] || 0) - (v344["fov"] || 0));
}
function areSceneViewsEquivalent(v355, v356, v357 = 0.00001) {
  if (!v355 || !v356) return false;
  const v358 = v355["target"] || {},
    v359 = v356["target"] || {};
  return (
    Math["abs"]((Number(v358["x"]) || 0) - (Number(v359["x"]) || 0)) <= v357 &&
    Math["abs"]((Number(v358["y"]) || 0) - (Number(v359["y"]) || 0)) <= v357 &&
    Math["abs"]((Number(v358["z"]) || 0) - (Number(v359["z"]) || 0)) <= v357 &&
    Math["abs"](
      normalizeAngle(
        (Number(v355["orbitYaw"]) || 0) - (Number(v356["orbitYaw"]) || 0),
      ),
    ) <= v357 &&
    Math["abs"](
      (Number(v355["orbitPitch"]) || 0) - (Number(v356["orbitPitch"]) || 0),
    ) <= v357 &&
    Math["abs"](
      (Number(v355["orbitDistance"]) || 0) -
        (Number(v356["orbitDistance"]) || 0),
    ) <= v357
  );
}
export class PanoramaScene3DBridge {
  constructor({ container: v360, onPanoramaStatusChange: v361 } = {}) {
    ((this["container"] = v360),
      (this["onPanoramaStatusChange"] = v361),
      (this["scene"] = new threeRuntime["Scene"]()),
      (this["camera"] = new threeRuntime["PerspectiveCamera"](55, 1, 0.1, 250)),
      (this["camera"]["rotation"]["order"] = "YXZ"),
      (this["renderer"] = new threeRuntime["WebGLRenderer"]({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      })),
      (this["renderer"]["sortObjects"] = true),
      (this["renderer"]["outputColorSpace"] = threeRuntime["SRGBColorSpace"]),
      this["renderer"]["setPixelRatio"](
        Math["min"](window["devicePixelRatio"] || 1, 2),
      ),
      this["renderer"]["setClearAlpha"](0),
      (this["renderer"]["domElement"]["className"] = "panorama-scene-webgl"),
      (this["renderer"]["domElement"]["draggable"] = false),
      this["container"]?.["appendChild"](this["renderer"]["domElement"]),
      (this["_ambientLight"] = new threeRuntime["AmbientLight"](
        16777215,
        0.88,
      )),
      (this["_keyLight"] = new threeRuntime["DirectionalLight"](
        16777215,
        1.05,
      )),
      this["_keyLight"]["position"]["set"](6, 10, 4),
      (this["_rimLight"] = new threeRuntime["DirectionalLight"](8959743, 0.38)),
      this["_rimLight"]["position"]["set"](-6, 8, -10),
      this["scene"]["add"](
        this["_ambientLight"],
        this["_keyLight"],
        this["_rimLight"],
      ));
    const v362 = resolveThemeColorValue(
      "--panorama-scene-grid-night",
      "--indigo-35",
    );
    ((this["_gridMinor"] = new threeRuntime["GridHelper"](
      GRID_BASE_SPAN,
      Math["round"](GRID_BASE_SPAN / GRID_MINOR_STEP),
      v362,
      v362,
    )),
      eachMaterial(this["_gridMinor"]["material"], (v363) => {
        ((v363["transparent"] = true),
          (v363["opacity"] = 0.2),
          (v363["depthWrite"] = false),
          (v363["depthTest"] = true));
      }),
      (this["_gridMinor"]["renderOrder"] = 1),
      this["scene"]["add"](this["_gridMinor"]),
      (this["_gridMajor"] = new threeRuntime["GridHelper"](
        GRID_BASE_SPAN,
        Math["round"](GRID_BASE_SPAN / GRID_MAJOR_STEP),
        v362,
        v362,
      )),
      eachMaterial(this["_gridMajor"]["material"], (v364) => {
        ((v364["transparent"] = true),
          (v364["opacity"] = 0.34),
          (v364["depthWrite"] = false),
          (v364["depthTest"] = true));
      }),
      (this["_gridMajor"]["renderOrder"] = 2),
      this["scene"]["add"](this["_gridMajor"]),
      (this["_ground"] = new threeRuntime["Mesh"](
        new threeRuntime["PlaneGeometry"](1, 1),
        new threeRuntime["MeshBasicMaterial"]({
          color: resolveThemeColor(
            "--panorama-scene-ground-night",
            "--indigo-12",
          ),
          transparent: true,
          opacity: 0.1,
          side: threeRuntime["DoubleSide"],
          depthWrite: false,
          depthTest: true,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        }),
      )),
      (this["_ground"]["rotation"]["x"] = -Math["PI"] / 2),
      (this["_ground"]["position"]["y"] = -0.001),
      (this["_ground"]["renderOrder"] = 0),
      this["scene"]["add"](this["_ground"]),
      (this["_panoramaSphere"] = new threeRuntime["Mesh"](
        new threeRuntime["SphereGeometry"](60, 48, 32),
        new threeRuntime["MeshBasicMaterial"]({
          color: 16777215,
          side: threeRuntime["BackSide"],
        }),
      )),
      (this["_panoramaSphere"]["visible"] = false),
      this["scene"]["add"](this["_panoramaSphere"]),
      (this["_textureLoader"] = new threeRuntime["TextureLoader"]()),
      (this["_mannequinMap"] = new Map()),
      (this["_mannequinStateById"] = new Map()),
      (this["_cubeMap"] = new Map()),
      (this["_cubeStateById"] = new Map()),
      (this["_cameraMap"] = new Map()),
      (this["_cameraStateById"] = new Map()),
      (this["_pickMap"] = new Map()),
      (this["_pickRoots"] = []),
      (this["_sceneState"] = null),
      (this["_draftView"] = null),
      (this["_draftObjects"] = new Map()),
      (this["_rafId"] = null),
      (this["_loadedPanoramaUrl"] = ""),
      (this["_pendingPanoramaUrl"] = ""),
      (this["_panoramaLoadToken"] = 0),
      (this["_panoramaTexture"] = null),
      (this["_renderPose"] = null),
      (this["_defaultSceneFocalLength"] = SCENE_DEFAULT_FOCAL_LENGTH_MM),
      (this["_smoothedPose"] = null),
      (this["_lastRenderTime"] = 0),
      (this["_viewSmoothingUntil"] = 0),
      (this["_gridSnapState"] = {
        minorX: null,
        minorZ: null,
        majorX: null,
        majorZ: null,
      }),
      (this["_lastStableGizmoSelectionSignature"] = ""),
      (this["_lastStableGizmoContext"] = null),
      (this["_gizmo"] = createGizmoVisual()),
      this["scene"]["add"](this["_gizmo"]["root"]),
      (this["_gizmoMoveGuideLine"] = new threeRuntime["Line"](
        createLineGeometry(
          new threeRuntime["Vector3"](0, 0, 0),
          new threeRuntime["Vector3"](0, 0, 0),
        ),
        configureGizmoMaterial(
          new threeRuntime["LineBasicMaterial"]({
            color: resolveThemeColor("--white", "--white"),
            transparent: true,
            opacity: 0.76,
            depthWrite: false,
          }),
          { transparent: true, opacity: 0.76 },
        ),
      )),
      configureGizmoObject(this["_gizmoMoveGuideLine"]),
      (this["_gizmoMoveGuideLine"]["visible"] = false),
      (this["_gizmoMoveGuideLine"]["renderOrder"] = 3),
      this["scene"]["add"](this["_gizmoMoveGuideLine"]),
      this["resize"](640, 360),
      this["requestRender"]());
  }
  ["resize"](v365, v366) {
    const v367 = Math["max"](
        1,
        Math["floor"](v365 || this["container"]?.["clientWidth"] || 1),
      ),
      v368 = Math["max"](
        1,
        Math["floor"](v366 || this["container"]?.["clientHeight"] || 1),
      );
    (this["renderer"]["setPixelRatio"](
      Math["min"](window["devicePixelRatio"] || 1, 2),
    ),
      (this["camera"]["aspect"] = v367 / v368),
      this["camera"]["updateProjectionMatrix"](),
      this["renderer"]["setSize"](v367, v368, false),
      this["requestRender"]());
  }
  ["_isPanorama360Mode"](v369 = this["_sceneState"]) {
    return v369?.["type"] === "panorama-360";
  }
  ["setDraftView"](v370) {
    ((this["_draftView"] = v370 || null), this["requestRender"]());
  }
  ["setDefaultSceneFocalLength"](v371) {
    const v372 = PANORAMA_SCENE_CAMERA_CONSTRAINTS["scene"]["focalLength"];
    ((this["_defaultSceneFocalLength"] = Math["max"](
      v372["min"],
      Math["min"](v372["max"], Number(v371) || v372["default"]),
    )),
      this["requestRender"]());
  }
  ["getDefaultSceneFocalLength"]() {
    return this["_defaultSceneFocalLength"];
  }
  ["clearDraftView"]() {
    ((this["_draftView"] = null), this["requestRender"]());
  }
  ["setDraftObjectTransform"](v373, v374, v375) {
    const v376 = v373 + ":" + v374;
    (this["_draftObjects"]["set"](v376, {
      position: { ...v375["position"] },
      rotation: { ...v375["rotation"] },
      quaternion: hasFiniteQuaternion(v375?.["quaternion"])
        ? normalizeQuaternionData(v375["quaternion"], {
            x: 0,
            y: 0,
            z: 0,
            w: 1,
          })
        : undefined,
      scale:
        Number["isFinite"](v375?.["scale"]) ||
        (v375?.["scale"] &&
          Number["isFinite"](v375["scale"]["x"]) &&
          Number["isFinite"](v375["scale"]["y"]) &&
          Number["isFinite"](v375["scale"]["z"]))
          ? v375["scale"]
          : undefined,
    }),
      this["requestRender"]());
  }
  ["clearDraftObjectTransform"](v377, v378) {
    (this["_draftObjects"]["delete"](v377 + ":" + v378),
      this["requestRender"]());
  }
  ["clearAllDrafts"]() {
    ((this["_draftView"] = null),
      this["_draftObjects"]["clear"](),
      this["clearGizmoMoveGuideLine"](),
      this["requestRender"]());
  }
  ["markViewSmoothingWindow"](v379 = VIEW_DAMPING_WINDOW_MS) {
    const v380 = Math["max"](0, Number(v379) || VIEW_DAMPING_WINDOW_MS),
      v381 = performance["now"]();
    this["_viewSmoothingUntil"] = Math["max"](
      this["_viewSmoothingUntil"] || 0,
      v381 + v380,
    );
  }
  ["readCurrentViewPose"]() {
    const v382 = new threeRuntime["Vector3"](0, 0, -1)["applyQuaternion"](
      this["camera"]["quaternion"],
    );
    return {
      position: {
        x: this["camera"]["position"]["x"],
        y: this["camera"]["position"]["y"],
        z: this["camera"]["position"]["z"],
      },
      rotation: {
        x: this["camera"]["rotation"]["x"],
        y: this["camera"]["rotation"]["y"],
        z: this["camera"]["rotation"]["z"],
      },
      quaternion: {
        x: this["camera"]["quaternion"]["x"],
        y: this["camera"]["quaternion"]["y"],
        z: this["camera"]["quaternion"]["z"],
        w: this["camera"]["quaternion"]["w"],
      },
      forward: { x: v382["x"], y: v382["y"], z: v382["z"] },
      yaw: Math["atan2"](v382["x"], v382["z"]),
      pitch: Math["asin"](Math["max"](-1, Math["min"](1, v382["y"]))),
      fov: this["camera"]["fov"],
      focalLength: fovToFocalLength(this["camera"]["fov"]),
    };
  }
  ["_resolvePointerRay"](v383, v384) {
    const v385 = this["renderer"]["domElement"]["getBoundingClientRect"](),
      v386 = new threeRuntime["Vector2"](
        ((v383 - v385["left"]) / v385["width"]) * 2 - 1,
        -(((v384 - v385["top"]) / v385["height"]) * 2 - 1),
      ),
      v387 = new threeRuntime["Raycaster"]();
    return (v387["setFromCamera"](v386, this["camera"]), v387);
  }
  ["setGizmoHoverHandle"](v388) {
    const v389 = v388 || null;
    if ((this["_gizmo"]?.["hoverHandle"] || null) === v389) return;
    ((this["_gizmo"]["hoverHandle"] = v389),
      this["_applyGizmoHighlight"](),
      this["requestRender"]());
  }
  ["setGizmoActiveHandle"](v390) {
    const v391 = v390 || null,
      v392 = v391 === null && this["_gizmo"]?.["dragLock"];
    if ((this["_gizmo"]?.["activeHandle"] || null) === v391 && !v392) return;
    ((this["_gizmo"]["activeHandle"] = v391),
      v391 === null && (this["_gizmo"]["dragLock"] = null),
      this["_applyGizmoHighlight"](),
      this["requestRender"]());
  }
  ["clearGizmoHandleState"]() {
    if (!this["_gizmo"]) return;
    const v393 =
      this["_gizmo"]["hoverHandle"] ||
      this["_gizmo"]["activeHandle"] ||
      this["_gizmo"]["dragLock"];
    ((this["_gizmo"]["hoverHandle"] = null),
      (this["_gizmo"]["activeHandle"] = null),
      (this["_gizmo"]["dragLock"] = null),
      v393 && (this["_applyGizmoHighlight"](), this["requestRender"]()));
  }
  ["setGizmoMoveGuideLine"]({ from: v394, to: v395 } = {}) {
    const v396 = this["_gizmoMoveGuideLine"];
    if (!v396) return;
    const v397 = toVector3Like(v394, { x: 0, y: 0, z: 0 }),
      v398 = toVector3Like(v395, v397);
    (setLineGeometryPoints(v396, v397, v398),
      (v396["visible"] = true),
      this["requestRender"]());
  }
  ["clearGizmoMoveGuideLine"]() {
    const v399 = this["_gizmoMoveGuideLine"];
    if (!v399?.["visible"]) return;
    ((v399["visible"] = false), this["requestRender"]());
  }
  ["_clearStableGizmoContext"]() {
    ((this["_lastStableGizmoSelectionSignature"] = ""),
      (this["_lastStableGizmoContext"] = null));
  }
  ["_cacheStableGizmoContext"](v400, v401) {
    const v402 = buildTransformSelectionSignature(v400);
    if (!v402 || !v401) return;
    ((this["_lastStableGizmoSelectionSignature"] = v402),
      (this["_lastStableGizmoContext"] = cloneGizmoDisplayContext(v401)));
  }
  ["_resolveStableGizmoContext"](v403) {
    const v404 = buildTransformSelectionSignature(v403);
    if (!v404) return null;
    if (v404 !== this["_lastStableGizmoSelectionSignature"]) return null;
    return this["_lastStableGizmoContext"] || null;
  }
  ["pickGizmoHandle"](v405, v406) {
    if (this["_isPanorama360Mode"]()) return null;
    if (!this["_gizmo"]?.["root"]?.["visible"]) return null;
    const v407 =
      this["_gizmo"]?.["moveGroup"]?.["visible"] ||
      this["_gizmo"]?.["rotateGroup"]?.["visible"] ||
      this["_gizmo"]?.["scaleGroup"]?.["visible"];
    if (!v407) return null;
    const v408 = Array["isArray"](this["_gizmo"]["pickMeshes"])
      ? this["_gizmo"]["pickMeshes"]
      : [];
    if (v408["length"] === 0) return null;
    const v409 = this["_resolvePointerRay"](v405, v406),
      v410 = v409["intersectObjects"](v408, true);
    for (const v411 of v410) {
      let v412 = v411["object"];
      while (v412) {
        const v413 = v412["userData"]?.["gizmoHandleKey"];
        if (v413) {
          const v414 = this["_gizmo"]["handles"]?.["get"]?.(v413) || null;
          if (!v414) return null;
          const v415 = this["_gizmo"]?.["currentTool"] || "move",
            v416 =
              v414["mode"] === "scale-axis" || v414["mode"] === "scale-uniform",
            v417 =
              (v415 === "move" &&
                (v414["mode"] === "axis" || v414["mode"] === "plane")) ||
              (v415 === "rotate" && v414["mode"] === "rotate") ||
              (v415 === "scale" && v416);
          if (!v417) {
            v412 = v412["parent"];
            continue;
          }
          return {
            kind: "gizmo-handle",
            handleKey: v413,
            mode: v414["mode"],
            axis: v414["axis"] || null,
            normalAxis: v414["normalAxis"] || null,
            point: {
              x: v411["point"]["x"],
              y: v411["point"]["y"],
              z: v411["point"]["z"],
            },
          };
        }
        v412 = v412["parent"];
      }
    }
    return null;
  }
  ["beginMoveGizmoDrag"]({
    handleKey: v418,
    clientX: v419,
    clientY: v420,
  } = {}) {
    if (!v418) return null;
    const v421 = this["_gizmo"]?.["handles"]?.["get"]?.(v418);
    if (!v421) return null;
    const v422 = this["_gizmo"]["root"]["position"]["clone"](),
      v423 = this["_gizmo"]["root"]["quaternion"]["clone"](),
      v424 = v421["mode"] === "axis" ? v421["axis"] : v421["normalAxis"];
    if (!v424) return null;
    const v425 = vectorFromAxisName(v424)
      ["applyQuaternion"](v423)
      ["normalize"]();
    let v426 = v425["clone"]();
    if (v421["mode"] === "axis") {
      const v427 = this["camera"]
          ["getWorldDirection"](new threeRuntime["Vector3"]())
          ["normalize"](),
        v428 = new threeRuntime["Vector3"]()["crossVectors"](v427, v425);
      (v428["lengthSq"]() < 0.00001 &&
        (v428["copy"](new threeRuntime["Vector3"](0, 1, 0)["cross"](v425)),
        v428["lengthSq"]() < 0.00001 &&
          v428["copy"](new threeRuntime["Vector3"](1, 0, 0)["cross"](v425))),
        (v426 = new threeRuntime["Vector3"]()
          ["crossVectors"](v425, v428)
          ["normalize"]()));
    }
    v426["lengthSq"]() < 0.000001 &&
      (v426 = new threeRuntime["Vector3"](0, 1, 0));
    const v429 = new threeRuntime["Plane"]()["setFromNormalAndCoplanarPoint"](
        v426,
        v422,
      ),
      v430 = this["_resolvePointerRay"](v419, v420),
      v431 = new threeRuntime["Vector3"](),
      v432 = v430["ray"]["intersectPlane"](v429, v431),
      v433 = v432 ? v431["clone"]() : v422["clone"]();
    return {
      handleKey: v418,
      mode: v421["mode"],
      axisWorld: v421["mode"] === "axis" ? v425["clone"]() : null,
      axis: v421["mode"] === "axis" ? v425["clone"]() : null,
      planeNormalWorld: v426["clone"](),
      planeNormal: v426["clone"](),
      pivot: v422["clone"](),
      gizmoQuaternion: v423["clone"](),
      startPoint: v433["clone"](),
      dragPlane: v429,
    };
  }
  ["beginRotateGizmoDrag"]({
    handleKey: v434,
    clientX: v435,
    clientY: v436,
  } = {}) {
    if (!v434) return null;
    const v437 = this["_gizmo"]?.["handles"]?.["get"]?.(v434);
    if (!v437 || v437["mode"] !== "rotate") return null;
    const v438 = this["_resolveGizmoContext"](this["_sceneState"]);
    if (!v438) return null;
    const v439 = this["_gizmo"]["root"]["position"]["clone"](),
      v440 = this["_gizmo"]["root"]["quaternion"]["clone"](),
      v441 = vectorFromAxisName(v437["axis"])
        ["applyQuaternion"](v440)
        ["normalize"](),
      v442 = new threeRuntime["Plane"]()["setFromNormalAndCoplanarPoint"](
        v441,
        v439,
      ),
      v443 = this["_resolvePointerRay"](v435, v436),
      v444 = new threeRuntime["Vector3"](),
      v445 = v443["ray"]["intersectPlane"](v442, v444);
    if (!v445) return null;
    return (
      this["_captureGizmoDragLock"](v438),
      {
        handleKey: v434,
        mode: "rotate",
        axisWorld: v441["clone"](),
        axis: v441["clone"](),
        pivot: v439["clone"](),
        gizmoQuaternion: v440["clone"](),
        dragPlane: v442,
        startPoint: v444["clone"](),
      }
    );
  }
  ["computeRotateGizmoAngle"](v446, v447) {
    if (!v446?.["startPoint"] || !v447) return 0;
    return computeSignedRotationDelta({
      startPoint: {
        x: v446["startPoint"]["x"],
        y: v446["startPoint"]["y"],
        z: v446["startPoint"]["z"],
      },
      currentPoint: v447,
      pivot: {
        x: v446["pivot"]["x"],
        y: v446["pivot"]["y"],
        z: v446["pivot"]["z"],
      },
      axis: {
        x: v446["axisWorld"]?.["x"] ?? v446["axis"]?.["x"],
        y: v446["axisWorld"]?.["y"] ?? v446["axis"]?.["y"],
        z: v446["axisWorld"]?.["z"] ?? v446["axis"]?.["z"],
      },
    });
  }
  ["beginScaleGizmoDrag"]({
    handleKey: v448,
    clientX: v449,
    clientY: v450,
  } = {}) {
    if (!v448) return null;
    const v451 = this["_gizmo"]?.["handles"]?.["get"]?.(v448);
    if (
      !v451 ||
      (v451["mode"] !== "scale-axis" && v451["mode"] !== "scale-uniform")
    )
      return null;
    const v452 = this["_resolveGizmoContext"](this["_sceneState"]);
    if (!v452) return null;
    const v453 = this["_gizmo"]["root"]["position"]["clone"](),
      v454 = this["_gizmo"]["root"]["quaternion"]["clone"](),
      v455 = this["_resolvePointerRay"](v449, v450);
    if (v451["mode"] === "scale-uniform") {
      const v456 = this["camera"]
          ["getWorldDirection"](new threeRuntime["Vector3"]())
          ["normalize"](),
        v457 = new threeRuntime["Plane"]()["setFromNormalAndCoplanarPoint"](
          v456,
          v453,
        ),
        v458 = new threeRuntime["Vector3"](),
        v459 = v455["ray"]["intersectPlane"](v457, v458);
      if (!v459) return null;
      return (
        this["_captureGizmoDragLock"](v452),
        {
          handleKey: v448,
          mode: "scale-uniform",
          pivot: v453["clone"](),
          axisWorld: null,
          gizmoQuaternion: v454["clone"](),
          dragPlane: v457,
          startPoint: v458["clone"](),
          referenceDistance: Math["max"](0.25, v458["distanceTo"](v453)),
        }
      );
    }
    const v460 = vectorFromAxisName(v451["axis"])
        ["applyQuaternion"](v454)
        ["normalize"](),
      v461 = this["camera"]
        ["getWorldDirection"](new threeRuntime["Vector3"]())
        ["normalize"]();
    let v462 = new threeRuntime["Vector3"]()["crossVectors"](v461, v460);
    v462["lengthSq"]() < 0.00001 &&
      ((v462 = new threeRuntime["Vector3"](0, 1, 0)["cross"](v460)),
      v462["lengthSq"]() < 0.00001 &&
        (v462 = new threeRuntime["Vector3"](1, 0, 0)["cross"](v460)));
    const v463 = new threeRuntime["Vector3"]()
        ["crossVectors"](v460, v462)
        ["normalize"](),
      v464 = new threeRuntime["Plane"]()["setFromNormalAndCoplanarPoint"](
        v463,
        v453,
      ),
      v465 = new threeRuntime["Vector3"](),
      v466 = v455["ray"]["intersectPlane"](v464, v465);
    if (!v466) return null;
    this["_captureGizmoDragLock"](v452);
    const v467 = Math["max"](
        0.35,
        Math["abs"](v465["clone"]()["sub"](v453)["dot"](v460)),
        (Number(this["_gizmo"]?.["root"]?.["scale"]?.["x"]) || 1) * 0.9,
      ),
      v468 = resolveAxisScreenDragMetric({
        pivot: v453,
        axisWorld: v460,
        camera: this["camera"],
        domElement: this["renderer"]?.["domElement"],
        worldDistance: v467,
      });
    return {
      handleKey: v448,
      mode: "scale-axis",
      axisWorld: v460["clone"](),
      dragDirectionWorld: v460["clone"](),
      axis: v460["clone"](),
      pivot: v453["clone"](),
      planeNormalWorld: v463["clone"](),
      gizmoQuaternion: v454["clone"](),
      dragPlane: v464,
      startPoint: v465["clone"](),
      startClientX: Number(v449) || 0,
      startClientY: Number(v450) || 0,
      axisScreenDirection: v468?.["axisScreenDirection"] || null,
      screenReferencePixels: v468?.["screenReferencePixels"] || null,
      referenceDistance: v467,
    };
  }
  ["computeScaleGizmoFactor"](v469, v470) {
    if (!v469?.["startPoint"] || !v470) return 1;
    if (v469["mode"] === "scale-axis") {
      if (
        v469["axisScreenDirection"] &&
        Number["isFinite"](Number(v470["clientX"])) &&
        Number["isFinite"](Number(v470["clientY"]))
      )
        return computeAxisScaleFactorFromScreenDelta({
          startX: v469["startClientX"],
          startY: v469["startClientY"],
          currentX: v470["clientX"],
          currentY: v470["clientY"],
          axisDirection: v469["axisScreenDirection"],
          referencePixels: v469["screenReferencePixels"],
        });
      return computeAxisScaleFactor({
        startPoint: {
          x: v469["startPoint"]["x"],
          y: v469["startPoint"]["y"],
          z: v469["startPoint"]["z"],
        },
        currentPoint: v470,
        pivot: {
          x: v469["pivot"]["x"],
          y: v469["pivot"]["y"],
          z: v469["pivot"]["z"],
        },
        axis: {
          x: v469["axisWorld"]?.["x"] ?? v469["axis"]?.["x"],
          y: v469["axisWorld"]?.["y"] ?? v469["axis"]?.["y"],
          z: v469["axisWorld"]?.["z"] ?? v469["axis"]?.["z"],
        },
        dragDirection: {
          x:
            v469["dragDirectionWorld"]?.["x"] ??
            v469["axisWorld"]?.["x"] ??
            v469["axis"]?.["x"],
          y:
            v469["dragDirectionWorld"]?.["y"] ??
            v469["axisWorld"]?.["y"] ??
            v469["axis"]?.["y"],
          z:
            v469["dragDirectionWorld"]?.["z"] ??
            v469["axisWorld"]?.["z"] ??
            v469["axis"]?.["z"],
        },
        referenceDistance: v469["referenceDistance"],
      });
    }
    return computeUniformScaleFactor({
      startPoint: {
        x: v469["startPoint"]["x"],
        y: v469["startPoint"]["y"],
        z: v469["startPoint"]["z"],
      },
      currentPoint: v470,
      pivot: {
        x: v469["pivot"]["x"],
        y: v469["pivot"]["y"],
        z: v469["pivot"]["z"],
      },
      minDistance: v469["referenceDistance"],
    });
  }
  ["sampleMoveGizmoDragPoint"](v471, v472, v473) {
    if (!v471?.["dragPlane"]) return null;
    const v474 = this["_resolvePointerRay"](v472, v473),
      v475 = new threeRuntime["Vector3"](),
      v476 = v474["ray"]["intersectPlane"](v471["dragPlane"], v475);
    if (!v476) return null;
    return {
      x: v475["x"],
      y: v475["y"],
      z: v475["z"],
      clientX: v472,
      clientY: v473,
    };
  }
  ["computeMoveGizmoDelta"](v477, v478) {
    if (!v477?.["startPoint"] || !v478) return null;
    const v479 = computeConstrainedMoveDelta({
      startPoint: {
        x: v477["startPoint"]["x"],
        y: v477["startPoint"]["y"],
        z: v477["startPoint"]["z"],
      },
      currentPoint: v478,
      axis: v477?.["axisWorld"]
        ? {
            x: v477["axisWorld"]["x"],
            y: v477["axisWorld"]["y"],
            z: v477["axisWorld"]["z"],
          }
        : v477?.["axis"]
          ? { x: v477["axis"]["x"], y: v477["axis"]["y"], z: v477["axis"]["z"] }
          : null,
      planeNormal: {
        x: v477?.["planeNormalWorld"]?.["x"] ?? v477?.["planeNormal"]?.["x"],
        y: v477?.["planeNormalWorld"]?.["y"] ?? v477?.["planeNormal"]?.["y"],
        z: v477?.["planeNormalWorld"]?.["z"] ?? v477?.["planeNormal"]?.["z"],
      },
      mode: v477["mode"],
    });
    return v479;
  }
  ["pick"](v480, v481) {
    if (this["_isPanorama360Mode"]()) return null;
    if (!this["_pickRoots"]["length"]) return null;
    const v482 = this["_resolvePointerRay"](v480, v481),
      v483 = v482["intersectObjects"](this["_pickRoots"], true);
    for (const v484 of v483) {
      let v485 = v484["object"];
      while (v485) {
        const v486 = this["_pickMap"]["get"](v485["id"]);
        if (v486)
          return {
            ...v486,
            point: {
              x: v484["point"]["x"],
              y: v484["point"]["y"],
              z: v484["point"]["z"],
            },
          };
        v485 = v485["parent"];
      }
    }
    return null;
  }
  ["pickObjectsInRect"](v487) {
    if (this["_isPanorama360Mode"]()) return [];
    const v488 = this["renderer"]["domElement"]["getBoundingClientRect"](),
      v489 = [],
      v490 = (v491, v492) => {
        v491["forEach"]((v493, v494) => {
          const v495 = new threeRuntime["Vector3"]();
          v493["group"]["getWorldPosition"](v495);
          const v496 = v495["clone"]()["project"](this["camera"]);
          if (
            v496["x"] < -1 ||
            v496["x"] > 1 ||
            v496["y"] < -1 ||
            v496["y"] > 1 ||
            v496["z"] < -1 ||
            v496["z"] > 1
          )
            return;
          const v497 = v488["left"] + (v496["x"] + 1) * 0.5 * v488["width"],
            v498 = v488["top"] + (1 - v496["y"]) * 0.5 * v488["height"];
          v497 >= v487["left"] &&
            v497 <= v487["right"] &&
            v498 >= v487["top"] &&
            v498 <= v487["bottom"] &&
            v489["push"]({
              objectType: v492,
              objectId: v494,
              depth: v496["z"],
            });
        });
      };
    return (
      v490(this["_mannequinMap"], "mannequin"),
      v490(this["_cubeMap"], "cube"),
      v489["sort"]((v499, v500) => v499["depth"] - v500["depth"]),
      v489
    );
  }
  ["intersectGround"](v501, v502, v503 = 0) {
    if (this["_isPanorama360Mode"]()) return null;
    const v504 = this["_resolvePointerRay"](v501, v502),
      v505 = new threeRuntime["Plane"](
        new threeRuntime["Vector3"](0, 1, 0),
        -v503,
      ),
      v506 = new threeRuntime["Vector3"](),
      v507 = v504["ray"]["intersectPlane"](v505, v506);
    if (!v507) return null;
    return { x: v506["x"], y: v506["y"], z: v506["z"] };
  }
  async ["_withCleanCaptureFrame"](v508) {
    const v509 = [
        this["_gizmo"]?.["root"],
        this["_gizmoMoveGuideLine"],
        ...Array["from"](this["_cameraMap"]["values"]())["map"](
          (v510) => v510?.["group"],
        ),
      ]["filter"](Boolean),
      v511 = v509["map"]((v512) => ({
        object3d: v512,
        visible: v512["visible"],
      })),
      v513 = [],
      v514 = (v515) => {
        if (!v515 || v513["some"]((v516) => v516["material"] === v515)) return;
        v513["push"]({
          material: v515,
          emissive: v515["emissive"]?.["isColor"]
            ? v515["emissive"]["clone"]()
            : undefined,
          emissiveIntensity:
            typeof v515["emissiveIntensity"] === "number"
              ? v515["emissiveIntensity"]
              : undefined,
          opacity:
            typeof v515["opacity"] === "number" ? v515["opacity"] : undefined,
        });
      };
    (this["_mannequinMap"]["forEach"]((v517) => {
      v517?.["group"]?.["traverse"]?.((v518) =>
        eachMaterial(v518["material"], v514),
      );
    }),
      this["_cubeMap"]["forEach"]((v519) => {
        v519?.["group"]?.["traverse"]?.((v520) =>
          eachMaterial(v520["material"], v514),
        );
      }),
      v511["forEach"](({ object3d: v521 }) => {
        v521["visible"] = false;
      }),
      this["_mannequinMap"]["forEach"]((v522) =>
        applyObjectSelectionEmphasis(v522?.["group"], false),
      ),
      this["_cubeMap"]["forEach"]((v523) =>
        applyObjectSelectionEmphasis(v523?.["group"], false),
      ));
    try {
      return await v508();
    } finally {
      (v511["forEach"](({ object3d: v524, visible: v525 }) => {
        v524["visible"] = v525;
      }),
        v513["forEach"](
          ({
            material: v526,
            emissive: v527,
            emissiveIntensity: v528,
            opacity: v529,
          }) => {
            (v527?.["isColor"] &&
              v526["emissive"]?.["isColor"] &&
              v526["emissive"]["copy"](v527),
              typeof v528 === "number" && (v526["emissiveIntensity"] = v528),
              typeof v529 === "number" && (v526["opacity"] = v529),
              (v526["needsUpdate"] = true));
          },
        ),
        this["requestRender"]());
    }
  }
  ["captureBlob"]({
    includeEditorOverlays: includeEditorOverlays = true,
  } = {}) {
    const v530 = () =>
      new Promise((v531, v532) => {
        this["renderNow"]();
        const v533 = this["renderer"]["domElement"];
        if (typeof v533["toBlob"] === "function") {
          v533["toBlob"]((v534) => {
            if (!v534) {
              v532(new Error("截图导出失败"));
              return;
            }
            v531(v534);
          }, "image/png");
          return;
        }
        try {
          const v535 = v533["toDataURL"]("image/png"),
            [, v536] = v535["split"](","),
            v537 = v535["slice"](
              v535["indexOf"](":") + 1,
              v535["indexOf"](";"),
            ),
            v538 = atob(v536 || ""),
            v539 = new Uint8Array(v538["length"]);
          for (let v540 = 0; v540 < v538["length"]; v540 += 1) {
            v539[v540] = v538["charCodeAt"](v540);
          }
          v531(new Blob([v539], { type: v537 || "image/png" }));
        } catch (v541) {
          v532(v541);
        }
      });
    if (includeEditorOverlays === false)
      return this["_withCleanCaptureFrame"](v530);
    return v530();
  }
  ["sync"](v542) {
    this["_sceneState"] = v542;
    const v543 = this["_isPanorama360Mode"](v542);
    (this["_syncEnvironment"](v542?.["environmentMode"]),
      this["_syncPanorama"](v542?.["panorama"]),
      this["_syncMannequins"](v542, v543),
      this["_syncCubes"](v542, v543),
      this["_syncCameras"](v542, v543),
      this["_syncGizmo"](v542, v543),
      this["_syncPanoramaModeVisibility"](v543),
      this["_syncPanoramaCanvasVisibility"](v543),
      this["requestRender"]());
  }
  ["requestRender"]() {
    if (this["_rafId"] !== null) return;
    this["_rafId"] = requestAnimationFrame(() => {
      ((this["_rafId"] = null), this["renderNow"]());
    });
  }
  ["renderNow"]() {
    if (!this["_sceneState"]) {
      this["renderer"]["render"](this["scene"], this["camera"]);
      return;
    }
    const v544 = this["_isPanorama360Mode"](this["_sceneState"]),
      v545 = this["_applyRenderView"]();
    (!v544 && this["_syncInfiniteGrid"](),
      this["_applyDraftObjects"](),
      !v544 && this["_applyGizmoPosition"](),
      this["renderer"]["render"](this["scene"], this["camera"]),
      v545?.["keepAnimating"] && this["requestRender"]());
  }
  ["dispose"]() {
    (this["_rafId"] !== null &&
      (cancelAnimationFrame(this["_rafId"]), (this["_rafId"] = null)),
      (this["_panoramaLoadToken"] += 1),
      (this["_smoothedPose"] = null),
      (this["_lastRenderTime"] = 0),
      (this["_viewSmoothingUntil"] = 0),
      this["_mannequinMap"]["forEach"]((v546) => {
        (this["scene"]["remove"](v546["group"]),
          disposeObject3D(v546["group"]));
      }),
      this["_cubeMap"]["forEach"]((v547) => {
        (this["scene"]["remove"](v547["group"]),
          disposeObject3D(v547["group"]));
      }),
      this["_cameraMap"]["forEach"]((v548) => {
        (this["scene"]["remove"](v548["group"]),
          disposeObject3D(v548["group"]));
      }),
      this["_mannequinMap"]["clear"](),
      this["_mannequinStateById"]["clear"](),
      this["_cubeMap"]["clear"](),
      this["_cubeStateById"]["clear"](),
      this["_cameraMap"]["clear"](),
      this["_cameraStateById"]["clear"](),
      this["_pickMap"]["clear"](),
      (this["_pickRoots"] = []),
      this["_clearStableGizmoContext"](),
      this["scene"]["remove"](this["_gizmo"]["root"]),
      disposeObject3D(this["_gizmo"]["root"]),
      this["_panoramaTexture"] &&
        (this["_panoramaTexture"]["dispose"](),
        (this["_panoramaTexture"] = null)),
      disposeObject3D(this["_panoramaSphere"]),
      disposeObject3D(this["_ground"]),
      disposeObject3D(this["_gridMinor"]),
      disposeObject3D(this["_gridMajor"]),
      this["scene"]["clear"](),
      this["renderer"]["dispose"](),
      this["renderer"]["forceContextLoss"]?.(),
      this["renderer"]["domElement"]["remove"]());
  }
  ["_syncEnvironment"](v549) {
    const v550 = v549 === "night",
      v551 = resolveThemeColor(
        v550 ? "--panorama-scene-fog-night" : "--panorama-scene-fog-day",
        v550 ? "--panorama-scene-fog-night" : "--panorama-scene-fog-day",
      );
    ((this["scene"]["background"] = null),
      this["renderer"]["setClearColor"](0, 0),
      (this["scene"]["fog"] = this["_isPanorama360Mode"](this["_sceneState"])
        ? null
        : new threeRuntime["Fog"](v551, v550 ? 46 : 58, v550 ? 138 : 170)),
      (this["_ambientLight"]["intensity"] = v550 ? 0.56 : 0.94),
      (this["_keyLight"]["intensity"] = v550 ? 0.72 : 1.12),
      (this["_rimLight"]["intensity"] = v550 ? 0.2 : 0.16),
      eachMaterial(this["_gridMinor"]["material"], (v552) => {
        ((v552["opacity"] = v550 ? 0.28 : 0.24),
          v552["color"]["copy"](
            resolveThemeColor(
              v550
                ? "--panorama-scene-grid-night"
                : "--panorama-scene-grid-day",
              v550 ? "--indigo-35" : "--black-20",
            ),
          ),
          (v552["needsUpdate"] = true));
      }),
      eachMaterial(this["_gridMajor"]["material"], (v553) => {
        ((v553["opacity"] = v550 ? 0.52 : 0.42),
          v553["color"]["copy"](
            resolveThemeColor(
              v550
                ? "--panorama-scene-grid-night-major"
                : "--panorama-scene-grid-day-major",
              v550 ? "--indigo-35" : "--black-20",
            ),
          ),
          (v553["needsUpdate"] = true));
      }),
      (this["_ground"]["material"]["opacity"] = v550 ? 0.96 : 0.92),
      (this["_ground"]["material"]["color"] = resolveThemeColor(
        v550 ? "--panorama-scene-ground-night" : "--panorama-scene-ground-day",
        v550 ? "--indigo-12" : "--black-10",
      )),
      (this["_ground"]["material"]["needsUpdate"] = true));
  }
  ["_syncPanoramaModeVisibility"](v554) {
    ((this["_gridMinor"]["visible"] = !v554),
      (this["_gridMajor"]["visible"] = !v554),
      (this["_ground"]["visible"] = !v554));
    if (!v554) return;
    ((this["_gizmo"]["root"]["visible"] = false),
      this["clearGizmoHandleState"](),
      this["_mannequinMap"]["forEach"]((v555) => {
        ((v555["group"]["visible"] = false),
          (v555["selectionRing"]["visible"] = false));
      }),
      this["_cubeMap"]["forEach"]((v556) => {
        ((v556["group"]["visible"] = false),
          (v556["selectionRing"]["visible"] = false));
      }),
      this["_cameraMap"]["forEach"]((v557) => {
        v557["group"]["visible"] = false;
      }),
      (this["_panoramaSphere"]["visible"] = Boolean(
        this["_panoramaSphere"]["material"]?.["map"],
      )));
  }
  ["_syncPanoramaCanvasVisibility"](
    v558 = this["_isPanorama360Mode"](this["_sceneState"]),
  ) {
    const v559 = this["renderer"]?.["domElement"];
    if (!v559) return;
    const v560 = Boolean(this["_panoramaSphere"]?.["material"]?.["map"]),
      v561 = v558 && !v560;
    ((v559["style"]["opacity"] = v561 ? "0" : "1"),
      (v559["style"]["background"] = "transparent"),
      (v559["dataset"]["panoramaEmpty"] = v561 ? "1" : "0"));
  }
  ["_syncInfiniteGrid"]() {
    const v562 = Number(this["camera"]?.["position"]?.["x"]) || 0,
      v563 = Number(this["camera"]?.["position"]?.["z"]) || 0,
      v564 = computeStableGridSnap(
        v562,
        GRID_MINOR_STEP,
        this["_gridSnapState"]["minorX"],
        GRID_SNAP_HYSTERESIS,
      ),
      v565 = computeStableGridSnap(
        v563,
        GRID_MINOR_STEP,
        this["_gridSnapState"]["minorZ"],
        GRID_SNAP_HYSTERESIS,
      ),
      v566 = computeStableGridSnap(
        v562,
        GRID_MAJOR_STEP,
        this["_gridSnapState"]["majorX"],
        GRID_SNAP_HYSTERESIS,
      ),
      v567 = computeStableGridSnap(
        v563,
        GRID_MAJOR_STEP,
        this["_gridSnapState"]["majorZ"],
        GRID_SNAP_HYSTERESIS,
      );
    ((this["_gridSnapState"]["minorX"] = v564),
      (this["_gridSnapState"]["minorZ"] = v565),
      (this["_gridSnapState"]["majorX"] = v566),
      (this["_gridSnapState"]["majorZ"] = v567),
      this["_gridMinor"]["position"]["set"](v564, 0, v565),
      this["_gridMajor"]["position"]["set"](v566, 0.0002, v567));
    const v568 = Number(this["_renderPose"]?.["distance"]) || 0,
      v569 = Math["max"](
        GRID_BASE_SPAN,
        Math["abs"](Number(this["camera"]?.["position"]?.["y"]) || 0) * 26,
        v568 * 28,
      );
    (this["_ground"]["position"]["set"](v566, -0.001, v567),
      this["_ground"]["scale"]["set"](v569, v569, 1));
    const v570 = this["_sceneState"]?.["environmentMode"] === "night",
      v571 = v570 ? 0.28 : 0.24,
      v572 = v570 ? 0.52 : 0.42,
      v573 = Math["abs"](
        Number["isFinite"](this["_renderPose"]?.["pitch"])
          ? this["_renderPose"]["pitch"]
          : Number(this["camera"]?.["rotation"]?.["x"]) || 0,
      ),
      v574 = clamp01((v573 - 0.08) / 0.32),
      v575 = 0.18 + 0.82 * v574,
      v576 = clamp01((v568 - 8) / 26),
      v577 = 1 - 0.52 * v576,
      v578 = v575 * v577,
      v579 = v571 * v578,
      v580 = v572 * (0.32 + 0.68 * v578);
    (eachMaterial(this["_gridMinor"]["material"], (v581) => {
      v581["opacity"] = v579;
    }),
      eachMaterial(this["_gridMajor"]["material"], (v582) => {
        v582["opacity"] = v580;
      }));
  }
  ["_syncPanorama"](v583) {
    const v584 = normalizePanoramaTextureUrl(
      v583?.["imageUrl"],
      v583?.["localPath"],
    );
    if (!v584) {
      ((this["_panoramaLoadToken"] += 1),
        (this["_loadedPanoramaUrl"] = ""),
        (this["_pendingPanoramaUrl"] = ""),
        (this["_panoramaSphere"]["material"]["map"] = null),
        (this["_panoramaSphere"]["material"]["needsUpdate"] = true),
        (this["_panoramaSphere"]["visible"] = false),
        this["_syncPanoramaCanvasVisibility"]());
      return;
    }
    if (
      v584 === this["_loadedPanoramaUrl"] ||
      v584 === this["_pendingPanoramaUrl"]
    )
      return;
    this["_pendingPanoramaUrl"] = v584;
    const v585 = ++this["_panoramaLoadToken"];
    this["_textureLoader"]["load"](
      v584,
      (v586) => {
        if (v585 !== this["_panoramaLoadToken"]) {
          v586["dispose"]();
          return;
        }
        ((v586["colorSpace"] = threeRuntime["SRGBColorSpace"]),
          (v586["minFilter"] = threeRuntime["LinearMipmapLinearFilter"]),
          (v586["magFilter"] = threeRuntime["LinearFilter"]),
          (v586["generateMipmaps"] = true),
          (v586["anisotropy"] = Math["min"](
            8,
            this["renderer"]["capabilities"]["getMaxAnisotropy"]?.() || 1,
          )),
          (v586["needsUpdate"] = true),
          this["_panoramaTexture"] && this["_panoramaTexture"]["dispose"](),
          (this["_panoramaTexture"] = v586),
          (this["_loadedPanoramaUrl"] = v584),
          (this["_pendingPanoramaUrl"] = ""),
          (this["_panoramaSphere"]["material"]["map"] = v586),
          (this["_panoramaSphere"]["material"]["needsUpdate"] = true),
          (this["_panoramaSphere"]["visible"] = true),
          this["_syncPanoramaCanvasVisibility"](),
          this["onPanoramaStatusChange"]?.({ isLoaded: true, error: null }),
          this["requestRender"]());
      },
      undefined,
      () => {
        if (v585 !== this["_panoramaLoadToken"]) return;
        ((this["_pendingPanoramaUrl"] = ""),
          (this["_panoramaSphere"]["visible"] = false),
          this["_syncPanoramaCanvasVisibility"](),
          this["onPanoramaStatusChange"]?.({
            isLoaded: false,
            error: "全景图加载失败",
          }));
      },
    );
  }
  ["_resolveMannequinColor"](v587) {
    const v588 =
      PANORAMA_SCENE_COLOR_TOKENS[v587] || PANORAMA_SCENE_COLOR_TOKENS["blue"];
    return resolveThemeColor(v588, "--blue");
  }
  ["_registerPickable"](v589, v590) {
    (v589["traverse"]((v591) => {
      this["_pickMap"]["set"](v591["id"], v590);
    }),
      this["_pickRoots"]["push"](v589));
  }
  ["_rebuildPickRoots"]() {
    (this["_pickMap"]["clear"](),
      (this["_pickRoots"] = []),
      this["_mannequinMap"]["forEach"]((v592, v593) => {
        this["_registerPickable"](v592["proxyRoot"] || v592["group"], {
          objectType: "mannequin",
          objectId: v593,
        });
      }),
      this["_cubeMap"]["forEach"]((v594, v595) => {
        this["_registerPickable"](v594["group"], {
          objectType: "cube",
          objectId: v595,
        });
      }));
  }
  ["_loadCharacterModelForVisual"](v596, v597, v598) {
    if (!v596) return;
    const v599 = resolvePanoramaCharacterGender(v598),
      v600 = (v596["modelLoadToken"] || 0) + 1;
    ((v596["modelLoadToken"] = v600),
      (v596["modelGender"] = v599),
      (v596["modelLoadError"] = null),
      setMannequinProxyMode(v596),
      createPanoramaCharacterModelInstance(v599)
        ["then"]((v601) => {
          if (
            this["_mannequinMap"]["get"](v597) !== v596 ||
            v596["modelLoadToken"] !== v600
          ) {
            disposeObject3D(v601);
            return;
          }
          v596["modelRoot"] &&
            (v596["group"]["remove"](v596["modelRoot"]),
            disposeObject3D(v596["modelRoot"]));
          ((v596["modelMaterial"] = null),
            (v596["modelRoot"] = v601),
            v596["group"]["add"](v601));
          const v602 = this["_mannequinStateById"]["get"](v597)?.["colorKey"];
          (applyCharacterClayMaterial(
            v596,
            this["_resolveMannequinColor"](v602),
          ),
            setMannequinProxyMode(v596),
            this["_rebuildPickRoots"]());
          if (typeof requestAnimationFrame === "function")
            this["requestRender"]();
        })
        ["catch"]((v603) => {
          if (
            this["_mannequinMap"]["get"](v597) !== v596 ||
            v596["modelLoadToken"] !== v600
          )
            return;
          v596["modelLoadError"] =
            v603 || new Error("Quaternius character model failed to load");
          v596["modelRoot"] &&
            (v596["group"]["remove"](v596["modelRoot"]),
            disposeObject3D(v596["modelRoot"]),
            (v596["modelRoot"] = null));
          ((v596["modelMaterial"] = null), setMannequinProxyMode(v596));
          if (typeof requestAnimationFrame === "function")
            this["requestRender"]();
        }));
  }
  ["_syncMannequins"](v604, v605 = false) {
    const v606 = v604?.["mannequins"] || [],
      v607 = new Set(collectSelectedObjectIds(v604, "mannequin")),
      v608 = !v605,
      v609 = new Set();
    v606["forEach"]((v610) => {
      (v609["add"](v610["id"]),
        this["_mannequinStateById"]["set"](v610["id"], v610));
      let v611 = this["_mannequinMap"]["get"](v610["id"]);
      if (!v611)
        ((v611 = createMannequinVisual(
          this["_resolveMannequinColor"](v610["colorKey"]),
        )),
          this["_mannequinMap"]["set"](v610["id"], v611),
          this["scene"]["add"](v611["group"]),
          this["_loadCharacterModelForVisual"](
            v611,
            v610["id"],
            v610["gender"],
          ));
      else
        v611["modelGender"] !==
          resolvePanoramaCharacterGender(v610["gender"]) &&
          (v611["modelRoot"] &&
            (v611["group"]["remove"](v611["modelRoot"]),
            disposeObject3D(v611["modelRoot"]),
            (v611["modelRoot"] = null)),
          this["_loadCharacterModelForVisual"](
            v611,
            v610["id"],
            v610["gender"],
          ));
      const v612 = this["_resolveMannequinColor"](v610["colorKey"]);
      (v611["material"]["color"]["copy"](v612),
        v611["headMaterial"]["color"]["copy"](
          v612["clone"]()["offsetHSL"](0, 0, 0.08),
        ),
        applyGenderShape(v611, v610["gender"]));
      const v613 = this["_draftObjects"]["get"]("mannequin:" + v610["id"]);
      (applyGroupTransform(v611["group"], v613 || v610),
        (v611["group"]["position"]["y"] =
          v613?.["position"]?.["y"] ?? v610["position"]["y"] ?? 0),
        applyGroupScale(v611["group"], v613?.["scale"] ?? v610["scale"] ?? 1));
      const v614 =
        v608 && v604?.["ui"]?.["isEditing"] === true && v607["has"](v610["id"]);
      ((v611["group"]["visible"] = v608),
        (v611["selectionRing"]["visible"] = false),
        setMannequinProxyMode(v611),
        applyCharacterClayMaterial(v611, v612),
        applySelectionEmphasis(v611["material"], v614, 0.18),
        applySelectionEmphasis(v611["headMaterial"], v614, 0.26),
        applyObjectSelectionEmphasis(v611["modelRoot"], v614, 0.12));
    });
    for (const [v615, v616] of this["_mannequinMap"]["entries"]()) {
      if (v609["has"](v615)) continue;
      (this["scene"]["remove"](v616["group"]),
        disposeObject3D(v616["group"]),
        this["_mannequinMap"]["delete"](v615),
        this["_mannequinStateById"]["delete"](v615));
    }
    this["_rebuildPickRoots"]();
  }
  ["_syncCubes"](v617, v618 = false) {
    const v619 = v617?.["cubes"] || [],
      v620 = new Set(collectSelectedObjectIds(v617, "cube")),
      v621 = !v618,
      v622 = new Set();
    v619["forEach"]((v623) => {
      (v622["add"](v623["id"]),
        this["_cubeStateById"]["set"](v623["id"], v623));
      let v624 = this["_cubeMap"]["get"](v623["id"]);
      !v624 &&
        ((v624 = createCubeVisual(
          this["_resolveMannequinColor"](v623["colorKey"]),
        )),
        this["_cubeMap"]["set"](v623["id"], v624),
        this["scene"]["add"](v624["group"]));
      const v625 = this["_resolveMannequinColor"](v623["colorKey"]);
      (v624["material"]["color"]["copy"](v625),
        v624["edgeMaterial"]["color"]["copy"](
          v625["clone"]()["offsetHSL"](0, 0, -0.18),
        ));
      const v626 = this["_draftObjects"]["get"]("cube:" + v623["id"]),
        v627 = v626 || v623;
      (applyGroupTransform(v624["group"], v627),
        (v624["group"]["position"]["y"] =
          Number(v627?.["position"]?.["y"]) || 0),
        applyGroupScale(
          v624["group"],
          v627?.["scale"] ?? v623?.["scale"] ?? 1,
        ));
      const v628 =
        v621 && v617?.["ui"]?.["isEditing"] === true && v620["has"](v623["id"]);
      ((v624["group"]["visible"] = v621),
        (v624["selectionRing"]["visible"] = false),
        applySelectionEmphasis(v624["material"], v628, 0.22),
        (v624["edgeMaterial"]["opacity"] = v628 ? 1 : 0.9));
    });
    for (const [v629, v630] of this["_cubeMap"]["entries"]()) {
      if (v622["has"](v629)) continue;
      (this["scene"]["remove"](v630["group"]),
        disposeObject3D(v630["group"]),
        this["_cubeMap"]["delete"](v629),
        this["_cubeStateById"]["delete"](v629));
    }
    this["_rebuildPickRoots"]();
  }
  ["_syncCameras"](v631, v632 = false) {
    const v633 = Array["isArray"](v631?.["cameras"]) ? v631["cameras"] : [],
      v634 =
        v631?.["viewport"]?.["activeView"] === "camera" &&
        v631?.["viewport"]?.["activeCameraId"]
          ? String(v631["viewport"]["activeCameraId"])
          : null,
      v635 =
        this["_draftView"]?.["kind"] === "camera" &&
        this["_draftView"]?.["cameraId"]
          ? String(this["_draftView"]["cameraId"])
          : null,
      v636 =
        !v632 &&
        v633["some"]((v637) => {
          if (!v637?.["id"]) return false;
          const v638 = normalizeCameraPoseData(v637),
            v639 = cameraPoseToSceneViewFromReference(
              v638,
              v631?.["viewport"]?.["sceneView"],
            );
          return areSceneViewsEquivalent(
            v631?.["viewport"]?.["sceneView"],
            v639,
          );
        }),
      v640 = Boolean(v634 || v635 || v636),
      v641 = !v632 && !v640,
      v642 = new Set();
    v633["forEach"]((v643) => {
      if (!v643?.["id"]) return;
      const v644 = String(v643["id"]);
      (v642["add"](v644), this["_cameraStateById"]["set"](v644, v643));
      let v645 = this["_cameraMap"]["get"](v644);
      !v645 &&
        ((v645 = createCameraVisual()),
        this["_cameraMap"]["set"](v644, v645),
        this["scene"]["add"](v645["group"]));
      const v646 = normalizeCameraPoseData(v643);
      (v645["group"]["position"]["set"](
        v646["position"]["x"],
        v646["position"]["y"],
        v646["position"]["z"],
      ),
        v645["group"]["quaternion"]["set"](
          v646["quaternion"]["x"],
          v646["quaternion"]["y"],
          v646["quaternion"]["z"],
          v646["quaternion"]["w"],
        ),
        (v645["group"]["visible"] = v641));
    });
    for (const [v647, v648] of this["_cameraMap"]["entries"]()) {
      if (v642["has"](v647)) continue;
      (this["scene"]["remove"](v648["group"]),
        disposeObject3D(v648["group"]),
        this["_cameraMap"]["delete"](v647),
        this["_cameraStateById"]["delete"](v647));
    }
  }
  ["_resolveGizmoContext"](v649) {
    const v650 = collectSelectedObjects(v649);
    if (v650["length"] === 0) return null;
    const v651 = resolveActiveTransformTool(v649),
      v652 = v650["map"]((v653) => ({
        objectType: v653["objectType"],
        id: v653["objectId"],
        item:
          this["_draftObjects"]["get"](
            v653["objectType"] + ":" + v653["objectId"],
          ) ||
          this["_getObjectStateByObjectType"](
            v653["objectType"],
            v653["objectId"],
          ),
        visual: this["_getVisualByObjectType"](
          v653["objectType"],
          v653["objectId"],
        ),
      }))["filter"]((v654) => !!v654["visual"] && !!v654["item"]);
    if (v652["length"] === 0) return null;
    v652["forEach"]((v655) => {
      ((v655["pivotWorld"] = resolveObjectToolPivot(
        v655["item"],
        v655["visual"],
        v651,
        v655["objectType"],
      )),
        (v655["orientationQuaternion"] = resolveObjectOrientationQuaternion(
          v655["item"],
          v655["visual"],
        )));
    });
    const v656 =
        v649?.["selection"]?.["selectedObjectType"] === "cube" ||
        v649?.["selection"]?.["selectedObjectType"] === "mannequin"
          ? v649["selection"]["selectedObjectType"]
          : null,
      v657 = v649?.["selection"]?.["selectedObjectId"] || null,
      v658 =
        v657 && v656
          ? v652["find"](
              (v659) => v659["objectType"] === v656 && v659["id"] === v657,
            ) || null
          : null,
      v660 = v658 || v652[0],
      v661 = new threeRuntime["Vector3"](),
      v662 = v652["length"] > 1;
    if (v662)
      (v652["forEach"]((v663) => {
        v661["add"](v663["pivotWorld"]);
      }),
        v661["multiplyScalar"](1 / v652["length"]));
    else v660?.["pivotWorld"] && v661["copy"](v660["pivotWorld"]);
    const v664 = v662
        ? measureVisualBoundsForSelection(v652) || createFallbackBounds()
        : measureVisualBounds(v660["visual"]) || createFallbackBounds(),
      v665 = computeGizmoWorldMetrics(v664),
      { orientationQuaternion: v666, usesLocalOrientation: v667 } =
        resolveSelectionGizmoOrientation(v652, v660, v662),
      v668 = v660?.["objectType"] || null,
      v669 = v652["filter"]((v670) => v670["objectType"] === v668)["map"](
        (v671) => v671["id"],
      );
    return {
      selectedObjectType: v668,
      selectedIds: v669,
      selectedObjects: v652["map"]((v672) => ({
        objectType: v672["objectType"],
        objectId: v672["id"],
      })),
      selectedVisuals: v652,
      activeEntry: v660,
      isMultiSelection: v662,
      pivot: v661["clone"](),
      position: v661["clone"](),
      orientationQuaternion: v666,
      usesLocalOrientation: v667,
      bounds: v664,
      gizmoWorldMetrics: v665,
    };
  }
  ["_computeWorldUnitsPerPixelAt"](v673) {
    if (!v673 || !this["camera"]?.["position"]) return 0;
    const v674 = Math["max"](
        0.001,
        this["camera"]["position"]["distanceTo"](v673),
      ),
      v675 = ((Number(this["camera"]?.["fov"]) || 58) * Math["PI"]) / 180,
      v676 = Math["max"](
        1,
        Number(this["renderer"]?.["domElement"]?.["clientHeight"]) ||
          Number(this["renderer"]?.["domElement"]?.["height"]) ||
          1,
      ),
      v677 = 2 * Math["tan"](v675 / 2) * v674;
    return v677 / v676;
  }
  ["_computeScreenConstantGizmoScale"](v678, v679 = 104) {
    const v680 = this["_computeWorldUnitsPerPixelAt"](v678);
    if (!(v680 > 0)) return 1;
    return Math["max"](0.35, Math["min"](6, v680 * v679));
  }
  ["_captureGizmoDragLock"](v681) {
    if (!this["_gizmo"] || !v681) return null;
    const v682 = this["_gizmo"]["root"]["position"]["clone"](),
      v683 = this["_gizmo"]["root"]["quaternion"]["clone"](),
      v684 = {
        box:
          v681["bounds"]?.["box"]?.["clone"]?.() ||
          createFallbackBounds()["box"],
        size:
          v681["bounds"]?.["size"]?.["clone"]?.() ||
          new threeRuntime["Vector3"](1, 1, 1),
        sphere: v681["bounds"]?.["sphere"]
          ? new threeRuntime["Sphere"](
              v681["bounds"]["sphere"]["center"]?.["clone"]?.() ||
                new threeRuntime["Vector3"](),
              Number(v681["bounds"]["sphere"]["radius"]) || 0,
            )
          : new threeRuntime["Sphere"](
              new threeRuntime["Vector3"](0, 0.5, 0),
              Math["sqrt"](0.75),
            ),
        extents: {
          x: Number(v681["bounds"]?.["extents"]?.["x"]) || 0,
          y: Number(v681["bounds"]?.["extents"]?.["y"]) || 0,
          z: Number(v681["bounds"]?.["extents"]?.["z"]) || 0,
        },
      },
      v685 = {
        extents: {
          x: Number(v681["gizmoWorldMetrics"]?.["extents"]?.["x"]) || 0,
          y: Number(v681["gizmoWorldMetrics"]?.["extents"]?.["y"]) || 0,
          z: Number(v681["gizmoWorldMetrics"]?.["extents"]?.["z"]) || 0,
        },
        sphereRadius:
          Number(v681["gizmoWorldMetrics"]?.["sphereRadius"]) || 0.01,
        margin:
          Number(v681["gizmoWorldMetrics"]?.["margin"]) ||
          GIZMO_MARGIN_WORLD_MIN,
      },
      v686 = {
        ...v681,
        position: v682,
        pivot: v681["pivot"]?.["clone"]?.() || v682["clone"](),
        orientationQuaternion: v683,
        bounds: v684,
        gizmoWorldMetrics: v685,
      },
      v687 = this["_computeScreenConstantGizmoScale"](v682);
    return (
      (this["_gizmo"]["dragLock"] = {
        context: v686,
        position: v682["clone"](),
        orientationQuaternion: v683["clone"](),
        bounds: v684,
        gizmoWorldMetrics: v685,
        scale: v687,
      }),
      this["_gizmo"]["dragLock"]
    );
  }
  ["_applyGizmoLayoutFromContext"](v688, v689) {
    const v690 = this["_gizmo"]?.["baseLayout"],
      v691 = v688?.["gizmoWorldMetrics"];
    if (!v690 || !v691) return;
    const v692 = v691["extents"],
      v693 = v691["margin"],
      v694 = Math["max"](0.01, Number(v691["maxExtent"]) || 0.01),
      v695 = Math["max"](0.001, Number(v689) || 1),
      v696 = GIZMO_MOVE_HEAD_LENGTH * 0.5,
      v697 = GIZMO_SCALE_HEAD_SIZE * 0.5,
      v698 = GIZMO_MOVE_PICK_LENGTH - GIZMO_BASE_AXIS_LENGTH,
      v699 = GIZMO_SCALE_PICK_LENGTH - GIZMO_BASE_SCALE_LENGTH,
      v700 = { x: v692["x"] + v693, y: v692["y"] + v693, z: v692["z"] + v693 };
    (["x", "y", "z"]["forEach"]((v701) => {
      const v702 = this["_gizmo"]?.["moveAxes"]?.[v701],
        v703 = this["_gizmo"]?.["scaleAxes"]?.[v701],
        v704 = Math["max"](v690["axisLength"], v700[v701] / v695),
        v705 = Math["max"](GIZMO_MOVE_SHAFT_LENGTH, v704 - v696),
        v706 = Math["max"](GIZMO_MOVE_PICK_LENGTH, v704 + v698);
      v702?.["shaftLine"] && setAxisLineEnd(v702["shaftLine"], v701, v705);
      v702?.["headMesh"] &&
        setAxisHandleLayout(v702["headMesh"], v704 - v696, v696);
      v702?.["pickMesh"] &&
        (setAxisHandleLayout(v702["pickMesh"], v706 * 0.5),
        v702["pickMesh"]["scale"]["set"](1, v706 / GIZMO_MOVE_PICK_LENGTH, 1));
      const v707 = v690["scaleLength"],
        v708 = Math["max"](GIZMO_SCALE_SHAFT_LENGTH, v707 - v697),
        v709 = Math["max"](GIZMO_SCALE_PICK_LENGTH, v707 + v699);
      (v703?.["shaftLine"] && setAxisLineEnd(v703["shaftLine"], v701, v708),
        v703?.["headMesh"] &&
          setAxisHandleLayout(v703["headMesh"], v707 - v697, v697),
        v703?.["pickMesh"] &&
          (setAxisHandleLayout(v703["pickMesh"], v709 * 0.5),
          v703["pickMesh"]["scale"]["set"](
            1,
            v709 / GIZMO_SCALE_PICK_LENGTH,
            1,
          )));
    }),
      ["x", "y", "z"]["forEach"]((v710) => {
        const v711 = this["_gizmo"]?.["rotateRings"]?.[v710];
        if (v711?.["group"]) v711["group"]["scale"]["setScalar"](1);
      }));
    const v712 = Math["max"](v690["planeOffset"] * 0.5, v693 * 0.42),
      v713 = Math["max"](v690["planeOffset"], (v692["x"] + v712) / v695),
      v714 = Math["max"](v690["planeOffset"], (v692["y"] + v712) / v695),
      v715 = Math["max"](v690["planeOffset"], (v692["z"] + v712) / v695),
      v716 = v690["planeSize"] * 0.86,
      v717 = Math["max"](v690["planeSize"] * 1.2, (v694 / v695) * 0.32),
      v718 = (v719, v720) =>
        Math["max"](v716, Math["min"](v717, Math["min"](v719, v720) * 0.34)),
      v721 = v718(v713, v714),
      v722 = v718(v713, v715),
      v723 = v718(v714, v715),
      v724 = Math["max"](v690["planeSize"] * 0.18, v693 * 0.28) / v695,
      v725 = (v726, v727, v728, v729, v730, v731 = 1, v732 = 1) => {
        if (!v726) return;
        const v733 = v730 / Math["max"](0.001, v690["planeSize"]);
        (v726["visualGroup"] &&
          (v726["visualGroup"]["position"]["set"](v727, v728, v729),
          v726["visualGroup"]["scale"]["set"](v731 * v733, v732 * v733, v733)),
          v726["pickMesh"] &&
            (v726["pickMesh"]["position"]["set"](v727, v728, v729),
            v726["pickMesh"]["scale"]["setScalar"](v733)));
      },
      v734 = (v735, v736) => {
        const v737 = v735?.[v736 + "xy"];
        v737 && v725(v737, v713, v714, v724, v721, 1, 1);
        const v738 = v735?.[v736 + "xz"];
        v738 && v725(v738, v713, v724, v715, v722, 1, 1);
        const v739 = v735?.[v736 + "yz"];
        v739 && v725(v739, v724, v714, v715, v723, 1, 1);
      };
    (v734(this["_gizmo"]?.["planeHandles"], "plane-"),
      v734(this["_gizmo"]?.["scalePlaneHandles"], "scale-plane-"));
  }
  ["_applyGizmoOrientationFromContext"](v740) {
    if (!this["_gizmo"]?.["root"]?.["quaternion"]) return;
    if (!v740) {
      this["_gizmo"]["root"]["quaternion"]["identity"]();
      return;
    }
    if (v740["isMultiSelection"] && v740["usesLocalOrientation"] !== true) {
      this["_gizmo"]["root"]["quaternion"]["identity"]();
      return;
    }
    if (v740["orientationQuaternion"]) {
      this["_gizmo"]["root"]["quaternion"]["copy"](
        v740["orientationQuaternion"],
      );
      return;
    }
    this["_gizmo"]["root"]["quaternion"]["identity"]();
  }
  ["_syncGizmo"](v741, v742 = false) {
    if (v742 || v741?.["mode"] !== "scene") {
      ((this["_gizmo"]["root"]["visible"] = false),
        this["_clearStableGizmoContext"](),
        this["clearGizmoHandleState"]());
      return;
    }
    if (!v741?.["ui"]?.["isEditing"]) {
      ((this["_gizmo"]["root"]["visible"] = false),
        this["_clearStableGizmoContext"](),
        this["clearGizmoHandleState"]());
      return;
    }
    const v743 = resolveActiveTransformTool(v741);
    ((this["_gizmo"]["currentTool"] = v743),
      (this["_gizmo"]["root"]["visible"] =
        v743 === "move" || v743 === "rotate" || v743 === "scale"));
    if (!this["_gizmo"]["root"]["visible"]) {
      (this["_clearStableGizmoContext"](), this["clearGizmoHandleState"]());
      return;
    }
    const v744 = buildTransformSelectionSignature(v741);
    if (!v744) {
      ((this["_gizmo"]["root"]["visible"] = false),
        this["_clearStableGizmoContext"](),
        this["clearGizmoHandleState"]());
      return;
    }
    const v745 = this["_resolveGizmoContext"](v741),
      v746 = v745 || this["_resolveStableGizmoContext"](v741);
    if (!v746) {
      ((this["_gizmo"]["root"]["visible"] = false),
        this["clearGizmoHandleState"]());
      return;
    }
    (v745 && this["_cacheStableGizmoContext"](v741, v745),
      (this["_gizmo"]["moveGroup"]["visible"] = v743 === "move"),
      (this["_gizmo"]["rotateGroup"]["visible"] = v743 === "rotate"),
      (this["_gizmo"]["scaleGroup"]["visible"] = v743 === "scale"),
      this["_gizmo"]["root"]["position"]["copy"](v746["position"]),
      this["_applyGizmoOrientationFromContext"](v746),
      this["_applyGizmoHighlight"]());
  }
  ["_applyGizmoPosition"]() {
    if (!this["_sceneState"]?.["ui"]?.["isEditing"]) return;
    if (!this["_gizmo"]["root"]["visible"]) return;
    const v747 = this["_gizmo"]["dragLock"];
    if (v747) {
      (this["_gizmo"]["root"]["position"]["copy"](v747["position"]),
        this["_gizmo"]["root"]["quaternion"]["copy"](
          v747["orientationQuaternion"],
        ),
        this["_gizmo"]["root"]["scale"]["setScalar"](v747["scale"]),
        this["_applyGizmoLayoutFromContext"](v747["context"], v747["scale"]));
      return;
    }
    const v748 = this["_resolveGizmoContext"](this["_sceneState"]),
      v749 = v748 || this["_resolveStableGizmoContext"](this["_sceneState"]);
    if (!v749) return;
    v748 && this["_cacheStableGizmoContext"](this["_sceneState"], v748);
    (this["_gizmo"]["root"]["position"]["copy"](v749["position"]),
      this["_applyGizmoOrientationFromContext"](v749));
    const v750 = this["_computeScreenConstantGizmoScale"](v749["position"]);
    (this["_gizmo"]["root"]["scale"]["setScalar"](v750),
      this["_applyGizmoLayoutFromContext"](v749, v750));
  }
  ["_applyGizmoHighlight"]() {
    const v751 = this["_gizmo"]?.["hoverHandle"] || null,
      v752 = this["_gizmo"]?.["activeHandle"] || null,
      v753 = (v754) => {
        const v755 = new Set();
        if (!v754) return v755;
        v755["add"](v754);
        const v756 = this["_gizmo"]?.["handles"]?.["get"]?.(v754) || null;
        return (
          v756?.["mode"] === "plane" &&
            (v756["linkedAxes"] || [])["forEach"]((v757) => {
              if (v757) v755["add"]("axis-" + v757);
            }),
          v755
        );
      },
      v758 = v753(v752),
      v759 = v753(v751);
    this["_gizmo"]?.["handles"]?.["forEach"]((v760, v761) => {
      const v762 = v758["has"](v761),
        v763 = !v762 && v759["has"](v761),
        v764 = v762 ? 0.52 : v763 ? 0.3 : 0,
        v765 = v762 ? 1 : v763 ? 0.92 : 0.8;
      (v760["visuals"] || [])["forEach"]((v766) => {
        const v767 = v766?.["material"],
          v768 = v766?.["color"];
        if (!v767?.["color"] || !v768) return;
        (v767["color"]
          ["copy"](v768)
          ["lerp"](new threeRuntime["Color"](16777215), v764),
          typeof v766["opacity"] === "number" &&
            "opacity" in v767 &&
            (v767["opacity"] = v766["opacity"] * v765),
          (v767["needsUpdate"] = true));
      });
    });
  }
  ["_applyRenderView"]() {
    const v769 = this["_resolveTargetRenderPose"](),
      v770 = performance["now"](),
      v771 = this["_shouldSmoothTargetPose"](v769, v770),
      v772 = v771
        ? this["_applyPoseSmoothing"](v769, v770)
        : cloneRenderPose(v769),
      v773 = v771 && measurePoseDistance(v772, v769) > POSE_SETTLE_EPSILON;
    return (
      (!v771 || !v773) &&
        ((this["_smoothedPose"] = cloneRenderPose(v769)),
        (this["_lastRenderTime"] = v770)),
      (this["_renderPose"] = v772),
      this["_commitCameraFromPose"](v772),
      { keepAnimating: v773 }
    );
  }
  ["_resolveTargetRenderPose"]() {
    const v774 = this["_sceneState"],
      v775 = this["_draftView"],
      v776 = this["_isPanorama360Mode"](v774);
    let v777;
    if (v776) {
      const v778 =
        v775?.["kind"] === "panorama-default"
          ? v775["panoramaView"] || v774?.["viewport"]?.["panoramaView"]
          : v774?.["viewport"]?.["panoramaView"];
      v777 = resolvePanoramaViewPose(v778, { x: 0, y: 0, z: 0 });
    } else {
      if (v775?.["kind"] === "camera") {
        const v779 = normalizeCameraPoseData(v775);
        v777 = {
          kind: "camera",
          position: v779["position"],
          quaternion: v779["quaternion"],
          rotation: v779["rotation"],
          fov: v779["fov"],
        };
      } else {
        if (v775?.["kind"] === "scene-default")
          v777 = resolveSceneCameraPose(
            v775["sceneView"] || v774["viewport"]["sceneView"],
            Number["isFinite"](Number(v775["fov"]))
              ? Number(v775["fov"])
              : focalLengthToFov(this["_defaultSceneFocalLength"]),
          );
        else {
          if (v775?.["kind"] === "panorama-default")
            v777 = resolvePanoramaViewPose(
              v775["panoramaView"] || v774["viewport"]["panoramaView"],
            );
          else {
            if (v774["mode"] === "panorama")
              v777 = resolvePanoramaViewPose(v774["viewport"]["panoramaView"]);
            else
              v774?.["viewport"]?.["activeView"] === "camera" &&
              v774?.["viewport"]?.["activeCameraId"]
                ? (v777 = resolveSceneCameraPose(
                    v774["viewport"]["sceneView"],
                    focalLengthToFov(this["_defaultSceneFocalLength"]),
                  ))
                : (v777 = resolveSceneCameraPose(
                    v774["viewport"]["sceneView"],
                    focalLengthToFov(this["_defaultSceneFocalLength"]),
                  ));
          }
        }
      }
    }
    return v777;
  }
  ["_shouldSmoothTargetPose"](v780, v781 = performance["now"]()) {
    if (this["_draftView"]?.["disableSmoothing"] === true) return false;
    if (!v780 || v780["kind"] === "camera") return false;
    if (v781 <= (this["_viewSmoothingUntil"] || 0)) return true;
    if (
      !this["_smoothedPose"] ||
      this["_smoothedPose"]["kind"] !== v780["kind"]
    )
      return false;
    return (
      measurePoseDistance(this["_smoothedPose"], v780) > POSE_SETTLE_EPSILON
    );
  }
  ["_applyPoseSmoothing"](v782, v783 = performance["now"]()) {
    if (
      !this["_smoothedPose"] ||
      this["_smoothedPose"]["kind"] !== v782["kind"]
    )
      return (
        (this["_smoothedPose"] = cloneRenderPose(v782)),
        (this["_lastRenderTime"] = v783),
        cloneRenderPose(v782)
      );
    const v784 = Math["min"](
      VIEW_DAMPING_MAX_DT_MS,
      Math["max"](0, v783 - (this["_lastRenderTime"] || v783)),
    );
    this["_lastRenderTime"] = v783;
    const v785 = this["_smoothedPose"];
    if (v782["kind"] === "panorama-default")
      return (
        (v785["position"]["x"] = dampScalar(
          v785["position"]["x"],
          v782["position"]["x"],
          v784,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (v785["position"]["y"] = dampScalar(
          v785["position"]["y"],
          v782["position"]["y"],
          v784,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (v785["position"]["z"] = dampScalar(
          v785["position"]["z"],
          v782["position"]["z"],
          v784,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (v785["yaw"] = dampAngle(
          v785["yaw"],
          v782["yaw"],
          v784,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (v785["pitch"] = dampScalar(
          v785["pitch"],
          v782["pitch"],
          v784,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        (v785["fov"] = dampScalar(
          v785["fov"],
          v782["fov"],
          v784,
          VIEW_DAMPING_TIME_CONSTANT_MS,
        )),
        cloneRenderPose(v785)
      );
    return (
      (v785["position"]["x"] = dampScalar(
        v785["position"]["x"],
        v782["position"]["x"],
        v784,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (v785["position"]["y"] = dampScalar(
        v785["position"]["y"],
        v782["position"]["y"],
        v784,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (v785["position"]["z"] = dampScalar(
        v785["position"]["z"],
        v782["position"]["z"],
        v784,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (v785["target"]["x"] = dampScalar(
        v785["target"]["x"],
        v782["target"]["x"],
        v784,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (v785["target"]["y"] = dampScalar(
        v785["target"]["y"],
        v782["target"]["y"],
        v784,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (v785["target"]["z"] = dampScalar(
        v785["target"]["z"],
        v782["target"]["z"],
        v784,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (v785["fov"] = dampScalar(
        v785["fov"],
        v782["fov"],
        v784,
        VIEW_DAMPING_TIME_CONSTANT_MS,
      )),
      (v785["yaw"] = v782["yaw"]),
      (v785["pitch"] = v782["pitch"]),
      (v785["distance"] = v782["distance"]),
      cloneRenderPose(v785)
    );
  }
  ["_commitCameraFromPose"](v786) {
    if (!v786) return;
    const v787 = v786?.["kind"] === "panorama-default" ? 55 : 58;
    ((this["camera"]["fov"] = Number["isFinite"](Number(v786?.["fov"]))
      ? Number(v786["fov"])
      : v787),
      this["camera"]["updateProjectionMatrix"]());
    if (v786["kind"] === "camera") {
      const v788 = normalizeCameraPoseData(v786);
      (this["camera"]["position"]["set"](
        v788["position"]["x"],
        v788["position"]["y"],
        v788["position"]["z"],
      ),
        this["camera"]["quaternion"]["set"](
          v788["quaternion"]["x"],
          v788["quaternion"]["y"],
          v788["quaternion"]["z"],
          v788["quaternion"]["w"],
        ));
      return;
    }
    if (v786["kind"] === "panorama-default") {
      const v789 = forwardVectorFromYawPitch(v786["yaw"], v786["pitch"]);
      (this["camera"]["position"]["set"](0, 0, 0),
        this["camera"]["lookAt"](v789["x"], v789["y"], v789["z"]));
      return;
    }
    (this["camera"]["position"]["set"](
      v786["position"]["x"],
      v786["position"]["y"],
      v786["position"]["z"],
    ),
      this["camera"]["lookAt"](
        v786["target"]["x"],
        v786["target"]["y"],
        v786["target"]["z"],
      ));
  }
  ["_applyDraftObjects"]() {
    if (!this["_sceneState"]) return;
    (this["_mannequinMap"]["forEach"]((v790, v791) => {
      const v792 = this["_mannequinStateById"]["get"](v791);
      if (!v792) return;
      const v793 = this["_draftObjects"]["get"]("mannequin:" + v791),
        v794 = v793 || v792;
      (applyGroupTransform(v790["group"], v794),
        (v790["group"]["position"]["y"] =
          Number(v794?.["position"]?.["y"]) || 0),
        applyGroupScale(
          v790["group"],
          v794?.["scale"] ?? v792?.["scale"] ?? 1,
        ));
    }),
      this["_cubeMap"]["forEach"]((v795, v796) => {
        const v797 = this["_cubeStateById"]["get"](v796);
        if (!v797) return;
        const v798 = this["_draftObjects"]["get"]("cube:" + v796),
          v799 = v798 || v797;
        (applyGroupTransform(v795["group"], v799),
          (v795["group"]["position"]["y"] =
            Number(v799?.["position"]?.["y"]) || 0),
          applyGroupScale(
            v795["group"],
            v799?.["scale"] ?? v797?.["scale"] ?? 1,
          ));
      }));
  }
  ["_getObjectStateByObjectType"](v800, v801) {
    if (v800 === "cube") return this["_cubeStateById"]["get"](v801) || null;
    if (v800 === "mannequin")
      return this["_mannequinStateById"]["get"](v801) || null;
    return null;
  }
  ["_getVisualByObjectType"](v802, v803) {
    if (v802 === "cube") return this["_cubeMap"]["get"](v803);
    if (v802 === "mannequin") return this["_mannequinMap"]["get"](v803);
    return null;
  }
}
