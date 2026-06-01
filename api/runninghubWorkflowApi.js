import { post as post } from "./requester.js";
import { runTaskSingleFlight } from "./taskSingleFlight.js";
const RH_PENDING_CODES = new Set([804, 813]),
  RH_SUCCESS_STATUSES = new Set(["COMPLETED", "SUCCEEDED", "SUCCESS"]),
  RH_PENDING_STATUSES = new Set([
    "RUNNING",
    "PENDING",
    "QUEUED",
    "PROCESSING",
    "",
  ]),
  RH_FAILED_STATUSES = new Set(["FAILED", "FAIL", "ERROR", "CANCELLED"]);
function normalizeRhStatus(v0) {
  return String(v0 || "")
    ["trim"]()
    ["toUpperCase"]();
}
function getRhStatus(v1) {
  const v2 =
    v1?.["data"] &&
    typeof v1["data"] === "object" &&
    !Array["isArray"](v1["data"])
      ? v1["data"]
      : v1;
  return normalizeRhStatus(
    v2?.["status"] || v1?.["status"] || v1?.["taskStatus"],
  );
}
function getRhErrorMessage(v3, v4) {
  return String(
    v3?.["msg"] ||
      v3?.["message"] ||
      v3?.["error"] ||
      v3?.["failure_reason"] ||
      v4,
  );
}
function hasRhResult(v5) {
  if (typeof v5 === "string") return !!v5["trim"]();
  if (Array["isArray"](v5?.["data"]))
    return v5["data"]["some"]((v6) => hasRhResult(v6));
  const v7 =
    v5?.["data"] &&
    typeof v5["data"] === "object" &&
    !Array["isArray"](v5["data"])
      ? v5["data"]
      : v5;
  if (Array["isArray"](v7?.["results"]))
    return v7["results"]["some"]((v8) => hasRhResult(v8));
  return !!(
    v7?.["url"] ||
    v7?.["videoUrl"] ||
    v7?.["fileUrl"] ||
    v7?.["download_url"]
  );
}
function getInstallId(v9) {
  return String(
    v9?.["installId"] ||
      globalThis["window"]?.["__aicInstallId"] ||
      globalThis["__aicInstallId"] ||
      "",
  )["trim"]();
}
function buildInstallIdHeaders(v10) {
  const v11 = getInstallId(v10);
  return v11 ? { "X-AIC-Install-Id": v11 } : {};
}
export async function runRunninghubWorkflow(v12, v13 = {}) {
  const { installId: v14, ...v15 } = v12 || {},
    v16 = await post("/api/v2/runninghubwf/run", v15, {
      provider: "runninghubwf",
      signal: v13?.["signal"],
      headers: buildInstallIdHeaders(v12),
    });
  return v16;
}
export async function runRunninghubAiApp(v17, v18 = {}) {
  const v19 = String(v17?.["appId"] || v17?.["workflowId"] || "")["trim"](),
    v20 = String(v17?.["apiKey"] || "")["trim"]();
  if (!v19) throw new Error("缺少 RunningHub appId");
  if (!v20) throw new Error("RunningHub API Key 未配置");
  const { appId: v21, workflowId: v22, installId: v23, ...v24 } = v17 || {},
    v25 = await post(
      "/api/v2/proxy/image",
      {
        ...v24,
        apiUrl: "https://www.runninghub.cn/openapi/v2/run/ai-app/" + v19,
        apiKey: v20,
      },
      {
        provider: "runninghubwf",
        signal: v18?.["signal"],
        headers: buildInstallIdHeaders(v17),
        timeout: 900000,
      },
    );
  return v25;
}
export async function queryRunninghubWorkflow(v26, v27 = {}) {
  const v28 = v27?.["useOpenapiQuery"] === true,
    v29 = await post(
      v28 ? "/api/v2/proxy/image" : "/api/v2/runninghubwf/query",
      v28
        ? {
            apiUrl: "https://www.runninghub.cn/openapi/v2/query",
            ...(v26 || {}),
          }
        : v26 || {},
      { provider: "runninghubwf", signal: v27?.["signal"] },
    );
  return v29;
}
export async function resumeRunninghubWorkflowTask(v30, v31 = {}) {
  const v32 = String(v30?.["apiKey"] || "")["trim"](),
    v33 = String(v30?.["taskId"] || "")["trim"]();
  if (!v32) throw new Error("RunningHub\x20API\x20Key\x20未配置");
  if (!v33) throw new Error("缺少 RunningHub 任务ID");
  return runTaskSingleFlight(
    {
      provider: "runninghubwf",
      kind:
        String(v31?.["taskKind"] || v31?.["kind"] || "video")["trim"]() ||
        "video",
      taskId: v33,
    },
    async () =>
      resumeRunninghubWorkflowTaskOnce({ apiKey: v32, taskId: v33 }, v31),
  );
}
async function resumeRunninghubWorkflowTaskOnce(v34, v35 = {}) {
  const v36 = String(v34?.["apiKey"] || "")["trim"](),
    v37 = String(v34?.["taskId"] || "")["trim"](),
    v38 = Math["max"](0, Number(v35?.["pollIntervalMs"]) || 2000),
    v39 = Math["max"](1, Number(v35?.["maxPolls"]) || 600);
  for (let v40 = 0; v40 < v39; v40++) {
    if (v35?.["signal"]?.["aborted"]) throw new Error("CANCELLED");
    if (v38 > 0) {
      await new Promise((v41) => setTimeout(v41, v38));
      if (v35?.["signal"]?.["aborted"]) throw new Error("CANCELLED");
    }
    const v42 = await queryRunninghubWorkflow(
        { apiKey: v36, taskId: v37 },
        {
          signal: v35?.["signal"],
          useOpenapiQuery: v35?.["useOpenapiQuery"] === true,
        },
      ),
      v43 = typeof v42?.["code"] === "number" ? v42["code"] : null;
    if (v43 !== null && RH_PENDING_CODES["has"](v43)) continue;
    if (v43 !== null && v43 !== 0)
      throw new Error(
        getRhErrorMessage(v42, "任务轮询失败 (code: " + v43 + ")"),
      );
    const v44 = getRhStatus(v42);
    if (RH_FAILED_STATUSES["has"](v44))
      throw new Error(getRhErrorMessage(v42, "任务执行失败"));
    if (RH_SUCCESS_STATUSES["has"](v44) || hasRhResult(v42)) return v42;
    if (RH_PENDING_STATUSES["has"](v44)) continue;
  }
  throw new Error("任务超时，请稍后重试");
}
