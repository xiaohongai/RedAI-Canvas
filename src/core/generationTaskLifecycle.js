const TASK_TERMINAL_STATUS = new Set([
    "success",
    "succeeded",
    "completed",
    "complete",
    "done",
    "finished",
    "finish",
    "failed",
    "fail",
    "error",
    "cancelled",
    "canceled",
    "idle",
  ]),
  TASK_FAILURE_STATUS = new Set(["failed", "fail", "error"]),
  TASK_CANCELLED_STATUS = new Set(["cancelled", "canceled"]);
function normalizeStatus(v0) {
  return String(v0 || "")
    ["trim"]()
    ["toLowerCase"]();
}
function buildGenerationDurationPatch({
  startedAt: startedAt = 0,
  duration: duration = null,
} = {}) {
  const v1 = Number(duration);
  if (
    duration !== null &&
    duration !== undefined &&
    Number["isFinite"](v1) &&
    v1 >= 0
  )
    return { generationDuration: v1 };
  const v2 = Number(startedAt);
  if (Number["isFinite"](v2) && v2 > 0)
    return { generationDuration: Math["max"](0, Date["now"]() - v2) };
  return {};
}
export function isGenerationTaskTerminalStatus(v3) {
  return TASK_TERMINAL_STATUS["has"](normalizeStatus(v3));
}
export function isGenerationTaskFailureStatus(v4) {
  return TASK_FAILURE_STATUS["has"](normalizeStatus(v4));
}
export function isGenerationTaskCancelledStatus(v5) {
  return TASK_CANCELLED_STATUS["has"](normalizeStatus(v5));
}
export function resolveJobStatusFromTaskStatus(v6, v7 = null) {
  const v8 = normalizeStatus(v6);
  if (TASK_FAILURE_STATUS["has"](v8)) return "error";
  if (TASK_CANCELLED_STATUS["has"](v8)) return "cancelled";
  if (
    v8 === "success" ||
    v8 === "succeeded" ||
    v8 === "completed" ||
    v8 === "complete" ||
    v8 === "done" ||
    v8 === "finished" ||
    v8 === "finish"
  )
    return "success";
  if (v8 === "idle") return v7;
  return v7;
}
export function buildGenerationStartPatch({
  startedAt: startedAt = Date["now"](),
} = {}) {
  return {
    isGenerating: true,
    jobStatus: "running",
    jobError: null,
    generationStartTime: Number(startedAt || 0) || Date["now"](),
    generationDuration: null,
  };
}
export function buildGenerationSuccessPatch({
  startedAt: startedAt = 0,
  duration: duration = null,
} = {}) {
  return {
    isGenerating: false,
    jobStatus: "success",
    jobError: null,
    ...buildGenerationDurationPatch({
      startedAt: startedAt,
      duration: duration,
    }),
  };
}
export function buildGenerationFailurePatch({
  error: error = "",
  startedAt: startedAt = 0,
  duration: duration = null,
} = {}) {
  const v9 = String(error || "生成失败")["trim"]() || "生成失败";
  return {
    isGenerating: false,
    jobStatus: "error",
    jobError: v9,
    ...buildGenerationDurationPatch({
      startedAt: startedAt,
      duration: duration,
    }),
  };
}
export function buildGenerationCancelledPatch({
  startedAt: startedAt = 0,
  duration: duration = null,
} = {}) {
  return {
    isGenerating: false,
    jobStatus: "cancelled",
    jobError: null,
    ...buildGenerationDurationPatch({
      startedAt: startedAt,
      duration: duration,
    }),
  };
}
