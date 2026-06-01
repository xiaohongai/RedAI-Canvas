import { readNodeMediaMetricsDataset } from "../modules/nodeMediaMetrics.js";
const _staticInnerHtmlRegistry = new Map([
    [
      "cpdProjectItemIcon16",
      "<svg\x20width=\x2216\x22\x20height=\x2216\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22var(--indigo-text)\x22\x20stroke-width=\x222\x22><rect\x20x=\x223\x22\x20y=\x223\x22\x20width=\x2218\x22\x20height=\x2218\x22\x20rx=\x222\x22/><circle\x20cx=\x228.5\x22\x20cy=\x228.5\x22\x20r=\x221.5\x22/><polyline\x20points=\x2221\x2015\x2016\x2010\x205\x2021\x22/></svg>",
    ],
    [
      "iconTrash18",
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
    ],
    [
      "iconFolderOpen18",
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2"/><path d="M3 10h18l-2 8a2 2 0 0 1-2 1.5H5a2 2 0 0 1-2-1.5Z"/></svg>',
    ],
    [
      "iconSaveAs18",
      "<svg\x20width=\x2218\x22\x20height=\x2218\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22><path\x20d=\x22M19\x2021H5a2\x202\x200\x200\x201-2-2V5a2\x202\x200\x200\x201\x202-2h11l5\x205v3\x22/><path\x20d=\x22M17\x2021v-8H7v8\x22/><path\x20d=\x22M7\x203v5h8\x22/><path\x20d=\x22M18\x2014v6\x22/><path\x20d=\x22M15\x2017h6\x22/></svg>",
    ],
  ]),
  _staticTemplateCache = new Map();
export function registerStaticInnerHTML(v0, v1) {
  if (typeof v0 !== "string" || !v0)
    throw new Error("templateId must be a non-empty string");
  if (typeof v1 !== "string") throw new Error("html must be a string");
  if (_staticInnerHtmlRegistry["has"](v0))
    throw new Error("Static HTML template already registered: " + v0);
  _staticInnerHtmlRegistry["set"](v0, v1);
}
export function setStaticInnerHTML(v2, v3) {
  if (!v2) return;
  const v4 = _staticTemplateCache["get"](v3);
  if (v4) {
    v2["replaceChildren"](v4["content"]["cloneNode"](true));
    return;
  }
  const v5 = _staticInnerHtmlRegistry["get"](v3);
  if (!v5) throw new Error("Unknown static HTML template: " + v3);
  if (typeof document === "undefined") {
    v2["innerHTML"] = v5;
    return;
  }
  const v6 = document["createElement"]("template");
  ((v6["innerHTML"] = v5),
    _staticTemplateCache["set"](v3, v6),
    v2["replaceChildren"](v6["content"]["cloneNode"](true)));
}
export function clearElement(v7) {
  if (!v7) return;
  v7["replaceChildren"]();
}
export function setText(v8, v9) {
  if (!v8) return;
  v8["textContent"] = v9 == null ? "" : String(v9);
}
export function setTextWithLineBreaks(v10, v11) {
  if (!v10) return;
  v10["replaceChildren"]();
  const v12 = v11 == null ? "" : String(v11),
    v13 = v12["split"]("\x0a");
  for (let v14 = 0; v14 < v13["length"]; v14++) {
    if (v14 > 0) v10["appendChild"](document["createElement"]("br"));
    v10["appendChild"](document["createTextNode"](v13[v14]));
  }
}
const _SVG_NS = "http://www.w3.org/2000/svg",
  _ALLOWED_SVG_TAGS = new Set([
    "svg",
    "g",
    "path",
    "rect",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
  ]),
  _ALLOWED_SVG_ATTRS = new Set([
    "viewBox",
    "width",
    "height",
    "fill",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-dasharray",
    "stroke-dashoffset",
    "opacity",
    "transform",
    "d",
    "x",
    "y",
    "x1",
    "y1",
    "x2",
    "y2",
    "cx",
    "cy",
    "r",
    "rx",
    "ry",
    "points",
    "xmlns",
    "class",
    "aria-hidden",
    "focusable",
  ]);
function _sanitizeSvgNode(v15) {
  if (!v15 || v15["nodeType"] !== Node["ELEMENT_NODE"]) return null;
  const v16 = String(v15["tagName"] || "")["toLowerCase"]();
  if (!_ALLOWED_SVG_TAGS["has"](v16)) return null;
  const v17 = document["createElementNS"](_SVG_NS, v16);
  for (const v18 of Array["from"](v15["attributes"] || [])) {
    const v19 = v18["name"],
      v20 = v18["value"];
    if (!v19) continue;
    const v21 = v19["toLowerCase"]();
    if (v21["startsWith"]("on")) continue;
    if (v21 === "href" || v21 === "xlink:href") continue;
    if (!_ALLOWED_SVG_ATTRS["has"](v19)) continue;
    v17["setAttribute"](v19, v20);
  }
  for (const v22 of Array["from"](v15["childNodes"] || [])) {
    if (v22["nodeType"] === Node["ELEMENT_NODE"]) {
      const v23 = _sanitizeSvgNode(v22);
      if (v23) v17["appendChild"](v23);
    }
  }
  return v17;
}
export function createSafeSvg(v24) {
  if (typeof v24 !== "string") return null;
  const v25 = v24["trim"]();
  if (!v25) return null;
  const v26 = new DOMParser()["parseFromString"](v25, "image/svg+xml");
  if (v26["querySelector"]("parsererror")) return null;
  const v27 = v26["documentElement"];
  if (!v27 || String(v27["tagName"] || "")["toLowerCase"]() !== "svg")
    return null;
  const v28 = _sanitizeSvgNode(v27);
  if (!v28) return null;
  if (!v28["getAttribute"]("focusable"))
    v28["setAttribute"]("focusable", "false");
  if (!v28["getAttribute"]("aria-hidden"))
    v28["setAttribute"]("aria-hidden", "true");
  return v28;
}
const _DANGEROUS_HTML_TAGS = new Set([
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "template",
  ]),
  _PROMPT_CONTAINER_TAGS = new Set(["div", "p"]),
  _RICH_TEXT_ALLOWED_TAGS = new Set([
    "h1",
    "h2",
    "h3",
    "p",
    "div",
    "br",
    "b",
    "strong",
    "i",
    "em",
    "ul",
    "ol",
    "li",
    "hr",
    "blockquote",
    "pre",
    "code",
  ]);
function _escapeHtmlText(v29) {
  return String(v29 ?? "")
    ["replace"](/&/g, "&amp;")
    ["replace"](/</g, "&lt;")
    ["replace"](/>/g, "&gt;");
}
function _escapeHtmlAttr(v30) {
  return _escapeHtmlText(v30)
    ["replace"](/"/g, "&quot;")
    ["replace"](/'/g, "&#39;");
}
function _stripHtmlTags(v31) {
  return String(v31 ?? "")["replace"](/<\/?[^>]+>/g, "");
}
function _stripDangerousHtml(v32) {
  let v33 = String(v32 ?? "");
  return (
    _DANGEROUS_HTML_TAGS["forEach"]((v34) => {
      const v35 = new RegExp(
          "<" + v34 + "\\b[^>]*>[\\s\\S]*?<\\/" + v34 + "\\s*>",
          "gi",
        ),
        v36 = new RegExp("<\\/?" + v34 + "\x5cb[^>]*\x5c/?>", "gi");
      ((v33 = v33["replace"](v35, "")), (v33 = v33["replace"](v36, "")));
    }),
    v33
  );
}
function _extractHtmlAttr(v37, v38) {
  const v39 = String(v37 ?? ""),
    v40 = String(v38 || "")["replace"](/[.*+?^${}()|[\]\\]/g, "\x5c$&"),
    v41 = new RegExp(v40 + "\\s*=\\s*(\"([^\"]*)\"|'([^']*)')", "i"),
    v42 = v39["match"](v41);
  if (v42) return v42[2] ?? v42[3] ?? "";
  const v43 = new RegExp(v40 + "\x5cs*=\x5cs*([^\x5cs\x22\x27>]+)", "i"),
    v44 = v39["match"](v43);
  return v44 ? (v44[1] ?? "") : "";
}
function _classAttrContains(v45, v46) {
  const v47 = _extractHtmlAttr(v45, "class");
  return String(v47 || "")
    ["split"](/\s+/)
    ["filter"](Boolean)
    ["includes"](String(v46 || ""));
}
function _replaceAllowedTagsWithTokens(v48, v49) {
  const v50 = [],
    v51 = (v52) => {
      const v53 = "__AIC_HTML_TOKEN_" + v50["length"] + "__";
      return (v50["push"](String(v52 ?? "")), v53);
    };
  let v54 = String(v48 ?? "");
  const v55 = (v56) => {
    const v57 = new RegExp("<" + v56 + "\\b[^>]*>", "gi"),
      v58 = new RegExp("<\\/" + v56 + "\\s*>", "gi");
    ((v54 = v54["replace"](v57, () => v51("<" + v56 + ">"))),
      (v54 = v54["replace"](v58, () => v51("</" + v56 + ">"))));
  };
  return (
    v49["forEach"]((v59) => {
      if (v59 === "br" || v59 === "hr") {
        const v60 = new RegExp("<" + v59 + "\\b[^>]*\\/?>", "gi");
        v54 = v54["replace"](v60, () => v51("<" + v59 + ">"));
        return;
      }
      v55(v59);
    }),
    {
      output: v54,
      restore() {
        return v54["replace"](/__AIC_HTML_TOKEN_(\d+)__/g, (v61, v62) => {
          const v63 = v50[Number(v62)];
          return typeof v63 === "string" ? v63 : "";
        });
      },
      pushToken: v51,
      setOutput(v64) {
        v54 = String(v64 ?? "");
      },
    }
  );
}
function _sanitizePromptHtmlWithoutDom(v65) {
  const v66 = _replaceAllowedTagsWithTokens(
    _stripDangerousHtml(v65),
    _PROMPT_CONTAINER_TAGS,
  );
  let v67 = v66["output"]
    ["replace"](/<span\b([^>]*)>([\s\S]*?)<\/span>/gi, (v68, v69, v70) => {
      if (!_classAttrContains(v69, "ref-pill")) return v70;
      const v71 = _extractHtmlAttr(v69, "data-label") || _stripHtmlTags(v70),
        v72 = _stripHtmlTags(v71)["replace"](/[×✕✖]/g, "")["trim"](),
        v73 = _stripHtmlTags(
          _extractHtmlAttr(v69, "data-node-id") ||
            _extractHtmlAttr(v69, "data-nodeId"),
        )["trim"](),
        v74 = _stripHtmlTags(_extractHtmlAttr(v69, "data-ref-origin"))[
          "trim"
        ](),
        v75 = _stripHtmlTags(_extractHtmlAttr(v69, "data-asset-id"))["trim"](),
        v76 = _stripHtmlTags(_extractHtmlAttr(v69, "data-asset-index"))[
          "trim"
        ](),
        v77 = _stripHtmlTags(_extractHtmlAttr(v69, "data-ref-type"))["trim"](),
        v78 = _stripHtmlTags(_extractHtmlAttr(v69, "data-ref-unresolved"))[
          "trim"
        ](),
        v79 = ['class="ref-pill"', 'contenteditable="false"'];
      if (v72) v79["push"]("data-label=\x22" + _escapeHtmlAttr(v72) + "\x22");
      if (v73) v79["push"]('data-node-id="' + _escapeHtmlAttr(v73) + "\x22");
      if (v74 === "asset") v79["push"]('data-ref-origin="asset"');
      if (v75)
        v79["push"]("data-asset-id=\x22" + _escapeHtmlAttr(v75) + "\x22");
      if (v76)
        v79["push"]('data-asset-index="' + _escapeHtmlAttr(v76) + "\x22");
      if (v77) v79["push"]('data-ref-type="' + _escapeHtmlAttr(v77) + "\x22");
      if (v78 === "true") v79["push"]('data-ref-unresolved="true"');
      return v66["pushToken"](
        "<span\x20" +
          v79["join"]("\x20") +
          ">" +
          _escapeHtmlText(v72) +
          "</span>",
      );
    })
    ["replace"](/<br\b[^>]*\/?>/gi, () => v66["pushToken"]("<br>"));
  return (
    v66["setOutput"](v67["replace"](/<\/?[^>]+>/g, "")),
    v66["restore"]()
  );
}
function _sanitizeRichTextHtmlWithoutDom(v80) {
  const v81 = _replaceAllowedTagsWithTokens(
    _stripDangerousHtml(v80),
    _RICH_TEXT_ALLOWED_TAGS,
  );
  return (
    v81["setOutput"](v81["output"]["replace"](/<\/?[^>]+>/g, "")),
    v81["restore"]()
  );
}
function _appendSanitizedPromptNode(v82, v83) {
  const v84 = Number(v83?.["nodeType"]);
  if (v84 === 3) {
    v82["appendChild"](
      document["createTextNode"](String(v83?.["textContent"] || "")),
    );
    return;
  }
  if (v84 !== 1) return;
  const v85 = String(v83?.["tagName"] || "")["toLowerCase"]();
  if (_DANGEROUS_HTML_TAGS["has"](v85)) return;
  if (v85 === "br") {
    v82["appendChild"](document["createElement"]("br"));
    return;
  }
  if (v85 === "span" && v83["classList"]?.["contains"]("ref-pill")) {
    const v86 = String(
        v83["getAttribute"]?.("data-label") ||
          v83["dataset"]?.["label"] ||
          v83["textContent"] ||
          "",
      )
        ["replace"](/[×✕✖]/g, "")
        ["trim"](),
      v87 = String(
        v83["getAttribute"]?.("data-node-id") ||
          v83["dataset"]?.["nodeId"] ||
          "",
      )["trim"](),
      v88 = String(
        v83["getAttribute"]?.("data-ref-origin") ||
          v83["dataset"]?.["refOrigin"] ||
          "",
      )["trim"](),
      v89 = String(
        v83["getAttribute"]?.("data-asset-id") ||
          v83["dataset"]?.["assetId"] ||
          "",
      )["trim"](),
      v90 = String(
        v83["getAttribute"]?.("data-asset-index") ||
          v83["dataset"]?.["assetIndex"] ||
          "",
      )["trim"](),
      v91 = String(
        v83["getAttribute"]?.("data-ref-type") ||
          v83["dataset"]?.["refType"] ||
          "",
      )["trim"](),
      v92 = String(
        v83["getAttribute"]?.("data-ref-unresolved") ||
          v83["dataset"]?.["refUnresolved"] ||
          "",
      )["trim"](),
      v93 = document["createElement"]("span");
    ((v93["className"] = "ref-pill"),
      v93["setAttribute"]("contenteditable", "false"));
    if (v86) v93["setAttribute"]("data-label", v86);
    if (v87) v93["setAttribute"]("data-node-id", v87);
    if (v88 === "asset") v93["setAttribute"]("data-ref-origin", "asset");
    if (v89) v93["setAttribute"]("data-asset-id", v89);
    if (v90) v93["setAttribute"]("data-asset-index", v90);
    if (v91) v93["setAttribute"]("data-ref-type", v91);
    if (v92 === "true") v93["setAttribute"]("data-ref-unresolved", "true");
    ((v93["textContent"] = v86), v82["appendChild"](v93));
    return;
  }
  if (_PROMPT_CONTAINER_TAGS["has"](v85)) {
    const v94 = document["createElement"](v85);
    (Array["from"](v83["childNodes"] || [])["forEach"]((v95) =>
      _appendSanitizedPromptNode(v94, v95),
    ),
      v82["appendChild"](v94));
    return;
  }
  Array["from"](v83["childNodes"] || [])["forEach"]((v96) =>
    _appendSanitizedPromptNode(v82, v96),
  );
}
function _appendSanitizedRichTextNode(v97, v98) {
  const v99 = Number(v98?.["nodeType"]);
  if (v99 === 3) {
    v97["appendChild"](
      document["createTextNode"](String(v98?.["textContent"] || "")),
    );
    return;
  }
  if (v99 !== 1) return;
  const v100 = String(v98?.["tagName"] || "")["toLowerCase"]();
  if (_DANGEROUS_HTML_TAGS["has"](v100)) return;
  if (!_RICH_TEXT_ALLOWED_TAGS["has"](v100)) {
    Array["from"](v98["childNodes"] || [])["forEach"]((v101) =>
      _appendSanitizedRichTextNode(v97, v101),
    );
    return;
  }
  const v102 = document["createElement"](v100);
  (v100 !== "br" &&
    v100 !== "hr" &&
    Array["from"](v98["childNodes"] || [])["forEach"]((v103) =>
      _appendSanitizedRichTextNode(v102, v103),
    ),
    v97["appendChild"](v102));
}
function _sanitizeHtmlWithDom(v104, v105) {
  if (
    typeof document === "undefined" ||
    typeof document["createElement"] !== "function"
  )
    throw new Error("Document\x20API\x20is\x20unavailable");
  const v106 = document["createElement"]("template"),
    v107 = document["createElement"]("div");
  v106["innerHTML"] = String(v104 ?? "");
  const v108 = Array["from"](
    v106["content"]?.["childNodes"] || v106["childNodes"] || [],
  );
  return (
    v108["forEach"]((v109) => {
      if (v105 === "prompt") {
        _appendSanitizedPromptNode(v107, v109);
        return;
      }
      _appendSanitizedRichTextNode(v107, v109);
    }),
    v107["innerHTML"] || ""
  );
}
export function sanitizePromptHtml(v110) {
  const v111 = typeof v110 === "string" ? v110 : "";
  if (!v111["trim"]()) return "";
  try {
    return _sanitizeHtmlWithDom(v111, "prompt");
  } catch {
    return _sanitizePromptHtmlWithoutDom(v111);
  }
}
export function sanitizeRichTextHtml(v112) {
  const v113 = typeof v112 === "string" ? v112 : "";
  if (!v113["trim"]()) return "";
  try {
    return _sanitizeHtmlWithDom(v113, "richText");
  } catch {
    return _sanitizeRichTextHtmlWithoutDom(v113);
  }
}
export function createElement(v114, v115 = {}, v116 = null) {
  const v117 = document["createElement"](v114);
  Object["entries"](v115)["forEach"](([v118, v119]) => {
    if (v118 === "className") v117["className"] = v119;
    else {
      if (v118 === "dataset")
        Object["entries"](v119)["forEach"](([v120, v121]) => {
          v117["dataset"][v120] = v121;
        });
      else
        v118["startsWith"]("on") && typeof v119 === "function"
          ? v117["addEventListener"](v118["slice"](2)["toLowerCase"](), v119)
          : v117["setAttribute"](v118, v119);
    }
  });
  if (v116) {
    if (typeof v116 === "string") v117["textContent"] = v116;
    else {
      if (v116 instanceof Node) v117["appendChild"](v116);
      else Array["isArray"](v116) && v117["append"](...v116["filter"](Boolean));
    }
  }
  return v117;
}
export function closest(v122, v123) {
  if (!v122) return null;
  if (v122["matches"] && v122["matches"](v123)) return v122;
  return v122["closest"] ? v122["closest"](v123) : null;
}
export function addEvents(v124, v125, v126 = false) {
  Object["entries"](v125)["forEach"](([v127, v128]) => {
    v124["addEventListener"](v127, v128, v126);
  });
}
export function removeEvents(v129, v130, v131 = false) {
  Object["entries"](v130)["forEach"](([v132, v133]) => {
    v129["removeEventListener"](v132, v133, v131);
  });
}
export function raf(v134) {
  return requestAnimationFrame(v134);
}
export function nextFrame(v135) {
  return new Promise((v136) => {
    requestAnimationFrame(() => {
      (v135(), v136());
    });
  });
}
export function debounce(v137, v138 = 300) {
  let v139 = null;
  return function (...v140) {
    (clearTimeout(v139),
      (v139 = setTimeout(() => v137["apply"](this, v140), v138)));
  };
}
export function throttle(v141, v142 = 100) {
  let v143 = false;
  return function (...v144) {
    !v143 &&
      (v141["apply"](this, v144),
      (v143 = true),
      setTimeout(() => (v143 = false), v142));
  };
}
export function rafSampleLatest(v145) {
  let v146 = null,
    v147 = null,
    v148 = null;
  function v149(...v150) {
    ((v147 = v150), (v148 = this));
    if (v146 !== null) return;
    v146 = requestAnimationFrame(() => {
      v146 = null;
      const v151 = v147,
        v152 = v148;
      ((v147 = null), (v148 = null));
      if (!v151) return;
      v145["apply"](v152, v151);
    });
  }
  return (
    (v149["cancel"] = () => {
      if (v146 !== null) cancelAnimationFrame(v146);
      ((v146 = null), (v147 = null), (v148 = null));
    }),
    v149
  );
}
export function waitForElement(v153, v154 = 5000) {
  return new Promise((v155, v156) => {
    const v157 = document["querySelector"](v153);
    if (v157) {
      v155(v157);
      return;
    }
    const v158 = new MutationObserver(() => {
      const v159 = document["querySelector"](v153);
      v159 && (v158["disconnect"](), clearTimeout(v160), v155(v159));
    });
    v158["observe"](document["body"], { childList: true, subtree: true });
    const v160 = setTimeout(() => {
      (v158["disconnect"](),
        v156(
          new Error("Element\x20" + v153 + " not found within " + v154 + "ms"),
        ));
    }, v154);
  });
}
export function safeRemove(v161) {
  v161 && v161["parentNode"] && v161["parentNode"]["removeChild"](v161);
}
export function getViewportRect(v162) {
  const v163 = v162["getBoundingClientRect"]();
  return {
    top: v163["top"],
    left: v163["left"],
    bottom: v163["bottom"],
    right: v163["right"],
    width: v163["width"],
    height: v163["height"],
  };
}
export function isInViewport(v164, v165 = 0) {
  const v166 = v164["getBoundingClientRect"]();
  return (
    v166["top"] >= -v165 &&
    v166["left"] >= -v165 &&
    v166["bottom"] <= window["innerHeight"] + v165 &&
    v166["right"] <= window["innerWidth"] + v165
  );
}
export function getDisplayedMediaSizeFromNode(v167, v168) {
  const v169 = String(v167 || "")["trim"]();
  if (!v169) return { w: 0, h: 0 };
  const v170 = document["getElementById"](v169);
  if (!v170) return { w: 0, h: 0 };
  const v171 = readNodeMediaMetricsDataset(v170, v168);
  if (v171) return { w: v171["w"], h: v171["h"] };
  const v172 = v170["querySelector"](".img-node-preview") || v170,
    v173 = String(v168 || ""),
    v174 = v173 === "video" ? "video" : "img",
    v175 = Array["from"](v172["querySelectorAll"](v174));
  let v176 = 0,
    v177 = 0,
    v178 = -1000000000;
  for (const v179 of v175) {
    const v180 = window["getComputedStyle"](v179);
    if (!v180) continue;
    if (v180["display"] === "none") continue;
    if (v180["visibility"] === "hidden") continue;
    if (Number(v180["opacity"] || "1") <= 0.05) continue;
    if (v180["pointerEvents"] === "none") continue;
    const v181 =
        v173 === "video" ? v179["videoWidth"] || 0 : v179["naturalWidth"] || 0,
      v182 =
        v173 === "video"
          ? v179["videoHeight"] || 0
          : v179["naturalHeight"] || 0;
    if (!v181 || !v182) continue;
    const v183 = Number(v180["zIndex"]),
      v184 = Number["isFinite"](v183) ? v183 : 0;
    v184 >= v178 && ((v178 = v184), (v176 = v181), (v177 = v182));
  }
  return { w: v176, h: v177 };
}
export function getDisplayedVideoMetaFromNode(v185) {
  const v186 = String(v185 || "")["trim"]();
  if (!v186) return { src: "", w: 0, h: 0 };
  const v187 = document["getElementById"](v186);
  if (!v187) return { src: "", w: 0, h: 0 };
  const v188 = readNodeMediaMetricsDataset(v187, "video");
  if (v188?.["src"]) return { src: v188["src"], w: v188["w"], h: v188["h"] };
  const v189 = v187["querySelector"](".img-node-preview") || v187,
    v190 = Array["from"](v189["querySelectorAll"]("video"));
  let v191 = "",
    v192 = 0,
    v193 = 0,
    v194 = -1000000000;
  for (const v195 of v190) {
    const v196 = window["getComputedStyle"](v195);
    if (!v196) continue;
    if (v196["display"] === "none") continue;
    if (v196["visibility"] === "hidden") continue;
    if (Number(v196["opacity"] || "1") <= 0.05) continue;
    if (v196["pointerEvents"] === "none") continue;
    const v197 = String(v195["currentSrc"] || v195["src"] || "")["trim"]();
    if (!v197) continue;
    const v198 = Number(v195["videoWidth"] || 0),
      v199 = Number(v195["videoHeight"] || 0),
      v200 = Number(v196["zIndex"]),
      v201 = Number["isFinite"](v200) ? v200 : 0;
    v201 >= v194 &&
      ((v194 = v201),
      (v191 = v197),
      (v192 = Number["isFinite"](v198) ? v198 : 0),
      (v193 = Number["isFinite"](v199) ? v199 : 0));
  }
  return { src: v191, w: v192, h: v193 };
}
