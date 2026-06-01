export function bindImageHdAction(v0) {
  const {
      toolbarEl: v1,
      nodeId: v2,
      getNodeData: v3,
      _hdTaskMachine: v4,
      _hdState: v5,
      store: v6,
      submitTask: v7,
      buildSourceMediaNodePayload: v8,
      buildImageGenerationFailurePatch: v9,
      buildImageGenerationResultPatch: v10,
      calcDisplaySizeByMedia: v11,
      runRunninghubWorkflow: v12,
      resumeRunninghubWorkflowTask: v13,
      processInputImages: v14,
      getProviderConfig: v15,
      ensureConfig: v16,
      calcSafeSpawnPosNearNode: v17,
      bindRunningHubToolbarTaskButton: v18,
      cancelRunningHubResultTask: v19,
      findRunningHubToolbarTaskForNode: v20,
      isRunningHubToolbarTaskCancelled: v21,
      saveRemoteImageResultLocally: v22,
      extractFirstImageUrl: v23,
      resolveApiInputRatioBasis: v24,
      resolveFinalResultDisplaySize: v25,
      createViewportSnapshotTracker: v26,
      createToolbarCancelledError: v27,
      isToolbarCancelledError: v28,
      createLocalSaveFailureError: v29,
      isLocalSaveFailure: v30,
      throwIfToolbarTaskCancelled: v31,
      cancelRunningHubRemoteTaskQuietly: v32,
      focusToolbarTaskNodes: v33,
      notifyImageToolbarTaskChange: v34,
      buildClearedImageMediaFields: v35,
      IMAGE_LOCAL_SAVE_FAILURE_MESSAGE: v36,
    } = v0,
    v37 = (v38) => {
      const v39 = v38?.["closest"]?.(".v2-img-toolbar-more-menu"),
        v40 = v39?.["getBoundingClientRect"]?.(),
        v41 = v38["getBoundingClientRect"]();
      if (v40 && v40["width"] > 0 && v40["height"] > 0) {
        const v42 = {
            left: v41["left"] + v41["width"] / 2,
            top: v40["top"] - 12,
          },
          v43 = () => v42;
        return ((v43["isFixed"] = true), v43);
      }
      const v44 = () => {
        const v45 = v38["getBoundingClientRect"]();
        return { left: v45["left"] + v45["width"] / 2, top: v45["top"] - 12 };
      };
      return ((v44["isFixed"] = false), v44);
    },
    v46 = v1["querySelector"](".act-hd");
  v46 &&
    (v4["bindButton"](v46),
    v18({
      button: v46,
      getTask: () =>
        v20(v2, {
          models: ["runninghub/2012862147813974018"],
          taskTypes: ["image-hd"],
          outputTextIncludes: ["RH高清放大"],
        }),
      cancelTask: async (v47) => {
        try {
          if (v5["active"] && String(v5["outNodeId"] || "") === v47["outId"])
            try {
              await v4["cancel"]();
            } catch (v48) {
              console["warn"]("[ImageHD]\x20cancel\x20request\x20failed:", v48);
            }
          return await v19(v47, {
            name: "高清图像 (已取消)",
            outputText: "模型: RH高清放大\n提示词: 高清放大图像\n状态: 已取消",
            notifyMessage: "已取消高清放大任务",
          });
        } finally {
          v5["active"] &&
            String(v5["outNodeId"] || "") === v47["outId"] &&
            v4["reset"](v46);
        }
      },
      cancelTooltip: "取消高清放大",
    }),
    v46["addEventListener"]("click", (v49) => {
      (v49["stopPropagation"](), v49["preventDefault"]());
      if (v5["active"]) {
        (async () => {
          let v50 = null;
          try {
            const v51 = v5["outNodeId"]
              ? {
                  outId: v5["outNodeId"],
                  targetNodeId: v5["outNodeId"],
                  taskId: v5["taskId"],
                  apiKey: v5["apiKey"],
                  sourceNodeId: v2,
                }
              : null;
            v51
              ? await v19(v51, {
                  name: "高清图像\x20(已取消)",
                  outputText:
                    "模型: RH高清放大\n提示词: 高清放大图像\n状态: 已取消",
                  notifyMessage: "已取消高清放大任务",
                })
              : (await v4["cancel"](),
                window["showToast"]?.("已取消任务", "info"));
          } catch (v52) {
            v50 = v52;
          }
          try {
            v50 && console["warn"]("[ImageHD] cancel request failed:", v50);
          } finally {
            v4["reset"](v46);
          }
        })();
        return;
      }
      const v53 = document["querySelector"](".v2-hd-popup");
      if (v53) {
        const v54 = v53["__v2HdAnchorBtn"] && v53["__v2HdAnchorBtn"] === v46,
          v55 =
            typeof v53["__v2HdClose"] === "function"
              ? v53["__v2HdClose"]
              : () => v53["remove"]();
        v55();
        if (v54) return;
      }
      const v56 = document["createElement"]("div");
      ((v56["className"] = "v2-hd-popup node-toolbar-action-menu"),
        (v56["__v2HdAnchorBtn"] = v46));
      const v57 = v37(v46),
        v58 = v57();
      Object["assign"](v56["style"], {
        position: "fixed",
        left: v58["left"] + "px",
        top: v58["top"] + "px",
        transform: "translate(-50%,\x20calc(-100%\x20+\x2010px))",
        opacity: "0",
        pointerEvents: "none",
      });
      const v59 = document["createElement"]("div");
      ((v59["className"] = "node-toolbar-action-menu-title"),
        (v59["textContent"] = "选择高清方案"),
        v56["appendChild"](v59));
      const v60 = [1280, 1920, 2560],
        v61 = () => {
          const v62 = document["createElement"]("div");
          v62["className"] = "node-toolbar-action-menu-item";
          const v63 = document["createElement"]("div");
          v63["className"] = "node-toolbar-action-menu-icon";
          const v64 = document["createElement"]("img");
          ((v64["className"] = "node-toolbar-action-provider-logo"),
            (v64["src"] = "images/RH.png"),
            (v64["alt"] = "runninghub"),
            v63["appendChild"](v64),
            v62["appendChild"](v63));
          const v65 = document["createElement"]("div");
          v65["className"] = "node-toolbar-action-menu-body";
          const v66 = document["createElement"]("span");
          ((v66["className"] = "node-toolbar-action-menu-item-title"),
            (v66["textContent"] = "RH高清放大"),
            v65["appendChild"](v66));
          const v67 = document["createElement"]("span");
          ((v67["className"] = "node-toolbar-action-menu-item-desc"),
            (v67["textContent"] = "RH工作流 一键高清放大图像"),
            v65["appendChild"](v67),
            v62["appendChild"](v65));
          const v68 = document["createElement"]("div");
          ((v68["className"] = "node-toolbar-action-caret"),
            (v68["innerHTML"] = "&gt;"),
            v62["appendChild"](v68));
          let v69 = null,
            v70 = 0,
            v71 = 0,
            v72 = 0,
            v73 = null;
          const v74 = () => {
              if (v70) clearTimeout(v70);
              v70 = 0;
              if (v71) clearTimeout(v71);
              v71 = 0;
              if (v72) cancelAnimationFrame(v72);
              ((v72 = 0),
                v73 &&
                  (document["removeEventListener"]("pointerdown", v73),
                  (v73 = null)));
            },
            v75 = () => {
              if (!v69) return;
              const v76 = v69;
              v69 = null;
              if (v56["__v2HdSubmenuEl"] === v76) v56["__v2HdSubmenuEl"] = null;
              (v62["classList"]["remove"]("is-open"), v74());
              if (document["body"]["contains"](v76)) v76["remove"]();
            },
            v77 = () => {
              if (v71) clearTimeout(v71);
              v71 = 0;
            },
            v78 = () => {
              (v77(), (v71 = setTimeout(() => v75(), 160)));
            },
            v79 = () => {
              if (v69 && document["body"]["contains"](v69)) return v69;
              const v80 = document["querySelector"](".v2-hd-submenu");
              if (v80) v80["remove"]();
              ((v69 = document["createElement"]("div")),
                (v69["className"] =
                  "v2-hd-submenu node-toolbar-action-submenu"),
                (v56["__v2HdSubmenuEl"] = v69),
                v62["classList"]["add"]("is-open"),
                Object["assign"](v69["style"], {
                  position: "fixed",
                  opacity: "0",
                  pointerEvents: "none",
                }));
              const v81 = () => {
                if (
                  !v69 ||
                  !document["body"]["contains"](v69) ||
                  !document["body"]["contains"](v62)
                ) {
                  if (v72) cancelAnimationFrame(v72);
                  v72 = 0;
                  return;
                }
                const v82 = v62["getBoundingClientRect"]();
                if (v82["width"] <= 0 || v82["height"] <= 0) {
                  v72 = requestAnimationFrame(v81);
                  return;
                }
                const v83 = 12,
                  v84 = 8,
                  v85 = v69["offsetWidth"] || 180,
                  v86 = v82["right"] + v83,
                  v87 = v82["left"] - v85 - v83,
                  v88 = window["innerWidth"] - v85 - v84,
                  v89 = v86 <= v88 ? v86 : Math["max"](v84, v87);
                ((v69["style"]["left"] = v89 + "px"),
                  (v69["style"]["top"] = v82["top"] + "px"),
                  (v72 = requestAnimationFrame(v81)));
              };
              ((v72 = requestAnimationFrame(v81)),
                v69["addEventListener"]("pointerenter", (v90) => {
                  if (v90["pointerType"] !== "mouse") return;
                  v77();
                }),
                v69["addEventListener"]("pointerleave", (v91) => {
                  if (v91["pointerType"] !== "mouse") return;
                  v78();
                }));
              const v92 = document["createElement"]("div");
              return (
                (v92["className"] = "node-toolbar-action-menu-title"),
                (v92["textContent"] = "标题放大分辨率"),
                v69["appendChild"](v92),
                v60["forEach"]((v93) => {
                  const v94 = document["createElement"]("div");
                  ((v94["className"] =
                    "node-toolbar-action-menu-item node-toolbar-action-submenu-item"),
                    (v94["textContent"] = v93),
                    v94["addEventListener"]("click", async (v95) => {
                      (v95["stopPropagation"](), v75(), v96());
                      const v97 = v93,
                        v98 = v2,
                        v99 = v46["querySelector"]("svg");
                      if (v99) v99["classList"]["add"]("v2-spinning");
                      const v100 = new AbortController();
                      let v101 = "",
                        v102 = "",
                        v103 = null,
                        v104 = "",
                        v105 = "",
                        v106 = "";
                      try {
                        const v107 = v3(),
                          v108 =
                            v107?.["localPath"] ||
                            (v107?.["images"] &&
                              v107["images"][v107["mainImageIndex"] || 0]?.[
                                "localPath"
                              ]),
                          v109 = v108
                            ? "/" + v108
                            : v107?.["src"] || v107?.["sourceUrl"];
                        if (!v109) {
                          window["showToast"]?.("没有可处理的图像", "error");
                          return;
                        }
                        await v16();
                        const v110 = v15("runninghubwf");
                        v102 = String(v110?.["apiKey"] || "")["trim"]();
                        if (!v102) {
                          window["showToast"]?.(
                            "RunningHUB API Key 未配置",
                            "error",
                          );
                          return;
                        }
                        const v111 = v6["getState"]()["nodes"][v98] || v107;
                        if (!v111) {
                          window["showToast"]?.("找不到原节点", "error");
                          return;
                        }
                        const v112 = await v24(v111, v109),
                          { width: v113, height: v114 } = v11(
                            v112["width"],
                            v112["height"],
                          ),
                          { x: v115, y: v116 } = v17(
                            v6["getState"]()["nodes"],
                            v111,
                            v113,
                            v114,
                          ),
                          v117 = "2012862147813974018",
                          v118 = "runninghub/" + v117,
                          v119 =
                            "source-image-hd-" +
                            Date["now"]() +
                            "-" +
                            Math["random"]()["toString"](36)["slice"](2, 6),
                          v120 =
                            "模型:\x20RH高清放大\x0a提示词:\x20高清放大图像\x0a分辨率:\x20" +
                            v97,
                          v121 = await v7(
                            {
                              sourceNodeId: v111["id"],
                              trigger: "toolbar",
                              taskType: "image-hd",
                              provider: "runninghubwf",
                              adapterType: "workflow",
                              modelId: v118,
                              executionId: "runninghub.image-hd",
                              payload: {
                                apiKey: v102,
                                imgUrl: v109,
                                inputBasis: v112,
                                selectedResolution: v97,
                                outputText: v120,
                              },
                              cancellable: true,
                              resumable: true,
                              onTaskChange: v34,
                              createTargetNode: ({
                                startedAt: v122,
                                startPatch: v123,
                                protocolPatch: v124,
                              }) =>
                                v8({
                                  id: v119,
                                  type: "source-image",
                                  x: v115,
                                  y: v116,
                                  width: v113,
                                  height: v114,
                                  needsAutoResize: false,
                                  name: "高清图像\x20(处理中)",
                                  src: "",
                                  outputText: v120,
                                  localPath: "",
                                  fileName: "hd_" + Date["now"]() + ".jpg",
                                  provider: "runninghubwf",
                                  model: v118,
                                  rhTaskUseOpenapiQuery: false,
                                  ...v123,
                                  ...v124,
                                  generationStartTime: v122,
                                  rhTaskStartedAt: v122,
                                }),
                              submit: async (v125, v126) => {
                                (v33(v111["id"], v126["targetNodeId"]),
                                  v4["activate"]({
                                    button: v46,
                                    apiKey: v102,
                                    abortController: v100,
                                    outNodeId: v126["targetNodeId"],
                                  }));
                                const v127 = await v14([v125["imgUrl"]], v102, {
                                  applyInputQualityProfile: true,
                                  provider: "runninghub",
                                });
                                if (v127["length"] === 0)
                                  throw new Error(
                                    "图像上传失败：processInputImages 返回空数组",
                                  );
                                const v128 = String(v127[0] || "")["trim"]();
                                if (!v128) throw new Error("图像上传失败");
                                v31(v126["targetNodeId"]);
                                const v129 = await v12(
                                  {
                                    apiKey: v102,
                                    workflowId: v117,
                                    addMetadata: false,
                                    nodeInfoList: [
                                      {
                                        nodeId: "416",
                                        fieldName: "image",
                                        fieldValue: v128,
                                      },
                                      {
                                        nodeId: "413",
                                        fieldName: "value",
                                        fieldValue: v97,
                                      },
                                    ],
                                    instanceType: "default",
                                    usePersonalQueue: "false",
                                  },
                                  { signal: v100["signal"] },
                                );
                                v101 = String(
                                  v129?.["data"]?.["taskId"] ||
                                    v129?.["taskId"] ||
                                    "",
                                )["trim"]();
                                if (!v101) throw new Error("任务 ID 未返回");
                                (v4["setTaskId"](v101), v126["onTaskId"](v101));
                                if (
                                  v4["isCancelled"]() ||
                                  v21(v126["targetNodeId"])
                                ) {
                                  await v32({
                                    apiKey: v102,
                                    taskId: v101,
                                    label: "ImageHD",
                                  });
                                  throw v27();
                                }
                                return { taskId: v101 };
                              },
                              poll: async ({
                                taskId: v130,
                                signal: v131,
                                targetNodeId: v132,
                              }) => {
                                if (v4["isCancelled"]() || v21(v132))
                                  throw v27();
                                const v133 = await v13(
                                  { apiKey: v102, taskId: v130 },
                                  { signal: v131, taskKind: "image" },
                                );
                                if (v4["isCancelled"]() || v21(v132))
                                  throw v27();
                                const v134 = v23(v133);
                                if (!v134)
                                  throw new Error("任务完成但未返回图片");
                                return { resultUrl: v134 };
                              },
                              cancel: ({ taskId: v135 }) =>
                                v32({
                                  apiKey: v102,
                                  taskId: v135,
                                  label: "ImageHD",
                                }),
                              resultBuilder: async (v136, v137) => {
                                const v138 = String(v136?.["resultUrl"] || "")[
                                  "trim"
                                ]();
                                if (!v138)
                                  throw new Error("任务完成但未返回图片");
                                v104 = v138;
                                let v139 = null;
                                try {
                                  v139 = await v22(v138, {
                                    projectId:
                                      window["currentProjectId"] ||
                                      "default_v2_project",
                                    includeSrc: true,
                                  });
                                } catch (v140) {
                                  console["error"]("保存图片失败:", v140);
                                }
                                ((v106 = v139?.["localPath"] || ""),
                                  (v105 = v139?.["thumbUrl"] || v138));
                                if (!v106) throw v29();
                                return (
                                  (v103 = await v25(v112, {
                                    localPath: v106,
                                    imageUrl: v138,
                                    sourceUrl: v138,
                                    thumbUrl: v105,
                                    src: v105 || v138,
                                  })),
                                  {
                                    name: "高清图像",
                                    ...v10(v139["fields"], {
                                      startedAt: v137["startedAt"],
                                    }),
                                    ...v139["fields"],
                                    fileName: "hd_" + Date["now"]() + ".jpg",
                                    width: v103["width"],
                                    height: v103["height"],
                                    outputText: v120,
                                  }
                                );
                              },
                              failureBuilder: async (v141, v142) => {
                                const v143 =
                                  v141 instanceof Error
                                    ? v141["message"]
                                    : String(v141 || "未知错误");
                                if (v30(v141))
                                  return (
                                    (v103 ||= await v25(v112, {
                                      localPath: v106,
                                      imageUrl: v104,
                                      sourceUrl: v104,
                                      thumbUrl: v105,
                                      src: v105 || v104,
                                    })),
                                    {
                                      name: "高清图像",
                                      ...v35(),
                                      width: v103["width"],
                                      height: v103["height"],
                                      outputText: v120,
                                      ...v9({
                                        error: v36,
                                        startedAt: v142["startedAt"],
                                      }),
                                      rhStatusMessage: v36,
                                    }
                                  );
                                return {
                                  name: "高清图像 (失败)",
                                  ...v9({
                                    error: v143,
                                    startedAt: v142["startedAt"],
                                  }),
                                  outputText: v120 + "\x0a错误:\x20" + v143,
                                };
                              },
                              cancelledBuilder: () => ({
                                name: "高清图像 (已取消)",
                                outputText:
                                  "模型:\x20RH高清放大\x0a提示词:\x20高清放大图像\x0a状态:\x20已取消",
                              }),
                            },
                            { abortController: v100 },
                          );
                        if (v121["status"] === "success")
                          window["showToast"]?.(
                            "✅ 高清图像生成完成",
                            "success",
                          );
                        else {
                          if (v121["status"] === "failed") {
                            if (v30(v121["error"]))
                              window["showToast"]?.("⚠️ " + v36, "warn");
                            else {
                              const v144 =
                                v121["error"] instanceof Error
                                  ? v121["error"]["message"]
                                  : String(v121["error"] || "未知错误");
                              window["showToast"]?.(
                                "高清放大失败: " + v144,
                                "error",
                              );
                            }
                          } else
                            v121["status"] === "cancelled" &&
                              window["showToast"]?.(
                                "已取消高清放大任务",
                                "info",
                              );
                        }
                      } catch (v145) {
                        const v146 =
                          v145 instanceof Error
                            ? v145["message"]
                            : String(v145 || "");
                        v28(v145)
                          ? window["showToast"]?.("已取消高清放大任务", "info")
                          : (console["error"]("RH高清放大失败:", v145),
                            window["showToast"]?.(
                              "高清放大失败: " + v146,
                              "error",
                            ));
                      } finally {
                        if (v99) v99["classList"]["remove"]("v2-spinning");
                        v4["reset"](v46);
                      }
                    }),
                    v69["appendChild"](v94));
                }),
                document["body"]["appendChild"](v69),
                v69["offsetHeight"],
                (v69["style"]["opacity"] = "1"),
                (v69["style"]["pointerEvents"] = "auto"),
                (v73 = (v147) => {
                  if (!v69) return;
                  if (
                    !v69["contains"](v147["target"]) &&
                    !v62["contains"](v147["target"])
                  )
                    v75();
                }),
                document["addEventListener"]("pointerdown", v73),
                v69
              );
            };
          ((v62["__v2LastPointerType"] = "mouse"),
            v62["addEventListener"]("pointerdown", (v148) => {
              v62["__v2LastPointerType"] = v148["pointerType"] || "mouse";
            }));
          const v149 = () => {
            v77();
            if (v70) clearTimeout(v70);
            v70 = setTimeout(() => v79(), 60);
          };
          return (
            v62["addEventListener"]("pointerenter", (v150) => {
              if (v150["pointerType"] !== "mouse") return;
              v149();
            }),
            v62["addEventListener"]("pointerleave", (v151) => {
              if (v151["pointerType"] !== "mouse") return;
              v78();
            }),
            v62["addEventListener"]("click", (v152) => {
              v152["stopPropagation"]();
              if (v62["__v2LastPointerType"] === "touch") {
                if (v69 && document["body"]["contains"](v69)) v75();
                else v79();
                return;
              }
              v79();
            }),
            v62
          );
        };
      (v56["appendChild"](v61()),
        document["body"]["appendChild"](v56),
        v56["offsetHeight"],
        (v56["style"]["pointerEvents"] = "auto"),
        (v56["style"]["opacity"] = "1"),
        (v56["style"]["transform"] = "translate(-50%, -100%)"));
      const v153 = v26(),
        { openedViewport: v154 } = v153;
      let v155 = 0,
        v156 = null;
      const v157 = () => {
          if (v155) cancelAnimationFrame(v155);
          ((v155 = 0),
            v153["dispose"](),
            v156 &&
              (document["removeEventListener"]("pointerdown", v156),
              (v156 = null)));
        },
        v96 = () => {
          if (v56["__v2HdClosing"]) return;
          ((v56["__v2HdClosing"] = true),
            v157(),
            (v56["style"]["opacity"] = "0"),
            (v56["style"]["pointerEvents"] = "none"),
            (v56["style"]["transform"] = "translate(-50%, calc(-100% + 10px))"),
            setTimeout(() => v56["remove"](), 250));
        };
      v56["__v2HdClose"] = v96;
      const v158 = () => {
        if (
          !document["body"]["contains"](v56) ||
          !document["body"]["contains"](v46)
        ) {
          v157();
          return;
        }
        const v159 = v153["getViewport"]();
        if (
          v159["x"] !== v154["x"] ||
          v159["y"] !== v154["y"] ||
          v159["zoom"] !== v154["zoom"]
        ) {
          v96();
          return;
        }
        if (!v57["isFixed"]) {
          const v160 = v46["getBoundingClientRect"]();
          if (v160["width"] <= 0 || v160["height"] <= 0) {
            v155 = requestAnimationFrame(v158);
            return;
          }
        }
        const v161 = v57();
        ((v56["style"]["left"] = v161["left"] + "px"),
          (v56["style"]["top"] = v161["top"] + "px"),
          (v155 = requestAnimationFrame(v158)));
      };
      ((v155 = requestAnimationFrame(v158)),
        (v156 = (v162) => {
          if (v56["__v2HdClosing"]) return;
          const v163 = v56["__v2HdSubmenuEl"],
            v164 = v56["contains"](v162["target"]),
            v165 = v163 && v163["contains"](v162["target"]);
          if (!v164 && !v165 && v162["target"] !== v46) v96();
        }),
        setTimeout(
          () => document["addEventListener"]("pointerdown", v156),
          10,
        ));
    }));
}
