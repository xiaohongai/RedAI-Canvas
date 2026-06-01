import {
  ASPECT_RATIO_FIELD,
  BATCH_SIZE_FIELD,
  IMAGE_SIZE_FIELD,
  createImageModelApiManifest,
  createModelApiExecutionManifest,
} from "./sharedImageModelApiFields.js";
const PPIO_IMAGE_BODY_MAPPING = Object["freeze"]([
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({ path: "watermark", from: "constant", value: false }),
  ]),
  PPIO_IMAGE_RESPONSE_MAPPING = Object["freeze"]({
    taskIdPath: Object["freeze"]([
      "task_id",
      "taskId",
      "data.task_id",
      "data.taskId",
    ]),
    statusPath: "status",
    errorPath: "error",
    resultPaths: Object["freeze"]([
      "data[].url",
      "data[].fileUrl",
      "data.results[].url",
      "results[].url",
      "results[].imageUrl",
      "url",
    ]),
  }),
  PPIO_SEEDREAM_DEFAULT_POLICY = Object["freeze"]({
    imageInputField: "image",
    optimizePromptOptions: Object["freeze"]({ mode: "standard" }),
  }),
  PPIO_SEEDREAM_4_POLICY = Object["freeze"]({
    imageInputField: "images",
    batchSizeField: "max_images",
  });
export const ppioImageModelApiModelManifests = Object["freeze"]([
  createImageModelApiManifest({
    modelId: "ppio/seedream-5.0-lite",
    executionId: "ppio.model-api.seedream-5-lite.v1",
    provider: "ppio",
    displayName: "Seedream 5.0 lite",
    icon: "images/jimeng.png",
    description: "PPIO image model API",
    fields: [IMAGE_SIZE_FIELD, ASPECT_RATIO_FIELD, BATCH_SIZE_FIELD],
  }),
  createImageModelApiManifest({
    modelId: "ppio/seedream-4.5",
    executionId: "ppio.model-api.seedream-4-5.v1",
    provider: "ppio",
    displayName: "Seedream 4.5",
    icon: "images/jimeng.png",
    description: "PPIO\x20image\x20model\x20API",
    fields: [IMAGE_SIZE_FIELD, ASPECT_RATIO_FIELD, BATCH_SIZE_FIELD],
  }),
  createImageModelApiManifest({
    modelId: "ppio/seedream-4.0",
    executionId: "ppio.model-api.seedream-4.v1",
    provider: "ppio",
    displayName: "Seedream 4.0",
    icon: "images/jimeng.png",
    description: "PPIO image model API",
    fields: [IMAGE_SIZE_FIELD, ASPECT_RATIO_FIELD, BATCH_SIZE_FIELD],
  }),
]);
export const ppioImageModelApiExecutionManifests = Object["freeze"]([
  createModelApiExecutionManifest({
    id: "ppio.model-api.seedream-5-lite.v1",
    provider: "ppio",
    model: "seedream-5.0-lite",
    endpoint: "/v3/seedream-5.0-lite",
    bodyMapping: PPIO_IMAGE_BODY_MAPPING,
    responseMapping: PPIO_IMAGE_RESPONSE_MAPPING,
    extensions: Object["freeze"]({
      bodyResolver: "ppioImageSize",
      ppioImage: PPIO_SEEDREAM_DEFAULT_POLICY,
    }),
  }),
  createModelApiExecutionManifest({
    id: "ppio.model-api.seedream-4-5.v1",
    provider: "ppio",
    model: "seedream-4.5",
    endpoint: "/v3/seedream-4.5",
    bodyMapping: PPIO_IMAGE_BODY_MAPPING,
    responseMapping: PPIO_IMAGE_RESPONSE_MAPPING,
    extensions: Object["freeze"]({
      bodyResolver: "ppioImageSize",
      ppioImage: PPIO_SEEDREAM_DEFAULT_POLICY,
    }),
  }),
  createModelApiExecutionManifest({
    id: "ppio.model-api.seedream-4.v1",
    provider: "ppio",
    model: "seedream-4.0",
    endpoint: "/v3/seedream-4.0",
    bodyMapping: PPIO_IMAGE_BODY_MAPPING,
    responseMapping: PPIO_IMAGE_RESPONSE_MAPPING,
    extensions: Object["freeze"]({
      bodyResolver: "ppioImageSize",
      ppioImage: PPIO_SEEDREAM_4_POLICY,
    }),
  }),
]);
