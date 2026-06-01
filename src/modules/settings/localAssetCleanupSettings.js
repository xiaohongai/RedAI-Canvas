import {
  canUseLocalAssetCleanup,
  formatCleanupBytes,
  scanLegacyLocalAssetCleanup,
  scanLocalAssetCleanup,
  summarizeLocalAssetCleanupScan,
  trashLocalAssetCleanup,
} from "../../services/localAssetCleanupService.js";
import { showError, showSuccess } from "../../services/toastService.js";
const MAX_RENDERED_ITEMS = 120,
  CURRENT_CLEANUP_IDS = Object["freeze"]({
    card: "localAssetCleanupCard",
    scanBtn: "btnLocalAssetCleanupScan",
    trashBtn: "btnLocalAssetCleanupTrash",
    status: "localAssetCleanupStatus",
    count: "localAssetCleanupCount",
    size: "localAssetCleanupSize",
    list: "localAssetCleanupList",
  }),
  LEGACY_CLEANUP_IDS = Object["freeze"]({
    card: "legacyAssetCleanupCard",
    scanBtn: "btnLegacyAssetCleanupScan",
    trashBtn: "btnLegacyAssetCleanupTrash",
    status: "legacyAssetCleanupStatus",
    count: "legacyAssetCleanupCount",
    size: "legacyAssetCleanupSize",
    list: "legacyAssetCleanupList",
  });
function getElements(v0) {
  return {
    card: document["getElementById"](v0["card"]),
    scanBtn: document["getElementById"](v0["scanBtn"]),
    trashBtn: document["getElementById"](v0["trashBtn"]),
    status: document["getElementById"](v0["status"]),
    count: document["getElementById"](v0["count"]),
    size: document["getElementById"](v0["size"]),
    list: document["getElementById"](v0["list"]),
  };
}
function setButtonBusy(v1, v2, v3) {
  if (!v1) return;
  v1["disabled"] = !!v2;
  if (v3) v1["textContent"] = v3;
}
function setStatus(v4, v5, v6 = "") {
  if (!v4) return;
  ((v4["textContent"] = v5 || ""),
    v4["classList"]["toggle"]("is-error", v6 === "error"),
    v4["classList"]["toggle"]("is-success", v6 === "success"));
}
function createItemRow(v7) {
  const v8 = document["createElement"]("div");
  v8["className"] = "settings-local-cleanup-item";
  const v9 = document["createElement"]("div");
  ((v9["className"] = "settings-local-cleanup-path"),
    (v9["textContent"] = v7?.["localPath"] || ""),
    (v9["title"] = v7?.["localPath"] || ""));
  const v10 = document["createElement"]("div");
  return (
    (v10["className"] = "settings-local-cleanup-meta"),
    (v10["textContent"] =
      formatCleanupBytes(v7?.["size"]) +
      "\x20·\x20" +
      (v7?.["kind"] || "media")),
    v8["appendChild"](v9),
    v8["appendChild"](v10),
    v8
  );
}
function renderScanResult(v11, v12) {
  const v13 = Array["isArray"](v11?.["items"]) ? v11["items"] : [];
  v12["count"] &&
    (v12["count"]["textContent"] = String(Number(v11?.["orphanCount"] || 0)));
  v12["size"] &&
    (v12["size"]["textContent"] = formatCleanupBytes(
      v11?.["orphanBytes"] || 0,
    ));
  setStatus(
    v12["status"],
    summarizeLocalAssetCleanupScan(v11),
    v13["length"] > 0 ? "" : "success",
  );
  if (v12["list"]) {
    (v12["list"]["replaceChildren"](),
      (v12["list"]["hidden"] = v13["length"] === 0),
      v13["slice"](0, MAX_RENDERED_ITEMS)["forEach"]((v14) => {
        v12["list"]["appendChild"](createItemRow(v14));
      }));
    if (v13["length"] > MAX_RENDERED_ITEMS) {
      const v15 = document["createElement"]("div");
      ((v15["className"] = "settings-local-cleanup-more"),
        (v15["textContent"] =
          "还有 " +
          (v13["length"] - MAX_RENDERED_ITEMS) +
          "\x20个文件未展开显示"),
        v12["list"]["appendChild"](v15));
    }
  }
  v12["trashBtn"] && (v12["trashBtn"]["disabled"] = v13["length"] === 0);
}
function resetScanResult(v16) {
  if (v16["count"]) v16["count"]["textContent"] = "0";
  if (v16["size"]) v16["size"]["textContent"] = "0 B";
  v16["list"] &&
    ((v16["list"]["hidden"] = true), v16["list"]["replaceChildren"]());
  if (v16["trashBtn"]) v16["trashBtn"]["disabled"] = true;
}
function initCleanupCard({
  ids: v17,
  scan: v18,
  idleStatus: v19,
  scanningStatus: v20,
  scanButtonText: v21,
  scanningButtonText: v22,
  scanSuccessToast: v23,
  emptyToast: v24,
  trashButtonText: v25,
  trashingStatus: v26,
  trashingButtonText: v27,
  confirmPrefix: v28,
  successToast: v29,
}) {
  const v30 = getElements(v17);
  if (!v30["card"] || !v30["scanBtn"] || !v30["trashBtn"]) return;
  const v31 = canUseLocalAssetCleanup();
  v30["card"]["hidden"] = !v31;
  if (!v31) return;
  let v32 = null;
  (resetScanResult(v30),
    setStatus(v30["status"], v19),
    v30["scanBtn"]["addEventListener"]("click", async () => {
      ((v32 = null),
        resetScanResult(v30),
        setStatus(v30["status"], v20),
        setButtonBusy(v30["scanBtn"], true, v22),
        (v30["trashBtn"]["disabled"] = true));
      try {
        const v33 = await v18(),
          v34 = {
            ...v33,
            items: Array["isArray"](v33?.["items"]) ? v33["items"] : [],
          };
        ((v32 = v34),
          renderScanResult(v34, v30),
          Number(v34?.["orphanCount"] || 0) > 0
            ? window["showToast"]?.(v23, "success")
            : showSuccess(v24));
      } catch (v35) {
        (console["error"]("[Settings] 本地素材清理扫描失败:", v35),
          setStatus(v30["status"], v35?.["message"] || "扫描失败", "error"),
          showError("扫描失败：" + (v35?.["message"] || "未知错误")));
      } finally {
        (setButtonBusy(v30["scanBtn"], false, v21),
          (v30["trashBtn"]["disabled"] = !v32?.["items"]?.["length"]));
      }
    }),
    v30["trashBtn"]["addEventListener"]("click", async () => {
      const v36 = Array["isArray"](v32?.["items"]) ? v32["items"] : [];
      if (v36["length"] === 0) return;
      const v37 =
        typeof window["confirm"] === "function" &&
        window["confirm"](
          "" +
            v28 +
            v36["length"] +
            " 个文件移到系统回收站？\n预计可清理 " +
            formatCleanupBytes(v32["orphanBytes"]) +
            "。",
        );
      if (!v37) return;
      (setStatus(v30["status"], v26),
        setButtonBusy(v30["trashBtn"], true, v27),
        (v30["scanBtn"]["disabled"] = true));
      try {
        const v38 = await trashLocalAssetCleanup(
            v32,
            v36["map"]((v39) => v39["localPath"]),
          ),
          v40 = Array["isArray"](v38?.["skipped"])
            ? v38["skipped"]["length"]
            : 0,
          v41 = Array["isArray"](v38?.["errors"]) ? v38["errors"]["length"] : 0,
          v42 =
            "已移到回收站 " +
            (v38?.["trashedCount"] || 0) +
            " 个文件，" +
            formatCleanupBytes(v38?.["trashedBytes"] || 0),
          v43 = await v18();
        ((v32 = {
          ...v43,
          items: Array["isArray"](v43?.["items"]) ? v43["items"] : [],
        }),
          renderScanResult(v32, v30),
          setStatus(
            v30["status"],
            v40 || v41
              ? v42 + "；跳过 " + v40 + " 个，失败 " + v41 + "\x20个"
              : v42,
            v41 ? "error" : "success",
          ),
          v41 ? showError("部分文件未能移到回收站") : showSuccess(v29));
      } catch (v44) {
        (console["error"]("[Settings] 本地素材清理失败:", v44),
          setStatus(v30["status"], v44?.["message"] || "清理失败", "error"),
          showError("清理失败：" + (v44?.["message"] || "未知错误")));
      } finally {
        (setButtonBusy(v30["trashBtn"], false, v25),
          (v30["scanBtn"]["disabled"] = false),
          (v30["trashBtn"]["disabled"] = !v32?.["items"]?.["length"]));
      }
    }));
}
export function initLocalAssetCleanupSettings() {
  (initCleanupCard({
    ids: CURRENT_CLEANUP_IDS,
    scan: scanLocalAssetCleanup,
    idleStatus: "点击扫描后再选择是否清理",
    scanningStatus: "正在扫描本地素材引用...",
    scanButtonText: "扫描未引用文件",
    scanningButtonText: "扫描中...",
    scanSuccessToast: "扫描完成，已列出可清理文件",
    emptyToast: "扫描完成，未发现可清理文件",
    trashButtonText: "移到回收站",
    trashingStatus: "正在移到系统回收站...",
    trashingButtonText: "处理中...",
    confirmPrefix: "确认将\x20",
    successToast: "未引用文件已移到回收站",
  }),
    initCleanupCard({
      ids: LEGACY_CLEANUP_IDS,
      scan: scanLegacyLocalAssetCleanup,
      idleStatus: "路径迁移完成后，可扫描旧默认保存位置",
      scanningStatus: "正在扫描旧默认保存位置...",
      scanButtonText: "扫描旧位置",
      scanningButtonText: "扫描中...",
      scanSuccessToast: "扫描完成，已列出旧位置可清理文件",
      emptyToast: "扫描完成，旧位置没有可清理文件",
      trashButtonText: "移到回收站",
      trashingStatus: "正在移到系统回收站...",
      trashingButtonText: "处理中...",
      confirmPrefix: "确认将旧位置中的\x20",
      successToast: "旧位置文件已移到回收站",
    }));
}
