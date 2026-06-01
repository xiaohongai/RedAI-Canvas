import test from "node:test";
import strict from "node:assert/strict";
import appStore from "../../core/stores/appStore.js";
import {
  bindRunningHubToolbarTaskButton,
  findRunningHubToolbarTaskForNode,
  isRunningHubToolbarTaskCancelled,
  isRunningHubToolbarTaskNode,
} from "./runningHubToolbarTaskButton.js";
function installDomStubs() {
  if (!globalThis["window"]) globalThis["window"] = {};
  (typeof globalThis["window"]["addEventListener"] !== "function" &&
    (globalThis["window"]["addEventListener"] = () => {}),
    typeof globalThis["window"]["removeEventListener"] !== "function" &&
      (globalThis["window"]["removeEventListener"] = () => {}),
    typeof globalThis["CustomEvent"] !== "function" &&
      (globalThis["CustomEvent"] = class v0 {
        constructor(v1, v2 = {}) {
          ((this["type"] = v1), (this["detail"] = v2["detail"]));
        }
      }));
}
function resetStore(v3 = {}) {
  appStore["loadState"]({
    nodes: v3,
    edges: {},
    viewport: { x: 0, y: 0, zoom: 1 },
  });
}
function createClassList() {
  const v4 = new Set();
  return {
    add: (...v5) => v5["forEach"]((v6) => v4["add"](v6)),
    remove: (...v7) => v7["forEach"]((v8) => v4["delete"](v8)),
    contains: (v9) => v4["has"](v9),
    toggle(v10, v11) {
      const v12 = v11 === undefined ? !v4["has"](v10) : !!v11;
      if (v12) v4["add"](v10);
      else v4["delete"](v10);
      return v12;
    },
  };
}
function createButton() {
  const v13 = new Map([["aria-label", "高清"]]),
    v14 = new Map();
  return {
    innerHTML: "<svg data-original></svg>",
    style: { color: "" },
    dataset: { tooltip: "高清" },
    title: "",
    classList: createClassList(),
    addEventListener(v15, v16) {
      v14["set"](v15, v16);
    },
    removeEventListener(v17) {
      v14["delete"](v17);
    },
    getAttribute(v18) {
      return v13["get"](v18) || "";
    },
    setAttribute(v19, v20) {
      v13["set"](v19, String(v20));
    },
    removeAttribute(v21) {
      v13["delete"](v21);
    },
    dispatch(v22) {
      v14["get"](v22)?.({
        preventDefault() {},
        stopPropagation() {},
        stopImmediatePropagation() {},
      });
    },
  };
}
(test["beforeEach"](() => {
  (installDomStubs(), resetStore());
}),
  test["afterEach"](() => {
    resetStore();
  }),
  test("RunningHub toolbar task button only matches related running result nodes", () => {
    resetStore({
      sourceA: { id: "sourceA", type: "source-image" },
      sourceB: { id: "sourceB", type: "source-image" },
      outA: {
        id: "outA",
        type: "source-image",
        provider: "runninghubwf",
        model: "runninghub/2012862147813974018",
        rhSourceNodeId: "sourceA",
        rhTaskId: "task-a",
        rhTaskStatus: "running",
        outputText: "模型: RH高清放大",
        isGenerating: true,
      },
    });
    const v23 = findRunningHubToolbarTaskForNode("sourceA", {
        models: ["runninghub/2012862147813974018"],
        outputTextIncludes: ["RH高清放大"],
      }),
      v24 = findRunningHubToolbarTaskForNode("sourceB", {
        models: ["runninghub/2012862147813974018"],
        outputTextIncludes: ["RH高清放大"],
      });
    (strict["equal"](v23["outId"], "outA"),
      strict["equal"](v23["taskId"], "task-a"),
      strict["equal"](v24, null));
  }),
  test("RunningHub toolbar task button reads active state through unified selector", () => {
    (strict["equal"](
      isRunningHubToolbarTaskNode({
        id: "dreamina-active",
        provider: "dreamina",
        model: "dreamina/video",
        isGenerating: true,
        jobStatus: "running",
      }),
      false,
    ),
      strict["equal"](
        isRunningHubToolbarTaskNode({
          id: "rh-recovering",
          provider: "runninghubwf",
          rhTaskId: "rh-task",
          rhTaskStatus: "pending",
          rhTaskRecovering: true,
        }),
        true,
      ),
      strict["equal"](
        isRunningHubToolbarTaskNode({
          id: "rh-manifest-model-only",
          model: "runninghub-model/rhart-image-v1",
          rhTaskStatus: "running",
          isGenerating: true,
        }),
        true,
      ),
      resetStore({
        dreaminaCancelled: {
          id: "dreaminaCancelled",
          provider: "dreamina",
          jobStatus: "cancelled",
        },
        rhCancelled: {
          id: "rhCancelled",
          provider: "runninghubwf",
          rhTaskStatus: "cancelled",
        },
      }),
      strict["equal"](
        isRunningHubToolbarTaskCancelled("dreaminaCancelled"),
        false,
      ),
      strict["equal"](isRunningHubToolbarTaskCancelled("rhCancelled"), true));
  }),
  test("RunningHub toolbar task button flips to cancel state and cancels current task", () => {
    resetStore({
      sourceA: { id: "sourceA", type: "source-video" },
      outA: {
        id: "outA",
        type: "source-video",
        provider: "runninghubwf",
        model: "runninghub/2047784060881211393",
        rhSourceNodeId: "sourceA",
        rhTaskId: "task-a",
        rhTaskStatus: "running",
        outputText: "模型: RH视频补帧",
        isGenerating: true,
      },
    });
    const v25 = createButton();
    let v26 = null;
    (bindRunningHubToolbarTaskButton({
      button: v25,
      getTask: () =>
        findRunningHubToolbarTaskForNode("sourceA", {
          models: ["runninghub/2047784060881211393"],
          outputTextIncludes: ["RH视频补帧"],
        }),
      cancelTask: (v27) => {
        v26 = v27;
      },
      cancelTooltip: "取消补帧",
    }),
      strict["equal"](v25["classList"]["contains"]("is-task-cancel"), true),
      strict["match"](v25["innerHTML"], /v2-task-cancel-spin/),
      strict["equal"](v25["dataset"]["tooltip"], "取消补帧"),
      v25["dispatch"]("click"),
      strict["equal"](v26["outId"], "outA"));
  }),
  test("RunningHub toolbar task button restores inline color after cancellation", async () => {
    resetStore({
      sourceA: { id: "sourceA", type: "source-video" },
      outA: {
        id: "outA",
        type: "source-video",
        provider: "runninghubwf",
        model: "runninghub/2047784060881211393",
        rhSourceNodeId: "sourceA",
        rhToolbarTaskType: "video-frame",
        rhTaskId: "task-a",
        rhTaskStatus: "running",
        isGenerating: true,
      },
    });
    const v28 = createButton();
    (bindRunningHubToolbarTaskButton({
      button: v28,
      getTask: () =>
        findRunningHubToolbarTaskForNode("sourceA", {
          models: ["runninghub/2047784060881211393"],
          taskTypes: ["video-frame"],
        }),
      cancelTask: (v29) => {
        ((v28["style"]["color"] = "var(--red)"),
          appStore["updateNodeData"](v29["outId"], {
            isGenerating: false,
            rhTaskStatus: "cancelled",
          }));
      },
      cancelTooltip: "取消补帧",
    }),
      v28["dispatch"]("click"),
      await new Promise((v30) => setTimeout(v30, 0)),
      strict["equal"](v28["classList"]["contains"]("is-task-cancel"), false),
      strict["equal"](v28["style"]["color"], ""),
      strict["match"](v28["innerHTML"], /data-original/));
  }),
  test("RunningHub toolbar task button matches stable task type from source and result nodes", () => {
    resetStore({
      imageSource: { id: "imageSource", type: "source-image" },
      panoramaOut: {
        id: "panoramaOut",
        type: "source-image",
        provider: "runninghubwf",
        model: "runninghub/2044874075721441281",
        rhSourceNodeId: "imageSource",
        rhToolbarTaskType: "image-panorama-360",
        rhTaskId: "pano-task",
        rhTaskStatus: "pending",
        outputText: "模型: RH",
        isGenerating: true,
      },
    });
    for (const v31 of ["imageSource", "panoramaOut"]) {
      const v32 = findRunningHubToolbarTaskForNode(v31, {
        models: ["runninghub/2044874075721441281"],
        taskTypes: ["image-panorama-360"],
        outputTextIncludes: ["360°全景图"],
      });
      (strict["equal"](v32["outId"], "panoramaOut"),
        strict["equal"](v32["taskId"], "pano-task"));
    }
  }),
  test("RunningHub\x20toolbar\x20task\x20button\x20covers\x20all\x20source-toolbar\x20RH\x20task\x20types", () => {
    const v33 = [
        {
          sourceId: "img-subject-src",
          outId: "img-subject-out",
          model: "runninghub/2042329021530247170",
          taskType: "image-auto-subject",
        },
        {
          sourceId: "img-hd-src",
          outId: "img-hd-out",
          model: "runninghub/2012862147813974018",
          taskType: "image-hd",
        },
        {
          sourceId: "img-expand-src",
          outId: "img-expand-out",
          model: "runninghub-model/rhart-image-v1",
          taskType: "image-expand",
        },
        {
          sourceId: "img-repaint-src",
          outId: "img-repaint-out",
          model: "runninghub-model/rhart-image-v1",
          taskType: "image-repaint",
        },
        {
          sourceId: "img-erase-src",
          outId: "img-erase-out",
          model: "runninghub-model/rhart-image-v1",
          taskType: "image-erase",
        },
        {
          sourceId: "img-free-angle-src",
          outId: "img-free-angle-out",
          model: "runninghub-model/rhart-image-v1",
          taskType: "image-free-angle",
        },
        {
          sourceId: "video-frame-src",
          outId: "video-frame-out",
          model: "runninghub/2047784060881211393",
          taskType: "video-frame",
        },
        {
          sourceId: "video-hd-src",
          outId: "video-hd-out",
          model: "runninghub/2047787809091620866",
          taskType: "video-hd",
        },
      ],
      v34 = {};
    (v33["forEach"]((v35) => {
      ((v34[v35["sourceId"]] = { id: v35["sourceId"], type: "source-image" }),
        (v34[v35["outId"]] = {
          id: v35["outId"],
          type: "source-image",
          provider: "runninghubwf",
          model: v35["model"],
          rhSourceNodeId: v35["sourceId"],
          rhToolbarTaskType: v35["taskType"],
          rhTaskId: v35["taskType"] + "-task",
          rhTaskStatus: "running",
          isGenerating: true,
        }));
    }),
      resetStore(v34),
      v33["forEach"]((v36) => {
        for (const v37 of [v36["sourceId"], v36["outId"]]) {
          const v38 = findRunningHubToolbarTaskForNode(v37, {
            models: [v36["model"]],
            taskTypes: [v36["taskType"]],
          });
          strict["equal"](
            v38["outId"],
            v36["outId"],
            v36["taskType"] + ":" + v37,
          );
        }
      }));
  }));
