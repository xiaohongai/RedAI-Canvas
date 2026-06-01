import test from "node:test";
import strict from "node:assert/strict";
import {
  getNanoBananaModeLabel,
  getNanoBananaModeOptions,
  getNanoBananaSelectionFromModel,
  NANO_BANANA_FAMILIES,
  NANO_BANANA_MODES,
  resolveNanoBananaModelBySelection,
} from "./nanoBananaModeRules.js";
(test("nanoBananaModeRules:\x20RunningHub\x20模型映射为家族\x20+\x20版本模式", () => {
  const v0 = [
    {
      model: "runninghub-model/rhart-image-v1",
      family: NANO_BANANA_FAMILIES["NANOBANANA"],
      mode: NANO_BANANA_MODES["NORMAL"],
      label: "低价版",
      resolved: "runninghub-model/rhart-image-v1",
    },
    {
      model: "runninghub-model/rhart-image-v1-official",
      family: NANO_BANANA_FAMILIES["NANOBANANA"],
      mode: NANO_BANANA_MODES["OFFICIAL"],
      label: "官方版",
      resolved: "runninghub-model/rhart-image-v1-official",
    },
    {
      model: "runninghub-model/rhart-image-n-pro-official",
      family: NANO_BANANA_FAMILIES["NANOBANANA_PRO"],
      mode: NANO_BANANA_MODES["OFFICIAL"],
      label: "官方版",
      resolved: "runninghub-model/rhart-image-n-pro-official",
    },
    {
      model: "runninghub-model/rhart-image-n-g31-flash",
      family: NANO_BANANA_FAMILIES["NANOBANANA_2"],
      mode: NANO_BANANA_MODES["NORMAL"],
      label: "低价版",
      resolved: "runninghub-model/rhart-image-n-g31-flash",
    },
  ];
  for (const v1 of v0) {
    const v2 = getNanoBananaSelectionFromModel(v1["model"], "2K", "runninghub");
    (strict["equal"](v2["provider"], "runninghub"),
      strict["equal"](v2["family"], v1["family"]),
      strict["equal"](v2["mode"], v1["mode"]),
      strict["equal"](v2["model"], v1["resolved"]),
      strict["equal"](
        getNanoBananaModeLabel(v1["family"], v1["mode"], "runninghub"),
        v1["label"],
      ));
  }
}),
  test("nanoBananaModeRules: RunningHub 三个家族都支持低价版和官方版解析", () => {
    const v3 = [
      [
        NANO_BANANA_FAMILIES["NANOBANANA"],
        "runninghub-model/rhart-image-v1",
        "runninghub-model/rhart-image-v1-official",
      ],
      [
        NANO_BANANA_FAMILIES["NANOBANANA_PRO"],
        "runninghub-model/rhart-image-n-pro",
        "runninghub-model/rhart-image-n-pro-official",
      ],
      [
        NANO_BANANA_FAMILIES["NANOBANANA_2"],
        "runninghub-model/rhart-image-n-g31-flash",
        "runninghub-model/rhart-image-n-g31-flash-official",
      ],
    ];
    for (const [v4, v5, v6] of v3) {
      (strict["equal"](
        resolveNanoBananaModelBySelection({
          family: v4,
          mode: NANO_BANANA_MODES["NORMAL"],
          provider: "runninghub",
        }),
        v5,
      ),
        strict["equal"](
          resolveNanoBananaModelBySelection({
            family: v4,
            mode: NANO_BANANA_MODES["OFFICIAL"],
            provider: "runninghub",
          }),
          v6,
        ));
    }
    strict["deepEqual"](
      getNanoBananaModeOptions(
        NANO_BANANA_FAMILIES["NANOBANANA_PRO"],
        "runninghub",
      )["map"]((v7) => v7["label"]),
      ["低价版", "官方版"],
    );
  }),
  test("nanoBananaModeRules: RunningHub GPT image 2 supports cheap and official modes", () => {
    const v8 = getNanoBananaSelectionFromModel(
      "runninghub-model/rhart-image-g-2",
      "2K",
      "runninghub",
    );
    (strict["equal"](v8["provider"], "runninghub"),
      strict["equal"](v8["family"], NANO_BANANA_FAMILIES["GPT_IMAGE_2"]),
      strict["equal"](v8["mode"], NANO_BANANA_MODES["NORMAL"]),
      strict["equal"](v8["model"], "runninghub-model/rhart-image-g-2"));
    const v9 = getNanoBananaSelectionFromModel(
      "runninghub-model/rhart-image-g-2-official",
      "2K",
      "runninghub",
    );
    (strict["equal"](v9["provider"], "runninghub"),
      strict["equal"](v9["family"], NANO_BANANA_FAMILIES["GPT_IMAGE_2"]),
      strict["equal"](v9["mode"], NANO_BANANA_MODES["OFFICIAL"]),
      strict["equal"](v9["model"], "runninghub-model/rhart-image-g-2-official"),
      strict["equal"](
        resolveNanoBananaModelBySelection({
          family: NANO_BANANA_FAMILIES["GPT_IMAGE_2"],
          mode: NANO_BANANA_MODES["NORMAL"],
          provider: "runninghub",
        }),
        "runninghub-model/rhart-image-g-2",
      ),
      strict["equal"](
        resolveNanoBananaModelBySelection({
          family: NANO_BANANA_FAMILIES["GPT_IMAGE_2"],
          mode: NANO_BANANA_MODES["OFFICIAL"],
          provider: "runninghub",
        }),
        "runninghub-model/rhart-image-g-2-official",
      ),
      strict["deepEqual"](
        getNanoBananaModeOptions(
          NANO_BANANA_FAMILIES["GPT_IMAGE_2"],
          "runninghub",
        )["map"]((v10) => v10["mode"]),
        [NANO_BANANA_MODES["NORMAL"], NANO_BANANA_MODES["OFFICIAL"]],
      ));
  }),
  test("nanoBananaModeRules: GRSAI 模式映射保持原行为", () => {
    (strict["equal"](
      resolveNanoBananaModelBySelection({
        family: NANO_BANANA_FAMILIES["NANOBANANA_PRO"],
        mode: NANO_BANANA_MODES["VIP"],
        imageSize: "4K",
      }),
      "nano-banana-pro-4k-vip",
    ),
      strict["equal"](
        resolveNanoBananaModelBySelection({
          family: NANO_BANANA_FAMILIES["NANOBANANA_PRO"],
          mode: NANO_BANANA_MODES["VIP"],
          imageSize: "2K",
        }),
        "nano-banana-pro-vip",
      ),
      strict["equal"](
        resolveNanoBananaModelBySelection({
          family: NANO_BANANA_FAMILIES["NANOBANANA_2"],
          mode: NANO_BANANA_MODES["CL"],
          imageSize: "2K",
        }),
        "nano-banana-2-cl",
      ),
      strict["equal"](
        resolveNanoBananaModelBySelection({
          family: NANO_BANANA_FAMILIES["NANOBANANA_2"],
          mode: NANO_BANANA_MODES["CL"],
          imageSize: "4K",
        }),
        "nano-banana-2-4k-cl",
      ),
      strict["equal"](
        getNanoBananaModeLabel(
          NANO_BANANA_FAMILIES["NANOBANANA_PRO"],
          NANO_BANANA_MODES["NORMAL"],
        ),
        "常规",
      ),
      strict["equal"](
        resolveNanoBananaModelBySelection({
          family: NANO_BANANA_FAMILIES["NANOBANANA_PRO"],
          mode: NANO_BANANA_MODES["VIP"],
          imageSize: "3K",
        }),
        "nano-banana-pro-vip",
      ),
      strict["deepEqual"](
        getNanoBananaModeOptions(NANO_BANANA_FAMILIES["NANOBANANA_PRO"])["map"](
          (v11) => v11["mode"],
        ),
        [
          NANO_BANANA_MODES["NORMAL"],
          NANO_BANANA_MODES["VT"],
          NANO_BANANA_MODES["CL"],
          NANO_BANANA_MODES["VIP"],
        ],
      ));
  }));
