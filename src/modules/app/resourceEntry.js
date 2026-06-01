import { buildImageNodeStorageFields } from "../../services/imageDerivativeService.js";
import {
  pickResultLocalPath,
  urlToLocalPath,
} from "../../utils/localMediaPath.js";
export function registerResourceUploadEntry({
  store: v0,
  uploadFile: v1,
  getBaseName: v2,
  getCurrentProjectId: v3,
}) {
  const v4 = async (v5) => {
    const v6 = v5?.["detail"]?.["id"],
      v7 = v5?.["detail"]?.["file"];
    if (!v6 || !v7) return;
    const v8 = v0["getState"]()["nodes"][v6];
    if (!v8) return;
    try {
      const v9 = v3?.() || "default_v2_project",
        v10 = await v1(v7, v9),
        v11 = v2(v7["name"]);
      if (v11) v0["renameNode"](v6, v11);
      const v12 = document["getElementById"](v6),
        v13 = v12?.["__v2_name_el"];
      if (v13 && v11) v13["textContent"] = v11;
      const v14 = v10["url"],
        v15 = pickResultLocalPath(v10) || urlToLocalPath(v14);
      v0["updateNodeData"](v6, {
        src: v14,
        localPath: v15,
        assetId: v10["assetId"] || "",
        originalLocalPath: v10["originalLocalPath"] || v10["localPath"] || "",
        posterLocalPath: v10["posterLocalPath"] || "",
        waveformLocalPath: v10["waveformLocalPath"] || "",
        derivativeStatus: v10["derivativeStatus"] || v10["status"] || "",
        mediaTaskId: v10["mediaTaskId"] || "",
        mediaTaskKind: v10["mediaTaskKind"] || "",
        mediaTaskStatus: v10["mediaTaskStatus"] || "",
        mediaTaskProgress: Number(v10["mediaTaskProgress"] || 0) || 0,
        mediaTaskError: v10["mediaTaskError"] || "",
        ...buildImageNodeStorageFields(v10),
        fileName: v10["filename"] || v7["name"],
      });
    } catch (v16) {
      (console["error"]("上传失败:", v16),
        window["showToast"]("上传失败，请重试"));
    }
  };
  return (
    window["addEventListener"]("v2:resource-upload", v4),
    () => window["removeEventListener"]("v2:resource-upload", v4)
  );
}
