import test from "node:test";
import strict from "node:assert/strict";
import {
  createFakePreviewContainer,
  installPreviewDomStubs,
} from "../../tests/testPreviewDom.js";
const restoreDom = installPreviewDomStubs();
((globalThis["window"]["addEventListener"] ||= () => {}),
  (globalThis["window"]["removeEventListener"] ||= () => {}));
const { default: store } = await import("../core/stores/appStore.js"),
  { AIGenVideoNode } = await import("./AIGenVideoNode.js");
(test["afterEach"](() => {
  store["loadState"]({
    nodes: {},
    edges: {},
    viewport: { x: 0, y: 0, zoom: 1 },
  });
}),
  test["after"](() => {
    restoreDom();
  }));
function createButtonStub() {
  const v0 = new Set();
  return {
    disabled: false,
    title: "",
    innerHTML: "",
    style: {},
    dataset: {},
    classList: {
      add(...v1) {
        v1["forEach"]((v2) => v0["add"](String(v2 || "")));
      },
      remove(...v3) {
        v3["forEach"]((v4) => v0["delete"](String(v4 || "")));
      },
      toggle(v5, v6) {
        const v7 = String(v5 || "");
        if (v6 === true) return (v0["add"](v7), true);
        if (v6 === false) return (v0["delete"](v7), false);
        if (v0["has"](v7)) return (v0["delete"](v7), false);
        return (v0["add"](v7), true);
      },
      contains(v8) {
        return v0["has"](String(v8 || ""));
      },
    },
    setAttribute(v9, v10) {
      this["dataset"][String(v9 || "")] = String(v10 || "");
    },
    removeAttribute(v11) {
      delete this["dataset"][String(v11 || "")];
    },
  };
}
function createElementStub() {
  return { ...createButtonStub(), querySelectorAll: () => [] };
}
(test("AIGenVideoNode: running RH state keeps preview loading over previous result", async () => {
  const v12 = "node-video-rh-existing-result-loading",
    v13 = {
      id: v12,
      type: "ai-video",
      model: "runninghub/2041741496667348994",
      provider: "runninghubwf",
      videos: [{ videoUrl: "/output/previous.mp4" }],
      videoUrl: "/output/previous.mp4",
      isGenerating: true,
      jobStatus: "running",
      rhTaskId: "rh-running",
      rhTaskStatus: "pending",
      dreaminaTaskStatus: "idle",
      dreaminaTaskPhase: "done",
      asyncTaskStatus: "idle",
    };
  store["loadState"]({
    nodes: { [v12]: v13 },
    edges: {},
    viewport: { x: 0, y: 0, zoom: 1 },
  });
  const v14 = new AIGenVideoNode(v13);
  ((v14["previewEl"] = createFakePreviewContainer()),
    (v14["promptEl"] = {
      ...createElementStub(),
      innerHTML: "",
      innerText: "",
    }),
    (v14["btnEl"] = createButtonStub()),
    (v14["footerEl"] = null),
    (v14["_placeholderEl"] = { style: {}, querySelector: () => null }),
    (v14["_root"] = { querySelectorAll: () => [] }),
    (v14["_normalizeDreaminaNodeData"] = (v15) => v15),
    (v14["_isRunninghubWorkflowModel"] = () => true),
    (v14["_loadAndDisplayVideo"] = () => {}),
    (v14["_maybeResumeDreaminaTaskImpl"] = () => {}),
    (v14["_maybeResumeRunningHubTaskImpl"] = () => {}),
    (v14["_maybeResumeAsyncTaskImpl"] = () => {}),
    (v14["_syncPromptBoxSizeFromData"] = () => {}),
    (v14["_syncGenerationNodeHelpTip"] = () => {}),
    (v14["_renderRefBar"] = () => {}),
    (v14["_syncBtnIconState"] = () => {}),
    (v14["_setVideoOverlaysVisible"] = () => {}),
    v14["update"](v13),
    await new Promise((v16) => setTimeout(v16, 70)),
    strict["equal"](
      v14["previewEl"]["classList"]["contains"]("img-preview-loading"),
      true,
    ),
    strict["equal"](
      !!v14["previewEl"]["querySelector"](".img-loading-overlay"),
      true,
    ),
    strict["equal"](
      v14["btnEl"]["classList"]["contains"]("is-task-cancel"),
      true,
    ),
    strict["match"](v14["btnEl"]["innerHTML"], /v2-task-cancel-spin/));
  const v17 = {
    ...v13,
    isGenerating: true,
    jobStatus: "error",
    rhTaskStatus: "failed",
  };
  (store["loadState"]({
    nodes: { [v12]: v17 },
    edges: {},
    viewport: { x: 0, y: 0, zoom: 1 },
  }),
    v14["update"](v17),
    strict["equal"](
      v14["btnEl"]["classList"]["contains"]("is-task-cancel"),
      false,
    ),
    strict["doesNotMatch"](v14["btnEl"]["innerHTML"], /v2-task-cancel-spin/));
}),
  test("AIGenVideoNode: result videos clear inner no-result class", () => {
    const v18 = "node-video-result-clears-no-result",
      v19 = {
        id: v18,
        type: "ai-video",
        model: "apimart/seedance-test",
        provider: "apimart",
        videos: [],
      };
    store["loadState"]({
      nodes: { [v18]: v19 },
      edges: {},
      viewport: { x: 0, y: 0, zoom: 1 },
    });
    const v20 = new AIGenVideoNode(v19);
    ((v20["previewEl"] = createFakePreviewContainer()),
      (v20["promptEl"] = { innerHTML: "", innerText: "" }),
      (v20["btnEl"] = createButtonStub()),
      (v20["footerEl"] = null),
      (v20["_placeholderEl"] = { style: {}, querySelector: () => null }),
      (v20["_root"] = createElementStub()),
      v20["_root"]["classList"]["add"]("no-result"),
      (v20["_normalizeDreaminaNodeData"] = (v21) => v21),
      (v20["_isRunninghubWorkflowModel"] = () => false),
      (v20["_isDreaminaVideoNode"] = () => false),
      (v20["_getDreaminaEffectiveNodeData"] = (v22) => v22),
      (v20["_loadAndDisplayVideo"] = () => {}),
      (v20["_maybeResumeDreaminaTaskImpl"] = () => {}),
      (v20["_maybeResumeRunningHubTaskImpl"] = () => {}),
      (v20["_maybeResumeAsyncTaskImpl"] = () => {}),
      (v20["_syncPromptBoxSizeFromData"] = () => {}),
      (v20["_syncGenerationNodeHelpTip"] = () => {}),
      (v20["_renderRefBar"] = () => {}),
      (v20["_syncBtnIconState"] = () => {}),
      (v20["_setVideoOverlaysVisible"] = () => {}));
    const v23 = { ...v19, videos: [{ localPath: "output/final.mp4" }] };
    (store["loadState"]({
      nodes: { [v18]: v23 },
      edges: {},
      viewport: { x: 0, y: 0, zoom: 1 },
    }),
      v20["update"](v23),
      strict["equal"](
        v20["_root"]["classList"]["contains"]("no-result"),
        false,
      ));
  }),
  test("AIGenVideoNode: adaptive ratio reacts to input order changes", async () => {
    const v24 = "node-video-adaptive-order",
      v25 = {
        id: v24,
        type: "ai-video",
        model: "apimart/seedance-test",
        provider: "apimart",
        aspectRatio: "自适应",
      },
      v26 = { id: "edgeA", sourceId: "imageA", targetId: v24 },
      v27 = { id: "edgeB", sourceId: "imageB", targetId: v24 };
    store["loadState"]({
      nodes: {
        [v24]: v25,
        imageA: {
          id: "imageA",
          type: "source-image",
          width: 900,
          height: 1600,
        },
        imageB: {
          id: "imageB",
          type: "source-image",
          width: 1600,
          height: 900,
        },
      },
      edges: { edgeA: v26, edgeB: v27 },
      viewport: { x: 0, y: 0, zoom: 1 },
    });
    const v28 = new AIGenVideoNode(v25);
    ((v28["previewEl"] = createFakePreviewContainer()),
      (v28["promptEl"] = {
        ...createElementStub(),
        innerHTML: "",
        innerText: "",
      }),
      (v28["btnEl"] = createButtonStub()),
      (v28["footerEl"] = null),
      (v28["_placeholderEl"] = { style: {}, querySelector: () => null }),
      (v28["_root"] = { querySelectorAll: () => [] }),
      (v28["_normalizeDreaminaNodeData"] = (v29) => v29),
      (v28["_isRunninghubWorkflowModel"] = () => false),
      (v28["_isDreaminaVideoNode"] = () => false),
      (v28["_getDreaminaEffectiveNodeData"] = (v30) => v30),
      (v28["_loadAndDisplayVideo"] = () => {}),
      (v28["_maybeResumeDreaminaTaskImpl"] = () => {}),
      (v28["_maybeResumeRunningHubTaskImpl"] = () => {}),
      (v28["_maybeResumeAsyncTaskImpl"] = () => {}),
      (v28["_syncPromptBoxSizeFromData"] = () => {}),
      (v28["_syncGenerationNodeHelpTip"] = () => {}),
      (v28["_renderRefBar"] = () => {}),
      (v28["_syncBtnIconState"] = () => {}),
      (v28["_setVideoOverlaysVisible"] = () => {}));
    let v31 = 0;
    ((v28["_runAdaptiveRatio"] = () => {
      v31 += 1;
    }),
      v28["update"](v25),
      await new Promise((v32) => setTimeout(v32, 70)),
      strict["equal"](v31, 0),
      store["updateEdgesBatch"](["edgeA", "edgeB"], [v27, v26]),
      v28["update"](store["getState"]()["nodes"][v24]),
      await new Promise((v33) => setTimeout(v33, 70)),
      strict["equal"](v31, 1));
  }),
  test("AIGenVideoNode: skips preview reload when only non-preview data changes", () => {
    const v34 = "node-video-preview-sig",
      v35 = {
        id: v34,
        type: "ai-video",
        model: "apimart/seedance-test",
        provider: "apimart",
        prompt: "first prompt",
        videos: [
          {
            localPath: "output/final-a.mp4",
            videoWidth: 1280,
            videoHeight: 720,
          },
        ],
        _bizRev: 1,
      };
    store["loadState"]({
      nodes: { [v34]: v35 },
      edges: {},
      viewport: { x: 0, y: 0, zoom: 1 },
    });
    const v36 = new AIGenVideoNode(v35);
    ((v36["previewEl"] = createFakePreviewContainer()),
      (v36["promptEl"] = {
        ...createElementStub(),
        innerHTML: "",
        innerText: "",
      }),
      (v36["btnEl"] = createButtonStub()),
      (v36["footerEl"] = null),
      (v36["_placeholderEl"] = { style: {}, querySelector: () => null }),
      (v36["_root"] = createElementStub()),
      (v36["_normalizeDreaminaNodeData"] = (v37) => v37),
      (v36["_isRunninghubWorkflowModel"] = () => false),
      (v36["_isDreaminaVideoNode"] = () => false),
      (v36["_getDreaminaEffectiveNodeData"] = (v38) => v38),
      (v36["_maybeResumeDreaminaTaskImpl"] = () => {}),
      (v36["_maybeResumeRunningHubTaskImpl"] = () => {}),
      (v36["_maybeResumeAsyncTaskImpl"] = () => {}),
      (v36["_syncPromptBoxSizeFromData"] = () => {}),
      (v36["_syncGenerationNodeHelpTip"] = () => {}),
      (v36["_renderRefBar"] = () => {}),
      (v36["_syncBtnIconState"] = () => {}),
      (v36["_setVideoOverlaysVisible"] = () => {}),
      (v36["_syncWorkflowDefaults"] = () => {}),
      (v36["_enforceWorkflowAudioInputLimit"] = () => {}),
      (v36["_getCurrentWorkflow"] = () => ({ key: "default" })),
      (v36["_refreshWorkflowUi"] = () => {}),
      (v36["_syncPickConnectVisualState"] = () => {}),
      (v36["_updateSubmitButtonState"] = () => {}));
    let v39 = 0;
    ((v36["_loadAndDisplayVideo"] = () => {
      v39 += 1;
    }),
      v36["update"](v35),
      strict["equal"](v39, 1));
    const v40 = { ...v35, prompt: "second prompt", _bizRev: 2 };
    (store["loadState"]({
      nodes: { [v34]: v40 },
      edges: {},
      viewport: { x: 0, y: 0, zoom: 1 },
    }),
      v36["update"](v40),
      strict["equal"](v39, 1));
    const v41 = {
      ...v40,
      videos: [
        { localPath: "output/final-b.mp4", videoWidth: 1280, videoHeight: 720 },
      ],
      _bizRev: 3,
    };
    (store["loadState"]({
      nodes: { [v34]: v41 },
      edges: {},
      viewport: { x: 0, y: 0, zoom: 1 },
    }),
      v36["update"](v41),
      strict["equal"](v39, 2));
  }));
