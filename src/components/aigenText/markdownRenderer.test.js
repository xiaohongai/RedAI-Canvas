import test from "node:test";
import strict from "node:assert/strict";
import { renderMarkdownToHtml } from "./markdownRenderer.js";
(test("aigenText markdown renderer: renders common chat markdown safely", () => {
  const v0 = renderMarkdownToHtml(
    [
      "###\x20Title",
      "",
      "**Lead**\x20text",
      "",
      "- one",
      "-\x20`two`",
      "",
      "<script>alert(1)</script>",
    ]["join"]("\x0a"),
  );
  strict["equal"](
    v0,
    "<h3>Title</h3><p><strong>Lead</strong> text</p><ul><li>one</li><li><code>two</code></li></ul><p>&lt;script&gt;alert(1)&lt;/script&gt;</p>",
  );
}),
  test("aigenText markdown renderer: keeps fenced code as code text", () => {
    const v1 = renderMarkdownToHtml(
      ["```js", "const a = **1**;", "```"]["join"]("\x0a"),
    );
    strict["equal"](v1, "<pre><code>const a = **1**;</code></pre>");
  }),
  test("aigenText markdown renderer: keeps underscores inside words literal", () => {
    const v2 = renderMarkdownToHtml("E2E_TEXT_OK and _emphasis_");
    strict["equal"](v2, "<p>E2E_TEXT_OK and <em>emphasis</em></p>");
  }));
