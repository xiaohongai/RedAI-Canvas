import { get as get, post as post } from "./requester.js";
export async function fetchUserSettingsFromServer() {
  const v0 = await get("/api/v2/user/settings.json", { provider: "local" });
  return v0;
}
export async function saveUserSettingsToServer(v1) {
  return await post("/api/v2/user/settings.json", v1 || {}, {
    provider: "local",
  });
}
export async function startFileSavePathMigration(v2) {
  return await post(
    "/api/v2/user/file-save-paths/migration/start",
    { settings: v2 || {} },
    { provider: "local", timeout: 10000 },
  );
}
export async function fetchFileSavePathMigrationStatus(v3) {
  const v4 = encodeURIComponent(String(v3 || ""));
  return await get(
    "/api/v2/user/file-save-paths/migration/status?jobId=" + v4,
    { provider: "local", timeout: 10000 },
  );
}
