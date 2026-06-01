export function bindVideoClipAction(v0) {
  const {
      toolbarEl: v1,
      nodeData: v2,
      getStateSnapshot: v3,
      VideoClipController: v4,
      VideoKeyingController: v5,
      VIDEO_TOOLBAR_FOCUS_PADDING: v6,
      VIDEO_TOOLBAR_FOCUS_DURATION_MS: v7,
      VIDEO_TOOLBAR_FOCUS_MAX_ZOOM: v8,
    } = v0,
    v9 = v1["querySelector"](".act-clip");
  v9 &&
    v9["addEventListener"]("click", (v10) => {
      v10["stopPropagation"]();
      const v11 = v3();
      if (v11["videoKeying"]?.["active"]) {
        window["showToast"]?.("请先退出抠像模式", "info");
        return;
      }
      if (v11["videoClip"]?.["active"]) {
        window["showToast"]?.("请先退出裁剪视频模式", "info");
        return;
      }
      (v5["exit"]({ silent: true }),
        window["v2FocusOnNode"]
          ? (window["v2FocusOnNode"](v2["id"], v6, v7, v8),
            setTimeout(() => {
              v4["init"](v2["id"]);
            }, v7))
          : v4["init"](v2["id"]));
    });
}
