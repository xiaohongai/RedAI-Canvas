export function bindImageCropAction(v0) {
  const { toolbarEl: v1, nodeId: v2, ImageCropController: v3 } = v0,
    v4 = v1["querySelector"](".act-crop");
  v4 &&
    v4["addEventListener"]("click", (v5) => {
      (v5["stopPropagation"](),
        window["v2FocusOnNode"]
          ? (window["v2FocusOnNode"](v2, 120, 800),
            setTimeout(() => {
              v3["init"](v2);
            }, 600))
          : v3["init"](v2));
    });
}
