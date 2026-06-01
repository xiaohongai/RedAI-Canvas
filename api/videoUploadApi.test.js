import test from "node:test";
import strict from "node:assert/strict";
import {
  processInputVideos,
  processInputVideosPreserveOrder,
} from "./videoUploadApi.js";
function makeJsonResponse(v0, v1 = 200) {
  return new Response(JSON["stringify"](v0), {
    status: v1,
    headers: { "Content-Type": "application/json" },
  });
}
async function readUploadMarker(v2) {
  if (!v2 || typeof v2["entries"] !== "function") return "";
  for (const [v3, v4] of v2["entries"]()) {
    if (v3 === "file" && v4 && typeof v4["text"] === "function")
      return await v4["text"]();
  }
  return "";
}
async function withMockFetch(v5, v6) {
  const v7 = globalThis["fetch"];
  globalThis["fetch"] = v5;
  try {
    return await v6();
  } finally {
    globalThis["fetch"] = v7;
  }
}
(test("videoUploadApi: processInputVideos 默认按输入顺序返回成功项", async () => {
  await withMockFetch(
    async (v8, v9 = {}) => {
      const v10 = String(v8);
      if (v10["startsWith"]("https://video.example/")) {
        const v11 = v10["split"]("/")["pop"]()?.["replace"](".mp4", "") || "";
        return new Response(new Blob([v11]), { status: 200 });
      }
      if (v10["startsWith"]("/api/v2/proxy/upload?")) {
        strict["equal"](v9["headers"]?.["Authorization"], "Bearer\x20k");
        const v12 = await readUploadMarker(v9["body"]);
        return makeJsonResponse({
          code: 0,
          data: { download_url: "https://www.runninghub.cn/" + v12 + ".mp4" },
        });
      }
      throw new Error("unexpected\x20fetch\x20url:\x20" + v10);
    },
    async () => {
      const v13 = await processInputVideos(
        ["https://video.example/a.mp4", "", "https://video.example/b.mp4"],
        "k",
      );
      strict["deepEqual"](v13, [
        "https://www.runninghub.cn/a.mp4",
        "https://www.runninghub.cn/b.mp4",
      ]);
    },
  );
}),
  test("videoUploadApi: processInputVideosPreserveOrder 保留失败和空白槽位", async () => {
    await withMockFetch(
      async (v14, v15 = {}) => {
        const v16 = String(v14);
        if (v16["startsWith"]("https://video.example/")) {
          const v17 = v16["split"]("/")["pop"]()?.["replace"](".mp4", "") || "";
          return new Response(new Blob([v17]), { status: 200 });
        }
        if (v16["startsWith"]("/api/v2/proxy/upload?")) {
          strict["equal"](v15["headers"]?.["Authorization"], "Bearer k");
          const v18 = await readUploadMarker(v15["body"]);
          if (v18 === "b")
            return makeJsonResponse({ code: 500, message: "upload failed" });
          return makeJsonResponse({
            code: 0,
            data: { download_url: "https://www.runninghub.cn/" + v18 + ".mp4" },
          });
        }
        throw new Error("unexpected fetch url: " + v16);
      },
      async () => {
        const v19 = await processInputVideosPreserveOrder(
          [
            "https://video.example/a.mp4",
            "",
            "https://video.example/b.mp4",
            "https://video.example/c.mp4",
          ],
          "k",
        );
        strict["deepEqual"](v19, [
          "https://www.runninghub.cn/a.mp4",
          "",
          "",
          "https://www.runninghub.cn/c.mp4",
        ]);
      },
    );
  }),
  test("videoUploadApi: APIMART 上传携带 API Key 并返回 CDN URL", async () => {
    const v20 = [];
    await withMockFetch(
      async (v21, v22 = {}) => {
        const v23 = String(v21);
        if (v23 === "https://video.example/source.mp4")
          return new Response(new Blob(["source"], { type: "video/mp4" }), {
            status: 200,
          });
        if (v23 === "/api/v2/proxy/apimart-upload") {
          strict["equal"](v22["method"], "POST");
          const v24 = Object["fromEntries"](v22["body"]["entries"]());
          return (
            strict["equal"](v24["contentType"], "video/mp4"),
            strict["equal"](v24["fileExtension"], "mp4"),
            strict["equal"](v24["apiKey"], "k_apimart"),
            strict["equal"](v24["apiUrl"], "https://api.apimart.ai"),
            v20["push"](await v24["file"]["text"]()),
            makeJsonResponse({
              cdnUrl: "https://cdn.apimart.ai/files/source.mp4",
            })
          );
        }
        throw new Error("unexpected fetch url: " + v23);
      },
      async () => {
        const v25 = await processInputVideos(
          ["https://video.example/source.mp4"],
          "k_apimart",
          { provider: "apimart" },
        );
        (strict["deepEqual"](v25, ["https://cdn.apimart.ai/files/source.mp4"]),
          strict["deepEqual"](v20, ["source"]));
      },
    );
  }),
  test("videoUploadApi: APIMART CDN 视频不会重复上传", async () => {
    await withMockFetch(
      async (v26) => {
        throw new Error("unexpected fetch url: " + String(v26));
      },
      async () => {
        const v27 = await processInputVideos(
          ["https://cdn.apimart.ai/files/existing.mp4"],
          "k_apimart",
          { provider: "apimart" },
        );
        strict["deepEqual"](v27, ["https://cdn.apimart.ai/files/existing.mp4"]);
      },
    );
  }),
  test("videoUploadApi: APIMART asset URL 不会重复上传", async () => {
    await withMockFetch(
      async (v28) => {
        throw new Error("unexpected fetch url: " + String(v28));
      },
      async () => {
        const v29 = await processInputVideos(
          ["asset://seedance/avatar-video"],
          "k_apimart",
          { provider: "apimart" },
        );
        strict["deepEqual"](v29, ["asset://seedance/avatar-video"]);
      },
    );
  }));
