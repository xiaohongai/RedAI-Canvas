const RUNNING_STATUSES = new Set([
    "running",
    "processing",
    "generating",
    "in_progress",
    "in-progress",
  ]),
  QUEUED_STATUSES = new Set([
    "pending",
    "queued",
    "queueing",
    "waiting",
    "submitted",
  ]),
  SUBMITTING_STATUSES = new Set(["submitting", "submit"]),
  SUCCESS_STATUSES = new Set([
    "success",
    "succeeded",
    "completed",
    "complete",
    "done",
    "finished",
    "finish",
  ]),
  ERROR_STATUSES = new Set(["error", "failed", "fail"]),
  CANCELLED_STATUSES = new Set(["cancelled", "canceled"]),
  RECOVERING_FIELDS = Object["freeze"]([
    "rhTaskRecovering",
    "dreaminaTaskRecovering",
    "asyncTaskRecovering",
  ]),
  STATUS_FIELDS = Object["freeze"]([
    "jobStatus",
    "rhTaskStatus",
    "dreaminaTaskStatus",
    "dreaminaTaskPhase",
    "asyncTaskStatus",
    "mediaTaskStatus",
  ]),
  MESSAGE_FIELDS = Object["freeze"]([
    "jobError",
    "rhStatusMessage",
    "dreaminaTaskLabel",
    "asyncTaskError",
    "mediaTaskError",
    "error",
    "statusMessage",
  ]),
  IDLE_STATUSES = new Set(["idle", ""]);
function normalizeStatus(v0) {
  return String(v0 || "")
    ["trim"]()
    ["toLowerCase"]();
}
function isNonIdleStatus(v1) {
  return !IDLE_STATUSES["has"](normalizeStatus(v1));
}
function hasActiveTaskFamily(v2) {
  if (!v2 || typeof v2 !== "object") return false;
  return (
    v2["rhTaskRecovering"] === true ||
    v2["dreaminaTaskRecovering"] === true ||
    v2["asyncTaskRecovering"] === true ||
    !!String(v2["rhTaskId"] || "")["trim"]() ||
    !!String(v2["dreaminaSubmitId"] || "")["trim"]() ||
    !!String(v2["asyncTaskId"] || "")["trim"]() ||
    isNonIdleStatus(v2["rhTaskStatus"]) ||
    isNonIdleStatus(v2["dreaminaTaskStatus"]) ||
    isNonIdleStatus(v2["asyncTaskStatus"])
  );
}
function collectStatuses(v3) {
  if (!v3 || typeof v3 !== "object") return [];
  if (hasActiveTaskFamily(v3)) {
    const v4 = [v3["jobStatus"]];
    return (
      (v3["rhTaskRecovering"] === true ||
        !!String(v3["rhTaskId"] || "")["trim"]() ||
        isNonIdleStatus(v3["rhTaskStatus"])) &&
        v4["push"](v3["rhTaskStatus"]),
      (v3["dreaminaTaskRecovering"] === true ||
        !!String(v3["dreaminaSubmitId"] || "")["trim"]() ||
        isNonIdleStatus(v3["dreaminaTaskStatus"])) &&
        v4["push"](v3["dreaminaTaskStatus"], v3["dreaminaTaskPhase"]),
      (v3["asyncTaskRecovering"] === true ||
        !!String(v3["asyncTaskId"] || "")["trim"]() ||
        isNonIdleStatus(v3["asyncTaskStatus"])) &&
        v4["push"](v3["asyncTaskStatus"]),
      v4["map"](normalizeStatus)["filter"](Boolean)
    );
  }
  return STATUS_FIELDS["map"]((v5) => normalizeStatus(v3[v5]))["filter"](
    Boolean,
  );
}
function hasAnyStatus(v6, v7) {
  return v6["some"]((v8) => v7["has"](v8));
}
function hasRecoveringFlag(v9) {
  if (!v9 || typeof v9 !== "object") return false;
  return RECOVERING_FIELDS["some"]((v10) => v9[v10] === true);
}
export function resolveGenerationUiState(v11) {
  const v12 = collectStatuses(v11);
  if (hasAnyStatus(v12, ERROR_STATUSES)) return "error";
  if (hasAnyStatus(v12, CANCELLED_STATUSES)) return "cancelled";
  if (hasAnyStatus(v12, SUCCESS_STATUSES)) return "success";
  if (hasRecoveringFlag(v11)) return "recovering";
  if (hasAnyStatus(v12, RUNNING_STATUSES)) return "running";
  if (hasAnyStatus(v12, QUEUED_STATUSES)) return "queued";
  if (hasAnyStatus(v12, SUBMITTING_STATUSES)) return "submitting";
  if (v11?.["isGenerating"] === true) return "running";
  return "idle";
}
export function isTaskRunning(v13) {
  return ["submitting", "queued", "running", "recovering"]["includes"](
    resolveGenerationUiState(v13),
  );
}
export function isTaskTerminal(v14) {
  return ["success", "error", "cancelled"]["includes"](
    resolveGenerationUiState(v14),
  );
}
export function isTaskFailed(v15) {
  return resolveGenerationUiState(v15) === "error";
}
export function isTaskCancelled(v16) {
  return resolveGenerationUiState(v16) === "cancelled";
}
export function shouldShowGenerationBusyUi(v17) {
  return isTaskRunning(v17);
}
export function shouldShowGenerationResultLoadingUi(
  v18,
  { hasResult: hasResult = false } = {},
) {
  return hasResult !== true && shouldShowGenerationBusyUi(v18);
}
export function shouldAllowCancel(
  v19,
  {
    cancellable: cancellable = false,
    cancelInFlight: cancelInFlight = false,
  } = {},
) {
  return cancellable === true && isTaskRunning(v19) && cancelInFlight !== true;
}
export function resolveGenerationButtonMode(
  v20,
  {
    cancellable: cancellable = false,
    cancelInFlight: cancelInFlight = false,
  } = {},
) {
  const v21 = resolveGenerationUiState(v20),
    v22 = isTaskRunning(v20),
    v23 = shouldAllowCancel(v20, {
      cancellable: cancellable,
      cancelInFlight: cancelInFlight,
    });
  return {
    state: v21,
    busy: v22,
    canCancel: v23,
    disabled: v22 ? !v23 || cancelInFlight === true : false,
    cursor:
      v22 && (!v23 || cancelInFlight === true)
        ? "var(--unavailable-cursor)"
        : "",
  };
}
export function getTaskMessage(v24) {
  if (!v24 || typeof v24 !== "object") return "";
  for (const v25 of MESSAGE_FIELDS) {
    const v26 = String(v24[v25] || "")["trim"]();
    if (v26) return v26;
  }
  return "";
}
export function isDreaminaTaskTerminal(v27) {
  const v28 = [
    normalizeStatus(v27?.["dreaminaTaskStatus"]),
    normalizeStatus(v27?.["dreaminaTaskPhase"]),
  ]["filter"](Boolean);
  return (
    hasAnyStatus(v28, ERROR_STATUSES) ||
    hasAnyStatus(v28, CANCELLED_STATUSES) ||
    hasAnyStatus(v28, SUCCESS_STATUSES)
  );
}
