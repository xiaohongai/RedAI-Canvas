import { test } from "node:test";
import strict from "node:assert/strict";
import {
  buildVirtualizationCandidateSets,
  collectVirtualKeepAliveNodeIds,
  isNodeInsideViewportPadding,
  resolveRendererVirtualizationPadding,
} from "./rendererVirtualization.js";
(test("rendererVirtualization: viewport padding 命中进入阈值", () => {
  const v0 = isNodeInsideViewportPadding(
      { id: "n1", x: 900, y: 0, width: 200, height: 120 },
      { x: 0, y: 0, zoom: 1 },
      1000,
      800,
      120,
    ),
    v1 = isNodeInsideViewportPadding(
      { id: "n2", x: 1300, y: 0, width: 200, height: 120 },
      { x: 0, y: 0, zoom: 1 },
      1000,
      800,
      80,
    );
  (strict["equal"](v0, true), strict["equal"](v1, false));
}),
  test("rendererVirtualization: keepAlive 会覆盖选中 拖拽 descendants 与 pin", () => {
    const v2 = collectVirtualKeepAliveNodeIds({
      selectedNodeIds: ["a"],
      dragContext: { isDragging: true, targetNodeId: "dragRoot" },
      connOverlay: { srcId: "src", hoverId: "hover" },
      pickConnectMode: {
        sourceNodeId: "pick-source",
        hoverNodeId: "pick-hover",
      },
      parentToChildren: {
        a: new Set(["a-child"]),
        dragRoot: new Set(["drag-child"]),
      },
      pinnedNodeIds: new Set(["pinned"]),
    });
    strict["deepEqual"](
      new Set(v2),
      new Set([
        "a",
        "a-child",
        "dragRoot",
        "drag-child",
        "src",
        "hover",
        "pick-source",
        "pick-hover",
        "pinned",
      ]),
    );
  }),
  test("rendererVirtualization: 双阈值滞回会分离 mount 与 park 候选", () => {
    const v3 = buildVirtualizationCandidateSets({
      nodes: {
        near: { id: "near", x: 1200, y: 0, width: 200, height: 120 },
        far: { id: "far", x: 2000, y: 0, width: 200, height: 120 },
        pinned: { id: "pinned", x: 4000, y: 0, width: 200, height: 120 },
      },
      viewport: { x: 0, y: 0, zoom: 1 },
      containerWidth: 1000,
      containerHeight: 800,
      pinnedNodeIds: new Set(["pinned"]),
      mountPadding: 600,
      parkPadding: 900,
    });
    (strict["equal"](v3["mountCandidateIds"]["has"]("near"), true),
      strict["equal"](v3["parkCandidateIds"]["has"]("near"), false),
      strict["equal"](v3["mountCandidateIds"]["has"]("far"), false),
      strict["equal"](v3["parkCandidateIds"]["has"]("far"), true),
      strict["equal"](v3["mountCandidateIds"]["has"]("pinned"), true),
      strict["equal"](v3["parkCandidateIds"]["has"]("pinned"), false));
  }),
  test("rendererVirtualization: 深层 descendants 仍会被全部纳入 keepAlive", () => {
    const v4 = collectVirtualKeepAliveNodeIds({
      selectedNodeIds: ["root"],
      parentToChildren: {
        root: new Set(["child-1"]),
        "child-1": ["child-2"],
        "child-2": (function* () {
          yield "child-3";
        })(),
      },
    });
    strict["deepEqual"](
      new Set(v4),
      new Set(["root", "child-1", "child-2", "child-3"]),
    );
  }),
  test("rendererVirtualization: 重复 child 不会重复入队", () => {
    const v5 = collectVirtualKeepAliveNodeIds({
      selectedNodeIds: ["root"],
      parentToChildren: {
        root: ["dup", "dup", "dup-child"],
        dup: ["dup-child"],
        "dup-child": [],
      },
    });
    strict["deepEqual"](new Set(v5), new Set(["root", "dup", "dup-child"]));
  }),
  test("rendererVirtualization: dense low zoom uses tighter parking buffers", () => {
    (strict["deepEqual"](
      resolveRendererVirtualizationPadding({
        viewport: { x: 0, y: 0, zoom: 0.28 },
        nodeCount: 156,
      }),
      { mountPadding: 320, parkPadding: 520 },
    ),
      strict["deepEqual"](
        resolveRendererVirtualizationPadding({
          viewport: { x: 0, y: 0, zoom: 0.4 },
          nodeCount: 100,
        }),
        { mountPadding: 420, parkPadding: 650 },
      ),
      strict["deepEqual"](
        resolveRendererVirtualizationPadding({
          viewport: { x: 0, y: 0, zoom: 0.4 },
          nodeCount: 20,
        }),
        { mountPadding: 600, parkPadding: 900 },
      ));
  }));
