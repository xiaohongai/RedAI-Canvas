function freezeField(v0) {
  return Object["freeze"](v0);
}
export function createRunningHubAudioModelManifest({
  modelId: v1,
  executionId: v2,
  displayName: v3,
  description: v4,
  inputSlots: v5,
  uiFields: v6,
  help: v7,
  uiPlacement: v8,
  extensions: v9,
  vip: vip = false,
  subscriptionAliases: subscriptionAliases = [],
}) {
  return Object["freeze"]({
    schemaVersion: "1.0",
    modelId: v1,
    provider: "runninghubwf",
    kind: "audio",
    adapterType: "workflow",
    executionId: v2,
    displayName: v3,
    icon: "images/RH.png",
    description: v4,
    ...(v9 ? { extensions: v9 } : {}),
    help: Object["freeze"](v7 || {}),
    uiPlacement: Object["freeze"](v8 || ["modelMenu"]),
    vip: vip,
    subscriptionAliases: Object["freeze"](subscriptionAliases),
    capabilities: Object["freeze"]({
      inputKinds: Object["freeze"](v5["allowedKinds"] || []),
      outputType: "audio",
      fixedAssetSlots: Object["freeze"](
        (v5["fixedSlots"] || [])["map"]((v10) => v10["id"]),
      ),
    }),
    inputSlots: Object["freeze"]({
      allowedKinds: Object["freeze"](v5["allowedKinds"] || []),
      minByKind: Object["freeze"](v5["minByKind"] || {}),
      maxByKind: Object["freeze"](v5["maxByKind"] || {}),
      fixedSlots: Object["freeze"](v5["fixedSlots"] || []),
    }),
    uiSchema: Object["freeze"]({
      fields: Object["freeze"]((v6 || [])["map"](freezeField)),
    }),
    async: true,
    cancellable: true,
    outputType: "audio",
  });
}
export function createRunningHubAudioExecutionManifest({
  id: v11,
  label: v12,
  workflowId: v13,
  preset: v14,
  mapping: mapping = {},
}) {
  return Object["freeze"]({
    schemaVersion: "1.0",
    id: v11,
    provider: "runninghubwf",
    kind: "audio",
    adapterType: "workflow",
    label: v12,
    workflowId: v13,
    appId: v13,
    submitMode: "openapi-v2-ai-app",
    queryMode: "openapi-v2-query",
    instanceType: Object["freeze"]({
      field: "rhInstanceType",
      defaultValue: "default",
    }),
    mapping: Object["freeze"]({ preset: v14, ...mapping }),
    result: Object["freeze"]({
      taskIdPath: "taskId",
      audioPaths: Object["freeze"]([
        "results[].audioUrl",
        "results[].url",
        "audioUrl",
      ]),
    }),
  });
}
export const RH_AUDIO_INSTANCE_FIELD = Object["freeze"]({
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
