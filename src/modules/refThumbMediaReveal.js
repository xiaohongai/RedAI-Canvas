let _decodePromiseMap = new Map(),
  _revealTokenMap = new WeakMap();
const REVEAL_RETRY_DELAYS_MS = [120, 320, 720],
  ATTACH_RETRY_DELAYS_MS = [0, 16, 50, 120];
function nextRevealToken(v0) {
  const v1 = (_revealTokenMap["get"](v0) || 0) + 1;
  return (_revealTokenMap["set"](v0, v1), v1);
}
function isRevealCurrent(v2, v3, v4, v5, v6 = false) {
  if (!v2) return false;
  if (!v6 && v2["isConnected"] === false) return false;
  if (v4 && v3?.["dataset"]?.["sig"] !== v4) return false;
  return _revealTokenMap["get"](v2) === v5;
}
function afterFrame(v7) {
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(v7);
    return;
  }
  setTimeout(v7, 0);
}
function setThumbErrorState(v8, v9, v10) {
  if (v8?.["dataset"]) {
    if (v10) v8["dataset"]["thumbError"] = "1";
    else delete v8["dataset"]["thumbError"];
  }
  if (v9?.["dataset"]) {
    if (v10) v9["dataset"]["thumbError"] = "1";
    else delete v9["dataset"]["thumbError"];
  }
}
function refreshImageElement(v11, v12) {
  if (!v11 || !v12) return;
  try {
    const v13 = String(v11["getAttribute"]?.("src") || v11["src"] || "")[
      "trim"
    ]();
    (v13 === v12 && (v11["src"] = ""), (v11["src"] = v12));
  } catch {}
}
export function ensureThumbDecoded(v14) {
  const v15 = String(v14 || "")["trim"]();
  if (!v15) return Promise["resolve"](false);
  const v16 = _decodePromiseMap["get"](v15);
  if (v16) return v16;
  if (typeof Image !== "function") return Promise["resolve"](false);
  let v17 = null;
  const v18 = new Promise((v19) => {
    let v20 = false;
    const v21 = (v22) => {
      if (v20) return;
      ((v20 = true), v19(!!v22));
    };
    try {
      const v23 = new Image();
      ((v23["decoding"] = "async"),
        (v23["loading"] = "eager"),
        (v23["onload"] = () => v21(true)),
        (v23["onerror"] = () => v21(false)),
        (v23["src"] = v15),
        typeof v23["decode"] === "function" &&
          v23["decode"]()
            ["then"](() => v21(true))
            ["catch"](() => v21(false)));
    } catch {
      v21(false);
    }
  });
  return (
    (v17 = v18["then"](
      (v24) => {
        return (
          !v24 &&
            _decodePromiseMap["get"](v15) === v17 &&
            _decodePromiseMap["delete"](v15),
          v24
        );
      },
      () => {
        return (
          _decodePromiseMap["get"](v15) === v17 &&
            _decodePromiseMap["delete"](v15),
          false
        );
      },
    )),
    _decodePromiseMap["set"](v15, v17),
    v17
  );
}
function revealSingleRefThumb(
  v25,
  v26,
  v27,
  v28,
  v29 = 0,
  v30 = 0,
  v31 = v25?.["isConnected"] !== false,
) {
  if (!isRevealCurrent(v25, v26, v27, v28, true)) return;
  if (v25["isConnected"] === false) {
    if (v31) return;
    const v32 = ATTACH_RETRY_DELAYS_MS[v30];
    if (v32 == null) return;
    setTimeout(() => {
      revealSingleRefThumb(v25, v26, v27, v28, v29, v30 + 1, false);
    }, v32);
    return;
  }
  v25["decoding"] = "async";
  const v33 = true,
    v34 = () => {
      if (!isRevealCurrent(v25, v26, v27, v28)) return;
      (setThumbErrorState(v25, v26, false),
        v25["classList"]["remove"]("is-pending"),
        v25["classList"]["add"]("is-ready"));
    },
    v35 = () => {
      if (!isRevealCurrent(v25, v26, v27, v28)) return;
      setThumbErrorState(v25, v26, true);
    };
  if (v25["complete"] && v25["naturalWidth"] > 0) {
    afterFrame(v34);
    return;
  }
  const v36 = String(v25["getAttribute"]("src") || "")["trim"]();
  if (!v36) {
    v35();
    return;
  }
  (setThumbErrorState(v25, v26, false),
    ensureThumbDecoded(v36)
      ["then"]((v37) => {
        if (!isRevealCurrent(v25, v26, v27, v28)) return;
        if (v37) {
          (refreshImageElement(v25, v36), afterFrame(v34));
          return;
        }
        const v38 = REVEAL_RETRY_DELAYS_MS[v29];
        if (v38 == null) {
          afterFrame(v35);
          return;
        }
        setTimeout(() => {
          revealSingleRefThumb(v25, v26, v27, v28, v29 + 1, v30, v33);
        }, v38);
      })
      ["catch"](() => {
        if (!isRevealCurrent(v25, v26, v27, v28)) return;
        const v39 = REVEAL_RETRY_DELAYS_MS[v29];
        if (v39 == null) {
          afterFrame(v35);
          return;
        }
        setTimeout(() => {
          revealSingleRefThumb(v25, v26, v27, v28, v29 + 1, v30, v33);
        }, v39);
      }));
}
export function revealRefThumbMedia(v40, v41 = "") {
  if (!v40) return;
  const v42 = String(v41 || ""),
    v43 = Array["from"](
      v40["querySelectorAll"]("img.ref-thumb-media.is-pending"),
    );
  for (const v44 of v43) {
    revealSingleRefThumb(v44, v40, v42, nextRevealToken(v44));
  }
}
export function _resetRefThumbMediaRevealForTests() {
  ((_decodePromiseMap = new Map()), (_revealTokenMap = new WeakMap()));
}
