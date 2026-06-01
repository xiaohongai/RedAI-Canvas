export function registerScreenshotIpcHandlers({
  ipcMain: v0,
  captureDesktopDisplay: v1,
  handleScreenshotOverlayConfirm: v2,
  handleScreenshotOverlayCancel: v3,
}) {
  (v0["handle"]("screenshot:captureDisplay", async () => {
    if (typeof v1 !== "function") return { ok: false, reason: "not-supported" };
    try {
      return await v1();
    } catch (v6) {
      return {
        ok: false,
        reason: "capture-failed",
        error: String(v6?.["message"] || v6),
      };
    }
  }),
    v0["handle"]("screenshot:overlayConfirm", async (v7, v8) => {
      if (typeof v2 !== "function")
        return { ok: false, reason: "not-supported" };
      return await v2(v8);
    }),
    v0["handle"]("screenshot:overlayCancel", async () => {
      if (typeof v3 !== "function")
        return { ok: false, reason: "not-supported" };
      return await v3();
    }));
}
