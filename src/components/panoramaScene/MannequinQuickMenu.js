export const PANORAMA_MANNEQUIN_COLOR_OPTIONS = Object["freeze"]([
  ["red", "红"],
  ["green", "绿"],
  ["blue", "蓝"],
  ["yellow", "黄"],
  ["purple", "紫"],
  ["cyan", "青"],
  ["white", "白"],
]);
export const PANORAMA_MANNEQUIN_GENDER_OPTIONS = Object["freeze"]([
  [
    "male",
    "男",
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><circle cx="10" cy="14" r="5"/><path d="M14.5 9.5 21 3"/><path d="M16 3h5v5"/></svg>',
  ],
  [
    "female",
    "女",
    "<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20width=\x2214\x22\x20height=\x2214\x22\x20aria-hidden=\x22true\x22><circle\x20cx=\x2212\x22\x20cy=\x228\x22\x20r=\x225\x22/><path\x20d=\x22M12\x2013v8\x22/><path\x20d=\x22M9\x2018h6\x22/></svg>",
  ],
]);
export function resolvePanoramaSceneColorToken(v0) {
  if (v0 === "yellow") return "gold";
  return v0;
}
export function createMannequinQuickMenu({
  onSelectColor: v1,
  onSelectGender: v2,
} = {}) {
  const v3 = document["createElement"]("div");
  ((v3["className"] = "panorama-mannequin-menu"),
    (v3["dataset"]["uiStop"] = "1"),
    (v3["dataset"]["activeGender"] = "male"));
  const v4 = document["createElement"]("div");
  ((v4["className"] = "panorama-mannequin-menu__title"),
    (v4["textContent"] = "创建人偶"),
    v3["appendChild"](v4));
  const v5 = document["createElement"]("div");
  ((v5["className"] =
    "panorama-mannequin-menu__row panorama-mannequin-menu__genders"),
    v3["appendChild"](v5),
    PANORAMA_MANNEQUIN_GENDER_OPTIONS["forEach"](([v6, v7, v8]) => {
      const v9 = document["createElement"]("button");
      ((v9["type"] = "button"),
        (v9["className"] = "panorama-mannequin-menu__gender-btn"),
        (v9["dataset"]["gender"] = v6),
        v6 === "male" && v9["classList"]["add"]("is-active"),
        v9["setAttribute"]("aria-label", "设置" + v7 + "性别人偶"),
        (v9["innerHTML"] = v8),
        v9["addEventListener"]("click", () => {
          ((v3["dataset"]["activeGender"] = v6), v2?.({ gender: v6 }));
        }),
        v5["appendChild"](v9));
    }));
  const v10 = document["createElement"]("div");
  return (
    (v10["className"] =
      "panorama-mannequin-menu__row panorama-mannequin-menu__colors"),
    v3["appendChild"](v10),
    PANORAMA_MANNEQUIN_COLOR_OPTIONS["forEach"](([v11, v12]) => {
      const v13 = document["createElement"]("button");
      ((v13["type"] = "button"),
        (v13["className"] = "panorama-mannequin-menu__color-btn"),
        (v13["dataset"]["colorKey"] = v11),
        v11 === "blue" && v13["classList"]["add"]("is-active"),
        v13["setAttribute"]("aria-label", "创建" + v12 + "色人偶"),
        v13["addEventListener"]("click", () => {
          const v14 =
            v3["dataset"]["activeGender"] === "female" ? "female" : "male";
          v1?.({ colorKey: v11, gender: v14 });
        }),
        v10["appendChild"](v13));
    }),
    v3
  );
}
export function renderMannequinQuickMenu(v15, v16) {
  if (!v15) return;
  const v17 =
    v16?.["gridPlacement"]?.["gender"] === "female" ? "female" : "male";
  ((v15["dataset"]["activeGender"] = v17),
    v15["querySelectorAll"](".panorama-mannequin-menu__gender-btn")["forEach"](
      (v18) => {
        const v19 = v18["dataset"]["gender"] === "female" ? "female" : "male";
        v18["classList"]["toggle"]("is-active", v19 === v17);
      },
    ));
  const v20 = v16?.["gridPlacement"]?.["colorKey"] || "blue";
  v15["querySelectorAll"](".panorama-mannequin-menu__color-btn")["forEach"](
    (v21) => {
      const v22 = v21["dataset"]["colorKey"];
      (v21["classList"]["toggle"]("is-active", v22 === v20),
        v21["style"]["setProperty"](
          "--panorama-scene-swatch-token",
          "var(--" + resolvePanoramaSceneColorToken(v22) + ")",
        ));
    },
  );
}
