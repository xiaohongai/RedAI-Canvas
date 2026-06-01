const DEFAULT_CLOSE_RECOVERY_TIMEOUT_MS = 2500;
function delay(v0) {
  return new Promise((v1) => {
    setTimeout(v1, v0);
  });
}
export async function requestRendererRecoverySnapshot(
  v2,
  v3 = "window-close",
  { timeoutMs: timeoutMs = DEFAULT_CLOSE_RECOVERY_TIMEOUT_MS } = {},
) {
  if (!v2 || v2["isDestroyed"]())
    return { success: false, reason: "window-unavailable" };
  const v4 =
    '(() => {\n    const writer = window.__aiCanvasWriteRecoverySnapshotForClose;\n    if (typeof writer !== "function") {\n      return { success: false, reason: "writer-unavailable" };\n    }\n    return Promise.resolve(writer(' +
    JSON["stringify"](v3) +
    ")).catch((error) => ({\n      success: false,\n      error: String(error && error.message ? error.message : error),\n    }));\n  })()";
  return await Promise["race"]([
    v2["webContents"]["executeJavaScript"](v4, true),
    delay(timeoutMs)["then"](() => ({ success: false, reason: "timeout" })),
  ]);
}
export function installRecoverySnapshotBeforeClose(v5, v6 = {}) {
  if (!v5) return;
  const v7 =
      typeof v6["getRendererProjectState"] === "function"
        ? v6["getRendererProjectState"]
        : () => ({}),
    v8 =
      typeof v6["shouldBypassClose"] === "function"
        ? v6["shouldBypassClose"]
        : () => false,
    v9 =
      typeof v6["requestSnapshot"] === "function"
        ? v6["requestSnapshot"]
        : requestRendererRecoverySnapshot,
    v10 = typeof v6["logEvent"] === "function" ? v6["logEvent"] : () => {};
  let v11 = false,
    v12 = false;
  v5["on"]("close", (v13) => {
    if (v8()) return;
    if (v11) {
      v11 = false;
      return;
    }
    const v14 = v7();
    if (v14?.["hasUnsavedChanges"] !== true) return;
    v13["preventDefault"]();
    if (v12) return;
    ((v12 = true),
      void (async () => {
        try {
          const v15 = await v9(v5, "window-close");
          v15?.["success"] === false &&
            v10({
              type: "project.recovery_snapshot_before_close_failed",
              level: "warn",
              source: "main",
              message: "Recovery snapshot before close failed",
              context: {
                reason: v15["reason"] || "",
                error: v15["error"] || "",
              },
            });
        } catch (v16) {
          v10({
            type: "project.recovery_snapshot_before_close_failed",
            level: "warn",
            source: "main",
            message: "Recovery snapshot before close failed",
            error: v16,
          });
        } finally {
          ((v12 = false), (v11 = true));
          if (!v5["isDestroyed"]()) v5["close"]();
        }
      })());
  });
}
