import test from "node:test";
import strict from "node:assert/strict";
import { TEXT_TOOLBAR_HTML } from "./textToolbarHtml.js";
test("textToolbarHtml: 分镜脚本按钮位于全屏显示左侧", () => {
  (strict["match"](TEXT_TOOLBAR_HTML, /act-storyboard-script/),
    strict["match"](TEXT_TOOLBAR_HTML, /data-tooltip="分镜脚本"/),
    strict["match"](TEXT_TOOLBAR_HTML, /aria-label="分镜脚本"/),
    strict["ok"](
      TEXT_TOOLBAR_HTML["indexOf"]("act-storyboard-script") <
        TEXT_TOOLBAR_HTML["indexOf"]("act-fullscreen"),
    ));
});
