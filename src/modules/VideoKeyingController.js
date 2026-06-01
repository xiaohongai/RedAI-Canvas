import appStore from "../core/stores/appStore.js";
import { generateId } from "../core/math.js";
import { calcSafeSpawnPosNearNode } from "./nodeSpawn.js";
import { commit } from "./history.js";
import {
  buildGenerateVideoRequest,
  generateVideo,
} from "../../api/aiVideoApi.js";
import { cancelRunningHubTask } from "../../api/runninghubTaskApi.js";
import { getShortcuts, handleShortcutKeydown } from "./shortcuts.js";
import {
  compositeCheckerMask,
  createEraseCheckerboardPattern,
  drawEraseMaskCommand,
  getEraseCanvasPalette,
} from "./eraseBrushRenderer.js";
import {
  clampImageBrushSize,
  drawRoundBrushStroke,
  getBrushLineWidth,
  syncCircularBrushCursor,
} from "./imageEditorBrushStyle.js";
import {
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from "../services/fileService.js";
import {
  applyDebugWrenchIcon,
  formatFinalApiDebugRequest,
} from "../utils/debugRequestPreview.js";
import {
  localPathToUrl,
  pickResultLocalPath,
} from "../utils/localMediaPath.js";
import {
  attachVideoKeyingPlaybackSource,
  renderVideoKeyingThumbs,
  setVideoKeyingMediaKeepAlive,
} from "./videoKeyingMediaHelpers.js";
import {
  buildGenerationCancelledPatch,
  buildGenerationFailurePatch,
  buildGenerationStartPatch,
  buildGenerationSuccessPatch,
} from "../core/generationTaskLifecycle.js";
import {
  cancelTask as cancelTask,
  submitTask,
} from "../core/generationTaskRuntime.js";
import { shouldShowGenerationBusyUi } from "../core/generationTaskUiState.js";
import {
  buildVideoGenerationFailurePatch,
  buildVideoGenerationResultPatch,
} from "../components/video-node/videoGenerationResultRenderer.js";
import {
  getVideoKeyingExecutionId,
  getVideoKeyingModelId,
  isVideoKeyingModel,
} from "./videoKeyingManifestResolver.js";
import {
  RH_DEFAULT_INSTANCE_TYPE,
  RH_DEFAULT_KEYING_FPS,
  RH_DEFAULT_KEYING_MASK_MODE,
  RH_DEFAULT_KEYING_RESOLUTION,
  getRhKeyingFpsOptions,
  getRunningHubWorkflowApiKey,
  hasUsableKeyingSettingValue,
  normalizeRhInstanceType,
  normalizeRhKeyingFps,
  normalizeRhKeyingResolution,
  resolveSourceVideoKeyingSetting,
} from "./videoKeyingSettings.js";
const REMOVE_POS_POINT_LIMIT = 3000,
  REMOVE_MASK_MAX_SIDE = 512,
  VIDEO_KEYING_TASK_CHANGE_EVENT = "aicanvas:video-keying-task-change",
  VideoKeyingController = {
    active: false,
    nodeId: null,
    wrapperEl: null,
    barEl: null,
    trackEl: null,
    playheadEl: null,
    cancelBtnEl: null,
    confirmBtnEl: null,
    thumbEls: null,
    videoEl: null,
    durationSec: 0,
    _thumbToken: 0,
    _sourceToken: 0,
    _playheadRaf: 0,
    _retryRaf: 0,
    _retryCount: 0,
    _onLoadedMeta: null,
    _onDurationChange: null,
    _onPointerMove: null,
    _onPointerUp: null,
    _onPointerCancel: null,
    _onKeyDown: null,
    _onDocClick: null,
    _hiddenEls: null,
    markLayerEl: null,
    markCanvasEl: null,
    removeMaskCanvasEl: null,
    removeCursorEl: null,
    _marks: null,
    _marksRedo: null,
    _removeDraft: null,
    _removeDrawPointerId: null,
    _removeCursorHover: false,
    _removeCursorLast: { x: 0, y: 0 },
    _removeCursorRaf: 0,
    _removeWheelCleanup: null,
    _onMarkPointerDown: null,
    _onMarkPointerMove: null,
    _onMarkPointerUp: null,
    _onMarkPointerCancel: null,
    _onMarkPointerEnter: null,
    _onMarkPointerLeave: null,
    _onMarkWheel: null,
    _onVideoPlay: null,
    _renderMarksFn: null,
    _onResize: null,
    _onShortcutsUpdated: null,
    _rhTasks: new Map(),
    TASK_CHANGE_EVENT: VIDEO_KEYING_TASK_CHANGE_EVENT,
    _onKeyingSettingsDocDown: null,
    _lastFrameIndex: null,
    _lastFrameIndexFps: null,
    helperRightEl: null,
    hintEl: null,
    removeToolbarEl: null,
    removeSizeValueEl: null,
    removeSizeRangeEl: null,
    uiMode: "keying",
    _removePointTool: "foreground",
    _removeBrushSizePx: 40,
    _lastHelperRightText: null,
    _lastConfirmEnabled: null,
    isActiveFor(v0) {
      return !!v0 && this["active"] === true && this["nodeId"] === v0;
    },
    _isRemoveUiMode() {
      return this["uiMode"] === "remove";
    },
    _setRemovePointTool(v1) {
      const v2 = v1 === "background" ? "background" : "foreground";
      this["_removePointTool"] = v2;
      if (this["removeToolbarEl"]) {
        const v3 = v2 === "background" ? "eraser" : "brush";
        this["removeToolbarEl"]
          ["querySelectorAll"](".tool-btn")
          ["forEach"]((v4) => {
            v4["classList"]["toggle"]("active", v4["dataset"]["tool"] === v3);
          });
      }
      this["_syncRemoveCursor"]();
    },
    _clampRemoveBrushSize(v5) {
      return clampImageBrushSize(v5, 40);
    },
    _getRemoveToolType() {
      return this["_removePointTool"] === "background" ? "eraser" : "brush";
    },
    _getShortcutText(v6, v7 = "") {
      const v8 = getShortcuts?.(),
        v9 = v8?.[v6]?.["keys"];
      if (!Array["isArray"](v9) || v9["length"] === 0) return v7;
      return v9["join"]("+");
    },
    _buildShortcutTooltip(v10, v11, v12 = "") {
      const v13 = this["_getShortcutText"](v11, v12);
      return v13 ? v10 + "\x20" + v13 : v10;
    },
    _syncRemoveBrushControls() {
      const v14 = this["_clampRemoveBrushSize"](this["_removeBrushSizePx"]);
      (this["removeSizeRangeEl"] &&
        Number(this["removeSizeRangeEl"]["value"]) !== v14 &&
        (this["removeSizeRangeEl"]["value"] = String(v14)),
        this["removeSizeValueEl"] &&
          (this["removeSizeValueEl"]["textContent"] = String(v14)));
    },
    _refreshRemoveShortcutUi() {
      if (!this["_isRemoveUiMode"]()) return;
      if (this["removeToolbarEl"]) {
        const v15 = [
          [
            '[data-tool="brush"]',
            this["_buildShortcutTooltip"]("画笔", "editor-tool-brush", "B"),
          ],
          [
            '[data-tool="eraser"]',
            this["_buildShortcutTooltip"]("橡皮擦", "editor-tool-eraser", "E"),
          ],
          [
            ".act-undo",
            this["_buildShortcutTooltip"]("撤销", "undo", "Ctrl+Z"),
          ],
          [
            ".act-redo",
            this["_buildShortcutTooltip"]("重做", "redo", "Ctrl+Shift+Z"),
          ],
          [
            ".act-clear",
            this["_buildShortcutTooltip"]("清空", "editor-clear", "R"),
          ],
        ];
        v15["forEach"](([v16, v17]) => {
          const v18 = this["removeToolbarEl"]?.["querySelector"](v16);
          if (!v18) return;
          (v18["setAttribute"]("data-tooltip", v17), (v18["title"] = v17));
        });
      }
      if (this["hintEl"]) {
        const v19 = [
            "视频擦除",
            "  ·  快捷键：",
            this["_getShortcutText"]("editor-tool-brush", "B"),
            "画笔",
            "\x20\x20",
            this["_getShortcutText"]("editor-tool-eraser", "E"),
            "橡皮擦",
            "\x20\x20",
            this["_getShortcutText"]("editor-clear", "R"),
            "清空",
            "\x20\x20",
            this["_getShortcutText"]("undo", "Ctrl+Z"),
            "撤销",
            "\x20\x20",
            this["_getShortcutText"]("redo", "Ctrl+Shift+Z"),
            "重做",
            "  ·  滚轮调笔刷大小",
          ],
          v20 = Array["from"](this["hintEl"]["children"]);
        v19["forEach"]((v21, v22) => {
          if (v20[v22]) v20[v22]["textContent"] = v21;
        });
      }
    },
    _onRemoveCanvasWheel(v23) {
      (v23["preventDefault"](), v23["stopPropagation"]());
      if (
        !this["active"] ||
        !this["_isRemoveUiMode"]() ||
        !this["_removeCursorHover"]
      )
        return;
      const v24 = v23["deltaY"] || 0,
        v25 = v24 < 0 ? 1 : -1,
        v26 = this["_clampRemoveBrushSize"](this["_removeBrushSizePx"]),
        v27 = this["_clampRemoveBrushSize"](v26 + v25 * 2);
      if (v27 === v26) return;
      ((this["_removeBrushSizePx"] = v27),
        this["_syncRemoveBrushControls"](),
        this["_syncRemoveCursor"]());
    },
    _getVideoProjection(v28 = this["videoEl"] || this["_getVideoEl"]()) {
      if (!v28) return null;
      const v29 = v28["getBoundingClientRect"](),
        v30 = Number(v28["offsetWidth"]) || 0,
        v31 = Number(v28["offsetHeight"]) || 0,
        v32 = Number(v28["videoWidth"]) || 0,
        v33 = Number(v28["videoHeight"]) || 0;
      if (!v29["width"] || !v29["height"] || !v30 || !v31 || !v32 || !v33)
        return null;
      const v34 = window["getComputedStyle"](v28)["objectFit"] || "contain",
        v35 =
          v34 === "cover"
            ? Math["max"](v30 / v32, v31 / v33)
            : Math["min"](v30 / v32, v31 / v33);
      if (!Number["isFinite"](v35) || v35 <= 0) return null;
      const v36 = v29["width"] / v30,
        v37 = v29["height"] / v31;
      if (
        !Number["isFinite"](v36) ||
        v36 <= 0 ||
        !Number["isFinite"](v37) ||
        v37 <= 0
      )
        return null;
      return {
        rect: v29,
        ew: v30,
        eh: v31,
        vw: v32,
        vh: v33,
        fit: v34,
        scale: v35,
        dw: v32 * v35,
        dh: v33 * v35,
        ox: (v30 - v32 * v35) / 2,
        oy: (v31 - v33 * v35) / 2,
        sx: v36,
        sy: v37,
      };
    },
    _getLayerProjection(v38 = this["markLayerEl"]) {
      if (!v38) return null;
      const v39 = v38["getBoundingClientRect"](),
        v40 = Number(v38["offsetWidth"]) || Number(v38["clientWidth"]) || 0,
        v41 = Number(v38["offsetHeight"]) || Number(v38["clientHeight"]) || 0;
      if (!v39["width"] || !v39["height"] || !v40 || !v41) return null;
      const v42 = v39["width"] / v40,
        v43 = v39["height"] / v41;
      if (
        !Number["isFinite"](v42) ||
        v42 <= 0 ||
        !Number["isFinite"](v43) ||
        v43 <= 0
      )
        return null;
      return { rect: v39, lw: v40, lh: v41, sx: v42, sy: v43 };
    },
    _pickFromClient(v44, v45, v46 = this["_getVideoProjection"]()) {
      if (!v46) return null;
      const v47 = (v44 - v46["rect"]["left"]) / v46["sx"],
        v48 = (v45 - v46["rect"]["top"]) / v46["sy"];
      if (!Number["isFinite"](v47) || !Number["isFinite"](v48)) return null;
      if (
        v46["fit"] !== "cover" &&
        (v47 < v46["ox"] ||
          v47 > v46["ox"] + v46["dw"] ||
          v48 < v46["oy"] ||
          v48 > v46["oy"] + v46["dh"])
      )
        return null;
      const v49 = (v47 - v46["ox"]) / v46["scale"],
        v50 = (v48 - v46["oy"]) / v46["scale"];
      if (!Number["isFinite"](v49) || !Number["isFinite"](v50)) return null;
      return {
        nx: Math["max"](0, Math["min"](1, v49 / v46["vw"])),
        ny: Math["max"](0, Math["min"](1, v50 / v46["vh"])),
        videoProjection: v46,
      };
    },
    _normalizedToLayerPoint(
      v51,
      v52,
      v53 = this["_getLayerProjection"](),
      v54 = this["_getVideoProjection"](),
    ) {
      if (!v53 || !v54) return null;
      const v55 = Math["max"](0, Math["min"](1, Number(v51) || 0)),
        v56 = Math["max"](0, Math["min"](1, Number(v52) || 0)),
        v57 = v54["ox"] + v55 * v54["vw"] * v54["scale"],
        v58 = v54["oy"] + v56 * v54["vh"] * v54["scale"],
        v59 = v54["rect"]["left"] + v57 * v54["sx"],
        v60 = v54["rect"]["top"] + v58 * v54["sy"],
        v61 = (v59 - v53["rect"]["left"]) / v53["sx"],
        v62 = (v60 - v53["rect"]["top"]) / v53["sy"];
      if (!Number["isFinite"](v61) || !Number["isFinite"](v62)) return null;
      return { x: v61, y: v62 };
    },
    _scheduleRemoveCursor(v63, v64) {
      this["_removeCursorLast"] = { x: Number(v63) || 0, y: Number(v64) || 0 };
      if (this["_removeCursorRaf"]) return;
      this["_removeCursorRaf"] = requestAnimationFrame(() => {
        ((this["_removeCursorRaf"] = 0), this["_syncRemoveCursor"]());
      });
    },
    _syncRemoveCursor() {
      const v65 = this["markLayerEl"],
        v66 = this["removeCursorEl"];
      if (!this["_isRemoveUiMode"]() || !v65 || !v66) return;
      const v67 = () =>
        syncCircularBrushCursor({
          cursorEl: v66,
          canvasEl: v65,
          visible: false,
        });
      if (!this["_removeCursorHover"]) {
        v67();
        return;
      }
      const v68 = this["_getVideoProjection"](),
        v69 = this["_getLayerProjection"](v65),
        v70 = this["_pickFromClient"](
          this["_removeCursorLast"]["x"],
          this["_removeCursorLast"]["y"],
          v68,
        ),
        v71 = v70
          ? this["_normalizedToLayerPoint"](v70["nx"], v70["ny"], v69, v68)
          : null;
      if (!v68 || !v69 || !v70 || !v71) {
        v67();
        return;
      }
      const v72 = Number(v71?.["x"]),
        v73 = Number(v71?.["y"]);
      if (
        !Number["isFinite"](v72) ||
        !Number["isFinite"](v73) ||
        v72 < 0 ||
        v73 < 0 ||
        v72 > v69["lw"] ||
        v73 > v69["lh"]
      ) {
        v67();
        return;
      }
      const v74 = this["_clampRemoveBrushSize"](this["_removeBrushSizePx"]);
      syncCircularBrushCursor({
        cursorEl: v66,
        canvasEl: v65,
        visible: true,
        tool: this["_getRemoveToolType"](),
        allowedTools: ["brush", "eraser"],
        sizePx: v74,
        cursorLast: { x: v72, y: v73 },
        isEraseBrush: true,
      });
    },
    _attachMarkLayerListeners() {
      const v75 = this["markLayerEl"];
      if (!v75) return;
      if (this["_onMarkPointerDown"])
        v75["addEventListener"]("pointerdown", this["_onMarkPointerDown"]);
      if (this["_onMarkPointerMove"])
        v75["addEventListener"]("pointermove", this["_onMarkPointerMove"]);
      if (this["_onMarkPointerUp"])
        v75["addEventListener"]("pointerup", this["_onMarkPointerUp"]);
      if (this["_onMarkPointerCancel"])
        v75["addEventListener"]("pointercancel", this["_onMarkPointerCancel"]);
      if (this["_onMarkPointerCancel"])
        v75["addEventListener"](
          "lostpointercapture",
          this["_onMarkPointerCancel"],
        );
      if (this["_onMarkPointerEnter"])
        v75["addEventListener"]("pointerenter", this["_onMarkPointerEnter"]);
      if (this["_onMarkPointerLeave"])
        v75["addEventListener"]("pointerleave", this["_onMarkPointerLeave"]);
    },
    _detachMarkLayerListeners(v76 = this["markLayerEl"]) {
      if (!v76) return;
      if (this["_onMarkPointerDown"])
        v76["removeEventListener"]("pointerdown", this["_onMarkPointerDown"]);
      if (this["_onMarkPointerMove"])
        v76["removeEventListener"]("pointermove", this["_onMarkPointerMove"]);
      if (this["_onMarkPointerUp"])
        v76["removeEventListener"]("pointerup", this["_onMarkPointerUp"]);
      if (this["_onMarkPointerCancel"])
        v76["removeEventListener"](
          "pointercancel",
          this["_onMarkPointerCancel"],
        );
      if (this["_onMarkPointerCancel"])
        v76["removeEventListener"](
          "lostpointercapture",
          this["_onMarkPointerCancel"],
        );
      if (this["_onMarkPointerEnter"])
        v76["removeEventListener"]("pointerenter", this["_onMarkPointerEnter"]);
      if (this["_onMarkPointerLeave"])
        v76["removeEventListener"]("pointerleave", this["_onMarkPointerLeave"]);
    },
    _collectRemovePosPoints(v77 = REMOVE_POS_POINT_LIMIT) {
      const v78 = Array["isArray"](this["_marks"]) ? this["_marks"] : [],
        v79 = v78["filter"](
          (v80) => v80 && (v80["type"] === "brush" || v80["type"] === "eraser"),
        ),
        v81 = v79["some"]((v82) => v82["type"] === "brush");
      if (!v81) return [];
      const v83 = Math["max"](
          1,
          Math["trunc"](Number(v77) || REMOVE_POS_POINT_LIMIT),
        ),
        v84 = this["videoEl"] || this["_getVideoEl"](),
        v85 = Math["max"](
          1,
          Number(v84?.["videoWidth"]) ||
            Number(v84?.["offsetWidth"]) ||
            REMOVE_MASK_MAX_SIDE,
        ),
        v86 = Math["max"](
          1,
          Number(v84?.["videoHeight"]) ||
            Number(v84?.["offsetHeight"]) ||
            REMOVE_MASK_MAX_SIDE,
        ),
        v87 = Math["min"](1, REMOVE_MASK_MAX_SIDE / Math["max"](v85, v86)),
        v88 = Math["max"](1, Math["round"](v85 * v87)),
        v89 = Math["max"](1, Math["round"](v86 * v87)),
        v90 = document["createElement"]("canvas");
      ((v90["width"] = v88), (v90["height"] = v89));
      const v91 = v90["getContext"]("2d", { willReadFrequently: true });
      if (!v91) return [];
      const v92 = getEraseCanvasPalette(),
        v93 = v88 / Math["max"](1, Number(v84?.["offsetWidth"]) || v88);
      v79["forEach"]((v94) => {
        const v95 = Array["isArray"](v94["points"]) ? v94["points"] : [];
        if (!v95["length"]) return;
        const v96 = v94["type"] === "eraser" ? "eraser" : "brush",
          v97 = getBrushLineWidth(
            this["_clampRemoveBrushSize"](v94["brushSizePx"]),
            v93,
            v96,
          ),
          v98 = v95["map"]((v99) => ({
            x:
              Math["max"](0, Math["min"](1, Number(v99?.["nx"]) || 0)) *
              (v88 - 1),
            y:
              Math["max"](0, Math["min"](1, Number(v99?.["ny"]) || 0)) *
              (v89 - 1),
          }));
        v91["save"]();
        const v100 = v96 === "eraser" ? v92["eraseDark"] : v92["brushLight"];
        (drawRoundBrushStroke(v91, {
          points: v98,
          lineWidth: v97,
          strokeStyle: v100,
          fillStyle: v100,
          globalCompositeOperation:
            v96 === "eraser" ? "destination-out" : "source-over",
        }),
          v91["restore"]());
      });
      const v101 = v91["getImageData"](0, 0, v88, v89)["data"],
        v102 = [],
        v103 = new Set(),
        v104 = (v105, v106) => {
          const v107 = v88 > 1 ? v105 / (v88 - 1) : 0,
            v108 = v89 > 1 ? v106 / (v89 - 1) : 0,
            v109 =
              Math["round"](v107 * 4000) + ":" + Math["round"](v108 * 4000);
          if (v103["has"](v109)) return;
          (v103["add"](v109), v102["push"]({ x: v107, y: v108 }));
        },
        v110 = (v111) => {
          for (let v112 = 0; v112 < v89; v112 += v111) {
            for (let v113 = 0; v113 < v88; v113 += v111) {
              const v114 = (v112 * v88 + v113) * 4;
              if (v101[v114 + 3] < 8) continue;
              v104(v113, v112);
              if (v102["length"] >= v83) return true;
            }
          }
          return false;
        },
        v115 = Math["max"](1, Math["floor"](Math["max"](v88, v89) / 220)),
        v116 = v110(v115);
      !v116 && v102["length"] < Math["min"](v83, 80) && v115 > 1 && v110(1);
      if (v102["length"] > v83) v102["length"] = v83;
      return v102;
    },
    _getKeyingMeta() {
      const v117 = appStore["getState"]()["nodes"]?.[this["nodeId"]] || {},
        { fps: v118, resolution: v119 } = this["_getRhVideoSettings"](v117),
        v120 = Math["max"](
          1,
          Math["round"]((Number(this["durationSec"]) || 0) * v118) || 1,
        ),
        v121 = this["videoEl"] || this["_getVideoEl"](),
        v122 = Math["max"](
          0,
          Math["min"](
            Number(this["durationSec"]) || 0,
            Number(v121?.["currentTime"]) || 0,
          ),
        ),
        v123 = Math["min"](v120, Math["max"](0, Math["round"](v122 * v118)));
      return { fps: v118, res: v119, totalFrames: v120, frameIndex: v123 };
    },
    _calcKeyingFrameSize(v124, v125, v126) {
      const v127 = Math["max"](0, Math["trunc"](Number(v124) || 0)),
        v128 = Math["max"](0, Math["trunc"](Number(v125) || 0)),
        v129 = Math["max"](0, Math["trunc"](Number(v126) || 0));
      if (!v127 || !v128 || !v129) return { w: v127, h: v128 };
      const v130 = Math["max"](v127, v128),
        v131 = v129 / v130,
        v132 = Math["max"](1, Math["round"](v127 * v131)),
        v133 = Math["max"](1, Math["round"](v128 * v131));
      return { w: v132, h: v133 };
    },
    _updateHelperRight() {
      if (!this["helperRightEl"] || !this["active"]) return;
      const {
          fps: v134,
          res: v135,
          frameIndex: v136,
        } = this["_getKeyingMeta"](),
        v137 = "帧率：" + v134 + " · 分辨率：" + v135 + " · 当前帧：" + v136;
      if (this["_lastHelperRightText"] === v137) return;
      ((this["_lastHelperRightText"] = v137),
        (this["helperRightEl"]["textContent"] = v137));
    },
    _resolveSourceVideoValue(
      v138 = appStore["getState"]()["nodes"]?.[this["nodeId"]] || {},
    ) {
      return (
        v138["src"] ||
        v138["videoUrl"] ||
        v138["localPath"] ||
        v138["resultLocalPath"] ||
        ""
      );
    },
    _normalizeRhMaskMode(v139) {
      const v140 = String(v139 || "")["trim"]();
      if (!v140 || v140 === "0") return "Sec";
      if (v140 === "1") return "Sam3";
      if (v140 === "2") return "MA2";
      const v141 = v140["toLowerCase"]();
      if (v141 === "sam3") return "Sam3";
      if (v141 === "ma2" || v141 === "matanyone2") return "MA2";
      return "Sec";
    },
    _getRhVideoSettings(
      v142 = appStore["getState"]()["nodes"]?.[this["nodeId"]] || {},
    ) {
      const v143 = normalizeRhKeyingFps(
          resolveSourceVideoKeyingSetting(
            v142,
            "rhVideoFps",
            RH_DEFAULT_KEYING_FPS,
          ),
        ),
        v144 = normalizeRhKeyingResolution(
          resolveSourceVideoKeyingSetting(
            v142,
            "rhVideoResolution",
            RH_DEFAULT_KEYING_RESOLUTION,
          ),
        ),
        v145 = normalizeRhInstanceType(
          resolveSourceVideoKeyingSetting(
            v142,
            "rhInstanceType",
            RH_DEFAULT_INSTANCE_TYPE,
          ),
        );
      return { fps: v143, resolution: v144, instanceType: v145 };
    },
    _getRhMaskMode(
      v146 = appStore["getState"]()["nodes"]?.[this["nodeId"]] || {},
    ) {
      return this["_normalizeRhMaskMode"](
        resolveSourceVideoKeyingSetting(
          v146,
          "rhMaskMode",
          RH_DEFAULT_KEYING_MASK_MODE,
        ),
      );
    },
    _getSourceFrameCount(v147, v148) {
      const v149 =
          Number["isFinite"](Number(v148)) && Number(v148) > 0
            ? Number(v148)
            : 24,
        v150 = Number(v147?.["videoFrameCount"]),
        v151 = Number(v147?.["videoFps"]),
        v152 = [
          Number(v147?.["videoDuration"]),
          Number(this["durationSec"]),
          Number(this["videoEl"]?.["duration"]),
        ];
      let v153 = v152["find"]((v154) => Number["isFinite"](v154) && v154 > 0);
      !Number["isFinite"](v153) &&
        Number["isFinite"](v150) &&
        v150 > 0 &&
        Number["isFinite"](v151) &&
        v151 > 0 &&
        (v153 = v150 / v151);
      if (Number["isFinite"](v153))
        return Math["max"](1, Math["round"](v153 * v149));
      if (Number["isFinite"](v150) && v150 > 0)
        return Math["max"](1, Math["trunc"](v150));
      return Math["max"](
        1,
        Math["trunc"](Number(v147?.["rhVideoFrames"]) || v149 || 24),
      );
    },
    _computeGenerationDuration(v155) {
      const v156 = appStore["getState"]()["nodes"]?.[v155],
        v157 = Number(v156?.["generationStartTime"]);
      if (!Number["isFinite"](v157) || v157 <= 0) return 0;
      return Math["max"](0, Date["now"]() - v157);
    },
    _getRemoveMaskExportSize(v158) {
      const v159 = this["videoEl"] || this["_getVideoEl"](),
        v160 = Math["max"](
          1,
          Number(v159?.["videoWidth"]) ||
            Number(v159?.["offsetWidth"]) ||
            Number(v158) ||
            1024,
        ),
        v161 = Math["max"](
          1,
          Number(v159?.["videoHeight"]) ||
            Number(v159?.["offsetHeight"]) ||
            Number(v158) ||
            1024,
        ),
        { w: v162, h: v163 } = this["_calcKeyingFrameSize"](v160, v161, v158);
      return {
        videoEl: v159,
        sourceW: v160,
        sourceH: v161,
        width: Math["max"](1, v162 || 1),
        height: Math["max"](1, v163 || 1),
      };
    },
    _getVideoRectInLayer(
      v164 = this["_getLayerProjection"](),
      v165 = this["_getVideoProjection"](),
    ) {
      if (!v164 || !v165) return null;
      const v166 = this["_normalizedToLayerPoint"](0, 0, v164, v165),
        v167 = this["_normalizedToLayerPoint"](1, 1, v164, v165);
      if (!v166 || !v167) return null;
      const v168 = Number(v166["x"]),
        v169 = Number(v166["y"]),
        v170 = Number(v167["x"]),
        v171 = Number(v167["y"]);
      if (
        !Number["isFinite"](v168) ||
        !Number["isFinite"](v169) ||
        !Number["isFinite"](v170) ||
        !Number["isFinite"](v171)
      )
        return null;
      return {
        x: v168,
        y: v169,
        width: Math["max"](1, v170 - v168),
        height: Math["max"](1, v171 - v169),
      };
    },
    _exportRemoveMaskDataUrl(v172) {
      this["_renderMarksFn"]?.();
      const {
        videoEl: v173,
        width: v174,
        height: v175,
      } = this["_getRemoveMaskExportSize"](v172);
      if (!v174 || !v175) throw new Error("无法计算视频擦除遮罩尺寸");
      const v176 = (Array["isArray"](this["_marks"]) ? this["_marks"] : [])[
          "filter"
        ](
          (v177) =>
            v177 && (v177["type"] === "brush" || v177["type"] === "eraser"),
        ),
        v178 = v176["some"]((v179) => v179["type"] === "brush");
      if (!v178) throw new Error("请先在视频上涂抹要擦除的区域");
      const v180 = document["createElement"]("canvas");
      ((v180["width"] = v174), (v180["height"] = v175));
      const v181 = v180["getContext"]("2d");
      if (!v181) throw new Error("无法创建视频擦除遮罩");
      const v182 = getEraseCanvasPalette();
      ((v181["fillStyle"] = v182["eraseDark"]),
        v181["fillRect"](0, 0, v174, v175));
      const v183 = this["removeMaskCanvasEl"],
        v184 = this["_getLayerProjection"](this["markLayerEl"]),
        v185 = this["_getVideoProjection"](v173),
        v186 = this["_getVideoRectInLayer"](v184, v185);
      if (v183 && v186 && v183["width"] > 0 && v183["height"] > 0) {
        const v187 = Math["max"](0, Math["min"](v183["width"] - 1, v186["x"])),
          v188 = Math["max"](0, Math["min"](v183["height"] - 1, v186["y"])),
          v189 = Math["max"](
            1,
            Math["min"](v183["width"] - v187, v186["width"]),
          ),
          v190 = Math["max"](
            1,
            Math["min"](v183["height"] - v188, v186["height"]),
          );
        return (
          v181["drawImage"](v183, v187, v188, v189, v190, 0, 0, v174, v175),
          v180["toDataURL"]("image/png")
        );
      }
      return (
        v176["forEach"]((v191) => {
          const v192 = Array["isArray"](v191["points"]) ? v191["points"] : [];
          if (!v192["length"]) return;
          const v193 = v191["type"] === "eraser" ? "eraser" : "brush",
            v194 = v193 === "eraser" ? v182["eraseDark"] : v182["brushLight"],
            v195 = getBrushLineWidth(
              this["_clampRemoveBrushSize"](v191["brushSizePx"]) *
                (v174 / Math["max"](1, Number(v173?.["offsetWidth"]) || v174)),
              1,
              v193,
            ),
            v196 = v192["map"]((v197) => ({
              x:
                Math["max"](0, Math["min"](1, Number(v197?.["nx"]) || 0)) *
                (v174 - 1),
              y:
                Math["max"](0, Math["min"](1, Number(v197?.["ny"]) || 0)) *
                (v175 - 1),
            }));
          (v181["save"](),
            drawRoundBrushStroke(v181, {
              points: v196,
              lineWidth: v195,
              strokeStyle: v194,
              fillStyle: v194,
            }),
            v181["restore"]());
        }),
        v180["toDataURL"]("image/png")
      );
    },
    _updateConfirmEnabled() {
      if (!this["confirmBtnEl"] || !this["active"]) return;
      const v198 = this["nodeId"],
        v199 = v198 ? this["_rhTasks"]["get"](v198) : null;
      if (v199 && v199["running"]) {
        if (this["confirmBtnEl"]["disabled"])
          this["confirmBtnEl"]["disabled"] = false;
        return;
      }
      const { pos_points: v200, neg_points: v201 } = this["getPosNegPoints"](),
        v202 = Array["isArray"](v200) ? v200["length"] : 0,
        v203 = Array["isArray"](v201) ? v201["length"] : 0,
        v204 = this["_isRemoveUiMode"]() ? v202 > 0 : v202 > 0 && v203 < v202;
      if (this["_lastConfirmEnabled"] === v204) return;
      ((this["_lastConfirmEnabled"] = v204),
        (this["confirmBtnEl"]["disabled"] = !v204));
    },
    _finalizeRhOutputNode(
      v205,
      { jobStatus: v206, outputText: v207, extra: extra = {} } = {},
    ) {
      if (!v205) return;
      const v208 = appStore["getState"]()["nodes"]?.[v205];
      if (!v208) return;
      const v209 = this["_computeGenerationDuration"](v205),
        v210 = String(extra?.["rhTaskStatus"] || v206 || "")
          ["trim"]()
          ["toLowerCase"]();
      let v211;
      if (v210 === "cancelled" || v210 === "canceled")
        v211 = buildGenerationCancelledPatch({ duration: v209 });
      else {
        if (v210 === "success" || v210 === "succeeded" || v210 === "completed")
          v211 = buildGenerationSuccessPatch({ duration: v209 });
        else
          v210 === "failed" || v210 === "fail" || v210 === "error"
            ? (v211 = buildGenerationFailurePatch({
                error: v207,
                duration: v209,
              }))
            : (v211 = {
                ...buildGenerationCancelledPatch({ duration: v209 }),
                jobStatus: v206,
              });
      }
      appStore["updateNodeData"](v205, {
        ...v211,
        rhTaskRecovering: false,
        outputText: v207,
        ...extra,
      });
    },
    _notifyRhTaskChange(v212 = {}) {
      try {
        window["dispatchEvent"]?.(
          new CustomEvent(VIDEO_KEYING_TASK_CHANGE_EVENT, {
            detail: {
              sourceNodeId: String(v212["sourceNodeId"] || ""),
              outId: String(v212["outId"] || ""),
              mode: String(v212["mode"] || ""),
            },
          }),
        );
      } catch {}
    },
    async _submitRhVideoMattingRuntimeTask({
      sourceNodeId: v213,
      outId: v214,
      ctxId: v215,
      controller: v216,
      startTime: v217,
      taskType: v218,
      executionId: v219,
      payload: v220,
      successName: successName = "",
    } = {}) {
      const v221 = v218 === "video-remove" ? "RH视频擦除" : "RH视频抠像";
      return submitTask(
        {
          sourceNodeId: v213,
          targetNodeId: v214,
          trigger: "toolbar",
          taskType: v218,
          provider: "runninghubwf",
          adapterType: "workflow",
          modelId: getVideoKeyingModelId(),
          executionId: v219,
          payload: v220,
          cancellable: true,
          resumable: true,
          parseError: (v222) =>
            typeof v222?.["getUserMessage"] === "function"
              ? v222["getUserMessage"]()
              : v222?.["message"],
          cancel: async ({ taskId: v223 }) => {
            if (!v220?.["apiKey"] || !v223) return;
            await cancelRunningHubTask({
              apiKey: v220["apiKey"],
              taskId: v223,
            });
          },
          submit: async (v224, v225) =>
            generateVideo(v224, {
              signal: v225["signal"],
              onTaskId: (v226) => {
                v225["onTaskId"]?.(v226);
                const v227 = this["_rhTasks"]["get"](v213);
                v227 &&
                  v227["id"] === v215 &&
                  ((v227["taskId"] = String(v226 || "")),
                  this["_notifyRhTaskChange"](v227));
                if (!appStore["getState"]()["nodes"]?.[v214]) return;
                appStore["updateNodeData"](v214, {
                  rhTaskUseOpenapiQuery: false,
                  outputText:
                    "模型: " +
                    v221 +
                    "\n任务: " +
                    String(v226 || "") +
                    "\n状态: 处理中",
                });
              },
            }),
          resultBuilder: (v228) => {
            const v229 = pickResultLocalPath(v228),
              v230 = localPathToUrl(v229) || String(v228?.["videoUrl"] || "");
            if (!v230) throw new Error("未返回视频地址");
            const v231 = this["_computeGenerationDuration"](v214);
            return {
              ...buildVideoGenerationResultPatch(
                {
                  ...v228,
                  videoUrl: String(v228?.["videoUrl"] || v230),
                  localPath: v229,
                },
                { startedAt: v217, duration: v231 },
              ),
              src: v230,
              ...(successName ? { name: successName } : {}),
              outputText: "模型: " + v221 + "\n状态: 完成",
            };
          },
        },
        { store: appStore, abortController: v216, startedAt: v217 },
      );
    },
    _resolveRunningKeyingSourceNodeId(v232) {
      const v233 = String(v232 || "")["trim"]();
      if (!v233) return "";
      const v234 = this["_rhTasks"]["get"](v233);
      if (v234?.["running"] && v234["mode"] === "keying") return v233;
      for (const [v235, v236] of this["_rhTasks"]["entries"]()) {
        if (!v236?.["running"] || v236["mode"] !== "keying") continue;
        if (
          String(v235 || "") === v233 ||
          String(v236["sourceNodeId"] || "") === v233 ||
          String(v236["outId"] || "") === v233
        )
          return String(v235 || "");
      }
      return "";
    },
    _resolveRunningRemoveSourceNodeId(v237) {
      const v238 = String(v237 || "")["trim"]();
      if (!v238) return "";
      const v239 = this["_rhTasks"]["get"](v238);
      if (v239?.["running"] && v239["mode"] === "remove") return v238;
      for (const [v240, v241] of this["_rhTasks"]["entries"]()) {
        if (!v241?.["running"] || v241["mode"] !== "remove") continue;
        if (
          String(v240 || "") === v238 ||
          String(v241["sourceNodeId"] || "") === v238 ||
          String(v241["outId"] || "") === v238
        )
          return String(v240 || "");
      }
      return "";
    },
    _isRunningKeyingOutputNode(v242) {
      if (!v242 || typeof v242 !== "object") return false;
      if (!isVideoKeyingModel(v242["model"])) return false;
      const v243 = String(v242["outputText"] || ""),
        v244 = String(v242["name"] || ""),
        v245 =
          String(v242["rhToolbarTaskType"] || "") === "video-keying" ||
          v243["includes"]("RH视频抠像") ||
          v243["includes"]("视频抠像") ||
          /^抠像结果\b/["test"](v244);
      if (!v245 || v243["includes"]("RH视频擦除")) return false;
      return shouldShowGenerationBusyUi(v242);
    },
    _isRunningRemoveOutputNode(v246) {
      if (!v246 || typeof v246 !== "object") return false;
      if (!isVideoKeyingModel(v246["model"])) return false;
      const v247 = String(v246["outputText"] || ""),
        v248 = String(v246["name"] || ""),
        v249 =
          String(v246["rhToolbarTaskType"] || "") === "video-remove" ||
          v247["includes"]("RH视频擦除") ||
          v247["includes"]("视频擦除") ||
          /^视频擦除/["test"](v248);
      if (!v249) return false;
      return shouldShowGenerationBusyUi(v246);
    },
    _findRunningKeyingOutputNodeForNode(v250) {
      const v251 = String(v250 || "")["trim"]();
      if (!v251) return null;
      const v252 = appStore["getState"]()["nodes"] || {},
        v253 = Object["values"](v252)
          ["filter"]((v254) => {
            if (!this["_isRunningKeyingOutputNode"](v254)) return false;
            return (
              String(v254["id"] || "") === v251 ||
              String(v254["rhSourceNodeId"] || "") === v251
            );
          })
          ["sort"]((v255, v256) => {
            const v257 =
                Number(
                  v255["rhTaskStartedAt"] || v255["generationStartTime"] || 0,
                ) || 0,
              v258 =
                Number(
                  v256["rhTaskStartedAt"] || v256["generationStartTime"] || 0,
                ) || 0;
            return v258 - v257;
          });
      return v253[0] || null;
    },
    _findRunningRemoveOutputNodeForNode(v259) {
      const v260 = String(v259 || "")["trim"]();
      if (!v260) return null;
      const v261 = appStore["getState"]()["nodes"] || {},
        v262 = Object["values"](v261)
          ["filter"]((v263) => {
            if (!this["_isRunningRemoveOutputNode"](v263)) return false;
            return (
              String(v263["id"] || "") === v260 ||
              String(v263["rhSourceNodeId"] || "") === v260
            );
          })
          ["sort"]((v264, v265) => {
            const v266 =
                Number(
                  v264["rhTaskStartedAt"] || v264["generationStartTime"] || 0,
                ) || 0,
              v267 =
                Number(
                  v265["rhTaskStartedAt"] || v265["generationStartTime"] || 0,
                ) || 0;
            return v267 - v266;
          });
      return v262[0] || null;
    },
    _getRunningKeyingTaskFromMemory(v268) {
      const v269 = this["_resolveRunningKeyingSourceNodeId"](v268),
        v270 = v269 ? this["_rhTasks"]["get"](v269) : null;
      if (!v270?.["running"] || v270["mode"] !== "keying") return null;
      return {
        sourceNodeId: v269,
        outId: String(v270["outId"] || ""),
        taskId: String(v270["taskId"] || ""),
        mode: "keying",
        fromStore: false,
      };
    },
    _getRunningRemoveTaskFromMemory(v271) {
      const v272 = this["_resolveRunningRemoveSourceNodeId"](v271),
        v273 = v272 ? this["_rhTasks"]["get"](v272) : null;
      if (!v273?.["running"] || v273["mode"] !== "remove") return null;
      return {
        sourceNodeId: v272,
        outId: String(v273["outId"] || ""),
        taskId: String(v273["taskId"] || ""),
        mode: "remove",
        fromStore: false,
      };
    },
    getRunningKeyingTaskForNode(v274) {
      const v275 = this["_getRunningKeyingTaskFromMemory"](v274);
      if (v275) return v275;
      const v276 = this["_findRunningKeyingOutputNodeForNode"](v274);
      if (!v276) return null;
      return {
        sourceNodeId: String(v276["rhSourceNodeId"] || ""),
        outId: String(v276["id"] || ""),
        taskId: String(v276["rhTaskId"] || ""),
        mode: "keying",
        fromStore: true,
      };
    },
    getRunningRemoveTaskForNode(v277) {
      const v278 = this["_getRunningRemoveTaskFromMemory"](v277);
      if (v278) return v278;
      const v279 = this["_findRunningRemoveOutputNodeForNode"](v277);
      if (!v279) return null;
      return {
        sourceNodeId: String(v279["rhSourceNodeId"] || ""),
        outId: String(v279["id"] || ""),
        taskId: String(v279["rhTaskId"] || ""),
        mode: "remove",
        fromStore: true,
      };
    },
    hasRunningKeyingTaskForNode(v280) {
      return !!this["getRunningKeyingTaskForNode"](v280);
    },
    hasRunningRemoveTaskForNode(v281) {
      return !!this["getRunningRemoveTaskForNode"](v281);
    },
    async cancelRunningKeyingTaskForNode(v282, v283 = {}) {
      const v284 = this["_resolveRunningKeyingSourceNodeId"](v282);
      if (v284) return this["_cancelRhTaskForSourceNode"](v284, v283);
      const v285 = this["getRunningKeyingTaskForNode"](v282);
      if (!v285?.["outId"]) return false;
      let v286 = "";
      try {
        v286 = await getRunningHubWorkflowApiKey();
      } catch {}
      const v287 = "模型: RH视频抠像\n状态: 已取消";
      return (
        await cancelTask(v285["outId"], {
          store: appStore,
          cancellable: true,
          taskId: v285["taskId"],
          spec: { provider: "runninghubwf", adapterType: "workflow" },
          cancel: async ({ taskId: v288 }) => {
            if (!v286 || !v288) return;
            try {
              await cancelRunningHubTask({ apiKey: v286, taskId: v288 });
            } catch {}
          },
        }),
        appStore["updateNodeData"](v285["outId"], { outputText: v287 }),
        this["_notifyRhTaskChange"](v285),
        v283?.["notify"] &&
          window["showToast"]?.("已取消该视频的抠像任务", "info"),
        true
      );
    },
    async cancelRunningRemoveTaskForNode(v289, v290 = {}) {
      const v291 = this["_resolveRunningRemoveSourceNodeId"](v289);
      if (v291) return this["_cancelRhTaskForSourceNode"](v291, v290);
      const v292 = this["getRunningRemoveTaskForNode"](v289);
      if (!v292?.["outId"]) return false;
      let v293 = "";
      try {
        v293 = await getRunningHubWorkflowApiKey();
      } catch {}
      const v294 = "模型: RH视频擦除\n状态: 已取消";
      return (
        await cancelTask(v292["outId"], {
          store: appStore,
          cancellable: true,
          taskId: v292["taskId"],
          spec: { provider: "runninghubwf", adapterType: "workflow" },
          cancel: async ({ taskId: v295 }) => {
            if (!v293 || !v295) return;
            try {
              await cancelRunningHubTask({ apiKey: v293, taskId: v295 });
            } catch {}
          },
        }),
        appStore["updateNodeData"](v292["outId"], { outputText: v294 }),
        this["_notifyRhTaskChange"](v292),
        v290?.["notify"] &&
          window["showToast"]?.("已取消该视频的擦除任务", "info"),
        true
      );
    },
    async _cancelRhTaskForSourceNode(v296, { notify: notify = false } = {}) {
      const v297 = v296 ? this["_rhTasks"]["get"](v296) : null;
      if (!v297 || !v297["running"]) return false;
      try {
        v297["abort"]?.["abort"]();
      } catch {}
      const v298 = String(v297["taskId"] || ""),
        v299 = String(v297["apiKey"] || ""),
        v300 = String(v297["outId"] || ""),
        v301 = v297["mode"] === "remove";
      (this["_rhTasks"]["delete"](v296), this["_notifyRhTaskChange"](v297));
      const v302 = v301
        ? "模型: RH视频擦除\n状态: 已取消"
        : "模型: RH视频抠像\n状态: 已取消";
      return (
        await cancelTask(v300, {
          store: appStore,
          cancellable: true,
          taskId: v298,
          spec: { provider: "runninghubwf", adapterType: "workflow" },
          cancel: async ({ taskId: v303 }) => {
            if (v299 && v303)
              try {
                await cancelRunningHubTask({ apiKey: v299, taskId: v303 });
              } catch {}
          },
        }),
        appStore["updateNodeData"](v300, { outputText: v302 }),
        notify &&
          window["showToast"]?.(
            v301 ? "已取消该视频的擦除任务" : "已取消该视频的抠像任务",
            "info",
          ),
        true
      );
    },
    getPosNegPoints() {
      if (this["_isRemoveUiMode"]()) {
        const v304 = this["_collectRemovePosPoints"](REMOVE_POS_POINT_LIMIT);
        return { pos_points: v304, neg_points: [] };
      }
      const v305 = Array["isArray"](this["_marks"]) ? this["_marks"] : [],
        v306 = [],
        v307 = [];
      for (const v308 of v305) {
        if (!v308) continue;
        const v309 = Number(v308["nx"]),
          v310 = Number(v308["ny"]);
        if (!Number["isFinite"](v309) || !Number["isFinite"](v310)) continue;
        const v311 = { x: v309, y: v310 };
        if (v308["pointType"] === "background") v307["push"](v311);
        else v306["push"](v311);
      }
      return { pos_points: v306, neg_points: v307 };
    },
    _syncPointsToStore() {
      const { pos_points: v312, neg_points: v313 } = this["getPosNegPoints"]();
      (appStore["setVideoKeyingState"]({ pos_points: v312, neg_points: v313 }),
        this["_updateConfirmEnabled"]());
    },
    _undoMark() {
      const v314 = Array["isArray"](this["_marks"]) ? this["_marks"] : [];
      if (!v314["length"]) return;
      const v315 = Array["isArray"](this["_marksRedo"])
          ? this["_marksRedo"]
          : [],
        v316 = v314["pop"]();
      (v315["push"](v316),
        (this["_marks"] = v314),
        (this["_marksRedo"] = v315),
        this["_renderMarksFn"]?.(),
        this["_syncPointsToStore"]());
    },
    _redoMark() {
      const v317 = Array["isArray"](this["_marksRedo"])
        ? this["_marksRedo"]
        : [];
      if (!v317["length"]) return;
      const v318 = Array["isArray"](this["_marks"]) ? this["_marks"] : [],
        v319 = v317["pop"]();
      (v318["push"](v319),
        (this["_marks"] = v318),
        (this["_marksRedo"] = v317),
        this["_renderMarksFn"]?.(),
        this["_syncPointsToStore"]());
    },
    _clearAllMarks() {
      ((this["_marks"] = []),
        (this["_marksRedo"] = []),
        (this["_removeDraft"] = null),
        (this["_removeDrawPointerId"] = null),
        this["_renderMarksFn"]?.(),
        appStore["setVideoKeyingState"]({ pos_points: [], neg_points: [] }),
        this["_updateConfirmEnabled"]());
    },
    init(v320, v321 = {}) {
      if (!v320) return;
      if (this["active"]) this["exit"]({ silent: true });
      const v322 = appStore["getState"]()["nodes"][v320];
      if (!v322) return;
      ((this["uiMode"] = v321?.["uiMode"] === "remove" ? "remove" : "keying"),
        (this["_removePointTool"] = "foreground"),
        (this["_removeBrushSizePx"] = 40),
        (this["_removeDraft"] = null),
        (this["_removeDrawPointerId"] = null),
        (this["_removeCursorHover"] = false),
        (this["_removeCursorLast"] = { x: 0, y: 0 }));
      if (this["_removeCursorRaf"])
        cancelAnimationFrame(this["_removeCursorRaf"]);
      ((this["_removeCursorRaf"] = 0),
        (this["active"] = true),
        (this["nodeId"] = v320),
        (this["_marks"] = []),
        (this["_marksRedo"] = []),
        appStore["setVideoKeyingState"]({
          active: true,
          nodeId: v320,
          pos_points: [],
          neg_points: [],
        }),
        (this["_retryCount"] = 0),
        this["_mountWhenReady"]());
    },
    _mountWhenReady() {
      const v323 = this["nodeId"],
        v324 = () => {
          if (!this["active"] || this["nodeId"] !== v323) return;
          const v325 = document["getElementById"](v323);
          if (!v325) {
            this["_retryCount"]++;
            if (this["_retryCount"] > 10) {
              this["exit"]({ silent: true });
              return;
            }
            this["_retryRaf"] = requestAnimationFrame(v324);
            return;
          }
          ((this["wrapperEl"] = v325),
            this["_applyFrozenUI"](true),
            this["_applyDimMode"](true));
          try {
            window["_spaceHeld"] = false;
            const v326 = document["getElementById"]("v2-wrap");
            if (v326) v326["style"]["cursor"] = "";
          } catch {}
          (this["_createUI"](),
            this["_syncDurationAndDefaults"](),
            this["_bindEvents"](),
            this["_renderPlayhead"]());
        };
      this["_retryRaf"] = requestAnimationFrame(v324);
    },
    _applyDimMode(v327) {
      const v328 = document["getElementById"]("v2-wrap");
      if (v328) {
        if (v327) v328["classList"]["add"]("is-video-keying-mode");
        else v328["classList"]["remove"]("is-video-keying-mode");
      }
      if (this["wrapperEl"]) {
        if (v327)
          this["wrapperEl"]["classList"]["add"]("is-video-keying-target");
        else this["wrapperEl"]["classList"]["remove"]("is-video-keying-target");
      }
    },
    _applyFrozenUI(v329) {
      if (!this["wrapperEl"]) return;
      const v330 = "is-video-keying";
      if (v329) this["wrapperEl"]["classList"]["add"](v330);
      else this["wrapperEl"]["classList"]["remove"](v330);
      this["_applyFrozenOverlaysHidden"](v329);
    },
    _applyFrozenOverlaysHidden(v331) {
      if (!this["wrapperEl"]) return;
      if (v331) {
        if (
          Array["isArray"](this["_hiddenEls"]) &&
          this["_hiddenEls"]["length"]
        )
          return;
        const v332 = [
            ".video-controls",
            ".video-mute-btn",
            ".node-upload-hint",
            ".video-center-indicator",
            ".gen-video-center-indicator",
            ".multi-toggle-btn",
          ],
          v333 = [];
        (v332["forEach"]((v334) => {
          this["wrapperEl"]["querySelectorAll"](v334)["forEach"]((v335) => {
            (v333["push"]({ el: v335, prevDisplay: v335["style"]["display"] }),
              (v335["style"]["display"] = "none"));
          });
        }),
          (this["_hiddenEls"] = v333));
        return;
      }
      const v336 = Array["isArray"](this["_hiddenEls"])
        ? this["_hiddenEls"]
        : [];
      ((this["_hiddenEls"] = null),
        v336["forEach"](({ el: v337, prevDisplay: v338 }) => {
          if (!v337 || !v337["isConnected"]) return;
          v337["style"]["display"] = v338 || "";
        }));
    },
    _pauseAllWrapperVideos() {
      this["wrapperEl"] &&
        this["wrapperEl"]["querySelectorAll"]("video")["forEach"]((v339) => {
          try {
            if (!v339["paused"]) v339["pause"]();
          } catch {}
        });
      if (this["videoEl"])
        try {
          if (!this["videoEl"]["paused"]) this["videoEl"]["pause"]();
        } catch {}
    },
    _createRemoveToolbar() {
      const v340 = document["createElement"]("div");
      v340["className"] = "v2-video-keying-erasebar v2-annotate-toolbar";
      const v341 = this["_buildShortcutTooltip"](
          "画笔",
          "editor-tool-brush",
          "B",
        ),
        v342 = this["_buildShortcutTooltip"](
          "橡皮擦",
          "editor-tool-eraser",
          "E",
        ),
        v343 = this["_buildShortcutTooltip"]("撤销", "undo", "Ctrl+Z"),
        v344 = this["_buildShortcutTooltip"]("重做", "redo", "Ctrl+Shift+Z"),
        v345 = this["_buildShortcutTooltip"]("清空", "editor-clear", "R");
      return (
        (v340["innerHTML"] =
          '\n      <button class="v2-annotate-btn icon-only act-cancel" data-tooltip="取消" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 6L6 18M6 6l12 12"/></svg></button>\n      <div class="v2-annotate-divider"></div>\n      <button class="v2-annotate-btn icon-only tool-btn active" data-tool="brush" data-tooltip="' +
          v341 +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>\n      <button class="v2-annotate-btn icon-only tool-btn" data-tool="eraser" data-tooltip="' +
          v342 +
          "\x22\x20type=\x22button\x22><svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20width=\x2218\x22\x20height=\x2218\x22><path\x20d=\x22M20\x2020H7l-5-5a2\x202\x200\x200\x201\x200-2.83l9.17-9.17a2\x202\x200\x200\x201\x202.83\x200L22\x2010a2\x202\x200\x200\x201\x200\x202.83L14.83\x2020\x22/></svg></button>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22v2-annotate-size\x22><span\x20class=\x22v2-annotate-size-value\x22></span><input\x20class=\x22v2-annotate-size-range\x22\x20type=\x22range\x22\x20min=\x221\x22\x20max=\x22120\x22\x20step=\x221\x22></div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22v2-annotate-divider\x22></div>\x0a\x20\x20\x20\x20\x20\x20<button\x20class=\x22v2-annotate-btn\x20icon-only\x20act-undo\x22\x20data-tooltip=\x22" +
          v343 +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 14l-4-4 4-4"/><path d="M5 10h9a6 6 0 1 1 0 12h-3"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-redo" data-tooltip="' +
          v344 +
          "\x22\x20type=\x22button\x22><svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20width=\x2218\x22\x20height=\x2218\x22><path\x20d=\x22M15\x2014l4-4-4-4\x22/><path\x20d=\x22M19\x2010H10a6\x206\x200\x201\x200\x200\x2012h3\x22/></svg></button>\x0a\x20\x20\x20\x20\x20\x20<button\x20class=\x22v2-annotate-btn\x20icon-only\x20act-clear\x22\x20data-tooltip=\x22" +
          v345 +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 16h10l1-16"/></svg></button>\n    '),
        (this["removeSizeValueEl"] = v340["querySelector"](
          ".v2-annotate-size-value",
        )),
        (this["removeSizeRangeEl"] = v340["querySelector"](
          ".v2-annotate-size-range",
        )),
        this["removeSizeRangeEl"] &&
          this["removeSizeValueEl"] &&
          (this["_syncRemoveBrushControls"](),
          this["removeSizeRangeEl"]["addEventListener"]("input", (v346) => {
            const v347 = this["_clampRemoveBrushSize"](v346["target"]["value"]);
            ((this["_removeBrushSizePx"] = v347),
              this["_syncRemoveBrushControls"](),
              this["_syncRemoveCursor"]());
          })),
        v340["addEventListener"]("pointerdown", (v348) =>
          v348["stopPropagation"](),
        ),
        v340["querySelector"](".act-cancel")?.["addEventListener"](
          "click",
          (v349) => {
            (v349["stopPropagation"](), this["exit"]());
          },
        ),
        v340["querySelector"]('[data-tool="brush"]')?.["addEventListener"](
          "click",
          (v350) => {
            (v350["stopPropagation"](),
              this["_setRemovePointTool"]("foreground"));
          },
        ),
        v340["querySelector"]('[data-tool="eraser"]')?.["addEventListener"](
          "click",
          (v351) => {
            (v351["stopPropagation"](),
              this["_setRemovePointTool"]("background"));
          },
        ),
        v340["querySelector"](".act-undo")?.["addEventListener"](
          "click",
          (v352) => {
            (v352["stopPropagation"](), this["_undoMark"]());
          },
        ),
        v340["querySelector"](".act-redo")?.["addEventListener"](
          "click",
          (v353) => {
            (v353["stopPropagation"](), this["_redoMark"]());
          },
        ),
        v340["querySelector"](".act-clear")?.["addEventListener"](
          "click",
          (v354) => {
            (v354["stopPropagation"](),
              this["_clearAllMarks"](),
              window["showToast"]?.("已清空所有点", "info"));
          },
        ),
        v340
      );
    },
    _createUI() {
      if (!this["wrapperEl"]) return;
      this["wrapperEl"]
        [
          "querySelectorAll"
        ](".v2-video-keyingbar,.v2-video-keyinghint,.v2-video-keying-erasebar")
        ["forEach"]((v355) => v355["remove"]());
      const v356 = document["createElement"]("div");
      v356["className"] = "v2-video-keyingbar";
      const v357 = document["createElement"]("button");
      ((v357["type"] = "button"),
        (v357["className"] = "v2-video-clipbtn cancel"),
        (v357["title"] = "取消"));
      {
        const v358 = "http://www.w3.org/2000/svg",
          v359 = document["createElementNS"](v358, "svg");
        (v359["setAttribute"]("width", "20"),
          v359["setAttribute"]("height", "20"),
          v359["setAttribute"]("viewBox", "0 0 24 24"),
          v359["setAttribute"]("fill", "none"),
          v359["setAttribute"]("stroke", "currentColor"),
          v359["setAttribute"]("stroke-width", "2"));
        const v360 = document["createElementNS"](v358, "path");
        v360["setAttribute"]("d", "M18 6L6 18");
        const v361 = document["createElementNS"](v358, "path");
        (v361["setAttribute"]("d", "M6 6l12 12"),
          v359["appendChild"](v360),
          v359["appendChild"](v361),
          v357["appendChild"](v359));
      }
      const v362 = document["createElement"]("button");
      ((v362["type"] = "button"),
        (v362["className"] = "prompt-submit img-gen-btn"),
        (v362["title"] = this["_isRemoveUiMode"]() ? "视频擦除" : "抠像"));
      {
        const v363 = "http://www.w3.org/2000/svg",
          v364 = document["createElementNS"](v363, "svg");
        (v364["setAttribute"]("width", "14"),
          v364["setAttribute"]("height", "14"),
          v364["setAttribute"]("viewBox", "0 0 24 24"),
          v364["setAttribute"]("fill", "none"),
          v364["setAttribute"]("stroke", "currentColor"),
          v364["setAttribute"]("stroke-width", "2"));
        const v365 = document["createElementNS"](v363, "line");
        (v365["setAttribute"]("x1", "12"),
          v365["setAttribute"]("y1", "19"),
          v365["setAttribute"]("x2", "12"),
          v365["setAttribute"]("y2", "5"));
        const v366 = document["createElementNS"](v363, "polyline");
        (v366["setAttribute"]("points", "5 12 12 5 19 12"),
          v364["appendChild"](v365),
          v364["appendChild"](v366),
          v362["appendChild"](v364));
      }
      const v367 = appStore["getState"]()["nodes"]?.[this["nodeId"]] || {},
        {
          fps: v368,
          resolution: v369,
          instanceType: v370,
        } = this["_getRhVideoSettings"](v367),
        v371 = this["_getRhMaskMode"](v367),
        v372 = {};
      !hasUsableKeyingSettingValue(v367["rhVideoFps"]) &&
        (v372["rhVideoFps"] = v368);
      !hasUsableKeyingSettingValue(v367["rhVideoResolution"]) &&
        (v372["rhVideoResolution"] = v369);
      !hasUsableKeyingSettingValue(v367["rhMaskMode"]) &&
        (v372["rhMaskMode"] = v371);
      !hasUsableKeyingSettingValue(v367["rhInstanceType"]) &&
        (v372["rhInstanceType"] = v370);
      if (Object["keys"](v372)["length"])
        try {
          appStore["updateNodeData"](this["nodeId"], v372);
        } catch {}
      let v373 = document["createElement"]("div");
      v373["className"] = "rh-keying-settings-wrap";
      const v374 = document["createElement"]("button");
      ((v374["type"] = "button"),
        (v374["className"] =
          "v2-video-clipbtn\x20cancel\x20rh-keying-settings-btn"),
        (v374["title"] = "设置"));
      {
        const v375 = "http://www.w3.org/2000/svg",
          v376 = document["createElementNS"](v375, "svg");
        (v376["setAttribute"]("width", "20"),
          v376["setAttribute"]("height", "20"),
          v376["setAttribute"]("viewBox", "0 0 24 24"),
          v376["setAttribute"]("fill", "none"),
          v376["setAttribute"]("stroke", "currentColor"),
          v376["setAttribute"]("stroke-width", "2"));
        const v377 = document["createElementNS"](v375, "path");
        v377["setAttribute"](
          "d",
          "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
        );
        const v378 = document["createElementNS"](v375, "path");
        (v378["setAttribute"](
          "d",
          "M19.4 15a1.7 1.7 0 0 0 .33 1.87l.06.06a2 2 0 0 1-1.42 3.42h-.2a2 2 0 0 1-1.41-.59l-.06-.06a1.7 1.7 0 0 0-1.87-.33 1.7 1.7 0 0 0-1.03 1.54V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1.03-1.54 1.7 1.7 0 0 0-1.87.33l-.06.06a2 2 0 0 1-1.41.59h-.2a2 2 0 0 1-1.42-3.42l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.54-1.03H3a2 2 0 0 1 0-4h.06A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.33-1.87l-.06-.06A2 2 0 0 1 5.63 3.65h.2a2 2 0 0 1 1.41.59l.06.06A1.7 1.7 0 0 0 9.17 4.6a1.7 1.7 0 0 0 1.03-1.54V3a2 2 0 0 1 4 0v.06a1.7 1.7 0 0 0 1.03 1.54 1.7 1.7 0 0 0 1.87-.33l.06-.06a2 2 0 0 1 1.41-.59h.2A2 2 0 0 1 20.79 7.07l-.06.06A1.7 1.7 0 0 0 20.4 9c.32.55.86.92 1.54 1.03H22a2 2 0 0 1 0 4h-.06A1.7 1.7 0 0 0 19.4 15z",
        ),
          v376["appendChild"](v378),
          v376["appendChild"](v377),
          v374["appendChild"](v376));
      }
      const v379 = document["createElement"]("div");
      ((v379["className"] = "rh-keying-settings-menu"),
        v379["setAttribute"]("role", "menu"));
      {
        const v380 = document["createElement"]("div");
        v380["className"] = "rh-keying-settings-head";
        const v381 = document["createElement"]("span");
        ((v381["className"] = "rh-keying-settings-title"),
          (v381["textContent"] = "参数设置"),
          v380["appendChild"](v381),
          v379["appendChild"](v380));
      }
      {
        const v382 = document["createElement"]("div");
        v382["className"] = "img-rp-quality-area";
        const v383 = document["createElement"]("div");
        ((v383["className"] = "img-rp-section-label"),
          (v383["innerHTML"] =
            '分辨率<span class="rh-tip" data-tooltip="分辨率越高细节越清晰、边缘更稳定。&#10;同时显存占用与生成耗时会明显增加。">!</span>'));
        const v384 = document["createElement"]("div");
        ((v384["className"] = "img-rp-quality-segmented"),
          [832, 1024, 1280, 1440, 1600, 1760, 1920]["forEach"]((v385) => {
            const v386 = document["createElement"]("button");
            v386["type"] = "button";
            const v387 = Number(v385) > 1440;
            ((v386["className"] = ("img-rp-quality-item " +
              (v387 ? "dev-mode-only" : "") +
              " rh-keying-res-btn " +
              (Number(v369) === Number(v385) ? "active" : ""))["trim"]()),
              (v386["dataset"]["value"] = String(v385)),
              (v386["textContent"] = String(v385)),
              v384["appendChild"](v386));
          }),
          v382["appendChild"](v383),
          v382["appendChild"](v384),
          v379["appendChild"](v382));
      }
      {
        const v388 = document["createElement"]("div");
        v388["className"] = "rh-vram-adv-row";
        const v389 = document["createElement"]("div");
        v389["className"] = "rh-vram-adv-label";
        const v390 = document["createElement"]("span");
        v390["textContent"] = "帧率";
        const v391 = document["createElement"]("span");
        ((v391["className"] = "rh-tip"),
          v391["setAttribute"](
            "data-tooltip",
            "帧率越高运动更顺滑、动作更连贯。\n但生成更慢、成本更高。\n常用 24 帧；想更快或更省可选 16 帧，想更顺滑可选 30 帧。",
          ),
          (v391["textContent"] = "!"),
          v389["appendChild"](v390),
          v389["appendChild"](v391));
        const v392 = document["createElement"]("div");
        ((v392["className"] =
          "img-rp-quality-segmented rh-adv-seg rh-v5-fps-seg"),
          getRhKeyingFpsOptions()["forEach"]((v393) => {
            const v394 = document["createElement"]("button");
            ((v394["type"] = "button"),
              (v394["className"] = ("img-rp-quality-item rh-keying-fps-btn " +
                (Number(v368) === Number(v393) ? "active" : ""))["trim"]()),
              (v394["dataset"]["value"] = String(v393)),
              (v394["textContent"] = v393 + "帧"),
              v392["appendChild"](v394));
          }),
          v388["appendChild"](v389),
          v388["appendChild"](v392),
          v379["appendChild"](v388));
      }
      if (!this["_isRemoveUiMode"]()) {
        const v395 = document["createElement"]("div");
        v395["className"] = "rh-vram-adv-row";
        const v396 = document["createElement"]("div");
        v396["className"] = "rh-vram-adv-label";
        const v397 = document["createElement"]("span");
        v397["textContent"] = "抠像模式";
        const v398 = document["createElement"]("span");
        ((v398["className"] = "rh-tip"),
          v398["setAttribute"](
            "data-tooltip",
            "Sec：默认模式，适合大多数常规抠像。\nSam3：适合主体复杂或边缘更细的场景。\nMA2：兼容旧工作流中的 MatAnyone2 模式。",
          ),
          (v398["textContent"] = "!"),
          v396["appendChild"](v397),
          v396["appendChild"](v398));
        const v399 = document["createElement"]("div");
        ((v399["className"] =
          "img-rp-quality-segmented rh-adv-seg rh-keying-maskmode-seg"),
          [
            ["Sec", "Sec"],
            ["Sam3", "Sam3"],
            ["MA2", "MA2"],
          ]["forEach"](([v400, v401]) => {
            const v402 = document["createElement"]("button");
            ((v402["type"] = "button"),
              (v402["className"] =
                ("img-rp-quality-item rh-keying-maskmode-btn " +
                  (v371 === v400 ? "active" : ""))["trim"]()),
              (v402["dataset"]["value"] = v400),
              (v402["textContent"] = v401),
              v399["appendChild"](v402));
          }),
          v395["appendChild"](v396),
          v395["appendChild"](v399),
          v379["appendChild"](v395));
      }
      {
        const v403 = document["createElement"]("div");
        v403["className"] = "rh-vram-adv-row";
        const v404 = document["createElement"]("div");
        v404["className"] = "rh-vram-adv-label";
        const v405 = document["createElement"]("span");
        v405["textContent"] = "显存";
        const v406 = document["createElement"]("span");
        ((v406["className"] = "rh-tip"),
          v406["setAttribute"](
            "data-tooltip",
            "48G：可跑更大分辨率/多帧数，费用×2",
          ),
          (v406["textContent"] = "!"),
          v404["appendChild"](v405),
          v404["appendChild"](v406));
        const v407 = document["createElement"]("div");
        ((v407["className"] =
          "img-rp-quality-segmented rh-adv-seg rh-keying-vram-seg"),
          [
            ["default", "24G"],
            ["plus", "48G"],
          ]["forEach"](([v408, v409]) => {
            const v410 = document["createElement"]("button");
            ((v410["type"] = "button"),
              (v410["className"] =
                ("img-rp-quality-item\x20rh-keying-vram-btn\x20" +
                  (v370 === v408 ? "active" : ""))["trim"]()),
              (v410["dataset"]["value"] = v408),
              (v410["textContent"] = v409),
              v407["appendChild"](v410));
          }),
          v403["appendChild"](v404),
          v403["appendChild"](v407),
          v379["appendChild"](v403));
      }
      (v373["appendChild"](v374), v373["appendChild"](v379));
      const v411 = document["createElement"]("button");
      ((v411["type"] = "button"),
        (v411["className"] =
          "v2-video-clipbtn\x20cancel\x20debug-wrench-btn\x20rh-keying-debug-btn"),
        (v411["title"] = "调试参数"),
        applyDebugWrenchIcon(v411));
      const v412 = document["createElement"]("div");
      v412["className"] = "v2-video-keyingrow";
      const v413 = document["createElement"]("div");
      v413["className"] = "v2-video-keyingtrack";
      const v414 = document["createElement"]("div");
      v414["className"] = "v2-video-keyingticks";
      const v415 = document["createElement"]("div");
      v415["className"] = "v2-video-keyingthumbs";
      const v416 = [];
      for (let v417 = 0; v417 < 10; v417++) {
        const v418 = document["createElement"]("div");
        ((v418["className"] = "v2-video-keyingthumb"),
          v415["appendChild"](v418),
          v416["push"](v418));
      }
      const v419 = document["createElement"]("div");
      ((v419["className"] = "v2-video-keyingplayhead"),
        v413["appendChild"](v415),
        v413["appendChild"](v419),
        v413["appendChild"](v414));
      const v420 = this["_isRemoveUiMode"]();
      (v412["appendChild"](v357), v412["appendChild"](v413));
      if (v373) v412["appendChild"](v373);
      if (v411) v412["appendChild"](v411);
      v412["appendChild"](v362);
      const v421 = document["createElement"]("div");
      v421["className"] = "v2-video-keyinghelper-row";
      const v422 = document["createElement"]("div");
      ((v422["className"] = "v2-video-keyinghelper-right"),
        v421["appendChild"](v422));
      let v423 = null,
        v424 = null;
      if (v420) v424 = this["_createRemoveToolbar"]();
      else {
        ((v423 = document["createElement"]("div")),
          (v423["className"] = "v2-video-keyinghint"));
        const v425 = (v426, v427) => {
          const v428 = document["createElement"]("span");
          if (v427) v428["className"] = v427;
          return ((v428["textContent"] = v426), v428);
        };
        (v423["appendChild"](v425("左键")),
          v423["appendChild"](v425("选中目标", "v2-video-keyinghint--pos")),
          v423["appendChild"](v425("\x20\x20")),
          v423["appendChild"](v425("右键")),
          v423["appendChild"](v425("排除目标", "v2-video-keyinghint--neg")),
          v423["appendChild"](v425("\x20\x20·\x20\x20快捷键：")),
          v423["appendChild"](v425("R", "v2-video-keyinghint-kbd")),
          v423["appendChild"](v425("清空所有点")),
          v423["appendChild"](v425("\x20\x20")),
          v423["appendChild"](v425("Ctrl+Z", "v2-video-keyinghint-kbd")),
          v423["appendChild"](v425("撤销")),
          v423["appendChild"](v425("\x20\x20")),
          v423["appendChild"](v425("Ctrl+Shift+Z", "v2-video-keyinghint-kbd")),
          v423["appendChild"](v425("重做")));
      }
      (v356["appendChild"](v412),
        v356["appendChild"](v421),
        v424 && this["wrapperEl"]["appendChild"](v424),
        this["wrapperEl"]["appendChild"](v356),
        v423 && this["wrapperEl"]["appendChild"](v423),
        (this["barEl"] = v356),
        (this["hintEl"] = v423),
        (this["removeToolbarEl"] = v424),
        this["_setRemovePointTool"](this["_removePointTool"]),
        (this["cancelBtnEl"] = v357),
        (this["confirmBtnEl"] = v362),
        (this["trackEl"] = v413),
        (this["playheadEl"] = v419),
        (this["thumbEls"] = v416),
        (this["helperRightEl"] = v422),
        this["_updateHelperRight"](),
        this["_updateConfirmEnabled"]());
    },
    _ensureMarkLayer() {
      if (!this["wrapperEl"]) return;
      const v429 = this["videoEl"] || this["_getVideoEl"]();
      if (!v429) return;
      const v430 =
        v429["closest"](".node-card") || v429["parentElement"] || null;
      if (!v430) return;
      this["_detachMarkLayerListeners"](this["markLayerEl"]);
      if (this["markLayerEl"] && this["markLayerEl"]["isConnected"])
        this["markLayerEl"]["remove"]();
      this["wrapperEl"]
        ["querySelectorAll"](".v2-video-keying-marklayer")
        ["forEach"]((v431) => v431["remove"]());
      const v432 = document["createElement"]("div");
      v432["className"] = "v2-video-keying-marklayer";
      if (this["_isRemoveUiMode"]()) v432["classList"]["add"]("is-remove-mode");
      (v432["addEventListener"]("pointerdown", (v433) => {
        (v433["preventDefault"](), v433["stopPropagation"]());
      }),
        v432["addEventListener"]("click", (v434) => {
          (v434["preventDefault"](), v434["stopPropagation"]());
        }),
        v432["addEventListener"]("dblclick", (v435) => {
          (v435["preventDefault"](), v435["stopPropagation"]());
        }),
        v432["addEventListener"]("contextmenu", (v436) => {
          (v436["preventDefault"](), v436["stopPropagation"]());
        }));
      if (this["_isRemoveUiMode"]()) {
        const v437 = document["createElement"]("canvas");
        ((v437["className"] = "v2-video-keying-paintcanvas"),
          v432["appendChild"](v437),
          (this["markCanvasEl"] = v437),
          (this["removeMaskCanvasEl"] = document["createElement"]("canvas")));
        const v438 = document["createElement"]("div");
        ((v438["className"] = "v2-annotate-cursor v2-video-keying-cursor"),
          (v438["style"]["display"] = "none"),
          v432["appendChild"](v438),
          (this["removeCursorEl"] = v438),
          (this["_removeCursorHover"] = false));
      } else
        ((this["markCanvasEl"] = null),
          (this["removeMaskCanvasEl"] = null),
          (this["removeCursorEl"] = null),
          (this["_removeCursorHover"] = false));
      (v430["appendChild"](v432),
        (this["markLayerEl"] = v432),
        this["_attachMarkLayerListeners"]());
      this["_isRemoveUiMode"]()
        ? ((this["_onMarkWheel"] = (v439) =>
            this["_onRemoveCanvasWheel"](v439)),
          v432["addEventListener"]("wheel", this["_onMarkWheel"], {
            passive: false,
          }),
          (this["_removeWheelCleanup"] = () => {
            this["_onMarkWheel"] &&
              v432["removeEventListener"]("wheel", this["_onMarkWheel"]);
          }))
        : ((this["_removeWheelCleanup"] = null), (this["_onMarkWheel"] = null));
      this["_syncRemoveCursor"]();
      if (!Array["isArray"](this["_marks"])) this["_marks"] = [];
    },
    _bindEvents() {
      if (!this["barEl"]) return;
      (this["cancelBtnEl"]?.["addEventListener"]("click", (v440) => {
        (v440["stopPropagation"](), this["exit"]());
      }),
        this["confirmBtnEl"]?.["addEventListener"]("click", async (v441) => {
          (v441["preventDefault"](), v441["stopPropagation"]());
          if (!this["active"] || !this["nodeId"]) return;
          const v442 = this["nodeId"],
            v443 = this["_rhTasks"]["get"](v442);
          if (v443 && v443["running"]) {
            await this["_cancelRhTaskForSourceNode"](v442, { notify: true });
            return;
          }
          const v444 = appStore["getState"]()["nodes"]?.[this["nodeId"]] || {},
            v445 = this["videoEl"] || this["_getVideoEl"](),
            v446 = Number(v445?.["videoWidth"]) || 0,
            v447 = Number(v445?.["videoHeight"]) || 0,
            v448 = Number(v445?.["currentTime"]) || 0,
            {
              fps: v449,
              resolution: v450,
              instanceType: v451,
            } = this["_getRhVideoSettings"](v444),
            v452 = this["_getRhMaskMode"](v444),
            v453 = this["_getSourceFrameCount"](v444, v449),
            { pos_points: v454, neg_points: v455 } = this["getPosNegPoints"](),
            { w: v456, h: v457 } = this["_calcKeyingFrameSize"](
              v446,
              v447,
              v450,
            ),
            v458 = (v459, v460, v461) =>
              Math["max"](v460, Math["min"](v461, v459)),
            v462 = (v463) => ({
              x: Math["round"](
                v458(v463["x"] * v456, 0, Math["max"](0, v456 - 1)),
              ),
              y: Math["round"](
                v458(v463["y"] * v457, 0, Math["max"](0, v457 - 1)),
              ),
            }),
            v464 = v456 > 0 && v457 > 0 ? v454["map"](v462) : [],
            v465 = v456 > 0 && v457 > 0 ? v455["map"](v462) : [],
            v466 = v464["length"] ? JSON["stringify"](v464) : "",
            v467 = v465["length"] ? JSON["stringify"](v465) : "",
            v468 = v466,
            v469 = v467,
            v470 = Math["max"](0, Math["round"](v448 * v449));
          try {
            const v471 = {
              frame_index: v470,
              rhVideoFps: v449,
              rhVideoFrames: v453,
              rhVideoResolution: v450,
              rhInstanceType: v451,
            };
            (!this["_isRemoveUiMode"]() &&
              ((v471["positive"] = v466),
              (v471["negative"] = v467),
              (v471["pos_points"] = v468),
              (v471["neg_points"] = v469)),
              appStore["updateNodeData"](this["nodeId"], v471));
          } catch {}
          const v472 = this["_resolveSourceVideoValue"](v444);
          if (!v472) {
            window["showToast"]?.("请先接入源视频", "warn");
            return;
          }
          let v473 = "";
          try {
            v473 = await getRunningHubWorkflowApiKey();
          } catch (v474) {
            window["showToast"]?.(
              "读取 RunningHub 配置失败，请打开设置检查 API Key",
              "error",
            );
            return;
          }
          if (!v473) {
            window["showToast"]?.(
              "请先在设置里填写\x20RunningHub\x20API\x20Key",
              "warn",
            );
            return;
          }
          if (this["_isRemoveUiMode"]()) {
            let v475 = "";
            try {
              v475 = this["_exportRemoveMaskDataUrl"](v450);
            } catch (v476) {
              window["showToast"]?.(
                v476?.["message"] || "生成视频擦除遮罩失败",
                "error",
              );
              return;
            }
            const v477 = v444,
              { width: v478, height: v479 } = getAutoMediaSizeByShortSide(
                v477["width"] || 512,
                v477["height"] || 288,
              ),
              v480 = calcSafeSpawnPosNearNode(
                appStore["getState"]()["nodes"],
                v477,
                v478,
                v479,
              ),
              v481 = generateId("source-video-erase"),
              v482 = Date["now"]();
            (appStore["addNode"](
              buildSourceMediaNodePayload({
                id: v481,
                type: "source-video",
                x: v480["x"],
                y: v480["y"],
                width: v478,
                height: v479,
                name: "视频擦除生成中...",
                src: "",
                localPath: "",
                ...buildGenerationStartPatch({ startedAt: v482 }),
                provider: "runninghubwf",
                model: getVideoKeyingModelId(),
                rhTaskId: "",
                rhTaskStatus: "pending",
                rhTaskStartedAt: v482,
                rhTaskRecovering: false,
                rhTaskUseOpenapiQuery: false,
                rhSourceNodeId: v442,
                rhToolbarTaskType: "video-remove",
                fixedSize: true,
                outputText: "模型: RH视频擦除\n状态: 处理中",
              }),
            ),
              appStore["setSelectedNodes"]([v481]));
            typeof window["v2FocusOnNodes"] === "function"
              ? window["v2FocusOnNodes"]([v442, v481])
              : window["v2FocusOnNode"]?.(v481);
            const v483 = new AbortController(),
              v484 =
                Date["now"]() +
                "_" +
                Math["random"]()["toString"](36)["slice"](2),
              v485 = {
                id: v484,
                running: true,
                abort: v483,
                taskId: "",
                sourceNodeId: v442,
                outId: v481,
                apiKey: v473,
                mode: "remove",
              };
            (this["_rhTasks"]["set"](v442, v485),
              this["_notifyRhTaskChange"](v485),
              this["exit"]({ silent: true, preserveRh: true }));
            try {
              const v486 = await this["_submitRhVideoMattingRuntimeTask"]({
                sourceNodeId: v442,
                outId: v481,
                ctxId: v484,
                controller: v483,
                startTime: v482,
                taskType: "video-remove",
                executionId: getVideoKeyingExecutionId("remove"),
                successName: "视频擦除结果",
                payload: {
                  provider: "runninghubwf",
                  model: getVideoKeyingModelId(),
                  apiKey: v473,
                  videoUrl: v472,
                  maskImageDataUrl: v475,
                  sourceFrameCount: v453,
                  rhVideoFps: v449,
                  rhVideoResolution: v450,
                  rhInstanceType: v451,
                },
              });
              if (!v486["ok"]) throw v486["error"] || new Error("视频擦除失败");
              (window["_triggerLocalCacheSave"]?.(),
                window["showToast"]?.("视频擦除生成成功", "success"));
            } catch (v487) {
              if (v483?.["signal"]?.["aborted"]) {
                const v488 = this["_computeGenerationDuration"](v481);
                appStore["updateNodeData"](v481, {
                  ...buildGenerationCancelledPatch({
                    startedAt: v482,
                    duration: v488,
                  }),
                  name: "视频擦除结果",
                  rhTaskStatus: "cancelled",
                  rhTaskRecovering: false,
                  outputText: "模型:\x20RH视频擦除\x0a状态:\x20已取消",
                });
                return;
              }
              const v489 =
                  typeof v487?.["getUserMessage"] === "function"
                    ? v487["getUserMessage"]()
                    : v487 instanceof Error
                      ? v487["message"]
                      : String(v487 || "视频擦除失败"),
                v490 = this["_computeGenerationDuration"](v481);
              (appStore["updateNodeData"](v481, {
                ...buildVideoGenerationFailurePatch({
                  error: v489,
                  startedAt: v482,
                  duration: v490,
                }),
                name: "视频擦除失败",
                isGenerating: false,
                rhTaskStatus: "failed",
                rhTaskRecovering: false,
                outputText: "模型: RH视频擦除\n状态: 失败\n原因: " + v489,
              }),
                window["showToast"]?.("视频擦除失败: " + v489, "error"));
            } finally {
              const v491 = this["_rhTasks"]["get"](v442);
              v491 &&
                v491["id"] === v484 &&
                (this["_rhTasks"]["delete"](v442),
                this["_notifyRhTaskChange"](v491));
            }
            return;
          }
          const v492 = v444,
            { width: v493, height: v494 } = getAutoMediaSizeByShortSide(
              v492["width"] || 512,
              v492["height"] || 288,
            ),
            v495 = calcSafeSpawnPosNearNode(
              appStore["getState"]()["nodes"],
              v492,
              v493,
              v494,
            ),
            v496 = generateId("source-video-matting"),
            v497 = Date["now"]();
          (appStore["addNode"](
            buildSourceMediaNodePayload({
              id: v496,
              type: "source-video",
              x: v495["x"],
              y: v495["y"],
              width: v493,
              height: v494,
              name: "抠像结果 " + (v492["name"] || "视频"),
              src: "",
              localPath: "",
              ...buildGenerationStartPatch({ startedAt: v497 }),
              provider: "runninghubwf",
              model: getVideoKeyingModelId(),
              rhTaskId: "",
              rhTaskStatus: "pending",
              rhTaskStartedAt: v497,
              rhTaskRecovering: false,
              rhTaskUseOpenapiQuery: false,
              rhSourceNodeId: v442,
              rhToolbarTaskType: "video-keying",
              fixedSize: true,
              outputText: "模型: RH视频抠像\n状态: 处理中",
            }),
          ),
            appStore["setSelectedNodes"]([v496]),
            commit(),
            window["v2FocusOnNodes"]?.([this["nodeId"], v496]));
          const v498 = new AbortController(),
            v499 =
              Date["now"]() +
              "_" +
              Math["random"]()["toString"](36)["slice"](2),
            v500 = {
              id: v499,
              running: true,
              abort: v498,
              taskId: "",
              sourceNodeId: v442,
              outId: v496,
              apiKey: v473,
              mode: "keying",
            };
          (this["_rhTasks"]["set"](v442, v500),
            this["_notifyRhTaskChange"](v500),
            window["showToast"]?.("⏳ 正在提交 RH 视频抠像任务...", "info"),
            this["exit"]({ silent: true, preserveRh: true }));
          try {
            const v501 = await this["_submitRhVideoMattingRuntimeTask"]({
              sourceNodeId: v442,
              outId: v496,
              ctxId: v499,
              controller: v498,
              startTime: v497,
              taskType: "video-keying",
              executionId: getVideoKeyingExecutionId("keying"),
              payload: {
                provider: "runninghubwf",
                model: getVideoKeyingModelId(),
                apiKey: v473,
                videoUrl: v472,
                pos_points: v468,
                neg_points: v469,
                frame_index: v470,
                timeSec: v448,
                frameRate: v449,
                frameCount: v453,
                rhVideoFps: v449,
                rhVideoFrames: v453,
                rhVideoResolution: v450,
                rhInstanceType: v451,
                rhMaskMode: v452,
              },
            });
            if (!v501["ok"]) throw v501["error"] || new Error("抠像失败");
            (window["_triggerLocalCacheSave"]?.(),
              window["showToast"]?.("✅ 抠像完成，已生成新视频", "success"));
          } catch (v502) {
            if (v498?.["signal"]?.["aborted"]) {
              try {
                const v503 = appStore["getState"]()["nodes"]?.[v496];
                if (v503) {
                  const v504 = String(v503["outputText"] || "");
                  if (!v504["includes"]("已取消")) {
                    const v505 = this["_computeGenerationDuration"](v496);
                    appStore["updateNodeData"](v496, {
                      ...buildGenerationCancelledPatch({
                        startedAt: v497,
                        duration: v505,
                      }),
                      rhTaskStatus: "cancelled",
                      rhTaskRecovering: false,
                      outputText: "模型: RH视频抠像\n状态: 已取消",
                    });
                  }
                }
              } catch {}
              return;
            }
            const v506 =
                typeof v502?.["getUserMessage"] === "function"
                  ? v502["getUserMessage"]()
                  : v502 instanceof Error
                    ? v502["message"]
                    : String(v502 || "抠像失败"),
              v507 = this["_computeGenerationDuration"](v496);
            (appStore["updateNodeData"](v496, {
              ...buildVideoGenerationFailurePatch({
                error: v506,
                startedAt: v497,
                duration: v507,
              }),
              isGenerating: false,
              rhTaskStatus: "failed",
              rhTaskRecovering: false,
              outputText: "模型: RH视频抠像\n状态: 失败\n原因: " + v506,
            }),
              window["showToast"]?.("❌\x20抠像失败:\x20" + v506, "error"));
          } finally {
            const v508 = this["_rhTasks"]["get"](v442);
            v508 &&
              v508["id"] === v499 &&
              (this["_rhTasks"]["delete"](v442),
              this["_notifyRhTaskChange"](v508));
          }
        }));
      const v509 = this["barEl"]["querySelector"](".rh-keying-settings-wrap"),
        v510 = this["barEl"]["querySelector"](".rh-keying-settings-btn"),
        v511 = this["barEl"]["querySelector"](".rh-keying-settings-menu");
      if (v509 && v510 && v511) {
        const v512 = () => {
          const v513 = appStore["getState"]()["nodes"]?.[this["nodeId"]] || {},
            {
              fps: v514,
              resolution: v515,
              instanceType: v516,
            } = this["_getRhVideoSettings"](v513),
            v517 = this["_getRhMaskMode"](v513);
          (v511["querySelectorAll"](".rh-keying-res-btn")["forEach"]((v518) =>
            v518["classList"]["toggle"](
              "active",
              Number(v518["dataset"]["value"]) === v515,
            ),
          ),
            v511["querySelectorAll"](".rh-keying-fps-btn")["forEach"]((v519) =>
              v519["classList"]["toggle"](
                "active",
                Number(v519["dataset"]["value"]) === v514,
              ),
            ),
            v511["querySelectorAll"](".rh-keying-maskmode-btn")["forEach"](
              (v520) =>
                v520["classList"]["toggle"](
                  "active",
                  v520["dataset"]["value"] === v517,
                ),
            ),
            v511["querySelectorAll"](".rh-keying-vram-btn")["forEach"]((v521) =>
              v521["classList"]["toggle"](
                "active",
                v521["dataset"]["value"] === v516,
              ),
            ));
        };
        (v509["addEventListener"]("click", (v522) => v522["stopPropagation"]()),
          v511["addEventListener"]("click", (v523) =>
            v523["stopPropagation"](),
          ),
          v510["addEventListener"]("click", (v524) => {
            (v524["preventDefault"](), v524["stopPropagation"]());
            const v525 = () => {
                (v509["classList"]["remove"]("show"),
                  this["_onKeyingSettingsDocDown"] &&
                    (document["removeEventListener"](
                      "pointerdown",
                      this["_onKeyingSettingsDocDown"],
                      true,
                    ),
                    (this["_onKeyingSettingsDocDown"] = null)));
              },
              v526 = !v509["classList"]["contains"]("show");
            if (!v526) {
              v525();
              return;
            }
            (v509["classList"]["add"]("show"),
              v512(),
              !this["_onKeyingSettingsDocDown"] &&
                ((this["_onKeyingSettingsDocDown"] = (v527) => {
                  if (v509["contains"](v527["target"])) return;
                  v525();
                }),
                document["addEventListener"](
                  "pointerdown",
                  this["_onKeyingSettingsDocDown"],
                  true,
                )));
          }),
          v511["querySelectorAll"](".rh-keying-fps-btn")["forEach"]((v528) => {
            v528["addEventListener"]("click", (v529) => {
              (v529["preventDefault"](), v529["stopPropagation"]());
              const v530 = Number(v528["dataset"]["value"]),
                v531 = normalizeRhKeyingFps(v530);
              try {
                const v532 = Math["max"](
                    1,
                    Math["round"]((Number(this["durationSec"]) || 0) * v531) ||
                      1,
                  ),
                  v533 = this["videoEl"] || this["_getVideoEl"](),
                  v534 = Math["max"](
                    0,
                    Math["min"](
                      Number(this["durationSec"]) || 0,
                      Number(v533?.["currentTime"]) || 0,
                    ),
                  ),
                  v535 = Math["max"](0, Math["round"](v534 * v531));
                appStore["updateNodeData"](this["nodeId"], {
                  rhVideoFps: v531,
                  rhVideoFrames: v532,
                  frame_index: v535,
                });
              } catch {}
              (v512(), this["_updateHelperRight"]());
            });
          }),
          v511["querySelectorAll"](".rh-keying-maskmode-btn")["forEach"](
            (v536) => {
              v536["addEventListener"]("click", (v537) => {
                (v537["preventDefault"](), v537["stopPropagation"]());
                const v538 = this["_normalizeRhMaskMode"](
                  v536["dataset"]["value"],
                );
                try {
                  appStore["updateNodeData"](this["nodeId"], {
                    rhMaskMode: v538,
                  });
                } catch {}
                v512();
              });
            },
          ),
          v511["querySelectorAll"](".rh-keying-res-btn")["forEach"]((v539) => {
            v539["addEventListener"]("click", (v540) => {
              (v540["preventDefault"](), v540["stopPropagation"]());
              const v541 = Math["trunc"](Number(v539["dataset"]["value"])),
                v542 = [832, 1024, 1280, 1440, 1600, 1760, 1920]["includes"](
                  v541,
                )
                  ? v541
                  : 1024;
              try {
                appStore["updateNodeData"](this["nodeId"], {
                  rhVideoResolution: v542,
                });
              } catch {}
              (v512(), this["_updateHelperRight"]());
            });
          }),
          v511["querySelectorAll"](".rh-keying-vram-btn")["forEach"]((v543) => {
            v543["addEventListener"]("click", (v544) => {
              (v544["preventDefault"](), v544["stopPropagation"]());
              const v545 =
                v543["dataset"]["value"] === "plus" ? "plus" : "default";
              try {
                appStore["updateNodeData"](this["nodeId"], {
                  rhInstanceType: v545,
                });
              } catch {}
              v512();
            });
          }));
      }
      const v546 = this["barEl"]["querySelector"](".rh-keying-debug-btn");
      v546 &&
        v546["addEventListener"]("click", async (v547) => {
          (v547["preventDefault"](), v547["stopPropagation"]());
          const v548 = appStore["getState"]()["nodes"]?.[this["nodeId"]] || {},
            v549 = this["videoEl"] || this["_getVideoEl"](),
            v550 = Number(v549?.["currentTime"]) || 0,
            v551 = Number(v549?.["videoWidth"]) || 0,
            v552 = Number(v549?.["videoHeight"]) || 0,
            {
              fps: v553,
              resolution: v554,
              instanceType: v555,
            } = this["_getRhVideoSettings"](v548),
            v556 = this["_getRhMaskMode"](v548),
            v557 = this["_getSourceFrameCount"](v548, v553),
            v558 = this["_resolveSourceVideoValue"](v548),
            { pos_points: v559, neg_points: v560 } = this["getPosNegPoints"](),
            { w: v561, h: v562 } = this["_calcKeyingFrameSize"](
              v551,
              v552,
              v554,
            ),
            v563 = (v564, v565, v566) =>
              Math["max"](v565, Math["min"](v566, v564)),
            v567 = (v568) => ({
              x: Math["round"](
                v563(v568["x"] * v561, 0, Math["max"](0, v561 - 1)),
              ),
              y: Math["round"](
                v563(v568["y"] * v562, 0, Math["max"](0, v562 - 1)),
              ),
            }),
            v569 = v561 > 0 && v562 > 0 ? v559["map"](v567) : [],
            v570 = v561 > 0 && v562 > 0 ? v560["map"](v567) : [],
            v571 = v569["length"] ? JSON["stringify"](v569) : "",
            v572 = v570["length"] ? JSON["stringify"](v570) : "";
          let v573 = "";
          try {
            v573 = await getRunningHubWorkflowApiKey();
          } catch {
            window["showToast"]?.(
              "读取 RunningHub 配置失败，请打开设置检查 API Key",
              "error",
            );
            return;
          }
          let v574 = null;
          if (this["_isRemoveUiMode"]()) {
            let v575 = "";
            try {
              v575 = this["_exportRemoveMaskDataUrl"](v554);
            } catch (v576) {
              window["showToast"]?.(
                "调试参数构建失败: " +
                  (v576?.["message"] || "无法导出擦除遮罩"),
                "error",
              );
              return;
            }
            v574 = {
              provider: "runninghubwf",
              model: getVideoKeyingModelId(),
              apiKey: v573,
              videoUrl: v558,
              maskImageDataUrl: v575,
              sourceFrameCount: v557,
              rhVideoFps: v553,
              rhVideoResolution: v554,
              rhInstanceType: v555,
            };
          } else
            v574 = {
              provider: "runninghubwf",
              model: getVideoKeyingModelId(),
              apiKey: v573,
              videoUrl: v558,
              pos_points: v571,
              neg_points: v572,
              timeSec: v550,
              frame_index: Math["max"](0, Math["round"](v550 * v553)),
              rhVideoFps: v553,
              rhVideoFrames: Number["isFinite"](v548["rhVideoFrames"])
                ? Math["max"](0, Math["trunc"](v548["rhVideoFrames"]))
                : v557,
              rhVideoResolution: v554,
              rhInstanceType: v555,
              rhMaskMode: v556,
            };
          try {
            const v577 = await buildGenerateVideoRequest(v574),
              v578 = formatFinalApiDebugRequest(v577),
              v579 = appStore["getState"](),
              v580 = v579["nodes"]?.[this["nodeId"]] || {},
              v581 = (v580["x"] || 0) + (v580["width"] || 380) + 50,
              v582 = v580["y"] || 0;
            let v583 = Object["values"](v579["nodes"] || {})["find"](
              (v584) => v584 && v584["type"] === "debug",
            );
            (!v583
              ? appStore["addNode"]({
                  id: "debug-" + Date["now"](),
                  type: "debug",
                  x: v581,
                  y: v582,
                  width: 420,
                  height: 360,
                  name: "调试节点",
                  outputText: v578,
                })
              : appStore["updateNodeData"](v583["id"], {
                  outputText: v578,
                  x: v581,
                  y: v582,
                }),
              window["showToast"]?.(
                this["_isRemoveUiMode"]()
                  ? "🔧 已展示 RH 视频擦除请求参数"
                  : "🔧 已展示 RH 抠像请求参数",
                "info",
              ));
          } catch (v585) {
            window["showToast"]?.(
              "调试失败: " + (v585?.["message"] || "未知错误"),
              "error",
            );
          }
        });
      !this["_onShortcutsUpdated"] &&
        ((this["_onShortcutsUpdated"] = () =>
          this["_refreshRemoveShortcutUi"]()),
        window["addEventListener"](
          "shortcuts-updated",
          this["_onShortcutsUpdated"],
        ));
      const v586 = (v587) => {
          const v588 = this["trackEl"]?.["getBoundingClientRect"](),
            v589 = this["durationSec"];
          if (!v588 || !v588["width"] || !Number["isFinite"](v589) || v589 <= 0)
            return;
          const v590 = Math["max"](
              0,
              Math["min"](1, (v587 - v588["left"]) / v588["width"]),
            ),
            v591 = v590 * v589,
            v592 = this["videoEl"] || this["_getVideoEl"]();
          if (v592)
            v592["currentTime"] = Math["max"](0, Math["min"](v589, v591));
          this["_renderPlayhead"]();
        },
        v593 = (v594, v595) => {
          if (v594 && this["_onPointerMove"])
            v594["removeEventListener"]("pointermove", this["_onPointerMove"]);
          if (v594 && this["_onPointerUp"])
            v594["removeEventListener"]("pointerup", this["_onPointerUp"]);
          if (v594 && this["_onPointerCancel"])
            v594["removeEventListener"](
              "pointercancel",
              this["_onPointerCancel"],
            );
          if (v594 && this["_onPointerCancel"])
            v594["removeEventListener"](
              "lostpointercapture",
              this["_onPointerCancel"],
            );
          ((this["_onPointerMove"] = null),
            (this["_onPointerUp"] = null),
            (this["_onPointerCancel"] = null));
          try {
            if (v594 && Number["isFinite"](v595))
              v594["releasePointerCapture"](v595);
          } catch {}
        },
        v596 = (v597) => {
          if (!this["active"] || !this["trackEl"]) return;
          (v597["preventDefault"](),
            v597["stopPropagation"](),
            this["_pauseAllWrapperVideos"](),
            v586(v597["clientX"]));
          const v598 = this["trackEl"],
            v599 = v597["pointerId"];
          try {
            if (Number["isFinite"](v599)) v598["setPointerCapture"](v599);
          } catch {}
          ((this["_onPointerMove"] = (v600) => {
            if (Number["isFinite"](v599) && v600["pointerId"] !== v599) return;
            (v600["preventDefault"](), v586(v600["clientX"]));
          }),
            (this["_onPointerUp"] = (v601) => {
              if (Number["isFinite"](v599) && v601["pointerId"] !== v599)
                return;
              (v601["preventDefault"](),
                v593(v598, v599),
                this["_pauseAllWrapperVideos"]());
            }),
            (this["_onPointerCancel"] = (v602) => {
              if (Number["isFinite"](v599) && v602["pointerId"] !== v599)
                return;
              (v593(v598, v599), this["_pauseAllWrapperVideos"]());
            }),
            v598["addEventListener"]("pointermove", this["_onPointerMove"]),
            v598["addEventListener"]("pointerup", this["_onPointerUp"]),
            v598["addEventListener"]("pointercancel", this["_onPointerCancel"]),
            v598["addEventListener"](
              "lostpointercapture",
              this["_onPointerCancel"],
            ));
        };
      (this["playheadEl"]?.["addEventListener"]("pointerdown", v596),
        this["trackEl"]?.["addEventListener"]("pointerdown", v596),
        (this["_onKeyDown"] = (v603) => {
          if (!this["active"]) return;
          if (
            v603["target"] &&
            (v603["target"]["tagName"] === "INPUT" ||
              v603["target"]["tagName"] === "TEXTAREA" ||
              v603["target"]["isContentEditable"])
          )
            return;
          if (v603["key"] === "Escape") {
            (v603["preventDefault"](),
              v603["stopPropagation"](),
              this["exit"]());
            return;
          }
          if (this["_isRemoveUiMode"]()) {
            const v604 = handleShortcutKeydown(v603, {
              mattingActive: false,
              annotateActive: false,
              videoKeyingActive: true,
              featureModeActive: true,
              selectedNodeType: "source-video",
            });
            if (!v604) return;
            if (v604 === "editor-tool-brush") {
              (v603["preventDefault"](),
                v603["stopPropagation"](),
                this["_setRemovePointTool"]("foreground"));
              return;
            }
            if (v604 === "editor-tool-eraser") {
              (v603["preventDefault"](),
                v603["stopPropagation"](),
                this["_setRemovePointTool"]("background"));
              return;
            }
            if (v604 === "editor-clear") {
              (v603["preventDefault"](),
                v603["stopPropagation"](),
                this["_clearAllMarks"](),
                window["showToast"]?.("已清空所有点", "info"));
              return;
            }
            if (v604 === "undo") {
              (v603["preventDefault"](),
                v603["stopPropagation"](),
                this["_undoMark"]());
              return;
            }
            if (v604 === "redo") {
              (v603["preventDefault"](),
                v603["stopPropagation"](),
                this["_redoMark"]());
              return;
            }
            return;
          }
          const v605 = (v603["ctrlKey"] || v603["metaKey"]) && !v603["altKey"];
          if (
            v605 &&
            !v603["shiftKey"] &&
            (v603["key"] === "z" || v603["key"] === "Z")
          ) {
            (v603["preventDefault"](),
              v603["stopPropagation"](),
              this["_undoMark"]());
            return;
          }
          if (
            v605 &&
            ((v603["shiftKey"] &&
              (v603["key"] === "z" || v603["key"] === "Z")) ||
              (!v603["shiftKey"] &&
                (v603["key"] === "y" || v603["key"] === "Y")))
          ) {
            (v603["preventDefault"](),
              v603["stopPropagation"](),
              this["_redoMark"]());
            return;
          }
          (v603["key"] === "r" || v603["key"] === "R") &&
            !v603["altKey"] &&
            !v603["ctrlKey"] &&
            !v603["metaKey"] &&
            (v603["preventDefault"](),
            v603["stopPropagation"](),
            this["_clearAllMarks"](),
            window["showToast"]?.("已清空所有点", "info"));
        }),
        window["addEventListener"]("keydown", this["_onKeyDown"], true));
      const v606 = () => {
        const v607 = this["markLayerEl"],
          v608 = this["videoEl"] || this["_getVideoEl"](),
          v609 = Array["isArray"](this["_marks"]) ? this["_marks"] : [];
        if (!v607 || !v608) return;
        const v610 = this["_getVideoProjection"](v608),
          v611 = this["_getLayerProjection"](v607);
        if (!v610 || !v611) return;
        if (this["_isRemoveUiMode"]()) {
          const v612 = this["markCanvasEl"];
          if (!v612) return;
          const v613 = Math["max"](1, Math["round"](v611["lw"])),
            v614 = Math["max"](1, Math["round"](v611["lh"])),
            v615 = window["devicePixelRatio"] || 1,
            v616 = Math["round"](v613 * v615),
            v617 = Math["round"](v614 * v615);
          (v612["width"] !== v616 || v612["height"] !== v617) &&
            ((v612["width"] = v616),
            (v612["height"] = v617),
            (v612["style"]["width"] = v613 + "px"),
            (v612["style"]["height"] = v614 + "px"));
          const v618 = v612["getContext"]("2d");
          if (!v618) return;
          (v618["setTransform"](v615, 0, 0, v615, 0, 0),
            v618["clearRect"](0, 0, v613, v614));
          const v619 =
            this["removeMaskCanvasEl"] || document["createElement"]("canvas");
          (v619["width"] !== Math["round"](v613) ||
            v619["height"] !== Math["round"](v614)) &&
            ((v619["width"] = Math["max"](1, Math["round"](v613))),
            (v619["height"] = Math["max"](1, Math["round"](v614))));
          this["removeMaskCanvasEl"] = v619;
          const v620 = v619["getContext"]("2d");
          if (!v620) return;
          (v620["clearRect"](0, 0, v619["width"], v619["height"]),
            (v620["lineCap"] = "round"),
            (v620["lineJoin"] = "round"));
          const v621 = (v622) => {
            if (
              !v622 ||
              (v622["type"] !== "brush" && v622["type"] !== "eraser")
            )
              return;
            const v623 = Array["isArray"](v622["points"]) ? v622["points"] : [];
            if (!v623["length"]) return;
            const v624 = v623["map"]((v625) =>
              this["_normalizedToLayerPoint"](
                Number(v625?.["nx"]),
                Number(v625?.["ny"]),
                v611,
                v610,
              ),
            )["filter"](
              (v626) =>
                Number["isFinite"](v626["x"]) && Number["isFinite"](v626["y"]),
            );
            if (!v624["length"]) return;
            drawEraseMaskCommand(v620, {
              type: v622["type"] === "eraser" ? "eraser" : "brush",
              points: v624,
              lineWidth: getBrushLineWidth(
                this["_clampRemoveBrushSize"](v622["brushSizePx"]),
                1,
                v622["type"],
              ),
            });
          };
          v609["forEach"](v621);
          if (this["_removeDraft"]) v621(this["_removeDraft"]);
          const v627 =
            createEraseCheckerboardPattern(v618, 1) ||
            getEraseCanvasPalette()["checkerAccent"];
          compositeCheckerMask(v618, {
            maskCanvas: v619,
            width: v613,
            height: v614,
            checkerPattern: v627,
            checkerZoom: 1,
            checkerAlpha: 0.8,
          });
          return;
        }
        if (!v609["length"]) {
          v607["replaceChildren"]();
          return;
        }
        const v628 = document["createDocumentFragment"]();
        for (let v629 = 0; v629 < v609["length"]; v629++) {
          const v630 = v609[v629],
            v631 = document["createElement"]("div"),
            v632 =
              v630 && typeof v630["pointType"] === "string"
                ? v630["pointType"]
                : "foreground";
          v631["className"] =
            v632 === "background"
              ? "v2-video-keying-mark v2-video-keying-mark--background"
              : "v2-video-keying-mark\x20v2-video-keying-mark--foreground";
          if (this["_isRemoveUiMode"]()) {
            const v633 = this["_clampRemoveBrushSize"](
                v630["brushSizePx"] || this["_removeBrushSizePx"],
              ),
              v634 = Math["max"](8, Math["min"](30, Math["round"](v633 / 4)));
            ((v631["style"]["width"] = v634 + "px"),
              (v631["style"]["height"] = v634 + "px"));
          }
          const v635 = this["_normalizedToLayerPoint"](
            Number(v630["nx"]),
            Number(v630["ny"]),
            v611,
            v610,
          );
          if (!v635) continue;
          ((v631["style"]["left"] = v635["x"] + "px"),
            (v631["style"]["top"] = v635["y"] + "px"),
            v628["appendChild"](v631));
        }
        v607["replaceChildren"](v628);
      };
      this["_renderMarksFn"] = v606;
      const v636 = { down: false, pointerId: null },
        v637 = (v638 = true) => {
          const v639 = this["markLayerEl"],
            v640 = v636["pointerId"];
          if (v639 && Number["isFinite"](v640))
            try {
              v639["releasePointerCapture"](v640);
            } catch {}
          ((v636["down"] = false),
            (v636["pointerId"] = null),
            (this["_removeDrawPointerId"] = null));
          const v641 = this["_removeDraft"];
          this["_removeDraft"] = null;
          if (!v638 || !v641) {
            this["_renderMarksFn"]?.();
            return;
          }
          const v642 = Array["isArray"](v641["points"])
            ? v641["points"]
                [
                  "map"
                ]((v643) => ({ nx: Math["max"](0, Math["min"](1, Number(v643?.["nx"]) || 0)), ny: Math["max"](0, Math["min"](1, Number(v643?.["ny"]) || 0)) }))
                [
                  "filter"
                ]((v644) => Number["isFinite"](v644["nx"]) && Number["isFinite"](v644["ny"]))
            : [];
          if (!v642["length"]) {
            this["_renderMarksFn"]?.();
            return;
          }
          const v645 = Array["isArray"](this["_marks"]) ? this["_marks"] : [];
          (v645["push"]({
            type: v641["type"] === "eraser" ? "eraser" : "brush",
            brushSizePx: this["_clampRemoveBrushSize"](v641["brushSizePx"]),
            points: v642,
          }),
            (this["_marks"] = v645),
            (this["_marksRedo"] = []),
            this["_syncPointsToStore"](),
            this["_renderMarksFn"]?.());
        };
      ((this["_onMarkPointerDown"] = (v646) => {
        if (!this["active"]) return;
        if (v646["detail"] && v646["detail"] > 1) return;
        if (
          !this["markLayerEl"] ||
          !this["markLayerEl"]["contains"](v646["target"])
        )
          return;
        (v646["preventDefault"](),
          v646["stopPropagation"](),
          this["_pauseAllWrapperVideos"](),
          this["_scheduleRemoveCursor"](v646["clientX"], v646["clientY"]));
        const v647 = this["_pickFromClient"](v646["clientX"], v646["clientY"]);
        if (!v647) return;
        if (this["_isRemoveUiMode"]()) {
          if (v646["button"] !== 0) return;
          Array["isArray"](this["_marksRedo"]) &&
            this["_marksRedo"]["length"] &&
            (this["_marksRedo"] = []);
          const v648 = this["_getRemoveToolType"]();
          ((this["_removeDraft"] = {
            type: v648,
            brushSizePx: this["_clampRemoveBrushSize"](
              this["_removeBrushSizePx"],
            ),
            points: [{ nx: v647["nx"], ny: v647["ny"] }],
          }),
            (v636["down"] = true),
            (v636["pointerId"] = v646["pointerId"]),
            (this["_removeDrawPointerId"] = v646["pointerId"]));
          try {
            if (Number["isFinite"](v646["pointerId"]))
              this["markLayerEl"]["setPointerCapture"](v646["pointerId"]);
          } catch {}
          this["_renderMarksFn"]?.();
          return;
        }
        const v649 = Array["isArray"](this["_marks"]) ? this["_marks"] : [];
        Array["isArray"](this["_marksRedo"]) &&
          this["_marksRedo"]["length"] &&
          (this["_marksRedo"] = []);
        const v650 = this["videoEl"],
          v651 = Number(v650?.["currentTime"]) || 0;
        if (v646["button"] !== 0 && v646["button"] !== 2) return;
        let v652 = v646["button"] === 2 ? "background" : "foreground";
        (this["_isRemoveUiMode"]() &&
          v646["button"] === 0 &&
          (v652 =
            this["_removePointTool"] === "background"
              ? "background"
              : "foreground"),
          v649["push"]({
            nx: v647["nx"],
            ny: v647["ny"],
            t: v651,
            pointType: v652,
            brushSizePx: this["_isRemoveUiMode"]()
              ? this["_clampRemoveBrushSize"](this["_removeBrushSizePx"])
              : undefined,
          }),
          (this["_marks"] = v649),
          v606(),
          this["_syncPointsToStore"]());
      }),
        (this["_onMarkPointerMove"] = (v653) => {
          if (!this["active"] || !this["_isRemoveUiMode"]()) return;
          this["_scheduleRemoveCursor"](v653["clientX"], v653["clientY"]);
          if (!v636["down"] || !this["_removeDraft"]) return;
          if (
            Number["isFinite"](v636["pointerId"]) &&
            v653["pointerId"] !== v636["pointerId"]
          )
            return;
          (v653["preventDefault"](), v653["stopPropagation"]());
          const v654 = this["_pickFromClient"](
            v653["clientX"],
            v653["clientY"],
          );
          if (!v654) return;
          const v655 = this["_removeDraft"]["points"];
          if (!Array["isArray"](v655) || !v655["length"]) {
            ((this["_removeDraft"]["points"] = [
              { nx: v654["nx"], ny: v654["ny"] },
            ]),
              this["_renderMarksFn"]?.());
            return;
          }
          const v656 = v655[v655["length"] - 1],
            v657 = Math["hypot"](
              Number(v654["nx"]) - Number(v656["nx"]),
              Number(v654["ny"]) - Number(v656["ny"]),
            );
          if (v657 < 0.0006) return;
          (v655["push"]({ nx: v654["nx"], ny: v654["ny"] }),
            this["_renderMarksFn"]?.());
        }),
        (this["_onMarkPointerUp"] = (v658) => {
          if (!this["active"] || !this["_isRemoveUiMode"]()) return;
          this["_scheduleRemoveCursor"](v658["clientX"], v658["clientY"]);
          if (
            Number["isFinite"](v636["pointerId"]) &&
            v658["pointerId"] !== v636["pointerId"]
          )
            return;
          (v658["preventDefault"](), v658["stopPropagation"](), v637(true));
        }),
        (this["_onMarkPointerCancel"] = (v659) => {
          if (!this["active"] || !this["_isRemoveUiMode"]()) return;
          if (
            Number["isFinite"](v636["pointerId"]) &&
            v659["pointerId"] !== v636["pointerId"]
          )
            return;
          v637(true);
        }),
        (this["_onMarkPointerEnter"] = (v660) => {
          if (!this["_isRemoveUiMode"]()) return;
          ((this["_removeCursorHover"] = true),
            this["_scheduleRemoveCursor"](v660["clientX"], v660["clientY"]));
        }),
        (this["_onMarkPointerLeave"] = () => {
          if (!this["_isRemoveUiMode"]()) return;
          ((this["_removeCursorHover"] = false), this["_syncRemoveCursor"]());
        }),
        this["_detachMarkLayerListeners"](),
        this["_attachMarkLayerListeners"](),
        v606(),
        (this["_onResize"] = () => {
          if (!this["active"]) return;
          (this["_renderMarksFn"]?.(), this["_syncRemoveCursor"]());
        }),
        window["addEventListener"]("resize", this["_onResize"]));
    },
    _getVideoEl() {
      if (!this["wrapperEl"]) return null;
      const v661 = Array["from"](
        this["wrapperEl"]["querySelectorAll"]("video"),
      );
      for (const v662 of v661) {
        if (!v662) continue;
        const v663 = window["getComputedStyle"](v662);
        if (v663["display"] === "none" || v663["visibility"] === "hidden")
          continue;
        const v664 = Number(v663["opacity"]);
        if (Number["isFinite"](v664) && v664 <= 0) continue;
        const v665 = v662["getBoundingClientRect"]();
        if (!v665["width"] || !v665["height"]) continue;
        return v662;
      }
      return null;
    },
    _readDurationSec(v666) {
      if (!v666) return 0;
      const v667 = Number(v666["duration"]);
      if (Number["isFinite"](v667) && v667 > 0) return v667;
      const v668 = v666["seekable"];
      if (v668 && v668["length"]) {
        const v669 = Number(v668["end"](v668["length"] - 1));
        if (Number["isFinite"](v669) && v669 > 0) return v669;
      }
      return 0;
    },
    async _syncDurationAndDefaults() {
      ((this["videoEl"] = this["_getVideoEl"]()), this["_ensureMarkLayer"]());
      if (this["videoEl"]) {
        const v670 = this["_resolveVideoSrcFromNode"](
            appStore["getState"]()["nodes"]?.[this["nodeId"]],
          ),
          v671 = String(v670 || "")["trim"](),
          v672 = String(
            this["videoEl"]["dataset"]?.["videoKeyingSourceUrl"] || "",
          )["trim"](),
          v673 = ++this["_sourceToken"];
        setVideoKeyingMediaKeepAlive(this["videoEl"], true);
        if (v671 && v672 !== v671) {
          await attachVideoKeyingPlaybackSource(this["videoEl"], v671);
          if (!this["active"] || v673 !== this["_sourceToken"]) return;
          this["videoEl"]["dataset"] &&
            (this["videoEl"]["dataset"]["videoKeyingSourceUrl"] = v671);
        }
      }
      const v674 = this["_readDurationSec"](this["videoEl"]);
      if (v674 > 0) this["durationSec"] = v674;
      (this["_pauseAllWrapperVideos"](),
        this["videoEl"] &&
          ((this["_onLoadedMeta"] = () => {
            if (!this["active"]) return;
            const v675 = this["_readDurationSec"](this["videoEl"]);
            if (v675 > 0) this["durationSec"] = v675;
            this["_pauseAllWrapperVideos"]();
          }),
          (this["_onDurationChange"] = () => {
            if (!this["active"]) return;
            const v676 = this["_readDurationSec"](this["videoEl"]);
            if (v676 > 0) this["durationSec"] = v676;
          }),
          this["videoEl"]["addEventListener"](
            "loadedmetadata",
            this["_onLoadedMeta"],
            { once: true },
          ),
          this["videoEl"]["addEventListener"](
            "durationchange",
            this["_onDurationChange"],
          )),
        this["_renderThumbs"](),
        this["_startPlayheadLoop"](),
        this["wrapperEl"] &&
          !this["_onVideoPlay"] &&
          ((this["_onVideoPlay"] = (v677) => {
            if (!this["active"]) return;
            if (!this["wrapperEl"]) return;
            const v678 = v677["target"];
            if (!(v678 instanceof HTMLVideoElement)) return;
            try {
              v678["pause"]();
            } catch {}
          }),
          this["wrapperEl"]["addEventListener"](
            "play",
            this["_onVideoPlay"],
            true,
          ),
          this["wrapperEl"]["addEventListener"](
            "playing",
            this["_onVideoPlay"],
            true,
          )));
    },
    _startPlayheadLoop() {
      if (this["_playheadRaf"]) cancelAnimationFrame(this["_playheadRaf"]);
      const v679 = () => {
        if (!this["active"]) return;
        (this["_renderPlayhead"](),
          (this["_playheadRaf"] = requestAnimationFrame(v679)));
      };
      this["_playheadRaf"] = requestAnimationFrame(v679);
    },
    _renderPlayhead() {
      if (!this["playheadEl"] || !this["trackEl"]) return;
      const v680 = this["durationSec"];
      if (!Number["isFinite"](v680) || v680 <= 0) {
        this["playheadEl"]["style"]["display"] = "none";
        return;
      }
      const v681 = this["videoEl"] || this["_getVideoEl"]();
      if (!v681) {
        this["playheadEl"]["style"]["display"] = "none";
        return;
      }
      let v682 = false;
      if (this["videoEl"] !== v681)
        ((this["videoEl"] = v681),
          this["_ensureMarkLayer"](),
          this["_attachMarkLayerListeners"](),
          (v682 = true));
      else
        this["markLayerEl"] &&
          !this["markLayerEl"]["isConnected"] &&
          (this["_ensureMarkLayer"](),
          this["_attachMarkLayerListeners"](),
          (v682 = true));
      const v683 = Math["max"](
          0,
          Math["min"](v680, Number(v681["currentTime"]) || 0),
        ),
        v684 = Math["max"](0, Math["min"](1, v683 / v680)),
        v685 = appStore["getState"]()["nodes"]?.[this["nodeId"]] || {},
        { fps: v686 } = this["_getRhVideoSettings"](v685),
        v687 = Math["max"](0, Math["round"](v683 * v686));
      (this["_lastFrameIndex"] !== v687 ||
        this["_lastFrameIndexFps"] !== v686) &&
        ((this["_lastFrameIndex"] = v687),
        (this["_lastFrameIndexFps"] = v686),
        this["_updateHelperRight"]());
      (this["_updateHelperRight"](),
        (this["playheadEl"]["style"]["display"] = "block"),
        (this["playheadEl"]["style"]["left"] = v684 * 100 + "%"));
      if (v682) this["_renderMarksFn"]?.();
      this["_syncRemoveCursor"]();
    },
    _resolveVideoSrcFromNode(v688) {
      if (!v688) return "";
      const v689 = localPathToUrl(v688["localPath"]);
      return v689 || v688["src"] || v688["videoUrl"] || v688["resultUrl"] || "";
    },
    async _renderThumbs() {
      const v690 = ++this["_thumbToken"],
        v691 = Array["isArray"](this["thumbEls"]) ? this["thumbEls"] : [];
      if (!v691["length"]) return;
      const v692 = appStore["getState"]()["nodes"][this["nodeId"]],
        v693 = this["_resolveVideoSrcFromNode"](v692);
      await renderVideoKeyingThumbs({
        src: v693,
        thumbs: v691,
        token: v690,
        isCurrent: (v694) => this["active"] && this["_thumbToken"] === v694,
        readDurationSec: (v695) => this["_readDurationSec"](v695),
        onDuration: (v696) => {
          v696 > 0 &&
            (!this["durationSec"] || this["durationSec"] <= 0) &&
            (this["durationSec"] = v696);
        },
      });
    },
    exit({ silent: silent = false, preserveRh: preserveRh = false } = {}) {
      if (!this["active"]) return;
      const v697 = this["nodeId"],
        v698 = this["_isRemoveUiMode"]();
      this["active"] = false;
      !preserveRh && void this["_cancelRhTaskForSourceNode"](v697);
      this["_onKeyingSettingsDocDown"] &&
        (document["removeEventListener"](
          "pointerdown",
          this["_onKeyingSettingsDocDown"],
          true,
        ),
        (this["_onKeyingSettingsDocDown"] = null));
      (this["_thumbToken"]++,
        this["_sourceToken"]++,
        appStore["setVideoKeyingState"]({
          active: false,
          nodeId: null,
          pos_points: [],
          neg_points: [],
        }));
      if (this["_playheadRaf"]) cancelAnimationFrame(this["_playheadRaf"]);
      this["_playheadRaf"] = 0;
      if (this["_retryRaf"]) cancelAnimationFrame(this["_retryRaf"]);
      this["_retryRaf"] = 0;
      if (this["videoEl"]) {
        setVideoKeyingMediaKeepAlive(this["videoEl"], false);
        if (this["_onLoadedMeta"])
          this["videoEl"]["removeEventListener"](
            "loadedmetadata",
            this["_onLoadedMeta"],
          );
        if (this["_onDurationChange"])
          this["videoEl"]["removeEventListener"](
            "durationchange",
            this["_onDurationChange"],
          );
      }
      this["_onKeyDown"] &&
        (window["removeEventListener"]("keydown", this["_onKeyDown"], true),
        (this["_onKeyDown"] = null));
      this["_onResize"] &&
        (window["removeEventListener"]("resize", this["_onResize"]),
        (this["_onResize"] = null));
      const v699 = this["trackEl"];
      if (v699 && this["_onPointerMove"])
        v699["removeEventListener"]("pointermove", this["_onPointerMove"]);
      if (v699 && this["_onPointerUp"])
        v699["removeEventListener"]("pointerup", this["_onPointerUp"]);
      if (v699 && this["_onPointerCancel"])
        v699["removeEventListener"]("pointercancel", this["_onPointerCancel"]);
      if (v699 && this["_onPointerCancel"])
        v699["removeEventListener"](
          "lostpointercapture",
          this["_onPointerCancel"],
        );
      ((this["_onPointerMove"] = null),
        (this["_onPointerUp"] = null),
        (this["_onPointerCancel"] = null));
      this["_onDocClick"] &&
        (document["removeEventListener"](
          "pointerdown",
          this["_onDocClick"],
          true,
        ),
        (this["_onDocClick"] = null));
      this["wrapperEl"] &&
        this["_onVideoPlay"] &&
        (this["wrapperEl"]["removeEventListener"](
          "play",
          this["_onVideoPlay"],
          true,
        ),
        this["wrapperEl"]["removeEventListener"](
          "playing",
          this["_onVideoPlay"],
          true,
        ));
      ((this["_onVideoPlay"] = null), this["_detachMarkLayerListeners"]());
      if (this["_removeCursorRaf"])
        cancelAnimationFrame(this["_removeCursorRaf"]);
      this["_removeCursorRaf"] = 0;
      this["_onShortcutsUpdated"] &&
        (window["removeEventListener"](
          "shortcuts-updated",
          this["_onShortcutsUpdated"],
        ),
        (this["_onShortcutsUpdated"] = null));
      ((this["_onMarkPointerDown"] = null),
        (this["_onMarkPointerMove"] = null),
        (this["_onMarkPointerUp"] = null),
        (this["_onMarkPointerCancel"] = null),
        (this["_onMarkPointerEnter"] = null),
        (this["_onMarkPointerLeave"] = null),
        (this["_renderMarksFn"] = null),
        this["_applyFrozenUI"](false),
        this["_applyDimMode"](false),
        (this["durationSec"] = 0),
        (this["nodeId"] = null),
        (this["videoEl"] = null));
      if (this["markLayerEl"]) this["markLayerEl"]["remove"]();
      this["_removeWheelCleanup"] &&
        (this["_removeWheelCleanup"](), (this["_removeWheelCleanup"] = null));
      ((this["markLayerEl"] = null),
        (this["markCanvasEl"] = null),
        (this["removeMaskCanvasEl"] = null),
        (this["removeCursorEl"] = null),
        (this["removeSizeValueEl"] = null),
        (this["removeSizeRangeEl"] = null),
        (this["_onMarkWheel"] = null),
        (this["_marks"] = null),
        (this["_marksRedo"] = null),
        (this["_removeDraft"] = null),
        (this["_removeDrawPointerId"] = null),
        (this["_removeCursorHover"] = false),
        (this["_removeCursorLast"] = { x: 0, y: 0 }),
        (this["trackEl"] = null),
        (this["playheadEl"] = null),
        (this["cancelBtnEl"] = null),
        (this["confirmBtnEl"] = null),
        (this["helperRightEl"] = null));
      if (this["hintEl"]) this["hintEl"]["remove"]();
      this["hintEl"] = null;
      if (this["removeToolbarEl"]) this["removeToolbarEl"]["remove"]();
      ((this["removeToolbarEl"] = null),
        (this["thumbEls"] = null),
        (this["_lastFrameIndex"] = null),
        (this["_lastFrameIndexFps"] = null),
        (this["_lastHelperRightText"] = null),
        (this["_lastConfirmEnabled"] = null),
        (this["uiMode"] = "keying"),
        (this["_removePointTool"] = "foreground"),
        (this["_removeBrushSizePx"] = 40));
      if (this["barEl"]) this["barEl"]["remove"]();
      ((this["barEl"] = null),
        (this["wrapperEl"] = null),
        !silent &&
          window["showToast"]?.(
            v698 ? "已关闭视频擦除" : "已关闭抠像",
            "info",
          ));
    },
  };
export default VideoKeyingController;
