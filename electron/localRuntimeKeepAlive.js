const DEFAULT_KEEPALIVE_INTERVAL_MS = 15000,
  DEFAULT_KEEPALIVE_TIMEOUT_MS = 1000,
  DEFAULT_RUNTIME_INFO_PATH = "/api/v2/runtime/info",
  DEFAULT_BLOCKER_REASON = "local-runtime-keepalive";
function isWindowWarmable(v0) {
  if (!v0 || v0["isDestroyed"]?.()) return false;
  if (!v0["isVisible"]?.()) return false;
  if (v0["isMinimized"]?.()) return false;
  return true;
}
export function createLocalRuntimeKeepAliveController({
  getWindow: getWindow = () => null,
  requestLocalJson: requestLocalJson = null,
  setPowerSaveBlocker: setPowerSaveBlocker = null,
  logDiagnosticEvent: logDiagnosticEvent = null,
  intervalMs: intervalMs = DEFAULT_KEEPALIVE_INTERVAL_MS,
  timeoutMs: timeoutMs = DEFAULT_KEEPALIVE_TIMEOUT_MS,
  runtimeInfoPath: runtimeInfoPath = DEFAULT_RUNTIME_INFO_PATH,
  blockerReason: blockerReason = DEFAULT_BLOCKER_REASON,
} = {}) {
  let v1 = null,
    v2 = false;
  function v3() {
    return isWindowWarmable(getWindow?.());
  }
  async function v4(v5 = "keepalive") {
    if (v2 || !v3() || typeof requestLocalJson !== "function") return false;
    v2 = true;
    try {
      return (await requestLocalJson(runtimeInfoPath, timeoutMs), true);
    } catch (v6) {
      return (
        logDiagnosticEvent?.({
          type: "local_runtime.keep_alive_failed",
          level: "debug",
          source: "main",
          message: "Local runtime keep-alive request failed",
          context: { reason: v5 },
          error: v6,
        }),
        false
      );
    } finally {
      v2 = false;
    }
  }
  function v7() {
    if (v1 || !(intervalMs > 0)) return;
    ((v1 = setInterval(() => {
      void v4("interval");
    }, intervalMs)),
      v1["unref"]?.());
  }
  function v8() {
    (v1 && (clearInterval(v1), (v1 = null)),
      setPowerSaveBlocker?.(blockerReason, false));
  }
  function v9(v10 = "start") {
    if (!v3())
      return (
        setPowerSaveBlocker?.(blockerReason, false),
        Promise["resolve"](false)
      );
    return (
      setPowerSaveBlocker?.(blockerReason, true, "prevent-app-suspension"),
      v7(),
      v4(v10)
    );
  }
  function v11(v12 = "window-state") {
    if (v3()) return v9(v12);
    return (v8(), Promise["resolve"](false));
  }
  return { ping: v4, refresh: v11, shouldKeepWarm: v3, start: v9, stop: v8 };
}
export const __localRuntimeKeepAliveForTest = {
  DEFAULT_KEEPALIVE_INTERVAL_MS: DEFAULT_KEEPALIVE_INTERVAL_MS,
  DEFAULT_KEEPALIVE_TIMEOUT_MS: DEFAULT_KEEPALIVE_TIMEOUT_MS,
  DEFAULT_RUNTIME_INFO_PATH: DEFAULT_RUNTIME_INFO_PATH,
  DEFAULT_BLOCKER_REASON: DEFAULT_BLOCKER_REASON,
  isWindowWarmable: isWindowWarmable,
};
