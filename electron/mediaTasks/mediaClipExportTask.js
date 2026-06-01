import { mkdirSync } from "node:fs";
import path from "node:path";
function toNumber(v0, v1 = 0) {
  const v2 = Number(v0);
  return Number["isFinite"](v2) ? v2 : v1;
}
function normalizeNonNegative(v3, v4 = 0) {
  return Math["max"](0, toNumber(v3, v4));
}
function normalizeRequestedFps(v5) {
  const v6 = Math["round"](Number(v5) || 0);
  return [16, 24, 30]["includes"](v6) ? v6 : 0;
}
function normalizeOutputSize(v7, v8 = 0) {
  const v9 = Math["round"](Number(v7) || 0);
  return v9 > 0 ? v9 : v8;
}
function normalizeFilterFps(v10, v11 = 30) {
  const v12 = Math["round"](Number(v10) || 0);
  return v12 > 0 ? v12 : Math["max"](1, Math["round"](Number(v11) || 30));
}
function readRange(v13 = {}, v14 = {}, v15 = "") {
  const v16 = v15 ? v15 + "Start" : "start",
    v17 = v15 ? v15 + "End" : "end",
    v18 = normalizeNonNegative(
      v14[v16] ?? v13[v16] ?? v14["start"] ?? v13["start"],
      0,
    ),
    v19 = normalizeNonNegative(
      v14[v17] ?? v13[v17] ?? v14["end"] ?? v13["end"],
      0,
    );
  if (!(v19 > v18)) return null;
  return { start: v18, end: v19, duration: v19 - v18 };
}
function normalizeMediaClipExportClips(v20 = []) {
  if (!Array["isArray"](v20)) return [];
  return v20["map"]((v21) => {
    if (!v21 || typeof v21 !== "object") return null;
    const v22 = String(
      v21["src"] ??
        v21["sourceKey"] ??
        v21["localPath"] ??
        v21["path"] ??
        v21["abs"] ??
        "",
    )["trim"]();
    if (!v22) return null;
    const v23 =
      readRange(v21) ||
      readRange({ start: v21["startSec"], end: v21["endSec"] });
    if (!v23) return null;
    return {
      src: v22,
      abs: v21["abs"] ? String(v21["abs"]) : "",
      kind: String(v21["kind"] || "")["trim"]() === "image" ? "image" : "video",
      start: v23["start"],
      end: v23["end"],
      duration: v23["duration"],
    };
  })["filter"](Boolean);
}
function buildMediaClipExportConcatFfmpegArgs({
  clips: clips = [],
  audioAbs: audioAbs = "",
  audioStart: audioStart = 0,
  audioEnd: audioEnd = 0,
  fps: fps = 0,
  outputWidth: outputWidth = 0,
  outputHeight: outputHeight = 0,
  outAbs: v24,
} = {}) {
  const v25 = normalizeMediaClipExportClips(clips);
  if (!v25["length"] || !v24) throw new Error("Invalid video clip range");
  const v26 = normalizeOutputSize(outputWidth),
    v27 = normalizeOutputSize(outputHeight);
  if (!v26 || !v27) throw new Error("Invalid video output size");
  const v28 = !!audioAbs,
    v29 = v28 ? readRange({ start: audioStart, end: audioEnd }) : null;
  if (v28 && !v29) throw new Error("Invalid audio clip range");
  const v30 = ["-y"];
  v25["forEach"]((v31) => {
    if (v31["kind"] === "image") {
      v30["push"](
        "-loop",
        "1",
        "-t",
        String(v31["duration"]),
        "-i",
        v31["abs"] || v31["src"],
      );
      return;
    }
    v30["push"](
      "-ss",
      String(v31["start"]),
      "-t",
      String(v31["duration"]),
      "-i",
      v31["abs"] || v31["src"],
    );
  });
  v28 &&
    v30["push"](
      "-ss",
      String(v29["start"]),
      "-t",
      String(v29["duration"]),
      "-i",
      audioAbs,
    );
  const v32 = normalizeFilterFps(fps),
    v33 = v25["map"](
      (v34, v35) =>
        "[" +
        v35 +
        ":v]scale=" +
        v26 +
        ":" +
        v27 +
        ":force_original_aspect_ratio=decrease,pad=" +
        v26 +
        ":" +
        v27 +
        ":(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=" +
        v32 +
        ",format=yuv420p,setpts=PTS-STARTPTS[v" +
        v35 +
        "]",
    );
  v33["push"](
    v25["map"]((v36, v37) => "[v" + v37 + "]")["join"]("") +
      "concat=n=" +
      v25["length"] +
      ":v=1:a=0[v]",
  );
  v28 &&
    v33["push"](
      "[" +
        v25["length"] +
        ":a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS,apad[a]",
    );
  v30["push"]("-filter_complex", v33["join"](";"), "-map", "[v]");
  const v38 = v25["reduce"]((v39, v40) => v39 + v40["duration"], 0);
  return (
    v28 && v30["push"]("-map", "[a]", "-t", String(v38)),
    v30["push"](
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-profile:v",
      "high",
      "-preset",
      "fast",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      v24,
    ),
    v30
  );
}
export function buildMediaClipExportFfmpegArgs({
  videoAbs: v41,
  clips: clips = null,
  audioAbs: audioAbs = "",
  videoStart: videoStart = 0,
  videoEnd: videoEnd = 0,
  audioStart: audioStart = 0,
  audioEnd: audioEnd = 0,
  fps: fps = 0,
  outputWidth: outputWidth = 0,
  outputHeight: outputHeight = 0,
  outAbs: v42,
} = {}) {
  if (Array["isArray"](clips) && clips["length"])
    return buildMediaClipExportConcatFfmpegArgs({
      clips: clips,
      audioAbs: audioAbs,
      audioStart: audioStart,
      audioEnd: audioEnd,
      fps: fps,
      outputWidth: outputWidth,
      outputHeight: outputHeight,
      outAbs: v42,
    });
  const v43 = readRange({ start: videoStart, end: videoEnd });
  if (!v41 || !v42 || !v43) throw new Error("Invalid video clip range");
  const v44 = !!audioAbs,
    v45 = v44 ? readRange({ start: audioStart, end: audioEnd }) : null;
  if (v44 && !v45) throw new Error("Invalid audio clip range");
  const v46 = [
    "-y",
    "-ss",
    String(v43["start"]),
    "-t",
    String(v43["duration"]),
    "-i",
    v41,
  ];
  v44
    ? v46["push"](
        "-ss",
        String(v45["start"]),
        "-t",
        String(v45["duration"]),
        "-i",
        audioAbs,
        "-filter_complex",
        "[1:a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS,apad[a]",
        "-map",
        "0:v:0",
        "-map",
        "[a]",
        "-t",
        String(v43["duration"]),
      )
    : v46["push"]("-map", "0:v:0", "-map", "0:a?");
  v46["push"](
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-profile:v",
    "high",
    "-preset",
    "fast",
    "-c:a",
    "aac",
  );
  const v47 = normalizeRequestedFps(fps);
  if (v47) v46["push"]("-r", String(v47));
  return (v46["push"]("-movflags", "+faststart", v42), v46);
}
export function createMediaClipExportTaskHandler({
  createOutputFilename: v48,
  ffprobeVideoMeta: v49,
  getOutputDir: v50,
  getRuntimeToolOrFallback: v51,
  resolveMediaTaskSource: v52,
  toOutputLocalPath: v53,
}) {
  return async (v54, v55) => {
    const v56 = v54["payload"] || {},
      v57 = v56["args"] || {},
      v58 = normalizeMediaClipExportClips(v57["clips"] || v56["clips"]),
      v59 = String(v57["audioSrc"] ?? v56["audioSrc"] ?? "")["trim"](),
      v60 = v59 ? v52(v59) : "",
      v61 = v60 ? readRange(v56, v57, "audio") : null;
    if (v60 && !v61) throw new Error("Invalid audio clip range");
    let v62 = "",
      v63 = null,
      v64 = [];
    if (v58["length"])
      v64 = v58["map"]((v65) => ({ ...v65, abs: v52(v65["src"]) }));
    else {
      ((v62 = v52(v56["src"] || v56["videoSrc"])),
        (v63 = readRange(v56, v57, "video")));
      if (!v63) throw new Error("Invalid video clip range");
    }
    const v66 =
        v64["find"]((v67) => v67["kind"] === "video")?.["abs"] ||
        v64[0]?.["abs"] ||
        v62,
      v68 = await v49(v55, v54, v66);
    if (!v68["width"] || !v68["height"])
      throw new Error("Source\x20video\x20has\x20no\x20video\x20stream");
    const v69 = path["join"](v50(), "ClipVideo");
    mkdirSync(v69, { recursive: true });
    const v70 = v48("clip", "mp4"),
      v71 = path["join"](v69, v70),
      v72 = v53("ClipVideo", v70),
      v73 = normalizeRequestedFps(v57["fps"] ?? v56["fps"]),
      v74 = buildMediaClipExportFfmpegArgs({
        videoAbs: v62,
        clips: v64,
        audioAbs: v60,
        videoStart: v63?.["start"] || 0,
        videoEnd: v63?.["end"] || 0,
        audioStart: v61?.["start"] || 0,
        audioEnd: v61?.["end"] || 0,
        fps: v64["length"] ? v73 || v68["fps"] || 30 : v73,
        outputWidth: v68["width"],
        outputHeight: v68["height"],
        outAbs: v71,
      }),
      v75 = v64["length"]
        ? v64["reduce"]((v76, v77) => v76 + v77["duration"], 0)
        : v63["duration"];
    return (
      await v55["runProcess"](v54, v51("ffmpeg"), v74, {
        durationSec: v75,
        progressMessage: "Exporting\x20clip",
      }),
      {
        success: true,
        filename: v70,
        path: v72,
        localPath: v72,
        url: "/" + v72,
        videoDuration: v75,
        fps: v73 || v68["fps"] || 0,
        videoWidth: v68["width"],
        videoHeight: v68["height"],
      }
    );
  };
}
