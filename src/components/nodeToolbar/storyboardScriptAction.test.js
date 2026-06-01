import test from "node:test";
import strict from "node:assert/strict";
import {
  createConnectedStoryboardScriptNode,
  VIDEO_STORYBOARD_SCRIPT_DEFAULT_PROMPT,
} from "./storyboardScriptAction.js";
import { STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG } from "./storyboardScriptToolbarIcon.js";
function createFakeStore(v0) {
  const v1 = [];
  let v2 = [];
  return {
    edges: v1,
    get selectedNodeIds() {
      return v2;
    },
    getStateRaw() {
      return { nodes: v0 };
    },
    addNode(v3) {
      v0[v3["id"]] = v3;
    },
    deleteNodes(v4) {
      for (const v5 of v4) delete v0[v5];
    },
    setSelectedNodes(v6) {
      v2 = v6;
    },
  };
}
(test("storyboardScriptAction: creates and connects a storyboard script node", () => {
  const v7 = {
      "source-text-1": {
        id: "source-text-1",
        type: "source-text",
        x: 10,
        y: 20,
        width: 260,
        height: 120,
        content: "story",
      },
    },
    v8 = createFakeStore(v7);
  let v9 = 0;
  const v10 = createConnectedStoryboardScriptNode({
    sourceNodeId: "source-text-1",
    storeInstance: v8,
    generateId: () => "storyboard-script-1",
    calcSafeSpawnPosNearNode: () => ({ x: 400, y: 20 }),
    isValidConnectionFn: () => true,
    addEdgeWithPolicies: ({ sourceId: v11, targetId: v12 }) => {
      return (v8["edges"]["push"]({ sourceId: v11, targetId: v12 }), true);
    },
    commit: () => {
      v9 += 1;
    },
  });
  (strict["deepEqual"](v10, { ok: true, nodeId: "storyboard-script-1" }),
    strict["equal"](v7["storyboard-script-1"]["type"], "storyboard-script"),
    strict["equal"](v7["storyboard-script-1"]["name"], "分镜脚本"),
    strict["deepEqual"](v8["edges"], [
      { sourceId: "source-text-1", targetId: "storyboard-script-1" },
    ]),
    strict["deepEqual"](v8["selectedNodeIds"], ["storyboard-script-1"]),
    strict["equal"](v9, 1));
}),
  test("storyboardScriptAction:\x20does\x20not\x20create\x20node\x20when\x20connection\x20is\x20invalid", () => {
    const v13 = {
        "source-video-1": {
          id: "source-video-1",
          type: "source-video",
          x: 0,
          y: 0,
          width: 300,
          height: 180,
        },
      },
      v14 = createFakeStore(v13),
      v15 = createConnectedStoryboardScriptNode({
        sourceNodeId: "source-video-1",
        storeInstance: v14,
        generateId: () => "storyboard-script-2",
        calcSafeSpawnPosNearNode: () => ({ x: 420, y: 0 }),
        isValidConnectionFn: () => false,
        addEdgeWithPolicies: () => {
          throw new Error("should not connect");
        },
        commit: () => {
          throw new Error("should\x20not\x20commit");
        },
      });
    (strict["deepEqual"](v15, { ok: false, reason: "invalid-connection" }),
      strict["equal"](v13["storyboard-script-2"], undefined));
  }),
  test("storyboardScriptAction: video source seeds default storyboard prompt", () => {
    const v16 = {
        "source-video-1": {
          id: "source-video-1",
          type: "source-video",
          x: 0,
          y: 0,
          width: 300,
          height: 180,
          localPath: "outputs/video.mp4",
        },
      },
      v17 = createFakeStore(v16),
      v18 = createConnectedStoryboardScriptNode({
        sourceNodeId: "source-video-1",
        storeInstance: v17,
        generateId: () => "storyboard-script-video",
        calcSafeSpawnPosNearNode: () => ({ x: 420, y: 0 }),
        isValidConnectionFn: () => true,
        addEdgeWithPolicies: ({ sourceId: v19, targetId: v20 }) => {
          return (v17["edges"]["push"]({ sourceId: v19, targetId: v20 }), true);
        },
        commit: () => {},
      });
    (strict["equal"](v18["ok"], true),
      strict["equal"](
        v16["storyboard-script-video"]["prompt"],
        VIDEO_STORYBOARD_SCRIPT_DEFAULT_PROMPT,
      ),
      strict["equal"](
        v16["storyboard-script-video"]["storyboardScript"]["prompt"],
        VIDEO_STORYBOARD_SCRIPT_DEFAULT_PROMPT,
      ),
      strict["equal"](
        v16["storyboard-script-video"]["storyboardScript"]["sourceMode"],
        "video",
      ));
  }),
  test("storyboardScriptAction:\x20toolbar\x20icon\x20uses\x20storyboard\x20table\x20glyph", () => {
    (strict["match"](STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG, /<rect x="3" y="4"/),
      strict["match"](STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG, /<path d="M3 9h18"/),
      strict["match"](STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG, /<path d="M8 4v16"/));
  }));
