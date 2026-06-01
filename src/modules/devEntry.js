import { showLocalUpdatePreview } from "./AutoUpdate.js";
import { initPerfPanelDevEntry } from "./perf/perfPanel.js";
import { isPreviewModeEnabled, setPreviewMode } from "./previewMode.js";
import { bindPreviewUploadEntry } from "./previewUploadEntry.js";
const DEV_ENTRY_WRAP_ID = "devEntryWrap",
  LEGACY_DEV_HELPER_ID = "dev-shortcut-btn";
let syncBound = false,
  perfPanelController = null;
function setToggleButtonState(v0, v1, v2) {
  if (!v0) return;
  (v0["classList"]["toggle"]("is-active", v1 === true),
    v0["setAttribute"]("aria-pressed", v1 === true ? "true" : "false"),
    (v0["title"] = v1 === true ? v2["on"] : v2["off"]));
}
function setDevButtonState(v3, v4) {
  setToggleButtonState(v3, v4, {
    on: "开发者模式已开启，点击关闭",
    off: "开启开发者模式",
  });
}
function setPreviewButtonState(v5, v6) {
  setToggleButtonState(v5, v6, {
    on: "预览模式已开启，点击关闭",
    off: "开启预览模式",
  });
}
function broadcastDevMode(v7) {
  try {
    window["dispatchEvent"](
      new CustomEvent("dev-mode-changed", { detail: { enabled: v7 === true } }),
    );
  } catch {}
}
function setDevMode(v8, v9) {
  const v10 = v8 === true;
  ((window["DEV_MODE"] = v10),
    document["body"]?.["classList"]?.["toggle"]("dev-mode", v10),
    setDevButtonState(v9, v10),
    broadcastDevMode(v10));
}
function createEntryButton({
  id: v11,
  label: v12,
  title: v13,
  className: className = "",
}) {
  const v14 = document["createElement"]("button");
  return (
    (v14["type"] = "button"),
    (v14["id"] = v11),
    (v14["className"] = ("dev-entry-btn " + className)["trim"]()),
    (v14["title"] = v13),
    v14["setAttribute"]("aria-label", v13),
    (v14["textContent"] = v12),
    v14
  );
}
function bindExternalModeSync() {
  if (syncBound) return;
  ((syncBound = true),
    window["addEventListener"]("dev-mode-changed", (v15) => {
      const v16 = Boolean(v15?.["detail"]?.["enabled"] ?? window["DEV_MODE"]);
      setDevButtonState(document["getElementById"]("devEntryModeBtn"), v16);
    }),
    window["addEventListener"]("preview-mode-changed", (v17) => {
      const v18 = Boolean(
        v17?.["detail"]?.["enabled"] ?? globalThis["window"]?.["PREVIEW_MODE"],
      );
      setPreviewButtonState(
        document["getElementById"]("devEntryPreviewModeBtn"),
        v18,
      );
    }));
}
function removeDevEntries() {
  (perfPanelController?.["destroy"]?.(),
    (perfPanelController = null),
    document["getElementById"](DEV_ENTRY_WRAP_ID)?.["remove"](),
    document["getElementById"](LEGACY_DEV_HELPER_ID)?.["remove"]());
}
export function initDevEntries({ isDevBuild: v19 } = {}) {
  document["getElementById"](LEGACY_DEV_HELPER_ID)?.["remove"]();
  const v20 = Boolean(v19);
  ((window["LOCAL_DEV_BUILD"] = v20),
    document["body"]?.["classList"]?.["toggle"]("dev-build", v20));
  if (!v20) {
    (setPreviewMode(false), removeDevEntries());
    return;
  }
  bindExternalModeSync();
  if (document["getElementById"](DEV_ENTRY_WRAP_ID)) return;
  const v21 = document["createElement"]("div");
  ((v21["id"] = DEV_ENTRY_WRAP_ID), (v21["className"] = "dev-entry-wrap"));
  const v22 = createEntryButton({
    id: "devEntryModeBtn",
    label: "开发",
    title: "开启开发者模式",
    className: "dev-entry-btn-mode",
  });
  (setDevButtonState(v22, Boolean(window["DEV_MODE"])),
    v22["addEventListener"]("click", () => {
      const v23 = !Boolean(window["DEV_MODE"]);
      (setDevMode(v23, v22),
        window["showToast"]?.(v23 ? "已进入开发者模式" : "已返回常规模式"));
    }));
  const v24 = createEntryButton({
    id: "devEntryPerfPanelBtn",
    label: "Perf",
    title: "Open performance panel",
    className: "dev-entry-btn-perf dev-mode-only",
  });
  perfPanelController = initPerfPanelDevEntry({ button: v24 });
  const v25 = createEntryButton({
    id: "devEntryPreviewModeBtn",
    label: "预览",
    title: "开启预览模式",
    className: "dev-entry-btn-preview-mode",
  });
  (setPreviewButtonState(v25, isPreviewModeEnabled()),
    v25["addEventListener"]("click", () => {
      const v26 = !isPreviewModeEnabled();
      (setPreviewMode(v26),
        window["showToast"]?.(v26 ? "已进入预览模式" : "已退出预览模式"));
    }));
  const v27 = createEntryButton({
      id: "devEntryPreviewUploadBtn",
      label: "上传",
      title: "上传预览结果到当前选中节点",
      className: "dev-entry-btn-preview-upload preview-mode-only",
    }),
    v28 = document["createElement"]("input");
  ((v28["type"] = "file"),
    (v28["id"] = "devEntryPreviewUploadInput"),
    (v28["hidden"] = true),
    bindPreviewUploadEntry({ button: v27, input: v28 }));
  const v29 = createEntryButton({
    id: "devEntryUpdatePreviewBtn",
    label: "更新预览",
    title: "预览本地发版更新内容",
    className: "dev-entry-btn-update-preview",
  });
  (v29["addEventListener"]("click", () => {
    showLocalUpdatePreview();
  }),
    v21["appendChild"](v22),
    v21["appendChild"](v24),
    v21["appendChild"](v25),
    v21["appendChild"](v27),
    v21["appendChild"](v28),
    v21["appendChild"](v29),
    document["body"]["appendChild"](v21));
}
