import test from "node:test";
import strict from "node:assert/strict";
import appStore from "../core/stores/appStore.js";
import { buildSourceAudioNodePayload } from "../services/fileService.js";
import {
  cancelAudioSeparationTaskForNode,
  getRunningAudioSeparationTaskForNode,
  __resetAudioSeparationDepsForTest,
  __setAudioSeparationDepsForTest,
  maybeResumeAudioSeparationLeader,
  runAudioSeparationFromNode,
} from "./AudioSeparationController.js";
function installDomStubs() {
  if (!globalThis["window"]) globalThis["window"] = {};
  (typeof globalThis["window"]["showToast"] !== "function" &&
    (globalThis["window"]["showToast"] = () => {}),
    typeof globalThis["window"]["_triggerLocalCacheSave"] !== "function" &&
      (globalThis["window"]["_triggerLocalCacheSave"] = () => {}),
    typeof globalThis["window"]["v2FocusOnNodes"] !== "function" &&
      (globalThis["window"]["v2FocusOnNodes"] = () => {}));
}
function resetStore() {
  appStore["loadState"]({
    nodes: {},
    edges: {},
    viewport: { x: 0, y: 0, zoom: 1.1 },
  });
}
function addSourceAudioNode(v0 = {}) {
  const v1 = buildSourceAudioNodePayload({
    id: "source-audio-1",
    x: 0,
    y: 0,
    width: 320,
    height: 140,
    name: "原始音频",
    localPath: "output/source-audio-1.mp3",
    src: "/output/source-audio-1.mp3",
    ...v0,
  });
  return (appStore["addNode"](v1), v1["id"]);
}
function getCreatedSplitNodes() {
  return Object["values"](appStore["getState"]()["nodes"] || {})["filter"](
    (v2) => v2["id"] !== "source-audio-1",
  );
}
(test["beforeEach"](() => {
  (installDomStubs(), resetStore(), __resetAudioSeparationDepsForTest());
}),
  test["afterEach"](() => {
    (__resetAudioSeparationDepsForTest(), resetStore());
  }),
  test("AudioSeparationController: 点击后立即创建双占位节点并在完成后写入结果", async () => {
    addSourceAudioNode();
    let v3 = null;
    globalThis["window"]["v2FocusOnNodes"] = (v4) => {
      v3 = [...v4];
    };
    let v5 = null;
    __setAudioSeparationDepsForTest({
      runAudioSeparationImpl: async () =>
        await new Promise((v6) => {
          v5 = v6;
        }),
      saveRemoteAudioLocallyDetailedImpl: async (v7) => {
        if (String(v7)["includes"]("vocals"))
          return {
            localPath: "output/vocals.mp3",
            localUrl: "/output/vocals.mp3",
          };
        return {
          localPath: "output/background.mp3",
          localUrl: "/output/background.mp3",
        };
      },
    });
    const v8 = runAudioSeparationFromNode("source-audio-1");
    await Promise["resolve"]();
    const v9 = getCreatedSplitNodes();
    strict["equal"](v9["length"], 2);
    const v10 = v9["find"]((v11) => v11["audioSplitRole"] === "vocals"),
      v12 = v9["find"]((v13) => v13["audioSplitRole"] === "background");
    (strict["ok"](v10),
      strict["ok"](v12),
      strict["equal"](v10["name"], "人声 (处理中)"),
      strict["equal"](v12["name"], "背景声 (处理中)"),
      strict["equal"](v10["audioSplitPeerId"], v12["id"]),
      strict["equal"](v12["audioSplitPeerId"], v10["id"]),
      strict["deepEqual"](appStore["getState"]()["selectedNodeIds"], [
        v10["id"],
        v12["id"],
      ]),
      strict["deepEqual"](v3, ["source-audio-1", v10["id"], v12["id"]]),
      v5?.({
        taskId: "split-task-1",
        audios: [
          { audioUrl: "https://cdn.example.com/vocals.mp3" },
          { audioUrl: "https://cdn.example.com/background.mp3" },
        ],
      }),
      await v8);
    const v14 = appStore["getState"]();
    (strict["equal"](v14["nodes"][v10["id"]]["name"], "人声"),
      strict["equal"](v14["nodes"][v10["id"]]["src"], "/output/vocals.mp3"),
      strict["equal"](
        v14["nodes"][v10["id"]]["localPath"],
        "output/vocals.mp3",
      ),
      strict["equal"](v14["nodes"][v10["id"]]["jobStatus"], "success"),
      strict["equal"](v14["nodes"][v10["id"]]["rhTaskStatus"], "success"),
      strict["equal"](v14["nodes"][v12["id"]]["name"], "背景声"),
      strict["equal"](v14["nodes"][v12["id"]]["src"], "/output/background.mp3"),
      strict["equal"](
        v14["nodes"][v12["id"]]["localPath"],
        "output/background.mp3",
      ),
      strict["equal"](v14["nodes"][v12["id"]]["jobStatus"], "success"));
  }),
  test("AudioSeparationController:\x20失败时保留双节点并标记失败", async () => {
    (addSourceAudioNode(),
      __setAudioSeparationDepsForTest({
        runAudioSeparationImpl: async () => {
          throw new Error("RH 失败");
        },
      }),
      await runAudioSeparationFromNode("source-audio-1"));
    const v15 = getCreatedSplitNodes();
    strict["equal"](v15["length"], 2);
    const v16 = v15["find"]((v17) => v17["audioSplitRole"] === "vocals"),
      v18 = v15["find"]((v19) => v19["audioSplitRole"] === "background");
    (strict["equal"](v16?.["name"], "人声 (失败)"),
      strict["equal"](v18?.["name"], "背景声 (失败)"),
      strict["equal"](v16?.["jobStatus"], "error"),
      strict["equal"](v18?.["jobStatus"], "error"),
      strict["equal"](v16?.["src"], ""),
      strict["equal"](v18?.["src"], ""));
  }),
  test("AudioSeparationController: 恢复 leader 任务时会同步回填 peer", async () => {
    const v20 = "source-audio-split-vocals-1",
      v21 = "source-audio-split-background-1";
    (appStore["addNode"](
      buildSourceAudioNodePayload({
        id: v20,
        x: 100,
        y: 0,
        width: 320,
        height: 140,
        name: "人声 (处理中)",
        audioSplitRole: "vocals",
        audioSplitPeerId: v21,
        provider: "runninghubwf",
        model: "runninghub/2047408096384917505",
        rhTaskId: "split-task-resume-1",
        rhTaskStatus: "running",
        rhTaskStartedAt: 1234,
        rhTaskUseOpenapiQuery: true,
        isGenerating: true,
      }),
    ),
      appStore["addNode"](
        buildSourceAudioNodePayload({
          id: v21,
          x: 460,
          y: 0,
          width: 320,
          height: 140,
          name: "背景声 (处理中)",
          audioSplitRole: "background",
          audioSplitPeerId: v20,
          isGenerating: true,
        }),
      ),
      __setAudioSeparationDepsForTest({
        resumeAudioSeparationTaskImpl: async (v22) => {
          return (
            strict["equal"](v22, "split-task-resume-1"),
            {
              taskId: v22,
              audios: [
                { audioUrl: "https://cdn.example.com/resume-vocals.mp3" },
                { audioUrl: "https://cdn.example.com/resume-background.mp3" },
              ],
            }
          );
        },
        saveRemoteAudioLocallyDetailedImpl: async (v23) => {
          if (String(v23)["includes"]("resume-vocals"))
            return {
              localPath: "output/resume-vocals.mp3",
              localUrl: "/output/resume-vocals.mp3",
            };
          return {
            localPath: "output/resume-background.mp3",
            localUrl: "/output/resume-background.mp3",
          };
        },
      }),
      await maybeResumeAudioSeparationLeader(v20));
    const v24 = appStore["getState"]();
    (strict["equal"](v24["nodes"][v20]["name"], "人声"),
      strict["equal"](v24["nodes"][v20]["src"], "/output/resume-vocals.mp3"),
      strict["equal"](v24["nodes"][v20]["jobStatus"], "success"),
      strict["equal"](v24["nodes"][v20]["rhTaskStatus"], "success"),
      strict["equal"](v24["nodes"][v21]["name"], "背景声"),
      strict["equal"](
        v24["nodes"][v21]["src"],
        "/output/resume-background.mp3",
      ),
      strict["equal"](v24["nodes"][v21]["jobStatus"], "success"));
  }),
  test("AudioSeparationController: cancel only affects the matching split pair", async () => {
    (addSourceAudioNode(),
      appStore["addNode"](
        buildSourceAudioNodePayload({
          id: "leader-a",
          name: "人声 (处理中)",
          audioSplitRole: "vocals",
          audioSplitPeerId: "peer-a",
          rhSourceNodeId: "source-audio-1",
          provider: "runninghubwf",
          model: "runninghub/2047408096384917505",
          rhTaskId: "",
          rhTaskStatus: "running",
          isGenerating: true,
        }),
      ),
      appStore["addNode"](
        buildSourceAudioNodePayload({
          id: "peer-a",
          name: "背景声 (处理中)",
          audioSplitRole: "background",
          audioSplitPeerId: "leader-a",
          rhSourceNodeId: "source-audio-1",
          isGenerating: true,
        }),
      ),
      appStore["addNode"](
        buildSourceAudioNodePayload({
          id: "leader-b",
          name: "人声 (处理中)",
          audioSplitRole: "vocals",
          audioSplitPeerId: "peer-b",
          rhSourceNodeId: "source-other",
          provider: "runninghubwf",
          model: "runninghub/2047408096384917505",
          rhTaskId: "",
          rhTaskStatus: "running",
          isGenerating: true,
        }),
      ));
    const v25 = getRunningAudioSeparationTaskForNode("peer-a");
    strict["equal"](v25["outId"], "leader-a");
    const v26 = getRunningAudioSeparationTaskForNode("source-audio-1");
    (strict["equal"](v26["outId"], "leader-a"),
      await cancelAudioSeparationTaskForNode("source-audio-1"),
      strict["equal"](
        appStore["getState"]()["nodes"]["leader-a"]["rhTaskStatus"],
        "cancelled",
      ),
      strict["equal"](
        appStore["getState"]()["nodes"]["peer-a"]["isGenerating"],
        false,
      ),
      strict["equal"](
        appStore["getState"]()["nodes"]["leader-b"]["rhTaskStatus"],
        "running",
      ));
  }));
