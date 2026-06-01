const MIN_SELECTION_SIZE = 8,
  ACTION_BAR_WIDTH = 92,
  ACTION_BAR_HEIGHT = 38,
  ACTION_BAR_MARGIN = 10,
  MAGNIFIER_SIZE = 172,
  MAGNIFIER_SAMPLE_SIZE = 56,
  MAGNIFIER_SCALE = 3,
  RESIZE_HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
function normalizeNumber(v0, v1 = 0) {
  const v2 = Number(v0);
  return Number["isFinite"](v2) ? v2 : v1;
}
function clamp(v3, v4, v5) {
  return Math["min"](Math["max"](v3, v4), v5);
}
function getViewportSize() {
  return {
    width: Math["max"](
      1,
      normalizeNumber(globalThis["window"]?.["innerWidth"], 1),
    ),
    height: Math["max"](
      1,
      normalizeNumber(globalThis["window"]?.["innerHeight"], 1),
    ),
  };
}
function getWindowScreenOrigin() {
  const v6 = globalThis["window"] || {};
  return {
    x: normalizeNumber(v6["screenX"] ?? v6["screenLeft"], 0),
    y: normalizeNumber(v6["screenY"] ?? v6["screenTop"], 0),
  };
}
function getCssTokenValue(v7, v8 = "") {
  const v9 = globalThis["document"],
    v10 = String(v7 || "")["trim"]();
  if (!v9?.["documentElement"] || !v10) return v8;
  const v11 = globalThis["getComputedStyle"]?.(v9["documentElement"])
    ?.["getPropertyValue"](v10)
    ?.["trim"]();
  return v11 || v8;
}
function normalizeRect(v12) {
  const v13 = normalizeNumber(v12?.["left"], 0),
    v14 = normalizeNumber(v12?.["top"], 0),
    v15 = Math["max"](0, normalizeNumber(v12?.["width"], 0)),
    v16 = Math["max"](0, normalizeNumber(v12?.["height"], 0));
  return { left: v13, top: v14, width: v15, height: v16 };
}
function rectFromPoints(v17, v18) {
  return normalizeRect({
    left: Math["min"](v17["x"], v18["x"]),
    top: Math["min"](v17["y"], v18["y"]),
    width: Math["abs"](v18["x"] - v17["x"]),
    height: Math["abs"](v18["y"] - v17["y"]),
  });
}
function clampRectToViewport(v19) {
  const v20 = getViewportSize(),
    v21 = Math["min"](
      Math["max"](MIN_SELECTION_SIZE, v19["width"]),
      v20["width"],
    ),
    v22 = Math["min"](
      Math["max"](MIN_SELECTION_SIZE, v19["height"]),
      v20["height"],
    );
  return {
    left: clamp(v19["left"], 0, Math["max"](0, v20["width"] - v21)),
    top: clamp(v19["top"], 0, Math["max"](0, v20["height"] - v22)),
    width: v21,
    height: v22,
  };
}
function applySelectionRect(v23, v24) {
  const v25 = normalizeRect(v24);
  return (
    (v23["style"]["left"] = v25["left"] + "px"),
    (v23["style"]["top"] = v25["top"] + "px"),
    (v23["style"]["width"] = v25["width"] + "px"),
    (v23["style"]["height"] = v25["height"] + "px"),
    v23["classList"]["add"]("is-active"),
    v25
  );
}
function positionActionBar(v26, v27) {
  const v28 = getViewportSize(),
    v29 = Math["min"](
      Math["max"](
        ACTION_BAR_MARGIN,
        v27["left"] + v27["width"] - ACTION_BAR_WIDTH,
      ),
      Math["max"](
        ACTION_BAR_MARGIN,
        v28["width"] - ACTION_BAR_WIDTH - ACTION_BAR_MARGIN,
      ),
    ),
    v30 = v27["top"] + v27["height"] + ACTION_BAR_MARGIN,
    v31 =
      v30 + ACTION_BAR_HEIGHT <= v28["height"] - ACTION_BAR_MARGIN
        ? v30
        : Math["max"](
            ACTION_BAR_MARGIN,
            v27["top"] - ACTION_BAR_HEIGHT - ACTION_BAR_MARGIN,
          );
  ((v26["style"]["left"] = v29 + "px"), (v26["style"]["top"] = v31 + "px"));
}
function positionMagnifier(v32, v33, v34) {
  const v35 = getViewportSize(),
    v36 = 18;
  let v37 = v33 + v36,
    v38 = v34 + v36;
  (v37 + MAGNIFIER_SIZE > v35["width"] - 8 &&
    (v37 = v33 - MAGNIFIER_SIZE - v36),
    v38 + MAGNIFIER_SIZE > v35["height"] - 8 &&
      (v38 = v34 - MAGNIFIER_SIZE - v36),
    (v32["style"]["left"] =
      clamp(v37, 8, Math["max"](8, v35["width"] - MAGNIFIER_SIZE - 8)) + "px"),
    (v32["style"]["top"] =
      clamp(v38, 8, Math["max"](8, v35["height"] - MAGNIFIER_SIZE - 8)) +
      "px"));
}
function loadImage(v39) {
  return new Promise((v40, v41) => {
    const v42 = new Image();
    ((v42["onload"] = () => v40(v42)),
      (v42["onerror"] = () =>
        v41(new Error("screenshot image failed to load"))),
      (v42["src"] = v39));
  });
}
function canvasToBlob(v43) {
  return new Promise((v44) => {
    v43["toBlob"]((v45) => v44(v45), "image/png");
  });
}
function mapClientPointToImage(v46, v47, v48, v49) {
  const v50 = v46["display"] || {},
    v51 = v50["bounds"] || {},
    v52 = v50["imageSize"] || {},
    v53 = normalizeNumber(v52["width"], v47["naturalWidth"] || v47["width"]),
    v54 = normalizeNumber(v52["height"], v47["naturalHeight"] || v47["height"]),
    v55 =
      v53 /
      Math["max"](
        1,
        normalizeNumber(
          v51["width"],
          globalThis["window"]?.["innerWidth"] || 1,
        ),
      ),
    v56 =
      v54 /
      Math["max"](
        1,
        normalizeNumber(
          v51["height"],
          globalThis["window"]?.["innerHeight"] || 1,
        ),
      ),
    v57 = getWindowScreenOrigin(),
    v58 = Math["round"]((v57["x"] + v48 - normalizeNumber(v51["x"], 0)) * v55),
    v59 = Math["round"]((v57["y"] + v49 - normalizeNumber(v51["y"], 0)) * v56);
  return {
    x: clamp(v58, 0, Math["max"](0, v53 - 1)),
    y: clamp(v59, 0, Math["max"](0, v54 - 1)),
    screenX: Math["round"](v57["x"] + v48),
    screenY: Math["round"](v57["y"] + v49),
  };
}
async function cropScreenshotToBlob(v60, v61, v62 = null) {
  const v63 = v62 || (await loadImage(v60["dataUrl"])),
    v64 = mapClientPointToImage(v60, v63, v61["left"], v61["top"]),
    v65 = mapClientPointToImage(
      v60,
      v63,
      v61["left"] + v61["width"],
      v61["top"] + v61["height"],
    ),
    v66 = v64["x"],
    v67 = v64["y"],
    v68 = Math["max"](1, v65["x"] - v64["x"]),
    v69 = Math["max"](1, v65["y"] - v64["y"]),
    v70 = document["createElement"]("canvas");
  ((v70["width"] = v68), (v70["height"] = v69));
  const v71 = v70["getContext"]("2d");
  if (!v71) return null;
  return (
    v71["drawImage"](v63, v66, v67, v68, v69, 0, 0, v68, v69),
    await canvasToBlob(v70)
  );
}
function getPixelRgb(v72, v73) {
  const v74 = document["createElement"]("canvas");
  ((v74["width"] = 1), (v74["height"] = 1));
  const v75 = v74["getContext"]("2d", { willReadFrequently: true });
  if (!v75) return [0, 0, 0];
  return (
    v75["drawImage"](v72, v73["x"], v73["y"], 1, 1, 0, 0, 1, 1),
    Array["from"](v75["getImageData"](0, 0, 1, 1)["data"]["slice"](0, 3))
  );
}
function drawMagnifier({
  magnifier: v76,
  canvas: v77,
  meta: v78,
  image: v79,
  capture: v80,
  event: v81,
}) {
  if (!v79) return;
  const v82 = mapClientPointToImage(v80, v79, v81["clientX"], v81["clientY"]),
    v83 = v77["getContext"]("2d");
  if (!v83) return;
  const v84 = MAGNIFIER_SAMPLE_SIZE,
    v85 = Math["floor"](v84 / 2),
    v86 = clamp(
      v82["x"] - v85,
      0,
      Math["max"](0, (v79["naturalWidth"] || v79["width"]) - v84),
    ),
    v87 = clamp(
      v82["y"] - v85,
      0,
      Math["max"](0, (v79["naturalHeight"] || v79["height"]) - v84),
    ),
    v88 = v84 * MAGNIFIER_SCALE;
  ((v83["imageSmoothingEnabled"] = false),
    v83["clearRect"](0, 0, v77["width"], v77["height"]),
    v83["drawImage"](v79, v86, v87, v84, v84, 0, 0, v88, v88));
  const v89 = Math["floor"](v88 / 2);
  ((v83["strokeStyle"] = getCssTokenValue("--green", "limegreen")),
    (v83["lineWidth"] = 1),
    v83["beginPath"](),
    v83["moveTo"](v89, 0),
    v83["lineTo"](v89, v88),
    v83["moveTo"](0, v89),
    v83["lineTo"](v88, v89),
    v83["stroke"]());
  const [v90, v91, v92] = getPixelRgb(v79, v82);
  ((v78["textContent"] =
    "POS:\x20(" +
    v82["screenX"] +
    ",\x20" +
    v82["screenY"] +
    ")\x0aRGB:\x20(" +
    v90 +
    "," +
    v91 +
    "," +
    v92 +
    ")"),
    positionMagnifier(v76, v81["clientX"], v81["clientY"]));
}
function buildResizeHandles() {
  return RESIZE_HANDLES["map"]((v93) => {
    const v94 = document["createElement"]("div");
    return (
      (v94["className"] =
        "canvas-screenshot-handle canvas-screenshot-handle--" + v93),
      (v94["dataset"]["handle"] = v93),
      v94
    );
  });
}
function resizeRectFromHandle(v95, v96, v97, v98) {
  let v99 = v95["left"],
    v100 = v95["top"],
    v101 = v95["width"],
    v102 = v95["height"];
  v96["includes"]("w") &&
    ((v99 = v95["left"] + v97), (v101 = v95["width"] - v97));
  v96["includes"]("e") && (v101 = v95["width"] + v97);
  v96["includes"]("n") &&
    ((v100 = v95["top"] + v98), (v102 = v95["height"] - v98));
  v96["includes"]("s") && (v102 = v95["height"] + v98);
  const v103 = v95["left"] + v95["width"],
    v104 = v95["top"] + v95["height"];
  if (v101 < MIN_SELECTION_SIZE) {
    if (v96["includes"]("w")) v99 = v103 - MIN_SELECTION_SIZE;
    v101 = MIN_SELECTION_SIZE;
  }
  if (v102 < MIN_SELECTION_SIZE) {
    if (v96["includes"]("n")) v100 = v104 - MIN_SELECTION_SIZE;
    v102 = MIN_SELECTION_SIZE;
  }
  return clampRectToViewport({
    left: v99,
    top: v100,
    width: v101,
    height: v102,
  });
}
function removeOverlay(v105) {
  v105?.["remove"]?.();
}
export async function startCanvasScreenshot({
  createImageNodeFromBlob: v106,
  showToast: v107,
} = {}) {
  const v108 = globalThis["window"]?.["electronAPI"]?.["screenshot"];
  if (typeof v108?.["captureDisplay"] !== "function")
    return (v107?.("当前环境不支持截图", "warn"), false);
  if (typeof v106 !== "function")
    return (v107?.("截图入口未就绪", "error"), false);
  let v109 = null;
  try {
    v109 = await v108["captureDisplay"]();
  } catch {
    v109 = null;
  }
  if (!v109?.["ok"] || !v109["dataUrl"])
    return (v107?.("截图失败，请稍后重试", "error"), false);
  const v110 = document["createElement"]("div");
  ((v110["className"] = "canvas-screenshot-overlay is-idle"),
    (v110["tabIndex"] = -1));
  const v111 = document["createElement"]("div");
  v111["className"] = "canvas-screenshot-backdrop";
  const v112 = document["createElement"]("div");
  ((v112["className"] = "canvas-screenshot-hint"),
    (v112["textContent"] = "拖拽选择截图区域，Esc\x20取消"));
  const v113 = document["createElement"]("div");
  ((v113["className"] = "canvas-screenshot-selection"),
    v113["append"](...buildResizeHandles()));
  const v114 = document["createElement"]("div");
  v114["className"] = "canvas-screenshot-actions";
  const v115 = document["createElement"]("button");
  ((v115["type"] = "button"),
    (v115["className"] =
      "canvas-screenshot-action\x20canvas-screenshot-action--confirm"),
    v115["setAttribute"]("aria-label", "确定截图"),
    (v115["textContent"] = "✓"));
  const v116 = document["createElement"]("button");
  ((v116["type"] = "button"),
    (v116["className"] =
      "canvas-screenshot-action canvas-screenshot-action--cancel"),
    v116["setAttribute"]("aria-label", "取消截图"),
    (v116["textContent"] = "×"),
    v114["append"](v115, v116));
  const v117 = document["createElement"]("div");
  v117["className"] = "canvas-screenshot-magnifier";
  const v118 = document["createElement"]("canvas");
  ((v118["width"] = MAGNIFIER_SAMPLE_SIZE * MAGNIFIER_SCALE),
    (v118["height"] = MAGNIFIER_SAMPLE_SIZE * MAGNIFIER_SCALE));
  const v119 = document["createElement"]("div");
  ((v119["className"] = "canvas-screenshot-magnifier-meta"),
    v117["append"](v118, v119),
    v110["append"](v111, v112, v113, v114, v117),
    document["body"]["appendChild"](v110),
    v110["focus"]?.());
  let v120 = "idle",
    v121 = null,
    v122 = null,
    v123 = null,
    v124 = false,
    v125 = null;
  const v126 = loadImage(v109["dataUrl"])
      ["then"]((v127) => {
        return ((v125 = v127), v127);
      })
      ["catch"](() => null),
    v128 = (v129) => {
      ((v120 = v129),
        v110["classList"]["toggle"]("is-idle", v129 === "idle"),
        v110["classList"]["toggle"]("is-selecting", v129 === "selecting"),
        v110["classList"]["toggle"]("is-selected", v129 === "selected"),
        v110["classList"]["toggle"]("is-busy", v129 === "busy"));
    },
    v130 = () => {
      if (!v121) return;
      ((v121 = applySelectionRect(v113, v121)),
        positionActionBar(v114, v121),
        v114["classList"]["add"]("is-active"),
        (v112["textContent"] = "可拖拽移动，拉动边角调整"));
    },
    v131 = () => {
      (globalThis["window"]?.["removeEventListener"]?.("keydown", v132, true),
        v110["removeEventListener"]("contextmenu", v133, true),
        removeOverlay(v110));
    },
    v134 = () => {
      ((v121 = null),
        (v123 = null),
        v113["classList"]["remove"]("is-active"),
        v114["classList"]["remove"]("is-active", "is-busy"),
        (v112["textContent"] = "拖拽选择截图区域，Esc 取消"),
        v128("idle"));
    },
    v135 = () => v131(),
    v136 = () => {
      if (v122 != null)
        try {
          v110["releasePointerCapture"]?.(v122);
        } catch {}
      ((v122 = null),
        v110["removeEventListener"]("pointermove", v137),
        v110["removeEventListener"]("pointerup", v138));
      if (
        !v121 ||
        v121["width"] < MIN_SELECTION_SIZE ||
        v121["height"] < MIN_SELECTION_SIZE
      ) {
        (v134(), v107?.("截图区域太小", "warn"));
        return;
      }
      ((v121 = clampRectToViewport(v121)), v128("selected"), v130());
    },
    v137 = (v139) => {
      if (!v123 || v124) return;
      const v140 = v139["clientX"] - v123["startX"],
        v141 = v139["clientY"] - v123["startY"];
      if (v123["type"] === "select") {
        ((v121 = rectFromPoints(
          { x: v123["startX"], y: v123["startY"] },
          { x: v139["clientX"], y: v139["clientY"] },
        )),
          applySelectionRect(v113, v121));
        return;
      }
      if (v123["type"] === "move") {
        ((v121 = clampRectToViewport({
          ...v123["startRect"],
          left: v123["startRect"]["left"] + v140,
          top: v123["startRect"]["top"] + v141,
        })),
          v130());
        return;
      }
      v123["type"] === "resize" &&
        ((v121 = resizeRectFromHandle(
          v123["startRect"],
          v123["handle"],
          v140,
          v141,
        )),
        v130());
    },
    v138 = () => {
      v136();
    },
    v142 = (v143, v144) => {
      (v143["preventDefault"](),
        (v122 = v143["pointerId"]),
        (v123 = { ...v144, startX: v143["clientX"], startY: v143["clientY"] }),
        v110["setPointerCapture"]?.(v143["pointerId"]),
        v110["addEventListener"]("pointermove", v137),
        v110["addEventListener"]("pointerup", v138, { once: true }));
    },
    v145 = async () => {
      if (v124 || v120 !== "selected" || !v121) return;
      ((v124 = true), v128("busy"), v114["classList"]["add"]("is-busy"));
      try {
        const v146 = v125 || (await v126),
          v147 = await cropScreenshotToBlob(v109, v121, v146);
        if (!v147) throw new Error("empty screenshot crop");
        (await v106(v147, "image/png", {
          name: "截图图片",
          typeSlug: "screenshot",
        }),
          v131(),
          v107?.("截图已添加到画布", "success"));
      } catch (v148) {
        (console["warn"]("[canvasScreenshot] crop failed:", v148),
          v131(),
          v107?.("截图添加失败", "error"));
      }
    };
  function v132(v149) {
    if (v149["key"] !== "Escape") return;
    (v149["preventDefault"](), v149["stopPropagation"](), v135());
  }
  function v133(v150) {
    (v150["preventDefault"](), v150["stopPropagation"]());
    if (v120 === "idle") {
      v135();
      return;
    }
    v134();
  }
  return (
    v110["addEventListener"]("pointermove", (v151) => {
      if (v120 !== "idle" || !v125) return;
      drawMagnifier({
        magnifier: v117,
        canvas: v118,
        meta: v119,
        image: v125,
        capture: v109,
        event: v151,
      });
    }),
    v110["addEventListener"]("pointerdown", (v152) => {
      if (v152["button"] === 2) {
        v152["preventDefault"]();
        if (v120 === "idle") v135();
        else v134();
        return;
      }
      if (v152["button"] !== 0 || v124) return;
      const v153 = v152["target"]?.["dataset"]?.["handle"] || "";
      if (v120 === "selected" && v153 && v121) {
        v142(v152, { type: "resize", handle: v153, startRect: { ...v121 } });
        return;
      }
      if (v120 === "selected" && v152["target"] === v113 && v121) {
        v142(v152, { type: "move", startRect: { ...v121 } });
        return;
      }
      if (v152["target"] !== v110 && v152["target"] !== v111) return;
      (v114["classList"]["remove"]("is-active"),
        v128("selecting"),
        (v121 = applySelectionRect(v113, {
          left: v152["clientX"],
          top: v152["clientY"],
          width: 0,
          height: 0,
        })),
        v142(v152, { type: "select" }));
    }),
    v114["addEventListener"]("pointerdown", (v154) => {
      v154["stopPropagation"]();
    }),
    v115["addEventListener"]("click", (v155) => {
      (v155["preventDefault"](), v155["stopPropagation"](), void v145());
    }),
    v116["addEventListener"]("click", (v156) => {
      (v156["preventDefault"](), v156["stopPropagation"](), v135());
    }),
    globalThis["window"]?.["addEventListener"]?.("keydown", v132, true),
    v110["addEventListener"]("contextmenu", v133, true),
    true
  );
}
