import test from "node:test";
import strict from "node:assert/strict";
function jsonResponse(v0, v1 = 200) {
  return {
    ok: v1 >= 200 && v1 < 300,
    status: v1,
    headers: { get: () => "application/json" },
    json: async () => v0,
    text: async () => JSON["stringify"](v0),
  };
}
(test("providerConnectionTestApi: probes APIMart with models endpoint", async (v2) => {
  const v3 = globalThis["fetch"],
    v4 = [];
  ((globalThis["fetch"] = async (v5, v6 = {}) => {
    v4["push"]({ url: String(v5), options: v6 });
    if (decodeURIComponent(String(v5))["includes"]("/v1/balance"))
      return jsonResponse({
        success: true,
        remain_balance: 100.5,
        used_balance: 25,
        unlimited_quota: false,
      });
    if (String(v5)["endsWith"]("/api/v2/proxy/apimart-upload")) {
      const v7 = Object["fromEntries"](v6["body"]["entries"]());
      return (
        strict["equal"](v7["apiKey"], "am-key"),
        strict["equal"](v7["apiUrl"], "https://api.apimart.ai"),
        jsonResponse({ cdnUrl: "https://upload.apimart.ai/aic-test.png" })
      );
    }
    return jsonResponse({ data: [{ id: "demo" }] });
  }),
    v2["after"](() => {
      globalThis["fetch"] = v3;
    }));
  const { testProviderConnection: v8 } =
      await import("./providerConnectionTestApi.js"),
    v9 = await v8("apimart", {
      apiUrl: "https://api.apimart.ai",
      apiKey: "am-key",
    });
  (strict["equal"](v9["ok"], true),
    strict["equal"](v4["length"], 3),
    strict["equal"](v9["balance"]?.["displayText"], "余额 100.5 美元"),
    strict["equal"](v9["balance"]?.["remaining"], 100.5),
    strict["deepEqual"](
      v9["steps"]["map"]((v10) => v10["id"]),
      ["config", "auth", "model", "balance", "upload"],
    ),
    strict["equal"](v4[0]["options"]["method"], "GET"),
    strict["equal"](
      v4[0]["options"]["headers"]["Authorization"],
      "Bearer am-key",
    ),
    strict["ok"](
      decodeURIComponent(v4[0]["url"])["includes"](
        "/api/v2/proxy/task?apiUrl=https://api.apimart.ai/v1/models",
      ),
    ),
    strict["equal"](
      v9["steps"]["find"]((v11) => v11["id"] === "model")?.["message"],
      "模型列表可访问，未执行额外模型调用",
    ),
    strict["ok"](
      decodeURIComponent(v4[1]["url"])["includes"](
        "/api/v2/proxy/task?apiUrl=https://api.apimart.ai/v1/balance",
      ),
    ));
}),
  test("providerConnectionTestApi:\x20strips\x20APIMart\x20/v1\x20before\x20upload\x20probe", async (v12) => {
    const v13 = globalThis["fetch"];
    ((globalThis["fetch"] = async (v14, v15 = {}) => {
      const v16 = String(v14);
      if (v16["endsWith"]("/api/v2/proxy/apimart-upload")) {
        const v17 = Object["fromEntries"](v15["body"]["entries"]());
        return (
          strict["equal"](v17["apiUrl"], "https://api.apimart.ai"),
          jsonResponse({ url: "https://upload.apimart.ai/aic-test.png" })
        );
      }
      if (decodeURIComponent(v16)["includes"]("/v1/balance"))
        return jsonResponse({ success: true, remain_balance: 1 });
      return jsonResponse({ data: [{ id: "demo" }] });
    }),
      v12["after"](() => {
        globalThis["fetch"] = v13;
      }));
    const { testProviderConnection: v18 } =
        await import("./providerConnectionTestApi.js"),
      v19 = await v18("apimart", {
        apiUrl: "https://api.apimart.ai/v1",
        apiKey: "am-key",
      });
    strict["equal"](v19["ok"], true);
  }),
  test("providerConnectionTestApi: normalizes APIMart unlimited balance payloads", async () => {
    const { normalizeApimartBalancePayload: v20 } =
        await import("./providerConnectionTestApi.js"),
      v21 = v20({
        data: { success: true, unlimited_quota: true, used_balance: "12.75" },
      });
    (strict["equal"](v21["displayText"], "余额 不限"),
      strict["equal"](v21["unlimited"], true),
      strict["equal"](v21["used"], 12.75),
      strict["match"](v21["detailText"], /额度不限/),
      strict["doesNotMatch"](v21["detailText"], /已用余额/));
  }),
  test("providerConnectionTestApi: normalizes RunningHUB account status balances", async () => {
    const { normalizeRunningHubBalancePayload: v22 } =
        await import("./providerConnectionTestApi.js"),
      v23 = v22({
        workflow: {
          code: 0,
          msg: "success",
          data: { remainCoins: "99999", remainMoney: "5", currency: "CNY" },
        },
        model: {
          code: 0,
          msg: "success",
          data: { remainCoins: "12", remainMoney: "999", currency: "CNY" },
        },
      });
    (strict["equal"](
      v23["displayText"],
      "积分\x2099,999\x20·\x20钱包\x20999\x20人民币",
    ),
      strict["equal"](v23["workflowCredits"], 99999),
      strict["equal"](v23["modelWallet"], 999),
      strict["equal"](v23["currencyLabel"], "人民币"),
      strict["match"](v23["detailText"], /工作流积分：99,999/),
      strict["match"](v23["detailText"], /模型钱包：999 人民币/));
  }),
  test("providerConnectionTestApi:\x20normalizes\x20GRSAI\x20API\x20key\x20credits\x20payloads", async () => {
    const { normalizeGrsaiBalancePayload: v24 } =
        await import("./providerConnectionTestApi.js"),
      v25 = v24({ code: 0, data: { credits: "4321.25" } });
    (strict["equal"](v25["displayText"], "积分 4,321.25"),
      strict["equal"](v25["credits"], 4321.25),
      strict["equal"](v25["source"], "account"),
      strict["match"](v25["detailText"], /账户积分：4,321.25/));
    const v26 = v24({ code: 200, data: "8765" }, { source: "apiKey" });
    (strict["equal"](v26["displayText"], "积分 8,765"),
      strict["equal"](v26["source"], "apiKey"));
  }),
  test("providerConnectionTestApi: probes GRSAI with domestic chat completions directly", async (v27) => {
    const v28 = globalThis["fetch"],
      v29 = [];
    ((globalThis["fetch"] = async (v30, v31 = {}) => {
      v29["push"]({ url: String(v30), options: v31 });
      if (String(v30)["endsWith"]("/api/v2/proxy/completions"))
        return jsonResponse({ choices: [{ message: { content: "ok" } }] });
      if (String(v30)["endsWith"]("/client/openapi/getCredits"))
        return jsonResponse({ code: 0, data: { credits: "4321.25" } });
      if (String(v30)["endsWith"]("/client/resource/newUploadTokenZH"))
        return jsonResponse({
          data: {
            token: "qiniu-token",
            key: "aic-test.png",
            url: "https://upload.qiniu.example.com",
            domain: "https://cdn.qiniu.example.com",
          },
        });
      return jsonResponse({ ok: true });
    }),
      v27["after"](() => {
        globalThis["fetch"] = v28;
      }));
    const { testProviderConnection: v32 } =
        await import("./providerConnectionTestApi.js"),
      v33 = await v32("grsai", {
        apiUrl: "https://grsaiapi.com",
        apiKey: "grsai-key",
      });
    (strict["equal"](v33["ok"], true),
      strict["equal"](v29["length"], 4),
      strict["deepEqual"](
        v33["steps"]["map"]((v34) => v34["id"]),
        ["config", "model", "balance", "upload"],
      ),
      strict["equal"](v33["balance"]?.["displayText"], "积分 4,321.25"),
      strict["equal"](v33["balance"]?.["credits"], 4321.25),
      strict["equal"](v33["balance"]?.["source"], "account"),
      strict["equal"](v29[0]["url"], "/api/v2/proxy/completions"));
    const v35 = JSON["parse"](v29[0]["options"]["body"]);
    (strict["equal"](v35["apiUrl"], "https://grsai.dakka.com.cn/v1"),
      strict["equal"](v35["apiKey"], "grsai-key"),
      strict["equal"](v35["model"], "gemini-3.1-pro"),
      strict["equal"](v35["max_tokens"], undefined),
      strict["deepEqual"](v35["messages"], [{ role: "user", content: "你好" }]),
      strict["equal"](
        v29[1]["url"],
        "https://grsai.dakka.com.cn/client/openapi/getCredits",
      ),
      strict["equal"](v29[1]["options"]["method"], "POST"),
      strict["equal"](v29[1]["options"]["headers"]["Authorization"], undefined),
      strict["deepEqual"](JSON["parse"](v29[1]["options"]["body"]), {
        token: "grsai-key",
      }));
  }),
  test("providerConnectionTestApi: GRSAI falls back when API key credits are zero", async (v36) => {
    const v37 = globalThis["fetch"],
      v38 = [];
    ((globalThis["fetch"] = async (v39, v40 = {}) => {
      v38["push"]({ url: String(v39), options: v40 });
      if (String(v39)["endsWith"]("/api/v2/proxy/completions"))
        return jsonResponse({ choices: [{ message: { content: "ok" } }] });
      if (String(v39)["endsWith"]("/client/openapi/getCredits"))
        return jsonResponse({ code: 0, data: { credits: "0" } });
      if (String(v39)["includes"]("/client/common/getCredits?"))
        return jsonResponse({ code: 0, data: { credits: "9876" } });
      if (String(v39)["endsWith"]("/client/resource/newUploadTokenZH"))
        return jsonResponse({
          data: {
            token: "qiniu-token",
            key: "aic-test.png",
            url: "https://upload.qiniu.example.com",
            domain: "https://cdn.qiniu.example.com",
          },
        });
      return jsonResponse({ ok: true });
    }),
      v36["after"](() => {
        globalThis["fetch"] = v37;
      }));
    const { testProviderConnection: v41 } =
        await import("./providerConnectionTestApi.js"),
      v42 = await v41("grsai", {
        apiUrl: "https://grsaiapi.com",
        apiKey: "grsai-key",
      });
    (strict["equal"](v42["ok"], true),
      strict["equal"](v42["balance"]?.["displayText"], "积分 9,876"),
      strict["equal"](v42["balance"]?.["source"], "account"),
      strict["ok"](
        v38[2]["url"]["includes"]("/client/common/getCredits?apikey=grsai-key"),
      ));
  }),
  test("providerConnectionTestApi:\x20PPIO\x20uses\x20official\x20models\x20endpoint\x20without\x20model-specific\x20fallback", async (v43) => {
    const v44 = globalThis["fetch"],
      v45 = [];
    ((globalThis["fetch"] = async (v46, v47 = {}) => {
      return (
        v45["push"]({ url: String(v46), options: v47 }),
        jsonResponse({ data: [{ id: "deepseek/deepseek-v3-0324" }] })
      );
    }),
      v43["after"](() => {
        globalThis["fetch"] = v44;
      }));
    const { testProviderConnection: v48 } =
        await import("./providerConnectionTestApi.js"),
      v49 = await v48("ppio", {
        apiUrl: "https://api.ppio.com",
        apiKey: "Bearer ppio-key",
      });
    (strict["equal"](v49["ok"], true),
      strict["equal"](v45["length"], 1),
      strict["equal"](
        v49["steps"]["find"]((v50) => v50["id"] === "model")?.["skipped"],
        true,
      ),
      strict["equal"](
        v49["steps"]["find"]((v51) => v51["id"] === "upload")?.["skipped"],
        true,
      ),
      strict["equal"](
        v45[0]["options"]["headers"]["Authorization"],
        "Bearer\x20ppio-key",
      ),
      strict["ok"](
        decodeURIComponent(v45[0]["url"])["includes"](
          "/api/v2/proxy/task?apiUrl=https://api.ppio.com/openai/v1/models",
        ),
      ));
  }),
  test("providerConnectionTestApi: volcengine uses Ark ping endpoint", async (v52) => {
    const v53 = globalThis["fetch"],
      v54 = [];
    ((globalThis["fetch"] = async (v55, v56 = {}) => {
      return (
        v54["push"]({ url: String(v55), options: v56 }),
        jsonResponse("pong")
      );
    }),
      v52["after"](() => {
        globalThis["fetch"] = v53;
      }));
    const { testProviderConnection: v57 } =
        await import("./providerConnectionTestApi.js"),
      v58 = await v57("volcengine", {
        apiUrl: "https://ark.cn-beijing.volces.com/api/v3",
        apiKey: "ark-key",
      });
    (strict["equal"](v58["ok"], true),
      strict["equal"](v54["length"], 1),
      strict["deepEqual"](
        v58["steps"]["map"]((v59) => v59["id"]),
        ["config", "auth", "upload"],
      ),
      strict["equal"](v54[0]["options"]["method"], "GET"),
      strict["equal"](
        v54[0]["options"]["headers"]["Authorization"],
        "Bearer\x20ark-key",
      ),
      strict["ok"](
        decodeURIComponent(v54[0]["url"])["includes"](
          "/api/v2/proxy/task?apiUrl=https://ark.cn-beijing.volces.com/ping",
        ),
      ));
  }),
  test("providerConnectionTestApi:\x20runninghub\x20treats\x20invalid\x20task\x20response\x20as\x20credential\x20pass", async (v60) => {
    const v61 = globalThis["fetch"],
      v62 = [];
    ((globalThis["fetch"] = async (v63, v64 = {}) => {
      v62["push"]({ url: String(v63), options: v64 });
      if (String(v63) === "/api/v2/proxy/image") {
        const v65 = JSON["parse"](String(v64["body"] || "{}"));
        if (
          String(v65["apiUrl"] || "")["endsWith"]("/uc/openapi/accountStatus")
        )
          return jsonResponse({
            code: 0,
            msg: "success",
            data: { remainCoins: "12345", remainMoney: "0", currency: "CNY" },
          });
      }
      if (String(v63)["startsWith"]("/api/v2/proxy/upload?"))
        return jsonResponse({
          code: 0,
          data: { download_url: "https://www.runninghub.cn/aic-test.png" },
        });
      return jsonResponse({ code: 804, message: "task\x20not\x20found" });
    }),
      v60["after"](() => {
        globalThis["fetch"] = v61;
      }));
    const { testProviderConnection: v66 } =
        await import("./providerConnectionTestApi.js"),
      v67 = await v66("runninghub", { apiKey: "rh-workflow-key" });
    (strict["equal"](v67["ok"], true),
      strict["equal"](v62["length"], 2),
      strict["equal"](v67["balance"]?.["displayText"], "积分 12,345"),
      strict["equal"](v67["balance"]?.["workflowCredits"], 12345),
      strict["equal"](v62[0]["url"], "/api/v2/runninghubwf/query"),
      strict["deepEqual"](JSON["parse"](v62[0]["options"]["body"]), {
        apiKey: "rh-workflow-key",
        taskId: "aic-connection-test",
      }),
      strict["equal"](
        v67["steps"]["find"]((v68) => v68["id"] === "upload")?.["skipped"],
        true,
      ));
  }),
  test("providerConnectionTestApi: runninghub upload probe uses modelApiKey", async (v69) => {
    const v70 = globalThis["fetch"],
      v71 = [];
    ((globalThis["fetch"] = async (v72, v73 = {}) => {
      v71["push"]({ url: String(v72), options: v73 });
      if (String(v72) === "/api/v2/proxy/image") {
        const v74 = JSON["parse"](String(v73["body"] || "{}"));
        if (
          String(v74["apiUrl"] || "")["endsWith"]("/uc/openapi/accountStatus")
        )
          return jsonResponse({
            code: 0,
            msg: "success",
            data: {
              remainCoins: v74["apikey"] === "rh-workflow-key" ? "54321" : "0",
              remainMoney: v74["apikey"] === "rh-model-key" ? "888.5" : "0",
              currency: "CNY",
            },
          });
      }
      if (String(v72)["startsWith"]("/api/v2/proxy/upload?"))
        return jsonResponse({
          code: 0,
          data: { download_url: "https://www.runninghub.cn/aic-test.png" },
        });
      return jsonResponse({ code: 804, message: "task not found" });
    }),
      v69["after"](() => {
        globalThis["fetch"] = v70;
      }));
    const { testProviderConnection: v75 } =
        await import("./providerConnectionTestApi.js"),
      v76 = await v75("runninghub", {
        apiKey: "rh-workflow-key",
        modelApiKey: "rh-model-key",
      });
    (strict["equal"](v76["ok"], true),
      strict["equal"](v71["length"], 5),
      strict["equal"](
        v76["balance"]?.["displayText"],
        "积分\x2054,321\x20·\x20钱包\x20888.5\x20人民币",
      ));
    const v77 = v71["find"](
        (v78) => v78["url"] === "/api/v2/runninghubwf/query",
      ),
      v79 = v71["find"]((v80) => {
        if (v80["url"] !== "/api/v2/proxy/image") return false;
        const v81 = JSON["parse"](String(v80["options"]["body"] || "{}"));
        return String(v81["apiUrl"] || "")["endsWith"]("/openapi/v2/query");
      }),
      v82 = v71["filter"]((v83) => {
        if (v83["url"] !== "/api/v2/proxy/image") return false;
        const v84 = JSON["parse"](String(v83["options"]["body"] || "{}"));
        return String(v84["apiUrl"] || "")["endsWith"](
          "/uc/openapi/accountStatus",
        );
      }),
      v85 = v71["find"]((v86) =>
        v86["url"]["startsWith"]("/api/v2/proxy/upload?"),
      );
    (strict["deepEqual"](JSON["parse"](v77["options"]["body"]), {
      apiKey: "rh-workflow-key",
      taskId: "aic-connection-test",
    }),
      strict["equal"](
        JSON["parse"](v79["options"]["body"])["apiKey"],
        "rh-model-key",
      ),
      strict["deepEqual"](
        v82["map"](
          (v87) =>
            JSON["parse"](String(v87["options"]["body"] || "{}"))["apikey"],
        ),
        ["rh-workflow-key", "rh-model-key"],
      ),
      strict["equal"](
        v85["options"]["headers"]["Authorization"],
        "Bearer\x20rh-model-key",
      ));
  }),
  test("providerConnectionTestApi: missing provider key fails before fetch", async (v88) => {
    const v89 = globalThis["fetch"];
    ((globalThis["fetch"] = async () => {
      throw new Error("fetch should not be called");
    }),
      v88["after"](() => {
        globalThis["fetch"] = v89;
      }));
    const { testProviderConnection: v90 } =
        await import("./providerConnectionTestApi.js"),
      v91 = await v90("openai", {
        apiUrl: "https://api.openai.com",
        apiKey: "",
      });
    (strict["equal"](v91["ok"], false),
      strict["match"](v91["error"], /API Key/));
  }),
  test("providerConnectionTestApi: explains auth failures in human language", async (v92) => {
    const v93 = globalThis["fetch"];
    ((globalThis["fetch"] = async () =>
      jsonResponse({ error: "invalid api key" }, 401)),
      v92["after"](() => {
        globalThis["fetch"] = v93;
      }));
    const { testProviderConnection: v94 } =
        await import("./providerConnectionTestApi.js"),
      v95 = await v94("openai", {
        apiUrl: "https://api.openai.com",
        apiKey: "bad-key",
      });
    (strict["equal"](v95["ok"], false),
      strict["equal"](v95["category"], "auth_failed"),
      strict["match"](v95["suggestion"], /API Key/));
  }),
  test("providerConnectionTestApi: reports upload chain separately", async (v96) => {
    const v97 = globalThis["fetch"],
      v98 = [];
    ((globalThis["fetch"] = async (v99, v100 = {}) => {
      v98["push"]({ url: String(v99), options: v100 });
      if (String(v99)["includes"]("/proxy/task?"))
        return jsonResponse({ data: [{ id: "demo" }] });
      if (String(v99)["endsWith"]("/api/v2/proxy/completions"))
        return jsonResponse({ choices: [{ message: { content: "ok" } }] });
      return jsonResponse({ error: "upload service unavailable" }, 500);
    }),
      v96["after"](() => {
        globalThis["fetch"] = v97;
      }));
    const { testProviderConnection: v101 } =
        await import("./providerConnectionTestApi.js"),
      v102 = await v101("apimart", {
        apiUrl: "https://api.apimart.ai",
        apiKey: "am-key",
      });
    (strict["equal"](v102["ok"], false),
      strict["equal"](v102["partial"], true),
      strict["equal"](v102["category"], "upload_failed"),
      strict["equal"](
        v102["steps"]["find"]((v103) => v103["id"] === "upload")?.["ok"],
        false,
      ),
      strict["match"](v102["suggestion"], /上传链路/),
      strict["equal"](v98["length"], 4));
  }));
