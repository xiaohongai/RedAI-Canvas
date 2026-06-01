export function bindImageMattingAction(v0) {
  const { toolbarEl: v1, nodeId: v2, ImageMattingController: v3 } = v0,
    v4 = v1["querySelector"](".act-matting");
  v4 &&
    v4["addEventListener"]("click", (v5) => {
      (v5["stopPropagation"](),
        window["v2FocusOnNode"] && window["v2FocusOnNode"](v2),
        v3["init"](v2));
    });
}
