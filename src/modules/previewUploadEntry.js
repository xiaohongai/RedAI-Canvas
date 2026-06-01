import appStore from "../core/stores/appStore.js";
import { uploadFile } from "./project.js";
import { isPreviewModeEnabled } from "./previewMode.js";
import {
  applyUploadedPreviewAudioResult,
  applyUploadedPreviewImageResult,
  applyUploadedPreviewVideoResult,
} from "./previewUploadResult.js";
const PREVIEW_UPLOAD_TYPES = {
  image: {
    accept: "image/*",
    mimePrefix: "image/",
    label: "图片",
    successMessage: "已将上传图片写入当前节点",
    applyResult: applyUploadedPreviewImageResult,
    nodeTypes: new Set(["source-image", "image", "ai-image"]),
  },
  video: {
    accept: "video/*",
    mimePrefix: "video/",
    label: "视频",
    successMessage: "已将上传视频写入当前节点",
    applyResult: applyUploadedPreviewVideoResult,
    nodeTypes: new Set(["source-video", "video", "ai-video"]),
  },
  audio: {
    accept: "audio/*",
    mimePrefix: "audio/",
    label: "音频",
    successMessage: "已将上传音频写入当前节点",
    applyResult: applyUploadedPreviewAudioResult,
    nodeTypes: new Set(["ai-audio"]),
  },
};
function getState(v0) {
  return v0?.["getState"]?.() || {};
}
function getToast(v1) {
  return typeof v1 === "function" ? v1 : globalThis["window"]?.["showToast"];
}
function setButtonBusy(v2, v3) {
  if (!v2) return;
  if (v3) {
    !v2["dataset"]["previewUploadLabel"] &&
      (v2["dataset"]["previewUploadLabel"] = v2["textContent"] || "上传");
    ((v2["disabled"] = true), (v2["textContent"] = "上传中"));
    return;
  }
  ((v2["disabled"] = false),
    (v2["textContent"] = v2["dataset"]["previewUploadLabel"] || "上传"));
}
export function resolvePreviewUploadTarget(v4 = {}) {
  const v5 = Array["isArray"](v4["selectedNodeIds"])
    ? v4["selectedNodeIds"]["filter"](Boolean)
    : [];
  if (v5["length"] !== 1)
    return { ok: false, message: "请选择一个要写入结果的节点" };
  const v6 = v5[0],
    v7 = v4["nodes"]?.[v6];
  if (!v7) return { ok: false, message: "找不到当前选中的节点" };
  const v8 = String(v7["type"] || "")["trim"]();
  for (const [v9, v10] of Object["entries"](PREVIEW_UPLOAD_TYPES)) {
    if (!v10["nodeTypes"]["has"](v8)) continue;
    return {
      ok: true,
      kind: v9,
      nodeId: v6,
      node: v7,
      accept: v10["accept"],
      mimePrefix: v10["mimePrefix"],
      label: v10["label"],
      successMessage: v10["successMessage"],
      applyResult: v10["applyResult"],
    };
  }
  return { ok: false, message: "当前节点不支持预览上传" };
}
export async function handlePreviewUploadFile({
  file: v11,
  button: button = null,
  storeApi: storeApi = appStore,
  uploadFileImpl: uploadFileImpl = uploadFile,
  showToast: showToast = null,
  getProjectId: getProjectId = () =>
    globalThis["window"]?.["currentProjectId"] || "default_v2_project",
  applyResults: applyResults = {},
} = {}) {
  const v12 = getToast(showToast),
    v13 = resolvePreviewUploadTarget(getState(storeApi));
  if (!v13["ok"]) return (v12?.(v13["message"], "warn"), false);
  if (!v11) return false;
  if (!String(v11["type"] || "")["startsWith"](v13["mimePrefix"]))
    return (v12?.("请上传" + v13["label"] + "文件", "error"), false);
  setButtonBusy(button, true);
  try {
    const v14 = await uploadFileImpl(v11, getProjectId()),
      v15 = applyResults[v13["kind"]] || v13["applyResult"];
    return (
      v15({ nodeId: v13["nodeId"], uploadRes: v14, fileName: v11["name"] }),
      v12?.(v13["successMessage"], "success"),
      true
    );
  } catch (v16) {
    return (v12?.(v16?.["message"] || "上传失败，请重试", "error"), false);
  } finally {
    setButtonBusy(button, false);
  }
}
export function bindPreviewUploadEntry({
  button: v17,
  input: v18,
  storeApi: storeApi = appStore,
  uploadFileImpl: uploadFileImpl = uploadFile,
  showToast: showToast = null,
  getProjectId: v19,
  applyResults: v20,
} = {}) {
  if (!v17 || !v18) return null;
  const v21 = getToast(showToast),
    v22 = () => {
      if (!isPreviewModeEnabled()) return;
      const v23 = resolvePreviewUploadTarget(getState(storeApi));
      if (!v23["ok"]) {
        v21?.(v23["message"], "warn");
        return;
      }
      ((v18["accept"] = v23["accept"]), (v18["value"] = ""), v18["click"]?.());
    },
    v24 = async () => {
      const v25 = v18["files"]?.[0];
      if (!v25) return;
      try {
        await handlePreviewUploadFile({
          file: v25,
          button: v17,
          storeApi: storeApi,
          uploadFileImpl: uploadFileImpl,
          showToast: showToast,
          getProjectId: v19,
          applyResults: v20,
        });
      } finally {
        v18["value"] = "";
      }
    };
  return (
    v17["addEventListener"]("click", v22),
    v18["addEventListener"]("change", v24),
    () => {
      (v17["removeEventListener"]?.("click", v22),
        v18["removeEventListener"]?.("change", v24));
    }
  );
}
