import test from "node:test";
import strict from "node:assert/strict";
const originalFetch = globalThis["fetch"];
function createJsonResponse(v0, v1, v2 = "GET", v3 = null) {
  globalThis["fetch"] = async (v4, v5 = {}) => {
    return (
      strict["equal"](String(v4), v1),
      strict["equal"](String(v5?.["method"] || "GET"), v2),
      typeof v3 === "function" && v3(v5?.["body"]),
      {
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => v0,
        text: async () => JSON["stringify"](v0),
      }
    );
  };
}
(test("dreaminaCliApi: fetch status with refresh", async () => {
  try {
    createJsonResponse(
      { installed: true, loggedIn: true },
      "/api/v2/dreamina/status?refresh=1",
    );
    const { fetchDreaminaCliStatusFromServer: v6 } =
        await import("./dreaminaCliApi.js"),
      v7 = await v6({ refresh: true });
    (strict["equal"](v7["installed"], true),
      strict["equal"](v7["loggedIn"], true));
  } finally {
    globalThis["fetch"] = originalFetch;
  }
}),
  test("dreaminaCliApi: start headless login posts mode only", async () => {
    try {
      createJsonResponse(
        { success: true },
        "/api/v2/dreamina/login",
        "POST",
        (v8) => {
          const v9 = JSON["parse"](String(v8 || "{}"));
          (strict["equal"](v9["mode"], "headless"),
            strict["equal"]("commandPath" in v9, false));
        },
      );
      const { startDreaminaHeadlessLoginFromServer: v10 } =
          await import("./dreaminaCliApi.js"),
        v11 = await v10();
      strict["equal"](v11["success"], true);
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }),
  test("dreaminaCliApi:\x20start\x20web\x20login\x20posts\x20web\x20mode\x20and\x20force\x20flag", async () => {
    try {
      createJsonResponse(
        { success: true, runtime: { loginMode: "web" } },
        "/api/v2/dreamina/login/web",
        "POST",
        (v12) => {
          const v13 = JSON["parse"](String(v12 || "{}"));
          (strict["equal"](v13["mode"], "web"),
            strict["equal"](v13["force"], true));
        },
      );
      const { startDreaminaWebLoginFromServer: v14 } =
          await import("./dreaminaCliApi.js"),
        v15 = await v14({ force: true });
      (strict["equal"](v15["success"], true),
        strict["equal"](v15["runtime"]["loginMode"], "web"));
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }),
  test("dreaminaCliApi:\x20import\x20login\x20response\x20posts\x20JSON\x20payload", async () => {
    try {
      createJsonResponse(
        { success: true, runtime: { phase: "starting" } },
        "/api/v2/dreamina/login/import",
        "POST",
        (v16) => {
          const v17 = JSON["parse"](String(v16 || "{}"));
          (strict["equal"](typeof v17["loginResponse"], "object"),
            strict["equal"](v17["loginResponse"]["submit_id"], "abc123"));
        },
      );
      const { importDreaminaLoginResponseFromServer: v18 } =
          await import("./dreaminaCliApi.js"),
        v19 = await v18({ submit_id: "abc123", ok: true });
      (strict["equal"](v19["success"], true),
        strict["equal"](v19["runtime"]["phase"], "starting"));
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }),
  test("dreaminaCliApi:\x20logout\x20posts\x20to\x20logout\x20endpoint", async () => {
    try {
      createJsonResponse({ success: true }, "/api/v2/dreamina/logout", "POST");
      const { logoutDreaminaFromServer: v20 } =
          await import("./dreaminaCliApi.js"),
        v21 = await v20();
      strict["equal"](v21["success"], true);
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }));
