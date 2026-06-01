import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDefaultConfigFromWorkflow,
  createFieldId,
  fieldKind,
  getExposedFields,
  getComfyFooterSettingFields,
  guessFieldType,
  listWorkflowInputs,
  resolveComfyWorkflowKind,
  findComfyDimensionFieldsFromWorkflow,
} from "./comfyWorkflowParser.js";
import {
  buildComfyParams,
  applyComfyQualityRatioToParams,
  applyComfyDimensionsToWorkflowParams,
  resolveComfyGenerateDimensions,
  stripComfyAutoDimensionParams,
} from "./comfyParamMapper.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sampleWorkflow = JSON.parse(
  readFileSync(
    join(__dirname, "../../../workflows/image_z_image_turbo-api.json"),
    "utf8",
  ),
);

test("listWorkflowInputs skips connection refs", () => {
  const nodes = listWorkflowInputs(sampleWorkflow);
  assert.ok(nodes.length > 0);
  const clipNode = nodes.find((node) => node.id === "57:27");
  assert.ok(clipNode);
  assert.equal(clipNode.inputs.some((input) => input.input === "text"), true);
  assert.equal(
    clipNode.inputs.some((input) => Array.isArray(input.value)),
    false,
  );
});

test("guessFieldType detects prompt textarea", () => {
  assert.equal(guessFieldType("hello world", "text"), "textarea");
  assert.equal(guessFieldType(8, "steps"), "number");
});

test("buildDefaultConfigFromWorkflow creates field ids", () => {
  const config = buildDefaultConfigFromWorkflow(sampleWorkflow, "Z-Image Turbo");
  assert.equal(config.title, "Z-Image Turbo");
  assert.ok(config.fields.length > 0);
  assert.equal(
    createFieldId("57:27", "text"),
    config.fields.find((field) => field.node === "57:27" && field.input === "text")?.id,
  );
});

test("buildComfyParams maps prompt and settings", () => {
  const config = {
    title: "Test",
    fields: [
      {
        id: "prompt_field",
        node: "57:27",
        input: "text",
        type: "textarea",
        exposed: true,
      },
      {
        id: "steps_field",
        node: "57:3",
        input: "steps",
        type: "number",
        exposed: true,
        default: 8,
      },
    ],
  };
  const mapped = buildComfyParams({
    config,
    comfyParams: { steps_field: 10 },
    promptText: "a cat",
  });
  assert.equal(mapped.params["57:27"].text, "a cat");
  assert.equal(mapped.params["57:3"].steps, 10);
  assert.equal(fieldKind(config.fields[0]), "prompt");
});

test("getExposedFields only returns explicitly exposed fields", () => {
  const config = buildDefaultConfigFromWorkflow(sampleWorkflow);
  assert.equal(getExposedFields(config).length, 0);
  config.fields[0].exposed = true;
  assert.equal(getExposedFields(config).length, 1);
});

test("resolveComfyWorkflowKind detects generate vs edit workflows", () => {
  const config = buildDefaultConfigFromWorkflow(sampleWorkflow);
  const widthField = config.fields.find((field) => field.input === "width");
  const heightField = config.fields.find((field) => field.input === "height");
  widthField.exposed = true;
  heightField.exposed = true;
  assert.equal(resolveComfyWorkflowKind(config), "generate");
  assert.equal(getComfyFooterSettingFields(config).length, 0);

  const editConfig = buildDefaultConfigFromWorkflow(sampleWorkflow);
  const imageField = editConfig.fields.find((field) => field.type === "image");
  if (imageField) {
    imageField.exposed = true;
    assert.equal(resolveComfyWorkflowKind(editConfig), "edit");
  }
});

test("applyComfyQualityRatioToParams maps imageSize and aspectRatio to width/height", () => {
  const config = buildDefaultConfigFromWorkflow(sampleWorkflow);
  const widthField = config.fields.find((field) => field.input === "width");
  const heightField = config.fields.find((field) => field.input === "height");
  const mapped = applyComfyQualityRatioToParams({
    config,
    workflow: sampleWorkflow,
    nodeData: {
      generationParams: { imageSize: "2K", aspectRatio: "16:9" },
    },
    comfyParams: {},
    persistInComfyParams: true,
  });
  assert.equal(mapped[widthField.id], 2728);
  assert.equal(mapped[heightField.id], 1536);
});

test("buildComfyParams injects 1K 9:16 dimensions into latent node", () => {
  const config = buildDefaultConfigFromWorkflow(sampleWorkflow);
  const widthField = config.fields.find((field) => field.input === "width");
  const heightField = config.fields.find((field) => field.input === "height");
  widthField.exposed = true;
  heightField.exposed = true;
  widthField.default = 1024;
  heightField.default = 1024;
  const mapped = buildComfyParams({
    config,
    workflow: sampleWorkflow,
    nodeData: {
      aspectRatio: "1:1",
      generationParams: { imageSize: "1K", aspectRatio: "9:16" },
    },
    comfyParams: {},
    promptText: "test",
  });
  assert.equal(mapped.params["57:13"].width, 768);
  assert.equal(mapped.params["57:13"].height, 1368);
});

test("readGenerationParam prefers generationParams over stale top-level aspectRatio", () => {
  const dims = resolveComfyGenerateDimensions({
    aspectRatio: "1:1",
    generationParams: { imageSize: "1K", aspectRatio: "9:16" },
  });
  assert.equal(dims.width, 768);
  assert.equal(dims.height, 1368);
});

test("stripComfyAutoDimensionParams removes auto width/height keys", () => {
  const config = buildDefaultConfigFromWorkflow(sampleWorkflow);
  const widthField = config.fields.find((field) => field.input === "width");
  const heightField = config.fields.find((field) => field.input === "height");
  const stripped = stripComfyAutoDimensionParams(
    {
      [widthField.id]: 768,
      [heightField.id]: 1368,
      steps_field: 8,
    },
    config,
    sampleWorkflow,
  );
  assert.equal(stripped[widthField.id], undefined);
  assert.equal(stripped[heightField.id], undefined);
  assert.equal(stripped.steps_field, 8);
});

import {
  buildComfyUiRefreshSignature,
  stripComfyPromptPollution,
} from "./comfyPromptGuard.js";

test("stripComfyPromptPollution removes repeated height garbage", () => {
  const cleaned = stripComfyPromptPollution(
    "震撼的地方eightheightheight输输输输",
  );
  assert.equal(cleaned, "震撼的地方");
});

test("buildComfyUiRefreshSignature tracks comfy workflow state", () => {
  const sig = buildComfyUiRefreshSignature({
    imageEngine: "comfyui",
    provider: "comfyui",
    model: "comfyui/custom/image_z_image_turbo-api.json",
    comfyWorkflow: "custom/image_z_image_turbo-api.json",
    generationParams: { imageSize: "1K", aspectRatio: "4:3" },
    comfyParams: { steps_field: 8 },
  });
  assert.match(sig, /image_z_image_turbo-api\.json/);
  assert.match(sig, /4:3/);
});

test("applyComfyDimensionsToWorkflowParams works without exposed width/height", () => {
  const config = { title: "Test", fields: [] };
  const params = applyComfyDimensionsToWorkflowParams({
    config,
    workflow: sampleWorkflow,
    nodeData: {
      generationParams: { imageSize: "1K", aspectRatio: "9:16" },
    },
    params: {},
  });
  const targets = findComfyDimensionFieldsFromWorkflow(sampleWorkflow);
  assert.equal(
    params[targets.widthField.node][targets.widthField.input],
    resolveComfyGenerateDimensions({
      generationParams: { imageSize: "1K", aspectRatio: "9:16" },
    }).width,
  );
  assert.equal(
    params[targets.heightField.node][targets.heightField.input],
    resolveComfyGenerateDimensions({
      generationParams: { imageSize: "1K", aspectRatio: "9:16" },
    }).height,
  );
});
