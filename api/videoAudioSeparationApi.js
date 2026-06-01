import { post } from "./apiBase.js";
import {
  canUseElectronMediaTask,
  enqueueElectronMediaTask,
} from "./localMediaTaskApi.js";
export async function separateVideoAudio(v0 = {}) {
  const v1 = String(v0?.["src"] || "")["trim"]();
  if (!v1) throw new Error("src 不能为空");
  if (canUseElectronMediaTask())
    return await enqueueElectronMediaTask(
      { kind: "videoAudioSeparate", src: v1, nodeId: v0?.["nodeId"] || "" },
      { wait: true, timeout: 300000 },
    );
  const v2 = await post(
    "/api/v2/video/separate_audio_video",
    { src: v1 },
    180000,
  );
  if (!v2?.["success"]) throw new Error(v2?.["error"] || "音画分离请求失败");
  const v3 = v2["data"] || {};
  if (!v3["success"])
    throw new Error(v3["error"] || v3["message"] || "音画分离失败");
  if (!v3["video"]?.["localPath"] || !v3["audio"]?.["localPath"])
    throw new Error("音画分离返回结果不完整");
  return v3;
}
