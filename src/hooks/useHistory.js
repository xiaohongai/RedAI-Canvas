import {
  undo,
  redo,
  commit,
  onCommit,
  getHistoryInfo,
} from "../modules/history.js";
import appStore from "../core/stores/appStore.js";
let _canUndo = false,
  _canRedo = false,
  _listeners = [];
function _updateHistoryState() {
  const v0 = getHistoryInfo(),
    v1 = v0["undoCount"] >= 2,
    v2 = v0["redoCount"] > 0;
  (v1 !== _canUndo || v2 !== _canRedo) &&
    ((_canUndo = v1), (_canRedo = v2), _notifyListeners());
}
function _notifyListeners() {
  _listeners["forEach"]((v3) => {
    try {
      v3({ canUndo: _canUndo, canRedo: _canRedo });
    } catch (v4) {
      console["error"]("[useHistory] 监听者回调执行异常:", v4);
    }
  });
}
export function performUndo() {
  if (!canUndo()) return false;
  return (undo(), _updateHistoryState(), true);
}
export function performRedo() {
  if (!canRedo()) return false;
  return (redo(), _updateHistoryState(), true);
}
export function saveState(v5) {
  (commit(),
    _updateHistoryState(),
    v5 && console["log"]("[useHistory] 已保存状态: " + v5));
}
export function canUndo() {
  return _canUndo;
}
export function canRedo() {
  return _canRedo;
}
export function getHistoryState() {
  const v6 = getHistoryInfo();
  return { ...v6, canUndo: v6["undoCount"] >= 2, canRedo: v6["redoCount"] > 0 };
}
export function subscribeToHistory(v7) {
  return (
    _listeners["push"](v7),
    v7({ canUndo: _canUndo, canRedo: _canRedo }),
    () => {
      const v8 = _listeners["indexOf"](v7);
      v8 > -1 && _listeners["splice"](v8, 1);
    }
  );
}
export function batchWithHistory(v9, v10) {
  (appStore["batch"](() => {
    v9();
  }),
    saveState(v10));
}
export function withHistory(v11, v12) {
  return function (...v13) {
    const v14 = v11["apply"](this, v13);
    return (saveState(v12), v14);
  };
}
export function onHistoryCommit(v15) {
  return onCommit(v15);
}
export function clearHistory() {
  (commit(), _updateHistoryState());
}
export function initHistoryHook() {
  (saveState("初始状态"),
    onCommit(() => {
      _updateHistoryState();
    }),
    (window["v2History"] = {
      undo: performUndo,
      redo: performRedo,
      commit: saveState,
      canUndo: () => _canUndo,
      canRedo: () => _canRedo,
      getInfo: getHistoryState,
    }));
}
export function getHistorySnapshot() {
  return {
    ...getHistoryInfo(),
    canUndo: _canUndo,
    canRedo: _canRedo,
    listenerCount: _listeners["length"],
  };
}
