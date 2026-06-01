import { get as get, post as post, del as del } from "./requester.js";
export async function getProjects() {
  try {
    const v0 = await get("/api/projects", { provider: "local" });
    return Array["isArray"](v0) ? v0 : [];
  } catch (v1) {
    return (console["error"]("Failed to get projects:", v1), []);
  }
}
export async function createProject(v2, v3) {
  try {
    return (
      await post("/api/projects", { id: v2, name: v3 }, { provider: "local" }),
      v2
    );
  } catch (v4) {
    return (console["error"]("Failed\x20to\x20create\x20project:", v4), null);
  }
}
export async function deleteProject(v5) {
  try {
    return (await del("/api/projects?id=" + v5, { provider: "local" }), true);
  } catch (v6) {
    return (console["error"]("Failed\x20to\x20delete\x20project:", v6), false);
  }
}
