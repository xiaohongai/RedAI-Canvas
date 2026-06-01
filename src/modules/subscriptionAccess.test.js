import test from "node:test";
import strict from "node:assert/strict";
import {
  DEFAULT_VIP_GATE_MODEL_ID,
  RH_VIDEO_HD_VIP_MODEL_ID,
  RH_VIDEO_HD_VIP_AI_APP_MODEL_ID,
  RH_ADVANCED_VOICE_CLONE_VIP_MODEL_ID,
  RH_ADVANCED_VOICE_CLONE_VIP_AI_APP_MODEL_ID,
  DREAMINA_VIDEO_VIP_MODEL_ID,
  SUBSCRIPTION_GATE_MANIFESTS,
  resolveVipGateModelId,
  isVipModel,
  isModelAllowed,
} from "./subscriptionAccess.js";
(test("subscription\x20access:\x20VIP\x20gate\x20清单来自共享\x20manifest", () => {
  (strict["equal"](SUBSCRIPTION_GATE_MANIFESTS["length"], 5),
    strict["ok"](
      SUBSCRIPTION_GATE_MANIFESTS["some"](
        (v0) =>
          v0["key"] === "dreaminaVideoVip" &&
          v0["modelId"] === DREAMINA_VIDEO_VIP_MODEL_ID &&
          v0["providers"]["includes"]("dreamina"),
      ),
    ),
    strict["ok"](
      SUBSCRIPTION_GATE_MANIFESTS["some"](
        (v1) =>
          v1["key"] === "runninghubAdvancedVoiceClone" &&
          v1["modelId"] === RH_ADVANCED_VOICE_CLONE_VIP_MODEL_ID &&
          v1["aliases"]["includes"]("advanced_voice_clone"),
      ),
    ),
    strict["ok"](
      SUBSCRIPTION_GATE_MANIFESTS["some"](
        (v2) =>
          v2["key"] === "runninghubCommercialDigitalHuman" &&
          v2["modelId"] === "runninghub/2055639633148563458" &&
          v2["aliases"]["includes"]("commercial_digital_human"),
      ),
    ),
    strict["ok"](
      SUBSCRIPTION_GATE_MANIFESTS["every"]((v3) =>
        v3["legacyAliases"]["every"]((v4) => v4["value"] && v4["deleteWhen"]),
      ),
    ));
}),
  test("subscription access: dreamina 模型统一映射到即梦视频 VIP gate model", () => {
    (strict["equal"](
      resolveVipGateModelId("dreamina/seedance2.0fast"),
      DREAMINA_VIDEO_VIP_MODEL_ID,
    ),
      strict["equal"](
        resolveVipGateModelId("whatever", "dreamina"),
        DREAMINA_VIDEO_VIP_MODEL_ID,
      ));
  }),
  test("subscription\x20access:\x20runninghub\x20模型维持原有\x20gate\x20model", () => {
    (strict["equal"](
      resolveVipGateModelId(DEFAULT_VIP_GATE_MODEL_ID),
      DEFAULT_VIP_GATE_MODEL_ID,
    ),
      strict["equal"](
        resolveVipGateModelId("2041741496667348994"),
        DEFAULT_VIP_GATE_MODEL_ID,
      ),
      strict["equal"](isVipModel(DEFAULT_VIP_GATE_MODEL_ID), true),
      strict["equal"](isVipModel("2041741496667348994"), true));
  }),
  test("subscription access: 视频高清 ai-app 算作 VIP 模型", () => {
    (strict["equal"](isVipModel(RH_VIDEO_HD_VIP_MODEL_ID), true),
      strict["equal"](isVipModel(RH_VIDEO_HD_VIP_AI_APP_MODEL_ID), true),
      strict["equal"](
        isModelAllowed(RH_VIDEO_HD_VIP_MODEL_ID, {
          status: "none",
          entitledModelIds: [RH_VIDEO_HD_VIP_MODEL_ID],
        }),
        false,
      ),
      strict["equal"](
        isModelAllowed(RH_VIDEO_HD_VIP_MODEL_ID, {
          status: "active",
          entitledModelIds: [RH_VIDEO_HD_VIP_AI_APP_MODEL_ID],
        }),
        true,
      ));
  }),
  test("subscription access: 进阶声音克隆 ai-app 和 workflow key 算作 VIP 模型", () => {
    (strict["equal"](isVipModel(RH_ADVANCED_VOICE_CLONE_VIP_MODEL_ID), true),
      strict["equal"](
        isVipModel(RH_ADVANCED_VOICE_CLONE_VIP_AI_APP_MODEL_ID),
        true,
      ),
      strict["equal"](isVipModel("advanced_voice_clone"), true),
      strict["equal"](
        isModelAllowed(RH_ADVANCED_VOICE_CLONE_VIP_AI_APP_MODEL_ID, {
          status: "active",
          entitledModelIds: [RH_ADVANCED_VOICE_CLONE_VIP_MODEL_ID],
        }),
        true,
      ),
      strict["equal"](
        isModelAllowed("advanced_voice_clone", {
          status: "active",
          entitledModelKeys: ["advanced_voice_clone"],
        }),
        true,
      ));
  }),
  test("subscription\x20access:\x20漫画转真人不再进入\x20VIP\x20gate", () => {
    const v5 = "runninghub/1994718111704158209",
      v6 = "ai-app/1994718111704158209",
      v7 = "runninghub/1994711386552999938";
    (strict["equal"](
      SUBSCRIPTION_GATE_MANIFESTS["some"](
        (v8) => v8["key"] === "runninghubAnimeReal",
      ),
      false,
    ),
      strict["equal"](resolveVipGateModelId(v5), v5),
      strict["equal"](resolveVipGateModelId(v6), v6),
      strict["equal"](resolveVipGateModelId(v7), v7),
      strict["equal"](isVipModel(v5), false),
      strict["equal"](isVipModel(v6), false),
      strict["equal"](isVipModel(v7), false),
      strict["equal"](
        isModelAllowed(v5, { status: "none", entitledModelIds: [] }),
        true,
      ));
  }),
  test("subscription access: 即梦模型授权判定读取 dreamina/video_vip", () => {
    const v9 = {
      status: "active",
      entitledModelIds: [DREAMINA_VIDEO_VIP_MODEL_ID],
      entitledModelKeys: [],
    };
    (strict["equal"](
      isModelAllowed("dreamina/seedance2.0_vip", v9, "dreamina"),
      true,
    ),
      strict["equal"](
        isModelAllowed("dreamina/seedance2.0fast", v9, "dreamina"),
        true,
      ));
    const v10 = {
      status: "active",
      entitledModelIds: [DEFAULT_VIP_GATE_MODEL_ID],
      entitledModelKeys: [],
    };
    strict["equal"](
      isModelAllowed("dreamina/seedance2.0fast", v10, "dreamina"),
      false,
    );
  }),
  test("subscription access: 即梦模型授权支持 key alias", () => {
    const v11 = {
      status: "active",
      entitledModelIds: [],
      entitledModelKeys: ["dreamina_video_vip"],
    };
    strict["equal"](isModelAllowed("dreamina/3.5pro", v11), true);
  }));
