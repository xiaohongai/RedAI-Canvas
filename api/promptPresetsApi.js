import { get as get, post as post } from "./requester.js";
export async function fetchPromptPresetsFromServer() {
  try {
    const v0 = await get("/api/v2/user/presets", { provider: "local" });
    return v0 && typeof v0 === "object" ? v0 : {};
  } catch {
    return {};
  }
}
export async function savePromptPresetToServer({
  nodeType: v1,
  title: v2,
  desc: desc = "",
  template: v3,
  triggerMode: triggerMode = "",
  thumbnailDataUrl: thumbnailDataUrl = "",
  thumbLocalPath: thumbLocalPath = "",
  originalTitle: originalTitle = "",
  installId: installId = "",
} = {}) {
  return await post(
    "/api/v2/user/presets/save",
    {
      nodeType: v1,
      title: v2,
      desc: desc,
      template: v3,
      triggerMode: triggerMode,
      thumbnailDataUrl: thumbnailDataUrl,
      thumbLocalPath: thumbLocalPath,
      originalTitle: originalTitle,
      installId: installId,
    },
    { provider: "local" },
  );
}
export async function deletePromptPresetFromServer({
  nodeType: v4,
  title: v5,
} = {}) {
  return await post(
    "/api/v2/user/presets/delete",
    { nodeType: v4, title: v5 },
    { provider: "local" },
  );
}
