export function registerAppIpcHandlers({
  ipcMain: v0,
  getAppVersion: v1,
  getStableDeviceId: v2,
  getUpdaterController: v3,
}) {
  (v0["handle"]("app:getVersion", () => {
    return v1();
  }),
    v0["handle"]("app:getDeviceId", (v5, v6 = {}) => {
      return v2(v6);
    }),
    v0["handle"]("appUpdater:getState", () => {
      return v3()["getState"]();
    }),
    v0["handle"]("appUpdater:checkForUpdates", async () => {
      return v3()["checkForUpdates"]({ manual: true });
    }),
    v0["handle"]("appUpdater:quitAndInstall", () => {
      return v3()["installDownloadedUpdate"]();
    }),
    v0["handle"]("appUpdater:downloadUpdate", async () => {
      return v3()["downloadUpdate"]();
    }));
}
