import { fetchRemoteBlob } from "../../api/projectsV2Api.js";
let _ctx = null;
const _cache = new Map(),
  _bufferCache = new Map(),
  _bufferInflight = new Map();
function _queueDeferredTask(v0) {
  if (typeof v0 !== "function") return () => {};
  let v1 = false;
  if (typeof queueMicrotask === "function")
    return (
      queueMicrotask(() => {
        if (!v1) v0();
      }),
      () => {
        v1 = true;
      }
    );
  const v2 = setTimeout(() => {
    if (!v1) v0();
  }, 0);
  return () => {
    ((v1 = true), clearTimeout(v2));
  };
}
export function deferWaveformPathUntilAudioReady(v3, v4) {
  if (typeof v4 !== "function") return () => {};
  if (!v3 || typeof v3["addEventListener"] !== "function")
    return _queueDeferredTask(v4);
  let v5 = null,
    v6 = false;
  const v7 = () => {
      (v3["removeEventListener"]("loadeddata", v8),
        v3["removeEventListener"]("error", v9));
    },
    v8 = () => {
      v7();
      if (v6) return;
      v5 = _queueDeferredTask(() => {
        v5 = null;
        if (!v6) v4();
      });
    },
    v9 = () => {
      v7();
    };
  return (
    Number(v3["readyState"] || 0) >= 2
      ? (v5 = _queueDeferredTask(() => {
          v5 = null;
          if (!v6) v4();
        }))
      : (v3["addEventListener"]("loadeddata", v8, { once: true }),
        v3["addEventListener"]("error", v9, { once: true })),
    () => {
      ((v6 = true), v7(), typeof v5 === "function" && (v5(), (v5 = null)));
    }
  );
}
function _getAudioContext() {
  if (_ctx) return _ctx;
  const v10 = window["AudioContext"] || window["webkitAudioContext"];
  if (!v10) return null;
  return ((_ctx = new v10()), _ctx);
}
function _decodeAudioData(v11, v12) {
  return new Promise((v13, v14) => {
    const v15 = v11["decodeAudioData"](v12, v13, v14);
    if (v15 && typeof v15["then"] === "function")
      v15["then"](v13)["catch"](v14);
  });
}
function _buildMinMaxBarsPath(v16, { width: v17, height: v18, samples: v19 }) {
  const v20 = Number(v17) || 200,
    v21 = Number(v18) || 80,
    v22 = Math["max"](40, Math["min"](400, Math["round"](Number(v19) || 180))),
    v23 = v21 / 2,
    v24 = Math["max"](1, Math["round"](v21 * 0.08)),
    v25 = Math["max"](1, v23 - v24),
    v26 = Math["max"](1, Number(v16?.["numberOfChannels"]) || 1),
    v27 = Number(v16?.["length"]) || 0;
  if (!v27) return "";
  const v28 = [];
  for (let v29 = 0; v29 < v26; v29++) {
    try {
      v28["push"](v16["getChannelData"](v29));
    } catch (v30) {}
  }
  if (!v28["length"]) return "";
  const v31 = Math["max"](1, Math["floor"](v27 / v22));
  let v32 = "";
  for (let v33 = 0; v33 < v22; v33++) {
    const v34 = v33 * v31,
      v35 = Math["min"](v27, v34 + v31);
    let v36 = 1,
      v37 = -1;
    for (let v38 = 0; v38 < v28["length"]; v38++) {
      const v39 = v28[v38];
      for (let v40 = v34; v40 < v35; v40++) {
        const v41 = v39[v40] || 0;
        if (v41 < v36) v36 = v41;
        if (v41 > v37) v37 = v41;
      }
    }
    const v42 = Math["min"](1, Math["max"](Math["abs"](v36), Math["abs"](v37))),
      v43 = v23 - v42 * v25,
      v44 = v23 + v42 * v25,
      v45 = ((v33 + 0.5) / v22) * v20;
    v32 +=
      "M" +
      v45["toFixed"](2) +
      "," +
      v43["toFixed"](2) +
      "\x20L" +
      v45["toFixed"](2) +
      "," +
      v44["toFixed"](2) +
      "\x20";
  }
  return v32["trim"]();
}
function _buildBarsPathFromPeaks(
  v46,
  { width: v47, height: v48, samples: v49 },
) {
  const v50 = Array["isArray"](v46) ? v46 : [];
  if (!v50["length"]) return "";
  const v51 = Number(v47) || 200,
    v52 = Number(v48) || 80,
    v53 = Math["max"](
      1,
      Math["min"](v50["length"], Math["round"](Number(v49) || v50["length"])),
    ),
    v54 = v52 / 2,
    v55 = Math["max"](1, Math["round"](v52 * 0.08)),
    v56 = Math["max"](1, v54 - v55);
  let v57 = "";
  for (let v58 = 0; v58 < v53; v58++) {
    const v59 = Math["min"](
        v50["length"] - 1,
        Math["floor"]((v58 / v53) * v50["length"]),
      ),
      v60 = Math["min"](1, Math["max"](0, Number(v50[v59]) || 0)),
      v61 = v54 - v60 * v56,
      v62 = v54 + v60 * v56,
      v63 = ((v58 + 0.5) / v53) * v51;
    v57 +=
      "M" +
      v63["toFixed"](2) +
      "," +
      v61["toFixed"](2) +
      "\x20L" +
      v63["toFixed"](2) +
      "," +
      v62["toFixed"](2) +
      "\x20";
  }
  return v57["trim"]();
}
export async function getWaveformBarsPathFromPersistedUrl(
  v64,
  { width: width = 200, height: height = 80, samples: samples = 180 } = {},
) {
  const v65 = String(v64 || "")["trim"]();
  if (!v65) return "";
  const v66 = "persisted:" + v65 + "|" + width + "|" + height + "|" + samples,
    v67 = _cache["get"](v66);
  if (v67) return v67;
  try {
    const v68 = await fetchRemoteBlob(v65),
      v69 = JSON["parse"](await v68["text"]()),
      v70 = _buildBarsPathFromPeaks(v69?.["peaks"], {
        width: width,
        height: height,
        samples: samples,
      });
    if (v70) _cache["set"](v66, v70);
    return v70;
  } catch {
    return "";
  }
}
async function _getDecodedAudioBufferFromUrl(v71) {
  const v72 = String(v71 || "")["trim"]();
  if (!v72) return null;
  const v73 = _getAudioContext();
  if (!v73) return null;
  let v74 = _bufferCache["get"](v72);
  if (!v74) {
    let v75 = _bufferInflight["get"](v72);
    !v75 &&
      ((v75 = (async () => {
        let v76;
        try {
          const v77 = await fetchRemoteBlob(v72);
          v76 = await v77["arrayBuffer"]();
        } catch (v78) {
          return null;
        }
        if (!v76) return null;
        try {
          const v79 = await _decodeAudioData(v73, v76);
          return v79 || null;
        } catch (v80) {
          return null;
        }
      })()),
      _bufferInflight["set"](v72, v75));
    try {
      v74 = await v75;
    } finally {
      if (_bufferInflight["get"](v72) === v75) _bufferInflight["delete"](v72);
    }
    if (v74) _bufferCache["set"](v72, v74);
  }
  return v74 || null;
}
export async function getAudioDurationFromUrl(v81) {
  const v82 = await _getDecodedAudioBufferFromUrl(v81),
    v83 = Number(v82?.["duration"] || 0);
  return Number["isFinite"](v83) && v83 > 0 ? v83 : 0;
}
export async function getWaveformBarsPathFromUrl(
  v84,
  { width: width = 200, height: height = 80, samples: samples = 180 } = {},
) {
  const v85 = String(v84 || "")["trim"]();
  if (!v85) return "";
  const v86 = v85 + "|" + width + "|" + height + "|" + samples,
    v87 = _cache["get"](v86);
  if (v87) return v87;
  const v88 = await _getDecodedAudioBufferFromUrl(v85);
  if (!v88) return "";
  const v89 = _buildMinMaxBarsPath(v88, {
    width: width,
    height: height,
    samples: samples,
  });
  if (v89) _cache["set"](v86, v89);
  return v89;
}
