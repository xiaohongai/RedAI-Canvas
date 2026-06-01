import { test } from "node:test";
import strict from "node:assert/strict";
import {
  computeTooltipPosition,
  installTooltipUnifier,
  unifyNativeTooltipElement,
  unifyNativeTooltips,
} from "./tooltipUnifier.js";
function createFakeClassList() {
  const v0 = new Set();
  return {
    add(v1) {
      v0["add"](v1);
    },
    remove(v2) {
      v0["delete"](v2);
    },
    contains(v3) {
      return v0["has"](v3);
    },
    toggle(v4, v5) {
      const v6 = v5 === undefined ? !v0["has"](v4) : !!v5;
      if (v6) v0["add"](v4);
      else v0["delete"](v4);
      return v6;
    },
  };
}
function createFakeElement(v7 = "button", v8 = {}, v9 = []) {
  const v10 = new Map(Object["entries"](v8));
  return {
    nodeType: 1,
    tagName: v7,
    children: v9,
    hasAttribute(v11) {
      return v10["has"](v11);
    },
    getAttribute(v12) {
      return v10["has"](v12) ? v10["get"](v12) : null;
    },
    contains(v13) {
      if (v13 === this) return true;
      const v14 = (v15) => {
        if (v15 === v13) return true;
        return v15?.["children"]?.["some"]?.(v14) || false;
      };
      return this["children"]?.["some"]?.(v14) || false;
    },
    closest(v16) {
      if (
        v16 === ".generation-node-help-tip" &&
        this["classList"]?.["contains"]?.("generation-node-help-tip")
      )
        return this;
      return null;
    },
    setAttribute(v17, v18) {
      v10["set"](v17, String(v18));
    },
    removeAttribute(v19) {
      v10["delete"](v19);
    },
    querySelectorAll(v20) {
      if (v20 !== "[title]") return [];
      const v21 = [],
        v22 = (v23) => {
          if (v23?.["nodeType"] !== 1) return;
          if (v23["hasAttribute"]("title")) v21["push"](v23);
          v23["children"]?.["forEach"](v22);
        };
      return (this["children"]["forEach"](v22), v21);
    },
  };
}
function createFakeDocument() {
  const v24 = new Map(),
    v25 = new Map(),
    v26 = [],
    v27 = {
      nodeType: 1,
      tagName: "html",
      classList: createFakeClassList(),
      contains(v28) {
        return v28 === this || v28 === v29 || v26["includes"](v28);
      },
    },
    v29 = {
      nodeType: 1,
      tagName: "body",
      children: v26,
      appendChild(v30) {
        return (
          v26["push"](v30),
          (v30["parentElement"] = v29),
          (v30["isConnected"] = true),
          v30
        );
      },
    },
    v31 = (v32 = "div") => {
      const v33 = createFakeElement(v32);
      return (
        (v33["children"] = []),
        (v33["classList"] = createFakeClassList()),
        (v33["style"] = {}),
        (v33["dataset"] = {}),
        (v33["hidden"] = false),
        (v33["isConnected"] = false),
        (v33["appendChild"] = (v34) => {
          return (
            v33["children"]["push"](v34),
            (v34["parentElement"] = v33),
            (v34["isConnected"] = true),
            v34
          );
        }),
        (v33["remove"] = () => {
          const v35 = v26["indexOf"](v33);
          if (v35 >= 0) v26["splice"](v35, 1);
          v33["isConnected"] = false;
        }),
        (v33["getBoundingClientRect"] = () => ({
          left: 0,
          top: 0,
          right: 100,
          bottom: 30,
          width: 100,
          height: 30,
        })),
        v33
      );
    },
    v36 = (v37, v38, v39) => {
      if (!v37["has"](v38)) v37["set"](v38, new Set());
      v37["get"](v38)["add"](v39);
    },
    v40 = (v41, v42, v43) => {
      v41["get"](v42)?.["delete"](v43);
    };
  return {
    documentElement: v27,
    body: v29,
    defaultView: {
      innerWidth: 800,
      innerHeight: 600,
      addEventListener(v44, v45) {
        v36(v25, v44, v45);
      },
      removeEventListener(v46, v47) {
        v40(v25, v46, v47);
      },
    },
    createElement: v31,
    querySelectorAll() {
      return [];
    },
    addEventListener(v48, v49) {
      v36(v24, v48, v49);
    },
    removeEventListener(v50, v51) {
      v40(v24, v50, v51);
    },
    emit(v52, v53) {
      v24["get"](v52)?.["forEach"]((v54) => v54(v53));
    },
    listenerCount(v55) {
      return v24["get"](v55)?.["size"] || 0;
    },
    windowListenerCount(v56) {
      return v25["get"](v56)?.["size"] || 0;
    },
  };
}
(test("unifyNativeTooltipElement\x20migrates\x20title\x20to\x20unified\x20tooltip", () => {
  const v57 = createFakeElement("button", { title: "生成" });
  (strict["equal"](unifyNativeTooltipElement(v57), true),
    strict["equal"](v57["hasAttribute"]("title"), false),
    strict["equal"](v57["getAttribute"]("data-tooltip"), "生成"),
    strict["equal"](v57["getAttribute"]("data-native-title"), "生成"),
    strict["equal"](v57["getAttribute"]("data-tooltip-source"), "native-title"),
    strict["equal"](v57["getAttribute"]("aria-label"), "生成"));
}),
  test("unifyNativeTooltipElement keeps existing custom tooltip", () => {
    const v58 = createFakeElement("button", {
      title: "旧提示",
      "data-tooltip": "当前提示",
    });
    (unifyNativeTooltipElement(v58),
      strict["equal"](v58["hasAttribute"]("title"), false),
      strict["equal"](v58["getAttribute"]("data-tooltip"), "当前提示"),
      strict["equal"](v58["getAttribute"]("data-native-title"), "旧提示"),
      strict["equal"](v58["getAttribute"]("data-tooltip-source"), null));
  }),
  test("unifyNativeTooltipElement updates and clears generated tooltips", () => {
    const v59 = createFakeElement("div", { title: "初始" });
    (unifyNativeTooltipElement(v59),
      v59["setAttribute"]("title", "更新"),
      unifyNativeTooltipElement(v59),
      strict["equal"](v59["getAttribute"]("data-tooltip"), "更新"),
      v59["setAttribute"]("title", ""),
      unifyNativeTooltipElement(v59),
      strict["equal"](v59["getAttribute"]("data-tooltip"), null),
      strict["equal"](v59["getAttribute"]("data-tooltip-source"), null),
      strict["equal"](v59["getAttribute"]("data-native-title"), null));
  }),
  test("unifyNativeTooltips normalizes root and descendants", () => {
    const v60 = createFakeElement("div", { title: "子项" }),
      v61 = createFakeElement("div", { title: "根" }, [v60]);
    (strict["equal"](unifyNativeTooltips(v61), 2),
      strict["equal"](v61["getAttribute"]("data-tooltip"), "根"),
      strict["equal"](v60["getAttribute"]("data-tooltip"), "子项"));
  }),
  test("computeTooltipPosition positions top tooltips and clamps near edges", () => {
    const v62 = computeTooltipPosition(
      { left: 100, top: 100, right: 140, bottom: 124, width: 40, height: 24 },
      { width: 80, height: 30 },
      { width: 400, height: 300 },
      "top",
    );
    (strict["equal"](v62["placement"], "top"),
      strict["equal"](v62["left"], 80),
      strict["equal"](v62["top"], 58),
      strict["equal"](v62["arrowLeft"], 40));
    const v63 = computeTooltipPosition(
      { left: 0, top: 90, right: 20, bottom: 110, width: 20, height: 20 },
      { width: 120, height: 30 },
      { width: 300, height: 240 },
      "top",
    );
    (strict["equal"](v63["left"], 8), strict["equal"](v63["arrowLeft"], 12));
  }),
  test("computeTooltipPosition flips top tooltips below when there is room", () => {
    const v64 = computeTooltipPosition(
      { left: 100, top: 6, right: 140, bottom: 26, width: 40, height: 20 },
      { width: 80, height: 30 },
      { width: 300, height: 240 },
      "top",
    );
    (strict["equal"](v64["placement"], "bottom"),
      strict["equal"](v64["top"], 38));
  }),
  test("computeTooltipPosition\x20supports\x20right\x20tooltips\x20and\x20left\x20fallback", () => {
    const v65 = computeTooltipPosition(
      { left: 40, top: 80, right: 64, bottom: 104, width: 24, height: 24 },
      { width: 90, height: 40 },
      { width: 300, height: 220 },
      "right",
    );
    (strict["equal"](v65["placement"], "right"),
      strict["equal"](v65["left"], 76),
      strict["equal"](v65["top"], 72),
      strict["equal"](v65["arrowTop"], 20));
    const v66 = computeTooltipPosition(
      { left: 260, top: 80, right: 284, bottom: 104, width: 24, height: 24 },
      { width: 90, height: 40 },
      { width: 300, height: 220 },
      "right",
    );
    (strict["equal"](v66["placement"], "left"),
      strict["equal"](v66["left"], 158));
  }),
  test("installTooltipUnifier ignores empty tooltip text and cleans up listeners", () => {
    const v67 = createFakeDocument(),
      v68 = installTooltipUnifier(v67);
    (strict["equal"](
      v67["documentElement"]["classList"]["contains"](
        "has-global-tooltip-portal",
      ),
      true,
    ),
      strict["equal"](v67["listenerCount"]("pointerover") > 0, true),
      strict["equal"](v67["windowListenerCount"]("resize") > 0, true));
    const v69 = createFakeElement("button", { "data-tooltip": "\x20" });
    (v67["emit"]("focusin", { target: v69 }),
      strict["equal"](v67["body"]["children"]["length"], 0),
      v68(),
      strict["equal"](
        v67["documentElement"]["classList"]["contains"](
          "has-global-tooltip-portal",
        ),
        false,
      ),
      strict["equal"](v67["listenerCount"]("pointerover"), 0),
      strict["equal"](v67["windowListenerCount"]("resize"), 0));
  }),
  test("installTooltipUnifier renders non-empty tooltips into a body portal", () => {
    const v70 = createFakeDocument(),
      v71 = installTooltipUnifier(v70),
      v72 = createFakeElement("button", { "data-tooltip": "裁剪视频" });
    ((v72["getBoundingClientRect"] = () => ({
      left: 100,
      top: 120,
      right: 138,
      bottom: 158,
      width: 38,
      height: 38,
    })),
      (v70["documentElement"]["contains"] = (v73) =>
        v73 === v72 ||
        v73 === v70["documentElement"] ||
        v70["body"]["children"]["includes"](v73)),
      v70["emit"]("pointerover", { target: v72 }),
      strict["equal"](v70["body"]["children"]["length"], 1),
      strict["equal"](v70["body"]["children"][0]["hidden"], false),
      strict["equal"](v70["body"]["children"][0]["textContent"], "裁剪视频"),
      v71(),
      strict["equal"](v70["body"]["children"]["length"], 0));
  }),
  test("installTooltipUnifier does not duplicate generation node help portals", () => {
    const v74 = createFakeDocument(),
      v75 = installTooltipUnifier(v74),
      v76 = createFakeElement("button", { "data-tooltip": "进阶声音克隆用法" });
    ((v76["classList"] = createFakeClassList()),
      v76["classList"]["add"]("generation-node-help-tip"),
      v74["emit"]("pointerover", { target: v76 }),
      strict["equal"](v74["body"]["children"]["length"], 0),
      v75());
  }));
