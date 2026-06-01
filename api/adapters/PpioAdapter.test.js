import test from "node:test";
import strict from "node:assert/strict";
import { buildImageRequest } from "./PpioAdapter.js";
function createCtx() {
  return {
    getProviderConfig(v0) {
      if (v0 === "ppio")
        return { apiUrl: "https://api.ppio.example.com", apiKey: "k_ppio" };
      if (v0 === "grsai")
        return { apiUrl: "https://api.grsai.example.com", apiKey: "k_grsai" };
      return {};
    },
    async processInputImages(v1 = []) {
      return Array["isArray"](v1) ? v1["filter"](Boolean) : [];
    },
  };
}
function parseSize(v2) {
  const v3 = String(v2 || ""),
    v4 = v3["match"](/^(\d+)x(\d+)$/);
  if (!v4) return null;
  return { width: Number(v4[1]), height: Number(v4[2]) };
}
(test("PpioAdapter: 自适应默认回退 1:1，但支持 resolvedRatioLabel 覆盖", async () => {
  const v5 = createCtx(),
    v6 = await buildImageRequest(
      {
        model: "ppio/seedream-4.0",
        prompt: "p",
        imageSize: "2K",
        aspectRatio: "自适应",
        inputUrls: [],
      },
      "p",
      v5,
    );
  strict["equal"](v6["body"]["size"], "2048x2048");
  const v7 = await buildImageRequest(
    {
      model: "ppio/seedream-4.0",
      prompt: "p",
      imageSize: "2K",
      aspectRatio: "自适应",
      resolvedRatioLabel: "16:9",
      inputUrls: [],
    },
    "p",
    v5,
  );
  strict["equal"](v7["body"]["size"], "2752x1536");
  const v8 = await buildImageRequest(
    {
      model: "ppio/seedream-4.0",
      prompt: "p",
      imageSize: "2K",
      aspectRatio: "",
      inputUrls: [],
    },
    "p",
    v5,
  );
  strict["equal"](v8["body"]["size"], "2048x2048");
}),
  test("PpioAdapter: all quality and ratio mappings satisfy pixel bounds and 64 alignment", async () => {
    const v9 = createCtx(),
      v10 = ["1K", "2K", "3K", "4K"],
      v11 = [
        "1:1",
        "9:16",
        "16:9",
        "3:4",
        "4:3",
        "3:2",
        "2:3",
        "5:4",
        "4:5",
        "21:9",
      ],
      v12 = 2560 * 1440,
      v13 = 10404496,
      v14 = 1 / 16,
      v15 = 16;
    for (const v16 of v10) {
      for (const v17 of v11) {
        const v18 = await buildImageRequest(
            {
              model: "ppio/seedream-5.0-lite",
              prompt: "p",
              imageSize: v16,
              aspectRatio: v17,
              inputUrls: [],
            },
            "p",
            v9,
          ),
          v19 = parseSize(v18["body"]["size"]);
        strict["ok"](
          v19,
          "invalid\x20size\x20format:\x20" + v18["body"]["size"],
        );
        const v20 = v19["width"] * v19["height"],
          v21 = v19["width"] / v19["height"];
        (strict["equal"](
          v19["width"] % 64,
          0,
          "瀹芥湭64瀵归綈: " + v18["body"]["size"],
        ),
          strict["equal"](
            v19["height"] % 64,
            0,
            "height is not 64-aligned: " + v18["body"]["size"],
          ),
          strict["ok"](
            v20 >= v12,
            "pixel count is too small: " + v18["body"]["size"],
          ),
          strict["ok"](
            v20 <= v13,
            "pixel\x20count\x20is\x20too\x20large:\x20" + v18["body"]["size"],
          ),
          strict["ok"](
            v21 >= v14,
            "ratio is too small: " + v18["body"]["size"],
          ),
          strict["ok"](
            v21 <= v15,
            "ratio is too large: " + v18["body"]["size"],
          ));
      }
    }
  }),
  test("PpioAdapter: 多图输入按上传处理后的顺序写入请求体", async () => {
    const v22 = [],
      v23 = {
        ...createCtx(),
        async processInputImages(v24 = []) {
          return (
            v22["push"](...v24),
            v24["map"](
              (v25) =>
                "https://uploaded.example/" +
                String(v25)["split"]("/")["pop"](),
            )
          );
        },
      },
      v26 = await buildImageRequest(
        {
          model: "ppio/seedream-4.0",
          prompt: "p",
          imageSize: "2K",
          aspectRatio: "1:1",
          inputUrls: [
            "https://local.example/target.png",
            "https://local.example/source.png",
            "https://local.example/style.png",
          ],
        },
        "p",
        v23,
      );
    (strict["deepEqual"](v22, [
      "https://local.example/target.png",
      "https://local.example/source.png",
      "https://local.example/style.png",
    ]),
      strict["deepEqual"](v26["body"]["images"], [
        "https://uploaded.example/target.png",
        "https://uploaded.example/source.png",
        "https://uploaded.example/style.png",
      ]));
  }));
