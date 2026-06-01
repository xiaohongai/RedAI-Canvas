import test from "node:test";
import strict from "node:assert/strict";
import {
  cropGridTilesToServer,
  saveOutputFromUrlToServer,
} from "./projectsV2Api.js";
(test("projectsV2Api: cropGridTilesToServer posts normalized grid crop payload", async () => {
  const v0 = globalThis["fetch"];
  let v1 = "",
    v2 = null;
  try {
    globalThis["fetch"] = async (v3, v4) => {
      return (
        (v1 = String(v3)),
        (v2 = v4),
        {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => ({
            success: true,
            tiles: [{ localPath: "output/tile.jpg" }],
          }),
          text: async () => JSON["stringify"]({ success: true }),
        }
      );
    };
    const v5 = await cropGridTilesToServer({
      localPath: "/output/source.png",
      cols: "2",
      rows: 2.2,
      ext: "JPG",
      quality: "88",
      subDir: "Multiple grids",
    });
    (strict["equal"](v1, "/api/v2/grid_tiles/crop"),
      strict["equal"](v2["method"], "POST"),
      strict["equal"](v2["headers"]["Content-Type"], "application/json"),
      strict["deepEqual"](JSON["parse"](v2["body"]), {
        localPath: "/output/source.png",
        cols: 2,
        rows: 2,
        ext: "jpg",
        quality: 88,
        subDir: "Multiple grids",
      }),
      strict["deepEqual"](v5, {
        success: true,
        tiles: [{ localPath: "output/tile.jpg" }],
      }));
  } finally {
    globalThis["fetch"] = v0;
  }
}),
  test("projectsV2Api: saveOutputFromUrlToServer reuses same in-flight save", async () => {
    const v6 = globalThis["fetch"];
    let v7 = 0,
      v8 = null;
    try {
      globalThis["fetch"] = async (v9, v10) => {
        return (
          strict["equal"](String(v9), "/api/v2/save_output_from_url"),
          (v7 += 1),
          (v8 = JSON["parse"](String(v10?.["body"] || "{}"))),
          await Promise["resolve"](),
          {
            ok: true,
            status: 200,
            headers: { get: () => "application/json" },
            json: async () => ({
              success: true,
              path: "output/deduped-url.png",
              localPath: "output/deduped-url.png",
              url: "/output/deduped-url.png",
            }),
            text: async () => JSON["stringify"]({ success: true }),
          }
        );
      };
      const v11 = "https://cdn.example.com/deduped-url.png",
        [v12, v13] = await Promise["all"]([
          saveOutputFromUrlToServer({ url: v11, ext: "png" }),
          saveOutputFromUrlToServer({ url: v11, ext: "png" }),
        ]);
      (strict["equal"](v7, 1),
        strict["equal"](v8["dedupeKey"], v11),
        strict["equal"](v12["path"], "output/deduped-url.png"),
        strict["equal"](v13["path"], "output/deduped-url.png"));
    } finally {
      globalThis["fetch"] = v6;
    }
  }));
