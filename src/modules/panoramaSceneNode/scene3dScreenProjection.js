export function resolveRendererScreenSize(v0) {
  const v1 = v0?.["getBoundingClientRect"]?.(),
    v2 = Math["max"](
      1,
      Number(v1?.["width"]) ||
        Number(v0?.["clientWidth"]) ||
        Number(v0?.["width"]) ||
        1,
    ),
    v3 = Math["max"](
      1,
      Number(v1?.["height"]) ||
        Number(v0?.["clientHeight"]) ||
        Number(v0?.["height"]) ||
        1,
    );
  return { width: v2, height: v3 };
}
export function projectWorldPointToScreen(v4, v5, v6) {
  if (!v4?.["isVector3"] || !v5) return null;
  (v5["updateMatrixWorld"]?.(), v5["updateProjectionMatrix"]?.());
  const v7 = v4["clone"]()["project"](v5);
  if (
    !Number["isFinite"](v7["x"]) ||
    !Number["isFinite"](v7["y"]) ||
    !Number["isFinite"](v7["z"])
  )
    return null;
  const { width: v8, height: v9 } = resolveRendererScreenSize(v6);
  return { x: (v7["x"] + 1) * 0.5 * v8, y: (1 - v7["y"]) * 0.5 * v9 };
}
export function resolveAxisScreenDragMetric({
  pivot: v10,
  axisWorld: v11,
  camera: v12,
  domElement: v13,
  worldDistance: worldDistance = 1,
} = {}) {
  if (!v10?.["isVector3"] || !v11?.["isVector3"]) return null;
  const v14 = projectWorldPointToScreen(v10, v12, v13),
    v15 = projectWorldPointToScreen(
      v10["clone"]()["add"](
        v11["clone"]()
          ["normalize"]()
          ["multiplyScalar"](Math["max"](0.01, Number(worldDistance) || 1)),
      ),
      v12,
      v13,
    );
  if (!v14 || !v15) return null;
  const v16 = v15["x"] - v14["x"],
    v17 = v15["y"] - v14["y"],
    v18 = Math["hypot"](v16, v17);
  if (!Number["isFinite"](v18) || v18 < 0.001) return null;
  return {
    axisScreenDirection: { x: v16 / v18, y: v17 / v18 },
    screenReferencePixels: Math["max"](32, Math["min"](180, v18)),
  };
}
