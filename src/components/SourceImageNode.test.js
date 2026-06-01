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
    typeof globalThis["document"]["createElement"] !== "function" &&
      (globalThis["document"]["createElement"] = (v0 = "div") => ({
        tagName: String(v0)["toUpperCase"](),
        className: "",
        style: {},
        dataset: {},
        childNodes: [],
        classList: {
          add() {},
          remove() {},
          contains() {
            return false;
          },
        },
        appendChild(v1) {
          return (this["childNodes"]["push"](v1), v1);
        },
        remove() {},
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return [];
        },
        addEventListener() {},
        removeEventListener() {},
        setAttribute(v2, v3) {
          this[v2] = v3;
        },
        getAttribute(v4) {
          return this[v4] || "";
        },
      })),
    !globalThis["document"]["body"] &&
      (globalThis["document"]["body"] = { appendChild() {}, removeChild() {} }),
    !globalThis["Node"] &&
      (globalThis["Node"] = { TEXT_NODE: 3, ELEMENT_NODE: 1 }),
    !globalThis["navigator"] &&
      Object["defineProperty"](globalThis, "navigator", {
        value: { userAgent: "node-test", platform: "node" },
        configurable: true,
      }));
}
function resetStore() {
  appStore["loadState"]({
    nodes: {},
    edges: {},
    viewport: { x: 0, y: 0, zoom: 1 },
  });
}
(test("SourceImageNode: 旧超时失败的 RunningHub 节点仍可恢复", async () => {
  installDomStubs();
  const { SourceImageNode: v5 } = await import("./SourceImageNode.js"),
    v6 = Object["create"](v5["prototype"]);
  strict["equal"](
    v6["_isRunningHubRecoverableTask"]({
      id: "source-rh-timeout",
      type: "source-image",
      provider: "runninghubwf",
      model: "runninghub/2044874075721441281",
      rhTaskId: "rh-task-timeout",
      rhTaskStatus: "failed",
      outputText: "模型: RH 一键360°全景图\n错误: 任务超时，请稍后再试",
    }),
    true,
  );
}),
  test("SourceImageNode: 无本地路径时立即显示 capturePreviewUrl", async () => {
    installDomStubs();
    const { SourceImageNode: v7 } = await import("./SourceImageNode.js"),
      v8 = Object["create"](v7["prototype"]),
      v9 = [];
    (Object["assign"](v8, {
      id: "capture-preview",
      _data: {
        id: "capture-preview",
        type: "source-image",
        capturePreviewUrl: "blob:capture-preview",
      },
      _resolvedPreviewSig: "",
      _previewResolveToken: 0,
      _cachedThumbUrl: "",
      _activeCapturePreviewUrl: "",
      _showImg(v10, v11) {
        v9["push"]({ url: v10, previewUrl: v11 });
      },
    }),
      await v8["_refreshImageDisplay"](),
      strict["deepEqual"](v9, [
        { url: "blob:capture-preview", previewUrl: "" },
      ]),
      strict["equal"](v8["_activeCapturePreviewUrl"], "blob:capture-preview"));
  }),
  test("SourceImageNode: accepts electron local capture preview URL", async () => {
    installDomStubs();
    const { SourceImageNode: v12 } = await import("./SourceImageNode.js"),
      v13 = Object["create"](v12["prototype"]);
    strict["equal"](
      v13["_getCapturePreviewUrl"]({
        capturePreviewUrl: "aic-local-preview://preview/token/large.png",
      }),
      "aic-local-preview://preview/token/large.png",
    );
  }),
  test("SourceImageNode: pending capture preview is not covered by running overlay", async () => {
    installDomStubs();
    const { SourceImageNode: v14 } = await import("./SourceImageNode.js"),
      v15 = Object["create"](v14["prototype"]),
      v16 = {
        style: { display: "" },
        classList: { remove() {} },
        replaceChildrenCalled: 0,
        replaceChildren() {
          this["replaceChildrenCalled"] += 1;
        },
        querySelectorAll() {
          return [];
        },
      };
    (Object["assign"](v15, {
      _data: {
        id: "capture-preview-running",
        type: "source-image",
        jobStatus: "running",
        capturePreviewUrl: "blob:capture-preview-running",
      },
      _jobUI: v16,
      _hint: { style: { display: "" } },
      _uploadBtn: { disabled: false },
    }),
      v15["_syncJobUI"]("running"),
      strict["equal"](v16["style"]["display"], "none"),
      strict["equal"](v16["replaceChildrenCalled"], 1),
      strict["equal"](v15["_hint"]["style"]["display"], "none"),
      strict["equal"](v15["_uploadBtn"]["disabled"], true));
  }),
  test("SourceImageNode: running RH task ignores inactive Dreamina done fields", async () => {
    installDomStubs();
    const { SourceImageNode: v17 } = await import("./SourceImageNode.js");
    let v18 = 0;
    const v19 = Object["create"](v17["prototype"]);
    (Object["assign"](v19, {
      id: "source-rh-running",
      _img: {},
      _data: { id: "source-rh-running", type: "source-image" },
      _currentJobStatus: null,
      _currentSrc: "",
      _isUploading: false,
      _card: {
        classList: { remove() {} },
        querySelectorAll() {
          return ((v18 += 1), []);
        },
      },
      _uploadBtn: { disabled: false },
      _hint: { style: { display: "" } },
      _getPrimaryImageUrl: () => "",
      _syncJobUI: () => {},
      _refreshImageDisplay: async () => {},
      _applyMaskPreview: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeDreaminaTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      v19["update"]({
        id: "source-rh-running",
        type: "source-image",
        provider: "runninghubwf",
        model: "runninghub/2044874075721441281",
        isGenerating: true,
        jobStatus: "running",
        rhTaskStatus: "pending",
        dreaminaTaskStatus: "idle",
        dreaminaTaskPhase: "done",
        asyncTaskStatus: "idle",
      }),
      strict["equal"](v18, 0),
      strict["equal"](v19["_currentJobStatus"], "running"));
  }),
  test("SourceImageNode: recovering task without result shows unified loading", async () => {
    installDomStubs();
    const { SourceImageNode: v20 } = await import("./SourceImageNode.js"),
      v21 = [],
      v22 = Object["create"](v20["prototype"]);
    (Object["assign"](v22, {
      id: "source-rh-recovering",
      _img: {},
      _data: { id: "source-rh-recovering", type: "source-image" },
      _currentJobStatus: null,
      _currentSrc: "",
      _isUploading: false,
      _card: {
        classList: {
          add(...v23) {
            v21["push"](...v23);
          },
          remove() {},
        },
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return [];
        },
        appendChild() {},
      },
      _uploadBtn: { disabled: false },
      _hint: { style: { display: "" } },
      _getPrimaryImageUrl: () => "",
      _syncJobUI: () => {},
      _refreshImageDisplay: async () => {},
      _applyMaskPreview: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeDreaminaTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      v22["update"]({
        id: "source-rh-recovering",
        type: "source-image",
        provider: "runninghubwf",
        model: "runninghub/2044874075721441281",
        rhTaskId: "rh-recovering",
        rhTaskStatus: "pending",
        rhTaskRecovering: true,
        isGenerating: false,
        jobStatus: null,
      }),
      await new Promise((v24) => setTimeout(v24, 60)),
      strict["equal"](v22["_uploadBtn"]["disabled"], true),
      strict["equal"](v22["_hint"]["style"]["display"], "none"),
      strict["ok"](v21["includes"]("img-preview-loading")));
  }),
  test("SourceImageNode: terminal failure stops loading over stale generating flag", async () => {
    installDomStubs();
    const { SourceImageNode: v25 } = await import("./SourceImageNode.js");
    let v26 = 0;
    const v27 = Object["create"](v25["prototype"]);
    (Object["assign"](v27, {
      id: "source-rh-stale-failed",
      _img: {},
      _data: { id: "source-rh-stale-failed", type: "source-image" },
      _currentJobStatus: null,
      _currentSrc: "",
      _isUploading: false,
      _card: {
        classList: { add() {}, remove() {} },
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return ((v26 += 1), []);
        },
      },
      _uploadBtn: { disabled: true },
      _hint: { style: { display: "" } },
      _getPrimaryImageUrl: () => "",
      _syncJobUI: () => {},
      _refreshImageDisplay: async () => {},
      _applyMaskPreview: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeDreaminaTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      v27["update"]({
        id: "source-rh-stale-failed",
        type: "source-image",
        provider: "runninghubwf",
        model: "runninghub/2044874075721441281",
        isGenerating: true,
        jobStatus: "running",
        rhTaskStatus: "failed",
      }),
      strict["equal"](v26, 1),
      strict["equal"](v27["_uploadBtn"]["disabled"], false));
  }),
  test("SourceImageNode:\x20upload\x20size\x20patch\x20preserves\x20landscape\x20ratio", async () => {
    installDomStubs();
    const { buildSourceImageUploadSizePatch: v28 } =
      await import("./SourceImageNode.js");
    strict["deepEqual"](v28({ width: 1920, height: 1080 }), {
      width: 512,
      height: 288,
      imageWidth: 1920,
      imageHeight: 1080,
      needsAutoResize: false,
    });
  }),
  test("SourceImageNode: upload size patch preserves portrait ratio", async () => {
    installDomStubs();
    const { buildSourceImageUploadSizePatch: v29 } =
      await import("./SourceImageNode.js");
    strict["deepEqual"](v29({ width: 1080, height: 1920 }), {
      width: 288,
      height: 512,
      imageWidth: 1080,
      imageHeight: 1920,
      needsAutoResize: false,
    });
  }),
  test("SourceImageNode: upload size patch waits for auto resize when metadata is missing", async () => {
    installDomStubs();
    const { buildSourceImageUploadSizePatch: v30 } =
      await import("./SourceImageNode.js");
    strict["deepEqual"](v30({ width: 0, height: 0 }), {
      needsAutoResize: true,
    });
  }),
  test("SourceImageNode: RunningHub pending 恢复结果保持生成中并安排继续查询", async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: v31 } = await import("./SourceImageNode.js"),
      v32 = {
        id: "source-rh-pending",
        type: "source-image",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        provider: "runninghubwf",
        model: "runninghub/2044874075721441281",
        rhTaskId: "rh-task-pending",
        rhTaskStatus: "running",
        rhTaskUseOpenapiQuery: true,
        isGenerating: true,
        jobStatus: "running",
        generationStartTime: 123,
      };
    appStore["addNode"](v32);
    const v33 = Object["create"](v31["prototype"]);
    Object["assign"](v33, {
      id: v32["id"],
      _data: v32,
      _rhResumeAbortController: null,
      _rhResumeTaskId: "",
      _rhResumePromise: null,
      _rhResumeRetryTimer: null,
    });
    let v34 = 0;
    ((v33["_resumeRunningHubTaskPoller"] = async (v35) => {
      return (
        strict["equal"](v35, "rh-task-pending"),
        {
          pending: true,
          taskId: "rh-task-pending",
          status: "running",
          message: "任务仍在 RunningHub 生成中",
        }
      );
    }),
      (v33["_scheduleRunningHubRecoveryRetry"] = () => {
        v34 += 1;
      }),
      v33["_maybeResumeRunningHubTask"](),
      await v33["_rhResumePromise"]);
    const v36 = appStore["getState"]()["nodes"][v32["id"]];
    (strict["equal"](v36["isGenerating"], true),
      strict["equal"](v36["jobStatus"], "running"),
      strict["equal"](v36["rhTaskStatus"], "running"),
      strict["equal"](v36["rhTaskRecovering"], false),
      strict["equal"](
        v36["rhStatusMessage"],
        "任务仍在\x20RunningHub\x20生成中",
      ),
      strict["equal"](v34, 1),
      resetStore());
  }),
  test("SourceImageNode: RunningHub 恢复失败通过结果渲染器写入错误结果", async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: v37 } = await import("./SourceImageNode.js"),
      v38 = {
        id: "source-rh-resume-failed",
        type: "source-image",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        provider: "runninghubwf",
        model: "runninghub/2044874075721441281",
        rhTaskId: "rh-task-failed",
        rhTaskStatus: "running",
        rhTaskUseOpenapiQuery: true,
        outputText: "模型:\x20RH\x20图片任务",
        isGenerating: true,
        jobStatus: "running",
        generationStartTime: 123,
      };
    appStore["addNode"](v38);
    const v39 = Object["create"](v37["prototype"]);
    (Object["assign"](v39, {
      id: v38["id"],
      _data: v38,
      _rhResumeAbortController: null,
      _rhResumeTaskId: "",
      _rhResumePromise: null,
      _computeGenerationDuration: () => 321,
    }),
      (v39["_resumeRunningHubTaskPoller"] = async () => {
        throw new Error("RunningHub 恢复失败");
      }),
      v39["_maybeResumeRunningHubTask"](),
      await v39["_rhResumePromise"]);
    const v40 = appStore["getState"]()["nodes"][v38["id"]];
    (strict["equal"](v40["isGenerating"], false),
      strict["equal"](v40["jobStatus"], "error"),
      strict["equal"](v40["jobError"], "RunningHub 恢复失败"),
      strict["equal"](v40["generationDuration"], 321),
      strict["equal"](v40["rhTaskStatus"], "failed"),
      strict["equal"](v40["rhTaskRecovering"], false),
      strict["equal"](v40["images"]?.[0]?.["error"], "RunningHub 恢复失败"),
      strict["equal"](v40["mainImageIndex"], 0),
      strict["match"](v40["outputText"], /恢复失败: RunningHub 恢复失败/),
      resetStore());
  }),
  test("SourceImageNode: Dreamina error aliases are not recoverable", async () => {
    installDomStubs();
    const { SourceImageNode: v41 } = await import("./SourceImageNode.js"),
      v42 = Object["create"](v41["prototype"]);
    (strict["equal"](
      v42["_isDreaminaRecoverableTask"]({
        id: "source-dreamina-job-error",
        type: "source-image",
        provider: "dreamina",
        model: "dreamina/4.5",
        dreaminaSubmitId: "dm-job-error",
        jobStatus: "error",
        dreaminaTaskStatus: "pending",
        dreaminaTaskPhase: "generating",
      }),
      false,
    ),
      strict["equal"](
        v42["_isDreaminaRecoverableTask"]({
          id: "source-dreamina-status-error",
          type: "source-image",
          provider: "dreamina",
          model: "dreamina/4.5",
          dreaminaSubmitId: "dm-status-error",
          dreaminaTaskStatus: "error",
          dreaminaTaskPhase: "generating",
        }),
        false,
      ),
      strict["equal"](
        v42["_isDreaminaRecoverableTask"]({
          id: "source-dreamina-legacy-syncing",
          type: "source-image",
          provider: "dreamina",
          model: "dreamina/4.5",
          dreaminaSubmitId: "dm-legacy-syncing",
          dreaminaTaskStatus: "success",
          dreaminaTaskPhase: "syncing",
        }),
        true,
      ),
      strict["equal"](
        v42["_isDreaminaRecoverableTask"]({
          id: "source-dreamina-fresh-active",
          type: "source-image",
          provider: "dreamina",
          model: "dreamina/4.5",
          dreaminaSubmitId: "dm-fresh-active",
          dreaminaTaskStatus: "pending",
          dreaminaTaskPhase: "generating",
          dreaminaTaskLastCheckedAt: Date["now"](),
          isGenerating: true,
        }),
        false,
      ));
  }),
  test("SourceImageNode: Dreamina success+syncing 旧状态恢复失败会清掉加载态", async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: v43 } = await import("./SourceImageNode.js"),
      v44 = {
        id: "source-dreamina-syncing-failed",
        type: "source-image",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        provider: "dreamina",
        model: "dreamina/4.5",
        dreaminaSubmitId: "dm-syncing-failed",
        dreaminaTaskStatus: "success",
        dreaminaTaskPhase: "syncing",
        dreaminaTaskLabel: "同步结果中",
        dreaminaTaskStartedAt: 123,
        dreaminaTaskLastCheckedAt: 456,
        isGenerating: false,
        jobStatus: "success",
      };
    appStore["addNode"](v44);
    const v45 = Object["create"](v43["prototype"]);
    Object["assign"](v45, {
      id: v44["id"],
      _data: v44,
      _dreaminaResumeAbortController: null,
      _dreaminaResumeSubmitId: "",
      _dreaminaResumePromise: null,
      _computeGenerationDuration: () => 789,
    });
    let v46 = null;
    const v47 = new Promise((v48) => {
      v45["_dreaminaResumePoller"] = async (v49) => {
        (strict["equal"](v49, "dm-syncing-failed"),
          v48(),
          await new Promise((v50, v51) => {
            v46 = v51;
          }));
      };
    });
    (v45["_maybeResumeDreaminaTask"](),
      await v47,
      strict["equal"](
        appStore["getState"]()["nodes"][v44["id"]]["dreaminaTaskStatus"],
        "pending",
      ),
      strict["equal"](
        appStore["getState"]()["nodes"][v44["id"]]["dreaminaTaskPhase"],
        "generating",
      ),
      v46(new Error("generation failed: final generation failed")),
      await v45["_dreaminaResumePromise"]);
    const v52 = appStore["getState"]()["nodes"][v44["id"]];
    (strict["equal"](v52["isGenerating"], false),
      strict["equal"](v52["jobStatus"], "error"),
      strict["equal"](
        v52["jobError"],
        "generation failed: final generation failed",
      ),
      strict["equal"](v52["generationDuration"], 789),
      strict["equal"](
        v52["images"]?.[0]?.["error"],
        "generation failed: final generation failed",
      ),
      strict["equal"](v52["mainImageIndex"], 0),
      strict["equal"](v52["dreaminaTaskStatus"], "failed"),
      strict["equal"](v52["dreaminaTaskPhase"], "failed"),
      strict["equal"](
        v52["dreaminaTaskLabel"],
        "generation failed: final generation failed",
      ),
      strict["equal"](v52["dreaminaTaskRecovering"], false),
      resetStore());
  }),
  test("SourceImageNode: Dreamina 恢复超时转为后台 pending", async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: v53 } = await import("./SourceImageNode.js"),
      v54 = {
        id: "source-dreamina-timeout",
        type: "source-image",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        provider: "dreamina",
        model: "dreamina/4.5",
        dreaminaSubmitId: "dm-timeout",
        dreaminaTaskStatus: "pending",
        dreaminaTaskPhase: "generating",
        dreaminaTaskLabel: "生成中",
        dreaminaTaskStartedAt: 123,
        dreaminaTaskLastCheckedAt: 456,
        dreaminaTaskRecovering: true,
        isGenerating: true,
        jobStatus: "running",
      };
    appStore["addNode"](v54);
    const v55 = Object["create"](v53["prototype"]);
    (Object["assign"](v55, {
      id: v54["id"],
      _data: v54,
      _dreaminaResumeAbortController: null,
      _dreaminaResumeSubmitId: "",
      _dreaminaResumePromise: null,
      _computeGenerationDuration: () => 789,
    }),
      (v55["_dreaminaResumePoller"] = async (v56) => {
        strict["equal"](v56, "dm-timeout");
        const v57 = new Error("Dreamina poll timeout");
        v57["code"] = "DREAMINA_POLL_TIMEOUT";
        throw v57;
      }),
      v55["_maybeResumeDreaminaTask"](),
      await v55["_dreaminaResumePromise"]);
    const v58 = appStore["getState"]()["nodes"][v54["id"]];
    (strict["equal"](v58["isGenerating"], true),
      strict["equal"](v58["jobStatus"], "running"),
      strict["equal"](v58["jobError"], null),
      strict["equal"](v58["dreaminaTaskStatus"], "pending"),
      strict["equal"](v58["dreaminaTaskPhase"], "generating"),
      strict["equal"](v58["dreaminaTaskLabel"], "排队中（后台查询）"),
      strict["equal"](v58["dreaminaTaskRecovering"], false),
      resetStore());
  }),
  test("SourceImageNode:\x20async\x20恢复失败保留已有媒体字段并写入错误结果", async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: v59 } = await import("./SourceImageNode.js"),
      v60 = {
        id: "source-async-resume-failed",
        type: "source-image",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        provider: "apimart",
        model: "apimart/nano-banana-2",
        asyncTaskId: "async-task-failed",
        asyncTaskStatus: "running",
        asyncTaskProvider: "apimart",
        asyncTaskKind: "image",
        imageUrl: "/output/previous.png",
        thumbUrl: "/output/previous-thumb.png",
        outputText: "模型: APIMart 图片任务",
        isGenerating: true,
        jobStatus: "running",
        generationStartTime: 123,
      };
    appStore["addNode"](v60);
    const v61 = Object["create"](v59["prototype"]);
    (Object["assign"](v61, {
      id: v60["id"],
      _data: v60,
      _asyncResumeAbortController: null,
      _asyncResumeTaskId: "",
      _asyncResumePromise: null,
      _computeGenerationDuration: () => 654,
    }),
      (v61["_resumeAsyncTaskPoller"] = async () => {
        throw new Error("异步恢复失败");
      }),
      v61["_maybeResumeAsyncTask"](),
      await v61["_asyncResumePromise"]);
    const v62 = appStore["getState"]()["nodes"][v60["id"]];
    (strict["equal"](v62["isGenerating"], false),
      strict["equal"](v62["jobStatus"], "error"),
      strict["equal"](v62["jobError"], "异步恢复失败"),
      strict["equal"](v62["generationDuration"], 654),
      strict["equal"](v62["asyncTaskStatus"], "failed"),
      strict["equal"](v62["asyncTaskRecovering"], false),
      strict["equal"](v62["images"]?.[0]?.["error"], "异步恢复失败"),
      strict["equal"](v62["mainImageIndex"], 0),
      strict["equal"](v62["imageUrl"], "/output/previous.png"),
      strict["equal"](v62["thumbUrl"], "/output/previous-thumb.png"),
      strict["match"](v62["outputText"], /恢复失败: 异步恢复失败/),
      resetStore());
  }),
  test("SourceImageNode: display image preloads are globally limited", async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: v63 } = await import("./SourceImageNode.js"),
      v64 = Object["prototype"]["hasOwnProperty"]["call"](globalThis, "Image"),
      v65 = globalThis["Image"],
      v66 = console["log"],
      v67 = [];
    let v68 = 0,
      v69 = 0;
    class v70 {
      constructor() {
        ((this["onload"] = null),
          (this["onerror"] = null),
          (this["naturalWidth"] = 800),
          (this["naturalHeight"] = 600));
      }
      set ["src"](v71) {
        ((this["_src"] = v71),
          (v68 += 1),
          (v69 = Math["max"](v69, v68)),
          v67["push"](() => {
            ((v68 -= 1), this["onload"]?.());
          }));
      }
      get ["src"]() {
        return this["_src"] || "";
      }
    }
    ((globalThis["Image"] = v70), (console["log"] = () => {}));
    try {
      const v72 = [];
      for (let v73 = 0; v73 < 8; v73 += 1) {
        const v74 = "preload-limit-" + v73,
          v75 = {
            id: v74,
            type: "source-image",
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            fixedSize: true,
            needsAutoResize: false,
            thumbLocalPath: "data/assets/thumb.jpg",
          };
        appStore["addNode"](v75);
        const v76 = {
            src: "",
            style: { display: "none" },
            getAttribute(v77) {
              return v77 === "src" ? this["src"] : "";
            },
          },
          v78 = Object["create"](v63["prototype"]);
        (Object["assign"](v78, {
          id: v74,
          _data: v75,
          _currentSrc: "",
          _cachedThumbUrl: "",
          _failedSrc: "",
          _activeCapturePreviewUrl: "",
          _card: {
            classList: { add() {}, remove() {} },
            querySelector() {
              return null;
            },
            querySelectorAll() {
              return [];
            },
          },
          _img: v76,
          _hint: { style: { display: "" } },
          _releaseActiveCapturePreviewUrl() {},
          _queueThumbnail() {},
        }),
          v72["push"](v78));
      }
      for (let v79 = 0; v79 < v72["length"]; v79 += 1) {
        v72[v79]["_showImg"]("/output/preload-" + v79 + ".png", "");
      }
      strict["equal"](v69, 4);
      while (v67["length"] > 0) {
        const v80 = v67["shift"]();
        (v80(), await Promise["resolve"]());
      }
      (await Promise["resolve"](),
        strict["equal"](v69, 4),
        strict["equal"](v68, 0),
        (v69 = 0),
        (v72[0]["_currentSrc"] = ""),
        (v72[1]["_currentSrc"] = ""),
        v72[0]["_showImg"]("/output/shared-preload.png", ""),
        v72[1]["_showImg"]("/output/shared-preload.png", ""),
        strict["equal"](v68, 1),
        strict["equal"](v69, 1),
        v67["shift"]()?.(),
        await Promise["resolve"](),
        await Promise["resolve"](),
        await new Promise((v81) => setTimeout(v81, 0)),
        strict["equal"](v68, 0));
      const v82 = v67["length"];
      (v72[0]["_showImg"]("/output/shared-preload.png", ""),
        await Promise["resolve"](),
        strict["equal"](v68, 0),
        strict["equal"](v67["length"], v82));
    } finally {
      (v64 ? (globalThis["Image"] = v65) : delete globalThis["Image"],
        (console["log"] = v66),
        resetStore());
    }
  }),
  test("SourceImageNode: thumbnail stays visible while display image preloads", async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: v83 } = await import("./SourceImageNode.js"),
      v84 = Object["prototype"]["hasOwnProperty"]["call"](globalThis, "Image"),
      v85 = globalThis["Image"],
      v86 = console["log"],
      v87 = [];
    let v88 = 0,
      v89 = 0,
      v90 = 0;
    class v91 {
      constructor() {
        ((this["onload"] = null),
          (this["onerror"] = null),
          (this["naturalWidth"] = 900),
          (this["naturalHeight"] = 600));
      }
      set ["src"](v92) {
        ((this["_src"] = v92),
          (v88 += 1),
          v87["push"](() => {
            ((v88 -= 1), this["onload"]?.());
          }));
      }
      get ["src"]() {
        return this["_src"] || "";
      }
    }
    ((globalThis["Image"] = v91), (console["log"] = () => {}));
    try {
      const v93 = {
        id: "thumb-first",
        type: "source-image",
        width: 100,
        height: 100,
        fixedSize: true,
        needsAutoResize: false,
        imageWidth: 900,
        imageHeight: 600,
      };
      appStore["addNode"](v93);
      const v94 = {
          src: "",
          style: { display: "none" },
          getAttribute(v95) {
            return v95 === "src" ? this["src"] : "";
          },
        },
        v96 = {
          classList: {
            add() {
              v89 += 1;
            },
            remove() {},
          },
          querySelector() {
            return null;
          },
          querySelectorAll() {
            return [];
          },
          appendChild() {
            v90 += 1;
          },
        },
        v97 = Object["create"](v83["prototype"]);
      (Object["assign"](v97, {
        id: v93["id"],
        _data: v93,
        _currentSrc: "",
        _cachedThumbUrl: "",
        _failedSrc: "",
        _activeCapturePreviewUrl: "",
        _card: v96,
        _img: v94,
        _hint: { style: { display: "" } },
        _releaseActiveCapturePreviewUrl() {},
        _queueThumbnail() {},
      }),
        v97["_showImg"]("/output/display-image.png", "/output/thumb-image.jpg"),
        strict["equal"](v94["src"], "/output/thumb-image.jpg"),
        strict["equal"](v94["style"]["display"], "block"),
        strict["equal"](v88, 1),
        await new Promise((v98) => setTimeout(v98, 80)),
        strict["equal"](v89, 0),
        strict["equal"](v90, 0),
        strict["equal"](v94["src"], "/output/thumb-image.jpg"),
        v87["shift"]()?.(),
        await Promise["resolve"](),
        await Promise["resolve"](),
        await new Promise((v99) => setTimeout(v99, 0)),
        strict["equal"](v88, 0),
        strict["equal"](v94["src"], "/output/display-image.png"));
    } finally {
      (v84 ? (globalThis["Image"] = v85) : delete globalThis["Image"],
        (console["log"] = v86),
        resetStore());
    }
  }),
  test("SourceImageNode: local display image shows before thumbnail cache lookup", async () => {
    installDomStubs();
    const { SourceImageNode: v100 } = await import("./SourceImageNode.js"),
      v101 = Object["create"](v100["prototype"]);
    let v102 = null;
    Object["assign"](v101, {
      _data: {
        id: "display-first",
        type: "source-image",
        displayLocalPath: "output/_derived/display/demo.display.jpg",
        thumbLocalPath: "output/_derived/thumb/demo.thumb.jpg",
      },
      _resolvedPreviewSig: "",
      _previewResolveToken: 0,
      _cachedThumbUrl: "",
      _adoptCapturePreviewUrl() {},
      _showImg(v103, v104) {
        v102 = { url: v103, previewUrl: v104 };
      },
    });
    const v105 = v101["_refreshImageDisplay"]();
    (strict["deepEqual"](v102, {
      url: "/output/_derived/display/demo.display.jpg",
      previewUrl: "/output/_derived/thumb/demo.thumb.jpg",
    }),
      await v105);
  }));
