export function initAppShellUi({
  store: v0,
  initMinimap: v1,
  minimapEl: v2,
  btnMinimapEl: v3,
  minimapWrapperEl: v4,
  btnToggleDotsEl: v5,
  applySnapGridEnabled: v6,
  readSnapGridEnabled: v7,
  applyGridDotsPrefFromStorage: v8,
  showDevToast: v9,
} = {}) {
  const v10 = document["getElementById"]("canvasVersionBadge");
  if (v10) {
    const v11 = document["querySelector"]('meta[name="app-version"]')?.[
        "getAttribute"
      ]("content"),
      v12 = String(v11 || "")
        ["trim"]()
        ["replace"](/^v\s*/i, "");
    v10["textContent"] = v12 ? "当前版本：V " + v12 : "";
  }
  v2 && v1?.(v2, v0);
  if (v3 && v4) {
    v3["addEventListener"]("click", () => {
      (v4["classList"]["toggle"]("open"), v3["classList"]["toggle"]("active"));
    });
    const v13 = () => {
      const v14 =
        Object["keys"](v0?.["getState"]?.()["nodes"] || {})["length"] > 0;
      (v4["classList"]["toggle"]("open", v14),
        v3["classList"]["toggle"]("active", v14));
    };
    setTimeout(v13, 150);
  }
  (v5 &&
    (v6?.(v7?.(), { emitEvent: false }),
    v5["addEventListener"]("click", () => {
      const v15 = !v7?.();
      (v6?.(v15),
        window["showToast"]?.(v15 ? "网格吸附已开启" : "网格吸附已关闭"));
    })),
    v8?.(),
    void v9);
}
