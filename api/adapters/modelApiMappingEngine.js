function isPlainObject(v0) {
  return !!v0 && typeof v0 === "object" && !Array["isArray"](v0);
}
function isPresentValue(v1) {
  if (v1 === undefined || v1 === null) return false;
  if (typeof v1 === "string") return v1["trim"]() !== "";
  if (Array["isArray"](v1)) return v1["length"] > 0;
  return true;
}
export function getPathValue(v2, v3) {
  const v4 = String(v3 || "")["trim"]();
  if (!v4) return undefined;
  return v4["split"](".")["reduce"]((v5, v6) => {
    if (v5 === undefined || v5 === null) return undefined;
    return v5[v6];
  }, v2);
}
export function setPathValue(v7, v8, v9) {
  const v10 = String(v8 || "")["trim"]();
  if (!v10) return v7;
  const v11 = v10["split"](".")["filter"](Boolean);
  if (v11["length"] === 0) return v7;
  let v12 = v7;
  for (let v13 = 0; v13 < v11["length"] - 1; v13 += 1) {
    const v14 = v11[v13];
    if (!isPlainObject(v12[v14])) v12[v14] = {};
    v12 = v12[v14];
  }
  return ((v12[v11[v11["length"] - 1]] = v9), v7);
}
function normalizeFieldList(v15) {
  const v16 = v15?.["fields"] !== undefined ? v15["fields"] : v15?.["field"],
    v17 = Array["isArray"](v16) ? v16 : [v16];
  return v17["map"]((v18) => String(v18 || "")["trim"]())["filter"](Boolean);
}
function resolveFirstPayloadValue(v19, v20) {
  for (const v21 of v20) {
    const v22 = getPathValue(v19, v21);
    if (isPresentValue(v22)) return v22;
  }
  return undefined;
}
function valuesEqual(v23, v24) {
  if (typeof v24 === "boolean") {
    const v25 = String(v23 ?? "")
      ["trim"]()
      ["toLowerCase"]();
    return v23 === v24 || v25 === String(v24);
  }
  if (typeof v24 === "number") return Number(v23) === v24;
  return String(v23 ?? "")["trim"]() === String(v24 ?? "")["trim"]();
}
function evaluateWhenRule(v26, v27) {
  if (!v26 || typeof v26 !== "object") return true;
  const v28 = v26["field"]
      ? getPathValue(v27["payload"] || {}, v26["field"])
      : undefined,
    v29 = isPresentValue(v28);
  if (Object["prototype"]["hasOwnProperty"]["call"](v26, "exists")) {
    if (Boolean(v26["exists"]) !== v29) return false;
  }
  if (v26["truthy"] === true && !Boolean(v28)) return false;
  if (v26["falsy"] === true && Boolean(v28)) return false;
  if (
    Object["prototype"]["hasOwnProperty"]["call"](v26, "equals") &&
    !valuesEqual(v28, v26["equals"])
  )
    return false;
  if (
    Object["prototype"]["hasOwnProperty"]["call"](v26, "notEquals") &&
    valuesEqual(v28, v26["notEquals"])
  )
    return false;
  if (
    Array["isArray"](v26["in"]) &&
    !v26["in"]["some"]((v30) => valuesEqual(v28, v30))
  )
    return false;
  if (
    Array["isArray"](v26["notIn"]) &&
    v26["notIn"]["some"]((v31) => valuesEqual(v28, v31))
  )
    return false;
  return true;
}
function shouldApplyEntry(v32, v33) {
  if (!v32?.["when"]) return true;
  if (Array["isArray"](v32["when"]))
    return v32["when"]["every"]((v34) => evaluateWhenRule(v34, v33));
  return evaluateWhenRule(v32["when"], v33);
}
function normalizeMappingEntries(v35) {
  if (Array["isArray"](v35)) return v35;
  if (Array["isArray"](v35?.["entries"])) return v35["entries"];
  return [];
}
function resolveEntrySourceValue(v36, v37) {
  const v38 = String(v36?.["from"] || "")["trim"]();
  if (v38 === "prompt") return v37["finalPrompt"] || "";
  if (v38 === "param")
    return resolveFirstPayloadValue(
      v37["payload"] || {},
      normalizeFieldList(v36),
    );
  if (v38 === "inputImages") return v37["inputImages"] || [];
  if (v38 === "inputVideos") return v37["inputVideos"] || [];
  if (v38 === "inputAudios") return v37["inputAudios"] || [];
  if (v38 === "model") return v37["modelToken"] || "";
  if (v38 === "constant")
    return Object["prototype"]["hasOwnProperty"]["call"](v36, "value")
      ? v36["value"]
      : v36["defaultValue"];
  return undefined;
}
function normalizeTransformList(v39) {
  if (!v39) return [];
  return Array["isArray"](v39) ? v39 : [v39];
}
async function applyTransforms(v40, v41, v42, v43) {
  let v44 = v40;
  for (const v45 of normalizeTransformList(v41?.["transform"])) {
    const v46 =
        typeof v45 === "string"
          ? { name: v45 }
          : isPlainObject(v45)
            ? v45
            : { name: "" },
      v47 = String(v46["name"] || "")["trim"]();
    if (!v47) continue;
    const v48 = v43?.[v47];
    if (typeof v48 !== "function")
      throw new Error(
        "Unsupported\x20model\x20API\x20bodyMapping\x20transform:\x20" + v47,
      );
    v44 = await v48(v44, { entry: v41, context: v42, spec: v46 });
  }
  return v44;
}
export async function buildBodyFromMapping({
  bodyMapping: v49,
  context: v50,
  transforms: transforms = {},
}) {
  const v51 = {},
    v52 = normalizeMappingEntries(v49),
    v53 = { ...v50, body: v51 };
  for (const v54 of v52) {
    if (!v54?.["path"] || !shouldApplyEntry(v54, v53)) continue;
    let v55 = resolveEntrySourceValue(v54, v53);
    !isPresentValue(v55) &&
      Object["prototype"]["hasOwnProperty"]["call"](v54, "defaultValue") &&
      (v55 = v54["defaultValue"]);
    v55 = await applyTransforms(v55, v54, v53, transforms);
    if (v54["omitWhenEmpty"] === true && !isPresentValue(v55)) continue;
    setPathValue(v51, v54["path"], v55);
  }
  return v51;
}
function collectValuesByPath(v56, v57) {
  const v58 = String(v57 || "")
    ["trim"]()
    ["split"](".")
    ["filter"](Boolean);
  if (v58["length"] === 0) return [];
  const v59 = (v60, v61) => {
    if (v60 === undefined || v60 === null) return [];
    if (v61 >= v58["length"]) return Array["isArray"](v60) ? v60 : [v60];
    const v62 = v58[v61];
    if (v62["endsWith"]("[]")) {
      const v63 = v62["slice"](0, -2),
        v64 = v63 ? v60?.[v63] : v60;
      if (!Array["isArray"](v64)) return [];
      return v64["flatMap"]((v65) => v59(v65, v61 + 1));
    }
    return v59(v60?.[v62], v61 + 1);
  };
  return v59(v56, 0)["flatMap"]((v66) => (Array["isArray"](v66) ? v66 : [v66]));
}
export function resolveMappedResponseValues(v67, v68 = []) {
  const v69 = Array["isArray"](v68) ? v68 : [v68],
    v70 = [];
  for (const v71 of v69) {
    for (const v72 of collectValuesByPath(v67, v71)) {
      if (v72 && typeof v72 === "object") {
        const v73 =
          v72["url"] ||
          v72["imageUrl"] ||
          v72["image_url"] ||
          v72["videoUrl"] ||
          v72["video_url"] ||
          v72["fileUrl"];
        if (v73) v70["push"](String(v73)["trim"]());
        continue;
      }
      const v74 = String(v72 ?? "")["trim"]();
      if (v74) v70["push"](v74);
    }
  }
  return Array["from"](new Set(v70["filter"](Boolean)));
}
export function resolveMappedResponseValue(v75, v76 = []) {
  return resolveMappedResponseValues(v75, v76)[0] || "";
}
