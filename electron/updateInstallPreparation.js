import { execFileSync } from "node:child_process";
const DEFAULT_UPDATE_INSTALL_CLEANUP_TIMEOUT_MS = 4000;
function delay(v0) {
  return new Promise((v1) => {
    setTimeout(v1, v0);
  });
}
function isPidRunning(v2) {
  if (!Number["isInteger"](v2) || v2 <= 0) return false;
  try {
    return (process["kill"](v2, 0), true);
  } catch (v3) {
    return v3?.["code"] === "EPERM";
  }
}
async function waitForPidExit(v4, v5) {
  if (!Number["isInteger"](v4) || v4 <= 0) return true;
  const v6 = Date["now"]();
  while (Date["now"]() - v6 < v5) {
    if (!isPidRunning(v4)) return true;
    await delay(120);
  }
  return !isPidRunning(v4);
}
function terminateProcessTree(v7, { force: force = false } = {}) {
  if (!Number["isInteger"](v7) || v7 <= 0) return;
  if (process["platform"] === "win32") {
    const v8 = ["/PID", String(v7), "/T"];
    if (force) v8["push"]("/F");
    execFileSync("taskkill", v8, { stdio: "ignore", windowsHide: true });
    return;
  }
  process["kill"](v7, force ? "SIGKILL" : "SIGTERM");
}
export function createUpdateInstallPreparation(v9 = {}) {
  const v10 =
      Number(v9["timeoutMs"]) > 0
        ? Number(v9["timeoutMs"])
        : DEFAULT_UPDATE_INSTALL_CLEANUP_TIMEOUT_MS,
    v11 =
      typeof v9["getSpawnedServer"] === "function"
        ? v9["getSpawnedServer"]
        : () => null,
    v12 =
      typeof v9["clearSpawnedServer"] === "function"
        ? v9["clearSpawnedServer"]
        : () => {},
    v13 =
      typeof v9["markQuittingForUpdate"] === "function"
        ? v9["markQuittingForUpdate"]
        : () => {},
    v14 =
      typeof v9["getMainWindow"] === "function"
        ? v9["getMainWindow"]
        : () => null,
    v15 =
      typeof v9["getRendererProjectState"] === "function"
        ? v9["getRendererProjectState"]
        : () => ({}),
    v16 =
      typeof v9["requestRendererRecoverySnapshot"] === "function"
        ? v9["requestRendererRecoverySnapshot"]
        : null,
    v17 =
      typeof v9["destroyScreenshotOverlayWindow"] === "function"
        ? v9["destroyScreenshotOverlayWindow"]
        : () => {},
    v18 =
      typeof v9["stopAllPowerSaveBlockers"] === "function"
        ? v9["stopAllPowerSaveBlockers"]
        : () => {},
    v19 = typeof v9["logEvent"] === "function" ? v9["logEvent"] : () => {};
  async function v20() {
    const v21 = v11();
    if (!v21) return true;
    const v22 = Number(v21["pid"] || 0);
    if (!Number["isInteger"](v22) || v22 <= 0) return (v12(v21), true);
    try {
      terminateProcessTree(v22, { force: false });
    } catch (v23) {
      console["warn"](
        "[electron] failed to stop backend before update install:",
        v23,
      );
    }
    let v24 = await waitForPidExit(v22, v10);
    if (!v24) {
      try {
        terminateProcessTree(v22, { force: true });
      } catch (v25) {
        console["warn"](
          "[electron] failed to force stop backend before update install:",
          v25,
        );
      }
      v24 = await waitForPidExit(v22, 1000);
    }
    return (v12(v21), v24);
  }
  async function v26() {
    const v27 = v15(),
      v28 = v14();
    if (
      v27?.["hasUnsavedChanges"] !== true ||
      !v28 ||
      v28["isDestroyed"]() ||
      !v16
    )
      return;
    try {
      const v29 = await v16(v28, "update-install");
      v29?.["success"] === false &&
        v19({
          type: "updater.recovery_snapshot_before_install_failed",
          level: "warn",
          source: "main",
          message: "Recovery snapshot before update install failed",
          context: { reason: v29["reason"] || "", error: v29["error"] || "" },
        });
    } catch (v30) {
      v19({
        type: "updater.recovery_snapshot_before_install_failed",
        level: "warn",
        source: "main",
        message: "Recovery snapshot before update install failed",
        error: v30,
      });
    }
  }
  async function v31() {
    (v13(),
      v19({
        type: "updater.prepare_install",
        level: "info",
        source: "main",
        message: "Preparing application for update install",
      }),
      await v26());
    try {
      v17();
    } catch (v32) {
      console["warn"](
        "[electron]\x20failed\x20to\x20destroy\x20screenshot\x20overlay\x20before\x20update:",
        v32,
      );
    }
    try {
      v18();
    } catch (v33) {
      console["warn"](
        "[electron]\x20failed\x20to\x20stop\x20power\x20save\x20blockers\x20before\x20update:",
        v33,
      );
    }
    const v34 = await v20();
    !v34 &&
      v19({
        type: "updater.backend_stop_timeout",
        level: "warn",
        source: "main",
        message:
          "Backend\x20process\x20did\x20not\x20exit\x20before\x20update\x20install",
      });
  }
  return { prepareForUpdateInstall: v31, stopSpawnedServerForUpdate: v20 };
}
