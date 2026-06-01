import { registerResourceUploadEntry } from "./resourceEntry.js";
import { createProjectLifecycle } from "./projectLifecycle.js";
import { registerAppGlobalEvents } from "./globalEvents.js";
export function bootstrapAppProject({
  store: v0,
  CanvasTabManager: v1,
  project: v2,
  loadCustomPresets: v3,
  migrateLegacyThumbnailsInMultiData: v4,
  sanitizeMultiCanvasDataForPersistence: v5,
  commit: v6,
  patchStoreSourceNodeNamesFromFileName: v7,
  applySourceNamesFromFileNameToCanvas: v8,
  uploadFile: v9,
  getBaseName: v10,
} = {}) {
  const v11 = new URLSearchParams(window["location"]["search"]),
    v12 = v11["get"]("id");
  window["currentProjectId"] = v12 || "default_v2_project";
  !v12 &&
    console["log"](
      "[main] 未指定项目 ID，使用默认: " + window["currentProjectId"] + "\x20",
    );
  registerResourceUploadEntry({
    store: v0,
    uploadFile: v9,
    getBaseName: v10,
    getCurrentProjectId: () => window["currentProjectId"],
  });
  const v13 = createProjectLifecycle({
    store: v0,
    CanvasTabManager: v1,
    project: v2,
    loadCustomPresets: v3,
    migrateLegacyThumbnailsInMultiData: v4,
    sanitizeMultiCanvasDataForPersistence: v5,
    commit: v6,
    patchStoreSourceNodeNamesFromFileName: v7,
    applySourceNamesFromFileNameToCanvas: v8,
  });
  return (
    v13["bindLogoProjectSave"](),
    v13["bindHeaderProjectNameAutoSave"](),
    v13["bindPersistRevisionAutoSave"](),
    registerAppGlobalEvents({
      onBeforeUnload: v13["onBeforeUnload"],
      onPageHide: v13["onPageHide"],
      onVisibilityChange: v13["onVisibilityChange"],
      onDocumentDragEnter: v13["onDocumentDragEnter"],
      onDocumentDragOver: v13["onDocumentDragOver"],
      onDocumentDrop: v13["onDocumentDrop"],
      onBoot: v13["initApp"],
    }),
    v13
  );
}
