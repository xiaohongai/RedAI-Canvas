import { getModelManifest } from "../../manifests/index.js";
function getPlainObject(v0) {
  return v0 && typeof v0 === "object" && !Array["isArray"](v0) ? v0 : {};
}
export function getImageNodeUiPolicy(v1) {
  return getPlainObject(getModelManifest(v1)?.["extensions"]?.["imageNodeUi"]);
}
export function getImageNodeInputGate(v2) {
  return getPlainObject(getImageNodeUiPolicy(v2)["inputGate"]);
}
export function shouldAlwaysShowImageRefBar(v3) {
  return getImageNodeUiPolicy(v3)["alwaysShowRefBar"] === true;
}
export function getImageNodeRootClass(v4) {
  return String(getImageNodeUiPolicy(v4)["rootClass"] || "")["trim"]();
}
export function shouldUseImageWorkflowBusyButton(v5) {
  return getImageNodeUiPolicy(v5)["workflowBusyButton"] === true;
}
export function getImageInputGateUploadedUrl(v6 = {}, v7 = {}) {
  const v8 = String(v7["uploadedUrlField"] || "")["trim"]();
  return v8 ? String(v6?.[v8] || "")["trim"]() : "";
}
export function buildImageInputGateClearPatch(v9 = {}) {
  const v10 = Array["isArray"](v9["clearFields"]) ? v9["clearFields"] : [];
  return Object["fromEntries"](
    v10["map"]((v11) => String(v11 || "")["trim"]())
      ["filter"](Boolean)
      ["map"]((v12) => [v12, ""]),
  );
}
export function getImageInputGateMissingMessage(v13 = {}) {
  return String(v13["missingMessage"] || "")["trim"]();
}
