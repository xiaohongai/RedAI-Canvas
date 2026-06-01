const STORYBOARD_CELL_GAP = 0,
  STORYBOARD_CELL_INSET = 1.5,
  STORYBOARD_MIN_TRACK_WEIGHT = 0.2;
export const STORYBOARD_GRID_GAP_MAX = 80;
function _trimString(v0) {
  return typeof v0 === "string" ? v0["trim"]() : "";
}
function _normalizeLocalPath(v1) {
  const v2 = _trimString(v1);
  if (!v2) return "";
  return v2["startsWith"]("/") ? v2 : "/" + v2;
}
function _toPositiveNumber(v3) {
  const v4 = Number(v3);
  return Number["isFinite"](v4) && v4 > 0 ? v4 : null;
}
function _isUsableNonDataSrc(v5) {
  const v6 = _trimString(v5);
  return !!v6 && !v6["startsWith"]("data:");
}
function _isUsablePreviewSrc(v7) {
  return !!_trimString(v7);
}
function _getSafeGridCount(v8) {
  const v9 = Math["round"](Number(v8) || 0);
  return Math["max"](1, v9);
}
export function resolveStoryboardCellSourceIndex(v10, v11, v12 = null) {
  const v13 = Math["trunc"](Number(v11)),
    v14 = Number["isInteger"](v13) && v13 >= 0 ? v13 : 0,
    v15 = Math["trunc"](Number(v10?.["storyboardSourceIndex"])),
    v16 = _getSafeGridCount(v12?.["cols"]) * _getSafeGridCount(v12?.["rows"]),
    v17 = Number["isInteger"](v15) && v15 >= 0 ? v15 : v14;
  if (!Number["isInteger"](v17) || v17 < 0) return v14;
  if (v12 && v17 >= v16) return v14;
  return v17;
}
function _clamp(v18, v19, v20) {
  return Math["min"](Math["max"](v18, v19), v20);
}
function _roundTrackWeight(v21) {
  return Math["round"](v21 * 10000) / 10000;
}
function _getTrackTotal(v22) {
  return v22["reduce"]((v23, v24) => v23 + v24, 0);
}
function _getEqualTracks(v25) {
  return Array["from"]({ length: v25 }, () => 1);
}
export function resolveStoryboardGridTracks(v26, v27) {
  const v28 = _getSafeGridCount(v27);
  if (!Array["isArray"](v26) || v26["length"] !== v28)
    return _getEqualTracks(v28);
  const v29 = v26["map"]((v30) => Number(v30));
  if (
    v29["some"](
      (v31) => !Number["isFinite"](v31) || v31 < STORYBOARD_MIN_TRACK_WEIGHT,
    )
  )
    return _getEqualTracks(v28);
  const v32 = _getTrackTotal(v29);
  if (!Number["isFinite"](v32) || v32 <= 0) return _getEqualTracks(v28);
  const v33 = v28 / v32;
  return v29["map"]((v34) => _roundTrackWeight(v34 * v33));
}
export function resolveStoryboardGridLayout(v35) {
  const v36 = _getSafeGridCount(v35?.["cols"]),
    v37 = _getSafeGridCount(v35?.["rows"]),
    v38 =
      v35?.["gridLayout"] && typeof v35["gridLayout"] === "object"
        ? v35["gridLayout"]
        : {};
  return {
    cols: v36,
    rows: v37,
    columns: resolveStoryboardGridTracks(v38["columns"], v36),
    rowTracks: resolveStoryboardGridTracks(v38["rows"], v37),
  };
}
export function normalizeStoryboardGridGap(v39, v40 = STORYBOARD_CELL_GAP) {
  const v41 = Number(v39),
    v42 = Number(v40),
    v43 = Number["isFinite"](v41) ? v41 : Number["isFinite"](v42) ? v42 : 0;
  return Math["round"](_clamp(v43, 0, STORYBOARD_GRID_GAP_MAX));
}
export function buildStoryboardGridTemplate(v44, v45) {
  return resolveStoryboardGridTracks(v44, v45)
    ["map"]((v46) => _roundTrackWeight(v46) + "fr")
    ["join"]("\x20");
}
export function getStoryboardGridDividerPositions(v47, v48 = {}) {
  if (!v47 || typeof v47 !== "object") return { vertical: [], horizontal: [] };
  const v49 = resolveStoryboardGridLayout(v47),
    v50 = Math["max"](
      0,
      Number(
        Object["prototype"]["hasOwnProperty"]["call"](v48, "width")
          ? v48["width"]
          : v47["width"],
      ) || 0,
    ),
    v51 = Math["max"](
      0,
      Number(
        Object["prototype"]["hasOwnProperty"]["call"](v48, "height")
          ? v48["height"]
          : v47["height"],
      ) || 0,
    ),
    v52 = Math["max"](
      0,
      Number(
        Object["prototype"]["hasOwnProperty"]["call"](v48, "inset")
          ? v48["inset"]
          : STORYBOARD_CELL_INSET,
      ) || 0,
    ),
    v53 = Math["max"](0, v50 - v52 * 2),
    v54 = Math["max"](0, v51 - v52 * 2),
    v55 = (v56, v57) => {
      const v58 = _getTrackTotal(v56);
      if (v58 <= 0 || v57 <= 0) return [];
      const v59 = [];
      let v60 = 0;
      for (let v61 = 0; v61 < v56["length"] - 1; v61++) {
        v60 += v56[v61];
        const v62 = v60 / v58;
        v59["push"]({ index: v61, ratio: v62, position: v52 + v62 * v57 });
      }
      return v59;
    };
  return {
    vertical: v55(v49["columns"], v53),
    horizontal: v55(v49["rowTracks"], v54),
    cols: v49["cols"],
    rows: v49["rows"],
    width: v50,
    height: v51,
    inset: v52,
    innerWidth: v53,
    innerHeight: v54,
  };
}
export function getStoryboardScaledGridGap(v63, v64 = {}) {
  const v65 = normalizeStoryboardGridGap(v63?.["gridGap"]),
    v66 = Math["max"](0, Number(v64["width"]) || 0),
    v67 = Math["max"](0, Number(v64["height"]) || 0),
    v68 = Math["max"](
      1,
      Number(v64["nodeWidth"] ?? v63?.["width"] ?? v66) || v66 || 1,
    ),
    v69 = Math["max"](
      1,
      Number(v64["nodeHeight"] ?? v63?.["height"] ?? v67) || v67 || 1,
    );
  return {
    x: v66 > 0 ? v65 * (v66 / v68) : v65,
    y: v67 > 0 ? v65 * (v67 / v69) : v65,
  };
}
function _getTrackBounds(v70, v71, v72, v73) {
  const v74 = _getTrackTotal(v70);
  if (v74 <= 0 || v72 <= 0) return { start: 0, end: 0 };
  let v75 = 0;
  for (let v76 = 0; v76 < v70["length"]; v76++) {
    const v77 = (v70[v76] / v74) * v72,
      v78 = v75,
      v79 = v75 + v77;
    if (v76 === v71) return { start: v78, end: v79 };
    v75 = v79 + Math["max"](0, v73);
  }
  return { start: 0, end: 0 };
}
function _getCenteredGapTrackBounds(v80, v81, v82, v83) {
  const v84 = _getTrackTotal(v80);
  if (v84 <= 0 || v82 <= 0) return { start: 0, end: 0 };
  const v85 = Math["max"](0, Number(v83) || 0) / 2;
  let v86 = 0,
    v87 = 0,
    v88 = v82;
  for (let v89 = 0; v89 < v80["length"] - 1; v89++) {
    v86 += v80[v89];
    const v90 = (v86 / v84) * v82;
    if (v89 === v81 - 1) v87 = v90;
    if (v89 === v81) {
      v88 = v90;
      break;
    }
  }
  let v91 = v81 === 0 ? 0 : v87 + v85,
    v92 = v81 === v80["length"] - 1 ? v82 : v88 - v85;
  ((v91 = _clamp(v91, 0, v82)), (v92 = _clamp(v92, 0, v82)));
  if (v92 < v91) {
    const v93 = _clamp((v91 + v92) / 2, 0, v82);
    return { start: v93, end: v93 };
  }
  return { start: v91, end: v92 };
}
export function resolveStoryboardCellPreviewSrc(v94) {
  if (!v94 || typeof v94 !== "object") return "";
  const v95 = _normalizeLocalPath(v94["thumbLocalPath"]);
  if (v95) return v95;
  const v96 = _normalizeLocalPath(v94["displayLocalPath"]);
  if (v96) return v96;
  const v97 = _normalizeLocalPath(v94["localPath"]);
  if (v97) return v97;
  if (_isUsablePreviewSrc(v94["capturePreviewUrl"]))
    return _trimString(v94["capturePreviewUrl"]);
  if (_isUsableNonDataSrc(v94["thumbUrl"])) return _trimString(v94["thumbUrl"]);
  if (_isUsableNonDataSrc(v94["url"])) return _trimString(v94["url"]);
  return "";
}
export function resolveStoryboardCellAssetSrc(v98) {
  if (!v98 || typeof v98 !== "object") return "";
  const v99 = _normalizeLocalPath(v98["localPath"]);
  if (v99) return v99;
  const v100 = _normalizeLocalPath(v98["originalLocalPath"]);
  if (v100) return v100;
  const v101 = _normalizeLocalPath(v98["displayLocalPath"]);
  if (v101) return v101;
  const v102 = _normalizeLocalPath(v98["thumbLocalPath"]);
  if (v102) return v102;
  if (_isUsablePreviewSrc(v98["capturePreviewUrl"]))
    return _trimString(v98["capturePreviewUrl"]);
  if (_isUsableNonDataSrc(v98["url"])) return _trimString(v98["url"]);
  if (_isUsableNonDataSrc(v98["thumbUrl"])) return _trimString(v98["thumbUrl"]);
  return "";
}
export function isStoryboardCellEmpty(v103) {
  if (!v103 || typeof v103 !== "object") return true;
  if (v103["isEmpty"] === true) return true;
  return !(
    _trimString(v103["url"]) ||
    _trimString(v103["localPath"]) ||
    _trimString(v103["originalLocalPath"]) ||
    _trimString(v103["displayLocalPath"]) ||
    _trimString(v103["capturePreviewUrl"]) ||
    _trimString(v103["thumbUrl"]) ||
    _trimString(v103["thumbLocalPath"]) ||
    _trimString(v103["thumbId"]) ||
    _trimString(v103["sourceId"]) ||
    _trimString(v103["sourceLocalPath"]) ||
    _trimString(v103["sourceUrl"])
  );
}
function _hasLocalStoryboardCellAsset(v104) {
  return !!(
    _trimString(v104?.["localPath"]) ||
    _trimString(v104?.["originalLocalPath"]) ||
    _trimString(v104?.["displayLocalPath"]) ||
    _trimString(v104?.["thumbLocalPath"])
  );
}
function _hasStoryboardCellSwapAsset(v105) {
  return !!(
    _hasLocalStoryboardCellAsset(v105) ||
    _trimString(v105?.["capturePreviewUrl"]) ||
    _trimString(v105?.["url"]) ||
    _trimString(v105?.["thumbUrl"])
  );
}
function _isSourceBackedStoryboardCell(v106) {
  return !!(
    v106?.["storyboardSourceCrop"] === true ||
    _trimString(v106?.["sourceLocalPath"]) ||
    _trimString(v106?.["sourceUrl"])
  );
}
export function isFrozenStoryboardDisplayCell(v107) {
  if (!v107 || typeof v107 !== "object" || isStoryboardCellEmpty(v107))
    return false;
  if (!resolveStoryboardCellAssetSrc(v107)) return false;
  if (
    v107["storyboardPiece"] === true &&
    v107["storyboardExtractedCell"] !== true
  )
    return false;
  if (
    v107["storyboardExtractedCell"] === true ||
    v107["storyboardLockedCell"] === true
  )
    return true;
  return (
    !_isSourceBackedStoryboardCell(v107) && v107["storyboardPiece"] !== true
  );
}
export function detachStoryboardCellSourceContext(v108, v109 = {}) {
  const v110 = v108 && typeof v108 === "object" ? { ...v108 } : {},
    v111 =
      _trimString(v110["pieceId"]) ||
      _trimString(v110["id"]) ||
      _trimString(v109["pieceId"]);
  if (v111) v110["pieceId"] = v111;
  ((v110["sourceId"] = null),
    (v110["sourceLocalPath"] = null),
    (v110["sourceUrl"] = ""),
    (v110["sourceWidth"] = null),
    (v110["sourceHeight"] = null),
    (v110["storyboardSourceCrop"] = false),
    (v110["storyboardPiece"] = false));
  if (v109["locked"] === true) v110["storyboardLockedCell"] = true;
  return (
    Object["prototype"]["hasOwnProperty"]["call"](v109, "extracted") &&
      (v110["storyboardExtractedCell"] = v109["extracted"] === true),
    v110
  );
}
export function cloneStoryboardCellForSwap(v112) {
  const v113 = v112 && typeof v112 === "object" ? { ...v112 } : {};
  if (_hasLocalStoryboardCellAsset(v113)) {
    if (_trimString(v113["url"])["startsWith"]("data:")) v113["url"] = "";
    if (_trimString(v113["thumbUrl"])["startsWith"]("data:"))
      v113["thumbUrl"] = "";
  }
  return v113;
}
export function cloneStoryboardCellForSwapDestination(v114) {
  const v115 = cloneStoryboardCellForSwap(v114);
  if (
    _isSourceBackedStoryboardCell(v115) &&
    !isStoryboardCellEmpty(v115) &&
    _hasStoryboardCellSwapAsset(v115)
  )
    return detachStoryboardCellSourceContext(v115, {
      extracted: true,
      locked: v115["storyboardLockedCell"] === true,
    });
  return v115;
}
export function normalizeEmptyStoryboardCell(v116) {
  const v117 = _trimString(v116?.["sourceLocalPath"]),
    v118 = _trimString(v116?.["sourceUrl"]),
    v119 =
      _trimString(v116?.["localPath"]) ||
      _trimString(v116?.["originalLocalPath"]) ||
      _trimString(v116?.["displayLocalPath"]) ||
      _trimString(v116?.["thumbLocalPath"]),
    v120 =
      _trimString(v116?.["url"]) ||
      _trimString(v116?.["capturePreviewUrl"]) ||
      _trimString(v116?.["thumbUrl"]),
    v121 = !!(v117 || v118),
    v122 = _trimString(v116?.["residualImageLocalPath"]) || v117 || v119,
    v123 = _trimString(v116?.["residualImageUrl"]) || v118 || v120,
    v124 =
      _trimString(v116?.["residualImageMode"]) ||
      (v121 ? "source" : v122 || v123 ? "cell" : ""),
    v125 = {
      ...(v116 && typeof v116 === "object" ? v116 : {}),
      url: "",
      localPath: null,
      originalLocalPath: null,
      displayLocalPath: null,
      thumbUrl: "",
      thumbLocalPath: null,
      thumbId: null,
      sourceId: null,
      sourceLocalPath: null,
      sourceUrl: "",
      sourceWidth: null,
      sourceHeight: null,
      storyboardSourceCrop: false,
      storyboardPiece: false,
      storyboardLockedCell: false,
      residualImageLocalPath: v122 || null,
      residualImageUrl: v123 || "",
      residualImageWidth:
        _toPositiveNumber(v116?.["residualImageWidth"]) ||
        _toPositiveNumber(v116?.["sourceWidth"]) ||
        _toPositiveNumber(v116?.["originalWidth"]) ||
        _toPositiveNumber(v116?.["imageWidth"]) ||
        null,
      residualImageHeight:
        _toPositiveNumber(v116?.["residualImageHeight"]) ||
        _toPositiveNumber(v116?.["sourceHeight"]) ||
        _toPositiveNumber(v116?.["originalHeight"]) ||
        _toPositiveNumber(v116?.["imageHeight"]) ||
        null,
      residualImageMode: v124,
      isEmpty: true,
    };
  return (
    v116 &&
      Object["prototype"]["hasOwnProperty"]["call"](
        v116,
        "capturePreviewUrl",
      ) &&
      (v125["capturePreviewUrl"] = ""),
    v116 &&
      Object["prototype"]["hasOwnProperty"]["call"](
        v116,
        "storyboardExtractedCell",
      ) &&
      (v125["storyboardExtractedCell"] = false),
    v125
  );
}
export function getStoryboardCellMetrics(v126) {
  const v127 = _getSafeGridCount(v126?.["cols"]),
    v128 = _getSafeGridCount(v126?.["rows"]),
    v129 = resolveStoryboardGridLayout(v126),
    v130 = STORYBOARD_CELL_GAP,
    v131 = Math["max"](0, Number(v126?.["width"]) || 0),
    v132 = Math["max"](0, Number(v126?.["height"]) || 0),
    v133 = Math["max"](0, v131 - STORYBOARD_CELL_INSET * 2),
    v134 = Math["max"](0, v132 - STORYBOARD_CELL_INSET * 2),
    v135 = Math["max"](0, (v133 - (v127 - 1) * v130) / v127),
    v136 = Math["max"](0, (v134 - (v128 - 1) * v130) / v128);
  return {
    cols: v127,
    rows: v128,
    width: v131,
    height: v132,
    gap: v130,
    inset: STORYBOARD_CELL_INSET,
    innerWidth: v133,
    innerHeight: v134,
    cellWidth: v135,
    cellHeight: v136,
    columnWeights: v129["columns"],
    rowWeights: v129["rowTracks"],
  };
}
export function getStoryboardCellBounds(v137, v138, v139 = {}) {
  if (!v137 || typeof v137 !== "object") return null;
  const v140 = resolveStoryboardGridLayout(v137),
    v141 = Math["trunc"](Number(v138));
  if (!Number["isInteger"](v141) || v141 < 0) return null;
  if (v141 >= v140["cols"] * v140["rows"]) return null;
  const v142 = Math["max"](
      0,
      Number(
        Object["prototype"]["hasOwnProperty"]["call"](v139, "width")
          ? v139["width"]
          : v137["width"],
      ) || 0,
    ),
    v143 = Math["max"](
      0,
      Number(
        Object["prototype"]["hasOwnProperty"]["call"](v139, "height")
          ? v139["height"]
          : v137["height"],
      ) || 0,
    ),
    v144 = Math["max"](
      0,
      Number(
        Object["prototype"]["hasOwnProperty"]["call"](v139, "inset")
          ? v139["inset"]
          : STORYBOARD_CELL_INSET,
      ) || 0,
    ),
    v145 = Object["prototype"]["hasOwnProperty"]["call"](v139, "gap"),
    v146 = Object["prototype"]["hasOwnProperty"]["call"](v139, "gapX"),
    v147 = Object["prototype"]["hasOwnProperty"]["call"](v139, "gapY"),
    v148 = Math["max"](
      0,
      Number(
        v145 ? v139["gap"] : normalizeStoryboardGridGap(v137["gridGap"]),
      ) || 0,
    ),
    v149 = Math["max"](0, Number(v146 ? v139["gapX"] : v148) || 0),
    v150 = Math["max"](0, Number(v147 ? v139["gapY"] : v148) || 0),
    v151 = v139["gapMode"] !== "track",
    v152 = v139["gapMode"] !== "track",
    v153 = Math["max"](0, v142 - v144 * 2),
    v154 = Math["max"](0, v143 - v144 * 2),
    v155 = v151 ? v153 : Math["max"](0, v153 - (v140["cols"] - 1) * v149),
    v156 = v152 ? v154 : Math["max"](0, v154 - (v140["rows"] - 1) * v150),
    v157 = v141 % v140["cols"],
    v158 = Math["floor"](v141 / v140["cols"]),
    v159 = v151
      ? _getCenteredGapTrackBounds(v140["columns"], v157, v155, v149)
      : _getTrackBounds(v140["columns"], v157, v155, v149),
    v160 = v152
      ? _getCenteredGapTrackBounds(v140["rowTracks"], v158, v156, v150)
      : _getTrackBounds(v140["rowTracks"], v158, v156, v150),
    v161 = v144 + v159["start"],
    v162 = v144 + v159["end"],
    v163 = v144 + v160["start"],
    v164 = v144 + v160["end"];
  return {
    col: v157,
    row: v158,
    x0: v161,
    y0: v163,
    x1: v162,
    y1: v164,
    width: Math["max"](0, v162 - v161),
    height: Math["max"](0, v164 - v163),
  };
}
export function getStoryboardCellPixelBounds(v165, v166, v167 = {}) {
  const v168 = getStoryboardCellBounds(v165, v166, v167);
  if (!v168) return null;
  const v169 = resolveStoryboardGridLayout(v165),
    v170 = Math["max"](
      0,
      Number(
        Object["prototype"]["hasOwnProperty"]["call"](v167, "width")
          ? v167["width"]
          : v165?.["width"],
      ) || 0,
    ),
    v171 = Math["max"](
      0,
      Number(
        Object["prototype"]["hasOwnProperty"]["call"](v167, "height")
          ? v167["height"]
          : v165?.["height"],
      ) || 0,
    ),
    v172 = Math["max"](
      0,
      Number(
        Object["prototype"]["hasOwnProperty"]["call"](v167, "inset")
          ? v167["inset"]
          : STORYBOARD_CELL_INSET,
      ) || 0,
    ),
    v173 = Math["floor"](v172),
    v174 = Math["floor"](v172),
    v175 = Math["max"](v173, Math["ceil"](v170 - v172)),
    v176 = Math["max"](v174, Math["ceil"](v171 - v172));
  let v177 = _clamp(Math["floor"](v168["x0"]), v173, v175),
    v178 = _clamp(Math["floor"](v168["y0"]), v174, v176),
    v179 = _clamp(Math["ceil"](v168["x1"]), v173, v175),
    v180 = _clamp(Math["ceil"](v168["y1"]), v174, v176);
  if (v168["col"] <= 0) v177 = v173;
  if (v168["row"] <= 0) v178 = v174;
  if (v168["col"] >= v169["cols"] - 1) v179 = v175;
  if (v168["row"] >= v169["rows"] - 1) v180 = v176;
  if (v179 < v177) v179 = v177;
  if (v180 < v178) v180 = v178;
  return {
    ...v168,
    x0: v177,
    y0: v178,
    x1: v179,
    y1: v180,
    width: Math["max"](0, v179 - v177),
    height: Math["max"](0, v180 - v178),
  };
}
export function buildStoryboardCropRect(v181, v182, v183 = {}) {
  if (!v181 || typeof v181 !== "object") return null;
  const v184 = Math["max"](1, Math["trunc"](Number(v183["width"]) || 0)),
    v185 = Math["max"](1, Math["trunc"](Number(v183["height"]) || 0));
  if (v184 <= 0 || v185 <= 0) return null;
  const v186 = Math["max"](
      0,
      Number(
        Object["prototype"]["hasOwnProperty"]["call"](v183, "inset")
          ? v183["inset"]
          : 0,
      ) || 0,
    ),
    v187 = Object["prototype"]["hasOwnProperty"]["call"](v183, "gap"),
    v188 = Object["prototype"]["hasOwnProperty"]["call"](v183, "gapX"),
    v189 = Object["prototype"]["hasOwnProperty"]["call"](v183, "gapY"),
    v190 = getStoryboardScaledGridGap(v181, { width: v184, height: v185 }),
    v191 = v187 ? Math["max"](0, Number(v183["gap"]) || 0) : undefined,
    v192 = v188
      ? Math["max"](0, Number(v183["gapX"]) || 0)
      : v187
        ? v191
        : v190["x"],
    v193 = v189
      ? Math["max"](0, Number(v183["gapY"]) || 0)
      : v187
        ? v191
        : v190["y"],
    v194 = getStoryboardCellPixelBounds(v181, v182, {
      width: v184,
      height: v185,
      inset: v186,
      gapX: v192,
      gapY: v193,
      ...(Object["prototype"]["hasOwnProperty"]["call"](v183, "gapMode")
        ? { gapMode: v183["gapMode"] }
        : {}),
    });
  if (!v194 || v194["width"] <= 0 || v194["height"] <= 0) return null;
  const v195 = _clamp(v194["x0"], 0, Math["max"](0, v184 - 1)),
    v196 = _clamp(v194["y0"], 0, Math["max"](0, v185 - 1)),
    v197 = _clamp(v194["x1"], v195 + 1, v184),
    v198 = _clamp(v194["y1"], v196 + 1, v185),
    v199 = Math["max"](1, v197 - v195),
    v200 = Math["max"](1, v198 - v196);
  return {
    sx: v195,
    sy: v196,
    sw: v199,
    sh: v200,
    x0: v195,
    y0: v196,
    x1: v197,
    y1: v198,
    width: v199,
    height: v200,
    bounds: v194,
  };
}
export function getStoryboardCellIndexAtWorldPoint(v201, v202, v203) {
  if (!v201 || typeof v201 !== "object") return -1;
  const v204 = Number(v201["x"]) || 0,
    v205 = Number(v201["y"]) || 0,
    v206 = v202 - v204,
    v207 = v203 - v205,
    v208 = getStoryboardCellMetrics(v201);
  if (v206 < 0 || v206 > v208["width"] || v207 < 0 || v207 > v208["height"])
    return -1;
  const v209 = v208["cols"] * v208["rows"];
  for (let v210 = 0; v210 < v209; v210++) {
    const v211 = getStoryboardCellPixelBounds(v201, v210);
    if (!v211 || v211["width"] <= 0 || v211["height"] <= 0) continue;
    if (
      v206 >= v211["x0"] &&
      v206 <= v211["x1"] &&
      v207 >= v211["y0"] &&
      v207 <= v211["y1"]
    )
      return v210;
  }
  return -1;
}
export function getStoryboardNearestCellIndexAtWorldPoint(v212, v213, v214) {
  if (!v212 || typeof v212 !== "object") return -1;
  const v215 = getStoryboardCellIndexAtWorldPoint(v212, v213, v214);
  if (v215 >= 0) return v215;
  const v216 = Number(v212["x"]) || 0,
    v217 = Number(v212["y"]) || 0,
    v218 = v213 - v216,
    v219 = v214 - v217,
    v220 = getStoryboardCellMetrics(v212);
  if (v218 < 0 || v218 > v220["width"] || v219 < 0 || v219 > v220["height"])
    return -1;
  const v221 = v220["cols"] * v220["rows"];
  let v222 = -1,
    v223 = Infinity;
  for (let v224 = 0; v224 < v221; v224++) {
    const v225 = getStoryboardCellPixelBounds(v212, v224, { gap: 0 });
    if (!v225 || v225["width"] <= 0 || v225["height"] <= 0) continue;
    if (
      v218 >= v225["x0"] &&
      v218 <= v225["x1"] &&
      v219 >= v225["y0"] &&
      v219 <= v225["y1"]
    )
      return v224;
    const v226 = v225["x0"] + v225["width"] / 2,
      v227 = v225["y0"] + v225["height"] / 2,
      v228 = (v218 - v226) ** 2 + (v219 - v227) ** 2;
    v228 < v223 && ((v223 = v228), (v222 = v224));
  }
  return v222;
}
