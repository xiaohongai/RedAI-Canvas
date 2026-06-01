export function bindVideoKeyingAction(v0) {
  const {
      toolbarEl: v1,
      nodeData: v2,
      getStateSnapshot: v3,
      store: v4,
      VideoClipController: v5,
      VideoKeyingController: v6,
      VIDEO_TOOLBAR_FOCUS_PADDING: v7,
      VIDEO_TOOLBAR_FOCUS_DURATION_MS: v8,
      VIDEO_TOOLBAR_FOCUS_MAX_ZOOM: v9,
      KEYING_CANCEL_ICON_HTML: v10,
    } = v0,
    v11 = v1["querySelector"](".act-keying");
  if (v11) {
    const v12 = {
        html: v11["innerHTML"],
        tooltip: v11["dataset"]["tooltip"] || "",
        aria: v11["getAttribute"]("aria-label") || "",
        title: v11["title"] || "",
      },
      v13 = () => String(v2?.["id"] || "")["trim"](),
      v14 = () => {
        if (v1["isConnected"] === false) {
          window["removeEventListener"]?.(v6["TASK_CHANGE_EVENT"], v14);
          return;
        }
        const v15 = v6["hasRunningKeyingTaskForNode"](v13());
        v11["classList"]["toggle"]("is-task-cancel", v15);
        if (v15) {
          ((v11["innerHTML"] = v10),
            (v11["dataset"]["tooltip"] = "取消抠像任务"),
            v11["setAttribute"]("aria-label", "取消抠像任务"),
            (v11["title"] = "取消抠像任务"));
          return;
        }
        ((v11["innerHTML"] = v12["html"]),
          v12["tooltip"]
            ? (v11["dataset"]["tooltip"] = v12["tooltip"])
            : delete v11["dataset"]["tooltip"],
          v12["aria"]
            ? v11["setAttribute"]("aria-label", v12["aria"])
            : v11["removeAttribute"]("aria-label"),
          (v11["title"] = v12["title"]));
      };
    window["addEventListener"]?.(v6["TASK_CHANGE_EVENT"], v14);
    const v16 =
      typeof v4["subscribeSelector"] === "function"
        ? v4["subscribeSelector"](
            (v17) => v17["nodes"],
            () => v14(),
          )
        : null;
    ((v11["_cleanupKeyingButtonState"] = () => {
      (window["removeEventListener"]?.(v6["TASK_CHANGE_EVENT"], v14), v16?.());
    }),
      v14(),
      v11["addEventListener"]("click", (v18) => {
        (v18["preventDefault"](), v18["stopPropagation"]());
        if (v6["hasRunningKeyingTaskForNode"](v13())) {
          void v6["cancelRunningKeyingTaskForNode"](v13(), { notify: true })[
            "finally"
          ](v14);
          return;
        }
        const v19 = v3();
        if (v19["videoKeying"]?.["active"]) {
          window["showToast"]?.("请先退出抠像模式", "info");
          return;
        }
        if (v19["videoClip"]?.["active"]) {
          window["showToast"]?.("请先退出裁剪视频模式", "info");
          return;
        }
        (v5["exit"]({ silent: true }),
          window["v2FocusOnNode"]
            ? (window["v2FocusOnNode"](v2["id"], v7, v8, v9),
              setTimeout(() => {
                v6["init"](v2["id"]);
              }, v8))
            : v6["init"](v2["id"]));
      }));
  }
}
