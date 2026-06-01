import test from "node:test";
import strict from "node:assert/strict";
import { resolveVideoFrameCaptureIndex } from "./videoFrameExtraction.js";
(test("videoFrameExtraction: resolves frame index from explicit fps", () => {
  strict["deepEqual"](
    resolveVideoFrameCaptureIndex(
      { videoFps: 24, videoFrameCount: 240, videoDuration: 10 },
      { currentTimeSec: 2 },
    ),
    { frameIndex: 49, nextSnapSeq: null, usedSequence: false },
  );
}),
  test("videoFrameExtraction: derives fps from frame count and duration", () => {
    strict["deepEqual"](
      resolveVideoFrameCaptureIndex(
        { videoFrameCount: 100 },
        { currentTimeSec: 15, fallbackDurationSec: 10 },
      ),
      { frameIndex: 100, nextSnapSeq: null, usedSequence: false },
    );
  }),
  test("videoFrameExtraction: falls back to snap sequence without timing metadata", () => {
    strict["deepEqual"](
      resolveVideoFrameCaptureIndex({ snapSeq: 3 }, { currentTimeSec: 2 }),
      { frameIndex: 4, nextSnapSeq: 4, usedSequence: true },
    );
  }));
