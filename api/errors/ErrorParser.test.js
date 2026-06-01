import test from "node:test";
import strict from "node:assert/strict";
import {
  parseError,
  parseTaskError,
  parseNetworkError,
  parseBatchErrors,
  ApiError,
  ErrorType,
} from "./index.js";
(test("errors: parseError 通用解析-余额不足", () => {
  const v0 = parseError("unknown", { message: "余额不足" }, 400);
  (strict["ok"](v0 instanceof ApiError),
    strict["equal"](v0["type"], ErrorType["INSUFFICIENT_BALANCE"]),
    strict["equal"](v0["retryable"], false));
}),
  test("errors:\x20parseError\x20通用解析-鉴权失败", () => {
    const v1 = parseError("unknown", { message: "bad" }, 401);
    (strict["ok"](v1 instanceof ApiError),
      strict["equal"](v1["type"], ErrorType["AUTH_ERROR"]),
      strict["equal"](v1["retryable"], false));
  }),
  test("errors: parseError 通用解析-限流", () => {
    const v2 = parseError("unknown", { message: "rate limit" }, 429);
    (strict["ok"](v2 instanceof ApiError),
      strict["equal"](v2["type"], ErrorType["RATE_LIMIT"]),
      strict["equal"](v2["retryable"], true));
  }),
  test("errors: parseError 通用解析-内容过滤", () => {
    const v3 = parseError("unknown", { message: "safety\x20filtered" }, 400);
    (strict["ok"](v3 instanceof ApiError),
      strict["equal"](v3["type"], ErrorType["CONTENT_FILTERED"]),
      strict["equal"](v3["retryable"], false));
  }),
  test("errors: parseError 通用解析-HTTP 500", () => {
    const v4 = parseError("unknown", { message: "server error" }, 500);
    (strict["ok"](v4 instanceof ApiError),
      strict["equal"](v4["type"], ErrorType["SERVER_ERROR"]),
      strict["equal"](v4["retryable"], true));
  }),
  test("errors:\x20parseTaskError\x20通用检测", () => {
    const v5 = parseTaskError("grsai", { status: "failed", message: "x" });
    (strict["ok"](v5 instanceof ApiError),
      strict["equal"](v5["type"], ErrorType["TASK_FAILED"]),
      strict["ok"](String(v5["message"])["includes"]("x")));
  }),
  test("errors: parseTaskError grsai 优先展示 error 字段", () => {
    const v6 = parseTaskError("grsai", {
      status: "failed",
      failure_reason: "error",
      error:
        "The image format is incorrect. Please check if there are any issues with the image format",
    });
    (strict["ok"](v6 instanceof ApiError),
      strict["equal"](v6["type"], ErrorType["TASK_FAILED"]),
      strict["ok"](
        String(v6["message"])["includes"]("The image format is incorrect"),
      ));
  }),
  test("errors: parseTaskError grsai 在 pending + sensitive 时识别为内容违规", () => {
    const v7 = parseTaskError("grsai", {
      status: "pending",
      message:
        "The\x20input\x20or\x20output\x20was\x20flagged\x20as\x20sensitive.\x20Please\x20try\x20again\x20with\x20different\x20inputs.",
    });
    (strict["ok"](v7 instanceof ApiError),
      strict["equal"](v7["type"], ErrorType["CONTENT_FILTERED"]));
  }),
  test("errors: parseTaskError apimart 提取任务失败中的 error.message", () => {
    const v8 = parseTaskError("apimart", {
      status: "failed",
      error: {
        code: 400,
        message: "Seedance request rejected",
        type: "invalid_request",
      },
    });
    (strict["ok"](v8 instanceof ApiError),
      strict["equal"](v8["type"], ErrorType["TASK_FAILED"]),
      strict["ok"](
        String(v8["message"])["includes"]("Seedance request rejected"),
      ));
  }),
  test("errors: parseTaskError apimart 识别取消任务为终态失败", () => {
    const v9 = parseTaskError("apimart", { status: "cancelled" });
    (strict["ok"](v9 instanceof ApiError),
      strict["equal"](v9["type"], ErrorType["TASK_FAILED"]),
      strict["ok"](String(v9["message"])["includes"]("任务已取消")));
  }),
  test("errors:\x20parseNetworkError\x20-\x20timeout\x20/\x20dns\x20/\x20network", () => {
    const v10 = parseNetworkError(
      "grsai",
      { name: "AbortError", message: "" },
      1,
    );
    strict["equal"](v10["type"], ErrorType["TIMEOUT"]);
    const v11 = parseNetworkError(
      "grsai",
      new Error("getaddrinfo\x20ENOTFOUND\x20x"),
    );
    strict["equal"](v11["type"], ErrorType["DNS_ERROR"]);
    const v12 = parseNetworkError("grsai", new Error("Failed\x20to\x20fetch"));
    strict["equal"](v12["type"], ErrorType["NETWORK_ERROR"]);
  }),
  test("errors: parseBatchErrors 会标记 batchIndex", () => {
    const v13 = parseBatchErrors("grsai", [
      { success: false, error: "余额不足", status: 400 },
      { success: true },
      { success: false, error: { message: "rate limit" }, status: 429 },
    ]);
    (strict["equal"](v13["length"], 2),
      strict["equal"](v13[0]["batchIndex"], 0),
      strict["equal"](v13[1]["batchIndex"], 2));
  }),
  test("errors:\x20runninghub(模型API)\x20使用模型专用错误码映射", () => {
    const v14 = parseError("runninghub", { code: 1520 }, 200);
    (strict["ok"](v14 instanceof ApiError),
      strict["equal"](v14["type"], ErrorType["RATE_LIMIT"]),
      strict["equal"](v14["code"], 1520),
      strict["equal"](v14["retryable"], true));
  }),
  test("errors: runninghubwf(工作流) 保持原错误码映射", () => {
    const v15 = parseError("runninghubwf", { code: 810 }, 200);
    (strict["ok"](v15 instanceof ApiError),
      strict["equal"](v15["type"], ErrorType["INVALID_PARAMS"]),
      strict["equal"](v15["code"], 810));
  }),
  test("errors: runninghubwf 失败信息追加 failedReason 节点详情", () => {
    const v16 = parseTaskError("runninghubwf", {
      taskId: "2053162957067722754",
      status: "FAILED",
      errorCode: "805",
      errorMessage: "工作流运行失败",
      failedReason: { node_id: "992", exception_message: "Porn" },
    });
    (strict["ok"](v16 instanceof ApiError),
      strict["equal"](v16["type"], ErrorType["TASK_FAILED"]),
      strict["match"](v16["message"], /生成任务失败: 工作流运行失败/),
      strict["match"](v16["message"], /node_id: 992/),
      strict["match"](v16["message"], /exception_message: Porn/));
  }),
  test("errors: runninghubwf 数组快照失败也追加 failedReason 节点详情", () => {
    const v17 = parseError(
      "runninghubwf",
      {
        code: 0,
        data: [
          {
            status: "FAILED",
            errorMessage: "工作流运行失败",
            failedReason: { node_id: "992", exception_message: "Porn" },
          },
        ],
      },
      200,
    );
    (strict["ok"](v17 instanceof ApiError),
      strict["equal"](v17["type"], ErrorType["TASK_FAILED"]),
      strict["match"](v17["message"], /生成任务失败: 工作流运行失败/),
      strict["match"](v17["message"], /node_id: 992/),
      strict["match"](v17["message"], /exception_message: Porn/));
  }),
  test("errors: runninghub(模型API) parseTaskError 支持 data/errorCode=1501", () => {
    const v18 = parseTaskError("runninghub", {
      data: {
        status: "FAILED",
        errorCode: "1501",
        errorMessage: "CONTENT_SECURITY_AUDIT_FAILED",
      },
    });
    (strict["ok"](v18 instanceof ApiError),
      strict["equal"](v18["type"], ErrorType["CONTENT_FILTERED"]),
      strict["equal"](v18["code"], 1501));
  }),
  test("errors: runninghub(模型API) parseTaskError 支持 results[0].errorCode=1501", () => {
    const v19 = parseTaskError("runninghub", {
      status: "FAILED",
      results: [{ errorCode: "1501" }],
    });
    (strict["ok"](v19 instanceof ApiError),
      strict["equal"](v19["type"], ErrorType["CONTENT_FILTERED"]),
      strict["equal"](v19["code"], 1501));
  }),
  test("errors:\x20runninghub(模型API)\x20parseTaskError\x20对\x20submitted/pending\x20不应误判失败", () => {
    const v20 = parseTaskError("runninghub", { status: "submitted" }),
      v21 = parseTaskError("runninghub", { status: "pending" });
    (strict["equal"](v20, null), strict["equal"](v21, null));
  }));
