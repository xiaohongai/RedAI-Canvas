const canvasToBlob = (v0, v1) => new Promise((v2) => v0["toBlob"](v2, v1)),
  createSceneCanvas = ({ documentRef: v3, naturalW: v4, naturalH: v5 }) => {
    const v6 = v3["createElement"]("canvas");
    return ((v6["width"] = v4), (v6["height"] = v5), v6);
  },
  buildEraseInputCanvas = ({
    documentRef: v7,
    loaded: v8,
    maskCanvas: v9,
    naturalW: v10,
    naturalH: v11,
  }) => {
    const v12 = createSceneCanvas({
        documentRef: v7,
        naturalW: v10,
        naturalH: v11,
      }),
      v13 = v12["getContext"]("2d");
    v13["drawImage"](v8, 0, 0, v10, v11);
    const v14 = createSceneCanvas({
        documentRef: v7,
        naturalW: v10,
        naturalH: v11,
      }),
      v15 = v14["getContext"]("2d");
    return (
      (v15["fillStyle"] = "#00FF00"),
      v15["fillRect"](0, 0, v10, v11),
      v15["save"](),
      (v15["globalCompositeOperation"] = "destination-in"),
      v15["drawImage"](v9, 0, 0),
      v15["restore"](),
      v13["drawImage"](v14, 0, 0),
      v12
    );
  },
  buildRepaintInputCanvas = ({
    documentRef: v16,
    loaded: v17,
    maskCanvas: v18,
    naturalW: v19,
    naturalH: v20,
  }) => {
    const v21 = createSceneCanvas({
        documentRef: v16,
        naturalW: v19,
        naturalH: v20,
      }),
      v22 = v21["getContext"]("2d");
    return (
      v22["drawImage"](v17, 0, 0, v19, v20),
      v22["save"](),
      (v22["globalCompositeOperation"] = "destination-out"),
      v22["drawImage"](v18, 0, 0),
      v22["restore"](),
      v21
    );
  };
export const buildGenerationPayload = async ({
  scene: v23,
  commands: v24,
  promptText: v25,
  node: v26,
  imgUrl: v27,
  model: v28,
  provider: v29,
  imageSize: v30,
  erasePrompt: v31,
  loadImage: v32,
  createSelectionMaskCanvas: v33,
  getModelProvider: v34,
  notify: notify = () => {},
  documentRef: documentRef = null,
  urlApi: urlApi = null,
} = {}) => {
  const v35 = documentRef || globalThis["document"],
    v36 = urlApi || globalThis["URL"],
    v37 = Array["isArray"](v24) ? v24 : [];
  if (v23 === "erase") {
    if (!v37["length"]) return (notify("请先涂抹要擦除的区域", "warn"), null);
    const v38 = await v32(v27),
      v39 = v38["naturalWidth"] || v38["width"],
      v40 = v38["naturalHeight"] || v38["height"],
      v41 = v39 / (v26?.["width"] || 1),
      v42 = v40 / (v26?.["height"] || 1),
      v43 = v33(v39, v40, v41, v42),
      v44 = buildEraseInputCanvas({
        documentRef: v35,
        loaded: v38,
        maskCanvas: v43,
        naturalW: v39,
        naturalH: v40,
      }),
      v45 = await canvasToBlob(v44, "image/png");
    if (!v45) throw new Error("擦除输入图导出失败");
    const v46 = v36["createObjectURL"](v45);
    return {
      payload: {
        prompt: v31,
        model: v28,
        provider: v29 || v34(v28),
        imageSize: v30 || "1K",
        batchSize: 1,
        inputUrls: [v46],
        suppressAspectRatio: true,
      },
      inputUrl: v46,
      naturalWidth: v39,
      naturalHeight: v40,
    };
  }
  if (v23 === "repaint") {
    const v47 = String(v25 || "")["trim"]();
    if (!v37["length"]) return (notify("请先选中要重绘的区域", "warn"), null);
    if (!v47) return (notify("请输入重绘提示词", "warn"), null);
    const v48 = await v32(v27),
      v49 = v48["naturalWidth"] || v48["width"],
      v50 = v48["naturalHeight"] || v48["height"],
      v51 = v49 / (v26?.["width"] || 1),
      v52 = v50 / (v26?.["height"] || 1),
      v53 = v33(v49, v50, v51, v52),
      v54 = buildRepaintInputCanvas({
        documentRef: v35,
        loaded: v48,
        maskCanvas: v53,
        naturalW: v49,
        naturalH: v50,
      }),
      v55 = await canvasToBlob(v54, "image/png");
    if (!v55) throw new Error("重绘输入图导出失败");
    const v56 = v36["createObjectURL"](v55);
    return {
      payload: {
        prompt: v47,
        model: v28,
        provider: v29 || v34(v28),
        imageSize: v30 || "1K",
        batchSize: 1,
        inputUrls: [v56],
        suppressAspectRatio: true,
      },
      inputUrl: v56,
      naturalWidth: v49,
      naturalHeight: v50,
    };
  }
  return null;
};
