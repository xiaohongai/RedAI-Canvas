export function bindVideoRemoveAction(v0) {
  const {
      toolbarEl: v1,
      nodeData: v2,
      getStateSnapshot: v3,
      VideoClipController: v4,
      VideoKeyingController: v5,
      VIDEO_TOOLBAR_FOCUS_PADDING: v6,
      VIDEO_TOOLBAR_FOCUS_DURATION_MS: v7,
      VIDEO_TOOLBAR_FOCUS_MAX_ZOOM: v8,
      bindRunningHubToolbarTaskButton: v9,
    } = v0,
    v10 = v1["querySelector"](".act-remove");
  v10 &&
    (v9({
      button: v10,
      getTask: () => v5["getRunningRemoveTaskForNode"]?.(v2["id"]),
      cancelTask: () =>
        v5["cancelRunningRemoveTaskForNode"]?.(v2["id"], { notify: true }),
      cancelTooltip: "取消视频擦除",
    }),
    v10["addEventListener"]("click", (v11) => {
      if (v5["hasRunningRemoveTaskForNode"]?.(v2["id"])) {
        (v11["preventDefault"](),
          v11["stopPropagation"](),
          void v5["cancelRunningRemoveTaskForNode"]?.(v2["id"], {
            notify: true,
          }));
        return;
      }
      v11["stopPropagation"]();
      const v12 = v3();
      if (v12["videoKeying"]?.["active"]) {
        window["showToast"]?.("请先退出当前视频编辑模式", "info");
        return;
      }
      if (v12["videoClip"]?.["active"]) {
        window["showToast"]?.("请先退出裁剪视频模式", "info");
        return;
      }
      (v4["exit"]({ silent: true }),
        window["v2FocusOnNode"]
          ? (window["v2FocusOnNode"](v2["id"], v6, v7, v8),
            setTimeout(() => {
              v5["init"](v2["id"], { uiMode: "remove" });
            }, v7))
          : v5["init"](v2["id"], { uiMode: "remove" }));
    }));
}
