export function registerProjectIpcHandlers({
  ipcMain: v0,
  openDesktopProject: v1,
  saveDesktopProject: v2,
  handleRendererUnsavedState: v3,
  listRecentProjects: v4,
  removeRecentProject: v5,
  consumeExternalOpenRequests: v6,
  writeDesktopRecoverySnapshot: v7,
  getDesktopRecoverySnapshotInfo: v8,
  readDesktopRecoverySnapshot: v9,
  clearDesktopRecoverySnapshot: v10,
}) {
  (v0["handle"]("project:open", (v12, v13) => {
    return v1(v13 || {});
  }),
    v0["handle"]("project:save", (v14, v15) => {
      return v2(v15 || {});
    }),
    v0["on"]("project:setUnsavedState", (v16, v17 = {}) => {
      v3(v17);
    }),
    v0["handle"]("project:listRecent", () => {
      return v4();
    }),
    v0["handle"]("project:removeRecent", (v18, v19) => {
      return v5(v19?.["recentId"] || "");
    }),
    v0["handle"]("project:consumeExternalOpenRequests", () => {
      return v6();
    }),
    v0["handle"]("project:writeRecoverySnapshot", (v21, v22 = {}) => {
      try {
        return v7(v22 || {});
      } catch (v24) {
        return { success: false, error: String(v24?.["message"] || v24) };
      }
    }),
    v0["handle"]("project:getRecoverySnapshotInfo", (v25, v26 = {}) => {
      try {
        return v8(v26 || {});
      } catch (v28) {
        return {
          exists: false,
          isNewerThanProject: false,
          savedAt: 0,
          currentLastModified: 0,
          error: String(v28?.["message"] || v28),
        };
      }
    }),
    v0["handle"]("project:readRecoverySnapshot", () => {
      try {
        return v9();
      } catch (v30) {
        return {
          success: false,
          exists: false,
          error: String(v30?.["message"] || v30),
        };
      }
    }),
    v0["handle"]("project:clearRecoverySnapshot", () => {
      try {
        return v10();
      } catch (v32) {
        return { success: false, error: String(v32?.["message"] || v32) };
      }
    }));
}
