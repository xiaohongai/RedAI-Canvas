import { getModelsByKind } from "../../manifests/index.js";
import {
  renderNodeModelMenu,
  renderNodeModelTrigger,
} from "../shared/nodeModelMenu.js";
function getAudioMenuMeta(v0) {
  const v1 = v0?.["extensions"]?.["audioMenu"];
  return v1 && typeof v1 === "object" ? v1 : null;
}
function isAudioModelMenuManifest(v2) {
  const v3 = getAudioMenuMeta(v2);
  if (v3?.["group"] !== "runninghubWorkflow") return false;
  if (v2?.["provider"] !== "runninghubwf") return false;
  const v4 = Array["isArray"](v2?.["uiPlacement"])
    ? v2["uiPlacement"]
    : ["modelMenu"];
  return !(v4["includes"]("toolbar") && !v4["includes"]("modelMenu"));
}
export function getAudioWorkflowMenuManifests() {
  return getModelsByKind("audio")
    ["filter"](isAudioModelMenuManifest)
    ["sort"]((v5, v6) => {
      const v7 = Number(getAudioMenuMeta(v5)?.["order"]),
        v8 = Number(getAudioMenuMeta(v6)?.["order"]),
        v9 = Number["isFinite"](v7) ? v7 : 0,
        v10 = Number["isFinite"](v8) ? v8 : 0;
      if (v9 !== v10) return v9 - v10;
      return String(v5["modelId"] || "")["localeCompare"](
        String(v6["modelId"] || ""),
      );
    });
}
export function buildAudioWorkflowItems(v11 = {}) {
  return getAudioWorkflowMenuManifests()["map"]((v12) =>
    Object["freeze"]({
      key: v12["modelId"],
      label: v12["displayName"],
      subtitle: v12["description"] || "",
      vip: v12["vip"] === true,
      validate: v11[v12["modelId"]] || (() => ""),
    }),
  );
}
export function buildAudioModelMenuHtml({
  activeModel: activeModel = "",
  workflowItems: workflowItems = [],
} = {}) {
  return renderNodeModelMenu({
    kind: "audio",
    activeModel: activeModel,
    groups: [
      {
        id: "runninghub",
        label: "RunningHUB工作流",
        subtitle: "音频生成工作流",
        icon: "images/RH.png",
        iconAlt: "runninghub",
        items: workflowItems["map"]((v13) => ({
          modelId: v13["key"],
          label: v13["label"],
          subtitle: v13["subtitle"],
          icon: "images/RH.png",
          iconAlt: "runninghub",
          vip: v13["vip"] === true,
        })),
      },
    ],
  });
}
export function buildAudioModelTriggerHtml({ label: label = "" } = {}) {
  return renderNodeModelTrigger({
    iconHtml:
      '<img src="images/RH.png" style="width:14px;height:14px;object-fit:contain;border-radius:3px;flex-shrink:0;" alt="runninghub">',
    label: label,
  });
}
