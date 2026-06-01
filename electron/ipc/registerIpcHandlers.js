import { ipcMain } from "electron";
import { registerAppIpcHandlers } from "./appIpc.js";
import { registerClipboardIpcHandlers } from "./clipboardIpc.js";
import { registerDiagnosticsIpcHandlers } from "./diagnosticsIpc.js";
import { registerFileIpcHandlers } from "./fileIpc.js";
import { registerLocalAssetCleanupIpcHandlers } from "./localAssetCleanupIpc.js";
import { registerMediaTaskIpcHandlers } from "./mediaTaskIpc.js";
import { registerProjectIpcHandlers } from "./projectIpc.js";
import { registerScreenshotIpcHandlers } from "./screenshotIpc.js";
import { registerSecureSettingsIpcHandlers } from "./secureSettingsIpc.js";
import { registerWebPreviewIpcHandlers } from "./webPreviewIpc.js";
export function registerIpcHandlers(v0) {
  const v1 = { ipcMain: ipcMain, ...v0 };
  (registerAppIpcHandlers(v1),
    registerSecureSettingsIpcHandlers(v1),
    registerClipboardIpcHandlers(v1),
    registerScreenshotIpcHandlers(v1),
    registerProjectIpcHandlers(v1),
    registerFileIpcHandlers(v1),
    registerMediaTaskIpcHandlers(v1),
    registerLocalAssetCleanupIpcHandlers(v1),
    registerDiagnosticsIpcHandlers(v1),
    registerWebPreviewIpcHandlers(v1));
}
