import test from "node:test";
import strict from "node:assert/strict";
import {
  extractStoryboardVideoFramesFromServer,
  STORYBOARD_VIDEO_FRAME_LIMIT,
} from "./storyboardVideoFrameApi.js";
const originalFetch = globalThis["fetch"];
(test["afterEach"](() => {
  globalThis["fetch"] = originalFetch;
}),
  test("storyboardVideoFrameApi posts normalized frame extraction options", async () => {
    let v0 = "",
      v1 = null;
    globalThis["fetch"] = async (v2, v3 = {}) => {
      return (
        (v0 = String(v2)),
        (v1 = JSON["parse"](String(v3["body"] || "{}"))),
        {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          async json() {
            return {
              success: true,
              frames: [
                {
                  index: 1,
                  start: 0,
                  end: 10,
                  captureTime: 0.2,
                  url: "/output/StoryboardFrames/a/frame_001.jpg",
                },
              ],
            };
          },
        }
      );
    };
    const v4 = await extractStoryboardVideoFramesFromServer("/output/a.mp4", {
      maxFrames: 99,
      exactCount: true,
    });
    (strict["equal"](v0, "/api/v2/video/storyboard_frames"),
      strict["equal"](v1["src"], "/output/a.mp4"),
      strict["equal"](v1["options"]["maxFrames"], STORYBOARD_VIDEO_FRAME_LIMIT),
      strict["equal"](v1["options"]["exactCount"], true),
      strict["equal"](
        v4["frames"][0]["url"],
        "/output/StoryboardFrames/a/frame_001.jpg",
      ),
      strict["equal"](v4["frames"][0]["start"], 0),
      strict["equal"](v4["frames"][0]["end"], 10));
  }));
