import test from "node:test";
import strict from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  MULTI_RESULT_BACKPLATES_CLASS,
  MULTI_RESULT_BACKPLATE_CLASS,
  MULTI_RESULT_STACK_EXPANDED_CLASS,
  MULTI_RESULT_STACK_PREVIEW_CLASS,
  MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS,
  buildMultiResultBackplateItems,
  createMultiResultBackplates,
  getMultiResultBackplateKey,
  getMultiResultBackplateCount,
  shouldRefreshMultiResultStackDom,
  syncMultiResultStackClasses,
} from "./multiResultStackBackplates.js";
function createFakeDocument() {
  return {
    createElement(v0) {
      return {
        tagName: String(v0 || "div")["toUpperCase"](),
        className: "",
        children: [],
        dataset: {},
        attributes: {},
        appendChild(v1) {
          return (this["children"]["push"](v1), (v1["parentNode"] = this), v1);
        },
        setAttribute(v2, v3) {
          this["attributes"][v2] = String(v3);
        },
      };
    },
  };
}
function createClassListHost() {
  const v4 = new Set();
  return {
    classList: {
      add(...v5) {
        v5["forEach"]((v6) => v4["add"](v6));
      },
      remove(...v7) {
        v7["forEach"]((v8) => v4["delete"](v8));
      },
      toggle(v9, v10) {
        const v11 = v10 === undefined ? !v4["has"](v9) : !!v10;
        if (v11) v4["add"](v9);
        else v4["delete"](v9);
        return v11;
      },
      contains(v12) {
        return v4["has"](v12);
      },
    },
  };
}
(test("multi\x20result\x20stack\x20backplates:\x20single\x20image\x20does\x20not\x20render\x20a\x20backdrop", () => {
  (strict["equal"](getMultiResultBackplateCount(0), 0),
    strict["equal"](getMultiResultBackplateCount(1), 0),
    strict["equal"](
      createMultiResultBackplates(createFakeDocument(), 1),
      null,
    ));
}),
  test("multi result stack backplates: renders up to three backplates", () => {
    const v13 = createFakeDocument(),
      v14 = createMultiResultBackplates(v13, 5);
    (strict["equal"](getMultiResultBackplateCount(2), 1),
      strict["equal"](getMultiResultBackplateCount(4), 3),
      strict["equal"](getMultiResultBackplateCount(10), 3),
      strict["equal"](v14["className"], MULTI_RESULT_BACKPLATES_CLASS),
      strict["equal"](v14["attributes"]["aria-hidden"], "true"),
      strict["equal"](v14["children"]["length"], 3),
      strict["equal"](
        v14["children"][0]["className"],
        MULTI_RESULT_BACKPLATE_CLASS,
      ),
      strict["equal"](v14["children"][0]["dataset"]["stackIndex"], "1"),
      strict["equal"](v14["children"][0]["dataset"]["imageIndex"], "1"),
      strict["equal"](v14["children"][2]["dataset"]["stackIndex"], "3"));
  }),
  test("multi result stack backplates: items skip main image without rendering source media", () => {
    const v15 = buildMultiResultBackplateItems({ imageCount: 4, mainIndex: 1 }),
      v16 = createMultiResultBackplates(createFakeDocument(), 4, {
        items: v15,
      });
    (strict["deepEqual"](
      v15["map"]((v17) => v17["imageIndex"]),
      [0, 2, 3],
    ),
      strict["equal"](getMultiResultBackplateKey(v15), "0,2,3"),
      strict["equal"](v16["children"]["length"], 3),
      strict["equal"](v16["children"][0]["dataset"]["imageIndex"], "0"),
      strict["equal"](v16["children"][0]["children"]["length"], 0));
  }),
  test("multi result stack backplates: expanded state is class-derived", () => {
    const v18 = createClassListHost(),
      v19 = createClassListHost();
    (syncMultiResultStackClasses({
      previewEl: v18,
      stackWrap: v19,
      isActive: true,
      isExpanded: true,
    }),
      strict["equal"](
        v18["classList"]["contains"](MULTI_RESULT_STACK_PREVIEW_CLASS),
        true,
      ),
      strict["equal"](
        v18["classList"]["contains"](MULTI_RESULT_STACK_EXPANDED_CLASS),
        true,
      ),
      strict["equal"](
        v19["classList"]["contains"](MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS),
        true,
      ),
      syncMultiResultStackClasses({
        previewEl: v18,
        stackWrap: v19,
        isActive: true,
        isExpanded: false,
      }),
      strict["equal"](
        v18["classList"]["contains"](MULTI_RESULT_STACK_PREVIEW_CLASS),
        true,
      ),
      strict["equal"](
        v18["classList"]["contains"](MULTI_RESULT_STACK_EXPANDED_CLASS),
        false,
      ),
      strict["equal"](
        v19["classList"]["contains"](MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS),
        false,
      ));
  }),
  test("multi result stack backplates: DOM refresh detects missing backdrop state", () => {
    const v20 = createClassListHost(),
      v21 = createFakeDocument(),
      v22 = v21["createElement"]("div"),
      v23 = v21["createElement"]("div"),
      v24 = createMultiResultBackplates(v21, 4);
    (v22["appendChild"](v23),
      strict["equal"](
        shouldRefreshMultiResultStackDom({
          imageCount: 4,
          previewEl: v20,
          containerEl: v22,
          stackWrap: v23,
          backdropWrap: null,
        }),
        true,
      ),
      v23["appendChild"](v24),
      strict["equal"](
        shouldRefreshMultiResultStackDom({
          imageCount: 4,
          previewEl: v20,
          containerEl: v22,
          stackWrap: v23,
          backdropWrap: v24,
        }),
        true,
      ),
      v20["classList"]["add"](MULTI_RESULT_STACK_PREVIEW_CLASS),
      strict["equal"](
        shouldRefreshMultiResultStackDom({
          imageCount: 4,
          previewEl: v20,
          containerEl: v22,
          stackWrap: v23,
          backdropWrap: v24,
        }),
        false,
      ));
  }),
  test("multi\x20result\x20stack\x20backplates:\x20CSS\x20uses\x20the\x20backplate\x20as\x20the\x20animated\x20card", () => {
    const v25 = readFileSync(
      new URL("../../../styles/node-types.css", import.meta["url"]),
      "utf8",
    );
    (strict["match"](
      v25,
      /\.multi-stack-backplates\s*\{[\s\S]*pointer-events:\s*none;/,
    ),
      strict["match"](
        v25,
        /\.multi-stack-wrap\.is-expanded\s+\.multi-stack-backplates\s*\{[\s\S]*pointer-events:\s*auto;/,
      ),
      strict["match"](
        v25,
        /\.multi-images-container\s*\{[\s\S]*contain:\s*layout;[\s\S]*overflow:\s*visible;/,
      ),
      strict["match"](
        v25,
        /\.multi-stack-wrap\s*\{[\s\S]*overflow:\s*visible;/,
      ),
      strict["match"](v25, /\.multi-stack-backplates\s*\{[\s\S]*z-index:\s*1;/),
      strict["match"](
        v25,
        /\.img-node-preview\.aigen-image-preview\.is-multi-result-stack-expanded\s*\{[\s\S]*overflow:\s*visible;/,
      ),
      strict["match"](
        v25,
        /\.multi-stack-backplate\.is-expanded-card\s*\{[\s\S]*cursor:\s*pointer;/,
      ));
    const v26 = v25["match"](/\.multi-stack-backplate\s*\{([\s\S]*?)\}/);
    (strict["ok"](v26),
      strict["match"](v26[1], /transition:[\s\S]*opacity 0\.18s ease/),
      strict["doesNotMatch"](v26[1], /top 0\./),
      strict["doesNotMatch"](v26[1], /transform 0\./),
      strict["match"](
        v25,
        /\.multi-stack-backplate\s*\{[\s\S]*border-radius:\s*0 var\(--radius-16\) var\(--radius-16\) 0;/,
      ),
      strict["match"](
        v25,
        /\.multi-stack-backplate\s*\{[\s\S]*background:\s*linear-gradient\(180deg,\s*var\(--white-20\),\s*var\(--white-08\)\);/,
      ),
      strict["match"](
        v25,
        /\.multi-stack-backplate-media\s*\{[\s\S]*opacity:\s*0;/,
      ));
    const v27 = v25["match"](/\.multi-stack-backplate-media\s*\{([\s\S]*?)\}/);
    (strict["ok"](v27),
      strict["doesNotMatch"](v27[1], /background(?:-image)?:/));
  }),
  test("multi result stack backplates: UI refreshes after renderer wrapper overflow is applied", () => {
    const v28 = readFileSync(
      new URL("./uiModule.impl.js", import.meta["url"]),
      "utf8",
    );
    (strict["match"](
      v28,
      /requestAnimationFrame\(refreshInitialMultiResultStack\)/,
    ),
      strict["match"](v28, /_loadAndDisplayImage\(\{\s*force:\s*true\s*\}\)/),
      strict["match"](
        v28,
        /this\._root\?\.style\.setProperty\("overflow",\s*"visible"\)/,
      ));
  }),
  test("multi result stack backplates: expanded cards reuse backdrop elements", () => {
    const v29 = readFileSync(
      new URL("./uiModule.impl.js", import.meta["url"]),
      "utf8",
    );
    (strict["match"](v29, /_multiBackplateEls\[imageIndex\] = plate/),
      strict["match"](
        v29,
        /plateImg\.className = "multi-stack-backplate-media"/,
      ),
      strict["match"](
        v29,
        /_setLazyImageDisplaySource\(plateImg,\s*plateDisplayLod\)/,
      ),
      strict["doesNotMatch"](v29, /plateImg\.src\s*=\s*plateDisplayLod\.url/),
      strict["match"](v29, /_bindResultImageDragOut\(plate,/),
      strict["match"](v29, /_removeCurrentNodeFromSelection\(\)/),
      strict["match"](
        v29,
        /selectedIds\.filter\(\(id\) => id !== this\.nodeId\)/,
      ),
      strict["match"](
        v29,
        /this\._removeCurrentNodeFromSelection\(\);\s*store\.updateNodeData\(this\.nodeId,\s*\{\s*isImagesExpanded:\s*true\s*\}\)/,
      ),
      strict["match"](v29, /const showMainImageImmediately = \(targetIdx\) =>/),
      strict["match"](
        v29,
        /showMainImageImmediately\(safeTargetIdx\);[\s\S]*setTimeout\(\(\) => \{/,
      ),
      strict["match"](v29, /let applyMultiStackCardLayout = \(\) => \{\}/),
      strict["match"](v29, /applyMultiStackCardLayout = \(expanded\) =>/),
      strict["match"](
        v29,
        /plate\.classList\.toggle\("is-expanded-card", showExpandedCard\)/,
      ),
      strict["match"](
        v29,
        /mediaEl\.style\.opacity = showExpandedCard \? "1" : "0"/,
      ),
      strict["match"](v29, /this\._loadLazyImageDisplaySource\(mediaEl\)/),
      strict["match"](
        v29,
        /this\._scheduleClearLazyImageDisplaySource\(\s*mediaEl,\s*multiStackMotionDurationMs,\s*\)/,
      ),
      strict["match"](v29, /this\._clearLazyImageDisplaySource\(mediaEl\)/),
      strict["match"](
        v29,
        /this\._setLazyImageDisplaySource\(layerImg,\s*layerDisplayLod\)/,
      ),
      strict["doesNotMatch"](v29, /layerImg\.src\s*=\s*layerDisplayLod\.url/),
      strict["match"](v29, /top:\s*frame\.top \+ "px"/),
      strict["match"](v29, /const stackThrowTransition =/),
      strict["match"](
        v29,
        /cubic-bezier\(0\.175,\s*0\.885,\s*0\.32,\s*1\.27\)/,
      ),
      strict["match"](v29, /const playStackPlateTransition =/),
      strict["match"](v29, /plate\.style\.transition = "none"/),
      strict["match"](v29, /requestAnimationFrame\(\(\) => \{/),
      strict["doesNotMatch"](v29, /filter:\s*"brightness\([^"]*blur\(/),
      strict["doesNotMatch"](v29, /plate\.animate\(/),
      strict["doesNotMatch"](v29, /buildThrowKeyframes/),
      strict["doesNotMatch"](v29, /animateStackCardPath/),
      strict["doesNotMatch"](v29, /buildStackCardTransform/),
      strict["doesNotMatch"](v29, /buildStackCardOvershootTransform/),
      strict["doesNotMatch"](v29, /is-transitioning-out/),
      strict["doesNotMatch"](v29, /is-stack-consumed/),
      strict["doesNotMatch"](
        v29,
        /this\._multiStackWrap\.appendChild\(this\._expandPanel\)/,
      ));
  }));
