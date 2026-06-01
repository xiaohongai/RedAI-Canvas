import { getModelsByKind } from "../../manifests/index.js";
import { getTextProviderMenuGroups } from "../../manifests/text/textProviderMenuGroups.js";
import { getApiConfigSnapshot } from "../../../api/configApi.js";
import {
  createNvidiaTextModelEntry,
  prepareNvidiaTextModels,
} from "../../modules/nvidiaTextModels.js";
import { renderNodeMenuGroup } from "../shared/nodeModelMenu.js";
function escapeHtml(v0) {
  return String(v0 ?? "")
    ["replace"](/&/g, "&amp;")
    ["replace"](/</g, "&lt;")
    ["replace"](/>/g, "&gt;")
    ["replace"](/"/g, "&quot;")
    ["replace"](/'/g, "&#39;");
}
function getTextMenuMeta(v1) {
  const v2 = v1?.["extensions"]?.["textMenu"];
  return v2 && typeof v2 === "object" ? v2 : null;
}
function resolveTextIcon(v3) {
  const v4 = getTextMenuMeta(v3);
  if (v4?.["icon"]) return v4["icon"];
  const v5 = String(v3?.["modelId"] || "")["toLowerCase"]();
  if (v5["includes"]("deepseek")) return "deepseek";
  if (v5["includes"]("gpt")) return "oa";
  if (v5["includes"]("gemini")) return "gemini";
  if (v5["includes"]("qwen")) return "qwen";
  if (v5["includes"]("kimi")) return "moonshot";
  const v6 = String(v3?.["provider"] || "")["toLowerCase"]();
  if (v6 === "runninghub") return "gemini";
  if (v6 === "grsai") return "grsai";
  if (v6 === "ppio") return "ppio";
  if (v6 === "nvidia") return "nvidia";
  return v6 === "apimart" ? "am" : v6 || "am";
}
export function getTextModelMenuItems(v7) {
  const v8 = String(v7 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v8 === "nvidia") return getNvidiaTextModelMenuItems();
  return getModelsByKind("text")
    ["filter"](
      (v9) =>
        String(v9?.["provider"] || "")["toLowerCase"]() === v8 &&
        getTextMenuMeta(v9)?.["group"] === v8,
    )
    ["sort"]((v10, v11) => {
      const v12 = getTextMenuMeta(v10),
        v13 = getTextMenuMeta(v11);
      return (v12?.["order"] || 0) - (v13?.["order"] || 0);
    })
    ["map"]((v14) => {
      const v15 = getTextMenuMeta(v14) || {};
      return Object["freeze"]({
        modelId: v14["modelId"],
        provider: v14["provider"],
        title: v15["title"] || v14["displayName"],
        subtitle: v15["subtitle"] || v14["description"] || "",
        icon: resolveTextIcon(v14),
      });
    });
}
function getNvidiaTextModelMenuItems() {
  const v8a = getApiConfigSnapshot(),
    v8b = prepareNvidiaTextModels(v8a?.["providers"]?.["nvidia"] || {});
  return v8b["map"]((v8c) => {
    const v8d = getTextMenuMeta({
      modelId: v8c["modelId"],
      displayName: v8c["displayName"],
      provider: "nvidia",
      extensions: {
        textMenu: {
          group: "nvidia",
          order: v8c["order"],
          title: v8c["title"],
          subtitle: v8c["subtitle"],
          icon: v8c["icon"],
        },
      },
    }) || {
      group: "nvidia",
      order: v8c["order"],
      title: v8c["title"],
      subtitle: v8c["subtitle"],
      icon: v8c["icon"],
    };
    return Object["freeze"]({
      modelId: v8c["modelId"],
      provider: "nvidia",
      title: v8d["title"] || v8c["displayName"],
      subtitle: v8d["subtitle"] || v8c["subtitle"] || "",
      icon: resolveTextIcon({
        modelId: v8c["modelId"],
        provider: "nvidia",
        extensions: { textMenu: v8d },
      }),
    });
  });
}
export function buildNvidiaTextModelMenuItemsFromEntries(v8e = []) {
  return v8e
    ["map"]((v8f, v8g) => createNvidiaTextModelEntry(v8f["model"], v8f, v8g))
    ["filter"](Boolean)
    ["map"]((v8h) =>
      Object["freeze"]({
        modelId: v8h["modelId"],
        provider: "nvidia",
        title: v8h["title"],
        subtitle: v8h["subtitle"] || "",
        icon: v8h["icon"],
      }),
    );
}
export const TEXT_MODEL_MENU_ITEMS_BY_PROVIDER = Object["freeze"]({
  grsai: Object["freeze"](getTextModelMenuItems("grsai")),
  ppio: Object["freeze"](getTextModelMenuItems("ppio")),
  apimart: Object["freeze"](getTextModelMenuItems("apimart")),
  runninghub: Object["freeze"](getTextModelMenuItems("runninghub")),
  volcengine: Object["freeze"](getTextModelMenuItems("volcengine")),
  nvidia: Object["freeze"](getTextModelMenuItems("nvidia")),
});
export const TEXT_MODEL_IDS_BY_PROVIDER = Object["freeze"](
  Object["fromEntries"](
    Object["entries"](TEXT_MODEL_MENU_ITEMS_BY_PROVIDER)["map"](
      ([v16, v17]) => [
        v16,
        Object["freeze"](v17["map"]((v18) => v18["modelId"])),
      ],
    ),
  ),
);
export const TEXT_MODEL_DISPLAY_NAME_MAP = Object["freeze"](
  Object["fromEntries"](
    Object["values"](TEXT_MODEL_MENU_ITEMS_BY_PROVIDER)
      ["flat"]()
      ["map"]((v19) => [v19["modelId"], v19["title"]]),
  ),
);
export const APIMART_TEXT_MODEL_MENU_ITEMS = Object["freeze"](
  TEXT_MODEL_MENU_ITEMS_BY_PROVIDER["apimart"],
);
export const APIMART_TEXT_MODEL_IDS = Object["freeze"](
  TEXT_MODEL_IDS_BY_PROVIDER["apimart"],
);
export const APIMART_TEXT_MODEL_DISPLAY_NAME_MAP = Object["freeze"](
  Object["fromEntries"](
    APIMART_TEXT_MODEL_MENU_ITEMS["map"]((v20) => [
      v20["modelId"],
      v20["title"],
    ]),
  ),
);
export const RUNNINGHUB_TEXT_MODEL_MENU_ITEMS = Object["freeze"](
  TEXT_MODEL_MENU_ITEMS_BY_PROVIDER["runninghub"],
);
export const RUNNINGHUB_TEXT_MODEL_IDS = Object["freeze"](
  TEXT_MODEL_IDS_BY_PROVIDER["runninghub"],
);
export const VOLCENGINE_TEXT_MODEL_MENU_ITEMS = Object["freeze"](
  TEXT_MODEL_MENU_ITEMS_BY_PROVIDER["volcengine"],
);
export const VOLCENGINE_TEXT_MODEL_IDS = Object["freeze"](
  TEXT_MODEL_IDS_BY_PROVIDER["volcengine"],
);
export const NVIDIA_TEXT_MODEL_MENU_ITEMS = Object["freeze"](
  TEXT_MODEL_MENU_ITEMS_BY_PROVIDER["nvidia"],
);
export const NVIDIA_TEXT_MODEL_IDS = Object["freeze"](
  TEXT_MODEL_IDS_BY_PROVIDER["nvidia"],
);
export function findTextModelMenuItem(v21) {
  const v22 = String(v21 || "")["trim"]();
  if (!v22) return null;
  for (const v22a of [
    "grsai",
    "ppio",
    "apimart",
    "runninghub",
    "volcengine",
    "nvidia",
  ]) {
    const v22b = getTextModelMenuItems(v22a)["find"]((v22c) => v22c["modelId"] === v22);
    if (v22b) return v22b;
  }
  return null;
}
export function buildTextModelIconHTML(v24, v25 = 20) {
  const v26 = Math["max"](10, Number(v25) || 20),
    v27 = v26 <= 12 ? "text-model-icon-small" : "text-model-icon";
  if (v24 === "deepseek")
    return (
      "<img\x20src=\x22images/deepseek.svg\x22\x20class=\x22" +
      v27 +
      '" alt="deepseek">'
    );
  if (v24 === "gemini")
    return '<img src="images/gemini.svg" class="' + v27 + '" alt="gemini">';
  if (v24 === "qwen")
    return (
      '<img src="images/qwen.svg" class="' + v27 + "\x22\x20alt=\x22qwen\x22>"
    );
  if (v24 === "grsai")
    return (
      '<img src="images/grsai.png" class="' +
      v27 +
      ' text-model-icon-padded" alt="grsai">'
    );
  if (v24 === "ppio")
    return (
      '<img src="images/ppio.png" class="' + v27 + "\x22\x20alt=\x22ppio\x22>"
    );
  if (v24 === "runninghub")
    return '<img src="images/RH.png" class="' + v27 + '" alt="runninghub">';
  if (v24 === "volcengine")
    return (
      '<img src="images/volcengine.svg" class="' + v27 + '" alt="volcengine">'
    );
  if (v24 === "nvidia")
    return (
      '<div class="' +
      v27 +
      ' text-model-icon-badge text-model-icon-nvidia"><span>NV</span></div>'
    );
  if (v24 === "moonshot")
    return (
      '<div class="' +
      v27 +
      ' text-model-icon-badge text-model-icon-moonshot"><span>M</span></div>'
    );
  const v28 = v24 === "oa" ? "OA" : "AM";
  return (
    "<div\x20class=\x22" + v27 + ' text-model-icon-badge">' + v28 + "</div>"
  );
}
export function buildTextModelSmallIconHTML(v29) {
  const v30 = findTextModelMenuItem(v29);
  return v30 ? buildTextModelIconHTML(v30["icon"], 12) : "";
}
export function buildTextModelMenuHTML(v31, v32) {
  const v33 = getTextModelMenuItems(String(v32 || "")["toLowerCase"]());
  return v33["map"](
    ({ modelId: v34, provider: v35, title: v36, subtitle: v37, icon: v38 }) =>
      '\n                  <div class="floating-menu-item node-menu-item ' +
      (v31 === v34 ? "active" : "") +
      "\x22\x20data-value=\x22" +
      escapeHtml(v34) +
      '" data-provider="' +
      escapeHtml(v35) +
      '">\n                    ' +
      buildTextModelIconHTML(v38, 20) +
      '\n                    <div class="fmi-content">\n                      <div class="fmi-title">' +
      escapeHtml(v36) +
      "</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22fmi-sub\x22>" +
      escapeHtml(v37) +
      "</div>\n                    </div>\n                  </div>",
  )["join"]("");
}
export function buildTextProviderMenuGroupsHTML(v39, v40 = {}) {
  const v41 = Array["isArray"](v40["providers"])
    ? new Set(v40["providers"]["map"]((v42) => String(v42)["toLowerCase"]()))
    : null;
  return getTextProviderMenuGroups()
    ["filter"]((v43) => !v41 || v41["has"](v43["id"]))
    ["map"]((v44) =>
      renderNodeMenuGroup(
        {
          id: v44["id"],
          headerClass: v44["id"] + "-group-header",
          submenuClass: v44["id"] + "-submenu",
          toggleAttr: "data-" + v44["id"] + "-toggle",
          label: v44["label"],
          subtitle: v44["subtitle"],
          iconHtml:
            v44["icon"] === "runninghub"
              ? '<img src="images/RH.png" class="text-model-icon" alt="runninghub">'
              : buildTextModelIconHTML(v44["icon"], 20),
          itemsHtml: buildTextModelMenuHTML(v39, v44["id"]),
        },
        { activeModel: v39 },
      ),
    )
    ["join"]("");
}
export function buildApimartTextModelMenuHTML(v45) {
  return buildTextModelMenuHTML(v45, "apimart");
}
export function buildRunningHubTextModelMenuHTML(v46) {
  return buildTextModelMenuHTML(v46, "runninghub");
}
export const PROVIDER_CONFIG_SAVED_EVENT = "aicanvas:provider-config-saved";
export function refreshNvidiaTextModelSubmenus() {
  prepareNvidiaTextModels(getApiConfigSnapshot()?.["providers"]?.["nvidia"] || {});
  document["querySelectorAll"](".nvidia-submenu")["forEach"]((v47) => {
    const v48 = v47["closest"](".img-model-menu"),
      v49 = v48?.["querySelector"](".floating-menu-item.active[data-value]"),
      v50 = v49?.["dataset"]?.["value"] || "";
    v47["innerHTML"] = buildTextModelMenuHTML(v50, "nvidia");
  });
}
if (typeof window !== "undefined") {
  window["addEventListener"]?.(PROVIDER_CONFIG_SAVED_EVENT, () => {
    refreshNvidiaTextModelSubmenus();
  });
}
