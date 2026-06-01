import { test } from "node:test";
import strict from "node:assert/strict";
import { playWorkflowSaveFly } from "./workflowSaveAnimation.js";
class FakeElement {
  constructor(v0 = "", v1 = "") {
    ((this["id"] = v0),
      (this["className"] = v1),
      (this["style"] = {}),
      (this["children"] = []),
      (this["parentElement"] = null),
      (this["rect"] = null),
      (this["animateCalls"] = []),
      (this["removed"] = false));
  }
  ["appendChild"](v2) {
    return (this["children"]["push"](v2), (v2["parentElement"] = this), v2);
  }
  ["cloneNode"](v3 = false) {
    const v4 = new FakeElement(this["id"], this["className"]);
    return (
      (v4["rect"] = this["rect"] ? { ...this["rect"] } : null),
      v3 &&
        this["children"]["forEach"]((v5) =>
          v4["appendChild"](v5["cloneNode"](true)),
        ),
      v4
    );
  }
  ["removeAttribute"](v6) {
    if (v6 === "id") this["id"] = "";
  }
  ["querySelectorAll"]() {
    return [];
  }
  ["getBoundingClientRect"]() {
    if (!this["rect"])
      return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
    const v7 = Number(this["rect"]["left"] || 0),
      v8 = Number(this["rect"]["top"] || 0),
      v9 = Number(this["rect"]["width"] || 0),
      v10 = Number(this["rect"]["height"] || 0);
    return {
      left: v7,
      top: v8,
      width: v9,
      height: v10,
      right: v7 + v9,
      bottom: v8 + v10,
    };
  }
  ["animate"](v11, v12) {
    const v13 = {
      keyframes: v11,
      options: v12,
      onfinish: null,
      oncancel: null,
      finish() {
        this["onfinish"]?.();
      },
    };
    return (this["animateCalls"]["push"](v13), v13);
  }
  ["remove"]() {
    this["removed"] = true;
    if (!this["parentElement"]) return;
    ((this["parentElement"]["children"] = this["parentElement"]["children"][
      "filter"
    ]((v14) => v14 !== this)),
      (this["parentElement"] = null));
  }
}
function createHarness({
  reducedMotion: reducedMotion = false,
  includeTarget: includeTarget = true,
} = {}) {
  const v15 = new FakeElement("body"),
    v16 = new FakeElement("btnWorkflows");
  v16["rect"] = { left: 20, top: 260, width: 40, height: 40 };
  const v17 = new FakeElement("workflow-cover", "v2-workflow-form-cover");
  ((v17["rect"] = { left: 300, top: 120, width: 240, height: 135 }),
    v17["appendChild"](new FakeElement("cover-img", "")));
  const v18 = {
      body: v15,
      createElement: () => new FakeElement(),
      getElementById: (v19) =>
        includeTarget && v19 === "btnWorkflows" ? v16 : null,
    },
    v20 = {
      matchMedia: () => ({ matches: reducedMotion }),
      setTimeout(v21) {
        if (typeof v21 === "function") v21();
        return 1;
      },
    };
  return {
    body: v15,
    documentRef: v18,
    source: v17,
    target: v16,
    windowRef: v20,
  };
}
(test("workflowSaveAnimation: 创建封面飞行动画并在结束后 pulse 工作流按钮", () => {
  const {
      body: v22,
      documentRef: v23,
      source: v24,
      target: v25,
      windowRef: v26,
    } = createHarness(),
    v27 = playWorkflowSaveFly({
      sourceEl: v24,
      documentRef: v23,
      windowRef: v26,
    });
  (strict["ok"](v27),
    strict["equal"](v22["children"]["length"], 1),
    strict["equal"](v27["fly"]["className"], "v2-workflow-save-fly"),
    strict["equal"](v27["fly"]["style"]["left"], "300px"),
    strict["equal"](v27["fly"]["style"]["top"], "120px"),
    strict["equal"](v27["fly"]["style"]["width"], "240px"),
    strict["equal"](v27["fly"]["style"]["height"], "135px"),
    strict["equal"](v27["fly"]["children"][0]["id"], ""),
    strict["equal"](v27["fly"]["animateCalls"]["length"], 1),
    strict["equal"](v27["fly"]["animateCalls"][0]["options"]["duration"], 520),
    strict["equal"](
      v27["fly"]["animateCalls"][0]["options"]["easing"],
      "cubic-bezier(0.2, 0, 0, 1)",
    ),
    v27["animation"]["finish"](),
    strict["equal"](v27["fly"]["removed"], true),
    strict["equal"](v22["children"]["length"], 0),
    strict["equal"](v25["animateCalls"]["length"], 1),
    strict["equal"](v25["animateCalls"][0]["options"]["duration"], 260));
}),
  test("workflowSaveAnimation: reduced motion 时跳过动画", () => {
    const {
        body: v28,
        documentRef: v29,
        source: v30,
        target: v31,
        windowRef: v32,
      } = createHarness({ reducedMotion: true }),
      v33 = playWorkflowSaveFly({
        sourceEl: v30,
        documentRef: v29,
        windowRef: v32,
      });
    (strict["equal"](v33, null),
      strict["equal"](v28["children"]["length"], 0),
      strict["equal"](v31["animateCalls"]["length"], 0));
  }),
  test("workflowSaveAnimation: 缺少目标时安全跳过", () => {
    const {
        body: v34,
        documentRef: v35,
        source: v36,
        windowRef: v37,
      } = createHarness({ includeTarget: false }),
      v38 = playWorkflowSaveFly({
        sourceEl: v36,
        documentRef: v35,
        windowRef: v37,
      });
    (strict["equal"](v38, null), strict["equal"](v34["children"]["length"], 0));
  }));
