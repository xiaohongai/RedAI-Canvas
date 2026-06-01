import { test } from "node:test";
import strict from "node:assert/strict";
import { createStore } from "../../core/stores/appStore.js";
import {
  applyWorkflowToCanvas,
  calcWorkflowCenterOffset,
  collectWorkflowGroupNodeIds,
  createWorkflowFromCanvas,
  remapWorkflowNodeIds,
  sliceCanvasStateForWorkflow,
  updateWorkflowFromCanvas,
} from "./workflowCanvas.js";
import {
  WORKFLOW_SNAPSHOT_COVER_ID,
  createWorkflowSnapshotCoverCandidate,
  extractWorkflowCoverCandidates,
  isSvgDataImageCover,
} from "./workflowCovers.js";
import {
  buildWorkflowContentPreviewItems,
  buildWorkflowSourceSummary,
} from "./workflowPreview.js";
import { filterWorkflows } from "./workflowSelectors.js";
const CSS_HASH = String["fromCharCode"](35),
  CSS_RGBA_FUNCTION = "rgba";
function cssHexColor(v0) {
  return "" + CSS_HASH + v0;
}
function cssRgbaColor(v1, v2, v3, v4) {
  return (
    CSS_RGBA_FUNCTION +
    "(" +
    v1 +
    ",\x20" +
    v2 +
    ",\x20" +
    v3 +
    ",\x20" +
    v4 +
    ")"
  );
}
function escapeRegexText(v5) {
  return String(v5)["replace"](/[.*+?^${}()|[\]\\]/g, "\x5c$&");
}
function assertSvgContains(v6, v7) {
  strict["match"](v6, new RegExp(escapeRegexText(v7)));
}
function sampleCanvas() {
  return {
    nodes: [
      { id: "a", type: "text", x: 0, y: 0, width: 100, height: 60 },
      {
        id: "b",
        type: "ai-image",
        parentId: "a",
        x: 160,
        y: 40,
        width: 120,
        height: 80,
      },
    ],
    edges: [{ id: "e1", sourceId: "a", targetId: "b" }],
    viewport: { x: 10, y: 20, zoom: 1.2 },
  };
}
(test("workflow: createWorkflowFromCanvas trims and limits metadata", () => {
  const v8 = createWorkflowFromCanvas(sampleCanvas(), {
    name: "\x20\x20" + "n"["repeat"](60) + "\x20\x20",
    note: "x"["repeat"](400),
    tags: ["tag", "\x20tag\x20", "LONG_TAG_VALUE", "B", "C", "D", "E"],
    cover: "/cover.png",
  });
  (strict["equal"](v8["name"]["length"], 50),
    strict["equal"](v8["note"]["length"], 300),
    strict["deepEqual"](v8["tags"], ["tag", "LONG_TAG_VAL", "B", "C", "D"]),
    strict["equal"](v8["cover"], "/cover.png"),
    strict["equal"](v8["workflowData"]["nodes"]["length"], 2),
    strict["equal"](v8["workflowData"]["edges"]["length"], 1),
    strict["equal"]("scope" in v8, false));
}),
  test("workflow:\x20createWorkflowFromCanvas\x20syncs\x20single\x20root\x20group\x20name\x20to\x20workflow\x20name", () => {
    const v9 = createWorkflowFromCanvas(
      {
        nodes: [
          { id: "g", type: "group", name: "旧组名", x: 0, y: 0 },
          { id: "image-1", type: "ai-image", parentId: "g", x: 20, y: 20 },
        ],
        edges: [],
      },
      { name: "123" },
    );
    (strict["equal"](v9["name"], "123"),
      strict["equal"](
        v9["workflowData"]["nodes"]["find"]((v10) => v10["id"] === "g")["name"],
        "123",
      ));
  }),
  test("workflow: updateWorkflowFromCanvas preserves identity and refreshes content", () => {
    const v11 = createWorkflowFromCanvas(sampleCanvas(), {
        id: "workflow-1",
        name: "Old",
        tags: ["old"],
      }),
      v12 = updateWorkflowFromCanvas(
        v11["id"],
        { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
        { existingWorkflow: v11, name: "New", tags: ["new"] },
      );
    (strict["equal"](v12["id"], "workflow-1"),
      strict["equal"](v12["createdAt"], v11["createdAt"]),
      strict["equal"](v12["name"], "New"),
      strict["deepEqual"](v12["tags"], ["new"]),
      strict["equal"](v12["nodeCount"], 0),
      strict["equal"]("scope" in v12, false));
  }),
  test("workflow: updateWorkflowFromCanvas syncs single root group name to workflow name", () => {
    const v13 = updateWorkflowFromCanvas(
      "workflow-1",
      {
        nodes: [
          { id: "g", type: "group", name: "旧组名", x: 0, y: 0 },
          { id: "text-1", type: "source-text", parentId: "g", x: 10, y: 10 },
        ],
        edges: [],
      },
      { name: "新工作流名" },
    );
    strict["equal"](
      v13["workflowData"]["nodes"]["find"]((v14) => v14["id"] === "g")["name"],
      "新工作流名",
    );
  }),
  test("workflow: filterWorkflows searches name tags and note", () => {
    const v15 = [
      { id: "1", name: "Alpha", tags: ["draw"], note: "", updatedAt: 100 },
      {
        id: "2",
        name: "Mine",
        tags: ["Scene"],
        note: "step by step",
        updatedAt: 300,
      },
      { id: "3", name: "Other", tags: [], note: "nothing", updatedAt: 200 },
    ];
    (strict["deepEqual"](
      filterWorkflows(v15, "scene")["map"]((v16) => v16["id"]),
      ["2"],
    ),
      strict["deepEqual"](
        filterWorkflows(v15, "draw")["map"]((v17) => v17["id"]),
        ["1"],
      ),
      strict["deepEqual"](
        filterWorkflows(v15, "")["map"]((v18) => v18["id"]),
        ["2", "3", "1"],
      ));
  }),
  test("workflow: extractWorkflowCoverCandidates uses stable node thumbnails", () => {
    const v19 = extractWorkflowCoverCandidates({
      n1: { id: "n1", name: "A", localPath: "data/uploads/a.png" },
      n2: { id: "n2", name: "B", images: [{ imageUrl: "/b.png" }] },
      n3: { id: "n3", name: "C", thumbUrl: "/b.png" },
    });
    (strict["equal"](v19["length"], 2),
      strict["equal"](v19[0]["src"], "/data/uploads/a.png"),
      strict["equal"](v19[1]["src"], "/b.png"));
  }),
  test("workflow:\x20extractWorkflowCoverCandidates\x20prefers\x20generated\x20output\x20covers", () => {
    const v20 = extractWorkflowCoverCandidates([
      {
        id: "input",
        type: "source-image",
        name: "参考图",
        imageUrl: "/input.png",
      },
      {
        id: "output",
        type: "ai-image",
        name: "生成图",
        imageUrl: "/output.png",
      },
      {
        id: "video",
        type: "ai-video",
        name: "生成视频",
        coverUrl: "/video.png",
      },
    ]);
    strict["deepEqual"](
      v20["map"]((v21) => v21["src"]),
      ["/output.png", "/video.png", "/input.png"],
    );
  }),
  test("workflow: createWorkflowSnapshotCoverCandidate renders workflow style cover", () => {
    const v22 = createWorkflowSnapshotCoverCandidate(sampleCanvas(), {
      title: "组合",
    });
    (strict["equal"](v22["id"], WORKFLOW_SNAPSHOT_COVER_ID),
      strict["equal"](v22["label"], "工作流快照"),
      strict["match"](v22["src"], /^data:image\/svg\+xml;charset=utf-8,/),
      strict["equal"](isSvgDataImageCover(v22["src"]), true));
    const v23 = decodeURIComponent(v22["src"]["split"](",")[1]);
    (strict["match"](v23, /aria-label="workflow snapshot"/),
      strict["match"](v23, /stroke="url\(#frameGlow\)"/),
      strict["match"](v23, />2 节点 · 1 连线</));
  }),
  test("workflow: createWorkflowSnapshotCoverCandidate uses root group color theme", () => {
    const v24 = createWorkflowSnapshotCoverCandidate({
        nodes: [
          {
            id: "g",
            type: "group",
            color: "var(--red)",
            x: 0,
            y: 0,
            width: 360,
            height: 220,
          },
          {
            id: "text-1",
            type: "source-text",
            parentId: "g",
            x: 32,
            y: 48,
            width: 120,
            height: 72,
          },
        ],
        edges: [],
      }),
      v25 = decodeURIComponent(v24["src"]["split"](",")[1]),
      v26 = cssHexColor("ef4444"),
      v27 = cssRgbaColor(239, 68, 68, 0.6);
    (assertSvgContains(
      v25,
      "<stop\x20offset=\x220\x22\x20stop-color=\x22" + v26 + "\x22/>",
    ),
      assertSvgContains(v25, '<stop offset="1" stop-color="' + v27 + "\x22/>"),
      assertSvgContains(
        v25,
        '<circle cx="320" cy="50" r="9" fill="' + v26 + "\x22",
      ),
      assertSvgContains(
        v25,
        "stroke=\x22" +
          v26 +
          "\x22\x20stroke-width=\x221\x22\x20opacity=\x220.9\x22",
      ));
  }),
  test("workflow:\x20remapWorkflowNodeIds\x20remaps\x20nodes\x20edges\x20and\x20parentId", () => {
    const {
      nodes: v28,
      edges: v29,
      idMap: v30,
    } = remapWorkflowNodeIds(
      [
        { id: "g", type: "group", x: 0, y: 0 },
        { id: "c", type: "text", parentId: "g", x: 10, y: 10 },
      ],
      [
        { id: "e1", sourceId: "g", targetId: "c" },
        { id: "bad", sourceId: "missing", targetId: "c" },
      ],
    );
    (strict["equal"](v28["length"], 2),
      strict["notEqual"](v28[0]["id"], "g"),
      strict["equal"](v28[1]["parentId"], v30["g"]),
      strict["equal"](v29["length"], 1),
      strict["equal"](v29[0]["sourceId"], v30["g"]),
      strict["equal"](v29[0]["targetId"], v30["c"]));
  }),
  test("workflow: collectWorkflowGroupNodeIds collects group and descendants only", () => {
    const v31 = collectWorkflowGroupNodeIds(
      {
        g: { id: "g", type: "group" },
        a: { id: "a", parentId: "g" },
        b: { id: "b", parentId: "a" },
        x: { id: "x" },
      },
      "g",
    );
    strict["deepEqual"]([...v31]["sort"](), ["a", "b", "g"]);
  }),
  test("workflow:\x20sliceCanvasStateForWorkflow\x20keeps\x20only\x20selected\x20group\x20nodes\x20and\x20internal\x20edges", () => {
    const v32 = sliceCanvasStateForWorkflow(
      {
        nodes: [
          { id: "g", type: "group", x: 0, y: 0 },
          { id: "a", type: "text", parentId: "g", x: 10, y: 10 },
          { id: "b", type: "ai-image", parentId: "a", x: 30, y: 10 },
          { id: "x", type: "text", x: 200, y: 200 },
        ],
        edges: [
          { id: "e1", sourceId: "a", targetId: "b" },
          { id: "e2", sourceId: "a", targetId: "x" },
        ],
        viewport: { x: 0, y: 0, zoom: 1 },
      },
      {
        g: { id: "g", type: "group" },
        a: { id: "a", parentId: "g" },
        b: { id: "b", parentId: "a" },
        x: { id: "x" },
      },
      "g",
    );
    (strict["deepEqual"](
      v32["nodes"]["map"]((v33) => v33["id"]),
      ["g", "a", "b"],
    ),
      strict["deepEqual"](
        v32["edges"]["map"]((v34) => v34["id"]),
        ["e1"],
      ));
  }),
  test("workflow:\x20calcWorkflowCenterOffset\x20aligns\x20bbox\x20center", () => {
    const v35 = calcWorkflowCenterOffset(
      [{ id: "a", x: 0, y: 0, width: 100, height: 100 }],
      { x: 300, y: 400 },
    );
    strict["deepEqual"](v35, { dx: 250, dy: 350 });
  }),
  test("workflow: applyWorkflowToCanvas keeps relative layout", () => {
    const v36 = createWorkflowFromCanvas(sampleCanvas(), { name: "Apply" }),
      v37 = applyWorkflowToCanvas(v36, { x: 500, y: 500 });
    (strict["equal"](v37["nodes"]["length"], 2),
      strict["equal"](v37["edges"]["length"], 1));
    const v38 = v37["nodes"][1]["x"] - v37["nodes"][0]["x"],
      v39 = v37["nodes"][1]["y"] - v37["nodes"][0]["y"];
    (strict["equal"](v38, 160), strict["equal"](v39, 40));
  }),
  test("workflow: applyWorkflowToCanvas names single root group after workflow name", () => {
    const v40 = {
        name: "导入后的组名",
        workflowData: {
          nodes: [
            { id: "g", type: "group", name: "历史旧名", x: 0, y: 0 },
            { id: "image-1", type: "ai-image", parentId: "g", x: 20, y: 20 },
          ],
          edges: [],
        },
      },
      v41 = applyWorkflowToCanvas(v40, { x: 100, y: 100 }),
      v42 = v41["nodes"]["find"]((v43) => v43["type"] === "group");
    strict["equal"](v42["name"], "导入后的组名");
  }),
  test("workflow: applyWorkflowToCanvas does not rename multiple root groups", () => {
    const v44 = {
        name: "不要覆盖多个组",
        workflowData: {
          nodes: [
            { id: "g1", type: "group", name: "组1", x: 0, y: 0 },
            { id: "g2", type: "group", name: "组2", x: 200, y: 0 },
          ],
          edges: [],
        },
      },
      v45 = applyWorkflowToCanvas(v44, { x: 100, y: 100 });
    strict["deepEqual"](
      v45["nodes"]
        ["filter"]((v46) => v46["type"] === "group")
        ["map"]((v47) => v47["name"])
        ["sort"](),
      ["组1", "组2"],
    );
  }),
  test("workflow:\x20buildWorkflowContentPreviewItems\x20shows\x20node\x20content\x20and\x20skips\x20wrapper\x20group", () => {
    const v48 = buildWorkflowContentPreviewItems({
      workflowData: {
        nodes: [
          { id: "group-1", type: "group", name: "流程组", x: 0, y: 0 },
          {
            id: "text-1",
            type: "source-text",
            name: "脚本",
            content: "  第一段文案  ",
            x: 120,
            y: 10,
          },
          {
            id: "image-1",
            type: "ai-image",
            prompt: "<p>海边人物特写</p>",
            thumbUrl: "/covers/a.png",
            x: 10,
            y: 20,
          },
        ],
      },
    });
    (strict["equal"](v48["length"], 2),
      strict["equal"](v48[0]["id"], "text-1"),
      strict["equal"](v48[0]["typeLabel"], "文本"),
      strict["equal"](v48[0]["title"], "脚本"),
      strict["equal"](v48[0]["summary"], "第一段文案"),
      strict["equal"](v48[1]["id"], "image-1"),
      strict["equal"](v48[1]["typeLabel"], "AI 图片"),
      strict["equal"](v48[1]["summary"], "海边人物特写"),
      strict["equal"](v48[1]["thumbSrc"], "/covers/a.png"));
  }),
  test("workflow: buildWorkflowSourceSummary describes source and suggests metadata", () => {
    const v49 = buildWorkflowSourceSummary(
      {
        nodes: [
          { id: "group-1", type: "group", name: "商品图批处理" },
          {
            id: "text-1",
            type: "source-text",
            name: "提示词",
            text: "产品棚拍",
          },
          {
            id: "image-1",
            type: "ai-image",
            name: "主图输出",
            thumbUrl: "/covers/a.png",
          },
        ],
        edges: [{ id: "e1", sourceId: "text-1", targetId: "image-1" }],
      },
      { sourceGroupId: "group-1", sourceName: "商品图批处理" },
    );
    (strict["equal"](v49["sourceLabel"], "当前节点组"),
      strict["equal"](v49["nodeCount"], 3),
      strict["equal"](v49["contentNodeCount"], 2),
      strict["equal"](v49["edgeCount"], 1),
      strict["equal"](v49["suggestedName"], "商品图批处理工作流"),
      strict["deepEqual"](v49["suggestedTags"], ["文本", "图片"]),
      strict["equal"](v49["typeSummary"], "文本\x201\x20·\x20AI\x20图片\x201"));
  }),
  test("store:\x20workflow\x20slice\x20manages\x20list\x20and\x20modal\x20state", () => {
    const v50 = createStore();
    (v50["setWorkflows"]([{ id: "w1", name: "one" }]),
      v50["upsertWorkflow"]({ id: "w2", name: "two" }),
      v50["updateWorkflowLocal"]("w1", { name: "one updated" }),
      v50["markWorkflowUsed"]("w2", 123),
      v50["openWorkflowModal"]({ tab: "update", sourceGroupId: "group-1" }),
      v50["setWorkflowDraft"]({ name: "draft", tags: ["a"] }),
      v50["closeWorkflowModal"]());
    const v51 = v50["getState"]();
    (strict["equal"](v51["workflows"]["items"]["length"], 2),
      strict["equal"](
        v51["workflows"]["items"]["find"]((v52) => v52["id"] === "w1")["name"],
        "one\x20updated",
      ),
      strict["equal"](
        v51["workflows"]["items"]["find"]((v53) => v53["id"] === "w2")[
          "lastUsedAt"
        ],
        123,
      ),
      strict["equal"](v51["workflowUi"]["modalOpen"], false),
      strict["equal"](v51["workflowUi"]["draft"]["name"], ""),
      strict["equal"](v51["workflowUi"]["sourceGroupId"], null),
      strict["equal"]("activeScope" in v51["workflowUi"], false));
  }));
