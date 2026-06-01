export function generateId(v0 = "id") {
  return (
    v0 +
    "-" +
    Date["now"]() +
    "-" +
    Math["random"]()["toString"](36)["substr"](2, 9)
  );
}
export function screenToWorld(v1, v2, v3) {
  const { x: v4, y: v5, zoom: v6 } = v3;
  return { x: (v1 - v4) / v6, y: (v2 - v5) / v6 };
}
export function worldToScreen(v7, v8, v9) {
  const { x: v10, y: v11, zoom: v12 } = v9;
  return { x: v7 * v12 + v10, y: v8 * v12 + v11 };
}
export const CANVAS_GRID_SIZE = 20;
export function snapToCanvasGrid(v13, v14 = CANVAS_GRID_SIZE) {
  const v15 =
      Number["isFinite"](Number(v14)) && Number(v14) > 0
        ? Number(v14)
        : CANVAS_GRID_SIZE,
    v16 = Number(v13);
  if (!Number["isFinite"](v16)) return 0;
  return Math["round"](v16 / v15) * v15;
}
export function isPointInRect(v17, v18, v19, v20, v21, v22) {
  return v17 >= v19 && v17 <= v19 + v21 && v18 >= v20 && v18 <= v20 + v22;
}
export function isRectIntersect(v23, v24, v25, v26, v27, v28, v29, v30) {
  return !(
    v27 >= v23 + v25 ||
    v27 + v29 <= v23 ||
    v28 >= v24 + v26 ||
    v28 + v30 <= v24
  );
}
export function findAvailablePosition(
  v31,
  v32,
  v33,
  v34,
  v35,
  v36 = 20,
  v37 = "right",
) {
  let v38 = v32,
    v39 = v33;
  const v40 = Object["values"](v31);
  if (v40["length"] === 0) return { x: v38, y: v39 };
  let v41 = true;
  while (v41) {
    v41 = false;
    for (const v42 of v40) {
      const v43 = v42["x"],
        v44 = v42["y"],
        v45 = v42["width"] || 100,
        v46 = v42["height"] || 100;
      if (isRectIntersect(v38, v39, v34, v35, v43, v44, v45, v46)) {
        if (v37 === "down") v39 = v44 + v46 + v36;
        else v37 === "left" ? (v38 = v43 - v36 - v34) : (v38 = v43 + v45 + v36);
        v41 = true;
        break;
      }
    }
  }
  return { x: v38, y: v39 };
}
const ALIGN_SKIP_KEYS = [
  "isLocked",
  "locked",
  "isHidden",
  "hidden",
  "isTemp",
  "temp",
  "temporary",
  "ephemeral",
  "isDeleted",
  "deleted",
];
function _toFiniteNumber(v47, v48 = 0) {
  const v49 = Number(v47);
  return Number["isFinite"](v49) ? v49 : v48;
}
function _toAlignRatio(v50, v51 = 0.5) {
  return Math["max"](0, Math["min"](1, _toFiniteNumber(v50, v51)));
}
function _isAlignableNode(v52) {
  if (!v52 || typeof v52 !== "object") return false;
  for (const v53 of ALIGN_SKIP_KEYS) {
    if (v52[v53]) return false;
  }
  return true;
}
export function getAlignableSelectionNodes(v54, v55) {
  if (!v54 || typeof v54 !== "object") return [];
  if (!Array["isArray"](v55) || v55["length"] === 0) return [];
  const v56 = [];
  for (const v57 of v55) {
    const v58 = v54[v57];
    if (!_isAlignableNode(v58)) continue;
    const v59 = _toFiniteNumber(v58["x"], 0),
      v60 = _toFiniteNumber(v58["y"], 0),
      v61 = Math["max"](0, _toFiniteNumber(v58["width"], 0)),
      v62 = Math["max"](0, _toFiniteNumber(v58["height"], 0)),
      v63 = v59,
      v64 = v59 + v61,
      v65 = v60,
      v66 = v60 + v62;
    v56["push"]({
      id: v57,
      node: v58,
      x: v59,
      y: v60,
      width: v61,
      height: v62,
      left: v63,
      right: v64,
      top: v65,
      bottom: v66,
      cx: v63 + v61 / 2,
      cy: v65 + v62 / 2,
    });
  }
  return v56;
}
export function computeSelectionBounds(v67) {
  if (!Array["isArray"](v67) || v67["length"] === 0) return null;
  let v68 = Infinity,
    v69 = Infinity,
    v70 = -Infinity,
    v71 = -Infinity;
  for (const v72 of v67) {
    ((v68 = Math["min"](v68, v72["left"])),
      (v69 = Math["min"](v69, v72["top"])),
      (v70 = Math["max"](v70, v72["right"])),
      (v71 = Math["max"](v71, v72["bottom"])));
  }
  if (!Number["isFinite"](v68) || !Number["isFinite"](v69)) return null;
  return {
    minX: v68,
    maxX: v70,
    minY: v69,
    maxY: v71,
    width: v70 - v68,
    height: v71 - v69,
    centerX: (v68 + v70) / 2,
    centerY: (v69 + v71) / 2,
  };
}
export function computeNodesWorldBounds(v73, v74 = null) {
  const v75 = [];
  if (Array["isArray"](v73)) v75["push"](...v73["filter"](Boolean));
  else {
    if (Array["isArray"](v74) && v74["length"] > 0)
      for (const v76 of v74) {
        const v77 = v73?.[v76];
        if (v77) v75["push"](v77);
      }
    else
      v73 && typeof v73 === "object" && v75["push"](...Object["values"](v73));
  }
  if (v75["length"] === 0) return null;
  let v78 = Infinity,
    v79 = Infinity,
    v80 = -Infinity,
    v81 = -Infinity;
  for (const v82 of v75) {
    if (!v82 || typeof v82 !== "object") continue;
    const v83 = _toFiniteNumber(v82["x"], 0),
      v84 = _toFiniteNumber(v82["y"], 0),
      v85 = Math["max"](0, _toFiniteNumber(v82["width"], 0)),
      v86 = Math["max"](0, _toFiniteNumber(v82["height"], 0));
    ((v78 = Math["min"](v78, v83)),
      (v79 = Math["min"](v79, v84)),
      (v80 = Math["max"](v80, v83 + v85)),
      (v81 = Math["max"](v81, v84 + v86)));
  }
  if (
    !Number["isFinite"](v78) ||
    !Number["isFinite"](v79) ||
    !Number["isFinite"](v80) ||
    !Number["isFinite"](v81)
  )
    return null;
  return {
    minX: v78,
    minY: v79,
    maxX: v80,
    maxY: v81,
    width: Math["max"](0, v80 - v78),
    height: Math["max"](0, v81 - v79),
    centerX: (v78 + v80) / 2,
    centerY: (v79 + v81) / 2,
  };
}
export function computeViewportForWorldBounds(v87, v88, v89 = {}) {
  if (!v87 || !v88) return null;
  const v90 = _toFiniteNumber(v88["width"], 0),
    v91 = _toFiniteNumber(v88["height"], 0);
  if (!(v90 > 0 && v91 > 0)) return null;
  const v92 = Math["max"](1, _toFiniteNumber(v87["width"], 0)),
    v93 = Math["max"](1, _toFiniteNumber(v87["height"], 0)),
    v94 = _toFiniteNumber(v87["centerX"], 0),
    v95 = _toFiniteNumber(v87["centerY"], 0),
    v96 = Math["max"](0, _toFiniteNumber(v89["padding"], 0)),
    v97 = Math["max"](0.0001, _toFiniteNumber(v89["minZoom"], 0.2)),
    v98 = Math["max"](v97, _toFiniteNumber(v89["maxZoom"], 2)),
    v99 = Number(v89["fixedZoom"]),
    v100 = _toAlignRatio(v89["alignX"], 0.5),
    v101 = _toAlignRatio(v89["alignY"], 0.5),
    v102 = _toAlignRatio(v89["worldAlignX"], v100),
    v103 = _toAlignRatio(v89["worldAlignY"], v101),
    v104 = _toAlignRatio(v89["viewportAlignX"], v100),
    v105 = _toAlignRatio(v89["viewportAlignY"], v101),
    v106 = Math["max"](1, v90 - v96 * 2),
    v107 = Math["max"](1, v91 - v96 * 2),
    v108 = Number["isFinite"](v99)
      ? Math["max"](v97, Math["min"](v99, v98))
      : Math["max"](v97, Math["min"](v106 / v92, v107 / v93, v98)),
    v109 = _toFiniteNumber(v88["left"], 0) + v90 * v104,
    v110 = _toFiniteNumber(v88["top"], 0) + v91 * v105,
    v111 = _toFiniteNumber(v87["minX"], 0) + v92 * v102,
    v112 = _toFiniteNumber(v87["minY"], 0) + v93 * v103;
  return { x: v109 - v111 * v108, y: v110 - v112 * v108, zoom: v108 };
}
export function computeAlignTargets(v113, v114, v115) {
  if (!Array["isArray"](v113) || v113["length"] === 0 || !v115) return {};
  const v116 = {};
  for (const v117 of v113) {
    let v118 = v117["x"],
      v119 = v117["y"];
    if (v114 === "left") v118 = v115["minX"];
    else {
      if (v114 === "h-center") v118 = v115["centerX"] - v117["width"] / 2;
      else {
        if (v114 === "right") v118 = v115["maxX"] - v117["width"];
        else {
          if (v114 === "top") v119 = v115["minY"];
          else {
            if (v114 === "v-center")
              v119 = v115["centerY"] - v117["height"] / 2;
            else {
              if (v114 === "bottom") v119 = v115["maxY"] - v117["height"];
            }
          }
        }
      }
    }
    v116[v117["id"]] = { x: v118, y: v119 };
  }
  return v116;
}
export function computeDistributeTargets(v120, v121, v122 = undefined) {
  if (!Array["isArray"](v120) || v120["length"] < 2) return {};
  const v123 = v121 === "horizontal",
    v124 = [...v120]["sort"]((v125, v126) => {
      const v127 = v123 ? v125["left"] : v125["top"],
        v128 = v123 ? v126["left"] : v126["top"];
      if (v127 !== v128) return v127 - v128;
      return String(v125["id"])["localeCompare"](String(v126["id"]));
    }),
    v129 = {};
  for (const v130 of v124) {
    v129[v130["id"]] = { x: v130["x"], y: v130["y"] };
  }
  if (v124["length"] <= 1) return v129;
  const v131 = Number(v122);
  if (Number["isFinite"](v131) && v131 >= 0) {
    let v132 = v123 ? v124[0]["left"] : v124[0]["top"];
    for (let v133 = 0; v133 < v124["length"]; v133 += 1) {
      const v134 = v124[v133];
      if (v133 === 0) {
        v132 += (v123 ? v134["width"] : v134["height"]) + v131;
        continue;
      }
      v123
        ? ((v129[v134["id"]] = { x: v132, y: v134["y"] }),
          (v132 += v134["width"] + v131))
        : ((v129[v134["id"]] = { x: v134["x"], y: v132 }),
          (v132 += v134["height"] + v131));
    }
    return v129;
  }
  if (v124["length"] <= 2) return v129;
  const v135 = v124[0],
    v136 = v124[v124["length"] - 1],
    v137 = v124["reduce"](
      (v138, v139) => v138 + (v123 ? v139["width"] : v139["height"]),
      0,
    ),
    v140 = v123
      ? Math["max"](0, v136["right"] - v135["left"])
      : Math["max"](0, v136["bottom"] - v135["top"]),
    v141 = (v140 - v137) / (v124["length"] - 1);
  let v142 = v123 ? v135["left"] : v135["top"];
  for (let v143 = 0; v143 < v124["length"]; v143 += 1) {
    const v144 = v124[v143];
    if (v143 === 0 || v143 === v124["length"] - 1) {
      v142 += (v123 ? v144["width"] : v144["height"]) + v141;
      continue;
    }
    v123
      ? ((v129[v144["id"]] = { x: v142, y: v144["y"] }),
        (v142 += v144["width"] + v141))
      : ((v129[v144["id"]] = { x: v144["x"], y: v142 }),
        (v142 += v144["height"] + v141));
  }
  return v129;
}
export function buildNodeOffsetPlan(v145, v146) {
  if (!v145 || typeof v145 !== "object") return {};
  if (!v146 || typeof v146 !== "object") return {};
  const v147 = {};
  for (const [v148, v149] of Object["entries"](v146)) {
    const v150 = v145[v148];
    if (!v150 || !v149) continue;
    const v151 = _toFiniteNumber(v150["x"], 0),
      v152 = _toFiniteNumber(v150["y"], 0),
      v153 = _toFiniteNumber(v149["x"], v151),
      v154 = _toFiniteNumber(v149["y"], v152),
      v155 = v153 - v151,
      v156 = v154 - v152;
    if (Math["abs"](v155) < 0.000001 && Math["abs"](v156) < 0.000001) continue;
    v147[v148] = { dx: v155, dy: v156 };
  }
  return v147;
}
export function resolveSnapThresholdInWorld(v157, v158 = 8) {
  const v159 = Number["isFinite"](v157) && v157 > 0 ? v157 : 1,
    v160 = Number["isFinite"](v158) ? v158 : 8;
  return v160 / v159;
}
export function computeSingleNodeSnapGuides(v161) {
  const {
      nodesById: v162,
      dragNodeId: v163,
      proposedX: v164,
      proposedY: v165,
      width: v166,
      height: v167,
      viewport: v168,
      thresholdPx: thresholdPx = 8,
      spatialIndex: spatialIndex = null,
    } = v161 || {},
    v169 = _toFiniteNumber(v164, 0),
    v170 = _toFiniteNumber(v165, 0),
    v171 = _toFiniteNumber(v168?.["x"], 0),
    v172 = _toFiniteNumber(v168?.["y"], 0),
    v173 = _toFiniteNumber(v168?.["zoom"], 1) || 1,
    v174 = Math["max"](0, _toFiniteNumber(v166, 200)),
    v175 = Math["max"](0, _toFiniteNumber(v167, 200)),
    v176 = { snappedX: v169, snappedY: v170, guideLines: [] };
  if (!v162 || typeof v162 !== "object" || !v163 || !v162[v163]) return v176;
  const v177 = resolveSnapThresholdInWorld(v173, thresholdPx),
    v178 = v169,
    v179 = v169 + v174,
    v180 = v170,
    v181 = v170 + v175;
  let v182 = null,
    v183 = null,
    v184 = null,
    v185 = null;
  const v186 = spatialIndex
    ? getNodeSpatialQueryNodes(
        v162,
        collectSnapSearchCandidateIds(
          spatialIndex,
          { x: v169, y: v170, width: v174, height: v175 },
          v177,
        ),
      )
    : Object["values"](v162);
  for (const v187 of v186) {
    if (!v187 || v187["id"] === v163) continue;
    const v188 = _toFiniteNumber(v187["x"], 0),
      v189 = v188 + Math["max"](0, _toFiniteNumber(v187["width"], 200)),
      v190 = _toFiniteNumber(v187["y"], 0),
      v191 = v190 + Math["max"](0, _toFiniteNumber(v187["height"], 200));
    if (v182 === null) {
      if (Math["abs"](v178 - v188) < v177) ((v182 = v188), (v184 = v188));
      else {
        if (Math["abs"](v178 - v189) < v177) ((v182 = v189), (v184 = v189));
        else {
          if (Math["abs"](v179 - v188) < v177)
            ((v182 = v188 - v174), (v184 = v188));
          else
            Math["abs"](v179 - v189) < v177 &&
              ((v182 = v189 - v174), (v184 = v189));
        }
      }
    }
    if (v183 === null) {
      if (Math["abs"](v180 - v190) < v177) ((v183 = v190), (v185 = v190));
      else {
        if (Math["abs"](v180 - v191) < v177) ((v183 = v191), (v185 = v191));
        else {
          if (Math["abs"](v181 - v190) < v177)
            ((v183 = v190 - v175), (v185 = v190));
          else
            Math["abs"](v181 - v191) < v177 &&
              ((v183 = v191 - v175), (v185 = v191));
        }
      }
    }
    if (v182 !== null && v183 !== null) break;
  }
  const v192 = [],
    v193 = [];
  if (v182 !== null) {
    const v194 = collectSnapMatchNodes(v162, v186, spatialIndex, "x", v184);
    for (const v195 of v194) {
      if (!v195 || v195["id"] === v163) continue;
      const v196 = _toFiniteNumber(v195["x"], 0),
        v197 = v196 + Math["max"](0, _toFiniteNumber(v195["width"], 200));
      (Math["abs"](v196 - v184) < SNAP_MATCH_EPSILON ||
        Math["abs"](v197 - v184) < SNAP_MATCH_EPSILON) &&
        v192["push"](v195);
    }
  }
  if (v183 !== null) {
    const v198 = collectSnapMatchNodes(v162, v186, spatialIndex, "y", v185);
    for (const v199 of v198) {
      if (!v199 || v199["id"] === v163) continue;
      const v200 = _toFiniteNumber(v199["y"], 0),
        v201 = v200 + Math["max"](0, _toFiniteNumber(v199["height"], 200));
      (Math["abs"](v200 - v185) < SNAP_MATCH_EPSILON ||
        Math["abs"](v201 - v185) < SNAP_MATCH_EPSILON) &&
        v193["push"](v199);
    }
  }
  if (v182 !== null) {
    v176["snappedX"] = v182;
    const v202 = v170 + (v183 !== null ? v183 - v170 : 0),
      v203 = v202 + v175;
    let v204 = v202,
      v205 = v203;
    (v192["forEach"]((v206) => {
      const v207 = _toFiniteNumber(v206["y"], 0),
        v208 = Math["max"](0, _toFiniteNumber(v206["height"], 200));
      ((v204 = Math["min"](v204, v207)),
        (v205 = Math["max"](v205, v207 + v208)));
    }),
      v176["guideLines"]["push"]({
        type: "v",
        pos: v184 * v173 + v171,
        start: v204 * v173 + v172,
        end: v205 * v173 + v172,
      }));
  }
  if (v183 !== null) {
    v176["snappedY"] = v183;
    const v209 = v169 + (v182 !== null ? v182 - v169 : 0),
      v210 = v209 + v174;
    let v211 = v209,
      v212 = v210;
    (v193["forEach"]((v213) => {
      const v214 = _toFiniteNumber(v213["x"], 0),
        v215 = Math["max"](0, _toFiniteNumber(v213["width"], 200));
      ((v211 = Math["min"](v211, v214)),
        (v212 = Math["max"](v212, v214 + v215)));
    }),
      v176["guideLines"]["push"]({
        type: "h",
        pos: v185 * v173 + v172,
        start: v211 * v173 + v171,
        end: v212 * v173 + v171,
      }));
  }
  return v176;
}
export function computeMultiNodeSnapGuides(v216) {
  const {
      nodesById: v217,
      movingNodeIds: v218,
      proposedBounds: v219,
      viewport: v220,
      thresholdPx: thresholdPx = 8,
      spatialIndex: spatialIndex = null,
    } = v216 || {},
    v221 = _toFiniteNumber(v219?.["minX"], 0),
    v222 = _toFiniteNumber(v219?.["minY"], 0),
    v223 = Math["max"](0, _toFiniteNumber(v219?.["width"], 0)),
    v224 = Math["max"](0, _toFiniteNumber(v219?.["height"], 0)),
    v225 = _toFiniteNumber(v220?.["x"], 0),
    v226 = _toFiniteNumber(v220?.["y"], 0),
    v227 = _toFiniteNumber(v220?.["zoom"], 1) || 1,
    v228 = { snappedX: v221, snappedY: v222, guideLines: [] };
  if (!v217 || typeof v217 !== "object") return v228;
  const v229 = new Set(Array["isArray"](v218) ? v218["filter"](Boolean) : []);
  if (v229["size"] === 0) return v228;
  const v230 = resolveSnapThresholdInWorld(v227, thresholdPx),
    v231 = v221,
    v232 = v221 + v223,
    v233 = v222,
    v234 = v222 + v224;
  let v235 = null,
    v236 = null,
    v237 = null,
    v238 = null;
  const v239 = spatialIndex
    ? getNodeSpatialQueryNodes(
        v217,
        collectSnapSearchCandidateIds(
          spatialIndex,
          { x: v221, y: v222, width: v223, height: v224 },
          v230,
        ),
      )
    : Object["values"](v217);
  for (const v240 of v239) {
    if (!v240 || v229["has"](v240["id"])) continue;
    const v241 = _toFiniteNumber(v240["x"], 0),
      v242 = v241 + Math["max"](0, _toFiniteNumber(v240["width"], 200)),
      v243 = _toFiniteNumber(v240["y"], 0),
      v244 = v243 + Math["max"](0, _toFiniteNumber(v240["height"], 200));
    if (v235 === null) {
      if (Math["abs"](v231 - v241) < v230) ((v235 = v241), (v237 = v241));
      else {
        if (Math["abs"](v231 - v242) < v230) ((v235 = v242), (v237 = v242));
        else {
          if (Math["abs"](v232 - v241) < v230)
            ((v235 = v241 - v223), (v237 = v241));
          else
            Math["abs"](v232 - v242) < v230 &&
              ((v235 = v242 - v223), (v237 = v242));
        }
      }
    }
    if (v236 === null) {
      if (Math["abs"](v233 - v243) < v230) ((v236 = v243), (v238 = v243));
      else {
        if (Math["abs"](v233 - v244) < v230) ((v236 = v244), (v238 = v244));
        else {
          if (Math["abs"](v234 - v243) < v230)
            ((v236 = v243 - v224), (v238 = v243));
          else
            Math["abs"](v234 - v244) < v230 &&
              ((v236 = v244 - v224), (v238 = v244));
        }
      }
    }
    if (v235 !== null && v236 !== null) break;
  }
  const v245 = [],
    v246 = [];
  if (v235 !== null) {
    const v247 = collectSnapMatchNodes(v217, v239, spatialIndex, "x", v237);
    for (const v248 of v247) {
      if (!v248 || v229["has"](v248["id"])) continue;
      const v249 = _toFiniteNumber(v248["x"], 0),
        v250 = v249 + Math["max"](0, _toFiniteNumber(v248["width"], 200));
      (Math["abs"](v249 - v237) < SNAP_MATCH_EPSILON ||
        Math["abs"](v250 - v237) < SNAP_MATCH_EPSILON) &&
        v245["push"](v248);
    }
  }
  if (v236 !== null) {
    const v251 = collectSnapMatchNodes(v217, v239, spatialIndex, "y", v238);
    for (const v252 of v251) {
      if (!v252 || v229["has"](v252["id"])) continue;
      const v253 = _toFiniteNumber(v252["y"], 0),
        v254 = v253 + Math["max"](0, _toFiniteNumber(v252["height"], 200));
      (Math["abs"](v253 - v238) < SNAP_MATCH_EPSILON ||
        Math["abs"](v254 - v238) < SNAP_MATCH_EPSILON) &&
        v246["push"](v252);
    }
  }
  if (v235 !== null) {
    v228["snappedX"] = v235;
    const v255 = v222 + (v236 !== null ? v236 - v222 : 0),
      v256 = v255 + v224;
    let v257 = v255,
      v258 = v256;
    (v245["forEach"]((v259) => {
      const v260 = _toFiniteNumber(v259["y"], 0),
        v261 = Math["max"](0, _toFiniteNumber(v259["height"], 200));
      ((v257 = Math["min"](v257, v260)),
        (v258 = Math["max"](v258, v260 + v261)));
    }),
      v228["guideLines"]["push"]({
        type: "v",
        pos: v237 * v227 + v225,
        start: v257 * v227 + v226,
        end: v258 * v227 + v226,
      }));
  }
  if (v236 !== null) {
    v228["snappedY"] = v236;
    const v262 = v221 + (v235 !== null ? v235 - v221 : 0),
      v263 = v262 + v223;
    let v264 = v262,
      v265 = v263;
    (v246["forEach"]((v266) => {
      const v267 = _toFiniteNumber(v266["x"], 0),
        v268 = Math["max"](0, _toFiniteNumber(v266["width"], 200));
      ((v264 = Math["min"](v264, v267)),
        (v265 = Math["max"](v265, v267 + v268)));
    }),
      v228["guideLines"]["push"]({
        type: "h",
        pos: v238 * v227 + v226,
        start: v264 * v227 + v225,
        end: v265 * v227 + v225,
      }));
  }
  return v228;
}
export function calcWorldBounds(v269, v270 = null) {
  const v271 = computeNodesWorldBounds(v269);
  if (!v271) {
    if (v270) {
      const v272 = 1920,
        v273 = 1080,
        v274 = -v270["x"] / v270["zoom"],
        v275 = -v270["y"] / v270["zoom"],
        v276 = v272 / v270["zoom"],
        v277 = v273 / v270["zoom"],
        v278 = 600;
      return {
        minX: v274 - v278,
        minY: v275 - v278,
        maxX: v274 + v276 + v278,
        maxY: v275 + v277 + v278,
        width: v276 + v278 * 2,
        height: v277 + v278 * 2,
      };
    }
    return {
      minX: 0,
      minY: 0,
      maxX: 2000,
      maxY: 2000,
      width: 2000,
      height: 2000,
    };
  }
  const v279 = 600,
    v280 = v271["minX"] - v279,
    v281 = v271["minY"] - v279,
    v282 = v271["maxX"] + v279,
    v283 = v271["maxY"] + v279;
  return {
    minX: v280,
    minY: v281,
    maxX: v282,
    maxY: v283,
    width: v282 - v280,
    height: v283 - v281,
  };
}
export function worldToMinimap(v284, v285, v286, v287) {
  const v288 = Math["max"](v286["width"], v286["height"], 1),
    v289 = v287 / v288,
    v290 = (v284 - v286["minX"]) * v289,
    v291 = (v285 - v286["minY"]) * v289;
  return { x: v290, y: v291, scale: v289 };
}
const DEFAULT_NODE_SPATIAL_INDEX_CELL_SIZE = 240,
  EMPTY_NODE_SPATIAL_QUERY_RESULT = Object["freeze"]([]),
  SNAP_MATCH_EPSILON = 0.1;
function getNodeSpatialCellCoord(v292, v293) {
  return Math["floor"](v292 / v293);
}
function getNodeSpatialCellKey(v294, v295) {
  return v294 + "," + v295;
}
function normalizeNodeSpatialCellBounds(v296) {
  if (!v296) return null;
  const v297 = Number(v296["minX"]),
    v298 = Number(v296["maxX"]),
    v299 = Number(v296["minY"]),
    v300 = Number(v296["maxY"]);
  if (
    !Number["isFinite"](v297) ||
    !Number["isFinite"](v298) ||
    !Number["isFinite"](v299) ||
    !Number["isFinite"](v300)
  )
    return null;
  return { minX: v297, maxX: v298, minY: v299, maxY: v300 };
}
function pushNodeIdToSpatialCell(v301, v302, v303, v304) {
  const v305 = getNodeSpatialCellKey(v302, v303),
    v306 = v301["get"](v305);
  if (v306) {
    v306["push"](v304);
    return;
  }
  v301["set"](v305, [v304]);
}
function normalizeNodeQueryRect(v307) {
  if (!v307 || typeof v307 !== "object") return null;
  const v308 = Number(v307["x"]),
    v309 = Number(v307["y"]),
    v310 = Math["max"](0, Number(v307["width"]) || 0),
    v311 = Math["max"](0, Number(v307["height"]) || 0);
  if (!Number["isFinite"](v308) || !Number["isFinite"](v309)) return null;
  return { x: v308, y: v309, width: v310, height: v311 };
}
function finalizeNodeQueryRect(v312, v313 = {}) {
  const v314 = normalizeNodeQueryRect(v312);
  if (!v314) return null;
  return {
    ...v314,
    right: v314["x"] + v314["width"],
    bottom: v314["y"] + v314["height"],
    cx: v314["x"] + v314["width"] / 2,
    cy: v314["y"] + v314["height"] / 2,
    ...v313,
  };
}
function defaultNodeQueryRectResolver(v315) {
  if (!v315 || typeof v315 !== "object") return null;
  return {
    x: v315["x"],
    y: v315["y"],
    width: v315["width"] || 0,
    height: v315["height"] || 0,
  };
}
function normalizeNodeQueryOptions(v316 = false, v317 = undefined) {
  const v318 =
    v316 && typeof v316 === "object"
      ? { ...v316 }
      : { ignoreGroup: v316 === true };
  return (
    v317 && typeof v317 === "object" && Object["assign"](v318, v317),
    (v318["ignoreGroup"] = v318["ignoreGroup"] === true),
    (v318["resolveRect"] =
      typeof v318["resolveRect"] === "function"
        ? v318["resolveRect"]
        : defaultNodeQueryRectResolver),
    (v318["candidateFilter"] =
      typeof v318["candidateFilter"] === "function"
        ? v318["candidateFilter"]
        : null),
    (v318["spatialIndex"] = v318["spatialIndex"] || null),
    v318
  );
}
function resolveNodeQueryRect(v319, v320, v321, v322 = null) {
  const v323 = String(v319?.["id"] || v320 || "")["trim"]();
  if (!v323) return null;
  const v324 =
    v322?.["nodeRects"] instanceof Map ? v322["nodeRects"]["get"](v323) : null;
  if (v324) return v324;
  return finalizeNodeQueryRect(v321(v319, v323));
}
function iterateNodeSpatialRing(v325, v326, v327, v328) {
  if (v327 === 0) {
    v328(v325, v326);
    return;
  }
  const v329 = v325 - v327,
    v330 = v325 + v327,
    v331 = v326 - v327,
    v332 = v326 + v327;
  for (let v333 = v329; v333 <= v330; v333 += 1) {
    (v328(v333, v331), v328(v333, v332));
  }
  for (let v334 = v331 + 1; v334 < v332; v334 += 1) {
    (v328(v329, v334), v328(v330, v334));
  }
}
function getPointToCellRectDistSq(v335, v336, v337, v338, v339) {
  const v340 = v337 * v339,
    v341 = v338 * v339,
    v342 = v340 + v339,
    v343 = v341 + v339,
    v344 = v335 < v340 ? v340 - v335 : v335 > v342 ? v335 - v342 : 0,
    v345 = v336 < v341 ? v341 - v336 : v336 > v343 ? v336 - v343 : 0;
  return v344 * v344 + v345 * v345;
}
function getNodeSpatialWorldBounds(v346) {
  const v347 = normalizeNodeSpatialCellBounds(v346?.["boundsCellBounds"]);
  if (!v347) return null;
  const v348 = Number(v346?.["cellSize"]);
  if (!Number["isFinite"](v348) || v348 <= 0) return null;
  return {
    x: v347["minX"] * v348,
    y: v347["minY"] * v348,
    width: (v347["maxX"] - v347["minX"] + 1) * v348,
    height: (v347["maxY"] - v347["minY"] + 1) * v348,
  };
}
function getNodeSpatialStripeRect(v349, v350, v351, v352, v353 = 0) {
  const v354 = getNodeSpatialWorldBounds(v349);
  if (!v354) return null;
  const v355 = Math["min"](_toFiniteNumber(v351, 0), _toFiniteNumber(v352, 0)),
    v356 = Math["max"](_toFiniteNumber(v351, 0), _toFiniteNumber(v352, 0)),
    v357 = Math["max"](0, _toFiniteNumber(v353, 0));
  if (v350 === "x")
    return {
      x: v355 - v357,
      y: v354["y"],
      width: Math["max"](0, v356 - v355) + v357 * 2,
      height: v354["height"],
    };
  if (v350 === "y")
    return {
      x: v354["x"],
      y: v355 - v357,
      width: v354["width"],
      height: Math["max"](0, v356 - v355) + v357 * 2,
    };
  return null;
}
function getNodeSpatialQueryNodes(v358, v359) {
  if (!Array["isArray"](v359) || v359["length"] === 0) return [];
  const v360 = [];
  for (const v361 of v359) {
    const v362 = v358?.[v361];
    if (v362) v360["push"](v362);
  }
  return v360;
}
function collectSnapSearchCandidateIds(v363, v364, v365) {
  if (!v363 || !v364) return EMPTY_NODE_SPATIAL_QUERY_RESULT;
  const v366 = getNodeSpatialStripeRect(
      v363,
      "x",
      v364["x"],
      v364["x"] + v364["width"],
      v365,
    ),
    v367 = getNodeSpatialStripeRect(
      v363,
      "y",
      v364["y"],
      v364["y"] + v364["height"],
      v365,
    );
  if (!v366 && !v367) return EMPTY_NODE_SPATIAL_QUERY_RESULT;
  const v368 = new Set();
  if (v366)
    for (const v369 of queryNodeSpatialIndexInRect(v363, v366)) {
      v368["add"](v369);
    }
  if (v367)
    for (const v370 of queryNodeSpatialIndexInRect(v363, v367)) {
      v368["add"](v370);
    }
  return v368["size"] > 0
    ? Array["from"](v368)
    : EMPTY_NODE_SPATIAL_QUERY_RESULT;
}
function collectSnapMatchNodes(v371, v372, v373, v374, v375) {
  if (!Number["isFinite"](v375)) return [];
  if (!v373) return v372;
  const v376 = getNodeSpatialStripeRect(
    v373,
    v374,
    v375,
    v375,
    SNAP_MATCH_EPSILON,
  );
  if (!v376) return v372;
  return getNodeSpatialQueryNodes(
    v371,
    queryNodeSpatialIndexInRect(v373, v376),
  );
}
function getMinRingToCenterCellBounds(v377, v378, v379) {
  if (!v379) return 0;
  const v380 =
      v377 < v379["minX"]
        ? v379["minX"] - v377
        : v377 > v379["maxX"]
          ? v377 - v379["maxX"]
          : 0,
    v381 =
      v378 < v379["minY"]
        ? v379["minY"] - v378
        : v378 > v379["maxY"]
          ? v378 - v379["maxY"]
          : 0;
  return Math["max"](v380, v381);
}
function doesRingCoverCenterCellBounds(v382, v383, v384, v385) {
  if (!v385) return true;
  return (
    v382 - v384 <= v385["minX"] &&
    v382 + v384 >= v385["maxX"] &&
    v383 - v384 <= v385["minY"] &&
    v383 + v384 >= v385["maxY"]
  );
}
function getNextRingMinCenterDistSq(v386, v387, v388, v389, v390, v391) {
  if (!v386?.["centerCellBounds"]) return Infinity;
  let v392 = Infinity;
  return (
    iterateNodeSpatialRing(v389, v390, v391, (v393, v394) => {
      if (
        v393 < v386["centerCellBounds"]["minX"] ||
        v393 > v386["centerCellBounds"]["maxX"] ||
        v394 < v386["centerCellBounds"]["minY"] ||
        v394 > v386["centerCellBounds"]["maxY"]
      )
        return;
      const v395 = getPointToCellRectDistSq(
        v387,
        v388,
        v393,
        v394,
        v386["cellSize"],
      );
      if (v395 < v392) v392 = v395;
    }),
    v392
  );
}
function findNearestNodeRectInSpatialIndex(v396, v397, v398, v399, v400 = {}) {
  if (
    !v396 ||
    !(v396["centerCells"] instanceof Map) ||
    !(v396["nodeRects"] instanceof Map) ||
    !v396["centerCellBounds"]
  )
    return null;
  const v401 = getNodeSpatialCellCoord(v398, v396["cellSize"]),
    v402 = getNodeSpatialCellCoord(v399, v396["cellSize"]),
    v403 = getMinRingToCenterCellBounds(v401, v402, v396["centerCellBounds"]),
    v404 = v400["ignoreGroup"] === true,
    v405 =
      typeof v400["candidateFilter"] === "function"
        ? v400["candidateFilter"]
        : null;
  let v406 = null,
    v407 = null,
    v408 = Infinity,
    v409 = Infinity;
  for (let v410 = v403; ; v410 += 1) {
    iterateNodeSpatialRing(v401, v402, v410, (v411, v412) => {
      const v413 = v396["centerCells"]["get"](
        getNodeSpatialCellKey(v411, v412),
      );
      if (!v413 || v413["length"] === 0) return;
      for (const v414 of v413) {
        const v415 = v397?.[v414];
        if (!v415) continue;
        if (v404 && v415?.["type"] === "group") continue;
        if (v405 && v405(v415, v414) === false) continue;
        const v416 = v396["nodeRects"]["get"](v414);
        if (!v416) continue;
        const v417 = v398 - v416["cx"],
          v418 = v399 - v416["cy"],
          v419 = v417 * v417 + v418 * v418;
        (v419 < v408 || (v419 === v408 && v416["order"] < v409)) &&
          ((v406 = v414), (v407 = v416), (v408 = v419), (v409 = v416["order"]));
      }
    });
    if (
      doesRingCoverCenterCellBounds(v401, v402, v410, v396["centerCellBounds"])
    )
      break;
    if (v407) {
      const v420 = getNextRingMinCenterDistSq(
        v396,
        v398,
        v399,
        v401,
        v402,
        v410 + 1,
      );
      if (v408 <= v420) break;
    }
  }
  return v406 && v407 ? { nodeId: v406, rect: v407 } : null;
}
export function createNodeSpatialIndex(v421, v422 = {}) {
  const v423 = Number(v422?.["cellSize"]),
    v424 =
      Number["isFinite"](v423) && v423 > 0
        ? v423
        : DEFAULT_NODE_SPATIAL_INDEX_CELL_SIZE,
    v425 =
      typeof v422?.["resolveRect"] === "function"
        ? v422["resolveRect"]
        : defaultNodeQueryRectResolver,
    v426 = new Map(),
    v427 = new Map(),
    v428 = new Map();
  let v429 = Infinity,
    v430 = -Infinity,
    v431 = Infinity,
    v432 = -Infinity,
    v433 = Infinity,
    v434 = -Infinity,
    v435 = Infinity,
    v436 = -Infinity,
    v437 = 0;
  for (const [v438, v439] of Object["entries"](v421 || {})) {
    const v440 = String(v439?.["id"] || v438 || "")["trim"]();
    if (!v440) continue;
    const v441 = finalizeNodeQueryRect(v425(v439, v440), { order: v437 });
    if (!v441) continue;
    const v442 = { nodeId: v440, ...v441 };
    (v428["set"](v440, v442), (v437 += 1));
    const v443 = getNodeSpatialCellCoord(v442["x"], v424),
      v444 = getNodeSpatialCellCoord(v442["right"], v424),
      v445 = getNodeSpatialCellCoord(v442["y"], v424),
      v446 = getNodeSpatialCellCoord(v442["bottom"], v424);
    if (v443 < v429) v429 = v443;
    if (v444 > v430) v430 = v444;
    if (v445 < v431) v431 = v445;
    if (v446 > v432) v432 = v446;
    for (let v447 = v443; v447 <= v444; v447 += 1) {
      for (let v448 = v445; v448 <= v446; v448 += 1) {
        pushNodeIdToSpatialCell(v426, v447, v448, v440);
      }
    }
    const v449 = getNodeSpatialCellCoord(v442["cx"], v424),
      v450 = getNodeSpatialCellCoord(v442["cy"], v424);
    pushNodeIdToSpatialCell(v427, v449, v450, v440);
    if (v449 < v433) v433 = v449;
    if (v449 > v434) v434 = v449;
    if (v450 < v435) v435 = v450;
    if (v450 > v436) v436 = v450;
  }
  const v451 =
      v433 === Infinity
        ? null
        : { minX: v433, maxX: v434, minY: v435, maxY: v436 },
    v452 =
      v429 === Infinity
        ? null
        : { minX: v429, maxX: v430, minY: v431, maxY: v432 };
  return {
    cellSize: v424,
    boundsCells: v426,
    centerCells: v427,
    nodeRects: v428,
    boundsCellBounds: v452,
    centerCellBounds: v451,
    nodeCount: v428["size"],
  };
}
export function queryNodeSpatialIndexAtWorldPoint(v453, v454, v455) {
  if (
    !v453 ||
    !(v453["boundsCells"] instanceof Map) ||
    !Number["isFinite"](v454) ||
    !Number["isFinite"](v455) ||
    !Number["isFinite"](v453["cellSize"]) ||
    v453["cellSize"] <= 0
  )
    return EMPTY_NODE_SPATIAL_QUERY_RESULT;
  const v456 = getNodeSpatialCellCoord(v454, v453["cellSize"]),
    v457 = getNodeSpatialCellCoord(v455, v453["cellSize"]);
  return (
    v453["boundsCells"]["get"](getNodeSpatialCellKey(v456, v457)) ||
    EMPTY_NODE_SPATIAL_QUERY_RESULT
  );
}
export function queryNodeSpatialIndexInRect(v458, v459) {
  const v460 = normalizeNodeQueryRect(v459);
  if (
    !v460 ||
    !v458 ||
    !(v458["boundsCells"] instanceof Map) ||
    !(v458["nodeRects"] instanceof Map) ||
    !Number["isFinite"](v458["cellSize"]) ||
    v458["cellSize"] <= 0
  )
    return EMPTY_NODE_SPATIAL_QUERY_RESULT;
  const v461 = getNodeSpatialCellCoord(v460["x"], v458["cellSize"]),
    v462 = getNodeSpatialCellCoord(v460["x"] + v460["width"], v458["cellSize"]),
    v463 = getNodeSpatialCellCoord(v460["y"], v458["cellSize"]),
    v464 = getNodeSpatialCellCoord(
      v460["y"] + v460["height"],
      v458["cellSize"],
    ),
    v465 = new Set();
  for (let v466 = v461; v466 <= v462; v466 += 1) {
    for (let v467 = v463; v467 <= v464; v467 += 1) {
      const v468 = v458["boundsCells"]["get"](
        getNodeSpatialCellKey(v466, v467),
      );
      if (!v468 || v468["length"] === 0) continue;
      for (const v469 of v468) v465["add"](v469);
    }
  }
  if (v465["size"] === 0) return EMPTY_NODE_SPATIAL_QUERY_RESULT;
  return Array["from"](v465)["sort"]((v470, v471) => {
    const v472 = v458["nodeRects"]["get"](v470)?.["order"] ?? Infinity,
      v473 = v458["nodeRects"]["get"](v471)?.["order"] ?? Infinity;
    return v472 - v473;
  });
}
export function getNodeScreenRect(v474, v475) {
  const { x: v476, y: v477, zoom: v478 } = v475,
    v479 = v474["x"] * v478 + v476,
    v480 = v474["y"] * v478 + v477,
    v481 = (v474["width"] || 0) * v478,
    v482 = (v474["height"] || 0) * v478;
  return {
    left: v479,
    top: v480,
    right: v479 + v481,
    bottom: v480 + v482,
    cx: v479 + v481 / 2,
    cy: v480 + v482 / 2,
    width: v481,
    height: v482,
  };
}
export function findClosestNode(
  v483,
  v484,
  v485,
  v486,
  v487 = false,
  v488 = undefined,
) {
  const { x: v489, y: v490 } = screenToWorld(v483, v484, v486),
    v491 = normalizeNodeQueryOptions(v487, v488),
    v492 = v491["spatialIndex"]
      ? queryNodeSpatialIndexAtWorldPoint(v491["spatialIndex"], v489, v490)
      : null;
  if (v492) {
    for (const v493 of v492) {
      const v494 = v485?.[v493];
      if (!v494) continue;
      if (v491["ignoreGroup"] && v494?.["type"] === "group") continue;
      if (
        v491["candidateFilter"] &&
        v491["candidateFilter"](v494, v493) === false
      )
        continue;
      const v495 = resolveNodeQueryRect(
        v494,
        v493,
        v491["resolveRect"],
        v491["spatialIndex"],
      );
      if (!v495) continue;
      if (
        !isPointInRect(
          v489,
          v490,
          v495["x"],
          v495["y"],
          v495["width"],
          v495["height"],
        )
      )
        continue;
      return {
        nodeId: v493,
        screenRect: getNodeScreenRect(v495, v486),
        isInside: true,
      };
    }
    const v496 = findNearestNodeRectInSpatialIndex(
      v491["spatialIndex"],
      v485,
      v489,
      v490,
      v491,
    );
    return v496
      ? {
          nodeId: v496["nodeId"],
          screenRect: getNodeScreenRect(v496["rect"], v486),
          isInside: false,
        }
      : null;
  }
  let v497 = null,
    v498 = null,
    v499 = Infinity;
  for (const [v500, v501] of Object["entries"](v485 || {})) {
    const v502 = String(v501?.["id"] || v500 || "")["trim"]();
    if (!v502) continue;
    if (v491["ignoreGroup"] && v501?.["type"] === "group") continue;
    if (
      v491["candidateFilter"] &&
      v491["candidateFilter"](v501, v502) === false
    )
      continue;
    const v503 = resolveNodeQueryRect(
      v501,
      v502,
      v491["resolveRect"],
      v491["spatialIndex"],
    );
    if (!v503) continue;
    const v504 = isPointInRect(
      v489,
      v490,
      v503["x"],
      v503["y"],
      v503["width"],
      v503["height"],
    );
    if (v504)
      return {
        nodeId: v502,
        screenRect: getNodeScreenRect(v503, v486),
        isInside: true,
      };
    const v505 = v489 - v503["cx"],
      v506 = v490 - v503["cy"],
      v507 = v505 * v505 + v506 * v506;
    v507 < v499 && ((v499 = v507), (v497 = v502), (v498 = v503));
  }
  return v497
    ? {
        nodeId: v497,
        screenRect: getNodeScreenRect(v498, v486),
        isInside: false,
      }
    : null;
}
export function hitTestNode(
  v508,
  v509,
  v510,
  v511,
  v512,
  v513 = false,
  v514 = undefined,
) {
  const { x: v515, y: v516 } = screenToWorld(v508, v509, v511),
    v517 = normalizeNodeQueryOptions(v513, v514),
    v518 = new Set(),
    v519 = String(v512 || "")["trim"]();
  if (v519) v518["add"](v519);
  if (
    v517["excludeIds"] &&
    typeof v517["excludeIds"] !== "string" &&
    typeof v517["excludeIds"][Symbol["iterator"]] === "function"
  )
    for (const v520 of v517["excludeIds"]) {
      const v521 = String(v520 || "")["trim"]();
      if (v521) v518["add"](v521);
    }
  let v522 = null,
    v523 = null;
  const v524 = v517["spatialIndex"]
      ? queryNodeSpatialIndexAtWorldPoint(v517["spatialIndex"], v515, v516)
      : null,
    v525 = (v526, v527) => {
      if (v518["has"](v526)) return;
      if (v517["ignoreGroup"] && v527?.["type"] === "group") return;
      if (
        v517["candidateFilter"] &&
        v517["candidateFilter"](v527, v526) === false
      )
        return;
      const v528 = resolveNodeQueryRect(
        v527,
        v526,
        v517["resolveRect"],
        v517["spatialIndex"],
      );
      if (!v528) return;
      if (
        !isPointInRect(
          v515,
          v516,
          v528["x"],
          v528["y"],
          v528["width"],
          v528["height"],
        )
      )
        return;
      v527?.["type"] === "group" ? (v522 = v526) : (v523 = v526);
    };
  if (v524) {
    for (const v529 of v524) {
      const v530 = v510?.[v529];
      if (!v530) continue;
      v525(v529, v530);
    }
    return v523 || v522 || null;
  }
  for (const [v531, v532] of Object["entries"](v510 || {})) {
    const v533 = String(v532?.["id"] || v531 || "")["trim"]();
    if (!v533) continue;
    v525(v533, v532);
  }
  return v523 || v522 || null;
}
export function checkLineIntersection(
  v534,
  v535,
  v536,
  v537,
  v538,
  v539,
  v540,
  v541,
) {
  let v542 = v536 - v534,
    v543 = v537 - v535,
    v544 = v540 - v538,
    v545 = v541 - v539,
    v546 = -v544 * v543 + v542 * v545;
  if (v546 === 0) return false;
  let v547 = (-v543 * (v534 - v538) + v542 * (v535 - v539)) / v546,
    v548 = (v544 * (v535 - v539) - v545 * (v534 - v538)) / v546;
  return v547 >= 0 && v547 <= 1 && v548 >= 0 && v548 <= 1;
}
export function checkBBoxIntersection(
  v549,
  v550,
  v551,
  v552,
  v553,
  v554,
  v555,
  v556,
) {
  const v557 = Math["min"](v549, v551),
    v558 = Math["max"](v549, v551),
    v559 = Math["min"](v550, v552),
    v560 = Math["max"](v550, v552),
    v561 = Math["min"](v553, v555),
    v562 = Math["max"](v553, v555),
    v563 = Math["min"](v554, v556),
    v564 = Math["max"](v554, v556);
  return !(v558 < v561 || v562 < v557 || v560 < v563 || v564 < v559);
}
export * from "./panoramaSceneMath.js";
