import appStore from "../core/stores/appStore.js";
import { saveOutputBlob } from "../modules/project.js";
import { generateId } from "../core/math.js";
import {
  buildStoryboardCropRect,
  buildStoryboardGridTemplate,
  detachStoryboardCellSourceContext,
  getStoryboardCellPixelBounds,
  getStoryboardCellIndexAtWorldPoint,
  isFrozenStoryboardDisplayCell,
  isStoryboardCellEmpty,
  normalizeEmptyStoryboardCell,
  normalizeStoryboardGridGap,
  resolveStoryboardCellSourceIndex,
  resolveStoryboardGridLayout,
  resolveStoryboardCellPreviewSrc,
  STORYBOARD_GRID_GAP_MAX,
} from "../core/storyboardCellUtils.js";
import { commit } from "../modules/history.js";
import {
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from "../services/fileService.js";
export class StoryboardNode {
  constructor(v0) {
    try {
      this["_data"] = structuredClone(v0);
    } catch (v1) {
      this["_data"] = JSON["parse"](JSON["stringify"](v0));
    }
    (!Array["isArray"](this["_data"]["cells"]) && (this["_data"]["cells"] = []),
      (this["id"] = this["_data"]["id"]),
      (this["el"] = document["createElement"]("div")),
      (this["el"]["className"] = "v2-node-component storyboard-node"),
      (this["el"]["id"] = "sb-node-" + this["id"]),
      (this["_isEditing"] = !!this["_data"]["isEditing"]),
      (this["_isCollapsed"] = !!this["_data"]["isCollapsed"]),
      (this["_isComposing"] = false),
      (this["_isCustomGridEditing"] = false),
      (this["_isCustomGridConfirming"] = false),
      (this["_customGridDraft"] = null),
      (this["_customGridDraftGap"] = null),
      (this["_customGridDrag"] = null),
      (this["_customGridKeydownHandler"] = null),
      (this["_customGridRefreshVersion"] = 0),
      (this["_customGridFrozenCellStyles"] = null),
      (this["_backdropEl"] = null),
      this["_isEditing"]
        ? this["el"]["classList"]["add"]("is-editing-mode")
        : this["el"]["classList"]["remove"]("is-editing-mode"));
  }
  ["_createToolbarSvg"](v2, v3, v4) {
    const v5 = document["createElementNS"]("http://www.w3.org/2000/svg", "svg");
    return (
      v5["setAttribute"]("width", String(v2)),
      v5["setAttribute"]("height", String(v3)),
      v5["setAttribute"]("viewBox", "0\x200\x2024\x2024"),
      v5["setAttribute"]("fill", "none"),
      v5["setAttribute"]("stroke", "currentColor"),
      v5["setAttribute"]("stroke-width", String(v4)),
      v5
    );
  }
  ["_createCustomGridIcon"]() {
    const v6 = this["_createToolbarSvg"](16, 16, 2),
      v7 = document["createElementNS"]("http://www.w3.org/2000/svg", "rect");
    (v7["setAttribute"]("x", "4"),
      v7["setAttribute"]("y", "4"),
      v7["setAttribute"]("width", "16"),
      v7["setAttribute"]("height", "16"),
      v7["setAttribute"]("rx", "2"));
    const v8 = document["createElementNS"](
      "http://www.w3.org/2000/svg",
      "path",
    );
    v8["setAttribute"]("d", "M10 4v16");
    const v9 = document["createElementNS"](
      "http://www.w3.org/2000/svg",
      "path",
    );
    v9["setAttribute"]("d", "M4 14h16");
    const v10 = document["createElementNS"](
      "http://www.w3.org/2000/svg",
      "circle",
    );
    (v10["setAttribute"]("cx", "10"),
      v10["setAttribute"]("cy", "9"),
      v10["setAttribute"]("r", "1.6"));
    const v11 = document["createElementNS"](
      "http://www.w3.org/2000/svg",
      "circle",
    );
    return (
      v11["setAttribute"]("cx", "15"),
      v11["setAttribute"]("cy", "14"),
      v11["setAttribute"]("r", "1.6"),
      v6["appendChild"](v7),
      v6["appendChild"](v8),
      v6["appendChild"](v9),
      v6["appendChild"](v10),
      v6["appendChild"](v11),
      v6
    );
  }
  ["_setSplitLinesButtonContent"](v12) {
    if (!v12) return;
    v12["replaceChildren"](this["_createCustomGridIcon"]());
  }
  ["mount"]() {
    const v13 = this["el"],
      v14 = this["_data"];
    v13["replaceChildren"]();
    const v15 = "http://www.w3.org/2000/svg",
      v16 = (v17, v18, v19) => {
        const v20 = document["createElementNS"](v15, "svg");
        return (
          v20["setAttribute"]("width", String(v17)),
          v20["setAttribute"]("height", String(v18)),
          v20["setAttribute"]("viewBox", "0 0 24 24"),
          v20["setAttribute"]("fill", "none"),
          v20["setAttribute"]("stroke", "currentColor"),
          v20["setAttribute"]("stroke-width", String(v19)),
          v20
        );
      },
      v21 = document["createElement"]("div");
    ((v21["className"] = "node-floating-toolbar storyboard-toolbar"),
      Object["assign"](v21["style"], {
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }));
    const v22 = document["createElement"]("button");
    ((v22["className"] = "ftb-btn act-aspect"),
      v22["setAttribute"]("aria-label", "切换比例"));
    const v23 = v16(14, 14, 2),
      v24 = document["createElementNS"](v15, "rect");
    (v24["setAttribute"]("x", "3"),
      v24["setAttribute"]("y", "3"),
      v24["setAttribute"]("width", "18"),
      v24["setAttribute"]("height", "18"),
      v24["setAttribute"]("rx", "2"),
      v24["setAttribute"]("ry", "2"),
      v23["appendChild"](v24));
    const v25 = document["createElement"]("span");
    v25["textContent"] = "比例 " + (v14["aspectRatio"] || "1:1");
    const v26 = v16(10, 10, 2.5);
    (v26["classList"]["add"]("ftb-chevron"),
      v26["setAttribute"]("stroke", "var(--text-primary)"),
      (v26["style"]["marginLeft"] = "2px"),
      (v26["style"]["transition"] =
        "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"));
    const v27 = document["createElementNS"](v15, "polyline");
    (v27["setAttribute"]("points", "6 9 12 15 18 9"),
      v26["appendChild"](v27),
      v22["appendChild"](v23),
      v22["appendChild"](v25),
      v22["appendChild"](v26));
    const v28 = document["createElement"]("button");
    ((v28["className"] = "ftb-btn\x20act-grid"),
      v28["setAttribute"]("aria-label", "切换网格"));
    const v29 = v16(14, 14, 2),
      v30 = document["createElementNS"](v15, "rect");
    (v30["setAttribute"]("x", "3"),
      v30["setAttribute"]("y", "3"),
      v30["setAttribute"]("width", "7"),
      v30["setAttribute"]("height", "7"));
    const v31 = document["createElementNS"](v15, "rect");
    (v31["setAttribute"]("x", "14"),
      v31["setAttribute"]("y", "3"),
      v31["setAttribute"]("width", "7"),
      v31["setAttribute"]("height", "7"));
    const v32 = document["createElementNS"](v15, "rect");
    (v32["setAttribute"]("x", "14"),
      v32["setAttribute"]("y", "14"),
      v32["setAttribute"]("width", "7"),
      v32["setAttribute"]("height", "7"));
    const v33 = document["createElementNS"](v15, "rect");
    (v33["setAttribute"]("x", "3"),
      v33["setAttribute"]("y", "14"),
      v33["setAttribute"]("width", "7"),
      v33["setAttribute"]("height", "7"),
      v29["appendChild"](v30),
      v29["appendChild"](v31),
      v29["appendChild"](v32),
      v29["appendChild"](v33));
    const v34 = document["createElement"]("span");
    v34["textContent"] =
      "网格 " + (v14["cols"] || 2) + "×" + (v14["rows"] || 2);
    const v35 = v26["cloneNode"](true);
    (v28["appendChild"](v29), v28["appendChild"](v34), v28["appendChild"](v35));
    const v36 = document["createElement"]("div");
    ((v36["className"] = "ftb-divider"),
      Object["assign"](v36["style"], {
        width: "1px",
        height: "14px",
        background: "var(--white-10)",
        margin: "0\x204px",
      }));
    const v37 = document["createElement"]("button");
    ((v37["className"] =
      "ftb-btn icon-only storyboard-split-lines-trigger act-split-lines"),
      (v37["dataset"]["tooltip"] = "调整分割线"),
      v37["setAttribute"]("aria-label", "调整分割线"),
      this["_setSplitLinesButtonContent"](v37));
    const v38 = document["createElement"]("button");
    v38["className"] = "ftb-btn icon-only act-edit";
    if (this["_isEditing"]) v38["classList"]["add"]("active");
    ((v38["dataset"]["tooltip"] = this["_isEditing"]
      ? "退出编辑分镜"
      : "编辑分镜"),
      v38["setAttribute"](
        "aria-label",
        this["_isEditing"] ? "退出编辑分镜" : "编辑分镜",
      ));
    const v39 = v16(16, 16, 2),
      v40 = document["createElementNS"](v15, "path");
    v40["setAttribute"]("d", "M12 20h9");
    const v41 = document["createElementNS"](v15, "path");
    (v41["setAttribute"](
      "d",
      "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
    ),
      v39["appendChild"](v40),
      v39["appendChild"](v41),
      v38["appendChild"](v39));
    const v42 = document["createElement"]("button");
    ((v42["className"] = "ftb-btn\x20icon-only\x20act-compose"),
      (v42["dataset"]["tooltip"] = "合成"));
    const v43 = v16(16, 16, 2),
      v44 = document["createElementNS"](v15, "path");
    (v44["setAttribute"]("d", "M12 3v18m9-9H3"),
      v43["appendChild"](v44),
      v42["appendChild"](v43));
    const v45 = document["createElement"]("button");
    ((v45["className"] = "ftb-btn icon-only act-clear"),
      (v45["dataset"]["tooltip"] = "清空"));
    const v46 = v16(16, 16, 2),
      v47 = document["createElementNS"](v15, "polyline");
    v47["setAttribute"]("points", "3 6 5 6 21 6");
    const v48 = document["createElementNS"](v15, "path");
    (v48["setAttribute"](
      "d",
      "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
    ),
      v46["appendChild"](v47),
      v46["appendChild"](v48),
      v45["appendChild"](v46));
    const v49 = document["createElement"]("button");
    ((v49["className"] = "ftb-btn icon-only act-collapse"),
      (v49["dataset"]["tooltip"] = this["_isCollapsed"] ? "展开" : "折叠"));
    const v50 = v16(16, 16, 2),
      v51 = document["createElementNS"](v15, "polyline");
    (v51["setAttribute"](
      "points",
      this["_isCollapsed"]
        ? "6 9 12 15 18 9"
        : "18\x2015\x2012\x209\x206\x2015",
    ),
      v50["appendChild"](v51),
      v49["appendChild"](v50),
      v21["appendChild"](v22),
      v21["appendChild"](v28),
      v21["appendChild"](v36),
      v21["appendChild"](v37),
      v21["appendChild"](v38),
      v21["appendChild"](v42),
      v21["appendChild"](v45),
      v21["appendChild"](v49),
      v13["appendChild"](v21));
    const v52 = document["createElement"]("div");
    ((v52["className"] = "storyboard-scale-wrap"),
      Object["assign"](v52["style"], {
        width: "100%",
        height: "100%",
        position: "relative",
        transformOrigin: "top left",
        transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }));
    const v53 = document["createElement"]("div");
    ((v53["className"] = "storyboard-container"),
      Object["assign"](v53["style"], {
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        borderRadius: "16px",
        border: "1.5px solid var(--stroke-10)",
        background: "var(--bg-node)",
        boxShadow: "var(--shadow-surface)",
      }));
    const v54 = document["createElement"]("div");
    ((v54["className"] = "cells-grid"),
      Object["assign"](v54["style"], {
        position: "absolute",
        inset: "0",
        display: "grid",
        gap: "0px",
        background: "transparent",
        zIndex: "1",
      }));
    const v55 = this["_getBaseGridLayout"](v14);
    ((v54["style"]["gridTemplateColumns"] = buildStoryboardGridTemplate(
      v55["columns"],
      v55["cols"],
    )),
      (v54["style"]["gridTemplateRows"] = buildStoryboardGridTemplate(
        v55["rowTracks"],
        v55["rows"],
      )));
    const v56 = v14["cells"] || [],
      v57 = [];
    for (let v58 = 0; v58 < v56["length"]; v58++) {
      const v59 = document["createElement"]("div");
      ((v59["className"] = "sb-cell"),
        (v59["id"] = "cell-" + this["id"] + "-" + v58),
        (v59["dataset"]["index"] = String(v58)),
        Object["assign"](v59["style"], {
          position: "relative",
          background: "var(--bg-node)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }));
      const v60 = document["createElement"]("div");
      ((v60["className"] = "cell-content-wrap"),
        Object["assign"](v60["style"], {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }),
        v60["appendChild"](this["_createCellContentNode"](v56[v58], v58)));
      const v61 = document["createElement"]("div");
      ((v61["className"] = "cell-overlay"),
        Object["assign"](v61["style"], {
          position: "absolute",
          inset: "0",
          pointerEvents: "none",
          border: "1.5px\x20solid\x20transparent",
          transition: "all 0.2s",
        }),
        v59["appendChild"](v60),
        v59["appendChild"](v61),
        v54["appendChild"](v59),
        v57["push"](v59),
        this["_applyCellCropStyles"](v59, v56[v58], v58));
    }
    v53["appendChild"](v54);
    if (this["_isCollapsed"]) {
      const v62 = document["createElement"]("div");
      ((v62["className"] = "sb-collapsed-badge"),
        Object["assign"](v62["style"], {
          position: "absolute",
          top: "8px",
          right: "8px",
          background: "var(--black-60)",
          backdropFilter: "blur(4px)",
          borderRadius: "10px",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          zIndex: "10",
          transition: "background 0.2s",
        }));
      const v63 = v16(20, 20, 2);
      v63["style"]["color"] = "var(--text-secondary)";
      const v64 = document["createElementNS"](v15, "rect");
      (v64["setAttribute"]("x", "3"),
        v64["setAttribute"]("y", "3"),
        v64["setAttribute"]("width", "7"),
        v64["setAttribute"]("height", "7"));
      const v65 = document["createElementNS"](v15, "rect");
      (v65["setAttribute"]("x", "14"),
        v65["setAttribute"]("y", "3"),
        v65["setAttribute"]("width", "7"),
        v65["setAttribute"]("height", "7"));
      const v66 = document["createElementNS"](v15, "rect");
      (v66["setAttribute"]("x", "14"),
        v66["setAttribute"]("y", "14"),
        v66["setAttribute"]("width", "7"),
        v66["setAttribute"]("height", "7"));
      const v67 = document["createElementNS"](v15, "rect");
      (v67["setAttribute"]("x", "3"),
        v67["setAttribute"]("y", "14"),
        v67["setAttribute"]("width", "7"),
        v67["setAttribute"]("height", "7"),
        v63["appendChild"](v64),
        v63["appendChild"](v65),
        v63["appendChild"](v66),
        v63["appendChild"](v67));
      const v68 = document["createElement"]("span");
      (Object["assign"](v68["style"], {
        color: "var(--text-primary)",
        fontSize: "15px",
        fontWeight: "600",
      }),
        (v68["textContent"] = String((v14["cols"] || 2) * (v14["rows"] || 2))),
        v62["appendChild"](v63),
        v62["appendChild"](v68),
        v53["appendChild"](v62));
    }
    (v52["appendChild"](v53), v13["appendChild"](v52));
    const v69 = document["createElement"]("div");
    return (
      (v69["className"] = "v2-storyboard-hint"),
      Object["assign"](v69["style"], {
        position: "absolute",
        top: "calc(100%\x20+\x2018px)",
        left: "50%",
        transform: "translateX(-50%) scale(var(--zoom-inv, 1))",
        color: "var(--text-primary)",
        fontSize: "16px",
        fontWeight: "500",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        transition: "all 0.2s",
        zIndex: "100",
        textShadow: "0 2px 4px var(--black-50)",
      }),
      (v69["textContent"] = this["_isEditing"]
        ? "拖拽单元格进行互换，或拖出生成新图"
        : "双击进入分镜编辑"),
      v13["appendChild"](v69),
      (this["_container"] = v53),
      (this["_grid"] = v54),
      (this["_cellEls"] = v57),
      this["_syncBackdropImage"](),
      this["_syncCustomGridOverlay"](),
      this["_updateGridGapButtonState"](),
      this["_updateCustomGridButtonState"](),
      this["_initEvents"](),
      this["_ensureThumbnails"](),
      v13
    );
  }
  async ["_ensureThumbnails"]() {
    const v70 = this["_data"]["cells"] || [];
    let v71 = false;
    const v72 = [...v70];
    for (let v73 = 0; v73 < v72["length"]; v73++) {
      const v74 = v72[v73];
      if (!v74) continue;
      const v75 = v74["thumbUrl"];
      typeof v75 === "string" &&
        v75["startsWith"]("data:image/") &&
        ((v72[v73] = { ...v74, thumbUrl: "" }), (v71 = true));
    }
    v71 && appStore["updateNodeData"](this["id"], { cells: v72 });
  }
  ["_getCellFinalUrl"](v76) {
    return resolveStoryboardCellPreviewSrc(v76);
  }
  ["_isCellEmpty"](v77) {
    return isStoryboardCellEmpty(v77);
  }
  ["_normalizeLocalImageUrl"](v78) {
    const v79 = typeof v78 === "string" ? v78["trim"]() : "";
    if (!v79) return "";
    if (
      v79["startsWith"]("/") ||
      v79["startsWith"]("http://") ||
      v79["startsWith"]("https://") ||
      v79["startsWith"]("blob:") ||
      v79["startsWith"]("data:")
    )
      return v79;
    return "/" + v79;
  }
  ["_getCellSourceImageUrl"](v80) {
    if (!v80 || typeof v80 !== "object") return "";
    if (this["_isCellEmpty"](v80)) return "";
    return (
      this["_normalizeLocalImageUrl"](v80["sourceLocalPath"]) ||
      this["_normalizeLocalImageUrl"](v80["sourceUrl"])
    );
  }
  ["_getCellLiveSourceImageUrl"](v81) {
    if (isFrozenStoryboardDisplayCell(v81)) return "";
    const v82 = this["_getCellSourceImageUrl"](v81);
    if (v82) return v82;
    if (!v81 || typeof v81 !== "object" || this["_isCellEmpty"](v81)) return "";
    if (v81["storyboardPiece"] === true)
      return this["_getStoryboardPuzzleSourceImageUrl"]();
    return "";
  }
  ["_getCellSourceDisplayUrl"](v83) {
    if (isFrozenStoryboardDisplayCell(v83)) return "";
    const v84 = this["_getCellLiveSourceImageUrl"](v83);
    if (!v84 || !v83 || typeof v83 !== "object") return "";
    if (this["_isCellEmpty"](v83)) return "";
    const v85 = !!this["_getCellSourceImageUrl"](v83);
    if (
      v85 ||
      v83["storyboardSourceCrop"] === true ||
      v83["storyboardPiece"] === true ||
      v83["storyboardLockedCell"] === true
    )
      return v84;
    return "";
  }
  ["_getCellDisplayImageUrl"](v86) {
    return (
      this["_getCellSourceDisplayUrl"](v86) || this["_getCellFinalUrl"](v86)
    );
  }
  ["_getCellSourceIndex"](v87, v88) {
    return resolveStoryboardCellSourceIndex(v87, v88, this["_data"]);
  }
  ["_getStoryboardPuzzleSourceImageUrl"]() {
    const v89 =
      this["_normalizeLocalImageUrl"](
        this["_data"]?.["storyboardSourceLocalPath"],
      ) ||
      this["_normalizeLocalImageUrl"](this["_data"]?.["storyboardSourceUrl"]) ||
      this["_normalizeLocalImageUrl"](
        this["_data"]?.["storyboardBackdropLocalPath"],
      ) ||
      this["_normalizeLocalImageUrl"](
        this["_data"]?.["storyboardBackdropUrl"],
      ) ||
      this["_normalizeLocalImageUrl"](this["_data"]?.["sourceLocalPath"]) ||
      this["_normalizeLocalImageUrl"](this["_data"]?.["sourceUrl"]);
    if (v89) return v89;
    const v90 = Array["isArray"](this["_data"]?.["cells"])
      ? this["_data"]["cells"]
      : [];
    for (const v91 of v90) {
      const v92 =
        this["_normalizeLocalImageUrl"](v91?.["sourceLocalPath"]) ||
        this["_normalizeLocalImageUrl"](v91?.["sourceUrl"]);
      if (v92) return v92;
    }
    return "";
  }
  ["_getCellResidualImageUrl"](v93) {
    if (!v93 || typeof v93 !== "object") return "";
    return (
      this["_normalizeLocalImageUrl"](v93["residualImageLocalPath"]) ||
      this["_normalizeLocalImageUrl"](v93["residualImageUrl"])
    );
  }
  ["_getStoryboardBackdropImageUrl"]() {
    const v94 =
      this["_normalizeLocalImageUrl"](
        this["_data"]?.["storyboardBackdropLocalPath"],
      ) ||
      this["_normalizeLocalImageUrl"](
        this["_data"]?.["storyboardBackdropUrl"],
      ) ||
      this["_normalizeLocalImageUrl"](
        this["_data"]?.["storyboardSourceLocalPath"],
      ) ||
      this["_normalizeLocalImageUrl"](this["_data"]?.["storyboardSourceUrl"]) ||
      this["_normalizeLocalImageUrl"](this["_data"]?.["sourceLocalPath"]) ||
      this["_normalizeLocalImageUrl"](this["_data"]?.["sourceUrl"]);
    if (v94) return v94;
    const v95 = Array["isArray"](this["_data"]?.["cells"])
      ? this["_data"]["cells"]
      : [];
    for (const v96 of v95) {
      const v97 =
        this["_normalizeLocalImageUrl"](v96?.["sourceLocalPath"]) ||
        this["_normalizeLocalImageUrl"](v96?.["sourceUrl"]);
      if (v97) return v97;
    }
    const v98 =
      this["_normalizeLocalImageUrl"](this["_data"]?.["localPath"]) ||
      this["_normalizeLocalImageUrl"](this["_data"]?.["imageUrl"]) ||
      this["_normalizeLocalImageUrl"](this["_data"]?.["src"]);
    if (v98) return v98;
    for (const v99 of v95) {
      const v100 = this["_getCellResidualImageUrl"](v99);
      if (v100) return v100;
    }
    return "";
  }
  ["_createBackdropImage"](v101 = this["_getStoryboardBackdropImageUrl"]()) {
    if (!v101) return null;
    const v102 = document["createElement"]("img");
    return (
      (v102["className"] = "storyboard-source-backdrop"),
      v102["setAttribute"]("src", v101),
      v102["setAttribute"]("aria-hidden", "true"),
      (v102["decoding"] = "async"),
      (v102["loading"] = "eager"),
      Object["assign"](v102["style"], {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        objectFit: "fill",
        opacity: "1",
        pointerEvents: "none",
        zIndex: "0",
      }),
      v102
    );
  }
  ["_syncBackdropImage"](v103 = this["_container"]) {
    if (!v103) return;
    const v104 = this["_getStoryboardBackdropImageUrl"]();
    let v105 =
      this["_backdropEl"] ||
      v103["querySelector"]?.(".storyboard-source-backdrop") ||
      null;
    if (!v104) {
      (v105?.["remove"]?.(), (this["_backdropEl"] = null));
      return;
    }
    if (!v105) {
      v105 = this["_createBackdropImage"](v104);
      const v106 =
        this["_grid"] && this["_grid"]["parentNode"] === v103
          ? this["_grid"]
          : v103["firstElementChild"] || null;
      typeof v103["insertBefore"] === "function" && v106
        ? v103["insertBefore"](v105, v106)
        : v103["appendChild"](v105);
    } else
      v105["getAttribute"]("src") !== v104 && v105["setAttribute"]("src", v104);
    this["_backdropEl"] = v105;
  }
  ["_getGridGap"]() {
    return normalizeStoryboardGridGap(this["_data"]?.["gridGap"]);
  }
  ["_loadStoryboardSourceImage"](v107) {
    if (typeof Image !== "function")
      return Promise["reject"](new Error("Image API unavailable"));
    return new Promise((v108, v109) => {
      const v110 = new Image();
      ((v110["crossOrigin"] = "anonymous"),
        (v110["onload"] = () => v108(v110)),
        (v110["onerror"] = () => v109(new Error("源图加载失败"))),
        (v110["src"] = v107));
    });
  }
  ["_isLoadedImageElement"](v111) {
    if (!v111) return false;
    if ("complete" in v111 && v111["complete"] !== true) return false;
    const v112 =
      "naturalWidth" in v111 ||
      "naturalHeight" in v111 ||
      "width" in v111 ||
      "height" in v111;
    if (!v112) return true;
    const v113 = Math["trunc"](
        Number(v111["naturalWidth"] || v111["width"]) || 0,
      ),
      v114 = Math["trunc"](
        Number(v111["naturalHeight"] || v111["height"]) || 0,
      );
    return v113 > 0 && v114 > 0;
  }
  ["_getImageElementSource"](v115) {
    return String(
      v115?.["getAttribute"]?.("src") ||
        v115?.["currentSrc"] ||
        v115?.["src"] ||
        "",
    )["trim"]();
  }
  ["_isExpectedImageSource"](v116, v117 = "") {
    const v118 = String(v117 || "")["trim"]();
    if (!v118) return true;
    const v119 = this["_getImageElementSource"](v116);
    return !v119 || v119 === v118;
  }
  ["_getLoadedSourceImageForCell"](v120, v121 = "") {
    const v122 = this["_cellEls"]?.[v120] || null,
      v123 = [
        ...(v122?.["querySelectorAll"]?.(".storyboard-cell-source-cache") ||
          []),
        ...(v122?.["querySelectorAll"]?.(".storyboard-cell-img--source-crop") ||
          []),
        this["_backdropEl"],
      ]["filter"](Boolean);
    for (const v124 of v123) {
      if (
        this["_isLoadedImageElement"](v124) &&
        this["_isExpectedImageSource"](v124, v121)
      )
        return v124;
    }
    return null;
  }
  ["_buildMaterializedCellCrop"](v125, v126, v127) {
    if (!v127 || typeof document === "undefined") return null;
    const v128 = Math["max"](
        1,
        Math["trunc"](Number(v127["naturalWidth"]) || 0),
      ),
      v129 = Math["max"](1, Math["trunc"](Number(v127["naturalHeight"]) || 0));
    if (v128 <= 0 || v129 <= 0) return null;
    const v130 = this["_getActiveGridNode"](),
      v131 = this["_getCellSourceIndex"](v125, v126),
      v132 = buildStoryboardCropRect(v130, v131, {
        width: v128,
        height: v129,
        inset: 0,
      });
    if (!v132 || v132["sw"] <= 0 || v132["sh"] <= 0) return null;
    const v133 = v132["sx"],
      v134 = v132["sy"],
      v135 = v132["sw"],
      v136 = v132["sh"],
      v137 = document["createElement"]("canvas");
    if (!v137 || typeof v137["getContext"] !== "function") return null;
    ((v137["width"] = v135), (v137["height"] = v136));
    const v138 = v137["getContext"]("2d", { alpha: false });
    if (!v138 || typeof v138["drawImage"] !== "function") return null;
    try {
      ((v138["imageSmoothingEnabled"] = true),
        (v138["imageSmoothingQuality"] = "high"),
        v138["drawImage"](v127, v133, v134, v135, v136, 0, 0, v135, v136));
      const v139 = v137["toDataURL"]("image/jpeg", 0.9);
      if (!String(v139 || "")["startsWith"]("data:image/")) return null;
      return {
        capturePreviewUrl: v139,
        fileName:
          v125?.["fileName"] ||
          "storyboard_piece_" + generateId("storyboard-cell") + ".jpg",
        originalWidth: v135,
        originalHeight: v136,
        imageWidth: v135,
        imageHeight: v136,
        w: v135,
        h: v136,
      };
    } catch (v140) {
      return null;
    }
  }
  ["_materializeSourceBackedCellsForEditing"]() {
    const v141 = Array["isArray"](this["_data"]["cells"])
      ? this["_data"]["cells"]
      : [];
    let v142 = false;
    const v143 = v141["map"]((v144, v145) => {
      const v146 = this["_getCellSourceImageUrl"](v144);
      if (!v146 || this["_isCellEmpty"](v144)) return v144;
      const v147 = this["_getLoadedSourceImageForCell"](v145, v146),
        v148 = this["_buildMaterializedCellCrop"](v144, v145, v147),
        v149 = !!(
          v148?.["capturePreviewUrl"] || this["_getCellFinalUrl"](v144)
        );
      if (!v149) return v144;
      return (
        (v142 = true),
        detachStoryboardCellSourceContext(
          {
            ...(v144 && typeof v144 === "object" ? v144 : {}),
            ...(v148 || {}),
            localPath: v148?.["capturePreviewUrl"]
              ? null
              : v144["localPath"] || null,
            originalLocalPath: v148?.["capturePreviewUrl"]
              ? null
              : v144["originalLocalPath"] || null,
            displayLocalPath: v148?.["capturePreviewUrl"]
              ? ""
              : v144["displayLocalPath"] || "",
            thumbLocalPath: v148?.["capturePreviewUrl"]
              ? ""
              : v144["thumbLocalPath"] || "",
            thumbUrl: v148?.["capturePreviewUrl"] ? "" : v144["thumbUrl"] || "",
            thumbId: null,
            storyboardSourceIndex: this["_getCellSourceIndex"](v144, v145),
            storyboardLockedCell: true,
            isEmpty: false,
          },
          { locked: true, extracted: v144["storyboardExtractedCell"] === true },
        )
      );
    });
    return v142 ? v143 : null;
  }
  ["_getCellCommitSourceUrl"](v150, v151 = this["_data"]) {
    if (isFrozenStoryboardDisplayCell(v150)) return "";
    const v152 =
      this["_normalizeLocalImageUrl"](v150?.["sourceLocalPath"]) ||
      this["_normalizeLocalImageUrl"](v150?.["sourceUrl"]);
    if (v152) return v152;
    if (!v150 || this["_isCellEmpty"](v150)) return "";
    if (
      v150["storyboardPiece"] === true ||
      v150["storyboardLockedCell"] === true
    )
      return (
        this["_normalizeLocalImageUrl"](v151?.["storyboardSourceLocalPath"]) ||
        this["_normalizeLocalImageUrl"](v151?.["storyboardSourceUrl"]) ||
        this["_normalizeLocalImageUrl"](
          v151?.["storyboardBackdropLocalPath"],
        ) ||
        this["_normalizeLocalImageUrl"](v151?.["storyboardBackdropUrl"]) ||
        this["_normalizeLocalImageUrl"](v151?.["sourceLocalPath"]) ||
        this["_normalizeLocalImageUrl"](v151?.["sourceUrl"])
      );
    return "";
  }
  ["_isCellSourceCropRequired"](v153) {
    if (!v153 || typeof v153 !== "object" || this["_isCellEmpty"](v153))
      return false;
    if (isFrozenStoryboardDisplayCell(v153)) return false;
    return (
      v153["storyboardPiece"] === true ||
      v153["storyboardLockedCell"] === true ||
      v153["storyboardSourceCrop"] === true
    );
  }
  async ["_resolveCommitSourceImage"](v154, v155, v156) {
    const v157 = String(v155 || "")["trim"]();
    if (!v157) return null;
    const v158 = v156["get"](v157);
    if (v158) {
      if (typeof v158["then"] === "function") {
        const v159 = await v158;
        if (v159) v156["set"](v157, v159);
        return v159 || null;
      }
      return v158;
    }
    const v160 = this["_getLoadedSourceImageForCell"](v154, v157);
    if (v160) return (v156["set"](v157, v160), v160);
    const v161 = this["_loadStoryboardSourceImage"](v157)["catch"](() => null);
    v156["set"](v157, v161);
    const v162 = await v161;
    if (v162) return (v156["set"](v157, v162), v162);
    return (v156["delete"](v157), null);
  }
  async ["_cropStoryboardCellFromSource"](v163, v164, v165, v166) {
    const v167 = this["_getCellCommitSourceUrl"](v163, v165);
    if (!v167) {
      if (this["_isCellSourceCropRequired"](v163))
        return { cell: v163, ok: false, skipped: false };
      return { cell: v163, ok: true, skipped: true };
    }
    let v168 = await this["_resolveCommitSourceImage"](v164, v167, v166);
    if (!v168) return { cell: v163, ok: false, skipped: false };
    const v169 = resolveStoryboardCellSourceIndex(v163, v164, v165),
      v170 = buildStoryboardCropRect(v165, v169, {
        width: v168["naturalWidth"],
        height: v168["naturalHeight"],
        inset: 0,
      });
    if (!v170 || v170["sw"] <= 0 || v170["sh"] <= 0)
      return { cell: v163, ok: false, skipped: false };
    const v171 = document["createElement"]("canvas");
    if (!v171 || typeof v171["getContext"] !== "function")
      return { cell: v163, ok: false, skipped: false };
    ((v171["width"] = v170["sw"]), (v171["height"] = v170["sh"]));
    const v172 = v171["getContext"]("2d", { alpha: false });
    if (!v172 || typeof v172["drawImage"] !== "function")
      return { cell: v163, ok: false, skipped: false };
    ((v172["imageSmoothingEnabled"] = true),
      (v172["imageSmoothingQuality"] = "high"),
      v172["drawImage"](
        v168,
        v170["sx"],
        v170["sy"],
        v170["sw"],
        v170["sh"],
        0,
        0,
        v170["sw"],
        v170["sh"],
      ));
    if (typeof v171["toDataURL"] !== "function")
      return { cell: v163, ok: false, skipped: false };
    const v173 = v171["toDataURL"]("image/jpeg", 0.9);
    if (!String(v173 || "")["startsWith"]("data:image/"))
      return { cell: v163, ok: false, skipped: false };
    const v174 = detachStoryboardCellSourceContext(
      {
        ...(v163 && typeof v163 === "object" ? v163 : {}),
        url: "",
        localPath: null,
        originalLocalPath: null,
        displayLocalPath: "",
        thumbLocalPath: "",
        thumbUrl: "",
        thumbId: null,
        capturePreviewUrl: v173,
        fileName: "storyboard_cell_" + generateId("storyboard-cell") + ".jpg",
        originalWidth: v170["sw"],
        originalHeight: v170["sh"],
        imageWidth: v170["sw"],
        imageHeight: v170["sh"],
        w: v170["sw"],
        h: v170["sh"],
        storyboardPiece: true,
        storyboardSourceIndex: v169,
        storyboardLockedCell: true,
        storyboardExtractedCell: false,
        isEmpty: false,
      },
      { locked: true, extracted: false },
    );
    return { cell: v174, ok: true, skipped: false };
  }
  async ["_materializeCellsForConfirmedGrid"](v175, v176, v177 = null) {
    const v178 = Array["isArray"](v177)
      ? v177
      : Array["isArray"](this["_data"]["cells"])
        ? this["_data"]["cells"]
        : [];
    if (!Array["isArray"](v178) || v178["length"] <= 0)
      return { cells: v178, partialFailure: false };
    const v179 = { ...this["_data"], gridLayout: v175, gridGap: v176 },
      v180 = new Map(),
      v181 = [],
      v182 = [...v178];
    for (let v183 = 0; v183 < v178["length"]; v183 += 1) {
      const v184 = v178[v183];
      if (this["_isCellEmpty"](v184)) continue;
      const v185 = await this["_cropStoryboardCellFromSource"](
        v184,
        v183,
        v179,
        v180,
      );
      if (!v185["ok"] && !v185["skipped"]) {
        v181["push"](v183);
        continue;
      }
      v182[v183] = v185["cell"];
    }
    const v186 = v181["length"] === 0;
    return { ok: v186, cells: v186 ? v182 : v178, failedIndices: v181 };
  }
  async ["_refreshSourceBackedCellsForLayout"](v187, v188 = null) {
    const { cells: v189 } = await this["_materializeCellsForConfirmedGrid"](
      v187,
      this["_getGridGap"](),
      v188,
    );
    return v189;
  }
  ["_isSourceCropCell"](v190) {
    return !!this["_getCellSourceImageUrl"](v190);
  }
  ["_applyDefaultCellImageStyles"](v191, v192, v193) {
    const v194 = String(v192 || "");
    (v191["getAttribute"]("src") !== v194 && v191["setAttribute"]("src", v194),
      v191["classList"]["remove"]("storyboard-cell-img--source-crop"),
      (v191["style"]["position"] = ""),
      (v191["style"]["inset"] = ""),
      (v191["style"]["left"] = ""),
      (v191["style"]["top"] = ""),
      (v191["style"]["display"] = ""),
      (v191["style"]["width"] = "100%"),
      (v191["style"]["height"] = "100%"),
      (v191["style"]["objectFit"] =
        v193?.["storyboardExtractedCell"] === true ||
        v193?.["storyboardLockedCell"] === true
          ? "fill"
          : "cover"));
  }
  ["_getCellDisplaySourceSize"](v195, v196 = null) {
    const v197 = Math["trunc"](
        Number(v196?.["naturalWidth"] || v196?.["width"]) || 0,
      ),
      v198 = Math["trunc"](
        Number(v196?.["naturalHeight"] || v196?.["height"]) || 0,
      );
    return {
      width: Math["max"](
        1,
        v197 ||
          Math["trunc"](
            Number(v195?.["sourceWidth"]) ||
              Number(this["_data"]?.["storyboardSourceWidth"]) ||
              Number(this["_data"]?.["sourceWidth"]) ||
              Number(this["_data"]?.["width"]) ||
              1,
          ),
      ),
      height: Math["max"](
        1,
        v198 ||
          Math["trunc"](
            Number(v195?.["sourceHeight"]) ||
              Number(this["_data"]?.["storyboardSourceHeight"]) ||
              Number(this["_data"]?.["sourceHeight"]) ||
              Number(this["_data"]?.["height"]) ||
              1,
          ),
      ),
    };
  }
  ["_applySourceCropImageStyles"](v199, v200, v201, v202) {
    if (!v199 || !v202) return;
    v199["getAttribute"]("src") !== v202 && v199["setAttribute"]("src", v202);
    (v199["classList"]["add"]("storyboard-cell-img--source-crop"),
      (v199["style"]["display"] = "block"),
      (v199["style"]["position"] = "absolute"),
      (v199["style"]["inset"] = ""),
      (v199["style"]["objectFit"] = "fill"),
      (v199["style"]["pointerEvents"] = "none"));
    const v203 = this["_getCellDisplaySourceSize"](v200, v199),
      v204 = this["_getCellSourceIndex"](v200, v201),
      v205 = buildStoryboardCropRect(this["_data"], v204, {
        width: v203["width"],
        height: v203["height"],
        inset: 0,
      });
    if (!v205 || v205["sw"] <= 0 || v205["sh"] <= 0) {
      ((v199["style"]["left"] = "0"),
        (v199["style"]["top"] = "0"),
        (v199["style"]["width"] = "100%"),
        (v199["style"]["height"] = "100%"));
      return;
    }
    ((v199["style"]["left"] = -(v205["sx"] / v205["sw"]) * 100 + "%"),
      (v199["style"]["top"] = -(v205["sy"] / v205["sh"]) * 100 + "%"),
      (v199["style"]["width"] = (v203["width"] / v205["sw"]) * 100 + "%"),
      (v199["style"]["height"] = (v203["height"] / v205["sh"]) * 100 + "%"),
      !this["_isLoadedImageElement"](v199) &&
        v199["addEventListener"]?.(
          "load",
          () => this["_applySourceCropImageStyles"](v199, v200, v201, v202),
          { once: true },
        ));
  }
  ["_applyCellCropStyles"](v206, v207, v208) {
    if (!v206) return;
    this["_applyEmptyResidualStyles"](v206, v207, v208);
    const v209 = Array["from"](
      v206["querySelectorAll"]?.(".storyboard-cell-img") || [],
    )["find"](
      (v210) =>
        !v210["classList"]?.["contains"]?.("storyboard-empty-residual-img") &&
        !v210["classList"]?.["contains"]?.("storyboard-cell-source-cache"),
    );
    if (!v209) return;
    const v211 = this["_getCellSourceDisplayUrl"](v207);
    if (v211) {
      (this["_applySourceCropImageStyles"](v209, v207, v208, v211),
        this["_syncSourceCacheImage"](v206, v207, v211));
      return;
    }
    const v212 = this["_getCellLiveSourceImageUrl"](v207);
    v212
      ? this["_syncSourceCacheImage"](v206, v207, v212)
      : this["_syncSourceCacheImage"](v206, v207);
    const v213 = this["_getCellFinalUrl"](v207);
    this["_applyDefaultCellImageStyles"](v209, v213, v207);
  }
  ["_syncSourceCacheImage"](v214, v215, v216 = "", v217 = null) {
    const v218 = v214?.["querySelector"]?.(".cell-content-wrap") || null;
    if (!v218) return;
    const v219 =
        v218["querySelector"]?.(".storyboard-cell-source-cache") || null,
      v220 = String(v216 || this["_getCellSourceImageUrl"](v215) || "")[
        "trim"
      ]();
    if (!v220) {
      v219?.["remove"]?.();
      return;
    }
    const v221 = (v222) => {
      if (typeof v217 !== "function" || !v222) return;
      if (this["_isLoadedImageElement"](v222)) return;
      v222["addEventListener"]?.("load", v217, { once: true });
    };
    if (v219) {
      v219["getAttribute"]("src") !== v220 && v219["setAttribute"]("src", v220);
      v221(v219);
      return;
    }
    const v223 = document["createElement"]("img");
    ((v223["className"] =
      "storyboard-cell-source-cache storyboard-cell-img--source-crop"),
      v223["setAttribute"]("src", v220),
      v223["setAttribute"]("aria-hidden", "true"),
      (v223["decoding"] = "async"),
      (v223["loading"] = "eager"),
      v218["appendChild"](v223),
      v221(v223));
  }
  ["_applyAllCellCropStyles"]() {
    if (!this["_cellEls"]) return;
    const v224 = this["_data"]["cells"] || [];
    this["_cellEls"]["forEach"]((v225, v226) => {
      this["_applyCellCropStyles"](v225, v224[v226], v226);
    });
  }
  ["_getActiveGridNode"]() {
    const v227 = this["_getActiveGridLayout"]();
    return {
      ...this["_data"],
      cols: v227["cols"],
      rows: v227["rows"],
      gridGap: this["_getGridGap"](),
      gridLayout: { columns: v227["columns"], rows: v227["rowTracks"] },
    };
  }
  ["_getBaseGridLayout"](v228 = this["_data"]) {
    const v229 = Math["max"](1, Number(v228?.["cols"]) || 1),
      v230 = Math["max"](1, Number(v228?.["rows"]) || 1);
    return {
      cols: v229,
      rows: v230,
      columns: Array(v229)["fill"](1),
      rowTracks: Array(v230)["fill"](1),
    };
  }
  ["_getCellLayoutBounds"](v231) {
    return getStoryboardCellPixelBounds(this["_getActiveGridNode"](), v231, {
      width: this["_data"]["width"],
      height: this["_data"]["height"],
      inset: 0,
    });
  }
  ["_getBaseCellLayoutBounds"](v232) {
    return getStoryboardCellPixelBounds(
      { ...this["_data"], gridGap: 0, gridLayout: null },
      v232,
      {
        width: this["_data"]["width"],
        height: this["_data"]["height"],
        inset: 0,
        gap: 0,
      },
    );
  }
  ["_getCellCutoutRect"](v233) {
    const v234 = this["_getBaseCellLayoutBounds"](v233),
      v235 = this["_getCellLayoutBounds"](v233);
    if (!v234 || !v235 || v234["width"] <= 0 || v234["height"] <= 0)
      return null;
    const v236 = Math["max"](0, v235["x0"] - v234["x0"]),
      v237 = Math["max"](0, v235["y0"] - v234["y0"]),
      v238 = Math["min"](v234["width"], v235["x1"] - v234["x0"]),
      v239 = Math["min"](v234["height"], v235["y1"] - v234["y0"]);
    return {
      x: v236,
      y: v237,
      width: Math["max"](0, v238 - v236),
      height: Math["max"](0, v239 - v237),
    };
  }
  ["_applyEmptyCutoutStyles"](v240, v241) {
    if (!v240) return;
    const v242 = v240["querySelector"]?.(".storyboard-empty-cutout") || null;
    if (!v242) return;
    ((v242["style"]["display"] = "flex"),
      (v242["style"]["position"] = "absolute"),
      (v242["style"]["left"] = "0"),
      (v242["style"]["top"] = "0"),
      (v242["style"]["width"] = "100%"),
      (v242["style"]["height"] = "100%"));
  }
  ["_applyEmptyResidualImageStyles"](v243, v244, v245) {
    const v246 = v243?.["querySelector"]?.(".storyboard-empty-residual-img");
    if (!v246) return;
    const v247 = String(v244?.["residualImageMode"] || "");
    if (v247 !== "source") {
      ((v246["style"]["position"] = "absolute"),
        (v246["style"]["inset"] = "0"),
        (v246["style"]["left"] = "0"),
        (v246["style"]["top"] = "0"),
        (v246["style"]["width"] = "100%"),
        (v246["style"]["height"] = "100%"),
        (v246["style"]["objectFit"] = "cover"));
      return;
    }
    const v248 = this["_getCellLayoutBounds"](v245),
      v249 = Math["max"](
        1,
        Number(v244?.["residualImageWidth"]) ||
          Number(v244?.["sourceWidth"]) ||
          Number(this["_data"]?.["sourceWidth"]) ||
          1,
      ),
      v250 = Math["max"](
        1,
        Number(v244?.["residualImageHeight"]) ||
          Number(v244?.["sourceHeight"]) ||
          Number(this["_data"]?.["sourceHeight"]) ||
          1,
      );
    if (!v248 || v248["width"] <= 0 || v248["height"] <= 0) {
      ((v246["style"]["position"] = "absolute"),
        (v246["style"]["inset"] = "0"),
        (v246["style"]["width"] = "100%"),
        (v246["style"]["height"] = "100%"),
        (v246["style"]["objectFit"] = "cover"));
      return;
    }
    const v251 = v249 / Math["max"](1, Number(this["_data"]["width"]) || 1),
      v252 = v250 / Math["max"](1, Number(this["_data"]["height"]) || 1),
      v253 = v248["x0"] * v251,
      v254 = v248["y0"] * v252,
      v255 = Math["max"](1, v248["width"] * v251),
      v256 = Math["max"](1, v248["height"] * v252);
    ((v246["style"]["position"] = "absolute"),
      (v246["style"]["inset"] = ""),
      (v246["style"]["left"] = -(v253 / v255) * 100 + "%"),
      (v246["style"]["top"] = -(v254 / v256) * 100 + "%"),
      (v246["style"]["width"] = (v249 / v255) * 100 + "%"),
      (v246["style"]["height"] = (v250 / v256) * 100 + "%"),
      (v246["style"]["objectFit"] = "fill"));
  }
  ["_applyEmptyResidualStyles"](v257, v258, v259) {
    this["_applyEmptyResidualImageStyles"](v257, v258, v259);
    const v260 =
      v257?.["querySelector"]?.(".storyboard-empty-residual") || null;
    if (!v260) return;
    this["_applyEmptyCutoutStyles"](v260, v259);
  }
  ["_applyExtractedCellImageStyles"](v261, v262) {
    ((v261["style"]["display"] = "block"),
      (v261["style"]["position"] = ""),
      (v261["style"]["inset"] = ""),
      (v261["style"]["left"] = ""),
      (v261["style"]["top"] = ""),
      (v261["style"]["width"] = "100%"),
      (v261["style"]["height"] = "100%"),
      (v261["style"]["objectFit"] = "cover"));
  }
  ["_applyCellLayoutStyles"](v263, v264) {
    if (!v263) return;
    const v265 = this["_customGridFrozenCellStyles"]?.[v264];
    if (this["_isCustomGridEditing"] && v265) {
      ((v263["style"]["display"] = v265["display"]),
        (v263["style"]["position"] = v265["position"]),
        (v263["style"]["left"] = v265["left"]),
        (v263["style"]["top"] = v265["top"]),
        (v263["style"]["width"] = v265["width"]),
        (v263["style"]["height"] = v265["height"]));
      return;
    }
    const v266 = this["_getCellLayoutBounds"](v264);
    if (!v266 || v266["width"] <= 0 || v266["height"] <= 0) {
      v263["style"]["display"] = "none";
      return;
    }
    ((v263["style"]["display"] = "flex"),
      (v263["style"]["position"] = "absolute"),
      (v263["style"]["left"] = v266["x0"] + "px"),
      (v263["style"]["top"] = v266["y0"] + "px"),
      (v263["style"]["width"] = v266["width"] + "px"),
      (v263["style"]["height"] = v266["height"] + "px"));
  }
  ["_applyAllCellLayoutStyles"]() {
    if (!this["_cellEls"]) return;
    this["_cellEls"]["forEach"]((v267, v268) => {
      this["_applyCellLayoutStyles"](v267, v268);
    });
  }
  ["_captureCustomGridCellVisualState"]() {
    if (!this["_cellEls"]) {
      this["_customGridFrozenCellStyles"] = null;
      return;
    }
    this["_customGridFrozenCellStyles"] = this["_cellEls"]["map"]((v269) => ({
      display: v269["style"]["display"] || "",
      position: v269["style"]["position"] || "",
      left: v269["style"]["left"] || "",
      top: v269["style"]["top"] || "",
      width: v269["style"]["width"] || "",
      height: v269["style"]["height"] || "",
    }));
  }
  ["_restoreCustomGridCellVisualState"]() {
    if (!this["_cellEls"] || !this["_customGridFrozenCellStyles"]) return;
    this["_cellEls"]["forEach"]((v270, v271) => {
      this["_applyCellLayoutStyles"](v270, v271);
    });
  }
  ["_createCellImageElement"](v272) {
    const v273 = document["createElement"]("img");
    return (
      (v273["className"] = "storyboard-cell-img"),
      v273["setAttribute"]("src", v272),
      (v273["decoding"] = "async"),
      (v273["loading"] = "eager"),
      (v273["style"]["width"] = "100%"),
      (v273["style"]["height"] = "100%"),
      (v273["style"]["objectFit"] = "cover"),
      (v273["style"]["pointerEvents"] = "none"),
      v273["addEventListener"]("error", () => {
        const v274 = v273["parentElement"];
        if (!v274) return;
        v274["replaceChildren"]();
        const v275 = document["createElement"]("div");
        ((v275["style"]["color"] = "var(--text-muted)"),
          (v275["style"]["fontSize"] = "10px"),
          (v275["textContent"] = "加载失败"),
          v274["appendChild"](v275));
      }),
      v273
    );
  }
  ["_createCellContentNode"](v276, v277 = 0) {
    if (!v276) return document["createTextNode"]("");
    const v278 = this["_getCellDisplayImageUrl"](v276),
      v279 = !v278;
    if (v279) {
      const v280 = this["_getCellResidualImageUrl"](v276);
      if (v280) {
        const v281 = document["createElement"]("div");
        v281["className"] = "storyboard-empty-residual";
        const v282 = document["createElement"]("img");
        ((v282["className"] = "storyboard-empty-residual-img"),
          v282["setAttribute"]("src", v280),
          (v282["decoding"] = "async"),
          (v282["loading"] = "eager"),
          (v282["style"]["pointerEvents"] = "none"),
          v281["appendChild"](v282));
        const v283 = document["createElement"]("div");
        ((v283["className"] = "empty-placeholder storyboard-empty-cutout"),
          (v283["style"]["color"] = "var(--white-10)"));
        const v284 = "http://www.w3.org/2000/svg",
          v285 = document["createElementNS"](v284, "svg");
        (v285["setAttribute"]("width", "24"),
          v285["setAttribute"]("height", "24"),
          v285["setAttribute"]("viewBox", "0\x200\x2024\x2024"),
          v285["setAttribute"]("fill", "none"),
          v285["setAttribute"]("stroke", "currentColor"),
          v285["setAttribute"]("stroke-width", "1.5"));
        const v286 = document["createElementNS"](v284, "path");
        return (
          v286["setAttribute"]("d", "M12\x203v18m9-9H3"),
          v285["appendChild"](v286),
          v283["appendChild"](v285),
          v281["appendChild"](v283),
          v281
        );
      }
      const v287 = document["createElement"]("div");
      ((v287["className"] = "empty-placeholder"),
        (v287["style"]["color"] = "var(--white-10)"));
      const v288 = "http://www.w3.org/2000/svg",
        v289 = document["createElementNS"](v288, "svg");
      (v289["setAttribute"]("width", "24"),
        v289["setAttribute"]("height", "24"),
        v289["setAttribute"]("viewBox", "0\x200\x2024\x2024"),
        v289["setAttribute"]("fill", "none"),
        v289["setAttribute"]("stroke", "currentColor"),
        v289["setAttribute"]("stroke-width", "1.5"));
      const v290 = document["createElementNS"](v288, "path");
      return (
        v290["setAttribute"]("d", "M12\x203v18m9-9H3"),
        v289["appendChild"](v290),
        v287["appendChild"](v289),
        v287
      );
    }
    const v291 = this["_createCellImageElement"](v278);
    if (
      v276["storyboardExtractedCell"] === true ||
      v276["storyboardLockedCell"] === true
    ) {
      const v292 = document["createElement"]("div");
      v292["className"] = "storyboard-extracted-cell-content";
      const v293 = this["_getCellResidualImageUrl"](v276);
      if (v293) {
        const v294 = document["createElement"]("img");
        ((v294["className"] = "storyboard-empty-residual-img"),
          v294["setAttribute"]("src", v293),
          (v294["decoding"] = "async"),
          (v294["loading"] = "eager"),
          (v294["style"]["pointerEvents"] = "none"),
          v292["appendChild"](v294));
      }
      return (
        v291["classList"]["add"]("storyboard-cell-img--extracted-cutout"),
        v292["appendChild"](v291),
        v292
      );
    }
    return v291;
  }
  ["_buildReusableCellImageMap"]() {
    const v295 = new Map();
    if (!this["_cellEls"]) return v295;
    return (
      this["_cellEls"]["forEach"]((v296) => {
        const v297 = v296?.["querySelector"]?.(".cell-content-wrap"),
          v298 = v297?.["querySelector"]?.(".storyboard-cell-img");
        if (!v298 || v298["tagName"] !== "IMG") return;
        const v299 = v298["getAttribute"]("src") || "";
        if (v299 && !v295["has"](v299)) v295["set"](v299, v298);
      }),
      v295
    );
  }
  ["_cloneReusableCellImage"](v300, v301) {
    const v302 = v301?.["get"]?.(v300);
    if (!v302 || v302["tagName"] !== "IMG") return null;
    const v303 = v302["cloneNode"](false);
    return (
      v303["classList"]["remove"]("is-cell-preloading", "is-cell-ready"),
      v303["classList"]["add"]("storyboard-cell-img"),
      v303["setAttribute"]("src", v300),
      (v303["decoding"] = "async"),
      (v303["loading"] = "eager"),
      (v303["style"]["width"] = "100%"),
      (v303["style"]["height"] = "100%"),
      (v303["style"]["objectFit"] = "cover"),
      (v303["style"]["pointerEvents"] = "none"),
      (v303["style"]["position"] = ""),
      (v303["style"]["inset"] = ""),
      (v303["style"]["opacity"] = ""),
      (v303["style"]["transition"] = ""),
      v303
    );
  }
  ["_renderCells"]() {}
  ["_updateCellDOM"](v304, v305, v306 = null) {
    if (!v305) return;
    const v307 = Number(v304?.["dataset"]?.["index"]) || 0,
      v308 = () => this["_applyCellCropStyles"](v304, v305, v307),
      v309 = v304["querySelector"](".cell-content-wrap");
    if (!v309) return;
    const v310 = this["_getCellDisplayImageUrl"](v305),
      v311 = !v310,
      v312 = v309["firstElementChild"];
    if (v311) {
      const v313 = !!this["_getCellResidualImageUrl"](v305),
        v314 =
          v312?.["classList"]?.["contains"]("storyboard-empty-residual") ===
          true,
        v315 =
          v312?.["classList"]?.["contains"]("empty-placeholder") === true &&
          !v314;
      if ((v313 && v314) || (!v313 && v315)) {
        v308();
        return;
      }
    } else {
      if (
        v312 &&
        v312["tagName"] === "IMG" &&
        v312["getAttribute"]("src") === v310
      ) {
        v308();
        return;
      }
    }
    if (!v311 && v312 && v312["tagName"] === "IMG") {
      const v316 = this["_cloneReusableCellImage"](v310, v306);
      if (v316) {
        (delete v309["__storyboardPendingSrc"],
          v309["replaceChildren"](v316),
          v308());
        return;
      }
    }
    const v317 = this["_createCellContentNode"](v305);
    if (
      !v311 &&
      v312 &&
      v312["tagName"] === "IMG" &&
      v317?.["tagName"] === "IMG"
    ) {
      const v318 = v310;
      ((v309["__storyboardPendingSrc"] = v318),
        v309["querySelectorAll"](".storyboard-cell-img.is-cell-preloading")[
          "forEach"
        ]((v319) => v319["remove"]()));
      const v320 = () => {
        if (v309["__storyboardPendingSrc"] !== v318) return;
        (v317["classList"]["remove"]("is-cell-preloading", "is-cell-ready"),
          v309["replaceChildren"](v317),
          v308(),
          delete v309["__storyboardPendingSrc"]);
      };
      if (v317["complete"] && v317["naturalWidth"] > 0) {
        v320();
        return;
      }
      let v321 = false;
      const v322 = () => {
        if (v321) return;
        if (v309["__storyboardPendingSrc"] !== v318) return;
        ((v321 = true),
          v317["classList"]["add"]("is-cell-ready"),
          setTimeout(v320, 60));
      };
      (v317["classList"]["add"]("is-cell-preloading"),
        v317["addEventListener"]("load", v322, { once: true }),
        v309["appendChild"](v317));
      v317["complete"] && v317["naturalWidth"] > 0 && v322();
      return;
    }
    (delete v309["__storyboardPendingSrc"],
      v309["replaceChildren"](),
      v309["appendChild"](v317),
      v308());
  }
  ["_initEvents"]() {
    const v323 = this["el"],
      v324 = v323["querySelector"](".act-aspect"),
      v325 = v323["querySelector"](".act-grid"),
      v326 = v323["querySelector"](".act-split-lines"),
      v327 = v323["querySelector"](".act-edit"),
      v328 = v323["querySelector"](".act-compose"),
      v329 = v323["querySelector"](".act-clear"),
      v330 = v323["querySelector"](".act-collapse");
    [v324, v325, v326, v327, v328, v329, v330]["forEach"]((v331) => {
      if (!v331) return;
      (v331["addEventListener"]("pointerdown", (v332) =>
        v332["stopPropagation"](),
      ),
        v331["addEventListener"]("dblclick", (v333) =>
          v333["stopPropagation"](),
        ));
    });
    v326 &&
      (v326["onclick"] = async (v334) => {
        (v334["stopPropagation"](),
          v334["target"]["closest"]("button")?.["blur"]());
        if (this["_isCustomGridEditing"]) {
          await this["_confirmCustomGridEdit"]();
          if (!this["_isCustomGridEditing"]) this["_closeMenu"]();
        } else
          this["_enterCustomGridEdit"]() && this["_showSplitLinesMenu"](v326);
      });
    v327 &&
      (v327["onclick"] = (v335) => {
        (v335["stopPropagation"](),
          v335["target"]["closest"]("button")?.["blur"](),
          this["_toggleEdit"](!this["_isEditing"]));
      });
    this["_container"] &&
      (this["_container"]["ondblclick"] = (v336) => {
        (v336["stopPropagation"](), this["_toggleEdit"](true));
      });
    v324 &&
      (v324["onclick"] = (v337) => {
        (v337["stopPropagation"](),
          v337["target"]["closest"]("button")?.["blur"]());
        if (this["_isCustomGridEditing"]) return;
        this["_activeMenu"] === "aspect"
          ? this["_closeMenu"]()
          : this["_showAspectMenu"](v324);
      });
    v325 &&
      (v325["onclick"] = (v338) => {
        (v338["stopPropagation"](),
          v338["target"]["closest"]("button")?.["blur"]());
        if (this["_isCustomGridEditing"]) return;
        this["_activeMenu"] === "grid"
          ? this["_closeMenu"]()
          : this["_showGridMenu"](v325);
      });
    v328 &&
      (v328["onclick"] = async (v339) => {
        (v339["stopPropagation"](),
          v339["target"]["closest"]("button")?.["blur"]());
        if (this["_isComposing"]) return;
        await this["_compose"]();
      });
    v329 &&
      (v329["onclick"] = (v340) => {
        (v340["stopPropagation"](),
          v340["target"]["closest"]("button")?.["blur"]());
        const v341 = this["_data"]["cells"]["map"]((v342) =>
          normalizeEmptyStoryboardCell(v342),
        );
        appStore["updateNodeData"](this["id"], { cells: v341 });
      });
    v330 &&
      (v330["onclick"] = (v343) => {
        (v343["stopPropagation"](),
          v343["target"]["closest"]("button")?.["blur"](),
          this["_toggleCollapse"](!this["_isCollapsed"]));
      });
    const v344 = this["el"]["querySelector"](".sb-collapsed-badge");
    v344 &&
      (v344["addEventListener"]("click", (v345) => {
        (v345["stopPropagation"](), this["_toggleCollapse"](false));
      }),
      v344["addEventListener"]("mouseenter", () => {
        v344["style"]["background"] = "var(--black-80)";
      }),
      v344["addEventListener"]("mouseleave", () => {
        v344["style"]["background"] = "var(--black-60)";
      }));
  }
  ["_getActiveGridLayout"]() {
    return resolveStoryboardGridLayout(this["_data"]);
  }
  ["_getCustomGridOverlayLayout"]() {
    if (this["_isCustomGridEditing"] && this["_customGridDraft"])
      return resolveStoryboardGridLayout({
        cols: this["_data"]["cols"],
        rows: this["_data"]["rows"],
        gridLayout: this["_customGridDraft"],
      });
    return resolveStoryboardGridLayout(this["_data"]);
  }
  ["_getCustomGridDraftGap"]() {
    const v346 = Number(this["_customGridDraftGap"]);
    if (Number["isFinite"](v346))
      return normalizeStoryboardGridGap(v346, this["_getGridGap"]());
    return this["_getGridGap"]();
  }
  ["_applyGridLayout"]() {
    if (this["_isCustomGridEditing"] && this["_customGridFrozenCellStyles"]) {
      this["_restoreCustomGridCellVisualState"]();
      return;
    }
    const v347 = this["_grid"] || this["el"]["querySelector"](".cells-grid");
    if (!v347) return;
    const v348 = this["_getBaseGridLayout"]();
    ((v347["style"]["gridTemplateColumns"] = buildStoryboardGridTemplate(
      v348["columns"],
      v348["cols"],
    )),
      (v347["style"]["gridTemplateRows"] = buildStoryboardGridTemplate(
        v348["rowTracks"],
        v348["rows"],
      )),
      (v347["style"]["gap"] = "0px"),
      this["_applyAllCellLayoutStyles"](),
      this["_applyAllCellCropStyles"]());
  }
  ["_isTrackListEqual"](v349) {
    return (v349 || [])["every"](
      (v350) => Math["abs"](Number(v350) - 1) < 0.0001,
    );
  }
  ["_hasCustomGridLayout"](v351 = resolveStoryboardGridLayout(this["_data"])) {
    return (
      !this["_isTrackListEqual"](v351["columns"]) ||
      !this["_isTrackListEqual"](v351["rowTracks"])
    );
  }
  ["_areTrackListsEqual"](v352 = [], v353 = []) {
    if (
      !Array["isArray"](v352) ||
      !Array["isArray"](v353) ||
      v352["length"] !== v353["length"]
    )
      return false;
    return v352["every"](
      (v354, v355) => Math["abs"](Number(v354) - Number(v353[v355])) < 0.0001,
    );
  }
  ["_areCellsDisplayEqual"](v356 = [], v357 = []) {
    if (!Array["isArray"](v356) || !Array["isArray"](v357)) return false;
    if (v356["length"] !== v357["length"]) return false;
    return v356["every"]((v358, v359) => {
      const v360 = v357[v359];
      return (
        this["_isCellEmpty"](v358) === this["_isCellEmpty"](v360) &&
        this["_getCellDisplayImageUrl"](v358) ===
          this["_getCellDisplayImageUrl"](v360) &&
        this["_getCellSourceImageUrl"](v358) ===
          this["_getCellSourceImageUrl"](v360) &&
        this["_getCellLiveSourceImageUrl"](v358) ===
          this["_getCellLiveSourceImageUrl"](v360) &&
        v358?.["storyboardSourceIndex"] === v360?.["storyboardSourceIndex"] &&
        v358?.["storyboardExtractedCell"] ===
          v360?.["storyboardExtractedCell"] &&
        v358?.["storyboardLockedCell"] === v360?.["storyboardLockedCell"] &&
        v358?.["storyboardSourceCrop"] === v360?.["storyboardSourceCrop"] &&
        v358?.["sourceWidth"] === v360?.["sourceWidth"] &&
        v358?.["sourceHeight"] === v360?.["sourceHeight"] &&
        v358?.["residualImageLocalPath"] === v360?.["residualImageLocalPath"] &&
        v358?.["residualImageUrl"] === v360?.["residualImageUrl"]
      );
    });
  }
  ["_isEditingOnlyDisplayUpdate"](v361 = {}, v362 = {}) {
    if (v361?.["isEditing"] === v362?.["isEditing"]) return false;
    const v363 = [
      "aspectRatio",
      "cols",
      "rows",
      "width",
      "height",
      "gridGap",
      "isCollapsed",
    ];
    if (v363["some"]((v364) => v361?.[v364] !== v362?.[v364])) return false;
    const v365 = resolveStoryboardGridLayout(v361),
      v366 = resolveStoryboardGridLayout(v362);
    return (
      this["_areTrackListsEqual"](v365["columns"], v366["columns"]) &&
      this["_areTrackListsEqual"](v365["rowTracks"], v366["rowTracks"]) &&
      this["_areCellsDisplayEqual"](v361["cells"] || [], v362["cells"] || [])
    );
  }
  ["_isSameGridLayout"](v367, v368) {
    const v369 = resolveStoryboardGridLayout(v367),
      v370 = resolveStoryboardGridLayout({
        cols: v367?.["cols"],
        rows: v367?.["rows"],
        gridLayout: v368,
      });
    return (
      this["_areTrackListsEqual"](v369["columns"], v370["columns"]) &&
      this["_areTrackListsEqual"](v369["rowTracks"], v370["rowTracks"])
    );
  }
  ["_refreshSourceBackedCellsForLayoutInBackground"](v371, v372) {
    if (
      typeof Image !== "function" &&
      this["_refreshSourceBackedCellsForLayout"] ===
        StoryboardNode["prototype"]["_refreshSourceBackedCellsForLayout"]
    )
      return;
    if (
      !Array["isArray"](v372) ||
      !v372["some"]((v373) => !this["_isCellEmpty"](v373)) ||
      !this["_getStoryboardPuzzleSourceImageUrl"]()
    )
      return;
    const v374 = ++this["_customGridRefreshVersion"];
    this["_refreshSourceBackedCellsForLayout"](v371, v372)
      ["then"]((v375) => {
        if (!v375 || v374 !== this["_customGridRefreshVersion"]) return;
        const v376 =
            typeof appStore["getStateRaw"] === "function"
              ? appStore["getStateRaw"]()
              : appStore["getState"](),
          v377 = v376?.["nodes"]?.[this["id"]];
        if (!v377 || !this["_isSameGridLayout"](v377, v371)) return;
        const v378 = Array["isArray"](v377["cells"]) ? v377["cells"] : [],
          v379 = v378["map"]((v380, v381) => {
            const v382 = v372[v381],
              v383 = v375[v381];
            if (!v380 || !v382 || !v383) return v380;
            if (v380["id"] !== v382["id"]) return v380;
            if (this["_isCellEmpty"](v380)) return v380;
            return { ...v380, ...v383 };
          });
        appStore["updateNodeData"](this["id"], { cells: v379 });
      })
      ["catch"]((v384) => {
        (console["error"](
          "[Storyboard] Custom grid crop refresh failed:",
          v384,
        ),
          typeof window !== "undefined" &&
            window["showToast"]?.(
              "自定义分割已保存，但部分格子刷新失败",
              "warning",
            ));
      });
  }
  ["_shouldShowCustomGridOverlay"](v385 = this["_getActiveGridLayout"]()) {
    if (this["_isCustomGridEditing"]) return true;
    return v385["cols"] > 1 || v385["rows"] > 1;
  }
  ["_syncCustomGridOverlay"]({ applyLayout: applyLayout = true } = {}) {
    const v386 = this["_getCustomGridOverlayLayout"]();
    if (applyLayout) this["_applyGridLayout"]();
    else
      this["_isCustomGridEditing"] &&
        this["_customGridFrozenCellStyles"] &&
        this["_restoreCustomGridCellVisualState"]();
    this["_shouldShowCustomGridOverlay"](v386)
      ? this["_renderCustomGridHandles"]({
          editable: this["_isCustomGridEditing"],
          layout: v386,
        })
      : this["_removeCustomGridHandles"]();
  }
  ["_updateCustomGridButtonState"]() {
    const v387 = this["el"]["querySelector"](".act-split-lines");
    if (!v387) return;
    (v387["classList"]["toggle"]("active", this["_isCustomGridEditing"]),
      v387["classList"]["remove"]("is-confirm"),
      (v387["disabled"] = this["_isCustomGridConfirming"]),
      (v387["dataset"]["tooltip"] = this["_isCustomGridConfirming"]
        ? "正在应用"
        : this["_isCustomGridEditing"]
          ? "完成调整"
          : "调整分割线"),
      v387["setAttribute"](
        "aria-label",
        this["_isCustomGridConfirming"]
          ? "正在应用分割线"
          : this["_isCustomGridEditing"]
            ? "完成调整分割线"
            : "调整分割线",
      ),
      this["_setSplitLinesButtonContent"](v387));
  }
  ["_updateGridGapButtonState"]() {
    const v388 = this["el"]["querySelector"](".act-split-lines");
    if (!v388) return;
    if (this["_isCustomGridEditing"]) return;
    ((v388["dataset"]["tooltip"] = "调整分割线"),
      v388["setAttribute"]("aria-label", "调整分割线"));
  }
  ["_setCustomGridHint"](v389) {
    const v390 = this["el"]["querySelector"](".v2-storyboard-hint");
    if (!v390) return;
    if (v389) {
      v390["textContent"] = "拖动分割线调整裁剪，按 Esc 取消";
      return;
    }
    v390["textContent"] = this["_isEditing"]
      ? "拖拽单元格进行互换，或拖出生成新图"
      : "双击进入分镜编辑";
  }
  ["_enterCustomGridEdit"]() {
    if (this["_isCollapsed"] || this["_isCustomGridConfirming"]) return false;
    this["_closeMenu"]();
    if (this["_isEditing"]) this["_toggleEdit"](false);
    const v391 = resolveStoryboardGridLayout(this["_data"]);
    return (
      (this["_isCustomGridEditing"] = true),
      (this["_customGridDraftGap"] = this["_getGridGap"]()),
      (this["_customGridDraft"] = {
        columns: [...v391["columns"]],
        rows: [...v391["rowTracks"]],
      }),
      this["_captureCustomGridCellVisualState"](),
      this["el"]["classList"]["add"]("is-custom-grid-mode"),
      this["_bindCustomGridKeyboard"](),
      this["_syncCustomGridOverlay"]({ applyLayout: false }),
      this["_updateCustomGridButtonState"](),
      this["_setCustomGridHint"](true),
      true
    );
  }
  async ["_confirmCustomGridEdit"]() {
    if (!this["_isCustomGridEditing"] || this["_isCustomGridConfirming"])
      return;
    ((this["_isCustomGridConfirming"] = true),
      this["_updateCustomGridButtonState"]());
    const v392 = this["_getNormalizedCustomGridDraft"](),
      v393 = this["_getCustomGridDraftGap"]();
    try {
      const v394 = { gridGap: v393, gridLayout: v392 };
      ((this["_data"] = { ...this["_data"], ...v394 }),
        appStore["updateNodeData"](this["id"], v394),
        this["_exitCustomGridEdit"]());
    } finally {
      this["_isCustomGridEditing"] &&
        ((this["_isCustomGridConfirming"] = false),
        this["_updateCustomGridButtonState"]());
    }
  }
  ["_cancelCustomGridEdit"]() {
    if (!this["_isCustomGridEditing"] || this["_isCustomGridConfirming"])
      return;
    (this["_exitCustomGridEdit"](), this["_closeMenu"]());
  }
  ["_isSplitLinesMenuMounted"]() {
    return (
      this["_activeMenu"] === "split-lines" &&
      !!this["_menuEl"] &&
      this["_menuEl"]["classList"]?.["contains"]("storyboard-split-lines-menu")
    );
  }
  ["_showSplitLinesMenu"](v395) {
    if (!v395) return;
    (this["_closeMenu"]({ force: true }),
      (this["_activeMenu"] = "split-lines"),
      v395["classList"]["add"]("active"));
    const v396 = document["createElement"]("div");
    v396["className"] =
      "v2-canvas-ctx-menu v2-sb-dropdown storyboard-split-lines-menu";
    const v397 = document["createElement"]("div");
    v397["className"] = "storyboard-grid-gap-row";
    const v398 = document["createElement"]("span");
    ((v398["className"] = "storyboard-grid-gap-label"),
      (v398["textContent"] = "线间距"));
    const v399 = document["createElement"]("span");
    v399["className"] = "storyboard-grid-gap-readout";
    const v400 = document["createElement"]("div");
    v400["className"] = "storyboard-grid-gap-control";
    const v401 = document["createElement"]("input");
    ((v401["type"] = "range"),
      (v401["min"] = "0"),
      (v401["max"] = String(STORYBOARD_GRID_GAP_MAX)),
      (v401["step"] = "1"),
      (v401["value"] = String(this["_getCustomGridDraftGap"]())),
      (v399["textContent"] = v401["value"] + "px"),
      v401["addEventListener"]("input", (v402) => {
        v402["stopPropagation"]?.();
        const v403 = normalizeStoryboardGridGap(
          v402["target"]?.["value"],
          this["_getCustomGridDraftGap"](),
        );
        ((v401["value"] = String(v403)),
          (v399["textContent"] = v403 + "px"),
          (this["_customGridDraftGap"] = v403),
          this["_syncCustomGridOverlay"]({ applyLayout: false }));
      }),
      v401["addEventListener"]("pointerdown", (v404) => {
        v404["stopPropagation"]?.();
      }),
      v400["appendChild"](v401),
      v397["appendChild"](v398),
      v397["appendChild"](v399),
      v396["appendChild"](v397),
      v396["appendChild"](v400),
      this["_mountToolbarMenu"](v396, v395));
    const v405 = (v406) => {
      if (this["_isCustomGridEditing"]) return;
      !v396["contains"](v406["target"]) &&
        !v395["contains"](v406["target"]) &&
        this["_closeMenu"]();
    };
    ((this["_dismissHandler"] = v405),
      document["addEventListener"]("pointerdown", v405));
  }
  ["_exitCustomGridEdit"]() {
    const v407 = this["_activeMenu"] === "split-lines";
    (this["_endCustomGridLineDrag"](),
      (this["_isCustomGridEditing"] = false),
      (this["_isCustomGridConfirming"] = false),
      (this["_customGridDraft"] = null),
      (this["_customGridDraftGap"] = null),
      (this["_customGridFrozenCellStyles"] = null),
      this["el"]["classList"]["remove"]("is-custom-grid-mode"),
      this["_unbindCustomGridKeyboard"](),
      this["_syncCustomGridOverlay"](),
      this["_updateCustomGridButtonState"](),
      this["_setCustomGridHint"](false),
      v407 && this["_closeMenu"]({ force: true }));
  }
  ["_updateEditButtonState"]() {
    const v408 = this["el"]["querySelector"](".act-edit");
    if (!v408) return;
    (v408["classList"]["toggle"]("active", this["_isEditing"]),
      (v408["dataset"]["tooltip"] = this["_isEditing"]
        ? "退出编辑分镜"
        : "编辑分镜"),
      v408["setAttribute"](
        "aria-label",
        this["_isEditing"] ? "退出编辑分镜" : "编辑分镜",
      ));
    const v409 = v408["querySelector"]("span");
    if (v409) v409["textContent"] = this["_isEditing"] ? "退出" : "编辑";
  }
  ["_getNormalizedCustomGridDraft"]() {
    const v410 = resolveStoryboardGridLayout({
      cols: this["_data"]["cols"],
      rows: this["_data"]["rows"],
      gridLayout: this["_customGridDraft"],
    });
    return { columns: v410["columns"], rows: v410["rowTracks"] };
  }
  ["_bindCustomGridKeyboard"]() {
    if (this["_customGridKeydownHandler"]) return;
    ((this["_customGridKeydownHandler"] = (v411) => {
      if (v411["key"] !== "Escape") return;
      (v411["preventDefault"]?.(),
        v411["stopPropagation"]?.(),
        this["_cancelCustomGridEdit"]());
    }),
      document["addEventListener"](
        "keydown",
        this["_customGridKeydownHandler"],
        true,
      ));
  }
  ["_unbindCustomGridKeyboard"]() {
    if (!this["_customGridKeydownHandler"]) return;
    (document["removeEventListener"](
      "keydown",
      this["_customGridKeydownHandler"],
      true,
    ),
      (this["_customGridKeydownHandler"] = null));
  }
  ["_removeCustomGridHandles"]() {
    this["_customGridOverlay"] &&
      (this["_customGridOverlay"]["remove"](),
      (this["_customGridOverlay"] = null));
  }
  ["_getCustomGridLinePosition"](v412, v413) {
    const v414 = v413 > 0 ? v412 / v413 : 0;
    return v414 * 100 + "%";
  }
  ["_applyCustomGridLineSize"](v415, v416, v417) {
    const v418 = Math["max"](0, Number(v417) || 0),
      v419 = Math["max"](1, Math["round"](v418)) + "px",
      v420 = Math["max"](0.5, v418 / 2) + "px",
      v421 = Math["max"](18, Math["round"](v418)) + "px";
    if (typeof v415["style"]?.["setProperty"] === "function")
      (v415["style"]["setProperty"]("--storyboard-grid-line-size", v419),
        v415["style"]["setProperty"]("--storyboard-grid-line-half-size", v420));
    else
      v415["style"] &&
        ((v415["style"]["--storyboard-grid-line-size"] = v419),
        (v415["style"]["--storyboard-grid-line-half-size"] = v420));
    if (v416 === "columns") v415["style"]["width"] = v421;
    else v415["style"]["height"] = v421;
  }
  ["_renderCustomGridHandles"]({
    editable: editable = this["_isCustomGridEditing"],
    layout: layout = this["_getActiveGridLayout"](),
  } = {}) {
    if (!this["_grid"]) return;
    const v422 = layout["cols"] > 1 || layout["rows"] > 1;
    if (!v422) {
      this["_removeCustomGridHandles"]();
      return;
    }
    let v423 = this["_customGridOverlay"];
    (!v423 || v423["parentNode"] !== this["_grid"]) &&
      ((v423 = document["createElement"]("div")),
      (v423["className"] = "storyboard-custom-grid-overlay"),
      this["_grid"]["appendChild"](v423),
      (this["_customGridOverlay"] = v423));
    v423["replaceChildren"]();
    const v424 = this["_isCustomGridEditing"]
        ? this["_getCustomGridDraftGap"]()
        : this["_getGridGap"](),
      v425 = layout["columns"]["reduce"]((v426, v427) => v426 + v427, 0),
      v428 = layout["rowTracks"]["reduce"]((v429, v430) => v429 + v430, 0);
    let v431 = 0;
    for (let v432 = 0; v432 < layout["columns"]["length"] - 1; v432++) {
      v431 += layout["columns"][v432];
      const v433 = document["createElement"](editable ? "button" : "div");
      if (editable) v433["type"] = "button";
      ((v433["className"] = editable
        ? "storyboard-custom-grid-handle storyboard-custom-grid-handle-vertical"
        : "storyboard-custom-grid-line storyboard-custom-grid-line-vertical"),
        (v433["dataset"]["axis"] = "columns"),
        (v433["dataset"]["index"] = String(v432)),
        v433["setAttribute"]("aria-label", "移动竖向分割线"),
        (v433["style"]["left"] = this["_getCustomGridLinePosition"](
          v431,
          v425,
        )),
        this["_applyCustomGridLineSize"](v433, "columns", v424),
        editable &&
          v433["addEventListener"]("pointerdown", (v434) =>
            this["_beginCustomGridLineDrag"](v434, "columns", v432),
          ),
        v423["appendChild"](v433));
    }
    let v435 = 0;
    for (let v436 = 0; v436 < layout["rowTracks"]["length"] - 1; v436++) {
      v435 += layout["rowTracks"][v436];
      const v437 = document["createElement"](editable ? "button" : "div");
      if (editable) v437["type"] = "button";
      ((v437["className"] = editable
        ? "storyboard-custom-grid-handle storyboard-custom-grid-handle-horizontal"
        : "storyboard-custom-grid-line storyboard-custom-grid-line-horizontal"),
        (v437["dataset"]["axis"] = "rows"),
        (v437["dataset"]["index"] = String(v436)),
        v437["setAttribute"]("aria-label", "移动横向分割线"),
        (v437["style"]["top"] = this["_getCustomGridLinePosition"](v435, v428)),
        this["_applyCustomGridLineSize"](v437, "rows", v424),
        editable &&
          v437["addEventListener"]("pointerdown", (v438) =>
            this["_beginCustomGridLineDrag"](v438, "rows", v436),
          ),
        v423["appendChild"](v437));
    }
  }
  ["_beginCustomGridLineDrag"](v439, v440, v441) {
    (v439["preventDefault"]?.(), v439["stopPropagation"]?.());
    if (!this["_isCustomGridEditing"] || !this["_grid"]) return;
    this["_endCustomGridLineDrag"]();
    const v442 = this["_getCustomGridOverlayLayout"](),
      v443 = this["_grid"]["getBoundingClientRect"]();
    !this["_customGridFrozenCellStyles"] &&
      this["_captureCustomGridCellVisualState"]();
    const v444 = (v445) => this["_dragCustomGridLine"](v445),
      v446 = () => this["_endCustomGridLineDrag"]();
    ((this["_customGridDrag"] = {
      axis: v440,
      index: v441,
      startClientX: Number(v439["clientX"]) || 0,
      startClientY: Number(v439["clientY"]) || 0,
      startColumns: [...v442["columns"]],
      startRows: [...v442["rowTracks"]],
      rect: v443,
      onMove: v444,
      onEnd: v446,
    }),
      this["el"]["classList"]["add"]("is-custom-grid-dragging"));
    try {
      v439["currentTarget"]?.["setPointerCapture"]?.(v439["pointerId"]);
    } catch (v447) {}
    (document["addEventListener"]("pointermove", v444),
      document["addEventListener"]("pointerup", v446, { once: true }),
      document["addEventListener"]("pointercancel", v446, { once: true }));
  }
  ["_dragCustomGridLine"](v448) {
    const v449 = this["_customGridDrag"];
    if (!v449 || !this["_customGridDraft"]) return;
    const v450 = v449["axis"],
      v451 = v450 === "columns",
      v452 = v451 ? v449["rect"]["width"] : v449["rect"]["height"],
      v453 = Math["max"](1, v452),
      v454 = v451
        ? (Number(v448["clientX"]) || 0) - v449["startClientX"]
        : (Number(v448["clientY"]) || 0) - v449["startClientY"],
      v455 = v451 ? v449["startColumns"] : v449["startRows"],
      v456 = v455["reduce"]((v457, v458) => v457 + v458, 0),
      v459 = this["_adjustAdjacentGridTracks"](
        v455,
        v449["index"],
        (v454 / v453) * v456,
      );
    ((this["_customGridDraft"] = {
      columns: v451 ? v459 : this["_customGridDraft"]["columns"],
      rows: v451 ? this["_customGridDraft"]["rows"] : v459,
    }),
      this["_syncCustomGridOverlay"]({ applyLayout: false }));
  }
  ["_adjustAdjacentGridTracks"](v460, v461, v462) {
    const v463 = [...v460];
    if (v461 < 0 || v461 >= v463["length"] - 1) return v463;
    const v464 = v463[v461] + v463[v461 + 1],
      v465 = Math["min"](0.2, v464 / 2),
      v466 = Math["min"](Math["max"](v463[v461] + v462, v465), v464 - v465);
    return (
      (v463[v461] = Math["round"](v466 * 10000) / 10000),
      (v463[v461 + 1] = Math["round"]((v464 - v466) * 10000) / 10000),
      v463
    );
  }
  ["_endCustomGridLineDrag"]() {
    const v467 = this["_customGridDrag"];
    if (!v467) return;
    (document["removeEventListener"]("pointermove", v467["onMove"]),
      document["removeEventListener"]("pointerup", v467["onEnd"]),
      document["removeEventListener"]("pointercancel", v467["onEnd"]),
      (this["_customGridDrag"] = null),
      this["el"]["classList"]["remove"]("is-custom-grid-dragging"));
  }
  ["_toggleCollapse"](v468) {
    this["_isCollapsed"] = v468;
    const v469 = { isCollapsed: v468 };
    if (v468) {
      const v470 = this["_data"]["aspectRatio"] || "1:1",
        v471 = v470["split"](":")["map"](Number),
        v472 = v471[0],
        v473 = v471[1],
        v474 = v472 / v473;
      let v475, v476;
      (v474 >= 1
        ? ((v476 = 300), (v475 = Math["round"](v476 * v474)))
        : ((v475 = 300), (v476 = Math["round"](v475 / v474))),
        (v469["_originalWidth"] = this["_data"]["width"]),
        (v469["_originalHeight"] = this["_data"]["height"]),
        (v469["width"] = v475),
        (v469["height"] = v476));
    } else
      this["_data"]["_originalWidth"] &&
        this["_data"]["_originalHeight"] &&
        ((v469["width"] = this["_data"]["_originalWidth"]),
        (v469["height"] = this["_data"]["_originalHeight"]));
    appStore["updateNodeData"](this["id"], v469);
  }
  ["_showAspectMenu"](v477) {
    const v478 = [
      {
        label: "16:9",
        icon: "<svg\x20width=\x2714\x27\x20height=\x2714\x27\x20viewBox=\x270\x200\x2024\x2024\x27\x20fill=\x27none\x27\x20stroke=\x27currentColor\x27\x20stroke-width=\x272\x27><rect\x20x=\x272\x27\x20y=\x276\x27\x20width=\x2720\x27\x20height=\x2712\x27\x20rx=\x272\x27/></svg>",
      },
      {
        label: "9:16",
        icon: "<svg\x20width=\x2714\x27\x20height=\x2714\x27\x20viewBox=\x270\x200\x2024\x2024\x27\x20fill=\x27none\x27\x20stroke=\x27currentColor\x27\x20stroke-width=\x272\x27><rect\x20x=\x276\x27\x20y=\x272\x27\x20width=\x2712\x27\x20height=\x2720\x27\x20rx=\x272\x27/></svg>",
      },
      {
        label: "4:3",
        icon: "<svg\x20width=\x2714\x27\x20height=\x2714\x27\x20viewBox=\x270\x200\x2024\x2024\x27\x20fill=\x27none\x27\x20stroke=\x27currentColor\x27\x20stroke-width=\x272\x27><rect\x20x=\x273\x27\x20y=\x275\x27\x20width=\x2718\x27\x20height=\x2714\x27\x20rx=\x272\x27/></svg>",
      },
      {
        label: "3:4",
        icon: "<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><rect x='5' y='3' width='14' height='18' rx='2'/></svg>",
      },
      {
        label: "1:1",
        icon: "<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><rect x='4' y='4' width='16' height='16' rx='2'/></svg>",
      },
    ];
    this["_showFloatingMenu"](
      v477,
      "aspect",
      v478["map"]((v479) => ({
        label: v479["label"],
        icon: v479["icon"],
        action: () => {
          const v480 = this["_calculateDimsByAspect"](v479["label"]);
          appStore["updateNodeData"](this["id"], {
            aspectRatio: v479["label"],
            width: v480["w"],
            height: v480["h"],
          });
        },
      })),
    );
  }
  ["_showGridMenu"](v481) {
    const v482 = [
      {
        label: "5×5",
        cols: 5,
        rows: 5,
        icon: "<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><rect x='3' y='3' width='4' height='4'/><rect x='10' y='3' width='4' height='4'/><rect x='17' y='3' width='4' height='4'/><rect x='3' y='10' width='4' height='4'/><rect x='10' y='10' width='4' height='4'/><rect x='17' y='10' width='4' height='4'/><rect x='3' y='17' width='4' height='4'/><rect x='10' y='17' width='4' height='4'/><rect x='17' y='17' width='4' height='4'/></svg>",
      },
      {
        label: "4×4",
        cols: 4,
        rows: 4,
        icon: "<svg\x20width=\x2714\x27\x20height=\x2714\x27\x20viewBox=\x270\x200\x2024\x2024\x27\x20fill=\x27none\x27\x20stroke=\x27currentColor\x27\x20stroke-width=\x272\x27><rect\x20x=\x273\x27\x20y=\x273\x27\x20width=\x275\x27\x20height=\x275\x27/><rect\x20x=\x279.5\x27\x20y=\x273\x27\x20width=\x275\x27\x20height=\x275\x27/><rect\x20x=\x2716\x27\x20y=\x273\x27\x20width=\x275\x27\x20height=\x275\x27/><rect\x20x=\x273\x27\x20y=\x279.5\x27\x20width=\x275\x27\x20height=\x275\x27/><rect\x20x=\x279.5\x27\x20y=\x279.5\x27\x20width=\x275\x27\x20height=\x275\x27/><rect\x20x=\x2716\x27\x20y=\x279.5\x27\x20width=\x275\x27\x20height=\x275\x27/><rect\x20x=\x273\x27\x20y=\x2716\x27\x20width=\x275\x27\x20height=\x275\x27/><rect\x20x=\x279.5\x27\x20y=\x2716\x27\x20width=\x275\x27\x20height=\x275\x27/><rect\x20x=\x2716\x27\x20y=\x2716\x27\x20width=\x275\x27\x20height=\x275\x27/></svg>",
      },
      {
        label: "3×3",
        cols: 3,
        rows: 3,
        icon: "<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><rect x='3' y='3' width='6' height='6'/><rect x='9' y='3' width='6' height='6'/><rect x='15' y='3' width='6' height='6'/><rect x='3' y='9' width='6' height='6'/><rect x='9' y='9' width='6' height='6'/><rect x='15' y='9' width='6' height='6'/><rect x='3' y='15' width='6' height='6'/><rect x='9' y='15' width='6' height='6'/><rect x='15' y='15' width='6' height='6'/></svg>",
      },
      {
        label: "2×2",
        cols: 2,
        rows: 2,
        icon: "<svg\x20width=\x2714\x27\x20height=\x2714\x27\x20viewBox=\x270\x200\x2024\x2024\x27\x20fill=\x27none\x27\x20stroke=\x27currentColor\x27\x20stroke-width=\x272\x27><rect\x20x=\x273\x27\x20y=\x273\x27\x20width=\x278\x27\x20height=\x278\x27/><rect\x20x=\x2713\x27\x20y=\x273\x27\x20width=\x278\x27\x20height=\x278\x27/><rect\x20x=\x273\x27\x20y=\x2713\x27\x20width=\x278\x27\x20height=\x278\x27/><rect\x20x=\x2713\x27\x20y=\x2713\x27\x20width=\x278\x27\x20height=\x278\x27/></svg>",
      },
    ];
    this["_showFloatingMenu"](
      v481,
      "grid",
      v482["map"]((v483) => ({
        label: v483["label"],
        icon: v483["icon"],
        action: () => {
          this["_updateGrid"](v483["cols"], v483["rows"]);
        },
      })),
    );
  }
  ["_showFloatingMenu"](v484, v485, v486) {
    (this["_closeMenu"](), (this["_activeMenu"] = v485));
    const v487 = v484["querySelector"](".ftb-chevron");
    if (v487) v487["style"]["transform"] = "rotate(180deg)";
    v484["classList"]["add"]("active");
    const v488 = document["createElement"]("div");
    ((v488["className"] = "v2-canvas-ctx-menu v2-sb-dropdown"),
      v486["forEach"]((v489) => {
        const v490 = document["createElement"]("div");
        v490["className"] = "v2-menu-row";
        if (v489["icon"]) {
          v490["replaceChildren"]();
          const v491 = document["createElement"]("span");
          try {
            const v492 = new DOMParser()["parseFromString"](
                v489["icon"],
                "image/svg+xml",
              ),
              v493 = v492["documentElement"];
            v493 &&
              v493["tagName"] &&
              v493["tagName"]["toLowerCase"]() === "svg" &&
              v491["appendChild"](document["importNode"](v493, true));
          } catch (v494) {}
          const v495 = document["createElement"]("span");
          ((v495["textContent"] = v489["label"]),
            v490["appendChild"](v491),
            v490["appendChild"](v495));
        } else v490["textContent"] = v489["label"];
        ((v490["onclick"] = (v496) => {
          (v496["stopPropagation"](), v489["action"](), this["_closeMenu"]());
        }),
          v488["appendChild"](v490));
      }),
      this["_mountToolbarMenu"](v488, v484));
    const v497 = (v498) => {
      !v488["contains"](v498["target"]) &&
        !v484["contains"](v498["target"]) &&
        this["_closeMenu"]();
    };
    ((this["_dismissHandler"] = v497),
      setTimeout(() => {
        if (this["_menuEl"] !== v488) return;
        document["addEventListener"]("pointerdown", v497);
      }, 10));
  }
  ["_mountToolbarMenu"](v499, v500) {
    const v501 = v500?.["closest"]?.(".storyboard-toolbar") || null;
    if (!v501) {
      (document["body"]["appendChild"](v499),
        (this["_menuEl"] = v499),
        this["_positionFixedMenu"](v499, v500));
      return;
    }
    (v499["classList"]["add"]("storyboard-toolbar-menu"),
      v501["appendChild"](v499),
      (this["_menuEl"] = v499),
      this["_positionToolbarMenu"](v499, v500, v501));
  }
  ["_positionFixedMenu"](v502, v503) {
    const v504 = v503?.["getBoundingClientRect"]?.() || {
        left: 0,
        top: 0,
        bottom: 0,
        width: 0,
      },
      v505 = Number(v502["offsetHeight"]) || 0;
    ((v502["style"]["left"] = v504["left"] + "px"),
      (v502["style"]["top"] = v504["top"] - v505 - 8 + "px"));
  }
  ["_positionToolbarMenu"](v506, v507, v508) {
    const v509 = Number(v506["offsetWidth"]) || 0,
      v510 = Number(v506["offsetHeight"]) || 0,
      v511 = v508["getBoundingClientRect"]?.() || {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: 0,
      },
      v512 = v507["getBoundingClientRect"]?.() || v511,
      v513 =
        (typeof window !== "undefined" ? Number(window["innerWidth"]) : 0) ||
        Number(document["documentElement"]?.["clientWidth"]) ||
        0,
      v514 = 8;
    let v515 =
      (Number(v507["offsetLeft"]) || 0) +
      (Number(v507["offsetWidth"]) || Number(v512["width"]) || 0) / 2 -
      v509 / 2;
    if (v513 > 0 && Number["isFinite"](v511["left"])) {
      const v516 = v511["left"] + v515,
        v517 = v516 + v509;
      if (v516 < v514) v515 += v514 - v516;
      else v517 > v513 - v514 && (v515 -= v517 - (v513 - v514));
    }
    const v518 = Number(v511["top"]) >= v510 + v514;
    ((v506["style"]["left"] = Math["max"](0, Math["round"](v515)) + "px"),
      v518
        ? ((v506["style"]["top"] = "auto"),
          (v506["style"]["bottom"] = "calc(100% + 8px)"))
        : ((v506["style"]["bottom"] = "auto"),
          (v506["style"]["top"] = "calc(100% + 8px)")));
  }
  ["_closeMenu"]({ force: force = false } = {}) {
    if (
      !force &&
      this["_activeMenu"] === "split-lines" &&
      this["_isCustomGridEditing"]
    )
      return;
    this["_menuEl"] &&
      (this["_menuEl"]["__commitPending"]?.(),
      this["_menuEl"]["remove"](),
      (this["_menuEl"] = null));
    if (this["_activeMenu"]) {
      const v519 = this["el"]["querySelector"](".act-" + this["_activeMenu"]);
      if (v519) {
        !(
          this["_activeMenu"] === "split-lines" && this["_isCustomGridEditing"]
        ) && v519["classList"]["remove"]("active");
        const v520 = v519["querySelector"](".ftb-chevron");
        if (v520) v520["style"]["transform"] = "rotate(0deg)";
      }
      this["_activeMenu"] = null;
    }
    this["_dismissHandler"] &&
      (document["removeEventListener"]("pointerdown", this["_dismissHandler"]),
      (this["_dismissHandler"] = null));
  }
  ["_updateGrid"](v521, v522) {
    ((this["_customGridRefreshVersion"] += 1), this["_exitCustomGridEdit"]());
    const v523 = this["_data"]["cells"] || [],
      v524 = this["_data"]["cols"] || 2,
      v525 = [];
    for (let v526 = 0; v526 < v522; v526++) {
      for (let v527 = 0; v527 < v521; v527++) {
        const v528 = v526 * v524 + v527,
          v529 = v523[v528];
        v529
          ? v525["push"]({ ...v529 })
          : v525["push"]({ id: generateId("cell"), url: "", isEmpty: true });
      }
    }
    appStore["updateNodeData"](this["id"], {
      cols: v521,
      rows: v522,
      cells: v525,
      gridLayout: null,
    });
  }
  ["_toggleEdit"](v530) {
    const v531 = !!v530;
    v531 && this["_isCustomGridEditing"] && this["_cancelCustomGridEdit"]();
    ((this["_isEditing"] = v531),
      this["el"]["classList"]["toggle"]("is-editing-mode", v531),
      this["_updateEditButtonState"]());
    const v532 = this["el"]["querySelector"](".v2-storyboard-hint");
    v532 &&
      (v532["textContent"] = v531
        ? "拖拽单元格进行互换，或拖出生成新图"
        : "双击进入分镜编辑");
    if (this["_isCustomGridEditing"]) this["_setCustomGridHint"](true);
    const v533 = { isEditing: v531 };
    if (v531) {
      const v534 = this["_getStoryboardBackdropImageUrl"](),
        v535 = this["_materializeSourceBackedCellsForEditing"]();
      if (v535) {
        v533["cells"] = v535;
        if (v534) v533["storyboardBackdropUrl"] = v534;
        ((this["_data"] = {
          ...this["_data"],
          cells: v535,
          ...(v534 ? { storyboardBackdropUrl: v534 } : {}),
        }),
          this["_syncBackdropImage"](),
          this["_applyAllCellCropStyles"]());
      }
    }
    appStore["updateNodeData"](this["id"], v533);
  }
  ["_getComposeCellImageElement"](v536) {
    const v537 = this["_cellEls"]?.[v536] || null;
    if (!v537) return null;
    return (
      Array["from"](v537["querySelectorAll"]?.(".storyboard-cell-img") || [])[
        "find"
      ](
        (v538) =>
          !v538["classList"]?.["contains"]?.("storyboard-empty-residual-img") &&
          !v538["classList"]?.["contains"]?.("storyboard-cell-source-cache"),
      ) || null
    );
  }
  ["_getComposeCellDisplayUrl"](v539) {
    return this["_getImageElementSource"](
      this["_getComposeCellImageElement"](v539),
    );
  }
  ["_parseComposeLengthRatio"](v540, v541, v542) {
    const v543 = String(v540 || "")["trim"]();
    if (!v543) return v542;
    const v544 = Number["parseFloat"](v543);
    if (!Number["isFinite"](v544)) return v542;
    if (v543["endsWith"]("%")) return v544 / 100;
    if (v543["endsWith"]("px")) {
      const v545 = Math["max"](1, Number(v541) || 1);
      return v544 / v545;
    }
    return v544;
  }
  ["_buildComposeRenderedCrop"](v546, v547, v548) {
    if (!v546 || !v547 || !v548) return null;
    if (!v546["classList"]?.["contains"]?.("storyboard-cell-img--source-crop"))
      return null;
    const v549 = Math["max"](
        1,
        Math["trunc"](Number(v547["naturalWidth"] || v547["width"]) || 0),
      ),
      v550 = Math["max"](
        1,
        Math["trunc"](Number(v547["naturalHeight"] || v547["height"]) || 0),
      ),
      v551 = this["_parseComposeLengthRatio"](
        v546["style"]?.["width"],
        v548["drawW"],
        1,
      ),
      v552 = this["_parseComposeLengthRatio"](
        v546["style"]?.["height"],
        v548["drawH"],
        1,
      );
    if (v551 <= 0 || v552 <= 0) return null;
    const v553 = this["_parseComposeLengthRatio"](
        v546["style"]?.["left"],
        v548["drawW"],
        0,
      ),
      v554 = this["_parseComposeLengthRatio"](
        v546["style"]?.["top"],
        v548["drawH"],
        0,
      ),
      v555 = Math["max"](0, Math["min"](v549 - 1, (-v553 / v551) * v549)),
      v556 = Math["max"](0, Math["min"](v550 - 1, (-v554 / v552) * v550)),
      v557 = Math["max"](1, Math["min"](v549 - v555, v549 / v551)),
      v558 = Math["max"](1, Math["min"](v550 - v556, v550 / v552));
    return { sx: v555, sy: v556, sw: v557, sh: v558 };
  }
  async ["_drawComposeAsset"](
    v559,
    {
      cell: v560,
      finalUrl: v561,
      imageEl: v562,
      target: v563,
      loadImage: v564,
    },
  ) {
    if (!v559 || !v561 || typeof v564 !== "function") return false;
    const v565 = await v564(v561);
    if (!v565) return false;
    const v566 = this["_buildComposeRenderedCrop"](v562, v565, v563);
    if (v566)
      return (
        v559["drawImage"](
          v565,
          v566["sx"],
          v566["sy"],
          v566["sw"],
          v566["sh"],
          v563["x0"],
          v563["y0"],
          v563["drawW"],
          v563["drawH"],
        ),
        true
      );
    const v567 = String(v562?.["style"]?.["objectFit"] || "")["trim"](),
      v568 =
        v567 === "fill" ||
        (!v562 &&
          (v560?.["storyboardExtractedCell"] === true ||
            v560?.["storyboardLockedCell"] === true ||
            v560?.["storyboardPiece"] === true));
    if (v568)
      return (
        v559["drawImage"](
          v565,
          0,
          0,
          v565["naturalWidth"],
          v565["naturalHeight"],
          v563["x0"],
          v563["y0"],
          v563["drawW"],
          v563["drawH"],
        ),
        true
      );
    const v569 = v565["naturalWidth"],
      v570 = v565["naturalHeight"],
      v571 = v569 / v570,
      v572 = v563["drawW"] / v563["drawH"];
    let v573, v574, v575, v576;
    return (
      v571 > v572
        ? ((v574 = v570),
          (v573 = v570 * v572),
          (v575 = (v569 - v573) / 2),
          (v576 = 0))
        : ((v573 = v569),
          (v574 = v569 / v572),
          (v575 = 0),
          (v576 = (v570 - v574) / 2)),
      v559["drawImage"](
        v565,
        v575,
        v576,
        v573,
        v574,
        v563["x0"],
        v563["y0"],
        v563["drawW"],
        v563["drawH"],
      ),
      true
    );
  }
  async ["_drawComposeCell"](
    v577,
    {
      cell: v578,
      cellIndex: v579,
      displayUrl: v580,
      imageEl: v581,
      target: v582,
      loadImage: v583,
    },
  ) {
    const v584 = v581 || this["_getComposeCellImageElement"](v579),
      v585 = v580 || this["_getImageElementSource"](v584);
    return this["_drawComposeAsset"](v577, {
      cell: v578,
      finalUrl: v585,
      imageEl: v584,
      target: v582,
      loadImage: v583,
    });
  }
  async ["_compose"]() {
    if (
      !this["_data"]["cells"] ||
      this["_data"]["cells"]["every"]((v586, v587) => {
        return (
          this["_isCellEmpty"](v586) || !this["_getComposeCellDisplayUrl"](v587)
        );
      })
    ) {
      window["showToast"]?.("分镜内没有任何内容可供合成", "warning");
      return;
    }
    const v588 = this["el"]["querySelector"](".act-compose"),
      v589 = Array["from"](v588["childNodes"])["map"]((v590) =>
        v590["cloneNode"](true),
      ),
      v591 = v588["dataset"]["tooltip"];
    ((this["_isComposing"] = true),
      v588["replaceChildren"](),
      (v588["dataset"]["tooltip"] = "合成中..."));
    const v592 = "http://www.w3.org/2000/svg",
      v593 = document["createElementNS"](v592, "svg");
    (v593["classList"]["add"]("v2-spinning"),
      v593["setAttribute"]("width", "14"),
      v593["setAttribute"]("height", "14"),
      v593["setAttribute"]("viewBox", "0 0 24 24"),
      v593["setAttribute"]("fill", "none"),
      v593["setAttribute"]("stroke", "currentColor"),
      v593["setAttribute"]("stroke-width", "2"));
    const v594 = document["createElementNS"](v592, "path");
    (v594["setAttribute"]("d", "M21\x2012a9\x209\x200\x201\x201-6.219-8.56"),
      v593["appendChild"](v594),
      v588["appendChild"](v593),
      (v588["style"]["pointerEvents"] = "none"));
    try {
      const v595 = this["_data"]["aspectRatio"] || "1:1",
        v596 = v595["split"](":")["map"](Number),
        v597 = v596[0],
        v598 = v596[1],
        v599 = 2048,
        v600 = Math["round"](v599 * (v598 / v597)),
        v601 = document["createElement"]("canvas");
      ((v601["width"] = v599), (v601["height"] = v600));
      const v602 = v601["getContext"]("2d"),
        v603 =
          getComputedStyle(document["documentElement"])
            ["getPropertyValue"]("--surface-node")
            ["trim"]() || "transparent",
        v604 =
          getComputedStyle(document["documentElement"])
            ["getPropertyValue"]("--bg-node")
            ["trim"]() || v603;
      ((v602["fillStyle"] = v603), v602["fillRect"](0, 0, v599, v600));
      const v605 = this["_data"]["cols"] || 2,
        v606 = this["_data"]["rows"] || 2,
        v607 = new Map(),
        v608 = async (v609) => {
          const v610 = String(v609 || "")["trim"]();
          if (!v610) return null;
          if (v607["has"](v610)) return v607["get"](v610);
          const v611 = new Promise((v612) => {
            const v613 = new Image();
            ((v613["crossOrigin"] = "anonymous"),
              (v613["onload"] = () => v612(v613)),
              (v613["onerror"] = () => v612(null)),
              (v613["src"] = v610));
          });
          return (v607["set"](v610, v611), v611);
        },
        v614 = this["_getStoryboardBackdropImageUrl"]();
      if (v614) {
        const v615 = await v608(v614);
        v615 &&
          v602["drawImage"](
            v615,
            0,
            0,
            v615["naturalWidth"],
            v615["naturalHeight"],
            0,
            0,
            v599,
            v600,
          );
      }
      const v616 = this["_data"]["cells"]["map"](async (v617, v618) => {
        const v619 = this["_isCellEmpty"](v617),
          v620 = this["_getComposeCellImageElement"](v618),
          v621 = this["_getImageElementSource"](v620);
        if (v618 >= v605 * v606) return;
        const v622 = buildStoryboardCropRect(this["_data"], v618, {
          width: v599,
          height: v600,
          inset: 0,
        });
        if (!v622) return;
        const v623 = v622["x0"],
          v624 = v622["x1"],
          v625 = v622["y0"],
          v626 = v622["y1"],
          v627 = Math["max"](1, v624 - v623),
          v628 = Math["max"](1, v626 - v625);
        if (v619) {
          ((v602["fillStyle"] = v604),
            v602["fillRect"](v623, v625, v627, v628));
          return;
        }
        if (!v621) return;
        await this["_drawComposeCell"](v602, {
          cell: v617,
          cellIndex: v618,
          displayUrl: v621,
          imageEl: v620,
          target: { x0: v623, y0: v625, drawW: v627, drawH: v628 },
          loadImage: v608,
        });
      });
      await Promise["all"](v616);
      const v629 = await new Promise((v630) =>
          v601["toBlob"](v630, "image/jpeg", 0.9),
        ),
        v631 = generateId("compose"),
        v632 = "storyboard_compose_" + v631 + ".jpg",
        v633 = new File([v629], v632, { type: "image/jpeg" }),
        v634 = await saveOutputBlob(v633, { ext: "jpg" }),
        v635 = String(v634["localPath"] || v634["path"] || "")["replace"](
          /^\//,
          "",
        ),
        v636 = String(v634["url"] || "")["trim"]() || "/" + String(v635 || ""),
        v637 = getAutoMediaSizeByShortSide(v601["width"], v601["height"]),
        v638 = v637["width"],
        v639 = v637["height"],
        v640 = generateId("node");
      (appStore["addNode"](
        buildSourceMediaNodePayload({
          id: v640,
          type: "source-image",
          x: this["_data"]["x"] + this["_data"]["width"] + 40,
          y: this["_data"]["y"],
          width: v638,
          height: v639,
          src: v636,
          localPath: v635,
          fileName: v634["filename"] || v632,
          name: "合成分镜_" + v595,
          needsAutoResize: false,
        }),
      ),
        appStore["setSelectedNodes"]([v640]),
        commit(),
        window["v2FocusOnNodes"] &&
          requestAnimationFrame(() =>
            window["v2FocusOnNodes"]([this["id"], v640]),
          ),
        window["_triggerLocalCacheSave"]?.(),
        window["showToast"]?.("合成成功，源图像节点已生成", "success"));
    } catch (v641) {
      (console["error"]("[Storyboard] Compose failed:", v641),
        window["showToast"]?.("合成失败", "error"));
    } finally {
      ((this["_isComposing"] = false),
        v588["replaceChildren"](
          ...v589["map"]((v642) => v642["cloneNode"](true)),
        ),
        (v588["dataset"]["tooltip"] = v591),
        (v588["style"]["pointerEvents"] = "auto"));
    }
  }
  ["_calculateDimsByAspect"](v643) {
    const v644 = v643["split"](":")["map"](Number),
      v645 = v644[0],
      v646 = v644[1],
      v647 = this["_data"]["width"] || 800;
    return { w: v647, h: Math["round"](v647 * (v646 / v645)) };
  }
  ["hitTestCell"](v648, v649) {
    if (this["_isCollapsed"]) return -1;
    return getStoryboardCellIndexAtWorldPoint(this["_data"], v648, v649);
  }
  ["highlightCell"](v650) {
    if (this["_lastHighlightIndex"] === v650) return;
    this["_lastHighlightIndex"] = v650;
    if (!this["_cellEls"]) return;
    this["_cellEls"]["forEach"]((v651, v652) => {
      if (v652 === v650) v651["classList"]["add"]("drag-hover");
      else v651["classList"]["remove"]("drag-hover");
    });
  }
  ["applyImmediateCellSwap"](v653, v654) {
    const v655 = Number(v653),
      v656 = Number(v654),
      v657 = () => {};
    if (
      !Number["isInteger"](v655) ||
      !Number["isInteger"](v656) ||
      v655 === v656 ||
      v655 < 0 ||
      v656 < 0 ||
      !this["_cellEls"] ||
      v655 >= this["_cellEls"]["length"] ||
      v656 >= this["_cellEls"]["length"]
    )
      return { ok: false, revert: v657 };
    const v658 =
        this["_cellEls"][v655]?.["querySelector"]?.(".cell-content-wrap") ||
        null,
      v659 =
        this["_cellEls"][v656]?.["querySelector"]?.(".cell-content-wrap") ||
        null;
    if (!v658 || !v659) return { ok: false, revert: v657 };
    const v660 = Array["from"](v658["childNodes"] || []),
      v661 = Array["from"](v659["childNodes"] || []),
      v662 = v658["__storyboardPendingSrc"],
      v663 = v659["__storyboardPendingSrc"],
      v664 = Object["prototype"]["hasOwnProperty"]["call"](
        v658,
        "__storyboardPendingSrc",
      ),
      v665 = Object["prototype"]["hasOwnProperty"]["call"](
        v659,
        "__storyboardPendingSrc",
      );
    (v658["replaceChildren"](...v661),
      v659["replaceChildren"](...v660),
      delete v658["__storyboardPendingSrc"],
      delete v659["__storyboardPendingSrc"]);
    let v666 = false;
    const v667 = (v668, v669, v670) => {
        if (v669) v668["__storyboardPendingSrc"] = v670;
        else delete v668["__storyboardPendingSrc"];
      },
      v671 = () => {
        if (v666) return;
        ((v666 = true),
          v658["replaceChildren"](...v660),
          v659["replaceChildren"](...v661),
          v667(v658, v664, v662),
          v667(v659, v665, v663));
      };
    return { ok: true, revert: v671 };
  }
  ["update"](v672) {
    const v673 = this["_data"] || {};
    this["_data"] = v672 && typeof v672 === "object" ? v672 : {};
    !Array["isArray"](this["_data"]["cells"]) &&
      (this["_data"] = { ...this["_data"], cells: [] });
    if (v672["isCollapsed"] !== v673["isCollapsed"]) {
      (this["_exitCustomGridEdit"](),
        (this["_isCollapsed"] = !!v672["isCollapsed"]),
        this["mount"]());
      return;
    }
    if (v672["isEditing"] !== v673["isEditing"]) {
      this["_isEditing"] = !!v672["isEditing"];
      this["_isEditing"] &&
        this["_isCustomGridEditing"] &&
        this["_cancelCustomGridEdit"]();
      (this["el"]["classList"]["toggle"]("is-editing-mode", this["_isEditing"]),
        this["_updateEditButtonState"]());
      const v674 = this["el"]["querySelector"](".v2-storyboard-hint");
      v674 &&
        (v674["textContent"] = this["_isEditing"]
          ? "拖拽单元格进行互换，或拖出生成新图"
          : "双击进入分镜编辑");
      if (this["_isEditingOnlyDisplayUpdate"](v673, this["_data"])) {
        (this["_syncBackdropImage"](),
          this["_updateGridGapButtonState"](),
          this["_updateCustomGridButtonState"]());
        return;
      }
    }
    const v675 = this["el"]["querySelector"](".act-aspect span"),
      v676 = this["el"]["querySelector"](".act-grid span");
    v675 &&
      v672["aspectRatio"] !== v673["aspectRatio"] &&
      (v675["textContent"] = "比例 " + (v672["aspectRatio"] || "1:1"));
    v676 &&
      (v672["cols"] !== v673["cols"] || v672["rows"] !== v673["rows"]) &&
      (v676["textContent"] =
        "网格\x20" + (v672["cols"] || 2) + "×" + (v672["rows"] || 2));
    if (v672["cols"] === v673["cols"] && v672["rows"] === v673["rows"]) {
      const v677 = v672["cells"] || [],
        v678 = v673["cells"] || [];
      if (this["_cellEls"] && this["_cellEls"]["length"] === v677["length"]) {
        const v679 = this["_buildReusableCellImageMap"]();
        v677["forEach"]((v680, v681) => {
          const v682 = v678[v681],
            v683 = this["_getCellDisplayImageUrl"](v682),
            v684 = this["_getCellDisplayImageUrl"](v680),
            v685 = this["_isCellEmpty"](v682),
            v686 = this["_isCellEmpty"](v680),
            v687 = this["_getCellSourceImageUrl"](v682),
            v688 = this["_getCellSourceImageUrl"](v680),
            v689 = this["_getCellLiveSourceImageUrl"](v682),
            v690 = this["_getCellLiveSourceImageUrl"](v680),
            v691 =
              v687 !== v688 ||
              v689 !== v690 ||
              v682?.["storyboardSourceIndex"] !==
                v680?.["storyboardSourceIndex"] ||
              v682?.["storyboardSourceCrop"] !==
                v680?.["storyboardSourceCrop"] ||
              v682?.["storyboardPiece"] !== v680?.["storyboardPiece"] ||
              v682?.["storyboardLockedCell"] !==
                v680?.["storyboardLockedCell"] ||
              v682?.["sourceWidth"] !== v680?.["sourceWidth"] ||
              v682?.["sourceHeight"] !== v680?.["sourceHeight"];
          if (!v682 || v685 !== v686 || v684 !== v683)
            this["_updateCellDOM"](this["_cellEls"][v681], v680, v679);
          else
            v691 &&
              this["_applyCellCropStyles"](this["_cellEls"][v681], v680, v681);
        });
      } else this["_renderCells"]();
    } else this["_rebuildGrid"](v672["cols"], v672["rows"], v672["cells"]);
    (this["_syncBackdropImage"](), this["_syncCustomGridOverlay"]());
    if (this["_isCustomGridEditing"]) this["_setCustomGridHint"](true);
    (this["_updateGridGapButtonState"](),
      this["_updateCustomGridButtonState"]());
  }
  ["_rebuildGrid"](v692, v693, v694) {
    const v695 = this["el"]["querySelector"](".cells-grid");
    if (!v695) return;
    ((this["_grid"] = v695), v695["replaceChildren"]());
    const v696 = v694 || [],
      v697 = [];
    for (let v698 = 0; v698 < v696["length"]; v698++) {
      const v699 = document["createElement"]("div");
      ((v699["className"] = "sb-cell"),
        (v699["id"] = "cell-" + this["id"] + "-" + v698),
        (v699["dataset"]["index"] = String(v698)),
        Object["assign"](v699["style"], {
          position: "relative",
          background: "var(--bg-node)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }));
      const v700 = document["createElement"]("div");
      ((v700["className"] = "cell-content-wrap"),
        Object["assign"](v700["style"], {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }),
        v700["appendChild"](this["_createCellContentNode"](v696[v698], v698)));
      const v701 = document["createElement"]("div");
      ((v701["className"] = "cell-overlay"),
        Object["assign"](v701["style"], {
          position: "absolute",
          inset: "0",
          pointerEvents: "none",
          border: "1.5px solid transparent",
          transition: "all 0.2s",
        }),
        v699["appendChild"](v700),
        v699["appendChild"](v701),
        v695["appendChild"](v699),
        v697["push"](v699),
        this["_applyCellCropStyles"](v699, v696[v698], v698));
    }
    ((this["_cellEls"] = v697),
      this["_syncBackdropImage"](),
      this["_syncCustomGridOverlay"]());
  }
  ["unmount"]() {
    (this["_exitCustomGridEdit"](),
      this["_closeMenu"](),
      this["_removeCustomGridHandles"]());
  }
}
