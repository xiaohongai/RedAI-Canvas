export const TEXT_PROVIDER_MENU_GROUP_MANIFESTS = Object["freeze"]([
  Object["freeze"]({
    id: "grsai",
    label: "GRSAI",
    subtitle: "稳定 · 市场最低价 · 高并发",
    icon: "grsai",
  }),
  Object["freeze"]({
    id: "ppio",
    label: "PPIO 派欧云",
    subtitle: "高性价比、超弹性、低延迟的产品",
    icon: "ppio",
  }),
  Object["freeze"]({
    id: "apimart",
    label: "APIMart",
    subtitle: "一个 API 搞定一切——节省 30-70%",
    icon: "am",
  }),
  Object["freeze"]({
    id: "runninghub",
    label: "RunningHUB",
    subtitle: "接入 RunningHUB LLM 与图像理解能力",
    icon: "runninghub",
  }),
  Object["freeze"]({
    id: "volcengine",
    label: "火山方舟",
    subtitle: "官方 Ark Chat API，使用火山 API Key",
    icon: "volcengine",
  }),
  Object["freeze"]({
    id: "nvidia",
    label: "英伟达 NIM",
    subtitle: "免费 API Key · OpenAI 兼容模型接口",
    icon: "nvidia",
  }),
]);
export function getTextProviderMenuGroups() {
  return TEXT_PROVIDER_MENU_GROUP_MANIFESTS;
}
