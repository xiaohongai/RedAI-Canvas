import { mkdirSync } from "node:fs";
import path from "node:path";
function getTaskSources(v0) {
  return Array["isArray"](v0["payload"]["srcs"])
    ? v0["payload"]["srcs"]
    : Array["isArray"](v0["payload"]["args"]?.["srcs"])
      ? v0["payload"]["args"]["srcs"]
      : [];
}
async function readFfprobeJson(v1, v2, v3, v4) {
  const v5 = await v1["runProcess"](v2, v3("ffprobe"), v4),
    v6 = v5["stdout"]["toString"]("utf8")["trim"]();
  return v6 ? JSON["parse"](v6) : {};
}
async function ffprobeMediaDuration(v7, v8, v9, v10) {
  try {
    const v11 = await readFfprobeJson(v7, v8, v9, [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "json",
      v10,
    ]);
    return Number(v11?.["format"]?.["duration"] || 0) || 0;
  } catch {
    return 0;
  }
}
export function createAudioComposeMediaTaskHandler({
  createOutputFilename: v12,
  ffprobeHasAudio: v13,
  getOutputDir: v14,
  getRuntimeToolOrFallback: v15,
  resolveMediaTaskSource: v16,
  toOutputLocalPath: v17,
}) {
  return async (v18, v19) => {
    const v20 = getTaskSources(v18)["map"]((v21) => v16(v21));
    if (v20["length"] < 2) throw new Error("Invalid audio compose sources");
    const v22 = await Promise["all"](v20["map"]((v23) => v13(v19, v18, v23)));
    if (!v22["every"](Boolean))
      throw new Error("Source audio has no audio stream");
    const v24 = path["join"](v14(), "ComposeAudio");
    mkdirSync(v24, { recursive: true });
    const v25 = v12("compose", "mp3"),
      v26 = path["join"](v24, v25),
      v27 = v17("ComposeAudio", v25),
      v28 = v20["map"](
        (v29, v30) =>
          "[" +
          v30 +
          ":a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS[a" +
          v30 +
          "]",
      );
    v28["push"](
      v20["map"]((v31, v32) => "[a" + v32 + "]")["join"]("") +
        "concat=n=" +
        v20["length"] +
        ":v=0:a=1[a]",
    );
    const v33 = ["-y"];
    (v20["forEach"]((v34) => v33["push"]("-i", v34)),
      v33["push"](
        "-filter_complex",
        v28["join"](";"),
        "-map",
        "[a]",
        "-vn",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        v26,
      ));
    const v35 = await Promise["all"](
        v20["map"]((v36) => ffprobeMediaDuration(v19, v18, v15, v36)),
      ),
      v37 =
        Number(v18["payload"]["args"]?.["duration"] || 0) ||
        v35["reduce"]((v38, v39) => v38 + (Number(v39) || 0), 0);
    return (
      await v19["runProcess"](v18, v15("ffmpeg"), v33, {
        durationSec: v37,
        progressMessage: "Composing audio",
      }),
      {
        success: true,
        filename: v25,
        path: v27,
        localPath: v27,
        url: "/" + v27,
      }
    );
  };
}
