const DEBUG_STORAGE_KEY = "aic.videoPlaybackDebug",
  DEBUG_URL_PARAM = "aicVideoDebug",
  DEFAULT_MIN_BUFFER_AHEAD_SECONDS = 0.75,
  DEFAULT_READY_TIMEOUT_MS = 700,
  DEFAULT_RECOVERY_DEBOUNCE_MS = 250,
  DEFAULT_RECOVERY_COOLDOWN_MS = 900,
  videoRecoveryStates = new WeakMap(),
  activePlaybackVideos = new Set();
export function isVideoPlaybackDebugEnabled() {
  try {
    if (globalThis["window"]?.["AIC_VIDEO_DEBUG"] === true) return true;
  } catch {}
  try {
    const v0 = globalThis["localStorage"]?.["getItem"](DEBUG_STORAGE_KEY);
    if (v0 === "1" || v0 === "true") return true;
  } catch {}
  try {
    const v1 = globalThis["window"]?.["location"]?.["search"] || "";
    if (v1) {
      const v2 = new URLSearchParams(v1),
        v3 = v2["get"](DEBUG_URL_PARAM);
      if (v3 === "1" || v3 === "true") return true;
    }
  } catch {}
  return false;
}
export function getVideoCurrentSource(v4) {
  if (!v4) return "";
  return String(
    v4["currentSrc"] || v4["getAttribute"]?.("src") || v4["src"] || "",
  )["trim"]();
}
export function getVideoBufferedRanges(v5) {
  const v6 = [],
    v7 = v5?.["buffered"];
  if (!v7) return v6;
  for (let v8 = 0; v8 < v7["length"]; v8++) {
    try {
      v6["push"]({ start: v7["start"](v8), end: v7["end"](v8) });
    } catch {}
  }
  return v6;
}
export function getVideoBufferedAhead(v9, v10 = null) {
  if (!v9) return 0;
  const v11 = v10 !== null && v10 !== undefined,
    v12 =
      v11 && Number["isFinite"](Number(v10))
        ? Number(v10)
        : Number(v9["currentTime"] || 0);
  let v13 = 0;
  for (const v14 of getVideoBufferedRanges(v9)) {
    if (v14["end"] < v12) continue;
    v14["start"] <= v12 + 0.15 && (v13 = Math["max"](v13, v14["end"] - v12));
  }
  return v13;
}
export function hasVideoBufferedAhead(
  v15,
  v16 = DEFAULT_MIN_BUFFER_AHEAD_SECONDS,
) {
  if (!v15) return false;
  const v17 = Number(v15["duration"]),
    v18 = Number(v15["currentTime"] || 0);
  if (Number["isFinite"](v17) && v17 > 0) {
    const v19 = v17 - v18;
    if (v19 <= Math["max"](0.35, v16)) return true;
  }
  if (Number(v15["readyState"] || 0) >= 4) return true;
  return getVideoBufferedAhead(v15, v18) >= v16;
}
export function getVideoPlaybackSnapshot(v20) {
  return {
    currentTime: Number(v20?.["currentTime"] || 0),
    duration: Number(v20?.["duration"] || 0),
    readyState: Number(v20?.["readyState"] || 0),
    networkState: Number(v20?.["networkState"] || 0),
    paused: !!v20?.["paused"],
    preload: String(v20?.["preload"] || ""),
    src: getVideoCurrentSource(v20),
    buffered: getVideoBufferedRanges(v20),
  };
}
export function logVideoPlaybackEvent(v21, v22, v23 = {}) {
  const v24 = videoRecoveryStates["get"](v21) || {},
    v25 = v23["label"] || v24["label"] || "video";
  if (!isVideoPlaybackDebugEnabled()) return;
  try {
    console["debug"]("[video-playback]", v25, v22, {
      ...getVideoPlaybackSnapshot(v21),
      ...(v23["extra"] || {}),
    });
  } catch {}
}
export function attachVideoPlaybackRecovery(v26, v27 = {}) {
  if (!v26) return null;
  let v28 = videoRecoveryStates["get"](v26);
  return (
    !v28 &&
      ((v28 = {
        label: "video",
        ensureSrc: null,
        shouldRecover: null,
        minBufferAhead: DEFAULT_MIN_BUFFER_AHEAD_SECONDS,
        readyTimeoutMs: DEFAULT_READY_TIMEOUT_MS,
        recoveryDebounceMs: DEFAULT_RECOVERY_DEBOUNCE_MS,
        recoveryCooldownMs: DEFAULT_RECOVERY_COOLDOWN_MS,
        recoveryTimer: null,
        lastRecoveryAt: 0,
      }),
      videoRecoveryStates["set"](v26, v28),
      installMediaEventListeners(v26, v28)),
    updateRecoveryState(v28, v27),
    v28
  );
}
export async function prepareVideoForPlayback(v29, v30 = {}) {
  if (!v29) return false;
  const v31 = attachVideoPlaybackRecovery(v29, v30);
  if (!(await ensureVideoSource(v29, v31))) return false;
  if (v29["preload"] !== "auto") v29["preload"] = "auto";
  return (logVideoPlaybackEvent(v29, "prepare", { label: v31["label"] }), true);
}
export async function playVideoWithRecovery(v32, v33 = {}) {
  if (!v32) return false;
  const v34 = attachVideoPlaybackRecovery(v32, v33),
    v35 = await prepareVideoForPlayback(v32, v33);
  if (!v35) return false;
  if (!shouldContinuePlayback(v33)) return (safePause(v32), false);
  pauseOtherActiveVideos(v32);
  try {
    const v36 = v32["play"]?.();
    v36 && typeof v36["then"] === "function" && (await v36);
  } catch (v37) {
    return (
      !isIgnorablePlayError(v37) &&
        logVideoPlaybackEvent(v32, "play-error", {
          label: v34["label"],
          extra: {
            name: v37?.["name"] || "",
            message: v37?.["message"] || String(v37 || ""),
          },
        }),
      false
    );
  }
  if (!shouldContinuePlayback(v33)) return (safePause(v32), false);
  return (
    activePlaybackVideos["add"](v32),
    logVideoPlaybackEvent(v32, "play-request", { label: v34["label"] }),
    true
  );
}
function updateRecoveryState(v38, v39) {
  if (!v38) return;
  if (v39["label"]) v38["label"] = String(v39["label"]);
  if (typeof v39["ensureSrc"] === "function")
    v38["ensureSrc"] = v39["ensureSrc"];
  if (typeof v39["shouldRecover"] === "function")
    v38["shouldRecover"] = v39["shouldRecover"];
  (Number["isFinite"](Number(v39["minBufferAhead"])) &&
    (v38["minBufferAhead"] = Math["max"](0.5, Number(v39["minBufferAhead"]))),
    Number["isFinite"](Number(v39["readyTimeoutMs"])) &&
      (v38["readyTimeoutMs"] = Math["max"](100, Number(v39["readyTimeoutMs"]))),
    Number["isFinite"](Number(v39["recoveryDebounceMs"])) &&
      (v38["recoveryDebounceMs"] = Math["max"](
        50,
        Number(v39["recoveryDebounceMs"]),
      )),
    Number["isFinite"](Number(v39["recoveryCooldownMs"])) &&
      (v38["recoveryCooldownMs"] = Math["max"](
        100,
        Number(v39["recoveryCooldownMs"]),
      )));
}
function installMediaEventListeners(v40, v41) {
  const v42 = [
    "play",
    "playing",
    "pause",
    "waiting",
    "stalled",
    "progress",
    "canplay",
  ];
  for (const v43 of v42) {
    v40["addEventListener"]?.(v43, () => {
      logVideoPlaybackEvent(v40, v43, { label: v41["label"] });
    });
  }
  for (const v44 of ["waiting", "stalled"]) {
    v40["addEventListener"]?.(v44, () => {
      scheduleStallRecovery(v40, v41, v44);
    });
  }
  (v40["addEventListener"]?.("play", () => activePlaybackVideos["add"](v40)),
    v40["addEventListener"]?.("pause", () =>
      activePlaybackVideos["delete"](v40),
    ),
    v40["addEventListener"]?.("ended", () =>
      activePlaybackVideos["delete"](v40),
    ));
}
async function ensureVideoSource(v45, v46) {
  if (getVideoCurrentSource(v45)) return true;
  if (typeof v46?.["ensureSrc"] !== "function") return false;
  try {
    await v46["ensureSrc"](v45);
  } catch {}
  return !!getVideoCurrentSource(v45);
}
function scheduleStallRecovery(v47, v48, v49) {
  if (v48["recoveryTimer"]) clearTimeout(v48["recoveryTimer"]);
  v48["recoveryTimer"] = setTimeout(
    () => {
      ((v48["recoveryTimer"] = null),
        void recoverStalledPlayback(v47, v48, v49));
    },
    Math["max"](
      50,
      Number(v48["recoveryDebounceMs"] || DEFAULT_RECOVERY_DEBOUNCE_MS),
    ),
  );
}
async function recoverStalledPlayback(v50, v51, v52) {
  if (!v50 || !shouldRecoverPlayback(v50, v51)) return;
  const v53 = Date["now"](),
    v54 = Math["max"](
      100,
      Number(v51["recoveryCooldownMs"] || DEFAULT_RECOVERY_COOLDOWN_MS),
    );
  if (v53 - Number(v51["lastRecoveryAt"] || 0) < v54) return;
  if (hasVideoBufferedAhead(v50, v51["minBufferAhead"])) return;
  if (!(await ensureVideoSource(v50, v51))) return;
  v51["lastRecoveryAt"] = v53;
  const v55 = !!v50["paused"];
  (logVideoPlaybackEvent(v50, v52 + "-recovery", { label: v51["label"] }),
    await reloadVideoPreservingTime(v50, v51, v52));
  if (!v55 && shouldRecoverPlayback(v50, v51))
    try {
      const v56 = v50["play"]?.();
      v56 && typeof v56["catch"] === "function" && v56["catch"](() => {});
    } catch {}
}
function shouldRecoverPlayback(v57, v58) {
  if (v57?.["isConnected"] === false) return false;
  if (typeof v58?.["shouldRecover"] === "function")
    try {
      return !!v58["shouldRecover"](v57);
    } catch {
      return false;
    }
  return !v57?.["paused"];
}
async function reloadVideoPreservingTime(v59, v60, v61) {
  const v62 = getVideoCurrentSource(v59);
  if (!v62) return;
  const v63 = Number(v59["currentTime"] || 0),
    v64 = () => {
      if (!(v63 > 0)) return;
      const v65 = Number(v59["duration"]),
        v66 =
          Number["isFinite"](v65) && v65 > 0
            ? Math["min"](v63, Math["max"](0, v65 - 0.05))
            : v63;
      try {
        v59["currentTime"] = v66;
      } catch {}
    };
  logVideoPlaybackEvent(v59, v61 + "-load", { label: v60["label"] });
  try {
    if (!v59["getAttribute"]?.("src") && v62) v59["src"] = v62;
    v59["load"]?.();
  } catch {}
  if (Number(v59["readyState"] || 0) >= 1) v64();
  (await waitForVideoReadiness(v59, v60["readyTimeoutMs"]), v64());
}
function waitForVideoReadiness(v67, v68) {
  if (!v67 || Number(v67["readyState"] || 0) >= 2)
    return Promise["resolve"](true);
  return new Promise((v69) => {
    let v70 = false;
    const v71 = [
        "loadeddata",
        "canplay",
        "canplaythrough",
        "progress",
        "error",
      ],
      v72 = () => {
        if (v70) return;
        ((v70 = true), clearTimeout(v73));
        for (const v74 of v71) {
          v67["removeEventListener"]?.(v74, v75);
        }
      },
      v75 = () => {
        (v72(), v69(Number(v67["readyState"] || 0) >= 2));
      },
      v73 = setTimeout(
        () => {
          (v72(), v69(Number(v67["readyState"] || 0) >= 2));
        },
        Math["max"](100, Number(v68 || DEFAULT_READY_TIMEOUT_MS)),
      );
    for (const v76 of v71) {
      v67["addEventListener"]?.(v76, v75);
    }
  });
}
function shouldContinuePlayback(v77) {
  if (typeof v77["shouldContinue"] !== "function") return true;
  try {
    return !!v77["shouldContinue"]();
  } catch {
    return false;
  }
}
function safePause(v78) {
  try {
    v78?.["pause"]?.();
  } catch {}
}
function pauseOtherActiveVideos(v79) {
  for (const v80 of Array["from"](activePlaybackVideos)) {
    if (!v80 || v80 === v79) continue;
    if (v80["isConnected"] === false) {
      activePlaybackVideos["delete"](v80);
      continue;
    }
    (safePause(v80), activePlaybackVideos["delete"](v80));
  }
}
export function __resetVideoPlaybackRecoveryForTest() {
  activePlaybackVideos["clear"]();
}
function isIgnorablePlayError(v81) {
  const v82 = v81 && typeof v81 === "object" ? v81["name"] : "",
    v83 =
      v81 && typeof v81 === "object"
        ? String(v81["message"] || "")
        : String(v81 || "");
  return (
    v82 === "AbortError" || v83["includes"]("interrupted by a call to pause")
  );
}
