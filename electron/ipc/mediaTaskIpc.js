export function registerMediaTaskIpcHandlers({
  ipcMain: v0,
  getMediaTaskQueue: v1,
}) {
  (v0["handle"]("mediaTask:enqueue", (v3, v4) => {
    return v1()["enqueue"](v4 || {});
  }),
    v0["handle"]("mediaTask:cancel", (v5, v6) => {
      return v1()["cancel"](v6?.["taskId"] || "");
    }),
    v0["handle"]("mediaTask:list", (v8, v9) => {
      return v1()["list"]({ limit: v9?.["limit"] || 100 });
    }));
}
