export function createCameraPresetList() {
  const v0 = document["createElement"]("div");
  return (
    (v0["className"] = "panorama-camera-dock"),
    (v0["dataset"]["uiStop"] = "1"),
    v0
  );
}
function normalizeCameraSlot(v1) {
  const v2 = Number(v1);
  if (!Number["isInteger"](v2)) return null;
  if (v2 < 1 || v2 > 10) return null;
  return v2;
}
function resolveCameraSlotEntries(v3 = []) {
  const v4 = Array["isArray"](v3) ? v3 : [],
    v5 = new Set(),
    v6 = [];
  return (
    v4["forEach"]((v7) => {
      const v8 = normalizeCameraSlot(v7?.["slot"]);
      if (!v8 || v5["has"](v8)) return;
      (v5["add"](v8), v6["push"]({ camera: v7, slot: v8 }));
    }),
    v4["forEach"]((v9) => {
      if (v6["some"]((v10) => v10["camera"]?.["id"] === v9?.["id"])) return;
      for (let v11 = 1; v11 <= 10; v11 += 1) {
        if (v5["has"](v11)) continue;
        (v5["add"](v11), v6["push"]({ camera: v9, slot: v11 }));
        break;
      }
    }),
    v6["sort"]((v12, v13) => v12["slot"] - v13["slot"])
  );
}
function createCameraButton(
  v14,
  v15,
  { onActivate: v16, onDelete: v17, onContextMenu: v18 } = {},
) {
  const { camera: v19, slot: v20 } = v14,
    v21 = document["createElement"]("div");
  ((v21["className"] = "panorama-camera-dock__item"),
    (v21["dataset"]["cameraId"] = v19["id"]),
    (v21["dataset"]["cameraSlot"] = String(v20)),
    (v21["tabIndex"] = 0));
  const v22 = v20 >= 1 && v20 <= 9,
    v23 = v22 ? String(v20) : "";
  v21["setAttribute"]("aria-label", v19["name"] || "机位书签\x20" + v20);
  const v24 = v15?.["viewport"]?.["activeCameraId"] === v19["id"],
    v25 =
      v15?.["selection"]?.["selectedObjectType"] === "camera" &&
      v15?.["selection"]?.["selectedObjectId"] === v19["id"];
  (v24 || v25) && v21["classList"]["add"]("is-active");
  const v26 = document["createElement"]("button");
  ((v26["type"] = "button"),
    (v26["className"] = "panorama-camera-dock__activate"),
    v26["setAttribute"]("aria-label", v21["getAttribute"]("aria-label") || ""));
  const v27 = document["createElement"]("span");
  ((v27["className"] = "panorama-camera-dock__number"),
    (v27["textContent"] = v23),
    v26["appendChild"](v27));
  const v28 = document["createElement"]("button");
  return (
    (v28["type"] = "button"),
    (v28["className"] = "panorama-camera-dock__delete"),
    (v28["textContent"] = "×"),
    (v28["hidden"] = true),
    v28["setAttribute"]("aria-label", "删除机位书签"),
    v26["appendChild"](v28),
    v26["addEventListener"]("click", (v29) => {
      (v29["preventDefault"](),
        v29["stopPropagation"](),
        v16?.(v19["id"], v20));
    }),
    v26["addEventListener"]("keydown", (v30) => {
      if (v30["key"] !== "Enter" && v30["key"] !== "\x20") return;
      (v30["preventDefault"](),
        v30["stopPropagation"](),
        v16?.(v19["id"], v20));
    }),
    v21["addEventListener"]("click", () => v16?.(v19["id"], v20)),
    v21["addEventListener"]("keydown", (v31) => {
      if (v31["key"] !== "Enter" && v31["key"] !== "\x20") return;
      (v31["preventDefault"](), v16?.(v19["id"], v20));
    }),
    v21["addEventListener"]("mouseenter", () => {
      v28["hidden"] = false;
    }),
    v21["addEventListener"]("mouseleave", () => {
      v28["hidden"] = true;
    }),
    v28["addEventListener"]("click", (v32) => {
      (v32["preventDefault"](),
        v32["stopPropagation"](),
        v17?.(v19["id"], v20));
    }),
    v21["addEventListener"]("contextmenu", (v33) => {
      (v33["preventDefault"](),
        v33["stopPropagation"](),
        v18?.({
          cameraId: v19["id"],
          slot: v20,
          clientX: v33["clientX"],
          clientY: v33["clientY"],
        }));
    }),
    v21["appendChild"](v26),
    v21
  );
}
export function renderCameraPresetList(
  v34,
  v35,
  { onActivate: v36, onDelete: v37, onContextMenu: v38 } = {},
) {
  if (!v34) return;
  const v39 = Array["isArray"](v35?.["cameras"]) ? v35["cameras"] : [],
    v40 = resolveCameraSlotEntries(v39);
  (v34["replaceChildren"](),
    v34["classList"]["toggle"]("is-visible", v40["length"] > 0),
    v40["forEach"]((v41) => {
      v34["appendChild"](
        createCameraButton(v41, v35, {
          onActivate: v36,
          onDelete: v37,
          onContextMenu: v38,
        }),
      );
    }));
}
