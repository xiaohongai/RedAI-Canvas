import appStore from "../core/stores/appStore.js";
import { generateId } from "../core/math.js";
import { commit } from "./history.js";
import { calcSafeSpawnPosNearNode } from "./nodeSpawn.js";
import { requester } from "../../api/requester.js";
import {
  canUseElectronMediaTask,
  enqueueElectronMediaTask,
} from "../../api/localMediaTaskApi.js";
import {
  getAudioDurationFromUrl,
  getWaveformBarsPathFromUrl,
} from "../utils/audioWaveform.js";
import { attachDesktopMediaPlaybackSource } from "../services/desktopMediaBlobSource.js";
import {
  localPathToUrl,
  pickResultLocalPath,
} from "../utils/localMediaPath.js";
export function normalizeAudioCutResultLocalPath(v0) {
  return pickResultLocalPath(v0);
}
const AudioClipController = {
  active: false,
  nodeId: null,
  anchorNodeId: null,
  wrapperEl: null,
  barEl: null,
  trackEl: null,
  selectionEl: null,
  leftHandleEl: null,
  rightHandleEl: null,
  playheadEl: null,
  labelEl: null,
  cancelBtnEl: null,
  confirmBtnEl: null,
  audioEl: null,
  durationSec: 0,
  startSec: 0,
  endSec: 0,
  _dragMode: null,
  _dragOffsetPx: 0,
  _onKeyDown: null,
  _onDocClick: null,
  _onLoadedMeta: null,
  _onDurationChange: null,
  _onPointerMove: null,
  _onPointerUp: null,
  _retryRaf: 0,
  _retryCount: 0,
  _playheadRaf: 0,
  _hiddenEls: null,
  _msgEls: null,
  _msgInterval: 0,
  _wavePathEl: null,
  _waveToken: 0,
  _sourceToken: 0,
  init(v1) {
    if (!v1) return;
    if (this["active"]) this["exit"]({ silent: true });
    this["audioEl"] = null;
    const v2 = appStore["getState"]()["nodes"][v1];
    if (!v2) return;
    const v3 = this["_resolveAudioSrcFromNode"](v2);
    if (!v3) {
      window["showToast"]?.("请先上传音频", "warn");
      return;
    }
    ((this["active"] = true),
      (this["nodeId"] = v1),
      (this["anchorNodeId"] = v1),
      (this["_retryCount"] = 0),
      this["_mountWhenReady"]());
  },
  _applyDimMode(v4) {
    const v5 = document["getElementById"]("v2-wrap");
    if (v5) {
      if (v4) v5["classList"]["add"]("is-audio-clip-mode");
      else v5["classList"]["remove"]("is-audio-clip-mode");
    }
    if (this["wrapperEl"]) {
      if (v4) this["wrapperEl"]["classList"]["add"]("is-audio-clip-target");
      else this["wrapperEl"]["classList"]["remove"]("is-audio-clip-target");
    }
  },
  _applyFrozenUI(v6) {
    if (!this["wrapperEl"]) return;
    const v7 = "is-audio-clipping";
    if (v6) this["wrapperEl"]["classList"]["add"](v7);
    else this["wrapperEl"]["classList"]["remove"](v7);
    this["_applyFrozenOverlaysHidden"](v6);
  },
  _applyFrozenOverlaysHidden(v8) {
    if (!this["wrapperEl"]) return;
    if (v8) {
      if (Array["isArray"](this["_hiddenEls"]) && this["_hiddenEls"]["length"])
        return;
      const v9 = [".audio-controls", ".node-upload-hint"],
        v10 = [];
      (v9["forEach"]((v11) => {
        this["wrapperEl"]["querySelectorAll"](v11)["forEach"]((v12) => {
          (v10["push"]({ el: v12, prevDisplay: v12["style"]["display"] }),
            (v12["style"]["display"] = "none"));
        });
      }),
        (this["_hiddenEls"] = v10));
      return;
    }
    const v13 = Array["isArray"](this["_hiddenEls"]) ? this["_hiddenEls"] : [];
    ((this["_hiddenEls"] = null),
      v13["forEach"](({ el: v14, prevDisplay: v15 }) => {
        if (!v14 || !v14["isConnected"]) return;
        v14["style"]["display"] = v15 || "";
      }));
  },
  _mountWhenReady() {
    const v16 = this["nodeId"],
      v17 = () => {
        if (!this["active"] || this["nodeId"] !== v16) return;
        const v18 = document["getElementById"](v16);
        if (!v18) {
          this["_retryCount"]++;
          if (this["_retryCount"] > 10) {
            this["exit"]({ silent: true });
            return;
          }
          this["_retryRaf"] = requestAnimationFrame(v17);
          return;
        }
        ((this["wrapperEl"] = v18),
          window["v2FocusOnNodes"]?.([v16]),
          this["_applyFrozenUI"](true),
          this["_applyDimMode"](true),
          this["_createUI"](),
          this["_bindEvents"](),
          this["_syncDurationAndDefaults"](),
          this["_render"]());
      };
    this["_retryRaf"] = requestAnimationFrame(v17);
  },
  _createUI() {
    if (!this["wrapperEl"]) return;
    this["wrapperEl"]
      ["querySelectorAll"](".v2-video-clipbar")
      ["forEach"]((v19) => v19["remove"]());
    const v20 = document["createElement"]("div");
    ((v20["className"] = "v2-video-clipbar"),
      v20["addEventListener"]("pointerdown", (v21) => v21["stopPropagation"]()),
      v20["addEventListener"]("click", (v22) => v22["stopPropagation"]()),
      v20["addEventListener"]("dblclick", (v23) => {
        (v23["preventDefault"](), v23["stopPropagation"]());
      }));
    const v24 = document["createElement"]("button");
    ((v24["type"] = "button"),
      (v24["className"] = "v2-video-clipbtn\x20cancel"),
      (v24["title"] = "取消"));
    {
      const v25 = "http://www.w3.org/2000/svg",
        v26 = document["createElementNS"](v25, "svg");
      (v26["setAttribute"]("width", "20"),
        v26["setAttribute"]("height", "20"),
        v26["setAttribute"]("viewBox", "0\x200\x2024\x2024"),
        v26["setAttribute"]("fill", "none"),
        v26["setAttribute"]("stroke", "currentColor"),
        v26["setAttribute"]("stroke-width", "2"));
      const v27 = document["createElementNS"](v25, "path");
      v27["setAttribute"]("d", "M18 6L6 18");
      const v28 = document["createElementNS"](v25, "path");
      (v28["setAttribute"]("d", "M6 6l12 12"),
        v26["appendChild"](v27),
        v26["appendChild"](v28),
        v24["appendChild"](v26));
    }
    const v29 = document["createElement"]("button");
    ((v29["type"] = "button"),
      (v29["className"] = "v2-video-clipbtn confirm"),
      (v29["title"] = "完成"));
    {
      const v30 = "http://www.w3.org/2000/svg",
        v31 = document["createElementNS"](v30, "svg");
      (v31["setAttribute"]("width", "24"),
        v31["setAttribute"]("height", "24"),
        v31["setAttribute"]("viewBox", "0 0 24 24"),
        v31["setAttribute"]("fill", "none"),
        v31["setAttribute"]("stroke", "currentColor"),
        v31["setAttribute"]("stroke-width", "2.5"));
      const v32 = document["createElementNS"](v30, "polyline");
      (v32["setAttribute"]("points", "20 6 9 17 4 12"),
        v31["appendChild"](v32),
        v29["appendChild"](v31));
    }
    const v33 = document["createElement"]("div");
    v33["className"] = "v2-video-cliprow";
    const v34 = document["createElement"]("div");
    v34["className"] = "v2-video-cliptrack";
    const v35 = document["createElement"]("div");
    v35["className"] = "v2-audio-clipwave";
    {
      const v36 = "http://www.w3.org/2000/svg",
        v37 = document["createElementNS"](v36, "svg");
      (v37["setAttribute"]("viewBox", "0 0 200 44"),
        v37["setAttribute"]("preserveAspectRatio", "none"));
      const v38 = document["createElementNS"](v36, "path");
      (v38["setAttribute"]("fill", "none"),
        v38["setAttribute"]("d", ""),
        v38["classList"]["add"]("v2-audio-clipwave-path"));
      const v39 = document["createElementNS"](v36, "path");
      (v39["setAttribute"]("fill", "none"),
        v39["setAttribute"]("d", "M0,22 L200,22"),
        v39["classList"]["add"]("v2-audio-clipwave-mid"),
        v37["appendChild"](v38),
        v37["appendChild"](v39),
        v35["appendChild"](v37),
        (this["_wavePathEl"] = v38));
    }
    const v40 = document["createElement"]("div");
    v40["className"] = "v2-video-clipticks";
    const v41 = document["createElement"]("div");
    v41["className"] = "v2-video-cliprange";
    const v42 = document["createElement"]("div");
    v42["className"] = "v2-video-clipselection";
    const v43 = document["createElement"]("div");
    v43["className"] = "v2-video-clipplayhead";
    const v44 = document["createElement"]("div");
    ((v44["className"] = "v2-video-cliphandle left"),
      (v44["dataset"]["handle"] = "left"));
    const v45 = document["createElement"]("div");
    ((v45["className"] = "v2-video-cliphandle right"),
      (v45["dataset"]["handle"] = "right"));
    const v46 = document["createElement"]("div");
    ((v46["className"] = "v2-video-cliplabel"),
      (v46["textContent"] = "0.00s"),
      v41["appendChild"](v42),
      v41["appendChild"](v44),
      v41["appendChild"](v45),
      v34["appendChild"](v35),
      v34["appendChild"](v41),
      v34["appendChild"](v43),
      v34["appendChild"](v40),
      v34["appendChild"](v46),
      v33["appendChild"](v24),
      v33["appendChild"](v34),
      v33["appendChild"](v29),
      v20["appendChild"](v33));
    const v47 = document["createElement"]("div");
    v47["className"] = "v2-video-cliphelper-row";
    const v48 = document["createElement"]("div");
    v48["className"] = "v2-video-cliphelper-left";
    const v49 = [
      {
        html: "<span\x20class=\x22v2-video-cliphelperkbd\x22>Esc</span><span>取消</span>",
      },
      {
        html: "<span\x20class=\x22v2-video-cliphelperkbd\x22>Space</span><span>区间播放/暂停</span>",
      },
      {
        html: '<span class="v2-video-cliphelperkbd">←</span> <span class="v2-video-cliphelperkbd">→</span> <span>移动裁剪区</span>',
      },
      {
        html: "<span\x20class=\x22v2-video-cliphelperkbd\x22>Shift</span>\x20+\x20<span\x20class=\x22v2-video-cliphelperkbd\x22>←</span>/<span\x20class=\x22v2-video-cliphelperkbd\x22>→</span>\x20<span>大步移动裁剪区</span>",
      },
      {
        html: '<span class="v2-video-cliphelperkbd">I</span>/<span class="v2-video-cliphelperkbd">O</span> <span>设置入点/出点</span>',
      },
      {
        html: "<span\x20class=\x22v2-video-cliphelperkbd\x22>Ctrl</span>\x20+\x20<span\x20class=\x22v2-video-cliphelperkbd\x22>←</span>/<span\x20class=\x22v2-video-cliphelperkbd\x22>→</span>\x20<span>微调入点</span>",
      },
      {
        html: "<span\x20class=\x22v2-video-cliphelperkbd\x22>Alt</span>\x20+\x20<span\x20class=\x22v2-video-cliphelperkbd\x22>←</span>/<span\x20class=\x22v2-video-cliphelperkbd\x22>→</span>\x20<span>微调出点</span>",
      },
      {
        html: '<span class="v2-video-cliphelperkbd">滚轮</span><span>同方向键</span>',
      },
      {
        html: '<span class="v2-video-cliphelperkbd">双击选区</span><span>恢复默认 3s</span>',
      },
    ];
    this["_msgEls"] = v49["map"]((v50, v51) => {
      const v52 = document["createElement"]("div");
      v52["className"] = "v2-video-cliphelper-msg";
      if (v51 !== 0) v52["classList"]["add"]("hide-down");
      return ((v52["innerHTML"] = v50["html"]), v48["appendChild"](v52), v52);
    });
    if (this["_msgInterval"]) window["clearInterval"](this["_msgInterval"]);
    let v53 = 0;
    this["_msgInterval"] = window["setInterval"](() => {
      if (!this["active"] || !this["_msgEls"]) return;
      const v54 = this["_msgEls"][v53];
      v53 = (v53 + 1) % this["_msgEls"]["length"];
      const v55 = this["_msgEls"][v53];
      (v54["classList"]["remove"]("hide-down"),
        v54["classList"]["add"]("hide-up"),
        v55["classList"]["remove"]("hide-up"),
        v55["classList"]["remove"]("hide-down"),
        window["setTimeout"](() => {
          v54 &&
            v54["classList"]["contains"]("hide-up") &&
            (v54["classList"]["remove"]("hide-up"),
            v54["classList"]["add"]("hide-down"));
        }, 300));
    }, 4000);
    const v56 = document["createElement"]("div");
    ((v56["className"] = "v2-video-clip-smartwrap"),
      v47["appendChild"](v48),
      v47["appendChild"](v56),
      v20["appendChild"](v47),
      this["wrapperEl"]["appendChild"](v20),
      (this["barEl"] = v20),
      (this["cancelBtnEl"] = v24),
      (this["confirmBtnEl"] = v29),
      (this["trackEl"] = v34),
      (this["selectionEl"] = v42),
      (this["leftHandleEl"] = v44),
      (this["rightHandleEl"] = v45),
      (this["playheadEl"] = v43),
      (this["labelEl"] = v46));
  },
  _resolveAudioSrcFromNode(v57) {
    if (!v57) return "";
    const v58 = localPathToUrl(v57["localPath"]);
    return v58 || v57["src"] || v57["audioUrl"] || v57["resultUrl"] || "";
  },
  _getAudioEl() {
    if (!this["wrapperEl"]) return null;
    if (
      this["audioEl"] &&
      this["audioEl"]["isConnected"] &&
      this["wrapperEl"]["contains"]?.(this["audioEl"])
    )
      return this["audioEl"];
    const v59 = this["wrapperEl"]["querySelector"]("audio.audio-player");
    return ((this["audioEl"] = v59 || null), v59);
  },
  _getAudioElementSource(v60) {
    return String(
      v60?.["getAttribute"]?.("src") ||
        v60?.["currentSrc"] ||
        v60?.["src"] ||
        "",
    )["trim"]();
  },
  _setClipMediaKeepAlive(v61, v62) {
    if (!v61?.["dataset"]) return;
    if (v62) {
      v61["dataset"]["desktopMediaKeepAlive"] = "audio-clip";
      return;
    }
    v61["dataset"]["desktopMediaKeepAlive"] === "audio-clip" &&
      delete v61["dataset"]["desktopMediaKeepAlive"];
  },
  _readDurationSec(v63) {
    const v64 = Number(v63?.["duration"]);
    if (!Number["isFinite"](v64) || v64 <= 0) return 0;
    return v64;
  },
  _applyDurationSec(v65) {
    const v66 = Number(v65);
    if (!Number["isFinite"](v66) || v66 <= 0) return false;
    this["durationSec"] = v66;
    if (!(this["endSec"] > this["startSec"])) {
      const v67 = Math["min"](3, v66),
        v68 = Math["max"](0, (v66 - v67) / 2);
      return ((this["startSec"] = v68), (this["endSec"] = v68 + v67), true);
    }
    ((this["startSec"] = Math["max"](0, Math["min"](this["startSec"], v66))),
      (this["endSec"] = Math["max"](0, Math["min"](this["endSec"], v66))));
    if (this["endSec"] <= this["startSec"]) {
      const v69 = Math["min"](3, v66);
      ((this["startSec"] = 0), (this["endSec"] = v69));
    }
    return true;
  },
  async _syncDurationAndDefaults() {
    const v70 = appStore["getState"]()["nodes"][this["nodeId"]];
    if (!v70) return;
    const v71 = this["_resolveAudioSrcFromNode"](v70);
    if (!v71) {
      this["exit"]({ silent: true });
      return;
    }
    const v72 = this["_getAudioEl"]();
    if (!v72) {
      (window["showToast"]?.("找不到音频播放器", "error"),
        this["exit"]({ silent: true }));
      return;
    }
    const v73 = ++this["_sourceToken"];
    this["_setClipMediaKeepAlive"](v72, true);
    try {
      v72["pause"]();
    } catch (v74) {}
    try {
      v72["loop"] = false;
    } catch (v75) {}
    !this["_onLoadedMeta"] &&
      ((this["_onLoadedMeta"] = () => {
        if (!this["active"]) return;
        const v76 = this["_readDurationSec"](v72);
        (this["_applyDurationSec"](v76, v72), this["_render"]());
      }),
      (this["_onDurationChange"] = () => {
        if (!this["active"]) return;
        const v77 = this["_readDurationSec"](v72);
        (this["_applyDurationSec"](v77, v72), this["_render"]());
      }),
      v72["addEventListener"]("loadedmetadata", this["_onLoadedMeta"], {
        once: true,
      }),
      v72["addEventListener"]("durationchange", this["_onDurationChange"]));
    (this["_ensureWaveform"](v71),
      await attachDesktopMediaPlaybackSource(v72, v71));
    if (!this["active"] || v73 !== this["_sourceToken"]) return;
    if (!this["_getAudioElementSource"](v72)) {
      ((v72["preload"] = "auto"), (v72["src"] = v71));
      try {
        v72["load"]();
      } catch (v78) {}
    }
    const v79 = this["_readDurationSec"](v72);
    if (this["_applyDurationSec"](v79, v72)) {
      (this["_render"](), this["_startPlayheadLoop"]());
      return;
    }
    this["_startPlayheadLoop"]();
  },
  async _ensureWaveform(v80) {
    const v81 = String(v80 || "")["trim"]();
    if (!v81) return;
    if (!this["_wavePathEl"]) return;
    const v82 = ++this["_waveToken"],
      [v83, v84] = await Promise["all"]([
        getWaveformBarsPathFromUrl(v81, {
          width: 200,
          height: 44,
          samples: 200,
        }),
        getAudioDurationFromUrl(v81),
      ]);
    if (!this["active"]) return;
    if (v82 !== this["_waveToken"]) return;
    this["_applyDurationSec"](v84) &&
      (this["_render"](), this["_startPlayheadLoop"]());
    if (!this["_wavePathEl"] || !v83) return;
    this["_wavePathEl"]["setAttribute"]("d", v83);
  },
  _startPlayheadLoop() {
    if (this["_playheadRaf"]) cancelAnimationFrame(this["_playheadRaf"]);
    const v85 = () => {
      if (!this["active"]) return;
      (this["_renderPlayhead"](),
        (this["_playheadRaf"] = requestAnimationFrame(v85)));
    };
    this["_playheadRaf"] = requestAnimationFrame(v85);
  },
  _renderPlayhead() {
    if (!this["playheadEl"] || !this["trackEl"]) return;
    const v86 = this["durationSec"];
    if (!Number["isFinite"](v86) || v86 <= 0) {
      this["playheadEl"]["style"]["display"] = "none";
      return;
    }
    const v87 = this["_getAudioEl"]();
    if (!v87) {
      this["playheadEl"]["style"]["display"] = "none";
      return;
    }
    let v88 = Number(v87["currentTime"]) || 0;
    (v88 < this["startSec"] || v88 > this["endSec"]) &&
      !v87["paused"] &&
      ((v87["currentTime"] = this["startSec"]), (v88 = this["startSec"]));
    const v89 = Math["max"](0, Math["min"](1, v88 / v86));
    ((this["playheadEl"]["style"]["display"] = "block"),
      (this["playheadEl"]["style"]["left"] = v89 * 100 + "%"));
  },
  _bindEvents() {
    if (!this["barEl"]) return;
    (this["cancelBtnEl"]?.["addEventListener"]("click", (v90) => {
      (v90["stopPropagation"](), this["exit"]());
    }),
      this["confirmBtnEl"]?.["addEventListener"]("click", (v91) => {
        (v91["stopPropagation"](), this["_confirm"]());
      }));
    const v92 = (v93) => {
      if (!this["trackEl"] || !this["active"] || this["_dragMode"]) return;
      const v94 = v93["clientX"],
        v95 = this["selectionEl"]["getBoundingClientRect"](),
        v96 = 20,
        v97 = Math["abs"](v94 - v95["left"]) < v96,
        v98 = Math["abs"](v94 - v95["right"]) < v96;
      if (v97)
        (this["leftHandleEl"]["classList"]["add"]("hover-active"),
          this["rightHandleEl"]["classList"]["remove"]("hover-active"),
          (this["selectionEl"]["style"]["cursor"] = "var(--resize-ew-cursor)"));
      else
        v98
          ? (this["rightHandleEl"]["classList"]["add"]("hover-active"),
            this["leftHandleEl"]["classList"]["remove"]("hover-active"),
            (this["selectionEl"]["style"]["cursor"] =
              "var(--resize-ew-cursor)"))
          : (this["leftHandleEl"]["classList"]["remove"]("hover-active"),
            this["rightHandleEl"]["classList"]["remove"]("hover-active"),
            (this["selectionEl"]["style"]["cursor"] = "var(--grab-cursor)"));
    };
    this["trackEl"]?.["addEventListener"]("pointermove", v92);
    const v99 = 30,
      v100 = (v101) => (Number(v101 || 1) / v99) * 1,
      v102 = () => {
        const v103 = this["durationSec"];
        if (!Number["isFinite"](v103) || v103 <= 0) return 0.1;
        return Math["min"](0.1, v103);
      },
      v104 = (v105, v106, v107) => Math["max"](v106, Math["min"](v107, v105)),
      v108 = (v109) => {
        if (!this["trackEl"] || !this["active"]) return;
        const v110 = this["durationSec"];
        if (!Number["isFinite"](v110) || v110 <= 0) return;
        const v111 = this["_getAudioEl"]();
        if (!v111) return;
        const v112 = this["trackEl"]["getBoundingClientRect"]();
        if (!v112["width"]) return;
        const v113 = v109 - v112["left"],
          v114 = v104(v113 / v112["width"], 0, 1),
          v115 = v114 * v110,
          v116 = Math["max"](0, v110 - 0.001);
        try {
          v111["currentTime"] = v104(v115, 0, v116);
        } catch (v117) {}
        this["_renderPlayhead"]();
      },
      v118 = () => {
        const v119 = this["_getAudioEl"]();
        if (!v119) return;
        if (!v119["paused"]) return;
        const v120 = Number(v119["currentTime"]) || 0;
        if (v120 >= this["startSec"] && v120 <= this["endSec"]) return;
        try {
          v119["currentTime"] = this["startSec"];
        } catch (v121) {}
      },
      v122 = (v123, v124) => {
        const v125 = this["durationSec"];
        if (!Number["isFinite"](v125) || v125 <= 0) return;
        const v126 = v100(v124) * (v123 >= 0 ? 1 : -1),
          v127 = v102(),
          v128 = Math["max"](v127, this["endSec"] - this["startSec"]);
        let v129 = this["startSec"] + v126,
          v130 = this["endSec"] + v126;
        v129 < 0 && ((v129 = 0), (v130 = v128));
        v130 > v125 && ((v130 = v125), (v129 = Math["max"](0, v125 - v128)));
        ((this["startSec"] = v129), (this["endSec"] = v130));
        const v131 = this["_getAudioEl"]();
        if (v131) {
          try {
            if (!v131["paused"]) v131["pause"]();
          } catch (v132) {}
          try {
            v131["currentTime"] = v129;
          } catch (v133) {}
        } else v118();
        this["_render"]();
      },
      v134 = (v135) => {
        const v136 = this["durationSec"];
        if (!Number["isFinite"](v136) || v136 <= 0) return;
        const v137 = v100(1) * (v135 >= 0 ? 1 : -1),
          v138 = v102(),
          v139 = Math["max"](0, this["endSec"] - v138);
        this["startSec"] = v104(this["startSec"] + v137, 0, v139);
        const v140 = this["_getAudioEl"]();
        if (v140) {
          try {
            if (!v140["paused"]) v140["pause"]();
          } catch (v141) {}
          try {
            v140["currentTime"] = this["startSec"];
          } catch (v142) {}
        }
        this["_render"]();
      },
      v143 = (v144) => {
        const v145 = this["durationSec"];
        if (!Number["isFinite"](v145) || v145 <= 0) return;
        const v146 = v100(1) * (v144 >= 0 ? 1 : -1),
          v147 = v102(),
          v148 = Math["min"](v145, this["startSec"] + v147);
        this["endSec"] = v104(this["endSec"] + v146, v148, v145);
        const v149 = this["_getAudioEl"]();
        if (v149) {
          try {
            if (!v149["paused"]) v149["pause"]();
          } catch (v150) {}
          try {
            v149["currentTime"] = this["endSec"];
          } catch (v151) {}
        }
        this["_render"]();
      },
      v152 = (v153) => {
        const v154 = this["durationSec"];
        if (!Number["isFinite"](v154) || v154 <= 0) return;
        const v155 = this["_getAudioEl"]();
        if (!v155) return;
        let v156 = Number(v155["currentTime"]) || 0;
        v156 = v104(v156, 0, v154);
        const v157 = v102();
        if (v153 === "in") {
          const v158 = Math["max"](0, this["endSec"] - v157);
          this["startSec"] = v104(v156, 0, v158);
        } else {
          const v159 = Math["min"](v154, this["startSec"] + v157);
          this["endSec"] = v104(v156, v159, v154);
        }
        this["_render"]();
      },
      v160 = (v161) => {
        if (!this["trackEl"] || !this["active"]) return;
        const v162 = v161["target"]["closest"](".v2-video-cliphandle"),
          v163 = !!v161["target"]["closest"](".v2-video-clipselection"),
          v164 = this["trackEl"]["getBoundingClientRect"]();
        if (!v164["width"]) return;
        const v165 = v161["clientX"],
          v166 = this["selectionEl"]["getBoundingClientRect"](),
          v167 = 20,
          v168 = Math["abs"](v165 - v166["left"]) < v167,
          v169 = Math["abs"](v165 - v166["right"]) < v167;
        if (v168 || (v162 && v162["dataset"]["handle"] === "left"))
          ((this["_dragMode"] = "left"),
            this["leftHandleEl"]["classList"]["add"]("hover-active"));
        else {
          if (v169 || (v162 && v162["dataset"]["handle"] === "right"))
            ((this["_dragMode"] = "right"),
              this["rightHandleEl"]["classList"]["add"]("hover-active"));
          else {
            if (v163) this["_dragMode"] = "move";
            else {
              this["_dragMode"] = "scrub";
              const v170 = this["_getAudioEl"]();
              if (v170)
                try {
                  if (!v170["paused"]) v170["pause"]();
                } catch (v171) {}
            }
          }
        }
        if (this["_dragMode"] === "move") {
          const v172 = this["selectionEl"]["getBoundingClientRect"]();
          this["_dragOffsetPx"] = v161["clientX"] - v172["left"];
        } else this["_dragOffsetPx"] = 0;
        (v161["preventDefault"](), v161["stopPropagation"]());
        if (this["_dragMode"] === "scrub") v108(v161["clientX"]);
        else this["_handleDragAtClientX"](v161["clientX"]);
        if (this["_onPointerMove"])
          window["removeEventListener"](
            "pointermove",
            this["_onPointerMove"],
            true,
          );
        if (this["_onPointerUp"])
          window["removeEventListener"](
            "pointerup",
            this["_onPointerUp"],
            true,
          );
        ((this["_onPointerMove"] = (v173) => {
          if (!this["active"] || !this["trackEl"]) return;
          (v173["preventDefault"](), v173["stopPropagation"]());
          if (this["_dragMode"] === "scrub") v108(v173["clientX"]);
          else this["_handleDragAtClientX"](v173["clientX"]);
        }),
          (this["_onPointerUp"] = (v174) => {
            if (!this["active"]) return;
            (v174["preventDefault"](),
              v174["stopPropagation"](),
              (this["_dragMode"] = null),
              (this["_dragOffsetPx"] = 0),
              this["leftHandleEl"]?.["classList"]["remove"]("hover-active"),
              this["rightHandleEl"]?.["classList"]["remove"]("hover-active"));
            if (this["_onPointerMove"])
              window["removeEventListener"](
                "pointermove",
                this["_onPointerMove"],
                true,
              );
            if (this["_onPointerUp"])
              window["removeEventListener"](
                "pointerup",
                this["_onPointerUp"],
                true,
              );
            ((this["_onPointerMove"] = null), (this["_onPointerUp"] = null));
          }),
          window["addEventListener"](
            "pointermove",
            this["_onPointerMove"],
            true,
          ),
          window["addEventListener"]("pointerup", this["_onPointerUp"], true));
      };
    (this["trackEl"]?.["addEventListener"]("pointerdown", v160),
      this["trackEl"]?.["addEventListener"](
        "wheel",
        (v175) => {
          if (!this["active"]) return;
          (v175["preventDefault"](), v175["stopPropagation"]());
          const v176 = Number(v175["deltaX"]) || 0,
            v177 = Number(v175["deltaY"]) || 0,
            v178 = Math["abs"](v176) > Math["abs"](v177) ? v176 : v177;
          if (!v178) return;
          const v179 = v178 > 0 ? 1 : -1;
          if (v175["ctrlKey"] || v175["metaKey"]) v134(v179);
          else {
            if (v175["altKey"]) v143(v179);
            else {
              const v180 = v175["shiftKey"] ? 10 : 1;
              v122(v179, v180);
            }
          }
        },
        { passive: false },
      ),
      this["selectionEl"]?.["addEventListener"]("dblclick", (v181) => {
        if (!this["active"]) return;
        (v181["preventDefault"](), v181["stopPropagation"]());
        const v182 = this["durationSec"];
        if (!v182 || !Number["isFinite"](v182) || v182 <= 0) return;
        const v183 = this["selectionEl"]["getBoundingClientRect"](),
          v184 = v181["clientX"],
          v185 = 24;
        if (v184 - v183["left"] < v185 || v183["right"] - v184 < v185) return;
        const v186 = Math["min"](3, v182),
          v187 = (this["startSec"] + this["endSec"]) / 2,
          v188 = Math["max"](0, Math["min"](v182 - v186, v187 - v186 / 2));
        ((this["startSec"] = v188), (this["endSec"] = v188 + v186));
        const v189 = this["_getAudioEl"]();
        if (v189 && v189["paused"]) v189["currentTime"] = this["startSec"];
        this["_render"]();
      }),
      this["_onKeyDown"] &&
        (window["removeEventListener"]("keydown", this["_onKeyDown"], true),
        (this["_onKeyDown"] = null)),
      (this["_onKeyDown"] = (v190) => {
        if (!this["active"]) return;
        if (v190["key"] === "Escape") {
          (v190["preventDefault"](), this["exit"]());
          return;
        }
        if (v190["key"] === "\x20" || v190["code"] === "Space") {
          v190["preventDefault"]();
          const v191 = this["_getAudioEl"]();
          v191 &&
            (v191["paused"]
              ? ((v191["currentTime"] < this["startSec"] ||
                  v191["currentTime"] >= this["endSec"]) &&
                  (v191["currentTime"] = this["startSec"]),
                v191["play"]())
              : v191["pause"]());
          return;
        }
        if (v190["key"] === "i" || v190["key"] === "I") {
          (v190["preventDefault"](), v152("in"));
          return;
        }
        if (v190["key"] === "o" || v190["key"] === "O") {
          (v190["preventDefault"](), v152("out"));
          return;
        }
        if (v190["key"] === "ArrowLeft" || v190["key"] === "ArrowRight") {
          v190["preventDefault"]();
          const v192 = v190["key"] === "ArrowRight" ? 1 : -1;
          if (v190["ctrlKey"] || v190["metaKey"]) {
            v134(v192);
            return;
          }
          if (v190["altKey"]) {
            v143(v192);
            return;
          }
          const v193 = v190["shiftKey"] ? 10 : 1;
          v122(v192, v193);
        }
      }),
      window["addEventListener"]("keydown", this["_onKeyDown"], true),
      this["_onDocClick"] &&
        (document["removeEventListener"](
          "pointerdown",
          this["_onDocClick"],
          true,
        ),
        (this["_onDocClick"] = null)),
      (this["_onDocClick"] = (v194) => {
        if (!this["active"] || !this["barEl"]) return;
        if (this["barEl"]["contains"](v194["target"])) return;
        this["exit"]({ silent: true });
      }),
      document["addEventListener"]("pointerdown", this["_onDocClick"], true));
  },
  _togglePlayRange() {
    const v195 = this["_getAudioEl"](),
      v196 = this["durationSec"];
    if (!v195 || !Number["isFinite"](v196) || v196 <= 0) return;
    try {
      if (!v195["paused"]) {
        v195["pause"]();
        return;
      }
    } catch (v197) {}
    let v198 = Number(v195["currentTime"]) || 0;
    if (v198 < this["startSec"] || v198 >= this["endSec"])
      try {
        v195["currentTime"] = this["startSec"];
      } catch (v199) {}
    try {
      v195["play"]();
    } catch (v200) {}
  },
  _handleDragAtClientX(v201) {
    if (!this["trackEl"] || !this["active"]) return;
    const v202 = this["durationSec"];
    if (!v202 || !Number["isFinite"](v202) || v202 <= 0) {
      this["_render"]();
      return;
    }
    const v203 = this["trackEl"]["getBoundingClientRect"]();
    if (!v203["width"]) return;
    const v204 = v201 - v203["left"],
      v205 = Math["max"](0, Math["min"](1, v204 / v203["width"])),
      v206 = v205 * v202,
      v207 = Math["min"](0.1, v202),
      v208 = Math["max"](v207, this["endSec"] - this["startSec"]);
    if (this["_dragMode"] === "left") {
      const v209 = Math["max"](0, Math["min"](v206, this["endSec"] - v207));
      this["startSec"] = v209;
      const v210 = this["_getAudioEl"]();
      if (v210)
        try {
          v210["currentTime"] = v209;
        } catch (v211) {}
    } else {
      if (this["_dragMode"] === "right") {
        const v212 = Math["max"](
          this["startSec"] + v207,
          Math["min"](v202, v206),
        );
        this["endSec"] = v212;
      } else {
        if (this["_dragMode"] === "move") {
          const v213 =
              this["selectionEl"]["getBoundingClientRect"]()["left"] -
              v203["left"],
            v214 = v201 - v203["left"] - this["_dragOffsetPx"],
            v215 = v214 - v213,
            v216 = (v215 / v203["width"]) * v202,
            v217 = Math["max"](
              0,
              Math["min"](v202 - v208, this["startSec"] + v216),
            );
          ((this["startSec"] = v217), (this["endSec"] = v217 + v208));
          const v218 = this["_getAudioEl"]();
          if (v218)
            try {
              v218["currentTime"] = v217;
            } catch (v219) {}
        }
      }
    }
    this["_render"]();
  },
  _render() {
    if (
      !this["active"] ||
      !this["trackEl"] ||
      !this["selectionEl"] ||
      !this["leftHandleEl"] ||
      !this["rightHandleEl"]
    )
      return;
    const v220 = this["durationSec"],
      v221 = Number["isFinite"](v220) && v220 > 0,
      v222 = v221 ? Math["max"](0, Math["min"](this["startSec"], v220)) : 0,
      v223 = v221 ? Math["max"](0, Math["min"](this["endSec"], v220)) : 0,
      v224 = Math["max"](0, v223 - v222);
    if (v221) {
      const v225 = (v222 / v220) * 100,
        v226 = (v224 / v220) * 100;
      ((this["selectionEl"]["style"]["left"] = v225 + "%"),
        (this["selectionEl"]["style"]["width"] = v226 + "%"),
        (this["leftHandleEl"]["style"]["left"] = v225 + "%"),
        (this["rightHandleEl"]["style"]["left"] = v225 + v226 + "%"),
        this["labelEl"] &&
          ((this["labelEl"]["textContent"] = v224["toFixed"](2) + "s"),
          (this["labelEl"]["style"]["left"] = v225 + v226 / 2 + "%")));
    } else
      ((this["selectionEl"]["style"]["left"] = "0%"),
        (this["selectionEl"]["style"]["width"] = "0%"),
        (this["leftHandleEl"]["style"]["left"] = "0%"),
        (this["rightHandleEl"]["style"]["left"] = "0%"),
        this["labelEl"] &&
          ((this["labelEl"]["textContent"] = "加载中..."),
          (this["labelEl"]["style"]["left"] = "50%")));
    this["_renderPlayhead"]();
    if (this["confirmBtnEl"]) {
      const v227 = v221 && v224 >= 0.1;
      ((this["confirmBtnEl"]["disabled"] = !v227),
        (this["confirmBtnEl"]["dataset"]["disabled"] = v227 ? "false" : "true"),
        this["confirmBtnEl"]["dataset"]["loading"] !== "true" &&
          (this["confirmBtnEl"]["innerHTML"] =
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'));
    }
  },
  async _confirm() {
    if (!this["confirmBtnEl"]) return;
    const v228 = this["confirmBtnEl"];
    if (v228["dataset"]["disabled"] === "true") return;
    const v229 = appStore["getState"]()["nodes"],
      v230 = v229[this["anchorNodeId"]];
    if (!v230) {
      this["exit"]({ silent: true });
      return;
    }
    const v231 = this["durationSec"];
    if (!v231 || !Number["isFinite"](v231) || v231 <= 0) return;
    const v232 = Math["max"](0, Math["min"](this["startSec"], v231)),
      v233 = Math["max"](0, Math["min"](this["endSec"], v231));
    if (!(v233 > v232)) return;
    const v234 =
      localPathToUrl(v230["localPath"]) ||
      v230["src"] ||
      v230["audioUrl"] ||
      v230["resultUrl"] ||
      "";
    if (!v234) return;
    ((v228["dataset"]["disabled"] = "true"),
      (v228["dataset"]["loading"] = "true"),
      (v228["innerHTML"] =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><g style="animation:spin 1s linear infinite;transform-origin:50% 50%;transform-box:fill-box;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></g></svg>'),
      window["showToast"]?.("⏳\x20正在后端裁剪音频...", "info"));
    try {
      let v235 = null;
      if (canUseElectronMediaTask())
        v235 = await enqueueElectronMediaTask(
          {
            kind: "audioCut",
            nodeId: this["anchorNodeId"],
            src: v234,
            args: { start: v232, end: v233 },
          },
          { wait: true, timeout: 300000 },
        );
      else {
        const v236 = await requester({
          url: "/api/v2/audio/cut",
          method: "POST",
          provider: "local",
          headers: { "Content-Type": "application/json" },
          body: JSON["stringify"]({ src: v234, start: v232, end: v233 }),
          allow404Null: true,
          returnMeta: true,
        });
        if (v236?.["status"] === 404 || v236?.["data"] == null)
          throw new Error(
            "后端接口不存在：/api/v2/audio/cut（请重启\x20server.py）",
          );
        v235 = v236["data"] || {};
      }
      const v237 =
          v235?.["result"] && typeof v235["result"] === "object"
            ? v235["result"]
            : v235,
        v238 = normalizeAudioCutResultLocalPath(v235);
      if (!v238 || v235?.["success"] === false || v237?.["success"] === false)
        throw new Error(
          v237?.["error"] ||
            v235?.["error"] ||
            v235?.["message"] ||
            "音频裁剪失败",
        );
      const v239 = v230["width"] || 360,
        v240 = v230["height"] || 150,
        v241 = calcSafeSpawnPosNearNode(
          appStore["getState"]()["nodes"],
          v230,
          v239,
          v240,
        ),
        v242 = generateId("source-audio-cut");
      (appStore["addNode"]({
        id: v242,
        type: "source-audio",
        x: v241["x"],
        y: v241["y"],
        width: v239,
        height: v240,
        name: "剪辑自 " + (v230["name"] || "音频"),
        src: "/" + v238,
        localPath: v238,
        audioDuration: Math["max"](0, v233 - v232),
        fileName: v237?.["filename"] || v235?.["filename"] || "",
        waveformLocalPath:
          v237?.["waveformLocalPath"] || v235?.["waveformLocalPath"] || "",
        needsAutoResize: false,
        fixedSize: true,
      }),
        appStore["setSelectedNodes"]([v242]),
        commit(),
        window["v2FocusOnNodes"]?.([this["anchorNodeId"], v242]),
        window["_triggerLocalCacheSave"]?.(),
        window["showToast"]?.("✅ 音频裁剪成功，已生成新文件", "success"),
        this["exit"]({ silent: true }));
    } catch (v243) {
      const v244 =
        v243 instanceof Error
          ? v243["message"]
          : String(v243 || "音频裁剪失败");
      (window["showToast"]?.("❌ 音频裁剪失败: " + v244, "error"),
        (v228["dataset"]["loading"] = "false"),
        this["_render"](),
        (v228["dataset"]["loading"] = "false"));
    }
    v228["dataset"]["loading"] = "false";
  },
  exit({ silent: silent = false } = {}) {
    if (!this["active"]) return;
    ((this["active"] = false), this["_sourceToken"]++);
    if (this["_playheadRaf"]) cancelAnimationFrame(this["_playheadRaf"]);
    this["_playheadRaf"] = 0;
    if (this["_retryRaf"]) cancelAnimationFrame(this["_retryRaf"]);
    this["_retryRaf"] = 0;
    const v245 = this["_getAudioEl"]();
    if (v245) {
      this["_setClipMediaKeepAlive"](v245, false);
      if (this["_onLoadedMeta"])
        v245["removeEventListener"]("loadedmetadata", this["_onLoadedMeta"]);
      if (this["_onDurationChange"])
        v245["removeEventListener"](
          "durationchange",
          this["_onDurationChange"],
        );
    }
    this["_onKeyDown"] &&
      (window["removeEventListener"]("keydown", this["_onKeyDown"], true),
      (this["_onKeyDown"] = null));
    if (this["_onPointerMove"])
      window["removeEventListener"](
        "pointermove",
        this["_onPointerMove"],
        true,
      );
    if (this["_onPointerUp"])
      window["removeEventListener"]("pointerup", this["_onPointerUp"], true);
    ((this["_onPointerMove"] = null), (this["_onPointerUp"] = null));
    this["_onDocClick"] &&
      (document["removeEventListener"](
        "pointerdown",
        this["_onDocClick"],
        true,
      ),
      (this["_onDocClick"] = null));
    this["_msgInterval"] &&
      (window["clearInterval"](this["_msgInterval"]),
      (this["_msgInterval"] = 0));
    ((this["_msgEls"] = null),
      (this["_onLoadedMeta"] = null),
      (this["_onDurationChange"] = null),
      (this["_dragMode"] = null),
      (this["_dragOffsetPx"] = 0));
    if (this["barEl"] && this["barEl"]["isConnected"])
      this["barEl"]["remove"]();
    ((this["barEl"] = null),
      (this["trackEl"] = null),
      (this["selectionEl"] = null),
      (this["leftHandleEl"] = null),
      (this["rightHandleEl"] = null),
      (this["playheadEl"] = null),
      (this["labelEl"] = null),
      (this["cancelBtnEl"] = null),
      (this["confirmBtnEl"] = null),
      this["_applyFrozenUI"](false),
      this["_applyDimMode"](false),
      (this["wrapperEl"] = null),
      (this["audioEl"] = null),
      (this["nodeId"] = null),
      (this["anchorNodeId"] = null),
      (this["durationSec"] = 0),
      (this["startSec"] = 0),
      (this["endSec"] = 0));
    if (!silent) window["showToast"]?.("已取消裁剪音频", "info");
  },
};
export default AudioClipController;
