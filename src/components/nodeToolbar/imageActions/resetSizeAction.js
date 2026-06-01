export function bindImageResetSizeAction(v0) {
  const {
      toolbarEl: v1,
      nodeId: v2,
      getStateSnapshot: v3,
      executeCommand: v4,
    } = v0,
    v5 = v1["querySelector"](".act-reset-size");
  v5 &&
    v5["addEventListener"]("click", (v6) => {
      v6["stopPropagation"]();
      if (v3()["ui"]?.["imageVideoNodeResizeEnabled"] !== true) return;
      v4("reset_source_media_size", { ids: [v2] });
    });
}
