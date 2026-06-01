function normalizeInputList(v0) {
  return Array["isArray"](v0)
    ? v0["map"]((v1) => String(v1 || "")["trim"]())["filter"](Boolean)
    : [];
}
function normalizeProviderAssetRefs(v2) {
  return Array["isArray"](v2)
    ? v2["filter"]((v3) => v3 && typeof v3 === "object")
    : [];
}
function isApimartPrivateAvatarAssetUrl(v4) {
  return /^asset:\/\//i["test"](String(v4 || "")["trim"]());
}
function getUrlComparableTail(v5) {
  const v6 = String(v5 || "")["trim"]();
  if (!v6) return "";
  try {
    return (
      decodeURIComponent(new URL(v6, "http://local.invalid")["pathname"])
        ["split"]("/")
        ["filter"](Boolean)
        ["pop"]() || ""
    );
  } catch {
    return (
      v6["split"](/[?#]/, 1)[0]["split"](/[\\/]/)["filter"](Boolean)["pop"]() ||
      ""
    );
  }
}
export function isApimartSeedance2PrivateAvatarModel(v7) {
  return ["doubao-seedance-2.0", "doubao-seedance-2.0-fast"]["includes"](
    String(v7 || "")
      ["trim"]()
      ["toLowerCase"](),
  );
}
export function supportsApimartPrivateAvatarAssets(v8, v9 = {}) {
  const v10 = v9?.["privateAvatarAssets"];
  if (v10 && v10["enabled"] === true) {
    const v11 = Array["isArray"](v10["models"])
      ? v10["models"]["map"]((v12) =>
          String(v12 || "")
            ["trim"]()
            ["toLowerCase"](),
        )
      : [];
    return v11["includes"](
      String(v8 || "")
        ["trim"]()
        ["toLowerCase"](),
    );
  }
  return isApimartSeedance2PrivateAvatarModel(v8);
}
function findApimartPrivateAvatarAssetUrl(v13 = {}, v14 = "", v15 = "") {
  const v16 = normalizeProviderAssetRefs(v13["providerAssetRefs"]),
    v17 = String(v14 || "")["trim"](),
    v18 = String(v15 || "")
      ["trim"]()
      ["toLowerCase"](),
    v19 = getUrlComparableTail(v17);
  for (const v20 of v16) {
    if (
      String(v20["provider"] || "")
        ["trim"]()
        ["toLowerCase"]() !== "apimart"
    )
      continue;
    if (String(v20["capability"] || "")["trim"]() !== "seedance2PrivateAvatar")
      continue;
    const v21 = String(v20["status"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (v21 && v21 !== "passed" && v21 !== "active") continue;
    const v22 = String(v20["assetUrl"] || "")["trim"]();
    if (!isApimartPrivateAvatarAssetUrl(v22)) continue;
    const v23 = String(v20["sourceKind"] || v20["kind"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (v18 && v23 && v23 !== v18) continue;
    const v24 = String(v20["sourceUrl"] || "")["trim"]();
    if (v24 && v17 && v24 !== v17) continue;
    return v22;
  }
  const v25 = [];
  for (const v26 of v16) {
    if (
      String(v26["provider"] || "")
        ["trim"]()
        ["toLowerCase"]() !== "apimart"
    )
      continue;
    if (String(v26["capability"] || "")["trim"]() !== "seedance2PrivateAvatar")
      continue;
    const v27 = String(v26["status"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (v27 && v27 !== "passed" && v27 !== "active") continue;
    const v28 = String(v26["assetUrl"] || "")["trim"]();
    if (!isApimartPrivateAvatarAssetUrl(v28)) continue;
    const v29 = String(v26["sourceKind"] || v26["kind"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (v18 && v29 && v29 !== v18) continue;
    const v30 = getUrlComparableTail(
      v26["sourceUrl"] || v26["uploadedSourceUrl"],
    );
    if (v19 && v30 && v19 === v30) return v28;
    if (!v17) v25["push"](v28);
  }
  return v25["length"] === 1 ? v25[0] : "";
}
export function applyApimartPrivateAvatarAssetsToUrls(
  v31,
  v32 = {},
  { sourceKind: sourceKind = "", enabled: enabled = false } = {},
) {
  const v33 = normalizeInputList(v31);
  if (!enabled) return v33;
  return v33["map"]((v34) => {
    const v35 = findApimartPrivateAvatarAssetUrl(v32, v34, sourceKind);
    return v35 || v34;
  });
}
