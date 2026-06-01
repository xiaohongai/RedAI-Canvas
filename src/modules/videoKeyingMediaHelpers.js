import { attachMediaElementPlaybackSource } from "../services/desktopMediaBlobSource.js";
export function getVideoElementSource(v0) {
  return String(
    v0?.["getAttribute"]?.("src") || v0?.["currentSrc"] || v0?.["src"] || "",
  )["trim"]();
}
export function setVideoKeyingMediaKeepAlive(v1, v2) {
  if (!v1?.["dataset"]) return;
  if (v2) {
    v1["dataset"]["desktopMediaKeepAlive"] = "video-keying";
    return;
  }
  v1["dataset"]["desktopMediaKeepAlive"] === "video-keying" &&
    delete v1["dataset"]["desktopMediaKeepAlive"];
}
export async function attachVideoKeyingPlaybackSource(v3, v4, v5 = "metadata") {
  const v6 = String(v4 || "")["trim"]();
  if (!v3 || !v6) return false;
  return (
    await attachMediaElementPlaybackSource(v3, v6, { preload: v5 }),
    !!getVideoElementSource(v3)
  );
}
function seekTo(v7, v8) {
  return new Promise((v9, v10) => {
    let v11 = false;
    const v12 = () => {
        (v7["removeEventListener"]("seeked", v13),
          v7["removeEventListener"]("error", v14));
      },
      v13 = () => {
        if (v11) return;
        ((v11 = true), v12(), v9());
      },
      v14 = () => {
        if (v11) return;
        ((v11 = true), v12(), v10(new Error("video seek error")));
      };
    (v7["addEventListener"]("seeked", v13),
      v7["addEventListener"]("error", v14),
      (v7["currentTime"] = Math["max"](0, v8)));
  });
}
function waitForLoadedMetadata(v15) {
  return new Promise((v16, v17) => {
    const v18 = () => v16(),
      v19 = () => v17(new Error("video load error"));
    (v15["addEventListener"]("loadedmetadata", v18, { once: true }),
      v15["addEventListener"]("error", v19, { once: true }));
  });
}
export async function renderVideoKeyingThumbs({
  src: v20,
  thumbs: v21,
  token: v22,
  isCurrent: v23,
  readDurationSec: v24,
  onDuration: v25,
}) {
  const v26 = Array["isArray"](v21) ? v21 : [],
    v27 = String(v20 || "")["trim"]();
  if (!v27 || !v26["length"]) return;
  let v28, v29, v30;
  const v31 = () => v23?.(v22) === true;
  try {
    ((v28 = document["createElement"]("video")),
      (v28["muted"] = true),
      (v28["playsInline"] = true),
      (v28["crossOrigin"] = "anonymous"),
      (v28["preload"] = "auto"),
      await attachVideoKeyingPlaybackSource(v28, v27, "auto"),
      await waitForLoadedMetadata(v28));
    if (!v31()) return;
    const v32 = Number(v24?.(v28) || 0);
    if (v32 > 0) v25?.(v32);
    ((v29 = document["createElement"]("canvas")),
      (v29["width"] = 120),
      (v29["height"] = 68),
      (v30 = v29["getContext"]("2d", { willReadFrequently: false })));
    if (!v30) return;
    for (let v33 = 0; v33 < v26["length"]; v33 += 1) {
      if (!v31()) return;
      const v34 = (v32 * (v33 + 0.5)) / v26["length"];
      await seekTo(v28, v34);
      if (!v31()) return;
      v30["drawImage"](v28, 0, 0, v29["width"], v29["height"]);
      const v35 = v29["toDataURL"]("image/jpeg", 0.72),
        v36 = v26[v33];
      if (v36) v36["style"]["backgroundImage"] = 'url("' + v35 + "\x22)";
    }
  } catch {
  } finally {
    v28 && (v28["removeAttribute"]("src"), v28["load"]?.());
    if (v29) v29["width"] = v29["height"] = 0;
  }
}
