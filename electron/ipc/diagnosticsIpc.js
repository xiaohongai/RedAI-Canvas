import { mkdirSync } from "node:fs";
import { shell } from "electron";
export function registerDiagnosticsIpcHandlers({
  ipcMain: v0,
  diagnostics: v1,
  logDir: v2,
  logDiagnosticEvent: v3,
}) {
  (v0["handle"]("diagnostics:createPackage", async () => {
    const v4 = await v1["createPackage"]();
    return (v4?.["path"] && shell["showItemInFolder"](v4["path"]), v4);
  }),
    v0["handle"]("diagnostics:openLogsFolder", () => {
      return (
        mkdirSync(v2, { recursive: true }),
        void shell["openPath"](v2),
        { ok: true }
      );
    }),
    v0["handle"]("diagnostics:logEvent", (v5, v6 = {}) => {
      return v3({
        ...(v6 && typeof v6 === "object" ? v6 : {}),
        source: v6?.["source"] || "renderer",
      });
    }),
    v0["on"]("diagnostics:dragImportLog", (v7, v8 = {}) => {
      const v9 = {
        label: String(v8?.["label"] || ""),
        ...(v8?.["payload"] && typeof v8["payload"] === "object"
          ? v8["payload"]
          : {}),
      };
      (console["log"]("[drag-import-prof] renderer", v9),
        v3({
          type: "import.drag_profile",
          level: "debug",
          source: "renderer",
          message: "Drag\x20import\x20profile",
          context: v9,
        }));
    }));
}
