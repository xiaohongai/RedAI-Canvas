import {
  RH_AUDIO_INSTANCE_FIELD,
  createRunningHubAudioExecutionManifest,
  createRunningHubAudioModelManifest,
} from "../../shared/runningHubAudioManifestShared.js";
export const RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID = "advanced_voice_clone";
export const RH_AUDIO_ADVANCED_VOICE_CLONE_EXECUTION_ID =
  "runninghub.workflow.audio-advanced-voice-clone.v1";
export const RH_AUDIO_ADVANCED_VOICE_CLONE_RUNNINGHUB_MODEL_ID =
  "runninghub/2050165249344585729";
export const RH_AUDIO_ADVANCED_VOICE_CLONE_HELP_TOOLTIP = [
  "进阶声音克隆用法",
  "支持 3~15 秒音频",
  "无音频入参时 TTS语音 根据提示词生成随机音色",
  "例：今晚月色真好",
  "1个音频入参时 克隆语音",
  "2个音频入参时 多人克隆音色对话",
  "示例：",
  "@音频1 你今晚回家吗",
  "@音频2 不回了加班要忙到很晚",
]["join"]("\x0a");
export const rhAudioAdvancedVoiceCloneModelManifest =
  createRunningHubAudioModelManifest({
    modelId: RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
    executionId: RH_AUDIO_ADVANCED_VOICE_CLONE_EXECUTION_ID,
    displayName: "进阶声音克隆",
    description: "当前最强情感充足克隆语音音色必备",
    extensions: Object["freeze"]({
      audioMenu: Object["freeze"]({ group: "runninghubWorkflow", order: 30 }),
      vipAliases: Object["freeze"](["advanced_voice_clone", "voice_clone.pro"]),
    }),
    vip: true,
    subscriptionAliases: [
      RH_AUDIO_ADVANCED_VOICE_CLONE_RUNNINGHUB_MODEL_ID,
      "ai-app/2050165249344585729",
      "2050165249344585729",
      "voice_clone.pro",
    ],
    help: Object["freeze"]({
      tooltip: RH_AUDIO_ADVANCED_VOICE_CLONE_HELP_TOOLTIP,
      renderer: "advancedVoiceClone",
    }),
    inputSlots: {
      allowedKinds: ["text", "audio"],
      minByKind: { audio: 0 },
      maxByKind: { image: 0, video: 0, audio: 2 },
      fixedSlots: Object["freeze"]([
        Object["freeze"]({
          id: "audio1",
          kind: "audio",
          label: "音频1",
          required: false,
        }),
        Object["freeze"]({
          id: "audio2",
          kind: "audio",
          label: "音频2",
          required: false,
        }),
      ]),
    },
    uiFields: [RH_AUDIO_INSTANCE_FIELD],
  });
export const rhAudioAdvancedVoiceCloneExecutionManifest =
  createRunningHubAudioExecutionManifest({
    id: RH_AUDIO_ADVANCED_VOICE_CLONE_EXECUTION_ID,
    label: "进阶声音克隆",
    workflowId: "2050165249344585729",
    preset: "rh-audio-advanced-voice-clone",
    mapping: {
      audio1Node: Object["freeze"]({ nodeId: "1", fieldName: "audio" }),
      audio2Node: Object["freeze"]({ nodeId: "25", fieldName: "audio" }),
      promptNode: Object["freeze"]({ nodeId: "33", fieldName: "prompt" }),
      indexNode: Object["freeze"]({ nodeId: "37", fieldName: "index" }),
    },
  });
