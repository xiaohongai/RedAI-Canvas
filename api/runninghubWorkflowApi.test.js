import test from "node:test";
import strict from "node:assert/strict";
import {
  queryRunninghubWorkflow,
  runRunninghubAiApp,
  runRunninghubWorkflow,
  resumeRunninghubWorkflowTask,
} from "./runninghubWorkflowApi.js";
function makeJsonResponse(v0, v1 = 200) {
  return {
    ok: v1 >= 200 && v1 < 300,
    status: v1,
    headers: {
      get(v2) {
        return String(v2 || "")["toLowerCase"]() === "content-type"
          ? "application/json"
          : null;
      },
    },
    json: async () => v0,
    text: async () => JSON["stringify"](v0),
  };
}
(test("runninghubWorkflowApi:\x20queryRunninghubWorkflow\x20透传\x20query\x20接口", async () => {
  const v3 = globalThis["fetch"];
  try {
    globalThis["fetch"] = async (v4, v5 = {}) => {
      if (String(v4) !== "/api/v2/runninghubwf/query")
        throw new Error("unexpected url: " + String(v4));
      const v6 = JSON["parse"](String(v5["body"] || "{}"));
      return (
        strict["equal"](v6["taskId"], "task-1"),
        makeJsonResponse({
          code: 0,
          data: [{ url: "https://cdn.example.com/v.mp4" }],
        })
      );
    };
    const v7 = await queryRunninghubWorkflow({ apiKey: "k", taskId: "task-1" });
    strict["equal"](v7["code"], 0);
  } finally {
    globalThis["fetch"] = v3;
  }
}),
  test("runninghubWorkflowApi: runRunninghubWorkflow 通过 header 传递 installId 且不污染远端 payload", async () => {
    const v8 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v9, v10 = {}) => {
        (strict["equal"](String(v9), "/api/v2/runninghubwf/run"),
          strict["equal"](
            v10["headers"]?.["X-AIC-Install-Id"],
            "install-wf-1",
          ));
        const v11 = JSON["parse"](String(v10["body"] || "{}"));
        return (
          strict["equal"](v11["workflowId"], "vip-flow"),
          strict["equal"](Object["hasOwn"](v11, "installId"), false),
          makeJsonResponse({ code: 0, data: { taskId: "task-wf-1" } })
        );
      };
      const v12 = await runRunninghubWorkflow({
        apiKey: "k",
        installId: "install-wf-1",
        workflowId: "vip-flow",
        nodeInfoList: [],
      });
      strict["equal"](v12["data"]["taskId"], "task-wf-1");
    } finally {
      globalThis["fetch"] = v8;
    }
  }),
  test("runninghubWorkflowApi: runRunninghubAiApp 可从 window.__aicInstallId 透传授权 installId", async () => {
    const v13 = globalThis["fetch"],
      v14 = globalThis["window"];
    try {
      ((globalThis["window"] = { __aicInstallId: "install-window-1" }),
        (globalThis["fetch"] = async (v15, v16 = {}) => {
          return (
            strict["equal"](String(v15), "/api/v2/proxy/image"),
            strict["equal"](
              v16["headers"]?.["X-AIC-Install-Id"],
              "install-window-1",
            ),
            makeJsonResponse({ task_id: "task-window-1" })
          );
        }));
      const v17 = await runRunninghubAiApp({
        apiKey: "k",
        appId: "2047787809091620866",
        nodeInfoList: [],
      });
      strict["equal"](v17["task_id"], "task-window-1");
    } finally {
      ((globalThis["fetch"] = v13), (globalThis["window"] = v14));
    }
  }),
  test("runninghubWorkflowApi: runRunninghubAiApp 通过代理提交 ai-app", async () => {
    const v18 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v19, v20 = {}) => {
        strict["equal"](String(v19), "/api/v2/proxy/image");
        const v21 = JSON["parse"](String(v20["body"] || "{}"));
        return (
          strict["equal"](
            v20["headers"]?.["X-AIC-Install-Id"],
            "install-tool-1",
          ),
          strict["equal"](
            v21["apiUrl"],
            "https://www.runninghub.cn/openapi/v2/run/ai-app/2047784060881211393",
          ),
          strict["equal"](v21["apiKey"], "k"),
          strict["equal"](v21["instanceType"], "default"),
          strict["equal"](v21["usePersonalQueue"], "false"),
          strict["equal"](Object["hasOwn"](v21, "appId"), false),
          strict["equal"](Object["hasOwn"](v21, "workflowId"), false),
          strict["equal"](Object["hasOwn"](v21, "installId"), false),
          strict["deepEqual"](v21["nodeInfoList"], [
            {
              nodeId: "4",
              fieldName: "video",
              fieldValue: "https://www.runninghub.cn/uploaded.mp4",
              description: "video",
            },
          ]),
          makeJsonResponse({ task_id: "task-frame-1", status: "submitted" })
        );
      };
      const v22 = await runRunninghubAiApp({
        apiKey: "k",
        installId: "install-tool-1",
        appId: "2047784060881211393",
        nodeInfoList: [
          {
            nodeId: "4",
            fieldName: "video",
            fieldValue: "https://www.runninghub.cn/uploaded.mp4",
            description: "video",
          },
        ],
        instanceType: "default",
        usePersonalQueue: "false",
      });
      strict["equal"](v22["task_id"], "task-frame-1");
    } finally {
      globalThis["fetch"] = v18;
    }
  }),
  test("runninghubWorkflowApi: resumeRunninghubWorkflowTask 可从 pending 轮询到成功", async () => {
    const v23 = globalThis["fetch"],
      v24 = globalThis["setTimeout"];
    let v25 = 0;
    try {
      ((globalThis["setTimeout"] = (v26, v27, ...v28) =>
        v24(v26, Number(v27) > 5000 ? Number(v27) : 0, ...v28)),
        (globalThis["fetch"] = async (v29) => {
          if (String(v29) !== "/api/v2/runninghubwf/query")
            throw new Error("unexpected url: " + String(v29));
          v25 += 1;
          if (v25 === 1) return makeJsonResponse({ code: 804, msg: "排队中" });
          return makeJsonResponse({
            code: 0,
            data: [{ url: "https://cdn.example.com/final.mp4" }],
          });
        }));
      const v30 = await resumeRunninghubWorkflowTask({
        apiKey: "k",
        taskId: "task-2",
      });
      (strict["equal"](v30["code"], 0),
        strict["ok"](Array["isArray"](v30["data"])),
        strict["equal"](v25 >= 2, true));
    } finally {
      ((globalThis["fetch"] = v23), (globalThis["setTimeout"] = v24));
    }
  }),
  test("runninghubWorkflowApi: resumeRunninghubWorkflowTask 支持 openapi query", async () => {
    const v31 = globalThis["fetch"],
      v32 = globalThis["setTimeout"],
      v33 = [];
    try {
      ((globalThis["setTimeout"] = (v34, v35, ...v36) =>
        v32(v34, Number(v35) > 5000 ? Number(v35) : 0, ...v36)),
        (globalThis["fetch"] = async (v37, v38 = {}) => {
          strict["equal"](String(v37), "/api/v2/proxy/image");
          const v39 = JSON["parse"](String(v38["body"] || "{}"));
          (v33["push"](v39),
            strict["equal"](
              v39["apiUrl"],
              "https://www.runninghub.cn/openapi/v2/query",
            ),
            strict["equal"](v39["apiKey"], "k"),
            strict["equal"](v39["taskId"], "task-frame-2"));
          if (v33["length"] === 1)
            return makeJsonResponse({ status: "RUNNING" });
          return makeJsonResponse({
            status: "COMPLETED",
            results: [{ videoUrl: "https://cdn.example.com/frame.mp4" }],
          });
        }));
      const v40 = await resumeRunninghubWorkflowTask(
        { apiKey: "k", taskId: "task-frame-2" },
        { useOpenapiQuery: true },
      );
      (strict["equal"](v40["status"], "COMPLETED"),
        strict["equal"](
          v40["results"][0]["videoUrl"],
          "https://cdn.example.com/frame.mp4",
        ),
        strict["equal"](v33["length"] >= 2, true));
    } finally {
      ((globalThis["fetch"] = v31), (globalThis["setTimeout"] = v32));
    }
  }),
  test("runninghubWorkflowApi: resumeRunninghubWorkflowTask 遇到失败态会抛错", async () => {
    const v41 = globalThis["fetch"],
      v42 = globalThis["setTimeout"];
    try {
      ((globalThis["setTimeout"] = (v43, v44, ...v45) =>
        v42(v43, Number(v44) > 5000 ? Number(v44) : 0, ...v45)),
        (globalThis["fetch"] = async (v46) => {
          if (String(v46) !== "/api/v2/runninghubwf/query")
            throw new Error("unexpected url: " + String(v46));
          return makeJsonResponse({
            code: 0,
            data: { status: "FAILED", message: "执行失败" },
          });
        }),
        await strict["rejects"](
          () => resumeRunninghubWorkflowTask({ apiKey: "k", taskId: "task-3" }),
          (v47) => String(v47?.["message"] || "")["includes"]("执行失败"),
        ));
    } finally {
      ((globalThis["fetch"] = v41), (globalThis["setTimeout"] = v42));
    }
  }),
  test("runninghubWorkflowApi: resumeRunninghubWorkflowTask 支持 abort", async () => {
    const v48 = globalThis["fetch"],
      v49 = globalThis["setTimeout"];
    try {
      ((globalThis["setTimeout"] = (v50, v51, ...v52) =>
        v49(v50, Number(v51) > 5000 ? Number(v51) : 0, ...v52)),
        (globalThis["fetch"] = async (v53) => {
          if (String(v53) !== "/api/v2/runninghubwf/query")
            throw new Error("unexpected url: " + String(v53));
          return makeJsonResponse({ code: 804, msg: "排队中" });
        }));
      const v54 = new AbortController();
      (setTimeout(() => v54["abort"](), 0),
        await strict["rejects"](
          () =>
            resumeRunninghubWorkflowTask(
              { apiKey: "k", taskId: "task-4" },
              { signal: v54["signal"] },
            ),
          (v55) => v55?.["message"] === "CANCELLED",
        ));
    } finally {
      ((globalThis["fetch"] = v48), (globalThis["setTimeout"] = v49));
    }
  }));
