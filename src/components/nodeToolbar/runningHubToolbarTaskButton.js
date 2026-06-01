import { cancelRunningHubTask } from "../../../api/runninghubTaskApi.js";
import { ensureConfig, getProviderConfig } from "../../../api/configApi.js";
import appStore from "../../core/stores/appStore.js";
import {
  isTaskCancelled,
  isTaskRunning,
} from "../../core/generationTaskUiState.js";
import { cancelTask as cancelTask } from "../../core/generationTaskRuntime.js";
import { GENERATE_CANCEL_ICON_HTML } from "../../modules/previewGenerateButtonUi.js";
import {
  normalizeProviderId,
  resolveModelExecution,
} from "../../manifests/index.js";
import {
  bindToolbarTaskButton,
  findToolbarTaskForNode,
  notifyToolbarTasksChanged,
} from "../shared/taskToolbarPresenter.js";
export const RUNNING_HUB_TOOLBAR_TASK_EVENT =
  "aicanvas:runninghub-toolbar-task-change";
export const RUNNING_HUB_CANCEL_ICON_HTML = GENERATE_CANCEL_ICON_HTML;
function getStateSnapshot() {
  return typeof appStore["getStateRaw"] === "function"
    ? appStore["getStateRaw"]()
    : appStore["getState"]();
}
function normalizeList(v0) {
  return Array["isArray"](v0)
    ? v0["map"]((v1) => String(v1 || "")["trim"]())["filter"](Boolean)
    : [];
}
function includesAny(v2, v3) {
  const v4 = String(v2 || "");
  return v3["some"]((v5) => v4["includes"](v5));
}
function getTaskTime(v6) {
  return (
    Number(v6?.["rhTaskStartedAt"] || v6?.["generationStartTime"] || 0) || 0
  );
}
function isRunningHubTaskProvider(v7) {
  const v8 = normalizeProviderId(v7?.["provider"]);
  if (v8 === "runninghubwf" || v8 === "runninghub") return true;
  const v9 = String(v7?.["model"] || "")["trim"]();
  if (!v9) return false;
  const v10 = resolveModelExecution(v9, { providerHint: v8 }),
    v11 = normalizeProviderId(v10?.["modelManifest"]?.["provider"]),
    v12 = normalizeProviderId(v10?.["executionManifest"]?.["provider"]);
  return (
    v11 === "runninghubwf" ||
    v11 === "runninghub" ||
    v12 === "runninghubwf" ||
    v12 === "runninghub"
  );
}
function hasRunningHubTaskMarker(v13) {
  return (
    isRunningHubTaskProvider(v13) ||
    !!String(v13?.["rhTaskId"] || "")["trim"]() ||
    !!String(v13?.["rhTaskStatus"] || "")["trim"]() ||
    !!String(v13?.["rhSourceNodeId"] || "")["trim"]() ||
    !!String(v13?.["rhToolbarTaskType"] || "")["trim"]()
  );
}
export function notifyRunningHubToolbarTasksChanged(v14 = {}) {
  notifyToolbarTasksChanged(v14, { eventName: RUNNING_HUB_TOOLBAR_TASK_EVENT });
}
export function isRunningHubToolbarTaskNode(v15) {
  if (!v15 || typeof v15 !== "object") return false;
  return hasRunningHubTaskMarker(v15) && isTaskRunning(v15);
}
export function isRunningHubToolbarTaskCancelled(v16) {
  const v17 = String(v16 || "")["trim"]();
  if (!v17) return false;
  const v18 = getStateSnapshot()["nodes"]?.[v17];
  return hasRunningHubTaskMarker(v18) && isTaskCancelled(v18);
}
export function findRunningHubToolbarTaskForNode(
  v19,
  {
    models: models = [],
    taskTypes: taskTypes = [],
    outputTextIncludes: outputTextIncludes = [],
    nameIncludes: nameIncludes = [],
    sourceField: sourceField = "rhSourceNodeId",
  } = {},
) {
  const v20 = findToolbarTaskForNode(v19, {
    models: models,
    taskTypes: taskTypes,
    outputTextIncludes: outputTextIncludes,
    nameIncludes: nameIncludes,
    sourceField: sourceField,
    taskTypeField: "rhToolbarTaskType",
    isTaskNode: isRunningHubToolbarTaskNode,
  });
  return v20 ? { ...v20, cancellable: true, resumable: true } : null;
}
export function bindRunningHubToolbarTaskButton({
  button: v21,
  getTask: v22,
  cancelTask: v23,
  cancelTooltip: cancelTooltip = "取消任务",
  eventTypes: eventTypes = ["click"],
} = {}) {
  return bindToolbarTaskButton({
    button: v21,
    getTask: v22,
    cancelTask: v23,
    cancelTooltip: cancelTooltip,
    eventTypes: eventTypes,
    eventName: RUNNING_HUB_TOOLBAR_TASK_EVENT,
    cancelIconHtml: RUNNING_HUB_CANCEL_ICON_HTML,
  });
}
async function resolveRunningHubWorkflowApiKey() {
  try {
    return (
      await ensureConfig(),
      String(getProviderConfig("runninghubwf")?.["apiKey"] || "")["trim"]()
    );
  } catch {
    return "";
  }
}
export async function cancelRunningHubRemoteTaskQuietly({
  apiKey: v24,
  taskId: v25,
  label: v26,
} = {}) {
  const v27 =
      String(v24 || "")["trim"]() || (await resolveRunningHubWorkflowApiKey()),
    v28 = String(v25 || "")["trim"]();
  if (!v27 || !v28) return false;
  try {
    return (await cancelRunningHubTask({ apiKey: v27, taskId: v28 }), true);
  } catch (v29) {
    return (
      console["warn"](
        "[" + (v26 || "RunningHubToolbarTask") + "] cancel request failed:",
        v29,
      ),
      false
    );
  }
}
export async function cancelRunningHubResultTask(
  v30,
  {
    name: v31,
    outputText: v32,
    notifyMessage: notifyMessage = "已取消任务",
    notify: notify = true,
  } = {},
) {
  const v33 = String(v30?.["outId"] || v30?.["node"]?.["id"] || "")["trim"]();
  if (!v33) return false;
  const v34 = getStateSnapshot()["nodes"]?.[v33];
  if (!v34) return false;
  const v35 = String(v30?.["taskId"] || v34["rhTaskId"] || "")["trim"]();
  (await cancelTask(v33, {
    store: appStore,
    cancellable: true,
    taskId: v35,
    spec: { provider: "runninghubwf", adapterType: "workflow" },
    cancel: async ({ taskId: v36 }) => {
      await cancelRunningHubRemoteTaskQuietly({
        apiKey: v30?.["apiKey"],
        taskId: v36,
        label: "RunningHubToolbarTaskButton",
      });
    },
  }),
    appStore["updateNodeData"](v33, {
      name: v31 || v34["name"],
      outputText: v32 || v34["outputText"],
    }),
    notifyRunningHubToolbarTasksChanged({
      outId: v33,
      sourceNodeId: String(
        v34["rhSourceNodeId"] || v30?.["sourceNodeId"] || "",
      ),
    }),
    window["_triggerLocalCacheSave"]?.());
  if (notify) window["showToast"]?.(notifyMessage, "info");
  return true;
}
