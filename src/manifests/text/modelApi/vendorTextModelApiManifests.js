import { NVIDIA_BUILTIN_TEXT_MODELS } from "./nvidiaBuiltinTextModels.js";
function createTextModelApiManifest({
  modelId: v0,
  executionId: v1,
  displayName: v2,
  aliases: aliases = null,
  provider: provider = "runninghub",
  icon: icon = "images/RH.png",
  description: description = "RunningHub image-to-text model API",
  inputSlots: inputSlots = null,
  extensions: extensions = null,
}) {
  const v3 = {
    schemaVersion: "1.0",
    modelId: v0,
    ...(Array["isArray"](aliases) ? { aliases: aliases } : {}),
    provider: provider,
    kind: "text",
    adapterType: "modelApi",
    executionId: v1,
    displayName: v2,
    icon: icon,
    description: description,
    inputSlots: Object["freeze"](
      inputSlots || {
        allowedKinds: Object["freeze"](["image", "text"]),
        minByKind: Object["freeze"]({ image: 1 }),
        maxByKind: Object["freeze"]({ image: 8, video: 0, audio: 0 }),
      },
    ),
    uiSchema: Object["freeze"]({ fields: Object["freeze"]([]) }),
    async: true,
    cancellable: false,
    outputType: "text",
  };
  return (
    extensions &&
      typeof extensions === "object" &&
      (v3["extensions"] = Object["freeze"](extensions)),
    Object["freeze"](v3)
  );
}
function createRunningHubTextModelApiManifest(v4) {
  return Object["freeze"]({
    schemaVersion: "1.0",
    modelId: v4["modelId"],
    provider: "runninghub",
    kind: "text",
    adapterType: "modelApi",
    executionId: v4["executionId"],
    displayName: v4["displayName"],
    icon: "images/RH.png",
    description: "RunningHub image-to-text model API",
    inputSlots: Object["freeze"]({
      allowedKinds: Object["freeze"](["image", "text"]),
      minByKind: Object["freeze"]({ image: 1 }),
      maxByKind: Object["freeze"]({ image: 8, video: 0, audio: 0 }),
    }),
    uiSchema: Object["freeze"]({ fields: Object["freeze"]([]) }),
    ...(v4["extensions"] && typeof v4["extensions"] === "object"
      ? { extensions: Object["freeze"](v4["extensions"]) }
      : {}),
    async: true,
    cancellable: false,
    outputType: "text",
  });
}
function createTextExecutionManifest({
  id: v5,
  model: v6,
  provider: provider = "runninghub",
  endpoint: endpoint = "/openapi/v2",
  endpointMode: endpointMode = "image-to-text",
  bodyMapping: bodyMapping = null,
  responseMapping: responseMapping = null,
  result: result = null,
  extensions: extensions = null,
}) {
  return Object["freeze"]({
    schemaVersion: "1.0",
    id: v5,
    provider: provider,
    kind: "text",
    adapterType: "modelApi",
    endpoint: endpoint,
    endpointMode: endpointMode,
    method: "POST",
    model: v6,
    ...(extensions && typeof extensions === "object"
      ? { extensions: Object["freeze"](extensions) }
      : {}),
    headers: Object["freeze"]({ "Content-Type": "application/json" }),
    bodyMapping: Object["freeze"](
      bodyMapping || { promptField: "prompt", inputImageField: "imageUrl" },
    ),
    responseMapping: Object["freeze"](
      responseMapping || {
        taskIdPath: "taskId",
        resultPaths: Object["freeze"](["results[].text", "text", "output"]),
      },
    ),
    result: Object["freeze"](
      result || {
        taskIdPath: "taskId",
        textFields: Object["freeze"](["text", "output", "content"]),
      },
    ),
  });
}
const RUNNINGHUB_IMAGE_TO_TEXT_MODELS = Object["freeze"]([
    Object["freeze"]({
      modelId: "runninghub-model/rhart-text-g-3-flash-preview-cv/image-to-text",
      executionId: "runninghub.model-api.rhart-text-g-3-flash-cv.v1",
      displayName: "RunningHub\x20G-3\x20Flash\x20CV",
      model: "rhart-text-g-3-flash-preview-cv/image-to-text",
    }),
    Object["freeze"]({
      modelId: "runninghub-model/rhart-text-g-3-pro-preview-cv/image-to-text",
      executionId: "runninghub.model-api.rhart-text-g-3-pro-cv.v1",
      displayName: "RunningHub\x20G-3\x20Pro\x20CV",
      model: "rhart-text-g-3-pro-preview-cv/image-to-text",
    }),
  ]),
  CHAT_COMPLETION_TEXT_INPUT_SLOTS = Object["freeze"]({
    allowedKinds: Object["freeze"](["text", "image"]),
    minByKind: Object["freeze"]({ text: 0, image: 0 }),
    maxByKind: Object["freeze"]({ image: 8, video: 0, audio: 0 }),
  }),
  CHAT_COMPLETION_TEXT_IMAGE_VIDEO_INPUT_SLOTS = Object["freeze"]({
    allowedKinds: Object["freeze"](["text", "image", "video"]),
    minByKind: Object["freeze"]({ text: 0, image: 0, video: 0 }),
    maxByKind: Object["freeze"]({ image: 8, video: 3, audio: 0 }),
  }),
  CHAT_COMPLETION_TEXT_ONLY_INPUT_SLOTS = Object["freeze"]({
    allowedKinds: Object["freeze"](["text"]),
    minByKind: Object["freeze"]({ text: 0 }),
    maxByKind: Object["freeze"]({ image: 0, video: 0, audio: 0 }),
  }),
  RUNNINGHUB_LLM_TEXT_MODELS = Object["freeze"]([
    Object["freeze"]({
      modelId: "qwen/qwen3.6-plus",
      executionId: "runninghub.model-api.text.qwen3-6-plus.v1",
      displayName: "Qwen3.6\x20Plus",
      model: "qwen/qwen3.6-plus",
      title: "qwen3.6-plus",
      subtitle: "阿里旗舰模型，支持长上下文与文本推理",
      icon: "qwen",
      order: 30,
    }),
    Object["freeze"]({
      modelId: "qwen/qwen3-vl-235b-a22b-instruct",
      executionId: "runninghub.model-api.text.qwen3-vl-235b-a22b-instruct.v1",
      displayName: "Qwen3-VL\x20235B\x20A22B\x20Instruct",
      model: "qwen/qwen3-vl-235b-a22b-instruct",
      title: "qwen3-vl-235b-a22b-instruct",
      subtitle: "视觉语言模型，适合图片识别与图文理解",
      icon: "qwen",
      inputSlots: CHAT_COMPLETION_TEXT_INPUT_SLOTS,
      order: 40,
    }),
    Object["freeze"]({
      modelId: "deepseek/deepseek-v4-flash",
      executionId: "runninghub.model-api.text.deepseek-v4-flash.v1",
      displayName: "DeepSeek\x20V4\x20Flash",
      model: "deepseek/deepseek-v4-flash",
      title: "deepseek-v4-flash",
      subtitle: "DeepSeek\x20V4\x20快速版，适合高频文本任务",
      icon: "deepseek",
      order: 50,
    }),
    Object["freeze"]({
      modelId: "deepseek/deepseek-v4-pro",
      executionId: "runninghub.model-api.text.deepseek-v4-pro.v1",
      displayName: "DeepSeek\x20V4\x20Pro",
      model: "deepseek/deepseek-v4-pro",
      title: "deepseek-v4-pro",
      subtitle: "DeepSeek V4 专业版，适合复杂推理与代码任务",
      icon: "deepseek",
      order: 60,
    }),
    Object["freeze"]({
      modelId: "bytedance/doubao-seed-2.0-lite",
      executionId: "runninghub.model-api.text.doubao-seed-2-lite.v1",
      displayName: "Doubao\x20Seed\x202.0\x20Lite",
      model: "bytedance/doubao-seed-2.0-lite",
      title: "doubao-seed-2.0-lite",
      subtitle: "豆包 Seed 2.0 轻量版，适合低成本文本任务",
      icon: "runninghub",
      order: 70,
    }),
    Object["freeze"]({
      modelId: "bytedance/doubao-seed-2.0-pro",
      executionId: "runninghub.model-api.text.doubao-seed-2-pro.v1",
      displayName: "Doubao Seed 2.0 Pro",
      model: "bytedance/doubao-seed-2.0-pro",
      title: "doubao-seed-2.0-pro",
      subtitle: "豆包 Seed 2.0 旗舰版，适合复杂推理和文本生成",
      icon: "runninghub",
      order: 80,
    }),
  ]),
  VOLCENGINE_TEXT_MODELS = Object["freeze"]([
    Object["freeze"]({
      modelId: "volcengine/doubao-seed-2-0-pro-260215",
      executionId: "volcengine.model-api.text.doubao-seed-2-0-pro-260215.v1",
      displayName: "Doubao Seed 2.0 Pro",
      model: "doubao-seed-2-0-pro-260215",
      title: "doubao-seed-2-0-pro-260215",
      subtitle:
        "火山方舟\x20Doubao\x20Seed\x202.0\x20Pro，适合复杂文本生成与推理",
      icon: "volcengine",
      order: 10,
    }),
    Object["freeze"]({
      modelId: "volcengine/doubao-seed-2-0-mini-260428",
      executionId: "volcengine.model-api.text.doubao-seed-2-0-mini-260428.v1",
      displayName: "Doubao Seed 2.0 Mini",
      model: "doubao-seed-2-0-mini-260428",
      title: "doubao-seed-2-0-mini-260428",
      subtitle: "火山方舟\x20Doubao\x20Seed\x202.0\x20Mini，平衡效果与响应速度",
      icon: "volcengine",
      order: 20,
    }),
    Object["freeze"]({
      modelId: "volcengine/doubao-seed-2-0-lite-260428",
      executionId: "volcengine.model-api.text.doubao-seed-2-0-lite-260428.v1",
      displayName: "Doubao Seed 2.0 Lite",
      model: "doubao-seed-2-0-lite-260428",
      title: "doubao-seed-2-0-lite-260428",
      subtitle: "火山方舟 Doubao Seed 2.0 Lite，适合高频文本任务",
      icon: "volcengine",
      order: 30,
    }),
  ]),
  CHAT_COMPLETION_TEXT_RESPONSE_MAPPING = Object["freeze"]({
    resultPaths: Object["freeze"]([
      "choices[].message.content",
      "choices[].delta.content",
      "text",
      "output",
    ]),
  }),
  VOLCENGINE_RESPONSES_TEXT_RESPONSE_MAPPING = Object["freeze"]({
    resultPaths: Object["freeze"]([
      "output_text",
      "data.output_text",
      "output[].content[].text",
      "output[].content[].content",
      "data.output[].content[].text",
      "data.output[].content[].content",
      "text",
      "output",
    ]),
  }),
  APIMART_TEXT_RESULT = Object["freeze"]({
    textFields: Object["freeze"]([
      "choices[].message.content",
      "text",
      "output",
    ]),
  }),
  APIMART_TEXT_EXECUTION_EXTENSIONS = Object["freeze"]({
    chatCompletionInputPolicy: "image-only",
  }),
  VOLCENGINE_TEXT_EXECUTION_EXTENSIONS = Object["freeze"]({
    chatCompletionInputPolicy: "image-video",
    volcengineFiles: Object["freeze"]({ videoFps: 0.3 }),
  }),
  RUNNINGHUB_LLM_TEXT_EXECUTION_EXTENSIONS = Object["freeze"]({
    endpointResolver: "runninghubLlmChatEndpoint",
    chatCompletionInputPolicy: "image-only",
  }),
  GRSAI_TEXT_MODELS = Object["freeze"]([
    Object["freeze"]({
      modelId: "gemini-3.1-pro",
      executionId: "grsai.model-api.text.gemini-3-1-pro.v1",
      displayName: "gemini-3.1-pro",
      model: "gemini-3.1-pro",
      subtitle: "谷歌最新模型gemini3.1",
      icon: "grsai",
      order: 10,
    }),
    Object["freeze"]({
      modelId: "gemini-3-pro",
      executionId: "grsai.model-api.text.gemini-3-pro.v1",
      displayName: "gemini-3-pro",
      model: "gemini-3-pro",
      subtitle: "谷歌最新模型gemini3.1",
      icon: "grsai",
      order: 20,
    }),
    Object["freeze"]({
      modelId: "gpt-5.4",
      executionId: "grsai.model-api.text.gpt-5-4.v1",
      displayName: "gpt-5.4",
      model: "gpt-5.4",
      subtitle: "GRSAI chat completion model API",
      icon: "grsai",
      order: 30,
    }),
    Object["freeze"]({
      modelId: "gpt-5.5",
      executionId: "grsai.model-api.text.gpt-5-5.v1",
      displayName: "gpt-5.5",
      model: "gpt-5.5",
      subtitle: "GRSAI\x20chat\x20completion\x20model\x20API",
      icon: "grsai",
      order: 40,
    }),
    Object["freeze"]({
      modelId: "gemini-3.5-flash",
      executionId: "grsai.model-api.text.gemini-3-5-flash.v1",
      displayName: "gemini-3.5-flash",
      model: "gemini-3.5-flash",
      subtitle: "GRSAI chat completion model API",
      icon: "grsai",
      order: 50,
    }),
  ]),
  PPIO_TEXT_MODELS = Object["freeze"]([
    Object["freeze"]({
      modelId: "minimax/minimax-m2.5-highspeed",
      executionId: "ppio.model-api.text.minimax-m2-5-highspeed.v1",
      displayName: "MiniMax M2.5-highspeed",
      model: "minimax/minimax-m2.5-highspeed",
      title: "minimax-m2.5-highspeed",
      subtitle: "更低延迟、更高性价比的领先模型",
      icon: "ppio",
      order: 10,
    }),
    Object["freeze"]({
      modelId: "qwen/qwen3.5-397b-a17b",
      executionId: "ppio.model-api.text.qwen3-5-397b-a17b.v1",
      displayName: "Qwen3.5-397B-A17B",
      model: "qwen/qwen3.5-397b-a17b",
      title: "qwen3.5-397b",
      subtitle: "阿里最强开源模型Qwen2.5",
      icon: "qwen",
      order: 20,
    }),
    Object["freeze"]({
      modelId: "deepseek/deepseek-v3.2",
      executionId: "ppio.model-api.text.deepseek-v3-2.v1",
      displayName: "DeepSeek-V3.2",
      model: "deepseek/deepseek-v3.2",
      title: "deepseek-v3",
      subtitle: "面向未来的新一代大模型",
      icon: "deepseek",
      order: 30,
    }),
    Object["freeze"]({
      modelId: "moonshotai/kimi-k2.5",
      executionId: "ppio.model-api.text.kimi-k2-5.v1",
      displayName: "Kimi K2.5",
      model: "moonshotai/kimi-k2.5",
      title: "kimi-k2.5",
      subtitle: "月之暗面最新版，超长上下文",
      icon: "moonshot",
      order: 40,
    }),
  ]),
  APIMART_TEXT_MODELS = Object["freeze"]([
    Object["freeze"]({
      modelId: "apimart/kimi-k2-instruct",
      executionId: "apimart.model-api.text.kimi-k2-instruct.v1",
      displayName: "Kimi K2 Instruct",
      model: "kimi-k2-instruct",
      subtitle: "APIMart text model",
      order: 10,
    }),
    Object["freeze"]({
      modelId: "apimart/deepseek-v4-pro",
      executionId: "apimart.model-api.text.deepseek-v4-pro.v1",
      displayName: "DeepSeek V4 Pro",
      model: "deepseek-v4-pro",
      subtitle: "APIMart\x20text\x20model",
      order: 20,
    }),
    Object["freeze"]({
      modelId: "apimart/deepseek-v4-flash",
      executionId: "apimart.model-api.text.deepseek-v4-flash.v1",
      displayName: "DeepSeek V4 Flash",
      model: "deepseek-v4-flash",
      subtitle: "APIMart\x20text\x20model",
      order: 30,
    }),
    Object["freeze"]({
      modelId: "apimart/gpt-5.5",
      executionId: "apimart.model-api.text.gpt-5-5.v1",
      displayName: "GPT-5.5",
      model: "gpt-5.5",
      subtitle: "OpenAI-compatible text model",
      order: 40,
    }),
    Object["freeze"]({
      modelId: "apimart/gpt-5.4-mini",
      executionId: "apimart.model-api.text.gpt-5-4-mini.v1",
      displayName: "GPT-5.4\x20Mini",
      model: "gpt-5.4-mini",
      subtitle: "OpenAI-compatible\x20text\x20model",
      order: 50,
    }),
    Object["freeze"]({
      modelId: "apimart/gpt-5.4",
      executionId: "apimart.model-api.text.gpt-5-4.v1",
      displayName: "GPT-5.4",
      model: "gpt-5.4-apimart",
      title: "gpt-5.4",
      subtitle: "极致逻辑与推理性能，OpenAI\x20巅峰之作",
      order: 55,
    }),
    Object["freeze"]({
      modelId: "apimart/gemini-3.1-pro-preview",
      executionId: "apimart.model-api.text.gemini-3-1-pro-preview.v1",
      displayName: "Gemini 3.1 Pro Preview",
      model: "gemini-3.1-pro-preview",
      title: "gemini-3.1-pro-preview",
      subtitle: "旗舰级多模态模型，支持超长文本与深度分析",
      icon: "gemini",
      order: 56,
    }),
    Object["freeze"]({
      modelId: "apimart/gemini-3-flash-preview-nothinking",
      executionId: "apimart.model-api.text.gemini-3-flash-nothinking.v1",
      displayName: "Gemini 3 Flash",
      model: "gemini-3-flash-preview-nothinking",
      title: "gemini-3-flash-preview-nothinking",
      subtitle: "闪电级响应速度，适用于高频率对话与实时任务",
      icon: "gemini",
      order: 57,
    }),
    Object["freeze"]({
      modelId: "apimart/glm-5.1",
      executionId: "apimart.model-api.text.glm-5-1.v1",
      displayName: "GLM-5.1",
      model: "glm-5.1",
      subtitle: "APIMart text model",
      order: 60,
    }),
  ]),
  NVIDIA_TEXT_MODELS = NVIDIA_BUILTIN_TEXT_MODELS;
export const vendorTextModelApiModelManifests = Object["freeze"]([
  ...RUNNINGHUB_IMAGE_TO_TEXT_MODELS["map"]((v7) =>
    createRunningHubTextModelApiManifest({
      modelId: v7["modelId"],
      executionId: v7["executionId"],
      displayName: v7["displayName"],
      extensions: Object["freeze"]({
        textMenu: Object["freeze"]({
          group: "runninghub",
          order: v7["modelId"]["includes"]("flash") ? 10 : 20,
          title: v7["modelId"]["includes"]("flash")
            ? "gemini3-flash"
            : "gemini3-pro",
          subtitle: v7["modelId"]["includes"]("flash")
            ? "闪电级响应速度，适用于高频率对话与实时任务"
            : "旗舰级多模态模型，支持超长文本与深度分析",
          icon: "gemini",
        }),
      }),
    }),
  ),
  ...RUNNINGHUB_LLM_TEXT_MODELS["map"]((v8) =>
    createTextModelApiManifest({
      modelId: v8["modelId"],
      executionId: v8["executionId"],
      displayName: v8["displayName"],
      provider: "runninghub",
      icon: "images/RH.png",
      description: "RunningHub LLM chat completion model API",
      inputSlots: v8["inputSlots"] || CHAT_COMPLETION_TEXT_ONLY_INPUT_SLOTS,
      extensions: Object["freeze"]({
        textMenu: Object["freeze"]({
          group: "runninghub",
          order: v8["order"],
          title: v8["title"] || v8["displayName"],
          subtitle: v8["subtitle"],
          icon: v8["icon"],
        }),
      }),
    }),
  ),
  ...VOLCENGINE_TEXT_MODELS["map"]((v9) =>
    createTextModelApiManifest({
      modelId: v9["modelId"],
      executionId: v9["executionId"],
      displayName: v9["displayName"],
      aliases: Object["freeze"]([v9["model"]]),
      provider: "volcengine",
      icon: "images/volcengine.svg",
      description: "Volcengine Ark chat completion model API",
      inputSlots: CHAT_COMPLETION_TEXT_IMAGE_VIDEO_INPUT_SLOTS,
      extensions: Object["freeze"]({
        textMenu: Object["freeze"]({
          group: "volcengine",
          order: v9["order"],
          title: v9["title"] || v9["displayName"],
          subtitle: v9["subtitle"],
          icon: v9["icon"],
        }),
      }),
    }),
  ),
  ...GRSAI_TEXT_MODELS["map"]((v10) =>
    createTextModelApiManifest({
      modelId: v10["modelId"],
      executionId: v10["executionId"],
      displayName: v10["displayName"],
      provider: "grsai",
      icon: "images/grsai.png",
      description: "GRSAI chat completion model API",
      inputSlots: CHAT_COMPLETION_TEXT_INPUT_SLOTS,
      extensions: Object["freeze"]({
        textMenu: Object["freeze"]({
          group: "grsai",
          order: v10["order"],
          title: v10["title"] || v10["displayName"],
          subtitle: v10["subtitle"],
          icon: v10["icon"],
        }),
      }),
    }),
  ),
  ...PPIO_TEXT_MODELS["map"]((v11) =>
    createTextModelApiManifest({
      modelId: v11["modelId"],
      executionId: v11["executionId"],
      displayName: v11["displayName"],
      provider: "ppio",
      icon: "images/ppio.png",
      description: "PPIO chat completion model API",
      inputSlots: CHAT_COMPLETION_TEXT_INPUT_SLOTS,
      extensions: Object["freeze"]({
        textMenu: Object["freeze"]({
          group: "ppio",
          order: v11["order"],
          title: v11["title"] || v11["displayName"],
          subtitle: v11["subtitle"],
          icon: v11["icon"],
        }),
      }),
    }),
  ),
  ...APIMART_TEXT_MODELS["map"]((v12) =>
    createTextModelApiManifest({
      modelId: v12["modelId"],
      executionId: v12["executionId"],
      displayName: v12["displayName"],
      aliases: v12["aliases"],
      provider: "apimart",
      icon: "AM",
      description: "APIMart chat completion model API",
      inputSlots: CHAT_COMPLETION_TEXT_INPUT_SLOTS,
      extensions: Object["freeze"]({
        textMenu: Object["freeze"]({
          group: "apimart",
          order: v12["order"],
          title: v12["title"] || v12["displayName"],
          subtitle: v12["subtitle"],
          ...(v12["icon"] ? { icon: v12["icon"] } : {}),
        }),
      }),
    }),
  ),
  ...NVIDIA_TEXT_MODELS["map"]((v19) =>
    createTextModelApiManifest({
      modelId: v19["modelId"],
      executionId: v19["executionId"],
      displayName: v19["displayName"],
      aliases: Object["freeze"]([v19["model"]]),
      provider: "nvidia",
      icon: "nvidia",
      description: "NVIDIA NIM chat completion model API",
      inputSlots: CHAT_COMPLETION_TEXT_INPUT_SLOTS,
      extensions: Object["freeze"]({
        textMenu: Object["freeze"]({
          group: "nvidia",
          order: v19["order"],
          title: v19["title"] || v19["displayName"],
          subtitle: v19["subtitle"],
          icon: v19["icon"],
        }),
      }),
    }),
  ),
]);
export const vendorTextModelApiExecutionManifests = Object["freeze"]([
  ...RUNNINGHUB_IMAGE_TO_TEXT_MODELS["map"]((v13) =>
    createTextExecutionManifest({
      id: v13["executionId"],
      model: v13["model"],
    }),
  ),
  ...RUNNINGHUB_LLM_TEXT_MODELS["map"]((v14) =>
    createTextExecutionManifest({
      id: v14["executionId"],
      provider: "runninghub",
      model: v14["model"],
      endpoint: "/v1/chat/completions",
      endpointMode: "chat-completion",
      bodyMapping: Object["freeze"]({
        modelField: "model",
        messagesField: "messages",
      }),
      responseMapping: CHAT_COMPLETION_TEXT_RESPONSE_MAPPING,
      result: APIMART_TEXT_RESULT,
      extensions: RUNNINGHUB_LLM_TEXT_EXECUTION_EXTENSIONS,
    }),
  ),
  ...VOLCENGINE_TEXT_MODELS["map"]((v15) =>
    createTextExecutionManifest({
      id: v15["executionId"],
      provider: "volcengine",
      model: v15["model"],
      endpoint: "/responses",
      endpointMode: "responses",
      bodyMapping: Object["freeze"]({
        modelField: "model",
        inputField: "input",
      }),
      responseMapping: VOLCENGINE_RESPONSES_TEXT_RESPONSE_MAPPING,
      result: APIMART_TEXT_RESULT,
      extensions: VOLCENGINE_TEXT_EXECUTION_EXTENSIONS,
    }),
  ),
  ...GRSAI_TEXT_MODELS["map"]((v16) =>
    createTextExecutionManifest({
      id: v16["executionId"],
      provider: "grsai",
      model: v16["model"],
      endpoint: "/v1",
      endpointMode: "chat-completion",
      bodyMapping: Object["freeze"]({
        modelField: "model",
        messagesField: "messages",
      }),
      responseMapping: CHAT_COMPLETION_TEXT_RESPONSE_MAPPING,
      result: APIMART_TEXT_RESULT,
    }),
  ),
  ...PPIO_TEXT_MODELS["map"]((v17) =>
    createTextExecutionManifest({
      id: v17["executionId"],
      provider: "ppio",
      model: v17["model"],
      endpoint: "/openai/v1",
      endpointMode: "chat-completion",
      bodyMapping: Object["freeze"]({
        modelField: "model",
        messagesField: "messages",
      }),
      responseMapping: CHAT_COMPLETION_TEXT_RESPONSE_MAPPING,
      result: APIMART_TEXT_RESULT,
    }),
  ),
  ...APIMART_TEXT_MODELS["map"]((v18) =>
    createTextExecutionManifest({
      id: v18["executionId"],
      provider: "apimart",
      model: v18["model"],
      endpoint: "/v1/chat/completions",
      endpointMode: "chat-completion",
      bodyMapping: Object["freeze"]({
        modelField: "model",
        messagesField: "messages",
      }),
      responseMapping: CHAT_COMPLETION_TEXT_RESPONSE_MAPPING,
      result: APIMART_TEXT_RESULT,
      extensions: APIMART_TEXT_EXECUTION_EXTENSIONS,
    }),
  ),
  ...NVIDIA_TEXT_MODELS["map"]((v20) =>
    createTextExecutionManifest({
      id: v20["executionId"],
      provider: "nvidia",
      model: v20["model"],
      endpoint: "/chat/completions",
      endpointMode: "chat-completion",
      bodyMapping: Object["freeze"]({
        modelField: "model",
        messagesField: "messages",
      }),
      responseMapping: CHAT_COMPLETION_TEXT_RESPONSE_MAPPING,
      result: APIMART_TEXT_RESULT,
    }),
  ),
]);
