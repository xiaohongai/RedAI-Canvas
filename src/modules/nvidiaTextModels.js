import {
  getModelManifest,
  registerExecutionManifest,
  registerModelManifest,
} from "../manifests/modelRegistry.js";
import { NVIDIA_BUILTIN_TEXT_MODELS } from "../manifests/text/modelApi/nvidiaBuiltinTextModels.js";

const CHAT_COMPLETION_TEXT_INPUT_SLOTS = Object["freeze"]({
  allowedKinds: Object["freeze"](["text", "image"]),
  minByKind: Object["freeze"]({ text: 0, image: 0 }),
  maxByKind: Object["freeze"]({ image: 8, video: 0, audio: 0 }),
});
const CHAT_COMPLETION_TEXT_RESPONSE_MAPPING = Object["freeze"]({
  resultPaths: Object["freeze"]([
    "choices[].message.content",
    "choices[].delta.content",
    "text",
    "output",
  ]),
});
const APIMART_TEXT_RESULT = Object["freeze"]({
  textFields: Object["freeze"]([
    "choices[].message.content",
    "text",
    "output",
  ]),
});
const _dynamicRegisteredModelIds = new Set();

function normalizeNvidiaApiModel(v0) {
  return String(v0 || "")
    ["trim"]()
    ["replace"](/^nvidia\//i, "");
}
function slugifyNvidiaModel(v1) {
  return normalizeNvidiaApiModel(v1)
    ["replace"](/[^a-zA-Z0-9]+/g, "-")
    ["replace"](/^-+|-+$/g, "")
    ["toLowerCase"]();
}
function resolveNvidiaModelIcon(v2) {
  const v3 = String(v2 || "")["toLowerCase"]();
  if (v3["includes"]("deepseek")) return "deepseek";
  return "nvidia";
}
function inferNvidiaDisplayName(v4, v5 = "") {
  const v6 = String(v5 || "")["trim"]();
  if (v6) return v6;
  const v7 = normalizeNvidiaApiModel(v4);
  const v8 = v7["split"]("/");
  return v8[v8["length"] - 1] || v7;
}
export function createNvidiaTextModelEntry(v9, v10 = {}, v11 = 0) {
  const v12 = normalizeNvidiaApiModel(v9);
  if (!v12) return null;
  const v13 = slugifyNvidiaModel(v12),
    v14 = inferNvidiaDisplayName(v12, v10["name"] || v10["displayName"] || v10["title"]),
    v15 = Number(v10["order"]) || (v11 + 1) * 10;
  return Object["freeze"]({
    model: v12,
    modelId: "nvidia/" + v12,
    executionId: "nvidia.model-api.text." + v13 + ".v1",
    displayName: v14,
    title: v14,
    subtitle:
      String(v10["subtitle"] || "")["trim"]() ||
      "NVIDIA NIM chat completion model API",
    icon: v10["icon"] || resolveNvidiaModelIcon(v12),
    order: v15,
  });
}
export function getDefaultNvidiaTextModelEntries() {
  return NVIDIA_BUILTIN_TEXT_MODELS["map"]((v16) =>
    createNvidiaTextModelEntry(v16["model"], v16, v16["order"] / 10 - 1),
  )["filter"](Boolean);
}
export function normalizeNvidiaTextModelConfigEntry(v17) {
  if (typeof v17 === "string") {
    const v18 = createNvidiaTextModelEntry(v17);
    return v18 ? { model: v18["model"], name: v18["title"] } : null;
  }
  if (!v17 || typeof v17 !== "object") return null;
  const v19 = normalizeNvidiaApiModel(v17["model"] || v17["id"]);
  if (!v19) return null;
  return {
    model: v19,
    name: String(v17["name"] || v17["displayName"] || v17["title"] || "")[
      "trim"
    ](),
  };
}
export function getNvidiaTextModelsFromProviderConfig(v20 = {}) {
  const v21 = Array["isArray"](v20["textModels"]) ? v20["textModels"] : null;
  if (!v21) return getDefaultNvidiaTextModelEntries();
  return v21
    ["map"]((v22, v23) => {
      const v24 = normalizeNvidiaTextModelConfigEntry(v22);
      return v24 ? createNvidiaTextModelEntry(v24["model"], v24, v23) : null;
    })
    ["filter"](Boolean);
}
export function toNvidiaTextModelConfigEntries(v25 = []) {
  return v25
    ["map"]((v26) => {
      const v27 = normalizeNvidiaApiModel(v26?.["model"]);
      if (!v27) return null;
      const v28 = String(v26?.["title"] || v26?.["displayName"] || "")["trim"]();
      return v28 ? { model: v27, name: v28 } : { model: v27 };
    })
    ["filter"](Boolean);
}
function buildNvidiaModelManifest(v29) {
  return Object["freeze"]({
    schemaVersion: "1.0",
    modelId: v29["modelId"],
    aliases: Object["freeze"]([v29["model"]]),
    provider: "nvidia",
    kind: "text",
    adapterType: "modelApi",
    executionId: v29["executionId"],
    displayName: v29["displayName"],
    icon: v29["icon"],
    description: "NVIDIA NIM chat completion model API",
    inputSlots: CHAT_COMPLETION_TEXT_INPUT_SLOTS,
    uiSchema: Object["freeze"]({ fields: Object["freeze"]([]) }),
    async: true,
    cancellable: false,
    outputType: "text",
    extensions: Object["freeze"]({
      textMenu: Object["freeze"]({
        group: "nvidia",
        order: v29["order"],
        title: v29["title"],
        subtitle: v29["subtitle"],
        icon: v29["icon"],
      }),
    }),
  });
}
function buildNvidiaExecutionManifest(v30) {
  return Object["freeze"]({
    schemaVersion: "1.0",
    id: v30["executionId"],
    provider: "nvidia",
    kind: "text",
    adapterType: "modelApi",
    endpoint: "/chat/completions",
    endpointMode: "chat-completion",
    method: "POST",
    model: v30["model"],
    headers: Object["freeze"]({ "Content-Type": "application/json" }),
    bodyMapping: Object["freeze"]({
      modelField: "model",
      messagesField: "messages",
    }),
    responseMapping: CHAT_COMPLETION_TEXT_RESPONSE_MAPPING,
    result: APIMART_TEXT_RESULT,
  });
}
export function syncNvidiaTextModelManifests(v31 = []) {
  v31["forEach"]((v32) => {
    if (!v32?.["modelId"] || getModelManifest(v32["modelId"])) return;
    if (_dynamicRegisteredModelIds["has"](v32["modelId"])) return;
    registerExecutionManifest(buildNvidiaExecutionManifest(v32));
    registerModelManifest(buildNvidiaModelManifest(v32));
    _dynamicRegisteredModelIds["add"](v32["modelId"]);
  });
}
export function prepareNvidiaTextModels(v33 = {}) {
  const v34 = getNvidiaTextModelsFromProviderConfig(v33);
  syncNvidiaTextModelManifests(v34);
  return v34;
}
