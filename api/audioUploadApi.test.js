import test from "node:test";
import strict from "node:assert/strict";
import { processInputAudios } from "./audioUploadApi.js";
function makeJsonResponse(v0, v1 = 200) {
  return new Response(JSON["stringify"](v0), {
    status: v1,
    headers: { "Content-Type": "application/json" },
  });
}
async function withMockFetch(v2, v3) {
  const v4 = globalThis["fetch"];
  globalThis["fetch"] = v2;
  try {
    return await v3();
  } finally {
    globalThis["fetch"] = v4;
  }
}
(test("audioUploadApi: APIMART asset URL 不会重复上传", async () => {
  await withMockFetch(
    async (v5) => {
      throw new Error("unexpected fetch url: " + String(v5));
    },
    async () => {
      const v6 = await processInputAudios(
        ["asset://seedance/avatar-audio"],
        "k_apimart",
        { provider: "apimart" },
      );
      strict["deepEqual"](v6, ["asset://seedance/avatar-audio"]);
    },
  );
}),
  test("audioUploadApi: APIMART 上传携带 API Key", async () => {
    await withMockFetch(
      async (v7, v8 = {}) => {
        const v9 = String(v7);
        if (v9 === "https://audio.example/ref.mp3")
          return new Response(new Blob(["audio"], { type: "audio/mpeg" }), {
            status: 200,
          });
        if (v9 === "/api/v2/proxy/apimart-upload") {
          const v10 = Object["fromEntries"](v8["body"]["entries"]());
          return (
            strict["equal"](v10["apiKey"], "k_apimart"),
            strict["equal"](v10["contentType"], "audio/mpeg"),
            strict["equal"](v10["fileExtension"], "mp3"),
            makeJsonResponse({ cdnUrl: "https://cdn.apimart.ai/files/ref.mp3" })
          );
        }
        throw new Error("unexpected fetch url: " + v9);
      },
      async () => {
        const v11 = await processInputAudios(
          ["https://audio.example/ref.mp3"],
          "k_apimart",
          { provider: "apimart" },
        );
        strict["deepEqual"](v11, ["https://cdn.apimart.ai/files/ref.mp3"]);
      },
    );
  }));
