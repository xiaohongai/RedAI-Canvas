import { getModelManifest, getModelsByKind } from "../../manifests/index.js";
import {
  APIMART_DREAMINA_VIDEO_DEFAULT_MODEL,
  resolveDreaminaStyleVideoProvider,
  isApimartDreaminaVideoModel,
} from "../../modules/dreaminaVideoModelHelper.js";
import { renderNodeMenuItem } from "../shared/nodeModelMenu.js";
export const RH_VIDEO_RESOLUTION_OPTIONS = Object["freeze"]([
  832, 1024, 1280, 1440, 1600, 1760, 1920,
]);
const RH_STANDARD_FPS_OPTIONS = Object["freeze"]([16, 24]),
  RH_V54_FPS_OPTIONS = Object["freeze"]([16, 24, 30]),
  RH_MIN_VIDEO_RESOLUTION = 832;
export function escapeHtml(v0) {
  return String(v0 || "")
    ["replace"](/&/g, "&amp;")
    ["replace"](/</g, "&lt;")
    ["replace"](/>/g, "&gt;")
    ["replace"](/"/g, "&quot;")
    ["replace"](/'/g, "&#39;");
}
export function buildRunningHubVideoWorkflowMenuItems(v1) {
  const v2 = getModelsByKind("video")["filter"](
    (v3) =>
      v3?.["provider"] === "runninghubwf" &&
      v3?.["adapterType"] === "workflow" &&
      !(
        v3?.["uiPlacement"]?.["includes"]("toolbar") &&
        !v3?.["uiPlacement"]?.["includes"]("modelMenu")
      ),
  );
  return v2["map"]((v4) => {
    return renderNodeMenuItem(
      {
        modelId: v4["modelId"],
        provider: v4["provider"] || "runninghubwf",
        label: v4["displayName"],
        description: v4["description"] || "",
        icon: v4["icon"] || "images/RH.png",
        iconAlt: "runninghub",
        vip: v4["vip"] === true,
      },
      { activeModel: v1 },
    );
  })["join"]("");
}
export function buildRunningHubVideoModelApiMenuItems(v5) {
  const v6 = getModelsByKind("video")
    ["filter"]((v7) => {
      if (v7?.["provider"] !== "runninghub") return false;
      if (v7?.["adapterType"] !== "modelApi") return false;
      if (
        v7?.["uiPlacement"]?.["includes"]("toolbar") &&
        !v7?.["uiPlacement"]?.["includes"]("modelMenu")
      )
        return false;
      return getManifestVideoMenu(v7)?.["role"] === "runninghubModel";
    })
    ["sort"](
      (v8, v9) =>
        Number(getManifestVideoMenu(v8)?.["order"] || 0) -
        Number(getManifestVideoMenu(v9)?.["order"] || 0),
    );
  return v6["map"]((v10) =>
    renderNodeMenuItem(
      {
        modelId: v10["modelId"],
        provider: v10["provider"] || "runninghub",
        label: getManifestVideoMenu(v10)?.["label"] || v10["displayName"],
        description:
          getManifestVideoMenu(v10)?.["subtitle"] || v10["description"] || "",
        icon: v10["icon"] || "images/RH.png",
        iconAlt: "runninghub",
        vip: v10["vip"] === true,
      },
      { activeModel: v5 },
    ),
  )["join"]("");
}
export function getDefaultRunningHubVideoWorkflowModelId() {
  return (
    getModelsByKind("video")["find"](
      (v11) =>
        v11?.["provider"] === "runninghubwf" &&
        v11?.["adapterType"] === "workflow" &&
        !(
          v11?.["uiPlacement"]?.["includes"]("toolbar") &&
          !v11?.["uiPlacement"]?.["includes"]("modelMenu")
        ),
    )?.["modelId"] || ""
  );
}
export function buildApimartVideoLogoHTML(v12 = 20) {
  const v13 = Number(v12) || 20,
    v14 = v13 <= 12 ? "node-menu-icon-small" : "node-menu-icon";
  return (
    '<div class="' +
    v14 +
    "\x20node-menu-icon-badge\x20node-menu-icon-badge-dark\x22>AM</div>"
  );
}
export function buildDreaminaVideoLogoHTML(v15 = 20) {
  const v16 = Number(v15) || 20;
  if (v16 <= 12)
    return '<img src="images/jimeng.png" class="image-model-trigger-icon image-model-trigger-icon-dreamina" alt="dreamina">';
  return '<img src="images/jimeng.png" class="node-menu-icon" alt="dreamina">';
}
export function buildVolcengineVideoLogoHTML(v17 = 20) {
  const v18 = Number(v17) || 20,
    v19 = v18 <= 12 ? "node-menu-icon-small" : "node-menu-icon";
  return (
    "<img\x20src=\x22images/volcengine.svg\x22\x20class=\x22" +
    v19 +
    "\x22\x20alt=\x22volcengine\x22>"
  );
}
function getManifestVideoMenu(v20) {
  return v20?.["extensions"]?.["videoMenu"] || null;
}
function getManifestDreaminaStyleVideo(v21) {
  return v21?.["extensions"]?.["dreaminaStyleVideo"] || null;
}
function getVideoManifestByMenuRole(v22) {
  return (
    getModelsByKind("video")
      ["filter"]((v23) => getManifestVideoMenu(v23)?.["role"] === v22)
      ["sort"](
        (v24, v25) =>
          Number(getManifestVideoMenu(v24)?.["order"] || 0) -
          Number(getManifestVideoMenu(v25)?.["order"] || 0),
      )[0] || null
  );
}
function getApimartVideoModelMenuManifests() {
  return getModelsByKind("video")
    ["filter"]((v26) => {
      if (v26?.["provider"] !== "apimart") return false;
      if (v26?.["adapterType"] !== "modelApi") return false;
      return getManifestVideoMenu(v26)?.["role"] === "apimartModel";
    })
    ["sort"](
      (v27, v28) =>
        Number(getManifestVideoMenu(v27)?.["order"] || 0) -
        Number(getManifestVideoMenu(v28)?.["order"] || 0),
    );
}
export function getDreaminaTaskModelMenuItems(v29, v30 = "dreamina") {
  const v31 = String(v30 || "dreamina")
      ["trim"]()
      ["toLowerCase"](),
    v32 = String(v29 || "")["trim"]();
  return getModelsByKind("video")
    ["filter"]((v33) => {
      if (v33?.["provider"] !== v31) return false;
      const v34 = getManifestDreaminaStyleVideo(v33);
      if (!v34) return false;
      return (
        Array["isArray"](v34["taskTypes"]) && v34["taskTypes"]["includes"](v32)
      );
    })
    ["sort"](
      (v35, v36) =>
        Number(getManifestDreaminaStyleVideo(v35)?.["order"] || 0) -
        Number(getManifestDreaminaStyleVideo(v36)?.["order"] || 0),
    )
    ["map"]((v37) => {
      const v38 = getManifestDreaminaStyleVideo(v37);
      return {
        model: v37["modelId"],
        title: v38["title"] || v37["displayName"] || v37["modelId"],
        subtitle:
          v38["subtitleByTaskType"]?.[v32] ||
          v38["subtitle"] ||
          v37["description"] ||
          "",
      };
    });
}
export function getDreaminaTaskModelMenuMeta(v39, v40 = "") {
  const v41 = getModelManifest(v39),
    v42 = resolveDreaminaStyleVideoProvider(v39, v40);
  if (!v41 || v41["provider"] !== v42) return null;
  const v43 = getManifestDreaminaStyleVideo(v41);
  if (!v43) return null;
  return {
    title: v43["title"] || v41["displayName"] || v41["modelId"],
    subtitle: v43["subtitle"] || v41["description"] || "",
  };
}
export function buildDreaminaOfficialVideoMenuItems() {
  const v44 = getVideoManifestByMenuRole("dreaminaOfficial"),
    v45 = getManifestVideoMenu(v44);
  if (!v44 || !v45) return [];
  return [
    {
      modelId: v44["modelId"],
      provider: v44["provider"],
      label: v45["label"] || v44["displayName"],
      subtitle: v45["subtitle"] || v44["description"] || "",
      iconHtml: buildDreaminaVideoLogoHTML(20),
      vip: v44["vip"] === true,
    },
  ];
}
export function buildVolcengineOfficialVideoMenuItems(v46 = "", v47 = "") {
  const v48 = getVideoManifestByMenuRole("volcengineOfficial"),
    v49 = getManifestVideoMenu(v48);
  if (!v48 || !v49) return [];
  const v50 = resolveDreaminaStyleVideoProvider(v46, v47),
    v51 = getModelManifest(v46);
  return [
    {
      modelId: v48["modelId"],
      provider: v48["provider"],
      label: v49["label"] || v48["displayName"],
      subtitle: v49["subtitle"] || v48["description"] || "",
      iconHtml: buildVolcengineVideoLogoHTML(20),
      active:
        v50 === "volcengine" && !!v51?.["extensions"]?.["dreaminaStyleVideo"],
      vip: v48["vip"] === true,
    },
  ];
}
export function buildApimartVideoMenuItemsHtml(v52, v53) {
  const v54 = getVideoManifestByMenuRole("apimartDreaminaEntry"),
    v55 = getManifestVideoMenu(v54),
    v56 = v54?.["modelId"] || APIMART_DREAMINA_VIDEO_DEFAULT_MODEL;
  return [
    renderNodeMenuItem({
      modelId: v56,
      provider: "apimart",
      label: v55?.["label"] || "即梦视频",
      description: v55?.["subtitle"] || "",
      iconHtml: buildDreaminaVideoLogoHTML(20),
      active: isApimartDreaminaVideoModel(v52, v53),
      attrs: { "data-apimart-jimeng": "1" },
    }),
    ...getApimartVideoModelMenuManifests()["map"]((v57) => {
      const v58 = getManifestVideoMenu(v57);
      return renderNodeMenuItem(
        {
          modelId: v57["modelId"],
          provider: "apimart",
          label: v57["displayName"],
          description: v58?.["disabledValue"]
            ? v57["description"] || ""
            : v58?.["subtitle"] || v57["description"] || "",
          iconHtml: buildApimartVideoLogoHTML(20),
          vip: v57["vip"] === true,
          attrs: { "data-apimart-video-model": "1" },
        },
        { activeModel: v52 },
      );
    }),
  ]["join"]("");
}
export function buildDreaminaTaskModelMenuHtml(v59, v60, v61 = "dreamina") {
  const v62 = resolveDreaminaStyleVideoProvider(v59, v61),
    v63 = getDreaminaTaskModelMenuItems(v60, v62),
    v64 =
      v62 === "apimart"
        ? buildApimartVideoLogoHTML(20)
        : v62 === "volcengine"
          ? buildVolcengineVideoLogoHTML(20)
          : '<img src="images/jimeng.png" class="node-menu-icon" alt="dreamina">';
  if (!v63["length"])
    return renderNodeMenuItem({
      label: "智能多帧",
      description: "暂未开放模型切换",
      iconHtml: v64,
      disabled: true,
    });
  return v63["map"]((v65) =>
    renderNodeMenuItem({
      modelId: v65["model"],
      provider: v62,
      label: v65["title"],
      description: v65["subtitle"],
      iconHtml: v64,
      active: v59 === v65["model"],
      attrs: { "data-dreamina-task-model": "1" },
    }),
  )["join"]("");
}
export function getRhV54FpsOptions() {
  return RH_V54_FPS_OPTIONS;
}
export function normalizeRhStandardFps(v66) {
  const v67 = Number(v66);
  return RH_STANDARD_FPS_OPTIONS["includes"](v67) ? v67 : 24;
}
export function normalizeRhV54Fps(v68) {
  const v69 = Number(v68);
  return getRhV54FpsOptions()["includes"](v69) ? v69 : 24;
}
export function normalizeRhVideoResolution(v70) {
  const v71 = Number(v70);
  return Number["isFinite"](v71)
    ? Math["max"](RH_MIN_VIDEO_RESOLUTION, Math["trunc"](v71))
    : RH_MIN_VIDEO_RESOLUTION;
}
export function arePlainObjectsEqual(v72, v73) {
  return JSON["stringify"](v72 || {}) === JSON["stringify"](v73 || {});
}
