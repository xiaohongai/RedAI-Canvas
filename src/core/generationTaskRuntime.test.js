import test from "node:test";
import strict from "node:assert/strict";
import {
  __resetGenerationTaskRuntimeForTest,
  cancelTask,
  resumeTask,
  submitTask,
} from "./generationTaskRuntime.js";
function createMockStore(v0 = {}) {
  const v1 = { nodes: { ...v0 }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } };
  return {
    state: v1,
    addNode(v2) {
      v1["nodes"][v2["id"]] = { ...v2 };
    },
    updateNodeData(v3, v4) {
      v1["nodes"][v3] = { ...(v1["nodes"][v3] || { id: v3 }), ...v4 };
    },
    getState() {
      return v1;
    },
    getStateRaw() {
      return v1;
    },
  };
}
function baseSpec(v5 = {}) {
  return {
    sourceNodeId: "source-1",
    targetNodeId: "target-1",
    trigger: "toolbar",
    taskType: "image-hd",
    provider: "runninghubwf",
    adapterType: "workflow",
    modelId: "runninghub/test",
    executionId: "runninghub.test",
    payload: { prompt: "go" },
    cancellable: true,
    resumable: true,
    resultBuilder: (v6) => ({ outputText: v6["text"] || "done" }),
    ...v5,
  };
}
(test["beforeEach"](() => {
  __resetGenerationTaskRuntimeForTest();
}),
  test("generationTaskRuntime:\x20workflow\x20submit\x20writes\x20task\x20id,\x20polls,\x20and\x20stores\x20success", async () => {
    const v7 = createMockStore({
        "target-1": { id: "target-1", type: "source-image" },
      }),
      v8 = [],
      v9 = await submitTask(
        baseSpec({
          submit: async (v10, v11) => {
            return (
              v8["push"](["submit", v11["targetNodeId"]]),
              { data: { taskId: "rh-task-1" } }
            );
          },
          poll: async ({ taskId: v12 }) => {
            return (v8["push"](["poll", v12]), { text: "ok" });
          },
        }),
        { store: v7, now: () => 1000 },
      ),
      v13 = v7["state"]["nodes"]["target-1"];
    (strict["equal"](v9["ok"], true),
      strict["deepEqual"](v8, [
        ["submit", "target-1"],
        ["poll", "rh-task-1"],
      ]),
      strict["equal"](v13["isGenerating"], false),
      strict["equal"](v13["jobStatus"], "success"),
      strict["equal"](v13["rhTaskId"], "rh-task-1"),
      strict["equal"](v13["rhTaskStatus"], "success"),
      strict["equal"](v13["rhSourceNodeId"], "source-1"),
      strict["equal"](v13["rhToolbarTaskType"], "image-hd"),
      strict["equal"](v13["taskCancellable"], true),
      strict["equal"](v13["taskResumable"], true),
      strict["equal"](v13["taskAdapterType"], "workflow"),
      strict["equal"](v13["outputText"], "ok"));
  }),
  test("generationTaskRuntime:\x20submit\x20applies\x20business\x20start\x20patch\x20once\x20before\x20submit", async () => {
    const v14 = createMockStore({
        "target-1": { id: "target-1", type: "ai-video", staleField: "keep" },
      }),
      v15 = [];
    await submitTask(
      baseSpec({
        provider: "dreamina",
        adapterType: "modelApi",
        modelId: "dreamina/video",
        executionId: "dreamina.video",
        cancellable: false,
        resumable: true,
        startBuilder: (v16) => {
          return (
            v15["push"](["startBuilder", v16["targetNodeId"]]),
            {
              dreaminaTaskStatus: "pending",
              dreaminaTaskPhase: "generating",
              asyncTaskStatus: "idle",
            }
          );
        },
        onTaskStart: (v17) => {
          v15["push"](["onTaskStart", v17["targetNodeId"]]);
        },
        submit: async () => {
          return (
            v15["push"]([
              "submit",
              v14["state"]["nodes"]["target-1"]["dreaminaTaskStatus"],
            ]),
            { result: { text: "started" } }
          );
        },
      }),
      { store: v14, now: () => 2100 },
    );
    const v18 = v14["state"]["nodes"]["target-1"];
    (strict["deepEqual"](v15, [
      ["startBuilder", "target-1"],
      ["onTaskStart", "target-1"],
      ["submit", "pending"],
    ]),
      strict["equal"](v18["outputText"], "started"),
      strict["equal"](v18["dreaminaTaskStatus"], "pending"),
      strict["equal"](v18["asyncTaskStatus"], "idle"));
  }),
  test("generationTaskRuntime: createTargetNode path adds receiver before running", async () => {
    const v19 = createMockStore();
    await submitTask(
      baseSpec({
        targetNodeId: "",
        createTargetNode: ({ startPatch: v20, protocolPatch: v21 }) => ({
          id: "created-1",
          type: "source-image",
          ...v20,
          ...v21,
        }),
        submit: async () => ({ result: { text: "created" } }),
      }),
      { store: v19, now: () => 2000 },
    );
    const v22 = v19["state"]["nodes"]["created-1"];
    (strict["equal"](v22["id"], "created-1"),
      strict["equal"](v22["isGenerating"], false),
      strict["equal"](v22["jobStatus"], "success"),
      strict["equal"](v22["outputText"], "created"));
  }),
  test("generationTaskRuntime:\x20waitForResult\x20false\x20keeps\x20active\x20task\x20cancellable", async () => {
    const v23 = createMockStore({
      "target-1": { id: "target-1", type: "source-image" },
    });
    let v24 = "";
    const v25 = await submitTask(
        baseSpec({
          waitForResult: false,
          submit: async () => ({ taskId: "rh-cancel-1" }),
          cancel: async ({ taskId: v26 }) => {
            v24 = v26;
          },
        }),
        { store: v23, now: () => 3000 },
      ),
      v27 = await cancelTask("target-1", { store: v23, now: () => 5000 }),
      v28 = v23["state"]["nodes"]["target-1"];
    (strict["equal"](v25["status"], "submitted"),
      strict["equal"](v27["ok"], true),
      strict["equal"](v24, "rh-cancel-1"),
      strict["equal"](v28["isGenerating"], false),
      strict["equal"](v28["jobStatus"], "cancelled"),
      strict["equal"](v28["rhTaskStatus"], "cancelled"));
  }),
  test("generationTaskRuntime: cancellation prevents late result patch", async () => {
    const v29 = createMockStore({
      "target-1": { id: "target-1", type: "source-image" },
    });
    let v30,
      v31 = "";
    const v32 = submitTask(
      baseSpec({
        submit: async () =>
          new Promise((v33) => {
            v30 = () => v33({ taskId: "rh-late-1" });
          }),
        poll: async () => ({ text: "late\x20result" }),
        cancel: async ({ taskId: v34 }) => {
          v31 = v34;
        },
      }),
      { store: v29, now: () => 3000 },
    );
    await new Promise((v35) => setTimeout(v35, 0));
    const v36 = await cancelTask("target-1", { store: v29, now: () => 3500 });
    v30();
    const v37 = await v32,
      v38 = v29["state"]["nodes"]["target-1"];
    (strict["equal"](v36["ok"], true),
      strict["equal"](v37["status"], "cancelled"),
      strict["equal"](v31, "rh-late-1"),
      strict["equal"](v38["isGenerating"], false),
      strict["equal"](v38["jobStatus"], "cancelled"),
      strict["equal"](v38["rhTaskStatus"], "cancelled"),
      strict["equal"](v38["outputText"], undefined));
  }),
  test("generationTaskRuntime:\x20cancellation\x20during\x20result\x20build\x20prevents\x20success\x20patch", async () => {
    const v39 = createMockStore({
        "target-1": { id: "target-1", type: "source-image" },
      }),
      v40 = await submitTask(
        baseSpec({
          submit: async () => ({ taskId: "rh-build-cancel-1" }),
          poll: async () => ({ text: "late result" }),
          resultBuilder: async () => {
            return (
              await cancelTask("target-1", { store: v39, now: () => 3500 }),
              { outputText: "late result" }
            );
          },
        }),
        { store: v39, now: () => 3000 },
      ),
      v41 = v39["state"]["nodes"]["target-1"];
    (strict["equal"](v40["status"], "cancelled"),
      strict["equal"](v41["isGenerating"], false),
      strict["equal"](v41["jobStatus"], "cancelled"),
      strict["equal"](v41["rhTaskStatus"], "cancelled"),
      strict["equal"](v41["outputText"], undefined));
  }),
  test("generationTaskRuntime: model API without remote cancel reports not-cancellable", async () => {
    const v42 = createMockStore({
      "target-1": { id: "target-1", type: "ai-image" },
    });
    await submitTask(
      baseSpec({
        provider: "apimart",
        adapterType: "modelApi",
        modelId: "apimart/image",
        executionId: "apimart.image",
        cancellable: false,
        resumable: false,
        waitForResult: false,
        submit: async () => ({ taskId: "remote-but-not-cancellable" }),
      }),
      { store: v42, now: () => 7000 },
    );
    const v43 = await cancelTask("target-1", { store: v42 });
    (strict["deepEqual"](v43, {
      ok: false,
      reason: "not-cancellable",
      targetNodeId: "target-1",
    }),
      strict["equal"](v42["state"]["nodes"]["target-1"]["isGenerating"], true));
  }),
  test("generationTaskRuntime: pending result keeps task running without terminal patch", async () => {
    const v44 = createMockStore({
        "target-1": { id: "target-1", type: "source-image" },
      }),
      v45 = await submitTask(
        baseSpec({
          submit: async () => ({ taskId: "rh-pending-1" }),
          poll: async () => ({ pending: true, message: "仍在生成" }),
        }),
        { store: v44, now: () => 8000 },
      ),
      v46 = v44["state"]["nodes"]["target-1"];
    (strict["equal"](v45["ok"], true),
      strict["equal"](v45["status"], "pending"),
      strict["equal"](v45["pending"], true),
      strict["equal"](v46["isGenerating"], true),
      strict["equal"](v46["jobStatus"], "running"),
      strict["equal"](v46["rhTaskId"], "rh-pending-1"),
      strict["equal"](v46["rhTaskStatus"], "running"),
      strict["equal"](v46["rhStatusMessage"], "仍在生成"),
      strict["equal"](v46["outputText"], undefined));
  }),
  test("generationTaskRuntime:\x20failure\x20and\x20cancellation\x20builders\x20add\x20display\x20patches", async () => {
    const v47 = createMockStore({
      "target-1": { id: "target-1", type: "source-image" },
      "target-2": { id: "target-2", type: "source-image" },
    });
    (await submitTask(
      baseSpec({
        submit: async () => {
          throw new Error("boom");
        },
        failureBuilder: (v48) => ({
          name: "结果失败",
          outputText: "失败:\x20" + v48["message"],
        }),
      }),
      { store: v47, now: () => 9000 },
    ),
      await submitTask(
        baseSpec({
          targetNodeId: "target-2",
          submit: async () => {
            throw new Error("任务已取消");
          },
          cancelledBuilder: () => ({
            name: "结果已取消",
            outputText: "状态: 已取消",
          }),
        }),
        { store: v47, now: () => 10000 },
      ),
      strict["equal"](v47["state"]["nodes"]["target-1"]["jobStatus"], "error"),
      strict["equal"](v47["state"]["nodes"]["target-1"]["name"], "结果失败"),
      strict["equal"](
        v47["state"]["nodes"]["target-1"]["outputText"],
        "失败: boom",
      ),
      strict["equal"](
        v47["state"]["nodes"]["target-2"]["jobStatus"],
        "cancelled",
      ),
      strict["equal"](v47["state"]["nodes"]["target-2"]["name"], "结果已取消"),
      strict["equal"](
        v47["state"]["nodes"]["target-2"]["outputText"],
        "状态: 已取消",
      ));
  }),
  test("generationTaskRuntime: async model API writes async status and resumes", async () => {
    const v49 = createMockStore({
        "target-1": {
          id: "target-1",
          type: "ai-image",
          asyncTaskId: "async-1",
          generationStartTime: 9000,
        },
      }),
      v50 = await resumeTask(
        baseSpec({
          provider: "vendor",
          adapterType: "modelApi",
          modelId: "vendor/async",
          executionId: "vendor.async",
          cancellable: false,
          resumable: true,
          async: true,
          taskId: "async-1",
          poll: async ({ taskId: v51 }) => ({ text: "done:" + v51 }),
        }),
        { store: v49, now: () => 12000 },
      ),
      v52 = v49["state"]["nodes"]["target-1"];
    (strict["equal"](v50["ok"], true),
      strict["equal"](v52["isGenerating"], false),
      strict["equal"](v52["jobStatus"], "success"),
      strict["equal"](v52["asyncTaskId"], "async-1"),
      strict["equal"](v52["asyncTaskStatus"], "success"),
      strict["equal"](v52["asyncTaskRecovering"], false),
      strict["equal"](v52["outputText"], "done:async-1"));
  }),
  test("generationTaskRuntime: resume applies start patch and keeps pending task cancellable", async () => {
    const v53 = createMockStore({
        "target-1": {
          id: "target-1",
          type: "source-audio",
          rhTaskId: "rh-resume-1",
          generationStartTime: 10000,
        },
      }),
      v54 = [];
    let v55 = "";
    const v56 = await resumeTask(
        baseSpec({
          taskId: "rh-resume-1",
          startBuilder: (v57) => {
            return (
              v54["push"](["startBuilder", v57["taskId"]]),
              { audioWorkflowKey: "voice-clone" }
            );
          },
          onTaskStart: (v58) => {
            v54["push"](["onTaskStart", v58["taskId"]]);
          },
          poll: async ({ taskId: v59 }) => {
            return (
              v54["push"](["poll", v59]),
              { pending: true, message: "仍在生成" }
            );
          },
          cancel: async ({ taskId: v60 }) => {
            v55 = v60;
          },
          cancelledBuilder: () => ({ audioUrl: "", outputText: "已取消恢复" }),
        }),
        { store: v53, now: () => 13000 },
      ),
      v61 = v53["state"]["nodes"]["target-1"];
    (strict["equal"](v56["status"], "pending"),
      strict["deepEqual"](v54, [
        ["startBuilder", "rh-resume-1"],
        ["onTaskStart", "rh-resume-1"],
        ["poll", "rh-resume-1"],
      ]),
      strict["equal"](v61["isGenerating"], true),
      strict["equal"](v61["jobStatus"], "running"),
      strict["equal"](v61["rhTaskStatus"], "running"),
      strict["equal"](v61["rhTaskRecovering"], false),
      strict["equal"](v61["audioWorkflowKey"], "voice-clone"),
      strict["equal"](v61["rhStatusMessage"], "仍在生成"));
    const v62 = await cancelTask("target-1", { store: v53, now: () => 14000 }),
      v63 = v53["state"]["nodes"]["target-1"];
    (strict["equal"](v62["status"], "cancelled"),
      strict["equal"](v55, "rh-resume-1"),
      strict["equal"](v63["jobStatus"], "cancelled"),
      strict["equal"](v63["rhTaskStatus"], "cancelled"),
      strict["equal"](v63["outputText"], "已取消恢复"));
  }),
  test("generationTaskRuntime: resume abort uses cancelled builder", async () => {
    const v64 = createMockStore({
        "target-1": {
          id: "target-1",
          type: "source-audio",
          rhTaskId: "rh-abort-1",
          generationStartTime: 15000,
        },
      }),
      v65 = await resumeTask(
        baseSpec({
          taskId: "rh-abort-1",
          poll: async () => {
            const v66 = new Error("CANCELLED");
            v66["name"] = "AbortError";
            throw v66;
          },
          cancelledBuilder: () => ({ outputText: "恢复已中断" }),
        }),
        { store: v64, now: () => 16000 },
      ),
      v67 = v64["state"]["nodes"]["target-1"];
    (strict["equal"](v65["ok"], false),
      strict["equal"](v65["status"], "cancelled"),
      strict["equal"](v67["isGenerating"], false),
      strict["equal"](v67["jobStatus"], "cancelled"),
      strict["equal"](v67["rhTaskStatus"], "cancelled"),
      strict["equal"](v67["outputText"], "恢复已中断"));
  }),
  test("generationTaskRuntime: resume abort can pause without finalizing duration", async () => {
    const v68 = createMockStore({
        "target-1": {
          id: "target-1",
          type: "source-audio",
          rhTaskId: "rh-pause-1",
          generationStartTime: 15000,
          generationDuration: null,
        },
      }),
      v69 = await resumeTask(
        baseSpec({
          taskId: "rh-pause-1",
          pauseOnAbort: true,
          poll: async () => {
            const v70 = new Error("CANCELLED");
            v70["name"] = "AbortError";
            throw v70;
          },
          pauseBuilder: () => ({ outputText: "恢复暂停" }),
        }),
        { store: v68, now: () => 16000 },
      ),
      v71 = v68["state"]["nodes"]["target-1"];
    (strict["equal"](v69["ok"], false),
      strict["equal"](v69["status"], "paused"),
      strict["equal"](v71["isGenerating"], true),
      strict["equal"](v71["jobStatus"], "running"),
      strict["equal"](v71["generationStartTime"], 15000),
      strict["equal"](v71["generationDuration"], null),
      strict["equal"](v71["rhTaskStatus"], "running"),
      strict["equal"](v71["rhTaskRecovering"], false),
      strict["equal"](v71["outputText"], "恢复暂停"));
  }),
  test("generationTaskRuntime: cancel builder receives remote cancel result and error", async () => {
    const v72 = createMockStore({
      "target-1": {
        id: "target-1",
        type: "source-image",
        rhTaskId: "rh-cancel-result-1",
        generationStartTime: 17000,
      },
      "target-2": {
        id: "target-2",
        type: "source-image",
        rhTaskId: "rh-cancel-error-1",
        generationStartTime: 17000,
      },
    });
    (await submitTask(
      baseSpec({
        targetNodeId: "target-1",
        waitForResult: false,
        submit: async () => ({ taskId: "rh-cancel-result-1" }),
        cancel: async () => ({ code: 0, msg: "remote ok" }),
        cancelledBuilder: ({ remoteResult: v73 }) => ({
          outputText: v73?.["msg"] || "",
        }),
      }),
      { store: v72, now: () => 17000 },
    ),
      await cancelTask("target-1", { store: v72, now: () => 17500 }),
      await submitTask(
        baseSpec({
          targetNodeId: "target-2",
          waitForResult: false,
          submit: async () => ({ taskId: "rh-cancel-error-1" }),
          cancel: async () => {
            throw new Error("remote\x20failed");
          },
          cancelledBuilder: ({ remoteError: v74 }) => ({
            outputText: v74?.["message"] || "",
          }),
        }),
        { store: v72, now: () => 18000 },
      ),
      await cancelTask("target-2", { store: v72, now: () => 18500 }),
      strict["equal"](
        v72["state"]["nodes"]["target-1"]["outputText"],
        "remote\x20ok",
      ),
      strict["equal"](
        v72["state"]["nodes"]["target-2"]["outputText"],
        "remote failed",
      ),
      strict["equal"](
        v72["state"]["nodes"]["target-1"]["jobStatus"],
        "cancelled",
      ),
      strict["equal"](
        v72["state"]["nodes"]["target-2"]["jobStatus"],
        "cancelled",
      ));
  }),
  test("generationTaskRuntime: local abort does not overwrite explicit cancel patch", async () => {
    const v75 = createMockStore({
      "target-1": {
        id: "target-1",
        type: "source-image",
        generationStartTime: 19000,
      },
    });
    let v76;
    const v77 = submitTask(
      baseSpec({
        submit: async () => ({ taskId: "rh-no-overwrite-1" }),
        poll: async () =>
          new Promise((v78, v79) => {
            v76 = v79;
          }),
        cancel: async () => ({ code: 0, msg: "remote ok" }),
        cancelledBuilder: () => ({ outputText: "late cancelled patch" }),
      }),
      { store: v75, now: () => 19000 },
    );
    (await new Promise((v80) => setTimeout(v80, 0)),
      await cancelTask("target-1", {
        store: v75,
        now: () => 19500,
        cancelledBuilder: () => ({ outputText: "remote cancel patch" }),
      }));
    const v81 = new Error("CANCELLED");
    ((v81["name"] = "AbortError"), v76(v81));
    const v82 = await v77,
      v83 = v75["state"]["nodes"]["target-1"];
    (strict["equal"](v82["status"], "cancelled"),
      strict["equal"](v83["jobStatus"], "cancelled"),
      strict["equal"](v83["outputText"], "remote cancel patch"));
  }),
  test("generationTaskRuntime:\x20submit\x20abort\x20can\x20pause\x20without\x20finalizing\x20duration", async () => {
    const v84 = createMockStore({
        "target-1": {
          id: "target-1",
          type: "source-image",
          generationStartTime: 20000,
          generationDuration: null,
        },
      }),
      v85 = new AbortController();
    let v86;
    const v87 = submitTask(
      baseSpec({
        pauseOnAbort: true,
        submit: async () => ({ taskId: "rh-submit-pause-1" }),
        poll: async () =>
          new Promise((v88, v89) => {
            v86 = v89;
          }),
      }),
      { store: v84, now: () => 20000, abortController: v85 },
    );
    (await new Promise((v90) => setTimeout(v90, 0)), v85["abort"]());
    const v91 = new Error("CANCELLED");
    ((v91["name"] = "AbortError"), v86(v91));
    const v92 = await v87,
      v93 = v84["state"]["nodes"]["target-1"];
    (strict["equal"](v92["status"], "paused"),
      strict["equal"](v93["isGenerating"], true),
      strict["equal"](v93["jobStatus"], "running"),
      strict["equal"](v93["rhTaskStatus"], "running"),
      strict["equal"](v93["generationDuration"], null));
  }),
  test("generationTaskRuntime: submit failure stores failure status", async () => {
    const v94 = createMockStore({
        "target-1": { id: "target-1", type: "source-image" },
      }),
      v95 = await submitTask(
        baseSpec({
          submit: async () => {
            throw new Error("boom");
          },
        }),
        { store: v94, now: () => 15000 },
      ),
      v96 = v94["state"]["nodes"]["target-1"];
    (strict["equal"](v95["ok"], false),
      strict["equal"](v96["isGenerating"], false),
      strict["equal"](v96["jobStatus"], "error"),
      strict["equal"](v96["jobError"], "boom"),
      strict["equal"](v96["rhTaskStatus"], "failed"));
  }),
  test("generationTaskRuntime: submit failure can normalize provider errors", async () => {
    const v97 = createMockStore({
      "target-1": { id: "target-1", type: "source-image" },
    });
    (await submitTask(
      baseSpec({
        parseError: (v98) => v98?.["getUserMessage"]?.(),
        submit: async () => {
          throw {
            message: "raw provider error",
            getUserMessage: () => "用户可读错误",
          };
        },
      }),
      { store: v97, now: () => 17000 },
    ),
      strict["equal"](
        v97["state"]["nodes"]["target-1"]["jobError"],
        "用户可读错误",
      ));
  }));
