export function registerSecureSettingsIpcHandlers({
  ipcMain: v0,
  getSecureSettingsStore: v1,
  normalizeSecureSettingsKeys: v2,
}) {
  (v0["handle"]("secureSettings:get", (v3, v4 = {}) => {
    const v5 = v1(),
      v6 = v5["isAvailable"](),
      v7 = v2(v4);
    return { ok: true, available: v6, values: v6 ? v5["getMany"](v7) : {} };
  }),
    v0["handle"]("secureSettings:set", (v8, v9 = {}) => {
      const v10 = v1(),
        v11 = v10["isAvailable"]();
      if (!v11) return { ok: false, available: v11, error: "安全存储不可用" };
      try {
        return (
          v10["set"](v9?.["key"], v9?.["value"]),
          { ok: true, available: v11 }
        );
      } catch (v12) {
        return {
          ok: false,
          available: v11,
          error: String(v12?.["message"] || v12),
        };
      }
    }),
    v0["handle"]("secureSettings:delete", (v13, v14 = {}) => {
      const v15 = v1(),
        v16 = v15["isAvailable"]();
      if (!v16) return { ok: false, available: v16, error: "安全存储不可用" };
      try {
        return (v15["delete"](v14?.["key"]), { ok: true, available: v16 });
      } catch (v17) {
        return {
          ok: false,
          available: v16,
          error: String(v17?.["message"] || v17),
        };
      }
    }));
}
