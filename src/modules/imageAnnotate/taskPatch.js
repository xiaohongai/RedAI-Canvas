import {
  normalizeProviderId,
  resolveModelExecution,
} from "../../manifests/index.js";
function resolveTaskModelExecution(v0, v1) {
  const v2 = normalizeProviderId(v1);
  return (
    resolveModelExecution(v0, { providerHint: v2 }) || resolveModelExecution(v0)
  );
}
function resolveTaskProviderIds(v3, v4) {
  const v5 = resolveTaskModelExecution(v3, v4);
  return [
    normalizeProviderId(v4),
    normalizeProviderId(v5?.["modelManifest"]?.["provider"]),
    normalizeProviderId(v5?.["executionManifest"]?.["provider"]),
  ]["filter"](Boolean);
}
export const isRunningHubTaskModel = (v6, v7) => {
  const v8 = resolveTaskProviderIds(v6, v7);
  return v8["includes"]("runninghub") || v8["includes"]("runninghubwf");
};
export const isRunningHubModelApiTaskModel = (v9, v10) => {
  const v11 = resolveTaskModelExecution(v9, v10),
    v12 = resolveTaskProviderIds(v9, v10);
  return (
    v12["includes"]("runninghub") &&
    v11?.["modelManifest"]?.["adapterType"] === "modelApi" &&
    v11?.["executionManifest"]?.["adapterType"] === "modelApi"
  );
};
export const isDreaminaTaskModel = (v13, v14) => {
  return resolveTaskProviderIds(v13, v14)["includes"]("dreamina");
};
export const buildRunningHubTaskPatch = ({
  taskId: taskId = "",
  status: status = "pending",
  startedAt: startedAt = 0,
  recovering: recovering = false,
  useOpenapiQuery: useOpenapiQuery = false,
} = {}) => ({
  rhTaskId: String(taskId || "")["trim"](),
  rhTaskStatus: String(status || "pending")["trim"]() || "pending",
  rhTaskStartedAt: Number(startedAt || 0),
  rhTaskRecovering: recovering === true,
  rhTaskUseOpenapiQuery: useOpenapiQuery === true,
});
export const buildDreaminaTaskPatch = ({
  submitId: submitId = "",
  status: status = "pending",
  phase: phase = "generating",
  label: label = "生成中",
  startedAt: startedAt = 0,
  recovering: recovering = false,
} = {}) => ({
  dreaminaSubmitId: String(submitId || "")["trim"](),
  dreaminaTaskStatus: String(status || "pending")["trim"]() || "pending",
  dreaminaTaskPhase: String(phase || "generating")["trim"]() || "generating",
  dreaminaTaskLabel: String(label || "生成中")["trim"]() || "生成中",
  dreaminaTaskStartedAt: Number(startedAt || 0),
  dreaminaTaskLastCheckedAt: Date["now"](),
  dreaminaTaskRecovering: recovering === true,
  dreaminaTaskLastRaw: {},
});
export const buildAsyncTaskPatch = ({
  provider: provider = "",
  kind: kind = "image",
  taskId: taskId = "",
  status: status = "pending",
  startedAt: startedAt = 0,
  recovering: recovering = false,
} = {}) => ({
  asyncTaskProvider: String(provider || "")["trim"](),
  asyncTaskKind: String(kind || "image")["trim"]() || "image",
  asyncTaskId: String(taskId || "")["trim"](),
  asyncTaskStatus: String(status || "pending")["trim"]() || "pending",
  asyncTaskStartedAt: Number(startedAt || 0),
  asyncTaskRecovering: recovering === true,
});
export const persistRunningHubResumeCache = () => {
  try {
    window["_triggerLocalCacheSave"]?.();
  } catch {}
};
