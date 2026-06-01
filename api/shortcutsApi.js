import { buildApiUrl } from "./apiBase.js";
import { get as get, post as post } from "./requester.js";
const USER_FILE = "shortcuts.json";
export async function fetchUserShortcutsFromServer() {
  const v0 = await get("/api/v2/user/" + USER_FILE, { provider: "local" });
  return v0;
}
export async function saveUserShortcutsToServer(v1) {
  return (
    await post("/api/v2/user/" + USER_FILE, v1 || {}, { provider: "local" }),
    true
  );
}
