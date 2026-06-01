export function bindImageAnnotateCloneActions(v0) {
  const {
      toolbarEl: v1,
      nodeId: v2,
      ImageAnnotateController: v3,
      bindRunningHubToolbarTaskButton: v4,
      cancelRunningHubResultTask: v5,
      findRunningHubToolbarTaskForNode: v6,
    } = v0,
    v7 = [
      {
        act: "repaint",
        scene: "repaint",
        taskType: "image-repaint",
        cancelName: "重绘结果\x20(已取消)",
        cancelOutputText: "模型: 图像重绘\n状态: 已取消",
        cancelToast: "已取消重绘任务",
        cancelTooltip: "取消重绘",
      },
      {
        act: "erase",
        scene: "erase",
        taskType: "image-erase",
        cancelName: "擦除结果 (已取消)",
        cancelOutputText: "模型: 图像擦除\n状态: 已取消",
        cancelToast: "已取消擦除任务",
        cancelTooltip: "取消擦除",
      },
    ];
  v7["forEach"](
    ({
      act: v8,
      scene: v9,
      taskType: v10,
      cancelName: v11,
      cancelOutputText: v12,
      cancelToast: v13,
      cancelTooltip: v14,
    }) => {
      const v15 = v1["querySelector"](".act-" + v8);
      if (!v15) return;
      (v4({
        button: v15,
        getTask: () => v6(v2, { taskTypes: [v10] }),
        cancelTask: (v16) =>
          v5(v16, { name: v11, outputText: v12, notifyMessage: v13 }),
        cancelTooltip: v14,
      }),
        v15["addEventListener"]("click", (v17) => {
          (v17["stopPropagation"](),
            window["v2FocusOnNode"] && window["v2FocusOnNode"](v2),
            v3["init"](v2, {
              scene: v9,
              submitLabel: "生成",
              submitBusyLabel: "生成中...",
              submitNoop: true,
            }));
        }));
    },
  );
}
