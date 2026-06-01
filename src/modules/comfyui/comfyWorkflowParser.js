export function isConnectionRef(value) {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "string" &&
    typeof value[1] === "number"
  );
}

export function guessFieldType(value, inputName) {
  const lc = String(inputName || "").toLowerCase();
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") {
    if (/strength|cfg|denoise/.test(lc)) return "slider";
    return "number";
  }
  if (typeof value === "string") {
    if (/prompt|text|description/.test(lc) || (value && value.length > 60)) {
      return "textarea";
    }
    if (/image|filename/.test(lc)) return "image";
    return "text";
  }
  return "text";
}

export function fieldKind(field) {
  if (!field || typeof field !== "object") return "setting";
  if (field.type === "image") return "image";
  if (
    field.type === "boolean" ||
    field.type === "number" ||
    field.type === "slider" ||
    field.type === "dropdown"
  ) {
    return "setting";
  }
  const key = `${field.input || ""} ${field.name || ""}`.toLowerCase();
  if (
    field.type === "textarea" ||
    field.type === "text" ||
    /prompt|text|提示词|正向|负向/.test(key)
  ) {
    return "prompt";
  }
  return "setting";
}

export function listWorkflowInputs(workflow) {
  const nodes = [];
  if (!workflow || typeof workflow !== "object") return nodes;
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (!node || typeof node !== "object") continue;
    const inputs = node.inputs && typeof node.inputs === "object" ? node.inputs : {};
    const editable = [];
    for (const [inputName, value] of Object.entries(inputs)) {
      if (isConnectionRef(value)) continue;
      editable.push({
        node: nodeId,
        input: inputName,
        value,
        classType: String(node.class_type || ""),
        title: String(node._meta?.title || node.class_type || nodeId),
      });
    }
    if (editable.length) {
      nodes.push({
        id: nodeId,
        title: String(node._meta?.title || node.class_type || nodeId),
        classType: String(node.class_type || ""),
        inputs: editable,
      });
    }
  }
  return nodes;
}

export function createFieldId(nodeId, inputName) {
  const base = String(nodeId || "").replace(/[^a-zA-Z0-9]+/g, "_");
  const input = String(inputName || "").replace(/[^a-zA-Z0-9]+/g, "_");
  return `f_${base}_${input}`.slice(0, 64);
}

export function humanizeComfyInputName(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  return raw
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getComfyFieldDisplayLabel(field, { compact = false } = {}) {
  const input = String(field?.input || "").trim();
  const name = String(field?.name || "").trim();
  if (!compact) return name || humanizeComfyInputName(input) || field?.id || "";
  if (name && !name.includes(".")) return name;
  if (input) return humanizeComfyInputName(input);
  if (name.includes(".")) return humanizeComfyInputName(name.split(".").pop());
  return name || field?.id || "";
}

export function buildDefaultConfigFromWorkflow(workflow, title = "") {
  const fields = [];
  for (const node of listWorkflowInputs(workflow)) {
    for (const input of node.inputs) {
      fields.push({
        id: createFieldId(input.node, input.input),
        node: input.node,
        input: input.input,
        name: humanizeComfyInputName(input.input) || input.input,
        type: guessFieldType(input.value, input.input),
        default: input.value,
        bindRole:
          input.input === "width"
            ? "width"
            : input.input === "height"
              ? "height"
              : "",
        min: null,
        max: null,
        step: null,
        options: [],
        random_enabled: false,
        exposed: false,
      });
    }
  }
  return {
    title: title || "ComfyUI Workflow",
    fields,
  };
}

export function getExposedFields(config) {
  const fields = Array.isArray(config?.fields) ? config.fields : [];
  return fields.filter((field) => field && field.exposed === true && field.node && field.input);
}

function getAllConfigFields(config) {
  const fields = Array.isArray(config?.fields) ? config.fields : [];
  return fields.filter((field) => field && field.node && field.input);
}

export function inferComfyFieldBindRole(field) {
  const role = String(field?.bindRole || "").trim().toLowerCase();
  if (role === "width" || role === "height") return role;
  const input = String(field?.input || "").trim().toLowerCase();
  if (input === "width") return "width";
  if (input === "height") return "height";
  return "";
}

export function findComfyDimensionFieldsFromWorkflow(workflow) {
  if (!workflow || typeof workflow !== "object") {
    return { widthField: null, heightField: null };
  }
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (!node || typeof node !== "object") continue;
    const inputs = node.inputs && typeof node.inputs === "object" ? node.inputs : {};
    const hasWidth = Object.prototype.hasOwnProperty.call(inputs, "width");
    const hasHeight = Object.prototype.hasOwnProperty.call(inputs, "height");
    if (!hasWidth || !hasHeight) continue;
    const widthValue = inputs.width;
    const heightValue = inputs.height;
    if (isConnectionRef(widthValue) || isConnectionRef(heightValue)) continue;
    return {
      widthField: {
        id: createFieldId(nodeId, "width"),
        node: nodeId,
        input: "width",
        bindRole: "width",
        type: "number",
      },
      heightField: {
        id: createFieldId(nodeId, "height"),
        node: nodeId,
        input: "height",
        bindRole: "height",
        type: "number",
      },
    };
  }
  return { widthField: null, heightField: null };
}

export function findComfyDimensionFields(config, workflow = null) {
  const fromWorkflow = findComfyDimensionFieldsFromWorkflow(workflow);
  if (fromWorkflow.widthField && fromWorkflow.heightField) {
    return fromWorkflow;
  }
  const fields = getAllConfigFields(config);
  const widthField =
    fields.find((field) => inferComfyFieldBindRole(field) === "width") || null;
  const heightField =
    fields.find((field) => inferComfyFieldBindRole(field) === "height") || null;
  return { widthField, heightField };
}

export function shouldInjectComfyDimensions(config, workflow = null) {
  if (resolveComfyWorkflowKind(config, workflow) === "edit") return false;
  const { widthField, heightField } = findComfyDimensionFields(config, workflow);
  return !!(widthField && heightField);
}

export function getSettingFields(config) {
  return getExposedFields(config).filter((field) => {
    const kind = fieldKind(field);
    return kind === "setting";
  });
}

export function getPromptFields(config) {
  return getExposedFields(config).filter((field) => fieldKind(field) === "prompt");
}

export function getImageFields(config) {
  return getExposedFields(config).filter((field) => fieldKind(field) === "image");
}

export function resolveComfyWorkflowKind(config, workflow = null) {
  const explicit = String(config?.workflowKind || "").trim().toLowerCase();
  if (explicit === "generate" || explicit === "edit" || explicit === "custom") {
    return explicit;
  }
  if (getImageFields(config).length > 0) return "edit";
  const { widthField, heightField } = findComfyDimensionFields(config, workflow);
  if (widthField && heightField) return "generate";
  return "custom";
}

export function isComfyGenerateWorkflow(config, workflow = null) {
  return shouldInjectComfyDimensions(config, workflow);
}

export function getComfyFooterSettingFields(config, workflow = null) {
  const settingFields = getSettingFields(config);
  if (!isComfyGenerateWorkflow(config, workflow)) return settingFields;
  return settingFields.filter((field) => {
    const role = inferComfyFieldBindRole(field);
    return role !== "width" && role !== "height";
  });
}
