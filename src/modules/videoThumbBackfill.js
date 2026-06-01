import appStore from "../core/stores/appStore.js";
import { fetchVideoFirstFrameThumbFromServer } from "../../api/videoThumbApi.js";
import { localPathToUrl, urlToLocalPath } from "../utils/localMediaPath.js";
let _token = 0,
  _scheduled = false,
  _rerunRequested = false;
const _VISIBLE_BACKFILL_GROUP_CONCURRENCY = 1,
  _BACKGROUND_BACKFILL_GROUP_CONCURRENCY = 1,
  _BACKGROUND_BACKFILL_DELAY_MS = 2500,
  _BACKGROUND_BATCH_SIZE = 4,
  _BACKGROUND_BATCH_GAP_MS = 450,
  _PLAYBACK_IDLE_POLL_MS = 750,
  _PLAYBACK_IDLE_MAX_WAIT_MS = 12000;
function _resolveLocalVideoPathFromUrl(v0) {
  return localPathToUrl(urlToLocalPath(v0));
}
function _resolveVideoSrcPath(v1, v2) {
  const v3 = localPathToUrl(v2?.["localPath"] || v1?.["localPath"]);
  if (v3) return v3;
  const v4 = String(v2?.["videoUrl"] || v1?.["videoUrl"] || v1?.["src"] || "")[
    "trim"
  ]();
  return _resolveLocalVideoPathFromUrl(v4);
}
function _videoSourceKey(v5) {
  if (!v5 || typeof v5 !== "object") return "";
  return (
    String(v5["localPath"] || "")["trim"]() ||
    String(v5["videoUrl"] || "")["trim"]() ||
    String(v5["src"] || "")["trim"]() ||
    String(v5["thumbId"] || "")["trim"]()
  );
}
function _isUnavailableVideoRecord(v6) {
  const v7 = _videoSourceKey(v6);
  if (!v7) return false;
  return (
    v6?.["mediaUnavailable"] === true &&
    String(v6?.["mediaUnavailableSource"] || "")["trim"]() === v7
  );
}
function _isAllowedSrcPath(v8) {
  const v9 = String(v8 || "");
  return v9["startsWith"]("/output/") || v9["startsWith"]("/data/");
}
function _isNodeVisible(v10, v11) {
  const v12 = v10 || {},
    v13 = v11 || { x: 0, y: 0, zoom: 1 },
    v14 = Number(v13["zoom"]) || 1,
    v15 = (Number(v12["x"]) || 0) * v14 + (Number(v13["x"]) || 0),
    v16 = (Number(v12["y"]) || 0) * v14 + (Number(v13["y"]) || 0),
    v17 = (Number(v12["width"]) || 0) * v14,
    v18 = (Number(v12["height"]) || 0) * v14,
    v19 = 200,
    v20 = window["innerWidth"],
    v21 = window["innerHeight"];
  return (
    v15 + v17 > -v19 && v15 < v20 + v19 && v16 + v18 > -v19 && v16 < v21 + v19
  );
}
function _collectJobs(v22, v23) {
  const v24 = v22?.["nodes"] || {},
    v25 = v22?.["viewport"] || { x: 0, y: 0, zoom: 1 },
    v26 = [];
  for (const v27 of Object["values"](v24)) {
    if (!v27 || typeof v27 !== "object") continue;
    if (v23 === "visible" && !_isNodeVisible(v27, v25)) continue;
    const v28 = String(v27["type"] || "");
    if (v28 === "ai-video") {
      const v29 = Array["isArray"](v27["videos"]) ? v27["videos"] : [];
      if (v29["length"] === 0) continue;
      const v30 = Number(v27["mainVideoIndex"]),
        v31 = Number["isFinite"](v30) ? Math["max"](0, Math["trunc"](v30)) : 0,
        v32 = [];
      if (v31 >= 0 && v31 < v29["length"]) v32["push"](v31);
      for (let v33 = 0; v33 < v29["length"]; v33++)
        if (v33 !== v31) v32["push"](v33);
      for (const v34 of v32) {
        const v35 = v29[v34];
        if (!v35 || typeof v35 !== "object") continue;
        if (_isUnavailableVideoRecord(v35)) continue;
        if (String(v35["thumbUrl"] || "")["trim"]()) continue;
        const v36 = _resolveVideoSrcPath(v27, v35);
        if (!v36 || !_isAllowedSrcPath(v36)) continue;
        v26["push"]({
          nodeId: v27["id"],
          idx: v34,
          srcPath: v36,
          kind: "ai-video",
        });
      }
      continue;
    }
    if (v28 === "source-video") {
      if (_isUnavailableVideoRecord(v27)) continue;
      if (String(v27["thumbUrl"] || "")["trim"]()) continue;
      const v37 = _resolveVideoSrcPath(v27, null);
      if (!v37 || !_isAllowedSrcPath(v37)) continue;
      v26["push"]({
        nodeId: v27["id"],
        idx: -1,
        srcPath: v37,
        kind: "source-video",
      });
    }
  }
  return v26;
}
function _groupJobsBySrcPath(v38) {
  const v39 = [],
    v40 = new Map();
  for (const v41 of v38 || []) {
    const v42 = String(v41?.["srcPath"] || "")["trim"]();
    if (!v42) continue;
    let v43 = v40["get"](v42);
    (!v43 &&
      ((v43 = { srcPath: v42, jobs: [] }),
      v40["set"](v42, v43),
      v39["push"](v43)),
      v43["jobs"]["push"](v41));
  }
  return v39;
}
async function _runWithConcurrency(v44, v45, v46) {
  const v47 = Array["isArray"](v44) ? v44 : [],
    v48 = Math["max"](1, Math["trunc"](Number(v45) || 1));
  if (v47["length"] === 0) return;
  let v49 = 0;
  const v50 = Math["min"](v48, v47["length"]),
    v51 = Array["from"]({ length: v50 }, async () => {
      while (true) {
        const v52 = v49++;
        if (v52 >= v47["length"]) return;
        await v46(v47[v52], v52);
      }
    });
  await Promise["all"](v51);
}
function _delay(v53) {
  return new Promise((v54) =>
    setTimeout(v54, Math["max"](0, Number(v53) || 0)),
  );
}
function _hasActiveMediaPlayback() {
  const v55 = typeof document !== "undefined" ? document : null;
  if (!v55 || typeof v55["querySelectorAll"] !== "function") return false;
  const v56 = v55["querySelectorAll"]("video,\x20audio") || [];
  for (const v57 of v56) {
    if (!v57) continue;
    if (v57["paused"] === false && v57["ended"] !== true) return true;
  }
  return false;
}
async function _waitForPlaybackIdle(v58) {
  let v59 = 0;
  while (v58 === _token && _hasActiveMediaPlayback()) {
    if (v59 >= _PLAYBACK_IDLE_MAX_WAIT_MS) return false;
    (await _delay(_PLAYBACK_IDLE_POLL_MS), (v59 += _PLAYBACK_IDLE_POLL_MS));
  }
  return v58 === _token;
}
async function _fetchThumbUrl(v60, v61, v62 = {}) {
  if (v61 !== _token) return "";
  const v63 = String(v60 || "")["trim"]();
  if (!v63) return "";
  let v64 = null;
  try {
    v64 = await fetchVideoFirstFrameThumbFromServer(v63, v62);
  } catch {
    v64 = null;
  }
  if (v61 !== _token) return "";
  return String(v64?.["url"] || "")["trim"]();
}
async function _applyJob(v65, v66, v67, v68) {
  if (v68 !== _token) return false;
  const v69 = String(v65?.["nodeId"] || "");
  if (!v69) return false;
  const v70 = String(v66 || v65?.["srcPath"] || "")["trim"](),
    v71 = String(v67 || "")["trim"]();
  if (!v70 || !v71) return false;
  const v72 = appStore["getStateRaw"](),
    v73 = v72["nodes"]?.[v69];
  if (!v73) return false;
  if (v65["kind"] === "source-video") {
    if (String(v73["thumbUrl"] || "")["trim"]()) return false;
    return (
      appStore["updateNodeData"](v69, { videoThumbSrc: v70, thumbUrl: v71 }),
      true
    );
  }
  if (v65["kind"] === "ai-video") {
    const v74 = Array["isArray"](v73["videos"]) ? v73["videos"] : [],
      v75 = Number(v65["idx"]);
    if (!(v75 >= 0 && v75 < v74["length"])) return false;
    const v76 = v74[v75];
    if (!v76 || typeof v76 !== "object") return false;
    if (String(v76["thumbUrl"] || "")["trim"]()) return false;
    const v77 = { ...v76, thumbUrl: v71 },
      v78 = v74["slice"]();
    v78[v75] = v77;
    const v79 = { videos: v78 },
      v80 = Number(v73["mainVideoIndex"]),
      v81 = Number["isFinite"](v80) ? Math["max"](0, Math["trunc"](v80)) : 0;
    if (v75 === v81 && !String(v73["thumbUrl"] || "")["trim"]())
      v79["thumbUrl"] = v71;
    return (appStore["updateNodeData"](v69, v79), true);
  }
  return false;
}
async function _runPass(v82, v83) {
  if (v83 !== _token) return;
  const v84 = appStore["getStateRaw"](),
    v85 = _collectJobs(v84, v82),
    v86 = _groupJobsBySrcPath(v85),
    v87 =
      v82 === "visible"
        ? _VISIBLE_BACKFILL_GROUP_CONCURRENCY
        : _BACKGROUND_BACKFILL_GROUP_CONCURRENCY,
    v88 = v82 === "visible" ? v86["length"] || 1 : _BACKGROUND_BATCH_SIZE;
  for (let v89 = 0; v89 < v86["length"]; v89 += v88) {
    if (v83 !== _token) return;
    if (v82 !== "visible" && !(await _waitForPlaybackIdle(v83))) return;
    const v90 = v86["slice"](v89, v89 + v88);
    (await _runWithConcurrency(v90, v87, async (v91) => {
      if (v83 !== _token) return;
      const v92 = Array["isArray"](v91["jobs"]) ? v91["jobs"][0] : null,
        v93 = await _fetchThumbUrl(v91["srcPath"], v83, {
          nodeId: String(v92?.["nodeId"] || ""),
          assetId: String(v92?.["idx"] ?? ""),
        });
      if (v83 !== _token || !v93) return;
      for (const v94 of v91["jobs"]) {
        if (v83 !== _token) return;
        await _applyJob(v94, v91["srcPath"], v93, v83);
      }
      await _delay(0);
    }),
      v82 !== "visible" &&
        v89 + v88 < v86["length"] &&
        (await _delay(_BACKGROUND_BATCH_GAP_MS)));
  }
}
export function startVideoThumbBackfill() {
  _token++;
  const v95 = _token;
  if (_scheduled) {
    _rerunRequested = true;
    return;
  }
  ((_scheduled = true),
    setTimeout(async () => {
      try {
        await _runPass("visible", v95);
        if (v95 !== _token) return;
        await _delay(_BACKGROUND_BACKFILL_DELAY_MS);
        if (v95 !== _token) return;
        await _runPass("all", v95);
      } finally {
        ((_scheduled = false),
          _rerunRequested &&
            ((_rerunRequested = false), startVideoThumbBackfill()));
      }
    }, 60));
}
export function __groupBackfillJobsBySrcPathForTest(v96) {
  return _groupJobsBySrcPath(v96);
}
export async function __runWithConcurrencyForTest(v97, v98, v99) {
  return _runWithConcurrency(v97, v98, v99);
}
export function __hasActiveMediaPlaybackForTest() {
  return _hasActiveMediaPlayback();
}
