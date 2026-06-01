import { submitApimartSeedance2PrivateAvatar } from "../../../api/apimartPrivateAvatarApi.js";
import {
  APIMART_PRIVATE_AVATAR_ASSET_KEY,
  buildApimartPrivateAvatarPatch,
  readApimartPrivateAvatarAsset,
} from "../../modules/apimartPrivateAvatarAssets.js";
const ACTION_CLASS = ".act-apimart-face-detect",
  DEFAULT_TOOLTIP = "apimart提供\x20seedance2.0人脸检测";
function getNodeId(v0 = {}) {
  return String(v0["nodeId"] || v0["nodeData"]?.["id"] || "")["trim"]();
}
function getLatestNodeData(v1 = {}) {
  const v2 = getNodeId(v1),
    v3 =
      typeof v1["getStateSnapshot"] === "function"
        ? v1["getStateSnapshot"]()
        : {};
  return v3?.["nodes"]?.[v2] || v1["getNodeData"]?.() || v1["nodeData"] || {};
}
function basenameFromUrl(v4) {
  const v5 = String(v4 || "")["split"](/[?#]/, 1)[0],
    v6 = v5["split"](/[\\/]/)["filter"](Boolean);
  return v6[v6["length"] - 1] || "";
}
function resolveLocalPathUrl(v7, v8) {
  const v9 = String(v8 || "")["trim"]();
  if (!v9) return "";
  if (/^(https?:|blob:|data:|asset:\/\/)/i["test"](v9)) return v9;
  if (v9["startsWith"]("/")) return v9;
  return v7["localPathToUrl"]?.(v9) || v9;
}
function resolveImageSourceUrl(v10, v11 = {}) {
  const v12 = [
    v10["resolveCanvasImagePreviewUrl"]?.(v11),
    v11["originalLocalPath"],
    v11["displayLocalPath"],
    v11["localPath"],
    v11["imageUrl"],
    v11["sourceUrl"],
    v11["src"],
    v11["url"],
  ];
  for (const v13 of v12) {
    const v14 = resolveLocalPathUrl(v10, v13);
    if (v14) return v14;
  }
  return "";
}
function resolveVideoSourceUrl(v15, v16 = {}) {
  const v17 = v15["_getCurrentVideoUrl"]?.();
  if (v17) return v17;
  const v18 = Array["isArray"](v16["videos"]) ? v16["videos"] : [],
    v19 = Number["isFinite"](Number(v16["mainVideoIndex"]))
      ? Math["max"](0, Math["trunc"](Number(v16["mainVideoIndex"])))
      : 0,
    v20 = v18[v19] || v18[0] || {},
    v21 = [
      v20["originalLocalPath"],
      v20["displayLocalPath"],
      v20["localPath"],
      v20["videoUrl"],
      v16["originalLocalPath"],
      v16["displayLocalPath"],
      v16["localPath"],
      v16["videoLocalPath"],
      v16["videoUrl"],
      v16["sourceUrl"],
      v16["src"],
      v16["url"],
    ];
  for (const v22 of v21) {
    const v23 = resolveLocalPathUrl(v15, v22);
    if (v23) return v23;
  }
  return "";
}
function resolveSource(v24, v25 = {}) {
  const v26 = String(v24["mediaKind"] || "")["toLowerCase"]();
  if (v26 === "video") {
    const v27 = resolveVideoSourceUrl(v24, v25);
    return { url: v27, assetType: "Video", sourceKind: "video" };
  }
  const v28 = resolveImageSourceUrl(v24, v25);
  return { url: v28, assetType: "Image", sourceKind: "image" };
}
function applyButtonState(v29, v30) {
  const v31 = String(v30?.["status"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v32 = v31 === "processing",
    v33 = v29["querySelector"]?.("svg");
  (v29["classList"]["toggle"]("is-provider-asset-pass", v31 === "passed"),
    v29["classList"]["toggle"]("is-provider-asset-fail", v31 === "failed"),
    v29["classList"]["toggle"]("is-provider-asset-running", v32),
    v33?.["classList"]?.["toggle"]?.("v2-spinning", v32),
    (v29["dataset"]["loading"] = v32 ? "true" : "false"),
    (v29["disabled"] = v32),
    v29["setAttribute"]("aria-busy", v32 ? "true" : "false"));
  if (v31 === "passed")
    v29["dataset"]["tooltip"] = "apimart seedance2.0人脸检测 已经通过";
  else {
    if (v31 === "failed")
      v29["dataset"]["tooltip"] = v30?.["error"]
        ? "人脸检测未通过：" + v30["error"]
        : "人脸检测未通过";
    else
      v31 === "processing"
        ? (v29["dataset"]["tooltip"] = "人脸检测中")
        : (v29["dataset"]["tooltip"] = DEFAULT_TOOLTIP);
  }
}
function persistAsset(v34, v35, v36) {
  const v37 = getNodeId(v34);
  if (!v37) return;
  const v38 = buildApimartPrivateAvatarPatch(v35, v36);
  (v34["store"]?.["updateNodeData"]?.(v37, v38),
    v35 &&
      typeof v35 === "object" &&
      (v35["providerAssetRefs"] = v38["providerAssetRefs"]));
}
export function bindApimartPrivateAvatarAction(v39 = {}) {
  const v40 = v39["toolbarEl"]?.["querySelector"]?.(ACTION_CLASS);
  if (!v40) return;
  const v41 = getNodeId(v39);
  if (!v41) return;
  const v42 = () => {
    applyButtonState(
      v40,
      readApimartPrivateAvatarAsset(getLatestNodeData(v39)),
    );
  };
  v42();
  const v43 =
    typeof v39["store"]?.["subscribeSelector"] === "function"
      ? v39["store"]["subscribeSelector"](
          (v44) =>
            v44["nodes"]?.[v41]?.["providerAssetRefs"]?.[
              APIMART_PRIVATE_AVATAR_ASSET_KEY
            ],
          () => v42(),
        )
      : null;
  (v40["_cleanupApimartPrivateAvatarState"]?.(),
    (v40["_cleanupApimartPrivateAvatarState"] = () => v43?.()),
    v40["addEventListener"]("click", async (v45) => {
      (v45["preventDefault"](), v45["stopPropagation"]());
      if (v40["dataset"]["loading"] === "true") return;
      const v46 = getLatestNodeData(v39),
        { url: v47, assetType: v48, sourceKind: v49 } = resolveSource(v39, v46);
      if (!v47) {
        (persistAsset(v39, v46, {
          provider: "apimart",
          capability: "seedance2PrivateAvatar",
          status: "failed",
          error: "没有找到可检测的素材 URL",
        }),
          window["showToast"]?.(
            "人脸检测失败：没有找到可检测的素材\x20URL",
            "error",
          ),
          v42());
        return;
      }
      (persistAsset(v39, v46, {
        provider: "apimart",
        capability: "seedance2PrivateAvatar",
        status: "processing",
        sourceUrl: v47,
        sourceKind: v49,
        assetType: v48,
        checkedAt: new Date()["toISOString"](),
      }),
        v42());
      const v50 = v39["ensureConfig"],
        v51 = v39["getProviderConfig"];
      try {
        await v50?.();
        const v52 = v51?.("apimart") || {},
          v53 = String(v52["apiKey"] || "")["trim"](),
          v54 = String(v52["apiUrl"] || "https://api.apimart.ai")["trim"]();
        if (!v53) throw new Error("APIMART API Key 未配置");
        window["showToast"]?.("正在进行 APIMart 人脸检测...", "info");
        const v55 = await submitApimartSeedance2PrivateAvatar({
          apiKey: v53,
          apiUrl: v54,
          url: v47,
          assetType: v48,
          name: basenameFromUrl(v47) || v49 + "-asset",
        });
        (persistAsset(v39, getLatestNodeData(v39), {
          provider: "apimart",
          capability: "seedance2PrivateAvatar",
          status: "passed",
          assetUrl: v55["assetUrl"],
          sourceUrl: v47,
          uploadedSourceUrl: v55["sourceUrl"] || "",
          sourceKind: v49,
          assetType: v55["assetType"] || v48,
          taskId: v55["taskId"] || "",
          checkedAt: new Date()["toISOString"](),
        }),
          window["showToast"]?.(
            "人脸检测通过，已记录 Seedance 2.0 入参 URL",
            "success",
          ));
      } catch (v56) {
        const v57 = v56?.["message"] || "APIMart 人脸检测未通过";
        (persistAsset(v39, getLatestNodeData(v39), {
          provider: "apimart",
          capability: "seedance2PrivateAvatar",
          status: "failed",
          sourceUrl: v47,
          sourceKind: v49,
          assetType: v48,
          checkedAt: new Date()["toISOString"](),
          error: v57,
        }),
          window["showToast"]?.("人脸检测未通过：" + v57, "error"));
      } finally {
        v42();
      }
    }));
}
