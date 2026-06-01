import {
  captureVideoFrameSnapshot,
  getVideoFrameSource,
  isVideoFrameReady,
  saveVideoFrameSnapshot,
  waitForVideoFrame,
} from "../videoFrameCapture.js";
function createCapturePreviewUrl(v0) {
  const v1 = globalThis["window"]?.["URL"] || globalThis["URL"];
  if (!v0 || typeof v1?.["createObjectURL"] !== "function") return "";
  try {
    return v1["createObjectURL"](v0);
  } catch {
    return "";
  }
}
export function createVideoNodePreviewControlsModule(v2) {
  const {
    store: v3,
    saveOutputBlob: v4,
    VideoKeyingController: v5,
    getAutoMediaSizeByShortSide: v6,
    buildSourceMediaNodePayload: v7,
    calcSafeSpawnPosNearNode: v8,
  } = v2;
  class v9 {
    ["_ensurePreviewVideoOverlays"]() {
      if (!this["previewEl"]) return;
      if (!this["_muteBtnEl"]) {
        const v10 = document["createElement"]("div");
        ((v10["className"] = "video-mute-btn"),
          (v10["title"] = "切换静音"),
          Object["assign"](v10["style"], {
            position: "absolute",
            top: "12px",
            left: "12px",
            background: "var(--media-control-button-bg)",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--media-control-button-text)",
            cursor: "pointer",
            zIndex: "12",
            backdropFilter: "blur(var(--media-control-blur))",
            userSelect: "none",
          }));
        const v11 = document["createElementNS"](
          "http://www.w3.org/2000/svg",
          "svg",
        );
        (v11["setAttribute"]("width", "16"),
          v11["setAttribute"]("height", "16"),
          v11["setAttribute"]("viewBox", "0\x200\x2024\x2024"),
          v11["setAttribute"]("fill", "none"),
          v11["setAttribute"]("stroke", "currentColor"),
          v11["setAttribute"]("stroke-width", "2"),
          v11["classList"]["add"]("icon-unmuted"),
          (v11["innerHTML"] =
            '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>'));
        const v12 = document["createElementNS"](
          "http://www.w3.org/2000/svg",
          "svg",
        );
        (v12["setAttribute"]("width", "16"),
          v12["setAttribute"]("height", "16"),
          v12["setAttribute"]("viewBox", "0 0 24 24"),
          v12["setAttribute"]("fill", "none"),
          v12["setAttribute"]("stroke", "currentColor"),
          v12["setAttribute"]("stroke-width", "2"),
          v12["classList"]["add"]("icon-muted"),
          (v12["innerHTML"] =
            '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="1" x2="1" y2="23"></line><line x1="15.54" y1="8.46" x2="19.07" y2="12"></line>'),
          v10["appendChild"](v11),
          v10["appendChild"](v12),
          v10["addEventListener"]("pointerdown", (v13) =>
            v13["stopPropagation"](),
          ),
          v10["addEventListener"]("click", (v14) => {
            (v14["stopPropagation"](),
              (this["_isMuted"] = !this["_isMuted"]),
              this["_applyMuteStateToPreviewVideos"](),
              this["_syncMuteBtnIcon"]());
          }),
          this["previewEl"]["appendChild"](v10),
          (this["_muteBtnEl"] = v10),
          (this["_muteIconUnmutedEl"] = v11),
          (this["_muteIconMutedEl"] = v12),
          this["_syncMuteBtnIcon"]());
      }
      if (!this["_centerIndicatorEl"]) {
        const v15 = document["createElement"]("div");
        ((v15["className"] = "gen-video-center-indicator"),
          Object["assign"](v15["style"], {
            position: "absolute",
            inset: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: "11",
          }));
        const v16 = document["createElement"]("div");
        (Object["assign"](v16["style"], {
          width: "64px",
          height: "64px",
          borderRadius: "18px",
          background: "var(--media-control-center-bg)",
          border: "1px solid var(--media-control-center-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--media-control-button-text)",
          opacity: "0",
          transform: "scale(0.92)",
          transition: "opacity 0.18s ease, transform 0.18s ease",
        }),
          v15["appendChild"](v16),
          this["previewEl"]["appendChild"](v15),
          (this["_centerIndicatorEl"] = v15),
          (this["_centerIndicatorInnerEl"] = v16));
      }
      if (!this["_controlsEl"]) {
        const v17 = document["createElement"]("div");
        ((v17["className"] = "video-controls"),
          Object["assign"](v17["style"], {
            position: "absolute",
            bottom: "0",
            left: "0",
            width: "100%",
            padding: "16px\x2016px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "var(--media-control-overlay-bg)",
            zIndex: "12",
            opacity: "1",
            transition: "opacity\x200.2s",
          }));
        const v18 = document["createElement"]("div");
        ((v18["className"] = "video-play-btn"),
          Object["assign"](v18["style"], {
            cursor: "pointer",
            color: "var(--media-control-button-text)",
            display: "flex",
            alignItems: "center",
          }));
        const v19 = document["createElement"]("span");
        ((v19["className"] = "video-time-current"),
          Object["assign"](v19["style"], {
            color: "var(--media-control-time-text)",
            fontSize: "12px",
            fontVariantNumeric: "tabular-nums",
          }),
          (v19["textContent"] = "0:00"));
        const v20 = document["createElement"]("div");
        ((v20["className"] = "media-progress-bar"),
          Object["assign"](v20["style"], {
            flex: "1",
            height: "4px",
            background: "var(--media-control-progress-track)",
            borderRadius: "2px",
            cursor: "pointer",
            position: "relative",
          }));
        const v21 = document["createElement"]("div");
        ((v21["className"] = "media-progress-fill"),
          Object["assign"](v21["style"], {
            width: "0%",
            height: "100%",
            background: "var(--media-control-progress-fill)",
            borderRadius: "2px",
            pointerEvents: "none",
            position: "relative",
          }));
        const v22 = document["createElement"]("div");
        ((v22["className"] = "media-progress-knob"),
          Object["assign"](v22["style"], {
            width: "10px",
            height: "10px",
            background: "var(--media-control-progress-fill)",
            borderRadius: "50%",
            position: "absolute",
            right: "-5px",
            top: "-3px",
            boxShadow: "0 0 4px var(--media-control-knob-shadow)",
          }),
          v21["appendChild"](v22),
          v20["appendChild"](v21));
        const v23 = document["createElement"]("span");
        ((v23["className"] = "video-time-total"),
          Object["assign"](v23["style"], {
            color: "var(--media-control-time-text)",
            fontSize: "12px",
            fontVariantNumeric: "tabular-nums",
          }),
          (v23["textContent"] = "0:00"));
        const v24 = document["createElement"]("div");
        ((v24["className"] = "video-snap-btn"),
          (v24["title"] = "截取当前帧"),
          Object["assign"](v24["style"], {
            cursor: "pointer",
            color: "var(--media-control-button-text)",
            display: "flex",
            alignItems: "center",
          }),
          (v24["innerHTML"] =
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>'),
          v17["appendChild"](v18),
          v17["appendChild"](v19),
          v17["appendChild"](v20),
          v17["appendChild"](v23),
          v17["appendChild"](v24),
          v17["addEventListener"]("pointerdown", (v25) =>
            v25["stopPropagation"](),
          ),
          v17["addEventListener"]("click", (v26) => v26["stopPropagation"]()),
          v18["addEventListener"]("click", (v27) => {
            v27["stopPropagation"]();
            if (v5["isActiveFor"](this["nodeId"])) return;
            const v28 = this["_getActivePreviewVideoEl"]();
            if (!v28) return;
            (this["_toggleVideoPlayPause"](v28, {
              loop: v27["altKey"] === true,
            }),
              this["_syncVideoControlsFromVideo"](v28));
          }));
        const v29 = (v30) => {
            if (!this["_progressBarEl"]) return 0;
            const v31 = this["_progressBarEl"]["getBoundingClientRect"](),
              v32 = v31["width"] || 0;
            if (!v32) return 0;
            const v33 = v30["clientX"] - v31["left"];
            if (!Number["isFinite"](v33)) return 0;
            return Math["max"](0, Math["min"](1, v33 / v32));
          },
          v34 = (v35) => {
            if (this["_progressFillEl"])
              this["_progressFillEl"]["style"]["width"] = v35 * 100 + "%";
            const v36 = this["_getActivePreviewVideoEl"](),
              v37 = this["_getActiveVideoDuration"](v36);
            this["_timeCurrentEl"] &&
              v37 > 0 &&
              (this["_timeCurrentEl"]["textContent"] = this["_fmtVideoTime"](
                v35 * v37,
              ));
          },
          v38 = (v39) => {
            const v40 = this["_getActivePreviewVideoEl"]();
            this["_seekActiveVideoByPos"](v40, v39);
          };
        (v20["addEventListener"]("pointerdown", (v41) => {
          (v41["stopPropagation"](), v41["preventDefault"]());
          if (v5["isActiveFor"](this["nodeId"])) return;
          const v42 = this["_getActivePreviewVideoEl"]();
          if (!v42) return;
          const v43 = !!String(v42["getAttribute"]("src") || "")["trim"]();
          ((this["_isManualControl"] = true),
            (this["_isManualLoopPlayback"] = false),
            (v42["loop"] = false),
            this["_autoPlayToken"]++,
            (this["_hoverManualPause"] = true),
            v42["pause"]());
          if (!v43) {
            this["_ensureVideoSrcFor"](v42)["then"]((v44) => {
              if (!v44) return;
              const v45 = v29(v41);
              (v34(v45), v38(v45));
            });
            return;
          }
          this["_isProgressDragging"] = true;
          const v46 = v29(v41);
          (v34(v46), v38(v46));
          const v47 = (v48) => {
              const v49 = v29(v48);
              (v34(v49), v38(v49));
            },
            v50 = (v51) => {
              (v51["stopPropagation"](),
                (this["_isProgressDragging"] = false),
                window["removeEventListener"]("pointermove", v47, true),
                window["removeEventListener"]("pointerup", v50, true));
              const v52 = this["_getActivePreviewVideoEl"]();
              this["_syncVideoControlsFromVideo"](v52);
            };
          (window["addEventListener"]("pointermove", v47, true),
            window["addEventListener"]("pointerup", v50, true));
        }),
          v24["addEventListener"]("click", (v53) => {
            v53["stopPropagation"]();
            if (v5["isActiveFor"](this["nodeId"])) return;
            void this["_captureCurrentFrameFromActiveVideo"]();
          }),
          this["previewEl"]["appendChild"](v17),
          (this["_controlsEl"] = v17),
          (this["_playBtnEl"] = v18),
          (this["_timeCurrentEl"] = v19),
          (this["_timeTotalEl"] = v23),
          (this["_progressBarEl"] = v20),
          (this["_progressFillEl"] = v21),
          (this["_snapBtnEl"] = v24),
          this["_updatePlayIcon"](true));
      }
      this["_setVideoOverlaysVisible"](!this["isNoResult"]);
    }
    ["_setVideoOverlaysVisible"](v54) {
      const v55 =
          v3["getState"]()["nodes"]?.[this["nodeId"]] || this["_data"] || {},
        v56 = !!v55["isVideosExpanded"],
        v57 = !!v54 && !v56 && !v5["isActiveFor"](this["nodeId"]);
      if (this["_muteBtnEl"])
        this["_muteBtnEl"]["style"]["display"] = v57 ? "flex" : "none";
      if (this["_centerIndicatorEl"])
        this["_centerIndicatorEl"]["style"]["display"] = v57 ? "flex" : "none";
      if (this["_controlsEl"])
        this["_controlsEl"]["style"]["display"] = v57 ? "flex" : "none";
      if (v57)
        this["_syncVideoControlsFromVideo"](this["_getActivePreviewVideoEl"]());
    }
    ["_syncMuteBtnIconImpl"]() {
      if (!this["_muteIconMutedEl"] || !this["_muteIconUnmutedEl"]) return;
      ((this["_muteIconMutedEl"]["style"]["display"] = this["_isMuted"]
        ? ""
        : "none"),
        (this["_muteIconUnmutedEl"]["style"]["display"] = this["_isMuted"]
          ? "none"
          : ""));
    }
    ["_applyMuteStateToPreviewVideos"]() {
      if (!this["previewEl"]) return;
      const v58 =
          this["_data"] &&
          Number["isFinite"](Number(this["_data"]["mainVideoIndex"]))
            ? Number(this["_data"]["mainVideoIndex"])
            : Number["isFinite"](Number(this["_lastMainIdx"]))
              ? Number(this["_lastMainIdx"])
              : 0,
        v59 = Math["max"](0, Math["trunc"](v58)),
        v60 =
          Array["isArray"](this["_multiLayerEls"]) &&
          this["_multiLayerEls"]["length"] > 0;
      if (v60) {
        for (let v61 = 0; v61 < this["_multiLayerEls"]["length"]; v61++) {
          const v62 = this["_multiLayerEls"][v61];
          if (!v62) continue;
          v62["muted"] = v61 === v59 ? !!this["_isMuted"] : true;
        }
        this["_expandPanel"] &&
          this["_expandPanel"]
            ["querySelectorAll"]("video")
            ["forEach"]((v63) => {
              v63["muted"] = true;
            });
        return;
      }
      this["previewEl"]["querySelectorAll"]("video")["forEach"]((v64) => {
        v64["muted"] = !!this["_isMuted"];
      });
    }
    ["_setCenterIndicatorIcon"](v65) {
      if (!this["_centerIndicatorInnerEl"]) return;
      const v66 = document["createElementNS"](
        "http://www.w3.org/2000/svg",
        "svg",
      );
      (v66["setAttribute"]("width", "28"),
        v66["setAttribute"]("height", "28"),
        v66["setAttribute"]("viewBox", "0 0 24 24"),
        v66["setAttribute"]("fill", "currentColor"),
        (v66["style"]["color"] = "var(--canvas-white)"),
        v65 === "play"
          ? (v66["innerHTML"] =
              '<polygon points="6 4 20 12 6 20 6 4"></polygon>')
          : (v66["innerHTML"] =
              '<rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect>'),
        (this["_centerIndicatorInnerEl"]["innerHTML"] = ""),
        this["_centerIndicatorInnerEl"]["appendChild"](v66));
    }
    ["_showPausedCenterIndicator"]() {
      if (!this["_centerIndicatorInnerEl"]) return;
      (this["_centerIndicatorTimer"] &&
        (clearTimeout(this["_centerIndicatorTimer"]),
        (this["_centerIndicatorTimer"] = null)),
        this["_setCenterIndicatorIcon"]("play"),
        (this["_centerIndicatorInnerEl"]["style"]["opacity"] = "1"),
        (this["_centerIndicatorInnerEl"]["style"]["transform"] = "scale(1)"));
    }
    ["_hideCenterIndicator"]() {
      if (!this["_centerIndicatorInnerEl"]) return;
      (this["_centerIndicatorTimer"] &&
        (clearTimeout(this["_centerIndicatorTimer"]),
        (this["_centerIndicatorTimer"] = null)),
        (this["_centerIndicatorInnerEl"]["style"]["opacity"] = "0"),
        (this["_centerIndicatorInnerEl"]["style"]["transform"] =
          "scale(0.92)"));
    }
    ["_flashCenterIndicator"](v67) {
      if (!this["_centerIndicatorInnerEl"]) return;
      (this["_centerIndicatorTimer"] &&
        (clearTimeout(this["_centerIndicatorTimer"]),
        (this["_centerIndicatorTimer"] = null)),
        this["_setCenterIndicatorIcon"](v67),
        (this["_centerIndicatorInnerEl"]["style"]["opacity"] = "1"),
        (this["_centerIndicatorInnerEl"]["style"]["transform"] = "scale(1)"),
        (this["_centerIndicatorTimer"] = setTimeout(() => {
          if (!this["_centerIndicatorInnerEl"]) return;
          if (v67 === "pause") this["_showPausedCenterIndicator"]();
          else this["_hideCenterIndicator"]();
          this["_centerIndicatorTimer"] = null;
        }, 520)));
    }
    ["_getActivePreviewVideoEl"]() {
      const v68 =
          this["_data"] &&
          Number["isFinite"](Number(this["_data"]["mainVideoIndex"]))
            ? Number(this["_data"]["mainVideoIndex"])
            : Number["isFinite"](Number(this["_lastMainIdx"]))
              ? Number(this["_lastMainIdx"])
              : 0,
        v69 = Math["max"](0, Math["trunc"](v68));
      if (
        Array["isArray"](this["_multiLayerEls"]) &&
        this["_multiLayerEls"]["length"] > 0
      )
        return (
          this["_multiLayerEls"][v69] ||
          this["_multiLayerEls"][0] ||
          this["videoEl"] ||
          null
        );
      return this["videoEl"] || null;
    }
    ["_toggleVideoPlayPause"](v70, v71 = {}) {
      if (!v70) return;
      const v72 = v71?.["loop"] === true;
      ((this["_isManualControl"] = true), this["_autoPlayToken"]++);
      const v73 = !!String(v70["getAttribute"]("src") || "")["trim"]();
      if (v70["paused"]) {
        ((this["_hoverManualPause"] = false),
          (this["_isManualLoopPlayback"] = v72),
          (v70["loop"] = v72));
        if (typeof this["_playPreviewVideoWithRecovery"] === "function") {
          void this["_playPreviewVideoWithRecovery"](v70, {
            reason: "manual",
            shouldContinue: () => this["_isManualControl"] === true,
          })["then"]((v74) => {
            if (!v74) {
              ((this["_isManualLoopPlayback"] = false), (v70["loop"] = false));
              return;
            }
            (this["_flashCenterIndicator"]("play"),
              this["_syncVideoControlsFromVideo"](v70));
          });
          return;
        }
        if (!v73) {
          this["_ensureVideoSrcFor"](v70)["then"]((v75) => {
            if (!v75) {
              ((this["_isManualLoopPlayback"] = false), (v70["loop"] = false));
              return;
            }
            const v76 = v70["play"]();
            (v76 &&
              typeof v76["catch"] === "function" &&
              v76["catch"](() => {
                ((this["_isManualLoopPlayback"] = false),
                  (v70["loop"] = false));
              }),
              this["_flashCenterIndicator"]("play"),
              this["_syncVideoControlsFromVideo"](v70));
          });
          return;
        }
        const v77 = v70["play"]();
        (v77 &&
          typeof v77["catch"] === "function" &&
          v77["catch"](() => {
            ((this["_isManualLoopPlayback"] = false), (v70["loop"] = false));
          }),
          this["_flashCenterIndicator"]("play"),
          this["_syncVideoControlsFromVideo"](v70));
      } else
        ((this["_hoverManualPause"] = true),
          (this["_isManualLoopPlayback"] = false),
          (v70["loop"] = false),
          v70["pause"](),
          this["_showPausedCenterIndicator"](),
          this["_syncVideoControlsFromVideo"](v70));
    }
    ["_updatePlayIcon"](v78) {
      if (!this["_playBtnEl"]) return;
      this["_playBtnEl"]["replaceChildren"]();
      const v79 = "http://www.w3.org/2000/svg",
        v80 = document["createElementNS"](v79, "svg");
      (v80["setAttribute"]("width", "16"),
        v80["setAttribute"]("height", "16"),
        v80["setAttribute"]("viewBox", "0\x200\x2024\x2024"),
        v80["setAttribute"]("fill", "currentColor"));
      if (v78) {
        const v81 = document["createElementNS"](v79, "polygon");
        (v81["setAttribute"](
          "points",
          "5\x203\x2019\x2012\x205\x2021\x205\x203",
        ),
          v80["appendChild"](v81));
      } else {
        const v82 = document["createElementNS"](v79, "rect");
        (v82["setAttribute"]("x", "6"),
          v82["setAttribute"]("y", "4"),
          v82["setAttribute"]("width", "4"),
          v82["setAttribute"]("height", "16"));
        const v83 = document["createElementNS"](v79, "rect");
        (v83["setAttribute"]("x", "14"),
          v83["setAttribute"]("y", "4"),
          v83["setAttribute"]("width", "4"),
          v83["setAttribute"]("height", "16"),
          v80["appendChild"](v82),
          v80["appendChild"](v83));
      }
      this["_playBtnEl"]["appendChild"](v80);
    }
    ["_fmtVideoTime"](v84) {
      const v85 = Number(v84);
      if (!Number["isFinite"](v85) || v85 <= 0) return "0:00";
      return (
        Math["floor"](v85 / 60) +
        ":" +
        String(Math["floor"](v85 % 60))["padStart"](2, "0")
      );
    }
    ["_getActiveVideoDuration"](v86) {
      if (v86) {
        const v87 = Number(v86["duration"]);
        if (Number["isFinite"](v87) && v87 > 0) return v87;
        const v88 = v86["seekable"];
        if (v88 && v88["length"]) {
          const v89 = Number(v88["end"](v88["length"] - 1));
          if (Number["isFinite"](v89) && v89 > 0) return v89;
        }
      }
      const v90 = Number(this["_data"]?.["videoDuration"]);
      if (Number["isFinite"](v90) && v90 > 0) return v90;
      return 0;
    }
    ["_syncVideoControlsFromVideo"](v91) {
      if (
        !this["_controlsEl"] ||
        !this["_playBtnEl"] ||
        !this["_progressFillEl"]
      )
        return;
      const v92 = v91 || this["_getActivePreviewVideoEl"]();
      if (!v92) {
        (this["_updatePlayIcon"](true),
          (this["_progressFillEl"]["style"]["width"] = "0%"));
        if (this["_timeCurrentEl"])
          this["_timeCurrentEl"]["textContent"] = "0:00";
        if (this["_timeTotalEl"]) this["_timeTotalEl"]["textContent"] = "0:00";
        return;
      }
      const v93 = this["_getActiveVideoDuration"](v92),
        v94 = Math["max"](0, Number(v92["currentTime"]) || 0),
        v95 = v93 > 0 ? Math["max"](0, Math["min"](1, v94 / v93)) : 0;
      if (!this["_isProgressDragging"] && !this["_isProgressSeeking"]) {
        this["_progressFillEl"]["style"]["width"] = v95 * 100 + "%";
        if (this["_timeCurrentEl"])
          this["_timeCurrentEl"]["textContent"] = this["_fmtVideoTime"](v94);
      }
      if (this["_timeTotalEl"])
        this["_timeTotalEl"]["textContent"] = this["_fmtVideoTime"](v93);
      this["_updatePlayIcon"](!!v92["paused"]);
    }
    ["_seekActiveVideoByPos"](v96, v97) {
      const v98 = v96 || this["_getActivePreviewVideoEl"]();
      if (!v98) return;
      const v99 = this["_getActiveVideoDuration"](v98);
      if (!Number["isFinite"](v99) || v99 <= 0) return;
      const v100 = Math["max"](0, Math["min"](1, Number(v97) || 0)),
        v101 = v100 * v99;
      this["_isProgressSeeking"] = true;
      const v102 = ++this["_progressSeekToken"];
      v98["currentTime"] = v101;
      if (this["_progressFillEl"])
        this["_progressFillEl"]["style"]["width"] = v100 * 100 + "%";
      if (this["_timeCurrentEl"])
        this["_timeCurrentEl"]["textContent"] = this["_fmtVideoTime"](v101);
      queueMicrotask(() => {
        if (v102 !== this["_progressSeekToken"]) return;
        ((this["_isProgressSeeking"] = false),
          this["_syncVideoControlsFromVideo"](v98));
      });
    }
    async ["_captureCurrentFrameFromActiveVideo"]() {
      const v103 = this["_getActivePreviewVideoEl"]();
      if (!v103) return;
      if (!getVideoFrameSource(v103)) {
        const v104 = await this["_ensureVideoSrcFor"](v103);
        if (!v104) {
          window["showToast"]?.("当前视频还未加载完成", "info");
          return;
        }
      }
      if (!isVideoFrameReady(v103)) {
        const v105 = await waitForVideoFrame(v103);
        if (!v105) {
          window["showToast"]?.("当前视频还未加载完成", "info");
          return;
        }
      }
      const v106 = v103["videoWidth"] || 0,
        v107 = v103["videoHeight"] || 0;
      if (!v106 || !v107) return;
      let v108 = null;
      try {
        v108 = await captureVideoFrameSnapshot(v103, {
          fileNamePrefix: "ai_video_frame",
        });
      } catch (v109) {
        (console["warn"]("[AIGenVideoNode] capture frame failed:", v109),
          window["showToast"]?.("当前视频源暂不支持截帧", "error"));
        return;
      }
      if (!v108?.["blob"]) return;
      const v110 = v3["getState"]()["nodes"][this["nodeId"]];
      if (!v110) return;
      const v111 = Number(v110["videoFps"]),
        v112 = Number(v110["videoFrameCount"]),
        v113 =
          Number(v110["videoDuration"]) > 0
            ? Number(v110["videoDuration"])
            : this["_getActiveVideoDuration"](v103),
        v114 =
          Number["isFinite"](v111) && v111 > 0
            ? v111
            : Number["isFinite"](v112) &&
                v112 > 0 &&
                Number["isFinite"](v113) &&
                v113 > 0
              ? v112 / v113
              : 0;
      let v115 = 0;
      if (Number["isFinite"](v114) && v114 > 0)
        ((v115 =
          Math["floor"](
            Math["max"](0, Number(v103["currentTime"]) || 0) * v114,
          ) + 1),
          Number["isFinite"](v112) && v112 > 0
            ? (v115 = Math["max"](1, Math["min"](Math["round"](v112), v115)))
            : (v115 = Math["max"](1, v115)));
      else {
        const v116 = Math["max"](
          1,
          Math["floor"](Number(v110["snapSeq"]) || 0) + 1,
        );
        ((v115 = v116),
          v3["updateNodeData"](this["nodeId"], { snapSeq: v116 }));
        const v117 =
            (Array["isArray"](v110["videos"]) &&
              v110["videos"][
                Math["max"](0, Number(v110["mainVideoIndex"]) || 0)
              ]) ||
            (Array["isArray"](v110["videos"]) ? v110["videos"][0] : null) ||
            v110,
          v118 = this["_resolveVideoMetaSrcFromVideoData"](v117);
        if (v118) this["_maybeFetchVideoMeta"](v118);
      }
      const v119 = v6(v106, v107),
        v120 = v8(
          v3["getState"]()["nodes"],
          v110,
          v119["width"],
          v119["height"],
        ),
        v121 = "src-img-" + Date["now"](),
        v122 = createCapturePreviewUrl(v108["blob"]);
      (v3["addNode"](
        v7({
          id: v121,
          type: "source-image",
          name: "截取第" + v115 + "帧",
          capturePreviewUrl: v122,
          captureSavePending: true,
          captureSaveError: null,
          originalWidth: v108["originalWidth"],
          originalHeight: v108["originalHeight"],
          fileName: v108["fileName"],
          x: v120["x"],
          y: v120["y"],
          width: v119["width"],
          height: v119["height"],
          needsAutoResize: false,
        }),
      ),
        saveVideoFrameSnapshot(v108, v4)
          ["then"]((v123) => {
            if (!v3["getStateRaw"]()["nodes"]?.[v121]) return;
            v3["updateNodeData"](v121, {
              src: v123["src"],
              localPath: v123["localPath"],
              originalLocalPath: v123["originalLocalPath"],
              displayLocalPath: v123["displayLocalPath"],
              thumbLocalPath: v123["thumbLocalPath"],
              originalWidth: v123["originalWidth"],
              originalHeight: v123["originalHeight"],
              fileName: v123["fileName"],
              captureSavePending: false,
              captureSaveError: null,
            });
          })
          ["catch"]((v124) => {
            const v125 = String(v124?.["message"] || "本地保存失败");
            (console["warn"](
              "[AIGenVideoNode] save captured frame failed:",
              v124,
            ),
              v3["getStateRaw"]()["nodes"]?.[v121] &&
                v3["updateNodeData"](v121, {
                  captureSavePending: false,
                  captureSaveError: v125,
                }),
              window["showToast"]?.("截图已显示，但本地保存失败", "warning"));
          }));
    }
  }
  return v9["prototype"];
}
