import { PROVIDERS_META } from "../src/modules/providers.js";
import { prepareNvidiaTextModels } from "../src/modules/nvidiaTextModels.js";
import { get, post } from "./apiBase.js";
let apiConfig = null;
const SECURE_PROVIDER_FIELDS = ["apiKey", "modelApiKey"],
  LEGACY_GRSAI_KEY_FIELDS = ["apiKey", "apiKeyInput"],
  DEFAULT_SECURE_PROVIDER_IDS = Object["freeze"]([
    ...new Set([
      ...Object["keys"](PROVIDERS_META || {}),
      "grsai",
      "openai",
      "ppio",
      "apimart",
      "runninghub",
      "aicanvas",
    ]),
  ]);
export function clearApiConfig() {
  apiConfig = null;
}
export function getApiConfigSnapshot() {
  return apiConfig ? cloneConfig(apiConfig) : {};
}
function applyProviderSideEffects(v71a = {}) {
  prepareNvidiaTextModels(v71a?.["providers"]?.["nvidia"] || {});
}
function isPlainObject(v0) {
  return !!v0 && typeof v0 === "object" && !Array["isArray"](v0);
}
function cloneConfig(v1) {
  return isPlainObject(v1) ? JSON["parse"](JSON["stringify"](v1)) : {};
}
function normalizeProviderId(v2) {
  return String(v2 || "")
    ["trim"]()
    ["replace"](/[^A-Za-z0-9_-]/g, "");
}
function buildProviderSecureKey(v3, v4) {
  const v5 = normalizeProviderId(v3),
    v6 = String(v4 || "")["trim"]();
  if (!v5 || !SECURE_PROVIDER_FIELDS["includes"](v6)) return "";
  return "apiConfig.providers." + v5 + "." + v6;
}
function getSecureSettingsApi() {
  const v7 = globalThis?.["window"]?.["electronAPI"]?.["secureSettings"];
  if (
    v7 &&
    typeof v7["get"] === "function" &&
    typeof v7["set"] === "function" &&
    typeof v7["delete"] === "function"
  )
    return v7;
  return null;
}
function collectProviderIds(v8 = {}) {
  const v9 = new Set(DEFAULT_SECURE_PROVIDER_IDS);
  return (
    isPlainObject(v8["providers"]) &&
      Object["keys"](v8["providers"])["forEach"]((v10) => {
        const v11 = normalizeProviderId(v10);
        if (v11) v9["add"](v11);
      }),
    [...v9]
  );
}
function collectSecureKeys(v12 = {}) {
  const v13 = [];
  return (
    collectProviderIds(v12)["forEach"]((v14) => {
      SECURE_PROVIDER_FIELDS["forEach"]((v15) => {
        const v16 = buildProviderSecureKey(v14, v15);
        if (v16) v13["push"](v16);
      });
    }),
    v13
  );
}
function stripSensitiveConfigValues(v17 = {}) {
  const v18 = cloneConfig(v17);
  return (
    isPlainObject(v18["providers"]) &&
      Object["values"](v18["providers"])["forEach"]((v19) => {
        if (!isPlainObject(v19)) return;
        SECURE_PROVIDER_FIELDS["forEach"]((v20) => {
          delete v19[v20];
        });
      }),
    LEGACY_GRSAI_KEY_FIELDS["forEach"]((v21) => {
      delete v18[v21];
    }),
    v18
  );
}
function extractPlaintextSecureValues(v22 = {}) {
  const v23 = new Map(),
    v24 = isPlainObject(v22["providers"]) ? v22["providers"] : {};
  Object["entries"](v24)["forEach"](([v25, v26]) => {
    if (!isPlainObject(v26)) return;
    SECURE_PROVIDER_FIELDS["forEach"]((v27) => {
      if (!Object["prototype"]["hasOwnProperty"]["call"](v26, v27)) return;
      const v28 = buildProviderSecureKey(v25, v27);
      if (!v28) return;
      v23["set"](v28, String(v26[v27] || ""));
    });
  });
  const v29 = !!String(v24?.["grsai"]?.["apiKey"] || "")["trim"]();
  if (!v29)
    for (const v30 of LEGACY_GRSAI_KEY_FIELDS) {
      if (!Object["prototype"]["hasOwnProperty"]["call"](v22, v30)) continue;
      const v31 = String(v22[v30] || "");
      if (v31) v23["set"](buildProviderSecureKey("grsai", "apiKey"), v31);
    }
  return v23;
}
function mergeSecureValuesIntoConfig(v32 = {}, v33 = {}) {
  const v34 = stripSensitiveConfigValues(v32);
  return (
    Object["entries"](v33 || {})["forEach"](([v35, v36]) => {
      const v37 = String(v35 || "")["match"](
        /^apiConfig\.providers\.([A-Za-z0-9_-]+)\.(apiKey|modelApiKey)$/,
      );
      if (!v37) return;
      const v38 = v37[1],
        v39 = v37[2],
        v40 = String(v36 || "");
      if (!v40) return;
      if (!isPlainObject(v34["providers"])) v34["providers"] = {};
      if (!isPlainObject(v34["providers"][v38])) v34["providers"][v38] = {};
      v34["providers"][v38][v39] = v40;
    }),
    v34
  );
}
async function readSecureValues(v41 = {}) {
  const v42 = getSecureSettingsApi();
  if (!v42) return { available: false, values: {} };
  try {
    const v43 = await v42["get"]({ keys: collectSecureKeys(v41) });
    if (!v43?.["available"]) return { available: false, values: {} };
    return {
      available: true,
      values: isPlainObject(v43["values"]) ? v43["values"] : {},
    };
  } catch {
    return { available: false, values: {} };
  }
}
async function writeSecureValues(v44) {
  const v45 = getSecureSettingsApi();
  if (!v45 || !(v44 instanceof Map))
    return { available: false, changed: false };
  const v46 = await v45["get"]({ keys: [] })["catch"](() => null);
  if (!v46?.["available"]) return { available: false, changed: false };
  let v47 = false;
  for (const [v48, v49] of v44["entries"]()) {
    if (!v48) continue;
    const v50 = String(v49 || "");
    if (v50) {
      const v51 = await v45["set"]({ key: v48, value: v50 });
      if (v51?.["ok"]) v47 = true;
    } else {
      const v52 = await v45["delete"]({ key: v48 });
      if (v52?.["ok"]) v47 = true;
    }
  }
  return { available: true, changed: v47 };
}
async function hydrateConfigFromSecureStorage(v53 = {}) {
  const v54 = extractPlaintextSecureValues(v53),
    { available: v55, values: v56 } = await readSecureValues(v53);
  if (!v55) return v53;
  let v57 = { ...v56 };
  if (v54["size"] > 0) {
    const v58 = await writeSecureValues(v54);
    if (v58["available"]) {
      v54["forEach"]((v59, v60) => {
        if (String(v59 || "")) v57[v60] = String(v59 || "");
        else delete v57[v60];
      });
      const v61 = stripSensitiveConfigValues(v53);
      await post("/api/config", v61)["catch"](() => null);
    }
  }
  return mergeSecureValuesIntoConfig(v53, v57);
}
function _syncLegacyWindowApiKeys(v62) {
  if (typeof window === "undefined") return;
  const v63 = v62?.["providers"] || {},
    v64 = v62?.["apiKey"] || "";
  ((window["_appApiKey"] = v63["grsai"]?.["apiKey"] || v64 || ""),
    (window["_runningHubApiKey"] = v63["runninghub"]?.["apiKey"] || ""),
    (window["_runningHubModelApiKey"] =
      v63["runninghub"]?.["modelApiKey"] || ""));
}
export async function fetchApiConfigFromServer() {
  const v65 = await get("/api/config");
  if (!v65["success"]) throw new Error(v65["error"] || "获取配置失败");
  return (
    (apiConfig = await hydrateConfigFromSecureStorage(v65["data"] || {})),
    _syncLegacyWindowApiKeys(apiConfig),
    applyProviderSideEffects(apiConfig),
    apiConfig
  );
}
function mergeSavedApiConfig(v71b = {}, v71c = {}) {
  const v71d = isPlainObject(v71c) ? v71c : {},
    v71e = isPlainObject(v71b) ? v71b : {},
    v71f = isPlainObject(v71d["providers"]) ? v71d["providers"] : {},
    v71g = isPlainObject(v71e["providers"]) ? v71e["providers"] : {};
  return {
    ...v71d,
    ...v71e,
    providers: { ...v71f, ...v71g },
  };
}
export async function saveApiConfigToServer(v66) {
  const v67 = extractPlaintextSecureValues(v66 || {}),
    v68 = await writeSecureValues(v67),
    v69 = v68["available"] ? stripSensitiveConfigValues(v66 || {}) : v66 || {},
    v70 = await post("/api/config", v69);
  if (!v70["success"]) throw new Error(v70["error"] || "保存配置失败");
  const v70b = mergeSavedApiConfig(v66, v70["data"]);
  return (
    clearApiConfig(),
    (apiConfig = cloneConfig(v70b)),
    applyProviderSideEffects(apiConfig),
    _syncLegacyWindowApiKeys({ providers: v66?.["providers"] || {} }),
    apiConfig
  );
}
export async function ensureConfig() {
  if (apiConfig) return;
  await fetchApiConfigFromServer();
}
export function getProviderConfig(v71) {
  const v72 = PROVIDERS_META[v71],
    v73 = v72?.["defaultUrl"] || "https://grsai.dakka.com.cn",
    v74 = apiConfig?.["providers"]?.[v71];
  if (v74?.["apiUrl"] || v74?.["apiKey"] || v74?.["modelApiKey"])
    return {
      apiUrl: (v74["apiUrl"] || v73)["replace"](/\/+$/, ""),
      apiKey: v74["apiKey"] || "",
      modelApiKey: v74["modelApiKey"] || "",
    };
  if (v71 === "runninghubwf") {
    const v75 = apiConfig?.["providers"]?.["runninghub"];
    if (v75?.["apiUrl"] || v75?.["apiKey"] || v75?.["modelApiKey"])
      return {
        apiUrl: (v75["apiUrl"] || v73)["replace"](/\/+$/, ""),
        apiKey: v75["apiKey"] || "",
        modelApiKey: "",
      };
  }
  if (v71 === "grsai")
    return {
      apiUrl: (apiConfig?.["apiUrlInput"] || apiConfig?.["apiUrl"] || v73)[
        "replace"
      ](/\/+$/, ""),
      apiKey: apiConfig?.["apiKeyInput"] || apiConfig?.["apiKey"] || "",
      modelApiKey: "",
    };
  return { apiUrl: v73, apiKey: "", modelApiKey: "" };
}
