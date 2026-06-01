export const UPDATER_STATES = Object["freeze"]({
  IDLE: "idle",
  CHECKING: "checking",
  AVAILABLE: "available",
  DOWNLOADING: "downloading",
  DOWNLOADED: "downloaded",
  INSTALLING: "installing",
  ERROR: "error",
});
const DEFAULT_DOWNLOAD_RETRY_DELAYS_MS = [3000, 10000];
function normalizeRetryDelays(v0) {
  return (Array["isArray"](v0) ? v0 : DEFAULT_DOWNLOAD_RETRY_DELAYS_MS)
    ["map"]((v1) => Number(v1))
    ["filter"]((v2) => Number["isFinite"](v2) && v2 >= 0);
}
function getErrorMessage(v3, v4) {
  return v3?.["message"] ? String(v3["message"]) : v4;
}
function waitForRetry(v5, v6) {
  return new Promise((v7) => {
    v5(v7, v6);
  });
}
export function createUpdaterController(v8 = {}) {
  const v9 = v8["autoUpdater"];
  if (!v9) throw new Error("autoUpdater is required");
  const v10 =
      typeof v8["normalizeInfo"] === "function"
        ? v8["normalizeInfo"]
        : (v11) => v11 || null,
    v12 = typeof v8["logEvent"] === "function" ? v8["logEvent"] : () => {},
    v13 = typeof v8["sendEvent"] === "function" ? v8["sendEvent"] : () => {},
    v14 =
      typeof v8["setProgressBar"] === "function"
        ? v8["setProgressBar"]
        : () => {},
    v15 =
      typeof v8["prepareBeforeInstall"] === "function"
        ? v8["prepareBeforeInstall"]
        : typeof v8["stopBeforeInstall"] === "function"
          ? v8["stopBeforeInstall"]
          : () => {},
    v16 =
      typeof v8["setTimeoutFn"] === "function"
        ? v8["setTimeoutFn"]
        : setTimeout,
    v17 = normalizeRetryDelays(v8["retryDelaysMs"]),
    v18 = () => {
      if (typeof v8["isPackaged"] === "function")
        return Boolean(v8["isPackaged"]());
      return Boolean(v8["isPackaged"]);
    };
  let v19 = false,
    v20 = UPDATER_STATES["IDLE"],
    v21 = null,
    v22 = null,
    v23 = null,
    v24 = 0,
    v25 = false;
  function v26() {
    return {
      state: v20,
      latestEvent: v22,
      latestInfo: v21,
      retryCount: v24,
      maxRetries: v17["length"],
      canCheck: true,
      canDownload:
        v20 === UPDATER_STATES["AVAILABLE"] || v20 === UPDATER_STATES["ERROR"],
      canInstall: v20 === UPDATER_STATES["DOWNLOADED"],
    };
  }
  function v27(v28) {
    v20 = v28;
  }
  function v29(v30, v31 = {}) {
    const v32 = { type: v30, state: v20, ...v31 };
    v22 = v32;
    if (v32["info"]) v21 = v32["info"];
    return (v13(v32), v32);
  }
  function v33(v34, v35, v36, v37 = {}, v38 = null) {
    v12({
      type: v34,
      level: v35,
      source: "main",
      message: v36,
      context: v37,
      ...(v38 ? { error: v38 } : {}),
    });
  }
  function v39(v40, v41, v42, v43 = {}) {
    (v27(UPDATER_STATES["ERROR"]), v14(-1), v33(v40, "error", v41, v43, v42));
  }
  function v44() {
    if (v19) return;
    ((v19 = true),
      (v9["autoDownload"] = false),
      (v9["autoInstallOnAppQuit"] = false),
      v9["on"]("error", (v45) => {
        if (v20 === UPDATER_STATES["DOWNLOADING"]) {
          v33(
            "updater.download_error_event",
            "error",
            "Application updater emitted an error while downloading",
            { retryCount: v24 },
            v45,
          );
          return;
        }
        (v39("updater.error", "Application updater failed", v45),
          v29("error", {
            info: v21,
            message: getErrorMessage(v45, "应用更新检查失败"),
            manual: v25,
          }),
          (v25 = false));
      }),
      v9["on"]("checking-for-update", () => {
        (v27(UPDATER_STATES["CHECKING"]),
          v33("updater.checking", "info", "Checking for application update"),
          v29("checking", { info: v21, manual: v25 }));
      }),
      v9["on"]("update-available", (v46) => {
        ((v21 = v10(v46)),
          (v24 = 0),
          v27(UPDATER_STATES["AVAILABLE"]),
          v33("updater.available", "info", "Application update available", {
            version: v46?.["version"] || "",
          }),
          v29("available", { info: v21, manual: v25 }),
          (v25 = false));
      }),
      v9["on"]("update-not-available", (v47) => {
        ((v21 = v10(v47)),
          (v24 = 0),
          v27(UPDATER_STATES["IDLE"]),
          v14(-1),
          v33(
            "updater.not_available",
            "info",
            "Application update not available",
            { version: v47?.["version"] || "" },
          ),
          v29("not-available", { info: v21, manual: v25 }),
          (v25 = false));
      }),
      v9["on"]("download-progress", (v48) => {
        const v49 = Math["max"](
          0,
          Math["min"](100, Number(v48?.["percent"] || 0)),
        );
        (v27(UPDATER_STATES["DOWNLOADING"]),
          v14(v49 / 100),
          v29("download-progress", {
            info: v21,
            percent: v49,
            transferred: Number(v48?.["transferred"] || 0),
            total: Number(v48?.["total"] || 0),
            bytesPerSecond: Number(v48?.["bytesPerSecond"] || 0),
            retryCount: v24,
            maxRetries: v17["length"],
          }));
      }),
      v9["on"]("update-downloaded", (v50) => {
        ((v21 = v10(v50)),
          (v24 = 0),
          v27(UPDATER_STATES["DOWNLOADED"]),
          v14(-1),
          v33("updater.downloaded", "info", "Application update downloaded", {
            version: v50?.["version"] || "",
          }),
          v29("downloaded", { info: v21 }));
      }));
  }
  async function v51(v52 = {}) {
    v44();
    if (!v18())
      return { ok: false, skipped: true, reason: "not-packaged", state: v20 };
    (v27(UPDATER_STATES["CHECKING"]), (v25 = Boolean(v52["manual"])));
    try {
      return (await v9["checkForUpdates"](), { ok: true, state: v20 });
    } catch (v53) {
      (v39("updater.check_failed", "Application update check failed", v53, {
        manual: Boolean(v52["manual"]),
      }),
        v29("error", {
          info: v21,
          message: getErrorMessage(v53, "应用更新检查失败，请稍后再试"),
          manual: v25,
        }),
        (v25 = false));
      throw v53;
    }
  }
  async function v54(v55) {
    ((v24 = v55),
      v27(UPDATER_STATES["DOWNLOADING"]),
      v29(v55 === 0 ? "download-started" : "download-retry", {
        info: v21,
        retryCount: v55,
        maxRetries: v17["length"],
        retryDelayMs: v55 > 0 ? v17[v55 - 1] || 0 : 0,
      }));
    try {
      return (await v9["downloadUpdate"](), { ok: true, state: v20 });
    } catch (v56) {
      const v57 = v17[v55];
      v33(
        "updater.download_failed",
        "error",
        "Application update download failed",
        {
          attempt: v55 + 1,
          maxAttempts: v17["length"] + 1,
          version: v21?.["version"] || "",
        },
        v56,
      );
      if (Number["isFinite"](v57))
        return (
          v33(
            "updater.download_retry",
            "warn",
            "Retrying application update download",
            {
              retryCount: v55 + 1,
              retryDelayMs: v57,
              version: v21?.["version"] || "",
            },
          ),
          await waitForRetry(v16, v57),
          v54(v55 + 1)
        );
      ((v24 = v17["length"]),
        v39(
          "updater.download_exhausted",
          "Application update download retries exhausted",
          v56,
          { retryCount: v24, version: v21?.["version"] || "" },
        ),
        v29("download-failed", {
          info: v21,
          retryCount: v24,
          maxRetries: v17["length"],
          message: getErrorMessage(v56, "下载更新失败，请稍后再试"),
        }));
      throw v56;
    }
  }
  async function v58() {
    v44();
    if (v23) return v23;
    return (
      (v23 = v54(0)["finally"](() => {
        v23 = null;
      })),
      v23
    );
  }
  async function v59() {
    (v44(),
      v27(UPDATER_STATES["INSTALLING"]),
      v33(
        "updater.install_requested",
        "info",
        "Application update install requested",
        { version: v21?.["version"] || "" },
      ),
      v29("installing", { info: v21 }));
    try {
      return (
        await Promise["resolve"](v15()),
        v9["quitAndInstall"](false, true),
        { ok: true, state: v20 }
      );
    } catch (v60) {
      (v39("updater.install_failed", "Application update install failed", v60, {
        version: v21?.["version"] || "",
      }),
        v29("error", {
          info: v21,
          message: getErrorMessage(v60, "重启安装失败，请稍后再试"),
        }));
      throw v60;
    }
  }
  return {
    installHandlers: v44,
    checkForUpdates: v51,
    downloadUpdate: v58,
    installDownloadedUpdate: v59,
    getState: v26,
    getLatestEvent: () => v22,
  };
}
