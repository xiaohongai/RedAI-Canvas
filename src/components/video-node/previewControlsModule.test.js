import { test } from "node:test";
import strict from "node:assert/strict";
import { createVideoNodePreviewControlsModule } from "./previewControlsModule.js";
async function flushAsyncSave() {
  (await Promise["resolve"](),
    await Promise["resolve"](),
    await new Promise((v0) => setTimeout(v0, 0)));
}
(test("previewControlsModule: capture frame adds preview node before async save", async () => {
  const v1 = globalThis["document"],
    v2 = globalThis["window"],
    v3 = globalThis["URL"],
    v4 = [],
    v5 = [],
    v6 = {
      nodes: {
        videoNode: {
          id: "videoNode",
          x: 100,
          y: 200,
          width: 300,
          height: 180,
          videoFps: 24,
          videoFrameCount: 48,
          videoDuration: 2,
        },
      },
    };
  let v7;
  const v8 = new Promise((v9) => {
    v7 = v9;
  });
  ((globalThis["document"] = {
    createElement(v10) {
      return (
        strict["equal"](v10, "canvas"),
        {
          width: 0,
          height: 0,
          getContext(v11) {
            return (strict["equal"](v11, "2d"), { drawImage() {} });
          },
          toBlob(v12, v13) {
            v12(new Blob(["frame"], { type: v13 }));
          },
        }
      );
    },
  }),
    (globalThis["URL"] = {
      createObjectURL() {
        return "blob:ai-video-frame";
      },
    }),
    (globalThis["window"] = { URL: globalThis["URL"], showToast() {} }));
  const v14 = {
    getState() {
      return v6;
    },
    getStateRaw() {
      return v6;
    },
    addNode(v15) {
      (v4["push"](v15), (v6["nodes"][v15["id"]] = v15));
    },
    updateNodeData(v16, v17) {
      (v5["push"]({ id: v16, patch: v17 }),
        (v6["nodes"][v16] = { ...v6["nodes"][v16], ...v17 }));
    },
  };
  try {
    const v18 = createVideoNodePreviewControlsModule({
        store: v14,
        saveOutputBlob: () => v8,
        VideoKeyingController: null,
        getAutoMediaSizeByShortSide: () => ({ width: 160, height: 90 }),
        buildSourceMediaNodePayload: (v19) => ({
          localPath: "",
          originalLocalPath: "",
          displayLocalPath: "",
          thumbLocalPath: "",
          ...v19,
        }),
        calcSafeSpawnPosNearNode: () => ({ x: 120, y: 240 }),
      }),
      v20 = Object["create"](v18);
    ((v20["nodeId"] = "videoNode"),
      (v20["_getActivePreviewVideoEl"] = () => ({
        src: "video.mp4",
        currentSrc: "",
        readyState: 2,
        videoWidth: 640,
        videoHeight: 360,
        currentTime: 0.5,
      })),
      (v20["_getActiveVideoDuration"] = () => 2),
      await v20["_captureCurrentFrameFromActiveVideo"](),
      strict["equal"](v4["length"], 1),
      strict["equal"](v4[0]["type"], "source-image"),
      strict["equal"](v4[0]["capturePreviewUrl"], "blob:ai-video-frame"),
      strict["equal"](v4[0]["captureSavePending"], true),
      strict["equal"](v4[0]["localPath"], ""),
      strict["equal"](v5["length"], 0),
      v7({
        url: "/output/ai-frame.png",
        localPath: "output/ai-frame.png",
        originalLocalPath: "output/ai-frame.png",
        displayLocalPath: "output/_derived/display/ai-frame.display.jpg",
        thumbLocalPath: "output/_derived/thumb/ai-frame.thumb.jpg",
        originalWidth: 640,
        originalHeight: 360,
        filename: "ai-frame.png",
      }),
      await flushAsyncSave());
    const v21 = v6["nodes"][v4[0]["id"]];
    (strict["equal"](v21["captureSavePending"], false),
      strict["equal"](v21["captureSaveError"], null),
      strict["equal"](v21["localPath"], "output/ai-frame.png"),
      strict["equal"](
        v21["displayLocalPath"],
        "output/_derived/display/ai-frame.display.jpg",
      ),
      strict["equal"](
        v21["thumbLocalPath"],
        "output/_derived/thumb/ai-frame.thumb.jpg",
      ),
      strict["equal"](v21["fileName"], "ai-frame.png"));
  } finally {
    (typeof v1 === "undefined"
      ? delete globalThis["document"]
      : (globalThis["document"] = v1),
      typeof v2 === "undefined"
        ? delete globalThis["window"]
        : (globalThis["window"] = v2),
      typeof v3 === "undefined"
        ? delete globalThis["URL"]
        : (globalThis["URL"] = v3));
  }
}),
  test("previewControlsModule: Alt 播放按钮开启循环，暂停时清理循环状态", async () => {
    const v22 = createVideoNodePreviewControlsModule({
        store: { getState: () => ({ nodes: {} }) },
        saveOutputBlob: async () => ({}),
        VideoKeyingController: { isActiveFor: () => false },
        getAutoMediaSizeByShortSide: () => ({ width: 160, height: 90 }),
        buildSourceMediaNodePayload: (v23) => v23,
        calcSafeSpawnPosNearNode: () => ({ x: 0, y: 0 }),
      }),
      v24 = {
        paused: true,
        loop: false,
        getAttribute(v25) {
          return v25 === "src" ? "video.mp4" : "";
        },
        pause() {
          this["paused"] = true;
        },
      };
    let v26 = 0;
    const v27 = [],
      v28 = Object["create"](v22);
    (Object["assign"](v28, {
      _isManualControl: false,
      _hoverManualPause: false,
      _isManualLoopPlayback: false,
      _autoPlayToken: 0,
      _playPreviewVideoWithRecovery: async () => {
        return ((v24["paused"] = false), true);
      },
      _flashCenterIndicator(v29) {
        v27["push"](v29);
      },
      _showPausedCenterIndicator() {
        v27["push"]("paused");
      },
      _syncVideoControlsFromVideo() {
        v26 += 1;
      },
    }),
      v28["_toggleVideoPlayPause"](v24, { loop: true }),
      await Promise["resolve"](),
      strict["equal"](v28["_isManualLoopPlayback"], true),
      strict["equal"](v28["_isManualControl"], true),
      strict["equal"](v24["loop"], true),
      strict["equal"](v24["paused"], false),
      strict["deepEqual"](v27, ["play"]),
      strict["equal"](v26, 1),
      (v27["length"] = 0),
      v28["_toggleVideoPlayPause"](v24),
      strict["equal"](v28["_isManualLoopPlayback"], false),
      strict["equal"](v24["loop"], false),
      strict["equal"](v24["paused"], true),
      strict["equal"](v28["_hoverManualPause"], true),
      strict["deepEqual"](v27, ["paused"]),
      strict["equal"](v26, 2));
  }));
