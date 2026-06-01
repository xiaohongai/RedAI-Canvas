import test from "node:test";
import strict from "node:assert/strict";
import { requester } from "./requester.js";
(test("requester: retryable network errors retry before success", async () => {
  const v0 = globalThis["fetch"];
  let v1 = 0;
  try {
    globalThis["fetch"] = async () => {
      v1++;
      if (v1 < 3) throw new Error("Failed to fetch");
      return {
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => ({ success: true }),
        text: async () => JSON["stringify"]({ success: true }),
      };
    };
    const v2 = await requester({
      url: "https://example.test/api",
      provider: "grsai",
      buildUrl: false,
      retries: 2,
      retryDelay: 1,
    });
    (strict["deepEqual"](v2, { success: true }), strict["equal"](v1, 3));
  } finally {
    globalThis["fetch"] = v0;
  }
}),
  test("requester: aborted external signals are not retried", async () => {
    const v3 = globalThis["fetch"],
      v4 = new AbortController();
    let v5 = 0;
    try {
      ((globalThis["fetch"] = async () => {
        (v5++, v4["abort"]());
        throw new DOMException("The operation was aborted.", "AbortError");
      }),
        await strict["rejects"](
          requester({
            url: "https://example.test/api",
            provider: "grsai",
            buildUrl: false,
            signal: v4["signal"],
            retries: 2,
            retryDelay: 1,
          }),
          (v6) => v6?.["name"] === "ApiError" && v6?.["type"] === "TIMEOUT",
        ),
        strict["equal"](v5, 1));
    } finally {
      globalThis["fetch"] = v3;
    }
  }),
  test("requester: local relative requests carry stable device id header", async () => {
    const v7 = globalThis["fetch"],
      v8 = globalThis["window"];
    let v9 = null;
    try {
      ((globalThis["window"] = { __aicDeviceId: "device-local-1" }),
        (globalThis["fetch"] = async (v10, v11) => {
          return (
            (v9 = v11),
            {
              ok: true,
              status: 200,
              headers: { get: () => "application/json" },
              json: async () => ({ success: true }),
              text: async () => JSON["stringify"]({ success: true }),
            }
          );
        }),
        await requester({
          url: "/api/v2/subscription/status",
          provider: "local",
        }),
        strict["equal"](v9["headers"]["X-AIC-Device-Id"], "device-local-1"));
    } finally {
      ((globalThis["fetch"] = v7), (globalThis["window"] = v8));
    }
  }));
