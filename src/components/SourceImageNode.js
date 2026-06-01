import appStore from "../core/stores/appStore.js";
import {
  resumeAsyncImageTask,
  resumeDreaminaImageTask,
  resumeRunningHubImageTask,
} from "../../api/aiImageApi.js";
import { ensureLocalImageDerivatives, uploadFile } from "../modules/project.js";
import { openNodeImagePreview } from "../modules/imagePreview.js";
import { generateThumbnail } from "../modules/imageUtils.js";
import { bindImageToolbarEvents } from "./NodeToolbarConfig.js";
import ImageFreeAngleController from "../modules/ImageFreeAngleController.js";
import { startLoading, stopLoading } from "../modules/loadingOverlay.js";
import { setStaticInnerHTML } from "../utils/dom.js";
import { commit } from "../modules/history.js";
import { startNodeResizePreview } from "../modules/interaction/nodeResizePreview.js";
import {
  getThumbnail,
  setThumbnail,
} from "../services/thumbnailCacheService.js";
import { getAutoMediaSizeByShortSide } from "../services/fileService.js";
import {
  buildImageNodeStorageFields,
  pickCanvasImageLocalPath,
  toLocalPathUrl,
} from "../services/imageDerivativeService.js";
import {
  buildCanvasLocalImageFields,
  resolveCanvasImageDisplayUrl,
  resolveCanvasImageLowZoomUrl,
  resolveCanvasImageThumbUrl,
} from "../services/canvasMediaLocalService.js";
import {
  isCanvasLowZoomActive,
  pickImageLodUrl,
  shouldUseLowZoomImageThumbnail,
} from "../modules/canvasImageLod.js";
import { resumeTask } from "../core/generationTaskRuntime.js";
import {
  isModelApiModel,
  isWorkflowModel,
  resolveModelProvider,
} from "../manifests/index.js";
import {
  getTaskMessage,
  isTaskCancelled,
  isTaskFailed,
  isTaskTerminal,
  shouldShowGenerationResultLoadingUi,
} from "../core/generationTaskUiState.js";
import { buildImageGenerationFailurePatch } from "./aigenImage/imageGenerationResultRenderer.js";
import { getDefaultDreaminaImageModelId } from "./aigenImage/dreaminaModelMenuHelper.js";
const SOURCE_IMAGE_MIN_SIZE = 150,
  SOURCE_IMAGE_PRELOAD_CONCURRENCY = 4,
  DREAMINA_POLL_TIMEOUT_CODE = "DREAMINA_POLL_TIMEOUT",
  DREAMINA_STALE_ACTIVE_RESUME_MS = 15 * 1000,
  NON_RECOVERABLE_FAILURE_STATUSES = new Set([
    "cancelled",
    "canceled",
    "error",
    "fail",
    "failed",
  ]),
  DREAMINA_NON_RECOVERABLE_STATUSES = new Set([
    ...NON_RECOVERABLE_FAILURE_STATUSES,
    "idle",
  ]),
  DREAMINA_NON_RECOVERABLE_PHASES = new Set([
    ...NON_RECOVERABLE_FAILURE_STATUSES,
    "done",
  ]),
  _sourceImagePreloadQueue = [],
  _sourceImagePreloadInflight = new Map();
let _sourceImagePreloadActive = 0;
function buildSourceImageRecoveryFailurePatch(
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
    v3 = v2 ? v2 + "\x0a恢复失败:\x20" + v1 : "恢复失败: " + v1;
  return {
    ...buildImageGenerationFailurePatch({
      error: v1,
      startedAt: startedAt,
      duration: duration,
      clearMediaFields: false,
    }),
    outputText: v3,
  };
}
function configurePreloadImage(v4) {
  if (!v4) return;
  try {
    v4["decoding"] = "async";
  } catch {}
  try {
    if ("fetchPriority" in v4) v4["fetchPriority"] = "low";
  } catch {}
}
function pumpSourceImagePreloadQueue() {
  while (
    _sourceImagePreloadActive < SOURCE_IMAGE_PRELOAD_CONCURRENCY &&
    _sourceImagePreloadQueue["length"] > 0
  ) {
    const v5 = _sourceImagePreloadQueue["shift"]();
    _sourceImagePreloadActive += 1;
    let v6 = false;
    const v7 = (v8, v9) => {
      if (v6) return;
      ((v6 = true),
        (_sourceImagePreloadActive = Math["max"](
          0,
          _sourceImagePreloadActive - 1,
        )),
        v8(v9),
        pumpSourceImagePreloadQueue());
    };
    try {
      const v10 = new Image();
      (configurePreloadImage(v10),
        (v10["onload"] = () => {
          v7(v5["resolve"], {
            image: v10,
            naturalWidth: v10["naturalWidth"] || 0,
            naturalHeight: v10["naturalHeight"] || 0,
          });
        }),
        (v10["onerror"] = () => {
          v7(v5["reject"], new Error("Image\x20preload\x20failed"));
        }),
        (v10["src"] = v5["url"]));
    } catch (v11) {
      v7(v5["reject"], v11);
    }
  }
}
function queueSourceImagePreload(v12) {
  const v13 = String(v12 || "")["trim"]();
  if (!v13)
    return Promise["reject"](new Error("Image\x20source\x20is\x20empty"));
  const v14 = _sourceImagePreloadInflight["get"](v13);
  if (v14) return v14;
  let v15 = null;
  return (
    (v15 = new Promise((v16, v17) => {
      (_sourceImagePreloadQueue["push"]({
        url: v13,
        resolve: v16,
        reject: v17,
      }),
        pumpSourceImagePreloadQueue());
    })["finally"](() => {
      _sourceImagePreloadInflight["get"](v13) === v15 &&
        _sourceImagePreloadInflight["delete"](v13);
    })),
    _sourceImagePreloadInflight["set"](v13, v15),
    v15
  );
}
function normalizeTaskStatus(v18) {
  return String(v18 || "")
    ["trim"]()
    ["toLowerCase"]();
}
function normalizeUploadMediaDimensions(v19, v20) {
  const v21 = Math["round"](Number(v19) || 0),
    v22 = Math["round"](Number(v20) || 0);
  if (v21 <= 0 || v22 <= 0) return null;
  return { width: v21, height: v22 };
}
export function buildSourceImageUploadSizePatch(...v23) {
  for (const v24 of v23) {
    const v25 = normalizeUploadMediaDimensions(v24?.["width"], v24?.["height"]);
    if (!v25) continue;
    const v26 = getAutoMediaSizeByShortSide(v25["width"], v25["height"]);
    return {
      width: v26["width"],
      height: v26["height"],
      imageWidth: v25["width"],
      imageHeight: v25["height"],
      needsAutoResize: false,
    };
  }
  return { needsAutoResize: true };
}
export class SourceImageNode {
  constructor(v27) {
    ((this["_data"] = v27),
      (this["el"] = document["createElement"]("div")),
      (this["id"] = v27["id"]),
      (this["el"]["className"] = "v2-node-component"),
      (this["_currentSrc"] = null),
      (this["_currentMaskPreview"] = null),
      (this["_objUrl"] = null),
      (this["_thumbGenSrc"] = null),
      (this["_failedSrc"] = null),
      (this["_currentJobStatus"] = null),
      (this["_resolvedPreviewSig"] = ""),
      (this["_previewResolveToken"] = 0),
      (this["_cachedThumbUrl"] = ""),
      (this["_activeCapturePreviewUrl"] = ""),
      (this["_rhResumeAbortController"] = null),
      (this["_rhResumeTaskId"] = ""),
      (this["_rhResumePromise"] = null),
      (this["_rhResumeRetryTimer"] = null),
      (this["_dreaminaResumeAbortController"] = null),
      (this["_dreaminaResumeSubmitId"] = ""),
      (this["_dreaminaResumePromise"] = null),
      (this["_asyncResumeAbortController"] = null),
      (this["_asyncResumeTaskId"] = ""),
      (this["_asyncResumePromise"] = null));
  }
  ["_applyMaskPreview"](v28) {
    if (!this["_maskOverlay"]) return;
    const v29 = String(v28 || "")["trim"]();
    if (!v29) {
      this["_currentMaskPreview"] &&
        ((this["_maskOverlay"]["src"] = ""),
        (this["_maskOverlay"]["style"]["display"] = "none"),
        (this["_currentMaskPreview"] = null));
      return;
    }
    if (this["_currentMaskPreview"] === v29) return;
    const v30 =
      v29["startsWith"]("blob:") ||
      v29["startsWith"]("data:") ||
      v29["startsWith"]("/")
        ? v29
        : toLocalPathUrl(v29);
    if (!v30) return;
    ((this["_maskOverlay"]["src"] = encodeURI(v30)),
      (this["_maskOverlay"]["style"]["display"] = "block"),
      (this["_currentMaskPreview"] = v29));
  }
  ["_setImageLodSrc"](v31) {
    if (!this["_img"]?.["dataset"]) return;
    const v32 = String(v31 || "")["trim"]();
    if (v32) this["_img"]["dataset"]["lodSrc"] = v32;
    else delete this["_img"]["dataset"]["lodSrc"];
  }
  ["_queueThumbnail"](v33) {
    if (!v33) return;
    if (this["_thumbGenSrc"] === v33) return;
    ((this["_thumbGenSrc"] = v33),
      generateThumbnail(v33)
        ["then"](async (v34) => {
          if (!v34) return;
          const v35 = appStore["getState"]()["nodes"][this["id"]];
          if (!v35) return;
          if (this["_getPrimaryImageUrl"](v35) !== v33) return;
          (await setThumbnail(v35, v34),
            !this["_cachedThumbUrl"] && (this["_cachedThumbUrl"] = v34));
        })
        ["catch"]((v36) => {
          console["warn"]("[SourceImageNode] 缩略图缓存写入失败:", v36);
        })
        ["finally"](() => {
          if (this["_thumbGenSrc"] === v33) this["_thumbGenSrc"] = null;
        }));
  }
  ["_normalizeLocalUrl"](v37) {
    return toLocalPathUrl(v37);
  }
  ["_getPrimaryImageUrl"](v38 = this["_data"]) {
    const v39 = pickCanvasImageLocalPath(v38);
    return v39 ? toLocalPathUrl(v39) : "";
  }
  ["_getSynchronousThumbUrl"](v40 = this["_data"]) {
    return (
      toLocalPathUrl(v40?.["thumbLocalPath"]) || resolveCanvasImageThumbUrl(v40)
    );
  }
  ["_getLowZoomImageUrl"](v41 = this["_data"]) {
    return resolveCanvasImageLowZoomUrl(v41);
  }
  ["_shouldUseLowZoomThumbnail"]() {
    return shouldUseLowZoomImageThumbnail({
      nodeId: this["id"],
      rootEl: this["el"],
      store: appStore,
    });
  }
  ["_getImageDisplayLod"](v42 = this["_data"]) {
    const v43 = this["_getPrimaryImageUrl"](v42),
      v44 =
        this["_getSynchronousThumbUrl"](v42) ||
        this["_getLowZoomImageUrl"](v42);
    return pickImageLodUrl({
      mainUrl: v43,
      thumbUrl: v44,
      lowZoomThumbnail: this["_shouldUseLowZoomThumbnail"](),
    });
  }
  ["_getCapturePreviewUrl"](v45 = this["_data"]) {
    const v46 = String(v45?.["capturePreviewUrl"] || "")["trim"]();
    if (!v46) return "";
    if (
      v46["startsWith"]("blob:") ||
      v46["startsWith"]("data:image/") ||
      v46["startsWith"]("aic-local-preview:")
    )
      return v46;
    return "";
  }
  ["_getPreviewSignature"](v47 = this["_data"]) {
    return [
      String(v47?.["localPath"] || "")["trim"](),
      String(v47?.["originalLocalPath"] || "")["trim"](),
      String(v47?.["displayLocalPath"] || "")["trim"](),
      String(v47?.["thumbLocalPath"] || "")["trim"](),
      String(v47?.["capturePreviewUrl"] || "")["trim"](),
      this["_shouldUseLowZoomThumbnail"]() ? "thumb" : "full",
    ]["join"]("|");
  }
  ["_revokeCapturePreviewUrl"](v48) {
    const v49 = String(v48 || "")["trim"]();
    if (!v49 || !v49["startsWith"]("blob:")) return;
    const v50 = globalThis["window"]?.["URL"] || globalThis["URL"];
    if (typeof v50?.["revokeObjectURL"] !== "function") return;
    try {
      v50["revokeObjectURL"](v49);
    } catch {}
  }
  ["_adoptCapturePreviewUrl"](v51) {
    const v52 = String(v51 || "")["trim"]();
    (this["_activeCapturePreviewUrl"] &&
      this["_activeCapturePreviewUrl"] !== v52 &&
      this["_revokeCapturePreviewUrl"](this["_activeCapturePreviewUrl"]),
      (this["_activeCapturePreviewUrl"] = v52));
  }
  ["_releaseActiveCapturePreviewUrl"]() {
    if (!this["_activeCapturePreviewUrl"]) return;
    const v53 = this["_activeCapturePreviewUrl"];
    ((this["_activeCapturePreviewUrl"] = ""),
      this["_revokeCapturePreviewUrl"](v53));
  }
  async ["_refreshImageDisplay"](v54 = false) {
    const v55 = this["_getPreviewSignature"]();
    if (!v54 && v55 === this["_resolvedPreviewSig"]) return;
    this["_resolvedPreviewSig"] = v55;
    const v56 = ++this["_previewResolveToken"],
      v57 = this["_getPrimaryImageUrl"](),
      v58 = this["_getCapturePreviewUrl"](),
      v59 = this["_getSynchronousThumbUrl"](),
      v60 = this["_getImageDisplayLod"]();
    if (v60["lod"] === "thumb" && v60["url"]) {
      ((this["_cachedThumbUrl"] = v59 || v60["url"]),
        this["_releaseActiveCapturePreviewUrl"](),
        this["_showLowZoomThumb"](v60["url"]));
      return;
    }
    if (!v57 && v58) {
      (this["_adoptCapturePreviewUrl"](v58),
        this["_showImg"](v58, this["_cachedThumbUrl"]));
      return;
    }
    if (v57) {
      ((this["_cachedThumbUrl"] = v59 || this["_cachedThumbUrl"] || ""),
        this["_showImg"](v57, this["_cachedThumbUrl"] || v58));
      return;
    }
    let v61 = "";
    try {
      v61 = await getThumbnail(this["_data"]);
    } catch {
      v61 = "";
    }
    if (v56 !== this["_previewResolveToken"]) return;
    this["_cachedThumbUrl"] = v59 || v61 || "";
    if (v58) {
      (this["_adoptCapturePreviewUrl"](v58),
        this["_showImg"](v58, this["_cachedThumbUrl"]));
      return;
    }
    if (this["_cachedThumbUrl"]) {
      this["_showLowZoomThumb"](this["_cachedThumbUrl"]);
      return;
    }
    this["_showImg"]("", "");
  }
  ["mount"]() {
    const v62 = this["el"],
      v63 = this["_data"];
    Object["assign"](v62["style"], {
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "visible",
      pointerEvents: "auto",
      cursor: "default",
    });
    const v64 = this["_getCapturePreviewUrl"](v63),
      v65 = this["_getImageDisplayLod"](v63),
      v66 = v65["url"] || v64;
    (this["_adoptCapturePreviewUrl"](v64),
      (this["_currentSrc"] = v66),
      (this["_currentJobStatus"] = v63["jobStatus"] || null),
      setStaticInnerHTML(v62, "toolbar:image"),
      (this["_card"] = document["createElement"]("div")),
      (this["_card"]["className"] = "img-node-preview"),
      Object["assign"](this["_card"]["style"], {
        background: "var(--white-05)",
        border: "1px solid var(--stroke-10)",
        borderRadius: "18px",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        width: "100%",
        height: "100%",
        flexShrink: "0",
      }),
      (this["_img"] = document["createElement"]("img")),
      (this["_img"]["className"] = "node-img"),
      (this["_img"]["src"] = v66),
      this["_setImageLodSrc"](v65["lod"]),
      (this["_img"]["decoding"] = "async"),
      (this["_img"]["loading"] = "eager"));
    "fetchPriority" in this["_img"] && (this["_img"]["fetchPriority"] = "auto");
    (Object["assign"](this["_img"]["style"], {
      pointerEvents: "none",
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: v66 ? "block" : "none",
    }),
      (this["_maskOverlay"] = document["createElement"]("img")),
      (this["_maskOverlay"]["className"] = "node-img-mask-overlay"),
      Object["assign"](this["_maskOverlay"]["style"], {
        pointerEvents: "none",
      }),
      this["_applyMaskPreview"](v63["maskPreviewUrl"] || v63["maskPreview"]),
      (this["_jobUI"] = document["createElement"]("div")),
      (this["_jobUI"]["className"] = "node-job-ui"),
      Object["assign"](this["_jobUI"]["style"], {
        position: "absolute",
        inset: "0",
        zIndex: "5",
        display: "none",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-node)",
        pointerEvents: "none",
      }),
      (this["_hint"] = document["createElement"]("div")),
      (this["_hint"]["className"] = "node-upload-hint\x20source-upload-hint"),
      Object["assign"](this["_hint"]["style"], {
        position: "absolute",
        top: "12px",
        right: "12px",
        zIndex: "10",
        display: "block",
      }),
      (this["_uploadBtn"] = document["createElement"]("button")),
      (this["_uploadBtn"]["type"] = "button"),
      (this["_uploadBtn"]["className"] = "upload-btn source-upload-btn"));
    const v67 = "http://www.w3.org/2000/svg",
      v68 = document["createElementNS"](v67, "svg");
    (v68["setAttribute"]("width", "14"),
      v68["setAttribute"]("height", "14"),
      v68["setAttribute"]("viewBox", "0\x200\x2024\x2024"),
      v68["setAttribute"]("fill", "none"),
      v68["setAttribute"]("stroke", "currentColor"),
      v68["setAttribute"]("stroke-width", "2.5"));
    const v69 = document["createElementNS"](v67, "path");
    v69["setAttribute"](
      "d",
      "M21\x2015v4a2\x202\x200\x200\x201-2\x202H5a2\x202\x200\x200\x201-2-2v-4",
    );
    const v70 = document["createElementNS"](v67, "polyline");
    v70["setAttribute"]("points", "17 8 12 3 7 8");
    const v71 = document["createElementNS"](v67, "line");
    (v71["setAttribute"]("x1", "12"),
      v71["setAttribute"]("y1", "3"),
      v71["setAttribute"]("x2", "12"),
      v71["setAttribute"]("y2", "15"),
      v68["appendChild"](v69),
      v68["appendChild"](v70),
      v68["appendChild"](v71),
      this["_uploadBtn"]["appendChild"](v68),
      this["_uploadBtn"]["appendChild"](document["createTextNode"](" 上传")),
      this["_hint"]["appendChild"](this["_uploadBtn"]));
    const v72 = document["createElement"]("div");
    v72["className"] = "node-port\x20out-port";
    const v73 = document["createElement"]("div");
    ((v73["className"] = "node-resizer"),
      this["_card"]["appendChild"](this["_img"]),
      this["_card"]["appendChild"](this["_maskOverlay"]),
      this["_card"]["appendChild"](this["_jobUI"]),
      this["_card"]["appendChild"](this["_hint"]),
      this["_card"]["appendChild"](v72),
      this["_card"]["appendChild"](v73),
      v62["appendChild"](this["_card"]),
      this["_syncJobUI"](this["_currentJobStatus"]));
    if (
      shouldShowGenerationResultLoadingUi(v63, { hasResult: !!v66 }) &&
      !this["_currentJobStatus"]
    ) {
      startLoading(this["_card"], { variant: "static" });
      if (this["_hint"]) this["_hint"]["style"]["display"] = "none";
      if (this["_uploadBtn"]) this["_uploadBtn"]["disabled"] = true;
    }
    this["_card"]["addEventListener"]("dblclick", (v74) => {
      (v74["stopPropagation"](), openNodeImagePreview(this["_data"]));
    });
    const v75 = () => {
      if (
        !isCanvasLowZoomActive() &&
        this["_img"]?.["dataset"]?.["lodSrc"] !== "thumb"
      )
        return;
      ((this["_resolvedPreviewSig"] = ""),
        void this["_refreshImageDisplay"](true));
    };
    (this["_card"]["addEventListener"]("pointerenter", v75),
      this["_card"]["addEventListener"]("pointerleave", v75),
      (this["_input"] = document["createElement"]("input")),
      (this["_input"]["type"] = "file"),
      (this["_input"]["accept"] = "image/*"),
      (this["_input"]["style"]["display"] = "none"),
      v62["appendChild"](this["_input"]),
      this["_uploadBtn"]["addEventListener"]("click", (v76) => {
        (v76["stopPropagation"](), this["_input"]["click"]());
      }));
    v73 &&
      v73["addEventListener"]("pointerdown", (v77) => {
        const v78 =
            appStore["getStateRaw"]()["ui"]?.["imageVideoNodeResizeEnabled"] ===
            true,
          v79 = document["getElementById"]("v2-wrap")?.["classList"][
            "contains"
          ]("v2-media-node-resize-enabled");
        if (!(v78 && v79)) return;
        startNodeResizePreview({
          event: v77,
          nodeId: this["id"],
          getNode: () =>
            appStore["getStateRaw"]()["nodes"]?.[this["id"]] || this["_data"],
          getViewport: () => appStore["getStateRaw"]()["viewport"],
          resolveSize: ({
            startWidth: v80,
            startHeight: v81,
            dx: v82,
            dy: v83,
          }) => {
            const v84 = v80 / v81,
              v85 = Math["max"](v82 / v80, v83 / v81),
              v86 = Math["max"](
                SOURCE_IMAGE_MIN_SIZE / v80,
                SOURCE_IMAGE_MIN_SIZE / v81,
              ),
              v87 = Math["max"](v86, 1 + v85),
              v88 = Math["max"](
                SOURCE_IMAGE_MIN_SIZE,
                Math["round"](v80 * v87),
              ),
              v89 = Math["max"](
                SOURCE_IMAGE_MIN_SIZE,
                Math["round"](v88 / v84),
              );
            return { width: v88, height: v89 };
          },
          buildFinalPatch: ({ startNode: v90 }) =>
            v90?.["needsAutoResize"] ? { needsAutoResize: false } : {},
          applyPatch: (v91) => appStore["updateNodeData"](this["id"], v91),
          commit: commit,
        });
      });
    (this["_input"]["addEventListener"]("change", async (v92) => {
      const v93 = v92["target"]["files"][0];
      if (!v93) return;
      ((this["_isUploading"] = true),
        startLoading(this["_card"], { variant: "static" }),
        (this["_img"]["style"]["display"] = "none"));
      const v94 = Array["from"](this["_uploadBtn"]["childNodes"])["map"](
        (v95) => v95["cloneNode"](true),
      );
      ((this["_uploadBtn"]["textContent"] = "转码中..."),
        (this["_uploadBtn"]["style"]["pointerEvents"] = "none"));
      try {
        const v96 = await new Promise((v97, v98) => {
            const v99 = URL["createObjectURL"](v93),
              v100 = new Image();
            ((v100["onload"] = () => {
              const v101 = Math["round"](
                  Number(v100["naturalWidth"] || v100["width"]) || 0,
                ),
                v102 = Math["round"](
                  Number(v100["naturalHeight"] || v100["height"]) || 0,
                ),
                v103 = document["createElement"]("canvas");
              ((v103["width"] = v101), (v103["height"] = v102));
              const v104 = v103["getContext"]("2d");
              ((v104["fillStyle"] = "var(--text-primary)"),
                v104["fillRect"](0, 0, v103["width"], v103["height"]),
                v104["drawImage"](v100, 0, 0),
                URL["revokeObjectURL"](v99),
                v103["toBlob"](
                  (v105) => {
                    if (!v105) {
                      v98(new Error("Canvas\x20转码失败"));
                      return;
                    }
                    const v106 = Math["random"]()
                        ["toString"](36)
                        ["substring"](2, 8),
                      v107 = v93["name"]["replace"](/\.[^/.]+$/, ""),
                      v108 = "upload_" + v106 + "_" + v107 + ".jpg";
                    v97({
                      file: new File([v105], v108, { type: "image/jpeg" }),
                      width: v101,
                      height: v102,
                    });
                  },
                  "image/jpeg",
                  0.85,
                ));
            }),
              (v100["onerror"] = () => {
                (URL["revokeObjectURL"](v99), v98(new Error("图片加载失败")));
              }),
              (v100["src"] = v99));
          }),
          v109 = v96["file"];
        this["_uploadBtn"]["textContent"] = "上传中...";
        const v110 = window["currentProjectId"] || "default_v2_project",
          v111 = await uploadFile(v109, v110),
          v112 =
            v111?.["displayLocalPath"] || v111?.["thumbLocalPath"]
              ? v111
              : await ensureLocalImageDerivatives(
                  v111?.["originalLocalPath"] || v111?.["localPath"],
                ),
          v113 = String(v111?.["url"] || v112?.["originalUrl"] || "")["trim"](),
          v114 = buildImageNodeStorageFields(v112),
          v115 = buildSourceImageUploadSizePatch(
            {
              width: v112?.["originalWidth"] || v114["originalWidth"],
              height: v112?.["originalHeight"] || v114["originalHeight"],
            },
            { width: v96["width"], height: v96["height"] },
          ),
          v116 = v93["name"]["replace"](/\.[^/.]+$/, "");
        appStore["renameNode"](this["id"], v116);
        const v117 = document["getElementById"](this["id"]),
          v118 = v117?.["__v2_name_el"];
        if (v118) v118["textContent"] = v116;
        (appStore["updateNodeData"](this["id"], {
          src: v113,
          assetId: v111?.["assetId"] || v112?.["assetId"] || "",
          derivativeStatus:
            v111?.["derivativeStatus"] ||
            v112?.["derivativeStatus"] ||
            v112?.["status"] ||
            "",
          ...v114,
          fileName: v112["filename"] || v111?.["filename"] || v109["name"],
          ...v115,
        }),
          !v114["thumbLocalPath"] && v113 && this["_queueThumbnail"](v113));
      } catch (v119) {
        (console["error"]("图片上传失败:", v119),
          alert("上传失败，请重试"),
          stopLoading(this["_card"]),
          this["_currentSrc"] && (this["_img"]["style"]["display"] = "block"));
      } finally {
        ((this["_isUploading"] = false),
          this["_uploadBtn"]["replaceChildren"](
            ...v94["map"]((v120) => v120["cloneNode"](true)),
          ),
          (this["_uploadBtn"]["style"]["pointerEvents"] = "auto"),
          (this["_input"]["value"] = ""));
      }
    }),
      void this["_refreshImageDisplay"](true));
    const v121 = v62["querySelector"](".node-floating-toolbar");
    return (
      bindImageToolbarEvents(v121, this["id"]),
      v62["addEventListener"]("v2-node:free-angle", (v122) => {
        (v122["stopPropagation"](), this["_switchToFreeAngle"]());
      }),
      !isTaskFailed(this["_data"]) &&
        !isTaskCancelled(this["_data"]) &&
        (this["_maybeResumeRunningHubTask"](),
        this["_maybeResumeDreaminaTask"](),
        this["_maybeResumeAsyncTask"]()),
      v62
    );
  }
  async ["_switchToFreeAngle"]() {
    if (
      ImageFreeAngleController["active"] &&
      ImageFreeAngleController["nodeId"] === this["id"]
    ) {
      ImageFreeAngleController["_exit"]();
      return;
    }
    if (window["v2FocusOnNodeAtZoomPercent"])
      window["v2FocusOnNodeAtZoomPercent"](this["id"], 60);
    const v123 = this["el"]["querySelector"](".act-multiangle");
    ((this["_bottomPanel"] = document["createElement"]("div")),
      (this["_bottomPanel"]["className"] = "text-prompt-panel"),
      this["_bottomPanel"]["addEventListener"]("pointerdown", (v124) => {
        v124["stopPropagation"]();
      }),
      await ImageFreeAngleController["render"](
        this["id"],
        this["_bottomPanel"],
        () => this["_switchToImage"](),
        () => this["_handleGenerate"](),
        v123,
      ),
      this["el"]["appendChild"](this["_bottomPanel"]));
  }
  ["_switchToImage"]() {
    this["_bottomPanel"] &&
      this["_bottomPanel"]["parentNode"] &&
      (this["_bottomPanel"]["parentNode"]["removeChild"](this["_bottomPanel"]),
      (this["_bottomPanel"] = null));
  }
  ["_handleGenerate"]() {
    if (window["showToast"])
      window["showToast"]("源图像节点不支持生成功能", "info");
  }
  ["_showLowZoomThumb"](v125) {
    const v126 = String(v125 || "")["trim"]();
    if (!v126) {
      this["_showImg"]("", "");
      return;
    }
    (stopLoading(this["_card"]), (this["_currentSrc"] = v126));
    this["_img"] &&
      (this["_setImageLodSrc"]("thumb"),
      String(this["_img"]["getAttribute"]("src") || "")["trim"]() !== v126 &&
        (this["_img"]["src"] = v126),
      (this["_img"]["style"]["display"] = "block"));
    if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
  }
  ["_showImg"](v127, v128 = "") {
    if (!v127) {
      (stopLoading(this["_card"]),
        this["_setImageLodSrc"](""),
        (this["_img"]["style"]["display"] = "none"));
      if (this["_data"]?.["isGenerating"]) {
        if (this["_hint"]) this["_hint"]["style"]["display"] = "none";
      } else {
        if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
      }
      return;
    }
    const v129 = String(v128 || this["_cachedThumbUrl"] || "")["trim"]();
    try {
      const v130 = {
        t: Math["round"](performance["now"]()),
        id: this["id"],
        url: v127,
        fallbackThumb: v129,
        currentSrc: this["_currentSrc"] || "",
        isGenerating: !!this["_data"]?.["isGenerating"],
        jobStatus: this["_data"]?.["jobStatus"] || "",
      };
      (console["log"]("[drag-import-prof] SourceImageNode:show-img", v130),
        globalThis["window"]?.["electronAPI"]?.["logDragImport"]?.(
          "SourceImageNode:show-img",
          v130,
        ));
    } catch {}
    if (this["_failedSrc"] === v127 && v129) {
      (this["_setImageLodSrc"]("placeholder"),
        (this["_img"]["src"] = v129),
        (this["_img"]["style"]["display"] = "block"));
      if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
      return;
    }
    const v131 = String(this["_img"]?.["getAttribute"]("src") || "")["trim"](),
      v132 =
        this["_currentSrc"] === v127 &&
        v131 === v127 &&
        this["_img"]["style"]["display"] !== "none";
    let v133 = false;
    if (v129 && this["_currentSrc"] !== v127) {
      (this["_setImageLodSrc"]("placeholder"),
        (this["_img"]["src"] = v129),
        (this["_img"]["style"]["display"] = "block"));
      if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
      v133 = true;
    } else {
      if (this["_currentSrc"] !== v127) {
        const v134 = String(this["_img"]?.["getAttribute"]("src") || "")[
            "trim"
          ](),
          v135 = !v134 || this["_img"]["style"]["display"] === "none";
        if (!v129 && v135) {
          (this["_setImageLodSrc"]("full"),
            (this["_img"]["src"] = v127),
            (this["_img"]["style"]["display"] = "block"));
          if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
        } else this["_img"]["style"]["display"] = "none";
      }
    }
    this["_currentSrc"] = v127;
    const v136 = String(this["_img"]?.["getAttribute"]("src") || "")["trim"](),
      v137 = v136 === v127 && this["_img"]["style"]["display"] !== "none",
      v138 =
        !!v129 &&
        (v133 || v136 === v129) &&
        this["_img"]["style"]["display"] !== "none";
    !v137 && !v138
      ? startLoading(this["_card"], { variant: "static" })
      : stopLoading(this["_card"]);
    if (v132) {
      const v139 = appStore["getStateRaw"]()["nodes"]?.[this["id"]],
        v140 =
          Number(v139?.["imageWidth"] || 0) > 0 &&
          Number(v139?.["imageHeight"] || 0) > 0,
        v141 =
          v139?.["fixedSize"] !== true && v139?.["needsAutoResize"] === true;
      if (v140 && !v141) {
        if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
        return;
      }
    }
    queueSourceImagePreload(v127)
      ["then"](({ image: v142, naturalWidth: v143, naturalHeight: v144 }) => {
        if (this["_currentSrc"] !== v127) return;
        try {
          const v145 = {
            t: Math["round"](performance["now"]()),
            id: this["id"],
            url: v127,
            naturalWidth: v143 || v142?.["naturalWidth"] || 0,
            naturalHeight: v144 || v142?.["naturalHeight"] || 0,
          };
          (console["log"](
            "[drag-import-prof] SourceImageNode:preload:onload",
            v145,
          ),
            globalThis["window"]?.["electronAPI"]?.["logDragImport"]?.(
              "SourceImageNode:preload:onload",
              v145,
            ));
        } catch {}
        const v146 = Math["max"](
            1,
            Math["round"](v143 || v142?.["naturalWidth"] || 0),
          ),
          v147 = Math["max"](
            1,
            Math["round"](v144 || v142?.["naturalHeight"] || 0),
          ),
          v148 = appStore["getStateRaw"]()["nodes"]?.[this["id"]];
        if (v148) {
          const v149 = Number(v148["imageWidth"] || 0),
            v150 = Number(v148["imageHeight"] || 0);
          (v149 !== v146 || v150 !== v147) &&
            appStore["updateNodeData"](this["id"], {
              imageWidth: v146,
              imageHeight: v147,
            });
        }
        !v137 &&
          (stopLoading(this["_card"]),
          this["_setImageLodSrc"]("full"),
          (this["_img"]["src"] = v127));
        this["_img"]["style"]["display"] = "block";
        if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
        this["_activeCapturePreviewUrl"] &&
          this["_activeCapturePreviewUrl"] !== v127 &&
          (this["_releaseActiveCapturePreviewUrl"](),
          v148?.["capturePreviewUrl"] &&
            appStore["updateNodeData"](this["id"], { capturePreviewUrl: "" }));
        !String(v148?.["thumbLocalPath"] || "")["trim"]() &&
          this["_queueThumbnail"](v127);
        if (this["_data"]["fixedSize"]) return;
        if (!this["_data"]["needsAutoResize"]) return;
        const { width: v151, height: v152 } = getAutoMediaSizeByShortSide(
          v146 || 1000,
          v147 || 1000,
        );
        appStore["updateNodeData"](this["id"], {
          width: v151,
          height: v152,
          needsAutoResize: false,
        });
      })
      ["catch"](() => {
        if (this["_currentSrc"] !== v127) return;
        (stopLoading(this["_card"]), (this["_failedSrc"] = v127));
        v129
          ? (this["_setImageLodSrc"]("placeholder"),
            (this["_img"]["src"] = v129),
            (this["_img"]["style"]["display"] = "block"))
          : (this["_setImageLodSrc"](""),
            (this["_img"]["src"] = ""),
            (this["_img"]["style"]["display"] = "none"));
        if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
      });
  }
  ["_computeGenerationDuration"](v153 = this["_data"]) {
    if (!v153) return 0;
    if (typeof v153["generationDuration"] === "number")
      return v153["generationDuration"];
    const v154 = Number(v153["generationStartTime"] || 0);
    if (!Number["isFinite"](v154) || v154 <= 0) return 0;
    return Math["max"](0, Date["now"]() - v154);
  }
  ["_inferAsyncProvider"](v155 = this["_data"]) {
    const v156 = String(v155?.["model"] || "")["trim"](),
      v157 = resolveModelProvider(v156, "", { allowProviderHint: false });
    if (v157) return v157;
    const v158 = String(v155?.["asyncTaskProvider"] || v155?.["provider"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (v158) return v158;
    if (v156 && !v156["includes"]("/")) return "grsai";
    return "grsai";
  }
  ["_isRunningHubRecoverableTask"](v159 = this["_data"]) {
    if (!v159 || typeof v159 !== "object") return false;
    const v160 = String(v159["rhTaskId"] || "")["trim"]();
    if (!v160) return false;
    const v161 = String(v159["rhTaskStatus"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (["success", "idle", "cancelled"]["includes"](v161)) return false;
    if (v161 === "failed" && !this["_isRunningHubLocalPendingFailure"](v159))
      return false;
    const v162 = String(v159["provider"] || "")
        ["trim"]()
        ["toLowerCase"](),
      v163 = String(v159["model"] || "")["trim"](),
      v164 = resolveModelProvider(v163, v162, { allowProviderHint: false });
    return (
      v162 === "runninghubwf" ||
      v162 === "runninghub" ||
      isWorkflowModel(v163, v162 || "runninghubwf") ||
      (v164 === "runninghub" && isModelApiModel(v163, "runninghub"))
    );
  }
  ["_isRunningHubLocalPendingFailure"](v165 = this["_data"]) {
    const v166 = [
      v165?.["outputText"],
      v165?.["jobError"],
      v165?.["rhStatusMessage"],
    ]
      ["map"]((v167) => String(v167 || "")["trim"]())
      ["filter"](Boolean)
      ["join"]("\x0a")
      ["toLowerCase"]();
    if (!v166) return false;
    return (
      v166["includes"]("任务超时") ||
      v166["includes"]("请求超时") ||
      v166["includes"]("处理超时") ||
      v166["includes"]("仍在生成") ||
      v166["includes"]("继续查询") ||
      v166["includes"]("runninghub\x20仍在生成"["toLowerCase"]())
    );
  }
  ["_clearRunningHubRecoveryRetry"]() {
    if (!this["_rhResumeRetryTimer"]) return;
    (clearTimeout(this["_rhResumeRetryTimer"]),
      (this["_rhResumeRetryTimer"] = null));
  }
  ["_scheduleRunningHubRecoveryRetry"](v168 = 5000) {
    (this["_clearRunningHubRecoveryRetry"](),
      (this["_rhResumeRetryTimer"] = setTimeout(
        () => {
          ((this["_rhResumeRetryTimer"] = null),
            this["_maybeResumeRunningHubTask"]());
        },
        Math["max"](1000, Number(v168) || 5000),
      )));
  }
  ["_isDreaminaRecoverableTask"](v169 = this["_data"]) {
    if (!v169 || typeof v169 !== "object") return false;
    const v170 = String(v169["dreaminaSubmitId"] || "")["trim"]();
    if (!v170) return false;
    const v171 = String(v169["provider"] || "")
        ["trim"]()
        ["toLowerCase"](),
      v172 = String(v169["model"] || "")["trim"]();
    if (
      !(v171 === "dreamina" || resolveModelProvider(v172, v171) === "dreamina")
    )
      return false;
    const v173 = normalizeTaskStatus(v169["jobStatus"]),
      v174 = normalizeTaskStatus(v169["dreaminaTaskPhase"]),
      v175 = normalizeTaskStatus(v169["dreaminaTaskStatus"]);
    if (NON_RECOVERABLE_FAILURE_STATUSES["has"](v173)) return false;
    if (DREAMINA_NON_RECOVERABLE_PHASES["has"](v174)) return false;
    if (DREAMINA_NON_RECOVERABLE_STATUSES["has"](v175)) return false;
    if (
      v169["isGenerating"] === true &&
      v169["dreaminaTaskRecovering"] !== true
    ) {
      const v176 = Number(
        v169["dreaminaTaskLastCheckedAt"] ||
          v169["dreaminaTaskStartedAt"] ||
          v169["generationStartTime"] ||
          0,
      );
      if (
        Number["isFinite"](v176) &&
        v176 > 0 &&
        Date["now"]() - v176 < DREAMINA_STALE_ACTIVE_RESUME_MS
      )
        return false;
    }
    return true;
  }
  ["_isDreaminaPollTimeoutError"](v177) {
    const v178 = String(v177?.["code"] || "")
      ["trim"]()
      ["toUpperCase"]();
    if (v178 === DREAMINA_POLL_TIMEOUT_CODE || v178 === "TIMEOUT") return true;
    const v179 = String(v177?.["type"] || "")
      ["trim"]()
      ["toUpperCase"]();
    if (v179 === "TIMEOUT" || v179 === "TASK_TIMEOUT") return true;
    const v180 = String(v177?.["message"] || "")
      ["trim"]()
      ["toLowerCase"]();
    return v180["includes"]("timeout") || v180["includes"]("超时");
  }
  ["_isAsyncRecoverableTask"](v181 = this["_data"]) {
    if (!v181 || typeof v181 !== "object") return false;
    const v182 = String(v181["asyncTaskId"] || "")["trim"]();
    if (!v182) return false;
    const v183 = this["_inferAsyncProvider"](v181);
    if (
      !v183 ||
      v183 === "runninghubwf" ||
      v183 === "runninghub" ||
      v183 === "dreamina"
    )
      return false;
    const v184 = String(v181["asyncTaskKind"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (v184 && v184 !== "image") return false;
    const v185 = String(v181["asyncTaskStatus"] || "")
      ["trim"]()
      ["toLowerCase"]();
    if (["success", "failed", "idle", "cancelled"]["includes"](v185))
      return false;
    return true;
  }
  ["_stopRunningHubRecovery"](v186 = true) {
    try {
      this["_rhResumeAbortController"]?.["abort"]?.();
    } catch {}
    (this["_clearRunningHubRecoveryRetry"](),
      (this["_rhResumeAbortController"] = null),
      (this["_rhResumePromise"] = null),
      (this["_rhResumeTaskId"] = ""));
    if (!v186) return;
    const v187 = appStore["getState"]()["nodes"]?.[this["id"]];
    if (!v187 || v187["rhTaskRecovering"] !== true) return;
    appStore["updateNodeData"](this["id"], { rhTaskRecovering: false });
  }
  ["_stopDreaminaRecovery"](v188 = true) {
    try {
      this["_dreaminaResumeAbortController"]?.["abort"]?.();
    } catch {}
    ((this["_dreaminaResumeAbortController"] = null),
      (this["_dreaminaResumePromise"] = null),
      (this["_dreaminaResumeSubmitId"] = ""));
    if (!v188) return;
    const v189 = appStore["getState"]()["nodes"]?.[this["id"]];
    if (!v189 || v189["dreaminaTaskRecovering"] !== true) return;
    appStore["updateNodeData"](this["id"], { dreaminaTaskRecovering: false });
  }
  ["_stopAsyncRecovery"](v190 = true) {
    try {
      this["_asyncResumeAbortController"]?.["abort"]?.();
    } catch {}
    ((this["_asyncResumeAbortController"] = null),
      (this["_asyncResumePromise"] = null),
      (this["_asyncResumeTaskId"] = ""));
    if (!v190) return;
    const v191 = appStore["getState"]()["nodes"]?.[this["id"]];
    if (!v191 || v191["asyncTaskRecovering"] !== true) return;
    appStore["updateNodeData"](this["id"], { asyncTaskRecovering: false });
  }
  ["_resolveRunningHubResumePayload"](v192) {
    const v193 = String(v192?.["model"] || "")["trim"](),
      v194 = String(v192?.["provider"] || "")
        ["trim"]()
        ["toLowerCase"]();
    let v195 = v194;
    return (
      !v195 &&
        (v195 = isModelApiModel(v193, "runninghub")
          ? "runninghub"
          : "runninghubwf"),
      { model: v193, provider: v195 }
    );
  }
  ["_resolveDreaminaResumePayload"](v196) {
    return {
      model:
        String(v196?.["model"] || "")["trim"]() ||
        getDefaultDreaminaImageModelId(),
      provider: "dreamina",
    };
  }
  ["_resolveAsyncResumePayload"](v197) {
    return {
      model: String(v197?.["model"] || "")["trim"](),
      provider: this["_inferAsyncProvider"](v197),
    };
  }
  ["_fileNameFromPath"](v198) {
    const v199 = String(v198 || "")["replace"](/^\/+/, "");
    if (!v199) return "";
    const v200 = v199["split"]("/");
    return String(v200[v200["length"] - 1] || "")["trim"]();
  }
  ["_buildRecoveredImageResultPatch"](v201, v202 = "图片任务恢复失败") {
    const v203 =
      v201?.["isBatch"] && Array["isArray"](v201["images"])
        ? v201["images"][0]
        : v201;
    if (!v203 || v203["error"])
      throw new Error(String(v203?.["error"] || v202));
    const v204 = buildCanvasLocalImageFields(v203, { includeSrc: true });
    if (!v204["src"] || !v204["localPath"])
      throw new Error("未获取到可用的输出图片");
    return { ...v204, fileName: this["_fileNameFromPath"](v204["localPath"]) };
  }
  ["_maybeResumeRunningHubTask"]() {
    const v205 = appStore["getState"]()["nodes"]?.[this["id"]] || this["_data"];
    if (!this["_isRunningHubRecoverableTask"](v205)) {
      this["_stopRunningHubRecovery"](true);
      return;
    }
    const v206 = String(v205?.["rhTaskId"] || "")["trim"]();
    if (!v206) return;
    if (this["_rhResumePromise"] && this["_rhResumeTaskId"] === v206) return;
    const v207 =
        Number(
          v205?.["rhTaskStartedAt"] || v205?.["generationStartTime"] || 0,
        ) || Date["now"](),
      v208 = this["_resolveRunningHubResumePayload"](v205),
      v209 = v205?.["rhTaskUseOpenapiQuery"] === true,
      v210 =
        typeof this["_resumeRunningHubTaskPoller"] === "function"
          ? this["_resumeRunningHubTaskPoller"]
          : resumeRunningHubImageTask,
      v211 = new AbortController();
    ((this["_rhResumeAbortController"] = v211),
      (this["_rhResumeTaskId"] = v206));
    const v212 = (async () => {
      try {
        const v213 = await resumeTask(
          {
            sourceNodeId: this["id"],
            targetNodeId: this["id"],
            trigger: "node",
            taskType: "image-generation",
            provider: v208["provider"] || v205?.["provider"] || "runninghubwf",
            adapterType: "workflow",
            modelId: v208["model"] || v205?.["model"] || "",
            executionId:
              "runninghub.source-image." +
              (v208["model"] || v205?.["model"] || "workflow"),
            payload: v208,
            taskId: v206,
            cancellable: false,
            resumable: true,
            startBuilder: () => ({
              rhTaskStatus:
                String(v205?.["rhTaskStatus"] || "")
                  ["trim"]()
                  ["toLowerCase"]() === "pending"
                  ? "pending"
                  : "running",
              rhTaskUseOpenapiQuery: v209,
            }),
            poll: async () =>
              v210(v206, v208, {
                signal: v211["signal"],
                useOpenapiQuery: v209,
                softTimeout: true,
              }),
            resultBuilder: async (v214) => {
              const v215 = appStore["getState"]()["nodes"]?.[this["id"]] || {},
                v216 = String(v215?.["name"] || "图像结果")
                  ["replace"](/\s*\(处理中\)\s*$/, "")
                  ["replace"](/\s*\(恢复中\)\s*$/, "")
                  ["trim"]();
              return {
                ...this["_buildRecoveredImageResultPatch"](
                  v214,
                  "图片任务恢复失败",
                ),
                name: v216 || "图像结果",
                generationDuration: this["_computeGenerationDuration"](v215),
              };
            },
            failureBuilder: (v217, v218) => {
              const v219 =
                  v217 instanceof Error
                    ? v217["message"]
                    : String(v217 || "任务恢复失败"),
                v220 = appStore["getState"]()["nodes"]?.[this["id"]] || {};
              return buildSourceImageRecoveryFailurePatch(v220, {
                error: v219,
                startedAt: v218["startedAt"],
                duration: this["_computeGenerationDuration"](v220),
              });
            },
            parseError: (v221) =>
              v221 instanceof Error
                ? v221["message"]
                : String(v221 || "任务恢复失败"),
          },
          { store: appStore, startedAt: v207, abortController: v211 },
        );
        if (v213["status"] === "pending") {
          (window["_triggerLocalCacheSave"]?.(),
            this["_scheduleRunningHubRecoveryRetry"]());
          return;
        }
        v213["status"] === "success" && window["_triggerLocalCacheSave"]?.();
      } catch (v222) {
        if (
          v211["signal"]["aborted"] ||
          String(v222?.["message"] || "") === "CANCELLED" ||
          v222?.["name"] === "AbortError"
        )
          return;
        const v223 =
            v222 instanceof Error
              ? v222["message"]
              : String(v222 || "任务恢复失败"),
          v224 = appStore["getState"]()["nodes"]?.[this["id"]];
        if (!v224) return;
        appStore["updateNodeData"](this["id"], {
          ...buildSourceImageRecoveryFailurePatch(v224, {
            error: v223,
            startedAt: v207,
            duration: this["_computeGenerationDuration"](v224),
          }),
          isGenerating: false,
          rhTaskStatus: "failed",
          rhTaskRecovering: false,
        });
      } finally {
        (this["_rhResumeAbortController"] === v211 &&
          (this["_rhResumeAbortController"] = null),
          this["_rhResumeTaskId"] === v206 && (this["_rhResumeTaskId"] = ""),
          (this["_rhResumePromise"] = null));
      }
    })();
    this["_rhResumePromise"] = v212;
  }
  ["_maybeResumeDreaminaTask"]() {
    const v225 = appStore["getState"]()["nodes"]?.[this["id"]] || this["_data"];
    if (!this["_isDreaminaRecoverableTask"](v225)) {
      this["_stopDreaminaRecovery"](true);
      return;
    }
    const v226 = String(v225?.["dreaminaSubmitId"] || "")["trim"]();
    if (!v226) return;
    if (this["_dreaminaResumeSubmitId"] === v226) return;
    const v227 =
        Number(
          v225?.["dreaminaTaskStartedAt"] || v225?.["generationStartTime"] || 0,
        ) || Date["now"](),
      v228 = this["_resolveDreaminaResumePayload"](v225),
      v229 =
        typeof this["_dreaminaResumePoller"] === "function"
          ? this["_dreaminaResumePoller"]
          : resumeDreaminaImageTask,
      v230 = new AbortController();
    ((this["_dreaminaResumeAbortController"] = v230),
      (this["_dreaminaResumeSubmitId"] = v226));
    const v231 = (async () => {
      try {
        const v232 = await resumeTask(
          {
            sourceNodeId: this["id"],
            targetNodeId: this["id"],
            trigger: "node",
            taskType: "image-generation",
            provider: "dreamina",
            adapterType: "localRuntime",
            modelId: v228["model"] || v225?.["model"] || "",
            executionId:
              "dreamina.source-image." +
              (v228["model"] || v225?.["model"] || "image"),
            payload: v228,
            taskId: v226,
            cancellable: false,
            resumable: true,
            startBuilder: () => ({
              dreaminaSubmitId: v226,
              dreaminaTaskStatus: "pending",
              dreaminaTaskPhase: "generating",
              dreaminaTaskLabel:
                String(v225?.["dreaminaTaskLabel"] || "")["trim"]() || "生成中",
              dreaminaTaskStartedAt: v227,
              dreaminaTaskLastCheckedAt: Date["now"](),
              dreaminaTaskRecovering: true,
            }),
            poll: async () => v229(v226, v228, { signal: v230["signal"] }),
            resultBuilder: async (v233, v234) => {
              const v235 = appStore["getState"]()["nodes"]?.[this["id"]] || {},
                v236 = String(v235?.["name"] || "图像结果")
                  ["replace"](/\s*\(处理中\)\s*$/, "")
                  ["replace"](/\s*\(恢复中\)\s*$/, "")
                  ["trim"]();
              return {
                ...this["_buildRecoveredImageResultPatch"](
                  v233,
                  "即梦图片任务恢复失败",
                ),
                isGenerating: false,
                name: v236 || "图像结果",
                generationDuration: this["_computeGenerationDuration"](v235),
                dreaminaTaskStatus: "success",
                dreaminaTaskPhase: "done",
                dreaminaTaskLabel: "已完成",
                dreaminaTaskLastCheckedAt: Date["now"](),
                dreaminaTaskRecovering: false,
              };
            },
            failureBuilder: (v237, v238) => {
              const v239 =
                  v237 instanceof Error
                    ? v237["message"]
                    : String(v237 || "任务恢复失败"),
                v240 = appStore["getState"]()["nodes"]?.[this["id"]] || {};
              if (this["_isDreaminaPollTimeoutError"](v237))
                return {
                  isGenerating: true,
                  jobStatus: "running",
                  jobError: null,
                  generationDuration: Date["now"]() - v238["startedAt"],
                  dreaminaTaskStatus: "pending",
                  dreaminaTaskPhase: "generating",
                  dreaminaTaskLabel: "排队中（后台查询）",
                  dreaminaTaskStartedAt: v238["startedAt"],
                  dreaminaTaskLastCheckedAt: Date["now"](),
                  dreaminaTaskRecovering: false,
                };
              return {
                ...buildSourceImageRecoveryFailurePatch(v240, {
                  error: v239,
                  startedAt: v238["startedAt"],
                  duration: this["_computeGenerationDuration"](v240),
                }),
                isGenerating: false,
                dreaminaTaskStatus: "failed",
                dreaminaTaskPhase: "failed",
                dreaminaTaskLabel: v239 || "恢复失败",
                dreaminaTaskLastCheckedAt: Date["now"](),
                dreaminaTaskRecovering: false,
              };
            },
            cancelledBuilder: (v241) => ({
              isGenerating: false,
              generationDuration: Date["now"]() - v241["startedAt"],
              dreaminaTaskStatus: "cancelled",
              dreaminaTaskPhase: "cancelled",
              dreaminaTaskLabel: "已取消",
              dreaminaTaskStartedAt: v241["startedAt"],
              dreaminaTaskLastCheckedAt: Date["now"](),
              dreaminaTaskRecovering: false,
            }),
            parseError: (v242) =>
              v242 instanceof Error
                ? v242["message"]
                : String(v242 || "任务恢复失败"),
          },
          { store: appStore, startedAt: v227, abortController: v230 },
        );
        (v232["status"] === "success" ||
          v232["status"] === "pending" ||
          (v232["status"] === "failed" &&
            this["_isDreaminaPollTimeoutError"](v232["error"]))) &&
          window["_triggerLocalCacheSave"]?.();
      } catch (v243) {
        if (
          v230["signal"]["aborted"] ||
          String(v243?.["message"] || "") === "CANCELLED" ||
          v243?.["name"] === "AbortError"
        )
          return;
      } finally {
        (this["_dreaminaResumeAbortController"] === v230 &&
          (this["_dreaminaResumeAbortController"] = null),
          this["_dreaminaResumeSubmitId"] === v226 &&
            (this["_dreaminaResumeSubmitId"] = ""),
          (this["_dreaminaResumePromise"] = null));
      }
    })();
    this["_dreaminaResumePromise"] = v231;
  }
  ["_maybeResumeAsyncTask"]() {
    const v244 = appStore["getState"]()["nodes"]?.[this["id"]] || this["_data"];
    if (!this["_isAsyncRecoverableTask"](v244)) {
      this["_stopAsyncRecovery"](true);
      return;
    }
    const v245 = String(v244?.["asyncTaskId"] || "")["trim"]();
    if (!v245) return;
    if (this["_asyncResumePromise"] && this["_asyncResumeTaskId"] === v245)
      return;
    const v246 =
        Number(
          v244?.["asyncTaskStartedAt"] || v244?.["generationStartTime"] || 0,
        ) || Date["now"](),
      v247 = this["_resolveAsyncResumePayload"](v244),
      v248 = v247["provider"] || this["_inferAsyncProvider"](v244),
      v249 =
        typeof this["_resumeAsyncTaskPoller"] === "function"
          ? this["_resumeAsyncTaskPoller"]
          : resumeAsyncImageTask,
      v250 = new AbortController();
    ((this["_asyncResumeAbortController"] = v250),
      (this["_asyncResumeTaskId"] = v245));
    const v251 = (async () => {
      try {
        const v252 = await resumeTask(
          {
            sourceNodeId: this["id"],
            targetNodeId: this["id"],
            trigger: "node",
            taskType: "image-generation",
            provider: v248 || v247["provider"] || v244?.["provider"] || "",
            adapterType: "modelApi",
            modelId: v247["model"] || v244?.["model"] || "",
            executionId:
              (v248 || v247["provider"] || "model") + ".source-image.async",
            payload: v247,
            taskId: v245,
            async: true,
            cancellable: false,
            resumable: true,
            startBuilder: () => ({
              asyncTaskProvider: v248,
              asyncTaskKind: "image",
              asyncTaskStatus:
                String(v244?.["asyncTaskStatus"] || "")
                  ["trim"]()
                  ["toLowerCase"]() === "pending"
                  ? "pending"
                  : "running",
            }),
            poll: async () => v249(v245, v247, { signal: v250["signal"] }),
            resultBuilder: async (v253) => {
              const v254 = appStore["getState"]()["nodes"]?.[this["id"]] || {},
                v255 = String(v254?.["name"] || "图像结果")
                  ["replace"](/\s*\(处理中\)\s*$/, "")
                  ["replace"](/\s*\(恢复中\)\s*$/, "")
                  ["trim"]();
              return {
                ...this["_buildRecoveredImageResultPatch"](
                  v253,
                  "异步图片任务恢复失败",
                ),
                name: v255 || "图像结果",
                generationDuration: this["_computeGenerationDuration"](v254),
              };
            },
            failureBuilder: (v256, v257) => {
              const v258 =
                  v256 instanceof Error
                    ? v256["message"]
                    : String(v256 || "任务恢复失败"),
                v259 = appStore["getState"]()["nodes"]?.[this["id"]] || {};
              return buildSourceImageRecoveryFailurePatch(v259, {
                error: v258,
                startedAt: v257["startedAt"],
                duration: this["_computeGenerationDuration"](v259),
              });
            },
            parseError: (v260) =>
              v260 instanceof Error
                ? v260["message"]
                : String(v260 || "任务恢复失败"),
          },
          { store: appStore, startedAt: v246, abortController: v250 },
        );
        v252["status"] === "success" && window["_triggerLocalCacheSave"]?.();
      } catch (v261) {
        if (
          v250["signal"]["aborted"] ||
          String(v261?.["message"] || "") === "CANCELLED" ||
          v261?.["name"] === "AbortError"
        )
          return;
        const v262 =
            v261 instanceof Error
              ? v261["message"]
              : String(v261 || "任务恢复失败"),
          v263 = appStore["getState"]()["nodes"]?.[this["id"]];
        if (!v263) return;
        appStore["updateNodeData"](this["id"], {
          ...buildSourceImageRecoveryFailurePatch(v263, {
            error: v262,
            startedAt: v246,
            duration: this["_computeGenerationDuration"](v263),
          }),
          isGenerating: false,
          asyncTaskStatus: "failed",
          asyncTaskRecovering: false,
        });
      } finally {
        (this["_asyncResumeAbortController"] === v250 &&
          (this["_asyncResumeAbortController"] = null),
          this["_asyncResumeTaskId"] === v245 &&
            (this["_asyncResumeTaskId"] = ""),
          (this["_asyncResumePromise"] = null));
      }
    })();
    this["_asyncResumePromise"] = v251;
  }
  ["_syncJobUI"](v264) {
    if (!this["_jobUI"]) return;
    v264 = v264 || null;
    if (v264 === "running") {
      if (this["_getCapturePreviewUrl"](this["_data"])) {
        (stopLoading(this["_jobUI"]),
          (this["_jobUI"]["style"]["display"] = "none"),
          this["_jobUI"]["replaceChildren"]());
        if (this["_hint"]) this["_hint"]["style"]["display"] = "none";
        if (this["_uploadBtn"]) this["_uploadBtn"]["disabled"] = true;
        return;
      }
      ((this["_jobUI"]["style"]["display"] = "flex"),
        this["_jobUI"]["replaceChildren"](),
        startLoading(this["_jobUI"], { variant: "full" }));
      if (this["_hint"]) this["_hint"]["style"]["display"] = "none";
      if (this["_uploadBtn"]) this["_uploadBtn"]["disabled"] = true;
    } else {
      if (v264 === "error") {
        ((this["_jobUI"]["style"]["display"] = "flex"),
          this["_jobUI"]["replaceChildren"](),
          stopLoading(this["_jobUI"]));
        const v265 = document["createElement"]("div");
        ((v265["style"]["color"] = "var(--text-danger)"),
          (v265["style"]["fontSize"] = "13px"),
          (v265["style"]["textAlign"] = "center"),
          (v265["style"]["padding"] = "20px"),
          (v265["style"]["maxWidth"] = "90%"),
          (v265["style"]["wordBreak"] = "break-word"),
          (v265["textContent"] = getTaskMessage(this["_data"]) || "生成失败"),
          this["_jobUI"]["appendChild"](v265));
        if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
        if (this["_uploadBtn"]) this["_uploadBtn"]["disabled"] = false;
      } else {
        this["_jobUI"]["style"]["display"] !== "none" &&
          ((this["_jobUI"]["style"]["opacity"] = "0"),
          (this["_jobUI"]["style"]["transition"] = "opacity 0.4s ease"),
          setTimeout(() => {
            ((this["_jobUI"]["style"]["display"] = "none"),
              (this["_jobUI"]["style"]["opacity"] = "1"),
              (this["_jobUI"]["style"]["transition"] = ""),
              stopLoading(this["_jobUI"]));
          }, 400));
        if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
        if (this["_uploadBtn"]) this["_uploadBtn"]["disabled"] = false;
      }
    }
  }
  ["update"](v266) {
    if (!this["_img"]) return;
    const v267 = this["_currentJobStatus"];
    ((this["_data"] = v266),
      (this["_currentJobStatus"] = v266["jobStatus"] || null));
    const v268 =
      this["_getImageDisplayLod"](v266)["url"] ||
      this["_getCapturePreviewUrl"](v266);
    this["_currentJobStatus"] !== v267 &&
      this["_syncJobUI"](this["_currentJobStatus"]);
    const v269 =
      shouldShowGenerationResultLoadingUi(v266, { hasResult: !!v268 }) &&
      !this["_currentJobStatus"];
    if (v269) {
      startLoading(this["_card"], { variant: "static" });
      if (this["_hint"]) this["_hint"]["style"]["display"] = "none";
      if (this["_uploadBtn"]) this["_uploadBtn"]["disabled"] = true;
    } else {
      if (isTaskTerminal(v266)) {
        stopLoading(this["_card"]);
        if (this["_uploadBtn"]) this["_uploadBtn"]["disabled"] = false;
      } else {
        if (!this["_currentJobStatus"]) {
          !this["_isUploading"] &&
            v268 === this["_currentSrc"] &&
            stopLoading(this["_card"]);
          if (this["_uploadBtn"]) this["_uploadBtn"]["disabled"] = false;
        }
      }
    }
    (void this["_refreshImageDisplay"](),
      this["_applyMaskPreview"](v266["maskPreviewUrl"] || v266["maskPreview"]),
      !isTaskFailed(v266) &&
        !isTaskCancelled(v266) &&
        (this["_maybeResumeRunningHubTask"](),
        this["_maybeResumeDreaminaTask"](),
        this["_maybeResumeAsyncTask"]()));
  }
  ["unmount"]() {
    (this["_releaseActiveCapturePreviewUrl"](),
      this["_stopRunningHubRecovery"](false),
      this["_stopDreaminaRecovery"](false),
      this["_stopAsyncRecovery"](false));
  }
}
