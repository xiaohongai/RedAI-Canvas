export function bindImageAutoSubjectAction(v0) {
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
      runRunninghubAiApp: v12,
      resumeRunninghubWorkflowTask: v13,
      processInputImages: v14,
      getProviderConfig: v15,
      ensureConfig: v16,
      calcSafeSpawnPosNearNode: v17,
      bindRunningHubToolbarTaskButton: v18,
      cancelRunningHubResultTask: v19,
      findRunningHubToolbarTaskForNode: v20,
      isRunningHubToolbarTaskCancelled: v21,
      buildToolbarImageFields: v22,
      saveRemoteImageResultLocally: v23,
      extractFirstImageUrl: v24,
      parseRhCode: v25,
      parseRhTaskId: v26,
      resolveApiInputRatioBasis: v27,
      resolveFinalResultDisplaySize: v28,
      createViewportSnapshotTracker: v29,
      createToolbarCancelledError: v30,
      isToolbarCancelledError: v31,
      createLocalSaveFailureError: v32,
      isLocalSaveFailure: v33,
      throwIfToolbarTaskCancelled: v34,
      cancelRunningHubRemoteTaskQuietly: v35,
      focusToolbarTaskNodes: v36,
      notifyImageToolbarTaskChange: v37,
      buildClearedImageMediaFields: v38,
      IMAGE_LOCAL_SAVE_FAILURE_MESSAGE: v39,
    } = v0,
    v40 = v1["querySelector"](".act-auto-subject");
  if (v40) {
    const v41 = "rh-matting",
      v42 = "RH抠图",
      v43 = "runninghub/2042329021530247170",
      v44 = [
        { key: "transparent", label: "透明背景" },
        { key: "white", label: "白色背景" },
        { key: "black", label: "黑色背景" },
        { key: "gray", label: "灰色背景" },
      ],
      v45 = () => {
        v40["dataset"]["tooltip"] = "自动识别主体";
      };
    v45();
    const v46 = (v47) => {
      const v48 = v47?.["closest"]?.(".v2-img-toolbar-more-menu"),
        v49 = v48?.["getBoundingClientRect"]?.(),
        v50 = v47["getBoundingClientRect"]();
      if (v49 && v49["width"] > 0 && v49["height"] > 0) {
        const v51 = {
            left: v50["left"] + v50["width"] / 2,
            top: v49["top"] - 12,
          },
          v52 = () => v51;
        return ((v52["isFixed"] = true), v52);
      }
      const v53 = () => {
        const v54 = v47["getBoundingClientRect"]();
        return { left: v54["left"] + v54["width"] / 2, top: v54["top"] - 12 };
      };
      return ((v53["isFixed"] = false), v53);
    };
    v18({
      button: v40,
      getTask: () =>
        v20(v2, {
          models: [v43],
          taskTypes: ["image-auto-subject"],
          outputTextIncludes: ["RH抠图"],
        }),
      cancelTask: (v55) =>
        v19(v55, {
          name: "主体识别图像 (已取消)",
          outputText: "模型: RH抠图\n状态: 已取消",
          notifyMessage: "已取消主体识别任务",
        }),
      cancelTooltip: "取消主体识别",
    });
    let v56 = null,
      v57 = null,
      v58 = null,
      v59 = 0,
      v60 = 0,
      v61 = 0,
      v62 = null,
      v63 = null,
      v64 = null,
      v65 = null;
    const v66 = () => {
        if (v61) clearTimeout(v61);
        v61 = 0;
        if (v60) cancelAnimationFrame(v60);
        ((v60 = 0),
          v63 &&
            (document["removeEventListener"]("pointerdown", v63),
            (v63 = null)));
      },
      v67 = () => {
        if (!v57) return;
        const v68 = v57;
        v57 = null;
        if (v58) v58["classList"]["remove"]("is-open");
        v66();
        if (document["body"]["contains"](v68)) v68["remove"]();
        if (v58) v58["__v2SubjectSubOpen"] = false;
      },
      v69 = () => {
        if (!v57) return;
        v57["querySelectorAll"](".v2-subject-bg-item")["forEach"]((v70) => {
          ((v70["__v2IsActive"] = false),
            v70["classList"]["remove"]("is-active"));
        });
      },
      v71 = () => {
        if (!v56) return;
        const v72 = v56;
        ((v56 = null), (v58 = null), v67());
        v62 &&
          (document["removeEventListener"]("pointerdown", v62), (v62 = null));
        v64 &&
          (v1["removeEventListener"]("pointerdown", v64, true), (v64 = null));
        (v65?.["dispose"](), (v65 = null));
        if (v59) cancelAnimationFrame(v59);
        v59 = 0;
        if (!document["body"]["contains"](v72)) return;
        ((v72["style"]["opacity"] = "0"),
          (v72["style"]["pointerEvents"] = "none"),
          (v72["style"]["transform"] = "translate(-50%, calc(-100% + 10px))"),
          setTimeout(() => {
            if (document["body"]["contains"](v72)) v72["remove"]();
          }, 250));
      },
      v73 = () => {
        if (v61) clearTimeout(v61);
        v61 = setTimeout(() => v67(), 160);
      },
      v74 = () => {
        if (v61) clearTimeout(v61);
        v61 = 0;
      },
      v75 = (v76) => {
        if (v57 && document["body"]["contains"](v57)) return (v69(), v57);
        const v77 = document["querySelector"](".v2-subject-submenu");
        if (v77) v77["remove"]();
        ((v57 = document["createElement"]("div")),
          (v57["className"] = "v2-subject-submenu node-toolbar-action-submenu"),
          v76["classList"]["add"]("is-open"),
          Object["assign"](v57["style"], {
            position: "fixed",
            opacity: "0",
            pointerEvents: "none",
          }));
        const v78 = () => {
          if (
            !v57 ||
            !document["body"]["contains"](v57) ||
            !document["body"]["contains"](v76)
          ) {
            if (v60) cancelAnimationFrame(v60);
            v60 = 0;
            return;
          }
          const v79 = v76["getBoundingClientRect"]();
          if (v79["width"] <= 0 || v79["height"] <= 0) {
            v60 = requestAnimationFrame(v78);
            return;
          }
          const v80 = 12,
            v81 = 8,
            v82 = v57["offsetWidth"] || 180,
            v83 = v79["right"] + v80,
            v84 = v79["left"] - v82 - v80,
            v85 = window["innerWidth"] - v82 - v81,
            v86 = v83 <= v85 ? v83 : Math["max"](v81, v84);
          ((v57["style"]["left"] = v86 + "px"),
            (v57["style"]["top"] = v79["top"] + "px"),
            (v57["style"]["transform"] = "translate(0, 0)"),
            (v60 = requestAnimationFrame(v78)));
        };
        ((v60 = requestAnimationFrame(v78)),
          v57["addEventListener"]("pointerenter", (v87) => {
            if (v87["pointerType"] !== "mouse") return;
            v74();
          }),
          v57["addEventListener"]("pointerleave", (v88) => {
            if (v88["pointerType"] !== "mouse") return;
            v73();
          }));
        const v89 = document["createElement"]("div");
        return (
          (v89["className"] = "node-toolbar-action-menu-title"),
          (v89["textContent"] = "选择背景色"),
          v57["appendChild"](v89),
          v44["forEach"]((v90) => {
            const v91 = document["createElement"]("div");
            ((v91["className"] =
              "v2-subject-bg-item\x20node-toolbar-action-menu-item\x20node-toolbar-action-submenu-item"),
              (v91["dataset"]["bgKey"] = v90["key"]),
              (v91["textContent"] = v90["label"]),
              v91["addEventListener"]("click", (v92) => {
                v92["stopPropagation"]();
                const v93 = { transparent: 0, white: 1, black: 2, gray: 3 },
                  v94 = v93[v90["key"]];
                if (v94 === undefined) {
                  window["showToast"]?.("背景色参数无效", "error");
                  return;
                }
                (v67(),
                  v71(),
                  (async () => {
                    const v95 = "模型:\x20RH抠图\x0a背景:\x20" + v90["label"];
                    let v96 = null,
                      v97 = "",
                      v98 = "",
                      v99 = "";
                    try {
                      const v100 = v3() || {},
                        v101 =
                          v100?.["localPath"] ||
                          (v100?.["images"] &&
                            v100["images"][v100["mainImageIndex"] || 0]?.[
                              "localPath"
                            ]),
                        v102 = v8(v101) || v7(v100);
                      if (!v102) {
                        window["showToast"]?.("没有可处理的图像", "error");
                        return;
                      }
                      await v16();
                      const v103 = v15("runninghubwf"),
                        v104 = String(v103?.["apiKey"] || "")["trim"]();
                      if (!v104) {
                        window["showToast"]?.(
                          "RunningHUB API Key 未配置",
                          "error",
                        );
                        return;
                      }
                      const v105 = v4["getState"]()["nodes"][v2] || v100;
                      if (!v105) {
                        window["showToast"]?.("找不到原节点", "error");
                        return;
                      }
                      const v106 = await v27(v105, v102),
                        { width: v107, height: v108 } = v11(
                          v106["width"],
                          v106["height"],
                        ),
                        { x: v109, y: v110 } = v17(
                          v4["getState"]()["nodes"],
                          v105,
                          v107,
                          v108,
                        ),
                        v111 =
                          "source-image-subject-" +
                          Date["now"]() +
                          "-" +
                          Math["random"]()["toString"](36)["slice"](2, 6),
                        v112 = await v5({
                          sourceNodeId: v105["id"],
                          trigger: "toolbar",
                          taskType: "image-auto-subject",
                          provider: "runninghubwf",
                          adapterType: "workflow",
                          modelId: v43,
                          executionId: "runninghub.image-auto-subject",
                          payload: {
                            apiKey: v104,
                            bgIndex: v94,
                            imgUrl: v102,
                            inputBasis: v106,
                            outputText: v95,
                          },
                          cancellable: true,
                          resumable: true,
                          onTaskChange: v37,
                          createTargetNode: ({
                            startedAt: v113,
                            startPatch: v114,
                            protocolPatch: v115,
                          }) =>
                            v6({
                              id: v111,
                              type: "source-image",
                              x: v109,
                              y: v110,
                              width: v107,
                              height: v108,
                              needsAutoResize: false,
                              name: "主体识别图像\x20(处理中)",
                              src: "",
                              outputText: v95,
                              localPath: "",
                              fileName: "subject_" + Date["now"]() + ".png",
                              provider: "runninghubwf",
                              model: v43,
                              rhTaskUseOpenapiQuery: true,
                              ...v114,
                              ...v115,
                              generationStartTime: v113,
                              rhTaskStartedAt: v113,
                            }),
                          submit: async (v116, v117) => {
                            v36(v105["id"], v117["targetNodeId"]);
                            const v118 = await v14([v116["imgUrl"]], v104, {
                                applyInputQualityProfile: true,
                                provider: "runninghub",
                              }),
                              v119 = String(v118?.[0] || "")["trim"]();
                            if (!v119) throw new Error("图片上传失败");
                            v34(v117["targetNodeId"]);
                            const v120 = await v12(
                                {
                                  apiKey: v104,
                                  appId: "2042329021530247170",
                                  nodeInfoList: [
                                    {
                                      nodeId: "5",
                                      fieldName: "image",
                                      fieldValue: v119,
                                      description: "上传图片",
                                    },
                                    {
                                      nodeId: "7",
                                      fieldName: "index",
                                      fieldValue: v94,
                                      description: "背景颜色",
                                    },
                                  ],
                                  instanceType: "default",
                                  usePersonalQueue: "false",
                                },
                                { signal: v117["signal"] },
                              ),
                              v121 = v25(v120);
                            if (v121 !== null && v121 !== 0)
                              throw new Error(
                                String(
                                  v120?.["msg"] ||
                                    v120?.["message"] ||
                                    "创建任务失败",
                                ),
                              );
                            const v122 = v26(v120);
                            if (v122) v117["onTaskId"](v122);
                            if (v21(v117["targetNodeId"])) {
                              await v35({
                                apiKey: v104,
                                taskId: v122,
                                label: "AutoSubject",
                              });
                              throw v30();
                            }
                            return v122
                              ? { taskId: v122 }
                              : { result: { resultUrl: v24(v120) } };
                          },
                          poll: async ({
                            taskId: v123,
                            signal: v124,
                            targetNodeId: v125,
                          }) => {
                            const v126 = v123
                                ? await v13(
                                    { apiKey: v104, taskId: v123 },
                                    {
                                      signal: v124,
                                      useOpenapiQuery: true,
                                      taskKind: "image",
                                    },
                                  )
                                : null,
                              v127 = v24(v126);
                            v34(v125);
                            if (!v127) throw new Error("任务完成但未返回图片");
                            return { resultUrl: v127 };
                          },
                          cancel: ({ taskId: v128 }) =>
                            v35({
                              apiKey: v104,
                              taskId: v128,
                              label: "AutoSubject",
                            }),
                          resultBuilder: async (v129, v130) => {
                            const v131 = String(v129?.["resultUrl"] || "")[
                              "trim"
                            ]();
                            if (!v131) throw new Error("任务完成但未返回图片");
                            v97 = v131;
                            let v132 = v22({
                              localPath: "",
                              resultUrl: v131,
                              thumbUrl: v131,
                            });
                            ((v98 = v131), (v99 = ""));
                            try {
                              const v133 = await v23(v131, {
                                projectId:
                                  window["currentProjectId"] ||
                                  "default_v2_project",
                              });
                              ((v132 = v133["fields"]),
                                (v98 = v133["thumbUrl"] || v131),
                                (v99 = v133["localPath"] || ""));
                            } catch (v134) {
                              console["warn"](
                                "[AutoSubject] saveRemoteImageLocally failed:",
                                v134,
                              );
                            }
                            v96 = await v28(v106, {
                              localPath: v99,
                              imageUrl: v131,
                              sourceUrl: v131,
                              thumbUrl: v98,
                              src: v98 || v131,
                            });
                            if (!v99) throw v32();
                            return (
                              v4["updateNodeData"](v2, {
                                subjectDetectMode: v41,
                                subjectDetectBackground: v90["key"],
                              }),
                              {
                                name: "主体识别图像",
                                ...v10(v132, { startedAt: v130["startedAt"] }),
                                ...v132,
                                fileName: "subject_" + Date["now"]() + ".png",
                                width: v96["width"],
                                height: v96["height"],
                                outputText: v95,
                              }
                            );
                          },
                          failureBuilder: async (v135, v136) => {
                            const v137 =
                              v135 instanceof Error
                                ? v135["message"]
                                : String(v135 || "未知错误");
                            if (v33(v135))
                              return (
                                (v96 ||= await v28(v106, {
                                  localPath: v99,
                                  imageUrl: v97,
                                  sourceUrl: v97,
                                  thumbUrl: v98,
                                  src: v98 || v97,
                                })),
                                {
                                  name: "主体识别图像",
                                  ...v38(),
                                  fileName: "subject_" + Date["now"]() + ".png",
                                  width: v96["width"],
                                  height: v96["height"],
                                  outputText: v95,
                                  ...v9({
                                    error: v39,
                                    startedAt: v136["startedAt"],
                                  }),
                                  rhStatusMessage: v39,
                                }
                              );
                            return {
                              name: "主体识别图像\x20(失败)",
                              ...v9({
                                error: v137,
                                startedAt: v136["startedAt"],
                              }),
                              outputText: v95 + "\n错误: " + v137,
                            };
                          },
                          cancelledBuilder: () => ({
                            name: "主体识别图像 (已取消)",
                            outputText: "模型: RH抠图\n状态: 已取消",
                          }),
                        });
                      v45();
                      if (v112["status"] === "success")
                        window["showToast"]?.(
                          "✅ 主体识别完成（" + v90["label"] + "）",
                          "success",
                        );
                      else {
                        if (v112["status"] === "failed") {
                          if (v33(v112["error"]))
                            window["showToast"]?.("⚠️ " + v39, "warn");
                          else {
                            const v138 =
                              v112["error"] instanceof Error
                                ? v112["error"]["message"]
                                : String(v112["error"] || "未知错误");
                            window["showToast"]?.(
                              "主体识别失败:\x20" + v138,
                              "error",
                            );
                          }
                        } else
                          v112["status"] === "cancelled" &&
                            window["showToast"]?.("已取消主体识别任务", "info");
                      }
                    } catch (v139) {
                      const v140 =
                        v139 instanceof Error
                          ? v139["message"]
                          : String(v139 || "未知错误");
                      if (v31(v139)) {
                        window["showToast"]?.("已取消主体识别任务", "info");
                        return;
                      }
                      window["showToast"]?.("主体识别失败: " + v140, "error");
                    }
                  })());
              }),
              v57["appendChild"](v91));
          }),
          document["body"]["appendChild"](v57),
          v69(),
          v57["offsetHeight"],
          (v57["style"]["opacity"] = "1"),
          (v57["style"]["pointerEvents"] = "auto"),
          (v63 = (v141) => {
            if (!v57) return;
            !v57["contains"](v141["target"]) &&
              !v76["contains"](v141["target"]) &&
              v67();
          }),
          document["addEventListener"]("pointerdown", v63),
          v57
        );
      },
      v142 = () => {
        if (v56 && document["body"]["contains"](v56)) return v56;
        const v143 = document["querySelector"](".v2-hd-popup");
        if (v143) {
          if (typeof v143["__v2HdClose"] === "function") v143["__v2HdClose"]();
          else v143["remove"]();
        }
        const v144 = document["querySelector"](".v2-subject-popup");
        if (v144) {
          if (typeof v144["__v2SubjectClose"] === "function")
            v144["__v2SubjectClose"]();
          else v144["remove"]();
        }
        ((v56 = document["createElement"]("div")),
          (v56["className"] = "v2-subject-popup node-toolbar-action-menu"));
        const v145 = v46(v40),
          v146 = v145();
        Object["assign"](v56["style"], {
          position: "fixed",
          left: v146["left"] + "px",
          top: v146["top"] + "px",
          transform: "translate(-50%, calc(-100% + 10px))",
          opacity: "0",
          pointerEvents: "none",
        });
        const v147 = document["createElement"]("div");
        ((v147["className"] = "node-toolbar-action-menu-title"),
          (v147["textContent"] = "选中识别模式"),
          v56["appendChild"](v147),
          (v58 = document["createElement"]("div")),
          (v58["className"] = "node-toolbar-action-menu-item"));
        const v148 = document["createElement"]("div");
        v148["className"] = "node-toolbar-action-menu-icon";
        const v149 = document["createElement"]("img");
        ((v149["className"] = "node-toolbar-action-provider-logo"),
          (v149["src"] = "images/RH.png"),
          (v149["alt"] = "runninghub"),
          v148["appendChild"](v149),
          v58["appendChild"](v148));
        const v150 = document["createElement"]("div");
        v150["className"] = "node-toolbar-action-menu-body";
        const v151 = document["createElement"]("span");
        ((v151["className"] = "node-toolbar-action-menu-item-title"),
          (v151["textContent"] = v42),
          v150["appendChild"](v151));
        const v152 = document["createElement"]("span");
        ((v152["className"] = "node-toolbar-action-menu-item-desc"),
          (v152["textContent"] = "RH工作流 一键自动识别主体"),
          v150["appendChild"](v152),
          v58["appendChild"](v150));
        const v153 = document["createElement"]("div");
        ((v153["className"] = "node-toolbar-action-caret"),
          (v153["innerHTML"] = "&gt;"),
          v58["appendChild"](v153),
          (v58["__v2LastPointerType"] = "mouse"),
          (v58["__v2SubjectSubOpen"] = false),
          v58["addEventListener"]("pointerdown", (v154) => {
            v58["__v2LastPointerType"] = v154["pointerType"] || "mouse";
          }),
          v58["addEventListener"]("click", (v155) => {
            v155["stopPropagation"]();
            if (v58["__v2LastPointerType"] === "touch") {
              v57 && document["body"]["contains"](v57)
                ? v67()
                : (v75(v58), (v58["__v2SubjectSubOpen"] = true));
              return;
            }
            (v75(v58), (v58["__v2SubjectSubOpen"] = true));
          }),
          v58["addEventListener"]("pointerenter", (v156) => {
            if (v156["pointerType"] !== "mouse") return;
            (v74(), v75(v58), (v58["__v2SubjectSubOpen"] = true));
          }),
          v58["addEventListener"]("pointerleave", (v157) => {
            if (v157["pointerType"] !== "mouse") return;
            v73();
          }),
          v56["appendChild"](v58),
          document["body"]["appendChild"](v56),
          v56["offsetHeight"],
          (v56["style"]["pointerEvents"] = "auto"),
          (v56["style"]["opacity"] = "1"),
          (v56["style"]["transform"] = "translate(-50%, -100%)"),
          (v65 = v29()));
        const { openedViewport: v158 } = v65;
        v56["__v2SubjectClose"] = v71;
        const v159 = () => {
          if (
            !document["body"]["contains"](v56) ||
            !document["body"]["contains"](v40)
          ) {
            if (v59) cancelAnimationFrame(v59);
            ((v59 = 0), v65?.["dispose"](), (v65 = null));
            return;
          }
          const v160 = v65["getViewport"]();
          if (
            v160["x"] !== v158["x"] ||
            v160["y"] !== v158["y"] ||
            v160["zoom"] !== v158["zoom"]
          ) {
            v71();
            return;
          }
          if (!v145["isFixed"]) {
            const v161 = v40["getBoundingClientRect"]();
            if (v161["width"] <= 0 || v161["height"] <= 0) {
              v59 = requestAnimationFrame(v159);
              return;
            }
          }
          const v162 = v145();
          ((v56["style"]["left"] = v162["left"] + "px"),
            (v56["style"]["top"] = v162["top"] + "px"),
            (v59 = requestAnimationFrame(v159)));
        };
        return (
          (v59 = requestAnimationFrame(v159)),
          (v62 = (v163) => {
            if (!v56) return;
            const v164 = v56["contains"](v163["target"]),
              v165 = v57 && v57["contains"](v163["target"]);
            !v164 && !v165 && v163["target"] !== v40 && v71();
          }),
          (v64 = (v166) => {
            if (!v56) return;
            const v167 = v166["target"]?.["closest"]?.(".ftb-btn");
            if (!v167) return;
            if (v167["classList"]["contains"]("act-auto-subject")) return;
            v71();
          }),
          setTimeout(() => {
            v62 && document["addEventListener"]("pointerdown", v62);
          }, 10),
          v64 && v1["addEventListener"]("pointerdown", v64, true),
          v56
        );
      };
    v40["addEventListener"]("click", (v168) => {
      (v168["stopPropagation"](), v168["preventDefault"]());
      if (v56 && document["body"]["contains"](v56)) {
        v71();
        return;
      }
      v142();
    });
  }
}
