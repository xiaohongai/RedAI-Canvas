export function bindVideoSeparateAvAction(v0) {
  const {
      toolbarEl: v1,
      nodeData: v2,
      getStateSnapshot: v3,
      VideoClipController: v4,
      runVideoAudioSeparationFromNode: v5,
      VideoKeyingController: v6,
    } = v0,
    v7 = v1["querySelector"](".act-separate-av");
  v7 &&
    v7["addEventListener"]("click", (v8) => {
      v8["stopPropagation"]();
      const v9 = v3();
      if (v9["videoKeying"]?.["active"]) {
        window["showToast"]?.("请先退出当前视频编辑模式", "info");
        return;
      }
      if (v9["videoClip"]?.["active"]) {
        window["showToast"]?.("请先退出裁剪视频模式", "info");
        return;
      }
      (v4["exit"]({ silent: true }),
        v6["exit"]({ silent: true }),
        void v5(v2["id"]));
    });
}
