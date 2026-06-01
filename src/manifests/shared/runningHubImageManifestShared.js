export const RH_IMAGE_INSTANCE_FIELD = Object["freeze"]({
  id: "rhInstanceType",
  type: "segmented",
  placement: "instance",
  label: "显存",
  defaultValue: "default",
  options: Object["freeze"]([
    Object["freeze"]({ value: "default", label: "24G" }),
    Object["freeze"]({ value: "plus", label: "48G" }),
  ]),
});
export const RH_IMAGE_BATCH_SIZE_FIELD = Object["freeze"]({
  id: "batchSize",
  type: "segmented",
  placement: "batch",
  label: "Batch",
  defaultValue: 1,
  options: Object["freeze"]([
    Object["freeze"]({ value: 1, label: "1x", selectedLabel: "1x" }),
    Object["freeze"]({ value: 2, label: "2x", selectedLabel: "2x" }),
    Object["freeze"]({ value: 4, label: "4x", selectedLabel: "4x" }),
  ]),
});
