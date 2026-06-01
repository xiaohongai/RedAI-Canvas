import test from "node:test";
import strict from "node:assert/strict";
function mockFetchOnceJson(v0) {
  globalThis["fetch"] = async (v1) => {
    if (String(v1) !== "/api/config")
      throw new Error("unexpected fetch url: " + String(v1));
    return {
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => v0,
      text: async () => JSON["stringify"](v0),
    };
  };
}
function installSecureSettingsStub(
  v2,
  { available: available = true, initialValues: initialValues = {} } = {},
) {
  const v3 = globalThis["window"],
    v4 = { ...initialValues },
    v5 = [];
  return (
    (globalThis["window"] = {
      electronAPI: {
        secureSettings: {
          async get(v6 = {}) {
            v5["push"]({ method: "get", payload: v6 });
            const v7 = Array["isArray"](v6["keys"])
              ? v6["keys"]
              : [v6["key"]]["filter"](Boolean);
            return {
              ok: true,
              available: available,
              values: Object["fromEntries"](
                v7["filter"]((v8) =>
                  Object["prototype"]["hasOwnProperty"]["call"](v4, v8),
                )["map"]((v9) => [v9, v4[v9]]),
              ),
            };
          },
          async set(v10 = {}) {
            v5["push"]({ method: "set", payload: v10 });
            if (!available) return { ok: false, available: available };
            return (
              (v4[v10["key"]] = String(v10["value"] || "")),
              { ok: true, available: available }
            );
          },
          async delete(v11 = {}) {
            v5["push"]({ method: "delete", payload: v11 });
            if (!available) return { ok: false, available: available };
            return (delete v4[v11["key"]], { ok: true, available: available });
          },
        },
      },
    }),
    v2["after"](() => {
      globalThis["window"] = v3;
    }),
    { values: v4, calls: v5 }
  );
}
function installFetchSequence(
  v12,
  { getData: getData = {}, postOk: postOk = true } = {},
) {
  const v13 = globalThis["fetch"],
    v14 = [];
  return (
    (globalThis["fetch"] = async (v15, v16 = {}) => {
      if (String(v15) !== "/api/config")
        throw new Error("unexpected\x20fetch\x20url:\x20" + String(v15));
      const v17 = String(v16["method"] || "GET")["toUpperCase"]();
      if (v17 === "POST")
        return (
          v14["push"](JSON["parse"](String(v16["body"] || "{}"))),
          {
            ok: postOk,
            status: postOk ? 200 : 500,
            headers: { get: () => "application/json" },
            json: async () => ({ success: postOk }),
            text: async () => JSON["stringify"]({ success: postOk }),
          }
        );
      return {
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => getData,
        text: async () => JSON["stringify"](getData),
      };
    }),
    v12["after"](() => {
      globalThis["fetch"] = v13;
    }),
    { posts: v14 }
  );
}
(test("configApi: grsai provider 配置优先于 apiUrlInput/apiKeyInput", async () => {
  const v18 = globalThis["fetch"];
  try {
    mockFetchOnceJson({
      apiUrlInput: "https://api.grsai.example.com///",
      apiKeyInput: "k_grsai",
      providers: {
        grsai: { apiUrl: "https://grsai.example2.com/", apiKey: "k_grsai2" },
      },
    });
    const {
      ensureConfig: v19,
      getProviderConfig: v20,
      clearApiConfig: v21,
    } = await import("./configApi.js");
    (v21(), await v19());
    const v22 = v20("grsai");
    (strict["equal"](v22["apiUrl"], "https://grsai.example2.com"),
      strict["equal"](v22["apiKey"], "k_grsai2"));
  } finally {
    globalThis["fetch"] = v18;
  }
}),
  test(
    "configApi:\x20Electron\x20secureSettings\x20会迁移旧明文\x20API\x20Key\x20并回写去敏配置",
    { concurrency: false },
    async (v23) => {
      const { values: v24 } = installSecureSettingsStub(v23),
        { posts: v25 } = installFetchSequence(v23, {
          getData: {
            apiUrlInput: "https://api.grsai.example.com///",
            apiKeyInput: "legacy-grsai-key",
            providers: {
              runninghub: {
                apiKey: "rh-workflow-key",
                modelApiKey: "rh-model-key",
              },
            },
          },
        }),
        { fetchApiConfigFromServer: v26, clearApiConfig: v27 } =
          await import("./configApi.js");
      v27();
      const v28 = await v26();
      (strict["equal"](v28["providers"]["grsai"]["apiKey"], "legacy-grsai-key"),
        strict["equal"](
          v28["providers"]["runninghub"]["apiKey"],
          "rh-workflow-key",
        ),
        strict["equal"](
          v28["providers"]["runninghub"]["modelApiKey"],
          "rh-model-key",
        ),
        strict["equal"](
          v24["apiConfig.providers.grsai.apiKey"],
          "legacy-grsai-key",
        ),
        strict["equal"](
          v24["apiConfig.providers.runninghub.apiKey"],
          "rh-workflow-key",
        ),
        strict["equal"](
          v24["apiConfig.providers.runninghub.modelApiKey"],
          "rh-model-key",
        ),
        strict["equal"](v25["length"], 1),
        strict["equal"](v25[0]["apiKeyInput"], undefined),
        strict["equal"](v25[0]["providers"]["runninghub"]["apiKey"], undefined),
        strict["equal"](
          v25[0]["providers"]["runninghub"]["modelApiKey"],
          undefined,
        ));
    },
  ),
  test(
    "configApi: Electron secureSettings 保存时只把非敏感配置写入 config.json",
    { concurrency: false },
    async (v29) => {
      const { values: v30 } = installSecureSettingsStub(v29),
        { posts: v31 } = installFetchSequence(v29),
        { saveApiConfigToServer: v32, clearApiConfig: v33 } =
          await import("./configApi.js");
      (v33(),
        await v32({
          providers: {
            apimart: { apiKey: "am-key", apiUrl: "https://api.apimart.ai" },
            runninghub: { apiKey: "rh-key", modelApiKey: "rh-model-key" },
          },
        }),
        strict["equal"](v30["apiConfig.providers.apimart.apiKey"], "am-key"),
        strict["equal"](v30["apiConfig.providers.runninghub.apiKey"], "rh-key"),
        strict["equal"](
          v30["apiConfig.providers.runninghub.modelApiKey"],
          "rh-model-key",
        ),
        strict["equal"](v31["length"], 1),
        strict["deepEqual"](v31[0], {
          providers: {
            apimart: { apiUrl: "https://api.apimart.ai" },
            runninghub: {},
          },
        }));
    },
  ),
  test(
    "configApi: secureSettings 不可用时保持明文配置兼容行为",
    { concurrency: false },
    async (v34) => {
      installSecureSettingsStub(v34, { available: false });
      const { posts: v35 } = installFetchSequence(v34),
        { saveApiConfigToServer: v36, clearApiConfig: v37 } =
          await import("./configApi.js");
      (v37(),
        await v36({ providers: { grsai: { apiKey: "plain-key" } } }),
        strict["deepEqual"](v35, [
          { providers: { grsai: { apiKey: "plain-key" } } },
        ]));
    },
  ),
  test("configApi: grsai 无 provider 配置时使用 apiUrlInput/apiKeyInput", async () => {
    const v38 = globalThis["fetch"];
    try {
      mockFetchOnceJson({
        apiUrlInput: "https://api.grsai.example.com///",
        apiKeyInput: "k_grsai",
        providers: {
          ppio: { apiUrl: "https://ppio.example.com/", apiKey: "k_ppio" },
          runninghub: {
            apiUrl: "https://runninghub.example.com/",
            apiKey: "k_rhwf",
            modelApiKey: "k_rhmodel",
          },
        },
      });
      const {
        ensureConfig: v39,
        getProviderConfig: v40,
        clearApiConfig: v41,
      } = await import("./configApi.js");
      (v41(), await v39());
      const v42 = v40("grsai");
      (strict["equal"](v42["apiUrl"], "https://api.grsai.example.com"),
        strict["equal"](v42["apiKey"], "k_grsai"));
      const v43 = v40("ppio");
      (strict["equal"](v43["apiUrl"], "https://ppio.example.com"),
        strict["equal"](v43["apiKey"], "k_ppio"));
      const v44 = v40("runninghub");
      (strict["equal"](v44["apiKey"], "k_rhwf"),
        strict["equal"](v44["modelApiKey"], "k_rhmodel"));
      const v45 = v40("runninghubwf");
      (strict["equal"](v45["apiKey"], "k_rhwf"),
        strict["equal"](v45["modelApiKey"], ""));
    } finally {
      globalThis["fetch"] = v38;
    }
  }));
