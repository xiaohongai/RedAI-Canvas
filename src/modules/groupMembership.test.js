import { test } from "node:test";
import strict from "node:assert/strict";
import { collectGroupContainmentReparentOps } from "./groupMembership.js";
(test("groupMembership: resized group releases nodes outside its bounds", () => {
  const v0 = collectGroupContainmentReparentOps(
    {
      group: {
        id: "group",
        type: "group",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      },
      child: {
        id: "child",
        type: "ai-image",
        parentId: "group",
        x: 120,
        y: 20,
        width: 20,
        height: 20,
      },
    },
    ["group"],
  );
  strict["deepEqual"](v0, [{ nodeId: "child", parentId: null }]);
}),
  test("groupMembership: resized group adopts nodes contained in its bounds", () => {
    const v1 = collectGroupContainmentReparentOps(
      {
        group: {
          id: "group",
          type: "group",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
        child: {
          id: "child",
          type: "ai-image",
          parentId: null,
          x: 20,
          y: 20,
          width: 20,
          height: 20,
        },
      },
      ["group"],
    );
    strict["deepEqual"](v1, [{ nodeId: "child", parentId: "group" }]);
  }),
  test("groupMembership: moved node joins the first containing group", () => {
    const v2 = collectGroupContainmentReparentOps(
      {
        group: {
          id: "group",
          type: "group",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
        child: {
          id: "child",
          type: "ai-image",
          parentId: null,
          x: 20,
          y: 20,
          width: 20,
          height: 20,
        },
      },
      ["child"],
    );
    strict["deepEqual"](v2, [{ nodeId: "child", parentId: "group" }]);
  }),
  test("groupMembership: unchanged containment returns no ops", () => {
    const v3 = collectGroupContainmentReparentOps(
      {
        group: {
          id: "group",
          type: "group",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
        child: {
          id: "child",
          type: "ai-image",
          parentId: "group",
          x: 20,
          y: 20,
          width: 20,
          height: 20,
        },
      },
      ["group"],
    );
    strict["deepEqual"](v3, []);
  }));
