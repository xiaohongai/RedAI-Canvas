import {
  BrowserWindow,
  desktopCapturer,
  globalShortcut,
  screen,
} from "electron";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
export function createScreenshotOverlayController({
  appRoot: v0,
  dirname: v1,
  accelerator: v2,
  getMainWindow: v3,
  logDiagnosticEvent: v4,
}) {
  let v5 = null,
    v6 = null,
    v7 = null,
    v8 = "",
    v9 = false,
    v10 = {
      ok: false,
      registered: false,
      accelerator: v2,
      reason: "not-registered",
    };
  async function v11() {
    const v12 = screen["getCursorScreenPoint"](),
      v13 = screen["getDisplayNearestPoint"](v12),
      v14 = Number(v13?.["scaleFactor"] || 1) || 1,
      v15 = v13?.["bounds"] || { x: 0, y: 0, width: 0, height: 0 },
      v16 = {
        width: Math["max"](1, Math["round"](Number(v15["width"] || 1) * v14)),
        height: Math["max"](1, Math["round"](Number(v15["height"] || 1) * v14)),
      },
      v17 = await desktopCapturer["getSources"]({
        types: ["screen"],
        thumbnailSize: v16,
      }),
      v18 =
        v17["find"](
          (v19) => String(v19["display_id"] || "") === String(v13["id"]),
        ) || v17[0],
      v20 = v18?.["thumbnail"];
    if (!v20 || v20["isEmpty"]()) return { ok: false, reason: "no-image" };
    return {
      ok: true,
      mimeType: "image/png",
      dataUrl: v20["toDataURL"](),
      display: {
        id: String(v13["id"]),
        scaleFactor: v14,
        bounds: {
          x: v15["x"],
          y: v15["y"],
          width: v15["width"],
          height: v15["height"],
        },
        imageSize: v20["getSize"](),
      },
    };
  }
  function v21(v22 = v10) {
    const v23 = v3();
    if (!v23 || v23["isDestroyed"]()) return;
    if (v23["webContents"]["isDestroyed"]()) return;
    v23["webContents"]["send"]("screenshot:globalShortcutStatus", {
      accelerator: v2,
      ...v22,
    });
  }
  function v24(v25 = {}) {
    ((v10 = { accelerator: v2, ...v10, ...v25 }), v21());
  }
  function v26() {
    if (!v5 || v5["isDestroyed"]()) return;
    (void v5["webContents"]["executeJavaScript"](
      "window.__resetScreenshotOverlay?.()",
    ),
      v5["setOpacity"](1),
      v5["setAlwaysOnTop"](false),
      v5["hide"]());
  }
  function v27() {
    v6 = null;
    if (!v5 || v5["isDestroyed"]()) return;
    v5["destroy"]();
  }
  function v28(v29 = {}) {
    const v30 = v29?.["display"]?.["bounds"];
    if (v30 && v30["width"] > 0 && v30["height"] > 0)
      return {
        x: Math["round"](v30["x"]),
        y: Math["round"](v30["y"]),
        width: Math["round"](v30["width"]),
        height: Math["round"](v30["height"]),
      };
    const v31 = screen["getDisplayNearestPoint"](
      screen["getCursorScreenPoint"](),
    )?.["bounds"];
    return v31 || { x: 0, y: 0, width: 1280, height: 720 };
  }
  function v32() {
    return { x: -32000, y: -32000, width: 1, height: 1 };
  }
  async function v33(v34 = null) {
    if (v5 && !v5["isDestroyed"]()) {
      if (v6) await v6;
      return v5;
    }
    const v35 = v34 ? v28(v34) : v32();
    return (
      (v5 = new BrowserWindow({
        ...v35,
        title: "Screenshot Overlay",
        show: false,
        frame: false,
        transparent: true,
        paintWhenInitiallyHidden: true,
        fullscreen: false,
        fullscreenable: false,
        alwaysOnTop: false,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        backgroundColor: "#00000000",
        webPreferences: {
          preload: path["join"](v1, "screenshotOverlayPreload.cjs"),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      })),
      v5["on"]("closed", () => {
        ((v5 = null), (v6 = null));
      }),
      (v6 = v5["loadFile"](path["join"](v1, "screenshotOverlay.html"))["catch"](
        (v36) => {
          v6 = null;
          throw v36;
        },
      )),
      await v6,
      v5
    );
  }
  async function v37(v38) {
    const v39 = await v33();
    if (!v39 || v39["isDestroyed"]()) return;
    (v39["setOpacity"](1),
      v39["setBounds"](v38 || v28()),
      await v39["webContents"]["executeJavaScript"](
        "window.__resetScreenshotOverlay?.()",
      ),
      v39["setAlwaysOnTop"](true, "screen-saver"),
      v39["setVisibleOnAllWorkspaces"](true, { visibleOnFullScreen: true }),
      v39["show"](),
      v39["focus"]());
  }
  async function v40(v41) {
    if (!v5 || v5["isDestroyed"]()) return;
    await v5["webContents"]["executeJavaScript"](
      "window.__startScreenshotOverlay(" + JSON["stringify"](v41) + ")",
    );
  }
  async function v42() {
    if (v5 && !v5["isDestroyed"]() && v5["isVisible"]()) {
      (v5["show"](), v5["focus"]());
      return;
    }
    try {
      const v43 = v28();
      await v37(v43);
      const v44 = await v11();
      if (!v44?.["ok"]) {
        (v26(),
          v24({
            ok: false,
            registered: v9,
            reason: v44?.["reason"] || "capture-failed",
          }),
          v4({
            type: "screenshot.global_capture_failed",
            level: "warn",
            source: "main",
            message: "Global screenshot capture failed",
            context: v44 || {},
          }));
        return;
      }
      await v40(v44);
    } catch (v45) {
      (v26(),
        v24({
          ok: false,
          registered: v9,
          reason: "capture-failed",
          error: String(v45?.["message"] || v45),
        }),
        v4({
          type: "screenshot.global_overlay_failed",
          level: "error",
          source: "main",
          message: "Global\x20screenshot\x20overlay\x20failed",
          error: v45,
        }));
    }
  }
  function v46() {
    if (v9) return;
    let v47 = false;
    try {
      v47 = globalShortcut["register"](v2, () => {
        void v42();
      });
    } catch (v48) {
      v4({
        type: "screenshot.global_shortcut_register_failed",
        level: "error",
        source: "main",
        message: "Global screenshot shortcut registration threw",
        error: v48,
      });
    }
    ((v9 = v47),
      v24({
        ok: v47,
        registered: v47,
        reason: v47 ? "registered" : "registration-failed",
      }),
      v4({
        type: v47
          ? "screenshot.global_shortcut_registered"
          : "screenshot.global_shortcut_register_failed",
        level: v47 ? "info" : "warn",
        source: "main",
        message: v47
          ? "Global\x20screenshot\x20shortcut\x20registered"
          : "Global screenshot shortcut registration failed",
        context: { accelerator: v2 },
      }));
  }
  function v49() {
    if (v50()) {
      v24({ ok: false, registered: false, reason: "native-helper-starting" });
      return;
    }
    v46();
  }
  function v51() {
    (v52(), v9 && (globalShortcut["unregister"](v2), (v9 = false)));
  }
  async function v53(v54 = {}) {
    const v55 = String(v54?.["pngBase64"] || "")["trim"]();
    if (!v55) return { ok: false, reason: "empty-payload" };
    return (
      v26(),
      v56({
        pngBase64: v55,
        mimeType: String(v54?.["mimeType"] || "image/png") || "image/png",
        source: "globalShortcut",
      }),
      { ok: true }
    );
  }
  async function v57() {
    return (v26(), { ok: true });
  }
  function v58() {
    return path["join"](
      v0,
      "native",
      "screenshot-helper",
      "bin",
      "screenshot-helper.exe",
    );
  }
  function v59() {
    return path["join"](
      v0,
      "images",
      "cursors",
      "windows11-concept-v2",
      "light",
    );
  }
  function v56(v60 = {}) {
    const v61 = String(v60?.["pngBase64"] || "")["trim"]();
    if (!v61) return false;
    const v62 = v3();
    return (
      v62 &&
        !v62["isDestroyed"]() &&
        !v62["webContents"]["isDestroyed"]() &&
        v62["webContents"]["send"]("screenshot:globalCaptureReady", {
          pngBase64: v61,
          mimeType: String(v60?.["mimeType"] || "image/png") || "image/png",
          source: v60?.["source"] || "nativeHelper",
          createdAt: Date["now"](),
        }),
      true
    );
  }
  function v63(v64) {
    const v65 = String(v64 || "")["trim"]();
    if (!v65) return;
    let v66 = null;
    try {
      v66 = JSON["parse"](v65);
    } catch (v67) {
      v4({
        type: "screenshot.native_helper_bad_message",
        level: "warn",
        source: "main",
        message: "Native screenshot helper sent an invalid message",
        context: { raw: v65["slice"](0, 160) },
        error: v67,
      });
      return;
    }
    if (v66?.["type"] === "status") {
      const v68 = v66["registered"] === true;
      v24({
        ok: v68,
        registered: v68,
        reason: v68 ? "registered-native" : "native-registration-failed",
      });
      !v68 && (v52(), v46());
      return;
    }
    v66?.["type"] === "capture" &&
      v56({
        pngBase64: v66["pngBase64"],
        mimeType: v66["mimeType"] || "image/png",
        source: "nativeHelper",
      });
  }
  function v50() {
    if (process["platform"] !== "win32") return false;
    if (v7 && !v7["killed"]) return true;
    const v69 = v58();
    if (!existsSync(v69))
      return (
        v4({
          type: "screenshot.native_helper_missing",
          level: "warn",
          source: "main",
          message: "Native screenshot helper executable is missing",
          context: { helperPath: v69 },
        }),
        false
      );
    try {
      ((v8 = ""),
        (v7 = spawn(v69, [], {
          env: { ...process["env"], AICANVAS_CURSOR_DIR: v59() },
          stdio: ["ignore", "pipe", "pipe"],
          windowsHide: true,
        })));
    } catch (v70) {
      return (
        v4({
          type: "screenshot.native_helper_start_failed",
          level: "error",
          source: "main",
          message: "Native screenshot helper failed to start",
          error: v70,
          context: { helperPath: v69 },
        }),
        (v7 = null),
        false
      );
    }
    return (
      v7["stdout"]?.["setEncoding"]("utf8"),
      v7["stdout"]?.["on"]("data", (v71) => {
        v8 += String(v71 || "");
        let v72 = v8["indexOf"]("\x0a");
        while (v72 >= 0) {
          const v73 = v8["slice"](0, v72);
          ((v8 = v8["slice"](v72 + 1)),
            v63(v73),
            (v72 = v8["indexOf"]("\x0a")));
        }
      }),
      v7["stderr"]?.["setEncoding"]("utf8"),
      v7["stderr"]?.["on"]("data", (v74) => {
        v4({
          type: "screenshot.native_helper_stderr",
          level: "warn",
          source: "main",
          message: "Native screenshot helper stderr",
          context: { text: String(v74 || "")["slice"](0, 1000) },
        });
      }),
      v7["on"]("exit", (v75, v76) => {
        ((v7 = null),
          (v8 = ""),
          v24({ ok: false, registered: false, reason: "native-helper-exited" }),
          v4({
            type: "screenshot.native_helper_exited",
            level: v75 === 0 ? "info" : "warn",
            source: "main",
            message: "Native screenshot helper exited",
            context: { code: v75, signal: v76 },
          }));
      }),
      v7["on"]("error", (v77) => {
        ((v7 = null),
          v24({
            ok: false,
            registered: false,
            reason: "native-helper-error",
            error: String(v77?.["message"] || v77),
          }));
      }),
      true
    );
  }
  function v52() {
    if (!v7 || v7["killed"]) return;
    try {
      v7["kill"]();
    } catch {
    } finally {
      ((v7 = null), (v8 = ""));
    }
  }
  return {
    captureDesktopDisplay: v11,
    destroyScreenshotOverlayWindow: v27,
    handleScreenshotOverlayCancel: v57,
    handleScreenshotOverlayConfirm: v53,
    installGlobalScreenshotShortcut: v49,
    sendGlobalScreenshotShortcutStatus: v21,
    uninstallGlobalScreenshotShortcut: v51,
  };
}
