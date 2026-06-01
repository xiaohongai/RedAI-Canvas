import test from "node:test";
import strict from "node:assert/strict";
import {
  extractApimartPrivateAvatarAssetUrl,
  pollApimartPrivateAvatarTask,
  submitApimartSeedance2PrivateAvatar,
} from "./apimartPrivateAvatarApi.js";
function jsonResponse(v0, v1 = 200) {
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
(test("apimartPrivateAvatarApi: failed task still returns usable asset URL", () => {
  const v5 = extractApimartPrivateAvatarAssetUrl({
    data: {
      status: "failed",
      result: {
        failed_assets: [{ asset_url: "asset://failed", status: "Failed" }],
        usable_assets: [{ asset_url: "asset://usable", status: "Active" }],
      },
    },
  });
  strict["equal"](v5, "asset://usable");
}),
  test("apimartPrivateAvatarApi: submit uploads source and polls usable asset", async () => {
    const v6 = [];
    (await withMockFetch(
      async (v7, v8 = {}) => {
        const v9 = String(v7);
        v6["push"]({ url: v9, options: v8 });
        if (v9 === "https://source.example.com/avatar.png")
          return new Response(new Blob(["image"], { type: "image/png" }));
        if (v9 === "/api/v2/proxy/apimart-upload") {
          const v10 = Object["fromEntries"](v8["body"]["entries"]());
          return (
            strict["equal"](v10["apiUrl"], "https://api.apimart.ai"),
            jsonResponse({ cdnUrl: "https://cdn.apimart.ai/files/source.png" })
          );
        }
        if (v9 === "/api/v2/proxy/image") {
          const v11 = JSON["parse"](v8["body"]);
          return (
            strict["equal"](
              v11["apiUrl"],
              "https://api.apimart.ai/v1/seedance2/private-avatar",
            ),
            strict["equal"](v11["apiKey"], "k_apimart"),
            strict["equal"](v11["asset_type"], "Image"),
            strict["deepEqual"](v11["assets"], [
              {
                url: "https://cdn.apimart.ai/files/source.png",
                name: "avatar.png",
              },
            ]),
            strict["equal"]("url" in v11, false),
            strict["equal"]("name" in v11, false),
            strict["equal"](
              v11["group"]["name"],
              "aic-seedance2-private-avatar",
            ),
            jsonResponse({ data: { id: "task-avatar-1", status: "submitted" } })
          );
        }
        if (
          decodeURIComponent(v9) ===
          "/api/v2/proxy/task?apiUrl=https://api.apimart.ai/v1/tasks/task-avatar-1?language=zh"
        )
          return (
            strict["equal"](v8["headers"]["Authorization"], "Bearer k_apimart"),
            jsonResponse({
              data: {
                id: "task-avatar-1",
                status: "failed",
                result: {
                  usable_assets: [{ asset_url: "asset://seedance-avatar-ok" }],
                },
              },
            })
          );
        throw new Error("unexpected fetch url: " + v9);
      },
      async () => {
        const v12 = await submitApimartSeedance2PrivateAvatar({
          apiKey: "k_apimart",
          apiUrl: "https://api.apimart.ai/v1",
          url: "https://source.example.com/avatar.png",
          name: "avatar.png",
          assetType: "Image",
          pollIntervalMs: 0,
          maxWaitMs: 1000,
        });
        (strict["equal"](v12["status"], "passed"),
          strict["equal"](v12["taskId"], "task-avatar-1"),
          strict["equal"](v12["assetUrl"], "asset://seedance-avatar-ok"),
          strict["equal"](
            v12["sourceUrl"],
            "https://cdn.apimart.ai/files/source.png",
          ));
      },
    ),
      strict["equal"](v6["length"], 4));
  }),
  test("apimartPrivateAvatarApi: rejects existing asset URL before private avatar submit", async () => {
    await strict["rejects"](
      () =>
        submitApimartSeedance2PrivateAvatar({
          apiKey: "k_apimart",
          url: "asset://seedance-avatar-ok",
          name: "source.png",
          assetType: "Image",
          poll: false,
        }),
      /无需再次人脸检测/,
    );
  }),
  test("apimartPrivateAvatarApi: rejects non-public uploaded URL before private avatar submit", async () => {
    await withMockFetch(
      async (v13) => {
        const v14 = String(v13);
        if (v14 === "https://source.example.com/video.mp4")
          return new Response(new Blob(["video"], { type: "video/mp4" }));
        if (v14 === "/api/v2/proxy/apimart-upload")
          return jsonResponse({
            url: "http://localhost:8777/uploaded/video.mp4",
          });
        if (v14 === "/api/v2/proxy/image")
          throw new Error(
            "private\x20avatar\x20submit\x20should\x20not\x20be\x20called",
          );
        throw new Error("unexpected fetch url: " + v14);
      },
      async () => {
        await strict["rejects"](
          () =>
            submitApimartSeedance2PrivateAvatar({
              apiKey: "k_apimart",
              url: "https://source.example.com/video.mp4",
              name: "source.mp4",
              assetType: "Video",
              poll: false,
            }),
          /本地地址/,
        );
      },
    );
  }),
  test("apimartPrivateAvatarApi:\x20failed\x20task\x20without\x20usable\x20asset\x20rejects", async () => {
    await withMockFetch(
      async (v15) => {
        if (
          decodeURIComponent(String(v15)) ===
          "/api/v2/proxy/task?apiUrl=https://api.apimart.ai/v1/tasks/task-bad?language=zh"
        )
          return jsonResponse({
            data: {
              id: "task-bad",
              status: "failed",
              message: "face quality too low",
            },
          });
        throw new Error("unexpected fetch url: " + String(v15));
      },
      async () => {
        await strict["rejects"](
          () =>
            pollApimartPrivateAvatarTask({
              apiKey: "k_apimart",
              taskId: "task-bad",
              pollIntervalMs: 0,
              maxWaitMs: 100,
            }),
          /face quality too low/,
        );
      },
    );
  }));
