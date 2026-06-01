import test from "node:test";
import strict from "node:assert/strict";
import {
  buildGenerationCancelledPatch,
  buildGenerationFailurePatch,
  buildGenerationSuccessPatch,
} from "./generationTaskLifecycle.js";
(test("generationTaskLifecycle: null duration falls back to startedAt", () => {
  const v0 = Date["now"]() - 50,
    v1 = buildGenerationSuccessPatch({ startedAt: v0, duration: null });
  (strict["equal"](v1["jobStatus"], "success"),
    strict["ok"](v1["generationDuration"] > 0));
}),
  test("generationTaskLifecycle: explicit duration is preserved", () => {
    (strict["equal"](
      buildGenerationSuccessPatch({ duration: 0 })["generationDuration"],
      0,
    ),
      strict["equal"](
        buildGenerationFailurePatch({ error: "failed", duration: 123 })[
          "generationDuration"
        ],
        123,
      ),
      strict["equal"](
        buildGenerationCancelledPatch({ duration: 456 })["generationDuration"],
        456,
      ));
  }),
  test("generationTaskLifecycle: missing duration and startedAt omits duration", () => {
    const v2 = buildGenerationFailurePatch({ error: "failed" });
    (strict["equal"](v2["jobStatus"], "error"),
      strict["equal"](
        Object["prototype"]["hasOwnProperty"]["call"](v2, "generationDuration"),
        false,
      ));
  }));
