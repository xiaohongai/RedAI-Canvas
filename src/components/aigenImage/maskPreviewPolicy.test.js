import test from "node:test";
import strict from "node:assert/strict";
import { hasAIGenMaskPreviewBaseImage } from "./maskPreviewPolicy.js";
(test("aigen mask preview policy hides masks on empty generation nodes", () => {
  strict["equal"](
    hasAIGenMaskPreviewBaseImage({
      type: "ai-image",
      mask: "output/mask/mask.png",
      maskPreview: "output/mask_preview/mask-preview.png",
    }),
    false,
  );
}),
  test("aigen\x20mask\x20preview\x20policy\x20allows\x20masks\x20when\x20a\x20result\x20image\x20exists", () => {
    (strict["equal"](
      hasAIGenMaskPreviewBaseImage({
        type: "ai-image",
        imageUrl: "/output/result.png",
        maskPreview: "output/mask_preview/mask-preview.png",
      }),
      true,
    ),
      strict["equal"](
        hasAIGenMaskPreviewBaseImage({
          type: "ai-image",
          images: [{ sourceUrl: "/output/result.png" }],
          maskPreview: "output/mask_preview/mask-preview.png",
        }),
        true,
      ));
  }),
  test("aigen\x20mask\x20preview\x20policy\x20ignores\x20error-only\x20result\x20records", () => {
    strict["equal"](
      hasAIGenMaskPreviewBaseImage({
        type: "ai-image",
        images: [{ error: "failed", imageUrl: "/output/result.png" }],
        maskPreview: "output/mask_preview/mask-preview.png",
      }),
      false,
    );
  }));
