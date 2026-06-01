import test from "node:test";
import strict from "node:assert/strict";
import {
  createFakePreviewContainer,
  installPreviewDomStubs,
} from "../../tests/testPreviewDom.js";
const restoreDom = installPreviewDomStubs();
let store,
  previewMode,
  previewUploadResult,
  originalStoreFns = null;
test["before"](async () => {
  const v0 = await import("../core/stores/appStore.js");
  ((store = v0["default"]),
    (previewMode = await import("./previewMode.js")),
    (previewUploadResult = await import("./previewUploadResult.js")),
    (originalStoreFns = {
      getState: store["getState"],
      updateNodeData: store["updateNodeData"],
    }));
});
function restoreStore() {
  if (!store || !originalStoreFns) return;
  ((store["getState"] = originalStoreFns["getState"]),
    (store["updateNodeData"] = originalStoreFns["updateNodeData"]));
}
function installStoreState(v1) {
  ((store["getState"] = () => v1),
    (store["updateNodeData"] = (v2, v3) => {
      const v4 = v1["nodes"]?.[v2] || {};
      v1["nodes"][v2] = { ...v4, ...v3 };
    }));
}
(test["afterEach"](() => {
  (previewMode["_resetPreviewRuntimeForTests"](), restoreStore());
}),
  test["after"](() => {
    (previewMode["_resetPreviewRuntimeForTests"](),
      restoreStore(),
      restoreDom());
  }),
  test("previewUploadResult: 图片上传会覆盖为单结果并清掉假加载", () => {
    const v5 = "node-preview-image",
      v6 = {
        nodes: {
          [v5]: {
            id: v5,
            type: "ai-image",
            images: [{ imageUrl: "/old.png" }, { imageUrl: "/old-2.png" }],
            mainImageIndex: 1,
            rhTaskStatus: "pending",
          },
        },
      };
    (installStoreState(v6),
      previewMode["startPreviewNodeLoading"](v5, createFakePreviewContainer()),
      previewUploadResult["applyUploadedPreviewImageResult"]({
        nodeId: v5,
        uploadRes: {
          url: "/data/uploads/preview.png",
          localPath: "data/uploads/preview.png",
          originalWidth: 960,
          originalHeight: 540,
        },
        fileName: "preview.png",
      }),
      strict["equal"](previewMode["isPreviewNodeLoading"](v5), false),
      strict["equal"](v6["nodes"][v5]["images"]["length"], 1),
      strict["equal"](v6["nodes"][v5]["mainImageIndex"], 0),
      strict["equal"](v6["nodes"][v5]["imageUrl"], "/data/uploads/preview.png"),
      strict["equal"](v6["nodes"][v5]["fileName"], "preview.png"),
      strict["equal"](v6["nodes"][v5]["jobStatus"], "success"),
      strict["equal"](v6["nodes"][v5]["rhTaskStatus"], "idle"));
  }),
  test("previewUploadResult: 视频上传会覆盖为单结果并重置元信息抓取状态", () => {
    const v7 = "node-preview-video",
      v8 = {
        nodes: {
          [v7]: {
            id: v7,
            type: "ai-video",
            videos: [{ videoUrl: "/old.mp4" }, { videoUrl: "/old-2.mp4" }],
            mainVideoIndex: 1,
            videoMetaSrc: "/old.mp4",
            asyncTaskStatus: "pending",
          },
        },
      };
    (installStoreState(v8),
      previewMode["startPreviewNodeLoading"](v7, createFakePreviewContainer()),
      previewUploadResult["applyUploadedPreviewVideoResult"]({
        nodeId: v7,
        uploadRes: {
          url: "/data/uploads/preview.mp4",
          localPath: "data/uploads/preview.mp4",
        },
        fileName: "preview.mp4",
      }),
      strict["equal"](previewMode["isPreviewNodeLoading"](v7), false),
      strict["equal"](v8["nodes"][v7]["videos"]["length"], 1),
      strict["equal"](v8["nodes"][v7]["mainVideoIndex"], 0),
      strict["equal"](v8["nodes"][v7]["videoUrl"], "/data/uploads/preview.mp4"),
      strict["equal"](v8["nodes"][v7]["videoMetaSrc"], ""),
      strict["equal"](v8["nodes"][v7]["asyncTaskStatus"], "idle"));
  }),
  test("previewUploadResult: 音频上传会写回当前结果并清掉假加载", () => {
    const v9 = "node-preview-audio",
      v10 = {
        nodes: {
          [v9]: {
            id: v9,
            type: "ai-audio",
            audioUrl: "/old.mp3",
            rhTaskStatus: "pending",
          },
        },
      };
    (installStoreState(v10),
      previewMode["startPreviewNodeLoading"](v9, createFakePreviewContainer()),
      previewUploadResult["applyUploadedPreviewAudioResult"]({
        nodeId: v9,
        uploadRes: {
          url: "/data/uploads/preview.mp3",
          localPath: "data/uploads/preview.mp3",
        },
        fileName: "preview.mp3",
      }),
      strict["equal"](previewMode["isPreviewNodeLoading"](v9), false),
      strict["equal"](
        v10["nodes"][v9]["audioUrl"],
        "/data/uploads/preview.mp3",
      ),
      strict["equal"](v10["nodes"][v9]["src"], "/data/uploads/preview.mp3"),
      strict["equal"](v10["nodes"][v9]["fileName"], "preview.mp3"),
      strict["equal"](v10["nodes"][v9]["rhTaskStatus"], "idle"));
  }));
