import appStore from "../core/stores/appStore.js";
export function createHistory({ store: v0, max: max = 50 } = {}) {
  const v1 =
      v0 &&
      (typeof v0["getHistorySnapshot"] === "function" ||
        typeof v0["getState"] === "function"),
    v2 =
      v0 &&
      (typeof v0["loadHistorySnapshot"] === "function" ||
        typeof v0["loadState"] === "function");
  if (!v1 || !v2)
    throw new TypeError(
      "[history]\x20createHistory()\x20需要传入具备\x20history\x20snapshot/loadState\x20能力的\x20store",
    );
  const v3 = Number["isFinite"](max) && max > 0 ? Math["floor"](max) : 50,
    v4 = [],
    v5 = [],
    v6 = [];
  function v7() {
    if (typeof v0["getHistorySnapshot"] === "function")
      return v0["getHistorySnapshot"]();
    const v8 = v0["getState"]();
    return { nodes: v8["nodes"], edges: v8["edges"] };
  }
  function v9(v10) {
    if (typeof v0["loadHistorySnapshot"] === "function") {
      v0["loadHistorySnapshot"](v10);
      return;
    }
    const v11 =
      typeof v0["getState"] === "function"
        ? v0["getState"]()?.["viewport"]
        : undefined;
    v0["loadState"](v11 ? { ...v10, viewport: v11 } : v10);
  }
  function v12() {
    const v13 = v7();
    (v4["push"](v13),
      v4["length"] > v3 && v4["shift"](),
      (v5["length"] = 0),
      v6["forEach"]((v14) => {
        try {
          v14();
        } catch (v15) {
          console["error"]("[history] 存档回调执行异常:", v15);
        }
      }));
  }
  function v16(v17) {
    typeof v17 === "function" && v6["push"](v17);
  }
  function v18() {
    if (v4["length"] < 2) {
      console["log"]("[history] 已到达最早的历史记录，无法继续撤销");
      return;
    }
    const v19 = v4["pop"]();
    v5["push"](v19);
    const v20 = v4[v4["length"] - 1];
    (v9(v20),
      console["log"](
        "[history]\x20undo\x20←\x20undoStack:" +
          v4["length"] +
          " redoStack:" +
          v5["length"],
      ));
  }
  function v21() {
    if (v5["length"] === 0) {
      console["log"]("[history] 没有可重做的操作");
      return;
    }
    const v22 = v5["pop"]();
    (v4["push"](v22),
      v9(v22),
      console["log"](
        "[history]\x20redo\x20→\x20undoStack:" +
          v4["length"] +
          " redoStack:" +
          v5["length"],
      ));
  }
  function v23() {
    return { undoCount: v4["length"], redoCount: v5["length"] };
  }
  return {
    commit: v12,
    onCommit: v16,
    undo: v18,
    redo: v21,
    getHistoryInfo: v23,
  };
}
const _defaultHistory = createHistory({ store: appStore, max: 50 });
export function commit() {
  return _defaultHistory["commit"]();
}
export function onCommit(v24) {
  return _defaultHistory["onCommit"](v24);
}
export function undo() {
  return _defaultHistory["undo"]();
}
export function redo() {
  return _defaultHistory["redo"]();
}
export function getHistoryInfo() {
  return _defaultHistory["getHistoryInfo"]();
}
