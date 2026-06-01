import appStore from "../../core/stores/appStore.js";
import {
  isTaskCancelled,
  isTaskRunning,
} from "../../core/generationTaskUiState.js";
import { GENERATE_CANCEL_ICON_HTML } from "../../modules/previewGenerateButtonUi.js";
export const TASK_TOOLBAR_EVENT = "aicanvas:generation-toolbar-task-change";
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
    Number(
      v6?.["rhTaskStartedAt"] ||
        v6?.["asyncTaskStartedAt"] ||
        v6?.["generationStartTime"] ||
        0,
    ) || 0
  );
}
function defaultIsTaskNode(v7) {
  return !!v7 && typeof v7 === "object" && isTaskRunning(v7);
}
export function notifyToolbarTasksChanged(
  v8 = {},
  { eventName: eventName = TASK_TOOLBAR_EVENT } = {},
) {
  try {
    window["dispatchEvent"]?.(new CustomEvent(eventName, { detail: v8 }));
  } catch {}
}
export function isToolbarTaskCancelled(
  v9,
  { isTaskNode: isTaskNode = defaultIsTaskNode } = {},
) {
  const v10 = String(v9 || "")["trim"]();
  if (!v10) return false;
  const v11 = getStateSnapshot()["nodes"]?.[v10];
  return !!v11 && isTaskNode(v11) === false ? false : isTaskCancelled(v11);
}
export function findToolbarTaskForNode(
  v12,
  {
    models: models = [],
    taskTypes: taskTypes = [],
    outputTextIncludes: outputTextIncludes = [],
    nameIncludes: nameIncludes = [],
    sourceField: sourceField = "rhSourceNodeId",
    taskTypeField: taskTypeField = "rhToolbarTaskType",
    isTaskNode: isTaskNode = defaultIsTaskNode,
  } = {},
) {
  const v13 = String(v12 || "")["trim"]();
  if (!v13) return null;
  const v14 = new Set(
      normalizeList(models)["map"]((v15) => v15["toLowerCase"]()),
    ),
    v16 = new Set(normalizeList(taskTypes)),
    v17 = normalizeList(outputTextIncludes),
    v18 = normalizeList(nameIncludes),
    v19 = Object["values"](getStateSnapshot()["nodes"] || {})
      ["filter"]((v20) => {
        if (!v20 || typeof v20 !== "object") return false;
        if (!isTaskNode(v20)) return false;
        const v21 =
          String(v20["id"] || "") === v13 ||
          String(v20[sourceField] || "") === v13;
        if (!v21) return false;
        if (v14["size"]) {
          const v22 = String(v20["model"] || "")
            ["trim"]()
            ["toLowerCase"]();
          if (!v14["has"](v22)) return false;
        }
        const v23 =
            v16["size"] > 0 &&
            v16["has"](String(v20[taskTypeField] || "")["trim"]()),
          v24 = v17["length"] > 0 && includesAny(v20["outputText"], v17),
          v25 = v18["length"] > 0 && includesAny(v20["name"], v18),
          v26 = v16["size"] > 0 || v17["length"] > 0 || v18["length"] > 0;
        return !v26 || v23 || v24 || v25;
      })
      ["sort"]((v27, v28) => getTaskTime(v28) - getTaskTime(v27)),
    v29 = v19[0] || null;
  if (!v29) return null;
  return {
    sourceNodeId: String(v29[sourceField] || ""),
    outId: String(v29["id"] || ""),
    targetNodeId: String(v29["id"] || ""),
    taskId: String(v29["rhTaskId"] || v29["asyncTaskId"] || ""),
    apiKey: "",
    node: v29,
    fromStore: true,
  };
}
export function bindToolbarTaskButton({
  button: v30,
  getTask: v31,
  cancelTask: v32,
  cancelTooltip: cancelTooltip = "取消任务",
  eventTypes: eventTypes = ["click"],
  eventName: eventName = TASK_TOOLBAR_EVENT,
  cancelIconHtml: cancelIconHtml = GENERATE_CANCEL_ICON_HTML,
} = {}) {
  if (!v30 || typeof v31 !== "function") return () => {};
  const v33 = {
    html: v30["innerHTML"],
    color: v30["style"]?.["color"] || "",
    tooltip: v30["dataset"]?.["tooltip"],
    aria: v30["getAttribute"]?.("aria-label") || "",
    title: v30["title"] || "",
  };
  let v34 = "";
  const v35 = () => {
      const v36 = v31() || null;
      v34 = String(v36?.["outId"] || v36?.["targetNodeId"] || "");
      const v37 = !!v34;
      v30["classList"]?.["toggle"]?.("is-task-cancel", v37);
      if (v37) {
        v30["innerHTML"] = cancelIconHtml;
        if (v30["dataset"]) v30["dataset"]["tooltip"] = cancelTooltip;
        (v30["setAttribute"]?.("aria-label", cancelTooltip),
          (v30["title"] = cancelTooltip));
        return;
      }
      v30["innerHTML"] = v33["html"];
      if (v30["style"]) v30["style"]["color"] = v33["color"] || "";
      if (v30["dataset"]) {
        if (v33["tooltip"] == null) delete v30["dataset"]["tooltip"];
        else v30["dataset"]["tooltip"] = v33["tooltip"];
      }
      if (v33["aria"]) v30["setAttribute"]?.("aria-label", v33["aria"]);
      else v30["removeAttribute"]?.("aria-label");
      v30["title"] = v33["title"] || "";
    },
    v38 = (v39) => {
      const v40 = v31() || null;
      if (!v40) return;
      (v39["preventDefault"]?.(),
        v39["stopPropagation"]?.(),
        v39["stopImmediatePropagation"]?.(),
        void Promise["resolve"](v32?.(v40))["finally"](v35));
    },
    v41 = normalizeList(eventTypes);
  v41["forEach"]((v42) => {
    v30["addEventListener"]?.(v42, v38, true);
  });
  const v43 =
    typeof appStore["subscribeSelector"] === "function"
      ? appStore["subscribeSelector"]((v44) => v44["nodes"], v35)
      : null;
  return (
    window["addEventListener"]?.(eventName, v35),
    v35(),
    () => {
      (v41["forEach"]((v45) => {
        v30["removeEventListener"]?.(v45, v38, true);
      }),
        v43?.(),
        window["removeEventListener"]?.(eventName, v35),
        v34 && ((v34 = ""), v35()));
    }
  );
}
