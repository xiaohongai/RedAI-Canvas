const _NODE_META = {
    group: { aliases: [], wrapperClasses: ["node-group"], refKind: "" },
    "source-text": {
      aliases: ["text", "source_text"],
      wrapperClasses: ["source-text-node", "type-source"],
      refKind: "text",
    },
    "comment-note": {
      aliases: ["comment_note", "comment"],
      wrapperClasses: ["comment-note-node"],
      refKind: "",
    },
    "source-image": {
      aliases: ["image", "source_image"],
      wrapperClasses: ["image-node", "type-source"],
      refKind: "image",
    },
    "source-video": {
      aliases: ["video", "source_video"],
      wrapperClasses: ["video-node", "type-source"],
      refKind: "video",
    },
    "source-audio": {
      aliases: ["audio", "source_audio"],
      wrapperClasses: ["audio-node", "type-source"],
      refKind: "audio",
    },
    "web-preview": {
      aliases: ["web_preview"],
      wrapperClasses: ["web-preview-node"],
      refKind: "",
    },
    "media-clip": {
      aliases: ["clip", "media_clip"],
      wrapperClasses: ["media-clip-node"],
      refKind: "",
    },
    "ai-text": { aliases: [], wrapperClasses: ["text-node"], refKind: "text" },
    "ai-image": {
      aliases: [],
      wrapperClasses: ["image-node"],
      refKind: "image",
    },
    "ai-video": {
      aliases: [],
      wrapperClasses: ["video-node"],
      refKind: "video",
    },
    "ai-audio": {
      aliases: [],
      wrapperClasses: ["audio-node"],
      refKind: "audio",
    },
    debug: { aliases: [], wrapperClasses: [], refKind: "" },
    collage: {
      aliases: [],
      wrapperClasses: ["collage-node-wrapper"],
      refKind: "",
    },
    storyboard: { aliases: [], wrapperClasses: [], refKind: "" },
    "storyboard-script": {
      aliases: ["storyboard_script"],
      wrapperClasses: ["storyboard-script-wrapper"],
      refKind: "",
    },
    "panorama-scene": {
      aliases: ["panorama_scene"],
      wrapperClasses: ["panorama-scene-node"],
      refKind: "",
    },
    "panorama-360": {
      aliases: ["panorama_360", "panorama360"],
      wrapperClasses: ["panorama-scene-node"],
      refKind: "",
    },
    "test-video": {
      aliases: [],
      wrapperClasses: ["video-node"],
      refKind: "video",
    },
  },
  _ALIAS_TO_CANONICAL = (() => {
    const v0 = new Map();
    for (const [v1, v2] of Object["entries"](_NODE_META)) {
      v0["set"](v1, v1);
      for (const v3 of v2["aliases"] || []) {
        v0["set"](v3, v1);
      }
    }
    return v0;
  })();
export function getAllNodeTypeMeta() {
  return _NODE_META;
}
export function normalizeNodeType(v4) {
  if (typeof v4 !== "string") return "";
  const v5 = v4["trim"]();
  if (!v5) return "";
  return _ALIAS_TO_CANONICAL["get"](v5) || v5;
}
export function getNodeTypeAliases(v6) {
  const v7 = normalizeNodeType(v6),
    v8 = _NODE_META[v7];
  return v8?.["aliases"] ? [...v8["aliases"]] : [];
}
export function getNodeWrapperExtraClasses(v9) {
  const v10 = normalizeNodeType(v9),
    v11 = _NODE_META[v10],
    v12 = v11?.["wrapperClasses"] || [];
  return v12["length"] ? v12["join"]("\x20") : "";
}
export function getRefKindByNodeType(v13) {
  const v14 = normalizeNodeType(v13);
  return _NODE_META[v14]?.["refKind"] || "";
}
