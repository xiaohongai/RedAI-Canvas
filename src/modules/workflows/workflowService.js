import {
  deleteWorkflowFromServer,
  fetchWorkflowsFromServer,
  saveWorkflowThumbToServer,
  saveWorkflowToServer,
} from "../../../api/projectsV2Api.js";
import {
  createWorkflowFromCanvas,
  normalizeWorkflowMeta,
  updateWorkflowFromCanvas,
} from "./workflowCanvas.js";
import { isDataImageCover, isSvgDataImageCover } from "./workflowCovers.js";
import {
  normalizeWorkflowEntity,
  normalizeWorkflowList,
} from "./workflowSelectors.js";
import {
  localPathToUrl,
  pickResultLocalPath,
} from "../../utils/localMediaPath.js";
async function persistCoverIfNeeded(v0) {
  if (!v0 || !isDataImageCover(v0["cover"]) || isSvgDataImageCover(v0["cover"]))
    return v0;
  const v1 = await saveWorkflowThumbToServer({
      workflowId: v0["id"],
      dataUrl: v0["cover"],
    }),
    v2 =
      String(v1?.["url"] || "")["trim"]() ||
      localPathToUrl(pickResultLocalPath(v1));
  return v2 ? { ...v0, cover: v2 } : v0;
}
export async function loadWorkflowsFromServer() {
  const v3 = await fetchWorkflowsFromServer();
  return normalizeWorkflowList(v3);
}
export async function saveNewWorkflowFromCanvas(v4, v5) {
  const v6 = createWorkflowFromCanvas(v4, v5),
    v7 = await persistCoverIfNeeded(v6);
  return (await saveWorkflowToServer(v7), normalizeWorkflowEntity(v7));
}
export async function saveUpdatedWorkflowFromCanvas(v8, v9, v10) {
  const v11 = updateWorkflowFromCanvas(v8, v9, v10),
    v12 = await persistCoverIfNeeded(v11);
  return (await saveWorkflowToServer(v12), normalizeWorkflowEntity(v12));
}
export async function saveWorkflowMeta(v13, v14) {
  const v15 = normalizeWorkflowMeta(v14, v13);
  if (!v15["name"]) throw new Error("名称不能为空");
  const v16 = normalizeWorkflowEntity({
    ...(v13 || {}),
    ...v15,
    updatedAt: Date["now"](),
  });
  if (!v16?.["id"]) throw new Error("工作流不存在");
  const v17 = await persistCoverIfNeeded(v16);
  return (await saveWorkflowToServer(v17), normalizeWorkflowEntity(v17));
}
export async function saveWorkflowUsage(v18, v19 = Date["now"]()) {
  const v20 = normalizeWorkflowEntity({ ...(v18 || {}), lastUsedAt: v19 });
  if (!v20) return null;
  return (await saveWorkflowToServer(v20), v20);
}
export async function renameWorkflow(v21, v22) {
  const v23 = String(v22 || "")["trim"]();
  if (!v23) throw new Error("名称不能为空");
  const v24 = normalizeWorkflowEntity({
    ...(v21 || {}),
    name: v23,
    updatedAt: Date["now"](),
  });
  if (!v24?.["id"]) throw new Error("工作流不存在");
  return (await saveWorkflowToServer(v24), v24);
}
export async function deleteWorkflow(v25) {
  const v26 = String(v25 || "")["trim"]();
  if (!v26) throw new Error("工作流不存在");
  const v27 = await deleteWorkflowFromServer(v26);
  if (!v27) throw new Error("删除失败");
  return true;
}
