import { selectUiState } from "./domainSlices.js";
const UI_ACTION_NAMES = Object["freeze"]([
  "batch",
  "requestRender",
  "invalidateUi",
  "showPicker",
  "hidePicker",
  "showContextMenu",
  "hideContextMenu",
  "setPickConnectMode",
  "setPickConnectHover",
  "setServerConnection",
  "setAnnotateState",
  "setMattingState",
  "setVideoKeyingState",
  "setVideoClipState",
  "setTheme",
  "toggleTheme",
  "initTheme",
  "setFeatureSelection",
  "getFeatureSelection",
  "initFeatureSelections",
  "setShowVideoMeta",
  "setTitleFollowsCanvasZoom",
  "setPromptBoxResizeEnabled",
  "setImageVideoNodeResizeEnabled",
  "setImageToolbarLayout",
  "setVideoToolbarLayout",
  "setAlignFeatureEnabled",
  "setAlignFeatureTriggerMode",
  "setAlignDistributeGap",
  "setAlignPanelVisible",
  "setAlignPanelAnchorWorld",
  "setSnapGuidesEnabled",
  "setSelectionRelatedHighlightEnabled",
  "setSelectionRelatedHighlightColor",
  "setConnectionLinesVisible",
  "initUiPrefs",
]);
function bindCoreAction(v0, v1) {
  const v2 = v0?.[v1];
  if (typeof v2 !== "function") return undefined;
  return (...v3) => v2(...v3);
}
function createUiStore(v4) {
  if (!v4 || typeof v4 !== "object")
    throw new TypeError("[uiStore] createUiStore() 需要传入有效的 coreStore");
  const v5 = {
    subscribe(v6) {
      if (typeof v6 !== "function")
        throw new TypeError("[uiStore]\x20subscribe()\x20的参数必须是函数");
      return v4["subscribe"]((v7) => v6(selectUiState(v7)));
    },
    subscribeRaw(v8) {
      if (typeof v8 !== "function")
        throw new TypeError("[uiStore] subscribeRaw() 的参数必须是函数");
      return v4["subscribeRaw"]((v9) => v8(selectUiState(v9)));
    },
    subscribeSelector(v10, v11, v12 = {}) {
      if (typeof v10 !== "function")
        throw new TypeError(
          "[uiStore] subscribeSelector() 的 selector 必须是函数",
        );
      if (typeof v11 !== "function")
        throw new TypeError(
          "[uiStore] subscribeSelector() 的 callback 必须是函数",
        );
      return v4["subscribeSelector"](
        (v13) => v10(selectUiState(v13)),
        v11,
        v12,
      );
    },
    getState() {
      return selectUiState(v4["getState"]());
    },
    getStateRaw() {
      return selectUiState(v4["getStateRaw"]());
    },
  };
  for (const v14 of UI_ACTION_NAMES) {
    const v15 = bindCoreAction(v4, v14);
    if (v15) v5[v14] = v15;
  }
  return v5;
}
export { UI_ACTION_NAMES, createUiStore };
