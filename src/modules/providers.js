import { getModelManifest } from "../manifests/index.js";
export const getDisplayModelName = (v0) => {
  if (!v0) return "";
  const v1 = getModelManifest(v0);
  if (v1?.["displayName"]) return v1["displayName"];
  const v2 = {
    "minimax/minimax-m2.5-highspeed": "MiniMax M2.5-highspeed",
    "qwen/qwen3.5-397b-a17b": "Qwen3.5-397B-A17B",
    "deepseek/deepseek-v3.2": "DeepSeek-V3.2",
    "moonshotai/kimi-k2.5": "Kimi\x20K2.5",
    "apimart/gemini-3.1-pro-preview": "Gemini\x203.1\x20Pro\x20Preview",
    "apimart/gemini-3-flash-preview-nothinking": "Gemini 3 Flash (No Thinking)",
    "gpt-image-2": "GPT\x20image\x202",
    "gpt-image-2-vip": "GPT image 2",
    "nano-banana": "Nanobanana",
    "nano-banana-fast": "Nanobanana",
    "nano-banana-pro": "NanobananaPRO",
    "nano-banana-pro-vt": "NanobananaPRO",
    "nano-banana-pro-cl": "NanobananaPRO",
    "nano-banana-pro-vip": "NanobananaPRO",
    "nano-banana-pro-4k-vip": "NanobananaPRO",
    "nano-banana-2": "Nanobanana2",
    "nano-banana-2-cl": "Nanobanana2",
    "nano-banana-2-4k-cl": "Nanobanana2",
    "apimart/gpt-5.4": "GPT-5.4",
    "seedance-2.0-fast": "Seedance 2.0 Fast",
    "seedance-2.0": "Seedance 2.0",
    "aicanvas/text-lite": "AICanvas Text Lite",
    "aicanvas/text-pro": "AICanvas Text Pro",
    "aicanvas/image-lite": "AICanvas Image Lite",
    "aicanvas/image-pro": "AICanvas Image Pro",
  };
  return v2[v0] || v0;
};
export const PROVIDERS_META = {
  grsai: {
    id: "grsai",
    label: "GRSAI",
    defaultUrl: "https://grsai.dakka.com.cn",
    logoPath: "images/grsai.png",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    defaultUrl: "https://api.openai.com",
    logoPath: null,
  },
  ppio: {
    id: "ppio",
    label: "派欧云",
    defaultUrl: "https://api.ppio.com",
    logoPath: "images/ppio.png",
  },
  apimart: {
    id: "apimart",
    label: "APIMart",
    defaultUrl: "https://api.apimart.ai",
    logoPath: null,
  },
  volcengine: {
    id: "volcengine",
    label: "火山方舟",
    defaultUrl: "https://ark.cn-beijing.volces.com/api/v3",
    logoPath: "images/volcengine.svg",
  },
  runninghub: {
    id: "runninghub",
    label: "RunningHUB",
    defaultUrl: "https://www.runninghub.cn",
    logoPath: "images/RH.png",
  },
  nvidia: {
    id: "nvidia",
    label: "英伟达 NIM",
    defaultUrl: "https://integrate.api.nvidia.com/v1",
    logoPath: null,
  },
  runninghubwf: {
    id: "runninghubwf",
    label: "RunningHUB工作流",
    defaultUrl: "https://www.runninghub.cn",
    logoPath: "images/RH.png",
  },
  dreamina: { id: "dreamina", label: "即梦", defaultUrl: "", logoPath: null },
  aicanvas: {
    id: "aicanvas",
    label: "AICanvas",
    defaultUrl: "",
    logoPath: "images/favicon.svg",
  },
};
export function getAllProviderIds() {
  return Object["keys"](PROVIDERS_META);
}
