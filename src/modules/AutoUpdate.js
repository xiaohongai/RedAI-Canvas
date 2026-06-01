import {
  applyUpdateFromServer,
  checkLocalUpdatePreviewFromServer,
  checkUpdateFromServer,
  pingUpdateCheckFromServer,
} from "../../api/updateApi.js";
import { openExternalLink } from "../services/externalLinkService.js";
const CHECK_INTERVAL = 60 * 60 * 1000,
  FALLBACK_RELEASE_URL =
    "https://github.com/xiaohongai/RedAI-Canvas/releases/latest",
  _NS = "http://www.w3.org/2000/svg";
let _dismissedSignature = "",
  _activeBannerInfo = null,
  _desktopUpdateInfo = null,
  _desktopUpdateUnsubscribe = null,
  _desktopUpdaterActive = false,
  _desktopInstallAfterDownload = false;
function _getUpdateSignature(v0) {
  if (!v0 || typeof v0 !== "object") return "";
  return [
    v0["previewOnly"] ? "preview" : "update",
    v0["localVersion"] || "",
    v0["remoteVersion"] || "",
    v0["downloadUrl"] || "",
    v0["previewVideoUrl"] || "",
    v0["notes"] || "",
  ]["join"]("|");
}
function _removeBanner() {
  const v1 = document["getElementById"]("update-banner"),
    v2 = document["getElementById"]("update-banner-backdrop");
  (v1?.["classList"]?.["remove"]?.("open"),
    v2?.["classList"]?.["remove"]?.("open"),
    v1?.["remove"]?.(),
    v2?.["remove"]?.(),
    (_activeBannerInfo = null),
    document["removeEventListener"]("keydown", _handleBannerKeydown));
}
function _dismissBanner(v3) {
  (_removeBanner(), (_dismissedSignature = _getUpdateSignature(v3)));
}
function _handleBannerKeydown(v4) {
  if (v4["key"] !== "Escape" || !document["getElementById"]("update-banner"))
    return;
  (v4["preventDefault"](), _removeBanner());
}
function _createSvgIcon(v5, v6 = {}) {
  const v7 = document["createElementNS"](_NS, "svg");
  if (v6["spin"]) v7["classList"]["add"]("spin");
  (v7["setAttribute"]("viewBox", "0 0 24 24"),
    v7["setAttribute"]("fill", "none"),
    v7["setAttribute"]("stroke", "currentColor"),
    v7["setAttribute"]("stroke-width", "2.2"),
    v7["setAttribute"]("stroke-linecap", "round"),
    v7["setAttribute"]("stroke-linejoin", "round"));
  const v8 = document["createElementNS"](_NS, "path");
  return (v8["setAttribute"]("d", v5), v7["appendChild"](v8), v7);
}
function _createSpinSvg(v9) {
  const v10 = _createSvgIcon("M21\x2012a9\x209\x200\x201\x201-6.219-8.56", {
      spin: v9,
    }),
    v11 = document["createElementNS"](_NS, "polyline");
  return (
    v11["setAttribute"]("points", "16\x203\x2021\x203\x2021\x208"),
    v10["appendChild"](v11),
    v10
  );
}
function _createDownloadSvg() {
  const v12 = document["createElementNS"](_NS, "svg");
  return (
    v12["setAttribute"]("viewBox", "0 0 24 24"),
    v12["setAttribute"]("fill", "none"),
    v12["setAttribute"]("stroke", "currentColor"),
    v12["setAttribute"]("stroke-width", "2.2"),
    v12["setAttribute"]("stroke-linecap", "round"),
    v12["setAttribute"]("stroke-linejoin", "round"),
    [
      "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
      "M7\x2010l5\x205\x205-5",
      "M12 15V3",
    ]["forEach"]((v13) => {
      const v14 = document["createElementNS"](_NS, "path");
      (v14["setAttribute"]("d", v13), v12["appendChild"](v14));
    }),
    v12
  );
}
function _createUpdateSvg() {
  const v15 = document["createElementNS"](_NS, "svg");
  return (
    v15["setAttribute"]("viewBox", "0 0 24 24"),
    v15["setAttribute"]("fill", "none"),
    v15["setAttribute"]("stroke", "currentColor"),
    v15["setAttribute"]("stroke-width", "2.2"),
    v15["setAttribute"]("stroke-linecap", "round"),
    v15["setAttribute"]("stroke-linejoin", "round"),
    [
      "M12 16V4",
      "M7\x209l5-5\x205\x205",
      "M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
    ]["forEach"]((v16) => {
      const v17 = document["createElementNS"](_NS, "path");
      (v17["setAttribute"]("d", v16), v15["appendChild"](v17));
    }),
    v15
  );
}
function _setBtnContent(v18, v19, v20) {
  if (!v18) return;
  (v18["replaceChildren"](),
    v18["appendChild"](v19 ? _createSpinSvg(true) : _createDownloadSvg()),
    v18["appendChild"](document["createTextNode"]("\x20" + v20)));
}
function _formatPercent(v21) {
  const v22 = Math["max"](0, Math["min"](100, Number(v21 || 0)));
  return Math["round"](v22) + "%";
}
function _formatPubDate(v23) {
  if (!v23) return "";
  const v24 = new Date(v23);
  if (Number["isNaN"](v24["getTime"]())) return String(v23);
  return v24["toLocaleString"]("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function _decodeHtmlText(v25) {
  const v26 = String(v25 || "");
  if (!v26) return "";
  const v27 = document["createElement"]("textarea");
  return ((v27["innerHTML"] = v26), v27["value"]);
}
function _htmlNotesToText(v28) {
  let v29 = String(v28 || "")["trim"]();
  if (!/<\/?[a-z][\s\S]*>/i["test"](v29)) return v29;
  return (
    (v29 = v29["replace"](/<br\s*\/?>/gi, "\x0a")
      ["replace"](
        /<\/(?:p|div|h[1-6]|li|ul|ol|section|article|blockquote)>/gi,
        "\x0a",
      )
      ["replace"](/<li[^>]*>/gi, "-\x20")
      ["replace"](/<[^>]+>/g, "")),
    _decodeHtmlText(v29)
  );
}
function _buildNotesText(v30) {
  const v31 = _htmlNotesToText(v30)
    ["split"](/\r?\n/)
    ["map"]((v32) => v32["trim"]())
    ["filter"](Boolean);
  if (!v31["length"]) return "本次更新未提供详细说明。";
  return v31["join"]("\x0a");
}
function _cleanNotesHeading(v33) {
  return String(v33 || "")
    ["replace"](/^[\s#*>\-•]+/, "")
    ["replace"](/^[🎉✨🐛🔧✅⚠️📌]+\s*/u, "")
    ["replace"](/[：:]\s*$/, "")
    ["trim"]();
}
function _isVersionTitleLine(v34) {
  return /^(?:🎉\s*)?v?\d+(?:\.\d+){1,3}\s*版本更新/u["test"](
    String(v34 || "")
      ["trim"]()
      ["toLowerCase"](),
  );
}
function _isReleaseFooterLine(v35) {
  const v36 = String(v35 || "")["trim"]();
  if (!v36) return false;
  return (
    /^RedAI-Canvas[！!]/u["test"](v36) ||
    /^注[：:]/u["test"](v36) ||
    /^BUG问题/u["test"](v36) ||
    /^https?:\/\//i["test"](v36) ||
    /反馈文档[：:]/u["test"](v36)
  );
}
function _isReleaseMetaLine(v37) {
  return /^\[[a-zA-Z][a-zA-Z0-9_-]*\]\s*:/u["test"](
    String(v37 || "")["trim"](),
  );
}
function _parseUpdateNotes(v38) {
  const v39 = _buildNotesText(v38)
      ["split"](/\r?\n/)
      ["map"]((v40) => v40["trim"]())
      ["filter"](Boolean)
      ["filter"]((v41) => !_isVersionTitleLine(v41))
      ["filter"]((v42) => !_isReleaseMetaLine(v42)),
    v43 = [],
    v44 = [],
    v45 = [];
  let v46 = null,
    v47 = false;
  const v48 = (v49 = "更新内容") => {
    return (
      !v46 &&
        ((v46 = { title: v49, items: [], paragraphs: [] }), v44["push"](v46)),
      v46
    );
  };
  return (
    v39["forEach"]((v50) => {
      if (v47 || _isReleaseFooterLine(v50)) {
        ((v47 = true), v45["push"](v50));
        return;
      }
      const v51 = /^[-*•]\s+/["test"](v50),
        v52 = v50["replace"](/^[-*•]\s+/, "")["trim"](),
        v53 = _cleanNotesHeading(v50),
        v54 =
          !v51 &&
          /[：:]$/["test"](v50) &&
          /新增|修复|优化|更新|说明|注意|已知|内容/u["test"](v53);
      if (v54 && v53) {
        ((v46 = { title: v53, items: [], paragraphs: [] }), v44["push"](v46));
        return;
      }
      if (!v46 && !v51) {
        v43["push"](v50);
        return;
      }
      const v55 = v48();
      if (v51 && v52) {
        v55["items"]["push"](v52);
        return;
      }
      v55["paragraphs"]["push"](v50);
    }),
    {
      intro: v43,
      sections: v44["length"]
        ? v44
        : [
            {
              title: "更新内容",
              items: ["本次更新未提供详细说明。"],
              paragraphs: [],
            },
          ],
      footer: v45,
    }
  );
}
function _appendTextWithLinks(v56, v57) {
  const v58 = String(v57 || ""),
    v59 = /(https?:\/\/[^\s]+)/gi;
  let v60 = 0,
    v61 = v59["exec"](v58);
  while (v61) {
    v61["index"] > v60 &&
      v56["appendChild"](
        document["createTextNode"](v58["slice"](v60, v61["index"])),
      );
    const v62 = v61[0]["replace"](/[),.;，。；）]+$/u, ""),
      v63 = v61[0]["slice"](v62["length"]),
      v64 = document["createElement"]("a");
    ((v64["className"] = "update-banner-note-link"),
      (v64["href"] = v62),
      (v64["dataset"]["externalUrl"] = v62),
      (v64["textContent"] = v62),
      v56["appendChild"](v64));
    if (v63) v56["appendChild"](document["createTextNode"](v63));
    ((v60 = v61["index"] + v61[0]["length"]), (v61 = v59["exec"](v58)));
  }
  v60 < v58["length"] &&
    v56["appendChild"](document["createTextNode"](v58["slice"](v60)));
}
function _createNotesPanel(v65) {
  const v66 = _parseUpdateNotes(v65),
    v67 = document["createElement"]("div");
  ((v67["className"] = "update-banner-notes"),
    (v67["id"] = "update-banner-notes"));
  const v68 = document["createElement"]("div");
  ((v68["className"] = "update-banner-section-title"),
    (v68["textContent"] = "更新内容"));
  const v69 = document["createElement"]("div");
  v69["className"] = "update-banner-notes-scroll";
  if (v66["intro"]["length"]) {
    const v70 = document["createElement"]("div");
    ((v70["className"] = "update-banner-note-intro"),
      v66["intro"]["forEach"]((v71) => {
        const v72 = document["createElement"]("p");
        ((v72["className"] = "update-banner-note-paragraph"),
          _appendTextWithLinks(v72, v71),
          v70["appendChild"](v72));
      }),
      v69["appendChild"](v70));
  }
  v66["sections"]["forEach"]((v73) => {
    const v74 = document["createElement"]("section");
    v74["className"] = "update-banner-note-section";
    const v75 = document["createElement"]("div");
    ((v75["className"] = "update-banner-note-heading"),
      (v75["textContent"] = v73["title"]),
      v74["appendChild"](v75),
      v73["paragraphs"]["forEach"]((v76) => {
        const v77 = document["createElement"]("p");
        ((v77["className"] = "update-banner-note-paragraph"),
          _appendTextWithLinks(v77, v76),
          v74["appendChild"](v77));
      }));
    if (v73["items"]["length"]) {
      const v78 = document["createElement"]("ul");
      ((v78["className"] = "update-banner-note-list"),
        v73["items"]["forEach"]((v79) => {
          const v80 = document["createElement"]("li");
          (_appendTextWithLinks(v80, v79), v78["appendChild"](v80));
        }),
        v74["appendChild"](v78));
    }
    v69["appendChild"](v74);
  });
  if (v66["footer"]["length"]) {
    const v81 = document["createElement"]("section");
    v81["className"] = "update-banner-note-footer";
    const v82 = document["createElement"]("div");
    ((v82["className"] = "update-banner-note-footer-title"),
      (v82["textContent"] = "发布说明"),
      v81["appendChild"](v82),
      v66["footer"]["forEach"]((v83) => {
        const v84 = document["createElement"]("p");
        ((v84["className"] = "update-banner-note-paragraph"),
          _appendTextWithLinks(v84, v83),
          v81["appendChild"](v84));
      }),
      v69["appendChild"](v81));
  }
  return (v67["appendChild"](v68), v67["appendChild"](v69), v67);
}
function _normalizeHttpUrl(v85) {
  const v86 = String(v85 || "")["trim"]();
  if (!v86) return "";
  const v87 = v86["startsWith"]("//") ? "https:" + v86 : v86;
  if (!/^https?:\/\//i["test"](v87)) return "";
  try {
    const v88 = new URL(v87);
    if (v88["protocol"] !== "http:" && v88["protocol"] !== "https:") return "";
    return v88["toString"]();
  } catch (v89) {
    return "";
  }
}
function _isDirectVideoUrl(v90) {
  try {
    return /\.(mp4|webm|ogg|m4v|mov)$/i["test"](new URL(v90)["pathname"]);
  } catch (v91) {
    return false;
  }
}
function _isBilibiliHost(v92) {
  const v93 = String(v92 || "")["toLowerCase"]();
  return v93 === "bilibili.com" || v93["endsWith"](".bilibili.com");
}
function _buildBilibiliPlayerUrl(v94) {
  try {
    const v95 = new URL(v94);
    if (!_isBilibiliHost(v95["hostname"])) return "";
    if (v95["hostname"]["toLowerCase"]() === "player.bilibili.com")
      return (v95["searchParams"]["set"]("autoplay", "0"), v95["toString"]());
    const v96 = v95["pathname"]["match"](/\/video\/(BV[a-zA-Z0-9]+)/),
      v97 = v95["pathname"]["match"](/\/video\/av(\d+)/i);
    if (!v96 && !v97) return "";
    const v98 = new URL("https://player.bilibili.com/player.html");
    return (
      v96
        ? v98["searchParams"]["set"]("bvid", v96[1])
        : v98["searchParams"]["set"]("aid", v97[1]),
      v98["searchParams"]["set"](
        "page",
        v95["searchParams"]["get"]("p") || "1",
      ),
      v98["searchParams"]["set"]("autoplay", "0"),
      v98["toString"]()
    );
  } catch (v99) {
    return "";
  }
}
function _createPreviewVideo(v100) {
  const v101 = _normalizeHttpUrl(
    v100?.["previewVideoUrl"] || v100?.["preview_video_url"],
  );
  if (!v101) return null;
  const v102 = document["createElement"]("div");
  v102["className"] = "update-banner-video-wrap";
  const v103 = document["createElement"]("div");
  v103["className"] = "update-banner-video-shell";
  if (_isDirectVideoUrl(v101)) {
    const v104 = document["createElement"]("video");
    return (
      (v104["className"] = "update-banner-video"),
      (v104["controls"] = true),
      (v104["playsInline"] = true),
      (v104["preload"] = "metadata"),
      (v104["src"] = v101),
      v103["appendChild"](v104),
      v102["appendChild"](v103),
      v102
    );
  }
  const v105 = document["createElement"]("iframe");
  return (
    (v105["className"] = "update-banner-video-frame"),
    (v105["src"] = _buildBilibiliPlayerUrl(v101) || v101),
    (v105["loading"] = "lazy"),
    (v105["allow"] = "autoplay; fullscreen; picture-in-picture"),
    (v105["allowFullscreen"] = true),
    (v105["referrerPolicy"] = "no-referrer-when-downgrade"),
    v103["appendChild"](v105),
    v102["appendChild"](v103),
    v102
  );
}
function _createTutorialVideoList(v106) {
  const v107 = Array["isArray"](v106) ? v106 : [],
    v108 = v107["map"]((v109) => ({
      title: String(v109?.["title"] || "")["trim"](),
      url: String(v109?.["url"] || "")["trim"](),
    }))["filter"]((v110) => v110["title"] && _normalizeHttpUrl(v110["url"]));
  if (!v108["length"]) return null;
  const v111 = document["createElement"]("div");
  return (
    (v111["className"] = "update-banner-video-list"),
    v108["forEach"]((v112) => {
      const v113 = document["createElement"]("section");
      v113["className"] = "update-banner-video-item";
      const v114 = document["createElement"]("div");
      ((v114["className"] = "update-banner-video-item-title"),
        (v114["textContent"] = v112["title"]));
      const v115 = _createPreviewVideo({ previewVideoUrl: v112["url"] });
      v113["appendChild"](v114);
      if (v115) v113["appendChild"](v115);
      v111["appendChild"](v113);
    }),
    v111
  );
}
function _openDownload(v116) {
  const v117 =
    v116?.["downloadUrl"] || v116?.["releaseUrl"] || FALLBACK_RELEASE_URL;
  void openExternalLink(v117, { label: "更新下载" })["catch"](() => {
    window["showToast"]?.("无法打开下载链接", "error");
  });
}
function _openReleasePage(v118) {
  const v119 = v118?.["releaseUrl"] || FALLBACK_RELEASE_URL;
  void openExternalLink(v119, { label: "发布页面" })["catch"](() => {
    window["showToast"]?.("无法打开发布页面", "error");
  });
}
function _setDownloadFallback(v120, v121) {
  const v122 = document["getElementById"]("update-banner-btn"),
    v123 = document["getElementById"]("update-banner-sub");
  (v123 &&
    v121 &&
    ((v123["textContent"] = v121), v123["classList"]["add"]("is-error")),
    v122?.["classList"]?.["add"]?.("is-download"),
    _setBtnContent(v122, false, "下载最新版本"),
    v122 &&
      ((v122["disabled"] = false),
      (v122["onclick"] = () => _openDownload(v120))));
}
function _setUpdateProgress(v124, v125 = "") {
  const v126 = document["getElementById"]("update-banner-progress"),
    v127 = document["getElementById"]("update-banner-progress-bar"),
    v128 = document["getElementById"]("update-banner-progress-text");
  if (!v126 || !v127 || !v128) return;
  const v129 = _formatPercent(v124);
  ((v126["hidden"] = false),
    (v127["style"]["width"] = v129),
    (v128["textContent"] = v125 || "正在下载更新 " + v129));
}
function _setDesktopDownloadInPlace(
  v130 = {},
  { retrying: retrying = false } = {},
) {
  const v131 = document["getElementById"]("update-banner");
  if (!v131) return false;
  const v132 = document["getElementById"]("update-banner-sub"),
    v133 = document["getElementById"]("update-banner-btn"),
    v134 = document["getElementById"]("update-banner-close"),
    v135 = Number(v130["retryCount"] || 0),
    v136 = retrying
      ? "下载失败，正在第\x20" + v135 + " 次重试..."
      : "正在下载更新 0%";
  v132 &&
    (v132["classList"]["remove"]("is-error"),
    (v132["textContent"] = retrying
      ? "下载遇到问题，正在自动重试。"
      : "正在下载新版本，下载完成后将自动重启安装。"));
  (_setUpdateProgress(0, v136),
    _setBtnContent(v133, true, retrying ? "正在重试..." : "正在下载..."));
  if (v133) v133["disabled"] = true;
  if (v134) v134["disabled"] = true;
  return true;
}
function _showBanner(v137, v138 = {}) {
  if (v138["replace"]) _removeBanner();
  if (
    !v138["ignoreDismissed"] &&
    _dismissedSignature === _getUpdateSignature(v137)
  )
    return;
  if (document["getElementById"]("update-banner")) return;
  const v139 = v137["hasUpdate"] !== false,
    v140 = v137["remoteVersion"] || "新版本",
    v141 = v137["localVersion"] || "当前版本",
    v142 = _formatPubDate(v137["pubDate"]),
    v143 = Boolean(v137["previewOnly"]),
    v144 = document["createElement"]("div");
  ((v144["id"] = "update-banner"), (v144["className"] = "update-banner"));
  const v145 = document["createElement"]("div");
  ((v145["id"] = "update-banner-backdrop"),
    (v145["className"] = "update-banner-backdrop"),
    v145["setAttribute"]("aria-hidden", "true"));
  const v146 = document["createElement"]("div");
  v146["className"] = "update-banner-header";
  const v147 = document["createElement"]("span");
  ((v147["className"] = "update-banner-icon"),
    v147["setAttribute"]("aria-hidden", "true"),
    v147["appendChild"](_createUpdateSvg()));
  const v148 = document["createElement"]("div");
  v148["className"] = "update-banner-header-title";
  if (v137["titleText"]) v148["textContent"] = v137["titleText"];
  else {
    const v149 = document["createElement"]("span");
    ((v149["textContent"] = "版本更新 " + v140), v148["appendChild"](v149));
    if (v141) {
      const v150 = document["createElement"]("span");
      ((v150["className"] = "update-banner-header-current"),
        (v150["textContent"] = " | 当前版本：" + v141),
        v148["appendChild"](v150));
    }
  }
  const v151 = document["createElement"]("button");
  ((v151["type"] = "button"),
    (v151["className"] = "update-banner-close"),
    (v151["id"] = "update-banner-close"),
    v151["setAttribute"]("aria-label", "关闭更新提示"),
    (v151["title"] = "关闭"),
    (v151["textContent"] = "×"),
    v146["appendChild"](v147),
    v146["appendChild"](v148),
    v146["appendChild"](v151));
  const v152 = document["createElement"]("div");
  v152["className"] = "update-banner-text";
  const v153 = document["createElement"]("div");
  ((v153["className"] = "update-banner-sub"),
    (v153["id"] = "update-banner-sub"),
    (v153["textContent"] =
      v137["subtitleText"] ||
      (v143
        ? "当前版本 " + v141 + "。"
        : v142
          ? "当前版本 " + v141 + "。发布时间\x20" + v142 + "。"
          : v139
            ? "当前版本 " + v141 + "。"
            : "当前版本 " + v141 + "，线上版本 " + v140 + "。")));
  const v154 = document["createElement"]("div");
  ((v154["className"] = "update-banner-progress"),
    (v154["id"] = "update-banner-progress"),
    (v154["hidden"] = !v137["showProgress"]));
  const v155 = document["createElement"]("div");
  v155["className"] = "update-banner-progress-track";
  const v156 = document["createElement"]("div");
  ((v156["className"] = "update-banner-progress-bar"),
    (v156["id"] = "update-banner-progress-bar"),
    (v156["style"]["width"] = _formatPercent(v137["progressPercent"])));
  const v157 = document["createElement"]("div");
  ((v157["className"] = "update-banner-progress-text"),
    (v157["id"] = "update-banner-progress-text"),
    (v157["textContent"] =
      v137["progressText"] ||
      "正在下载更新 " + _formatPercent(v137["progressPercent"])),
    v155["appendChild"](v156),
    v154["appendChild"](v155),
    v154["appendChild"](v157));
  const v158 = _createNotesPanel(v137["notes"]),
    v159 = _createPreviewVideo(v137),
    v160 = _createTutorialVideoList(v137["tutorialVideos"]);
  if (!v137["hideSubtitle"]) v152["appendChild"](v153);
  v152["appendChild"](v154);
  if (v159) v152["appendChild"](v159);
  if (v160) v152["appendChild"](v160);
  if (!v137["hideNotes"]) v152["appendChild"](v158);
  const v161 = document["createElement"]("div");
  v161["className"] = "update-banner-actions";
  if (!v137["hideCancelButton"]) {
    const v162 = document["createElement"]("button");
    ((v162["type"] = "button"),
      (v162["className"] = "update-banner-btn update-banner-btn-secondary"),
      (v162["textContent"] = v137["cancelText"] || (v143 ? "关闭" : "取消")),
      (v162["onclick"] = () => {
        if (typeof v137["cancelAction"] === "function") {
          v137["cancelAction"](v137);
          return;
        }
        _removeBanner();
      }),
      v161["appendChild"](v162));
  }
  if (!v143 && v139 && !v137["disableSkip"]) {
    const v163 = document["createElement"]("button");
    ((v163["type"] = "button"),
      (v163["className"] = "update-banner-btn\x20update-banner-btn-secondary"),
      (v163["textContent"] = "跳过此版本"),
      (v163["onclick"] = () => _dismissBanner(v137)),
      v161["appendChild"](v163));
  }
  const v164 = document["createElement"]("button");
  ((v164["type"] = "button"),
    (v164["className"] = "update-banner-btn"),
    (v164["id"] = "update-banner-btn"));
  if (v143)
    (v164["classList"]["add"]("is-primary"),
      _setBtnContent(v164, false, v137["previewCloseText"] || "我知道了"),
      (v164["onclick"] = () => _removeBanner()));
  else {
    if (v137["installDownloadedUpdate"])
      (v164["classList"]["add"]("is-primary"),
        _setBtnContent(v164, false, "重启并安装"),
        (v164["onclick"] = () => _installDownloadedDesktopUpdate(v164)));
    else {
      if (v137["retryDesktopDownload"])
        (v164["classList"]["add"]("is-primary"),
          _setBtnContent(v164, false, "重试下载并安装"),
          (v164["onclick"] = () => _downloadDesktopUpdate(v164)));
      else {
        if (v137["startDesktopDownload"])
          (v164["classList"]["add"]("is-primary"),
            _setBtnContent(v164, false, "下载并安装"),
            (v164["onclick"] = () => _downloadDesktopUpdate(v164)));
        else {
          if (v137["canHotApply"])
            (v164["classList"]["add"]("is-primary"),
              _setBtnContent(v164, false, "立即更新"),
              (v164["onclick"] = () => _doApply(v137)));
          else
            !v139
              ? (v164["classList"]["add"]("is-download"),
                _setBtnContent(v164, false, "查看线上发布"),
                (v164["onclick"] = () => _openReleasePage(v137)))
              : (v164["classList"]["add"]("is-download"),
                _setBtnContent(v164, false, "下载最新版本"),
                (v164["onclick"] = () => _openDownload(v137)));
        }
      }
    }
  }
  (v161["appendChild"](v164),
    v144["appendChild"](v146),
    v144["appendChild"](v152),
    v144["appendChild"](v161),
    document["body"]["appendChild"](v145),
    document["body"]["appendChild"](v144),
    v145["classList"]["add"]("open"),
    v144["classList"]["add"]("open"),
    (_activeBannerInfo = v137),
    document["addEventListener"]("keydown", _handleBannerKeydown),
    (v151["onclick"] = () => _removeBanner()));
}
async function _downloadDesktopUpdate(v165) {
  const v166 = window["aiCanvasDesktop"];
  if (!v166?.["downloadUpdate"]) return;
  (_setBtnContent(v165, true, "准备下载..."),
    (v165["disabled"] = true),
    (_desktopInstallAfterDownload = true));
  try {
    await v166["downloadUpdate"]();
  } catch (v167) {
    ((_desktopInstallAfterDownload = false),
      (v165["disabled"] = false),
      _setBtnContent(v165, false, "下载并安装"),
      window["showToast"]?.("下载更新失败，请稍后再试"));
  }
}
async function _installDownloadedDesktopUpdate(v168) {
  const v169 = window["aiCanvasDesktop"];
  if (!v169?.["installDownloadedUpdate"]) return;
  _setBtnContent(v168, true, "正在重启...");
  if (v168) v168["disabled"] = true;
  try {
    await v169["installDownloadedUpdate"]();
  } catch (v170) {
    if (v168) v168["disabled"] = false;
    (_setBtnContent(v168, false, "重启并安装"),
      window["showToast"]?.("重启安装失败，请稍后再试"));
  }
}
async function _doApply(v171) {
  if (v171?.["previewOnly"]) {
    window["showToast"]?.("开发者模式预览：不会执行真实更新");
    return;
  }
  if (!v171?.["canHotApply"]) {
    _openDownload(v171);
    return;
  }
  const v172 = document["getElementById"]("update-banner-btn"),
    v173 = document["getElementById"]("update-banner-sub");
  (v173?.["classList"]?.["remove"]?.("is-error"),
    v172?.["classList"]?.["remove"]?.("is-download"),
    _setBtnContent(v172, true, "更新中..."));
  if (v172) v172["disabled"] = true;
  try {
    const v174 = await applyUpdateFromServer();
    if (v174["success"]) {
      _setBtnContent(v172, true, "重启中，请稍候...");
      const v175 = Date["now"]() + 30000,
        v176 = async () => {
          if (Date["now"]() > v175) {
            location["reload"]();
            return;
          }
          try {
            const v177 = await pingUpdateCheckFromServer();
            if (v177) {
              location["reload"]();
              return;
            }
          } catch (v178) {}
          setTimeout(v176, 800);
        };
      setTimeout(v176, 2000);
      return;
    }
    _setDownloadFallback(
      v171,
      "热更新失败：" + (v174["error"] || "未知错误，请手动下载最新版本"),
    );
  } catch (v179) {
    _setDownloadFallback(v171, "网络错误，请手动下载最新版本");
  }
}
async function _checkUpdate() {
  if (window["aiCanvasDesktop"]?.["isElectron"] || _desktopUpdaterActive)
    return;
  try {
    const v180 = await checkUpdateFromServer();
    if (v180?.["hasUpdate"]) _showBanner(v180);
  } catch (v181) {}
}
function _normalizeDesktopUpdateInfo(v182) {
  const v183 = v182 && typeof v182 === "object" ? v182 : {};
  return {
    version: String(v183["version"] || "")["trim"](),
    releaseDate: v183["releaseDate"] || "",
    releaseNotes: String(v183["releaseNotes"] || "")["trim"](),
    previewVideoUrl: String(
      v183["previewVideoUrl"] || v183["preview_video_url"] || "",
    )["trim"](),
  };
}
async function _getDesktopLocalVersion() {
  try {
    const v184 = await window["aiCanvasDesktop"]?.["getAppVersion"]?.();
    return v184 ? "V" + v184 : "未知版本";
  } catch (v185) {
    return "未知版本";
  }
}
async function _showDesktopUpdateBanner(v186, v187 = {}) {
  const v188 = _normalizeDesktopUpdateInfo(v187["info"] || _desktopUpdateInfo);
  if (v188["version"]) _desktopUpdateInfo = v188;
  const v189 = v188["version"] || "新版本",
    v190 = await _getDesktopLocalVersion(),
    v191 = v189["startsWith"]("V") ? v189 : "V" + v189,
    v192 =
      v188["releaseNotes"] || "应用更新已下载完成。点击立即重启后将完成安装。",
    v193 = v186 === "downloaded",
    v194 = v186 === "downloading",
    v195 = v186 === "retrying",
    v196 = Number(v187["percent"] || 0),
    v197 = v195
      ? "下载失败，正在第\x20" + Number(v187["retryCount"] || 0) + " 次重试..."
      : "正在下载更新 " + _formatPercent(v196);
  _showBanner(
    {
      hasUpdate: true,
      localVersion: v190,
      remoteVersion: v191,
      pubDate: v188["releaseDate"] || "",
      subtitleText: v193
        ? "当前版本 " +
          v190 +
          "。新版本 " +
          v191 +
          " 已下载完成，重启应用后将自动完成安装。"
        : v194 || v195
          ? "当前版本 " + v190 + "。正在下载新版本 " + v191 + "。"
          : "当前版本\x20" + v190 + "。新版本\x20" + v191 + " 已可用。",
      notes: v192,
      previewVideoUrl: v193 ? "" : v188["previewVideoUrl"],
      canHotApply: false,
      startDesktopDownload: !v193 && !v194 && !v195,
      installDownloadedUpdate: v193,
      showProgress: v194 || v195,
      hideNotes: v193,
      progressPercent: v196,
      progressText: v197,
      cancelText: v193 ? "稍后" : "取消",
      disableSkip: true,
      hideSubtitle: false,
    },
    { replace: true, ignoreDismissed: true },
  );
}
async function _showDesktopDownloadFailedBanner(v198 = {}) {
  const v199 = _normalizeDesktopUpdateInfo(v198["info"] || _desktopUpdateInfo);
  if (v199["version"]) _desktopUpdateInfo = v199;
  const v200 = v199["version"] || "新版本",
    v201 = await _getDesktopLocalVersion(),
    v202 = v200["startsWith"]("V") ? v200 : "V" + v200,
    v203 = Number(v198["retryCount"] || 0),
    v204 = Number(v198["maxRetries"] || 0),
    v205 =
      v198["message"] || "下载更新失败，请稍后重试，或打开发布页手动下载。";
  _showBanner(
    {
      hasUpdate: true,
      localVersion: v201,
      remoteVersion: v202,
      pubDate: v199["releaseDate"] || "",
      subtitleText: v204
        ? v205 + " 已自动重试 " + v203 + "/" + v204 + " 次。"
        : v205,
      notes:
        v199["releaseNotes"] || "可以重试下载，或打开发布页手动下载安装包。",
      previewVideoUrl: "",
      canHotApply: false,
      retryDesktopDownload: true,
      showProgress: false,
      hideNotes: true,
      cancelText: "查看发布页",
      cancelAction: () =>
        _openReleasePage({ releaseUrl: FALLBACK_RELEASE_URL }),
      disableSkip: true,
      hideSubtitle: false,
    },
    { replace: true, ignoreDismissed: true },
  );
}
function _desktopEventFromState(v206 = {}) {
  if (v206["latestEvent"]) return v206["latestEvent"];
  if (!v206["state"] || v206["state"] === "idle") return null;
  const v207 = {
      checking: "checking",
      available: "available",
      downloading: "download-started",
      downloaded: "downloaded",
      error: "download-failed",
      installing: "installing",
    },
    v208 = v207[v206["state"]];
  if (!v208) return null;
  return {
    type: v208,
    state: v206["state"],
    info: v206["latestInfo"] || null,
    retryCount: v206["retryCount"] || 0,
    maxRetries: v206["maxRetries"] || 0,
  };
}
function _handleDesktopUpdaterEvent(v209) {
  if (!v209 || typeof v209 !== "object") return;
  if (v209["type"] === "checking") {
    _desktopUpdaterActive = true;
    return;
  }
  if (v209["type"] === "available") {
    ((_desktopUpdaterActive = true),
      void _showDesktopUpdateBanner("available", v209));
    return;
  }
  if (v209["type"] === "download-started") {
    _desktopUpdaterActive = true;
    if (_setDesktopDownloadInPlace(v209)) return;
    void _showDesktopUpdateBanner("downloading", v209);
    return;
  }
  if (v209["type"] === "download-retry") {
    _desktopUpdaterActive = true;
    if (_setDesktopDownloadInPlace(v209, { retrying: true })) return;
    void _showDesktopUpdateBanner("retrying", v209);
    return;
  }
  if (v209["type"] === "download-progress") {
    _desktopUpdaterActive = true;
    if (!document["getElementById"]("update-banner-progress")) {
      void _showDesktopUpdateBanner("downloading", v209);
      return;
    }
    _setUpdateProgress(
      v209["percent"],
      "正在下载更新 " + _formatPercent(v209["percent"]),
    );
    return;
  }
  if (v209["type"] === "downloaded") {
    _desktopUpdaterActive = true;
    if (_desktopInstallAfterDownload) {
      _desktopInstallAfterDownload = false;
      const v210 = document["getElementById"]("update-banner-btn"),
        v211 = document["getElementById"]("update-banner-sub");
      v211 &&
        (v211["classList"]["remove"]("is-error"),
        (v211["textContent"] = "更新已下载完成，正在重启安装。"));
      _setBtnContent(v210, true, "正在重启安装...");
      if (v210) v210["disabled"] = true;
      void _installDownloadedDesktopUpdate(v210);
      return;
    }
    void _showDesktopUpdateBanner("downloaded", v209);
    return;
  }
  if (v209["type"] === "download-failed") {
    ((_desktopUpdaterActive = true),
      (_desktopInstallAfterDownload = false),
      void _showDesktopDownloadFailedBanner(v209));
    return;
  }
  if (v209["type"] === "not-available") {
    _desktopUpdaterActive = false;
    if (v209["manual"]) window["showToast"]?.("当前已是最新版本");
    return;
  }
  if (v209["type"] === "installing") {
    ((_desktopUpdaterActive = true),
      window["showToast"]?.("正在重启安装更新..."));
    return;
  }
  if (v209["type"] === "error") {
    if (v209["skipped"]) return;
    ((_desktopInstallAfterDownload = false),
      window["showToast"]?.(v209["message"] || "应用更新失败，请稍后再试"));
  }
}
function _bindDesktopUpdaterEvents() {
  const v212 = window["aiCanvasDesktop"];
  if (!v212?.["onUpdaterEvent"] || _desktopUpdateUnsubscribe) return;
  ((_desktopUpdateUnsubscribe = v212["onUpdaterEvent"](
    _handleDesktopUpdaterEvent,
  )),
    void v212["getUpdateState"]?.()
      ["then"]((v213) => {
        const v214 = _desktopEventFromState(v213);
        if (v214) _handleDesktopUpdaterEvent(v214);
      })
      ["catch"](() => {}));
}
export function initAutoUpdate() {
  (_bindDesktopUpdaterEvents(),
    setTimeout(_checkUpdate, 5000),
    setTimeout(_checkUpdate, 20000),
    setInterval(_checkUpdate, CHECK_INTERVAL));
}
export async function showManualUpdateCheck() {
  if (window["aiCanvasDesktop"]?.["isElectron"]) {
    try {
      (window["showToast"]?.("正在检查桌面更新..."),
        await window["aiCanvasDesktop"]["checkForUpdates"]?.());
    } catch (v215) {
      window["showToast"]?.("桌面更新检查失败，请稍后再试");
    }
    return;
  }
  try {
    window["showToast"]?.("正在检查真实更新...");
    const v216 = await checkUpdateFromServer({
      force: true,
      includeCurrent: true,
    });
    if (v216?.["remoteVersion"] || v216?.["notes"] || v216?.["releaseUrl"]) {
      _showBanner(v216, { replace: true, ignoreDismissed: true });
      return;
    }
    window["showToast"]?.("没有获取到线上更新信息");
  } catch (v217) {
    window["showToast"]?.("真实更新检查失败，请稍后再试");
  }
}
export async function showLocalUpdatePreview() {
  try {
    window["showToast"]?.("正在生成本地更新预览...");
    const v218 = await checkLocalUpdatePreviewFromServer();
    if (v218?.["previewOnly"] && (v218?.["remoteVersion"] || v218?.["notes"])) {
      _showBanner(v218, { replace: true, ignoreDismissed: true });
      return;
    }
    window["showToast"]?.("没有获取到本地更新预览内容");
  } catch (v219) {
    window["showToast"]?.("本地更新预览生成失败，请稍后再试");
  }
}
export function showTutorialVideoPanel(v220) {
  const v221 = Array["isArray"](v220)
    ? v220
    : [{ title: "使用说明：", url: v220 }];
  _showBanner(
    {
      previewOnly: true,
      hasUpdate: false,
      localVersion: "",
      remoteVersion: "使用教程",
      titleText: "使用教程",
      subtitleText: "选择教程视频播放",
      notes: "",
      tutorialVideos: v221,
      canHotApply: false,
      hideNotes: true,
      hideCancelButton: true,
      previewCloseText: "关闭",
    },
    { replace: true, ignoreDismissed: true },
  );
}
