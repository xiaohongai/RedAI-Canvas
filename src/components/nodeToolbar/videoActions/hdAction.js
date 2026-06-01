import {
  appendToolbarActionMenuTitle,
  createRunningHubActionIcon,
  createToolbarActionDescription,
  createToolbarActionMenuBody,
  createToolbarActionMenuItem,
  createToolbarActionTitle,
  createToolbarActionTitleRow,
  createToolbarActionVipBadge,
} from "../actionMenu.js";
export function bindVideoHdAction(v0) {
  const {
      toolbarEl: v1,
      nodeData: v2,
      store: v3,
      submitTask: v4,
      createRunningHubTaskStateMachine: v5,
      runRunninghubAiApp: v6,
      runRunninghubWorkflow: v7,
      resumeRunninghubWorkflowTask: v8,
      processInputVideos: v9,
      getProviderConfig: v10,
      ensureConfig: v11,
      calcSafeSpawnPosNearNode: v12,
      buildSourceMediaNodePayload: v13,
      getAutoMediaSizeByShortSide: v14,
      buildCanvasLocalVideoFields: v15,
      buildVideoGenerationFailurePatch: v16,
      buildVideoGenerationResultPatch: v17,
      bindRunningHubToolbarTaskButton: v18,
      cancelRunningHubResultTask: v19,
      findRunningHubToolbarTaskForNode: v20,
      isRunningHubToolbarTaskCancelled: v21,
      notifyRunningHubToolbarTasksChanged: v22,
      RH_VIDEO_HD_BASIC_WORKFLOW_ID: v23,
      RH_VIDEO_HD_VIP_MODEL_ID: v24,
      RH_VIDEO_HD_VIP_APP_ID: v25,
      VIDEO_HD_STANDARD_INSTANCE_TYPE: v26,
      VIDEO_HD_VIP_INSTANCE_TYPE: v27,
      _getCurrentVideoUrl: v28,
      _ensureVideoHdDurationAllowed: v29,
      _ensureVideoHdVipAllowed: v30,
      _extractFirstUrl: v31,
      _saveRemoteVideoResult: v32,
    } = v0,
    v33 = v5(),
    v34 = v33["state"],
    v35 = (v36) => {
      const v37 = v36?.["closest"]?.(".v2-img-toolbar-more-menu"),
        v38 = v37?.["getBoundingClientRect"]?.(),
        v39 = v36["getBoundingClientRect"]();
      if (v38 && v38["width"] > 0 && v38["height"] > 0) {
        const v40 = {
            left: v39["left"] + v39["width"] / 2,
            top: v38["top"] - 12,
          },
          v41 = () => v40;
        return ((v41["isFixed"] = true), v41);
      }
      const v42 = () => {
        const v43 = v36["getBoundingClientRect"]();
        return { left: v43["left"] + v43["width"] / 2, top: v43["top"] - 12 };
      };
      return ((v42["isFixed"] = false), v42);
    },
    v44 = v1["querySelector"](".act-hd");
  v44 &&
    (v33["bindButton"](v44),
    v18({
      button: v44,
      getTask: () =>
        v20(v2["id"], {
          models: [v24, "runninghub/" + v23],
          taskTypes: ["video-hd"],
          outputTextIncludes: ["高清修复视频"],
        }),
      cancelTask: async (v45) => {
        try {
          if (v34["active"] && String(v34["outNodeId"] || "") === v45["outId"])
            try {
              await v33["cancel"]();
            } catch (v46) {
              console["warn"]("[VideoHD]\x20cancel\x20request\x20failed:", v46);
            }
          return await v19(v45, {
            name: "高清视频\x20(已取消)",
            outputText: "模型: 视频高清\n提示词: 高清修复视频\n状态: 已取消",
            notifyMessage: "已取消视频高清任务",
          });
        } finally {
          v34["active"] &&
            String(v34["outNodeId"] || "") === v45["outId"] &&
            v33["reset"](v44);
        }
      },
      cancelTooltip: "取消视频高清",
    }),
    v44["addEventListener"]("click", (v47) => {
      (v47["stopPropagation"](), v47["preventDefault"]());
      if (v34["active"]) {
        (async () => {
          let v48 = null;
          try {
            const v49 = v34["outNodeId"]
              ? {
                  outId: v34["outNodeId"],
                  targetNodeId: v34["outNodeId"],
                  taskId: v34["taskId"],
                  apiKey: v34["apiKey"],
                  sourceNodeId: v2["id"],
                }
              : null;
            v49
              ? await v19(v49, {
                  name: "高清视频\x20(已取消)",
                  outputText:
                    "模型: 视频高清\n提示词: 高清修复视频\n状态: 已取消",
                  notifyMessage: "已取消视频高清任务",
                })
              : (await v33["cancel"](),
                window["showToast"]?.("已取消任务", "info"));
          } catch (v50) {
            v48 = v50;
          }
          try {
            v48 && console["warn"]("[VideoHD] cancel request failed:", v48);
          } finally {
            v33["reset"](v44);
          }
        })();
        return;
      }
      const v51 = document["querySelector"](".v2-hd-popup");
      if (v51) {
        const v52 = v51["__v2HdAnchorBtn"] && v51["__v2HdAnchorBtn"] === v44,
          v53 =
            typeof v51["__v2HdClose"] === "function"
              ? v51["__v2HdClose"]
              : () => v51["remove"]();
        v53();
        if (v52) return;
      }
      const v54 = document["createElement"]("div");
      ((v54["className"] = "v2-hd-popup node-toolbar-action-menu"),
        (v54["__v2HdAnchorBtn"] = v44));
      const v55 = v35(v44),
        v56 = v55();
      (Object["assign"](v54["style"], {
        position: "fixed",
        left: v56["left"] + "px",
        top: v56["top"] + "px",
        transform: "translate(-50%, calc(-100% + 10px))",
        opacity: "0",
        pointerEvents: "none",
      }),
        appendToolbarActionMenuTitle(v54, "选择高清方案"));
      let v57 = () => {},
        v58 = 0;
      const v59 = () => {
        if (!document["body"]["contains"](v54)) {
          v57();
          return;
        }
        if (v54["__v2HdClosing"]) return;
        ((v54["__v2HdClosing"] = true),
          v57(),
          (v54["style"]["opacity"] = "0"),
          (v54["style"]["pointerEvents"] = "none"),
          (v54["style"]["transform"] = "translate(-50%, calc(-100% + 10px))"));
        const v60 = () => {
          v54["removeEventListener"]("transitionend", v60);
          if (document["body"]["contains"](v54)) v54["remove"]();
        };
        (v54["addEventListener"]("transitionend", v60),
          window["setTimeout"](v60, 280));
      };
      v54["__v2HdClose"] = v59;
      const v61 = [
          {
            key: "sharp",
            title: "高清锐化",
            desc: "RH工作流 增强视频锐度",
            vip: true,
            model: v24,
            appId: v25,
            index: "1",
            instanceType: v27,
            useOpenapiQuery: true,
          },
          {
            key: "quality",
            title: "高清质量",
            desc: "RH工作流 提升视频质量",
            vip: true,
            model: v24,
            appId: v25,
            index: "0",
            instanceType: v27,
            useOpenapiQuery: true,
          },
          {
            key: "basic",
            title: "基础高清",
            desc: "RH工作流 一键高清修复视频",
            vip: false,
            model: "runninghub/" + v23,
            workflowId: v23,
            instanceType: v26,
            useOpenapiQuery: false,
          },
        ],
        v62 = (v63) => {
          const v64 = createToolbarActionMenuItem();
          v64["appendChild"](createRunningHubActionIcon());
          const v65 = createToolbarActionMenuBody(),
            v66 = createToolbarActionTitleRow(),
            v67 = createToolbarActionTitle(v63["title"]);
          return (
            v66["appendChild"](v67),
            v63["vip"] && v66["appendChild"](createToolbarActionVipBadge()),
            v65["appendChild"](v66),
            v65["appendChild"](createToolbarActionDescription(v63["desc"])),
            v64["appendChild"](v65),
            v64["addEventListener"]("click", async (v68) => {
              (v68["stopPropagation"](), v59());
              let v69 = null;
              const v70 = Date["now"](),
                v71 = new AbortController();
              try {
                const v72 = v3["getState"]()["nodes"]?.[v2["id"]];
                if (!v72) {
                  window["showToast"]?.("找不到原节点", "error");
                  return;
                }
                const v73 = v28();
                if (!v73) {
                  window["showToast"]?.("没有可处理的视频", "error");
                  return;
                }
                if (!(await v29(v73))) return;
                if (
                  v63["vip"] &&
                  !(await v30(v63["model"], () => {
                    v64["dispatchEvent"](
                      new MouseEvent("click", {
                        bubbles: true,
                        cancelable: true,
                      }),
                    );
                  }))
                )
                  return;
                await v11();
                const v74 = v10("runninghubwf"),
                  v75 = String(v74?.["apiKey"] || "")["trim"]();
                if (!v75) {
                  window["showToast"]?.("RunningHUB API Key 未配置", "error");
                  return;
                }
                const v76 = v72["width"] || 300,
                  v77 = v72["height"] || 300,
                  { width: v78, height: v79 } = v14(v76, v77),
                  { x: v80, y: v81 } = v12(
                    v3["getState"]()["nodes"],
                    v72,
                    v78,
                    v79,
                  );
                v69 =
                  "source-video-hd-" +
                  Date["now"]() +
                  "-" +
                  Math["random"]()["toString"](36)["slice"](2, 6);
                const v82 = v63["instanceType"] === v27 ? v27 : v26,
                  v83 = await v4(
                    {
                      sourceNodeId: v72["id"],
                      trigger: "toolbar",
                      taskType: "video-hd",
                      provider: "runninghubwf",
                      adapterType: "workflow",
                      modelId: v63["model"],
                      executionId: v63["appId"]
                        ? "runninghub.ai-app." + v63["appId"]
                        : "runninghub.workflow." + v63["workflowId"],
                      payload: {
                        apiKey: v75,
                        inputVideoUrl: v73,
                        option: v63,
                        instanceType: v82,
                      },
                      cancellable: true,
                      resumable: true,
                      onTaskChange: ({
                        sourceNodeId: v84,
                        targetNodeId: v85,
                      }) => v22({ sourceNodeId: v84, outId: v85 }),
                      createTargetNode: ({
                        startPatch: v86,
                        protocolPatch: v87,
                      }) =>
                        v13({
                          id: v69,
                          type: "source-video",
                          x: v80,
                          y: v81,
                          width: v78,
                          height: v79,
                          name: "高清视频 (处理中)",
                          src: "",
                          localPath: "",
                          fileName: "hd_" + Date["now"]() + ".mp4",
                          ...v86,
                          provider: "runninghubwf",
                          model: v63["model"],
                          rhTaskUseOpenapiQuery:
                            v63["useOpenapiQuery"] === true,
                          ...v87,
                          outputText:
                            "模型: " + v63["title"] + "\n提示词: 高清修复视频",
                        }),
                      cancel: async ({ taskId: v88 }) => {
                        if (!v75 || !v88) return;
                        await v19(
                          {
                            outId: v69,
                            taskId: v88,
                            sourceNodeId: v72["id"],
                            apiKey: v75,
                          },
                          {
                            name: "高清视频 (已取消)",
                            outputText:
                              "模型: 视频高清\n提示词: 高清修复视频\n状态: 已取消",
                            notify: false,
                          },
                        );
                      },
                      submit: async (v89, v90) => {
                        (v33["activate"]({
                          button: v44,
                          apiKey: v75,
                          abortController: v71,
                          outNodeId: v90["targetNodeId"],
                        }),
                          v3["setSelectedNodes"]([v90["targetNodeId"]]));
                        typeof window["v2FocusOnNodes"] === "function"
                          ? window["v2FocusOnNodes"]([
                              v72["id"],
                              v90["targetNodeId"],
                            ])
                          : window["v2FocusOnNode"]?.(v90["targetNodeId"]);
                        window["showToast"]?.("正在上传视频到 RH...", "info");
                        const v91 = await v9([v89["inputVideoUrl"]], v75),
                          v92 = v91[0];
                        if (!v92) throw new Error("RH 上传未返回 download_url");
                        if (v21(v90["targetNodeId"]))
                          throw new Error("CANCELLED");
                        window["showToast"]?.("正在高清处理视频...", "info");
                        const v93 = v63["appId"]
                            ? [
                                {
                                  nodeId: "10",
                                  fieldName: "index",
                                  fieldValue: v63["index"],
                                  description: "index",
                                },
                                {
                                  nodeId: "12",
                                  fieldName: "video",
                                  fieldValue: v92,
                                  description: "video",
                                },
                              ]
                            : [
                                {
                                  nodeId: "9",
                                  fieldName: "video",
                                  fieldValue: v92,
                                },
                              ],
                          v94 = v63["appId"]
                            ? await v6(
                                {
                                  apiKey: v75,
                                  appId: v63["appId"],
                                  nodeInfoList: v93,
                                  instanceType: v82,
                                  usePersonalQueue: "false",
                                },
                                { signal: v90["signal"] },
                              )
                            : await v7(
                                {
                                  apiKey: v75,
                                  workflowId: v63["workflowId"],
                                  addMetadata: false,
                                  nodeInfoList: v93,
                                  instanceType: v82,
                                  usePersonalQueue: "false",
                                },
                                { signal: v90["signal"] },
                              ),
                          v95 = String(
                            v94?.["data"]?.["taskId"] ||
                              v94?.["data"]?.["task_id"] ||
                              v94?.["taskId"] ||
                              v94?.["task_id"] ||
                              "",
                          )["trim"]();
                        if (!v95) throw new Error("任务 ID 未返回");
                        (v33["setTaskId"](v95), v90["onTaskId"]?.(v95));
                        if (v33["isCancelled"]() || v21(v90["targetNodeId"])) {
                          await v19(
                            {
                              outId: v90["targetNodeId"],
                              taskId: v95,
                              sourceNodeId: v72["id"],
                              apiKey: v75,
                            },
                            {
                              name: "高清视频 (已取消)",
                              outputText:
                                "模型: 视频高清\n提示词: 高清修复视频\n状态: 已取消",
                              notify: false,
                            },
                          );
                          throw new Error("CANCELLED");
                        }
                        return { taskId: v95 };
                      },
                      poll: async ({
                        taskId: v96,
                        signal: v97,
                        targetNodeId: v98,
                      }) => {
                        if (v33["isCancelled"]() || v21(v98))
                          throw new Error("CANCELLED");
                        const v99 = await v8(
                            { apiKey: v75, taskId: v96 },
                            {
                              signal: v97,
                              useOpenapiQuery: v63["useOpenapiQuery"] === true,
                              taskKind: "video",
                            },
                          ),
                          v100 = v31(v99);
                        if (!v100)
                          throw new Error("未获取到可用的输出视频 URL");
                        if (v21(v98)) throw new Error("CANCELLED");
                        let v101 = "";
                        try {
                          v101 = await v32(v100);
                        } catch {
                          throw new Error("已生成但本地保存失败");
                        }
                        if (v21(v98)) throw new Error("CANCELLED");
                        if (!v101) throw new Error("已生成但本地保存失败");
                        return {
                          resultUrl: v100,
                          localVideoFields: v15({
                            localPath: v101,
                            videoUrl: v100,
                          }),
                        };
                      },
                      resultBuilder: ({ localVideoFields: v102 }) => {
                        const v103 =
                          Date["now"]() -
                          Number(
                            v3["getState"]()["nodes"]?.[v69]?.[
                              "generationStartTime"
                            ] || v70,
                          );
                        return {
                          name: "高清视频",
                          ...v17(v102, { duration: v103 }),
                          ...v102,
                          fileName: "hd_" + Date["now"]() + ".mp4",
                          outputText:
                            "模型:\x20" +
                            v63["title"] +
                            "\n提示词: 高清修复视频",
                        };
                      },
                      failureBuilder: (v104) => {
                        const v105 =
                            v104 instanceof Error
                              ? v104["message"]
                              : String(v104 || ""),
                          v106 =
                            Date["now"]() -
                            Number(
                              v3["getState"]()["nodes"]?.[v69]?.[
                                "generationStartTime"
                              ] || v70,
                            );
                        return {
                          name:
                            v105 === "已生成但本地保存失败"
                              ? "高清视频"
                              : "高清视频 (失败)",
                          ...v16({ error: v105, duration: v106 }),
                          ...(v105 === "已生成但本地保存失败"
                            ? {
                                src: "",
                                videoUrl: "",
                                localPath: "",
                                thumbUrl: "",
                                videoMetaSrc: "",
                                fileName: "hd_" + Date["now"]() + ".mp4",
                                rhStatusMessage: v105,
                              }
                            : {}),
                          outputText:
                            v105 === "已生成但本地保存失败"
                              ? "模型: " +
                                v63["title"] +
                                "\n提示词: 高清修复视频"
                              : "模型:\x20" +
                                v63["title"] +
                                "\n提示词: 高清修复视频\n错误: " +
                                v105,
                        };
                      },
                      cancelledBuilder: () => ({
                        name: "高清视频 (已取消)",
                        outputText:
                          "模型:\x20" +
                          v63["title"] +
                          "\n提示词: 高清修复视频\n状态: 已取消",
                      }),
                    },
                    { store: v3, abortController: v71, startedAt: v70 },
                  );
                if (v83["status"] === "success")
                  (window["_triggerLocalCacheSave"]?.(),
                    window["showToast"]?.("✅ 高清视频生成完成", "success"));
                else {
                  if (v83["status"] === "cancelled") {
                    if (!v34["cancelRequested"])
                      window["showToast"]?.("已取消任务", "info");
                  } else {
                    if (v83["status"] === "failed") {
                      const v107 =
                        v83["error"] instanceof Error
                          ? v83["error"]["message"]
                          : String(v83["error"] || "");
                      window["showToast"]?.("视频高清失败: " + v107, "error");
                    }
                  }
                }
              } catch (v108) {
                const v109 =
                    v108 instanceof Error
                      ? v108["message"]
                      : String(v108 || ""),
                  v110 =
                    v34["cancelRequested"] ||
                    v33["isCancelled"]() ||
                    v109 === "CANCELLED" ||
                    v109 === "任务已取消" ||
                    v109["includes"]("aborted");
                v110
                  ? !v34["cancelRequested"] &&
                    window["showToast"]?.("已取消任务", "info")
                  : window["showToast"]?.("视频高清失败: " + v109, "error");
              } finally {
                v33["reset"](v44);
              }
            }),
            v64
          );
        };
      (v61["forEach"]((v111) => {
        v54["appendChild"](v62(v111));
      }),
        document["body"]["appendChild"](v54),
        v54["offsetHeight"],
        (v54["style"]["pointerEvents"] = "auto"),
        (v54["style"]["opacity"] = "1"),
        (v54["style"]["transform"] = "translate(-50%, -100%)"));
      let v112 = null;
      v57 = () => {
        (v58 && (cancelAnimationFrame(v58), (v58 = 0)),
          v112 &&
            (document["removeEventListener"]("pointerdown", v112, true),
            (v112 = null)));
      };
      const v113 = () => {
        if (
          !document["body"]["contains"](v54) ||
          !document["body"]["contains"](v44)
        ) {
          v57();
          return;
        }
        if (!v55["isFixed"]) {
          const v114 = v44["getBoundingClientRect"]();
          if (v114["width"] <= 0 || v114["height"] <= 0) {
            v58 = requestAnimationFrame(v113);
            return;
          }
        }
        const v115 = v55();
        ((v54["style"]["left"] = v115["left"] + "px"),
          (v54["style"]["top"] = v115["top"] + "px"),
          (v58 = requestAnimationFrame(v113)));
      };
      ((v58 = requestAnimationFrame(v113)),
        (v112 = (v116) => {
          if (v54["__v2HdClosing"]) return;
          !v54["contains"](v116["target"]) &&
            !v44["contains"](v116["target"]) &&
            v59();
        }),
        document["addEventListener"]("pointerdown", v112, true));
    }));
}
