import { isComfyuiEngine } from "./comfyEngineUi.js";

const COMFY_PROMPT_POLLUTION_RE =
  /(?:eight|height){2,}|(?:输){2,}|(?:width|Width){2,}/gi;

export function buildComfyUiRefreshSignature(nodeData = {}) {
  if (!isComfyuiEngine(nodeData)) return "";
  const params =
    nodeData.comfyParams && typeof nodeData.comfyParams === "object"
      ? nodeData.comfyParams
      : {};
  const generationParams =
    nodeData.generationParams && typeof nodeData.generationParams === "object"
      ? nodeData.generationParams
      : {};
  return [
    String(nodeData.comfyWorkflow || "").trim(),
    String(nodeData.comfyWorkflowTitle || "").trim(),
    String(nodeData.model || "").trim(),
    String(nodeData.imageEngine || "").trim(),
    String(generationParams.imageSize || nodeData.imageSize || "").trim(),
    String(generationParams.aspectRatio || nodeData.aspectRatio || "").trim(),
    JSON.stringify(params),
  ].join("|");
}

export function stripComfyPromptPollution(value = "") {
  let text = String(value ?? "");
  if (!text) return text;
  text = text.replace(COMFY_PROMPT_POLLUTION_RE, "");
  text = text.replace(/\bheight\b/gi, "");
  text = text.replace(/\bwidth\b/gi, "");
  text = text.replace(/输{2,}/g, "");
  return text;
}

export function beginComfyPromptGuard(node) {
  if (!node) return;
  node._comfyPromptGuardDepth = (node._comfyPromptGuardDepth || 0) + 1;
}

export function endComfyPromptGuard(node) {
  if (!node || !node._comfyPromptGuardDepth) return;
  node._comfyPromptGuardDepth = Math.max(0, node._comfyPromptGuardDepth - 1);
}

export function isComfyPromptGuardActive(node) {
  return (node?._comfyPromptGuardDepth || 0) > 0;
}

export async function withComfyPromptGuard(node, fn) {
  beginComfyPromptGuard(node);
  try {
    return await fn();
  } finally {
    endComfyPromptGuard(node);
  }
}
