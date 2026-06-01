import { ensureConfig, getProviderConfig } from "./configApi.js";
import { processInputAudiosPreserveOrder } from "./audioUploadApi.js";
import { cancelRunningHubTask } from "./runninghubTaskApi.js";
import { requester } from "./requester.js";
import { runTaskSingleFlight } from "./taskSingleFlight.js";
import { formatRunningHubFailureMessage } from "./errors/parsers/RunningHubErrorParser.js";
import {
  RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
  RH_AUDIO_SEPARATION_MODEL_ID as RH_AUDIO_SEPARATION_MODEL_ID,
  resolveModelExecution,
} from "../src/manifests/index.js";
const POLL_MAX_COUNT = 450,
  POLL_INTERVAL_MS = 2000;
export async function cancelRunningHubAudioTask({
  apiKey: v0,
  taskId: v1,
} = {}) {
  return cancelRunningHubTask({ apiKey: v0, taskId: v1 });
}
function getAudioSeparationExecutionManifest() {
  const v2 = resolveModelExecution(RH_AUDIO_SEPARATION_MODEL_ID)?.[
    "executionManifest"
  ];
  if (!v2)
    throw new Error(
      "RunningHub audio workflow manifest missing: " +
        RH_AUDIO_SEPARATION_MODEL_ID,
    );
  return v2;
}
function getAudioSeparationResultNodeIds() {
  const v3 =
      getAudioSeparationExecutionManifest()?.["mapping"]?.["resultNodes"] || {},
    v4 = String(v3["vocals"] || "")["trim"](),
    v5 = String(v3["background"] || "")["trim"]();
  if (!v4 || !v5)
    throw new Error(
      "RunningHub audio workflow manifest missing result nodes: " +
        RH_AUDIO_SEPARATION_MODEL_ID,
    );
  return { vocals: v4, background: v5 };
}
function sleep(v6) {
  return new Promise((v7) => setTimeout(v7, v6));
}
function normalizeRhInstanceType(v8) {
  return String(v8 || "default")["trim"]() === "plus" ? "plus" : "default";
}
function normalizeTextList(v9) {
  if (!Array["isArray"](v9)) return [];
  return v9["map"]((v10) => String(v10 || "")["trim"]())["filter"](Boolean);
}
function normalizeRefList(v11) {
  if (!Array["isArray"](v11)) return [];
  return v11["map"]((v12) => {
    if (!v12 || typeof v12 !== "object") return null;
    const v13 = String(v12["url"] || "")["trim"]();
    if (!v13) return null;
    return {
      edgeId: v12["edgeId"] ? String(v12["edgeId"]) : "",
      sourceId: v12["sourceId"] ? String(v12["sourceId"]) : "",
      sourceType: v12["sourceType"] ? String(v12["sourceType"]) : "",
      refSlot: v12["refSlot"] ? String(v12["refSlot"]) : "",
      url: v13,
    };
  })["filter"](Boolean);
}
function parseResponseData(v14) {
  if (!v14) return {};
  if (typeof v14 === "object") return v14;
  const v15 = String(v14 || "")["trim"]();
  if (!v15) return {};
  try {
    return JSON["parse"](v15);
  } catch {}
  const v16 = v15["split"]("\x0a")["filter"]((v17) =>
    v17["trim"]()["startsWith"]("data:"),
  );
  if (v16["length"] > 0) {
    const v18 = v16[v16["length"] - 1]["replace"](/^data:\s*/, "");
    try {
      return JSON["parse"](v18);
    } catch {}
  }
  throw new Error("无法解析 RunningHub 音频接口响应");
}
function getTaskId(v19) {
  return String(
    v19?.["taskId"] ||
      v19?.["task_id"] ||
      v19?.["data"]?.["taskId"] ||
      v19?.["data"]?.["task_id"] ||
      v19?.["data"]?.["id"] ||
      v19?.["id"] ||
      "",
  )["trim"]();
}
function getApiErrorMessage(v20, v21 = "音频生成失败") {
  return formatRunningHubFailureMessage(
    v20,
    v20?.["message"] ||
      v20?.["error"] ||
      v20?.["msg"] ||
      v20?.["data"]?.["message"] ||
      v20?.["data"]?.["error"] ||
      v21,
  );
}
function isLikelyAudioUrl(v22) {
  const v23 = String(v22 || "")["trim"]();
  if (!v23) return false;
  if (!/^https?:\/\//i["test"](v23) && !v23["startsWith"]("/")) return false;
  return /\.(wav|mp3|m4a|flac|aac|ogg|opus|wma|amr|aif|aiff|caf|webm)(\?|#|$)/i[
    "test"
  ](v23);
}
function extractAudioResultEntries(v24) {
  const v25 = [],
    v26 = new WeakSet(),
    v27 = [
      "audioUrl",
      "audio_url",
      "url",
      "fileUrl",
      "download_url",
      "output",
      "mediaUrl",
    ],
    v28 = (v29, v30 = "") => {
      if (v29 == null) return;
      if (Array["isArray"](v29)) {
        v29["forEach"]((v31) => v28(v31, v30));
        return;
      }
      if (typeof v29 === "object") {
        v32(v29, v30);
        return;
      }
      const v33 = String(v29 || "")["trim"]();
      if (!v33) return;
      v25["push"]({ nodeId: String(v30 || "")["trim"](), audioUrl: v33 });
    },
    v32 = (v34, v35 = "") => {
      if (v34 == null) return;
      if (Array["isArray"](v34)) {
        v34["forEach"]((v36) => v32(v36, v35));
        return;
      }
      if (typeof v34 !== "object") return;
      if (v26["has"](v34)) return;
      v26["add"](v34);
      const v37 = String(v34["nodeId"] || v34["node_id"] || v35 || "")[
        "trim"
      ]();
      (v27["forEach"]((v38) => {
        Object["prototype"]["hasOwnProperty"]["call"](v34, v38) &&
          v28(v34[v38], v37);
      }),
        Object["entries"](v34)["forEach"](([v39, v40]) => {
          if (v39 === "nodeId" || v39 === "node_id" || v27["includes"](v39))
            return;
          v40 && typeof v40 === "object" && v32(v40, v37);
        }));
    };
  v32(v24);
  const v41 = [],
    v42 = new Set();
  for (const v43 of v25) {
    const v44 = String(v43?.["nodeId"] || "")["trim"](),
      v45 = String(v43?.["audioUrl"] || "")["trim"]();
    if (!v45) continue;
    const v46 = v44 + "::" + v45;
    if (v42["has"](v46)) continue;
    (v42["add"](v46), v41["push"]({ nodeId: v44, audioUrl: v45 }));
  }
  const v47 = v41["filter"]((v48) => isLikelyAudioUrl(v48["audioUrl"]));
  return v47["length"] ? v47 : v41;
}
function extractAudioUrls(v49) {
  return extractAudioResultEntries(v49)["map"]((v50) => v50["audioUrl"]);
}
function normalizeAudioTaskResult(v51, v52, v53 = 1) {
  const v54 = Array["isArray"](v51)
    ? v51["map"]((v55) => String(v55 || "")["trim"]())["filter"](Boolean)
    : [];
  if (v54["length"] < Math["max"](1, Number(v53) || 1))
    throw new Error(String(v52 || "任务已完成，但未提取到音频地址"));
  return {
    audioUrl: v54[0],
    isBatch: v54["length"] > 1,
    audios: v54["map"]((v56) => ({ audioUrl: v56 })),
  };
}
function normalizeAudioSeparationTaskResult(v57, v58) {
  const v59 = getAudioSeparationResultNodeIds(),
    v60 = Array["isArray"](v57)
      ? v57["map"]((v61) => ({
          nodeId: String(v61?.["nodeId"] || "")["trim"](),
          audioUrl: String(v61?.["audioUrl"] || "")["trim"](),
        }))["filter"]((v62) => !!v62["audioUrl"])
      : [],
    v63 = v60["some"](
      (v64) =>
        v64["nodeId"] === v59["vocals"] || v64["nodeId"] === v59["background"],
    );
  let v65 = v60;
  if (v63) {
    const v66 = v60["find"]((v67) => v67["nodeId"] === v59["vocals"]) || null,
      v68 = v60["find"]((v69) => v69["nodeId"] === v59["background"]) || null;
    if (!v66 || !v68)
      throw new Error(
        String(v58 || "任务已完成，但未提取到人声和背景声音频地址"),
      );
    v65 = [
      { ...v66, role: "vocals" },
      { ...v68, role: "background" },
    ];
  } else
    v65 = v60["slice"](0, 2)["map"]((v70, v71) => ({
      ...v70,
      role: v71 === 0 ? "vocals" : "background",
    }));
  if (v65["length"] < 2)
    throw new Error(
      String(v58 || "任务已完成，但未提取到人声和背景声音频地址"),
    );
  return {
    audioUrl: v65[0]["audioUrl"],
    isBatch: true,
    vocalsAudioUrl: v65[0]["audioUrl"],
    backgroundAudioUrl: v65[1]["audioUrl"],
    audios: v65["map"]((v72) => ({
      audioUrl: v72["audioUrl"],
      nodeId: v72["nodeId"],
      role: v72["role"],
    })),
  };
}
function normalizeAdvancedVoiceClonePrompt(v73) {
  return String(v73 || "")
    ["trim"]()
    ["replace"](/(^|\s+)@?音频1\s*[:：]?\s*/g, "$1[speaker_1]: ")
    ["replace"](/(^|\s+)@?音频2\s*[:：]?\s*/g, "$1[speaker_2]:\x20")
    ["replace"](/\s+(\[speaker_[12]\]:)/g, "\n$1")
    ["trim"]();
}
function getMappingNode(v74, v75, v76) {
  const v77 = v74?.[v75],
    v78 = String(v77?.["nodeId"] || "")["trim"](),
    v79 = String(v77?.["fieldName"] || "")["trim"]();
  if (!v78 || !v79)
    throw new Error(
      "音频工作流\x20manifest\x20缺少\x20" + v76 + "\x20节点映射",
    );
  return { nodeId: v78, fieldName: v79 };
}
function createNodeInfo(v80, v81, v82 = "") {
  return {
    nodeId: v80["nodeId"],
    fieldName: v80["fieldName"],
    fieldValue: v81,
    ...(v82 ? { description: v82 } : {}),
  };
}
function buildNodeInfoList(v83, v84, v85) {
  const v86 = v83?.["mapping"] || {},
    v87 = String(v86?.["preset"] || "")["trim"]();
  if (v87 === "rh-audio-indextts2-clone") {
    const v88 =
      v84["find"]((v89) => String(v89?.["refSlot"] || "") === "audioRef") ||
      null;
    if (!v88?.["url"]) throw new Error("indextts2音色克隆需要参考音色");
    if (!v85) throw new Error("indextts2音色克隆需要提示词内容");
    const v90 = getMappingNode(v86, "refAudioNode", "参考音色"),
      v91 = getMappingNode(v86, "promptNode", "提示词");
    return [createNodeInfo(v90, v88["url"]), createNodeInfo(v91, v85)];
  }
  if (v87 === "rh-audio-voice-convert") {
    const v92 = new Map(
        v84["map"]((v93) => [String(v93["refSlot"] || ""), v93]),
      ),
      v94 = v92["get"]("audioRef") || null,
      v95 = v92["get"]("audioTarget") || null;
    if (!v94?.["url"] || !v95?.["url"])
      throw new Error("音色转换需要参考音色和目标音色");
    const v96 = getMappingNode(v86, "refAudioNode", "参考音色"),
      v97 = getMappingNode(v86, "targetAudioNode", "目标音色");
    return [createNodeInfo(v96, v94["url"]), createNodeInfo(v97, v95["url"])];
  }
  if (v87 === "rh-audio-advanced-voice-clone") {
    const v98 = new Map(
        v84["map"]((v99) => [String(v99["refSlot"] || ""), v99]),
      ),
      v100 = v98["get"]("audio1") || null,
      v101 = v98["get"]("audio2") || null;
    if (!v85) throw new Error("进阶声音克隆需要提示词内容");
    const v102 = getMappingNode(v86, "audio1Node", "音频1"),
      v103 = getMappingNode(v86, "audio2Node", "音频2"),
      v104 = getMappingNode(v86, "promptNode", "提示词"),
      v105 = getMappingNode(v86, "indexNode", "音频数量"),
      v106 = [];
    return (
      v100?.["url"] && v106["push"](createNodeInfo(v102, v100["url"], "audio")),
      v101?.["url"] && v106["push"](createNodeInfo(v103, v101["url"], "audio")),
      v106["push"](
        createNodeInfo(v104, normalizeAdvancedVoiceClonePrompt(v85), "prompt"),
        createNodeInfo(
          v105,
          String([v100?.["url"], v101?.["url"]]["filter"](Boolean)["length"]),
          "index",
        ),
      ),
      v106
    );
  }
  throw new Error("未选择可用的音频工作流");
}
export async function buildGenerateAudioRequest(v107) {
  await ensureConfig();
  const v108 = String(v107?.["provider"] || "runninghubwf")["trim"](),
    v109 = String(v107?.["audioWorkflowKey"] || "")["trim"](),
    v110 = resolveModelExecution(v109),
    v111 = String(v110?.["executionManifest"]?.["appId"] || "")["trim"]();
  if (!v110 || !v111) throw new Error("未选择可用的音频工作流");
  const v112 = getProviderConfig("runninghubwf"),
    v113 = String(v107?.["apiKey"] || v112?.["apiKey"] || "")["trim"]();
  if (!v113) throw new Error("RunningHub API Key 未配置");
  const v114 = normalizeTextList(v107?.["textInputs"]),
    v115 = String(v107?.["prompt"] || "")["trim"](),
    v116 = v115 || v114["join"]("\x0a")["trim"](),
    v117 = normalizeRhInstanceType(v107?.["rhInstanceType"]),
    v118 = normalizeRefList(v107?.["audioRefs"]),
    v119 = normalizeRefList(v107?.["videoRefs"]),
    v120 = await processInputAudiosPreserveOrder(
      v118["map"]((v121) => v121["url"]),
      v113,
    ),
    v122 = v118["map"]((v123, v124) => ({
      ...v123,
      url: String(v120[v124] || "")["trim"](),
    }))["filter"]((v125) => !!v125["url"]),
    v126 = buildNodeInfoList(v110["executionManifest"], v122, v116),
    v127 = String(v107?.["installId"] || "")["trim"]();
  return {
    url: "/api/v2/proxy/image",
    headers: {
      "Content-Type": "application/json",
      ...(v127 ? { "X-AIC-Install-Id": v127 } : {}),
    },
    body: {
      apiUrl: "https://www.runninghub.cn/openapi/v2/run/ai-app/" + v111,
      apiKey: v113,
      nodeInfoList: v126,
      instanceType: v117,
      usePersonalQueue: "false",
    },
    meta: {
      provider: v108,
      audioWorkflowKey: v109,
      audioWorkflowLabel: String(v107?.["audioWorkflowLabel"] || "")["trim"](),
      model:
        v109 === RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID
          ? v110["modelManifest"]["modelId"]
          : v109,
      executionId: v110["executionManifest"]["id"],
      nodeId: String(v107?.["nodeId"] || "")["trim"](),
      installId: v127,
      rhInstanceType: v117,
      prompt: v116,
      textInputs: v114,
      audioRefs: v118,
      videoRefs: v119,
    },
  };
}
export async function buildAudioSeparationRequest(v128 = {}) {
  await ensureConfig();
  const v129 = RH_AUDIO_SEPARATION_MODEL_ID,
    v130 = getAudioSeparationExecutionManifest(),
    v131 = String(v130?.["appId"] || "")["trim"](),
    v132 = v130?.["mapping"]?.["sourceAudioNode"];
  if (!v131 || !v132?.["nodeId"] || !v132?.["fieldName"])
    throw new Error("RunningHub audio workflow manifest missing: " + v129);
  const v133 = getProviderConfig("runninghubwf"),
    v134 = String(v128?.["apiKey"] || v133?.["apiKey"] || "")["trim"]();
  if (!v134) throw new Error("RunningHub\x20API\x20Key\x20未配置");
  const v135 = String(
    v128?.["audioUrl"] || v128?.["src"] || v128?.["url"] || "",
  )["trim"]();
  if (!v135) throw new Error("人声分离需要可用音频");
  const v136 = await processInputAudiosPreserveOrder([v135], v134),
    v137 = String(v136?.[0] || "")["trim"]();
  if (!v137) throw new Error("人声分离音频上传失败");
  const v138 = normalizeRhInstanceType(v128?.["rhInstanceType"]);
  return {
    url: "/api/v2/proxy/image",
    headers: { "Content-Type": "application/json" },
    body: {
      apiUrl: "https://www.runninghub.cn/openapi/v2/run/ai-app/" + v131,
      apiKey: v134,
      nodeInfoList: [
        {
          nodeId: v132["nodeId"],
          fieldName: v132["fieldName"],
          fieldValue: v137,
          description: "audio",
        },
      ],
      instanceType: v138,
      usePersonalQueue: "false",
    },
    meta: {
      provider: "runninghubwf",
      model: v129,
      executionId: v130["id"],
      adapterTrace: {
        source: "manifest",
        executionId: v130["id"],
        modelId: v129,
      },
      nodeId: String(v128?.["nodeId"] || "")["trim"](),
      rhInstanceType: v138,
      sourceAudioUrl: v135,
      uploadedAudioUrl: v137,
    },
  };
}
async function pollRunningHubAudioTask(v139, v140, v141 = {}) {
  if (v141?.["signal"]?.["aborted"]) throw new Error("CANCELLED");
  for (let v142 = 0; v142 < POLL_MAX_COUNT; v142++) {
    if (v141?.["signal"]?.["aborted"]) throw new Error("CANCELLED");
    await sleep(POLL_INTERVAL_MS);
    if (v141?.["signal"]?.["aborted"]) throw new Error("CANCELLED");
    const v143 = await requester({
        url: "/api/v2/proxy/image",
        method: "POST",
        provider: "runninghubwf",
        timeout: 30000,
        signal: v141?.["signal"],
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({
          apiUrl: "https://www.runninghub.cn/openapi/v2/query",
          apiKey: v140,
          taskId: v139,
        }),
        responseType: "auto",
      }),
      v144 = parseResponseData(v143),
      v145 = Number(v144?.["code"]);
    if (Number["isFinite"](v145)) {
      if (v145 === 804 || v145 === 813) continue;
      if (v145 !== 0)
        throw new Error(getApiErrorMessage(v144, "音频任务轮询失败"));
    }
    const v146 =
        v144?.["data"] && typeof v144["data"] === "object"
          ? v144["data"]
          : v144,
      v147 = String(v146?.["status"] || "")["toUpperCase"]();
    if (["COMPLETED", "SUCCEEDED", "SUCCESS"]["includes"](v147)) {
      if (extractAudioUrls(v146)["length"] === 0) continue;
      return v146;
    }
    if (["FAILED", "FAIL", "ERROR", "CANCELLED"]["includes"](v147))
      throw new Error(getApiErrorMessage(v146, "音频任务执行失败"));
  }
  throw new Error("音频任务超时，请稍后重试");
}
export async function resumeAudioSeparationTask(v148, v149 = {}, v150 = {}) {
  await ensureConfig();
  const v151 = getProviderConfig("runninghubwf"),
    v152 = String(v149?.["apiKey"] || v151?.["apiKey"] || "")["trim"]();
  if (!v152) throw new Error("RunningHub API Key 未配置");
  const v153 = String(v148 || "")["trim"]();
  if (!v153) throw new Error("缺少 RunningHub 音频任务ID");
  return runTaskSingleFlight(
    { provider: "runninghubwf", kind: "audio-separation", taskId: v153 },
    async () => {
      const v154 = await pollRunningHubAudioTask(v153, v152, v150);
      return {
        taskId: v153,
        ...normalizeAudioSeparationTaskResult(
          extractAudioResultEntries(v154),
          "任务已完成，但未提取到人声和背景声音频地址",
        ),
      };
    },
  );
}
export async function resumeRunningHubAudioTask(v155, v156 = {}, v157 = {}) {
  await ensureConfig();
  const v158 = getProviderConfig("runninghubwf"),
    v159 = String(v156?.["apiKey"] || v158?.["apiKey"] || "")["trim"]();
  if (!v159) throw new Error("RunningHub API Key 未配置");
  const v160 = String(v155 || "")["trim"]();
  if (!v160) throw new Error("缺少 RunningHub 音频任务ID");
  return runTaskSingleFlight(
    { provider: "runninghubwf", kind: "audio", taskId: v160 },
    async () => {
      const v161 = await pollRunningHubAudioTask(v160, v159, v157);
      return {
        taskId: v160,
        ...normalizeAudioTaskResult(
          extractAudioUrls(v161),
          "任务已完成，但未提取到音频地址",
        ),
      };
    },
  );
}
export async function runAudioSeparation(v162 = {}, v163 = {}) {
  const v164 = await buildAudioSeparationRequest(v162),
    v165 = await requester({
      url: v164["url"],
      method: "POST",
      provider: "runninghubwf",
      timeout: 120000,
      signal: v163?.["signal"],
      headers: v164["headers"] || { "Content-Type": "application/json" },
      body: JSON["stringify"](v164["body"]),
      responseType: "auto",
    }),
    v166 = parseResponseData(v165),
    v167 = Number(v166?.["code"]);
  if (Number["isFinite"](v167) && v167 !== 0)
    throw new Error(getApiErrorMessage(v166, "音频任务创建失败"));
  const v168 = getTaskId(v166);
  if (!v168)
    return normalizeAudioSeparationTaskResult(
      extractAudioResultEntries(v166),
      "音频任务创建成功但未返回人声和背景声音频地址",
    );
  (v163?.["onTaskMeta"]?.({
    taskId: String(v168),
    useOpenapiQuery: true,
    apiKey: String(v164?.["body"]?.["apiKey"] || "")["trim"](),
  }),
    v163?.["onTaskId"]?.(String(v168)));
  const v169 = await pollRunningHubAudioTask(
    v168,
    v164["body"]["apiKey"],
    v163,
  );
  return {
    taskId: v168,
    ...normalizeAudioSeparationTaskResult(
      extractAudioResultEntries(v169),
      "任务已完成，但未提取到人声和背景声音频地址",
    ),
  };
}
export async function generateAudio(v170, v171 = {}) {
  const v172 = await buildGenerateAudioRequest(v170),
    v173 = await requester({
      url: v172["url"],
      method: "POST",
      provider: "runninghubwf",
      timeout: 120000,
      signal: v171?.["signal"],
      headers: v172["headers"] || { "Content-Type": "application/json" },
      body: JSON["stringify"](v172["body"]),
      responseType: "auto",
    }),
    v174 = parseResponseData(v173);
  if (String(v174?.["code"] || "") === "SUBSCRIPTION_REQUIRED") {
    const v175 = new Error(
      v174?.["message"] || "该模型为 VIP，请先激活 CDKEY/订阅",
    );
    ((v175["code"] = "SUBSCRIPTION_REQUIRED"),
      (v175["contactText"] = v174?.["contactText"] || ""),
      (v175["contactUrl"] = v174?.["contactUrl"] || ""),
      (v175["requiredModelId"] = String(v174?.["requiredModelId"] || "")[
        "trim"
      ]()),
      (v175["subscriptionStatus"] = String(v174?.["subscriptionStatus"] || "")[
        "trim"
      ]()),
      (v175["reasonCode"] = String(v174?.["reasonCode"] || "")["trim"]()));
    throw v175;
  }
  const v176 = Number(v174?.["code"]);
  if (Number["isFinite"](v176) && v176 !== 0)
    throw new Error(getApiErrorMessage(v174, "音频任务创建失败"));
  const v177 = getTaskId(v174);
  if (!v177)
    return normalizeAudioTaskResult(
      extractAudioUrls(v174),
      "音频任务创建成功但未返回\x20taskId",
    );
  (v171?.["onTaskMeta"]?.({
    taskId: String(v177),
    useOpenapiQuery: true,
    apiKey: String(v172?.["body"]?.["apiKey"] || "")["trim"](),
  }),
    v171?.["onTaskId"]?.(String(v177)));
  const v178 = await pollRunningHubAudioTask(
    v177,
    v172["body"]["apiKey"],
    v171,
  );
  return {
    taskId: v177,
    ...normalizeAudioTaskResult(
      extractAudioUrls(v178),
      "任务已完成，但未提取到音频地址",
    ),
  };
}
