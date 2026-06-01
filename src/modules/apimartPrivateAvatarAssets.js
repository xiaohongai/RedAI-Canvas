export const APIMART_PRIVATE_AVATAR_ASSET_KEY = "apimartSeedance2PrivateAvatar";
export const APIMART_PRIVATE_AVATAR_CAPABILITY = "seedance2PrivateAvatar";
const PASSED_STATUSES = new Set(["passed", "active", "completed", "success"]);
export function normalizeApimartPrivateAvatarAsset(v0 = {}) {
  if (!v0 || typeof v0 !== "object" || Array["isArray"](v0)) return null;
  const v1 = String(v0["status"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v2 = String(v0["assetUrl"] || v0["asset_url"] || v0["url"] || "")["trim"]();
  return {
    provider: "apimart",
    capability: APIMART_PRIVATE_AVATAR_CAPABILITY,
    status: v1,
    assetUrl: v2,
    sourceUrl: String(v0["sourceUrl"] || v0["source_url"] || "")["trim"](),
    uploadedSourceUrl: String(
      v0["uploadedSourceUrl"] || v0["uploaded_source_url"] || "",
    )["trim"](),
    sourceKind: String(v0["sourceKind"] || v0["kind"] || v0["assetType"] || "")[
      "trim"
    ](),
    assetType: String(v0["assetType"] || v0["asset_type"] || "")["trim"](),
    taskId: String(v0["taskId"] || v0["task_id"] || "")["trim"](),
    checkedAt: String(v0["checkedAt"] || v0["checked_at"] || "")["trim"](),
    error: String(v0["error"] || v0["message"] || "")["trim"](),
  };
}
export function readApimartPrivateAvatarAsset(v3 = {}) {
  const v4 = v3?.["providerAssetRefs"];
  return normalizeApimartPrivateAvatarAsset(
    v4?.[APIMART_PRIVATE_AVATAR_ASSET_KEY] || v3?.["apimartPrivateAvatarAsset"],
  );
}
export function isApimartPrivateAvatarAssetPassed(v5) {
  const v6 = normalizeApimartPrivateAvatarAsset(v5);
  return Boolean(
    v6?.["assetUrl"] && (!v6["status"] || PASSED_STATUSES["has"](v6["status"])),
  );
}
export function buildApimartPrivateAvatarPatch(v7 = {}, v8 = {}) {
  const v9 = normalizeApimartPrivateAvatarAsset(v8) || {};
  return {
    providerAssetRefs: {
      ...(v7?.["providerAssetRefs"] || {}),
      [APIMART_PRIVATE_AVATAR_ASSET_KEY]: v9,
    },
  };
}
export function collectApimartPrivateAvatarProviderAssetRefs(
  v10 = {},
  {
    kind: kind = "",
    sourceUrl: sourceUrl = "",
    refSlot: refSlot = "",
    edgeId: edgeId = "",
  } = {},
) {
  const v11 = readApimartPrivateAvatarAsset(v10);
  if (!isApimartPrivateAvatarAssetPassed(v11)) return [];
  return [
    {
      provider: "apimart",
      capability: APIMART_PRIVATE_AVATAR_CAPABILITY,
      status: v11["status"] || "passed",
      assetUrl: v11["assetUrl"],
      sourceUrl: String(sourceUrl || v11["sourceUrl"] || "")["trim"](),
      uploadedSourceUrl: String(v11["uploadedSourceUrl"] || "")["trim"](),
      sourceKind: String(kind || v11["sourceKind"] || "")["trim"](),
      assetType: String(v11["assetType"] || "")["trim"](),
      refSlot: String(refSlot || "")["trim"](),
      edgeId: String(edgeId || "")["trim"](),
      nodeId: String(v10?.["id"] || "")["trim"](),
    },
  ];
}
export function appendApimartPrivateAvatarProviderAssetRefs(
  v12,
  v13,
  v14 = {},
) {
  if (!Array["isArray"](v12)) return v12;
  const v15 = collectApimartPrivateAvatarProviderAssetRefs(v13, v14);
  for (const v16 of v15) {
    const v17 = [
        v16["provider"],
        v16["capability"],
        v16["assetUrl"],
        v16["sourceUrl"],
        v16["sourceKind"],
        v16["refSlot"],
        v16["nodeId"],
      ]["join"]("|"),
      v18 = v12["some"](
        (v19) =>
          [
            v19["provider"],
            v19["capability"],
            v19["assetUrl"],
            v19["sourceUrl"],
            v19["sourceKind"],
            v19["refSlot"],
            v19["nodeId"],
          ]["join"]("|") === v17,
      );
    if (!v18) v12["push"](v16);
  }
  return v12;
}
