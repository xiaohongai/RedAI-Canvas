import appStore from "../core/stores/appStore.js";
import { requester } from "../../api/requester.js";
import {
  canUseElectronMediaTask,
  enqueueElectronMediaTask,
} from "../../api/localMediaTaskApi.js";
import { generateId } from "../core/math.js";
import { commit } from "./history.js";
import { calcSafeSpawnPosNearNode } from "./nodeSpawn.js";
import {
  buildSourceAudioNodePayload,
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from "../services/fileService.js";
import {
  localPathToUrl,
  pickResultLocalPath,
} from "../utils/localMediaPath.js";
import {
  getOrderedMediaComposeIds,
  getSelectedMediaComposeKind,
} from "./mediaComposeSelection.js";
const MEDIA_COMPOSE_CONFIG = Object["freeze"]({
  video: Object["freeze"]({
    taskKind: "videoCompose",
    endpoint: "/api/v2/video/compose",
    minSelectionMessage: "至少选择 2 个视频片段",
    invalidSourceMessage: "选中的视频源无效",
    progressMessage: "⏳ 正在合成视频...",
    missingApiMessage:
      "后端接口不存在：/api/v2/video/compose（请重启 server.py）",
    fallbackMessage: "合成失败",
    resultName: "合成视频",
    resultIdPrefix: "source-video-compose",
    successMessage: "✅ 合成完成，已生成新视频节点",
    sourceFields: Object["freeze"]([
      "localPath",
      "src",
      "videoUrl",
      "url",
      "resultUrl",
    ]),
  }),
  audio: Object["freeze"]({
    taskKind: "audioCompose",
    endpoint: "/api/v2/audio/compose",
    minSelectionMessage: "至少选择 2 个音频片段",
    invalidSourceMessage: "选中的音频源无效",
    progressMessage: "⏳ 正在合并音频...",
    missingApiMessage:
      "后端接口不存在：/api/v2/audio/compose（请重启 server.py）",
    fallbackMessage: "合并失败",
    resultName: "合并音频",
    resultIdPrefix: "source-audio-compose",
    successMessage: "✅\x20合并完成，已生成新音频节点",
    sourceFields: Object["freeze"]([
      "localPath",
      "audioUrl",
      "src",
      "url",
      "resultUrl",
    ]),
  }),
});
function resolveNodeSrc(v0, v1) {
  const v2 = Array["isArray"](v1?.["sourceFields"]) ? v1["sourceFields"] : [];
  for (const v3 of v2) {
    const v4 = localPathToUrl(v0?.[v3]);
    if (v4) return v4;
  }
  return "";
}
function getResultNodeSize(v5, v6) {
  if (v5 === "audio")
    return {
      width: Number(v6?.["width"] || 0) || 320,
      height: Number(v6?.["height"] || 0) || 140,
    };
  return getAutoMediaSizeByShortSide(
    v6?.["width"] || 512,
    v6?.["height"] || 288,
  );
}
function buildComposedNodePayload(
  v7,
  v8,
  { id: v9, x: v10, y: v11, width: v12, height: v13, localPath: v14 },
) {
  const v15 = localPathToUrl(v14);
  if (v7 === "audio")
    return buildSourceAudioNodePayload({
      id: v9,
      type: "source-audio",
      x: v10,
      y: v11,
      width: v12,
      height: v13,
      name: v8["resultName"],
      src: v15,
      audioUrl: v15,
      localPath: v14,
      needsAutoResize: false,
      fixedSize: true,
    });
  return buildSourceMediaNodePayload({
    id: v9,
    type: "source-video",
    x: v10,
    y: v11,
    width: v12,
    height: v13,
    name: v8["resultName"],
    src: v15,
    localPath: v14,
    needsAutoResize: false,
    fixedSize: true,
  });
}
async function runMediaComposeRequest(v16, v17) {
  if (canUseElectronMediaTask())
    return await enqueueElectronMediaTask(
      { kind: v16["taskKind"], srcs: v17, args: { srcs: v17 } },
      { wait: true, timeout: 600000 },
    );
  const v18 = await requester({
    url: v16["endpoint"],
    method: "POST",
    provider: "local",
    timeout: 300000,
    headers: { "Content-Type": "application/json" },
    body: JSON["stringify"]({ srcs: v17 }),
    allow404Null: true,
    returnMeta: true,
  });
  if (v18?.["status"] === 404 || v18?.["data"] == null)
    throw new Error(v16["missingApiMessage"]);
  return v18["data"] || {};
}
async function composeSelectedMedia(v19, v20, v21) {
  const v22 = MEDIA_COMPOSE_CONFIG[v21];
  if (!v22) return;
  const v23 = appStore["getState"](),
    v24 = v23["nodes"] || {},
    v25 = v23["selectionMeta"] || {},
    v26 = Array["isArray"](v19) ? v19["slice"]() : [];
  if (getSelectedMediaComposeKind(v24, v26) !== v21) {
    window["showToast"]?.(v22["minSelectionMessage"], "info");
    return;
  }
  const v27 = getOrderedMediaComposeIds(v24, v26, v25),
    v28 = v27["map"]((v29) => resolveNodeSrc(v24[v29], v22))["filter"](Boolean);
  if (v28["length"] < 2) {
    window["showToast"]?.(v22["invalidSourceMessage"], "error");
    return;
  }
  v20 && ((v20["dataset"]["loading"] = "true"), (v20["disabled"] = true));
  window["showToast"]?.(v22["progressMessage"], "info");
  try {
    const v30 = await runMediaComposeRequest(v22, v28),
      v31 = pickResultLocalPath(v30);
    if (!v30["success"] || !v31)
      throw new Error(v30["error"] || v30["message"] || v22["fallbackMessage"]);
    const v32 = v27[0],
      v33 = v24[v32],
      { width: v34, height: v35 } = getResultNodeSize(v21, v33),
      v36 = calcSafeSpawnPosNearNode(
        appStore["getState"]()["nodes"],
        v33,
        v34,
        v35,
      ),
      v37 = generateId(v22["resultIdPrefix"]);
    (appStore["addNode"](
      buildComposedNodePayload(v21, v22, {
        id: v37,
        x: v36["x"],
        y: v36["y"],
        width: v34,
        height: v35,
        localPath: v31,
      }),
    ),
      appStore["setSelectedNodes"]([v37]),
      commit(),
      window["v2FocusOnNodes"]?.([...v27, v37]),
      window["_triggerLocalCacheSave"]?.(),
      window["showToast"]?.(v22["successMessage"], "success"));
  } catch (v38) {
    const v39 =
      v38 instanceof Error
        ? v38["message"]
        : String(v38 || v22["fallbackMessage"]);
    window["showToast"]?.(
      "❌\x20" + v22["fallbackMessage"] + ":\x20" + v39,
      "error",
    );
  } finally {
    v20 && ((v20["dataset"]["loading"] = "false"), (v20["disabled"] = false));
  }
}
export async function composeSelectedVideos(v40, v41) {
  return composeSelectedMedia(v40, v41, "video");
}
export async function composeSelectedAudios(v42, v43) {
  return composeSelectedMedia(v42, v43, "audio");
}
