import { fieldKind, getComfyFieldDisplayLabel } from "./comfyWorkflowParser.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderControl(field, value, { compact = false } = {}) {
  const id = escapeHtml(field.id);
  const name = escapeHtml(getComfyFieldDisplayLabel(field, { compact }));
  const title = escapeHtml(getComfyFieldDisplayLabel(field, { compact: false }));
  const titleAttr = title && title !== name ? ` title="${title}"` : "";
  if (compact) {
    if (field.type === "boolean") {
      const checked = value ? " checked" : "";
      return `<div class="comfy-field-inline comfy-field-inline-bool"${titleAttr}><span class="comfy-field-inline-label">${name}</span><input type="checkbox" class="comfy-field-input comfy-field-input--compact" data-comfy-field="${id}"${checked}></div>`;
    }
    if (field.type === "dropdown" && Array.isArray(field.options) && field.options.length) {
      const options = field.options
        .map((opt) => {
          const raw = typeof opt === "object" ? opt.value ?? opt.label : opt;
          const label = typeof opt === "object" ? opt.label ?? opt.value : opt;
          const selected = String(raw) === String(value ?? "") ? " selected" : "";
          return `<option value="${escapeHtml(raw)}"${selected}>${escapeHtml(label)}</option>`;
        })
        .join("");
      return `<div class="comfy-field-inline"${titleAttr}><span class="comfy-field-inline-label">${name}</span><select class="comfy-field-input comfy-field-input--compact" data-comfy-field="${id}">${options}</select></div>`;
    }
    const inputType =
      field.type === "number" || field.type === "slider" ? "number" : "text";
    return `<div class="comfy-field-inline"${titleAttr}><span class="comfy-field-inline-label">${name}</span><input type="${inputType}" class="comfy-field-input comfy-field-input--compact" data-comfy-field="${id}" value="${escapeHtml(value ?? "")}"></div>`;
  }
  if (field.type === "boolean") {
    const checked = value ? " checked" : "";
    return `<label class="comfy-field-bool"><input type="checkbox" data-comfy-field="${id}"${checked}><span>${name}</span></label>`;
  }
  if (field.type === "textarea") {
    return `<label class="comfy-field-label">${name}<textarea class="comfy-field-input" data-comfy-field="${id}" rows="2">${escapeHtml(value ?? "")}</textarea></label>`;
  }
  if (field.type === "slider") {
    const min = field.min ?? 0;
    const max = field.max ?? 1;
    const step = field.step ?? 0.01;
    return `<label class="comfy-field-label">${name}<input type="range" class="comfy-field-range" data-comfy-field="${id}" min="${min}" max="${max}" step="${step}" value="${escapeHtml(value ?? min)}"><span class="comfy-field-range-value">${escapeHtml(value ?? min)}</span></label>`;
  }
  if (field.type === "dropdown" && Array.isArray(field.options) && field.options.length) {
    const options = field.options
      .map((opt) => {
        const raw = typeof opt === "object" ? opt.value ?? opt.label : opt;
        const label = typeof opt === "object" ? opt.label ?? opt.value : opt;
        const selected = String(raw) === String(value ?? "") ? " selected" : "";
        return `<option value="${escapeHtml(raw)}"${selected}>${escapeHtml(label)}</option>`;
      })
      .join("");
    return `<label class="comfy-field-label">${name}<select class="comfy-field-input" data-comfy-field="${id}">${options}</select></label>`;
  }
  const inputType = field.type === "number" ? "number" : "text";
  return `<label class="comfy-field-label">${name}<input type="${inputType}" class="comfy-field-input comfy-pill-input" data-comfy-field="${id}" value="${escapeHtml(value ?? "")}"></label>`;
}

export function renderComfySettingFieldsHtml(fields, values = {}, options = {}) {
  const compact = options?.compact === true;
  const settingFields = (fields || []).filter((field) => fieldKind(field) === "setting");
  if (!settingFields.length) {
    return `<div class="comfy-fields-empty">暂无暴露参数</div>`;
  }
  const rowClass = compact ? "comfy-fields-row comfy-fields-row--compact" : "comfy-fields-row";
  return `<div class="${rowClass}">${settingFields
    .map(
      (field) =>
        `<div class="comfy-field-item${compact ? " comfy-field-item--compact" : ""}">${renderControl(field, values[field.id], { compact })}</div>`,
    )
    .join("")}</div>`;
}

export function bindComfyFieldControls(container, { onChange } = {}) {
  if (!container) return () => {};
  const handler = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const fieldId = target.getAttribute("data-comfy-field");
    if (!fieldId) return;
    let value;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      value = target.checked;
    } else if (target instanceof HTMLInputElement && target.type === "range") {
      value = target.value;
      const valueEl = target.parentElement?.querySelector(".comfy-field-range-value");
      if (valueEl) valueEl.textContent = target.value;
    } else {
      value = target.value;
    }
    onChange?.(fieldId, value, target);
  };
  container.addEventListener("input", handler);
  container.addEventListener("change", handler);
  return () => {
    container.removeEventListener("input", handler);
    container.removeEventListener("change", handler);
  };
}

export function readComfyFieldValues(container) {
  const values = {};
  if (!container) return values;
  container.querySelectorAll("[data-comfy-field]").forEach((el) => {
    const fieldId = el.getAttribute("data-comfy-field");
    if (!fieldId) return;
    if (el instanceof HTMLInputElement && el.type === "checkbox") {
      values[fieldId] = el.checked;
    } else {
      values[fieldId] = el.value;
    }
  });
  return values;
}
