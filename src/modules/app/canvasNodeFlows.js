import { createDefaultCommentNoteStyle } from "../../components/commentNoteStyle.js";
import {
  findAvailablePosition,
  generateId,
  screenToWorld,
} from "../../core/math.js";
import { getNodeSpawnPrefs } from "../nodeSpawn.js";
function getMimeExtension(v0, v1 = "bin") {
  const v2 = String(v0 || "")
    ["split"](";")[0]
    ["trim"]()
    ["toLowerCase"]();
  if (!v2["includes"]("/")) return v1;
  const v3 = v2["split"]("/")[1] || v1;
  return v3["replace"](/[^a-z0-9]/g, "") || v1;
}
function buildSystemClipboardSignature({
  pastedMedia: v4,
  pastedText: v5,
  pastedFiles: v6,
}) {
  if (Array["isArray"](v6) && v6["length"] > 0) {
    const v7 = v6["map"]((v8) => String(v8?.["path"] || v8?.["name"] || ""))
      ["filter"](Boolean)
      ["slice"](0, 8)
      ["join"]("|");
    return "files:" + v7 + "|len:" + v6["length"];
  }
  if (v4?.["mimeType"]) {
    const v9 = String(v4["mimeType"])["toLowerCase"](),
      v10 = Number(v4?.["blob"]?.["size"]) || 0;
    return "media:" + v9 + "|" + v10;
  }
  const v11 = String(v5 || "");
  if (!v11["trim"]()) return "";
  const v12 = v11["slice"](0, 256);
  return "text:" + v12 + "|len:" + v11["length"];
}
function resolvePastedMediaDescriptor(v13, v14 = {}) {
  const v15 = String(v14["nodeName"] || v14["name"] || "")["trim"](),
    v16 = String(v14["typeSlug"] || "")["trim"]();
  if (v13["startsWith"]("image/"))
    return {
      nodeType: "source-image",
      nodeName: v15 || "粘贴图片",
      typeSlug: v16 || "image",
    };
  if (v13["startsWith"]("video/"))
    return {
      nodeType: "source-video",
      nodeName: v15 || "粘贴视频",
      typeSlug: v16 || "video",
    };
  if (v13["startsWith"]("audio/"))
    return {
      nodeType: "source-audio",
      nodeName: v15 || "粘贴音频",
      typeSlug: v16 || "audio",
    };
  return null;
}
function centerNodeAtWorldPosition(v17, v18, v19) {
  const v20 = Number(v17?.["width"]) || 0,
    v21 = Number(v17?.["height"]) || 0;
  return { ...v17, x: v18 - v20 / 2, y: v19 - v21 / 2 };
}
function decodeBase64Bytes(v22) {
  const v23 = String(v22 || "")["trim"]();
  if (!v23) return new Uint8Array();
  if (typeof atob === "function") {
    const v24 = atob(v23),
      v25 = new Uint8Array(v24["length"]);
    for (let v26 = 0; v26 < v24["length"]; v26 += 1) {
      v25[v26] = v24["charCodeAt"](v26);
    }
    return v25;
  }
  if (typeof Buffer !== "undefined")
    return new Uint8Array(Buffer["from"](v23, "base64"));
  return new Uint8Array();
}
function blobFromBase64(v27, v28) {
  const v29 = decodeBase64Bytes(v27);
  if (!v29["length"]) return null;
  return new Blob([v29], { type: v28 || "application/octet-stream" });
}
function normalizeSpawnDirection(v30) {
  return v30 === "left" || v30 === "down" ? v30 : "right";
}
function getSequenceNodes(v31, v32) {
  if (!v32 || !v31 || typeof v31 !== "object") return {};
  return Object["fromEntries"](
    Object["entries"](v31)["filter"](
      ([, v33]) => String(v33?.["spawnSequenceKey"] || "") === v32,
    ),
  );
}
async function readElectronClipboardContents() {
  const v34 = globalThis?.["window"]?.["electronAPI"]?.["clipboard"];
  if (!v34)
    return {
      pastedFiles: [],
      pastedMedia: null,
      pastedText: "",
      failed: false,
    };
  const v35 = {
    pastedFiles: [],
    pastedMedia: null,
    pastedText: "",
    failed: false,
  };
  try {
    if (typeof v34["readFileReferences"] === "function") {
      const v36 = await v34["readFileReferences"]();
      v36?.["ok"] &&
        Array["isArray"](v36["files"]) &&
        (v35["pastedFiles"] = v36["files"]);
    }
    if (
      v35["pastedFiles"]["length"] === 0 &&
      typeof v34["readImage"] === "function"
    ) {
      const v37 = await v34["readImage"]();
      if (v37?.["ok"] && v37["dataBase64"]) {
        const v38 = String(v37["mimeType"] || "image/png"),
          v39 = blobFromBase64(v37["dataBase64"], v38);
        v39 && (v35["pastedMedia"] = { mimeType: v38, blob: v39 });
      }
    }
    if (typeof v34["readText"] === "function") {
      const v40 = await v34["readText"]();
      v40?.["ok"] &&
        typeof v40["text"] === "string" &&
        (v35["pastedText"] = v40["text"]);
    }
  } catch (v41) {
    (console["warn"]("[paste] Electron 剪贴板读取失败:", v41),
      (v35["failed"] = true));
  }
  return v35;
}
async function readSystemClipboardContents() {
  let v42 = null,
    v43 = "",
    v44 = [],
    v45 = false;
  const v46 = await readElectronClipboardContents();
  ((v44 = v46["pastedFiles"]),
    (v42 = v46["pastedMedia"]),
    (v43 = v46["pastedText"]),
    (v45 = !!v46["failed"]));
  try {
    const v47 = globalThis?.["navigator"]?.["clipboard"],
      v48 = typeof v47?.["read"] === "function",
      v49 = typeof v47?.["readText"] === "function";
    if (v44["length"] === 0 && !v42 && v48) {
      const v50 = await v47["read"]();
      for (const v51 of v50) {
        const v52 = v51["types"]["find"](
          (v53) =>
            v53["startsWith"]("image/") ||
            v53["startsWith"]("video/") ||
            v53["startsWith"]("audio/"),
        );
        if (!v42 && v52) {
          v42 = { mimeType: v52, blob: await v51["getType"](v52) };
          continue;
        }
        if (!v43 && v51["types"]["includes"]("text/plain")) {
          const v54 = await v51["getType"]("text/plain");
          v43 = await v54["text"]();
        }
      }
    }
    !v43 && v49 && (v43 = await v47["readText"]());
  } catch (v55) {
    (console["warn"]("[paste] 剪贴板读取失败:", v55), (v45 = true));
  }
  return {
    pastedFiles: v44,
    pastedMedia: v42,
    pastedText: v43,
    clipboardReadFailed: v45,
  };
}
export function createAppCanvasNodeFlows({
  graphStore: v56,
  commit: v57,
  getCursorScreenPosition: v58,
  getNodeDefaultSize: v59,
  getAIGenerationDefaultSizeByType: v60,
  getAIGenerationNodeSize: v61,
  createPanoramaNodeDataByType: v62,
  processFile: v63,
  executeCommand: v64,
  getCurrentProjectId: v65,
  showToast: v66,
  loadClipboardModule: loadClipboardModule = () => import("../clipboard.js"),
} = {}) {
  function v67() {
    return v56?.["getStateRaw"]?.() ?? v56?.["getState"]?.() ?? {};
  }
  function v68(v69 = {}) {
    if (v69["placement"] === "viewport-center-sequence") return v70();
    const v71 = v58?.() || {},
      v72 =
        typeof v71["x"] === "number" && Number["isFinite"](v71["x"])
          ? v71["x"]
          : window["innerWidth"] / 2,
      v73 =
        typeof v71["y"] === "number" && Number["isFinite"](v71["y"])
          ? v71["y"]
          : window["innerHeight"] / 2,
      v74 =
        typeof v69["screenX"] === "number" && Number["isFinite"](v69["screenX"])
          ? v69["screenX"]
          : v72,
      v75 =
        typeof v69["screenY"] === "number" && Number["isFinite"](v69["screenY"])
          ? v69["screenY"]
          : v73,
      { viewport: v76 } = v67();
    return screenToWorld(v74, v75, v76);
  }
  function v70() {
    const v77 = window["innerWidth"] / 2,
      v78 = window["innerHeight"] / 2,
      { viewport: v79 } = v67();
    return screenToWorld(v77, v78, v79);
  }
  function v80(v81, v82, v83, v84) {
    const { x: v85, y: v86 } = v68(),
      v87 = generateId(v81),
      v88 =
        v81 === "ai-text"
          ? v60("ai-text")
          : v81 === "ai-image" || v81 === "ai-video"
            ? v61(v82, v83)
            : { width: v82, height: v83 },
      v89 = v88["width"],
      v90 = v88["height"],
      v91 = v62?.({
        type: v81,
        id: v87,
        x: v85 - v89 / 2,
        y: v86 - v90 / 2,
        width: v89,
        height: v90,
        name: v84,
      }) || {
        id: v87,
        type: v81,
        x: v85 - v89 / 2,
        y: v86 - v90 / 2,
        width: v89,
        height: v90,
        name: v84,
      };
    return (
      v81 === "comment-note" &&
        ((v91["name"] = ""),
        (v91["content"] = ""),
        (v91["style"] = createDefaultCommentNoteStyle())),
      v56["addNode"](v91),
      v56["setSelectedNodes"]([v87]),
      v57(),
      v91
    );
  }
  async function v92(v93, v94, v95, v96, v97 = {}) {
    if (!v93 || !v94) return false;
    const v98 = resolvePastedMediaDescriptor(String(v94), v97);
    if (!v98) return false;
    const v99 = getMimeExtension(v94, "dat"),
      v100 = "pasted-" + v98["typeSlug"] + "-" + Date["now"]() + "." + v99,
      v101 = new File([v93], v100, { type: v94 }),
      v102 = v65?.() || "default_v2_project",
      v103 = await v63(v101, v95, v96, v102);
    if (!v103) return false;
    const v104 = centerNodeAtWorldPosition(v103, v95, v96);
    if (v97["placement"] === "viewport-center-sequence") {
      const {
          spacing: v105,
          direction: v106,
          avoidOverlap: v107,
        } = getNodeSpawnPrefs(),
        v108 = normalizeSpawnDirection(v106),
        v109 = Number(v104["width"]) || 300,
        v110 = Number(v104["height"]) || 200,
        v111 = v95 - v109 / 2,
        v112 = v96 - v110 / 2,
        v113 = v67()["nodes"] || {},
        v114 = String(v97["sequenceKey"] || "")["trim"](),
        v115 = v107 ? v113 : getSequenceNodes(v113, v114),
        v116 = findAvailablePosition(v115, v111, v112, v109, v110, v105, v108);
      ((v104["x"] = v116["x"]), (v104["y"] = v116["y"]));
      if (v114) v104["spawnSequenceKey"] = v114;
    }
    return (
      (v104["name"] = v98["nodeName"]),
      v56["addNode"](v104),
      v56["setSelectedNodes"]([v104["id"]]),
      v57(),
      true
    );
  }
  async function v117(v118, v119, v120 = {}) {
    const { x: v121, y: v122 } = v68(v120);
    return await v92(v118, v119, v121, v122, v120);
  }
  function v123(v124) {
    if (typeof File !== "function") return null;
    const v125 = String(v124?.["path"] || "")["trim"](),
      v126 = String(
        v124?.["name"] || v125["split"](/[\\/]/)["pop"]() || "clipboard-file",
      ),
      v127 = String(v124?.["type"] || "")["trim"]();
    if (!v125 || !v127) return null;
    const v128 = new File([], v126, { type: v127 });
    try {
      Object["defineProperty"](v128, "path", {
        value: v125,
        configurable: true,
      });
    } catch {
      v128["path"] = v125;
    }
    return v128;
  }
  async function v129(v130, v131, v132) {
    const v133 = String(v130?.["type"] || "")["trim"](),
      v134 = resolvePastedMediaDescriptor(v133);
    if (!v134) return false;
    const v135 = v123(v130);
    if (!v135) return false;
    const v136 = v65?.() || "default_v2_project",
      v137 = await v63(v135, v131, v132, v136);
    if (!v137) return false;
    const v138 = centerNodeAtWorldPosition(v137, v131, v132);
    return (
      (v138["name"] = v134["nodeName"]),
      v56["addNode"](v138),
      v56["setSelectedNodes"]([v138["id"]]),
      v57(),
      true
    );
  }
  async function v139(v140, v141, v142) {
    if (!Array["isArray"](v140) || v140["length"] === 0) return 0;
    let v143 = 0;
    for (const v144 of v140) {
      const v145 = v143 * 30,
        v146 = await v129(v144, v141 + v145, v142 + v145);
      if (v146) v143 += 1;
    }
    return v143;
  }
  function v147(v148, v149, v150) {
    const { width: v151, height: v152 } = v59("source-text"),
      v153 = generateId("source-text");
    (v56["addNode"]({
      id: v153,
      type: "source-text",
      x: v149 - v151 / 2,
      y: v150 - v152 / 2,
      width: v151,
      height: v152,
      name: "粘贴文本",
      content: String(v148 || ""),
    }),
      v56["setSelectedNodes"]([v153]),
      v57());
  }
  async function v154(v155 = {}) {
    const { x: v156, y: v157 } = v68(v155),
      {
        getClipboard: v158,
        getClipboardMeta: v159,
        observeSystemClipboardSignature: v160,
      } = await loadClipboardModule(),
      v161 = v158(),
      v162 = v159(),
      {
        pastedFiles: v163,
        pastedMedia: v164,
        pastedText: v165,
        clipboardReadFailed: v166,
      } = await readSystemClipboardContents(),
      v167 = String(v165 || "")["trim"](),
      v168 = (Array["isArray"](v163) && v163["length"] > 0) || !!v164 || !!v167,
      v169 = v168
        ? buildSystemClipboardSignature({
            pastedFiles: v163,
            pastedMedia: v164,
            pastedText: v165,
          })
        : "",
      v170 = v161 && v161["length"] > 0,
      v171 = Number(v162?.["copiedAt"]) || 0,
      v172 = Number(v162?.["systemCopiedAt"]) || 0,
      v173 = String(v162?.["systemSignatureAtCopy"] || ""),
      v174 = String(v162?.["systemSignature"] || "");
    v169 && v160(v169);
    if (v170) {
      const v175 = v172 > v171 && v171 > 0,
        v176 = v171 > v172 && v172 > 0,
        v177 = !!v173 && !!v169,
        v178 = v177 ? v173 === v169 : false,
        v179 = v177 ? v173 !== v169 : false,
        v180 = !v173 && !!v174 && v174 === v169,
        v181 = !v168 || v178 || (v176 && v180);
      if (v181 && !v175 && !v179) {
        v64("paste", { x: v156, y: v157 });
        return;
      }
    }
    if (Array["isArray"](v163) && v163["length"] > 0) {
      const v182 = await v139(v163, v156, v157);
      if (v182 > 0) {
        v66?.(
          v182 === 1 ? "文件已粘贴到画布" : v182 + " 个文件已粘贴到画布",
          "success",
        );
        return;
      }
    }
    if (v164) {
      const v183 = await v92(v164["blob"], v164["mimeType"], v156, v157);
      if (v183) {
        const v184 = v164["mimeType"]["startsWith"]("image/")
          ? "图片"
          : v164["mimeType"]["startsWith"]("video/")
            ? "视频"
            : "音频";
        v66?.(v184 + "已粘贴到画布", "success");
        return;
      }
    }
    if (v167) {
      (v147(v167, v156, v157), v66?.("文本已粘贴到画布", "success"));
      return;
    }
    if (v161 && v161["length"] > 0) {
      v64("paste", { x: v156, y: v157 });
      return;
    }
    if (v166) {
      v66?.("读取剪贴板失败，请检查浏览器权限", "error");
      return;
    }
    v66?.("剪贴板中没有可粘贴的内容", "warning");
  }
  return {
    createNodeAtCursor: v80,
    createMediaNodeFromBlob: v117,
    handlePasteFromClipboard: v154,
  };
}
