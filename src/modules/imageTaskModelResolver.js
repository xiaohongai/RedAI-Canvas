import { getModelProvider } from "../config/modelConfig.js";
import {
  normalizeProviderId,
  resolveModelExecution,
  resolveModelProvider,
} from "../manifests/index.js";
const RUNNINGHUB_TASK_PROVIDERS = new Set(["runninghub", "runninghubwf"]);
function addProviderId(v0, v1) {
  const v2 = normalizeProviderId(v1);
  if (v2) v0["add"](v2);
}
export function resolveImageTaskExecution(v3, v4 = "") {
  const v5 = normalizeProviderId(v4);
  return (
    resolveModelExecution(v3, { providerHint: v5 }) || resolveModelExecution(v3)
  );
}
export function getImageTaskProviderIds(v6, v7 = "") {
  const v8 = new Set();
  (addProviderId(v8, v7),
    addProviderId(
      v8,
      resolveModelProvider(v6, v7, { allowPrefixInference: false }),
    ));
  const v9 = resolveImageTaskExecution(v6, v7);
  return (
    addProviderId(v8, v9?.["modelManifest"]?.["provider"]),
    addProviderId(v8, v9?.["executionManifest"]?.["provider"]),
    v8
  );
}
export function resolveImageTaskProvider(v10, v11 = "", v12 = "grsai") {
  const v13 = normalizeProviderId(v11);
  if (v13) return v13;
  const v14 = resolveModelProvider(v10, "", {
    allowProviderHint: false,
    allowPrefixInference: false,
  });
  if (v14) return v14;
  return (
    normalizeProviderId(getModelProvider(String(v10 || "")["trim"]())) ||
    normalizeProviderId(v12)
  );
}
export function isRunningHubImageTaskModel(v15, v16 = "") {
  const v17 = getImageTaskProviderIds(v15, v16);
  return [...v17]["some"]((v18) => RUNNINGHUB_TASK_PROVIDERS["has"](v18));
}
export function isDreaminaImageTaskModel(v19, v20 = "") {
  return getImageTaskProviderIds(v19, v20)["has"]("dreamina");
}
export function isRunningHubModelApiImageTask(v21, v22 = "") {
  const v23 = getImageTaskProviderIds(v21, v22);
  if (!v23["has"]("runninghub")) return false;
  const v24 = resolveImageTaskExecution(v21, v22);
  return (
    v24?.["modelManifest"]?.["adapterType"] === "modelApi" &&
    v24?.["executionManifest"]?.["adapterType"] === "modelApi"
  );
}
export function shouldUseRunningHubOpenapiQuery(v25, v26 = "") {
  if (!isRunningHubImageTaskModel(v25, v26)) return false;
  if (isRunningHubModelApiImageTask(v25, v26)) return true;
  const v27 = resolveImageTaskExecution(v25, v26)?.["executionManifest"];
  return (
    v27?.["queryMode"] === "openapi-v2-query" ||
    v27?.["submitMode"] === "openapi-v2-ai-app"
  );
}
