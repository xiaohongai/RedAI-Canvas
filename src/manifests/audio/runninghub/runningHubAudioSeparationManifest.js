import {
  RH_AUDIO_INSTANCE_FIELD,
  createRunningHubAudioExecutionManifest,
  createRunningHubAudioModelManifest,
} from "../../shared/runningHubAudioManifestShared.js";
export const RH_AUDIO_SEPARATION_MODEL_ID = "runninghub/2047408096384917505";
export const RH_AUDIO_SEPARATION_EXECUTION_ID =
  "runninghub.workflow.audio-separation.v1";
export const rhAudioSeparationModelManifest =
  createRunningHubAudioModelManifest({
    modelId: RH_AUDIO_SEPARATION_MODEL_ID,
    executionId: RH_AUDIO_SEPARATION_EXECUTION_ID,
    uiPlacement: ["toolbar"],
    displayName: "音频分离",
    description: "RunningHub 人声和背景声分离工作流",
    inputSlots: {
      allowedKinds: ["audio"],
      minByKind: { audio: 1 },
      maxByKind: { image: 0, video: 0, audio: 1 },
      fixedSlots: Object["freeze"]([
        Object["freeze"]({
          id: "sourceAudio",
          kind: "audio",
          label: "源音频",
          required: true,
        }),
      ]),
    },
    uiFields: [RH_AUDIO_INSTANCE_FIELD],
  });
export const rhAudioSeparationExecutionManifest =
  createRunningHubAudioExecutionManifest({
    id: RH_AUDIO_SEPARATION_EXECUTION_ID,
    label: "音频分离",
    workflowId: "2047408096384917505",
    preset: "rh-audio-separation",
    mapping: {
      sourceAudioNode: Object["freeze"]({ nodeId: "4", fieldName: "audio" }),
      resultNodes: Object["freeze"]({ vocals: "5", background: "7" }),
    },
  });
