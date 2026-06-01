import test from "node:test";
import strict from "node:assert/strict";
import {
  _resetRefThumbMediaRevealForTests,
  ensureThumbDecoded,
  revealRefThumbMedia,
} from "./refThumbMediaReveal.js";
const ORIGINAL_IMAGE = globalThis["Image"],
  ORIGINAL_REQUEST_ANIMATION_FRAME = globalThis["requestAnimationFrame"],
  ORIGINAL_SET_TIMEOUT = globalThis["setTimeout"];
function flushMicrotasks() {
  return Promise["resolve"]()["then"](() => Promise["resolve"]());
}
function createClassList(...v0) {
  const v1 = new Set(v0);
  return {
    add(...v2) {
      v2["forEach"]((v3) => v1["add"](String(v3 || "")));
    },
    remove(...v4) {
      v4["forEach"]((v5) => v1["delete"](String(v5 || "")));
    },
    contains(v6) {
      return v1["has"](String(v6 || ""));
    },
  };
}
function createImg(v7 = "/output/ref-thumb.jpg") {
  const v8 = {
    _src: v7,
    isConnected: true,
    complete: false,
    naturalWidth: 0,
    dataset: {},
    classList: createClassList("ref-thumb-media", "is-pending"),
    getAttribute(v9) {
      return v9 === "src" ? this["_src"] : "";
    },
    set src(v10) {
      this["_src"] = String(v10 || "");
    },
    get src() {
      return this["_src"] || "";
    },
  };
  return v8;
}
function createWrap(v11, v12 = "sig-1") {
  return {
    dataset: { sig: v12 },
    querySelectorAll(v13) {
      if (
        v13 === "img.ref-thumb-media.is-pending" &&
        v11["classList"]["contains"]("is-pending")
      )
        return [v11];
      return [];
    },
  };
}
function installFakeImage(v14) {
  const v15 = Array["from"](v14),
    v16 = [];
  return (
    (globalThis["Image"] = class v17 {
      constructor() {
        v16["push"](this);
      }
      set ["src"](v18) {
        this["_src"] = String(v18 || "");
      }
      get ["src"]() {
        return this["_src"] || "";
      }
      ["decode"]() {
        const v19 = v15["length"] ? v15["shift"]() : true;
        return v19
          ? Promise["resolve"]()
          : Promise["reject"](new Error("decode failed"));
      }
    }),
    v16
  );
}
(test["afterEach"](() => {
  _resetRefThumbMediaRevealForTests();
  if (typeof ORIGINAL_IMAGE === "undefined") delete globalThis["Image"];
  else globalThis["Image"] = ORIGINAL_IMAGE;
  (typeof ORIGINAL_REQUEST_ANIMATION_FRAME === "undefined"
    ? delete globalThis["requestAnimationFrame"]
    : (globalThis["requestAnimationFrame"] = ORIGINAL_REQUEST_ANIMATION_FRAME),
    (globalThis["setTimeout"] = ORIGINAL_SET_TIMEOUT));
}),
  test("ensureThumbDecoded\x20retries\x20the\x20same\x20src\x20after\x20a\x20failed\x20decode", async () => {
    const v20 = installFakeImage([false, true]);
    (strict["equal"](await ensureThumbDecoded("/output/thumb.jpg"), false),
      strict["equal"](await ensureThumbDecoded("/output/thumb.jpg"), true),
      strict["equal"](await ensureThumbDecoded("/output/thumb.jpg"), true),
      strict["equal"](v20["length"], 2));
  }),
  test("revealRefThumbMedia keeps a failed thumbnail hidden", async () => {
    installFakeImage([false, false, false, false]);
    const v21 = [];
    ((globalThis["requestAnimationFrame"] = (v22) => {
      return (v22(), 1);
    }),
      (globalThis["setTimeout"] = (v23) => {
        return (v21["push"](v23), v21["length"]);
      }));
    const v24 = createImg(),
      v25 = createWrap(v24);
    (revealRefThumbMedia(v25, "sig-1"),
      await flushMicrotasks(),
      strict["equal"](v24["classList"]["contains"]("is-pending"), true),
      strict["equal"](v24["classList"]["contains"]("is-ready"), false),
      strict["equal"](v24["dataset"]["thumbError"], undefined));
    while (v21["length"]) {
      (v21["shift"]()(), await flushMicrotasks());
    }
    (strict["equal"](v24["classList"]["contains"]("is-pending"), true),
      strict["equal"](v24["classList"]["contains"]("is-ready"), false),
      strict["equal"](v24["dataset"]["thumbError"], "1"),
      strict["equal"](v25["dataset"]["thumbError"], "1"));
  }),
  test("revealRefThumbMedia reveals only after a retry succeeds", async () => {
    installFakeImage([false, true]);
    const v26 = [];
    ((globalThis["requestAnimationFrame"] = (v27) => {
      return (v27(), 1);
    }),
      (globalThis["setTimeout"] = (v28) => {
        return (v26["push"](v28), v26["length"]);
      }));
    const v29 = createImg(),
      v30 = createWrap(v29);
    (revealRefThumbMedia(v30, "sig-1"),
      await flushMicrotasks(),
      strict["equal"](v29["classList"]["contains"]("is-pending"), true),
      strict["equal"](v26["length"], 1),
      v26["shift"]()(),
      await flushMicrotasks(),
      strict["equal"](v29["classList"]["contains"]("is-pending"), false),
      strict["equal"](v29["classList"]["contains"]("is-ready"), true),
      strict["equal"](v29["dataset"]["thumbError"], undefined),
      strict["equal"](v30["dataset"]["thumbError"], undefined));
  }),
  test("revealRefThumbMedia waits for a newly created thumbnail to attach", async () => {
    const v31 = installFakeImage([true]),
      v32 = [];
    ((globalThis["requestAnimationFrame"] = (v33) => {
      return (v33(), 1);
    }),
      (globalThis["setTimeout"] = (v34) => {
        return (v32["push"](v34), v32["length"]);
      }));
    const v35 = createImg();
    v35["isConnected"] = false;
    const v36 = createWrap(v35);
    (revealRefThumbMedia(v36, "sig-1"),
      await flushMicrotasks(),
      strict["equal"](v31["length"], 0),
      strict["equal"](v35["classList"]["contains"]("is-pending"), true),
      strict["equal"](v32["length"], 1),
      (v35["isConnected"] = true),
      v32["shift"]()(),
      await flushMicrotasks(),
      strict["equal"](v31["length"], 1),
      strict["equal"](v35["classList"]["contains"]("is-pending"), false),
      strict["equal"](v35["classList"]["contains"]("is-ready"), true));
  }),
  test("revealRefThumbMedia ignores stale retries after the signature changes", async () => {
    installFakeImage([false, true]);
    const v37 = [];
    ((globalThis["requestAnimationFrame"] = (v38) => {
      return (v38(), 1);
    }),
      (globalThis["setTimeout"] = (v39) => {
        return (v37["push"](v39), v37["length"]);
      }));
    const v40 = createImg(),
      v41 = createWrap(v40);
    (revealRefThumbMedia(v41, "sig-1"),
      await flushMicrotasks(),
      (v41["dataset"]["sig"] = "sig-2"),
      v37["shift"]()(),
      await flushMicrotasks(),
      strict["equal"](v40["classList"]["contains"]("is-pending"), true),
      strict["equal"](v40["classList"]["contains"]("is-ready"), false),
      strict["equal"](v40["dataset"]["thumbError"], undefined));
  }),
  test("revealRefThumbMedia\x20ignores\x20stale\x20retries\x20after\x20the\x20image\x20disconnects", async () => {
    installFakeImage([false, true]);
    const v42 = [];
    ((globalThis["requestAnimationFrame"] = (v43) => {
      return (v43(), 1);
    }),
      (globalThis["setTimeout"] = (v44) => {
        return (v42["push"](v44), v42["length"]);
      }));
    const v45 = createImg(),
      v46 = createWrap(v45);
    (revealRefThumbMedia(v46, "sig-1"),
      await flushMicrotasks(),
      (v45["isConnected"] = false),
      v42["shift"]()(),
      await flushMicrotasks(),
      strict["equal"](v45["classList"]["contains"]("is-pending"), true),
      strict["equal"](v45["classList"]["contains"]("is-ready"), false),
      strict["equal"](v45["dataset"]["thumbError"], undefined));
  }));
