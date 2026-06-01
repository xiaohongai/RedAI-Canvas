let clipData = null,
  clipMeta = {
    copiedAt: 0,
    systemSignatureAtCopy: "",
    systemCopiedAt: 0,
    systemSignature: "",
  };
function buildClipboardSignatureFromReadResult({
  files: files = [],
  mediaType: mediaType = "",
  mediaSize: mediaSize = 0,
  text: text = "",
} = {}) {
  if (Array["isArray"](files) && files["length"] > 0) {
    const v0 = files["map"]((v1) => String(v1?.["path"] || v1?.["name"] || ""))
      ["filter"](Boolean)
      ["slice"](0, 8)
      ["join"]("|");
    return "files:" + v0 + "|len:" + files["length"];
  }
  if (mediaType)
    return (
      "media:" +
      String(mediaType)["toLowerCase"]() +
      "|" +
      (Number(mediaSize) || 0)
    );
  const v2 = String(text || "");
  if (!v2["trim"]()) return "";
  const v3 = v2["slice"](0, 256);
  return "text:" + v3 + "|len:" + v2["length"];
}
function getBase64ByteLength(v4) {
  const v5 = String(v4 || "")["replace"](/\s/g, "");
  if (!v5) return 0;
  const v6 = v5["endsWith"]("==") ? 2 : v5["endsWith"]("=") ? 1 : 0;
  return Math["max"](0, Math["floor"]((v5["length"] * 3) / 4) - v6);
}
async function captureElectronClipboardSignatureBestEffort() {
  const v7 = globalThis?.["window"]?.["electronAPI"]?.["clipboard"];
  if (!v7) return "";
  try {
    if (typeof v7["readFileReferences"] === "function") {
      const v8 = await v7["readFileReferences"]();
      if (
        v8?.["ok"] &&
        Array["isArray"](v8["files"]) &&
        v8["files"]["length"] > 0
      ) {
        const v9 = buildClipboardSignatureFromReadResult({
          files: v8["files"],
        });
        if (v9) return v9;
      }
    }
    if (typeof v7["readImage"] === "function") {
      const v10 = await v7["readImage"]();
      if (v10?.["ok"] && v10["dataBase64"]) {
        const v11 = buildClipboardSignatureFromReadResult({
          mediaType: String(v10["mimeType"] || "image/png"),
          mediaSize: getBase64ByteLength(v10["dataBase64"]),
        });
        if (v11) return v11;
      }
    }
    if (typeof v7["readText"] === "function") {
      const v12 = await v7["readText"]();
      if (v12?.["ok"] && typeof v12["text"] === "string") {
        const v13 = buildClipboardSignatureFromReadResult({
          text: v12["text"],
        });
        if (v13) return v13;
      }
    }
  } catch (v14) {}
  return "";
}
async function captureSystemClipboardSignatureBestEffort() {
  const v15 = await captureElectronClipboardSignatureBestEffort();
  if (v15) return v15;
  try {
    const v16 = globalThis?.["navigator"]?.["clipboard"],
      v17 = typeof v16?.["read"] === "function",
      v18 = typeof v16?.["readText"] === "function";
    if (v17) {
      const v19 = await v16["read"]();
      for (const v20 of v19) {
        const v21 = v20["types"]["find"](
          (v22) =>
            v22["startsWith"]("image/") ||
            v22["startsWith"]("video/") ||
            v22["startsWith"]("audio/"),
        );
        if (v21) {
          const v23 = await v20["getType"](v21);
          return buildClipboardSignatureFromReadResult({
            mediaType: v21,
            mediaSize: v23?.["size"] || 0,
          });
        }
        if (v20["types"]["includes"]("text/plain")) {
          const v24 = await v20["getType"]("text/plain"),
            v25 = await v24["text"](),
            v26 = buildClipboardSignatureFromReadResult({ text: v25 });
          if (v26) return v26;
        }
      }
    }
    if (v18) {
      const v27 = await v16["readText"]();
      return buildClipboardSignatureFromReadResult({ text: v27 });
    }
  } catch (v28) {}
  return "";
}
export function markSystemClipboardWrite({
  signature: signature = "",
  mediaType: mediaType = "",
  mediaSize: mediaSize = 0,
  text: text = "",
} = {}) {
  const v29 =
    String(signature || "")["trim"]() ||
    buildClipboardSignatureFromReadResult({
      mediaType: mediaType,
      mediaSize: mediaSize,
      text: text,
    });
  clipMeta = {
    ...clipMeta,
    systemCopiedAt: Date["now"](),
    systemSignature: v29 || clipMeta["systemSignature"] || "",
  };
}
export function observeSystemClipboardSignature(v30) {
  const v31 = String(v30 || "")["trim"]();
  if (!v31) return;
  clipMeta = { ...clipMeta, systemSignature: v31 };
}
export function setClipboard(v32) {
  if (!v32 || v32["length"] === 0) {
    ((clipData = null),
      (clipMeta = { ...clipMeta, copiedAt: 0, systemSignatureAtCopy: "" }));
    return;
  }
  clipData = JSON["parse"](JSON["stringify"](v32));
  const v33 = Date["now"]();
  ((clipMeta = {
    ...clipMeta,
    copiedAt: v33,
    systemSignatureAtCopy: clipMeta["systemSignature"] || "",
  }),
    Promise["resolve"]()
      ["then"](async () => {
        const v34 = await captureSystemClipboardSignatureBestEffort();
        if (!clipData) return;
        if (clipMeta["copiedAt"] !== v33) return;
        clipMeta = {
          ...clipMeta,
          systemSignatureAtCopy: v34 || clipMeta["systemSignatureAtCopy"] || "",
        };
      })
      ["catch"](() => {}));
}
export function getClipboard() {
  if (!clipData) return null;
  return JSON["parse"](JSON["stringify"](clipData));
}
export function getClipboardMeta() {
  return { ...clipMeta };
}
