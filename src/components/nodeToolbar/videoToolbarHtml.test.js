import test from "node:test";
import strict from "node:assert/strict";
import { VIDEO_TOOLBAR_HTML } from "./videoToolbarHtml.js";
(test("videoToolbarHtml: replace 按钮展示为补帧且不再是开发中", () => {
  (strict["match"](VIDEO_TOOLBAR_HTML, /act-replace/),
    strict["match"](VIDEO_TOOLBAR_HTML, /data-tooltip="补帧"/),
    strict["match"](VIDEO_TOOLBAR_HTML, /aria-label="补帧"/),
    strict["doesNotMatch"](VIDEO_TOOLBAR_HTML, /替换（开发中）/),
    strict["doesNotMatch"](
      VIDEO_TOOLBAR_HTML,
      /is-dev act-replace|act-replace is-dev/,
    ));
}),
  test("videoToolbarHtml: replace 图标为双人拖影补帧图标", () => {
    const v0 = VIDEO_TOOLBAR_HTML["match"](
      /<button class="[^"]*\bact-replace\b[^"]*"[^>]*>.*?<\/button>/s,
    )?.[0];
    (strict["ok"](v0),
      strict["match"](
        v0,
        /<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"/,
      ),
      strict["equal"](v0["match"](/<circle\b/g)?.["length"], 2),
      strict["match"](
        v0,
        /<path d="M9\.4 11\.4c1\.3-.9 3\.9-.9 5\.2 0" opacity="\.6"\/>/,
      ));
  }),
  test("videoToolbarHtml: 音画分离按钮保留在视频工具池中", () => {
    (strict["match"](VIDEO_TOOLBAR_HTML, /act-separate-av/),
      strict["match"](VIDEO_TOOLBAR_HTML, /data-tooltip="音画分离"/),
      strict["match"](VIDEO_TOOLBAR_HTML, /aria-label="音画分离"/),
      strict["ok"](
        VIDEO_TOOLBAR_HTML["indexOf"]("act-clip") <
          VIDEO_TOOLBAR_HTML["indexOf"]("act-separate-av"),
      ));
  }),
  test("videoToolbarHtml: 提取关键帧按钮保留在裁剪之后", () => {
    (strict["match"](VIDEO_TOOLBAR_HTML, /act-extract-keyframes/),
      strict["match"](VIDEO_TOOLBAR_HTML, /data-tooltip="提取关键帧"/),
      strict["match"](VIDEO_TOOLBAR_HTML, /aria-label="提取关键帧"/),
      strict["ok"](
        VIDEO_TOOLBAR_HTML["indexOf"]("act-clip") <
          VIDEO_TOOLBAR_HTML["indexOf"]("act-extract-keyframes"),
      ));
  }),
  test("videoToolbarHtml: 分镜脚本按钮替代反推开发中入口", () => {
    (strict["match"](VIDEO_TOOLBAR_HTML, /act-storyboard-script/),
      strict["match"](VIDEO_TOOLBAR_HTML, /data-tooltip="分镜脚本"/),
      strict["match"](VIDEO_TOOLBAR_HTML, /aria-label="分镜脚本"/),
      strict["doesNotMatch"](VIDEO_TOOLBAR_HTML, /act-reverse/),
      strict["doesNotMatch"](VIDEO_TOOLBAR_HTML, /反推/),
      strict["doesNotMatch"](
        VIDEO_TOOLBAR_HTML,
        /is-dev act-storyboard-script|act-storyboard-script is-dev/,
      ));
  }),
  test("videoToolbarHtml: APIMart 人脸检测按钮在工具池中", () => {
    (strict["match"](VIDEO_TOOLBAR_HTML, /act-apimart-face-detect/),
      strict["match"](
        VIDEO_TOOLBAR_HTML,
        /data-tooltip="apimart提供 seedance2\.0人脸检测"/,
      ),
      strict["match"](VIDEO_TOOLBAR_HTML, /aria-label="人脸检测"/));
  }),
  test("videoToolbarHtml:\x20更多菜单参考图像工具栏浮层结构", () => {
    (strict["match"](VIDEO_TOOLBAR_HTML, /act-more-tools/),
      strict["match"](VIDEO_TOOLBAR_HTML, /data-tooltip="更多"/),
      strict["match"](VIDEO_TOOLBAR_HTML, /aria-label="更多"/),
      strict["match"](
        VIDEO_TOOLBAR_HTML,
        /class="v2-img-toolbar-zone v2-img-toolbar-zone-primary" data-zone="outside-primary"/,
      ),
      strict["match"](
        VIDEO_TOOLBAR_HTML,
        /class="v2-img-toolbar-zone v2-img-toolbar-zone-secondary" data-zone="outside-secondary"/,
      ),
      strict["match"](
        VIDEO_TOOLBAR_HTML,
        /class="v2-img-toolbar-more-menu v2-video-toolbar-more-menu" data-role="more-menu" hidden/,
      ),
      strict["match"](
        VIDEO_TOOLBAR_HTML,
        /class="v2-img-toolbar-more-title">更多工具/,
      ),
      strict["match"](
        VIDEO_TOOLBAR_HTML,
        /class="v2-img-toolbar-zone v2-img-toolbar-zone-more"/,
      ),
      strict["match"](VIDEO_TOOLBAR_HTML, /act-customize-tools/),
      strict["match"](VIDEO_TOOLBAR_HTML, /data-role="button-pool" hidden/));
  }),
  test("videoToolbarHtml: 按钮池包含全部可自定义视频工具", () => {
    const v1 = VIDEO_TOOLBAR_HTML["match"](
      /<div class="v2-img-toolbar-button-pool v2-video-toolbar-button-pool"[\s\S]*?<\/div>/,
    )?.[0];
    strict["ok"](v1);
    for (const v2 of [
      "clip",
      "extract-keyframes",
      "keying",
      "storyboard-script",
      "apimart-face-detect",
      "fullscreen",
      "download",
      "reset-size",
      "hd",
      "replace",
      "remove",
      "separate-av",
    ]) {
      strict["match"](v1, new RegExp("act-" + v2));
    }
  }));
