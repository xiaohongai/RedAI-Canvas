import { bindRefThumbOrderDrag } from "../../modules/refThumbDragController.js";
export function bindRefBarDragSort(v0, v1, v2) {
  bindRefThumbOrderDrag({
    owner: v0,
    container: v1,
    store: v2,
    nodeId: v0?.["nodeId"],
  });
}
