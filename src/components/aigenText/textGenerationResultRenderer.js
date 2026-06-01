import {
  buildGenerationSingleResultPatch,
  firstNonEmptyString,
  getFirstGenerationResultError,
  normalizeGenerationResultItems,
} from "../../core/generationResultRenderer.js";
function asObject(v0) {
  return v0 && typeof v0 === "object" && !Array["isArray"](v0) ? v0 : null;
}
function normalizeTextGenerationResultItem(v1) {
  const v2 = asObject(v1);
  if (!v2) throw new Error("[textGenerationResult] item must be an object");
  const v3 = {
      ...v2,
      outputType: "text",
      outputText: firstNonEmptyString(
        v2["outputText"],
        v2["text"],
        v2["output"],
        v2["content"],
        v2["message"],
      ),
      metadata:
        v2["metadata"] && typeof v2["metadata"] === "object"
          ? { ...v2["metadata"] }
          : {},
    },
    v4 = firstNonEmptyString(v2["error"]);
  if (v4) v3["error"] = v4;
  return v3;
}
function getErrorMessage(v5, v6 = "") {
  if (typeof v5 === "string") return firstNonEmptyString(v5, v6);
  if (typeof v5?.["getUserMessage"] === "function")
    return firstNonEmptyString(
      v5["getUserMessage"](false),
      v5?.["message"],
      v6,
    );
  return firstNonEmptyString(v5?.["message"], v5?.["error"], v5, v6);
}
export function isTextGenerationTimeoutError(v7) {
  const v8 = String(v7?.["type"] || v7?.["code"] || "")
    ["trim"]()
    ["toUpperCase"]();
  if (v8 === "TIMEOUT" || v8 === "TASK_TIMEOUT") return true;
  const v9 = getErrorMessage(v7);
  return /(?:timeout|timed\s*out|read\s+timed\s*out|aborterror|请求超时|超时)/i[
    "test"
  ](v9);
}
export function buildTextGenerationTimeoutOutput(v10) {
  const v11 = getErrorMessage(v10);
  return [
    "**生成超时**",
    "",
    "API 在超时时间内没有返回结果，通常是厂商接口繁忙或上游模型响应过慢。",
    "请稍后重试，或先切换到其他可用模型。",
    v11 ? "" : "",
    v11 ? "错误详情：" + v11 : "",
  ]
    ["filter"]((v12, v13, v14) => v12 || v14[v13 - 1] !== "")
    ["join"]("\x0a")
    ["trim"]();
}
export function normalizeTextGenerationResult(v15) {
  const v16 = normalizeGenerationResultItems(v15, {
    collectionField: "texts",
    singleItemFields: ["outputText", "text", "output", "content", "message"],
  });
  if (v16["length"] === 0 && typeof v15 === "string")
    return {
      outputType: "text",
      items: [normalizeTextGenerationResultItem({ text: v15 })],
    };
  if (v16["length"] === 0) return { outputType: "text", items: [] };
  return {
    outputType: "text",
    items: v16["map"]((v17) => normalizeTextGenerationResultItem(v17)),
  };
}
export function getTextGenerationResultError(v18) {
  return getFirstGenerationResultError(
    v18?.["outputType"] === "text" && Array["isArray"](v18["items"])
      ? v18["items"]
      : v18,
    {
      collectionField: "texts",
      singleItemFields: ["outputText", "text", "output", "content", "message"],
    },
  );
}
export function buildTextGenerationResultPatch(
  v19,
  { startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const v20 =
      v19?.["outputType"] === "text" && Array["isArray"](v19["items"])
        ? v19
        : normalizeTextGenerationResult(v19),
    v21 =
      v20["items"]["length"] > 0
        ? v20
        : { outputType: "text", items: [{ outputText: "" }] };
  return buildGenerationSingleResultPatch(v21, {
    startedAt: startedAt,
    duration: duration,
    buildItemPatch: (v22) => {
      const v23 = firstNonEmptyString(v22["outputText"]);
      return v23 ? { outputText: v23 } : {};
    },
  });
}
export function buildTextGenerationFailurePatch({
  error: error = "",
  startedAt: startedAt = 0,
  duration: duration = null,
} = {}) {
  const v24 = getErrorMessage(error, "文本生成失败"),
    v25 = isTextGenerationTimeoutError(error)
      ? buildTextGenerationTimeoutOutput(error)
      : "";
  return buildGenerationSingleResultPatch(
    {
      outputType: "text",
      items: [{ error: v24, ...(v25 ? { outputText: v25 } : {}) }],
    },
    {
      startedAt: startedAt,
      duration: duration,
      buildItemPatch: (v26) => {
        const v27 = firstNonEmptyString(v26["outputText"]);
        return v27 ? { outputText: v27 } : {};
      },
    },
  );
}
