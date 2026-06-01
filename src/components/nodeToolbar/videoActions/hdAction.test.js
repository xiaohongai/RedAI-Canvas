import test, { afterEach } from "node:test";
import strict from "node:assert/strict";
import { bindVideoHdAction } from "./hdAction.js";
const originalGlobals = {
  document: globalThis["document"],
  window: globalThis["window"],
  requestAnimationFrame: globalThis["requestAnimationFrame"],
  cancelAnimationFrame: globalThis["cancelAnimationFrame"],
};
afterEach(() => {
  if (typeof originalGlobals["document"] === "undefined")
    delete globalThis["document"];
  else globalThis["document"] = originalGlobals["document"];
  if (typeof originalGlobals["window"] === "undefined")
    delete globalThis["window"];
  else globalThis["window"] = originalGlobals["window"];
  (typeof originalGlobals["requestAnimationFrame"] === "undefined"
    ? delete globalThis["requestAnimationFrame"]
    : (globalThis["requestAnimationFrame"] =
        originalGlobals["requestAnimationFrame"]),
    typeof originalGlobals["cancelAnimationFrame"] === "undefined"
      ? delete globalThis["cancelAnimationFrame"]
      : (globalThis["cancelAnimationFrame"] =
          originalGlobals["cancelAnimationFrame"]));
});
class FakeElement {
  constructor(v0 = "div") {
    ((this["nodeType"] = 1),
      (this["tagName"] = String(v0 || "div")["toUpperCase"]()),
      (this["className"] = ""),
      (this["children"] = []),
      (this["parentNode"] = null),
      (this["style"] = {}),
      (this["textContent"] = ""),
      (this["_listeners"] = new Map()),
      (this["_rect"] = { left: 0, top: 0, width: 0, height: 0 }),
      (this["_offsetLeft"] = 0),
      (this["_offsetWidth"] = 0),
      (this["classList"] = {
        add: (...v1) => this["_setClasses"](v1, true),
        remove: (...v2) => this["_setClasses"](v2, false),
        contains: (v3) => this["_classNames"]()["includes"](v3),
      }));
  }
  ["_classNames"]() {
    return String(this["className"] || "")
      ["split"](/\s+/)
      ["filter"](Boolean);
  }
  ["_setClasses"](v4, v5) {
    const v6 = new Set(this["_classNames"]());
    (v4["forEach"]((v7) => {
      const v8 = String(v7 || "")["trim"]();
      if (!v8) return;
      if (v5) v6["add"](v8);
      else v6["delete"](v8);
    }),
      (this["className"] = Array["from"](v6)["join"]("\x20")));
  }
  ["appendChild"](v9) {
    return ((v9["parentNode"] = this), this["children"]["push"](v9), v9);
  }
  ["remove"]() {
    if (!this["parentNode"]) return;
    const v10 = this["parentNode"]["children"] || [],
      v11 = v10["indexOf"](this);
    if (v11 >= 0) v10["splice"](v11, 1);
    this["parentNode"] = null;
  }
  ["contains"](v12) {
    if (v12 === this) return true;
    return this["children"]["some"]((v13) => v13?.["contains"]?.(v12));
  }
  ["addEventListener"](v14, v15) {
    if (typeof v15 !== "function") return;
    if (!this["_listeners"]["has"](v14)) this["_listeners"]["set"](v14, []);
    this["_listeners"]["get"](v14)["push"](v15);
  }
  ["removeEventListener"](v16, v17) {
    const v18 = this["_listeners"]["get"](v16) || [];
    this["_listeners"]["set"](
      v16,
      v18["filter"]((v19) => v19 !== v17),
    );
  }
  ["dispatchEvent"](v20) {
    const v21 = {
      target: this,
      stopPropagation() {},
      preventDefault() {},
      ...v20,
    };
    (this["_listeners"]["get"](v21["type"]) || [])["forEach"]((v22) =>
      v22(v21),
    );
  }
  ["querySelector"](v23) {
    return this["querySelectorAll"](v23)[0] || null;
  }
  ["querySelectorAll"](v24) {
    const v25 = String(v24 || "")["startsWith"](".")
        ? String(v24)["slice"](1)
        : "",
      v26 = [],
      v27 = (v28) => {
        if (!v28) return;
        if (v25 && v28["classList"]?.["contains"](v25)) v26["push"](v28);
        (v28["children"] || [])["forEach"](v27);
      };
    return (v27(this), v26);
  }
  ["getBoundingClientRect"]() {
    const v29 = { left: 0, top: 0, width: 0, height: 0, ...this["_rect"] };
    return {
      ...v29,
      right: v29["right"] ?? v29["left"] + v29["width"],
      bottom: v29["bottom"] ?? v29["top"] + v29["height"],
    };
  }
  ["setRect"](v30) {
    ((this["_rect"] = { ...v30 }),
      (this["_offsetLeft"] = Number(v30?.["offsetLeft"] ?? v30?.["left"] ?? 0)),
      (this["_offsetWidth"] = Number(
        v30?.["offsetWidth"] ?? v30?.["width"] ?? 0,
      )));
  }
  get ["offsetLeft"]() {
    return this["_offsetLeft"];
  }
  get ["offsetWidth"]() {
    return this["_offsetWidth"];
  }
  get ["offsetHeight"]() {
    return 1;
  }
}
function installPopupDom() {
  const v31 = new FakeElement("body"),
    v32 = new Map(),
    v33 = {
      body: v31,
      createElement(v34) {
        return new FakeElement(v34);
      },
      querySelector(v35) {
        return v31["querySelector"](v35);
      },
      querySelectorAll(v36) {
        return v31["querySelectorAll"](v36);
      },
      addEventListener(v37, v38, v39) {
        if (typeof v38 !== "function") return;
        if (!v32["has"](v37)) v32["set"](v37, []);
        v32["get"](v37)["push"]({ handler: v38, options: v39 });
      },
      removeEventListener(v40, v41) {
        const v42 = v32["get"](v40) || [];
        v32["set"](
          v40,
          v42["filter"]((v43) => v43["handler"] !== v41),
        );
      },
      dispatchPointerDown(v44) {
        (v32["get"]("pointerdown") || [])["forEach"](({ handler: v45 }) =>
          v45({ target: v44 }),
        );
      },
      getListeners(v46) {
        return v32["get"](v46) || [];
      },
    };
  let v47 = 0;
  const v48 = new Map();
  return (
    (globalThis["document"] = v33),
    (globalThis["window"] = {
      setTimeout(v49) {
        return (v49?.(), 1);
      },
      clearTimeout() {},
    }),
    (globalThis["requestAnimationFrame"] = (v50) => {
      return ((v47 += 1), v48["set"](v47, v50), v47);
    }),
    (globalThis["cancelAnimationFrame"] = (v51) => {
      v48["delete"](v51);
    }),
    {
      document: v33,
      getRafCount() {
        return v48["size"];
      },
    }
  );
}
function createToolbarWithHdButton() {
  const v52 = new FakeElement("div"),
    v53 = new FakeElement("button");
  return (
    (v53["className"] = "act-hd"),
    v53["setRect"]({
      left: 100,
      top: 50,
      width: 20,
      height: 20,
      offsetLeft: 96,
    }),
    v52["appendChild"](v53),
    document["body"]["appendChild"](v52),
    { toolbarEl: v52, hdBtn: v53 }
  );
}
function createActionContext(v54) {
  return {
    toolbarEl: v54,
    nodeData: { id: "video-1" },
    createRunningHubTaskStateMachine() {
      return {
        state: { active: false },
        bindButton() {},
        reset() {},
        isCancelled() {
          return false;
        },
      };
    },
    bindRunningHubToolbarTaskButton() {},
  };
}
function openPopup(v55) {
  v55["dispatchEvent"]({
    type: "click",
    target: v55,
    stopPropagation() {},
    preventDefault() {},
  });
  const v56 = document["querySelector"](".v2-hd-popup");
  return (strict["ok"](v56), v56);
}
(test("video hd popup is bound inside the toolbar instead of following from body", () => {
  const { getRafCount: v57 } = installPopupDom(),
    { toolbarEl: v58, hdBtn: v59 } = createToolbarWithHdButton();
  bindVideoHdAction(createActionContext(v58));
  const v60 = openPopup(v59);
  (strict["equal"](v60["parentNode"], v58),
    strict["equal"](
      v60["classList"]["contains"]("node-toolbar-action-menu"),
      true,
    ),
    strict["equal"](v60["style"]["position"], "absolute"),
    strict["equal"](v60["style"]["left"], "106px"),
    strict["equal"](v60["style"]["bottom"], "calc(100% + 12px)"),
    strict["equal"](document["body"]["contains"](v60), true),
    strict["equal"](v57(), 0));
}),
  test("video hd popup closes on outside pointerdown", () => {
    const { document: v61 } = installPopupDom(),
      { toolbarEl: v62, hdBtn: v63 } = createToolbarWithHdButton();
    bindVideoHdAction(createActionContext(v62));
    const v64 = openPopup(v63);
    (strict["equal"](
      v61["getListeners"]("pointerdown")["some"](
        (v65) => v65["options"] === true,
      ),
      true,
    ),
      v61["dispatchPointerDown"](v61["createElement"]("div")),
      strict["equal"](v61["body"]["contains"](v64), false));
  }));
