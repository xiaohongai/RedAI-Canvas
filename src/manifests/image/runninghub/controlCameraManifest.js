export const CONTROL_CAMERA_MODEL_ID = "runninghub/2053902968243671041";
export const CONTROL_CAMERA_EXECUTION_ID =
  "runninghub.workflow.control-camera.v1";
export const controlCameraModelManifest = Object["freeze"]({
  schemaVersion: "1.0",
  modelId: CONTROL_CAMERA_MODEL_ID,
  provider: "runninghubwf",
  kind: "image",
  adapterType: "workflow",
  executionId: CONTROL_CAMERA_EXECUTION_ID,
  displayName: "控制摄像机",
  icon: "images/RH.png",
  description: "控制角度专用\x20RunningHub\x20摄像机视角工作流",
  extensions: Object["freeze"]({
    imageFunctionMenu: Object["freeze"]({ scope: "freeAngle", order: 10 }),
  }),
  capabilities: Object["freeze"]({
    inputKinds: Object["freeze"](["image"]),
    outputType: "image",
    maxImages: 1,
  }),
  inputSlots: Object["freeze"]({
    allowedKinds: Object["freeze"](["image"]),
    minByKind: Object["freeze"]({ image: 1 }),
    maxByKind: Object["freeze"]({ text: 0, image: 1, video: 0, audio: 0 }),
  }),
  uiSchema: Object["freeze"]({ fields: Object["freeze"]([]) }),
  async: true,
  cancellable: true,
  outputType: "image",
});
export const controlCameraExecutionManifest = Object["freeze"]({
  schemaVersion: "1.0",
  id: CONTROL_CAMERA_EXECUTION_ID,
  provider: "runninghubwf",
  kind: "image",
  adapterType: "workflow",
  label: "控制摄像机",
  workflowId: "2053902968243671041",
  appId: "2053902968243671041",
  submitMode: "openapi-v2-ai-app",
  queryMode: "openapi-v2-query",
  instanceType: Object["freeze"]({
    field: "rhInstanceType",
    defaultValue: "default",
  }),
  validation: Object["freeze"]({
    minInputImages: 1,
    missingInputMessage: "请先提供一张图片再控制摄像机",
  }),
  mapping: Object["freeze"]({
    maxInputImages: 1,
    imageNodes: Object["freeze"]([
      Object["freeze"]({
        nodeId: "16",
        fieldName: "image",
        description: "载入图像",
      }),
    ]),
    promptNode: Object["freeze"]({
      nodeId: "23",
      fieldName: "value",
      prefix: "<sks> ",
    }),
  }),
  result: Object["freeze"]({
    taskIdPath: "taskId",
    imagePaths: Object["freeze"](["results[].url", "results[].imageUrl"]),
  }),
});
