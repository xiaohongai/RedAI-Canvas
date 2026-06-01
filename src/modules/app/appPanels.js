import { showTutorialVideoPanel } from "../AutoUpdate.js";
export function createAppPanels({
  store: v0,
  setTextWithLineBreaks: v1,
  getAIGenerationDefaultSizeByType: v2,
  createDefaultSubscriptionState: v3,
  isModelAllowed: v4,
  isSubscriptionActive: v5,
  isActivationRequestAccepted: v6,
  normalizeSubscriptionPayload: v7,
  ensureInstallId: v8,
  pullSubscriptionState: v9,
  submitCdkey: v10,
  clearSubscriptionAuthorization: v11,
  DEFAULT_VIP_GATE_MODEL_ID: v12,
} = {}) {
  const v13 = [
    {
      title: "使用说明：",
      url: "https://www.bilibili.com/video/BV1RX5z6gEXq/",
    },
    {
      title: "最新使用教程：",
      url: "https://www.bilibili.com/video/BV17soQB7EwB",
    },
    {
      title: "影视人物替换演示",
      url: "https://www.bilibili.com/video/BV1YEDKBwEz7",
    },
    {
      title: "人物\x5c场景一致性\x20360°全景图提取\x20SD2.0生成\x20演示！",
      url: "https://www.bilibili.com/video/BV1FqdyBwEGx",
    },
  ];
  function v14() {
    const v15 = document["getElementById"]("subStatusText"),
      v16 = document["getElementById"]("subExpireText"),
      v17 = document["getElementById"]("subscriptionCdkeyInput"),
      v18 = document["getElementById"]("btnSubscriptionActivate"),
      v19 = document["getElementById"]("btnSubscriptionClearAuthorization"),
      v20 = document["getElementById"]("subscriptionContactLink"),
      v21 = document["getElementById"]("subscriptionContactReveal"),
      v22 = document["getElementById"]("subscriptionContactWechat"),
      v23 = [0, 500, 1200, 2500, 4000],
      v24 = 700,
      v25 = "联系管理员获取授权码",
      v26 = "https://api.ashuoai.com/static/contact/wechat.png",
      v27 = "yumengashuo";
    function v28(v29) {
      const v30 = Number(v29);
      if (!Number["isFinite"](v30) || v30 <= 0) return "-";
      try {
        return new Date(v30 * 1000)["toLocaleString"]();
      } catch {
        return "-";
      }
    }
    function v31(v32) {
      const v33 = String(v32 || "")["trim"]();
      if (!v33) return "";
      if (/^https?:\/\//i["test"](v33)) return v33;
      if (v33["startsWith"]("/")) return v33;
      return "";
    }
    function v34(v35, v36, v37 = true) {
      if (!v35) return;
      v35["replaceChildren"]();
      if (!v36) {
        v35["hidden"] = true;
        return;
      }
      v35["hidden"] = !v37;
      const v38 = document["createElement"]("span");
      ((v38["className"] = "settings-contact-label"),
        (v38["textContent"] = "微信："));
      const v39 = document["createElement"]("input");
      ((v39["type"] = "text"),
        (v39["className"] = "settings-contact-copy"),
        (v39["value"] = v36),
        (v39["readOnly"] = true),
        v39["setAttribute"]("aria-label", "管理员微信"),
        v39["addEventListener"]("focus", () => v39["select"]()),
        v39["addEventListener"]("click", () => {
          (v39["focus"](), v39["select"]());
        }),
        v35["append"](v38, v39));
    }
    function v40(v41, v42, v43) {
      if (!v41) return;
      (v41["replaceChildren"](),
        v41["classList"]["toggle"]("has-contact-image", !!v42));
      if (!v42) {
        if (v43) return;
        const v44 = document["createElement"]("span");
        ((v44["className"] = "settings-contact-fallback"),
          (v44["textContent"] = "管理员二维码暂未配置，请稍后重试。"),
          v41["appendChild"](v44));
        return;
      }
      const v45 = document["createElement"]("img");
      ((v45["className"] = "settings-contact-qr"),
        (v45["alt"] = "管理员微信二维码"),
        (v45["loading"] = "lazy"),
        (v45["decoding"] = "async"),
        (v45["referrerPolicy"] = "no-referrer"),
        (v45["src"] = v42),
        v45["addEventListener"]("error", () => {
          v45["hidden"] = true;
          const v46 = document["createElement"]("div");
          ((v46["className"] = "settings-contact-hint"),
            (v46["textContent"] = "二维码加载失败，可复制微信号添加。"),
            v41["appendChild"](v46),
            v41["classList"]["add"]("has-contact-error"));
        }),
        v41["appendChild"](v45));
    }
    function v47(v48, v49, v50, v51 = "", v52 = "", v53 = null) {
      if (!v48) return;
      v48["textContent"] = String(v50 || v25);
      const v54 = v31(v51 || v26),
        v55 = String(v52 || v27)["trim"]();
      v53 && v34(v53, v55, v53["hidden"] === false);
      v40(v49, v54, !!v55);
      if (!v53 && v49 && v55) {
        const v56 = document["createElement"]("div");
        ((v56["className"] = "settings-contact-wechat"),
          v49["appendChild"](v56),
          v34(v56, v55));
      }
    }
    function v57(v58, v59, v60 = null) {
      if (!v58 || !v59 || v58["dataset"]["contactRevealBound"] === "1") return;
      ((v58["dataset"]["contactRevealBound"] = "1"),
        v58["addEventListener"]("click", () => {
          v59["hidden"] = false;
          if (v60?.["children"]?.["length"]) v60["hidden"] = false;
        }));
    }
    function v61(v62) {
      const v63 = v62 || v3();
      if (v15) {
        let v64 = "未激活";
        if (v63["loading"]) v64 = "同步中...";
        else {
          if (String(v63["status"] || "")["toLowerCase"]() === "active")
            v64 = "已激活";
          else {
            if (v63["status"] === "expired") v64 = "已过期";
          }
        }
        v15["textContent"] = v64;
      }
      (v16 && (v16["textContent"] = "到期时间：" + v28(v63["expiresAt"])),
        v20 &&
          v47(
            v20,
            v21,
            v63["contactText"] || v25,
            v63["contactUrl"] || "",
            v63["contactWechat"] || v27,
            v22,
          ));
    }
    function v65() {
      return Boolean(
        window["AI_CANVAS_IS_DEV_BUILD"] || window["LOCAL_DEV_BUILD"],
      );
    }
    function v66() {
      if (!v19) return;
      v19["hidden"] = !v65();
    }
    function v67() {
      return v0["getStateRaw"]()["subscription"] || v3();
    }
    function v68(v69) {
      const v70 = v7(v69 || {});
      if (!v5(v70)) return false;
      const v71 = v67();
      return (
        v0["setSubscriptionState"]({
          ...v71,
          ...v70,
          loading: false,
          error: null,
          lastSyncAt: Date["now"](),
        }),
        true
      );
    }
    function v72() {
      return !!document["getElementById"]("subscriptionGateOverlay");
    }
    async function v73() {
      const v74 = v67();
      v0["setSubscriptionState"]({ ...v74, loading: true, error: null });
      const v75 = await v8();
      if (!String(v75 || "")["trim"]())
        return (
          v0["setSubscriptionState"]({
            loading: false,
            status: "none",
            expiresAt: null,
            error: "缺少 installId，无法同步订阅状态",
            lastSyncAt: Date["now"](),
          }),
          v67()
        );
      try {
        const v76 = v67(),
          v77 = await v9(v75);
        return (
          v0["setSubscriptionState"]({
            ...v77,
            expiresAt: v77?.["expiresAt"] ?? v76?.["expiresAt"] ?? null,
            loading: false,
            error: null,
            lastSyncAt: Date["now"](),
          }),
          v67()
        );
      } catch (v78) {
        return (
          v0["setSubscriptionState"]({
            status: "none",
            expiresAt: null,
            loading: false,
            error: v78?.["message"] || "订阅状态同步失败",
            lastSyncAt: Date["now"](),
          }),
          v67()
        );
      }
    }
    async function v79(v80, v81 = {}) {
      const v82 =
          typeof v81?.["onProgress"] === "function" ? v81["onProgress"] : null,
        v83 =
          Array["isArray"](v81?.["retryScheduleMs"]) &&
          v81["retryScheduleMs"]["length"] > 0
            ? v81["retryScheduleMs"]
            : v23,
        v84 = String(v80 || "")["trim"]();
      if (!v84) return (window["showToast"]?.("请输入 CDKEY", "warn"), false);
      const v85 = await v8();
      if (!String(v85 || "")["trim"]())
        return (
          window["showToast"]?.("缺少\x20installId，无法激活", "error"),
          false
        );
      let v86 = null,
        v87 = null;
      for (let v88 = 0; v88 < 2; v88 += 1) {
        try {
          ((v86 = await v10(v85, v84)), (v87 = null));
          break;
        } catch (v89) {
          v87 = v89;
          if (v88 >= 1) break;
          await new Promise((v90) => setTimeout(v90, v24));
        }
      }
      if (v87) throw v87;
      if (!v6(v86)) {
        const v91 = v86?.["message"] || "CDKEY 激活失败";
        return (window["showToast"]?.(v91, "error"), false);
      }
      if (v68(v86)) return (window["showToast"]?.("CDKEY 激活成功"), true);
      window["showToast"]?.("已提交，正在校验授权...");
      for (let v92 = 0; v92 < v83["length"]; v92 += 1) {
        const v93 = v83[v92];
        v82?.({ phase: "checking", attempt: v92 + 1, total: v83["length"] });
        if (v93 > 0) await new Promise((v94) => setTimeout(v94, v93));
        const v95 = await v73();
        if (v5(v95)) return (window["showToast"]?.("CDKEY 激活成功"), true);
      }
      const v96 = v67(),
        v97 = String(v96["error"] || v86?.["message"] || "")["trim"]();
      return (
        v97
          ? window["showToast"]?.(
              "服务器未确认激活，请稍后重试（" + v97 + "）",
              "warning",
            )
          : window["showToast"]?.("服务器未确认激活，请稍后重试", "warning"),
        false
      );
    }
    async function v98() {
      if (!v65() || typeof v11 !== "function") return false;
      const v99 = window["confirm"]?.(
        "确定要清空当前授权吗？清空后当前设备会回到未激活状态。",
      );
      if (v99 === false) return false;
      const v100 = v19?.["textContent"] || "清空授权";
      v19 && ((v19["disabled"] = true), (v19["textContent"] = "清理中..."));
      try {
        await v11();
        const v101 = v67(),
          v102 = v3();
        return (
          v0["setSubscriptionState"]({
            ...v102,
            contactText: v101["contactText"] || v102["contactText"],
            contactUrl: v101["contactUrl"] || v102["contactUrl"],
            contactWechat: v101["contactWechat"] || v102["contactWechat"],
            loading: false,
            status: "none",
            expiresAt: null,
            entitledModelKeys: [],
            entitledModelIds: [],
            error: null,
            lastSyncAt: Date["now"](),
            deviceId: "",
          }),
          window["showToast"]?.("已清空当前授权"),
          true
        );
      } catch (v103) {
        return (
          window["showToast"]?.(v103?.["message"] || "清空授权失败", "error"),
          false
        );
      } finally {
        v19 && ((v19["disabled"] = false), (v19["textContent"] = v100));
      }
    }
    function v104(v105 = v12, v106 = "", v107 = null) {
      if (v72()) return;
      const v108 = document["createElement"]("div");
      ((v108["id"] = "subscriptionGateOverlay"),
        (v108["className"] = "subscription-gate-overlay"));
      const v109 = v67();
      ((v108["innerHTML"] =
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22subscription-gate-dialog\x22\x20role=\x22dialog\x22\x20aria-modal=\x22true\x22\x20aria-label=\x22订阅解锁\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22subscription-gate-title\x22>需要VIP授权</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22subscription-gate-desc\x22>联系管理员获取授权码，或直接输入\x20CDKEY\x20立即解锁。</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<input\x20type=\x22text\x22\x20class=\x22settings-input\x22\x20id=\x22gateCdkeyInput\x22\x20placeholder=\x22输入\x20CDKEY\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22settings-subscription-contact\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20id=\x22gateContactLink\x22\x20class=\x22settings-getkey\x20settings-contact-trigger\x22></button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20id=\x22gateContactReveal\x22\x20class=\x22settings-contact-reveal\x22\x20hidden></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22subscription-gate-actions\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22subscription-gate-btn\x22\x20id=\x22gateCancelBtn\x22>取消</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22subscription-gate-btn\x20is-primary\x22\x20id=\x22gateSubmitBtn\x22>激活</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20"),
        document["body"]["appendChild"](v108));
      const v110 = () => v108["remove"]();
      (v108["addEventListener"]("click", (v111) => {
        if (v111["target"] === v108) v110();
      }),
        v108["querySelector"]("#gateCancelBtn")?.["addEventListener"](
          "click",
          v110,
        ),
        v47(
          v108["querySelector"]("#gateContactLink"),
          v108["querySelector"]("#gateContactReveal"),
          v109["contactText"] || v25,
          v109["contactUrl"] || "",
          v109["contactWechat"] || v27,
        ),
        v57(
          v108["querySelector"]("#gateContactLink"),
          v108["querySelector"]("#gateContactReveal"),
        ));
      const v112 = v108["querySelector"]("#gateSubmitBtn"),
        v113 = v108["querySelector"]("#gateCdkeyInput");
      let v114 = false;
      v108["querySelector"]("#gateSubmitBtn")?.["addEventListener"](
        "click",
        async () => {
          if (v114) return;
          v114 = true;
          const v115 = v112?.["textContent"] || "激活";
          v112 &&
            ((v112["disabled"] = true), (v112["textContent"] = "校验中 1/4"));
          if (v113) v113["disabled"] = true;
          let v116 = false;
          try {
            v116 = await v79(v113?.["value"], {
              onProgress: ({ attempt: v117, total: v118 }) => {
                if (!v112 || !v112["isConnected"]) return;
                v112["textContent"] = "校验中 " + v117 + "/" + v118;
              },
              retryScheduleMs: v23,
            });
          } catch (v119) {
            (window["showToast"]?.(
              v119?.["message"] || "激活校验失败",
              "error",
            ),
              (v116 = false));
          }
          if (v116) {
            v110();
            if (typeof v107 === "function")
              try {
                v107();
              } catch {}
            return;
          }
          ((v114 = false),
            v112 &&
              v112["isConnected"] &&
              ((v112["disabled"] = false), (v112["textContent"] = v115)),
            v113 &&
              v113["isConnected"] &&
              ((v113["disabled"] = false), v113["focus"]()));
        },
      );
    }
    async function v120(v121 = v12, v122 = "", v123 = null) {
      const v124 = v67(),
        v125 = typeof v4 === "function" ? v4(v121, v124, v122) : v5(v124);
      if (v125) {
        const v126 = String(v123?.["message"] || "")["trim"]();
        window["showToast"]?.(
          v126 || "订阅状态已激活，正在同步后请再试一次",
          "warning",
        );
        try {
          await v73();
        } catch {}
        return;
      }
      if (v72()) return;
      v104(v121, v122);
    }
    ((window["openSubscriptionDialog"] = ({
      modelId: modelId = v12,
      provider: provider = "",
      onSuccess: onSuccess = null,
    } = {}) => {
      const v127 = v67();
      if (typeof v4 === "function" && v4(modelId, v127, provider)) return;
      if (v72()) return;
      v104(modelId, provider, onSuccess);
    }),
      (window["isModelAllowedBySubscription"] = (v128, v129 = "") =>
        v4(v128, v0["getStateRaw"]()["subscription"] || {}, v129)),
      (window["getSubscriptionState"] = () => v67()),
      (window["ensureSubscriptionInstallId"] = v8),
      (window["refreshSubscriptionState"] = v73),
      (window["handleSubscriptionRequired"] = ({
        modelId: modelId = v12,
        provider: provider = "",
        error: error = null,
      } = {}) => v120(modelId, provider, error)),
      v18 &&
        v18["addEventListener"]("click", async () => {
          const v130 = await v79(v17?.["value"]);
          if (v130 && v17) v17["value"] = "";
        }),
      v19 &&
        (v19["addEventListener"]("click", () => {
          void v98();
        }),
        v66(),
        window["addEventListener"]?.("aicanvas:runtime-info", v66)),
      v57(v20, v21, v22),
      v0["subscribeSelector"](
        (v131) => v131["subscription"],
        (v132) => v61(v132),
      ),
      void v73());
  }
  function v133() {
    const v134 = document["getElementById"]("aiPanel"),
      v135 = document["getElementById"]("aiPanelToggle");
    if (v134 && v135) {
      const v136 = "http://www.w3.org/2000/svg";
      function v137(v138) {
        v135["replaceChildren"]();
        const v139 = document["createElementNS"](v136, "svg");
        (v139["setAttribute"]("width", "14"),
          v139["setAttribute"]("height", "14"),
          v139["setAttribute"]("viewBox", "0 0 24 24"),
          v139["setAttribute"]("fill", "none"),
          v139["setAttribute"]("stroke", "currentColor"),
          v139["setAttribute"]("stroke-width", "2"));
        const v140 = document["createElementNS"](v136, "polyline");
        (v140["setAttribute"](
          "points",
          v138 ? "15 18 9 12 15 6" : "9\x2018\x2015\x2012\x209\x206",
        ),
          v139["appendChild"](v140),
          v135["appendChild"](v139));
      }
      v135["addEventListener"]("click", () => {
        (v134["classList"]["toggle"]("collapsed"),
          v137(v134["classList"]["contains"]("collapsed")));
      });
    }
    const v141 = document["getElementById"]("aiTipGot"),
      v142 = document["getElementById"]("aiTipCard");
    v141 &&
      v142 &&
      v141["addEventListener"]("click", () => {
        ((v142["style"]["opacity"] = "0"),
          (v142["style"]["maxHeight"] = "0px"),
          setTimeout(() => v142["remove"](), 320));
      });
    const v143 = document["getElementById"]("aiTextarea");
    v143 &&
      v143["addEventListener"]("input", () => {
        ((v143["style"]["height"] = "auto"),
          (v143["style"]["height"] =
            Math["min"](v143["scrollHeight"], 120) + "px"));
      });
    const v144 = document["getElementById"]("aiMessages"),
      v145 = document["getElementById"]("aiStartBtn"),
      v146 = document["getElementById"]("aiStartWrap"),
      v147 = document["getElementById"]("aiSend"),
      v148 = [
        "这是一个很棒的想法，我们可以把这些元素组合起来。",
        "我明白了，我先给你一版可直接复用的提示词草稿。",
        "需要我帮你把这段结果自动连接到下一个节点吗？",
        "没问题，我正在优化你当前选中区域的描述。",
      ];
    function v149(v150) {
      if (!v144) return;
      const v151 = document["createElement"]("div");
      v151["className"] = "ai-msg ai";
      const v152 = document["createElement"]("div");
      ((v152["className"] = "ai-msg-avatar"), (v152["textContent"] = "A"));
      const v153 = document["createElement"]("div");
      ((v153["className"] = "ai-msg-bubble"),
        v1(v153, v150),
        v151["appendChild"](v152),
        v151["appendChild"](v153),
        v144["appendChild"](v151),
        (v144["scrollTop"] = v144["scrollHeight"]));
    }
    function v154(v155) {
      if (!v144) return;
      const v156 = document["createElement"]("div");
      v156["className"] = "ai-msg\x20user";
      const v157 = document["createElement"]("div");
      ((v157["className"] = "ai-msg-avatar"),
        (v157["style"]["background"] = "var(--indigo)"),
        (v157["textContent"] = "U"));
      const v158 = document["createElement"]("div");
      ((v158["className"] = "ai-msg-bubble"),
        v1(v158, v155),
        v156["appendChild"](v157),
        v156["appendChild"](v158),
        v144["appendChild"](v156),
        (v144["scrollTop"] = v144["scrollHeight"]));
    }
    function v159() {
      if (!v143) return;
      const v160 = v143["value"]["trim"]();
      if (!v160) return;
      (v154(v160), (v143["value"] = ""), (v143["style"]["height"] = "auto"));
      if (v146) v146["style"]["display"] = "none";
      const v161 = document["createElement"]("div");
      v161["className"] = "ai-msg ai loading";
      const v162 = document["createElement"]("div");
      ((v162["className"] = "ai-msg-avatar"), (v162["textContent"] = "A"));
      const v163 = document["createElement"]("div");
      v163["className"] = "ai-msg-bubble";
      for (let v164 = 0; v164 < 3; v164 += 1) {
        const v165 = document["createElement"]("span");
        ((v165["className"] = "dot"), v163["appendChild"](v165));
      }
      (v161["appendChild"](v162),
        v161["appendChild"](v163),
        v144["appendChild"](v161),
        (v144["scrollTop"] = v144["scrollHeight"]),
        setTimeout(() => {
          v161["remove"]();
          const v166 = v148[Math["floor"](Math["random"]() * v148["length"])];
          v149(v166);
        }, 1200));
    }
    v145 &&
      v145["addEventListener"]("click", () => {
        if (v146) v146["style"]["display"] = "none";
        v149("你好，我是你的 AI 创作助手。输入你的想法，我们就开始创作。");
        if (v143) v143["focus"]();
      });
    if (v147) v147["addEventListener"]("click", v159);
    v143 &&
      v143["addEventListener"]("keydown", (v167) => {
        v167["key"] === "Enter" &&
          !v167["shiftKey"] &&
          (v167["preventDefault"](), v159());
      });
  }
  function v168() {
    const v169 = document["getElementById"]("emptyHint");
    if (!v169) return;
    function v170(v171) {
      if (!window["_isAppLoaded"]) {
        v169["classList"]["add"]("hidden");
        return;
      }
      if (v171 === 0) v169["classList"]["remove"]("hidden");
      else v169["classList"]["add"]("hidden");
    }
    ((window["_checkEmptyHint"] = () =>
      v170(v0["getStateRaw"]()["_nodeCount"] || 0)),
      v0["subscribeSelector"]((v172) => v172["_nodeCount"] || 0, v170),
      v170(v0["getStateRaw"]()["_nodeCount"] || 0));
    const v173 = {
      text: "ai-text",
      image: "ai-image",
      video: "ai-video",
      "test-video": "test-video",
    };
    v169["querySelectorAll"](".pill-btn")["forEach"]((v174) => {
      v174["addEventListener"]("click", (v175) => {
        v175["stopPropagation"]();
        const v176 = v174["dataset"]["type"],
          v177 = v173[v176];
        if (!v177) return;
        const v178 = v0["getState"]()["viewport"],
          v179 = (window["innerWidth"] / 2 - v178["x"]) / v178["zoom"],
          v180 = (window["innerHeight"] / 2 - v178["y"]) / v178["zoom"],
          v181 =
            "node-" +
            Date["now"]() +
            "-" +
            Math["random"]()["toString"](36)["slice"](2, 7),
          v182 =
            typeof v2 === "function" ? v2(v177) : { width: 300, height: 300 },
          v183 = v182["width"],
          v184 = v182["height"];
        (v0["addNode"]({
          id: v181,
          type: v177,
          x: v179 - v183 / 2,
          y: v180 - v184 / 2,
          width: v183,
          height: v184,
          name:
            v176 === "text"
              ? "生成文本"
              : v176 === "image"
                ? "生成图像"
                : "生成视频",
          needsAutoResize: v177 === "ai-image" || v177 === "ai-video",
        }),
          v0["setSelectedNodes"]([v181]));
      });
    });
  }
  function v185() {
    const v186 = document["getElementById"]("aboutOverlay"),
      v187 = document["getElementById"]("aboutClose"),
      v188 =
        document["querySelector"]('meta[name="app-version"]')?.["getAttribute"](
          "content",
        ) || "V0.0.1",
      v189 = document["getElementById"]("aboutVersion");
    if (v189) v189["innerText"] = v188;
    function v190() {
      if (v186) v186["style"]["display"] = "flex";
    }
    function v191() {
      if (v186) v186["style"]["display"] = "none";
    }
    function v192() {
      document["getElementById"]("avatarMenu")?.["classList"]["remove"]("open");
    }
    (document["getElementById"]("btnAbout")?.["addEventListener"](
      "click",
      (v193) => {
        (v193["stopPropagation"](), v192(), v190());
      },
    ),
      document["getElementById"]("btnTutorial")?.["addEventListener"](
        "click",
        (v194) => {
          (v194["stopPropagation"](), v192(), showTutorialVideoPanel(v13));
        },
      ),
      document["querySelectorAll"]("#btnGithubOfficial, #btnFeatureFeedback")[
        "forEach"
      ]((v195) => {
        v195["addEventListener"]("click", () => {
          v192();
        });
      }),
      v187?.["addEventListener"]("click", v191),
      v186?.["addEventListener"]("click", (v196) => {
        if (v196["target"] === v186) v191();
      }));
    let v197 = 0,
      v198 = null;
    v189?.["addEventListener"]("click", () => {
      (v197++, clearTimeout(v198));
      if (v197 >= 7)
        ((v197 = 0),
          (window["DEV_MODE"] = !window["DEV_MODE"]),
          document["body"]["classList"]["toggle"](
            "dev-mode",
            window["DEV_MODE"],
          ),
          window["dispatchEvent"](
            new CustomEvent("dev-mode-changed", {
              detail: { enabled: window["DEV_MODE"] },
            }),
          ),
          v191(),
          window["showToast"]?.(
            window["DEV_MODE"] ? "已进入开发者模式" : "已返回常规模式",
          ));
      else
        v197 >= 4 &&
          window["showToast"]?.(
            "再点 " +
              (7 - v197) +
              "\x20次" +
              (window["DEV_MODE"] ? "返回常规模式" : "进入开发者模式"),
          );
      v198 = setTimeout(() => {
        v197 = 0;
      }, 2000);
    });
  }
  function v199() {
    (v14(), v133(), v168(), v185());
  }
  return { init: v199 };
}
