export function bindVideoReverseDevAction(v0) {
  const { toolbarEl: v1, showDevToast: v2 } = v0,
    v3 = ["reverse"];
  v3["forEach"]((v4) => {
    const v5 = v1["querySelector"](".act-" + v4);
    if (v5)
      v5["addEventListener"]("click", (v6) => {
        v6["stopPropagation"]();
        const v7 = v5["querySelector"]("svg"),
          v8 = v7 ? v7["outerHTML"] : "",
          v9 =
            v5["getAttribute"]("aria-label") ||
            v5["dataset"]["label"] ||
            v5["textContent"]["trim"]() ||
            "功能";
        v2(v9, v8);
      });
  });
}
