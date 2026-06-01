import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const DEVICE_IDENTITY_FILENAME = "device-identity.json";
function readJsonFileSyncSafe(v0) {
  try {
    return JSON["parse"](readFileSync(v0, "utf8")["replace"](/^\uFEFF/, ""));
  } catch {
    return {};
  }
}
function writeJsonFileSyncSafe(v1, v2) {
  const v3 = path["dirname"](v1);
  if (v3) mkdirSync(v3, { recursive: true });
  writeFileSync(v1, JSON["stringify"](v2 || {}, null, 2), "utf8");
}
function normalizeDeviceIdentityValue(v4) {
  const v5 = String(v4 || "")["trim"]();
  if (!v5 || v5["length"] > 256) return "";
  return /^[A-Za-z0-9._:-]+$/["test"](v5) ? v5 : "";
}
function readDeviceIdFromFile(v6) {
  const v7 = readJsonFileSyncSafe(v6);
  return normalizeDeviceIdentityValue(v7["deviceId"] || v7["device_id"]);
}
function readInstallIdFromFile(v8) {
  const v9 = readJsonFileSyncSafe(v8);
  return normalizeDeviceIdentityValue(v9["installId"] || v9["install_id"]);
}
export function createDeviceIdentityManager({
  app: v10,
  appRoot: v11,
  getUserRoot: v12,
  logEvent: logEvent = () => {},
}) {
  function v13() {
    const v14 = "RedAI-Canvas";
    if (process["platform"] === "win32") {
      const v15 =
        process["env"]["LOCALAPPDATA"] ||
        process["env"]["APPDATA"] ||
        v10["getPath"]("userData");
      return path["join"](v15, v14);
    }
    if (process["platform"] === "darwin")
      return path["join"](v10["getPath"]("appData"), v14);
    const v16 =
      process["env"]["XDG_STATE_HOME"] ||
      path["join"](v10["getPath"]("home"), ".local", "state");
    return path["join"](v16, v14);
  }
  function v17() {
    return [
      path["join"](v10["getPath"]("userData"), DEVICE_IDENTITY_FILENAME),
      path["join"](v13(), DEVICE_IDENTITY_FILENAME),
    ];
  }
  function v18() {
    return [
      path["join"](v12(), "settings.json"),
      path["join"](v13(), "settings.json"),
      path["join"](v11, "user", "settings.json"),
    ];
  }
  function v19(v20) {
    const v21 = normalizeDeviceIdentityValue(v20);
    if (!v21) return;
    for (const v22 of v17()) {
      try {
        writeJsonFileSyncSafe(v22, {
          deviceId: v21,
          updatedAt: new Date()["toISOString"](),
        });
      } catch (v23) {
        logEvent({
          type: "device_identity.write_failed",
          level: "warn",
          source: "main",
          message: "Failed\x20to\x20persist\x20device\x20identity",
          error: v23,
          context: { target: path["basename"](v22) },
        });
      }
    }
    for (const v24 of v18()["slice"](0, 2)) {
      try {
        const v25 = readJsonFileSyncSafe(v24);
        if (normalizeDeviceIdentityValue(v25["deviceId"]) === v21) continue;
        writeJsonFileSyncSafe(v24, { ...v25, deviceId: v21 });
      } catch (v26) {
        logEvent({
          type: "device_identity.settings_write_failed",
          level: "warn",
          source: "main",
          message: "Failed to mirror device identity into settings",
          error: v26,
          context: { target: path["basename"](v24) },
        });
      }
    }
  }
  function v27(v28 = {}) {
    const v29 = normalizeDeviceIdentityValue(
        v28?.["installId"] || v28?.["seedInstallId"],
      ),
      v30 = v17(),
      v31 = v18(),
      v32 = [
        ...v30["map"]((v33) => readDeviceIdFromFile(v33)),
        ...v31["map"]((v34) => readDeviceIdFromFile(v34)),
        ...v31["map"]((v35) => readInstallIdFromFile(v35)),
        v29,
      ],
      v36 = v32["find"](Boolean),
      v37 = v36 || "aicdev-" + randomBytes(16)["toString"]("hex");
    return (v19(v37), v37);
  }
  return { getStableDeviceId: v27 };
}
