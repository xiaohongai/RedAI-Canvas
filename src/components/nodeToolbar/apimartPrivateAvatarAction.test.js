import test from "node:test";
import strict from "node:assert/strict";
import { bindApimartPrivateAvatarAction } from "./apimartPrivateAvatarAction.js";
import { APIMART_PRIVATE_AVATAR_ASSET_KEY } from "../../modules/apimartPrivateAvatarAssets.js";
function createClassList() {
  const v0 = new Set();
  return {
    add(v1) {
      v0["add"](v1);
    },
    remove(v2) {
      v0["delete"](v2);
    },
    toggle(v3, v4) {
      if (v4) v0["add"](v3);
      else v0["delete"](v3);
    },
    contains(v5) {
      return v0["has"](v5);
    },
  };
}
function createButtonStub() {
  let v6 = null;
  const v7 = createClassList(),
    v8 = {
      dataset: {},
      disabled: false,
      attrs: {},
      classList: createClassList(),
      addEventListener(v9, v10) {
        if (v9 === "click") v6 = v10;
      },
      querySelector(v11) {
        if (v11 === "svg") return { classList: v7 };
        return null;
      },
      setAttribute(v12, v13) {
        this["attrs"][v12] = v13;
      },
      click() {
        return v6?.({ preventDefault() {}, stopPropagation() {} });
      },
    };
  return { button: v8, svgClassList: v7 };
}
function createToolbar(v14) {
  return {
    querySelector(v15) {
      return v15 === ".act-apimart-face-detect" ? v14 : null;
    },
  };
}
function withWindow(v16) {
  const v17 = global["window"];
  return (
    (global["window"] = { showToast() {} }),
    Promise["resolve"]()
      ["then"](v16)
      ["finally"](() => {
        global["window"] = v17;
      })
  );
}
(test("apimart\x20private\x20avatar\x20action:\x20processing\x20state\x20spins\x20toolbar\x20icon", () => {
  const { button: v18, svgClassList: v19 } = createButtonStub();
  (bindApimartPrivateAvatarAction({
    nodeId: "node-1",
    toolbarEl: createToolbar(v18),
    getStateSnapshot() {
      return {
        nodes: {
          "node-1": {
            providerAssetRefs: {
              [APIMART_PRIVATE_AVATAR_ASSET_KEY]: { status: "processing" },
            },
          },
        },
      };
    },
    store: {
      subscribeSelector() {
        return () => {};
      },
    },
  }),
    strict["equal"](v18["dataset"]["loading"], "true"),
    strict["equal"](v18["disabled"], true),
    strict["equal"](v18["attrs"]["aria-busy"], "true"),
    strict["equal"](v19["contains"]("v2-spinning"), true));
}),
  test("apimart private avatar action: click shows spinner until failure result", async () => {
    await withWindow(async () => {
      const { button: v20, svgClassList: v21 } = createButtonStub(),
        v22 = { id: "node-1", imageUrl: "/output/face.png" },
        v23 = [];
      let v24;
      const v25 = new Promise((v26) => {
          v24 = v26;
        }),
        v27 = bindApimartPrivateAvatarAction({
          nodeId: "node-1",
          mediaKind: "image",
          toolbarEl: createToolbar(v20),
          getStateSnapshot() {
            return { nodes: { "node-1": v22 } };
          },
          store: {
            updateNodeData(v28, v29) {
              (v23["push"]({ id: v28, patch: v29 }),
                Object["assign"](v22, v29));
            },
            subscribeSelector() {
              return () => {};
            },
          },
          ensureConfig() {
            return v25;
          },
          getProviderConfig() {
            return {};
          },
        });
      strict["equal"](v27, undefined);
      const v30 = v20["click"]();
      (strict["equal"](
        v23["at"](-1)["patch"]["providerAssetRefs"][
          APIMART_PRIVATE_AVATAR_ASSET_KEY
        ]["status"],
        "processing",
      ),
        strict["equal"](v20["dataset"]["loading"], "true"),
        strict["equal"](v21["contains"]("v2-spinning"), true),
        v24(),
        await v30,
        strict["equal"](
          v23["at"](-1)["patch"]["providerAssetRefs"][
            APIMART_PRIVATE_AVATAR_ASSET_KEY
          ]["status"],
          "failed",
        ),
        strict["equal"](v20["dataset"]["loading"], "false"),
        strict["equal"](v21["contains"]("v2-spinning"), false));
    });
  }));
