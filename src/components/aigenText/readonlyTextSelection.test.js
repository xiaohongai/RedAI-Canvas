import test from "node:test";
import strict from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  bindReadonlyTextSelection,
  hasActiveReadonlyTextSelection,
} from "./readonlyTextSelection.js";
const __dirname = dirname(fileURLToPath(import.meta["url"])),
  nodeTypesCss = readFileSync(
    join(__dirname, "../../../styles/node-types.css"),
    "utf8",
  );
function createClassList() {
  const v0 = new Set();
  return {
    add(...v1) {
      v1["forEach"]((v2) => v0["add"](String(v2 || "")));
    },
    remove(...v3) {
      v3["forEach"]((v4) => v0["delete"](String(v4 || "")));
    },
    contains(v5) {
      return v0["has"](String(v5 || ""));
    },
  };
}
function createFakeEvent(v6 = {}) {
  return {
    button: 0,
    clientX: 10,
    clientY: 10,
    target: null,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() {
      this["defaultPrevented"] = true;
    },
    stopPropagation() {
      this["propagationStopped"] = true;
    },
    ...v6,
  };
}
function createFakeSelectionDom() {
  const v7 = {},
    v8 = new Map(),
    v9 = new Map(),
    v10 = { classList: createClassList() },
    v11 = {
      body: v10,
      defaultView: {
        getSelection: () => ({ removeAllRanges() {}, setBaseAndExtent() {} }),
      },
      addEventListener(v12, v13) {
        const v14 = v8["get"](v12) || [];
        (v14["push"](v13), v8["set"](v12, v14));
      },
      removeEventListener(v15, v16) {
        const v17 = v8["get"](v15) || [];
        v8["set"](
          v15,
          v17["filter"]((v18) => v18 !== v16),
        );
      },
      caretRangeFromPoint() {
        return { startContainer: v7, startOffset: 0 };
      },
    },
    v19 = {
      ownerDocument: v11,
      classList: createClassList(),
      addEventListener(v20, v21) {
        const v22 = v9["get"](v20) || [];
        (v22["push"](v21), v9["set"](v20, v22));
      },
      removeEventListener(v23, v24) {
        const v25 = v9["get"](v23) || [];
        v9["set"](
          v23,
          v25["filter"]((v26) => v26 !== v24),
        );
      },
      contains(v27) {
        return v27 === v19 || v27 === v7;
      },
      dispatch(v28, v29) {
        for (const v30 of v9["get"](v28) || []) v30(v29);
      },
    };
  return {
    doc: v11,
    el: v19,
    dispatchDocument(v31, v32) {
      for (const v33 of v8["get"](v31) || []) v33(v32);
    },
  };
}
(test("readonly text selection activates on double click, not plain pointerdown", () => {
  const { el: v34, doc: v35, dispatchDocument: v36 } = createFakeSelectionDom();
  let v37 = 0,
    v38 = 0;
  const v39 = bindReadonlyTextSelection(v34, {
      onActivate: () => {
        v37 += 1;
      },
      onDeactivate: () => {
        v38 += 1;
      },
    }),
    v40 = createFakeEvent({ target: v34 });
  (v34["dispatch"]("pointerdown", v40),
    strict["equal"](v40["defaultPrevented"], false),
    strict["equal"](v40["propagationStopped"], false),
    strict["equal"](
      v34["classList"]["contains"]("is-text-selection-active"),
      false,
    ));
  const v41 = createFakeEvent({ target: v34 });
  (v34["dispatch"]("dblclick", v41),
    strict["equal"](v41["defaultPrevented"], true),
    strict["equal"](v41["propagationStopped"], true),
    strict["equal"](v37, 1),
    strict["equal"](
      v34["classList"]["contains"]("is-text-selection-active"),
      true,
    ));
  const v42 = createFakeEvent({ target: v34 });
  (v34["dispatch"]("pointerdown", v42),
    strict["equal"](v42["defaultPrevented"], true),
    strict["equal"](v42["propagationStopped"], true),
    strict["equal"](
      v35["body"]["classList"]["contains"]("is-aigen-text-selecting"),
      true,
    ),
    v36("pointerdown", createFakeEvent({ target: {} })),
    strict["equal"](v38, 1),
    strict["equal"](
      v34["classList"]["contains"]("is-text-selection-active"),
      false,
    ),
    strict["equal"](
      v35["body"]["classList"]["contains"]("is-aigen-text-selecting"),
      false,
    ),
    v39());
}),
  test("readonly text selection detects active non-empty output selection", () => {
    const v43 = {
        nodeType: 1,
        classList: {
          contains(v44) {
            return (
              v44 === "aigen-text-output" || v44 === "is-text-selection-active"
            );
          },
        },
        parentElement: null,
        contains(v45) {
          return v45 === v43 || v45 === v46;
        },
      },
      v46 = { nodeType: 3, parentElement: v43 },
      v47 = {
        querySelectorAll(v48) {
          return v48 === ".aigen-text-output.is-text-selection-active"
            ? [v43]
            : [];
        },
        getSelection() {
          return {
            isCollapsed: false,
            rangeCount: 1,
            toString: () => "selected output",
            getRangeAt: () => ({
              commonAncestorContainer: v46,
              startContainer: v46,
              endContainer: v46,
              intersectsNode(v49) {
                return v49 === v43;
              },
            }),
          };
        },
      };
    strict["equal"](hasActiveReadonlyTextSelection(v47), true);
  }),
  test("readonly\x20text\x20selection\x20ignores\x20collapsed\x20or\x20inactive\x20selections", () => {
    const v50 = {
        nodeType: 1,
        classList: {
          contains(v51) {
            return v51 === "aigen-text-output";
          },
        },
        parentElement: null,
      },
      v52 = { nodeType: 3, parentElement: v50 },
      v53 = {
        querySelectorAll: () => [],
        getSelection() {
          return {
            isCollapsed: false,
            rangeCount: 1,
            toString: () => "selected output",
            getRangeAt: () => ({
              commonAncestorContainer: v52,
              startContainer: v52,
              endContainer: v52,
            }),
          };
        },
      };
    (strict["equal"](hasActiveReadonlyTextSelection(v53), false),
      strict["equal"](
        hasActiveReadonlyTextSelection({
          getSelection: () => ({
            isCollapsed: true,
            rangeCount: 0,
            toString: () => "",
          }),
        }),
        false,
      ));
  }),
  test("readonly\x20text\x20selection\x20mode\x20brightens\x20text\x20without\x20panel\x20chrome", () => {
    (strict["match"](
      nodeTypesCss,
      /\.aigen-text-output\.is-text-selection-active\s*\{[^}]*color:\s*var\(--text-primary\)/s,
    ),
      strict["match"](
        nodeTypesCss,
        /\.aigen-text-output\.is-text-selection-active h1,[\s\S]*\.aigen-text-output\.is-text-selection-active strong\s*\{[^}]*color:\s*var\(--text-strong\)/s,
      ),
      strict["doesNotMatch"](
        nodeTypesCss,
        /\.aigen-text-output\.is-text-selection-active\s*\{[^}]*box-shadow:/s,
      ));
  }));
