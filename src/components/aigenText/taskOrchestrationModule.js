import {
  appendAssetMentionToPrompt,
  insertPresetPromptIntoEditor,
  previewPresetPromptInEditor,
  shouldUsePromptPreviewForPreset,
} from "../../modules/nodePromptShared.js";
import { resolvePromptPresetTemplate } from "../../modules/promptPresetTemplate.js";
import {
  isPreviewModeEnabled,
  isPreviewNodeLoading,
  startPreviewNodeLoading,
} from "../../modules/previewMode.js";
import { createPreviewGenerateButtonCallbacks } from "../../modules/previewGenerateButtonUi.js";
import { resolveGenerationInputImageUrl } from "../../services/imageReferenceUrlService.js";
import { submitTask } from "../../core/generationTaskRuntime.js";
import { localPathToUrl } from "../../utils/localMediaPath.js";
import {
  isModelApiModel,
  resolveModelProvider,
} from "../../manifests/index.js";
import {
  buildTextGenerationFailurePatch,
  buildTextGenerationResultPatch,
  isTextGenerationTimeoutError,
} from "./textGenerationResultRenderer.js";
function toLocalPathUrl(v0) {
  return localPathToUrl(v0);
}
function pickResultItem(v1, v2) {
  if (!Array["isArray"](v1) || v1["length"] === 0) return null;
  const v3 = Number(v2),
    v4 = Number["isFinite"](v3) ? Math["max"](0, Math["trunc"](v3)) : 0;
  return v1[Math["min"](v4, v1["length"] - 1)] || null;
}
function resolveImageRefUrl(v5) {
  return resolveGenerationInputImageUrl(v5);
}
function resolveVideoRefUrl(v6) {
  const v7 = pickResultItem(v6?.["videos"], v6?.["mainVideoIndex"]);
  return (
    [
      String(v7?.["videoUrl"] || "")["trim"](),
      String(v7?.["url"] || "")["trim"](),
      String(v7?.["src"] || "")["trim"](),
      toLocalPathUrl(v7?.["localPath"]),
      String(v6?.["videoUrl"] || "")["trim"](),
      String(v6?.["src"] || "")["trim"](),
      toLocalPathUrl(v6?.["localPath"]),
      String(v6?.["thumbUrl"] || "")["trim"](),
      String(v6?.["imageUrl"] || "")["trim"](),
      String(v7?.["thumbUrl"] || "")["trim"](),
      toLocalPathUrl(v7?.["thumbLocalPath"]),
      String(v7?.["poster"] || "")["trim"](),
    ]["find"](Boolean) || ""
  );
}
function resolveAudioRefUrl(v8) {
  return (
    [
      String(v8?.["thumbUrl"] || "")["trim"](),
      String(v8?.["imageUrl"] || "")["trim"](),
      String(v8?.["src"] || "")["trim"](),
      toLocalPathUrl(v8?.["localPath"]),
      String(v8?.["audioUrl"] || "")["trim"](),
    ]["find"](Boolean) || ""
  );
}
function isRunningHubImageToTextModel(v9, v10) {
  return (
    v10 === "runninghub" &&
    isModelApiModel(v9, v10) &&
    String(v9 || "")["endsWith"]("/image-to-text")
  );
}
export function createAIGenTextNodeTaskOrchestrationModule(v11) {
  const {
    store: v12,
    api: v13,
    getDisplayModelName: v14,
    ensureThumbDecoded: v15,
    revealRefThumbMedia: v16,
    commit: v17,
    TEXT_TOOLBAR_HTML: v18,
    bindTextToolbarEvents: v19,
    getPromptPresets: v20,
    openCustomPresetsManager: v21,
    startLoading: v22,
    stopLoading: v23,
    bindRefThumbHoverPreview: v24,
    checkSlashTrigger: v25,
    handleSlashKeyboardNavigation: v26,
    closeSlashMenu: v27,
    activateMenuKeyboard: v28,
    _checkAtTrigger: v29,
    _populateMentionMenu: v30,
    _handleMentionMenuKeyboard: v31,
    _handlePillKeyboard: v32,
    _rehydratePromptPills: v33,
    _handlePillHover: v34,
    _handlePillOut: v35,
    _syncEdgesOrderFromPills: v36,
    _syncPillLabels: v37,
    getCustomTextModels: v38,
    saveCustomTextModels: v39,
  } = v11;
  class v40 {
    async ["_buildPayload"](v41 = null) {
      const v42 = v12["getState"](),
        v43 = v12["getIncomingEdges"](this["nodeId"]),
        v44 = v42["nodes"] || {},
        v45 = { text: [], image: [], video: [], audio: [] },
        v46 = { text: 0, image: 0, video: 0, audio: 0 };
      v43["forEach"]((v47) => {
        const v48 = v44[v47["sourceId"]];
        if (!v48) return;
        let v49 = "";
        const v50 = v48["type"] || "";
        if (v50 === "text" || v50 === "source-text" || v50 === "ai-text")
          v49 = "text";
        else {
          if (v50 === "source-image" || v50 === "ai-image") v49 = "image";
          else {
            if (v50 === "source-video" || v50 === "video" || v50 === "ai-video")
              v49 = "video";
            else {
              if (
                v50 === "source-audio" ||
                v50 === "audio" ||
                v50 === "ai-audio"
              )
                v49 = "audio";
              else v49 = "other";
            }
          }
        }
        let v51 = "",
          v52 = "";
        if (v49 === "text")
          v51 =
            v48["outputText"] ||
            v48["text"] ||
            v48["content"] ||
            v48["prompt"] ||
            "";
        else {
          if (v49 === "image") {
            v52 = resolveImageRefUrl(v48);
            if (!v52) return;
          } else {
            if (v49 === "video") {
              v52 = resolveVideoRefUrl(v48);
              if (!v52) return;
            } else {
              if (v49 === "audio") {
                v52 = resolveAudioRefUrl(v48);
                if (!v52) return;
              } else {
                v52 = String(v48["src"] || v48["imageUrl"] || "")["trim"]();
                if (!v52) return;
              }
            }
          }
        }
        v46[v49]++;
        const v53 = {
            text: "文本",
            image: "图片",
            video: "视频",
            audio: "音频",
            other: "节点",
          },
          v54 = "@" + v53[v49] + v46[v49];
        v45[v49]["push"]({
          label: v54,
          content: v51,
          url: v52,
          used: false,
          type: v49,
          sourceId: String(v47["sourceId"] || ""),
        });
      });
      const v55 = [
          ...v45["text"],
          ...v45["image"],
          ...v45["video"],
          ...v45["audio"],
        ],
        v56 = {},
        v57 = {};
      v55["forEach"]((v58) => {
        v56[v58["label"]["replace"](/\s+/g, "")] = v58;
        if (v58["sourceId"]) v57[v58["sourceId"]] = v58;
      });
      let v59 = [],
        v60 = [],
        v61 = [];
      const v62 = [],
        v63 = { image: 0, video: 0, audio: 0 },
        v64 = (v65) => {
          if (!v65?.["url"]) return;
          if (!v59["includes"](v65["url"])) v59["push"](v65["url"]);
          (v65["type"] === "image" &&
            !v60["includes"](v65["url"]) &&
            v60["push"](v65["url"]),
            v65["type"] === "video" &&
              !v61["includes"](v65["url"]) &&
              v61["push"](v65["url"]));
        },
        v66 = (v67) => {
          let v68 = "";
          const v69 = (v70) => {
            for (const v71 of v70["childNodes"]) {
              if (v71["nodeType"] === Node["TEXT_NODE"])
                v68 += v71["textContent"];
              else {
                if (v71["nodeType"] === Node["ELEMENT_NODE"]) {
                  if (v71["classList"]["contains"]("ref-pill")) {
                    const v72 = v71["dataset"]["nodeId"] || "",
                      v73 =
                        v71["dataset"]["label"] || v71["textContent"]["trim"](),
                      v74 = [];
                    if (
                      appendAssetMentionToPrompt({
                        domNode: v71,
                        rawLabel: v73,
                        promptParts: v74,
                        inputRefs: v62,
                        mediaCounts: v63,
                      })
                    ) {
                      ((v68 += v74["join"]("")), v62["forEach"](v64));
                      continue;
                    }
                    const v75 = v73["replace"](/\s+/g, ""),
                      v76 = (v72 && v57[v72]) || v56[v75];
                    if (v76) {
                      v76["used"] = true;
                      if (v76["content"])
                        v68 += "\x20" + v76["content"] + "\x20";
                      else
                        v76["url"] &&
                          ((v68 += "\x20" + v73 + "\x20"), v64(v76));
                    } else v68 += "\x20" + v73 + "\x20";
                  } else v71["tagName"] === "BR" ? (v68 += "\x0a") : v69(v71);
                }
              }
            }
          };
          if (!v67) return "";
          v69(v67);
          let v77 = v68["replace"](/[\s\u00A0]+/g, "\x20")["trim"]();
          return (
            v41
              ? (v77 = resolvePromptPresetTemplate(v41, v77))
              : (v77 = v77 || ""),
            v77
          );
        };
      let v78 = v66(this["promptEl"]);
      (v55["sort"](
        (v79, v80) => v80["label"]["length"] - v79["label"]["length"],
      ),
        v55["forEach"]((v81) => {
          if (!v81["used"]) {
            const v82 = new RegExp(
              v81["label"]
                ["replace"](/[.*+?^${}()|[\]\\]/g, "\\$&")
                ["replace"](/\s+/g, "[\\s\\u00A0]*"),
              "g",
            );
            if (v82["test"](v78)) {
              v81["used"] = true;
              if (v81["content"])
                v78 = v78["replace"](v82, "\x20" + v81["content"] + "\x20");
              else
                v81["url"] &&
                  ((v78 = v78["replace"](
                    v82,
                    "\x20" + v81["label"]["trim"]() + "\x20",
                  )),
                  v64(v81));
            }
          }
        }));
      let v83 = "";
      v45["text"]["forEach"]((v84) => {
        !v84["used"] &&
          v84["content"] &&
          ((v83 += v84["content"] + "\x0a"), (v84["used"] = true));
      });
      v83 && (v78 = v83 + v78);
      v55["forEach"]((v85) => {
        !v85["used"] && v85["url"] && !v59["includes"](v85["url"]) && v64(v85);
      });
      if (!v78)
        return (window["showToast"]?.("请输入提示词后再生成", "warn"), null);
      const v86 = this["_data"]["model"] || "apimart/kimi-k2-instruct";
      let v87 = this["_data"]["provider"];
      !v87 &&
        (v87 =
          resolveModelProvider(v86) ||
          ((v86["startsWith"]("gemini") ||
            v86["startsWith"]("gpt") ||
            v86["startsWith"]("claude")) &&
          !v86["includes"]("/")
            ? "grsai"
            : "openai"));
      const v88 = v38();
      v88["includes"](v86) && (v87 = "custom");
      if (isRunningHubImageToTextModel(v86, v87) && v60["length"] === 0)
        return (window["showToast"]?.("该模型需要图片参考", "warn"), null);
      return {
        prompt: v78,
        inputUrls: v59,
        inputImageUrls: v60,
        inputVideoUrls: v61,
        model: v86,
        provider: v87,
        nodeId: this["nodeId"],
      };
    }
    ["_getPreviewGenerateButtonLoadingOptions"]() {
      return createPreviewGenerateButtonCallbacks(this, "生成");
    }
    async ["_onGenerate"](v89 = null, v90 = {}) {
      if (this["_isGenerating"]) return;
      if (v90?.["insertPrompt"] === true) {
        (insertPresetPromptIntoEditor({
          storeApi: v12,
          nodeId: this["nodeId"],
          promptEl: this["promptEl"],
          template: v89,
          inEdges: v12["getIncomingEdges"](this["nodeId"]),
          nodes: v12["getState"]()["nodes"] || {},
          allowedAssetTypes: ["text", "image", "video", "audio"],
        }),
          this["_updateSubmitButtonState"]?.());
        return;
      }
      if (shouldUsePromptPreviewForPreset(v89)) {
        const v91 = await this["_buildPayload"](v89);
        if (!v91) return;
        previewPresetPromptInEditor({
          storeApi: v12,
          nodeId: this["nodeId"],
          promptEl: this["promptEl"],
          promptText: v91["prompt"],
        });
        return;
      }
      if (isPreviewModeEnabled()) {
        !isPreviewNodeLoading(this["nodeId"]) &&
          startPreviewNodeLoading(
            this["nodeId"],
            this["previewEl"],
            this["_getPreviewGenerateButtonLoadingOptions"](),
          );
        return;
      }
      const v92 = await this["_buildPayload"](v89);
      if (!v92) return;
      ((this["_isGenerating"] = true), v22(this["previewEl"]));
      const v93 = Date["now"]();
      this["_updateSubmitButtonState"]?.();
      let v94 = null;
      try {
        v94 = await submitTask(
          {
            sourceNodeId: this["nodeId"],
            targetNodeId: this["nodeId"],
            trigger: "node",
            taskType: "text-generation",
            provider: v92["provider"] || this["_data"]["provider"] || "",
            adapterType: "modelApi",
            modelId: v92["model"] || this["_data"]["model"] || "",
            executionId:
              "text." +
              (v92["provider"] || this["_data"]["provider"] || "modelApi") +
              "." +
              (v92["model"] || this["_data"]["model"] || "default"),
            payload: v92,
            cancellable: false,
            resumable: false,
            async: false,
            submit: () => v13["generateText"](v92),
            resultBuilder: async (v95, v96) => {
              const v97 = buildTextGenerationResultPatch(v95, {
                  startedAt: v96["startedAt"],
                }),
                v98 = String(v97?.["outputText"] || "")["trim"]();
              return (
                v98 && this["outputEl"] && this["_renderOutputText"]?.(v98),
                v97
              );
            },
            failureBuilder: (v99, v100) => {
              const v101 = buildTextGenerationFailurePatch({
                  error: v99 || "文本生成失败",
                  startedAt: v100["startedAt"],
                }),
                v102 = String(v101?.["outputText"] || "")["trim"]();
              return (
                v102 && this["outputEl"] && this["_renderOutputText"]?.(v102),
                v101
              );
            },
            parseError: (v103) => v103?.["message"] || "文本生成失败",
          },
          { store: v12, startedAt: v93 },
        );
        if (v94["status"] === "failed") {
          const v104 = v94["error"];
          (console["error"]("[AIGenTextNode] 生成失败:", v104),
            !isTextGenerationTimeoutError(v104) &&
              window["showToast"]?.(
                "文本生成失败: " + (v104?.["message"] || v104),
                "error",
              ));
        }
        return v94;
      } finally {
        ((this["_isGenerating"] = false),
          this["_updateSubmitButtonState"]?.(),
          v23(this["previewEl"]));
      }
    }
  }
  return v40["prototype"];
}
