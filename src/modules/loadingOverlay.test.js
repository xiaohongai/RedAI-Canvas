import test from "node:test";
import strict from "node:assert/strict";
import {
  createFakePreviewContainer,
  installPreviewDomStubs,
} from "../../tests/testPreviewDom.js";
import { startLoading, stopLoading } from "./loadingOverlay.js";
const restoreDom = installPreviewDomStubs();
(test["after"](() => {
  restoreDom();
}),
  test("loadingOverlay: repeated start before delay does not postpone visible loading", () => {
    const v0 = globalThis["setTimeout"],
      v1 = createFakePreviewContainer(),
      v2 = [];
    globalThis["setTimeout"] = (v3, v4) => {
      return (v2["push"]({ callback: v3, delay: v4 }), v2["length"]);
    };
    try {
      (startLoading(v1),
        startLoading(v1),
        strict["equal"](v2["length"], 1),
        v2[0]["callback"](),
        strict["equal"](
          v1["classList"]["contains"]("img-preview-loading"),
          true,
        ),
        strict["equal"](!!v1["querySelector"](".img-loading-overlay"), true),
        stopLoading(v1),
        strict["equal"](
          v1["classList"]["contains"]("img-preview-loading"),
          false,
        ));
    } finally {
      globalThis["setTimeout"] = v0;
    }
  }));
