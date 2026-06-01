export const MEDIA_CLIP_TIMELINE_TICK_COUNT = 6;
export const MEDIA_CLIP_TIMELINE_TICK_MIN_SPACING_PX = 130;
export const MEDIA_CLIP_TIMELINE_FRAME_MIN_WIDTH_PX = 54;
export const MEDIA_CLIP_TIMELINE_SCROLL_PX_PER_SEC = 108;
export const MEDIA_CLIP_TIMELINE_ADD_SLOT_WIDTH_PX = 46;
export const MEDIA_CLIP_TIMELINE_ADD_SLOT_GAP_PX = 4;
export const MEDIA_CLIP_TIMELINE_ZOOM_WHEEL_FACTOR = 1.12;
export const MEDIA_CLIP_TIMELINE_MIN_DISPLAY_SEC = 5;
export const MEDIA_CLIP_TIMELINE_MIN_WIDTH_PX = 240;
export const MEDIA_CLIP_TIMELINE_MIN_SEGMENT_WIDTH_PCT = 2;
export const MEDIA_CLIP_TIMELINE_FRAME_COUNT_MIN = 8;
export const MEDIA_CLIP_TIMELINE_FRAME_COUNT_MAX = 22;
export const MEDIA_CLIP_TIMELINE_TICK_STEPS_SEC = Object["freeze"]([
  15, 10, 5, 2, 1,
]);
const MEDIA_CLIP_TIMELINE_TICK_STEPS_ASC = Object["freeze"]([1, 2, 5, 10, 15]),
  MEDIA_CLIP_TIMELINE_MIN_RULER_INTERVALS = 4;
function toNumber(v0, v1 = 0) {
  const v2 = Number(v0);
  return Number["isFinite"](v2) ? v2 : v1;
}
function clamp(v3, v4, v5) {
  return Math["max"](v4, Math["min"](v5, v3));
}
function roundMs(v6) {
  return Math["round"](toNumber(v6, 0) * 1000) / 1000;
}
export function getMediaClipTimelineDisplayDuration(v7 = 0) {
  return Math["max"](MEDIA_CLIP_TIMELINE_MIN_DISPLAY_SEC, toNumber(v7, 0));
}
export function getMediaClipTimelineRatio(v8 = 0, v9 = 0) {
  const v10 = getMediaClipTimelineDisplayDuration(v9);
  return clamp(toNumber(v8, 0) / v10, 0, 1);
}
export function getMediaClipTimelinePercent(v11 = 0, v12 = 0) {
  return getMediaClipTimelineRatio(v11, v12) * 100;
}
export function getMediaClipTimelinePx(v13 = 0, v14 = {}) {
  const v15 = Math["max"](1, toNumber(v14["trackWidthPx"], 1));
  return getMediaClipTimelineRatio(v13, v14["durationSec"]) * v15;
}
export function getMediaClipTimelineSecFromPx(v16 = 0, v17 = {}) {
  const v18 = Math["max"](1, toNumber(v17["trackWidthPx"], 1)),
    v19 = getMediaClipTimelineDisplayDuration(v17["durationSec"]);
  return roundMs(clamp(toNumber(v16, 0) / v18, 0, 1) * v19);
}
export function getMediaClipTimelineSecFromClientX(v20 = 0, v21 = {}) {
  const v22 = toNumber(v21["trackLeftPx"], 0);
  return getMediaClipTimelineSecFromPx(toNumber(v20, v22) - v22, v21);
}
export function getMediaClipTimelineDeltaSecFromPx(v23 = 0, v24 = {}) {
  const v25 = Math["max"](1, toNumber(v24["trackWidthPx"], 1)),
    v26 = getMediaClipTimelineDisplayDuration(v24["durationSec"]);
  return (toNumber(v23, 0) / v25) * v26;
}
export function getMediaClipTimelineRangeRect(v27 = {}) {
  const v28 = getMediaClipTimelineDisplayDuration(v27["durationSec"]),
    v29 = clamp(toNumber(v27["startSec"], 0), 0, v28),
    v30 = clamp(toNumber(v27["endSec"], v29), v29, v28),
    v31 = getMediaClipTimelinePercent(v29, v28),
    v32 = Math["max"](v31, getMediaClipTimelinePercent(v30, v28)),
    v33 = Math["max"](
      toNumber(v27["minWidthPct"], MEDIA_CLIP_TIMELINE_MIN_SEGMENT_WIDTH_PCT),
      v32 - v31,
    ),
    v34 = Math["max"](0, toNumber(v27["trackWidthPx"], 0));
  return {
    startSec: v29,
    endSec: v30,
    leftPct: v31,
    rightPct: v32,
    widthPct: Math["min"](100 - v31, v33),
    leftPx: v34 > 0 ? (v31 / 100) * v34 : 0,
    widthPx: v34 > 0 ? ((v32 - v31) / 100) * v34 : 0,
  };
}
export function getMediaClipTimelinePlayheadModel(v35 = {}) {
  const v36 = clamp(
    toNumber(v35["playheadSec"], 0),
    0,
    getMediaClipTimelineDisplayDuration(v35["durationSec"]),
  );
  return {
    sec: v36,
    leftPct: getMediaClipTimelinePercent(v36, v35["durationSec"]),
    leftPx: getMediaClipTimelinePx(v36, v35),
  };
}
export function getMediaClipTimelineTrackWidthPx(v37 = {}) {
  const v38 = Math["max"](
      MEDIA_CLIP_TIMELINE_MIN_WIDTH_PX,
      Math["ceil"](toNumber(v37["viewportWidthPx"], 0)),
    ),
    v39 = getMediaClipTimelineDisplayDuration(v37["durationSec"]),
    v40 = Math["max"](
      1,
      toNumber(v37["pxPerSec"], MEDIA_CLIP_TIMELINE_SCROLL_PX_PER_SEC),
    ),
    v41 = Math["max"](0.001, toNumber(v37["zoom"], 1)),
    v42 = Math["max"](v38, v39 * v40);
  return Math["ceil"](Math["max"](v38, v42 * v41));
}
export function getMediaClipFrameCount(v43 = 0) {
  const v44 = Math["max"](MEDIA_CLIP_TIMELINE_MIN_WIDTH_PX, toNumber(v43, 0));
  return Math["max"](
    MEDIA_CLIP_TIMELINE_FRAME_COUNT_MIN,
    Math["min"](
      MEDIA_CLIP_TIMELINE_FRAME_COUNT_MAX,
      Math["ceil"](v44 / MEDIA_CLIP_TIMELINE_FRAME_MIN_WIDTH_PX),
    ),
  );
}
export function shouldLockMediaClipTimelineWheelScroll(v45 = {}) {
  const v46 = Math["max"](0, toNumber(v45["trackWidthPx"], 0)),
    v47 = Math["max"](1, toNumber(v45["viewportWidthPx"], 1)),
    v48 = Math["max"](0, toNumber(v45["maxScrollPx"], 0)),
    v49 =
      MEDIA_CLIP_TIMELINE_ADD_SLOT_GAP_PX +
      MEDIA_CLIP_TIMELINE_ADD_SLOT_WIDTH_PX;
  return v48 > 0 && v46 <= v47 + 1 && v48 <= v49 + 4;
}
export function getMediaClipTimelineAddSlotLeftPx(v50 = {}) {
  const v51 = Math["max"](0, toNumber(v50["trackWidthPx"], 0)),
    v52 = getMediaClipTimelineDisplayDuration(v50["displayDurationSec"]),
    v53 = clamp(toNumber(v50["materialEndSec"], 0), 0, v52);
  if (v52 <= 0 || v51 <= 0) return MEDIA_CLIP_TIMELINE_ADD_SLOT_GAP_PX;
  return Math["round"]((v53 / v52) * v51 + MEDIA_CLIP_TIMELINE_ADD_SLOT_GAP_PX);
}
export function getMediaClipTimelineContentWidthPx(v54 = {}) {
  const v55 = Math["max"](
    MEDIA_CLIP_TIMELINE_MIN_WIDTH_PX,
    Math["ceil"](toNumber(v54["trackWidthPx"], 0)),
  );
  return Math["max"](
    v55,
    getMediaClipTimelineAddSlotLeftPx(v54) +
      MEDIA_CLIP_TIMELINE_ADD_SLOT_WIDTH_PX,
  );
}
export function getMediaClipTimelineNextZoom(v56 = {}) {
  const v57 = Math["max"](0.001, toNumber(v56["currentZoom"], 1)),
    v58 = Math["max"](0.001, toNumber(v56["minZoom"], 0.5)),
    v59 = Math["max"](v58, toNumber(v56["maxZoom"], 6)),
    v60 = Math["max"](
      1.001,
      toNumber(v56["factor"], MEDIA_CLIP_TIMELINE_ZOOM_WHEEL_FACTOR),
    ),
    v61 = toNumber(v56["delta"], 0);
  if (!v61) return clamp(v57, v58, v59);
  return clamp(v57 * (v61 > 0 ? 1 / v60 : v60), v58, v59);
}
export function getMediaClipTimelineZoomScrollLeft(v62 = {}) {
  const v63 = Math["max"](1, toNumber(v62["viewportWidthPx"], 1)),
    v64 = clamp(toNumber(v62["anchorX"], v63 / 2), 0, v63),
    v65 = Math["max"](1, toNumber(v62["nextContentWidthPx"], 1)),
    v66 = Math["max"](0, v65 - v63),
    v67 = toNumber(v62["anchorSec"], NaN),
    v68 = Math["max"](1, toNumber(v62["trackWidthPx"], 1));
  if (Number["isFinite"](v67)) {
    const v69 = getMediaClipTimelineDisplayDuration(v62["durationSec"]),
      v70 = clamp(v67 / v69, 0, 1);
    return Math["max"](0, Math["min"](v66, Math["round"](v70 * v68 - v64)));
  }
  const v71 = clamp(toNumber(v62["anchorRatio"], 0), 0, 1);
  return Math["max"](0, Math["min"](v66, Math["round"](v71 * v65 - v64)));
}
function chooseTimelineTickStep(v72, v73 = 0) {
  const v74 = getMediaClipTimelineDisplayDuration(v72),
    v75 = Math["max"](MEDIA_CLIP_TIMELINE_MIN_WIDTH_PX, toNumber(v73, 0)),
    v76 = v75 / Math["max"](1, v74),
    v77 = MEDIA_CLIP_TIMELINE_TICK_MIN_SPACING_PX / Math["max"](0.001, v76),
    v78 =
      MEDIA_CLIP_TIMELINE_TICK_STEPS_ASC["find"]((v79) => v79 >= v77) ||
      MEDIA_CLIP_TIMELINE_TICK_STEPS_SEC[0],
    v80 = Math["max"](0, MEDIA_CLIP_TIMELINE_TICK_STEPS_SEC["indexOf"](v78));
  for (
    let v81 = v80;
    v81 < MEDIA_CLIP_TIMELINE_TICK_STEPS_SEC["length"];
    v81 += 1
  ) {
    const v82 = MEDIA_CLIP_TIMELINE_TICK_STEPS_SEC[v81];
    if (v82 === 1 || v74 / v82 >= MEDIA_CLIP_TIMELINE_MIN_RULER_INTERVALS)
      return v82;
  }
  return 1;
}
export function buildMediaClipTimelineTicks(v83, v84 = 0) {
  const v85 = getMediaClipTimelineDisplayDuration(v83),
    v86 = chooseTimelineTickStep(v85, v84),
    v87 = [];
  for (let v88 = 0; v88 < v85; v88 += v86) {
    v87["push"](roundMs(v88));
  }
  const v89 = v87[v87["length"] - 1];
  return (
    (v89 == null || Math["abs"](v89 - v85) > 0.001) &&
      v87["push"](roundMs(v85)),
    v87
  );
}
