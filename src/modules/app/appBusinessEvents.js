import {
  deleteSelectedPanoramaSceneObject,
  focusPanoramaSceneSelection,
  resetPanoramaSceneView,
  setPanoramaSceneEditing,
  setPanoramaSceneTool,
} from "../panoramaSceneNode/sceneNodeActions.js";
import { copyNodeMediaToSystemClipboard } from "../mediaClipboard.js";
import { startCanvasScreenshot } from "../canvasScreenshot.js";
import { markSystemClipboardWrite } from "../clipboard.js";
import { applySnapGridEnabled, readSnapGridEnabled } from "../snapGridState.js";
import {
  readGridDotsPref,
  setGridDotsPref,
} from "../settings/appearanceSettings.js";
import { setSelectionRelatedHighlightPref } from "../settings/canvasAlignmentSettings.js";
import {
  readCommentNoteJumpFocusPref,
  setImageVideoNodeResizePref,
  setNodeAvoidOverlapPref,
  setPromptBoxResizePref,
  setTitleFollowsCanvasZoomPref,
  setVideoMetaPref,
} from "../settings/nodeBehaviorSettings.js";
import { resolveJumpZoom } from "../commentNoteJumpShortcut.js";
import { toggleSettingsPanel } from "../settings/panelSettings.js";
import { toggleSidebarSubmenu } from "../sidebarSubmenuController.js";
import {
  computeNodesWorldBounds,
  computeViewportForWorldBounds,
  getAlignableSelectionNodes,
  screenToWorld,
} from "../../core/math.js";
import { getBrowserViewportRect } from "../../core/viewportFocus.js";
const COMMENT_NOTE_JUMP_WORLD_ALIGN = 0.5,
  MEDIA_CLIP_DELETE_MATERIAL_EVENT = "media-clip-delete-material";
export function createAppBusinessEvents({
  store: v0,
  wrap: v1,
  addShortcutListener: v2,
  executeCommand: v3,
  undo: v4,
  redo: v5,
  commit: v6,
  closeShortcuts: v7,
  getNodeDefaultSize: v8,
  getAIGenerationDefaultSizeByType: v9,
  createNodeAtCursor: v10,
  createImageNodeFromBlob: v11,
  animateViewport: v12,
  focusNodeAtZoomPercent: v13,
  focusNodes: v14,
  clearTrackedFocus: v15,
  handlePasteFromClipboard: v16,
  initCanvasContextMenu: v17,
  ImageAnnotateController: v18,
  ImageMattingController: v19,
  AudioClipController: v20,
} = {}) {
  const v21 = (v22) => {
      const v23 = v22?.["viewport"];
      if (!v23) return null;
      const v24 = Number(window?.["_lastMx"]),
        v25 = Number(window?.["_lastMy"]);
      if (!Number["isFinite"](v24) || !Number["isFinite"](v25)) return null;
      const v26 = screenToWorld(v24, v25, v23);
      if (
        !v26 ||
        !Number["isFinite"](v26["x"]) ||
        !Number["isFinite"](v26["y"])
      )
        return null;
      return { x: v26["x"], y: v26["y"] };
    },
    v27 = {
      "panorama-scene-camera-create": {
        selector: ".act-camera",
        nodeTypes: ["panorama-scene"],
      },
      "image-tool-matting": {
        selector: ".act-matting",
        nodeTypes: ["source-image", "ai-image", "image"],
      },
      "image-tool-repaint": {
        selector: ".act-repaint",
        nodeTypes: ["source-image", "ai-image", "image"],
      },
      "image-tool-erase": {
        selector: ".act-erase",
        nodeTypes: ["source-image", "ai-image", "image"],
      },
      "image-tool-hd": {
        selector: ".act-hd",
        nodeTypes: ["source-image", "ai-image", "image"],
      },
      "image-tool-expand": {
        selector: ".act-expand",
        nodeTypes: ["source-image", "ai-image", "image"],
      },
      "image-tool-auto-subject": {
        selector: ".act-auto-subject",
        nodeTypes: ["source-image", "ai-image", "image"],
      },
      "image-tool-multigrid": {
        selector: ".act-multigrid",
        nodeTypes: ["source-image", "ai-image", "image"],
      },
      "image-tool-multiangle": {
        selector: ".act-multiangle",
        nodeTypes: ["source-image", "ai-image", "image"],
      },
      "image-tool-annotate": {
        selector: ".act-annotate",
        nodeTypes: ["source-image", "ai-image", "image"],
      },
      "image-tool-crop": {
        selector: ".act-crop",
        nodeTypes: ["source-image", "ai-image", "image"],
      },
      "image-tool-fullscreen": {
        selector: ".act-fullscreen",
        nodeTypes: ["source-image", "ai-image", "image"],
      },
      "image-tool-download": {
        selector: ".act-download",
        nodeTypes: ["source-image", "ai-image", "image"],
      },
      "video-tool-clip": {
        selector: ".act-clip",
        nodeTypes: ["source-video", "ai-video", "video"],
      },
      "video-tool-separate-av": {
        selector: ".act-separate-av",
        nodeTypes: ["source-video", "ai-video", "video"],
      },
      "video-tool-capture-frame": {
        selector: ".video-snap-btn",
        nodeTypes: ["source-video", "ai-video", "video"],
      },
      "video-tool-keying": {
        selector: ".act-keying",
        nodeTypes: ["source-video", "ai-video", "video"],
      },
      "video-tool-hd": {
        selector: ".act-hd",
        nodeTypes: ["source-video", "ai-video", "video"],
      },
      "video-tool-fullscreen": {
        selector: ".act-fullscreen",
        nodeTypes: ["source-video", "ai-video", "video"],
      },
      "video-tool-download": {
        selector: ".act-download",
        nodeTypes: ["source-video", "ai-video", "video"],
      },
      "audio-tool-clip": {
        selector: ".clip-btn",
        nodeTypes: ["source-audio", "ai-audio", "audio"],
      },
      "audio-tool-speed": {
        selector: ".speed-btn",
        nodeTypes: ["source-audio", "ai-audio", "audio"],
      },
      "audio-tool-download": {
        selector: ".download-btn",
        nodeTypes: ["source-audio", "ai-audio", "audio"],
      },
      "clip-tool-crop": {
        selector: ".media-clip-tool-crop",
        nodeTypes: ["media-clip"],
      },
      "text-tool-copy": {
        selector: ".act-copy",
        nodeTypes: ["source-text", "ai-text", "text"],
      },
      "text-tool-fullscreen": {
        selector: ".act-fullscreen",
        nodeTypes: ["source-text", "ai-text", "text"],
      },
    };
  function v28() {
    const v29 = document["getElementById"]("v2-wrap");
    return !!v29?.["classList"]["contains"]("is-audio-clip-mode");
  }
  function v30(v31 = v0["getState"]()) {
    return (
      !!v31["matting"]?.["active"] ||
      !!v31["annotate"]?.["active"] ||
      !!v31["videoClip"]?.["active"] ||
      !!v31["videoKeying"]?.["active"] ||
      v28()
    );
  }
  function v32(v33 = v0["getState"]()) {
    const v34 = Array["isArray"](v33?.["selectedNodeIds"])
      ? v33["selectedNodeIds"]
      : [];
    if (v34["length"] !== 1) return false;
    const v35 = v34[0],
      v36 = v33?.["nodes"]?.[v35] || null;
    if (
      v36?.["type"] !== "media-clip" ||
      v36?.["mediaClip"]?.["expanded"] !== true
    )
      return false;
    const v37 =
      typeof CustomEvent === "function"
        ? new CustomEvent(MEDIA_CLIP_DELETE_MATERIAL_EVENT, {
            detail: { nodeId: v35 },
          })
        : { type: MEDIA_CLIP_DELETE_MATERIAL_EVENT, detail: { nodeId: v35 } };
    return (window["dispatchEvent"]?.(v37), true);
  }
  function v38() {
    let v39 = false;
    (v28() || v20["active"]) && (v20["exit"]?.({ silent: true }), (v39 = true));
    const v40 = v0["getState"]();
    return (
      v40["annotate"]?.["active"] &&
        (v18["exit"]?.({ silent: true }), (v39 = true)),
      v40["matting"]?.["active"] &&
        (v19["exit"]?.({ silent: true }), (v39 = true)),
      v39
    );
  }
  function v41(v42) {
    const v43 = v27[v42];
    if (!v43) return false;
    const v44 = v0["getState"]();
    if (v30(v44)) return false;
    const { selectedNodeIds: v45, nodes: v46 } = v44;
    if (!Array["isArray"](v45) || v45["length"] !== 1) return false;
    const v47 = v45[0],
      v48 = v46?.[v47];
    if (!v48 || !v43["nodeTypes"]["includes"](v48["type"])) return false;
    const v49 = document["getElementById"](v47);
    if (!v49) return false;
    const v50 = v49["querySelector"](v43["selector"]);
    if (!v50) return false;
    if (v42["startsWith"]("audio-tool-"))
      try {
        const v51 = new PointerEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          pointerType: "mouse",
          isPrimary: true,
          button: 0,
        });
        return (v50["dispatchEvent"](v51), true);
      } catch {
        const v52 = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          button: 0,
        });
        return (v50["dispatchEvent"](v52), true);
      }
    if (typeof v50["click"] !== "function") return false;
    return (v50["click"](), true);
  }
  function v53() {
    const v54 = v0["getState"]();
    if (v30(v54)) return false;
    const v55 = Array["isArray"](v54?.["selectedNodeIds"])
      ? v54["selectedNodeIds"]
      : [];
    if (v55["length"] !== 1) return false;
    const v56 = document["getElementById"](v55[0]),
      v57 = v56?.["querySelector"]?.(".prompt-attachment-btn");
    if (!v57 || typeof v57["click"] !== "function") return false;
    return (v57["click"](), true);
  }
  function v58() {
    const v59 = v0["getStateRaw"] ? v0["getStateRaw"]() : v0["getState"](),
      v60 = Array["isArray"](v59?.["selectedNodeIds"])
        ? v59["selectedNodeIds"]
        : [];
    if (v60["length"] !== 1) return null;
    const v61 = v60[0],
      v62 = v59?.["nodes"]?.[v61];
    if (
      !v62 ||
      (v62["type"] !== "panorama-scene" && v62["type"] !== "panorama-360")
    )
      return null;
    const v63 =
      v62["type"] === "panorama-360"
        ? v62["panorama360Node"] || null
        : v62["sceneNode"] || null;
    return {
      nodeId: v61,
      node: v62,
      sceneState: v63,
      supportsCamera: v62["type"] === "panorama-scene",
    };
  }
  function v64({ nodeId: v65, mode: v66, slot: v67 }) {
    const v68 = Number(v67);
    if (!Number["isInteger"](v68) || v68 < 1 || v68 > 10) return;
    window["dispatchEvent"](
      new CustomEvent("panorama-scene:camera-shortcut", {
        detail: {
          nodeId: v65,
          mode: v66 === "save" ? "save" : "activate",
          slot: v68,
        },
      }),
    );
  }
  function v69({ nodeId: v70 }) {
    const v71 = String(v70 || "")["trim"]();
    if (!v71) return;
    window["dispatchEvent"](
      new CustomEvent("panorama-scene:capture-shortcut", {
        detail: { nodeId: v71 },
      }),
    );
  }
  function v72(v73) {
    const v74 = String(v73?.["nodeId"] || "")["trim"]();
    if (!v74) return;
    const v75 = v0["getStateRaw"] ? v0["getStateRaw"]() : v0["getState"](),
      v76 = v75?.["nodes"]?.[v74];
    if (!v76) return;
    if (v76["type"] !== "panorama-scene" && v76["type"] !== "panorama-360")
      return;
    (v0["setSelectedNodes"]?.([v74]),
      setPanoramaSceneEditing({
        nodeId: v74,
        isEditing: true,
        storeInstance: v0,
      }));
  }
  function v77() {
    const v78 = (v79, v80 = 800) => {
      const v81 = v0["getState"](),
        v82 = v81?.["nodes"]?.[v79];
      if (!v82 || v82["type"] !== "comment-note") return false;
      const v83 = computeNodesWorldBounds(v81?.["nodes"] || {}, [v79]),
        v84 = getBrowserViewportRect({
          windowObject: typeof window !== "undefined" ? window : undefined,
          containerEl: v1,
        }),
        { viewportAlignX: v85, viewportAlignY: v86 } =
          readCommentNoteJumpFocusPref(),
        v87 = computeViewportForWorldBounds(v83, v84, {
          fixedZoom: resolveJumpZoom(v82?.["jumpShortcut"]?.["zoomPercent"]),
          worldAlignX: COMMENT_NOTE_JUMP_WORLD_ALIGN,
          worldAlignY: COMMENT_NOTE_JUMP_WORLD_ALIGN,
          viewportAlignX: v85,
          viewportAlignY: v86,
        });
      if (!v87) return false;
      v15?.("comment-note-jump");
      const v88 = v81?.["viewport"] || { x: 0, y: 0, zoom: 1 };
      if (typeof v12 === "function")
        return (
          v12(
            v88["x"],
            v88["y"],
            v88["zoom"],
            v87["x"],
            v87["y"],
            v87["zoom"],
            v80,
          ),
          true
        );
      return (
        v0["updateViewport"]?.(v87["x"], v87["y"], v87["zoom"]),
        v0["markViewportPersist"]?.(),
        true
      );
    };
    v2((v89) => {
      if (typeof v89 === "string" && v89["startsWith"]("comment-note-jump::")) {
        const v90 = v89["slice"]("comment-note-jump::"["length"]);
        v78(v90, 800);
        return;
      }
      const v91 = v58();
      switch (v89) {
        case "panorama-scene-tool-toggle-mouse": {
          if (!v91?.["sceneState"]?.["ui"]?.["isEditing"]) break;
          const v92 = String(v91["sceneState"]?.["ui"]?.["activeTool"] || "")[
              "trim"
            ](),
            v93 = String(
              v91["sceneState"]?.["ui"]?.["mouseTool"] ||
                v91["sceneState"]?.["ui"]?.["activeTool"] ||
                "",
            )["trim"](),
            v94 = v92 === "move" || v92 === "rotate" || v92 === "scale",
            v95 = v94
              ? "navigate"
              : v93 === "box-select"
                ? "navigate"
                : "box-select";
          setPanoramaSceneTool({ nodeId: v91["nodeId"], tool: v95 });
          break;
        }
        case "panorama-scene-tool-move":
        case "panorama-scene-tool-scale":
        case "panorama-scene-tool-rotate": {
          if (!v91?.["sceneState"]?.["ui"]?.["isEditing"]) break;
          const v96 =
            v89 === "panorama-scene-tool-move"
              ? "move"
              : v89 === "panorama-scene-tool-scale"
                ? "scale"
                : "rotate";
          setPanoramaSceneTool({ nodeId: v91["nodeId"], tool: v96 });
          break;
        }
        case "panorama-scene-reset-view": {
          if (!v91?.["sceneState"]?.["ui"]?.["isEditing"]) break;
          resetPanoramaSceneView({ nodeId: v91["nodeId"] });
          break;
        }
        case "panorama-scene-capture": {
          if (!v91?.["sceneState"]?.["ui"]?.["isEditing"]) break;
          v69({ nodeId: v91["nodeId"] });
          break;
        }
        case "panorama-scene-camera-create": {
          if (
            !v91?.["sceneState"]?.["ui"]?.["isEditing"] ||
            v91?.["supportsCamera"] !== true
          )
            break;
          v41(v89);
          break;
        }
        case "image-tool-matting":
        case "image-tool-repaint":
        case "image-tool-erase":
        case "image-tool-hd":
        case "image-tool-expand":
        case "image-tool-auto-subject":
        case "image-tool-multigrid":
        case "image-tool-multiangle":
        case "image-tool-annotate":
        case "image-tool-crop":
        case "image-tool-fullscreen":
        case "image-tool-download":
        case "video-tool-clip":
        case "video-tool-separate-av":
        case "video-tool-capture-frame":
        case "video-tool-keying":
        case "video-tool-hd":
        case "video-tool-fullscreen":
        case "video-tool-download":
        case "audio-tool-clip":
        case "audio-tool-speed":
        case "audio-tool-download":
        case "clip-tool-crop":
        case "text-tool-copy":
        case "text-tool-fullscreen":
          v41(v89);
          break;
        case "delete": {
          const v97 = v0["getState"]();
          if (v97["annotate"]?.["active"]) {
            v18?.["deleteSelectedTextCommand"]?.();
            break;
          }
          if (v97["matting"]?.["active"]) break;
          if (v91?.["sceneState"]?.["ui"]?.["isEditing"]) {
            deleteSelectedPanoramaSceneObject({ nodeId: v91["nodeId"] });
            break;
          }
          if (v32(v97)) break;
          const v98 = v97["selectedNodeIds"];
          v98["length"] > 0 &&
            (v0["deleteNodes"](v98), v0["clearSelection"](), v6());
          break;
        }
        case "undo": {
          const v99 = v0["getState"]();
          if (v99["annotate"]?.["active"]) v18["_undo"]?.["call"](v18);
          else
            v99["matting"]?.["active"]
              ? v19["_undo"]?.["call"](v19)
              : (v4(), v91?.["sceneState"]?.["ui"]?.["isEditing"] && v72(v91));
          break;
        }
        case "redo": {
          const v100 = v0["getState"]();
          if (v100["annotate"]?.["active"]) v18["_redo"]?.["call"](v18);
          else
            v100["matting"]?.["active"]
              ? v19["_redo"]?.["call"](v19)
              : (v5(), v91?.["sceneState"]?.["ui"]?.["isEditing"] && v72(v91));
          break;
        }
        case "copy":
          v3("copy");
          break;
        case "copy-media": {
          const v101 = v0["getState"]()["selectedNodeIds"];
          if (!Array["isArray"](v101) || v101["length"] !== 1) {
            window["showToast"]?.("请单选一个图像节点", "warn");
            break;
          }
          const v102 = v0["getState"]()["nodes"]?.[v101[0]],
            v103 =
              v102 &&
              (v102["type"] === "source-image" ||
                v102["type"] === "ai-image" ||
                v102["type"] === "storyboard");
          if (!v103) {
            window["showToast"]?.("请单选一个图像节点", "warn");
            break;
          }
          void copyNodeMediaToSystemClipboard(v102)
            ["then"]((v104) => {
              if (v104?.["ok"]) {
                (markSystemClipboardWrite({
                  mediaType: String(v104?.["mimeType"] || "image/png"),
                }),
                  window["showToast"]?.("图像已复制", "success"));
                return;
              }
              if (v104?.["reason"] === "no-media") {
                window["showToast"]?.("当前节点没有可复制的媒体", "warn");
                return;
              }
              if (v104?.["reason"] === "not-supported") {
                window["showToast"]?.("当前环境不支持系统剪贴板复制", "warn");
                return;
              }
              window["showToast"]?.("复制图像失败", "error");
            })
            ["catch"](() => {
              window["showToast"]?.("复制图像失败", "error");
            });
          break;
        }
        case "canvas-screenshot": {
          void startCanvasScreenshot({
            createImageNodeFromBlob: v11,
            showToast: (...v105) => window["showToast"]?.(...v105),
          });
          break;
        }
        case "cut": {
          const v106 = v0["getState"]()["selectedNodeIds"];
          if (Array["isArray"](v106) && v106["length"] > 0) {
            const v107 = [...v106];
            (v3("copy", { ids: v107 }), v3("delete_nodes", { ids: v107 }));
          }
          break;
        }
        case "paste":
          v16();
          break;
        case "group":
          v3("create_group");
          break;
        case "align-feature":
        case "align-feature-toggle":
        case "align-feature-hold-start":
        case "align-feature-hold-end": {
          const v108 = v0["getState"]();
          if (v108?.["ui"]?.["alignFeatureEnabled"] === false) break;
          if (v89 === "align-feature-hold-end") {
            v0["setAlignPanelVisible"](false);
            break;
          }
          const v109 = Array["isArray"](v108?.["selectedNodeIds"])
            ? v108["selectedNodeIds"]
            : [];
          if (v109["length"] < 2) break;
          const v110 = getAlignableSelectionNodes(v108?.["nodes"] || {}, v109);
          if (v110["length"] < 2) break;
          if (v89 === "align-feature-hold-start") {
            const v111 = v21(v108);
            (v0["setAlignPanelAnchorWorld"]?.(v111),
              v0["setAlignPanelVisible"](true));
            break;
          }
          if (v89 === "align-feature-toggle" || v89 === "align-feature") {
            const v112 = v108?.["ui"]?.["alignPanelVisible"] === true;
            if (v112) v0["setAlignPanelVisible"](false);
            else {
              const v113 = v21(v108);
              (v0["setAlignPanelAnchorWorld"]?.(v113),
                v0["setAlignPanelVisible"](true));
            }
          }
          break;
        }
        case "select-all": {
          const v114 = v0["getState"]()["nodes"];
          v0["setSelection"](Object["keys"](v114));
          break;
        }
        case "fit-all": {
          if (v91?.["sceneState"]?.["ui"]?.["isEditing"]) {
            focusPanoramaSceneSelection({ nodeId: v91["nodeId"] });
            break;
          }
          const { nodes: v115, selectedNodeIds: v116 } = v0["getState"](),
            v117 =
              v116 && v116["length"] > 0
                ? v116["filter"]((v118) => v115[v118])
                : Object["keys"](v115 || {});
          if (v117["length"] === 0) break;
          v14?.(v117, 80, 800);
          break;
        }
        case "minimap": {
          const v119 = document["getElementById"]("minimapWrapper"),
            v120 = document["getElementById"]("btnMinimap");
          if (v119) {
            v119["classList"]["toggle"]("open");
            if (v120)
              v120["classList"]["toggle"](
                "active",
                v119["classList"]["contains"]("open"),
              );
          }
          break;
        }
        case "zoom-in":
        case "zoom-out": {
          v15?.("shortcut-zoom");
          const { viewport: v121 } = v0["getState"](),
            v122 = v89 === "zoom-in" ? 1.1 : 0.9,
            v123 = Math["min"](2, Math["max"](0.2, v121["zoom"] * v122)),
            v124 = window["innerWidth"] / 2,
            v125 = window["innerHeight"] / 2,
            v126 = v124 - (v124 - v121["x"]) * (v123 / v121["zoom"]),
            v127 = v125 - (v125 - v121["y"]) * (v123 / v121["zoom"]);
          v0["updateViewport"](v126, v127, v123);
          break;
        }
        case "snap-guides": {
          const v128 = v0["getState"](),
            v129 = !(v128?.["ui"]?.["snapGuidesEnabled"] !== false);
          (v0["setSnapGuidesEnabled"](v129), (window["v2SnapGuides"] = v129));
          if (!v129) window["_clearSnapGuideLines"]?.();
          (window["dispatchEvent"](
            new CustomEvent("v2-snap-guides-changed", {
              detail: { enabled: v129 },
            }),
          ),
            window["showToast"]?.(
              v129 ? "辅助线吸附已开启" : "辅助线吸附已关闭",
            ));
          break;
        }
        case "snap-grid": {
          const v130 = applySnapGridEnabled(!readSnapGridEnabled());
          window["showToast"]?.(v130 ? "网格吸附已开启" : "网格吸附已关闭");
          break;
        }
        case "grid-dots": {
          const v131 = setGridDotsPref(!readGridDotsPref());
          window["showToast"]?.(v131 ? "网格点显示已开启" : "网格点显示已关闭");
          break;
        }
        case "toggle-connection-lines": {
          const v132 = v0["getState"](),
            v133 = !(v132?.["ui"]?.["connectionLinesVisible"] !== false);
          (v0["setConnectionLinesVisible"](v133),
            window["dispatchEvent"](
              new CustomEvent("v2-connection-lines-visibility-changed", {
                detail: { visible: v133 },
              }),
            ),
            window["showToast"]?.(
              v133 ? "连接线显示已开启" : "连接线显示已关闭",
            ));
          break;
        }
        case "toggle-selection-related-highlight": {
          const v134 = v0["getState"](),
            v135 = !(
              v134?.["ui"]?.["selectionRelatedHighlightEnabled"] !== false
            );
          (setSelectionRelatedHighlightPref(v135, v0),
            window["showToast"]?.(
              v135 ? "关联节点高亮已开启" : "关联节点高亮已关闭",
            ));
          break;
        }
        case "toggle-video-meta": {
          const v136 = v0["getState"](),
            v137 = !(v136?.["ui"]?.["showVideoMeta"] === true);
          (setVideoMetaPref(v137, v0),
            window["showToast"]?.(
              v137 ? "视频节点信息已开启" : "视频节点信息已关闭",
            ));
          break;
        }
        case "toggle-title-follows-zoom": {
          const v138 = v0["getState"](),
            v139 = !(v138?.["ui"]?.["titleFollowsCanvasZoom"] === true);
          (setTitleFollowsCanvasZoomPref(v139, v0),
            window["showToast"]?.(
              v139 ? "标题跟随画布缩放已开启" : "标题跟随画布缩放已关闭",
            ));
          break;
        }
        case "toggle-media-node-resize": {
          const v140 = v0["getState"](),
            v141 = !(v140?.["ui"]?.["imageVideoNodeResizeEnabled"] === true);
          (setImageVideoNodeResizePref(v141, v0),
            window["showToast"]?.(
              v141 ? "图像视频节点缩放已开启" : "图像视频节点缩放已关闭",
            ));
          break;
        }
        case "toggle-prompt-box-resize": {
          const v142 = v0["getState"](),
            v143 = !(v142?.["ui"]?.["promptBoxResizeEnabled"] !== false);
          (setPromptBoxResizePref(v143, v0),
            window["showToast"]?.(
              v143 ? "提示词栏下拉已开启" : "提示词栏下拉已关闭",
            ));
          break;
        }
        case "toggle-node-avoid-overlap": {
          const v144 = !(window["v2NodeAvoidOverlap"] !== false);
          (setNodeAvoidOverlapPref(v144),
            window["showToast"]?.(
              v144 ? "新节点自动避让已开启" : "新节点自动避让已关闭",
            ));
          break;
        }
        case "reset-media-size": {
          const v145 = v0["getState"]();
          if (v30(v145)) break;
          const v146 = Array["isArray"](v145?.["selectedNodeIds"])
            ? v145["selectedNodeIds"]
            : [];
          if (v146["length"] === 0) break;
          const v147 = v146["some"]((v148) => {
            const v149 = v145?.["nodes"]?.[v148]?.["type"];
            return (
              v149 === "source-image" ||
              v149 === "ai-image" ||
              v149 === "source-video" ||
              v149 === "ai-video"
            );
          });
          if (!v147) break;
          v3("reset_source_media_size", { ids: v146 });
          break;
        }
        case "add-reference":
          v53();
          break;
        case "create-text":
          if (v0["getState"]()["matting"]?.["active"]) break;
          {
            const { width: v150, height: v151 } = v8("source-text");
            v10("source-text", v150, v151, "源文本");
          }
          break;
        case "create-comment-note": {
          if (v0["getState"]()["matting"]?.["active"]) break;
          const { width: v152, height: v153 } = v8("comment-note");
          v10("comment-note", v152, v153, "");
          break;
        }
        case "create-ai-text":
          if (v0["getState"]()["matting"]?.["active"]) break;
          {
            const v154 =
              typeof v9 === "function"
                ? v9("ai-text")
                : { width: 300, height: 300 };
            v10("ai-text", v154["width"], v154["height"], "生成文本");
          }
          break;
        case "create-ai-image":
          if (v0["getState"]()["matting"]?.["active"]) break;
          {
            const v155 =
              typeof v9 === "function"
                ? v9("ai-image")
                : { width: 288, height: 288 };
            v10("ai-image", v155["width"], v155["height"], "生成图像");
          }
          break;
        case "create-ai-video":
          if (v0["getState"]()["matting"]?.["active"]) break;
          {
            const v156 =
              typeof v9 === "function"
                ? v9("ai-video")
                : { width: 288, height: 288 };
            v10("ai-video", v156["width"], v156["height"], "生成视频");
          }
          break;
        case "create-ai-audio":
          if (v0["getState"]()["matting"]?.["active"]) break;
          {
            const v157 =
              typeof v9 === "function"
                ? v9("ai-audio")
                : { width: 288, height: 288 };
            v10("ai-audio", v157["width"], v157["height"], "生成音频");
          }
          break;
        case "create-scene-detection":
          if (v0["getState"]()["matting"]?.["active"]) break;
          v10("scene-detection", 400, 500, "场景检测");
          break;
        case "save":
          window["_openSaveDialog"]?.();
          break;
        case "open-settings": {
          toggleSettingsPanel();
          break;
        }
        case "open-canvas-projects":
          toggleSidebarSubmenu("canvas-project");
          break;
        case "open-assets":
          toggleSidebarSubmenu("assets");
          break;
        case "open-workflows":
          toggleSidebarSubmenu("workflows");
          break;
        case "open-files":
          toggleSidebarSubmenu("files");
          break;
        case "open-task-center":
          toggleSidebarSubmenu("tasks");
          break;
        case "editor-tool-brush":
        case "editor-tool-rect":
        case "editor-tool-eraser":
        case "editor-tool-bucket":
        case "editor-tool-text": {
          const v158 = v0["getState"](),
            v159 =
              v89 === "editor-tool-rect"
                ? "rect"
                : v89 === "editor-tool-eraser"
                  ? "eraser"
                  : v89 === "editor-tool-bucket"
                    ? "bucket"
                    : v89 === "editor-tool-text"
                      ? "text"
                      : "brush";
          if (v158["annotate"]?.["active"])
            v18["_setTool"]
              ? v18["_setTool"]["call"](v18, v159)
              : v0["setAnnotateState"]({ tool: v159 });
          else {
            if (v158["matting"]?.["active"]) {
              if (v159 === "rect") break;
              if (document["activeElement"]?.["tagName"] === "INPUT")
                document["activeElement"]["blur"]();
              v19["_switchTool"]?.["call"](v19, v159);
            }
          }
          break;
        }
        case "editor-clear": {
          const v160 = v0["getState"]();
          if (v160["annotate"]?.["active"]) v18["_clear"]?.["call"](v18);
          else v160["matting"]?.["active"] && v19["_clear"]?.["call"](v19);
          break;
        }
        case "escape-all": {
          if (v38()) break;
          if (v91?.["sceneState"]?.["ui"]?.["isEditing"]) {
            setPanoramaSceneEditing({
              nodeId: v91["nodeId"],
              isEditing: false,
            });
            break;
          }
          const { nodes: v161 } = v0["getState"]();
          let v162 = false;
          for (const v163 in v161) {
            v161[v163]["type"] === "storyboard" &&
              v161[v163]["isEditing"] &&
              (v0["updateNodeData"](v163, { isEditing: false }), (v162 = true));
          }
          if (v162) v6();
          const v164 = v0["getState"]()["pickConnectMode"];
          if (v164 && v164["active"])
            v0["setPickConnectMode"]({ active: false });
          (v7(),
            v18["exit"]?.({ silent: true }),
            v19["exit"]?.({ silent: true }),
            document["getElementById"]("avatarMenu")?.["classList"]["remove"](
              "open",
            ),
            document["querySelector"](".canvas-proj-dropdown")?.["classList"][
              "remove"
            ]("open"),
            document["getElementById"]("aboutOverlay") &&
              (document["getElementById"]("aboutOverlay")["style"]["display"] =
                "none"),
            document["getElementById"]("v2PickerOverlay")?.["remove"](),
            document["querySelector"](".v2-canvas-ctx-menu")?.["remove"](),
            document["querySelector"](".v2-node-picker")?.["remove"](),
            document["querySelector"](".v2-quote-menu")?.["remove"]());
          document["getElementById"]("nodeMenu") &&
            (document["getElementById"]("nodeMenu")["style"]["display"] =
              "none");
          document["getElementById"]("nodeModal") &&
            (document["getElementById"]("nodeModal")["style"]["display"] =
              "none");
          document["getElementById"]("settingsOverlay") &&
            (document["getElementById"]("settingsOverlay")["style"]["display"] =
              "none");
          document["getElementById"]("imageViewerOverlay") &&
            (document["getElementById"]("imageViewerOverlay")["style"][
              "display"
            ] = "none");
          (v0["setAlignPanelVisible"](false), v0["clearSelection"]());
          break;
        }
        case "panorama-scene-camera-1":
        case "panorama-scene-camera-2":
        case "panorama-scene-camera-3":
        case "panorama-scene-camera-4":
        case "panorama-scene-camera-5":
        case "panorama-scene-camera-6":
        case "panorama-scene-camera-7":
        case "panorama-scene-camera-8":
        case "panorama-scene-camera-9":
        case "panorama-scene-camera-0": {
          if (
            !v91?.["sceneState"]?.["ui"]?.["isEditing"] ||
            v91?.["supportsCamera"] !== true
          )
            break;
          const v165 = v89["slice"](-1),
            v166 = v165 === "0" ? 10 : Number(v165);
          v64({ nodeId: v91["nodeId"], mode: "activate", slot: v166 });
          break;
        }
        case "panorama-scene-camera-save-1":
        case "panorama-scene-camera-save-2":
        case "panorama-scene-camera-save-3":
        case "panorama-scene-camera-save-4":
        case "panorama-scene-camera-save-5":
        case "panorama-scene-camera-save-6":
        case "panorama-scene-camera-save-7":
        case "panorama-scene-camera-save-8":
        case "panorama-scene-camera-save-9":
        case "panorama-scene-camera-save-0": {
          if (
            !v91?.["sceneState"]?.["ui"]?.["isEditing"] ||
            v91?.["supportsCamera"] !== true
          )
            break;
          const v167 = v89["slice"](-1),
            v168 = v167 === "0" ? 10 : Number(v167);
          v64({ nodeId: v91["nodeId"], mode: "save", slot: v168 });
          break;
        }
      }
    });
  }
  function v169() {
    window["addEventListener"]("v2:canvas-paste-request", (v170) => {
      v16(v170?.["detail"] || {});
    });
  }
  function v171() {
    (v169(), v77(), v17?.(v1));
  }
  return {
    bindAll: v171,
    triggerSelectedNodeToolbarAction: v41,
    triggerSelectedNodeReferenceButton: v53,
    exitActiveFeatureModes: v38,
  };
}
