import {
  PANORAMA_SCENE_CAMERA_LIMIT,
  PANORAMA_360_NODE_ALIASES,
  PANORAMA_360_NODE_TYPE,
  PANORAMA_SCENE_NODE_ALIASES,
  PANORAMA_SCENE_NODE_TYPE,
  isPanorama360NodeType as isPanorama360NodeTypeImpl,
  isPanoramaSceneNodeType as isPanoramaSceneNodeTypeImpl,
  normalizePanorama360State,
  normalizeSceneOnlyPanoramaSceneState,
} from "./sceneNode.js";
const TYPE_SET = new Set([
  PANORAMA_SCENE_NODE_TYPE,
  ...PANORAMA_SCENE_NODE_ALIASES,
  PANORAMA_360_NODE_TYPE,
  ...PANORAMA_360_NODE_ALIASES,
]);
export function isPanoramaSceneNodeType(v0) {
  return TYPE_SET["has"](String(v0 || "")["trim"]());
}
export function isPanorama360NodeType(v1) {
  return isPanorama360NodeTypeImpl(v1);
}
export function isLegacyPanoramaSceneNodeType(v2) {
  return isPanoramaSceneNodeTypeImpl(v2);
}
export function isPanoramaSceneNode(v3) {
  return !!v3 && isPanoramaSceneNodeType(v3["type"]);
}
export function getPanoramaSceneState(v4) {
  if (isPanorama360NodeTypeImpl(v4?.["type"]))
    return {
      ...normalizePanorama360State(v4?.["panorama360Node"]),
      type: PANORAMA_360_NODE_TYPE,
    };
  return {
    ...normalizeSceneOnlyPanoramaSceneState(v4?.["sceneNode"]),
    type: PANORAMA_SCENE_NODE_TYPE,
  };
}
export function getPanoramaSceneNode(v5, v6) {
  return v5?.["getStateRaw"]?.()["nodes"]?.[v6] || null;
}
export function getSelectedSceneObject(v7) {
  const v8 = getPanoramaSceneState(v7),
    { selectedObjectType: v9, selectedObjectId: v10 } = v8["selection"];
  if (!v9 || !v10) return null;
  return { type: v9, id: v10 };
}
export function getActiveSceneCamera(v11) {
  const v12 = getPanoramaSceneState(v11);
  if (
    v12["viewport"]["activeView"] !== "camera" ||
    !v12["viewport"]["activeCameraId"]
  )
    return null;
  return (
    v12["cameras"]["find"](
      (v13) => v13["id"] === v12["viewport"]["activeCameraId"],
    ) || null
  );
}
export function canAddSceneCamera(v14) {
  if (isPanorama360NodeTypeImpl(v14?.["type"])) return false;
  return (
    getPanoramaSceneState(v14)["cameras"]["length"] <
    PANORAMA_SCENE_CAMERA_LIMIT
  );
}
export function getSceneCameraCount(v15) {
  return getPanoramaSceneState(v15)["cameras"]["length"];
}
export function getSceneMannequinById(v16, v17) {
  return (
    getPanoramaSceneState(v16)["mannequins"]["find"](
      (v18) => v18["id"] === v17,
    ) || null
  );
}
export function getSceneCameraById(v19, v20) {
  return (
    getPanoramaSceneState(v19)["cameras"]["find"]((v21) => v21["id"] === v20) ||
    null
  );
}
