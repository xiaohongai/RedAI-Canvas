import test from "node:test";
import strict from "node:assert/strict";
import {
  buildVideoGenerationFailurePatch,
  buildVideoGenerationResultPatch,
  getSuccessfulVideoGenerationItems,
  getVideoGenerationResultError,
  normalizeVideoGenerationResult,
} from "./videoGenerationResultRenderer.js";
(test("video generation result renderer: normalizes single video result", () => {
  const v0 = normalizeVideoGenerationResult({
    url: "https://cdn.example.com/final.mp4",
    localPath: "output/final.mp4",
    thumbUrl: "/output/final.jpg",
  });
  (strict["equal"](v0["outputType"], "video"),
    strict["equal"](v0["items"]["length"], 1),
    strict["equal"](
      v0["items"][0]["videoUrl"],
      "https://cdn.example.com/final.mp4",
    ),
    strict["equal"](v0["items"][0]["localPath"], "output/final.mp4"),
    strict["equal"](v0["items"][0]["thumbUrl"], "/output/final.jpg"));
}),
  test("video generation result renderer: builds success patch from batch", () => {
    const v1 = buildVideoGenerationResultPatch(
      {
        isBatch: true,
        videos: [
          {
            videoUrl: "/output/a.mp4",
            localPath: "output/a.mp4",
            displayLocalPath: "data/assets/derived/video/a.proxy.mp4",
            posterLocalPath: "data/assets/derived/video/a.poster.jpg",
            videoProxyStatus: "generated",
            thumbId: "thumb-a",
          },
          { videoUrl: "/output/b.mp4", localPath: "output/b.mp4" },
        ],
      },
      { startedAt: Date["now"]() - 10 },
    );
    (strict["equal"](v1["jobStatus"], "success"),
      strict["equal"](v1["jobError"], null),
      strict["equal"](v1["videos"]["length"], 2),
      strict["equal"](v1["videoUrl"], "/output/a.mp4"),
      strict["equal"](v1["localPath"], "output/a.mp4"),
      strict["equal"](
        v1["displayLocalPath"],
        "data/assets/derived/video/a.proxy.mp4",
      ),
      strict["equal"](
        v1["posterLocalPath"],
        "data/assets/derived/video/a.poster.jpg",
      ),
      strict["equal"](v1["videoProxyStatus"], "generated"),
      strict["equal"](v1["thumbId"], "thumb-a"),
      strict["equal"](v1["mainVideoIndex"], 0),
      strict["equal"](v1["isVideosExpanded"], false));
  }),
  test("video generation result renderer: builds failure patch", () => {
    const v2 = buildVideoGenerationFailurePatch({
      error: "provider rejected",
      startedAt: Date["now"]() - 10,
    });
    (strict["equal"](v2["jobStatus"], "error"),
      strict["equal"](v2["jobError"], "provider rejected"),
      strict["equal"](v2["videos"]["length"], 1),
      strict["equal"](v2["videos"][0]["error"], "provider rejected"),
      strict["equal"](v2["videoUrl"], ""),
      strict["equal"](v2["localPath"], ""),
      strict["equal"](
        getVideoGenerationResultError({ error: "provider\x20rejected" }),
        "provider rejected",
      ),
      strict["deepEqual"](
        getSuccessfulVideoGenerationItems({ error: "provider rejected" }),
        [],
      ));
  }),
  test("video\x20generation\x20result\x20renderer:\x20failure\x20helper\x20can\x20preserve\x20media\x20fields", () => {
    const v3 = buildVideoGenerationFailurePatch({
      error: "resume failed",
      duration: 1200,
      clearMediaFields: false,
    });
    (strict["equal"](v3["jobStatus"], "error"),
      strict["equal"](v3["jobError"], "resume failed"),
      strict["equal"](v3["videos"][0]["error"], "resume failed"),
      strict["equal"](
        Object["prototype"]["hasOwnProperty"]["call"](v3, "videoUrl"),
        false,
      ),
      strict["equal"](
        Object["prototype"]["hasOwnProperty"]["call"](v3, "localPath"),
        false,
      ));
  }));
