import test from "node:test";
import strict from "node:assert/strict";
import {
  getAllowedRatiosForProviderModel,
  normalizeRatioLabelText,
  parseRatioLabel,
  pickClosestRatio,
  pickClosestRatioForProviderModel,
  resolveAdaptiveSourceSize,
  resolveProviderRatioPayload,
} from "./imageRatioPolicy.js";
const GPT_IMAGE_2_RATIO_LABELS = [
    "1:1",
    "3:2",
    "2:3",
    "4:3",
    "3:4",
    "5:4",
    "4:5",
    "16:9",
    "9:16",
    "2:1",
    "1:2",
    "21:9",
    "9:21",
  ],
  GPT_IMAGE_2_4K_RATIO_LABELS = ["16:9", "9:16", "2:1", "1:2", "21:9", "9:21"],
  GRSAI_GPT_IMAGE_2_RATIO_LABELS = [
    "1:1",
    "16:9",
    "9:16",
    "4:3",
    "3:4",
    "3:2",
    "2:3",
    "5:4",
    "4:5",
    "21:9",
    "9:21",
    "1:3",
    "3:1",
    "2:1",
    "1:2",
  ],
  GRSAI_GPT_IMAGE_2_1K_RATIO_LABELS = [
    "1:1",
    "16:9",
    "9:16",
    "4:3",
    "3:4",
    "3:2",
    "2:3",
    "5:4",
    "4:5",
    "21:9",
    "9:21",
    "1:2",
    "2:1",
  ],
  QWEN_IMAGE_RATIO_LABELS = ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3"];
(test("imageRatioPolicy:\x20nearest\x20ratio\x20mapping\x20works\x20for\x20landscape", () => {
  (strict["equal"](pickClosestRatio(15, 9), "16:9"),
    strict["equal"](pickClosestRatio(17, 9), "16:9"));
}),
  test("imageRatioPolicy:\x20normalizes\x20full-width\x20ratio\x20separators", () => {
    (strict["equal"](normalizeRatioLabelText("16 ﹕ 9"), "16:9"),
      strict["deepEqual"](parseRatioLabel("16：9"), {
        w: 16,
        h: 9,
        label: "16:9",
      }),
      strict["deepEqual"](parseRatioLabel("16∶9"), {
        w: 16,
        h: 9,
        label: "16:9",
      }),
      strict["deepEqual"](parseRatioLabel("16 ﹕ 9"), {
        w: 16,
        h: 9,
        label: "16:9",
      }));
  }),
  test("imageRatioPolicy:\x20nearest\x20ratio\x20mapping\x20works\x20for\x20portrait\x20and\x20invalid\x20sizes", () => {
    (strict["equal"](pickClosestRatio(700, 1300), "9:16"),
      strict["equal"](pickClosestRatio(0, 0), "1:1"));
  }),
  test("imageRatioPolicy: adaptive source prefers display > input > fallback", () => {
    const v0 = resolveAdaptiveSourceSize({
      displayWidth: 1600,
      displayHeight: 900,
      inputWidth: 800,
      inputHeight: 1200,
    });
    strict["deepEqual"](v0, { width: 1600, height: 900, source: "display" });
    const v1 = resolveAdaptiveSourceSize({
      displayWidth: 0,
      displayHeight: 0,
      inputWidth: 800,
      inputHeight: 1200,
    });
    strict["deepEqual"](v1, {
      width: 800,
      height: 1200,
      source: "input-media",
    });
    const v2 = resolveAdaptiveSourceSize({});
    strict["deepEqual"](v2, { width: 1, height: 1, source: "fallback" });
  }),
  test("imageRatioPolicy: provider payload supports dimensions and none", () => {
    const v3 = resolveProviderRatioPayload({
      provider: "runninghub",
      model: "runninghub-model/seedream-v4.5",
      ratioLabel: "15:9",
      imageSize: "2K",
    });
    (strict["equal"](v3["ratioCapability"], "dimensions"),
      strict["equal"](v3["resolvedRatioLabel"], "16:9"),
      strict["ok"](Number["isInteger"](v3["params"]["width"])),
      strict["ok"](Number["isInteger"](v3["params"]["height"])));
    const v4 = resolveProviderRatioPayload({
      provider: "runninghubwf",
      model: "runninghub/1994718111704158209",
      ratioLabel: "16:9",
      imageSize: "2K",
    });
    (strict["equal"](v4["ratioCapability"], "none"),
      strict["equal"](v4["suppressAspectRatio"], true),
      strict["deepEqual"](v4["params"], {}));
    const v5 = resolveProviderRatioPayload({
      provider: "runninghubwf",
      model: "runninghub/2050306122774532097",
      ratioLabel: "16:9",
      imageSize: "2K",
    });
    (strict["equal"](v5["ratioCapability"], "dimensions"),
      strict["equal"](v5["resolvedRatioLabel"], "16:9"),
      strict["ok"](Number["isInteger"](v5["params"]["width"])),
      strict["ok"](Number["isInteger"](v5["params"]["height"])));
  }),
  test("imageRatioPolicy: apimart seedream ratio allowlist follows model rules", () => {
    const v6 = getAllowedRatiosForProviderModel(
      "apimart",
      "apimart/seedream-4.5",
    )["map"]((v7) => v7["label"]);
    (strict["ok"](v6["includes"]("9:21")),
      strict["equal"](v6["includes"]("5:4"), false),
      strict["equal"](v6["includes"]("4:5"), false));
    const v8 = getAllowedRatiosForProviderModel(
      "apimart",
      "apimart/seedream-5.0-lite",
    )["map"]((v9) => v9["label"]);
    (strict["equal"](v8["includes"]("9:21"), false),
      strict["equal"](v8["includes"]("5:4"), false),
      strict["equal"](v8["includes"]("4:5"), false));
  }),
  test("imageRatioPolicy:\x20apimart\x20seedream\x20falls\x20back\x20from\x20unsupported\x205:4\x20ratio", () => {
    const v10 = resolveProviderRatioPayload({
      provider: "apimart",
      model: "apimart/seedream-4.5",
      ratioLabel: "5:4",
      imageSize: "2K",
    });
    (strict["equal"](v10["ratioCapability"], "size"),
      strict["equal"](v10["params"]["size"], "4:3"));
  }),
  test("imageRatioPolicy: apimart qwen-image-2.0 uses documented ratios only", () => {
    const v11 = getAllowedRatiosForProviderModel(
      "apimart",
      "apimart/qwen-image-2.0",
      "2K",
    )["map"]((v12) => v12["label"]);
    strict["deepEqual"](v11, QWEN_IMAGE_RATIO_LABELS);
    const v13 = resolveProviderRatioPayload({
      provider: "apimart",
      model: "apimart/qwen-image-2.0",
      ratioLabel: "5:4",
      imageSize: "2K",
    });
    (strict["equal"](v13["ratioCapability"], "size"),
      strict["equal"](v13["resolvedRatioLabel"], "4:3"),
      strict["equal"](v13["params"]["size"], "4:3"));
  }),
  test("imageRatioPolicy: apimart z-image-turbo uses documented ratios only", () => {
    const v14 = getAllowedRatiosForProviderModel(
      "apimart",
      "apimart/z-image-turbo",
      "2K",
    )["map"]((v15) => v15["label"]);
    strict["deepEqual"](v14, QWEN_IMAGE_RATIO_LABELS);
    const v16 = resolveProviderRatioPayload({
      provider: "apimart",
      model: "apimart/z-image-turbo",
      ratioLabel: "5:4",
      imageSize: "2K",
    });
    (strict["equal"](v16["ratioCapability"], "size"),
      strict["equal"](v16["resolvedRatioLabel"], "4:3"),
      strict["equal"](v16["params"]["size"], "4:3"));
  }),
  test("imageRatioPolicy: apimart wan2.7-image uses documented ratios only", () => {
    const v17 = getAllowedRatiosForProviderModel(
      "apimart",
      "apimart/wan2.7-image",
      "2K",
    )["map"]((v18) => v18["label"]);
    strict["deepEqual"](v17, QWEN_IMAGE_RATIO_LABELS);
    const v19 = resolveProviderRatioPayload({
      provider: "apimart",
      model: "apimart/wan2.7-image",
      ratioLabel: "5:4",
      imageSize: "2K",
    });
    (strict["equal"](v19["ratioCapability"], "size"),
      strict["equal"](v19["resolvedRatioLabel"], "4:3"),
      strict["equal"](v19["params"]["size"], "4:3"));
  }),
  test("imageRatioPolicy: apimart gpt-image-2 supports documented ratios outside 4K", () => {
    const v20 = getAllowedRatiosForProviderModel(
      "apimart",
      "apimart/gpt-image-2",
      "2K",
    )["map"]((v21) => v21["label"]);
    strict["deepEqual"](v20, GPT_IMAGE_2_RATIO_LABELS);
  }),
  test("imageRatioPolicy: grsai gpt-image-2 supports official 2K/4K ratios", () => {
    for (const v22 of [
      "gpt-image-2",
      "grsai/gpt-image-2",
      "gpt-image-2-vip",
      "grsai/gpt-image-2-vip",
    ]) {
      const v23 = getAllowedRatiosForProviderModel("grsai", v22, "2K")["map"](
        (v24) => v24["label"],
      );
      strict["deepEqual"](v23, GRSAI_GPT_IMAGE_2_RATIO_LABELS);
    }
  }),
  test("imageRatioPolicy: grsai gpt-image-2 1K only keeps official 1K pixel ratios", () => {
    const v25 = getAllowedRatiosForProviderModel("grsai", "gpt-image-2", "1K")[
      "map"
    ]((v26) => v26["label"]);
    strict["deepEqual"](v25, GRSAI_GPT_IMAGE_2_1K_RATIO_LABELS);
  }),
  test("imageRatioPolicy: runninghub gpt-image-2 supports documented ratios", () => {
    for (const v27 of [
      "runninghub-model/rhart-image-g-2",
      "runninghub-model/rhart-image-g-2-official",
    ]) {
      const v28 = getAllowedRatiosForProviderModel("runninghub", v27, "2K")[
        "map"
      ]((v29) => v29["label"]);
      strict["deepEqual"](v28, GPT_IMAGE_2_RATIO_LABELS);
    }
  }),
  test("imageRatioPolicy:\x20runninghub\x20official\x20gpt-image-2\x204K\x20only\x20allows\x20supported\x20ratios", () => {
    const v30 = getAllowedRatiosForProviderModel(
      "runninghub",
      "runninghub-model/rhart-image-g-2-official",
      "4K",
    )["map"]((v31) => v31["label"]);
    strict["deepEqual"](v30, GPT_IMAGE_2_4K_RATIO_LABELS);
  }),
  test("imageRatioPolicy: runninghub gpt-image-2 falls back to nearest documented ratio", () => {
    const v32 = resolveProviderRatioPayload({
      provider: "runninghub",
      model: "runninghub-model/rhart-image-g-2-official",
      ratioLabel: "1:8",
      imageSize: "4K",
    });
    (strict["equal"](v32["ratioCapability"], "aspectRatio"),
      strict["equal"](v32["resolvedRatioLabel"], "9:21"),
      strict["equal"](v32["params"]["aspectRatio"], "9:21"));
  }),
  test("imageRatioPolicy:\x20runninghub\x20official\x20gpt-image-2\x204K\x20falls\x20back\x20by\x20direction", () => {
    (strict["equal"](
      pickClosestRatioForProviderModel({
        provider: "runninghub",
        model: "runninghub-model/rhart-image-g-2-official",
        ratioLabel: "1:1",
        imageSize: "4K",
      }),
      "16:9",
    ),
      strict["equal"](
        resolveProviderRatioPayload({
          provider: "runninghub",
          model: "runninghub-model/rhart-image-g-2-official",
          ratioLabel: "5:4",
          imageSize: "4K",
        })["params"]["aspectRatio"],
        "16:9",
      ));
  }),
  test("imageRatioPolicy: grsai gpt-image-2 falls back to nearest documented ratio", () => {
    const v33 = resolveProviderRatioPayload({
      provider: "grsai",
      model: "gpt-image-2",
      ratioLabel: "1:8",
      imageSize: "2K",
    });
    (strict["equal"](v33["ratioCapability"], "aspectRatio"),
      strict["equal"](v33["resolvedRatioLabel"], "1:3"),
      strict["equal"](v33["params"]["aspectRatio"], "1:3"));
  }),
  test("imageRatioPolicy: apimart gpt-image-2 4K only allows supported ratios", () => {
    const v34 = getAllowedRatiosForProviderModel(
      "apimart",
      "apimart/gpt-image-2",
      "4K",
    )["map"]((v35) => v35["label"]);
    strict["deepEqual"](v34, GPT_IMAGE_2_4K_RATIO_LABELS);
  }),
  test("imageRatioPolicy: apimart gpt-image-2 4K falls back by direction", () => {
    (strict["equal"](
      pickClosestRatioForProviderModel({
        provider: "apimart",
        model: "apimart/gpt-image-2",
        ratioLabel: "1:1",
        imageSize: "4K",
      }),
      "16:9",
    ),
      strict["equal"](
        pickClosestRatioForProviderModel({
          provider: "apimart",
          model: "apimart/gpt-image-2",
          ratioLabel: "4:5",
          imageSize: "4K",
        }),
        "9:16",
      ),
      strict["equal"](
        resolveProviderRatioPayload({
          provider: "apimart",
          model: "apimart/gpt-image-2",
          ratioLabel: "5:4",
          imageSize: "4K",
        })["params"]["size"],
        "16:9",
      ));
  }),
  test("imageRatioPolicy: grsai gpt-image-2 4K follows official GRSAI ratios", () => {
    for (const v36 of ["gpt-image-2", "grsai/gpt-image-2-vip"]) {
      const v37 = getAllowedRatiosForProviderModel("grsai", v36, "4K")["map"](
        (v38) => v38["label"],
      );
      strict["deepEqual"](v37, GRSAI_GPT_IMAGE_2_RATIO_LABELS);
    }
  }),
  test("imageRatioPolicy: grsai gpt-image-2 4K falls back within official ratios", () => {
    (strict["equal"](
      pickClosestRatioForProviderModel({
        provider: "grsai",
        model: "gpt-image-2",
        ratioLabel: "1:1",
        imageSize: "4K",
      }),
      "1:1",
    ),
      strict["equal"](
        pickClosestRatioForProviderModel({
          provider: "grsai",
          model: "gpt-image-2-vip",
          ratioLabel: "4:5",
          imageSize: "4K",
        }),
        "4:5",
      ),
      strict["equal"](
        resolveProviderRatioPayload({
          provider: "grsai",
          model: "gpt-image-2",
          ratioLabel: "5:4",
          imageSize: "4K",
        })["params"]["aspectRatio"],
        "5:4",
      ));
  }),
  test("imageRatioPolicy: nano-banana-2 允许扩展纵横比", () => {
    const v39 = getAllowedRatiosForProviderModel("grsai", "nano-banana-2")[
      "map"
    ]((v40) => v40["label"]);
    (strict["ok"](v39["includes"]("1:4")),
      strict["ok"](v39["includes"]("4:1")),
      strict["ok"](v39["includes"]("1:8")),
      strict["ok"](v39["includes"]("8:1")));
    const v41 = getAllowedRatiosForProviderModel(
      "apimart",
      "apimart/nano-banana-2",
    )["map"]((v42) => v42["label"]);
    (strict["ok"](v41["includes"]("1:4")),
      strict["ok"](v41["includes"]("4:1")),
      strict["ok"](v41["includes"]("1:8")),
      strict["ok"](v41["includes"]("8:1")));
    const v43 = getAllowedRatiosForProviderModel("grsai", "nano-banana")["map"](
      (v44) => v44["label"],
    );
    (strict["equal"](v43["includes"]("1:4"), false),
      strict["equal"](v43["includes"]("4:1"), false));
  }),
  test("imageRatioPolicy: 从 nano2 切走后非常规比例按最近值回落", () => {
    const v45 = resolveProviderRatioPayload({
      provider: "grsai",
      model: "nano-banana",
      ratioLabel: "1:4",
      imageSize: "2K",
    });
    (strict["equal"](v45["resolvedRatioLabel"], "9:16"),
      strict["equal"](v45["params"]["aspectRatio"], "9:16"));
    const v46 = resolveProviderRatioPayload({
      provider: "grsai",
      model: "nano-banana",
      ratioLabel: "8:1",
      imageSize: "2K",
    });
    (strict["equal"](v46["resolvedRatioLabel"], "21:9"),
      strict["equal"](v46["params"]["aspectRatio"], "21:9"));
  }),
  test("imageRatioPolicy: apimart nano-banana-2 透传扩展比例为 size", () => {
    const v47 = resolveProviderRatioPayload({
      provider: "apimart",
      model: "apimart/nano-banana-2",
      ratioLabel: "1:8",
      imageSize: "2K",
    });
    (strict["equal"](v47["ratioCapability"], "size"),
      strict["equal"](v47["resolvedRatioLabel"], "1:8"),
      strict["equal"](v47["params"]["size"], "1:8"));
  }));
