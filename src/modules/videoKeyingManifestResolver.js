import {
  RH_VIDEO_MATTING_MODEL_ID,
  getModelManifest,
} from "../manifests/index.js";
export function getVideoKeyingExtension() {
  const v0 = getModelManifest(RH_VIDEO_MATTING_MODEL_ID)?.["extensions"]?.[
    "videoKeying"
  ];
  if (!v0) throw new Error("Video keying manifest extension missing");
  return v0;
}
export function getVideoKeyingModelId() {
  return getVideoKeyingExtension()["modelId"] || RH_VIDEO_MATTING_MODEL_ID;
}
export function getVideoKeyingExecutionId(v1) {
  return v1 === "remove"
    ? getVideoKeyingExtension()["removeExecutionId"]
    : getVideoKeyingExtension()["keyingExecutionId"];
}
export function isVideoKeyingModel(v2) {
  return (
    String(v2 || "")["trim"]() === getVideoKeyingModelId() ||
    !!getModelManifest(v2)?.["extensions"]?.["videoKeying"]
  );
}
