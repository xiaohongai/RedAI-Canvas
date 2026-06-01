import test from "node:test";
import strict from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildModelUiSchemaDefaultParams,
  buildUiSchemaParamPatch,
  evaluateUiSchemaNumberExpression,
  hasModelUiSchema,
  renderModelUiSchemaControls,
  renderUiSchemaFields,
  syncModelUiSchemaControls,
} from "../aigenImage/uiSchemaRenderer.js";
import {
  buildVideoWorkflowDisplayParamsPatch,
  buildVideoWorkflowGenerationParamsPatch,
  buildVideoWorkflowModelSelectionPatch,
  getRunningHubVideoWorkflowFpsOptions,
  hasRunningHubVideoWorkflowUiPlacement,
} from "./runningHubVideoUiSchema.js";
import {
  buildDreaminaModelSelectionParamPatch,
  buildDreaminaParamPatch,
  buildDreaminaParamSchemaFields,
  buildDreaminaRouteModeUpdate,
  getDreaminaEffectiveNodeData,
  resolveDreaminaRememberedRouteModel,
} from "./dreaminaParameterSchema.js";
import {
  buildVideoModelApiModelSelectionPatch,
  createVideoNodeParameterPanelModule,
  resolveVideoPromptPlaceholder,
} from "./parameterPanelModule.js";
import {
  buildApimartVideoMenuItemsHtml,
  buildApimartVideoLogoHTML,
  buildDreaminaVideoLogoHTML,
  buildDreaminaOfficialVideoMenuItems,
  buildDreaminaTaskModelMenuHtml,
  buildRunningHubVideoModelApiMenuItems,
  buildRunningHubVideoWorkflowMenuItems,
  buildVolcengineOfficialVideoMenuItems,
  buildVolcengineVideoLogoHTML,
  getDreaminaTaskModelMenuItems,
  getRhV54FpsOptions,
  normalizeRhV54Fps,
} from "./parameterPanelModelHelpers.js";
import { closeNodeFooterMenus } from "../shared/nodeFooterControls.js";
import {
  getModelManifest,
  resolveModelExecution,
} from "../../manifests/index.js";
const __dirname = dirname(fileURLToPath(import.meta["url"])),
  source = readFileSync(join(__dirname, "parameterPanelModule.js"), "utf8"),
  uiSchemaRendererSource = readFileSync(
    join(__dirname, "..", "aigenImage", "uiSchemaRenderer.js"),
    "utf8",
  ),
  imageUiModuleSource = readFileSync(
    join(__dirname, "..", "aigenImage", "uiModule.impl.js"),
    "utf8",
  ),
  uiModuleModelHelpersSource = readFileSync(
    join(__dirname, "..", "aigenImage", "uiModuleModelHelpers.js"),
    "utf8",
  ),
  videoNodeSource = readFileSync(
    join(__dirname, "..", "AIGenVideoNode.js"),
    "utf8",
  ),
  parameterPanelModelHelpersSource = readFileSync(
    join(__dirname, "parameterPanelModelHelpers.js"),
    "utf8",
  ),
  nodeTypesCss = readFileSync(
    join(__dirname, "..", "..", "..", "styles", "node-types.css"),
    "utf8",
  );
function extractMenuModelOrder(v0) {
  return Array["from"](String(v0 || "")["matchAll"](/data-value="([^"]+)"/g))[
    "map"
  ]((v1) => v1[1]);
}
(test("video\x20parameter\x20panel:\x20官方即梦和\x20APIMart\x20即梦显示名分离", () => {
  const v2 = buildDreaminaOfficialVideoMenuItems();
  strict["deepEqual"](v2, [
    {
      modelId: "dreamina/text2video",
      provider: "dreamina",
      label: "即梦官方",
      subtitle: "无图文生视频，单图图生视频",
      iconHtml: buildDreaminaVideoLogoHTML(20),
      vip: true,
    },
  ]);
  const v3 = buildApimartVideoMenuItemsHtml(
    "apimart/doubao-seedance-2.0-fast",
    "apimart",
  );
  (strict["match"](
    v3,
    /class="floating-menu-item node-menu-item active" data-value="apimart\/doubao-seedance-2\.0-fast" data-provider="apimart" data-apimart-jimeng="1"/,
  ),
    strict["match"](v3, /<div class="fmi-title">即梦视频<\/div>/),
    strict["match"](
      v3,
      /<img src="images\/jimeng\.png" class="node-menu-icon" alt="dreamina">/,
    ),
    strict["match"](
      v3,
      /<div class="fmi-sub">Seedance 系列，文生\/图生\/首尾帧参考素材<\/div>/,
    ),
    strict["match"](
      v3,
      /class="floating-menu-item node-menu-item" data-value="apimart\/happyhorse-1\.0" data-provider="apimart" data-apimart-video-model="1"/,
    ),
    strict["match"](v3, /<div class="fmi-title">HappyHorse 1\.0<\/div>/),
    strict["match"](v3, /data-value="apimart\/veo3-fast"/),
    strict["match"](v3, /data-value="apimart\/grok-imagine-1\.0"/),
    strict["match"](v3, /data-value="apimart\/omni-flash-ext"/),
    strict["match"](v3, /<div class="fmi-title">Gemini Omni Flash<\/div>/),
    strict["match"](v3, /data-value="apimart\/minimax-hailuo-2\.3"/),
    strict["match"](v3, /data-value="apimart\/wan2\.7"/),
    strict["match"](v3, /data-value="apimart\/kling-v3-omni"/),
    strict["match"](v3, /data-value="apimart\/viduq3"/),
    strict["deepEqual"](extractMenuModelOrder(v3), [
      "apimart/doubao-seedance-2.0-fast",
      "apimart/happyhorse-1.0",
      "apimart/veo3-fast",
      "apimart/grok-imagine-1.0",
      "apimart/omni-flash-ext",
      "apimart/wan2.7",
      "apimart/kling-v3-omni",
      "apimart/kling-v3",
      "apimart/kling-video-o1",
      "apimart/minimax-hailuo-2.3",
      "apimart/minimax-hailuo",
      "apimart/viduq3",
    ]),
    strict["doesNotMatch"](v3, /data-value="apimart\/viduq3-turbo"/),
    strict["doesNotMatch"](v3, /data-value="apimart\/viduq3-pro"/),
    strict["doesNotMatch"](v3, /data-value="apimart\/viduq3-mix"/),
    strict["doesNotMatch"](v3, /happyhorse-placeholder/),
    strict["match"](source, /\.\.\.buildDreaminaOfficialVideoMenuItems\(\)/),
    strict["match"](source, /\.\.\.buildVolcengineOfficialVideoMenuItems\(/),
    strict["match"](source, /itemsHtml: buildApimartVideoMenuItemsHtml\(/),
    strict["doesNotMatch"](source, /const apimartVideoItemsHtml/),
    strict["match"](
      source,
      /dreaminaProvider === "dreamina"[\s\S]*\? "即梦官方"/,
    ),
    strict["match"](
      source,
      /dreaminaProvider === "volcengine"[\s\S]*\? "火山方舟"/,
    ),
    strict["match"](source, /: "即梦视频"/),
    strict["match"](source, /const latestNode = getLatestNodeData\(\)/),
    strict["match"](source, /commitDreaminaModelSelection\(\{/),
    strict["match"](source, /useModelApiSchemaParams/),
    strict["match"](
      source,
      /const modelExecution = this\._resolveModelExecution\(\s*_activeModel,\s*this\._data\.provider,\s*\)/,
    ),
    strict["match"](
      source,
      /hasModelUiSchema\(modelApiSchemaModelId, \{ placement: "advanced" \}\)/,
    ),
    strict["match"](
      source,
      /const modelApiSchemaModelId = useModelApiSchemaParams/,
    ),
    strict["match"](source, /modelExecution\?\.canonicalModelId/),
    strict["doesNotMatch"](source, /rh-adv-wrap/),
    strict["doesNotMatch"](source, /rh-adv-btn/),
    strict["doesNotMatch"](source, /rh-adv-panel/),
    strict["match"](
      source,
      /renderModelUiSchemaControls\(modelApiSchemaModelId, this\._data,[\s\S]*placement:\s*"mode"/,
    ),
    strict["match"](
      source,
      /renderModelUiSchemaControls\(modelApiSchemaModelId, this\._data,[\s\S]*placement:\s*"resolution"/,
    ),
    strict["equal"](
      getModelManifest("dreamina/text2video")?.["extensions"]?.["videoMenu"]?.[
        "role"
      ],
      "dreaminaOfficial",
    ),
    strict["equal"](
      getModelManifest("apimart/doubao-seedance-2.0-fast")?.["extensions"]?.[
        "videoMenu"
      ]?.["role"],
      "apimartDreaminaEntry",
    ),
    strict["doesNotMatch"](
      parameterPanelModelHelpersSource,
      /getDreaminaStyleVideoAllowedModels/,
    ),
    strict["doesNotMatch"](source, /getDreaminaStyleVideoAllowedModels/));
}),
  test("video\x20parameter\x20panel:\x20RunningHub\x20workflow\x20and\x20model\x20API\x20menus\x20stay\x20separate", () => {
    const v4 = buildRunningHubVideoWorkflowMenuItems(
        "runninghub-model/kling-video-o1",
      ),
      v5 = buildRunningHubVideoModelApiMenuItems(
        "runninghub-model/kling-video-o1",
      );
    (strict["doesNotMatch"](v4, /runninghub-model\/kling-video-o1/),
      strict["match"](v4, /data-provider="runninghubwf"/),
      strict["match"](
        v5,
        /class="floating-menu-item node-menu-item active" data-value="runninghub-model\/kling-video-o1" data-provider="runninghub"/,
      ),
      strict["match"](v5, /data-value="runninghub-model\/kling-v3"/),
      strict["match"](v5, /<div class="fmi-title">Kling V3\.0<\/div>/),
      strict["match"](v5, /data-value="runninghub-model\/kling-o3"/),
      strict["match"](v5, /<div class="fmi-title">Kling O3<\/div>/),
      strict["match"](v5, /data-value="runninghub-model\/seedance-2\.0"/),
      strict["match"](v5, /<div class="fmi-title">Seedance 2\.0<\/div>/),
      strict["match"](v5, /data-value="runninghub-model\/happyhorse-1\.0"/),
      strict["match"](v5, /<div class="fmi-title">HappyHorse 1\.0<\/div>/),
      strict["match"](v5, /data-value="runninghub-model\/hailuo-02"/),
      strict["match"](v5, /<div class="fmi-title">Hailuo 02<\/div>/),
      strict["match"](v5, /data-value="runninghub-model\/hailuo-2\.3"/),
      strict["match"](v5, /<div class="fmi-title">Hailuo 2\.3<\/div>/),
      strict["match"](v5, /data-value="runninghub-model\/veo3"/),
      strict["match"](v5, /<div class="fmi-title">Veo3<\/div>/),
      strict["match"](v5, /data-value="runninghub-model\/wan2\.7"/),
      strict["match"](v5, /<div class="fmi-title">Wan 2\.7<\/div>/),
      strict["deepEqual"](extractMenuModelOrder(v5), [
        "runninghub-model/seedance-2.0",
        "runninghub-model/happyhorse-1.0",
        "runninghub-model/veo3",
        "runninghub-model/wan2.7",
        "runninghub-model/kling-o3",
        "runninghub-model/kling-v3",
        "runninghub-model/kling-video-o1",
        "runninghub-model/hailuo-2.3",
        "runninghub-model/hailuo-02",
      ]));
    const v6 = renderModelUiSchemaControls(
      "runninghub-model/veo3",
      { rh_veo3_channel: "lowCost", mode: "fast" },
      { placement: "mode" },
    );
    (strict["match"](v6, /data-ui-schema-field="rh_veo3_channel"/),
      strict["match"](v6, /data-ui-schema-field="mode"/),
      strict["match"](v6, /data-ui-schema-field="generation_type"/),
      strict["match"](v6, /data-ui-schema-composite-field="sectionPair"/),
      strict["match"](v6, /data-ui-schema-primary-field="rh_veo3_channel"/),
      strict["match"](v6, /data-ui-schema-secondary-field="mode"/),
      strict["match"](
        v6,
        /ui-schema-section-pair-label">低价版 · Fast 版 · 首尾帧/,
      ),
      strict["equal"](
        (v6["match"](/data-ui-schema-menu-trigger="/g) || [])["length"],
        1,
      ),
      strict["match"](v6, /data-ui-schema-value="lowCost"/),
      strict["match"](v6, /data-ui-schema-value="official"/),
      strict["match"](
        v6,
        /data-ui-schema-value="reference"[\s\S]*data-ui-schema-disabled="true"/,
      ));
    const v7 = renderModelUiSchemaControls(
      "runninghub-model/veo3",
      { rh_veo3_channel: "official", mode: "fast" },
      { placement: "mode" },
    );
    strict["doesNotMatch"](
      v7,
      /data-ui-schema-value="reference"[\s\S]*data-ui-schema-disabled="true"/,
    );
    const v8 = renderModelUiSchemaControls(
      "runninghub-model/veo3",
      {},
      { placement: "resolution" },
    );
    (strict["match"](v8, /data-ui-schema-field="resolution"/),
      strict["match"](v8, /data-ui-schema-field="aspectRatio"/),
      strict["match"](v8, /data-ui-schema-value="自适应"/),
      strict["match"](v8, /data-ui-schema-field="duration"/));
    const v9 = renderModelUiSchemaControls(
      "runninghub-model/wan2.7",
      { generationParams: { wan27_mode: "reference" } },
      { placement: "mode" },
    );
    (strict["match"](v9, /data-ui-schema-field="wan27_mode"/),
      strict["match"](v9, /data-ui-schema-value="image"/),
      strict["match"](v9, /data-ui-schema-value="video"/),
      strict["match"](v9, /data-ui-schema-value="reference"/),
      strict["match"](v9, /data-ui-schema-value="edit"/),
      strict["match"](v9, /参考生视频/));
    const v10 = renderModelUiSchemaControls(
      "runninghub-model/wan2.7",
      {},
      { placement: "resolution" },
    );
    (strict["match"](v10, /data-ui-schema-field="resolution"/),
      strict["match"](v10, /data-ui-schema-field="aspectRatio"/),
      strict["match"](v10, /data-ui-schema-value="自适应"/),
      strict["match"](v10, /data-ui-schema-field="duration"/));
    const v11 = renderModelUiSchemaControls(
      "runninghub-model/kling-v3",
      {},
      { placement: "resolution" },
    );
    (strict["match"](v11, /data-ui-schema-field="resolution"/),
      strict["match"](v11, /data-ui-schema-value="std"/),
      strict["match"](v11, /data-ui-schema-value="pro"/),
      strict["match"](v11, /data-ui-schema-value="4k"/),
      strict["match"](v11, /data-ui-schema-field="aspectRatio"/),
      strict["match"](v11, /data-ui-schema-value="自适应"/),
      strict["match"](v11, /data-ui-schema-field="duration"/));
    const v12 = renderModelUiSchemaControls(
      "runninghub-model/kling-v3",
      {},
      { placement: "advanced" },
    );
    (strict["match"](v12, /data-ui-schema-field="audio"/),
      strict["match"](v12, /data-ui-schema-field="cfgScale"/),
      strict["match"](v12, /data-ui-schema-field="shotType"/),
      strict["match"](v12, /data-ui-schema-field="negative_prompt"/));
    const v13 = renderModelUiSchemaControls(
      "runninghub-model/kling-o3",
      { generationParams: { kling_v3_omni_mode: "reference" } },
      { placement: "mode" },
    );
    (strict["match"](v13, /data-ui-schema-field="kling_v3_omni_mode"/),
      strict["doesNotMatch"](v13, /data-ui-schema-field="resolution"/),
      strict["doesNotMatch"](
        v13,
        /data-ui-schema-composite-field="sectionPair"/,
      ),
      strict["match"](v13, /data-ui-schema-value="image"/),
      strict["match"](v13, /data-ui-schema-value="reference"/),
      strict["match"](v13, /data-ui-schema-value="edit"/));
    const v14 = renderModelUiSchemaControls(
      "runninghub-model/kling-o3",
      {},
      { placement: "resolution" },
    );
    (strict["match"](v14, /data-ui-schema-composite-field="qualityRatio"/),
      strict["match"](v14, /data-ui-schema-field="resolution"/),
      strict["match"](v14, /data-ui-schema-field="aspectRatio"/),
      strict["match"](v14, /data-ui-schema-value="std"/),
      strict["match"](v14, /data-ui-schema-value="pro"/),
      strict["match"](v14, /data-ui-schema-value="4k"/),
      strict["match"](v14, /720P/),
      strict["match"](v14, /1080P/),
      strict["match"](v14, /4K/),
      strict["match"](v14, /data-ui-schema-value="自适应"/),
      strict["match"](v14, /data-ui-schema-field="duration"/));
    const v15 = renderModelUiSchemaControls(
      "runninghub-model/kling-o3",
      {},
      { placement: "advanced" },
    );
    (strict["match"](v15, /data-ui-schema-field="audio"/),
      strict["match"](v15, /data-ui-schema-field="shotType"/),
      strict["doesNotMatch"](
        v15,
        /data-ui-schema-field="keep_original_sound"/,
      ));
    const v16 = renderModelUiSchemaControls(
      "runninghub-model/kling-o3",
      { generationParams: { kling_v3_omni_mode: "reference" } },
      { placement: "advanced" },
    );
    strict["match"](v16, /data-ui-schema-field="keep_original_sound"/);
    const v17 = renderModelUiSchemaControls(
      "runninghub-model/seedance-2.0",
      {
        generationParams: {
          rh_seedance_2_model: "fast",
          rh_seedance_2_mode: "multimodal2video",
        },
      },
      { placement: "mode" },
    );
    (strict["match"](v17, /data-ui-schema-field="rh_seedance_2_model"/),
      strict["match"](v17, /data-ui-schema-field="rh_seedance_2_mode"/),
      strict["match"](v17, /data-ui-schema-composite-field="sectionPair"/),
      strict["match"](
        v17,
        /data-ui-schema-primary-field="rh_seedance_2_model"/,
      ),
      strict["match"](
        v17,
        /data-ui-schema-secondary-field="rh_seedance_2_mode"/,
      ),
      strict["match"](v17, /data-ui-schema-value="fast"/),
      strict["match"](v17, /data-ui-schema-value="standard"/),
      strict["match"](v17, /data-ui-schema-value="text2video"/),
      strict["match"](v17, /data-ui-schema-value="image2video"/),
      strict["match"](v17, /data-ui-schema-value="frames2video"/),
      strict["match"](v17, /data-ui-schema-value="multimodal2video"/),
      strict["equal"](
        (v17["match"](/data-ui-schema-menu-trigger="/g) || [])["length"],
        1,
      ));
    const v18 = renderModelUiSchemaControls(
      "runninghub-model/seedance-2.0",
      {},
      { placement: "resolution" },
    );
    (strict["match"](v18, /data-ui-schema-composite-field="qualityRatio"/),
      strict["match"](v18, /data-ui-schema-field="resolution"/),
      strict["match"](v18, /data-ui-schema-field="aspectRatio"/),
      strict["match"](
        v18,
        /ui-schema-quality-ratio-label">720p \u00b7 \u81ea\u9002\u5e94<\/span>/,
      ),
      strict["match"](v18, /\u539f\u751f\u8f93\u51fa\u5206\u8fa8\u7387/),
      strict["match"](v18, /\u8d85\u5206\u8fa8\u7387/),
      strict["match"](v18, /data-ui-schema-value="480p"/),
      strict["match"](v18, /data-ui-schema-value="720p"/),
      strict["match"](v18, /data-ui-schema-value="native1080p"/),
      strict["doesNotMatch"](v18, /data-ui-schema-value="none"/),
      strict["doesNotMatch"](v18, /\u4e0d\u8d85\u5206/),
      strict["match"](v18, /data-ui-schema-value="1080p"/),
      strict["match"](v18, /data-ui-schema-value="2k"/),
      strict["match"](v18, /data-ui-schema-value="4k"/),
      strict["match"](v18, /data-ui-schema-value="\u81ea\u9002\u5e94"/),
      strict["match"](v18, /data-ui-schema-value="21:9"/),
      strict["equal"](
        (v18["match"](/data-ui-schema-field="resolution"/g) || [])["length"],
        1,
      ),
      strict["equal"](
        (v18["match"](/data-ui-schema-menu-trigger="qualityRatio"/g) || [])[
          "length"
        ],
        1,
      ),
      strict["match"](v18, /data-ui-schema-field="duration"/));
    const v19 = renderModelUiSchemaControls(
      "runninghub-model/seedance-2.0",
      { generationParams: { rh_seedance_2_mode: "text2video" } },
      { placement: "advanced" },
    );
    (strict["match"](v19, /data-ui-schema-field="generateAudio"/),
      strict["match"](v19, /data-ui-schema-field="webSearch"/),
      strict["match"](v19, /data-ui-schema-field="realPersonMode"/),
      strict["doesNotMatch"](v19, /data-ui-schema-field="returnLastFrame"/),
      strict["match"](v19, /data-ui-schema-field="seed"/));
    const v20 = renderModelUiSchemaControls(
      "runninghub-model/seedance-2.0",
      { generationParams: { rh_seedance_2_mode: "multimodal2video" } },
      { placement: "advanced" },
    );
    (strict["match"](v20, /data-ui-schema-field="generateAudio"/),
      strict["match"](v20, /data-ui-schema-field="realPersonMode"/),
      strict["doesNotMatch"](v20, /data-ui-schema-field="webSearch"/));
    const v21 = renderModelUiSchemaControls(
      "runninghub-model/happyhorse-1.0",
      { generationParams: { happyhorse_mode: "reference" } },
      { placement: "mode" },
    );
    (strict["match"](v21, /data-ui-schema-field="happyhorse_mode"/),
      strict["match"](v21, /data-ui-schema-value="image"/),
      strict["match"](v21, /data-ui-schema-value="reference"/),
      strict["match"](v21, /data-ui-schema-value="edit"/));
    const v22 = renderModelUiSchemaControls(
      "runninghub-model/happyhorse-1.0",
      {},
      { placement: "resolution" },
    );
    (strict["match"](v22, /data-ui-schema-composite-field="qualityRatio"/),
      strict["match"](v22, /data-ui-schema-field="resolution"/),
      strict["match"](v22, /data-ui-schema-field="aspectRatio"/),
      strict["match"](v22, /data-ui-schema-value="720P"/),
      strict["match"](v22, /data-ui-schema-value="1080P"/),
      strict["match"](v22, /data-ui-schema-value="自适应"/),
      strict["match"](v22, /data-ui-schema-field="duration"/));
    const v23 = renderModelUiSchemaControls(
      "runninghub-model/happyhorse-1.0",
      {},
      { placement: "advanced" },
    );
    (strict["match"](v23, /data-ui-schema-field="audio_setting"/),
      strict["match"](v23, /data-ui-schema-field="seed"/),
      strict["doesNotMatch"](v23, /data-ui-schema-field="watermark"/));
    const v24 = renderModelUiSchemaControls(
      "runninghub-model/hailuo-02",
      {},
      { placement: "resolution" },
    );
    (strict["match"](v24, /data-ui-schema-field="rh_hailuo_02_quality"/),
      strict["doesNotMatch"](v24, /data-ui-schema-field="aspectRatio"/),
      strict["doesNotMatch"](v24, /data-ui-schema-value="自适应"/));
    const v25 = renderModelUiSchemaControls(
      "runninghub-model/hailuo-2.3",
      {},
      { placement: "resolution" },
    );
    (strict["match"](v25, /data-ui-schema-field="rh_hailuo_23_quality"/),
      strict["match"](v25, /data-ui-schema-value="fastPro"/),
      strict["match"](v25, /data-ui-schema-field="duration"/),
      strict["doesNotMatch"](v25, /data-ui-schema-field="aspectRatio"/),
      strict["doesNotMatch"](v25, /data-ui-schema-value="自适应"/),
      strict["doesNotMatch"](v5, /data-provider="runninghubwf"/),
      strict["match"](source, /label: "RunningHUB\\u5de5\\u4f5c\\u6d41"/),
      strict["match"](source, /label: "RunningHUB\\u6a21\\u578b"/),
      strict["match"](source, /id: "runninghub-model"/),
      strict["match"](
        source,
        /itemsHtml: buildRunningHubVideoModelApiMenuItems\(/,
      ));
  }),
  test("video parameter panel: Volcengine uses Dreamina official style entry", () => {
    const v26 = buildVolcengineOfficialVideoMenuItems(
      "volcengine/seedance-2.0-fast",
      "volcengine",
    );
    (strict["match"](source, /buildVolcengineOfficialVideoMenuItems\(/),
      strict["doesNotMatch"](source, /id: "volcengine-video"/),
      strict["equal"](v26["length"], 1),
      strict["equal"](v26[0]["modelId"], "volcengine/seedance-2.0-fast"),
      strict["equal"](v26[0]["provider"], "volcengine"),
      strict["equal"](v26[0]["label"], "火山方舟"),
      strict["equal"](v26[0]["active"], true),
      strict["match"](v26[0]["iconHtml"], /images\/volcengine\.svg/));
    const v27 = buildDreaminaTaskModelMenuHtml(
      "volcengine/seedance-2.0-fast",
      "text2video",
      "volcengine",
    );
    (strict["deepEqual"](extractMenuModelOrder(v27), [
      "volcengine/seedance-2.0-fast",
      "volcengine/seedance-2.0",
    ]),
      strict["match"](v27, /data-provider="volcengine"/),
      strict["match"](v27, /<div class="fmi-title">Seedance 2\.0 Fast<\/div>/),
      strict["match"](v27, /<div class="fmi-title">Seedance 2\.0<\/div>/));
    const v28 = buildDreaminaParamSchemaFields({
        routeMode: "frames2video",
        currentRatio: "自适应",
        currentResolution: "720p",
        currentDuration: 5,
        resolutionOptions: ["480p", "720p"],
      }),
      v29 = renderUiSchemaFields(
        [v28["mode"]],
        { generationParams: { dreaminaRouteMode: "frames2video" } },
        { sourceId: "volcengine-dreamina-style" },
      );
    (strict["match"](v29, /data-ui-schema-field="dreaminaRouteMode"/),
      strict["match"](v29, /data-ui-schema-value="multimodal2video"/),
      strict["match"](v29, /data-ui-schema-value="frames2video"/),
      strict["doesNotMatch"](v29, /data-ui-schema-value="text2video"/),
      strict["doesNotMatch"](v29, /data-ui-schema-value="image2video"/));
    const v30 = createVideoNodeParameterPanelModule({
      store: {},
      api: {},
      getDisplayModelName: (v31) => v31,
      PROVIDERS_META: {},
      getAIGenerationNodeSize: () => ({}),
      getDisplayedMediaSizeFromNode: () => ({}),
      activateMenuKeyboard: () => {},
      isVideoVipModel: () => false,
    });
    strict["equal"](
      v30["_getModelIconHTML"]("volcengine/seedance-2.0-fast", "volcengine"),
      buildVolcengineVideoLogoHTML(12),
    );
  }),
  test("video parameter panel: 即梦官方当前模型 logo 使用无背景大即梦图标", () => {
    const v32 = createVideoNodeParameterPanelModule({
      store: {},
      api: {},
      getDisplayModelName: (v33) => v33,
      PROVIDERS_META: {},
      getAIGenerationNodeSize: () => ({}),
      getDisplayedMediaSizeFromNode: () => ({}),
      activateMenuKeyboard: () => {},
      isVideoVipModel: () => false,
    });
    strict["equal"](
      v32["_getModelIconHTML"]("dreamina/text2video", "dreamina"),
      buildDreaminaVideoLogoHTML(12),
    );
  }),
  test("video\x20node\x20state\x20sync\x20keeps\x20modelApi\x20advanced\x20settings\x20visible", () => {
    (strict["match"](videoNodeSource, /hasModelUiSchema/),
      strict["match"](
        videoNodeSource,
        /const showModelApiAdvanced[\s\S]*hasModelUiSchema\(modelApiSchemaModelId, \{ placement: "advanced" \}\)/,
      ),
      strict["match"](
        videoNodeSource,
        /advBtn\.style\.display = showSchemaAdvanced \? "" : "none"/,
      ),
      strict["match"](videoNodeSource, /panel && !showSchemaAdvanced/),
      strict["doesNotMatch"](
        videoNodeSource,
        /advBtn\.style\.display = showRhAdv \? "" : "none"/,
      ));
  }),
  test("APIMart video modelApi schema controls follow each model API", () => {
    const v34 = renderModelUiSchemaControls(
      "apimart/veo3-fast",
      { generationParams: { mode: "quality", generation_type: "reference" } },
      { placement: "mode" },
    );
    (strict["match"](v34, /data-ui-schema-field="mode"/),
      strict["match"](v34, /data-ui-schema-composite-field="sectionPair"/),
      strict["match"](v34, /data-ui-schema-primary-field="mode"/),
      strict["match"](v34, /data-ui-schema-secondary-field="generation_type"/),
      strict["match"](v34, /ui-schema-section-pair-popup/),
      strict["match"](v34, /ui-schema-section-pair-label">quality · 首尾帧/),
      strict["doesNotMatch"](v34, /data-ui-schema-value="lite"/),
      strict["doesNotMatch"](v34, /veo3\.1-lite/),
      strict["match"](v34, /data-ui-schema-value="fast"/),
      strict["match"](v34, /data-ui-schema-value="quality"/),
      strict["match"](
        v34,
        /data-tooltip="veo3\.1-fast - 快速生成模型，适用于快速预览和迭代\nveo3\.1-quality - 高质量生成模型，适用于最终制作"/,
      ),
      strict["doesNotMatch"](
        v34,
        /data-ui-schema-menu-trigger="sectionPair"[^>]*title=/,
      ),
      strict["match"](v34, /ui-schema-info-tip/),
      strict["match"](v34, /data-ui-schema-field="generation_type"/),
      strict["match"](v34, /data-ui-schema-value="frame"/),
      strict["match"](
        v34,
        /data-ui-schema-value="reference"[^>]*data-ui-schema-disabled="true"/,
      ),
      strict["doesNotMatch"](v34, /data-ui-schema-field="duration"/),
      strict["equal"](
        (v34["match"](/data-ui-schema-menu-trigger="/g) || [])["length"],
        1,
      ));
    const v35 = renderModelUiSchemaControls(
      "apimart/veo3-fast",
      {},
      { placement: "resolution" },
    );
    (strict["match"](v35, /视频分辨率/),
      strict["match"](v35, /比例/),
      strict["doesNotMatch"](
        v35,
        /data-ui-schema-menu-trigger="qualityRatio"[^>]*title=/,
      ),
      strict["match"](v35, /data-ui-schema-value="4k"/),
      strict["match"](v35, /img-rp-large-adaptive/),
      strict["match"](v35, /data-ui-schema-value="自适应"/),
      strict["doesNotMatch"](v35, /data-ui-schema-value="1:1"/),
      strict["match"](v35, /data-ui-schema-field="duration"/),
      strict["match"](v35, /data-ui-schema-menu-trigger="duration" disabled/));
    const v36 = renderModelUiSchemaControls(
      "apimart/veo3-fast",
      {},
      { placement: "advanced" },
    );
    (strict["match"](v36, /启用 GIF 输出格式/),
      strict["doesNotMatch"](v36, /official_fallback/));
    const v37 = renderModelUiSchemaControls(
      "apimart/minimax-hailuo",
      { generationParams: { duration: 10 } },
      { placement: "mode" },
    );
    (strict["doesNotMatch"](v37, /data-ui-schema-field="mode"/),
      strict["doesNotMatch"](v37, /Hailuo-2\.3/));
    const v38 = getModelManifest("apimart/minimax-hailuo");
    (strict["match"](v38?.["help"]?.["tooltip"] || "", /Hailuo-02 适用场景/),
      strict["match"](
        v38?.["help"]?.["tooltip"] || "",
        /\[\[red:放 2 张首尾帧\]\]/,
      ),
      strict["match"](v38?.["help"]?.["tooltip"] || "", /1080p 只做 5 秒/),
      strict["doesNotMatch"](v37, /data-ui-schema-field="duration"/));
    const v39 = renderModelUiSchemaControls(
      "apimart/minimax-hailuo",
      {},
      { placement: "resolution" },
    );
    (strict["match"](v39, /视频分辨率/),
      strict["match"](v39, /data-ui-schema-value="512p"/),
      strict["match"](v39, /data-ui-schema-value="768p"/),
      strict["match"](v39, /data-ui-schema-value="1080p"/),
      strict["match"](v39, /data-ui-schema-field="aspectRatio"/),
      strict["match"](v39, /data-ui-schema-value="自适应"/),
      strict["match"](v39, /data-ui-schema-field="duration"/),
      strict["match"](v39, /data-ui-schema-range-values="5,10"/),
      strict["match"](v39, /min="0" max="1" step="1" value="0"/),
      strict["match"](v39, /视频时长（秒）/));
    const v40 = renderModelUiSchemaControls(
      "apimart/minimax-hailuo",
      {},
      { placement: "advanced" },
    );
    (strict["match"](v40, /自动优化提示词/),
      strict["match"](v40, /快速预处理/),
      strict["match"](v40, /Watermark|添加水印/),
      strict["match"](v40, /data-ui-schema-field="fast_pretreatment"/));
    const v41 = renderModelUiSchemaControls(
      "apimart/minimax-hailuo-2.3",
      { generationParams: { mode: "fast" } },
      { placement: "mode" },
    );
    (strict["match"](v41, /data-ui-schema-field="mode"/),
      strict["match"](v41, /data-ui-schema-value="standard"/),
      strict["match"](v41, /data-ui-schema-value="fast"/),
      strict["match"](v41, /Fast 版/),
      strict["match"](
        getModelManifest("apimart/minimax-hailuo-2.3")?.["help"]?.["tooltip"] ||
          "",
        /Fast 版必须放 1 张首帧/,
      ));
    const v42 = renderModelUiSchemaControls(
      "apimart/minimax-hailuo-2.3",
      {},
      { placement: "resolution" },
    );
    (strict["match"](v42, /视频分辨率/),
      strict["doesNotMatch"](v42, /data-ui-schema-value="512p"/),
      strict["match"](v42, /data-ui-schema-value="768p"/),
      strict["match"](v42, /data-ui-schema-value="1080p"/),
      strict["match"](v42, /data-ui-schema-field="aspectRatio"/),
      strict["match"](v42, /data-ui-schema-value="自适应"/),
      strict["match"](v42, /data-ui-schema-field="duration"/),
      strict["match"](v42, /data-ui-schema-range-values="6,10"/));
    const v43 = renderModelUiSchemaControls(
        "apimart/happyhorse-1.0",
        {},
        { placement: "advanced" },
      ),
      v44 = renderModelUiSchemaControls(
        "apimart/happyhorse-1.0",
        { generationParams: { happyhorse_mode: "auto", duration: 5 } },
        { placement: "mode" },
      );
    (strict["match"](v44, /data-ui-schema-field="happyhorse_mode"/),
      strict["match"](v44, /ui-schema-pill-label">模式选择<\/span>/),
      strict["doesNotMatch"](v44, /data-ui-schema-value="auto"/),
      strict["match"](v44, /data-ui-schema-value="image"/),
      strict["match"](v44, /data-ui-schema-value="reference"/),
      strict["match"](v44, /data-ui-schema-value="edit"/),
      strict["doesNotMatch"](v44, /data-ui-schema-field="duration"/));
    const v45 = renderModelUiSchemaControls(
      "apimart/happyhorse-1.0",
      {},
      { placement: "resolution" },
    );
    (strict["match"](v45, /视频分辨率/),
      strict["match"](v45, /data-ui-schema-composite-field="qualityRatio"/),
      strict["match"](v45, /data-ui-schema-field="duration"/),
      strict["match"](v45, /ui-schema-duration-pop/),
      strict["equal"](
        buildModelUiSchemaDefaultParams("apimart/happyhorse-1.0")[
          "happyhorse_mode"
        ],
        "image",
      ),
      strict["equal"](
        buildModelUiSchemaDefaultParams("runninghub-model/happyhorse-1.0")[
          "happyhorse_mode"
        ],
        "image",
      ),
      strict["match"](v43, /data-ui-schema-field="audio_setting"/),
      strict["match"](v43, /音频设置/),
      strict["match"](v43, /data-ui-schema-field="watermark"/),
      strict["doesNotMatch"](v43, /data-ui-schema-field="prompt_extend"/),
      strict["match"](source, /getHappyHorseModeEdgeIdsToRemove/),
      strict["match"](source, /fieldId[\s\S]*happyhorse_mode/),
      strict["match"](source, /store\.removeEdge\?\.\(edgeId\)/),
      strict["match"](
        uiSchemaRendererSource,
        /afterCommit\?\.\(fieldId, value/,
      ),
      strict["match"](source, /manifestHelpVariantsReferenceField/),
      strict["match"](source, /manifestFixedSlotVisibilityReferencesField/),
      strict["match"](source, /shouldRefreshRefs[\s\S]*_renderRefBar\?\.\(\)/),
      strict["match"](
        source,
        /shouldSyncHelp[\s\S]*_syncGenerationNodeHelpTip\?\.\(\)/,
      ),
      strict["doesNotMatch"](
        source,
        /fieldKey === "wan27_mode"[\s\S]*_renderFooter\?\.\(footer\)/,
      ),
      strict["match"](uiSchemaRendererSource, /data-ui-schema-option-label/));
    const v46 = renderModelUiSchemaControls(
      "apimart/wan2.7",
      { generationParams: { wan27_mode: "image" } },
      { placement: "mode" },
    );
    (strict["match"](v46, /data-ui-schema-field="wan27_mode"/),
      strict["match"](v46, /data-ui-schema-value="image"/),
      strict["match"](v46, /data-ui-schema-value="video"/),
      strict["match"](v46, /data-ui-schema-value="reference"/),
      strict["match"](v46, /data-ui-schema-value="edit"/),
      strict["doesNotMatch"](
        v46,
        /data-ui-schema-field="wan27_reference_input"/,
      ),
      strict["doesNotMatch"](v46, /data-ui-schema-field="wan27_edit_input"/),
      strict["match"](v46, /图生视频/),
      strict["match"](v46, /视频续写/),
      strict["match"](v46, /参考生视频/),
      strict["match"](v46, /视频编辑/));
    const v47 = renderModelUiSchemaControls(
      "apimart/wan2.7",
      { generationParams: { wan27_mode: "reference" } },
      { placement: "mode" },
    );
    (strict["match"](v47, /data-ui-schema-field="wan27_mode"/),
      strict["doesNotMatch"](
        v47,
        /data-ui-schema-field="wan27_reference_input"/,
      ),
      strict["doesNotMatch"](v47, /data-ui-schema-field="wan27_edit_input"/));
    const v48 = renderModelUiSchemaControls(
      "apimart/wan2.7",
      { generationParams: { wan27_mode: "edit" } },
      { placement: "mode" },
    );
    (strict["match"](v48, /data-ui-schema-field="wan27_mode"/),
      strict["doesNotMatch"](v48, /data-ui-schema-field="wan27_edit_input"/),
      strict["doesNotMatch"](
        v48,
        /data-ui-schema-field="wan27_reference_input"/,
      ));
    const v49 = renderModelUiSchemaControls(
      "apimart/wan2.7",
      {},
      { placement: "advanced" },
    );
    (strict["match"](v49, /data-ui-schema-field="negative_prompt"/),
      strict["match"](v49, /反向提示词/),
      strict["match"](v49, /模糊、变形、低质量/),
      strict["match"](v49, /prompt 智能改写/));
    const v50 = buildUiSchemaParamPatch(
      {
        model: "wan2.7",
        provider: "apimart",
        generationParams: { duration: 6 },
      },
      "wan27_mode",
      "reference",
    );
    (strict["equal"](v50["generationParams"]["wan27_mode"], "reference"),
      strict["equal"](v50["generationParams"]["duration"], 6),
      strict["match"](source, /getWan27ModeEdgeIdsToRemove/),
      strict["match"](source, /fieldKey === "wan27_mode"/),
      strict["doesNotMatch"](source, /fieldKey === "wan27_reference_input"/),
      strict["doesNotMatch"](source, /fieldKey === "wan27_edit_input"/),
      strict["match"](uiSchemaRendererSource, /filterVisibleUiSchemaFields/),
      strict["match"](videoNodeSource, /fixedInputVisibilitySig/),
      strict["match"](videoNodeSource, /visibilityLayoutKey/),
      strict["match"](
        videoNodeSource,
        /refModeSig[\s\S]*fixedInputVisibilitySig/,
      ));
    const v51 = renderModelUiSchemaControls(
      "apimart/kling-v3",
      {},
      { placement: "mode" },
    );
    (strict["doesNotMatch"](v51, /data-ui-schema-field="duration"/),
      strict["doesNotMatch"](v51, /data-ui-schema-value="4k"/));
    const v52 = renderModelUiSchemaControls(
      "apimart/kling-v3",
      { generationParams: { resolution: "std", aspectRatio: "自适应" } },
      { placement: "resolution" },
    );
    (strict["match"](v52, /data-ui-schema-composite-field="qualityRatio"/),
      strict["match"](v52, /data-ui-schema-field="resolution"/),
      strict["match"](v52, /data-ui-schema-field="aspectRatio"/),
      strict["match"](v52, /720P/),
      strict["match"](v52, /1080P/),
      strict["match"](v52, /data-ui-schema-value="4k"/),
      strict["match"](v52, /data-ui-schema-field="duration"/),
      strict["doesNotMatch"](v52, /Kling V3 模式说明/));
    const v53 = renderModelUiSchemaControls(
      "apimart/kling-v3",
      {},
      { placement: "advanced" },
    );
    (strict["match"](v53, /生成有声视频/),
      strict["match"](v53, /多镜头分镜模式/),
      strict["match"](v53, /data-ui-schema-field="negative_prompt"/),
      strict["match"](v53, /模糊, 低画质, 变形/),
      strict["match"](v53, /data-ui-schema-default-aliases=/),
      strict["match"](
        v53,
        /data-ui-schema-field="multi_shot"[\s\S]*data-ui-schema-disabled="true"/,
      ));
    const v54 = buildUiSchemaParamPatch(
      { model: "apimart/kling-v3", provider: "apimart", generationParams: {} },
      "negative_prompt",
      "none",
    );
    strict["equal"](
      v54["generationParams"]["negative_prompt"],
      "模糊, 低画质, 变形",
    );
    const v55 = buildVideoModelApiModelSelectionPatch(
      {
        provider: "apimart",
        generationParamsByModel: {
          "apimart/kling-v3": { negative_prompt: "none" },
        },
      },
      "apimart/kling-v3",
      "apimart",
    );
    strict["equal"](
      v55["generationParams"]["negative_prompt"],
      "模糊, 低画质, 变形",
    );
    const v56 = { value: "" },
      v57 = {
        dataset: {
          uiSchemaField: "negative_prompt",
          uiSchemaDefault: "模糊, 低画质, 变形",
          uiSchemaDefaultAliases: JSON["stringify"](["none"]),
        },
        classList: {
          contains() {
            return false;
          },
        },
        querySelectorAll() {
          return [];
        },
        querySelector(v58) {
          if (v58 === "[data-ui-schema-input]") return v56;
          return null;
        },
      };
    (syncModelUiSchemaControls(
      {
        querySelectorAll(v59) {
          if (v59 === "[data-ui-schema-field]") return [v57];
          return [];
        },
      },
      { generationParams: { negative_prompt: "none" } },
    ),
      strict["equal"](v56["value"], "模糊, 低画质, 变形"));
    const v60 = renderModelUiSchemaControls(
      "apimart/kling-v3-omni",
      { generationParams: { kling_v3_omni_mode: "image" } },
      { placement: "mode" },
    );
    (strict["match"](v60, /data-ui-schema-field="kling_v3_omni_mode"/),
      strict["match"](v60, /data-ui-schema-value="image"/),
      strict["match"](v60, /data-ui-schema-value="reference"/),
      strict["match"](v60, /data-ui-schema-value="edit"/),
      strict["match"](v60, /图生视频/),
      strict["match"](v60, /参考生视频/),
      strict["match"](v60, /视频编辑/));
    const v61 = renderModelUiSchemaControls(
      "apimart/kling-v3-omni",
      { generationParams: { resolution: "pro", aspectRatio: "16:9" } },
      { placement: "resolution" },
    );
    (strict["match"](v61, /data-ui-schema-composite-field="qualityRatio"/),
      strict["match"](v61, /720P/),
      strict["match"](v61, /1080P/),
      strict["match"](v61, /data-ui-schema-value="4k"/),
      strict["match"](v61, /data-ui-schema-field="duration"/));
    const v62 = renderModelUiSchemaControls(
      "apimart/kling-v3-omni",
      {},
      { placement: "advanced" },
    );
    (strict["match"](v62, /生成有声视频/),
      strict["match"](v62, /多镜头分镜模式/),
      strict["match"](v62, /data-ui-schema-field="negative_prompt"/),
      strict["match"](v62, /模糊, 低画质, 变形/),
      strict["match"](source, /fieldKey === "kling_v3_omni_mode"/));
    const v63 = renderModelUiSchemaControls(
      "apimart/kling-video-o1",
      {},
      { placement: "advanced" },
    );
    (strict["match"](v63, /data-ui-schema-field="keep_original_sound"/),
      strict["match"](v63, /保留原声/),
      strict["match"](v63, /编辑视频或特征参考视频/));
    const v64 = renderModelUiSchemaControls(
      "apimart/kling-video-o1",
      { generationParams: { resolution: "pro", aspectRatio: "16:9" } },
      { placement: "resolution" },
    );
    (strict["match"](v64, /data-ui-schema-composite-field="qualityRatio"/),
      strict["match"](v64, /720P/),
      strict["match"](v64, /1080P/),
      strict["doesNotMatch"](v64, /data-ui-schema-value="4k"/),
      strict["match"](v64, /data-ui-schema-type="slider"/),
      strict["match"](v64, /data-ui-schema-range-values="5,10"/),
      strict["match"](v64, /ui-schema-duration-slider/),
      strict["match"](v64, />5S</),
      strict["match"](v64, />10S</));
    const v65 = renderModelUiSchemaControls(
      "apimart/kling-video-o1",
      { generationParams: { duration: 10 } },
      { placement: "mode" },
    );
    (strict["doesNotMatch"](v65, /data-ui-schema-type="slider"/),
      strict["doesNotMatch"](v65, /data-ui-schema-field="duration"/),
      strict["equal"](
        resolveModelExecution("apimart/kling-video-o1")?.[
          "executionManifest"
        ]?.["extensions"]?.["bodyResolver"],
        "apimartKlingO1Video",
      ));
    const v66 = renderModelUiSchemaControls(
      "apimart/viduq3",
      {
        generationParams: {
          vidu_q3_generation_mode: "reference",
          mode: "viduq3",
        },
      },
      { placement: "mode" },
    );
    (strict["match"](v66, /data-ui-schema-field="vidu_q3_generation_mode"/),
      strict["match"](v66, /data-ui-schema-field="mode"/),
      strict["ok"](
        v66["indexOf"]('data-ui-schema-field="mode"') <
          v66["indexOf"]('data-ui-schema-field="vidu_q3_generation_mode"'),
      ),
      strict["match"](
        v66,
        /data-ui-schema-value="viduq3-turbo"[^>]*data-ui-schema-disabled="true"/,
      ),
      strict["match"](v66, /data-ui-schema-value="viduq3"/));
    const v67 = renderModelUiSchemaControls(
      "apimart/viduq3",
      {
        generationParams: {
          vidu_q3_generation_mode: "reference",
          mode: "viduq3-mix",
        },
      },
      { placement: "resolution" },
    );
    (strict["match"](
      v67,
      /data-ui-schema-value="540p"[^>]*data-ui-schema-disabled="true"/,
    ),
      strict["match"](v67, /data-ui-schema-value="1080p"/),
      strict["match"](v67, /data-ui-schema-field="duration"/),
      strict["ok"](
        v67["indexOf"]('data-ui-schema-composite-field="qualityRatio"') <
          v67["indexOf"]("data-ui-schema-field=\x22duration\x22"),
      ),
      [
        "apimart/luma-ray-v2",
        "apimart/veo3-fast",
        "apimart/minimax-hailuo",
        "apimart/minimax-hailuo-2.3",
        "apimart/happyhorse-1.0",
        "apimart/wan2.7",
        "apimart/kling-v1-5",
        "apimart/kling-v3",
        "apimart/kling-v3-omni",
        "apimart/kling-video-o1",
        "apimart/viduq3",
      ]["forEach"]((v68) => {
        const v69 = renderModelUiSchemaControls(v68, {}, { placement: "mode" }),
          v70 = renderModelUiSchemaControls(
            v68,
            {},
            { placement: "resolution" },
          );
        (strict["doesNotMatch"](v69, /data-ui-schema-field="duration"/, v68),
          strict["match"](
            v70,
            /data-ui-schema-composite-field="qualityRatio"/,
            v68,
          ),
          strict["match"](v70, /data-ui-schema-field="duration"/, v68),
          strict["ok"](
            v70["indexOf"]('data-ui-schema-composite-field="qualityRatio"') <
              v70["indexOf"]('data-ui-schema-field="duration"'),
            v68,
          ));
      }),
      strict["match"](source, /resolveVideoModelApiFooterPlacementOrder/),
      strict["match"](source, /footerPlacementOrder/),
      strict["match"](
        source,
        /useModelApiSchemaParams \? renderModelApiModeBeforeResolution \? "" : modelApiModeControlsHtml \? modelApiModePlacementHtml : "" : `<div class="vid-mode-wrap"/,
      ),
      strict["match"](
        source,
        /useDreaminaSchemaParams \|\| useModelApiSchemaParams \? "" : `<div class="vid-duration-wrap"/,
      ),
      strict["ok"](
        source["indexOf"](
          "renderModelApiModeBeforeResolution\x20?\x20modelApiModePlacementHtml",
        ) <
          source["indexOf"](
            "modelApiResolutionControlsHtml\x20?\x20modelApiResolutionPlacementHtml",
          ),
      ));
  }),
  test("APIMart added video modelApi controls use shared Chinese schema labels", () => {
    const v71 = [
        "apimart/veo3-fast",
        "apimart/grok-imagine-1.0",
        "apimart/omni-flash-ext",
        "apimart/minimax-hailuo-2.3",
        "apimart/happyhorse-1.0",
        "apimart/wan2.7",
        "apimart/kling-v3",
        "apimart/kling-v3-omni",
        "apimart/kling-video-o1",
        "apimart/viduq3",
      ],
      v72 = new Set([
        "Duration",
        "Resolution",
        "Ratio",
        "Mode",
        "Audio",
        "Watermark",
        "Seed",
        "Negative\x20Prompt",
        "Prompt Extend",
        "GIF Output",
        "Edit Audio",
        "Shot\x20Type",
        "Standard",
        "Professional",
        "Pro",
        "Single",
        "Multi",
        "Auto",
        "Origin",
      ]);
    v71["forEach"]((v73) => {
      const v74 = getModelManifest(v73),
        v75 = v74?.["uiSchema"]?.["fields"] || [];
      v75["forEach"]((v76) => {
        (strict["equal"](
          v72["has"](v76["label"]),
          false,
          v73 + ":" + v76["id"],
        ),
          (v76["options"] || [])["forEach"]((v77) => {
            strict["equal"](
              v72["has"](v77["label"]),
              false,
              v73 + ":" + v76["id"] + ":" + v77["value"],
            );
          }));
      });
      const v78 = v75["find"]((v79) => v79["id"] === "duration");
      if (v78) strict["equal"](v78["label"], "视频时长");
      const v80 = v75["find"]((v81) => v81["id"] === "resolution");
      if (v80) strict["equal"](v80["label"], "视频分辨率");
      const v82 = v75["find"]((v83) => v83["id"] === "aspectRatio");
      v82 &&
        (strict["equal"](v82["label"], "比例"),
        strict["equal"](v82["displayRole"], "aspectRatio"));
    });
    const v84 = (v85, v86) =>
      resolveModelExecution(v85)?.["executionManifest"]?.["bodyMapping"]?.[
        "find"
      ]((v87) => v87["path"] === v86);
    (strict["equal"](
      v84("apimart/happyhorse-1.0", "resolution")?.["defaultValue"],
      "1080P",
    ),
      strict["equal"](
        v84("apimart/wan2.7", "resolution")?.["defaultValue"],
        "1080P",
      ),
      strict["equal"](v84("apimart/viduq3", "audio")?.["defaultValue"], true),
      strict["equal"](
        resolveModelExecution("apimart/wan2.7")?.["executionManifest"]?.[
          "extensions"
        ]?.["bodyResolver"],
        "apimartWan27Video",
      ),
      strict["equal"](
        resolveModelExecution("apimart/kling-v3-omni")?.["executionManifest"]?.[
          "extensions"
        ]?.["bodyResolver"],
        "apimartKlingV3OmniVideo",
      ));
  }),
  test("video parameter panel lazy mounts provider model menu", () => {
    (strict["match"](source, /_buildVideoModelMenuHtml\(activeModel = ""\)/),
      strict["match"](source, /data-lazy-model-menu="video"/),
      strict["match"](source, /const ensureVideoModelMenuContent = \(\) =>/),
      strict["match"](source, /bindNodeSubmenus\(modelMenu\)/),
      strict["doesNotMatch"](
        source,
        /const modelMenuHtml = renderNodeModelMenu/,
      ),
      strict["doesNotMatch"](source, /\$\{modelMenuHtml\}/));
  }),
  test("Dreamina and APIMart task model menus keep existing HTML contract", () => {
    (strict["deepEqual"](
      getDreaminaTaskModelMenuItems("multimodal2video", "dreamina")["map"](
        (v88) => v88["model"],
      ),
      [
        "dreamina/seedance2.0fast_vip",
        "dreamina/seedance2.0_vip",
        "dreamina/seedance2.0fast",
        "dreamina/seedance2.0",
      ],
    ),
      strict["deepEqual"](
        getDreaminaTaskModelMenuItems("frames2video", "dreamina")["map"](
          (v89) => v89["model"],
        ),
        [
          "dreamina/seedance2.0fast_vip",
          "dreamina/seedance2.0_vip",
          "dreamina/seedance2.0fast",
          "dreamina/seedance2.0",
          "dreamina/3.5pro",
          "dreamina/3.0",
        ],
      ),
      strict["deepEqual"](
        getDreaminaTaskModelMenuItems("frames2video", "apimart")["map"](
          (v90) => v90["model"],
        ),
        [
          "apimart/doubao-seedance-2.0-fast",
          "apimart/doubao-seedance-2.0",
          "apimart/doubao-seedance-2.0-fast-face",
          "apimart/doubao-seedance-2.0-face",
          "apimart/doubao-seedance-1-5-pro",
          "apimart/doubao-seedance-1-0-pro-quality",
        ],
      ));
    const v91 = buildDreaminaTaskModelMenuHtml(
      "dreamina/seedance2.0fast",
      "multimodal2video",
      "dreamina",
    );
    (strict["match"](
      v91,
      /<img src="images\/jimeng\.png" class="node-menu-icon" alt="dreamina">/,
    ),
      strict["match"](
        v91,
        /class="floating-menu-item node-menu-item active" data-value="dreamina\/seedance2\.0fast" data-provider="dreamina" data-dreamina-task-model="1"/,
      ),
      strict["match"](v91, /<div class="fmi-title">Seedance 2\.0 Fast<\/div>/),
      strict["match"](
        v91,
        /<div class="fmi-sub">默认推荐，支持文生、图生、首尾帧、全能参考<\/div>/,
      ));
    const v92 = buildDreaminaTaskModelMenuHtml(
      "apimart/doubao-seedance-2.0-fast",
      "multimodal2video",
      "apimart",
    );
    (strict["match"](v92, /node-menu-icon-badge-dark">AM<\/div>/),
      strict["match"](
        v92,
        /class="floating-menu-item node-menu-item active" data-value="apimart\/doubao-seedance-2\.0-fast" data-provider="apimart" data-dreamina-task-model="1"/,
      ),
      strict["match"](v92, /<div class="fmi-title">Seedance 2\.0 Fast<\/div>/),
      strict["match"](
        v92,
        /<div class="fmi-sub">APIMart 快速版，支持文生、图生、首尾帧与参考素材<\/div>/,
      ));
    const v93 = buildDreaminaTaskModelMenuHtml(
      "dreamina/seedance2.0fast",
      "multiframe2video",
      "dreamina",
    );
    (strict["match"](
      v93,
      /class="floating-menu-item node-menu-item disabled" data-disabled="true"/,
    ),
      strict["match"](v93, /<div class="fmi-title">智能多帧<\/div>/),
      strict["match"](v93, /<div class="fmi-sub">暂未开放模型切换<\/div>/),
      strict["match"](
        source,
        /taskModelMenu\.innerHTML = buildDreaminaTaskModelMenuHtml\(/,
      ),
      strict["doesNotMatch"](source, /_buildDreaminaModelMenuHTML/),
      strict["doesNotMatch"](v91, /style=/),
      strict["doesNotMatch"](v92, /style=/),
      strict["doesNotMatch"](v93, /style=/));
  }),
  test("video parameter panel: RunningHub instance control is rendered by uiSchema", () => {
    const v94 = renderModelUiSchemaControls(
      "runninghub/2054101324521844738",
      { generationParams: { rhInstanceType: "plus" } },
      { placement: "instance", variant: "instanceToggle" },
    );
    (strict["match"](v94, /data-ui-schema-field="rhInstanceType"/),
      strict["match"](v94, /rh-vram-btn/),
      strict["match"](v94, />48G</));
    const v95 = buildUiSchemaParamPatch(
      {
        model: "runninghub/2054101324521844738",
        rhInstanceType: "default",
        generationParams: { rhInstanceType: "default" },
      },
      "rhInstanceType",
      "plus",
    );
    (strict["equal"](
      Object["prototype"]["hasOwnProperty"]["call"](v95, "rhInstanceType"),
      false,
    ),
      strict["equal"](v95["generationParams"]["rhInstanceType"], "plus"));
  }),
  test("Dreamina video normal params render through direct uiSchema fields", () => {
    const v96 = getDreaminaEffectiveNodeData({
        model: "dreamina/seedance2.0fast",
        provider: "dreamina",
        duration: 7,
        aspectRatio: "自适应",
        generationParams: {
          duration: 6,
          aspectRatio: "16:9",
          resolution: "1080p",
        },
      }),
      v97 = buildDreaminaParamSchemaFields({
        routeMode: "multimodal2video",
        currentRatio: v96["aspectRatio"],
        currentResolution: v96["resolution"],
        currentDuration: v96["duration"],
        durationRange: { min: 4, max: 10, step: 1 },
        resolutionOptions: ["720p", "1080p"],
      }),
      v98 = renderUiSchemaFields([v97["resolution"], v97["aspectRatio"]], v96, {
        placement: "resolution",
      }),
      v99 = renderUiSchemaFields([v97["mode"]], v96),
      v100 = renderUiSchemaFields([v97["duration"]], v96);
    (strict["equal"](v96["duration"], 6),
      strict["equal"](v96["aspectRatio"], "16:9"),
      strict["match"](v99, /multimodal2video/),
      strict["match"](v99, /frames2video/),
      strict["doesNotMatch"](v99, /multiframe2video/),
      strict["doesNotMatch"](v99, /智能多帧/),
      strict["match"](
        source,
        /const useDreaminaSchemaParams = Boolean\(dreaminaState\)/,
      ),
      strict["match"](
        source,
        /useDreaminaSchemaParams \? "" : showRhParams && rhParamsControlsHtml \? rhParamsControlsHtml : modelApiResolutionControlsHtml/,
      ),
      strict["match"](v98, /img-rp-quality-area/),
      strict["match"](v98, /img-rp-ratio-area/),
      strict["match"](v98, /data-ui-schema-composite-field="qualityRatio"/),
      strict["match"](v98, /data-ui-schema-field="resolution"/),
      strict["doesNotMatch"](v98, /ui-schema-video-resolution-pill/),
      strict["doesNotMatch"](
        nodeTypesCss,
        /\.video-node \.img-rp-large-adaptive\s*\{[^}]*background:\s*var\(--white-10\)/,
      ),
      strict["match"](v100, /ui-schema-duration-pill/),
      strict["match"](
        v100,
        /floating-menu ui-schema-popup ui-schema-duration-pop/,
      ),
      strict["doesNotMatch"](v100, /ui-schema-duration-pop"[^>]*style=/),
      strict["match"](v100, /ui-schema-duration-title/),
      strict["match"](v100, /ui-schema-duration-bounds/),
      strict["match"](
        source,
        /if \(!isDreamina\) \{[\s\S]*?querySelectorAll\("\.img-rp-ratio-item"\)/,
      ),
      strict["match"](source, /if \(adaptiveBtn && !isDreamina\)/),
      strict["match"](source, /buildImageSchemaAspectRatioDisplayPatch/),
      strict["match"](
        source,
        /_commitDreaminaSchemaAspectRatio\(value, latest\)/,
      ),
      strict["match"](source, /inputKinds:\s*\["image",\s*"video"\]/),
      strict["match"](
        uiModuleModelHelpersSource,
        /export function buildImageSchemaAspectRatioDisplayPatch/,
      ),
      strict["match"](
        imageUiModuleSource,
        /buildImageSchemaAspectRatioDisplayPatch/,
      ),
      strict["match"](source, /store\.updateNodeData\(this\.nodeId, patch\)/),
      strict["doesNotMatch"](
        source,
        /const applyDreaminaAdaptiveDisplayRatio = \(nw, nh\)/,
      ),
      strict["doesNotMatch"](
        source,
        /_resolveDreaminaAdaptiveRatioDisplayValue/,
      ),
      strict["doesNotMatch"](source, /_buildDreaminaAspectRatioDisplayPatch/),
      strict["doesNotMatch"](source, /_getDreaminaAdaptiveSourceSize/),
      strict["doesNotMatch"](source, /pickClosestDreaminaVideoAdaptiveRatio/),
      strict["doesNotMatch"](source, /persistAspectRatio:\s*false/));
    const v101 = {
        textContent: "",
        querySelector() {
          return null;
        },
      },
      v102 = { value: "" },
      v103 = {
        dataset: { uiSchemaField: "duration", uiSchemaDefault: "6" },
        classList: {
          contains(v104) {
            return v104 === "ui-schema-duration-pill";
          },
        },
        querySelectorAll() {
          return [];
        },
        querySelector(v105) {
          if (v105 === "[data-ui-schema-input]") return v102;
          if (v105 === ".ui-schema-duration-label") return v101;
          if (v105 === ".ui-schema-pill-label") return v101;
          return null;
        },
      };
    (syncModelUiSchemaControls(
      {
        querySelectorAll(v106) {
          if (v106 === "[data-ui-schema-field]") return [v103];
          return [];
        },
      },
      { generationParams: { duration: 4 } },
    ),
      strict["equal"](v101["textContent"], "4S"),
      strict["notEqual"](v101["textContent"], "Resolution 4"));
    const v107 = buildDreaminaParamPatch(v96, {
      duration: 8,
      resolution: "720p",
      aspectRatio: "1:1",
    });
    (strict["equal"](
      Object["prototype"]["hasOwnProperty"]["call"](v107, "duration"),
      false,
    ),
      strict["equal"](
        Object["prototype"]["hasOwnProperty"]["call"](v107, "resolution"),
        false,
      ),
      strict["equal"](v107["generationParams"]["duration"], 8),
      strict["equal"](v107["generationParams"]["resolution"], "720p"),
      strict["equal"](
        v107["generationParamsByModel"]["dreamina/seedance2.0fast"][
          "aspectRatio"
        ],
        "1:1",
      ));
  }),
  test("Dreamina/APIMart video model selection restores per-model generation params", () => {
    const v108 = buildDreaminaModelSelectionParamPatch(
      {
        model: "dreamina/seedance2.0fast",
        provider: "dreamina",
        generationParams: {
          dreaminaRouteMode: "multimodal2video",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 6,
        },
        generationParamsByModel: {
          "dreamina/seedance2.0": {
            dreaminaRouteMode: "frames2video",
            aspectRatio: "9:16",
            resolution: "720p",
            duration: 12,
          },
        },
      },
      {
        model: "dreamina/seedance2.0",
        provider: "dreamina",
        taskType: "multimodal2video",
        fallbackValues: {
          dreaminaRouteMode: "multimodal2video",
          aspectRatio: "1:1",
          resolution: "720p",
          duration: 4,
        },
      },
    );
    (strict["equal"](
      v108["generationParamsByModel"]["dreamina/seedance2.0fast"][
        "dreaminaRouteMode"
      ],
      "multimodal2video",
    ),
      strict["equal"](
        v108["generationParamsByModel"]["dreamina/seedance2.0fast"][
          "aspectRatio"
        ],
        "16:9",
      ),
      strict["equal"](
        v108["generationParamsByModel"]["dreamina/seedance2.0fast"][
          "resolution"
        ],
        "720p",
      ),
      strict["equal"](
        v108["generationParamsByModel"]["dreamina/seedance2.0fast"]["duration"],
        6,
      ),
      strict["equal"](
        v108["generationParamsByModel"]["dreamina/seedance2.0fast"][
          "dreaminaModelByRouteMode"
        ]["dreamina:multimodal2video"],
        "dreamina/seedance2.0",
      ),
      strict["equal"](v108["generationParams"]["aspectRatio"], "9:16"),
      strict["equal"](v108["generationParams"]["duration"], 12),
      strict["equal"](v108["generationParams"]["resolution"], "720p"),
      strict["equal"](v108["dreaminaRouteMode"], "multimodal2video"),
      strict["equal"](
        v108["generationParams"]["dreaminaRouteMode"],
        "multimodal2video",
      ));
    const v109 = buildDreaminaModelSelectionParamPatch(
      {
        model: "apimart/doubao-seedance-2.0-fast",
        provider: "apimart",
        generationParams: {
          dreaminaRouteMode: "multimodal2video",
          aspectRatio: "1:1",
          resolution: "480p",
          duration: 5,
        },
        generationParamsByModel: {
          "apimart/doubao-seedance-2.0": {
            dreaminaRouteMode: "multimodal2video",
            aspectRatio: "21:9",
            resolution: "1080p",
            duration: 11,
          },
        },
      },
      {
        model: "apimart/doubao-seedance-2.0",
        provider: "apimart",
        taskType: "multimodal2video",
        fallbackValues: {
          dreaminaRouteMode: "multimodal2video",
          aspectRatio: "16:9",
          resolution: "480p",
          duration: 4,
        },
      },
    );
    (strict["equal"](v109["generationParams"]["aspectRatio"], "21:9"),
      strict["equal"](v109["generationParams"]["resolution"], "1080p"),
      strict["equal"](v109["generationParams"]["duration"], 11),
      strict["equal"](
        v109["generationParamsByModel"]["apimart/doubao-seedance-2.0-fast"][
          "resolution"
        ],
        "480p",
      ),
      strict["doesNotMatch"](
        source,
        /_buildDreaminaModelSelectionParamPatch\(this\._data/,
      ),
      strict["doesNotMatch"](
        source,
        /resolveDreaminaRememberedRouteModel\(this\._data/,
      ));
  }),
  test("ordinary\x20APIMart\x20modelApi\x20video\x20selection\x20scopes\x20generation\x20params\x20per\x20model", () => {
    const v110 = buildVideoModelApiModelSelectionPatch(
      {
        model: "apimart/veo3-fast",
        provider: "apimart",
        generationParams: {
          mode: "quality",
          generation_type: "frame",
          duration: 8,
          resolution: "720p",
          aspectRatio: "9:16",
        },
      },
      "apimart/minimax-hailuo",
      "apimart",
      { model: "apimart/minimax-hailuo", provider: "apimart" },
    );
    (strict["equal"](Object["hasOwn"](v110["generationParams"], "mode"), false),
      strict["equal"](v110["generationParams"]["duration"], 5),
      strict["equal"](v110["generationParams"]["resolution"], "768p"),
      strict["equal"](v110["generationParams"]["aspectRatio"], "自适应"),
      strict["equal"](v110["generationParams"]["prompt_optimizer"], true),
      strict["equal"](v110["generationParams"]["fast_pretreatment"], false),
      strict["equal"](v110["generationParams"]["watermark"], false),
      strict["equal"](
        v110["generationParamsByModel"]["apimart/veo3-fast"]["resolution"],
        "720p",
      ));
    const v111 = buildVideoModelApiModelSelectionPatch(
      {
        model: "apimart/veo3-fast",
        provider: "apimart",
        generationParams: {
          mode: "fast",
          generation_type: "frame",
          duration: 8,
          resolution: "720p",
        },
        generationParamsByModel: {
          "apimart/minimax-hailuo": {
            duration: 10,
            resolution: "1080p",
            prompt_optimizer: false,
          },
        },
      },
      "apimart/minimax-hailuo",
      "apimart",
      { model: "apimart/minimax-hailuo", provider: "apimart" },
    );
    (strict["equal"](Object["hasOwn"](v111["generationParams"], "mode"), false),
      strict["equal"](v111["generationParams"]["duration"], 5),
      strict["equal"](v111["generationParams"]["resolution"], "1080p"),
      strict["equal"](v111["generationParams"]["prompt_optimizer"], false));
    const v112 = buildVideoModelApiModelSelectionPatch(
      {
        model: "apimart/veo3-fast",
        provider: "apimart",
        generationParams: {
          mode: "fast",
          generation_type: "frame",
          duration: 8,
          resolution: "720p",
        },
        generationParamsByModel: {
          "apimart/minimax-hailuo": { duration: 10, resolution: "720p" },
        },
      },
      "apimart/minimax-hailuo",
      "apimart",
      { model: "apimart/minimax-hailuo", provider: "apimart" },
    );
    (strict["equal"](Object["hasOwn"](v112["generationParams"], "mode"), false),
      strict["equal"](v112["generationParams"]["duration"], 10),
      strict["equal"](v112["generationParams"]["resolution"], "768p"),
      strict["match"](source, /buildVideoModelApiModelSelectionPatch/),
      strict["match"](source, /targetExecution\.canonicalModelId/));
  }),
  test("ordinary APIMart modelApi video selection resets every target schema independently", () => {
    const v113 = [
        "apimart/veo3-fast",
        "apimart/grok-imagine-1.0",
        "apimart/omni-flash-ext",
        "apimart/minimax-hailuo",
        "apimart/minimax-hailuo-2.3",
        "apimart/happyhorse-1.0",
        "apimart/wan2.7",
        "apimart/kling-v3",
        "apimart/kling-v3-omni",
        "apimart/kling-video-o1",
        "apimart/viduq3",
      ],
      v114 = {
        vidu_q3_generation_mode: "reference",
        mode: "quality",
        generation_type: "reference",
        happyhorse_mode: "edit",
        duration: 15,
        resolution: "720p",
        aspectRatio: "9:16",
        enable_gif: true,
        prompt_optimizer: false,
        prompt_extend: false,
        audio_setting: "origin",
        audio: true,
        shot_type: "multi",
        watermark: true,
        seed: "999",
        negative_prompt: "blur",
      };
    for (const v115 of v113) {
      const v116 = buildVideoModelApiModelSelectionPatch(
        {
          model: "apimart/luma-ray-v2",
          provider: "apimart",
          generationParams: v114,
        },
        v115,
        "apimart",
        { model: v115, provider: "apimart" },
      );
      strict["deepEqual"](
        v116["generationParams"],
        buildModelUiSchemaDefaultParams(v115),
        v115 + " should start from its own uiSchema defaults",
      );
      const v117 = new Set(
        (getModelManifest(v115)?.["uiSchema"]?.["fields"] || [])["map"](
          (v118) => v118["id"],
        ),
      );
      strict["deepEqual"](
        Object["keys"](v116["generationParams"])["sort"](),
        [...v117]["sort"](),
        v115 + " should not keep fields from another model",
      );
    }
  }),
  test("Dreamina route mode switch restores the model version selected in that mode", () => {
    const v119 = buildDreaminaModelSelectionParamPatch(
      {
        model: "dreamina/seedance2.0fast",
        provider: "dreamina",
        dreaminaRouteMode: "frames2video",
        generationParams: {
          dreaminaRouteMode: "frames2video",
          aspectRatio: "3:4",
          resolution: "720p",
          duration: 4,
        },
      },
      {
        model: "dreamina/3.5pro",
        provider: "dreamina",
        taskType: "frames2video",
        fallbackValues: {
          dreaminaRouteMode: "frames2video",
          aspectRatio: "3:4",
          resolution: "720p",
          duration: 4,
        },
      },
    );
    strict["equal"](
      v119["dreaminaModelByRouteMode"]["dreamina:frames2video"],
      "dreamina/3.5pro",
    );
    const v120 = buildDreaminaRouteModeUpdate({
      nextRouteMode: "frames2video",
      baseNodeData: {
        model: "dreamina/seedance2.0fast",
        provider: "dreamina",
        dreaminaRouteMode: "multimodal2video",
        generationParams: {
          dreaminaRouteMode: "multimodal2video",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 6,
          dreaminaModelByRouteMode: {
            "dreamina:frames2video": "dreamina/3.5pro",
            "dreamina:multimodal2video": "dreamina/seedance2.0fast",
          },
        },
      },
      incoming: [
        { id: "edge-1", sourceId: "image-1" },
        { id: "edge-2", sourceId: "image-2" },
      ],
      nodes: {
        "image-1": { type: "source-image" },
        "image-2": { type: "source-image" },
      },
    });
    (strict["equal"](v120["patch"]["model"], "dreamina/3.5pro"),
      strict["equal"](v120["patch"]["dreaminaRouteMode"], "frames2video"),
      strict["equal"](
        v120["patch"]["dreaminaModelByRouteMode"]["dreamina:frames2video"],
        "dreamina/3.5pro",
      ),
      strict["equal"](
        v120["patch"]["generationParams"]["dreaminaModelByRouteMode"][
          "dreamina:frames2video"
        ],
        "dreamina/3.5pro",
      ));
  }),
  test("Dreamina\x20task\x20model\x20version\x20switch\x20restores\x20target\x20model\x20params", () => {
    const v121 = buildDreaminaModelSelectionParamPatch(
      {
        model: "dreamina/seedance2.0fast",
        provider: "dreamina",
        dreaminaRouteMode: "frames2video",
        generationParams: {
          dreaminaRouteMode: "frames2video",
          aspectRatio: "3:4",
          resolution: "720p",
          duration: 4,
          dreaminaModelByRouteMode: {
            "dreamina:frames2video": "dreamina/seedance2.0fast",
            "dreamina:multimodal2video": "dreamina/seedance2.0",
          },
        },
        generationParamsByModel: {
          "dreamina/seedance2.0": {
            dreaminaRouteMode: "frames2video",
            aspectRatio: "9:16",
            resolution: "720p",
            duration: 12,
          },
        },
      },
      {
        model: "dreamina/seedance2.0",
        provider: "dreamina",
        taskType: "frames2video",
        fallbackValues: {
          dreaminaRouteMode: "frames2video",
          aspectRatio: "3:4",
          resolution: "720p",
          duration: 4,
        },
      },
    );
    (strict["equal"](v121["dreaminaRouteMode"], "frames2video"),
      strict["equal"](
        v121["generationParams"]["dreaminaRouteMode"],
        "frames2video",
      ),
      strict["equal"](v121["generationParams"]["aspectRatio"], "9:16"),
      strict["equal"](v121["generationParams"]["duration"], 12),
      strict["equal"](
        v121["dreaminaModelByRouteMode"]["dreamina:frames2video"],
        "dreamina/seedance2.0",
      ),
      strict["doesNotMatch"](source, /restoreTargetParams:\s*false/));
  }),
  test("Dreamina\x20and\x20APIMart\x20provider\x20entry\x20switch\x20keeps\x20remembered\x20route\x20model", () => {
    const v122 = {
        model: "apimart/doubao-seedance-1-5-pro",
        provider: "apimart",
        dreaminaRouteMode: "multimodal2video",
        generationParams: {
          dreaminaRouteMode: "multimodal2video",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 6,
          dreaminaModelByRouteMode: {
            "dreamina:multimodal2video": "dreamina/seedance2.0",
            "apimart:multimodal2video": "apimart/doubao-seedance-1-5-pro",
            "apimart:frames2video": "apimart/doubao-seedance-2.0-face",
          },
        },
        generationParamsByModel: {
          "dreamina/seedance2.0": {
            dreaminaRouteMode: "multimodal2video",
            aspectRatio: "9:16",
            resolution: "720p",
            duration: 12,
          },
          "apimart/doubao-seedance-2.0-face": {
            dreaminaRouteMode: "frames2video",
            aspectRatio: "3:4",
            resolution: "1080p",
            duration: 8,
            dreaminaModelByRouteMode: {
              "apimart:frames2video": "apimart/doubao-seedance-2.0-face",
            },
          },
        },
      },
      v123 = resolveDreaminaRememberedRouteModel(v122, {
        provider: "dreamina",
        routeMode: "multimodal2video",
        taskType: "multimodal2video",
        fallbackModel: "dreamina/seedance2.0fast",
      });
    strict["equal"](v123, "dreamina/seedance2.0");
    const v124 = buildDreaminaModelSelectionParamPatch(v122, {
      model: v123,
      provider: "dreamina",
      taskType: "multimodal2video",
      fallbackValues: {
        dreaminaRouteMode: "multimodal2video",
        aspectRatio: v122["generationParams"]["aspectRatio"],
        resolution: v122["generationParams"]["resolution"],
        duration: v122["generationParams"]["duration"],
      },
    });
    (strict["equal"](v124["generationParams"]["aspectRatio"], "9:16"),
      strict["equal"](v124["generationParams"]["duration"], 12),
      strict["equal"](
        v124["generationParamsByModel"]["apimart/doubao-seedance-1-5-pro"][
          "aspectRatio"
        ],
        "16:9",
      ));
    const v125 = resolveDreaminaRememberedRouteModel(
      { ...v122, model: v123, provider: "dreamina", ...v124 },
      {
        provider: "apimart",
        routeMode: "multimodal2video",
        taskType: "multimodal2video",
        fallbackModel: "apimart/doubao-seedance-2.0-fast",
      },
    );
    strict["equal"](v125, "apimart/doubao-seedance-1-5-pro");
    const v126 = buildDreaminaModelSelectionParamPatch(
      { ...v122, model: v123, provider: "dreamina", ...v124 },
      {
        model: v125,
        provider: "apimart",
        taskType: "multimodal2video",
        fallbackValues: {
          dreaminaRouteMode: "multimodal2video",
          aspectRatio: v124["generationParams"]["aspectRatio"],
          resolution: v124["generationParams"]["resolution"],
          duration: v124["generationParams"]["duration"],
        },
      },
    );
    (strict["equal"](v126["generationParams"]["aspectRatio"], "16:9"),
      strict["equal"](v126["generationParams"]["duration"], 6),
      strict["equal"](
        resolveDreaminaRememberedRouteModel(v122, {
          provider: "apimart",
          routeMode: "frames2video",
          taskType: "frames2video",
          fallbackModel: "apimart/doubao-seedance-2.0-fast",
        }),
        "apimart/doubao-seedance-2.0-face",
      ),
      strict["equal"](
        resolveDreaminaRememberedRouteModel(
          {
            model: "dreamina/seedance2.0_vip",
            provider: "dreamina",
            dreaminaRouteMode: "multimodal2video",
            generationParams: {
              dreaminaRouteMode: "multimodal2video",
              aspectRatio: "16:9",
              resolution: "720p",
              duration: 8,
            },
          },
          {
            provider: "dreamina",
            routeMode: "multimodal2video",
            taskType: "multimodal2video",
            fallbackModel: "dreamina/seedance2.0fast",
          },
        ),
        "dreamina/seedance2.0_vip",
      ),
      strict["equal"](
        resolveDreaminaRememberedRouteModel(
          {
            model: "apimart/doubao-seedance-2.0-fast",
            provider: "apimart",
            dreaminaRouteMode: "multimodal2video",
            generationParams: {
              dreaminaRouteMode: "multimodal2video",
              aspectRatio: "16:9",
              resolution: "720p",
              duration: 8,
            },
            generationParamsByModel: {
              "dreamina/seedance2.0": {
                dreaminaRouteMode: "multimodal2video",
                aspectRatio: "9:16",
                resolution: "720p",
                duration: 12,
              },
            },
          },
          {
            provider: "dreamina",
            routeMode: "multimodal2video",
            taskType: "multimodal2video",
            fallbackModel: "dreamina/seedance2.0fast",
          },
        ),
        "dreamina/seedance2.0",
      ),
      strict["equal"](
        resolveDreaminaRememberedRouteModel(
          {
            model: "apimart/doubao-seedance-2.0",
            provider: "apimart",
            dreaminaRouteMode: "multimodal2video",
            generationParams: {
              dreaminaRouteMode: "multimodal2video",
              aspectRatio: "16:9",
              resolution: "720p",
              duration: 8,
            },
          },
          {
            provider: "dreamina",
            routeMode: "multimodal2video",
            taskType: "multimodal2video",
            fallbackModel: "dreamina/seedance2.0fast",
          },
        ),
        "dreamina/seedance2.0",
      ),
      strict["match"](source, /commitDreaminaModelSelection\(\{/),
      strict["doesNotMatch"](
        source,
        /resolveDreaminaRememberedRouteModel\(this\._data/,
      ));
  }),
  test("APIMart\x20target\x20params\x20do\x20not\x20overwrite\x20remembered\x20Dreamina\x20route\x20model", () => {
    const v127 = buildDreaminaModelSelectionParamPatch(
      {
        model: "dreamina/seedance2.0",
        provider: "dreamina",
        dreaminaRouteMode: "multimodal2video",
        generationParams: {
          dreaminaRouteMode: "multimodal2video",
          aspectRatio: "9:16",
          resolution: "720p",
          duration: 12,
          dreaminaModelByRouteMode: {
            "dreamina:multimodal2video": "dreamina/seedance2.0",
          },
        },
        generationParamsByModel: {
          "apimart/doubao-seedance-2.0-fast": {
            dreaminaRouteMode: "multimodal2video",
            aspectRatio: "16:9",
            resolution: "720p",
            duration: 6,
            dreaminaModelByRouteMode: {
              "dreamina:multimodal2video": "dreamina/seedance2.0fast",
              "apimart:multimodal2video": "apimart/doubao-seedance-2.0-fast",
            },
          },
        },
      },
      {
        model: "apimart/doubao-seedance-2.0-fast",
        provider: "apimart",
        taskType: "multimodal2video",
        fallbackValues: {
          dreaminaRouteMode: "multimodal2video",
          aspectRatio: "9:16",
          resolution: "720p",
          duration: 12,
        },
      },
    );
    (strict["equal"](
      v127["dreaminaModelByRouteMode"]["dreamina:multimodal2video"],
      "dreamina/seedance2.0",
    ),
      strict["equal"](
        v127["generationParams"]["dreaminaModelByRouteMode"][
          "dreamina:multimodal2video"
        ],
        "dreamina/seedance2.0",
      ),
      strict["equal"](
        resolveDreaminaRememberedRouteModel(
          {
            model: "apimart/doubao-seedance-2.0-fast",
            provider: "apimart",
            dreaminaRouteMode: "multimodal2video",
            ...v127,
          },
          {
            provider: "dreamina",
            routeMode: "multimodal2video",
            taskType: "multimodal2video",
            fallbackModel: "dreamina/seedance2.0fast",
          },
        ),
        "dreamina/seedance2.0",
      ));
  }),
  test("video node: RunningHub instance label sync uses uiSchema state", () => {
    (strict["match"](
      videoNodeSource,
      /syncModelUiSchemaControls\(this\.footerEl,\s*schemaNodeData\)/,
    ),
      strict["doesNotMatch"](
        videoNodeSource,
        /\(nodeData\?\.rhInstanceType \|\| "default"\) === "plus"/,
      ));
  }),
  test("video\x20prompt\x20placeholder\x20can\x20come\x20from\x20model\x20manifest", () => {
    (strict["match"](source, /resolveVideoPromptPlaceholder/),
      strict["match"](source, /prompt\?\.variants/),
      strict["match"](
        videoNodeSource,
        /_syncDreaminaPromptPlaceholder\(nodeData\)/,
      ),
      strict["match"](
        getModelManifest("apimart/minimax-hailuo")?.["prompt"]?.[
          "placeholder"
        ] || "",
        /\[推进\]一只猫咪在花园中奔跑/,
      ));
    const v128 = getModelManifest("apimart/veo3-fast");
    (strict["match"](
      resolveVideoPromptPlaceholder(v128, {
        generationParams: { generation_type: "frame" },
      }),
      /首帧到尾帧/,
    ),
      strict["match"](
        resolveVideoPromptPlaceholder(v128, {
          generationParams: { generation_type: "reference" },
        }),
        /参考图主体/,
      ));
    const v129 = getModelManifest("apimart/happyhorse-1.0");
    (strict["match"](
      resolveVideoPromptPlaceholder(v129, {
        generationParams: { happyhorse_mode: "auto" },
      }),
      /夕阳下的海边公路/,
    ),
      strict["match"](
        resolveVideoPromptPlaceholder(v129, {
          generationParams: { happyhorse_mode: "image" },
        }),
        /首帧图要如何动起来/,
      ),
      strict["match"](
        resolveVideoPromptPlaceholder(v129, {
          generationParams: { happyhorse_mode: "reference" },
        }),
        /@图片1 中的主角/,
      ),
      strict["match"](
        resolveVideoPromptPlaceholder(v129, {
          generationParams: { happyhorse_mode: "edit" },
        }),
        /改写源视频/,
      ));
    const v130 = getModelManifest("apimart/wan2.7");
    (strict["match"](
      resolveVideoPromptPlaceholder(v130, {
        generationParams: { wan27_mode: "image" },
      }),
      /首帧\/尾帧/,
    ),
      strict["match"](
        resolveVideoPromptPlaceholder(v130, {
          generationParams: { wan27_mode: "video" },
        }),
        /如何续写/,
      ),
      strict["match"](
        resolveVideoPromptPlaceholder(v130, {
          generationParams: { wan27_mode: "reference" },
        }),
        /@图片1、@图片2、@视频1/,
      ),
      strict["match"](
        resolveVideoPromptPlaceholder(v130, {
          generationParams: { wan27_mode: "edit" },
        }),
        /原视频做什么编辑/,
      ),
      strict["match"](
        resolveVideoPromptPlaceholder(getModelManifest("apimart/kling-v3")),
        /@图片1 到 @图片2/,
      ));
    const v131 = getModelManifest("apimart/kling-v3-omni");
    (strict["match"](
      resolveVideoPromptPlaceholder(v131, {
        generationParams: { kling_v3_omni_mode: "image" },
      }),
      /@图片1 \/ @图片2/,
    ),
      strict["match"](
        resolveVideoPromptPlaceholder(v131, {
          generationParams: { kling_v3_omni_mode: "reference" },
        }),
        /@图片1、@视频1/,
      ),
      strict["match"](
        resolveVideoPromptPlaceholder(v131, {
          generationParams: { kling_v3_omni_mode: "edit" },
        }),
        /编辑原视频/,
      ),
      strict["match"](
        resolveVideoPromptPlaceholder(
          getModelManifest("apimart/kling-video-o1"),
        ),
        /@图片1 中的人物/,
      ));
    const v132 = getModelManifest("apimart/viduq3");
    (strict["match"](
      resolveVideoPromptPlaceholder(v132, {
        generationParams: { vidu_q3_generation_mode: "video" },
      }),
      /@图片1 \+ @图片2/,
    ),
      strict["match"](
        resolveVideoPromptPlaceholder(v132, {
          generationParams: { vidu_q3_generation_mode: "reference" },
        }),
        /@图片1、@图片2/,
      ));
  }),
  test("video node: subtract subject toggle refreshes refs without rebuilding footer", () => {
    const v133 =
      videoNodeSource["match"](/const footerSig = [^\n]+;/)?.[0] || "";
    (strict["ok"](v133),
      strict["doesNotMatch"](v133, /rhSubtractSubject/),
      strict["match"](
        videoNodeSource,
        /const subtractSubjectSig = String\(nodeData\?\.rhSubtractSubject \|\| ""\);[\s\S]*subtractSubjectSig !== this\._lastSubtractSubjectSig[\s\S]*this\._renderRefBar\(\);/,
      ),
      strict["match"](
        videoNodeSource,
        /syncModelUiSchemaControls\(this\.footerEl,\s*schemaNodeData\)/,
      ));
  }),
  test("video parameter footer: uses compact pipe separators instead of down chevrons", () => {
    (strict["doesNotMatch"](
      source,
      /<svg width="10" height="10"[^>]*stroke-width="2"[^>]*><polyline points="6 9 12 15 18 9"><\/polyline><\/svg>/,
    ),
      strict["match"](
        nodeTypesCss,
        /\.video-node \.prompt-panel-footer \.img-model-pills > :not\(:first-child\)::before/,
      ),
      strict["match"](nodeTypesCss, /content:\s*"\|"/),
      strict["match"](nodeTypesCss, /padding-left:\s*18px/),
      strict["match"](nodeTypesCss, /position:\s*absolute/),
      strict["match"](nodeTypesCss, /left:\s*5px/),
      strict["match"](nodeTypesCss, /text-overflow:\s*ellipsis/),
      strict["match"](
        nodeTypesCss,
        /\.video-node \.prompt-panel-footer \.ui-schema-quality-ratio-label,[\s\S]*?\.video-node \.prompt-panel-footer \.ui-schema-section-pair-label\{width:max-content;min-width:max-content;\}/,
      ));
  }),
  test("Dreamina duration schema popup keeps floating-menu layout semantics", () => {
    (strict["match"](
      nodeTypesCss,
      /\.ui-schema-pill-menu,\.ui-schema-section-menu,\.ui-schema-section-pair-pill,\.ui-schema-resolution-pill,\.ui-schema-duration-pill,/,
    ),
      strict["match"](
        nodeTypesCss,
        /\.ui-schema-duration-pop\.show\{display:flex;\}/,
      ),
      strict["match"](
        nodeTypesCss,
        /\.video-node \.prompt-panel-footer \.vid-duration-pop,[\s\S]*?\.ui-schema-duration-pop\{padding:12px;width:150px;box-sizing:border-box;flex-direction:column;gap:10px;\}/,
      ),
      strict["match"](
        nodeTypesCss,
        /\.video-node \.prompt-panel-footer \.vid-duration-slider,[\s\S]*?\.ui-schema-range\.ui-schema-duration-slider\{width:100%;max-width:100%;min-width:0;accent-color:var\(--blue\);cursor:var\(--link-cursor\);\}/,
      ),
      strict["doesNotMatch"](
        source,
        /vid-duration-pop" style="[^"]*width:150px/,
      ),
      strict["match"](
        uiSchemaRendererSource,
        /item\.classList\?\.contains\("floating-menu"\)[\s\S]*?item\.style\.display = "";/,
      ),
      strict["match"](
        uiSchemaRendererSource,
        /popup\.style\.display = "";[\s\S]*?popup\.classList\.toggle\("show", shouldOpen\)/,
      ));
  }),
  test("video\x20schema\x20parameter\x20menus\x20keep\x20video\x20footer\x20typography", () => {
    (strict["match"](
      nodeTypesCss,
      /\.floating-menu-item \{[\s\S]*?font-size:\s*13px;/,
    ),
      strict["match"](
        nodeTypesCss,
        /\.video-node \.prompt-panel-footer \.ui-schema-pill-menu \.ui-schema-floating-menu \.floating-menu-item\{padding:6px 12px;border-radius:8px;\}/,
      ),
      strict["match"](nodeTypesCss, /\.ui-schema-section-pair-label/));
  }),
  test("RunningHub video advanced panel remains a dropdown below the footer", () => {
    (strict["match"](
      nodeTypesCss,
      /\.rh-vram-adv-panel\{[^}]*top:calc\(100% \+ 8px\)/,
    ),
      strict["doesNotMatch"](
        nodeTypesCss,
        /\.rh-vram-adv-panel\{[^}]*bottom:calc\(100% \+ 8px\)/,
      ));
  }),
  test("RunningHub V5.4 advanced panel keeps old layout and reopens after close", () => {
    (strict["match"](
      nodeTypesCss,
      /\.rh-vram-adv-panel > \.ui-schema-renderer\{[^}]*align-items:stretch;[^}]*width:100%;/,
    ),
      strict["doesNotMatch"](source, /isSchemaAdvancedPanel/),
      strict["doesNotMatch"](source, /querySelectorAll\("\.rh-adv-seg-btn"\)/),
      strict["doesNotMatch"](videoNodeSource, /rh-adv-seg-btn\[data-key/));
    const v134 = new Set(["rh-vram-adv-panel", "show"]),
      v135 = {
        style: { display: "flex" },
        classList: {
          contains(v136) {
            return v134["has"](v136);
          },
          remove(v137) {
            v134["delete"](v137);
          },
        },
      };
    (closeNodeFooterMenus({
      querySelectorAll(v138) {
        return v138["includes"]("rh-vram-adv-panel") ? [v135] : [];
      },
    }),
      strict["equal"](v134["has"]("show"), false),
      strict["equal"](v135["style"]["display"], ""));
  }),
  test("RunningHub V5.4 advanced settings render from uiSchema with existing classes", () => {
    const v139 = "runninghub/2041741496667348994";
    (strict["equal"](
      hasModelUiSchema(v139, { placement: "videoAdvanced" }),
      true,
    ),
      strict["equal"](
        hasModelUiSchema(v139, { placement: "v54Advanced" }),
        false,
      ));
    const v140 = renderModelUiSchemaControls(
      v139,
      {
        model: v139,
        rhControlMode: "single",
        generationParams: {
          rhSingleControlPreset: "stable",
          rhBlendIntoScene: true,
          rhSubtractSubject: true,
          rhMaskExpand: 18,
          rhMaskRect: false,
          rhSpecialMode: "cameraMove",
          rhBreastJiggle: 0.35,
        },
      },
      { placement: "videoAdvanced" },
    );
    (strict["doesNotMatch"](source, /data-ui-schema-advanced-panel="1"/),
      strict["match"](source, /placement:\s*"videoAdvanced"/),
      strict["match"](
        source,
        /const schemaSyncNodeData = isDreamina[\s\S]*this\._getRhVideoAdvancedSchemaNodeData\(this\._data\);[\s\S]*syncModelUiSchemaControls\(footer, schemaSyncNodeData\);/,
      ),
      strict["match"](v140, /data-ui-schema-placement="videoadvanced"/),
      strict["match"](v140, /data-ui-schema-field="rhSingleControlPreset"/),
      strict["match"](v140, /rh-vram-adv-row/),
      strict["match"](v140, /rh-adv-control-line/),
      strict["match"](v140, /rh-adv-seg-btn/),
      strict["match"](v140, /data-key="rhSingleControlPreset"/),
      strict["match"](
        v140,
        /rh-adv-seg-btn active" data-key="rhSingleControlPreset" data-value="stable"/,
      ),
      strict["match"](v140, /rh-stepper-value/),
      strict["match"](v140, /aria-valuenow="18"/),
      strict["match"](v140, /rh-breast-jiggle-slider/),
      strict["match"](v140, /value="0.35"/),
      strict["match"](v140, /is-rh-disabled/));
  }),
  test("RunningHub V5.4 default special mode stays unselected when choosing single control", () => {
    const v141 = "runninghub/2041741496667348994",
      v142 = buildModelUiSchemaDefaultParams(v141);
    (strict["equal"](v142["rhSpecialMode"], "none"),
      strict["equal"](
        buildVideoWorkflowDisplayParamsPatch(v141, v142, {
          v54FpsOptions: [16, 24, 30],
        })["rhSpecialMode"],
        null,
      ));
    const v143 = buildUiSchemaParamPatch(
      { model: v141, generationParams: v142 },
      "rhSingleControlPreset",
      "stable",
    );
    (strict["equal"](
      v143["generationParams"]["rhSingleControlPreset"],
      "stable",
    ),
      strict["equal"](v143["generationParams"]["rhSpecialMode"], "none"));
    const v144 = renderModelUiSchemaControls(
      v141,
      { model: v141, generationParams: v143["generationParams"] },
      { placement: "videoAdvanced" },
    );
    (strict["match"](v144, /data-ui-schema-field="rhSpecialMode"/),
      strict["doesNotMatch"](v144, /data-value="none"/),
      strict["doesNotMatch"](
        v144,
        /rh-adv-seg-btn active" data-key="rhSpecialMode" data-value="longVideoOverlay"/,
      ),
      strict["doesNotMatch"](
        v144,
        /rh-adv-seg-btn active" data-key="rhSpecialMode" data-value="cameraMove"/,
      ));
  }),
  test("RunningHub Basic advanced settings render from videoAdvanced uiSchema", () => {
    const v145 = "runninghub/1971148165531475969";
    strict["equal"](
      hasModelUiSchema(v145, { placement: "videoAdvanced" }),
      true,
    );
    const v146 = renderModelUiSchemaControls(
      v145,
      { model: v145, generationParams: { rhEnableMask: true } },
      { placement: "videoAdvanced" },
    );
    (strict["match"](v146, /data-ui-schema-placement="videoadvanced"/),
      strict["match"](v146, /data-ui-schema-field="rhEnableMask"/),
      strict["match"](v146, /data-ui-schema-value-type="boolean"/),
      strict["match"](
        v146,
        /rh-adv-seg-btn active[^"]*" data-key="rhEnableMask"[^>]*data-ui-schema-value="true"/,
      ),
      strict["doesNotMatch"](source, /data-key="rhEnableMask"/),
      strict["doesNotMatch"](v146, /ui-schema-toggle-group/));
  }),
  test("RunningHub commercial digital human advanced settings render motion amplitude", () => {
    const v147 = "runninghub/2055639633148563458";
    strict["equal"](
      hasModelUiSchema(v147, { placement: "videoAdvanced" }),
      true,
    );
    const v148 = renderModelUiSchemaControls(
      v147,
      {
        model: v147,
        generationParams: {
          rhDigitalHumanMotionAmplitude: "1",
          rhDigitalHumanSceneMotionAmplitude: "1",
        },
      },
      { placement: "videoAdvanced" },
    );
    (strict["match"](v148, /data-ui-schema-placement="videoadvanced"/),
      strict["match"](
        v148,
        /data-ui-schema-field="rhDigitalHumanMotionAmplitude"/,
      ),
      strict["match"](v148, /数字人动作幅度/),
      strict["match"](v148, /data-ui-schema-value="0"[^>]*>普通/),
      strict["match"](v148, /data-ui-schema-value="1"[^>]*>较大/),
      strict["match"](v148, /data-ui-schema-value="2"[^>]*>强烈/),
      strict["match"](v148, /10秒以内动作幅度参数效果更明显/),
      strict["match"](v148, /超过10秒后效果会明显减弱/),
      strict["match"](
        v148,
        /rh-adv-seg-btn active[^"]*" data-key="rhDigitalHumanMotionAmplitude"[^>]*data-ui-schema-value="1"/,
      ),
      strict["match"](
        v148,
        /data-ui-schema-field="rhDigitalHumanSceneMotionAmplitude"/,
      ),
      strict["match"](v148, /画面运动幅度/));
    const v149 = v148["slice"](
      v148["indexOf"](
        'data-ui-schema-field="rhDigitalHumanSceneMotionAmplitude"',
      ),
    );
    (strict["match"](
      v149,
      /rh-adv-seg-btn active[^"]*" data-key="rhDigitalHumanSceneMotionAmplitude"[^>]*data-ui-schema-value="1"/,
    ),
      strict["doesNotMatch"](v149, /data-ui-schema-value="2"[^>]*>强烈/));
  }),
  test("RunningHub\x20video\x20normal\x20params\x20render\x20from\x20videoParams\x20uiSchema", () => {
    const v150 = "runninghub/2041741496667348994",
      v151 = "runninghub/1971148165531475969",
      v152 = "runninghub/2039336644536442882",
      v153 = "runninghub/2054101324521844738";
    (strict["equal"](
      hasModelUiSchema(v150, { placement: "videoParams" }),
      true,
    ),
      strict["equal"](
        hasModelUiSchema(v151, { placement: "videoParams" }),
        true,
      ),
      strict["equal"](
        hasModelUiSchema(v152, { placement: "videoParams" }),
        true,
      ),
      strict["equal"](
        hasModelUiSchema(v153, { placement: "videoParams" }),
        true,
      ));
    const v154 = renderModelUiSchemaControls(
      v150,
      {
        model: v150,
        generationParams: {
          rhVideoResolution: 1024,
          rhVideoFps: 24,
          rhVideoFrames: 0,
        },
        rhVideoSourceFrameCount: 123,
      },
      {
        placement: "videoParams",
        unwrap: true,
        rhVideoFpsOptions: [16, 24, 30],
      },
    );
    (strict["match"](v154, /class="img-ratio-wrap ui-schema-rh-video-params"/),
      strict["match"](v154, /class="img-pill-btn img-ratio-btn"/),
      strict["match"](v154, /class="img-ratio-icon-slot"/),
      strict["match"](v154, />帧数全长·帧率24·分辨率1024</),
      strict["match"](v154, /data-ui-schema-field="rhVideoResolution"/),
      strict["match"](v154, /img-rp-quality-segmented rh-video-resolution-seg/),
      strict["match"](
        v154,
        /rh-v5-res-btn ui-schema-option" data-value="1024" data-ui-schema-value="1024"/,
      ),
      strict["match"](
        v154,
        /rh-v5-fps-btn active ui-schema-option" data-value="24" data-ui-schema-value="24"/,
      ),
      strict["match"](
        v154,
        /rh-v5-source-framecount" aria-label="源视频总帧数">123</,
      ),
      strict["match"](v154, /rh-stepper rh-v5-frames-stepper/),
      strict["match"](v154, /aria-valuenow="0" tabindex="0">全长</));
    const v155 = renderModelUiSchemaControls(
      v152,
      {
        model: v152,
        generationParams: {
          rhVideoResolution: 1280,
          rhVideoFps: 16,
          rhVideoSeconds: 6,
        },
      },
      { placement: "videoParams", unwrap: true, rhVideoFpsOptions: [16, 24] },
    );
    (strict["match"](v155, />秒数6·帧率16·分辨率1280</),
      strict["match"](
        v155,
        /rh-ltx-res-btn ui-schema-option" data-value="1280"/,
      ),
      strict["match"](
        v155,
        /rh-ltx-fps-btn active ui-schema-option" data-value="16"/,
      ),
      strict["match"](v155, /rh-stepper rh-ltx-seconds-stepper/),
      strict["match"](v155, /aria-valuenow="6" tabindex="0">6</));
    const v156 = renderModelUiSchemaControls(
      v153,
      {
        model: v153,
        generationParams: { rhVideoResolution: 1024, rhVideoFrames: 77 },
        rhVideoSourceFrameCount: 88,
      },
      { placement: "videoParams", unwrap: true },
    );
    (strict["match"](v156, />帧数77·分辨率1024</),
      strict["doesNotMatch"](v156, /帧率24·分辨率/),
      strict["match"](
        v156,
        /rh-v5-source-framecount" aria-label="源视频总帧数">88</,
      ),
      strict["match"](
        nodeTypesCss,
        /\.ui-schema-rh-video-params \.rh-video-resolution-seg\{display:grid;grid-template-columns:repeat\(auto-fit,minmax\(56px,1fr\)\);gap:8px;width:100%;\}/,
      ),
      strict["match"](
        source,
        /renderModelUiSchemaControls\(_activeModel, rhParamsNodeData,[\s\S]*placement:\s*"videoParams"/,
      ),
      strict["doesNotMatch"](
        source,
        /v5Panel\.querySelectorAll\("\.rh-v5-fps-btn"\)/,
      ),
      strict["doesNotMatch"](
        source,
        /const ltxPanel = ratioPopup\?\.querySelector\("\.rh-ltx-meta-panel"\)/,
      ),
      strict["doesNotMatch"](
        videoNodeSource,
        /querySelectorAll\("\.rh-v5-fps-btn"\)/,
      ),
      strict["doesNotMatch"](
        videoNodeSource,
        /querySelectorAll\("\.rh-ltx-fps-btn"\)/,
      ));
  }),
  test("RunningHub video frame stepper accepts arithmetic input expressions", () => {
    const v157 = "runninghub/2041741496667348994";
    (strict["equal"](evaluateUiSchemaNumberExpression("25/5"), 5),
      strict["equal"](evaluateUiSchemaNumberExpression("12 + 8 - 3"), 17),
      strict["equal"](evaluateUiSchemaNumberExpression("(6 + 4) * 3"), 30),
      strict["equal"](evaluateUiSchemaNumberExpression("7.8/2"), 3.9),
      strict["equal"](
        Number["isNaN"](evaluateUiSchemaNumberExpression("25/0")),
        true,
      ),
      strict["equal"](
        Number["isNaN"](evaluateUiSchemaNumberExpression("25abc")),
        true,
      ));
    const v158 = buildUiSchemaParamPatch(
      { model: v157, generationParams: { rhVideoFrames: 77 } },
      "rhVideoFrames",
      Math["trunc"](evaluateUiSchemaNumberExpression("25/5")),
    );
    (strict["equal"](v158["generationParams"]["rhVideoFrames"], 5),
      strict["match"](uiSchemaRendererSource, /input\.type = "text";/),
      strict["match"](
        uiSchemaRendererSource,
        /const numeric = evaluateUiSchemaNumberExpression\(value\);/,
      ));
  }),
  test("RunningHub V5.4 fps options include 30 without advanced mode", () => {
    const v159 = "runninghub/2041741496667348994";
    (strict["deepEqual"](getRhV54FpsOptions(), [16, 24, 30]),
      strict["equal"](normalizeRhV54Fps(30), 30));
    const v160 = getModelManifest(v159)?.["uiSchema"]?.["fields"]?.["find"](
      (v161) => v161["id"] === "rhVideoFps",
    );
    strict["deepEqual"](
      (v160?.["options"] || [])["map"]((v162) => Number(v162["value"])),
      [16, 24, 30],
    );
  }),
  test("RunningHub video footer placement checks are manifest driven", () => {
    const v163 = "runninghub/2041741496667348994",
      v164 = "runninghub/1971148165531475969",
      v165 = "runninghub/2039336644536442882",
      v166 = "runninghub/2054101324521844738",
      v167 = "runninghub/video_matting",
      v168 = "runninghub/2055639633148563458";
    (strict["equal"](
      hasRunningHubVideoWorkflowUiPlacement(v163, "videoAdvanced"),
      true,
    ),
      strict["equal"](
        hasRunningHubVideoWorkflowUiPlacement(v164, "videoAdvanced"),
        true,
      ),
      strict["equal"](
        hasRunningHubVideoWorkflowUiPlacement(v168, "videoAdvanced"),
        true,
      ),
      strict["equal"](
        hasRunningHubVideoWorkflowUiPlacement(v165, "videoAdvanced"),
        false,
      ),
      strict["equal"](
        hasRunningHubVideoWorkflowUiPlacement(v165, "videoParams"),
        true,
      ),
      strict["equal"](
        hasRunningHubVideoWorkflowUiPlacement(v166, "videoParams"),
        true,
      ),
      strict["equal"](
        hasRunningHubVideoWorkflowUiPlacement(v167, "videoParams"),
        false,
      ),
      strict["deepEqual"](
        getRunningHubVideoWorkflowFpsOptions(v165, {
          v54FpsOptions: [16, 24, 30],
        }),
        [16, 24],
      ),
      strict["deepEqual"](
        getRunningHubVideoWorkflowFpsOptions(v164, {
          v54FpsOptions: [16, 24, 30],
        }),
        [16, 24, 30],
      ),
      strict["match"](
        source,
        /hasRunningHubVideoWorkflowUiPlacement\(\s*_activeModel,\s*"videoAdvanced"/,
      ),
      strict["doesNotMatch"](
        source,
        /const showRhAdv = isRhV54Editor \|\| isRhBasic/,
      ),
      strict["match"](
        videoNodeSource,
        /hasRunningHubVideoWorkflowUiPlacement\(\s*activeModel,\s*"videoParams"/,
      ));
  }),
  test("video\x20parameter\x20panel:\x20LTX2.3\x20uses\x20existing\x20video\x20parameter\x20UI", () => {
    (strict["match"](uiSchemaRendererSource, /rh-ltx-res-btn/),
      strict["match"](uiSchemaRendererSource, /rh-ltx-fps-btn/),
      strict["match"](uiSchemaRendererSource, /rh-ltx-seconds-stepper/),
      strict["match"](uiSchemaRendererSource, /rh-stepper-value/),
      strict["match"](
        uiSchemaRendererSource,
        /rh-v5-fps-seg[\s\S]*rh-ltx-fps-btn/,
      ),
      strict["doesNotMatch"](source, /rh-ltx-res-btn/),
      strict["doesNotMatch"](source, /rh-ltx-fps-btn/),
      strict["doesNotMatch"](videoNodeSource, /rh-ltx-res-btn/),
      strict["doesNotMatch"](videoNodeSource, /rh-ltx-fps-btn/),
      strict["doesNotMatch"](source, /rh-ltx-fps-seg/),
      strict["doesNotMatch"](
        source,
        /rh-ltx-seconds-stepper">[\s\S]{0,240}rh-stepper-btn/,
      ),
      strict["doesNotMatch"](source, /variant:\s*"advancedRow"/),
      strict["doesNotMatch"](source, /ui-schema-number/),
      strict["doesNotMatch"](source, /ui-schema-range/),
      strict["doesNotMatch"](source, /ui-schema-video-advanced-panel/),
      strict["doesNotMatch"](nodeTypesCss, /ui-schema-video-advanced-panel/));
  }),
  test("video workflow model switch: display params come from target generationParams", () => {
    (strict["match"](source, /buildVideoWorkflowDisplayParamsPatch/),
      strict["match"](source, /buildVideoWorkflowModelSelectionPatch/),
      strict["match"](source, /hasDisplayParamChange/),
      strict["match"](source, /bindModelUiSchemaControls\(footer/),
      strict["match"](
        source,
        /buildRhWorkflowFieldPatch\(latest, fieldId, value, schemaPatch\)/,
      ),
      strict["match"](source, /const commitModelSelection = \(payload\)/),
      strict["match"](source, /this\._renderFooter\(footer\)/),
      strict["doesNotMatch"](
        source,
        /footer\.querySelector\("\.img-model-label"\)\.textContent =/,
      ),
      strict["match"](
        videoNodeSource,
        /const activeModel = String\(nodeData\?\.model \|\| ""\)\.trim\(\)/,
      ),
      strict["match"](videoNodeSource, /const getLatestNodeData = \(\) =>/),
      strict["match"](
        videoNodeSource,
        /nodeData = getLatestNodeData\(\) \|\| this\._data \|\| nodeData;/,
      ),
      strict["match"](
        videoNodeSource,
        /const isRhWorkflowForAdaptive = this\._isRunninghubWorkflowModel\(/,
      ),
      strict["match"](videoNodeSource, /!isRhWorkflowForAdaptive/),
      strict["match"](
        source,
        /this\._isRunninghubWorkflowModel\(latestNode\?\.model,\s*latestNode\?\.provider\)/,
      ),
      strict["doesNotMatch"](
        source,
        /store\.updateNodeData\(this\.nodeId,\s*\{\s*rhVideo(?:Resolution|Fps|Frames|Seconds):/,
      ),
      strict["doesNotMatch"](source, /normalizeRhVideoResolution/),
      strict["doesNotMatch"](
        source,
        /buildVideoWorkflowGenerationParamsPatch\(\s*n,\s*(?:v|val)/,
      ),
      strict["deepEqual"](
        buildVideoWorkflowDisplayParamsPatch("runninghub/2039336644536442882", {
          rhVideoResolution: 1280,
          rhVideoFps: 16,
          rhVideoSeconds: 6,
          rhVideoFrames: 99,
        }),
        { rhVideoFps: 16, rhVideoSeconds: 6, rhVideoResolution: 1280 },
      ),
      strict["deepEqual"](
        buildVideoWorkflowDisplayParamsPatch("runninghub/1971148165531475969", {
          rhVideoResolution: 1024,
          rhVideoFps: 24,
          rhVideoFrames: 0,
          rhVideoSeconds: 11,
          rhEnableMask: true,
        }),
        {
          rhVideoFps: 24,
          rhVideoFrames: 0,
          rhVideoResolution: 1024,
          rhEnableMask: true,
        },
      ));
  }),
  test("video modelApi aspect ratio selection updates existing display size patch", () => {
    const v169 = getModelManifest("apimart/veo3-fast"),
      v170 = v169?.["uiSchema"]?.["fields"]?.["find"](
        (v171) => v171["id"] === "aspectRatio",
      );
    (strict["equal"](v170?.["displayRole"], "aspectRatio"),
      strict["match"](
        source,
        /_buildModelApiAspectRatioDisplayPatch\(\s*latest,\s*fieldId,\s*value,\s*schemaPatch/,
      ),
      strict["match"](source, /field\?\.displayRole !== "aspectRatio"/),
      strict["match"](
        source,
        /resolved\?\.modelManifest\?\.adapterType !== "modelApi"/,
      ),
      strict["match"](
        source,
        /resolved\?\.executionManifest\?\.adapterType !== "modelApi"/,
      ),
      strict["match"](source, /buildImageSchemaAspectRatioDisplayPatch\(\{/),
      strict["match"](
        source,
        /applyImageSchemaRatioResizeAnimation\(this,\s*\{/,
      ),
      strict["match"](source, /aspectRatio:\s*ratioValue/),
      strict["doesNotMatch"](
        source,
        /latestNodeData\?\.model\s*===\s*"apimart\/veo3-fast"/,
      ));
  }),
  test("video\x20workflow\x20model\x20selection\x20patch\x20preserves\x20current\x20defaults", () => {
    const v172 = "runninghub/2041741496667348994",
      v173 = "runninghub/1971148165531475969",
      v174 = "runninghub/2039336644536442882",
      v175 = "runninghub/2054101324521844738",
      v176 = "runninghub/2047787809091620866",
      v177 = buildVideoWorkflowModelSelectionPatch(
        {
          frameRate: 16,
          frameCount: 88,
          generationParamsByModel: {
            [v172]: {
              rhVideoResolution: 1024,
              rhVideoFps: 30,
              rhVideoFrames: 88,
              rhSingleControlPreset: "stable",
              rhMaskExpand: 12,
            },
          },
        },
        v172,
        { preserveMaskTouchedState: true, v54FpsOptions: [16, 24, 30] },
      );
    (strict["equal"](v177["rhVideoFps"], 30),
      strict["equal"](v177["rhVideoFrames"], 88),
      strict["equal"](v177["rhVideoResolution"], 1024),
      strict["equal"](v177["rhSingleControlPreset"], "stable"),
      strict["equal"](v177["rhMaskExpand"], 12),
      strict["equal"](v177["rhMaskExpandTouched"], false),
      strict["equal"](v177["frameRate"], 16),
      strict["equal"](v177["frameCount"], 88));
    const v178 = buildVideoWorkflowModelSelectionPatch(
      {
        generationParamsByModel: {
          [v173]: {
            rhVideoResolution: 1024,
            rhVideoFps: 30,
            rhVideoFrames: 0,
            rhEnableMask: true,
          },
        },
      },
      v173,
      { v54FpsOptions: [16, 24, 30] },
    );
    (strict["equal"](v178["rhVideoFps"], 24),
      strict["equal"](v178["rhVideoFrames"], 0),
      strict["equal"](v178["rhVideoResolution"], 1024),
      strict["equal"](v178["rhEnableMask"], true));
    const v179 = buildVideoWorkflowModelSelectionPatch(
      {
        rhLtxMode: "singing_voice",
        generationParamsByModel: {
          [v174]: {
            rhVideoResolution: 1280,
            rhVideoFps: 16,
            rhVideoSeconds: 6,
          },
        },
      },
      v174,
    );
    (strict["equal"](v179["rhVideoFps"], 16),
      strict["equal"](v179["rhVideoSeconds"], 6),
      strict["equal"](v179["rhVideoResolution"], 1280),
      strict["equal"](v179["rhLtxMode"], "singing_voice"));
    const v180 = buildVideoWorkflowModelSelectionPatch(
      {
        generationParamsByModel: {
          [v175]: { rhVideoResolution: 1024, rhVideoFrames: 77 },
        },
      },
      v175,
    );
    (strict["equal"](v180["rhVideoFps"], 24),
      strict["equal"](v180["rhVideoFrames"], 77),
      strict["equal"](v180["rhVideoResolution"], 1024));
    const v181 = buildVideoWorkflowModelSelectionPatch({}, v176);
    (strict["equal"](Object["hasOwn"](v181, "rhVideoResolution"), false),
      strict["equal"](Object["hasOwn"](v181, "rhVideoFps"), false));
  }),
  test("video\x20workflow\x20params:\x20current\x20display\x20fields\x20are\x20saved\x20into\x20model\x20memory", () => {
    const v182 = buildVideoWorkflowGenerationParamsPatch(
      {
        model: "runninghub/2039336644536442882",
        generationParams: {
          rhVideoResolution: 832,
          rhVideoFps: 24,
          rhVideoSeconds: 5,
        },
        rhVideoResolution: 1280,
        rhVideoFps: 16,
        rhVideoSeconds: 6,
      },
      "runninghub/1971148165531475969",
    );
    (strict["equal"](
      v182["generationParamsByModel"]["runninghub/2039336644536442882"][
        "rhVideoResolution"
      ],
      1280,
    ),
      strict["equal"](
        v182["generationParamsByModel"]["runninghub/2039336644536442882"][
          "rhVideoFps"
        ],
        16,
      ),
      strict["equal"](
        v182["generationParamsByModel"]["runninghub/2039336644536442882"][
          "rhVideoSeconds"
        ],
        6,
      ),
      strict["notEqual"](v182["generationParams"]["rhVideoSeconds"], 6));
  }),
  test("RunningHub V5.4 advanced params round-trip through generationParams display patch", () => {
    strict["deepEqual"](
      buildVideoWorkflowDisplayParamsPatch(
        "runninghub/2041741496667348994",
        {
          rhVideoResolution: 1024,
          rhVideoFps: 24,
          rhVideoFrames: 77,
          rhSingleControlPreset: "stable",
          rhBlendIntoScene: true,
          rhSubtractSubject: false,
          rhMaskExpand: 12,
          rhMaskRect: true,
          rhSpecialMode: "cameraMove",
          rhBreastJiggle: 0.37,
        },
        { v54FpsOptions: [16, 24, 30] },
      ),
      {
        rhVideoFps: 24,
        rhVideoFrames: 77,
        rhVideoResolution: 1024,
        rhBlendIntoScene: true,
        rhControlMode: "single",
        rhSingleControlPreset: "stable",
        rhSubtractSubject: false,
        rhMaskExpand: 12,
        rhMaskRect: true,
        rhSpecialMode: "cameraMove",
        rhBreastJiggle: 0.35,
      },
    );
  }));
