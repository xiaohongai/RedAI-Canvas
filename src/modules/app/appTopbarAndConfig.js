import { registerSidebarSubmenu } from "../sidebarSubmenuController.js";
import { openExternalLink } from "../../services/externalLinkService.js";
import {
  getDefaultNvidiaTextModelEntries,
  normalizeNvidiaTextModelConfigEntry,
  toNvidiaTextModelConfigEntries,
} from "../nvidiaTextModels.js";
import { PROVIDER_CONFIG_SAVED_EVENT } from "../../components/aigenText/apimartTextModelMenu.js";
const DREAMINA_LOGIN_PAGE_URL = "https://jimeng.jianying.com/";
function normalizeDreaminaManualUrlCandidate(v0) {
  const v1 = String(v0 || "")["trim"]();
  if (!v1) return "";
  const v2 = v1["replace"](/^[<（(【\["'“‘]+/, "")
    ["replace"](/[>）)】\]"'”’]+$/, "")
    ["replace"](/[，。；;、]+$/, "");
  return /^https?:\/\//["test"](v2) ? v2 : "";
}
export function extractDreaminaManualLinksFromOutputLines(v3) {
  const v4 = Array["isArray"](v3) ? v3 : [],
    v5 = [];
  let v6 = "";
  v4["forEach"]((v7) => {
    const v8 = String(v7 || "");
    if (!v6 && v8["includes"]("请在浏览器中打开以下链接")) v6 = "__PENDING__";
    else v6 === "__PENDING__" && (v6 = v8["trim"]());
    const v9 = v8["match"](/https?:\/\/[^\s]+/g);
    if (!v9) return;
    v9["forEach"]((v10) => {
      const v11 = normalizeDreaminaManualUrlCandidate(v10);
      if (v11 && !v5["includes"](v11)) v5["push"](v11);
    });
  });
  const v12 =
      v6 && v6 !== "__PENDING__" ? normalizeDreaminaManualUrlCandidate(v6) : "",
    v13 =
      v12 ||
      v5["find"]((v14) => v14["includes"]("/passport/web_login")) ||
      v5["find"]((v15) => v15["includes"]("/passport/web/web_login")) ||
      "",
    v16 =
      v5["find"]((v17) =>
        v17["includes"]("/dreamina/cli/v1/dreamina_cli_login"),
      ) || "",
    v18 = v16 || v5["find"]((v19) => v19 !== DREAMINA_LOGIN_PAGE_URL) || "";
  return {
    authorizeUrl: v16 || v13 || v18 || "",
    strictAuthorizeUrl: v13,
    callbackUrl: v16,
  };
}
export function getDreaminaWebLoginButtonText(v20) {
  const v21 = v20?.["runtime"] || {},
    v22 = !!v20?.["loggedIn"],
    v23 = !!v21?.["active"];
  if (v23) return "查看登录";
  return v22 ? "重新登录" : "登录";
}
export function getDreaminaQrLoginButtonText(v24) {
  const v25 = v24?.["runtime"] || {},
    v26 = !!v25?.["active"];
  if (v26) return "查看登录";
  return "登录";
}
export function getDreaminaStatusSessionKey(v27) {
  const v28 = v27?.["runtime"] || {},
    v29 = Number(v28?.["startedAt"] || 0);
  if (v29 > 0) return "login:" + v29;
  const v30 = Number(v28?.["qrVersion"] || 0);
  if (v30 > 0) return "qr:" + v30;
  return "";
}
export function shouldDreaminaManualGuideOpenByDefault(v31, v32 = "") {
  const v33 = v31?.["runtime"] || {},
    v34 = String(v33?.["loginMode"] || "");
  if (!v33?.["active"] || !["oauth", "web", "headless"]["includes"](v34))
    return false;
  const v35 = getDreaminaStatusSessionKey(v31);
  return !v35 || String(v32 || "") !== v35;
}
export function shouldAutoOpenDreaminaWebAuthLink(
  v36,
  v37 = {},
  v38 = Date["now"](),
) {
  const v39 = v36?.["runtime"] || {},
    v40 = String(v39?.["loginMode"] || ""),
    v41 = String(v39?.["authorizeUrl"] || "")["trim"](),
    v42 = String(v39?.["loginPageUrl"] || "")["trim"](),
    v43 = String(v39?.["phase"] || ""),
    v44 = !!v36?.["loggedIn"] || ["success", "reused", "done"]["includes"](v43),
    v45 = Number(v37?.["webLoginPrimedAt"] || 0),
    v46 = String(v37?.["autoOpenedManualAuthUrl"] || "")["trim"]();
  if (!["oauth", "web", "headless"]["includes"](v40) || !v39?.["active"] || v44)
    return false;
  if (!v41 || v41 === v42) return false;
  if (v46 === v41) return false;
  if (v45 <= 0) return false;
  return Math["max"](0, Number(v38 || 0) - v45) >= 2500;
}
export function createAppTopbarAndConfig({
  store: v47,
  fetchApiConfigFromServer: v48,
  saveApiConfigToServer: v49,
  testProviderConnections: v50,
  fetchDreaminaCliStatusFromServer: v51,
  startDreaminaHeadlessLoginFromServer: v52,
  startDreaminaHeadlessReloginFromServer: v53,
  startDreaminaWebLoginFromServer: v54,
  importDreaminaLoginResponseFromServer: v55,
  logoutDreaminaFromServer: v56,
  buildDreaminaQrImageUrl: v57,
  showError: v58,
} = {}) {
  const v59 = 85 * 1000,
    v60 = {
      pollTimer: null,
      lastToastKey: "",
      lastStatus: null,
      modalCloseTimer: null,
      currentSessionKey: "",
      dismissedSessionKey: "",
      qrImageLoadError: false,
      lastQrImageUrl: "",
      lastQrImageRequestedAt: 0,
      lastQrImageLoadedAt: 0,
      lastQrImageErrorAt: 0,
      lastQrImageErrorMessage: "",
      qrImageListenersBound: false,
      manualGuideOpen: false,
      webLoginPrimedAt: 0,
      autoOpenedManualAuthUrl: "",
    };
  let v61 = {};
  const v62 = [
      "grsai",
      "openai",
      "ppio",
      "apimart",
      "volcengine",
      "runninghub",
      "nvidia",
    ],
    v63 = [
      "settings-provider-status--testing",
      "settings-provider-status--success",
      "settings-provider-status--partial",
      "settings-provider-status--danger",
    ];
  let v64 = null,
    v65 = null;
  function v66() {
    const v67 = document["getElementById"]("projectNameText");
    v67 &&
      (v67["addEventListener"]("keydown", (v68) => {
        v68["key"] === "Enter" && (v68["preventDefault"](), v67["blur"]());
      }),
      v67["addEventListener"]("click", () => {
        v67["focus"]();
      }));
    const v69 = document["getElementById"]("userAvatar"),
      v70 = document["getElementById"]("avatarMenu");
    v69 &&
      v70 &&
      registerSidebarSubmenu({
        key: "settings",
        button: v69,
        panel: v70,
        openClass: "open",
        isOpen: () => v70["classList"]["contains"]("open"),
      });
  }
  function v71() {
    return {
      settingsCardEl: document["getElementById"]("dreaminaSettingsCard"),
      statusTextEl: document["getElementById"]("dreaminaStatusText"),
      messageTextEl: document["getElementById"]("dreaminaStatusMessage"),
      creditTextEl: document["getElementById"]("dreaminaCreditText"),
      btnAuthEl: document["getElementById"]("btnDreaminaAuth"),
      btnQrAuthEl: document["getElementById"]("btnDreaminaQrAuth"),
      btnLogoutEl: document["getElementById"]("btnDreaminaLogout"),
      modalOverlayEl: document["getElementById"]("dreaminaLoginModal"),
      modalCardEl: document["getElementById"]("dreaminaLoginModalCard"),
      modalCloseEl: document["getElementById"]("dreaminaModalClose"),
      modalMessageEl: document["getElementById"]("dreaminaModalMessage"),
      modalQrWrapEl: document["getElementById"]("dreaminaModalQrWrap"),
      modalQrImageEl: document["getElementById"]("dreaminaModalQrImage"),
      modalWaitEl: document["getElementById"]("dreaminaModalWait"),
      modalWaitTextEl: document["getElementById"]("dreaminaModalWaitText"),
      modalRetryEl: document["getElementById"]("dreaminaModalRetry"),
      manualGuideEl: document["getElementById"]("dreaminaManualGuide"),
      manualLoginUrlEl: document["getElementById"]("dreaminaManualLoginUrl"),
      manualAuthUrlEl: document["getElementById"]("dreaminaManualAuthUrl"),
      manualImportJsonEl: document["getElementById"](
        "dreaminaManualImportJson",
      ),
      manualOpenLoginEl: document["getElementById"]("dreaminaManualOpenLogin"),
      manualCopyLoginEl: document["getElementById"]("dreaminaManualCopyLogin"),
      manualOpenAuthEl: document["getElementById"]("dreaminaManualOpenAuth"),
      manualCopyAuthEl: document["getElementById"]("dreaminaManualCopyAuth"),
      manualImportJsonBtnEl: document["getElementById"](
        "dreaminaManualImportJsonBtn",
      ),
    };
  }
  function v72() {
    const { settingsCardEl: v73 } = v71();
    if (!v73) return false;
    const v74 = true;
    return (
      (v73["hidden"] = !v74),
      !v74 && (v75({ force: true, rememberDismissal: false }), v76()),
      v74
    );
  }
  function v76() {
    v60["pollTimer"] &&
      (clearInterval(v60["pollTimer"]), (v60["pollTimer"] = null));
  }
  function v77() {
    if (v60["pollTimer"]) return;
    v60["pollTimer"] = setInterval(() => {
      v78({ silent: true })["catch"](() => {});
    }, 800);
  }
  function v79() {
    ((v60["qrImageLoadError"] = false),
      (v60["lastQrImageUrl"] = ""),
      (v60["lastQrImageRequestedAt"] = 0),
      (v60["lastQrImageLoadedAt"] = 0),
      (v60["lastQrImageErrorAt"] = 0),
      (v60["lastQrImageErrorMessage"] = ""));
  }
  function v80(v81, v82 = Date["now"]()) {
    const v83 = String(v81 || "")["trim"]();
    if (!v83) return "";
    const v84 = v83["includes"]("?") ? "&" : "?";
    return "" + v83 + v84 + "cb=" + encodeURIComponent(String(v82));
  }
  function v85(v86, { withCacheBust: withCacheBust = false } = {}) {
    const v87 = Number(v86?.["qrVersion"] || 0),
      v88 = v57?.(v87 || Date["now"]()) || "";
    if (!v88) return "";
    return withCacheBust ? v80(v88) : v88;
  }
  function v89(v90) {
    const v91 = v90?.["runtime"] || {},
      v92 = String(v91?.["phase"] || ""),
      v93 = !!v91?.["qrAvailable"];
    return v92 === "qr_ready" && v93 && !!v60["qrImageLoadError"];
  }
  function v94(v95) {
    const v96 = v95?.["runtime"] || {};
    return Array["isArray"](v96?.["outputTail"]) ? v96["outputTail"] : [];
  }
  function v97(v98) {
    const v99 = v94(v98);
    return v99["some"]((v100) => {
      const v101 = String(v100 || "")["toLowerCase"]();
      return (
        v101["includes"]("自动打开浏览器失败") ||
        v101["includes"]("open headless login page") ||
        v101["includes"]("executable file not found") ||
        v101["includes"]("google-chrome")
      );
    });
  }
  function v102(v103) {
    const v104 = v103?.["runtime"] || {},
      v105 = extractDreaminaManualLinksFromOutputLines(v94(v103));
    return {
      ...v105,
      authorizeUrl:
        String(v104?.["authorizeUrl"] || "")["trim"]() || v105["authorizeUrl"],
      callbackUrl:
        String(v104?.["callbackUrl"] || "")["trim"]() || v105["callbackUrl"],
    };
  }
  function v106(v107) {
    const {
      manualLoginUrlEl: v108,
      manualOpenLoginEl: v109,
      manualCopyLoginEl: v110,
      manualAuthUrlEl: v111,
      manualOpenAuthEl: v112,
      manualCopyAuthEl: v113,
    } = v71();
    if (!v108 || !v109 || !v110 || !v111 || !v112 || !v113) return;
    const v114 = v102(v107 || v60["lastStatus"] || {}),
      v115 = (v107 || v60["lastStatus"] || {})?.["runtime"] || {},
      v116 = String(v115?.["userCode"] || "")["trim"]();
    ((v108["value"] = v116 || "等待验证码..."),
      (v109["hidden"] = true),
      (v109["disabled"] = true),
      (v110["disabled"] = !v116));
    const v117 = String(v114?.["authorizeUrl"] || "")["trim"]();
    ((v111["value"] = v117 || "等待授权链接..."),
      (v112["disabled"] = !v117),
      (v113["disabled"] = !v117));
  }
  function v118(v119) {
    const { manualGuideEl: v120 } = v71();
    if (!v120) return;
    (v106(v119 || v60["lastStatus"] || {}),
      (v120["hidden"] = !v60["manualGuideOpen"]));
  }
  function v121() {
    return String(v60["lastStatus"]?.["runtime"]?.["userCode"] || "")["trim"]();
  }
  function v122(v123 = v60["lastStatus"] || {}) {
    const v124 = v102(v123);
    return String(v124?.["authorizeUrl"] || "")["trim"]();
  }
  async function v125(v126, v127) {
    const v128 = String(v126 || "")["trim"]();
    if (!v128)
      return (
        window["showToast"]?.("未检测到" + v127 + "，请稍候后重试", "warning"),
        false
      );
    try {
      return (await openExternalLink(v128, { label: v127 }), true);
    } catch (v129) {}
    const v130 = await v131(v128);
    return (
      v130
        ? window["showToast"]?.("浏览器未能直接打开，已复制" + v127, "warning")
        : window["showToast"]?.(
            "浏览器未能直接打开，请先复制" + v127,
            "warning",
          ),
      false
    );
  }
  async function v132(v133, v134) {
    const v135 = String(v133 || "")["trim"]();
    if (!v135) {
      window["showToast"]?.("未检测到" + v134 + "，请稍候后重试", "warning");
      return;
    }
    const v136 = await v131(v135);
    v136
      ? window["showToast"]?.(v134 + "已复制", "success")
      : window["showToast"]?.(v134 + "复制失败，请手动选中文本复制", "error");
  }
  async function v137() {
    await v138();
  }
  async function v139() {
    await v132(v121(), "即梦验证码");
  }
  async function v138() {
    await v125(v122(), "即梦授权链接");
  }
  async function v140() {
    await v132(v122(), "即梦授权链接");
  }
  function v141(v142) {
    const v143 = String(v142 || "")["trim"]();
    if (!v143)
      throw new Error("请先粘贴第\x202\x20步最终跳转页面返回的完整\x20JSON");
    const v144 = [];
    v144["push"](v143);
    const v145 = v143["match"](/```(?:json)?\s*([\s\S]*?)```/i);
    v145?.[1] && v144["push"](String(v145[1])["trim"]());
    const v146 = v143["indexOf"]("{"),
      v147 = v143["lastIndexOf"]("}");
    v146 >= 0 &&
      v147 > v146 &&
      v144["push"](v143["slice"](v146, v147 + 1)["trim"]());
    for (const v148 of v144) {
      if (!v148) continue;
      try {
        const v149 = JSON["parse"](v148);
        if (!v149 || typeof v149 !== "object" || Array["isArray"](v149))
          throw new Error("INVALID_OBJECT");
        return v149;
      } catch (v150) {
        if (v150?.["message"] === "INVALID_OBJECT")
          throw new Error("JSON 必须是对象格式");
      }
    }
    throw new Error(
      "JSON 格式不正确，请粘贴第 2 步最终跳转页面返回的完整 JSON",
    );
  }
  async function v151() {
    if (typeof v55 !== "function") {
      window["showToast"]?.("当前版本不支持 JSON 导入，请升级后重试", "error");
      return;
    }
    const { manualImportJsonEl: v152 } = v71(),
      v153 = String(v152?.["value"] || "");
    let v154 = null;
    try {
      v154 = v141(v153);
    } catch (v155) {
      window["showToast"]?.(v155?.["message"] || "JSON\x20解析失败", "warning");
      return;
    }
    try {
      const v156 = await v55(v154);
      if (v156?.["success"] === false)
        throw new Error(v156?.["message"] || "导入登录态失败");
      (v156?.["status"]
        ? v157(v156["status"])
        : await v78({ force: true, silent: true }),
        v152 && (v152["value"] = ""),
        v77(),
        window["showToast"]?.("登录态已导入，正在同步状态", "success"));
    } catch (v158) {
      window["showToast"]?.(v158?.["message"] || "导入登录态失败", "error");
    }
  }
  function v159(v160, v161 = {}) {
    v60["qrImageLoadError"] = !!v160;
    if (v160) {
      ((v60["lastQrImageErrorAt"] = Date["now"]()),
        (v60["lastQrImageErrorMessage"] =
          String(v161?.["message"] || "")["trim"]() || "二维码图片加载失败"));
      return;
    }
    ((v60["lastQrImageLoadedAt"] = Date["now"]()),
      (v60["lastQrImageErrorAt"] = 0),
      (v60["lastQrImageErrorMessage"] = ""));
  }
  function v162(v163, v164, v165 = {}) {
    if (!v163) return false;
    const v166 = !!v165?.["withCacheBust"],
      v167 = v85(v164, { withCacheBust: v166 });
    if (!v167) return false;
    const v168 = String(v163["getAttribute"]("src") || "")["trim"]();
    if (!v166 && v168 === v167) return false;
    return (
      (v60["lastQrImageUrl"] = v167),
      (v60["lastQrImageRequestedAt"] = Date["now"]()),
      (v60["qrImageLoadError"] = false),
      (v60["lastQrImageErrorMessage"] = ""),
      (v163["src"] = v167),
      true
    );
  }
  function v169(v170) {
    if (!v170 || v60["qrImageListenersBound"]) return;
    (v170["addEventListener"]("load", () => {
      (v159(false), v60["lastStatus"] && v171(v60["lastStatus"]));
    }),
      v170["addEventListener"]("error", () => {
        (v159(true, { message: "二维码图片加载失败" }),
          v60["lastStatus"] && v171(v60["lastStatus"]));
      }),
      (v60["qrImageListenersBound"] = true));
  }
  function v172(v173) {
    const v174 = Number(v173?.["startedAt"] || 0);
    if (v174 <= 0) return 0;
    const v175 = Number(v173?.["completedAt"] || 0),
      v176 = v175 > 0 ? v175 : Date["now"]();
    return Math["max"](0, v176 - v174);
  }
  function v177(v178) {
    const v179 = v178?.["runtime"] || {};
    if (!v179?.["active"]) return false;
    const v180 = String(v179?.["phase"] || "");
    if (!["preparing", "starting"]["includes"](v180)) return false;
    return v172(v179) >= v59;
  }
  async function v131(v181) {
    const v182 = String(v181 || "");
    if (!v182) return false;
    try {
      if (navigator?.["clipboard"]?.["writeText"])
        return (await navigator["clipboard"]["writeText"](v182), true);
    } catch (v183) {}
    try {
      const v184 = document["createElement"]("textarea");
      ((v184["value"] = v182),
        v184["setAttribute"]("readonly", "readonly"),
        (v184["style"]["position"] = "fixed"),
        (v184["style"]["left"] = "-9999px"),
        document["body"]?.["appendChild"](v184),
        v184["select"]());
      const v185 = document["execCommand"]("copy");
      return (v184["remove"](), !!v185);
    } catch (v186) {
      return false;
    }
  }
  function v187(v188) {
    if (!v188 || typeof v188 !== "object") return "登录后显示余额";
    const v189 = Number(v188["total_credit"] || 0),
      v190 = Number(v188["vip_credit"] || 0),
      v191 = Number(v188["gift_credit"] || 0),
      v192 = Number(v188["purchase_credit"] || 0);
    return (
      "总额度 " +
      v189 +
      "（会员\x20" +
      v190 +
      " / 赠送 " +
      v191 +
      " / 购买 " +
      v192 +
      "）"
    );
  }
  function v193(v194) {
    const v195 = String(v194?.["phase"] || ""),
      v196 = Number(v194?.["completedAt"] || 0),
      v197 = v196 > 0 ? v195 + ":" + v196 + ":" + (v194?.["error"] || "") : "";
    if (!v197 || v197 === v60["lastToastKey"]) return;
    v60["lastToastKey"] = v197;
    if (v195 === "success") {
      window["showToast"]?.("即梦已登录成功", "success");
      return;
    }
    if (v195 === "reused") {
      window["showToast"]?.("当前即梦登录态仍然有效", "info");
      return;
    }
    v195 === "failed" &&
      window["showToast"]?.(v194?.["error"] || "即梦登录失败", "error");
  }
  function v198(v199) {
    const v200 = v199?.["runtime"] || {},
      v201 = !!v199?.["loggedIn"],
      v202 = !!v200?.["active"],
      v203 = String(v200?.["phase"] || "");
    if (v202 && v203 === "preparing") return "准备中";
    if (v202 && ["oauth_ready", "polling"]["includes"](v203)) return "等待授权";
    if (v202) return "登录中";
    if (v201) return "已登录";
    return "未登录";
  }
  function v204(v205) {
    return getDreaminaStatusSessionKey(v205);
  }
  function v206(v207) {
    const v208 = v204(v207),
      v209 = !!v207?.["runtime"]?.["active"];
    if (v208 && v208 !== v60["currentSessionKey"]) {
      ((v60["currentSessionKey"] = v208),
        (v60["dismissedSessionKey"] = ""),
        (v60["manualGuideOpen"] = false),
        (v60["webLoginPrimedAt"] = 0),
        (v60["autoOpenedManualAuthUrl"] = ""),
        v79());
      return;
    }
    !v209 &&
      !v208 &&
      ((v60["currentSessionKey"] = ""),
      (v60["dismissedSessionKey"] = ""),
      (v60["manualGuideOpen"] = false),
      (v60["webLoginPrimedAt"] = 0),
      (v60["autoOpenedManualAuthUrl"] = ""),
      v79());
  }
  function v210(v211) {
    if (!shouldAutoOpenDreaminaWebAuthLink(v211, v60)) return;
    const v212 = v122(v211);
    if (!v212) return;
    ((v60["autoOpenedManualAuthUrl"] = v212),
      v125(v212, "即梦授权链接")["catch"](() => {}));
  }
  function v213() {
    v60["modalCloseTimer"] &&
      (clearTimeout(v60["modalCloseTimer"]), (v60["modalCloseTimer"] = null));
  }
  function v214({ clearDismissed: clearDismissed = false } = {}) {
    const { modalOverlayEl: v215 } = v71();
    if (!v215) return;
    (v213(),
      clearDismissed && (v60["dismissedSessionKey"] = ""),
      (v215["hidden"] = false));
  }
  function v75({
    force: force = false,
    rememberDismissal: rememberDismissal = true,
  } = {}) {
    const {
      modalOverlayEl: v216,
      modalQrImageEl: v217,
      manualImportJsonEl: v218,
    } = v71();
    v213();
    if (rememberDismissal) {
      const v219 = v204(v60["lastStatus"]);
      v219 && (v60["dismissedSessionKey"] = v219);
    }
    if (v216) v216["hidden"] = true;
    if (v217) v217["removeAttribute"]("src");
    if (v218) v218["value"] = "";
    ((v60["manualGuideOpen"] = false), v118(v60["lastStatus"] || {}));
  }
  function v220(v221 = 0) {
    (v213(),
      (v60["modalCloseTimer"] = setTimeout(
        () => {
          v75({ force: true, rememberDismissal: false });
        },
        Math["max"](0, Number(v221) || 0),
      )));
  }
  function v222(v223) {
    const v224 = v223?.["runtime"] || {},
      v225 = String(v224?.["phase"] || ""),
      v226 = ["oauth", "web", "headless"]["includes"](
        String(v224?.["loginMode"] || ""),
      ),
      v227 = v177(v223),
      v228 = v89(v223),
      v229 = v97(v223);
    if (v229)
      return "检测到浏览器自动拉起失败，请在右侧打开授权链接，并输入验证码。";
    if (
      shouldDreaminaManualGuideOpenByDefault(v223, v60["dismissedSessionKey"])
    )
      return "请打开授权链接，在页面输入验证码；系统会自动同步登录状态。";
    if (v227) return "登录等待时间较长，请确认已在授权页面输入验证码。";
    if (v228) return "二维码登录已不再作为主流程，请使用右侧 OAuth 授权链接。";
    if (v225 === "failed") return "登录失败，请重新打开授权链接并输入验证码。";
    if (v225 === "oauth_ready" || v225 === "polling") {
      const v230 = String(v224?.["userCode"] || "")["trim"]();
      return v230
        ? "请在授权页面输入验证码：" + v230
        : "请在授权页面完成即梦登录确认。";
    }
    if (v225 === "qr_ready") return "请使用右侧 OAuth 授权链接完成登录。";
    if (v225 === "success" || v225 === "reused")
      return "登录完成，正在更新账户信息...";
    if (v226) return "正在等待即梦返回授权链接，请稍候。";
    return "正在准备即梦登录，请稍候...";
  }
  function v171(v231) {
    const {
      modalCardEl: v232,
      modalCloseEl: v233,
      modalMessageEl: v234,
      modalQrWrapEl: v235,
      modalQrImageEl: v236,
      modalWaitEl: v237,
      modalWaitTextEl: v238,
      modalRetryEl: v239,
      manualGuideEl: v240,
    } = v71();
    if (!v234) return;
    const v241 = v231?.["runtime"] || {},
      v242 = !!v241?.["active"],
      v243 = String(v241?.["phase"] || ""),
      v244 = !!v231?.["loggedIn"],
      v245 = ["oauth", "web", "headless"]["includes"](
        String(v241?.["loginMode"] || ""),
      ),
      v246 = v177(v231),
      v247 = !v245 && !!v241?.["qrAvailable"] && v243 === "qr_ready",
      v248 = v89(v231),
      v249 = v97(v231),
      v250 = v244 || ["success", "reused", "done"]["includes"](v243);
    v250 && (v60["manualGuideOpen"] = false);
    !v250 && v249 && (v60["manualGuideOpen"] = true);
    const v251 = v204(v231),
      v252 = shouldDreaminaManualGuideOpenByDefault(
        v231,
        v60["dismissedSessionKey"],
      );
    !v250 && v252 && (v60["manualGuideOpen"] = true);
    const v253 =
      v60["manualGuideOpen"] ||
      ((v242 || v247) && (!!v251 ? v60["dismissedSessionKey"] !== v251 : true));
    if (v253) v214();
    else
      ["success", "reused", "failed", "done"]["includes"](v243)
        ? v220(v243 === "failed" ? 0 : 600)
        : v75({ force: true, rememberDismissal: false });
    (v232 &&
      v232["classList"]["toggle"](
        "dreamina-login-modal--guide-open",
        !!v60["manualGuideOpen"],
      ),
      v234 &&
        (v234["textContent"] = v250
          ? "即梦已登录成功，正在同步账号状态..."
          : v249
            ? "自动打开浏览器失败，请在右侧打开授权链接，并输入验证码。"
            : v252
              ? "OAuth 登录已启动，请按右侧步骤完成授权。"
              : v246
                ? "登录流程耗时较长，请确认已在授权页面输入验证码。"
                : v248
                  ? "二维码显示异常，请改用右侧 OAuth 登录流程。"
                  : v243 === "failed"
                    ? "登录暂未完成，请重新打开授权链接。"
                    : v243 === "oauth_ready" || v243 === "polling"
                      ? "请打开即梦授权链接，并输入页面验证码"
                      : v247
                        ? "请使用抖音 App 扫描下方二维码"
                        : String(v241?.["message"] || "")["trim"]() ||
                          String(v231?.["message"] || "")["trim"]() ||
                          "正在处理即梦登录..."),
      v238 && (v238["textContent"] = v222(v231)),
      v237 && (v237["hidden"] = false),
      v235 && (v235["hidden"] = !v247),
      v236 && (v247 ? v162(v236, v241) : v236["removeAttribute"]("src")),
      v233 && (v233["disabled"] = false),
      v239 &&
        ((v239["hidden"] = false),
        (v239["disabled"] = false),
        v60["manualGuideOpen"]
          ? (v239["textContent"] = "收起登录引导")
          : (v239["textContent"] = v249 ? "登录引导（推荐）" : "登录引导")),
      v240 && v118(v231));
  }
  function v157(v254) {
    const {
      statusTextEl: v255,
      messageTextEl: v256,
      creditTextEl: v257,
      btnAuthEl: v258,
      btnQrAuthEl: v259,
      btnLogoutEl: v260,
    } = v71();
    if (!v255) return;
    if (!v72()) return;
    const v261 = v254?.["runtime"] || {},
      v262 = !!v254?.["loggedIn"],
      v263 = !!v261?.["active"],
      v264 = String(v261?.["phase"] || ""),
      v265 =
        String(v261?.["message"] || "")["trim"]() ||
        String(v254?.["message"] || "")["trim"]() ||
        "未登录，点击登录即可使用";
    v255["textContent"] = v198(v254);
    v256 && (v256["textContent"] = v265);
    v257 &&
      (v257["textContent"] = v262 ? v187(v254?.["credit"]) : "登录后显示余额");
    v258 &&
      ((v258["disabled"] = false),
      (v258["textContent"] = getDreaminaWebLoginButtonText(v254)));
    v259 &&
      ((v259["hidden"] = true),
      (v259["disabled"] = true),
      (v259["textContent"] = getDreaminaQrLoginButtonText(v254)));
    v260 && (v260["disabled"] = v263 || !v262);
    if (v263) v77();
    else v76();
    ((v60["lastStatus"] = v254),
      v206(v254),
      v171(v254),
      v210(v254),
      v193(v261));
  }
  async function v78({ force: force = false, silent: silent = false } = {}) {
    if (!v72()) return null;
    if (typeof v51 !== "function") return null;
    try {
      const v266 = await v51({ refresh: force });
      return (v157(v266 || {}), v266 || {});
    } catch (v267) {
      if (!silent) {
        const v268 = v267?.["message"] || "获取即梦状态失败";
        window["showToast"]?.(v268, "error");
      }
      return null;
    }
  }
  async function v269() {
    if (!v72()) return;
    const v270 = v60["lastStatus"]?.["runtime"] || {};
    if (v270?.["active"]) {
      (v214({ clearDismissed: true }),
        (v60["manualGuideOpen"] = true),
        v171(v60["lastStatus"] || {}));
      return;
    }
    const v271 = !!v60["lastStatus"]?.["loggedIn"];
    if (typeof v54 !== "function") return;
    ((v60["manualGuideOpen"] = true),
      (v60["webLoginPrimedAt"] = Date["now"]()),
      (v60["autoOpenedManualAuthUrl"] = ""),
      v214({ clearDismissed: true }));
    try {
      const v272 = await v54({ force: v271 });
      if (v272?.["success"] === false)
        throw new Error(v272?.["message"] || "即梦登录启动失败");
      ((v60["manualGuideOpen"] = true),
        v272?.["status"] && v157(v272["status"]),
        window["showToast"]?.(
          v271
            ? "即梦重新登录已启动，请完成 OAuth 授权"
            : "即梦登录已启动，请完成 OAuth 授权",
          "info",
        ),
        v77());
    } catch (v273) {
      window["showToast"]?.(v273?.["message"] || "即梦登录启动失败", "error");
    }
  }
  async function v274() {
    await v269();
  }
  function v275() {
    ((v60["manualGuideOpen"] = !v60["manualGuideOpen"]),
      v171(v60["lastStatus"] || {}));
  }
  async function v276() {
    if (!v72()) return;
    if (typeof v56 !== "function") return;
    try {
      const v277 = await v56();
      if (v277?.["success"] === false)
        throw new Error(v277?.["message"] || "退出即梦登录失败");
      (v277?.["status"]
        ? v157(v277["status"])
        : await v78({ force: true, silent: true }),
        v76(),
        window["showToast"]?.("已退出即梦登录", "success"));
    } catch (v278) {
      window["showToast"]?.(v278?.["message"] || "退出即梦登录失败", "error");
    }
  }
  function v279() {
    const {
      btnAuthEl: v280,
      btnQrAuthEl: v281,
      btnLogoutEl: v282,
      modalOverlayEl: v283,
      modalCloseEl: v284,
      modalQrImageEl: v285,
      modalRetryEl: v286,
      manualOpenLoginEl: v287,
      manualCopyLoginEl: v288,
      manualOpenAuthEl: v289,
      manualCopyAuthEl: v290,
      manualImportJsonBtnEl: v291,
    } = v71();
    (v169(v285),
      v280?.["addEventListener"]("click", () => {
        v269()["catch"](() => {});
      }),
      v281?.["addEventListener"]("click", () => {
        v274()["catch"](() => {});
      }),
      v282?.["addEventListener"]("click", () => {
        v276()["catch"](() => {});
      }),
      v284?.["addEventListener"]("click", () => {
        v75({ force: true });
      }),
      v286?.["addEventListener"]("click", () => {
        v275();
      }),
      v287?.["addEventListener"]("click", () => {
        v137()["catch"](() => {});
      }),
      v288?.["addEventListener"]("click", () => {
        v139()["catch"](() => {});
      }),
      v289?.["addEventListener"]("click", () => {
        v138()["catch"](() => {});
      }),
      v290?.["addEventListener"]("click", () => {
        v140()["catch"](() => {});
      }),
      v291?.["addEventListener"]("click", () => {
        v151()["catch"](() => {});
      }),
      v283?.["addEventListener"]("click", (v292) => {
        if (v292["target"] !== v283) return;
        v75();
      }),
      document["addEventListener"]("keydown", (v293) => {
        if (v293["key"] !== "Escape") return;
        v75();
      }));
    if (document["body"]) {
      const v294 = new MutationObserver(() => {
        const v295 = v72();
        v295 && v78({ force: true, silent: true })["catch"](() => {});
      });
      v294["observe"](document["body"], {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
  }
  let nvidiaTextModelsDraft = null;
  function v295a() {
    if (Array["isArray"](nvidiaTextModelsDraft)) return nvidiaTextModelsDraft;
    return getDefaultNvidiaTextModelEntries()
      ["map"]((v295b) =>
        normalizeNvidiaTextModelConfigEntry({
          model: v295b["model"],
          name: v295b["title"],
        }),
      )
      ["filter"](Boolean);
  }
  function v295c() {
    const v295d = document["getElementById"]("nvidiaTextModelsEditor");
    if (!v295d) return;
    const v295e = v295a();
    v295d["replaceChildren"]();
    if (v295e["length"] === 0) {
      const v295f = document["createElement"]("div");
      ((v295f["className"] = "settings-nvidia-models-empty"),
        (v295f["textContent"] =
          "暂无模型，请添加 build.nvidia.com 上的模型 ID"),
        v295d["appendChild"](v295f));
    } else
      v295e["forEach"]((v295g, v295h) => {
        const v295i = document["createElement"]("div");
        v295i["className"] = "settings-nvidia-model-row";
        const v295j = document["createElement"]("div");
        v295j["className"] = "settings-nvidia-model-meta";
        const v295k = document["createElement"]("div");
        ((v295k["className"] = "settings-nvidia-model-name"),
          (v295k["textContent"] = v295g["name"] || v295g["model"]));
        const v295l = document["createElement"]("div");
        ((v295l["className"] = "settings-nvidia-model-id"),
          (v295l["textContent"] = v295g["model"]));
        v295j["appendChild"](v295k);
        v295j["appendChild"](v295l);
        const v295m = document["createElement"]("button");
        ((v295m["type"] = "button"),
          (v295m["className"] = "settings-nvidia-model-delete"),
          v295m["setAttribute"]("title", "删除模型"),
          v295m["setAttribute"](
            "aria-label",
            "删除模型 " + v295g["model"],
          ),
          (v295m["textContent"] = "×"),
          v295m["addEventListener"]("click", () => {
            nvidiaTextModelsDraft = v295e["filter"](
              (_v295n, v295o) => v295o !== v295h,
            );
            v295c();
          }),
          v295i["appendChild"](v295j),
          v295i["appendChild"](v295m),
          v295d["appendChild"](v295i));
      });
    const v295p = document["createElement"]("div");
    v295p["className"] = "settings-nvidia-model-add";
    const v295q = document["createElement"]("input");
    ((v295q["type"] = "text"),
      (v295q["className"] = "settings-input"),
      (v295q["id"] = "nvidiaTextModelInput"),
      (v295q["placeholder"] = "例如 meta/llama-3.1-8b-instruct"));
    const v295r = document["createElement"]("button");
    ((v295r["type"] = "button"),
      (v295r["className"] = "settings-save-btn settings-btn-ghost"),
      (v295r["textContent"] = "添加"));
    const v295s = () => {
      const v295t = v295q["value"]["trim"]();
      if (!v295t) return;
      const v295u = normalizeNvidiaTextModelConfigEntry(v295t);
      if (!v295u) {
        window["showToast"]?.(
          "请输入有效的模型 ID，例如 meta/llama-3.1-8b-instruct",
          "warn",
        );
        return;
      }
      const v295v = v295a();
      if (v295v["some"]((v295w) => v295w["model"] === v295u["model"])) {
        window["showToast"]?.("该模型已在列表中", "warn");
        return;
      }
      nvidiaTextModelsDraft = [...v295v, v295u];
      v295q["value"] = "";
      v295c();
    };
    (v295r["addEventListener"]("click", v295s),
      v295q["addEventListener"]("keydown", (v295x) => {
        v295x["key"] === "Enter" && (v295x["preventDefault"](), v295s());
      }),
      v295p["appendChild"](v295q),
      v295p["appendChild"](v295r),
      v295d["appendChild"](v295p));
  }
  function v295y(v295z = {}) {
    const v296a = v295z?.["textModels"];
    nvidiaTextModelsDraft = Array["isArray"](v296a)
      ? v296a["map"](normalizeNvidiaTextModelConfigEntry)["filter"](Boolean)
      : null;
    v295c();
  }
  function v296b(v296c, v296d = {}) {
    const v296e = v295a(),
      v296f = toNvidiaTextModelConfigEntries(getDefaultNvidiaTextModelEntries()),
      v296g = v296e
        ["map"](normalizeNvidiaTextModelConfigEntry)
        ["filter"](Boolean);
    if (
      JSON["stringify"](v296g) === JSON["stringify"](v296f) &&
      !Array["isArray"](v296d?.["textModels"])
    ) {
      delete v296c["textModels"];
      return;
    }
    v296c["textModels"] = v296g;
  }
  function v296() {
    const v297 = (v298) =>
        String(v298 || "")
          ["trim"]()
          ["replace"](/^Bearer\s+/i, ""),
      v299 = {};
    v62["forEach"]((v300) => {
      const v301 = document["getElementById"]("providerUrl-" + v300),
        v302 = document["getElementById"]("providerKey-" + v300),
        v303 = v61?.["providers"]?.[v300],
        v304 = v303 && typeof v303 === "object" ? { ...v303 } : {};
      if (v301) v304["apiUrl"] = v301["value"]["trim"]();
      if (v302) v304["apiKey"] = v297(v302["value"]);
      v299[v300] = v304;
    });
    v299["nvidia"] &&
      v296b(v299["nvidia"], v61?.["providers"]?.["nvidia"] || {});
    const v305 = document["getElementById"]("providerKey-runninghub-model");
    return (
      v305 &&
        ((v299["runninghub"] = v299["runninghub"] || {}),
        (v299["runninghub"]["modelApiKey"] = v297(v305["value"]))),
      { ...(v61 || {}), providers: v299 }
    );
  }
  function v306(v307) {
    const v308 = v307?.["providers"] || {};
    return v62["filter"]((v309) => {
      const v310 = v308[v309] || {};
      return !!String(v310["apiKey"] || v310["modelApiKey"] || "")["trim"]();
    });
  }
  function v311(v312, v313) {
    const v314 = v312?.["providers"]?.[v313] || {};
    return !!String(v314["apiKey"] || v314["modelApiKey"] || "")["trim"]();
  }
  function v315(v316) {
    const v317 = document["getElementById"]("providerTestStatus-" + v316);
    return (v318(v317), v317);
  }
  function v319(v320) {
    const v321 = document["getElementById"]("providerBalance-" + v320);
    return (v318(v321), v321);
  }
  function v322() {
    if (v64) return v64;
    return (
      (v64 = document["createElement"]("div")),
      (v64["className"] = "settings-provider-test-tooltip"),
      v64["setAttribute"]("role", "tooltip"),
      (v64["hidden"] = true),
      document["body"]["appendChild"](v64),
      v64
    );
  }
  function v323(v324) {
    return String(v324?.["getAttribute"]("data-provider-test-tooltip") || "")[
      "trim"
    ]();
  }
  function v325(v326) {
    if (!v64 || !v326) return;
    const v327 = v64,
      v328 = v326["getBoundingClientRect"](),
      v329 = v327["getBoundingClientRect"](),
      v330 = 24,
      v331 =
        v326["closest"](".settings-modal")?.["getBoundingClientRect"]()[
          "top"
        ] ?? 0,
      v332 = Math["max"](v330, v331 + 10),
      v333 = Math["max"](v330, window["innerWidth"] - v329["width"] - v330),
      v334 = Math["min"](
        v333,
        Math["max"](v330, v328["left"] + v328["width"] / 2 - v329["width"] / 2),
      ),
      v335 = Math["max"](v332, v328["top"] - v329["height"] - 12),
      v336 = Math["min"](
        v329["width"] - 14,
        Math["max"](14, v328["left"] + v328["width"] / 2 - v334),
      );
    ((v327["style"]["left"] = v334 + "px"),
      (v327["style"]["top"] = v335 + "px"),
      v327["style"]["setProperty"](
        "--settings-provider-test-tooltip-arrow-left",
        v336 + "px",
      ));
  }
  function v337(v338) {
    const v339 = v323(v338);
    if (!v339) return;
    const v340 = v322();
    ((v65 = v338),
      (v340["textContent"] = v339),
      (v340["hidden"] = false),
      v325(v338),
      v340["classList"]["add"]("is-visible"));
  }
  function v341(v342 = null) {
    if (v342 && v65 !== v342) return;
    v65 = null;
    if (!v64) return;
    (v64["classList"]["remove"]("is-visible"), (v64["hidden"] = true));
  }
  function v318(v343) {
    if (!v343 || v343["dataset"]["providerTestTooltipBound"] === "1") return;
    ((v343["dataset"]["providerTestTooltipBound"] = "1"),
      v343["addEventListener"]("pointerenter", () => v337(v343)),
      v343["addEventListener"]("pointerleave", () => v341(v343)),
      v343["addEventListener"]("focus", () => v337(v343)),
      v343["addEventListener"]("blur", () => v341(v343)));
  }
  function v344(v345) {
    const v346 = v315(v345);
    (v346 &&
      (v341(v346),
      (v346["hidden"] = true),
      (v346["textContent"] = ""),
      (v346["title"] = ""),
      v346["removeAttribute"]("data-tooltip"),
      v346["removeAttribute"]("data-tooltip-source"),
      v346["removeAttribute"]("data-native-title"),
      v346["removeAttribute"]("data-provider-test-tooltip"),
      v346["classList"]["remove"](...v63)),
      v347(v345));
  }
  function v348(v349, v350, v351, v352 = "") {
    const v353 = v315(v349);
    if (!v353) return;
    ((v353["hidden"] = false), (v353["textContent"] = v351));
    const v354 = v352 || v351;
    (v353["removeAttribute"]("title"),
      v353["removeAttribute"]("data-tooltip"),
      v353["removeAttribute"]("data-tooltip-source"),
      v353["removeAttribute"]("data-native-title"),
      v353["setAttribute"]("data-provider-test-tooltip", v354),
      v353["setAttribute"]("aria-label", v354),
      v353["classList"]["remove"](...v63));
    if (v350 === "success")
      v353["classList"]["add"]("settings-provider-status--success");
    else {
      if (v350 === "testing")
        v353["classList"]["add"]("settings-provider-status--testing");
      else {
        if (v350 === "partial")
          v353["classList"]["add"]("settings-provider-status--partial");
        else v353["classList"]["add"]("settings-provider-status--danger");
      }
    }
  }
  function v347(v355) {
    const v356 = v319(v355);
    if (!v356) return;
    (v341(v356),
      (v356["hidden"] = true),
      (v356["textContent"] = ""),
      v356["removeAttribute"]("aria-label"),
      v356["removeAttribute"]("data-provider-test-tooltip"));
  }
  function v357(v358, v359 = null) {
    const v360 = v319(v358);
    if (!v360) return;
    const v361 = String(v359?.["displayText"] || "")["trim"]();
    if (!v361) {
      v347(v358);
      return;
    }
    const v362 = String(v359?.["detailText"] || v361)["trim"]();
    ((v360["hidden"] = false),
      (v360["textContent"] = v361),
      v360["setAttribute"]("aria-label", v362),
      v360["setAttribute"]("data-provider-test-tooltip", v362));
  }
  function v363(v364 = {}) {
    const v365 = [],
      v366 =
        v364["suggestion"] ||
        v364["summary"] ||
        v364["error"] ||
        v364["detail"] ||
        "";
    if (v366) v365["push"](v366);
    if (Array["isArray"](v364["steps"]) && v364["steps"]["length"] > 0)
      v364["steps"]["forEach"]((v367) => {
        const v368 = v367["skipped"] ? "跳过" : v367["ok"] ? "通过" : "失败",
          v369 = v367["message"] || v367["detail"] || "";
        v365["push"](
          (v367["label"] || v367["id"] || "步骤") +
            "：" +
            v368 +
            (v369 ? " - " + v369 : ""),
        );
      });
    else v364["detail"] && v365["push"](v364["detail"]);
    return v365["filter"](Boolean)["join"]("\x0a");
  }
  function v370(v371 = {}) {
    if (v371["ok"]) return "success";
    if (v371["partial"]) return "partial";
    return "danger";
  }
  function v372(v373 = {}) {
    if (v373["ok"]) return "通过";
    if (v373["partial"]) return "部分通过";
    return "未通过";
  }
  function v374() {
    v62["forEach"](v344);
  }
  function v375() {
    (v62["forEach"]((v376) => {
      const v377 = document["getElementById"]("providerUrl-" + v376),
        v378 = document["getElementById"]("providerKey-" + v376);
      (v377?.["addEventListener"]("input", () => v344(v376)),
        v378?.["addEventListener"]("input", () => v344(v376)));
    }),
      document["getElementById"]("providerKey-runninghub-model")?.[
        "addEventListener"
      ]("input", () => v344("runninghub")));
  }
  async function v379(v380, v381 = {}) {
    if (typeof v50 !== "function") {
      window["showToast"]?.("当前版本不支持连接测试", "error");
      return;
    }
    const v382 = v296(),
      v383 = String(v381?.["providerId"] || "")
        ["trim"]()
        ["toLowerCase"](),
      v384 = v383 ? [v383] : v306(v382);
    v383 ? v344(v383) : v374();
    if (v383 && !v311(v382, v383)) {
      window["showToast"]?.("请先填写该厂商的 API Key", "warn");
      return;
    }
    if (v384["length"] === 0) {
      window["showToast"]?.("请先填写至少一个厂商的 API Key", "warn");
      return;
    }
    v384["forEach"]((v385) => v348(v385, "testing", "测试中"));
    const v386 = v380?.["querySelector"]?.(".settings-btn-label"),
      v387 = v386?.["textContent"] || v380?.["textContent"] || "测试连接";
    if (v380) {
      v380["disabled"] = true;
      if (v386) v386["textContent"] = "测试中...";
      else v380["textContent"] = "测试中...";
    }
    const v388 = {},
      v389 = [];
    try {
      await Promise["all"](
        v384["map"](async (v390) => {
          try {
            const v391 = await v50(v382, [v390]);
            v388[v390] = v391?.[v390];
          } catch (v392) {
            v388[v390] = {
              ok: false,
              label: v390,
              error: v392?.["message"] || "连接测试失败",
            };
          }
          const v393 = v388[v390];
          (v357(v390, v393?.["balance"]),
            v393?.["ok"]
              ? v348(v390, "success", "通过", v363(v393) || "连接测试通过")
              : (v389["push"]({
                  label: v393?.["label"] || v390,
                  error:
                    v393?.["suggestion"] ||
                    v393?.["summary"] ||
                    v393?.["error"] ||
                    "连接测试未通过",
                }),
                v348(
                  v390,
                  v370(v393),
                  v372(v393),
                  v363(v393) || v393?.["error"] || "连接测试未通过",
                )));
        }),
      );
      if (v389["length"] === 0) {
        const v394 = v388[v384[0]],
          v395 = v383
            ? (v394?.["label"] || v383) + " 连接测试通过"
            : "API 连接测试通过";
        window["showToast"]?.(v395, "success");
      } else {
        const v396 = v389[0];
        window["showToast"]?.(
          "连接测试未通过：" + v396["label"] + " - " + v396["error"],
          "error",
          9000,
        );
      }
    } catch (v397) {
      (v384["forEach"]((v398) =>
        v348(v398, "danger", "未通过", v397?.["message"] || "连接测试失败"),
      ),
        window["showToast"]?.(
          "连接测试失败:\x20" + (v397?.["message"] || "未知错误"),
          "error",
        ));
    } finally {
      if (v380) {
        v380["disabled"] = false;
        if (v386) v386["textContent"] = v387;
        else v380["textContent"] = v387;
      }
    }
  }
  function v399() {
    const v400 = document["getElementById"]("btnApiSave"),
      v401 = document["getElementById"]("btnApiTest");
    (v48()
      ["then"]((v402) => {
        if (!v402 || v402["error"]) return;
        v61 = v402 || {};
        const v403 = v402["providers"] || {};
        v62["forEach"]((v404) => {
          const v405 = document["getElementById"]("providerUrl-" + v404),
            v406 = document["getElementById"]("providerKey-" + v404),
            v407 = v403[v404] || {};
          if (v405 && v407["apiUrl"]) v405["value"] = v407["apiUrl"];
          else if (v405 && v404 === "nvidia" && !v405["value"])
            v405["value"] = "https://integrate.api.nvidia.com/v1";
          if (v406 && v407["apiKey"]) v406["value"] = v407["apiKey"];
        });
        const v408 = document["getElementById"]("providerKey-runninghub-model");
        v408 &&
          v403["runninghub"]?.["modelApiKey"] &&
          (v408["value"] = v403["runninghub"]["modelApiKey"]);
        v295y(v403["nvidia"] || {});
        if (!v403["grsai"]?.["apiKey"] && v402["apiKey"]) {
          const v409 = document["getElementById"]("providerKey-grsai");
          if (v409 && !v409["value"]) v409["value"] = v402["apiKey"];
        }
      })
      ["catch"]((v410) => {
        (console["error"]("[API\x20Config]\x20加载失败:", v410),
          v58?.(
            "加载\x20API\x20配置失败:\x20" + (v410["message"] || "未知错误"),
          ));
      })
      ["finally"](() => {
        v295y(v61?.["providers"]?.["nvidia"] || {});
        typeof window !== "undefined" &&
          window["dispatchEvent"]?.(
            new CustomEvent(PROVIDER_CONFIG_SAVED_EVENT, { detail: v61 }),
          );
        v72() && v78({ force: true, silent: true })["catch"](() => {});
      }),
      v400 &&
        v400["addEventListener"]("click", () => {
          const v411 = v296();
          v49(v411)
            ["then"]((v412) => {
              v412 && !v412["error"]
                ? ((v61 = v412?.["providers"] ? v412 : v411),
                  nvidiaTextModelsDraft = null,
                  v295y(v61?.["providers"]?.["nvidia"] || {}),
                  window["dispatchEvent"](
                    new CustomEvent(PROVIDER_CONFIG_SAVED_EVENT, {
                      detail: v61,
                    }),
                  ),
                  window["showToast"]?.("API\x20配置已保存"),
                  v78({ force: true, silent: true })["catch"](() => {}))
                : window["showToast"]?.(
                    "保存失败: " + (v412["error"] || "未知错误"),
                    "error",
                  );
            })
            ["catch"]((v413) => {
              window["showToast"]?.("保存失败: " + v413["message"], "error");
            });
        }),
      v401?.["addEventListener"]("click", () => {
        v379(v401)["catch"](() => {});
      }),
      document["querySelectorAll"]("[data-provider-test]")["forEach"](
        (v414) => {
          const v415 = String(v414["dataset"]["providerTest"] || "")["trim"]();
          if (!v415) return;
          v414["addEventListener"]("click", () => {
            v379(v414, { providerId: v415 })["catch"](() => {});
          });
        },
      ),
      v375(),
      v279());
  }
  function v416() {
    (v66(), v72(), v399());
  }
  return { init: v416 };
}
