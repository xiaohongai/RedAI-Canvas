export function bindImagePanorama360Action(v0) {
  const {
      toolbarEl: v1,
      nodeId: v2,
      getNodeData: v3,
      store: v4,
      submitTask: v5,
      buildSourceMediaNodePayload: v6,
      resolveCanvasImagePreviewUrl: v7,
      localPathToUrl: v8,
      buildImageGenerationFailurePatch: v9,
      buildImageGenerationResultPatch: v10,
      calcDisplaySizeByMedia: v11,
      resumeRunningHubImageTask: v12,
      runRunninghubAiApp: v13,
      processInputImages: v14,
      getProviderConfig: v15,
      ensureConfig: v16,
      calcSafeSpawnPosNearNode: v17,
      bindRunningHubToolbarTaskButton: v18,
      cancelRunningHubResultTask: v19,
      findRunningHubToolbarTaskForNode: v20,
      isRunningHubToolbarTaskCancelled: v21,
      buildToolbarImageFields: v22,
      saveOutputImageResult: v23,
      extractFirstImageUrl: v24,
      parseRhCode: v25,
      parseRhTaskId: v26,
      resolveApiInputRatioBasis: v27,
      resolveFinalResultDisplaySize: v28,
      createToolbarCancelledError: v29,
      isToolbarCancelledError: v30,
      createLocalSaveFailureError: v31,
      isLocalSaveFailure: v32,
      throwIfToolbarTaskCancelled: v33,
      cancelRunningHubRemoteTaskQuietly: v34,
      focusToolbarTaskNodes: v35,
      notifyImageToolbarTaskChange: v36,
      buildClearedImageMediaFields: v37,
      IMAGE_LOCAL_SAVE_FAILURE_MESSAGE: v38,
    } = v0,
    v39 = v1["querySelector"](".act-panorama-360");
  if (v39) {
    const v40 = "2044874075721441281",
      v41 = "runninghub/" + v40,
      v42 = "147";
    let v43 = false;
    const v44 = (v45) => {
      ((v43 = !!v45), (v39["style"]["opacity"] = v45 ? "0.65" : "1"));
      const v46 = v39["querySelector"]("svg");
      if (v46) {
        if (v45) v46["classList"]["add"]("v2-spinning");
        else v46["classList"]["remove"]("v2-spinning");
      }
    };
    (v18({
      button: v39,
      getTask: () =>
        v20(v2, {
          models: [v41],
          taskTypes: ["image-panorama-360"],
          outputTextIncludes: ["360°全景图", "360全景图"],
          nameIncludes: ["360°全景图", "360全景图"],
        }),
      cancelTask: (v47) =>
        v19(v47, {
          name: "360°全景图 (已取消)",
          outputText: "模型: RH 一键360°全景图\n状态: 已取消",
          notifyMessage: "已取消\x20360°全景图任务",
        }),
      cancelTooltip: "取消360°全景图",
    }),
      v39["addEventListener"]("click", (v48) => {
        (v48["stopPropagation"](), v48["preventDefault"]());
        if (v43) {
          window["showToast"]?.("360°全景图任务正在处理中", "info");
          return;
        }
        void (async () => {
          let v49 = null,
            v50 = "",
            v51 = "",
            v52 = "",
            v53 = null;
          try {
            v44(true);
            const v54 = v3() || {},
              v55 =
                v54?.["localPath"] ||
                (v54?.["images"] &&
                  v54["images"][v54["mainImageIndex"] || 0]?.["localPath"]),
              v56 = v8(v55) || v7(v54);
            if (!v56) {
              window["showToast"]?.("没有可处理的图像", "error");
              return;
            }
            await v16();
            const v57 = v15("runninghubwf"),
              v58 = String(v57?.["apiKey"] || "")["trim"]();
            if (!v58) {
              window["showToast"]?.("RunningHUB API Key 未配置", "error");
              return;
            }
            const v59 = v4["getState"]()["nodes"][v2] || v54;
            if (!v59) {
              window["showToast"]?.("找不到原节点", "error");
              return;
            }
            const v60 = await v27(v59, v56),
              { width: v61, height: v62 } = v11(v60["width"], v60["height"]),
              { x: v63, y: v64 } = v17(
                v4["getState"]()["nodes"],
                v59,
                v61,
                v62,
              ),
              v65 =
                "source-image-panorama-360-" +
                Date["now"]() +
                "-" +
                Math["random"]()["toString"](36)["slice"](2, 6),
              v66 = "模型: RH 一键360°全景图",
              v67 = await v5({
                sourceNodeId: v59["id"],
                trigger: "toolbar",
                taskType: "image-panorama-360",
                provider: "runninghubwf",
                adapterType: "workflow",
                modelId: v41,
                executionId: "runninghub.image-panorama-360",
                payload: {
                  apiKey: v58,
                  imgUrl: v56,
                  inputBasis: v60,
                  outputText: v66,
                },
                cancellable: true,
                resumable: true,
                onTaskChange: v36,
                createTargetNode: ({
                  startedAt: v68,
                  startPatch: v69,
                  protocolPatch: v70,
                }) =>
                  v6({
                    id: v65,
                    type: "source-image",
                    x: v63,
                    y: v64,
                    width: v61,
                    height: v62,
                    needsAutoResize: false,
                    name: "360°全景图\x20(处理中)",
                    src: "",
                    outputText: v66,
                    localPath: "",
                    fileName: "panorama_360_" + Date["now"]() + ".png",
                    provider: "runninghubwf",
                    model: v41,
                    rhTaskUseOpenapiQuery: true,
                    ...v69,
                    ...v70,
                    generationStartTime: v68,
                    rhTaskStartedAt: v68,
                  }),
                submit: async (v71, v72) => {
                  v35(v59["id"], v72["targetNodeId"]);
                  const v73 = await v14([v71["imgUrl"]], v58, {
                      applyInputQualityProfile: true,
                      provider: "runninghub",
                    }),
                    v74 = String(v73?.[0] || "")["trim"]();
                  if (!v74) throw new Error("图片上传失败");
                  v33(v72["targetNodeId"]);
                  const v75 = await v13(
                      {
                        apiKey: v58,
                        appId: v40,
                        nodeInfoList: [
                          {
                            nodeId: v42,
                            fieldName: "image",
                            fieldValue: v74,
                            description: "image",
                          },
                        ],
                        instanceType: "default",
                        usePersonalQueue: "false",
                      },
                      { signal: v72["signal"] },
                    ),
                    v76 = v25(v75);
                  if (v76 !== null && v76 !== 0)
                    throw new Error(
                      String(
                        v75?.["msg"] || v75?.["message"] || "创建任务失败",
                      ),
                    );
                  const v77 = v26(v75);
                  if (v77) v72["onTaskId"](v77);
                  if (v21(v72["targetNodeId"])) {
                    await v34({
                      apiKey: v58,
                      taskId: v77,
                      label: "Panorama360",
                    });
                    throw v29();
                  }
                  return v77
                    ? { taskId: v77 }
                    : { result: { resultUrl: v24(v75) } };
                },
                poll: async ({ taskId: v78, targetNodeId: v79 }) => {
                  const v80 = await v12(
                    v78,
                    { provider: "runninghubwf", model: v41, apiKey: v58 },
                    { useOpenapiQuery: true, softTimeout: true },
                  );
                  if (v80?.["pending"]) return v80;
                  v33(v79);
                  const v81 =
                    v80?.["isBatch"] && Array["isArray"](v80["images"])
                      ? v80["images"][0]
                      : v80;
                  if (!v81 || v81["error"])
                    throw new Error(
                      String(v81?.["error"] || "任务完成但未返回图片"),
                    );
                  const v82 = String(
                    v81["sourceUrl"] ||
                      v81["imageUrl"] ||
                      v81["thumbUrl"] ||
                      v81["src"] ||
                      "",
                  )["trim"]();
                  if (!v82) throw new Error("任务完成但未返回图片");
                  return { resultUrl: v82, resumedImage: v81 };
                },
                cancel: ({ taskId: v83 }) =>
                  v34({ apiKey: v58, taskId: v83, label: "Panorama360" }),
                resultBuilder: async (v84, v85) => {
                  const v86 = String(v84?.["resultUrl"] || "")["trim"]();
                  if (!v86) throw new Error("任务完成但未返回图片");
                  ((v50 = v86), (v53 = v84?.["resumedImage"] || null));
                  let v87;
                  try {
                    v87 = await v23(v86, {
                      resumedImage: v53,
                      ext: "png",
                      includeSrc: true,
                      taskKey: v85["taskId"]
                        ? "runninghubwf:image:" + v85["taskId"]
                        : "",
                    });
                  } catch (v88) {
                    (console["warn"](
                      "[Panorama360] saveOutputFromUrlToServer failed:",
                      v88,
                    ),
                      (v87 = {
                        localPath: "",
                        thumbUrl: v86,
                        fields: v22({
                          localPath: "",
                          resultUrl: v86,
                          thumbUrl: v86,
                          includeSrc: true,
                        }),
                      }));
                  }
                  ((v51 = v87["thumbUrl"] || v86),
                    (v52 = v87["localPath"] || ""));
                  const v89 = v87["fields"];
                  v49 = await v28(v60, {
                    localPath: v52,
                    imageUrl: v51 || v86,
                    sourceUrl: v86,
                    thumbUrl: v51,
                    src: v51 || v86,
                  });
                  if (!v52) throw v31();
                  return {
                    name: "360°全景图",
                    ...v10(v89, { startedAt: v85["startedAt"] }),
                    ...v89,
                    sourceUrl: v86 || v89["sourceUrl"] || "",
                    fileName:
                      v53?.["fileName"] ||
                      v89["fileName"] ||
                      "panorama_360_" + Date["now"]() + ".png",
                    width: v49["width"],
                    height: v49["height"],
                    outputText: v66,
                  };
                },
                failureBuilder: async (v90, v91) => {
                  const v92 =
                    v90 instanceof Error
                      ? v90["message"]
                      : String(v90 || "未知错误");
                  if (v32(v90))
                    return (
                      (v49 ||= await v28(v60, {
                        localPath: v52,
                        imageUrl: v51 || v50,
                        sourceUrl: v50,
                        thumbUrl: v51,
                        src: v51 || v50,
                      })),
                      {
                        name: "360°全景图",
                        ...v37(),
                        fileName: "panorama_360_" + Date["now"]() + ".png",
                        width: v49["width"],
                        height: v49["height"],
                        outputText: v66,
                        ...v9({ error: v38, startedAt: v91["startedAt"] }),
                        rhStatusMessage: v38,
                      }
                    );
                  return {
                    name: "360°全景图 (失败)",
                    ...v9({ error: v92, startedAt: v91["startedAt"] }),
                    outputText: v66 + "\n错误: " + v92,
                  };
                },
                cancelledBuilder: () => ({
                  name: "360°全景图 (已取消)",
                  outputText: "模型: RH 一键360°全景图\n状态: 已取消",
                }),
              });
            if (v67["status"] === "success")
              window["showToast"]?.("✅ 360°全景图生成完成", "success");
            else {
              if (v67["status"] === "pending")
                window["showToast"]?.(
                  "RunningHub 仍在生成，已保留任务，会继续查询",
                  "info",
                );
              else {
                if (v67["status"] === "failed") {
                  if (v32(v67["error"]))
                    window["showToast"]?.("⚠️ " + v38, "warn");
                  else {
                    const v93 =
                      v67["error"] instanceof Error
                        ? v67["error"]["message"]
                        : String(v67["error"] || "未知错误");
                    window["showToast"]?.(
                      "360°全景图生成失败: " + v93,
                      "error",
                    );
                  }
                } else
                  v67["status"] === "cancelled" &&
                    window["showToast"]?.("已取消 360°全景图任务", "info");
              }
            }
          } catch (v94) {
            const v95 =
              v94 instanceof Error ? v94["message"] : String(v94 || "未知错误");
            if (v30(v94)) {
              window["showToast"]?.("已取消 360°全景图任务", "info");
              return;
            }
            window["showToast"]?.("360°全景图生成失败:\x20" + v95, "error");
          } finally {
            v44(false);
          }
        })();
      }));
  }
}
