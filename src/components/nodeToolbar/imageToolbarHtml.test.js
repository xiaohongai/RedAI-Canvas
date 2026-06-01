import test from "node:test";
import strict from "node:assert/strict";
import { IMAGE_TOOLBAR_HTML } from "./imageToolbarHtml.js";
test("imageToolbarHtml:\x20APIMart\x20人脸检测按钮在工具池中", () => {
  (strict["match"](IMAGE_TOOLBAR_HTML, /act-apimart-face-detect/),
    strict["match"](
      IMAGE_TOOLBAR_HTML,
      /data-tooltip="apimart提供 seedance2\.0人脸检测"/,
    ),
    strict["match"](IMAGE_TOOLBAR_HTML, /aria-label="人脸检测"/));
});
