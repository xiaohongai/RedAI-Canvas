import test from "node:test";
import strict from "node:assert/strict";
import {
  __groupBackfillJobsBySrcPathForTest,
  __hasActiveMediaPlaybackForTest,
  __runWithConcurrencyForTest,
} from "./videoThumbBackfill.js";
(test("videoThumbBackfill:\x20srcPath\x20分组去重保持顺序", () => {
  const v0 = __groupBackfillJobsBySrcPathForTest([
    { nodeId: "n1", srcPath: "/output/a.mp4", idx: 0 },
    { nodeId: "n2", srcPath: "/output/b.mp4", idx: 0 },
    { nodeId: "n3", srcPath: "/output/a.mp4", idx: 1 },
    { nodeId: "n4", srcPath: "", idx: 0 },
  ]);
  (strict["equal"](v0["length"], 2),
    strict["equal"](v0[0]["srcPath"], "/output/a.mp4"),
    strict["equal"](v0[1]["srcPath"], "/output/b.mp4"),
    strict["deepEqual"](
      v0[0]["jobs"]["map"]((v1) => v1["nodeId"]),
      ["n1", "n3"],
    ),
    strict["deepEqual"](
      v0[1]["jobs"]["map"]((v2) => v2["nodeId"]),
      ["n2"],
    ));
}),
  test("videoThumbBackfill: worker 池并发不超过上限", async () => {
    const v3 = Array["from"]({ length: 12 }, (v4, v5) => v5);
    let v6 = 0,
      v7 = 0;
    (await __runWithConcurrencyForTest(v3, 3, async () => {
      (v6++,
        (v7 = Math["max"](v7, v6)),
        await new Promise((v8) => setTimeout(v8, 10)),
        v6--);
    }),
      strict["equal"](v7 <= 3, true));
  }),
  test("videoThumbBackfill:\x20可识别正在播放的媒体，后台回填可让路", () => {
    const v9 = globalThis["document"];
    try {
      ((globalThis["document"] = {
        querySelectorAll(v10) {
          return (
            strict["equal"](v10, "video,\x20audio"),
            [
              { paused: true, ended: false },
              { paused: false, ended: false },
            ]
          );
        },
      }),
        strict["equal"](__hasActiveMediaPlaybackForTest(), true),
        (globalThis["document"] = {
          querySelectorAll() {
            return [{ paused: true, ended: false }];
          },
        }),
        strict["equal"](__hasActiveMediaPlaybackForTest(), false));
    } finally {
      globalThis["document"] = v9;
    }
  }));
