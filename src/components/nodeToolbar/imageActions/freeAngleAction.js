export function bindImageFreeAngleAction(v0) {
  const {
      toolbarEl: v1,
      nodeId: v2,
      bindRunningHubToolbarTaskButton: v3,
      cancelRunningHubResultTask: v4,
      findRunningHubToolbarTaskForNode: v5,
    } = v0,
    v6 = v1["querySelector"](".act-multiangle");
  v6 &&
    (v3({
      button: v6,
      getTask: () => v5(v2, { taskTypes: ["image-free-angle"] }),
      cancelTask: (v7) =>
        v4(v7, {
          name: "旋转结果 (已取消)",
          outputText: "模型: 控制角度\n状态: 已取消",
          notifyMessage: "已取消控制角度任务",
        }),
      cancelTooltip: "取消控制角度",
    }),
    v6["addEventListener"]("click", (v8) => {
      (v8["stopPropagation"](),
        v1["dispatchEvent"](
          new CustomEvent("v2-node:free-angle", {
            bubbles: true,
            detail: { nodeId: v2 },
          }),
        ));
    }));
}
