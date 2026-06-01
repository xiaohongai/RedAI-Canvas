const _inflightTasks = new Map();
function normalizeKeyPart(v0) {
  return String(v0 || "")["trim"]();
}
export function buildTaskSingleFlightKey({
  provider: v1,
  kind: v2,
  taskId: v3,
  submitId: v4,
  id: v5,
} = {}) {
  const v6 = normalizeKeyPart(v1),
    v7 = normalizeKeyPart(v2),
    v8 = normalizeKeyPart(v3 || v4 || v5);
  if (!v6 || !v7 || !v8) return "";
  return v6 + ":" + v7 + ":" + v8;
}
export function runTaskSingleFlight(v9, v10) {
  if (typeof v10 !== "function")
    return Promise["reject"](
      new TypeError("task single-flight factory must be a function"),
    );
  const v11 = buildTaskSingleFlightKey(v9);
  if (!v11) return Promise["resolve"]()["then"](() => v10());
  const v12 = _inflightTasks["get"](v11);
  if (v12) return v12;
  const v13 = Promise["resolve"]()["then"](v10);
  return (
    _inflightTasks["set"](v11, v13),
    v13["finally"](() => {
      _inflightTasks["get"](v11) === v13 && _inflightTasks["delete"](v11);
    })["catch"](() => {}),
    v13
  );
}
export function __clearTaskSingleFlightForTest() {
  _inflightTasks["clear"]();
}
