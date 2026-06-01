function normalizeGeminiPart(v0) {
  if (!v0 || typeof v0 !== "object") return null;
  if (typeof v0["text"] === "string") return { text: v0["text"] };
  const v1 = v0["inline_data"] || v0["inlineData"];
  if (
    v1 &&
    typeof v1 === "object" &&
    v1["data"] &&
    (v1["mime_type"] || v1["mimeType"])
  )
    return {
      inline_data: {
        mime_type: v1["mime_type"] || v1["mimeType"],
        data: v1["data"],
      },
    };
  const v2 = v0["file_data"] || v0["fileData"];
  if (v2 && typeof v2 === "object" && v2["file_uri"] && v2["mime_type"])
    return {
      file_data: { file_uri: v2["file_uri"], mime_type: v2["mime_type"] },
    };
  return null;
}
export function buildGenerateContentBody(v3, v4) {
  const v5 = Array["isArray"](v3)
      ? v3["map"](normalizeGeminiPart)["filter"](Boolean)
      : [{ text: String(v3 || "") }],
    v6 = {
      contents: [
        { role: "user", parts: v5["length"] > 0 ? v5 : [{ text: "" }] },
      ],
    },
    v7 = v4 || "You are a helpful assistant.";
  return (v7 && (v6["system_instruction"] = { parts: [{ text: v7 }] }), v6);
}
