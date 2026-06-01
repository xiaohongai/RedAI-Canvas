import test from "node:test";
import strict from "node:assert/strict";
import appStore from "../core/stores/appStore.js";
function installDomStubs() {
  if (!globalThis["window"]) globalThis["window"] = {};
  typeof globalThis["window"]["addEventListener"] !== "function" &&
    (globalThis["window"]["addEventListener"] = () => {});
  typeof globalThis["window"]["removeEventListener"] !== "function" &&
    (globalThis["window"]["removeEventListener"] = () => {});
  typeof globalThis["window"]["showToast"] !== "function" &&
    (globalThis["window"]["showToast"] = () => {});
  typeof globalThis["window"]["_triggerLocalCacheSave"] !== "function" &&
    (globalThis["window"]["_triggerLocalCacheSave"] = () => {});
  if (!globalThis["document"]) globalThis["document"] = {};
  (!globalThis["document"]["documentElement"] &&
    (globalThis["document"]["documentElement"] = {
      classList: { add() {}, remove() {} },
    }),
    typeof globalThis["document"]["addEventListener"] !== "function" &&
      (globalThis["document"]["addEventListener"] = () => {}),
    typeof globalThis["document"]["removeEventListener"] !== "function" &&
      (globalThis["document"]["removeEventListener"] = () => {}),
    typeof globalThis["document"]["getElementById"] !== "function" &&
      (globalThis["document"]["getElementById"] = () => null),
    !globalThis["document"]["body"] &&
      (globalThis["document"]["body"] = { appendChild() {}, removeChild() {} }),
    !globalThis["Node"] &&
      (globalThis["Node"] = { TEXT_NODE: 3, ELEMENT_NODE: 1 }));
}
function resetStore(v0 = {}) {
  appStore["loadState"]({
    nodes: v0,
    edges: {},
    viewport: { x: 0, y: 0, zoom: 1 },
  });
}
function createFrameInterpolationNode(v1 = {}) {
  return {
    id: "source-video-frame-rh",
    type: "source-video",
    x: 0,
    y: 0,
    width: 320,
    height: 180,
    provider: "runninghubwf",
    model: "runninghub/2047784060881211393",
    rhTaskId: "rh-frame-task",
    rhTaskStatus: "running",
    rhTaskUseOpenapiQuery: true,
    name: "补帧视频 (处理中)",
    isGenerating: true,
    jobStatus: "running",
    generationStartTime: 123,
    ...v1,
  };
}
function createFakeClassList() {
  const v2 = new Set();
  return {
    add: (...v3) => v3["forEach"]((v4) => v2["add"](v4)),
    remove: (...v5) => v5["forEach"]((v6) => v2["delete"](v6)),
    contains: (v7) => v2["has"](v7),
    toggle(v8, v9) {
      const v10 = v9 === undefined ? !v2["has"](v8) : !!v9;
      if (v10) v2["add"](v8);
      else v2["delete"](v8);
      return v10;
    },
  };
}
function createFakeButton({
  html: html = "<svg data-original-keying></svg>",
  tooltip: tooltip = "抠像",
  aria: aria = "抠像",
} = {}) {
  const v11 = {},
    v12 = new Map([["aria-label", aria]]);
  return {
    innerHTML: html,
    dataset: { tooltip: tooltip },
    title: "",
    classList: createFakeClassList(),
    addEventListener(v13, v14) {
      v11[v13] = v14;
    },
    getAttribute(v15) {
      return v12["get"](v15) || "";
    },
    setAttribute(v16, v17) {
      v12["set"](v16, String(v17));
    },
    removeAttribute(v18) {
      v12["delete"](v18);
    },
    dispatchClick() {
      v11["click"]?.({ preventDefault() {}, stopPropagation() {} });
    },
  };
}
function createFakeToolbar(v19) {
  return {
    isConnected: true,
    addEventListener() {},
    querySelector(v20) {
      return v20 === ".act-keying" ? v19 : null;
    },
  };
}
function createFakeVideoElement() {
  const v21 = new Map([["src", ""]]);
  let v22 = 0;
  return {
    style: { display: "" },
    preload: "auto",
    poster: "",
    src: "",
    currentSrc: "",
    paused: true,
    addEventListener() {},
    removeEventListener() {},
    getAttribute(v23) {
      return v21["get"](v23) || "";
    },
    setAttribute(v24, v25) {
      const v26 = String(v25 || "");
      v21["set"](v24, v26);
      if (v24 === "src") this["src"] = v26;
      if (v24 === "poster") this["poster"] = v26;
    },
    removeAttribute(v27) {
      v21["delete"](v27);
      v27 === "src" && ((this["src"] = ""), (this["currentSrc"] = ""));
      if (v27 === "poster") this["poster"] = "";
    },
    load() {
      ((v22 += 1), (this["currentSrc"] = this["src"]));
    },
    pause() {
      this["paused"] = true;
    },
    get loadCalls() {
      return v22;
    },
  };
}
function createFakeImageElement() {
  const v28 = new Map();
  return {
    src: "",
    classList: createFakeClassList(),
    setAttribute(v29, v30) {
      v28["set"](String(v29), String(v30 || ""));
      if (v29 === "src") this["src"] = String(v30 || "");
    },
    removeAttribute(v31) {
      v28["delete"](String(v31));
      if (v31 === "src") this["src"] = "";
    },
    getAttribute(v32) {
      return v28["get"](String(v32)) || "";
    },
  };
}
function createFakeLoadingCard() {
  return {
    classList: createFakeClassList(),
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    appendChild() {},
  };
}
(test("SourceVideoNode: RunningHub 补帧恢复失败时同步失败标题", async () => {
  installDomStubs();
  const { SourceVideoNode: v33 } = await import("./SourceVideoNode.js"),
    v34 = createFrameInterpolationNode();
  resetStore({ [v34["id"]]: v34 });
  const v35 = Object["create"](v33["prototype"]);
  (Object["assign"](v35, {
    id: v34["id"],
    _data: v34,
    _rhResumeAbortController: null,
    _rhResumeTaskId: "",
    _rhResumePromise: null,
  }),
    (v35["_resumeRunningHubTaskPoller"] = async () => {
      throw new Error("官方任务失败");
    }),
    v35["_maybeResumeRunningHubTask"](),
    await v35["_rhResumePromise"]);
  const v36 = appStore["getState"]()["nodes"][v34["id"]];
  (strict["equal"](v36["name"], "补帧视频\x20(失败)"),
    strict["equal"](v36["jobStatus"], "error"),
    strict["equal"](v36["isGenerating"], false),
    strict["equal"](v36["rhTaskStatus"], "failed"),
    strict["equal"](v36["rhTaskRecovering"], false),
    strict["equal"](v36["jobError"], "官方任务失败"),
    strict["equal"](v36["videos"]?.[0]?.["error"], "官方任务失败"),
    strict["equal"](v36["mainVideoIndex"], 0),
    resetStore());
}),
  test("SourceVideoNode:\x20async\x20恢复失败保留已有视频并写入错误结果", async () => {
    installDomStubs();
    const { SourceVideoNode: v37 } = await import("./SourceVideoNode.js"),
      v38 = {
        id: "source-video-async-failed",
        type: "source-video",
        x: 0,
        y: 0,
        width: 320,
        height: 180,
        provider: "apimart",
        model: "apimart/seedance-1.5",
        asyncTaskId: "async-video-task",
        asyncTaskStatus: "running",
        asyncTaskProvider: "apimart",
        asyncTaskKind: "video",
        videoUrl: "/output/previous.mp4",
        thumbUrl: "/output/previous.jpg",
        outputText: "模型: APIMart 视频任务",
        isGenerating: true,
        jobStatus: "running",
        generationStartTime: 123,
      };
    resetStore({ [v38["id"]]: v38 });
    const v39 = Object["create"](v37["prototype"]);
    (Object["assign"](v39, {
      id: v38["id"],
      _data: v38,
      _asyncResumeAbortController: null,
      _asyncResumeTaskId: "",
      _asyncResumePromise: null,
      _computeGenerationDuration: () => 654,
    }),
      (v39["_resumeAsyncTaskPoller"] = async () => {
        throw new Error("异步视频恢复失败");
      }),
      v39["_maybeResumeAsyncTask"](),
      await v39["_asyncResumePromise"]);
    const v40 = appStore["getState"]()["nodes"][v38["id"]];
    (strict["equal"](v40["isGenerating"], false),
      strict["equal"](v40["jobStatus"], "error"),
      strict["equal"](v40["jobError"], "异步视频恢复失败"),
      strict["equal"](v40["generationDuration"], 654),
      strict["equal"](v40["asyncTaskStatus"], "failed"),
      strict["equal"](v40["asyncTaskRecovering"], false),
      strict["equal"](v40["videos"]?.[0]?.["error"], "异步视频恢复失败"),
      strict["equal"](v40["mainVideoIndex"], 0),
      strict["equal"](v40["videoUrl"], "/output/previous.mp4"),
      strict["equal"](v40["thumbUrl"], "/output/previous.jpg"),
      strict["match"](v40["outputText"], /恢复失败: 异步视频恢复失败/),
      resetStore());
  }),
  test("VideoKeyingController: 按结果节点取消只影响当前抠像任务", async () => {
    installDomStubs();
    const v41 = (await import("../modules/VideoKeyingController.js"))[
        "default"
      ],
      v42 = createFrameInterpolationNode({
        id: "source-video-a",
        model: "runninghub/video_matting",
      }),
      v43 = createFrameInterpolationNode({
        id: "source-video-b",
        model: "runninghub/video_matting",
      }),
      v44 = createFrameInterpolationNode({
        id: "source-video-matting-a",
        model: "runninghub/video_matting",
        rhTaskStatus: "running",
        outputText: "模型: RH视频抠像\n状态: 处理中",
      }),
      v45 = createFrameInterpolationNode({
        id: "source-video-matting-b",
        model: "runninghub/video_matting",
        rhTaskStatus: "running",
        outputText: "模型: RH视频抠像\n状态: 处理中",
      });
    (resetStore({
      [v42["id"]]: v42,
      [v43["id"]]: v43,
      [v44["id"]]: v44,
      [v45["id"]]: v45,
    }),
      v41["_rhTasks"]["clear"](),
      v41["_rhTasks"]["set"](v42["id"], {
        id: "ctx-a",
        running: true,
        sourceNodeId: v42["id"],
        outId: v44["id"],
        mode: "keying",
        abort: { abort() {} },
      }),
      v41["_rhTasks"]["set"](v43["id"], {
        id: "ctx-b",
        running: true,
        sourceNodeId: v43["id"],
        outId: v45["id"],
        mode: "keying",
        abort: { abort() {} },
      }));
    const v46 = await v41["cancelRunningKeyingTaskForNode"](v44["id"]);
    (strict["equal"](v46, true),
      strict["equal"](v41["_rhTasks"]["has"](v42["id"]), false),
      strict["equal"](v41["_rhTasks"]["has"](v43["id"]), true),
      strict["equal"](
        appStore["getState"]()["nodes"][v44["id"]]["rhTaskStatus"],
        "cancelled",
      ),
      strict["equal"](
        appStore["getState"]()["nodes"][v45["id"]]["rhTaskStatus"],
        "running",
      ),
      v41["_rhTasks"]["clear"](),
      resetStore());
  }),
  test("videoToolbar: 结果节点抠像按钮在任务中显示并触发取消", async () => {
    installDomStubs();
    const v47 = (await import("../modules/VideoKeyingController.js"))[
        "default"
      ],
      { bindVideoToolbarEvents: v48 } =
        await import("./nodeToolbar/videoToolbar.js"),
      v49 = "source-video-keying-source",
      v50 = "source-video-keying-output";
    (resetStore({
      [v49]: createFrameInterpolationNode({
        id: v49,
        model: "runninghub/video_matting",
      }),
      [v50]: createFrameInterpolationNode({
        id: v50,
        model: "runninghub/video_matting",
        rhTaskStatus: "running",
        outputText: "模型: RH视频抠像\n状态: 处理中",
      }),
    }),
      v47["_rhTasks"]["clear"](),
      v47["_rhTasks"]["set"](v49, {
        id: "ctx-keying",
        running: true,
        sourceNodeId: v49,
        outId: v50,
        mode: "keying",
        abort: { abort() {} },
      }));
    const v51 = createFakeButton(),
      v52 = createFakeToolbar(v51);
    (v48(v52, { id: v50, type: "source-video" }),
      strict["equal"](v51["classList"]["contains"]("is-task-cancel"), true),
      strict["match"](v51["innerHTML"], /v2-task-cancel-spin/),
      strict["equal"](v51["dataset"]["tooltip"], "取消抠像任务"),
      v51["dispatchClick"](),
      await new Promise((v53) => setTimeout(v53, 0)),
      strict["equal"](v47["_rhTasks"]["has"](v49), false),
      strict["equal"](v51["classList"]["contains"]("is-task-cancel"), false),
      strict["match"](v51["innerHTML"], /data-original-keying/),
      strict["equal"](
        appStore["getState"]()["nodes"][v50]["rhTaskStatus"],
        "cancelled",
      ),
      v47["_rhTasks"]["clear"](),
      resetStore());
  }),
  test("videoToolbar: 只靠 Store 中的抠像结果节点也显示取消态", async () => {
    installDomStubs();
    const v54 = (await import("../modules/VideoKeyingController.js"))[
        "default"
      ],
      { bindVideoToolbarEvents: v55 } =
        await import("./nodeToolbar/videoToolbar.js"),
      v56 = "source-video-store-keying-source",
      v57 = "source-video-store-keying-output";
    (resetStore({
      [v56]: createFrameInterpolationNode({
        id: v56,
        model: "runninghub/video_matting",
      }),
      [v57]: createFrameInterpolationNode({
        id: v57,
        model: "runninghub/video_matting",
        rhSourceNodeId: v56,
        rhTaskId: "rh-keying-store-task",
        rhTaskStatus: "running",
        isGenerating: true,
        outputText: "模型:\x20RH视频抠像\x0a状态:\x20处理中",
      }),
    }),
      v54["_rhTasks"]["clear"]());
    const v58 = createFakeButton(),
      v59 = createFakeToolbar(v58);
    (v55(v59, { id: v57, type: "source-video" }),
      strict["equal"](v58["classList"]["contains"]("is-task-cancel"), true),
      strict["match"](v58["innerHTML"], /v2-task-cancel-spin/),
      strict["equal"](v58["dataset"]["tooltip"], "取消抠像任务"),
      v58["_cleanupKeyingButtonState"]?.(),
      resetStore());
  }),
  test("videoToolbar: 抠像终态会压过 stale isGenerating", async () => {
    installDomStubs();
    const v60 = (await import("../modules/VideoKeyingController.js"))[
        "default"
      ],
      { bindVideoToolbarEvents: v61 } =
        await import("./nodeToolbar/videoToolbar.js"),
      v62 = "source-video-terminal-keying-source",
      v63 = "source-video-terminal-keying-output";
    (resetStore({
      [v62]: createFrameInterpolationNode({
        id: v62,
        model: "runninghub/video_matting",
      }),
      [v63]: createFrameInterpolationNode({
        id: v63,
        model: "runninghub/video_matting",
        rhSourceNodeId: v62,
        rhTaskId: "rh-keying-terminal-task",
        rhTaskStatus: "success",
        isGenerating: true,
        jobStatus: "running",
        outputText: "模型:\x20RH视频抠像\x0a状态:\x20完成",
      }),
    }),
      v60["_rhTasks"]["clear"]());
    const v64 = createFakeButton(),
      v65 = createFakeToolbar(v64);
    (v61(v65, { id: v63, type: "source-video" }),
      strict["equal"](v64["classList"]["contains"]("is-task-cancel"), false),
      strict["equal"](v64["dataset"]["tooltip"], "抠像"),
      v64["_cleanupKeyingButtonState"]?.(),
      resetStore());
  }),
  test("SourceVideoNode: 无本地路径时使用 capturePreviewUrl", async () => {
    installDomStubs();
    const { SourceVideoNode: v66 } = await import("./SourceVideoNode.js"),
      v67 = Object["create"](v66["prototype"]);
    (Object["assign"](v67, {
      _data: {
        id: "source-video-preview",
        type: "source-video",
        capturePreviewUrl: "blob:pending-video-preview",
      },
    }),
      strict["equal"](
        v67["_resolveVideoSrc"](v67["_data"]),
        "blob:pending-video-preview",
      ));
  }),
  test("SourceVideoNode: accepts electron local capture preview URL", async () => {
    installDomStubs();
    const { SourceVideoNode: v68 } = await import("./SourceVideoNode.js"),
      v69 = Object["create"](v68["prototype"]);
    (Object["assign"](v69, {
      _data: {
        id: "source-video-electron-preview",
        type: "source-video",
        capturePreviewUrl: "aic-local-preview://preview/token/clip.mp4",
      },
    }),
      strict["equal"](
        v69["_resolveVideoSrc"](v69["_data"]),
        "aic-local-preview://preview/token/clip.mp4",
      ));
  }),
  test("SourceVideoNode: resolves poster from local poster path", async () => {
    installDomStubs();
    const { resolveSourceVideoPosterSrc: v70 } =
      await import("./SourceVideoNode.js");
    (strict["equal"](
      v70({ posterLocalPath: "output/VideoThumbs/source-poster.jpg" }),
      "/output/VideoThumbs/source-poster.jpg",
    ),
      strict["equal"](
        v70({ posterLocalPath: "C:/Users/example/source-poster.jpg" }),
        "",
      ));
  }),
  test("SourceVideoNode: poster-backed video defers media load until needed", async () => {
    installDomStubs();
    const { SourceVideoNode: v71 } = await import("./SourceVideoNode.js"),
      v72 = createFakeVideoElement(),
      v73 = createFakeImageElement();
    v72["duration"] = 7;
    const v74 = Object["create"](v71["prototype"]);
    (Object["assign"](v74, {
      id: "source-video-lazy-poster",
      _data: {
        id: "source-video-lazy-poster",
        type: "source-video",
        src: "/output/source.mp4",
        thumbUrl: "/output/source-thumb.jpg",
      },
      _video: v72,
      _posterFrame: v73,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: "" } },
      _muteBtn: { style: { display: "" } },
      _centerIndicator: { style: { display: "" } },
      _indicatorInner: null,
      _hint: { style: { display: "" } },
      _timeTotal: { textContent: "" },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: "",
      _lastPosterSrc: "",
    }),
      v74["_loadVideo"]("/output/source.mp4"),
      strict["equal"](v74["_currentSrc"], "/output/source.mp4"),
      strict["equal"](v72["poster"], "/output/source-thumb.jpg"),
      strict["equal"](v73["src"], "/output/source-thumb.jpg"),
      strict["equal"](v73["classList"]["contains"]("is-visible"), true),
      strict["equal"](v72["preload"], "none"),
      strict["equal"](v72["src"], ""),
      strict["equal"](v72["currentSrc"], ""),
      strict["equal"](v72["loadCalls"], 0),
      strict["equal"](v74["_timeTotal"]["textContent"], "0:07"),
      strict["equal"](v74["_controls"]["style"]["opacity"], "1"),
      strict["equal"](v74["_muteBtn"]["style"]["display"], "flex"));
    const v75 = v72["loadCalls"];
    (strict["equal"](await v74["_ensurePlaybackVideoSrc"](), true),
      strict["equal"](v72["preload"], "metadata"),
      strict["equal"](v72["src"], "/output/source.mp4"),
      strict["equal"](v72["loadCalls"], v75 + 1),
      strict["equal"](
        await v74["_ensurePlaybackVideoSrc"]({ forPlayback: true }),
        true,
      ),
      strict["equal"](v72["preload"], "auto"),
      strict["equal"](v72["src"], "/output/source.mp4"),
      strict["equal"](v72["loadCalls"], v75 + 1));
  }),
  test("SourceVideoNode: no-poster video handles immediate loadeddata during load", async () => {
    installDomStubs();
    const { SourceVideoNode: v76 } = await import("./SourceVideoNode.js"),
      v77 = createFakeVideoElement(),
      v78 = v77["load"]["bind"](v77);
    ((v77["readyState"] = 0),
      (v77["load"] = function v79() {
        (v78(), (this["readyState"] = 2), this["onloadeddata"]?.());
      }));
    let v80 = 0,
      v81 = false;
    const v82 = Object["create"](v76["prototype"]);
    (Object["assign"](v82, {
      id: "source-video-cut-load",
      _data: {
        id: "source-video-cut-load",
        type: "source-video",
        src: "/output/CutVideo/cut.mp4",
      },
      _video: v77,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: "" } },
      _muteBtn: { style: { display: "" } },
      _centerIndicator: { style: { display: "" } },
      _indicatorInner: null,
      _hint: { style: { display: "" } },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: "",
      _lastPosterSrc: "",
      _attachPlaybackRecovery() {},
      _clearMediaUnavailableAfterPlayback() {},
      _maybeEnsureVideoThumb() {
        v80 += 1;
      },
      _showPausedCenterIndicator() {
        v81 = true;
      },
    }),
      v82["_loadVideo"]("/output/CutVideo/cut.mp4"),
      strict["equal"](v77["preload"], "auto"),
      strict["equal"](v77["src"], "/output/CutVideo/cut.mp4"),
      strict["equal"](v82["_controls"]["style"]["opacity"], "1"),
      strict["equal"](v82["_muteBtn"]["style"]["display"], "flex"),
      strict["equal"](v82["_centerIndicator"]["style"]["display"], "flex"),
      strict["equal"](v81, true),
      strict["equal"](v80, 1));
  }),
  test("SourceVideoNode: switching to final poster source releases capture preview", async () => {
    installDomStubs();
    const v83 = globalThis["window"]["URL"],
      v84 = [];
    globalThis["window"]["URL"] = {
      revokeObjectURL(v85) {
        v84["push"](v85);
      },
    };
    const { SourceVideoNode: v86 } = await import("./SourceVideoNode.js"),
      v87 = createFakeVideoElement(),
      v88 = Object["create"](v86["prototype"]);
    Object["assign"](v88, {
      id: "source-video-release-preview",
      _data: {
        id: "source-video-release-preview",
        type: "source-video",
        src: "/output/source.mp4",
        thumbUrl: "/output/source-thumb.jpg",
        capturePreviewUrl: "blob:pending-video-preview",
      },
      _video: v87,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: "" } },
      _muteBtn: { style: { display: "" } },
      _centerIndicator: { style: { display: "" } },
      _indicatorInner: null,
      _hint: { style: { display: "" } },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: "blob:pending-video-preview",
      _lastPosterSrc: "",
    });
    try {
      (v88["_loadVideo"]("/output/source.mp4"),
        strict["deepEqual"](v84, ["blob:pending-video-preview"]),
        strict["equal"](v88["_activeCapturePreviewUrl"], ""),
        strict["equal"](v87["poster"], "/output/source-thumb.jpg"));
    } finally {
      globalThis["window"]["URL"] = v83;
    }
  }),
  test("SourceVideoNode: 正式视频路径优先于 capturePreviewUrl", async () => {
    installDomStubs();
    const { SourceVideoNode: v89 } = await import("./SourceVideoNode.js"),
      v90 = Object["create"](v89["prototype"]);
    (Object["assign"](v90, {
      _data: {
        id: "source-video-final",
        type: "source-video",
        localPath: "output/final.mp4",
        capturePreviewUrl: "blob:pending-video-preview",
      },
    }),
      strict["equal"](
        v90["_resolveVideoSrc"](v90["_data"]),
        "/output/final.mp4",
      ));
  }),
  test("SourceVideoNode: loaded playback clears stale media unavailable marker", async () => {
    installDomStubs();
    const { SourceVideoNode: v91 } = await import("./SourceVideoNode.js"),
      v92 = {
        id: "source-video-keyed-loaded",
        type: "source-video",
        localPath: "output/keyed.mp4",
        videoUrl: "/output/keyed.mp4",
        mediaUnavailable: true,
        mediaUnavailableSource: "output/keyed.mp4",
      };
    resetStore({ [v92["id"]]: v92 });
    const v93 = Object["create"](v91["prototype"]);
    (Object["assign"](v93, { id: v92["id"], _data: v92 }),
      v93["_clearMediaUnavailableAfterPlayback"]("/output/keyed.mp4"));
    const v94 = appStore["getState"]()["nodes"][v92["id"]];
    (strict["equal"](v94["mediaUnavailable"], false),
      strict["equal"](v94["mediaUnavailableSource"], ""));
  }),
  test("SourceVideoNode: Alt 播放按钮进入手动循环，停止时退出循环", async () => {
    installDomStubs();
    const { SourceVideoNode: v95 } = await import("./SourceVideoNode.js"),
      v96 = [],
      v97 = {
        paused: true,
        loop: false,
        currentTime: 0,
        duration: 12,
        pause() {
          this["paused"] = true;
        },
      },
      v98 = Object["create"](v95["prototype"]);
    (Object["assign"](v98, {
      id: "source-video-loop-playback",
      _data: { id: "source-video-loop-playback", type: "source-video" },
      _video: v97,
      _currentSrc: "/output/source-loop.mp4",
      _isManualControl: false,
      _hoverManualPause: false,
      _isManualLoopPlayback: false,
      _autoPlayToken: 0,
      _flashCenterIndicator(v99) {
        v96["push"](v99);
      },
      _playVideoWithRecovery: async () => {
        return ((v97["paused"] = false), true);
      },
    }),
      v98["_toggleManualPlayback"]({ loop: true }),
      await Promise["resolve"](),
      strict["equal"](v98["_isManualLoopPlayback"], true),
      strict["equal"](v98["_isManualControl"], true),
      strict["equal"](v97["loop"], true),
      strict["deepEqual"](v96, ["play"]),
      (v96["length"] = 0),
      v98["_toggleManualPlayback"](),
      strict["equal"](v98["_isManualLoopPlayback"], false),
      strict["equal"](v97["loop"], false),
      strict["equal"](v97["paused"], true),
      strict["equal"](v98["_hoverManualPause"], true),
      strict["deepEqual"](v96, ["pause"]));
  }),
  test("SourceVideoNode: manual click keeps fresh hover playback instead of pausing", async () => {
    installDomStubs();
    const { SourceVideoNode: v100 } = await import("./SourceVideoNode.js"),
      v101 = {
        paused: false,
        loop: false,
        currentTime: 0,
        duration: 12,
        pause() {
          this["paused"] = true;
        },
      };
    let v102 = 0;
    const v103 = Object["create"](v100["prototype"]);
    (Object["assign"](v103, {
      id: "source-video-hover-click",
      _data: { id: "source-video-hover-click", type: "source-video" },
      _video: v101,
      _currentSrc: "/output/source-hover.mp4",
      _isHovered: true,
      _isManualControl: false,
      _hoverManualPause: false,
      _isManualLoopPlayback: false,
      _autoPlayToken: 0,
      _flashCenterIndicator() {},
      _playVideoWithRecovery: async () => {
        return ((v102 += 1), (v101["paused"] = false), true);
      },
    }),
      strict["equal"](v103["_shouldKeepHoverPlaybackOnManualClick"](), true),
      v103["_toggleManualPlayback"]({ forcePlay: true }),
      await Promise["resolve"](),
      strict["equal"](v101["paused"], false),
      strict["equal"](v103["_hoverManualPause"], false),
      strict["equal"](v103["_isManualControl"], true),
      strict["equal"](v102, 1));
  }),
  test("SourceVideoNode: upload size patch preserves landscape ratio", async () => {
    installDomStubs();
    const { buildSourceVideoUploadSizePatch: v104 } =
      await import("./SourceVideoNode.js");
    strict["deepEqual"](v104({ width: 1920, height: 1080 }), {
      width: 512,
      height: 288,
      videoWidth: 1920,
      videoHeight: 1080,
      needsAutoResize: false,
    });
  }),
  test("SourceVideoNode: upload size patch preserves portrait ratio", async () => {
    installDomStubs();
    const { buildSourceVideoUploadSizePatch: v105 } =
      await import("./SourceVideoNode.js");
    strict["deepEqual"](v105({ width: 1080, height: 1920 }), {
      width: 288,
      height: 512,
      videoWidth: 1080,
      videoHeight: 1920,
      needsAutoResize: false,
    });
  }),
  test("SourceVideoNode: upload size patch waits for auto resize when metadata is missing", async () => {
    installDomStubs();
    const { buildSourceVideoUploadSizePatch: v106 } =
      await import("./SourceVideoNode.js");
    strict["deepEqual"](v106({ width: 0, height: 0 }), {
      needsAutoResize: true,
    });
  }),
  test("SourceVideoNode: running RH task ignores inactive Dreamina done fields", async () => {
    installDomStubs();
    typeof globalThis["document"]["createElement"] !== "function" &&
      (globalThis["document"]["createElement"] = () => ({
        className: "",
        appendChild() {},
        remove() {},
      }));
    const { SourceVideoNode: v107 } = await import("./SourceVideoNode.js");
    let v108 = 0;
    const v109 = [],
      v110 = Object["create"](v107["prototype"]);
    (Object["assign"](v110, {
      id: "source-video-rh-running",
      _data: { id: "source-video-rh-running", type: "source-video" },
      _video: {},
      _card: {
        classList: {
          add(...v111) {
            v109["push"](...v111);
          },
          remove() {},
        },
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return ((v108 += 1), []);
        },
        appendChild() {},
      },
      _hint: { style: { display: "" } },
      _uploadBtn: { disabled: false },
      _syncRunningHubVideoTaskState: () => false,
      _resolveVideoSrc: () => "",
      _loadVideo: () => {},
      _maybeFetchVideoMeta: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      v110["update"]({
        id: "source-video-rh-running",
        type: "source-video",
        provider: "runninghubwf",
        model: "runninghub/2047784060881211393",
        isGenerating: true,
        jobStatus: "running",
        rhTaskStatus: "pending",
        dreaminaTaskStatus: "idle",
        dreaminaTaskPhase: "done",
        asyncTaskStatus: "idle",
      }),
      await new Promise((v112) => setTimeout(v112, 60)),
      strict["equal"](v108, 0),
      strict["equal"](v110["_uploadBtn"]["disabled"], true),
      strict["ok"](v109["includes"]("img-preview-loading")));
  }),
  test("SourceVideoNode: resolved source video clears stale running timer", async () => {
    installDomStubs();
    const { SourceVideoNode: v113 } = await import("./SourceVideoNode.js"),
      v114 = "source-video-stale-timer",
      v115 = {
        id: v114,
        type: "source-video",
        src: "/output/source.mp4",
        isGenerating: true,
        jobStatus: "running",
        generationStartTime: 123,
        generationDuration: null,
      };
    resetStore({ [v114]: v115 });
    const v116 = Object["create"](v113["prototype"]);
    (Object["assign"](v116, {
      id: v114,
      _data: v115,
      _video: { paused: true },
      _card: createFakeLoadingCard(),
      _hint: { style: { display: "" } },
      _uploadBtn: { disabled: true },
      _lastPosterSrc: "",
      _currentSrc: "/output/source.mp4",
      _syncRunningHubVideoTaskState: () => false,
      _resolveVideoSrc: () => "/output/source.mp4",
      _loadVideo: () => {},
      _maybeFetchVideoMeta: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      v116["update"](v115));
    const v117 = appStore["getState"]()["nodes"][v114];
    (strict["equal"](v117["generationStartTime"], null),
      strict["equal"](
        Number["isFinite"](Number(v117["generationDuration"])),
        true,
      ),
      strict["equal"](v117["isGenerating"], false),
      resetStore());
  }),
  test("SourceVideoNode: active video task with existing result keeps running timer", async () => {
    installDomStubs();
    const { SourceVideoNode: v118 } = await import("./SourceVideoNode.js"),
      v119 = "source-video-active-task-timer",
      v120 = {
        id: v119,
        type: "source-video",
        videoUrl: "/output/previous.mp4",
        asyncTaskId: "async-video-task",
        asyncTaskStatus: "running",
        asyncTaskProvider: "apimart",
        asyncTaskKind: "video",
        isGenerating: true,
        jobStatus: "running",
        generationStartTime: 123,
        generationDuration: null,
      };
    resetStore({ [v119]: v120 });
    const v121 = Object["create"](v118["prototype"]);
    (Object["assign"](v121, {
      id: v119,
      _data: v120,
      _video: { paused: true },
      _card: createFakeLoadingCard(),
      _hint: { style: { display: "" } },
      _uploadBtn: { disabled: true },
      _lastPosterSrc: "",
      _currentSrc: "/output/previous.mp4",
      _syncRunningHubVideoTaskState: () => false,
      _resolveVideoSrc: () => "/output/previous.mp4",
      _loadVideo: () => {},
      _maybeFetchVideoMeta: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      v121["update"](v120));
    const v122 = appStore["getState"]()["nodes"][v119];
    (strict["equal"](v122["generationStartTime"], 123),
      strict["equal"](v122["generationDuration"], null),
      strict["equal"](v122["isGenerating"], true),
      resetStore());
  }),
  test("SourceVideoNode:\x20terminal\x20failure\x20stops\x20loading\x20over\x20stale\x20generating\x20flag", async () => {
    installDomStubs();
    const { SourceVideoNode: v123 } = await import("./SourceVideoNode.js");
    let v124 = 0;
    const v125 = Object["create"](v123["prototype"]);
    (Object["assign"](v125, {
      id: "source-video-stale-failed",
      _data: { id: "source-video-stale-failed", type: "source-video" },
      _video: {},
      _card: {
        classList: { add() {}, remove() {} },
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return ((v124 += 1), []);
        },
      },
      _hint: { style: { display: "" } },
      _uploadBtn: { disabled: true },
      _syncRunningHubVideoTaskState: () => false,
      _resolveVideoSrc: () => "",
      _loadVideo: () => {},
      _maybeFetchVideoMeta: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      v125["update"]({
        id: "source-video-stale-failed",
        type: "source-video",
        provider: "runninghubwf",
        model: "runninghub/2047784060881211393",
        isGenerating: true,
        jobStatus: "running",
        rhTaskStatus: "failed",
      }),
      strict["equal"](v124, 1),
      strict["equal"](v125["_uploadBtn"]["disabled"], false));
  }),
  test("SourceVideoNode: 旧失败补帧节点 update 时纠正处理中标题", async () => {
    installDomStubs();
    const { SourceVideoNode: v126 } = await import("./SourceVideoNode.js"),
      v127 = createFrameInterpolationNode({
        rhTaskStatus: "failed",
        name: "补帧视频\x20(处理中)",
        isGenerating: true,
        jobStatus: "running",
        rhTaskRecovering: true,
      });
    resetStore({ [v127["id"]]: v127 });
    const v128 = Object["create"](v126["prototype"]);
    (Object["assign"](v128, { id: v127["id"], _data: v127, _video: null }),
      v128["update"](v127));
    const v129 = appStore["getState"]()["nodes"][v127["id"]];
    (strict["equal"](v129["name"], "补帧视频 (失败)"),
      strict["equal"](v129["jobStatus"], "error"),
      strict["equal"](v129["isGenerating"], false),
      strict["equal"](v129["rhTaskStatus"], "failed"),
      strict["equal"](v129["rhTaskRecovering"], false),
      resetStore());
  }),
  test("SourceVideoNode:\x20RunningHub\x20高清失败时使用高清失败标题", async () => {
    installDomStubs();
    const { SourceVideoNode: v130 } = await import("./SourceVideoNode.js"),
      v131 = createFrameInterpolationNode({
        id: "source-video-hd-rh",
        rhTaskStatus: "failed",
        name: "高清视频 (处理中)",
        isGenerating: true,
        jobStatus: "running",
        rhTaskRecovering: true,
      });
    resetStore({ [v131["id"]]: v131 });
    const v132 = Object["create"](v130["prototype"]);
    (Object["assign"](v132, { id: v131["id"], _data: v131, _video: null }),
      v132["update"](v131));
    const v133 = appStore["getState"]()["nodes"][v131["id"]];
    (strict["equal"](v133["name"], "高清视频 (失败)"),
      strict["equal"](v133["jobStatus"], "error"),
      strict["equal"](v133["isGenerating"], false),
      strict["equal"](v133["rhTaskStatus"], "failed"),
      strict["equal"](v133["rhTaskRecovering"], false),
      resetStore());
  }),
  test("SourceVideoNode:\x20RunningHub\x20成功终态会清掉处理中标题", async () => {
    installDomStubs();
    const { SourceVideoNode: v134 } = await import("./SourceVideoNode.js"),
      v135 = createFrameInterpolationNode({
        rhTaskStatus: "success",
        name: "补帧视频 (处理中)",
        isGenerating: true,
        jobStatus: "running",
        rhTaskRecovering: true,
      });
    resetStore({ [v135["id"]]: v135 });
    const v136 = Object["create"](v134["prototype"]);
    (Object["assign"](v136, { id: v135["id"], _data: v135, _video: null }),
      v136["update"](v135));
    const v137 = appStore["getState"]()["nodes"][v135["id"]];
    (strict["equal"](v137["name"], "补帧视频"),
      strict["equal"](v137["jobStatus"], "success"),
      strict["equal"](v137["isGenerating"], false),
      strict["equal"](v137["rhTaskStatus"], "success"),
      strict["equal"](v137["rhTaskRecovering"], false),
      resetStore());
  }),
  test("SourceVideoNode: RunningHub 取消终态会修正补帧取消标题", async () => {
    installDomStubs();
    const { SourceVideoNode: v138 } = await import("./SourceVideoNode.js"),
      v139 = createFrameInterpolationNode({
        rhTaskStatus: "cancelled",
        name: "补帧视频\x20(处理中)",
        isGenerating: true,
        jobStatus: "running",
        rhTaskRecovering: true,
      });
    resetStore({ [v139["id"]]: v139 });
    const v140 = Object["create"](v138["prototype"]);
    (Object["assign"](v140, { id: v139["id"], _data: v139, _video: null }),
      v140["update"](v139));
    const v141 = appStore["getState"]()["nodes"][v139["id"]];
    (strict["equal"](v141["name"], "补帧视频\x20(已取消)"),
      strict["equal"](v141["jobStatus"], null),
      strict["equal"](v141["isGenerating"], false),
      strict["equal"](v141["rhTaskStatus"], "cancelled"),
      strict["equal"](v141["rhTaskRecovering"], false),
      resetStore());
  }),
  test("SourceVideoNode:\x20RunningHub\x20视频擦除失败终态会修正生成中标题", async () => {
    installDomStubs();
    const { SourceVideoNode: v142 } = await import("./SourceVideoNode.js"),
      v143 = createFrameInterpolationNode({
        id: "source-video-erase-rh",
        model: "runninghub/video_matting",
        rhTaskStatus: "failed",
        name: "视频擦除生成中...",
        outputText: "模型:\x20RH视频擦除\x0a状态:\x20处理中",
        isGenerating: true,
        jobStatus: "running",
        rhTaskRecovering: true,
      });
    resetStore({ [v143["id"]]: v143 });
    const v144 = Object["create"](v142["prototype"]);
    (Object["assign"](v144, { id: v143["id"], _data: v143, _video: null }),
      v144["update"](v143));
    const v145 = appStore["getState"]()["nodes"][v143["id"]];
    (strict["equal"](v145["name"], "视频擦除失败"),
      strict["equal"](v145["jobStatus"], "error"),
      strict["equal"](v145["isGenerating"], false),
      strict["equal"](v145["rhTaskStatus"], "failed"),
      strict["equal"](v145["rhTaskRecovering"], false),
      resetStore());
  }),
  test("SourceVideoNode:\x20RunningHub\x20终态不会覆盖用户自定义标题", async () => {
    installDomStubs();
    const { SourceVideoNode: v146 } = await import("./SourceVideoNode.js"),
      v147 = createFrameInterpolationNode({
        rhTaskStatus: "failed",
        name: "我的自定义补帧版本",
        isGenerating: true,
        jobStatus: "running",
        rhTaskRecovering: true,
      });
    resetStore({ [v147["id"]]: v147 });
    const v148 = Object["create"](v146["prototype"]);
    (Object["assign"](v148, { id: v147["id"], _data: v147, _video: null }),
      v148["update"](v147));
    const v149 = appStore["getState"]()["nodes"][v147["id"]];
    (strict["equal"](v149["name"], "我的自定义补帧版本"),
      strict["equal"](v149["jobStatus"], "error"),
      strict["equal"](v149["isGenerating"], false),
      strict["equal"](v149["rhTaskStatus"], "failed"),
      resetStore());
  }));
