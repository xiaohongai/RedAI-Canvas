import appStore from "../core/stores/appStore.js";
import { uploadFile } from "../modules/project.js";
import {
  cancelAudioSeparationTaskForNode,
  getRunningAudioSeparationTaskForNode,
  maybeResumeAudioSeparationLeader,
  runAudioSeparationFromNode,
} from "../modules/AudioSeparationController.js";
import { registerStaticInnerHTML, setStaticInnerHTML } from "../utils/dom.js";
import { startLoading, stopLoading } from "../modules/loadingOverlay.js";
import AudioClipController from "../modules/AudioClipController.js";
import { SOURCE_AUDIO_TOOLBAR_HTML } from "./NodeToolbarConfig.js";
import {
  deferWaveformPathUntilAudioReady,
  getWaveformBarsPathFromPersistedUrl,
  getWaveformBarsPathFromUrl,
} from "../utils/audioWaveform.js";
import { createAudioPlaybackProgressController } from "../utils/audioPlaybackProgress.js";
import {
  beginAudioPlayback,
  registerAudioPlaybackClient,
} from "../modules/audioPlaybackCoordinator.js";
import { resolveCanvasAudioUrl } from "../services/canvasMediaLocalService.js";
import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
  getMediaElementCurrentSource,
  getMediaElementPlaybackSourceKey,
  isMediaElementPlaybackSource,
} from "../services/desktopMediaBlobSource.js";
import { shouldShowGenerationResultLoadingUi } from "../core/generationTaskUiState.js";
import {
  localPathToUrl,
  pickResultLocalPath,
  urlToLocalPath,
} from "../utils/localMediaPath.js";
import { bindRunningHubToolbarTaskButton } from "./nodeToolbar/runningHubToolbarTaskButton.js";
import { bindAudioDownloadAction } from "./nodeToolbar/audioActions/downloadAction.js";
const WAVE =
    "M10,40 L10,40 M15,30 L15,50 M20,20 L20,60 M25,35 L25,45 M30,25 L30,55 M35,15 L35,65 M40,30 L40,50 M45,38 L45,42 M50,22 L50,58 M55,18 L55,62 M60,28 L60,52 M65,32 L65,48 M70,24 L70,56 M75,36 L75,44 M80,20 L80,60 M85,16 L85,64 M90,26 L90,54 M95,34 L95,46 M100,22 L100,58 M105,18 L105,62 M110,30 L110,50 M115,38 L115,42 M120,15 L120,65 M125,25 L125,55 M130,35 L130,45 M135,20 L135,60 M140,30 L140,50 M145,40 L145,40 M150,25 L150,55 M155,15 L155,65 M160,30 L160,50 M165,38 L165,42 M170,22 L170,58 M175,18 L175,62 M180,28 L180,52 M185,32 L185,48 M190,24 L190,56",
  _SOURCE_AUDIO_NODE_TEMPLATE_ID = "node:source-audio";
registerStaticInnerHTML(
  _SOURCE_AUDIO_NODE_TEMPLATE_ID,
  SOURCE_AUDIO_TOOLBAR_HTML +
    "\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22node-card\x20media-card\x20audio-card\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22waveform\x20waveform-bg\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x22100%\x22\x20height=\x2280\x22\x20viewBox=\x220\x200\x20200\x2080\x22\x20preserveAspectRatio=\x22none\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<path\x20d=\x22" +
    WAVE +
    '" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"/>\n            <path d="M0,40 L200,40" stroke="var(--blue)" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>\n          </svg>\n        </div>\n        <div class="waveform waveform-unplayed">\n          <svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">\n            <path d="' +
    WAVE +
    '" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"/>\n            <path d="M0,40 L200,40" stroke="var(--blue)" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>\n          </svg>\n        </div>\n        <div class="media-progress-line"></div>\n        <div class="media-progress-bar"></div>\n        \n        <div class="node-upload-hint audio-upload-hint source-upload-hint">\n          <button type="button" class="upload-btn audio-upload-btn source-upload-btn">\n            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 上传\n          </button>\n        </div>\n\n        <div class="audio-controls">\n           <button type="button" class="audio-play-btn">\n              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>\n           </button>\n           <div class="audio-time-wrap">\n             <span class="audio-time-display">0:00 / 0:00</span>\n           </div>\n        </div>\n        <audio class="audio-player"></audio>\n        <div class="node-port out-port"></div>\n        <div class="node-resizer"></div>\n      </div>',
);
export class SourceAudioNode {
  constructor(v0) {
    ((this["_data"] = v0),
      (this["el"] = document["createElement"]("div")),
      (this["id"] = v0["id"]),
      (this["el"]["className"] = "v2-node-component"),
      (this["_currentSrc"] = null),
      (this["_objUrl"] = null),
      (this["_waveKey"] = null),
      (this["_waveformLocalPath"] = ""),
      (this["_waveToken"] = 0),
      (this["_cancelDeferredWaveform"] = null),
      (this["_progressController"] = null));
  }
  ["_resolveAudioSrc"](v1) {
    return resolveCanvasAudioUrl(v1);
  }
  ["mount"]() {
    const v2 = this["el"];
    (setStaticInnerHTML(v2, _SOURCE_AUDIO_NODE_TEMPLATE_ID),
      (this["_card"] = v2["querySelector"](".media-card")),
      (this["_audio"] = v2["querySelector"](".audio-player")),
      (this["_audio"]["preload"] = "none"),
      (this["_playBtn"] = v2["querySelector"](".audio-play-btn")),
      (this["_timeEl"] = v2["querySelector"](".audio-time-display")),
      (this["_bar"] = v2["querySelector"](".media-progress-bar")),
      (this["_wavePlayed"] = v2["querySelector"](".waveform-unplayed")),
      (this["_progressLine"] = v2["querySelector"](".media-progress-line")),
      (this["_hint"] = v2["querySelector"](".node-upload-hint")),
      (this["_uploadBtn"] = v2["querySelector"](".upload-btn")),
      (this["_clipBtn"] = v2["querySelector"](".act-clip, .clip-btn")),
      (this["_separateBtn"] = v2["querySelector"](
        ".act-separate, .separate-btn",
      )),
      (this["_speedBtn"] = v2["querySelector"](".act-speed, .speed-btn")),
      (this["_downloadBtn"] = v2["querySelector"](
        ".act-download, .download-btn",
      )));
    {
      const v3 = v2["querySelectorAll"](".waveform-bg svg path");
      this["_waveBgPath"] = v3 && v3["length"] ? v3[0] : null;
      const v4 = v2["querySelectorAll"](".waveform-unplayed svg path");
      this["_waveFgPath"] = v4 && v4["length"] ? v4[0] : null;
    }
    this["_progressController"] = createAudioPlaybackProgressController({
      audioEl: this["_audio"],
      wavePlayedEl: this["_wavePlayed"],
      progressLineEl: this["_progressLine"],
      timeEl: this["_timeEl"],
      trackEl: this["_bar"],
      formatTime: (v5) => this["_fmt"](v5),
      shouldSuppressSync: () =>
        this["_isSeeking"] || this["_bar"]?.["dataset"]["dragging"] === "true",
    })["attach"]();
    const v6 = v2["querySelector"](".node-floating-toolbar");
    if (v6)
      v6["addEventListener"]("pointerdown", (v7) => v7["stopPropagation"]());
    ((this["_input"] = document["createElement"]("input")),
      (this["_input"]["type"] = "file"),
      (this["_input"]["accept"] = "audio/*"),
      (this["_input"]["style"]["display"] = "none"),
      v2["appendChild"](this["_input"]),
      this["_uploadBtn"]["addEventListener"]("pointerdown", (v8) => {
        (v8["stopPropagation"](), this["_input"]["click"]());
      }),
      this["_card"]["addEventListener"]("dblclick", (v9) => {
        v9["stopPropagation"]();
      }));
    let v10 = { x: 0, y: 0 };
    (this["_card"]["addEventListener"]("pointerdown", (v11) => {
      if (v11["target"]["closest"](".media-progress-bar")) return;
      v10 = { x: v11["clientX"], y: v11["clientY"] };
    }),
      this["_card"]["addEventListener"]("pointerup", (v12) => {
        if (
          v12["target"]["closest"](".media-progress-bar") ||
          v12["target"]["closest"](".audio-play-btn") ||
          v12["target"]["closest"](".upload-btn") ||
          v12["target"]["closest"](".node-floating-toolbar")
        )
          return;
        const v13 = Math["hypot"](
          v12["clientX"] - v10["x"],
          v12["clientY"] - v10["y"],
        );
        if (v13 < 5) {
          const v14 = this["_card"]["getBoundingClientRect"](),
            v15 = Math["max"](
              0,
              Math["min"](1, (v12["clientX"] - v14["left"]) / v14["width"]),
            ),
            v16 = this["_readAudioDurationSec"]();
          if (this["_audio"] && v16 > 0) {
            const v17 = v15 * v16;
            ((this["_audio"]["currentTime"] = v17),
              this["_progressController"]?.["sync"]({
                currentTime: v17,
                duration: v16,
                force: true,
                showLine: true,
              }));
          }
        }
      }),
      this["_bar"]?.["addEventListener"]("click", (v18) => {
        this["_seekTo"](v18["clientX"]);
      }),
      this["_input"]["addEventListener"]("change", async (v19) => {
        const v20 = v19["target"]["files"][0];
        if (!v20) return;
        (startLoading(this["_card"], { variant: "static" }),
          this["_progressController"]?.["reset"]());
        const v21 = Array["from"](this["_uploadBtn"]["childNodes"])["map"](
          (v22) => v22["cloneNode"](true),
        );
        ((this["_uploadBtn"]["textContent"] = "上传中..."),
          (this["_uploadBtn"]["style"]["pointerEvents"] = "none"));
        try {
          const v23 = window["currentProjectId"] || "default_v2_project",
            v24 = await uploadFile(v20, v23),
            v25 = v20["name"]["replace"](/\.[^/.]+$/, "");
          appStore["renameNode"](this["id"], v25);
          const v26 = document["getElementById"](this["id"]),
            v27 = v26?.["__v2_name_el"];
          if (v27) v27["textContent"] = v25;
          const v28 = v24["url"],
            v29 = pickResultLocalPath(v24) || urlToLocalPath(v28);
          appStore["updateNodeData"](this["id"], {
            src: v28,
            localPath: v29,
            audioDuration:
              Number(v24["audioDuration"] || v24["duration"] || 0) || 0,
            assetId: v24["assetId"] || "",
            originalLocalPath:
              v24["originalLocalPath"] || v24["localPath"] || "",
            waveformLocalPath: v24["waveformLocalPath"] || "",
            derivativeStatus: v24["derivativeStatus"] || v24["status"] || "",
            mediaTaskId: v24["mediaTaskId"] || "",
            mediaTaskKind: v24["mediaTaskKind"] || "",
            mediaTaskStatus: v24["mediaTaskStatus"] || "",
            mediaTaskProgress: Number(v24["mediaTaskProgress"] || 0) || 0,
            mediaTaskError: v24["mediaTaskError"] || "",
            fileName: v24["filename"] || v20["name"],
          });
        } catch (v30) {
          (console["error"]("音频上传失败:", v30),
            window["showToast"]("上传失败，请重试"),
            stopLoading(this["_card"]),
            this["_currentSrc"] &&
              this["_progressController"]?.["sync"]({
                force: true,
                showLine: true,
              }));
        } finally {
          (this["_uploadBtn"]["replaceChildren"](
            ...v21["map"]((v31) => v31["cloneNode"](true)),
          ),
            (this["_uploadBtn"]["style"]["pointerEvents"] = "auto"),
            (this["_input"]["value"] = ""));
        }
      }),
      this["_playBtn"]["addEventListener"]("pointerdown", (v32) => {
        (v32["stopPropagation"](),
          this["_audio"]["paused"] && this["_currentSrc"]
            ? this["_playAudio"]()
            : this["_audio"]["pause"]());
      }));
    const v33 = [1, 1.25, 1.5, 2];
    let v34 = 0;
    (this["_speedBtn"]?.["addEventListener"]("pointerdown", (v35) => {
      (v35["stopPropagation"](), (v34 = (v34 + 1) % v33["length"]));
      const v36 = v33[v34];
      ((this["_audio"]["playbackRate"] = v36),
        (this["_speedBtn"]["textContent"] = v36["toFixed"](1) + "x"));
    }),
      this["_clipBtn"]?.["addEventListener"]("pointerdown", (v37) => {
        (v37["stopPropagation"](), AudioClipController["init"](this["id"]));
      }),
      bindRunningHubToolbarTaskButton({
        button: this["_separateBtn"],
        getTask: () => getRunningAudioSeparationTaskForNode(this["id"]),
        cancelTask: () =>
          cancelAudioSeparationTaskForNode(this["id"], { notify: true }),
        cancelTooltip: "取消人声分离",
        eventTypes: ["pointerdown", "click"],
      }),
      this["_separateBtn"]?.["addEventListener"]("pointerdown", (v38) => {
        if (getRunningAudioSeparationTaskForNode(this["id"])) {
          (v38["preventDefault"](),
            v38["stopPropagation"](),
            void cancelAudioSeparationTaskForNode(this["id"], {
              notify: true,
            }));
          return;
        }
        (v38["stopPropagation"](), void runAudioSeparationFromNode(this["id"]));
      }),
      bindAudioDownloadAction({
        button: this["_downloadBtn"],
        getNodeData: () =>
          appStore["getState"]()["nodes"]?.[this["id"]] || this["_data"] || {},
        getAudioElement: () => this["_audio"],
        notifyMissing: () => window["showToast"]?.("没有可下载的音频", "warn"),
      }),
      this["_audio"]["addEventListener"]("play", () => this["_setIcon"](false)),
      this["_audio"]["addEventListener"]("pause", () => this["_setIcon"](true)),
      this["_unregisterAudioPlaybackClient"]?.(),
      (this["_unregisterAudioPlaybackClient"] = registerAudioPlaybackClient(
        this["id"],
        {
          stopForExternalPlayback: () =>
            this["_stopAudioForExternalPlayback"](),
        },
      )));
    const v39 = this["_resolveAudioSrc"](this["_data"]);
    if (v39) {
      this["_prepareAudio"](v39);
      if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
    } else {
      this["_progressController"]?.["reset"]();
      if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
    }
    return (
      this["_syncGeneratingUi"](this["_data"], v39),
      maybeResumeAudioSeparationLeader(this["id"]),
      v2
    );
  }
  ["_syncGeneratingUi"](v40, v41) {
    const v42 = shouldShowGenerationResultLoadingUi(v40, { hasResult: !!v41 });
    if (this["_uploadBtn"]) this["_uploadBtn"]["disabled"] = v42;
    if (v42) {
      startLoading(this["_card"], { variant: "full" });
      if (this["_hint"]) this["_hint"]["style"]["display"] = "none";
      return;
    }
    (stopLoading(this["_card"]), this["_clearResolvedAudioTimer"](v40, v41));
    if (!v41 && this["_hint"]) this["_hint"]["style"]["display"] = "block";
  }
  ["_clearResolvedAudioTimer"](v43, v44) {
    if (!v44 || !v43 || typeof v43 !== "object") return;
    if (!v43["generationStartTime"] && v43["generationDuration"] == null)
      return;
    const v45 = appStore["getState"]()["nodes"]?.[this["id"]];
    if (!v45) return;
    const v46 = {};
    if (v45["generationStartTime"]) v46["generationStartTime"] = null;
    if (v45["generationDuration"] != null) v46["generationDuration"] = null;
    if (v45["isGenerating"] === true) v46["isGenerating"] = false;
    Object["keys"](v46)["length"] > 0 &&
      appStore["updateNodeData"](this["id"], v46);
  }
  ["_seekTo"](v47) {
    const v48 = this["_readAudioDurationSec"]();
    if (!this["_audio"] || v48 <= 0) return;
    const v49 = this["_bar"]["getBoundingClientRect"]();
    if (v49["width"] === 0) return;
    let v50 = (v47 - v49["left"]) / v49["width"];
    v50 = Math["max"](0, Math["min"](1, v50));
    const v51 = v50 * v48;
    if (!isFinite(v51)) return;
    ((this["_isSeeking"] = true),
      (this["_audio"]["currentTime"] = v51),
      this["_progressController"]?.["sync"]({
        currentTime: v51,
        duration: v48,
        force: true,
        showLine: true,
      }),
      this["_audio"]["addEventListener"](
        "seeked",
        () => {
          ((this["_isSeeking"] = false),
            this["_progressController"]?.["sync"]({
              force: true,
              showLine: true,
            }));
        },
        { once: true },
      ));
  }
  ["_getAudioElementSource"]() {
    return getMediaElementPlaybackSourceKey(this["_audio"]);
  }
  ["_getAudioElementCurrentSource"]() {
    return getMediaElementCurrentSource(this["_audio"]);
  }
  ["_isAudioElementReady"]() {
    if (!this["_audio"] || !this["_getAudioElementCurrentSource"]())
      return false;
    const v52 = Number(this["_audio"]["readyState"] || 0);
    return v52 >= 2;
  }
  ["_readAudioDurationSec"]() {
    const v53 = Number(this["_audio"]?.["duration"]),
      v54 = appStore["getState"]()["nodes"]?.[this["id"]],
      v55 = Number(
        v54?.["audioDuration"] ||
          (!v54 ? this["_data"]?.["audioDuration"] : 0) ||
          0,
      );
    if (v55 > 0) {
      if (!(Number["isFinite"](v53) && v53 > 0)) return v55;
      const v56 = Math["max"](1, v55 * 0.25);
      if (Math["abs"](v55 - v53) > v56) return v55;
    }
    return Number["isFinite"](v53) && v53 > 0 ? v53 : 0;
  }
  ["_syncKnownAudioDurationUi"]({
    currentTime: currentTime = 0,
    showLine: showLine = false,
  } = {}) {
    const v57 = this["_readAudioDurationSec"]();
    if (!(v57 > 0)) return false;
    const v58 = Number(currentTime),
      v59 = Number["isFinite"](v58) ? Math["max"](0, Math["min"](v58, v57)) : 0,
      v60 = this["_progressController"]?.["sync"]({
        currentTime: v59,
        duration: v57,
        force: true,
        showLine: showLine,
      });
    if (!showLine) this["_progressController"]?.["hideLine"]?.();
    return (
      !v60 &&
        this["_timeEl"] &&
        (this["_timeEl"]["textContent"] =
          this["_fmt"](v59) + " / " + this["_fmt"](v57)),
      true
    );
  }
  ["_rewindEndedAudioIfNeeded"]() {
    if (!this["_audio"]) return;
    const v61 = this["_readAudioDurationSec"]();
    if (!(v61 > 0)) return;
    const v62 = Number(this["_audio"]["currentTime"] || 0),
      v63 = Number["isFinite"](v62) && v62 >= v61 - 0.05;
    if (this["_audio"]["ended"] !== true && !v63) return;
    try {
      this["_audio"]["currentTime"] = 0;
    } catch {}
    this["_progressController"]?.["sync"]({
      currentTime: 0,
      duration: v61,
      force: true,
      showLine: true,
    });
  }
  ["_clearAudioElementSource"]() {
    if (!this["_audio"]) return;
    try {
      this["_audio"]["pause"]?.();
    } catch {}
    (this["_audio"]["removeAttribute"]?.("src"),
      clearDesktopMediaPlaybackSourceMetadata(this["_audio"]),
      (this["_audio"]["preload"] = "none"));
    try {
      this["_audio"]["load"]?.();
    } catch {}
  }
  ["_bindAudioLoadHandlers"](v64) {
    if (!this["_audio"]) return;
    const v65 = () => {
      if (this["_currentSrc"] === v64) this["_rememberAudioDuration"](v64);
    };
    ((this["_audio"]["onloadedmetadata"] = v65),
      (this["_audio"]["ondurationchange"] = v65));
    const v66 = () => {
      this["_currentSrc"] === v64 &&
        (this["_rememberAudioDuration"](v64), stopLoading(this["_card"]));
    };
    ((this["_audio"]["onloadeddata"] = v66),
      (this["_audio"]["oncanplay"] = v66),
      (this["_audio"]["onplaying"] = v66),
      (this["_audio"]["onerror"] = () => {
        if (this["_currentSrc"] === v64) stopLoading(this["_card"]);
      }));
  }
  ["_prepareAudio"](v67) {
    if (!v67) {
      typeof this["_cancelDeferredWaveform"] === "function" &&
        (this["_cancelDeferredWaveform"](),
        (this["_cancelDeferredWaveform"] = null));
      (this["_clearAudioElementSource"](),
        (this["_currentSrc"] = null),
        this["_progressController"]?.["reset"](),
        stopLoading(this["_card"]));
      return;
    }
    const v68 = this["_currentSrc"],
      v69 = v68 !== v67;
    v69 && this["_progressController"]?.["reset"]();
    this["_currentSrc"] = v67;
    if (v69 && v68) {
      const v70 = appStore["getState"]()["nodes"]?.[this["id"]];
      Number(v70?.["audioDuration"] || 0) > 0 &&
        appStore["updateNodeData"](this["id"], { audioDuration: 0 });
    }
    this["_getAudioElementSource"]() && this["_clearAudioElementSource"]();
    ((this["_audio"]["preload"] = "none"),
      this["_bindAudioLoadHandlers"](v67),
      this["_syncKnownAudioDurationUi"]({ currentTime: 0, showLine: false }),
      stopLoading(this["_card"]),
      void this["_ensureWaveform"](v67, { persistedOnly: true }));
    if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
  }
  async ["_loadAudio"](v71, { showLoading: showLoading = true } = {}) {
    if (!v71) return (this["_prepareAudio"](""), false);
    const v72 = this["_currentSrc"],
      v73 = v72 !== v71;
    v73 && this["_progressController"]?.["reset"]();
    this["_currentSrc"] = v71;
    const v74 = !!this["_getAudioElementCurrentSource"](),
      v75 = !isMediaElementPlaybackSource(this["_audio"], v71) || !v74;
    this["_bindAudioLoadHandlers"](v71);
    if (!v75 && this["_isAudioElementReady"]()) {
      if (this["_audio"]["preload"] !== "auto")
        this["_audio"]["preload"] = "auto";
      return (stopLoading(this["_card"]), true);
    }
    if (showLoading && v75) startLoading(this["_card"], { variant: "static" });
    if (!v75) {
      if (this["_audio"]["preload"] !== "auto")
        this["_audio"]["preload"] = "auto";
      try {
        this["_audio"]["load"]?.();
      } catch {}
    } else
      await attachMediaElementPlaybackSource(this["_audio"], v71, {
        preload: "auto",
        warmRanges: false,
      });
    if (this["_isAudioElementReady"]()) stopLoading(this["_card"]);
    typeof this["_cancelDeferredWaveform"] === "function" &&
      (this["_cancelDeferredWaveform"](),
      (this["_cancelDeferredWaveform"] = null));
    this["_cancelDeferredWaveform"] = deferWaveformPathUntilAudioReady(
      this["_audio"],
      () => {
        this["_cancelDeferredWaveform"] = null;
        if (this["_currentSrc"] !== v71) return;
        void this["_ensureWaveform"](v71);
      },
    );
    if (this["_hint"]) this["_hint"]["style"]["display"] = "block";
    return true;
  }
  async ["_ensureWaveform"](
    v76,
    { persistedOnly: persistedOnly = false } = {},
  ) {
    const v77 = String(v76 || "")["trim"]();
    if (!v77) return;
    const v78 = ++this["_waveToken"];
    this["_waveKey"] = v77;
    const v79 = localPathToUrl(this["_data"]?.["waveformLocalPath"]);
    this["_waveformLocalPath"] = String(
      this["_data"]?.["waveformLocalPath"] || "",
    )["trim"]();
    const v80 = { width: 200, height: 80, samples: 190 };
    let v81 = "";
    v79 && (v81 = await getWaveformBarsPathFromPersistedUrl(v79, v80));
    !v81 &&
      !persistedOnly &&
      (v81 = await getWaveformBarsPathFromUrl(v77, v80));
    if (!this["_audio"] || !this["el"] || !this["el"]["isConnected"]) return;
    if (v78 !== this["_waveToken"]) return;
    if (!v81) return;
    if (this["_waveBgPath"]) this["_waveBgPath"]["setAttribute"]("d", v81);
    if (this["_waveFgPath"]) this["_waveFgPath"]["setAttribute"]("d", v81);
  }
  ["_fmt"](v82) {
    if (!v82 || isNaN(v82)) return "0:00";
    return (
      Math["floor"](v82 / 60) +
      ":" +
      String(Math["floor"](v82 % 60))["padStart"](2, "0")
    );
  }
  ["_setIcon"](v83) {
    const v84 = this["_playBtn"]["querySelector"]("svg");
    if (!v84) return;
    const v85 = "http://www.w3.org/2000/svg";
    while (v84["firstChild"]) v84["removeChild"](v84["firstChild"]);
    if (v83) {
      const v86 = document["createElementNS"](v85, "polygon");
      (v86["setAttribute"]("points", "5 3 19 12 5 21 5 3"),
        v84["appendChild"](v86));
    } else {
      const v87 = document["createElementNS"](v85, "rect");
      (v87["setAttribute"]("x", "6"),
        v87["setAttribute"]("y", "4"),
        v87["setAttribute"]("width", "4"),
        v87["setAttribute"]("height", "16"));
      const v88 = document["createElementNS"](v85, "rect");
      (v88["setAttribute"]("x", "14"),
        v88["setAttribute"]("y", "4"),
        v88["setAttribute"]("width", "4"),
        v88["setAttribute"]("height", "16"),
        v84["appendChild"](v87),
        v84["appendChild"](v88));
    }
  }
  ["update"](v89) {
    this["_data"] = v89;
    if (!this["_audio"]) return;
    const v90 = this["_resolveAudioSrc"](v89);
    this["_syncGeneratingUi"](v89, v90);
    if (v90 && v90 !== this["_currentSrc"]) this["_prepareAudio"](v90);
    else {
      if (
        v90 &&
        String(v89?.["waveformLocalPath"] || "")["trim"]() &&
        String(v89?.["waveformLocalPath"] || "")["trim"]() !==
          this["_waveformLocalPath"]
      )
        void this["_ensureWaveform"](v90, { persistedOnly: true });
      else
        !v90 &&
          (typeof this["_cancelDeferredWaveform"] === "function" &&
            (this["_cancelDeferredWaveform"](),
            (this["_cancelDeferredWaveform"] = null)),
          this["_clearAudioElementSource"](),
          (this["_currentSrc"] = null),
          this["_progressController"]?.["reset"](),
          this["_hint"] &&
            (this["_hint"]["style"]["display"] =
              shouldShowGenerationResultLoadingUi(v89) ? "none" : "block"));
    }
    (maybeResumeAudioSeparationLeader(this["id"]),
      this["_label"] &&
        v89["name"] &&
        document["activeElement"] !== this["_label"] &&
        (this["_label"]["innerText"] = v89["name"]));
  }
  async ["_playAudio"]() {
    if (!this["_audio"] || !this["_currentSrc"]) return;
    (beginAudioPlayback(this["id"]),
      await this["_loadAudio"](this["_currentSrc"], { showLoading: true }),
      this["_rewindEndedAudioIfNeeded"]());
    const v91 = this["_audio"]["play"]();
    v91 && typeof v91["catch"] === "function"
      ? v91["then"](() => {
          (this["_rememberAudioDuration"](), stopLoading(this["_card"]));
        })["catch"]((v92) => {
          stopLoading(this["_card"]);
          if (v92?.["name"] === "AbortError") return;
          console["warn"]("[source-audio] play failed:", v92);
        })
      : stopLoading(this["_card"]);
  }
  ["_stopAudioForExternalPlayback"]() {
    if (!this["_audio"]) return;
    typeof this["_cancelDeferredWaveform"] === "function" &&
      (this["_cancelDeferredWaveform"](),
      (this["_cancelDeferredWaveform"] = null));
    try {
      this["_audio"]["pause"]?.();
    } catch {}
    (!this["_getAudioElementCurrentSource"]() &&
      this["_progressController"]?.["reset"](),
      stopLoading(this["_card"]),
      this["_setIcon"](true));
  }
  ["_rememberAudioDuration"](v93 = this["_currentSrc"]) {
    if (!this["_audio"] || (v93 && this["_currentSrc"] !== v93)) return;
    const v94 = this["_readAudioDurationSec"]();
    if (!(v94 > 0)) return;
    const v95 = appStore["getState"]()["nodes"]?.[this["id"]];
    if (!v95) return;
    const v96 = Number(
      v95["audioDuration"] || this["_data"]?.["audioDuration"] || 0,
    );
    if (v96 > 0) {
      if (Math["abs"](v96 - v94) <= 0.001) return;
      const v97 = Math["max"](1, v96 * 0.25);
      if (Math["abs"](v96 - v94) > v97) return;
    }
    appStore["updateNodeData"](this["id"], { audioDuration: v94 });
  }
  ["unmount"]() {
    (this["_unregisterAudioPlaybackClient"]?.(),
      (this["_unregisterAudioPlaybackClient"] = null),
      this["_progressController"]?.["destroy"](),
      (this["_progressController"] = null),
      typeof this["_cancelDeferredWaveform"] === "function" &&
        (this["_cancelDeferredWaveform"](),
        (this["_cancelDeferredWaveform"] = null)),
      this["_clearAudioElementSource"]());
  }
}
