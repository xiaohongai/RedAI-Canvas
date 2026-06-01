import test from "node:test";
import strict from "node:assert/strict";
import appStore from "../core/stores/appStore.js";
import { buildSourceMediaNodePayload } from "../services/fileService.js";
import {
  __resetVideoAudioSeparationDepsForTest,
  __setVideoAudioSeparationDepsForTest,
  runVideoAudioSeparationFromNode,
} from "./VideoAudioSeparationController.js";
function installDomStubs() {
  if (!globalThis["window"]) globalThis["window"] = {};
  ((globalThis["window"]["showToast"] = () => {}),
    (globalThis["window"]["_triggerLocalCacheSave"] = () => {}),
    (globalThis["window"]["v2FocusOnNodes"] = () => {}),
    (globalThis["window"]["v2NodeAvoidOverlap"] = false),
    (globalThis["window"]["v2NodeDirection"] = "right"),
    (globalThis["window"]["v2NodeSpacing"] = 120));
}
function resetStore() {
  appStore["loadState"]({
    nodes: {},
    edges: {},
    viewport: { x: 0, y: 0, zoom: 1 },
  });
}
function addSourceVideoNode(v0 = {}) {
  const v1 = buildSourceMediaNodePayload({
    id: "source-video-1",
    type: "source-video",
    x: 10,
    y: 20,
    width: 512,
    height: 288,
    name: "原始视频",
    localPath: "output/source-video-1.mp4",
    src: "/output/source-video-1.mp4",
    needsAutoResize: false,
    fixedSize: true,
    ...v0,
  });
  return (appStore["addNode"](v1), v1["id"]);
}
function getCreatedNodes() {
  return Object["values"](appStore["getState"]()["nodes"] || {})["filter"](
    (v2) => v2["id"] !== "source-video-1",
  );
}
(test["beforeEach"](() => {
  (installDomStubs(), resetStore(), __resetVideoAudioSeparationDepsForTest());
}),
  test["afterEach"](() => {
    (__resetVideoAudioSeparationDepsForTest(), resetStore());
  }),
  test("VideoAudioSeparationController: 成功后创建无声视频和音频节点", async () => {
    addSourceVideoNode();
    let v3 = null,
      v4 = null;
    ((globalThis["window"]["v2FocusOnNodes"] = (v5) => {
      v4 = [...v5];
    }),
      __setVideoAudioSeparationDepsForTest({
        separateVideoAudioImpl: async (v6) => {
          return (
            (v3 = v6),
            {
              success: true,
              video: {
                filename: "video_fixed.mp4",
                localPath: "output/SeparateVideo/video_fixed.mp4",
                url: "/output/SeparateVideo/video_fixed.mp4",
              },
              audio: {
                filename: "audio_fixed.mp3",
                localPath: "output/SeparateAudio/audio_fixed.mp3",
                url: "/output/SeparateAudio/audio_fixed.mp3",
              },
            }
          );
        },
      }));
    const v7 = await runVideoAudioSeparationFromNode("source-video-1");
    (strict["deepEqual"](v3, { src: "output/source-video-1.mp4" }),
      strict["ok"](v7?.["videoId"]),
      strict["ok"](v7?.["audioId"]));
    const v8 = getCreatedNodes();
    strict["equal"](v8["length"], 2);
    const v9 = v8["find"]((v10) => v10["type"] === "source-video"),
      v11 = v8["find"]((v12) => v12["type"] === "source-audio");
    (strict["ok"](v9),
      strict["ok"](v11),
      strict["equal"](v9["name"], "画面自\x20原始视频"),
      strict["equal"](v9["src"], "/output/SeparateVideo/video_fixed.mp4"),
      strict["equal"](v9["videoUrl"], "/output/SeparateVideo/video_fixed.mp4"),
      strict["equal"](v9["localPath"], "output/SeparateVideo/video_fixed.mp4"),
      strict["equal"](v9["jobStatus"], "success"),
      strict["equal"](
        v9["videos"]?.[0]?.["localPath"],
        "output/SeparateVideo/video_fixed.mp4",
      ),
      strict["equal"](v11["name"], "音频自\x20原始视频"),
      strict["equal"](v11["src"], "/output/SeparateAudio/audio_fixed.mp3"),
      strict["equal"](v11["audioUrl"], "/output/SeparateAudio/audio_fixed.mp3"),
      strict["equal"](v11["localPath"], "output/SeparateAudio/audio_fixed.mp3"),
      strict["equal"](v11["jobStatus"], "success"),
      strict["deepEqual"](appStore["getState"]()["selectedNodeIds"], [
        v9["id"],
        v11["id"],
      ]),
      strict["deepEqual"](v4, ["source-video-1", v9["id"], v11["id"]]));
  }),
  test("VideoAudioSeparationController:\x20失败时不创建结果节点", async () => {
    addSourceVideoNode();
    const v13 = [];
    ((globalThis["window"]["showToast"] = (v14, v15) => {
      v13["push"]({ message: v14, type: v15 });
    }),
      __setVideoAudioSeparationDepsForTest({
        separateVideoAudioImpl: async () => {
          throw new Error("当前视频没有可分离的音频");
        },
      }));
    const v16 = await runVideoAudioSeparationFromNode("source-video-1");
    (strict["equal"](v16, null),
      strict["equal"](getCreatedNodes()["length"], 0),
      strict["ok"](
        v13["some"](
          (v17) =>
            v17["type"] === "error" &&
            String(v17["message"])["includes"]("当前视频没有可分离的音频"),
        ),
      ));
  }));
