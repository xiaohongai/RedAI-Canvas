import test, { afterEach } from "node:test";
import strict from "node:assert/strict";
import { bindImageToolbarLayoutUi } from "./imageToolbarLayoutUi.js";
const originalGlobals = {
  document: globalThis["document"],
  requestAnimationFrame: globalThis["requestAnimationFrame"],
  cancelAnimationFrame: globalThis["cancelAnimationFrame"],
};
afterEach(() => {
  if (typeof originalGlobals["document"] === "undefined")
    delete globalThis["document"];
  else globalThis["document"] = originalGlobals["document"];
  (typeof originalGlobals["requestAnimationFrame"] === "undefined"
    ? delete globalThis["requestAnimationFrame"]
    : (globalThis["requestAnimationFrame"] =
        originalGlobals["requestAnimationFrame"]),
    typeof originalGlobals["cancelAnimationFrame"] === "undefined"
      ? delete globalThis["cancelAnimationFrame"]
      : (globalThis["cancelAnimationFrame"] =
          originalGlobals["cancelAnimationFrame"]));
});
class FakeClassList {
  constructor(v0) {
    this["owner"] = v0;
  }
  ["_names"]() {
    return String(this["owner"]["className"] || "")
      ["split"](/\s+/)
      ["filter"](Boolean);
  }
  ["_set"](v1) {
    this["owner"]["className"] = Array["from"](new Set(v1))["join"]("\x20");
  }
  ["add"](...v2) {
    const v3 = this["_names"]();
    (v2["forEach"]((v4) => {
      const v5 = String(v4 || "")["trim"]();
      if (v5 && !v3["includes"](v5)) v3["push"](v5);
    }),
      this["_set"](v3));
  }
  ["remove"](...v6) {
    const v7 = new Set(v6["map"]((v8) => String(v8 || "")["trim"]()));
    this["_set"](this["_names"]()["filter"]((v9) => !v7["has"](v9)));
  }
  ["contains"](v10) {
    return this["_names"]()["includes"](v10);
  }
  ["toggle"](v11, v12) {
    const v13 = v12 === undefined ? !this["contains"](v11) : !!v12;
    if (v13) this["add"](v11);
    else this["remove"](v11);
    return v13;
  }
  [Symbol["iterator"]]() {
    return this["_names"]()[Symbol["iterator"]]();
  }
}
class FakeElement {
  constructor(v14 = "div", v15 = "") {
    ((this["nodeType"] = 1),
      (this["tagName"] = String(v14 || "div")["toUpperCase"]()),
      (this["className"] = v15),
      (this["children"] = []),
      (this["parentNode"] = null),
      (this["dataset"] = {}),
      (this["attributes"] = new Map()),
      (this["style"] = {}),
      (this["hidden"] = false),
      (this["draggable"] = false),
      (this["isConnected"] = false),
      (this["textContent"] = ""),
      (this["_listeners"] = new Map()),
      (this["_rect"] = { left: 0, top: 0, width: 0, height: 0 }),
      (this["appendChildCount"] = 0),
      (this["insertBeforeCount"] = 0),
      (this["classList"] = new FakeClassList(this)));
  }
  ["appendChild"](v16) {
    return (
      (this["appendChildCount"] += 1),
      this["_detachChild"](v16),
      (v16["parentNode"] = this),
      v16["_setConnected"](this["isConnected"]),
      this["children"]["push"](v16),
      v16
    );
  }
  ["insertBefore"](v17, v18) {
    ((this["insertBeforeCount"] += 1),
      this["_detachChild"](v17),
      (v17["parentNode"] = this),
      v17["_setConnected"](this["isConnected"]));
    const v19 = this["children"]["indexOf"](v18);
    if (v19 >= 0) this["children"]["splice"](v19, 0, v17);
    else this["children"]["push"](v17);
    return v17;
  }
  ["_detachChild"](v20) {
    const v21 = v20?.["parentNode"];
    if (!v21) return;
    const v22 = v21["children"]["indexOf"](v20);
    if (v22 >= 0) v21["children"]["splice"](v22, 1);
  }
  ["_setConnected"](v23) {
    ((this["isConnected"] = !!v23),
      this["children"]["forEach"]((v24) => v24["_setConnected"](v23)));
  }
  ["setAttribute"](v25, v26) {
    const v27 = String(v25),
      v28 = String(v26);
    this["attributes"]["set"](v27, v28);
    if (v27["startsWith"]("data-")) {
      const v29 = v27["slice"](5)["replace"](/-([a-z])/g, (v30, v31) =>
        v31["toUpperCase"](),
      );
      this["dataset"][v29] = v28;
    }
  }
  ["getAttribute"](v32) {
    return this["attributes"]["get"](String(v32)) ?? null;
  }
  ["addEventListener"](v33, v34) {
    if (typeof v34 !== "function") return;
    if (!this["_listeners"]["has"](v33)) this["_listeners"]["set"](v33, []);
    this["_listeners"]["get"](v33)["push"](v34);
  }
  ["dispatchEvent"](v35) {
    const v36 = {
      target: this,
      currentTarget: this,
      preventDefault() {},
      stopPropagation() {},
      ...v35,
    };
    (this["_listeners"]["get"](v36["type"]) || [])["forEach"]((v37) =>
      v37(v36),
    );
  }
  ["contains"](v38) {
    if (v38 === this) return true;
    return this["children"]["some"]((v39) => v39["contains"](v38));
  }
  ["matches"](v40) {
    return matchesSelector(this, v40);
  }
  ["closest"](v41) {
    let v42 = this;
    while (v42) {
      if (v42["matches"](v41)) return v42;
      v42 = v42["parentNode"];
    }
    return null;
  }
  ["querySelector"](v43) {
    return this["querySelectorAll"](v43)[0] || null;
  }
  ["querySelectorAll"](v44) {
    const v45 = [],
      v46 = (v47) => {
        v47["children"]["forEach"]((v48) => {
          if (matchesSelector(v48, v44)) v45["push"](v48);
          v46(v48);
        });
      };
    return (v46(this), v45);
  }
  ["setRect"](v49) {
    this["_rect"] = { ...this["_rect"], ...v49 };
  }
  ["getBoundingClientRect"]() {
    const v50 = this["parentNode"]
        ? this["parentNode"]["children"]["indexOf"](this)
        : -1,
      v51 = {
        ...this["_rect"],
        left:
          v50 >= 0 && this["classList"]["contains"]("ftb-btn")
            ? v50 * 48
            : this["_rect"]["left"],
      };
    return {
      ...v51,
      right: v51["left"] + v51["width"],
      bottom: v51["top"] + v51["height"],
    };
  }
  get ["nextSibling"]() {
    if (!this["parentNode"]) return null;
    const v52 = this["parentNode"]["children"]["indexOf"](this);
    return v52 >= 0 ? this["parentNode"]["children"][v52 + 1] || null : null;
  }
  get ["nextElementSibling"]() {
    return this["nextSibling"];
  }
  get ["lastElementChild"]() {
    return this["children"][this["children"]["length"] - 1] || null;
  }
}
function matchesSelector(v53, v54) {
  const v55 = String(v54 || "")["trim"]();
  if (v55["startsWith"]("."))
    return v53["classList"]["contains"](v55["slice"](1));
  if (v55 === "[data-zone]") return v53["getAttribute"]("data-zone") !== null;
  const v56 = v55["match"](/^\[data-([a-z-]+)="([^"]+)"\]$/);
  if (v56) return v53["getAttribute"]("data-" + v56[1]) === v56[2];
  return false;
}
function installFakeDocument() {
  const v57 = new FakeElement("body");
  v57["_setConnected"](true);
  const v58 = new Map();
  ((globalThis["document"] = {
    body: v57,
    addEventListener(v59, v60) {
      if (!v58["has"](v59)) v58["set"](v59, []);
      v58["get"](v59)["push"](v60);
    },
    removeEventListener(v61, v62) {
      const v63 = (v58["get"](v61) || [])["filter"]((v64) => v64 !== v62);
      v58["set"](v61, v63);
    },
  }),
    (globalThis["requestAnimationFrame"] = () => 1),
    (globalThis["cancelAnimationFrame"] = () => {}));
}
function createButton(v65) {
  return new FakeElement("button", "ftb-btn act-" + v65);
}
function createToolbarHarness() {
  installFakeDocument();
  const v66 = new FakeElement("div", "v2-img-toolbar"),
    v67 = new FakeElement("div", "v2-img-toolbar-zone");
  v67["setAttribute"]("data-zone", "outside-primary");
  const v68 = new FakeElement("div", "v2-img-toolbar-zone");
  v68["setAttribute"]("data-zone", "outside-secondary");
  const v69 = createButton("more-tools"),
    v70 = new FakeElement("div", "v2-img-toolbar-main-divider"),
    v71 = new FakeElement("div", "v2-img-toolbar-more-menu");
  v71["setAttribute"]("data-role", "more-menu");
  const v72 = new FakeElement("div", "v2-img-toolbar-zone");
  v72["setAttribute"]("data-zone", "more");
  const v73 = createButton("customize-tools");
  v73["classList"]["add"]("act-customize-tools");
  const v74 = createButton("matting"),
    v75 = createButton("expand"),
    v76 = createButton("hd");
  return (
    v74["setRect"]({ left: 0, top: 0, width: 38, height: 38 }),
    v75["setRect"]({ left: 48, top: 0, width: 38, height: 38 }),
    v67["appendChild"](v74),
    v67["appendChild"](v75),
    v72["appendChild"](v76),
    v71["appendChild"](v72),
    v71["appendChild"](v73),
    v66["appendChild"](v67),
    v66["appendChild"](v69),
    v66["appendChild"](v70),
    v66["appendChild"](v68),
    v66["appendChild"](v71),
    document["body"]["appendChild"](v66),
    {
      toolbarEl: v66,
      primaryZone: v67,
      moreZone: v72,
      moreMenu: v71,
      customizeBtn: v73,
      mattingBtn: v74,
      expandBtn: v75,
      hdBtn: v76,
    }
  );
}
function actionFromButton(v77) {
  const v78 = new Set(["matting", "expand", "hd"]);
  for (const v79 of v77["classList"]) {
    if (!v79["startsWith"]("act-")) continue;
    const v80 = v79["slice"](4);
    if (v78["has"](v80)) return v80;
  }
  return "";
}
function normalizeLayout(v81) {
  return {
    outsidePrimary: [...(v81?.["outsidePrimary"] || [])],
    outsideSecondary: [...(v81?.["outsideSecondary"] || [])],
    more: [...(v81?.["more"] || [])],
  };
}
(test("image\x20toolbar\x20custom\x20drag\x20skips\x20DOM\x20writes\x20when\x20the\x20slot\x20is\x20unchanged", () => {
  const v82 = createToolbarHarness(),
    v83 = {
      ui: {
        imageToolbarLayout: {
          outsidePrimary: ["matting", "expand"],
          outsideSecondary: [],
          more: ["hd"],
        },
      },
    };
  (bindImageToolbarLayoutUi(v82["toolbarEl"], {
    store: {},
    getStateSnapshot: () => v83,
    imageToolbarActions: ["matting", "expand", "hd"],
    normalizeImageToolbarLayout: normalizeLayout,
    serializeImageToolbarLayout: (v84) =>
      JSON["stringify"](normalizeLayout(v84)),
    getToolbarActionFromButton: actionFromButton,
  }),
    v82["customizeBtn"]["dispatchEvent"]({ type: "click" }),
    strict["equal"](v82["mattingBtn"]["draggable"], true),
    v82["mattingBtn"]["dispatchEvent"]({
      type: "dragstart",
      dataTransfer: { effectAllowed: "", setData() {} },
    }),
    strict["equal"](
      v82["toolbarEl"]["classList"]["contains"]("is-toolbar-drag-active"),
      true,
    ),
    strict["equal"](
      v82["moreMenu"]["classList"]["contains"]("is-toolbar-drag-active"),
      true,
    ));
  const v85 = v82["primaryZone"]["insertBeforeCount"],
    v86 = v82["primaryZone"]["appendChildCount"];
  (v82["primaryZone"]["dispatchEvent"]({
    type: "dragover",
    clientX: 0,
    preventDefault() {},
  }),
    strict["equal"](v82["primaryZone"]["insertBeforeCount"], v85),
    strict["equal"](v82["primaryZone"]["appendChildCount"], v86),
    v82["mattingBtn"]["dispatchEvent"]({ type: "dragend" }),
    strict["equal"](
      v82["toolbarEl"]["classList"]["contains"]("is-toolbar-drag-active"),
      false,
    ),
    strict["equal"](
      v82["moreMenu"]["classList"]["contains"]("is-toolbar-drag-active"),
      false,
    ));
}),
  test("image toolbar custom drag keeps drop zone background stable while moving inside it", () => {
    const v87 = createToolbarHarness(),
      v88 = {
        ui: {
          imageToolbarLayout: {
            outsidePrimary: ["matting", "expand"],
            outsideSecondary: [],
            more: ["hd"],
          },
        },
      };
    (bindImageToolbarLayoutUi(v87["toolbarEl"], {
      store: {},
      getStateSnapshot: () => v88,
      imageToolbarActions: ["matting", "expand", "hd"],
      normalizeImageToolbarLayout: normalizeLayout,
      serializeImageToolbarLayout: (v89) =>
        JSON["stringify"](normalizeLayout(v89)),
      getToolbarActionFromButton: actionFromButton,
    }),
      v87["customizeBtn"]["dispatchEvent"]({ type: "click" }),
      v87["mattingBtn"]["dispatchEvent"]({
        type: "dragstart",
        dataTransfer: { effectAllowed: "", setData() {} },
      }),
      v87["primaryZone"]["dispatchEvent"]({
        type: "dragover",
        target: v87["expandBtn"],
        clientX: 0,
        preventDefault() {},
      }),
      strict["equal"](
        v87["primaryZone"]["classList"]["contains"]("is-drop-target"),
        true,
      ),
      v87["primaryZone"]["dispatchEvent"]({
        type: "dragleave",
        relatedTarget: v87["expandBtn"],
      }),
      strict["equal"](
        v87["primaryZone"]["classList"]["contains"]("is-drop-target"),
        true,
      ),
      v87["moreZone"]["dispatchEvent"]({
        type: "dragover",
        target: v87["hdBtn"],
        clientX: 0,
        preventDefault() {},
      }),
      strict["equal"](
        v87["primaryZone"]["classList"]["contains"]("is-drop-target"),
        false,
      ),
      strict["equal"](
        v87["moreZone"]["classList"]["contains"]("is-drop-target"),
        true,
      ));
  }),
  test("image\x20toolbar\x20custom\x20drag\x20uses\x20flip\x20transforms\x20when\x20buttons\x20are\x20pushed\x20aside", () => {
    const v90 = createToolbarHarness(),
      v91 = {
        ui: {
          imageToolbarLayout: {
            outsidePrimary: ["matting", "expand"],
            outsideSecondary: [],
            more: ["hd"],
          },
        },
      };
    (bindImageToolbarLayoutUi(v90["toolbarEl"], {
      store: {},
      getStateSnapshot: () => v91,
      imageToolbarActions: ["matting", "expand", "hd"],
      normalizeImageToolbarLayout: normalizeLayout,
      serializeImageToolbarLayout: (v92) =>
        JSON["stringify"](normalizeLayout(v92)),
      getToolbarActionFromButton: actionFromButton,
    }),
      v90["customizeBtn"]["dispatchEvent"]({ type: "click" }),
      v90["mattingBtn"]["dispatchEvent"]({
        type: "dragstart",
        dataTransfer: { effectAllowed: "", setData() {} },
      }),
      v90["primaryZone"]["dispatchEvent"]({
        type: "dragover",
        target: v90["expandBtn"],
        clientX: 999,
        preventDefault() {},
      }),
      strict["deepEqual"](v90["primaryZone"]["children"], [
        v90["expandBtn"],
        v90["mattingBtn"],
      ]),
      strict["match"](
        String(v90["expandBtn"]["style"]["transform"] || ""),
        /translate\(48px/,
      ),
      strict["match"](
        String(v90["mattingBtn"]["style"]["transform"] || ""),
        /translate\(-48px/,
      ));
  }),
  test("image toolbar custom drag persists the portaled more zone order", () => {
    const v93 = createToolbarHarness(),
      v94 = {
        ui: {
          imageToolbarLayout: {
            outsidePrimary: ["matting"],
            outsideSecondary: [],
            more: ["expand", "hd"],
          },
        },
      };
    let v95 = null;
    (bindImageToolbarLayoutUi(v93["toolbarEl"], {
      store: {
        setImageToolbarLayout(v96) {
          v95 = v96;
        },
      },
      getStateSnapshot: () => v94,
      imageToolbarActions: ["matting", "expand", "hd"],
      normalizeImageToolbarLayout: normalizeLayout,
      serializeImageToolbarLayout: (v97) =>
        JSON["stringify"](normalizeLayout(v97)),
      getToolbarActionFromButton: actionFromButton,
    }),
      v93["customizeBtn"]["dispatchEvent"]({ type: "click" }),
      strict["equal"](v93["moreMenu"]["parentNode"], document["body"]),
      v93["hdBtn"]["dispatchEvent"]({
        type: "dragstart",
        dataTransfer: { effectAllowed: "", setData() {} },
      }),
      v93["moreZone"]["dispatchEvent"]({
        type: "dragover",
        clientX: 0,
        preventDefault() {},
      }),
      v93["moreZone"]["dispatchEvent"]({ type: "drop", preventDefault() {} }),
      strict["deepEqual"](v95, {
        outsidePrimary: ["matting"],
        outsideSecondary: [],
        more: ["hd", "expand"],
      }));
  }));
