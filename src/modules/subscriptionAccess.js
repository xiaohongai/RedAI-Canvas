import {
  fetchUserSettingsFromServer,
  saveUserSettingsToServer,
} from "../../api/userSettingsApi.js";
import {
  fetchSubscriptionStatus,
  activateCdkey,
  clearSubscriptionAuthorization as clearSubscriptionAuthorizationImpl,
} from "../../api/subscriptionApi.js";
const subscriptionGateManifest = {
  schemaVersion: "1.0",
  gates: [
    {
      key: "runninghubVideoV54",
      modelId: "runninghub/2041741496667348994",
      workflowId: "2041741496667348994",
      displayName: "视频编辑V5.4",
      aliases: ["video_edit_v54", "video_edit.pro"],
      legacyAliases: [
        {
          value: "2041741496667348994",
          deleteWhen:
            "Remove after subscriptionAccess tests, backend subscription gate tests, entitlement payloads, and saved projects all stop accepting bare RunningHub workflow IDs for this gate.",
        },
      ],
    },
    {
      key: "runninghubVideoHd",
      modelId: "runninghub/2047787809091620866",
      workflowId: "2047787809091620866",
      displayName: "视频高清",
      aliases: ["video_hd_vip", "video_hd.pro", "ai-app/2047787809091620866"],
      legacyAliases: [
        {
          value: "2047787809091620866",
          deleteWhen:
            "Remove\x20after\x20subscriptionAccess\x20tests,\x20backend\x20subscription\x20gate\x20tests,\x20entitlement\x20payloads,\x20and\x20saved\x20projects\x20all\x20stop\x20accepting\x20bare\x20RunningHub\x20workflow\x20IDs\x20for\x20this\x20gate.",
        },
      ],
    },
    {
      key: "runninghubCommercialDigitalHuman",
      modelId: "runninghub/2055639633148563458",
      workflowId: "2055639633148563458",
      displayName: "商业级数字人",
      aliases: [
        "commercial_digital_human",
        "commercial_digital_human.pro",
        "ai-app/2055639633148563458",
      ],
    },
    {
      key: "runninghubAdvancedVoiceClone",
      modelId: "runninghub/2050165249344585729",
      workflowId: "2050165249344585729",
      displayName: "进阶声音克隆",
      aliases: [
        "advanced_voice_clone",
        "voice_clone.pro",
        "ai-app/2050165249344585729",
      ],
      legacyAliases: [
        {
          value: "2050165249344585729",
          deleteWhen:
            "Remove\x20after\x20subscriptionAccess\x20tests,\x20backend\x20subscription\x20gate\x20tests,\x20entitlement\x20payloads,\x20and\x20saved\x20projects\x20all\x20stop\x20accepting\x20bare\x20RunningHub\x20workflow\x20IDs\x20for\x20this\x20gate.",
        },
      ],
    },
    {
      key: "dreaminaVideoVip",
      modelId: "dreamina/video_vip",
      workflowId: "",
      displayName: "即梦视频",
      aliases: ["dreamina_video_vip", "dreamina.video_vip"],
      providers: ["dreamina"],
      modelPrefixes: ["dreamina/"],
    },
  ],
};
function freezeSubscriptionGateLegacyAlias(v0, v1) {
  const v2 = v0 && typeof v0 === "object" ? v0 : {},
    v3 = String(v2["value"] || "")["trim"](),
    v4 = String(v2["deleteWhen"] || "")["trim"]();
  if (!v3 || !v4)
    throw new Error(
      "Invalid subscription gate legacy alias: " + (v1 || "unknown"),
    );
  return Object["freeze"]({ value: v3, deleteWhen: v4 });
}
function freezeSubscriptionGateEntry(v5) {
  const v6 = v5 && typeof v5 === "object" ? v5 : {},
    v7 = String(v6["key"] || "")["trim"]();
  return Object["freeze"]({
    key: v7,
    modelId: String(v6["modelId"] || "")["trim"](),
    workflowId: String(v6["workflowId"] || "")["trim"](),
    displayName: String(v6["displayName"] || "")["trim"](),
    aliases: Object["freeze"](
      Array["isArray"](v6["aliases"])
        ? v6["aliases"]
            ["map"]((v8) => String(v8 || "")["trim"]())
            ["filter"](Boolean)
        : [],
    ),
    legacyAliases: Object["freeze"](
      Array["isArray"](v6["legacyAliases"])
        ? v6["legacyAliases"]["map"]((v9) =>
            freezeSubscriptionGateLegacyAlias(v9, v7),
          )
        : [],
    ),
    providers: Object["freeze"](
      Array["isArray"](v6["providers"])
        ? v6["providers"]
            ["map"]((v10) =>
              String(v10 || "")
                ["trim"]()
                ["toLowerCase"](),
            )
            ["filter"](Boolean)
        : [],
    ),
    modelPrefixes: Object["freeze"](
      Array["isArray"](v6["modelPrefixes"])
        ? v6["modelPrefixes"]
            ["map"]((v11) => String(v11 || "")["trim"]())
            ["filter"](Boolean)
        : [],
    ),
  });
}
function requireSubscriptionGateEntries() {
  const v12 = String(subscriptionGateManifest?.["schemaVersion"] || "")[
      "trim"
    ](),
    v13 = subscriptionGateManifest?.["gates"];
  if (v12 !== "1.0" || !Array["isArray"](v13))
    throw new Error("Invalid subscription gate manifest");
  const v14 = v13["map"]((v15) => freezeSubscriptionGateEntry(v15));
  if (v14["some"]((v16) => !v16["modelId"]))
    throw new Error(
      "Invalid subscription gate manifest entry: missing modelId",
    );
  return Object["freeze"](v14);
}
export const SUBSCRIPTION_GATE_MANIFESTS = requireSubscriptionGateEntries();
const SUBSCRIPTION_GATE_CANONICAL_EXCLUDES = new Set(
    Array["isArray"](subscriptionGateManifest?.["canonicalExcludes"])
      ? subscriptionGateManifest["canonicalExcludes"]
          ["map"]((v17) => String(v17 || "")["trim"]())
          ["filter"](Boolean)
      : [],
  ),
  SUBSCRIPTION_GATE_BY_KEY = Object["freeze"](
    Object["fromEntries"](
      SUBSCRIPTION_GATE_MANIFESTS["filter"]((v18) => v18["key"])["map"](
        (v19) => [v19["key"], v19],
      ),
    ),
  );
function requireSubscriptionGateModelId(v20) {
  const v21 = SUBSCRIPTION_GATE_BY_KEY[v20];
  if (!v21?.["modelId"])
    throw new Error("Missing subscription gate manifest entry: " + v20);
  return v21["modelId"];
}
function getSubscriptionGateAlias(v22, v23) {
  const v24 = String(v23 || "")["trim"]();
  if (!v24) return "";
  return (
    getSubscriptionGateAliasValues(v22)["find"]((v25) =>
      v25["startsWith"](v24),
    ) || ""
  );
}
function getSubscriptionGateAliasValues(v26) {
  return [
    ...(Array["isArray"](v26?.["aliases"]) ? v26["aliases"] : []),
    ...(Array["isArray"](v26?.["legacyAliases"])
      ? v26["legacyAliases"]["map"]((v27) => v27["value"])
      : []),
  ]
    ["map"]((v28) => String(v28 || "")["trim"]())
    ["filter"](Boolean);
}
export const DEFAULT_VIP_GATE_MODEL_ID =
  requireSubscriptionGateModelId("runninghubVideoV54");
export const V54_VIP_MODEL_ID = DEFAULT_VIP_GATE_MODEL_ID;
export const RH_VIDEO_HD_VIP_MODEL_ID =
  requireSubscriptionGateModelId("runninghubVideoHd");
export const RH_VIDEO_HD_VIP_AI_APP_MODEL_ID = getSubscriptionGateAlias(
  SUBSCRIPTION_GATE_BY_KEY["runninghubVideoHd"],
  "ai-app/",
);
export const RH_ADVANCED_VOICE_CLONE_VIP_MODEL_ID =
  requireSubscriptionGateModelId("runninghubAdvancedVoiceClone");
export const RH_ADVANCED_VOICE_CLONE_VIP_AI_APP_MODEL_ID =
  getSubscriptionGateAlias(
    SUBSCRIPTION_GATE_BY_KEY["runninghubAdvancedVoiceClone"],
    "ai-app/",
  );
export const DREAMINA_VIDEO_VIP_MODEL_ID =
  requireSubscriptionGateModelId("dreaminaVideoVip");
export const VIDEO_VIP_MODEL_IDS = Array["from"](
  new Set(SUBSCRIPTION_GATE_MANIFESTS["map"]((v29) => v29["modelId"])),
);
const SUBSCRIPTION_CONTACT_TEXT_FALLBACK = "联系管理员获取授权码",
  VIDEO_VIP_MODEL_ID_SET = new Set(VIDEO_VIP_MODEL_IDS),
  VIP_MODEL_ID_CANONICAL_ALIASES = Object["freeze"](
    Object["fromEntries"](
      SUBSCRIPTION_GATE_MANIFESTS["flatMap"]((v30) => [
        [v30["modelId"], v30["modelId"]],
        ...getSubscriptionGateAliasValues(v30)["map"]((v31) => [
          v31,
          v30["modelId"],
        ]),
        ...(v30["workflowId"]
          ? [["runninghub/" + v30["workflowId"], v30["modelId"]]]
          : []),
      ])["filter"](([v32, v33]) => v32 && v33),
    ),
  ),
  VIP_MODEL_PROVIDER_RULES = SUBSCRIPTION_GATE_MANIFESTS["flatMap"]((v34) =>
    v34["providers"]["map"]((v35) => [v35, v34["modelId"]]),
  ),
  VIP_MODEL_PREFIX_RULES = SUBSCRIPTION_GATE_MANIFESTS["flatMap"]((v36) =>
    v36["modelPrefixes"]["map"]((v37) => [v37, v36["modelId"]]),
  ),
  VIP_MODEL_ID_CANONICAL_EXCLUDES = SUBSCRIPTION_GATE_CANONICAL_EXCLUDES,
  VIP_MODEL_DISPLAY_NAMES = Object["freeze"](
    Object["fromEntries"](
      SUBSCRIPTION_GATE_MANIFESTS["map"]((v38) => [
        v38["modelId"],
        v38["displayName"] || v38["modelId"],
      ]),
    ),
  ),
  VIP_MODEL_KEY_ALIAS_MAP = Object["freeze"](
    Object["fromEntries"](
      SUBSCRIPTION_GATE_MANIFESTS["map"]((v39) => [
        v39["modelId"],
        Object["freeze"]([
          v39["modelId"],
          ...getSubscriptionGateAliasValues(v39),
        ]),
      ]),
    ),
  ),
  normalizeVipModelId = (v40) => {
    const v41 = String(v40 || "")["trim"]();
    if (!v41) return "";
    if (VIP_MODEL_ID_CANONICAL_EXCLUDES["has"](v41)) return v41;
    const v42 = VIP_MODEL_ID_CANONICAL_ALIASES[v41];
    if (v42) return v42;
    const v43 = VIP_MODEL_PREFIX_RULES["find"](([v44]) =>
      v41["startsWith"](v44),
    );
    if (v43) return v43[1];
    return v41;
  },
  INSTALL_ID_KEY = "aic-install-id",
  DEVICE_ID_KEY = "aic-device-id",
  V54_LOCAL_UNLOCK_KEY = "aic-v54-vip-unlocked",
  SUBSCRIPTION_CONTACT_IMAGE_URL_FALLBACK =
    "https://api.ashuoai.com/static/contact/wechat.png",
  SUBSCRIPTION_CONTACT_WECHAT_FALLBACK = "yumengashuo";
let _fetchSubscriptionStatusImpl = fetchSubscriptionStatus,
  _activateCdkeyImpl = activateCdkey,
  _clearSubscriptionAuthorizationImpl = clearSubscriptionAuthorizationImpl;
export function createDefaultSubscriptionState() {
  return {
    loading: false,
    status: "none",
    expiresAt: null,
    entitledModelKeys: [],
    entitledModelIds: [],
    error: null,
    lastSyncAt: 0,
    contactText: SUBSCRIPTION_CONTACT_TEXT_FALLBACK,
    contactUrl: SUBSCRIPTION_CONTACT_IMAGE_URL_FALLBACK,
    contactWechat: SUBSCRIPTION_CONTACT_WECHAT_FALLBACK,
    deviceId: "",
  };
}
function _normalizeStatus(v45) {
  const v46 = String(v45 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v46 === "active") return "active";
  if (v46 === "expired") return "expired";
  return "none";
}
export function isActivationRequestAccepted(v47) {
  const v48 = v47 && typeof v47 === "object" ? v47 : {};
  return (
    v48?.["success"] === true ||
    Number(v48?.["code"]) === 0 ||
    String(v48?.["status"] || "")
      ["trim"]()
      ["toLowerCase"]() === "active"
  );
}
export function isActivationConfirmed(v49, v50) {
  return isActivationRequestAccepted(v49) && isSubscriptionActive(v50 || {});
}
function _toExpirySeconds(v51) {
  if (v51 == null || v51 === "") return null;
  const v52 = Number(v51);
  if (Number["isFinite"](v52) && v52 > 0)
    return v52 > 100000000000 ? Math["floor"](v52 / 1000) : Math["floor"](v52);
  const v53 = Date["parse"](String(v51));
  if (!Number["isFinite"](v53) || v53 <= 0) return null;
  return Math["floor"](v53 / 1000);
}
export function extractSubscriptionExpiresAt(v54) {
  const v55 = v54 && typeof v54 === "object" ? v54 : {},
    v56 = v55["data"] && typeof v55["data"] === "object" ? v55["data"] : v55,
    v57 =
      v56?.["expiresAt"] ??
      v56?.["expires_at"] ??
      v56?.["expireAt"] ??
      v56?.["expire_at"] ??
      v56?.["expiryAt"] ??
      v56?.["expiry_at"] ??
      v56?.["expiry"] ??
      v56?.["expiredAt"] ??
      v56?.["expired_at"] ??
      v56?.["endAt"] ??
      v56?.["end_at"] ??
      v56?.["validUntil"] ??
      v56?.["valid_until"] ??
      v56?.["deadlineAt"] ??
      v56?.["deadline_at"] ??
      v56?.["deadline"] ??
      null;
  return _toExpirySeconds(v57);
}
export function isSubscriptionActive(v58) {
  return _normalizeStatus(v58?.["status"]) === "active";
}
export function resolveVipGateModelId(v59, v60 = "") {
  const v61 = normalizeVipModelId(v59);
  if (VIP_MODEL_ID_CANONICAL_EXCLUDES["has"](v61)) return v61;
  if (VIDEO_VIP_MODEL_ID_SET["has"](v61)) return v61;
  const v62 = String(v60 || "")
      ["trim"]()
      ["toLowerCase"](),
    v63 = v62 ? VIP_MODEL_PROVIDER_RULES["find"](([v64]) => v64 === v62) : null;
  if (v63) return v63[1];
  return v61;
}
export function getVipModelDisplayName(v65, v66 = "") {
  const v67 = resolveVipGateModelId(v65, v66);
  return VIP_MODEL_DISPLAY_NAMES[v67] || v67 || "model";
}
export function isVipModel(v68, v69 = "") {
  if (VIP_MODEL_ID_CANONICAL_EXCLUDES["has"](String(v68 || "")["trim"]()))
    return false;
  const v70 = resolveVipGateModelId(v68, v69);
  if (VIP_MODEL_ID_CANONICAL_EXCLUDES["has"](v70)) return false;
  return VIDEO_VIP_MODEL_ID_SET["has"](v70);
}
function getVipModelKeyAliases(v71) {
  const v72 = normalizeVipModelId(v71);
  return Array["from"](new Set(VIP_MODEL_KEY_ALIAS_MAP[v72] || []));
}
export function setLocalVipUnlocked(v73) {
  try {
    v73
      ? globalThis["localStorage"]?.["setItem"](V54_LOCAL_UNLOCK_KEY, "1")
      : globalThis["localStorage"]?.["removeItem"](V54_LOCAL_UNLOCK_KEY);
  } catch {}
}
export function isModelAllowed(v74, v75, v76 = "") {
  const v77 = String(v74 || "")["trim"](),
    v78 = resolveVipGateModelId(v77, v76);
  if (!isVipModel(v78)) return true;
  if (!isSubscriptionActive(v75 || {})) return false;
  const v79 = v75 && typeof v75 === "object" ? v75 : {},
    v80 = Array["isArray"](v79["entitledModelIds"])
      ? v79["entitledModelIds"]
          ["map"]((v81) => normalizeVipModelId(v81))
          ["filter"](Boolean)
      : [];
  if (v80["length"] > 0) return v80["includes"](v78);
  const v82 = Array["isArray"](v79["entitledModelKeys"])
    ? v79["entitledModelKeys"]
        ["map"]((v83) =>
          String(v83 || "")
            ["trim"]()
            ["toLowerCase"](),
        )
        ["filter"](Boolean)
    : [];
  if (v82["length"] > 0) {
    const v84 = getVipModelKeyAliases(v78);
    if (v84["length"] === 0) return false;
    return v84["some"]((v85) => v82["includes"](String(v85)["toLowerCase"]()));
  }
  return true;
}
function _generateInstallId() {
  const v86 = Date["now"]() + "-" + Math["random"]();
  let v87 = 0;
  for (let v88 = 0; v88 < v86["length"]; v88 += 1) {
    v87 = (v87 * 31 + v86["charCodeAt"](v88)) >>> 0;
  }
  return "aic-" + Date["now"]()["toString"](36) + "-" + v87["toString"](36);
}
function _generateDeviceId() {
  return (
    "aicdev-" +
    Date["now"]()["toString"](36) +
    "-" +
    Math["random"]()["toString"](36)["slice"](2, 10)
  );
}
function _publishInstallId(v89) {
  const v90 = String(v89 || "")["trim"]();
  if (!v90) return "";
  try {
    window["__aicInstallId"] = v90;
  } catch {}
  try {
    globalThis["__aicInstallId"] = v90;
  } catch {}
  return v90;
}
function _publishDeviceId(v91) {
  const v92 = String(v91 || "")["trim"]();
  if (!v92) return "";
  try {
    window["__aicDeviceId"] = v92;
  } catch {}
  try {
    globalThis["__aicDeviceId"] = v92;
  } catch {}
  try {
    localStorage["setItem"](DEVICE_ID_KEY, v92);
  } catch {}
  return v92;
}
function _clearPublishedSubscriptionIdentity() {
  try {
    delete window["__aicInstallId"];
  } catch {}
  try {
    delete window["__aicDeviceId"];
  } catch {}
  try {
    delete globalThis["__aicInstallId"];
  } catch {}
  try {
    delete globalThis["__aicDeviceId"];
  } catch {}
}
function _clearLocalSubscriptionIdentity() {
  try {
    localStorage["removeItem"](INSTALL_ID_KEY);
  } catch {}
  try {
    localStorage["removeItem"](DEVICE_ID_KEY);
  } catch {}
  (setLocalVipUnlocked(false), _clearPublishedSubscriptionIdentity());
}
export async function ensureDeviceId(v93 = "") {
  const v94 = String(
    v93 ||
      globalThis["window"]?.["__aicInstallId"] ||
      globalThis["__aicInstallId"] ||
      "",
  )["trim"]();
  try {
    const v95 = await globalThis["window"]?.["aiCanvasDesktop"]?.[
        "getDeviceId"
      ]?.({ installId: v94 }),
      v96 = String(v95 || "")["trim"]();
    if (v96) return _publishDeviceId(v96);
  } catch {}
  try {
    const v97 = String(localStorage["getItem"](DEVICE_ID_KEY) || "")["trim"]();
    if (v97) return _publishDeviceId(v97);
  } catch {}
  const v98 = v94 || _generateDeviceId();
  return _publishDeviceId(v98);
}
export async function ensureInstallId() {
  try {
    const v99 = String(localStorage["getItem"](INSTALL_ID_KEY) || "")["trim"]();
    if (v99) return (_publishInstallId(v99), await ensureDeviceId(v99), v99);
  } catch {}
  let v100 = {};
  try {
    v100 = (await fetchUserSettingsFromServer()) || {};
  } catch {
    v100 = {};
  }
  const v101 = String(v100["installId"] || "")["trim"]();
  if (v101) {
    try {
      localStorage["setItem"](INSTALL_ID_KEY, v101);
    } catch {}
    return (_publishInstallId(v101), await ensureDeviceId(v101), v101);
  }
  const v102 = _generateInstallId();
  try {
    localStorage["setItem"](INSTALL_ID_KEY, v102);
  } catch {}
  try {
    await saveUserSettingsToServer({ ...v100, installId: v102 });
  } catch {}
  return (_publishInstallId(v102), await ensureDeviceId(v102), v102);
}
export function normalizeSubscriptionPayload(v103) {
  const v104 = createDefaultSubscriptionState(),
    v105 = v103 && typeof v103 === "object" ? v103 : {},
    v106 =
      v105["data"] && typeof v105["data"] === "object" ? v105["data"] : v105,
    v107 = String(
      v106?.["status"] || v106?.["subscriptionStatus"] || v106?.["state"] || "",
    )
      ["trim"]()
      ["toLowerCase"](),
    v108 = _normalizeStatus(v107),
    v109 = extractSubscriptionExpiresAt(v106),
    v110 = Array["isArray"](v106?.["entitledModelIds"])
      ? v106["entitledModelIds"]
      : Array["isArray"](v106?.["entitled_model_ids"])
        ? v106["entitled_model_ids"]
        : Array["isArray"](v106?.["modelIds"])
          ? v106["modelIds"]
          : [],
    v111 = v110["map"]((v112) => normalizeVipModelId(v112))["filter"](Boolean),
    v113 = Array["isArray"](v106?.["entitledModelKeys"])
      ? v106["entitledModelKeys"]
      : Array["isArray"](v106?.["entitled_model_keys"])
        ? v106["entitled_model_keys"]
        : Array["isArray"](v106?.["modelKeys"])
          ? v106["modelKeys"]
          : [],
    v114 = v113["map"]((v115) => String(v115 || "")["trim"]())["filter"](
      Boolean,
    ),
    v116 =
      v106?.["contactText"] ?? v106?.["contact_text"] ?? v104["contactText"],
    v117 = v106?.["contactUrl"] ?? v106?.["contact_url"] ?? v104["contactUrl"],
    v118 =
      v106?.["contactWechat"] ??
      v106?.["contact_wechat"] ??
      v106?.["wechatId"] ??
      v106?.["wechat_id"] ??
      v106?.["wechat"] ??
      v104["contactWechat"],
    v119 = v106?.["deviceId"] ?? v106?.["device_id"] ?? v104["deviceId"];
  return {
    ...v104,
    status: v108,
    expiresAt: v109,
    entitledModelKeys: v114,
    entitledModelIds: v111,
    contactText: String(v116 || v104["contactText"]),
    contactUrl: String(v117 || v104["contactUrl"]),
    contactWechat: String(v118 || v104["contactWechat"]),
    deviceId: String(v119 || ""),
  };
}
export async function pullSubscriptionState(v120) {
  const v121 = await ensureDeviceId(v120),
    v122 = await _fetchSubscriptionStatusImpl(v120, v121),
    v123 = normalizeSubscriptionPayload(v122 || {});
  return (setLocalVipUnlocked(isSubscriptionActive(v123)), v123);
}
export async function submitCdkey(v124, v125) {
  const v126 = await ensureDeviceId(v124),
    v127 = await _activateCdkeyImpl({
      installId: v124,
      cdkey: v125,
      deviceId: v126,
    });
  return v127 && typeof v127 === "object" ? v127 : {};
}
export async function clearSubscriptionAuthorization() {
  const v128 = String(
      globalThis["window"]?.["__aicInstallId"] ||
        globalThis["__aicInstallId"] ||
        "",
    )["trim"](),
    v129 = String(
      globalThis["window"]?.["__aicDeviceId"] ||
        globalThis["__aicDeviceId"] ||
        "",
    )["trim"](),
    v130 = await _clearSubscriptionAuthorizationImpl({
      installId: v128,
      deviceId: v129,
    });
  return (
    _clearLocalSubscriptionIdentity(),
    v130 && typeof v130 === "object" ? v130 : {}
  );
}
export function __setSubscriptionApiForTest({
  fetchSubscriptionStatusImpl: v131,
  activateCdkeyImpl: v132,
  clearSubscriptionAuthorizationImpl: v133,
} = {}) {
  ((_fetchSubscriptionStatusImpl =
    typeof v131 === "function" ? v131 : fetchSubscriptionStatus),
    (_activateCdkeyImpl = typeof v132 === "function" ? v132 : activateCdkey),
    (_clearSubscriptionAuthorizationImpl =
      typeof v133 === "function" ? v133 : clearSubscriptionAuthorizationImpl));
}
