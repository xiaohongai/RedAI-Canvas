import {
  RH_VIDEO_FRAME_INTERPOLATION_MODEL_ID,
  resolveModelExecution,
} from "../../../manifests/index.js";
function getVideoFrameInterpolationConfig() {
  const v0 = resolveModelExecution(RH_VIDEO_FRAME_INTERPOLATION_MODEL_ID),
    v1 =
      v0?.["modelManifest"]?.["extensions"]?.["videoFrameInterpolation"] ||
      null,
    v2 = v0?.["executionManifest"]?.["mapping"]?.["sourceVideoNode"] || null,
    v3 = String(
      v0?.["executionManifest"]?.["appId"] ||
        v0?.["executionManifest"]?.["workflowId"] ||
        "",
    )["trim"](),
    v4 = String(v1?.["taskType"] || "")["trim"]();
  if (!v0 || !v1 || !v2 || !v3 || !v4)
    throw new Error(
      "Video\x20frame\x20interpolation\x20manifest\x20extension\x20missing",
    );
  return {
    modelId: v0["modelManifest"]["modelId"],
    provider: v0["modelManifest"]["provider"],
    adapterType: v0["modelManifest"]["adapterType"],
    executionId: v0["executionManifest"]["id"],
    appId: v3,
    taskType: v4,
    toolbarTaskOutputTextIncludes: Array["isArray"](
      v1["toolbarTaskOutputTextIncludes"],
    )
      ? v1["toolbarTaskOutputTextIncludes"]
          ["map"]((v5) => String(v5 || "")["trim"]())
          ["filter"](Boolean)
      : [],
    sourceVideoNode: v2,
    instanceType:
      v0["executionManifest"]["instanceType"]?.["defaultValue"] || "default",
  };
}
export function bindVideoFrameInterpolationAction(v6) {
  const {
      toolbarEl: v7,
      nodeData: v8,
      store: v9,
      submitTask: v10,
      createRunningHubTaskStateMachine: v11,
      runRunninghubAiApp: v12,
      resumeRunninghubWorkflowTask: v13,
      processInputVideos: v14,
      getProviderConfig: v15,
      ensureConfig: v16,
      calcSafeSpawnPosNearNode: v17,
      buildSourceMediaNodePayload: v18,
      getAutoMediaSizeByShortSide: v19,
      buildCanvasLocalVideoFields: v20,
      buildVideoGenerationFailurePatch: v21,
      buildVideoGenerationResultPatch: v22,
      bindRunningHubToolbarTaskButton: v23,
      cancelRunningHubResultTask: v24,
      findRunningHubToolbarTaskForNode: v25,
      isRunningHubToolbarTaskCancelled: v26,
      notifyRunningHubToolbarTasksChanged: v27,
      _getCurrentVideoUrl: v28,
      _ensureVideoHdDurationAllowed: v29,
      _extractFirstUrl: v30,
      _saveRemoteVideoResult: v31,
    } = v6,
    v32 = getVideoFrameInterpolationConfig(),
    v33 = v11(),
    v34 = v33["state"],
    v35 = v7["querySelector"](".act-replace");
  v35 &&
    (v33["bindButton"](v35),
    v23({
      button: v35,
      getTask: () =>
        v25(v8["id"], {
          models: [v32["modelId"]],
          taskTypes: [v32["taskType"]],
          outputTextIncludes: v32["toolbarTaskOutputTextIncludes"],
        }),
      cancelTask: async (v36) => {
        try {
          if (v34["active"] && String(v34["outNodeId"] || "") === v36["outId"])
            try {
              await v33["cancel"]();
            } catch (v37) {
              console["warn"](
                "[VideoFrameInterpolation] cancel request failed:",
                v37,
              );
            }
          return await v24(v36, {
            name: "补帧视频 (已取消)",
            outputText: "模型: RH视频补帧\n状态: 已取消",
            notifyMessage: "已取消补帧任务",
          });
        } finally {
          v34["active"] &&
            String(v34["outNodeId"] || "") === v36["outId"] &&
            v33["reset"](v35);
        }
      },
      cancelTooltip: "取消补帧",
    }),
    v35["addEventListener"]("click", (v38) => {
      (v38["stopPropagation"](), v38["preventDefault"]());
      if (v34["active"]) {
        (async () => {
          let v39 = null;
          try {
            const v40 = v34["outNodeId"]
              ? {
                  outId: v34["outNodeId"],
                  targetNodeId: v34["outNodeId"],
                  taskId: v34["taskId"],
                  apiKey: v34["apiKey"],
                  sourceNodeId: v8["id"],
                }
              : null;
            v40
              ? await v24(v40, {
                  name: "补帧视频 (已取消)",
                  outputText: "模型: RH视频补帧\n状态: 已取消",
                  notifyMessage: "已取消补帧任务",
                })
              : (await v33["cancel"](),
                window["showToast"]?.("已取消任务", "info"));
          } catch (v41) {
            v39 = v41;
          }
          try {
            v39 &&
              console["warn"](
                "[VideoFrameInterpolation] cancel request failed:",
                v39,
              );
          } finally {
            v33["reset"](v35);
          }
        })();
        return;
      }
      (async () => {
        let v42 = null;
        const v43 = Date["now"](),
          v44 = new AbortController();
        try {
          const v45 = v9["getState"]()["nodes"]?.[v8["id"]];
          if (!v45) {
            window["showToast"]?.("找不到原节点", "error");
            return;
          }
          const v46 = v28();
          if (!v46) {
            window["showToast"]?.("没有可处理的视频", "error");
            return;
          }
          if (!(await v29(v46))) return;
          await v16();
          const v47 = v15("runninghubwf"),
            v48 = String(v47?.["apiKey"] || "")["trim"]();
          if (!v48) {
            window["showToast"]?.(
              "RunningHUB\x20API\x20Key\x20未配置",
              "error",
            );
            return;
          }
          const v49 = v45["width"] || 300,
            v50 = v45["height"] || 300,
            { width: v51, height: v52 } = v19(v49, v50),
            { x: v53, y: v54 } = v17(v9["getState"]()["nodes"], v45, v51, v52);
          v42 =
            "source-video-frame-" +
            Date["now"]() +
            "-" +
            Math["random"]()["toString"](36)["slice"](2, 6);
          const v55 = await v10(
            {
              sourceNodeId: v45["id"],
              trigger: "toolbar",
              taskType: v32["taskType"],
              provider: v32["provider"],
              adapterType: v32["adapterType"],
              modelId: v32["modelId"],
              executionId: v32["executionId"],
              payload: { apiKey: v48, inputVideoUrl: v46, appId: v32["appId"] },
              cancellable: true,
              resumable: true,
              onTaskChange: ({ sourceNodeId: v56, targetNodeId: v57 }) =>
                v27({ sourceNodeId: v56, outId: v57 }),
              createTargetNode: ({ startPatch: v58, protocolPatch: v59 }) =>
                v18({
                  id: v42,
                  type: "source-video",
                  x: v53,
                  y: v54,
                  width: v51,
                  height: v52,
                  name: "补帧视频\x20(处理中)",
                  src: "",
                  localPath: "",
                  fileName: "frame_" + Date["now"]() + ".mp4",
                  ...v58,
                  provider: v32["provider"],
                  model: v32["modelId"],
                  rhTaskUseOpenapiQuery: true,
                  ...v59,
                  outputText: "模型: RH视频补帧\n状态: 处理中",
                }),
              cancel: async ({ taskId: v60 }) => {
                if (!v48 || !v60) return;
                await v24(
                  {
                    outId: v42,
                    taskId: v60,
                    sourceNodeId: v45["id"],
                    apiKey: v48,
                  },
                  {
                    name: "补帧视频\x20(已取消)",
                    outputText: "模型: RH视频补帧\n状态: 已取消",
                    notify: false,
                  },
                );
              },
              submit: async (v61, v62) => {
                (v33["activate"]({
                  button: v35,
                  apiKey: v48,
                  abortController: v44,
                  outNodeId: v62["targetNodeId"],
                }),
                  v9["setSelectedNodes"]([v62["targetNodeId"]]));
                typeof window["v2FocusOnNodes"] === "function"
                  ? window["v2FocusOnNodes"]([v45["id"], v62["targetNodeId"]])
                  : window["v2FocusOnNode"]?.(v62["targetNodeId"]);
                window["showToast"]?.("正在上传视频到 RH...", "info");
                const v63 = await v14([v61["inputVideoUrl"]], v48),
                  v64 = v63[0];
                if (!v64) throw new Error("RH 上传未返回 download_url");
                if (v26(v62["targetNodeId"])) throw new Error("CANCELLED");
                window["showToast"]?.("正在补帧处理视频...", "info");
                const v65 = await v12(
                    {
                      apiKey: v48,
                      appId: v61["appId"],
                      nodeInfoList: [
                        {
                          nodeId: String(
                            v32["sourceVideoNode"]["nodeId"] || "",
                          ),
                          fieldName: String(
                            v32["sourceVideoNode"]["fieldName"] || "",
                          ),
                          fieldValue: v64,
                          description: String(
                            v32["sourceVideoNode"]["description"] ||
                              v32["sourceVideoNode"]["fieldName"] ||
                              "video",
                          ),
                        },
                      ],
                      instanceType: v32["instanceType"],
                      usePersonalQueue: "false",
                    },
                    { signal: v62["signal"] },
                  ),
                  v66 = String(
                    v65?.["data"]?.["taskId"] ||
                      v65?.["data"]?.["task_id"] ||
                      v65?.["taskId"] ||
                      v65?.["task_id"] ||
                      "",
                  )["trim"]();
                if (!v66) throw new Error("任务 ID 未返回");
                (v33["setTaskId"](v66), v62["onTaskId"]?.(v66));
                if (v33["isCancelled"]() || v26(v62["targetNodeId"])) {
                  await v24(
                    {
                      outId: v62["targetNodeId"],
                      taskId: v66,
                      sourceNodeId: v45["id"],
                      apiKey: v48,
                    },
                    {
                      name: "补帧视频 (已取消)",
                      outputText: "模型: RH视频补帧\n状态: 已取消",
                      notify: false,
                    },
                  );
                  throw new Error("CANCELLED");
                }
                return { taskId: v66 };
              },
              poll: async ({ taskId: v67, signal: v68, targetNodeId: v69 }) => {
                const v70 = await v13(
                  { apiKey: v48, taskId: v67 },
                  { signal: v68, useOpenapiQuery: true },
                );
                if (v26(v69)) throw new Error("CANCELLED");
                const v71 = v30(v70);
                if (!v71) throw new Error("未获取到可用的输出视频 URL");
                const v72 = await v31(v71);
                if (v26(v69)) throw new Error("CANCELLED");
                if (!v72) throw new Error("已生成但本地保存失败");
                return {
                  resultUrl: v71,
                  localVideoFields: v20({ localPath: v72, videoUrl: v71 }),
                };
              },
              resultBuilder: ({ localVideoFields: v73 }) => {
                const v74 =
                  Date["now"]() -
                  Number(
                    v9["getState"]()["nodes"]?.[v42]?.["generationStartTime"] ||
                      v43,
                  );
                return {
                  name: "补帧视频",
                  ...v22(v73, { duration: v74 }),
                  ...v73,
                  fileName: "frame_" + Date["now"]() + ".mp4",
                  outputText: "模型: RH视频补帧\n状态: 完成",
                };
              },
              failureBuilder: (v75) => {
                const v76 =
                    v75 instanceof Error ? v75["message"] : String(v75 || ""),
                  v77 =
                    Date["now"]() -
                    Number(
                      v9["getState"]()["nodes"]?.[v42]?.[
                        "generationStartTime"
                      ] || v43,
                    );
                return {
                  name:
                    v76 === "已生成但本地保存失败"
                      ? "补帧视频"
                      : "补帧视频 (失败)",
                  ...v21({ error: v76, duration: v77 }),
                  ...(v76 === "已生成但本地保存失败"
                    ? {
                        src: "",
                        videoUrl: "",
                        localPath: "",
                        thumbUrl: "",
                        videoMetaSrc: "",
                        fileName: "frame_" + Date["now"]() + ".mp4",
                        rhStatusMessage: v76,
                      }
                    : {}),
                  outputText:
                    v76 === "已生成但本地保存失败"
                      ? "模型: RH视频补帧\n状态: 失败"
                      : "模型:\x20RH视频补帧\x0a状态:\x20失败\x0a错误:\x20" +
                        v76,
                };
              },
              cancelledBuilder: () => ({
                name: "补帧视频\x20(已取消)",
                outputText: "模型: RH视频补帧\n状态: 已取消",
              }),
            },
            { store: v9, abortController: v44, startedAt: v43 },
          );
          if (v55["status"] === "success")
            (window["_triggerLocalCacheSave"]?.(),
              window["showToast"]?.("✅\x20补帧视频生成完成", "success"));
          else {
            if (v55["status"] === "cancelled") {
              if (!v34["cancelRequested"])
                window["showToast"]?.("已取消任务", "info");
            } else {
              if (v55["status"] === "failed") {
                const v78 =
                  v55["error"] instanceof Error
                    ? v55["error"]["message"]
                    : String(v55["error"] || "");
                window["showToast"]?.("视频补帧失败: " + v78, "error");
              }
            }
          }
        } catch (v79) {
          const v80 = v79 instanceof Error ? v79["message"] : String(v79 || ""),
            v81 =
              v34["cancelRequested"] ||
              v33["isCancelled"]() ||
              v80 === "CANCELLED" ||
              v80 === "任务已取消" ||
              v80["includes"]("aborted");
          v81
            ? !v34["cancelRequested"] &&
              window["showToast"]?.("已取消任务", "info")
            : window["showToast"]?.("视频补帧失败: " + v80, "error");
        } finally {
          v33["reset"](v35);
        }
      })();
    }));
}
