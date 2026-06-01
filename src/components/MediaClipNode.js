import { runLocalMediaClipExport } from "../../api/localMediaTaskApi.js";
import { buildApiUrl } from "../../api/apiBase.js";
import appStore from "../core/stores/appStore.js";
import { generateId } from "../core/math.js";
import { commit } from "../modules/history.js";
import {
  buildSourceAudioNodePayload,
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from "../services/fileService.js";
import {
  resolveCanvasAudioUrl,
  resolveCanvasImagePreviewUrl,
  resolveCanvasImageSourceUrl,
  resolveCanvasVideoUrl,
} from "../services/canvasMediaLocalService.js";
import { calcSafeSpawnPosNearNode } from "../modules/nodeSpawn.js";
import { attachMediaElementPlaybackSource } from "../services/desktopMediaBlobSource.js";
import {
  localPathToUrl,
  pickResultLocalPath,
} from "../utils/localMediaPath.js";
import {
  getWaveformBarsPathFromPersistedUrl,
  getWaveformBarsPathFromUrl,
} from "../utils/audioWaveform.js";
import {
  MEDIA_CLIP_COMPACT_SIZE,
  MEDIA_CLIP_TIMELINE_ZOOM_MAX,
  MEDIA_CLIP_TIMELINE_ZOOM_MIN,
  buildMediaClipExportPayload,
  buildMediaClipIncomingSignature,
  clampMediaClipRange,
  getMediaClipInputKind,
  mapMediaClipVideoSecToAudioSec,
  moveMediaClipAudioClipOnTimeline,
  moveMediaClipClipOnTimeline,
  normalizeMediaClipTimelineView,
  normalizeMediaClipState,
  patchMediaClipAudioClipRange,
  patchMediaClipClipRange,
  patchMediaClipTrackRange,
  removeMediaClipAudioClip,
  removeMediaClipClip,
  resolveMediaClipDimensions,
  resolveMediaClipSourceKey,
  rollMediaClipVisualLeftTrim,
  shiftMediaClipTrackRange,
  splitMediaClipAudioAtTimelineSec,
  splitMediaClipAtTimelineSec,
} from "./media-clip/mediaClipState.js";
import {
  MEDIA_CLIP_TIMELINE_ADD_SLOT_WIDTH_PX,
  buildMediaClipTimelineTicks,
  getMediaClipFrameCount,
  getMediaClipTimelineAddSlotLeftPx,
  getMediaClipTimelineContentWidthPx,
  getMediaClipTimelineDeltaSecFromPx,
  getMediaClipTimelineDisplayDuration,
  getMediaClipTimelineNextZoom,
  getMediaClipTimelinePercent,
  getMediaClipTimelinePlayheadModel,
  getMediaClipTimelineRangeRect,
  getMediaClipTimelineSecFromClientX,
  getMediaClipTimelineTrackWidthPx,
  getMediaClipTimelineZoomScrollLeft,
  shouldLockMediaClipTimelineWheelScroll,
} from "./media-clip/mediaClipTimelineModel.js";
const TIMELINE_VIEW_PERSIST_DELAY_MS = 180,
  TIMELINE_SETTLE_ANIMATION_MS = 360,
  PREVIEW_SCRUB_SEEK_EPSILON_SEC = 0.04,
  TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX = 48,
  TIMELINE_DRAG_AUTO_SCROLL_MAX_PX = 18,
  TIMELINE_ZOOM_OUT_DISPLAY_MULTIPLIER = 4,
  MEDIA_CLIP_DELETE_MATERIAL_EVENT = "media-clip-delete-material",
  MEDIA_CLIP_WAVEFORM_WIDTH = 200,
  MEDIA_CLIP_WAVEFORM_HEIGHT = 80,
  MEDIA_CLIP_WAVEFORM_SAMPLES = 190,
  SVG_NS = "http://www.w3.org/2000/svg",
  MEDIA_CLIP_EXPANDED_HOST_Z_INDEX = "12000";
let activeExpandedMediaClipNode = null;
export {
  getMediaClipFrameCount,
  getMediaClipTimelineAddSlotLeftPx,
  getMediaClipTimelineContentWidthPx,
  getMediaClipTimelineDisplayDuration,
  shouldLockMediaClipTimelineWheelScroll,
} from "./media-clip/mediaClipTimelineModel.js";
function normalizeText(v0) {
  return String(v0 || "")["trim"]();
}
function firstNonEmpty(...v1) {
  for (const v2 of v1) {
    const v3 = normalizeText(v2);
    if (v3) return v3;
  }
  return "";
}
function toNumber(v4, v5 = 0) {
  const v6 = Number(v4);
  return Number["isFinite"](v6) ? v6 : v5;
}
function parsePercentValue(v7, v8 = NaN) {
  const v9 = String(v7 ?? "")["trim"]();
  if (!v9) return v8;
  const v10 = v9["endsWith"]("%") ? v9["slice"](0, -1) : v9,
    v11 = Number(v10);
  return Number["isFinite"](v11) ? v11 : v8;
}
function readLayoutWidthPx(v12, v13 = 0) {
  const v14 = toNumber(v12?.["offsetWidth"], 0);
  if (v14 > 0) return v14;
  const v15 = toNumber(v12?.["clientWidth"], 0);
  if (v15 > 0) return v15;
  const v16 = Number["parseFloat"](String(v12?.["style"]?.["width"] || ""));
  if (Number["isFinite"](v16) && v16 > 0) return v16;
  return toNumber(v12?.["getBoundingClientRect"]?.()["width"], v13);
}
function formatTime(v17) {
  const v18 = Math["max"](0, toNumber(v17, 0)),
    v19 = Math["floor"](v18 / 60),
    v20 = Math["floor"](v18 % 60);
  return (
    String(v19)["padStart"](2, "0") + ":" + String(v20)["padStart"](2, "0")
  );
}
function formatDurationLabel(v21) {
  const v22 = Math["max"](0, toNumber(v21, 0));
  return v22["toFixed"](2) + "s";
}
function isSameMediaClipState(v23, v24) {
  return JSON["stringify"](v23 || null) === JSON["stringify"](v24 || null);
}
function getTrackDuration(v25) {
  return Math["max"](
    0.1,
    toNumber(v25?.["durationSec"] || v25?.["endSec"], 0.1),
  );
}
function stopPointer(v26) {
  if (!v26) return;
  (v26["preventDefault"]?.(), v26["stopPropagation"]?.());
}
function makeButton(v27, v28, v29) {
  const v30 = document["createElement"]("button");
  return (
    (v30["type"] = "button"),
    (v30["className"] = v27),
    (v30["title"] = v28),
    v30["setAttribute"]("aria-label", v28),
    (v30["textContent"] = v29),
    v30
  );
}
function iconButton(v31, v32, v33) {
  const v34 = document["createElement"]("button");
  return (
    (v34["type"] = "button"),
    (v34["className"] = v31),
    (v34["title"] = v32),
    v34["setAttribute"]("aria-label", v32),
    (v34["innerHTML"] =
      '\n    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n      ' +
      v33 +
      "\n    </svg>\n  "),
    v34
  );
}
function createConnectCursorIcon() {
  const v35 = document["createElementNS"]("http://www.w3.org/2000/svg", "svg");
  return (
    v35["setAttribute"]("class", "media-clip-connect-icon"),
    v35["setAttribute"]("viewBox", "0\x200\x2024\x2024"),
    v35["setAttribute"]("aria-hidden", "true"),
    (v35["innerHTML"] =
      "\x0a\x20\x20\x20\x20<path\x20class=\x22media-clip-connect-cursor\x22\x20d=\x22M4\x204l7.07\x2016.97\x202.51-7.39\x207.39-2.51L4\x204z\x22\x20/>\x0a\x20\x20\x20\x20<circle\x20class=\x22media-clip-connect-dot\x22\x20cx=\x2220\x22\x20cy=\x2220\x22\x20r=\x222.5\x22\x20/>\x0a\x20\x20\x20\x20<path\x20class=\x22media-clip-connect-line\x22\x20d=\x22M12\x2012\x20Q\x2017\x2012\x2019\x2018\x22\x20stroke-dasharray=\x223\x203\x22\x20/>\x0a\x20\x20"),
    v35
  );
}
function downloadLocalPath(v36, v37 = "") {
  const v38 = normalizeText(v36);
  if (!v38) return;
  const v39 = document["createElement"]("a");
  ((v39["href"] = localPathToUrl(v38) || "/" + v38["replace"](/^\/+/, "")),
    (v39["download"] = v37 || v38["split"](/[\\/]/)["pop"]() || "clip"),
    (v39["rel"] = "noopener"),
    document["body"]["appendChild"](v39),
    v39["click"](),
    v39["remove"]());
}
function isRenderableUrl(v40) {
  const v41 = normalizeText(v40);
  return /^(?:https?:|data:|blob:|aic-local-preview:|\/)/i["test"](v41);
}
function isUsableMediaElement(v42) {
  if (!v42) return false;
  try {
    const v43 = window["getComputedStyle"](v42);
    if (v43["display"] === "none" || v43["visibility"] === "hidden")
      return false;
    const v44 = Number(v43["opacity"]);
    if (Number["isFinite"](v44) && v44 <= 0) return false;
    const v45 = v42["getBoundingClientRect"]();
    if (!v45["width"] || !v45["height"]) return false;
  } catch {}
  return true;
}
function disposeMediaElement(v46) {
  if (!v46) return;
  try {
    v46["pause"]?.();
  } catch {}
  try {
    (v46["removeAttribute"]?.("src"), v46["load"]?.());
  } catch {}
}
function setMediaElementSource(v47, v48) {
  if (!v47) return false;
  const v49 = normalizeText(v48),
    v50 = firstNonEmpty(
      v47["dataset"]?.["desktopMediaSourceUrl"],
      v47["dataset"]?.["mediaClipSourceUrl"],
      v47["getAttribute"]?.("src"),
      v47["currentSrc"],
      v47["src"],
    );
  if (!v49) {
    if (v50) disposeMediaElement(v47);
    return (
      v47["dataset"] &&
        (delete v47["dataset"]["desktopMediaSourceUrl"],
        delete v47["dataset"]["mediaClipSourceUrl"]),
      false
    );
  }
  if (v50 === v49) return false;
  try {
    v47["pause"]?.();
  } catch {}
  if (v47["dataset"]) v47["dataset"]["mediaClipSourceUrl"] = v49;
  const v51 = attachMediaElementPlaybackSource(v47, v49, {
    preload: v47["preload"] || "auto",
  })["catch"](() => {
    if (
      !firstNonEmpty(
        v47["getAttribute"]?.("src"),
        v47["currentSrc"],
        v47["src"],
      )
    ) {
      v47["src"] = v49;
      try {
        v47["load"]?.();
      } catch {}
    }
    return firstNonEmpty(
      v47["getAttribute"]?.("src"),
      v47["currentSrc"],
      v47["src"],
    );
  });
  return (
    (v47["__mediaClipSourcePromise"] = v51),
    void v51["finally"](() => {
      v47["__mediaClipSourcePromise"] === v51 &&
        (v47["__mediaClipSourcePromise"] = null);
    }),
    true
  );
}
function getPendingMediaClipSourcePromise(v52) {
  const v53 = v52?.["__mediaClipSourcePromise"];
  return v53 && typeof v53["then"] === "function" ? v53 : null;
}
function waitForMediaClipReady(v54, v55 = 1, v56 = 900) {
  if (!v54 || toNumber(v54["readyState"], 0) >= v55)
    return Promise["resolve"](true);
  const v57 =
    v55 >= 2
      ? [
          "loadeddata",
          "canplay",
          "canplaythrough",
          "seeked",
          "timeupdate",
          "error",
        ]
      : ["loadedmetadata", "loadeddata", "canplay", "error"];
  return new Promise((v58) => {
    let v59 = false;
    const v60 = () => {
        if (v59) return;
        ((v59 = true),
          clearTimeout(v61),
          v57["forEach"]((v62) => {
            v54["removeEventListener"]?.(v62, v63);
          }));
      },
      v63 = (v64) => {
        v60();
        if (v64?.["type"] === "error") {
          v58(false);
          return;
        }
        v58(true);
      },
      v61 = setTimeout(
        () => {
          (v60(), v58(toNumber(v54["readyState"], 0) >= v55));
        },
        Math["max"](100, toNumber(v56, 900)),
      );
    v57["forEach"]((v65) => {
      v54["addEventListener"]?.(v65, v63);
    });
  });
}
function waitForMediaClipPlaybackStart(v66, v67 = 900) {
  if (!v66) return Promise["resolve"](false);
  const v68 = () => v66["paused"] === false && v66["ended"] !== true;
  if (v68()) return Promise["resolve"](true);
  const v69 = ["playing", "timeupdate", "canplay", "loadeddata", "error"];
  return new Promise((v70) => {
    let v71 = false;
    const v72 = () => {
        if (v71) return;
        ((v71 = true),
          clearTimeout(v73),
          v69["forEach"]((v74) => {
            v66["removeEventListener"]?.(v74, v75);
          }));
      },
      v76 = (v77) => {
        (v72(), v70(v77));
      },
      v75 = (v78) => {
        if (v78?.["type"] === "error") {
          v76(false);
          return;
        }
        (v68() ||
          v78?.["type"] === "timeupdate" ||
          v78?.["type"] === "playing") &&
          v76(true);
      },
      v73 = setTimeout(() => v76(v68()), Math["max"](100, toNumber(v67, 900)));
    v69["forEach"]((v79) => {
      v66["addEventListener"]?.(v79, v75);
    });
  });
}
function toPlayableMediaUrl(v80) {
  const v81 = normalizeText(v80);
  if (!v81) return "";
  if (/^(?:https?:|data:|blob:|aic-local-preview:)/i["test"](v81)) return v81;
  const v82 = localPathToUrl(v81),
    v83 = v82 || (v81["startsWith"]("/") ? v81 : "");
  return v83 ? buildApiUrl(v83) : "";
}
function resolveLiveMediaElementUrl(v84 = {}, v85 = "video") {
  const v86 = normalizeText(v84?.["id"]);
  if (
    !v86 ||
    typeof document === "undefined" ||
    typeof document["getElementById"] !== "function"
  )
    return "";
  const v87 = document["getElementById"](v86);
  if (!v87) return "";
  const v88 = Array["from"](v87["querySelectorAll"](v85));
  let v89 = "";
  for (const v90 of v88) {
    const v91 = firstNonEmpty(
        v90["currentSrc"],
        v90["getAttribute"]?.("src"),
        v90["src"],
      ),
      v92 = toPlayableMediaUrl(v91) || (isRenderableUrl(v91) ? v91 : "");
    if (!v92) continue;
    if (!v89) v89 = v92;
    if (isUsableMediaElement(v90)) return v92;
  }
  return v89;
}
function getSourceDataCandidates(v93 = {}) {
  if (!v93 || typeof v93 !== "object") return [];
  const v94 = [],
    v95 = (v96) => {
      if (!v96 || typeof v96 !== "object") return;
      if (v94["includes"](v96)) return;
      v94["push"](v96);
    };
  (v95(v93), v95(v93["nodeData"]), v95(v93["data"]), v95(v93["_data"]));
  for (let v97 = 0; v97 < v94["length"]; v97 += 1) {
    const v98 = v94[v97];
    (v95(v98["nodeData"]), v95(v98["data"]), v95(v98["_data"]));
    const v99 = Array["isArray"](v98["videos"]) ? v98["videos"] : [],
      v100 = Number(v98["mainVideoIndex"]),
      v101 = Number["isFinite"](v100) ? Math["max"](0, Math["trunc"](v100)) : 0;
    (v95(v99[v101]), v99["forEach"](v95));
  }
  return v94;
}
function resolveNestedMediaUrl(v102, v103, v104 = []) {
  for (const v105 of getSourceDataCandidates(v102)) {
    const v106 = normalizeText(v103(v105));
    if (v106) return toPlayableMediaUrl(v106) || v106;
    for (const v107 of v104) {
      const v108 = normalizeText(v105?.[v107]);
      if (!v108) continue;
      const v109 = toPlayableMediaUrl(v108);
      if (v109) return v109;
      if (isRenderableUrl(v108)) return v108;
    }
  }
  return "";
}
function resolveMediaClipVideoUrl(v110 = {}) {
  return (
    resolveLiveMediaElementUrl(v110, "video") ||
    resolveNestedMediaUrl(v110, resolveCanvasVideoUrl, [
      "displayLocalPath",
      "videoMetaSrc",
      "videoLocalPath",
      "videoUrl",
      "src",
      "localUrl",
      "url",
      "resultUrl",
      "sourceUrl",
      "localPath",
      "originalLocalPath",
      "capturePreviewUrl",
      "playbackUrl",
      "mediaUrl",
    ])
  );
}
function resolveMediaClipAudioUrl(v111 = {}) {
  return (
    resolveLiveMediaElementUrl(v111, "audio") ||
    resolveNestedMediaUrl(v111, resolveCanvasAudioUrl, [
      "audioLocalPath",
      "audioUrl",
      "src",
      "localUrl",
      "url",
      "resultUrl",
      "sourceUrl",
      "localPath",
      "mediaUrl",
    ])
  );
}
function resolveMediaClipWaveformUrl(v112 = {}) {
  for (const v113 of getSourceDataCandidates(v112)) {
    const v114 = firstNonEmpty(
      v113?.["waveformLocalPath"],
      v113?.["waveformUrl"],
      v113?.["waveformJsonUrl"],
    );
    if (!v114) continue;
    return (
      localPathToUrl(v114) ||
      toPlayableMediaUrl(v114) ||
      (isRenderableUrl(v114) ? v114 : "")
    );
  }
  return "";
}
function createMediaClipSvgElement(v115) {
  return (
    document["createElementNS"]?.(SVG_NS, v115) ||
    document["createElement"](v115)
  );
}
function setMediaClipSvgClass(v116, v117) {
  v116?.["setAttribute"]?.("class", v117);
  try {
    typeof v116?.["className"] === "string" && (v116["className"] = v117);
  } catch {}
}
function getMediaClipWaveformViewBox() {
  return (
    "0\x200\x20" +
    MEDIA_CLIP_WAVEFORM_WIDTH +
    "\x20" +
    MEDIA_CLIP_WAVEFORM_HEIGHT
  );
}
function getMediaClipWaveformViewport(v118 = {}) {
  const v119 = Math["max"](
    0,
    toNumber(v118["durationSec"], 0),
    toNumber(v118["endSec"], 0),
  );
  if (!(v119 > 0)) return { widthPct: 100, marginLeftPct: 0 };
  const v120 = Math["max"](0, Math["min"](v119, toNumber(v118["startSec"], 0))),
    v121 = Math["max"](
      v120 + 0.001,
      Math["min"](v119, toNumber(v118["endSec"], v119)),
    ),
    v122 = Math["max"](0.001, v121 - v120),
    v123 = Math["max"](1, v119 / v122);
  return {
    widthPct: Math["round"](v123 * 100000) / 1000,
    marginLeftPct: Math["round"]((v120 / v122) * 100000) / 1000,
  };
}
function formatWaveformPct(v124 = 0) {
  const v125 = toNumber(v124, 0);
  if (Math["abs"](v125) < 0.001) return "0";
  return Number["isInteger"](v125) ? String(v125) : v125["toFixed"](3);
}
function resolveMediaClipImageUrl(v126 = {}) {
  return (
    resolveNestedMediaUrl(v126, resolveCanvasImagePreviewUrl, [
      "displayLocalPath",
      "imageUrl",
      "sourceUrl",
      "thumbUrl",
      "src",
      "localUrl",
      "url",
      "resultUrl",
      "localPath",
      "originalLocalPath",
      "thumbLocalPath",
    ]) ||
    resolveNestedMediaUrl(v126, resolveCanvasImageSourceUrl, [
      "imageUrl",
      "sourceUrl",
      "src",
      "localPath",
      "originalLocalPath",
    ])
  );
}
function resolveMediaClipThumbUrl(v127 = {}) {
  for (const v128 of getSourceDataCandidates(v127)) {
    const v129 = firstNonEmpty(
      v128["thumbUrl"],
      v128["thumbnailUrl"],
      v128["posterUrl"],
      v128["imageUrl"],
      v128["sourceUrl"],
      v128["videoThumbSrc"],
      v128["videoMetaSrc"],
      v128["coverUrl"],
      v128["src"],
    );
    if (v129) {
      const v130 = toPlayableMediaUrl(v129);
      if (v130) return v130;
      if (isRenderableUrl(v129)) return v129;
    }
    const v131 = firstNonEmpty(
        v128["posterLocalPath"],
        v128["thumbLocalPath"],
        v128["coverLocalPath"],
        v128["displayLocalPath"],
        v128["localPath"],
      ),
      v132 = toPlayableMediaUrl(v131);
    if (v132) return v132;
  }
  return "";
}
function resolveMediaClipPosterImageFields(v133 = {}, v134 = {}, v135 = {}) {
  const v136 = (v137) => {
      const v138 = normalizeText(v137);
      if (!v138) return "";
      return toPlayableMediaUrl(v138) || (isRenderableUrl(v138) ? v138 : "");
    },
    v139 = firstNonEmpty(
      v134["thumbUrl"],
      v134["posterUrl"],
      v135["thumbUrl"],
      v135["posterUrl"],
    ),
    v140 = firstNonEmpty(
      v134["thumbLocalPath"],
      v134["posterLocalPath"],
      v135["thumbLocalPath"],
      v135["posterLocalPath"],
    );
  if (v139 || v140)
    return {
      thumbUrl: v136(v139 || v140),
      posterUrl: v136(v139 || v140),
      thumbLocalPath: normalizeText(v140),
      posterLocalPath: normalizeText(v140),
      isOutputPoster: true,
    };
  for (const v141 of getSourceDataCandidates(v133)) {
    const v142 = firstNonEmpty(
        v141["thumbUrl"],
        v141["thumbnailUrl"],
        v141["posterUrl"],
        v141["coverUrl"],
      ),
      v143 = firstNonEmpty(
        v141["thumbLocalPath"],
        v141["posterLocalPath"],
        v141["coverLocalPath"],
      );
    if (v142 || v143) {
      const v144 = v136(v142 || v143);
      return {
        thumbUrl: v144,
        posterUrl: v144,
        thumbLocalPath: normalizeText(v143),
        posterLocalPath: normalizeText(v143),
        isOutputPoster: false,
      };
    }
  }
  return {
    thumbUrl: "",
    posterUrl: "",
    thumbLocalPath: "",
    posterLocalPath: "",
    isOutputPoster: false,
  };
}
function resolveMediaClipOutputVideoDimensions(v145 = {}, v146 = {}) {
  const v147 = toNumber(v146["videoWidth"], 0),
    v148 = toNumber(v146["videoHeight"], 0);
  if (v147 > 0 && v148 > 0) return { width: v147, height: v148 };
  const v149 = toNumber(v146["width"], 0),
    v150 = toNumber(v146["height"], 0);
  if (v149 > 0 && v150 > 0) return { width: v149, height: v150 };
  return resolveMediaClipDimensions(v145);
}
function collectMediaClipFrameUrls(v151 = {}) {
  const v152 = [],
    v153 = new Set(),
    v154 = (v155) => {
      const v156 = normalizeText(v155);
      if (!v156) return;
      const v157 =
        toPlayableMediaUrl(v156) || (isRenderableUrl(v156) ? v156 : "");
      if (!v157 || v153["has"](v157)) return;
      (v153["add"](v157), v152["push"](v157));
    },
    v158 = (v159, v160 = {}) => {
      if (!v159) return;
      if (typeof v159 === "string") {
        v154(v159);
        return;
      }
      if (typeof v159 !== "object") return;
      v154(
        firstNonEmpty(
          v159["thumbUrl"],
          v159["thumbnailUrl"],
          v159["posterUrl"],
          v159["imageUrl"],
          v159["sourceUrl"],
          v159["url"],
          v159["src"],
          v159["thumbLocalPath"],
          v159["posterLocalPath"],
          v160["allowLocalPath"] === true ? v159["localPath"] : "",
        ),
      );
    };
  for (const v161 of getSourceDataCandidates(v151)) {
    ([
      v161["frameThumbUrls"],
      v161["frameThumbnailUrls"],
      v161["thumbnailUrls"],
      v161["thumbUrls"],
      v161["posterUrls"],
      v161["frames"],
      v161["thumbnails"],
      v161["videoFrames"],
    ]["forEach"]((v162) => {
      Array["isArray"](v162) &&
        v162["forEach"]((v163) => v158(v163, { allowLocalPath: true }));
    }),
      v158(v161));
  }
  const v164 = resolveMediaClipThumbUrl(v151);
  if (v164) v154(v164);
  return v152;
}
function resolveMediaClipLocalPath(v165 = {}) {
  for (const v166 of getSourceDataCandidates(v165)) {
    const v167 = firstNonEmpty(
      v166["localPath"],
      v166["originalLocalPath"],
      v166["displayLocalPath"],
      v166["videoLocalPath"],
      v166["audioLocalPath"],
      v166["imageUrl"],
      v166["sourceUrl"],
      v166["src"],
      v166["url"],
      v166["resultUrl"],
    );
    if (v167) return v167;
  }
  return "";
}
function fillFilmstripPlaceholder(v168, v169 = 6) {
  if (!v168) return;
  (v168["classList"]["add"]("is-placeholder"), v168["replaceChildren"]());
  const v170 = Math["max"](1, Math["trunc"](toNumber(v169, 6)));
  for (let v171 = 0; v171 < v170; v171 += 1) {
    const v172 = document["createElement"]("span");
    ((v172["className"] = "media-clip-filmstrip-frame"),
      v168["appendChild"](v172));
  }
}
export class MediaClipNode {
  constructor(v173) {
    ((this["nodeData"] = v173 || {}),
      (this["id"] = this["nodeData"]["id"]),
      (this["el"] = document["createElement"]("div")),
      (this["el"]["className"] = "media-clip-node-shell"),
      (this["_sources"] = { video: null, videos: [], audio: null, audios: [] }),
      (this["_mediaClip"] = normalizeMediaClipState(
        this["nodeData"],
        this["_sources"],
      )),
      (this["_timelineView"] = normalizeMediaClipTimelineView(
        this["_mediaClip"]["timelineView"],
      )),
      (this["_playheadSec"] = 0),
      (this["_exporting"] = false),
      (this["_menuOpen"] = false),
      (this["_materialMenu"] = null),
      (this["_materialMenuEl"] = null),
      (this["_exportLoadingTarget"] = null),
      (this["_unsubscribePick"] = null),
      (this["_unsubscribeInputs"] = null),
      (this["_timelineInteractionState"] =
        this["_createTimelineInteractionState"]()),
      (this["_suppressTrackClick"] = false),
      (this["_activeClipIndex"] = 0),
      (this["_selectedClipIndex"] = -1),
      (this["_activeAudioClipIndex"] = 0),
      (this["_selectedAudioClipIndex"] = -1),
      (this["_timelineScrollLeft"] = this["_timelineView"]["scrollLeft"]),
      (this["_timelineViewPersistTimer"] = 0),
      (this["_timelineViewPersistRender"] = false),
      (this["_timelineSettleTimer"] = 0),
      (this["_timelineSettleRow"] = null),
      (this["_timelineSettlePendingPersist"] = false),
      (this["_timelineSettlePendingCommit"] = false),
      (this["_timelineSettleVersion"] = 0),
      (this["_timelineDragSessionSeq"] = 0),
      (this["_timelineDragAutoScrollRaf"] = 0),
      (this["_deferredTimelineDragNodeData"] = null),
      (this["_skipNextStoreMediaClipRender"] = false),
      (this["_skipNextIncomingMediaClipRender"] = false),
      (this["_restoringTimelineScroll"] = null),
      (this["_onDocumentPointerDown"] = null),
      (this["_onMaterialMenuPointerDown"] = null),
      (this["_onDocumentKeyDown"] = null),
      (this["_onDeleteMaterialShortcut"] = null),
      (this["_lastDeleteMaterialShortcutAt"] = Number["NEGATIVE_INFINITY"]),
      (this["_pendingPreviewSeek"] = { video: null, audio: null }),
      (this["_previewSeekRaf"] = { video: 0, audio: 0 }),
      (this["_previewSeekState"] = {
        video: this["_createPreviewSeekState"](),
        audio: this["_createPreviewSeekState"](),
      }),
      (this["_playbackRaf"] = 0),
      (this["_playing"] = false),
      (this["_previewVisualKind"] = ""),
      (this["_imagePlaybackStartedAt"] = 0),
      (this["_imagePlaybackStartSec"] = 0),
      (this["_videoPreview"] = null),
      (this["_imagePreview"] = null),
      (this["_audioPreview"] = null),
      (this["_previewPlayButton"] = null),
      (this["_previewTimeLabel"] = null),
      (this["_previewVideoSrc"] = ""),
      (this["_previewAudioSrc"] = ""));
  }
  ["_createTimelineInteractionState"](v174 = {}) {
    return {
      mode: "idle",
      hoverKind: "",
      hoverClipIndex: -1,
      drag: null,
      ...v174,
    };
  }
  ["_timelineDrag"]() {
    return this["_timelineInteractionState"]?.["drag"] || null;
  }
  ["_compactLayoutSize"](v175 = this["_mediaClip"]) {
    return {
      width: MEDIA_CLIP_COMPACT_SIZE["width"],
      height: MEDIA_CLIP_COMPACT_SIZE["height"],
    };
  }
  ["_nextTimelineDragSessionId"]() {
    return (
      (this["_timelineDragSessionSeq"] =
        toNumber(this["_timelineDragSessionSeq"], 0) + 1),
      this["_timelineDragSessionSeq"]
    );
  }
  ["_isTimelineDragSession"](v176) {
    const v177 = this["_timelineDrag"]();
    return !!v177 && v177["sessionId"] === v176;
  }
  ["_setTimelineDrag"](v178 = null) {
    this["_timelineInteractionState"] = this["_createTimelineInteractionState"](
      { mode: v178?.["mode"] || "idle", drag: v178 },
    );
  }
  ["_setTimelineHoverSegment"](v179, v180, v181 = "", v182 = -1) {
    if (!v180) return;
    const v183 = Math["trunc"](toNumber(v182, -1));
    if (
      this["_timelineInteractionState"]?.["hoverKind"] === v181 &&
      this["_timelineInteractionState"]?.["hoverClipIndex"] === v183 &&
      v180["dataset"]["trimHover"] === "true" &&
      v180["classList"]["contains"]("is-hovered")
    )
      return;
    const v184 = v179 || v180["closest"]?.(".media-clip-track") || this["el"];
    (v184?.["querySelectorAll"]?.(
      '.media-clip-segment[data-trim-hover="true"], .media-clip-segment.is-hovered',
    )?.["forEach"]((v185) => {
      if (v185 === v180) return;
      (delete v185["dataset"]["trimHover"],
        v185["classList"]["remove"]("is-hovered"));
    }),
      (v180["dataset"]["trimHover"] = "true"),
      v180["classList"]["add"]("is-hovered"),
      (this["_timelineInteractionState"] = this[
        "_createTimelineInteractionState"
      ]({
        ...this["_timelineInteractionState"],
        mode: this["_timelineDrag"]()
          ? this["_timelineInteractionState"]["mode"]
          : "hover",
        hoverKind: v181,
        hoverClipIndex: v183,
      })));
  }
  ["_clearTimelineHoverState"](v186 = this["el"]) {
    const v187 =
      this["_timelineInteractionState"]?.["hoverKind"] ||
      this["_timelineInteractionState"]?.["hoverClipIndex"] !== -1 ||
      v186?.["querySelector"]?.(
        '.media-clip-segment[data-trim-hover="true"], .media-clip-segment.is-hovered',
      );
    if (!v187) return;
    (v186?.["querySelectorAll"]?.(
      '.media-clip-segment[data-trim-hover="true"], .media-clip-segment.is-hovered',
    )?.["forEach"]((v188) => {
      (delete v188["dataset"]["trimHover"],
        v188["classList"]["remove"]("is-hovered"));
    }),
      (this["_timelineInteractionState"] = this[
        "_createTimelineInteractionState"
      ]({
        ...this["_timelineInteractionState"],
        mode: this["_timelineDrag"]()
          ? this["_timelineInteractionState"]["mode"]
          : "idle",
        hoverKind: "",
        hoverClipIndex: -1,
      })));
  }
  ["mount"]() {
    return (
      this["el"]["addEventListener"]("pointerdown", (v189) => {
        (this["_mediaClip"]["expanded"] === true ||
          v189["target"]["closest"](
            "button,\x20video,\x20audio,\x20.media-clip-menu",
          )) &&
          v189["stopPropagation"]();
      }),
      (this["_unsubscribePick"] = appStore["subscribeSelector"]?.(
        (v190) => ({
          active: v190["pickConnectMode"]?.["active"] === true,
          sourceNodeId: v190["pickConnectMode"]?.["sourceNodeId"] || "",
        }),
        () => this["_render"](),
      )),
      (this["_unsubscribeInputs"] = appStore["subscribeSelector"]?.(
        (v191) => buildMediaClipIncomingSignature(v191, this["id"]),
        () => {
          const v192 = this["_skipNextIncomingMediaClipRender"] === true;
          this["_skipNextIncomingMediaClipRender"] = false;
          const v193 =
            appStore["getState"]()?.["nodes"]?.[this["id"]] || this["nodeData"];
          ((this["nodeData"] = v193), this["_syncFromStore"](v193));
          if (v192) return;
          this["_render"]();
        },
      )),
      this["_syncFromStore"](this["nodeData"]),
      this["_render"](),
      this["el"]
    );
  }
  ["unmount"]() {
    (this["_unsubscribePick"]?.(),
      this["_unsubscribeInputs"]?.(),
      (this["_unsubscribePick"] = null),
      (this["_unsubscribeInputs"] = null),
      this["_detachDragListeners"](),
      this["_syncDocumentExitListener"](false),
      this["_syncMaterialMenuDismissListener"](false),
      this["_syncDocumentKeyListener"](false),
      this["_syncDeleteMaterialShortcutListener"](false),
      this["_removeMaterialMenuPortal"](),
      this["_stopExportLoading"](),
      this["_releaseExpandedEditor"](),
      this["_disposePreviewMedia"](),
      this["_timelineViewPersistTimer"] &&
        (clearTimeout(this["_timelineViewPersistTimer"]),
        (this["_timelineViewPersistTimer"] = 0)),
      this["_timelineSettleTimer"] &&
        (clearTimeout(this["_timelineSettleTimer"]),
        (this["_timelineSettleTimer"] = 0),
        this["_timelineSettleRow"]?.["classList"]["remove"]("is-settling"),
        this["_flushTimelineSettlePersist"]()),
      (this["_timelineSettleRow"] = null),
      (this["_skipNextStoreMediaClipRender"] = false),
      (this["_skipNextIncomingMediaClipRender"] = false),
      (this["_timelineViewPersistRender"] = false),
      (this["_restoringTimelineScroll"] = null),
      this["_stopTimelineDragAutoScroll"]());
  }
  ["update"](v194) {
    const v195 = v194 || this["nodeData"];
    if (this["_timelineDrag"]()) {
      ((this["_deferredTimelineDragNodeData"] = v195),
        (this["nodeData"] = {
          ...(v195 || {}),
          mediaClip: this["_mediaClip"],
        }));
      return;
    }
    if (
      this["_skipNextStoreMediaClipRender"] &&
      isSameMediaClipState(v195?.["mediaClip"], this["_mediaClip"])
    ) {
      ((this["_skipNextStoreMediaClipRender"] = false),
        (this["nodeData"] = v195));
      return;
    }
    if (
      (this["_timelineSettleTimer"] || this["_timelineSettleRow"]) &&
      isSameMediaClipState(v195?.["mediaClip"], this["_mediaClip"])
    ) {
      ((this["_skipNextStoreMediaClipRender"] = false),
        (this["nodeData"] = v195));
      return;
    }
    if (this["_isTimelinePresentationOnlyUpdate"](v195)) {
      ((this["_skipNextStoreMediaClipRender"] = false),
        (this["nodeData"] = {
          ...(v195 || {}),
          mediaClip: this["_mediaClip"],
        }));
      return;
    }
    ((this["_skipNextStoreMediaClipRender"] = false),
      (this["nodeData"] = v195),
      this["_syncFromStore"](this["nodeData"]),
      this["_render"]());
  }
  ["_isTimelinePresentationOnlyUpdate"](v196 = {}) {
    if (
      !v196 ||
      !Object["prototype"]["hasOwnProperty"]["call"](v196, "mediaClip")
    )
      return false;
    if (!isSameMediaClipState(v196["mediaClip"], this["_mediaClip"]))
      return false;
    const v197 = this["nodeData"] || {},
      v198 = toNumber(v197["width"], MEDIA_CLIP_COMPACT_SIZE["width"]),
      v199 = toNumber(v197["height"], MEDIA_CLIP_COMPACT_SIZE["height"]),
      v200 = toNumber(v196["width"], v198),
      v201 = toNumber(v196["height"], v199);
    return Math["abs"](v200 - v198) <= 0.01 && Math["abs"](v201 - v199) <= 0.01;
  }
  ["_syncFromStore"](v202) {
    const v203 = appStore["getState"](),
      v204 = Object["values"](v203["edges"] || {})
        ["filter"]((v205) => v205?.["targetId"] === this["id"])
        ["sort"]((v206, v207) => {
          const v208 = toNumber(v206?.["createdAt"], 0),
            v209 = toNumber(v207?.["createdAt"], 0);
          if (v208 !== v209) return v208 - v209;
          return normalizeText(v206?.["id"])["localeCompare"](
            normalizeText(v207?.["id"]),
          );
        })
        ["map"]((v210) => {
          const v211 = v203["nodes"]?.[v210["sourceId"]];
          return v211
            ? { ...v211, __mediaClipEdgeId: normalizeText(v210?.["id"]) }
            : null;
        })
        ["filter"](Boolean),
      v212 = v204["filter"]((v213) => {
        const v214 = getMediaClipInputKind(v213);
        return v214 === "video" || v214 === "image";
      }),
      v215 = v204["filter"]((v216) => getMediaClipInputKind(v216) === "audio");
    this["_sources"] = {
      video: v212[0] || null,
      videos: v212,
      audio: v215[0] || null,
      audios: v215,
    };
    const v217 = normalizeMediaClipState(v202, this["_sources"]),
      v218 = this["_timelineViewPersistTimer"]
        ? normalizeMediaClipTimelineView(this["_timelineView"])
        : normalizeMediaClipTimelineView(v217["timelineView"]),
      v219 = { ...v217, timelineView: v218 };
    ((this["_timelineView"] = v218),
      (this["_timelineScrollLeft"] = v218["scrollLeft"]),
      (this["_mediaClip"] = v219),
      (this["_activeClipIndex"] = this["_clampVideoClipIndex"](
        this["_activeClipIndex"],
      )),
      (this["_selectedClipIndex"] = this["_clampSelectedClipIndex"](
        this["_selectedClipIndex"],
      )),
      (this["_activeAudioClipIndex"] = this["_clampAudioClipIndex"](
        this["_activeAudioClipIndex"],
      )),
      (this["_selectedAudioClipIndex"] = this["_clampSelectedAudioClipIndex"](
        this["_selectedAudioClipIndex"],
      )));
    const v220 = !!(v219["tracks"]?.["video"] || v219["tracks"]?.["audio"]),
      v221 = this["_compactLayoutSize"](v219),
      v222 = {};
    v220 &&
      toNumber(v202?.["width"], v221["width"]) !== v221["width"] &&
      (v222["width"] = v221["width"]);
    v220 &&
      toNumber(v202?.["height"], v221["height"]) !== v221["height"] &&
      (v222["height"] = v221["height"]);
    const v223 = { ...v222 };
    !isSameMediaClipState(v202?.["mediaClip"], v219) &&
      (v223["mediaClip"] = v219);
    if (Object["keys"](v223)["length"])
      appStore["updateNodeData"](this["id"], v223);
    this["nodeData"] = { ...(v202 || {}), ...v222, mediaClip: v219 };
    const v224 =
      v219["tracks"]?.[v219["activeTrack"]] ||
      v219["tracks"]?.["video"] ||
      v219["tracks"]?.["audio"];
    v224 &&
      this["_playheadSec"] <= 0 &&
      (this["_playheadSec"] =
        v219["activeTrack"] === "video"
          ? this["_videoTimelineStart"](v224, v219["clips"])
          : v224["startSec"]);
  }
  ["_isPicking"]() {
    const v225 = appStore["getState"]()?.["pickConnectMode"] || {};
    return v225["active"] === true && v225["sourceNodeId"] === this["id"];
  }
  ["_normalizeMediaClipWithTimelineView"](v226 = {}) {
    const v227 = normalizeMediaClipTimelineView(
      v226["timelineView"] || this["_timelineView"],
    );
    return (
      (this["_timelineView"] = v227),
      (this["_timelineScrollLeft"] = v227["scrollLeft"]),
      { ...v226, timelineView: v227 }
    );
  }
  ["_updateTimelineView"](v228 = {}, v229 = {}) {
    const v230 = normalizeMediaClipTimelineView({
      ...this["_timelineView"],
      ...v228,
    });
    return (
      (this["_timelineView"] = v230),
      (this["_timelineScrollLeft"] = v230["scrollLeft"]),
      (this["_mediaClip"] = { ...this["_mediaClip"], timelineView: v230 }),
      (this["nodeData"] = {
        ...(this["nodeData"] || {}),
        mediaClip: this["_mediaClip"],
      }),
      v229["persist"] === true &&
        this["_scheduleTimelineViewPersist"]({
          render: v229["renderOnPersist"] !== false,
        }),
      v230
    );
  }
  ["_persistTimelineView"](v231 = {}) {
    const v232 = normalizeMediaClipTimelineView(this["_timelineView"]),
      v233 = { ...this["_mediaClip"], timelineView: v232 };
    ((this["_timelineView"] = v232),
      (this["_timelineScrollLeft"] = v232["scrollLeft"]),
      (this["_mediaClip"] = v233),
      (this["nodeData"] = { ...(this["nodeData"] || {}), mediaClip: v233 }));
    if (v231["render"] === false) this["_skipNextStoreMediaClipRender"] = true;
    appStore["updateNodeData"](this["id"], { mediaClip: v233 });
    if (v231["render"] !== false) this["_render"]();
  }
  ["_flushTimelineViewPersist"](v234 = {}) {
    if (!this["_timelineViewPersistTimer"]) return false;
    (clearTimeout(this["_timelineViewPersistTimer"]),
      (this["_timelineViewPersistTimer"] = 0));
    const v235 =
      v234["render"] === false
        ? false
        : v234["render"] === true || this["_timelineViewPersistRender"];
    return (
      (this["_timelineViewPersistRender"] = false),
      this["_persistTimelineView"]({ render: v235 }),
      true
    );
  }
  ["_scheduleTimelineViewPersist"](v236 = {}) {
    if (this["_timelineViewPersistTimer"])
      clearTimeout(this["_timelineViewPersistTimer"]);
    ((this["_timelineViewPersistRender"] =
      this["_timelineViewPersistRender"] || v236["render"] !== false),
      (this["_timelineViewPersistTimer"] = setTimeout(() => {
        const v237 = this["_timelineViewPersistRender"];
        ((this["_timelineViewPersistTimer"] = 0),
          (this["_timelineViewPersistRender"] = false),
          this["_persistTimelineView"]({ render: v237 }));
      }, TIMELINE_VIEW_PERSIST_DELAY_MS)));
  }
  ["_setMediaClip"](v238, v239 = false, v240 = {}) {
    const v241 = this["_normalizeMediaClipWithTimelineView"](v238);
    ((this["_mediaClip"] = v241),
      (this["nodeData"] = { ...(this["nodeData"] || {}), mediaClip: v241 }));
    if (v240["render"] === false) this["_skipNextStoreMediaClipRender"] = true;
    appStore["updateNodeData"](this["id"], { mediaClip: v241 });
    if (v239) commit();
    if (v240["render"] !== false) this["_render"]();
  }
  ["_claimExpandedEditor"]() {
    (activeExpandedMediaClipNode &&
      activeExpandedMediaClipNode !== this &&
      activeExpandedMediaClipNode["_collapseFromPeer"](),
      (activeExpandedMediaClipNode = this));
  }
  ["_releaseExpandedEditor"]() {
    activeExpandedMediaClipNode === this &&
      (activeExpandedMediaClipNode = null);
  }
  ["_collapseFromPeer"]() {
    if (this["_mediaClip"]["expanded"] !== true) return;
    this["_setMediaClipWithLayout"](
      { ...this["_mediaClip"], expanded: false },
      false,
      { claimExpanded: false },
    );
  }
  ["_prepareTimelineForCollapse"]() {
    (this["_stopTimelineDragAutoScroll"](),
      this["_cancelTimelineSettle"](),
      this["_flushTimelineViewPersist"]({ render: false }),
      (this["_deferredTimelineDragNodeData"] = null));
  }
  ["_setMediaClipWithLayout"](v242, v243 = false, v244 = {}) {
    if (v242["expanded"] === true && v244["claimExpanded"] !== false)
      this["_claimExpandedEditor"]();
    else
      v242["expanded"] !== true &&
        (this["_prepareTimelineForCollapse"](),
        this["_releaseExpandedEditor"](),
        this["_disposePreviewMedia"]());
    const v245 = this["nodeData"] || {},
      v246 = this["_normalizeMediaClipWithTimelineView"](v242),
      v247 = this["_compactLayoutSize"](v246),
      v248 = { width: v247["width"], height: v247["height"], mediaClip: v246 };
    ((this["_mediaClip"] = v248["mediaClip"]),
      (this["nodeData"] = { ...v245, ...v248 }));
    if (v244["render"] === false) this["_skipNextStoreMediaClipRender"] = true;
    appStore["updateNodeData"](this["id"], v248);
    if (v243) commit();
    if (v244["render"] !== false) this["_render"]();
  }
  ["_setActiveTrack"](v249, v250 = null, v251 = {}) {
    const v252 = this["_mediaClip"]["tracks"]?.[v249];
    if (!v252) return;
    this["_pausePreviewPlayback"]({ updateControls: false });
    const v253 = { ...this["_mediaClip"], activeTrack: v249 };
    this["_playheadSec"] = v250 == null ? this["_playheadSec"] : v250;
    const v254 = this["_mediaClip"]["activeTrack"] !== v249;
    ((this["_mediaClip"] = v253),
      (this["nodeData"] = { ...(this["nodeData"] || {}), mediaClip: v253 }));
    v254 && appStore["updateNodeData"](this["id"], { mediaClip: v253 });
    v254 || v251["forceRender"] === true
      ? this["_render"]()
      : this["_updateTrackVisuals"](v249);
    if (v249 === "video")
      this["_syncVideoPreviewSourceForTimelineSec"](this["_playheadSec"]);
    else
      v249 === "audio" &&
        (this["_setActiveAudioClipIndex"](
          this["_audioClipIndexAtTimelineSec"](this["_playheadSec"]),
        ),
        this["_syncAudioPreviewSourceForTimelineSec"](this["_playheadSec"]));
    this["_syncPreviewTime"](
      v249,
      this["_previewSourceSecForTimelineSec"](v249, this["_playheadSec"]),
    );
  }
  ["_togglePickConnect"](v255) {
    stopPointer(v255);
    const v256 = this["_isPicking"]();
    if (v256) {
      appStore["setPickConnectMode"]({ active: false });
      return;
    }
    appStore["setPickConnectMode"]({
      active: true,
      sourceNodeId: this["id"],
      handleDirection: "left",
    });
  }
  ["_setExpanded"](v257, v258 = {}) {
    const v259 = { ...this["_mediaClip"], ...v258, expanded: v257 === true };
    this["_setMediaClipWithLayout"](v259, true);
  }
  ["_splitActiveMaterial"](v260 = this["_getPlaybackKind"]()) {
    const v261 = v260 === "audio" ? "audio" : "video",
      v262 = this["_mediaClip"]["tracks"]?.[v261];
    if (!v262) return;
    const v263 = this["_playheadSec"],
      v264 =
        v261 === "audio"
          ? splitMediaClipAudioAtTimelineSec(
              this["_mediaClip"],
              v263,
              generateId("split"),
            )
          : splitMediaClipAtTimelineSec(
              this["_mediaClip"],
              v263,
              generateId("split"),
            );
    if (isSameMediaClipState(v264, this["_mediaClip"])) {
      window["showToast"]?.("把播放头移到素材中间再剪开");
      return;
    }
    if (v261 === "audio") {
      const v265 = this["_audioClipIndexAtTimelineSec"](
        v263 + 0.001,
        v264["audioClips"],
      );
      ((this["_activeAudioClipIndex"] = v265),
        (this["_selectedAudioClipIndex"] = v265));
    } else {
      const v266 = this["_clipIndexAtTimelineSec"](v263 + 0.001, v264["clips"]);
      ((this["_activeClipIndex"] = v266), (this["_selectedClipIndex"] = v266));
    }
    (this["_pausePreviewPlayback"]({ updateControls: false }),
      this["_setMediaClipWithLayout"](
        { ...v264, activeTrack: v261, expanded: true },
        true,
        { render: false },
      ),
      this["_rerenderCompactOnly"](),
      v261 === "audio"
        ? (this["_syncAudioPreviewSourceForTimelineSec"](v263),
          this["_syncPreviewTime"](
            "audio",
            this["_audioSourceSecForPlayhead"](v263),
            { immediate: true },
          ))
        : (this["_syncVideoPreviewSourceForTimelineSec"](v263),
          this["_syncPreviewTime"](
            "video",
            this["_videoSourceSecForPlayhead"](v263),
            { immediate: true },
          )),
      this["_updatePreviewControls"]());
  }
  ["_splitActiveVideoClip"]() {
    this["_splitActiveMaterial"]("video");
  }
  ["_getPlaybackKind"]() {
    const v267 = this["_mediaClip"]["activeTrack"];
    if (this["_mediaClip"]["tracks"]?.[v267]) return v267;
    if (this["_mediaClip"]["tracks"]?.["video"]) return "video";
    if (this["_mediaClip"]["tracks"]?.["audio"]) return "audio";
    return "";
  }
  ["_getPlaybackTrack"](v268 = this["_getPlaybackKind"]()) {
    return v268 ? this["_mediaClip"]["tracks"]?.[v268] || null : null;
  }
  ["_getVideoClipAtTimelineSec"](
    v269 = this["_playheadSec"],
    v270 = this["_videoTimelineClips"](this["_mediaClip"]["tracks"]?.["video"]),
  ) {
    const v271 = Array["isArray"](v270) ? v270 : [];
    if (!v271["length"]) return null;
    return v271[this["_clipIndexAtTimelineSec"](v269, v271)] || v271[0];
  }
  ["_videoTimelineStart"](
    v272 = this["_mediaClip"]["tracks"]?.["video"],
    v273 = this["_videoTimelineClips"](v272),
  ) {
    const v274 = Array["isArray"](v273) ? v273 : [];
    if (v274["length"])
      return v274["reduce"](
        (v275, v276) =>
          Math["min"](v275, toNumber(v276["timelineStartSec"], 0)),
        Number["POSITIVE_INFINITY"],
      );
    return toNumber(v272?.["startSec"], 0);
  }
  ["_timelineDisplayEnd"](v277 = this["_getPlaybackKind"]()) {
    if (v277 === "video")
      return this["_videoTimelineBaseDuration"](
        this["_mediaClip"]["tracks"]?.["video"],
      );
    const v278 = this["_mediaClip"]["tracks"]?.[v277];
    return toNumber(v278?.["endSec"] || v278?.["durationSec"], 0);
  }
  ["_getPlaybackMedia"](v279 = this["_getPlaybackKind"]()) {
    return v279 ? this["_getPreviewMedia"](v279) : null;
  }
  ["_isSecInsideTrack"](v280, v281) {
    if (!v280) return false;
    const v282 = toNumber(v281, -1);
    return (
      v282 >= toNumber(v280["startSec"], 0) &&
      v282 <= toNumber(v280["endSec"], 0)
    );
  }
  ["_cancelPlaybackLoop"]() {
    const v283 = this["_playbackRaf"];
    if (!v283) return;
    try {
      if (typeof cancelAnimationFrame === "function")
        cancelAnimationFrame(v283);
    } catch {}
    try {
      clearTimeout(v283);
    } catch {}
    this["_playbackRaf"] = 0;
  }
  ["_pausePreviewPlayback"](v284 = {}) {
    ((this["_playing"] = false),
      (this["_imagePlaybackStartedAt"] = 0),
      (this["_imagePlaybackStartSec"] = 0),
      this["_cancelPlaybackLoop"]());
    try {
      this["_videoPreview"]?.["pause"]?.();
    } catch {}
    try {
      this["_audioPreview"]?.["pause"]?.();
    } catch {}
    this["el"]?.["classList"]?.["remove"]("is-playing");
    if (v284["updateControls"] !== false) this["_updatePreviewControls"]();
  }
  async ["_preparePreviewMediaForPlayback"](v285, v286 = null) {
    const v287 = this["_getPreviewMedia"](v285);
    if (!v287) return false;
    const v288 = getPendingMediaClipSourcePromise(v287);
    if (v288)
      try {
        await v288;
      } catch {}
    v286 !== null &&
      v286 !== undefined &&
      this["_syncPreviewTime"](v285, v286, { immediate: true });
    const v289 = v285 === "video" ? 2 : 1,
      v290 = await waitForMediaClipReady(
        v287,
        v289,
        v285 === "video" ? 1400 : 900,
      );
    if (!v290) return false;
    return (
      v286 !== null &&
        v286 !== undefined &&
        this["_syncPreviewTime"](v285, v286, { immediate: true }),
      true
    );
  }
  async ["_togglePreviewPlayback"](v291) {
    stopPointer(v291);
    if (this["_playing"]) {
      this["_pausePreviewPlayback"]();
      return;
    }
    await this["_playPreview"]();
  }
  async ["_playPreview"]() {
    const v292 = this["_getPlaybackKind"](),
      v293 = this["_getPlaybackTrack"](v292);
    let v294 = this["_getPlaybackMedia"](v292);
    if (!v292 || !v293) return;
    let v295 = v293["startSec"],
      v296 = v295;
    if (v292 === "video") {
      const v297 = this["_getVideoClipAtTimelineSec"](this["_playheadSec"]);
      if (!v297) return;
      const v298 = this["_videoClipSource"](
          v297,
          this["_clipIndexAtTimelineSec"](this["_playheadSec"]),
        ),
        v299 = this["_visualClipKind"](v297, v298),
        v300 = toNumber(v297["timelineStartSec"], 0),
        v301 = toNumber(v297["timelineEndSec"], v300),
        v302 = toNumber(this["_playheadSec"], v300);
      ((v295 = v302 >= v300 && v302 < v301 ? v302 : v300),
        (v296 = this["_videoSourceSecForPlayhead"](v295)),
        this["_syncVideoPreviewSourceForTimelineSec"](v295));
      if (v299 === "image") {
        ((this["_playheadSec"] = v295),
          (this["_imagePlaybackStartSec"] = v295),
          (this["_imagePlaybackStartedAt"] =
            globalThis["performance"]?.["now"]?.() || Date["now"]()),
          this["_syncReplacementAudioFromVideo"](v295, { immediate: true }),
          await this["_playReplacementAudioFromVideo"](v295),
          (this["_playing"] = true),
          this["el"]?.["classList"]?.["add"]("is-playing"),
          this["_updateTrackVisuals"](v292),
          this["_updatePreviewControls"](),
          this["_startPlaybackLoop"](v292));
        return;
      }
      v294 = this["_getPlaybackMedia"](v292);
      if (!v294) return;
    } else {
      if (!v294) return;
      const v303 = this["_audioTimelineClips"](v293),
        v304 = this["_audioClipIndexAtTimelineSec"](this["_playheadSec"], v303),
        v305 = v303[v304] || v303[0] || null;
      if (v305) {
        const v306 = toNumber(v305["timelineStartSec"], 0),
          v307 = Math["max"](v306, toNumber(v305["timelineEndSec"], v306)),
          v308 = toNumber(this["_playheadSec"], v306);
        ((v295 = v308 >= v306 && v308 < v307 ? v308 : v306),
          this["_setActiveAudioClipIndex"](v304),
          this["_syncAudioPreviewSourceForTimelineSec"](v295),
          (v296 = this["_audioSourceSecForPlayhead"](v295)));
      } else {
        const v309 = toNumber(v294["currentTime"], this["_playheadSec"]);
        ((v295 =
          this["_isSecInsideTrack"](v293, v309) && v309 < v293["endSec"]
            ? v309
            : v293["startSec"]),
          (v296 = v295));
      }
    }
    ((this["_playheadSec"] = v295),
      this["_syncPreviewTime"](v292, v296, { immediate: true }));
    try {
      if (v292 === "video") {
        const v310 = await this["_preparePreviewMediaForPlayback"](v292, v296);
        if (!v310) throw new Error("Media clip preview video is not ready");
        this["_syncReplacementAudioFromVideo"](v295, { immediate: true });
      }
      await v294["play"]?.();
      if (v292 === "video") {
        const v311 = await waitForMediaClipPlaybackStart(v294, 900);
        if (!v311) throw new Error("Media clip preview video did not start");
        await this["_playReplacementAudioFromVideo"](v295);
      }
      ((this["_playing"] = true),
        this["el"]?.["classList"]?.["add"]("is-playing"),
        this["_updateTrackVisuals"](v292),
        this["_updatePreviewControls"](),
        this["_startPlaybackLoop"](v292));
    } catch (v312) {
      (this["_pausePreviewPlayback"](),
        globalThis["window"]?.["showToast"]?.("当前素材无法播放预览"));
    }
  }
  async ["_playReplacementAudioFromVideo"](v313) {
    const v314 = this["_mediaClip"]["tracks"]?.["video"],
      v315 = this["_mediaClip"]["tracks"]?.["audio"],
      v316 = this["_audioPreview"];
    if (!v314 || !v315 || !v316 || !this["_previewAudioSrc"]) return;
    const v317 = this["_getAudioClipContextAtTimelineSec"](v313, {
        nearest: false,
      }),
      v318 =
        Array["isArray"](this["_mediaClip"]["audioClips"]) &&
        this["_mediaClip"]["audioClips"]["length"],
      v319 = v317["clip"]
        ? v317["sourceSec"]
        : v318
          ? null
          : mapMediaClipVideoSecToAudioSec(v313, v314, v315);
    if (v319 == null) {
      try {
        v316["pause"]?.();
      } catch {}
      return;
    }
    if (v317["clip"]) this["_syncAudioPreviewSourceForTimelineSec"](v313);
    ((this["_pendingPreviewSeek"]["audio"] = v319),
      this["_applyPreviewSeek"]("audio"));
    try {
      await v316["play"]?.();
    } catch {}
  }
  ["_syncReplacementAudioFromVideo"](v320, v321 = {}) {
    const v322 = this["_mediaClip"]["tracks"]?.["video"],
      v323 = this["_mediaClip"]["tracks"]?.["audio"],
      v324 = this["_audioPreview"];
    if (!v322 || !v323 || !v324 || !this["_previewAudioSrc"]) return;
    const v325 = this["_getAudioClipContextAtTimelineSec"](v320, {
        nearest: false,
      }),
      v326 =
        Array["isArray"](this["_mediaClip"]["audioClips"]) &&
        this["_mediaClip"]["audioClips"]["length"],
      v327 = v325["clip"]
        ? v325["sourceSec"]
        : v326
          ? null
          : mapMediaClipVideoSecToAudioSec(v320, v322, v323);
    if (v327 == null) {
      try {
        v324["pause"]?.();
      } catch {}
      return;
    }
    if (v325["clip"]) this["_syncAudioPreviewSourceForTimelineSec"](v320);
    const v328 = Math["abs"](toNumber(v324["currentTime"], v327) - v327),
      v329 = v321["immediate"] === true || !this["_playing"] || v328 > 0.25;
    v329 &&
      ((this["_pendingPreviewSeek"]["audio"] = v327),
      v321["immediate"] === true
        ? this["_applyPreviewSeek"]("audio", { immediate: true })
        : this["_schedulePreviewSeek"]("audio"));
    if (this["_playing"] && v324["paused"])
      try {
        v324["play"]?.()?.["catch"]?.(() => {});
      } catch {}
  }
  ["_startPlaybackLoop"](v330) {
    this["_cancelPlaybackLoop"]();
    const v331 =
        typeof requestAnimationFrame === "function"
          ? (v332) => requestAnimationFrame(v332)
          : (v333) => setTimeout(v333, 16),
      v334 = () => {
        if (!this["_playing"]) return;
        const v335 = this["_getPreviewMedia"](v330),
          v336 = this["_getPlaybackTrack"](v330);
        if (!v335 || !v336) {
          this["_pausePreviewPlayback"]();
          return;
        }
        if (v330 === "video") {
          const v337 = this["_videoTimelineClips"](v336),
            v338 = this["_clipIndexAtTimelineSec"](this["_playheadSec"], v337),
            v339 =
              v337[v338] ||
              this["_getVideoClipAtTimelineSec"](this["_playheadSec"], v337);
          if (!v339) {
            this["_pausePreviewPlayback"]();
            return;
          }
          const v340 = toNumber(v339["startSec"], 0),
            v341 = Math["max"](v340, toNumber(v339["endSec"], v340)),
            v342 = toNumber(v339["timelineStartSec"], 0),
            v343 = Math["max"](v342, toNumber(v339["timelineEndSec"], v342)),
            v344 = this["_videoClipSource"](v339, v338);
          if (this["_visualClipKind"](v339, v344) === "image") {
            const v345 =
              globalThis["performance"]?.["now"]?.() || Date["now"]();
            !this["_imagePlaybackStartedAt"] &&
              ((this["_imagePlaybackStartedAt"] = v345),
              (this["_imagePlaybackStartSec"] = Math["max"](
                v342,
                Math["min"](v343, this["_playheadSec"]),
              )),
              this["_syncVideoPreviewSourceForTimelineSec"](
                this["_imagePlaybackStartSec"],
              ));
            const v346 = Math["max"](
                0,
                (v345 - this["_imagePlaybackStartedAt"]) / 1000,
              ),
              v347 = this["_imagePlaybackStartSec"] + v346;
            if (v347 >= v343) {
              const v348 = v337[v338 + 1] || null;
              if (v348) {
                ((this["_playheadSec"] = toNumber(
                  v348["timelineStartSec"],
                  v343,
                )),
                  (this["_imagePlaybackStartedAt"] = 0),
                  (this["_imagePlaybackStartSec"] = this["_playheadSec"]),
                  this["_syncVideoPreviewSourceForTimelineSec"](
                    this["_playheadSec"],
                  ),
                  this["_syncPreviewTime"](
                    "video",
                    this["_videoSourceSecForPlayhead"](this["_playheadSec"]),
                    { immediate: true },
                  ));
                const v349 = this["_videoClipSource"](v348, v338 + 1);
                if (this["_visualClipKind"](v348, v349) !== "image") {
                  const v350 = this["_getPreviewMedia"]("video");
                  this["_syncReplacementAudioFromVideo"](this["_playheadSec"], {
                    immediate: true,
                  });
                  try {
                    v350?.["play"]?.()?.["catch"]?.(() => {});
                  } catch {}
                  void this["_playReplacementAudioFromVideo"](
                    this["_playheadSec"],
                  );
                }
                (this["_updatePlaybackVisuals"](v330),
                  this["_updatePreviewControls"](),
                  (this["_playbackRaf"] = v331(v334)));
                return;
              }
              ((this["_playheadSec"] = v343),
                this["_updatePlaybackVisuals"](v330),
                this["_updatePreviewControls"](),
                this["_pausePreviewPlayback"]());
              return;
            }
            ((this["_playheadSec"] = Math["max"](
              v342,
              Math["min"](v343, v347),
            )),
              this["_syncReplacementAudioFromVideo"](this["_playheadSec"]),
              this["_updatePlaybackVisuals"](v330),
              this["_updatePreviewControls"](),
              (this["_playbackRaf"] = v331(v334)));
            return;
          }
          this["_imagePlaybackStartedAt"] = 0;
          const v351 = toNumber(v335["currentTime"], v340);
          if (v351 >= v341) {
            const v352 = v337[v338 + 1] || null;
            if (v352) {
              ((this["_playheadSec"] = toNumber(
                v352["timelineStartSec"],
                v343,
              )),
                this["_syncVideoPreviewSourceForTimelineSec"](
                  this["_playheadSec"],
                ),
                this["_syncPreviewTime"](v330, toNumber(v352["startSec"], 0), {
                  immediate: true,
                }),
                this["_updatePlaybackVisuals"](v330),
                this["_updatePreviewControls"](),
                (this["_playbackRaf"] = v331(v334)));
              return;
            }
            ((this["_playheadSec"] = v343),
              this["_syncPreviewTime"](v330, v341, { immediate: true }),
              this["_updatePlaybackVisuals"](v330),
              this["_pausePreviewPlayback"]());
            return;
          }
          ((this["_playheadSec"] = Math["max"](
            v342,
            Math["min"](v343, v342 + (v351 - v340)),
          )),
            this["_syncReplacementAudioFromVideo"](this["_playheadSec"]),
            this["_updatePlaybackVisuals"](v330),
            this["_updatePreviewControls"](),
            (this["_playbackRaf"] = v331(v334)));
          return;
        }
        if (v330 === "audio") {
          const v353 = this["_audioTimelineClips"](v336),
            v354 = this["_audioClipIndexAtTimelineSec"](
              this["_playheadSec"],
              v353,
            ),
            v355 = v353[v354] || v353[0] || null;
          if (!v355) {
            this["_pausePreviewPlayback"]();
            return;
          }
          const v356 = toNumber(v355["startSec"], 0),
            v357 = Math["max"](v356, toNumber(v355["endSec"], v356)),
            v358 = toNumber(v355["timelineStartSec"], 0),
            v359 = Math["max"](v358, toNumber(v355["timelineEndSec"], v358)),
            v360 = toNumber(v335["currentTime"], v356);
          if (v360 >= v357) {
            const v361 = v353[v354 + 1] || null;
            if (v361) {
              ((this["_playheadSec"] = toNumber(
                v361["timelineStartSec"],
                v359,
              )),
                this["_setActiveAudioClipIndex"](v354 + 1),
                this["_syncAudioPreviewSourceForTimelineSec"](
                  this["_playheadSec"],
                ),
                this["_syncPreviewTime"](
                  "audio",
                  toNumber(v361["startSec"], 0),
                  { immediate: true },
                ),
                this["_updatePlaybackVisuals"](v330),
                this["_updatePreviewControls"](),
                (this["_playbackRaf"] = v331(v334)));
              return;
            }
            ((this["_playheadSec"] = v359),
              this["_syncPreviewTime"](v330, v357, { immediate: true }),
              this["_updatePlaybackVisuals"](v330),
              this["_pausePreviewPlayback"]());
            return;
          }
          this["_playheadSec"] = Math["max"](
            v358,
            Math["min"](v359, v358 + (v360 - v356)),
          );
        } else {
          const v362 = toNumber(v335["currentTime"], v336["startSec"]);
          if (v362 >= v336["endSec"]) {
            ((this["_playheadSec"] = v336["endSec"]),
              this["_syncPreviewTime"](v330, v336["endSec"], {
                immediate: true,
              }),
              this["_updatePlaybackVisuals"](v330),
              this["_pausePreviewPlayback"]());
            return;
          }
          this["_playheadSec"] = Math["max"](
            v336["startSec"],
            Math["min"](v336["endSec"], v362),
          );
          if (v330 === "video")
            this["_syncReplacementAudioFromVideo"](this["_playheadSec"]);
        }
        (this["_updatePlaybackVisuals"](v330),
          this["_updatePreviewControls"](),
          (this["_playbackRaf"] = v331(v334)));
      };
    this["_playbackRaf"] = v331(v334);
  }
  ["_setPreviewPlayIcon"](v363 = this["_previewPlayButton"]) {
    if (!v363) return;
    ((v363["innerHTML"] = this["_playing"]
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7z"/><path d="M13 5h4v14h-4z"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>'),
      v363["setAttribute"]("aria-label", this["_playing"] ? "暂停" : "播放"),
      (v363["title"] = this["_playing"] ? "暂停" : "播放"),
      v363["classList"]["toggle"]("is-playing", this["_playing"]));
  }
  ["_updatePreviewControls"]() {
    this["_setPreviewPlayIcon"]();
    const v364 = this["_getPlaybackKind"](),
      v365 = this["_getPlaybackTrack"](v364);
    if (this["_previewTimeLabel"] && v365) {
      const v366 = this["_timelineDisplayEnd"](v364),
        v367 = Math["max"](
          0,
          Math["min"](toNumber(this["_playheadSec"], 0), v366),
        );
      this["_previewTimeLabel"]["textContent"] =
        formatTime(v367) + " / " + formatTime(v366);
    }
  }
  ["_getPreviewMedia"](v368) {
    return v368 === "audio" ? this["_audioPreview"] : this["_videoPreview"];
  }
  ["_visualClipKind"](v369 = null, v370 = null) {
    const v371 = normalizeText(v369?.["kind"]);
    if (v371 === "image") return "image";
    const v372 = getMediaClipInputKind(v370 || {});
    return v372 === "image" ? "image" : "video";
  }
  ["_getVisualClipContextAtTimelineSec"](v373 = this["_playheadSec"]) {
    const v374 = this["_videoTimelineClips"](
        this["_mediaClip"]["tracks"]?.["video"],
      ),
      v375 = this["_clipIndexAtTimelineSec"](v373, v374),
      v376 = v374[v375] || this["_getVideoClipAtTimelineSec"](v373, v374),
      v377 = v376
        ? this["_videoClipSource"](v376, v375)
        : this["_sources"]["video"],
      v378 = this["_visualClipKind"](v376, v377);
    return { clip: v376, index: v375, source: v377, clipKind: v378 };
  }
  ["_resolveVideoPreviewSeekTarget"]() {
    const v379 = toNumber(
      this["_pendingPreviewSeek"]?.["video"],
      Number["NaN"],
    );
    if (Number["isFinite"](v379)) return Math["max"](0, v379);
    return this["_videoSourceSecForPlayhead"](this["_playheadSec"] || 0);
  }
  ["_getVideoPreviewContextAtTimelineSec"](v380 = this["_playheadSec"]) {
    const v381 = this["_getVisualClipContextAtTimelineSec"](v380),
      { clip: v382, index: v383, source: v384, clipKind: v385 } = v381,
      v386 =
        v385 === "image"
          ? resolveMediaClipImageUrl(v384)
          : resolveMediaClipVideoUrl(v384);
    return {
      clip: v382,
      index: v383,
      clipKind: v385,
      source: v384,
      url: v386,
      posterUrl: resolveMediaClipThumbUrl(v384),
      sourceSec: v382 ? this["_videoSourceSecForPlayhead"](v380) : v380,
    };
  }
  ["_syncVideoPreviewSourceForTimelineSec"](v387 = this["_playheadSec"]) {
    const v388 = this["_videoPreview"],
      v389 = this["_getVideoPreviewContextAtTimelineSec"](v387);
    if (!v389["url"]) return false;
    if (v389["clipKind"] === "image")
      return (this["_showPreviewImage"](v389["source"], v389["url"]), true);
    if (!v388) return false;
    (this["_showPreviewVideo"](v389["source"]),
      (v388["__mediaClipFallbackHost"] ??= v388["parentElement"] || null),
      (v388["__mediaClipPosterUrl"] = v389["posterUrl"]));
    if (v389["posterUrl"]) v388["poster"] = v389["posterUrl"];
    else v388["removeAttribute"]?.("poster");
    this["_applyPreviewVideoLayout"](v388["parentElement"], v389["source"]);
    const v390 = setMediaElementSource(v388, v389["url"]);
    if (v390) this["_resetPreviewSeekState"]("video");
    return ((this["_previewVideoSrc"] = v389["url"]), v390);
  }
  ["_getAudioClipContextAtTimelineSec"](
    v391 = this["_playheadSec"],
    v392 = {},
  ) {
    const v393 = this["_audioTimelineClips"](
        this["_mediaClip"]["tracks"]?.["audio"],
      ),
      v394 = toNumber(v391, 0),
      v395 = v393["findIndex"]((v396, v397) => {
        const v398 = toNumber(v396["timelineStartSec"], 0),
          v399 = Math["max"](v398, toNumber(v396["timelineEndSec"], v398));
        return v397 === v393["length"] - 1
          ? v394 >= v398 && v394 <= v399
          : v394 >= v398 && v394 < v399;
      }),
      v400 =
        v395 >= 0 || v392["nearest"] === false
          ? v395
          : this["_audioClipIndexAtTimelineSec"](v391, v393),
      v401 = v392["nearest"] === false ? null : v393[0] || null,
      v402 = v400 >= 0 ? v393[v400] || null : v401,
      v403 = v402
        ? this["_audioClipSource"](v402, v400)
        : v392["nearest"] === false
          ? null
          : this["_sources"]["audio"];
    return {
      clip: v402,
      index: v400,
      source: v403,
      url: resolveMediaClipAudioUrl(v403),
      sourceSec: v402 ? this["_audioSourceSecForPlayhead"](v391) : v391,
    };
  }
  ["_syncAudioPreviewSourceForTimelineSec"](v404 = this["_playheadSec"]) {
    const v405 = this["_audioPreview"];
    if (!v405) return false;
    const v406 = this["_getAudioClipContextAtTimelineSec"](v404);
    if (!v406["url"]) return false;
    const v407 = setMediaElementSource(v405, v406["url"]);
    if (v407) this["_resetPreviewSeekState"]("audio");
    return ((this["_previewAudioSrc"] = v406["url"]), v407);
  }
  ["_createPreviewSeekState"](v408 = {}) {
    return { lastAppliedSec: null, ...v408 };
  }
  ["_getPreviewSeekState"](v409) {
    if (!this["_previewSeekState"]) this["_previewSeekState"] = {};
    return (
      !this["_previewSeekState"][v409] &&
        (this["_previewSeekState"][v409] = this["_createPreviewSeekState"]()),
      this["_previewSeekState"][v409]
    );
  }
  ["_resetPreviewSeekState"](v410 = "") {
    const v411 = v410 ? [v410] : ["video", "audio"];
    if (!this["_previewSeekState"]) this["_previewSeekState"] = {};
    v411["forEach"]((v412) => {
      (this["_cancelPreviewSeek"](v412),
        (this["_previewSeekState"][v412] = this["_createPreviewSeekState"]()));
    });
  }
  ["_cancelPreviewSeek"](v413) {
    const v414 = this["_previewSeekRaf"]?.[v413];
    if (!v414) return;
    try {
      if (typeof cancelAnimationFrame === "function")
        cancelAnimationFrame(v414);
    } catch {}
    try {
      clearTimeout(v414);
    } catch {}
    this["_previewSeekRaf"][v413] = 0;
  }
  ["_disposePreviewMedia"](v415 = "") {
    (!v415 || v415 === this["_getPlaybackKind"]()) &&
      this["_pausePreviewPlayback"]({ updateControls: false });
    const v416 = !v415 || v415 === "video",
      v417 = !v415 || v415 === "video" || v415 === "image",
      v418 = !v415 || v415 === "audio";
    v416 &&
      (this["_resetPreviewSeekState"]("video"),
      disposeMediaElement(this["_videoPreview"]),
      this["_videoPreview"]?.["remove"]?.(),
      (this["_videoPreview"] = null),
      (this["_previewVideoSrc"] = ""));
    if (v417) {
      (this["_imagePreview"]?.["remove"]?.(), (this["_imagePreview"] = null));
      if (this["_previewVisualKind"] === "image")
        this["_previewVisualKind"] = "";
    }
    v418 &&
      (this["_resetPreviewSeekState"]("audio"),
      disposeMediaElement(this["_audioPreview"]),
      this["_audioPreview"]?.["remove"]?.(),
      (this["_audioPreview"] = null),
      (this["_previewAudioSrc"] = ""));
  }
  ["_schedulePreviewSeek"](v419) {
    if (this["_previewSeekRaf"][v419]) return;
    const v420 =
      typeof requestAnimationFrame === "function"
        ? (v421) => requestAnimationFrame(v421)
        : (v422) => setTimeout(v422, 16);
    this["_previewSeekRaf"][v419] = v420(() => {
      ((this["_previewSeekRaf"][v419] = 0), this["_applyPreviewSeek"](v419));
    });
  }
  ["_applyPreviewSeek"](v423, v424 = {}) {
    if (v423 === "video" && this["_previewVisualKind"] === "image") {
      this["_updatePreviewControls"]();
      return;
    }
    const v425 = this["_getPreviewMedia"](v423),
      v426 = Math["max"](0, toNumber(this["_pendingPreviewSeek"][v423], 0));
    if (!v425) return;
    if (v425["readyState"] < 1) {
      !v425["__mediaClipSeekPending"] &&
        ((v425["__mediaClipSeekPending"] = true),
        v425["addEventListener"](
          "loadedmetadata",
          () => {
            ((v425["__mediaClipSeekPending"] = false),
              this["_applyPreviewSeek"](v423, v424));
          },
          { once: true },
        ));
      return;
    }
    const v427 = this["_getPreviewSeekState"](v423),
      v428 = v424["immediate"] === true,
      v429 =
        Number["isFinite"](v425["duration"]) && v425["duration"] > 0
          ? Math["min"](v426, v425["duration"])
          : v426,
      v430 = toNumber(v425["currentTime"], v429),
      v431 = toNumber(v427["lastAppliedSec"], Number["NaN"]);
    if (
      !v428 &&
      (Math["abs"](v430 - v429) < PREVIEW_SCRUB_SEEK_EPSILON_SEC ||
        (Number["isFinite"](v431) &&
          Math["abs"](v429 - v431) < PREVIEW_SCRUB_SEEK_EPSILON_SEC))
    ) {
      this["_updatePreviewControls"]();
      return;
    }
    try {
      ((v425["currentTime"] = v429), (v427["lastAppliedSec"] = v429));
    } catch {}
    if (v423 === "video")
      this["_syncReplacementAudioFromVideo"](v429, { immediate: true });
    this["_updatePreviewControls"]();
  }
  ["_syncPreviewTime"](v432, v433, v434 = {}) {
    const v435 = Math["max"](0, toNumber(v433, 0));
    this["_pendingPreviewSeek"][v432] = v435;
    if (v432 === "video" && this["_previewVisualKind"] === "image") {
      this["_updatePreviewControls"]();
      return;
    }
    if (!this["_getPreviewMedia"](v432)) return;
    if (v434["immediate"] === true) {
      (this["_cancelPreviewSeek"](v432),
        this["_applyPreviewSeek"](v432, { immediate: true }));
      return;
    }
    this["_schedulePreviewSeek"](v432);
  }
  ["_render"]() {
    if (!this["el"]) return;
    this["_removeMaterialMenuPortal"]();
    const v436 = !!(
        this["_mediaClip"]["tracks"]?.["video"] ||
        this["_mediaClip"]["tracks"]?.["audio"]
      ),
      v437 = v436 && this["_mediaClip"]["expanded"] === true;
    v437
      ? this["_claimExpandedEditor"]()
      : ((this["_materialMenu"] = null),
        this["_releaseExpandedEditor"](),
        this["_disposePreviewMedia"]());
    (this["el"]["replaceChildren"](),
      this["el"]["classList"]["toggle"]("is-picking", this["_isPicking"]()),
      this["el"]["classList"]["toggle"]("is-expanded", v437),
      this["_syncHostPresentation"](v437),
      this["_syncDocumentExitListener"](v437),
      this["_syncMaterialMenuDismissListener"](v437 && !!this["_materialMenu"]),
      this["_syncDocumentKeyListener"](v437),
      this["_syncDeleteMaterialShortcutListener"](v437));
    if (!v436) {
      this["el"]["appendChild"](this["_renderEmpty"]());
      return;
    }
    (v437
      ? this["el"]["append"](
          this["_renderCompact"](),
          this["_renderPreviewPanel"](),
        )
      : this["el"]["appendChild"](this["_renderCompact"]()),
      v437 && this["_materialMenu"] && this["_renderMaterialMenuPortal"](),
      this["_exporting"] && this["_startExportLoading"]());
  }
  ["_rerenderCompactOnly"]() {
    if (!this["el"]) return false;
    const v438 = this["el"]["querySelector"]?.(".media-clip-compact"),
      v439 = v438?.["parentNode"];
    if (!v438 || !v439) return (this["_render"](), false);
    this["_removeMaterialMenuPortal"]();
    const v440 = this["_renderCompact"]();
    if (typeof v439["replaceChild"] === "function")
      v439["replaceChild"](v440, v438);
    else {
      if (Array["isArray"](v439["children"])) {
        const v441 = v439["children"]["indexOf"](v438);
        v441 >= 0 &&
          ((v440["parentNode"] = v439),
          (v438["parentNode"] = null),
          v439["children"]["splice"](v441, 1, v440));
      }
    }
    const v442 = !!(
        this["_mediaClip"]["tracks"]?.["video"] ||
        this["_mediaClip"]["tracks"]?.["audio"]
      ),
      v443 = v442 && this["_mediaClip"]["expanded"] === true;
    return (
      this["_syncDocumentExitListener"](v443),
      this["_syncMaterialMenuDismissListener"](v443 && !!this["_materialMenu"]),
      this["_syncDocumentKeyListener"](v443),
      this["_syncDeleteMaterialShortcutListener"](v443),
      v443 && this["_materialMenu"] && this["_renderMaterialMenuPortal"](),
      true
    );
  }
  ["_syncHostPresentation"](v444) {
    const v445 = () => {
      const v446 =
        this["el"]?.["closest"]?.(".v2-node-component") ||
        this["el"]?.["parentElement"];
      v446?.["style"] && (v446["style"]["overflow"] = "visible");
      const v447 = document["getElementById"](this["id"]);
      if (!v447?.["style"]) return;
      v447["classList"]["toggle"]("media-clip-expanded-host", v444 === true);
      if (v444 === true) {
        v447["style"]["zIndex"] = MEDIA_CLIP_EXPANDED_HOST_Z_INDEX;
        return;
      }
      v447["style"]["zIndex"] =
        v447["classList"]["contains"]("selected") ||
        v447["classList"]["contains"]("v2-selected")
          ? "100"
          : "10";
    };
    (v445(),
      !this["el"]?.["parentElement"] &&
        typeof requestAnimationFrame === "function" &&
        requestAnimationFrame(v445));
  }
  ["_syncDocumentExitListener"](v448) {
    if (typeof document === "undefined") return;
    if (!v448) {
      this["_onDocumentPointerDown"] &&
        (document["removeEventListener"](
          "pointerdown",
          this["_onDocumentPointerDown"],
          true,
        ),
        (this["_onDocumentPointerDown"] = null));
      return;
    }
    if (this["_onDocumentPointerDown"]) return;
    ((this["_onDocumentPointerDown"] = (v449) => {
      if (this["_mediaClip"]["expanded"] !== true) return;
      const v450 = document["getElementById"](this["id"]);
      if (this["el"]?.["contains"]?.(v449["target"])) return;
      if (this["_materialMenuEl"]?.["contains"]?.(v449["target"])) return;
      if (v450?.["contains"]?.(v449["target"])) {
        (v449["preventDefault"]?.(), v449["stopPropagation"]?.());
        return;
      }
      this["_setExpanded"](false);
    }),
      document["addEventListener"](
        "pointerdown",
        this["_onDocumentPointerDown"],
        true,
      ));
  }
  ["_syncMaterialMenuDismissListener"](v451) {
    if (typeof document === "undefined") return;
    if (!v451) {
      this["_onMaterialMenuPointerDown"] &&
        (document["removeEventListener"](
          "pointerdown",
          this["_onMaterialMenuPointerDown"],
          true,
        ),
        (this["_onMaterialMenuPointerDown"] = null));
      return;
    }
    if (this["_onMaterialMenuPointerDown"]) return;
    ((this["_onMaterialMenuPointerDown"] = (v452) => {
      if (!this["_materialMenu"]) return;
      if (v452?.["button"] === 2) return;
      if (this["_materialMenuEl"]?.["contains"]?.(v452["target"])) return;
      this["_closeMaterialMenu"]();
    }),
      document["addEventListener"](
        "pointerdown",
        this["_onMaterialMenuPointerDown"],
        true,
      ));
  }
  ["_removeMaterialMenuPortal"]() {
    (this["_materialMenuEl"]?.["parentNode"]?.["removeChild"]?.(
      this["_materialMenuEl"],
    ),
      (this["_materialMenuEl"] = null));
  }
  ["_closeMaterialMenu"](v453 = {}) {
    if (!this["_materialMenu"] && !this["_materialMenuEl"]) return;
    ((this["_materialMenu"] = null),
      this["_syncMaterialMenuDismissListener"](false),
      this["_removeMaterialMenuPortal"]());
    if (v453["render"] === true) this["_render"]();
  }
  ["_materialMenuHost"]() {
    return (
      this["el"]?.["querySelector"]?.(".media-clip-compact.is-editing") ||
      this["el"]?.["querySelector"]?.(".media-clip-compact") ||
      this["el"] ||
      null
    );
  }
  ["_materialMenuLocalPoint"](v454, v455, v456 = this["_materialMenuHost"]()) {
    const v457 = v456?.["getBoundingClientRect"]?.() || {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      },
      v458 = readLayoutWidthPx(v456, v457["width"] || 1),
      v459 =
        toNumber(v456?.["offsetHeight"], 0) ||
        parseFloat(v456?.["style"]?.["getPropertyValue"]?.("height")) ||
        v457["height"] ||
        1,
      v460 = v457["width"] > 0 && v458 > 0 ? v457["width"] / v458 : 1,
      v461 = v457["height"] > 0 && v459 > 0 ? v457["height"] / v459 : v460;
    return {
      x:
        (toNumber(v454, v457["left"]) - toNumber(v457["left"], 0)) /
        (v460 || 1),
      y: (toNumber(v455, v457["top"]) - toNumber(v457["top"], 0)) / (v461 || 1),
    };
  }
  ["_renderMaterialMenuPortal"]() {
    if (typeof document === "undefined" || !this["_materialMenu"]) return;
    const v462 = this["_materialMenuHost"]();
    if (!v462) return;
    const v463 = this["_renderMaterialMenu"]();
    ((this["_materialMenuEl"] = v463),
      v462["appendChild"](v463),
      this["_positionMaterialMenu"](v463, v462));
  }
  ["_positionMaterialMenu"](v464, v465 = this["_materialMenuHost"]()) {
    if (!v464) return;
    const v466 = this["_materialMenu"] || {},
      v467 = 8,
      v468 = toNumber(v466["x"] ?? v466["left"], v467),
      v469 = toNumber(v466["y"] ?? v466["top"], v467),
      v470 = v465?.["getBoundingClientRect"]?.() || {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      },
      v471 = readLayoutWidthPx(v465, v470["width"] || 1),
      v472 =
        toNumber(v465?.["offsetHeight"], 0) ||
        parseFloat(v465?.["style"]?.["getPropertyValue"]?.("height")) ||
        v470["height"] ||
        1,
      v473 = v470["width"] > 0 && v471 > 0 ? v470["width"] / v471 : 1,
      v474 = v470["height"] > 0 && v472 > 0 ? v470["height"] / v472 : v473,
      v475 = toNumber(v464["offsetWidth"], 0),
      v476 = toNumber(v464["offsetHeight"], 0),
      v477 =
        typeof window !== "undefined" ? toNumber(window["innerWidth"], 0) : 0,
      v478 =
        typeof window !== "undefined" ? toNumber(window["innerHeight"], 0) : 0,
      v479 =
        v477 > 0 && v473 > 0
          ? Math["max"](v467, (v477 - v470["left"]) / v473 - v475 - v467)
          : v468,
      v480 =
        v478 > 0 && v474 > 0
          ? Math["max"](v467, (v478 - v470["top"]) / v474 - v476 - v467)
          : v469;
    ((v464["style"]["left"] =
      Math["min"](v479, Math["max"](v467, v468)) + "px"),
      (v464["style"]["top"] =
        Math["min"](v480, Math["max"](v467, v469)) + "px"));
  }
  ["_isEditableEventTarget"](v481) {
    return !!v481?.["closest"]?.(
      'input, textarea, select, [contenteditable="true"], [role="textbox"]',
    );
  }
  ["_syncDocumentKeyListener"](v482) {
    if (typeof document === "undefined") return;
    if (!v482) {
      this["_onDocumentKeyDown"] &&
        (document["removeEventListener"](
          "keydown",
          this["_onDocumentKeyDown"],
          true,
        ),
        (this["_onDocumentKeyDown"] = null));
      return;
    }
    if (this["_onDocumentKeyDown"]) return;
    ((this["_onDocumentKeyDown"] = (v483) =>
      this["_handleDocumentKeyDown"](v483)),
      document["addEventListener"](
        "keydown",
        this["_onDocumentKeyDown"],
        true,
      ));
  }
  ["_syncDeleteMaterialShortcutListener"](v484) {
    if (typeof window === "undefined") return;
    if (!v484) {
      this["_onDeleteMaterialShortcut"] &&
        (window["removeEventListener"](
          MEDIA_CLIP_DELETE_MATERIAL_EVENT,
          this["_onDeleteMaterialShortcut"],
        ),
        (this["_onDeleteMaterialShortcut"] = null));
      return;
    }
    if (this["_onDeleteMaterialShortcut"]) return;
    ((this["_onDeleteMaterialShortcut"] = (v485) => {
      const v486 = normalizeText(v485?.["detail"]?.["nodeId"]);
      if (v486 && v486 !== this["id"]) return;
      if (this["_mediaClip"]["expanded"] !== true) return;
      this["_deleteActiveMaterialFromShortcut"]();
    }),
      window["addEventListener"](
        MEDIA_CLIP_DELETE_MATERIAL_EVENT,
        this["_onDeleteMaterialShortcut"],
      ));
  }
  ["_deleteActiveMaterialFromShortcut"]() {
    const v487 =
      typeof performance !== "undefined" &&
      typeof performance["now"] === "function"
        ? performance["now"]()
        : Date["now"]();
    if (v487 - this["_lastDeleteMaterialShortcutAt"] < 80) return;
    ((this["_lastDeleteMaterialShortcutAt"] = v487),
      this["_deleteActiveMaterial"]());
  }
  ["_handleDocumentKeyDown"](v488) {
    if (this["_mediaClip"]["expanded"] !== true) return;
    if (this["_isEditableEventTarget"](v488?.["target"])) return;
    const v489 = normalizeText(v488?.["key"])["toLowerCase"]();
    if (v488?.["key"] === "Escape" && this["_materialMenu"]) {
      (v488["preventDefault"]?.(),
        v488["stopPropagation"]?.(),
        this["_closeMaterialMenu"]());
      return;
    }
    if (v488?.["key"] === "\x20" || v488?.["code"] === "Space") {
      (v488["preventDefault"]?.(),
        v488["stopPropagation"]?.(),
        void this["_togglePreviewPlayback"](v488));
      return;
    }
    if (
      v489 === "c" &&
      !v488?.["ctrlKey"] &&
      !v488?.["metaKey"] &&
      !v488?.["altKey"]
    ) {
      (v488["preventDefault"]?.(),
        v488["stopPropagation"]?.(),
        v488["stopImmediatePropagation"]?.(),
        this["_splitActiveMaterial"]());
      return;
    }
    (v488?.["key"] === "Delete" || v488?.["key"] === "Backspace") &&
      (v488["preventDefault"]?.(),
      v488["stopPropagation"]?.(),
      v488["stopImmediatePropagation"]?.(),
      this["_deleteActiveMaterialFromShortcut"]());
  }
  ["_renderPickButton"]() {
    const v490 = document["createElement"]("button");
    return (
      (v490["type"] = "button"),
      (v490["className"] = "media-clip-pick-btn"),
      v490["classList"]["toggle"]("is-active", this["_isPicking"]()),
      (v490["title"] = "鼠标连线添加片段"),
      v490["setAttribute"]("aria-label", "鼠标连线添加片段"),
      v490["appendChild"](createConnectCursorIcon()),
      v490["addEventListener"]("click", (v491) =>
        this["_togglePickConnect"](v491),
      ),
      v490
    );
  }
  ["_renderEmpty"]() {
    const v492 = document["createElement"]("div");
    v492["className"] = "media-clip-empty";
    const v493 = document["createElement"]("div");
    v493["className"] = "media-clip-empty-body";
    const v494 = document["createElement"]("button");
    ((v494["type"] = "button"),
      (v494["className"] = "media-clip-pick-btn"),
      v494["classList"]["toggle"]("is-active", this["_isPicking"]()),
      (v494["title"] = "鼠标连线添加片段"),
      v494["setAttribute"]("aria-label", "鼠标连线添加片段"),
      v494["appendChild"](createConnectCursorIcon()),
      v494["addEventListener"]("click", (v495) =>
        this["_togglePickConnect"](v495),
      ),
      v493["appendChild"](v494));
    const v496 = document["createElement"]("div");
    ((v496["className"] = "media-clip-empty-copy"),
      v496["classList"]["toggle"]("is-picking", this["_isPicking"]()));
    const v497 = document["createElement"]("div");
    ((v497["textContent"] = this["_isPicking"]()
      ? "选择要添加的片段"
      : "轻点鼠标连线按钮，在画布上选取视频、图片或者音频"),
      v496["appendChild"](v497));
    if (this["_isPicking"]()) {
      const v498 = document["createElement"]("div");
      ((v498["className"] = "media-clip-esc"),
        (v498["textContent"] = "ESC 退出"),
        v496["appendChild"](v498));
    }
    return (v493["appendChild"](v496), v492["appendChild"](v493), v492);
  }
  ["_renderCompact"]() {
    const v499 = this["_mediaClip"]["expanded"] === true,
      v500 = document["createElement"]("div");
    ((v500["className"] = "media-clip-compact"),
      v500["classList"]["toggle"]("is-editing", v499),
      v500["classList"]["toggle"]("is-menu-open", this["_menuOpen"] === true));
    const v501 = document["createElement"]("div");
    v501["className"] = "media-clip-compact-body";
    const v502 = document["createElement"]("div");
    ((v502["className"] = "media-clip-timeline-scroll"),
      this["_primeTimelineScroll"](v502),
      v502["addEventListener"]("click", () => {
        if (this["_mediaClip"]["expanded"] === true) return;
        this["_setExpanded"](true);
      }),
      this["_bindTimelineScroll"](v502));
    const v503 = document["createElement"]("div");
    ((v503["className"] = "media-clip-compact-timeline"),
      v503["classList"]["toggle"]("is-editing", v499));
    const v504 = this["_timelineTrackContentWidth"]({ compact: !v499 }),
      v505 = this["_timelineAddSlotLeftPx"](v504),
      v506 = this["_timelineContentWidth"](v504);
    (v503["style"]["setProperty"](
      "--media-clip-track-content-width",
      v504 + "px",
    ),
      v503["style"]["setProperty"](
        "--media-clip-timeline-content-width",
        v506 + "px",
      ),
      v503["style"]["setProperty"]("--media-clip-add-left", v505 + "px"),
      v503["appendChild"](
        this["_renderRuler"](this["_primaryDuration"](), {
          compact: !v499,
          timelineWidthPx: v504,
        }),
      ));
    const v507 = document["createElement"]("div");
    ((v507["className"] = "media-clip-timeline-lane"),
      v507["classList"]["toggle"](
        "has-audio-track",
        !!this["_mediaClip"]["tracks"]["audio"],
      ),
      v507["addEventListener"]("pointerleave", () => {
        if (this["_timelineDrag"]()) return;
        (this["_clearTimelineHoverState"](v507),
          this["_restoreTimelinePlayheads"]());
      }));
    const v508 = document["createElement"]("div");
    ((v508["className"] = "media-clip-timeline-tracks"),
      v508["classList"]["toggle"](
        "has-audio-track",
        !!this["_mediaClip"]["tracks"]["audio"],
      ));
    this["_mediaClip"]["tracks"]["video"] &&
      v508["appendChild"](
        this["_renderTrack"]("video", {
          compact: !v499,
          timelineWidthPx: v504,
        }),
      );
    this["_mediaClip"]["tracks"]["audio"] &&
      v508["appendChild"](
        this["_renderTrack"]("audio", {
          compact: !v499,
          timelineWidthPx: v504,
        }),
      );
    const v509 = this["_renderShortcutCropButton"](),
      v510 = this["_renderPickButton"]();
    return (
      v510["classList"]["add"]("media-clip-add-btn"),
      (v510["title"] = "继续添加片段"),
      v510["setAttribute"]("aria-label", "继续添加片段"),
      v507["append"](v508, v510),
      v503["appendChild"](v507),
      v499 &&
        (this["_bindTimelinePointerCursors"](v503, v508),
        v503["appendChild"](
          this["_renderTimelineCursors"](this["_primaryDuration"]()),
        )),
      v502["appendChild"](v503),
      this["_primeTimelineScroll"](v502),
      v501["append"](v502),
      v500["append"](v501, v509),
      v499 &&
        (v500["appendChild"](this["_renderTimelineHintCarousel"]()),
        v500["appendChild"](this["_renderTimelineTools"]())),
      v500
    );
  }
  ["_primeTimelineScroll"](v511) {
    if (!v511) return 0;
    const v512 = Math["max"](
        0,
        toNumber(
          this["_timelineScrollLeft"],
          this["_timelineView"]?.["scrollLeft"] || 0,
        ),
      ),
      v513 = this["_timelineViewportWidth"](),
      v514 = this["_timelineTrackContentWidth"](),
      v515 = Math["max"](0, this["_timelineContentWidth"](v514) - v513),
      v516 = this["_clampTimelineScrollLeft"](v511, v512, {
        maxScrollPx: v515,
        trackWidthPx: v514,
        viewportWidthPx: v513,
      });
    ((this["_restoringTimelineScroll"] = v511),
      (v511["scrollLeft"] = v516),
      this["_syncTimelineScrollFade"](v511));
    const v517 = () => {
      this["_restoringTimelineScroll"] === v511 &&
        (this["_restoringTimelineScroll"] = null);
    };
    if (typeof requestAnimationFrame === "function")
      requestAnimationFrame(v517);
    else setTimeout(v517, 0);
    return v516;
  }
  ["_bindTimelineScroll"](v518) {
    if (!v518) return;
    (v518["addEventListener"](
      "wheel",
      (v519) => {
        if (v519["ctrlKey"] || v519["metaKey"]) {
          this["_handleTimelineZoomWheel"](v518, v519);
          return;
        }
        const v520 = Math["max"](0, v518["scrollWidth"] - v518["clientWidth"]);
        if (v520 <= 0) {
          this["_mediaClip"]["expanded"] === true &&
            (v519["preventDefault"](), v519["stopPropagation"]());
          return;
        }
        const v521 =
          Math["abs"](v519["deltaX"]) > Math["abs"](v519["deltaY"])
            ? v519["deltaX"]
            : v519["deltaY"];
        if (!v521) return;
        if (
          this["_shouldLockTimelineWheelScroll"](v518, { maxScrollPx: v520 })
        ) {
          (v519["preventDefault"](), v519["stopPropagation"]());
          Math["abs"](v518["scrollLeft"]) > 0.5 &&
            ((v518["scrollLeft"] = 0),
            this["_updateTimelineView"](
              { scrollLeft: 0 },
              { persist: true, renderOnPersist: false },
            ));
          this["_syncTimelineScrollFade"](v518);
          return;
        }
        (v519["preventDefault"](),
          v519["stopPropagation"](),
          (v518["scrollLeft"] = this["_clampTimelineScrollLeft"](
            v518,
            v518["scrollLeft"] + v521,
            { maxScrollPx: v520 },
          )),
          this["_updateTimelineView"](
            { scrollLeft: v518["scrollLeft"] },
            { persist: true, renderOnPersist: false },
          ),
          this["_syncTimelineScrollFade"](v518));
      },
      { passive: false },
    ),
      v518["addEventListener"]("scroll", () => {
        const v522 = this["_clampTimelineScrollLeft"](v518, v518["scrollLeft"]);
        if (Math["abs"](v522 - v518["scrollLeft"]) > 0.5) {
          v518["scrollLeft"] = v522;
          return;
        }
        (this["_updateTimelineView"](
          { scrollLeft: v522 },
          {
            persist:
              this["_restoringTimelineScroll"] !== v518 &&
              !this["_timelineDrag"](),
            renderOnPersist: false,
          },
        ),
          this["_syncTimelineScrollFade"](v518));
      }));
    const v523 = () => {
      const v524 = Math["max"](0, v518["scrollWidth"] - v518["clientWidth"]);
      ((this["_restoringTimelineScroll"] = v518),
        (v518["scrollLeft"] = this["_clampTimelineScrollLeft"](
          v518,
          this["_timelineScrollLeft"],
          { maxScrollPx: v524 },
        )),
        this["_syncTimelineScrollFade"](v518));
      const v525 = () => {
        this["_restoringTimelineScroll"] === v518 &&
          (this["_restoringTimelineScroll"] = null);
      };
      if (typeof requestAnimationFrame === "function")
        requestAnimationFrame(v525);
      else setTimeout(v525, 0);
    };
    if (typeof requestAnimationFrame === "function")
      requestAnimationFrame(v523);
    else setTimeout(v523, 0);
  }
  ["_shouldLockTimelineWheelScroll"](v526, v527 = {}) {
    if (!v526) return false;
    const v528 = Math["max"](
        0,
        toNumber(
          v527["maxScrollPx"],
          v526["scrollWidth"] - v526["clientWidth"],
        ),
      ),
      v529 = Math["max"](
        1,
        toNumber(v527["viewportWidthPx"], v526["clientWidth"]),
      ),
      v530 = Math["max"](
        0,
        toNumber(v527["trackWidthPx"], this["_timelineTrackContentWidth"]()),
      );
    return shouldLockMediaClipTimelineWheelScroll({
      trackWidthPx: v530,
      viewportWidthPx: v529,
      maxScrollPx: v528,
    });
  }
  ["_timelineMaterialRangeSec"]() {
    const v531 = [],
      v532 = (v533, v534) => {
        const v535 = Math["max"](0, toNumber(v533, 0)),
          v536 = Math["max"](v535, toNumber(v534, v535));
        if (v536 > v535) v531["push"]({ startSec: v535, endSec: v536 });
      },
      v537 = this["_mediaClip"]?.["tracks"]?.["video"] || null,
      v538 = this["_videoTimelineClips"](v537);
    if (v538["length"])
      v538["forEach"]((v539) => {
        v532(v539["timelineStartSec"], v539["timelineEndSec"]);
      });
    else v537 && v532(v537["startSec"], v537["endSec"] || v537["durationSec"]);
    const v540 = this["_mediaClip"]?.["tracks"]?.["audio"] || null;
    if (v540) {
      const v541 = this["_audioTimelineClips"](v540);
      v541["length"]
        ? v541["forEach"]((v542) => {
            v532(v542["timelineStartSec"], v542["timelineEndSec"]);
          })
        : v532(v540["startSec"], v540["endSec"] || v540["durationSec"]);
    }
    if (!v531["length"]) return { startSec: 0, endSec: 0 };
    return v531["reduce"](
      (v543, v544) => ({
        startSec: Math["min"](v543["startSec"], v544["startSec"]),
        endSec: Math["max"](v543["endSec"], v544["endSec"]),
      }),
      { startSec: v531[0]["startSec"], endSec: v531[0]["endSec"] },
    );
  }
  ["_timelineMaterialScrollBounds"](v545, v546 = {}) {
    const v547 = Math["max"](
        1,
        toNumber(
          v546["viewportWidthPx"],
          v545?.["clientWidth"] || this["_timelineViewportWidth"](),
        ),
      ),
      v548 = Math["max"](
        0,
        toNumber(v546["maxScrollPx"], (v545?.["scrollWidth"] || 0) - v547),
      );
    if (v548 <= 0) return { minScrollLeft: 0, maxScrollLeft: 0 };
    const v549 = this["_timelineMaterialRangeSec"]();
    if (!(v549["endSec"] > v549["startSec"]))
      return { minScrollLeft: 0, maxScrollLeft: v548 };
    const v550 = getMediaClipTimelineDisplayDuration(
        v546["displayDurationSec"] ?? this["_primaryDuration"](),
      ),
      v551 = Math["max"](
        1,
        toNumber(v546["trackWidthPx"], this["_timelineTrackContentWidth"]()),
      ),
      v552 = getMediaClipTimelineRangeRect({
        startSec: v549["startSec"],
        endSec: v549["endSec"],
        durationSec: v550,
        trackWidthPx: v551,
        minWidthPct: 0,
      }),
      v553 = Math["max"](0, toNumber(v552["leftPx"], 0)),
      v554 = Math["max"](v553, v553 + toNumber(v552["widthPx"], 0)),
      v555 =
        this["_timelineAddSlotLeftPx"](v551, {
          displayDurationSec: v550,
          materialEndSec: v549["endSec"],
        }) + MEDIA_CLIP_TIMELINE_ADD_SLOT_WIDTH_PX,
      v556 = Math["max"](v554, v555),
      v557 = Math["max"](0, v554 - v553);
    let v558 = 0,
      v559 = v548;
    if (v557 < v547) {
      v559 = Math["min"](v548, v553);
      const v560 = Math["max"](0, v556 - v547),
        v561 = Math["max"](0, v554 - v547);
      v558 = Math["min"](v548, v560 <= v559 ? v560 : v561);
    } else
      ((v558 = Math["min"](v548, Math["max"](0, v553))),
        (v559 = Math["min"](v548, Math["max"](0, v556 - v547))));
    return (
      (v558 = Math["max"](0, Math["min"](v548, v558))),
      (v559 = Math["max"](v558, Math["min"](v548, v559))),
      { minScrollLeft: v558, maxScrollLeft: v559 }
    );
  }
  ["_clampTimelineScrollLeft"](v562, v563 = 0, v564 = {}) {
    if (!v562) return 0;
    const v565 = Math["max"](
      0,
      toNumber(v564["maxScrollPx"], v562["scrollWidth"] - v562["clientWidth"]),
    );
    if (
      this["_shouldLockTimelineWheelScroll"](v562, {
        ...v564,
        maxScrollPx: v565,
      })
    )
      return 0;
    const v566 = this["_timelineMaterialScrollBounds"](v562, {
      ...v564,
      maxScrollPx: v565,
    });
    return Math["max"](
      v566["minScrollLeft"],
      Math["min"](v566["maxScrollLeft"], toNumber(v563, 0)),
    );
  }
  ["_handleTimelineZoomWheel"](v567, v568) {
    if (!v567) return;
    const v569 = Number(v568["deltaX"]) || 0,
      v570 = Number(v568["deltaY"]) || 0,
      v571 = Math["abs"](v569) > Math["abs"](v570) ? v569 : v570;
    if (!v571) return;
    (v568["preventDefault"](), v568["stopPropagation"]());
    const v572 = normalizeMediaClipTimelineView(this["_timelineView"]),
      v573 = getMediaClipTimelineNextZoom({
        currentZoom: v572["zoom"],
        delta: v571,
        minZoom: MEDIA_CLIP_TIMELINE_ZOOM_MIN,
        maxZoom: MEDIA_CLIP_TIMELINE_ZOOM_MAX,
      });
    if (Math["abs"](v573 - v572["zoom"]) < 0.001) return;
    const v574 = v567["getBoundingClientRect"]?.() || {
        left: 0,
        width: v567["clientWidth"] || 0,
      },
      v575 = Math["max"](1, v567["clientWidth"] || v574["width"] || 1),
      v576 = Math["max"](
        0,
        Math["min"](
          v575,
          Number["isFinite"](v568["clientX"])
            ? v568["clientX"] - (v574["left"] || 0)
            : v575 / 2,
        ),
      ),
      v577 = this["_timelineTrackContentWidth"]({ timelineZoom: v572["zoom"] }),
      v578 = getMediaClipTimelineDisplayDuration(
        this["_primaryDuration"]({ timelineZoom: v572["zoom"] }),
      ),
      v579 = Math["max"](
        0,
        Math["min"](
          v578,
          ((Math["max"](0, v567["scrollLeft"] || 0) + v576) /
            Math["max"](1, v577)) *
            v578,
        ),
      );
    this["_updateTimelineView"]({ zoom: v573 }, { persist: false });
    const v580 = this["_timelineTrackContentWidth"]({ timelineZoom: v573 }),
      v581 = getMediaClipTimelineDisplayDuration(
        this["_primaryDuration"]({ timelineZoom: v573 }),
      ),
      v582 = this["_timelineContentWidth"](v580);
    this["_syncTimelineContentWidth"](v580);
    this["_mediaClip"]["tracks"]?.["video"] &&
      this["_updateTrackVisuals"]("video", {
        durationSec: this["_videoTimelineDuration"](
          this["_mediaClip"]["tracks"]["video"],
          null,
          { timelineZoom: v573 },
        ),
        syncTimelineWidth: false,
      });
    this["_mediaClip"]["tracks"]?.["audio"] &&
      this["_updateTrackVisuals"]("audio", {
        durationSec: this["_timelineDurationForKind"]("audio", {
          timelineZoom: v573,
        }),
        syncTimelineWidth: false,
      });
    const v583 = Math["max"](0, v582 - v575),
      v584 = this["_clampTimelineScrollLeft"](
        v567,
        getMediaClipTimelineZoomScrollLeft({
          anchorSec: v579,
          anchorX: v576,
          durationSec: v581,
          trackWidthPx: v580,
          nextContentWidthPx: v582,
          viewportWidthPx: v575,
        }),
        { trackWidthPx: v580, viewportWidthPx: v575, maxScrollPx: v583 },
      );
    ((v567["scrollLeft"] = v584),
      this["_updateTimelineView"](
        { scrollLeft: v584 },
        { persist: true, renderOnPersist: false },
      ),
      this["_syncTimelineScrollFade"](v567));
  }
  ["_syncTimelineScrollFade"](v585) {
    if (!v585) return;
    const v586 = Math["max"](0, v585["scrollWidth"] - v585["clientWidth"]),
      v587 = this["_timelineMaterialScrollBounds"](v585, { maxScrollPx: v586 }),
      v588 =
        !this["_shouldLockTimelineWheelScroll"](v585, { maxScrollPx: v586 }) &&
        v587["maxScrollLeft"] > v587["minScrollLeft"] + 1 &&
        v585["scrollLeft"] < v587["maxScrollLeft"] - 2;
    v585["classList"]["toggle"]("has-right-overflow", v588);
  }
  ["_timelineDragScrollDeltaPx"](v589 = this["_timelineDrag"]()) {
    const v590 = v589?.["scrollEl"];
    if (!v590) return 0;
    return (
      toNumber(v590["scrollLeft"], 0) - toNumber(v589["startScrollLeft"], 0)
    );
  }
  ["_timelineDragDeltaPx"](v591 = this["_timelineDrag"](), v592 = {}) {
    const v593 = toNumber(
      v592?.["clientX"],
      toNumber(v591?.["latestClientX"], v591?.["startX"]),
    );
    return (
      v593 -
      toNumber(v591?.["startX"], v593) +
      this["_timelineDragScrollDeltaPx"](v591)
    );
  }
  ["_timelineDragAutoScrollVelocity"](v594, v595) {
    if (!v594 || !Number["isFinite"](v595)) return 0;
    const v596 = Math["max"](0, v594["scrollWidth"] - v594["clientWidth"]);
    if (v596 <= 0) return 0;
    const v597 = v594["getBoundingClientRect"]?.() || {},
      v598 = toNumber(v597["left"], 0),
      v599 = Math["max"](1, toNumber(v597["width"], v594["clientWidth"] || 1)),
      v600 = toNumber(v597["right"], v598 + v599);
    if (v595 < v598 + TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX) {
      const v601 = Math["max"](
        0,
        Math["min"](
          1,
          (v598 + TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX - v595) /
            TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX,
        ),
      );
      return -TIMELINE_DRAG_AUTO_SCROLL_MAX_PX * v601;
    }
    if (v595 > v600 - TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX) {
      const v602 = Math["max"](
        0,
        Math["min"](
          1,
          (v595 - (v600 - TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX)) /
            TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX,
        ),
      );
      return TIMELINE_DRAG_AUTO_SCROLL_MAX_PX * v602;
    }
    return 0;
  }
  ["_scheduleTimelineDragAutoScroll"](v603 = this["_timelineDrag"]()) {
    const v604 = v603?.["scrollEl"],
      v605 = toNumber(v603?.["latestClientX"], Number["NaN"]);
    if (!v604 || !Number["isFinite"](v605)) return;
    if (!this["_timelineDragAutoScrollVelocity"](v604, v605)) return;
    if (this["_timelineDragAutoScrollRaf"]) return;
    const v606 = v603["sessionId"],
      v607 = () => {
        ((this["_timelineDragAutoScrollRaf"] = 0),
          this["_runTimelineDragAutoScroll"](v606));
      };
    this["_timelineDragAutoScrollRaf"] =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame(v607)
        : setTimeout(v607, 16);
  }
  ["_stopTimelineDragAutoScroll"]() {
    const v608 = this["_timelineDragAutoScrollRaf"];
    if (!v608) return;
    try {
      if (typeof cancelAnimationFrame === "function")
        cancelAnimationFrame(v608);
    } catch {}
    try {
      clearTimeout(v608);
    } catch {}
    this["_timelineDragAutoScrollRaf"] = 0;
  }
  ["_runTimelineDragAutoScroll"](v609) {
    const v610 = this["_timelineDrag"]();
    if (!v610 || v610["sessionId"] !== v609) return;
    const v611 = v610["scrollEl"],
      v612 = toNumber(v610["latestClientX"], Number["NaN"]),
      v613 = this["_timelineDragAutoScrollVelocity"](v611, v612);
    if (!v611 || !v613) return;
    const v614 = Math["max"](0, v611["scrollWidth"] - v611["clientWidth"]),
      v615 = toNumber(v611["scrollLeft"], 0),
      v616 = this["_clampTimelineScrollLeft"](v611, v615 + v613, {
        maxScrollPx: v614,
      });
    if (Math["abs"](v616 - v615) <= 0.01) return;
    ((v611["scrollLeft"] = v616),
      this["_updateTimelineView"](
        { scrollLeft: v616 },
        { persist: false, renderOnPersist: false },
      ),
      this["_syncTimelineScrollFade"](v611),
      this["_applyTimelineDragPreviewFromPointer"](v610, { clientX: v612 }),
      this["_scheduleTimelineDragAutoScroll"](v610));
  }
  ["_persistTimelineDragScroll"](v617 = this["_timelineDrag"]()) {
    const v618 = v617?.["scrollEl"];
    if (!v618) return;
    const v619 = this["_clampTimelineScrollLeft"](v618, v618["scrollLeft"]);
    (Math["abs"](v619 - toNumber(v618["scrollLeft"], 0)) > 0.01 &&
      (v618["scrollLeft"] = v619),
      this["_syncTimelineScrollFade"](v618),
      this["_updateTimelineView"](
        { scrollLeft: v619 },
        { persist: true, renderOnPersist: false },
      ));
  }
  ["_renderShortcutCropButton"]() {
    const v620 = makeButton(
      "media-clip-tool-crop\x20media-clip-shortcut-crop",
      "剪开素材 (C)",
      "",
    );
    return (
      (v620["tabIndex"] = -1),
      v620["setAttribute"]("aria-hidden", "true"),
      v620["addEventListener"]("click", (v621) => {
        (stopPointer(v621), this["_splitActiveMaterial"]());
      }),
      v620
    );
  }
  ["_setDownloadMenuOpen"](v622) {
    this["_menuOpen"] = v622 === true;
    this["_materialMenu"] &&
      ((this["_materialMenu"] = null),
      this["_removeMaterialMenuPortal"](),
      this["_syncMaterialMenuDismissListener"](false));
    const v623 = this["el"]?.["querySelector"]?.(".media-clip-compact");
    v623?.["classList"]?.["toggle"]("is-menu-open", this["_menuOpen"]);
    const v624 = this["el"]?.["querySelector"]?.(".media-clip-compact-tools");
    if (!v624) return;
    const v625 = v624["querySelector"]?.(".media-clip-tool-download");
    (v625?.["classList"]?.["toggle"]("is-active", this["_menuOpen"]),
      v624["querySelectorAll"]?.(".media-clip-menu")?.["forEach"]((v626) =>
        v626["remove"]?.(),
      ),
      this["_menuOpen"] && v624["appendChild"](this["_renderDownloadMenu"]()));
  }
  ["_renderTimelineTools"]() {
    const v627 = document["createElement"]("div");
    v627["className"] = "media-clip-tools media-clip-compact-tools";
    const v628 = iconButton(
        "media-clip-tool media-clip-tool-crop",
        "剪开素材\x20(C)",
        "<circle\x20cx=\x226\x22\x20cy=\x226\x22\x20r=\x223\x22/><path\x20d=\x22M8.12\x208.12\x2012\x2012\x22/><path\x20d=\x22M20\x204\x208.12\x2015.88\x22/><circle\x20cx=\x226\x22\x20cy=\x2218\x22\x20r=\x223\x22/><path\x20d=\x22M14.8\x2014.8\x2020\x2020\x22/>",
      ),
      v629 = document["createElement"]("span");
    ((v629["className"] = "media-clip-tool-kbd"),
      (v629["textContent"] = "C"),
      v628["appendChild"](v629),
      v628["addEventListener"]("click", (v630) => {
        (stopPointer(v630), this["_splitActiveMaterial"]());
      }));
    const v631 = iconButton(
      "media-clip-tool\x20media-clip-tool-download",
      "导出",
      '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    );
    (v631["classList"]["toggle"]("is-active", this["_menuOpen"]),
      v631["addEventListener"]("click", (v632) => {
        (stopPointer(v632), this["_setDownloadMenuOpen"](!this["_menuOpen"]));
      }),
      v627["append"](v628, v631));
    if (this["_menuOpen"]) v627["appendChild"](this["_renderDownloadMenu"]());
    return v627;
  }
  ["_renderTimelineHintCarousel"]() {
    const v633 = document["createElement"]("div");
    v633["className"] = "media-clip-helper-row";
    const v634 = document["createElement"]("div");
    v634["className"] = "media-clip-helper-left";
    const v635 = [
      [
        ["kbd", "Space"],
        ["text", "播放/暂停"],
      ],
      [
        ["kbd", "C"],
        ["text", "剪开播放头处素材"],
      ],
      [
        ["kbd", "Delete"],
        ["text", "删除当前素材"],
      ],
      [
        ["kbd", "拖动素材"],
        ["text", "调整顺序"],
      ],
      [
        ["kbd", "拖动两端"],
        ["text", "裁剪素材"],
      ],
      [
        ["kbd", "右键"],
        ["text", "导出或删除素材"],
      ],
      [["text", "连线按钮添加片段"]],
      [
        ["kbd", "Ctrl"],
        ["text", "+\x20滚轮缩放时间线"],
      ],
    ];
    return (
      v633["style"]["setProperty"](
        "--media-clip-helper-count",
        String(v635["length"]),
      ),
      v635["forEach"]((v636, v637) => {
        const v638 = document["createElement"]("div");
        ((v638["className"] = "media-clip-helper-msg"),
          v638["style"]["setProperty"](
            "--media-clip-helper-index",
            String(v637),
          ),
          v636["forEach"](([v639, v640]) => {
            const v641 = document["createElement"]("span");
            ((v641["className"] =
              v639 === "kbd"
                ? "media-clip-helper-kbd"
                : "media-clip-helper-text"),
              (v641["textContent"] = v640),
              v638["appendChild"](v641));
          }),
          v634["appendChild"](v638));
      }),
      v633["appendChild"](v634),
      v633
    );
  }
  ["_renderMaterialMenu"]() {
    const v642 = this["_materialMenu"] || {},
      v643 = document["createElement"]("div");
    ((v643["className"] = "v2-canvas-ctx-menu media-clip-material-menu"),
      v643["setAttribute"]("role", "menu"),
      (v643["dataset"]["uiStop"] = "true"));
    const v644 = (v645, v646) => {
        const v647 = document["createElement"]("div");
        ((v647["className"] = "v2-menu-row"),
          v647["setAttribute"]("role", "menuitem"));
        const v648 = document["createElement"]("span");
        return (
          (v648["textContent"] = v645),
          v647["appendChild"](v648),
          v647["addEventListener"]("pointerdown", (v649) => {
            if (v649["button"] !== 0) return;
            (stopPointer(v649), v646(v649));
          }),
          v647
        );
      },
      v650 = v644("导出素材到画布", async () => {
        if (this["_exporting"] === true) return;
        const { kind: v651, clipIndex: v652 } = this["_materialMenu"] || v642;
        (this["_closeMaterialMenu"]({ render: false }),
          await this["_exportMaterialToCanvas"](v651, v652));
      }),
      v653 = v644("删除素材", () => {
        const { kind: v654, clipIndex: v655 } = this["_materialMenu"] || v642;
        (this["_closeMaterialMenu"]({ render: false }),
          this["_deleteMaterial"](v654, v655));
      });
    return (v643["append"](v650, v653), v643);
  }
  ["_renderPreviewPanel"]() {
    const v656 = document["createElement"]("div");
    v656["className"] = "media-clip-preview-panel";
    const v657 = this["_renderPreview"](),
      v658 = makeButton("media-clip-close", "收起", "×");
    return (
      v658["addEventListener"]("click", (v659) => {
        (stopPointer(v659), this["_setExpanded"](false));
      }),
      v657["appendChild"](v658),
      v656["append"](v657),
      this["_syncPreviewPanelLayout"](v656, v657),
      v656
    );
  }
  ["_previewLayoutTokens"]() {
    return ["is-landscape", "is-portrait", "is-tall-portrait"];
  }
  ["_previewVideoLayoutClasses"](v660 = {}) {
    const v661 = resolveMediaClipDimensions(v660),
      v662 = Math["max"](1, toNumber(v661["width"], 1)),
      v663 = Math["max"](1, toNumber(v661["height"], 1)),
      v664 = v662 / v663;
    if (v664 < 1)
      return v664 <= 0.65
        ? ["is-portrait", "is-tall-portrait"]
        : ["is-portrait"];
    return ["is-landscape"];
  }
  ["_syncPreviewPanelLayout"](v665, v666) {
    if (!v665?.["classList"] || !v666?.["classList"]) return;
    (this["_previewLayoutTokens"]()["forEach"]((v667) => {
      v665["classList"]["remove"](v667);
    }),
      this["_previewLayoutTokens"]()["forEach"]((v668) => {
        if (v666["classList"]["contains"](v668)) v665["classList"]["add"](v668);
      }));
    const v669 = v666["style"]?.["getPropertyValue"]?.(
      "--media-clip-preview-aspect-ratio",
    );
    if (v669)
      v665["style"]?.["setProperty"]?.(
        "--media-clip-preview-aspect-ratio",
        v669,
      );
  }
  ["_applyPreviewVideoLayout"](v670, v671 = {}) {
    if (!v670?.["classList"]) return;
    const v672 = resolveMediaClipDimensions(v671),
      v673 = Math["max"](1, toNumber(v672["width"], 1)),
      v674 = Math["max"](1, toNumber(v672["height"], 1));
    (this["_previewLayoutTokens"]()["forEach"]((v675) => {
      v670["classList"]["remove"](v675);
    }),
      this["_previewVideoLayoutClasses"](v671)["forEach"]((v676) => {
        v670["classList"]["add"](v676);
      }),
      v670["style"]?.["setProperty"]?.(
        "--media-clip-preview-aspect-ratio",
        v673 + "\x20/\x20" + v674,
      ),
      this["_syncPreviewPanelLayout"](
        v670["closest"]?.(".media-clip-preview-panel") || v670["parentElement"],
        v670,
      ));
  }
  ["_syncPreviewVideoLayoutFromElement"](v677 = this["_videoPreview"]) {
    const v678 = toNumber(v677?.["videoWidth"], 0),
      v679 = toNumber(v677?.["videoHeight"], 0);
    if (!(v678 > 0 && v679 > 0)) return;
    this["_applyPreviewVideoLayout"](v677["parentElement"], {
      width: v678,
      height: v679,
    });
  }
  ["_showPreviewImage"](v680 = {}, v681 = "") {
    const v682 = this["_ensurePreviewImageElement"](),
      v683 = normalizeText(v681) || resolveMediaClipImageUrl(v680);
    if (!v682 || !v683) return false;
    this["_previewVisualKind"] = "image";
    try {
      this["_videoPreview"]?.["pause"]?.();
    } catch {}
    if (this["_videoPreview"]) this["_videoPreview"]["hidden"] = true;
    v682["hidden"] = false;
    if (v682["getAttribute"]?.("src") !== v683) v682["src"] = v683;
    return (
      this["_applyPreviewVideoLayout"](v682["parentElement"], v680),
      this["_updatePreviewControls"](),
      true
    );
  }
  ["_showPreviewVideo"](v684 = {}) {
    this["_previewVisualKind"] = "video";
    if (this["_imagePreview"]) this["_imagePreview"]["hidden"] = true;
    if (this["_videoPreview"]) this["_videoPreview"]["hidden"] = false;
    this["_applyPreviewVideoLayout"](
      this["_videoPreview"]?.["parentElement"],
      v684,
    );
  }
  ["_ensurePreviewVideoElement"]() {
    if (this["_videoPreview"]) return this["_videoPreview"];
    const v685 = document["createElement"]("video");
    ((v685["className"] = "media-clip-video-preview"),
      (v685["preload"] = "auto"),
      (v685["controls"] = false),
      v685["removeAttribute"]("controls"),
      (v685["playsInline"] = true),
      (v685["disablePictureInPicture"] = true),
      v685["setAttribute"](
        "controlsList",
        "nodownload nofullscreen noremoteplayback",
      ));
    const v686 = () => {
      this["_syncPreviewVideoLayoutFromElement"](v685);
      const v687 = this["_resolveVideoPreviewSeekTarget"]();
      this["_syncPreviewTime"]("video", v687, { immediate: true });
      if (this["_playing"])
        try {
          v685["play"]?.()?.["catch"]?.(() => {});
        } catch {}
    };
    return (
      v685["addEventListener"]("loadedmetadata", v686),
      v685["addEventListener"]("loadeddata", v686),
      v685["addEventListener"]("canplay", v686),
      v685["addEventListener"]("error", () => {
        const v688 = v685["__mediaClipFallbackHost"],
          v689 = normalizeText(v685["__mediaClipPosterUrl"]);
        v688 &&
          v689 &&
          !v688["querySelector"](".media-clip-video-fallback") &&
          v688["appendChild"](this["_renderVideoFallback"](v689));
      }),
      (this["_videoPreview"] = v685),
      v685
    );
  }
  ["_ensurePreviewImageElement"]() {
    if (this["_imagePreview"]) return this["_imagePreview"];
    const v690 = document["createElement"]("img");
    return (
      (v690["className"] = "media-clip-image-preview"),
      (v690["alt"] = ""),
      (v690["draggable"] = false),
      (v690["hidden"] = true),
      v690["addEventListener"]("load", () => {
        this["_applyPreviewVideoLayout"](v690["parentElement"], {
          width: v690["naturalWidth"],
          height: v690["naturalHeight"],
        });
      }),
      (this["_imagePreview"] = v690),
      v690
    );
  }
  ["_ensurePreviewAudioElement"]() {
    if (this["_audioPreview"]) return this["_audioPreview"];
    const v691 = document["createElement"]("audio");
    return (
      (v691["className"] = "media-clip-audio-element"),
      (v691["controls"] = false),
      v691["removeAttribute"]("controls"),
      (v691["preload"] = "metadata"),
      v691["addEventListener"]("loadedmetadata", () => {
        const v692 = this["_audioSourceSecForPlayhead"](
          this["_playheadSec"] || 0,
        );
        this["_syncPreviewTime"]("audio", v692, { immediate: true });
      }),
      (this["_audioPreview"] = v691),
      v691
    );
  }
  ["_renderPreviewControls"]() {
    const v693 = document["createElement"]("div");
    v693["className"] = "media-clip-preview-controls";
    const v694 = document["createElement"]("button");
    ((v694["type"] = "button"),
      (v694["className"] = "media-clip-preview-play"),
      v694["addEventListener"]("click", (v695) =>
        this["_togglePreviewPlayback"](v695),
      ));
    const v696 = document["createElement"]("span");
    return (
      (v696["className"] = "media-clip-preview-time"),
      (this["_previewPlayButton"] = v694),
      (this["_previewTimeLabel"] = v696),
      v693["append"](v694, v696),
      this["_updatePreviewControls"](),
      v693
    );
  }
  ["_renderPreview"]() {
    const v697 = document["createElement"]("div");
    ((v697["className"] = "media-clip-preview"),
      (this["_previewPlayButton"] = null),
      (this["_previewTimeLabel"] = null));
    const v698 = this["_mediaClip"]["tracks"]["video"],
      v699 = this["_mediaClip"]["tracks"]["audio"];
    if (v698) {
      const v700 = this["_getVideoPreviewContextAtTimelineSec"](
          this["_playheadSec"] || 0,
        ),
        v701 = v700["url"],
        v702 = v700["posterUrl"];
      this["_applyPreviewVideoLayout"](v697, v700["source"]);
      if (!v701)
        return (
          this["_disposePreviewMedia"]("video"),
          v697["appendChild"](this["_renderVideoFallback"](v702)),
          v697
        );
      const v703 = this["_ensurePreviewVideoElement"](),
        v704 = this["_ensurePreviewImageElement"]();
      ((v703["__mediaClipFallbackHost"] = v697),
        (v703["__mediaClipPosterUrl"] = v702));
      if (v702) v703["poster"] = v702;
      else v703["removeAttribute"]("poster");
      if (v700["clipKind"] !== "image") {
        if (setMediaElementSource(v703, v701))
          this["_resetPreviewSeekState"]("video");
        this["_previewVideoSrc"] = v701;
      }
      const v705 = v699
          ? this["_getAudioClipContextAtTimelineSec"](this["_playheadSec"] || 0)
          : null,
        v706 = v705?.["url"] || "";
      if (v699 && v706) {
        const v707 = this["_ensurePreviewAudioElement"]();
        if (setMediaElementSource(v707, v706))
          this["_resetPreviewSeekState"]("audio");
        ((this["_previewAudioSrc"] = v706),
          (v703["muted"] = true),
          v697["appendChild"](v707));
      } else ((v703["muted"] = false), this["_disposePreviewMedia"]("audio"));
      (v697["appendChild"](v704),
        v697["appendChild"](v703),
        v700["clipKind"] === "image"
          ? this["_showPreviewImage"](v700["source"], v701)
          : (this["_showPreviewVideo"](v700["source"]),
            this["_syncPreviewTime"](
              "video",
              this["_videoSourceSecForPlayhead"](this["_playheadSec"] || 0),
              { immediate: true },
            )),
        v697["appendChild"](this["_renderPreviewControls"]()));
    } else {
      this["_disposePreviewMedia"]("video");
      const v708 = document["createElement"]("div");
      ((v708["className"] = "media-clip-audio-preview"),
        (v708["textContent"] = "音频剪辑"));
      const v709 = this["_ensurePreviewAudioElement"](),
        v710 = this["_getAudioClipContextAtTimelineSec"](
          this["_playheadSec"] || 0,
        ),
        v711 =
          v710?.["url"] || resolveMediaClipAudioUrl(this["_sources"]["audio"]);
      if (setMediaElementSource(v709, v711))
        this["_resetPreviewSeekState"]("audio");
      ((this["_previewAudioSrc"] = v711),
        v708["appendChild"](v709),
        v697["appendChild"](v708),
        v699 &&
          this["_syncPreviewTime"](
            "audio",
            this["_audioSourceSecForPlayhead"](this["_playheadSec"] || 0),
            { immediate: true },
          ),
        v697["appendChild"](this["_renderPreviewControls"]()));
    }
    return v697;
  }
  ["_renderVideoFallback"](v712 = "") {
    const v713 = normalizeText(v712);
    if (v713) {
      const v714 = document["createElement"]("img");
      return (
        (v714["className"] = "media-clip-video-fallback"),
        (v714["src"] = v713),
        (v714["alt"] = ""),
        (v714["draggable"] = false),
        v714
      );
    }
    const v715 = document["createElement"]("div");
    return ((v715["className"] = "media-clip-video-fallback is-empty"), v715);
  }
  ["_estimateTimelineWidth"](v716 = {}) {
    const v717 = toNumber(v716["timelineWidthPx"], 0);
    if (v717 > 0) return Math["max"](240, v717);
    const v718 = toNumber(
        this["nodeData"]?.["width"],
        MEDIA_CLIP_COMPACT_SIZE["width"],
      ),
      v719 = v716["compact"] === true ? 136 : 116;
    return Math["max"](240, v718 - v719);
  }
  ["_timelineViewportWidth"]() {
    const v720 = toNumber(
      this["nodeData"]?.["width"],
      MEDIA_CLIP_COMPACT_SIZE["width"],
    );
    return Math["max"](240, v720 - 64);
  }
  ["_timelineZoom"](v721 = {}) {
    return normalizeMediaClipTimelineView({
      zoom:
        v721["timelineZoom"] ??
        this["_timelineView"]?.["zoom"] ??
        this["_mediaClip"]?.["timelineView"]?.["zoom"],
    })["zoom"];
  }
  ["_timelineTrackContentWidth"](v722 = {}) {
    const v723 = this["_timelineZoom"](v722),
      v724 = this["_primaryDuration"]({ timelineZoom: v723 });
    return getMediaClipTimelineTrackWidthPx({
      durationSec: v724,
      viewportWidthPx: this["_timelineViewportWidth"](),
      zoom: v723,
    });
  }
  ["_timelineMaterialEndSec"]() {
    const v725 = this["_mediaClip"]["tracks"]?.["video"],
      v726 = this["_videoTimelineMaterialEnd"](v725);
    if (v726 > 0) return v726;
    const v727 = this["_mediaClip"]["tracks"]?.["audio"];
    if (v727) return this["_audioTimelineMaterialEnd"](v727);
    return 0;
  }
  ["_timelineAddSlotLeftPx"](
    v728 = this["_timelineTrackContentWidth"](),
    v729 = {},
  ) {
    return getMediaClipTimelineAddSlotLeftPx({
      trackWidthPx: v728,
      displayDurationSec:
        v729["displayDurationSec"] ?? this["_primaryDuration"](),
      materialEndSec:
        v729["materialEndSec"] ?? this["_timelineMaterialEndSec"](),
    });
  }
  ["_timelineContentWidth"](
    v730 = this["_timelineTrackContentWidth"](),
    v731 = {},
  ) {
    return getMediaClipTimelineContentWidthPx({
      trackWidthPx: v730,
      displayDurationSec:
        v731["displayDurationSec"] ?? this["_primaryDuration"](),
      materialEndSec:
        v731["materialEndSec"] ?? this["_timelineMaterialEndSec"](),
    });
  }
  ["_syncTimelineAddSlotPosition"](
    v732 = this["_timelineTrackContentWidth"](),
    v733 = {},
  ) {
    const v734 = Math["max"](240, Math["ceil"](toNumber(v732, 0))),
      v735 = this["_timelineAddSlotLeftPx"](v734, v733),
      v736 = this["_timelineContentWidth"](v734, v733),
      v737 = this["el"]?.["querySelector"]?.(".media-clip-compact-timeline");
    if (!v737) return;
    (v737["style"]["setProperty"]("--media-clip-add-left", v735 + "px"),
      v737["style"]["setProperty"](
        "--media-clip-timeline-content-width",
        v736 + "px",
      ));
    const v738 = v737["querySelector"]?.(".media-clip-add-btn");
    if (v738) v738["style"]["left"] = v735 + "px";
  }
  ["_syncTimelineAddSlotForRow"](v739, v740 = {}) {
    const v741 = Math["max"](
      240,
      readLayoutWidthPx(v739, this["_timelineTrackContentWidth"]()),
    );
    this["_syncTimelineAddSlotPosition"](v741, v740);
  }
  ["_syncTimelineContentWidth"](v742 = this["_timelineTrackContentWidth"]()) {
    const v743 = Math["max"](240, Math["ceil"](toNumber(v742, 0))),
      v744 = this["el"]?.["querySelector"]?.(".media-clip-compact-timeline");
    if (!v744) return;
    (v744["style"]["setProperty"](
      "--media-clip-track-content-width",
      v743 + "px",
    ),
      this["_syncTimelineAddSlotPosition"](v743),
      this["el"]
        ?.["querySelectorAll"]?.(".media-clip-track, .media-clip-ruler")
        ?.["forEach"]((v745) => {
          v745["style"]["width"] = v743 + "px";
        }),
      this["_syncTimelineRulerTicks"](v743),
      this["_syncTimelineScrollFade"](
        this["el"]?.["querySelector"]?.(".media-clip-timeline-scroll"),
      ));
  }
  ["_timelineRulerTicks"](v746, v747, v748 = {}) {
    const v749 = getMediaClipTimelineDisplayDuration(v746);
    return buildMediaClipTimelineTicks(v749, v747);
  }
  ["_populateTimelineRuler"](v750, v751, v752, v753 = {}) {
    if (!v750) return;
    const v754 = getMediaClipTimelineDisplayDuration(v751),
      v755 = this["_timelineRulerTicks"](v754, v752, v753),
      v756 = v754 + ":" + v755["join"](",");
    if (v750["dataset"]?.["tickSignature"] === v756) return;
    if (v750["dataset"]) v750["dataset"]["tickSignature"] = v756;
    (typeof v750["replaceChildren"] === "function"
      ? v750["replaceChildren"]()
      : (v750["textContent"] = ""),
      v755["forEach"]((v757) => {
        const v758 = document["createElement"]("span");
        ((v758["className"] = "media-clip-ruler-tick"),
          (v758["textContent"] = formatTime(v757)));
        const v759 = getMediaClipTimelinePercent(v757, v754);
        ((v758["style"]["left"] = v759 + "%"), v750["appendChild"](v758));
      }));
  }
  ["_syncTimelineRulerTicks"](
    v760 = this["_timelineTrackContentWidth"](),
    v761 = {},
  ) {
    const v762 = this["el"]?.["querySelector"]?.(".media-clip-ruler");
    if (!v762) return;
    this["_populateTimelineRuler"](
      v762,
      this["_primaryDuration"](),
      v760,
      v761,
    );
  }
  ["_renderRuler"](v763, v764 = {}) {
    const v765 = getMediaClipTimelineDisplayDuration(v763),
      v766 = this["_estimateTimelineWidth"](v764),
      v767 = document["createElement"]("div");
    return (
      (v767["className"] = "media-clip-ruler"),
      this["_populateTimelineRuler"](v767, v765, v766, v764),
      v767
    );
  }
  ["_renderTimelineCursors"](v768 = this["_primaryDuration"]()) {
    const v769 = document["createElement"]("div");
    ((v769["className"] = "media-clip-timeline-cursors"),
      v769["setAttribute"]("aria-hidden", "true"));
    const v770 = document["createElement"]("div");
    ((v770["className"] =
      "media-clip-playhead\x20media-clip-timeline-cursor\x20media-clip-timeline-cursor-fixed"),
      this["_applyTimelinePlayheadModel"](
        v770,
        getMediaClipTimelinePlayheadModel({
          playheadSec: this["_playheadSec"],
          durationSec: v768,
        }),
      ));
    const v771 = document["createElement"]("div");
    return (
      (v771["className"] =
        "media-clip-hover-playhead media-clip-timeline-cursor media-clip-timeline-cursor-hover"),
      (v771["hidden"] = true),
      v769["append"](v770, v771),
      v769
    );
  }
  ["_timelineCursorKind"]() {
    const v772 = normalizeText(this["_mediaClip"]["activeTrack"]);
    if (v772 && this["_mediaClip"]["tracks"]?.[v772]) return v772;
    if (this["_mediaClip"]["tracks"]?.["video"]) return "video";
    if (this["_mediaClip"]["tracks"]?.["audio"]) return "audio";
    return "";
  }
  ["_timelineDurationForKind"](
    v773 = this["_timelineCursorKind"](),
    v774 = {},
  ) {
    const v775 = this["_mediaClip"]["tracks"]?.[v773];
    if (!v775) return this["_primaryDuration"](v774);
    if (v773 === "video")
      return this["_videoTimelineDuration"](v775, null, v774);
    if (v773 === "audio") {
      const v776 = this["_mediaClip"]["tracks"]?.["video"];
      return v776
        ? this["_videoTimelineDuration"](v776, null, v774)
        : this["_audioTimelineDuration"](v775, null, v774);
    }
    return getTrackDuration(v775);
  }
  ["_timelinePointerContext"](v777, v778 = null) {
    const v779 = v778?.["closest"]?.(".media-clip-track:not(.is-compact)"),
      v780 = v779?.["classList"]?.["contains"]("media-clip-track-audio")
        ? "audio"
        : v779?.["classList"]?.["contains"]("media-clip-track-video")
          ? "video"
          : "",
      v781 = v780 || this["_timelineCursorKind"]();
    if (!v781) return null;
    const v782 = v780
      ? v779
      : v777?.["querySelector"]?.(
          ".media-clip-track-" + v781 + ":not(.is-compact)",
        );
    if (!v782) return null;
    return {
      kind: v781,
      row: v782,
      duration: this["_timelineDurationForKind"](v781),
    };
  }
  ["_isTimelineControlTarget"](v783) {
    return !!v783?.["closest"]?.(
      ".media-clip-pick-btn,\x20.media-clip-tool,\x20.media-clip-menu,\x20.media-clip-material-menu,\x20.media-clip-menu-item,\x20.media-clip-trim",
    );
  }
  ["_timelineEventSegment"](v784) {
    return v784?.["closest"]?.(".media-clip-segment") || null;
  }
  ["_openMaterialMenu"](v785, v786, v787) {
    if (!v785 || !v787) return;
    (v787["preventDefault"]?.(), v787["stopPropagation"]?.());
    const v788 = this["_materialMenuHost"](),
      v789 = this["_materialMenuLocalPoint"](
        v787["clientX"],
        v787["clientY"],
        v788,
      );
    ((this["_menuOpen"] = false),
      (this["_materialMenu"] = {
        kind: v785,
        clipIndex: Math["max"](0, Math["trunc"](toNumber(v786, 0))),
        x: v789["x"],
        y: v789["y"],
      }),
      this["_syncMaterialMenuDismissListener"](true),
      this["_removeMaterialMenuPortal"](),
      this["_renderMaterialMenuPortal"]());
  }
  ["_bindTimelinePointerCursors"](v790, v791) {
    if (!v790 || !v791) return;
    (v790["addEventListener"]("pointermove", (v792) => {
      if (
        this["_timelineDrag"]() ||
        this["_isTimelineControlTarget"](v792["target"])
      )
        return;
      const v793 = this["_timelinePointerContext"](v791, v792["target"]);
      if (!v793) return;
      const v794 = this["_timelineSecFromPointerEvent"](
        v793["row"],
        v792,
        v793["duration"],
      );
      this["_timelineEventSegment"](v792["target"])
        ? this["_previewTrackPlayhead"](
            v793["row"],
            v793["kind"],
            v794,
            v793["duration"],
          )
        : this["_updateTimelineHoverPlayheadVisual"](
            v793["row"],
            v793["duration"],
            { playheadSec: v794 },
          );
    }),
      v790["addEventListener"]("pointerdown", (v795) => {
        if (
          v795["button"] !== 0 ||
          this["_timelineDrag"]() ||
          this["_isTimelineControlTarget"](v795["target"])
        )
          return;
        if (this["_timelineEventSegment"](v795["target"])) return;
        const v796 = this["_timelinePointerContext"](v791, v795["target"]);
        if (!v796) return;
        this["_setTimelinePlayheadFromPointer"](
          v796["row"],
          v796["kind"],
          v795,
          v796["duration"],
          {
            updateActiveTrack: false,
            updateClipSelection: false,
            selectClip: false,
            syncPreview: false,
          },
        );
      }),
      v790["addEventListener"]("pointerleave", () => {
        if (this["_timelineDrag"]()) return;
        (this["_hideTimelineHoverPlayhead"](v790),
          this["_restoreTimelinePlayheads"]());
      }),
      v790["addEventListener"]("click", (v797) => {
        if (
          this["_timelineDrag"]() ||
          this["_isTimelineControlTarget"](v797["target"])
        )
          return;
        if (!this["_timelineEventSegment"](v797["target"])) return;
        const v798 = this["_timelinePointerContext"](v791, v797["target"]);
        if (!v798) return;
        const v799 = this["_timelineSecFromPointerEvent"](
            v798["row"],
            v797,
            v798["duration"],
          ),
          v800 =
            v798["kind"] === "video"
              ? this["_setActiveClipIndex"](
                  this["_clipIndexAtTimelineSec"](v799),
                )
              : v798["kind"] === "audio"
                ? this["_setActiveAudioClipIndex"](
                    this["_audioClipIndexAtTimelineSec"](v799),
                  )
                : false;
        if (v798["kind"] === "audio")
          this["_selectAudioClipIndex"](this["_activeAudioClipIndex"]);
        this["_setActiveTrack"](v798["kind"], v799, { forceRender: v800 });
      }));
  }
  ["_videoSources"]() {
    const v801 = Array["isArray"](this["_sources"]?.["videos"])
      ? this["_sources"]["videos"]
      : [];
    if (v801["length"]) return v801;
    return this["_sources"]?.["video"] ? [this["_sources"]["video"]] : [];
  }
  ["_firstVideoSource"]() {
    return (
      this["_videoSources"]()["find"](
        (v802) => getMediaClipInputKind(v802) === "video",
      ) || null
    );
  }
  ["_videoClipSource"](v803 = {}, v804 = 0) {
    const v805 = this["_videoSources"](),
      v806 = normalizeText(v803["sourceId"]),
      v807 = normalizeText(v803["sourceKey"]);
    return (
      v805["find"]((v808) => normalizeText(v808?.["id"]) === v806) ||
      v805["find"](
        (v809) =>
          normalizeText(v809?.["__mediaClipEdgeId"]) ===
          normalizeText(v803["id"]),
      ) ||
      v805["find"](
        (v810) => normalizeText(resolveMediaClipSourceKey(v810)) === v807,
      ) ||
      v805[v804] ||
      this["_sources"]?.["video"] ||
      null
    );
  }
  ["_audioSources"]() {
    const v811 = Array["isArray"](this["_sources"]?.["audios"])
      ? this["_sources"]["audios"]
      : [];
    if (v811["length"]) return v811;
    return this["_sources"]?.["audio"] ? [this["_sources"]["audio"]] : [];
  }
  ["_audioClipSource"](v812 = {}, v813 = 0) {
    const v814 = this["_audioSources"](),
      v815 = normalizeText(v812["sourceId"]),
      v816 = normalizeText(v812["sourceKey"]);
    return (
      v814["find"]((v817) => normalizeText(v817?.["id"]) === v815) ||
      v814["find"](
        (v818) =>
          normalizeText(v818?.["__mediaClipEdgeId"]) ===
          normalizeText(v812["id"]),
      ) ||
      v814["find"](
        (v819) => normalizeText(resolveMediaClipSourceKey(v819)) === v816,
      ) ||
      v814[v813] ||
      this["_sources"]?.["audio"] ||
      null
    );
  }
  ["_videoTimelineClips"](v820 = null) {
    const v821 = Array["isArray"](this["_mediaClip"]?.["clips"])
      ? this["_mediaClip"]["clips"]
      : [];
    if (v821["length"]) return v821;
    if (!v820) return [];
    return [
      {
        id: "video:0",
        sourceKey: v820["sourceKey"],
        startSec: v820["startSec"],
        endSec: v820["endSec"],
        durationSec: v820["durationSec"],
        timelineStartSec: v820["startSec"],
        timelineEndSec: v820["endSec"],
      },
    ];
  }
  ["_audioTimelineClips"](v822 = null) {
    const v823 = Array["isArray"](this["_mediaClip"]?.["audioClips"])
      ? this["_mediaClip"]["audioClips"]
      : [];
    if (v823["length"]) return v823;
    if (!v822) return [];
    const v824 = toNumber(v822["startSec"], 0),
      v825 = Math["max"](v824, toNumber(v822["endSec"], v824));
    return [
      {
        id: "audio:0",
        kind: "audio",
        sourceKey: v822["sourceKey"],
        startSec: v824,
        endSec: v825,
        durationSec: v822["durationSec"],
        timelineStartSec: v824,
        timelineEndSec: v825,
      },
    ];
  }
  ["_timelineDurationForZoom"](v826 = 0, v827 = {}) {
    const v828 = getMediaClipTimelineDisplayDuration(v826),
      v829 = Math["max"](v828, v828 * TIMELINE_ZOOM_OUT_DISPLAY_MULTIPLIER);
    if (v829 <= v828) return v828;
    const v830 = this["_timelineZoom"](v827);
    if (v830 >= 1) return v828;
    const v831 = Math["max"](0.001, 1 - MEDIA_CLIP_TIMELINE_ZOOM_MIN),
      v832 = Math["max"](0, Math["min"](1, (1 - v830) / v831));
    return Math["round"]((v828 + (v829 - v828) * v832) * 1000) / 1000;
  }
  ["_videoTimelineBaseDuration"](v833 = null, v834 = null) {
    const v835 = Array["isArray"](v834)
        ? v834
        : this["_videoTimelineClips"](v833),
      v836 = this["_videoTimelineMaterialEnd"](v833, v835),
      v837 = v835["reduce"](
        (v838, v839) =>
          Math["min"](v838, toNumber(v839?.["timelineStartSec"], 0)),
        0,
      ),
      v840 = v837 < 0 ? Math["max"](0, v836 - v837) : v836;
    if (v835["length"]) {
      const v841 =
        v835["length"] === 1
          ? Math["max"](
              toNumber(v835[0]?.["durationSec"], 0),
              toNumber(v833?.["durationSec"], 0),
            )
          : 0;
      return getMediaClipTimelineDisplayDuration(Math["max"](v836, v840, v841));
    }
    return getMediaClipTimelineDisplayDuration(
      Math["max"](toNumber(v833?.["durationSec"], 0), getTrackDuration(v833)),
    );
  }
  ["_videoTimelineDuration"](v842 = null, v843 = null, v844 = {}) {
    return this["_timelineDurationForZoom"](
      this["_videoTimelineBaseDuration"](v842, v843),
      v844,
    );
  }
  ["_timelineSegmentVisualDurationSec"](v845 = null, v846 = null) {
    if (!v845 || !v846) return 0;
    const v847 = Math["max"](0, toNumber(v846["timelineStartSec"], 0)),
      v848 = Math["max"](v847, toNumber(v846["timelineEndSec"], v847)),
      v849 = Math["max"](0, v848 - v847),
      v850 = parsePercentValue(v845?.["style"]?.["left"]),
      v851 = parsePercentValue(v845?.["style"]?.["width"]),
      v852 = parsePercentValue(v845?.["style"]?.["right"]),
      v853 =
        Number["isFinite"](v851) && v851 > 0
          ? v851
          : Number["isFinite"](v850) && Number["isFinite"](v852)
            ? Math["max"](0, 100 - v850 - v852)
            : NaN,
      v854 = [];
    return (
      Number["isFinite"](v850) &&
        v850 > 0 &&
        v847 > 0 &&
        v854["push"](v847 / (v850 / 100)),
      Number["isFinite"](v853) &&
        v853 > 0 &&
        v849 > 0 &&
        v854["push"](v849 / (v853 / 100)),
      Number["isFinite"](v850) &&
        Number["isFinite"](v853) &&
        v850 + v853 > 0 &&
        v848 > 0 &&
        v854["push"](v848 / ((v850 + v853) / 100)),
      Math["max"](
        0,
        ...v854["filter"]((v855) => Number["isFinite"](v855) && v855 > 0),
      )
    );
  }
  ["_resolveTimelineDragDuration"](
    v856,
    v857 = null,
    v858 = null,
    v859 = null,
    v860 = 0,
  ) {
    if (v856 === "audio") {
      const v861 = Array["isArray"](v858)
          ? v858
          : this["_audioTimelineClips"](v857),
        v862 = this["_timelineDurationForKind"]("audio"),
        v863 = Math["max"](0, Math["trunc"](toNumber(v860, 0))),
        v864 = this["_timelineSegmentVisualDurationSec"](v859, v861[v863]);
      return getMediaClipTimelineDisplayDuration(Math["max"](v862, v864));
    }
    if (v856 !== "video") return getTrackDuration(v857);
    const v865 = Array["isArray"](v858)
        ? v858
        : this["_videoTimelineClips"](v857),
      v866 = this["_videoTimelineDuration"](v857, v865),
      v867 = Math["max"](0, Math["trunc"](toNumber(v860, 0))),
      v868 = this["_timelineSegmentVisualDurationSec"](v859, v865[v867]);
    return getMediaClipTimelineDisplayDuration(Math["max"](v866, v868));
  }
  ["_videoTimelineMaterialEnd"](v869 = null, v870 = null) {
    const v871 = Array["isArray"](v870)
      ? v870
      : this["_videoTimelineClips"](v869);
    if (v871["length"])
      return v871["reduce"](
        (v872, v873) => Math["max"](v872, toNumber(v873["timelineEndSec"], 0)),
        0,
      );
    return Math["max"](
      0,
      toNumber(v869?.["endSec"] || v869?.["durationSec"], 0),
    );
  }
  ["_audioTimelineMaterialEnd"](v874 = null, v875 = null) {
    const v876 = Array["isArray"](v875)
      ? v875
      : this["_audioTimelineClips"](v874);
    if (v876["length"])
      return v876["reduce"](
        (v877, v878) => Math["max"](v877, toNumber(v878["timelineEndSec"], 0)),
        0,
      );
    return Math["max"](
      0,
      toNumber(v874?.["endSec"] || v874?.["durationSec"], 0),
    );
  }
  ["_audioTimelineDuration"](v879 = null, v880 = null, v881 = {}) {
    const v882 = Array["isArray"](v880)
        ? v880
        : this["_audioTimelineClips"](v879),
      v883 = this["_audioTimelineMaterialEnd"](v879, v882),
      v884 =
        v882["length"] === 1
          ? Math["max"](
              toNumber(v882[0]?.["durationSec"], 0),
              toNumber(v879?.["durationSec"], 0),
            )
          : toNumber(v879?.["durationSec"], 0);
    return this["_timelineDurationForZoom"](Math["max"](v883, v884), v881);
  }
  ["_clampVideoClipIndex"](v885 = this["_activeClipIndex"]) {
    const v886 = Math["max"](
        0,
        this["_videoTimelineClips"](this["_mediaClip"]["tracks"]?.["video"])[
          "length"
        ],
      ),
      v887 = Math["max"](0, v886 - 1);
    return Math["max"](0, Math["min"](v887, Math["trunc"](toNumber(v885, 0))));
  }
  ["_clampAudioClipIndex"](v888 = this["_activeAudioClipIndex"]) {
    const v889 = Math["max"](
        0,
        this["_audioTimelineClips"](this["_mediaClip"]["tracks"]?.["audio"])[
          "length"
        ],
      ),
      v890 = Math["max"](0, v889 - 1);
    return Math["max"](0, Math["min"](v890, Math["trunc"](toNumber(v888, 0))));
  }
  ["_clipIndexAtTimelineSec"](
    v891,
    v892 = this["_videoTimelineClips"](this["_mediaClip"]["tracks"]?.["video"]),
  ) {
    const v893 = Array["isArray"](v892) ? v892 : [];
    if (!v893["length"]) return 0;
    const v894 = toNumber(v891, 0),
      v895 = v893["findIndex"]((v896, v897) => {
        const v898 = toNumber(v896["timelineStartSec"], 0),
          v899 = Math["max"](v898, toNumber(v896["timelineEndSec"], v898));
        return v897 === v893["length"] - 1
          ? v894 >= v898 && v894 <= v899
          : v894 >= v898 && v894 < v899;
      });
    if (v895 >= 0) return v895;
    let v900 = 0,
      v901 = Number["POSITIVE_INFINITY"];
    return (
      v893["forEach"]((v902, v903) => {
        const v904 = toNumber(v902["timelineStartSec"], 0),
          v905 = Math["max"](v904, toNumber(v902["timelineEndSec"], v904)),
          v906 = v894 < v904 ? v904 - v894 : v894 - v905;
        v906 < v901 && ((v900 = v903), (v901 = v906));
      }),
      v900
    );
  }
  ["_audioClipIndexAtTimelineSec"](
    v907,
    v908 = this["_audioTimelineClips"](this["_mediaClip"]["tracks"]?.["audio"]),
  ) {
    const v909 = Array["isArray"](v908) ? v908 : [];
    if (!v909["length"]) return 0;
    const v910 = toNumber(v907, 0),
      v911 = v909["findIndex"]((v912, v913) => {
        const v914 = toNumber(v912["timelineStartSec"], 0),
          v915 = Math["max"](v914, toNumber(v912["timelineEndSec"], v914));
        return v913 === v909["length"] - 1
          ? v910 >= v914 && v910 <= v915
          : v910 >= v914 && v910 < v915;
      });
    if (v911 >= 0) return v911;
    let v916 = 0,
      v917 = Number["POSITIVE_INFINITY"];
    return (
      v909["forEach"]((v918, v919) => {
        const v920 = toNumber(v918["timelineStartSec"], 0),
          v921 = Math["max"](v920, toNumber(v918["timelineEndSec"], v920)),
          v922 = v910 < v920 ? v920 - v910 : v910 - v921;
        v922 < v917 && ((v916 = v919), (v917 = v922));
      }),
      v916
    );
  }
  ["_setActiveClipIndex"](v923 = this["_activeClipIndex"]) {
    const v924 = this["_clampVideoClipIndex"](v923),
      v925 = v924 !== this["_activeClipIndex"];
    return ((this["_activeClipIndex"] = v924), v925);
  }
  ["_setActiveAudioClipIndex"](v926 = this["_activeAudioClipIndex"]) {
    const v927 = this["_clampAudioClipIndex"](v926),
      v928 = v927 !== this["_activeAudioClipIndex"];
    return ((this["_activeAudioClipIndex"] = v927), v928);
  }
  ["_clampSelectedClipIndex"](v929 = this["_selectedClipIndex"]) {
    const v930 = Math["max"](
        0,
        this["_videoTimelineClips"](this["_mediaClip"]["tracks"]?.["video"])[
          "length"
        ],
      ),
      v931 = Math["trunc"](toNumber(v929, -1));
    return v931 >= 0 && v931 < v930 ? v931 : -1;
  }
  ["_clampSelectedAudioClipIndex"](v932 = this["_selectedAudioClipIndex"]) {
    const v933 = Math["max"](
        0,
        this["_audioTimelineClips"](this["_mediaClip"]["tracks"]?.["audio"])[
          "length"
        ],
      ),
      v934 = Math["trunc"](toNumber(v932, -1));
    return v934 >= 0 && v934 < v933 ? v934 : -1;
  }
  ["_selectClipIndex"](v935 = this["_activeClipIndex"]) {
    const v936 = this["_clampVideoClipIndex"](v935),
      v937 = v936 !== this["_selectedClipIndex"];
    return ((this["_selectedClipIndex"] = v936), v937);
  }
  ["_selectAudioClipIndex"](v938 = this["_activeAudioClipIndex"]) {
    const v939 = this["_clampAudioClipIndex"](v938),
      v940 = v939 !== this["_selectedAudioClipIndex"];
    return ((this["_selectedAudioClipIndex"] = v939), v940);
  }
  ["_segmentClipIndex"](v941, v942 = "video", v943 = null) {
    const v944 = normalizeText(v941?.["dataset"]?.["clipId"]);
    if (v944) {
      const v945 = Array["isArray"](v943)
          ? v943
          : v942 === "audio"
            ? this["_mediaClip"]["audioClips"] || []
            : this["_mediaClip"]["clips"] || [],
        v946 = v945["findIndex"](
          (v947) => normalizeText(v947?.["id"]) === v944,
        );
      if (v946 >= 0) return v946;
    }
    return Math["max"](
      0,
      Math["trunc"](toNumber(v941?.["dataset"]?.["clipIndex"], 0)),
    );
  }
  ["_timelineRowForDrag"](v948 = this["_timelineDrag"]()) {
    if (v948?.["rowEl"]) return v948["rowEl"];
    const v949 = normalizeText(v948?.["kind"]);
    if (!v949) return null;
    return (
      this["el"]?.["querySelector"]?.(
        ".media-clip-track-" + v949 + ":not(.is-compact)",
      ) ||
      this["el"]?.["querySelector"]?.(".media-clip-track-" + v949) ||
      null
    );
  }
  ["_videoSourceSecForPlayhead"](v950 = this["_playheadSec"]) {
    const v951 = this["_videoTimelineClips"](
      this["_mediaClip"]["tracks"]?.["video"],
    );
    if (!v951["length"]) return v950;
    const v952 = toNumber(v950, 0);
    if (v951["length"] === 1) {
      const v953 = v951[0],
        v954 = toNumber(v953["startSec"], 0),
        v955 = toNumber(v953["endSec"], v954),
        v956 = toNumber(v953["timelineStartSec"], 0),
        v957 = toNumber(v953["timelineEndSec"], v956);
      if (v952 >= v956 && v952 <= v957) return v954 + (v952 - v956);
      return Math["max"](v954, Math["min"](v955, v952));
    }
    const v958 =
        v951[this["_clipIndexAtTimelineSec"](v952, v951)] ||
        v951[v951["length"] - 1],
      v959 = toNumber(v958["timelineStartSec"], 0),
      v960 = toNumber(v958["startSec"], 0),
      v961 = toNumber(v958["endSec"], v960);
    return Math["max"](v960, Math["min"](v961, v960 + (v952 - v959)));
  }
  ["_audioSourceSecForPlayhead"](v962 = this["_playheadSec"]) {
    const v963 = this["_audioTimelineClips"](
      this["_mediaClip"]["tracks"]?.["audio"],
    );
    if (!v963["length"]) return v962;
    const v964 = toNumber(v962, 0),
      v965 =
        v963[this["_audioClipIndexAtTimelineSec"](v964, v963)] ||
        v963[v963["length"] - 1],
      v966 = toNumber(v965["timelineStartSec"], 0),
      v967 = toNumber(v965["startSec"], 0),
      v968 = toNumber(v965["endSec"], v967);
    return Math["max"](v967, Math["min"](v968, v967 + (v964 - v966)));
  }
  ["_previewSourceSecForTimelineSec"](v969, v970 = this["_playheadSec"]) {
    if (v969 === "video") return this["_videoSourceSecForPlayhead"](v970);
    if (v969 === "audio") return this["_audioSourceSecForPlayhead"](v970);
    return v970;
  }
  ["_applyTimelineSegmentRect"](v971, v972 = {}) {
    if (!v971) return;
    ((v971["style"]["left"] = toNumber(v972["leftPct"], 0) + "%"),
      (v971["style"]["width"] = toNumber(v972["widthPct"], 0) + "%"),
      (v971["style"]["right"] = ""));
  }
  ["_applyAudioTimelineSegmentRect"](v973, v974 = {}) {
    if (!v973) return;
    ((v973["style"]["left"] = toNumber(v974["leftPct"], 0) + "%"),
      (v973["style"]["right"] =
        Math["max"](0, 100 - toNumber(v974["rightPct"], 0)) + "%"),
      (v973["style"]["width"] = "auto"));
  }
  ["_applyAudioTimelineTrimRect"](v975, v976 = {}) {
    this["_applyAudioTimelineSegmentRect"](v975, v976);
  }
  ["_timelinePreviewRangeRect"](v977 = {}) {
    const v978 = toNumber(v977["startSec"], 0),
      v979 = Math["max"](v978, toNumber(v977["endSec"], v978));
    if (v978 >= 0) return getMediaClipTimelineRangeRect(v977);
    const v980 = getMediaClipTimelineDisplayDuration(v977["durationSec"]),
      v981 = (v978 / v980) * 100,
      v982 = (v979 / v980) * 100;
    return {
      startSec: v978,
      endSec: v979,
      leftPct: v981,
      rightPct: v982,
      widthPct: Math["max"](0, v982 - v981),
    };
  }
  ["_timelineCursorHost"](v983 = null) {
    return (
      v983?.["closest"]?.(".media-clip-compact-timeline") ||
      this["el"]?.["querySelector"]?.(".media-clip-compact-timeline") ||
      v983
    );
  }
  ["_updateTimelineSegmentLabel"](v984, v985 = 0) {
    const v986 = v984?.["querySelector"]?.(".media-clip-material-label");
    if (!v986) return;
    v986["textContent"] = formatDurationLabel(v985);
  }
  ["_syncAudioSegmentWaveformViewport"](v987, v988 = {}) {
    const v989 = v987?.["querySelector"]?.(".media-clip-wave-svg");
    if (!v989) return;
    const v990 = v987?.["querySelector"]?.(".media-clip-wave-source") || v989,
      v991 = getMediaClipWaveformViewport(v988),
      v992 = formatWaveformPct(v991["widthPct"]) + "%",
      v993 =
        v991["marginLeftPct"] > 0
          ? "-" + formatWaveformPct(v991["marginLeftPct"]) + "%"
          : "0";
    (v989["setAttribute"]("viewBox", getMediaClipWaveformViewBox()),
      v989["setAttribute"]("width", "100%"),
      v990?.["style"] &&
        ((v990["style"]["width"] = v992),
        (v990["style"]["marginLeft"] = v993),
        (v990["style"]["transform"] = "none"),
        (v990["style"]["transformOrigin"] = "")),
      v989["style"] &&
        ((v989["style"]["width"] = "100%"),
        (v989["style"]["marginLeft"] = "0"),
        (v989["style"]["transform"] = "none"),
        (v989["style"]["transformOrigin"] = "")));
  }
  ["_applyVideoTimelinePreview"](v994, v995 = [], v996 = 0) {
    const v997 = Array["isArray"](v995) ? v995 : [];
    if (!v994 || !v997["length"]) return 0;
    let v998 = 0;
    return (
      v994["querySelectorAll"]?.(".media-clip-segment")?.["forEach"]((v999) => {
        const v1000 = this["_segmentClipIndex"](v999, "video", v997),
          v1001 = v997[v1000];
        if (!v1001) return;
        const v1002 = toNumber(v1001["timelineStartSec"], 0),
          v1003 = Math["max"](v1002, toNumber(v1001["timelineEndSec"], v1002)),
          v1004 = Math["max"](0, v1003 - v1002);
        (this["_applyTimelineSegmentRect"](
          v999,
          this["_timelinePreviewRangeRect"]({
            startSec: v1002,
            endSec: v1003,
            durationSec: v996,
          }),
        ),
          this["_updateTimelineSegmentLabel"](v999, v1004),
          (v998 += 1));
      }),
      v998
    );
  }
  ["_applyAudioTimelinePreview"](v1005, v1006 = [], v1007 = 0) {
    const v1008 = Array["isArray"](v1006) ? v1006 : [];
    if (!v1005 || !v1008["length"]) return 0;
    let v1009 = 0;
    return (
      v1005["querySelectorAll"]?.(".media-clip-segment")?.["forEach"](
        (v1010) => {
          const v1011 = this["_segmentClipIndex"](v1010, "audio", v1008),
            v1012 = v1008[v1011];
          if (!v1012) return;
          const v1013 = toNumber(v1012["timelineStartSec"], 0),
            v1014 = Math["max"](
              v1013,
              toNumber(v1012["timelineEndSec"], v1013),
            ),
            v1015 = Math["max"](0, v1014 - v1013);
          (this["_applyAudioTimelineSegmentRect"](
            v1010,
            this["_timelinePreviewRangeRect"]({
              startSec: v1013,
              endSec: v1014,
              durationSec: v1007,
            }),
          ),
            this["_updateTimelineSegmentLabel"](v1010, v1015),
            this["_syncAudioSegmentWaveformViewport"](v1010, v1012),
            (v1009 += 1));
        },
      ),
      v1009
    );
  }
  ["_setTimelinePlayheadFromPointer"](
    v1016,
    v1017,
    v1018,
    v1019 = 0,
    v1020 = {},
  ) {
    if (!v1016 || !this["_mediaClip"]["tracks"]?.[v1017]) return false;
    const v1021 = this["_timelineSecFromPointerEvent"](v1016, v1018, v1019);
    this["_playheadSec"] = v1021;
    const v1022 = this["_mediaClip"]["activeTrack"] !== v1017;
    if (v1017 === "video") {
      if (v1020["updateClipSelection"] !== false) {
        const v1023 =
          v1020["clipIndex"] == null
            ? this["_clipIndexAtTimelineSec"](v1021)
            : Math["max"](0, Math["trunc"](toNumber(v1020["clipIndex"], 0)));
        this["_setActiveClipIndex"](v1023);
        if (v1020["selectClip"] !== false) this["_selectClipIndex"](v1023);
      }
      v1020["syncPreview"] !== false &&
        this["_syncVideoPreviewSourceForTimelineSec"](v1021);
    } else {
      if (v1017 === "audio") {
        const v1024 =
          v1020["clipIndex"] == null
            ? this["_audioClipIndexAtTimelineSec"](v1021)
            : Math["max"](0, Math["trunc"](toNumber(v1020["clipIndex"], 0)));
        this["_setActiveAudioClipIndex"](v1024);
        if (v1020["selectClip"] !== false) this["_selectAudioClipIndex"](v1024);
        v1020["syncPreview"] !== false &&
          this["_syncAudioPreviewSourceForTimelineSec"](v1021);
      }
    }
    return (
      v1022 &&
        v1020["updateActiveTrack"] !== false &&
        ((this["_mediaClip"] = { ...this["_mediaClip"], activeTrack: v1017 }),
        (this["nodeData"] = {
          ...(this["nodeData"] || {}),
          mediaClip: this["_mediaClip"],
        }),
        v1020["persistActiveTrack"] !== false &&
          appStore["updateNodeData"](this["id"], {
            mediaClip: this["_mediaClip"],
          })),
      this["_updateTrackPlayheadVisual"](v1016, v1019, { playheadSec: v1021 }),
      v1020["syncPreview"] !== false &&
        this["_syncPreviewTime"](
          v1017,
          this["_previewSourceSecForTimelineSec"](v1017, v1021),
        ),
      true
    );
  }
  ["_applyTimelinePlayheadModel"](v1025, v1026 = {}) {
    if (!v1025) return;
    v1025["style"]["left"] = toNumber(v1026["leftPct"], 0) + "%";
  }
  async ["_loadAudioWaveformPath"](v1027, v1028, v1029 = {}) {
    if (!v1027 || !v1028) return;
    const v1030 = resolveMediaClipWaveformUrl(v1029),
      v1031 = resolveMediaClipAudioUrl(v1029);
    if (!v1030 && !v1031) return;
    const v1032 = [v1030, v1031, resolveMediaClipSourceKey(v1029)]["join"]("|");
    if (v1027["dataset"]) v1027["dataset"]["waveformKey"] = v1032;
    const v1033 = {
      width: MEDIA_CLIP_WAVEFORM_WIDTH,
      height: MEDIA_CLIP_WAVEFORM_HEIGHT,
      samples: MEDIA_CLIP_WAVEFORM_SAMPLES,
    };
    let v1034 = "";
    v1030 && (v1034 = await getWaveformBarsPathFromPersistedUrl(v1030, v1033));
    !v1034 &&
      v1031 &&
      typeof window !== "undefined" &&
      (v1034 = await getWaveformBarsPathFromUrl(v1031, v1033));
    if (!v1034) return;
    if (
      v1027["dataset"]?.["waveformKey"] &&
      v1027["dataset"]["waveformKey"] !== v1032
    )
      return;
    if (this["el"]?.["isConnected"] === false) return;
    (v1028["setAttribute"]("d", v1034),
      v1027["classList"]?.["add"]("has-waveform"));
  }
  ["_renderTrack"](v1035, v1036 = {}) {
    const v1037 = this["_mediaClip"]["tracks"]?.[v1035],
      v1038 =
        v1035 === "video"
          ? getMediaClipTimelineDisplayDuration(
              v1036["durationSec"] ?? this["_videoTimelineDuration"](v1037),
            )
          : getMediaClipTimelineDisplayDuration(
              v1036["durationSec"] ?? this["_timelineDurationForKind"](v1035),
            ),
      v1039 = this["_mediaClip"]["activeTrack"] === v1035,
      v1040 = document["createElement"]("div");
    ((v1040["className"] = "media-clip-track\x20media-clip-track-" + v1035),
      v1040["classList"]["toggle"]("is-active", v1039),
      v1040["classList"]["toggle"]("is-compact", v1036["compact"] === true));
    const v1041 = toNumber(v1036["timelineWidthPx"], 0);
    if (v1041 > 0) v1040["style"]["width"] = Math["max"](240, v1041) + "px";
    v1040["addEventListener"]("click", (v1042) => {
      v1042["stopPropagation"]();
      if (this["_suppressTrackClick"]) {
        this["_suppressTrackClick"] = false;
        return;
      }
      if (this["_isTimelineControlTarget"](v1042["target"])) return;
      if (v1036["compact"] === true) {
        this["_setMediaClipWithLayout"](
          { ...this["_mediaClip"], expanded: true },
          true,
        );
        return;
      }
      if (!this["_timelineEventSegment"](v1042["target"])) return;
      const v1043 = this["_timelineSecFromPointerEvent"](v1040, v1042, v1038),
        v1044 =
          v1035 === "video"
            ? this["_setActiveClipIndex"](
                this["_clipIndexAtTimelineSec"](v1043),
              )
            : v1035 === "audio"
              ? this["_setActiveAudioClipIndex"](
                  this["_audioClipIndexAtTimelineSec"](v1043),
                )
              : false;
      if (v1035 === "audio")
        this["_selectAudioClipIndex"](this["_activeAudioClipIndex"]);
      this["_setActiveTrack"](v1035, v1043, { forceRender: v1044 });
    });
    const v1045 = (v1046, v1047) => {
        const v1048 = document["createElement"]("div");
        v1048["className"] = "media-clip-filmstrip";
        const v1049 = collectMediaClipFrameUrls(v1047),
          v1050 = getMediaClipFrameCount(
            this["_estimateTimelineWidth"](v1036),
            v1036,
          );
        if (v1049["length"] > 0)
          for (let v1051 = 0; v1051 < v1050; v1051 += 1) {
            const v1052 = document["createElement"]("img");
            ((v1052["className"] = "media-clip-filmstrip-frame"),
              (v1052["src"] = v1049[v1051 % v1049["length"]]),
              (v1052["alt"] = ""),
              (v1052["draggable"] = false),
              v1052["addEventListener"](
                "error",
                () => fillFilmstripPlaceholder(v1048, v1050),
                { once: true },
              ),
              v1048["appendChild"](v1052));
          }
        else fillFilmstripPlaceholder(v1048, v1050);
        v1046["appendChild"](v1048);
      },
      v1053 = (v1054, v1055 = {}, v1056 = null) => {
        const v1057 = document["createElement"]("div");
        v1057["className"] = "media-clip-wave";
        const v1058 = document["createElement"]("div");
        v1058["className"] = "media-clip-wave-source";
        const v1059 = createMediaClipSvgElement("svg");
        (setMediaClipSvgClass(v1059, "media-clip-wave-svg"),
          v1059["setAttribute"]("width", "100%"),
          v1059["setAttribute"]("height", "100%"),
          v1059["setAttribute"]("viewBox", getMediaClipWaveformViewBox()),
          v1059["setAttribute"]("preserveAspectRatio", "none"));
        const v1060 = createMediaClipSvgElement("path");
        (setMediaClipSvgClass(v1060, "media-clip-wave-path"),
          v1060["setAttribute"]("d", ""),
          v1059["appendChild"](v1060),
          v1058["appendChild"](v1059),
          v1057["appendChild"](v1058),
          v1054["appendChild"](v1057),
          this["_syncAudioSegmentWaveformViewport"](v1054, v1055),
          void this["_loadAudioWaveformPath"](v1057, v1060, v1056));
      },
      v1061 = (v1062, v1063 = {}) => {
        const v1064 = document["createElement"]("div");
        ((v1064["className"] =
          "media-clip-material-selection v2-video-clipselection"),
          (v1064["style"]["left"] = "0%"),
          (v1064["style"]["width"] = "100%"));
        const v1065 = document["createElement"]("div");
        v1065["className"] = "media-clip-material-label v2-video-cliplabel";
        const v1066 = toNumber(
            v1063["startSec"] ?? v1063["timelineStartSec"],
            0,
          ),
          v1067 = toNumber(v1063["endSec"] ?? v1063["timelineEndSec"], v1066);
        ((v1065["textContent"] = formatDurationLabel(
          Math["max"](0, v1067 - v1066),
        )),
          v1064["append"](v1065),
          v1062["appendChild"](v1064));
      },
      v1068 = ({
        rect: rect = {},
        source: source = null,
        clipIndex: clipIndex = 0,
        item: item = null,
      }) => {
        const v1069 = document["createElement"]("div");
        v1069["className"] = "media-clip-segment\x20media-clip-material-strip";
        v1035 === "audio"
          ? this["_applyAudioTimelineSegmentRect"](v1069, rect)
          : this["_applyTimelineSegmentRect"](v1069, rect);
        v1069["dataset"]["clipIndex"] = String(clipIndex);
        const v1070 = normalizeText(item?.["id"]);
        if (v1070) v1069["dataset"]["clipId"] = v1070;
        if (v1035 === "video") {
          const v1071 = this["_visualClipKind"](item, source);
          (v1069["classList"]["add"]("media-clip-segment-" + v1071),
            (v1069["dataset"]["mediaKind"] = v1071),
            clipIndex === this["_clampVideoClipIndex"]() &&
              (v1069["dataset"]["activeClip"] = "true"),
            clipIndex === this["_selectedClipIndex"] &&
              (v1069["dataset"]["selectedClip"] = "true"),
            v1045(v1069, source));
        } else
          (v1069["classList"]["add"]("media-clip-segment-audio"),
            (v1069["dataset"]["mediaKind"] = "audio"),
            clipIndex === this["_clampAudioClipIndex"]() &&
              (v1069["dataset"]["activeClip"] = "true"),
            clipIndex === this["_selectedAudioClipIndex"] &&
              (v1069["dataset"]["selectedClip"] = "true"),
            v1053(v1069, item, source));
        v1061(v1069, item || {});
        if (v1036["compact"] !== true) {
          v1069["addEventListener"]("contextmenu", (v1072) => {
            const v1073 = this["_segmentClipIndex"](v1069, v1035);
            if (v1035 === "video")
              (this["_setActiveClipIndex"](v1073),
                this["_selectClipIndex"](v1073),
                this["_syncTrackActiveClipChrome"](v1040, v1035));
            else
              v1035 === "audio" &&
                (this["_setActiveAudioClipIndex"](v1073),
                this["_selectAudioClipIndex"](v1073),
                this["_syncTrackActiveClipChrome"](v1040, v1035));
            this["_openMaterialMenu"](v1035, v1073, v1072);
          });
          const v1074 = (v1075) => {
            if (this["_timelineDrag"]()) return;
            const v1076 = this["_segmentClipIndex"](v1069, v1035);
            this["_setTimelineHoverSegment"](v1040, v1069, v1035, v1076);
            const v1077 = this["_timelineSecFromPointerEvent"](
              v1040,
              v1075,
              v1038,
            );
            this["_previewTrackPlayhead"](v1040, v1035, v1077, v1038);
          };
          (v1069["addEventListener"]("pointerenter", v1074),
            v1069["addEventListener"]("pointermove", v1074),
            v1069["addEventListener"]("pointerleave", () => {
              if (!this["_timelineDrag"]())
                this["_clearTimelineHoverState"](v1040);
              this["_restoreTrackPlayhead"](v1040, v1035);
            }),
            v1069["addEventListener"]("pointerdown", (v1078) => {
              const v1079 = this["_segmentClipIndex"](v1069, v1035);
              if (v1035 === "video")
                (this["_setActiveClipIndex"](v1079),
                  this["_selectClipIndex"](v1079),
                  this["_syncTrackActiveClipChrome"](v1040, v1035));
              else
                v1035 === "audio" &&
                  (this["_setActiveAudioClipIndex"](v1079),
                  this["_selectAudioClipIndex"](v1079),
                  this["_syncTrackActiveClipChrome"](v1040, v1035));
              this["_startSegmentDrag"](v1035, v1078, {
                ...v1036,
                clipIndex: v1079,
              });
            }));
        }
        return (v1040["appendChild"](v1069), v1069);
      };
    if (v1035 === "video") {
      const v1080 = this["_videoTimelineClips"](v1037);
      v1080["length"]
        ? v1080["forEach"]((v1081, v1082) => {
            const v1083 = toNumber(v1081["timelineStartSec"], 0),
              v1084 = Math["max"](
                v1083,
                toNumber(v1081["timelineEndSec"], v1083),
              );
            v1068({
              rect: getMediaClipTimelineRangeRect({
                startSec: v1083,
                endSec: v1084,
                durationSec: v1038,
              }),
              source: this["_videoClipSource"](v1081, v1082),
              clipIndex: v1082,
              item: v1081,
            });
          })
        : v1068({
            rect: getMediaClipTimelineRangeRect({
              startSec: v1037["startSec"],
              endSec: v1037["endSec"],
              durationSec: v1038,
            }),
            source: this["_videoClipSource"](v1080[0] || v1037, 0),
            clipIndex: 0,
            item: v1080[0] || v1037,
          });
    } else {
      const v1085 = this["_audioTimelineClips"](v1037);
      v1085["length"] &&
        v1085["forEach"]((v1086, v1087) => {
          const v1088 = toNumber(v1086["timelineStartSec"], 0),
            v1089 = Math["max"](
              v1088,
              toNumber(v1086["timelineEndSec"], v1088),
            );
          v1068({
            rect: getMediaClipTimelineRangeRect({
              startSec: v1088,
              endSec: v1089,
              durationSec: v1038,
            }),
            source: this["_audioClipSource"](v1086, v1087),
            clipIndex: v1087,
            item: v1086,
          });
        });
    }
    return (
      !v1036["compact"] &&
        v1039 &&
        this["_syncTrackActiveClipChrome"](v1040, v1035),
      v1040
    );
  }
  ["_timelineSecFromPointerEvent"](v1090, v1091, v1092 = 0) {
    const v1093 = v1090?.["getBoundingClientRect"]?.(),
      v1094 = Math["max"](
        1,
        toNumber(v1093?.["width"], readLayoutWidthPx(v1090, 1)),
      ),
      v1095 = toNumber(v1093?.["left"], 0);
    return getMediaClipTimelineSecFromClientX(v1091?.["clientX"], {
      durationSec: v1092,
      trackLeftPx: v1095,
      trackWidthPx: v1094,
    });
  }
  ["_previewTrackPlayhead"](v1096, v1097, v1098 = 0, v1099 = 0) {
    if (!v1096 || this["_playing"]) return;
    this["_updateTimelineHoverPlayheadVisual"](v1096, v1099, {
      playheadSec: v1098,
    });
    if (v1097 === "video") this["_syncVideoPreviewSourceForTimelineSec"](v1098);
    else {
      if (v1097 === "audio")
        this["_syncAudioPreviewSourceForTimelineSec"](v1098);
    }
    this["_syncPreviewTime"](
      v1097,
      this["_previewSourceSecForTimelineSec"](v1097, v1098),
    );
  }
  ["_syncTimelineHoverPlayheadFromPointer"](v1100, v1101, v1102 = 0) {
    if (!v1100 || !v1101 || this["_playing"]) return;
    const v1103 = this["_timelineSecFromPointerEvent"](v1100, v1101, v1102);
    this["_updateTimelineHoverPlayheadVisual"](v1100, v1102, {
      playheadSec: v1103,
    });
  }
  ["_restoreTrackPlayhead"](v1104, v1105) {
    if (!v1104 || this["_playing"]) return;
    (this["_hideTimelineHoverPlayhead"](v1104),
      this["_updatePlaybackVisuals"](v1105));
  }
  ["_restoreTimelinePlayheads"]() {
    if (this["_playing"]) return;
    (this["_hideTimelineHoverPlayhead"](),
      this["_updatePlaybackVisuals"]("video"),
      this["_updatePlaybackVisuals"]("audio"));
  }
  ["_syncTrackActiveClipChrome"](v1106, v1107) {
    if (!v1106 || v1106["classList"]?.["contains"]("is-compact")) return;
    const v1108 = this["_mediaClip"]["activeTrack"] === v1107,
      v1109 =
        v1107 === "video"
          ? this["_clampVideoClipIndex"]()
          : this["_clampAudioClipIndex"](),
      v1110 =
        v1107 === "video"
          ? this["_clampSelectedClipIndex"]()
          : this["_clampSelectedAudioClipIndex"](),
      v1111 =
        v1107 === "audio"
          ? this["_mediaClip"]["audioClips"] || []
          : this["_mediaClip"]["clips"] || [];
    v1106["querySelectorAll"](".media-clip-segment")["forEach"]((v1112) => {
      const v1113 = this["_segmentClipIndex"](v1112, v1107, v1111);
      if (v1107 === "video") {
        const v1114 = normalizeText(v1111[v1113]?.["id"]);
        v1112["dataset"]["clipIndex"] = String(v1113);
        if (v1114) v1112["dataset"]["clipId"] = v1114;
      } else {
        if (v1107 === "audio") {
          const v1115 = normalizeText(v1111[v1113]?.["id"]);
          v1112["dataset"]["clipIndex"] = String(v1113);
          if (v1115) v1112["dataset"]["clipId"] = v1115;
        }
      }
      const v1116 = v1108 && v1113 === v1109,
        v1117 = v1108 && v1113 === v1110;
      v1116
        ? (v1112["dataset"]["activeClip"] = "true")
        : delete v1112["dataset"]["activeClip"];
      v1117
        ? (v1112["dataset"]["selectedClip"] = "true")
        : delete v1112["dataset"]["selectedClip"];
      v1112["querySelectorAll"](".media-clip-trim")["forEach"]((v1118) => {
        (!v1108 ||
          Math["trunc"](toNumber(v1118["dataset"]["clipIndex"], -1)) !==
            v1113) &&
          v1118["remove"]();
      });
      if (!v1108) return;
      v1112["querySelectorAll"](
        ".media-clip-material-selection .media-clip-trim",
      )["forEach"]((v1119) => v1119["remove"]());
      const v1120 = v1112,
        v1121 = (v1122) =>
          Array["from"](v1120["children"])["some"]((v1123) =>
            v1123["classList"]?.["contains"]("media-clip-trim-" + v1122),
          );
      (!v1121("left") &&
        v1120["appendChild"](
          this["_renderTrimHandle"](v1107, "left", { clipIndex: v1113 }),
        ),
        !v1121("right") &&
          v1120["appendChild"](
            this["_renderTrimHandle"](v1107, "right", { clipIndex: v1113 }),
          ));
    });
  }
  ["_renderTrimHandle"](v1124, v1125, v1126 = {}) {
    const v1127 = document["createElement"]("button");
    ((v1127["type"] = "button"),
      (v1127["className"] = "media-clip-trim media-clip-trim-" + v1125),
      (v1127["dataset"]["clipIndex"] = String(
        Math["max"](0, Math["trunc"](toNumber(v1126["clipIndex"], 0))),
      )),
      v1127["setAttribute"](
        "aria-label",
        v1125 === "left" ? "左裁剪" : "右裁剪",
      ));
    const v1128 = document["createElement"]("span");
    return (
      (v1128["className"] = "media-clip-trim-visual"),
      v1128["setAttribute"]("aria-hidden", "true"),
      v1127["appendChild"](v1128),
      v1127["addEventListener"]("pointerenter", () => {
        const v1129 = v1127["closest"](".media-clip-segment"),
          v1130 = v1129?.["closest"](".media-clip-track") || null;
        (v1129?.["querySelectorAll"]?.(".media-clip-trim.is-hovered")?.[
          "forEach"
        ]((v1131) => {
          if (v1131 !== v1127) v1131["classList"]["remove"]("is-hovered");
        }),
          v1127["classList"]["add"]("is-hovered"));
        if (v1129)
          this["_setTimelineHoverSegment"](
            v1130,
            v1129,
            v1124,
            v1126["clipIndex"],
          );
      }),
      v1127["addEventListener"]("pointerleave", () => {
        if (!this["_timelineDrag"]())
          v1127["classList"]["remove"]("is-hovered");
      }),
      v1127["addEventListener"]("pointerdown", (v1132) => {
        (stopPointer(v1132),
          this["_cancelTimelineSettle"](),
          this["_stopTimelineDragAutoScroll"](),
          (this["_deferredTimelineDragNodeData"] = null),
          v1127["classList"]["add"]("is-hovered"));
        try {
          v1127["setPointerCapture"]?.(v1132["pointerId"]);
        } catch {}
        const v1133 = this["_mediaClip"]["tracks"]?.[v1124],
          v1134 = Math["max"](
            0,
            Math["trunc"](toNumber(v1126["clipIndex"], 0)),
          );
        if (v1124 === "video")
          (this["_setActiveClipIndex"](v1134), this["_selectClipIndex"](v1134));
        else
          v1124 === "audio" &&
            (this["_setActiveAudioClipIndex"](v1134),
            this["_selectAudioClipIndex"](v1134));
        const v1135 = v1127["closest"](".media-clip-segment"),
          v1136 = v1135?.["closest"](".media-clip-track") || null,
          v1137 = v1135?.["closest"](".media-clip-timeline-lane") || null,
          v1138 = v1135?.["closest"](".media-clip-timeline-scroll") || null,
          v1139 =
            v1124 === "audio"
              ? this["_audioTimelineClips"](v1133)["map"]((v1140) => ({
                  ...v1140,
                }))
              : this["_videoTimelineClips"](v1133)["map"]((v1141) => ({
                  ...v1141,
                })),
          v1142 = this["_resolveTimelineDragDuration"](
            v1124,
            v1133,
            v1139,
            v1135,
            v1134,
          );
        if (v1135) this["_setTimelineHoverSegment"](v1136, v1135, v1124, v1134);
        (v1135?.["classList"]["add"]("is-trimming"),
          v1136?.["classList"]["add"]("is-trimming"),
          v1137?.["classList"]["add"]("is-trimming"),
          v1138?.["classList"]["add"]("is-trimming"));
        const v1143 = this["_nextTimelineDragSessionId"]();
        this["_setTimelineDrag"]({
          sessionId: v1143,
          kind: v1124,
          mode: "trim",
          side: v1125,
          clipIndex: v1134,
          startX: v1132["clientX"],
          startTrack: { ...(v1133 || {}) },
          startClips: v1139,
          startMediaClip: this["_mediaClip"],
          durationSec: v1142,
          startScrollLeft: toNumber(v1138?.["scrollLeft"], 0),
          latestClientX: v1132["clientX"],
          segmentEl: v1135,
          rowEl: v1136,
          laneEl: v1137,
          scrollEl: v1138,
          pendingRange: null,
          pendingPlayheadSec: this["_playheadSec"],
          startPlayheadSec: this["_playheadSec"],
          hasMoved: false,
        });
        const v1144 = (v1145) => this["_handleTrimDrag"](v1145, v1143),
          v1146 = (v1147) => {
            stopPointer(v1147);
            if (!this["_isTimelineDragSession"](v1143)) return;
            const v1148 = this["_timelineDrag"]();
            this["_persistTimelineDragScroll"](v1148);
            if (v1148?.["kind"] === "video" && v1148["pendingRange"]) {
              const v1149 = this["_isVideoLeftTrimDrag"](v1148);
              this["_commitVideoTrimDrag"](v1148, { persist: false });
              const v1150 = this["_videoTimelineDuration"](
                  this["_mediaClip"]["tracks"]?.["video"],
                ),
                v1151 = Math["max"](
                  v1150,
                  toNumber(v1148["previewDurationSec"], 0),
                ),
                v1152 = v1148;
              this["_detachDragListeners"]();
              if (v1149) {
                const v1153 = {
                  durationSec: v1151,
                  persist: true,
                  commitHistory: true,
                  syncTimelineWidthAfterSettle: false,
                };
                this["_animateTrackVisualsToCurrentState"](
                  v1148["rowEl"],
                  "video",
                  { ...v1153 },
                );
              } else
                (this["_updateTrackVisuals"]("video", {
                  durationSec: v1148["previewDurationSec"],
                  syncTimelineWidth: false,
                }),
                  this["_persistTimelineMediaClip"]({ commitHistory: true }));
              this["_applyDeferredTimelineDragUpdate"](v1152);
              return;
            }
            if (v1148?.["kind"] === "audio" && v1148["pendingRange"]) {
              this["_commitAudioTrimDrag"](v1148, { persist: false });
              const v1154 = v1148;
              (this["_detachDragListeners"](),
                this["_updateTrackVisuals"]("audio", {
                  durationSec: v1148["previewDurationSec"],
                  syncTimelineWidth: false,
                }),
                this["_persistTimelineMediaClip"]({ commitHistory: true }),
                this["_applyDeferredTimelineDragUpdate"](v1154));
              return;
            }
            (appStore["updateNodeData"](this["id"], {
              mediaClip: this["_mediaClip"],
            }),
              (this["nodeData"] = {
                ...(this["nodeData"] || {}),
                mediaClip: this["_mediaClip"],
              }));
            const v1155 = v1148;
            (this["_detachDragListeners"](),
              this["_render"](),
              commit(),
              this["_applyDeferredTimelineDragUpdate"](v1155));
          };
        ((this["_dragMove"] = v1144),
          (this["_dragUp"] = v1146),
          window["addEventListener"]("pointermove", v1144, true),
          window["addEventListener"]("pointerup", v1146, {
            once: true,
            capture: true,
          }));
      }),
      v1127
    );
  }
  ["_detachDragListeners"]() {
    if (this["_dragMove"])
      window["removeEventListener"]("pointermove", this["_dragMove"], true);
    if (this["_dragUp"])
      window["removeEventListener"]("pointerup", this["_dragUp"], true);
    this["_stopTimelineDragAutoScroll"]();
    const v1156 = this["_timelineDrag"]();
    (v1156?.["segmentEl"]?.["classList"]["remove"]("is-dragging"),
      v1156?.["segmentEl"]?.["classList"]["remove"]("is-trimming"),
      v1156?.["segmentEl"]
        ?.["querySelectorAll"]?.(".media-clip-trim.is-hovered")
        ?.["forEach"]((v1157) => {
          v1157["classList"]["remove"]("is-hovered");
        }),
      v1156?.["rowEl"]?.["classList"]["remove"]("is-trimming"),
      v1156?.["rowEl"]?.["classList"]["remove"]("is-preview-dragging"),
      v1156?.["laneEl"]?.["classList"]["remove"]("is-trimming"),
      v1156?.["laneEl"]?.["classList"]["remove"]("is-moving"),
      v1156?.["timelineEl"]?.["classList"]["remove"]("is-moving-material"),
      v1156?.["scrollEl"]?.["classList"]["remove"]("is-trimming"),
      (this["_dragMove"] = null),
      (this["_dragUp"] = null),
      this["_setTimelineDrag"](null));
  }
  ["_startSegmentDrag"](v1158, v1159, v1160 = {}) {
    if (v1160["compact"] === true || v1159["button"] !== 0) return;
    (stopPointer(v1159),
      this["_cancelTimelineSettle"](),
      this["_stopTimelineDragAutoScroll"](),
      (this["_deferredTimelineDragNodeData"] = null));
    const v1161 = this["_mediaClip"]["tracks"]?.[v1158];
    if (!v1161) return;
    const v1162 =
        v1159["currentTarget"]?.["closest"](".media-clip-track") || null,
      v1163 = v1162?.["closest"]?.(".media-clip-timeline-scroll") || null,
      v1164 = v1162?.["closest"]?.(".media-clip-timeline-lane") || null,
      v1165 = v1162?.["closest"]?.(".media-clip-compact-timeline") || null,
      v1166 =
        v1158 === "audio"
          ? this["_audioTimelineClips"](v1161)["map"]((v1167) => ({ ...v1167 }))
          : this["_videoTimelineClips"](v1161)["map"]((v1168) => ({
              ...v1168,
            })),
      v1169 = Math["max"](0, Math["trunc"](toNumber(v1160["clipIndex"], 0))),
      v1170 = this["_resolveTimelineDragDuration"](
        v1158,
        v1161,
        v1166,
        v1159["currentTarget"],
        v1169,
      );
    if (v1158 === "video")
      (this["_setActiveClipIndex"](v1169),
        this["_selectClipIndex"](v1169),
        this["_syncTrackActiveClipChrome"](
          v1159["currentTarget"]?.["closest"](".media-clip-track"),
          v1158,
        ));
    else
      v1158 === "audio" &&
        (this["_setActiveAudioClipIndex"](v1169),
        this["_selectAudioClipIndex"](v1169),
        this["_syncTrackActiveClipChrome"](
          v1159["currentTarget"]?.["closest"](".media-clip-track"),
          v1158,
        ));
    try {
      v1159["currentTarget"]?.["setPointerCapture"]?.(v1159["pointerId"]);
    } catch {}
    (v1159["currentTarget"]?.["classList"]["add"]("is-dragging"),
      v1162?.["classList"]["add"]("is-preview-dragging"));
    const v1171 = this["_nextTimelineDragSessionId"]();
    this["_setTimelineDrag"]({
      sessionId: v1171,
      kind: v1158,
      mode: "move",
      clipIndex: v1169,
      startX: v1159["clientX"],
      startPlayheadSec: this["_playheadSec"],
      startTrack: { ...v1161 },
      startClips: v1166,
      startMediaClip: this["_mediaClip"],
      durationSec: v1170,
      startScrollLeft: toNumber(v1163?.["scrollLeft"], 0),
      latestClientX: v1159["clientX"],
      segmentEl: v1159["currentTarget"],
      rowEl: v1162,
      laneEl: v1164,
      timelineEl: v1165,
      scrollEl: v1163,
      pendingDeltaSec: 0,
      hasMoved: false,
    });
    const v1172 = (v1173) => this["_handleTrimDrag"](v1173, v1171),
      v1174 = (v1175) => {
        stopPointer(v1175);
        if (!this["_isTimelineDragSession"](v1171)) return;
        const v1176 = this["_timelineDrag"]();
        this["_persistTimelineDragScroll"](v1176);
        if (
          v1176?.["hasMoved"] &&
          v1176["kind"] === "video" &&
          v1176["startClips"]?.[v1176["clipIndex"]]
        ) {
          this["_commitVideoSegmentDrag"](v1176, { persist: false });
          const v1177 = v1176;
          (this["_detachDragListeners"](),
            this["_animateTrackVisualsToCurrentState"](
              v1176["rowEl"],
              "video",
              {
                durationSec: v1176["previewDurationSec"],
                persist: true,
                commitHistory: true,
                syncTimelineWidthAfterSettle: false,
              },
            ),
            this["_applyDeferredTimelineDragUpdate"](v1177));
          return;
        }
        if (
          v1176?.["hasMoved"] &&
          v1176["kind"] === "audio" &&
          v1176["startClips"]?.[v1176["clipIndex"]]
        ) {
          this["_commitAudioSegmentDrag"](v1176, { persist: false });
          const v1178 = v1176;
          (this["_detachDragListeners"](),
            this["_animateTrackVisualsToCurrentState"](
              v1176["rowEl"],
              "audio",
              {
                durationSec: v1176["previewDurationSec"],
                persist: true,
                commitHistory: true,
                syncTimelineWidthAfterSettle: false,
              },
            ),
            this["_applyDeferredTimelineDragUpdate"](v1178));
          return;
        } else
          v1176?.["hasMoved"] &&
            (appStore["updateNodeData"](this["id"], {
              mediaClip: this["_mediaClip"],
            }),
            (this["nodeData"] = {
              ...(this["nodeData"] || {}),
              mediaClip: this["_mediaClip"],
            }),
            commit());
        !v1176?.["hasMoved"] &&
          ((this["_suppressTrackClick"] = true),
          this["_setTimelinePlayheadFromPointer"](
            v1176?.["rowEl"],
            v1176?.["kind"],
            v1175,
            v1176?.["durationSec"],
            { clipIndex: v1176?.["clipIndex"] },
          ));
        const v1179 = v1176;
        this["_detachDragListeners"]();
        if (v1176?.["hasMoved"]) this["_render"]();
        this["_applyDeferredTimelineDragUpdate"](v1179);
      };
    ((this["_dragMove"] = v1172),
      (this["_dragUp"] = v1174),
      window["addEventListener"]("pointermove", v1172, true),
      window["addEventListener"]("pointerup", v1174, {
        once: true,
        capture: true,
      }));
  }
  ["_handleTrimDrag"](v1180, v1181 = null) {
    const v1182 = this["_timelineDrag"]();
    if (!v1182) return;
    if (v1181 != null && v1182["sessionId"] !== v1181) return;
    (stopPointer(v1180),
      (v1182["latestClientX"] = toNumber(
        v1180?.["clientX"],
        v1182["latestClientX"] ?? v1182["startX"],
      )),
      this["_applyTimelineDragPreviewFromPointer"](v1182, v1180),
      this["_scheduleTimelineDragAutoScroll"](v1182));
  }
  ["_applyTimelineDragPreviewFromPointer"](
    v1183 = this["_timelineDrag"](),
    v1184 = {},
  ) {
    if (!v1183) return;
    const v1185 = this["_timelineRowForDrag"](v1183),
      v1186 =
        v1183["durationSec"] ??
        this["_resolveTimelineDragDuration"](
          v1183["kind"],
          v1183["startTrack"],
          v1183["startClips"],
          v1183["segmentEl"],
          v1183["clipIndex"],
        );
    this["_syncTimelineHoverPlayheadFromPointer"](v1185, v1184, v1186);
    if (v1183["mode"] === "move") {
      this["_handleSegmentDrag"](v1184);
      return;
    }
    const v1187 = v1185?.["getBoundingClientRect"](),
      v1188 = Math["max"](
        1,
        toNumber(v1187?.["width"], readLayoutWidthPx(v1185, 1)),
      ),
      v1189 = getMediaClipTimelineDeltaSecFromPx(
        this["_timelineDragDeltaPx"](v1183, v1184),
        { durationSec: v1186, trackWidthPx: v1188 },
      );
    if (
      v1183["kind"] === "video" &&
      v1183["startClips"]?.[v1183["clipIndex"]]
    ) {
      this["_previewVideoTrimDrag"](v1183, v1189, v1186, v1185);
      return;
    } else {
      if (
        v1183["kind"] === "audio" &&
        v1183["startClips"]?.[v1183["clipIndex"]]
      ) {
        this["_previewAudioTrimDrag"](v1183, v1189, v1186, v1185);
        return;
      } else {
        const v1190 =
          v1183["side"] === "left"
            ? { startSec: v1183["startTrack"]["startSec"] + v1189 }
            : { endSec: v1183["startTrack"]["endSec"] + v1189 };
        this["_mediaClip"] = patchMediaClipTrackRange(
          this["_mediaClip"],
          v1183["kind"],
          v1190,
        );
        const v1191 = this["_mediaClip"]["tracks"]?.[v1183["kind"]];
        v1191 &&
          (this["_playheadSec"] =
            v1183["side"] === "left" ? v1191["startSec"] : v1191["endSec"]);
      }
    }
    (!(
      v1183["kind"] === "audio" && v1183["startClips"]?.[v1183["clipIndex"]]
    ) &&
      v1183["kind"] !== "video" &&
      this["_updateTrackVisuals"](v1183["kind"]),
      this["_syncPreviewTime"](
        v1183["kind"],
        this["_previewSourceSecForTimelineSec"](
          v1183["kind"],
          this["_playheadSec"],
        ),
      ));
  }
  ["_previewVideoTrimDrag"](v1192, v1193 = 0, v1194 = 0, v1195 = null) {
    const v1196 = v1192?.["startClips"]?.[v1192["clipIndex"]],
      v1197 = v1192?.["segmentEl"];
    if (!v1196 || !v1197) return;
    const v1198 =
        v1192["side"] === "left"
          ? { startSec: v1196["startSec"] + v1193 }
          : { endSec: v1196["endSec"] + v1193 },
      v1199 = clampMediaClipRange({ ...v1196, ...v1198 }, v1196["durationSec"]),
      v1200 = getMediaClipTimelineDisplayDuration(v1194);
    ((v1192["pendingRange"] = {
      startSec: v1199["startSec"],
      endSec: v1199["endSec"],
    }),
      (v1192["pendingRollRange"] = null));
    const v1201 = {
      ...this["_mediaClip"],
      clips: v1192["startClips"],
      tracks: {
        ...(this["_mediaClip"]["tracks"] || {}),
        video: v1192["startTrack"],
      },
    };
    this["_isRollingVideoLeftTrimDrag"](v1192) &&
      (v1192["pendingRollRange"] = { ...v1192["pendingRange"] });
    const v1202 = this["_isRollingVideoLeftTrimDrag"](v1192)
        ? rollMediaClipVisualLeftTrim(
            v1201,
            v1192["clipIndex"],
            v1192["pendingRange"],
          )
        : this["_isVideoLeftTrimDrag"](v1192)
          ? this["_buildVideoLeftTrimPreviewState"](v1192, v1199)
          : patchMediaClipClipRange(
              v1201,
              v1192["clipIndex"],
              v1192["pendingRange"],
            ),
      v1203 = v1202["clips"] || v1192["startClips"],
      v1204 = v1203?.[v1192["clipIndex"]] || v1196;
    v1192["pendingRange"] = {
      startSec: toNumber(v1204["startSec"], v1199["startSec"]),
      endSec: toNumber(v1204["endSec"], v1199["endSec"]),
    };
    const v1205 = toNumber(v1204["timelineStartSec"], 0),
      v1206 = Math["max"](v1205, toNumber(v1204["timelineEndSec"], v1205)),
      v1207 = Math["max"](0, v1206 - v1205);
    !this["_applyVideoTimelinePreview"](
      v1195 || v1192["rowEl"],
      v1203,
      v1200,
    ) &&
      (this["_applyTimelineSegmentRect"](
        v1197,
        getMediaClipTimelineRangeRect({
          startSec: v1205,
          endSec: v1206,
          durationSec: v1200,
        }),
      ),
      this["_updateTimelineSegmentLabel"](v1197, v1207));
    ((v1192["previewDurationSec"] = v1200),
      (v1192["pendingPlayheadSec"] = v1192["side"] === "left" ? v1205 : v1206),
      (v1192["hasMoved"] = true));
    const v1208 = this["_videoTimelineMaterialEnd"](
      v1202["tracks"]?.["video"],
      v1202["clips"],
    );
    (this["_syncTimelineAddSlotForRow"](v1195 || v1192["rowEl"], {
      displayDurationSec: v1200,
      materialEndSec: v1208,
    }),
      this["_updateTrackPlayheadVisual"](v1195 || v1192["rowEl"], v1200, {
        playheadSec: v1192["startPlayheadSec"],
      }),
      this["_syncPreviewTime"](
        "video",
        v1192["side"] === "left"
          ? v1192["pendingRange"]["startSec"]
          : v1192["pendingRange"]["endSec"],
      ));
  }
  ["_previewAudioTrimDrag"](v1209, v1210 = 0, v1211 = 0, v1212 = null) {
    const v1213 = v1209?.["startClips"]?.[v1209["clipIndex"]],
      v1214 = v1209?.["segmentEl"];
    if (!v1213 || !v1214) return;
    const v1215 =
        v1209["side"] === "left"
          ? { startSec: v1213["startSec"] + v1210 }
          : { endSec: v1213["endSec"] + v1210 },
      v1216 = clampMediaClipRange({ ...v1213, ...v1215 }, v1213["durationSec"]);
    v1209["pendingRange"] = {
      startSec: v1216["startSec"],
      endSec: v1216["endSec"],
    };
    const v1217 = patchMediaClipAudioClipRange(
        {
          ...this["_mediaClip"],
          audioClips: v1209["startClips"],
          tracks: {
            ...(this["_mediaClip"]["tracks"] || {}),
            audio: v1209["startTrack"],
          },
        },
        v1209["clipIndex"],
        v1209["pendingRange"],
      ),
      v1218 = v1217["audioClips"]?.[v1209["clipIndex"]];
    if (!v1218) return;
    const v1219 = getMediaClipTimelineDisplayDuration(v1211),
      v1220 = toNumber(v1218["timelineStartSec"], 0),
      v1221 = Math["max"](v1220, toNumber(v1218["timelineEndSec"], v1220)),
      v1222 = Math["max"](0, v1221 - v1220);
    (!this["_applyAudioTimelinePreview"](
      v1212 || v1209["rowEl"],
      v1217["audioClips"],
      v1219,
    ) &&
      (this["_applyAudioTimelineSegmentRect"](
        v1214,
        getMediaClipTimelineRangeRect({
          startSec: v1220,
          endSec: v1221,
          durationSec: v1219,
        }),
      ),
      this["_updateTimelineSegmentLabel"](v1214, v1222),
      this["_syncAudioSegmentWaveformViewport"](v1214, v1218)),
      (v1209["previewDurationSec"] = v1219),
      (v1209["pendingPlayheadSec"] = v1209["side"] === "left" ? v1220 : v1221),
      (v1209["hasMoved"] = true),
      this["_updateTrackPlayheadVisual"](v1212 || v1209["rowEl"], v1219, {
        playheadSec: v1209["startPlayheadSec"],
      }),
      this["_syncPreviewTime"](
        "audio",
        v1209["side"] === "left" ? v1216["startSec"] : v1216["endSec"],
      ));
  }
  ["_isVideoLeftTrimDrag"](v1223 = null) {
    const v1224 = Math["max"](
      0,
      Math["trunc"](toNumber(v1223?.["clipIndex"], 0)),
    );
    return (
      v1223?.["kind"] === "video" &&
      v1223?.["side"] === "left" &&
      !!v1223?.["startClips"]?.[v1224]
    );
  }
  ["_isFirstVideoLeftTrimDrag"](v1225 = null) {
    return (
      this["_isVideoLeftTrimDrag"](v1225) &&
      Math["max"](0, Math["trunc"](toNumber(v1225?.["clipIndex"], 0))) === 0
    );
  }
  ["_isRollingVideoLeftTrimDrag"](v1226 = null) {
    return (
      this["_isVideoLeftTrimDrag"](v1226) &&
      Math["max"](0, Math["trunc"](toNumber(v1226?.["clipIndex"], 0))) > 0
    );
  }
  ["_buildVideoLeftTrimPreviewState"](v1227 = {}, v1228 = {}) {
    const v1229 = Array["isArray"](v1227["startClips"])
        ? v1227["startClips"]
        : [],
      v1230 = Math["max"](0, Math["trunc"](toNumber(v1227?.["clipIndex"], 0))),
      v1231 = v1229[v1230] || {},
      v1232 = Math["max"](
        0,
        toNumber(v1228["endSec"], v1231["endSec"]) -
          toNumber(v1228["startSec"], v1231["startSec"]),
      ),
      v1233 = Math["max"](
        0,
        toNumber(
          v1231["timelineEndSec"],
          toNumber(v1231["timelineStartSec"], 0) +
            Math["max"](
              0,
              toNumber(v1231["endSec"], 0) - toNumber(v1231["startSec"], 0),
            ),
        ),
      ),
      v1234 = v1233 - v1232,
      v1235 = v1234 + v1232,
      v1236 = v1229["map"]((v1237, v1238) =>
        v1238 === v1230
          ? {
              ...v1237,
              startSec: v1228["startSec"],
              endSec: v1228["endSec"],
              timelineStartSec: Math["round"](v1234 * 1000) / 1000,
              timelineEndSec: Math["round"](v1235 * 1000) / 1000,
            }
          : { ...v1237 },
      );
    return {
      ...this["_mediaClip"],
      clips: v1236,
      tracks: {
        ...(this["_mediaClip"]["tracks"] || {}),
        video: {
          ...(v1227["startTrack"] || {}),
          startSec: v1228["startSec"],
          endSec: v1228["endSec"],
        },
      },
    };
  }
  ["_commitVideoTrimDrag"](v1239, v1240 = {}) {
    const v1241 = v1239["pendingRollRange"] || v1239["pendingRange"],
      v1242 = this["_isRollingVideoLeftTrimDrag"](v1239),
      v1243 = {
        ...this["_mediaClip"],
        clips: v1239["startClips"],
        tracks: {
          ...(this["_mediaClip"]["tracks"] || {}),
          video: v1239["startTrack"],
        },
      };
    this["_mediaClip"] = this["_isRollingVideoLeftTrimDrag"](v1239)
      ? rollMediaClipVisualLeftTrim(v1243, v1239["clipIndex"], v1241, {
          rebaseNegativeTimeline: true,
          rebaseTimelineStart: v1242,
        })
      : patchMediaClipClipRange(
          v1243,
          v1239["clipIndex"],
          v1239["pendingRange"],
        );
    const v1244 = normalizeText(
        v1239["startClips"]?.[v1239["clipIndex"]]?.["id"],
      ),
      v1245 = v1244
        ? this["_mediaClip"]["clips"]?.["findIndex"](
            (v1246) => normalizeText(v1246?.["id"]) === v1244,
          )
        : v1239["clipIndex"];
    v1245 >= 0 &&
      (this["_setActiveClipIndex"](v1245), this["_selectClipIndex"](v1245));
    const v1247 =
      this["_mediaClip"]["clips"]?.[v1245 >= 0 ? v1245 : v1239["clipIndex"]];
    if (v1247) {
      const v1248 = this["_videoTimelineDuration"](
          this["_mediaClip"]["tracks"]?.["video"],
        ),
        v1249 = this["_videoTimelineMaterialEnd"](
          this["_mediaClip"]["tracks"]?.["video"],
        ),
        v1250 = Math["max"](v1248, toNumber(v1239["previewDurationSec"], 0));
      ((this["_playheadSec"] = Math["max"](
        0,
        Math["min"](
          v1248,
          toNumber(v1239["startPlayheadSec"], this["_playheadSec"]),
        ),
      )),
        this["_syncTimelineAddSlotForRow"](v1239["rowEl"], {
          displayDurationSec: v1250,
          materialEndSec: v1249,
        }),
        this["_syncVideoPreviewSourceForTimelineSec"](this["_playheadSec"]),
        this["_syncPreviewTime"](
          "video",
          this["_videoSourceSecForPlayhead"](this["_playheadSec"]),
        ));
    }
    ((this["nodeData"] = {
      ...(this["nodeData"] || {}),
      mediaClip: this["_mediaClip"],
    }),
      v1240["persist"] !== false &&
        appStore["updateNodeData"](this["id"], {
          mediaClip: this["_mediaClip"],
        }));
  }
  ["_commitAudioTrimDrag"](v1251, v1252 = {}) {
    const v1253 = {
      ...this["_mediaClip"],
      audioClips: v1251["startClips"],
      tracks: {
        ...(this["_mediaClip"]["tracks"] || {}),
        audio: v1251["startTrack"],
      },
    };
    this["_mediaClip"] = patchMediaClipAudioClipRange(
      v1253,
      v1251["clipIndex"],
      v1251["pendingRange"],
    );
    const v1254 = normalizeText(
        v1251["startClips"]?.[v1251["clipIndex"]]?.["id"],
      ),
      v1255 = v1254
        ? this["_mediaClip"]["audioClips"]?.["findIndex"](
            (v1256) => normalizeText(v1256?.["id"]) === v1254,
          )
        : v1251["clipIndex"];
    v1255 >= 0 &&
      (this["_setActiveAudioClipIndex"](v1255),
      this["_selectAudioClipIndex"](v1255));
    const v1257 = this["_timelineDurationForKind"]("audio");
    ((this["_playheadSec"] = Math["max"](
      0,
      Math["min"](
        v1257,
        toNumber(v1251["startPlayheadSec"], this["_playheadSec"]),
      ),
    )),
      this["_syncTimelineAddSlotForRow"](v1251["rowEl"], {
        displayDurationSec: v1251["previewDurationSec"],
        materialEndSec: this["_timelineMaterialEndSec"](),
      }),
      this["_syncAudioPreviewSourceForTimelineSec"](this["_playheadSec"]),
      this["_syncPreviewTime"](
        "audio",
        this["_audioSourceSecForPlayhead"](this["_playheadSec"]),
      ),
      (this["nodeData"] = {
        ...(this["nodeData"] || {}),
        mediaClip: this["_mediaClip"],
      }),
      v1252["persist"] !== false &&
        appStore["updateNodeData"](this["id"], {
          mediaClip: this["_mediaClip"],
        }));
  }
  ["_handleSegmentDrag"](v1258) {
    const v1259 = this["_timelineDrag"]();
    if (!v1259) return;
    const v1260 = this["_timelineRowForDrag"](v1259),
      v1261 = v1260?.["getBoundingClientRect"](),
      v1262 = Math["max"](
        1,
        toNumber(v1261?.["width"], readLayoutWidthPx(v1260, 1)),
      ),
      v1263 =
        v1259["durationSec"] ??
        this["_resolveTimelineDragDuration"](
          v1259["kind"],
          v1259["startTrack"],
          v1259["startClips"],
          v1259["segmentEl"],
          v1259["clipIndex"],
        ),
      v1264 = this["_timelineDragDeltaPx"](v1259, v1258);
    if (!v1259["hasMoved"] && Math["abs"](v1264) <= 3) return;
    ((v1259["hasMoved"] = true),
      v1259["laneEl"]?.["classList"]["add"]("is-moving"),
      v1259["timelineEl"]?.["classList"]["add"]("is-moving-material"),
      (this["_suppressTrackClick"] = true));
    const v1265 = getMediaClipTimelineDeltaSecFromPx(v1264, {
      durationSec: v1263,
      trackWidthPx: v1262,
    });
    if (v1259["kind"] === "video" && v1259["startClips"]?.[v1259["clipIndex"]])
      this["_previewVideoSegmentDrag"](v1259, v1265, v1263);
    else {
      if (
        v1259["kind"] === "audio" &&
        v1259["startClips"]?.[v1259["clipIndex"]]
      )
        this["_previewAudioSegmentDrag"](v1259, v1265, v1263);
      else {
        const v1266 = {
          ...this["_mediaClip"],
          tracks: {
            ...(this["_mediaClip"]["tracks"] || {}),
            [v1259["kind"]]: v1259["startTrack"],
          },
        };
        this["_mediaClip"] = shiftMediaClipTrackRange(
          v1266,
          v1259["kind"],
          v1265,
        );
        const v1267 = this["_mediaClip"]["tracks"]?.[v1259["kind"]];
        if (v1267) {
          const v1268 = v1267["startSec"] - v1259["startTrack"]["startSec"];
          this["_playheadSec"] = Math["max"](
            v1267["startSec"],
            Math["min"](v1267["endSec"], v1259["startPlayheadSec"] + v1268),
          );
        }
      }
    }
    (!(
      v1259["kind"] === "audio" && v1259["startClips"]?.[v1259["clipIndex"]]
    ) &&
      v1259["kind"] !== "video" &&
      this["_updateTrackVisuals"](v1259["kind"]),
      this["_syncPreviewTime"](
        v1259["kind"],
        this["_previewSourceSecForTimelineSec"](
          v1259["kind"],
          this["_playheadSec"],
        ),
      ));
  }
  ["_previewVideoSegmentDrag"](v1269, v1270 = 0, v1271 = 0) {
    const v1272 = v1269?.["segmentEl"],
      v1273 = v1269?.["startClips"]?.[v1269["clipIndex"]];
    if (!v1272 || !v1273) return;
    const v1274 = getMediaClipTimelineDisplayDuration(v1271),
      v1275 = toNumber(v1273["timelineStartSec"], 0),
      v1276 = Math["max"](v1275, toNumber(v1273["timelineEndSec"], v1275)),
      v1277 = Math["max"](0.1, v1276 - v1275),
      v1278 = Math["max"](
        0,
        Math["min"](Math["max"](0, v1274 - v1277), v1275 + v1270),
      );
    (this["_applyTimelineSegmentRect"](
      v1272,
      getMediaClipTimelineRangeRect({
        startSec: v1278,
        endSec: v1278 + v1277,
        durationSec: v1274,
      }),
    ),
      this["_updateTimelineSegmentLabel"](v1272, v1277),
      (v1269["previewDurationSec"] = v1274),
      (v1269["pendingDeltaSec"] = v1278 - v1275));
  }
  ["_previewAudioSegmentDrag"](v1279, v1280 = 0, v1281 = 0) {
    const v1282 = v1279?.["segmentEl"],
      v1283 = v1279?.["startClips"]?.[v1279["clipIndex"]];
    if (!v1282 || !v1283) return;
    const v1284 = getMediaClipTimelineDisplayDuration(v1281),
      v1285 = toNumber(v1283["timelineStartSec"], 0),
      v1286 = Math["max"](v1285, toNumber(v1283["timelineEndSec"], v1285)),
      v1287 = Math["max"](0.1, v1286 - v1285),
      v1288 = Math["max"](0, v1285 + v1280);
    (this["_applyAudioTimelineSegmentRect"](
      v1282,
      getMediaClipTimelineRangeRect({
        startSec: v1288,
        endSec: v1288 + v1287,
        durationSec: v1284,
      }),
    ),
      this["_updateTimelineSegmentLabel"](v1282, v1287),
      (v1279["previewDurationSec"] = v1284),
      (v1279["pendingDeltaSec"] = v1288 - v1285),
      (v1279["pendingPlayheadSec"] = Math["max"](
        v1288,
        Math["min"](
          v1288 + v1287,
          v1279["startPlayheadSec"] + v1279["pendingDeltaSec"],
        ),
      )));
  }
  ["_commitVideoSegmentDrag"](v1289, v1290 = {}) {
    const v1291 = {
      ...this["_mediaClip"],
      clips: v1289["startClips"],
      tracks: {
        ...(this["_mediaClip"]["tracks"] || {}),
        video: v1289["startTrack"],
      },
    };
    this["_mediaClip"] = moveMediaClipClipOnTimeline(
      v1291,
      v1289["clipIndex"],
      v1289["pendingDeltaSec"],
    );
    const v1292 = normalizeText(
        v1289["startClips"]?.[v1289["clipIndex"]]?.["id"],
      ),
      v1293 = v1292
        ? this["_mediaClip"]["clips"]?.["findIndex"](
            (v1294) => normalizeText(v1294?.["id"]) === v1292,
          )
        : -1;
    v1293 >= 0 &&
      (this["_setActiveClipIndex"](v1293), this["_selectClipIndex"](v1293));
    const v1295 = this["_videoTimelineDuration"](
      this["_mediaClip"]["tracks"]?.["video"],
    );
    ((this["_playheadSec"] = Math["max"](
      0,
      Math["min"](v1295, v1289["startPlayheadSec"]),
    )),
      (this["nodeData"] = {
        ...(this["nodeData"] || {}),
        mediaClip: this["_mediaClip"],
      }),
      v1290["persist"] !== false &&
        appStore["updateNodeData"](this["id"], {
          mediaClip: this["_mediaClip"],
        }));
  }
  ["_commitAudioSegmentDrag"](v1296, v1297 = {}) {
    const v1298 = {
      ...this["_mediaClip"],
      audioClips: v1296["startClips"],
      tracks: {
        ...(this["_mediaClip"]["tracks"] || {}),
        audio: v1296["startTrack"],
      },
    };
    this["_mediaClip"] = moveMediaClipAudioClipOnTimeline(
      v1298,
      v1296["clipIndex"],
      v1296["pendingDeltaSec"],
    );
    const v1299 = normalizeText(
        v1296["startClips"]?.[v1296["clipIndex"]]?.["id"],
      ),
      v1300 = v1299
        ? this["_mediaClip"]["audioClips"]?.["findIndex"](
            (v1301) => normalizeText(v1301?.["id"]) === v1299,
          )
        : v1296["clipIndex"];
    v1300 >= 0 &&
      (this["_setActiveAudioClipIndex"](v1300),
      this["_selectAudioClipIndex"](v1300));
    const v1302 = this["_timelineDurationForKind"]("audio");
    ((this["_playheadSec"] = Math["max"](
      0,
      Math["min"](v1302, this["_playheadSec"]),
    )),
      this["_syncTimelineAddSlotForRow"](v1296["rowEl"], {
        displayDurationSec: v1296["previewDurationSec"],
        materialEndSec: this["_timelineMaterialEndSec"](),
      }),
      this["_syncAudioPreviewSourceForTimelineSec"](this["_playheadSec"]),
      this["_syncPreviewTime"](
        "audio",
        this["_audioSourceSecForPlayhead"](this["_playheadSec"]),
      ),
      (this["nodeData"] = {
        ...(this["nodeData"] || {}),
        mediaClip: this["_mediaClip"],
      }),
      v1297["persist"] !== false &&
        appStore["updateNodeData"](this["id"], {
          mediaClip: this["_mediaClip"],
        }));
  }
  ["_flushTimelineSettlePersist"]() {
    if (!this["_timelineSettlePendingPersist"]) return;
    const v1303 = this["_timelineSettlePendingCommit"];
    ((this["_timelineSettlePendingPersist"] = false),
      (this["_timelineSettlePendingCommit"] = false),
      this["_persistTimelineMediaClip"]({ commitHistory: v1303 }));
  }
  ["_persistTimelineMediaClip"](v1304 = {}) {
    ((this["_skipNextStoreMediaClipRender"] = true),
      appStore["updateNodeData"](this["id"], { mediaClip: this["_mediaClip"] }),
      (this["nodeData"] = {
        ...(this["nodeData"] || {}),
        mediaClip: this["_mediaClip"],
      }));
    if (v1304["commitHistory"] === true) commit();
  }
  ["_applyDeferredTimelineDragUpdate"](v1305 = null) {
    const v1306 = this["_deferredTimelineDragNodeData"];
    this["_deferredTimelineDragNodeData"] = null;
    if (!v1306 || this["_timelineDrag"]()) return;
    const v1307 = v1306["mediaClip"];
    if (isSameMediaClipState(v1307, this["_mediaClip"])) return;
    if (
      v1305?.["startMediaClip"] &&
      isSameMediaClipState(v1307, v1305["startMediaClip"])
    )
      return;
    this["update"](v1306);
  }
  ["_scheduleTimelineSettleRender"](v1308, v1309 = {}) {
    if (this["_timelineSettleTimer"])
      clearTimeout(this["_timelineSettleTimer"]);
    this["_timelineSettleRow"] = v1308 || this["_timelineSettleRow"];
    const v1310 = this["_timelineSettleVersion"];
    ((this["_timelineSettlePendingPersist"] =
      this["_timelineSettlePendingPersist"] || v1309["persist"] === true),
      (this["_timelineSettlePendingCommit"] =
        this["_timelineSettlePendingCommit"] ||
        v1309["commitHistory"] === true),
      (this["_timelineSettleTimer"] = setTimeout(() => {
        if (v1310 !== this["_timelineSettleVersion"]) return;
        this["_timelineSettleTimer"] = 0;
        const v1311 = this["_timelineSettleRow"] || v1308;
        (v1311?.["classList"]["remove"]("is-settling"),
          (this["_timelineSettleRow"] = null),
          v1309["syncTimelineWidthAfterSettle"] !== false &&
            this["_syncTimelineContentWidth"](),
          this["_flushTimelineSettlePersist"]());
      }, TIMELINE_SETTLE_ANIMATION_MS)));
  }
  ["_animateTrackVisualsToCurrentState"](v1312, v1313 = "video", v1314 = {}) {
    const v1315 = this["_startTimelineSettle"](v1312),
      v1316 = { ...v1314 };
    v1316["persist"] === true &&
      (this["_persistTimelineMediaClip"]({
        commitHistory: v1316["commitHistory"] === true,
      }),
      (v1316["persist"] = false),
      (v1316["commitHistory"] = false));
    const v1317 = () => {
      if (v1315 !== this["_timelineSettleVersion"] || this["_timelineDrag"]())
        return;
      (this["_updateTrackVisuals"](v1313, {
        durationSec: v1316["durationSec"],
        syncTimelineWidth: false,
      }),
        this["_scheduleTimelineSettleRender"](v1312, v1316));
    };
    if (typeof requestAnimationFrame === "function")
      requestAnimationFrame(() => requestAnimationFrame(v1317));
    else setTimeout(v1317, 0);
  }
  ["_startTimelineSettle"](v1318) {
    (this["_cancelTimelineSettle"](), (this["_timelineSettleVersion"] += 1));
    if (this["_timelineSettleTimer"]) {
      (clearTimeout(this["_timelineSettleTimer"]),
        (this["_timelineSettleTimer"] = 0));
      const v1319 = this["_timelineSettleRow"] || v1318;
      (v1319?.["classList"]["remove"]("is-settling"),
        (this["_timelineSettleRow"] = null),
        this["_flushTimelineSettlePersist"]());
    }
    return (
      (this["_timelineSettleRow"] = v1318 || null),
      v1318?.["classList"]["add"]("is-settling"),
      v1318?.["getBoundingClientRect"]?.(),
      this["_timelineSettleVersion"]
    );
  }
  ["_cancelTimelineSettle"](v1320 = {}) {
    this["_timelineSettleVersion"] =
      toNumber(this["_timelineSettleVersion"], 0) + 1;
    this["_timelineSettleTimer"] &&
      (clearTimeout(this["_timelineSettleTimer"]),
      (this["_timelineSettleTimer"] = 0));
    const v1321 = this["_timelineSettleRow"];
    (v1321?.["classList"]["remove"]("is-settling"),
      (this["_timelineSettleRow"] = null),
      v1320["flushPersist"] !== false
        ? this["_flushTimelineSettlePersist"]()
        : ((this["_timelineSettlePendingPersist"] = false),
          (this["_timelineSettlePendingCommit"] = false)));
  }
  ["_updateTrackPlayheadVisual"](v1322, v1323 = 0, v1324 = {}) {
    if (!v1322) return;
    const v1325 = this["_timelineCursorHost"](v1322),
      v1326 =
        v1325?.["querySelector"]?.(".media-clip-playhead") ||
        v1322["querySelector"]?.(".media-clip-playhead");
    if (!v1326) return;
    this["_applyTimelinePlayheadModel"](
      v1326,
      getMediaClipTimelinePlayheadModel({
        playheadSec: v1324["playheadSec"] ?? this["_playheadSec"],
        durationSec: v1323,
      }),
    );
  }
  ["_updateTimelineHoverPlayheadVisual"](v1327, v1328 = 0, v1329 = {}) {
    if (!v1327) return;
    const v1330 = this["_timelineCursorHost"](v1327),
      v1331 =
        v1330?.["querySelector"]?.(".media-clip-hover-playhead") ||
        v1327["querySelector"]?.(".media-clip-hover-playhead");
    if (!v1331) return;
    ((v1331["hidden"] = false),
      v1331["classList"]?.["add"]("is-visible"),
      this["_applyTimelinePlayheadModel"](
        v1331,
        getMediaClipTimelinePlayheadModel({
          playheadSec: v1329["playheadSec"] ?? this["_playheadSec"],
          durationSec: v1328,
        }),
      ));
  }
  ["_hideTimelineHoverPlayhead"](v1332 = null) {
    const v1333 = this["_timelineCursorHost"](v1332),
      v1334 = v1333?.["querySelectorAll"]
        ? v1333["querySelectorAll"](".media-clip-hover-playhead")
        : this["el"]?.["querySelectorAll"]?.(".media-clip-hover-playhead");
    v1334?.["forEach"]?.((v1335) => {
      (v1335["classList"]?.["remove"]("is-visible"), (v1335["hidden"] = true));
    });
  }
  ["_updatePlaybackVisuals"](v1336) {
    const v1337 = this["_mediaClip"]["tracks"]?.[v1336],
      v1338 = this["el"]?.["querySelector"](
        ".media-clip-track-" + v1336 + ":not(.is-compact)",
      );
    if (!v1337 || !v1338) return;
    const v1339 = this["_timelineDurationForKind"](v1336);
    this["_updateTrackPlayheadVisual"](v1338, v1339);
  }
  ["_updateTrackVisuals"](v1340, v1341 = {}) {
    const v1342 = this["_mediaClip"]["tracks"]?.[v1340],
      v1343 = this["el"]?.["querySelector"](
        ".media-clip-track-" + v1340 + ":not(.is-compact)",
      );
    if (!v1342 || !v1343) return;
    const v1344 =
      v1340 === "video"
        ? getMediaClipTimelineDisplayDuration(
            v1341["durationSec"] ?? this["_videoTimelineDuration"](v1342),
          )
        : getMediaClipTimelineDisplayDuration(
            v1341["durationSec"] ?? this["_timelineDurationForKind"](v1340),
          );
    if (v1340 === "video" && v1341["syncTimelineWidth"] !== false)
      this["_syncTimelineContentWidth"]();
    else {
      if (v1340 === "video") {
        const v1345 = Math["max"](
          240,
          readLayoutWidthPx(v1343, this["_timelineTrackContentWidth"]()),
        );
        this["_syncTimelineAddSlotPosition"](v1345, {
          displayDurationSec: v1344,
        });
      }
    }
    if (v1340 === "video" && (this["_mediaClip"]["clips"] || [])["length"]) {
      const v1346 = this["_mediaClip"]["clips"] || [];
      v1343["querySelectorAll"](".media-clip-segment")["forEach"]((v1347) => {
        const v1348 = this["_segmentClipIndex"](v1347, v1340, v1346),
          v1349 = v1346[v1348];
        if (!v1349) return;
        v1347["dataset"]["clipIndex"] = String(v1348);
        const v1350 = normalizeText(v1349["id"]);
        if (v1350) v1347["dataset"]["clipId"] = v1350;
        const v1351 = toNumber(v1349["timelineStartSec"], 0),
          v1352 = Math["max"](v1351, toNumber(v1349["timelineEndSec"], v1351));
        (this["_applyTimelineSegmentRect"](
          v1347,
          this["_timelinePreviewRangeRect"]({
            startSec: v1351,
            endSec: v1352,
            durationSec: v1344,
          }),
        ),
          this["_updateTimelineSegmentLabel"](
            v1347,
            Math["max"](0, v1352 - v1351),
          ));
      });
    } else {
      if (
        v1340 === "audio" &&
        (this["_mediaClip"]["audioClips"] || [])["length"]
      ) {
        const v1353 = this["_mediaClip"]["audioClips"] || [];
        v1343["querySelectorAll"](".media-clip-segment")["forEach"]((v1354) => {
          const v1355 = this["_segmentClipIndex"](v1354, v1340, v1353),
            v1356 = v1353[v1355];
          if (!v1356) return;
          v1354["dataset"]["clipIndex"] = String(v1355);
          const v1357 = normalizeText(v1356["id"]);
          if (v1357) v1354["dataset"]["clipId"] = v1357;
          const v1358 = toNumber(v1356["timelineStartSec"], 0),
            v1359 = Math["max"](
              v1358,
              toNumber(v1356["timelineEndSec"], v1358),
            );
          (this["_applyAudioTimelineSegmentRect"](
            v1354,
            getMediaClipTimelineRangeRect({
              startSec: v1358,
              endSec: v1359,
              durationSec: v1344,
            }),
          ),
            this["_updateTimelineSegmentLabel"](
              v1354,
              Math["max"](0, v1359 - v1358),
            ),
            this["_syncAudioSegmentWaveformViewport"](v1354, v1356));
        });
      } else {
        const v1360 = v1343["querySelector"](".media-clip-segment");
        if (v1360) {
          const v1361 = toNumber(v1342["startSec"], 0),
            v1362 = Math["max"](v1361, toNumber(v1342["endSec"], v1361));
          v1340 === "audio"
            ? this["_applyAudioTimelineSegmentRect"](
                v1360,
                getMediaClipTimelineRangeRect({
                  startSec: v1361,
                  endSec: v1362,
                  durationSec: v1344,
                }),
              )
            : this["_applyTimelineSegmentRect"](
                v1360,
                getMediaClipTimelineRangeRect({
                  startSec: v1361,
                  endSec: v1362,
                  durationSec: v1344,
                }),
              );
          this["_updateTimelineSegmentLabel"](
            v1360,
            Math["max"](0, v1362 - v1361),
          );
          if (v1340 === "audio")
            this["_syncAudioSegmentWaveformViewport"](v1360, v1342);
        }
      }
    }
    (this["_syncTrackActiveClipChrome"](v1343, v1340),
      this["_updateTrackPlayheadVisual"](v1343, v1344));
  }
  ["_primaryDuration"](v1363 = {}) {
    const v1364 = this["_mediaClip"]["tracks"]?.["video"],
      v1365 = this["_mediaClip"]["tracks"]?.["audio"];
    return (
      (v1364 ? this["_videoTimelineDuration"](v1364, null, v1363) : 0) ||
      this["_audioTimelineDuration"](v1365, null, v1363) ||
      10
    );
  }
  ["_refreshMediaClipTimelineInPlace"]() {
    if (
      this["_mediaClip"]["expanded"] !== true ||
      !(
        this["_mediaClip"]["tracks"]?.["video"] ||
        this["_mediaClip"]["tracks"]?.["audio"]
      )
    ) {
      this["_render"]();
      return;
    }
    this["_rerenderCompactOnly"]();
    const v1366 = this["_getPlaybackKind"]();
    if (v1366 === "video")
      (this["_syncVideoPreviewSourceForTimelineSec"](this["_playheadSec"]),
        this["_syncPreviewTime"](
          "video",
          this["_videoSourceSecForPlayhead"](this["_playheadSec"]),
          { immediate: true },
        ));
    else
      v1366 === "audio" &&
        (this["_setActiveAudioClipIndex"](
          this["_audioClipIndexAtTimelineSec"](this["_playheadSec"]),
        ),
        this["_syncAudioPreviewSourceForTimelineSec"](this["_playheadSec"]),
        this["_syncPreviewTime"](
          "audio",
          this["_audioSourceSecForPlayhead"](this["_playheadSec"]),
          { immediate: true },
        ));
    this["_updatePreviewControls"]();
  }
  ["_edgeIdForMaterial"](v1367 = "video", v1368 = 0) {
    if (v1367 === "audio") {
      const v1369 = this["_audioTimelineClips"](
          this["_mediaClip"]["tracks"]?.["audio"],
        )[v1368],
        v1370 = this["_audioClipSource"](v1369, v1368);
      return normalizeText(v1370?.["__mediaClipEdgeId"]);
    }
    const v1371 = this["_videoTimelineClips"](
        this["_mediaClip"]["tracks"]?.["video"],
      )[v1368],
      v1372 = this["_videoClipSource"](v1371, v1368);
    return normalizeText(v1372?.["__mediaClipEdgeId"]);
  }
  ["_deleteActiveMaterial"]() {
    const v1373 =
        this["_mediaClip"]["activeTrack"] === "audio" ? "audio" : "video",
      v1374 =
        v1373 === "video"
          ? this["_clampSelectedClipIndex"](this["_selectedClipIndex"]) >= 0
            ? this["_clampSelectedClipIndex"](this["_selectedClipIndex"])
            : this["_clampVideoClipIndex"](this["_activeClipIndex"])
          : this["_clampSelectedAudioClipIndex"](
                this["_selectedAudioClipIndex"],
              ) >= 0
            ? this["_clampSelectedAudioClipIndex"](
                this["_selectedAudioClipIndex"],
              )
            : this["_clampAudioClipIndex"](this["_activeAudioClipIndex"]);
    this["_deleteMaterial"](v1373, v1374);
  }
  ["_deleteMaterial"](v1375 = "video", v1376 = 0) {
    if (this["_timelineDrag"]()) return;
    const v1377 = v1375 === "audio" ? "audio" : "video",
      v1378 = this["_mediaClip"]["activeTrack"];
    (this["_pausePreviewPlayback"]({ updateControls: false }),
      (this["_materialMenu"] = null));
    let v1379 = this["_mediaClip"],
      v1380 = "";
    if (v1377 === "audio") {
      if (!this["_mediaClip"]["tracks"]?.["audio"]) return;
      const v1381 = this["_audioTimelineClips"](
          this["_mediaClip"]["tracks"]?.["audio"],
        ),
        v1382 = Math["max"](
          0,
          Math["min"](v1381["length"] - 1, Math["trunc"](toNumber(v1376, 0))),
        ),
        v1383 = v1381[v1382];
      if (!v1383) return;
      const v1384 = this["_audioClipSource"](v1383, v1382),
        v1385 = normalizeText(v1383["sourceId"] || v1384?.["id"]),
        v1386 = normalizeText(
          v1383["sourceKey"] || resolveMediaClipLocalPath(v1384),
        );
      ((v1380 = this["_edgeIdForMaterial"]("audio", v1382)),
        (v1379 = removeMediaClipAudioClip(this["_mediaClip"], v1382)));
      const v1387 = Array["isArray"](v1379["audioClips"])
          ? v1379["audioClips"]
          : [],
        v1388 = v1387["some"]((v1389) => {
          const v1390 = normalizeText(v1389?.["sourceId"]),
            v1391 = normalizeText(v1389?.["sourceKey"]);
          return (v1385 && v1390 === v1385) || (v1386 && v1391 === v1386);
        });
      if (v1388) v1380 = "";
      ((this["_activeAudioClipIndex"] = v1387["length"]
        ? Math["max"](0, Math["min"](v1387["length"] - 1, v1382))
        : 0),
        (this["_selectedAudioClipIndex"] = v1387["length"]
          ? this["_activeAudioClipIndex"]
          : -1),
        (v1379 = {
          ...v1379,
          activeTrack: v1379["tracks"]?.["video"]
            ? "video"
            : v1379["tracks"]?.["audio"]
              ? "audio"
              : "video",
          expanded:
            !!(v1379["tracks"]?.["video"] || v1379["tracks"]?.["audio"]) &&
            this["_mediaClip"]["expanded"] === true,
        }));
    } else {
      const v1392 = this["_videoTimelineClips"](
          this["_mediaClip"]["tracks"]?.["video"],
        ),
        v1393 = Math["max"](
          0,
          Math["min"](v1392["length"] - 1, Math["trunc"](toNumber(v1376, 0))),
        ),
        v1394 = v1392[v1393];
      if (!v1394) return;
      const v1395 = this["_videoClipSource"](v1394, v1393),
        v1396 = normalizeText(v1394["sourceId"] || v1395?.["id"]),
        v1397 = normalizeText(
          v1394["sourceKey"] || resolveMediaClipLocalPath(v1395),
        );
      ((v1380 = this["_edgeIdForMaterial"]("video", v1393)),
        (v1379 = removeMediaClipClip(this["_mediaClip"], v1393)));
      const v1398 = Array["isArray"](v1379["clips"]) ? v1379["clips"] : [],
        v1399 = v1398["some"]((v1400) => {
          const v1401 = normalizeText(v1400?.["sourceId"]),
            v1402 = normalizeText(v1400?.["sourceKey"]);
          return (v1396 && v1401 === v1396) || (v1397 && v1402 === v1397);
        });
      if (v1399) v1380 = "";
      ((this["_activeClipIndex"] = v1398["length"]
        ? Math["max"](0, Math["min"](v1398["length"] - 1, v1393))
        : 0),
        (this["_selectedClipIndex"] = v1398["length"]
          ? this["_activeClipIndex"]
          : -1),
        (v1379 = {
          ...v1379,
          activeTrack: v1379["tracks"]?.["video"]
            ? "video"
            : v1379["tracks"]?.["audio"]
              ? "audio"
              : "video",
          expanded:
            !!(v1379["tracks"]?.["video"] || v1379["tracks"]?.["audio"]) &&
            this["_mediaClip"]["expanded"] === true,
        }));
    }
    const v1403 = v1379["expanded"] !== true || v1378 !== v1379["activeTrack"];
    this["_setMediaClipWithLayout"](v1379, false, { render: false });
    v1380 &&
      typeof appStore["removeEdge"] === "function" &&
      ((this["_skipNextIncomingMediaClipRender"] = true),
      appStore["removeEdge"](v1380),
      this["_skipNextIncomingMediaClipRender"] === true &&
        (this["_skipNextIncomingMediaClipRender"] = false));
    commit();
    if (v1403) this["_render"]();
    else this["_refreshMediaClipTimelineInPlace"]();
  }
  ["_singleVisualClipExportTrack"](v1404 = {}) {
    return {
      sourceKey: v1404["sourceKey"],
      startSec: v1404["startSec"],
      endSec: v1404["endSec"],
      durationSec: v1404["durationSec"],
    };
  }
  ["_exportVisualClips"](v1405 = this["_mediaClip"]["tracks"]?.["video"]) {
    return this["_videoTimelineClips"](v1405)
      ["map"]((v1406, v1407) => {
        const v1408 = this["_videoClipSource"](v1406, v1407),
          v1409 = firstNonEmpty(
            resolveMediaClipSourceKey(v1408),
            v1406?.["sourceKey"],
            resolveMediaClipLocalPath(v1408),
          );
        if (!v1409) return null;
        return {
          source: v1408,
          sourceKey: v1409,
          kind: this["_visualClipKind"](v1406, v1408),
          startSec: v1406["startSec"],
          endSec: v1406["endSec"],
          durationSec: v1406["durationSec"],
          timelineStartSec: v1406["timelineStartSec"],
          timelineEndSec: v1406["timelineEndSec"],
        };
      })
      ["filter"](Boolean);
  }
  ["_firstExportVideoSource"](v1410 = []) {
    return (
      v1410["find"]((v1411) => v1411["kind"] === "video")?.["source"] ||
      v1410[0]?.["source"] ||
      this["_firstVideoSource"]()
    );
  }
  ["_exportVisualDurationSec"](v1412 = []) {
    return v1412["reduce"]((v1413, v1414) => {
      const v1415 = toNumber(v1414?.["startSec"], 0),
        v1416 = Math["max"](v1415, toNumber(v1414?.["endSec"], v1415));
      return v1413 + Math["max"](0, v1416 - v1415);
    }, 0);
  }
  ["_exportLoadingTargetElement"]() {
    return (
      this["el"]?.["querySelector"]?.(".media-clip-preview") ||
      this["el"]?.["querySelector"]?.(".media-clip-compact-body") ||
      this["el"] ||
      null
    );
  }
  ["_startExportLoading"](v1417 = "正在导出素材") {
    if (typeof document === "undefined") return;
    const v1418 = this["_exportLoadingTargetElement"]();
    if (!v1418) return;
    this["_exportLoadingTarget"] &&
      this["_exportLoadingTarget"] !== v1418 &&
      this["_stopExportLoading"]();
    ((this["_exportLoadingTarget"] = v1418),
      v1418["classList"]?.["add"]("is-exporting-material"));
    const v1419 = v1418["querySelector"]?.(
      ".media-clip-export-loading-overlay",
    );
    if (v1419) {
      const v1420 = v1419["querySelector"]?.(
        ".media-clip-export-loading-label",
      );
      if (v1420) v1420["textContent"] = v1417;
      return;
    }
    const v1421 = document["createElement"]("div");
    ((v1421["className"] = "media-clip-export-loading-overlay"),
      v1421["setAttribute"]("role", "status"),
      v1421["setAttribute"]("aria-live", "polite"));
    const v1422 = document["createElement"]("div");
    v1422["className"] = "media-clip-export-loading-spinner";
    const v1423 = document["createElement"]("div");
    ((v1423["className"] = "media-clip-export-loading-label"),
      (v1423["textContent"] = v1417));
    const v1424 = document["createElement"]("div");
    v1424["className"] = "media-clip-export-loading-bar";
    const v1425 = document["createElement"]("div");
    ((v1425["className"] = "media-clip-export-loading-bar-fill"),
      v1424["appendChild"](v1425),
      v1421["append"](v1422, v1423, v1424),
      v1418["appendChild"](v1421));
  }
  ["_stopExportLoading"]() {
    const v1426 = this["_exportLoadingTarget"];
    (v1426?.["classList"]?.["remove"]("is-exporting-material"),
      v1426?.["querySelectorAll"]?.(".media-clip-export-loading-overlay")?.[
        "forEach"
      ]((v1427) => {
        if (typeof v1427["remove"] === "function") {
          v1427["remove"]();
          return;
        }
        v1427["parentNode"]?.["removeChild"]?.(v1427);
      }),
      (this["_exportLoadingTarget"] = null));
  }
  ["_waitForExportLoadingFrame"]() {
    return new Promise((v1428) => {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => v1428());
        return;
      }
      setTimeout(v1428, 0);
    });
  }
  async ["_exportMaterialToCanvas"](v1429 = "video", v1430 = 0) {
    if (this["_exporting"]) return;
    const v1431 = v1429 === "audio" ? "audio" : "video";
    let v1432 = null,
      v1433 = null,
      v1434 = "",
      v1435 = {},
      v1436 = null;
    if (v1431 === "audio") {
      const v1437 = this["_mediaClip"]["tracks"]?.["audio"] || null,
        v1438 = this["_audioTimelineClips"](v1437),
        v1439 = Math["max"](
          0,
          Math["min"](v1438["length"] - 1, Math["trunc"](toNumber(v1430, 0))),
        ),
        v1440 = v1438[v1439] || null,
        v1441 = v1440
          ? {
              sourceKey: v1440["sourceKey"],
              startSec: v1440["startSec"],
              endSec: v1440["endSec"],
              durationSec: v1440["durationSec"],
            }
          : v1437;
      ((v1433 = v1440
        ? this["_audioClipSource"](v1440, v1439)
        : this["_sources"]["audio"]),
        (v1432 = buildMediaClipExportPayload({
          audioSource: v1433,
          audioTrack: v1441,
        })),
        (v1434 = "audio"),
        (v1435 = {
          source: v1433,
          name: "剪辑音频",
          durationSec: Math["max"](
            0,
            toNumber(v1441?.["endSec"], 0) - toNumber(v1441?.["startSec"], 0),
          ),
        }));
    } else {
      const v1442 = this["_videoTimelineClips"](
          this["_mediaClip"]["tracks"]?.["video"],
        ),
        v1443 = Math["max"](
          0,
          Math["min"](v1442["length"] - 1, Math["trunc"](toNumber(v1430, 0))),
        ),
        v1444 = v1442[v1443];
      if (!v1444) return;
      v1433 = this["_videoClipSource"](v1444, v1443);
      const v1445 = this["_visualClipKind"](v1444, v1433);
      v1445 === "image"
        ? ((v1436 = v1433), (v1435 = { name: "剪辑图片" }))
        : ((v1432 = buildMediaClipExportPayload({
            videoSource: v1433,
            videoTrack: this["_singleVisualClipExportTrack"](v1444),
          })),
          (v1434 = "video"),
          (v1435 = {
            source: v1433,
            name: "剪辑视频",
            durationSec: Math["max"](
              0,
              toNumber(v1444["endSec"], 0) - toNumber(v1444["startSec"], 0),
            ),
          }));
    }
    if (!v1432 && !v1436) {
      window["showToast"]?.("没有可导出的素材");
      return;
    }
    ((this["_exporting"] = true),
      this["el"]?.["classList"]?.["add"]("is-exporting"),
      this["_startExportLoading"]());
    try {
      await this["_waitForExportLoadingFrame"]();
      if (v1436) this["_addImageOutputNodeFromSource"](v1436, v1435);
      else {
        const v1446 = await runLocalMediaClipExport(v1432, { timeout: 600000 });
        this["_addOutputNode"](v1434 || v1432["outputType"], v1446, v1435);
      }
      window["showToast"]?.("素材已导出到画布");
    } catch (v1447) {
      window["showToast"]?.(v1447?.["message"] || "素材导出失败");
    } finally {
      ((this["_exporting"] = false),
        this["el"]?.["classList"]?.["remove"]("is-exporting"),
        this["_stopExportLoading"](),
        this["_render"]());
    }
  }
  ["_renderDownloadMenu"]() {
    const v1448 = document["createElement"]("div");
    v1448["className"] = "v2-canvas-ctx-menu media-clip-menu";
    const v1449 = makeButton(
      "v2-menu-row media-clip-menu-item",
      "合成到画布",
      "合成到画布",
    );
    v1449["addEventListener"]("click", async (v1450) => {
      (stopPointer(v1450),
        this["_setDownloadMenuOpen"](false),
        await this["_exportAndUse"]("canvas"));
    });
    const v1451 = makeButton(
      "v2-menu-row\x20media-clip-menu-item",
      "导出",
      "导出",
    );
    return (
      v1451["addEventListener"]("click", async (v1452) => {
        (stopPointer(v1452),
          this["_setDownloadMenuOpen"](false),
          await this["_exportAndUse"]("download"));
      }),
      v1448["append"](v1449, v1451),
      v1448
    );
  }
  async ["_exportAndUse"](v1453) {
    if (this["_exporting"]) return;
    const v1454 = this["_mediaClip"]["tracks"]?.["video"] || null,
      v1455 = this["_mediaClip"]["tracks"]?.["audio"] || null,
      v1456 = this["_exportVisualClips"](v1454),
      v1457 = this["_firstExportVideoSource"](v1456),
      v1458 = this["_exportVisualDurationSec"](v1456),
      v1459 = buildMediaClipExportPayload({
        videoSource: v1457,
        audioSource: this["_sources"]["audio"],
        videoTrack: v1454,
        audioTrack: v1455,
        videoClips: v1456,
      });
    if (!v1459) {
      window["showToast"]?.("没有可导出的片段");
      return;
    }
    ((this["_exporting"] = true),
      this["el"]["classList"]["add"]("is-exporting"),
      this["_startExportLoading"]());
    try {
      await this["_waitForExportLoadingFrame"]();
      let v1460 = null;
      if (
        this["_mediaClip"]["lastOutput"]?.["signature"] ===
          v1459["signature"] &&
        this["_mediaClip"]["lastOutput"]?.["localPath"]
      )
        v1460 = { ...this["_mediaClip"]["lastOutput"] };
      else {
        v1460 = await runLocalMediaClipExport(v1459, { timeout: 600000 });
        const v1461 =
            pickResultLocalPath(v1460) ||
            v1460?.["localPath"] ||
            v1460?.["path"] ||
            "",
          v1462 = {
            ...v1460,
            outputType: v1459["outputType"],
            signature: v1459["signature"],
            localPath: v1461,
          };
        (this["_setMediaClip"](
          { ...this["_mediaClip"], lastOutput: v1462 },
          true,
          { render: false },
        ),
          (v1460 = v1462));
      }
      (v1453 === "download"
        ? downloadLocalPath(v1460["localPath"], v1460["filename"])
        : this["_addOutputNode"](v1459["outputType"], v1460, {
            source: v1457,
            durationSec:
              v1458 ||
              Math["max"](
                0,
                toNumber(v1454?.["endSec"], 0) -
                  toNumber(v1454?.["startSec"], 0),
              ),
          }),
        window["showToast"]?.("剪辑已导出"));
    } catch (v1463) {
      window["showToast"]?.(v1463?.["message"] || "剪辑导出失败");
    } finally {
      ((this["_exporting"] = false),
        this["el"]["classList"]["remove"]("is-exporting"),
        this["_stopExportLoading"]());
    }
  }
  ["_resolveOutputNodePosition"](v1464, v1465) {
    return calcSafeSpawnPosNearNode(
      appStore["getState"]()?.["nodes"] || {},
      this["nodeData"] || {},
      v1464,
      v1465,
    );
  }
  ["_addImageOutputNodeFromSource"](v1466 = {}, v1467 = {}) {
    const v1468 = resolveMediaClipImageUrl(v1466),
      v1469 = resolveMediaClipLocalPath(v1466);
    if (!v1468 && !v1469) return;
    const v1470 = resolveMediaClipDimensions(v1466),
      v1471 = getAutoMediaSizeByShortSide(v1470["width"], v1470["height"]),
      v1472 = this["_resolveOutputNodePosition"](
        v1471["width"],
        v1471["height"],
      ),
      v1473 = generateId("source-image"),
      v1474 = buildSourceMediaNodePayload({
        id: v1473,
        type: "source-image",
        x: v1472["x"],
        y: v1472["y"],
        width: v1471["width"],
        height: v1471["height"],
        name: v1467["name"] || "剪辑图片",
        src: v1468,
        imageUrl: v1468,
        sourceUrl: normalizeText(v1466?.["sourceUrl"] || v1468),
        thumbUrl: normalizeText(
          v1466?.["thumbUrl"] || resolveMediaClipThumbUrl(v1466),
        ),
        localPath: v1469,
        originalLocalPath: normalizeText(v1466?.["originalLocalPath"] || v1469),
        displayLocalPath: normalizeText(v1466?.["displayLocalPath"] || v1469),
        naturalWidth: v1470["width"],
        naturalHeight: v1470["height"],
        fileName: v1466?.["fileName"] || "",
        needsAutoResize: false,
      });
    (appStore["addNode"](v1474),
      appStore["setSelectedNodes"]([v1473]),
      commit());
  }
  ["_addOutputNode"](v1475, v1476 = {}, v1477 = {}) {
    const v1478 =
      pickResultLocalPath(v1476) ||
      normalizeText(v1476["localPath"] || v1476["path"]);
    if (!v1478) return;
    const v1479 = localPathToUrl(v1478);
    if (v1475 === "audio") {
      const v1480 = generateId("source-audio"),
        v1481 = this["_resolveOutputNodePosition"](320, 140),
        v1482 = buildSourceAudioNodePayload({
          id: v1480,
          type: "source-audio",
          x: v1481["x"],
          y: v1481["y"],
          width: 320,
          height: 140,
          name: v1477["name"] || "剪辑音频",
          src: v1479,
          audioUrl: v1479,
          localPath: v1478,
          audioDuration: toNumber(
            v1476["audioDuration"],
            v1477["durationSec"] || 0,
          ),
          fileName: v1476["filename"] || "",
        });
      (appStore["addNode"](v1482),
        appStore["setSelectedNodes"]([v1480]),
        commit());
      return;
    }
    const v1483 = v1477["source"] || this["_sources"]["video"],
      v1484 = resolveMediaClipOutputVideoDimensions(v1483, v1476),
      v1485 = getAutoMediaSizeByShortSide(v1484["width"], v1484["height"]),
      v1486 = this["_resolveOutputNodePosition"](
        v1485["width"],
        v1485["height"],
      ),
      v1487 = generateId("source-video"),
      v1488 = resolveMediaClipPosterImageFields(v1483, v1476, v1477),
      v1489 = {
        ...buildSourceMediaNodePayload({
          id: v1487,
          type: "source-video",
          x: v1486["x"],
          y: v1486["y"],
          width: v1485["width"],
          height: v1485["height"],
          name: v1477["name"] || "剪辑视频",
          src: v1479,
          videoUrl: v1479,
          localPath: v1478,
          originalLocalPath: v1478,
          displayLocalPath: v1478,
          thumbUrl: v1488["thumbUrl"],
          posterUrl: v1488["posterUrl"],
          thumbLocalPath: v1488["thumbLocalPath"],
          posterLocalPath: v1488["posterLocalPath"],
          videoThumbSrc: v1488["isOutputPoster"] ? v1479 : "",
          naturalWidth: v1484["width"],
          naturalHeight: v1484["height"],
          videoWidth: v1484["width"],
          videoHeight: v1484["height"],
          videoDuration: toNumber(
            v1476["videoDuration"],
            v1477["durationSec"] ||
              this["_mediaClip"]["tracks"]?.["video"]?.["endSec"] ||
              0,
          ),
          fileName: v1476["filename"] || "",
          needsAutoResize: false,
        }),
        naturalWidth: v1484["width"],
        naturalHeight: v1484["height"],
        videoWidth: v1484["width"],
        videoHeight: v1484["height"],
        needsAutoResize: false,
      };
    (appStore["addNode"](v1489),
      appStore["setSelectedNodes"]([v1487]),
      commit());
  }
}
