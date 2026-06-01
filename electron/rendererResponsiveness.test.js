import strict from "node:assert/strict";
import test from "node:test";
import {
  __rendererResponsivenessForTest,
  configureRendererResponsiveness,
} from "./rendererResponsiveness.js";
test("configureRendererResponsiveness\x20installs\x20Electron\x20background\x20throttling\x20switches", () => {
  const v0 = [];
  configureRendererResponsiveness({
    commandLine: { appendSwitch: (...v1) => v0["push"](v1) },
  });
  for (const v2 of __rendererResponsivenessForTest[
    "BACKGROUND_THROTTLE_SWITCHES"
  ]) {
    strict["ok"](v0["some"]((v3) => v3[0] === v2));
  }
  strict["ok"](
    v0["some"](
      (v4) =>
        v4[0] === "disable-features" &&
        v4[1] ===
          __rendererResponsivenessForTest["DISABLED_BACKGROUND_FEATURES"],
    ),
  );
});
