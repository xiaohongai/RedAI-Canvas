import {
  app,
  autoUpdater as autoUpdater,
  BrowserWindow,
  dialog,
  Menu,
  nativeImage,
  Notification,
  powerSaveBlocker,
  protocol,
  safeStorage,
  screen,
  session,
  shell,
  WebContentsView,
} from "electron";
import electronUpdater from "electron-updater";
import { execFileSync, spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  copyFileSync,
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import http from "node:http";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { installAppMenu } from "./appMenu.js";
import { createDeviceIdentityManager } from "./deviceIdentity.js";
import { createDiagnosticsManager } from "./diagnostics.js";
import {
  formatExternalUrlForLog,
  normalizeExternalUrl,
} from "./externalLinks.js";
import { createLocalAssetCleanupManager } from "./localAssetCleanup.js";
import {
  createLocalAssetCleanupRootsResolver,
  readFileSavePathsForLocalCleanup,
} from "./localAssetCleanupRoots.js";
import { MediaTaskQueue } from "./mediaTaskQueue.js";
import { createAudioComposeMediaTaskHandler } from "./mediaTasks/audioComposeTask.js";
import { createMediaClipExportTaskHandler } from "./mediaTasks/mediaClipExportTask.js";
import { syncRecentProjectsToSystemRecentDocuments } from "./recentDocuments.js";
import {
  installRecoverySnapshotBeforeClose,
  requestRendererRecoverySnapshot,
} from "./recoverySnapshot.js";
import { createSecureSettingsStore } from "./secureSettingsStore.js";
import { createScreenshotOverlayController } from "./screenshotOverlayController.js";
import {
  buildLegacyFileSavePathEnv,
  createStorageRoots,
} from "./storageRoots.js";
import { createUpdaterController } from "./updaterController.js";
import {
  extractPreviewVideoUrlFromNotes,
  normalizeUpdaterInfoPayload,
} from "./updaterInfoNormalizer.js";
import { createUpdateInstallPreparation } from "./updateInstallPreparation.js";
import { createMainIpcHandlerInstaller } from "./ipc/mainIpcSetup.js";
import { createLocalRuntimeKeepAliveController } from "./localRuntimeKeepAlive.js";
import { configureRendererResponsiveness } from "./rendererResponsiveness.js";
import { createWebPreviewViewManager } from "./webPreviewViewManager.js";
import {
  buildDefaultProjectPath,
  findFirstSupportedProjectPathFromArgs,
  findRecentProject,
  getRecoverySnapshotInfo as getRecoverySnapshotInfo,
  listRecentProjects,
  readProjectJson,
  readRecoverySnapshot as readRecoverySnapshot,
  removeRecentProject,
  removeRecoverySnapshot as removeRecoverySnapshot,
  sanitizeProjectName,
  stripProjectFileExtension,
  SUPPORTED_PROJECT_FILE_EXTENSIONS,
  upsertRecentProject,
  withJsonProjectExtension,
  writeProjectJson,
  writeRecoverySnapshot as writeRecoverySnapshot,
} from "../src/services/desktopProjectFileStore.js";
import { registerIpcHandlers } from "./ipc/registerIpcHandlers.js";
const APP_DISPLAY_NAME = "RedAI-Canvas",
  APP_USER_DATA_ROOT = path["join"](
    app["getPath"]("appData"),
    APP_DISPLAY_NAME,
  ),
  __filename = fileURLToPath(import.meta["url"]),
  __dirname = path["dirname"](__filename),
  APP_ROOT = app["isPackaged"]
    ? app["getAppPath"]()
    : path["resolve"](__dirname, ".."),
  RUNTIME_ROOT = app["isPackaged"]
    ? path["join"](process["resourcesPath"], "runtime")
    : path["join"](APP_ROOT, ".electron-runtime", "runtime"),
  STORAGE_ROOTS = createStorageRoots({
    appIsPackaged: app["isPackaged"],
    appRoot: APP_ROOT,
    processExecPath: process["execPath"],
    userDataRoot: APP_USER_DATA_ROOT,
    localAppData: process["env"]["LOCALAPPDATA"],
  }),
  PACKAGED_INSTALL_ROOT = STORAGE_ROOTS["installRoot"],
  PACKAGED_INSTALL_DATA_ROOT = STORAGE_ROOTS["installDataRoot"],
  PACKAGED_FILES_ROOT = STORAGE_ROOTS["storageRoot"],
  LEGACY_PACKAGED_FILES_ROOTS = STORAGE_ROOTS["legacyFilesRoots"],
  LEGACY_PACKAGED_FILES_ROOT = LEGACY_PACKAGED_FILES_ROOTS[0] || APP_ROOT,
  HOST = "127.0.0.1",
  PORT =
    Number["parseInt"](process["env"]["AICANVAS_PORT"] || "8777", 10) || 8777,
  APP_ORIGIN = "http://" + HOST + ":" + PORT,
  APP_URL = APP_ORIGIN + "/",
  SERVER_READY_TIMEOUT_MS = 30000,
  SERVER_READY_INTERVAL_MS = 400,
  LOCAL_ACCESS_TOKEN = randomBytes(32)["toString"]("hex"),
  SERVER_ID_HEADER = "x-aicanvas-server",
  SERVER_ID_VALUE = "RedAI-Canvas",
  LOCAL_PREVIEW_SCHEME = "aic-local-preview",
  LOCAL_PREVIEW_TTL_MS = 12 * 60 * 60 * 1000,
  LONG_MEDIA_TASK_NOTIFICATION_MS = 20000,
  VIDEO_PROXY_TRANSCODE_PRESET = "veryfast",
  VIDEO_PROXY_TRANSCODE_CRF = "23",
  CLIPBOARD_FILE_REFERENCES_FORMAT = "application/x-ai-canvas-file-references",
  RECOVERY_SNAPSHOT_FILENAME = "recovery-snapshot.json",
  GLOBAL_SCREENSHOT_ACCELERATOR = "Alt+Q";
let mainWindow = null,
  spawnedServer = null,
  updaterHandlersInstalled = false,
  updateCheckStarted = false,
  autoUpdaterInstance = null,
  updaterController = null,
  localApiTokenHeaderInstalled = false,
  latestUpdaterEvent = null,
  latestUpdaterInfo = null,
  localPreviewProtocolInstalled = false,
  backendRestartInProgress = false,
  mediaTaskQueue = null,
  localAssetCleanupManager = null,
  secureSettingsStore = null,
  updateInstallPreparation = null,
  mediaTaskActivity = {
    activeCount: 0,
    waitingCount: 0,
    totalCount: 0,
    progress: 0,
    activeTasks: [],
  },
  rendererProjectState = { hasUnsavedChanges: false, projectName: "" },
  isQuittingForUpdate = false;
const pendingExternalProjectOpenRequests = [],
  localPreviewEntries = new Map(),
  taskbarProgressSources = new Map(),
  powerSaveBlockerReasons = new Map(),
  notifiedMediaTaskIds = new Set();
(configureRendererResponsiveness(app),
  protocol["registerSchemesAsPrivileged"]([
    {
      scheme: LOCAL_PREVIEW_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
      },
    },
  ]),
  app["setName"](APP_DISPLAY_NAME));
const GOT_SINGLE_INSTANCE_LOCK = app["requestSingleInstanceLock"]();
!GOT_SINGLE_INSTANCE_LOCK && (app["exit"](0), process["exit"](0));
const USER_DATA_DIR = APP_USER_DATA_ROOT;
(mkdirSync(USER_DATA_DIR, { recursive: true }),
  app["setPath"]("userData", USER_DATA_DIR));
const LOG_DIR = path["join"](USER_DATA_DIR, "logs"),
  SERVER_LOG_PATH = path["join"](LOG_DIR, "server.log"),
  WINDOW_STATE_PATH = path["join"](USER_DATA_DIR, "window-state.json");
mkdirSync(LOG_DIR, { recursive: true });
const DEFAULT_WINDOW_STATE = { width: 1440, height: 960, isMaximized: false },
  diagnostics = createDiagnosticsManager({
    app: app,
    logDir: LOG_DIR,
    diagnosticsDir: path["join"](LOG_DIR, "diagnostics"),
    serverLogPath: SERVER_LOG_PATH,
    getMetadata: async () => ({
      app: {
        name: APP_DISPLAY_NAME,
        version: readAppVersionFromIndexHtml() || app["getVersion"](),
        packaged: app["isPackaged"],
        appPathType: app["isPackaged"] ? "packaged" : "development",
      },
      runtime: {
        electron: process["versions"]["electron"] || "",
        chrome: process["versions"]["chrome"] || "",
        node: process["versions"]["node"] || "",
        v8: process["versions"]["v8"] || "",
      },
      backend: {
        url: APP_URL,
        spawned: Boolean(spawnedServer),
        pid: spawnedServer?.["pid"] || null,
        ready: await probeServer(),
      },
      updater: {
        ...(updaterController?.["getState"]?.() || {}),
        latestEvent: latestUpdaterEvent || null,
        latestInfo: latestUpdaterInfo || null,
      },
      paths: {
        logs: "userData/logs",
        diagnostics: "userData/logs/diagnostics\x20or\x20Downloads",
      },
    }),
  }),
  screenshotOverlayController = createScreenshotOverlayController({
    appRoot: APP_ROOT,
    dirname: __dirname,
    accelerator: GLOBAL_SCREENSHOT_ACCELERATOR,
    getMainWindow: () => mainWindow,
    logDiagnosticEvent: logDiagnosticEvent,
  });
diagnostics["ensureInitialFiles"]();
function logDiagnosticEvent(v0 = {}) {
  return diagnostics["logEvent"](v0);
}
const localRuntimeKeepAlive = createLocalRuntimeKeepAliveController({
  getWindow: () => mainWindow,
  requestLocalJson: requestLocalJson,
  setPowerSaveBlocker: setPowerSaveBlocker,
  logDiagnosticEvent: logDiagnosticEvent,
});
function normalizeTaskbarProgress(v1) {
  const v2 = Number(v1);
  if (!Number["isFinite"](v2) || v2 < 0) return null;
  return Math["max"](0, Math["min"](1, v2));
}
function refreshTaskbarProgress() {
  if (!mainWindow || mainWindow["isDestroyed"]()) return;
  const v3 =
    taskbarProgressSources["get"]("updater") ??
    taskbarProgressSources["get"]("media") ??
    null;
  mainWindow["setProgressBar"](v3 == null ? -1 : v3);
}
function setTaskbarProgressSource(v4, v5) {
  const v6 = String(v4 || "")["trim"]();
  if (!v6) return;
  const v7 = normalizeTaskbarProgress(v5);
  (v7 == null
    ? taskbarProgressSources["delete"](v6)
    : taskbarProgressSources["set"](v6, v7),
    refreshTaskbarProgress());
}
function setPowerSaveBlocker(v8, v9, v10 = "prevent-display-sleep") {
  const v11 = String(v8 || "")["trim"]();
  if (!v11) return;
  const v12 =
    v10 === "prevent-app-suspension"
      ? "prevent-app-suspension"
      : "prevent-display-sleep";
  if (v9) {
    if (powerSaveBlockerReasons["has"](v11)) return;
    const v13 = powerSaveBlocker["start"](v12);
    (powerSaveBlockerReasons["set"](v11, v13),
      logDiagnosticEvent({
        type: "power_save_blocker.started",
        level: "info",
        source: "main",
        message: "Power save blocker started",
        context: { reason: v11, blockerId: v13, type: v12 },
      }));
    return;
  }
  const v14 = powerSaveBlockerReasons["get"](v11);
  if (v14 == null) return;
  powerSaveBlockerReasons["delete"](v11);
  try {
    powerSaveBlocker["isStarted"](v14) && powerSaveBlocker["stop"](v14);
  } catch (v15) {
    console["warn"]("[electron] failed to stop power save blocker:", v15);
  }
  logDiagnosticEvent({
    type: "power_save_blocker.stopped",
    level: "info",
    source: "main",
    message: "Power save blocker stopped",
    context: { reason: v11, blockerId: v14 },
  });
}
function stopAllPowerSaveBlockers() {
  for (const v16 of [...powerSaveBlockerReasons["keys"]()]) {
    setPowerSaveBlocker(v16, false);
  }
}
function normalizeWindowState(v17) {
  const v18 = v17 && typeof v17 === "object" ? v17 : {},
    v19 =
      v18["bounds"] && typeof v18["bounds"] === "object" ? v18["bounds"] : v18,
    v20 = Number["parseInt"](v19["width"], 10),
    v21 = Number["parseInt"](v19["height"], 10),
    v22 = Number["parseInt"](v19["x"], 10),
    v23 = Number["parseInt"](v19["y"], 10),
    v24 = {
      width:
        Number["isFinite"](v20) && v20 >= 1024
          ? v20
          : DEFAULT_WINDOW_STATE["width"],
      height:
        Number["isFinite"](v21) && v21 >= 720
          ? v21
          : DEFAULT_WINDOW_STATE["height"],
      isMaximized: v18["isMaximized"] === true,
    };
  return (
    Number["isFinite"](v22) &&
      Number["isFinite"](v23) &&
      ((v24["x"] = v22), (v24["y"] = v23)),
    v24
  );
}
function isWindowStateOnDisplay(v25) {
  if (!Number["isFinite"](v25?.["x"]) || !Number["isFinite"](v25?.["y"]))
    return true;
  const v26 = {
    x: v25["x"],
    y: v25["y"],
    width: v25["width"],
    height: v25["height"],
  };
  return screen["getAllDisplays"]()["some"](({ workArea: v27 }) => {
    return (
      v26["x"] < v27["x"] + v27["width"] &&
      v26["x"] + v26["width"] > v27["x"] &&
      v26["y"] < v27["y"] + v27["height"] &&
      v26["y"] + v26["height"] > v27["y"]
    );
  });
}
function readWindowState() {
  try {
    const v28 = normalizeWindowState(
      JSON["parse"](readFileSync(WINDOW_STATE_PATH, "utf8")),
    );
    return (
      !isWindowStateOnDisplay(v28) && (delete v28["x"], delete v28["y"]),
      v28
    );
  } catch {
    return { ...DEFAULT_WINDOW_STATE };
  }
}
function writeWindowState(v29) {
  if (!v29 || v29["isDestroyed"]()) return;
  const v30 = v29["getBounds"](),
    v31 = normalizeWindowState({ ...v30, isMaximized: v29["isMaximized"]() }),
    v32 =
      WINDOW_STATE_PATH + "." + process["pid"] + "." + Date["now"]() + ".tmp";
  try {
    (mkdirSync(path["dirname"](WINDOW_STATE_PATH), { recursive: true }),
      writeFileSync(v32, JSON["stringify"](v31, null, 2) + "\x0a", "utf8"),
      renameSync(v32, WINDOW_STATE_PATH));
  } catch (v33) {
    console["warn"]("[electron] failed to save window state:", v33);
  }
}
function installWindowStatePersistence(v34) {
  let v35 = null;
  const v36 = () => {
    if (v35) clearTimeout(v35);
    v35 = setTimeout(() => {
      ((v35 = null), writeWindowState(v34));
    }, 400);
  };
  (v34["on"]("move", v36),
    v34["on"]("resize", v36),
    v34["on"]("maximize", v36),
    v34["on"]("unmaximize", v36),
    v34["on"]("close", () => {
      (v35 && (clearTimeout(v35), (v35 = null)), writeWindowState(v34));
    }));
}
function delay(v37) {
  return new Promise((v38) => {
    setTimeout(v38, v37);
  });
}
function escapeHtml(v39) {
  return String(v39 ?? "")
    ["replace"](/&/g, "&amp;")
    ["replace"](/</g, "&lt;")
    ["replace"](/>/g, "&gt;")
    ["replace"](/"/g, "&quot;")
    ["replace"](/'/g, "&#39;");
}
function createStartupHtml(v40 = {}) {
  const v41 = String(v40["kind"] || "loading"),
    v42 = escapeHtml(v40["title"] || APP_DISPLAY_NAME + " 正在启动"),
    v43 = escapeHtml(v40["detail"] || ""),
    v44 = escapeHtml(v40["hint"] || ""),
    v45 = v41 === "error";
  return (
    '<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>' +
    v42 +
    '</title>\n  <style>\n    :root {\n      color-scheme: light dark;\n      font-family: "Segoe UI", Arial, sans-serif;\n      background: Canvas;\n      color: CanvasText;\n    }\n    body {\n      margin: 0;\n      min-height: 100vh;\n      display: grid;\n      place-items: center;\n      background: Canvas;\n    }\n    main {\n      width: min(560px, calc(100vw - 56px));\n    }\n    h1 {\n      margin: 0 0 14px;\n      font-size: 24px;\n      font-weight: 650;\n      letter-spacing: 0;\n    }\n    p {\n      margin: 8px 0;\n      color: GrayText;\n      line-height: 1.55;\n      font-size: 14px;\n    }\n    .mark {\n      width: 40px;\n      height: 40px;\n      border-radius: 50%;\n      margin-bottom: 22px;\n      border: 3px solid ' +
    (v45 ? "Mark" : "AccentColor") +
    ";\n      border-top-color: transparent;\n      animation: " +
    (v45 ? "none" : "spin 0.9s linear infinite") +
    ';\n    }\n    @keyframes spin {\n      to { transform: rotate(360deg); }\n    }\n  </style>\n</head>\n<body>\n  <main>\n    <div class="mark"></div>\n    <h1>' +
    v42 +
    "</h1>\n    " +
    (v43 ? "<p>" + v43 + "</p>" : "") +
    "\x0a\x20\x20\x20\x20" +
    (v44 ? "<p>" + v44 + "</p>" : "") +
    "\x0a\x20\x20</main>\x0a</body>\x0a</html>"
  );
}
function loadStartupStatus(v46) {
  if (!mainWindow || mainWindow["isDestroyed"]()) return;
  const v47 = createStartupHtml(v46);
  void mainWindow["loadURL"](
    "data:text/html;charset=utf-8," + encodeURIComponent(v47),
  );
}
function isLocalAppUrl(v48) {
  try {
    const v49 = new URL(v48);
    return v49["origin"] === APP_ORIGIN;
  } catch {
    return false;
  }
}
function openExternalUrl(v50) {
  const v51 = normalizeExternalUrl(v50);
  if (!v51)
    return (
      logDiagnosticEvent({
        type: "external_link.blocked",
        level: "warn",
        source: "main",
        message: "Blocked external link",
        context: { reason: "invalid-or-disallowed-protocol" },
      }),
      { ok: false, error: "不允许打开该外部链接" }
    );
  return (
    void shell["openExternal"](v51),
    logDiagnosticEvent({
      type: "external_link.opened",
      level: "info",
      source: "main",
      message: "Opened\x20external\x20link",
      context: { url: formatExternalUrlForLog(v51) },
    }),
    { ok: true, url: v51 }
  );
}
function probeServer(v52 = 1200) {
  return new Promise((v53) => {
    const v54 = http["get"](
      APP_ORIGIN + "/api/v2/runtime/info",
      { timeout: v52 },
      (v55) => {
        const v56 = String(v55["headers"][SERVER_ID_HEADER] || "");
        (v55["resume"](),
          v53(v55["statusCode"] === 200 && v56 === SERVER_ID_VALUE));
      },
    );
    (v54["on"]("timeout", () => {
      (v54["destroy"](), v53(false));
    }),
      v54["on"]("error", () => {
        v53(false);
      }));
  });
}
function requestLocalJson(v57, v58 = 1600) {
  return new Promise((v59, v60) => {
    const v61 = http["request"](
      {
        hostname: HOST,
        port: PORT,
        path: v57,
        method: "GET",
        timeout: v58,
        headers: { "X-AIC-Local-Token": LOCAL_ACCESS_TOKEN },
      },
      (v62) => {
        const v63 = [];
        (v62["on"]("data", (v64) => v63["push"](Buffer["from"](v64))),
          v62["on"]("end", () => {
            const v65 = Buffer["concat"](v63)["toString"]("utf8");
            if (v62["statusCode"] < 200 || v62["statusCode"] >= 300) {
              v60(new Error(v65 || "HTTP " + v62["statusCode"]));
              return;
            }
            try {
              v59(v65 ? JSON["parse"](v65) : {});
            } catch (v66) {
              v60(v66);
            }
          }));
      },
    );
    (v61["on"]("timeout", () => {
      v61["destroy"](new Error("Local service request timed out"));
    }),
      v61["on"]("error", v60),
      v61["end"]());
  });
}
function collectListeningPortPids(v67) {
  try {
    if (process["platform"] === "win32") {
      const v68 = execFileSync("netstat", ["-ano", "-p", "tcp"], {
        encoding: "utf8",
        windowsHide: true,
      });
      return v68["split"](/\r?\n/)
        ["map"]((v69) => v69["trim"]())
        ["filter"]((v70) => v70["includes"]("LISTENING"))
        ["map"]((v71) => v71["split"](/\s+/))
        ["filter"](
          (v72) => v72["length"] >= 5 && v72[1]?.["endsWith"](":" + v67),
        )
        ["map"]((v73) => Number["parseInt"](v73[4], 10))
        ["filter"](
          (v74) =>
            Number["isInteger"](v74) && v74 > 0 && v74 !== process["pid"],
        );
    }
    const v75 = execFileSync(
      "lsof",
      ["-nP", "-iTCP:" + v67, "-sTCP:LISTEN", "-t"],
      { encoding: "utf8", windowsHide: true },
    );
    return v75["split"](/\r?\n/)
      ["map"]((v76) => Number["parseInt"](v76["trim"](), 10))
      ["filter"](
        (v77) => Number["isInteger"](v77) && v77 > 0 && v77 !== process["pid"],
      );
  } catch {
    return [];
  }
}
async function clearPortBeforeStart(v78 = null) {
  const v79 = [...new Set(collectListeningPortPids(PORT))];
  if (!v79["length"]) return;
  v78?.({
    kind: "loading",
    title: APP_DISPLAY_NAME + " 正在启动",
    detail: "正在恢复上次未关闭的运行环境。",
    hint: "启动完成后会自动进入画布。",
  });
  for (const v80 of v79) {
    try {
      process["platform"] === "win32"
        ? execFileSync("taskkill", ["/PID", String(v80), "/F", "/T"], {
            stdio: "ignore",
            windowsHide: true,
          })
        : process["kill"](v80, "SIGTERM");
    } catch (v81) {
      console["warn"](
        "[electron]\x20failed\x20to\x20clear\x20port\x20" +
          PORT +
          " pid " +
          v80 +
          ":",
        v81,
      );
    }
  }
  await delay(800);
}
function resolvePythonCommand() {
  if (app["isPackaged"]) {
    const v82 =
      process["platform"] === "win32"
        ? [
            path["join"](RUNTIME_ROOT, "python", "python.exe"),
            path["join"](RUNTIME_ROOT, "python", "Scripts", "python.exe"),
          ]
        : [
            path["join"](RUNTIME_ROOT, "python", "bin", "python3"),
            path["join"](RUNTIME_ROOT, "python", "bin", "python"),
          ];
    return v82["find"]((v83) => existsSync(v83)) || v82[0];
  }
  const v84 =
    process["platform"] === "win32"
      ? [
          path["join"](APP_ROOT, "venv", "python.exe"),
          path["join"](APP_ROOT, "venv", "Scripts", "python.exe"),
          "python",
        ]
      : [
          path["join"](APP_ROOT, "venv", "bin", "python3"),
          path["join"](APP_ROOT, "venv", "bin", "python"),
          "python3",
          "python",
        ];
  return v84["find"]((v85) => {
    return path["isAbsolute"](v85) ? existsSync(v85) : true;
  });
}
function resolveRuntimeTool(v86) {
  const v87 =
      process["platform"] === "win32" && !v86["endsWith"](".exe")
        ? v86 + ".exe"
        : v86,
    v88 = path["join"](RUNTIME_ROOT, "ffmpeg", "bin", v87);
  return existsSync(v88) ? v88 : "";
}
function buildPackagedServerEnv() {
  const v89 = app["getPath"]("userData"),
    v90 = getStorageRoot();
  return {
    AIC_USER_DIR: path["join"](v89, "user"),
    AIC_CANVAS_DIR: path["join"](v90, "projects"),
    AIC_DATA_DIR: path["join"](v90, "data"),
    AIC_OUTPUT_DIR: path["join"](v90, "output"),
    AIC_UPLOADS_DIR: path["join"](v90, "data", "uploads"),
    AIC_ASSETS_DIR: path["join"](v90, "data", "assets"),
    AIC_WORKFLOWS_DIR: path["join"](v90, "data", "workflows"),
    ...buildLegacyFileSavePathEnv(LEGACY_PACKAGED_FILES_ROOTS),
    AIC_FFMPEG_EXE: resolveRuntimeTool("ffmpeg"),
    AIC_FFPROBE_EXE: resolveRuntimeTool("ffprobe"),
  };
}
function getStorageRoot() {
  return PACKAGED_FILES_ROOT;
}
function getUserRoot() {
  return path["join"](app["getPath"]("userData"), "user");
}
const { getStableDeviceId } = createDeviceIdentityManager({
    app: app,
    appRoot: APP_ROOT,
    getUserRoot: getUserRoot,
    logEvent: logDiagnosticEvent,
  }),
  webPreviewViewManager = createWebPreviewViewManager({
    WebContentsView: WebContentsView,
    getMainWindow: () => mainWindow,
    openExternalUrl: openExternalUrl,
    logDiagnosticEvent: logDiagnosticEvent,
  }),
  installIpcHandlers = createMainIpcHandlerInstaller({
    registerIpcHandlers: registerIpcHandlers,
    context: {
      app: app,
      readAppVersionFromIndexHtml: readAppVersionFromIndexHtml,
      getStableDeviceId: getStableDeviceId,
      getUpdaterController: getUpdaterController,
      getSecureSettingsStore: getSecureSettingsStore,
      normalizeSecureSettingsKeys: normalizeSecureSettingsKeys,
      fileReferencesFormat: CLIPBOARD_FILE_REFERENCES_FORMAT,
      createClipboardNativeImage: createClipboardNativeImage,
      screenshotOverlayController: screenshotOverlayController,
      normalizeClipboardFileReferences: normalizeClipboardFileReferences,
      parseClipboardFileReferencesFromText:
        parseClipboardFileReferencesFromText,
      openDesktopProject: openDesktopProject,
      saveDesktopProject: saveDesktopProject,
      handleRendererUnsavedState: handleRendererUnsavedState,
      listRecentProjects: listRecentProjects,
      removeRecentProject: removeRecentProject,
      getRecentProjectsStorePath: getRecentProjectsStorePath,
      syncSystemRecentDocumentsBestEffort: syncSystemRecentDocumentsBestEffort,
      pendingExternalProjectOpenRequests: pendingExternalProjectOpenRequests,
      writeDesktopRecoverySnapshot: writeDesktopRecoverySnapshot,
      getDesktopRecoverySnapshotInfo: getDesktopRecoverySnapshotInfo,
      readDesktopRecoverySnapshot: readDesktopRecoverySnapshot,
      clearDesktopRecoverySnapshot: clearDesktopRecoverySnapshot,
      importAssetToLibrary: importAssetToLibrary,
      createLocalPreviewUrl: createLocalPreviewUrl,
      resolveLocalVirtualPath: resolveLocalVirtualPath,
      resolveKnownFolder: resolveKnownFolder,
      openExternalUrl: openExternalUrl,
      getWebPreviewViewManager: () => webPreviewViewManager,
      selectDirectory: selectDirectory,
      getMediaTaskQueue: getMediaTaskQueue,
      getLocalAssetCleanupManager: getLocalAssetCleanupManager,
      diagnostics: diagnostics,
      logDir: LOG_DIR,
      logDiagnosticEvent: logDiagnosticEvent,
    },
  });
function readJsonFileSyncSafe(v91) {
  try {
    return JSON["parse"](readFileSync(v91, "utf8")["replace"](/^\uFEFF/, ""));
  } catch {
    return {};
  }
}
function readConfiguredFileSavePathsSync() {
  const v92 = process["env"]["LOCALAPPDATA"] || app["getPath"]("userData"),
    v93 = [
      path["join"](getUserRoot(), "settings.json"),
      path["join"](APP_ROOT, "user", "settings.json"),
      path["join"](v92, "RedAI-Canvas", "settings.json"),
    ];
  for (const v94 of v93) {
    const v95 = readJsonFileSyncSafe(v94),
      v96 = v95?.["fileSavePaths"];
    if (v96 && typeof v96 === "object") return v96;
  }
  return {};
}
function getConfiguredPath(v97, v98) {
  const v99 = String(readConfiguredFileSavePathsSync()?.[v97] || "")["trim"]();
  return v99 ? path["resolve"](v99) : v98;
}
function getDataDir() {
  const v100 = readConfiguredFileSavePathsSync(),
    v101 = String(v100?.["dataDir"] || "")["trim"]();
  if (v101) return path["resolve"](v101);
  const v102 = String(v100?.["tempDir"] || "")["trim"]();
  if (v102) {
    const v103 = path["resolve"](v102);
    return path["basename"](v103)["toLowerCase"]() === "uploads"
      ? path["dirname"](v103)
      : v103;
  }
  return path["join"](getStorageRoot(), "data");
}
function getCanvasProjectDir() {
  return getConfiguredPath(
    "canvasDir",
    path["join"](getStorageRoot(), "projects"),
  );
}
function getRecentProjectsStorePath() {
  return path["join"](app["getPath"]("userData"), "recent-projects.json");
}
function getSecureSettingsStorePath() {
  return path["join"](app["getPath"]("userData"), "secure-settings.json");
}
function getRecoverySnapshotPath() {
  return path["join"](app["getPath"]("userData"), RECOVERY_SNAPSHOT_FILENAME);
}
function getUploadsDir() {
  const v104 = readConfiguredFileSavePathsSync();
  if (
    !String(v104?.["dataDir"] || "")["trim"]() &&
    String(v104?.["tempDir"] || "")["trim"]()
  )
    return path["resolve"](v104["tempDir"]);
  return path["join"](getDataDir(), "uploads");
}
function getOutputDir() {
  return getConfiguredPath(
    "outputDir",
    path["join"](getStorageRoot(), "output"),
  );
}
function getAssetsDir() {
  return path["join"](getDataDir(), "assets");
}
function getWorkflowsDir() {
  return path["join"](getDataDir(), "workflows");
}
function getAssetOriginalDir() {
  return path["join"](getAssetsDir(), "original");
}
function getAssetIndexPath() {
  return path["join"](getAssetsDir(), "assets.index.json");
}
function sanitizeUploadFilename(v105) {
  const v106 = path["basename"](String(v105 || "upload"));
  return v106["replace"](/[\\/:*?"<>|]/g, "_")["trim"]() || "upload";
}
function allocateUniqueUploadPath(v107, v108) {
  const v109 = sanitizeUploadFilename(v108),
    v110 = path["parse"](v109),
    v111 = v110["name"] || "upload",
    v112 = v110["ext"] || "",
    v113 = Date["now"]();
  for (let v114 = 0; v114 < 1000; v114 += 1) {
    const v115 =
        v114 === 0
          ? v109
          : v111 + "_" + v113 + "_" + String(v114)["padStart"](3, "0") + v112,
      v116 = path["join"](v107, v115);
    if (!existsSync(v116))
      return { safeFilename: v109, storedFilename: v115, targetPath: v116 };
  }
  throw new Error("Unable to allocate unique upload filename");
}
function getSafeOriginalExtension(v117, v118 = "") {
  const v119 = path["extname"](sanitizeUploadFilename(v117))["toLowerCase"]();
  if (v119 && v119["length"] <= 12) return v119;
  const v120 = String(v118 || "")
      ["split"](";")[0]
      ["trim"]()
      ["toLowerCase"](),
    v121 = {
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/webp": ".webp",
      "image/gif": ".gif",
      "image/bmp": ".bmp",
      "image/avif": ".avif",
      "video/mp4": ".mp4",
      "video/webm": ".webm",
      "video/quicktime": ".mov",
      "audio/mpeg": ".mp3",
      "audio/mp3": ".mp3",
      "audio/wav": ".wav",
      "audio/x-wav": ".wav",
      "audio/mp4": ".m4a",
      "audio/x-m4a": ".m4a",
      "audio/aac": ".aac",
      "audio/ogg": ".ogg",
      "audio/flac": ".flac",
      "audio/webm": ".webm",
    };
  return v121[v120] || ".bin";
}
function classifyAssetKind(v122 = "", v123 = "") {
  const v124 = String(v123 || "")
    ["split"](";")[0]
    ["trim"]()
    ["toLowerCase"]();
  if (v124["startsWith"]("image/")) return "image";
  if (v124["startsWith"]("video/")) return "video";
  if (v124["startsWith"]("audio/")) return "audio";
  const v125 = path["extname"](String(v122 || ""))["toLowerCase"]();
  if (/\.(?:png|jpe?g|webp|gif|bmp|avif|svg)$/i["test"](v125)) return "image";
  if (/\.(?:mp4|webm|mov|m4v|avi|mkv)$/i["test"](v125)) return "video";
  if (/\.(?:mp3|wav|m4a|aac|ogg|flac|opus|webm)$/i["test"](v125))
    return "audio";
  return "file";
}
function hashBuffer(v126) {
  return createHash("sha256")["update"](v126)["digest"]("hex");
}
function readAssetIndex() {
  try {
    const v127 = JSON["parse"](readFileSync(getAssetIndexPath(), "utf8"));
    if (v127 && typeof v127 === "object")
      return {
        version: 1,
        assets:
          v127["assets"] && typeof v127["assets"] === "object"
            ? v127["assets"]
            : {},
      };
  } catch {}
  return { version: 1, assets: {} };
}
function writeAssetIndex(v128) {
  const v129 = getAssetIndexPath();
  mkdirSync(path["dirname"](v129), { recursive: true });
  const v130 = {
      version: 1,
      assets:
        v128?.["assets"] && typeof v128["assets"] === "object"
          ? v128["assets"]
          : {},
    },
    v131 = v129 + "." + process["pid"] + "." + Date["now"]() + ".tmp";
  (writeFileSync(v131, JSON["stringify"](v130, null, 2) + "\x0a", "utf8"),
    renameSync(v131, v129));
}
function toAssetLocalPath(...v132) {
  return ["data", "assets", ...v132]
    ["filter"](Boolean)
    ["join"]("/")
    ["replace"](/\\/g, "/");
}
function buildAssetResponse(
  v133,
  { reused: reused = false, derivativeStatus: derivativeStatus = "" } = {},
) {
  const v134 =
    v133["kind"] === "image" || v133["kind"] === "video"
      ? v133["displayLocalPath"] || v133["originalLocalPath"]
      : v133["originalLocalPath"];
  return {
    success: true,
    assetId: v133["assetId"],
    reused: !!reused,
    kind: v133["kind"],
    url: v134 ? "/" + v134 : "",
    localPath: v133["originalLocalPath"] || "",
    originalLocalPath: v133["originalLocalPath"] || "",
    displayLocalPath: v133["displayLocalPath"] || "",
    thumbLocalPath: v133["thumbLocalPath"] || v133["posterLocalPath"] || "",
    posterLocalPath: v133["posterLocalPath"] || "",
    waveformLocalPath: v133["waveformLocalPath"] || "",
    filename: v133["originalName"] || v133["filename"] || "",
    storedFilename: path["basename"](v133["originalLocalPath"] || ""),
    size: Number(v133["size"] || 0),
    type: v133["mimeType"] || "",
    derivativeStatus: derivativeStatus || v133["status"] || "",
    status: v133["status"] || "",
    mediaTaskId: v133["mediaTaskId"] || "",
    mediaTaskKind: v133["mediaTaskKind"] || "",
    mediaTaskStatus: v133["mediaTaskStatus"] || "",
    mediaTaskProgress: Number(v133["mediaTaskProgress"] || 0) || 0,
    mediaTaskError: v133["mediaTaskError"] || "",
    videoProxyStatus: v133["videoProxyStatus"] || "",
    videoCodec: v133["videoCodec"] || "",
    videoWidth: Number(v133["videoWidth"] || v133["width"] || 0) || 0,
    videoHeight: Number(v133["videoHeight"] || v133["height"] || 0) || 0,
    videoDuration: Number(v133["videoDuration"] || 0) || 0,
    videoFps: Number(v133["videoFps"] || 0) || 0,
    width: Number(v133["width"] || v133["videoWidth"] || 0) || 0,
    height: Number(v133["height"] || v133["videoHeight"] || 0) || 0,
    originalUrl: v133["originalLocalPath"]
      ? "/" + v133["originalLocalPath"]
      : "",
    displayUrl: v133["displayLocalPath"] ? "/" + v133["displayLocalPath"] : "",
    thumbUrl: v133["thumbLocalPath"]
      ? "/" + v133["thumbLocalPath"]
      : v133["posterLocalPath"]
        ? "/" + v133["posterLocalPath"]
        : "",
    posterUrl: v133["posterLocalPath"] ? "/" + v133["posterLocalPath"] : "",
    waveformUrl: v133["waveformLocalPath"]
      ? "/" + v133["waveformLocalPath"]
      : "",
  };
}
function isImageImportPayload(v135 = {}, v136 = "") {
  const v137 = String(v135?.["type"] || "")["toLowerCase"]();
  if (v137["startsWith"]("image/")) return true;
  return /\.(?:png|jpe?g|webp|gif|bmp|avif)$/i["test"](String(v136 || ""));
}
function isPreviewableLocalMedia(v138 = {}, v139 = "") {
  const v140 = String(v138?.["type"] || "")["toLowerCase"]();
  if (
    v140["startsWith"]("image/") ||
    v140["startsWith"]("video/") ||
    v140["startsWith"]("audio/")
  )
    return true;
  return /\.(?:png|jpe?g|webp|gif|bmp|avif|mp4|webm|mov|m4v|mp3|wav|m4a|aac|ogg|flac)$/i[
    "test"
  ](String(v139 || ""));
}
function getMimeTypeForPreview(v141, v142 = "") {
  const v143 = String(v142 || "")["toLowerCase"]();
  if (
    v143["startsWith"]("image/") ||
    v143["startsWith"]("video/") ||
    v143["startsWith"]("audio/")
  )
    return v143;
  const v144 = path["extname"](String(v141 || ""))["toLowerCase"](),
    v145 = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".bmp": "image/bmp",
      ".avif": "image/avif",
      ".mp4": "video/mp4",
      ".m4v": "video/mp4",
      ".webm": "video/webm",
      ".mov": "video/quicktime",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".m4a": "audio/mp4",
      ".aac": "audio/aac",
      ".ogg": "audio/ogg",
      ".flac": "audio/flac",
    };
  return v145[v144] || "application/octet-stream";
}
function resolveLocalPreviewSourcePath(v146 = {}) {
  const v147 = String(v146?.["path"] || "")["trim"]();
  return (
    v147 ||
    resolveLocalVirtualPath(
      v146?.["localPath"] || v146?.["url"] || v146?.["src"] || "",
    )
  );
}
function cleanupLocalPreviewEntries() {
  const v148 = Date["now"]();
  for (const [v149, v150] of localPreviewEntries["entries"]()) {
    (!v150 || Number(v150["expiresAt"] || 0) <= v148) &&
      localPreviewEntries["delete"](v149);
  }
}
function parseRangeHeader(v151, v152) {
  const v153 = String(v151 || "")["match"](/^bytes=(\d*)-(\d*)$/);
  if (!v153) return null;
  const v154 = v153[1],
    v155 = v153[2];
  let v156 = v154 ? Number["parseInt"](v154, 10) : 0,
    v157 = v155 ? Number["parseInt"](v155, 10) : v152 - 1;
  if (!v154 && v155) {
    const v158 = Number["parseInt"](v155, 10);
    ((v156 = Math["max"](0, v152 - v158)), (v157 = v152 - 1));
  }
  if (!Number["isInteger"](v156) || !Number["isInteger"](v157)) return null;
  if (v156 < 0 || v157 < v156 || v156 >= v152) return null;
  return { start: v156, end: Math["min"](v157, v152 - 1) };
}
function createLocalPreviewUrl(v159 = {}) {
  const v160 = resolveLocalPreviewSourcePath(v159);
  if (!v160) throw new Error("缺少文件路径");
  if (!path["isAbsolute"](v160)) throw new Error("文件路径必须是绝对路径");
  const v161 = realpathSync(v160),
    v162 = statSync(v161);
  if (!v162["isFile"]()) throw new Error("只支持预览文件");
  if (!isPreviewableLocalMedia(v159, v161))
    throw new Error("只支持图片或视频快速预览");
  cleanupLocalPreviewEntries();
  const v163 = randomBytes(24)["toString"]("hex"),
    v164 = getMimeTypeForPreview(v161, v159?.["type"] || "");
  localPreviewEntries["set"](v163, {
    path: v161,
    mimeType: v164,
    size: v162["size"],
    expiresAt: Date["now"]() + LOCAL_PREVIEW_TTL_MS,
  });
  const v165 = encodeURIComponent(path["basename"](v161));
  return LOCAL_PREVIEW_SCHEME + "://preview/" + v163 + "/" + v165;
}
function installLocalPreviewProtocol() {
  if (localPreviewProtocolInstalled) return;
  ((localPreviewProtocolInstalled = true),
    protocol["handle"](LOCAL_PREVIEW_SCHEME, (v166) => {
      try {
        cleanupLocalPreviewEntries();
        const v167 = new URL(v166["url"]),
          v168 = decodeURIComponent(
            v167["pathname"]["split"]("/")["filter"](Boolean)[0] || "",
          ),
          v169 = localPreviewEntries["get"](v168);
        if (!v169)
          return new Response("Preview\x20not\x20found", { status: 404 });
        const v170 = statSync(v169["path"]);
        if (!v170["isFile"]())
          return (
            localPreviewEntries["delete"](v168),
            new Response("Preview\x20not\x20found", { status: 404 })
          );
        const v171 = v170["size"],
          v172 = parseRangeHeader(v166["headers"]["get"]("range"), v171),
          v173 = {
            "Content-Type": v169["mimeType"],
            "Accept-Ranges": "bytes",
            "Cache-Control":
              "private, max-age=" +
              Math["floor"](LOCAL_PREVIEW_TTL_MS / 1000) +
              ", immutable",
          };
        if (v172)
          return (
            (v173["Content-Range"] =
              "bytes\x20" + v172["start"] + "-" + v172["end"] + "/" + v171),
            (v173["Content-Length"] = String(v172["end"] - v172["start"] + 1)),
            new Response(
              Readable["toWeb"](
                createReadStream(v169["path"], {
                  start: v172["start"],
                  end: v172["end"],
                }),
              ),
              { status: 206, headers: v173 },
            )
          );
        return (
          (v173["Content-Length"] = String(v171)),
          new Response(Readable["toWeb"](createReadStream(v169["path"])), {
            status: 200,
            headers: v173,
          })
        );
      } catch (v174) {
        return (
          console["warn"]("[electron] local preview failed:", v174),
          new Response("Preview failed", { status: 500 })
        );
      }
    }));
}
function resizeImageToMaxEdge(v175, v176) {
  const v177 = v175["getSize"](),
    v178 = Number(v177["width"]) || 0,
    v179 = Number(v177["height"]) || 0;
  if (v178 <= 0 || v179 <= 0) return null;
  const v180 = Math["max"](v178, v179);
  if (v180 <= v176) return v175;
  const v181 = v176 / v180;
  return v175["resize"]({
    width: Math["max"](1, Math["round"](v178 * v181)),
    height: Math["max"](1, Math["round"](v179 * v181)),
    quality: "best",
  });
}
function writeLocalImageDerivatives(v182, v183, v184) {
  const v185 = nativeImage["createFromPath"](v184),
    v186 = v185["getSize"](),
    v187 = Number(v186["width"]) || 0,
    v188 = Number(v186["height"]) || 0;
  if (v185["isEmpty"]() || v187 <= 0 || v188 <= 0) return {};
  const v189 = path["parse"](v183)["name"] || "image",
    v190 = path["join"]("_derived", "display", v189 + ".display.png"),
    v191 = path["join"]("_derived", "thumb", v189 + ".thumb.png"),
    v192 = path["join"](v182, v190),
    v193 = path["join"](v182, v191);
  (mkdirSync(path["dirname"](v192), { recursive: true }),
    mkdirSync(path["dirname"](v193), { recursive: true }));
  const v194 = resizeImageToMaxEdge(v185, 1280),
    v195 = resizeImageToMaxEdge(v185, 320);
  if (!v194 || !v195) return {};
  (writeFileSync(v192, v194["toPNG"]()), writeFileSync(v193, v195["toPNG"]()));
  const v196 = "data/uploads/" + v183,
    v197 = "data/uploads/" + v190["replace"](/\\/g, "/"),
    v198 = "data/uploads/" + v191["replace"](/\\/g, "/");
  return {
    localPath: v196,
    originalLocalPath: v196,
    displayLocalPath: v197,
    thumbLocalPath: v198,
    originalWidth: v187,
    originalHeight: v188,
    originalUrl: "/" + v196,
    displayUrl: "/" + v197,
    thumbUrl: "/" + v198,
  };
}
function writeAssetImageDerivatives(v199, v200) {
  const v201 = nativeImage["createFromPath"](v200),
    v202 = v201["getSize"](),
    v203 = Number(v202["width"]) || 0,
    v204 = Number(v202["height"]) || 0;
  if (v201["isEmpty"]() || v203 <= 0 || v204 <= 0) return {};
  const v205 = path["join"](getAssetsDir(), "derived", "image");
  mkdirSync(v205, { recursive: true });
  const v206 = path["join"](v205, v199 + ".display.png"),
    v207 = path["join"](v205, v199 + ".thumb.png"),
    v208 = resizeImageToMaxEdge(v201, 1280),
    v209 = resizeImageToMaxEdge(v201, 320);
  if (!v208 || !v209) return {};
  if (!existsSync(v206)) writeFileSync(v206, v208["toPNG"]());
  if (!existsSync(v207)) writeFileSync(v207, v209["toPNG"]());
  return {
    displayLocalPath: toAssetLocalPath(
      "derived",
      "image",
      v199 + ".display.png",
    ),
    thumbLocalPath: toAssetLocalPath("derived", "image", v199 + ".thumb.png"),
    originalWidth: v203,
    originalHeight: v204,
  };
}
function bufferFromImportPayload(v210 = {}) {
  const v211 = v210?.["bytes"];
  if (!v211) return null;
  if (Buffer["isBuffer"](v211)) return v211;
  if (v211 instanceof ArrayBuffer) return Buffer["from"](v211);
  if (ArrayBuffer["isView"](v211))
    return Buffer["from"](
      v211["buffer"],
      v211["byteOffset"],
      v211["byteLength"],
    );
  if (Array["isArray"](v211)) return Buffer["from"](v211);
  return null;
}
function runToolCapture(v212, v213, { input: input = null } = {}) {
  return new Promise((v214, v215) => {
    const v216 = spawn(v212, v213, {
        cwd: APP_ROOT,
        stdio: input ? ["pipe", "pipe", "pipe"] : ["ignore", "pipe", "pipe"],
        windowsHide: true,
      }),
      v217 = [],
      v218 = [];
    (v216["stdout"]?.["on"]("data", (v219) =>
      v217["push"](Buffer["from"](v219)),
    ),
      v216["stderr"]?.["on"]("data", (v220) =>
        v218["push"](Buffer["from"](v220)),
      ),
      v216["once"]("error", v215),
      v216["once"]("exit", (v221) => {
        if (v221 === 0) {
          v214(Buffer["concat"](v217));
          return;
        }
        v215(
          new Error(
            Buffer["concat"](v218)["toString"]("utf8") ||
              v212 + " exited with " + v221,
          ),
        );
      }),
      input && v216["stdin"] && v216["stdin"]["end"](input));
  });
}
async function readFfprobeJsonCapture(v222, v223 = "FFprobe failed") {
  const v224 = await runToolCapture(getRuntimeToolOrFallback("ffprobe"), v222),
    v225 = v224["toString"]("utf8")["trim"]();
  if (!v225) throw new Error(v223);
  try {
    return JSON["parse"](v225);
  } catch {
    throw new Error(v223);
  }
}
function getRuntimeToolOrFallback(v226) {
  return resolveRuntimeTool(v226) || v226;
}
function createOutputFilename(v227, v228) {
  const v229 =
      String(v227 || "media")["replace"](/[^a-z0-9_-]/gi, "_") || "media",
    v230 =
      String(v228 || "bin")
        ["replace"](/^\.+/, "")
        ["replace"](/[^a-z0-9]/gi, "") || "bin";
  return (
    v229 +
    "_" +
    Date["now"]() +
    "_" +
    randomBytes(3)["toString"]("hex") +
    "." +
    v230
  );
}
function toOutputLocalPath(...v231) {
  return ["output", ...v231]
    ["filter"](Boolean)
    ["join"]("/")
    ["replace"](/\\/g, "/");
}
async function hashFileSha256(v232) {
  return await new Promise((v233, v234) => {
    const v235 = createHash("sha256"),
      v236 = createReadStream(v232);
    (v236["on"]("data", (v237) => v235["update"](v237)),
      v236["once"]("error", v234),
      v236["once"]("end", () => v233(v235["digest"]("hex"))));
  });
}
async function copyFileStreaming(v238, v239) {
  (mkdirSync(path["dirname"](v239), { recursive: true }),
    await pipeline(createReadStream(v238), createWriteStream(v239)));
}
function resolveMediaTaskSource(v240) {
  const v241 = resolveLocalVirtualPath(v240);
  if (!v241) throw new Error("Invalid\x20media\x20source\x20path");
  return v241;
}
async function readFfprobeJson(v242, v243, v244, v245 = "FFprobe\x20failed") {
  const v246 = await v242["runProcess"](
      v243,
      getRuntimeToolOrFallback("ffprobe"),
      v244,
    ),
    v247 = v246["stdout"]["toString"]("utf8")["trim"]();
  if (!v247) throw new Error(v245);
  try {
    return JSON["parse"](v247);
  } catch {
    throw new Error(v245);
  }
}
function parseFfprobeRatio(v248) {
  const v249 = String(v248 || "")["trim"]();
  if (!v249) return 0;
  if (!v249["includes"]("/")) return Number(v249) || 0;
  const [v250, v251] = v249["split"]("/"),
    v252 = Number(v251);
  if (!v252) return 0;
  return (Number(v250) || 0) / v252;
}
async function ffprobeVideoMeta(v253, v254, v255) {
  const v256 = await readFfprobeJson(v253, v254, [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "format=duration:stream=avg_frame_rate,r_frame_rate,nb_frames,duration,width,height",
      "-of",
      "json",
      v255,
    ]),
    v257 =
      Array["isArray"](v256["streams"]) && v256["streams"][0]
        ? v256["streams"][0]
        : {},
    v258 = v256["format"] || {},
    v259 = Number(v258["duration"] || 0) || Number(v257["duration"] || 0) || 0,
    v260 =
      parseFfprobeRatio(v257["avg_frame_rate"]) ||
      parseFfprobeRatio(v257["r_frame_rate"]) ||
      0,
    v261 = Math["trunc"](Number(v257["width"] || 0)) || 0,
    v262 = Math["trunc"](Number(v257["height"] || 0)) || 0;
  return { duration: v259, fps: v260, width: v261, height: v262 };
}
async function ffprobeHasAudio(v263, v264, v265) {
  try {
    const v266 = await v263["runProcess"](
      v264,
      getRuntimeToolOrFallback("ffprobe"),
      [
        "-v",
        "error",
        "-select_streams",
        "a:0",
        "-show_entries",
        "stream=codec_type",
        "-of",
        "default=nw=1:nk=1",
        v265,
      ],
    );
    return v266["stdout"]
      ["toString"]("utf8")
      ["toLowerCase"]()
      ["includes"]("audio");
  } catch {
    return false;
  }
}
async function ffprobeVideoPlaybackInfo(v267, v268, v269) {
  const v270 = await readFfprobeJson(v267, v268, [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "format=duration,format_name:stream=codec_name,codec_tag_string,pix_fmt,profile,width,height",
      "-of",
      "json",
      v269,
    ]),
    v271 =
      Array["isArray"](v270["streams"]) && v270["streams"][0]
        ? v270["streams"][0]
        : {},
    v272 = v270["format"] || {};
  return {
    codecName: String(v271["codec_name"] || "")
      ["trim"]()
      ["toLowerCase"](),
    codecTag: String(v271["codec_tag_string"] || "")
      ["trim"]()
      ["toLowerCase"](),
    pixelFormat: String(v271["pix_fmt"] || "")
      ["trim"]()
      ["toLowerCase"](),
    profile: String(v271["profile"] || "")["trim"](),
    formatName: String(v272["format_name"] || "")
      ["trim"]()
      ["toLowerCase"](),
    duration: Number(v272["duration"] || 0) || 0,
    width: Math["trunc"](Number(v271["width"] || 0)) || 0,
    height: Math["trunc"](Number(v271["height"] || 0)) || 0,
  };
}
async function ffprobeVideoPlaybackInfoForImport(v273) {
  const v274 = await readFfprobeJsonCapture([
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "format=duration,format_name:stream=avg_frame_rate,r_frame_rate,codec_name,codec_tag_string,pix_fmt,profile,width,height",
      "-of",
      "json",
      v273,
    ]),
    v275 =
      Array["isArray"](v274["streams"]) && v274["streams"][0]
        ? v274["streams"][0]
        : {},
    v276 = v274["format"] || {};
  return {
    codecName: String(v275["codec_name"] || "")
      ["trim"]()
      ["toLowerCase"](),
    codecTag: String(v275["codec_tag_string"] || "")
      ["trim"]()
      ["toLowerCase"](),
    pixelFormat: String(v275["pix_fmt"] || "")
      ["trim"]()
      ["toLowerCase"](),
    profile: String(v275["profile"] || "")["trim"](),
    formatName: String(v276["format_name"] || "")
      ["trim"]()
      ["toLowerCase"](),
    duration: Number(v276["duration"] || 0) || 0,
    fps:
      parseFfprobeRatio(v275["avg_frame_rate"]) ||
      parseFfprobeRatio(v275["r_frame_rate"]) ||
      0,
    width: Math["trunc"](Number(v275["width"] || 0)) || 0,
    height: Math["trunc"](Number(v275["height"] || 0)) || 0,
  };
}
function needsBrowserVideoProxy(v277 = {}) {
  const v278 = String(v277["codecName"] || "")["toLowerCase"](),
    v279 = String(v277["pixelFormat"] || "")["toLowerCase"](),
    v280 = String(v277["formatName"] || "")["toLowerCase"]();
  if (!v278) return true;
  if (v278 === "h264")
    return !!v279 && v279 !== "yuv420p" && v279 !== "yuvj420p";
  if (v278 === "vp8" || v278 === "vp9")
    return !v280["includes"]("webm") && !v280["includes"]("matroska");
  if (v278 === "av1") return false;
  return true;
}
function getVideoProxyPaths(v281) {
  const v282 = path["join"](getAssetsDir(), "derived", "video"),
    v283 = v281 + ".proxy.mp4";
  return {
    derivedDir: v282,
    proxyAbs: path["join"](v282, v283),
    proxyLocalPath: toAssetLocalPath("derived", "video", v283),
  };
}
async function ensureAssetVideoPlaybackProxy(v284, v285, v286, v287) {
  const v288 = await ffprobeVideoPlaybackInfo(v285, v284, v286);
  if (!needsBrowserVideoProxy(v288))
    return {
      displayLocalPath: "",
      displayUrl: "",
      videoProxyStatus: "not_required",
      videoCodec: v288["codecName"],
    };
  const {
    derivedDir: v289,
    proxyAbs: v290,
    proxyLocalPath: v291,
  } = getVideoProxyPaths(v287);
  mkdirSync(v289, { recursive: true });
  let v292 = false;
  try {
    v292 = existsSync(v290) && statSync(v290)["size"] > 0;
  } catch {
    v292 = false;
  }
  if (!v292) {
    const v293 = v290 + "." + process["pid"] + "." + Date["now"]() + ".tmp.mp4";
    try {
      (await v285["runProcess"](
        v284,
        getRuntimeToolOrFallback("ffmpeg"),
        [
          "-y",
          "-i",
          v286,
          "-map",
          "0:v:0",
          "-map",
          "0:a?",
          "-dn",
          "-sn",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-profile:v",
          "high",
          "-preset",
          VIDEO_PROXY_TRANSCODE_PRESET,
          "-crf",
          VIDEO_PROXY_TRANSCODE_CRF,
          "-c:a",
          "aac",
          "-b:a",
          "192k",
          "-movflags",
          "+faststart",
          v293,
        ],
        {
          durationSec: v288["duration"],
          progressMessage: "Transcoding\x20video",
        },
      ),
        renameSync(v293, v290));
    } catch (v294) {
      try {
        if (existsSync(v293)) unlinkSync(v293);
      } catch {}
      throw v294;
    }
  }
  return {
    displayLocalPath: v291,
    displayUrl: "/" + v291,
    videoProxyStatus: "generated",
    videoCodec: v288["codecName"],
  };
}
function buildMediaTaskStatePatch(v295) {
  const v296 = String(v295?.["status"] || ""),
    v297 = {
      mediaTaskId: v295?.["taskId"] || "",
      mediaTaskKind: v295?.["kind"] || "",
      mediaTaskStatus: v296,
      mediaTaskProgress: Number(v295?.["progress"] || 0) || 0,
      mediaTaskError: v295?.["error"] || "",
    };
  if (v296 === "waiting" || v296 === "processing")
    ((v297["isGenerating"] = true), (v297["jobStatus"] = "running"));
  else {
    if (v296 === "complete")
      ((v297["isGenerating"] = false), (v297["jobStatus"] = "success"));
    else {
      if (v296 === "failed")
        ((v297["isGenerating"] = false),
          (v297["jobStatus"] = "error"),
          (v297["jobError"] =
            v297["mediaTaskError"] || "Media\x20task\x20failed"));
      else
        v296 === "cancelled" &&
          ((v297["isGenerating"] = false), (v297["jobStatus"] = null));
    }
  }
  return v297;
}
function getMediaTaskDisplayName(v298) {
  const v299 = String(v298 || "")["trim"](),
    v300 = {
      videoPoster: "视频处理",
      audioWaveform: "音频波形",
      videoFirstFrame: "视频封面",
      videoCut: "视频剪辑",
      audioCut: "音频剪辑",
      videoAudioSeparate: "音频分离",
      videoCompose: "视频合成",
      audioCompose: "音频合并",
      mediaClipExport: "剪辑导出",
    };
  return v300[v299] || "媒体任务";
}
function formatNotificationBody(v301, v302) {
  const v303 = String(v301 || v302 || "")
    ["replace"](/\s+/g, "\x20")
    ["trim"]();
  if (v303["length"] <= 180) return v303;
  return v303["slice"](0, 177) + "...";
}
function handleMediaTaskActivity(v304 = {}) {
  mediaTaskActivity = {
    activeCount: Number(v304["activeCount"] || 0) || 0,
    waitingCount: Number(v304["waitingCount"] || 0) || 0,
    totalCount: Number(v304["totalCount"] || 0) || 0,
    progress: Number(v304["progress"] || 0) || 0,
    activeTasks: Array["isArray"](v304["activeTasks"])
      ? v304["activeTasks"]
      : [],
  };
  const v305 = mediaTaskActivity["activeCount"] > 0;
  (setTaskbarProgressSource(
    "media",
    v305 ? Math["max"](0.01, mediaTaskActivity["progress"]) : -1,
  ),
    setPowerSaveBlocker("media", v305));
}
function maybeNotifyLongMediaTask(v306 = {}) {
  const v307 = String(v306["status"] || "");
  if (v307 !== "complete" && v307 !== "failed") return;
  const v308 = String(v306["taskId"] || "")["trim"]();
  if (!v308 || notifiedMediaTaskIds["has"](v308)) return;
  const v309 = Number(v306["startedAt"] || 0) || 0,
    v310 = Number(v306["finishedAt"] || Date["now"]()) || Date["now"]();
  if (!v309 || v310 - v309 < LONG_MEDIA_TASK_NOTIFICATION_MS) return;
  if (
    typeof Notification?.["isSupported"] === "function" &&
    !Notification["isSupported"]()
  )
    return;
  notifiedMediaTaskIds["add"](v308);
  notifiedMediaTaskIds["size"] > 500 &&
    notifiedMediaTaskIds["delete"](
      notifiedMediaTaskIds["values"]()["next"]()["value"],
    );
  const v311 = getMediaTaskDisplayName(v306["kind"]),
    v312 = v307 === "failed";
  try {
    const v313 = new Notification({
      title: "" + v311 + (v312 ? "失败" : "完成"),
      body: v312
        ? formatNotificationBody(v306["error"], "任务处理失败。")
        : formatNotificationBody("", "长时间媒体任务已处理完成。"),
    });
    (v313["on"]("click", () => {
      focusMainWindow();
    }),
      v313["show"]());
  } catch (v314) {
    console["warn"]("[electron] failed to show media task notification:", v314);
  }
}
function sendMediaTaskUpdate(v315) {
  const v316 = String(v315?.["status"] || "");
  if (v315?.["assetId"] && (v316 === "failed" || v316 === "cancelled")) {
    const v317 = updateAssetRecord(v315["assetId"], {
      status: v316 === "cancelled" ? "partial" : "partial",
      error: v315["error"] || v316,
      mediaTaskId: v315["taskId"] || "",
      mediaTaskKind: v315["kind"] || "",
      mediaTaskStatus: v316,
      mediaTaskProgress: Number(v315["progress"] || 0) || 0,
      mediaTaskError: v315["error"] || "",
    });
    sendAssetUpdated(v317);
  }
  (maybeNotifyLongMediaTask(v315),
    mainWindow?.["webContents"]?.["send"]("mediaTask:update", v315));
}
function getMediaTaskQueue() {
  if (mediaTaskQueue) return mediaTaskQueue;
  return (
    (mediaTaskQueue = new MediaTaskQueue({
      concurrency: 2,
      onUpdate: sendMediaTaskUpdate,
      onActivity: handleMediaTaskActivity,
    })),
    mediaTaskQueue["setHandler"]("videoPoster", async (v318, v319) => {
      const v320 =
          v318["payload"]["originalLocalPath"] || v318["payload"]["src"],
        v321 = resolveMediaTaskSource(v320),
        v322 =
          String(v318["payload"]["assetId"] || "")["trim"]() ||
          createHash("sha1")["update"](v320)["digest"]("hex"),
        v323 = path["join"](getAssetsDir(), "derived", "video");
      mkdirSync(v323, { recursive: true });
      const v324 = path["join"](v323, v322 + ".poster.jpg"),
        v325 = toAssetLocalPath("derived", "video", v322 + ".poster.jpg"),
        v326 = await ensureAssetVideoPlaybackProxy(v318, v319, v321, v322);
      !existsSync(v324) &&
        (await v319["runProcess"](v318, getRuntimeToolOrFallback("ffmpeg"), [
          "-y",
          "-ss",
          "0.1",
          "-i",
          v321,
          "-frames:v",
          "1",
          "-vf",
          "scale=640:-2",
          v324,
        ]));
      const v327 = {
        ...v326,
        posterLocalPath: v325,
        thumbLocalPath: v325,
        posterUrl: "/" + v325,
        thumbUrl: "/" + v325,
      };
      if (v318["payload"]["assetId"]) {
        const v328 = updateAssetRecord(v318["payload"]["assetId"], {
          ...v327,
          status: "ready",
          error: "",
          mediaTaskId: v318["id"],
          mediaTaskKind: v318["kind"],
          mediaTaskStatus: "complete",
          mediaTaskProgress: 1,
          mediaTaskError: "",
        });
        sendAssetUpdated(v328);
      }
      return v327;
    }),
    mediaTaskQueue["setHandler"]("audioWaveform", async (v329, v330) => {
      const v331 =
          v329["payload"]["originalLocalPath"] || v329["payload"]["src"],
        v332 = resolveMediaTaskSource(v331),
        v333 =
          String(v329["payload"]["assetId"] || "")["trim"]() ||
          createHash("sha1")["update"](v331)["digest"]("hex"),
        v334 = path["join"](getAssetsDir(), "derived", "audio");
      mkdirSync(v334, { recursive: true });
      const v335 = path["join"](v334, v333 + ".waveform.json"),
        v336 = toAssetLocalPath("derived", "audio", v333 + ".waveform.json");
      if (!existsSync(v335)) {
        const v337 = await v330["runProcess"](
          v329,
          getRuntimeToolOrFallback("ffmpeg"),
          [
            "-v",
            "error",
            "-i",
            v332,
            "-ac",
            "1",
            "-ar",
            "8000",
            "-f",
            "f32le",
            "pipe:1",
          ],
        );
        writeFileSync(
          v335,
          JSON["stringify"](buildWaveformJsonFromFloat32(v337["stdout"])) +
            "\x0a",
          "utf8",
        );
      }
      const v338 = { waveformLocalPath: v336, waveformUrl: "/" + v336 };
      if (v329["payload"]["assetId"]) {
        const v339 = updateAssetRecord(v329["payload"]["assetId"], {
          ...v338,
          status: "ready",
          error: "",
          mediaTaskId: v329["id"],
          mediaTaskKind: v329["kind"],
          mediaTaskStatus: "complete",
          mediaTaskProgress: 1,
          mediaTaskError: "",
        });
        sendAssetUpdated(v339);
      }
      return v338;
    }),
    mediaTaskQueue["setHandler"]("videoFirstFrame", async (v340, v341) => {
      const v342 = String(v340["payload"]["src"] || "")["trim"](),
        v343 = resolveMediaTaskSource(v342),
        v344 = statSync(v343),
        v345 =
          v342["replace"](/^\/+/, "") +
          "|" +
          v344["mtimeMs"] +
          "|" +
          v344["size"],
        v346 = createHash("sha1")
          ["update"](v345)
          ["digest"]("hex")
          ["slice"](0, 12),
        v347 = path["join"](getOutputDir(), "VideoThumbs");
      mkdirSync(v347, { recursive: true });
      const v348 = "vthumb_" + v346 + ".jpg",
        v349 = path["join"](v347, v348),
        v350 = toOutputLocalPath("VideoThumbs", v348);
      return (
        !existsSync(v349) &&
          (await v341["runProcess"](v340, getRuntimeToolOrFallback("ffmpeg"), [
            "-y",
            "-ss",
            "0",
            "-i",
            v343,
            "-frames:v",
            "1",
            "-vf",
            "scale=240:-2",
            "-q:v",
            "8",
            "-an",
            v349,
          ])),
        { success: true, localPath: v350, path: v350, url: "/" + v350 }
      );
    }),
    mediaTaskQueue["setHandler"]("videoCut", async (v351, v352) => {
      const v353 = resolveMediaTaskSource(v351["payload"]["src"]),
        v354 = Math["max"](
          0,
          Number(
            v351["payload"]["args"]?.["start"] ?? v351["payload"]["start"] ?? 0,
          ) || 0,
        ),
        v355 = Math["max"](
          0,
          Number(
            v351["payload"]["args"]?.["end"] ?? v351["payload"]["end"] ?? 0,
          ) || 0,
        );
      if (!(v355 > v354)) throw new Error("Invalid video cut range");
      const v356 = ((v357) => ([16, 24, 30]["includes"](v357) ? v357 : 0))(
          Math["round"](
            Number(
              v351["payload"]["args"]?.["fps"] ??
                v351["payload"]["fps"] ??
                v351["payload"]["frameRate"],
            ),
          ),
        ),
        v358 = path["join"](getOutputDir(), "CutVideo");
      mkdirSync(v358, { recursive: true });
      const v359 = createOutputFilename("cut", "mp4"),
        v360 = path["join"](v358, v359),
        v361 = toOutputLocalPath("CutVideo", v359);
      return (
        await v352["runProcess"](
          v351,
          getRuntimeToolOrFallback("ffmpeg"),
          [
            "-y",
            "-ss",
            String(v354),
            "-i",
            v353,
            "-t",
            String(v355 - v354),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-profile:v",
            "high",
            "-preset",
            "fast",
            "-c:a",
            "aac",
            ...(v356 ? ["-r", String(v356)] : []),
            "-movflags",
            "+faststart",
            v360,
          ],
          { durationSec: v355 - v354, progressMessage: "Cutting video" },
        ),
        {
          success: true,
          filename: v359,
          path: v361,
          localPath: v361,
          url: "/" + v361,
        }
      );
    }),
    mediaTaskQueue["setHandler"]("audioCut", async (v362, v363) => {
      const v364 = resolveMediaTaskSource(v362["payload"]["src"]),
        v365 = Math["max"](
          0,
          Number(
            v362["payload"]["args"]?.["start"] ?? v362["payload"]["start"] ?? 0,
          ) || 0,
        ),
        v366 = Math["max"](
          0,
          Number(
            v362["payload"]["args"]?.["end"] ?? v362["payload"]["end"] ?? 0,
          ) || 0,
        );
      if (!(v366 > v365)) throw new Error("Invalid\x20audio\x20cut\x20range");
      const v367 = path["join"](getOutputDir(), "CutAudio");
      mkdirSync(v367, { recursive: true });
      const v368 = createOutputFilename("cut", "mp3"),
        v369 = path["join"](v367, v368),
        v370 = toOutputLocalPath("CutAudio", v368);
      return (
        await v363["runProcess"](
          v362,
          getRuntimeToolOrFallback("ffmpeg"),
          [
            "-y",
            "-i",
            v364,
            "-ss",
            String(v365),
            "-t",
            String(v366 - v365),
            "-vn",
            "-c:a",
            "libmp3lame",
            "-b:a",
            "192k",
            v369,
          ],
          { durationSec: v366 - v365, progressMessage: "Cutting\x20audio" },
        ),
        {
          success: true,
          filename: v368,
          path: v370,
          localPath: v370,
          url: "/" + v370,
        }
      );
    }),
    mediaTaskQueue["setHandler"]("videoAudioSeparate", async (v371, v372) => {
      const v373 = resolveMediaTaskSource(v371["payload"]["src"]),
        v374 = await ffprobeVideoMeta(v372, v371, v373);
      if (!v374["width"] || !v374["height"])
        throw new Error("Source video has no video stream");
      if (!(await ffprobeHasAudio(v372, v371, v373)))
        throw new Error("Source video has no audio stream");
      const v375 = path["join"](getOutputDir(), "SeparateVideo"),
        v376 = path["join"](getOutputDir(), "SeparateAudio");
      (mkdirSync(v375, { recursive: true }),
        mkdirSync(v376, { recursive: true }));
      const v377 = createOutputFilename("video", "mp4"),
        v378 = createOutputFilename("audio", "mp3"),
        v379 = path["join"](v375, v377),
        v380 = path["join"](v376, v378);
      (await v372["runProcess"](
        v371,
        getRuntimeToolOrFallback("ffmpeg"),
        ["-y", "-i", v373, "-map", "0:v:0", "-an", "-c:v", "copy", v379],
        {
          durationSec: v374["duration"] || 0,
          initialProgress: 0.05,
          progressMessage: "Extracting video",
        },
      ),
        v372["emitProgress"](v371, 0.55, "Extracting audio"),
        await v372["runProcess"](
          v371,
          getRuntimeToolOrFallback("ffmpeg"),
          [
            "-y",
            "-i",
            v373,
            "-map",
            "0:a:0",
            "-vn",
            "-c:a",
            "libmp3lame",
            "-b:a",
            "192k",
            v380,
          ],
          {
            durationSec: v374["duration"] || 0,
            initialProgress: 0.55,
            progressMessage: "Extracting audio",
          },
        ));
      const v381 = toOutputLocalPath("SeparateVideo", v377),
        v382 = toOutputLocalPath("SeparateAudio", v378);
      return {
        success: true,
        video: { filename: v377, path: v381, localPath: v381, url: "/" + v381 },
        audio: { filename: v378, path: v382, localPath: v382, url: "/" + v382 },
      };
    }),
    mediaTaskQueue["setHandler"](
      "audioCompose",
      createAudioComposeMediaTaskHandler({
        createOutputFilename: createOutputFilename,
        ffprobeHasAudio: ffprobeHasAudio,
        getOutputDir: getOutputDir,
        getRuntimeToolOrFallback: getRuntimeToolOrFallback,
        resolveMediaTaskSource: resolveMediaTaskSource,
        toOutputLocalPath: toOutputLocalPath,
      }),
    ),
    mediaTaskQueue["setHandler"](
      "mediaClipExport",
      createMediaClipExportTaskHandler({
        createOutputFilename: createOutputFilename,
        ffprobeVideoMeta: ffprobeVideoMeta,
        getOutputDir: getOutputDir,
        getRuntimeToolOrFallback: getRuntimeToolOrFallback,
        resolveMediaTaskSource: resolveMediaTaskSource,
        toOutputLocalPath: toOutputLocalPath,
      }),
    ),
    mediaTaskQueue["setHandler"]("videoCompose", async (v383, v384) => {
      const v385 = Array["isArray"](v383["payload"]["srcs"])
          ? v383["payload"]["srcs"]
          : Array["isArray"](v383["payload"]["args"]?.["srcs"])
            ? v383["payload"]["args"]["srcs"]
            : [],
        v386 = v385["map"]((v387) => resolveMediaTaskSource(v387));
      if (v386["length"] < 2) throw new Error("Invalid video compose sources");
      const v388 = await ffprobeVideoMeta(v384, v383, v386[0]);
      if (!v388["width"] || !v388["height"])
        throw new Error("FFprobe failed: missing width/height");
      const v389 = await Promise["all"](
          v386["map"]((v390) => ffprobeHasAudio(v384, v383, v390)),
        ),
        v391 = v389["every"](Boolean),
        v392 = path["join"](getOutputDir(), "ComposeVideo");
      mkdirSync(v392, { recursive: true });
      const v393 = createOutputFilename("compose", "mp4"),
        v394 = path["join"](v392, v393),
        v395 = toOutputLocalPath("ComposeVideo", v393),
        v396 = Math["max"](1, Math["round"](v388["fps"] || 30)),
        v397 = [];
      v386["forEach"]((v398, v399) => {
        (v397["push"](
          "[" +
            v399 +
            ":v]scale=" +
            v388["width"] +
            ":" +
            v388["height"] +
            ":force_original_aspect_ratio=decrease,pad=" +
            v388["width"] +
            ":" +
            v388["height"] +
            ":(ow-iw)/2:(oh-ih)/2,setsar=1,fps=" +
            v396 +
            ",format=yuv420p,setpts=PTS-STARTPTS[v" +
            v399 +
            "]",
        ),
          v391 &&
            v397["push"](
              "[" +
                v399 +
                ":a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS[a" +
                v399 +
                "]",
            ));
      });
      v391
        ? v397["push"](
            v386["map"]((v400, v401) => "[v" + v401 + "][a" + v401 + "]")[
              "join"
            ]("") +
              "concat=n=" +
              v386["length"] +
              ":v=1:a=1[v][a]",
          )
        : v397["push"](
            v386["map"]((v402, v403) => "[v" + v403 + "]")["join"]("") +
              "concat=n=" +
              v386["length"] +
              ":v=1:a=0[v]",
          );
      const v404 = ["-y"];
      (v386["forEach"]((v405) => v404["push"]("-i", v405)),
        v404["push"]("-filter_complex", v397["join"](";"), "-map", "[v]"));
      if (v391) v404["push"]("-map", "[a]");
      return (
        v404["push"](
          "-c:v",
          "libx264",
          "-preset",
          "fast",
          "-c:a",
          "aac",
          "-movflags",
          "+faststart",
          v394,
        ),
        await v384["runProcess"](
          v383,
          getRuntimeToolOrFallback("ffmpeg"),
          v404,
          {
            durationSec:
              Number(v383["payload"]["args"]?.["duration"] || 0) ||
              v388["duration"] ||
              0,
            progressMessage: "Composing video",
          },
        ),
        {
          success: true,
          filename: v393,
          path: v395,
          localPath: v395,
          url: "/" + v395,
        }
      );
    }),
    mediaTaskQueue
  );
}
async function generateAssetVideoPoster(v406) {
  const v407 = resolveLocalVirtualPath(v406["originalLocalPath"]);
  if (!v407) throw new Error("Invalid video asset path");
  const v408 = path["join"](getAssetsDir(), "derived", "video");
  mkdirSync(v408, { recursive: true });
  const v409 = path["join"](v408, v406["assetId"] + ".poster.jpg");
  return (
    !existsSync(v409) &&
      (await runToolCapture(getRuntimeToolOrFallback("ffmpeg"), [
        "-y",
        "-ss",
        "0.1",
        "-i",
        v407,
        "-frames:v",
        "1",
        "-vf",
        "scale=640:-2",
        v409,
      ])),
    {
      posterLocalPath: toAssetLocalPath(
        "derived",
        "video",
        v406["assetId"] + ".poster.jpg",
      ),
    }
  );
}
function buildWaveformJsonFromFloat32(v410, v411 = 190) {
  const v412 = v410["buffer"]["slice"](
      v410["byteOffset"],
      v410["byteOffset"] + v410["byteLength"],
    ),
    v413 = new Float32Array(v412, 0, Math["floor"](v410["byteLength"] / 4)),
    v414 = v413["length"],
    v415 = Math["max"](40, Math["min"](400, Number(v411) || 190)),
    v416 = Math["max"](1, Math["floor"](v414 / v415)),
    v417 = [];
  for (let v418 = 0; v418 < v415; v418 += 1) {
    const v419 = v418 * v416,
      v420 = Math["min"](v414, v419 + v416);
    let v421 = 0;
    for (let v422 = v419; v422 < v420; v422 += 1) {
      const v423 = Math["abs"](Number(v413[v422]) || 0);
      if (v423 > v421) v421 = v423;
    }
    v417["push"](Number(Math["min"](1, v421)["toFixed"](4)));
  }
  return { version: 1, samples: v415, peaks: v417 };
}
async function generateAssetAudioWaveform(v424) {
  const v425 = resolveLocalVirtualPath(v424["originalLocalPath"]);
  if (!v425) throw new Error("Invalid audio asset path");
  const v426 = path["join"](getAssetsDir(), "derived", "audio");
  mkdirSync(v426, { recursive: true });
  const v427 = path["join"](v426, v424["assetId"] + ".waveform.json");
  if (!existsSync(v427)) {
    const v428 = await runToolCapture(getRuntimeToolOrFallback("ffmpeg"), [
      "-v",
      "error",
      "-i",
      v425,
      "-ac",
      "1",
      "-ar",
      "8000",
      "-f",
      "f32le",
      "pipe:1",
    ]);
    writeFileSync(
      v427,
      JSON["stringify"](buildWaveformJsonFromFloat32(v428)) + "\x0a",
      "utf8",
    );
  }
  return {
    waveformLocalPath: toAssetLocalPath(
      "derived",
      "audio",
      v424["assetId"] + ".waveform.json",
    ),
  };
}
function updateAssetRecord(v429, v430) {
  const v431 = readAssetIndex(),
    v432 = v431["assets"][v429];
  if (!v432) return null;
  const v433 = { ...v432, ...v430, updatedAt: new Date()["toISOString"]() };
  return ((v431["assets"][v429] = v433), writeAssetIndex(v431), v433);
}
function sendAssetUpdated(v434) {
  if (!v434) return;
  mainWindow?.["webContents"]?.["send"](
    "asset:updated",
    buildAssetResponse(v434),
  );
}
function isVideoAssetReady(v435 = {}) {
  if (v435["kind"] !== "video") return false;
  return Boolean(
    v435["posterLocalPath"] &&
    (v435["displayLocalPath"] || v435["videoProxyStatus"] === "not_required"),
  );
}
function scheduleAssetDerivatives(v436) {
  if (!v436 || v436["status"] === "ready") return;
  if (v436["kind"] !== "video" && v436["kind"] !== "audio") return;
  const v437 = v436["kind"] === "video" ? "videoPoster" : "audioWaveform",
    v438 = getMediaTaskQueue()["enqueue"]({
      kind: v437,
      assetId: v436["assetId"],
      src: v436["originalLocalPath"],
      originalLocalPath: v436["originalLocalPath"],
    }),
    v439 = updateAssetRecord(v436["assetId"], {
      status: "processing",
      error: "",
      mediaTaskId: v438["taskId"],
      mediaTaskKind: v438["kind"],
      mediaTaskStatus: v438["status"],
      mediaTaskProgress: v438["progress"],
      mediaTaskError: "",
    });
  return (sendAssetUpdated(v439), v438);
}
async function importAssetToLibrary(v440 = {}) {
  const v441 = Date["now"](),
    v442 = String(v440?.["path"] || "")["trim"](),
    v443 = bufferFromImportPayload(v440);
  if (!v442 && !v443) throw new Error("缺少文件路径或文件内容");
  const v444 = v442 ? realpathSync(v442) : "";
  let v445 = null;
  if (v444) {
    if (!path["isAbsolute"](v444)) throw new Error("文件路径必须是绝对路径");
    v445 = statSync(v444);
    if (!v445["isFile"]()) throw new Error("只支持导入文件");
  }
  const v446 = sanitizeUploadFilename(
      v440?.["name"] || (v444 ? path["basename"](v444) : "asset"),
    ),
    v447 = String(v440?.["type"] || "")["trim"](),
    v448 = v443 ? hashBuffer(v443) : await hashFileSha256(v444),
    v449 = classifyAssetKind(v446, v447),
    v450 = getSafeOriginalExtension(v446, v447),
    v451 = getAssetOriginalDir();
  mkdirSync(v451, { recursive: true });
  const v452 = path["join"](v451, "" + v448 + v450),
    v453 = toAssetLocalPath("original", "" + v448 + v450),
    v454 = existsSync(v452);
  !v454 &&
    (v443 ? writeFileSync(v452, v443) : await copyFileStreaming(v444, v452));
  const v455 = new Date()["toISOString"](),
    v456 = readAssetIndex(),
    v457 = v456["assets"][v448] || {};
  let v458 = {
    ...v457,
    assetId: v448,
    kind: v449,
    originalName: v446,
    filename: v446,
    mimeType: v447,
    size: v443 ? v443["length"] : Number(v445?.["size"] || 0),
    sha256: v448,
    originalLocalPath: v453,
    createdAt: v457["createdAt"] || v455,
    updatedAt: v455,
    status:
      v457["status"] ||
      (v449 === "image" || v449 === "file" ? "ready" : "processing"),
    error: v457["error"] || "",
  };
  if (v449 === "image")
    try {
      v458 = {
        ...v458,
        ...writeAssetImageDerivatives(v448, v452),
        status: "ready",
        error: "",
      };
    } catch (v459) {
      ((v458 = {
        ...v458,
        status: "partial",
        error: String(v459?.["message"] || v459),
      }),
        console["warn"](
          "[electron]\x20image\x20asset\x20derivative\x20failed:",
          v459,
        ));
    }
  else {
    if (v449 === "video") {
      try {
        const v460 = await ffprobeVideoPlaybackInfoForImport(v452),
          v461 = needsBrowserVideoProxy(v460);
        v458 = {
          ...v458,
          videoCodec: v460["codecName"],
          videoWidth: v460["width"],
          videoHeight: v460["height"],
          width: v460["width"],
          height: v460["height"],
          videoDuration: v460["duration"],
          videoFps: v460["fps"],
          videoProxyStatus: v461
            ? v458["displayLocalPath"]
              ? "generated"
              : "processing"
            : "not_required",
        };
      } catch (v462) {
        ((v458 = {
          ...v458,
          videoProxyStatus: v458["displayLocalPath"]
            ? "generated"
            : "processing",
          error: v458["error"] || String(v462?.["message"] || v462),
        }),
          console["warn"](
            "[electron] video asset metadata probe failed:",
            v462,
          ));
      }
      v458["status"] = isVideoAssetReady(v458) ? "ready" : "processing";
    } else
      v449 === "audio" &&
        (v458["status"] = v458["waveformLocalPath"] ? "ready" : "processing");
  }
  ((v456["assets"][v448] = v458), writeAssetIndex(v456));
  const v463 = scheduleAssetDerivatives(v458);
  return (
    v463 &&
      (v458 = {
        ...v458,
        status: "processing",
        mediaTaskId: v463["taskId"],
        mediaTaskKind: v463["kind"],
        mediaTaskStatus: v463["status"],
        mediaTaskProgress: v463["progress"],
        mediaTaskError: "",
      }),
    console["log"]("[asset-import] done", {
      t: Date["now"](),
      elapsedMs: Date["now"]() - v441,
      assetId: v448,
      kind: v449,
      reused: v454,
      originalLocalPath: v453,
      status: v458["status"],
    }),
    buildAssetResponse(v458, { reused: v454, derivativeStatus: v458["status"] })
  );
}
function importLocalFileToUploads(v464 = {}) {
  const v465 = Date["now"](),
    v466 = String(v464?.["path"] || "")["trim"]();
  console["log"]("[drag-import-prof] main:import:start", {
    t: v465,
    name: v464?.["name"] || "",
    type: v464?.["type"] || "",
    sourcePath: v466,
  });
  if (!v466) throw new Error("缺少文件路径");
  if (!path["isAbsolute"](v466)) throw new Error("文件路径必须是绝对路径");
  const v467 = realpathSync(v466),
    v468 = statSync(v467);
  if (!v468["isFile"]()) throw new Error("只支持导入文件");
  const v469 = getUploadsDir();
  mkdirSync(v469, { recursive: true });
  const {
      safeFilename: v470,
      storedFilename: v471,
      targetPath: v472,
    } = allocateUniqueUploadPath(
      v469,
      v464?.["name"] || path["basename"](v467),
    ),
    v473 = Date["now"]();
  (console["log"]("[drag-import-prof] main:copy:start", {
    t: v473,
    sourceRealPath: v467,
    targetPath: v472,
    size: v468["size"],
  }),
    copyFileSync(v467, v472),
    console["log"]("[drag-import-prof] main:copy:done", {
      t: Date["now"](),
      elapsedMs: Date["now"]() - v473,
      targetPath: v472,
    }));
  const v474 = "data/uploads/" + v471,
    v475 = Date["now"]();
  isImageImportPayload(v464, v467) &&
    console["log"]("[drag-import-prof] main:derivative:start", {
      t: v475,
      targetPath: v472,
    });
  const v476 = isImageImportPayload(v464, v467)
    ? writeLocalImageDerivatives(v469, v471, v472)
    : {};
  isImageImportPayload(v464, v467) &&
    console["log"]("[drag-import-prof] main:derivative:done", {
      t: Date["now"](),
      elapsedMs: Date["now"]() - v475,
      displayLocalPath: v476["displayLocalPath"] || "",
      thumbLocalPath: v476["thumbLocalPath"] || "",
      originalWidth: v476["originalWidth"] || 0,
      originalHeight: v476["originalHeight"] || 0,
    });
  const v477 = {
    success: true,
    url: "/" + v474,
    localPath: v474,
    ...v476,
    filename: v470,
    storedFilename: v471,
    size: v468["size"],
    type: String(v464?.["type"] || ""),
  };
  return (
    console["log"]("[drag-import-prof] main:import:done", {
      t: Date["now"](),
      elapsedMs: Date["now"]() - v465,
      localPath: v477["localPath"],
      displayLocalPath: v477["displayLocalPath"] || "",
      thumbLocalPath: v477["thumbLocalPath"] || "",
    }),
    v477
  );
}
function installLocalApiTokenHeader() {
  if (localApiTokenHeaderInstalled) return;
  ((localApiTokenHeaderInstalled = true),
    session["defaultSession"]["webRequest"]["onBeforeSendHeaders"](
      { urls: [APP_ORIGIN + "/api/*", "http://localhost:" + PORT + "/api/*"] },
      (v478, v479) => {
        v479({
          requestHeaders: {
            ...v478["requestHeaders"],
            "X-AIC-Local-Token": LOCAL_ACCESS_TOKEN,
          },
        });
      },
    ));
}
async function waitForServerReady(v480 = null) {
  const v481 = Date["now"]();
  while (Date["now"]() - v481 < SERVER_READY_TIMEOUT_MS) {
    if (await probeServer()) return true;
    const v482 = Date["now"]() - v481;
    (v480?.({
      kind: "loading",
      title: APP_DISPLAY_NAME + " 正在启动",
      detail: "正在准备画布环境。",
      hint:
        "已等待\x20" +
        Math["ceil"](v482 / 1000) +
        " 秒，预计最多需要 " +
        Math["ceil"](SERVER_READY_TIMEOUT_MS / 1000) +
        " 秒。",
    }),
      await delay(SERVER_READY_INTERVAL_MS));
  }
  return false;
}
async function ensureServerRunning(v483 = null) {
  v483?.({
    kind: "loading",
    title: APP_DISPLAY_NAME + " 正在启动",
    detail: "正在准备画布环境。",
    hint: "启动完成后会自动进入画布。",
  });
  if (await probeServer())
    return (
      v483?.({
        kind: "loading",
        title: APP_DISPLAY_NAME + "\x20正在启动",
        detail: "正在打开画布。",
        hint: "",
      }),
      "reused"
    );
  const v484 = resolvePythonCommand();
  v483?.({
    kind: "loading",
    title: APP_DISPLAY_NAME + " 正在启动",
    detail: "正在加载本地工作环境。",
    hint: "启动完成后会自动进入画布。",
  });
  const v485 = createWriteStream(SERVER_LOG_PATH, { flags: "a" });
  v485["write"](
    "\x0a[" +
      new Date()["toISOString"]() +
      "] starting " +
      v484 +
      " server.py --host=" +
      HOST +
      " --port=" +
      PORT +
      "\x0a",
  );
  let v486 = null;
  ((spawnedServer = spawn(
    v484,
    ["server.py", "--host=" + HOST, "--port=" + PORT],
    {
      cwd: APP_ROOT,
      env: {
        ...process["env"],
        AICANVAS_PORT: String(PORT),
        AIC_LOCAL_TOKEN: LOCAL_ACCESS_TOKEN,
        ...buildPackagedServerEnv(),
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  )),
    spawnedServer["stdout"]?.["pipe"](v485, { end: false }),
    spawnedServer["stderr"]?.["pipe"](v485, { end: false }),
    spawnedServer["once"]("error", (v487) => {
      ((v486 = v487),
        v485["write"](
          "[" +
            new Date()["toISOString"]() +
            "] spawn error: " +
            (v487?.["stack"] || v487?.["message"] || v487) +
            "\x0a",
        ),
        logDiagnosticEvent({
          type: "backend.spawn_error",
          level: "error",
          source: "main",
          message: "Failed to spawn local Python service",
          error: v487,
          context: { command: v484, port: PORT },
        }),
        v483?.({
          kind: "error",
          title: APP_DISPLAY_NAME + " 启动失败",
          detail: "启动本地工作环境失败。",
          hint: "请重启应用，若仍失败请导出诊断日志。",
        }));
    }),
    spawnedServer["once"]("exit", (v488, v489) => {
      (v485["write"](
        "[" +
          new Date()["toISOString"]() +
          "] exited code=" +
          (v488 ?? "") +
          " signal=" +
          (v489 ?? "") +
          "\x0a",
      ),
        v485["end"](),
        (v488 !== 0 || v489) &&
          logDiagnosticEvent({
            type: "backend.exited",
            level: "warn",
            source: "main",
            message: "Local Python service exited",
            context: { code: v488, signal: v489, port: PORT },
          }),
        (spawnedServer = null));
    }));
  const v490 = await waitForServerReady(v483);
  if (!v490) {
    (stopSpawnedServer(),
      logDiagnosticEvent({
        type: "backend.ready_timeout",
        level: "error",
        source: "main",
        message: "Local Python service did not become ready",
        context: { appUrl: APP_URL, timeoutMs: SERVER_READY_TIMEOUT_MS },
      }));
    if (v486)
      throw new Error(
        "Failed to start " +
          APP_DISPLAY_NAME +
          "\x20server:\x20" +
          (v486["message"] || v486),
      );
    throw new Error(
      APP_DISPLAY_NAME + " server did not become ready at " + APP_URL,
    );
  }
  return (
    v483?.({
      kind: "loading",
      title: APP_DISPLAY_NAME + " 正在启动",
      detail: "正在打开画布。",
      hint: "",
    }),
    "started"
  );
}
function stopSpawnedServer() {
  if (!spawnedServer || spawnedServer["killed"]) return;
  try {
    spawnedServer["kill"]();
  } catch {
  } finally {
    spawnedServer = null;
  }
}
function focusMainWindow() {
  if (!mainWindow || mainWindow["isDestroyed"]()) return false;
  if (mainWindow["isMinimized"]()) mainWindow["restore"]();
  return (mainWindow["show"](), mainWindow["focus"](), true);
}
function isPathInside(v491, v492) {
  try {
    const v493 = path["resolve"](v491),
      v494 = path["resolve"](v492);
    return v493 === v494 || v493["startsWith"]("" + v494 + path["sep"]);
  } catch {
    return false;
  }
}
function normalizeVirtualLocalPath(v495) {
  const v496 = String(v495 || "")["trim"]();
  if (!v496) return "";
  if (/^(?:file|javascript|data|blob):/i["test"](v496)) return "";
  if (/^https?:/i["test"](v496))
    try {
      const v497 = new URL(v496),
        v498 = String(v497["hostname"] || "")["toLowerCase"]();
      if (
        v498 !== "localhost" &&
        v498 !== "127.0.0.1" &&
        v498 !== "::1" &&
        v498 !== "[::1]"
      )
        return "";
      return normalizeVirtualLocalPath(v497["pathname"]);
    } catch {
      return "";
    }
  const v499 = v496["replace"](/\\/g, "/");
  if (/^[a-z][a-z0-9+.-]*:/i["test"](v499)) return "";
  if (/^[a-zA-Z]:\//["test"](v499) || v499["startsWith"]("//")) return "";
  let v500 = v499["split"](/[?#]/, 1)[0];
  try {
    v500 = decodeURIComponent(v500);
  } catch {}
  const v501 = path["posix"]["normalize"](v500["replace"](/^\/+/, ""));
  if (!v501 || v501 === "." || v501 === ".." || v501["startsWith"]("../"))
    return "";
  if (
    !v501["startsWith"]("data/assets/") &&
    !v501["startsWith"]("data/uploads/") &&
    !v501["startsWith"]("output/")
  )
    return "";
  return v501;
}
function resolveLocalVirtualPath(v502) {
  const v503 = normalizeVirtualLocalPath(v502);
  if (!v503) return "";
  const v504 = [
    ["data/assets/", getAssetsDir()],
    ["data/uploads/", getUploadsDir()],
    ["output/", getOutputDir()],
  ];
  for (const [v505, v506] of v504) {
    if (!v503["startsWith"](v505)) continue;
    const v507 = v503["slice"](v505["length"]),
      v508 = path["resolve"](v506, v507);
    return isPathInside(v508, v506) ? v508 : "";
  }
  return "";
}
function getSecureSettingsStore() {
  return (
    !secureSettingsStore &&
      (secureSettingsStore = createSecureSettingsStore({
        filePath: getSecureSettingsStorePath(),
        safeStorage: safeStorage,
      })),
    secureSettingsStore
  );
}
function normalizeSecureSettingsKeys(v509 = {}) {
  const v510 = Array["isArray"](v509?.["keys"])
    ? v509["keys"]
    : [v509?.["key"]];
  return v510["map"]((v511) => String(v511 || "")["trim"]())["filter"](Boolean);
}
function syncSystemRecentDocumentsBestEffort() {
  try {
    return syncRecentProjectsToSystemRecentDocuments({
      app: app,
      recentStorePath: getRecentProjectsStorePath(),
    });
  } catch (v512) {
    return (
      console["warn"]("[electron] sync recent documents failed:", v512),
      {
        ok: false,
        error: String(v512?.["message"] || v512),
        count: 0,
        paths: [],
      }
    );
  }
}
function resolveClipboardAbsoluteFilePath(v513) {
  let v514 = String(v513 || "")["trim"]();
  if (!v514) return "";
  v514 = v514["replace"](/^"|"$/g, "");
  if (/^file:\/\//i["test"](v514))
    try {
      v514 = fileURLToPath(v514);
    } catch {
      return "";
    }
  if (!path["isAbsolute"](v514)) return "";
  try {
    const v515 = realpathSync(v514),
      v516 = statSync(v515);
    return v516["isFile"]() ? v515 : "";
  } catch {
    return "";
  }
}
function resolveClipboardImagePath(v517 = {}) {
  const v518 = resolveClipboardAbsoluteFilePath(v517?.["absolutePath"]);
  if (v518) return v518;
  const v519 = String(v517?.["localPath"] || "")["trim"]();
  if (!v519) return "";
  const v520 = resolveLocalVirtualPath(v519);
  if (!v520) return "";
  try {
    const v521 = statSync(v520);
    return v521["isFile"]() ? v520 : "";
  } catch {
    return "";
  }
}
function createClipboardNativeImage(v522 = {}) {
  const v523 = String(v522?.["pngBase64"] || "")["trim"]();
  if (v523)
    return nativeImage["createFromBuffer"](Buffer["from"](v523, "base64"));
  const v524 = resolveClipboardImagePath(v522);
  if (!v524) return nativeImage["createEmpty"]();
  return nativeImage["createFromPath"](v524);
}
function getMimeTypeForClipboardFile(v525) {
  const v526 = path["extname"](String(v525 || ""))["toLowerCase"](),
    v527 = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".bmp": "image/bmp",
      ".avif": "image/avif",
      ".mp4": "video/mp4",
      ".m4v": "video/mp4",
      ".webm": "video/webm",
      ".mov": "video/quicktime",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".m4a": "audio/mp4",
      ".aac": "audio/aac",
      ".ogg": "audio/ogg",
      ".flac": "audio/flac",
      ".txt": "text/plain",
    };
  return v527[v526] || "application/octet-stream";
}
function buildClipboardFileMeta(v528) {
  const v529 = statSync(v528);
  return {
    path: v528,
    name: path["basename"](v528),
    type: getMimeTypeForClipboardFile(v528),
    size: Number(v529["size"] || 0) || 0,
  };
}
function normalizeClipboardFileReferences(v530 = []) {
  const v531 = new Set(),
    v532 = [];
  return (
    (Array["isArray"](v530) ? v530 : [v530])["forEach"]((v533) => {
      const v534 = v533 && typeof v533 === "object" ? v533["path"] : v533,
        v535 = resolveClipboardAbsoluteFilePath(v534);
      if (!v535) return;
      const v536 =
        process["platform"] === "win32" || process["platform"] === "darwin"
          ? v535["toLowerCase"]()
          : v535;
      if (v531["has"](v536)) return;
      (v531["add"](v536), v532["push"](buildClipboardFileMeta(v535)));
    }),
    v532
  );
}
function parseClipboardFileReferencesFromText(v537) {
  const v538 = String(v537 || "")
    ["split"](/\r?\n/)
    ["map"]((v539) => v539["trim"]())
    ["filter"](Boolean);
  return normalizeClipboardFileReferences(v538);
}
function resolveKnownFolder(v540) {
  const v541 = String(v540 || "")["trim"]();
  if (v541 === "assets") return getAssetsDir();
  if (v541 === "output") return getOutputDir();
  if (v541 === "project") return getCanvasProjectDir();
  return "";
}
function getLocalAssetCleanupManager() {
  if (localAssetCleanupManager) return localAssetCleanupManager;
  return (
    (localAssetCleanupManager = createLocalAssetCleanupManager({
      trashItem: (v542) => shell["trashItem"](v542),
      getRoots: createLocalAssetCleanupRootsResolver({
        appIsPackaged: app["isPackaged"],
        legacyFilesRoot: LEGACY_PACKAGED_FILES_ROOT,
        storageRoot: getStorageRoot(),
        readCurrentFileSavePaths: () =>
          readFileSavePathsForLocalCleanup({
            requestLocalJson: requestLocalJson,
            logDiagnosticEvent: logDiagnosticEvent,
          }),
        getCurrentDefaults: () => ({
          canvasDir: getCanvasProjectDir(),
          outputDir: getOutputDir(),
          dataDir: getDataDir(),
          uploadsDir: getUploadsDir(),
          assetsDir: getAssetsDir(),
          workflowsDir: getWorkflowsDir(),
          workflowThumbsDir: path["join"](getWorkflowsDir(), "thumbs"),
          recentProjectsStorePath: getRecentProjectsStorePath(),
          recoverySnapshotPath: getRecoverySnapshotPath(),
        }),
      }),
    })),
    localAssetCleanupManager
  );
}
function getProjectDialogFilters() {
  return [
    {
      name: "RedAI-Canvas Project",
      extensions: SUPPORTED_PROJECT_FILE_EXTENSIONS["map"]((v543) =>
        v543["replace"](/^\./, ""),
      ),
    },
  ];
}
function normalizePositiveTimestamp(v544) {
  const v545 = Number(v544);
  return Number["isFinite"](v545) && v545 > 0 ? Math["round"](v545) : 0;
}
function getFileLastModified(v546) {
  const v547 = String(v546 || "")["trim"]();
  if (!v547 || !path["isAbsolute"](v547)) return 0;
  try {
    const v548 = statSync(v547);
    return v548["isFile"]() ? Math["round"](v548["mtimeMs"]) : 0;
  } catch {
    return 0;
  }
}
function resolveCurrentProjectLastModified(v549 = {}, v550 = {}) {
  const v551 = [
      normalizePositiveTimestamp(
        v549?.["lastKnownProjectLastModified"] ?? v549?.["lastModified"],
      ),
    ],
    v552 = String(v549?.["recentId"] || v550?.["recentId"] || "")["trim"]();
  if (v552) {
    const v553 = findRecentProject(getRecentProjectsStorePath(), v552);
    (v551["push"](normalizePositiveTimestamp(v553?.["lastModified"])),
      v551["push"](getFileLastModified(v553?.["path"])));
  }
  return (
    v551["push"](getFileLastModified(v549?.["displayPath"])),
    v551["push"](getFileLastModified(v550?.["displayPath"])),
    Math["max"](0, ...v551)
  );
}
function getDesktopRecoverySnapshotInfo(v554 = {}) {
  const v555 = getRecoverySnapshotPath(),
    v556 = readRecoverySnapshot(v555),
    v557 = resolveCurrentProjectLastModified(v554, v556 || {});
  return getRecoverySnapshotInfo(v555, { currentLastModified: v557 });
}
function writeDesktopRecoverySnapshot(v558 = {}) {
  const v559 = writeRecoverySnapshot(getRecoverySnapshotPath(), v558);
  return {
    success: true,
    savedAt: v559["savedAt"],
    projectId: v559["projectId"],
    projectName: v559["projectName"],
  };
}
function readDesktopRecoverySnapshot() {
  const v560 = readRecoverySnapshot(getRecoverySnapshotPath());
  if (!v560) return { success: false, exists: false, canceled: false };
  return {
    success: true,
    exists: true,
    canceled: false,
    recovery: true,
    projectId: v560["projectId"],
    projectName: v560["projectName"],
    filename: v560["filename"],
    recentId: v560["recentId"],
    displayPath: v560["displayPath"],
    lastModified: v560["lastKnownProjectLastModified"],
    recoverySavedAt: v560["savedAt"],
    data: v560["data"],
  };
}
function clearDesktopRecoverySnapshot() {
  return (removeRecoverySnapshot(getRecoverySnapshotPath()), { success: true });
}
function normalizeWindowProjectName(v561) {
  return String(v561 || "")
    ["replace"](/\s+/g, "\x20")
    ["trim"]();
}
function updateMainWindowUnsavedState(v562 = mainWindow) {
  if (!v562 || v562["isDestroyed"]()) return;
  const v563 = rendererProjectState["hasUnsavedChanges"] === true,
    v564 = normalizeWindowProjectName(rendererProjectState["projectName"]),
    v565 = v564 ? v564 + " - " + APP_DISPLAY_NAME : APP_DISPLAY_NAME;
  v562["setTitle"]("" + v565 + (v563 ? "\x20*" : ""));
  try {
    v562["setDocumentEdited"](v563);
  } catch {}
}
function handleRendererUnsavedState(v566 = {}) {
  ((rendererProjectState = {
    hasUnsavedChanges:
      v566?.["hasUnsavedChanges"] === true || v566?.["dirty"] === true,
    projectName: normalizeWindowProjectName(v566?.["projectName"]),
  }),
    updateMainWindowUnsavedState());
}
function buildProjectOpenResponse(v567, v568, v569) {
  const v570 = v569?.["filename"] || path["basename"](v567),
    v571 = v569?.["name"] || stripProjectFileExtension(v570);
  return {
    success: true,
    canceled: false,
    projectId: stripProjectFileExtension(v570),
    projectName: v571,
    filename: v570,
    recentId: v569?.["recentId"] || "",
    displayPath: v569?.["displayPath"] || v567,
    lastModified: Number(v569?.["lastModified"] || 0) || 0,
    data: v568,
  };
}
function openProjectFileByPath(v572, { source: source = "dialog" } = {}) {
  const v573 = path["resolve"](String(v572 || "")),
    v574 = readProjectJson(v573),
    v575 = upsertRecentProject(getRecentProjectsStorePath(), v573, {
      name: stripProjectFileExtension(path["basename"](v573)),
    });
  return (
    syncSystemRecentDocumentsBestEffort(),
    { ...buildProjectOpenResponse(v573, v574, v575), source: source }
  );
}
function enqueueExternalProjectOpenRequest(v576) {
  if (!v576 || typeof v576 !== "object") return;
  (pendingExternalProjectOpenRequests["push"]({
    ...v576,
    queuedAt: Date["now"](),
  }),
    mainWindow?.["webContents"]?.["send"]("project:externalOpenAvailable"));
}
function queueExternalProjectOpenPath(v577, v578) {
  const v579 = findFirstSupportedProjectPathFromArgs([v577], {
    mustExist: true,
  });
  if (!v579) return false;
  try {
    (enqueueExternalProjectOpenRequest(
      openProjectFileByPath(v579, { source: v578 }),
    ),
      logDiagnosticEvent({
        type: "project.external_open_queued",
        level: "info",
        source: "main",
        message: "External\x20project\x20open\x20queued",
        context: { source: v578, filePath: v579 },
      }));
  } catch (v580) {
    (logDiagnosticEvent({
      type: "project.external_open_failed",
      level: "error",
      source: "main",
      message: "External project open failed",
      error: v580,
      context: { source: v578, filePath: v579 },
    }),
      enqueueExternalProjectOpenRequest({
        success: false,
        canceled: false,
        source: v578,
        filePath: v579,
        filename: path["basename"](v579),
        error: String(v580?.["message"] || v580),
      }));
  }
  return true;
}
function queueExternalProjectOpenFromArgs(v581, v582) {
  const v583 = findFirstSupportedProjectPathFromArgs(v581, { mustExist: true });
  return v583 ? queueExternalProjectOpenPath(v583, v582) : false;
}
async function openDesktopProject(v584 = {}) {
  const v585 = getRecentProjectsStorePath(),
    v586 = String(v584?.["recentId"] || "")["trim"]();
  let v587 = "";
  if (v586) {
    const v588 = findRecentProject(v585, v586);
    if (!v588) throw new Error("最近项目不存在");
    if (!v588["exists"]) throw new Error("最近项目文件不存在");
    v587 = v588["path"];
  } else {
    mkdirSync(getCanvasProjectDir(), { recursive: true });
    const v589 = await dialog["showOpenDialog"](mainWindow, {
      title: "打开项目",
      defaultPath: getCanvasProjectDir(),
      properties: ["openFile"],
      filters: getProjectDialogFilters(),
    });
    if (v589["canceled"] || !v589["filePaths"]?.[0])
      return { success: false, canceled: true };
    v587 = v589["filePaths"][0];
  }
  return openProjectFileByPath(v587, { source: v586 ? "recent" : "dialog" });
}
function normalizeDialogOptionText(v590, v591 = "", v592 = 180) {
  const v593 = String(v590 || "")
    ["replace"](/\0/g, "")
    ["trim"]();
  if (!v593) return v591;
  return v593["slice"](0, v592);
}
async function selectDirectory(v594 = {}) {
  const v595 = normalizeDialogOptionText(v594?.["title"], "选择保存目录", 80),
    v596 = normalizeDialogOptionText(v594?.["defaultPath"], "", 1024),
    v597 = { title: v595, properties: ["openDirectory", "createDirectory"] };
  if (v596) v597["defaultPath"] = v596;
  const v598 = mainWindow
    ? await dialog["showOpenDialog"](mainWindow, v597)
    : await dialog["showOpenDialog"](v597);
  if (v598["canceled"] || !v598["filePaths"]?.[0])
    return { success: false, canceled: true };
  return { success: true, canceled: false, path: v598["filePaths"][0] };
}
async function saveDesktopProject(v599 = {}) {
  const v600 = getRecentProjectsStorePath(),
    v601 =
      String(v599?.["mode"] || "save")["trim"]() === "saveAs"
        ? "saveAs"
        : "save",
    v602 = sanitizeProjectName(
      v599?.["projectName"] || v599?.["projectId"] || "未命名画布",
    );
  let v603 = "";
  if (v601 === "save") {
    const v604 = String(v599?.["recentId"] || "")["trim"](),
      v605 = v604 ? findRecentProject(v600, v604) : null;
    v603 =
      v605?.["path"] || buildDefaultProjectPath(getCanvasProjectDir(), v602);
  } else {
    mkdirSync(getCanvasProjectDir(), { recursive: true });
    const v606 = await dialog["showSaveDialog"](mainWindow, {
      title: "另存为项目",
      defaultPath: buildDefaultProjectPath(getCanvasProjectDir(), v602),
      filters: getProjectDialogFilters(),
    });
    if (v606["canceled"] || !v606["filePath"])
      return { success: false, canceled: true };
    v603 = withJsonProjectExtension(v606["filePath"]);
  }
  writeProjectJson(v603, v599?.["multiData"] || {});
  const v607 = upsertRecentProject(v600, v603, { name: v602 });
  return (
    syncSystemRecentDocumentsBestEffort(),
    {
      success: true,
      canceled: false,
      projectId: stripProjectFileExtension(v607["filename"] || ""),
      projectName: v607["name"],
      filename: v607["filename"],
      recentId: v607["recentId"],
      displayPath: v607["displayPath"],
      lastModified: v607["lastModified"],
    }
  );
}
function readAppVersionFromIndexHtml() {
  try {
    const v608 = readFileSync(path["join"](APP_ROOT, "index.html"), "utf8"),
      v609 = v608["match"](
        /<meta\s+name=["']app-version["']\s+content=["']([^"']+)["']/i,
      );
    return String(v609?.[1] || "")["trim"]();
  } catch {
    return "";
  }
}
function getAutoUpdater() {
  return (
    !autoUpdaterInstance &&
      (autoUpdaterInstance = electronUpdater["autoUpdater"]),
    autoUpdaterInstance
  );
}
function handleUpdaterEvent(v610 = {}) {
  const v611 = String(v610["type"] || "");
  if (v611 === "download-started" || v611 === "download-retry") {
    (setTaskbarProgressSource("updater", 0),
      setPowerSaveBlocker("updater", true));
    return;
  }
  if (v611 === "download-progress") {
    setPowerSaveBlocker("updater", true);
    return;
  }
  (v611 === "downloaded" ||
    v611 === "download-failed" ||
    v611 === "error" ||
    v611 === "not-available") &&
    (setTaskbarProgressSource("updater", -1),
    setPowerSaveBlocker("updater", false));
}
function markQuittingForUpdate() {
  isQuittingForUpdate = true;
}
function getUpdateInstallPreparation() {
  return (
    !updateInstallPreparation &&
      (updateInstallPreparation = createUpdateInstallPreparation({
        getSpawnedServer: () => spawnedServer,
        clearSpawnedServer: (v612) => {
          if (spawnedServer === v612) spawnedServer = null;
        },
        markQuittingForUpdate: markQuittingForUpdate,
        getMainWindow: () => mainWindow,
        getRendererProjectState: () => rendererProjectState,
        requestRendererRecoverySnapshot: requestRendererRecoverySnapshot,
        destroyScreenshotOverlayWindow: () =>
          screenshotOverlayController["destroyScreenshotOverlayWindow"](),
        stopAllPowerSaveBlockers: stopAllPowerSaveBlockers,
        logEvent: logDiagnosticEvent,
      })),
    updateInstallPreparation
  );
}
function getUpdaterController() {
  return (
    !updaterController &&
      (updaterController = createUpdaterController({
        autoUpdater: getAutoUpdater(),
        isPackaged: () => app["isPackaged"],
        normalizeInfo: normalizeUpdaterInfo,
        logEvent: logDiagnosticEvent,
        prepareBeforeInstall: () =>
          getUpdateInstallPreparation()["prepareForUpdateInstall"](),
        setProgressBar: (v613) => {
          setTaskbarProgressSource("updater", v613);
        },
        sendEvent: (v614) => {
          latestUpdaterEvent = v614;
          if (v614?.["info"]) latestUpdaterInfo = v614["info"];
          handleUpdaterEvent(v614);
          if (!mainWindow || mainWindow["isDestroyed"]()) return;
          mainWindow["webContents"]["send"]("appUpdater:event", v614);
        },
      })),
    updaterController
  );
}
function readLocalPreviewVideoUrl() {
  try {
    const v615 = readFileSync(
        path["join"](APP_ROOT, "release_notes.txt"),
        "utf8",
      ),
      v616 = extractPreviewVideoUrlFromNotes(v615);
    if (v616) return v616;
  } catch {}
  try {
    const v617 = readFileSync(
      path["join"](APP_ROOT, "release_video_url.txt"),
      "utf8",
    );
    return (
      v617["split"](/\r?\n/)
        ["map"]((v618) => v618["trim"]())
        ["find"]((v619) => v619 && !v619["startsWith"]("#")) || ""
    );
  } catch {
    return "";
  }
}
function normalizeUpdaterInfo(v620) {
  return normalizeUpdaterInfoPayload(v620, {
    readLocalPreviewVideoUrl: readLocalPreviewVideoUrl,
  });
}
function installUpdaterHandlers() {
  if (updaterHandlersInstalled) return;
  ((updaterHandlersInstalled = true),
    getUpdaterController()["installHandlers"]());
}
function scheduleUpdateCheck() {
  if (!app["isPackaged"] || updateCheckStarted) return;
  ((updateCheckStarted = true),
    installUpdaterHandlers(),
    getUpdaterController()
      ["checkForUpdates"]()
      ["catch"]((v621) => {
        console["warn"]("[electron][updater] check failed:", v621);
      }));
}
function installDevReloadShortcuts(v622) {
  if (app["isPackaged"] || !v622) return;
  v622["webContents"]["on"]("before-input-event", (v623, v624) => {
    if (v624?.["type"] !== "keyDown") return;
    const v625 = String(v624["key"] || "")["toLowerCase"](),
      v626 =
        v625 === "f5" || ((v624["control"] || v624["meta"]) && v625 === "r");
    if (!v626) return;
    v623["preventDefault"]();
    if (v624["shift"]) {
      v622["webContents"]["reloadIgnoringCache"]();
      return;
    }
    v622["webContents"]["reload"]();
  });
}
function loadCanvasWindow(v627 = mainWindow) {
  if (!v627 || v627["isDestroyed"]()) return;
  void v627["loadURL"](APP_URL);
}
async function restartBackendAndReload() {
  if (app["isPackaged"] || backendRestartInProgress) return;
  backendRestartInProgress = true;
  try {
    (loadStartupStatus({
      kind: "loading",
      title: APP_DISPLAY_NAME + " 正在重新启动",
      detail: "正在重新加载画布环境。",
      hint: "完成后会自动回到画布。",
    }),
      localRuntimeKeepAlive["stop"](),
      stopSpawnedServer(),
      await clearPortBeforeStart(loadStartupStatus),
      await ensureServerRunning(loadStartupStatus),
      void localRuntimeKeepAlive["start"]("backend-restart"),
      loadCanvasWindow());
  } catch (v628) {
    (console["error"]("[electron] backend restart failed:", v628),
      logDiagnosticEvent({
        type: "backend.restart_failed",
        level: "error",
        source: "main",
        message: "Backend\x20restart\x20failed",
        error: v628,
      }),
      loadStartupStatus({
        kind: "error",
        title: APP_DISPLAY_NAME + " 重新启动失败",
        detail: "画布环境重新加载失败。",
        hint: "请重启应用，若仍失败请导出诊断日志。",
      }));
  } finally {
    backendRestartInProgress = false;
  }
}
function createMainWindow() {
  (installAppMenu({
    app: app,
    Menu: Menu,
    shell: shell,
    getMainWindow: () => mainWindow,
    logDir: LOG_DIR,
    restartBackendAndReload: restartBackendAndReload,
    stopSpawnedServer: stopSpawnedServer,
  }),
    installLocalApiTokenHeader());
  const { isMaximized: v629, ...v630 } = readWindowState();
  ((rendererProjectState = { hasUnsavedChanges: false, projectName: "" }),
    (mainWindow = new BrowserWindow({
      ...v630,
      minWidth: 1024,
      minHeight: 720,
      title: APP_DISPLAY_NAME,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path["join"](__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false,
      },
    })),
    installDevReloadShortcuts(mainWindow),
    installWindowStatePersistence(mainWindow),
    installRecoverySnapshotBeforeClose(mainWindow, {
      getRendererProjectState: () => rendererProjectState,
      shouldBypassClose: () => isQuittingForUpdate,
      logEvent: logDiagnosticEvent,
    }),
    refreshTaskbarProgress(),
    mainWindow["once"]("ready-to-show", () => {
      (v629 && mainWindow?.["maximize"](),
        mainWindow?.["show"](),
        scheduleUpdateCheck(),
        void localRuntimeKeepAlive["start"]("ready-to-show"));
    }),
    mainWindow["webContents"]["on"]("did-finish-load", () => {
      (latestUpdaterEvent &&
        mainWindow?.["webContents"]["send"](
          "appUpdater:event",
          latestUpdaterEvent,
        ),
        pendingExternalProjectOpenRequests["length"] > 0 &&
          mainWindow?.["webContents"]["send"]("project:externalOpenAvailable"),
        screenshotOverlayController["sendGlobalScreenshotShortcutStatus"](),
        void localRuntimeKeepAlive["start"]("did-finish-load"));
    }),
    mainWindow["webContents"]["on"](
      "did-fail-load",
      (v631, v632, v633, v634) => {
        logDiagnosticEvent({
          type: "renderer.load_failed",
          level: "error",
          source: "main",
          message: "Renderer failed to load",
          context: { errorCode: v632, errorDescription: v633, url: v634 },
        });
      },
    ),
    mainWindow["webContents"]["on"](
      "render-process-gone",
      (v635, v636 = {}) => {
        logDiagnosticEvent({
          type: "renderer.process_gone",
          level: "error",
          source: "main",
          message: "Renderer process exited unexpectedly",
          context: v636,
        });
      },
    ),
    mainWindow["webContents"]["setWindowOpenHandler"](({ url: v637 }) => {
      return (openExternalUrl(v637), { action: "deny" });
    }),
    mainWindow["webContents"]["on"]("will-navigate", (v638, v639) => {
      if (isLocalAppUrl(v639)) return;
      (v638["preventDefault"](), openExternalUrl(v639));
    }),
    mainWindow["on"](
      "focus",
      () => void localRuntimeKeepAlive["start"]("focus"),
    ),
    mainWindow["on"]("show", () => void localRuntimeKeepAlive["start"]("show")),
    mainWindow["on"](
      "restore",
      () => void localRuntimeKeepAlive["start"]("restore"),
    ),
    mainWindow["on"](
      "hide",
      () => void localRuntimeKeepAlive["refresh"]("hide"),
    ),
    mainWindow["on"](
      "minimize",
      () => void localRuntimeKeepAlive["refresh"]("minimize"),
    ),
    mainWindow["on"]("closed", () => {
      (webPreviewViewManager["disposeViews"](),
        localRuntimeKeepAlive["stop"](),
        (mainWindow = null));
    }),
    mainWindow["on"]("unresponsive", () => {
      logDiagnosticEvent({
        type: "renderer.unresponsive",
        level: "warn",
        source: "main",
        message: "Renderer\x20became\x20unresponsive",
      });
    }));
}
async function startApp() {
  (installLocalPreviewProtocol(),
    installIpcHandlers(),
    createMainWindow(),
    screenshotOverlayController["installGlobalScreenshotShortcut"](),
    queueExternalProjectOpenFromArgs(process["argv"], "startup"),
    await clearPortBeforeStart(),
    await ensureServerRunning(),
    void localRuntimeKeepAlive["start"]("server-ready"),
    loadCanvasWindow());
}
function handleStartupFailure(v640) {
  (console["error"]("[electron] startup failed:", v640),
    logDiagnosticEvent({
      type: "app.startup_failed",
      level: "error",
      source: "main",
      message: "Application startup failed",
      error: v640,
    }),
    loadStartupStatus({
      kind: "error",
      title: APP_DISPLAY_NAME + "\x20启动失败",
      detail: "应用启动时遇到问题。",
      hint: "请重启应用，若仍失败请导出诊断日志。",
    }));
}
function installAppLifecycleHandlers() {
  (autoUpdater["on"]("before-quit-for-update", markQuittingForUpdate),
    app["on"]("open-file", (v641, v642) => {
      (v641["preventDefault"](),
        queueExternalProjectOpenPath(v642, "open-file"),
        focusMainWindow());
    }),
    app["whenReady"]()["then"](() => {
      void startApp()["catch"](handleStartupFailure);
    }),
    app["on"]("second-instance", (v643, v644) => {
      (focusMainWindow(),
        queueExternalProjectOpenFromArgs(v644, "second-instance"));
    }),
    app["on"]("activate", () => {
      BrowserWindow["getAllWindows"]()["length"] === 0 &&
        void startApp()["catch"]((v645) => {
          (console["error"]("[electron]\x20activate\x20failed:", v645),
            logDiagnosticEvent({
              type: "app.activate_failed",
              level: "error",
              source: "main",
              message: "Application activate failed",
              error: v645,
            }));
        });
    }),
    app["on"]("window-all-closed", () => {
      process["platform"] !== "darwin" && app["quit"]();
    }),
    app["on"]("before-quit", () => {
      (screenshotOverlayController["destroyScreenshotOverlayWindow"](),
        localRuntimeKeepAlive["stop"](),
        stopSpawnedServer(),
        stopAllPowerSaveBlockers());
    }),
    app["on"]("will-quit", () => {
      screenshotOverlayController["uninstallGlobalScreenshotShortcut"]();
    }));
}
GOT_SINGLE_INSTANCE_LOCK && installAppLifecycleHandlers();
(process["on"]("uncaughtException", (v646) => {
  (logDiagnosticEvent({
    type: "main.uncaught_exception",
    level: "error",
    source: "main",
    message: "Uncaught exception in Electron main process",
    error: v646,
  }),
    console["error"]("[electron]\x20uncaught\x20exception:", v646));
}),
  process["on"]("unhandledRejection", (v647) => {
    (logDiagnosticEvent({
      type: "main.unhandled_rejection",
      level: "error",
      source: "main",
      message: "Unhandled rejection in Electron main process",
      error: v647 instanceof Error ? v647 : null,
      context: v647 instanceof Error ? {} : { reason: String(v647) },
    }),
      console["error"]("[electron] unhandled rejection:", v647));
  }));
