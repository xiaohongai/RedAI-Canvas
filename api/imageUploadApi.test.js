import test from "node:test";
import strict from "node:assert/strict";
import {
  processInputImages,
  processInputImagesPreserveOrder,
  uploadToRunningHub,
} from "./imageUploadApi.js";
const sleep = (v0) => new Promise((v1) => setTimeout(v1, v0));
function createResponse(v2, v3 = {}) {
  return new Response(v2, {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...v3,
  });
}
async function readUploadMarker(v4) {
  if (!v4 || typeof v4["entries"] !== "function") return "";
  for (const [v5, v6] of v4["entries"]()) {
    if (v5 !== "file") continue;
    if (v6 && typeof v6["text"] === "function") return await v6["text"]();
  }
  return "";
}
async function withMockFetch(v7, v8) {
  const v9 = globalThis["fetch"];
  globalThis["fetch"] = v7;
  try {
    return await v8();
  } finally {
    globalThis["fetch"] = v9;
  }
}
(test("imageUploadApi: processInputImages 空入参返回空数组", async () => {
  (strict["deepEqual"](await processInputImages(null, "k"), []),
    strict["deepEqual"](await processInputImages([], "k"), []));
}),
  test("imageUploadApi: processInputImagesPreserveOrder 空/空白会保序输出空串", async () => {
    const v10 = await processInputImagesPreserveOrder(["", "   "], "k");
    (strict["equal"](v10["length"], 2),
      strict["equal"](v10[0], ""),
      strict["equal"](v10[1], ""));
  }),
  test("imageUploadApi:\x20processInputImages\x20并发上传完成顺序不同也保持输入顺序", async () => {
    const v11 = { a: 20, b: 30, c: 5 };
    await withMockFetch(
      async (v12, v13 = {}) => {
        const v14 = String(v12 || "");
        if (v14["startsWith"]("https://input.example/")) {
          const v15 = v14["split"]("/")["pop"]();
          return new Response(new Blob([v15]), { status: 200 });
        }
        if (v14 === "https://telegra.ph/upload") {
          const v16 = await readUploadMarker(v13["body"]);
          return (
            await sleep(v11[v16] || 0),
            createResponse(JSON["stringify"]([{ src: "/" + v16 + ".png" }]))
          );
        }
        throw new Error("unexpected fetch: " + v14);
      },
      async () => {
        const v17 = await processInputImages(
          [
            "https://input.example/a",
            "https://input.example/b",
            "https://input.example/c",
          ],
          "",
          { compress: false },
        );
        strict["deepEqual"](v17, [
          "https://telegra.ph/a.png",
          "https://telegra.ph/b.png",
          "https://telegra.ph/c.png",
        ]);
      },
    );
  }),
  test("imageUploadApi: RunningHUB upload accepts alternate url fields and reports provider errors", async () => {
    (await withMockFetch(
      async (v18, v19 = {}) => {
        const v20 = String(v18 || "");
        if (v20["startsWith"]("/api/v2/proxy/upload?"))
          return (
            strict["equal"](
              v19["headers"]?.["Authorization"],
              "Bearer k_rh_model",
            ),
            createResponse(
              JSON["stringify"]({
                code: 0,
                data: {
                  fileUrl: "https://www.runninghub.cn/uploaded/file-url.png",
                },
              }),
            )
          );
        throw new Error("unexpected fetch: " + v20);
      },
      async () => {
        const v21 = await uploadToRunningHub(
          new Blob(["rh-image"], { type: "image/png" }),
          "k_rh_model",
        );
        strict["equal"](v21, "https://www.runninghub.cn/uploaded/file-url.png");
      },
    ),
      await withMockFetch(
        async (v22) => {
          const v23 = String(v22 || "");
          if (v23["startsWith"]("/api/v2/proxy/upload?"))
            return createResponse(
              JSON["stringify"]({
                code: 401,
                errorMessage: "invalid\x20model\x20api\x20key",
              }),
            );
          throw new Error("unexpected fetch: " + v23);
        },
        async () => {
          await strict["rejects"](
            () =>
              uploadToRunningHub(
                new Blob(["rh-image"], { type: "image/png" }),
                "bad_key",
              ),
            /invalid model api key.*401/,
          );
        },
      ));
  }),
  test("imageUploadApi: processInputImagesPreserveOrder 上传失败时保留空槽位", async () => {
    await withMockFetch(
      async (v24, v25 = {}) => {
        const v26 = String(v24 || "");
        if (v26["startsWith"]("https://input.example/")) {
          const v27 = v26["split"]("/")["pop"]();
          return new Response(new Blob([v27]), { status: 200 });
        }
        if (v26 === "https://telegra.ph/upload") {
          const v28 = await readUploadMarker(v25["body"]);
          if (v28 === "b")
            return createResponse("upload\x20failed", {
              status: 500,
              headers: { "Content-Type": "text/plain" },
            });
          return createResponse(
            JSON["stringify"]([{ src: "/" + v28 + ".png" }]),
          );
        }
        throw new Error("unexpected fetch: " + v26);
      },
      async () => {
        const v29 = await processInputImagesPreserveOrder(
          [
            "https://input.example/a",
            "https://input.example/b",
            "https://input.example/c",
          ],
          "",
          { compress: false },
        );
        strict["deepEqual"](v29, [
          "https://telegra.ph/a.png",
          "",
          "https://telegra.ph/c.png",
        ]);
      },
    );
  }),
  test("imageUploadApi: 重复 URL 和空白输入不会破坏顺序", async () => {
    await withMockFetch(
      async (v30, v31 = {}) => {
        const v32 = String(v30 || "");
        if (v32["startsWith"]("https://input.example/")) {
          const v33 = v32["split"]("/")["pop"]();
          return new Response(new Blob([v33]), { status: 200 });
        }
        if (v32 === "https://telegra.ph/upload") {
          const v34 = await readUploadMarker(v31["body"]);
          return createResponse(
            JSON["stringify"]([{ src: "/" + v34 + ".png" }]),
          );
        }
        throw new Error("unexpected fetch: " + v32);
      },
      async () => {
        const v35 = await processInputImages(
          [
            "https://input.example/a",
            "",
            "https://input.example/a",
            "https://input.example/b",
          ],
          "",
          { compress: false },
        );
        strict["deepEqual"](v35, [
          "https://telegra.ph/a.png",
          "https://telegra.ph/a.png",
          "https://telegra.ph/b.png",
        ]);
        const v36 = await processInputImagesPreserveOrder(
          [
            "https://input.example/a",
            "   ",
            "https://input.example/a",
            "https://input.example/b",
          ],
          "",
          { compress: false },
        );
        strict["deepEqual"](v36, [
          "https://telegra.ph/a.png",
          "",
          "https://telegra.ph/a.png",
          "https://telegra.ph/b.png",
        ]);
      },
    );
  }),
  test("imageUploadApi:\x20APIMART\x20上传携带\x20API\x20Key\x20并返回\x20URL", async () => {
    const v37 = [];
    await withMockFetch(
      async (v38, v39 = {}) => {
        const v40 = String(v38 || "");
        if (v40 === "https://input.example/ref.png")
          return new Response(new Blob(["ref"], { type: "image/png" }), {
            status: 200,
          });
        if (v40 === "/api/v2/proxy/apimart-upload") {
          strict["equal"](v39["method"], "POST");
          const v41 = Object["fromEntries"](v39["body"]["entries"]());
          return (
            strict["equal"](v41["contentType"], "image/png"),
            strict["equal"](v41["fileExtension"], "png"),
            strict["equal"](v41["apiKey"], "k_apimart"),
            strict["equal"](v41["apiUrl"], "https://api.apimart.ai"),
            v37["push"](await v41["file"]["text"]()),
            createResponse(
              JSON["stringify"]({
                url: "https://upload.apimart.ai/files/ref.png",
              }),
            )
          );
        }
        throw new Error("unexpected fetch: " + v40);
      },
      async () => {
        const v42 = await processInputImages(
          ["https://input.example/ref.png"],
          "k_apimart",
          { compress: false, provider: "apimart" },
        );
        (strict["deepEqual"](v42, ["https://upload.apimart.ai/files/ref.png"]),
          strict["deepEqual"](v37, ["ref"]));
      },
    );
  }),
  test("imageUploadApi:\x20APIMART\x20CDN\x20图片不会重复上传", async () => {
    await withMockFetch(
      async (v43) => {
        throw new Error("unexpected fetch: " + String(v43));
      },
      async () => {
        const v44 = await processInputImages(
          ["https://cdn.apimart.ai/files/existing.png"],
          "k_apimart",
          { compress: false, provider: "apimart" },
        );
        strict["deepEqual"](v44, ["https://cdn.apimart.ai/files/existing.png"]);
      },
    );
  }),
  test("imageUploadApi:\x20APIMART\x20asset\x20URL\x20不会重复上传", async () => {
    await withMockFetch(
      async (v45) => {
        throw new Error("unexpected fetch: " + String(v45));
      },
      async () => {
        const v46 = await processInputImages(
          ["asset://seedance/avatar-image"],
          "k_apimart",
          { compress: false, provider: "apimart" },
        );
        strict["deepEqual"](v46, ["asset://seedance/avatar-image"]);
      },
    );
  }));
