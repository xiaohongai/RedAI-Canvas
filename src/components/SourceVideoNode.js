import appStore from "../core/stores/appStore.js";
import {
  resumeAsyncVideoTask,
  resumeRunningHubVideoTask,
} from "../../api/aiVideoApi.js";
import { ensureConfig, getProviderConfig } from "../../api/configApi.js";
import { fetchVideoMetaFromServer } from "../../api/videoMetaApi.js";
import { fetchVideoFirstFrameThumbFromServer } from "../../api/videoThumbApi.js";
import {
  getModelManifest,
  listModelManifests,
  normalizeProviderId,
  resolveModelExecution,
  RH_VIDEO_MATTING_MODEL_ID,
} from "../manifests/index.js";
import {
  fetchRemoteBlob,
  saveOutputFromUrlToServer,
  saveOutputToServer,
} from "../../api/projectsV2Api.js";
import { resumeRunninghubWorkflowTask } from "../../api/runninghubWorkflowApi.js";
import { uploadFile } from "../modules/project.js";
import { startLoading, stopLoading } from "../modules/loadingOverlay.js";
import VideoKeyingController from "../modules/VideoKeyingController.js";
import { commit } from "../modules/history.js";
import { startNodeResizePreview } from "../modules/interaction/nodeResizePreview.js";
import {
  VIDEO_TOOLBAR_HTML,
  bindVideoToolbarEvents,
} from "./NodeToolbarConfig.js";
import { registerStaticInnerHTML, setStaticInnerHTML } from "../utils/dom.js";
import {
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from "../services/fileService.js";
import {
  buildCanvasLocalVideoFields,
  resolveCanvasVideoUrl,
} from "../services/canvasMediaLocalService.js";
import {
  isTaskTerminal,
  shouldShowGenerationResultLoadingUi,
} from "../core/generationTaskUiState.js";
import { resumeTask } from "../core/generationTaskRuntime.js";
import { extractCurrentVideoFrameToImageNode } from "../modules/videoFrameExtraction.js";
import {
  attachVideoPlaybackRecovery,
  getVideoCurrentSource,
  logVideoPlaybackEvent,
  playVideoWithRecovery,
} from "./video-node/mediaPlaybackRecovery.js";
import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
} from "../services/desktopMediaBlobSource.js";
import {
  localPathToUrl,
  pickResultLocalPath,
  urlToLocalPath,
} from "../utils/localMediaPath.js";
import { buildVideoGenerationFailurePatch } from "./video-node/videoGenerationResultRenderer.js";
const SOURCE_VIDEO_MIN_SIZE = 150,
  SOURCE_VIDEO_POSTER_PRELOAD = "metadata";
function isDesktopRenderer() {
  return !!globalThis["window"]?.["electronAPI"];
}
const getVideoMattingModelId = () =>
    getModelManifest(RH_VIDEO_MATTING_MODEL_ID)?.["extensions"]?.[
      "videoKeying"
    ]?.["modelId"] || RH_VIDEO_MATTING_MODEL_ID,
  RH_VIDEO_STATUS_ALIASES = {
    success: new Set(["success", "succeeded", "completed", "complete", "done"]),
    failed: new Set(["failed", "fail", "error"]),
    cancelled: new Set(["cancelled", "canceled"]),
    pending: new Set(["pending", "queued", "submitted"]),
    running: new Set(["running", "processing", "generating"]),
  };
function buildSourceVideoRecoveryFailurePatch(
  v0,
  {
    error: error = "",
    startedAt: startedAt = 0,
    duration: duration = null,
  } = {},
) {
  const v1 =
      String(error?.["message"] || error || "任务恢复失败")["trim"]() ||
      "任务恢复失败",
    v2 = String(v0?.["outputText"] || "")["trim"](),
    v3 = v2 ? v2 + "\n恢复失败: " + v1 : "恢复失败: " + v1;
  return {
    ...buildVideoGenerationFailurePatch({
      error: v1,
      startedAt: startedAt,
      duration: duration,
      clearMediaFields: false,
    }),
    outputText: v3,
  };
}
function normalizeUploadMediaDimensions(v4, v5) {
  const v6 = Math["round"](Number(v4) || 0),
    v7 = Math["round"](Number(v5) || 0);
  if (v6 <= 0 || v7 <= 0) return null;
  return { width: v6, height: v7 };
}
export function buildSourceVideoUploadSizePatch(...v8) {
  for (const v9 of v8) {
    const v10 = normalizeUploadMediaDimensions(v9?.["width"], v9?.["height"]);
    if (!v10) continue;
    const v11 = getAutoMediaSizeByShortSide(v10["width"], v10["height"]);
    return {
      width: v11["width"],
      height: v11["height"],
      videoWidth: v10["width"],
      videoHeight: v10["height"],
      needsAutoResize: false,
    };
  }
  return { needsAutoResize: true };
}
function readVideoFileNaturalSize(v12) {
  const v13 = globalThis["document"];
  if (!v12 || typeof v13?.["createElement"] !== "function")
    return Promise["resolve"](null);
  const v14 = globalThis["window"]?.["URL"] || globalThis["URL"];
  if (typeof v14?.["createObjectURL"] !== "function")
    return Promise["resolve"](null);
  let v15 = "";
  try {
    v15 = v14["createObjectURL"](v12);
  } catch {
    return Promise["resolve"](null);
  }
  return new Promise((v16) => {
    const v17 = v13["createElement"]("video");
    let v18 = false,
      v19 = null;
    const v20 = (v21) => {
        if (v18) return;
        v18 = true;
        if (v19) clearTimeout(v19);
        (v22(), v16(v21));
      },
      v22 = () => {
        v17["removeAttribute"]?.("src");
        try {
          v17["load"]?.();
        } catch {}
        try {
          v14["revokeObjectURL"](v15);
        } catch {}
      };
    ((v17["preload"] = "metadata"),
      (v17["muted"] = true),
      (v17["onloadedmetadata"] = () => {
        const v23 = normalizeUploadMediaDimensions(
          v17["videoWidth"],
          v17["videoHeight"],
        );
        v20(v23);
      }),
      (v17["onerror"] = () => v20(null)),
      (v19 = setTimeout(() => v20(null), 3000)),
      (v17["src"] = v15));
  });
}
function createVideoCapturePreviewUrl(v24) {
  if (!v24 || !String(v24["type"] || "")["startsWith"]("video/")) return "";
  const v25 = globalThis["window"]?.["URL"] || globalThis["URL"];
  if (typeof v25?.["createObjectURL"] !== "function") return "";
  try {
    return v25["createObjectURL"](v24);
  } catch {
    return "";
  }
}
function asStringArray(v26) {
  return Array["isArray"](v26)
    ? v26["map"]((v27) => String(v27 || "")["trim"]())["filter"](Boolean)
    : [];
}
function createManagedNameRegex(v28, v29, v30) {
  const v31 = String(v28 || "")["trim"]();
  if (!v31) return /^$/;
  try {
    return new RegExp(v31);
  } catch (v32) {
    throw new Error(
      "[source-video] invalid sourceVideoTaskName pattern for " +
        (v29?.["modelId"] || "") +
        "/" +
        (v30 || ""),
    );
  }
}
function getSourceVideoTaskNameConfigs(v33) {
  const v34 = v33?.["extensions"] || {};
  if (Array["isArray"](v34["sourceVideoTaskNameRules"]))
    return v34["sourceVideoTaskNameRules"];
  return v34["sourceVideoTaskName"] ? [v34["sourceVideoTaskName"]] : [];
}
function createSourceVideoTaskNameRule(v35, v36) {
  if (!v35 || !v36) return null;
  const v37 = String(v36["modelId"] || v35["modelId"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v38 = String(v36["key"] || v37 || "sourceVideoTask")["trim"]();
  return {
    key: v38,
    matchModel: v36["matchModel"] !== false,
    models: new Set(v37 ? [v37] : []),
    textNeedles: asStringArray(v36["textNeedles"]),
    managedNameRe: createManagedNameRegex(v36["managedNamePattern"], v35, v38),
    names: { ...(v36["names"] || {}) },
  };
}
function buildSourceVideoTaskNameRules() {
  return listModelManifests()
    ["flatMap"]((v39) =>
      getSourceVideoTaskNameConfigs(v39)["map"]((v40) =>
        createSourceVideoTaskNameRule(v39, v40),
      ),
    )
    ["filter"](Boolean);
}
const RH_VIDEO_TASK_NAME_RULES = buildSourceVideoTaskNameRules();
function normalizeRunningHubVideoStatus(v41) {
  const v42 = String(v41 || "")
    ["trim"]()
    ["toLowerCase"]();
  for (const [v43, v44] of Object["entries"](RH_VIDEO_STATUS_ALIASES)) {
    if (v44["has"](v42)) return v43;
  }
  return v42;
}
function isRunningHubVideoTask(v45) {
  if (!v45 || typeof v45 !== "object") return false;
  const v46 = normalizeProviderId(v45["provider"]);
  if (v46 === "runninghubwf" || v46 === "runninghub") return true;
  const v47 = resolveModelExecution(v45["model"], { providerHint: v46 }),
    v48 = normalizeProviderId(v47?.["modelManifest"]?.["provider"]),
    v49 = normalizeProviderId(v47?.["executionManifest"]?.["provider"]);
  return v48 === "runninghubwf" || v49 === "runninghubwf";
}
function resolveRunningHubVideoTaskNameRule(v50) {
  if (!isRunningHubVideoTask(v50)) return "";
  const v51 = String(v50?.["model"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v52 = String(v50?.["name"] || "")["trim"](),
    v53 = String(v50?.["outputText"] || ""),
    v54 = RH_VIDEO_TASK_NAME_RULES["find"](
      (v55) => v52 && v55["managedNameRe"]["test"](v52),
    );
  if (v54) return v54;
  const v56 = RH_VIDEO_TASK_NAME_RULES["find"]((v57) =>
    v57["textNeedles"]["some"]((v58) => v53["includes"](v58)),
  );
  if (v56) return v56;
  return (
    RH_VIDEO_TASK_NAME_RULES["find"]((v59) => {
      if (v59["matchModel"] !== false && v59["models"]?.["has"](v51))
        return true;
      return false;
    }) || null
  );
}
function resolveRunningHubVideoStatusName(v60, v61) {
  const v62 = resolveRunningHubVideoTaskNameRule(v60);
  if (!v62?.["names"]) return "";
  const v63 = String(v60?.["name"] || "")["trim"]();
  if (!v63 || !v62["managedNameRe"]["test"](v63)) return "";
  return v62["names"][normalizeRunningHubVideoStatus(v61)] || "";
}
function buildChangedPatch(v64, v65) {
  const v66 = {};
  for (const [v67, v68] of Object["entries"](v65 || {})) {
    if (!Object["is"](v64?.[v67], v68)) v66[v67] = v68;
  }
  return v66;
}
function buildRunningHubVideoTerminalStatePatch(v69, v70, v71) {
  if (!isRunningHubVideoTask(v69)) return null;
  const v72 = normalizeRunningHubVideoStatus(v70 || v69?.["rhTaskStatus"]);
  if (!["success", "failed", "cancelled"]["includes"](v72)) return null;
  const v73 = {
    isGenerating: false,
    rhTaskStatus: v72,
    rhTaskRecovering: false,
  };
  if (v72 === "success") v73["jobStatus"] = "success";
  if (v72 === "failed") v73["jobStatus"] = "error";
  if (v72 === "cancelled") v73["jobStatus"] = null;
  typeof v69?.["generationDuration"] !== "number" &&
    (v73["generationDuration"] = v71);
  const v74 = resolveRunningHubVideoStatusName(v69, v72);
  if (v74) v73["name"] = v74;
  const v75 = buildChangedPatch(v69, v73);
  return Object["keys"](v75)["length"] > 0 ? v75 : null;
}
function shouldFetchVideoMetaForNodeInfo() {
  try {
    const v76 =
      typeof appStore["getStateRaw"] === "function"
        ? appStore["getStateRaw"]()
        : appStore["getState"]();
    return v76?.["ui"]?.["showVideoMeta"] === true;
  } catch {
    return false;
  }
}
function normalizeVideoPreviewUrl(v77, { localOnly: localOnly = false } = {}) {
  const v78 = String(v77 || "")["trim"]();
  if (!v78) return "";
  const v79 = localPathToUrl(v78);
  if (v79) return v79;
  return localOnly ? "" : v78;
}
export function resolveSourceVideoPosterSrc(v80 = {}) {
  const v81 = Array["isArray"](v80?.["videos"]) ? v80["videos"] : [],
    v82 = Math["max"](0, Number(v80?.["mainVideoIndex"]) || 0),
    v83 = v81[v82] || v81[0] || null,
    v84 = [
      [v80?.["thumbUrl"], false],
      [v80?.["posterUrl"], false],
      [v80?.["posterLocalPath"], true],
      [v80?.["thumbLocalPath"], true],
      [v83?.["thumbUrl"], false],
      [v83?.["posterUrl"], false],
      [v83?.["posterLocalPath"], true],
      [v83?.["thumbLocalPath"], true],
    ];
  for (const [v85, v86] of v84) {
    const v87 = normalizeVideoPreviewUrl(v85, { localOnly: v86 });
    if (v87) return v87;
  }
  return "";
}
const _SOURCE_VIDEO_NODE_TEMPLATE_ID = "node:source-video";
registerStaticInnerHTML(
  _SOURCE_VIDEO_NODE_TEMPLATE_ID,
  VIDEO_TOOLBAR_HTML +
    "\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22node-card\x20media-card\x20video-card\x22\x20style=\x22width:\x20100%;\x20height:\x20100%;\x20padding:\x200;\x20background:\x20var(--white-05);\x20border:\x201px\x20solid\x20var(--stroke-08);\x20border-radius:\x2018px;\x20overflow:\x20hidden;\x20position:\x20relative;\x20display:\x20flex;\x20align-items:\x20stretch;\x20pointer-events:\x20auto;\x20cursor:\x20var(--link-cursor);\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<video\x20class=\x22video-player\x22\x20src=\x22\x22\x20playsinline\x20preload=\x22none\x22\x20style=\x22width:\x20100%;\x20height:\x20100%;\x20display:\x20block;\x20object-fit:\x20cover;\x20border-radius:\x200;\x20margin:\x200;\x20pointer-events:\x20none;\x22></video>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<img\x20class=\x22source-video-poster-frame\x22\x20alt=\x22\x22\x20draggable=\x22false\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22video-mute-btn\x22\x20title=\x22切换静音\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x2216\x22\x20height=\x2216\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20class=\x22icon-unmuted\x22\x20style=\x22display:none;\x22><polygon\x20points=\x2211\x205\x206\x209\x202\x209\x202\x2015\x206\x2015\x2011\x2019\x2011\x205\x22></polygon><path\x20d=\x22M19.07\x204.93a10\x2010\x200\x200\x201\x200\x2014.14M15.54\x208.46a5\x205\x200\x200\x201\x200\x207.07\x22></path></svg>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x2216\x22\x20height=\x2216\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20class=\x22icon-muted\x22><polygon\x20points=\x2211\x205\x206\x209\x202\x209\x202\x2015\x206\x2015\x2011\x2019\x2011\x205\x22></polygon><line\x20x1=\x2223\x22\x20y1=\x221\x22\x20x2=\x221\x22\x20y2=\x2223\x22></line><line\x20x1=\x2215.54\x22\x20y1=\x228.46\x22\x20x2=\x2219.07\x22\x20y2=\x2212\x22></line></svg>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22video-center-indicator\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22indicator-inner\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22node-upload-hint\x20source-upload-hint\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22upload-btn\x20source-upload-btn\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x2214\x22\x20height=\x2214\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222.5\x22><path\x20d=\x22M21\x2015v4a2\x202\x200\x200\x201-2\x202H5a2\x202\x200\x200\x201-2-2v-4\x22/><polyline\x20points=\x2217\x208\x2012\x203\x207\x208\x22/><line\x20x1=\x2212\x22\x20y1=\x223\x22\x20x2=\x2212\x22\x20y2=\x2215\x22/></svg>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20上传\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22video-controls\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22video-play-btn\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x2216\x22\x20height=\x2216\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22currentColor\x22><polygon\x20points=\x225\x203\x2019\x2012\x205\x2021\x205\x203\x22/></svg>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22video-time-current\x22>0:00</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22media-progress-bar\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22media-progress-fill\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22media-progress-knob\x22></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22video-time-total\x22>0:00</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22video-snap-btn\x22\x20title=\x22截取当前帧\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x2218\x22\x20height=\x2218\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22><path\x20d=\x22M23\x2019a2\x202\x200\x200\x201-2\x202H3a2\x202\x200\x200\x201-2-2V8a2\x202\x200\x200\x201\x202-2h4l2-3h6l2\x203h4a2\x202\x200\x200\x201\x202\x202z\x22></path><circle\x20cx=\x2212\x22\x20cy=\x2213\x22\x20r=\x224\x22></circle></svg>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22node-port\x20out-port\x22></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22node-resizer\x22></div>\x0a\x20\x20\x20\x20\x20\x20</div>",
);
export class SourceVideoNode {
  constructor(v88) {
    ((this["_data"] = v88),
      (this["el"] = document["createElement"]("div")),
      (this["id"] = v88["id"]),
      (this["el"]["className"] = "v2-node-component"),
      (this["_currentSrc"] = null),
      (this["_objUrl"] = null),
      (this["_isMuted"] = true),
      (this["_isManualControl"] = false),
      (this["_isHovered"] = false),
      (this["_hoverManualPause"] = false),
      (this["_isManualLoopPlayback"] = false),
      (this["_autoPlayToken"] = 0),
      (this["_seekToken"] = 0),
      (this["_isSeeking"] = false),
      (this["_clickTimer"] = null),
      (this["_clip"] = null),
      (this["_metaFetchToken"] = 0),
      (this["_thumbFetchToken"] = 0),
      (this["_activeCapturePreviewUrl"] = ""),
      (this["_lastPosterSrc"] = ""),
      (this["_rhResumeAbortController"] = null),
      (this["_rhResumeTaskId"] = ""),
      (this["_rhResumePromise"] = null),
      (this["_asyncResumeAbortController"] = null),
      (this["_asyncResumeTaskId"] = ""),
      (this["_asyncResumePromise"] = null));
  }
  ["mount"]() {
    const v89 = this["el"];
    (setStaticInnerHTML(v89, _SOURCE_VIDEO_NODE_TEMPLATE_ID),
      (this["_card"] = v89["querySelector"](".node-card")),
      (this["_video"] = v89["querySelector"](".video-player")),
      (this["_posterFrame"] = v89["querySelector"](
        ".source-video-poster-frame",
      )),
      (this["_video"]["preload"] = "none"),
      (this["_video"]["muted"] = this["_isMuted"]),
      this["_applyVideoPoster"](this["_data"]),
      this["_attachPlaybackRecovery"](),
      (this["_hint"] = v89["querySelector"](".node-upload-hint")),
      (this["_uploadBtn"] = v89["querySelector"](".upload-btn")),
      (this["_controls"] = v89["querySelector"](".video-controls")),
      (this["_playBtn"] = v89["querySelector"](".video-play-btn")),
      (this["_muteBtn"] = v89["querySelector"](".video-mute-btn")),
      (this["_iconUnmuted"] = v89["querySelector"](".icon-unmuted")),
      (this["_iconMuted"] = v89["querySelector"](".icon-muted")),
      (this["_fill"] = v89["querySelector"](".media-progress-fill")),
      (this["_bar"] = v89["querySelector"](".media-progress-bar")),
      (this["_timeCurrent"] = v89["querySelector"](".video-time-current")),
      (this["_timeTotal"] = v89["querySelector"](".video-time-total")),
      (this["_snapBtn"] = v89["querySelector"](".video-snap-btn")),
      (this["_centerIndicator"] = v89["querySelector"](
        ".video-center-indicator",
      )),
      (this["_indicatorInner"] = v89["querySelector"](".indicator-inner")),
      (this["_centerIndicatorTimer"] = null),
      (this["_resizer"] = v89["querySelector"](".node-resizer")));
    if (
      this["_data"]?.["isGenerating"] &&
      !this["_resolveVideoSrc"](this["_data"])
    ) {
      startLoading(this["_card"], { variant: "full" });
      if (this["_hint"]) this["_hint"]["style"]["display"] = "none";
      if (this["_uploadBtn"]) this["_uploadBtn"]["disabled"] = true;
    }
    (this["_card"]["addEventListener"]("dblclick", (v90) => {
      v90["stopPropagation"]();
      this["_clickTimer"] &&
        (clearTimeout(this["_clickTimer"]), (this["_clickTimer"] = null));
      const v91 =
        getVideoCurrentSource(this["_video"]) ||
        this["_currentSrc"] ||
        this["_resolveVideoSrc"](this["_data"]);
      v91 &&
        ((this["_currentSrc"] = v91),
        void this["_openFullscreenFromCurrentVideo"]());
    }),
      this["_card"]["addEventListener"]("click", (v92) => {
        if (v92["detail"] && v92["detail"] > 1) return;
        if (
          v92["target"]["closest"](".video-controls") ||
          v92["target"]["closest"](".video-mute-btn") ||
          v92["target"]["closest"](".node-upload-hint") ||
          v92["target"]["closest"](".node-floating-toolbar")
        )
          return;
        v92["stopPropagation"]();
        if (this["_clickTimer"]) clearTimeout(this["_clickTimer"]);
        this["_clickTimer"] = setTimeout(() => {
          this["_clickTimer"] = null;
          if (!this["_currentSrc"]) return;
          this["_toggleManualPlayback"]({
            forcePlay: this["_shouldKeepHoverPlaybackOnManualClick"](),
          });
        }, 180);
      }),
      (this["_input"] = document["createElement"]("input")),
      (this["_input"]["type"] = "file"),
      (this["_input"]["accept"] = "video/*"),
      (this["_input"]["style"]["display"] = "none"),
      v89["appendChild"](this["_input"]),
      this["_uploadBtn"]["addEventListener"]("click", (v93) => {
        (v93["stopPropagation"](), this["_input"]["click"]());
      }));
    this["_resizer"] &&
      this["_resizer"]["addEventListener"]("pointerdown", (v94) => {
        const v95 =
            appStore["getStateRaw"]()["ui"]?.["imageVideoNodeResizeEnabled"] ===
            true,
          v96 = document["getElementById"]("v2-wrap")?.["classList"][
            "contains"
          ]("v2-media-node-resize-enabled");
        if (!(v95 && v96)) return;
        startNodeResizePreview({
          event: v94,
          nodeId: this["id"],
          getNode: () =>
            appStore["getStateRaw"]()["nodes"]?.[this["id"]] || this["_data"],
          getViewport: () => appStore["getStateRaw"]()["viewport"],
          resolveSize: ({
            startWidth: v97,
            startHeight: v98,
            dx: v99,
            dy: v100,
          }) => {
            const v101 = v97 / v98,
              v102 = Math["max"](v99 / v97, v100 / v98),
              v103 = Math["max"](
                SOURCE_VIDEO_MIN_SIZE / v97,
                SOURCE_VIDEO_MIN_SIZE / v98,
              ),
              v104 = Math["max"](v103, 1 + v102),
              v105 = Math["max"](
                SOURCE_VIDEO_MIN_SIZE,
                Math["round"](v97 * v104),
              ),
              v106 = Math["max"](
                SOURCE_VIDEO_MIN_SIZE,
                Math["round"](v105 / v101),
              );
            return { width: v105, height: v106 };
          },
          buildFinalPatch: ({ startNode: v107 }) =>
            v107?.["needsAutoResize"] ? { needsAutoResize: false } : {},
          applyPatch: (v108) => appStore["updateNodeData"](this["id"], v108),
          commit: commit,
        });
      });
    (this["_input"]["addEventListener"]("change", async (v109) => {
      const v110 = v109["target"]["files"][0];
      if (!v110) return;
      (startLoading(this["_card"], { variant: "static" }),
        (this["_video"]["style"]["display"] = "none"),
        (this["_controls"]["style"]["opacity"] = "0"));
      const v111 = Array["from"](this["_uploadBtn"]["childNodes"])["map"](
        (v112) => v112["cloneNode"](true),
      );
      ((this["_uploadBtn"]["textContent"] = "上传中..."),
        (this["_uploadBtn"]["style"]["pointerEvents"] = "none"));
      const v113 = this["_currentSrc"],
        v114 = createVideoCapturePreviewUrl(v110);
      v114 &&
        ((this["_data"] = { ...this["_data"], capturePreviewUrl: v114 }),
        this["_loadVideo"](v114));
      try {
        const v115 = window["currentProjectId"] || "default_v2_project",
          v116 = await readVideoFileNaturalSize(v110),
          v117 = await uploadFile(v110, v115),
          v118 = v110["name"]["replace"](/\.[^/.]+$/, "");
        appStore["renameNode"](this["id"], v118);
        const v119 = document["getElementById"](this["id"]),
          v120 = v119?.["__v2_name_el"];
        if (v120) v120["textContent"] = v118;
        const v121 = v117["url"],
          v122 = pickResultLocalPath(v117) || urlToLocalPath(v121),
          v123 = String(v117["videoProxyStatus"] || "")["trim"](),
          v124 = v123 === "processing" && !!v114,
          v125 =
            v123 === "processing"
              ? ""
              : String(v117["displayUrl"] || "")["trim"]() ||
                String(
                  v117["displayLocalPath"]
                    ? "/" + v117["displayLocalPath"]
                    : "",
                )["trim"]() ||
                v121,
          v126 = buildSourceVideoUploadSizePatch(
            {
              width: v117["videoWidth"] || v117["width"],
              height: v117["videoHeight"] || v117["height"],
            },
            v116,
          );
        appStore["updateNodeData"](this["id"], {
          src: v125,
          localPath: v122,
          assetId: v117["assetId"] || "",
          originalLocalPath:
            v117["originalLocalPath"] || v117["localPath"] || "",
          displayLocalPath: v117["displayLocalPath"] || "",
          posterLocalPath: v117["posterLocalPath"] || "",
          thumbLocalPath:
            v117["posterLocalPath"] || v117["thumbLocalPath"] || "",
          thumbUrl: v117["posterUrl"] || v117["thumbUrl"] || "",
          derivativeStatus: v117["derivativeStatus"] || v117["status"] || "",
          mediaTaskId: v117["mediaTaskId"] || "",
          mediaTaskKind: v117["mediaTaskKind"] || "",
          mediaTaskStatus: v117["mediaTaskStatus"] || "",
          mediaTaskProgress: Number(v117["mediaTaskProgress"] || 0) || 0,
          mediaTaskError: v117["mediaTaskError"] || "",
          videoProxyStatus: v123,
          videoCodec: v117["videoCodec"] || "",
          videoDuration: Number(v117["videoDuration"] || 0) || 0,
          videoFps: Number(v117["videoFps"] || 0) || 0,
          fileName: v117["filename"] || v110["name"],
          capturePreviewUrl: v124 ? v114 : "",
          ...v126,
        });
      } catch (v127) {
        (console["error"]("视频上传失败:", v127),
          window["showToast"]("上传失败，请重试"),
          stopLoading(this["_card"]));
        if (v114 && this["_currentSrc"] === v114) {
          this["_releaseActiveCapturePreviewUrl"]();
          if (v113) this["_loadVideo"](v113);
          else ((this["_currentSrc"] = ""), this["_loadVideo"](""));
        }
        this["_currentSrc"] &&
          ((this["_video"]["style"]["display"] = "block"),
          (this["_controls"]["style"]["opacity"] = "1"));
      } finally {
        (this["_uploadBtn"]["replaceChildren"](
          ...v111["map"]((v128) => v128["cloneNode"](true)),
        ),
          (this["_uploadBtn"]["style"]["pointerEvents"] = "auto"),
          (this["_input"]["value"] = ""));
      }
    }),
      this["_muteBtn"]["addEventListener"]("click", (v129) => {
        v129["stopPropagation"]();
        if (VideoKeyingController["isActiveFor"](this["_data"]?.["id"])) return;
        ((this["_isMuted"] = !this["_isMuted"]),
          (this["_video"]["muted"] = this["_isMuted"]),
          this["_isMuted"]
            ? ((this["_iconMuted"]["style"]["display"] = "block"),
              (this["_iconUnmuted"]["style"]["display"] = "none"))
            : ((this["_iconMuted"]["style"]["display"] = "none"),
              (this["_iconUnmuted"]["style"]["display"] = "block")));
      }),
      this["_playBtn"]["addEventListener"]("click", (v130) => {
        v130["stopPropagation"]();
        if (VideoKeyingController["isActiveFor"](this["_data"]?.["id"])) return;
        if (!this["_currentSrc"]) return;
        this["_toggleManualPlayback"]({
          loop: v130["altKey"] === true,
          forcePlay: this["_shouldKeepHoverPlaybackOnManualClick"](),
        });
      }),
      this["_video"]["addEventListener"]("play", () => {
        (this["_syncPosterFrameVisibility"](),
          this["_updatePlayIcon"](false),
          this["_hideCenterIndicator"]());
      }),
      this["_video"]["addEventListener"]("pause", () => {
        (this["_syncPosterFrameVisibility"](),
          this["_updatePlayIcon"](true),
          this["_showPausedCenterIndicator"]());
      }));
    for (const v131 of ["loadeddata", "playing", "timeupdate", "seeked"]) {
      this["_video"]["addEventListener"](v131, () =>
        this["_syncPosterFrameVisibility"](),
      );
    }
    if (this["_bar"]) {
      let v132 = false,
        v133 = 0;
      this["_updateDragVisual"] = (v134) => {
        if (this["_fill"]) this["_fill"]["style"]["width"] = v134 * 100 + "%";
        if (!this["_timeCurrent"]) return;
        const v135 = this["_getBaseDuration"](),
          v136 = this["_getClipRange"](v135),
          v137 = v136["active"]
            ? Math["max"](0, v136["end"] - v136["start"])
            : v135;
        if (v137 && Number["isFinite"](v137))
          this["_timeCurrent"]["textContent"] = this["_fmt"](v134 * v137);
      };
      const v138 = (v139) => {
          const v140 = this["_bar"];
          if (!v140) return 0;
          const v141 = v140["getBoundingClientRect"](),
            v142 = v141["width"] || 0;
          if (!v142) return 0;
          const v143 = v139["clientX"] - v141["left"];
          if (!Number["isFinite"](v143)) return 0;
          return Math["max"](0, Math["min"](1, v143 / v142));
        },
        v144 = (v145) => {
          if (!Number["isFinite"](v145)) return;
          const v146 = this["_getBaseDuration"]();
          if (!v146 || !Number["isFinite"](v146)) return;
          const v147 = this["_getClipRange"](v146),
            v148 = v147["active"]
              ? Math["max"](0, v147["end"] - v147["start"])
              : v146;
          if (!v148 || !Number["isFinite"](v148)) return;
          const v149 = Math["max"](
            0,
            Math["min"](
              v146,
              (v147["active"] ? v147["start"] : 0) + v145 * v148,
            ),
          );
          if (!Number["isFinite"](v149)) return;
          this["_isSeeking"] = true;
          const v150 = ++this["_seekToken"];
          this["_video"]["currentTime"] = v149;
          const v151 = () => {
            if (v150 !== this["_seekToken"]) return;
            this["_isSeeking"] = false;
            const v152 = this["_getBaseDuration"](),
              v153 = this["_getClipRange"](v152),
              v154 = v153["active"]
                ? Math["max"](0, v153["end"] - v153["start"])
                : v152,
              v155 = this["_video"]["currentTime"] || 0;
            if (v154 && Number["isFinite"](v154)) {
              const v156 = v153["active"]
                ? Math["max"](0, Math["min"](v154, v155 - v153["start"]))
                : v155;
              ((this["_fill"]["style"]["width"] = (v156 / v154) * 100 + "%"),
                (this["_timeCurrent"]["textContent"] = this["_fmt"](v156)),
                (this["_timeTotal"]["textContent"] = this["_fmt"](v154)));
            }
          };
          (this["_video"]["addEventListener"]("seeked", v151, { once: true }),
            window["setTimeout"](v151, 300));
        },
        v157 = (v158) => {
          if (!v132) return;
          (v158["stopPropagation"](),
            v158["preventDefault"](),
            (v133 = v138(v158)),
            this["_updateDragVisual"](v133));
        },
        v159 = (v160) => {
          if (!v132) return;
          ((v132 = false),
            (this["_bar"]["dataset"]["dragging"] = "false"),
            window["removeEventListener"]("pointermove", v157, true),
            window["removeEventListener"]("pointerup", v159, true),
            v144(v133));
        };
      this["_bar"]["addEventListener"]("pointerdown", (v161) => {
        (v161["stopPropagation"](), v161["preventDefault"]());
        if (VideoKeyingController["isActiveFor"](this["_data"]?.["id"])) return;
        if (!this["_currentSrc"]) return;
        ((this["_isManualControl"] = true),
          this["_setManualLoopPlayback"](false),
          this["_autoPlayToken"]++,
          (this["_hoverManualPause"] = true),
          this["_video"]["pause"](),
          (v132 = true),
          (this["_bar"]["dataset"]["dragging"] = "true"),
          (v133 = v138(v161)),
          this["_updateDragVisual"](v133),
          v144(v133),
          window["addEventListener"]("pointermove", v157, true),
          window["addEventListener"]("pointerup", v159, true));
      });
    }
    (this["_video"]["addEventListener"]("timeupdate", () => {
      if (
        this["_isSeeking"] ||
        (this["_bar"] && this["_bar"]["dataset"]["dragging"] === "true")
      )
        return;
      const v162 = this["_getBaseDuration"]();
      if (!v162 || !Number["isFinite"](v162)) return;
      const v163 = this["_getClipRange"](v162),
        v164 = v163["active"]
          ? Math["max"](0, v163["end"] - v163["start"])
          : v162;
      if (!v164 || !Number["isFinite"](v164)) return;
      let v165 = this["_video"]["currentTime"] || 0;
      if (v163["active"]) {
        if (v165 < v163["start"])
          ((this["_video"]["currentTime"] = v163["start"]),
            (v165 = v163["start"]));
        else
          v165 > v163["end"] - 0.03 &&
            ((this["_video"]["currentTime"] = v163["start"]),
            (v165 = v163["start"]));
      }
      const v166 = v163["active"]
        ? Math["max"](0, Math["min"](v164, v165 - v163["start"]))
        : v165;
      ((this["_fill"]["style"]["width"] = (v166 / v164) * 100 + "%"),
        (this["_timeCurrent"]["textContent"] = this["_fmt"](v166)),
        (this["_timeTotal"]["textContent"] = this["_fmt"](v164)));
    }),
      this["_snapBtn"]["addEventListener"]("click", (v167) => {
        v167["stopPropagation"]();
        if (VideoKeyingController["isActiveFor"](this["_data"]?.["id"])) return;
        void this["_captureFrame"]();
      }),
      this["_video"]["addEventListener"]("loadedmetadata", () => {
        this["_syncVideoDurationUi"]();
        const v168 = this["_video"]["videoWidth"] || 0,
          v169 = this["_video"]["videoHeight"] || 0;
        if (v168 > 0 && v169 > 0) {
          const v170 = appStore["getState"]()["nodes"][this["id"]];
          if (v170) {
            const v171 = {};
            if (Number(v170["videoWidth"] || 0) !== v168)
              v171["videoWidth"] = v168;
            if (Number(v170["videoHeight"] || 0) !== v169)
              v171["videoHeight"] = v169;
            if (Object["keys"](v171)["length"])
              appStore["updateNodeData"](this["id"], v171);
          }
        }
        if (this["_data"]["fixedSize"]) return;
        if (!this["_data"]["needsAutoResize"]) return;
        const { width: v172, height: v173 } = getAutoMediaSizeByShortSide(
          v168 || 1000,
          v169 || 1000,
        );
        appStore["updateNodeData"](this["id"], {
          width: v172,
          height: v173,
          needsAutoResize: false,
        });
      }),
      v89["addEventListener"]("mouseenter", () => {
        const v174 = appStore["getState"]()["videoClip"];
        if (v174 && v174["active"] && v174["nodeId"] === this["_data"]?.["id"])
          return;
        if (this["_currentSrc"]) {
          this["_isHovered"] = true;
          if (VideoKeyingController["isActiveFor"](this["_data"]?.["id"])) {
            this["_video"]["pause"]();
            return;
          }
          if (this["_hoverManualPause"]) return;
          if (this["_isManualLoopPlayback"]) return;
          const v175 = this["_getBaseDuration"](),
            v176 = this["_getClipRange"](v175);
          this["_video"]["loop"] = v176["active"] ? false : true;
          if (v176["active"]) {
            const v177 = this["_video"]["currentTime"] || 0;
            if (v177 < v176["start"] || v177 > v176["end"])
              this["_video"]["currentTime"] = v176["start"];
          }
          const v178 = ++this["_autoPlayToken"];
          (logVideoPlaybackEvent(this["_video"], "hover-enter", {
            label: this["_getPlaybackLabel"]("hover"),
          }),
            void this["_playVideoWithRecovery"](
              "hover",
              () =>
                this["_autoPlayToken"] === v178 && !this["_hoverManualPause"],
            ));
        }
      }),
      v89["addEventListener"]("mouseleave", () => {
        const v179 = appStore["getState"]()["videoClip"];
        if (v179 && v179["active"] && v179["nodeId"] === this["_data"]?.["id"])
          return;
        if (this["_currentSrc"]) {
          const v180 = this["_isManualControl"];
          ((this["_isHovered"] = false), this["_autoPlayToken"]++);
          !this["_isManualLoopPlayback"] && (this["_video"]["loop"] = false);
          logVideoPlaybackEvent(this["_video"], "hover-leave", {
            label: this["_getPlaybackLabel"]("hover"),
          });
          !v180 && this["_video"]["pause"]();
          this["_hoverManualPause"] = false;
          if (!this["_isManualLoopPlayback"]) this["_isManualControl"] = false;
        }
      }),
      this["_controls"]["addEventListener"]("pointerdown", (v181) =>
        v181["stopPropagation"](),
      ),
      this["_muteBtn"]["addEventListener"]("pointerdown", (v182) =>
        v182["stopPropagation"](),
      ));
    const v183 = this["_resolveVideoSrc"](this["_data"]);
    if (v183) this["_loadVideo"](v183);
    else this["_loadVideo"]("");
    (this["_clearResolvedVideoTimer"](this["_data"], v183),
      this["_maybeFetchVideoMeta"](this["_data"]),
      this["_syncRunningHubVideoTaskState"](this["_data"]),
      this["_maybeResumeRunningHubTask"](),
      this["_maybeResumeAsyncTask"]());
    const v184 = v89["querySelector"](".node-floating-toolbar");
    return (bindVideoToolbarEvents(v184, this["_data"]), v89);
  }
  ["_applyVideoPoster"](v185 = this["_data"]) {
    if (!this["_video"]) return "";
    const v186 = resolveSourceVideoPosterSrc(v185);
    if (v186) {
      if (this["_video"]["poster"] !== v186) this["_video"]["poster"] = v186;
      this["_posterFrame"] &&
        this["_posterFrame"]["getAttribute"]?.("src") !== v186 &&
        (this["_posterFrame"]["src"] = v186);
    } else {
      if (this["_video"]["poster"]) {
        this["_video"]["removeAttribute"]?.("poster");
        if (this["_posterFrame"])
          this["_posterFrame"]["removeAttribute"]?.("src");
      }
    }
    return (
      (this["_lastPosterSrc"] = v186),
      this["_syncPosterFrameVisibility"]({ force: !!v186 }),
      v186
    );
  }
  ["_setPosterFrameVisible"](v187) {
    if (!this["_posterFrame"]) return;
    this["_posterFrame"]["classList"]?.["toggle"]("is-visible", !!v187);
  }
  ["_syncPosterFrameVisibility"](v188 = {}) {
    if (!this["_posterFrame"]) return;
    const v189 = String(this["_lastPosterSrc"] || "")["trim"]();
    if (!v189) {
      this["_setPosterFrameVisible"](false);
      return;
    }
    if (Object["prototype"]["hasOwnProperty"]["call"](v188, "force")) {
      this["_setPosterFrameVisible"](!!v188["force"]);
      return;
    }
    const v190 = Number(this["_video"]?.["currentTime"] || 0),
      v191 = Number(this["_video"]?.["readyState"] || 0);
    this["_setPosterFrameVisible"](v191 < 2 || !(v190 > 0.05));
  }
  ["_clearVideoElementSource"]() {
    if (!this["_video"]) return;
    (clearDesktopMediaPlaybackSourceMetadata(this["_video"]),
      this["_video"]["removeAttribute"]?.("src"));
    try {
      this["_video"]["load"]?.();
    } catch {}
  }
  ["_resolveVideoSrc"](v192) {
    return resolveCanvasVideoUrl(v192) || this["_getCapturePreviewUrl"](v192);
  }
  ["_clearResolvedVideoTimer"](v193, v194) {
    if (!v194 || !v193 || typeof v193 !== "object") return;
    const v195 =
      !!String(
        v193["rhTaskId"] ||
          v193["asyncTaskId"] ||
          v193["dreaminaSubmitId"] ||
          "",
      )["trim"]() ||
      v193["rhTaskRecovering"] === true ||
      v193["asyncTaskRecovering"] === true ||
      v193["dreaminaTaskRecovering"] === true;
    if (v195) return;
    if (!v193["generationStartTime"] && v193["generationDuration"] == null)
      return;
    const v196 = appStore["getState"]()["nodes"]?.[this["id"]];
    if (!v196) return;
    const v197 = {};
    if (v196["generationStartTime"]) v197["generationStartTime"] = null;
    if (v196["generationDuration"] != null) v197["generationDuration"] = null;
    if (v196["isGenerating"] === true) v197["isGenerating"] = false;
    Object["keys"](v197)["length"] > 0 &&
      appStore["updateNodeData"](this["id"], v197);
  }
  ["_clearMediaUnavailableAfterPlayback"](v198) {
    const v199 =
      appStore["getState"]()["nodes"]?.[this["id"]] || this["_data"] || null;
    if (!v199 || v199["mediaUnavailable"] !== true) return;
    const v200 = String(v199["mediaUnavailableSource"] || "")["trim"]();
    if (!v200) return;
    const v201 = new Set(),
      v202 = (v203) => {
        const v204 = String(v203 || "")["trim"]();
        if (!v204) return;
        v201["add"](v204);
        const v205 = urlToLocalPath(v204);
        if (v205) v201["add"](v205);
        const v206 = localPathToUrl(v204);
        if (v206) v201["add"](v206);
      };
    [
      v199["localPath"],
      v199["displayLocalPath"],
      v199["originalLocalPath"],
      v199["videoLocalPath"],
      v199["videoUrl"],
      v199["src"],
      v199["url"],
      v199["resultUrl"],
      v199["sourceUrl"],
      v198,
    ]["forEach"](v202);
    if (!v201["has"](v200)) return;
    appStore["updateNodeData"](this["id"], {
      mediaUnavailable: false,
      mediaUnavailableSource: "",
    });
  }
  ["_getCapturePreviewUrl"](v207 = this["_data"]) {
    const v208 = String(v207?.["capturePreviewUrl"] || "")["trim"]();
    return v208["startsWith"]("blob:") ||
      v208["startsWith"]("aic-local-preview:")
      ? v208
      : "";
  }
  ["_revokeCapturePreviewUrl"](v209) {
    const v210 = String(v209 || "")["trim"]();
    if (!v210["startsWith"]("blob:")) return;
    const v211 = globalThis["window"]?.["URL"] || globalThis["URL"];
    if (typeof v211?.["revokeObjectURL"] !== "function") return;
    try {
      v211["revokeObjectURL"](v210);
    } catch {}
  }
  ["_adoptCapturePreviewUrl"](v212) {
    const v213 = String(v212 || "")["trim"]();
    (this["_activeCapturePreviewUrl"] &&
      this["_activeCapturePreviewUrl"] !== v213 &&
      this["_revokeCapturePreviewUrl"](this["_activeCapturePreviewUrl"]),
      (this["_activeCapturePreviewUrl"] = v213));
  }
  ["_releaseActiveCapturePreviewUrl"]() {
    if (!this["_activeCapturePreviewUrl"]) return;
    const v214 = this["_activeCapturePreviewUrl"];
    ((this["_activeCapturePreviewUrl"] = ""),
      this["_revokeCapturePreviewUrl"](v214));
  }
  ["_resolveVideoMetaSrc"](v215) {
    if (!v215) return "";
    const v216 = this["_resolveVideoSrc"](v215);
    if (!v216) return "";
    const v217 = String(v216);
    if (
      v217["startsWith"]("http://") ||
      v217["startsWith"]("https://") ||
      v217["startsWith"]("blob:") ||
      v217["startsWith"]("data:")
    )
      return "";
    return v217;
  }
  async ["_maybeFetchVideoMeta"](v218) {
    if (!shouldFetchVideoMetaForNodeInfo()) return;
    const v219 = this["_resolveVideoMetaSrc"](v218);
    if (!v219) return;
    const v220 = appStore["getState"]()["nodes"][this["id"]];
    if (!v220) return;
    const v221 = String(v220["videoMetaSrc"] || ""),
      v222 =
        Number["isFinite"](Number(v220["videoFps"])) &&
        Number(v220["videoFps"]) > 0 &&
        Number["isFinite"](Number(v220["videoFrameCount"])) &&
        Number(v220["videoFrameCount"]) > 0;
    if (v222 && v221 === v219) return;
    v221 &&
      v221 !== v219 &&
      appStore["updateNodeData"](this["id"], {
        videoMetaSrc: v219,
        videoFps: null,
        videoFrameCount: null,
        videoDuration: null,
        videoWidth: null,
        videoHeight: null,
      });
    const v223 = ++this["_metaFetchToken"];
    try {
      const v224 = await fetchVideoMetaFromServer(v219);
      if (v223 !== this["_metaFetchToken"]) return;
      if (!v224 || v224["success"] !== true) return;
      const v225 = Number(v224["fps"]),
        v226 = Number(v224["frameCount"]),
        v227 = Number(v224["duration"]),
        v228 = Number(v224["width"]),
        v229 = Number(v224["height"]),
        v230 = { videoMetaSrc: v219 };
      if (Number["isFinite"](v225) && v225 > 0) v230["videoFps"] = v225;
      if (Number["isFinite"](v226) && v226 > 0)
        v230["videoFrameCount"] = Math["round"](v226);
      if (Number["isFinite"](v227) && v227 > 0) v230["videoDuration"] = v227;
      if (Number["isFinite"](v228) && v228 > 0)
        v230["videoWidth"] = Math["round"](v228);
      if (Number["isFinite"](v229) && v229 > 0)
        v230["videoHeight"] = Math["round"](v229);
      const v231 = appStore["getState"]()["nodes"][this["id"]];
      if (!v231) return;
      const v232 =
        String(v231["videoMetaSrc"] || "") !==
          String(v230["videoMetaSrc"] || "") ||
        Number(v231["videoFps"] || 0) !== Number(v230["videoFps"] || 0) ||
        Number(v231["videoFrameCount"] || 0) !==
          Number(v230["videoFrameCount"] || 0) ||
        Number(v231["videoDuration"] || 0) !==
          Number(v230["videoDuration"] || 0) ||
        Number(v231["videoWidth"] || 0) !== Number(v230["videoWidth"] || 0) ||
        Number(v231["videoHeight"] || 0) !== Number(v230["videoHeight"] || 0);
      if (v232) appStore["updateNodeData"](this["id"], v230);
    } catch {}
  }
  async ["_maybeEnsureVideoThumb"](v233) {
    const v234 = this["_resolveVideoMetaSrc"](v233);
    if (!v234) return;
    const v235 = appStore["getState"]()["nodes"][this["id"]];
    if (!v235) return;
    const v236 = String(v235["videoThumbSrc"] || ""),
      v237 = !!String(v235["thumbUrl"] || "")["trim"]();
    if (v237 && v236 === v234) return;
    if (
      v236 === v234 &&
      ["waiting", "processing"]["includes"](
        String(v235["mediaTaskStatus"] || ""),
      ) &&
      ["videoFirstFrame", "videoPoster"]["includes"](
        String(v235["mediaTaskKind"] || ""),
      )
    )
      return;
    if (v236 && v236 !== v234)
      appStore["updateNodeData"](this["id"], {
        videoThumbSrc: v234,
        thumbUrl: null,
      });
    else
      !v236 && appStore["updateNodeData"](this["id"], { videoThumbSrc: v234 });
    const v238 = ++this["_thumbFetchToken"];
    try {
      const v239 = await fetchVideoFirstFrameThumbFromServer(v234, {
        nodeId: this["id"],
        assetId: String(v235["assetId"] || ""),
      });
      if (v238 !== this["_thumbFetchToken"]) return;
      if (!v239 || v239["success"] === false) return;
      const v240 = String(v239["thumbUrl"] || v239["url"] || "")["trim"]();
      if (!v240) return;
      const v241 = appStore["getState"]()["nodes"][this["id"]];
      if (!v241) return;
      const v242 =
        String(v241["videoThumbSrc"] || "") !== String(v234 || "") ||
        String(v241["thumbUrl"] || "") !== v240;
      v242 &&
        appStore["updateNodeData"](this["id"], {
          videoThumbSrc: v234,
          thumbUrl: v240,
        });
    } catch {}
  }
  ["_getBaseDuration"]() {
    const v243 = this["_video"];
    if (!v243) return 0;
    const v244 = Number(v243["duration"]);
    if (Number["isFinite"](v244) && v244 > 0) return v244;
    const v245 = v243["seekable"];
    if (v245 && v245["length"]) {
      const v246 = Number(v245["end"](v245["length"] - 1));
      if (Number["isFinite"](v246) && v246 > 0) return v246;
    }
    return 0;
  }
  ["_getClipRange"](v247) {
    const v248 = Number(v247);
    if (!Number["isFinite"](v248) || v248 <= 0)
      return { active: false, start: 0, end: 0 };
    const v249 = Number(this["_data"]?.["clipStart"]),
      v250 = Number(this["_data"]?.["clipEnd"]);
    if (
      !Number["isFinite"](v249) ||
      !Number["isFinite"](v250) ||
      !(v250 > v249)
    )
      return { active: false, start: 0, end: v248 };
    const v251 = Math["max"](0, Math["min"](v248, v249)),
      v252 = Math["max"](0, Math["min"](v248, v250));
    if (!(v252 > v251)) return { active: false, start: 0, end: v248 };
    return { active: true, start: v251, end: v252 };
  }
  ["_setManualLoopPlayback"](v253) {
    this["_isManualLoopPlayback"] = v253 === true;
    if (!this["_video"]) return;
    if (!this["_isManualLoopPlayback"]) {
      this["_video"]["loop"] = false;
      return;
    }
    const v254 = this["_getClipRange"](this["_getBaseDuration"]());
    this["_video"]["loop"] = !v254["active"];
  }
  ["_shouldKeepHoverPlaybackOnManualClick"]() {
    if (!this["_video"]) return false;
    if (
      !this["_isHovered"] ||
      this["_isManualControl"] ||
      this["_hoverManualPause"]
    )
      return false;
    if (this["_video"]["paused"]) return false;
    const v255 = Number(this["_video"]["currentTime"] || 0);
    return !(v255 > 0.05);
  }
  ["_toggleManualPlayback"]({
    loop: loop = false,
    forcePlay: forcePlay = false,
  } = {}) {
    if (!this["_video"] || !this["_currentSrc"]) return;
    ((this["_isManualControl"] = true), this["_autoPlayToken"]++);
    if (this["_video"]["paused"] || forcePlay === true) {
      ((this["_hoverManualPause"] = false),
        this["_setManualLoopPlayback"](loop === true));
      const v256 = this["_getBaseDuration"](),
        v257 = this["_getClipRange"](v256);
      if (v257["active"]) {
        const v258 = this["_video"]["currentTime"] || 0;
        if (v258 < v257["start"] || v258 > v257["end"])
          this["_video"]["currentTime"] = v257["start"];
      }
      void this["_playVideoWithRecovery"](
        "manual",
        () => this["_isManualControl"],
      )["then"]((v259) => {
        v259
          ? this["_flashCenterIndicator"]("play")
          : this["_setManualLoopPlayback"](false);
      });
    } else
      ((this["_hoverManualPause"] = true),
        this["_setManualLoopPlayback"](false),
        this["_video"]["pause"](),
        this["_flashCenterIndicator"]("pause"));
  }
  ["_getPlaybackLabel"](v260 = "preview") {
    return "source-video:" + this["id"] + ":" + v260;
  }
  async ["_openFullscreenFromCurrentVideo"]() {
    const v261 = this["_video"];
    if (!v261) return;
    const v262 = getVideoCurrentSource(v261) || this["_currentSrc"];
    if (!v262) return;
    !getVideoCurrentSource(v261) &&
      (await attachMediaElementPlaybackSource(v261, v262, {
        preload: "auto",
        warmRanges: false,
        load: false,
      }));
    const v263 = document["createElement"]("div");
    Object["assign"](v263["style"], {
      position: "fixed",
      inset: "0",
      background: "var(--overlay-dim)",
      zIndex: "99999",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "zoom-out",
    });
    const v264 = v261["parentNode"],
      v265 = v261["nextSibling"],
      v266 = this["_isManualControl"],
      v267 = this["_hoverManualPause"],
      v268 = {
        controls: v261["controls"],
        loop: v261["loop"],
        muted: v261["muted"],
        position: v261["style"]["position"],
        inset: v261["style"]["inset"],
        width: v261["style"]["width"],
        height: v261["style"]["height"],
        maxWidth: v261["style"]["maxWidth"],
        maxHeight: v261["style"]["maxHeight"],
        objectFit: v261["style"]["objectFit"],
        borderRadius: v261["style"]["borderRadius"],
        margin: v261["style"]["margin"],
        pointerEvents: v261["style"]["pointerEvents"],
        boxShadow: v261["style"]["boxShadow"],
      };
    ((this["_isManualControl"] = true),
      (this["_hoverManualPause"] = false),
      (v261["controls"] = true),
      (v261["loop"] = true),
      (v261["muted"] = !!this["_isMuted"]),
      Object["assign"](v261["style"], {
        position: "static",
        inset: "",
        width: "auto",
        height: "auto",
        maxWidth: "90%",
        maxHeight: "90%",
        objectFit: "contain",
        borderRadius: "8px",
        margin: "0",
        pointerEvents: "auto",
        boxShadow: "0 0 50px var(--black-80)",
      }),
      attachVideoPlaybackRecovery(v261, {
        label: this["_getPlaybackLabel"]("fullscreen"),
        minBufferAhead: 0.5,
        readyTimeoutMs: 350,
        recoveryDebounceMs: 150,
        recoveryCooldownMs: 500,
        shouldRecover: () => v261["isConnected"] !== false && !v261["paused"],
      }));
    let v269 = false;
    const v270 = () => {
      if (v269) return;
      v269 = true;
      try {
        v261["pause"]();
      } catch {}
      ((v261["controls"] = v268["controls"]),
        (v261["loop"] = v268["loop"]),
        (v261["muted"] = v268["muted"]),
        Object["assign"](v261["style"], {
          position: v268["position"],
          inset: v268["inset"],
          width: v268["width"],
          height: v268["height"],
          maxWidth: v268["maxWidth"],
          maxHeight: v268["maxHeight"],
          objectFit: v268["objectFit"],
          borderRadius: v268["borderRadius"],
          margin: v268["margin"],
          pointerEvents: v268["pointerEvents"],
          boxShadow: v268["boxShadow"],
        }));
      if (v264) v264["insertBefore"](v261, v265);
      (v263["remove"](),
        (this["_isManualControl"] = v266),
        (this["_hoverManualPause"] = v267),
        this["_attachPlaybackRecovery"]());
    };
    (v263["addEventListener"]("click", (v271) => {
      if (v271["target"] === v263) v270();
    }),
      v263["appendChild"](v261),
      document["body"]["appendChild"](v263),
      void playVideoWithRecovery(v261, {
        label: this["_getPlaybackLabel"]("fullscreen"),
        minBufferAhead: 0.5,
        readyTimeoutMs: 350,
        recoveryDebounceMs: 150,
        recoveryCooldownMs: 500,
        shouldRecover: () => v261["isConnected"] !== false && !v261["paused"],
      }));
  }
  async ["_ensurePlaybackVideoSrc"]({ forPlayback: forPlayback = false } = {}) {
    if (!this["_video"]) return false;
    if (getVideoCurrentSource(this["_video"]))
      return (
        forPlayback &&
          this["_video"]["preload"] !== "auto" &&
          (this["_video"]["preload"] = "auto"),
        true
      );
    const v272 = String(
      this["_currentSrc"] || this["_resolveVideoSrc"](this["_data"]) || "",
    )["trim"]();
    if (!v272) return false;
    this["_currentSrc"] = v272;
    if (!this["_video"] || this["_currentSrc"] !== v272) return false;
    return (
      await attachMediaElementPlaybackSource(this["_video"], v272, {
        preload: forPlayback ? "auto" : SOURCE_VIDEO_POSTER_PRELOAD,
        warmRanges: false,
        load: !forPlayback && !isDesktopRenderer(),
      }),
      true
    );
  }
  ["_attachPlaybackRecovery"](v273 = "preview") {
    if (!this["_video"]) return null;
    const v274 = v273 === "hover" || v273 === "fullscreen";
    return attachVideoPlaybackRecovery(this["_video"], {
      label: this["_getPlaybackLabel"](v273),
      ensureSrc: () => this["_ensurePlaybackVideoSrc"]({ forPlayback: true }),
      minBufferAhead: v274 ? 0.5 : undefined,
      readyTimeoutMs: v274 ? 350 : undefined,
      recoveryDebounceMs: v274 ? 150 : undefined,
      recoveryCooldownMs: v274 ? 500 : undefined,
      shouldRecover: () =>
        this["_video"]?.["isConnected"] !== false &&
        (this["_isHovered"] ||
          this["_isManualControl"] ||
          !this["_video"]?.["paused"]),
    });
  }
  async ["_playVideoWithRecovery"](v275, v276) {
    if (!this["_video"]) return false;
    return (
      this["_attachPlaybackRecovery"](v275),
      playVideoWithRecovery(this["_video"], {
        label: this["_getPlaybackLabel"](v275),
        ensureSrc: () => this["_ensurePlaybackVideoSrc"]({ forPlayback: true }),
        minBufferAhead: v275 === "hover" ? 0.5 : undefined,
        readyTimeoutMs: v275 === "hover" ? 350 : undefined,
        recoveryDebounceMs: v275 === "hover" ? 150 : undefined,
        recoveryCooldownMs: v275 === "hover" ? 500 : undefined,
        shouldRecover: () =>
          this["_video"]?.["isConnected"] !== false &&
          (this["_isHovered"] ||
            this["_isManualControl"] ||
            !this["_video"]?.["paused"]),
        shouldContinue: v276,
      })
    );
  }
  ["_loadVideo"](v277) {
    this["_setManualLoopPlayback"](false);
    const v278 = this["_applyVideoPoster"](this["_data"]);
    if (!v277) {
      ((this["_loadVideoToken"] = null),
        this["_releaseActiveCapturePreviewUrl"](),
        (this["_video"]["onloadeddata"] = null),
        (this["_video"]["onerror"] = null),
        (this["_video"]["preload"] = "none"),
        this["_clearVideoElementSource"](),
        this["_setPosterFrameVisible"](false));
      this["_data"]?.["isGenerating"] &&
        startLoading(this["_card"], { variant: "full" });
      !this["_data"]?.["isGenerating"] && stopLoading(this["_card"]);
      this["_video"]["style"]["display"] = "none";
      if (this["_hint"])
        this["_hint"]["style"]["display"] = this["_data"]?.["isGenerating"]
          ? "none"
          : "block";
      ((this["_controls"]["style"]["opacity"] = "0"),
        (this["_muteBtn"]["style"]["display"] = "none"));
      if (this["_centerIndicator"])
        this["_centerIndicator"]["style"]["display"] = "none";
      if (this["_uploadBtn"])
        this["_uploadBtn"]["disabled"] = !!this["_data"]?.["isGenerating"];
      return;
    }
    const v279 = this["_getCapturePreviewUrl"](this["_data"]);
    if (v277 === v279) this["_adoptCapturePreviewUrl"](v277);
    else
      this["_activeCapturePreviewUrl"] &&
        this["_releaseActiveCapturePreviewUrl"]();
    this["_currentSrc"] = v277;
    if (v278) {
      ((this["_loadVideoToken"] = null),
        (this["_video"]["onloadeddata"] = null),
        (this["_video"]["onerror"] = null));
      getVideoCurrentSource(this["_video"]) &&
        this["_clearVideoElementSource"]();
      ((this["_video"]["preload"] = "none"),
        this["_syncVideoDurationUi"](),
        stopLoading(this["_card"]),
        (this["_video"]["style"]["display"] = "block"),
        this["_syncPosterFrameVisibility"]({ force: true }),
        (this["_controls"]["style"]["opacity"] = "1"),
        (this["_muteBtn"]["style"]["display"] = "flex"));
      this["_centerIndicator"] &&
        ((this["_centerIndicator"]["style"]["display"] = "flex"),
        this["_showPausedCenterIndicator"]());
      if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
      return;
    }
    let v280 = false;
    const v281 = () => {
      if (v280 || this["_currentSrc"] !== v277) return;
      ((v280 = true),
        stopLoading(this["_card"]),
        this["_clearMediaUnavailableAfterPlayback"](v277));
      this["_activeCapturePreviewUrl"] &&
        this["_activeCapturePreviewUrl"] !== v277 &&
        this["_releaseActiveCapturePreviewUrl"]();
      ((this["_controls"]["style"]["opacity"] = "1"),
        (this["_muteBtn"]["style"]["display"] = "flex"));
      this["_centerIndicator"] &&
        ((this["_centerIndicator"]["style"]["display"] = "flex"),
        this["_video"]["paused"]
          ? this["_showPausedCenterIndicator"]()
          : this["_hideCenterIndicator"]());
      if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
      this["_maybeEnsureVideoThumb"](this["_data"]);
    };
    ((this["_video"]["onloadeddata"] = v281),
      (this["_video"]["onerror"] = () => {
        if (this["_currentSrc"] === v277) stopLoading(this["_card"]);
      }));
    if (isDesktopRenderer()) {
      this["_loadVideoToken"] = null;
      getVideoCurrentSource(this["_video"]) &&
        this["_clearVideoElementSource"]();
      ((this["_video"]["preload"] = "none"),
        (this["_video"]["style"]["display"] = "block"),
        this["_setPosterFrameVisible"](false),
        (this["_controls"]["style"]["opacity"] = "1"),
        (this["_muteBtn"]["style"]["display"] = "flex"));
      this["_centerIndicator"] &&
        ((this["_centerIndicator"]["style"]["display"] = "flex"),
        this["_showPausedCenterIndicator"]());
      if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
      (stopLoading(this["_card"]),
        void this["_maybeEnsureVideoThumb"](this["_data"]),
        this["_attachPlaybackRecovery"]());
      return;
    }
    (startLoading(this["_card"], { variant: "static" }),
      (this["_video"]["style"]["display"] = "block"),
      this["_setPosterFrameVisible"](false),
      (this["_controls"]["style"]["opacity"] = "0"),
      (this["_muteBtn"]["style"]["display"] = "none"));
    if (this["_centerIndicator"])
      this["_centerIndicator"]["style"]["display"] = "none";
    const v282 = {};
    this["_loadVideoToken"] = v282;
    const v283 = () => {
      if (
        !this["_video"] ||
        this["_loadVideoToken"] !== v282 ||
        this["_currentSrc"] !== v277
      )
        return;
      ((this["_video"]["preload"] = "auto"), (this["_video"]["src"] = v277));
      try {
        this["_video"]["load"]?.();
      } catch {}
      if (Number(this["_video"]["readyState"] || 0) >= 2) v281();
    };
    (v283(), this["_attachPlaybackRecovery"]());
    if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
  }
  ["_fmt"](v284) {
    if (!v284 || isNaN(v284)) return "0:00";
    return (
      Math["floor"](v284 / 60) +
      ":" +
      String(Math["floor"](v284 % 60))["padStart"](2, "0")
    );
  }
  ["_getNodeDuration"](v285 = this["_data"]) {
    const v286 = Number(v285?.["videoDuration"] || v285?.["duration"] || 0);
    if (Number["isFinite"](v286) && v286 > 0) return v286;
    const v287 = Number(v285?.["videoFrameCount"] || v285?.["frameCount"] || 0),
      v288 = Number(v285?.["videoFps"] || v285?.["fps"] || 0);
    if (
      Number["isFinite"](v287) &&
      v287 > 0 &&
      Number["isFinite"](v288) &&
      v288 > 0
    )
      return v287 / v288;
    return 0;
  }
  ["_syncVideoDurationUi"]() {
    if (!this["_timeTotal"]) return;
    const v289 =
      this["_getBaseDuration"]() || this["_getNodeDuration"](this["_data"]);
    if (!v289 || !Number["isFinite"](v289)) return;
    const v290 = this["_getClipRange"](v289),
      v291 = v290["active"]
        ? Math["max"](0, v290["end"] - v290["start"])
        : v289;
    if (!v291 || !Number["isFinite"](v291)) return;
    this["_timeTotal"]["textContent"] = this["_fmt"](v291);
  }
  ["_setCenterIndicatorIcon"](v292) {
    if (!this["_indicatorInner"]) return;
    const v293 = document["createElementNS"](
      "http://www.w3.org/2000/svg",
      "svg",
    );
    (v293["setAttribute"]("width", "28"),
      v293["setAttribute"]("height", "28"),
      v293["setAttribute"]("viewBox", "0\x200\x2024\x2024"),
      v293["setAttribute"]("fill", "currentColor"),
      (v293["style"]["color"] = "var(--canvas-white)"),
      v292 === "play"
        ? (v293["innerHTML"] =
            '<polygon points="6 4 20 12 6 20 6 4"></polygon>')
        : (v293["innerHTML"] =
            "<rect\x20x=\x226\x22\x20y=\x225\x22\x20width=\x224\x22\x20height=\x2214\x22\x20rx=\x221\x22></rect><rect\x20x=\x2214\x22\x20y=\x225\x22\x20width=\x224\x22\x20height=\x2214\x22\x20rx=\x221\x22></rect>"),
      (this["_indicatorInner"]["innerHTML"] = ""),
      this["_indicatorInner"]["appendChild"](v293));
  }
  ["_showPausedCenterIndicator"]() {
    if (!this["_indicatorInner"]) return;
    (this["_centerIndicatorTimer"] &&
      (clearTimeout(this["_centerIndicatorTimer"]),
      (this["_centerIndicatorTimer"] = null)),
      this["_setCenterIndicatorIcon"]("play"),
      (this["_indicatorInner"]["style"]["opacity"] = "1"),
      (this["_indicatorInner"]["style"]["transform"] = "scale(1)"));
  }
  ["_hideCenterIndicator"]() {
    if (!this["_indicatorInner"]) return;
    (this["_centerIndicatorTimer"] &&
      (clearTimeout(this["_centerIndicatorTimer"]),
      (this["_centerIndicatorTimer"] = null)),
      (this["_indicatorInner"]["style"]["opacity"] = "0"),
      (this["_indicatorInner"]["style"]["transform"] = "scale(0.92)"));
  }
  ["_flashCenterIndicator"](v294) {
    if (!this["_indicatorInner"]) return;
    (this["_centerIndicatorTimer"] &&
      (clearTimeout(this["_centerIndicatorTimer"]),
      (this["_centerIndicatorTimer"] = null)),
      this["_setCenterIndicatorIcon"](v294),
      (this["_indicatorInner"]["style"]["opacity"] = "1"),
      (this["_indicatorInner"]["style"]["transform"] = "scale(1)"),
      (this["_centerIndicatorTimer"] = setTimeout(() => {
        if (!this["_indicatorInner"]) return;
        if (v294 === "pause") this["_showPausedCenterIndicator"]();
        else this["_hideCenterIndicator"]();
        this["_centerIndicatorTimer"] = null;
      }, 520)));
  }
  ["_updatePlayIcon"](v295) {
    if (!this["_playBtn"]) return;
    this["_playBtn"]["replaceChildren"]();
    const v296 = "http://www.w3.org/2000/svg",
      v297 = document["createElementNS"](v296, "svg");
    (v297["setAttribute"]("width", "16"),
      v297["setAttribute"]("height", "16"),
      v297["setAttribute"]("viewBox", "0 0 24 24"),
      v297["setAttribute"]("fill", "currentColor"));
    if (v295) {
      const v298 = document["createElementNS"](v296, "polygon");
      (v298["setAttribute"]("points", "5 3 19 12 5 21 5 3"),
        v297["appendChild"](v298));
    } else {
      const v299 = document["createElementNS"](v296, "rect");
      (v299["setAttribute"]("x", "6"),
        v299["setAttribute"]("y", "4"),
        v299["setAttribute"]("width", "4"),
        v299["setAttribute"]("height", "16"));
      const v300 = document["createElementNS"](v296, "rect");
      (v300["setAttribute"]("x", "14"),
        v300["setAttribute"]("y", "4"),
        v300["setAttribute"]("width", "4"),
        v300["setAttribute"]("height", "16"),
        v297["appendChild"](v299),
        v297["appendChild"](v300));
    }
    this["_playBtn"]["appendChild"](v297);
  }
  async ["_captureFrame"]() {
    (await this["_ensurePlaybackVideoSrc"](),
      await extractCurrentVideoFrameToImageNode({
        videoEl: this["_video"],
        anchorNodeId: this["id"],
        fallbackDurationSec: this["_getBaseDuration"](),
        onMissingMetadata: (v301) => this["_maybeFetchVideoMeta"](v301),
        logPrefix: "[SourceVideoNode]",
      }));
  }
  ["_computeGenerationDuration"](v302 = this["_data"]) {
    if (!v302) return 0;
    if (typeof v302["generationDuration"] === "number")
      return v302["generationDuration"];
    const v303 = Number(v302["generationStartTime"] || 0);
    if (!Number["isFinite"](v303) || v303 <= 0) return 0;
    return Math["max"](0, Date["now"]() - v303);
  }
  ["_isRunningHubRecoverableTask"](v304 = this["_data"]) {
    if (!v304 || typeof v304 !== "object") return false;
    const v305 = String(v304["rhTaskId"] || "")["trim"]();
    if (!v305) return false;
    const v306 = String(v304["rhTaskStatus"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (["success", "failed", "idle", "cancelled"]["includes"](v306))
      return false;
    return isRunningHubVideoTask(v304);
  }
  ["_syncRunningHubVideoTaskState"](v307 = this["_data"]) {
    if (!v307 || typeof v307 !== "object") return false;
    const v308 = buildRunningHubVideoTerminalStatePatch(
      v307,
      v307["rhTaskStatus"],
      this["_computeGenerationDuration"](v307),
    );
    if (!v308) return false;
    return (appStore["updateNodeData"](this["id"], v308), true);
  }
  ["_isAsyncRecoverableTask"](v309 = this["_data"]) {
    if (!v309 || typeof v309 !== "object") return false;
    const v310 = String(v309["asyncTaskId"] || "")["trim"]();
    if (!v310) return false;
    const v311 = String(v309["asyncTaskProvider"] || v309["provider"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (
      !v311 ||
      v311 === "runninghubwf" ||
      v311 === "runninghub" ||
      v311 === "dreamina"
    )
      return false;
    const v312 = String(v309["asyncTaskKind"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (v312 && v312 !== "video") return false;
    const v313 = String(v309["asyncTaskStatus"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (["success", "failed", "idle", "cancelled"]["includes"](v313))
      return false;
    return true;
  }
  ["_stopRunningHubRecovery"](v314 = true) {
    try {
      this["_rhResumeAbortController"]?.["abort"]?.();
    } catch {}
    ((this["_rhResumeAbortController"] = null),
      (this["_rhResumePromise"] = null),
      (this["_rhResumeTaskId"] = ""));
    if (!v314) return;
    const v315 = appStore["getState"]()["nodes"]?.[this["id"]];
    if (!v315 || v315["rhTaskRecovering"] !== true) return;
    appStore["updateNodeData"](this["id"], { rhTaskRecovering: false });
  }
  ["_stopAsyncRecovery"](v316 = true) {
    try {
      this["_asyncResumeAbortController"]?.["abort"]?.();
    } catch {}
    ((this["_asyncResumeAbortController"] = null),
      (this["_asyncResumePromise"] = null),
      (this["_asyncResumeTaskId"] = ""));
    if (!v316) return;
    const v317 = appStore["getState"]()["nodes"]?.[this["id"]];
    if (!v317 || v317["asyncTaskRecovering"] !== true) return;
    appStore["updateNodeData"](this["id"], { asyncTaskRecovering: false });
  }
  ["_extractFirstVideoUrl"](v318) {
    const v319 = new Set(),
      v320 = (v321) => {
        if (v321 == null) return "";
        if (typeof v321 === "string") {
          const v322 = v321["trim"]();
          if (!v322) return "";
          if (
            v322["startsWith"]("http://") ||
            v322["startsWith"]("https://") ||
            v322["startsWith"]("/")
          )
            return v322;
          if (v322["startsWith"]("{") || v322["startsWith"]("["))
            try {
              return v320(JSON["parse"](v322));
            } catch {
              return "";
            }
          const v323 = v322["match"](/https?:\/\/[^\s"'<>]+/);
          return v323 && v323[0] ? v323[0] : "";
        }
        if (typeof v321 !== "object") return "";
        if (v319["has"](v321)) return "";
        v319["add"](v321);
        if (Array["isArray"](v321)) {
          for (const v324 of v321) {
            const v325 = v320(v324);
            if (v325) return v325;
          }
          return "";
        }
        const v326 = [
          "url",
          "videoUrl",
          "video_url",
          "fileUrl",
          "file_url",
          "download_url",
          "output",
          "result",
          "data",
          "results",
          "outputs",
        ];
        for (const v327 of v326) {
          const v328 = v320(v321[v327]);
          if (v328) return v328;
        }
        return "";
      };
    return v320(v318);
  }
  ["_toLocalPathIfSameOrigin"](v329) {
    return urlToLocalPath(v329);
  }
  async ["_saveVideoToOutput"](v330) {
    const v331 = String(v330 || "")["trim"]();
    if (!/^https?:\/\//i["test"](v331))
      return this["_toLocalPathIfSameOrigin"](v331);
    let v332 = "";
    try {
      const v333 = new AbortController(),
        v334 = setTimeout(() => v333["abort"](), 120000);
      let v335 = null;
      try {
        v335 = await fetchRemoteBlob(v331, { signal: v333["signal"] });
      } finally {
        clearTimeout(v334);
      }
      const v336 = await saveOutputToServer(v335, { ext: "mp4" });
      v336?.["success"] && (v332 = pickResultLocalPath(v336));
    } catch (v337) {
      const v338 = v337 instanceof Error ? v337["message"] : String(v337 || ""),
        v339 =
          v338["includes"]("Failed to fetch") ||
          v338["includes"]("NetworkError") ||
          v338["toLowerCase"]()["includes"]("cors");
      if (v339) {
        const v340 = await saveOutputFromUrlToServer({ url: v331, ext: "mp4" });
        v332 = pickResultLocalPath(v340);
      }
    }
    return v332;
  }
  async ["_buildRecoveredVideoResultPatch"](v341) {
    let v342 = buildCanvasLocalVideoFields(v341);
    if (v342["src"] && v342["localPath"]) return v342;
    const v343 = this["_extractFirstVideoUrl"](v341);
    if (!v343) throw new Error("未获取到可用的输出视频\x20URL");
    const v344 =
      this["_toLocalPathIfSameOrigin"](v343) ||
      (await this["_saveVideoToOutput"](v343));
    v342 = buildCanvasLocalVideoFields({ localPath: v344, videoUrl: v343 });
    if (!v342["src"] || !v342["localPath"])
      throw new Error("未获取到可用的输出视频 URL");
    return v342;
  }
  ["_resolveAsyncResumePayload"](v345) {
    return {
      model: String(v345?.["model"] || "")["trim"](),
      provider: String(v345?.["asyncTaskProvider"] || v345?.["provider"] || "")[
        "trim"
      ](),
    };
  }
  ["_maybeResumeRunningHubTask"]() {
    const v346 = appStore["getState"]()["nodes"]?.[this["id"]] || this["_data"];
    if (!this["_isRunningHubRecoverableTask"](v346)) {
      this["_stopRunningHubRecovery"](true);
      return;
    }
    const v347 = String(v346?.["rhTaskId"] || "")["trim"]();
    if (!v347) return;
    if (this["_rhResumePromise"] && this["_rhResumeTaskId"] === v347) return;
    const v348 =
        Number(
          v346?.["rhTaskStartedAt"] || v346?.["generationStartTime"] || 0,
        ) || Date["now"](),
      v349 = String(v346?.["model"] || "")
        ["trim"]()
        ["toLowerCase"](),
      v350 = v346?.["rhTaskUseOpenapiQuery"] === true,
      v351 = getVideoMattingModelId(),
      v352 = v349 === v351,
      v353 = v352
        ? { provider: "runninghubwf", model: v351 }
        : {
            provider:
              String(v346?.["provider"] || "runninghubwf")["trim"]() ||
              "runninghubwf",
            model: String(v346?.["model"] || "")["trim"](),
          },
      v354 =
        typeof this["_resumeRunningHubTaskPoller"] === "function"
          ? this["_resumeRunningHubTaskPoller"]
          : null,
      v355 = new AbortController();
    ((this["_rhResumeAbortController"] = v355),
      (this["_rhResumeTaskId"] = v347));
    const v356 = (async () => {
      try {
        const v357 = await resumeTask(
          {
            sourceNodeId: this["id"],
            targetNodeId: this["id"],
            trigger: "node",
            taskType: "video-generation",
            provider: v353["provider"] || v346?.["provider"] || "runninghubwf",
            adapterType: "workflow",
            modelId: v353["model"] || v346?.["model"] || "",
            executionId:
              "runninghub.source-video." +
              (v353["model"] || v346?.["model"] || "workflow"),
            payload: v353,
            taskId: v347,
            cancellable: false,
            resumable: true,
            startBuilder: () => ({
              rhTaskStatus:
                String(v346?.["rhTaskStatus"] || "")
                  ["trim"]()
                  ["toLowerCase"]() === "pending"
                  ? "pending"
                  : "running",
              rhTaskUseOpenapiQuery: v350,
            }),
            poll: async () => {
              if (v354)
                return v354(v347, v346, {
                  signal: v355["signal"],
                  payload: v353,
                  useOpenapiQuery: v350,
                });
              if (v352)
                return resumeRunningHubVideoTask(v347, v353, {
                  signal: v355["signal"],
                  useOpenapiQuery: v350,
                });
              await ensureConfig();
              const v358 = getProviderConfig("runninghubwf"),
                v359 = String(v358?.["apiKey"] || "")["trim"]();
              if (!v359) throw new Error("RunningHUB API Key 未配置");
              return resumeRunninghubWorkflowTask(
                { apiKey: v359, taskId: v347 },
                { signal: v355["signal"], useOpenapiQuery: v350 },
              );
            },
            resultBuilder: async (v360) => {
              const v361 = appStore["getState"]()["nodes"]?.[this["id"]] || {},
                v362 =
                  resolveRunningHubVideoStatusName(v361, "success") ||
                  (v361?.["name"]?.["includes"]("高清视频")
                    ? "高清视频"
                    : v361?.["name"] || "视频结果");
              return {
                ...(await this["_buildRecoveredVideoResultPatch"](v360)),
                name: v362,
                generationDuration: this["_computeGenerationDuration"](v361),
              };
            },
            failureBuilder: (v363, v364) => {
              const v365 =
                  v363 instanceof Error
                    ? v363["message"]
                    : String(v363 || "任务恢复失败"),
                v366 = appStore["getState"]()["nodes"]?.[this["id"]] || {},
                v367 =
                  buildRunningHubVideoTerminalStatePatch(
                    v366,
                    "failed",
                    this["_computeGenerationDuration"](v366),
                  ) || {},
                v368 =
                  v367["generationDuration"] ??
                  this["_computeGenerationDuration"](v366);
              return {
                ...buildSourceVideoRecoveryFailurePatch(v366, {
                  error: v365,
                  startedAt: v364["startedAt"],
                  duration: v368,
                }),
                ...v367,
                generationDuration: v368,
              };
            },
            parseError: (v369) =>
              v369 instanceof Error
                ? v369["message"]
                : String(v369 || "任务恢复失败"),
          },
          { store: appStore, startedAt: v348, abortController: v355 },
        );
        v357["status"] === "success" && window["_triggerLocalCacheSave"]?.();
      } catch (v370) {
        if (
          v355["signal"]["aborted"] ||
          String(v370?.["message"] || "") === "CANCELLED"
        )
          return;
        const v371 =
            v370 instanceof Error
              ? v370["message"]
              : String(v370 || "任务恢复失败"),
          v372 = appStore["getState"]()["nodes"]?.[this["id"]];
        if (!v372) return;
        const v373 =
          buildRunningHubVideoTerminalStatePatch(
            v372,
            "failed",
            this["_computeGenerationDuration"](v372),
          ) || {};
        appStore["updateNodeData"](this["id"], {
          ...buildSourceVideoRecoveryFailurePatch(v372, {
            error: v371,
            startedAt: v348,
            duration:
              v373["generationDuration"] ??
              this["_computeGenerationDuration"](v372),
          }),
          ...v373,
          isGenerating: false,
          generationDuration:
            v373["generationDuration"] ??
            this["_computeGenerationDuration"](v372),
          rhTaskStatus: "failed",
          rhTaskRecovering: false,
        });
      } finally {
        (this["_rhResumeAbortController"] === v355 &&
          (this["_rhResumeAbortController"] = null),
          this["_rhResumeTaskId"] === v347 && (this["_rhResumeTaskId"] = ""),
          (this["_rhResumePromise"] = null));
      }
    })();
    this["_rhResumePromise"] = v356;
  }
  ["_maybeResumeAsyncTask"]() {
    const v374 = appStore["getState"]()["nodes"]?.[this["id"]] || this["_data"];
    if (!this["_isAsyncRecoverableTask"](v374)) {
      this["_stopAsyncRecovery"](true);
      return;
    }
    const v375 = String(v374?.["asyncTaskId"] || "")["trim"]();
    if (!v375) return;
    if (this["_asyncResumePromise"] && this["_asyncResumeTaskId"] === v375)
      return;
    const v376 =
        Number(
          v374?.["asyncTaskStartedAt"] || v374?.["generationStartTime"] || 0,
        ) || Date["now"](),
      v377 = this["_resolveAsyncResumePayload"](v374),
      v378 = String(
        v377["provider"] ||
          v374?.["asyncTaskProvider"] ||
          v374?.["provider"] ||
          "",
      )
        ["trim"]()
        ["toLowerCase"](),
      v379 =
        typeof this["_resumeAsyncTaskPoller"] === "function"
          ? this["_resumeAsyncTaskPoller"]
          : resumeAsyncVideoTask,
      v380 = new AbortController();
    ((this["_asyncResumeAbortController"] = v380),
      (this["_asyncResumeTaskId"] = v375));
    const v381 = (async () => {
      try {
        const v382 = await resumeTask(
          {
            sourceNodeId: this["id"],
            targetNodeId: this["id"],
            trigger: "node",
            taskType: "video-generation",
            provider: v378 || v377["provider"] || v374?.["provider"] || "",
            adapterType: "modelApi",
            modelId: v377["model"] || v374?.["model"] || "",
            executionId:
              (v378 || v377["provider"] || "model") + ".source-video.async",
            payload: v377,
            taskId: v375,
            async: true,
            cancellable: false,
            resumable: true,
            startBuilder: () => ({
              asyncTaskProvider: v378,
              asyncTaskKind: "video",
              asyncTaskStatus:
                String(v374?.["asyncTaskStatus"] || "")
                  ["trim"]()
                  ["toLowerCase"]() === "pending"
                  ? "pending"
                  : "running",
            }),
            poll: async () => v379(v375, v377, { signal: v380["signal"] }),
            resultBuilder: async (v383) => {
              const v384 = appStore["getState"]()["nodes"]?.[this["id"]] || {};
              return {
                ...(await this["_buildRecoveredVideoResultPatch"](v383)),
                name: v384?.["name"]?.["includes"]("高清视频")
                  ? "高清视频"
                  : v384?.["name"] || "视频结果",
                generationDuration: this["_computeGenerationDuration"](v384),
              };
            },
            failureBuilder: (v385, v386) => {
              const v387 =
                  v385 instanceof Error
                    ? v385["message"]
                    : String(v385 || "任务恢复失败"),
                v388 = appStore["getState"]()["nodes"]?.[this["id"]] || {};
              return buildSourceVideoRecoveryFailurePatch(v388, {
                error: v387,
                startedAt: v386["startedAt"],
                duration: this["_computeGenerationDuration"](v388),
              });
            },
            parseError: (v389) =>
              v389 instanceof Error
                ? v389["message"]
                : String(v389 || "任务恢复失败"),
          },
          { store: appStore, startedAt: v376, abortController: v380 },
        );
        v382["status"] === "success" && window["_triggerLocalCacheSave"]?.();
      } catch (v390) {
        if (
          v380["signal"]["aborted"] ||
          String(v390?.["message"] || "") === "CANCELLED" ||
          v390?.["name"] === "AbortError"
        )
          return;
        const v391 =
            v390 instanceof Error
              ? v390["message"]
              : String(v390 || "任务恢复失败"),
          v392 = appStore["getState"]()["nodes"]?.[this["id"]];
        if (!v392) return;
        appStore["updateNodeData"](this["id"], {
          ...buildSourceVideoRecoveryFailurePatch(v392, {
            error: v391,
            startedAt: v376,
            duration: this["_computeGenerationDuration"](v392),
          }),
          isGenerating: false,
          asyncTaskStatus: "failed",
          asyncTaskRecovering: false,
        });
      } finally {
        (this["_asyncResumeAbortController"] === v380 &&
          (this["_asyncResumeAbortController"] = null),
          this["_asyncResumeTaskId"] === v375 &&
            (this["_asyncResumeTaskId"] = ""),
          (this["_asyncResumePromise"] = null));
      }
    })();
    this["_asyncResumePromise"] = v381;
  }
  ["update"](v393) {
    this["_data"] = v393;
    this["_syncRunningHubVideoTaskState"](v393) &&
      ((this["_data"] = appStore["getState"]()["nodes"]?.[this["id"]] || v393),
      (v393 = this["_data"]));
    if (!this["_video"]) return;
    const v394 = this["_resolveVideoSrc"](v393),
      v395 = shouldShowGenerationResultLoadingUi(v393, { hasResult: !!v394 });
    if (v395) {
      startLoading(this["_card"], { variant: "full" });
      if (this["_hint"]) this["_hint"]["style"]["display"] = "none";
      if (this["_uploadBtn"]) this["_uploadBtn"]["disabled"] = true;
    } else {
      if (isTaskTerminal(v393)) {
        stopLoading(this["_card"]);
        if (this["_uploadBtn"]) this["_uploadBtn"]["disabled"] = false;
      } else {
        if (this["_uploadBtn"]) this["_uploadBtn"]["disabled"] = false;
        if (!v394) stopLoading(this["_card"]);
      }
    }
    this["_clearResolvedVideoTimer"](v393, v394);
    const v396 = resolveSourceVideoPosterSrc(v393),
      v397 = v396 !== this["_lastPosterSrc"];
    if (v394 && v394 !== this["_currentSrc"]) this["_loadVideo"](v394);
    else {
      if (v394 && v397 && this["_video"]["paused"]) this["_loadVideo"](v394);
      else {
        if (v397) this["_applyVideoPoster"](v393);
        else {
          if (!v394) this["_loadVideo"]("");
        }
      }
    }
    (this["_maybeFetchVideoMeta"](v393),
      this["_maybeResumeRunningHubTask"](),
      this["_maybeResumeAsyncTask"](),
      this["_label"] &&
        v393["name"] &&
        document["activeElement"] !== this["_label"] &&
        (this["_label"]["innerText"] = v393["name"]));
  }
  ["unmount"]() {
    (this["_releaseActiveCapturePreviewUrl"](),
      this["_stopRunningHubRecovery"](false),
      this["_stopAsyncRecovery"](false),
      this["_centerIndicatorTimer"] &&
        (clearTimeout(this["_centerIndicatorTimer"]),
        (this["_centerIndicatorTimer"] = null)),
      this["_video"] &&
        (this["_setManualLoopPlayback"](false),
        this["_video"]["pause"](),
        (this["_video"]["src"] = "")),
      this["_objUrl"] &&
        (URL["revokeObjectURL"](this["_objUrl"]), (this["_objUrl"] = null)));
  }
}
