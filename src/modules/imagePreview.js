import { getImage } from "./storage.js";
import { firstNonEmpty } from "../utils/validators.js";
import {
  resolveCanvasImagePreviewUrl,
  resolveCanvasImageThumbUrl,
} from "../services/canvasMediaLocalService.js";
import { attachMediaElementPlaybackSource } from "../services/desktopMediaBlobSource.js";
export async function resolveNodeImagePreviewSource(v0) {
  if (!v0) return null;
  const v1 = Array["isArray"](v0["images"]) ? v0["images"] : [],
    v2 = v0["mainImageIndex"] || 0,
    v3 = v1[v2] || null,
    v4 = firstNonEmpty(v3?.["sourceId"], v0["sourceId"]);
  if (v4)
    try {
      const v5 = await getImage(v4);
      if (v5)
        return { url: URL["createObjectURL"](v5), revokeUrlOnClose: true };
    } catch (v6) {}
  const v7 = firstNonEmpty(
    resolveCanvasImagePreviewUrl(v3),
    resolveCanvasImagePreviewUrl(v0),
  );
  if (v7) return { url: v7, revokeUrlOnClose: false };
  const v8 = firstNonEmpty(
    resolveCanvasImageThumbUrl(v3),
    resolveCanvasImageThumbUrl(v0),
  );
  if (v8) return { url: v8, revokeUrlOnClose: false };
  return null;
}
function markSidebarSubmenuOwner(v9, v10) {
  const v11 = String(v10 || "")["trim"]();
  if (v11) v9["dataset"]["sidebarSubmenuOwner"] = v11;
}
export function openImagePreview(v12, v13 = {}) {
  if (!v12) return () => {};
  const v14 = !!v13["revokeUrlOnClose"],
    v15 = document["createElement"]("div");
  (markSidebarSubmenuOwner(v15, v13["sidebarSubmenuOwner"]),
    Object["assign"](v15["style"], {
      position: "fixed",
      inset: "0",
      background: "var(--overlay-preview)",
      zIndex: "99999",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "zoom-out",
    }));
  const v16 = document["createElement"]("img");
  ((v16["src"] = v12),
    Object["assign"](v16["style"], {
      maxWidth: "90%",
      maxHeight: "90%",
      objectFit: "contain",
    }));
  const v17 = () => {
      (document["removeEventListener"]("keydown", v18, true), v15["remove"]());
      if (v14)
        try {
          URL["revokeObjectURL"](v12);
        } catch (v19) {}
    },
    v18 = (v20) => {
      v20["key"] === "Escape" &&
        (v20["preventDefault"](), v20["stopPropagation"](), v17());
    };
  return (
    v15["appendChild"](v16),
    v15["addEventListener"]("click", v17),
    document["addEventListener"]("keydown", v18, true),
    document["body"]["appendChild"](v15),
    v17
  );
}
export function openVideoPreview(v21, v22 = {}) {
  if (!v21) return () => {};
  const v23 = document["createElement"]("div");
  (markSidebarSubmenuOwner(v23, v22["sidebarSubmenuOwner"]),
    Object["assign"](v23["style"], {
      position: "fixed",
      inset: "0",
      background: "var(--overlay-dim)",
      zIndex: "99999",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "zoom-out",
    }));
  const v24 = document["createElement"]("video");
  ((v24["controls"] = true),
    (v24["autoplay"] = v22["autoplay"] !== false),
    (v24["loop"] = v22["loop"] !== false),
    (v24["muted"] = !!v22["muted"]),
    void attachMediaElementPlaybackSource(v24, v21, { preload: "auto" })[
      "catch"
    ](() => {
      !String(v24["getAttribute"]?.("src") || v24["src"] || "")["trim"]() &&
        ((v24["src"] = v21), v24["load"]?.());
    }),
    Object["assign"](v24["style"], {
      maxWidth: "90%",
      maxHeight: "90%",
      objectFit: "contain",
    }));
  const v25 = () => {
      document["removeEventListener"]("keydown", v26, true);
      try {
        v24["pause"]();
      } catch (v27) {}
      v23["remove"]();
    },
    v26 = (v28) => {
      v28["key"] === "Escape" &&
        (v28["preventDefault"](), v28["stopPropagation"](), v25());
    };
  (v23["addEventListener"]("click", (v29) => {
    if (v29["target"] === v23) v25();
  }),
    v23["appendChild"](v24),
    document["addEventListener"]("keydown", v26, true),
    document["body"]["appendChild"](v23));
  try {
    const v30 = v24["play"]?.();
    v30 && typeof v30["catch"] === "function" && v30["catch"](() => {});
  } catch (v31) {}
  return v25;
}
export async function openNodeImagePreview(v32) {
  const v33 = await resolveNodeImagePreviewSource(v32);
  if (!v33) return () => {};
  return openImagePreview(v33["url"], {
    revokeUrlOnClose: v33["revokeUrlOnClose"],
  });
}
