import { get as get, post as post } from "./requester.js";
export async function checkUpdateFromServer(v0 = {}) {
  const v1 = new URLSearchParams();
  if (v0["force"]) v1["set"]("force", "1");
  if (v0["includeCurrent"]) v1["set"]("includeCurrent", "1");
  const v2 = v1["toString"](),
    v3 = await get("/api/v2/update/check" + (v2 ? "?" + v2 : ""), {
      provider: "local",
    });
  return v3;
}
export async function checkLocalUpdatePreviewFromServer() {
  const v4 = await get("/api/v2/update/local-preview", { provider: "local" });
  return v4;
}
export async function applyUpdateFromServer() {
  const v5 = await post("/api/v2/update/apply", {}, { provider: "local" });
  return v5;
}
export async function pingUpdateCheckFromServer() {
  try {
    return (await get("/api/v2/update/check", { provider: "local" }), true);
  } catch {
    return false;
  }
}
