import {
  loadProject,
  resolveCanvasData,
  saveProject,
} from "./projectService.js";
import { sanitizeMultiCanvasDataForPersistence } from "../utils/thumbnailPersistence.js";
function getDesktopProjectApi() {
  const v0 = globalThis["window"]?.["electronAPI"]?.["project"];
  if (!v0 || typeof v0 !== "object") return null;
  return v0;
}
async function clearRecoverySnapshotAfterSave(v1) {
  if (!v1 || typeof v1["clearRecoverySnapshot"] !== "function") return;
  try {
    await v1["clearRecoverySnapshot"]();
  } catch (v2) {
    console["warn"]("[desktopProjectService] 清理恢复快照失败:", v2);
  }
}
function isAutoDefaultRecentProject(v3) {
  const v4 = String(v3?.["filename"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v5 = String(v3?.["name"] || "")["trim"](),
    v6 = String(v3?.["displayPath"] || v3?.["path"] || "");
  return (
    /\.(?:aicanvas|aicproj|json)$/i["test"](v4) &&
    v4["replace"](/\.(?:aicanvas|aicproj|json)$/i, "") === "默认画布" &&
    v5 === "默认画布" &&
    /(^|[\\/])user[\\/]Canvas Project[\\/]/i["test"](v6)
  );
}
export function canUseDesktopProjectApi() {
  const v7 = getDesktopProjectApi();
  return !!(
    v7 &&
    typeof v7["open"] === "function" &&
    typeof v7["save"] === "function" &&
    typeof v7["listRecent"] === "function" &&
    typeof v7["removeRecent"] === "function"
  );
}
export function normalizeDesktopProjectOpenResult(v8) {
  if (!v8 || v8["canceled"]) return v8 || { canceled: true };
  return { ...v8, multiData: resolveCanvasData(v8["data"] || {}) };
}
export async function openDesktopProject(v9 = {}) {
  const v10 = getDesktopProjectApi();
  if (!v10 || typeof v10["open"] !== "function")
    throw new Error("Electron project API is unavailable");
  const v11 = await v10["open"]({ recentId: v9["recentId"] || "" });
  return normalizeDesktopProjectOpenResult(v11);
}
export async function saveDesktopProject(v12, v13, v14 = {}) {
  const v15 = sanitizeMultiCanvasDataForPersistence(v13 || {}),
    v16 = getDesktopProjectApi();
  if (v16 && typeof v16["save"] === "function") {
    const v17 = await v16["save"]({
      projectName: v12,
      projectId:
        v14["projectId"] || globalThis["window"]?.["currentProjectId"] || "",
      recentId:
        v14["recentId"] ||
        globalThis["window"]?.["_v2CurrentRecentProjectId"] ||
        "",
      mode: v14["mode"] || "save",
      multiData: v15,
    });
    return (
      v17?.["success"] && (await clearRecoverySnapshotAfterSave(v16)),
      v17
    );
  }
  return await saveProject(v12, v15);
}
export async function listDesktopRecentProjects() {
  const v18 = getDesktopProjectApi();
  if (!v18 || typeof v18["listRecent"] !== "function") return [];
  const v19 = await v18["listRecent"]();
  return Array["isArray"](v19)
    ? v19["filter"]((v20) => !isAutoDefaultRecentProject(v20))
    : [];
}
export async function removeDesktopRecentProject(v21) {
  const v22 = getDesktopProjectApi();
  if (!v22 || typeof v22["removeRecent"] !== "function") return [];
  const v23 = await v22["removeRecent"]({ recentId: v21 });
  return Array["isArray"](v23) ? v23 : [];
}
export async function loadProjectWithFallback(v24) {
  return await loadProject(v24);
}
