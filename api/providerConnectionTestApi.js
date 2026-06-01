import { PROVIDERS_META } from "../src/modules/providers.js";
import { post, request } from "./apiBase.js";
import { normalizeApimartBaseUrl } from "./apimartUploadApi.js";
const TEST_TIMEOUT_MS = 30000,
  TEST_UPLOAD_TIMEOUT_MS = 60000,
  DEFAULT_PROVIDER_TEST_IDS = Object["freeze"]([
    "apimart",
    "volcengine",
    "grsai",
    "ppio",
    "runninghub",
    "openai",
    "nvidia",
  ]),
  COMPLETION_FALLBACKS = Object["freeze"]({
    apimart: {
      model: "deepseek-v4-flash",
      basePath: "v1",
      label: "DeepSeek\x20V4\x20Flash",
    },
    grsai: { model: "gemini-3.1-pro", basePath: "v1", label: "Gemini 3.1 Pro" },
    ppio: { basePath: "openai/v1" },
    nvidia: {
      model: "meta/llama-3.1-8b-instruct",
      basePath: "v1/chat/completions",
      label: "Llama 3.1 8B Instruct",
    },
  }),
  GRSAI_COMPLETION_TEST_MESSAGE = "你好",
  STEP_LABELS = Object["freeze"]({
    config: "配置",
    auth: "密钥",
    model: "模型",
    balance: "余额",
    upload: "上传",
  }),
  SKIPPED_UPLOAD_PROVIDERS = Object["freeze"]({
    openai: "OpenAI 兼容接口通常直接接收远程 URL，本轮不做独立上传测试",
    nvidia: "英伟达 NIM 为 OpenAI 兼容接口，本轮不做独立上传测试",
    ppio: "派欧云当前链路不需要独立厂商上传，本轮只检测密钥和模型列表",
    volcengine:
      "火山方舟当前先检测 API Key 和服务连通性，模型素材上传待模型接入时验证",
  }),
  ONE_PIXEL_PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
function isPlainObject(v0) {
  return !!v0 && typeof v0 === "object" && !Array["isArray"](v0);
}
function normalizeProviderId(v1) {
  return String(v1 || "")
    ["trim"]()
    ["toLowerCase"]();
}
function trimSlashes(v2) {
  return String(v2 || "")["replace"](/^\/+|\/+$/g, "");
}
function normalizeBaseUrl(v3) {
  return String(v3 || "")
    ["trim"]()
    ["replace"](/\/+$/, "");
}
function joinUrl(v4, v5) {
  const v6 = normalizeBaseUrl(v4),
    v7 = trimSlashes(v5);
  if (!v6) return v7;
  if (!v7) return v6;
  return v6 + "/" + v7;
}
function providerLabel(v8) {
  return PROVIDERS_META?.[v8]?.["label"] || v8;
}
function providerConfigWithDefaults(v9, v10 = {}) {
  const v11 = isPlainObject(v10) ? v10 : {},
    v12 = v9 === "grsai" ? PROVIDERS_META?.[v9]?.["defaultUrl"] || "" : "";
  return {
    apiUrl: normalizeBaseUrl(
      v12 || v11["apiUrl"] || PROVIDERS_META?.[v9]?.["defaultUrl"] || "",
    ),
    apiKey: String(v11["apiKey"] || "")
      ["trim"]()
      ["replace"](/^Bearer\s+/i, ""),
    modelApiKey: String(v11["modelApiKey"] || "")
      ["trim"]()
      ["replace"](/^Bearer\s+/i, ""),
  };
}
function stripKnownOpenAiTail(v13) {
  return normalizeBaseUrl(v13)
    ["replace"](/\/chat\/completions$/i, "")
    ["replace"](/\/models$/i, "");
}
function buildModelsProbeUrl(v14, v15) {
  const v16 = normalizeProviderId(v14),
    v17 = stripKnownOpenAiTail(v15);
  if (!v17 || v17["includes"](":generateContent")) return "";
  if (v16 === "ppio")
    return joinUrl(v17["replace"](/\/openai\/v1$/i, ""), "openai/v1/models");
  if (/\/v\d+(?:beta)?$/i["test"](v17) || /\/openai\/v1$/i["test"](v17))
    return joinUrl(v17, "models");
  return joinUrl(v17, "v1/models");
}
function buildCompletionProbeUrl(v18, v19) {
  const v20 = COMPLETION_FALLBACKS[v18];
  if (!v20) return "";
  const v21 = stripKnownOpenAiTail(v19);
  if (!v21 || v21["includes"](":generateContent")) return "";
  if (v18 === "ppio")
    return joinUrl(v21["replace"](/\/openai\/v1$/i, ""), v20["basePath"]);
  if (/\/v\d+(?:beta)?$/i["test"](v21)) return v21;
  return joinUrl(v21, v20["basePath"]);
}
function buildVolcenginePingProbeUrl(v22) {
  const v23 = stripKnownOpenAiTail(v22);
  if (!v23 || v23["includes"](":generateContent")) return "";
  const v24 = v23["replace"](/\/api\/v3$/i, "")["replace"](
    /\/api\/coding\/v3$/i,
    "",
  );
  return joinUrl(v24, "ping");
}
function buildApimartBalanceProbeUrls(v25) {
  const v26 = stripKnownOpenAiTail(v25);
  if (!v26 || v26["includes"](":generateContent")) return [];
  if (/\/v\d+(?:beta)?$/i["test"](v26))
    return [joinUrl(v26, "balance"), joinUrl(v26, "user/balance")];
  return [joinUrl(v26, "v1/balance"), joinUrl(v26, "v1/user/balance")];
}
function buildRunningHubAccountStatusProbeUrl(v27) {
  const v28 = normalizeBaseUrl(
    v27 ||
      PROVIDERS_META?.["runninghub"]?.["defaultUrl"] ||
      "https://www.runninghub.cn",
  )
    ["replace"](/\/openapi\/v2(?:\/.*)?$/i, "")
    ["replace"](/\/uc\/openapi\/accountStatus$/i, "");
  return joinUrl(v28, "uc/openapi/accountStatus");
}
function buildGrsaiApiKeyCreditsProbeUrl(v29) {
  const v30 = normalizeBaseUrl(
    v29 ||
      PROVIDERS_META?.["grsai"]?.["defaultUrl"] ||
      "https://grsai.dakka.com.cn",
  )
    ["replace"](/\/v\d+(?:beta)?$/i, "")
    ["replace"](/\/client\/openapi\/getAPIKeyCredits$/i, "");
  return joinUrl(v30, "client/openapi/getAPIKeyCredits");
}
function buildGrsaiAccountCreditsProbeUrl(v31) {
  const v32 = normalizeBaseUrl(
    v31 ||
      PROVIDERS_META?.["grsai"]?.["defaultUrl"] ||
      "https://grsai.dakka.com.cn",
  )
    ["replace"](/\/v\d+(?:beta)?$/i, "")
    ["replace"](/\/client\/openapi\/getCredits$/i, "")
    ["replace"](/\/client\/common\/getCredits(?:\?.*)?$/i, "");
  return joinUrl(v32, "client/openapi/getCredits");
}
function buildGrsaiCommonCreditsProbeUrl(v33, v34) {
  const v35 = normalizeBaseUrl(
    v33 ||
      PROVIDERS_META?.["grsai"]?.["defaultUrl"] ||
      "https://grsai.dakka.com.cn",
  )
    ["replace"](/\/v\d+(?:beta)?$/i, "")
    ["replace"](/\/client\/openapi\/getCredits$/i, "")
    ["replace"](/\/client\/openapi\/getAPIKeyCredits$/i, "")
    ["replace"](/\/client\/common\/getCredits(?:\?.*)?$/i, "");
  return (
    joinUrl(v35, "client/common/getCredits") +
    "?apikey=" +
    encodeURIComponent(v34)
  );
}
function toFiniteNumber(v36) {
  if (v36 === null || v36 === undefined || v36 === "") return null;
  const v37 = Number(v36);
  return Number["isFinite"](v37) ? v37 : null;
}
function formatBalanceNumber(v38) {
  const v39 = toFiniteNumber(v38);
  if (v39 === null) return "";
  return new Intl["NumberFormat"]("zh-CN", { maximumFractionDigits: 6 })[
    "format"
  ](v39);
}
function formatCurrencyLabel(v40) {
  const v41 = String(v40 || "")
    ["trim"]()
    ["toUpperCase"]();
  if (!v41 || v41 === "CNY" || v41 === "RMB" || v41 === "CNH") return "人民币";
  return v41;
}
export function normalizeApimartBalancePayload(v42 = {}) {
  const v43 =
    isPlainObject(v42?.["data"]) && !Array["isArray"](v42["data"])
      ? v42["data"]
      : v42;
  if (!isPlainObject(v43) || v43["success"] === false) return null;
  const v44 = v43["unlimited_quota"] === true,
    v45 = toFiniteNumber(
      v43["remain_balance"] ?? v43["remaining_balance"] ?? v43["balance"],
    ),
    v46 = toFiniteNumber(v43["used_balance"]);
  if (!v44 && v45 === null) return null;
  const v47 = v45 === null ? "" : formatBalanceNumber(v45),
    v48 = [];
  if (v44) v48["push"]("额度不限");
  if (v47) v48["push"]("剩余余额：" + v47 + "\x20美元");
  return {
    unlimited: v44,
    remaining: v45,
    used: v46,
    displayText: v44
      ? "余额\x20不限"
      : v47
        ? "余额 " + v47 + " 美元"
        : "余额 已读取",
    detailText: v48["join"]("；") || "APIMart 余额已读取",
  };
}
function normalizeRunningHubAccountStatusPayload(v49 = {}) {
  const v50 =
    isPlainObject(v49?.["data"]) && !Array["isArray"](v49["data"])
      ? v49["data"]
      : v49;
  if (!isPlainObject(v50)) return null;
  if (v50["success"] === false) return null;
  if (v50["code"] !== undefined && Number(v50["code"]) !== 0) return null;
  const v51 =
      isPlainObject(v50["data"]) && !Array["isArray"](v50["data"])
        ? v50["data"]
        : v50,
    v52 = toFiniteNumber(
      v51["remainCoins"] ?? v51["remain_coins"] ?? v51["coins"],
    ),
    v53 = toFiniteNumber(
      v51["remainMoney"] ??
        v51["remain_money"] ??
        v51["money"] ??
        v51["balance"],
    );
  if (v52 === null && v53 === null) return null;
  const v54 =
    String(v51["currency"] || "CNY")
      ["trim"]()
      ["toUpperCase"]() || "CNY";
  return {
    coins: v52,
    money: v53,
    currency: v54,
    apiType: String(v51["apiType"] || v51["api_type"] || "")["trim"](),
  };
}
export function normalizeRunningHubBalancePayload({
  workflow: v55,
  model: v56,
} = {}) {
  const v57 = normalizeRunningHubAccountStatusPayload(v55),
    v58 = normalizeRunningHubAccountStatusPayload(v56),
    v59 = v57?.["coins"] ?? null,
    v60 = v58?.["money"] ?? null;
  if (v59 === null && v60 === null) return null;
  const v61 = v58?.["currency"] || v57?.["currency"] || "CNY",
    v62 = formatCurrencyLabel(v61),
    v63 = formatBalanceNumber(v59),
    v64 = formatBalanceNumber(v60),
    v65 = [],
    v66 = [];
  return (
    v63 && (v65["push"]("积分 " + v63), v66["push"]("工作流积分：" + v63)),
    v64 &&
      (v65["push"]("钱包\x20" + v64 + "\x20" + v62),
      v66["push"]("模型钱包：" + v64 + "\x20" + v62)),
    {
      workflowCredits: v59,
      modelWallet: v60,
      currency: v61,
      currencyLabel: v62,
      displayText: v65["join"](" · ") || "余额 已读取",
      detailText: v66["join"]("；") || "RunningHUB\x20账户信息已读取",
    }
  );
}
function isSuccessfulGrsaiPayload(v67) {
  if (!isPlainObject(v67)) return true;
  if (v67["success"] === false || v67["ok"] === false) return false;
  const v68 = v67["code"] ?? v67["statusCode"];
  if (v68 !== undefined) {
    const v69 = Number(v68);
    return v69 === 0 || v69 === 200;
  }
  return true;
}
function unwrapGrsaiCreditsPayload(v70) {
  if (!isPlainObject(v70)) return v70;
  if (!isSuccessfulGrsaiPayload(v70)) return null;
  if (v70["data"] !== undefined) return unwrapGrsaiCreditsPayload(v70["data"]);
  if (v70["result"] !== undefined)
    return unwrapGrsaiCreditsPayload(v70["result"]);
  return v70;
}
function extractGrsaiCreditsValue(v71, v72 = new Set()) {
  const v73 = toFiniteNumber(v71);
  if (v73 !== null) return v73;
  if (!isPlainObject(v71) || v72["has"](v71)) return null;
  v72["add"](v71);
  const v74 = [
    "currentCredits",
    "availableCredits",
    "remainingCredits",
    "remainCredits",
    "remain_credits",
    "remaining_credits",
    "accountCredits",
    "account_credits",
    "totalCredits",
    "total_credits",
    "apiKeyCredits",
    "api_key_credits",
    "credits",
    "credit",
    "balance",
    "amount",
  ];
  for (const v75 of v74) {
    if (v71[v75] === undefined) continue;
    const v76 = extractGrsaiCreditsValue(v71[v75], v72);
    if (v76 !== null) return v76;
  }
  for (const v77 of ["account", "user", "wallet", "quota"]) {
    if (v71[v77] === undefined) continue;
    const v78 = extractGrsaiCreditsValue(v71[v77], v72);
    if (v78 !== null) return v78;
  }
  return null;
}
export function normalizeGrsaiBalancePayload(v79 = {}, v80 = {}) {
  const v81 = unwrapGrsaiCreditsPayload(v79);
  if (v81 === null) return null;
  const v82 = toFiniteNumber(extractGrsaiCreditsValue(v81));
  if (v82 === null) return null;
  const v83 = formatBalanceNumber(v82),
    v84 = v80["source"] || "account",
    v85 = v84 === "apiKey" ? "API Key 积分" : "账户积分";
  return {
    credits: v82,
    source: v84,
    displayText: "积分 " + v83,
    detailText: v85 + "：" + v83,
  };
}
function stringifyProbePayload(v86) {
  if (v86 == null) return "";
  if (typeof v86 === "string") return v86;
  try {
    return JSON["stringify"](v86);
  } catch {
    return String(v86 || "");
  }
}
function probeText(v87 = {}) {
  return [
    v87["status"] ? "HTTP " + v87["status"] : "",
    v87["error"] || "",
    stringifyProbePayload(v87["data"]),
  ]
    ["filter"](Boolean)
    ["join"]("\x20");
}
function normalizeErrorText(v88 = "") {
  return String(v88 || "")
    ["replace"](/\s+/g, "\x20")
    ["trim"]();
}
function isAuthFailure(v89 = {}) {
  const v90 = Number(v89["status"] || 0);
  if (v90 === 401 || v90 === 403) return true;
  const v91 = probeText(v89)["toLowerCase"]();
  return /(?:\b401\b|\b403\b|unauthorized|forbidden|authentication|authorization|invalid\s+(?:api\s*)?key|invalid\s+token|api\s*key\s+invalid|apikey|bearer|access\s*token|鉴权|认证|未授权|无权限|密钥|令牌)/i[
    "test"
  ](v91);
}
function classifyProbeFailure(v92 = {}, v93 = "provider_error") {
  const v94 = Number(v92["status"] || 0),
    v95 = probeText(v92)["toLowerCase"]();
  if (isAuthFailure(v92)) return "auth_failed";
  if (
    v94 === 0 ||
    /timeout|timed out|network|failed to fetch|dns|econn|请求超时|网络请求失败/i[
      "test"
    ](v95)
  )
    return "network_failed";
  if (
    v94 === 429 ||
    /rate limit|too many requests|限流|请求过于频繁/i["test"](v95)
  )
    return "rate_limited";
  if (
    /insufficient|quota|balance|billing|credit|payment|额度|余额|欠费|付费|账户余额/i[
      "test"
    ](v95)
  )
    return "quota_or_balance";
  if (
    /model.+(?:not found|not exist|unavailable|no access)|模型.*(?:不存在|不可用|无权限|未开通)|no permission.*model/i[
      "test"
    ](v95)
  )
    return "model_unavailable";
  if (
    v94 === 404 ||
    /not found|invalid url|unsupported endpoint|cannot post|cannot get|接口地址|地址不兼容/i[
      "test"
    ](v95)
  )
    return "bad_base_url";
  return v93;
}
function humanizeCategory(v96, v97, v98 = "连接测试未通过") {
  const v99 = providerLabel(v97),
    v100 = {
      missing_key: v99 + " 的 API Key 还没填写。",
      missing_url: v99 + " 的接口地址未配置。",
      auth_failed: v99 + " 的 API Key 无效、过期，或没有访问权限。",
      network_failed: "无法连到 " + v99 + "，请检查网络、本地服务或防火墙。",
      rate_limited: v99 + "\x20返回限流，请稍后再试。",
      quota_or_balance: v99 + "\x20账户额度或余额可能不足。",
      model_unavailable:
        v99 + " 的测试模型不可访问，可能未开通该模型或模型名不兼容。",
      bad_base_url: v99 + " 的接口地址不兼容，请检查 Base URL 是否填对。",
      upload_failed: v99 + " 上传链路未通过，参考图/视频上传可能会失败。",
      provider_error: v99 + " 返回异常，稍后重试或查看厂商后台状态。",
      unsupported: v99 + " 暂不支持连接测试。",
    };
  return v100[v96] || v98;
}
function isSuccessfulProbe(v101 = {}) {
  if (!v101["success"]) return false;
  const v102 = Number(v101["status"] || 0);
  if (v102 && (v102 < 200 || v102 >= 300)) return false;
  return !isAuthFailure(v101);
}
function summarizeFailure(v103 = {}, v104 = "连接测试未通过") {
  const v105 = probeText(v103)["trim"]();
  if (!v105) return v104;
  return v105["length"] > 180 ? v105["slice"](0, 177) + "..." : v105;
}
function makeStep(v106, v107, v108, v109 = "", v110 = {}) {
  return {
    id: v106,
    label: STEP_LABELS[v106] || v106,
    ok: Boolean(v107),
    skipped: v110["skipped"] === true,
    message: v108,
    detail: normalizeErrorText(v109),
    category: v110["category"] || "",
  };
}
function pass(v111, v112 = "连接测试通过", v113 = []) {
  return {
    ok: true,
    providerId: v111,
    label: providerLabel(v111),
    message: "通过",
    summary: "连接测试通过",
    detail: v112,
    category: "",
    suggestion: "",
    steps: v113,
  };
}
function fail(v114, v115, v116 = [], v117 = "provider_error") {
  return {
    ok: false,
    providerId: v114,
    label: providerLabel(v114),
    message: "未通过",
    error: String(v115 || "连接测试未通过"),
    summary: String(v115 || "连接测试未通过"),
    category: v117,
    suggestion: humanizeCategory(v117, v114, v115),
    steps: v116,
  };
}
function finishProviderResult(v118, v119 = []) {
  const v120 = v119["find"]((v121) => !v121["ok"] && !v121["skipped"]),
    v122 = v119["filter"]((v123) => v123["ok"]),
    v124 = v119["filter"]((v125) => v125["skipped"]);
  if (!v120) {
    const v126 = v119["map"](
      (v127) => v127["label"] + ":\x20" + v127["message"],
    )["join"]("；");
    return pass(v118, v126 || "连接测试通过", v119);
  }
  const v128 = v120["category"] || "provider_error",
    v129 = v120["message"] || humanizeCategory(v128, v118),
    v130 = v119["map"]((v131) => {
      const v132 = v131["skipped"] ? "跳过" : v131["ok"] ? "通过" : "失败";
      return "" + v131["label"] + v132 + ":\x20" + v131["message"];
    });
  return {
    ok: false,
    partial: v122["length"] > 0 || v124["length"] > 0,
    providerId: v118,
    label: providerLabel(v118),
    message: v122["length"] > 0 ? "部分通过" : "未通过",
    error: v129,
    summary: v129,
    detail: v130["join"]("；"),
    category: v128,
    suggestion: humanizeCategory(v128, v118, v129),
    steps: v119,
  };
}
async function getModelsProbe(v133, v134, v135) {
  const v136 = await request(
    "/api/v2/proxy/task?apiUrl=" + encodeURIComponent(v134),
    { method: "GET", headers: { Authorization: "Bearer " + v135 } },
    TEST_TIMEOUT_MS,
  );
  if (isSuccessfulProbe(v136))
    return makeStep("auth", true, "API Key 可用，模型列表可访问", "models");
  const v137 = classifyProbeFailure(v136);
  return {
    ...makeStep(
      "auth",
      false,
      humanizeCategory(v137, v133),
      summarizeFailure(v136),
      { category: v137 },
    ),
    authFailed: isAuthFailure(v136),
  };
}
async function completionFallbackProbe(v138, v139, v140) {
  const v141 = COMPLETION_FALLBACKS[v138],
    v142 = buildCompletionProbeUrl(v138, v139);
  if (!v141?.["model"] || !v142)
    return makeStep(
      "model",
      true,
      "模型列表可访问，未执行额外模型调用",
      "no completion fallback",
      { skipped: true },
    );
  const v143 = {
    apiUrl: v142,
    apiKey: v140,
    model: v141["model"],
    stream: false,
    messages: [
      {
        role: "user",
        content: v138 === "grsai" ? GRSAI_COMPLETION_TEST_MESSAGE : "ping",
      },
    ],
  };
  v138 !== "grsai" && (v143["max_tokens"] = 1);
  const v144 = await post("/api/v2/proxy/completions", v143, TEST_TIMEOUT_MS);
  if (isSuccessfulProbe(v144))
    return makeStep(
      "model",
      true,
      "测试模型 " + (v141["label"] || v141["model"]) + " 可访问",
      "chat-completions",
    );
  const v145 = classifyProbeFailure(v144, "model_unavailable");
  return makeStep(
    "model",
    false,
    humanizeCategory(v145, v138),
    summarizeFailure(v144),
    { category: v145 },
  );
}
async function apimartBalanceProbe(v146, v147) {
  const v148 = buildApimartBalanceProbeUrls(v147["apiUrl"]);
  if (v148["length"] <= 0)
    return {
      step: makeStep(
        "balance",
        true,
        "余额接口地址不可用，已跳过",
        "no balance endpoint",
        { skipped: true },
      ),
      balance: null,
    };
  let v149 = null;
  for (const v150 of v148) {
    const v151 = await request(
      "/api/v2/proxy/task?apiUrl=" + encodeURIComponent(v150),
      { method: "GET", headers: { Authorization: "Bearer " + v147["apiKey"] } },
      TEST_TIMEOUT_MS,
    );
    v149 = v151;
    if (isSuccessfulProbe(v151)) {
      const v152 = normalizeApimartBalancePayload(v151["data"]);
      if (v152)
        return {
          step: makeStep(
            "balance",
            true,
            v152["detailText"] || "APIMart 余额已读取",
            v150["includes"]("/user/balance")
              ? "apimart-user-balance"
              : "apimart-token-balance",
          ),
          balance: v152,
        };
    }
  }
  return {
    step: makeStep(
      "balance",
      true,
      "余额暂未返回，连接测试继续",
      summarizeFailure(v149, "APIMart 余额接口未返回可识别数据"),
      { skipped: true },
    ),
    balance: null,
  };
}
async function grsaiCreditsRequest(v153, v154) {
  if (v153["id"] === "account")
    return request(
      buildGrsaiAccountCreditsProbeUrl(v154["apiUrl"]),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({ token: v154["apiKey"] }),
      },
      TEST_TIMEOUT_MS,
    );
  if (v153["id"] === "common")
    return request(
      buildGrsaiCommonCreditsProbeUrl(v154["apiUrl"], v154["apiKey"]),
      { method: "GET", headers: { Authorization: "Bearer " + v154["apiKey"] } },
      TEST_TIMEOUT_MS,
    );
  return request(
    buildGrsaiApiKeyCreditsProbeUrl(v154["apiUrl"]),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + v154["apiKey"],
      },
      body: JSON["stringify"]({ apikey: v154["apiKey"] }),
    },
    TEST_TIMEOUT_MS,
  );
}
async function grsaiBalanceProbe(v155) {
  const v156 = [
    { id: "account", source: "account", detail: "grsai-account-credits" },
    { id: "common", source: "account", detail: "grsai-common-credits" },
    { id: "apiKey", source: "apiKey", detail: "grsai-api-key-credits" },
  ];
  let v157 = null,
    v158 = null;
  for (const v159 of v156) {
    const v160 = await grsaiCreditsRequest(v159, v155);
    v158 = v160;
    if (!isSuccessfulProbe(v160)) continue;
    const v161 = normalizeGrsaiBalancePayload(v160["data"], {
      source: v159["source"],
    });
    if (!v161) continue;
    if (v161["credits"] > 0)
      return {
        step: makeStep(
          "balance",
          true,
          v161["detailText"] || "GRSAI 积分已读取",
          v159["detail"],
        ),
        balance: v161,
      };
    if (!v157) v157 = { balance: v161, detail: v159["detail"] };
  }
  if (v157)
    return {
      step: makeStep(
        "balance",
        true,
        v157["balance"]["detailText"] || "GRSAI\x20积分已读取",
        v157["detail"],
      ),
      balance: v157["balance"],
    };
  return {
    step: makeStep(
      "balance",
      true,
      "积分暂未返回，连接测试继续",
      summarizeFailure(v158, "GRSAI 积分接口未返回可识别数据"),
      { skipped: true },
    ),
    balance: null,
  };
}
async function runningHubAccountStatusProbe(v162, v163) {
  const v164 = String(v163 || "")["trim"]();
  if (!v164) return null;
  const v165 = buildRunningHubAccountStatusProbeUrl(v162["apiUrl"]),
    v166 = await post(
      "/api/v2/proxy/image",
      { apiUrl: v165, apiKey: v164, apikey: v164 },
      TEST_TIMEOUT_MS,
    );
  return isSuccessfulProbe(v166) ? v166["data"] : null;
}
async function runningHubBalanceProbe(v167) {
  const [v168, v169] = await Promise["all"]([
      runningHubAccountStatusProbe(v167, v167["apiKey"]),
      runningHubAccountStatusProbe(v167, v167["modelApiKey"]),
    ]),
    v170 = normalizeRunningHubBalancePayload({ workflow: v168, model: v169 });
  if (v170)
    return {
      step: makeStep(
        "balance",
        true,
        v170["detailText"] || "RunningHUB 账户信息已读取",
        "runninghub-account-status",
      ),
      balance: v170,
    };
  return {
    step: makeStep(
      "balance",
      true,
      "账户信息暂未返回，连接测试继续",
      "RunningHUB 账户信息接口未返回可识别数据",
      { skipped: true },
    ),
    balance: null,
  };
}
function createTinyPngBlob() {
  const v171 =
      typeof atob === "function"
        ? atob(ONE_PIXEL_PNG_BASE64)
        : Buffer["from"](ONE_PIXEL_PNG_BASE64, "base64")["toString"]("binary"),
    v172 = new Uint8Array(v171["length"]);
  for (let v173 = 0; v173 < v171["length"]; v173++) {
    v172[v173] = v171["charCodeAt"](v173);
  }
  return new Blob([v172], { type: "image/png" });
}
async function grsaiUploadProbe(v174, v175) {
  const v176 = await request(
    "https://grsai.dakka.com.cn/client/resource/newUploadTokenZH",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(v175 ? { Authorization: "Bearer " + v175 } : {}),
      },
      body: JSON["stringify"]({ sux: "png" }),
    },
    TEST_UPLOAD_TIMEOUT_MS,
  );
  if (!isSuccessfulProbe(v176) || !v176["data"]?.["data"]) {
    const v177 = classifyProbeFailure(v176, "upload_failed");
    return makeStep(
      "upload",
      false,
      humanizeCategory(
        v177 === "provider_error" ? "upload_failed" : v177,
        v174,
      ),
      summarizeFailure(v176, "GRSAI 上传凭证获取失败"),
      { category: v177 === "provider_error" ? "upload_failed" : v177 },
    );
  }
  const { token: v178, key: v179, url: v180 } = v176["data"]["data"];
  if (!v178 || !v179 || !v180)
    return makeStep(
      "upload",
      false,
      "GRSAI 上传凭证返回不完整。",
      stringifyProbePayload(v176["data"]),
      { category: "upload_failed" },
    );
  const v181 = new FormData();
  (v181["append"]("token", v178),
    v181["append"]("key", v179),
    v181["append"]("file", createTinyPngBlob(), "aic-connection-test.png"));
  const v182 = await request(
    v180,
    { method: "POST", body: v181 },
    TEST_UPLOAD_TIMEOUT_MS,
  );
  if (isSuccessfulProbe(v182))
    return makeStep("upload", true, "上传链路可用", "qiniu");
  const v183 = classifyProbeFailure(v182, "upload_failed");
  return makeStep(
    "upload",
    false,
    humanizeCategory(v183 === "provider_error" ? "upload_failed" : v183, v174),
    summarizeFailure(v182, "GRSAI 上传失败"),
    { category: v183 === "provider_error" ? "upload_failed" : v183 },
  );
}
async function apimartUploadProbe(v184, v185) {
  const v186 = new FormData();
  (v186["append"]("file", createTinyPngBlob(), "aic-connection-test.png"),
    v186["append"]("contentType", "image/png"),
    v186["append"]("fileExtension", "png"),
    v186["append"]("permanent", "0"),
    v186["append"]("apiKey", v185["apiKey"]),
    v186["append"]("apiUrl", normalizeApimartBaseUrl(v185["apiUrl"])));
  const v187 = await post(
    "/api/v2/proxy/apimart-upload",
    v186,
    TEST_UPLOAD_TIMEOUT_MS,
  );
  if (
    isSuccessfulProbe(v187) &&
    (v187["data"]?.["cdnUrl"] || v187["data"]?.["url"])
  )
    return makeStep("upload", true, "上传链路可用", "apimart-upload");
  const v188 = classifyProbeFailure(v187, "upload_failed");
  return makeStep(
    "upload",
    false,
    humanizeCategory(v188 === "provider_error" ? "upload_failed" : v188, v184),
    summarizeFailure(v187, "APIMart 上传失败"),
    { category: v188 === "provider_error" ? "upload_failed" : v188 },
  );
}
async function runningHubUploadProbe(v189, v190) {
  if (!v190)
    return makeStep(
      "upload",
      true,
      "未填写模型 API Key，跳过模型上传链路",
      "no model api key",
      { skipped: true },
    );
  const v191 = "https://www.runninghub.cn/openapi/v2/media/upload/binary",
    v192 = new FormData();
  v192["append"]("file", createTinyPngBlob(), "aic-connection-test.png");
  const v193 = await request(
    "/api/v2/proxy/upload?apiUrl=" + encodeURIComponent(v191),
    {
      method: "POST",
      headers: { Authorization: "Bearer\x20" + v190 },
      body: v192,
    },
    TEST_UPLOAD_TIMEOUT_MS,
  );
  if (isSuccessfulProbe(v193) && v193["data"]?.["data"]?.["download_url"])
    return makeStep("upload", true, "上传链路可用", "runninghub-upload");
  const v194 = classifyProbeFailure(v193, "upload_failed");
  return makeStep(
    "upload",
    false,
    humanizeCategory(v194 === "provider_error" ? "upload_failed" : v194, v189),
    summarizeFailure(v193, "RunningHUB 上传失败"),
    { category: v194 === "provider_error" ? "upload_failed" : v194 },
  );
}
async function uploadProbe(v195, v196) {
  if (v195 === "grsai") return grsaiUploadProbe(v195, v196["apiKey"]);
  if (v195 === "apimart") return apimartUploadProbe(v195, v196);
  if (v195 === "runninghub")
    return runningHubUploadProbe(v195, v196["modelApiKey"]);
  return makeStep(
    "upload",
    true,
    SKIPPED_UPLOAD_PROVIDERS[v195] || "当前厂商无需独立上传检测",
    "skipped",
    { skipped: true },
  );
}
async function openAiLikeProviderProbe(v197, v198) {
  const v199 = providerConfigWithDefaults(v197, v198),
    v200 = [];
  let v201 = null,
    v202 = false;
  if (!v199["apiKey"])
    return (
      v200["push"](
        makeStep("config", false, "API Key 未填写", "", {
          category: "missing_key",
        }),
      ),
      finishProviderResult(v197, v200)
    );
  if (!v199["apiUrl"])
    return (
      v200["push"](
        makeStep("config", false, "接口地址未配置", "", {
          category: "missing_url",
        }),
      ),
      finishProviderResult(v197, v200)
    );
  v200["push"](makeStep("config", true, "接口地址和 API Key 已填写"));
  const v203 =
    v197 === "grsai" ? "" : buildModelsProbeUrl(v197, v199["apiUrl"]);
  if (v203) {
    const v204 = await getModelsProbe(v197, v203, v199["apiKey"]);
    if (v204["ok"]) (v200["push"](v204), (v202 = true));
    else {
      if (v204["authFailed"] || !COMPLETION_FALLBACKS[v197]?.["model"])
        return (v200["push"](v204), finishProviderResult(v197, v200));
      else
        v200["push"](
          makeStep(
            "auth",
            true,
            "模型列表不可用，已改用轻量模型调用继续检测",
            v204["detail"],
            { skipped: true },
          ),
        );
    }
  }
  v197 === "apimart" && v202
    ? v200["push"](
        makeStep(
          "model",
          true,
          "模型列表可访问，未执行额外模型调用",
          "models",
          { skipped: true },
        ),
      )
    : v200["push"](
        await completionFallbackProbe(v197, v199["apiUrl"], v199["apiKey"]),
      );
  if (v200["some"]((v205) => !v205["ok"] && !v205["skipped"]))
    return finishProviderResult(v197, v200);
  if (v197 === "apimart") {
    const v206 = await apimartBalanceProbe(v197, v199);
    (v200["push"](v206["step"]), (v201 = v206["balance"]));
  } else {
    if (v197 === "grsai") {
      const v207 = await grsaiBalanceProbe(v199);
      (v200["push"](v207["step"]), (v201 = v207["balance"]));
    }
  }
  v200["push"](await uploadProbe(v197, v199));
  const v208 = finishProviderResult(v197, v200);
  return v201 ? { ...v208, balance: v201 } : v208;
}
function runningHubProbePassed(v209 = {}) {
  if (isAuthFailure(v209)) return false;
  if (v209["success"]) return true;
  const v210 = Number(v209["status"] || 0);
  return v210 >= 400 && v210 < 500;
}
async function runningHubWorkflowProbe(v211) {
  const v212 = await post(
    "/api/v2/runninghubwf/query",
    { apiKey: v211, taskId: "aic-connection-test" },
    TEST_TIMEOUT_MS,
  );
  return runningHubProbePassed(v212)
    ? makeStep("auth", true, "工作流 API Key 可用", "workflow")
    : makeStep(
        "auth",
        false,
        humanizeCategory(classifyProbeFailure(v212), "runninghub"),
        summarizeFailure(v212, "工作流\x20API\x20Key\x20测试未通过"),
        { category: classifyProbeFailure(v212) },
      );
}
async function runningHubModelProbe(v213) {
  const v214 = await post(
    "/api/v2/proxy/image",
    {
      apiUrl: "https://www.runninghub.cn/openapi/v2/query",
      apiKey: v213,
      taskId: "aic-connection-test",
    },
    TEST_TIMEOUT_MS,
  );
  return runningHubProbePassed(v214)
    ? makeStep("model", true, "模型 API Key 可用", "model-api")
    : makeStep(
        "model",
        false,
        humanizeCategory(
          classifyProbeFailure(v214, "model_unavailable"),
          "runninghub",
        ),
        summarizeFailure(v214, "模型 API Key 测试未通过"),
        { category: classifyProbeFailure(v214, "model_unavailable") },
      );
}
async function runningHubProviderProbe(v215) {
  const v216 = providerConfigWithDefaults("runninghub", v215),
    v217 = [],
    v218 = [];
  let v219 = null;
  if (v216["apiKey"]) v217["push"](runningHubWorkflowProbe(v216["apiKey"]));
  if (v216["modelApiKey"])
    v217["push"](runningHubModelProbe(v216["modelApiKey"]));
  if (v217["length"] === 0)
    return (
      v218["push"](
        makeStep("config", false, "API Key 未填写", "", {
          category: "missing_key",
        }),
      ),
      finishProviderResult("runninghub", v218)
    );
  v218["push"](makeStep("config", true, "已填写至少一个 RunningHUB API Key"));
  const v220 = await Promise["all"](v217);
  v218["push"](...v220);
  const v221 = await runningHubBalanceProbe(v216);
  (v218["push"](v221["step"]), (v219 = v221["balance"]));
  !v218["some"]((v222) => !v222["ok"] && !v222["skipped"]) &&
    v218["push"](await uploadProbe("runninghub", v216));
  const v223 = finishProviderResult("runninghub", v218);
  return v219 ? { ...v223, balance: v219 } : v223;
}
async function volcengineProviderProbe(v224) {
  const v225 = providerConfigWithDefaults("volcengine", v224),
    v226 = [];
  if (!v225["apiKey"])
    return (
      v226["push"](
        makeStep("config", false, "API Key 未填写", "", {
          category: "missing_key",
        }),
      ),
      finishProviderResult("volcengine", v226)
    );
  if (!v225["apiUrl"])
    return (
      v226["push"](
        makeStep("config", false, "接口地址未配置", "", {
          category: "missing_url",
        }),
      ),
      finishProviderResult("volcengine", v226)
    );
  v226["push"](makeStep("config", true, "接口地址和 API Key 已填写"));
  const v227 = buildVolcenginePingProbeUrl(v225["apiUrl"]);
  if (!v227)
    return (
      v226["push"](
        makeStep("auth", false, "接口地址不兼容", v225["apiUrl"], {
          category: "bad_base_url",
        }),
      ),
      finishProviderResult("volcengine", v226)
    );
  const v228 = await request(
    "/api/v2/proxy/task?apiUrl=" + encodeURIComponent(v227),
    { method: "GET", headers: { Authorization: "Bearer " + v225["apiKey"] } },
    TEST_TIMEOUT_MS,
  );
  if (isSuccessfulProbe(v228))
    return (
      v226["push"](
        makeStep("auth", true, "方舟 API Key 可用，服务可访问", "ping"),
      ),
      v226["push"](await uploadProbe("volcengine", v225)),
      finishProviderResult("volcengine", v226)
    );
  const v229 = classifyProbeFailure(v228);
  return (
    v226["push"](
      makeStep(
        "auth",
        false,
        humanizeCategory(v229, "volcengine"),
        summarizeFailure(v228, "火山方舟 ping 测试未通过"),
        { category: v229 },
      ),
    ),
    finishProviderResult("volcengine", v226)
  );
}
export async function testProviderConnection(v230, v231 = {}) {
  const v232 = normalizeProviderId(v230);
  if (!DEFAULT_PROVIDER_TEST_IDS["includes"](v232))
    return fail(v232 || "unknown", "暂不支持该厂商的连接测试");
  if (v232 === "runninghub") return runningHubProviderProbe(v231);
  if (v232 === "volcengine") return volcengineProviderProbe(v231);
  return openAiLikeProviderProbe(v232, v231);
}
export async function testProviderConnections(
  v233 = {},
  v234 = DEFAULT_PROVIDER_TEST_IDS,
) {
  const v235 = isPlainObject(v233?.["providers"]) ? v233["providers"] : {},
    v236 = await Promise["all"](
      v234["map"](async (v237) => {
        const v238 = normalizeProviderId(v237),
          v239 = await testProviderConnection(v238, v235[v238] || {});
        return [v238, v239];
      }),
    );
  return Object["fromEntries"](v236);
}
