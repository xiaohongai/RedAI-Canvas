import { attachMediaElementPlaybackSource } from "../../../services/desktopMediaBlobSource.js";
export function bindVideoFullscreenAction(v0) {
  const { toolbarEl: v1, _getCurrentVideoUrl: v2 } = v0,
    v3 = v1["querySelector"](".act-fullscreen");
  v3 &&
    v3["addEventListener"]("click", (v4) => {
      v4["stopPropagation"]();
      const v5 = v2();
      if (!v5) return;
      const v6 = document["createElement"]("div");
      Object["assign"](v6["style"], {
        position: "fixed",
        inset: "0",
        background: "var(--overlay-dim)",
        zIndex: "99999",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "zoom-out",
      });
      const v7 = document["createElement"]("video");
      ((v7["autoplay"] = true),
        (v7["controls"] = true),
        (v7["loop"] = true),
        void attachMediaElementPlaybackSource(v7, v5, { preload: "auto" })[
          "catch"
        ](() => {
          !String(v7["getAttribute"]?.("src") || v7["src"] || "")["trim"]() &&
            ((v7["src"] = v5), v7["load"]?.());
        }),
        Object["assign"](v7["style"], {
          maxWidth: "90%",
          maxHeight: "90%",
          objectFit: "contain",
        }),
        v6["addEventListener"]("click", (v8) => {
          if (v8["target"] === v6) v6["remove"]();
        }),
        v6["appendChild"](v7),
        document["body"]["appendChild"](v6));
    });
}
