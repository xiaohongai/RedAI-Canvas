import { post } from "./apiBase.js";
const STORYBOARD_VIDEO_FRAME_MAX_COUNT = 30,
  STORYBOARD_VIDEO_FRAME_TIMEOUT_MS = 300000;
function normalizeFrameCount(v0) {
  const v1 = Number(v0);
  if (!Number["isFinite"](v1) || v1 <= 0)
    return STORYBOARD_VIDEO_FRAME_MAX_COUNT;
  return Math["max"](
    1,
    Math["min"](STORYBOARD_VIDEO_FRAME_MAX_COUNT, Math["trunc"](v1)),
  );
}
function normalizeFrameItem(v2, v3) {
  const v4 = String(v2?.["url"] || v2?.["localUrl"] || "")["trim"](),
    v5 = String(v2?.["localPath"] || v2?.["path"] || "")["trim"]();
  return {
    index: Number(v2?.["index"]) || v3 + 1,
    start: Number(v2?.["start"]) || 0,
    end: Number(v2?.["end"]) || 0,
    duration: Number(v2?.["duration"]) || 0,
    captureTime: Number(v2?.["captureTime"]) || 0,
    url: v4,
    localPath: v5,
  };
}
export async function extractStoryboardVideoFramesFromServer(
  v6,
  {
    maxFrames: maxFrames = STORYBOARD_VIDEO_FRAME_MAX_COUNT,
    exactCount: exactCount = false,
  } = {},
) {
  const v7 = String(v6 || "")["trim"]();
  if (!v7) throw new Error("视频源不能为空");
  const v8 = await post(
    "/api/v2/video/storyboard_frames",
    {
      src: v7,
      options: {
        maxFrames: normalizeFrameCount(maxFrames),
        exactCount: exactCount === true,
      },
    },
    STORYBOARD_VIDEO_FRAME_TIMEOUT_MS,
  );
  if (!v8["success"]) throw new Error(v8["error"] || "视频分镜抽帧失败");
  const v9 = v8["data"] || {};
  if (v9["success"] === false)
    throw new Error(v9["error"] || "视频分镜抽帧失败");
  const v10 = Array["isArray"](v9["frames"])
    ? v9["frames"]
        ["map"](normalizeFrameItem)
        ["filter"]((v11) => v11["url"] || v11["localPath"])
    : [];
  if (v10["length"] === 0) throw new Error("视频分镜抽帧没有返回可用参考帧");
  return { ...v9, frames: v10 };
}
export const STORYBOARD_VIDEO_FRAME_LIMIT = STORYBOARD_VIDEO_FRAME_MAX_COUNT;
