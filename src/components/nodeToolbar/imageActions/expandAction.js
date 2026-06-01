export function bindImageExpandAction(v0) {
  const {
      toolbarEl: v1,
      nodeId: v2,
      ImageExpandController: v3,
      bindRunningHubToolbarTaskButton: v4,
      cancelRunningHubResultTask: v5,
      findRunningHubToolbarTaskForNode: v6,
    } = v0,
    v7 = v1["querySelector"](".act-expand");
  v7 &&
    (v4({
      button: v7,
      getTask: () => v6(v2, { taskTypes: ["image-expand"] }),
      cancelTask: (v8) =>
        v5(v8, {
          name: "扩图结果\x20(已取消)",
          outputText: "模型:\x20扩图\x0a状态:\x20已取消",
          notifyMessage: "已取消扩图任务",
        }),
      cancelTooltip: "取消扩图",
    }),
    v7["addEventListener"]("click", (v9) => {
      (v9["stopPropagation"](),
        window["v2FocusOnNode"] && window["v2FocusOnNode"](v2, 260, 1200),
        v3["init"](v2));
    }));
}
