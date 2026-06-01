import {
  getModelManifest,
  getModelsByKind,
  resolveModelProvider,
} from "../manifests/index.js";
function getImageMenuMeta(v0) {
  const v1 = v0?.["extensions"]?.["imageMenu"];
  return v1 && typeof v1 === "object" ? v1 : null;
}
function buildManifestImageModelItem(v2) {
  const v3 = getImageMenuMeta(v2) || {};
  return {
    id: v2["modelId"],
    name: v3["title"] || v2["displayName"] || v2["modelId"],
    description: v3["subtitle"] || v2["description"] || "",
    icon: v3["icon"] || v2["icon"],
    vip: v2["vip"] === true,
    devOnly: v2["devOnly"] === true,
  };
}
function getManifestImageModels({
  provider: v4,
  adapterType: v5,
  group: v6,
} = {}) {
  return getModelsByKind("image")
    ["filter"]((v7) => {
      if (v4 && v7["provider"] !== v4) return false;
      if (v5 && v7["adapterType"] !== v5) return false;
      if (v6 && getImageMenuMeta(v7)?.["group"] !== v6) return false;
      return true;
    })
    ["sort"]((v8, v9) => {
      const v10 = getImageMenuMeta(v8),
        v11 = getImageMenuMeta(v9);
      return (v10?.["order"] || 0) - (v11?.["order"] || 0);
    })
    ["map"](buildManifestImageModelItem);
}
export const IMAGE_MODELS = {
  grsai: {
    name: "GRSAI",
    icon: "images/grsai.png",
    description: "高性能 AI 图像生成服务",
    models: getManifestImageModels({ provider: "grsai", group: "grsaiModel" }),
  },
  ppio: {
    name: "PPIO\x20派欧云",
    icon: "images/ppio.png",
    description: "高性价比、超弹性、低延迟的产品",
    models: getManifestImageModels({ provider: "ppio" }),
  },
  apimart: {
    name: "APIMart",
    icon: "AM",
    description: "一个 API 搞定一切——节省 30-70%",
    isTextIcon: true,
    models: getManifestImageModels({ provider: "apimart" }),
  },
  runninghub: {
    name: "RunningHUB",
    icon: "images/RH.png",
    description: "AI\x20工作流与模型\x20API\x20聚合平台",
    models: getManifestImageModels({
      provider: "runninghub",
      adapterType: "modelApi",
    }),
  },
  aicanvas: {
    name: "AICanvas",
    icon: "images/favicon.svg",
    description: "AICanvas 开发者模式占位厂商",
    devOnly: true,
    models: [
      {
        id: "aicanvas/image-lite",
        name: "AICanvas Image Lite",
        description: "开发者模式占位图像模型",
        icon: "images/favicon.svg",
      },
      {
        id: "aicanvas/image-pro",
        name: "AICanvas Image Pro",
        description: "开发者模式占位图像模型",
        icon: "images/favicon.svg",
      },
    ],
  },
};
export function getModelDisplayName(v12) {
  const v13 = getModelManifest(v12);
  if (v13?.["displayName"]) return v13["displayName"];
  for (const v14 of Object["values"](IMAGE_MODELS)) {
    const v15 = v14["models"]["find"]((v16) => v16["id"] === v12);
    if (v15) return v15["name"];
  }
  return v12;
}
export function getModelProvider(v17) {
  const v18 = resolveModelProvider(v17, "", {
    allowProviderHint: false,
    allowPrefixInference: false,
  });
  if (v18 === "runninghubwf") return "runninghub";
  if (v18) return v18;
  return (
    Object["entries"](IMAGE_MODELS)["find"](([, v19]) =>
      v19["models"]["some"]((v20) => v20["id"] === v17),
    )?.[0] || null
  );
}
export function getProviderIconHtml(v21, v22 = 12) {
  const v23 = IMAGE_MODELS[v21];
  if (!v23) return "";
  if (v23["isTextIcon"])
    return (
      '<div style="width:' +
      v22 +
      "px;height:" +
      v22 +
      'px;border-radius:2px;background:var(--bg-node);color:var(--text-primary);font-size:7px;font-weight:900;display:flex;align-items:center;justify-content:center;transform:scale(0.85);">' +
      v23["icon"] +
      "</div>"
    );
  if (v21 === "aicanvas") {
    const v24 = Math["max"](Number(v22) || 12, 14);
    return (
      "<img\x20src=\x22" +
      v23["icon"] +
      '" style="width:' +
      v24 +
      "px;height:" +
      v24 +
      'px;object-fit:contain;border-radius:2px;flex-shrink:0;" alt="' +
      v21 +
      "\x22>"
    );
  }
  return (
    '<img src="' +
    v23["icon"] +
    '" style="width:' +
    v22 +
    "px;height:" +
    v22 +
    "px;object-fit:contain;border-radius:2px;flex-shrink:0;background:var(--white-10);padding:2px;\x22\x20alt=\x22" +
    v21 +
    "\x22>"
  );
}
