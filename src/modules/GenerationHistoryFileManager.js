import {
  deleteAssetFromServer,
  deleteOutputFilesFromServer,
  fetchAssetsFromServer,
  fetchOutputFilesFromServer,
  saveAssetToServer,
} from "../../api/projectsV2Api.js";
import appStore from "../core/stores/appStore.js";
import {
  findAvailablePosition,
  generateId,
  screenToWorld,
} from "../core/math.js";
import { getNodeDefaultSize } from "../services/fileService.js";
import {
  GENERATION_HISTORY_EVENT,
  GENERATION_HISTORY_MEDIA_KINDS,
  buildGenerationHistoryAssetsFromNode,
  isGenerationHistoryAsset,
} from "./generationHistoryAssets.js";
import { normalizeFileManagerSourceNodeForCanvas } from "./generationHistoryFileManagerSizing.js";
import {
  buildFileManagerHistoryMediaKey,
  buildFileManagerHistoryRecordKey,
  getFileManagerMenuActions,
  getFileManagerSelectionAfterClick,
  isFileManagerHistoryRecordVisible,
  isActionableFileManagerMediaKind,
} from "./generationHistoryFileManagerSelection.js";
import { registerSidebarSubmenu } from "./sidebarSubmenuController.js";
import { showContextMenu } from "./interaction/contextMenuPresenter.js";
import { openImagePreview, openVideoPreview } from "./imagePreview.js";
import {
  canShowItemInFolder,
  showItemInFolder,
} from "../services/nativeFileActionService.js";
import { localPathToUrl, normalizeLocalPath } from "../utils/localMediaPath.js";
const FILE_FILTERS = Object["freeze"]([
    { key: "all", label: "所有" },
    { key: "image", label: "图像" },
    { key: "video", label: "视频" },
    { key: "audio", label: "声音" },
  ]),
  FILE_SOURCES = Object["freeze"]([
    { key: "current-canvas", label: "当前画布生成" },
    { key: "history", label: "历史生成" },
    { key: "output", label: "输出文件夹" },
  ]),
  FILE_MANAGER_SIDEBAR_KEY = "files",
  FILE_MANAGER_KEEP_OPEN_SELECTOR =
    '[data-sidebar-submenu-owner="' +
    FILE_MANAGER_SIDEBAR_KEY +
    '"], #file-manager-delete-confirm-overlay',
  FILE_PANEL_RESIZE = Object["freeze"]({
    minWidth: 560,
    defaultWidth: 760,
    maxViewportGap: 24,
  }),
  FILE_MASONRY = Object["freeze"]({
    gap: 16,
    placementStep: 8,
    fixedShortSide: 150,
    defaultShortSide: 260,
    maxLongSide: 560,
  }),
  FILE_HISTORY_PAGE_SIZE = 80,
  FILE_HISTORY_SCROLL_PREFETCH_PX = 360;
function isHistorySource(v0) {
  const v1 = String(v0 || "")["trim"]();
  return v1 === "current-canvas" || v1 === "history";
}
function sortByUpdatedAt(v2) {
  return [...(Array["isArray"](v2) ? v2 : [])]["sort"]((v3, v4) => {
    const v5 = Number(v3?.["updatedAt"] || v3?.["createdAt"] || 0),
      v6 = Number(v4?.["updatedAt"] || v4?.["createdAt"] || 0);
    return v6 - v5;
  });
}
function normalizeProjectId(v7) {
  return String(v7 || "")["trim"]() || "default_v2_project";
}
function resolveThumbSrc(v8) {
  if (!resolveMediaSrc(v8)) return "";
  const v9 = Array["isArray"](v8?.["items"]) ? v8["items"][0] : null,
    v10 = Array["isArray"](v8?.["nodes"]) ? v8["nodes"][0] : null;
  return String(
    v8?.["coverUrl"] ||
      v9?.["thumbSrc"] ||
      v10?.["thumbUrl"] ||
      v10?.["videoThumbSrc"] ||
      v10?.["imageUrl"] ||
      v10?.["videoUrl"] ||
      v10?.["src"] ||
      "",
  )["trim"]();
}
function resolveMediaSrc(v11) {
  const v12 = Array["isArray"](v11?.["nodes"]) ? v11["nodes"][0] : null;
  return String(
    v12?.["imageUrl"] ||
      v12?.["sourceUrl"] ||
      v12?.["videoUrl"] ||
      v12?.["audioUrl"] ||
      v12?.["src"] ||
      "",
  )["trim"]();
}
function getRecordMediaKind(v13) {
  const v14 = String(v13?.["mediaKind"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (
    v14 === "image" ||
    v14 === "video" ||
    v14 === "audio" ||
    v14 === "folder" ||
    v14 === "file"
  )
    return v14;
  const v15 = String(v13?.["coverType"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (
    v15 === "image" ||
    v15 === "video" ||
    v15 === "audio" ||
    v15 === "folder" ||
    v15 === "file"
  )
    return v15;
  const v16 = Array["isArray"](v13?.["nodes"]) ? v13["nodes"][0] : null,
    v17 = String(v16?.["type"] || "")
      ["trim"]()
      ["toLowerCase"]();
  if (v17["includes"]("video")) return "video";
  if (v17["includes"]("audio")) return "audio";
  return "image";
}
function getMediaLabel(v18) {
  if (v18 === "video") return "视频";
  if (v18 === "audio") return "声音";
  if (v18 === "folder") return "文件夹";
  return "图像";
}
function isSupportedOutputMediaKind(v19) {
  return isActionableFileManagerMediaKind(v19);
}
function isFileManagerActionableRecord(v20) {
  const v21 = getRecordMediaKind(v20);
  if (!isSupportedOutputMediaKind(v21)) return false;
  return Array["isArray"](v20?.["nodes"]) && v20["nodes"]["length"] > 0;
}
function resolveRecordLocalPath(v22) {
  const v23 = Array["isArray"](v22?.["nodes"]) ? v22["nodes"][0] : null;
  return normalizeLocalPath(
    v22?.["localPath"] ||
      v22?.["outputItem"]?.["localPath"] ||
      v23?.["originalLocalPath"] ||
      v23?.["localPath"] ||
      v23?.["displayLocalPath"] ||
      v23?.["thumbLocalPath"] ||
      v23?.["src"] ||
      v23?.["imageUrl"] ||
      v23?.["videoUrl"] ||
      v23?.["audioUrl"],
  );
}
function buildHistoryRecordIdentityKey(v24) {
  return buildFileManagerHistoryMediaKey({
    projectId: normalizeProjectId(v24?.["projectId"]),
    canvasId: String(v24?.["canvasId"] || "")["trim"](),
    mediaKind: getRecordMediaKind(v24),
    localPath: resolveRecordLocalPath(v24),
    resultFingerprint: v24?.["resultFingerprint"],
  });
}
function dedupeHistoryRecords(v25) {
  const v26 = new Set(),
    v27 = [];
  for (const v28 of sortByUpdatedAt(v25)) {
    const v29 = buildHistoryRecordIdentityKey(v28);
    if (v29 && v26["has"](v29)) continue;
    if (v29) v26["add"](v29);
    v27["push"](v28);
  }
  return v27;
}
function getOutputRecordIdForItem(v30) {
  if (v30?.["isDir"]) return "folder:" + String(v30?.["relPath"] || "");
  if (
    isSupportedOutputMediaKind(
      String(v30?.["mediaKind"] || "")
        ["trim"]()
        ["toLowerCase"](),
    )
  )
    return "output:" + String(v30?.["relPath"] || v30?.["localPath"] || "");
  return "file:" + String(v30?.["relPath"] || v30?.["name"] || "");
}
function outputFileToRecord(v31) {
  const v32 = String(v31?.["mediaKind"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (!isSupportedOutputMediaKind(v32)) return null;
  const v33 = normalizeLocalPath(v31?.["localPath"] || v31?.["url"]),
    v34 = String(v31?.["url"] || localPathToUrl(v33))["trim"]();
  if (!v34) return null;
  const v35 = normalizeLocalPath(v31?.["displayLocalPath"]),
    v36 = normalizeLocalPath(v31?.["thumbLocalPath"]),
    v37 = localPathToUrl(v35),
    v38 = localPathToUrl(v36),
    v39 =
      String(v31?.["name"] || "")["trim"]() ||
      v33["split"](/[\\/]/)["pop"]() ||
      "输出文件",
    v40 =
      v32 === "video"
        ? "source-video"
        : v32 === "audio"
          ? "source-audio"
          : "source-image",
    v41 =
      Number(
        v31?.["videoWidth"] || v31?.["originalWidth"] || v31?.["width"] || 0,
      ) || 0,
    v42 =
      Number(
        v31?.["videoHeight"] || v31?.["originalHeight"] || v31?.["height"] || 0,
      ) || 0,
    v43 = {
      id:
        v40 +
        "-output-" +
        String(v31?.["relPath"] || v33)["replace"](/[^\w-]+/g, "_"),
      type: v40,
      name: v39,
      x: 0,
      y: 0,
      ...getNodeDefaultSize(v40),
      src: v34,
      localPath: v33,
      displayLocalPath: v35,
      thumbLocalPath: v36,
      fileName: v39,
      needsAutoResize: v32 !== "audio",
    };
  if (v32 === "image")
    ((v43["imageUrl"] = v34),
      (v43["sourceUrl"] = v34),
      (v43["thumbUrl"] = v38),
      v41 > 0 && ((v43["originalWidth"] = v41), (v43["imageWidth"] = v41)),
      v42 > 0 && ((v43["originalHeight"] = v42), (v43["imageHeight"] = v42)));
  else {
    if (v32 === "video") {
      ((v43["videoUrl"] = v34),
        (v43["thumbUrl"] = v38),
        (v43["videoThumbSrc"] = v38));
      if (v41 > 0) v43["videoWidth"] = v41;
      if (v42 > 0) v43["videoHeight"] = v42;
      if (Number(v31?.["duration"] || 0) > 0)
        v43["duration"] = Number(v31["duration"]);
    } else v32 === "audio" && (v43["audioUrl"] = v34);
  }
  return {
    id: "output:" + String(v31?.["relPath"] || v33),
    mediaKind: v32,
    coverType: v32,
    coverUrl: v32 === "audio" ? "" : v38 || v37 || v34,
    name: v39,
    localPath: v33,
    updatedAt: Number(v31?.["mtime"] || 0) || 0,
    nodes: [v43],
  };
}
function outputFileToDisplayRecord(v44) {
  if (v44?.["isDir"])
    return {
      id: "folder:" + String(v44?.["relPath"] || v44?.["name"] || ""),
      mediaKind: "folder",
      coverType: "folder",
      name: String(v44?.["name"] || "文件夹"),
      updatedAt: Number(v44?.["mtime"] || 0) || 0,
      outputItem: v44,
      nodes: [],
    };
  const v45 = outputFileToRecord(v44);
  if (v45) return { ...v45, outputItem: v44 };
  return {
    id: "file:" + String(v44?.["relPath"] || v44?.["name"] || ""),
    mediaKind: "file",
    coverType: "file",
    name: String(v44?.["name"] || "文件"),
    updatedAt: Number(v44?.["mtime"] || 0) || 0,
    outputItem: v44,
    nodes: [],
  };
}
function resolveRecordSize(v46, v47) {
  const v48 = Array["isArray"](v46?.["nodes"]) ? v46["nodes"][0] : null,
    v49 = Array["isArray"](v46?.["items"]) ? v46["items"][0] : null,
    v50 = v49?.["nodeData"] || {},
    v51 =
      Number(
        v48?.["videoWidth"] ||
          v48?.["imageWidth"] ||
          v48?.["originalWidth"] ||
          v48?.["width"] ||
          v50["width"] ||
          0,
      ) || 0,
    v52 =
      Number(
        v48?.["videoHeight"] ||
          v48?.["imageHeight"] ||
          v48?.["originalHeight"] ||
          v48?.["height"] ||
          v50["height"] ||
          0,
      ) || 0;
  if (v51 > 0 && v52 > 0) return { width: v51, height: v52 };
  if (v47 === GENERATION_HISTORY_MEDIA_KINDS["VIDEO"])
    return {
      width: Math["round"]((FILE_MASONRY["defaultShortSide"] * 16) / 9),
      height: FILE_MASONRY["defaultShortSide"],
    };
  if (v47 === GENERATION_HISTORY_MEDIA_KINDS["AUDIO"])
    return { width: 320, height: 140 };
  if (v47 === "folder") return { width: 150, height: 118 };
  if (v47 === "file") return { width: 150, height: 132 };
  return {
    width: FILE_MASONRY["defaultShortSide"],
    height: FILE_MASONRY["defaultShortSide"],
  };
}
function resolveRecordAspect(v53, v54) {
  const { width: v55, height: v56 } = resolveRecordSize(v53, v54);
  return v55 + " / " + v56;
}
class GenerationHistoryFileManager {
  constructor() {
    ((this["panel"] = null),
      (this["contentEl"] = null),
      (this["records"] = []),
      (this["_loading"] = false),
      (this["_savingIds"] = new Set()),
      (this["_savingRecordKeys"] = new Set()),
      (this["_backfillInFlight"] = false),
      (this["_activeFilter"] = "all"),
      (this["_activeSource"] = "current-canvas"),
      (this["_sortOrder"] = "desc"),
      (this["outputItems"] = []),
      (this["_outputDir"] = ""),
      (this["_outputParent"] = ""),
      (this["_outputBreadcrumbs"] = [{ name: "output", dir: "" }]),
      (this["_outputLoading"] = false),
      (this["_outputLoaded"] = false),
      (this["_panelWidth"] = 0),
      (this["_resizeState"] = null),
      (this["_recordsLoaded"] = false),
      (this["_recordsDirty"] = false),
      (this["_nextOffset"] = 0),
      (this["_hasMore"] = true),
      (this["_totalRecords"] = 0),
      (this["_loadToken"] = 0),
      (this["_selectedRecordIds"] = new Set()),
      (this["_selectionDrag"] = null),
      (this["_suppressNextClick"] = false),
      this["_initPanel"](),
      this["_bindButton"](),
      this["_bindGenerationEvents"]());
  }
  ["_isOpen"]() {
    return this["panel"]?.["classList"]["contains"]("show") === true;
  }
  ["_getCurrentProjectId"]() {
    return normalizeProjectId(window["currentProjectId"]);
  }
  ["_getCurrentCanvasId"]() {
    const v57 = window["CanvasTabManager"];
    return (
      String(v57?.["getActiveCanvasId"]?.() || "")["trim"]() ||
      String(v57?.["_activeId"] || "")["trim"]() ||
      "canvas_1"
    );
  }
  ["_getCanvasCenterWorld"]() {
    const { viewport: v58 } = appStore["getState"](),
      v59 = window["innerWidth"] / 2,
      v60 = window["innerHeight"] / 2,
      v61 =
        document["documentElement"]?.["clientWidth"] ||
        window["innerWidth"] ||
        0,
      v62 =
        document["documentElement"]?.["clientHeight"] ||
        window["innerHeight"] ||
        0;
    if (!v61 || !v62) return screenToWorld(v59, v60, v58);
    let v63 = 0,
      v64 = 0,
      v65 = v61,
      v66 = v62;
    const v67 = [],
      v68 = document["querySelector"]("header"),
      v69 = document["querySelector"](".sidebar-floating");
    if (v68) v67["push"](v68);
    if (v69) v67["push"](v69);
    if (this["panel"]?.["classList"]["contains"]("show"))
      v67["push"](this["panel"]);
    const v70 = 8;
    for (const v71 of v67) {
      if (!v71?.["isConnected"]) continue;
      const v72 = v71["getBoundingClientRect"](),
        v73 = Math["max"](v63, v72["left"]),
        v74 = Math["max"](v64, v72["top"]),
        v75 = Math["min"](v65, v72["right"]),
        v76 = Math["min"](v66, v72["bottom"]);
      if (v75 <= v73 || v76 <= v74) continue;
      if (v72["left"] <= v63 + v70 && v72["right"] > v63 + v70) {
        v63 = Math["max"](v63, v72["right"]);
        continue;
      }
      if (v72["right"] >= v65 - v70 && v72["left"] < v65 - v70) {
        v65 = Math["min"](v65, v72["left"]);
        continue;
      }
      if (v72["top"] <= v64 + v70 && v72["bottom"] > v64 + v70) {
        v64 = Math["max"](v64, v72["bottom"]);
        continue;
      }
      v72["bottom"] >= v66 - v70 &&
        v72["top"] < v66 - v70 &&
        (v66 = Math["min"](v66, v72["top"]));
    }
    const v77 = v65 - v63,
      v78 = v66 - v64,
      v79 = v77 > 40 ? v63 + v77 / 2 : v59,
      v80 = v78 > 40 ? v64 + v78 / 2 : v60;
    return screenToWorld(v79, v80, v58);
  }
  ["_hasRecord"](v81, v82, v83, v84 = "", v85 = "") {
    const v86 = buildFileManagerHistoryRecordKey({
        projectId: normalizeProjectId(v81),
        canvasId: String(v82 || "")["trim"](),
        resultFingerprint: v83,
      }),
      v87 = buildFileManagerHistoryMediaKey({
        projectId: normalizeProjectId(v81),
        canvasId: String(v82 || "")["trim"](),
        mediaKind: v85,
        localPath: v84,
        resultFingerprint: v83,
      });
    if (!String(v83 || "")["trim"]() && !String(v84 || "")["trim"]())
      return false;
    return this["records"]["some"](
      (v88) =>
        buildHistoryRecordIdentityKey(v88) === v87 ||
        buildFileManagerHistoryRecordKey({
          projectId: normalizeProjectId(v88?.["projectId"]),
          canvasId: String(v88?.["canvasId"] || "")["trim"](),
          resultFingerprint: v88?.["resultFingerprint"],
        }) === v86,
    );
  }
  ["_visibleRecords"]() {
    if (this["_activeSource"] === "output")
      return this["_visibleOutputRecords"]();
    const v89 = this["_getCurrentProjectId"](),
      v90 = this["_getCurrentCanvasId"](),
      v91 =
        this["_sortOrder"] === "asc"
          ? dedupeHistoryRecords(this["records"])["reverse"]()
          : dedupeHistoryRecords(this["records"]);
    return v91["filter"]((v92) =>
      isFileManagerHistoryRecordVisible({
        record: v92,
        source: this["_activeSource"],
        projectId: v89,
        canvasId: v90,
        activeFilter: this["_activeFilter"],
        getMediaKind: getRecordMediaKind,
      }),
    );
  }
  ["_visibleOutputRecords"]() {
    const v93 = (
      Array["isArray"](this["outputItems"]) ? this["outputItems"] : []
    )
      ["map"](outputFileToDisplayRecord)
      ["filter"](Boolean)
      ["filter"]((v94) => {
        const v95 = getRecordMediaKind(v94);
        if (v94?.["outputItem"]?.["isDir"]) return true;
        if (this["_activeFilter"] === "all") return v95 !== "file";
        return v95 === this["_activeFilter"];
      });
    return (
      v93["sort"]((v96, v97) => {
        const v98 = v96?.["outputItem"]?.["isDir"] ? 0 : 1,
          v99 = v97?.["outputItem"]?.["isDir"] ? 0 : 1;
        if (v98 !== v99) return v98 - v99;
        const v100 = Number(v96?.["updatedAt"] || 0),
          v101 = Number(v97?.["updatedAt"] || 0),
          v102 = this["_sortOrder"] === "asc" ? v100 - v101 : v101 - v100;
        if (v102 !== 0) return v102;
        return String(v96?.["name"] || "")["localeCompare"](
          String(v97?.["name"] || ""),
          "zh-CN",
        );
      }),
      v93
    );
  }
  ["_findVisibleRecordById"](v103) {
    const v104 = String(v103 || "");
    if (!v104) return null;
    return (
      this["_visibleRecords"]()["find"](
        (v105) => String(v105?.["id"] || "") === v104,
      ) || null
    );
  }
  ["_findOutputItemByRecordId"](v106) {
    const v107 = String(v106 || "");
    if (!v107) return null;
    return (
      (Array["isArray"](this["outputItems"]) ? this["outputItems"] : [])[
        "find"
      ]((v108) => getOutputRecordIdForItem(v108) === v107) || null
    );
  }
  ["_clearSelection"]() {
    if (this["_selectedRecordIds"]["size"] === 0) return;
    (this["_selectedRecordIds"]["clear"](), this["_syncSelectionClasses"]());
  }
  ["_selectRecord"](v109, { shiftKey: shiftKey = false } = {}) {
    const v110 = this["_findVisibleRecordById"](v109),
      v111 = getFileManagerSelectionAfterClick({
        current: Array["from"](this["_selectedRecordIds"]),
        recordId: v109,
        shiftKey: shiftKey,
        actionable: isFileManagerActionableRecord(v110),
      });
    ((this["_selectedRecordIds"] = new Set(v111)),
      this["_syncSelectionClasses"]());
  }
  ["_setSelection"](v112) {
    const v113 = (Array["isArray"](v112) ? v112 : [])["filter"]((v114) =>
      isFileManagerActionableRecord(this["_findVisibleRecordById"](v114)),
    );
    ((this["_selectedRecordIds"] = new Set(v113)),
      this["_syncSelectionClasses"]());
  }
  ["_syncSelectionClasses"]() {
    if (!this["contentEl"]) return;
    this["contentEl"]
      ["querySelectorAll"](".v2-file-history-card")
      ["forEach"]((v115) => {
        v115["classList"]["toggle"](
          "is-selected",
          this["_selectedRecordIds"]["has"](
            String(v115["dataset"]["recordId"] || ""),
          ),
        );
      });
  }
  ["_pruneSelectionToVisibleRecords"]() {
    if (this["_selectedRecordIds"]["size"] === 0) return;
    const v116 = new Set(
      this["_visibleRecords"]()
        ["filter"](isFileManagerActionableRecord)
        ["map"]((v117) => String(v117?.["id"] || "")),
    );
    let v118 = false;
    for (const v119 of Array["from"](this["_selectedRecordIds"])) {
      !v116["has"](v119) &&
        (this["_selectedRecordIds"]["delete"](v119), (v118 = true));
    }
    if (v118) this["_syncSelectionClasses"]();
  }
  ["_initPanel"]() {
    ((this["panel"] = document["createElement"]("div")),
      (this["panel"]["className"] = "v2-file-history-panel"),
      this["panel"]["setAttribute"]("aria-label", "文件管理"),
      (this["panel"]["innerHTML"] =
        '\n      <div class="v2-file-history-header">\n        <div class="v2-file-history-title">文件管理</div>\n        <div class="v2-file-history-source-tabs" role="tablist" aria-label="文件来源"></div>\n        <div class="v2-file-history-subtitle"></div>\n        <div class="v2-file-history-toolbar">\n        <div class="v2-file-history-filters" role="tablist" aria-label="文件类型筛选"></div>\n          <div class="v2-file-history-order" role="tablist" aria-label="排序"></div>\n        </div>\n        <div class="v2-file-history-breadcrumbs"></div>\n      </div>\n      <div class="v2-file-history-content"></div>\n      <div class="v2-file-history-resize-handle" aria-hidden="true"></div>\n    '),
      (this["contentEl"] = this["panel"]["querySelector"](
        ".v2-file-history-content",
      )),
      (this["sourceTabsEl"] = this["panel"]["querySelector"](
        ".v2-file-history-source-tabs",
      )),
      (this["subtitleEl"] = this["panel"]["querySelector"](
        ".v2-file-history-subtitle",
      )),
      (this["filterEl"] = this["panel"]["querySelector"](
        ".v2-file-history-filters",
      )),
      (this["orderEl"] = this["panel"]["querySelector"](
        ".v2-file-history-order",
      )),
      (this["breadcrumbsEl"] = this["panel"]["querySelector"](
        ".v2-file-history-breadcrumbs",
      )),
      (this["resizeHandleEl"] = this["panel"]["querySelector"](
        ".v2-file-history-resize-handle",
      )),
      this["_bindContentWheelGuard"](),
      this["_bindContentPaging"](),
      this["_bindMarqueeSelection"](),
      this["_bindContextMenu"](),
      this["_bindDoubleClickToCanvas"](),
      this["panel"]["addEventListener"]("click", (v120) => {
        if (this["_suppressNextClick"]) {
          (v120["preventDefault"](),
            v120["stopPropagation"](),
            (this["_suppressNextClick"] = false));
          return;
        }
        const v121 = v120["target"]["closest"]("[data-file-action]"),
          v122 = v121?.["dataset"]?.["fileAction"] || "";
        if (v122 === "filter") {
          (v120["preventDefault"](), v120["stopPropagation"]());
          const v123 = String(v121["dataset"]["filter"] || "all")["trim"]();
          FILE_FILTERS["some"]((v124) => v124["key"] === v123) &&
            v123 !== this["_activeFilter"] &&
            ((this["_activeFilter"] = v123),
            this["_clearSelection"](),
            this["render"](),
            isHistorySource(this["_activeSource"]) &&
              (this["_resetPageState"](),
              void this["loadRecords"]({ reset: true })));
          return;
        }
        if (v122 === "source") {
          (v120["preventDefault"](), v120["stopPropagation"]());
          const v125 = String(v121["dataset"]["source"] || "history")["trim"]();
          if (
            FILE_SOURCES["some"]((v126) => v126["key"] === v125) &&
            v125 !== this["_activeSource"]
          ) {
            ((this["_activeSource"] = v125),
              this["_clearSelection"](),
              this["render"]());
            if (isHistorySource(v125))
              void this["loadRecords"]({
                backfillAfterLoad: true,
                reset: true,
              });
            else
              v125 === "output" &&
                !this["_outputLoaded"] &&
                void this["loadOutputFiles"]({ dir: this["_outputDir"] });
          }
          return;
        }
        if (v122 === "order") {
          (v120["preventDefault"](),
            v120["stopPropagation"](),
            (this["_sortOrder"] =
              this["_sortOrder"] === "asc" ? "desc" : "asc"),
            this["_clearSelection"](),
            this["render"]());
          isHistorySource(this["_activeSource"])
            ? (this["_resetPageState"](),
              void this["loadRecords"]({ reset: true }))
            : void this["loadOutputFiles"]({ dir: this["_outputDir"] });
          return;
        }
        if (v122 === "output-dir") {
          (v120["preventDefault"](),
            v120["stopPropagation"](),
            this["_clearSelection"](),
            void this["loadOutputFiles"]({
              dir: v121["dataset"]["dir"] || "",
            }));
          return;
        }
        const v127 = v120["target"]["closest"](".v2-file-history-card");
        if (!v127 || !v127["dataset"]["recordId"]) return;
        if (this["_activeSource"] === "output") {
          const v128 = this["_findOutputItemByRecordId"](
            v127["dataset"]["recordId"],
          );
          if (v128?.["isDir"]) {
            void this["loadOutputFiles"]({
              dir: v128["dir"] || v128["relPath"] || "",
            });
            return;
          }
        }
        this["_selectRecord"](v127["dataset"]["recordId"], {
          shiftKey: v120["shiftKey"],
        });
      }));
    const v129 =
      document["querySelector"](".sidebar-floating") || document["body"];
    (v129["appendChild"](this["panel"]), this["_bindResizeHandle"]());
  }
  ["_bindContentWheelGuard"]() {
    if (!this["panel"] || !this["contentEl"]) return;
    this["panel"]["addEventListener"](
      "wheel",
      (v130) => {
        if (!this["panel"]?.["classList"]["contains"]("show")) return;
        (v130["stopPropagation"](), v130["stopImmediatePropagation"]?.());
      },
      { passive: false, capture: true },
    );
  }
  ["_bindContentPaging"]() {
    if (!this["contentEl"]) return;
    this["contentEl"]["addEventListener"](
      "scroll",
      () => {
        if (
          !this["_isOpen"]() ||
          !isHistorySource(this["_activeSource"]) ||
          this["_loading"] ||
          !this["_hasMore"] ||
          !this["_recordsLoaded"]
        )
          return;
        const v131 =
          this["contentEl"]["scrollHeight"] -
          this["contentEl"]["scrollTop"] -
          this["contentEl"]["clientHeight"];
        v131 <= FILE_HISTORY_SCROLL_PREFETCH_PX &&
          void this["loadRecords"]({ reset: false });
      },
      { passive: true },
    );
  }
  ["_bindMarqueeSelection"]() {
    if (!this["contentEl"]) return;
    this["contentEl"]["addEventListener"]("pointerdown", (v132) => {
      if (v132["button"] !== 0 || !this["_isOpen"]()) return;
      if (
        v132["target"]["closest"](
          "[data-file-action], .v2-file-history-resize-handle",
        )
      )
        return;
      const v133 = v132["clientX"],
        v134 = v132["clientY"],
        v135 = { startX: v133, startY: v134, active: false, marqueeEl: null };
      this["_selectionDrag"] = v135;
      const v136 = (v137) => {
          if (this["_selectionDrag"] !== v135) return;
          const v138 = v137["clientX"] - v133,
            v139 = v137["clientY"] - v134;
          if (!v135["active"] && Math["hypot"](v138, v139) < 6) return;
          !v135["active"] &&
            ((v135["active"] = true),
            (v135["marqueeEl"] = document["createElement"]("div")),
            (v135["marqueeEl"]["className"] = "v2-file-history-marquee"),
            this["contentEl"]["appendChild"](v135["marqueeEl"]));
          const v140 = this["contentEl"]["getBoundingClientRect"](),
            v141 =
              Math["min"](v133, v137["clientX"]) -
              v140["left"] +
              this["contentEl"]["scrollLeft"],
            v142 =
              Math["min"](v134, v137["clientY"]) -
              v140["top"] +
              this["contentEl"]["scrollTop"],
            v143 = Math["abs"](v137["clientX"] - v133),
            v144 = Math["abs"](v137["clientY"] - v134);
          Object["assign"](v135["marqueeEl"]["style"], {
            left: v141 + "px",
            top: v142 + "px",
            width: v143 + "px",
            height: v144 + "px",
          });
        },
        v145 = () => {
          (window["removeEventListener"]("pointermove", v136, true),
            window["removeEventListener"]("pointerup", v145, true),
            window["removeEventListener"]("pointercancel", v145, true));
          if (this["_selectionDrag"] !== v135) return;
          this["_selectionDrag"] = null;
          if (!v135["active"] || !v135["marqueeEl"]) return;
          const v146 = v135["marqueeEl"]["getBoundingClientRect"](),
            v147 = Array["from"](
              this["contentEl"]["querySelectorAll"](".v2-file-history-card"),
            )
              ["filter"]((v148) => {
                const v149 = v148["getBoundingClientRect"]();
                return !(
                  v149["right"] < v146["left"] ||
                  v149["left"] > v146["right"] ||
                  v149["bottom"] < v146["top"] ||
                  v149["top"] > v146["bottom"]
                );
              })
              ["map"]((v150) => String(v150["dataset"]["recordId"] || ""))
              ["filter"](Boolean);
          (v135["marqueeEl"]["remove"](),
            (this["_suppressNextClick"] = true),
            this["_setSelection"](v147));
        };
      (window["addEventListener"]("pointermove", v136, true),
        window["addEventListener"]("pointerup", v145, true),
        window["addEventListener"]("pointercancel", v145, true));
    });
  }
  ["_bindContextMenu"]() {
    if (!this["panel"]) return;
    this["panel"]["addEventListener"]("contextmenu", (v151) => {
      const v152 = v151["target"]["closest"](".v2-file-history-card");
      if (!v152 || !this["panel"]["contains"](v152)) return;
      (v151["preventDefault"](), v151["stopPropagation"]());
      const v153 = String(v152["dataset"]["recordId"] || ""),
        v154 = this["_findVisibleRecordById"](v153);
      if (!isFileManagerActionableRecord(v154)) return;
      if (!this["_selectedRecordIds"]["has"](v153))
        this["_setSelection"]([v153]);
      const v155 = this["_getSelectedRecords"](),
        v156 = this["_buildContextMenuItems"](v155);
      if (v156["length"] === 0) return;
      showContextMenu(v151["clientX"], v151["clientY"], v156, {
        includeNodePicker: false,
        sidebarSubmenuOwner: FILE_MANAGER_SIDEBAR_KEY,
      });
    });
  }
  ["_bindDoubleClickToCanvas"]() {
    if (!this["panel"]) return;
    this["panel"]["addEventListener"]("dblclick", (v157) => {
      const v158 = v157["target"]["closest"](".v2-file-history-card");
      if (!v158 || !this["panel"]["contains"](v158)) return;
      const v159 = String(v158["dataset"]["recordId"] || ""),
        v160 = this["_findVisibleRecordById"](v159);
      if (!isFileManagerActionableRecord(v160)) return;
      (v157["preventDefault"](), v157["stopPropagation"]());
      const v161 =
        this["_selectedRecordIds"]["has"](v159) &&
        this["_getSelectedRecords"]()["length"] > 0
          ? this["_getSelectedRecords"]()
          : [v160];
      this["restoreRecordsToCanvas"](v161);
    });
  }
  ["_getSelectedRecords"]() {
    const v162 = this["_visibleRecords"](),
      v163 = this["_selectedRecordIds"];
    return v162["filter"]((v164) => v163["has"](String(v164?.["id"] || "")));
  }
  ["_buildContextMenuItems"](v165) {
    const v166 = (Array["isArray"](v165) ? v165 : [])["filter"](
        isFileManagerActionableRecord,
      ),
      v167 = v166[0] || null,
      v168 = v166["length"] === 1 ? resolveRecordLocalPath(v167) : "",
      v169 = getFileManagerMenuActions({
        records: v166,
        canRevealInFolder: canShowItemInFolder(v168),
        getMediaKind: getRecordMediaKind,
        isActionableRecord: isFileManagerActionableRecord,
      }),
      v170 = [];
    for (const v171 of v169) {
      if (v171 === "delete" && v170["length"] > 0) v170["push"]("sep");
      if (v171 === "add-to-canvas")
        v170["push"]({
          label:
            v166["length"] > 1
              ? "添加\x20" + v166["length"] + "\x20个到画布"
              : "添加到画布",
          action: () => this["restoreRecordsToCanvas"](v166),
        });
      else {
        if (v171 === "fullscreen")
          v170["push"]({
            label: "全屏放大",
            action: () => this["_openRecordPreview"](v167),
          });
        else {
          if (v171 === "reveal")
            v170["push"]({
              label: "打开资源管理器",
              action: () => this["_showRecordInFolder"](v167),
            });
          else
            v171 === "delete" &&
              v170["push"]({
                label:
                  v166["length"] > 1
                    ? "删除 " + v166["length"] + "\x20个"
                    : "删除",
                action: () => void this["_deleteRecords"](v166),
              });
        }
      }
    }
    return v170;
  }
  ["_clampContentScroll"]() {
    if (!this["contentEl"]) return;
    const v172 = Math["max"](
      0,
      this["contentEl"]["scrollHeight"] - this["contentEl"]["clientHeight"],
    );
    if (v172 <= 0) {
      this["contentEl"]["scrollTop"] = 0;
      return;
    }
    this["contentEl"]["scrollTop"] > v172 &&
      (this["contentEl"]["scrollTop"] = v172);
  }
  ["_bindResizeHandle"]() {
    if (!this["panel"] || !this["resizeHandleEl"]) return;
    const v173 = () => {
        if (!this["_resizeState"]) return;
        (window["removeEventListener"]("pointermove", v174, true),
          window["removeEventListener"]("pointerup", v173, true),
          window["removeEventListener"]("pointercancel", v173, true),
          this["panel"]["classList"]["remove"]("is-resizing"),
          (this["_resizeState"] = null));
      },
      v174 = (v175) => {
        if (!this["_resizeState"]) return;
        v175["preventDefault"]();
        const v176 = Math["max"](
            FILE_PANEL_RESIZE["minWidth"],
            window["innerWidth"] -
              this["_resizeState"]["left"] -
              FILE_PANEL_RESIZE["maxViewportGap"],
          ),
          v177 = Math["max"](
            FILE_PANEL_RESIZE["minWidth"],
            Math["min"](
              v176,
              this["_resizeState"]["startWidth"] +
                v175["clientX"] -
                this["_resizeState"]["startX"],
            ),
          );
        ((this["_panelWidth"] = Math["round"](v177)),
          (this["panel"]["style"]["width"] = this["_panelWidth"] + "px"),
          this["_relayoutMasonry"](),
          this["_clampContentScroll"]());
      };
    this["resizeHandleEl"]["addEventListener"]("pointerdown", (v178) => {
      if (v178["button"] !== 0) return;
      (v178["preventDefault"](), v178["stopPropagation"]());
      const v179 = this["panel"]["getBoundingClientRect"]();
      ((this["_resizeState"] = {
        startX: v178["clientX"],
        startWidth: v179["width"] || FILE_PANEL_RESIZE["defaultWidth"],
        left: v179["left"],
      }),
        this["panel"]["classList"]["add"]("is-resizing"),
        this["resizeHandleEl"]["setPointerCapture"]?.(v178["pointerId"]),
        window["addEventListener"]("pointermove", v174, true),
        window["addEventListener"]("pointerup", v173, true),
        window["addEventListener"]("pointercancel", v173, true));
    });
  }
  ["_bindButton"]() {
    const v180 = document["getElementById"]("btnFiles");
    if (!v180) return;
    const v181 = () => {
      this["show"]();
    };
    registerSidebarSubmenu({
      key: FILE_MANAGER_SIDEBAR_KEY,
      button: v180,
      panel: this["panel"],
      open: v181,
      close: () => this["hide"](),
      isOpen: () => this["panel"]["classList"]["contains"]("show"),
      ignorePointerDown: (v182) =>
        this["_shouldKeepOpenForExternalPointerDown"](v182),
    });
  }
  ["_shouldKeepOpenForExternalPointerDown"](v183) {
    const v184 = v183?.["target"];
    if (!v184?.["closest"]) return false;
    return !!v184["closest"](FILE_MANAGER_KEEP_OPEN_SELECTOR);
  }
  ["_bindGenerationEvents"]() {
    window["addEventListener"](GENERATION_HISTORY_EVENT, (v185) => {
      const v186 = v185?.["detail"] || {},
        v187 = buildGenerationHistoryAssetsFromNode({
          images: Array["isArray"](v186["images"]) ? v186["images"] : [],
          videos: Array["isArray"](v186["videos"]) ? v186["videos"] : [],
          audios: Array["isArray"](v186["audios"]) ? v186["audios"] : [],
          nodeData: v186["nodeData"] || {},
          projectId: this["_getCurrentProjectId"](),
          canvasId: this["_getCurrentCanvasId"](),
          now: Number(v186["createdAt"] || Date["now"]()) || Date["now"](),
        });
      void this["_saveRecords"](v187);
    });
  }
  ["_resetPageState"]() {
    ((this["records"] = []),
      (this["_recordsLoaded"] = false),
      (this["_recordsDirty"] = false),
      (this["_nextOffset"] = 0),
      (this["_hasMore"] = true),
      (this["_totalRecords"] = 0));
    if (this["contentEl"]) this["contentEl"]["scrollTop"] = 0;
  }
  async ["loadOutputFiles"]({ dir: dir = this["_outputDir"] } = {}) {
    ((this["_activeSource"] = "output"),
      (this["_outputLoading"] = true),
      this["render"]());
    try {
      const v188 = await fetchOutputFilesFromServer({
        dir: dir,
        order: this["_sortOrder"],
      });
      ((this["outputItems"] = Array["isArray"](v188?.["items"])
        ? v188["items"]
        : []),
        (this["_outputDir"] = String(v188?.["dir"] || "")["trim"]()),
        (this["_outputParent"] = String(v188?.["parent"] || "")["trim"]()),
        (this["_outputBreadcrumbs"] =
          Array["isArray"](v188?.["breadcrumbs"]) &&
          v188["breadcrumbs"]["length"] > 0
            ? v188["breadcrumbs"]
            : [{ name: "output", dir: "" }]),
        (this["_outputLoaded"] = true));
    } catch (v189) {
      (console["error"](
        "[GenerationHistoryFileManager] 加载输出文件夹失败:",
        v189,
      ),
        (this["outputItems"] = []),
        (this["_outputLoaded"] = true));
    } finally {
      this["_outputLoading"] = false;
      if (this["_isOpen"]()) this["render"]();
    }
  }
  ["_buildAssetPageParams"](v190) {
    const v191 = {
      kind: "generation-history",
      projectId: this["_getCurrentProjectId"](),
      offset: Number(v190) || 0,
      limit: FILE_HISTORY_PAGE_SIZE,
    };
    this["_activeSource"] === "current-canvas" &&
      (v191["canvasId"] = this["_getCurrentCanvasId"]());
    if (this["_activeFilter"] !== "all")
      v191["mediaKind"] = this["_activeFilter"];
    return ((v191["order"] = this["_sortOrder"]), v191);
  }
  ["_normalizeAssetsPageResponse"](v192, v193) {
    if (Array["isArray"](v192))
      return {
        items: v192["filter"](isGenerationHistoryAsset),
        total: v192["length"],
        nextOffset: null,
        hasMore: false,
      };
    const v194 = Array["isArray"](v192?.["items"])
      ? v192["items"]["filter"](isGenerationHistoryAsset)
      : [];
    return {
      items: v194,
      total: Number(v192?.["total"] || 0) || v194["length"],
      nextOffset:
        v192?.["nextOffset"] === null || v192?.["nextOffset"] === undefined
          ? null
          : Number(v192["nextOffset"]) || Number(v193) + v194["length"],
      hasMore: Boolean(v192?.["hasMore"]),
    };
  }
  async ["loadRecords"]({
    backfillAfterLoad: backfillAfterLoad = false,
    reset: reset = false,
  } = {}) {
    if (this["_loading"] && !reset) return;
    if (reset) this["_resetPageState"]();
    if (!this["_hasMore"] && this["_recordsLoaded"]) return;
    const v195 = ++this["_loadToken"];
    this["_loading"] = true;
    if (this["_isOpen"]()) this["render"]();
    let v196 = false;
    const v197 = reset ? 0 : this["_nextOffset"];
    try {
      const v198 = await fetchAssetsFromServer(
        this["_buildAssetPageParams"](v197),
      );
      if (v195 !== this["_loadToken"]) return;
      const v199 = this["_normalizeAssetsPageResponse"](v198, v197),
        v200 =
          v197 === 0
            ? v199["items"]
            : [
                ...this["records"],
                ...v199["items"]["filter"](
                  (v201) =>
                    !this["records"]["some"](
                      (v202) =>
                        String(v202?.["id"] || "") ===
                        String(v201?.["id"] || ""),
                    ),
                ),
              ];
      ((this["records"] = dedupeHistoryRecords(v200)),
        (this["_nextOffset"] =
          v199["nextOffset"] === null || v199["nextOffset"] === undefined
            ? this["records"]["length"]
            : v199["nextOffset"]),
        (this["_hasMore"] = v199["hasMore"]),
        (this["_totalRecords"] = v199["total"]),
        (this["_recordsLoaded"] = true),
        (this["_recordsDirty"] = false),
        (v196 = backfillAfterLoad && v197 === 0));
    } catch (v203) {
      if (v195 !== this["_loadToken"]) return;
      console["error"](
        "[GenerationHistoryFileManager] 加载生成媒体历史失败:",
        v203,
      );
    } finally {
      if (v195 === this["_loadToken"]) {
        this["_loading"] = false;
        if (this["_isOpen"]()) this["render"]();
      }
    }
    v195 === this["_loadToken"] &&
      v196 &&
      this["_isOpen"]() &&
      void this["_backfillCurrentCanvas"]();
  }
  async ["_saveRecords"](v204) {
    const v205 = Array["isArray"](v204) ? v204 : [],
      v206 = new Set(),
      v207 = v205["filter"]((v208) => {
        const v209 = String(v208?.["resultFingerprint"] || "")["trim"](),
          v210 = resolveRecordLocalPath(v208);
        if (!v208?.["id"] || (!v209 && !v210)) return false;
        const v211 = buildHistoryRecordIdentityKey(v208),
          v212 = buildFileManagerHistoryRecordKey({
            projectId: normalizeProjectId(v208["projectId"]),
            canvasId: String(v208["canvasId"] || "")["trim"](),
            resultFingerprint: v209,
          });
        if (v206["has"](v211)) return false;
        v206["add"](v211);
        if (this["_savingIds"]["has"](v208["id"])) return false;
        if (this["_savingRecordKeys"]["has"](v211)) return false;
        return (
          !this["_hasRecord"](
            v208["projectId"],
            v208["canvasId"],
            v209,
            v210,
            getRecordMediaKind(v208),
          ) && !this["_savingRecordKeys"]["has"]("fingerprint:" + v212)
        );
      });
    if (v207["length"] === 0) return 0;
    let v213 = 0;
    for (const v214 of v207) {
      const v215 = buildHistoryRecordIdentityKey(v214);
      this["_savingIds"]["add"](v214["id"]);
      if (v215) this["_savingRecordKeys"]["add"](v215);
      try {
        (await saveAssetToServer(v214),
          (this["records"] = dedupeHistoryRecords([
            v214,
            ...this["records"]["filter"]((v216) => v216["id"] !== v214["id"]),
          ])),
          (v213 += 1));
      } catch (v217) {
        console["error"](
          "[GenerationHistoryFileManager] 保存生成媒体历史失败:",
          v217,
        );
      } finally {
        this["_savingIds"]["delete"](v214["id"]);
        if (v215) this["_savingRecordKeys"]["delete"](v215);
      }
    }
    if (v213 > 0) {
      if (this["_isOpen"]()) this["render"]();
      else this["_recordsDirty"] = true;
    }
    return v213;
  }
  async ["_backfillCurrentCanvas"]() {
    if (this["_backfillInFlight"]) return;
    this["_backfillInFlight"] = true;
    try {
      const v218 = this["_getCurrentProjectId"](),
        v219 = this["_getCurrentCanvasId"](),
        v220 =
          appStore["getStateRaw"]?.()["nodes"] ||
          appStore["getState"]()["nodes"] ||
          {},
        v221 = [];
      for (const v222 of Object["values"](v220 || {})) {
        if (!v222) continue;
        const v223 = String(v222["type"] || "");
        if (!["ai-image", "ai-video", "ai-audio"]["includes"](v223)) continue;
        const v224 =
            v223 === "ai-image" && Array["isArray"](v222["images"])
              ? v222["images"]
              : [],
          v225 = Array["isArray"](v222["videos"]) ? v222["videos"] : [],
          v226 =
            v223 === "ai-video"
              ? v225["length"] > 0
                ? v225
                : String(v222["videoUrl"] || v222["localPath"] || "")["trim"]()
                  ? [v222]
                  : []
              : [],
          v227 =
            v223 === "ai-audio" &&
            String(v222["audioUrl"] || v222["localPath"] || "")["trim"]()
              ? [v222]
              : [];
        if (
          v224["length"] === 0 &&
          v226["length"] === 0 &&
          v227["length"] === 0
        )
          continue;
        v221["push"](
          ...buildGenerationHistoryAssetsFromNode({
            images: v224,
            videos: v226,
            audios: v227,
            nodeData: v222,
            projectId: v218,
            canvasId: v219,
            now:
              Number(v222["generationStartTime"] || Date["now"]()) ||
              Date["now"](),
          }),
        );
      }
      await this["_saveRecords"](v221);
    } finally {
      this["_backfillInFlight"] = false;
    }
  }
  ["show"]() {
    this["panel"]?.["classList"]["add"]("show");
    this["panel"] &&
      !this["_panelWidth"] &&
      ((this["_panelWidth"] = FILE_PANEL_RESIZE["defaultWidth"]),
      (this["panel"]["style"]["width"] = this["_panelWidth"] + "px"));
    if (this["_activeSource"] === "output") {
      !this["_outputLoaded"] && !this["_outputLoading"]
        ? void this["loadOutputFiles"]({ dir: this["_outputDir"] })
        : this["render"]();
      return;
    }
    void this["_backfillCurrentCanvas"]();
    if (!this["_recordsLoaded"] || this["_recordsDirty"]) {
      if (!this["_loading"])
        void this["loadRecords"]({ backfillAfterLoad: true, reset: true });
      else this["render"]();
      return;
    }
    ((this["_recordsDirty"] = false), this["render"]());
  }
  ["hide"]() {
    (this["panel"]?.["classList"]["remove"]("show"),
      document["getElementById"]("btnFiles")?.["classList"]["remove"](
        "active",
      ));
  }
  ["render"]() {
    if (!this["contentEl"] || !this["_isOpen"]()) return;
    (this["_renderSourceTabs"](),
      this["_renderFilters"](),
      this["_renderOrderControls"](),
      this["_renderSubtitle"](),
      this["_renderBreadcrumbs"](),
      this["contentEl"]["replaceChildren"]());
    if (
      (isHistorySource(this["_activeSource"]) &&
        this["_loading"] &&
        !this["_recordsLoaded"]) ||
      (this["_activeSource"] === "output" &&
        this["_outputLoading"] &&
        !this["_outputLoaded"])
    ) {
      const v228 = document["createElement"]("div");
      ((v228["className"] = "v2-file-history-empty"),
        (v228["textContent"] = "加载中..."),
        this["contentEl"]["appendChild"](v228));
      return;
    }
    const v229 = this["_visibleRecords"]();
    this["_pruneSelectionToVisibleRecords"]();
    if (v229["length"] === 0) {
      const v230 = document["createElement"]("div");
      ((v230["className"] = "v2-file-history-empty"),
        (v230["textContent"] =
          this["_activeFilter"] === "all"
            ? this["_activeSource"] === "output"
              ? "输出文件夹暂无可显示文件"
              : this["_activeSource"] === "current-canvas"
                ? "当前画布暂无生成结果"
                : "暂无生成媒体历史"
            : "暂无" + getMediaLabel(this["_activeFilter"])),
        this["contentEl"]["appendChild"](v230),
        this["_clampContentScroll"]());
      return;
    }
    this["_renderMasonry"](v229);
    if (
      isHistorySource(this["_activeSource"]) &&
      this["_loading"] &&
      this["_recordsLoaded"]
    ) {
      const v231 = document["createElement"]("div");
      ((v231["className"] = "v2-file-history-page-status"),
        (v231["textContent"] = "加载更多..."),
        this["contentEl"]["appendChild"](v231));
    }
    this["_clampContentScroll"]();
  }
  ["_renderSourceTabs"]() {
    if (!this["sourceTabsEl"]) return;
    const v232 = document["createDocumentFragment"]();
    for (const v233 of FILE_SOURCES) {
      const v234 = document["createElement"]("button");
      ((v234["type"] = "button"),
        (v234["className"] = "v2-file-history-source-tab"),
        (v234["dataset"]["fileAction"] = "source"),
        (v234["dataset"]["source"] = v233["key"]),
        v234["setAttribute"]("role", "tab"),
        v234["setAttribute"](
          "aria-selected",
          this["_activeSource"] === v233["key"] ? "true" : "false",
        ),
        v234["classList"]["toggle"](
          "is-active",
          this["_activeSource"] === v233["key"],
        ),
        (v234["textContent"] = v233["label"]),
        v232["appendChild"](v234));
    }
    this["sourceTabsEl"]["replaceChildren"](v232);
  }
  ["_renderOrderControls"]() {
    if (!this["orderEl"]) return;
    const v235 = document["createElement"]("button");
    ((v235["type"] = "button"),
      (v235["className"] = "v2-file-history-order-btn"),
      (v235["dataset"]["fileAction"] = "order"),
      (v235["dataset"]["order"] = this["_sortOrder"]),
      v235["setAttribute"](
        "aria-label",
        this["_sortOrder"] === "asc"
          ? "当前正序，点击切换倒序"
          : "当前倒序，点击切换正序",
      ),
      (v235["title"] = this["_sortOrder"] === "asc" ? "正序" : "倒序"),
      (v235["innerHTML"] =
        "\x0a\x20\x20\x20\x20\x20\x20<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20aria-hidden=\x22true\x22\x20class=\x22" +
        (this["_sortOrder"] === "asc" ? "is-asc" : "is-desc") +
        '">\n        <path d="M8 5v14" />\n        <path d="M4.5 8.5 8 5l3.5 3.5" />\n        <path d="M16 19V5" />\n        <path d="m12.5 15.5 3.5 3.5 3.5-3.5" />\n      </svg>\n    '),
      this["orderEl"]["replaceChildren"](v235));
  }
  ["_renderSubtitle"]() {
    if (!this["subtitleEl"]) return;
    this["subtitleEl"]["textContent"] =
      this["_activeSource"] === "output"
        ? "浏览 output 输出目录"
        : this["_activeSource"] === "current-canvas"
          ? "当前画布生成媒体历史"
          : "当前项目生成媒体历史";
  }
  ["_renderBreadcrumbs"]() {
    if (!this["breadcrumbsEl"]) return;
    (this["breadcrumbsEl"]["replaceChildren"](),
      this["breadcrumbsEl"]["classList"]["toggle"](
        "is-visible",
        this["_activeSource"] === "output",
      ));
    if (this["_activeSource"] !== "output") return;
    const v236 = Array["isArray"](this["_outputBreadcrumbs"])
      ? this["_outputBreadcrumbs"]
      : [{ name: "output", dir: "" }];
    if (this["_outputDir"]) {
      const v237 = document["createElement"]("button");
      ((v237["type"] = "button"),
        (v237["className"] = "v2-file-history-crumb"),
        (v237["dataset"]["fileAction"] = "output-dir"),
        (v237["dataset"]["dir"] = this["_outputParent"] || ""),
        (v237["textContent"] = "上一级"),
        this["breadcrumbsEl"]["appendChild"](v237));
    }
    for (const v238 of v236) {
      const v239 = document["createElement"]("button");
      ((v239["type"] = "button"),
        (v239["className"] = "v2-file-history-crumb"),
        (v239["dataset"]["fileAction"] = "output-dir"),
        (v239["dataset"]["dir"] = String(v238?.["dir"] || "")),
        (v239["textContent"] = String(v238?.["name"] || "output")),
        this["breadcrumbsEl"]["appendChild"](v239));
    }
  }
  ["_getMasonryMetrics"]() {
    if (!this["contentEl"]) return { contentWidth: 1 };
    const v240 = window["getComputedStyle"](this["contentEl"]),
      v241 =
        (Number["parseFloat"](v240["paddingLeft"]) || 0) +
        (Number["parseFloat"](v240["paddingRight"]) || 0);
    return {
      contentWidth: Math["max"](
        1,
        (this["contentEl"]["clientWidth"] || 1) - v241,
      ),
    };
  }
  ["_getRecordDisplaySize"](v242, v243) {
    const v244 = getRecordMediaKind(v242),
      { width: v245, height: v246 } = resolveRecordSize(v242, v244),
      v247 = Math["max"](1, v245),
      v248 = Math["max"](1, v246),
      v249 = Math["min"](v247, v248),
      v250 = Math["max"](v247, v248),
      v251 = FILE_MASONRY["fixedShortSide"],
      v252 = Math["min"](
        v251 / v249,
        FILE_MASONRY["maxLongSide"] / v250,
        v247 > v243 ? v243 / v247 : 1,
      );
    return {
      width: Math["max"](1, Math["round"](v247 * v252)),
      height: Math["max"](1, Math["round"](v248 * v252)),
    };
  }
  ["_findMasonrySlot"](v253, v254, v255) {
    const v256 = FILE_MASONRY["gap"],
      v257 = Math["max"](0, v255 - v254["width"]),
      v258 = [];
    for (let v259 = 0; v259 <= v257; v259 += FILE_MASONRY["placementStep"]) {
      v258["push"](v259);
    }
    if (v258[v258["length"] - 1] !== v257) v258["push"](v257);
    let v260 = null;
    for (const v261 of v258) {
      let v262 = 0;
      for (const v263 of v253) {
        const v264 =
          v261 < v263["x"] + v263["width"] + v256 &&
          v261 + v254["width"] + v256 > v263["x"];
        if (v264) v262 = Math["max"](v262, v263["y"] + v263["height"] + v256);
      }
      (!v260 || v262 < v260["y"] || (v262 === v260["y"] && v261 < v260["x"])) &&
        (v260 = { x: v261, y: v262 });
    }
    return v260 || { x: 0, y: 0 };
  }
  ["_renderMasonry"](v265) {
    const { contentWidth: v266 } = this["_getMasonryMetrics"](),
      v267 = document["createElement"]("div");
    ((v267["className"] = "v2-file-history-masonry-canvas"),
      this["contentEl"]["appendChild"](v267));
    const v268 = [];
    let v269 = 0;
    for (const v270 of v265) {
      const v271 = this["_getRecordDisplaySize"](v270, v266),
        v272 = this["_findMasonrySlot"](v268, v271, v266),
        v273 = this["_renderCard"](v270);
      ((v273["style"]["left"] = v272["x"] + "px"),
        (v273["style"]["top"] = v272["y"] + "px"),
        (v273["style"]["width"] = v271["width"] + "px"),
        (v273["style"]["height"] = v271["height"] + "px"),
        v267["appendChild"](v273),
        v268["push"]({ ...v272, ...v271 }),
        (v269 = Math["max"](v269, v272["y"] + v271["height"])));
    }
    v267["style"]["height"] = v269 + "px";
  }
  ["_relayoutMasonry"]() {
    if (!this["contentEl"] || !this["_isOpen"]()) return false;
    const v274 = this["contentEl"]["querySelector"](
      ".v2-file-history-masonry-canvas",
    );
    if (!v274) return (this["render"](), false);
    const v275 = this["_visibleRecords"](),
      v276 = new Map(
        Array["from"](v274["querySelectorAll"](".v2-file-history-card"))["map"](
          (v277) => [String(v277["dataset"]["recordId"] || ""), v277],
        ),
      );
    if (v275["length"] !== v276["size"]) return (this["render"](), false);
    const { contentWidth: v278 } = this["_getMasonryMetrics"](),
      v279 = [];
    let v280 = 0;
    for (const v281 of v275) {
      const v282 = String(v281?.["id"] || ""),
        v283 = v276["get"](v282);
      if (!v283) return (this["render"](), false);
      const v284 = this["_getRecordDisplaySize"](v281, v278),
        v285 = this["_findMasonrySlot"](v279, v284, v278);
      ((v283["style"]["left"] = v285["x"] + "px"),
        (v283["style"]["top"] = v285["y"] + "px"),
        (v283["style"]["width"] = v284["width"] + "px"),
        (v283["style"]["height"] = v284["height"] + "px"),
        v279["push"]({ ...v285, ...v284 }),
        (v280 = Math["max"](v280, v285["y"] + v284["height"])));
    }
    return ((v274["style"]["height"] = v280 + "px"), true);
  }
  ["_renderFilters"]() {
    if (!this["filterEl"]) return;
    const v286 = new Map(
        Array["from"](
          this["filterEl"]["querySelectorAll"](".v2-file-history-filter"),
        )["map"]((v287) => [v287["dataset"]["filter"] || "", v287]),
      ),
      v288 = document["createDocumentFragment"]();
    for (const v289 of FILE_FILTERS) {
      const v290 =
        v286["get"](v289["key"]) || document["createElement"]("button");
      (!v290["dataset"]["filter"] &&
        ((v290["type"] = "button"),
        (v290["className"] = "v2-file-history-filter"),
        (v290["dataset"]["fileAction"] = "filter"),
        (v290["dataset"]["filter"] = v289["key"])),
        v290["setAttribute"]("role", "tab"),
        v290["setAttribute"](
          "aria-selected",
          this["_activeFilter"] === v289["key"] ? "true" : "false",
        ),
        v290["classList"]["toggle"](
          "is-active",
          this["_activeFilter"] === v289["key"],
        ),
        (v290["textContent"] = v289["label"]),
        v288["appendChild"](v290));
    }
    this["filterEl"]["replaceChildren"](v288);
  }
  ["_renderCard"](v291) {
    const v292 = document["createElement"]("div");
    ((v292["className"] = "v2-file-history-card"),
      (v292["dataset"]["recordId"] = String(v291?.["id"] || "")));
    const v293 = getRecordMediaKind(v291);
    ((v292["dataset"]["mediaKind"] = v293),
      v292["classList"]["toggle"](
        "is-selected",
        this["_selectedRecordIds"]["has"](String(v291?.["id"] || "")),
      ));
    const v294 = document["createElement"]("div");
    v294["className"] = "v2-file-history-thumb\x20is-" + v293;
    const v295 = resolveRecordAspect(v291, v293);
    if (v295) v294["style"]["aspectRatio"] = v295;
    const v296 = resolveThumbSrc(v291),
      v297 = resolveMediaSrc(v291);
    if (v293 === "folder")
      v294["appendChild"](this["_renderFolderThumb"](v291));
    else {
      if (v293 === "file") v294["appendChild"](this["_renderFileThumb"](v291));
      else {
        if (v293 === GENERATION_HISTORY_MEDIA_KINDS["VIDEO"] && v297) {
          const v298 = document["createElement"]("video");
          v298["src"] = v297;
          if (v296 && v296 !== v297) v298["poster"] = v296;
          ((v298["muted"] = false),
            (v298["volume"] = 0.72),
            (v298["loop"] = true),
            (v298["playsInline"] = true),
            (v298["preload"] = "metadata"),
            (v298["draggable"] = false),
            v294["appendChild"](v298),
            v294["appendChild"](this["_renderVideoPreviewOverlay"]()));
        } else {
          if (v293 === GENERATION_HISTORY_MEDIA_KINDS["VIDEO"] && v296) {
            const v299 = document["createElement"]("img");
            ((v299["src"] = v296),
              (v299["alt"] = "视频历史"),
              (v299["draggable"] = false),
              (v299["decoding"] = "async"),
              (v299["loading"] = "lazy"),
              v294["appendChild"](v299));
          } else {
            if (v293 === GENERATION_HISTORY_MEDIA_KINDS["AUDIO"])
              v294["appendChild"](this["_renderAudioThumb"](v297));
            else {
              if (v296) {
                const v300 = document["createElement"]("img");
                ((v300["src"] = v296),
                  (v300["alt"] = "图像历史"),
                  (v300["draggable"] = false),
                  (v300["decoding"] = "async"),
                  (v300["loading"] = "lazy"),
                  v294["appendChild"](v300));
              }
            }
          }
        }
      }
    }
    return (
      v292["appendChild"](v294),
      this["_bindHoverPreview"](v292, v293),
      v292
    );
  }
  ["_bindHoverPreview"](v301, v302) {
    if (!v301) return;
    if (v302 === GENERATION_HISTORY_MEDIA_KINDS["VIDEO"]) {
      const v303 = v301["querySelector"]("video");
      if (!v303) return;
      const v304 = v301["querySelector"](
          ".v2-file-history-video-progress-fill",
        ),
        v305 = () => {
          if (v304) v304["style"]["transform"] = "scaleX(0)";
        },
        v306 = () => {
          if (!v304) return;
          const v307 = Number(v303["duration"] || 0),
            v308 = Number(v303["currentTime"] || 0),
            v309 = v307 > 0 ? Math["min"](Math["max"](v308 / v307, 0), 1) : 0;
          v304["style"]["transform"] = "scaleX(" + v309 + ")";
        };
      (v303["addEventListener"]("timeupdate", v306),
        v303["addEventListener"]("loadedmetadata", v306),
        v301["addEventListener"]("mouseenter", () => {
          (v301["classList"]["add"]("is-preview-playing"),
            (v303["muted"] = false),
            (v303["volume"] = 0.72));
          const v310 = v303["play"]();
          v310 &&
            typeof v310["catch"] === "function" &&
            v310["catch"](() => {
              v303["muted"] = true;
              const v311 = v303["play"]();
              v311 &&
                typeof v311["catch"] === "function" &&
                v311["catch"](() => {
                  (v301["classList"]["remove"]("is-preview-playing"), v305());
                });
            });
        }),
        v301["addEventListener"]("mouseleave", () => {
          v303["pause"]();
          try {
            v303["currentTime"] = 0;
          } catch {}
          (v305(),
            (v303["muted"] = false),
            v301["classList"]["remove"]("is-preview-playing"));
        }));
      return;
    }
    if (v302 === GENERATION_HISTORY_MEDIA_KINDS["AUDIO"]) {
      const v312 = v301["querySelector"]("audio");
      if (!v312) return;
      (v301["addEventListener"]("mouseenter", () => {
        v301["classList"]["add"]("is-preview-playing");
        try {
          v312["currentTime"] = 0;
        } catch {}
        const v313 = v312["play"]();
        v313 &&
          typeof v313["catch"] === "function" &&
          v313["catch"](() => {
            v301["classList"]["remove"]("is-preview-playing");
          });
      }),
        v301["addEventListener"]("mouseleave", () => {
          v312["pause"]();
          try {
            v312["currentTime"] = 0;
          } catch {}
          v301["classList"]["remove"]("is-preview-playing");
        }));
    }
  }
  ["_renderFolderThumb"](v314) {
    const v315 = document["createElement"]("div");
    v315["className"] = "v2-file-history-folder-thumb";
    const v316 = document["createElement"]("div");
    return (
      (v316["className"] = "v2-file-history-folder-name"),
      (v316["textContent"] = v314?.["name"] || "文件夹"),
      (v315["innerHTML"] =
        '\n      <svg viewBox="0 0 96 72" aria-hidden="true">\n        <path d="M8 22h28l8 9h44v31a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8V22z" class="folder-body"/>\n        <path d="M8 18a8 8 0 0 1 8-8h19l8 9h37a8 8 0 0 1 8 8v6H8V18z" class="folder-tab"/>\n      </svg>\n    '),
      v315["appendChild"](v316),
      v315
    );
  }
  ["_renderVideoPreviewOverlay"]() {
    const v317 = document["createElement"]("div");
    return (
      (v317["className"] = "v2-file-history-video-preview-overlay"),
      (v317["innerHTML"] =
        '\n      <div class="v2-file-history-video-progress" aria-hidden="true">\n        <div class="v2-file-history-video-progress-fill"></div>\n      </div>\n    '),
      v317
    );
  }
  ["_renderFileThumb"](v318) {
    const v319 = document["createElement"]("div");
    ((v319["className"] = "v2-file-history-file-thumb"),
      (v319["innerHTML"] =
        '\n      <svg viewBox="0 0 72 88" aria-hidden="true">\n        <path d="M14 4h30l14 14v66H14z" class="file-page"/>\n        <path d="M44 4v15h14" class="file-fold"/>\n      </svg>\n    '));
    const v320 = document["createElement"]("div");
    return (
      (v320["className"] = "v2-file-history-folder-name"),
      (v320["textContent"] = v318?.["name"] || "文件"),
      v319["appendChild"](v320),
      v319
    );
  }
  ["_renderAudioThumb"](v321 = "") {
    const v322 = document["createElement"]("div");
    ((v322["className"] = "v2-file-history-audio-thumb"),
      (v322["innerHTML"] =
        '\n      <svg viewBox="0 0 120 72" aria-hidden="true">\n        <path d="M12 38h8m8 0h8m8 0h8m8 0h8m8 0h8m8 0h8m8 0h8" class="wave-line"/>\n        <path d="M20 48V28m16 28V20m16 36V26m16 30V18m16 38V24m16 26V32" class="wave-bars"/>\n      </svg>\n      <div class="v2-file-history-audio-progress-line" aria-hidden="true"></div>\n    '));
    const v323 = String(v321 || "")["trim"]();
    if (v323) {
      const v324 = document["createElement"]("audio");
      ((v324["src"] = v323),
        (v324["preload"] = "none"),
        (v324["className"] = "v2-file-history-preview-audio"),
        (v324["volume"] = 0.72),
        v322["appendChild"](v324));
    }
    return v322;
  }
  ["_buildCanvasNodeFromRecord"](
    v325,
    { center: v326, occupiedNodes: v327, index: index = 0 } = {},
  ) {
    const v328 = Array["isArray"](v325?.["nodes"]) ? v325["nodes"][0] : null;
    if (!v328) return null;
    const v329 = getRecordMediaKind(v325),
      v330 =
        v329 === GENERATION_HISTORY_MEDIA_KINDS["VIDEO"]
          ? "source-video"
          : v329 === GENERATION_HISTORY_MEDIA_KINDS["AUDIO"]
            ? "source-audio"
            : "source-image",
      v331 = String(v328["type"] || v330)["trim"]() || v330,
      v332 = normalizeFileManagerSourceNodeForCanvas({ ...v328, type: v331 }),
      v333 =
        Number(v332["width"] ?? v332["w"]) ||
        (v331 === "source-audio" ? 320 : 260),
      v334 =
        Number(v332["height"] ?? v332["h"]) ||
        (v331 === "source-audio" ? 140 : 260),
      v335 = v326 || this["_getCanvasCenterWorld"](),
      v336 = findAvailablePosition(
        v327 || appStore["getState"]()["nodes"],
        v335["x"] - v333 / 2 + index * 24,
        v335["y"] - v334 / 2 + index * 24,
        v333,
        v334,
        24,
        "right",
      ),
      v337 = JSON["parse"](JSON["stringify"](v332));
    return (
      (v337["id"] = generateId(v331)),
      (v337["type"] = v331),
      (v337["x"] = v336["x"]),
      (v337["y"] = v336["y"]),
      v337
    );
  }
  ["restoreRecordsToCanvas"](v338) {
    const v339 = (Array["isArray"](v338) ? v338 : [])["filter"](
      isFileManagerActionableRecord,
    );
    if (v339["length"] === 0) return;
    const v340 = this["_getCanvasCenterWorld"](),
      v341 = { ...(appStore["getState"]()["nodes"] || {}) },
      v342 = [];
    v339["forEach"]((v343, v344) => {
      const v345 = this["_buildCanvasNodeFromRecord"](v343, {
        center: v340,
        occupiedNodes: v341,
        index: v344,
      });
      if (!v345) return;
      ((v341[v345["id"]] = v345), v342["push"](v345));
    });
    if (v342["length"] === 0) return;
    appStore["batch"](() => {
      (v342["forEach"]((v346) => appStore["addNode"](v346)),
        appStore["setSelectedNodes"](v342["map"]((v347) => v347["id"])));
    });
    const v348 =
      v342["length"] > 1
        ? "已添加\x20" + v342["length"] + " 个文件到画布"
        : this["_activeSource"] === "output"
          ? "已添加文件到画布"
          : "已添加历史" +
            getMediaLabel(getRecordMediaKind(v339[0])) +
            "到画布";
    window["showToast"]?.(v348, "success");
  }
  ["_openRecordPreview"](v349) {
    if (!isFileManagerActionableRecord(v349)) return;
    const v350 = getRecordMediaKind(v349),
      v351 = resolveMediaSrc(v349);
    if (v350 === "image") {
      const v352 = v351 || resolveThumbSrc(v349);
      if (v352)
        openImagePreview(v352, {
          sidebarSubmenuOwner: FILE_MANAGER_SIDEBAR_KEY,
        });
      return;
    }
    v350 === "video" &&
      v351 &&
      openVideoPreview(v351, { sidebarSubmenuOwner: FILE_MANAGER_SIDEBAR_KEY });
  }
  async ["_showRecordInFolder"](v353) {
    const v354 = resolveRecordLocalPath(v353);
    if (!canShowItemInFolder(v354)) return;
    try {
      await showItemInFolder(v354);
    } catch (v355) {
      (console["warn"](
        "[GenerationHistoryFileManager] 打开资源管理器失败:",
        v355,
      ),
        window["showToast"]?.("打开资源管理器失败", "error"));
    }
  }
  ["_showDeleteRecordsConfirm"](v356) {
    if (typeof document === "undefined" || !document["body"])
      return Promise["resolve"](false);
    return (
      document["getElementById"]("file-manager-delete-confirm-overlay")?.[
        "remove"
      ](),
      new Promise((v357) => {
        const v358 = document["createElement"]("div");
        ((v358["id"] = "file-manager-delete-confirm-overlay"),
          (v358["className"] = "custom-confirm-overlay"));
        const v359 = document["createElement"]("div");
        ((v359["className"] = "custom-confirm-box"),
          v359["setAttribute"]("role", "dialog"),
          v359["setAttribute"]("aria-modal", "true"),
          v359["setAttribute"]("aria-label", "删除文件确认"));
        const v360 = document["createElement"]("div");
        ((v360["className"] = "confirm-title"),
          (v360["textContent"] = "删除文件？"));
        const v361 = document["createElement"]("div");
        ((v361["className"] = "confirm-msg"),
          (v361["textContent"] =
            v356 > 1
              ? "确认删除\x20" + v356 + " 个文件？"
              : "确认删除该文件？"));
        const v362 = document["createElement"]("div");
        v362["className"] = "confirm-btns";
        const v363 = document["createElement"]("button");
        ((v363["type"] = "button"),
          (v363["className"] = "confirm-btn confirm-cancel"),
          (v363["textContent"] = "取消"));
        const v364 = document["createElement"]("button");
        ((v364["type"] = "button"),
          (v364["className"] = "confirm-btn confirm-ok"),
          (v364["textContent"] = "删除"),
          v362["appendChild"](v363),
          v362["appendChild"](v364),
          v359["appendChild"](v360),
          v359["appendChild"](v361),
          v359["appendChild"](v362),
          v358["appendChild"](v359),
          document["body"]["appendChild"](v358));
        let v365 = false;
        const v366 = (v367) => {
            if (v365) return;
            ((v365 = true),
              document["removeEventListener"]("keydown", v368, true),
              v358["remove"](),
              v357(v367));
          },
          v368 = (v369) => {
            if (v369["key"] === "Escape") {
              (v369["preventDefault"](), v366(false));
              return;
            }
            v369["key"] === "Enter" &&
              !v369["isComposing"] &&
              (v369["preventDefault"](), v366(true));
          };
        (v358["addEventListener"]("click", (v370) => {
          if (v370["target"] === v358) v366(false);
        }),
          v363["addEventListener"]("click", () => v366(false)),
          v364["addEventListener"]("click", () => v366(true)),
          document["addEventListener"]("keydown", v368, true),
          v363["focus"]?.());
      })
    );
  }
  async ["_deleteRecords"](v371) {
    const v372 = (Array["isArray"](v371) ? v371 : [])["filter"](
      isFileManagerActionableRecord,
    );
    if (v372["length"] === 0) return;
    const v373 = await this["_showDeleteRecordsConfirm"](v372["length"]);
    if (!v373) return;
    try {
      if (this["_activeSource"] === "output") {
        const v374 = v372["map"](resolveRecordLocalPath)["filter"](Boolean);
        if (v374["length"] === 0) return;
        await deleteOutputFilesFromServer({ localPaths: v374 });
        const v375 = new Set(v374["map"]((v376) => normalizeLocalPath(v376)));
        this["outputItems"] = (
          Array["isArray"](this["outputItems"]) ? this["outputItems"] : []
        )["filter"](
          (v377) => !v375["has"](normalizeLocalPath(v377?.["localPath"])),
        );
      } else {
        const v378 = v372["map"]((v379) => String(v379?.["id"] || ""))[
            "filter"
          ](Boolean),
          v380 = await Promise["all"](
            v378["map"]((v381) => deleteAssetFromServer(v381)),
          );
        if (v380["some"]((v382) => v382 === false))
          throw new Error("delete\x20asset\x20failed");
        const v383 = new Set(v378);
        ((this["records"] = (
          Array["isArray"](this["records"]) ? this["records"] : []
        )["filter"]((v384) => !v383["has"](String(v384?.["id"] || "")))),
          (this["_totalRecords"] = Math["max"](
            0,
            Number(this["_totalRecords"] || 0) - v378["length"],
          )));
      }
      this["_selectedRecordIds"]["clear"]();
      if (this["_isOpen"]()) this["render"]();
      window["showToast"]?.(
        v372["length"] > 1 ? "已删除文件" : "已删除",
        "success",
      );
    } catch (v385) {
      (console["error"]("[GenerationHistoryFileManager] 删除文件失败:", v385),
        window["showToast"]?.("删除失败", "error"));
    }
  }
  ["restoreRecordToCanvas"](v386) {
    const v387 =
      this["_activeSource"] === "output"
        ? this["_visibleOutputRecords"]()["find"](
            (v388) => String(v388?.["id"] || "") === String(v386 || ""),
          )
        : this["records"]["find"](
            (v389) => String(v389?.["id"] || "") === String(v386 || ""),
          );
    this["restoreRecordsToCanvas"](v387 ? [v387] : []);
  }
}
export const generationHistoryFileManager = new GenerationHistoryFileManager();
