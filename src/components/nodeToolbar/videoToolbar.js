import appStore from "../../core/stores/appStore.js";
import { findAvailablePosition } from "../../core/math.js";
import { submitTask } from "../../core/generationTaskRuntime.js";
import { createRunningHubTaskStateMachine } from "../../modules/ImageFreeAngleController.js";
import VideoClipController, {
  runSmartClipKeyframeExtractionFromVideoNode,
} from "../../modules/VideoClipController.js";
import { runVideoAudioSeparationFromNode } from "../../modules/VideoAudioSeparationController.js";
import VideoKeyingController from "../../modules/VideoKeyingController.js";
import {
  fetchRemoteBlob,
  saveOutputToServer,
  saveOutputFromUrlToServer,
} from "../../../api/projectsV2Api.js";
import { fetchAppRuntimeInfoFromServer } from "../../../api/runtimeApi.js";
import { fetchVideoMetaFromServer } from "../../../api/videoMetaApi.js";
import {
  runRunninghubAiApp,
  runRunninghubWorkflow,
  resumeRunninghubWorkflowTask,
} from "../../../api/runninghubWorkflowApi.js";
import { processInputVideos } from "../../../api/videoUploadApi.js";
import { detectScenes } from "../../../api/sceneDetectionApi.js";
import { buildApiUrl } from "../../../api/apiBase.js";
import { getProviderConfig, ensureConfig } from "../../../api/configApi.js";
import {
  calcSafeSpawnPosNearNode,
  getNodeSpawnPrefs,
} from "../../modules/nodeSpawn.js";
import {
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from "../../services/fileService.js";
import {
  buildCanvasLocalVideoFields,
  resolveCanvasVideoLocalPath,
  resolveCanvasVideoUrl,
} from "../../services/canvasMediaLocalService.js";
import { attachMediaElementPlaybackSource } from "../../services/desktopMediaBlobSource.js";
import {
  pickResultLocalPath,
  urlToLocalPath,
} from "../../utils/localMediaPath.js";
import {
  buildVideoGenerationFailurePatch,
  buildVideoGenerationResultPatch,
} from "../video-node/videoGenerationResultRenderer.js";
import { executeCommand } from "../../core/interaction.js";
import { VIDEO_TOOLBAR_HTML } from "./videoToolbarHtml.js";
import {
  RUNNING_HUB_CANCEL_ICON_HTML,
  bindRunningHubToolbarTaskButton,
  cancelRunningHubResultTask,
  findRunningHubToolbarTaskForNode,
  isRunningHubToolbarTaskCancelled,
  notifyRunningHubToolbarTasksChanged,
} from "./runningHubToolbarTaskButton.js";
import {
  RH_VIDEO_HD_VIP_MODEL_ID,
  resolveModelExecution,
} from "../../manifests/index.js";
import { bindVideoClipAction } from "./videoActions/clipAction.js";
import { bindVideoExtractKeyframesAction } from "./videoActions/extractKeyframesAction.js";
import { bindVideoSeparateAvAction } from "./videoActions/separateAvAction.js";
import { bindVideoSmartClipAction } from "./videoActions/smartClipAction.js";
import { bindVideoKeyingAction } from "./videoActions/keyingAction.js";
import { bindVideoRemoveAction } from "./videoActions/removeAction.js";
import { bindVideoFrameInterpolationAction } from "./videoActions/frameInterpolationAction.js";
import { bindVideoHdAction } from "./videoActions/hdAction.js";
import { bindVideoDownloadAction } from "./videoActions/downloadAction.js";
import { bindVideoFullscreenAction } from "./videoActions/fullscreenAction.js";
import { bindVideoResetSizeAction } from "./videoActions/resetSizeAction.js";
import { bindStoryboardScriptToolbarAction } from "./storyboardScriptAction.js";
import { bindImageToolbarLayoutUi } from "./imageToolbarLayoutUi.js";
import { bindApimartPrivateAvatarAction } from "./apimartPrivateAvatarAction.js";
import {
  VIDEO_TOOLBAR_ACTIONS,
  normalizeVideoToolbarLayout,
  serializeVideoToolbarLayout,
} from "../../modules/videoToolbarLayoutMemory.js";
export { VIDEO_TOOLBAR_HTML };
const RH_VIDEO_HD_BASIC_WORKFLOW_ID = "2019292222763573249",
  RH_VIDEO_HD_VIP_EXECUTION = resolveModelExecution(RH_VIDEO_HD_VIP_MODEL_ID),
  RH_VIDEO_HD_VIP_APP_ID =
    RH_VIDEO_HD_VIP_EXECUTION?.["executionManifest"]?.["appId"] ||
    "2047787809091620866",
  VIDEO_HD_STANDARD_INSTANCE_TYPE = "default",
  VIDEO_HD_VIP_INSTANCE_TYPE = "plus",
  VIDEO_HD_STANDARD_MAX_SECONDS = 10,
  KEYING_CANCEL_ICON_HTML = RUNNING_HUB_CANCEL_ICON_HTML,
  getStateSnapshot = () =>
    typeof appStore["getStateRaw"] === "function"
      ? appStore["getStateRaw"]()
      : appStore["getState"]();
function getToolbarActionFromButton(v0) {
  if (!v0?.["classList"]) return "";
  for (const v1 of v0["classList"]) {
    if (!v1["startsWith"]("act-")) continue;
    const v2 = v1["slice"](4);
    if (VIDEO_TOOLBAR_ACTIONS["includes"](v2)) return v2;
  }
  return "";
}
export function bindVideoToolbarEvents(v3, v4) {
  if (!v3) return;
  const v5 = 120,
    v6 = 800,
    v7 = 2;
  (v3["addEventListener"]("pointerdown", (v8) => v8["stopPropagation"]()),
    v3["addEventListener"]("dblclick", (v9) => {
      (v9["preventDefault"](), v9["stopPropagation"]());
    }),
    bindImageToolbarLayoutUi(v3, {
      store: appStore,
      getStateSnapshot: getStateSnapshot,
      toolbarActions: VIDEO_TOOLBAR_ACTIONS,
      normalizeToolbarLayout: normalizeVideoToolbarLayout,
      serializeToolbarLayout: serializeVideoToolbarLayout,
      getToolbarActionFromButton: getToolbarActionFromButton,
      getToolbarLayout: (v10) => v10?.["ui"]?.["videoToolbarLayout"],
      setToolbarLayout: (v11) => appStore["setVideoToolbarLayout"]?.(v11),
      moreMenuStickyActions: ["hd"],
    }));
  const v12 = () => {
      const v13 = v4?.["id"];
      if (!v13) return v4 || {};
      return getStateSnapshot()["nodes"]?.[v13] || v4 || {};
    },
    v14 = (v15) => {
      const v16 = String(v15 || "")["trim"]();
      if (!v16) return "";
      if (
        v16["startsWith"]("http://") ||
        v16["startsWith"]("https://") ||
        v16["startsWith"]("blob:") ||
        v16["startsWith"]("data:")
      )
        return v16;
      if (v16["startsWith"]("/")) return buildApiUrl(v16);
      return buildApiUrl("/" + v16["replace"](/^\/+/, ""));
    },
    v17 = (v18) => {
      try {
        const v19 = new URL(v18, window["location"]["href"]),
          v20 = v19["pathname"]["split"]("/")["filter"](Boolean)["pop"]() || "";
        return decodeURIComponent(v20);
      } catch {
        const v21 = String(v18 || "")
          ["split"]("?")[0]
          ["split"]("#")[0]
          ["split"]("/");
        return v21[v21["length"] - 1] || "";
      }
    },
    v22 = (v23) =>
      String(v23 || "")
        ["trim"]()
        ["replace"](/[\\/:*?"<>|]/g, "_")
        ["slice"](0, 120),
    v24 = (v25) => {
      const v26 = v22(v17(v25));
      if (v26) return v26["includes"](".") ? v26 : v26 + ".mp4";
      return "video_" + Date["now"]() + ".mp4";
    },
    v27 = (v28, v29) => {
      const v30 = document["createElement"]("a");
      ((v30["href"] = v28),
        (v30["download"] = v29),
        (v30["rel"] = "noopener"),
        document["body"]["appendChild"](v30),
        v30["click"](),
        v30["remove"]());
    },
    v31 = (v32) => {
      const v33 = String(v32 || "")["trim"]();
      if (!v33) return false;
      if (v33["startsWith"]("/")) return true;
      try {
        const v34 = new URL(v33, window["location"]["href"]);
        return v34["origin"] === window["location"]["origin"];
      } catch {
        return false;
      }
    },
    v35 = () => {
      const v36 = v12(),
        v37 = Array["isArray"](v36["videos"]) ? v36["videos"] : [],
        v38 = v36["mainVideoIndex"] || 0,
        v39 = v37[v38] || v37[0] || {};
      return v14(resolveCanvasVideoUrl(v39) || resolveCanvasVideoUrl(v36));
    },
    v40 = () => {
      const v41 = v12(),
        v42 = Array["isArray"](v41["videos"]) ? v41["videos"] : [],
        v43 = v41["mainVideoIndex"] || 0,
        v44 = v42[v43] || v42[0] || {};
      return { node: v41, item: v44 };
    },
    v45 = () => {
      const { node: v46, item: v47 } = v40(),
        v48 = [
          v47?.["videoDuration"],
          v47?.["duration"],
          v46?.["videoDuration"],
        ];
      for (const v49 of v48) {
        const v50 = Number(v49);
        if (Number["isFinite"](v50) && v50 > 0) return v50;
      }
      return 0;
    },
    v51 = () => {
      const { node: v52, item: v53 } = v40();
      return (
        resolveCanvasVideoLocalPath(v53) || resolveCanvasVideoLocalPath(v52)
      );
    },
    v54 = async () => {
      try {
        const v55 = await fetchAppRuntimeInfoFromServer();
        window["ADVANCED_MODE"] = Boolean(v55?.["isAdvancedMode"]);
      } catch {}
      return window["ADVANCED_MODE"] === true;
    },
    v56 = (v57) =>
      new Promise((v58) => {
        const v59 = String(v57 || "")["trim"]();
        if (!v59) {
          v58(0);
          return;
        }
        const v60 = document["createElement"]("video");
        let v61 = false;
        const v62 = () => {
            v60["removeAttribute"]("src");
            try {
              v60["load"]();
            } catch {}
          },
          v63 = (v64) => {
            if (v61) return;
            ((v61 = true), window["clearTimeout"](v65), v62(), v58(v64));
          },
          v65 = window["setTimeout"](() => v63(0), 12000);
        ((v60["preload"] = "metadata"),
          (v60["muted"] = true),
          (v60["playsInline"] = true),
          (v60["onloadedmetadata"] = () => {
            const v66 = Number(v60["duration"]);
            v63(Number["isFinite"](v66) && v66 > 0 ? v66 : 0);
          }),
          (v60["onerror"] = () => v63(0)),
          void attachMediaElementPlaybackSource(v60, v59, {
            preload: "metadata",
          })["catch"](() => {
            !String(v60["getAttribute"]?.("src") || v60["src"] || "")[
              "trim"
            ]() && ((v60["src"] = v59), v60["load"]?.());
          }));
      }),
    v67 = async (v68) => {
      const v69 = v45();
      if (v69 > 0) return v69;
      const v70 = v51();
      if (v70)
        try {
          const v71 = await fetchVideoMetaFromServer(v70),
            v72 = Number(v71?.["duration"]);
          if (Number["isFinite"](v72) && v72 > 0) return v72;
        } catch {}
      return v56(v68);
    },
    v73 = async (v74) => {
      if (await v54()) return true;
      const v75 = await v67(v74);
      if (Number["isFinite"](v75) && v75 > VIDEO_HD_STANDARD_MAX_SECONDS + 0.05)
        return (
          window["showToast"]?.(
            "普通模式下视频不能超过\x20" +
              VIDEO_HD_STANDARD_MAX_SECONDS +
              "\x20秒，请先裁剪视频或在根目录添加\x20.Advanced\x20后重启应用",
            "warn",
            5200,
          ),
          false
        );
      return true;
    },
    v76 = async (v77, v78 = null) => {
      if (typeof window["refreshSubscriptionState"] === "function")
        try {
          await window["refreshSubscriptionState"]();
        } catch {}
      const v79 =
        typeof window["isModelAllowedBySubscription"] === "function"
          ? window["isModelAllowedBySubscription"](v77, "runninghubwf")
          : true;
      if (v79) return true;
      if (typeof window["openSubscriptionDialog"] === "function")
        window["openSubscriptionDialog"]({
          modelId: v77,
          provider: "runninghubwf",
          onSuccess: v78,
        });
      else
        typeof window["handleSubscriptionRequired"] === "function"
          ? await window["handleSubscriptionRequired"]({
              modelId: v77,
              provider: "runninghubwf",
            })
          : window["showToast"]?.("该高清模型需要\x20VIP\x20授权", "warn");
      return false;
    },
    v80 = (v81) => {
      const v82 = new Set(),
        v83 = [
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
        ],
        v84 = (v85) => {
          const v86 = String(v85 || "")["trim"]();
          if (!v86) return "";
          if (v86["startsWith"]("http://") || v86["startsWith"]("https://"))
            return v86;
          if (v86["startsWith"]("/")) return v86;
          const v87 = v86["match"](/https?:\/\/[^\s"'<>]+/);
          if (v87?.[0]) return v87[0];
          if (v86["startsWith"]("{") || v86["startsWith"]("["))
            try {
              return v88(JSON["parse"](v86));
            } catch {}
          return "";
        },
        v88 = (v89) => {
          if (!v89) return "";
          if (typeof v89 === "string") return v84(v89);
          if (typeof v89 !== "object") return "";
          if (v82["has"](v89)) return "";
          v82["add"](v89);
          if (Array["isArray"](v89)) {
            for (const v90 of v89) {
              const v91 = v88(v90);
              if (v91) return v91;
            }
            return "";
          }
          for (const v92 of v83) {
            if (v92 in v89) {
              const v93 = v88(v89[v92]);
              if (v93) return v93;
            }
          }
          for (const v94 of Object["keys"](v89)) {
            const v95 = v88(v89[v94]);
            if (v95) return v95;
          }
          return "";
        };
      return v88(v81);
    },
    v96 = (v97) => {
      return urlToLocalPath(v97);
    },
    v98 = async (v99) => {
      const v100 = String(v99 || "")["trim"]();
      if (!(v100["startsWith"]("http://") || v100["startsWith"]("https://")))
        throw new Error("保存失败：无效视频地址");
      const v101 = new AbortController(),
        v102 = setTimeout(() => v101["abort"](), 120000);
      let v103 = null;
      try {
        v103 = await fetchRemoteBlob(v100, { signal: v101["signal"] });
      } finally {
        clearTimeout(v102);
      }
      if (!v103) throw new Error("保存失败：视频下载为空");
      const v104 = await saveOutputToServer(v103, { ext: "mp4" }),
        v105 = pickResultLocalPath(v104);
      if (!v104?.["success"] || !v105)
        throw new Error("本地保存失败：返回格式异常");
      return v105;
    },
    v106 = async (v107) => {
      let v108 = v96(v107);
      if (
        !v108 &&
        (v107["startsWith"]("http://") || v107["startsWith"]("https://"))
      )
        try {
          (window["showToast"]?.("正在保存到本地…", "info"),
            (v108 = await v98(v107)));
        } catch (v109) {
          const v110 =
              v109 instanceof Error ? v109["message"] : String(v109 || ""),
            v111 =
              v110["includes"]("Failed to fetch") ||
              v110["includes"]("NetworkError") ||
              v110["toLowerCase"]()["includes"]("cors");
          if (!v111) throw v109;
          const v112 = await saveOutputFromUrlToServer({
              url: v107,
              ext: "mp4",
            }),
            v113 = pickResultLocalPath(v112);
          if (v113) v108 = v113;
          else throw new Error(v112?.["error"] || "本地保存失败");
        }
      return v108 || "";
    },
    v114 = {
      toolbarEl: v3,
      nodeData: v4,
      mediaKind: "video",
      getStateSnapshot: getStateSnapshot,
      store: appStore,
      findAvailablePosition: findAvailablePosition,
      submitTask: submitTask,
      createRunningHubTaskStateMachine: createRunningHubTaskStateMachine,
      VideoClipController: VideoClipController,
      runSmartClipKeyframeExtractionFromVideoNode:
        runSmartClipKeyframeExtractionFromVideoNode,
      runVideoAudioSeparationFromNode: runVideoAudioSeparationFromNode,
      VideoKeyingController: VideoKeyingController,
      fetchRemoteBlob: fetchRemoteBlob,
      runRunninghubAiApp: runRunninghubAiApp,
      runRunninghubWorkflow: runRunninghubWorkflow,
      resumeRunninghubWorkflowTask: resumeRunninghubWorkflowTask,
      processInputVideos: processInputVideos,
      detectScenes: detectScenes,
      getProviderConfig: getProviderConfig,
      ensureConfig: ensureConfig,
      calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
      getNodeSpawnPrefs: getNodeSpawnPrefs,
      buildSourceMediaNodePayload: buildSourceMediaNodePayload,
      getAutoMediaSizeByShortSide: getAutoMediaSizeByShortSide,
      buildCanvasLocalVideoFields: buildCanvasLocalVideoFields,
      buildVideoGenerationFailurePatch: buildVideoGenerationFailurePatch,
      buildVideoGenerationResultPatch: buildVideoGenerationResultPatch,
      executeCommand: executeCommand,
      VIDEO_TOOLBAR_FOCUS_PADDING: v5,
      VIDEO_TOOLBAR_FOCUS_DURATION_MS: v6,
      VIDEO_TOOLBAR_FOCUS_MAX_ZOOM: v7,
      KEYING_CANCEL_ICON_HTML: KEYING_CANCEL_ICON_HTML,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
      cancelRunningHubResultTask: cancelRunningHubResultTask,
      findRunningHubToolbarTaskForNode: findRunningHubToolbarTaskForNode,
      isRunningHubToolbarTaskCancelled: isRunningHubToolbarTaskCancelled,
      notifyRunningHubToolbarTasksChanged: notifyRunningHubToolbarTasksChanged,
      RH_VIDEO_HD_BASIC_WORKFLOW_ID: RH_VIDEO_HD_BASIC_WORKFLOW_ID,
      RH_VIDEO_HD_VIP_MODEL_ID: RH_VIDEO_HD_VIP_MODEL_ID,
      RH_VIDEO_HD_VIP_APP_ID: RH_VIDEO_HD_VIP_APP_ID,
      VIDEO_HD_STANDARD_INSTANCE_TYPE: VIDEO_HD_STANDARD_INSTANCE_TYPE,
      VIDEO_HD_VIP_INSTANCE_TYPE: VIDEO_HD_VIP_INSTANCE_TYPE,
      _getLatestNodeData: v12,
      _guessDownloadName: v24,
      _triggerHrefDownload: v27,
      _isProbablyLocalUrl: v31,
      _getCurrentVideoUrl: v35,
      _getCurrentVideoSource: v40,
      _ensureVideoHdDurationAllowed: v73,
      _ensureVideoHdVipAllowed: v76,
      _extractFirstUrl: v80,
      _saveRemoteVideoResult: v106,
    };
  (bindStoryboardScriptToolbarAction(v114),
    bindApimartPrivateAvatarAction(v114),
    bindVideoClipAction(v114),
    bindVideoExtractKeyframesAction(v114),
    bindVideoSeparateAvAction(v114),
    bindVideoSmartClipAction(v114),
    bindVideoKeyingAction(v114),
    bindVideoRemoveAction(v114),
    bindVideoFrameInterpolationAction(v114),
    bindVideoHdAction(v114),
    bindVideoDownloadAction(v114),
    bindVideoFullscreenAction(v114),
    bindVideoResetSizeAction(v114));
}
