import test from "node:test";
import strict from "node:assert/strict";
import {
  buildTextGenerationFailurePatch,
  buildTextGenerationResultPatch,
  isTextGenerationTimeoutError,
  getTextGenerationResultError,
  normalizeTextGenerationResult,
} from "./textGenerationResultRenderer.js";
(test("text generation result renderer: normalizes common text result shapes", () => {
  const v0 = normalizeTextGenerationResult({ text: "hello" }),
    v1 = normalizeTextGenerationResult({ output: "world" }),
    v2 = normalizeTextGenerationResult("plain"),
    v3 = normalizeTextGenerationResult({
      texts: [{ content: "first" }, { message: "second" }],
    });
  (strict["equal"](v0["items"][0]["outputText"], "hello"),
    strict["equal"](v1["items"][0]["outputText"], "world"),
    strict["equal"](v2["items"][0]["outputText"], "plain"),
    strict["equal"](v3["items"]["length"], 2),
    strict["equal"](v3["items"][0]["outputText"], "first"));
}),
  test("text\x20generation\x20result\x20renderer:\x20builds\x20success\x20patch", () => {
    const v4 = buildTextGenerationResultPatch(
      { output: "generated text" },
      { startedAt: Date["now"]() - 10 },
    );
    (strict["equal"](v4["jobStatus"], "success"),
      strict["equal"](v4["jobError"], null),
      strict["equal"](v4["outputText"], "generated text"),
      strict["equal"](typeof v4["generationDuration"], "number"));
    const v5 = buildTextGenerationResultPatch(
      {},
      { startedAt: Date["now"]() - 10 },
    );
    (strict["equal"](v5["jobStatus"], "success"),
      strict["equal"](v5["outputText"], undefined));
  }),
  test("text\x20generation\x20result\x20renderer:\x20builds\x20failure\x20patch", () => {
    const v6 = buildTextGenerationFailurePatch({
      error: "provider rejected",
      startedAt: Date["now"]() - 10,
    });
    (strict["equal"](v6["jobStatus"], "error"),
      strict["equal"](v6["jobError"], "provider rejected"),
      strict["equal"](
        getTextGenerationResultError({ error: "provider rejected" }),
        "provider\x20rejected",
      ));
  }),
  test("text generation result renderer: exposes timeout failures as node output", () => {
    const v7 = new Error("请求超时（300秒）");
    v7["type"] = "TIMEOUT";
    const v8 = buildTextGenerationFailurePatch({
      error: v7,
      startedAt: Date["now"]() - 10,
    });
    (strict["equal"](isTextGenerationTimeoutError(v7), true),
      strict["equal"](v8["jobStatus"], "error"),
      strict["equal"](v8["jobError"], "请求超时（300秒）"),
      strict["match"](v8["outputText"], /生成超时/),
      strict["match"](v8["outputText"], /错误详情：请求超时/));
    const v9 = buildTextGenerationFailurePatch({
      error: "provider\x20rejected",
      startedAt: Date["now"]() - 10,
    });
    strict["equal"](v9["outputText"], undefined);
  }));
