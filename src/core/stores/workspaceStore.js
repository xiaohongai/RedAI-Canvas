import { selectWorkspaceState } from "./domainSlices.js";
const WORKSPACE_ACTION_NAMES = Object["freeze"]([
  "batch",
  "requestRender",
  "invalidateUi",
  "setSubscriptionState",
  "addAsset",
  "deleteAsset",
  "updateAsset",
  "setWorkflowsLoading",
  "setWorkflows",
  "upsertWorkflow",
  "updateWorkflowLocal",
  "markWorkflowUsed",
  "setWorkflowUi",
  "setWorkflowDraft",
  "resetWorkflowDraft",
  "openWorkflowModal",
  "closeWorkflowModal",
  "setWorkflowSaving",
  "setWorkflowApplying",
]);
function bindCoreAction(v0, v1) {
  const v2 = v0?.[v1];
  if (typeof v2 !== "function") return undefined;
  return (...v3) => v2(...v3);
}
function createWorkspaceStore(v4) {
  if (!v4 || typeof v4 !== "object")
    throw new TypeError(
      "[workspaceStore] createWorkspaceStore() 需要传入有效的 coreStore",
    );
  const v5 = {
    subscribe(v6) {
      if (typeof v6 !== "function")
        throw new TypeError("[workspaceStore] subscribe() 的参数必须是函数");
      return v4["subscribe"]((v7) => v6(selectWorkspaceState(v7)));
    },
    subscribeRaw(v8) {
      if (typeof v8 !== "function")
        throw new TypeError("[workspaceStore] subscribeRaw() 的参数必须是函数");
      return v4["subscribeRaw"]((v9) => v8(selectWorkspaceState(v9)));
    },
    subscribeSelector(v10, v11, v12 = {}) {
      if (typeof v10 !== "function")
        throw new TypeError(
          "[workspaceStore] subscribeSelector() 的 selector 必须是函数",
        );
      if (typeof v11 !== "function")
        throw new TypeError(
          "[workspaceStore] subscribeSelector() 的 callback 必须是函数",
        );
      return v4["subscribeSelector"](
        (v13) => v10(selectWorkspaceState(v13)),
        v11,
        v12,
      );
    },
    getState() {
      return selectWorkspaceState(v4["getState"]());
    },
    getStateRaw() {
      return selectWorkspaceState(v4["getStateRaw"]());
    },
  };
  for (const v14 of WORKSPACE_ACTION_NAMES) {
    const v15 = bindCoreAction(v4, v14);
    if (v15) v5[v14] = v15;
  }
  return v5;
}
export { WORKSPACE_ACTION_NAMES, createWorkspaceStore };
