import * as threeRuntime from "./threeRuntime.js";
import { GLTFLoader } from "../../../vendor/three/examples/jsm/loaders/GLTFLoader.js";
import { clone as clone } from "../../../vendor/three/examples/jsm/utils/SkeletonUtils.js";
const TARGET_CHARACTER_HEIGHT = 1.92;
export const PANORAMA_CHARACTER_MODEL_SOURCES = Object["freeze"]({
  male: new URL(
    "../../../assets/characters/quaternius/universal-base/Superhero_Male_FullBody.gltf",
    import.meta["url"],
  )["href"],
  female: new URL(
    "../../../assets/characters/quaternius/universal-base/Superhero_Female_FullBody.gltf",
    import.meta["url"],
  )["href"],
});
const loader = new GLTFLoader(),
  loadCache = new Map(),
  NATURAL_ARM_POSE_BY_GENDER = Object["freeze"]({
    male: Object["freeze"]({
      upperArmDropRadians: 1.34,
      lowerArmRelaxRadians: 0,
    }),
    female: Object["freeze"]({
      upperArmDropRadians: 1.38,
      lowerArmRelaxRadians: 0,
    }),
  });
export function resolvePanoramaCharacterGender(v0) {
  return v0 === "female" ? "female" : "male";
}
export function resolvePanoramaCharacterModelUrl(v1) {
  return PANORAMA_CHARACTER_MODEL_SOURCES[resolvePanoramaCharacterGender(v1)];
}
function loadCharacterTemplate(v2) {
  const v3 = resolvePanoramaCharacterGender(v2);
  if (loadCache["has"](v3)) return loadCache["get"](v3);
  if (typeof window === "undefined")
    return Promise["reject"](
      new Error(
        "Quaternius character models are only loaded in browser runtime",
      ),
    );
  const v4 = new Promise((v5, v6) => {
    loader["load"](
      resolvePanoramaCharacterModelUrl(v3),
      (v7) => {
        if (!v7?.["scene"]) {
          v6(new Error("Quaternius " + v3 + " model did not contain a scene"));
          return;
        }
        v5(normalizeCharacterModel(v7["scene"], v3));
      },
      undefined,
      v6,
    );
  });
  return (loadCache["set"](v3, v4), v4);
}
function cloneCharacterTemplate(v8) {
  return clone(v8);
}
function resolvePanoramaCharacterNaturalArmPose(v9) {
  return NATURAL_ARM_POSE_BY_GENDER[resolvePanoramaCharacterGender(v9)];
}
function rotateBoneLocal(v10, v11, v12, v13) {
  const v14 = v10?.["getObjectByName"]?.(v11);
  if (!v14) return false;
  const v15 = new threeRuntime["Quaternion"]()["setFromAxisAngle"](v12, v13);
  return (v14["quaternion"]["multiply"](v15), true);
}
export function applyPanoramaCharacterNaturalArmPose(v16, v17) {
  const v18 = resolvePanoramaCharacterNaturalArmPose(v17),
    v19 = new threeRuntime["Vector3"](0, 0, 1);
  return (
    rotateBoneLocal(v16, "upperarm_l", v19, -v18["upperArmDropRadians"]),
    rotateBoneLocal(v16, "upperarm_r", v19, v18["upperArmDropRadians"]),
    rotateBoneLocal(v16, "lowerarm_l", v19, -v18["lowerArmRelaxRadians"]),
    rotateBoneLocal(v16, "lowerarm_r", v19, v18["lowerArmRelaxRadians"]),
    v16?.["updateMatrixWorld"]?.(true),
    v16
  );
}
function normalizeCharacterModel(v20, v21) {
  (applyPanoramaCharacterNaturalArmPose(v20, v21),
    v20["updateMatrixWorld"](true));
  const v22 = new threeRuntime["Box3"]()["setFromObject"](v20),
    v23 = new threeRuntime["Vector3"]();
  v22["getSize"](v23);
  const v24 = Math["max"](0.001, v23["y"]),
    v25 = TARGET_CHARACTER_HEIGHT / v24;
  (v20["scale"]["multiplyScalar"](v25), v20["updateMatrixWorld"](true));
  const v26 = new threeRuntime["Box3"]()["setFromObject"](v20),
    v27 = new threeRuntime["Vector3"]();
  return (
    v26["getCenter"](v27),
    (v20["position"]["x"] -= v27["x"]),
    (v20["position"]["y"] -= v26["min"]["y"]),
    (v20["position"]["z"] -= v27["z"]),
    v20["traverse"]((v28) => {
      ((v28["frustumCulled"] = false),
        v28["isMesh"] &&
          ((v28["castShadow"] = false), (v28["receiveShadow"] = true)));
    }),
    v20
  );
}
export function preloadPanoramaCharacterModels(v29 = ["male", "female"]) {
  const v30 = Array["isArray"](v29) ? v29 : [v29];
  return Promise["all"](
    v30["map"]((v31) =>
      loadCharacterTemplate(resolvePanoramaCharacterGender(v31)),
    ),
  );
}
export async function createPanoramaCharacterModelInstance(v32) {
  const v33 = await loadCharacterTemplate(v32);
  return cloneCharacterTemplate(v33);
}
