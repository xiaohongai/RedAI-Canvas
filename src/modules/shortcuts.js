import {
  fetchUserShortcutsFromServer,
  saveUserShortcutsToServer,
} from "../../api/shortcutsApi.js";
const DEFAULT_PRESET_NAME = "默认预设",
  ASHUO_PRESET_NAME = "阿硕预设",
  CUSTOM_PRESET_NAME = "用户自定义";
export const DEFAULT_SHORTCUTS = {
  "zoom-in": { label: "放大", keys: ["Ctrl", "+"], group: "通用" },
  "zoom-out": { label: "缩小", keys: ["Ctrl", "-"], group: "通用" },
  "fit-all": { label: "聚焦节点/适应画布", keys: ["Ctrl", "0"], group: "通用" },
  minimap: { label: "小地图", keys: ["M"], group: "通用" },
  "pan-canvas": { label: "拖动画布（按住）", keys: ["Space"], group: "通用" },
  copy: { label: "复制节点", keys: ["Ctrl", "C"], group: "编辑与选择" },
  "copy-media": {
    label: "复制图像",
    keys: ["Ctrl", "Shift", "C"],
    group: "编辑与选择",
  },
  cut: { label: "剪切节点", keys: ["Ctrl", "X"], group: "编辑与选择" },
  "canvas-screenshot": {
    label: "画布截图",
    keys: ["Alt", "Q"],
    group: "编辑与选择",
  },
  "duplicate-with-edges": {
    label: "拖拽创建连线副本",
    keys: ["Alt"],
    group: "编辑与选择",
  },
  paste: { label: "粘贴节点", keys: ["Ctrl", "V"], group: "编辑与选择" },
  undo: { label: "撤销", keys: ["Ctrl", "Z"], group: "编辑与选择" },
  redo: { label: "重做", keys: ["Ctrl", "Y"], group: "编辑与选择" },
  delete: {
    label: "删除节点",
    keys: ["Delete"],
    alternateKeys: [["Delete"], ["Backspace"]],
    group: "编辑与选择",
  },
  "select-all": { label: "全选", keys: ["Ctrl", "A"], group: "编辑与选择" },
  "multi-select": {
    label: "多选节点（配合点击）",
    keys: ["Shift"],
    group: "编辑与选择",
  },
  group: { label: "编组", keys: ["Ctrl", "G"], group: "编辑与选择" },
  "align-feature": { label: "多选对齐功能", keys: ["Tab"], group: "通用" },
  "grid-dots": { label: "显示网格点", keys: ["G"], group: "设置开关" },
  "toggle-connection-lines": {
    label: "显示/隐藏连接线",
    keys: ["B"],
    group: "设置开关",
  },
  "toggle-selection-related-highlight": {
    label: "点击节点时高亮关联节点",
    keys: [],
    group: "设置开关",
  },
  "snap-guides": {
    label: "辅助线吸附",
    keys: ["Shift", ";"],
    group: "设置开关",
  },
  "snap-grid": {
    label: "网格吸附开关",
    keys: ["Shift", "G"],
    group: "设置开关",
  },
  "toggle-video-meta": { label: "视频节点信息", keys: [], group: "设置开关" },
  "toggle-title-follows-zoom": {
    label: "标题跟随画布缩放",
    keys: [],
    group: "设置开关",
  },
  "toggle-media-node-resize": {
    label: "图像视频节点缩放",
    keys: [],
    group: "设置开关",
  },
  "toggle-prompt-box-resize": {
    label: "允许提示词栏下拉",
    keys: [],
    group: "设置开关",
  },
  "toggle-node-avoid-overlap": {
    label: "新节点自动避让",
    keys: [],
    group: "设置开关",
  },
  "reset-media-size": {
    label: "恢复节点默认大小",
    keys: ["Shift", "R"],
    group: "编辑与选择",
  },
  "add-reference": { label: "添加参考", keys: ["X"], group: "编辑与选择" },
  "create-text": { label: "创建源文本节点", keys: ["T"], group: "创建节点" },
  "create-comment-note": {
    label: "创建注释节点",
    keys: ["N"],
    group: "创建节点",
  },
  "create-ai-text": {
    label: "创建生成文本节点",
    keys: ["Q"],
    group: "创建节点",
  },
  "create-ai-image": {
    label: "创建生成图像节点",
    keys: ["W"],
    group: "创建节点",
  },
  "create-ai-video": {
    label: "创建生成视频节点",
    keys: ["E"],
    group: "创建节点",
  },
  "create-ai-audio": {
    label: "创建生成音频节点",
    keys: ["R"],
    group: "创建节点",
  },
  "cut-edge": {
    label: "剪刀（切断连线）",
    keys: ["Ctrl"],
    group: "编辑与选择",
  },
  save: { label: "保存画布", keys: ["Ctrl", "S"], group: "通用" },
  "open-settings": { label: "打开设置", keys: ["Ctrl", ","], group: "通用" },
  "open-canvas-projects": { label: "打开画布项目", keys: [], group: "侧边栏" },
  "open-assets": { label: "打开资产", keys: [], group: "侧边栏" },
  "open-workflows": { label: "打开工作流", keys: [], group: "侧边栏" },
  "open-files": { label: "打开文件管理", keys: [], group: "侧边栏" },
  "open-task-center": { label: "打开任务进程", keys: [], group: "侧边栏" },
  "escape-all": {
    label: "取消/关闭所有菜单弹窗",
    keys: ["Escape"],
    group: "通用",
    hidden: true,
  },
  "editor-tool-brush": {
    label: "画笔（切换模式）",
    keys: ["B"],
    group: "画笔功能",
  },
  "editor-tool-rect": { label: "矩形", keys: [], group: "画笔功能" },
  "editor-tool-eraser": { label: "橡皮擦", keys: ["E"], group: "画笔功能" },
  "editor-tool-bucket": { label: "油漆桶", keys: ["G"], group: "画笔功能" },
  "editor-clear": { label: "清空", keys: ["R"], group: "画笔功能" },
  "image-tool-matting": { label: "遮罩编辑器", keys: ["1"], group: "图像功能" },
  "image-tool-repaint": { label: "重绘", keys: ["2"], group: "图像功能" },
  "image-tool-erase": { label: "擦除", keys: ["3"], group: "图像功能" },
  "image-tool-hd": { label: "高清", keys: ["4"], group: "图像功能" },
  "image-tool-expand": { label: "扩图", keys: ["5"], group: "图像功能" },
  "image-tool-auto-subject": {
    label: "自动识别主体",
    keys: ["6"],
    group: "图像功能",
  },
  "image-tool-multigrid": { label: "宫格裁剪", keys: ["7"], group: "图像功能" },
  "image-tool-multiangle": {
    label: "控制角度",
    keys: ["8"],
    group: "图像功能",
  },
  "image-tool-annotate": { label: "标注", keys: ["9"], group: "图像功能" },
  "image-tool-crop": { label: "裁剪", keys: ["0"], group: "图像功能" },
  "image-tool-fullscreen": {
    label: "全屏显示",
    keys: ["-"],
    group: "图像功能",
  },
  "image-tool-download": { label: "下载", keys: ["="], group: "图像功能" },
  "video-tool-clip": { label: "裁剪视频", keys: ["1"], group: "视频功能" },
  "video-tool-separate-av": {
    label: "音画分离",
    keys: ["6"],
    group: "视频功能",
  },
  "video-tool-capture-frame": {
    label: "截取当前帧",
    keys: ["C"],
    group: "视频功能",
  },
  "video-tool-keying": { label: "抠像", keys: ["2"], group: "视频功能" },
  "video-tool-hd": { label: "高清", keys: ["3"], group: "视频功能" },
  "video-tool-fullscreen": {
    label: "全屏显示",
    keys: ["4"],
    group: "视频功能",
  },
  "video-tool-download": { label: "下载", keys: ["5"], group: "视频功能" },
  "audio-tool-clip": { label: "裁剪音频", keys: ["1"], group: "音频功能" },
  "audio-tool-speed": { label: "倍速", keys: ["2"], group: "音频功能" },
  "audio-tool-download": { label: "下载", keys: ["3"], group: "音频功能" },
  "clip-tool-crop": { label: "剪辑裁剪", keys: ["C"], group: "剪辑功能" },
  "text-tool-copy": { label: "复制", keys: ["1"], group: "文本功能" },
  "text-tool-fullscreen": { label: "全屏显示", keys: ["2"], group: "文本功能" },
  "panorama-scene-tool-toggle-mouse": {
    label: "鼠标",
    keys: ["V"],
    group: "3D导演台",
  },
  "panorama-scene-tool-move": { label: "移动", keys: ["W"], group: "3D导演台" },
  "panorama-scene-tool-scale": {
    label: "缩放",
    keys: ["E"],
    group: "3D导演台",
  },
  "panorama-scene-tool-rotate": {
    label: "旋转",
    keys: ["R"],
    group: "3D导演台",
  },
  "panorama-scene-reset-view": {
    label: "重置视角",
    keys: [],
    group: "3D导演台",
  },
  "panorama-scene-capture": { label: "截图", keys: ["C"], group: "3D导演台" },
  "panorama-scene-camera-create": {
    label: "创建机位书签",
    keys: ["`"],
    group: "3D导演台",
  },
  "panorama-scene-camera-1": {
    label: "跳转机位书签 1",
    keys: ["1"],
    group: "3D导演台",
  },
  "panorama-scene-camera-2": {
    label: "跳转机位书签 2",
    keys: ["2"],
    group: "3D导演台",
  },
  "panorama-scene-camera-3": {
    label: "跳转机位书签 3",
    keys: ["3"],
    group: "3D导演台",
  },
  "panorama-scene-camera-4": {
    label: "跳转机位书签\x204",
    keys: ["4"],
    group: "3D导演台",
  },
  "panorama-scene-camera-5": {
    label: "跳转机位书签 5",
    keys: ["5"],
    group: "3D导演台",
  },
  "panorama-scene-camera-6": {
    label: "跳转机位书签 6",
    keys: ["6"],
    group: "3D导演台",
  },
  "panorama-scene-camera-7": {
    label: "跳转机位书签 7",
    keys: ["7"],
    group: "3D导演台",
  },
  "panorama-scene-camera-8": {
    label: "跳转机位书签\x208",
    keys: ["8"],
    group: "3D导演台",
  },
  "panorama-scene-camera-9": {
    label: "跳转机位书签 9",
    keys: ["9"],
    group: "3D导演台",
  },
  "panorama-scene-camera-0": {
    label: "跳转机位书签\x2010",
    keys: [],
    group: "3D导演台",
  },
  "panorama-scene-camera-save-1": {
    label: "保存当前视图到机位书签\x201",
    keys: ["Ctrl", "1"],
    group: "3D导演台",
  },
  "panorama-scene-camera-save-2": {
    label: "保存当前视图到机位书签 2",
    keys: ["Ctrl", "2"],
    group: "3D导演台",
  },
  "panorama-scene-camera-save-3": {
    label: "保存当前视图到机位书签 3",
    keys: ["Ctrl", "3"],
    group: "3D导演台",
  },
  "panorama-scene-camera-save-4": {
    label: "保存当前视图到机位书签 4",
    keys: ["Ctrl", "4"],
    group: "3D导演台",
  },
  "panorama-scene-camera-save-5": {
    label: "保存当前视图到机位书签\x205",
    keys: ["Ctrl", "5"],
    group: "3D导演台",
  },
  "panorama-scene-camera-save-6": {
    label: "保存当前视图到机位书签\x206",
    keys: ["Ctrl", "6"],
    group: "3D导演台",
  },
  "panorama-scene-camera-save-7": {
    label: "保存当前视图到机位书签 7",
    keys: ["Ctrl", "7"],
    group: "3D导演台",
  },
  "panorama-scene-camera-save-8": {
    label: "保存当前视图到机位书签\x208",
    keys: ["Ctrl", "8"],
    group: "3D导演台",
  },
  "panorama-scene-camera-save-9": {
    label: "保存当前视图到机位书签 9",
    keys: ["Ctrl", "9"],
    group: "3D导演台",
  },
  "panorama-scene-camera-save-0": {
    label: "保存当前视图到机位书签 10",
    keys: [],
    group: "3D导演台",
  },
};
export const PRESETS = {
  [DEFAULT_PRESET_NAME]: {},
  [ASHUO_PRESET_NAME]: {
    "fit-all": ["F"],
    redo: ["Ctrl", "Shift", "Z"],
    delete: ["D"],
    "snap-guides": [";"],
    "snap-grid": ["L"],
    "grid-dots": ["."],
    "create-text": [],
    "open-settings": ["K"],
    "open-assets": ["A"],
    "open-files": ["Z"],
  },
};
const BUILTIN_PRESET_NAMES = new Set(Object["keys"](PRESETS));
let _shortcuts = {},
  _currentPreset = ASHUO_PRESET_NAME,
  _recordingAction = null;
const DEFAULT_SHORTCUT_MIGRATIONS = {
    "panorama-scene-tool-move": { from: ["Q"], to: ["W"] },
    "panorama-scene-tool-scale": { from: ["W"], to: ["E"] },
    "panorama-scene-tool-rotate": { from: ["E"], to: ["R"] },
    "panorama-scene-reset-view": { from: ["R"], to: [] },
  },
  ASHUO_PRESET_SHORTCUT_MIGRATIONS = {
    "open-assets": { from: [], to: ["A"] },
    "open-files": { from: [], to: ["Z"] },
  },
  BUILTIN_PRESET_SHORTCUT_MIGRATIONS = {
    "add-reference": { from: [], to: ["X"] },
  };
function _emitShortcutsUpdated() {
  window["dispatchEvent"](new CustomEvent("shortcuts-updated"));
}
const _TOOLBAR_SHORTCUT_PREFIX_BY_NODE_TYPE = {
    "source-image": "image-tool-",
    "ai-image": "image-tool-",
    image: "image-tool-",
    "source-video": "video-tool-",
    "ai-video": "video-tool-",
    video: "video-tool-",
    "source-audio": "audio-tool-",
    "ai-audio": "audio-tool-",
    audio: "audio-tool-",
    "media-clip": "clip-tool-",
    "source-text": "text-tool-",
    "ai-text": "text-tool-",
    text: "text-tool-",
  },
  _PANORAMA_SCENE_NODE_TYPES = new Set(["panorama-scene", "panorama-360"]);
function _isPanoramaSceneShortcut(v0) {
  const v1 = String(v0 || "")["trim"]();
  return (
    v1["startsWith"]("panorama-scene-tool-") ||
    v1["startsWith"]("panorama-scene-camera-") ||
    v1["startsWith"]("panorama-scene-camera-save-") ||
    v1 === "panorama-scene-camera-create" ||
    v1 === "panorama-scene-reset-view" ||
    v1 === "panorama-scene-capture"
  );
}
function _isNodeToolbarAction(v2) {
  return /^(image|video|audio|clip|text)-tool-/["test"](String(v2 || ""));
}
function _isEditorShortcut(v3) {
  return String(v3 || "")
    ["trim"]()
    ["startsWith"]("editor-");
}
function _isCreateNodeShortcut(v4) {
  return String(v4 || "")
    ["trim"]()
    ["startsWith"]("create-");
}
function _isGlobalShortcut(v5) {
  const v6 = String(v5 || "")["trim"]();
  if (!v6) return false;
  return (
    !_isEditorShortcut(v6) &&
    !_isNodeToolbarAction(v6) &&
    !_isPanoramaSceneShortcut(v6) &&
    !_isCreateNodeShortcut(v6)
  );
}
function _isPanoramaSceneNodeType(v7) {
  return _PANORAMA_SCENE_NODE_TYPES["has"](String(v7 || "")["trim"]());
}
function _isPanoramaSceneEditingContext(v8) {
  return (
    _isPanoramaSceneNodeType(v8?.["selectedNodeType"]) &&
    v8?.["panoramaSceneEditing"] === true
  );
}
function _filterShortcutMatchesByContext(v9, v10 = {}) {
  let v11 = Array["isArray"](v9) ? [...v9] : [];
  return (
    v10["featureModeActive"] &&
      (v11 = v11["filter"]((v12) => !_isNodeToolbarAction(v12))),
    v10["alignFeatureEnabled"] === false &&
      (v11 = v11["filter"]((v13) => v13 !== "align-feature")),
    _isPanoramaSceneEditingContext(v10) &&
      (v11 = v11["filter"](
        (v14) => !_isNodeToolbarAction(v14) && !_isCreateNodeShortcut(v14),
      )),
    v11
  );
}
function _resolveToolbarShortcutMatch(v15, v16) {
  const v17 =
    _TOOLBAR_SHORTCUT_PREFIX_BY_NODE_TYPE[String(v16 || "")["trim"]()];
  if (!v17) return null;
  return v15["find"]((v18) => v18["startsWith"](v17)) || null;
}
function _resolveShortcutMatch(v19, v20 = {}) {
  if (!Array["isArray"](v19) || v19["length"] === 0) return null;
  if (
    v20["mattingActive"] ||
    v20["annotateActive"] ||
    v20["videoKeyingActive"]
  ) {
    const v21 = v19["find"]((v22) => _isEditorShortcut(v22));
    if (v21) return v21;
  }
  if (_isPanoramaSceneEditingContext(v20)) {
    const v23 = v19["find"]((v24) => _isPanoramaSceneShortcut(v24));
    if (v23) return v23;
  }
  const v25 = _resolveToolbarShortcutMatch(v19, v20["selectedNodeType"]);
  if (v25) return v25;
  const v26 = v19["find"]((v27) => _isGlobalShortcut(v27));
  if (v26) return v26;
  const v28 = v19["find"]((v29) => _isCreateNodeShortcut(v29));
  if (v28) return v28;
  return null;
}
function _getShortcutBindingStrings(v30) {
  const v31 = [];
  return (
    Array["isArray"](v30?.["keys"]) &&
      v30["keys"]["length"] > 0 &&
      v31["push"](v30["keys"]),
    Array["isArray"](v30?.["alternateKeys"]) &&
      v30["alternateKeys"]["forEach"]((v32) => {
        Array["isArray"](v32) && v32["length"] > 0 && v31["push"](v32);
      }),
    v31["map"]((v33) => _toShortcutBindingString(v33))
  );
}
function _normalizeShortcutToken(v34) {
  const v35 = String(v34 || "")["trim"]();
  if (!v35) return "";
  const v36 = v35["toLowerCase"]();
  if (v36 === "ctrl" || v36 === "control" || v36 === "meta") return "Ctrl";
  if (v36 === "shift") return "Shift";
  if (v36 === "alt") return "Alt";
  if (v36 === "space") return "Space";
  if (v36 === "backquote" || v35 === "`" || v35 === "~") return "`";
  if (v35["length"] === 1) return v35["toUpperCase"]();
  return v35;
}
function _normalizeShortcutMainKey(v37) {
  if (String(v37?.["code"] || "")["trim"]() === "Backquote") return "`";
  if (String(v37?.["code"] || "")["trim"]() === "Space") return "Space";
  return _normalizeShortcutToken(
    v37?.["key"] === "\x20" ? "Space" : v37?.["key"],
  );
}
function _normalizeShortcutKeys(v38) {
  if (!Array["isArray"](v38)) return [];
  const v39 = v38["map"]((v40) => _normalizeShortcutToken(v40))["filter"](
      Boolean,
    ),
    v41 = [];
  if (v39["includes"]("Ctrl")) v41["push"]("Ctrl");
  if (v39["includes"]("Shift")) v41["push"]("Shift");
  if (v39["includes"]("Alt")) v41["push"]("Alt");
  const v42 = v39["filter"](
    (v43) => v43 !== "Ctrl" && v43 !== "Shift" && v43 !== "Alt",
  );
  return [...v41, ...v42];
}
function _buildShortcutKeysFromEvent(v44) {
  const v45 = [];
  if (v44["ctrlKey"] || v44["metaKey"]) v45["push"]("Ctrl");
  if (v44["shiftKey"]) v45["push"]("Shift");
  if (v44["altKey"]) v45["push"]("Alt");
  const v46 = _normalizeShortcutMainKey(v44);
  return (
    !["Ctrl", "Shift", "Alt", ""]["includes"](v46) && v45["push"](v46),
    v45
  );
}
function _toShortcutBindingString(v47) {
  return _normalizeShortcutKeys(v47)["join"]("+")["toUpperCase"]();
}
function _isContextualShortcutConflictExempt(v48, v49, v50) {
  if (v50 !== "B") return false;
  const v51 = new Set([v48, v49]);
  return (
    v51["has"]("toggle-connection-lines") && v51["has"]("editor-tool-brush")
  );
}
function _resolveSavedShortcutKeys(v52, v53, v54, v55 = {}) {
  const v56 = Array["isArray"](v53),
    v57 = v56 ? _normalizeShortcutKeys(v53) : [],
    v58 =
      v55["savedPresetName"] === ASHUO_PRESET_NAME
        ? ASHUO_PRESET_SHORTCUT_MIGRATIONS[v52]
        : null,
    v59 = BUILTIN_PRESET_NAMES["has"](v55["savedPresetName"])
      ? BUILTIN_PRESET_SHORTCUT_MIGRATIONS[v52]
      : null;
  if (
    v56 &&
    v58 &&
    _toShortcutBindingString(v57) === _toShortcutBindingString(v58["from"])
  )
    return _normalizeShortcutKeys(v58["to"]);
  if (
    v56 &&
    v59 &&
    _toShortcutBindingString(v57) === _toShortcutBindingString(v59["from"])
  )
    return _normalizeShortcutKeys(v59["to"]);
  const v60 = DEFAULT_SHORTCUT_MIGRATIONS[v52];
  if (
    v56 &&
    v60 &&
    _toShortcutBindingString(v57) === _toShortcutBindingString(v60["from"])
  )
    return _normalizeShortcutKeys(v60["to"]);
  return v56 ? v57 : _normalizeShortcutKeys(v54);
}
function _normalizePresetName(v61) {
  const v62 = String(v61 || "")["trim"]();
  if (v62 === "自定义") return CUSTOM_PRESET_NAME;
  if (BUILTIN_PRESET_NAMES["has"](v62)) return v62;
  if (v62 === CUSTOM_PRESET_NAME) return CUSTOM_PRESET_NAME;
  return ASHUO_PRESET_NAME;
}
function _buildPresetShortcuts(v63) {
  const v64 = _normalizePresetName(v63),
    v65 = PRESETS[v64] || {};
  return Object["fromEntries"](
    Object["entries"](DEFAULT_SHORTCUTS)["map"](([v66, v67]) => [
      v66,
      { ...v67, keys: _normalizeShortcutKeys(v65[v66] ?? [...v67["keys"]]) },
    ]),
  );
}
function _shortcutsMatchPreset(v68, v69) {
  const v70 = _buildPresetShortcuts(v69);
  return Object["entries"](v70)["every"](([v71, v72]) => {
    const v73 = v68?.[v71]?.["keys"] || [];
    return (
      _toShortcutBindingString(v73) === _toShortcutBindingString(v72["keys"])
    );
  });
}
function _inferPresetName(v74, v75) {
  if (_normalizePresetName(v75) === CUSTOM_PRESET_NAME)
    return CUSTOM_PRESET_NAME;
  if (_shortcutsMatchPreset(v74, DEFAULT_PRESET_NAME))
    return DEFAULT_PRESET_NAME;
  if (_shortcutsMatchPreset(v74, ASHUO_PRESET_NAME)) return ASHUO_PRESET_NAME;
  return CUSTOM_PRESET_NAME;
}
async function _loadFromServer() {
  try {
    const v76 = await fetchUserShortcutsFromServer();
    if (
      v76 &&
      v76["shortcuts"] &&
      Object["keys"](v76["shortcuts"])["length"] > 0
    ) {
      const v77 = _normalizePresetName(v76["preset"]),
        v78 = BUILTIN_PRESET_NAMES["has"](v77) ? v77 : ASHUO_PRESET_NAME,
        v79 = _buildPresetShortcuts(v78);
      ((_shortcuts = Object["fromEntries"](
        Object["entries"](v79)["map"](([v80, v81]) => [
          v80,
          v76["shortcuts"][v80]
            ? {
                ...v81,
                keys: _resolveSavedShortcutKeys(
                  v80,
                  v76["shortcuts"][v80]["keys"],
                  v81["keys"],
                  { savedPresetName: v77 },
                ),
              }
            : { ...v81, keys: _normalizeShortcutKeys(v81["keys"]) },
        ]),
      )),
        (_currentPreset = _inferPresetName(_shortcuts, v77)));
      if (_shortcuts["matting-auto"]) _shortcuts["matting-auto"]["keys"] = [];
      (_updatePresetSelect(), _render(), _syncShortcutsToGlobal());
    } else (_applyPreset(ASHUO_PRESET_NAME, false), _syncShortcutsToGlobal());
  } catch {
    (_applyPreset(ASHUO_PRESET_NAME, false), _syncShortcutsToGlobal());
  }
}
async function _saveToServer() {
  const v82 = {
    preset: _currentPreset,
    shortcuts: Object["fromEntries"](
      Object["entries"](_shortcuts)["map"](([v83, v84]) => [
        v83,
        { keys: v84["keys"] },
      ]),
    ),
  };
  try {
    (await saveUserShortcutsToServer(v82), _syncShortcutsToGlobal());
  } catch (v85) {
    console["warn"]("[shortcuts] save failed:", v85);
  }
}
function _syncShortcutsToGlobal() {
  const v86 = {},
    v87 = [
      "editor-tool-brush",
      "editor-tool-eraser",
      "editor-tool-bucket",
      "editor-clear",
    ];
  (v87["forEach"]((v88) => {
    if (_shortcuts[v88]?.["keys"]?.["length"] > 0) {
      const v89 =
        _shortcuts[v88]["keys"][_shortcuts[v88]["keys"]["length"] - 1];
      v86[v88] = v89["toUpperCase"]();
    }
  }),
    (window["_mattingShortcuts"] = v86));
}
function _applyPreset(v90, v91 = true) {
  const v92 = _normalizePresetName(v90);
  if (!BUILTIN_PRESET_NAMES["has"](v92)) return;
  ((_currentPreset = v92),
    (_shortcuts = _buildPresetShortcuts(v92)),
    _render(),
    _syncShortcutsToGlobal(),
    _emitShortcutsUpdated());
  if (v91) _saveToServer();
}
function _getPresetControls() {
  if (typeof document === "undefined") return {};
  const v93 = document["getElementById"]("shortcutsPresetSelect"),
    v94 = document["getElementById"]("shortcutsPresetControl"),
    v95 = document["getElementById"]("shortcutsPresetTrigger"),
    v96 = document["getElementById"]("shortcutsPresetTriggerText"),
    v97 = document["getElementById"]("shortcutsPresetMenu"),
    v98 = v97?.["querySelectorAll"]
      ? Array["from"](v97["querySelectorAll"](".settings-preset-option"))
      : [];
  return {
    select: v93,
    control: v94,
    trigger: v95,
    triggerText: v96,
    menu: v97,
    options: v98,
  };
}
function _getPresetLabel(v99) {
  const { select: v100, options: v101 } = _getPresetControls(),
    v102 = v100?.["options"]
      ? Array["from"](v100["options"])["find"]((v103) => v103["value"] === v99)
      : null,
    v104 = v101["find"]((v105) => v105["dataset"]?.["value"] === v99);
  return v102?.["textContent"] || v104?.["textContent"] || v99;
}
function _setPresetMenuOpen(
  v106,
  { focusOption: focusOption = false, focusTrigger: focusTrigger = false } = {},
) {
  const {
    control: v107,
    trigger: v108,
    menu: v109,
    options: v110,
  } = _getPresetControls();
  if (!v107 || !v108 || !v109) return;
  (v107["classList"]["toggle"]("is-open", v106),
    v108["setAttribute"]("aria-expanded", v106 ? "true" : "false"),
    (v109["hidden"] = !v106));
  if (v106 && focusOption) {
    const v111 = v110["find"](
        (v112) =>
          v112["dataset"]?.["value"] === _currentPreset && !v112["disabled"],
      ),
      v113 = v110["find"]((v114) => !v114["disabled"]);
    (v111 || v113)?.["focus"]?.();
  } else !v106 && focusTrigger && v108["focus"]?.();
}
function _isPresetMenuOpen() {
  const { control: v115 } = _getPresetControls();
  return !!v115?.["classList"]?.["contains"]("is-open");
}
function _selectPresetFromUi(v116) {
  if (_normalizePresetName(v116) === CUSTOM_PRESET_NAME) {
    (_updatePresetSelect(), _setPresetMenuOpen(false, { focusTrigger: true }));
    return;
  }
  const v117 = _normalizePresetName(v116);
  (_applyPreset(v117, true),
    _updatePresetSelect(),
    _setPresetMenuOpen(false, { focusTrigger: true }),
    window["showToast"]?.("已切换预设：" + v117));
}
function _movePresetOptionFocus(v118) {
  const { options: v119 } = _getPresetControls(),
    v120 = v119["filter"]((v121) => !v121["disabled"]);
  if (v120["length"] === 0) return;
  const v122 = document["activeElement"];
  let v123 = v120["indexOf"](v122);
  v123 < 0 &&
    (v123 = v120["findIndex"](
      (v124) => v124["dataset"]?.["value"] === _currentPreset,
    ));
  const v125 = (Math["max"](v123, 0) + v118 + v120["length"]) % v120["length"];
  v120[v125]?.["focus"]?.();
}
function _updatePresetSelect() {
  const {
    select: v126,
    triggerText: v127,
    options: v128,
  } = _getPresetControls();
  if (v126) v126["value"] = _currentPreset;
  if (v127) v127["textContent"] = _getPresetLabel(_currentPreset);
  v128["forEach"]((v129) => {
    const v130 = v129["dataset"]?.["value"] === _currentPreset;
    (v129["classList"]["toggle"]("is-active", v130),
      v129["setAttribute"]("aria-selected", v130 ? "true" : "false"));
  });
}
function _initPresetSelect() {
  const {
    select: v131,
    control: v132,
    trigger: v133,
    menu: v134,
  } = _getPresetControls();
  v131 &&
    !v131["dataset"]["presetSelectBound"] &&
    ((v131["dataset"]["presetSelectBound"] = "true"),
    v131["addEventListener"]("change", () => {
      _selectPresetFromUi(v131["value"]);
    }));
  if (!v132 || !v133 || !v134 || v133["dataset"]["presetSelectBound"]) {
    _updatePresetSelect();
    return;
  }
  ((v133["dataset"]["presetSelectBound"] = "true"),
    v133["addEventListener"]("click", () => {
      _setPresetMenuOpen(!_isPresetMenuOpen(), { focusOption: true });
    }),
    v133["addEventListener"]("keydown", (v135) => {
      (v135["key"] === "ArrowDown" ||
        v135["key"] === "Enter" ||
        v135["key"] === "\x20") &&
        (v135["preventDefault"](),
        _setPresetMenuOpen(true, { focusOption: true }));
    }),
    v134["addEventListener"]("click", (v136) => {
      const v137 = v136["target"]?.["closest"]?.(".settings-preset-option");
      if (!v137 || v137["disabled"]) return;
      _selectPresetFromUi(v137["dataset"]["value"]);
    }),
    v134["addEventListener"]("keydown", (v138) => {
      if (v138["key"] === "Escape")
        (v138["preventDefault"](),
          _setPresetMenuOpen(false, { focusTrigger: true }));
      else {
        if (v138["key"] === "ArrowDown")
          (v138["preventDefault"](), _movePresetOptionFocus(1));
        else {
          if (v138["key"] === "ArrowUp")
            (v138["preventDefault"](), _movePresetOptionFocus(-1));
          else {
            if (v138["key"] === "Enter" || v138["key"] === "\x20") {
              v138["preventDefault"]();
              const v139 = document["activeElement"]?.["closest"]?.(
                ".settings-preset-option",
              );
              if (v139 && !v139["disabled"])
                _selectPresetFromUi(v139["dataset"]["value"]);
            }
          }
        }
      }
    }),
    document["addEventListener"]("pointerdown", (v140) => {
      if (!_isPresetMenuOpen()) return;
      if (
        typeof v132["contains"] === "function" &&
        v132["contains"](v140["target"])
      )
        return;
      _setPresetMenuOpen(false);
    }),
    _updatePresetSelect());
}
function _render() {
  const v141 = document["getElementById"]("shortcutsContent");
  if (!v141) return;
  v141["replaceChildren"]();
  const v142 = {};
  (Object["entries"](_shortcuts)["forEach"](([v143, v144]) => {
    if (v144["hidden"]) return;
    if (!v142[v144["group"]]) v142[v144["group"]] = [];
    v142[v144["group"]]["push"]({ id: v143, ...v144 });
  }),
    Object["entries"](v142)["forEach"](([v145, v146]) => {
      const v147 = document["createElement"]("div");
      v147["className"] = "sc-section";
      const v148 = document["createElement"]("div");
      ((v148["className"] = "sc-section-title"),
        (v148["textContent"] = v145),
        v147["appendChild"](v148),
        v146["forEach"]((v149) => {
          const v150 = document["createElement"]("div");
          v150["className"] = "sc-item";
          const v151 = document["createElement"]("span");
          ((v151["className"] = "sc-label"),
            (v151["textContent"] = v149["label"]));
          const v152 = document["createElement"]("div");
          ((v152["className"] = "sc-keys"),
            (v152["dataset"]["action"] = v149["id"]),
            v152["replaceChildren"]());
          if (_recordingAction === v149["id"]) {
            const v153 = document["createElement"]("kbd");
            ((v153["className"] = "kbd-v2 recording"),
              (v153["textContent"] = "录制中..."),
              v152["appendChild"](v153));
          } else {
            if (v149["keys"]["length"] > 0)
              v149["keys"]["forEach"]((v154) => {
                const v155 = document["createElement"]("kbd");
                ((v155["className"] = "kbd-v2"),
                  (v155["textContent"] = v154),
                  v152["appendChild"](v155));
              });
            else {
              const v156 = document["createElement"]("kbd");
              ((v156["className"] = "kbd-v2"),
                (v156["textContent"] = "未设置"),
                v152["appendChild"](v156));
            }
          }
          (v152["addEventListener"]("click", () => _startRecording(v149["id"])),
            v150["appendChild"](v151),
            v150["appendChild"](v152),
            v147["appendChild"](v150));
        }),
        v141["appendChild"](v147));
    }));
}
function _startRecording(v157) {
  if (_recordingAction) return;
  ((_recordingAction = v157), _render());
}
export function detectShortcutConflict(v158, v159, v160) {
  if (!v158 || typeof v158 !== "object") return null;
  const v161 = _toShortcutBindingString(v160);
  if (!v161) return null;
  for (const [v162, v163] of Object["entries"](v158)) {
    if (v162 === v159) continue;
    if (_getShortcutBindingStrings(v163)["includes"](v161)) {
      if (_isContextualShortcutConflictExempt(v159, v162, v161)) continue;
      return { id: v162, label: v163["label"] || v162 };
    }
  }
  return null;
}
function _stopRecording(v164) {
  if (!_recordingAction) return;
  if (v164 && v164["length"] > 0) {
    const v165 = detectShortcutConflict(_shortcuts, _recordingAction, v164);
    if (v165) {
      (window["showToast"]?.(
        "快捷键冲突：已被「" + v165["label"] + "」占用",
        "warn",
      ),
        (_recordingAction = null),
        _render());
      return;
    }
    ((_shortcuts[_recordingAction]["keys"] = _normalizeShortcutKeys(v164)),
      (_currentPreset = CUSTOM_PRESET_NAME),
      _updatePresetSelect(),
      _syncShortcutsToGlobal(),
      _emitShortcutsUpdated(),
      _saveToServer(),
      window["showToast"]?.("快捷键已更新", "success"));
  }
  ((_recordingAction = null), _render());
}
function _reset() {
  (_applyPreset(DEFAULT_PRESET_NAME, true),
    _updatePresetSelect(),
    window["showToast"]?.("已恢复默认快捷键"));
}
export function openShortcuts() {
  const v166 = document["getElementById"]("settingsOverlay");
  if (!v166) return;
  v166["style"]["display"] = "block";
  const v167 = document["querySelectorAll"](".settings-nav-item"),
    v168 = document["querySelectorAll"](".settings-pane");
  (v167["forEach"]((v169) => {
    v169["classList"]["toggle"](
      "active",
      v169["dataset"]["pane"] === "shortcuts",
    );
  }),
    v168["forEach"]((v170) => {
      v170["classList"]["toggle"]("active", v170["id"] === "pane-shortcuts");
    }),
    _render(),
    _updatePresetSelect());
}
export function closeShortcuts() {
  const v171 = document["getElementById"]("settingsOverlay");
  if (v171) v171["style"]["display"] = "none";
  _recordingAction && ((_recordingAction = null), _render());
}
export function getShortcuts() {
  return _shortcuts;
}
export function getCurrentPreset() {
  return _currentPreset;
}
export function isRecording() {
  return !!_recordingAction;
}
export function handleShortcutKeydown(v172, v173 = {}) {
  if (_recordingAction) return null;
  const v174 = _toShortcutBindingString(_buildShortcutKeysFromEvent(v172));
  let v175 = [];
  for (const [v176, v177] of Object["entries"](_shortcuts)) {
    _getShortcutBindingStrings(v177)["includes"](v174) && v175["push"](v176);
  }
  v175 = _filterShortcutMatchesByContext(v175, v173);
  if (v175["length"] === 0) return null;
  return _resolveShortcutMatch(v175, v173);
}
typeof document !== "undefined" &&
  document?.["addEventListener"] &&
  (document["addEventListener"](
    "keydown",
    (v178) => {
      if (!_recordingAction) return;
      (v178["preventDefault"](), v178["stopImmediatePropagation"]());
      if (v178["key"] === "Escape") {
        _stopRecording(null);
        return;
      }
      const v179 = _buildShortcutKeysFromEvent(v178),
        v180 = _normalizeShortcutMainKey(v178);
      v179["length"] > 0 &&
        !["Ctrl", "Shift", "Alt", ""]["includes"](v180) &&
        _stopRecording(v179);
    },
    true,
  ),
  document["addEventListener"]("DOMContentLoaded", () => {
    (_loadFromServer(),
      document["getElementById"]("btnShortcutsClose")?.["addEventListener"](
        "click",
        closeShortcuts,
      ),
      document["getElementById"]("btnResetShortcuts")?.["addEventListener"](
        "click",
        (v181) => {
          (v181["stopPropagation"](), _reset());
        },
      ),
      document["getElementById"]("btnShortcutsClose")?.["addEventListener"](
        "click",
        closeShortcuts,
      ),
      document["getElementById"]("btnShortcuts")?.["addEventListener"](
        "click",
        (v182) => {
          (v182["stopPropagation"](),
            document["getElementById"]("avatarMenu")?.["classList"]["remove"](
              "open",
            ),
            openShortcuts());
        },
      ),
      _initPresetSelect());
  }));
