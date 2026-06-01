import { fetchComfyuiWorkflow } from "../../../api/comfyuiApi.js";
import {
  getExposedFields,
  getComfyFooterSettingFields,
  isComfyGenerateWorkflow,
  buildDefaultConfigFromWorkflow,
  findComfyDimensionFields,
} from "./comfyWorkflowParser.js";
import {
  bindComfyFieldControls,
  readComfyFieldValues,
  renderComfySettingFieldsHtml,
} from "./comfyFieldRenderer.js";
import { stripComfyAutoDimensionParams } from "./comfyParamMapper.js";
import {
  beginComfyPromptGuard,
  endComfyPromptGuard,
} from "./comfyPromptGuard.js";

const workflowCache = new Map();

export function invalidateComfyWorkflowCache(name) {
  if (name) workflowCache.delete(String(name || "").trim());
  else workflowCache.clear();
}

export const COMFYUI_MODEL_PREFIX = "comfyui/";

export function toComfyuiModelId(workflowName) {
  const name = String(workflowName || "").trim();
  return name ? COMFYUI_MODEL_PREFIX + name : "";
}

export function parseComfyuiModelId(modelId) {
  const model = String(modelId || "").trim();
  if (!model.startsWith(COMFYUI_MODEL_PREFIX)) return "";
  return model.slice(COMFYUI_MODEL_PREFIX.length);
}

export function isComfyuiEngine(nodeData) {
  if (String(nodeData?.imageEngine || "").trim() === "comfyui") return true;
  if (String(nodeData?.provider || "").trim() === "comfyui") return true;
  return !!parseComfyuiModelId(nodeData?.model);
}

export async function loadComfyWorkflowBundle(name) {
  const key = String(name || "").trim();
  if (!key) return null;
  if (workflowCache.has(key)) return workflowCache.get(key);
  const bundle = await fetchComfyuiWorkflow(key).catch(() => null);
  if (bundle) workflowCache.set(key, bundle);
  return bundle;
}

export function mountComfyEngineUi(footerEl, ctx) {
  if (!footerEl || footerEl.querySelector(".comfy-node-fields-slot")) return;
  const pills = footerEl.querySelector(".img-model-pills");
  if (!pills) return;

  const fieldsSlot = document.createElement("div");
  fieldsSlot.className = "comfy-node-fields-slot ui-schema-placement";
  fieldsSlot.hidden = true;

  pills.insertBefore(fieldsSlot, pills.querySelector(".prompt-actions"));

  const cleanupFieldControls = { fn: null };

  const refreshFields = async () => {
    beginComfyPromptGuard(ctx.nodeRef);
    ctx.cancelPromptHtmlCommit?.();
    try {
      cleanupFieldControls.fn?.();
      cleanupFieldControls.fn = null;
      const nodeData = ctx.getNodeData?.() || {};
      if (!isComfyuiEngine(nodeData)) {
        fieldsSlot.hidden = true;
        fieldsSlot.innerHTML = "";
        return;
      }
      const bundle = await loadComfyWorkflowBundle(nodeData.comfyWorkflow);
      const config = (await ensureComfyWorkflowConfig(nodeData.comfyWorkflow)) || {
        fields: [],
      };
      const displayTitle = resolveComfyWorkflowDisplayTitle(nodeData, config);
      const cachedTitle = String(config?.title || "").trim();
      if (
        cachedTitle &&
        cachedTitle !== String(nodeData?.comfyWorkflowTitle || "").trim()
      ) {
        ctx.updateNodeData?.({ comfyWorkflowTitle: cachedTitle });
      }
      ctx.updateModelLabel?.(displayTitle);
      const rawComfyParams =
        nodeData.comfyParams && typeof nodeData.comfyParams === "object"
          ? nodeData.comfyParams
          : {};
      const values = stripComfyAutoDimensionParams(
        rawComfyParams,
        config,
        bundle?.workflow,
      );
      const { widthField, heightField } = findComfyDimensionFields(
        config,
        bundle?.workflow,
      );
      const dimensionIds = new Set(
        [widthField?.id, heightField?.id].filter(Boolean),
      );
      const hadDimensionKeys = [...dimensionIds].some((key) =>
        Object.prototype.hasOwnProperty.call(rawComfyParams, key),
      );
      if (hadDimensionKeys) {
        ctx.updateNodeData?.({ comfyParams: values });
      }
      fieldsSlot.innerHTML = renderComfySettingFieldsHtml(
        getComfyFooterSettingFields(config, bundle?.workflow),
        values,
        { compact: true },
      );
      fieldsSlot.hidden = !getComfyFooterSettingFields(config, bundle?.workflow).length;
      cleanupFieldControls.fn = bindComfyFieldControls(fieldsSlot, {
        onChange: (fieldId, value) => {
          const current = ctx.getNodeData?.() || {};
          const nextParams = { ...(current.comfyParams || {}), [fieldId]: value };
          ctx.updateNodeData?.({ comfyParams: nextParams });
        },
      });
    } finally {
      endComfyPromptGuard(ctx.nodeRef);
    }
  };

  const syncVisibility = async () => {
    const nodeData = ctx.getNodeData?.() || {};
    const comfy = isComfyuiEngine(nodeData);
    footerEl.querySelector(".ui-schema-mode-slot")?.classList.toggle("hidden", comfy);
    footerEl.querySelector(".ui-schema-batch-slot")?.classList.toggle("hidden", comfy);
    footerEl.querySelector(".ui-schema-instance-slot")?.classList.toggle("hidden", comfy);
    footerEl.querySelector(".rh-adv-wrap")?.classList.toggle("hidden", comfy);
    footerEl.querySelector(".rh-adv-panel")?.classList.toggle("hidden", comfy);
    await refreshFields();
    const resolutionSlot = footerEl.querySelector(".ui-schema-resolution-slot");
    if (!comfy) {
      resolutionSlot?.classList.remove("hidden");
      return;
    }
    const config = getComfyWorkflowConfigFromCache(
      String(nodeData?.comfyWorkflow || "").trim(),
    );
    const cachedBundle = getComfyWorkflowBundleFromCache(
      String(nodeData?.comfyWorkflow || "").trim(),
    );
    const showResolution = isComfyGenerateWorkflow(
      config || {},
      cachedBundle?.workflow,
    );
    resolutionSlot?.classList.toggle("hidden", !showResolution);
  };

  ctx.refreshComfyEngineUi = syncVisibility;
  void syncVisibility();
}

export function readComfyFooterParams(footerEl) {
  const slot = footerEl?.querySelector(".comfy-node-fields-slot");
  return readComfyFieldValues(slot);
}

export function getComfyWorkflowConfigFromCache(name) {
  return workflowCache.get(String(name || "").trim())?.config || null;
}

export function getComfyWorkflowFallbackTitle(workflowName) {
  const raw = String(workflowName || "").trim();
  if (!raw) return "本地 ComfyUI";
  const base = raw.split("/").pop() || raw;
  return base.replace(/\.json$/i, "") || raw;
}

export function resolveComfyWorkflowDisplayTitle(nodeData, config = null) {
  const custom = String(nodeData?.comfyWorkflowTitle || "").trim();
  if (custom) return custom;
  const fromConfig = String(config?.title || "").trim();
  if (fromConfig) return fromConfig;
  return getComfyWorkflowFallbackTitle(nodeData?.comfyWorkflow);
}

export async function ensureComfyWorkflowConfig(name) {
  const bundle = await loadComfyWorkflowBundle(name);
  if (!bundle) return { fields: [] };
  let config =
    bundle.config && typeof bundle.config === "object"
      ? { ...bundle.config, fields: [...(bundle.config.fields || [])] }
      : { fields: [] };
  if (!Array.isArray(config.fields) || !config.fields.length) {
    config = buildDefaultConfigFromWorkflow(
      bundle.workflow,
      config.title || bundle.name,
    );
  }
  return config;
}

export function getComfyWorkflowBundleFromCache(name) {
  return workflowCache.get(String(name || "").trim()) || null;
}
