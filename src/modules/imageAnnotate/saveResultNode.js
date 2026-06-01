import appStore from "../../core/stores/appStore.js";
import { generateId } from "../../core/math.js";
import { commit } from "../history.js";
import { calcSafeSpawnPosNearNode } from "../nodeSpawn.js";
import { saveOutputBlob } from "../project.js";
import { buildSourceMediaNodePayload } from "../../services/fileService.js";
import {
  localPathToUrl,
  pickResultLocalPath,
} from "../../utils/localMediaPath.js";
export const getSavedAnnotateNodeName = (v0, v1) => {
  const v2 = v1 || "图片";
  if (v0 === "repaint") return v2 + " 重绘";
  if (v0 === "erase") return v2 + " 擦除";
  return v2 + " 标注";
};
export const getSavedAnnotateSuccessLabel = (v3) => {
  if (v3 === "repaint") return "✅\x20已创建重绘图片节点";
  if (v3 === "erase") return "✅ 已创建擦除图片节点";
  return "✅ 已创建标注图片节点";
};
export const saveAnnotateExportResult = async ({
  blob: v4,
  exportType: v5,
  scene: v6,
  sourceNodeId: v7,
  baseNode: v8,
  notify: notify = (v9, v10) => window["showToast"]?.(v9, v10),
  triggerLocalCacheSave: triggerLocalCacheSave = () =>
    window["_triggerLocalCacheSave"]?.(),
} = {}) => {
  const v11 = v5 === "image/png" ? "png" : "jpg",
    v12 = generateId("annotate"),
    v13 = new File([v4], "annotate_" + v12 + "." + v11, { type: v5 }),
    v14 = await saveOutputBlob(v13, { ext: v11 }),
    v15 = pickResultLocalPath(v14),
    v16 = localPathToUrl(v15) || String(v14["url"] || "")["trim"](),
    v17 = appStore["getState"]()["nodes"]?.[v7],
    v18 = v17 || v8 || {},
    v19 = v18["width"] || 260,
    v20 = v18["height"] || 260,
    v21 = calcSafeSpawnPosNearNode(
      appStore["getState"]()["nodes"],
      v18,
      v19,
      v20,
    ),
    v22 = generateId("source-image");
  return (
    appStore["addNode"](
      buildSourceMediaNodePayload({
        id: v22,
        type: "source-image",
        x: v21["x"],
        y: v21["y"],
        width: v19,
        height: v20,
        name: getSavedAnnotateNodeName(v6, v18["name"]),
        src: v16,
        localPath: v15,
        fileName: v14["filename"] || v13["name"],
        fixedSize: true,
        needsAutoResize: false,
      }),
    ),
    appStore["setSelectedNodes"]([v22]),
    commit(),
    window["v2FocusOnNodes"] && window["v2FocusOnNodes"]([v7, v22]),
    triggerLocalCacheSave(),
    notify(getSavedAnnotateSuccessLabel(v6), "success"),
    { newNodeId: v22, localPath: v15, srcUrl: v16, response: v14 }
  );
};
