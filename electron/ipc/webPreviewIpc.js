function getManager(v0) {
  const v1 = typeof v0 === "function" ? v0() : null;
  if (!v1) throw new Error("网页预览服务尚未就绪");
  return v1;
}
export function registerWebPreviewIpcHandlers({
  ipcMain: v2,
  getWebPreviewViewManager: v3,
}) {
  const v4 = (v5) => getManager(v3)["syncViews"](v5);
  (v2["handle"]("webPreview:syncViews", (v6, v7 = {}) => {
    return v4(v7);
  }),
    v2["on"]?.("webPreview:syncViewsFast", (v8, v9 = {}) => {
      Promise["resolve"]()
        ["then"](() => v4(v9))
        ["catch"](() => {});
    }),
    v2["handle"]("webPreview:disposeViews", (v10, v11 = {}) => {
      return getManager(v3)["disposeViews"](v11);
    }),
    v2["handle"]("webPreview:controlView", (v12, v13 = {}) => {
      return getManager(v3)["controlView"](v13);
    }));
}
