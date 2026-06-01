import appStore from "../core/stores/appStore.js";
import {
  findAvailablePosition,
  generateId,
  screenToWorld,
} from "../core/math.js";
import { getImage } from "./storage.js";
import {
  fetchAssetsFromServer,
  fetchAssetCategoriesFromServer,
  saveAssetToServer,
  saveAssetCategoriesToServer,
  deleteAssetFromServer,
  saveAssetThumbToServer,
} from "../../api/projectsV2Api.js";
import { registerSidebarSubmenu } from "./sidebarSubmenuController.js";
import {
  removeAssetMentionAsset,
  setAssetMentionAssets,
  upsertAssetMentionAsset,
} from "./assetMentionRegistry.js";
import { createReferenceFallbackThumbHtml } from "./referenceThumbnailFallback.js";
import { localPathToUrl } from "../utils/localMediaPath.js";
import { attachMediaElementPlaybackSource } from "../services/desktopMediaBlobSource.js";
import {
  createTopAlignedAssetNodes,
  shouldTopAlignRestoredAsset,
} from "./assetRestoreLayout.js";
const DEFAULT_ASSET_CATEGORIES = ["人物", "场景", "物品"],
  CUSTOM_CATEGORY_LABEL = "自定义",
  ASSET_CATEGORY_LIMIT = 10,
  HIDDEN_ASSET_CATEGORIES = ["出图历史"],
  HIDDEN_ASSET_KINDS = ["generation-history"];
function _escapeHtml(v0) {
  return String(v0 ?? "")
    ["replaceAll"]("&", "&amp;")
    ["replaceAll"]("<", "&lt;")
    ["replaceAll"](">", "&gt;")
    ["replaceAll"]("\x22", "&quot;")
    ["replaceAll"]("\x27", "&#39;");
}
function _clonePlain(v1, v2) {
  if (v1 == null) return v2;
  try {
    return JSON["parse"](JSON["stringify"](v1));
  } catch (v3) {
    return v2;
  }
}
function _normalizeAssetType(v4) {
  const v5 = String(v4 || "");
  if (v5 === "text" || v5 === "source-text" || v5 === "ai-text") return "text";
  if (v5 === "audio" || v5 === "source-audio" || v5 === "ai-audio")
    return "audio";
  if (v5 === "video" || v5 === "source-video" || v5 === "ai-video")
    return "video";
  if (v5 === "image" || v5 === "source-image" || v5 === "ai-image")
    return "image";
  return "other";
}
function _formatAssetTypeLabel(v6) {
  const v7 = _normalizeAssetType(v6);
  if (v7 === "text") return "文本";
  if (v7 === "audio") return "音频";
  if (v7 === "video") return "视频";
  if (v7 === "image") return "图像";
  return "节点";
}
function _resolveNodeStableThumbSrc(v8) {
  if (!v8) return "";
  const v9 =
    v8["thumbLocalPath"] ||
    v8["displayLocalPath"] ||
    v8["localPath"] ||
    v8["originalLocalPath"];
  if (v9)
    return (
      localPathToUrl(v9) ||
      (String(v9)["startsWith"]("/")
        ? String(v9)
        : "/" + String(v9)["replace"](/^\/+/, ""))
    );
  if (v8["thumbUrl"] && typeof v8["thumbUrl"] === "string")
    return v8["thumbUrl"];
  return String(v8["src"] || v8["imageUrl"] || "");
}
function _renderAssetIcon(v10) {
  const v11 = _normalizeAssetType(v10);
  if (v11 === "text")
    return createReferenceFallbackThumbHtml("text", "v2-asset-icon");
  if (v11 === "audio")
    return createReferenceFallbackThumbHtml("audio", "v2-asset-icon");
  if (v11 === "video")
    return '<div class="v2-asset-icon v2-asset-icon--video" aria-hidden="true">\n      <svg class="v2-asset-icon-svg" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">\n        <polygon points="5 3 19 12 5 21 5 3" />\n      </svg>\n    </div>';
  return '<div class="v2-asset-icon v2-asset-icon--other" aria-hidden="true">\n    <svg class="v2-asset-icon-svg" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5">\n      <rect x="3" y="3" width="18" height="18" rx="2" />\n    </svg>\n  </div>';
}
function _buildAssetItem(v12) {
  const v13 = v12?.["type"] || "other",
    v14 = _resolveNodeStableThumbSrc(v12);
  return {
    type: v13,
    name: v12?.["name"] || "",
    thumbSrc: v14 || "",
    nodeData: v12,
  };
}
function _sortAssetsByUpdatedTime(v15) {
  return [...(Array["isArray"](v15) ? v15 : [])]["sort"]((v16, v17) => {
    const v18 = Number(v16?.["updatedAt"] || v16?.["createdAt"] || 0),
      v19 = Number(v17?.["updatedAt"] || v17?.["createdAt"] || 0);
    return v19 - v18;
  });
}
function _formatAssetDateTime(v20) {
  const v21 = Number(v20);
  if (!Number["isFinite"](v21) || v21 <= 0) return "未知";
  return new Date(v21)["toLocaleString"]("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
class AssetManager {
  constructor() {
    ((this["createPanel"] = null),
      (this["createPanelBackdrop"] = null),
      (this["_createPanelKeydownHandler"] = null),
      (this["_createPanelDropdownOutsideHandler"] = null),
      (this["_createPanelDropdownEl"] = null),
      (this["_createPanelCoverObjectUrl"] = ""),
      (this["_createPanelState"] = null),
      (this["sidebarPanel"] = null),
      (this["_openAssetId"] = null),
      (this["_thumbPreloadSet"] = new Set()),
      (this["_thumbDecodePromiseMap"] = new Map()),
      (this["_videoThumbInFlight"] = new Set()),
      (this["_videoThumbTimer"] = 0),
      (this["_sidebarRenderRaf"] = 0),
      (this["_pendingDeleteAssetId"] = ""),
      (this["_renamingAssetId"] = ""),
      (this["_newAssetPulseId"] = ""),
      (this["_sidebarTabsLayoutRaf"] = 0),
      (this["activeTab"] = "人物"),
      (this["tabs"] = [...DEFAULT_ASSET_CATEGORIES]),
      (this["userCategories"] = []),
      (this["assets"] = []),
      this["initSidebarPanel"](),
      this["loadAssetCategoriesFromServer"](),
      this["loadAssetsFromServer"]());
  }
  ["_getSortedAssets"]() {
    return _sortAssetsByUpdatedTime(
      (this["assets"] || [])["filter"]((v22) => this["_isManagedAsset"](v22)),
    );
  }
  ["_normalizeCategoryName"](v23) {
    return String(v23 || "")["trim"]();
  }
  ["_categoryKey"](v24) {
    return this["_normalizeCategoryName"](v24)["toLocaleLowerCase"]();
  }
  ["_isDefaultCategory"](v25) {
    return !!this["_findCategoryByName"](v25, DEFAULT_ASSET_CATEGORIES);
  }
  ["_isHiddenAssetCategory"](v26) {
    return !!this["_findCategoryByName"](v26, HIDDEN_ASSET_CATEGORIES);
  }
  ["_isManagedAsset"](v27) {
    if (!v27 || typeof v27 !== "object") return false;
    if (
      HIDDEN_ASSET_KINDS["includes"](
        String(v27?.["kind"] || "")
          ["trim"]()
          ["toLowerCase"](),
      )
    )
      return false;
    return !this["_isHiddenAssetCategory"](v27?.["category"]);
  }
  ["_findCategoryByName"](v28, v29 = this["tabs"]) {
    const v30 = this["_categoryKey"](v28);
    if (!v30) return "";
    return (
      (v29 || [])["find"]((v31) => this["_categoryKey"](v31) === v30) || ""
    );
  }
  ["_normalizeUserCategories"](v32 = []) {
    const v33 = [],
      v34 = (v35) => {
        const v36 = this["_normalizeCategoryName"](v35);
        if (!v36) return;
        if (
          this["_isDefaultCategory"](v36) ||
          this["_isHiddenAssetCategory"](v36)
        )
          return;
        if (this["_findCategoryByName"](v36, v33)) return;
        if (
          DEFAULT_ASSET_CATEGORIES["length"] + v33["length"] >=
          ASSET_CATEGORY_LIMIT
        )
          return;
        v33["push"](v36);
      };
    return ((Array["isArray"](v32) ? v32 : [])["forEach"](v34), v33);
  }
  ["_isUserCategory"](v37) {
    return !!this["_findCategoryByName"](v37, this["userCategories"]);
  }
  ["_getAssetCategories"](v38 = "") {
    const v39 = [],
      v40 = (v41) => {
        const v42 = this["_normalizeCategoryName"](v41);
        if (!v42) return;
        if (this["_isHiddenAssetCategory"](v42)) return;
        if (this["_findCategoryByName"](v42, v39)) return;
        if (v39["length"] >= ASSET_CATEGORY_LIMIT) return;
        v39["push"](v42);
      };
    DEFAULT_ASSET_CATEGORIES["forEach"](v40);
    for (const v43 of this["userCategories"] || []) {
      v40(v43);
    }
    for (const v44 of this["_getSortedAssets"]()) {
      v40(v44?.["category"]);
    }
    return (v40(v38), v39);
  }
  ["_syncTabsFromAssets"]() {
    ((this["tabs"] = this["_getAssetCategories"]()),
      !this["_findCategoryByName"](this["activeTab"], this["tabs"]) &&
        ((this["activeTab"] = DEFAULT_ASSET_CATEGORIES[0]),
        (this["_openAssetId"] = null)));
  }
  ["_renderSidebarTabsHtml"]() {
    return (this["tabs"] || [])
      ["map"]((v45) => {
        const v46 =
            this["_categoryKey"](v45) ===
            this["_categoryKey"](this["activeTab"])
              ? " active"
              : "",
          v47 = _escapeHtml(v45),
          v48 = this["_isUserCategory"](v45)
            ? '<button\n              type="button"\n              class="v2-asset-category-delete"\n              data-ui-action="asset-category-delete"\n              data-cat="' +
              v47 +
              '"\n              aria-label="删除分类 ' +
              v47 +
              "\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20title=\x22删除分类\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20>×</button>"
            : "";
        return (
          '\n          <div class="v2-asset-sidebar-tab' +
          v46 +
          "\x22\x20data-cat=\x22" +
          v47 +
          "\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22v2-asset-sidebar-tab-text\x22>" +
          v47 +
          "</span>\n            " +
          v48 +
          "\n          </div>\n        "
        );
      })
      ["join"]("");
  }
  ["_renderSidebarTabs"]() {
    const v49 = this["sidebarPanel"]?.["querySelector"]("#asset-sidebar-tabs");
    if (!v49) return;
    ((v49["innerHTML"] = this["_renderSidebarTabsHtml"]()),
      this["_queueSidebarTabsLayoutSync"]());
  }
  ["_queueSidebarTabsLayoutSync"]() {
    if (!this["sidebarPanel"]) return;
    (this["_sidebarTabsLayoutRaf"] &&
      window["cancelAnimationFrame"]?.(this["_sidebarTabsLayoutRaf"]),
      (this["_sidebarTabsLayoutRaf"] = window["requestAnimationFrame"](() => {
        ((this["_sidebarTabsLayoutRaf"] = 0),
          this["_syncSidebarTabsViewport"]());
      })));
  }
  ["_syncSidebarTabsViewport"]() {
    const v50 = this["sidebarPanel"]?.["querySelector"]("#asset-sidebar-tabs");
    if (!v50) return;
    const v51 = v50["querySelector"](".v2-asset-sidebar-tab.active");
    if (v51 && v50["clientWidth"] > 0) {
      if (this["_isDefaultCategory"](this["activeTab"])) v50["scrollLeft"] = 0;
      else {
        const v52 = v51["offsetLeft"],
          v53 = v52 + v51["offsetWidth"],
          v54 = v50["scrollLeft"],
          v55 = v54 + v50["clientWidth"];
        if (v52 < v54) v50["scrollLeft"] = v52;
        else v53 > v55 && (v50["scrollLeft"] = v53 - v50["clientWidth"]);
      }
    }
    this["_updateSidebarTabsOverflowHint"]();
  }
  ["_updateSidebarTabsOverflowHint"]() {
    const v56 = this["sidebarPanel"]?.["querySelector"](
        "#asset-sidebar-tabs-shell",
      ),
      v57 = this["sidebarPanel"]?.["querySelector"]("#asset-sidebar-tabs");
    if (!v56 || !v57) return;
    const v58 = Math["max"](0, v57["scrollWidth"] - v57["clientWidth"]),
      v59 = v58 > 2,
      v60 = !v59 || v57["scrollLeft"] <= 2,
      v61 = !v59 || v57["scrollLeft"] >= v58 - 2;
    (v56["classList"]["toggle"]("has-overflow", v59),
      v56["classList"]["toggle"]("is-at-start", v60),
      v56["classList"]["toggle"]("is-at-end", v61));
    const v62 = v56["querySelector"](".v2-asset-sidebar-tabs-nav--prev"),
      v63 = v56["querySelector"](".v2-asset-sidebar-tabs-nav--next");
    if (v62) v62["hidden"] = !v59 || v60;
    if (v63) v63["hidden"] = !v59 || v61;
  }
  ["_scrollSidebarTabs"](v64 = 1) {
    const v65 = this["sidebarPanel"]?.["querySelector"]("#asset-sidebar-tabs");
    if (!v65) return;
    const v66 = Math["max"](1, Math["floor"](v65["clientWidth"] * 0.75)),
      v67 = v65["scrollLeft"] + v66 * (v64 < 0 ? -1 : 1);
    (typeof v65["scrollTo"] === "function"
      ? v65["scrollTo"]({ left: v67, behavior: "smooth" })
      : (v65["scrollLeft"] = v67),
      window["setTimeout"](
        () => this["_updateSidebarTabsOverflowHint"](),
        220,
      ));
  }
  ["_getCreatePanelCategories"]() {
    const v68 = this["_getAssetCategories"](),
      v69 = (v70) => {
        const v71 = this["_normalizeCategoryName"](v70);
        if (!v71) return;
        if (this["_findCategoryByName"](v71, v68)) return;
        v68["push"](v71);
      };
    for (const v72 of this["_createPanelState"]?.["customCategories"] || []) {
      v69(v72);
    }
    return (
      v69(
        this["_createPanelState"]?.["draft"]?.["category"] || this["activeTab"],
      ),
      v68
    );
  }
  ["_canAddCustomCategory"]() {
    return this["_getCreatePanelCategories"]()["length"] < ASSET_CATEGORY_LIMIT;
  }
  async ["loadAssetCategoriesFromServer"]() {
    try {
      const v73 = await fetchAssetCategoriesFromServer();
      ((this["userCategories"] = this["_normalizeUserCategories"](v73)),
        this["_syncTabsFromAssets"](),
        this["_renderSidebarTabs"](),
        this["sidebarPanel"]?.["classList"]["contains"]("show") &&
          this["renderSidebarContent"]());
    } catch (v74) {
      console["error"]("加载资产分类失败", v74);
    }
  }
  async ["_saveUserCategories"]() {
    const v75 = this["_normalizeUserCategories"](this["userCategories"]);
    ((this["userCategories"] = v75), await saveAssetCategoriesToServer(v75));
  }
  ["_addUserCategory"](v76) {
    const v77 = this["_normalizeCategoryName"](v76);
    if (
      !v77 ||
      this["_isDefaultCategory"](v77) ||
      this["_isHiddenAssetCategory"](v77)
    )
      return "";
    const v78 = this["_findCategoryByName"](v77, this["userCategories"]);
    if (v78) return v78;
    if (this["_getAssetCategories"]()["length"] >= ASSET_CATEGORY_LIMIT)
      return (
        window["showToast"]?.(
          "分类最多 " + ASSET_CATEGORY_LIMIT + "\x20条",
          "warn",
        ),
        ""
      );
    return (
      (this["userCategories"] = this["_normalizeUserCategories"]([
        ...this["userCategories"],
        v77,
      ])),
      this["_syncTabsFromAssets"](),
      this["_renderSidebarTabs"](),
      void this["_saveUserCategories"]()["catch"]((v79) => {
        (console["error"]("保存资产分类失败", v79),
          window["showToast"]?.("分类保存失败", "error"));
      }),
      v77
    );
  }
  ["_getMentionEligibleAssets"]() {
    return this["_getSortedAssets"]()["filter"]((v80) =>
      this["_findCategoryByName"](v80?.["category"], this["tabs"]),
    );
  }
  ["_normalizeAssetEntity"](v81) {
    if (!v81 || typeof v81 !== "object") return null;
    const v82 = { ...v81 },
      v83 = Number(v82["createdAt"] || 0),
      v84 = Number(v82["updatedAt"] || v83 || 0);
    v83 > 0 ? (v82["createdAt"] = v83) : delete v82["createdAt"];
    if (v84 > 0) v82["updatedAt"] = v84;
    else v83 > 0 && (v82["updatedAt"] = v83);
    return (
      !v82["coverUrl"] &&
        Array["isArray"](v82["nodes"]) &&
        v82["nodes"][0] &&
        (v82["coverUrl"] = _resolveNodeStableThumbSrc(v82["nodes"][0])),
      !Array["isArray"](v82["items"]) &&
        Array["isArray"](v82["nodes"]) &&
        (v82["items"] = v82["nodes"]["map"]((v85) => _buildAssetItem(v85))),
      v82
    );
  }
  ["_upsertLocalAsset"](v86) {
    const v87 = this["_normalizeAssetEntity"](v86);
    if (!v87?.["id"]) return;
    const v88 = Array["isArray"](this["assets"]) ? this["assets"] : [],
      v89 = v88["filter"](
        (v90) => String(v90?.["id"] || "") !== String(v87["id"]),
      );
    ((this["assets"] = _sortAssetsByUpdatedTime([v87, ...v89])),
      this["_syncTabsFromAssets"](),
      this["_renderSidebarTabs"](),
      this["_findCategoryByName"](v87["category"], this["tabs"])
        ? upsertAssetMentionAsset(v87)
        : removeAssetMentionAsset(v87["id"]));
  }
  ["_getSelectedAssetNodes"](v91) {
    const v92 = Array["isArray"](v91) ? v91 : [],
      v93 = appStore["getState"]();
    return v92["map"]((v94) => v93["nodes"][v94])["filter"](Boolean);
  }
  ["_getSelectedAssetEdges"](v95) {
    const v96 = Array["isArray"](v95) ? v95 : [],
      v97 = new Set(v96),
      v98 = appStore["getState"]();
    return Object["values"](v98["edges"] || {})["filter"](
      (v99) => v97["has"](v99?.["sourceId"]) && v97["has"](v99?.["targetId"]),
    );
  }
  async ["_resolveCreatePanelCover"](v100) {
    let v101 = "";
    const v102 = v100?.["type"] || "other";
    if (v100?.["thumbId"]) {
      const v103 = await getImage(v100["thumbId"]);
      v103 &&
        ((this["_createPanelCoverObjectUrl"] = URL["createObjectURL"](v103)),
        (v101 = this["_createPanelCoverObjectUrl"]));
    }
    return (
      !v101 && (v101 = _resolveNodeStableThumbSrc(v100)),
      {
        coverUrl: v101,
        coverType: v102,
        coverHtml: v101
          ? "<img\x20src=\x22" +
            v101 +
            '" alt="封面" id="asset-create-cover-img" draggable="false" />'
          : _renderAssetIcon(v102),
      }
    );
  }
  ["_buildAssetPayloadFromSelection"](v104, v105 = {}) {
    const v106 = this["_getSelectedAssetNodes"](v104),
      v107 = v106[0] || null,
      v108 = Date["now"](),
      v109 = String(v105["name"] || "")["trim"]() || "未命名资产",
      v110 = String(v105["category"] || "")["trim"]() || this["activeTab"],
      v111 = v107?.["type"] || "other",
      v112 = _resolveNodeStableThumbSrc(v107),
      v113 = String(v105["id"] || "")["trim"](),
      v114 = Number(v105["createdAt"] || v108) || v108,
      v115 = Number(v105["updatedAt"] || v108) || v108;
    return {
      id: v113 || generateId("asset"),
      name: v109,
      category: v110,
      coverUrl: v112,
      coverType: v111,
      items: v106["map"]((v116) => _buildAssetItem(v116)),
      nodes: v106,
      edges: this["_getSelectedAssetEdges"](v104),
      createdAt: v114,
      updatedAt: v115,
    };
  }
  ["_buildAssetAppendPayload"](v117, v118, v119 = {}) {
    const v120 = this["_getSelectedAssetNodes"](v118),
      v121 = this["_getSelectedAssetEdges"](v118),
      v122 = Date["now"](),
      v123 = {},
      v124 = v120["map"]((v125) => {
        const v126 = _clonePlain(v125, { ...v125 }),
          v127 = String(v126["id"] || ""),
          v128 = generateId(v126["type"]);
        if (v127) v123[v127] = v128;
        return ((v126["id"] = v128), v126);
      }),
      v129 = v121["map"]((v130) => {
        const v131 = _clonePlain(v130, { ...v130 });
        v131["id"] = generateId("edge");
        if (v123[v131["sourceId"]]) v131["sourceId"] = v123[v131["sourceId"]];
        if (v123[v131["targetId"]]) v131["targetId"] = v123[v131["targetId"]];
        return v131;
      }),
      v132 = Array["isArray"](v117?.["nodes"])
        ? _clonePlain(v117["nodes"], [])
        : [],
      v133 = Array["isArray"](v117?.["items"])
        ? _clonePlain(v117["items"], [])
        : v132["map"]((v134) => _buildAssetItem(v134)),
      v135 = Array["isArray"](v117?.["edges"])
        ? _clonePlain(v117["edges"], [])
        : [],
      v136 = v124[0] || null,
      v137 = v136 ? _resolveNodeStableThumbSrc(v136) : "",
      v138 = v117?.["coverUrl"] || v137,
      v139 = v117?.["coverType"] || v136?.["type"] || "other";
    return {
      ...(v117 || {}),
      id: v117?.["id"],
      name: String(v119["name"] || "")["trim"]() || "未命名资产",
      category: String(v119["category"] || "")["trim"]() || this["activeTab"],
      coverUrl: v138,
      coverType: v139,
      items: [...v133, ...v124["map"]((v140) => _buildAssetItem(v140))],
      nodes: [...v132, ...v124],
      edges: [...v135, ...v129],
      createdAt:
        Number(v117?.["createdAt"] || v117?.["updatedAt"] || v122) || v122,
      updatedAt: Number(v119["updatedAt"] || v122) || v122,
    };
  }
  ["_createDefaultPanelState"](v141, v142) {
    return {
      selectedIds: [...v141],
      mode: "create",
      selectedAssetId: "",
      updateSearchKeyword: "",
      updateConfirmOpen: false,
      customCategoryEditing: false,
      customCategoryDraft: "",
      customCategories: [],
      error: "",
      saving: false,
      savingAction: "",
      draft: { name: "新资产", category: this["activeTab"] },
      coverInfo: v142 || {
        coverUrl: "",
        coverType: "other",
        coverHtml: _renderAssetIcon("other"),
      },
    };
  }
  ["_setCreatePanelState"](v143 = {}) {
    if (!this["_createPanelState"]) return;
    const v144 = this["_createPanelState"],
      v145 = v143["draft"]
        ? { ...(v144["draft"] || {}), ...v143["draft"] }
        : v144["draft"];
    this["_createPanelState"] = { ...v144, ...v143, draft: v145 };
  }
  ["_getUpdateListCategory"]() {
    const v146 = this["_normalizeCategoryName"](
      this["_createPanelState"]?.["draft"]?.["category"],
    );
    if (this["_createPanelState"]?.["mode"] === "update" && v146) return v146;
    return (
      this["_findCategoryByName"](this["activeTab"], this["tabs"]) ||
      this["activeTab"]
    );
  }
  ["_getFilteredUpdateAssets"](v147 = "") {
    const v148 = String(v147 || "")
        ["trim"]()
        ["toLowerCase"](),
      v149 = this["_categoryKey"](this["_getUpdateListCategory"]()),
      v150 = this["_getSortedAssets"]()["filter"](
        (v151) => this["_categoryKey"](v151?.["category"]) === v149,
      );
    if (!v148) return v150;
    return v150["filter"]((v152) =>
      String(v152?.["name"] || "")
        ["toLowerCase"]()
        ["includes"](v148),
    );
  }
  ["_syncCreatePanelDraftFromTarget"](v153) {
    this["_setCreatePanelState"]({
      draft: {
        name: String(v153?.["name"] || "")["trim"]() || "未命名资产",
        category:
          String(v153?.["category"] || "")["trim"]() || this["activeTab"],
      },
      selectedAssetId: String(v153?.["id"] || ""),
      updateConfirmOpen: false,
      customCategoryEditing: false,
      customCategoryDraft: "",
      error: "",
    });
  }
  ["_syncUpdateSelectionForCategory"](v154) {
    if (this["_createPanelState"]?.["mode"] !== "update") return;
    const v155 = this["_normalizeCategoryName"](v154) || this["activeTab"];
    this["_setCreatePanelState"]({
      draft: { category: v155 },
      selectedAssetId: "",
      updateSearchKeyword: "",
      updateConfirmOpen: false,
      error: "",
    });
    const v156 = this["_getFilteredUpdateAssets"]()[0] || null;
    if (!v156) return;
    this["_setCreatePanelState"]({
      draft: {
        name: String(v156?.["name"] || "")["trim"]() || "未命名资产",
        category: String(v156?.["category"] || "")["trim"]() || v155,
      },
      selectedAssetId: String(v156?.["id"] || ""),
    });
  }
  ["_renderCreatePanelContent"]() {
    const v157 = this["createPanel"],
      v158 = this["_createPanelState"];
    if (!v157 || !v158) return;
    const v159 =
        v158["coverInfo"]?.["coverHtml"] ||
        _renderAssetIcon(v158["coverInfo"]?.["coverType"] || "other"),
      v160 = v158["mode"] === "update" ? "更新历史资产" : "创建资产",
      v161 = Array["isArray"](v158["selectedIds"])
        ? v158["selectedIds"]["length"]
        : 0,
      v162 = v158["saving"]
        ? v158["mode"] === "update" && v158["savingAction"] === "join"
          ? "覆盖"
          : v158["mode"] === "update"
            ? "保存中"
            : "创建中"
        : v158["mode"] === "update"
          ? v158["updateConfirmOpen"]
            ? "确认覆盖"
            : "覆盖"
          : "创建",
      v163 =
        v158["saving"] && v158["savingAction"] === "join" ? "加入中" : "加入",
      v164 = this["_getFilteredUpdateAssets"](v158["updateSearchKeyword"]),
      v165 =
        v164["find"](
          (v166) => String(v166?.["id"] || "") === v158["selectedAssetId"],
        ) || null,
      v167 = this["_getUpdateListCategory"](),
      v168 = v158["error"]
        ? "<div\x20class=\x22v2-asset-create-error\x22\x20role=\x22alert\x22>" +
          _escapeHtml(v158["error"]) +
          "</div>"
        : "",
      v169 =
        v158["mode"] === "update" && v158["updateConfirmOpen"] && v165
          ? "<div\x20class=\x22v2-asset-create-confirm\x22>确认用当前选中内容覆盖「" +
            _escapeHtml(v165["name"] || "未命名资产") +
            "」？</div>"
          : "",
      v170 =
        v158["mode"] === "update"
          ? '\n          <div class="v2-asset-update-layout">\n            <div class="v2-asset-update-picker">\n              <input\n                type="search"\n                class="v2-asset-update-search"\n                id="asset-update-search"\n                placeholder="搜索' +
            _escapeHtml(v167) +
            "资产\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20value=\x22" +
            _escapeHtml(v158["updateSearchKeyword"] || "") +
            '"\n              />\n              <div class="v2-asset-update-list">\n                ' +
            (v164["length"] === 0
              ? "<div\x20class=\x22v2-asset-update-empty\x22>" +
                (String(v158["updateSearchKeyword"] || "")["trim"]()
                  ? "没有匹配的历史资产"
                  : "还没有" + _escapeHtml(v167) + "资产") +
                "</div>"
              : v164["map"]((v171) => {
                  const v172 =
                      String(v171?.["id"] || "") === v158["selectedAssetId"]
                        ? " active"
                        : "",
                    v173 = v171?.["coverUrl"]
                      ? '<img src="' +
                        _escapeHtml(v171["coverUrl"]) +
                        "\x22\x20alt=\x22" +
                        _escapeHtml(v171?.["name"] || "资产") +
                        '" draggable="false" />'
                      : _renderAssetIcon(v171?.["coverType"] || "other");
                  return (
                    '\n                            <button\n                              type="button"\n                              class="v2-asset-update-item' +
                    v172 +
                    '"\n                              data-asset-id="' +
                    _escapeHtml(v171["id"]) +
                    '"\n                            >\n                              <div class="v2-asset-update-thumb">' +
                    v173 +
                    '</div>\n                              <div class="v2-asset-update-info">\n                                <span>' +
                    _escapeHtml(v171["name"] || "未命名资产") +
                    "</span>\n                                <small>" +
                    _formatAssetDateTime(
                      v171["updatedAt"] || v171["createdAt"],
                    ) +
                    "</small>\n                              </div>\n                            </button>\n                          "
                  );
                })["join"]("")) +
            '\n              </div>\n            </div>\n            <div class="v2-asset-update-editor">\n        '
          : "",
      v174 = v158["mode"] === "update" ? "</div></div>" : "",
      v175 = v158["mode"] === "update",
      v176 = v175
        ? "v2-asset-create-body v2-asset-create-body--update"
        : "v2-asset-create-body",
      v177 = v175
        ? ""
        : '\n        <div class="v2-asset-create-source-panel">\n          <div class="v2-asset-create-source-header">\n            <div class="v2-asset-create-source-title">当前选中内容</div>\n            <div class="v2-asset-create-source-scope">' +
          v161 +
          ' 个节点</div>\n          </div>\n          <div class="v2-asset-create-cover">\n            ' +
          v159 +
          "\n          </div>\n        </div>\n      ";
    ((v157["innerHTML"] =
      '\n      <div class="v2-asset-create-header">\n        <div class="v2-asset-create-title">\n          <span class="v2-asset-create-header-text">' +
      v160 +
      '</span>\n        </div>\n        <button type="button" class="v2-asset-create-close" data-ui-action="asset-create-close" aria-label="关闭">×</button>\n      </div>\n      <div class="v2-asset-create-tabs">\n        <button\n          type="button"\n          class="v2-asset-create-tab' +
      (v158["mode"] === "create" ? " active" : "") +
      '"\n          data-mode="create"\n        >创建新资产</button>\n        <button\n          type="button"\n          class="v2-asset-create-tab' +
      (v158["mode"] === "update" ? "\x20active" : "") +
      '"\n          data-mode="update"\n        >更新历史资产</button>\n      </div>\n      <div class="v2-asset-create-modal-body">\n        ' +
      v170 +
      '\n        <div class="' +
      v176 +
      '">\n          ' +
      v177 +
      '\n          <div class="v2-asset-create-right">\n            <div class="v2-asset-create-field">\n              <div class="v2-asset-create-label">资产名称</div>\n              <input\n                type="text"\n                id="asset-create-name"\n                placeholder="输入资产名称"\n                value="' +
      _escapeHtml(v158["draft"]?.["name"] || "") +
      "\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20/>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22v2-asset-create-field\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22v2-asset-create-label\x22>分类</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22v2-asset-create-select-trigger\x22\x20id=\x22asset-create-category-trigger\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20id=\x22asset-create-category-val\x22>" +
      _escapeHtml(v158["draft"]?.["category"] || this["activeTab"]) +
      '</span>\n                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">\n                  <path d="M1 1.5L6 6.5L11 1.5" stroke="var(--white-40)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n                </svg>\n              </button>\n            </div>\n            ' +
      v168 +
      "\n            " +
      v169 +
      "\n          </div>\n        </div>\n        " +
      v174 +
      '\n      </div>\n      <div class="v2-asset-create-footer' +
      (v175 ? " v2-asset-create-footer--update" : "") +
      "\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<button\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20type=\x22button\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20class=\x22v2-asset-create-btn\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20id=\x22asset-create-submit\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20" +
      (v158["saving"] ? "disabled" : "") +
      "\x0a\x20\x20\x20\x20\x20\x20\x20\x20>" +
      v162 +
      "</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20" +
      (v175
        ? '<button\n                type="button"\n                class="v2-asset-create-btn v2-asset-create-btn--secondary"\n                id="asset-join-submit"\n                ' +
          (v158["saving"] ? "disabled" : "") +
          "\n              >" +
          v163 +
          "</button>"
        : "") +
      "\n      </div>\n    "),
      this["_bindCreatePanelEvents"]());
  }
  ["_bindCreatePanelEvents"]() {
    const v178 = this["createPanel"],
      v179 = this["_createPanelState"];
    if (!v178 || !v179) return;
    v178["querySelector"]("[data-ui-action='asset-create-close']")?.[
      "addEventListener"
    ]("click", () => {
      this["closeCreatePanel"]();
    });
    const v180 = v178["querySelector"]("#asset-create-category-trigger"),
      v181 = v178["querySelector"]("#asset-create-category-val");
    this["_createPanelDropdownOutsideHandler"] &&
      (document["removeEventListener"](
        "pointerdown",
        this["_createPanelDropdownOutsideHandler"],
      ),
      (this["_createPanelDropdownOutsideHandler"] = null));
    this["_createPanelDropdownEl"] &&
      (this["_createPanelDropdownEl"]["remove"](),
      (this["_createPanelDropdownEl"] = null));
    if (v180 && v181) {
      const v182 = document["createElement"]("div");
      v182["className"] = "v2-asset-select-dropdown";
      const v183 = () => {
          const v184 =
              this["_createPanelState"]?.["draft"]?.["category"] ||
              this["activeTab"],
            v185 = this["_getCreatePanelCategories"]()
              ["map"]((v186) => {
                const v187 =
                    this["_categoryKey"](v186) === this["_categoryKey"](v184)
                      ? "\x20selected"
                      : "",
                  v188 = _escapeHtml(v186);
                return (
                  '<div class="v2-asset-select-item' +
                  v187 +
                  '" data-val="' +
                  v188 +
                  "\x22>" +
                  v188 +
                  "</div>"
                );
              })
              ["join"](""),
            v189 = this["_canAddCustomCategory"]()
              ? this["_createPanelState"]?.["customCategoryEditing"]
                ? '<div class="v2-asset-select-custom-row">\n                <input\n                  type="text"\n                  class="v2-asset-select-custom-input"\n                  id="asset-category-custom-input"\n                  placeholder="分类名称"\n                  value="' +
                  _escapeHtml(
                    this["_createPanelState"]?.["customCategoryDraft"] || "",
                  ) +
                  '"\n                />\n              </div>'
                : '<div class="v2-asset-select-item v2-asset-select-item--custom" data-custom-category="1">' +
                  CUSTOM_CATEGORY_LABEL +
                  "</div>"
              : "";
          v182["innerHTML"] = v185 + v189;
        },
        v190 = () => {
          const v191 = v182["querySelector"]("#asset-category-custom-input"),
            v192 =
              v191?.["value"] ??
              this["_createPanelState"]?.["customCategoryDraft"] ??
              "",
            v193 = this["_normalizeCategoryName"](v192);
          if (!v193) {
            (this["_setCreatePanelState"]({
              customCategoryEditing: false,
              customCategoryDraft: "",
            }),
              v183());
            return;
          }
          const v194 = this["_getCreatePanelCategories"](),
            v195 = this["_findCategoryByName"](v193, v194);
          if (!v195 && v194["length"] >= ASSET_CATEGORY_LIMIT) {
            window["showToast"]?.(
              "分类最多 " + ASSET_CATEGORY_LIMIT + "\x20条",
              "warn",
            );
            return;
          }
          const v196 = v195 || this["_addUserCategory"](v193);
          if (!v196) return;
          const v197 = [
            ...(this["_createPanelState"]?.["customCategories"] || []),
          ];
          !v195 &&
            !this["_findCategoryByName"](v196, v197) &&
            v197["push"](v196);
          this["_setCreatePanelState"]({
            draft: { category: v196 },
            customCategoryEditing: false,
            customCategoryDraft: "",
            customCategories: v197,
            updateConfirmOpen: false,
            error: "",
          });
          this["_createPanelState"]?.["mode"] === "update" &&
            this["_syncUpdateSelectionForCategory"](v196);
          v181["textContent"] = v196;
          if (this["_createPanelState"]?.["mode"] === "update") {
            (v198(), this["_renderCreatePanelContent"]());
            return;
          }
          v183();
        };
      (v183(),
        document["body"]["appendChild"](v182),
        (this["_createPanelDropdownEl"] = v182));
      const v198 = () => {
        (v182["classList"]["remove"]("show"),
          v180["classList"]["remove"]("active"));
      };
      (v180["addEventListener"]("click", (v199) => {
        v199["stopPropagation"]();
        if (v182["classList"]["contains"]("show")) {
          v198();
          return;
        }
        const v200 = v180["getBoundingClientRect"]();
        ((v182["style"]["left"] = v200["left"] + "px"),
          (v182["style"]["top"] = v200["bottom"] + 4 + "px"),
          (v182["style"]["width"] = v200["width"] + "px"),
          v182["classList"]["add"]("show"),
          v180["classList"]["add"]("active"));
      }),
        v182["addEventListener"]("click", (v201) => {
          const v202 = v201["target"]["closest"]("[data-custom-category='1']");
          if (v202) {
            (this["_setCreatePanelState"]({
              customCategoryEditing: true,
              customCategoryDraft: "",
              error: "",
            }),
              v183(),
              window["requestAnimationFrame"](() => {
                v182["querySelector"]("#asset-category-custom-input")?.[
                  "focus"
                ]();
              }));
            return;
          }
          const v203 = v201["target"]["closest"](
            ".v2-asset-select-item[data-val]",
          );
          if (!v203) return;
          const v204 =
            this["_normalizeCategoryName"](v203["dataset"]["val"]) ||
            this["activeTab"];
          (this["_createPanelState"]?.["mode"] === "update"
            ? (this["_setCreatePanelState"]({
                customCategoryEditing: false,
                customCategoryDraft: "",
              }),
              this["_syncUpdateSelectionForCategory"](v204))
            : this["_setCreatePanelState"]({
                draft: { category: v204 },
                customCategoryEditing: false,
                customCategoryDraft: "",
                updateConfirmOpen: false,
                error: "",
              }),
            v198(),
            this["_renderCreatePanelContent"]());
        }),
        v182["addEventListener"]("input", (v205) => {
          if (!v205["target"]["matches"]("#asset-category-custom-input"))
            return;
          this["_setCreatePanelState"]({
            customCategoryDraft: v205["target"]["value"] || "",
          });
        }),
        v182["addEventListener"]("keydown", (v206) => {
          if (!v206["target"]["matches"]("#asset-category-custom-input"))
            return;
          if (v206["key"] === "Enter") {
            (v206["preventDefault"](), v190());
            return;
          }
          v206["key"] === "Escape" &&
            (v206["preventDefault"](),
            this["_setCreatePanelState"]({
              customCategoryEditing: false,
              customCategoryDraft: "",
            }),
            v183());
        }),
        v182["addEventListener"]("focusout", (v207) => {
          if (!v207["target"]["matches"]("#asset-category-custom-input"))
            return;
          v190();
        }));
      const v208 = (v209) => {
        !v182["contains"](v209["target"]) &&
          !v180["contains"](v209["target"]) &&
          v198();
      };
      ((this["_createPanelDropdownOutsideHandler"] = v208),
        document["addEventListener"]("pointerdown", v208));
    }
    v178["querySelectorAll"](".v2-asset-create-tab")["forEach"]((v210) => {
      v210["addEventListener"]("click", () => {
        const v211 = v210["dataset"]["mode"] === "update" ? "update" : "create";
        if (v211 === this["_createPanelState"]?.["mode"]) return;
        this["_setCreatePanelState"]({
          mode: v211,
          updateConfirmOpen: false,
          customCategoryEditing: false,
          customCategoryDraft: "",
          error: "",
        });
        if (
          v211 === "update" &&
          !this["_createPanelState"]?.["selectedAssetId"]
        ) {
          const v212 = this["_getFilteredUpdateAssets"]()[0] || null;
          v212 && this["_syncCreatePanelDraftFromTarget"](v212);
        }
        this["_renderCreatePanelContent"]();
      });
    });
    const v213 = v178["querySelector"]("#asset-create-name");
    v213 &&
      v213["addEventListener"]("input", (v214) => {
        this["_setCreatePanelState"]({
          draft: { name: v214["target"]["value"] || "" },
          updateConfirmOpen: false,
          error: "",
        });
      });
    const v215 = v178["querySelector"]("#asset-update-search");
    v215 &&
      v215["addEventListener"]("input", (v216) => {
        (this["_setCreatePanelState"]({
          updateSearchKeyword: v216["target"]["value"] || "",
          updateConfirmOpen: false,
          error: "",
        }),
          this["_renderCreatePanelContent"]());
      });
    v178["querySelectorAll"](".v2-asset-update-item")["forEach"]((v217) => {
      v217["addEventListener"]("click", () => {
        const v218 = String(v217["dataset"]["assetId"] || ""),
          v219 = this["_getSortedAssets"]()["find"](
            (v220) => String(v220?.["id"] || "") === v218,
          );
        if (!v219) return;
        (this["_syncCreatePanelDraftFromTarget"](v219),
          this["_renderCreatePanelContent"]());
      });
    });
    const v221 = v178["querySelector"]("#asset-create-submit");
    v221 &&
      v221["addEventListener"]("click", () => {
        this["_submitCreatePanel"]();
      });
    const v222 = v178["querySelector"]("#asset-join-submit");
    v222 &&
      v222["addEventListener"]("click", () => {
        this["_joinCreatePanelToAsset"]();
      });
  }
  async ["_submitCreatePanel"]() {
    const v223 = this["_createPanelState"],
      v224 = this["createPanel"];
    if (!v223 || !v224 || v223["saving"]) return;
    const v225 = Array["isArray"](v223["selectedIds"])
        ? v223["selectedIds"]
        : [],
      v226 = this["_getSelectedAssetNodes"](v225);
    if (!v226["length"]) {
      (this["_setCreatePanelState"]({ error: "当前没有可保存的节点" }),
        this["_renderCreatePanelContent"]());
      return;
    }
    const v227 =
        String(this["_createPanelState"]?.["draft"]?.["name"] || "")[
          "trim"
        ]() || "未命名资产",
      v228 =
        String(this["_createPanelState"]?.["draft"]?.["category"] || "")[
          "trim"
        ]() || this["activeTab"];
    if (v223["mode"] === "update") {
      const v229 = this["_getFilteredUpdateAssets"]()["find"](
        (v230) =>
          String(v230?.["id"] || "") === String(v223["selectedAssetId"] || ""),
      );
      if (!v229) {
        (this["_setCreatePanelState"]({ error: "请选择要更新的历史资产" }),
          this["_renderCreatePanelContent"]());
        return;
      }
      if (!v223["updateConfirmOpen"]) {
        (this["_setCreatePanelState"]({ updateConfirmOpen: true, error: "" }),
          this["_renderCreatePanelContent"]());
        return;
      }
      const v231 = this["_buildAssetPayloadFromSelection"](v225, {
        id: v229["id"],
        name: v227,
        category: v228,
        createdAt: v229["createdAt"] || v229["updatedAt"] || Date["now"](),
        updatedAt: Date["now"](),
      });
      (this["_setCreatePanelState"]({
        saving: true,
        savingAction: "overwrite",
        error: "",
      }),
        this["_renderCreatePanelContent"]());
      try {
        (await saveAssetToServer(v231),
          this["_upsertLocalAsset"](v231),
          this["_scheduleVideoThumbJobs"](),
          (this["_openAssetId"] =
            String(v231["id"] || "") === this["_openAssetId"]
              ? v231["id"]
              : this["_openAssetId"]),
          window["showToast"]?.("资产已更新", "success"),
          this["closeCreatePanel"](),
          this["sidebarPanel"]?.["classList"]["contains"]("show") &&
            this["renderSidebarContent"]());
      } catch (v232) {
        (this["_setCreatePanelState"]({
          saving: false,
          savingAction: "",
          error: "资产更新失败",
        }),
          this["_renderCreatePanelContent"](),
          console["error"](v232),
          window["showToast"]?.("资产更新失败", "error"));
      }
      return;
    }
    const v233 = this["_buildAssetPayloadFromSelection"](v225, {
      name: v227,
      category: v228,
      createdAt: Date["now"](),
      updatedAt: Date["now"](),
    });
    (this["_setCreatePanelState"]({
      saving: true,
      savingAction: "create",
      error: "",
    }),
      this["_renderCreatePanelContent"]());
    try {
      (await saveAssetToServer(v233),
        this["_upsertLocalAsset"](v233),
        this["_scheduleVideoThumbJobs"](),
        window["showToast"]?.("资产创建成功", "success"),
        this["_playCreateAssetFly"](v224),
        this["closeCreatePanel"](),
        this["sidebarPanel"]?.["classList"]["contains"]("show") &&
          ((this["_newAssetPulseId"] = String(v233["id"] || "")),
          this["renderSidebarContent"]()));
    } catch (v234) {
      (this["_setCreatePanelState"]({
        saving: false,
        savingAction: "",
        error: "资产创建失败",
      }),
        this["_renderCreatePanelContent"](),
        console["error"](v234),
        window["showToast"]?.("资产创建失败", "error"));
    }
  }
  async ["_joinCreatePanelToAsset"]() {
    const v235 = this["_createPanelState"],
      v236 = this["createPanel"];
    if (!v235 || !v236 || v235["saving"]) return;
    const v237 = Array["isArray"](v235["selectedIds"])
        ? v235["selectedIds"]
        : [],
      v238 = this["_getSelectedAssetNodes"](v237);
    if (!v238["length"]) {
      (this["_setCreatePanelState"]({ error: "当前没有可加入的节点" }),
        this["_renderCreatePanelContent"]());
      return;
    }
    const v239 = this["_getFilteredUpdateAssets"]()["find"](
      (v240) =>
        String(v240?.["id"] || "") === String(v235["selectedAssetId"] || ""),
    );
    if (!v239) {
      (this["_setCreatePanelState"]({ error: "请选择要加入的历史资产" }),
        this["_renderCreatePanelContent"]());
      return;
    }
    const v241 =
        String(this["_createPanelState"]?.["draft"]?.["name"] || "")[
          "trim"
        ]() || "未命名资产",
      v242 =
        String(this["_createPanelState"]?.["draft"]?.["category"] || "")[
          "trim"
        ]() || this["activeTab"],
      v243 = this["_buildAssetAppendPayload"](v239, v237, {
        name: v241,
        category: v242,
        updatedAt: Date["now"](),
      });
    (this["_setCreatePanelState"]({
      saving: true,
      savingAction: "join",
      updateConfirmOpen: false,
      error: "",
    }),
      this["_renderCreatePanelContent"]());
    try {
      (await saveAssetToServer(v243),
        this["_upsertLocalAsset"](v243),
        this["_scheduleVideoThumbJobs"](),
        (this["_openAssetId"] =
          String(v243["id"] || "") === this["_openAssetId"]
            ? v243["id"]
            : this["_openAssetId"]),
        window["showToast"]?.("资产已加入", "success"),
        this["closeCreatePanel"](),
        this["sidebarPanel"]?.["classList"]["contains"]("show") &&
          this["renderSidebarContent"]());
    } catch (v244) {
      (this["_setCreatePanelState"]({
        saving: false,
        savingAction: "",
        error: "资产加入失败",
      }),
        this["_renderCreatePanelContent"](),
        console["error"](v244),
        window["showToast"]?.("资产加入失败", "error"));
    }
  }
  ["_getCanvasCenterWorld"]() {
    const { viewport: v245 } = appStore["getState"](),
      v246 = window["innerWidth"] / 2,
      v247 = window["innerHeight"] / 2,
      v248 =
        document["documentElement"]?.["clientWidth"] ||
        window["innerWidth"] ||
        0,
      v249 =
        document["documentElement"]?.["clientHeight"] ||
        window["innerHeight"] ||
        0;
    if (!v248 || !v249) return screenToWorld(v246, v247, v245);
    let v250 = 0,
      v251 = 0,
      v252 = v248,
      v253 = v249;
    const v254 = [],
      v255 = document["querySelector"]("header");
    if (v255) v254["push"](v255);
    const v256 = document["querySelector"](".sidebar-floating");
    if (v256) v254["push"](v256);
    if (this["sidebarPanel"]?.["classList"]?.["contains"]("show"))
      v254["push"](this["sidebarPanel"]);
    const v257 = 8;
    for (const v258 of v254) {
      if (!v258?.["isConnected"]) continue;
      const v259 = v258["getBoundingClientRect"](),
        v260 = Math["max"](v250, v259["left"]),
        v261 = Math["max"](v251, v259["top"]),
        v262 = Math["min"](v252, v259["right"]),
        v263 = Math["min"](v253, v259["bottom"]);
      if (v262 <= v260 || v263 <= v261) continue;
      if (v259["left"] <= v250 + v257 && v259["right"] > v250 + v257) {
        v250 = Math["max"](v250, v259["right"]);
        continue;
      }
      if (v259["right"] >= v252 - v257 && v259["left"] < v252 - v257) {
        v252 = Math["min"](v252, v259["left"]);
        continue;
      }
      if (v259["top"] <= v251 + v257 && v259["bottom"] > v251 + v257) {
        v251 = Math["max"](v251, v259["bottom"]);
        continue;
      }
      if (v259["bottom"] >= v253 - v257 && v259["top"] < v253 - v257) {
        v253 = Math["min"](v253, v259["top"]);
        continue;
      }
    }
    const v264 = v252 - v250,
      v265 = v253 - v251,
      v266 = v264 > 40 ? v250 + v264 / 2 : v246,
      v267 = v265 > 40 ? v251 + v265 / 2 : v247;
    return screenToWorld(v266, v267, v245);
  }
  ["_calcNodesBBox"](v268) {
    let v269 = Infinity,
      v270 = Infinity,
      v271 = -Infinity,
      v272 = -Infinity;
    for (const v273 of v268 || []) {
      if (!v273) continue;
      const v274 = Number(v273["x"]) || 0,
        v275 = Number(v273["y"]) || 0,
        v276 = Number(v273["width"] ?? v273["w"]) || 100,
        v277 = Number(v273["height"] ?? v273["h"]) || 100;
      ((v269 = Math["min"](v269, v274)),
        (v270 = Math["min"](v270, v275)),
        (v271 = Math["max"](v271, v274 + v276)),
        (v272 = Math["max"](v272, v275 + v277)));
    }
    if (!Number["isFinite"](v269) || !Number["isFinite"](v270))
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0, cx: 0, cy: 0 };
    const v278 = Math["max"](0, v271 - v269),
      v279 = Math["max"](0, v272 - v270);
    return {
      minX: v269,
      minY: v270,
      maxX: v271,
      maxY: v272,
      w: v278,
      h: v279,
      cx: v269 + v278 / 2,
      cy: v270 + v279 / 2,
    };
  }
  ["_preloadThumb"](v280) {
    const v281 = String(v280 || "");
    if (!v281) return;
    if (v281["startsWith"]("data:")) return;
    if (this["_thumbPreloadSet"]["has"](v281)) return;
    (this["_thumbPreloadSet"]["add"](v281), this["_ensureThumbDecoded"](v281));
  }
  ["_ensureThumbDecoded"](v282) {
    const v283 = String(v282 || "");
    if (!v283) return Promise["resolve"](false);
    if (v283["startsWith"]("data:")) return Promise["resolve"](true);
    const v284 = this["_thumbDecodePromiseMap"]["get"](v283);
    if (v284) return v284;
    const v285 = new Promise((v286) => {
      const v287 = new Image();
      ((v287["decoding"] = "async"),
        (v287["loading"] = "eager"),
        (v287["onload"] = () => v286(true)),
        (v287["onerror"] = () => v286(false)),
        (v287["src"] = v283),
        typeof v287["decode"] === "function" &&
          v287["decode"]()
            ["then"](() => v286(true))
            ["catch"](() => v286(false)));
    });
    return (this["_thumbDecodePromiseMap"]["set"](v283, v285), v285);
  }
  ["_isVideoMediaSrc"](v288) {
    const v289 = String(v288 || "")["toLowerCase"]();
    return (
      v289["endsWith"](".mp4") ||
      v289["endsWith"](".webm") ||
      v289["endsWith"](".mov") ||
      v289["endsWith"](".mkv") ||
      v289["endsWith"](".m4v")
    );
  }
  async ["_captureVideoFirstFrameDataUrl"](v290) {
    const v291 = String(v290 || "");
    if (!v291) return "";
    return await new Promise((v292) => {
      const v293 = document["createElement"]("video");
      ((v293["preload"] = "auto"),
        (v293["muted"] = true),
        (v293["playsInline"] = true),
        (v293["crossOrigin"] = "anonymous"));
      const v294 = () => {
          (v293["removeAttribute"]("src"), v293["load"]());
        },
        v295 = () => {
          (v294(), v292(""));
        },
        v296 = async () => {
          try {
            const v297 = Number["isFinite"](v293["duration"])
                ? v293["duration"]
                : 0,
              v298 =
                v297 > 0 ? Math["min"](0.08, Math["max"](0, v297 - 0.08)) : 0,
              v299 = () => {
                try {
                  const v300 = v293["videoWidth"] || 0,
                    v301 = v293["videoHeight"] || 0;
                  if (!v300 || !v301) return v295();
                  const v302 = 320,
                    v303 = 320,
                    v304 = Math["min"](1, v302 / v300, v303 / v301),
                    v305 = Math["max"](1, Math["round"](v300 * v304)),
                    v306 = Math["max"](1, Math["round"](v301 * v304)),
                    v307 = document["createElement"]("canvas");
                  ((v307["width"] = v305), (v307["height"] = v306));
                  const v308 = v307["getContext"]("2d");
                  v308["drawImage"](v293, 0, 0, v305, v306);
                  const v309 = v307["toDataURL"]("image/jpeg", 0.82);
                  (v294(), v292(v309));
                } catch (v310) {
                  v295();
                } finally {
                  v293["removeEventListener"]("seeked", v299);
                }
              };
            (v293["addEventListener"]("seeked", v299, { once: true }),
              (v293["currentTime"] = v298));
          } catch (v311) {
            v295();
          }
        };
      (v293["addEventListener"]("error", v295, { once: true }),
        v293["addEventListener"]("loadeddata", v296, { once: true }),
        attachMediaElementPlaybackSource(v293, v291, { preload: "auto" })[
          "catch"
        ](() => {
          if (
            !String(v293["getAttribute"]("src") || v293["src"] || "")["trim"]()
          ) {
            v293["src"] = v291;
            try {
              v293["load"]?.();
            } catch {}
          }
        }));
    });
  }
  ["_scheduleVideoThumbJobs"]() {
    if (this["_videoThumbTimer"]) return;
    this["_videoThumbTimer"] = window["setTimeout"](() => {
      ((this["_videoThumbTimer"] = 0), this["_runVideoThumbJobs"]());
    }, 0);
  }
  ["_scheduleSidebarRender"]() {
    if (!this["sidebarPanel"]?.["classList"]["contains"]("show")) return;
    if (this["_renamingAssetId"]) return;
    if (this["_sidebarRenderRaf"]) return;
    this["_sidebarRenderRaf"] = window["requestAnimationFrame"](() => {
      this["_sidebarRenderRaf"] = 0;
      if (!this["sidebarPanel"]?.["classList"]["contains"]("show")) return;
      if (this["_renamingAssetId"]) return;
      this["renderSidebarContent"]();
    });
  }
  ["_beginRenameAsset"](v312) {
    const v313 = String(v312 || "");
    if (!v313) return;
    if (this["_pendingDeleteAssetId"]) this["_pendingDeleteAssetId"] = "";
    ((this["_renamingAssetId"] = v313), this["renderSidebarContent"]());
  }
  ["_cancelRenameAsset"]() {
    if (!this["_renamingAssetId"]) return;
    ((this["_renamingAssetId"] = ""), this["renderSidebarContent"]());
  }
  async ["_commitRenameAsset"](v314, v315) {
    const v316 = String(v314 || ""),
      v317 = String(v315 || "")["trim"]();
    if (!v316) return;
    if (!v317) {
      window["showToast"]?.("名称不能为空", "error");
      return;
    }
    const v318 = (this["assets"] || [])["find"](
      (v319) => String(v319?.["id"] || "") === v316,
    );
    if (!v318) return;
    const v320 = String(v318?.["name"] || ""),
      v321 = v318?.["updatedAt"];
    if (v320 === v317) {
      ((this["_renamingAssetId"] = ""), this["renderSidebarContent"]());
      return;
    }
    ((v318["name"] = v317), (v318["updatedAt"] = Date["now"]()));
    try {
      (await saveAssetToServer(v318),
        this["_upsertLocalAsset"](v318),
        window["showToast"]?.("已重命名", "success"));
    } catch (v322) {
      ((v318["name"] = v320),
        (v318["updatedAt"] = v321),
        window["showToast"]?.("重命名失败", "error"));
    } finally {
      ((this["_renamingAssetId"] = ""), this["renderSidebarContent"]());
    }
  }
  async ["_runVideoThumbJobs"]() {
    let v323 = 2;
    for (const v324 of this["assets"] || []) {
      if (v323 <= 0) break;
      const v325 = String(v324?.["id"] || "")["trim"]();
      if (!v325) continue;
      const v326 = Array["isArray"](v324?.["items"]) ? v324["items"] : [];
      for (let v327 = 0; v327 < v326["length"]; v327++) {
        if (v323 <= 0) break;
        const v328 = v326[v327],
          v329 = _normalizeAssetType(v328?.["type"]);
        if (v329 !== "video") continue;
        const v330 = String(v328?.["thumbSrc"] || "");
        if (v330 && !this["_isVideoMediaSrc"](v330)) continue;
        const v331 = v325 + ":" + v327;
        if (this["_videoThumbInFlight"]["has"](v331)) continue;
        (this["_videoThumbInFlight"]["add"](v331), (v323 -= 1));
        const v332 = v330 || _resolveNodeStableThumbSrc(v328?.["nodeData"]);
        this["_captureVideoFirstFrameDataUrl"](v332)
          ["then"](async (v333) => {
            if (!String(v333 || "")["startsWith"]("data:image/")) return;
            const v334 = await saveAssetThumbToServer({
                assetId: v325,
                key: String(v327),
                dataUrl: v333,
              }),
              v335 = String(v334?.["url"] || "");
            if (!v335) return;
            v328["thumbSrc"] = v335;
            if (!v324["coverUrl"] && v327 === 0) v324["coverUrl"] = v335;
            (await saveAssetToServer(v324),
              upsertAssetMentionAsset(v324),
              this["sidebarPanel"]?.["classList"]["contains"]("show") &&
                this["_scheduleSidebarRender"]());
          })
          ["catch"](() => {})
          ["finally"](() => {
            this["_videoThumbInFlight"]["delete"](v331);
          });
      }
    }
  }
  async ["loadAssetsFromServer"]() {
    try {
      const v336 = await fetchAssetsFromServer();
      ((this["assets"] = _sortAssetsByUpdatedTime(
        (Array["isArray"](v336) ? v336 : [])
          ["map"]((v337) => this["_normalizeAssetEntity"](v337))
          ["filter"](Boolean),
      )),
        this["_syncTabsFromAssets"](),
        this["_renderSidebarTabs"](),
        this["assets"]["forEach"]((v338) => {
          !v338["coverUrl"] &&
            v338["nodes"] &&
            v338["nodes"][0] &&
            (v338["coverUrl"] = _resolveNodeStableThumbSrc(v338["nodes"][0]));
          if (Array["isArray"](v338["items"]))
            v338["items"]["forEach"]((v339) => {
              !v339["thumbSrc"] &&
                v339["nodeData"] &&
                (v339["thumbSrc"] = _resolveNodeStableThumbSrc(
                  v339["nodeData"],
                ));
            });
          else
            Array["isArray"](v338["nodes"]) &&
              (v338["items"] = v338["nodes"]["map"]((v340) =>
                _buildAssetItem(v340),
              ));
        }),
        setAssetMentionAssets(this["_getMentionEligibleAssets"]()));
      let v341 = 0;
      for (const v342 of this["assets"]) {
        if (v341 >= 32) break;
        v342?.["coverUrl"] &&
          (this["_preloadThumb"](v342["coverUrl"]), (v341 += 1));
        const v343 = Array["isArray"](v342?.["items"]) ? v342["items"] : [];
        for (const v344 of v343) {
          if (v341 >= 32) break;
          v344?.["thumbSrc"] &&
            (this["_preloadThumb"](v344["thumbSrc"]), (v341 += 1));
        }
      }
      (this["_scheduleVideoThumbJobs"](),
        this["sidebarPanel"] &&
          this["sidebarPanel"]["classList"]["contains"]("show") &&
          this["renderSidebarContent"]());
    } catch (v345) {
      console["error"]("加载全局资产失败", v345);
    }
  }
  async ["showCreatePanel"](v346, v347, v348 = {}) {
    if (!v346 || v346["length"] === 0) return;
    (void v347, void v348, this["closeCreatePanel"]());
    const v349 = document["createElement"]("div");
    v349["className"] = "v2-asset-create-backdrop show";
    const v350 = document["createElement"]("div");
    ((v350["className"] = "v2-asset-create-panel"),
      v350["setAttribute"]("role", "dialog"),
      v350["setAttribute"]("aria-modal", "true"),
      v350["setAttribute"]("aria-label", "资产"));
    const v351 = appStore["getState"](),
      v352 = v351["nodes"][v346[0]];
    (v349["appendChild"](v350),
      document["body"]["appendChild"](v349),
      (this["createPanelBackdrop"] = v349),
      (this["createPanel"] = v350));
    const v353 = await this["_resolveCreatePanelCover"](v352);
    if (!this["createPanel"] || this["createPanel"] !== v350) {
      String(this["_createPanelCoverObjectUrl"] || "")["startsWith"]("blob:") &&
        URL["revokeObjectURL"](this["_createPanelCoverObjectUrl"]);
      this["_createPanelCoverObjectUrl"] = "";
      return;
    }
    ((this["_createPanelState"] = this["_createDefaultPanelState"](v346, v353)),
      this["_renderCreatePanelContent"](),
      v349["addEventListener"]("pointerdown", (v354) => {
        if (v354["target"] === v349) this["closeCreatePanel"]();
      }),
      (this["_createPanelKeydownHandler"] = (v355) => {
        if (v355["key"] !== "Escape") return;
        if (this["_createPanelDropdownEl"]?.["contains"](v355["target"]))
          return;
        this["closeCreatePanel"]();
      }),
      document["addEventListener"](
        "keydown",
        this["_createPanelKeydownHandler"],
      ));
  }
  ["_playCreateAssetFly"](v356) {
    const v357 = window["matchMedia"]?.("(prefers-reduced-motion: reduce)")?.[
      "matches"
    ];
    if (v357) return;
    const v358 = v356 && v356["isConnected"] ? v356 : this["createPanel"];
    if (!v358?.["isConnected"]) return;
    const v359 = v358["querySelector"](".v2-asset-create-cover"),
      v360 = v359?.["firstElementChild"];
    if (!v360) return;
    const v361 = v360["getBoundingClientRect"]();
    if (!v361["width"] || !v361["height"]) return;
    const v362 = document["getElementById"]("btnAssets"),
      v363 = v362?.["getBoundingClientRect"]?.();
    if (!v363) return;
    const v364 = document["createElement"]("div");
    ((v364["className"] = "v2-asset-create-fly"),
      (v364["style"]["left"] = v361["left"] + "px"),
      (v364["style"]["top"] = v361["top"] + "px"),
      (v364["style"]["width"] = v361["width"] + "px"),
      (v364["style"]["height"] = v361["height"] + "px"));
    const v365 = v360["cloneNode"](true);
    if (v365?.["id"]) v365["removeAttribute"]("id");
    (v364["appendChild"](v365), document["body"]["appendChild"](v364));
    const v366 = v361["left"] + v361["width"] / 2,
      v367 = v361["top"] + v361["height"] / 2,
      v368 = v363["left"] + v363["width"] / 2,
      v369 = v363["top"] + v363["height"] / 2,
      v370 = v368 - v366,
      v371 = v369 - v367,
      v372 = 0.12,
      v373 = v364["animate"](
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          {
            transform:
              "translate(" + v370 + "px," + v371 + "px)\x20scale(" + v372 + ")",
            opacity: 0.2,
          },
        ],
        { duration: 520, easing: "cubic-bezier(0.2, 0, 0, 1)" },
      );
    v373["onfinish"] = () => {
      (v364["remove"](),
        v362?.["animate"] &&
          v362["animate"](
            [
              { transform: "scale(1)", filter: "brightness(1)" },
              { transform: "scale(1.08)", filter: "brightness(1.2)" },
              { transform: "scale(1)", filter: "brightness(1)" },
            ],
            { duration: 260, easing: "cubic-bezier(0.2, 0, 0, 1)" },
          ));
    };
  }
  ["closeCreatePanel"]() {
    (this["_createPanelDropdownOutsideHandler"] &&
      (document["removeEventListener"](
        "pointerdown",
        this["_createPanelDropdownOutsideHandler"],
      ),
      (this["_createPanelDropdownOutsideHandler"] = null)),
      this["_createPanelDropdownEl"] &&
        (this["_createPanelDropdownEl"]["remove"](),
        (this["_createPanelDropdownEl"] = null)),
      this["_createPanelKeydownHandler"] &&
        (document["removeEventListener"](
          "keydown",
          this["_createPanelKeydownHandler"],
        ),
        (this["_createPanelKeydownHandler"] = null)),
      this["_createPanelCoverObjectUrl"] &&
        (String(this["_createPanelCoverObjectUrl"])["startsWith"]("blob:") &&
          URL["revokeObjectURL"](this["_createPanelCoverObjectUrl"]),
        (this["_createPanelCoverObjectUrl"] = "")),
      this["createPanel"] &&
        (this["createPanel"]["remove"](), (this["createPanel"] = null)),
      this["createPanelBackdrop"] &&
        (this["createPanelBackdrop"]["remove"](),
        (this["createPanelBackdrop"] = null)),
      (this["_createPanelState"] = null));
  }
  ["initSidebarPanel"]() {
    ((this["sidebarPanel"] = document["createElement"]("div")),
      (this["sidebarPanel"]["className"] = "v2-asset-sidebar-panel"),
      (this["sidebarPanel"]["innerHTML"] =
        '\n      <div class="v2-asset-sidebar-header">\n        <button type="button" class="v2-asset-back" data-ui-action="asset-back" aria-label="返回">‹</button>\n        <div class="v2-asset-sidebar-title" id="asset-sidebar-title">\n          <span class="v2-asset-sidebar-title-text" id="asset-sidebar-title-text">资产</span>\n        </div>\n      </div>\n      <div class="v2-asset-sidebar-tabs-shell" id="asset-sidebar-tabs-shell">\n        <button\n          type="button"\n          class="v2-asset-sidebar-tabs-nav v2-asset-sidebar-tabs-nav--prev"\n          data-ui-action="asset-tabs-scroll-prev"\n          aria-label="查看左侧资产分类"\n          hidden\n        >‹</button>\n        <div class="v2-asset-sidebar-tabs" id="asset-sidebar-tabs">\n          ' +
        this["_renderSidebarTabsHtml"]() +
        '\n        </div>\n        <button\n          type="button"\n          class="v2-asset-sidebar-tabs-nav v2-asset-sidebar-tabs-nav--next"\n          data-ui-action="asset-tabs-scroll-next"\n          aria-label="查看右侧资产分类"\n          hidden\n        >›</button>\n      </div>\n      <div class="v2-asset-sidebar-content" id="asset-sidebar-content"></div>\n    '));
    const v374 = document["querySelector"](".sidebar-floating");
    v374
      ? v374["appendChild"](this["sidebarPanel"])
      : document["body"]["appendChild"](this["sidebarPanel"]);
    const v375 = this["sidebarPanel"]["querySelector"]("#asset-sidebar-tabs");
    (v375["addEventListener"]("click", (v376) => {
      if (v376["target"]["closest"]("[data-ui-action='asset-category-delete']"))
        return;
      const v377 = v376["target"]["closest"](".v2-asset-sidebar-tab");
      v377 &&
        ((this["_renamingAssetId"] = ""),
        (this["_pendingDeleteAssetId"] = ""),
        (this["activeTab"] = v377["dataset"]["cat"]),
        (this["_openAssetId"] = null),
        v375["querySelectorAll"](".v2-asset-sidebar-tab")["forEach"]((v378) =>
          v378["classList"]["remove"]("active"),
        ),
        v377["classList"]["add"]("active"),
        this["renderSidebarContent"]());
    }),
      v375["addEventListener"](
        "scroll",
        () => this["_updateSidebarTabsOverflowHint"](),
        { passive: true },
      ),
      this["sidebarPanel"]["addEventListener"]("click", (v379) => {
        const v380 = v379["target"]["closest"]("[data-ui-action]"),
          v381 = v380?.["dataset"]?.["uiAction"] || "";
        if (v381 === "asset-tabs-scroll-prev") {
          (v379["preventDefault"](),
            v379["stopPropagation"](),
            this["_scrollSidebarTabs"](-1));
          return;
        }
        if (v381 === "asset-tabs-scroll-next") {
          (v379["preventDefault"](),
            v379["stopPropagation"](),
            this["_scrollSidebarTabs"](1));
          return;
        }
        if (v381 === "asset-category-delete") {
          (v379["preventDefault"](), v379["stopPropagation"]());
          const v382 = v380?.["dataset"]?.["cat"];
          if (v382) void this["_deleteUserCategory"](v382);
          return;
        }
        if (v381 === "asset-back") {
          ((this["_renamingAssetId"] = ""),
            (this["_pendingDeleteAssetId"] = ""),
            (this["_openAssetId"] = null),
            this["renderSidebarContent"]());
          return;
        }
        if (v381 === "asset-delete-open") {
          (v379["preventDefault"](),
            v379["stopPropagation"](),
            (this["_renamingAssetId"] = ""));
          const v383 = v380?.["dataset"]?.["assetId"];
          if (!v383) return;
          ((this["_pendingDeleteAssetId"] = v383),
            this["renderSidebarContent"]());
          return;
        }
        if (v381 === "asset-delete-cancel") {
          (v379["preventDefault"](),
            v379["stopPropagation"](),
            (this["_pendingDeleteAssetId"] = ""),
            this["renderSidebarContent"]());
          return;
        }
        if (v381 === "asset-delete-confirm") {
          (v379["preventDefault"](), v379["stopPropagation"]());
          const v384 = v380?.["dataset"]?.["assetId"];
          if (!v384) return;
          ((this["_pendingDeleteAssetId"] = ""), this["_deleteAsset"](v384));
          return;
        }
        if (v381 === "asset-add-all") {
          (v379["preventDefault"](),
            v379["stopPropagation"](),
            (this["_renamingAssetId"] = ""),
            (this["_pendingDeleteAssetId"] = ""));
          const v385 = v380?.["dataset"]?.["assetId"];
          if (v385) this["restoreAssetToCanvas"](v385);
          return;
        }
        const v386 = v379["target"]["closest"](".v2-asset-subitem");
        if (v386) {
          const v387 = v386["dataset"]["assetId"],
            v388 = Number(v386["dataset"]["idx"]);
          if (v387 && Number["isFinite"](v388))
            this["_restoreAssetSubItem"](v387, v388);
          return;
        }
        const v389 = v379["target"]["closest"](".v2-asset-item");
        v389 &&
          v389["dataset"]?.["id"] &&
          ((this["_renamingAssetId"] = ""),
          (this["_pendingDeleteAssetId"] = ""),
          (this["_openAssetId"] = v389["dataset"]["id"]),
          this["renderSidebarContent"]());
      }));
    const v390 = document["getElementById"]("btnAssets");
    if (v390) {
      let v391 = false;
      const v392 = () => {
        (!this["sidebarPanel"]["classList"]["contains"]("show") &&
          this["showSidebarPanel"](),
          !v391 &&
            ((v391 = true),
            this["loadAssetsFromServer"]()["finally"](() => {
              v391 = false;
            })));
      };
      registerSidebarSubmenu({
        key: "assets",
        button: v390,
        panel: this["sidebarPanel"],
        open: v392,
        close: () => this["hideSidebarPanel"](),
        isOpen: () => this["sidebarPanel"]["classList"]["contains"]("show"),
      });
    }
  }
  ["showSidebarPanel"]() {
    (this["renderSidebarContent"](),
      this["sidebarPanel"]["classList"]["add"]("show"));
  }
  ["hideSidebarPanel"]() {
    (this["sidebarPanel"]["classList"]["remove"]("show"),
      document["getElementById"]("btnAssets")?.["classList"]["remove"](
        "active",
      ));
  }
  ["_getVisibleAssetCardsInList"]() {
    const v393 = this["sidebarPanel"]?.["querySelector"](
      "#asset-sidebar-content\x20>\x20.v2-asset-view-list",
    );
    if (!v393) return { listView: null, cards: [] };
    const v394 = Array["from"](
      v393["querySelectorAll"](":scope > .v2-asset-item"),
    )["filter"]((v395) => v395["style"]["display"] !== "none");
    return { listView: v393, cards: v394 };
  }
  ["_captureRectsById"](v396) {
    const v397 = new Map();
    for (const v398 of v396) {
      const v399 = String(v398["dataset"]?.["id"] || "");
      if (!v399) continue;
      v397["set"](v399, v398["getBoundingClientRect"]());
    }
    return v397;
  }
  ["_playFlip"](v400, v401) {
    if (!v400 || !v401?.["size"]) return;
    const v402 = Array["from"](
        v400["querySelectorAll"](":scope > .v2-asset-item"),
      )["filter"]((v403) => v403["style"]["display"] !== "none"),
      v404 = new Map();
    for (const v405 of v402) {
      const v406 = String(v405["dataset"]?.["id"] || "");
      if (!v406) continue;
      v404["set"](v406, v405["getBoundingClientRect"]());
    }
    for (const v407 of v402) {
      const v408 = String(v407["dataset"]?.["id"] || "");
      if (!v408) continue;
      const v409 = v401["get"](v408),
        v410 = v404["get"](v408);
      if (!v409 || !v410) continue;
      const v411 = v409["left"] - v410["left"],
        v412 = v409["top"] - v410["top"];
      if (!v411 && !v412) continue;
      v407["animate"](
        [
          { transform: "translate(" + v411 + "px, " + v412 + "px)" },
          { transform: "translate(0,\x200)" },
        ],
        { duration: 220, easing: "cubic-bezier(0.2, 0, 0, 1)" },
      );
    }
  }
  ["_playDeleteShake"](v413) {
    if (!v413) return;
    (v413["classList"]["remove"]("is-delete-shaking"),
      void v413["offsetWidth"],
      v413["classList"]["add"]("is-delete-shaking"),
      window["setTimeout"](() => {
        if (v413["isConnected"])
          v413["classList"]["remove"]("is-delete-shaking");
      }, 240));
  }
  async ["_deleteAsset"](v414) {
    const v415 = String(v414 || "");
    if (!v415) return;
    const { listView: v416, cards: v417 } =
        this["_getVisibleAssetCardsInList"](),
      v418 = this["_captureRectsById"](v417);
    try {
      await deleteAssetFromServer(v415);
    } catch (v419) {
      window["showToast"]?.("删除失败", "error");
      return;
    }
    ((this["assets"] = (this["assets"] || [])["filter"](
      (v420) => String(v420?.["id"] || "") !== v415,
    )),
      this["_syncTabsFromAssets"](),
      this["_renderSidebarTabs"](),
      removeAssetMentionAsset(v415));
    if (this["_openAssetId"] === v415) this["_openAssetId"] = null;
    const v421 = this["_assetCardPool"]?.["get"]?.(v415);
    if (v421?.["isConnected"]) v421["remove"]();
    (this["_assetCardPool"]?.["delete"]?.(v415),
      this["renderSidebarContent"](),
      window["requestAnimationFrame"](() => {
        window["requestAnimationFrame"](() => {
          const { listView: v422 } = this["_getVisibleAssetCardsInList"]();
          this["_playFlip"](v422, v418);
        });
      }));
  }
  async ["_deleteUserCategory"](v423) {
    const v424 = this["_normalizeCategoryName"](v423);
    if (!v424 || !this["_isUserCategory"](v424)) return;
    const v425 = this["_getSortedAssets"]()["some"](
      (v426) =>
        this["_categoryKey"](v426?.["category"]) === this["_categoryKey"](v424),
    );
    if (v425) {
      window["showToast"]?.("分类下还有资产，不能删除", "warn");
      return;
    }
    const v427 = [...this["userCategories"]];
    this["userCategories"] = v427["filter"](
      (v428) => this["_categoryKey"](v428) !== this["_categoryKey"](v424),
    );
    this["_categoryKey"](this["activeTab"]) === this["_categoryKey"](v424) &&
      ((this["activeTab"] = DEFAULT_ASSET_CATEGORIES[0]),
      (this["_openAssetId"] = null));
    (this["_syncTabsFromAssets"](),
      this["_renderSidebarTabs"](),
      this["renderSidebarContent"]());
    try {
      (await this["_saveUserCategories"](),
        window["showToast"]?.("分类已删除", "success"));
    } catch (v429) {
      ((this["userCategories"] = v427),
        this["_syncTabsFromAssets"](),
        this["_renderSidebarTabs"](),
        this["renderSidebarContent"](),
        console["error"](v429),
        window["showToast"]?.("分类删除失败", "error"));
    }
  }
  ["_setThumbContent"](v430, v431, v432) {
    if (!v430) return;
    const v433 = String(v431 || ""),
      v434 = _normalizeAssetType(v432);
    if (v433 && !(v434 === "video" && this["_isVideoMediaSrc"](v433))) {
      const v435 = v430["dataset"]["thumbSrc"] || "";
      if (v430["dataset"]["thumbKind"] === "img" && v435 === v433) return;
      if (v430["dataset"]["pendingSrc"] === v433) return;
      v430["childElementCount"] === 0 &&
        v430["dataset"]["thumbKind"] !== "img" &&
        ((v430["dataset"]["thumbKind"] = "icon"),
        (v430["dataset"]["thumbType"] = String(v432 || "other")),
        (v430["dataset"]["thumbSrc"] = ""),
        (v430["innerHTML"] = _renderAssetIcon(v432)));
      ((v430["dataset"]["pendingSrc"] = v433),
        this["_ensureThumbDecoded"](v433)["then"]((v436) => {
          if (!v436) {
            if (v430["dataset"]["pendingSrc"] === v433)
              v430["dataset"]["pendingSrc"] = "";
            return;
          }
          if (!v430["isConnected"]) return;
          if (v430["dataset"]["pendingSrc"] !== v433) return;
          v430["dataset"]["pendingSrc"] = "";
          let v437 = v430["querySelector"](":scope > img");
          !v437
            ? ((v437 = document["createElement"]("img")),
              (v437["alt"] = "缩略图"),
              (v437["draggable"] = false),
              (v437["decoding"] = "async"),
              (v437["loading"] = "eager"),
              (v437["className"] = "v2-asset-thumb-img"))
            : v437["classList"]["add"]("v2-asset-thumb-img");
          if (v437["getAttribute"]("src") !== v433)
            v437["setAttribute"]("src", v433);
          ((v430["dataset"]["thumbKind"] = "img"),
            (v430["dataset"]["thumbSrc"] = v433),
            (v430["firstElementChild"] !== v437 ||
              v430["childElementCount"] !== 1) &&
              v430["replaceChildren"](v437));
        }));
      return;
    }
    const v438 = String(v432 || "other");
    if (
      v430["dataset"]["thumbKind"] === "icon" &&
      v430["dataset"]["thumbType"] === v438
    )
      return;
    ((v430["dataset"]["thumbKind"] = "icon"),
      (v430["dataset"]["thumbType"] = v438),
      (v430["dataset"]["thumbSrc"] = ""),
      (v430["dataset"]["pendingSrc"] = ""),
      (v430["innerHTML"] = _renderAssetIcon(v438)));
  }
  ["renderSidebarContent"]() {
    const v439 = this["sidebarPanel"]?.["querySelector"](
      "#asset-sidebar-content",
    );
    if (!v439) return;
    const v440 = this["sidebarPanel"]["querySelector"](
        "#asset-sidebar-title-text",
      ),
      v441 = this["sidebarPanel"]["querySelector"](".v2-asset-back");
    this["_renderSidebarTabs"]();
    const v442 = () => {
        let v443 = v439["querySelector"](":scope > .v2-asset-view-list");
        !v443 &&
          ((v443 = document["createElement"]("div")),
          (v443["className"] = "v2-asset-view-list"),
          v439["appendChild"](v443));
        let v444 = v439["querySelector"](":scope > .v2-asset-view-detail");
        return (
          !v444 &&
            ((v444 = document["createElement"]("div")),
            (v444["className"] = "v2-asset-view-detail"),
            v439["appendChild"](v444)),
          v439["querySelectorAll"](
            ":scope > .v2-asset-item, :scope > .v2-asset-empty",
          )["forEach"]((v445) => v443["appendChild"](v445)),
          v439["querySelectorAll"](
            ":scope > .v2-asset-detail-actions, :scope > .v2-asset-subgrid",
          )["forEach"]((v446) => v444["appendChild"](v446)),
          { listView: v443, detailView: v444 }
        );
      },
      { listView: v447, detailView: v448 } = v442(),
      v449 = (v450, v451, v452) => this["_setThumbContent"](v450, v451, v452),
      v453 = (v454) => {
        let v455 = v454["querySelector"](":scope > .v2-asset-cover-grid");
        if (!v455) {
          ((v455 = document["createElement"]("div")),
            (v455["className"] = "v2-asset-cover-grid"));
          for (let v456 = 0; v456 < 4; v456++) {
            const v457 = document["createElement"]("div");
            ((v457["className"] = "v2-asset-cover-cell"),
              v455["appendChild"](v457));
          }
          v454["replaceChildren"](v455);
        } else {
          const v458 = v455["querySelectorAll"](
            ":scope\x20>\x20.v2-asset-cover-cell",
          );
          for (let v459 = v458["length"]; v459 < 4; v459++) {
            const v460 = document["createElement"]("div");
            ((v460["className"] = "v2-asset-cover-cell"),
              v455["appendChild"](v460));
          }
        }
        return v455;
      },
      v461 = (v462, v463) => {
        let v464 = v462["querySelector"](":scope\x20>\x20.v2-asset-item-load"),
          v465 = v462["querySelector"](":scope > .v2-asset-item-delete"),
          v466 = v462["querySelector"](
            ":scope > .v2-asset-item-delete-confirm",
          ),
          v467 = v462["querySelector"](":scope > .v2-asset-item-cover"),
          v468 = v462["querySelector"](":scope\x20>\x20.v2-asset-item-name");
        !v464 &&
          ((v464 = document["createElement"]("button")),
          (v464["type"] = "button"),
          (v464["className"] = "v2-asset-item-load"),
          (v464["dataset"]["uiAction"] = "asset-add-all"),
          (v464["title"] = "载入到画布"),
          v464["setAttribute"]("aria-label", "载入到画布"),
          (v464["innerHTML"] =
            '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 5.5a7.5 7.5 0 1 0-1 13.5"/><path d="M12 14h6v6"/><path d="m18 14-6 6"/></svg>'),
          v462["appendChild"](v464));
        !v465 &&
          ((v465 = document["createElement"]("button")),
          (v465["type"] = "button"),
          (v465["className"] = "v2-asset-item-delete"),
          (v465["dataset"]["uiAction"] = "asset-delete-open"),
          v465["setAttribute"]("aria-label", "删除资产"),
          (v465["innerHTML"] =
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v10h-2V9zm4 0h2v10h-2V9zM7 9h2v10H7V9z"/></svg>'),
          v462["appendChild"](v465));
        if (!v466) {
          ((v466 = document["createElement"]("div")),
            (v466["className"] = "v2-asset-item-delete-confirm"),
            (v466["hidden"] = true),
            v466["addEventListener"]("click", (v469) => {
              if (v469["target"] !== v466) return;
              (v469["stopPropagation"](),
                (this["_pendingDeleteAssetId"] = ""),
                this["renderSidebarContent"]());
            }));
          const v470 = document["createElement"]("button");
          ((v470["type"] = "button"),
            (v470["className"] =
              "v2-asset-item-delete-confirm-btn v2-asset-item-delete-confirm-btn--danger"),
            (v470["dataset"]["uiAction"] = "asset-delete-confirm"),
            (v470["textContent"] = "✔"),
            v470["setAttribute"]("aria-label", "确定"));
          const v471 = document["createElement"]("button");
          ((v471["type"] = "button"),
            (v471["className"] =
              "v2-asset-item-delete-confirm-btn\x20v2-asset-item-delete-confirm-btn--neutral"),
            (v471["dataset"]["uiAction"] = "asset-delete-cancel"),
            (v471["textContent"] = "×"),
            v471["setAttribute"]("aria-label", "取消"),
            v466["appendChild"](v470),
            v466["appendChild"](v471),
            v462["appendChild"](v466));
        }
        const v472 = String(v463?.["id"] || "");
        ((v464["dataset"]["assetId"] = v472),
          (v464["disabled"] =
            !Array["isArray"](v463?.["nodes"]) ||
            v463["nodes"]["length"] === 0),
          (v465["dataset"]["assetId"] = v472),
          v466["querySelectorAll"](":scope > button")["forEach"]((v473) => {
            v473["dataset"]["assetId"] = v472;
          }));
        const v474 = this["_pendingDeleteAssetId"] === v472;
        ((v465["hidden"] = v474), (v466["hidden"] = !v474));
        !v467 &&
          ((v467 = document["createElement"]("div")),
          (v467["className"] = "v2-asset-item-cover"),
          v462["appendChild"](v467));
        !v468 &&
          ((v468 = document["createElement"]("div")),
          (v468["className"] = "v2-asset-item-name"),
          v468["addEventListener"]("click", (v475) => {
            v475["stopPropagation"]();
            const v476 = v475["currentTarget"]?.["closest"]?.(".v2-asset-item"),
              v477 = v476?.["dataset"]?.["id"] || "";
            this["_beginRenameAsset"](v477);
          }),
          v462["appendChild"](v468));
        const v478 = String(v463?.["name"] || "");
        if (this["_renamingAssetId"] === v472) {
          v468["classList"]["add"]("is-editing");
          let v479 = v468["querySelector"](
            ":scope\x20>\x20input.v2-asset-item-name-input",
          );
          !v479 &&
            ((v479 = document["createElement"]("input")),
            (v479["type"] = "text"),
            (v479["className"] = "v2-asset-item-name-input"),
            v479["addEventListener"]("click", (v480) =>
              v480["stopPropagation"](),
            ),
            v479["addEventListener"]("keydown", (v481) => {
              if (v481["key"] === "Enter") {
                (v481["preventDefault"](),
                  v481["stopPropagation"](),
                  (v479["dataset"]["submitted"] = "1"),
                  this["_commitRenameAsset"](v472, v479["value"]));
                return;
              }
              v481["key"] === "Escape" &&
                (v481["preventDefault"](),
                v481["stopPropagation"](),
                this["_cancelRenameAsset"]());
            }),
            v479["addEventListener"]("blur", () => {
              if (v479["dataset"]["submitted"] === "1") return;
              this["_commitRenameAsset"](v472, v479["value"]);
            }),
            v468["replaceChildren"](v479));
          if (v479["value"] !== v478) v479["value"] = v478;
          if (v479["getAttribute"]("aria-label") !== "资产名称")
            v479["setAttribute"]("aria-label", "资产名称");
          window["requestAnimationFrame"](() => {
            if (!v479["isConnected"]) return;
            try {
              (v479["focus"](), v479["select"]?.());
            } catch (v482) {}
          });
        } else {
          if (v468["classList"]["contains"]("is-editing"))
            v468["classList"]["remove"]("is-editing");
          const v483 = v468["querySelector"](
            ":scope > input.v2-asset-item-name-input",
          );
          if (v483) v468["replaceChildren"]();
          if (v468["textContent"] !== v478) v468["textContent"] = v478;
          if (v468["getAttribute"]("title") !== v478)
            v468["setAttribute"]("title", v478);
        }
        const v484 = Array["isArray"](v463?.["items"])
          ? v463["items"]
          : Array["isArray"](v463?.["nodes"])
            ? v463["nodes"]["map"]((v485) => _buildAssetItem(v485))
            : [];
        if (v484["length"] > 0) {
          const v486 = v453(v467),
            v487 = v486["querySelectorAll"](
              ":scope\x20>\x20.v2-asset-cover-cell",
            );
          for (let v488 = 0; v488 < 4; v488++) {
            const v489 = v484[v488];
            if (!v489) {
              const v490 = v487[v488];
              v490 &&
                ((v490["dataset"]["thumbKind"] = "empty"),
                (v490["dataset"]["thumbType"] = ""),
                (v490["dataset"]["thumbSrc"] = ""),
                (v490["dataset"]["pendingSrc"] = ""),
                v490["replaceChildren"]());
              continue;
            }
            v449(v487[v488], v489["thumbSrc"], v489["type"]);
          }
          return;
        }
        v463?.["coverUrl"]
          ? v449(v467, v463["coverUrl"], v463["coverType"])
          : v449(v467, "", v463?.["coverType"] || "other");
      },
      v491 = this["_getSortedAssets"]()["filter"](
        (v492) =>
          this["_categoryKey"](v492?.["category"]) ===
          this["_categoryKey"](this["activeTab"]),
      );
    if (this["_openAssetId"]) {
      const v493 = v491["find"]((v494) => v494["id"] === this["_openAssetId"]);
      if (!v493) {
        ((this["_openAssetId"] = null), this["renderSidebarContent"]());
        return;
      }
      if (v440) v440["textContent"] = v493["name"] || "资产";
      if (v441) v441["classList"]["add"]("show");
      (this["sidebarPanel"]["classList"]["add"]("is-detail-view"),
        (v447["style"]["display"] = "none"),
        (v448["style"]["display"] = ""));
      const v495 = Array["isArray"](v493?.["items"])
        ? v493["items"]
        : Array["isArray"](v493?.["nodes"])
          ? v493["nodes"]["map"]((v496) => _buildAssetItem(v496))
          : [];
      v448["replaceChildren"]();
      const v497 = document["createElement"]("div");
      v497["className"] = "v2-asset-detail";
      const v498 = document["createElement"]("div");
      ((v498["className"] = "v2-asset-detail-cover"),
        v497["appendChild"](v498));
      if (v495["length"] > 0) {
        const v499 = v453(v498),
          v500 = v499["querySelectorAll"](":scope > .v2-asset-cover-cell");
        for (let v501 = 0; v501 < 4; v501++) {
          const v502 = v495[v501];
          if (v502) v449(v500[v501], v502["thumbSrc"], v502["type"]);
          else v500[v501] && v500[v501]["replaceChildren"]();
        }
      } else v449(v498, v493?.["coverUrl"], v493?.["coverType"] || "other");
      const v503 = document["createElement"]("div");
      ((v503["className"] = "v2-asset-detail-title"),
        (v503["textContent"] = v493["name"] || "未命名资产"),
        v497["appendChild"](v503));
      const v504 = document["createElement"]("div");
      v504["className"] = "v2-asset-detail-meta";
      const v505 = Array["isArray"](v493?.["nodes"])
        ? v493["nodes"]["length"]
        : v495["length"];
      ((v504["textContent"] =
        (v493["category"] || "未分类") +
        " · " +
        v505 +
        " 节点 · 更新 " +
        _formatAssetDateTime(v493["updatedAt"] || v493["createdAt"])),
        v497["appendChild"](v504));
      const v506 = document["createElement"]("section");
      v506["className"] = "v2-asset-detail-section";
      const v507 = document["createElement"]("div");
      ((v507["className"] = "v2-asset-detail-section-title"),
        (v507["textContent"] = "内容"),
        v506["appendChild"](v507));
      const v508 = document["createElement"]("div");
      v508["className"] = "v2-asset-subgrid";
      if (v495["length"] === 0) {
        const v509 = document["createElement"]("div");
        ((v509["className"] = "v2-asset-empty"),
          (v509["textContent"] = "此资产为空"),
          v508["appendChild"](v509));
      } else
        for (let v510 = 0; v510 < v495["length"]; v510++) {
          const v511 = v495[v510],
            v512 = document["createElement"]("button");
          ((v512["type"] = "button"),
            (v512["className"] = "v2-asset-subitem"),
            (v512["dataset"]["assetId"] = v493["id"]),
            (v512["dataset"]["idx"] = String(v510)));
          const v513 = document["createElement"]("div");
          ((v513["className"] = "v2-asset-subitem-thumb"),
            v449(v513, v511?.["thumbSrc"], v511?.["type"]));
          const v514 = document["createElement"]("div");
          v514["className"] = "v2-asset-subitem-info";
          const v515 = document["createElement"]("span");
          ((v515["className"] = "v2-asset-subitem-type"),
            (v515["textContent"] = _formatAssetTypeLabel(v511?.["type"])));
          const v516 = document["createElement"]("div");
          v516["className"] = "v2-asset-subitem-name";
          const v517 = String(
            v511?.["name"] || v511?.["type"] || "子资产" + (v510 + 1),
          );
          ((v516["textContent"] = v517), (v516["title"] = v517));
          const v518 = document["createElement"]("div");
          ((v518["className"] = "v2-asset-subitem-summary"),
            (v518["textContent"] = "点击添加到画布"),
            v514["append"](v515, v516, v518),
            v512["append"](v513, v514),
            v508["appendChild"](v512));
        }
      (v506["appendChild"](v508), v497["appendChild"](v506));
      const v519 = document["createElement"]("div");
      v519["className"] = "v2-asset-detail-actions";
      const v520 = document["createElement"]("button");
      ((v520["type"] = "button"),
        (v520["className"] = "v2-asset-detail-btn"),
        (v520["dataset"]["uiAction"] = "asset-add-all"),
        (v520["dataset"]["assetId"] = v493["id"]),
        (v520["textContent"] = "载入到画布"),
        v519["appendChild"](v520),
        v497["appendChild"](v519),
        v448["appendChild"](v497));
      return;
    }
    if (v440) v440["textContent"] = "资产";
    if (v441) v441["classList"]["remove"]("show");
    (this["sidebarPanel"]["classList"]["remove"]("is-detail-view"),
      (v447["style"]["display"] = ""),
      (v448["style"]["display"] = "none"),
      v448["replaceChildren"]());
    let v521 = v447["querySelector"](":scope > .v2-asset-empty");
    !v521 &&
      ((v521 = document["createElement"]("div")),
      (v521["className"] = "v2-asset-empty"),
      v447["appendChild"](v521));
    const v522 = this["_getSortedAssets"]();
    let v523 = 0,
      v524 = 0;
    for (const v525 of v522) {
      const v526 = String(v525?.["id"] || "");
      if (!v526) continue;
      let v527 = this["_assetCardPool"]?.["get"]?.(v526);
      if (!v527) {
        ((v527 = document["createElement"]("div")),
          (v527["className"] = "v2-asset-item"),
          (v527["dataset"]["id"] = v526));
        if (!this["_assetCardPool"]) this["_assetCardPool"] = new Map();
        this["_assetCardPool"]["set"](v526, v527);
      }
      if (v527["parentElement"] !== v447) v447["appendChild"](v527);
      const v528 =
        this["_categoryKey"](v525?.["category"]) ===
        this["_categoryKey"](this["activeTab"]);
      ((v527["style"]["display"] = v528 ? "" : "none"),
        v528 &&
          ((v527["style"]["order"] = String(v524++)),
          v461(v527, v525),
          this["_newAssetPulseId"] &&
            this["_newAssetPulseId"] === v526 &&
            ((this["_newAssetPulseId"] = ""),
            window["requestAnimationFrame"](() => {
              if (!v527["isConnected"]) return;
              v527["classList"]["add"]("is-new");
              const v529 = window["setTimeout"](() => {
                if (v527["isConnected"]) v527["classList"]["remove"]("is-new");
              }, 650);
              v527["dataset"]["_pulseTimer"] = String(v529);
            })),
          (v523 += 1)));
    }
    ((v521["style"]["display"] = v523 === 0 ? "" : "none"),
      v523 === 0 &&
        ((v521["textContent"] = "暂无" + this["activeTab"] + "资产"),
        (v521["style"]["order"] = "0")));
  }
  ["_restoreAssetSubItem"](v530, v531) {
    const v532 = (this["assets"] || [])["find"]((v533) => v533["id"] === v530);
    if (!v532 || !Array["isArray"](v532["nodes"])) return;
    const v534 = v532["nodes"][v531];
    if (!v534) return;
    const v535 = this["_getCanvasCenterWorld"](),
      v536 = Number(v534["width"] ?? v534["w"]) || 240,
      v537 = Number(v534["height"] ?? v534["h"]) || 240,
      v538 = v535["x"] - v536 / 2,
      v539 = v535["y"] - v537 / 2,
      v540 = findAvailablePosition(
        appStore["getState"]()["nodes"],
        v538,
        v539,
        v536,
        v537,
        24,
        "right",
      );
    (appStore["batch"](() => {
      const v541 = JSON["parse"](JSON["stringify"](v534));
      ((v541["id"] = generateId(v541["type"])),
        (v541["x"] = v540["x"]),
        (v541["y"] = v540["y"]),
        appStore["addNode"](v541),
        appStore["setSelectedNodes"]([v541["id"]]));
    }),
      window["showToast"]?.("已添加子资产到画布", "success"));
  }
  ["restoreAssetToCanvas"](v542) {
    const v543 = (this["assets"] || [])["find"]((v544) => v544["id"] === v542);
    if (!v543 || !v543["nodes"]) return;
    const v545 = shouldTopAlignRestoredAsset(v543["nodes"], v543["edges"])
        ? createTopAlignedAssetNodes(v543["nodes"], 24)
        : v543["nodes"],
      v546 = this["_getCanvasCenterWorld"](),
      v547 = this["_calcNodesBBox"](v545),
      v548 = v546["x"] - v547["cx"],
      v549 = v546["y"] - v547["cy"],
      v550 = v547["minX"] + v548,
      v551 = v547["minY"] + v549,
      v552 = findAvailablePosition(
        appStore["getState"]()["nodes"],
        v550,
        v551,
        Math["max"](1, v547["w"]),
        Math["max"](1, v547["h"]),
        24,
        "right",
      ),
      v553 = v548 + (v552["x"] - v550),
      v554 = v549 + (v552["y"] - v551);
    (appStore["batch"](() => {
      const v555 = {};
      (v545["forEach"]((v556) => {
        const v557 = JSON["parse"](JSON["stringify"](v556)),
          v558 = v557["id"],
          v559 = generateId(v557["type"]);
        ((v555[v558] = v559),
          (v557["id"] = v559),
          (v557["x"] = (Number(v557["x"]) || 0) + v553),
          (v557["y"] = (Number(v557["y"]) || 0) + v554),
          appStore["addNode"](v557));
      }),
        v543["edges"] &&
          v543["edges"]["forEach"]((v560) => {
            const v561 = JSON["parse"](JSON["stringify"](v560));
            v561["id"] = generateId("edge");
            if (v555[v561["sourceId"]])
              v561["sourceId"] = v555[v561["sourceId"]];
            if (v555[v561["targetId"]])
              v561["targetId"] = v555[v561["targetId"]];
            appStore["addEdge"](v561);
          }),
        appStore["setSelectedNodes"](Object["values"](v555)));
    }),
      window["showToast"]?.("资产已添加到画布", "success"));
  }
}
export const assetManager = new AssetManager();
