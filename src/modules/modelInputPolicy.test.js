import test from "node:test";
import strict from "node:assert/strict";
import {
  PERSON_REPLACE_V21_MODEL_ID,
  PERSON_REPLACE_V3_MODEL_ID,
  registerManifestBundle,
} from "../manifests/index.js";
import {
  getTargetInputPolicy,
  hasUsableInputNodeSource,
  isInputKindAllowed,
  isRhPersonReplaceWorkflowModel,
} from "./modelInputPolicy.js";
function createTwoSlotWorkflowExecution(v0 = {}) {
  return {
    schemaVersion: "1.0",
    id: "plugin.test.two-slot-image.workflow.v1",
    provider: "runninghubwf",
    kind: "image",
    adapterType: "workflow",
    workflowId: "plugin-two-slot-image-workflow",
    submitMode: "openapi-v2-ai-app",
    queryMode: "openapi-v2-query",
    mapping: { imageNodes: ["1", "2"] },
    result: { imagePaths: ["results[].url"] },
    ...v0,
  };
}
function createTwoSlotWorkflowModel(v1 = {}) {
  return {
    schemaVersion: "1.0",
    modelId: "plugin/test-two-slot-image-workflow",
    provider: "runninghubwf",
    kind: "image",
    adapterType: "workflow",
    executionId: "plugin.test.two-slot-image.workflow.v1",
    displayName: "Test Two Slot Image Workflow",
    uiSchema: { fields: [] },
    inputSlots: {
      allowedKinds: ["text", "image"],
      minByKind: { image: 2 },
      maxByKind: { image: 2, video: 0, audio: 0 },
      fixedSlots: [
        {
          id: "sourceImage",
          kind: "image",
          label: "Source\x20image",
          required: true,
        },
        {
          id: "styleImage",
          kind: "image",
          label: "Style image",
          required: true,
        },
      ],
    },
    outputType: "image",
    ...v1,
  };
}
(test("model input policy: person replace manifests keep dedicated fixed slot behavior", () => {
  (strict["equal"](
    isRhPersonReplaceWorkflowModel(PERSON_REPLACE_V21_MODEL_ID),
    true,
  ),
    strict["equal"](
      isRhPersonReplaceWorkflowModel(PERSON_REPLACE_V3_MODEL_ID),
      true,
    ));
}),
  test("model input policy: generic two image fixed-slot workflows are not person replace", () => {
    const v2 = createTwoSlotWorkflowExecution(),
      v3 = createTwoSlotWorkflowModel();
    (registerManifestBundle({
      sourceId: "model-input-policy-test-two-slot-image",
      executions: [v2],
      models: [v3],
    }),
      strict["equal"](isRhPersonReplaceWorkflowModel(v3["modelId"]), false));
  }),
  test("model input policy: person replace capability requires matching image input slots", () => {
    const v4 = createTwoSlotWorkflowExecution({
        id: "plugin.test.bad-person-replace.workflow.v1",
        workflowId: "plugin-bad-person-replace-workflow",
      }),
      v5 = createTwoSlotWorkflowModel({
        modelId: "plugin/test-bad-person-replace-slots",
        executionId: v4["id"],
        capabilities: { fixedImageSlots: ["replaceTarget", "replacedImage"] },
        inputSlots: {
          allowedKinds: ["text", "image"],
          minByKind: { image: 1 },
          maxByKind: { image: 2, video: 0, audio: 0 },
          fixedSlots: [
            { id: "replaceTarget", kind: "image", required: true },
            { id: "replacedImage", kind: "video", required: false },
          ],
        },
      });
    (registerManifestBundle({
      sourceId: "model-input-policy-test-bad-person-replace-slots",
      executions: [v4],
      models: [v5],
    }),
      strict["equal"](isRhPersonReplaceWorkflowModel(v5["modelId"]), false));
  }),
  test("model input policy: video sources with display local paths are usable inputs", () => {
    (strict["equal"](
      hasUsableInputNodeSource({
        id: "display-video",
        type: "source-video",
        displayLocalPath: "data/assets/display.mp4",
      }),
      true,
    ),
      strict["equal"](
        hasUsableInputNodeSource({
          id: "display-video-missing",
          type: "source-video",
          displayLocalPath: "data/assets/display.mp4",
          mediaUnavailable: true,
          mediaUnavailableSource: "data/assets/display.mp4",
        }),
        false,
      ));
  }),
  test("model input policy: source video result collections fall back to top-level media", () => {
    strict["equal"](
      hasUsableInputNodeSource({
        id: "keyed-video",
        type: "source-video",
        localPath: "output/keyed.mp4",
        videoUrl: "/output/keyed.mp4",
        videos: [{ thumbUrl: "" }],
        model: "runninghub/video_matting",
        rhToolbarTaskType: "video-keying",
        jobStatus: "success",
        isGenerating: false,
      }),
      true,
    );
  }),
  test("model input policy: APIMart text models use GPT image-only media inputs", () => {
    const v6 = getTargetInputPolicy({
      id: "apimart-text",
      type: "ai-text",
      model: "apimart/gemini-3.1-pro-preview",
      provider: "apimart",
    });
    (strict["equal"](isInputKindAllowed(v6, "text"), true),
      strict["equal"](isInputKindAllowed(v6, "image"), true),
      strict["equal"](isInputKindAllowed(v6, "video"), false),
      strict["equal"](isInputKindAllowed(v6, "audio"), false),
      strict["equal"](v6["maxByKind"]["video"], 0),
      strict["equal"](v6["maxByKind"]["audio"], 0));
  }),
  test("model input policy: storyboard nodes accept text image and video inputs", () => {
    for (const v7 of ["storyboard", "storyboard-script"]) {
      const v8 = getTargetInputPolicy({ id: v7 + "-input-target", type: v7 });
      (strict["equal"](isInputKindAllowed(v8, "text"), true),
        strict["equal"](isInputKindAllowed(v8, "image"), true),
        strict["equal"](isInputKindAllowed(v8, "video"), true),
        strict["equal"](isInputKindAllowed(v8, "audio"), false),
        strict["equal"](v8["maxByKind"]["audio"], 0));
    }
  }),
  test("model\x20input\x20policy:\x20HappyHorse\x20media\x20inputs\x20follow\x20the\x20selected\x20mode", () => {
    const v9 = {
        id: "happyhorse",
        type: "ai-video",
        model: "apimart/happyhorse-1.0",
        provider: "apimart",
      },
      v10 = getTargetInputPolicy(v9);
    (strict["equal"](isInputKindAllowed(v10, "image"), false),
      strict["equal"](isInputKindAllowed(v10, "video"), false));
    const v11 = getTargetInputPolicy({
      ...v9,
      generationParams: { happyhorse_mode: "image" },
    });
    (strict["equal"](isInputKindAllowed(v11, "image"), true),
      strict["equal"](isInputKindAllowed(v11, "video"), false),
      strict["equal"](v11["maxByKind"]["image"], 1));
    const v12 = getTargetInputPolicy({
      ...v9,
      generationParams: { happyhorse_mode: "reference" },
    });
    (strict["equal"](isInputKindAllowed(v12, "image"), true),
      strict["equal"](isInputKindAllowed(v12, "video"), false),
      strict["equal"](v12["maxByKind"]["image"], 9));
    const v13 = getTargetInputPolicy({
      ...v9,
      generationParams: { happyhorse_mode: "edit" },
    });
    (strict["equal"](isInputKindAllowed(v13, "image"), true),
      strict["equal"](isInputKindAllowed(v13, "video"), true),
      strict["equal"](isInputKindAllowed(v13, "audio"), false),
      strict["equal"](v13["maxByKind"]["image"], 5),
      strict["equal"](v13["maxByKind"]["video"], 1));
    const v14 = getTargetInputPolicy({
      ...v9,
      model: "runninghub-model/happyhorse-1.0",
      provider: "runninghub",
      generationParams: { happyhorse_mode: "reference" },
    });
    (strict["equal"](isInputKindAllowed(v14, "image"), true),
      strict["equal"](isInputKindAllowed(v14, "video"), false),
      strict["equal"](v14["maxByKind"]["image"], 9));
  }),
  test("model input policy: RunningHub Seedance 2.0 media inputs follow mode", () => {
    const v15 = {
        id: "seedance-2",
        type: "ai-video",
        model: "runninghub-model/seedance-2.0",
        provider: "runninghub",
      },
      v16 = getTargetInputPolicy(v15);
    (strict["equal"](isInputKindAllowed(v16, "text"), true),
      strict["equal"](isInputKindAllowed(v16, "image"), false),
      strict["equal"](isInputKindAllowed(v16, "video"), false),
      strict["equal"](isInputKindAllowed(v16, "audio"), false),
      strict["equal"](v16["maxByKind"]["image"], 0),
      strict["equal"](v16["maxByKind"]["video"], 0),
      strict["equal"](v16["maxByKind"]["audio"], 0));
    const v17 = getTargetInputPolicy({
      ...v15,
      generationParams: { rh_seedance_2_mode: "image2video" },
    });
    (strict["equal"](isInputKindAllowed(v17, "text"), true),
      strict["equal"](isInputKindAllowed(v17, "image"), true),
      strict["equal"](isInputKindAllowed(v17, "video"), false),
      strict["equal"](isInputKindAllowed(v17, "audio"), false),
      strict["equal"](v17["maxByKind"]["image"], 1),
      strict["equal"](v17["maxByKind"]["video"], 0),
      strict["equal"](v17["maxByKind"]["audio"], 0));
    const v18 = getTargetInputPolicy({
      ...v15,
      generationParams: { rh_seedance_2_mode: "frames2video" },
    });
    (strict["equal"](isInputKindAllowed(v18, "text"), true),
      strict["equal"](isInputKindAllowed(v18, "image"), true),
      strict["equal"](isInputKindAllowed(v18, "video"), false),
      strict["equal"](isInputKindAllowed(v18, "audio"), false),
      strict["equal"](v18["maxByKind"]["image"], 2),
      strict["equal"](v18["maxByKind"]["video"], 0),
      strict["equal"](v18["maxByKind"]["audio"], 0));
    const v19 = getTargetInputPolicy({
      ...v15,
      generationParams: { rh_seedance_2_mode: "multimodal2video" },
    });
    (strict["equal"](isInputKindAllowed(v19, "text"), true),
      strict["equal"](isInputKindAllowed(v19, "image"), true),
      strict["equal"](isInputKindAllowed(v19, "video"), true),
      strict["equal"](isInputKindAllowed(v19, "audio"), true),
      strict["equal"](v19["maxByKind"]["image"], 9),
      strict["equal"](v19["maxByKind"]["video"], 3),
      strict["equal"](v19["maxByKind"]["audio"], 3));
  }),
  test("model input policy: Volcengine Seedance 2.0 media inputs follow mode", () => {
    const v20 = {
        id: "volcengine-seedance-2",
        type: "ai-video",
        model: "volcengine/seedance-2.0-fast",
        provider: "volcengine",
      },
      v21 = getTargetInputPolicy(v20);
    (strict["equal"](isInputKindAllowed(v21, "text"), true),
      strict["equal"](isInputKindAllowed(v21, "image"), true),
      strict["equal"](isInputKindAllowed(v21, "video"), true),
      strict["equal"](isInputKindAllowed(v21, "audio"), true),
      strict["equal"](v21["maxByKind"]["image"], 9),
      strict["equal"](v21["maxByKind"]["video"], 3),
      strict["equal"](v21["maxByKind"]["audio"], 3));
    const v22 = getTargetInputPolicy({
      ...v20,
      generationParams: { dreaminaRouteMode: "frames2video" },
    });
    (strict["equal"](isInputKindAllowed(v22, "image"), true),
      strict["equal"](isInputKindAllowed(v22, "video"), false),
      strict["equal"](v22["maxByKind"]["image"], 2));
    const v23 = getTargetInputPolicy({
      ...v20,
      generationParams: { dreaminaRouteMode: "multimodal2video" },
    });
    (strict["equal"](isInputKindAllowed(v23, "image"), true),
      strict["equal"](isInputKindAllowed(v23, "video"), true),
      strict["equal"](isInputKindAllowed(v23, "audio"), true),
      strict["equal"](v23["maxByKind"]["image"], 9),
      strict["equal"](v23["maxByKind"]["video"], 3),
      strict["equal"](v23["maxByKind"]["audio"], 3),
      strict["equal"](isInputKindAllowed(v21, "text"), true));
  }),
  test("model input policy: VEO3 reference mode keeps generic 3 image inputs", () => {
    const v24 = getTargetInputPolicy({
      id: "veo3-reference",
      type: "ai-video",
      model: "apimart/veo3-fast",
      provider: "apimart",
      generationParams: { mode: "fast", generation_type: "reference" },
    });
    (strict["equal"](isInputKindAllowed(v24, "text"), true),
      strict["equal"](isInputKindAllowed(v24, "image"), true),
      strict["equal"](isInputKindAllowed(v24, "video"), false),
      strict["equal"](isInputKindAllowed(v24, "audio"), false),
      strict["equal"](v24["maxByKind"]["image"], 3));
  }),
  test("model input policy: Vidu Q3 media inputs follow generation mode", () => {
    const v25 = {
        id: "vidu-q3",
        type: "ai-video",
        model: "apimart/viduq3",
        provider: "apimart",
      },
      v26 = getTargetInputPolicy(v25);
    (strict["equal"](isInputKindAllowed(v26, "text"), true),
      strict["equal"](isInputKindAllowed(v26, "image"), true),
      strict["equal"](isInputKindAllowed(v26, "video"), false),
      strict["equal"](isInputKindAllowed(v26, "audio"), false),
      strict["equal"](v26["maxByKind"]["image"], 2));
    const v27 = getTargetInputPolicy({
      ...v25,
      generationParams: {
        vidu_q3_generation_mode: "reference",
        mode: "viduq3",
      },
    });
    (strict["equal"](isInputKindAllowed(v27, "text"), true),
      strict["equal"](isInputKindAllowed(v27, "image"), true),
      strict["equal"](isInputKindAllowed(v27, "video"), false),
      strict["equal"](isInputKindAllowed(v27, "audio"), false),
      strict["equal"](v27["maxByKind"]["image"], 7));
  }),
  test("model input policy: Grok Imagine uses manifest image-only limit", () => {
    const v28 = getTargetInputPolicy({
      id: "grok-imagine",
      type: "ai-video",
      model: "apimart/grok-imagine-1.0",
      provider: "apimart",
    });
    (strict["equal"](isInputKindAllowed(v28, "text"), true),
      strict["equal"](isInputKindAllowed(v28, "image"), true),
      strict["equal"](isInputKindAllowed(v28, "video"), false),
      strict["equal"](isInputKindAllowed(v28, "audio"), false),
      strict["equal"](v28["maxByKind"]["image"], 7));
  }),
  test("model input policy: Gemini Omni Flash uses manifest image-only limit", () => {
    const v29 = getTargetInputPolicy({
      id: "omni-flash",
      type: "ai-video",
      model: "apimart/omni-flash-ext",
      provider: "apimart",
    });
    (strict["equal"](isInputKindAllowed(v29, "text"), true),
      strict["equal"](isInputKindAllowed(v29, "image"), true),
      strict["equal"](isInputKindAllowed(v29, "video"), false),
      strict["equal"](isInputKindAllowed(v29, "audio"), false),
      strict["equal"](v29["maxByKind"]["image"], 3));
  }),
  test("model input policy: Wan2.7 media inputs follow image/video mode", () => {
    const v30 = {
        id: "wan27",
        type: "ai-video",
        model: "apimart/wan2.7",
        provider: "apimart",
      },
      v31 = getTargetInputPolicy(v30);
    (strict["equal"](isInputKindAllowed(v31, "text"), true),
      strict["equal"](isInputKindAllowed(v31, "image"), true),
      strict["equal"](isInputKindAllowed(v31, "audio"), true),
      strict["equal"](isInputKindAllowed(v31, "video"), false),
      strict["equal"](v31["maxByKind"]["image"], 2),
      strict["equal"](v31["maxByKind"]["audio"], 1));
    const v32 = getTargetInputPolicy({
      ...v30,
      generationParams: { wan27_mode: "video" },
    });
    (strict["equal"](isInputKindAllowed(v32, "text"), true),
      strict["equal"](isInputKindAllowed(v32, "video"), true),
      strict["equal"](isInputKindAllowed(v32, "image"), false),
      strict["equal"](isInputKindAllowed(v32, "audio"), false),
      strict["equal"](v32["maxByKind"]["video"], 1));
    const v33 = getTargetInputPolicy({
      ...v30,
      model: "wan2.7",
      generationParams: { wan27_mode: "video" },
    });
    (strict["equal"](isInputKindAllowed(v33, "video"), true),
      strict["equal"](isInputKindAllowed(v33, "image"), false),
      strict["equal"](isInputKindAllowed(v33, "audio"), false));
    const v34 = getTargetInputPolicy({
      ...v30,
      generationParams: { wan27_mode: "reference" },
    });
    (strict["equal"](isInputKindAllowed(v34, "image"), true),
      strict["equal"](isInputKindAllowed(v34, "video"), true),
      strict["equal"](isInputKindAllowed(v34, "audio"), true),
      strict["equal"](v34["maxByKind"]["image"], 1),
      strict["equal"](v34["maxByKind"]["video"], 1),
      strict["equal"](v34["maxByKind"]["audio"], 1));
    const v35 = getTargetInputPolicy({
      ...v30,
      generationParams: { wan27_mode: "edit" },
    });
    (strict["equal"](isInputKindAllowed(v35, "image"), false),
      strict["equal"](isInputKindAllowed(v35, "video"), true),
      strict["equal"](isInputKindAllowed(v35, "audio"), false),
      strict["equal"](v35["maxByKind"]["image"], 0),
      strict["equal"](v35["maxByKind"]["video"], 2));
    const v36 = getTargetInputPolicy({
      ...v30,
      provider: "apimartr",
      generationParams: { wan27_mode: "video" },
    });
    (strict["equal"](isInputKindAllowed(v36, "video"), true),
      strict["equal"](isInputKindAllowed(v36, "image"), false));
  }),
  test("model input policy: Kling V3 Omni media inputs follow selected mode", () => {
    const v37 = {
        id: "kling-omni",
        type: "ai-video",
        model: "apimart/kling-v3-omni",
        provider: "apimart",
      },
      v38 = getTargetInputPolicy(v37);
    (strict["equal"](isInputKindAllowed(v38, "text"), true),
      strict["equal"](isInputKindAllowed(v38, "image"), true),
      strict["equal"](isInputKindAllowed(v38, "video"), false),
      strict["equal"](isInputKindAllowed(v38, "audio"), false),
      strict["equal"](v38["maxByKind"]["image"], 2));
    const v39 = getTargetInputPolicy({
      ...v37,
      generationParams: { kling_v3_omni_mode: "reference" },
    });
    (strict["equal"](isInputKindAllowed(v39, "image"), true),
      strict["equal"](isInputKindAllowed(v39, "video"), true),
      strict["equal"](isInputKindAllowed(v39, "audio"), false),
      strict["equal"](v39["maxByKind"]["image"], 1),
      strict["equal"](v39["maxByKind"]["video"], 1));
    const v40 = getTargetInputPolicy({
      ...v37,
      generationParams: { kling_v3_omni_mode: "edit" },
    });
    (strict["equal"](isInputKindAllowed(v40, "image"), false),
      strict["equal"](isInputKindAllowed(v40, "video"), true),
      strict["equal"](isInputKindAllowed(v40, "audio"), false),
      strict["equal"](v40["maxByKind"]["video"], 1));
  }),
  test("model input policy: Kling O1 uses manifest image and video limits", () => {
    const v41 = getTargetInputPolicy({
      id: "kling-o1",
      type: "ai-video",
      model: "apimart/kling-video-o1",
      provider: "apimart",
    });
    (strict["equal"](isInputKindAllowed(v41, "text"), true),
      strict["equal"](isInputKindAllowed(v41, "image"), true),
      strict["equal"](isInputKindAllowed(v41, "video"), true),
      strict["equal"](isInputKindAllowed(v41, "audio"), false),
      strict["equal"](v41["maxByKind"]["image"], 2),
      strict["equal"](v41["maxByKind"]["video"], 1));
  }));
