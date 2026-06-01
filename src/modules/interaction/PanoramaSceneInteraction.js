import {
  applyOrbitDelta,
  applyPanoramaLookDelta,
  applyPanoramaZoomDelta,
  applySceneDollyDelta,
  applyScenePanDelta,
  applySceneZoomDelta,
} from "../../core/panoramaSceneMath.js";
import * as threeRuntime from "../panoramaSceneNode/threeRuntime.js";
const MOVE_THRESHOLD = 3;
function hasFiniteQuaternion(v0) {
  return (
    Number["isFinite"](Number(v0?.["x"])) &&
    Number["isFinite"](Number(v0?.["y"])) &&
    Number["isFinite"](Number(v0?.["z"])) &&
    Number["isFinite"](Number(v0?.["w"]))
  );
}
function cloneObjectPose(v1) {
  const v2 = Number["isFinite"](v1?.["scale"])
      ? Number(v1["scale"]) || 1
      : v1?.["scale"] &&
          Number["isFinite"](v1["scale"]["x"]) &&
          Number["isFinite"](v1["scale"]["y"]) &&
          Number["isFinite"](v1["scale"]["z"])
        ? {
            x: Number(v1["scale"]["x"]) || 1,
            y: Number(v1["scale"]["y"]) || 1,
            z: Number(v1["scale"]["z"]) || 1,
          }
        : 1,
    v3 = {
      x: Number(v1?.["rotation"]?.["x"]) || 0,
      y: Number(v1?.["rotation"]?.["y"]) || 0,
      z: Number(v1?.["rotation"]?.["z"]) || 0,
    },
    v4 = hasFiniteQuaternion(v1?.["quaternion"])
      ? new threeRuntime["Quaternion"](
          Number(v1["quaternion"]["x"]),
          Number(v1["quaternion"]["y"]),
          Number(v1["quaternion"]["z"]),
          Number(v1["quaternion"]["w"]),
        )["normalize"]()
      : new threeRuntime["Quaternion"]()["setFromEuler"](
          new threeRuntime["Euler"](v3["x"], v3["y"], v3["z"], "XYZ"),
        );
  return {
    position: {
      x: Number(v1?.["position"]?.["x"]) || 0,
      y: Number(v1?.["position"]?.["y"]) || 0,
      z: Number(v1?.["position"]?.["z"]) || 0,
    },
    rotation: v3,
    quaternion: { x: v4["x"], y: v4["y"], z: v4["z"], w: v4["w"] },
    fov: Number(v1?.["fov"]) || 58,
    scale: v2,
  };
}
function toScaleVector(v5) {
  if (Number["isFinite"](v5)) {
    const v6 = Math["max"](0.01, Number(v5) || 1);
    return { x: v6, y: v6, z: v6 };
  }
  if (
    v5 &&
    Number["isFinite"](v5["x"]) &&
    Number["isFinite"](v5["y"]) &&
    Number["isFinite"](v5["z"])
  )
    return {
      x: Math["max"](0.01, Number(v5["x"]) || 1),
      y: Math["max"](0.01, Number(v5["y"]) || 1),
      z: Math["max"](0.01, Number(v5["z"]) || 1),
    };
  return { x: 1, y: 1, z: 1 };
}
function toCompatibleScale(v7) {
  const v8 = toScaleVector(v7),
    v9 = 0.0001;
  if (
    Math["abs"](v8["x"] - v8["y"]) < v9 &&
    Math["abs"](v8["y"] - v8["z"]) < v9
  )
    return (v8["x"] + v8["y"] + v8["z"]) / 3;
  return v8;
}
function toVector3(v10) {
  return new threeRuntime["Vector3"](
    Number(v10?.["x"]) || 0,
    Number(v10?.["y"]) || 0,
    Number(v10?.["z"]) || 0,
  );
}
function fromVector3(v11) {
  return { x: v11["x"], y: v11["y"], z: v11["z"] };
}
function rotatePoseAroundWorldAxis(v12, v13, v14, v15) {
  const v16 = toVector3(v13);
  if (
    v16["lengthSq"]() < 1e-8 ||
    !Number["isFinite"](v14) ||
    Math["abs"](v14) < 1e-8
  ) {
    const v17 = hasFiniteQuaternion(v12?.["quaternion"])
      ? {
          x: Number(v12["quaternion"]["x"]) || 0,
          y: Number(v12["quaternion"]["y"]) || 0,
          z: Number(v12["quaternion"]["z"]) || 0,
          w: Number(v12["quaternion"]["w"]) || 1,
        }
      : undefined;
    return {
      position: {
        x: Number(v12?.["position"]?.["x"]) || 0,
        y: Number(v12?.["position"]?.["y"]) || 0,
        z: Number(v12?.["position"]?.["z"]) || 0,
      },
      rotation: {
        x: Number(v12?.["rotation"]?.["x"]) || 0,
        y: Number(v12?.["rotation"]?.["y"]) || 0,
        z: Number(v12?.["rotation"]?.["z"]) || 0,
      },
      quaternion: v17,
    };
  }
  v16["normalize"]();
  const v18 = toVector3(v15),
    v19 = toVector3(v12?.["position"]),
    v20 = hasFiniteQuaternion(v12?.["quaternion"])
      ? new threeRuntime["Quaternion"](
          Number(v12["quaternion"]["x"]) || 0,
          Number(v12["quaternion"]["y"]) || 0,
          Number(v12["quaternion"]["z"]) || 0,
          Number(v12["quaternion"]["w"]) || 1,
        )["normalize"]()
      : new threeRuntime["Quaternion"]()["setFromEuler"](
          new threeRuntime["Euler"](
            Number(v12?.["rotation"]?.["x"]) || 0,
            Number(v12?.["rotation"]?.["y"]) || 0,
            Number(v12?.["rotation"]?.["z"]) || 0,
            "XYZ",
          ),
        ),
    v21 = new threeRuntime["Quaternion"]()["setFromAxisAngle"](v16, v14),
    v22 = v19["sub"](v18)["applyQuaternion"](v21)["add"](v18),
    v23 = v21["clone"]()["multiply"](v20),
    v24 = new threeRuntime["Euler"]()["setFromQuaternion"](v23, "XYZ");
  return {
    position: fromVector3(v22),
    rotation: { x: v24["x"], y: v24["y"], z: v24["z"] },
    quaternion: { x: v23["x"], y: v23["y"], z: v23["z"], w: v23["w"] },
  };
}
function scalePositionAroundPivot(v25, v26, v27, v28 = null) {
  const v29 = Number["isFinite"](v27) ? v27 : 1,
    v30 = toVector3(v26),
    v31 = toVector3(v25),
    v32 = v31["sub"](v30);
  if (!v28) return fromVector3(v32["multiplyScalar"](v29)["add"](v30));
  const v33 = toVector3(v28);
  if (v33["lengthSq"]() < 1e-8) return fromVector3(v32["add"](v30));
  v33["normalize"]();
  const v34 = v33["clone"]()["multiplyScalar"](v32["dot"](v33)),
    v35 = v32["clone"]()["sub"](v34);
  return fromVector3(v35["add"](v34["multiplyScalar"](v29))["add"](v30));
}
function getClientRectFromPoints(v36, v37, v38, v39) {
  return {
    left: Math["min"](v36, v38),
    top: Math["min"](v37, v39),
    right: Math["max"](v36, v38),
    bottom: Math["max"](v37, v39),
  };
}
function getLocalRectFromPoints(v40, v41, v42, v43) {
  return {
    left: Math["min"](v40, v42),
    top: Math["min"](v41, v43),
    width: Math["abs"](v42 - v40),
    height: Math["abs"](v43 - v41),
  };
}
function addVector3Like(v44, v45) {
  return {
    x: (Number(v44?.["x"]) || 0) + (Number(v45?.["x"]) || 0),
    y: (Number(v44?.["y"]) || 0) + (Number(v45?.["y"]) || 0),
    z: (Number(v44?.["z"]) || 0) + (Number(v45?.["z"]) || 0),
  };
}
export function measureSelectionBoxLocalRect(v46, v47, v48, v49, v50) {
  const v51 = v46?.["getBoundingClientRect"]?.() || {
      left: 0,
      top: 0,
      width: 1,
      height: 1,
    },
    v52 = Math["max"](1, Number(v46?.["offsetWidth"]) || v51["width"] || 1),
    v53 = Math["max"](1, Number(v46?.["offsetHeight"]) || v51["height"] || 1),
    v54 = v51["width"] > 0 ? v51["width"] / v52 : 1,
    v55 = v51["height"] > 0 ? v51["height"] / v53 : 1,
    v56 = v54 > 0 ? v54 : 1,
    v57 = v55 > 0 ? v55 : 1;
  return {
    left: (Math["min"](v47, v49) - v51["left"]) / v56,
    top: (Math["min"](v48, v50) - v51["top"]) / v57,
    width: Math["abs"](v49 - v47) / v56,
    height: Math["abs"](v50 - v48) / v57,
  };
}
export class PanoramaSceneInteraction {
  constructor({
    viewportEl: v58,
    overlayEl: v59,
    bridge: v60,
    getSceneState: v61,
    onViewCommit: v62,
    onObjectCommit: v63,
    onObjectBatchCommit: v64,
    onSelectionChange: v65,
    onSelectionBatchChange: v66,
    onSelectionObjectsChange: v67,
    onSelectionClear: v68,
  } = {}) {
    ((this["viewportEl"] = v58),
      (this["overlayEl"] = v59 || v58),
      (this["bridge"] = v60),
      (this["getSceneState"] = v61),
      (this["onViewCommit"] = v62),
      (this["onObjectCommit"] = v63),
      (this["onObjectBatchCommit"] = v64),
      (this["onSelectionChange"] = v65),
      (this["onSelectionBatchChange"] = v66),
      (this["onSelectionObjectsChange"] = v67),
      (this["onSelectionClear"] = v68),
      (this["_gesture"] = null),
      (this["_selectionBoxEl"] = null),
      (this["_clearDraftRafId"] = null),
      (this["_queuedDraftClearTasks"] = []),
      (this["_handlePointerDown"] = this["_handlePointerDown"]["bind"](this)),
      (this["_handlePointerMove"] = this["_handlePointerMove"]["bind"](this)),
      (this["_handlePointerUp"] = this["_handlePointerUp"]["bind"](this)),
      (this["_handlePointerLeave"] = this["_handlePointerLeave"]["bind"](this)),
      (this["_handleWheel"] = this["_handleWheel"]["bind"](this)),
      (this["_handleContextMenu"] = this["_handleContextMenu"]["bind"](this)));
  }
  ["attach"]() {
    if (!this["viewportEl"]) return;
    (this["viewportEl"]["addEventListener"](
      "pointerdown",
      this["_handlePointerDown"],
    ),
      this["viewportEl"]["addEventListener"](
        "pointermove",
        this["_handlePointerMove"],
      ),
      this["viewportEl"]["addEventListener"](
        "pointerup",
        this["_handlePointerUp"],
      ),
      this["viewportEl"]["addEventListener"](
        "pointercancel",
        this["_handlePointerUp"],
      ),
      this["viewportEl"]["addEventListener"](
        "pointerleave",
        this["_handlePointerLeave"],
      ),
      this["viewportEl"]["addEventListener"]("wheel", this["_handleWheel"], {
        passive: false,
      }),
      this["viewportEl"]["addEventListener"](
        "contextmenu",
        this["_handleContextMenu"],
      ));
  }
  ["detach"]() {
    if (!this["viewportEl"]) return;
    (this["viewportEl"]["removeEventListener"](
      "pointerdown",
      this["_handlePointerDown"],
    ),
      this["viewportEl"]["removeEventListener"](
        "pointermove",
        this["_handlePointerMove"],
      ),
      this["viewportEl"]["removeEventListener"](
        "pointerup",
        this["_handlePointerUp"],
      ),
      this["viewportEl"]["removeEventListener"](
        "pointercancel",
        this["_handlePointerUp"],
      ),
      this["viewportEl"]["removeEventListener"](
        "pointerleave",
        this["_handlePointerLeave"],
      ),
      this["viewportEl"]["removeEventListener"]("wheel", this["_handleWheel"]),
      this["viewportEl"]["removeEventListener"](
        "contextmenu",
        this["_handleContextMenu"],
      ),
      this["_cancelQueuedDraftClear"](),
      this["_clearSelectionBox"](),
      this["bridge"]?.["clearGizmoHandleState"]?.(),
      this["_clearGizmoMoveGuideLine"](),
      this["bridge"]?.["clearAllDrafts"]?.());
  }
  ["_isEditing"](v69) {
    return v69?.["ui"]?.["isEditing"] === true;
  }
  ["_isPanoramaMode"](v70) {
    return v70?.["type"] === "panorama-360";
  }
  ["_syncControlsByMode"](v71) {
    const v72 = this["bridge"]?.["controls"] || this["bridge"]?.["_controls"];
    if (!v72) return;
    ("enablePan" in v72 && (v72["enablePan"] = v71 ? false : true),
      "enableRotate" in v72 && (v72["enableRotate"] = true));
  }
  ["_stopEvent"](v73, v74 = {}) {
    v73["stopPropagation"]();
    if (v74["preventDefault"]) v73["preventDefault"]();
  }
  ["_createBaseView"](v75) {
    if (v75["mode"] === "panorama") {
      const v76 = { ...v75["viewport"]["panoramaView"] };
      return { kind: "panorama-default", sceneState: v75, panoramaView: v76 };
    }
    const v77 = this["bridge"]?.["readCurrentViewPose"]?.() || null,
      v78 = { ...v75["viewport"]["sceneView"] };
    return {
      kind: "scene-default",
      sceneState: v75,
      sceneView: v78,
      currentPose: v77,
    };
  }
  ["_getObjectByPick"](v79, v80) {
    if (!v80) return null;
    if (v80["objectType"] !== "cube" && v80["objectType"] !== "mannequin")
      return null;
    const v81 = v80["objectType"] === "cube" ? v79["cubes"] : v79["mannequins"];
    return v81["find"]((v82) => v82["id"] === v80["objectId"]) || null;
  }
  ["_getSelectedObject"](v83) {
    const v84 = v83?.["selection"]?.["selectedObjectType"],
      v85 = v83?.["selection"]?.["selectedObjectId"];
    if (!v84 || !v85) return null;
    if (v84 !== "cube" && v84 !== "mannequin") return null;
    const v86 = v84 === "cube" ? v83["cubes"] : v83["mannequins"],
      v87 = v86["find"]((v88) => v88["id"] === v85) || null;
    if (!v87) return null;
    return { objectType: v84, objectId: v85, item: v87 };
  }
  ["_findGroupByMember"](v89, v90, v91) {
    if (v90 !== "mannequin" || !v91) return null;
    const v92 = Array["isArray"](v89?.["groups"]) ? v89["groups"] : [];
    return (
      v92["find"](
        (v93) =>
          Array["isArray"](v93["memberIds"]) &&
          v93["memberIds"]["includes"](v91),
      ) || null
    );
  }
  ["_resolveTargetsByIds"](v94, v95, v96) {
    const v97 = Array["isArray"](v96) ? v96 : [];
    if (!v95 || v97["length"] === 0) return [];
    if (v95 !== "cube" && v95 !== "mannequin") return [];
    const v98 = v95 === "cube" ? v94["cubes"] : v94["mannequins"],
      v99 = new Set(v97);
    return v98["filter"]((v100) => v99["has"](v100["id"]))["map"]((v101) => ({
      objectType: v95,
      objectId: v101["id"],
      item: v101,
    }));
  }
  ["_collectSelectionObjects"](v102) {
    const v103 = Array["isArray"](v102?.["cubes"]) ? v102["cubes"] : [],
      v104 = Array["isArray"](v102?.["mannequins"]) ? v102["mannequins"] : [],
      v105 = new Set(v103["map"]((v106) => v106["id"])),
      v107 = new Set(v104["map"]((v108) => v108["id"])),
      v109 = new Set(),
      v110 = [],
      v111 = (v112, v113) => {
        if (v112 !== "cube" && v112 !== "mannequin") return;
        const v114 = String(v113 || "")["trim"]();
        if (!v114) return;
        const v115 = v112 === "cube" ? v105["has"](v114) : v107["has"](v114);
        if (!v115) return;
        const v116 = v112 + ":" + v114;
        if (v109["has"](v116)) return;
        (v109["add"](v116), v110["push"]({ objectType: v112, objectId: v114 }));
      },
      v117 = Array["isArray"](v102?.["selection"]?.["selectedObjects"])
        ? v102["selection"]["selectedObjects"]
        : [];
    v117["forEach"]((v118) => {
      v111(v118?.["objectType"], v118?.["objectId"]);
    });
    if (v110["length"] > 0) return v110;
    const v119 = v102?.["selection"]?.["selectedGroupId"] || null;
    if (v119) {
      const v120 = (v102?.["groups"] || [])["find"](
        (v121) => v121["id"] === v119,
      );
      if (
        Array["isArray"](v120?.["memberIds"]) &&
        v120["memberIds"]["length"] > 0
      ) {
        v120["memberIds"]["forEach"]((v122) => {
          v111("mannequin", v122);
        });
        if (v110["length"] > 0) return v110;
      }
    }
    const v123 =
      v102?.["selection"]?.["selectedObjectType"] === "cube" ||
      v102?.["selection"]?.["selectedObjectType"] === "mannequin"
        ? v102["selection"]["selectedObjectType"]
        : null;
    if (!v123) return v110;
    const v124 = Array["isArray"](v102?.["selection"]?.["selectedObjectIds"])
      ? v102["selection"]["selectedObjectIds"]
      : [];
    if (v124["length"] > 0) {
      v124["forEach"]((v125) => {
        v111(v123, v125);
      });
      if (v110["length"] > 0) return v110;
    }
    return (
      v111(v123, v102?.["selection"]?.["selectedObjectId"] || null),
      v110
    );
  }
  ["_getSelectionTargets"](v126) {
    const v127 = this["_collectSelectionObjects"](v126);
    if (v127["length"] > 0) {
      const v128 = new Map(
          (Array["isArray"](v126?.["cubes"]) ? v126["cubes"] : [])["map"](
            (v129) => [v129["id"], v129],
          ),
        ),
        v130 = new Map(
          (Array["isArray"](v126?.["mannequins"]) ? v126["mannequins"] : [])[
            "map"
          ]((v131) => [v131["id"], v131]),
        );
      return v127["map"]((v132) => {
        const v133 =
          v132["objectType"] === "cube"
            ? v128["get"](v132["objectId"])
            : v130["get"](v132["objectId"]);
        if (!v133) return null;
        return {
          objectType: v132["objectType"],
          objectId: v132["objectId"],
          item: v133,
        };
      })["filter"](Boolean);
    }
    return [];
  }
  ["_ensureSelectionBox"]() {
    if (this["_selectionBoxEl"]) return this["_selectionBoxEl"];
    const v134 = document["createElement"]("div");
    return (
      (v134["className"] = "panorama-scene-selection-box"),
      this["overlayEl"]?.["appendChild"](v134),
      (this["_selectionBoxEl"] = v134),
      v134
    );
  }
  ["_updateSelectionBox"](v135, v136, v137, v138) {
    const v139 = getLocalRectFromPoints(v135, v136, v137, v138),
      v140 = this["_ensureSelectionBox"]();
    ((v140["style"]["left"] = v139["left"] + "px"),
      (v140["style"]["top"] = v139["top"] + "px"),
      (v140["style"]["width"] = v139["width"] + "px"),
      (v140["style"]["height"] = v139["height"] + "px"),
      v140["classList"]["add"]("is-visible"));
  }
  ["_getLocalPoint"](v141) {
    const v142 = this["viewportEl"]?.["getBoundingClientRect"]?.() || {
        left: 0,
        top: 0,
        width: 1,
        height: 1,
      },
      v143 = Math["max"](
        1,
        Number(this["viewportEl"]?.["offsetWidth"]) || v142["width"] || 1,
      ),
      v144 = Math["max"](
        1,
        Number(this["viewportEl"]?.["offsetHeight"]) || v142["height"] || 1,
      ),
      v145 = v142["width"] > 0 ? v142["width"] / v143 : 1,
      v146 = v142["height"] > 0 ? v142["height"] / v144 : 1,
      v147 = v145 > 0 ? v145 : 1,
      v148 = v146 > 0 ? v146 : 1;
    return {
      x: (v141?.["clientX"] - v142["left"]) / v147,
      y: (v141?.["clientY"] - v142["top"]) / v148,
    };
  }
  ["_clearSelectionBox"]() {
    (this["_selectionBoxEl"]?.["remove"](), (this["_selectionBoxEl"] = null));
  }
  ["_queueDraftClear"](v149) {
    if (typeof v149 !== "function") return;
    this["_queuedDraftClearTasks"]["push"](v149);
    if (this["_clearDraftRafId"] != null) return;
    this["_clearDraftRafId"] = requestAnimationFrame(() => {
      this["_clearDraftRafId"] = null;
      const v150 = this["_queuedDraftClearTasks"]["splice"](
        0,
        this["_queuedDraftClearTasks"]["length"],
      );
      v150["forEach"]((v151) => {
        try {
          v151();
        } catch {}
      });
    });
  }
  ["_cancelQueuedDraftClear"]() {
    (this["_clearDraftRafId"] != null &&
      (cancelAnimationFrame(this["_clearDraftRafId"]),
      (this["_clearDraftRafId"] = null)),
      (this["_queuedDraftClearTasks"]["length"] = 0));
  }
  ["_beginObjectMove"](v152, v153, v154, v155) {
    const v156 = cloneObjectPose(v155),
      v157 = this["bridge"]?.["intersectGround"]?.(
        v152["clientX"],
        v152["clientY"],
        0,
      ) || { x: v156["position"]["x"], y: 0, z: v156["position"]["z"] };
    return {
      type: "object-move",
      pointerId: v152["pointerId"],
      startX: v152["clientX"],
      startY: v152["clientY"],
      objectType: v154["objectType"],
      objectId: v154["objectId"],
      basePose: v156,
      moved: false,
      offset: {
        x: v157["x"] - v156["position"]["x"],
        z: v157["z"] - v156["position"]["z"],
      },
    };
  }
  ["_beginBatchMove"](v158, v159) {
    const v160 = Array["isArray"](v159) ? v159 : [];
    if (v160["length"] === 0) return null;
    const v161 = v160["map"]((v162) => ({
        objectType: v162["objectType"],
        objectId: v162["objectId"],
        pose: cloneObjectPose(v162["item"]),
      })),
      v163 = v161["reduce"](
        (v164, v165) => {
          return (
            (v164["x"] += v165["pose"]["position"]["x"]),
            (v164["z"] += v165["pose"]["position"]["z"]),
            v164
          );
        },
        { x: 0, z: 0 },
      );
    ((v163["x"] /= v161["length"]), (v163["z"] /= v161["length"]));
    const v166 = this["bridge"]?.["intersectGround"]?.(
      v158["clientX"],
      v158["clientY"],
      0,
    ) || { x: v163["x"], y: 0, z: v163["z"] };
    return {
      type: "object-move-batch",
      pointerId: v158["pointerId"],
      startX: v158["clientX"],
      startY: v158["clientY"],
      moved: false,
      baseCenter: v163,
      pointerOffset: { x: v166["x"] - v163["x"], z: v166["z"] - v163["z"] },
      entries: v161["map"]((v167) => ({
        ...v167,
        offset: {
          x: v167["pose"]["position"]["x"] - v163["x"],
          z: v167["pose"]["position"]["z"] - v163["z"],
        },
      })),
    };
  }
  ["_beginGizmoMove"](v168, v169, v170) {
    const v171 = this["_getSelectionTargets"](v169);
    if (!v171["length"]) return null;
    const v172 = this["bridge"]?.["beginMoveGizmoDrag"]?.({
      handleKey: v170?.["handleKey"],
      clientX: v168["clientX"],
      clientY: v168["clientY"],
    });
    if (!v172) return null;
    const v173 = v171["map"]((v174) => ({
      objectType: v174["objectType"],
      objectId: v174["objectId"],
      basePose: cloneObjectPose(v174["item"]),
    }));
    return (
      this["bridge"]?.["setGizmoActiveHandle"]?.(v170["handleKey"]),
      this["bridge"]?.["setGizmoMoveGuideLine"]?.({
        from: v172?.["pivot"] || { x: 0, y: 0, z: 0 },
        to: v172?.["pivot"] || { x: 0, y: 0, z: 0 },
      }),
      {
        type: "gizmo-move",
        pointerId: v168["pointerId"],
        startX: v168["clientX"],
        startY: v168["clientY"],
        moved: false,
        handleKey: v170["handleKey"],
        dragState: v172,
        entries: v173,
        draftTargets: [],
      }
    );
  }
  ["_clearGizmoMoveGuideLine"]() {
    this["bridge"]?.["clearGizmoMoveGuideLine"]?.();
  }
  ["_beginGizmoRotate"](v175, v176, v177) {
    const v178 = this["_getSelectionTargets"](v176);
    if (!v178["length"]) return null;
    const v179 = this["bridge"]?.["beginRotateGizmoDrag"]?.({
      handleKey: v177?.["handleKey"],
      clientX: v175["clientX"],
      clientY: v175["clientY"],
    });
    if (!v179) return null;
    const v180 = v178["map"]((v181) => ({
      objectType: v181["objectType"],
      objectId: v181["objectId"],
      basePose: cloneObjectPose(v181["item"]),
    }));
    return (
      this["bridge"]?.["setGizmoActiveHandle"]?.(v177["handleKey"]),
      {
        type: "gizmo-rotate",
        pointerId: v175["pointerId"],
        handleKey: v177["handleKey"],
        dragState: v179,
        entries: v180,
        moved: false,
        draftTargets: [],
      }
    );
  }
  ["_beginGizmoScale"](v182, v183, v184) {
    const v185 = this["_getSelectionTargets"](v183)["filter"](
      (v186) => v186["objectType"] !== "camera",
    );
    if (!v185["length"]) return null;
    const v187 = this["bridge"]?.["beginScaleGizmoDrag"]?.({
      handleKey: v184?.["handleKey"],
      clientX: v182["clientX"],
      clientY: v182["clientY"],
    });
    if (!v187) return null;
    const v188 = v185["map"]((v189) => ({
      objectType: v189["objectType"],
      objectId: v189["objectId"],
      basePose: cloneObjectPose(v189["item"]),
      baseScale: toScaleVector(v189["item"]?.["scale"]),
    }));
    return (
      this["bridge"]?.["setGizmoActiveHandle"]?.(v184["handleKey"]),
      {
        type: "gizmo-scale",
        pointerId: v182["pointerId"],
        handleKey: v184["handleKey"],
        dragState: v187,
        entries: v188,
        moved: false,
        draftTargets: [],
      }
    );
  }
  ["_updateGizmoHover"](v190) {
    const v191 = this["getSceneState"]?.(),
      v192 = this["_isPanoramaMode"](v191);
    this["_syncControlsByMode"](v192);
    if (
      v192 ||
      !v191 ||
      !this["_isEditing"](v191) ||
      v191["mode"] !== "scene"
    ) {
      this["bridge"]?.["setGizmoHoverHandle"]?.(null);
      return;
    }
    const v193 =
        v191?.["ui"]?.["transformTool"] ||
        (v191?.["ui"]?.["activeTool"] === "move" ||
        v191?.["ui"]?.["activeTool"] === "rotate" ||
        v191?.["ui"]?.["activeTool"] === "scale"
          ? v191["ui"]["activeTool"]
          : "move"),
      v194 = this["_getSelectionTargets"](v191);
    if (!v194["length"]) {
      this["bridge"]?.["setGizmoHoverHandle"]?.(null);
      return;
    }
    if (v193 !== "move" && v193 !== "rotate" && v193 !== "scale") {
      this["bridge"]?.["setGizmoHoverHandle"]?.(null);
      return;
    }
    const v195 =
      this["bridge"]?.["pickGizmoHandle"]?.(v190["clientX"], v190["clientY"]) ||
      null;
    this["bridge"]?.["setGizmoHoverHandle"]?.(v195?.["handleKey"] || null);
  }
  ["_exitActiveCameraOnManualNavigate"](v196) {
    if (!v196 || v196["_activeCameraExited"]) return;
    const v197 = this["getSceneState"]?.();
    if (
      v197?.["viewport"]?.["activeView"] !== "camera" ||
      !v197?.["viewport"]?.["activeCameraId"]
    ) {
      v196["_activeCameraExited"] = true;
      return;
    }
    (this["onViewCommit"]?.({
      sceneView: { ...v197["viewport"]["sceneView"] },
      activeView: "default",
      activeCameraId: null,
    }),
      (v196["_activeCameraExited"] = true));
  }
  ["_resolveSceneNavigateGesture"](v198) {
    const v199 = v198["altKey"] === true,
      v200 = v198["button"] === 0,
      v201 = v198["button"] === 1,
      v202 = v198["button"] === 2;
    if (v199 && v200) return "orbit-scene";
    if (v199 && v201) return "pan";
    if (v199 && v202) return "dolly";
    if (v201) return "pan";
    return null;
  }
  ["_handlePointerDown"](v203) {
    const v204 = this["getSceneState"]?.();
    if (!v204 || !this["_isEditing"](v204)) return;
    const v205 = this["_isPanoramaMode"](v204);
    (this["_syncControlsByMode"](v205), this["_cancelQueuedDraftClear"]());
    const v206 = v203["button"] === 0,
      v207 = v203["button"] === 1,
      v208 = v203["button"] === 2,
      v209 = v207 && v203["ctrlKey"],
      v210 = v207 && v203["shiftKey"],
      v211 = v204["mode"] === "scene",
      v212 = this["viewportEl"]["getBoundingClientRect"](),
      v213 = this["_createBaseView"](v204);
    (this["_stopEvent"](v203, { preventDefault: true }),
      this["viewportEl"]["focus"]?.());
    if (v205) {
      if (!v206 && !v207 && !v208) return;
      (this["bridge"]?.["setGizmoHoverHandle"]?.(null),
        this["_clearGizmoMoveGuideLine"](),
        this["bridge"]?.["setGizmoActiveHandle"]?.(null),
        (this["_gesture"] = {
          type: "look-panorama",
          pointerId: v203["pointerId"],
          startX: v203["clientX"],
          startY: v203["clientY"],
          moved: false,
          rect: v212,
          baseView: v213,
        }),
        this["viewportEl"]["setPointerCapture"]?.(v203["pointerId"]));
      return;
    }
    if (v211 && (v206 || v207 || v208)) {
      const v214 = this["_resolveSceneNavigateGesture"](v203);
      if (v214) {
        (this["_clearGizmoMoveGuideLine"](),
          this["bridge"]?.["setGizmoActiveHandle"]?.(null),
          (this["_gesture"] = {
            type: v214,
            pointerId: v203["pointerId"],
            startX: v203["clientX"],
            startY: v203["clientY"],
            moved: false,
            rect: v212,
            baseView: v213,
          }),
          this["viewportEl"]["setPointerCapture"]?.(v203["pointerId"]));
        return;
      }
      if (v206) {
        const v215 =
            v204?.["ui"]?.["mouseTool"] ||
            (v204?.["ui"]?.["activeTool"] === "box-select"
              ? "box-select"
              : "navigate"),
          v216 =
            v204?.["ui"]?.["transformTool"] ||
            (v204?.["ui"]?.["activeTool"] === "move" ||
            v204?.["ui"]?.["activeTool"] === "rotate" ||
            v204?.["ui"]?.["activeTool"] === "scale"
              ? v204["ui"]["activeTool"]
              : "move");
        if (v216 === "move" || v216 === "rotate" || v216 === "scale") {
          const v217 =
            this["bridge"]?.["pickGizmoHandle"]?.(
              v203["clientX"],
              v203["clientY"],
            ) || null;
          if (v217) {
            if (v216 === "move")
              this["_gesture"] = this["_beginGizmoMove"](v203, v204, v217);
            else
              v216 === "rotate"
                ? (this["_gesture"] = this["_beginGizmoRotate"](
                    v203,
                    v204,
                    v217,
                  ))
                : (this["_gesture"] = this["_beginGizmoScale"](
                    v203,
                    v204,
                    v217,
                  ));
            if (this["_gesture"]) {
              this["viewportEl"]["setPointerCapture"]?.(v203["pointerId"]);
              return;
            }
          }
        }
        const v218 =
            this["bridge"]?.["pick"]?.(v203["clientX"], v203["clientY"]) ||
            null,
          v219 = this["_getObjectByPick"](v204, v218),
          v220 = this["_getSelectionTargets"](v204),
          v221 =
            v218 && v219
              ? {
                  objectType: v218["objectType"],
                  objectId: v218["objectId"],
                  item: v219,
                }
              : null,
          v222 = v221
            ? this["_findGroupByMember"](
                v204,
                v221["objectType"],
                v221["objectId"],
              )
            : null;
        let v223 = v220;
        if (v221) {
          if (v222) {
            const v224 = this["_resolveTargetsByIds"](
              v204,
              "mannequin",
              v222["memberIds"],
            );
            ((v223 = v224),
              this["onSelectionBatchChange"]?.(
                "mannequin",
                v222["memberIds"],
                v222["id"],
              ));
          } else {
            const v225 = new Set(
                this["_collectSelectionObjects"](v204)["map"](
                  (v226) => v226["objectType"] + ":" + v226["objectId"],
                ),
              ),
              v227 = v221["objectType"] + ":" + v221["objectId"];
            !(v225["has"](v227) && v220["length"] > 0) &&
              (this["onSelectionChange"]?.(
                v221["objectType"],
                v221["objectId"],
              ),
              (v223 = [v221]));
          }
        }
        if (v215 === "box-select") {
          const v228 = this["_getLocalPoint"](v203);
          ((this["_gesture"] = {
            type: "selection-box",
            pointerId: v203["pointerId"],
            startX: v203["clientX"],
            startY: v203["clientY"],
            startLocalX: v228["x"],
            startLocalY: v228["y"],
            keepSelectionOnClick: !!v221,
            moved: false,
          }),
            this["viewportEl"]["setPointerCapture"]?.(v203["pointerId"]));
          return;
        }
        if (v216 === "rotate" && v221) {
          ((this["_gesture"] = {
            type: "scene-select",
            pointerId: v203["pointerId"],
            startX: v203["clientX"],
            startY: v203["clientY"],
            pickedTarget: v221,
            pickedGroup: v222,
            selectionCommittedOnPointerDown: true,
            moved: false,
          }),
            this["viewportEl"]["setPointerCapture"]?.(v203["pointerId"]));
          return;
        }
        if (v221) {
          ((this["_gesture"] =
            v223["length"] > 1
              ? this["_beginBatchMove"](v203, v223)
              : this["_beginObjectMove"](
                  v203,
                  v204,
                  {
                    objectType: v223[0]["objectType"],
                    objectId: v223[0]["objectId"],
                  },
                  v223[0]["item"],
                )),
            this["viewportEl"]["setPointerCapture"]?.(v203["pointerId"]));
          return;
        }
        (this["_clearGizmoMoveGuideLine"](),
          this["bridge"]?.["setGizmoActiveHandle"]?.(null),
          (this["_gesture"] = {
            type: "orbit-scene",
            pointerId: v203["pointerId"],
            startX: v203["clientX"],
            startY: v203["clientY"],
            moved: false,
            clearSelectionOnClick: true,
            rect: v212,
            baseView: v213,
          }),
          this["viewportEl"]["setPointerCapture"]?.(v203["pointerId"]));
        return;
      }
    }
    if (v209) {
      ((this["_gesture"] = {
        type: "zoom-middle",
        pointerId: v203["pointerId"],
        startY: v203["clientY"],
        baseView: v213,
      }),
        this["viewportEl"]["setPointerCapture"]?.(v203["pointerId"]));
      return;
    }
    if (v210) {
      ((this["_gesture"] = {
        type:
          v213["kind"] === "panorama-default" ? "look-panorama" : "orbit-scene",
        pointerId: v203["pointerId"],
        startX: v203["clientX"],
        startY: v203["clientY"],
        moved: false,
        rect: v212,
        baseView: v213,
      }),
        this["viewportEl"]["setPointerCapture"]?.(v203["pointerId"]));
      return;
    }
    if (v207) {
      if (v213["kind"] !== "scene-default") return;
      ((this["_gesture"] = {
        type: "pan",
        pointerId: v203["pointerId"],
        startX: v203["clientX"],
        startY: v203["clientY"],
        moved: false,
        rect: v212,
        baseView: v213,
      }),
        this["viewportEl"]["setPointerCapture"]?.(v203["pointerId"]));
      return;
    }
    if (!v206) return;
    const v229 =
        v204?.["ui"]?.["mouseTool"] ||
        (v204?.["ui"]?.["activeTool"] === "box-select"
          ? "box-select"
          : "navigate"),
      v230 =
        v204?.["ui"]?.["transformTool"] ||
        (v204?.["ui"]?.["activeTool"] === "move" ||
        v204?.["ui"]?.["activeTool"] === "rotate" ||
        v204?.["ui"]?.["activeTool"] === "scale"
          ? v204["ui"]["activeTool"]
          : "move"),
      v231 =
        this["bridge"]?.["pick"]?.(v203["clientX"], v203["clientY"]) || null,
      v232 = this["_getObjectByPick"](v204, v231),
      v233 = this["_getSelectionTargets"](v204),
      v234 =
        v231 && v232
          ? {
              objectType: v231["objectType"],
              objectId: v231["objectId"],
              item: v232,
            }
          : null,
      v235 = v234
        ? this["_findGroupByMember"](v204, v234["objectType"], v234["objectId"])
        : null;
    let v236 = v233;
    if (v234) {
      if (v235) {
        const v237 = this["_resolveTargetsByIds"](
          v204,
          "mannequin",
          v235["memberIds"],
        );
        ((v236 = v237),
          this["onSelectionBatchChange"]?.(
            "mannequin",
            v235["memberIds"],
            v235["id"],
          ));
      } else {
        const v238 = new Set(
            this["_collectSelectionObjects"](v204)["map"](
              (v239) => v239["objectType"] + ":" + v239["objectId"],
            ),
          ),
          v240 = v234["objectType"] + ":" + v234["objectId"];
        !(v238["has"](v240) && v233["length"] > 0) &&
          (this["onSelectionChange"]?.(v234["objectType"], v234["objectId"]),
          (v236 = [v234]));
      }
    }
    const v241 = v234 ? v230 : v229;
    if (v241 === "move" && v236["length"] > 0) {
      ((this["_gesture"] =
        v236["length"] > 1
          ? this["_beginBatchMove"](v203, v236)
          : this["_beginObjectMove"](
              v203,
              v204,
              {
                objectType: v236[0]["objectType"],
                objectId: v236[0]["objectId"],
              },
              v236[0]["item"],
            )),
        this["viewportEl"]["setPointerCapture"]?.(v203["pointerId"]));
      return;
    }
    if (v241 === "rotate" && v236["length"] > 0) {
      ((this["_gesture"] = {
        type: "scene-select",
        pointerId: v203["pointerId"],
        startX: v203["clientX"],
        startY: v203["clientY"],
        pickedTarget: v234,
        pickedGroup: v235,
        selectionCommittedOnPointerDown: true,
        moved: false,
      }),
        this["viewportEl"]["setPointerCapture"]?.(v203["pointerId"]));
      return;
    }
    if (v241 === "scale" && v236["length"] > 0) {
      const v242 = v236["filter"]((v243) => v243["objectType"] !== "camera");
      if (v242["length"] === 0) return;
      if (v242["length"] > 1) {
        const v244 = v242["map"]((v245) => ({
            objectType: v245["objectType"],
            objectId: v245["objectId"],
            basePose: cloneObjectPose(v245["item"]),
          })),
          v246 = v244["reduce"](
            (v247, v248) => {
              return (
                (v247["x"] += v248["basePose"]["position"]["x"]),
                (v247["z"] += v248["basePose"]["position"]["z"]),
                v247
              );
            },
            { x: 0, z: 0 },
          );
        ((v246["x"] /= v244["length"]),
          (v246["z"] /= v244["length"]),
          (this["_gesture"] = {
            type: "object-scale-batch",
            pointerId: v203["pointerId"],
            startX: v203["clientX"],
            rect: v212,
            center: v246,
            entries: v244,
            moved: false,
          }));
      } else
        this["_gesture"] = {
          type: "object-scale",
          pointerId: v203["pointerId"],
          startX: v203["clientX"],
          objectType: v242[0]["objectType"],
          objectId: v242[0]["objectId"],
          rect: v212,
          basePose: cloneObjectPose(v242[0]["item"]),
          moved: false,
        };
      this["viewportEl"]["setPointerCapture"]?.(v203["pointerId"]);
      return;
    }
    if (v241 === "box-select") {
      v234 &&
        (v235
          ? this["onSelectionBatchChange"]?.(
              "mannequin",
              v235["memberIds"],
              v235["id"],
            )
          : this["onSelectionChange"]?.(v234["objectType"], v234["objectId"]));
      ((this["_gesture"] = {
        type: "selection-box",
        pointerId: v203["pointerId"],
        startX: v203["clientX"],
        startY: v203["clientY"],
        startLocalX: this["_getLocalPoint"](v203)["x"],
        startLocalY: this["_getLocalPoint"](v203)["y"],
        keepSelectionOnClick: !!v234,
        moved: false,
      }),
        this["viewportEl"]["setPointerCapture"]?.(v203["pointerId"]));
      return;
    }
    if (v241 === "navigate") {
      if (v231 && v232) {
        v236["length"] > 1
          ? (this["_gesture"] = this["_beginBatchMove"](v203, v236))
          : (this["onSelectionChange"]?.(v231["objectType"], v231["objectId"]),
            (this["_gesture"] = this["_beginObjectMove"](
              v203,
              v204,
              v231,
              v232,
            )));
        this["viewportEl"]["setPointerCapture"]?.(v203["pointerId"]);
        return;
      }
      ((this["_gesture"] = {
        type:
          v213["kind"] === "panorama-default" ? "look-panorama" : "orbit-scene",
        pointerId: v203["pointerId"],
        startX: v203["clientX"],
        startY: v203["clientY"],
        rect: v212,
        baseView: v213,
        moved: false,
      }),
        this["viewportEl"]["setPointerCapture"]?.(v203["pointerId"]));
    }
  }
  ["_handlePointerMove"](v249) {
    if (!this["_gesture"]) {
      this["_updateGizmoHover"](v249);
      return;
    }
    if (v249["pointerId"] !== this["_gesture"]["pointerId"]) return;
    this["_stopEvent"](v249, { preventDefault: true });
    const v250 = this["_gesture"];
    if (v250["type"] === "orbit-scene") {
      const v251 = v249["clientX"] - v250["startX"],
        v252 = v249["clientY"] - v250["startY"],
        v253 = Math["hypot"](v251, v252) >= MOVE_THRESHOLD;
      !v250["moved"] && v253 && this["_exitActiveCameraOnManualNavigate"](v250);
      ((v250["moved"] = v250["moved"] || v253),
        this["bridge"]?.["markViewSmoothingWindow"]?.());
      const v254 = applyOrbitDelta(
        v250["baseView"]["sceneView"],
        v251,
        v252,
        v250["rect"],
      );
      ((v250["draftView"] = { ...v250["baseView"]["sceneView"], ...v254 }),
        this["bridge"]?.["setDraftView"]?.({
          kind: "scene-default",
          sceneView: v250["draftView"],
        }));
      return;
    }
    if (v250["type"] === "look-panorama") {
      const v255 = v249["clientX"] - v250["startX"],
        v256 = v249["clientY"] - v250["startY"],
        v257 = Math["hypot"](v255, v256) >= MOVE_THRESHOLD;
      !v250["moved"] && v257 && this["_exitActiveCameraOnManualNavigate"](v250);
      ((v250["moved"] = v250["moved"] || v257),
        this["bridge"]?.["markViewSmoothingWindow"]?.());
      const v258 = applyPanoramaLookDelta(
        v250["baseView"]["panoramaView"],
        v255,
        -v256,
        v250["rect"],
      );
      ((v250["draftView"] = { ...v250["baseView"]["panoramaView"], ...v258 }),
        this["bridge"]?.["setDraftView"]?.({
          kind: "panorama-default",
          panoramaView: v250["draftView"],
        }));
      return;
    }
    if (v250["type"] === "pan") {
      const v259 = v249["clientX"] - v250["startX"],
        v260 = v249["clientY"] - v250["startY"],
        v261 = Math["hypot"](v259, v260) >= MOVE_THRESHOLD;
      !v250["moved"] && v261 && this["_exitActiveCameraOnManualNavigate"](v250);
      ((v250["moved"] = v250["moved"] || v261),
        this["bridge"]?.["markViewSmoothingWindow"]?.());
      const v262 = applyScenePanDelta(
        v250["baseView"]["sceneView"],
        v250["baseView"]["currentPose"],
        v259,
        v260,
        v250["rect"],
      );
      ((v250["draftView"] = { ...v250["baseView"]["sceneView"], ...v262 }),
        this["bridge"]?.["setDraftView"]?.({
          kind: "scene-default",
          sceneView: v250["draftView"],
        }));
      return;
    }
    if (v250["type"] === "dolly") {
      const v263 =
        Math["abs"](v249["clientY"] - v250["startY"]) >= MOVE_THRESHOLD;
      !v250["moved"] && v263 && this["_exitActiveCameraOnManualNavigate"](v250);
      v250["moved"] = v250["moved"] || v263;
      const v264 = (v249["clientY"] - v250["startY"]) * 8;
      this["bridge"]?.["markViewSmoothingWindow"]?.();
      const v265 = applySceneDollyDelta(v250["baseView"]["sceneView"], v264);
      ((v250["draftView"] = { ...v250["baseView"]["sceneView"], ...v265 }),
        this["bridge"]?.["setDraftView"]?.({
          kind: "scene-default",
          sceneView: v250["draftView"],
        }));
      return;
    }
    if (v250["type"] === "zoom-middle") {
      const v266 =
        Math["abs"](v249["clientY"] - v250["startY"]) >= MOVE_THRESHOLD;
      !v250["moved"] && v266 && this["_exitActiveCameraOnManualNavigate"](v250);
      v250["moved"] = v250["moved"] || v266;
      const v267 = (v249["clientY"] - v250["startY"]) * 8;
      this["bridge"]?.["markViewSmoothingWindow"]?.();
      if (v250["baseView"]["kind"] === "panorama-default") {
        const v268 = applyPanoramaZoomDelta(
          v250["baseView"]["panoramaView"],
          v267,
        );
        ((v250["draftView"] = { ...v250["baseView"]["panoramaView"], ...v268 }),
          this["bridge"]?.["setDraftView"]?.({
            kind: "panorama-default",
            panoramaView: v250["draftView"],
          }));
      } else {
        const v269 = applySceneZoomDelta(v250["baseView"]["sceneView"], v267);
        ((v250["draftView"] = { ...v250["baseView"]["sceneView"], ...v269 }),
          this["bridge"]?.["setDraftView"]?.({
            kind: "scene-default",
            sceneView: v250["draftView"],
          }));
      }
      return;
    }
    if (v250["type"] === "selection-box") {
      const v270 = v249["clientX"] - v250["startX"],
        v271 = v249["clientY"] - v250["startY"];
      v250["moved"] =
        v250["moved"] || Math["hypot"](v270, v271) >= MOVE_THRESHOLD;
      const v272 = this["_getLocalPoint"](v249);
      this["_updateSelectionBox"](
        v250["startLocalX"],
        v250["startLocalY"],
        v272["x"],
        v272["y"],
      );
      return;
    }
    if (v250["type"] === "scene-select") {
      const v273 = v249["clientX"] - v250["startX"],
        v274 = v249["clientY"] - v250["startY"],
        v275 = Math["hypot"](v273, v274) >= MOVE_THRESHOLD;
      v250["moved"] = v250["moved"] || v275;
      if (!v250["pickedTarget"] && v275) {
        const v276 = this["_getLocalPoint"](v249);
        (this["_updateSelectionBox"](
          v250["startLocalX"],
          v250["startLocalY"],
          v276["x"],
          v276["y"],
        ),
          (v250["type"] = "selection-box"),
          (v250["keepSelectionOnClick"] = false));
      }
      return;
    }
    if (v250["type"] === "gizmo-move") {
      const v277 = this["bridge"]?.["sampleMoveGizmoDragPoint"]?.(
        v250["dragState"],
        v249["clientX"],
        v249["clientY"],
      );
      if (!v277) return;
      const v278 = this["bridge"]?.["computeMoveGizmoDelta"]?.(
        v250["dragState"],
        v277,
      );
      if (!v278) return;
      this["bridge"]?.["setGizmoMoveGuideLine"]?.({
        from: v250["dragState"]?.["pivot"] || { x: 0, y: 0, z: 0 },
        to: addVector3Like(v250["dragState"]?.["pivot"], v278),
      });
      const v279 = Math["hypot"](
        v278["x"] || 0,
        v278["y"] || 0,
        v278["z"] || 0,
      );
      ((v250["moved"] = v250["moved"] || v279 >= 0.0001),
        (v250["draftTargets"] = v250["entries"]["map"]((v280) => {
          const v281 = {
            ...v280["basePose"],
            position: {
              x: v280["basePose"]["position"]["x"] + (v278["x"] || 0),
              y: v280["basePose"]["position"]["y"] + (v278["y"] || 0),
              z: v280["basePose"]["position"]["z"] + (v278["z"] || 0),
            },
          };
          return (
            this["bridge"]?.["setDraftObjectTransform"]?.(
              v280["objectType"],
              v280["objectId"],
              v281,
            ),
            {
              objectType: v280["objectType"],
              objectId: v280["objectId"],
              pose: v281,
            }
          );
        })));
      return;
    }
    if (v250["type"] === "gizmo-rotate") {
      const v282 = this["bridge"]?.["sampleMoveGizmoDragPoint"]?.(
        v250["dragState"],
        v249["clientX"],
        v249["clientY"],
      );
      if (!v282) return;
      const v283 =
        this["bridge"]?.["computeRotateGizmoAngle"]?.(
          v250["dragState"],
          v282,
        ) || 0;
      v250["moved"] = v250["moved"] || Math["abs"](v283) >= 0.0001;
      if (!v250["dragState"]?.["axisWorld"] || !v250["dragState"]?.["pivot"])
        return;
      v250["draftTargets"] = v250["entries"]["map"]((v284) => {
        const v285 = rotatePoseAroundWorldAxis(
            v284["basePose"],
            v250["dragState"]["axisWorld"],
            v283,
            v250["dragState"]["pivot"],
          ),
          v286 = {
            ...v284["basePose"],
            position: v285["position"],
            rotation: v285["rotation"],
            quaternion: v285["quaternion"],
          };
        return (
          this["bridge"]?.["setDraftObjectTransform"]?.(
            v284["objectType"],
            v284["objectId"],
            v286,
          ),
          {
            objectType: v284["objectType"],
            objectId: v284["objectId"],
            pose: v286,
          }
        );
      });
      return;
    }
    if (v250["type"] === "gizmo-scale") {
      const v287 = this["bridge"]?.["sampleMoveGizmoDragPoint"]?.(
        v250["dragState"],
        v249["clientX"],
        v249["clientY"],
      );
      if (!v287) return;
      const v288 =
        this["bridge"]?.["computeScaleGizmoFactor"]?.(
          v250["dragState"],
          v287,
        ) || 1;
      v250["moved"] = v250["moved"] || Math["abs"](v288 - 1) >= 0.0001;
      const v289 = String(v250["dragState"]?.["handleKey"] || "")["slice"](-1);
      v250["draftTargets"] = v250["entries"]["map"]((v290) => {
        const v291 = toScaleVector(v290["baseScale"]);
        let v292 = { ...v291 };
        if (v250["dragState"]?.["mode"] === "scale-uniform")
          v292 = {
            x: Math["max"](0.01, v291["x"] * v288),
            y: Math["max"](0.01, v291["y"] * v288),
            z: Math["max"](0.01, v291["z"] * v288),
          };
        else
          (v289 === "x" || v289 === "y" || v289 === "z") &&
            (v292[v289] = Math["max"](0.01, v291[v289] * v288));
        const v293 =
            v250["dragState"]?.["mode"] === "scale-axis"
              ? {
                  x: v290["basePose"]["position"]["x"],
                  y: v290["basePose"]["position"]["y"],
                  z: v290["basePose"]["position"]["z"],
                }
              : v250["dragState"]?.["pivot"]
                ? scalePositionAroundPivot(
                    v290["basePose"]["position"],
                    v250["dragState"]?.["pivot"],
                    v288,
                    null,
                  )
                : {
                    x: v290["basePose"]["position"]["x"],
                    y: v290["basePose"]["position"]["y"],
                    z: v290["basePose"]["position"]["z"],
                  },
          v294 = {
            ...v290["basePose"],
            position: v293,
            scale: toCompatibleScale(v292),
          };
        return (
          this["bridge"]?.["setDraftObjectTransform"]?.(
            v290["objectType"],
            v290["objectId"],
            v294,
          ),
          {
            objectType: v290["objectType"],
            objectId: v290["objectId"],
            pose: v294,
          }
        );
      });
      return;
    }
    if (v250["type"] === "object-move") {
      const v295 = this["bridge"]?.["intersectGround"]?.(
        v249["clientX"],
        v249["clientY"],
        0,
      );
      if (v295)
        ((v250["moved"] = true),
          (v250["draftPose"] = {
            ...v250["basePose"],
            position: {
              x: v295["x"] - v250["offset"]["x"],
              y: v250["basePose"]["position"]["y"],
              z: v295["z"] - v250["offset"]["z"],
            },
          }));
      else {
        const v296 = v249["clientX"] - v250["startX"],
          v297 = v249["clientY"] - v250["startY"];
        ((v250["moved"] = Math["hypot"](v296, v297) >= 1),
          (v250["draftPose"] = {
            ...v250["basePose"],
            position: {
              x: v250["basePose"]["position"]["x"] + v296 * 0.01,
              y: v250["basePose"]["position"]["y"],
              z: v250["basePose"]["position"]["z"] - v297 * 0.01,
            },
          }));
      }
      this["bridge"]?.["setDraftObjectTransform"]?.(
        v250["objectType"],
        v250["objectId"],
        v250["draftPose"],
      );
      return;
    }
    if (v250["type"] === "object-move-batch") {
      const v298 = this["bridge"]?.["intersectGround"]?.(
        v249["clientX"],
        v249["clientY"],
        0,
      );
      let v299 = v250["baseCenter"];
      if (v298)
        ((v250["moved"] = true),
          (v299 = {
            x: v298["x"] - v250["pointerOffset"]["x"],
            z: v298["z"] - v250["pointerOffset"]["z"],
          }));
      else {
        const v300 = v249["clientX"] - v250["startX"],
          v301 = v249["clientY"] - v250["startY"];
        ((v250["moved"] = Math["hypot"](v300, v301) >= 1),
          (v299 = {
            x: v250["baseCenter"]["x"] + v300 * 0.01,
            z: v250["baseCenter"]["z"] - v301 * 0.01,
          }));
      }
      v250["draftTargets"] = v250["entries"]["map"]((v302) => {
        const v303 = {
          ...v302["pose"],
          position: {
            x: v299["x"] + v302["offset"]["x"],
            y: v302["pose"]["position"]["y"],
            z: v299["z"] + v302["offset"]["z"],
          },
        };
        return (
          this["bridge"]?.["setDraftObjectTransform"]?.(
            v302["objectType"],
            v302["objectId"],
            v303,
          ),
          {
            objectType: v302["objectType"],
            objectId: v302["objectId"],
            pose: v303,
          }
        );
      });
      return;
    }
    if (v250["type"] === "object-rotate") {
      const v304 = v249["clientX"] - v250["startX"];
      v250["moved"] = Math["abs"](v304) >= 1;
      const v305 =
        v250["basePose"]["rotation"]["y"] -
        (v304 / Math["max"](160, v250["rect"]["width"] || 1)) *
          Math["PI"] *
          1.2;
      ((v250["draftPose"] = {
        ...v250["basePose"],
        rotation: { ...v250["basePose"]["rotation"], y: v305 },
      }),
        this["bridge"]?.["setDraftObjectTransform"]?.(
          v250["objectType"],
          v250["objectId"],
          v250["draftPose"],
        ));
      return;
    }
    if (v250["type"] === "object-rotate-batch") {
      const v306 = v249["clientX"] - v250["startX"];
      v250["moved"] = Math["abs"](v306) >= 1;
      const v307 =
        -(v306 / Math["max"](160, v250["rect"]["width"] || 1)) *
        Math["PI"] *
        1.2;
      v250["draftTargets"] = v250["entries"]["map"]((v308) => {
        const v309 = v308["basePose"]["position"]["x"] - v250["center"]["x"],
          v310 = v308["basePose"]["position"]["z"] - v250["center"]["z"],
          v311 = Math["cos"](v307),
          v312 = Math["sin"](v307),
          v313 = v309 * v311 - v310 * v312,
          v314 = v309 * v312 + v310 * v311,
          v315 = {
            ...v308["basePose"],
            position: {
              x: v250["center"]["x"] + v313,
              y: v308["basePose"]["position"]["y"],
              z: v250["center"]["z"] + v314,
            },
            rotation: {
              ...v308["basePose"]["rotation"],
              y: v308["basePose"]["rotation"]["y"] + v307,
            },
          };
        return (
          this["bridge"]?.["setDraftObjectTransform"]?.(
            v308["objectType"],
            v308["objectId"],
            v315,
          ),
          {
            objectType: v308["objectType"],
            objectId: v308["objectId"],
            pose: v315,
          }
        );
      });
      return;
    }
    if (v250["type"] === "object-scale") {
      const v316 = v249["clientX"] - v250["startX"];
      v250["moved"] = Math["abs"](v316) >= 1;
      const v317 = Math["max"](
          0.01,
          Math["min"](
            4,
            1 + (v316 / Math["max"](120, v250["rect"]["width"] || 1)) * 2,
          ),
        ),
        v318 = toScaleVector(v250["basePose"]["scale"]),
        v319 = toCompatibleScale({
          x: Math["max"](0.01, Math["min"](4, v318["x"] * v317)),
          y: Math["max"](0.01, Math["min"](4, v318["y"] * v317)),
          z: Math["max"](0.01, Math["min"](4, v318["z"] * v317)),
        });
      ((v250["draftPose"] = { ...v250["basePose"], scale: v319 }),
        this["bridge"]?.["setDraftObjectTransform"]?.(
          v250["objectType"],
          v250["objectId"],
          v250["draftPose"],
        ));
      return;
    }
    if (v250["type"] === "object-scale-batch") {
      const v320 = v249["clientX"] - v250["startX"];
      v250["moved"] = Math["abs"](v320) >= 1;
      const v321 = Math["max"](
        0.01,
        Math["min"](
          4,
          1 + (v320 / Math["max"](120, v250["rect"]["width"] || 1)) * 2,
        ),
      );
      v250["draftTargets"] = v250["entries"]["map"]((v322) => {
        const v323 = v322["basePose"]["position"]["x"] - v250["center"]["x"],
          v324 = v322["basePose"]["position"]["z"] - v250["center"]["z"],
          v325 = toScaleVector(v322["basePose"]["scale"]),
          v326 = {
            ...v322["basePose"],
            position: {
              x: v250["center"]["x"] + v323 * v321,
              y: v322["basePose"]["position"]["y"],
              z: v250["center"]["z"] + v324 * v321,
            },
            scale: toCompatibleScale({
              x: Math["max"](0.01, Math["min"](4, v325["x"] * v321)),
              y: Math["max"](0.01, Math["min"](4, v325["y"] * v321)),
              z: Math["max"](0.01, Math["min"](4, v325["z"] * v321)),
            }),
          };
        return (
          this["bridge"]?.["setDraftObjectTransform"]?.(
            v322["objectType"],
            v322["objectId"],
            v326,
          ),
          {
            objectType: v322["objectType"],
            objectId: v322["objectId"],
            pose: v326,
          }
        );
      });
    }
  }
  ["_handlePointerUp"](v327) {
    if (
      !this["_gesture"] ||
      (v327["pointerId"] != null &&
        v327["pointerId"] !== this["_gesture"]["pointerId"])
    )
      return;
    this["_stopEvent"](v327, { preventDefault: true });
    const v328 = this["_gesture"];
    ((this["_gesture"] = null),
      this["viewportEl"]["releasePointerCapture"]?.(v328["pointerId"]));
    if (v328["type"] === "orbit-scene") {
      if (v328["clearSelectionOnClick"] && !v328["moved"]) {
        (this["onSelectionClear"]?.(), this["bridge"]?.["clearDraftView"]?.());
        return;
      }
      if (!v328["draftView"] && v328["rect"]) {
        const v329 = v327["clientX"] - v328["startX"],
          v330 = v327["clientY"] - v328["startY"],
          v331 = applyOrbitDelta(
            v328["baseView"]["sceneView"],
            v329,
            v330,
            v328["rect"],
          );
        v328["draftView"] = { ...v328["baseView"]["sceneView"], ...v331 };
      }
      v328["draftView"]
        ? (this["onViewCommit"]?.({
            sceneView: v328["draftView"],
            activeView: "default",
            activeCameraId: null,
          }),
          this["_queueDraftClear"](() =>
            this["bridge"]?.["clearDraftView"]?.(),
          ))
        : this["bridge"]?.["clearDraftView"]?.();
      return;
    }
    if (v328["type"] === "look-panorama") {
      if (!v328["draftView"] && v328["rect"]) {
        const v332 = v327["clientX"] - v328["startX"],
          v333 = v327["clientY"] - v328["startY"],
          v334 = applyPanoramaLookDelta(
            v328["baseView"]["panoramaView"],
            v332,
            -v333,
            v328["rect"],
          );
        v328["draftView"] = { ...v328["baseView"]["panoramaView"], ...v334 };
      }
      v328["draftView"]
        ? (this["onViewCommit"]?.({
            panoramaView: v328["draftView"],
            activeView: "default",
            activeCameraId: null,
          }),
          this["_queueDraftClear"](() =>
            this["bridge"]?.["clearDraftView"]?.(),
          ))
        : this["bridge"]?.["clearDraftView"]?.();
      return;
    }
    if (v328["type"] === "pan" || v328["type"] === "dolly") {
      v328["draftView"]
        ? (this["onViewCommit"]?.({
            sceneView: v328["draftView"],
            activeView: "default",
            activeCameraId: null,
          }),
          this["_queueDraftClear"](() =>
            this["bridge"]?.["clearDraftView"]?.(),
          ))
        : this["bridge"]?.["clearDraftView"]?.();
      return;
    }
    if (v328["type"] === "zoom-middle") {
      v328["draftView"]
        ? (v328["baseView"]?.["kind"] === "panorama-default"
            ? this["onViewCommit"]?.({
                panoramaView: v328["draftView"],
                activeView: "default",
                activeCameraId: null,
              })
            : this["onViewCommit"]?.({
                sceneView: v328["draftView"],
                activeView: "default",
                activeCameraId: null,
              }),
          this["_queueDraftClear"](() =>
            this["bridge"]?.["clearDraftView"]?.(),
          ))
        : this["bridge"]?.["clearDraftView"]?.();
      return;
    }
    if (v328["type"] === "selection-box") {
      this["_clearSelectionBox"]();
      if (!v328["moved"]) {
        if (v328["keepSelectionOnClick"]) return;
        this["onSelectionClear"]?.();
        return;
      }
      const v335 = getClientRectFromPoints(
          v328["startX"],
          v328["startY"],
          v327["clientX"],
          v327["clientY"],
        ),
        v336 = this["bridge"]?.["pickObjectsInRect"]?.(v335) || [];
      if (v336["length"] === 0) {
        this["onSelectionClear"]?.();
        return;
      }
      const v337 = this["getSceneState"]?.(),
        v338 = [],
        v339 = new Set(),
        v340 = new Set(),
        v341 = new Set(),
        v342 = (v343, v344) => {
          if ((v343 !== "mannequin" && v343 !== "cube") || !v344) return;
          const v345 = v343 + ":" + v344;
          if (v339["has"](v345)) return;
          (v339["add"](v345),
            v338["push"]({ objectType: v343, objectId: v344 }));
        };
      v336["forEach"]((v346) => {
        if (v346["objectType"] === "mannequin")
          (v340["add"](v346["objectId"]), v342("mannequin", v346["objectId"]));
        else
          v346["objectType"] === "cube" &&
            (v341["add"](v346["objectId"]), v342("cube", v346["objectId"]));
      });
      if (v338["length"] === 0) {
        this["onSelectionClear"]?.();
        return;
      }
      const v347 = Array["isArray"](v337?.["groups"]) ? v337["groups"] : [],
        v348 = new Set(v340),
        v349 = [];
      (v347["forEach"]((v350) => {
        const v351 = Array["isArray"](v350?.["memberIds"])
          ? v350["memberIds"]
          : [];
        if (!v351["some"]((v352) => v348["has"](v352))) return;
        (v349["push"](v350), v351["forEach"]((v353) => v348["add"](v353)));
      }),
        v348["forEach"]((v354) => {
          v342("mannequin", v354);
        }));
      const v355 = v338["filter"]((v356) => {
        if (v356["objectType"] === "cube") return v341["has"](v356["objectId"]);
        return v348["has"](v356["objectId"]);
      });
      if (v355["length"] === 0) {
        this["onSelectionClear"]?.();
        return;
      }
      const v357 =
        v341["size"] === 0 &&
        v349["length"] === 1 &&
        v355["every"]((v358) => v358["objectType"] === "mannequin") &&
        v349[0]["memberIds"]["length"] === v355["length"] &&
        v349[0]["memberIds"]["every"]((v359) => v348["has"](v359))
          ? v349[0]["id"]
          : null;
      this["onSelectionObjectsChange"]?.(v355, {
        activeObjectType: v355[0]["objectType"],
        activeObjectId: v355[0]["objectId"],
        groupId: v357,
      });
      return;
    }
    if (v328["type"] === "scene-select") {
      if (v328["pickedTarget"]) {
        if (v328["selectionCommittedOnPointerDown"]) return;
        v328["pickedGroup"]
          ? this["onSelectionBatchChange"]?.(
              "mannequin",
              v328["pickedGroup"]["memberIds"],
              v328["pickedGroup"]["id"],
            )
          : this["onSelectionChange"]?.(
              v328["pickedTarget"]["objectType"],
              v328["pickedTarget"]["objectId"],
            );
      } else this["onSelectionClear"]?.();
      return;
    }
    if (v328["type"] === "gizmo-move") {
      (this["_clearGizmoMoveGuideLine"](),
        this["bridge"]?.["setGizmoActiveHandle"]?.(null));
      const v360 = Array["isArray"](v328["draftTargets"])
        ? v328["draftTargets"]
        : [];
      v360["length"] > 0
        ? (v360["length"] === 1
            ? this["onObjectCommit"]?.({
                objectType: v360[0]["objectType"],
                objectId: v360[0]["objectId"],
                pose: v360[0]["pose"],
              })
            : this["onObjectBatchCommit"]?.({ targets: v360 }),
          this["_queueDraftClear"](() => {
            v360["forEach"]((v361) => {
              this["bridge"]?.["clearDraftObjectTransform"]?.(
                v361["objectType"],
                v361["objectId"],
              );
            });
          }))
        : this["bridge"]?.["clearAllDrafts"]?.();
      this["_updateGizmoHover"](v327);
      return;
    }
    if (v328["type"] === "gizmo-rotate" || v328["type"] === "gizmo-scale") {
      (this["_clearGizmoMoveGuideLine"](),
        this["bridge"]?.["setGizmoActiveHandle"]?.(null));
      const v362 = Array["isArray"](v328["draftTargets"])
        ? v328["draftTargets"]
        : [];
      v362["length"] > 0
        ? (v362["length"] === 1
            ? this["onObjectCommit"]?.({
                objectType: v362[0]["objectType"],
                objectId: v362[0]["objectId"],
                pose: v362[0]["pose"],
              })
            : this["onObjectBatchCommit"]?.({ targets: v362 }),
          this["_queueDraftClear"](() => {
            v362["forEach"]((v363) => {
              this["bridge"]?.["clearDraftObjectTransform"]?.(
                v363["objectType"],
                v363["objectId"],
              );
            });
          }))
        : this["bridge"]?.["clearAllDrafts"]?.();
      this["_updateGizmoHover"](v327);
      return;
    }
    if (
      v328["type"] === "object-move" ||
      v328["type"] === "object-rotate" ||
      v328["type"] === "object-scale"
    ) {
      (this["onSelectionChange"]?.(v328["objectType"], v328["objectId"]),
        this["onObjectCommit"]?.({
          objectType: v328["objectType"],
          objectId: v328["objectId"],
          pose: v328["draftPose"] || v328["basePose"],
        }),
        this["_queueDraftClear"](() =>
          this["bridge"]?.["clearDraftObjectTransform"]?.(
            v328["objectType"],
            v328["objectId"],
          ),
        ));
      return;
    }
    if (
      v328["type"] === "object-move-batch" ||
      v328["type"] === "object-rotate-batch" ||
      v328["type"] === "object-scale-batch"
    ) {
      const v364 = Array["isArray"](v328["draftTargets"])
        ? v328["draftTargets"]
        : [];
      v364["length"] > 0
        ? (this["onObjectBatchCommit"]?.({ targets: v364 }),
          this["_queueDraftClear"](() => {
            v364["forEach"]((v365) => {
              this["bridge"]?.["clearDraftObjectTransform"]?.(
                v365["objectType"],
                v365["objectId"],
              );
            });
          }))
        : this["bridge"]?.["clearAllDrafts"]?.();
    }
  }
  ["_handlePointerLeave"]() {
    if (
      this["_gesture"]?.["type"] === "gizmo-move" ||
      this["_gesture"]?.["type"] === "gizmo-rotate" ||
      this["_gesture"]?.["type"] === "gizmo-scale"
    )
      return;
    this["bridge"]?.["setGizmoHoverHandle"]?.(null);
  }
  ["_handleWheel"](v366) {
    const v367 = this["getSceneState"]?.();
    if (!v367 || !this["_isEditing"](v367)) return;
    const v368 = this["_isPanoramaMode"](v367);
    (this["_syncControlsByMode"](v368),
      this["_stopEvent"](v366, { preventDefault: true }),
      this["bridge"]?.["markViewSmoothingWindow"]?.());
    if (v368) {
      const v369 = v367["viewport"]["panoramaView"];
      this["onViewCommit"]?.({
        panoramaView: {
          ...v369,
          ...applyPanoramaZoomDelta(v369, v366["deltaY"]),
        },
        activeView: "default",
        activeCameraId: null,
      });
      return;
    }
    if (v367["mode"] === "panorama") {
      const v370 = v367["viewport"]["panoramaView"];
      this["onViewCommit"]?.({
        panoramaView: {
          ...v370,
          ...applyPanoramaZoomDelta(v370, v366["deltaY"]),
        },
        activeView: "default",
        activeCameraId: null,
      });
      return;
    }
    const v371 = this["_createBaseView"](v367);
    if (v371["kind"] !== "scene-default") return;
    this["onViewCommit"]?.({
      sceneView: {
        ...v371["sceneView"],
        ...applySceneZoomDelta(v371["sceneView"], v366["deltaY"]),
      },
      activeView: "default",
      activeCameraId: null,
    });
  }
  ["_handleContextMenu"](v372) {
    const v373 = this["getSceneState"]?.();
    if (!v373 || !this["_isEditing"](v373)) return;
    this["_stopEvent"](v372, { preventDefault: true });
  }
}
