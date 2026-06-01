import { get as get } from "./requester.js";
export async function fetchAppRuntimeInfoFromServer() {
  const v0 = await get("/api/v2/runtime/info", { provider: "local" });
  return v0;
}
