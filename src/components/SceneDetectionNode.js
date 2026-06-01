import appStore from "../core/stores/appStore.js";
import { detectScenes } from "../../api/sceneDetectionApi.js";
import { getDisplayModelName, PROVIDERS_META } from "../modules/providers.js";
import { startLoading, stopLoading } from "../modules/loadingOverlay.js";
import { generateId, findAvailablePosition } from "../core/math.js";
import { getNodeSpawnPrefs } from "../modules/nodeSpawn.js";
import {
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from "../services/fileService.js";
const _SCENE_DETECTION_NODE_TEMPLATE =
  '\n  <div class="node-card scene-detection-card" style="width: 100%; height: 100%; padding: 16px; background: var(--white-05); border: 1px solid var(--stroke-08); border-radius: 18px; overflow: hidden; position: relative; display: flex; flex-direction: column; pointer-events: auto;">\n    <div class="scene-detection-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">\n      <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: var(--text-primary);">场景检测</h3>\n      <button type="button" class="detect-btn" style="background: var(--blue); color: white; border: none; border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: var(--link-cursor);">\n        开始检测\n      </button>\n    </div>\n    \n    <div class="scene-detection-input" style="margin-bottom: 16px;">\n      <div class="input-label" style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">视频源</div>\n      <div class="ref-bar" style="border: 1px dashed var(--stroke-20); border-radius: 8px; padding: 12px; display: flex; align-items: center; justify-content: center; min-height: 60px;">\n        <div class="ref-placeholder" style="color: var(--text-muted); font-size: 12px;">拖拽视频节点到此处</div>\n      </div>\n    </div>\n    \n    <div class="scene-detection-settings" style="margin-bottom: 16px;">\n      <div class="input-label" style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">检测敏感度</div>\n      <input type="range" class="sensitivity-slider" min="0.1" max="1" step="0.1" value="0.5" style="width: 100%; accent-color: var(--blue);">\n      <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); margin-top: 4px;">\n        <span>低</span>\n        <span>高</span>\n      </div>\n    </div>\n    \n    <div class="scene-detection-results" style="flex: 1; border: 1px solid var(--stroke-10); border-radius: 8px; padding: 12px; overflow-y: auto; margin-bottom: 16px;">\n      <div class="results-placeholder" style="color: var(--text-muted); font-size: 12px; text-align: center; padding: 20px 0;">\n        点击开始检测按钮分析视频场景\n      </div>\n      <div class="scene-list" style="display: none;">\n        <div class="scene-count" style="font-size: 12px; font-weight: 600; margin-bottom: 8px;">检测到 <span class="count">0</span> 个场景</div>\n        <div class="scene-timeline" style="position: relative; height: 40px; background: var(--white-10); border-radius: 4px; margin-bottom: 12px;">\n          <div class="timeline-markers" style="position: absolute; top: 0; left: 0; right: 0; height: 100%; display: flex; align-items: center;"></div>\n        </div>\n        <div class="scene-items" style="display: flex; flex-direction: column; gap: 8px;"></div>\n      </div>\n    </div>\n    \n    <div class="scene-detection-actions" style="display: flex; gap: 8px;">\n      <button type="button" class="auto-clip-btn" style="flex: 1; background: var(--green); color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; cursor: var(--link-cursor); display: none;">\n        自动裁剪\n      </button>\n      <button type="button" class="export-btn" style="flex: 1; background: var(--purple); color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; cursor: var(--link-cursor); display: none;">\n        导出场景\n      </button>\n    </div>\n  </div>\n';
export class SceneDetectionNode {
  constructor(v0) {
    ((this["_data"] = v0),
      (this["nodeId"] = v0["id"]),
      (this["el"] = document["createElement"]("div")),
      (this["el"]["className"] = "v2-node-component"),
      (this["_videoSource"] = null),
      (this["_detectionResults"] = null),
      (this["_isDetecting"] = false),
      (this["_sensitivity"] = 0.5));
  }
  ["mount"]() {
    const v1 = this["el"];
    return (
      (v1["innerHTML"] = _SCENE_DETECTION_NODE_TEMPLATE),
      (this["_card"] = v1["querySelector"](".scene-detection-card")),
      (this["_detectBtn"] = v1["querySelector"](".detect-btn")),
      (this["_refBar"] = v1["querySelector"](".ref-bar")),
      (this["_refPlaceholder"] = v1["querySelector"](".ref-placeholder")),
      (this["_sensitivitySlider"] = v1["querySelector"](".sensitivity-slider")),
      (this["_resultsContainer"] = v1["querySelector"](
        ".scene-detection-results",
      )),
      (this["_resultsPlaceholder"] = v1["querySelector"](
        ".results-placeholder",
      )),
      (this["_sceneList"] = v1["querySelector"](".scene-list")),
      (this["_sceneCount"] = v1["querySelector"](".scene-count .count")),
      (this["_timelineMarkers"] = v1["querySelector"](".timeline-markers")),
      (this["_sceneItems"] = v1["querySelector"](".scene-items")),
      (this["_autoClipBtn"] = v1["querySelector"](".auto-clip-btn")),
      (this["_exportBtn"] = v1["querySelector"](".export-btn")),
      this["_detectBtn"]["addEventListener"]("click", () =>
        this["_startDetection"](),
      ),
      this["_sensitivitySlider"]["addEventListener"]("input", (v2) => {
        this["_sensitivity"] = parseFloat(v2["target"]["value"]);
      }),
      this["_autoClipBtn"]["addEventListener"]("click", () =>
        this["_autoClip"](),
      ),
      this["_exportBtn"]["addEventListener"]("click", () =>
        this["_exportScenes"](),
      ),
      this["_checkVideoInput"](),
      v1
    );
  }
  ["_checkVideoInput"]() {
    const v3 = appStore["getIncomingEdges"](this["nodeId"]) || [];
    if (v3["length"] > 0) {
      const v4 = v3[0],
        v5 = appStore["getState"]()["nodes"][v4["sourceId"]];
      v5 &&
        (v5["type"] === "source-video" || v5["type"]["includes"]("video")) &&
        ((this["_videoSource"] = v5),
        (this["_refPlaceholder"]["textContent"] = v5["name"] || "视频源"),
        (this["_refBar"]["style"]["borderStyle"] = "solid"),
        (this["_refBar"]["style"]["borderColor"] = "var(--blue)"));
    }
  }
  async ["_startDetection"]() {
    if (!this["_videoSource"]) {
      window["showToast"]("请先连接视频源", "error");
      return;
    }
    if (this["_isDetecting"]) return;
    const v6 = this["_videoSource"]["src"] || this["_videoSource"]["videoUrl"];
    if (!v6) {
      window["showToast"]("视频源无效", "error");
      return;
    }
    ((this["_isDetecting"] = true),
      startLoading(this["_card"]),
      (this["_detectBtn"]["textContent"] = "检测中..."),
      (this["_detectBtn"]["disabled"] = true));
    try {
      const v7 = await detectScenes({
        videoUrl: v6,
        provider: "grsai",
        sensitivity: this["_sensitivity"],
      });
      ((this["_detectionResults"] = v7),
        this["_displayResults"](v7),
        appStore["updateNodeData"](this["nodeId"], {
          sceneDetectionResults: v7,
        }),
        window["showToast"](
          "成功检测到\x20" + v7["sceneCount"] + " 个场景",
          "success",
        ));
    } catch (v8) {
      (console["error"]("场景检测失败:", v8),
        window["showToast"]("场景检测失败，请重试", "error"));
    } finally {
      ((this["_isDetecting"] = false),
        stopLoading(this["_card"]),
        (this["_detectBtn"]["textContent"] = "开始检测"),
        (this["_detectBtn"]["disabled"] = false));
    }
  }
  ["_displayResults"](v9) {
    ((this["_resultsPlaceholder"]["style"]["display"] = "none"),
      (this["_sceneList"]["style"]["display"] = "block"),
      (this["_autoClipBtn"]["style"]["display"] = "block"),
      (this["_exportBtn"]["style"]["display"] = "block"),
      (this["_sceneCount"]["textContent"] = v9["sceneCount"]),
      (this["_timelineMarkers"]["innerHTML"] = ""));
    const v10 = v9["sceneChanges"];
    (v10["forEach"]((v11, v12) => {
      const v13 = document["createElement"]("div");
      ((v13["style"]["position"] = "absolute"),
        (v13["style"]["left"] = (v11 / 100) * 100 + "%"),
        (v13["style"]["width"] = "2px"),
        (v13["style"]["height"] = "100%"),
        (v13["style"]["background"] = "var(--red)"),
        (v13["style"]["cursor"] = "var(--link-cursor)"),
        (v13["title"] = "场景切换：" + this["_formatTime"](v11)),
        this["_timelineMarkers"]["appendChild"](v13));
    }),
      (this["_sceneItems"]["innerHTML"] = ""));
    let v14 = 0;
    for (let v15 = 0; v15 < v9["sceneCount"]; v15++) {
      const v16 =
          v15 < v9["sceneChanges"]["length"] ? v9["sceneChanges"][v15] : 100,
        v17 = document["createElement"]("div");
      ((v17["className"] = "scene-item"),
        (v17["style"]["display"] = "flex"),
        (v17["style"]["justifyContent"] = "space-between"),
        (v17["style"]["alignItems"] = "center"),
        (v17["style"]["padding"] = "8px"),
        (v17["style"]["background"] = "var(--white-10)"),
        (v17["style"]["borderRadius"] = "4px"),
        (v17["innerHTML"] =
          '\n        <div style="font-size: 12px;">场景 ' +
          (v15 + 1) +
          '</div>\n        <div style="font-size: 11px; color: var(--text-secondary);">' +
          this["_formatTime"](v14) +
          " - " +
          this["_formatTime"](v16) +
          "</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22clip-btn\x22\x20data-index=\x22" +
          v15 +
          '" style="background: var(--blue); color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 10px; cursor: var(--link-cursor);">\n          裁剪\n        </button>\n      '),
        this["_sceneItems"]["appendChild"](v17),
        (v14 = v16));
    }
    this["_sceneItems"]["querySelectorAll"](".clip-btn")["forEach"]((v18) => {
      v18["addEventListener"]("click", (v19) => {
        const v20 = parseInt(v19["target"]["dataset"]["index"]);
        this["_clipScene"](v20);
      });
    });
  }
  ["_formatTime"](v21) {
    const v22 = Math["floor"](v21 / 60),
      v23 = Math["floor"](v21 % 60);
    return v22 + ":" + v23["toString"]()["padStart"](2, "0");
  }
  ["_autoClip"]() {
    if (!this["_detectionResults"]) return;
    const v24 = this["_detectionResults"]["sceneChanges"];
    let v25 = 0;
    for (let v26 = 0; v26 < this["_detectionResults"]["sceneCount"]; v26++) {
      const v27 = v26 < v24["length"] ? v24[v26] : 100;
      (this["_createClipNode"](v25, v27, v26 + 1), (v25 = v27));
    }
    window["showToast"](
      "已创建\x20" + this["_detectionResults"]["sceneCount"] + " 个裁剪节点",
      "success",
    );
  }
  ["_clipScene"](v28) {
    if (!this["_detectionResults"]) return;
    const v29 = this["_detectionResults"]["sceneChanges"];
    let v30 = 0,
      v31 = 100;
    for (let v32 = 0; v32 <= v28; v32++) {
      if (v32 === v28) {
        v31 = v32 < v29["length"] ? v29[v32] : 100;
        break;
      }
      v30 = v29[v32];
    }
    (this["_createClipNode"](v30, v31, v28 + 1),
      window["showToast"](
        "已创建场景\x20" + (v28 + 1) + "\x20的裁剪节点",
        "success",
      ));
  }
  ["_createClipNode"](v33, v34, v35) {
    if (!this["_videoSource"]) return;
    const {
        spacing: v36,
        direction: v37,
        avoidOverlap: v38,
      } = getNodeSpawnPrefs(),
      v39 = v37 === "down" ? "down" : "right",
      v40 = Number(this["_data"]["x"]) || 0,
      v41 = Number(this["_data"]["y"]) || 0,
      v42 = Number(this["_data"]["width"]) || 512,
      v43 = Number(this["_data"]["height"]) || 288,
      v44 = getAutoMediaSizeByShortSide(v42, v43),
      v45 = v40 + v42 + v36,
      v46 =
        v39 === "down"
          ? v41 + v43 + v36
          : v41 + Math["round"]((v43 - v44["height"]) / 2),
      v47 = v38
        ? findAvailablePosition(
            appStore["getState"]()["nodes"] || {},
            v45,
            v46,
            v44["width"],
            v44["height"],
            v36,
            v39,
          )
        : { x: v45, y: v46 },
      v48 = generateId("node");
    (appStore["addNode"](
      buildSourceMediaNodePayload({
        id: v48,
        type: "source-video",
        name: "场景 " + v35,
        src: this["_videoSource"]["src"],
        localPath: this["_videoSource"]["localPath"],
        clipStart: v33,
        clipEnd: v34,
        x: v47["x"],
        y: v47["y"],
        width: v44["width"],
        height: v44["height"],
        needsAutoResize: false,
      }),
    ),
      appStore["addEdge"]({
        id: generateId("edge"),
        sourceId: this["nodeId"],
        targetId: v48,
        refSlot: "scene",
      }));
  }
  ["_exportScenes"]() {
    if (!this["_detectionResults"]) return;
    const v49 = {
      videoSource: this["_videoSource"]?.["name"] || "未知视频",
      sceneCount: this["_detectionResults"]["sceneCount"],
      scenes: [],
    };
    let v50 = 0;
    for (let v51 = 0; v51 < this["_detectionResults"]["sceneCount"]; v51++) {
      const v52 =
        v51 < this["_detectionResults"]["sceneChanges"]["length"]
          ? this["_detectionResults"]["sceneChanges"][v51]
          : 100;
      (v49["scenes"]["push"]({
        number: v51 + 1,
        startTime: v50,
        endTime: v52,
        duration: v52 - v50,
      }),
        (v50 = v52));
    }
    const v53 = new Blob([JSON["stringify"](v49, null, 2)], {
        type: "application/json",
      }),
      v54 = URL["createObjectURL"](v53),
      v55 = document["createElement"]("a");
    ((v55["href"] = v54),
      (v55["download"] = "scenes_" + Date["now"]() + ".json"),
      v55["click"](),
      URL["revokeObjectURL"](v54),
      window["showToast"]("场景数据已导出", "success"));
  }
  ["update"](v56) {
    ((this["_data"] = v56),
      this["_checkVideoInput"](),
      v56["sceneDetectionResults"] &&
        ((this["_detectionResults"] = v56["sceneDetectionResults"]),
        this["_displayResults"](v56["sceneDetectionResults"])));
  }
  ["unmount"]() {}
}
