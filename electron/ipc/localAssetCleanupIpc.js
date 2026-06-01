export function registerLocalAssetCleanupIpcHandlers({
  ipcMain: v0,
  getLocalAssetCleanupManager: v1,
}) {
  (v0["handle"]("localAssetCleanup:scan", async (v3, v4 = {}) => {
    return await v1()["scan"](v4 || {});
  }),
    v0["handle"]("localAssetCleanup:trash", async (v6, v7 = {}) => {
      return await v1()["trash"](v7 || {});
    }));
}
