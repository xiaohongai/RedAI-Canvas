import appStore from "../core/stores/appStore.js";
import { submitTask } from "../core/generationTaskRuntime.js";
import { resolveGenerationButtonMode } from "../core/generationTaskUiState.js";
import {
  buildCanonicalStoryboardScriptJson,
  createDefaultStoryboardScriptState,
  normalizeStoryboardScriptSelectedRowIndexes,
  normalizeStoryboardScriptMediaMode,
  normalizeStoryboardScriptViewMode,
  resolveStoryboardScriptResizeMinSize,
  serializeCanonicalStoryboardScriptJson,
  serializeStoryboardScriptRowsToCsv,
  STORYBOARD_SCRIPT_COLUMNS,
  STORYBOARD_SCRIPT_DEFAULT_NAME,
  STORYBOARD_SCRIPT_TABLE_EXPORT_MIME,
  STORYBOARD_SCRIPT_TEXT_MODEL,
  STORYBOARD_SCRIPT_TEXT_PROVIDER,
  STORYBOARD_SCRIPT_TEXT_PROVIDERS,
} from "../core/storyboardScriptFactory.js";
import { generateId } from "../core/math.js";
import {
  buildStoryboardScriptImageSystemPrompt,
  buildStoryboardScriptImagePrompt,
  buildStoryboardScriptPrompt,
  buildStoryboardScriptTextOnlySystemPrompt,
  buildStoryboardScriptTextOnlyPrompt,
  buildStoryboardScriptVideoSystemPrompt,
  buildStoryboardScriptVideoPrompt,
  extractRequestedStoryboardShotCount,
  normalizeStoryboardScriptGenerationResult,
  STORYBOARD_SCRIPT_GENERATION_SCHEMA_VERSION,
} from "../core/storyboardScriptGeneration.js";
import {
  getModelManifest,
  resolveModelManifest,
  sanitizeModelUiSchemaParams,
} from "../manifests/index.js";
import { activateMenuKeyboard } from "../modules/floatingMenuKeyboard.js";
import {
  getPromptAssetInputRefsFromNode,
  _rehydratePromptPills,
  resolvePromptTextWithTextRefs,
} from "../modules/nodePromptShared.js";
import { resolveEffectiveInputKind } from "../modules/modelInputPolicy.js";
import { commit } from "../modules/history.js";
import {
  resetGenerateButtonIdleUi,
  setGenerateButtonLoadingUi,
} from "../modules/previewGenerateButtonUi.js";
import { getNanoBananaSelectionFromModel } from "../modules/nanoBananaModeRules.js";
import { getAIGenerationDefaultSizeByType } from "../services/fileService.js";
import { resolveGenerationInputImageUrl } from "../services/imageReferenceUrlService.js";
import { resolveCanvasVideoUrl } from "../services/canvasMediaLocalService.js";
import { sanitizePromptHtml } from "../utils/dom.js";
import { localPathToUrl } from "../utils/localMediaPath.js";
import { generateText } from "../../api/aiTextApi.js";
import {
  extractStoryboardVideoFramesFromServer,
  STORYBOARD_VIDEO_FRAME_LIMIT,
} from "../../api/storyboardVideoFrameApi.js";
import { getCustomTextModels } from "./aigenText/customTextModels.js";
import { getDisplayModelName } from "../modules/providers.js";
import { createBatchSpawnLayoutNearNode } from "../modules/nodeSpawn.js";
import {
  DEFAULT_IMAGE_NODE_MODEL,
  DEFAULT_IMAGE_NODE_PROVIDER,
} from "./aigenImage/defaults.js";
import {
  bindImageModelMenuSubmenu,
  buildImageDisplayRatioResizePatch,
  buildImageModelMenuHTML,
  renderImageModelTriggerIconHTML,
  resolveApimartImageMenuSelection,
  resolveComfyuiImageMenuSelection,
  resolveGrsaiImageMenuSelection,
  resolveRunningHubModelImageMenuSelection,
  resolveRunningHubWorkflowImageMenuSelection,
  resolveVolcengineImageMenuSelection,
  setImageModelTriggerIcon,
} from "./aigenImage/uiModuleModelHelpers.js";
import { fetchComfyuiWorkflows } from "../../api/comfyuiApi.js";
import {
  ensureComfyWorkflowConfig,
  invalidateComfyWorkflowCache,
  isComfyuiEngine,
  loadComfyWorkflowBundle,
  parseComfyuiModelId,
  resolveComfyWorkflowDisplayTitle,
  toComfyuiModelId,
} from "../modules/comfyui/comfyEngineUi.js";
import { isComfyGenerateWorkflow } from "../modules/comfyui/comfyWorkflowParser.js";
import {
  bindDreaminaImageMenu,
  normalizeDreaminaImageModel,
} from "./aigenImage/dreaminaModelMenuHelper.js";
import {
  bindModelUiSchemaControls,
  buildModelUiSchemaDefaultParams,
  hasModelUiSchema,
  renderModelUiSchemaControls,
  syncModelUiSchemaControls,
} from "./aigenImage/uiSchemaRenderer.js";
import { buildTextModelSmallIconHTML } from "./aigenText/apimartTextModelMenu.js";
import { createNodeResizeHandle } from "./aigenText/nodeResizeUi.js";
import { _renderSharedRefBar } from "./AIGenTextNode.js";
import { closeNodeFooterMenus } from "./shared/nodeFooterControls.js";
import { buildSharedPromptPanel } from "./sharedPromptPanel.js";
const CARD_FIELDS = Object["freeze"]([
    "景别",
    "场景",
    "画面描述",
    "角色",
    "角色描述",
    "角色动作",
    "情绪",
    "角色图",
    "参考",
    "图片提示词",
    "视频提示词",
    "对白",
    "音效",
  ]),
  NARROW_TABLE_COLUMNS = new Set(["镜号", "时长"]),
  COMPACT_TABLE_COLUMNS = new Set(["景别", "场景", "情绪"]),
  WIDE_TABLE_COLUMNS = new Set([
    "画面描述",
    "角色描述",
    "图片提示词",
    "视频提示词",
  ]),
  IMAGE_MODE_COLUMN_KEYS = new Set([
    "镜号",
    "时长",
    "景别",
    "场景",
    "画面描述",
    "角色描述",
    "角色动作",
    "情绪",
    "角色图",
    "参考",
    "图片提示词",
  ]),
  VIDEO_MODE_COLUMN_KEYS = new Set([
    "镜号",
    "时长",
    "景别",
    "场景",
    "画面描述",
    "角色描述",
    "角色动作",
    "情绪",
    "角色图",
    "参考",
    "视频提示词",
    "对白",
    "音效",
  ]),
  STORYBOARD_TOOLBAR_GENERATE_ICON_HTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16"/><path d="M3 9h18"/><path d="M3 14h18"/><path d="M13 17l2 2 4-4"/></svg>',
  STORYBOARD_TOOLBAR_FULLSCREEN_ICON_HTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2h-3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/></svg>',
  STORYBOARD_TOOLBAR_DOWNLOAD_ICON_HTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  STORYBOARD_QUEUE_ICON_HTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 7h14"/><path d="M5 12h14"/><path d="M5 17h14"/></svg>',
  STORYBOARD_EDIT_MODE_LABEL = "编辑/生成分镜",
  STORYBOARD_EXIT_EDIT_LABEL = "退出编辑",
  STORYBOARD_SELECTED_GENERATE_LABEL = "生成选中分镜",
  STORYBOARD_FULLSCREEN_LABEL = "全屏显示",
  STORYBOARD_QUEUE_BUTTON_LABEL = "加入队列",
  STORYBOARD_IMAGE_BATCH_GROUP_NAME = "分镜图像生成",
  STORYBOARD_IMAGE_BATCH_PADDING = 30,
  STORYBOARD_IMAGE_BATCH_TITLE_HEIGHT = 20,
  getStateSnapshot = () =>
    typeof appStore["getStateRaw"] === "function"
      ? appStore["getStateRaw"]()
      : appStore["getState"]();
function getSelectedRowIndexes(v0) {
  return normalizeStoryboardScriptSelectedRowIndexes(
    v0?.["selectedRowIndexes"],
    Array["isArray"](v0?.["rows"]) ? v0["rows"]["length"] : 0,
  );
}
function resolveStoryboardColumnDensity(v1) {
  const v2 = String(v1 || "");
  if (NARROW_TABLE_COLUMNS["has"](v2)) return "narrow";
  if (COMPACT_TABLE_COLUMNS["has"](v2)) return "compact";
  if (WIDE_TABLE_COLUMNS["has"](v2)) return "wide";
  return "normal";
}
function getStoryboardColumnsForMediaMode(v3) {
  const v4 = normalizeStoryboardScriptMediaMode(v3),
    v5 = v4 === "video" ? VIDEO_MODE_COLUMN_KEYS : IMAGE_MODE_COLUMN_KEYS;
  return STORYBOARD_SCRIPT_COLUMNS["filter"]((v6) => v5["has"](v6["key"]));
}
function getStoryboardCardFieldsForMediaMode(v7) {
  const v8 = normalizeStoryboardScriptMediaMode(v7),
    v9 = v8 === "video" ? VIDEO_MODE_COLUMN_KEYS : IMAGE_MODE_COLUMN_KEYS;
  return CARD_FIELDS["filter"]((v10) => v9["has"](v10));
}
function formatCellValue(v11) {
  if (v11 == null) return "";
  if (typeof v11 === "string") return v11;
  if (typeof v11 === "number" || typeof v11 === "boolean") return String(v11);
  try {
    return JSON["stringify"](v11);
  } catch {
    return String(v11);
  }
}
const STORYBOARD_IMAGE_PLACEHOLDER_PATTERN = /@图片\d+/g;
function normalizeStoryboardImagePlaceholder(v12) {
  return String(v12 || "")
    ["trim"]()
    ["replace"](/\s+/g, "");
}
function extractStoryboardImagePlaceholders(v13) {
  return String(v13 || "")["match"](STORYBOARD_IMAGE_PLACEHOLDER_PATTERN) || [];
}
function extractGeneratedText(v14) {
  if (typeof v14 === "string") return v14;
  return String(
    v14?.["text"] ||
      v14?.["outputText"] ||
      v14?.["output"] ||
      v14?.["content"] ||
      v14?.["message"] ||
      "",
  );
}
function getStoryboardImagePlaceholder(v15) {
  return "@图片" + Math["max"](1, Math["trunc"](Number(v15) || 1));
}
function getStoryboardVideoPlaceholder(v16) {
  return "@视频" + Math["max"](1, Math["trunc"](Number(v16) || 1));
}
function buildStoryboardImageRefMap(v17 = []) {
  const v18 = Array["isArray"](v17) ? v17 : [],
    v19 = new Map();
  return (
    v18["forEach"]((v20, v21) => {
      const v22 =
          normalizeStoryboardImagePlaceholder(v20?.["label"]) ||
          getStoryboardImagePlaceholder(v21 + 1),
        v23 = String(v20?.["url"] || "")["trim"]();
      if (!v22 || !v23) return;
      v19["set"](v22, { ...v20, label: v22, url: v23 });
    }),
    v19
  );
}
function mergeStoryboardImageRefs(...v24) {
  const v25 = [],
    v26 = new Set();
  return (
    v24["flat"]()["forEach"]((v27) => {
      const v28 = normalizeStoryboardImagePlaceholder(v27?.["label"]),
        v29 = String(v27?.["url"] || "")["trim"]();
      if (!v28 || !v29 || v26["has"](v28)) return;
      (v26["add"](v28),
        v25["push"]({ ...v27, label: v28, url: v29, type: "image" }));
    }),
    v25
  );
}
function pickStoryboardIndexedItem(v30, v31) {
  if (!Array["isArray"](v30) || v30["length"] === 0) return null;
  const v32 = Number["isFinite"](Number(v31))
    ? Math["max"](0, Math["trunc"](Number(v31)))
    : 0;
  return v30[Math["min"](v32, v30["length"] - 1)] || null;
}
function toStoryboardUsableMediaUrl(v33) {
  const v34 = String(v33 || "")["trim"]();
  if (!v34) return "";
  if (/^(?:https?:|blob:|data:|\/)/i["test"](v34)) return v34;
  return localPathToUrl(v34) || "";
}
function resolveStoryboardVideoRefUrl(v35 = {}) {
  const v36 = pickStoryboardIndexedItem(
      v35?.["videos"],
      v35?.["mainVideoIndex"],
    ),
    v37 = [
      resolveCanvasVideoUrl(v36),
      resolveCanvasVideoUrl(v35),
      v36?.["videoUrl"],
      v36?.["url"],
      v36?.["src"],
      v36?.["localPath"],
      v35?.["videoUrl"],
      v35?.["url"],
      v35?.["src"],
      v35?.["localPath"],
    ];
  return (
    v37["map"]((v38) => toStoryboardUsableMediaUrl(v38))["find"](Boolean) || ""
  );
}
function createStoryboardRoleImagePreview(v39, v40 = new Map()) {
  const v41 = extractStoryboardImagePlaceholders(v39),
    v42 = v41["map"]((v43) =>
      v40["get"](normalizeStoryboardImagePlaceholder(v43)),
    )["filter"]((v44) => v44?.["url"]);
  if (v42["length"] === 0) return null;
  const v45 = document["createElement"]("span");
  ((v45["className"] = "storyboard-script-role-images"),
    v42["slice"](0, 3)["forEach"]((v46) => {
      const v47 = document["createElement"]("img");
      ((v47["className"] = "storyboard-script-role-image-thumb"),
        (v47["src"] = v46["url"]),
        (v47["alt"] = v46["label"] || "角色图"),
        (v47["loading"] = "lazy"),
        (v47["draggable"] = false),
        (v47["title"] = v46["label"] || ""),
        v45["appendChild"](v47));
    }));
  if (v42["length"] > 3) {
    const v48 = document["createElement"]("span");
    ((v48["className"] = "storyboard-script-role-image-more"),
      (v48["textContent"] = "+" + (v42["length"] - 3)),
      v45["appendChild"](v48));
  }
  return v45;
}
function appendStoryboardCellDisplay(v49, v50, v51, v52 = new Map()) {
  const v53 = formatCellValue(v51);
  ((v49["dataset"]["storyboardRawValue"] = v53),
    v49["replaceChildren"](),
    v49["classList"]["remove"]("storyboard-script-image-cell"));
  if (v50 === "角色图" || v50 === "参考") {
    const v54 = createStoryboardRoleImagePreview(v53, v52);
    if (v54) {
      (v49["classList"]["add"]("storyboard-script-image-cell"),
        v49["appendChild"](v54));
      return;
    }
  }
  v49["textContent"] = v53;
}
function buildStoryboardBodyRenderSignature(v55, v56 = []) {
  const v57 = mergeStoryboardImageRefs(v56, v55?.["referenceImageRefs"])["map"](
    (v58) => ({
      label: normalizeStoryboardImagePlaceholder(v58?.["label"]),
      url: String(v58?.["url"] || "")["trim"](),
    }),
  );
  try {
    return JSON["stringify"]({
      viewMode: normalizeStoryboardScriptViewMode(v55?.["viewMode"]),
      mediaMode: normalizeStoryboardScriptMediaMode(v55?.["mediaMode"]),
      selectionMode: v55?.["selectionMode"] === true,
      rows: Array["isArray"](v55?.["rows"]) ? v55["rows"] : [],
      refs: v57,
    });
  } catch {
    return "" + Date["now"]();
  }
}
function collectDirectStoryboardImageRefs(v59 = [], v60 = {}) {
  const v61 = [];
  for (const v62 of Array["isArray"](v59) ? v59 : []) {
    const v63 = v60?.[v62?.["sourceId"]];
    if (!v63) continue;
    if (resolveEffectiveInputKind(v63, v62) !== "image") continue;
    const v64 = resolveGenerationInputImageUrl(v63);
    if (!v64) continue;
    v61["push"]({
      label: getStoryboardImagePlaceholder(v61["length"] + 1),
      url: v64,
      type: "image",
      sourceId: String(v62?.["sourceId"] || ""),
      source: "node",
    });
  }
  return v61;
}
function collectDirectStoryboardVideoRefs(v65 = [], v66 = {}) {
  const v67 = [];
  for (const v68 of Array["isArray"](v65) ? v65 : []) {
    const v69 = v66?.[v68?.["sourceId"]];
    if (!v69) continue;
    if (resolveEffectiveInputKind(v69, v68) !== "video") continue;
    const v70 = resolveStoryboardVideoRefUrl(v69);
    if (!v70) continue;
    v67["push"]({
      label: getStoryboardVideoPlaceholder(v67["length"] + 1),
      url: v70,
      type: "video",
      sourceId: String(v68?.["sourceId"] || ""),
      source: "node",
    });
  }
  return v67;
}
function normalizeStoryboardImageInputRefs({
  directImageRefs: directImageRefs = [],
  promptAssetRefs: promptAssetRefs = [],
  hiddenAssetRefs: hiddenAssetRefs = [],
} = {}) {
  const v71 = [],
    v72 = (v73, v74 = "") => {
      const v75 = String(v73?.["url"] || "")["trim"]();
      if (!v75) return;
      const v76 =
        String(v73?.["placeholder"] || v73?.["label"] || v74 || "")["trim"]() ||
        getStoryboardImagePlaceholder(v71["length"] + 1);
      v71["push"]({ ...v73, label: v76, url: v75, type: "image" });
    };
  return (
    directImageRefs["forEach"]((v77) => v72(v77, v77?.["label"])),
    promptAssetRefs["filter"]((v78) => v78?.["type"] === "image")["forEach"](
      (v79) => v72({ ...v79, label: "" }, v79?.["placeholder"]),
    ),
    hiddenAssetRefs["filter"]((v80) => v80?.["type"] === "image")["forEach"](
      (v81) => {
        v72(
          { ...v81, label: "" },
          getStoryboardImagePlaceholder(v71["length"] + 1),
        );
      },
    ),
    v71["map"]((v82, v83) => ({
      ...v82,
      label: v82["label"] || getStoryboardImagePlaceholder(v83 + 1),
    }))
  );
}
function normalizeStoryboardVideoInputRefs({
  directVideoRefs: directVideoRefs = [],
  promptAssetRefs: promptAssetRefs = [],
  hiddenAssetRefs: hiddenAssetRefs = [],
} = {}) {
  const v84 = [],
    v85 = (v86, v87 = "") => {
      const v88 = String(v86?.["url"] || "")["trim"]();
      if (!v88) return;
      const v89 =
        String(v86?.["placeholder"] || v86?.["label"] || v87 || "")["trim"]() ||
        getStoryboardVideoPlaceholder(v84["length"] + 1);
      v84["push"]({ ...v86, label: v89, url: v88, type: "video" });
    };
  return (
    directVideoRefs["forEach"]((v90) => v85(v90, v90?.["label"])),
    promptAssetRefs["filter"]((v91) => v91?.["type"] === "video")["forEach"](
      (v92) => v85({ ...v92, label: "" }, v92?.["placeholder"]),
    ),
    hiddenAssetRefs["filter"]((v93) => v93?.["type"] === "video")["forEach"](
      (v94) => {
        v85(
          { ...v94, label: "" },
          getStoryboardVideoPlaceholder(v84["length"] + 1),
        );
      },
    ),
    v84["map"]((v95, v96) => ({
      ...v95,
      label: v95["label"] || getStoryboardVideoPlaceholder(v96 + 1),
    }))
  );
}
function buildStoryboardReferenceSummary({
  imageLabels: imageLabels = [],
  videoLabels: videoLabels = [],
} = {}) {
  const v97 = [];
  return (
    Array["isArray"](imageLabels) &&
      imageLabels["length"] > 0 &&
      v97["push"]("参考图片：" + imageLabels["join"]("、")),
    Array["isArray"](videoLabels) &&
      videoLabels["length"] > 0 &&
      v97["push"]("参考视频：" + videoLabels["join"]("、")),
    v97["join"]("\x0a")
  );
}
function formatStoryboardVideoTime(v98) {
  const v99 = Math["max"](0, Number(v98) || 0),
    v100 = Math["floor"](v99),
    v101 = Math["floor"](v100 / 60),
    v102 = v100 % 60,
    v103 = Math["round"]((v99 - v100) * 10);
  return (
    String(v101)["padStart"](2, "0") +
    ":" +
    String(v102)["padStart"](2, "0") +
    "." +
    v103
  );
}
function formatStoryboardVideoTimeRange(v104 = {}) {
  const v105 = formatStoryboardVideoTime(v104["start"]),
    v106 = formatStoryboardVideoTime(
      Number(v104["end"]) > Number(v104["start"])
        ? v104["end"]
        : v104["captureTime"],
    );
  return v105 + "-" + v106;
}
function buildStoryboardVideoFrameReferenceSummary(v107 = []) {
  const v108 = Array["isArray"](v107) ? v107 : [];
  if (v108["length"] === 0) return "";
  return v108["map"]((v109) => {
    const v110 = normalizeStoryboardImagePlaceholder(v109?.["label"]),
      v111 = String(v109?.["videoLabel"] || "@视频1")["trim"](),
      v112 = String(v109?.["timeRange"] || "")["trim"](),
      v113 =
        v109?.["sentAsImage"] === false
          ? "（仅提供时间码，画面请结合原视频判断）"
          : "";
    return v110 + "：来自 " + v111 + (v112 ? "\x20" + v112 : "") + v113;
  })
    ["filter"](Boolean)
    ["join"]("\x0a");
}
function getStoryboardModelImageInputLimit(v114, v115) {
  const v116 = getModelManifest(v114, v115),
    v117 = Number(v116?.["inputSlots"]?.["maxByKind"]?.["image"]);
  return Number["isFinite"](v117) && v117 > 0
    ? Math["trunc"](v117)
    : STORYBOARD_VIDEO_FRAME_LIMIT;
}
function chunkStoryboardFrameRefs(
  v118 = [],
  v119 = STORYBOARD_VIDEO_FRAME_LIMIT,
) {
  const v120 = Array["isArray"](v118) ? v118 : [],
    v121 = Math["max"](1, Math["trunc"](Number(v119) || 1)),
    v122 = [];
  for (let v123 = 0; v123 < v120["length"]; v123 += v121) {
    v122["push"](v120["slice"](v123, v123 + v121));
  }
  return v122;
}
function buildCombinedStoryboardBatchJson({
  rows: rows = [],
  title: title = STORYBOARD_SCRIPT_DEFAULT_NAME,
} = {}) {
  const v124 = (Array["isArray"](rows) ? rows : [])["map"]((v125, v126) => ({
    ...v125,
    镜号: String(v126 + 1),
  }));
  return JSON["stringify"](
    {
      schemaVersion: STORYBOARD_SCRIPT_GENERATION_SCHEMA_VERSION,
      type: "storyboard-script",
      sourceMode: "video",
      title:
        String(title || STORYBOARD_SCRIPT_DEFAULT_NAME)["trim"]() ||
        STORYBOARD_SCRIPT_DEFAULT_NAME,
      detectedIntent: { shotCount: v124["length"], language: "zh-CN" },
      rows: v124,
    },
    null,
    2,
  );
}
async function runStoryboardScriptGenerationPayload(v127) {
  const v128 = Array["isArray"](v127?.["videoFrameBatches"])
    ? v127["videoFrameBatches"]["filter"](
        (v129) => Array["isArray"](v129) && v129["length"] > 0,
      )
    : [];
  if (v127?.["sourceMode"] !== "video" || v128["length"] <= 1)
    return generateText(v127);
  const v130 = [];
  let v131 = "";
  for (const v132 of v128) {
    const v133 = v132["map"]((v134) => v134["url"])["filter"](Boolean),
      v135 = buildStoryboardScriptVideoPrompt(v127["rawPromptText"] || "", {
        videoCount: Array["isArray"](v127["inputVideoUrls"])
          ? v127["inputVideoUrls"]["length"]
          : 0,
        videoLabels: v127["videoLabels"],
        videoFrameSummary: buildStoryboardVideoFrameReferenceSummary(
          v132["map"]((v136) => ({ ...v136, sentAsImage: true })),
        ),
      }),
      v137 = await generateText({
        ...v127,
        prompt: v135,
        inputImageUrls: v133,
        inputUrls: [...v133, ...(v127["inputVideoUrls"] || [])],
      }),
      v138 = normalizeStoryboardScriptGenerationResult(
        extractGeneratedText(v137)["trim"](),
        { requireMarker: true, sourceMode: "video" },
      );
    if (!v138["ok"])
      throw new Error("模型未返回合法分镜 JSON，请重试或减少视频切片数量");
    if (!v131) v131 = v138["title"];
    v130["push"](...v138["rows"]);
  }
  return {
    text: buildCombinedStoryboardBatchJson({
      rows: v130,
      title: v131 || STORYBOARD_SCRIPT_DEFAULT_NAME,
    }),
  };
}
function resolveStoryboardScriptTextModel(v139 = {}) {
  const v140 = String(
    v139["storyboardScript"]?.["model"] ||
      v139["model"] ||
      STORYBOARD_SCRIPT_TEXT_MODEL,
  )["trim"]();
  return v140 || STORYBOARD_SCRIPT_TEXT_MODEL;
}
function resolveStoryboardScriptTextProvider(v141 = {}) {
  const v142a = resolveStoryboardScriptTextModel(v141);
  if (getCustomTextModels()["includes"](v142a)) return "custom";
  const v142 = String(
    v141["storyboardScript"]?.["provider"] ||
      v141["provider"] ||
      STORYBOARD_SCRIPT_TEXT_PROVIDER,
  )["trim"]();
  return v142 || STORYBOARD_SCRIPT_TEXT_PROVIDER;
}
function buildStoryboardScriptStatePatch({
  current: v143,
  prompt: v144,
  model: v145,
  provider: v146,
  sourceMode: sourceMode = "",
  status: v147,
  normalized: normalized = null,
  error: error = "",
  referenceImageRefs: referenceImageRefs = null,
}) {
  const v148 = normalized?.["rows"] ?? v143["rows"] ?? [],
    v149 = buildCanonicalStoryboardScriptJson({
      ...v143,
      ...(normalized || {}),
      rows: v148,
    });
  return {
    ...v143,
    version: 1,
    viewMode: v143["viewMode"] || "list",
    prompt: v144,
    model: v145,
    provider: v146,
    sourceMode:
      normalized?.["sourceMode"] || sourceMode || v143["sourceMode"] || "text",
    isGenerating: v147 === "running",
    jobStatus: v147,
    jobError: error,
    rawJson: normalized?.["rawJson"] ?? v143["rawJson"] ?? "",
    canonicalJson: JSON["stringify"](v149, null, 2),
    rows: v148,
    selectedRowIndexes: normalized
      ? []
      : normalizeStoryboardScriptSelectedRowIndexes(
          v143["selectedRowIndexes"],
          v148["length"],
        ),
    selectionMode: normalized ? false : v143["selectionMode"] === true,
    title: v149["title"],
    detectedIntent: v149["detectedIntent"],
    referenceImageRefs: Array["isArray"](referenceImageRefs)
      ? referenceImageRefs
      : Array["isArray"](v143["referenceImageRefs"])
        ? v143["referenceImageRefs"]
        : [],
    warnings: normalized?.["warnings"] ?? v143["warnings"] ?? [],
    updatedAt: Date["now"](),
  };
}
function createToolbarButton({
  action: v150,
  label: v151,
  tooltip: v152,
  iconHtml: v153,
  showLabel: showLabel = false,
}) {
  const v154 = document["createElement"]("button");
  return (
    (v154["type"] = "button"),
    (v154["className"] = [
      "ftb-btn",
      showLabel ? "" : "icon-only",
      "act-" + v150,
    ]
      ["filter"](Boolean)
      ["join"]("\x20")),
    (v154["dataset"]["tooltip"] = v152 || v151),
    v154["setAttribute"]("aria-label", v151),
    (v154["innerHTML"] = showLabel ? v153 + "<span>" + v151 + "</span>" : v153),
    v154
  );
}
function setToolbarButtonLabel(v155, v156) {
  if (!v155) return;
  ((v155["dataset"]["tooltip"] = v156),
    v155["setAttribute"]("aria-label", v156));
  const v157 = v155["querySelector"]("span");
  if (v157) v157["textContent"] = v156;
}
function replaceModelTriggerIcon(v158, v159) {
  const v160 = v158?.["firstElementChild"],
    v161 = String(v159 || "")["trim"]();
  if (!v160 || !v161) return;
  const v162 = v158["dataset"]?.["storyboardModelIconHtml"] || "";
  if (v162 === v161) return;
  if (!v162 && String(v160["outerHTML"] || "")["trim"]() === v161) {
    v158["dataset"]["storyboardModelIconHtml"] = v161;
    return;
  }
  const v163 = document["createElement"]("template");
  v163["innerHTML"] = v161;
  const v164 = v163["content"]["firstElementChild"];
  if (!v164) return;
  ((v158["dataset"]["storyboardModelIconHtml"] = v161),
    v160["replaceWith"](v164));
}
function escapePromptTextForHtml(v165) {
  return String(v165 || "")
    ["replace"](/&/g, "&amp;")
    ["replace"](/</g, "&lt;")
    ["replace"](/>/g, "&gt;")
    ["replace"](/"/g, "&quot;");
}
function getStoryboardRowImagePrompt(v166) {
  if (!v166 || typeof v166 !== "object") return "";
  return formatCellValue(
    v166["图片提示词"] ??
      v166["imagePrompt"] ??
      v166["image_prompt"] ??
      v166["imagePromptText"] ??
      "",
  )["trim"]();
}
function getStoryboardRowShotNo(v167, v168) {
  return formatCellValue(
    v167?.["镜号"] ?? v167?.["shotNo"] ?? v167?.["shotNumber"] ?? v168 + 1,
  )["trim"]();
}
function clonePlainObject(v169) {
  if (!v169 || typeof v169 !== "object" || Array["isArray"](v169)) return null;
  try {
    return JSON["parse"](JSON["stringify"](v169));
  } catch {
    return { ...v169 };
  }
}
function getPlainObject(v170) {
  return v170 && typeof v170 === "object" && !Array["isArray"](v170)
    ? { ...v170 }
    : {};
}
function getImageNodeSizeForAspectRatio(v171) {
  const v172 = getAIGenerationDefaultSizeByType("ai-image"),
    v173 = buildImageDisplayRatioResizePatch({
      nodeData: { x: 0, y: 0, width: v172["width"], height: v172["height"] },
      ratioValue: v171,
      minSide: Math["min"](v172["width"], v172["height"]),
    });
  return {
    width: Number(v173["width"]) || v172["width"],
    height: Number(v173["height"]) || v172["height"],
  };
}
function sanitizeExportFileName(v174) {
  const v175 = String(v174 || "")
    ["trim"]()
    ["replace"](/[\\/:*?"<>|]/g, "_")
    ["replace"](/\s+/g, "_")
    ["slice"](0, 80);
  return v175 || STORYBOARD_SCRIPT_DEFAULT_NAME;
}
function formatExportTimestamp(v176 = new Date()) {
  const v177 = (v178) => String(v178)["padStart"](2, "0");
  return [
    v176["getFullYear"](),
    v177(v176["getMonth"]() + 1),
    v177(v176["getDate"]()),
    "-",
    v177(v176["getHours"]()),
    v177(v176["getMinutes"]()),
    v177(v176["getSeconds"]()),
  ]["join"]("");
}
function downloadTextFile({ filename: v179, content: v180, mimeType: v181 }) {
  const v182 = new Blob([v180], { type: v181 }),
    v183 = URL["createObjectURL"](v182),
    v184 = document["createElement"]("a");
  ((v184["href"] = v183),
    (v184["download"] = v179),
    (v184["rel"] = "noopener"),
    document["body"]["appendChild"](v184),
    v184["click"](),
    v184["remove"](),
    window["setTimeout"](() => URL["revokeObjectURL"](v183), 0));
}
function focusStoryboardImageBatch(v185, v186) {
  const v187 = [v185, v186]
    ["map"]((v188) => String(v188 || "")["trim"]())
    ["filter"](Boolean);
  if (v187["length"] === 0) return;
  appStore["setSelectedNodes"](v187);
  const v189 = typeof window !== "undefined" ? window : null;
  try {
    if (typeof v189?.["v2FocusOnNodes"] === "function")
      v189["v2FocusOnNodes"](v187, 80, 800);
    else
      typeof v189?.["v2FocusOnNode"] === "function" &&
        v189["v2FocusOnNode"](v187[v187["length"] - 1], 80, 800);
  } catch (v190) {
    console["warn"](
      "[StoryboardScriptNode] focus created image batch failed",
      v190,
    );
  }
}
function createStoryboardScriptLoadingOverlay() {
  const v191 = document["createElement"]("div");
  ((v191["className"] = "storyboard-script-loading-overlay"),
    v191["setAttribute"]("role", "status"),
    v191["setAttribute"]("aria-live", "polite"));
  const v192 = document["createElement"]("div");
  ((v192["className"] = "storyboard-script-loading-spinner"),
    v191["appendChild"](v192));
  const v193 = document["createElement"]("div");
  ((v193["className"] = "storyboard-script-loading-label"),
    (v193["textContent"] = "生成分镜脚本中"),
    v191["appendChild"](v193));
  const v194 = document["createElement"]("div");
  v194["className"] = "storyboard-script-loading-bar";
  const v195 = document["createElement"]("div");
  return (
    (v195["className"] = "storyboard-script-loading-bar-fill"),
    v194["appendChild"](v195),
    v191["appendChild"](v194),
    v191
  );
}
function waitForStoryboardLoadingPaint() {
  const v196 = typeof window !== "undefined" ? window : null;
  if (!v196) return Promise["resolve"]();
  return new Promise((v197) => {
    const v198 = () => v197();
    if (typeof v196["requestAnimationFrame"] === "function") {
      v196["requestAnimationFrame"](() => {
        typeof v196["setTimeout"] === "function"
          ? v196["setTimeout"](v198, 0)
          : v198();
      });
      return;
    }
    if (typeof v196["setTimeout"] === "function") {
      v196["setTimeout"](v198, 0);
      return;
    }
    v198();
  });
}
function createSvgIcon() {
  const v199 = "http://www.w3.org/2000/svg",
    v200 = document["createElementNS"](v199, "svg");
  (v200["setAttribute"]("width", "16"),
    v200["setAttribute"]("height", "16"),
    v200["setAttribute"]("viewBox", "0 0 24 24"),
    v200["setAttribute"]("fill", "none"),
    v200["setAttribute"]("stroke", "currentColor"),
    v200["setAttribute"]("stroke-width", "2"));
  const v201 = document["createElementNS"](v199, "rect");
  (v201["setAttribute"]("x", "3"),
    v201["setAttribute"]("y", "4"),
    v201["setAttribute"]("width", "18"),
    v201["setAttribute"]("height", "16"),
    v201["setAttribute"]("rx", "2"),
    v200["appendChild"](v201),
    ["9", "14"]["forEach"]((v202) => {
      const v203 = document["createElementNS"](v199, "line");
      (v203["setAttribute"]("x1", "3"),
        v203["setAttribute"]("y1", v202),
        v203["setAttribute"]("x2", "21"),
        v203["setAttribute"]("y2", v202),
        v200["appendChild"](v203));
    }));
  const v204 = document["createElementNS"](v199, "line");
  return (
    v204["setAttribute"]("x1", "8"),
    v204["setAttribute"]("y1", "4"),
    v204["setAttribute"]("x2", "8"),
    v204["setAttribute"]("y2", "20"),
    v200["appendChild"](v204),
    v200
  );
}
export class StoryboardScriptNode {
  constructor(v205) {
    ((this["_data"] = v205 || {}),
      (this["nodeId"] = this["_data"]["id"]),
      (this["refBarEl"] = null),
      (this["promptEl"] = null),
      (this["btnEl"] = null),
      (this["_toolbarGenerateBtn"] = null),
      (this["_toolbarFullscreenBtn"] = null),
      (this["_toolbarDownloadBtn"] = null),
      (this["_queueBtn"] = null),
      (this["_imageModeBtn"] = null),
      (this["_videoModeBtn"] = null),
      (this["_selectionCountEl"] = null),
      (this["_onDocumentPointerDown"] = null),
      (this["_onModelTriggerClickCapture"] = null),
      (this["_storyboardImageModelMenu"] = null),
      (this["_storyboardImageModelMenuBound"] = false),
      (this["_storyboardImageModelMenuLoadPromise"] = null),
      (this["_storyboardComfySchemaSyncSeq"] = 0),
      (this["_storyboardImageMenuWorkflows"] = null),
      (this["_onModelTriggerClickCaptureTarget"] = null),
      (this["_storyboardImageSchemaCleanup"] = null),
      (this["_storyboardImageSchemaModel"] = ""),
      (this["_storyboardImageSchemaSelectionMode"] = null),
      (this["rhAdvPanelEl"] = null),
      (this["rhAdvWrap"] = null),
      (this["uiSchemaModeSlot"] = null),
      (this["uiSchemaResolutionSlot"] = null),
      (this["uiSchemaInstanceSlot"] = null),
      (this["uiSchemaBatchSlot"] = null),
      (this["_isGeneratingScript"] = false),
      (this["_isPromptGenerateLoadingPrimed"] = false),
      (this["_activeCellEdit"] = null),
      (this["_storyboardViewScrollByKey"] = new Map()),
      (this["_storyboardBodyRenderSignature"] = ""),
      (this["_skipNextStoryboardBodyRender"] = false),
      (this["_fullscreenOverlayEl"] = null),
      (this["_onFullscreenKeydown"] = null),
      (this["el"] = document["createElement"]("div")),
      (this["el"]["className"] = "v2-node-component storyboard-script-node"));
  }
  ["mount"]() {
    this["el"]["replaceChildren"]();
    const v206 = document["createElement"]("div");
    v206["className"] = "storyboard-script-header";
    const v207 = document["createElement"]("div");
    ((v207["className"] = "storyboard-script-title"),
      v207["appendChild"](createSvgIcon()));
    const v208 = document["createElement"]("span");
    ((v208["textContent"] = STORYBOARD_SCRIPT_DEFAULT_NAME),
      v207["appendChild"](v208));
    const v209 = document["createElement"]("span");
    ((v209["className"] = "storyboard-script-beta"),
      (v209["textContent"] = "BETA"),
      v207["appendChild"](v209));
    const v210 = document["createElement"]("div");
    v210["className"] = "storyboard-script-header-controls";
    const v211 = document["createElement"]("div");
    ((v211["className"] = "storyboard-script-media-switch"),
      v211["setAttribute"]("role", "group"),
      v211["setAttribute"]("aria-label", "分镜脚本生成模式"),
      (this["_imageModeBtn"] = this["_createMediaModeButton"](
        "image",
        "图像提示词",
      )),
      (this["_videoModeBtn"] = this["_createMediaModeButton"](
        "video",
        "视频提示词",
      )),
      v211["appendChild"](this["_imageModeBtn"]),
      v211["appendChild"](this["_videoModeBtn"]));
    const v212 = document["createElement"]("div");
    return (
      (v212["className"] = "storyboard-script-view-switch"),
      v212["setAttribute"]("role", "group"),
      v212["setAttribute"]("aria-label", "分镜脚本视图"),
      (this["_listBtn"] = this["_createModeButton"]("list", "列表视图")),
      (this["_cardBtn"] = this["_createModeButton"]("card", "卡片视图")),
      v212["appendChild"](this["_listBtn"]),
      v212["appendChild"](this["_cardBtn"]),
      v210["appendChild"](v211),
      v210["appendChild"](v212),
      v206["appendChild"](v207),
      v206["appendChild"](v210),
      (this["_bodyEl"] = document["createElement"]("div")),
      (this["_bodyEl"]["className"] = "storyboard-script-body"),
      this["_bindBodyInteractions"](),
      (this["_promptPanelEl"] = buildSharedPromptPanel(this, {
        placeholder: "输入剧情、文案或分镜要求",
        btnTitle: "生成",
        modelMenu: {
          provider: resolveStoryboardScriptTextProvider(this["_data"]),
          providers: STORYBOARD_SCRIPT_TEXT_PROVIDERS,
          allowCustomModels: true,
          defaultModel: STORYBOARD_SCRIPT_TEXT_MODEL,
          model: resolveStoryboardScriptTextModel(this["_data"]),
          onSelect: ({ modelId: v213, provider: v214 }) => {
            const v215 = this["_getScriptState"](),
              v216 = {
                ...v215,
                model: v213,
                provider: v214,
                sourceMode: "text",
              };
            ((this["_data"] = {
              ...this["_data"],
              model: v213,
              provider: v214,
              storyboardScript: v216,
            }),
              appStore["updateNodeData"](this["nodeId"], {
                model: v213,
                provider: v214,
                storyboardScript: v216,
              }));
          },
        },
      })),
      this["_bindPromptGenerateImmediateLoading"](),
      this["_installSelectionCountIndicator"](),
      this["_installStoryboardImagePromptSchemaControls"](),
      this["_installStoryboardQueueButton"](),
      this["el"]["appendChild"](v206),
      this["el"]["appendChild"](this["_bodyEl"]),
      (this["_toolbarEl"] = this["_createToolbar"]()),
      this["el"]["appendChild"](this["_toolbarEl"]),
      this["el"]["appendChild"](this["_promptPanelEl"]),
      (this["_resizeHandleEl"] = createNodeResizeHandle(this, {
        store: appStore,
        getStateSnapshot: getStateSnapshot,
        commit: commit,
        resolveMinSize: resolveStoryboardScriptResizeMinSize,
      })),
      this["el"]["appendChild"](this["_resizeHandleEl"]),
      this["_renderRefBar"](),
      this["_bindOutsideSelectionCancel"](),
      this["_updateSubmitButtonState"](),
      this["_render"](),
      this["el"]
    );
  }
  ["_createToolbar"]() {
    const v217 = document["createElement"]("div");
    return (
      (v217["className"] =
        "node-floating-toolbar v2-text-toolbar v2-storyboard-script-toolbar"),
      v217["addEventListener"]("pointerdown", (v218) => {
        v218["stopPropagation"]();
      }),
      v217["addEventListener"]("dblclick", (v219) => {
        (v219["preventDefault"](), v219["stopPropagation"]());
      }),
      (this["_toolbarGenerateBtn"] = createToolbarButton({
        action: "generate-storyboard",
        label: STORYBOARD_EDIT_MODE_LABEL,
        tooltip: STORYBOARD_EDIT_MODE_LABEL,
        iconHtml: STORYBOARD_TOOLBAR_GENERATE_ICON_HTML,
        showLabel: true,
      })),
      this["_toolbarGenerateBtn"]["addEventListener"]("click", (v220) => {
        v220["stopPropagation"]();
        const v221 = this["_getScriptState"]();
        v221["selectionMode"] === true
          ? this["_cancelSelectionMode"]()
          : this["_enterSelectionMode"]();
      }),
      (this["_toolbarFullscreenBtn"] = createToolbarButton({
        action: "fullscreen-script",
        label: STORYBOARD_FULLSCREEN_LABEL,
        tooltip: STORYBOARD_FULLSCREEN_LABEL,
        iconHtml: STORYBOARD_TOOLBAR_FULLSCREEN_ICON_HTML,
      })),
      this["_toolbarFullscreenBtn"]["addEventListener"]("click", (v222) => {
        (v222["stopPropagation"](), this["_openFullscreenScript"]());
      }),
      (this["_toolbarDownloadBtn"] = createToolbarButton({
        action: "download-table",
        label: "下载",
        tooltip: "下载表格",
        iconHtml: STORYBOARD_TOOLBAR_DOWNLOAD_ICON_HTML,
      })),
      this["_toolbarDownloadBtn"]["addEventListener"]("click", (v223) => {
        (v223["stopPropagation"](), this["_downloadScriptTable"]());
      }),
      v217["appendChild"](this["_toolbarGenerateBtn"]),
      v217["appendChild"](this["_toolbarFullscreenBtn"]),
      v217["appendChild"](this["_toolbarDownloadBtn"]),
      v217
    );
  }
  ["_bindOutsideSelectionCancel"]() {
    (this["_unbindOutsideSelectionCancel"](),
      (this["_onDocumentPointerDown"] = (v224) => {
        const v225 = this["_getScriptState"]();
        if (v225["selectionMode"] !== true) return;
        const v226 = v224["target"];
        if (!(v226 instanceof Element)) return;
        const v227 = document["getElementById"](this["nodeId"]);
        if (this["_fullscreenOverlayEl"]?.["contains"](v226)) return;
        if (this["el"]["contains"](v226) || v227?.["contains"](v226)) return;
        this["_cancelSelectionMode"]();
      }),
      document["addEventListener"](
        "pointerdown",
        this["_onDocumentPointerDown"],
        true,
      ));
  }
  ["_unbindOutsideSelectionCancel"]() {
    if (!this["_onDocumentPointerDown"]) return;
    (document["removeEventListener"](
      "pointerdown",
      this["_onDocumentPointerDown"],
      true,
    ),
      (this["_onDocumentPointerDown"] = null));
  }
  ["_buildStoryboardImageModelMenuElement"](v227a = []) {
    const v227b = this["_getScriptState"](),
      v227c =
        appStore["getState"]?.()["nodes"]?.[this["nodeId"]] || this["_data"],
      v227d = {
        ...v227c,
        model: v227b["imageModel"] || DEFAULT_IMAGE_NODE_MODEL,
        provider: v227b["imageProvider"] || DEFAULT_IMAGE_NODE_PROVIDER,
      },
      v227e = isComfyuiEngine(v227d),
      v227f = v227e
        ? toComfyuiModelId(
            v227c["comfyWorkflow"] ||
              parseComfyuiModelId(v227b["imageModel"]),
          )
        : normalizeDreaminaImageModel(
            v227b["imageModel"] || DEFAULT_IMAGE_NODE_MODEL,
            v227b["imageProvider"] || DEFAULT_IMAGE_NODE_PROVIDER,
          ),
      v227g = getPlainObject(v227c?.["generationParams"]),
      v227h = document["createElement"]("template");
    v227h["innerHTML"] = buildImageModelMenuHTML({
      activeModel: v227f,
      nanoSelection: getNanoBananaSelectionFromModel(
        v227f,
        v227g["imageSize"] || "2K",
        v227b["imageProvider"] || DEFAULT_IMAGE_NODE_PROVIDER,
      ),
      comfyWorkflows: Array["isArray"](v227a) ? v227a : [],
      activeComfyWorkflow: String(
        v227c["comfyWorkflow"] ||
          parseComfyuiModelId(v227b["imageModel"]) ||
          "",
      )["trim"](),
    })["trim"]();
    const v227i = v227h["content"]["firstElementChild"];
    if (!v227i) return null;
    v227i["classList"]["add"]("storyboard-image-model-menu");
    return v227i;
  }
  ["_getStoryboardImageModelMenuEl"]() {
    const v227j = this["_storyboardImageModelMenu"];
    return v227j?.["isConnected"]?.() ? v227j : null;
  }
  async ["_loadStoryboardImageModelMenuForToggle"]() {
    const v227k = this["_getStoryboardImageModelMenuEl"]();
    if (v227k?.["classList"]?.["contains"]("show")) return v227k;
    if (this["_storyboardImageModelMenuLoadPromise"])
      return this["_storyboardImageModelMenuLoadPromise"];
    const v227l = this["_loadStoryboardImageModelMenuForToggleImpl"]();
    this["_storyboardImageModelMenuLoadPromise"] = v227l;
    try {
      return await v227l;
    } finally {
      this["_storyboardImageModelMenuLoadPromise"] === v227l &&
        (this["_storyboardImageModelMenuLoadPromise"] = null);
    }
  }
  async ["_loadStoryboardImageModelMenuForToggleImpl"]() {
    const v227m = this["_promptPanelEl"]?.["querySelector"](".img-model-wrap");
    if (!v227m) return null;
    const v227n = await fetchComfyuiWorkflows()["catch"](() => ({
        workflows: [],
      })),
      v227o = Array["isArray"](v227n?.["workflows"])
        ? v227n["workflows"]
        : [];
    this["_storyboardImageMenuWorkflows"] = v227o;
    const v227p = this["_buildStoryboardImageModelMenuElement"](v227o);
    if (!v227p) return null;
    return (
      v227m["querySelectorAll"](".storyboard-image-model-menu")["forEach"](
        (v227q) => {
          v227q["remove"]();
        },
      ),
      (v227m["style"]["position"] =
        v227m["style"]["position"] || "relative"),
      v227m["appendChild"](v227p),
      (this["_storyboardImageModelMenu"] = v227p),
      (this["_storyboardImageModelMenuBound"] = false),
      this["_bindStoryboardImageModelMenu"](v227p),
      v227p
    );
  }
  ["_updateStoryboardImageModelTriggerDisplay"](
    v227o = this["_getScriptState"](),
  ) {
    const v227p = {
        ...(appStore["getState"]?.()["nodes"]?.[this["nodeId"]] ||
          this["_data"]),
        model: v227o["imageModel"] || DEFAULT_IMAGE_NODE_MODEL,
        provider: v227o["imageProvider"] || DEFAULT_IMAGE_NODE_PROVIDER,
      },
      v227q = isComfyuiEngine(v227p),
      v227r = v227q
        ? toComfyuiModelId(
            v227p["comfyWorkflow"] ||
              parseComfyuiModelId(v227o["imageModel"]),
          )
        : v227o["imageModel"] || DEFAULT_IMAGE_NODE_MODEL,
      v227s = v227q
        ? "comfyui"
        : v227o["imageProvider"] || DEFAULT_IMAGE_NODE_PROVIDER,
      v227t = this["_promptPanelEl"]?.["querySelector"](
        ".img-model-btn-trigger",
      ),
      v227u = this["_promptPanelEl"]?.["querySelector"](".img-model-label"),
      v227v = v227q
        ? resolveComfyWorkflowDisplayTitle(v227p)
        : getDisplayModelName(v227r);
    (v227u &&
      v227u["textContent"] !== v227v &&
      (v227u["textContent"] = v227v),
      replaceModelTriggerIcon(
        v227t,
        renderImageModelTriggerIconHTML({ model: v227r, provider: v227s }),
      ));
  }
  ["_afterStoryboardImageModelSelect"]() {
    (this["_syncStoryboardImageModelMenuStateFromStore"](),
      this["_updateStoryboardImageModelTriggerDisplay"](this["_getScriptState"]()),
      this["_syncStoryboardImageSchemaControls"](this["_getScriptState"]()));
  }
  ["_syncStoryboardImageModelMenuTrigger"](v227x = false) {
    if (!v227x) {
      (this["_unbindStoryboardImageModelTrigger"](),
        this["_removeStoryboardImageModelMenu"]());
      return;
    }
    if (
      this["_onModelTriggerClickCapture"] &&
      this["_onModelTriggerClickCaptureTarget"]?.["isConnected"]
    )
      return;
    this["_unbindStoryboardImageModelTrigger"]();
    const v227y = this["_promptPanelEl"]?.["querySelector"](
        ".prompt-panel-footer",
      ),
      v227z = v227y?.["querySelector"](".img-model-btn-trigger");
    if (!v227y || !v227z) return;
    this["_onModelTriggerClickCapture"] = (v228a) => {
      if (this["_getScriptState"]()["selectionMode"] !== true) return;
      (v228a["preventDefault"](),
        v228a["stopPropagation"](),
        v228a["stopImmediatePropagation"]?.());
      void (async () => {
        const v228b = await this["_loadStoryboardImageModelMenuForToggle"]();
        if (!v228b?.["isConnected"]()) return;
        const v228c = !v228b["classList"]["contains"]("show");
        (closeNodeFooterMenus(v227y, v228b),
          v228b["classList"]["toggle"]("show", v228c),
          v228c && activateMenuKeyboard(v228b));
      })();
    };
    (v227z["addEventListener"](
      "click",
      this["_onModelTriggerClickCapture"],
      { capture: true },
    ),
      (this["_onModelTriggerClickCaptureTarget"] = v227z));
  }
  ["_bindStoryboardImageModelTrigger"]() {
    this["_syncStoryboardImageModelMenuTrigger"](
      this["_getScriptState"]()["selectionMode"] === true,
    );
  }
  ["_unbindStoryboardImageModelTrigger"]() {
    const v231 =
        this["_onModelTriggerClickCaptureTarget"] ||
        this["_promptPanelEl"]?.["querySelector"](".img-model-btn-trigger"),
      v231a = this["_onModelTriggerClickCapture"];
    v231 &&
      v231a &&
      v231["removeEventListener"]("click", v231a, { capture: true });
    ((this["_onModelTriggerClickCapture"] = null),
      (this["_onModelTriggerClickCaptureTarget"] = null));
  }
  ["_removeStoryboardImageModelMenu"]() {
    (this["_storyboardImageModelMenu"]?.["remove"](),
      (this["_storyboardImageModelMenu"] = null),
      (this["_storyboardImageModelMenuBound"] = false),
      (this["_storyboardImageMenuWorkflows"] = null));
  }
  ["_getStoryboardImagePromptNodeData"](v232 = this["_data"], v233 = null) {
    const v234 =
        v233 ||
        createDefaultStoryboardScriptState(v232?.["storyboardScript"] || {}),
      v234a = {
        ...(v232 || {}),
        model: v234["imageModel"] || DEFAULT_IMAGE_NODE_MODEL,
        provider: v234["imageProvider"] || DEFAULT_IMAGE_NODE_PROVIDER,
      },
      v234b = isComfyuiEngine(v234a),
      v235 = v234b
        ? toComfyuiModelId(
            v234a["comfyWorkflow"] ||
              parseComfyuiModelId(v234a["model"]) ||
              parseComfyuiModelId(v234["imageModel"]),
          )
        : normalizeDreaminaImageModel(
            v234["imageModel"] || DEFAULT_IMAGE_NODE_MODEL,
            v234["imageProvider"] || DEFAULT_IMAGE_NODE_PROVIDER,
          );
    return {
      ...(v232 || {}),
      type: "ai-image",
      model: v235,
      provider: v234b
        ? "comfyui"
        : v234["imageProvider"] || DEFAULT_IMAGE_NODE_PROVIDER,
      generationParams: getPlainObject(v232?.["generationParams"]),
      generationParamsByModel: getPlainObject(
        v232?.["generationParamsByModel"],
      ),
    };
  }
  ["_getStoryboardImageUiSchemaNodeData"](v232 = this["_data"], v233 = null) {
    const v234 = this["_getStoryboardImagePromptNodeData"](v232, v233);
    if (!isComfyuiEngine(v234)) return v234;
    return {
      ...v234,
      model: DEFAULT_IMAGE_NODE_MODEL,
      provider: DEFAULT_IMAGE_NODE_PROVIDER,
    };
  }
  ["_installStoryboardImagePromptSchemaControls"]() {
    const v236 = this["_promptPanelEl"]?.["querySelector"](
        ".prompt-panel-footer",
      ),
      v237 = v236?.["querySelector"](".img-model-pills"),
      v238 = v237?.["querySelector"](".img-model-wrap"),
      v239 = v236?.["querySelector"](".prompt-actions"),
      v240 = v239?.["querySelector"](".debug-wrench-btn");
    if (!v236 || !v237 || !v238 || !v239 || !v240) return;
    const v241 = (v242) => {
      const v243 = document["createElement"]("div");
      return (
        (v243["className"] =
          "ui-schema-placement " + v242 + " storyboard-image-schema-only"),
        (v243["hidden"] = true),
        v243
      );
    };
    ((this["uiSchemaModeSlot"] = v241("ui-schema-mode-slot")),
      (this["uiSchemaResolutionSlot"] = v241("ui-schema-resolution-slot")),
      (this["uiSchemaBatchSlot"] = v241("ui-schema-batch-slot")),
      (this["uiSchemaInstanceSlot"] = v241("ui-schema-instance-slot")),
      v238["after"](this["uiSchemaModeSlot"], this["uiSchemaResolutionSlot"]),
      (this["rhAdvWrap"] = document["createElement"]("div")),
      (this["rhAdvWrap"]["className"] =
        "rh-adv-wrap\x20storyboard-image-schema-only"),
      (this["rhAdvWrap"]["hidden"] = true));
    const v244 = document["createElement"]("button");
    ((v244["type"] = "button"),
      (v244["className"] = "img-pill-btn rh-adv-btn"),
      (v244["innerHTML"] =
        "<span\x20class=\x22rh-adv-btn-label\x22>高级设置</span>"),
      this["rhAdvWrap"]["appendChild"](v244),
      v239["insertBefore"](this["rhAdvWrap"], v240),
      v239["insertBefore"](this["uiSchemaBatchSlot"], v240),
      v239["insertBefore"](this["uiSchemaInstanceSlot"], v240),
      (this["rhAdvPanelEl"] = document["createElement"]("div")),
      (this["rhAdvPanelEl"]["className"] =
        "rh-adv-panel storyboard-image-schema-only"),
      v236["appendChild"](this["rhAdvPanelEl"]),
      v244["addEventListener"]("click", (v245) => {
        v245["stopPropagation"]();
        if (this["rhAdvPanelEl"]?.["hidden"]) return;
        (closeNodeFooterMenus(v236, this["rhAdvPanelEl"]),
          this["rhAdvPanelEl"]?.["classList"]["toggle"]("show"),
          this["_storyboardImageModelMenu"]?.["classList"]["remove"]("show"));
      }),
      this["rhAdvPanelEl"]["addEventListener"]("click", (v246) => {
        v246["stopPropagation"]();
      }),
      this["_storyboardImageSchemaCleanup"]?.(),
      (this["_storyboardImageSchemaCleanup"] = bindModelUiSchemaControls(v236, {
        nodeId: this["nodeId"],
        nodeData: this["_getStoryboardImageUiSchemaNodeData"](),
        store: appStore,
        decorateNodeData: (v247) =>
          this["_getStoryboardImageUiSchemaNodeData"](
            v247,
            createDefaultStoryboardScriptState(
              v247?.["storyboardScript"] || {},
            ),
          ),
        buildPatch: (v248, v249, v250, v250a) => {
          const v251 = createDefaultStoryboardScriptState(
              v248?.["storyboardScript"] || {},
            ),
            v252 = { ...v251, updatedAt: Date["now"]() },
            v253 = { storyboardScript: v252 };
          if (v249 === "aspectRatio") {
            v253["aspectRatio"] = v250;
            const v253a = buildImageDisplayRatioResizePatch({
              nodeData: v248,
              aspectRatio: v250,
            });
            if (v253a && typeof v253a === "object") Object["assign"](v253, v253a);
          }
          if (
            v250a &&
            typeof v250a === "object" &&
            v250a["generationParams"] &&
            typeof v250a["generationParams"] === "object"
          )
            v253["generationParams"] = v250a["generationParams"];
          if (
            v250a &&
            typeof v250a === "object" &&
            v250a["generationParamsByModel"] &&
            typeof v250a["generationParamsByModel"] === "object"
          )
            v253["generationParamsByModel"] = v250a["generationParamsByModel"];
          return v253;
        },
        afterCommit: (v253, v254, v255, { patch: v256 } = {}) => {
          (v256 &&
            typeof v256 === "object" &&
            (this["_data"] = { ...this["_data"], ...v256 }),
            this["_syncStoryboardImageSchemaControls"](
              this["_getScriptState"](),
            ));
        },
      })));
  }
  ["_syncStoryboardImageSchemaControls"](v257 = this["_getScriptState"]()) {
    const v258 = this["_promptPanelEl"]?.["querySelector"](
      ".prompt-panel-footer",
    );
    if (!v258 || !this["uiSchemaModeSlot"] || !this["uiSchemaResolutionSlot"])
      return;
    const v259 =
        Array["isArray"](v257["rows"]) &&
        v257["rows"]["length"] > 0 &&
        v257["selectionMode"] === true,
      v259a = {
        ...this["_data"],
        model: v257["imageModel"] || DEFAULT_IMAGE_NODE_MODEL,
        provider: v257["imageProvider"] || DEFAULT_IMAGE_NODE_PROVIDER,
      },
      v259b = isComfyuiEngine(v259a);
    if (v259b) {
      void this["_syncStoryboardComfyImageSchemaControls"](v257, v259);
      return;
    }
    const v260 = normalizeDreaminaImageModel(
        v257["imageModel"] || DEFAULT_IMAGE_NODE_MODEL,
        v257["imageProvider"] || DEFAULT_IMAGE_NODE_PROVIDER,
      ),
      v261 = this["_getStoryboardImageUiSchemaNodeData"](this["_data"], v257),
      v262 =
        this["_storyboardImageSchemaModel"] !== v260 ||
        this["_storyboardImageSchemaSelectionMode"] !== v259,
      v263 = (v264, v265, v266) => {
        if (!v264) return;
        const v267 = v259
          ? renderModelUiSchemaControls(v260, v261, {
              placement: v265,
              variant: v266,
            })
          : "";
        ((v264["innerHTML"] = v267), (v264["hidden"] = !v259 || !v267));
      };
    v262 &&
      (v263(this["uiSchemaModeSlot"], "mode", "pillMenu"),
      v263(this["uiSchemaResolutionSlot"], "resolution", "resolutionPill"),
      v263(this["uiSchemaBatchSlot"], "batch", "pillMenu"),
      v263(this["uiSchemaInstanceSlot"], "instance", "instanceToggle"),
      this["rhAdvPanelEl"] &&
        (this["rhAdvPanelEl"]["innerHTML"] = v259
          ? renderModelUiSchemaControls(v260, v261, {
              placement: "advanced",
              variant: "advancedRow",
            })
          : ""),
      (this["_storyboardImageSchemaModel"] = v260),
      (this["_storyboardImageSchemaSelectionMode"] = v259));
    syncModelUiSchemaControls(v258, v261);
    const v268 = v259 && hasModelUiSchema(v260, { placement: "advanced" });
    if (this["rhAdvWrap"]) this["rhAdvWrap"]["hidden"] = !v268;
    this["rhAdvPanelEl"] &&
      ((this["rhAdvPanelEl"]["hidden"] = !v268),
      (!v268 || !v259) && this["rhAdvPanelEl"]["classList"]["remove"]("show"));
  }
  async ["_syncStoryboardComfyImageSchemaControls"](
    v257 = this["_getScriptState"](),
    v259 = v257["selectionMode"] === true,
  ) {
    const v258 = this["_promptPanelEl"]?.["querySelector"](
        ".prompt-panel-footer",
      ),
      v257a = ++this["_storyboardComfySchemaSyncSeq"];
    if (!v258 || !this["uiSchemaResolutionSlot"]) return;
    const v257b = this["_getStoryboardImageUiSchemaNodeData"](
        this["_data"],
        v257,
      ),
      v257c = String(
        this["_data"]?.["comfyWorkflow"] ||
          parseComfyuiModelId(v257["imageModel"]) ||
          "",
      )["trim"]();
    if (!v257c) return;
    [this["uiSchemaModeSlot"], this["uiSchemaBatchSlot"], this["uiSchemaInstanceSlot"]][
      "forEach"
    ]((v257d) => {
      if (!v257d) return;
      v257d["innerHTML"] = "";
      v257d["hidden"] = true;
    });
    if (this["rhAdvWrap"]) this["rhAdvWrap"]["hidden"] = true;
    if (this["rhAdvPanelEl"]) {
      this["rhAdvPanelEl"]["innerHTML"] = "";
      this["rhAdvPanelEl"]["hidden"] = true;
      this["rhAdvPanelEl"]["classList"]["remove"]("show");
    }
    const v257e = await ensureComfyWorkflowConfig(v257c)["catch"](() => null),
      v257f = await loadComfyWorkflowBundle(v257c)["catch"](() => null);
    if (v257a !== this["_storyboardComfySchemaSyncSeq"]) return;
    const v257g = isComfyGenerateWorkflow(v257e, v257f?.["workflow"]),
      v257h = toComfyuiModelId(v257c);
    if (this["uiSchemaResolutionSlot"]) {
      if (v259 && v257g) {
        const v257i = renderModelUiSchemaControls(
          DEFAULT_IMAGE_NODE_MODEL,
          v257b,
          { placement: "resolution", variant: "resolutionPill" },
        );
        this["uiSchemaResolutionSlot"]["innerHTML"] = v257i || "";
        this["uiSchemaResolutionSlot"]["hidden"] = !v257i;
        this["uiSchemaResolutionSlot"]["style"]["display"] = v257i
          ? ""
          : "none";
      } else {
        this["uiSchemaResolutionSlot"]["innerHTML"] = "";
        this["uiSchemaResolutionSlot"]["hidden"] = true;
      }
    }
    syncModelUiSchemaControls(v258, v257b);
    this["_storyboardImageSchemaModel"] = v257h;
    this["_storyboardImageSchemaSelectionMode"] = v259;
  }
  ["_syncStoryboardImageModelMenuStateFromStore"]() {
    const v257j =
      appStore["getState"]?.()["nodes"]?.[this["nodeId"]] || this["_data"];
    if (v257j && typeof v257j === "object")
      this["_data"] = { ...this["_data"], ...v257j };
  }
  ["_buildStoryboardImageModelPatch"](v269, v270, v271, v272 = {}) {
    const v273 = createDefaultStoryboardScriptState(
        v269?.["storyboardScript"] || this["_getScriptState"](),
      ),
      v274 = String(v269?.["model"] || "")["trim"](),
      v275 = String(v270 || "")["trim"]() || DEFAULT_IMAGE_NODE_MODEL,
      v276 = String(v271 || "")["trim"]() || DEFAULT_IMAGE_NODE_PROVIDER,
      v277 = v272 && typeof v272 === "object" ? { ...v272 } : {};
    delete v277["storyboardScript"];
    if (v276 === "comfyui") {
      const v275a = String(v275 || "")["trim"](),
        v275b = parseComfyuiModelId(v275a),
        v275c = {
          ...v277,
          model: v275a,
          provider: "comfyui",
          imageEngine: "comfyui",
          comfyWorkflow:
            v277["comfyWorkflow"] ||
            v275b ||
            String(v269?.["comfyWorkflow"] || "")["trim"](),
          comfyWorkflowTitle:
            v277["comfyWorkflowTitle"] ||
            String(v269?.["comfyWorkflowTitle"] || "")["trim"](),
          comfyParams:
            v277["comfyParams"] && typeof v277["comfyParams"] === "object"
              ? v277["comfyParams"]
              : getPlainObject(v269?.["comfyParams"]),
        };
      return {
        ...v275c,
        generationParams: getPlainObject(v269?.["generationParams"]),
        generationParamsByModel: getPlainObject(
          v269?.["generationParamsByModel"],
        ),
        storyboardScript: {
          ...v273,
          selectionMode: true,
          imageModel: v275a,
          imageProvider: "comfyui",
          updatedAt: Date["now"](),
        },
      };
    }
    const v278 = getPlainObject(v269?.["generationParamsByModel"]);
    v274 && (v278[v274] = getPlainObject(v269?.["generationParams"]));
    const v279 = getModelManifest(v275),
      v280 = new Set(
        (v279?.["uiSchema"]?.["fields"] || [])
          ["map"]((v281) => String(v281?.["id"] || "")["trim"]())
          ["filter"](Boolean),
      ),
      v282 = getPlainObject(v277["generationParams"]),
      v283 = getPlainObject(v278[v275]),
      v284 = buildModelUiSchemaDefaultParams(v275),
      v285 = {};
    (v280["forEach"]((v286) => {
      Object["prototype"]["hasOwnProperty"]["call"](v277, v286) &&
        ((v285[v286] = v277[v286]), delete v277[v286]);
    }),
      delete v277["generationParams"],
      delete v277["generationParamsByModel"]);
    const v287 = sanitizeModelUiSchemaParams(
      v275,
      { ...v284, ...v283, ...v282, ...v285 },
      { includeDefaults: true },
    );
    if (v275) v278[v275] = v287;
    const v288 = {
        ...v273,
        selectionMode: true,
        imageModel: v275,
        imageProvider: v276,
        updatedAt: Date["now"](),
      },
      v289 =
        v287["aspectRatio"] || v277["aspectRatio"] || v269?.["aspectRatio"];
    return {
      ...v277,
      model: v275,
      provider: v276,
      imageEngine: "default",
      ...(v289 ? { aspectRatio: v289 } : {}),
      generationParams: v287,
      generationParamsByModel: v278,
      storyboardScript: v288,
    };
  }
  ["_bindStoryboardImageModelMenu"](v290) {
    if (!v290 || this["_storyboardImageModelMenuBound"]) return;
    const v291 = this["_promptPanelEl"]?.["querySelector"](
        ".img-model-btn-trigger",
      ),
      v292 = this["_promptPanelEl"]?.["querySelector"](".img-model-label"),
      v292a = () => this["_afterStoryboardImageModelSelect"](),
      v293 = {
        modelMenu: v290,
        modelTrigger: v291,
        modelLabel: v292,
        nodeId: this["nodeId"],
        store: appStore,
        fallbackNodeData: this["_data"],
        buildModelPatch: (...v294) =>
          this["_buildStoryboardImageModelPatch"](...v294),
      };
    (bindImageModelMenuSubmenu({
      ...v293,
      toggleSelector: "[data-grsai-toggle]",
      submenuSelector: ".grsai-submenu",
      defaultProvider: "grsai",
      resolveSelection: resolveGrsaiImageMenuSelection,
      afterSelect: ({ item: v295 }) => {
        setImageModelTriggerIcon(v291, "grsai", v295);
        v292a();
      },
    }),
      bindImageModelMenuSubmenu({
        ...v293,
        toggleSelector: "[data-ppio-toggle]",
        submenuSelector: ".ppio-submenu",
        defaultProvider: "ppio",
        afterSelect: ({ item: v296 }) => {
          setImageModelTriggerIcon(v291, "ppio", v296);
          v292a();
        },
      }),
      bindDreaminaImageMenu(v293),
      v290["querySelector"](".dreamina-submenu")?.["querySelectorAll"](
        ".floating-menu-item",
      )?.["forEach"]((v300b) => {
        v300b["addEventListener"]("click", () => v292a());
      }),
      bindImageModelMenuSubmenu({
        ...v293,
        toggleSelector: "[data-apimart-toggle]",
        submenuSelector: ".apimart-submenu",
        defaultProvider: "apimart",
        resolveSelection: resolveApimartImageMenuSelection,
        afterSelect: ({ item: v297 }) => {
          setImageModelTriggerIcon(v291, "apimart", v297);
          v292a();
        },
      }),
      bindImageModelMenuSubmenu({
        ...v293,
        toggleSelector: "[data-volcengine-toggle]",
        submenuSelector: ".volcengine-submenu",
        defaultProvider: "volcengine",
        resolveSelection: resolveVolcengineImageMenuSelection,
        afterSelect: ({ item: v298 }) => {
          setImageModelTriggerIcon(v291, "volcengine", v298);
          v292a();
        },
      }),
      bindImageModelMenuSubmenu({
        ...v293,
        toggleSelector: "[data-runninghubwf-toggle]",
        submenuSelector: ".runninghubwf-submenu",
        defaultProvider: "runninghubwf",
        resolveSelection: resolveRunningHubWorkflowImageMenuSelection,
        afterSelect: ({ item: v299 }) => {
          setImageModelTriggerIcon(v291, "runninghubwf", v299);
          v292a();
        },
      }),
      bindImageModelMenuSubmenu({
        ...v293,
        toggleSelector: "[data-runninghub-toggle]",
        submenuSelector: ".runninghub-submenu",
        defaultProvider: "runninghubwf",
        resolveSelection: resolveRunningHubModelImageMenuSelection,
        afterSelect: ({ item: v300, provider: v301 }) => {
          setImageModelTriggerIcon(v291, v301, v300);
          v292a();
        },
      }),
      bindImageModelMenuSubmenu({
        ...v293,
        toggleSelector: "[data-comfyui-toggle]",
        submenuSelector: ".comfyui-submenu",
        defaultProvider: "comfyui",
        resolveSelection: resolveComfyuiImageMenuSelection,
        onDisabled: () =>
          window["showToast"]?.("请先在设置 → ComfyUI 中导入工作流", "warn"),
        afterSelect: ({ item: v300a }) => {
          (invalidateComfyWorkflowCache(),
            setImageModelTriggerIcon(v291, "comfyui", v300a),
            v292a());
        },
      }),
      (this["_storyboardImageModelMenuBound"] = true));
  }
  ["_installSelectionCountIndicator"]() {
    const v310 = this["_promptPanelEl"]?.["querySelector"](".prompt-actions"),
      v311 = v310?.["querySelector"](".debug-wrench-btn");
    if (!v310 || !v311) return;
    ((this["_selectionCountEl"] = document["createElement"]("div")),
      (this["_selectionCountEl"]["className"] =
        "storyboard-script-selection-count"),
      (this["_selectionCountEl"]["textContent"] = "0/0"),
      this["_selectionCountEl"]["setAttribute"](
        "aria-label",
        "已选 0 个，共 0 个分镜",
      ),
      v310["insertBefore"](this["_selectionCountEl"], v311));
  }
  ["_installStoryboardQueueButton"]() {
    const v312 = this["_promptPanelEl"]?.["querySelector"](".prompt-actions");
    if (!v312 || !this["btnEl"] || this["_queueBtn"]) return;
    const v313 = document["createElement"]("button");
    ((v313["type"] = "button"),
      (v313["className"] = "prompt-submit\x20storyboard-script-queue-btn"),
      (v313["title"] = STORYBOARD_QUEUE_BUTTON_LABEL),
      v313["setAttribute"]("aria-label", STORYBOARD_QUEUE_BUTTON_LABEL),
      (v313["innerHTML"] = STORYBOARD_QUEUE_ICON_HTML),
      (v313["hidden"] = true),
      v313["addEventListener"]("click", (v314) => {
        (v314["stopPropagation"](),
          this["_flushPromptHtmlCommit"]?.(),
          this["_createImageNodesFromSelectedStoryboards"]({
            startGeneration: false,
          }));
      }),
      v312["insertBefore"](v313, this["btnEl"]),
      (this["_queueBtn"] = v313));
  }
  ["_createModeButton"](v315, v316) {
    const v317 = document["createElement"]("button");
    return (
      (v317["type"] = "button"),
      (v317["className"] = "storyboard-script-view-btn"),
      (v317["dataset"]["mode"] = v315),
      (v317["textContent"] = v316),
      v317["addEventListener"]("pointerdown", (v318) => {
        v318["stopPropagation"]();
      }),
      v317["addEventListener"]("dblclick", (v319) => {
        v319["stopPropagation"]();
      }),
      v317["addEventListener"]("click", (v320) => {
        (v320["stopPropagation"](), this["_setViewMode"](v315));
      }),
      v317
    );
  }
  ["_createMediaModeButton"](v321, v322) {
    const v323 = document["createElement"]("button");
    return (
      (v323["type"] = "button"),
      (v323["className"] =
        "storyboard-script-view-btn storyboard-script-media-btn"),
      (v323["dataset"]["mediaMode"] = v321),
      (v323["textContent"] = v322),
      v323["addEventListener"]("pointerdown", (v324) => {
        v324["stopPropagation"]();
      }),
      v323["addEventListener"]("dblclick", (v325) => {
        v325["stopPropagation"]();
      }),
      v323["addEventListener"]("click", (v326) => {
        (v326["stopPropagation"](), this["_setMediaMode"](v321));
      }),
      v323
    );
  }
  ["_getScriptState"]() {
    return createDefaultStoryboardScriptState(
      this["_data"]["storyboardScript"] || {},
    );
  }
  ["_syncSelectionModeUi"](v327 = this["_getScriptState"]()) {
    const v328 = Array["isArray"](v327["rows"]) ? v327["rows"]["length"] : 0,
      v329 = getSelectedRowIndexes(v327),
      v330 = v328 > 0 && v327["selectionMode"] === true,
      v331 = v330 ? STORYBOARD_EXIT_EDIT_LABEL : STORYBOARD_EDIT_MODE_LABEL,
      v331a = {
        ...(appStore["getState"]?.()["nodes"]?.[this["nodeId"]] || this["_data"]),
        model: v327["imageModel"] || DEFAULT_IMAGE_NODE_MODEL,
        provider: v327["imageProvider"] || DEFAULT_IMAGE_NODE_PROVIDER,
      },
      v331b = v330 && isComfyuiEngine(v331a),
      v332 = v330
        ? v331b
          ? toComfyuiModelId(
              v331a["comfyWorkflow"] ||
                parseComfyuiModelId(v327["imageModel"]),
            )
          : v327["imageModel"] || DEFAULT_IMAGE_NODE_MODEL
        : resolveStoryboardScriptTextModel({ storyboardScript: v327 }),
      v333 = v330
        ? v331b
          ? "comfyui"
          : v327["imageProvider"] || DEFAULT_IMAGE_NODE_PROVIDER
        : resolveStoryboardScriptTextProvider({ storyboardScript: v327 });
    this["_promptPanelEl"]?.["classList"]["toggle"](
      "is-storyboard-image-mode",
      v330,
    );
    this["_syncStoryboardImageModelMenuTrigger"](v330);
    v330 &&
      this["_promptPanelEl"]
        ?.["querySelector"](".node-model-menu")
        ?.["classList"]["remove"]("show");
    (this["_queueBtn"] && (this["_queueBtn"]["hidden"] = !v330),
      this["el"]?.["classList"]["toggle"]("has-storyboard-rows", v328 > 0),
      this["el"]?.["classList"]["toggle"]("is-storyboard-selection-mode", v330),
      this["_toolbarGenerateBtn"]?.["classList"]["toggle"]("active", v330),
      setToolbarButtonLabel(this["_toolbarGenerateBtn"], v331),
      this["_promptPanelEl"]
        ?.["querySelector"](".node-model-menu")
        ?.["classList"]["toggle"]("is-storyboard-text-menu-hidden", v330));
    !v330 && this["_storyboardImageModelMenu"]?.["classList"]["remove"]("show");
    const v334 = this["_promptPanelEl"]?.["querySelector"](
        ".img-model-btn-trigger",
      ),
      v335 = this["_promptPanelEl"]?.["querySelector"](".img-model-label"),
      v336 = v331b
        ? resolveComfyWorkflowDisplayTitle(v331a)
        : getDisplayModelName(v332);
    (v330
      ? this["_updateStoryboardImageModelTriggerDisplay"](v327)
      : (v335 &&
          v335["textContent"] !== v336 &&
          (v335["textContent"] = v336),
        replaceModelTriggerIcon(
          v334,
          buildTextModelSmallIconHTML(v332) ||
            '<div class="text-model-icon-small text-model-icon-badge">AI</div>',
        )),
      this["_selectionCountEl"] &&
        ((this["_selectionCountEl"]["textContent"] =
          v329["length"] + "/" + v328),
        this["_selectionCountEl"]["setAttribute"](
          "aria-label",
          "已选 " + v329["length"] + " 个，共 " + v328 + " 个分镜",
        ),
        (this["_selectionCountEl"]["hidden"] = !v330)),
      this["_syncStoryboardImageSchemaControls"](v327));
  }
  ["_enterSelectionMode"]() {
    this["_finishCellEdit"]({ commit: true });
    const v337 = this["_getScriptState"]();
    if (!Array["isArray"](v337["rows"]) || v337["rows"]["length"] === 0) {
      window["showToast"]?.("请先生成分镜脚本", "warn");
      return;
    }
    const v338 = v337["imageModel"] || DEFAULT_IMAGE_NODE_MODEL,
      v339 = v337["imageProvider"] || DEFAULT_IMAGE_NODE_PROVIDER,
      v340 =
        appStore["getState"]?.()["nodes"]?.[this["nodeId"]] || this["_data"],
      v341 = this["_buildStoryboardImageModelPatch"](v340, v338, v339),
      v342 = {
        ...v341["storyboardScript"],
        viewMode: "list",
        selectionMode: true,
        selectedRowIndexes: getSelectedRowIndexes(v337),
        updatedAt: Date["now"](),
      };
    ((this["_data"] = { ...this["_data"], ...v341, storyboardScript: v342 }),
      appStore["updateNodeData"](this["nodeId"], {
        ...v341,
        storyboardScript: v342,
      }));
  }
  ["_cancelSelectionMode"]() {
    let v343 = this["_getScriptState"]();
    if (v343["selectionMode"] !== true) return;
    (this["_finishCellEdit"]({ commit: true }),
      (v343 = this["_getScriptState"]()));
    const v344 = resolveStoryboardScriptTextModel({ storyboardScript: v343 }),
      v345 = resolveStoryboardScriptTextProvider({ storyboardScript: v343 }),
      v346 = {
        ...v343,
        selectionMode: false,
        selectedRowIndexes: [],
        updatedAt: Date["now"](),
      };
    ((this["_data"] = {
      ...this["_data"],
      model: v344,
      provider: v345,
      storyboardScript: v346,
    }),
      appStore["updateNodeData"](this["nodeId"], {
        model: v344,
        provider: v345,
        storyboardScript: v346,
      }));
  }
  ["_updateSelectedRowIndexes"](v347) {
    const v348 = this["_getScriptState"](),
      v349 = normalizeStoryboardScriptSelectedRowIndexes(
        v347,
        v348["rows"]["length"],
      ),
      v350 = { ...v348, selectedRowIndexes: v349, updatedAt: Date["now"]() };
    ((this["_data"] = { ...this["_data"], storyboardScript: v350 }),
      this["_syncListSelectionState"](v350),
      appStore["updateNodeData"](this["nodeId"], { storyboardScript: v350 }));
  }
  ["_toggleRowSelection"](v351, v352) {
    const v353 = this["_getScriptState"](),
      v354 = new Set(getSelectedRowIndexes(v353));
    if (v352) v354["add"](v351);
    else v354["delete"](v351);
    this["_updateSelectedRowIndexes"](
      [...v354]["sort"]((v355, v356) => v355 - v356),
    );
  }
  ["_setAllRowsSelected"](v357) {
    const v358 = this["_getScriptState"](),
      v359 = v357 ? v358["rows"]["map"]((v360, v361) => v361) : [];
    this["_updateSelectedRowIndexes"](v359);
  }
  ["_setViewMode"](v362) {
    this["_finishCellEdit"]({ commit: true });
    const v363 = normalizeStoryboardScriptViewMode(v362),
      v364 = this["_getScriptState"]();
    if (v364["viewMode"] === v363) return;
    appStore["updateNodeData"](this["nodeId"], {
      storyboardScript: { ...v364, viewMode: v363 },
    });
  }
  ["_setMediaMode"](v365) {
    this["_finishCellEdit"]({ commit: true });
    const v366 = normalizeStoryboardScriptMediaMode(v365),
      v367 = this["_getScriptState"]();
    if (v367["mediaMode"] === v366) return;
    appStore["updateNodeData"](this["nodeId"], {
      storyboardScript: { ...v367, mediaMode: v366, updatedAt: Date["now"]() },
    });
  }
  ["_syncModeButtons"](v368, v369) {
    [this["_listBtn"], this["_cardBtn"]]["forEach"]((v370) => {
      if (!v370) return;
      const v371 = v370["dataset"]["mode"] === v368;
      (v370["classList"]["toggle"]("is-active", v371),
        v370["setAttribute"]("aria-pressed", v371 ? "true" : "false"));
    });
    const v372 = normalizeStoryboardScriptMediaMode(v369);
    [this["_imageModeBtn"], this["_videoModeBtn"]]["forEach"]((v373) => {
      if (!v373) return;
      const v374 = v373["dataset"]["mediaMode"] === v372;
      (v373["classList"]["toggle"]("is-active", v374),
        v373["setAttribute"]("aria-pressed", v374 ? "true" : "false"));
    });
  }
  ["_isStoryboardScriptGenerating"](v375 = null) {
    const v376 =
        appStore["getState"]?.()["nodes"]?.[this["nodeId"]] ||
        this["_data"] ||
        {},
      v377 =
        v375 ||
        createDefaultStoryboardScriptState(
          v376["storyboardScript"] || this["_data"]["storyboardScript"] || {},
        );
    return (
      this["_isGeneratingScript"] ||
      v376["isGenerating"] === true ||
      v377["isGenerating"] === true ||
      String(v377["jobStatus"] || v376["jobStatus"] || "") === "running"
    );
  }
  ["_syncGeneratingOverlay"](v378) {
    if (!this["_bodyEl"]) return;
    const v379 = v378 === true;
    (this["el"]?.["classList"]?.["toggle"](
      "is-storyboard-script-generating",
      v379,
    ),
      this["_bodyEl"]["classList"]["toggle"]("is-generating", v379),
      this["_bodyEl"]["setAttribute"]("aria-busy", v379 ? "true" : "false"));
    const v380 = this["_bodyEl"]["querySelector"](
      ".storyboard-script-loading-overlay",
    );
    if (!v379) {
      v380?.["remove"]();
      return;
    }
    if (v380) return;
    this["_bodyEl"]["appendChild"](createStoryboardScriptLoadingOverlay());
  }
  ["_setStoryboardGeneratingState"](v381, v382 = {}) {
    const v383 = this["_getScriptState"](),
      v384 = {
        ...v383,
        ...v382,
        isGenerating: v381 === true,
        jobStatus: v381 === true ? "running" : v382["jobStatus"] || "",
        updatedAt: Date["now"](),
      };
    ((this["_data"] = { ...this["_data"], storyboardScript: v384 }),
      appStore["updateNodeData"](this["nodeId"], { storyboardScript: v384 }));
  }
  ["_showStoryboardLoadingOverlayImmediately"]() {
    if (this["_isGeneratingScript"]) return;
    const v385 = this["_getScriptState"]();
    if (v385["selectionMode"] === true) return;
    ((this["_isGeneratingScript"] = true),
      (this["_isPromptGenerateLoadingPrimed"] = true),
      this["_setStoryboardGeneratingState"](true),
      this["_syncGeneratingOverlay"](true));
  }
  ["_bindPromptGenerateImmediateLoading"]() {
    const v386 = this["btnEl"];
    if (!(v386 instanceof HTMLElement)) return;
    v386["addEventListener"](
      "click",
      () => {
        if (v386["disabled"]) return;
        this["_showStoryboardLoadingOverlayImmediately"]();
      },
      { capture: true },
    );
  }
  ["_getEffectiveSubmitPromptText"]() {
    return this["_getStoryboardSubmitInput"]()["promptText"];
  }
  ["_getStoryboardSubmitInput"]() {
    const v387 = appStore["getState"](),
      v388 = v387["nodes"] || {},
      v389 = v388?.[this["nodeId"]] || this["_data"] || {},
      v390 = appStore["getIncomingEdges"](this["nodeId"]),
      v391 = collectDirectStoryboardImageRefs(v390, v388),
      v392 = collectDirectStoryboardVideoRefs(v390, v388),
      v393 = [],
      v394 = { image: v391["length"], video: v392["length"], audio: 0 },
      v395 = resolvePromptTextWithTextRefs({
        promptEl: this["promptEl"],
        inEdges: v390,
        nodes: v388,
        assetInputRefs: v393,
        assetMediaCounts: v394,
        allowedAssetTypes: ["text", "image", "video"],
      })["trim"](),
      v396 = getPromptAssetInputRefsFromNode(v389, {
        allowedTypes: ["image", "video"],
      }),
      v397 = normalizeStoryboardImageInputRefs({
        directImageRefs: v391,
        promptAssetRefs: v393,
        hiddenAssetRefs: v396,
      }),
      v398 = normalizeStoryboardVideoInputRefs({
        directVideoRefs: v392,
        promptAssetRefs: v393,
        hiddenAssetRefs: v396,
      }),
      v399 = v397["map"]((v400) => v400["url"])["filter"](Boolean),
      v401 = v398["map"]((v402) => v402["url"])["filter"](Boolean),
      v403 =
        v399["length"] > 0 && v401["length"] > 0
          ? "multimodal"
          : v401["length"] > 0
            ? "video"
            : v399["length"] > 0
              ? "image"
              : "text";
    return {
      promptText: v395,
      imageRefs: v397,
      videoRefs: v398,
      imageLabels: v397["map"]((v404) => v404["label"]),
      videoLabels: v398["map"]((v405) => v405["label"]),
      inputUrls: [...v399, ...v401],
      inputImageUrls: v399,
      inputVideoUrls: v401,
      sourceMode: v403,
    };
  }
  ["_updateSubmitButtonState"]() {
    if (!this["btnEl"]) return;
    const v406 =
        appStore["getState"]?.()["nodes"]?.[this["nodeId"]] ||
        this["_data"] ||
        {},
      v407 = createDefaultStoryboardScriptState(
        v406["storyboardScript"] || this["_data"]["storyboardScript"] || {},
      ),
      v408 = resolveGenerationButtonMode(
        {
          ...v406,
          isGenerating:
            this["_isGeneratingScript"] ||
            v406["isGenerating"] === true ||
            v407["isGenerating"] === true,
          jobStatus: v407["jobStatus"] || v406["jobStatus"] || "",
        },
        { cancellable: v406["taskCancellable"] === true },
      ),
      v409 = this["_getStoryboardSubmitInput"](),
      v410 = v409["promptText"],
      v411 = v407["rows"]["length"] > 0 && v407["selectionMode"] === true,
      v412 = v411 ? STORYBOARD_SELECTED_GENERATE_LABEL : "生成",
      v413 = getSelectedRowIndexes(v407)["length"],
      v414 = v411
        ? v413 > 0
        : Boolean(
            v410 ||
            v409["inputImageUrls"]["length"] > 0 ||
            v409["inputVideoUrls"]["length"] > 0,
          );
    this["_syncGeneratingOverlay"](v408["busy"]);
    this["_queueBtn"] &&
      ((this["_queueBtn"]["hidden"] = !v411),
      (this["_queueBtn"]["disabled"] = !v411 || v413 === 0 || v408["busy"]),
      (this["_queueBtn"]["style"]["cursor"] = this["_queueBtn"]["disabled"]
        ? "var(--unavailable-cursor)"
        : ""));
    this["_syncToolbarButtonState"]({
      canGenerate:
        v407["rows"]["length"] > 0 && !v408["busy"] && !v408["disabled"],
      canDownload: Array["isArray"](v407["rows"]) && v407["rows"]["length"] > 0,
    });
    if (v408["busy"]) {
      (setGenerateButtonLoadingUi(this["btnEl"], {
        title: v412,
        disabled: v408["disabled"],
        ariaLabel: v412,
      }),
        (this["btnEl"]["disabled"] = v408["disabled"]),
        (this["btnEl"]["style"]["cursor"] = v408["cursor"]));
      return;
    }
    (resetGenerateButtonIdleUi(this["btnEl"], v412),
      !v414
        ? ((this["btnEl"]["disabled"] = true),
          (this["btnEl"]["style"]["cursor"] = "var(--unavailable-cursor)"))
        : ((this["btnEl"]["disabled"] = false),
          (this["btnEl"]["style"]["cursor"] = "")));
  }
  ["_syncToolbarButtonState"]({
    canGenerate: v415,
    canDownload: v416,
    canFullscreen: v417,
  } = {}) {
    this["_toolbarGenerateBtn"] &&
      ((this["_toolbarGenerateBtn"]["disabled"] = v415 !== true),
      (this["_toolbarGenerateBtn"]["style"]["cursor"] =
        v415 === true ? "" : "var(--unavailable-cursor)"));
    if (this["_toolbarFullscreenBtn"]) {
      const v418 = (v417 ?? v416) === true;
      ((this["_toolbarFullscreenBtn"]["disabled"] = !v418),
        (this["_toolbarFullscreenBtn"]["style"]["cursor"] = v418
          ? ""
          : "var(--unavailable-cursor)"));
    }
    this["_toolbarDownloadBtn"] &&
      ((this["_toolbarDownloadBtn"]["disabled"] = v416 !== true),
      (this["_toolbarDownloadBtn"]["style"]["cursor"] =
        v416 === true ? "" : "var(--unavailable-cursor)"));
  }
  ["_syncGenerateButtonState"]() {
    this["_updateSubmitButtonState"]();
  }
  ["_createFullscreenCloseButton"]() {
    const v419 = document["createElement"]("button");
    return (
      (v419["type"] = "button"),
      (v419["className"] = "storyboard-script-fullscreen-close"),
      v419["setAttribute"]("aria-label", "关闭全屏显示"),
      (v419["innerHTML"] =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'),
      v419["addEventListener"]("click", (v420) => {
        (v420["stopPropagation"](), this["_closeFullscreenScript"]());
      }),
      v419
    );
  }
  ["_openFullscreenScript"]() {
    this["_finishCellEdit"]({ commit: true });
    const v421 = this["_getScriptState"]();
    if (!Array["isArray"](v421["rows"]) || v421["rows"]["length"] === 0) {
      window["showToast"]?.("暂无可全屏显示的分镜脚本", "warn");
      return;
    }
    if (this["_fullscreenOverlayEl"]) {
      (this["_renderFullscreenContent"](v421),
        this["_fullscreenOverlayEl"]
          ["querySelector"](".storyboard-script-fullscreen-close")
          ?.["focus"]?.({ preventScroll: true }));
      return;
    }
    const v422 = document["createElement"]("div");
    ((v422["className"] = "storyboard-script-fullscreen-overlay"),
      v422["setAttribute"]("role", "dialog"),
      v422["setAttribute"]("aria-modal", "true"),
      v422["setAttribute"]("aria-label", "分镜脚本全屏显示"));
    const v423 = document["createElement"]("section");
    ((v423["className"] = "storyboard-script-fullscreen-panel"),
      v423["addEventListener"]("pointerdown", (v424) => {
        v424["stopPropagation"]();
      }),
      v423["addEventListener"]("dblclick", (v425) => {
        v425["stopPropagation"]();
      }));
    const v426 = document["createElement"]("header");
    v426["className"] = "storyboard-script-fullscreen-header";
    const v427 = document["createElement"]("div");
    v427["className"] = "storyboard-script-fullscreen-title-wrap";
    const v428 = document["createElement"]("div");
    ((v428["className"] = "storyboard-script-fullscreen-title"),
      (v428["textContent"] =
        v421["title"] ||
        this["_data"]["name"] ||
        STORYBOARD_SCRIPT_DEFAULT_NAME));
    const v429 = document["createElement"]("div");
    ((v429["className"] = "storyboard-script-fullscreen-meta"),
      v427["appendChild"](v428),
      v427["appendChild"](v429),
      v426["appendChild"](v427),
      v426["appendChild"](this["_createFullscreenCloseButton"]()));
    const v430 = document["createElement"]("div");
    ((v430["className"] = "storyboard-script-fullscreen-body"),
      this["_bindFullscreenBodyInteractions"](v430),
      v423["appendChild"](v426),
      v423["appendChild"](v430),
      v422["appendChild"](v423),
      v422["addEventListener"]("pointerdown", (v431) => {
        v431["stopPropagation"]();
        if (v431["target"] === v422) this["_closeFullscreenScript"]();
      }),
      (this["_onFullscreenKeydown"] = (v432) => {
        if (v432["key"] !== "Escape") return;
        (v432["preventDefault"](),
          v432["stopPropagation"](),
          this["_closeFullscreenScript"]());
      }),
      document["addEventListener"](
        "keydown",
        this["_onFullscreenKeydown"],
        true,
      ),
      document["body"]["appendChild"](v422),
      (this["_fullscreenOverlayEl"] = v422),
      this["_renderFullscreenContent"](v421),
      v422["querySelector"](".storyboard-script-fullscreen-close")?.["focus"]?.(
        { preventScroll: true },
      ));
  }
  ["_closeFullscreenScript"]() {
    (this["_finishCellEdit"]({ commit: true }),
      this["_onFullscreenKeydown"] &&
        (document["removeEventListener"](
          "keydown",
          this["_onFullscreenKeydown"],
          true,
        ),
        (this["_onFullscreenKeydown"] = null)),
      this["_fullscreenOverlayEl"]?.["remove"](),
      (this["_fullscreenOverlayEl"] = null));
  }
  ["_bindFullscreenBodyInteractions"](v433) {
    if (!(v433 instanceof HTMLElement)) return;
    (v433["addEventListener"](
      "wheel",
      (v434) => {
        v434["stopPropagation"]();
      },
      { passive: false },
    ),
      v433["addEventListener"](
        "pointerdown",
        (v435) => {
          const v436 =
              v435["target"] instanceof Element
                ? v435["target"]
                : v435["target"]?.["parentElement"],
            v437 = v436?.["closest"]?.("[data-storyboard-edit-key]");
          if (!v437 || !v433["contains"](v437)) return;
          this["_beginCellEdit"](v437, { focus: false, selectAll: false });
        },
        { capture: true },
      ),
      v433["addEventListener"]("pointerdown", (v438) => {
        v438["stopPropagation"]();
      }),
      v433["addEventListener"]("dblclick", (v439) => {
        const v440 =
            v439["target"] instanceof Element
              ? v439["target"]
              : v439["target"]?.["parentElement"],
          v441 = v440?.["closest"]?.("[data-storyboard-edit-key]");
        (v439["preventDefault"](), v439["stopPropagation"]());
        if (!v441 || !v433["contains"](v441)) return;
        this["_beginCellEdit"](v441);
      }));
  }
  ["_renderFullscreenContent"](v442 = this["_getScriptState"](), v443 = null) {
    if (!this["_fullscreenOverlayEl"]) return;
    const v444 = this["_fullscreenOverlayEl"]["querySelector"](
      ".storyboard-script-fullscreen-body",
    );
    if (!(v444 instanceof HTMLElement)) return;
    const v445 = Array["isArray"](v442["rows"]) ? v442["rows"] : [],
      v446 = v444["querySelector"](
        ".storyboard-script-table-wrap, .storyboard-script-card-grid",
      ),
      v447 = v446
        ? { left: v446["scrollLeft"] || 0, top: v446["scrollTop"] || 0 }
        : null,
      v448 =
        v443 ||
        mergeStoryboardImageRefs(
          this["_getStoryboardSubmitInput"]()["imageRefs"],
          v442["referenceImageRefs"],
        ),
      v449 = this["_fullscreenOverlayEl"]["querySelector"](
        ".storyboard-script-fullscreen-title",
      );
    v449 &&
      (v449["textContent"] =
        v442["title"] ||
        this["_data"]["name"] ||
        STORYBOARD_SCRIPT_DEFAULT_NAME);
    const v450 = this["_fullscreenOverlayEl"]["querySelector"](
      ".storyboard-script-fullscreen-meta",
    );
    if (v450) {
      const v451 =
          normalizeStoryboardScriptViewMode(v442["viewMode"]) === "card"
            ? "卡片视图"
            : "列表视图",
        v452 =
          normalizeStoryboardScriptMediaMode(v442["mediaMode"]) === "video"
            ? "视频提示词"
            : "图像提示词";
      v450["textContent"] =
        v445["length"] + "\x20个分镜\x20·\x20" + v452 + " · " + v451;
    }
    v444["replaceChildren"]();
    if (v445["length"] === 0) {
      v444["appendChild"](this["_createEmptyState"]());
      return;
    }
    const v453 = buildStoryboardImageRefMap(v448),
      v454 =
        normalizeStoryboardScriptViewMode(v442["viewMode"]) === "card"
          ? this["_createCardView"](
              v445,
              getStoryboardCardFieldsForMediaMode(v442["mediaMode"]),
              v453,
            )
          : this["_createListView"](
              v445,
              getStoryboardColumnsForMediaMode(v442["mediaMode"]),
              v453,
              { selectionMode: false },
            );
    (v454["classList"]["add"]("storyboard-script-fullscreen-scroller"),
      v444["appendChild"](v454));
    if (v447) {
      const v455 = () => {
        ((v454["scrollLeft"] = Math["max"](0, v447["left"])),
          (v454["scrollTop"] = Math["max"](0, v447["top"])));
      };
      (v455(),
        typeof window !== "undefined" &&
          typeof window["requestAnimationFrame"] === "function" &&
          window["requestAnimationFrame"](v455));
    }
  }
  ["_renderRefBar"]() {
    _renderSharedRefBar(this);
  }
  ["_bindBodyInteractions"]() {
    if (!this["_bodyEl"]) return;
    (this["_bodyEl"]["addEventListener"](
      "wheel",
      (v456) => {
        v456["stopPropagation"]();
      },
      { passive: false },
    ),
      this["_bodyEl"]["addEventListener"](
        "pointerdown",
        (v457) => {
          const v458 = this["_getScriptState"]();
          if (v458["selectionMode"] !== true) return;
          const v459 =
              v457["target"] instanceof Element
                ? v457["target"]
                : v457["target"]?.["parentElement"],
            v460 = v459?.["closest"]?.("[data-storyboard-edit-key]");
          if (!v460 || !this["_bodyEl"]["contains"](v460)) return;
          this["_beginCellEdit"](v460, { focus: false, selectAll: false });
        },
        { capture: true },
      ),
      this["_bodyEl"]["addEventListener"]("pointerdown", (v461) => {
        const v462 = this["_getScriptState"]();
        if (v462["selectionMode"] !== true) return;
        v461["stopPropagation"]();
      }),
      this["_bodyEl"]["addEventListener"]("dblclick", (v463) => {
        const v464 =
            v463["target"] instanceof Element
              ? v463["target"]
              : v463["target"]?.["parentElement"],
          v465 = v464?.["closest"]?.("[data-storyboard-edit-key]");
        (v463["preventDefault"](), v463["stopPropagation"]());
        const v466 = this["_getScriptState"]();
        if (v466["selectionMode"] !== true) {
          this["_enterSelectionMode"]();
          return;
        }
        if (!v465 || !this["_bodyEl"]["contains"](v465)) return;
        this["_beginCellEdit"](v465);
      }));
  }
  ["_beginCellEdit"](
    v467,
    { focus: focus = true, selectAll: selectAll = true } = {},
  ) {
    if (!(v467 instanceof HTMLElement)) return;
    if (this["_activeCellEdit"]?.["target"] === v467) return;
    this["_finishCellEdit"]({ commit: true });
    const v468 = Number(v467["dataset"]["storyboardRowIndex"]),
      v469 = String(v467["dataset"]["storyboardEditKey"] || "");
    if (!Number["isInteger"](v468) || v468 < 0 || !v469) return;
    const v470 =
        v467["dataset"]["storyboardRawValue"] ?? v467["textContent"] ?? "",
      v471 = (v472) => v472["stopPropagation"](),
      v473 = (v474) => v474["stopPropagation"](),
      v475 = (v476) => {
        v476["stopPropagation"]();
        if (v476["key"] === "Enter" && !v476["shiftKey"])
          (v476["preventDefault"](), this["_finishCellEdit"]({ commit: true }));
        else
          v476["key"] === "Escape" &&
            (v476["preventDefault"](),
            this["_finishCellEdit"]({ commit: false }));
      },
      v477 = () => this["_finishCellEdit"]({ commit: true }),
      v478 = () => {
        (v467["removeEventListener"]("pointerdown", v471),
          v467["removeEventListener"]("dblclick", v473),
          v467["removeEventListener"]("keydown", v475),
          v467["removeEventListener"]("blur", v477));
      };
    ((this["_activeCellEdit"] = {
      target: v467,
      rowIndex: v468,
      key: v469,
      originalText: v470,
      cleanup: v478,
    }),
      (v467["textContent"] = v470),
      v467["classList"]["remove"]("storyboard-script-image-cell"),
      v467["classList"]["add"]("is-editing"),
      (v467["contentEditable"] = "true"),
      (v467["spellcheck"] = false),
      v467["addEventListener"]("pointerdown", v471),
      v467["addEventListener"]("dblclick", v473),
      v467["addEventListener"]("keydown", v475),
      v467["addEventListener"]("blur", v477));
    focus && v467["focus"]({ preventScroll: true });
    const v479 = selectAll ? window["getSelection"]?.() : null;
    if (v479) {
      const v480 = document["createRange"]();
      (v480["selectNodeContents"](v467),
        v479["removeAllRanges"](),
        v479["addRange"](v480));
    }
  }
  ["_finishCellEdit"]({ commit: v481 }) {
    const v482 = this["_activeCellEdit"];
    if (!v482) return;
    ((this["_activeCellEdit"] = null),
      v482["cleanup"]?.(),
      v482["target"]["classList"]["remove"]("is-editing"),
      v482["target"]["removeAttribute"]("contenteditable"),
      (v482["target"]["spellcheck"] = false));
    if (!v481) {
      this["_restoreEditedCellDisplay"](
        v482["target"],
        v482["key"],
        v482["originalText"],
      );
      return;
    }
    const v483 = String(v482["target"]["textContent"] || "")
      ["replace"](/\u00a0/g, "\x20")
      ["trim"]();
    if (v483 !== v482["originalText"])
      (this["_restoreEditedCellDisplay"](v482["target"], v482["key"], v483),
        this["_updateCellValue"](v482["rowIndex"], v482["key"], v483));
    else
      (v482["key"] === "角色图" || v482["key"] === "参考") &&
        this["_restoreEditedCellDisplay"](
          v482["target"],
          v482["key"],
          v482["originalText"],
        );
  }
  ["_restoreEditedCellDisplay"](v484, v485, v486) {
    if (!(v484 instanceof HTMLElement)) return;
    const v487 = this["_getScriptState"](),
      v488 = this["_getStoryboardSubmitInput"](),
      v489 = buildStoryboardImageRefMap(
        mergeStoryboardImageRefs(v488["imageRefs"], v487["referenceImageRefs"]),
      );
    appendStoryboardCellDisplay(v484, v485, v486, v489);
  }
  ["_updateCellValue"](v490, v491, v492) {
    const v493 = this["_getScriptState"]();
    if (!Array["isArray"](v493["rows"]) || !v493["rows"][v490]) return;
    const v494 = v493["rows"]["map"]((v495, v496) =>
        v496 === v490 ? { ...v495, [v491]: v492 } : v495,
      ),
      v497 = serializeCanonicalStoryboardScriptJson({ ...v493, rows: v494 }),
      v498 = JSON["parse"](v497),
      v499 = {
        ...v493,
        rows: v494,
        canonicalJson: v497,
        title: v498["title"],
        detectedIntent: v498["detectedIntent"],
        updatedAt: Date["now"](),
      };
    ((this["_data"] = { ...this["_data"], storyboardScript: v499 }),
      (this["_skipNextStoryboardBodyRender"] = true),
      appStore["updateNodeData"](this["nodeId"], { storyboardScript: v499 }));
  }
  async ["_prepareStoryboardVideoFrames"]({
    submitInput: v500,
    promptText: v501,
    model: v502,
    provider: v503,
  }) {
    const v504 = Array["isArray"](v500?.["videoRefs"]) ? v500["videoRefs"] : [];
    if (v504["length"] === 0)
      return {
        frameRefs: [],
        frameBatches: [],
        frameSummary: "",
        visibleFrameRefs: [],
      };
    const v505 = extractRequestedStoryboardShotCount(v501, {
        max: STORYBOARD_VIDEO_FRAME_LIMIT,
      }),
      v506 = v505 || STORYBOARD_VIDEO_FRAME_LIMIT,
      v507 = Math["max"](1, Math["ceil"](v506 / v504["length"])),
      v508 = getStoryboardModelImageInputLimit(v502, v503),
      v509 = [];
    for (const v510 of v504) {
      if (v509["length"] >= v506) break;
      const v511 = v506 - v509["length"],
        v512 = Math["max"](1, Math["min"](v507, v511)),
        v513 = await extractStoryboardVideoFramesFromServer(v510["url"], {
          maxFrames: v512,
          exactCount: v505 > 0,
        }),
        v514 = Array["isArray"](v513["frames"]) ? v513["frames"] : [];
      for (const v515 of v514) {
        if (v509["length"] >= v506) break;
        const v516 = getStoryboardImagePlaceholder(v509["length"] + 1),
          v517 = String(v515["url"] || "")["trim"]();
        if (!v517) continue;
        const v518 = {
          ...v515,
          label: v516,
          url: v517,
          type: "image",
          source: "video-frame",
          videoLabel: v510["label"],
          videoUrl: v510["url"],
        };
        ((v518["timeRange"] = formatStoryboardVideoTimeRange(v518)),
          v509["push"](v518));
      }
    }
    const v519 = v509["map"]((v520, v521) => ({
      ...v520,
      sentAsImage: v521 < v508,
    }));
    return {
      frameRefs: v519,
      frameBatches: chunkStoryboardFrameRefs(v519, v508),
      frameSummary: buildStoryboardVideoFrameReferenceSummary(v519),
      visibleFrameRefs: v519,
    };
  }
  async ["_buildPayload"]() {
    const v522 = this["_getStoryboardSubmitInput"](),
      v523 = v522["promptText"],
      v524 = v522["inputImageUrls"]["length"] > 0,
      v525 = v522["inputVideoUrls"]["length"] > 0;
    if (!v523 && !v524 && !v525)
      return (
        window["showToast"]?.(
          "请输入剧情、文案或连接参考图片/视频后再生成分镜",
          "warn",
        ),
        null
      );
    const v526 = resolveStoryboardScriptTextModel(this["_data"]);
    let v527 = resolveStoryboardScriptTextProvider(this["_data"]);
    getCustomTextModels()["includes"](v526) && (v527 = "custom");
      v528 = v522["sourceMode"],
      v529 =
        v528 === "video"
          ? await this["_prepareStoryboardVideoFrames"]({
              submitInput: v522,
              promptText: v523,
              model: v526,
              provider: v527,
            })
          : {
              frameRefs: [],
              frameBatches: [],
              frameSummary: "",
              visibleFrameRefs: [],
            },
      v530 =
        v523 ||
        buildStoryboardReferenceSummary({
          imageLabels: v522["imageLabels"],
          videoLabels: v522["videoLabels"],
        }),
      v531 = buildStoryboardReferenceSummary({
        imageLabels: v522["imageLabels"],
        videoLabels: v522["videoLabels"],
      });
    let v532 = buildStoryboardScriptTextOnlyPrompt(v523),
      v533 = buildStoryboardScriptTextOnlySystemPrompt();
    if (v528 === "image")
      ((v532 = buildStoryboardScriptImagePrompt(v523, {
        imageCount: v522["inputImageUrls"]["length"],
        imageLabels: v522["imageLabels"],
      })),
        (v533 = buildStoryboardScriptImageSystemPrompt()));
    else {
      if (v528 === "video")
        ((v532 = buildStoryboardScriptVideoPrompt(v523, {
          videoCount: v522["inputVideoUrls"]["length"],
          videoLabels: v522["videoLabels"],
          videoFrameSummary: v529["frameSummary"],
        })),
          (v533 = buildStoryboardScriptVideoSystemPrompt()));
      else
        v528 === "multimodal" &&
          ((v532 = buildStoryboardScriptPrompt(v523, {
            summary: v531,
            imageCount: v522["inputImageUrls"]["length"],
            imageLabels: v522["imageLabels"],
            videoCount: v522["inputVideoUrls"]["length"],
            videoLabels: v522["videoLabels"],
          })),
          (v533 = ""));
    }
    return {
      prompt: v532,
      systemPrompt: v533,
      storyboardPrompt: v530,
      sourceMode: v528,
      inputUrls:
        v528 === "video"
          ? [
              ...v529["visibleFrameRefs"]
                ["filter"]((v534) => v534["sentAsImage"] !== false)
                ["map"]((v535) => v535["url"])
                ["filter"](Boolean),
              ...v522["inputVideoUrls"],
            ]
          : v522["inputUrls"],
      inputImageUrls:
        v528 === "video"
          ? v529["visibleFrameRefs"]
              ["filter"]((v536) => v536["sentAsImage"] !== false)
              ["map"]((v537) => v537["url"])
              ["filter"](Boolean)
          : v522["inputImageUrls"],
      inputVideoUrls: v522["inputVideoUrls"],
      videoLabels: v522["videoLabels"],
      videoFrameRefs: v529["visibleFrameRefs"],
      videoFrameBatches: v529["frameBatches"],
      referenceImageRefs: v529["visibleFrameRefs"],
      rawPromptText: v523,
      model: v526,
      provider: v527,
      nodeId: this["nodeId"],
    };
  }
  ["_createImageNodesFromSelectedStoryboards"]({
    startGeneration: startGeneration = false,
  } = {}) {
    this["_finishCellEdit"]({ commit: true });
    const v538 =
        appStore["getState"]?.()["nodes"]?.[this["nodeId"]] ||
        this["_data"] ||
        {},
      v539 = createDefaultStoryboardScriptState(
        v538["storyboardScript"] || this["_data"]["storyboardScript"] || {},
      ),
      v540 = serializeCanonicalStoryboardScriptJson(v539),
      v541 = JSON["parse"](v540),
      v542 = getSelectedRowIndexes(v539);
    if (v539["selectionMode"] !== true) return false;
    if (v542["length"] === 0)
      return (window["showToast"]?.("请先勾选要生成的分镜", "warn"), true);
    const v543 = v542["map"]((v544) => {
        const v545 = v539["rows"][v544] || {};
        return {
          rowIndex: v544,
          shotNo: getStoryboardRowShotNo(v545, v544),
          prompt: getStoryboardRowImagePrompt(v545),
        };
      }),
      v546 = v543["filter"]((v547) => !v547["prompt"]);
    if (v546["length"] > 0)
      return (
        window["showToast"]?.(
          "选中的分镜缺少图片提示词，请补齐后再生成",
          "warn",
        ),
        true
      );
    const v548 = v539["imageModel"] || DEFAULT_IMAGE_NODE_MODEL,
      v549 = v539["imageProvider"] || DEFAULT_IMAGE_NODE_PROVIDER,
      v549a = {
        ...v538,
        model: v548,
        provider: v549,
      },
      v549b = isComfyuiEngine(v549a),
      v549c = v549b
        ? String(
            v538["comfyWorkflow"] || parseComfyuiModelId(v548) || "",
          )["trim"]()
        : "",
      v550 = resolveStoryboardScriptTextModel({ storyboardScript: v539 }),
      v551 = resolveStoryboardScriptTextProvider({ storyboardScript: v539 }),
      v552 = clonePlainObject(v538["generationParams"]),
      v553 = clonePlainObject(v538["generationParamsByModel"]),
      v554 = v552?.["aspectRatio"] || v538["aspectRatio"] || "自适应",
      v555 = v552?.["imageSize"] || v538["imageSize"] || "",
      v556 = getImageNodeSizeForAspectRatio(v554),
      v557 = getStateSnapshot(),
      v558 = createBatchSpawnLayoutNearNode({
        nodes: v557["nodes"] || {},
        anchorNode: v538,
        itemCount: v543["length"],
        itemWidth: v556["width"],
        itemHeight: v556["height"],
        maxPerLine: 5,
        padding: STORYBOARD_IMAGE_BATCH_PADDING,
        titleHeight: STORYBOARD_IMAGE_BATCH_TITLE_HEIGHT,
      }),
      v559 = generateId("group");
    appStore["addNode"]({
      id: v559,
      type: "group",
      x: v558["groupX"],
      y: v558["groupY"],
      width: v558["groupWidth"],
      height: v558["groupHeight"],
      name: STORYBOARD_IMAGE_BATCH_GROUP_NAME,
      label: STORYBOARD_IMAGE_BATCH_GROUP_NAME,
    });
    const v560 = [];
    (v543["forEach"]((v561, v562) => {
      const v563 = v558["getItemPosition"](v562),
        v564 = generateId("ai-image"),
        v565 = {
          id: v564,
          type: "ai-image",
          x: v563["x"],
          y: v563["y"],
          width: v556["width"],
          height: v556["height"],
          name: v561["shotNo"]
            ? "分镜\x20" + v561["shotNo"]
            : "分镜 " + (v562 + 1),
          prompt: escapePromptTextForHtml(v561["prompt"]),
          model: v549b ? toComfyuiModelId(v549c) : v548,
          provider: v549,
          aspectRatio: v554,
          needsAutoResize: true,
          storyboardSource: {
            nodeId: this["nodeId"],
            rowIndex: v561["rowIndex"],
            shotNo: v561["shotNo"],
          },
        };
      if (v549b) {
        v565["imageEngine"] = "comfyui";
        v565["comfyWorkflow"] = v549c;
        if (v538["comfyWorkflowTitle"])
          v565["comfyWorkflowTitle"] = v538["comfyWorkflowTitle"];
        if (
          v538["comfyParams"] &&
          typeof v538["comfyParams"] === "object" &&
          !Array["isArray"](v538["comfyParams"])
        )
          v565["comfyParams"] = clonePlainObject(v538["comfyParams"]);
      }
      v552 && (v565["generationParams"] = clonePlainObject(v552));
      v553 && (v565["generationParamsByModel"] = clonePlainObject(v553));
      if (v555) v565["imageSize"] = v555;
      (appStore["addNode"](v565), v560["push"](v564));
    }),
      appStore["groupNodes"](v560, v559));
    const v566 = {
      ...v539,
      canonicalJson: v540,
      title: v541["title"],
      detectedIntent: v541["detectedIntent"],
      selectionMode: false,
      selectedRowIndexes: [],
      updatedAt: Date["now"](),
    };
    return (
      (this["_data"] = {
        ...this["_data"],
        model: v550,
        provider: v551,
        storyboardScript: v566,
      }),
      appStore["updateNodeData"](this["nodeId"], {
        model: v550,
        provider: v551,
        storyboardScript: v566,
      }),
      commit(),
      startGeneration
        ? this["_startGeneratedImageNodes"](v560, {
            onStarted: () => focusStoryboardImageBatch(this["nodeId"], v559),
          })
        : focusStoryboardImageBatch(this["nodeId"], v559),
      window["showToast"]?.(
        startGeneration
          ? "已创建并开始生成 " + v560["length"] + " 个图像节点"
          : "已创建 " + v560["length"] + " 个图像生成节点",
        "success",
      ),
      true
    );
  }
  ["_startGeneratedImageNodes"](
    v567 = [],
    { onStarted: onStarted = null } = {},
  ) {
    const v568 = Array["isArray"](v567)
      ? v567["map"]((v569) => String(v569 || "")["trim"]())["filter"](Boolean)
      : [];
    if (v568["length"] === 0 || typeof window === "undefined") return;
    const v570 = new Set(v568),
      v571 = "storyboard-script:" + this["nodeId"] + ":auto-generate",
      v572 = () => window["v2Renderer"] || null,
      v573 = (v574) => {
        typeof window["requestAnimationFrame"] === "function"
          ? window["requestAnimationFrame"](v574)
          : window["setTimeout"](v574, 16);
      };
    v572()?.["pinNode"] &&
      v568["forEach"]((v575) => v572()?.["pinNode"]?.(v575, v571));
    let v576 = 0;
    const v577 = 30;
    let v578 = false;
    const v579 = () => {
        if (v578) return;
        v578 = true;
        if (typeof onStarted !== "function") return;
        try {
          onStarted();
        } catch (v580) {
          console["warn"](
            "[StoryboardScriptNode] post-start callback failed",
            v580,
          );
        }
      },
      v581 = () => {
        v576 += 1;
        const v582 = v572();
        v582?.["flushNodes"]?.([...v570]);
        for (const v583 of Array["from"](v570)) {
          const v584 = v582?.["nodeInstances"]?.["get"]?.(v583);
          if (!v584 || typeof v584["_onGenerate"] !== "function") continue;
          (v570["delete"](v583),
            Promise["resolve"]()
              ["then"](() => v584["_onGenerate"]())
              ["catch"]((v585) => {
                console["error"](
                  "[StoryboardScriptNode] auto image generation failed",
                  v585,
                );
              })
              ["finally"](() => {
                v572()?.["unpinNode"]?.(v583, v571);
              }));
        }
        if (v570["size"] === 0) {
          v579();
          return;
        }
        if (v570["size"] > 0 && v576 < v577) {
          v573(v581);
          return;
        }
        (v570["size"] > 0 &&
          (v570["forEach"]((v586) => {
            v572()?.["unpinNode"]?.(v586, v571);
          }),
          window["showToast"]?.(
            "部分图像节点已创建，但未能自动开始生成",
            "warn",
          )),
          v579());
      };
    v573(v581);
  }
  async ["_onGenerate"]() {
    const v587 = this["_isPromptGenerateLoadingPrimed"] === true;
    if (this["_isGeneratingScript"] && !v587) return;
    this["_isPromptGenerateLoadingPrimed"] = false;
    const v588 = this["_getScriptState"]();
    if (v588["selectionMode"] === true) {
      ((this["_isGeneratingScript"] = false),
        this["_syncGeneratingOverlay"](false),
        this["_createImageNodesFromSelectedStoryboards"]({
          startGeneration: true,
        }));
      return;
    }
    this["_isGeneratingScript"] = true;
    !v587 && this["_setStoryboardGeneratingState"](true);
    (this["_syncGeneratingOverlay"](true),
      await waitForStoryboardLoadingPaint(),
      this["_updateSubmitButtonState"]());
    let v589 = null;
    try {
      v589 = await this["_buildPayload"]();
    } catch (v590) {
      ((this["_isGeneratingScript"] = false),
        this["_setStoryboardGeneratingState"](false),
        this["_updateSubmitButtonState"](),
        window["showToast"]?.(
          v590?.["message"] || "视频分镜预处理失败",
          "error",
        ));
      return;
    }
    if (!v589) {
      ((this["_isGeneratingScript"] = false),
        this["_setStoryboardGeneratingState"](false),
        this["_updateSubmitButtonState"]());
      return;
    }
    const v591 = Date["now"](),
      v592 = this["_getScriptState"](),
      v593 = resolveModelManifest(v589["model"], v589["provider"]);
    try {
      const v594 = await submitTask(
        {
          sourceNodeId: this["nodeId"],
          targetNodeId: this["nodeId"],
          trigger: "node",
          taskType: "storyboard-script-generation",
          provider: v589["provider"],
          adapterType: "modelApi",
          modelId: v589["model"],
          executionId:
            v593?.["executionId"] ||
            "storyboard-script." + v589["provider"] + "." + v589["model"],
          payload: v589,
          cancellable: false,
          resumable: false,
          async: false,
          submit: () => runStoryboardScriptGenerationPayload(v589),
          startBuilder: () => ({
            model: v589["model"],
            provider: v589["provider"],
            storyboardScript: buildStoryboardScriptStatePatch({
              current: v592,
              prompt: v589["storyboardPrompt"],
              model: v589["model"],
              provider: v589["provider"],
              sourceMode: v589["sourceMode"],
              status: "running",
              referenceImageRefs: v589["referenceImageRefs"],
            }),
          }),
          resultBuilder: async (v595) => {
            const v596 = extractGeneratedText(v595)["trim"](),
              v597 = normalizeStoryboardScriptGenerationResult(v596, {
                requireMarker: true,
                sourceMode: v589["sourceMode"],
              });
            if (!v597["ok"])
              throw new Error("模型未返回合法分镜 JSON，请重试或切换火山模型");
            return {
              name:
                v597["title"] ||
                this["_data"]["name"] ||
                STORYBOARD_SCRIPT_DEFAULT_NAME,
              model: v589["model"],
              provider: v589["provider"],
              storyboardScript: buildStoryboardScriptStatePatch({
                current: v592,
                prompt: v589["storyboardPrompt"],
                model: v589["model"],
                provider: v589["provider"],
                sourceMode: v589["sourceMode"],
                normalized: v597,
                status: "success",
                referenceImageRefs: v589["referenceImageRefs"],
              }),
            };
          },
          failureBuilder: (v598) => ({
            storyboardScript: buildStoryboardScriptStatePatch({
              current: v592,
              prompt: v589["storyboardPrompt"],
              model: v589["model"],
              provider: v589["provider"],
              sourceMode: v589["sourceMode"],
              status: "error",
              error: v598?.["message"] || "分镜脚本生成失败",
              referenceImageRefs: v589["referenceImageRefs"],
            }),
          }),
          parseError: (v599) => v599?.["message"] || "分镜脚本生成失败",
        },
        { store: appStore, startedAt: v591 },
      );
      v594["status"] === "failed" &&
        window["showToast"]?.(
          v594["error"]?.["message"] || "分镜脚本生成失败",
          "error",
        );
    } finally {
      ((this["_isGeneratingScript"] = false),
        this["_updateSubmitButtonState"]());
    }
  }
  ["_downloadScriptTable"]() {
    this["_finishCellEdit"]({ commit: true });
    const v600 = this["_getScriptState"]();
    if (!Array["isArray"](v600["rows"]) || v600["rows"]["length"] === 0) {
      window["showToast"]?.("暂无可下载的分镜脚本", "warn");
      return;
    }
    const v601 = serializeCanonicalStoryboardScriptJson(v600),
      v602 = JSON["parse"](v601),
      v603 = {
        ...v600,
        canonicalJson: v601,
        title: v602["title"],
        detectedIntent: v602["detectedIntent"],
        updatedAt: Date["now"](),
      };
    ((this["_data"] = { ...this["_data"], storyboardScript: v603 }),
      appStore["updateNodeData"](this["nodeId"], { storyboardScript: v603 }));
    const v604 = serializeStoryboardScriptRowsToCsv(v603["rows"]),
      v605 = sanitizeExportFileName(
        v603["title"] ||
          this["_data"]["name"] ||
          STORYBOARD_SCRIPT_DEFAULT_NAME,
      );
    (downloadTextFile({
      filename: v605 + "_" + formatExportTimestamp() + ".csv",
      content: v604,
      mimeType: STORYBOARD_SCRIPT_TABLE_EXPORT_MIME,
    }),
      window["showToast"]?.("已下载分镜脚本表格", "success"));
  }
  ["_getStoryboardViewScrollKey"](v606, v607 = "") {
    const v608 = normalizeStoryboardScriptMediaMode(v606?.["mediaMode"]),
      v609 = normalizeStoryboardScriptViewMode(v607 || v606?.["viewMode"]);
    return v608 + ":" + v609;
  }
  ["_getCurrentStoryboardScroller"]() {
    return this["_bodyEl"]?.["querySelector"]?.(
      ".storyboard-script-table-wrap, .storyboard-script-card-grid",
    );
  }
  ["_rememberStoryboardViewScroll"](v610, v611, v612 = "") {
    if (!(v610 instanceof HTMLElement)) return;
    const v613 = this["_getStoryboardViewScrollKey"](v611, v612);
    this["_storyboardViewScrollByKey"]["set"](v613, {
      left: v610["scrollLeft"],
      top: v610["scrollTop"],
    });
  }
  ["_captureStoryboardViewScroll"](v614) {
    const v615 = this["_getCurrentStoryboardScroller"]();
    if (!(v615 instanceof HTMLElement)) return;
    const v616 = v615["classList"]["contains"]("storyboard-script-card-grid")
      ? "card"
      : "list";
    this["_rememberStoryboardViewScroll"](v615, v614, v616);
  }
  ["_bindStoryboardViewScrollMemory"](v617, v618) {
    if (!(v617 instanceof HTMLElement)) return;
    if (v617["dataset"]["storyboardScrollMemoryBound"] === "true") return;
    ((v617["dataset"]["storyboardScrollMemoryBound"] = "true"),
      v617["addEventListener"](
        "scroll",
        () => this["_rememberStoryboardViewScroll"](v617, v618),
        { passive: true },
      ));
  }
  ["_restoreStoryboardViewScroll"](v619, v620) {
    if (!(v619 instanceof HTMLElement)) return;
    const v621 = this["_getStoryboardViewScrollKey"](v620),
      v622 = this["_storyboardViewScrollByKey"]["get"](v621);
    if (!v622) return;
    const v623 = () => {
      const v624 = Math["max"](0, v619["scrollWidth"] - v619["clientWidth"]),
        v625 = Math["max"](0, v619["scrollHeight"] - v619["clientHeight"]);
      ((v619["scrollLeft"] = Math["min"](
        v624,
        Math["max"](0, v622["left"] || 0),
      )),
        (v619["scrollTop"] = Math["min"](
          v625,
          Math["max"](0, v622["top"] || 0),
        )));
    };
    (v623(),
      typeof window !== "undefined" &&
        typeof window["requestAnimationFrame"] === "function" &&
        window["requestAnimationFrame"](v623));
  }
  ["_render"]() {
    if (!this["_bodyEl"]) return;
    const v626 = this["_getScriptState"](),
      v627 = this["_isStoryboardScriptGenerating"](v626);
    (this["_captureStoryboardViewScroll"](v626),
      this["_syncModeButtons"](v626["viewMode"], v626["mediaMode"]),
      this["_syncSelectionModeUi"](v626),
      this["_updateSubmitButtonState"]());
    const v628 = this["_getStoryboardSubmitInput"](),
      v629 = mergeStoryboardImageRefs(
        v628["imageRefs"],
        v626["referenceImageRefs"],
      ),
      v630 = buildStoryboardBodyRenderSignature(v626, v629),
      v631 = this["_getCurrentStoryboardScroller"](),
      v632 =
        v631 instanceof HTMLElement &&
        (this["_storyboardBodyRenderSignature"] === v630 ||
          this["_skipNextStoryboardBodyRender"] === true);
    if (v632) {
      ((this["_storyboardBodyRenderSignature"] = v630),
        (this["_skipNextStoryboardBodyRender"] = false),
        this["_bindStoryboardViewScrollMemory"](v631, v626),
        this["_restoreStoryboardViewScroll"](v631, v626),
        this["_syncListSelectionState"](v626),
        this["_syncGeneratingOverlay"](v627),
        this["_renderFullscreenContent"](v626, v629));
      return;
    }
    ((this["_skipNextStoryboardBodyRender"] = false),
      (this["_storyboardBodyRenderSignature"] = v630),
      this["_bodyEl"]["replaceChildren"]());
    if (v626["rows"]["length"] === 0) {
      (this["_bodyEl"]["appendChild"](this["_createEmptyState"]()),
        this["_syncGeneratingOverlay"](v627),
        this["_renderFullscreenContent"](v626, v629));
      return;
    }
    const v633 = buildStoryboardImageRefMap(v629);
    let v634 = null;
    (v626["viewMode"] === "card"
      ? ((v634 = this["_createCardView"](
          v626["rows"],
          getStoryboardCardFieldsForMediaMode(v626["mediaMode"]),
          v633,
        )),
        this["_bodyEl"]["appendChild"](v634))
      : ((v634 = this["_createListView"](
          v626["rows"],
          getStoryboardColumnsForMediaMode(v626["mediaMode"]),
          v633,
        )),
        this["_bodyEl"]["appendChild"](v634)),
      this["_bindStoryboardViewScrollMemory"](v634, v626),
      this["_restoreStoryboardViewScroll"](v634, v626),
      this["_syncListSelectionState"](v626),
      this["_syncGeneratingOverlay"](v627),
      this["_renderFullscreenContent"](v626, v629));
  }
  ["_createEmptyState"]() {
    const v635 = document["createElement"]("div");
    v635["className"] = "storyboard-script-empty";
    const v636 = document["createElement"]("div");
    ((v636["className"] = "storyboard-script-empty-title"),
      (v636["textContent"] = "暂无分镜脚本数据"));
    const v637 = document["createElement"]("div");
    return (
      (v637["className"] = "storyboard-script-empty-hint"),
      (v637["textContent"] = "选中节点后，在提示词栏输入剧情或文案即可生成。"),
      v635["appendChild"](v636),
      v635["appendChild"](v637),
      v635
    );
  }
  ["_createListView"](
    v638,
    v639 = STORYBOARD_SCRIPT_COLUMNS,
    v640 = new Map(),
    { selectionMode: v641 = null } = {},
  ) {
    const v642 = document["createElement"]("div");
    v642["className"] = "storyboard-script-table-wrap custom-scrollbar";
    const v643 = this["_getScriptState"](),
      v644 = v641 == null ? v643["selectionMode"] === true : v641 === true,
      v645 = v644 ? getSelectedRowIndexes(v643) : [],
      v646 = new Set(v645),
      v647 = v638["length"] > 0 && v645["length"] === v638["length"],
      v648 = document["createElement"]("table");
    ((v648["className"] = "storyboard-script-table"),
      v648["classList"]["toggle"]("is-selection-mode", v644));
    const v649 = document["createElement"]("thead"),
      v650 = document["createElement"]("tr");
    if (v644) {
      const v651 = document["createElement"]("th");
      ((v651["scope"] = "col"),
        (v651["className"] =
          "storyboard-script-select-cell storyboard-script-select-cell--head"));
      const v652 = document["createElement"]("input");
      ((v652["type"] = "checkbox"),
        (v652["className"] =
          "storyboard-script-select-checkbox storyboard-script-select-all"),
        (v652["checked"] = v647),
        (v652["indeterminate"] = v645["length"] > 0 && !v647),
        v652["setAttribute"]("aria-label", "选择全部分镜"),
        v652["addEventListener"]("pointerdown", (v653) => {
          v653["stopPropagation"]();
        }),
        v652["addEventListener"]("click", (v654) => {
          (v654["stopPropagation"](),
            this["_setAllRowsSelected"](v652["checked"]));
        }),
        v651["appendChild"](v652),
        v650["appendChild"](v651));
    }
    (v639["forEach"]((v655) => {
      const v656 = document["createElement"]("th");
      ((v656["scope"] = "col"),
        (v656["dataset"]["storyboardColumnDensity"] =
          resolveStoryboardColumnDensity(v655["key"])),
        (v656["textContent"] = v655["label"]),
        v650["appendChild"](v656));
    }),
      v649["appendChild"](v650));
    const v657 = document["createElement"]("tbody");
    return (
      v638["forEach"]((v658, v659) => {
        const v660 = document["createElement"]("tr");
        v660["dataset"]["storyboardRowIndex"] = String(v659);
        if (v644) {
          const v661 = document["createElement"]("td");
          v661["className"] = "storyboard-script-select-cell";
          const v662 = document["createElement"]("input");
          ((v662["type"] = "checkbox"),
            (v662["className"] = "storyboard-script-select-checkbox"),
            (v662["checked"] = v646["has"](v659)),
            v662["setAttribute"](
              "aria-label",
              "选择第\x20" + (v659 + 1) + " 个分镜",
            ),
            v662["addEventListener"]("pointerdown", (v663) => {
              v663["stopPropagation"]();
            }),
            v662["addEventListener"]("click", (v664) => {
              (v664["stopPropagation"](),
                this["_toggleRowSelection"](v659, v662["checked"]));
            }),
            v661["appendChild"](v662),
            v660["appendChild"](v661));
        }
        (v639["forEach"]((v665) => {
          const v666 = document["createElement"]("td");
          ((v666["className"] = "storyboard-script-editable"),
            (v666["dataset"]["storyboardRowIndex"] = String(v659)),
            (v666["dataset"]["storyboardEditKey"] = v665["key"]),
            (v666["dataset"]["storyboardColumnDensity"] =
              resolveStoryboardColumnDensity(v665["key"])),
            appendStoryboardCellDisplay(
              v666,
              v665["key"],
              v658[v665["key"]],
              v640,
            ),
            v660["appendChild"](v666));
        }),
          v657["appendChild"](v660));
      }),
      v648["appendChild"](v649),
      v648["appendChild"](v657),
      v642["appendChild"](v648),
      v642
    );
  }
  ["_syncListSelectionState"](v667 = this["_getScriptState"]()) {
    const v668 = v667["selectionMode"] === true,
      v669 = v668 ? getSelectedRowIndexes(v667) : [],
      v670 = new Set(v669),
      v671 = this["_bodyEl"]?.["querySelector"]?.(".storyboard-script-table");
    if (!(v671 instanceof HTMLElement)) return;
    v671["classList"]["toggle"]("is-selection-mode", v668);
    const v672 =
        v668 &&
        Array["isArray"](v667["rows"]) &&
        v667["rows"]["length"] > 0 &&
        v669["length"] === v667["rows"]["length"],
      v673 = v671["querySelector"](".storyboard-script-select-all");
    (v673 instanceof HTMLInputElement &&
      ((v673["checked"] = v672),
      (v673["indeterminate"] = v668 && v669["length"] > 0 && !v672)),
      v671["querySelectorAll"]("tbody tr")["forEach"]((v674, v675) => {
        if (!(v674 instanceof HTMLElement)) return;
        const v676 = Number(v674["dataset"]["storyboardRowIndex"] || v675),
          v677 = v670["has"](v676),
          v678 = v674["querySelector"](".storyboard-script-select-checkbox");
        v678 instanceof HTMLInputElement && (v678["checked"] = v677);
      }));
  }
  ["_createCardView"](v679, v680 = CARD_FIELDS, v681 = new Map()) {
    const v682 = document["createElement"]("div");
    return (
      (v682["className"] = "storyboard-script-card-grid custom-scrollbar"),
      v679["forEach"]((v683, v684) => {
        const v685 = document["createElement"]("article");
        v685["className"] = "storyboard-script-card";
        const v686 = document["createElement"]("div");
        v686["className"] = "storyboard-script-card-head";
        const v687 = document["createElement"]("span");
        ((v687["className"] =
          "storyboard-script-shot storyboard-script-editable"),
          (v687["dataset"]["storyboardRowIndex"] = String(v684)),
          (v687["dataset"]["storyboardEditKey"] = "镜号"),
          (v687["textContent"] =
            formatCellValue(v683["镜号"]) || "镜头 " + String(v684 + 1)),
          v686["appendChild"](v687));
        const v688 = formatCellValue(v683["时长"]);
        if (v688) {
          const v689 = document["createElement"]("span");
          ((v689["className"] =
            "storyboard-script-duration storyboard-script-editable"),
            (v689["dataset"]["storyboardRowIndex"] = String(v684)),
            (v689["dataset"]["storyboardEditKey"] = "时长"),
            (v689["textContent"] = v688),
            v686["appendChild"](v689));
        }
        (v685["appendChild"](v686),
          v680["forEach"]((v690) => {
            const v691 = formatCellValue(v683[v690]);
            if (!v691) return;
            const v692 = document["createElement"]("div");
            v692["className"] = "storyboard-script-card-field";
            const v693 = document["createElement"]("span");
            ((v693["className"] = "storyboard-script-card-label"),
              (v693["textContent"] = v690));
            const v694 = document["createElement"]("span");
            ((v694["className"] =
              "storyboard-script-card-value storyboard-script-editable"),
              (v694["dataset"]["storyboardRowIndex"] = String(v684)),
              (v694["dataset"]["storyboardEditKey"] = v690),
              appendStoryboardCellDisplay(v694, v690, v691, v681),
              v692["appendChild"](v693),
              v692["appendChild"](v694),
              v685["appendChild"](v692));
          }),
          v682["appendChild"](v685));
      }),
      v682
    );
  }
  ["update"](v695) {
    this["_data"] = v695 || {};
    if (
      document["activeElement"] !== this["promptEl"] &&
      v695?.["prompt"] !== undefined
    ) {
      const v696 = sanitizePromptHtml(v695["prompt"] || "");
      this["promptEl"]?.["innerHTML"] !== v696 &&
        ((this["promptEl"]["innerHTML"] = v696), _rehydratePromptPills(this));
    }
    (this["_syncPromptBoxSizeFromData"]?.(v695),
      this["_renderRefBar"](),
      this["_render"]());
  }
  ["unmount"]() {
    (this["_closeFullscreenScript"](),
      this["_finishCellEdit"]({ commit: true }),
      this["_flushPromptHtmlCommit"]?.(),
      this["_unbindRefThumbHoverPreview"]?.(),
      (this["_unbindRefThumbHoverPreview"] = null),
      this["_unbindOutsideSelectionCancel"](),
      this["_unbindStoryboardImageModelTrigger"](),
      this["_removeStoryboardImageModelMenu"](),
      this["_storyboardImageSchemaCleanup"]?.(),
      (this["_storyboardImageSchemaCleanup"] = null),
      this["_sharedPanelCleanup"]?.());
  }
}
