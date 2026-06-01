import { sanitizeRichTextHtml } from "../../utils/dom.js";
const HEADING_MAX_LEVEL = 3;
function escapeHtml(v0) {
  return String(v0 ?? "")
    ["replace"](/&/g, "&amp;")
    ["replace"](/</g, "&lt;")
    ["replace"](/>/g, "&gt;");
}
function renderInlineMarkdown(v1) {
  const v2 = [],
    v3 = (v4) => {
      const v5 = "" + v2["length"] + "";
      return (v2["push"]([v5, v4]), v5);
    };
  let v6 = escapeHtml(v1)["replace"](/`([^`\n]+)`/g, (v7, v8) =>
    v3("<code>" + v8 + "</code>"),
  );
  return (
    (v6 = v6["replace"](/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
      ["replace"](
        /(^|[^\p{L}\p{N}_])__([^_\n]+)__(?![\p{L}\p{N}_])/gu,
        "$1<strong>$2</strong>",
      )
      ["replace"](/(^|[^\*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
      ["replace"](
        /(^|[^\p{L}\p{N}_])_([^_\n]+)_(?![\p{L}\p{N}_])/gu,
        "$1<em>$2</em>",
      )),
    v2["forEach"](([v9, v10]) => {
      v6 = v6["replaceAll"](v9, v10);
    }),
    v6
  );
}
function isFenceStart(v11) {
  return /^```/["test"](String(v11 || "")["trim"]());
}
function isHeading(v12) {
  return /^(#{1,6})\s+(.+)$/["test"](String(v12 || "")["trim"]());
}
function isHorizontalRule(v13) {
  return /^(?:-{3,}|\*{3,}|_{3,})$/["test"](String(v13 || "")["trim"]());
}
function getListMatch(v14) {
  const v15 = String(v14 || ""),
    v16 = v15["match"](/^\s*[-*+]\s+(.+)$/);
  if (v16) return { type: "ul", text: v16[1] };
  const v17 = v15["match"](/^\s*\d+[.)]\s+(.+)$/);
  if (v17) return { type: "ol", text: v17[1] };
  return null;
}
function isBlockStart(v18) {
  const v19 = String(v18 || "")["trim"]();
  return (
    !v19 ||
    isFenceStart(v19) ||
    isHeading(v19) ||
    isHorizontalRule(v19) ||
    /^>\s?/["test"](v19) ||
    !!getListMatch(v18)
  );
}
function renderParagraph(v20) {
  return "<p>" + v20["map"](renderInlineMarkdown)["join"]("<br>") + "</p>";
}
function renderList(v21, v22) {
  const v23 = v22["map"]((v24) => "<li>" + renderInlineMarkdown(v24) + "</li>")[
    "join"
  ]("");
  return "<" + v21 + ">" + v23 + "</" + v21 + ">";
}
function renderBlockquote(v25) {
  const v26 = v25["map"](renderInlineMarkdown)["join"]("<br>");
  return "<blockquote><p>" + v26 + "</p></blockquote>";
}
export function renderMarkdownToHtml(v27) {
  const v28 = String(v27 ?? "");
  if (!v28["trim"]()) return "";
  const v29 = v28["replace"](/\r\n?/g, "\x0a"),
    v30 = v29["split"]("\x0a"),
    v31 = [];
  let v32 = 0;
  while (v32 < v30["length"]) {
    const v33 = v30[v32],
      v34 = v33["trim"]();
    if (!v34) {
      v32 += 1;
      continue;
    }
    if (isFenceStart(v34)) {
      const v35 = [];
      v32 += 1;
      while (v32 < v30["length"] && !isFenceStart(v30[v32]["trim"]())) {
        (v35["push"](v30[v32]), (v32 += 1));
      }
      if (v32 < v30["length"]) v32 += 1;
      v31["push"](
        "<pre><code>" + escapeHtml(v35["join"]("\x0a")) + "</code></pre>",
      );
      continue;
    }
    const v36 = v34["match"](/^(#{1,6})\s+(.+)$/);
    if (v36) {
      const v37 = Math["min"](v36[1]["length"], HEADING_MAX_LEVEL);
      (v31["push"](
        "<h" +
          v37 +
          ">" +
          renderInlineMarkdown(v36[2]["trim"]()) +
          "</h" +
          v37 +
          ">",
      ),
        (v32 += 1));
      continue;
    }
    if (isHorizontalRule(v34)) {
      (v31["push"]("<hr>"), (v32 += 1));
      continue;
    }
    if (/^>\s?/["test"](v34)) {
      const v38 = [];
      while (v32 < v30["length"] && /^>\s?/["test"](v30[v32]["trim"]())) {
        (v38["push"](v30[v32]["trim"]()["replace"](/^>\s?/, "")), (v32 += 1));
      }
      v31["push"](renderBlockquote(v38));
      continue;
    }
    const v39 = getListMatch(v33);
    if (v39) {
      const v40 = v39["type"],
        v41 = [];
      while (v32 < v30["length"]) {
        const v42 = getListMatch(v30[v32]);
        if (!v42 || v42["type"] !== v40) break;
        (v41["push"](v42["text"]["trim"]()), (v32 += 1));
      }
      v31["push"](renderList(v40, v41));
      continue;
    }
    const v43 = [];
    while (v32 < v30["length"] && !isBlockStart(v30[v32])) {
      (v43["push"](v30[v32]["trimEnd"]()), (v32 += 1));
    }
    v43["length"] > 0 && v31["push"](renderParagraph(v43));
  }
  return sanitizeRichTextHtml(v31["join"](""));
}
