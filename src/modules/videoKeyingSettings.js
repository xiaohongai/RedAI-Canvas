import appStore from "../core/stores/appStore.js";
import { ensureConfig, getProviderConfig } from "../../api/configApi.js";
const RH_KEYING_FPS_OPTIONS = Object["freeze"]([16, 24, 30]);
export const RH_DEFAULT_KEYING_FPS = 24;
export const RH_DEFAULT_KEYING_RESOLUTION = 1024;
export const RH_DEFAULT_KEYING_MASK_MODE = "Sec";
export const RH_DEFAULT_INSTANCE_TYPE = "default";
const SOURCE_VIDEO_KEYING_MEMORY_KEY = "source-video";
export function getRhKeyingFpsOptions() {
  return RH_KEYING_FPS_OPTIONS;
}
export function hasUsableKeyingSettingValue(v0) {
  if (v0 === null || v0 === undefined) return false;
  if (typeof v0 === "string") return v0["trim"]()["length"] > 0;
  if (typeof v0 === "number") return Number["isFinite"](v0);
  return true;
}
export function normalizeRhKeyingFps(v1) {
  const v2 = Number(v1);
  return getRhKeyingFpsOptions()["includes"](v2) ? v2 : RH_DEFAULT_KEYING_FPS;
}
export function resolveSourceVideoKeyingSetting(v3, v4, v5) {
  const v6 = v3?.[v4];
  if (hasUsableKeyingSettingValue(v6)) return v6;
  const v7 = appStore["getFeatureSelection"]?.(
    SOURCE_VIDEO_KEYING_MEMORY_KEY,
    v4,
    undefined,
  );
  return hasUsableKeyingSettingValue(v7) ? v7 : v5;
}
export function normalizeRhKeyingResolution(v8) {
  const v9 = Number(v8);
  return Number["isFinite"](v9)
    ? Math["trunc"](v9)
    : RH_DEFAULT_KEYING_RESOLUTION;
}
export function normalizeRhInstanceType(v10) {
  return String(v10 || RH_DEFAULT_INSTANCE_TYPE) === "plus"
    ? "plus"
    : RH_DEFAULT_INSTANCE_TYPE;
}
export async function getRunningHubWorkflowApiKey() {
  await ensureConfig();
  const v11 = getProviderConfig("runninghubwf");
  return String(v11?.["apiKey"] || "")["trim"]();
}
