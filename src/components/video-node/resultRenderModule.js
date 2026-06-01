import {
  attachVideoPlaybackRecovery,
  getVideoCurrentSource,
  logVideoPlaybackEvent,
  playVideoWithRecovery,
} from "./mediaPlaybackRecovery.js";
import { localPathToUrl, urlToLocalPath } from "../../utils/localMediaPath.js";
import {
  attachMediaElementPlaybackSource,
  isMediaElementPlaybackSource,
} from "../../services/desktopMediaBlobSource.js";
import {
  getTaskMessage,
  isTaskCancelled,
  isTaskFailed,
} from "../../core/generationTaskUiState.js";
function isDesktopRenderer() {
  return !!globalThis["window"]?.["electronAPI"];
}
export function createVideoNodeResultRenderModule(v0) {
  const {
    store: v1,
    api: v2,
    getImage: v3,
    ensureThumbDecoded: v4,
    buildApiUrl: v5,
    VideoKeyingController: v6,
  } = v0;
  class v7 {
    ["_getPreviewVideoRecoveryLabel"](v8, v9 = "preview") {
      const v10 = String(v8?.["dataset"]?.["idx"] ?? ""),
        v11 = v10 ? v9 + ":" + v10 : v9;
      return "ai-video:" + this["nodeId"] + ":" + v11;
    }
    ["_attachPreviewVideoRecovery"](v12, v13 = "preview") {
      if (!v12) return null;
      const v14 = v13 === "hover" || v13 === "fullscreen";
      return attachVideoPlaybackRecovery(v12, {
        label: this["_getPreviewVideoRecoveryLabel"](v12, v13),
        ensureSrc: () => this["_ensureVideoSrcFor"](v12),
        minBufferAhead: v14 ? 0.5 : undefined,
        readyTimeoutMs: v14 ? 350 : undefined,
        recoveryDebounceMs: v14 ? 150 : undefined,
        recoveryCooldownMs: v14 ? 500 : undefined,
        shouldRecover: () =>
          v12["isConnected"] !== false &&
          (this["_isHovered"] || this["_isManualControl"] || !v12["paused"]),
      });
    }
    ["_logPreviewVideoPlaybackEvent"](v15, v16, v17 = "preview") {
      if (!v15) return;
      (this["_attachPreviewVideoRecovery"](v15, v17),
        logVideoPlaybackEvent(v15, v16, {
          label: this["_getPreviewVideoRecoveryLabel"](v15, v17),
        }));
    }
    async ["_playPreviewVideoWithRecovery"](v18, v19 = {}) {
      if (!v18) return false;
      const v20 = v19["reason"] || "preview";
      return (
        this["_attachPreviewVideoRecovery"](v18, v20),
        playVideoWithRecovery(v18, {
          label: this["_getPreviewVideoRecoveryLabel"](v18, v20),
          ensureSrc: () => this["_ensureVideoSrcFor"](v18),
          minBufferAhead: v20 === "hover" ? 0.5 : undefined,
          readyTimeoutMs: v20 === "hover" ? 350 : undefined,
          recoveryDebounceMs: v20 === "hover" ? 150 : undefined,
          recoveryCooldownMs: v20 === "hover" ? 500 : undefined,
          shouldRecover: () =>
            v18["isConnected"] !== false &&
            (this["_isHovered"] || this["_isManualControl"] || !v18["paused"]),
          shouldContinue:
            typeof v19["shouldContinue"] === "function"
              ? v19["shouldContinue"]
              : undefined,
        })
      );
    }
    async ["_ensureVideoSrcFor"](v21) {
      if (!v21) return false;
      const v22 = !!String(v21["getAttribute"]("src") || "")["trim"]();
      if (v22) return true;
      const v23 = v1["getState"](),
        v24 = v23["nodes"]?.[this["nodeId"]] || this["_data"] || {},
        v25 = Array["isArray"](v24["videos"]) ? v24["videos"] : [],
        v26 = Number(v21["dataset"]?.["idx"]),
        v27 = Number["isFinite"](v26) ? Math["max"](0, Math["trunc"](v26)) : 0,
        v28 = v25[v27] || null;
      if (!v28) return false;
      let v29 = this["_resolveVideoPlaybackUrl"](v28);
      if (!v29 && v28["thumbId"]) {
        const v30 = String(v28["thumbId"] || "");
        if (v30) {
          const v31 = this["_cachedVideoUrls"]["get"](v30);
          if (v31) v29 = v31;
          else {
            let v32 = null;
            try {
              v32 = await v3(v30);
            } catch {
              v32 = null;
            }
            if (v32) {
              const v33 = URL["createObjectURL"](v32);
              (this["_cachedVideoUrls"]["set"](v30, v33), (v29 = v33));
            }
          }
        }
      }
      if (!v29) return false;
      return (
        await attachMediaElementPlaybackSource(v21, v29, {
          preload: "auto",
          warmRanges: false,
          load: false,
        }),
        true
      );
    }
    ["_resolveVideoPlaybackUrl"](v34) {
      if (!v34 || typeof v34 !== "object") return "";
      return (
        this["_resolveMediaUrl"](localPathToUrl(v34["displayLocalPath"])) ||
        this["_resolveMediaUrl"](localPathToUrl(v34["localPath"])) ||
        this["_resolveMediaUrl"](v34["videoUrl"]) ||
        ""
      );
    }
    ["_resolveMediaUrl"](v35) {
      const v36 = String(v35 || "")["trim"]();
      if (!v36) return "";
      if (
        v36["startsWith"]("http://") ||
        v36["startsWith"]("https://") ||
        v36["startsWith"]("blob:") ||
        v36["startsWith"]("data:")
      )
        return v36;
      const v37 = localPathToUrl(v36);
      if (v37) return v5(v37);
      if (v36["startsWith"]("/")) return v5(v36);
      return v5("/" + v36["replace"](/^\/+/, ""));
    }
    ["_resolveVideoMetaSrcFromVideoData"](v38) {
      if (!v38) return "";
      const v39 = localPathToUrl(v38["displayLocalPath"]);
      if (v39) return v39;
      const v40 = localPathToUrl(v38["localPath"]);
      if (v40) return v40;
      const v41 = String(v38["videoUrl"] || "")["trim"]();
      if (!v41) return "";
      if (v41["startsWith"]("blob:") || v41["startsWith"]("data:")) return "";
      return localPathToUrl(urlToLocalPath(v41));
    }
    ["_getVideoSourceKey"](v42) {
      if (!v42 || typeof v42 !== "object") return "";
      return (
        String(v42["localPath"] || "")["trim"]() ||
        String(v42["videoUrl"] || "")["trim"]() ||
        String(v42["src"] || "")["trim"]() ||
        String(v42["thumbId"] || "")["trim"]()
      );
    }
    ["_isVideoMarkedUnavailable"](v43) {
      const v44 = this["_getVideoSourceKey"](v43);
      if (!v44) return false;
      const v45 = String(v43?.["mediaUnavailableSource"] || "")["trim"]();
      return v43?.["mediaUnavailable"] === true && v45 === v44;
    }
    ["_isVideoThumbMarkedUnavailable"](v46, v47 = "") {
      const v48 = String(v47 || this["_resolveVideoMetaSrcFromVideoData"](v46))[
        "trim"
      ]();
      if (!v48) return false;
      return (
        String(v46?.["videoThumbUnavailableSource"] || "")["trim"]() === v48
      );
    }
    ["_markVideoThumbUnavailable"](v49, v50, v51 = "") {
      const v52 = String(v51 || this["_resolveVideoMetaSrcFromVideoData"](v50))[
        "trim"
      ]();
      if (!v52) return;
      const v53 = v1["getState"]()["nodes"][this["nodeId"]];
      if (!v53) return;
      const v54 = Array["isArray"](v53["videos"]) ? v53["videos"] : [],
        v55 = Number(v53["mainVideoIndex"]),
        v56 = Number["isFinite"](v55) ? Math["max"](0, Math["trunc"](v55)) : 0,
        v57 = {};
      (v49 < 0 || v49 === v56) &&
        ((v57["videoThumbUnavailableSource"] = v52), (v57["thumbUrl"] = ""));
      if (v49 >= 0 && v49 < v54["length"]) {
        const v58 = v54[v49];
        if (v58 && typeof v58 === "object") {
          const v59 = v54["slice"]();
          ((v59[v49] = {
            ...v58,
            videoThumbUnavailableSource: v52,
            thumbUrl: "",
          }),
            (v57["videos"] = v59));
        }
      }
      if (Object["keys"](v57)["length"])
        v1["updateNodeData"](this["nodeId"], v57);
    }
    ["_markVideoUnavailable"](v60, v61) {
      const v62 = this["_getVideoSourceKey"](v61);
      if (!v62) return;
      const v63 = v1["getState"]()["nodes"][this["nodeId"]];
      if (!v63) return;
      const v64 = Array["isArray"](v63["videos"]) ? v63["videos"] : [],
        v65 = Number(v63["mainVideoIndex"]),
        v66 = Number["isFinite"](v65) ? Math["max"](0, Math["trunc"](v65)) : 0,
        v67 = { mediaUnavailable: true, mediaUnavailableSource: v62 };
      if (v60 < 0 || v60 === v66) v67["thumbUrl"] = "";
      if (v60 >= 0 && v60 < v64["length"]) {
        const v68 = v64[v60];
        if (v68 && typeof v68 === "object") {
          const v69 = v64["slice"]();
          ((v69[v60] = {
            ...v68,
            mediaUnavailable: true,
            mediaUnavailableSource: v62,
            thumbUrl: "",
          }),
            (v67["videos"] = v69));
        }
      }
      v1["updateNodeData"](this["nodeId"], v67);
    }
    ["_clearVideoUnavailable"](v70, v71) {
      const v72 = this["_getVideoSourceKey"](v71);
      if (!v72) return;
      const v73 = v1["getState"]()["nodes"][this["nodeId"]];
      if (!v73) return;
      const v74 = {};
      v73["mediaUnavailable"] === true &&
        String(v73["mediaUnavailableSource"] || "") === v72 &&
        ((v74["mediaUnavailable"] = false),
        (v74["mediaUnavailableSource"] = ""));
      const v75 = Array["isArray"](v73["videos"]) ? v73["videos"] : [];
      if (v70 >= 0 && v70 < v75["length"]) {
        const v76 = v75[v70];
        if (
          v76 &&
          typeof v76 === "object" &&
          v76["mediaUnavailable"] === true &&
          String(v76["mediaUnavailableSource"] || "") === v72
        ) {
          const v77 = v75["slice"]();
          ((v77[v70] = {
            ...v76,
            mediaUnavailable: false,
            mediaUnavailableSource: "",
          }),
            (v74["videos"] = v77));
        }
      }
      if (Object["keys"](v74)["length"])
        v1["updateNodeData"](this["nodeId"], v74);
    }
    ["_shouldFetchVideoMetaForNodeInfo"]() {
      try {
        const v78 =
          typeof v1["getStateRaw"] === "function"
            ? v1["getStateRaw"]()
            : v1["getState"]();
        return v78?.["ui"]?.["showVideoMeta"] === true;
      } catch {
        return false;
      }
    }
    async ["_maybeFetchVideoMeta"](v79) {
      if (!this["_shouldFetchVideoMetaForNodeInfo"]()) return;
      const v80 = String(v79 || "")["trim"]();
      if (!v80) return;
      const v81 = v1["getState"]()["nodes"][this["nodeId"]];
      if (!v81) return;
      const v82 = String(v81["videoMetaSrc"] || ""),
        v83 =
          Number["isFinite"](Number(v81["videoFps"])) &&
          Number(v81["videoFps"]) > 0 &&
          Number["isFinite"](Number(v81["videoFrameCount"])) &&
          Number(v81["videoFrameCount"]) > 0;
      if (v83 && v82 === v80) return;
      v82 &&
        v82 !== v80 &&
        v1["updateNodeData"](this["nodeId"], {
          videoMetaSrc: v80,
          videoFps: null,
          videoFrameCount: null,
          videoDuration: null,
          videoWidth: null,
          videoHeight: null,
        });
      const v84 = ++this["_metaFetchToken"];
      try {
        const v85 = await v2["fetchVideoMetaFromServer"](v80);
        if (v84 !== this["_metaFetchToken"]) return;
        if (!v85 || v85["success"] !== true) return;
        const v86 = Number(v85["fps"]),
          v87 = Number(v85["frameCount"]),
          v88 = Number(v85["duration"]),
          v89 = Number(v85["width"]),
          v90 = Number(v85["height"]),
          v91 = { videoMetaSrc: v80 };
        if (Number["isFinite"](v86) && v86 > 0) v91["videoFps"] = v86;
        if (Number["isFinite"](v87) && v87 > 0)
          v91["videoFrameCount"] = Math["round"](v87);
        if (Number["isFinite"](v88) && v88 > 0) v91["videoDuration"] = v88;
        if (Number["isFinite"](v89) && v89 > 0)
          v91["videoWidth"] = Math["round"](v89);
        if (Number["isFinite"](v90) && v90 > 0)
          v91["videoHeight"] = Math["round"](v90);
        const v92 = v1["getState"]()["nodes"][this["nodeId"]];
        if (!v92) return;
        const v93 =
          String(v92["videoMetaSrc"] || "") !==
            String(v91["videoMetaSrc"] || "") ||
          Number(v92["videoFps"] || 0) !== Number(v91["videoFps"] || 0) ||
          Number(v92["videoFrameCount"] || 0) !==
            Number(v91["videoFrameCount"] || 0) ||
          Number(v92["videoDuration"] || 0) !==
            Number(v91["videoDuration"] || 0) ||
          Number(v92["videoWidth"] || 0) !== Number(v91["videoWidth"] || 0) ||
          Number(v92["videoHeight"] || 0) !== Number(v91["videoHeight"] || 0);
        if (v93) v1["updateNodeData"](this["nodeId"], v91);
      } catch {}
    }
    ["_createStatusCard"](v94, v95) {
      const v96 = document["createElement"]("div");
      ((v96["className"] = "gen-status-card"),
        Object["assign"](v96["style"], {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          gap: "8px",
          padding: "16px",
          boxSizing: "border-box",
          background: "var(--bg-panel-card)",
          textAlign: "center",
        }));
      const v97 = Number(v95) === 0,
        v98 = v97 ? "var(--green)" : "var(--white-80)";
      return (
        (v96["innerHTML"] =
          '\n            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' +
          v98 +
          '" stroke-width="2">\n                <circle cx="12" cy="12" r="10"/><path d="' +
          (v97 ? "M8 12l2.5 2.5L16 9" : "M12\x208v5") +
          '" />' +
          (v97
            ? ""
            : "<line\x20x1=\x2212\x22\x20y1=\x2216\x22\x20x2=\x2212.01\x22\x20y2=\x2216\x22\x20/>") +
          "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</svg>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20style=\x22color:" +
          v98 +
          ';font-size:12px;font-weight:600;line-height:1.4;">' +
          v94 +
          "</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20"),
        v96
      );
    }
    ["_ensureStatusOverlayEl"]() {
      if (this["_statusOverlayEl"]) return this["_statusOverlayEl"];
      return (
        (this["_statusOverlayEl"] = document["createElement"]("div")),
        (this["_statusOverlayEl"]["className"] = "dreamina-status-overlay"),
        Object["assign"](this["_statusOverlayEl"]["style"], {
          position: "absolute",
          inset: "0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          padding: "16px",
          boxSizing: "border-box",
          zIndex: "11",
        }),
        this["previewEl"]["appendChild"](this["_statusOverlayEl"]),
        this["_statusOverlayEl"]
      );
    }
    ["_clearStatusOverlay"]() {
      if (!this["_statusOverlayEl"]) return;
      (this["_statusOverlayEl"]["remove"](), (this["_statusOverlayEl"] = null));
    }
    ["_getGenerationFailureMessage"](v99 = this["_data"]) {
      if (!v99 || typeof v99 !== "object") return "";
      const v100 = isTaskFailed(v99) || isTaskCancelled(v99);
      if (!v100) return "";
      return getTaskMessage(v99) || "生成失败";
    }
    ["_createErrorCard"](v101) {
      const v102 = document["createElement"]("div");
      ((v102["className"] = "gen-error-card"),
        Object["assign"](v102["style"], {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          gap: "8px",
          padding: "16px",
          boxSizing: "border-box",
          background: "var(--bg-panel-card)",
          textAlign: "center",
        }));
      const v103 = document["createElement"]("div");
      v103["innerHTML"] =
        "<svg\x20width=\x2224\x22\x20height=\x2224\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22var(--red)\x22\x20stroke-width=\x222\x22><circle\x20cx=\x2212\x22\x20cy=\x2212\x22\x20r=\x2210\x22/><line\x20x1=\x2212\x22\x20y1=\x228\x22\x20x2=\x2212\x22\x20y2=\x2212\x22/><line\x20x1=\x2212\x22\x20y1=\x2216\x22\x20x2=\x2212.01\x22\x20y2=\x2216\x22/></svg>";
      const v104 = document["createElement"]("span");
      ((v104["textContent"] = "生成失败"),
        Object["assign"](v104["style"], {
          color: "var(--red)",
          fontSize: "12px",
          fontWeight: "600",
          lineHeight: "1.4",
        }));
      const v105 = document["createElement"]("span");
      return (
        (v105["textContent"] = String(v101 || "生成失败")),
        Object["assign"](v105["style"], {
          color: "var(--white-50)",
          fontSize: "11px",
          lineHeight: "1.5",
          wordBreak: "break-word",
          maxWidth: "100%",
        }),
        v102["appendChild"](v103),
        v102["appendChild"](v104),
        v102["appendChild"](v105),
        v102
      );
    }
    ["_formatDreaminaElapsed"](v106) {
      const v107 = Math["max"](0, Math["floor"](Number(v106 || 0) / 1000)),
        v108 = Math["floor"](v107 / 60),
        v109 = v107 % 60;
      if (v108 > 0)
        return v108 + "分" + String(v109)["padStart"](2, "0") + "秒";
      return v109 + "秒";
    }
    async ["_loadAndDisplayVideo"]() {
      const v110 = this["_data"]["videos"] || [];
      v110["length"] === 0 &&
        (this["_data"]["videoUrl"] ||
          this["_data"]["localPath"] ||
          this["_data"]["thumbId"]) &&
        v110["push"]({
          videoUrl: this["_data"]["videoUrl"],
          thumbId: this["_data"]["thumbId"],
          localPath: this["_data"]["localPath"],
        });
      const v111 = (this["_data"]["rhStatusMessage"] || "")["trim"](),
        v112 = this["_data"]["rhStatusCode"],
        v113 = this["_getGenerationFailureMessage"](this["_data"]);
      if (v113 && v110["length"] === 0) {
        this["videoEl"] &&
          ((this["videoEl"]["style"]["display"] = "none"),
          this["videoEl"]["removeAttribute"]?.("src"),
          this["videoEl"]["load"]?.());
        ((this["_placeholderEl"]["style"]["display"] = "none"),
          this["_setVideoOverlaysVisible"](false));
        this["_multiVideosContainer"] &&
          (this["_multiVideosContainer"]["remove"](),
          (this["_multiVideosContainer"] = null));
        const v114 = this["_ensureStatusOverlayEl"]();
        ((v114["innerHTML"] = ""),
          v114["appendChild"](this["_createErrorCard"](v113)));
        return;
      }
      if (v111 && v110["length"] === 0) {
        this["videoEl"] &&
          ((this["videoEl"]["style"]["display"] = "none"),
          this["videoEl"]["removeAttribute"]?.("src"),
          this["videoEl"]["load"]?.());
        ((this["_placeholderEl"]["style"]["display"] = "none"),
          this["_setVideoOverlaysVisible"](false));
        this["_multiVideosContainer"] &&
          (this["_multiVideosContainer"]["remove"](),
          (this["_multiVideosContainer"] = null));
        const v115 = this["_ensureStatusOverlayEl"]();
        ((v115["innerHTML"] = ""),
          v115["appendChild"](this["_createStatusCard"](v111, v112)));
        return;
      }
      this["_clearStatusOverlay"]();
      const v116 = v110["length"];
      if (v116 === 0) {
        this["videoEl"] &&
          ((this["videoEl"]["style"]["display"] = "none"),
          this["videoEl"]["removeAttribute"]?.("src"),
          this["videoEl"]["load"]?.());
        ((this["_placeholderEl"]["style"]["display"] = "flex"),
          this["_setVideoOverlaysVisible"](false));
        this["_multiVideosContainer"] &&
          (this["_multiVideosContainer"]["remove"](),
          (this["_multiVideosContainer"] = null));
        return;
      }
      const v117 = this["_data"]["mainVideoIndex"] || 0,
        v118 = v116 > 1,
        v119 = v118 && !!this["_data"]["isVideosExpanded"],
        v120 = Math["max"](
          0,
          Math["min"](v116 - 1, Math["trunc"](Number(v117) || 0)),
        ),
        v121 =
          v110[
            Math["max"](
              0,
              Math["min"](v116 - 1, Math["trunc"](Number(v117) || 0)),
            )
          ] ||
          v110[0] ||
          null,
        v122 = !!String(v121?.["error"] || "")["trim"](),
        v123 = this["_isVideoMarkedUnavailable"](v121),
        v124 = this["_resolveVideoMetaSrcFromVideoData"](v121);
      if (v124 && !v123 && !v122) this["_maybeFetchVideoMeta"](v124);
      const v125 = (v126, v127) => {
          if (this["_isVideoMarkedUnavailable"](v127)) return;
          const v128 = this["_resolveVideoMetaSrcFromVideoData"](v127);
          if (!v128) return;
          if (!(v128["startsWith"]("/output/") || v128["startsWith"]("/data/")))
            return;
          if (this["_isVideoThumbMarkedUnavailable"](v127, v128)) return;
          const v129 = v1["getState"]()["nodes"]?.[this["nodeId"]] || {},
            v130 =
              ["waiting", "processing"]["includes"](
                String(v129["mediaTaskStatus"] || ""),
              ) &&
              ["videoFirstFrame", "videoPoster"]["includes"](
                String(v129["mediaTaskKind"] || ""),
              );
          if (String(v127?.["videoThumbSrc"] || "")["trim"]() === v128) {
            if (String(v127?.["thumbUrl"] || "")["trim"]() || v130) return;
          }
          const v131 = "out|" + this["nodeId"] + "|" + v126 + "|" + v128;
          if (this["_videoThumbPending"]["has"](v131)) return;
          this["_videoThumbPending"]["add"](v131);
          const v132 = v1["getState"]()["nodes"]?.[this["nodeId"]],
            v133 = Array["isArray"](v132?.["videos"]) ? v132["videos"] : [];
          if (v126 >= 0 && v126 < v133["length"]) {
            const v134 = v133[v126];
            if (
              v134 &&
              typeof v134 === "object" &&
              String(v134["videoThumbSrc"] || "")["trim"]() !== v128
            ) {
              const v135 = v133["slice"]();
              ((v135[v126] = { ...v134, videoThumbSrc: v128 }),
                v1["updateNodeData"](this["nodeId"], { videos: v135 }));
            }
          }
          v2["fetchVideoFirstFrameThumbFromServer"](v128, {
            nodeId: this["nodeId"],
            assetId: String(v127?.["assetId"] || v127?.["thumbId"] || ""),
          })
            ["then"]((v136) => {
              const v137 = String(v136?.["thumbUrl"] || v136?.["url"] || "")[
                "trim"
              ]();
              if (!v137) return;
              const v138 = v1["getState"](),
                v139 = v138["nodes"]?.[this["nodeId"]];
              if (!v139) return;
              const v140 = Array["isArray"](v139["videos"])
                ? v139["videos"]
                : [];
              if (!(v126 >= 0 && v126 < v140["length"])) return;
              const v141 = v140[v126];
              if (!v141 || typeof v141 !== "object") return;
              const v142 = {
                ...v141,
                videoThumbSrc: v128,
                videoThumbUnavailableSource: "",
              };
              if (!String(v142["thumbUrl"] || "")["trim"]() && v137)
                v142["thumbUrl"] = v137;
              const v143 = v140["slice"]();
              v143[v126] = v142;
              const v144 = { videos: v143 },
                v145 = Number(v139["mainVideoIndex"]),
                v146 = Number["isFinite"](v145)
                  ? Math["max"](0, Math["trunc"](v145))
                  : 0;
              if (v126 === v146) v144["videoThumbUnavailableSource"] = "";
              if (v126 === v146) {
                if (!String(v139["thumbUrl"] || "")["trim"]() && v137)
                  v144["thumbUrl"] = v137;
              }
              v1["updateNodeData"](this["nodeId"], v144);
            })
            ["catch"](() => {
              const v147 =
                  v1["getState"]()["nodes"]?.[this["nodeId"]] ||
                  this["_data"] ||
                  {},
                v148 = Array["isArray"](v147["videos"]) ? v147["videos"] : [],
                v149 = v148[v126] || v127 || {},
                v150 = this["_resolveVideoMetaSrcFromVideoData"](v149);
              v150 === v128 &&
                this["_markVideoThumbUnavailable"](v126, v149, v128);
            })
            ["finally"](() => {
              this["_videoThumbPending"]["delete"](v131);
            });
        },
        v151 = v110["map"](
          (v152) =>
            (v152["videoUrl"] || "") +
            "|" +
            (v152["localPath"] || "") +
            "|" +
            (v152["displayLocalPath"] || "") +
            "|" +
            (v152["thumbId"] || "") +
            "|" +
            (v152["error"] || ""),
        )["join"]("||"),
        v153 = v151 !== this["_lastVideosKeyStr"],
        v154 = v117 !== this["_lastMainIdx"],
        v155 = v119 !== this["_lastIsExpanded"],
        v156 = !this["_expandPanel"] || v153 || v154 || v155;
      ((this["_lastVideosKeyStr"] = v151),
        (this["_lastMainIdx"] = v117),
        (this["_lastIsExpanded"] = v119));
      !this["_multiVideosContainer"] &&
        ((this["_multiVideosContainer"] = document["createElement"]("div")),
        Object["assign"](this["_multiVideosContainer"]["style"], {
          position: "absolute",
          inset: "0",
          width: "100%",
          height: "100%",
        }),
        this["previewEl"]["appendChild"](this["_multiVideosContainer"]));
      const v157 = String(this["_data"]["thumbUrl"] || "")["trim"](),
        v158 = new Array(v116)["fill"](""),
        v159 = new Array(v116)["fill"](""),
        v160 = [];
      for (let v161 = 0; v161 < v116; v161++) {
        const v162 = v110[v161] || {},
          v163 = this["_isVideoMarkedUnavailable"](v162),
          v164 = v163
            ? ""
            : String(v162["thumbUrl"] || "")["trim"]() ||
              (v161 === v120 ? v157 : "");
        if (v164) v159[v161] = this["_resolveMediaUrl"](v164);
        const v165 = v161 === v120,
          v166 = v119 || (!isDesktopRenderer() && v165 && !v159[v161]);
        if (v166 && !v163) {
          let v167 = this["_resolveVideoPlaybackUrl"](v162);
          if (!v167 && v162["thumbId"]) {
            const v168 = String(v162["thumbId"] || ""),
              v169 = v168 ? this["_cachedVideoUrls"]["get"](v168) : "";
            if (v169) v167 = v169;
            else v160["push"]({ i: v161, thumbId: v168 });
          }
          v158[v161] = v167;
        }
      }
      const v170 = v122 || (!v123 && (!!v158[v120] || !!v159[v120]));
      ((this["_placeholderEl"]["style"]["display"] = v170 ? "none" : "flex"),
        this["_setVideoOverlaysVisible"](!v122 && v170 && !v119));
      if (!v122 && v159[v120]) v4(v159[v120]);
      else {
        if (!v122) v125(v120, v121);
      }
      const v171 = (v172) => {
          if (this["_isExpandedPickClosing"]) return;
          this["_isExpandedPickClosing"] = true;
          const v173 = this["_root"]["querySelectorAll"](
              ".multi-flyout-panel\x20>\x20div",
            ),
            v174 = () => {
              const v175 = v110[v172];
              if (!v175 || typeof v175 !== "object")
                return { w: 0, h: 0, d: 0 };
              const v176 = Number(v175["videoWidth"] || 0),
                v177 = Number(v175["videoHeight"] || 0),
                v178 = Number(v175["duration"]);
              return {
                w: Number["isFinite"](v176) ? v176 : 0,
                h: Number["isFinite"](v177) ? v177 : 0,
                d: v178,
              };
            },
            v179 = () => {
              const v180 = v174(),
                v181 = {
                  mainVideoIndex: v172,
                  isVideosExpanded: false,
                  videoUrl: v110[v172]["videoUrl"],
                  localPath: v110[v172]["localPath"],
                  displayLocalPath: v110[v172]["displayLocalPath"] || "",
                  thumbId: v110[v172]["thumbId"],
                };
              v180["w"] > 0 &&
                v180["h"] > 0 &&
                ((v181["selectedVideoWidth"] = v180["w"]),
                (v181["selectedVideoHeight"] = v180["h"]),
                (v181["videoWidth"] = v180["w"]),
                (v181["videoHeight"] = v180["h"]));
              if (Number["isFinite"](v180["d"]) && v180["d"] > 0)
                v181["videoDuration"] = v180["d"];
              return v181;
            };
          if (v173["length"] > 0) {
            const v182 = this["previewEl"]["offsetTop"],
              v183 = 0,
              v184 = v182;
            (v173["forEach"]((v185) => {
              ((v185["style"]["transition"] =
                "all\x200.35s\x20cubic-bezier(0.6,\x20-0.28,\x200.735,\x200.045)"),
                (v185["style"]["opacity"] = "0"),
                (v185["style"]["transform"] = "scale(0.01) rotate(-45deg)"),
                (v185["style"]["filter"] = "blur(10px)"),
                (v185["style"]["top"] = v184 + "px"),
                (v185["style"]["left"] = v183 + "px"));
            }),
              setTimeout(() => {
                (v1["updateNodeData"](this["nodeId"], v179()),
                  (this["_isExpandedPickClosing"] = false));
              }, 350));
          } else
            (v1["updateNodeData"](this["nodeId"], v179()),
              (this["_isExpandedPickClosing"] = false));
        },
        v186 = (v187, v188) => {
          const v189 = {
              bg: "var(--black-45)",
              color: "var(--white-90)",
              border: "1px solid var(--white-15)",
            },
            v190 = {
              bg: "var(--black-70)",
              color: "var(--white-80)",
              border: "1px solid transparent",
            },
            v191 = v188 ? v190 : v189;
          ((v187["innerHTML"] = v188
            ? "<span>" +
              v116 +
              ' 个</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>'
            : "<span>" +
              v116 +
              "\x20个</span><svg\x20width=\x2216\x22\x20height=\x2216\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22><polyline\x20points=\x226\x209\x2012\x2015\x2018\x209\x22></polyline></svg>"),
            (v187["style"]["background"] = v191["bg"]),
            (v187["style"]["color"] = v191["color"]),
            (v187["style"]["border"] = v191["border"]));
        };
      if (v153 || !this["_multiStackWrap"]) {
        ((this["_multiVideosContainer"]["innerHTML"] = ""),
          (this["_multiLayerEls"] = []),
          (this["_multiErrorEls"] = []),
          (this["_multiToggleBtn"] = null),
          (this["_multiStackWrap"] = document["createElement"]("div")),
          Object["assign"](this["_multiStackWrap"]["style"], {
            position: "relative",
            width: "100%",
            height: "100%",
          }));
        for (let v192 = v116 - 1; v192 >= 0; v192--) {
          const v193 = document["createElement"]("video");
          v193["dataset"]["idx"] = String(v192);
          if (v159[v192]) v193["poster"] = v159[v192];
          const v194 = v192 === v120 && !v159[v192];
          if (v194 && v158[v192]) v193["src"] = v158[v192];
          ((v193["autoplay"] = false),
            (v193["loop"] = false),
            (v193["muted"] = true),
            (v193["playsInline"] = true),
            (v193["preload"] = v194
              ? "auto"
              : v159[v192]
                ? "none"
                : "metadata"),
            (v193["draggable"] = false),
            v193["addEventListener"]("dragstart", (v195) =>
              v195["preventDefault"](),
            ),
            (v193["style"]["position"] = "absolute"),
            (v193["style"]["top"] = "0"),
            (v193["style"]["left"] = "0"),
            (v193["style"]["width"] = "100%"),
            (v193["style"]["height"] = "100%"),
            (v193["style"]["objectFit"] = "contain"),
            (v193["style"]["borderRadius"] = "8px"),
            (v193["style"]["transition"] =
              "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)"),
            (v193["style"]["transformOrigin"] = "top left"),
            v193["classList"]["add"]("v2-media-preview"),
            this["_attachPreviewVideoRecovery"](v193, "preview"));
          const v196 = () => {
              const v197 =
                  v1["getState"]()["nodes"][this["nodeId"]] ||
                  this["_data"] ||
                  {},
                v198 = Number(v197["mainVideoIndex"]) || 0,
                v199 = Math["max"](0, Math["trunc"](v198));
              return v192 === v199;
            },
            v200 = (v201, v202, v203) => {
              const v204 = v1["getState"]()["nodes"][this["nodeId"]];
              if (!v204) return;
              const v205 = Array["isArray"](v204["videos"])
                  ? v204["videos"]
                  : [],
                v206 = v205[v192] || null;
              if (!v206 || typeof v206 !== "object") return;
              const v207 = { ...v206 };
              let v208 = false;
              v201 > 0 &&
                Number(v207["videoWidth"] || 0) !== v201 &&
                ((v207["videoWidth"] = v201), (v208 = true));
              v202 > 0 &&
                Number(v207["videoHeight"] || 0) !== v202 &&
                ((v207["videoHeight"] = v202), (v208 = true));
              Number["isFinite"](v203) &&
                v203 > 0 &&
                Number(v207["duration"] || 0) !== v203 &&
                ((v207["duration"] = v203), (v208 = true));
              if (!v208) return;
              const v209 = v205["slice"]();
              v209[v192] = v207;
              const v210 = { videos: v209 };
              if (v196()) {
                if (v201 > 0 && Number(v204["videoWidth"] || 0) !== v201)
                  v210["videoWidth"] = v201;
                if (v202 > 0 && Number(v204["videoHeight"] || 0) !== v202)
                  v210["videoHeight"] = v202;
                if (
                  v201 > 0 &&
                  Number(v204["selectedVideoWidth"] || 0) !== v201
                )
                  v210["selectedVideoWidth"] = v201;
                if (
                  v202 > 0 &&
                  Number(v204["selectedVideoHeight"] || 0) !== v202
                )
                  v210["selectedVideoHeight"] = v202;
                if (
                  Number["isFinite"](v203) &&
                  v203 > 0 &&
                  Number(v204["videoDuration"] || 0) !== v203
                )
                  v210["videoDuration"] = v203;
              }
              v1["updateNodeData"](this["nodeId"], v210);
            };
          (v193["addEventListener"]("loadedmetadata", () => {
            this["_clearVideoUnavailable"](v192, v110[v192]);
            const v211 = v193["videoWidth"] || 0,
              v212 = v193["videoHeight"] || 0,
              v213 = Number(v193["duration"]);
            v200(v211, v212, v213);
            if (v196()) this["_syncVideoControlsFromVideo"](v193);
          }),
            v193["addEventListener"]("error", () => {
              const v214 =
                  v1["getState"]()["nodes"][this["nodeId"]] ||
                  this["_data"] ||
                  {},
                v215 = Array["isArray"](v214["videos"]) ? v214["videos"] : [],
                v216 = v215[v192] || v110[v192] || {},
                v217 = Number(v214["mainVideoIndex"]),
                v218 = Number["isFinite"](v217)
                  ? Math["max"](0, Math["trunc"](v217))
                  : 0;
              if (v192 === v218) {
                (v193["removeAttribute"]("poster"),
                  v193["removeAttribute"]("src"));
                try {
                  v193["load"]?.();
                } catch {}
                ((this["_placeholderEl"]["style"]["display"] = "flex"),
                  this["_setVideoOverlaysVisible"](false),
                  this["_hideCenterIndicator"](),
                  this["_syncVideoControlsFromVideo"](null));
              }
              this["_markVideoUnavailable"](v192, v216);
            }),
            v193["addEventListener"]("timeupdate", () => {
              if (v196()) this["_syncVideoControlsFromVideo"](v193);
            }),
            v193["addEventListener"]("pause", () => {
              v196() &&
                (this["_showPausedCenterIndicator"](),
                this["_syncVideoControlsFromVideo"](v193));
            }),
            v193["addEventListener"]("play", () => {
              v196() &&
                (this["_hideCenterIndicator"](),
                this["_syncVideoControlsFromVideo"](v193));
            }),
            v193["addEventListener"]("ended", () => {
              v196() &&
                (this["_showPausedCenterIndicator"](),
                this["_syncVideoControlsFromVideo"](v193));
            }),
            v193["addEventListener"]("click", (v219) => {
              const v220 = v1["getState"]()["nodes"][this["nodeId"]];
              if (v220["isVideosExpanded"]) {
                (v219["stopPropagation"](), v171(this["_lastMainIdx"] || 0));
                return;
              }
              if (v219["detail"] && v219["detail"] > 1) return;
              v219["stopPropagation"]();
              if (v6["isActiveFor"](this["nodeId"])) return;
              if (this["_videoClickTimer"])
                clearTimeout(this["_videoClickTimer"]);
              this["_videoClickTimer"] = setTimeout(() => {
                this["_videoClickTimer"] = null;
                const v221 = v1["getState"]()["nodes"][this["nodeId"]];
                if (v221?.["isVideosExpanded"]) return;
                if (v6["isActiveFor"](this["nodeId"])) return;
                this["_toggleVideoPlayPause"](v193);
              }, 180);
            }),
            v193["addEventListener"]("dblclick", (v222) => {
              v222["stopPropagation"]();
              if (v6["isActiveFor"](this["nodeId"])) return;
              this["_videoClickTimer"] &&
                (clearTimeout(this["_videoClickTimer"]),
                (this["_videoClickTimer"] = null));
              const v223 = this["_lastMainIdx"] || 0,
                v224 = v1["getState"]()["nodes"][this["nodeId"]],
                v225 = v224["videos"] || [],
                v226 = v225[v223] || v225[0];
              void this["_openFullScreenFromVideo"](v226, v193);
            }));
          if (v110[v192]["error"]) {
            const v227 = this["_createErrorCard"](v110[v192]["error"]);
            ((v227["style"]["position"] = "absolute"),
              (v227["style"]["inset"] = "0"),
              (this["_multiErrorEls"][v192] = v227),
              this["_multiStackWrap"]["appendChild"](v227));
          } else
            ((this["_multiLayerEls"][v192] = v193),
              this["_multiStackWrap"]["appendChild"](v193));
        }
        if (v160["length"] > 0) {
          const v228 = ++this["_blobResolveToken"];
          for (const v229 of v160) {
            const v230 = v229["i"],
              v231 = String(v229["thumbId"] || "");
            if (!v231) continue;
            if (this["_cachedVideoUrls"]["has"](v231)) continue;
            v3(v231)
              ["then"]((v232) => {
                if (v228 !== this["_blobResolveToken"]) return;
                if (!v232) return;
                const v233 = URL["createObjectURL"](v232);
                this["_cachedVideoUrls"]["set"](v231, v233);
                const v234 = this["_multiLayerEls"]?.[v230];
                if (!v234 || !v234["isConnected"]) return;
                if (!(v119 || v230 === v120)) return;
                v234["src"] = v233;
                try {
                  v234["load"]?.();
                } catch {}
                v230 === v120 &&
                  this["_placeholderEl"] &&
                  this["_placeholderEl"]["style"]["display"] !== "none" &&
                  ((this["_placeholderEl"]["style"]["display"] = "none"),
                  this["_setVideoOverlaysVisible"](true));
              })
              ["catch"](() => {});
          }
        }
        (v118 &&
          ((this["_multiToggleBtn"] = document["createElement"]("div")),
          (this["_multiToggleBtn"]["className"] = "multi-toggle-btn"),
          Object["assign"](this["_multiToggleBtn"]["style"], {
            position: "absolute",
            top: "8px",
            right: "8px",
            zIndex: 1005,
            padding: "6px 12px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            userSelect: "none",
            fontSize: "15px",
            fontWeight: "500",
            backdropFilter: "blur(4px)",
            transition:
              "all\x200.2s\x20cubic-bezier(0.25,\x200.8,\x200.25,\x201)",
          }),
          this["_multiToggleBtn"]["addEventListener"]("pointerdown", (v235) => {
            if (v235["button"] !== 0) return;
            (v235["preventDefault"](), v235["stopPropagation"]());
            const v236 = v1["getState"]()["nodes"][this["nodeId"]],
              v237 = !!v236["isVideosExpanded"];
            if (v237) {
              const v238 = this["_root"]["querySelectorAll"](
                ".multi-flyout-panel\x20>\x20div",
              );
              if (v238["length"] > 0) {
                const v239 = this["previewEl"]["offsetTop"],
                  v240 = 0,
                  v241 = v239;
                (v238["forEach"]((v242) => {
                  ((v242["style"]["transition"] =
                    "all 0.35s cubic-bezier(0.6, -0.28, 0.735, 0.045)"),
                    (v242["style"]["opacity"] = "0"),
                    (v242["style"]["transform"] = "scale(0.01) rotate(-45deg)"),
                    (v242["style"]["filter"] = "blur(10px)"),
                    (v242["style"]["top"] = v241 + "px"),
                    (v242["style"]["left"] = v240 + "px"));
                }),
                  setTimeout(() => {
                    v1["updateNodeData"](this["nodeId"], {
                      isVideosExpanded: false,
                    });
                  }, 350));
              } else
                v1["updateNodeData"](this["nodeId"], {
                  isVideosExpanded: false,
                });
            } else
              v1["updateNodeData"](this["nodeId"], { isVideosExpanded: true });
          }),
          this["_multiToggleBtn"]["addEventListener"]("mouseenter", () =>
            v186(this["_multiToggleBtn"], true),
          ),
          this["_multiToggleBtn"]["addEventListener"]("mouseleave", () => {
            const v243 = v1["getState"]()["nodes"][this["nodeId"]];
            v186(this["_multiToggleBtn"], !!v243["isVideosExpanded"]);
          }),
          this["_multiToggleBtn"]["addEventListener"]("click", (v244) => {
            (v244["preventDefault"](), v244["stopPropagation"]());
          }),
          this["_multiStackWrap"]["appendChild"](this["_multiToggleBtn"])),
          this["_multiVideosContainer"]["appendChild"](
            this["_multiStackWrap"],
          ));
      }
      this["_multiToggleBtn"] && v186(this["_multiToggleBtn"], v119);
      this["_applyMuteStateToPreviewVideos"]();
      for (let v245 = 0; v245 < v116; v245++) {
        const v246 = v245 === v117,
          v247 = this["_multiLayerEls"][v245],
          v248 = this["_multiErrorEls"][v245];
        if (v247) {
          const v249 = v158[v245] || "",
            v250 = v159[v245] || "",
            v251 = String(v247["getAttribute"]("src") || "")["trim"](),
            v252 = v246 && (!v250 || !!v251),
            v253 = v252 ? "auto" : v250 ? "none" : "metadata";
          if (v250 && v247["poster"] !== v250) v247["poster"] = v250;
          if (v247["preload"] !== v253) {
            v247["preload"] = v253;
            if (
              v253 === "auto" &&
              v251 &&
              v247["paused"] &&
              !this["_isHovered"] &&
              !this["_isManualControl"] &&
              Number(v247["readyState"] || 0) < 2
            )
              try {
                v247["load"]?.();
              } catch {}
          }
          if (v252) {
            !v246 &&
              v250 &&
              !v249 &&
              v251 &&
              v247["paused"] &&
              !this["_isHovered"] &&
              !this["_isManualControl"] &&
              (v247["removeAttribute"]("src"), v247["load"]?.());
            if (
              v249 &&
              v251 !== v249 &&
              !isMediaElementPlaybackSource(v247, v249)
            )
              await attachMediaElementPlaybackSource(v247, v249, {
                preload: v253,
                warmRanges: false,
                load: false,
              });
            else {
              if (!v249 && !v251 && !v250) {
                const v254 = v110[v245] || {},
                  v255 = String(v254["thumbId"] || "");
                if (v255 && (v119 || v245 === v120)) {
                  if (this["_cachedVideoUrls"]["has"](v255))
                    v247["src"] = this["_cachedVideoUrls"]["get"](v255);
                  else {
                    const v256 = ++this["_blobResolveToken"];
                    v3(v255)
                      ["then"]((v257) => {
                        if (v256 !== this["_blobResolveToken"]) return;
                        if (!v257) return;
                        const v258 = URL["createObjectURL"](v257);
                        this["_cachedVideoUrls"]["set"](v255, v258);
                        if (!v247["isConnected"]) return;
                        v247["src"] = v258;
                        try {
                          v247["load"]?.();
                        } catch {}
                        v245 === v120 &&
                          this["_placeholderEl"] &&
                          this["_placeholderEl"]["style"]["display"] !==
                            "none" &&
                          ((this["_placeholderEl"]["style"]["display"] =
                            "none"),
                          this["_setVideoOverlaysVisible"](!v119));
                      })
                      ["catch"](() => {});
                  }
                }
              }
            }
          } else v251 && (v247["removeAttribute"]("src"), v247["load"]?.());
          ((v247["style"]["display"] = v246 ? "block" : "none"),
            (v247["style"]["pointerEvents"] = v246 ? "" : "none"),
            v246 &&
              ((v247["style"]["transform"] = "rotate(0deg) scale(1)"),
              (v247["style"]["opacity"] = "1"),
              (v247["style"]["zIndex"] = v116 + 1),
              (v247["style"]["boxShadow"] = "0 4px 12px var(--black-40)")));
        }
        v248 &&
          ((v248["style"]["display"] = v246 ? "flex" : "none"),
          (v248["style"]["zIndex"] = v246 ? v116 + 1 : v245));
      }
      const v259 = this["_multiLayerEls"][v117];
      if (v259) {
        const v260 = v259["videoWidth"] || 0,
          v261 = v259["videoHeight"] || 0,
          v262 = Number(v259["duration"]),
          v263 = v1["getState"]()["nodes"][this["nodeId"]];
        if (v263) {
          const v264 = {};
          if (v260 > 0 && Number(v263["videoWidth"] || 0) !== v260)
            v264["videoWidth"] = v260;
          if (v261 > 0 && Number(v263["videoHeight"] || 0) !== v261)
            v264["videoHeight"] = v261;
          if (v260 > 0 && Number(v263["selectedVideoWidth"] || 0) !== v260)
            v264["selectedVideoWidth"] = v260;
          if (v261 > 0 && Number(v263["selectedVideoHeight"] || 0) !== v261)
            v264["selectedVideoHeight"] = v261;
          if (
            Number["isFinite"](v262) &&
            v262 > 0 &&
            Number(v263["videoDuration"] || 0) !== v262
          )
            v264["videoDuration"] = v262;
          if (Object["keys"](v264)["length"])
            v1["updateNodeData"](this["nodeId"], v264);
        }
      }
      if (v259 && v259["paused"]) this["_showPausedCenterIndicator"]();
      else this["_hideCenterIndicator"]();
      this["_syncVideoControlsFromVideo"](v259 || null);
      if (v119) {
        ((this["_root"]["style"]["position"] = "relative"),
          this["_root"]["style"]["setProperty"](
            "overflow",
            "visible",
            "important",
          ));
        if (!v156) return;
        const v265 = v116 <= 2 ? v116 : 2,
          v266 = Math["ceil"](v116 / v265),
          v267 = 12,
          v268 = this["previewEl"]["offsetWidth"],
          v269 = this["previewEl"]["offsetHeight"],
          v270 = this["previewEl"]["offsetTop"],
          v271 = v266 - 1,
          v272 = 0,
          v273 = [];
        for (let v274 = 0; v274 < v116; v274++) {
          if (v274 !== v117)
            v273["push"]({ video: v110[v274], url: v158[v274], origIdx: v274 });
        }
        this["_expandPanel"] &&
          this["_expandPanel"]["parentNode"] &&
          this["_expandPanel"]["parentNode"]["removeChild"](
            this["_expandPanel"],
          );
        ((this["_expandPanel"] = document["createElement"]("div")),
          (this["_expandPanel"]["className"] = "multi-flyout-panel"),
          Object["assign"](this["_expandPanel"]["style"], {
            position: "absolute",
            top: "0",
            left: "0",
            width: "0",
            height: "0",
            zIndex: "12000",
            pointerEvents: "none",
          }));
        const v275 = [];
        for (let v276 = 0; v276 < v266; v276++) {
          for (let v277 = 0; v277 < v265; v277++) {
            if (v276 === v271 && v277 === v272) continue;
            v275["push"]({ r: v276, c: v277 });
          }
        }
        v266 === 2 &&
          v265 === 2 &&
          ((v275["length"] = 0),
          v275["push"]({ r: 1, c: 1 }),
          v275["push"]({ r: 0, c: 0 }),
          v275["push"]({ r: 0, c: 1 }));
        for (let v278 = 0; v278 < v273["length"]; v278++) {
          if (v278 >= v275["length"]) break;
          const v279 = v275[v278]["r"],
            v280 = v275[v278]["c"],
            { video: v281, url: v282, origIdx: v283 } = v273[v278],
            v284 = v270 + (v279 - v271) * (v269 + v267),
            v285 = v280 * (v268 + v267),
            v286 = v270,
            v287 = 0,
            v288 = document["createElement"]("div");
          (Object["assign"](v288["style"], {
            position: "absolute",
            top: v286 + "px",
            left: v287 + "px",
            width: v268 + "px",
            height: v269 + "px",
            cursor: "pointer",
            overflow: "hidden",
            borderRadius: "18px",
            border: "1px solid var(--white-10)",
            backgroundColor: "var(--white-05)",
            boxShadow: "0 20px 60px var(--black-80)",
            backdropFilter: "blur(20px)",
            pointerEvents: "auto",
            opacity: "0",
            transform: "scale(0.2) rotate(-30deg)",
            filter: "blur(8px)",
            transformOrigin: "bottom\x20left",
            transition:
              "all 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.27), filter 0.4s ease-out",
            zIndex: String(12000 - v278),
          }),
            (v288["style"]["pointerEvents"] = "auto"),
            requestAnimationFrame(() => {
              setTimeout(() => {
                ((v288["style"]["opacity"] = "1"),
                  (v288["style"]["top"] = v284 + "px"),
                  (v288["style"]["left"] = v285 + "px"),
                  (v288["style"]["transform"] = "scale(1) rotate(0deg)"),
                  (v288["style"]["filter"] = "blur(0px)"));
              }, v278 * 60);
            }));
          if (v281["error"]) {
            const v289 = this["_createErrorCard"](v281["error"]);
            v288["appendChild"](v289);
          } else {
            const v290 = document["createElement"]("video");
            (Object["assign"](v290["style"], {
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }),
              (v290["dataset"]["idx"] = String(v283)),
              (v290["autoplay"] = false),
              (v290["loop"] = false),
              (v290["muted"] = true),
              (v290["playsInline"] = true));
            const v291 = v159[v283] || "";
            if (v291) ((v290["poster"] = v291), (v290["preload"] = "none"));
            else {
              v290["preload"] = v282 ? "metadata" : "none";
              if (v282) v290["src"] = v282;
            }
            (attachVideoPlaybackRecovery(v290, {
              label: "ai-video:" + this["nodeId"] + ":expanded:" + v283,
              ensureSrc: () => this["_ensureVideoSrcFor"](v290),
              shouldRecover: () =>
                v290["isConnected"] !== false && !v290["paused"],
            }),
              v288["appendChild"](v290));
          }
          const v292 = (v293) => {
            if (v293["type"] === "pointerdown" && v293["button"] !== 0) return;
            (v293["preventDefault"](), v293["stopPropagation"](), v171(v283));
          };
          (v288["addEventListener"]("pointerdown", v292),
            v288["addEventListener"]("click", v292),
            v288["addEventListener"]("dblclick", (v294) => {
              (v294["preventDefault"](), v294["stopPropagation"]());
            }),
            this["_expandPanel"]["appendChild"](v288));
        }
        this["_root"]["appendChild"](this["_expandPanel"]);
      } else
        this["_expandPanel"] &&
          this["_expandPanel"]["parentNode"] &&
          (this["_expandPanel"]["parentNode"]["removeChild"](
            this["_expandPanel"],
          ),
          (this["_expandPanel"] = null));
    }
    ["_resolveVideoDataPlaybackUrl"](v295) {
      if (!v295) return "";
      return (
        this["_resolveMediaUrl"](localPathToUrl(v295["displayLocalPath"])) ||
        this["_resolveMediaUrl"](localPathToUrl(v295["localPath"])) ||
        this["_resolveMediaUrl"](v295["videoUrl"]) ||
        ""
      );
    }
    async ["_openFullScreenFromVideo"](v296, v297 = null) {
      const v298 = document["createElement"]("div");
      Object["assign"](v298["style"], {
        position: "fixed",
        inset: "0",
        background: "var(--overlay-preview)",
        zIndex: "99999",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "default",
      });
      const v299 = getVideoCurrentSource(v297);
      if (v297 && v299) {
        const v300 = v297["parentNode"],
          v301 = v297["nextSibling"],
          v302 = this["_isManualControl"],
          v303 = this["_hoverManualPause"],
          v304 = {
            controls: v297["controls"],
            loop: v297["loop"],
            muted: v297["muted"],
            position: v297["style"]["position"],
            top: v297["style"]["top"],
            left: v297["style"]["left"],
            width: v297["style"]["width"],
            height: v297["style"]["height"],
            maxWidth: v297["style"]["maxWidth"],
            maxHeight: v297["style"]["maxHeight"],
            objectFit: v297["style"]["objectFit"],
            borderRadius: v297["style"]["borderRadius"],
            pointerEvents: v297["style"]["pointerEvents"],
            transform: v297["style"]["transform"],
            opacity: v297["style"]["opacity"],
            zIndex: v297["style"]["zIndex"],
            boxShadow: v297["style"]["boxShadow"],
          };
        ((this["_isManualControl"] = true),
          (this["_hoverManualPause"] = false),
          (v297["controls"] = true),
          (v297["loop"] = true),
          (v297["muted"] = !!this["_isMuted"]),
          Object["assign"](v297["style"], {
            position: "static",
            top: "",
            left: "",
            width: "auto",
            height: "auto",
            maxWidth: "90%",
            maxHeight: "90%",
            objectFit: "contain",
            borderRadius: "8px",
            pointerEvents: "auto",
            transform: "none",
            opacity: "1",
            zIndex: "",
            boxShadow: "0 0 50px var(--black-95)",
          }),
          attachVideoPlaybackRecovery(v297, {
            label: "ai-video:" + this["nodeId"] + ":fullscreen",
            minBufferAhead: 0.5,
            readyTimeoutMs: 350,
            recoveryDebounceMs: 150,
            recoveryCooldownMs: 500,
            shouldRecover: () =>
              v297["isConnected"] !== false && !v297["paused"],
          }));
        let v305 = false;
        const v306 = () => {
          if (v305) return;
          v305 = true;
          try {
            v297["pause"]();
          } catch {}
          ((v297["controls"] = v304["controls"]),
            (v297["loop"] = v304["loop"]),
            (v297["muted"] = v304["muted"]),
            Object["assign"](v297["style"], {
              position: v304["position"],
              top: v304["top"],
              left: v304["left"],
              width: v304["width"],
              height: v304["height"],
              maxWidth: v304["maxWidth"],
              maxHeight: v304["maxHeight"],
              objectFit: v304["objectFit"],
              borderRadius: v304["borderRadius"],
              pointerEvents: v304["pointerEvents"],
              transform: v304["transform"],
              opacity: v304["opacity"],
              zIndex: v304["zIndex"],
              boxShadow: v304["boxShadow"],
            }));
          if (v300) v300["insertBefore"](v297, v301);
          (v298["remove"](),
            (this["_isManualControl"] = v302),
            (this["_hoverManualPause"] = v303),
            this["_attachPreviewVideoRecovery"](v297, "preview"));
        };
        (v298["addEventListener"]("click", (v307) => {
          if (v307["target"] === v298) v306();
        }),
          v298["appendChild"](v297),
          document["body"]["appendChild"](v298),
          void playVideoWithRecovery(v297, {
            label: "ai-video:" + this["nodeId"] + ":fullscreen",
            minBufferAhead: 0.5,
            readyTimeoutMs: 350,
            recoveryDebounceMs: 150,
            recoveryCooldownMs: 500,
            shouldRecover: () =>
              v297["isConnected"] !== false && !v297["paused"],
          }));
        return;
      }
      const v308 = document["createElement"]("video");
      let v309 = "";
      const v310 = this["_resolveVideoDataPlaybackUrl"](v296),
        v311 = String(v296?.["thumbId"] || ""),
        v312 = Number(v297?.["currentTime"] || 0),
        v313 = () => {
          if (!(v312 > 0)) return;
          const v314 = Number(v308["duration"]),
            v315 =
              Number["isFinite"](v314) && v314 > 0
                ? Math["min"](v312, Math["max"](0, v314 - 0.05))
                : v312;
          try {
            v308["currentTime"] = v315;
          } catch {}
        };
      v308["addEventListener"]("loadedmetadata", v313, { once: true });
      const v316 = v299 || v310;
      if (v316)
        await attachMediaElementPlaybackSource(v308, v316, {
          preload: "auto",
          warmRanges: false,
          load: false,
        });
      else
        v311 &&
          v3(v311)["then"]((v317) => {
            v317 &&
              ((v309 = URL["createObjectURL"](v317)),
              (v308["src"] = v309),
              v313(),
              void playVideoWithRecovery(v308, {
                label: "ai-video:" + this["nodeId"] + ":fullscreen",
                minBufferAhead: 0.5,
                readyTimeoutMs: 350,
                recoveryDebounceMs: 150,
                recoveryCooldownMs: 500,
                shouldRecover: () =>
                  v308["isConnected"] !== false && !v308["paused"],
              }));
          });
      (attachVideoPlaybackRecovery(v308, {
        label: "ai-video:" + this["nodeId"] + ":fullscreen",
        minBufferAhead: 0.5,
        readyTimeoutMs: 350,
        recoveryDebounceMs: 150,
        recoveryCooldownMs: 500,
        shouldRecover: () => v308["isConnected"] !== false && !v308["paused"],
      }),
        (v308["preload"] = "auto"),
        (v308["controls"] = true),
        (v308["autoplay"] = true),
        (v308["loop"] = true),
        (v308["muted"] = !!this["_isMuted"]),
        Object["assign"](v308["style"], {
          maxWidth: "90%",
          maxHeight: "90%",
          boxShadow: "0 0 50px var(--black-95)",
          borderRadius: "8px",
        }),
        v298["appendChild"](v308));
      const v318 = () => {
        try {
          v308["pause"]();
        } catch {}
        v298["remove"]();
        if (v309) {
          try {
            URL["revokeObjectURL"](v309);
          } catch {}
          v309 = "";
        }
      };
      (v298["addEventListener"]("click", (v319) => {
        if (v319["target"] === v298) v318();
      }),
        document["body"]["appendChild"](v298),
        v316 &&
          void playVideoWithRecovery(v308, {
            label: "ai-video:" + this["nodeId"] + ":fullscreen",
            minBufferAhead: 0.5,
            readyTimeoutMs: 350,
            recoveryDebounceMs: 150,
            recoveryCooldownMs: 500,
            shouldRecover: () =>
              v308["isConnected"] !== false && !v308["paused"],
          }));
    }
  }
  return v7["prototype"];
}
