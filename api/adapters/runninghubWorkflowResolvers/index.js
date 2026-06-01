const RUNNINGHUB_WORKFLOW_PAYLOAD_RESOLVERS = Object["freeze"]({
  runninghubVideoV54: resolveRunningHubVideoV54Payload,
  runninghubVideoMatting: resolveRunningHubVideoMattingPayload,
});
export function getRunningHubWorkflowPayloadResolver(v0) {
  const v1 = String(v0 || "")["trim"]();
  return RUNNINGHUB_WORKFLOW_PAYLOAD_RESOLVERS[v1] || null;
}
async function resolveRunningHubVideoV54Payload({
  executionManifest: v2,
  payload: v3,
  finalPrompt: v4,
  apiKey: v5,
  ctx: v6,
  helpers: v7,
}) {
  const v8 = v2["mapping"] || {},
    v9 = [],
    {
      buildOpenApiVideoWorkflowRequest: v10,
      getMappedValue: v11,
      normalizeRhVideoResolution: v12,
      pushManifestNode: v13,
      resolveRunningHubFirstImageInput: v14,
      resolveRunningHubOptionalVideoInput: v15,
      resolveRunningHubVideoInput: v16,
      sourceVideoMissingMessage: v17,
      sourceVideoUploadFailedMessage: v18,
    } = v7,
    v19 = String(v4 || "")["trim"]() || "4K，高质量";
  (v13(v9, v8["promptNode"], v19),
    v13(
      v9,
      v8["characterIntegrationNode"],
      v3["characterIntegration"] === true ? "true" : "false",
    ));
  const v20 = String(v3["controlMode"] || "")["trim"](),
    v21 = v11(v20, v8["controlModeNode"], "0");
  (v13(v9, v8["controlModeNode"], v21),
    v13(v9, v8["resolutionNode"], v12(v3["rhVideoResolution"])));
  const v22 = Number(v3["frameRate"] ?? v3["rhVideoFps"]),
    v23 = Number["isFinite"](v22) ? Math["trunc"](v22) : 24;
  v13(v9, v8["fpsNode"], v23);
  const v24 = Number(v3["frameCount"] ?? v3["rhVideoFrames"]),
    v25 = Number["isFinite"](v24) ? Math["max"](0, Math["trunc"](v24)) : 77;
  v13(v9, v8["sourceVideoNode"], v25, {
    fieldName: v8["sourceVideoNode"]?.["frameCountFieldName"],
  });
  const v26 = await v16(v3, v5, {
    missingMessage: v17,
    uploadFailedMessage: v18,
  });
  v13(v9, v8["sourceVideoNode"], v26);
  const v27 = await v14(v3, v5, v6);
  v27 && v13(v9, v8["refImageNode"], v27);
  const v28 = await v15(v3, v5, "maskVideoUrl");
  v28 && v13(v9, v8["maskVideoNode"], v28);
  const v29 = await v14(v3, v5, v6, { field: "firstFrameUrl" });
  v29 &&
    (v13(v9, v8["firstFrameNode"], v29),
    v13(
      v9,
      v8["firstFrameEnabledNode"],
      v8["firstFrameEnabledNode"]?.["value"] ?? "1",
    ));
  const v30 = String(v3["specialMode"] || v3["rhSpecialMode"] || ""),
    v31 = v30 === "cameraMove",
    v32 = !v31 && v3["subtractSubject"] === true;
  v32 &&
    v13(
      v9,
      v8["subtractSubjectNode"],
      v8["subtractSubjectNode"]?.["value"] ?? "true",
    );
  const v33 = !v31 && (v28 || v32);
  if (v33) {
    const v34 = Number(v3["maskExpansion"]),
      v35 = Number["isFinite"](v34)
        ? v34
        : (v8["maskExpansionNode"]?.["defaultValue"] ?? 25);
    (v13(v9, v8["maskExpansionNode"], v35),
      v13(
        v9,
        v8["maskRectNode"],
        v3["maskRect"] === true
          ? (v8["maskRectNode"]?.["trueValue"] ?? "1")
          : (v8["maskRectNode"]?.["falseValue"] ?? "0"),
      ),
      v13(
        v9,
        v8["maskParamsEnabledNode"],
        v8["maskParamsEnabledNode"]?.["value"] ?? "1",
      ));
  }
  (v30 === "longVideoOverlay" || v30 === "cameraMove") &&
    v13(v9, v8["specialModeNode"], v11(v30, v8["specialModeNode"], ""));
  v30 === "longVideoOverlay" &&
    v13(
      v9,
      v8["longVideoOverlayNode"],
      v8["longVideoOverlayNode"]?.["value"] ?? "1",
    );
  const v36 = Number(v3["breastJiggle"] ?? v3["rhBreastJiggle"] ?? 0),
    v37 = Number["isFinite"](v36)
      ? Math["max"](0, Math["min"](1, Math["round"](v36 * 20) / 20))
      : 0;
  return (
    v37 > 0 &&
      (v13(v9, v8["breastJiggleNode"], Number(v37["toFixed"](2))),
      v13(
        v9,
        v8["breastJiggleEnabledNode"],
        v8["breastJiggleEnabledNode"]?.["value"] ?? "true",
      )),
    v10({ executionManifest: v2, payload: v3, apiKey: v5, nodeInfoList: v9 })
  );
}
async function resolveRunningHubVideoMattingPayload({
  executionManifest: v38,
  payload: v39,
  apiKey: v40,
  ctx: v41,
  helpers: v42,
}) {
  const v43 = v38["mapping"] || {},
    v44 = [],
    {
      buildTaskCreateVideoWorkflowRequest: v45,
      normalizeRhVideoFps: v46,
      normalizeRhVideoResolution: v47,
      normalizeVideoMattingMaskModeIndex: v48,
      pushManifestNode: v49,
    } = v42,
    v50 = String(v39["maskImageDataUrl"] || "")["trim"](),
    v51 = String(v39["videoUrl"] || "")["trim"]();
  if (!v51) throw new Error("请接入源视频");
  const v52 = v41["processInputVideos"];
  if (typeof v52 !== "function")
    throw new Error("缺少\x20RunningHUB\x20视频上传能力");
  const v53 = await v52([v51], v40),
    v54 = String(v53?.[0] || "")["trim"]();
  if (!v54) throw new Error("源视频上传失败");
  if (v50) {
    const v55 = v41["processInputImages"];
    if (typeof v55 !== "function")
      throw new Error("缺少 RunningHUB 图片上传能力");
    const v56 = await v55([v50], v40, {
        compress: false,
        provider: "runninghub",
      }),
      v57 = String(v56?.[0] || "")["trim"]();
    if (!v57) throw new Error("擦除遮罩上传失败");
    const v58 = Number(v39["sourceFrameCount"] ?? v39["frameCount"]),
      v59 = Number["isFinite"](v58) ? Math["max"](1, Math["trunc"](v58)) : 1;
    (v49(v44, v43["maskVideoNode"], v54),
      v49(v44, v43["maskFrameCapNode"], String(v59)),
      v49(
        v44,
        v43["maskFpsNode"],
        String(v46(v39["rhVideoFps"] ?? v39["frameRate"])),
      ),
      v49(
        v44,
        v43["maskResolutionNode"],
        String(v47(v39["rhVideoResolution"], 1024)),
      ),
      v49(v44, v43["maskImageNode"], v57));
    const v60 = v39["rhInstanceType"] === "plus" ? "plus" : "default";
    return {
      url: "/api/v2/video/matting/run",
      headers: { "Content-Type": "application/json" },
      body: {
        apiKey: v40,
        appId: v43["maskAppId"],
        nodeInfoList: v44,
        instanceType: v60,
        usePersonalQueue: "false",
      },
      adapterTrace: {
        source: "manifest",
        executionId: v38["id"],
        modelId: v39["model"],
      },
      isAsync: true,
      taskIdPath: "taskId",
      useOpenapiQuery: true,
      pollUrlBuilder: () => "https://www.runninghub.cn/openapi/v2/query",
      resultExtractor: (v61) =>
        v61["status"] === "COMPLETED" && Array["isArray"](v61["results"])
          ? v61["results"]
              ["map"]((v62) => v62["videoUrl"] || v62["url"])
              ["filter"](Boolean)
          : [],
    };
  }
  v49(v44, v43["noMaskVideoNode"], v54);
  const v63 = v39["frameRate"] || v39["rhVideoFps"];
  if (v63) v49(v44, v43["noMaskFpsNode"], String(v63));
  v39["rhVideoResolution"] !== undefined &&
    v39["rhVideoResolution"] !== null &&
    v49(
      v44,
      v43["noMaskResolutionNode"],
      String(v47(v39["rhVideoResolution"])),
    );
  const v64 = v39["pos_points"] ?? v39["positive"] ?? "",
    v65 = v39["neg_points"] ?? v39["negative"] ?? "";
  (v49(
    v44,
    v43["positiveNode"],
    Array["isArray"](v64) ? JSON["stringify"](v64) : String(v64 || ""),
  ),
    v49(
      v44,
      v43["negativeNode"],
      Array["isArray"](v65) ? JSON["stringify"](v65) : String(v65 || ""),
    ));
  const v66 = v39["frameRate"] || v39["rhVideoFps"] || v39["fps"],
    v67 =
      Number["isFinite"](v39["timeSec"]) && Number["isFinite"](Number(v66))
        ? Math["max"](0, Math["round"](Number(v39["timeSec"]) * Number(v66)))
        : v39["frame_index"] !== undefined && v39["frame_index"] !== null
          ? v39["frame_index"]
          : 0;
  return (
    v49(v44, v43["frameIndexNode"], String(v67)),
    v49(v44, v43["maskModeNode"], v48(v39["rhMaskMode"])),
    v45({
      executionManifest: v38,
      payload: v39,
      apiKey: v40,
      nodeInfoList: v44,
    })
  );
}
