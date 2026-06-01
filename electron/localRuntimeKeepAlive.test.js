import strict from "node:assert/strict";
import test from "node:test";
import { createLocalRuntimeKeepAliveController } from "./localRuntimeKeepAlive.js";
function createWindowStub(v0 = {}) {
  return {
    isDestroyed: () => false,
    isMinimized: () => false,
    isVisible: () => true,
    ...v0,
  };
}
(test("local\x20runtime\x20keep-alive\x20pings\x20visible\x20Electron\x20windows\x20and\x20uses\x20app\x20suspension\x20blocker", async () => {
  const v1 = [],
    v2 = [],
    v3 = createLocalRuntimeKeepAliveController({
      getWindow: () => createWindowStub(),
      intervalMs: 60000,
      requestLocalJson: async (v4, v5) => {
        v1["push"]({ pathname: v4, timeoutMs: v5 });
      },
      setPowerSaveBlocker: (...v6) => v2["push"](v6),
    });
  (await v3["start"]("focus"),
    v3["stop"](),
    strict["deepEqual"](v1, [
      { pathname: "/api/v2/runtime/info", timeoutMs: 1000 },
    ]),
    strict["deepEqual"](v2[0], [
      "local-runtime-keepalive",
      true,
      "prevent-app-suspension",
    ]),
    strict["deepEqual"](v2["at"](-1), ["local-runtime-keepalive", false]));
}),
  test("local\x20runtime\x20keep-alive\x20skips\x20hidden\x20or\x20minimized\x20windows", async () => {
    const v7 = [],
      v8 = [],
      v9 = createLocalRuntimeKeepAliveController({
        getWindow: () => createWindowStub({ isMinimized: () => true }),
        requestLocalJson: async () => v7["push"]("ping"),
        setPowerSaveBlocker: (...v10) => v8["push"](v10),
      }),
      v11 = await v9["start"]("minimized");
    (strict["equal"](v11, false),
      strict["deepEqual"](v7, []),
      strict["deepEqual"](v8, [["local-runtime-keepalive", false]]));
  }),
  test("local runtime keep-alive logs failed warm pings without throwing", async () => {
    const v12 = [],
      v13 = createLocalRuntimeKeepAliveController({
        getWindow: () => createWindowStub(),
        intervalMs: 60000,
        requestLocalJson: async () => {
          throw new Error("offline");
        },
        logDiagnosticEvent: (v14) => v12["push"](v14),
      }),
      v15 = await v13["start"]("ready-to-show");
    (v13["stop"](),
      strict["equal"](v15, false),
      strict["equal"](v12["length"], 1),
      strict["equal"](v12[0]["type"], "local_runtime.keep_alive_failed"),
      strict["deepEqual"](v12[0]["context"], { reason: "ready-to-show" }));
  }));
