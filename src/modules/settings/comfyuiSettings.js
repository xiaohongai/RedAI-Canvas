import {
  deleteComfyuiWorkflow,
  fetchComfyuiInstances,
  fetchComfyuiWorkflow,
  fetchComfyuiWorkflows,
  runComfyuiWorkflowTest,
  saveComfyuiInstances,
  saveComfyuiWorkflowConfig,
  uploadComfyuiWorkflow,
} from "../../../api/comfyuiApi.js";
import {
  buildDefaultConfigFromWorkflow,
  createFieldId,
  fieldKind,
  guessFieldType,
  listWorkflowInputs,
} from "../comfyui/comfyWorkflowParser.js";
import {
  bindComfyFieldControls,
  readComfyFieldValues,
  renderComfySettingFieldsHtml,
} from "../comfyui/comfyFieldRenderer.js";
import { fetchAppRuntimeInfoFromServer } from "../../../api/runtimeApi.js";
import { invalidateComfyWorkflowCache } from "../comfyui/comfyEngineUi.js";

const COMFYUI_SERVER_RESTART_HINT =
  "本地服务未加载 ComfyUI 接口，请完全退出并重新启动应用（或重启 server.py）后再试。";

function isComfyuiApiMissingError(err) {
  const status = Number(err?.status || err?.statusCode || 0);
  const message = String(err?.message || err || "").trim();
  return status === 404 || /not found/i.test(message);
}

async function ensureComfyuiApiAvailable() {
  try {
    const info = await fetchAppRuntimeInfoFromServer();
    if (info?.comfyuiApi === true) return true;
  } catch {}
  try {
    await fetchComfyuiWorkflows();
    return true;
  } catch (err) {
    if (isComfyuiApiMissingError(err)) return false;
    throw err;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

export function initComfyuiSettings() {
  const pane = document.getElementById("pane-comfyui");
  if (!pane) return;

  const statusEl = pane.querySelector("#comfyuiSettingsStatus");
  const instancesListEl = pane.querySelector("#comfyuiInstancesList");
  const workflowListEl = pane.querySelector("#comfyuiWorkflowList");
  const nodeListEl = pane.querySelector("#comfyuiNodeList");
  const previewEl = pane.querySelector("#comfyuiPreviewFields");
  const testResultEl = pane.querySelector("#comfyuiTestResult");
  const titleInput = pane.querySelector("#comfyuiWorkflowTitle");
  const fileInput = pane.querySelector("#comfyuiWorkflowFile");

  let instances = [];
  let workflows = [];
  let selectedName = "";
  let currentWorkflow = null;
  let currentConfig = { title: "", fields: [] };
  let previewValues = {};
  let previewCleanup = null;
  let selectWorkflowRequestId = 0;

  const setStatus = (text) => {
    if (statusEl) statusEl.textContent = text || "";
  };

  async function loadInstances() {
    const data = await fetchComfyuiInstances().catch(() => ({}));
    instances = Array.isArray(data.instances) ? data.instances : ["127.0.0.1:8188"];
    renderInstances();
  }

  function renderInstances() {
    if (!instancesListEl) return;
    instancesListEl.innerHTML = instances
      .map(
        (addr, index) => `
      <div class="comfyui-instance-row">
        <span class="comfyui-instance-index">${index + 1}</span>
        <input type="text" class="settings-input comfyui-instance-input" value="${escapeHtml(addr)}" data-index="${index}" placeholder="127.0.0.1:8188">
        <button type="button" class="settings-save-btn settings-btn-ghost comfyui-instance-remove" data-index="${index}">删除</button>
      </div>`,
      )
      .join("");
  }

  async function loadWorkflows() {
    const apiReady = await ensureComfyuiApiAvailable().catch(() => false);
    if (!apiReady) {
      setStatus(COMFYUI_SERVER_RESTART_HINT);
      return;
    }
    const data = await fetchComfyuiWorkflows().catch((err) => {
      if (isComfyuiApiMissingError(err)) {
        setStatus(COMFYUI_SERVER_RESTART_HINT);
        return { workflows: [] };
      }
      throw err;
    });
    workflows = Array.isArray(data.workflows) ? data.workflows : [];
    renderWorkflowList();
    if (selectedName && workflows.some((item) => item.name === selectedName)) {
      await selectWorkflow(selectedName);
    } else if (workflows.length) {
      await selectWorkflow(workflows[0].name);
    }
  }

  function renderWorkflowList() {
    if (!workflowListEl) return;
    workflowListEl.innerHTML = workflows
      .map(
        (item) => `
      <button type="button" class="comfyui-workflow-card ${item.name === selectedName ? "active" : ""}" data-name="${escapeAttr(item.name)}">
        <div class="comfyui-workflow-title">${escapeHtml(item.title || item.name)}</div>
        <div class="comfyui-workflow-meta">${item.field_count || 0} 个暴露字段</div>
      </button>`,
      )
      .join("");
  }

  async function selectWorkflow(name, { force = false } = {}) {
    const workflowName = String(name || "").trim();
    if (!workflowName) return;
    if (!force && workflowName === selectedName && currentWorkflow) {
      renderWorkflowList();
      return;
    }
    const requestId = ++selectWorkflowRequestId;
    selectedName = workflowName;
    renderWorkflowList();
    const bundle = await fetchComfyuiWorkflow(workflowName).catch(() => null);
    if (requestId !== selectWorkflowRequestId) return;
    if (!bundle) {
      setStatus("加载工作流失败");
      return;
    }
    currentWorkflow = bundle.workflow || {};
    currentConfig = bundle.config || buildDefaultConfigFromWorkflow(currentWorkflow, bundle.name);
    if (!Array.isArray(currentConfig.fields) || !currentConfig.fields.length) {
      currentConfig = buildDefaultConfigFromWorkflow(currentWorkflow, currentConfig.title);
    }
    if (titleInput) titleInput.value = currentConfig.title || "";
    previewValues = {};
    for (const field of currentConfig.fields) {
      if (field?.id !== undefined) previewValues[field.id] = field.default;
    }
    renderEditor();
    renderPreview();
    setStatus("");
  }

  function renderEditor() {
    if (!nodeListEl) return;
    if (!currentWorkflow) {
      nodeListEl.innerHTML = "";
      return;
    }
    const nodes = listWorkflowInputs(currentWorkflow);
    nodeListEl.innerHTML = nodes
      .map((node) => {
        const rows = node.inputs
          .map((input) => {
            const fieldId = createFieldId(input.node, input.input);
            const field =
              currentConfig.fields.find((item) => item.id === fieldId) ||
              currentConfig.fields.find(
                (item) => item.node === input.node && item.input === input.input,
              );
            const exposed = field ? field.exposed === true : false;
            const type = field?.type || guessFieldType(input.value, input.input);
            return `
            <div class="comfyui-field-row" data-field-id="${escapeHtml(fieldId)}">
              <label class="comfyui-field-expose">
                <input type="checkbox" class="comfyui-field-exposed" data-field-id="${escapeHtml(fieldId)}" ${exposed ? "checked" : ""}>
                <span>${escapeHtml(input.input)}</span>
              </label>
              <input type="text" class="settings-input comfyui-field-name" data-field-id="${escapeHtml(fieldId)}" value="${escapeHtml(field?.name || input.input)}" placeholder="显示名称">
              <select class="settings-input comfyui-field-type" data-field-id="${escapeHtml(fieldId)}">
                ${["text", "textarea", "number", "slider", "boolean", "dropdown", "image"]
                  .map(
                    (option) =>
                      `<option value="${option}" ${option === type ? "selected" : ""}>${option}</option>`,
                  )
                  .join("")}
              </select>
              <span class="comfyui-field-node">${escapeHtml(node.id)}</span>
            </div>`;
          })
          .join("");
        return `<div class="comfyui-node-block"><div class="comfyui-node-title">${escapeHtml(node.title)} <span class="comfyui-node-id">${escapeHtml(node.id)}</span></div>${rows}</div>`;
      })
      .join("");
  }

  function syncConfigFromEditor() {
    if (!currentConfig.fields?.length) {
      currentConfig = buildDefaultConfigFromWorkflow(currentWorkflow, currentConfig.title);
    }
    const fieldMap = new Map(currentConfig.fields.map((field) => [field.id, field]));
    nodeListEl?.querySelectorAll(".comfyui-field-row").forEach((row) => {
      const fieldId = row.getAttribute("data-field-id");
      if (!fieldId) return;
      const exposed = !!row.querySelector(".comfyui-field-exposed")?.checked;
      const name = row.querySelector(".comfyui-field-name")?.value || "";
      const type = row.querySelector(".comfyui-field-type")?.value || "text";
      const existing = fieldMap.get(fieldId);
      if (existing) {
        existing.exposed = exposed;
        existing.name = name;
        existing.type = type;
      }
    });
    currentConfig.title = titleInput?.value || currentConfig.title || "";
  }

  function renderPreview() {
    previewCleanup?.();
    previewCleanup = null;
    if (!previewEl) return;
    const exposed = currentConfig.fields.filter((field) => field.exposed === true);
    previewEl.innerHTML = renderComfySettingFieldsHtml(exposed, previewValues);
    previewCleanup = bindComfyFieldControls(previewEl, {
      onChange: (fieldId, value) => {
        previewValues[fieldId] = value;
      },
    });
  }

  pane.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.id === "btnComfyuiAddInstance") {
      instances.push("");
      renderInstances();
      return;
    }
    if (target.classList.contains("comfyui-instance-remove")) {
      const index = Number(target.dataset.index);
      instances = instances.filter((_, i) => i !== index);
      renderInstances();
      return;
    }
    if (target.id === "btnComfyuiSaveInstances") {
      const cleaned = [];
      instancesListEl?.querySelectorAll(".comfyui-instance-input").forEach((input) => {
        const value = String(input.value || "").trim();
        if (value && !cleaned.includes(value)) cleaned.push(value);
      });
      if (!cleaned.length) {
        window.showToast?.("请至少填一个 ComfyUI 后端地址", "warn");
        return;
      }
      setStatus("保存后端地址...");
      const result = await saveComfyuiInstances(cleaned).catch(() => null);
      instances = result?.instances || cleaned;
      renderInstances();
      setStatus("ComfyUI 后端地址已保存");
      return;
    }
    if (target.id === "btnComfyuiImportWorkflow") {
      fileInput?.click();
      return;
    }
    const workflowCard = target.closest(".comfyui-workflow-card");
    if (workflowCard instanceof HTMLElement) {
      event.preventDefault();
      event.stopPropagation();
      await selectWorkflow(workflowCard.getAttribute("data-name") || "");
      return;
    }
    if (target.id === "btnComfyuiSaveConfig") {
      syncConfigFromEditor();
      setStatus("保存配置...");
      await saveComfyuiWorkflowConfig(selectedName, currentConfig);
      invalidateComfyWorkflowCache(selectedName);
      await loadWorkflows();
      await selectWorkflow(selectedName, { force: true });
      setStatus("工作流配置已保存");
      return;
    }
    if (target.id === "btnComfyuiDeleteWorkflow") {
      if (!selectedName || !window.confirm("确定删除该工作流？")) return;
      await deleteComfyuiWorkflow(selectedName);
      selectedName = "";
      currentWorkflow = null;
      currentConfig = { title: "", fields: [] };
      await loadWorkflows();
      setStatus("工作流已删除");
      return;
    }
    if (target.id === "btnComfyuiRunTest") {
      syncConfigFromEditor();
      previewValues = readComfyFieldValues(previewEl);
      setStatus("测试运行中...");
      if (testResultEl) testResultEl.innerHTML = "";
      const result = await runComfyuiWorkflowTest(selectedName, {
        config: currentConfig,
        fields: previewValues,
      }).catch((err) => ({ error: err?.message || String(err) }));
      if (result?.error) {
        setStatus("测试失败");
        if (testResultEl) testResultEl.textContent = result.error;
        return;
      }
      setStatus("测试完成");
      const images = Array.isArray(result?.images) ? result.images : [];
      if (testResultEl) {
        testResultEl.innerHTML = images
          .map((url) => `<img class="comfyui-test-thumb" src="${escapeHtml(url)}" alt="result">`)
          .join("");
      }
      return;
    }
  });

  pane.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.classList.contains("comfyui-field-exposed")) {
      const fieldId = target.getAttribute("data-field-id");
      const field = currentConfig.fields.find((item) => item.id === fieldId);
      if (field) field.exposed = target.checked;
      renderPreview();
    }
  });

  pane.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.classList.contains("comfyui-instance-input")) {
      instances[Number(target.dataset.index)] = target.value;
    }
  });

  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const apiReady = await ensureComfyuiApiAvailable().catch(() => false);
      if (!apiReady) {
        window.showToast?.(COMFYUI_SERVER_RESTART_HINT, "warn");
        setStatus(COMFYUI_SERVER_RESTART_HINT);
        return;
      }
      const text = await file.text();
      const workflow = JSON.parse(text);
      setStatus("上传工作流...");
      const uploaded = await uploadComfyuiWorkflow({ name: file.name, workflow });
      await loadWorkflows();
      if (uploaded?.name) await selectWorkflow(uploaded.name);
      setStatus("工作流已导入");
    } catch (err) {
      const message = isComfyuiApiMissingError(err)
        ? COMFYUI_SERVER_RESTART_HINT
        : err?.message || "导入失败";
      window.showToast?.(message, "warn");
      setStatus(message);
    } finally {
      fileInput.value = "";
    }
  });

  titleInput?.addEventListener("input", () => {
    currentConfig.title = titleInput.value;
  });

  loadInstances();
  loadWorkflows();
}
