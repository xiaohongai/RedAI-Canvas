export function bindImageFullscreenAction(v0) {
  const { toolbarEl: v1, getNodeData: v2, openNodeImagePreview: v3 } = v0,
    v4 = v1["querySelector"](".act-fullscreen");
  v4 &&
    v4["addEventListener"]("click", (v5) => {
      v5["stopPropagation"]();
      const v6 = v2();
      if (v6) v3(v6);
    });
}
