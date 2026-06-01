import { screenToWorld, generateId } from "../../core/math.js";
import {
  createPanorama360NodeData,
  createPanoramaSceneNodeData,
} from "../panoramaSceneNode/sceneNode.js";
import { createStoryboardScriptNodeData } from "../../core/storyboardScriptFactory.js";
import { createEmptyCollageNodeData } from "../collage/collageFactory.js";
const DEV_ONLY_NODE_TYPES = new Set(["media-clip", "web-preview"]);
export function createSpecialNodeDataByType({
  type: v0,
  id: v1,
  x: v2,
  y: v3,
  width: v4,
  height: v5,
  name: v6,
}) {
  if (v0 === "panorama-scene")
    return createPanoramaSceneNodeData({
      id: v1,
      x: v2,
      y: v3,
      width: v4,
      height: v5,
      name: v6,
    });
  if (v0 === "panorama-360")
    return createPanorama360NodeData({
      id: v1,
      x: v2,
      y: v3,
      width: v4,
      height: v5,
      name: v6,
    });
  if (v0 === "storyboard-script")
    return createStoryboardScriptNodeData({
      id: v1,
      x: v2,
      y: v3,
      width: v4,
      height: v5,
      name: v6,
    });
  if (v0 === "collage")
    return createEmptyCollageNodeData({
      id: v1,
      x: v2,
      y: v3,
      width: v4,
      height: v5,
      name: v6 || "拼图",
    });
  if (v0 === "web-preview")
    return {
      id: v1,
      type: v0,
      x: v2,
      y: v3,
      width: v4,
      height: v5,
      name: v6 || "网页预览",
    };
  return null;
}
function isDevModeOn() {
  return (
    window["DEV_MODE"] === true ||
    document["body"]["classList"]["contains"]("dev-mode")
  );
}
function isDevOnlyNodeType(v7) {
  return DEV_ONLY_NODE_TYPES["has"](String(v7 || ""));
}
function resolveNodeSize(v8, v9, { forDrop: forDrop = false } = {}) {
  let { width: v10, height: v11 } = v9(v8);
  return (
    forDrop && v8 === "test-video" && ((v10 = 300), (v11 = 300)),
    forDrop && v8 === "scene-detection" && ((v10 = 400), (v11 = 500)),
    { width: v10, height: v11 }
  );
}
export function initAppNodeEntry({
  graphStore: v12,
  wrap: v13,
  btnAddEl: v14,
  nodeMenuEl: v15,
  initCanvasContextMenu: v16,
  getNodeDefaultSize: v17,
  commit: v18,
} = {}) {
  const v19 = () => {
      const v20 = isDevModeOn();
      document["querySelectorAll"](".nam-item[data-type]")["forEach"]((v21) => {
        const v22 = isDevOnlyNodeType(v21["dataset"]["type"]);
        ((v21["hidden"] = v22 && !v20),
          v21["setAttribute"]("aria-hidden", v22 && !v20 ? "true" : "false"));
      });
    },
    v23 = (v24, v25, v26, v27 = {}) => {
      const { width: v28, height: v29 } = resolveNodeSize(v24, v17, v27),
        v30 = generateId(v24),
        v31 = createSpecialNodeDataByType({
          type: v24,
          id: v30,
          x: v25 - v28 / 2,
          y: v26 - v29 / 2,
          width: v28,
          height: v29,
        }) || {
          id: v30,
          type: v24,
          x: v25 - v28 / 2,
          y: v26 - v29 / 2,
          width: v28,
          height: v29,
        };
      if (v24 === "media-clip") v31["name"] = "剪辑";
      (v12["addNode"](v31), v12["setSelectedNodes"]([v30]), v18?.());
    },
    v32 = (v33) => {
      const { viewport: v34 } = v12["getState"](),
        v35 = (window["innerWidth"] / 2 - v34["x"]) / v34["zoom"],
        v36 = (window["innerHeight"] / 2 - v34["y"]) / v34["zoom"];
      v23(v33, v35, v36);
    };
  if (v14) {
    let v37 = null,
      v38 = "",
      v39 = null;
    const v40 = () => {
        (clearTimeout(v37), (v37 = null));
      },
      v41 = () => {
        (v40(),
          (v38 = ""),
          v39 &&
            (document["removeEventListener"]("pointerdown", v39, true),
            (v39 = null)),
          document["querySelector"]("#v2PickerOverlay")?.["remove"]());
      },
      v42 = () => {
        if (v38 === "pinned") return;
        (v40(), (v37 = setTimeout(v41, 200)));
      },
      v43 = (v44) => {
        const v45 = document["querySelector"]("#v2PickerOverlay");
        if (!v45) return;
        (v40(), (v38 = v44), (v45["style"]["pointerEvents"] = "none"));
        const v46 = v45["querySelector"](".v2-node-picker");
        v46 &&
          ((v46["style"]["pointerEvents"] = "auto"),
          v46["addEventListener"]("mouseenter", v40),
          v46["addEventListener"]("mouseleave", v42));
        v39 && document["removeEventListener"]("pointerdown", v39, true);
        v39 = (v47) => {
          if (
            v46?.["contains"](v47["target"]) ||
            v14["contains"](v47["target"])
          ) {
            v40();
            return;
          }
          v41();
        };
        const v48 = v39;
        requestAnimationFrame(
          () =>
            v39 === v48 &&
            v48 &&
            document["addEventListener"]("pointerdown", v48, true),
        );
      },
      v49 = (v50) => {
        (v40(), (v38 = v50));
        const v51 = v14["getBoundingClientRect"]();
        (v16["_showPicker"]?.(v51["right"] + 12, v51["top"], true),
          requestAnimationFrame(() => v43(v50)));
      };
    (v14["addEventListener"]("click", (v52) => {
      (v52["preventDefault"](), v52["stopPropagation"](), v49("pinned"));
    }),
      v14["addEventListener"]("mouseenter", () => {
        v40();
        if (document["querySelector"]("#v2PickerOverlay")) return;
        v49("hover");
      }),
      v14["addEventListener"]("mouseleave", v42));
  }
  (document["addEventListener"]("click", (v53) => {
    v15 &&
      v15["style"]["display"] !== "none" &&
      !v53["target"]["closest"]("#nodeMenu") &&
      !v53["target"]["closest"]("#btnAdd") &&
      (v15["style"]["display"] = "none");
  }),
    v19());
  if (document["body"]) {
    const v54 = new MutationObserver(() => {
      v19();
    });
    v54["observe"](document["body"], {
      attributes: true,
      attributeFilter: ["class"],
    });
  }
  (document["querySelectorAll"](".nam-item")["forEach"]((v55) => {
    (v55["setAttribute"]("draggable", "true"),
      v55["addEventListener"]("dragstart", (v56) => {
        const v57 = v56["currentTarget"]["dataset"]["type"];
        if (isDevOnlyNodeType(v57) && !isDevModeOn()) {
          v56["preventDefault"]();
          return;
        }
        (v56["dataTransfer"]["setData"]("application/v2-node-type", v57),
          (v56["dataTransfer"]["effectAllowed"] = "copy"));
      }),
      v55["addEventListener"]("click", (v58) => {
        v58["stopPropagation"]();
        const v59 = v55["dataset"]["type"];
        if (!v59 || v59 === "resource") return;
        if (isDevOnlyNodeType(v59) && !isDevModeOn()) return;
        v32(v59);
        if (v15) v15["style"]["display"] = "none";
      }));
  }),
    v13["addEventListener"]("dragover", (v60) => {
      v60["dataTransfer"]["types"]["includes"]("application/v2-node-type") &&
        (v60["preventDefault"](), (v60["dataTransfer"]["dropEffect"] = "copy"));
    }),
    v13["addEventListener"]("drop", (v61) => {
      const v62 = v61["dataTransfer"]["getData"]("application/v2-node-type");
      if (!v62) return;
      if (isDevOnlyNodeType(v62) && !isDevModeOn()) return;
      v61["preventDefault"]();
      const { viewport: v63 } = v12["getState"](),
        v64 = screenToWorld(v61["clientX"], v61["clientY"], v63);
      v23(v62, v64["x"], v64["y"], { forDrop: true });
    }));
}
