import appStore from "../core/stores/appStore.js";
import { worldToScreen, generateId } from "../core/math.js";
import { getDisplayModelName } from "./providers.js";
import {
  IMAGE_MODELS,
  getModelDisplayName,
  getModelProvider,
  getProviderIconHtml,
} from "../config/modelConfig.js";
import { generateImage } from "../../api/aiImageApi.js";
import { calcSafeSpawnPosNearNode } from "./nodeSpawn.js";
import {
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from "../services/fileService.js";
import { localPathToUrl } from "../utils/localMediaPath.js";
const ImageExpandController = {
  active: false,
  nodeId: null,
  nodeData: null,
  ratioStr: "original",
  imageSize: "1K",
  model: null,
  provider: null,
  overlayEl: null,
  frameEl: null,
  frameRect: null,
  _pointerState: null,
  imgEl: null,
  toolbarEl: null,
  ratioMenuEl: null,
  sizeMenuEl: null,
  modelMenuEl: null,
  _unsubscribe: null,
  _view: null,
  cleanup: null,
  init(v0) {
    if (this["active"]) return;
    const v1 = appStore["getStateRaw"](),
      v2 = v1["nodes"]?.[v0];
    if (!v2) return;
    ((this["active"] = true),
      (this["nodeId"] = v0),
      (this["nodeData"] = v2),
      (this["_view"] = { viewport: v1["viewport"], node: v2 }),
      (this["ratioStr"] = "original"),
      (this["imageSize"] = "1K"));
    const v3 = Object["keys"](IMAGE_MODELS)[0],
      v4 = IMAGE_MODELS[v3]["models"][0];
    ((this["model"] = v4["id"]),
      (this["provider"] = v3),
      this["_createUI"](),
      this["_bindEvents"](),
      (this["_unsubscribe"] = appStore["subscribeSelector"](
        (v5) => {
          const v6 = v5["nodes"]?.[v0],
            v7 = v5["viewport"] || { x: 0, y: 0, zoom: 1 };
          return {
            hasNode: !!v6,
            vx: v7["x"],
            vy: v7["y"],
            vz: v7["zoom"] || 1,
            nx: v6 ? v6["x"] : 0,
            ny: v6 ? v6["y"] : 0,
            nw: v6 ? v6["width"] : 0,
            nh: v6 ? v6["height"] : 0,
          };
        },
        (v8) => {
          if (!v8?.["hasNode"]) return;
          const v9 = appStore["getStateRaw"]()["nodes"]?.[v0];
          if (!v9) return;
          ((this["nodeData"] = v9),
            (this["_view"] = {
              viewport: { x: v8["vx"], y: v8["vy"], zoom: v8["vz"] },
              node: v9,
            }),
            this["_updateView"](this["_view"]));
        },
      )),
      this["_waitForImageAndShow"]());
  },
  _waitForImageAndShow() {
    const v10 = () => {
      this["imgEl"] &&
      this["imgEl"]["complete"] &&
      this["imgEl"]["naturalWidth"] > 0
        ? (this["_updateView"](this["_view"]),
          requestAnimationFrame(() => {
            if (this["overlayEl"])
              this["overlayEl"]["classList"]["add"]("visible");
          }))
        : requestAnimationFrame(v10);
    };
    v10();
  },
  _getImageUrl() {
    const v11 = this["nodeData"] || {};
    return (
      localPathToUrl(v11["localPath"]) ||
      v11["src"] ||
      v11["imageUrl"] ||
      v11["sourceUrl"]
    );
  },
  _createExpandedImage(v12, v13) {
    return new Promise((v14, v15) => {
      const v16 = new Image();
      ((v16["crossOrigin"] = "anonymous"),
        (v16["onload"] = async () => {
          try {
            const v17 = document["createElement"]("canvas"),
              v18 = v17["getContext"]("2d"),
              v19 = v16["naturalWidth"],
              v20 = v16["naturalHeight"],
              v21 = v12,
              v22 = {
                x: v13["x"] || 0,
                y: v13["y"] || 0,
                w: v13["width"] || 1,
                h: v13["height"] || 1,
              },
              v23 = v19 / v22["w"],
              v24 = v20 / v22["h"],
              v25 = Math["round"](v21["w"] * v23),
              v26 = Math["round"](v21["h"] * v24);
            ((v17["width"] = v25),
              (v17["height"] = v26),
              (v18["fillStyle"] = "#000"),
              v18["fillRect"](0, 0, v25, v26));
            const v27 = Math["round"]((v22["x"] - v21["x"]) * v23),
              v28 = Math["round"]((v22["y"] - v21["y"]) * v24);
            (v18["drawImage"](v16, v27, v28, v19, v20),
              v17["toBlob"]((v29) => {
                if (v29) {
                  const v30 = URL["createObjectURL"](v29);
                  v14(v30);
                } else v15(new Error("无法创建扩展图像"));
              }, "image/png"));
          } catch (v31) {
            v15(v31);
          }
        }),
        (v16["onerror"] = () => {
          v15(new Error("无法加载原始图像"));
        }));
      const v32 =
        localPathToUrl(v13["localPath"]) ||
        v13["src"] ||
        v13["imageUrl"] ||
        v13["sourceUrl"];
      v16["src"] = v32;
    });
  },
  _parseRatio() {
    if (this["ratioStr"] === "original")
      return (
        (this["nodeData"]["width"] || 1) / (this["nodeData"]["height"] || 1)
      );
    const v33 = this["ratioStr"]["split"](":")["map"]((v34) => Number(v34));
    if (v33["length"] !== 2 || !v33[0] || !v33[1])
      return (
        (this["nodeData"]["width"] || 1) / (this["nodeData"]["height"] || 1)
      );
    return v33[0] / v33[1];
  },
  _calcFrameWorldRect() {
    const v35 = this["nodeData"],
      v36 = v35["width"] || 1,
      v37 = v35["height"] || 1,
      v38 = v35["x"] + v36 / 2,
      v39 = v35["y"] + v37 / 2,
      v40 = v36 / v37,
      v41 = this["_parseRatio"]();
    let v42, v43;
    v41 >= v40
      ? ((v43 = v37), (v42 = v37 * v41))
      : ((v42 = v36), (v43 = v36 / v41));
    const v44 = 1.35,
      v45 = Math["max"](v36, v42) * v44,
      v46 = Math["max"](v37, v43) * v44;
    return { x: v38 - v45 / 2, y: v39 - v46 / 2, w: v45, h: v46 };
  },
  _getNodeWorldRect() {
    const v47 = this["nodeData"] || {},
      v48 = v47["width"] || 1,
      v49 = v47["height"] || 1;
    return { x: v47["x"] || 0, y: v47["y"] || 0, w: v48, h: v49 };
  },
  _clampFrameRect(v50) {
    const v51 = this["_getNodeWorldRect"](),
      v52 = (v53, v54, v55) => Math["min"](v55, Math["max"](v54, v53)),
      v56 = {
        x: Number(v50?.["x"]) || 0,
        y: Number(v50?.["y"]) || 0,
        w: Number(v50?.["w"]) || 1,
        h: Number(v50?.["h"]) || 1,
      },
      v57 = Math["max"](v51["w"], 24),
      v58 = Math["max"](v51["h"], 24);
    ((v56["w"] = Math["max"](v56["w"], v57)),
      (v56["h"] = Math["max"](v56["h"], v58)));
    if (this["ratioStr"] !== "original") {
      const v59 = this["_parseRatio"](),
        v60 = v56["x"] + v56["w"] / 2,
        v61 = v56["y"] + v56["h"] / 2;
      let v62 = v56["w"],
        v63 = v56["h"];
      (v62 / v63 > v59 ? (v63 = v62 / v59) : (v62 = v63 * v59),
        v62 < v57 && ((v62 = v57), (v63 = v62 / v59)),
        v63 < v58 && ((v63 = v58), (v62 = v63 * v59)),
        (v56["w"] = v62),
        (v56["h"] = v63),
        (v56["x"] = v60 - v56["w"] / 2),
        (v56["y"] = v61 - v56["h"] / 2));
    }
    const v64 = v51["x"] + v51["w"] - v56["w"],
      v65 = v51["x"],
      v66 = v51["y"] + v51["h"] - v56["h"],
      v67 = v51["y"];
    return (
      (v56["x"] = v52(v56["x"], v64, v65)),
      (v56["y"] = v52(v56["y"], v66, v67)),
      v56
    );
  },
  _createUI() {
    const v68 = document["createElement"]("div");
    v68["className"] = "v2-expand-overlay";
    const v69 = document["createElement"]("div");
    ((v69["className"] = "v2-expand-frame"),
      ["tl", "tr", "bl", "br", "tm", "bm", "lm", "rm"]["forEach"]((v70) => {
        const v71 = document["createElement"]("div");
        ((v71["className"] = "v2-expand-handle " + v70),
          (v71["dataset"]["handle"] = v70),
          v69["appendChild"](v71));
      }));
    const v72 = document["createElement"]("img");
    ((v72["className"] = "v2-expand-img"),
      (v72["draggable"] = false),
      (v72["src"] = this["_getImageUrl"]()),
      v68["appendChild"](v69),
      v68["appendChild"](v72),
      document["body"]["appendChild"](v68),
      (this["overlayEl"] = v68),
      (this["frameEl"] = v69),
      (this["imgEl"] = v72),
      (this["frameRect"] = this["_calcFrameWorldRect"]()));
    const v73 = document["createElement"]("div");
    v73["className"] = "v2-expand-toolbar";
    const v74 = this["ratioStr"] === "original" ? "比例" : this["ratioStr"],
      v75 = getModelDisplayName(this["model"]);
    let v76 = "";
    (Object["entries"](IMAGE_MODELS)["forEach"](([v77, v78]) => {
      const v79 = v78["isTextIcon"]
        ? "<div\x20style=\x22width:20px;height:20px;border-radius:3px;background:var(--bg-node);color:var(--text-primary);font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;\x22>" +
          v78["icon"] +
          "</div>"
        : '<img src="' +
          v78["icon"] +
          '" style="width:20px;height:20px;object-fit:contain;border-radius:3px;flex-shrink:0;background:var(--white-10);padding:2.5px;" alt="' +
          v77 +
          "\x22>";
      let v80 = "";
      (v78["models"]["forEach"]((v81) => {
        const v82 = v81["icon"] || v78["icon"],
          v83 = this["model"] === v81["id"] ? "active" : "";
        v80 +=
          '\n          <div class="floating-menu-item ' +
          v83 +
          '" data-value="' +
          v81["id"] +
          '" data-provider="' +
          v77 +
          '" style="display:flex;align-items:center;gap:8px;">\n            <img src="' +
          v82 +
          '" style="width:20px;height:20px;object-fit:contain;border-radius:3px;flex-shrink:0;background:var(--white-10);padding:2.5px;" alt="' +
          v77 +
          '">\n            <div class="fmi-content">\n              <div class="fmi-title">' +
          v81["name"] +
          '</div>\n              <div class="fmi-sub">' +
          v81["description"] +
          "</div>\n            </div>\n          </div>";
      }),
        (v76 +=
          '\n        <div class="' +
          v77 +
          '-group-header floating-menu-item" data-' +
          v77 +
          '-toggle style="display:flex;align-items:center;gap:8px;cursor:var(--link-cursor);">\n          ' +
          v79 +
          "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22fmi-content\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22fmi-title\x22>" +
          v78["name"] +
          '</div>\n            <div class="fmi-sub">' +
          v78["description"] +
          "</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x2210\x22\x20height=\x2210\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222.5\x22\x20style=\x22opacity:0.5;flex-shrink:0;\x22><polyline\x20points=\x229\x2018\x2015\x2012\x209\x206\x22></polyline></svg>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22" +
          v77 +
          '-submenu" style="position:absolute;left:calc(100% + 6px);top:0;z-index:1001;width:max-content;max-width:320px;background:var(--bg-2);border:1px solid var(--stroke-08);border-radius:14px;padding:8px;box-shadow:var(--shadow-popover);display:none;flex-direction:column;">\n          ' +
          v80 +
          "\n        </div>"));
    }),
      (v73["innerHTML"] =
        '\n      <button class="v2-expand-toolbar-btn exit" title="退出 (Esc)">\n        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>\n      </button>\n      <div class="v2-expand-divider"></div>\n      <div class="v2-expand-wrap">\n        <button class="v2-expand-toolbar-btn ratio-toggle">\n          <span class="ratio-text">' +
        v74 +
        '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="v2-expand-menu ratio-menu">\n          <div class="v2-expand-menu-item active" data-type="ratio" data-value="original">原图比例</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="21:9">21:9</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="16:9">16:9</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="9:16">9:16</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="4:3">4:3</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="3:4">3:4</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="1:1">1:1</div>\n        </div>\n      </div>\n      <div class="v2-expand-wrap">\n        <button class="v2-expand-toolbar-btn size-toggle">\n          <span class="size-text">' +
        this["imageSize"] +
        '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="v2-expand-menu size-menu">\n          <div class="v2-expand-menu-item active" data-type="size" data-value="1K">1K</div>\n          <div class="v2-expand-menu-item" data-type="size" data-value="2K">2K</div>\n          <div class="v2-expand-menu-item" data-type="size" data-value="4K">4K</div>\n        </div>\n      </div>\n      <div class="v2-expand-wrap">\n        <button class="v2-expand-toolbar-btn model-toggle">\n          <span class="model-text">' +
        v75 +
        '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="floating-menu img-model-menu model-menu">\n          ' +
        v76 +
        '\n        </div>\n      </div>\n      <button class="v2-expand-toolbar-btn go" title="生成扩图">\n        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>\n      </button>\n    '),
      document["body"]["appendChild"](v73),
      (this["toolbarEl"] = v73),
      (this["ratioMenuEl"] = v73["querySelector"](".ratio-menu")),
      (this["sizeMenuEl"] = v73["querySelector"](".size-menu")),
      (this["modelMenuEl"] = v73["querySelector"](".model-menu")),
      this["_updateView"](this["_view"]));
  },
  _updateView(v84 = this["_view"]) {
    if (!this["active"]) return;
    const v85 = v84?.["node"],
      v86 = v84?.["viewport"];
    if (!v85) return;
    this["nodeData"] = v85;
    if (!this["frameRect"]) this["frameRect"] = this["_calcFrameWorldRect"]();
    this["frameRect"] = this["_clampFrameRect"](this["frameRect"]);
    const v87 = this["frameRect"],
      v88 = worldToScreen(v87["x"], v87["y"], v86),
      v89 = Math["round"](v87["w"] * v86["zoom"]),
      v90 = Math["round"](v87["h"] * v86["zoom"]);
    ((this["frameEl"]["style"]["left"] = Math["round"](v88["x"]) + "px"),
      (this["frameEl"]["style"]["top"] = Math["round"](v88["y"]) + "px"),
      (this["frameEl"]["style"]["width"] = v89 + "px"),
      (this["frameEl"]["style"]["height"] = v90 + "px"));
    const v91 = worldToScreen(v85["x"], v85["y"], v86),
      v92 = Math["round"](v85["width"] * v86["zoom"]),
      v93 = Math["round"](v85["height"] * v86["zoom"]);
    ((this["imgEl"]["style"]["left"] = Math["round"](v91["x"]) + "px"),
      (this["imgEl"]["style"]["top"] = Math["round"](v91["y"]) + "px"),
      (this["imgEl"]["style"]["width"] = v92 + "px"),
      (this["imgEl"]["style"]["height"] = v93 + "px"));
    if (this["toolbarEl"]) {
      const v94 = v91["y"] + v93 + 14;
      ((this["toolbarEl"]["style"]["top"] = v94 + "px"),
        (this["toolbarEl"]["style"]["left"] = v91["x"] + v92 / 2 + "px"),
        (this["toolbarEl"]["style"]["transform"] = "translateX(-50%)"),
        (this["toolbarEl"]["style"]["bottom"] = "auto"));
    }
  },
  _bindEvents() {
    const v95 = () => this["_updateView"](this["_view"]);
    window["addEventListener"]("resize", v95);
    const v96 = (v97) => {
      if (v97["key"] === "Escape") this["exit"]();
    };
    window["addEventListener"]("keydown", v96);
    const v98 = (v99) => v99["stopPropagation"]();
    this["overlayEl"]["addEventListener"]("wheel", v98, { passive: false });
    const v100 = () => {
      (this["ratioMenuEl"]?.["classList"]["remove"]("open"),
        this["sizeMenuEl"]?.["classList"]["remove"]("open"),
        this["modelMenuEl"]?.["classList"]["remove"]("show"),
        Object["keys"](IMAGE_MODELS)["forEach"]((v101) => {
          const v102 = this["modelMenuEl"]?.["querySelector"](
            "." + v101 + "-submenu",
          );
          if (v102) v102["style"]["display"] = "none";
        }));
    };
    this["toolbarEl"]["querySelector"](".exit")["onclick"] = () =>
      this["exit"]();
    const v103 = this["toolbarEl"]["querySelector"](".ratio-toggle");
    v103["onclick"] = (v104) => {
      v104["stopPropagation"]();
      const v105 = this["ratioMenuEl"]["classList"]["toggle"]("open");
      v105 &&
        (this["sizeMenuEl"]["classList"]["remove"]("open"),
        this["modelMenuEl"]["classList"]["remove"]("open"));
    };
    const v106 = this["toolbarEl"]["querySelector"](".size-toggle");
    v106["onclick"] = (v107) => {
      v107["stopPropagation"]();
      const v108 = this["sizeMenuEl"]["classList"]["toggle"]("open");
      v108 &&
        (this["ratioMenuEl"]["classList"]["remove"]("open"),
        this["modelMenuEl"]["classList"]["remove"]("open"));
    };
    const v109 = (v110) => {
      const v111 = v110["target"]["closest"](".v2-expand-menu-item");
      if (!v111) return;
      const v112 = v111["dataset"]["type"];
      if (v112 === "ratio") {
        ((this["ratioStr"] = v111["dataset"]["value"]),
          this["ratioMenuEl"]
            ["querySelectorAll"](".v2-expand-menu-item")
            [
              "forEach"
            ]((v113) => v113["classList"]["toggle"]("active", v113 === v111)),
          (this["toolbarEl"]["querySelector"](".ratio-text")["textContent"] =
            this["ratioStr"] === "original" ? "比例" : this["ratioStr"]),
          this["ratioMenuEl"]["classList"]["remove"]("open"),
          (this["frameRect"] = this["_calcFrameWorldRect"]()),
          this["_updateView"](this["_view"]));
        return;
      }
      if (v112 === "size") {
        ((this["imageSize"] = v111["dataset"]["value"]),
          this["sizeMenuEl"]
            ["querySelectorAll"](".v2-expand-menu-item")
            [
              "forEach"
            ]((v114) => v114["classList"]["toggle"]("active", v114 === v111)),
          (this["toolbarEl"]["querySelector"](".size-text")["textContent"] =
            this["imageSize"]),
          this["sizeMenuEl"]["classList"]["remove"]("open"));
        return;
      }
      if (v112 === "model") {
        ((this["model"] = v111["dataset"]["value"]),
          (this["provider"] =
            v111["dataset"]["provider"] || getModelProvider(this["model"])),
          this["modelMenuEl"]
            ["querySelectorAll"](".v2-expand-menu-item")
            [
              "forEach"
            ]((v115) => v115["classList"]["toggle"]("active", v115 === v111)),
          (this["toolbarEl"]["querySelector"](".model-text")["textContent"] =
            getModelDisplayName(this["model"])),
          this["modelMenuEl"]["classList"]["remove"]("open"));
        return;
      }
    };
    ((this["ratioMenuEl"]["onclick"] = v109),
      (this["sizeMenuEl"]["onclick"] = v109),
      (this["modelMenuEl"]["onclick"] = v109));
    const v116 = this["toolbarEl"]["querySelector"](".model-toggle"),
      v117 = this["modelMenuEl"],
      v118 = this["toolbarEl"]["querySelector"](".model-text");
    v116 &&
      v117 &&
      v118 &&
      (v116["addEventListener"]("click", (v119) => {
        (v119["stopPropagation"](),
          v117["classList"]["toggle"]("show"),
          this["ratioMenuEl"]["classList"]["remove"]("open"),
          this["sizeMenuEl"]["classList"]["remove"]("open"));
      }),
      Object["keys"](IMAGE_MODELS)["forEach"]((v120) => {
        const v121 = v117["querySelector"]("[data-" + v120 + "-toggle]"),
          v122 = v117["querySelector"]("." + v120 + "-submenu");
        if (!v121 || !v122) return;
        let v123 = null;
        const v124 = () => {
            (clearTimeout(v123), (v122["style"]["display"] = "flex"));
          },
          v125 = (v126 = 120) => {
            v123 = setTimeout(() => {
              v122["style"]["display"] = "none";
            }, v126);
          };
        (v121["addEventListener"]("mouseenter", v124),
          v121["addEventListener"]("mouseleave", () => v125()),
          v122["addEventListener"]("mouseenter", v124),
          v122["addEventListener"]("mouseleave", () => v125()),
          v122["querySelectorAll"](".floating-menu-item")["forEach"]((v127) => {
            v127["addEventListener"]("click", () => {
              const v128 = v127["dataset"]["value"],
                v129 = v127["dataset"]["provider"] || v120,
                v130 = v127["querySelector"](".fmi-title");
              ((v118["textContent"] = v130
                ? v130["textContent"]
                : getModelDisplayName(v128)),
                (this["model"] = v128),
                (this["provider"] = v129),
                appStore["updateNodeData"](this["nodeId"], {
                  model: v128,
                  provider: v129,
                }),
                v117["querySelectorAll"](".floating-menu-item")["forEach"](
                  (v131) => v131["classList"]["remove"]("active"),
                ),
                v127["classList"]["add"]("active"),
                v117["classList"]["remove"]("show"),
                (v122["style"]["display"] = "none"));
            });
          }));
      }));
    this["toolbarEl"]["querySelector"](".go")["onclick"] = async () => {
      try {
        window["showToast"]?.("正在生成扩图...", "loading");
        const v132 = appStore["getStateRaw"](),
          v133 = v132["nodes"]?.[this["nodeId"]];
        if (!v133) return;
        const v134 = { ...this["frameRect"] };
        let v135, v136;
        const v137 =
            this["ratioStr"] === "original"
              ? v133["width"] / v133["height"]
              : parseInt(this["ratioStr"]["split"](":")[0]) /
                parseInt(this["ratioStr"]["split"](":")[1]),
          v138 = getAutoMediaSizeByShortSide(v137, 1);
        ((v135 = v138["width"]), (v136 = v138["height"]));
        const { x: v139, y: v140 } = calcSafeSpawnPosNearNode(
            v132["nodes"],
            v133,
            v135,
            v136,
          ),
          v141 = generateId("source-image-expand");
        (appStore["addNode"](
          buildSourceMediaNodePayload({
            id: v141,
            type: "source-image",
            x: v139,
            y: v140,
            width: v135,
            height: v136,
            name: "扩图生成中...",
            src: "",
            isGenerating: true,
            outputText:
              "模型:\x20" +
              getDisplayModelName(this["model"]) +
              "\x0a提示词:\x20保持现有主体不变，填充黑色区域",
          }),
        ),
          appStore["setSelectedNodes"]([v141]));
        typeof window["v2FocusOnNodes"] === "function"
          ? window["v2FocusOnNodes"]([v133["id"], v141])
          : window["v2FocusOnNode"]?.(v141);
        const v142 = { ...v133 };
        this["exit"]();
        const v143 = await this["_createExpandedImage"](v134, v142),
          v144 = {
            prompt: "保持现有主体不变，填充黑色区域",
            model: this["model"],
            provider: this["provider"],
            aspectRatio:
              this["ratioStr"] === "original" ? "自适应" : this["ratioStr"],
            imageSize: this["imageSize"],
            inputUrls: [v143],
            batchSize: 1,
          },
          v145 = await generateImage(v144);
        URL["revokeObjectURL"](v143);
        if (v145["error"]) {
          (appStore["updateNodeData"](v141, {
            isGenerating: false,
            name: "扩图生成失败",
            outputText:
              "模型: " +
              getDisplayModelName(this["model"]) +
              "\n提示词: 保持现有主体不变，填充黑色区域\n错误: " +
              v145["error"],
          }),
            window["showToast"]?.("扩图失败: " + v145["error"], "error"));
          return;
        }
        (appStore["updateNodeData"](v141, {
          isGenerating: false,
          name: "扩图结果",
          imageUrl: v145["imageUrl"],
          sourceUrl: v145["sourceUrl"],
          thumbUrl: v145["thumbUrl"],
          sourceId: v145["sourceId"],
          thumbId: v145["thumbId"],
          localPath: v145["localPath"],
          outputText:
            "模型:\x20" +
            getDisplayModelName(this["model"]) +
            "\n提示词: 保持现有主体不变，填充黑色区域",
        }),
          window["showToast"]?.("扩图生成成功", "success"));
      } catch (v146) {
        (console["error"]("扩图生成失败:", v146),
          window["showToast"]?.(
            "扩图生成失败: " + (v146["message"] || "未知错误"),
            "error",
          ));
      }
    };
    const v147 = (v148) => {
      if (!this["toolbarEl"]["contains"](v148["target"])) v100();
    };
    document["addEventListener"]("pointerdown", v147, true);
    const v149 = () => {
        if (!this["_pointerState"]) return;
        (window["removeEventListener"]("pointermove", v150, true),
          window["removeEventListener"]("pointerup", v151, true),
          window["removeEventListener"]("pointercancel", v151, true),
          (this["_pointerState"] = null));
      },
      v152 = () => this["ratioStr"] !== "original",
      v150 = (v153) => {
        const v154 = this["_pointerState"];
        if (!v154 || v153["pointerId"] !== v154["pointerId"]) return;
        v153["preventDefault"]();
        const v155 = v154["zoom"] || this["_view"]?.["viewport"]?.["zoom"] || 1,
          v156 = (v153["clientX"] - v154["startX"]) / v155,
          v157 = (v153["clientY"] - v154["startY"]) / v155,
          v158 = this["_getNodeWorldRect"](),
          v159 = (v160, v161, v162) =>
            Math["min"](v162, Math["max"](v161, v160));
        if (v154["mode"] === "drag") {
          const v163 = v154["startRect"]["w"],
            v164 = v154["startRect"]["h"];
          let v165 = v154["startRect"]["x"] + v156,
            v166 = v154["startRect"]["y"] + v157;
          ((v165 = v159(v165, v158["x"] + v158["w"] - v163, v158["x"])),
            (v166 = v159(v166, v158["y"] + v158["h"] - v164, v158["y"])),
            (this["frameRect"] = { x: v165, y: v166, w: v163, h: v164 }),
            this["_updateView"](this["_view"]));
          return;
        }
        const v167 = v154["handle"],
          v168 = Math["max"](v158["w"], 24),
          v169 = Math["max"](v158["h"], 24),
          v170 = (v171) => {
            const v172 = { ...v171 },
              v173 = v158["x"] + v158["w"] - v172["w"],
              v174 = v158["x"],
              v175 = v158["y"] + v158["h"] - v172["h"],
              v176 = v158["y"];
            return (
              (v172["x"] = v159(v172["x"], v173, v174)),
              (v172["y"] = v159(v172["y"], v175, v176)),
              v172
            );
          },
          v177 = (v178, v179) => {
            const v180 = { ...v178 };
            if (v180["w"] < v168) v180["w"] = v168;
            if (v180["h"] < v169) v180["h"] = v169;
            if (v179 === "tl")
              ((v180["x"] =
                v154["startRect"]["x"] + v154["startRect"]["w"] - v180["w"]),
                (v180["y"] =
                  v154["startRect"]["y"] + v154["startRect"]["h"] - v180["h"]));
            else {
              if (v179 === "tr")
                ((v180["x"] = v154["startRect"]["x"]),
                  (v180["y"] =
                    v154["startRect"]["y"] +
                    v154["startRect"]["h"] -
                    v180["h"]));
              else {
                if (v179 === "bl")
                  ((v180["x"] =
                    v154["startRect"]["x"] +
                    v154["startRect"]["w"] -
                    v180["w"]),
                    (v180["y"] = v154["startRect"]["y"]));
                else {
                  if (v179 === "br")
                    ((v180["x"] = v154["startRect"]["x"]),
                      (v180["y"] = v154["startRect"]["y"]));
                  else {
                    if (v179 === "lm")
                      ((v180["x"] =
                        v154["startRect"]["x"] +
                        v154["startRect"]["w"] -
                        v180["w"]),
                        (v180["y"] = v154["startRect"]["y"]));
                    else {
                      if (v179 === "rm")
                        ((v180["x"] = v154["startRect"]["x"]),
                          (v180["y"] = v154["startRect"]["y"]));
                      else {
                        if (v179 === "tm")
                          ((v180["x"] = v154["startRect"]["x"]),
                            (v180["y"] =
                              v154["startRect"]["y"] +
                              v154["startRect"]["h"] -
                              v180["h"]));
                        else
                          v179 === "bm" &&
                            ((v180["x"] = v154["startRect"]["x"]),
                            (v180["y"] = v154["startRect"]["y"]));
                      }
                    }
                  }
                }
              }
            }
            return v180;
          };
        if (!v152()) {
          let v181 = { ...v154["startRect"] };
          if (v167 === "tl")
            ((v181["x"] = v154["startRect"]["x"] + v156),
              (v181["y"] = v154["startRect"]["y"] + v157),
              (v181["w"] = v154["startRect"]["w"] - v156),
              (v181["h"] = v154["startRect"]["h"] - v157),
              (v181 = v177(v181, "tl")));
          else {
            if (v167 === "tr")
              ((v181["y"] = v154["startRect"]["y"] + v157),
                (v181["w"] = v154["startRect"]["w"] + v156),
                (v181["h"] = v154["startRect"]["h"] - v157),
                (v181 = v177(v181, "tr")));
            else {
              if (v167 === "bl")
                ((v181["x"] = v154["startRect"]["x"] + v156),
                  (v181["w"] = v154["startRect"]["w"] - v156),
                  (v181["h"] = v154["startRect"]["h"] + v157),
                  (v181 = v177(v181, "bl")));
              else {
                if (v167 === "br")
                  ((v181["w"] = v154["startRect"]["w"] + v156),
                    (v181["h"] = v154["startRect"]["h"] + v157),
                    (v181 = v177(v181, "br")));
                else {
                  if (v167 === "tm")
                    ((v181["y"] = v154["startRect"]["y"] + v157),
                      (v181["h"] = v154["startRect"]["h"] - v157),
                      (v181 = v177(v181, "tm")));
                  else {
                    if (v167 === "bm")
                      ((v181["h"] = v154["startRect"]["h"] + v157),
                        (v181 = v177(v181, "bm")));
                    else {
                      if (v167 === "lm")
                        ((v181["x"] = v154["startRect"]["x"] + v156),
                          (v181["w"] = v154["startRect"]["w"] - v156),
                          (v181 = v177(v181, "lm")));
                      else
                        v167 === "rm" &&
                          ((v181["w"] = v154["startRect"]["w"] + v156),
                          (v181 = v177(v181, "rm")));
                    }
                  }
                }
              }
            }
          }
          ((this["frameRect"] = v170(v181)),
            this["_updateView"](this["_view"]));
          return;
        }
        const v182 = this["_parseRatio"](),
          v183 = v154["startRect"]["x"] + v154["startRect"]["w"] / 2,
          v184 = v154["startRect"]["y"] + v154["startRect"]["h"] / 2;
        let v185 = { ...v154["startRect"] };
        if (v167 === "lm" || v167 === "rm") {
          let v186 = v154["startRect"]["w"] + (v167 === "rm" ? v156 : -v156);
          v186 = Math["max"](v186, v168);
          let v187 = v186 / v182;
          (v187 < v169 && ((v187 = v169), (v186 = v187 * v182)),
            (v185["w"] = v186),
            (v185["h"] = v187),
            (v185["x"] =
              v167 === "rm"
                ? v154["startRect"]["x"]
                : v154["startRect"]["x"] + v154["startRect"]["w"] - v185["w"]),
            (v185["y"] = v184 - v185["h"] / 2));
        } else {
          if (v167 === "tm" || v167 === "bm") {
            let v188 = v154["startRect"]["h"] + (v167 === "bm" ? v157 : -v157);
            v188 = Math["max"](v188, v169);
            let v189 = v188 * v182;
            (v189 < v168 && ((v189 = v168), (v188 = v189 / v182)),
              (v185["w"] = v189),
              (v185["h"] = v188),
              (v185["y"] =
                v167 === "bm"
                  ? v154["startRect"]["y"]
                  : v154["startRect"]["y"] +
                    v154["startRect"]["h"] -
                    v185["h"]),
              (v185["x"] = v183 - v185["w"] / 2));
          } else {
            const v190 = v167 === "tr" || v167 === "br" ? 1 : -1,
              v191 = v167 === "bl" || v167 === "br" ? 1 : -1;
            let v192 = v154["startRect"]["w"] + v156 * v190,
              v193 = v154["startRect"]["h"] + v157 * v191;
            ((v192 = Math["max"](v192, 1)), (v193 = Math["max"](v193, 1)));
            v192 / v193 > v182 ? (v193 = v192 / v182) : (v192 = v193 * v182);
            v192 < v168 && ((v192 = v168), (v193 = v192 / v182));
            v193 < v169 && ((v193 = v169), (v192 = v193 * v182));
            ((v185["w"] = v192), (v185["h"] = v193));
            if (v167 === "br")
              ((v185["x"] = v154["startRect"]["x"]),
                (v185["y"] = v154["startRect"]["y"]));
            else {
              if (v167 === "bl")
                ((v185["x"] =
                  v154["startRect"]["x"] + v154["startRect"]["w"] - v185["w"]),
                  (v185["y"] = v154["startRect"]["y"]));
              else
                v167 === "tr"
                  ? ((v185["x"] = v154["startRect"]["x"]),
                    (v185["y"] =
                      v154["startRect"]["y"] +
                      v154["startRect"]["h"] -
                      v185["h"]))
                  : ((v185["x"] =
                      v154["startRect"]["x"] +
                      v154["startRect"]["w"] -
                      v185["w"]),
                    (v185["y"] =
                      v154["startRect"]["y"] +
                      v154["startRect"]["h"] -
                      v185["h"]));
            }
          }
        }
        ((this["frameRect"] = v170(v185)), this["_updateView"](this["_view"]));
      },
      v151 = (v194) => {
        const v195 = this["_pointerState"];
        if (!v195 || v194["pointerId"] !== v195["pointerId"]) return;
        (v194["preventDefault"](), v149());
      },
      v196 = (v197) => {
        if (v197["button"] !== 0) return;
        (v197["stopPropagation"](), v197["preventDefault"]());
        if (!this["frameRect"])
          this["frameRect"] = this["_calcFrameWorldRect"]();
        this["frameRect"] = this["_clampFrameRect"](this["frameRect"]);
        const v198 = v197["target"]["closest"](".v2-expand-handle"),
          v199 = v198?.["dataset"]?.["handle"] || null,
          v200 = v199 ? "resize" : "drag";
        ((this["_pointerState"] = {
          pointerId: v197["pointerId"],
          mode: v200,
          handle: v199,
          startX: v197["clientX"],
          startY: v197["clientY"],
          startRect: { ...this["frameRect"] },
          zoom: this["_view"]?.["viewport"]?.["zoom"] || 1,
        }),
          this["frameEl"]["setPointerCapture"]?.(v197["pointerId"]),
          window["addEventListener"]("pointermove", v150, true),
          window["addEventListener"]("pointerup", v151, true),
          window["addEventListener"]("pointercancel", v151, true));
      };
    (this["frameEl"]["addEventListener"]("pointerdown", v196),
      (this["cleanup"] = () => {
        (v149(),
          window["removeEventListener"]("resize", v95),
          window["removeEventListener"]("keydown", v96),
          document["removeEventListener"]("pointerdown", v147, true),
          this["overlayEl"]?.["removeEventListener"]("wheel", v98),
          this["frameEl"]?.["removeEventListener"]("pointerdown", v196));
      }));
  },
  exit() {
    if (!this["active"]) return;
    this["active"] = false;
    this["_unsubscribe"] &&
      (this["_unsubscribe"](), (this["_unsubscribe"] = null));
    if (this["overlayEl"]) this["overlayEl"]["classList"]["remove"]("visible");
    setTimeout(() => {
      (this["overlayEl"]?.["remove"](),
        this["toolbarEl"]?.["remove"](),
        this["cleanup"]?.(),
        (this["nodeId"] = null),
        (this["nodeData"] = null),
        (this["frameRect"] = null),
        (this["_view"] = null));
    }, 200);
  },
};
export default ImageExpandController;
