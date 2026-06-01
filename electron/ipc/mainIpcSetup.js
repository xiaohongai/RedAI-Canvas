export function buildMainIpcHandlerDeps(v0 = {}) {
  const {
    app: v1,
    readAppVersionFromIndexHtml: v2,
    getStableDeviceId: v3,
    getUpdaterController: v4,
    getSecureSettingsStore: v5,
    normalizeSecureSettingsKeys: v6,
    fileReferencesFormat: v7,
    createClipboardNativeImage: v8,
    screenshotOverlayController: v9,
    normalizeClipboardFileReferences: v10,
    parseClipboardFileReferencesFromText: v11,
    openDesktopProject: v12,
    saveDesktopProject: v13,
    handleRendererUnsavedState: v14,
    listRecentProjects: v15,
    removeRecentProject: v16,
    getRecentProjectsStorePath: v17,
    syncSystemRecentDocumentsBestEffort: v18,
    pendingExternalProjectOpenRequests: v19,
    writeDesktopRecoverySnapshot: v20,
    getDesktopRecoverySnapshotInfo: v21,
    readDesktopRecoverySnapshot: v22,
    clearDesktopRecoverySnapshot: v23,
    importAssetToLibrary: v24,
    createLocalPreviewUrl: v25,
    resolveLocalVirtualPath: v26,
    resolveKnownFolder: v27,
    openExternalUrl: v28,
    getWebPreviewViewManager: v29,
    selectDirectory: v30,
    getMediaTaskQueue: v31,
    getLocalAssetCleanupManager: v32,
    diagnostics: v33,
    logDir: v34,
    logDiagnosticEvent: v35,
  } = v0;
  return {
    getAppVersion: () => v2() || v1["getVersion"](),
    getStableDeviceId: v3,
    getUpdaterController: v4,
    getSecureSettingsStore: v5,
    normalizeSecureSettingsKeys: v6,
    fileReferencesFormat: v7,
    createClipboardNativeImage: v8,
    captureDesktopDisplay: v9["captureDesktopDisplay"],
    handleScreenshotOverlayConfirm: v9["handleScreenshotOverlayConfirm"],
    handleScreenshotOverlayCancel: v9["handleScreenshotOverlayCancel"],
    normalizeClipboardFileReferences: v10,
    parseClipboardFileReferencesFromText: v11,
    openDesktopProject: v12,
    saveDesktopProject: v13,
    handleRendererUnsavedState: v14,
    listRecentProjects: () => v15(v17()),
    removeRecentProject: (v36) => {
      const v37 = v16(v17(), v36);
      return (v18(), v37);
    },
    consumeExternalOpenRequests: () => v19["splice"](0, v19["length"]),
    writeDesktopRecoverySnapshot: v20,
    getDesktopRecoverySnapshotInfo: v21,
    readDesktopRecoverySnapshot: v22,
    clearDesktopRecoverySnapshot: v23,
    importAssetToLibrary: v24,
    createLocalPreviewUrl: v25,
    resolveLocalVirtualPath: v26,
    resolveKnownFolder: v27,
    openExternalUrl: v28,
    getWebPreviewViewManager: v29,
    selectDirectory: v30,
    getMediaTaskQueue: v31,
    getLocalAssetCleanupManager: v32,
    diagnostics: v33,
    logDir: v34,
    logDiagnosticEvent: v35,
  };
}
export function createMainIpcHandlerInstaller({
  registerIpcHandlers: v38,
  context: v39,
} = {}) {
  if (typeof v38 !== "function")
    throw new TypeError("registerIpcHandlers\x20must\x20be\x20a\x20function");
  let v40 = false;
  return function v41() {
    if (v40) return false;
    return ((v40 = true), v38(buildMainIpcHandlerDeps(v39)), true);
  };
}
