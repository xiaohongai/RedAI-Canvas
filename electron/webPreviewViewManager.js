import { normalizeWebPreviewUrl } from "../src/modules/webPreviewUrl.js";
const MIN_VIEW_SIZE = 16,
  WEB_PREVIEW_IMAGE_DROP_MIME = "application/x-ai-canvas-web-preview-image",
  WEB_PREVIEW_DRAG_BRIDGE_SCRIPT =
    "\x0a(()\x20=>\x20{\x0a\x20\x20if\x20(window.__AI_CANVAS_WEB_PREVIEW_DRAG_BRIDGE__)\x20return\x20true;\x0a\x20\x20Object.defineProperty(window,\x20\x22__AI_CANVAS_WEB_PREVIEW_DRAG_BRIDGE__\x22,\x20{\x0a\x20\x20\x20\x20value:\x20true,\x0a\x20\x20\x20\x20configurable:\x20false,\x0a\x20\x20});\x0a\x20\x20const\x20MIME\x20=\x20" +
    JSON["stringify"](WEB_PREVIEW_IMAGE_DROP_MIME) +
    ';\n  const escapeHtml = (value) => String(value || "").replace(/[&<>"\']/g, (ch) => ({\n    "&": "&amp;",\n    "<": "&lt;",\n    ">": "&gt;",\n    \'"\': "&quot;",\n    "\'": "&#39;",\n  })[ch]);\n  const normalizeUrl = (value) => {\n    try {\n      const url = new URL(String(value || ""), document.baseURI);\n      if (url.protocol !== "http:" && url.protocol !== "https:") return "";\n      url.username = "";\n      url.password = "";\n      return url.href;\n    } catch {\n      return "";\n    }\n  };\n  const findDragImage = (target) => {\n    if (!target?.closest) return null;\n    return target.closest("img") || target.closest("picture")?.querySelector?.("img");\n  };\n  document.addEventListener("dragstart", (event) => {\n    const image = findDragImage(event.target);\n    const url = normalizeUrl(\n      image?.currentSrc ||\n        image?.src ||\n        image?.getAttribute?.("src") ||\n        image?.dataset?.src ||\n        "",\n    );\n    if (!url || !event.dataTransfer) return;\n    const title = String(image?.alt || image?.title || document.title || "网页图片").slice(0, 120);\n    const payload = JSON.stringify({\n      kind: "image",\n      url,\n      title,\n      sourceUrl: normalizeUrl(location.href),\n    });\n    try { event.dataTransfer.setData(MIME, payload); } catch {}\n    try { event.dataTransfer.setData("text/uri-list", url); } catch {}\n    try { event.dataTransfer.setData("text/plain", url); } catch {}\n    try {\n      event.dataTransfer.setData("text/html", \'<img src="\' + escapeHtml(url) + \'" alt="\' + escapeHtml(title) + \'">\');\n    } catch {}\n    event.dataTransfer.effectAllowed = "copy";\n  }, true);\n  return true;\n})()\n';
function toNodeId(v0) {
  return String(v0 || "")["trim"]();
}
function toSafePartitionId(v1) {
  return (
    "web-preview-" + String(v1 || "node")["replace"](/[^a-zA-Z0-9_-]/g, "-")
  );
}
function normalizeBounds(v2 = {}) {
  const v3 = Math["round"](Number(v2["x"])),
    v4 = Math["round"](Number(v2["y"])),
    v5 = Math["round"](Number(v2["width"])),
    v6 = Math["round"](Number(v2["height"]));
  if (
    !Number["isFinite"](v3) ||
    !Number["isFinite"](v4) ||
    !Number["isFinite"](v5) ||
    !Number["isFinite"](v6) ||
    v5 < MIN_VIEW_SIZE ||
    v6 < MIN_VIEW_SIZE
  )
    return null;
  return { x: v3, y: v4, width: v5, height: v6 };
}
function normalizeZoomFactor(v7) {
  const v8 = Number(v7);
  if (!Number["isFinite"](v8) || v8 <= 0) return 1;
  return Math["min"](5, Math["max"](0.25, v8));
}
function boundsEqual(v9, v10) {
  return (
    v9?.["x"] === v10?.["x"] &&
    v9?.["y"] === v10?.["y"] &&
    v9?.["width"] === v10?.["width"] &&
    v9?.["height"] === v10?.["height"]
  );
}
function zoomFactorEqual(v11, v12) {
  return Math["abs"](Number(v11 || 1) - Number(v12 || 1)) < 0.001;
}
function getViewsPayload(v13) {
  return Array["isArray"](v13?.["views"]) ? v13["views"] : [];
}
function getNavigationState(v14) {
  return {
    canGoBack: Boolean(v14?.["canGoBack"]?.()),
    canGoForward: Boolean(v14?.["canGoForward"]?.()),
  };
}
export function createWebPreviewViewManager({
  WebContentsView: v15,
  getMainWindow: v16,
  openExternalUrl: v17,
  logDiagnosticEvent: v18,
} = {}) {
  const v19 = new Map();
  function v20() {
    const v21 = typeof v16 === "function" ? v16() : null;
    return v21 && !v21["isDestroyed"]?.() ? v21 : null;
  }
  function v22(v23, v24) {
    const v25 = v20();
    if (!v25?.["webContents"] || v25["webContents"]["isDestroyed"]?.()) return;
    v25["webContents"]["send"]("webPreview:event", { nodeId: v23, ...v24 });
  }
  function v26(v27, v28) {
    v22(v27, {
      type: "blocked",
      url: String(v28 || ""),
      message: "网页预览仅允许打开\x20http/https\x20链接",
    });
  }
  function v29(v30, v31) {
    v22(v30, { type: "navigation-state", ...getNavigationState(v31) });
  }
  function v32(v33, v34, v35, v36) {
    const v37 = v34?.["view"]?.["webContents"];
    if (!v37 || v37["isDestroyed"]?.()) return false;
    if (typeof v37["capturePage"] !== "function") return false;
    let v38 = null;
    try {
      v38 = v37["capturePage"]();
    } catch (v39) {
      return (
        v18?.({
          type: "web_preview.snapshot_failed",
          level: "warn",
          source: "main",
          message: "Web preview snapshot capture failed",
          error: v39,
          context: { nodeId: v33, freezeToken: v35 },
        }),
        false
      );
    }
    return (
      Promise["resolve"](v38)
        ["then"]((v40) => {
          const v41 = v40?.["toDataURL"]?.();
          if (!v41) return;
          v22(v33, {
            type: "snapshot",
            dataUrl: v41,
            freezeToken: v35,
            width: v34["bounds"]?.["width"] || 0,
            height: v34["bounds"]?.["height"] || 0,
          });
        })
        ["catch"]((v42) => {
          v18?.({
            type: "web_preview.snapshot_failed",
            level: "warn",
            source: "main",
            message: "Web preview snapshot capture failed",
            error: v42,
            context: { nodeId: v33, freezeToken: v35 },
          });
        })
        ["finally"](() => {
          v36?.();
        }),
      true
    );
  }
  function v43(v44, v45) {
    if (typeof v45?.["executeJavaScript"] !== "function") return;
    v45["executeJavaScript"](WEB_PREVIEW_DRAG_BRIDGE_SCRIPT, true)["catch"](
      (v46) => {
        v18?.({
          type: "web_preview.drag_bridge_failed",
          level: "warn",
          source: "main",
          message: "Web preview drag bridge injection failed",
          error: v46,
          context: { nodeId: v44 },
        });
      },
    );
  }
  function v47(v48, v49) {
    v49["setWindowOpenHandler"]?.(({ url: v50 }) => {
      const v51 = normalizeWebPreviewUrl(v50);
      if (v51 && typeof v17 === "function") v17(v51);
      else v26(v48, v50);
      return { action: "deny" };
    });
    const v52 = (v53, v54) => {
      if (normalizeWebPreviewUrl(v54)) return;
      (v53?.["preventDefault"]?.(), v26(v48, v54));
    };
    (v49["on"]?.("will-navigate", v52),
      v49["on"]?.("will-frame-navigate", v52),
      v49["on"]?.("dom-ready", () => v43(v48, v49)),
      v49["on"]?.("did-start-loading", () => v22(v48, { type: "loading" })),
      v49["on"]?.("did-stop-loading", () => {
        (v43(v48, v49), v22(v48, { type: "loaded" }), v29(v48, v49));
      }),
      v49["on"]?.("did-fail-load", (v55, v56, v57, v58) => {
        v22(v48, {
          type: "failed",
          url: String(v58 || ""),
          errorCode: v56,
          message: String(v57 || "网页加载失败"),
        });
      }),
      v49["on"]?.("did-navigate", (v59, v60) => {
        const v61 = normalizeWebPreviewUrl(v60) || String(v60 || ""),
          v62 = v19["get"](v48);
        if (v62 && normalizeWebPreviewUrl(v61)) v62["url"] = v61;
        (v22(v48, { type: "navigated", url: v61 }), v29(v48, v49));
      }),
      v49["on"]?.("did-navigate-in-page", (v63, v64) => {
        const v65 = normalizeWebPreviewUrl(v64) || String(v64 || ""),
          v66 = v19["get"](v48);
        if (v66 && normalizeWebPreviewUrl(v65)) v66["url"] = v65;
        (v22(v48, { type: "navigated", url: v65 }), v29(v48, v49));
      }));
    const v67 = v49["session"];
    (v67?.["setPermissionRequestHandler"]?.((v68, v69, v70) => {
      v70(false);
    }),
      v67?.["on"]?.("will-download", (v71) => {
        v71?.["preventDefault"]?.();
      }));
  }
  function v72(v73) {
    if (typeof v15 !== "function")
      throw new Error("当前 Electron 环境不支持 WebContentsView");
    const v74 = new v15({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        partition: toSafePartitionId(v73),
      },
    });
    (v74["setVisible"]?.(false), v47(v73, v74["webContents"]));
    const v75 = {
      nodeId: v73,
      view: v74,
      url: "",
      requestedUrl: "",
      attached: false,
      bounds: null,
      visible: false,
      selected: false,
      freezeToken: "",
      snapshotPending: false,
      zoomFactor: 1,
    };
    return (v19["set"](v73, v75), v75);
  }
  function v76(v77) {
    const v78 = v19["get"](v77);
    if (!v78) return false;
    const v79 = v20();
    try {
      v79?.["contentView"]?.["removeChildView"]?.(v78["view"]);
    } catch {}
    ((v78["attached"] = false), (v78["visible"] = false));
    try {
      !v78["view"]?.["webContents"]?.["isDestroyed"]?.() &&
        v78["view"]?.["webContents"]?.["destroy"]?.();
    } catch {}
    return (v19["delete"](v77), true);
  }
  function v80(v81) {
    const v82 = v19["get"](v81);
    if (!v82) return;
    v82["visible"] !== false &&
      (v82["view"]?.["setVisible"]?.(false), (v82["visible"] = false));
  }
  async function v83(v84 = {}) {
    const v85 = v20();
    if (!v85?.["contentView"]) return { ok: false, error: "主窗口尚未就绪" };
    const v86 = new Set(),
      v87 = getViewsPayload(v84);
    let v88 = 0,
      v89 = false;
    const v90 = [];
    for (const v91 of v87) {
      const v92 = toNodeId(v91?.["nodeId"]);
      if (!v92) continue;
      v86["add"](v92);
      const v93 = normalizeWebPreviewUrl(v91?.["webUrl"] || v91?.["url"]);
      if (!v93) {
        (v76(v92), v22(v92, { type: "failed", message: "网页地址无效" }));
        continue;
      }
      if (v91?.["visible"] === false) {
        v80(v92);
        continue;
      }
      const v94 = normalizeBounds(v91?.["bounds"]);
      if (!v94) {
        v80(v92);
        continue;
      }
      let v95 = v19["get"](v92);
      !v95 && ((v95 = v72(v92)), (v89 = true));
      const v96 = Boolean(v91?.["selected"]);
      v95["selected"] !== v96 && ((v95["selected"] = v96), (v89 = true));
      !v95["attached"] &&
        (v85["contentView"]["addChildView"](v95["view"]),
        (v95["attached"] = true),
        (v89 = true));
      v90["push"](v92);
      const v97 = String(v91?.["freezeToken"] || "0"),
        v98 = v91?.["frozen"] === true && v95["requestedUrl"] === v93;
      if (v98) {
        if (v95["freezeToken"] !== v97) {
          v95["freezeToken"] = v97;
          if (v95["visible"] !== false) {
            v95["snapshotPending"] = true;
            const v99 = v32(v92, v95, v97, () => {
              ((v95["snapshotPending"] = false), v80(v92));
            });
            if (!v99) v95["snapshotPending"] = false;
          }
        }
        if (!v95["snapshotPending"]) v80(v92);
        v88 += 1;
        continue;
      }
      ((v95["freezeToken"] = ""), (v95["snapshotPending"] = false));
      !boundsEqual(v95["bounds"], v94) &&
        ((v95["bounds"] = v94), v95["view"]["setBounds"](v94));
      const v100 = normalizeZoomFactor(v91?.["zoomFactor"]);
      v95["pendingZoomFactor"] = v100;
      v91?.["deferZoomFactor"] !== true &&
        !zoomFactorEqual(v95["zoomFactor"], v100) &&
        ((v95["zoomFactor"] = v100),
        v95["view"]["webContents"]["setZoomFactor"]?.(v100));
      v95["visible"] !== true &&
        (v95["view"]["setVisible"]?.(true), (v95["visible"] = true));
      v88 += 1;
      if (v95["requestedUrl"] !== v93) {
        ((v95["requestedUrl"] = v93), (v95["url"] = v93));
        try {
          const v101 = v95["view"]["webContents"]["loadURL"](v93);
          v101 &&
            typeof v101["catch"] === "function" &&
            void v101["catch"]((v102) => {
              (v18?.({
                type: "web_preview.load_failed",
                level: "warn",
                source: "main",
                message: "Web\x20preview\x20loadURL\x20failed",
                error: v102,
                context: { nodeId: v92 },
              }),
                v22(v92, {
                  type: "failed",
                  url: v93,
                  message: String(v102?.["message"] || "网页加载失败"),
                }));
            });
        } catch (v103) {
          (v18?.({
            type: "web_preview.load_failed",
            level: "warn",
            source: "main",
            message: "Web preview loadURL failed",
            error: v103,
            context: { nodeId: v92 },
          }),
            v22(v92, {
              type: "failed",
              url: v93,
              message: String(v103?.["message"] || "网页加载失败"),
            }));
        }
      }
    }
    if (v89)
      for (const v104 of v90) {
        const v105 = v19["get"](v104);
        v105?.["view"] &&
          v105["attached"] &&
          v85["contentView"]["addChildView"](v105["view"]);
      }
    for (const v106 of [...v19["keys"]()]) {
      if (!v86["has"](v106)) v76(v106);
    }
    return { ok: true, count: v19["size"], visibleCount: v88 };
  }
  function v107(v108 = {}) {
    const v109 = Array["isArray"](v108?.["nodeIds"])
        ? v108["nodeIds"]["map"](toNodeId)["filter"](Boolean)
        : [],
      v110 = v109["length"] > 0 ? v109 : [...v19["keys"]()];
    let v111 = 0;
    for (const v112 of v110) {
      if (v76(v112)) v111 += 1;
    }
    return { ok: true, disposed: v111 };
  }
  function v113(v114 = {}) {
    const v115 = toNodeId(v114?.["nodeId"]),
      v116 = String(v114?.["action"] || "")["trim"]();
    if (!v115) return { ok: false, error: "missing-node" };
    const v117 = v19["get"](v115);
    if (
      !v117?.["view"]?.["webContents"] ||
      v117["view"]["webContents"]["isDestroyed"]?.()
    )
      return { ok: false, error: "missing-view" };
    const v118 = v117["view"]["webContents"];
    if (v116 === "back") {
      if (!v118["canGoBack"]?.())
        return (
          v22(v115, { type: "blocked", message: "没有上一页" }),
          { ok: false, error: "no-history", ...getNavigationState(v118) }
        );
      v118["goBack"]?.();
    } else {
      if (v116 === "forward") {
        if (!v118["canGoForward"]?.())
          return (
            v22(v115, { type: "blocked", message: "没有下一页" }),
            { ok: false, error: "no-history", ...getNavigationState(v118) }
          );
        v118["goForward"]?.();
      } else {
        if (v116 === "reload") {
          if (typeof v118["reloadIgnoringCache"] === "function")
            v118["reloadIgnoringCache"]();
          else {
            if (typeof v118["reload"] === "function") v118["reload"]();
            else
              (v117["url"] || v117["requestedUrl"]) &&
                void v118["loadURL"]?.(v117["url"] || v117["requestedUrl"]);
          }
        } else return { ok: false, error: "unknown-action" };
      }
    }
    return (
      v29(v115, v118),
      { ok: true, action: v116, ...getNavigationState(v118) }
    );
  }
  return {
    syncViews: v83,
    disposeViews: v107,
    controlView: v113,
    getEntryCount: () => v19["size"],
    _getEntry: (v119) => v19["get"](v119),
  };
}
