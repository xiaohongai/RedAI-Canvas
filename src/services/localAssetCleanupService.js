function getCleanupApi() {
  const v0 = globalThis["window"]?.["electronAPI"]?.["localAssetCleanup"];
  return v0 && typeof v0 === "object" ? v0 : null;
}
export function canUseLocalAssetCleanup() {
  const v1 = getCleanupApi();
  return !!(
    v1 &&
    typeof v1["scan"] === "function" &&
    typeof v1["trash"] === "function"
  );
}
export function getCurrentProjectSnapshotForCleanup() {
  const v2 = globalThis["window"]?.["CanvasTabManager"];
  if (!v2 || typeof v2["getMultiDataSnapshot"] !== "function") return null;
  try {
    return (
      v2["getMultiDataSnapshot"]({ sanitizeForPersistence: false }) || null
    );
  } catch {
    return null;
  }
}
export async function scanLocalAssetCleanup(v3 = {}) {
  const v4 = getCleanupApi();
  if (!canUseLocalAssetCleanup()) throw new Error("当前环境不支持本地素材清理");
  const v5 = Object["prototype"]["hasOwnProperty"]["call"](
    v3,
    "currentProjectSnapshot",
  )
    ? v3["currentProjectSnapshot"]
    : getCurrentProjectSnapshotForCleanup();
  return await v4["scan"]({
    currentProjectSnapshot: v5,
    ...(v3?.["scope"] ? { scope: v3["scope"] } : {}),
  });
}
export async function scanLegacyLocalAssetCleanup(v6 = {}) {
  return await scanLocalAssetCleanup({ ...v6, scope: "legacy-defaults" });
}
export async function trashLocalAssetCleanup(v7, v8, v9 = {}) {
  const v10 = getCleanupApi();
  if (!canUseLocalAssetCleanup()) throw new Error("当前环境不支持本地素材清理");
  const v11 =
      typeof v7 === "string" ? v7 : String(v7?.["scanId"] || "")["trim"](),
    v12 = typeof v7 === "string" ? "" : String(v7?.["scope"] || "")["trim"](),
    v13 = Object["prototype"]["hasOwnProperty"]["call"](
      v9,
      "currentProjectSnapshot",
    )
      ? v9["currentProjectSnapshot"]
      : getCurrentProjectSnapshotForCleanup();
  return await v10["trash"]({
    scanId: v11,
    localPaths: Array["isArray"](v8) ? v8 : [],
    currentProjectSnapshot: v13,
    ...(v9?.["scope"] || v12 ? { scope: v9?.["scope"] || v12 } : {}),
  });
}
export function formatCleanupBytes(v14) {
  const v15 = Number(v14 || 0);
  if (!Number["isFinite"](v15) || v15 <= 0) return "0 B";
  const v16 = ["B", "KB", "MB", "GB", "TB"];
  let v17 = v15,
    v18 = 0;
  while (v17 >= 1024 && v18 < v16["length"] - 1) {
    ((v17 /= 1024), (v18 += 1));
  }
  const v19 = v17 >= 100 || v18 === 0 ? 0 : v17 >= 10 ? 1 : 2;
  return v17["toFixed"](v19) + "\x20" + v16[v18];
}
export function summarizeLocalAssetCleanupScan(v20 = {}) {
  const v21 = Number(v20?.["orphanCount"] || 0),
    v22 = Number(v20?.["candidateCount"] || 0),
    v23 = Number(v20?.["orphanBytes"] || 0);
  if (!v20?.["ok"]) return "扫描未完成";
  if (v21 <= 0) return "已扫描\x20" + v22 + " 个本地文件，未发现可清理文件";
  return (
    "已扫描 " +
    v22 +
    " 个本地文件，发现 " +
    v21 +
    " 个可清理文件，预计可清理 " +
    formatCleanupBytes(v23)
  );
}
