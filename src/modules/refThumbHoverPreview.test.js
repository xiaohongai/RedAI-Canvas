import test from "node:test";
import strict from "node:assert/strict";
import {
  _resetRefThumbHoverPreviewForTests,
  bindRefThumbHoverPreview,
  resolveRefThumbHoverPreviewUrl,
} from "./refThumbHoverPreview.js";
function createWrap({
  previewSrc: previewSrc = "",
  thumbSrc: thumbSrc = "",
  imgSrc: imgSrc = "",
} = {}) {
  return {
    dataset: {
      ...(previewSrc ? { previewSrc: previewSrc } : {}),
      ...(thumbSrc ? { thumbSrc: thumbSrc } : {}),
    },
    querySelector(v0) {
      if (v0 !== "img.ref-thumb-media" || !imgSrc) return null;
      return {
        getAttribute(v1) {
          if (v1 !== "src") return "";
          return imgSrc;
        },
      };
    },
  };
}
(test["afterEach"](() => {
  (_resetRefThumbHoverPreviewForTests(),
    delete globalThis["window"],
    delete globalThis["document"],
    delete globalThis["requestAnimationFrame"],
    delete globalThis["cancelAnimationFrame"],
    delete globalThis["Image"]);
}),
  test("refThumbHoverPreview: 优先读取显式 previewSrc", () => {
    const v2 = resolveRefThumbHoverPreviewUrl(
      createWrap({
        previewSrc: "/output/display.jpg",
        thumbSrc: "/output/thumb.jpg",
        imgSrc: "/output/thumb-from-dom.jpg",
      }),
    );
    strict["equal"](v2, "/output/display.jpg");
  }),
  test("refThumbHoverPreview: 没有 previewSrc 时回退显式 thumbSrc", () => {
    const v3 = resolveRefThumbHoverPreviewUrl(
      createWrap({
        thumbSrc: "/output/thumb.jpg",
        imgSrc: "/output/thumb-from-dom.jpg",
      }),
    );
    strict["equal"](v3, "/output/thumb.jpg");
  }),
  test("refThumbHoverPreview: 仅老 DOM 结构时才回退 img src", () => {
    const v4 = resolveRefThumbHoverPreviewUrl(
      createWrap({ imgSrc: "/output/thumb-from-dom.jpg" }),
    );
    strict["equal"](v4, "/output/thumb-from-dom.jpg");
  }),
  test("refThumbHoverPreview: 切换到下一张时不再继续显示上一张预览", () => {
    const v5 = [];
    ((globalThis["Image"] = class v6 {
      set ["src"](v7) {
        this["_src"] = v7;
      }
      get ["src"]() {
        return this["_src"] || "";
      }
      ["decode"]() {
        return new Promise((v8) => {
          v5["push"](v8);
        });
      }
    }),
      (globalThis["requestAnimationFrame"] = (v9) => {
        return (v9(), 1);
      }),
      (globalThis["cancelAnimationFrame"] = () => {}),
      (globalThis["window"] = {
        addEventListener() {},
        setTimeout(v10) {
          return setTimeout(v10, 0);
        },
        clearTimeout(v11) {
          clearTimeout(v11);
        },
      }));
    const v12 = [],
      v13 = () => {
        const v14 = new Set();
        return {
          add(...v15) {
            v15["forEach"]((v16) => v14["add"](String(v16 || "")));
          },
          remove(...v17) {
            v17["forEach"]((v18) => v14["delete"](String(v18 || "")));
          },
          contains(v19) {
            return v14["has"](String(v19 || ""));
          },
        };
      },
      v20 = (v21 = "div") => {
        const v22 = {
          tagName: String(v21 || "div")["toUpperCase"](),
          className: "",
          classList: v13(),
          style: {},
          children: [],
          appendChild(v23) {
            return (
              this["children"]["push"](v23),
              (v23["parentNode"] = this),
              v23
            );
          },
        };
        return (
          v22["tagName"] === "IMG" && ((v22["src"] = ""), (v22["alt"] = "")),
          v22
        );
      };
    globalThis["document"] = {
      body: {
        appendChild(v24) {
          return (v12["push"](v24), (v24["parentNode"] = this), v24);
        },
      },
      createElement: v20,
    };
    const v25 = new Map();
    let v26 = null,
      v27 = null;
    const v28 = {
        addEventListener(v29, v30) {
          if (!v25["has"](v29)) v25["set"](v29, []);
          v25["get"](v29)["push"](v30);
        },
        removeEventListener() {},
        contains(v31) {
          return v31 === v26 || v31 === v27;
        },
      },
      v32 = (v33) => ({
        dataset: { previewSrc: v33, thumbSrc: v33 + "-thumb" },
        getBoundingClientRect() {
          return { left: 0, top: 0, width: 44, height: 44 };
        },
        querySelector(v34) {
          if (v34 !== "img.ref-thumb-media") return null;
          return {
            getAttribute(v35) {
              if (v35 !== "src") return "";
              return v33 + "-thumb";
            },
          };
        },
        closest(v36) {
          return v36 === ".ref-thumb-wrap" ? this : null;
        },
        contains(v37) {
          return v37 === this;
        },
      });
    ((v26 = v32("/output/preview-1.jpg")),
      (v27 = v32("/output/preview-2.jpg")),
      bindRefThumbHoverPreview(v28));
    const v38 = (v39, v40) => {
      for (const v41 of v25["get"](v39) || []) {
        v41({ type: v39, target: v40, relatedTarget: null });
      }
    };
    v38("pointerover", v26);
    const v42 = v12[0],
      v43 = v42["children"][0];
    (strict["equal"](v43["src"], "/output/preview-1.jpg"),
      strict["equal"](v43["classList"]["contains"]("is-pending"), false),
      v38("pointerover", v27),
      strict["equal"](v43["src"], "/output/preview-2.jpg"),
      strict["equal"](v43["classList"]["contains"]("is-pending"), true),
      v5["forEach"]((v44) => v44()));
  }));
