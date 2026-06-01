export function formatAudioTime(v0) {
  const v1 = Number(v0);
  if (!Number["isFinite"](v1) || v1 <= 0) return "0:00";
  return (
    Math["floor"](v1 / 60) +
    ":" +
    String(Math["floor"](v1 % 60))["padStart"](2, "0")
  );
}
function clamp01(v2) {
  const v3 = Number(v2);
  if (!Number["isFinite"](v3)) return 0;
  return Math["max"](0, Math["min"](1, v3));
}
function getRafFns(v4 = {}) {
  const v5 =
      v4["requestFrame"] ||
      (typeof requestAnimationFrame === "function"
        ? requestAnimationFrame
        : typeof window !== "undefined" &&
            typeof window["requestAnimationFrame"] === "function"
          ? window["requestAnimationFrame"]["bind"](window)
          : null),
    v6 =
      v4["cancelFrame"] ||
      (typeof cancelAnimationFrame === "function"
        ? cancelAnimationFrame
        : typeof window !== "undefined" &&
            typeof window["cancelAnimationFrame"] === "function"
          ? window["cancelAnimationFrame"]["bind"](window)
          : null);
  return {
    requestFrame: v5 || ((v7) => setTimeout(v7, 16)),
    cancelFrame: v6 || ((v8) => clearTimeout(v8)),
  };
}
export function createAudioPlaybackProgressController(v9 = {}) {
  const {
      audioEl: v10,
      wavePlayedEl: v11,
      progressLineEl: v12,
      timeEl: v13,
      trackEl: v14,
      formatTime: formatTime = formatAudioTime,
      shouldSuppressSync: shouldSuppressSync = () => false,
    } = v9,
    { requestFrame: v15, cancelFrame: v16 } = getRafFns(v9);
  let v17 = null,
    v18 = false,
    v19 = false,
    v20 = 0,
    v21 = null,
    v22 = "",
    v23 = "",
    v24 = "",
    v25 = "";
  const v26 = () => {
      const v27 =
        Number(v14?.["clientWidth"]) ||
        Number(v14?.["getBoundingClientRect"]?.()["width"]) ||
        Number(v12?.["parentElement"]?.["clientWidth"]) ||
        0;
      if (Number["isFinite"](v27) && v27 > 0) v20 = v27;
      return v20;
    },
    v28 = () => {
      return !!v10 && v10["paused"] === false && v10["ended"] !== true;
    },
    v29 = (v30) => {
      if (!v12 || v25 === v30) return;
      ((v12["style"]["opacity"] = v30), (v25 = v30));
    },
    v31 = () => {
      v29("0");
    },
    v32 = ({
      currentTime: currentTime = v10?.["currentTime"],
      duration: duration = v10?.["duration"],
      force: force = false,
      showLine: showLine = true,
    } = {}) => {
      const v33 = Number(duration);
      if (!Number["isFinite"](v33) || v33 <= 0) return false;
      const v34 = Number(currentTime),
        v35 = clamp01(v34 / v33),
        v36 = (v35 * 100)["toFixed"](2);
      v11 &&
        (force || v22 !== v36) &&
        (v11["style"]["clipPath"] = "inset(0 0 0 " + v36 + "%)");
      if (v12 && (force || v22 !== v36)) {
        const v37 = v26();
        if (v37 > 0) {
          const v38 = (v35 * v37)["toFixed"](2) + "px";
          (force || v24 !== v38) &&
            ((v12["style"]["left"] = "0"),
            (v12["style"]["transform"] = "translateX(" + v38 + ")"),
            (v24 = v38));
        } else {
          const v39 = v36 + "%";
          (force || v24 !== v39) &&
            ((v12["style"]["left"] = v39),
            (v12["style"]["transform"] = ""),
            (v24 = v39));
        }
      }
      if (showLine) v29("1");
      const v40 = formatTime(v34) + "\x20/\x20" + formatTime(v33);
      return (
        v13 &&
          (force || v23 !== v40) &&
          ((v13["textContent"] = v40), (v23 = v40)),
        (v22 = v36),
        true
      );
    },
    v41 = () => {
      if (v18 || v17 !== null) return;
      v17 = v15(v42);
    },
    v43 = () => {
      if (v17 === null) return;
      (v16(v17), (v17 = null));
    },
    v42 = () => {
      v17 = null;
      if (v18 || !v28()) return;
      (!shouldSuppressSync() && v32({ showLine: true }), v41());
    },
    v44 = () => {
      v41();
    },
    v45 = () => {
      v43();
      if (v18 || shouldSuppressSync()) return;
      if (v10?.["ended"] === true) {
        (v32({ force: true, showLine: false }), v31());
        return;
      }
      v32({ showLine: true });
    },
    v46 = () => {
      if (v18 || v28() || shouldSuppressSync()) return;
      v32({ showLine: true });
    },
    v47 = () => {
      if (v18) return;
      const v48 = Number(v10?.["currentTime"] || 0);
      v32({
        currentTime: v48,
        duration: v10?.["duration"],
        force: true,
        showLine: v48 > 0,
      });
      if (v48 <= 0) v31();
    },
    v49 = () => {
      (v43(), v32({ force: true, showLine: false }), v31());
    },
    v50 = () => {
      if (v19 || !v10?.["addEventListener"]) return v51;
      ((v19 = true), (v18 = false), v26());
      typeof ResizeObserver === "function" &&
        v14 &&
        typeof v14 === "object" &&
        ((v21 = new ResizeObserver(() => {
          (v26(), v32({ force: true, showLine: v25 === "1" }));
        })),
        v21["observe"](v14));
      (v10["addEventListener"]("play", v44),
        v10["addEventListener"]("pause", v45),
        v10["addEventListener"]("timeupdate", v46),
        v10["addEventListener"]("loadedmetadata", v47),
        v10["addEventListener"]("ended", v49));
      if (v28()) v41();
      return v51;
    },
    v52 = ({ hide: hide = true } = {}) => {
      ((v22 = ""), (v23 = ""), (v24 = ""));
      if (v11) v11["style"]["clipPath"] = "inset(0 0 0 0)";
      v12 &&
        ((v12["style"]["left"] = "0"),
        (v12["style"]["transform"] = "translateX(0px)"));
      if (hide) v31();
      v13 &&
        ((v13["textContent"] = "0:00 / 0:00"), (v23 = "0:00\x20/\x200:00"));
    },
    v53 = () => {
      ((v18 = true),
        v43(),
        v19 &&
          v10?.["removeEventListener"] &&
          (v10["removeEventListener"]("play", v44),
          v10["removeEventListener"]("pause", v45),
          v10["removeEventListener"]("timeupdate", v46),
          v10["removeEventListener"]("loadedmetadata", v47),
          v10["removeEventListener"]("ended", v49)),
        (v19 = false),
        v21 && (v21["disconnect"](), (v21 = null)));
    },
    v51 = {
      attach: v50,
      destroy: v53,
      reset: v52,
      hideLine: v31,
      start: v41,
      stop: v43,
      sync: v32,
      isRunning: () => v17 !== null,
    };
  return v51;
}
