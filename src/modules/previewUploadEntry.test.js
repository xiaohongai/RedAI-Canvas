import test from "node:test";
import strict from "node:assert/strict";
import {
  bindPreviewUploadEntry,
  handlePreviewUploadFile,
  resolvePreviewUploadTarget,
} from "./previewUploadEntry.js";
import { _resetPreviewRuntimeForTests, setPreviewMode } from "./previewMode.js";
import { IMAGE_TOOLBAR_HTML } from "../components/nodeToolbar/imageToolbarHtml.js";
import { VIDEO_TOOLBAR_HTML } from "../components/nodeToolbar/videoToolbarHtml.js";
import { AUDIO_TOOLBAR_HTML } from "../components/nodeToolbar/audioToolbar.js";
import { installPreviewDomStubs } from "../../tests/testPreviewDom.js";
const restoreDom = installPreviewDomStubs();
(test["afterEach"](() => {
  _resetPreviewRuntimeForTests();
}),
  test["after"](() => {
    (_resetPreviewRuntimeForTests(), restoreDom());
  }));
function createFile({
  name: name = "preview.png",
  type: type = "image/png",
} = {}) {
  return { name: name, type: type };
}
function createButtonStub() {
  return { dataset: {}, disabled: false, textContent: "上传" };
}
function createEventTargetStub() {
  const v0 = new Map();
  return {
    accept: "",
    value: "",
    files: [],
    clicked: false,
    addEventListener(v1, v2) {
      v0["set"](v1, v2);
    },
    removeEventListener(v3, v4) {
      if (v0["get"](v3) === v4) v0["delete"](v3);
    },
    click() {
      this["clicked"] = true;
    },
    async dispatch(v5) {
      await v0["get"](v5)?.();
    },
  };
}
function createStoreState({
  selectedNodeIds: selectedNodeIds = [],
  nodes: nodes = {},
} = {}) {
  return {
    getState: () => ({ selectedNodeIds: selectedNodeIds, nodes: nodes }),
  };
}
(test("previewUploadEntry:\x20会校验唯一选中的可上传节点", () => {
  (strict["equal"](
    resolvePreviewUploadTarget(createStoreState()["getState"]())["ok"],
    false,
  ),
    strict["equal"](
      resolvePreviewUploadTarget(
        createStoreState({ selectedNodeIds: ["a", "b"] })["getState"](),
      )["ok"],
      false,
    ),
    strict["equal"](
      resolvePreviewUploadTarget(
        createStoreState({
          selectedNodeIds: ["text-1"],
          nodes: { "text-1": { id: "text-1", type: "ai-text" } },
        })["getState"](),
      )["ok"],
      false,
    ));
}),
  test("previewUploadEntry: 图片、视频、音频按选中节点类型分发", async () => {
    const v6 = [],
      v7 = async (v8, v9) => {
        return (
          v6["push"](["upload", v8["name"], v9]),
          {
            url: "/data/uploads/" + v8["name"],
            localPath: "data/uploads/" + v8["name"],
          }
        );
      },
      v10 = {
        image: (v11) => v6["push"](["image", v11["nodeId"], v11["fileName"]]),
        video: (v12) => v6["push"](["video", v12["nodeId"], v12["fileName"]]),
        audio: (v13) => v6["push"](["audio", v13["nodeId"], v13["fileName"]]),
      },
      v14 = (v15, v16) => v6["push"](["toast", v15, v16]),
      v17 = [
        ["image", "ai-image", createFile({ name: "p.png", type: "image/png" })],
        [
          "image",
          "source-image",
          createFile({ name: "source-p.png", type: "image/png" }),
        ],
        ["video", "ai-video", createFile({ name: "v.mp4", type: "video/mp4" })],
        [
          "video",
          "source-video",
          createFile({ name: "source-v.mp4", type: "video/mp4" }),
        ],
        [
          "audio",
          "ai-audio",
          createFile({ name: "a.mp3", type: "audio/mpeg" }),
        ],
      ];
    for (const [v18, v19, v20] of v17) {
      v6["length"] = 0;
      const v21 = await handlePreviewUploadFile({
        file: v20,
        storeApi: createStoreState({
          selectedNodeIds: ["node-" + v18],
          nodes: { ["node-" + v18]: { id: "node-" + v18, type: v19 } },
        }),
        uploadFileImpl: v7,
        applyResults: v10,
        showToast: v14,
        getProjectId: () => "project-1",
      });
      (strict["equal"](v21, true),
        strict["deepEqual"](v6, [
          ["upload", v20["name"], "project-1"],
          [v18, "node-" + v18, v20["name"]],
          [
            "toast",
            "已将上传" +
              (v18 === "image" ? "图片" : v18 === "video" ? "视频" : "音频") +
              "写入当前节点",
            "success",
          ],
        ]));
    }
  }),
  test("previewUploadEntry:\x20文件类型错误与上传失败不会写入结果且按钮会恢复", async () => {
    const v22 = [],
      v23 = createButtonStub(),
      v24 = createStoreState({
        selectedNodeIds: ["node-image"],
        nodes: { "node-image": { id: "node-image", type: "ai-image" } },
      }),
      v25 = (v26, v27) => v22["push"]([v26, v27]),
      v28 = await handlePreviewUploadFile({
        file: createFile({ name: "bad.mp4", type: "video/mp4" }),
        button: v23,
        storeApi: v24,
        uploadFileImpl: async () => {
          throw new Error("不应上传");
        },
        applyResults: { image: () => v22["push"](["apply"]) },
        showToast: v25,
      });
    (strict["equal"](v28, false),
      strict["equal"](v23["disabled"], false),
      strict["deepEqual"](v22, [["请上传图片文件", "error"]]),
      (v22["length"] = 0));
    const v29 = await handlePreviewUploadFile({
      file: createFile({ name: "p.png", type: "image/png" }),
      button: v23,
      storeApi: v24,
      uploadFileImpl: async () => {
        throw new Error("上传失败");
      },
      applyResults: { image: () => v22["push"](["apply"]) },
      showToast: v25,
    });
    (strict["equal"](v29, false),
      strict["equal"](v23["disabled"], false),
      strict["equal"](v23["textContent"], "上传"),
      strict["deepEqual"](v22, [["上传失败", "error"]]));
  }),
  test("previewUploadEntry: 绑定按钮会按当前选中节点设置 accept 并打开文件选择", async () => {
    setPreviewMode(true);
    const v30 = createEventTargetStub();
    ((v30["dataset"] = {}), (v30["textContent"] = "上传"));
    const v31 = createEventTargetStub();
    (bindPreviewUploadEntry({
      button: v30,
      input: v31,
      storeApi: createStoreState({
        selectedNodeIds: ["node-video"],
        nodes: { "node-video": { id: "node-video", type: "ai-video" } },
      }),
      showToast: () => {},
    }),
      await v30["dispatch"]("click"),
      strict["equal"](v31["accept"], "video/*"),
      strict["equal"](v31["clicked"], true));
  }),
  test("previewUploadEntry:\x20节点工具栏不再包含预览上传按钮", () => {
    for (const v32 of [
      IMAGE_TOOLBAR_HTML,
      VIDEO_TOOLBAR_HTML,
      AUDIO_TOOLBAR_HTML,
    ]) {
      (strict["doesNotMatch"](v32, /act-preview-upload/),
        strict["doesNotMatch"](v32, /preview-upload-btn/));
    }
  }));
