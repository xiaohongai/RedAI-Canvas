import test from "node:test";
import strict from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createFakePreviewContainer,
  installPreviewDomStubs,
} from "../../tests/testPreviewDom.js";
const restoreDom = installPreviewDomStubs(),
  previewModeModule = await import("./previewMode.js"),
  {
    _resetPreviewRuntimeForTests,
    isPreviewModeEnabled,
    isPreviewNodeLoading,
    clearAllPreviewNodeLoadings,
    setPreviewMode,
    stopPreviewNodeLoading,
    startPreviewNodeLoading,
    syncPreviewNodeLoading,
  } = previewModeModule;
(test["afterEach"](() => {
  _resetPreviewRuntimeForTests();
}),
  test["after"](() => {
    (_resetPreviewRuntimeForTests(), restoreDom());
  }),
  test("previewMode: 切换预览模式会同步 window 与 body class", () => {
    (strict["equal"](isPreviewModeEnabled(), false),
      setPreviewMode(true),
      strict["equal"](globalThis["window"]["PREVIEW_MODE"], true),
      strict["equal"](isPreviewModeEnabled(), true),
      strict["equal"](
        globalThis["document"]["body"]["classList"]["contains"]("preview-mode"),
        true,
      ),
      setPreviewMode(false),
      strict["equal"](globalThis["window"]["PREVIEW_MODE"], false),
      strict["equal"](
        globalThis["document"]["body"]["classList"]["contains"]("preview-mode"),
        false,
      ));
  }),
  test("previewMode: 关闭预览模式会清空会话级假加载", async () => {
    const v0 = createFakePreviewContainer();
    (startPreviewNodeLoading("node-preview-1", v0),
      strict["equal"](isPreviewNodeLoading("node-preview-1"), true),
      await new Promise((v1) => setTimeout(v1, 70)),
      strict["equal"](v0["classList"]["contains"]("img-preview-loading"), true),
      setPreviewMode(false),
      strict["equal"](isPreviewNodeLoading("node-preview-1"), false),
      strict["equal"](
        v0["classList"]["contains"]("img-preview-loading"),
        false,
      ));
  }),
  test("previewMode:\x20假加载会触发\x20start/stop\x20生命周期回调", () => {
    const v2 = createFakePreviewContainer(),
      v3 = [];
    (startPreviewNodeLoading("node-preview-callback", v2, {
      onStart: () => v3["push"]("start"),
      onStop: () => v3["push"]("stop"),
    }),
      strict["deepEqual"](v3, ["start"]),
      stopPreviewNodeLoading("node-preview-callback"),
      strict["deepEqual"](v3, ["start", "stop"]));
  }),
  test("previewMode:\x20clear\x20与退出预览模式都会触发\x20stop\x20回调", () => {
    const v4 = [];
    (startPreviewNodeLoading(
      "node-preview-clear",
      createFakePreviewContainer(),
      {
        onStart: () => v4["push"]("clear-start"),
        onStop: () => v4["push"]("clear-stop"),
      },
    ),
      clearAllPreviewNodeLoadings(),
      strict["deepEqual"](v4, ["clear-start", "clear-stop"]),
      setPreviewMode(true),
      startPreviewNodeLoading(
        "node-preview-mode-off",
        createFakePreviewContainer(),
        {
          onStart: () => v4["push"]("mode-start"),
          onStop: () => v4["push"]("mode-stop"),
        },
      ),
      setPreviewMode(false),
      strict["deepEqual"](v4, [
        "clear-start",
        "clear-stop",
        "mode-start",
        "mode-stop",
      ]));
  }),
  test("previewMode:\x20sync\x20到新实例会停旧回调并启用新回调", () => {
    const v5 = [];
    (startPreviewNodeLoading(
      "node-preview-sync",
      createFakePreviewContainer(),
      {
        onStart: () => v5["push"]("old-start"),
        onStop: () => v5["push"]("old-stop"),
      },
    ),
      syncPreviewNodeLoading(
        "node-preview-sync",
        createFakePreviewContainer(),
        {
          onStart: () => v5["push"]("new-start"),
          onStop: () => v5["push"]("new-stop"),
        },
      ),
      strict["deepEqual"](v5, ["old-start", "old-stop", "new-start"]),
      stopPreviewNodeLoading("node-preview-sync"),
      strict["deepEqual"](v5, [
        "old-start",
        "old-stop",
        "new-start",
        "new-stop",
      ]));
  }),
  test("previewMode: 工具栏中的预览专属按钮默认隐藏，仅在预览模式显示", async () => {
    const v6 = await readFile(
      new URL("../../styles/v2.css", import.meta["url"]),
      "utf8",
    );
    (strict["match"](
      v6,
      /\.node-floating-toolbar\s+\.preview-mode-only\s*\{\s*display:\s*none\s*;/,
    ),
      strict["match"](
        v6,
        /body\.preview-mode\s+\.node-floating-toolbar\s+\.preview-mode-only\s*\{\s*display:\s*inline-flex\s*;/,
      ));
  }));
