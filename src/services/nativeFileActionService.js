import { normalizeLocalPath } from "../utils/localMediaPath.js";
function getElectronApi() {
  return globalThis["window"]?.["electronAPI"] || null;
}
export function resolveNodeLocalPathForNativeAction(v0) {
  const v1 = [
    v0?.["originalLocalPath"],
    v0?.["localPath"],
    v0?.["displayLocalPath"],
    v0?.["posterLocalPath"],
    v0?.["waveformLocalPath"],
    v0?.["src"],
    v0?.["imageUrl"],
    v0?.["videoUrl"],
    v0?.["audioUrl"],
    v0?.["url"],
    v0?.["resultUrl"],
  ];
  return v1["map"]((v2) => normalizeLocalPath(v2))["find"](Boolean) || "";
}
export function canShowItemInFolder(v3) {
  return !!v3 && typeof getElectronApi()?.["showItemInFolder"] === "function";
}
export function canOpenKnownFolder(v4) {
  return !!v4 && typeof getElectronApi()?.["openKnownFolder"] === "function";
}
export async function showItemInFolder(v5) {
  const v6 = getElectronApi();
  if (!canShowItemInFolder(v5)) throw new Error("showItemInFolder unavailable");
  return v6["showItemInFolder"]({ localPath: v5 });
}
export async function openKnownFolder(v7) {
  const v8 = getElectronApi();
  if (!canOpenKnownFolder(v7)) throw new Error("openKnownFolder unavailable");
  return v8["openKnownFolder"]({ kind: v7 });
}
