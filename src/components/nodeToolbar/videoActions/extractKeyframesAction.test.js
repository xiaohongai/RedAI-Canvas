import test from "node:test";
import strict from "node:assert/strict";
import { bindVideoExtractKeyframesAction } from "./extractKeyframesAction.js";
function createButtonStub() {
  let v0 = null;
  const v1 = {
      active: false,
      toggle(v2, v3) {
        this["active"] = !!v3;
      },
    },
    v4 = {
      dataset: {},
      disabled: false,
      attrs: {},
      addEventListener(v5, v6) {
        if (v5 === "click") v0 = v6;
      },
      querySelector(v7) {
        if (v7 === "svg") return { classList: v1 };
        return null;
      },
      setAttribute(v8, v9) {
        this["attrs"][v8] = v9;
        if (v8 === "data-tooltip") this["dataset"]["tooltip"] = v9;
      },
      click() {
        return v0?.({ stopPropagation() {} });
      },
    };
  return { button: v4, svgClassList: v1 };
}
function withWindow(v10) {
  const v11 = global["window"],
    v12 = [];
  return (
    (global["window"] = {
      showToast(v13, v14) {
        v12["push"]({ message: v13, type: v14 });
      },
    }),
    Promise["resolve"]()
      ["then"](() => v10(v12))
      ["finally"](() => {
        global["window"] = v11;
      })
  );
}
(test("video\x20extract\x20keyframes\x20action:\x20calls\x20smart\x20clip\x20keyframe\x20runner\x20with\x20default\x20options", async () => {
  await withWindow(async (v15) => {
    const { button: v16, svgClassList: v17 } = createButtonStub();
    let v18 = null;
    (bindVideoExtractKeyframesAction({
      toolbarEl: {
        querySelector(v19) {
          return v19 === ".act-extract-keyframes" ? v16 : null;
        },
      },
      nodeData: { id: "video-1" },
      getStateSnapshot() {
        return { videoClip: { active: false }, videoKeying: { active: false } };
      },
      VideoClipController: { exit() {} },
      VideoKeyingController: { exit() {} },
      async runSmartClipKeyframeExtractionFromVideoNode(v20) {
        return (
          (v18 = v20),
          v20["onProgress"]?.({ text: "分析中 (10%)" }),
          { ok: true, nodeIds: ["img-1", "img-2"] }
        );
      },
    }),
      await v16["click"](),
      strict["equal"](v18["nodeId"], "video-1"),
      strict["equal"](
        Object["prototype"]["hasOwnProperty"]["call"](v18, "options"),
        false,
      ),
      strict["equal"](v16["disabled"], false),
      strict["equal"](v16["dataset"]["loading"], "false"),
      strict["equal"](v17["active"], false),
      strict["deepEqual"](v15["at"](-1), {
        message: "✅ 智能剪辑完成，已生成 2 张关键帧",
        type: "success",
      }));
  });
}),
  test("video extract keyframes action: blocks while video edit mode is active", async () => {
    await withWindow(async (v21) => {
      const { button: v22 } = createButtonStub();
      let v23 = false;
      (bindVideoExtractKeyframesAction({
        toolbarEl: {
          querySelector(v24) {
            return v24 === ".act-extract-keyframes" ? v22 : null;
          },
        },
        nodeData: { id: "video-1" },
        getStateSnapshot() {
          return {
            videoClip: { active: true },
            videoKeying: { active: false },
          };
        },
        VideoClipController: { exit() {} },
        VideoKeyingController: { exit() {} },
        async runSmartClipKeyframeExtractionFromVideoNode() {
          return ((v23 = true), { ok: true, nodeIds: ["img-1"] });
        },
      }),
        await v22["click"](),
        strict["equal"](v23, false),
        strict["equal"](v22["disabled"], false),
        strict["deepEqual"](v21["at"](-1), {
          message: "请先退出裁剪视频模式",
          type: "info",
        }));
    });
  }));
