function clampInt(v0, v1, v2) {
  const v3 = Number(v0);
  if (!Number["isFinite"](v3)) return v1;
  return Math["max"](v1, Math["min"](v2, Math["floor"](v3)));
}
function createCanvas(v4, v5) {
  const v6 = document["createElement"]("canvas");
  return (
    (v6["width"] = Math["max"](1, Math["floor"](v4))),
    (v6["height"] = Math["max"](1, Math["floor"](v5))),
    v6
  );
}
function hasAnyMarked(v7) {
  for (let v8 = 0; v8 < v7["length"]; v8 += 1) {
    if (v7[v8]) return true;
  }
  return false;
}
function extractMaskFromCanvas(v9) {
  const v10 = v9["getContext"]("2d"),
    { width: v11, height: v12 } = v9,
    v13 = v10["getImageData"](0, 0, v11, v12),
    v14 = new Uint8Array(v11 * v12);
  for (let v15 = 0, v16 = 0; v15 < v14["length"]; v15 += 1, v16 += 4) {
    v14[v15] = v13["data"][v16 + 3] > 10 ? 1 : 0;
  }
  return v14;
}
function buildDiskOffsets(v17) {
  const v18 = Math["max"](0, Math["floor"](v17));
  if (v18 <= 0) return [[0, 0]];
  const v19 = [],
    v20 = v18 * v18;
  for (let v21 = -v18; v21 <= v18; v21 += 1) {
    for (let v22 = -v18; v22 <= v18; v22 += 1) {
      if (v22 * v22 + v21 * v21 <= v20) v19["push"]([v22, v21]);
    }
  }
  return v19;
}
function dilate(v23, v24, v25, v26) {
  const v27 = new Uint8Array(v23["length"]);
  for (let v28 = 0; v28 < v25; v28 += 1) {
    const v29 = v28 * v24;
    for (let v30 = 0; v30 < v24; v30 += 1) {
      if (v23[v29 + v30])
        for (let v31 = 0; v31 < v26["length"]; v31 += 1) {
          const [v32, v33] = v26[v31],
            v34 = v30 + v32,
            v35 = v28 + v33;
          if (v34 < 0 || v34 >= v24 || v35 < 0 || v35 >= v25) continue;
          v27[v35 * v24 + v34] = 1;
        }
    }
  }
  return v27;
}
function erode(v36, v37, v38, v39) {
  const v40 = new Uint8Array(v36["length"]);
  for (let v41 = 0; v41 < v38; v41 += 1) {
    const v42 = v41 * v37;
    for (let v43 = 0; v43 < v37; v43 += 1) {
      let v44 = true;
      for (let v45 = 0; v45 < v39["length"]; v45 += 1) {
        const [v46, v47] = v39[v45],
          v48 = v43 + v46,
          v49 = v41 + v47;
        if (v48 < 0 || v48 >= v37 || v49 < 0 || v49 >= v38) {
          v44 = false;
          break;
        }
        if (!v36[v49 * v37 + v48]) {
          v44 = false;
          break;
        }
      }
      if (v44) v40[v42 + v43] = 1;
    }
  }
  return v40;
}
function createRegionMaskCanvas(v50, v51, v52) {
  const v53 = createCanvas(v51, v52),
    v54 = v53["getContext"]("2d"),
    v55 = v54["createImageData"](v51, v52);
  for (let v56 = 0, v57 = 0; v56 < v50["length"]; v56 += 1, v57 += 4) {
    if (!v50[v56]) continue;
    ((v55["data"][v57] = 255),
      (v55["data"][v57 + 1] = 255),
      (v55["data"][v57 + 2] = 255),
      (v55["data"][v57 + 3] = 255));
  }
  return (v54["putImageData"](v55, 0, 0), v53);
}
const FILL_REGION_CACHE_LIMIT = 64,
  commandSignatureCache = new WeakMap();
function cacheNumber(v58) {
  const v59 = Number(v58);
  if (!Number["isFinite"](v59)) return 0;
  return Math["round"](v59 * 1000) / 1000;
}
function pointSignature(v60) {
  return (Array["isArray"](v60) ? v60 : [])
    ["map"]((v61) => cacheNumber(v61?.["x"]) + "," + cacheNumber(v61?.["y"]))
    ["join"](";");
}
function commandBoundarySignature(v62) {
  if (!v62 || typeof v62 !== "object") return "";
  const v63 = commandSignatureCache["get"](v62);
  if (v63) return v63;
  const v64 = String(v62["type"] || "");
  let v65 = v64;
  if (v64 === "brush" || v64 === "eraser")
    v65 = [v64, cacheNumber(v62["sizeWorld"]), pointSignature(v62["points"])][
      "join"
    ](":");
  else
    v64 === "rect" &&
      (v65 = [
        v64,
        cacheNumber(v62["sizeWorld"]),
        cacheNumber(v62["x1"]),
        cacheNumber(v62["y1"]),
        cacheNumber(v62["x2"]),
        cacheNumber(v62["y2"]),
      ]["join"](":"));
  return (commandSignatureCache["set"](v62, v65), v65);
}
export function buildFillRegionCacheKey({
  width: v66,
  height: v67,
  zoom: v68,
  seedX: v69,
  seedY: v70,
  fillCommand: v71,
  boundaryCommands: v72,
  extraKey: extraKey = "",
} = {}) {
  const v73 = (Array["isArray"](v72) ? v72 : [])
    ["map"](commandBoundarySignature)
    ["join"]("|");
  return [
    cacheNumber(v66),
    cacheNumber(v67),
    cacheNumber(v68),
    cacheNumber(v69),
    cacheNumber(v70),
    cacheNumber(v71?.["x"] ?? v71?.["startPoint"]?.["x"]),
    cacheNumber(v71?.["y"] ?? v71?.["startPoint"]?.["y"]),
    String(v71?.["mode"] || ""),
    String(v71?.["color"] || ""),
    String(extraKey || ""),
    v73,
  ]["join"]("::");
}
function rememberFillRegion(v74, v75, v76) {
  if (!v74 || typeof v74["set"] !== "function") return;
  if (v74["size"] >= FILL_REGION_CACHE_LIMIT) {
    const v77 = v74["keys"]()["next"]()["value"];
    if (v77 !== undefined) v74["delete"](v77);
  }
  v74["set"](v75, v76);
}
export function getCachedSealedFillRegion({
  cache: cache = null,
  width: v78,
  height: v79,
  zoom: v80,
  fillCommand: v81,
  boundaryCommands: v82,
  seedX: v83,
  seedY: v84,
  pointToPixel: v85,
  getStrokeWidth: v86,
  extraKey: extraKey = "",
  buildBoundaryMaskFn: buildBoundaryMaskFn = buildBinaryBoundaryMask,
  floodFillRegionFn: floodFillRegionFn = floodFillRegion,
  sealRegionToBoundaryFn: sealRegionToBoundaryFn = sealRegionToBoundary,
} = {}) {
  const v87 = buildFillRegionCacheKey({
      width: v78,
      height: v79,
      zoom: v80,
      seedX: v83,
      seedY: v84,
      fillCommand: v81,
      boundaryCommands: v82,
      extraKey: extraKey,
    }),
    v88 = cache?.["get"]?.(v87);
  if (v88?.["sealedRegionMask"]) return v88["sealedRegionMask"];
  const v89 = buildBoundaryMaskFn({
      width: v78,
      height: v79,
      commands: v82,
      pointToPixel: v85,
      getStrokeWidth: v86,
    }),
    v90 = floodFillRegionFn(v89["mask"], v89["width"], v89["height"], v83, v84),
    v91 = sealRegionToBoundaryFn(v90, v89["mask"], v89["width"], v89["height"]);
  return (rememberFillRegion(cache, v87, { sealedRegionMask: v91 }), v91);
}
export function buildBinaryBoundaryMask({
  width: v92,
  height: v93,
  commands: v94,
  pointToPixel: v95,
  getStrokeWidth: v96,
}) {
  const v97 = Math["max"](1, Math["floor"](v92)),
    v98 = Math["max"](1, Math["floor"](v93)),
    v99 = createCanvas(v97, v98),
    v100 = v99["getContext"]("2d");
  ((v100["lineCap"] = "round"),
    (v100["lineJoin"] = "round"),
    (v94 || [])["forEach"]((v101) => {
      if (!v101) return;
      if (v101["type"] === "brush") {
        const v102 = Array["isArray"](v101["points"]) ? v101["points"] : [];
        if (!v102["length"]) return;
        (v100["save"](),
          (v100["globalCompositeOperation"] = "source-over"),
          (v100["strokeStyle"] = "#fff"),
          (v100["lineWidth"] = Math["max"](1, Number(v96?.(v101)) || 1)),
          v100["beginPath"]());
        for (let v103 = 0; v103 < v102["length"]; v103 += 1) {
          const v104 = v95(v102[v103]);
          if (v103 === 0) v100["moveTo"](v104["x"], v104["y"]);
          else v100["lineTo"](v104["x"], v104["y"]);
        }
        (v100["stroke"](), v100["restore"]());
        return;
      }
      if (v101["type"] === "rect") {
        const v105 = v95({ x: v101["x1"], y: v101["y1"] }),
          v106 = v95({ x: v101["x2"], y: v101["y2"] }),
          v107 = Math["min"](v105["x"], v106["x"]),
          v108 = Math["min"](v105["y"], v106["y"]),
          v109 = Math["abs"](v106["x"] - v105["x"]),
          v110 = Math["abs"](v106["y"] - v105["y"]);
        (v100["save"](),
          (v100["globalCompositeOperation"] = "source-over"),
          (v100["strokeStyle"] = "#fff"),
          (v100["lineWidth"] = Math["max"](1, Number(v96?.(v101)) || 1)),
          v100["strokeRect"](v107, v108, v109, v110),
          v100["restore"]());
        return;
      }
      if (v101["type"] === "eraser") {
        const v111 = Array["isArray"](v101["points"]) ? v101["points"] : [];
        if (!v111["length"]) return;
        (v100["save"](),
          (v100["globalCompositeOperation"] = "destination-out"),
          (v100["strokeStyle"] = "#000"),
          (v100["lineWidth"] = Math["max"](1, Number(v96?.(v101)) || 1)),
          v100["beginPath"]());
        for (let v112 = 0; v112 < v111["length"]; v112 += 1) {
          const v113 = v95(v111[v112]);
          if (v112 === 0) v100["moveTo"](v113["x"], v113["y"]);
          else v100["lineTo"](v113["x"], v113["y"]);
        }
        (v100["stroke"](), v100["restore"]());
      }
    }));
  const v114 = extractMaskFromCanvas(v99);
  return {
    width: v97,
    height: v98,
    mask: v114,
    hasBoundary: hasAnyMarked(v114),
  };
}
export function autoCloseBoundary(v115, v116, v117, v118) {
  const v119 = Math["max"](0, Math["min"](64, Math["floor"](v118)));
  if (!v115 || !v115["length"] || v119 <= 0)
    return v115 instanceof Uint8Array ? v115["slice"]() : new Uint8Array(0);
  const v120 = buildDiskOffsets(v119),
    v121 = dilate(v115, v116, v117, v120);
  return erode(v121, v116, v117, v120);
}
export function floodFillRegion(v122, v123, v124, v125, v126) {
  const v127 = Math["max"](1, Math["floor"](v123)),
    v128 = Math["max"](1, Math["floor"](v124)),
    v129 = v122 || new Uint8Array(v127 * v128),
    v130 = new Uint8Array(v127 * v128),
    v131 = clampInt(v125, 0, v127 - 1),
    v132 = clampInt(v126, 0, v128 - 1);
  if (!hasAnyMarked(v129)) return (v130["fill"](1), v130);
  if (v129[v132 * v127 + v131]) return v130;
  const v133 = [{ x: v131, y: v132 }];
  while (v133["length"] > 0) {
    const { x: v134, y: v135 } = v133["pop"]();
    if (v134 < 0 || v134 >= v127 || v135 < 0 || v135 >= v128) continue;
    const v136 = v135 * v127 + v134;
    if (v130[v136] || v129[v136]) continue;
    ((v130[v136] = 1),
      v133["push"]({ x: v134 + 1, y: v135 }),
      v133["push"]({ x: v134 - 1, y: v135 }),
      v133["push"]({ x: v134, y: v135 + 1 }),
      v133["push"]({ x: v134, y: v135 - 1 }));
  }
  return v130;
}
export function sealRegionToBoundary(v137, v138, v139, v140, v141 = 2) {
  const v142 = Math["max"](1, Math["floor"](v139)),
    v143 = Math["max"](1, Math["floor"](v140));
  let v144 =
    v137 instanceof Uint8Array ? v137["slice"]() : new Uint8Array(v142 * v143);
  if (!v138?.["length"] || !v144["length"]) return v144;
  const v145 = Math["max"](1, Math["min"](4, Math["floor"](v141))),
    v146 = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ];
  for (let v147 = 0; v147 < v145; v147 += 1) {
    const v148 = v144["slice"]();
    for (let v149 = 0; v149 < v143; v149 += 1) {
      const v150 = v149 * v142;
      for (let v151 = 0; v151 < v142; v151 += 1) {
        const v152 = v150 + v151;
        if (!v138[v152] || v144[v152]) continue;
        for (let v153 = 0; v153 < v146["length"]; v153 += 1) {
          const v154 = v151 + v146[v153][0],
            v155 = v149 + v146[v153][1];
          if (v154 < 0 || v154 >= v142 || v155 < 0 || v155 >= v143) continue;
          if (v144[v155 * v142 + v154]) {
            v148[v152] = 1;
            break;
          }
        }
      }
    }
    v144 = v148;
  }
  return v144;
}
export function paintFilledRegion(
  v156,
  v157,
  v158,
  v159,
  {
    fillStyle: fillStyle = "rgba(255,255,255,1)",
    globalCompositeOperation: globalCompositeOperation = "source-over",
    globalAlpha: globalAlpha = 1,
  } = {},
) {
  if (!v156 || !v157?.["length"]) return;
  const v160 = Math["max"](1, Math["floor"](v158)),
    v161 = Math["max"](1, Math["floor"](v159)),
    v162 = createRegionMaskCanvas(v157, v160, v161),
    v163 = createCanvas(v160, v161),
    v164 = v163["getContext"]("2d");
  ((v164["fillStyle"] = fillStyle),
    v164["fillRect"](0, 0, v160, v161),
    (v164["globalCompositeOperation"] = "destination-in"),
    v164["drawImage"](v162, 0, 0, v160, v161),
    v156["save"](),
    (v156["globalCompositeOperation"] = globalCompositeOperation),
    (v156["globalAlpha"] = globalAlpha),
    v156["drawImage"](v163, 0, 0, v160, v161),
    v156["restore"]());
}
