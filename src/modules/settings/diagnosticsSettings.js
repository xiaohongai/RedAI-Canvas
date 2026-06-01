import {
  canUseDiagnostics,
  createDiagnosticsPackage,
  openDiagnosticsLogsFolder,
  logDiagnosticEvent,
  logPerformanceSnapshot,
} from "../../services/diagnosticsService.js";
function setButtonBusy(v0, v1, v2) {
  if (!v0) return;
  v0["disabled"] = Boolean(v1);
  if (v2) v0["textContent"] = v2;
}
export function initDiagnosticsSettings() {
  const v3 = document["getElementById"]("diagnosticsSettingsCard"),
    v4 = document["getElementById"]("btnCreateDiagnosticsPackage"),
    v5 = document["getElementById"]("btnOpenDiagnosticsLogs"),
    v6 = document["getElementById"]("diagnosticsStatusText");
  if (!v3 || !v4 || !v5) return;
  const v7 = canUseDiagnostics();
  v3["hidden"] = !v7;
  if (!v7) return;
  (v4["addEventListener"]("click", async () => {
    setButtonBusy(v4, true, "生成中...");
    v6 &&
      ((v6["textContent"] = "正在收集日志并生成诊断包..."),
      v6["classList"]["remove"]("is-error"));
    try {
      await logPerformanceSnapshot("diagnostics_package");
      const v8 = await createDiagnosticsPackage();
      (v6 &&
        (v6["textContent"] = v8?.["filename"]
          ? "诊断包已生成：" + v8["filename"]
          : "诊断包已生成"),
        window["showToast"]?.("诊断包已生成", "success"));
    } catch (v9) {
      (await logDiagnosticEvent({
        type: "diagnostics.ui_create_failed",
        level: "error",
        source: "renderer",
        message: v9?.["message"] || "生成诊断包失败",
        error: v9,
      }),
        v6 &&
          ((v6["textContent"] = v9?.["message"] || "生成诊断包失败"),
          v6["classList"]["add"]("is-error")),
        window["showToast"]?.(v9?.["message"] || "生成诊断包失败", "error"));
    } finally {
      setButtonBusy(v4, false, "生成诊断包");
    }
  }),
    v5["addEventListener"]("click", async () => {
      try {
        await openDiagnosticsLogsFolder();
      } catch (v10) {
        (await logDiagnosticEvent({
          type: "diagnostics.ui_open_logs_failed",
          level: "error",
          source: "renderer",
          message: v10?.["message"] || "打开日志目录失败",
          error: v10,
        }),
          window["showToast"]?.(
            v10?.["message"] || "打开日志目录失败",
            "error",
          ));
      }
    }));
}
