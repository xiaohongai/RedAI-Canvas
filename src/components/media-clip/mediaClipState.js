export const MEDIA_CLIP_NODE_TYPE = "media-clip";
export const MEDIA_CLIP_SCHEMA_VERSION = 1;
export const MEDIA_CLIP_COMPACT_SIZE = Object["freeze"]({
  width: 1080,
  height: 150,
});
export const MEDIA_CLIP_TIMELINE_ZOOM_MIN = 0.08;
export const MEDIA_CLIP_TIMELINE_ZOOM_MAX = 6;
export const MEDIA_CLIP_IMAGE_DEFAULT_DURATION_SEC = 5;
const VIDEO_NODE_TYPES = new Set(["source-video", "ai-video", "video"]),
  IMAGE_NODE_TYPES = new Set(["source-image", "ai-image", "image"]),
  AUDIO_NODE_TYPES = new Set(["source-audio", "ai-audio", "audio"]),
  MIN_RANGE_SEC = 0.1;
function normalizeText(v0) {
  return String(v0 || "")["trim"]();
}
function toNumber(v1, v2 = 0) {
  const v3 = Number(v1);
  return Number["isFinite"](v3) ? v3 : v2;
}
function roundSec(v4) {
  return Math["round"](Math["max"](0, toNumber(v4, 0)) * 1000) / 1000;
}
function roundSignedSec(v5) {
  return Math["round"](toNumber(v5, 0) * 1000) / 1000;
}
function clampNumber(v6, v7, v8, v9) {
  const v10 = toNumber(v6, v9);
  return Math["max"](v7, Math["min"](v8, v10));
}
function roundTimelineZoom(v11) {
  return Math["round"](v11 * 1000) / 1000;
}
export function normalizeMediaClipTimelineView(v12 = {}) {
  const v13 = v12 && typeof v12 === "object" ? v12 : {};
  return {
    zoom: roundTimelineZoom(
      clampNumber(
        v13["zoom"],
        MEDIA_CLIP_TIMELINE_ZOOM_MIN,
        MEDIA_CLIP_TIMELINE_ZOOM_MAX,
        1,
      ),
    ),
    scrollLeft: Math["max"](0, Math["round"](toNumber(v13["scrollLeft"], 0))),
  };
}
function firstNonEmpty(...v14) {
  for (const v15 of v14) {
    const v16 = normalizeText(v15);
    if (v16) return v16;
  }
  return "";
}
function normalizeSourceList(v17) {
  if (Array["isArray"](v17))
    return v17["filter"]((v18) => v18 && typeof v18 === "object");
  return v17 && typeof v17 === "object" ? [v17] : [];
}
function getSourceDataCandidates(v19 = {}) {
  if (!v19 || typeof v19 !== "object") return [];
  const v20 = [],
    v21 = (v22) => {
      if (!v22 || typeof v22 !== "object") return;
      if (v20["includes"](v22)) return;
      v20["push"](v22);
    };
  return (
    v21(v19),
    v21(v19["nodeData"]),
    v21(v19["data"]),
    v21(v19["_data"]),
    v20
  );
}
function resolveDirectSourceKey(v23 = {}) {
  if (!v23 || typeof v23 !== "object") return "";
  for (const v24 of getSourceDataCandidates(v23)) {
    const v25 = firstNonEmpty(
      v24["localPath"],
      v24["originalLocalPath"],
      v24["displayLocalPath"],
      v24["videoLocalPath"],
      v24["audioLocalPath"],
      v24["imageUrl"],
      v24["thumbUrl"],
      v24["videoUrl"],
      v24["audioUrl"],
      v24["src"],
      v24["url"],
      v24["resultUrl"],
      v24["sourceUrl"],
    );
    if (v25) return v25;
  }
  return "";
}
function isUnavailableVideoRecord(v26 = {}) {
  const v27 = resolveDirectSourceKey(v26);
  if (!v27) return false;
  return getSourceDataCandidates(v26)["some"](
    (v28) =>
      v28?.["mediaUnavailable"] === true &&
      normalizeText(v28?.["mediaUnavailableSource"]) === v27,
  );
}
function resolveVideoRecord(v29 = {}) {
  for (const v30 of getSourceDataCandidates(v29)) {
    const v31 = Array["isArray"](v30["videos"]) ? v30["videos"] : [],
      v32 = Number(v30["mainVideoIndex"]),
      v33 = Number["isFinite"](v32) ? Math["max"](0, Math["trunc"](v32)) : 0,
      v34 = v31[v33] || null;
    if (resolveDirectSourceKey(v34) && !isUnavailableVideoRecord(v34))
      return v34;
    const v35 = v31["find"](
      (v36) => resolveDirectSourceKey(v36) && !isUnavailableVideoRecord(v36),
    );
    if (v35) return v35;
  }
  return null;
}
export function isMediaClipNodeType(v37) {
  return normalizeText(v37) === MEDIA_CLIP_NODE_TYPE;
}
export function getMediaClipInputKind(v38 = {}) {
  for (const v39 of getSourceDataCandidates(v38)) {
    const v40 = normalizeText(v39?.["type"]);
    if (VIDEO_NODE_TYPES["has"](v40)) return "video";
    if (IMAGE_NODE_TYPES["has"](v40)) return "image";
    if (AUDIO_NODE_TYPES["has"](v40)) return "audio";
  }
  return "";
}
export function isSupportedMediaClipInput(v41 = {}) {
  const v42 = getMediaClipInputKind(v41);
  if (!v42) return false;
  return !!resolveMediaClipSourceKey(v41);
}
export function resolveMediaClipSourceKey(v43 = {}) {
  if (!v43 || typeof v43 !== "object") return "";
  const v44 = resolveVideoRecord(v43);
  if (v44 && v44 !== v43) {
    const v45 = resolveDirectSourceKey(v44);
    if (v45) return v45;
  }
  if (isUnavailableVideoRecord(v43)) return "";
  return resolveDirectSourceKey(v43);
}
export function resolveMediaClipDurationSec(v46 = {}, v47 = "") {
  if (!v46 || typeof v46 !== "object") return 0;
  const v48 = v47 === "video" ? resolveVideoRecord(v46) : null;
  if (v48 && v48 !== v46) {
    const v49 = resolveMediaClipDurationSec(v48, v47);
    if (v49 > 0) return v49;
  }
  let v50 = "";
  for (const v51 of getSourceDataCandidates(v46)) {
    v50 = firstNonEmpty(
      v51["durationSec"],
      v51["videoDuration"],
      v51["audioDuration"],
      v51["duration"],
      v51["mediaDuration"],
    );
    if (v50) break;
  }
  const v52 = Math["max"](0, toNumber(v50, 0));
  if (v52 > 0) return v52;
  return v47 === "image" ? MEDIA_CLIP_IMAGE_DEFAULT_DURATION_SEC : 0;
}
export function resolveMediaClipDimensions(v53 = {}) {
  const v54 = resolveVideoRecord(v53);
  let v55 = getSourceDataCandidates(v54 || v53 || {})[0] || {};
  for (const v56 of getSourceDataCandidates(v54 || v53 || {})) {
    const v57 = firstNonEmpty(
        v56["videoWidth"],
        v56["width"],
        v56["naturalWidth"],
      ),
      v58 = firstNonEmpty(
        v56["videoHeight"],
        v56["height"],
        v56["naturalHeight"],
      );
    if (v57 || v58) {
      v55 = v56;
      break;
    }
  }
  const v59 = Math["round"](
      toNumber(v55["videoWidth"] ?? v55["width"] ?? v55["naturalWidth"], 0),
    ),
    v60 = Math["round"](
      toNumber(v55["videoHeight"] ?? v55["height"] ?? v55["naturalHeight"], 0),
    );
  return { width: v59 > 0 ? v59 : 1280, height: v60 > 0 ? v60 : 720 };
}
export function clampMediaClipRange(v61 = {}, v62 = 0) {
  const v63 = Math["max"](0, toNumber(v62, 0)),
    v64 =
      v63 > 0
        ? v63
        : Math["max"](MIN_RANGE_SEC, toNumber(v61["endSec"], MIN_RANGE_SEC));
  let v65 = roundSec(v61["startSec"]),
    v66 = roundSec(v61["endSec"] ?? v64);
  return (
    v63 > 0
      ? ((v65 = Math["min"](v65, Math["max"](0, v63 - MIN_RANGE_SEC))),
        (v66 = Math["min"](Math["max"](v66, v65 + MIN_RANGE_SEC), v63)))
      : (v66 = Math["max"](v66, v65 + MIN_RANGE_SEC)),
    !(v66 > v65) &&
      (v66 =
        v63 > 0 ? Math["min"](v63, v65 + MIN_RANGE_SEC) : v65 + MIN_RANGE_SEC),
    {
      startSec: roundSec(v65),
      endSec: roundSec(v66),
      durationSec: roundSec(v63 || v66),
    }
  );
}
function normalizeTrack(v67 = {}, v68 = null, v69 = "") {
  if (!v68) return null;
  const v70 = v67 && typeof v67 === "object" ? v67 : {},
    v71 = resolveMediaClipSourceKey(v68);
  if (!v71) return null;
  const v72 = resolveMediaClipDurationSec(v68, v69),
    v73 = normalizeText(v70["sourceKey"]) !== v71,
    v74 = v73
      ? { startSec: 0, endSec: v72 || v70["endSec"] || MIN_RANGE_SEC }
      : v70,
    v75 = clampMediaClipRange(v74, v72);
  return {
    sourceKey: v71,
    startSec: v75["startSec"],
    endSec: v75["endSec"],
    durationSec: v75["durationSec"],
  };
}
function getMediaClipSourceId(v76 = {}) {
  return firstNonEmpty(v76?.["id"], v76?.["nodeId"], v76?.["sourceId"]);
}
function getMediaClipClipId(v77 = {}, v78 = 0, v79 = "") {
  return firstNonEmpty(
    v77?.["clipId"],
    v77?.["__mediaClipClipId"],
    v77?.["__mediaClipEdgeId"],
    v77?.["edgeId"],
    v79 ? "media:" + v79 + ":" + v78 : "",
    getMediaClipSourceId(v77)
      ? "node:" + getMediaClipSourceId(v77) + ":" + v78
      : "",
    "clip:" + v78,
  );
}
function recomputeVideoClipTimeline(v80 = []) {
  let v81 = 0;
  return v80["map"]((v82, v83) => {
    if (!v82 || typeof v82 !== "object") return null;
    const v84 = normalizeText(v82["sourceKey"]);
    if (!v84) return null;
    const v85 = clampMediaClipRange(v82, v82["durationSec"]),
      v86 = roundSec(
        Math["max"](MIN_RANGE_SEC, v85["endSec"] - v85["startSec"]),
      ),
      v87 = roundSec(v81),
      v88 = roundSec(v87 + v86),
      v89 = {
        ...v82,
        id: normalizeText(v82["id"]) || "clip:" + v83,
        sourceKey: v84,
        startSec: v85["startSec"],
        endSec: v85["endSec"],
        durationSec: v85["durationSec"],
        timelineStartSec: v87,
        timelineEndSec: v88,
      };
    return ((v81 = v88), v89);
  })["filter"](Boolean);
}
function normalizeAudioClipTimeline(v90 = []) {
  return v90["map"]((v91, v92) => {
    if (!v91 || typeof v91 !== "object") return null;
    const v93 = normalizeText(v91["sourceKey"]);
    if (!v93) return null;
    const v94 = clampMediaClipRange(v91, v91["durationSec"]),
      v95 = roundSec(
        Math["max"](MIN_RANGE_SEC, v94["endSec"] - v94["startSec"]),
      ),
      v96 = Number["isFinite"](Number(v91["timelineStartSec"])),
      v97 = roundSec(v96 ? v91["timelineStartSec"] : 0);
    return {
      ...v91,
      id: normalizeText(v91["id"]) || "audio:" + v92,
      kind: "audio",
      sourceKey: v93,
      startSec: v94["startSec"],
      endSec: v94["endSec"],
      durationSec: v94["durationSec"],
      timelineStartSec: v97,
      timelineEndSec: roundSec(v97 + v95),
    };
  })["filter"](Boolean);
}
function normalizeVideoClips(v98 = {}, v99 = []) {
  const v100 = normalizeSourceList(v99),
    v101 = Array["isArray"](v98["clips"]) ? v98["clips"] : [],
    v102 = new Set(),
    v103 = (v104, v105, v106) => {
      const v107 = normalizeText(v104),
        v108 = normalizeText(v105),
        v109 = normalizeText(v106),
        v110 = v101["map"]((v111, v112) => ({ clip: v111, index: v112 }))[
          "filter"
        ](
          ({ clip: v113, index: v114 }) =>
            !v102["has"](v114) &&
            v107 &&
            (normalizeText(v113?.["id"]) === v107 ||
              normalizeText(v113?.["id"])["startsWith"](v107 + ":split:")),
        );
      if (v110["length"])
        return (
          v110["forEach"](({ index: v115 }) => v102["add"](v115)),
          v110["map"](({ clip: v116 }) => v116)
        );
      const v117 = v101["map"]((v118, v119) => ({ clip: v118, index: v119 }))[
        "filter"
      ](
        ({ clip: v120, index: v121 }) =>
          !v102["has"](v121) &&
          v108 &&
          normalizeText(v120?.["sourceId"]) === v108,
      );
      if (v117["length"])
        return (
          v117["forEach"](({ index: v122 }) => v102["add"](v122)),
          v117["map"](({ clip: v123 }) => v123)
        );
      const v124 = v101["map"]((v125, v126) => ({ clip: v125, index: v126 }))[
        "filter"
      ](
        ({ clip: v127, index: v128 }) =>
          !v102["has"](v128) &&
          v109 &&
          normalizeText(v127?.["sourceKey"]) === v109,
      );
      if (v124["length"])
        return (
          v124["forEach"](({ index: v129 }) => v102["add"](v129)),
          v124["map"](({ clip: v130 }) => v130)
        );
      return [];
    },
    v131 = [];
  return (
    v100["forEach"]((v132, v133) => {
      const v134 = resolveMediaClipSourceKey(v132);
      if (!v134) return;
      const v135 = getMediaClipInputKind(v132) === "image" ? "image" : "video",
        v136 = getMediaClipSourceId(v132),
        v137 = getMediaClipClipId(v132, v133, v134),
        v138 = v103(v137, v136, v134),
        v139 = v100["length"] === 1 ? v98["tracks"]?.["video"] : null,
        v140 = v138["length"] ? v138 : [v139];
      v140["forEach"]((v141, v142) => {
        const v143 = getMediaClipInputKind(v141) === "image" ? "image" : "",
          v144 = normalizeTrack(v141, v132, v143 || v135);
        if (!v144) return;
        v131["push"]({
          id:
            normalizeText(v141?.["id"]) ||
            (v142 === 0 ? v137 : v137 + ":clip:" + v142),
          kind: v135,
          sourceId: v136,
          sourceKey: v134,
          startSec: v144["startSec"],
          endSec: v144["endSec"],
          durationSec: v144["durationSec"],
          timelineStartSec: v141?.["timelineStartSec"],
          timelineEndSec: v141?.["timelineEndSec"],
        });
      });
    }),
    recomputeVideoClipTimeline(v131)
  );
}
function normalizeAudioClips(v145 = {}, v146 = []) {
  const v147 = normalizeSourceList(v146),
    v148 = Array["isArray"](v145["audioClips"]) ? v145["audioClips"] : [],
    v149 =
      !v148["length"] && v145["tracks"]?.["audio"]
        ? [
            {
              id: "audio:0",
              kind: "audio",
              sourceKey: v145["tracks"]["audio"]["sourceKey"],
              startSec: v145["tracks"]["audio"]["startSec"],
              endSec: v145["tracks"]["audio"]["endSec"],
              durationSec: v145["tracks"]["audio"]["durationSec"],
              timelineStartSec: v145["tracks"]["audio"]["startSec"],
              timelineEndSec: v145["tracks"]["audio"]["endSec"],
            },
          ]
        : [],
    v150 = v148["length"] ? v148 : v149,
    v151 = new Set(),
    v152 = (v153, v154, v155) => {
      const v156 = normalizeText(v153),
        v157 = normalizeText(v154),
        v158 = normalizeText(v155),
        v159 = v150["map"]((v160, v161) => ({ clip: v160, index: v161 }))[
          "filter"
        ](
          ({ clip: v162, index: v163 }) =>
            !v151["has"](v163) && v156 && normalizeText(v162?.["id"]) === v156,
        );
      if (v159["length"])
        return (
          v159["forEach"](({ index: v164 }) => v151["add"](v164)),
          v159["map"](({ clip: v165 }) => v165)
        );
      const v166 = v150["map"]((v167, v168) => ({ clip: v167, index: v168 }))[
        "filter"
      ](
        ({ clip: v169, index: v170 }) =>
          !v151["has"](v170) &&
          v157 &&
          normalizeText(v169?.["sourceId"]) === v157,
      );
      if (v166["length"])
        return (
          v166["forEach"](({ index: v171 }) => v151["add"](v171)),
          v166["map"](({ clip: v172 }) => v172)
        );
      const v173 = v150["map"]((v174, v175) => ({ clip: v174, index: v175 }))[
        "filter"
      ](
        ({ clip: v176, index: v177 }) =>
          !v151["has"](v177) &&
          v158 &&
          normalizeText(v176?.["sourceKey"]) === v158,
      );
      if (v173["length"])
        return (
          v173["forEach"](({ index: v178 }) => v151["add"](v178)),
          v173["map"](({ clip: v179 }) => v179)
        );
      return [];
    },
    v180 = [];
  let v181 = v150["reduce"](
    (v182, v183) => Math["max"](v182, toNumber(v183?.["timelineEndSec"], 0)),
    0,
  );
  return (
    v147["forEach"]((v184, v185) => {
      const v186 = resolveMediaClipSourceKey(v184);
      if (!v186) return;
      const v187 = getMediaClipSourceId(v184),
        v188 = getMediaClipClipId(v184, v185, v186),
        v189 = v152(v188, v187, v186),
        v190 = v147["length"] === 1 ? v145["tracks"]?.["audio"] : null,
        v191 = v189["length"] ? v189 : [v190];
      v191["forEach"]((v192, v193) => {
        const v194 = normalizeTrack(v192, v184, "audio");
        if (!v194) return;
        const v195 = roundSec(
            Math["max"](MIN_RANGE_SEC, v194["endSec"] - v194["startSec"]),
          ),
          v196 = Number["isFinite"](Number(v192?.["timelineStartSec"])),
          v197 = roundSec(v196 ? v192["timelineStartSec"] : v181),
          v198 = roundSec(v197 + v195);
        (v180["push"]({
          id:
            normalizeText(v192?.["id"]) ||
            (v193 === 0 ? v188 : v188 + ":clip:" + v193),
          kind: "audio",
          sourceId: v187,
          sourceKey: v186,
          startSec: v194["startSec"],
          endSec: v194["endSec"],
          durationSec: v194["durationSec"],
          timelineStartSec: v197,
          timelineEndSec: v198,
        }),
          (v181 = Math["max"](v181, v198)));
      });
    }),
    normalizeAudioClipTimeline(v180)
  );
}
function buildVideoTrackFromClips(v199 = []) {
  if (!v199["length"]) return null;
  const v200 = roundSec(
    v199["reduce"](
      (v201, v202) => Math["max"](v201, toNumber(v202["timelineEndSec"], 0)),
      0,
    ),
  );
  if (v199["length"] === 1) {
    const v203 = v199[0];
    return {
      sourceKey: v203["sourceKey"],
      startSec: v203["startSec"],
      endSec: v203["endSec"],
      durationSec: Math["max"](toNumber(v203["durationSec"], 0), v200),
    };
  }
  return {
    sourceKey: v199["map"]((v204) => v204["sourceKey"])["join"]("|"),
    startSec: 0,
    endSec: v200,
    durationSec: v200,
  };
}
function buildAudioTrackFromClips(v205 = []) {
  if (!v205["length"]) return null;
  const v206 = roundSec(
    v205["reduce"](
      (v207, v208) => Math["max"](v207, toNumber(v208["timelineEndSec"], 0)),
      0,
    ),
  );
  if (v205["length"] === 1) {
    const v209 = v205[0];
    return {
      sourceKey: v209["sourceKey"],
      startSec: v209["startSec"],
      endSec: v209["endSec"],
      durationSec: Math["max"](toNumber(v209["durationSec"], 0), v206),
    };
  }
  return {
    sourceKey: v205["map"]((v210) => v210["sourceKey"])["join"]("|"),
    startSec: 0,
    endSec: v206,
    durationSec: v206,
  };
}
function buildMediaClipFromVideoClips(v211 = {}, v212 = []) {
  const v213 = recomputeVideoClipTimeline(v212);
  return {
    ...v211,
    activeTrack: "video",
    clips: v213,
    tracks: {
      ...(v211["tracks"] || {}),
      video: buildVideoTrackFromClips(v213),
    },
  };
}
function buildMediaClipFromPositionedVideoClips(v214 = {}, v215 = []) {
  const v216 = v215["map"]((v217, v218) => {
    if (!v217 || typeof v217 !== "object") return null;
    const v219 = normalizeText(v217["sourceKey"]);
    if (!v219) return null;
    const v220 = clampMediaClipRange(v217, v217["durationSec"]),
      v221 = roundSec(
        Math["max"](MIN_RANGE_SEC, v220["endSec"] - v220["startSec"]),
      ),
      v222 = roundSignedSec(v217["timelineStartSec"]);
    return {
      ...v217,
      id: normalizeText(v217["id"]) || "clip:" + v218,
      sourceKey: v219,
      startSec: v220["startSec"],
      endSec: v220["endSec"],
      durationSec: v220["durationSec"],
      timelineStartSec: v222,
      timelineEndSec: roundSignedSec(v222 + v221),
    };
  })["filter"](Boolean);
  return {
    ...v214,
    activeTrack: "video",
    clips: v216,
    tracks: {
      ...(v214["tracks"] || {}),
      video: buildVideoTrackFromClips(v216),
    },
  };
}
function buildMediaClipFromAudioClips(v223 = {}, v224 = []) {
  const v225 = normalizeAudioClipTimeline(v224);
  return {
    ...v223,
    activeTrack: "audio",
    audioClips: v225,
    tracks: {
      ...(v223["tracks"] || {}),
      audio: buildAudioTrackFromClips(v225),
    },
  };
}
export function patchMediaClipClipRange(v226 = {}, v227 = 0, v228 = {}) {
  const v229 = Array["isArray"](v226["clips"]) ? v226["clips"] : [],
    v230 = Math["max"](0, Math["trunc"](toNumber(v227, 0))),
    v231 = v229[v230];
  if (!v231) return v226;
  const v232 = clampMediaClipRange({ ...v231, ...v228 }, v231["durationSec"]),
    v233 = v229["map"]((v234, v235) =>
      v235 === v230
        ? {
            ...v234,
            startSec: v232["startSec"],
            endSec: v232["endSec"],
            durationSec: v231["durationSec"],
          }
        : v234,
    );
  return buildMediaClipFromVideoClips(v226, v233);
}
export function rollMediaClipVisualLeftTrim(
  v236 = {},
  v237 = 0,
  v238 = {},
  v239 = {},
) {
  const v240 = Array["isArray"](v236["clips"]) ? v236["clips"] : [],
    v241 = Math["max"](0, Math["trunc"](toNumber(v237, 0))),
    v242 = v240[v241],
    v243 = v240[v241 - 1];
  if (!v242) return v236;
  if (!v243 || v241 <= 0) return patchMediaClipClipRange(v236, v241, v238);
  const v244 = clampMediaClipRange({ ...v242, ...v238 }, v242["durationSec"]),
    v245 = roundSec(v242["startSec"]),
    v246 = roundSec(v242["endSec"]),
    v247 = roundSignedSec(
      v243["timelineEndSec"] ??
        roundSignedSec(v243["timelineStartSec"]) +
          Math["max"](0, roundSec(v243["endSec"]) - roundSec(v243["startSec"])),
    ),
    v248 = roundSignedSec(v244["startSec"] - v245),
    v249 = -v245,
    v250 = v246 - MIN_RANGE_SEC - v245,
    v251 = roundSignedSec(Math["max"](v249, Math["min"](v250, v248))),
    v252 = roundSec(v245 + v251),
    v253 = roundSignedSec(v247 + v251),
    v254 = (v255 = {}) => {
      const v256 = clampMediaClipRange(v255, v255["durationSec"]);
      return roundSec(
        Math["max"](MIN_RANGE_SEC, v256["endSec"] - v256["startSec"]),
      );
    };
  let v257 = 0,
    v258 = v240["map"]((v259, v260) => {
      if (v260 < v241) {
        const v261 = {
          ...v259,
          timelineStartSec: roundSignedSec(
            toNumber(v259["timelineStartSec"], 0) + v251,
          ),
          timelineEndSec: roundSignedSec(
            toNumber(v259["timelineEndSec"], 0) + v251,
          ),
        };
        return ((v257 = v261["timelineEndSec"]), v261);
      }
      if (v260 === v241) {
        const v262 = {
          ...v259,
          startSec: v252,
          endSec: v246,
          durationSec: v242["durationSec"],
          timelineStartSec: v253,
          timelineEndSec: roundSignedSec(
            v253 + Math["max"](MIN_RANGE_SEC, v246 - v252),
          ),
        };
        return ((v257 = v262["timelineEndSec"]), v262);
      }
      const v263 = v254(v259),
        v264 = roundSignedSec(v257),
        v265 = {
          ...v259,
          timelineStartSec: v264,
          timelineEndSec: roundSignedSec(v264 + v263),
        };
      return ((v257 = v265["timelineEndSec"]), v265);
    });
  if (
    v239["rebaseNegativeTimeline"] === true ||
    v239["rebaseTimelineStart"] === true
  ) {
    const v266 = roundSignedSec(
      v258["reduce"](
        (v267, v268) =>
          Math["min"](v267, roundSignedSec(v268?.["timelineStartSec"])),
        Number["POSITIVE_INFINITY"],
      ),
    );
    if (
      Number["isFinite"](v266) &&
      (v266 < 0 ||
        (v239["rebaseTimelineStart"] === true && Math["abs"](v266) > 0.001))
    ) {
      const v269 = -v266;
      v258 = v258["map"]((v270) => ({
        ...v270,
        timelineStartSec: roundSignedSec(
          toNumber(v270["timelineStartSec"], 0) + v269,
        ),
        timelineEndSec: roundSignedSec(
          toNumber(v270["timelineEndSec"], 0) + v269,
        ),
      }));
    }
  }
  return buildMediaClipFromPositionedVideoClips(v236, v258);
}
export function patchMediaClipAudioClipRange(v271 = {}, v272 = 0, v273 = {}) {
  const v274 = Array["isArray"](v271["audioClips"]) ? v271["audioClips"] : [],
    v275 = Math["max"](0, Math["trunc"](toNumber(v272, 0))),
    v276 = v274[v275];
  if (!v276) return v271;
  const v277 = clampMediaClipRange({ ...v276, ...v273 }, v276["durationSec"]),
    v278 = roundSec(
      Math["max"](MIN_RANGE_SEC, v277["endSec"] - v277["startSec"]),
    ),
    v279 = Object["prototype"]["hasOwnProperty"]["call"](v273, "startSec")
      ? v277["startSec"] - roundSec(v276["startSec"])
      : 0,
    v280 = roundSec(
      Math["max"](0, toNumber(v276["timelineStartSec"], 0) + v279),
    ),
    v281 = v274["map"]((v282, v283) =>
      v283 === v275
        ? {
            ...v282,
            startSec: v277["startSec"],
            endSec: v277["endSec"],
            durationSec: v276["durationSec"],
            timelineStartSec: v280,
            timelineEndSec: roundSec(v280 + v278),
          }
        : v282,
    );
  return buildMediaClipFromAudioClips(v271, v281);
}
export function shiftMediaClipClipRange(v284 = {}, v285 = 0, v286 = 0) {
  const v287 = Array["isArray"](v284["clips"]) ? v284["clips"] : [],
    v288 = Math["max"](0, Math["trunc"](toNumber(v285, 0))),
    v289 = v287[v288];
  if (!v289) return v284;
  const v290 = Math["max"](0, toNumber(v289["durationSec"], 0)),
    v291 = roundSec(v289["startSec"]),
    v292 = roundSec(v289["endSec"]),
    v293 = Math["max"](MIN_RANGE_SEC, v292 - v291),
    v294 = toNumber(v286, 0),
    v295 = v290 > 0 ? Math["max"](0, v290 - v293) : v291 + v294,
    v296 = roundSec(Math["max"](0, Math["min"](v295, v291 + v294))),
    v297 = roundSec(v290 > 0 ? Math["min"](v290, v296 + v293) : v296 + v293);
  return patchMediaClipClipRange(v284, v288, { startSec: v296, endSec: v297 });
}
export function moveMediaClipAudioClipOnTimeline(
  v298 = {},
  v299 = 0,
  v300 = 0,
) {
  const v301 = Array["isArray"](v298["audioClips"]) ? v298["audioClips"] : [],
    v302 = Math["max"](0, Math["trunc"](toNumber(v299, 0))),
    v303 = v301[v302];
  if (!v303) return v298;
  const v304 = roundSec(v303["timelineStartSec"]),
    v305 = roundSec(v303["timelineEndSec"]),
    v306 = roundSec(Math["max"](MIN_RANGE_SEC, v305 - v304)),
    v307 = roundSec(Math["max"](0, v304 + toNumber(v300, 0))),
    v308 = v301["map"]((v309, v310) =>
      v310 === v302
        ? {
            ...v309,
            timelineStartSec: v307,
            timelineEndSec: roundSec(v307 + v306),
          }
        : v309,
    );
  return buildMediaClipFromAudioClips(v298, v308);
}
export function moveMediaClipClipOnTimeline(v311 = {}, v312 = 0, v313 = 0) {
  const v314 = Array["isArray"](v311["clips"]) ? v311["clips"] : [],
    v315 = Math["max"](0, Math["trunc"](toNumber(v312, 0))),
    v316 = v314[v315];
  if (!v316) return v311;
  const v317 = roundSec(v316["timelineStartSec"]),
    v318 = roundSec(v316["timelineEndSec"]),
    v319 = roundSec(Math["max"](MIN_RANGE_SEC, v318 - v317)),
    v320 = roundSec(v317 + toNumber(v313, 0) + v319 / 2),
    v321 = v314["filter"]((v322, v323) => v323 !== v315),
    v324 = v321["findIndex"]((v325) => {
      const v326 = roundSec(v325["timelineStartSec"]),
        v327 = roundSec(v325["timelineEndSec"] || v326),
        v328 = roundSec(v326 + Math["max"](MIN_RANGE_SEC, v327 - v326) / 2);
      return v320 < v328;
    }),
    v329 = [...v321];
  return (
    v329["splice"](v324 >= 0 ? v324 : v329["length"], 0, v316),
    buildMediaClipFromVideoClips(v311, v329)
  );
}
export function removeMediaClipAudioClip(v330 = {}, v331 = 0) {
  const v332 = Array["isArray"](v330["audioClips"]) ? v330["audioClips"] : [],
    v333 = Math["max"](0, Math["trunc"](toNumber(v331, 0)));
  if (!v332[v333]) return v330;
  const v334 = v332["filter"]((v335, v336) => v336 !== v333);
  return buildMediaClipFromAudioClips(v330, v334);
}
export function removeMediaClipClip(v337 = {}, v338 = 0) {
  const v339 = Array["isArray"](v337["clips"]) ? v337["clips"] : [],
    v340 = Math["max"](0, Math["trunc"](toNumber(v338, 0)));
  if (!v339[v340]) return v337;
  const v341 = v339["filter"]((v342, v343) => v343 !== v340);
  return buildMediaClipFromVideoClips(v337, v341);
}
export function splitMediaClipAtTimelineSec(v344 = {}, v345 = 0, v346 = "") {
  const v347 = Array["isArray"](v344["clips"]) ? v344["clips"] : [];
  if (!v347["length"]) return v344;
  const v348 = roundSec(v345),
    v349 = v347["findIndex"]((v350) => {
      const v351 = roundSec(v350["timelineStartSec"]),
        v352 = roundSec(v350["timelineEndSec"]);
      return v348 > v351 + MIN_RANGE_SEC && v348 < v352 - MIN_RANGE_SEC;
    });
  if (v349 < 0) return v344;
  const v353 = v347[v349],
    v354 = roundSec(v353["timelineStartSec"]),
    v355 = roundSec(v353["startSec"]),
    v356 = roundSec(v353["endSec"]),
    v357 = roundSec(v355 + (v348 - v354));
  if (v357 <= v355 + MIN_RANGE_SEC || v357 >= v356 - MIN_RANGE_SEC) return v344;
  const v358 = normalizeText(v346),
    v359 =
      (normalizeText(v353["id"]) || "clip:" + v349) +
      ":split:" +
      v357 +
      (v358 ? ":" + v358 : ""),
    v360 = [
      ...v347["slice"](0, v349),
      { ...v353, endSec: v357, timelineStartSec: v354, timelineEndSec: v348 },
      {
        ...v353,
        id: v359,
        startSec: v357,
        timelineStartSec: v348,
        timelineEndSec: roundSec(
          v353["timelineEndSec"] || v354 + (v356 - v355),
        ),
      },
      ...v347["slice"](v349 + 1),
    ];
  return buildMediaClipFromVideoClips(v344, v360);
}
export function splitMediaClipAudioAtTimelineSec(
  v361 = {},
  v362 = 0,
  v363 = "",
) {
  const v364 = Array["isArray"](v361["audioClips"]) ? v361["audioClips"] : [];
  if (!v364["length"]) return v361;
  const v365 = roundSec(v362),
    v366 = v364["findIndex"]((v367) => {
      const v368 = roundSec(v367["timelineStartSec"]),
        v369 = roundSec(v367["timelineEndSec"]);
      return v365 > v368 + MIN_RANGE_SEC && v365 < v369 - MIN_RANGE_SEC;
    });
  if (v366 < 0) return v361;
  const v370 = v364[v366],
    v371 = roundSec(v370["timelineStartSec"]),
    v372 = roundSec(v370["startSec"]),
    v373 = roundSec(v370["endSec"]),
    v374 = roundSec(v372 + (v365 - v371));
  if (v374 <= v372 + MIN_RANGE_SEC || v374 >= v373 - MIN_RANGE_SEC) return v361;
  const v375 = normalizeText(v363),
    v376 =
      (normalizeText(v370["id"]) || "audio:" + v366) +
      ":split:" +
      v374 +
      (v375 ? ":" + v375 : ""),
    v377 = [
      ...v364["slice"](0, v366),
      { ...v370, endSec: v374, timelineStartSec: v371, timelineEndSec: v365 },
      {
        ...v370,
        id: v376,
        startSec: v374,
        timelineStartSec: v365,
        timelineEndSec: roundSec(
          v370["timelineEndSec"] || v371 + (v373 - v372),
        ),
      },
      ...v364["slice"](v366 + 1),
    ];
  return buildMediaClipFromAudioClips(v361, v377);
}
export function normalizeMediaClipState(v378 = {}, v379 = {}) {
  const v380 =
      v378["mediaClip"] && typeof v378["mediaClip"] === "object"
        ? v378["mediaClip"]
        : {},
    v381 = normalizeSourceList(v379["videos"] || v379["video"]),
    v382 = normalizeSourceList(v379["audios"] || v379["audio"]),
    v383 = normalizeVideoClips(v380, v381),
    v384 = buildVideoTrackFromClips(v383),
    v385 = normalizeAudioClips(v380, v382),
    v386 = buildAudioTrackFromClips(v385);
  let v387 = v380["activeTrack"] === "audio" ? "audio" : "video";
  if (v387 === "video" && !v384 && v386) v387 = "audio";
  if (v387 === "audio" && !v386 && v384) v387 = "video";
  if (!v384 && !v386) v387 = "video";
  return {
    schemaVersion: MEDIA_CLIP_SCHEMA_VERSION,
    expanded: v380["expanded"] === true,
    activeTrack: v387,
    cropMode: v380["cropMode"] === true,
    timelineView: normalizeMediaClipTimelineView(v380["timelineView"]),
    clips: v383,
    audioClips: v385,
    tracks: { video: v384, audio: v386 },
    lastOutput:
      v380["lastOutput"] && typeof v380["lastOutput"] === "object"
        ? { ...v380["lastOutput"] }
        : null,
  };
}
export function buildMediaClipIncomingSignature(v388 = {}, v389 = "") {
  const v390 = normalizeText(v389);
  if (!v390) return "";
  const v391 = v388["nodes"] || {};
  return Object["values"](v388["edges"] || {})
    ["filter"]((v392) => normalizeText(v392?.["targetId"]) === v390)
    ["map"]((v393) => {
      const v394 = normalizeText(v393?.["sourceId"]),
        v395 = v391[v394] || {},
        v396 = getMediaClipInputKind(v395),
        v397 = resolveMediaClipSourceKey(v395),
        v398 = v396 ? resolveMediaClipDurationSec(v395, v396) : 0,
        v399 = Number["isFinite"](v395?.["_bizRev"]) ? v395["_bizRev"] : 0;
      return [
        normalizeText(v393?.["id"]),
        v394,
        v396,
        v397,
        roundSec(v398),
        v399,
      ]["join"](":");
    })
    ["join"]("|");
}
export function patchMediaClipTrackRange(v400 = {}, v401 = "video", v402 = {}) {
  const v403 = v400?.["tracks"]?.[v401];
  if (!v403) return v400;
  const v404 = clampMediaClipRange({ ...v403, ...v402 }, v403["durationSec"]);
  return {
    ...v400,
    activeTrack: v401,
    tracks: { ...(v400["tracks"] || {}), [v401]: { ...v403, ...v404 } },
  };
}
export function shiftMediaClipTrackRange(v405 = {}, v406 = "video", v407 = 0) {
  const v408 = v405?.["tracks"]?.[v406];
  if (!v408) return v405;
  const v409 = Math["max"](0, toNumber(v408["durationSec"], 0)),
    v410 = roundSec(v408["startSec"]),
    v411 = roundSec(v408["endSec"]),
    v412 = Math["max"](MIN_RANGE_SEC, v411 - v410),
    v413 = toNumber(v407, 0),
    v414 = v409 > 0 ? Math["max"](0, v409 - v412) : v410 + v413,
    v415 = roundSec(Math["max"](0, Math["min"](v414, v410 + v413))),
    v416 = roundSec(v409 > 0 ? Math["min"](v409, v415 + v412) : v415 + v412);
  return patchMediaClipTrackRange(v405, v406, { startSec: v415, endSec: v416 });
}
export function mapMediaClipVideoSecToAudioSec(
  v417 = 0,
  v418 = null,
  v419 = null,
) {
  if (!v418 || !v419) return null;
  const v420 = roundSec(v418["startSec"]),
    v421 = roundSec(v419["startSec"]),
    v422 = roundSec(v419["endSec"]),
    v423 = Math["round"]((toNumber(v417, 0) - v420) * 1000) / 1000;
  if (v423 < 0 || !(v422 > v421)) return null;
  const v424 = roundSec(v421 + v423);
  if (v424 > v422) return null;
  return Math["max"](v421, Math["min"](v422, v424));
}
function normalizeMediaClipExportVideoClips(v425 = []) {
  if (!Array["isArray"](v425)) return [];
  return v425["map"]((v426) => {
    if (!v426 || typeof v426 !== "object") return null;
    const v427 = normalizeText(
      v426["sourceKey"] || v426["src"] || v426["localPath"] || v426["path"],
    );
    if (!v427) return null;
    const v428 = roundSec(v426["startSec"] ?? v426["start"] ?? 0),
      v429 = Math["max"](
        0,
        toNumber(v426["durationSec"] ?? v426["duration"], 0),
      ),
      v430 = roundSec(
        v426["endSec"] ?? v426["end"] ?? (v429 > 0 ? v428 + v429 : v428),
      );
    if (!(v430 > v428)) return null;
    return {
      sourceKey: v427,
      src: v427,
      kind: normalizeText(v426["kind"]) === "image" ? "image" : "video",
      startSec: v428,
      endSec: v430,
      durationSec: roundSec(v430 - v428),
    };
  })["filter"](Boolean);
}
function sumMediaClipExportClipDuration(v431 = []) {
  return roundSec(
    v431["reduce"](
      (v432, v433) =>
        v432 +
        Math["max"](0, roundSec(v433["endSec"]) - roundSec(v433["startSec"])),
      0,
    ),
  );
}
export function buildMediaClipExportSignature({
  videoSourceKey: videoSourceKey = "",
  audioSourceKey: audioSourceKey = "",
  videoTrack: videoTrack = null,
  audioTrack: audioTrack = null,
  videoClips: videoClips = null,
} = {}) {
  const v434 = [],
    v435 = normalizeMediaClipExportVideoClips(videoClips);
  if (v435["length"])
    v435["forEach"]((v436) => {
      v434["push"](
        "v:" +
          v436["sourceKey"] +
          ":" +
          roundSec(v436["startSec"]) +
          ":" +
          roundSec(v436["endSec"]),
      );
    });
  else
    videoTrack &&
      videoSourceKey &&
      v434["push"](
        "v:" +
          videoSourceKey +
          ":" +
          roundSec(videoTrack["startSec"]) +
          ":" +
          roundSec(videoTrack["endSec"]),
      );
  return (
    audioTrack &&
      audioSourceKey &&
      v434["push"](
        "a:" +
          audioSourceKey +
          ":" +
          roundSec(audioTrack["startSec"]) +
          ":" +
          roundSec(audioTrack["endSec"]),
      ),
    v434["join"]("|")
  );
}
export function buildMediaClipExportPayload({
  videoSource: videoSource = null,
  audioSource: audioSource = null,
  videoTrack: videoTrack = null,
  audioTrack: audioTrack = null,
  videoClips: videoClips = null,
} = {}) {
  const v437 = normalizeMediaClipExportVideoClips(videoClips),
    v438 =
      v437["length"] > 1 || v437["some"]((v439) => v439["kind"] === "image"),
    v440 = v437["find"]((v441) => v441["kind"] === "video") || v437[0] || null,
    v442 = v437["length"] === 1 ? v437[0] : null,
    v443 =
      v440?.["sourceKey"] ||
      (videoTrack ? resolveMediaClipSourceKey(videoSource) : ""),
    v444 = audioTrack ? resolveMediaClipSourceKey(audioSource) : "",
    v445 = buildMediaClipExportSignature({
      videoSourceKey: v443,
      audioSourceKey: v444,
      videoTrack: v442 || videoTrack,
      audioTrack: audioTrack,
      videoClips: v438 ? v437 : null,
    });
  if (v438 && v443) {
    const v446 = sumMediaClipExportClipDuration(v437),
      v447 = v437["map"]((v448) => ({
        src: v448["sourceKey"],
        sourceKey: v448["sourceKey"],
        kind: v448["kind"],
        start: roundSec(v448["startSec"]),
        end: roundSec(v448["endSec"]),
      }));
    return {
      outputType: "video",
      signature: v445,
      electronPayload: {
        kind: "mediaClipExport",
        src: v443,
        args: {
          clips: v447,
          duration: v446,
          ...(audioTrack && v444
            ? {
                audioSrc: v444,
                audioStart: roundSec(audioTrack["startSec"]),
                audioEnd: roundSec(audioTrack["endSec"]),
              }
            : {}),
        },
      },
      backendBody: {
        src: v443,
        clips: v447,
        duration: v446,
        ...(audioTrack && v444
          ? {
              audioSrc: v444,
              audioStart: roundSec(audioTrack["startSec"]),
              audioEnd: roundSec(audioTrack["endSec"]),
            }
          : {}),
      },
    };
  }
  const v449 = v442 || videoTrack,
    v450 = v442?.["sourceKey"] || v443;
  if (v449 && v450)
    return {
      outputType: "video",
      signature: v445,
      electronPayload: {
        kind: "mediaClipExport",
        src: v450,
        args: {
          videoStart: roundSec(v449["startSec"]),
          videoEnd: roundSec(v449["endSec"]),
          ...(audioTrack && v444
            ? {
                audioSrc: v444,
                audioStart: roundSec(audioTrack["startSec"]),
                audioEnd: roundSec(audioTrack["endSec"]),
              }
            : {}),
        },
      },
      backendBody: {
        src: v450,
        start: roundSec(v449["startSec"]),
        end: roundSec(v449["endSec"]),
        ...(audioTrack && v444
          ? {
              audioSrc: v444,
              audioStart: roundSec(audioTrack["startSec"]),
              audioEnd: roundSec(audioTrack["endSec"]),
            }
          : {}),
      },
    };
  if (audioTrack && v444)
    return {
      outputType: "audio",
      signature: v445,
      electronPayload: {
        kind: "audioCut",
        src: v444,
        args: {
          start: roundSec(audioTrack["startSec"]),
          end: roundSec(audioTrack["endSec"]),
        },
      },
      backendBody: {
        src: v444,
        start: roundSec(audioTrack["startSec"]),
        end: roundSec(audioTrack["endSec"]),
      },
    };
  return null;
}
