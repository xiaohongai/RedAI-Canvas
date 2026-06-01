import appStore from "../core/stores/appStore.js";
import { commit } from "../modules/history.js";
import { startNodeResizePreview } from "../modules/interaction/nodeResizePreview.js";
import { openExternalLink } from "../services/externalLinkService.js";
import { registerWebPreviewSlot } from "../services/webPreviewViewSyncService.js";
import { clampWebPreviewNodeSize } from "../modules/webPreviewSizing.js";
import { normalizeWebPreviewUrl } from "../modules/webPreviewUrl.js";
const DEFAULT_STATUS_TEXT = "输入网址后按 Enter 预览";
function dispatchWebPreviewForceSync(v0) {
  globalThis["window"]?.["dispatchEvent"]?.(
    new CustomEvent("web-preview:force-sync", { detail: { nodeId: v0 } }),
  );
}
function createIcon(
  v1,
  { size: size = 16, strokeWidth: strokeWidth = 2 } = {},
) {
  const v2 = "http://www.w3.org/2000/svg",
    v3 = document["createElementNS"](v2, "svg");
  (v3["setAttribute"]("width", String(size)),
    v3["setAttribute"]("height", String(size)),
    v3["setAttribute"]("viewBox", "0 0 24 24"),
    v3["setAttribute"]("fill", "none"),
    v3["setAttribute"]("stroke", "currentColor"),
    v3["setAttribute"]("stroke-width", String(strokeWidth)),
    v3["setAttribute"]("stroke-linecap", "round"),
    v3["setAttribute"]("stroke-linejoin", "round"));
  for (const v4 of Array["isArray"](v1) ? v1 : [v1]) {
    const v5 = document["createElementNS"](v2, "path");
    (v5["setAttribute"]("d", v4), v3["appendChild"](v5));
  }
  return v3;
}
function createIconButton({
  title: v6,
  icon: v7,
  onClick: v8,
  type: type = "button",
  className: className = "",
}) {
  const v9 = document["createElement"]("button");
  return (
    (v9["className"] = ["web-preview-icon-btn", className]
      ["filter"](Boolean)
      ["join"]("\x20")),
    (v9["type"] = type),
    (v9["title"] = v6),
    v9["appendChild"](createIcon(v7, { size: 15 })),
    typeof v8 === "function" && v9["addEventListener"]("click", v8),
    v9
  );
}
export function commitWebPreviewNodeUrl({
  nodeId: v10,
  rawUrl: v11,
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  showToast: showToast = globalThis["window"]?.["showToast"],
} = {}) {
  const v12 = normalizeWebPreviewUrl(v11);
  if (!v12)
    return (
      showToast?.("请输入有效的 http/https 网页地址", "warning"),
      { ok: false, error: "invalid-url" }
    );
  if (!v10 || typeof storeInstance?.["updateNodeData"] !== "function")
    return { ok: false, error: "missing-node" };
  return (
    storeInstance["updateNodeData"](v10, { webUrl: v12, name: "网页预览" }),
    commitFn?.(),
    dispatchWebPreviewForceSync(v10),
    { ok: true, url: v12 }
  );
}
export class WebPreviewNode {
  constructor(v13) {
    ((this["_data"] = v13),
      (this["id"] = v13["id"]),
      (this["el"] = document["createElement"]("div")),
      (this["el"]["className"] = "v2-node-component\x20web-preview-component"),
      (this["_statusText"] = DEFAULT_STATUS_TEXT),
      (this["_unsubscribeNativeEvent"] = null),
      (this["_navigationState"] = { canGoBack: false, canGoForward: false }),
      (this["_backButtons"] = []),
      (this["_forwardButtons"] = []),
      (this["_fullscreenOverlay"] = null),
      (this["_fullscreenInput"] = null),
      (this["_fullscreenSlot"] = null),
      (this["_freezeLayer"] = null),
      (this["_freezeImage"] = null),
      (this["_fullscreenKeyHandler"] = null),
      (this["_unregisterSlot"] = null),
      (this["_unregisterFullscreenSlot"] = null));
  }
  ["mount"]() {
    const v14 = document["createElement"]("div");
    ((v14["className"] = "node-card\x20web-preview-card"),
      v14["addEventListener"]("dblclick", (v15) => v15["stopPropagation"]()));
    const v16 = document["createElement"]("form");
    ((v16["className"] = "web-preview-header"),
      v16["setAttribute"]("autocomplete", "off"),
      v16["addEventListener"]("submit", (v17) => {
        (v17["preventDefault"](), this["_commitUrl"]());
      }),
      v16["addEventListener"]("pointerdown", (v18) => v18["stopPropagation"]()),
      v16["addEventListener"]("wheel", (v19) => v19["stopPropagation"](), {
        passive: true,
      }));
    const v20 = document["createElement"]("div");
    v20["className"] = "web-preview-nav";
    const v21 = createIconButton({
        title: "后退",
        icon: "M19 12H5M12 19l-7-7 7-7",
        onClick: () => this["_navigate"]("back"),
      }),
      v22 = createIconButton({
        title: "前进",
        icon: "M5 12h14M13 5l7 7-7 7",
        onClick: () => this["_navigate"]("forward"),
      });
    (v20["appendChild"](v21), v20["appendChild"](v22));
    const v23 = document["createElement"]("label");
    ((v23["className"] = "web-preview-url-wrap"),
      v23["appendChild"](
        createIcon([
          "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
          "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
        ]),
      ));
    const v24 = document["createElement"]("input");
    ((v24["className"] = "web-preview-url-input"),
      (v24["type"] = "text"),
      (v24["inputMode"] = "url"),
      (v24["placeholder"] = "输入网址"),
      (v24["value"] = this["_data"]["webUrl"] || ""),
      v24["addEventListener"]("keydown", (v25) => {
        v25["stopPropagation"]();
        if (v25["key"] === "Escape") v24["blur"]();
      }),
      v23["appendChild"](v24));
    const v26 = createIconButton({
        title: "打开网页",
        icon: "M5 12h14M13 5l7 7-7 7",
        type: "submit",
      }),
      v27 = createIconButton({
        title: "刷新",
        icon: "M21\x2012a9\x209\x200\x201\x201-2.64-6.36M21\x203v6h-6",
        onClick: () => this["_refresh"](),
      }),
      v28 = createIconButton({
        title: "在浏览器打开",
        icon: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3",
        onClick: () => this["_openExternal"](),
      }),
      v29 = createIconButton({
        title: "全屏显示",
        icon: [
          "M8 3H5a2 2 0 0 0-2 2v3",
          "M16 3h3a2 2 0 0 1 2 2v3",
          "M8\x2021H5a2\x202\x200\x200\x201-2-2v-3",
          "M16 21h3a2 2 0 0 0 2-2v-3",
        ],
        onClick: () => this["_openFullscreen"](),
      });
    (v16["appendChild"](v20),
      v16["appendChild"](v23),
      v16["appendChild"](v26),
      v16["appendChild"](v27),
      v16["appendChild"](v28),
      v16["appendChild"](v29));
    const v30 = document["createElement"]("div");
    ((v30["className"] = "web-preview-body"),
      (v30["dataset"]["webPreviewSlot"] = "true"),
      (v30["dataset"]["nodeId"] = this["id"]),
      (v30["dataset"]["webUrl"] = this["_data"]["webUrl"] || ""),
      v30["addEventListener"]("pointerdown", (v31) =>
        v31["stopPropagation"](),
      ));
    const v32 = document["createElement"]("div");
    ((v32["className"] = "web-preview-placeholder"),
      v32["appendChild"](
        createIcon("M3\x204h18v16H3zM3\x209h18M8\x204v5", {
          size: 30,
          strokeWidth: 1.7,
        }),
      ));
    const v33 = document["createElement"]("div");
    ((v33["className"] = "web-preview-placeholder-title"),
      (v33["textContent"] = "网页预览"));
    const v34 = document["createElement"]("div");
    ((v34["className"] = "web-preview-placeholder-hint"),
      (v34["textContent"] = DEFAULT_STATUS_TEXT));
    const v35 = document["createElement"]("form");
    ((v35["className"] = "web-preview-empty-form"),
      v35["addEventListener"]("submit", (v36) => {
        (v36["preventDefault"](), this["_commitUrl"](v37["value"]));
      }),
      v35["addEventListener"]("pointerdown", (v38) =>
        v38["stopPropagation"](),
      ));
    const v37 = document["createElement"]("input");
    ((v37["className"] = "web-preview-empty-input"),
      (v37["type"] = "text"),
      (v37["inputMode"] = "url"),
      (v37["placeholder"] = "https://example.com"),
      v37["addEventListener"]("keydown", (v39) => {
        v39["stopPropagation"]();
        if (v39["key"] === "Escape") v37["blur"]();
      }));
    const v40 = document["createElement"]("button");
    ((v40["className"] = "web-preview-empty-submit"),
      (v40["type"] = "submit"),
      (v40["title"] = "打开网页"),
      v40["appendChild"](createIcon("M5 12h14M13 5l7 7-7 7", { size: 15 })),
      v35["appendChild"](v37),
      v35["appendChild"](v40),
      v32["appendChild"](v33),
      v32["appendChild"](v35),
      v32["appendChild"](v34),
      v30["appendChild"](v32));
    const v41 = document["createElement"]("div");
    v41["className"] = "web-preview-freeze-layer";
    const v42 = document["createElement"]("img");
    ((v42["className"] = "web-preview-freeze-image"),
      (v42["alt"] = ""),
      v41["appendChild"](v42),
      v30["appendChild"](v41));
    const v43 = document["createElement"]("div");
    ((v43["className"] = "web-preview-status"),
      (v43["textContent"] = DEFAULT_STATUS_TEXT));
    const v44 = document["createElement"]("div");
    v44["className"] = "node-port out-port";
    const v45 = document["createElement"]("div");
    return (
      (v45["className"] = "group-resizer"),
      v45["addEventListener"]("pointerdown", (v46) => {
        (v46["stopPropagation"](),
          startNodeResizePreview({
            event: v46,
            nodeId: this["id"],
            getNode: () =>
              appStore["getStateRaw"]()["nodes"]?.[this["id"]] || this["_data"],
            getViewport: () => appStore["getStateRaw"]()["viewport"],
            resolveSize: ({
              startWidth: v47,
              startHeight: v48,
              dx: v49,
              dy: v50,
            }) =>
              clampWebPreviewNodeSize({ width: v47 + v49, height: v48 + v50 }),
            applyPatch: (v51) => appStore["updateNodeData"](this["id"], v51),
            commit: commit,
          }));
      }),
      v14["appendChild"](v16),
      v14["appendChild"](v30),
      v14["appendChild"](v43),
      v14["appendChild"](v44),
      v14["appendChild"](v45),
      this["el"]["replaceChildren"](v14),
      (this["_input"] = v24),
      (this["_emptyInput"] = v37),
      (this["_slot"] = v30),
      this["_unregisterSlot"]?.(),
      (this["_unregisterSlot"] = registerWebPreviewSlot(this["id"], v30)),
      (this["_placeholder"] = v32),
      (this["_placeholderHint"] = v34),
      (this["_status"] = v43),
      (this["_freezeLayer"] = v41),
      (this["_freezeImage"] = v42),
      (this["_backButtons"] = [v21]),
      (this["_forwardButtons"] = [v22]),
      this["_syncDom"](),
      this["_syncNavigationButtons"](),
      this["_bindNativeEvents"](),
      this["el"]
    );
  }
  ["_bindNativeEvents"]() {
    const v52 = globalThis["window"];
    if (!v52 || typeof v52["addEventListener"] !== "function") return;
    const v53 = (v54) => {
      const v55 = v54?.["detail"] || {};
      if (v55["nodeId"] !== this["id"]) return;
      if (v55["type"] === "loading") this["_setStatus"]("正在加载网页...");
      else {
        if (v55["type"] === "loaded") this["_setStatus"]("网页已加载");
        else {
          if (v55["type"] === "failed")
            this["_setStatus"](v55["message"] || "网页加载失败");
          else {
            if (v55["type"] === "blocked")
              this["_setStatus"](v55["message"] || "已阻止该跳转");
            else {
              if (v55["type"] === "navigated")
                this["_applyNavigatedUrl"](v55["url"]);
              else {
                if (v55["type"] === "navigation-state")
                  this["_setNavigationState"](v55);
                else {
                  if (v55["type"] === "snapshot") this["_applySnapshot"](v55);
                }
              }
            }
          }
        }
      }
    };
    (v52["addEventListener"]("web-preview:native-event", v53),
      (this["_unsubscribeNativeEvent"] = () => {
        v52["removeEventListener"]?.("web-preview:native-event", v53);
      }));
  }
  ["_readUrlInputValue"]() {
    const v56 = globalThis["document"]?.["activeElement"] || null;
    if (v56 === this["_fullscreenInput"])
      return this["_fullscreenInput"]?.["value"] || "";
    if (v56 === this["_input"]) return this["_input"]?.["value"] || "";
    if (v56 === this["_emptyInput"])
      return this["_emptyInput"]?.["value"] || "";
    return (
      this["_fullscreenInput"]?.["value"] ||
      this["_input"]?.["value"] ||
      this["_emptyInput"]?.["value"] ||
      this["_data"]["webUrl"] ||
      ""
    );
  }
  ["_commitUrl"](v57 = this["_readUrlInputValue"]()) {
    const v58 = commitWebPreviewNodeUrl({ nodeId: this["id"], rawUrl: v57 });
    v58["ok"] &&
      ((this["_data"] = {
        ...this["_data"],
        webUrl: v58["url"],
        name: "网页预览",
      }),
      this["_syncDom"](),
      this["_setStatus"]("正在加载网页..."));
  }
  ["_refresh"]() {
    const v59 = globalThis["window"]?.["electronAPI"]?.["webPreview"];
    if (!this["_data"]["webUrl"]) return;
    if (v59?.["controlView"])
      void v59["controlView"]({ nodeId: this["id"], action: "reload" })[
        "catch"
      ](() => {});
    else
      v59?.["disposeViews"] &&
        void v59["disposeViews"]({ nodeIds: [this["id"]] })["finally"](() => {
          dispatchWebPreviewForceSync(this["id"]);
        });
    this["_setStatus"]("正在刷新网页...");
  }
  ["_navigate"](v60) {
    const v61 = globalThis["window"]?.["electronAPI"]?.["webPreview"];
    if (!this["_data"]["webUrl"] || !v61?.["controlView"]) return;
    void v61["controlView"]({ nodeId: this["id"], action: v60 })
      ["then"]((v62) => {
        v62?.["ok"] === false &&
          v62["error"] === "no-history" &&
          this["_setNavigationState"](v62);
      })
      ["catch"](() => {});
  }
  ["_openExternal"]() {
    const v63 = normalizeWebPreviewUrl(this["_readUrlInputValue"]());
    if (!v63) {
      globalThis["window"]?.["showToast"]?.(
        "请输入有效的\x20http/https\x20网页地址",
        "warning",
      );
      return;
    }
    void openExternalLink(v63, { label: "网页预览" })["catch"]((v64) => {
      globalThis["window"]?.["showToast"]?.(
        v64?.["message"] || "无法打开外部链接",
        "error",
      );
    });
  }
  ["_openFullscreen"]() {
    const v65 = normalizeWebPreviewUrl(this["_readUrlInputValue"]());
    if (!v65) {
      globalThis["window"]?.["showToast"]?.(
        "请输入有效的 http/https 网页地址",
        "warning",
      );
      return;
    }
    v65 !== normalizeWebPreviewUrl(this["_data"]["webUrl"]) &&
      this["_commitUrl"](v65);
    if (this["_fullscreenOverlay"]?.["isConnected"]) {
      dispatchWebPreviewForceSync(this["id"]);
      return;
    }
    const v66 = document["createElement"]("div");
    ((v66["className"] = "web-preview-fullscreen-overlay"),
      v66["addEventListener"]("pointerdown", (v67) =>
        v67["stopPropagation"](),
      ));
    const v68 = document["createElement"]("form");
    ((v68["className"] = "web-preview-fullscreen-header"),
      v68["setAttribute"]("autocomplete", "off"),
      v68["addEventListener"]("submit", (v69) => {
        (v69["preventDefault"](),
          this["_commitUrl"](this["_fullscreenInput"]?.["value"]));
      }),
      v68["addEventListener"]("pointerdown", (v70) => v70["stopPropagation"]()),
      v68["addEventListener"]("wheel", (v71) => v71["stopPropagation"](), {
        passive: true,
      }));
    const v72 = document["createElement"]("div");
    v72["className"] = "web-preview-nav";
    const v73 = createIconButton({
        title: "后退",
        icon: "M19 12H5M12 19l-7-7 7-7",
        onClick: () => this["_navigate"]("back"),
      }),
      v74 = createIconButton({
        title: "前进",
        icon: "M5\x2012h14M13\x205l7\x207-7\x207",
        onClick: () => this["_navigate"]("forward"),
      });
    (v72["appendChild"](v73), v72["appendChild"](v74));
    const v75 = document["createElement"]("label");
    ((v75["className"] = "web-preview-url-wrap"),
      v75["appendChild"](
        createIcon([
          "M10\x2013a5\x205\x200\x200\x200\x207.54.54l3-3a5\x205\x200\x200\x200-7.07-7.07l-1.72\x201.71",
          "M14\x2011a5\x205\x200\x200\x200-7.54-.54l-3\x203a5\x205\x200\x200\x200\x207.07\x207.07l1.71-1.71",
        ]),
      ));
    const v76 = document["createElement"]("input");
    ((v76["className"] = "web-preview-url-input"),
      (v76["type"] = "text"),
      (v76["inputMode"] = "url"),
      (v76["placeholder"] = "输入网址"),
      (v76["value"] = v65),
      v76["addEventListener"]("keydown", (v77) => {
        v77["stopPropagation"]();
        if (v77["key"] === "Escape") v76["blur"]();
      }),
      v75["appendChild"](v76));
    const v78 = createIconButton({
        title: "打开网页",
        icon: "M5 12h14M13 5l7 7-7 7",
        type: "submit",
      }),
      v79 = createIconButton({
        title: "刷新",
        icon: "M21\x2012a9\x209\x200\x201\x201-2.64-6.36M21\x203v6h-6",
        onClick: () => this["_refresh"](),
      }),
      v80 = createIconButton({
        title: "在浏览器打开",
        icon: "M18\x2013v6a2\x202\x200\x200\x201-2\x202H5a2\x202\x200\x200\x201-2-2V8a2\x202\x200\x200\x201\x202-2h6M15\x203h6v6M10\x2014L21\x203",
        onClick: () => this["_openExternal"](),
      }),
      v81 = createIconButton({
        title: "退出全屏",
        icon: ["M9\x203v6H3", "M15 3v6h6", "M9\x2021v-6H3", "M15 21v-6h6"],
        onClick: () => this["_closeFullscreen"](),
      });
    (v68["appendChild"](v72),
      v68["appendChild"](v75),
      v68["appendChild"](v78),
      v68["appendChild"](v79),
      v68["appendChild"](v80),
      v68["appendChild"](v81));
    const v82 = document["createElement"]("div");
    ((v82["className"] = "web-preview-fullscreen-body"),
      (v82["dataset"]["webPreviewSlot"] = "true"),
      (v82["dataset"]["webPreviewFullscreen"] = "true"),
      (v82["dataset"]["nodeId"] = this["id"]),
      (v82["dataset"]["webUrl"] = this["_data"]["webUrl"] || v65),
      v66["appendChild"](v68),
      v66["appendChild"](v82),
      document["body"]["appendChild"](v66),
      (this["_fullscreenOverlay"] = v66),
      (this["_fullscreenInput"] = v76),
      (this["_fullscreenSlot"] = v82),
      this["_unregisterFullscreenSlot"]?.(),
      (this["_unregisterFullscreenSlot"] = registerWebPreviewSlot(
        this["id"],
        v82,
      )),
      (this["_backButtons"] = [this["_backButtons"][0], v73]["filter"](
        Boolean,
      )),
      (this["_forwardButtons"] = [this["_forwardButtons"][0], v74]["filter"](
        Boolean,
      )),
      (this["_fullscreenKeyHandler"] = (v83) => {
        if (v83["key"] === "Escape") this["_closeFullscreen"]();
      }),
      globalThis["window"]?.["addEventListener"]?.(
        "keydown",
        this["_fullscreenKeyHandler"],
      ),
      this["_syncDom"](),
      this["_syncNavigationButtons"](),
      dispatchWebPreviewForceSync(this["id"]));
  }
  ["_closeFullscreen"]() {
    if (!this["_fullscreenOverlay"]) return;
    (this["_fullscreenOverlay"]["remove"](),
      (this["_fullscreenOverlay"] = null),
      (this["_fullscreenInput"] = null),
      (this["_fullscreenSlot"] = null),
      this["_unregisterFullscreenSlot"]?.(),
      (this["_unregisterFullscreenSlot"] = null),
      this["_fullscreenKeyHandler"] &&
        (globalThis["window"]?.["removeEventListener"]?.(
          "keydown",
          this["_fullscreenKeyHandler"],
        ),
        (this["_fullscreenKeyHandler"] = null)),
      (this["_backButtons"] = [this["_backButtons"][0]]["filter"](Boolean)),
      (this["_forwardButtons"] = [this["_forwardButtons"][0]]["filter"](
        Boolean,
      )),
      dispatchWebPreviewForceSync(this["id"]));
  }
  ["_applyNavigatedUrl"](v84) {
    const v85 = normalizeWebPreviewUrl(v84);
    if (!v85) return;
    this["_data"] = { ...this["_data"], webUrl: v85 };
    const v86 =
      appStore["getStateRaw"]?.()["nodes"]?.[this["id"]]?.["webUrl"] || "";
    v86 !== v85
      ? appStore["updateNodeData"](this["id"], { webUrl: v85 })
      : this["_syncDom"]();
  }
  ["_setNavigationState"](v87 = {}) {
    ((this["_navigationState"] = {
      canGoBack: Boolean(v87["canGoBack"]),
      canGoForward: Boolean(v87["canGoForward"]),
    }),
      this["_syncNavigationButtons"]());
  }
  ["_syncNavigationButtons"]() {
    for (const v88 of this["_backButtons"]) {
      if (v88) v88["disabled"] = !this["_navigationState"]["canGoBack"];
    }
    for (const v89 of this["_forwardButtons"]) {
      if (v89) v89["disabled"] = !this["_navigationState"]["canGoForward"];
    }
  }
  ["_setStatus"](v90) {
    this["_statusText"] = String(v90 || DEFAULT_STATUS_TEXT);
    if (this["_status"]) this["_status"]["textContent"] = this["_statusText"];
    if (this["_placeholderHint"])
      this["_placeholderHint"]["textContent"] = this["_statusText"];
  }
  ["_applySnapshot"](v91 = {}) {
    const v92 = String(v91["dataUrl"] || "");
    if (!v92["startsWith"]("data:image/") || !this["_freezeImage"]) return;
    ((this["_freezeImage"]["src"] = v92),
      this["el"]["classList"]["add"]("has-freeze-snapshot"));
  }
  ["_syncDom"]() {
    const v93 = this["_data"]["webUrl"] || "";
    this["_input"] &&
      document["activeElement"] !== this["_input"] &&
      (this["_input"]["value"] = v93);
    this["_emptyInput"] &&
      document["activeElement"] !== this["_emptyInput"] &&
      (this["_emptyInput"]["value"] = v93);
    this["_fullscreenInput"] &&
      document["activeElement"] !== this["_fullscreenInput"] &&
      (this["_fullscreenInput"]["value"] = v93);
    this["_slot"]?.["dataset"] &&
      ((this["_slot"]["dataset"]["webUrl"] = v93),
      (this["_slot"]["dataset"]["nodeId"] = this["id"]));
    this["_fullscreenSlot"]?.["dataset"] &&
      ((this["_fullscreenSlot"]["dataset"]["webUrl"] = v93),
      (this["_fullscreenSlot"]["dataset"]["nodeId"] = this["id"]));
    const v94 = Boolean(v93);
    this["el"]["classList"]["toggle"]("has-web-url", v94);
    if (!v94) this["_setStatus"](DEFAULT_STATUS_TEXT);
    else
      !globalThis["window"]?.["electronAPI"]?.["webPreview"] &&
        this["_setStatus"]("当前环境不支持原生网页预览");
  }
  ["update"](v95) {
    ((this["_data"] = v95), this["_syncDom"]());
  }
  ["unmount"]() {
    (this["_closeFullscreen"](),
      this["_unregisterSlot"]?.(),
      (this["_unregisterSlot"] = null),
      this["_unregisterFullscreenSlot"]?.(),
      (this["_unregisterFullscreenSlot"] = null),
      this["_unsubscribeNativeEvent"]?.(),
      (this["_unsubscribeNativeEvent"] = null));
    const v96 = globalThis["window"]?.["electronAPI"]?.["webPreview"];
    v96?.["disposeViews"] &&
      void v96["disposeViews"]({ nodeIds: [this["id"]] });
  }
}
