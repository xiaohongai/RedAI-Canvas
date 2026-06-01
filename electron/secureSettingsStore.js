import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
export const SECURE_SETTINGS_VERSION = 1;
function normalizeSecureSettingKey(v0) {
  const v1 = String(v0 || "")["trim"]();
  if (!v1 || v1["length"] > 160) return "";
  if (!/^[A-Za-z0-9._:-]+$/["test"](v1)) return "";
  return v1;
}
function readStoreFile(v2) {
  try {
    if (!existsSync(v2)) return {};
    const v3 = JSON["parse"](readFileSync(v2, "utf8"));
    return v3 &&
      typeof v3 === "object" &&
      v3["items"] &&
      typeof v3["items"] === "object"
      ? v3["items"]
      : {};
  } catch {
    return {};
  }
}
function writeStoreFile(v4, v5) {
  mkdirSync(path["dirname"](v4), { recursive: true });
  const v6 = {
      version: SECURE_SETTINGS_VERSION,
      updatedAt: Date["now"](),
      items: v5 && typeof v5 === "object" ? v5 : {},
    },
    v7 = v4 + "." + process["pid"] + "." + Date["now"]() + ".tmp";
  (writeFileSync(v7, JSON["stringify"](v6, null, 2) + "\x0a", "utf8"),
    renameSync(v7, v4));
}
export function createSecureSettingsStore({
  filePath: v8,
  safeStorage: v9,
} = {}) {
  const v10 = path["resolve"](String(v8 || ""));
  if (!v10) throw new Error("secure settings path is required");
  function v11() {
    try {
      return (
        typeof v9?.["isEncryptionAvailable"] === "function" &&
        v9["isEncryptionAvailable"]() === true
      );
    } catch {
      return false;
    }
  }
  function v12(v13) {
    const v14 = (Array["isArray"](v13) ? v13 : [v13])
        ["map"](normalizeSecureSettingKey)
        ["filter"](Boolean),
      v15 = {};
    if (!v11() || v14["length"] === 0) return v15;
    const v16 = readStoreFile(v10);
    return (
      v14["forEach"]((v17) => {
        const v18 = String(v16[v17]?.["encrypted"] || "")["trim"]();
        if (!v18) return;
        try {
          v15[v17] = v9["decryptString"](Buffer["from"](v18, "base64"));
        } catch {}
      }),
      v15
    );
  }
  function v19(v20, v21) {
    const v22 = normalizeSecureSettingKey(v20);
    if (!v22) throw new Error("Invalid secure setting key");
    if (!v11()) throw new Error("Secure\x20storage\x20is\x20unavailable");
    const v23 = String(v21 || ""),
      v24 = readStoreFile(v10);
    return (
      !v23
        ? delete v24[v22]
        : (v24[v22] = {
            encrypted: v9["encryptString"](v23)["toString"]("base64"),
            updatedAt: Date["now"](),
          }),
      writeStoreFile(v10, v24),
      true
    );
  }
  function v25(v26) {
    const v27 = normalizeSecureSettingKey(v26);
    if (!v27) throw new Error("Invalid\x20secure\x20setting\x20key");
    if (!v11()) throw new Error("Secure storage is unavailable");
    const v28 = readStoreFile(v10);
    return (delete v28[v27], writeStoreFile(v10, v28), true);
  }
  return { isAvailable: v11, getMany: v12, set: v19, delete: v25 };
}
