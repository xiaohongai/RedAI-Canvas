function freezeField(v0) {
  return Object["freeze"](v0);
}
function freezeSlotGroup(v1) {
  return Object["freeze"]({
    ...v1,
    slots: Object["freeze"](v1?.["slots"] || []),
  });
}
function freezeDisplayAspectRatioSource(v2) {
  return v2 && typeof v2 === "object" && !Array["isArray"](v2)
    ? Object["freeze"]({ ...v2 })
    : undefined;
}
export function createRunningHubVideoModelManifest({
  modelId: v3,
  executionId: v4,
  displayName: v5,
  description: v6,
  inputSlots: v7,
  uiFields: v8,
  vip: vip = false,
  fixedAssetSlots: v9,
  uiPlacement: v10,
  help: v11,
  extensions: v12,
  subscriptionAliases: subscriptionAliases = [],
}) {
  const v13 = freezeDisplayAspectRatioSource(v7["displayAspectRatioSource"]);
  return Object["freeze"]({
    schemaVersion: "1.0",
    modelId: v3,
    provider: "runninghubwf",
    kind: "video",
    adapterType: "workflow",
    executionId: v4,
    displayName: v5,
    icon: "images/RH.png",
    description: v6,
    help: Object["freeze"](v11 || {}),
    ...(v12 ? { extensions: Object["freeze"](v12) } : {}),
    subscriptionAliases: Object["freeze"](subscriptionAliases),
    vip: vip,
    ...(v10 ? { uiPlacement: Object["freeze"](v10) } : {}),
    capabilities: Object["freeze"]({
      inputKinds: Object["freeze"](v7["allowedKinds"] || []),
      outputType: "video",
      fixedAssetSlots: v9 ? Object["freeze"](v9) : undefined,
    }),
    inputSlots: Object["freeze"]({
      allowedKinds: Object["freeze"](v7["allowedKinds"] || []),
      minByKind: Object["freeze"](v7["minByKind"] || {}),
      maxByKind: Object["freeze"](v7["maxByKind"] || {}),
      ...(v13 ? { displayAspectRatioSource: v13 } : {}),
      fixedSlots: Object["freeze"](v7["fixedSlots"] || []),
      exclusiveGroups: Object["freeze"](
        (v7["exclusiveGroups"] || [])["map"](freezeSlotGroup),
      ),
    }),
    uiSchema: Object["freeze"]({
      fields: Object["freeze"]((v8 || [])["map"](freezeField)),
    }),
    async: true,
    cancellable: true,
    outputType: "video",
  });
}
export function createRunningHubVideoExecutionManifest({
  id: v14,
  label: v15,
  workflowId: v16,
  submitMode: v17,
  queryMode: v18,
  mapping: mapping = {},
  preset: v19,
  extensions: extensions = {},
}) {
  return Object["freeze"]({
    schemaVersion: "1.0",
    id: v14,
    provider: "runninghubwf",
    kind: "video",
    adapterType: "workflow",
    label: v15,
    workflowId: v16,
    appId: v16,
    submitMode: v17,
    queryMode: v18,
    instanceType: Object["freeze"]({
      field: "rhInstanceType",
      defaultValue: "default",
    }),
    mapping: Object["freeze"]({ ...(v19 ? { preset: v19 } : {}), ...mapping }),
    extensions: Object["freeze"](extensions || {}),
    result: Object["freeze"]({
      taskIdPath: "taskId",
      videoPaths: Object["freeze"](["results[].videoUrl", "results[].url"]),
    }),
  });
}
export const RH_VIDEO_RESOLUTION_FIELD = Object["freeze"]({
  id: "rhVideoResolution",
  type: "slider",
  placement: "videoParams",
  label: "分辨率",
  defaultValue: 832,
  options: Object["freeze"]([832, 1024, 1280, 1440, 1600, 1760, 1920]),
});
export const RH_VIDEO_FPS_FIELD = Object["freeze"]({
  id: "rhVideoFps",
  type: "segmented",
  placement: "videoParams",
  label: "帧率",
  defaultValue: 24,
  options: Object["freeze"]([
    Object["freeze"]({ value: 16, label: "16帧" }),
    Object["freeze"]({ value: 24, label: "24帧" }),
  ]),
});
export const RH_INSTANCE_FIELD = Object["freeze"]({
  id: "rhInstanceType",
  type: "segmented",
  placement: "instance",
  label: "显存",
  defaultValue: "default",
  options: Object["freeze"]([
    Object["freeze"]({ value: "default", label: "24G" }),
    Object["freeze"]({ value: "plus", label: "48G" }),
  ]),
});
