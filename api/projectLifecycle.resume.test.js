import test from "node:test";
import strict from "node:assert/strict";
import { createProjectLifecycle } from "../src/modules/app/projectLifecycle.js";
function createMemoryLocalStorage(v0 = {}) {
  const v1 = new Map(Object["entries"](v0));
  return {
    getItem(v2) {
      return v1["has"](v2) ? String(v1["get"](v2)) : null;
    },
    setItem(v3, v4) {
      v1["set"](v3, String(v4));
    },
    removeItem(v5) {
      v1["delete"](v5);
    },
    dump() {
      return v1;
    },
  };
}
(test(
  "projectLifecycle: 仅有 getMultiData 时仍能写入同步恢复备份",
  { concurrency: false },
  async () => {
    const v6 = globalThis["window"],
      v7 = globalThis["document"],
      v8 = console["warn"];
    try {
      console["warn"] = () => {};
      const v9 = createMemoryLocalStorage();
      ((globalThis["window"] = {
        localStorage: v9,
        currentProjectId: "proj-legacy",
        showToast: () => {},
      }),
        (globalThis["document"] = {
          getElementById(v10) {
            if (v10 === "projectNameText") return { textContent: "旧接口测试" };
            return null;
          },
          querySelector() {
            return null;
          },
        }));
      const v11 = {
          activeCanvasId: "c1",
          canvases: [
            {
              id: "c1",
              name: "画布旧接口",
              nodes: [
                {
                  id: "img-running",
                  type: "ai-image",
                  model: "runninghub-model/rhart-image-v1",
                  provider: "runninghub",
                  rhTaskId: "rh-img-legacy",
                  rhTaskStatus: "pending",
                  rhTaskStartedAt: 111,
                },
              ],
              edges: [],
              viewport: { x: 0, y: 0, zoom: 1.1 },
              assets: [],
            },
          ],
        },
        v12 = createProjectLifecycle({
          store: {
            subscribeSelector() {},
            getStateRaw() {
              return { nodes: {} };
            },
            updateNodeData() {},
          },
          CanvasTabManager: {
            getMultiData() {
              return v11;
            },
            get _canvases() {
              return [];
            },
          },
          project: {
            resolveCanvasData(v13) {
              return v13;
            },
            async loadProject() {
              return { canvases: [], activeCanvasId: null };
            },
            async saveProject() {},
            async saveRemoteImageLocally() {
              return "/output/mock.png";
            },
          },
          loadCustomPresets() {},
          async migrateLegacyThumbnailsInMultiData(v14) {
            return { changed: false, multiData: v14 };
          },
          sanitizeMultiCanvasDataForPersistence(v15) {
            return v15;
          },
          commit() {},
          patchStoreSourceNodeNamesFromFileName() {},
          applySourceNamesFromFileNameToCanvas() {},
        });
      (v12["triggerLocalCacheSave"](),
        await new Promise((v16) => setTimeout(v16, 0)));
      const v17 = v9["dump"]()["get"]("tapnow_v2_dreamina_resume_backup");
      strict["ok"](v17);
      const v18 = JSON["parse"](v17);
      (strict["equal"](v18["projectId"], "proj-legacy"),
        strict["equal"](Array["isArray"](v18["items"]), true),
        strict["equal"](v18["items"]["length"], 1));
    } finally {
      ((console["warn"] = v8),
        (globalThis["window"] = v6),
        (globalThis["document"] = v7));
    }
  },
),
  test(
    "projectLifecycle: ai-image/ai-audio/source-audio RunningHub 进行中任务会写入同步恢复备份",
    { concurrency: false },
    async () => {
      const v19 = globalThis["window"],
        v20 = globalThis["document"],
        v21 = console["warn"];
      try {
        console["warn"] = () => {};
        const v22 = createMemoryLocalStorage();
        ((globalThis["window"] = {
          localStorage: v22,
          currentProjectId: "proj-rh",
          showToast: () => {},
        }),
          (globalThis["document"] = {
            getElementById(v23) {
              if (v23 === "projectNameText") return { textContent: "恢复测试" };
              return null;
            },
            querySelector() {
              return null;
            },
          }));
        const v24 = {
            activeCanvasId: "c1",
            canvases: [
              {
                id: "c1",
                name: "画布1",
                nodes: [
                  {
                    id: "img-running",
                    type: "ai-image",
                    model: "runninghub-model/rhart-image-v1",
                    provider: "runninghub",
                    rhTaskId: "rh-img-1",
                    rhTaskStatus: "pending",
                    rhTaskStartedAt: 111,
                    rhTaskUseOpenapiQuery: true,
                  },
                  {
                    id: "aud-running",
                    type: "ai-audio",
                    provider: "runninghubwf",
                    model: "indextts2_clone",
                    rhTaskId: "rh-aud-1",
                    rhTaskStatus: "running",
                    rhTaskStartedAt: 222,
                  },
                  {
                    id: "img-success",
                    type: "ai-image",
                    model: "runninghub/2050306122774532097",
                    provider: "runninghubwf",
                    rhTaskId: "rh-img-success",
                    rhTaskStatus: "success",
                  },
                  {
                    id: "src-video-running",
                    type: "source-video",
                    model: "runninghub/video_matting",
                    provider: "runninghubwf",
                    rhTaskId: "rh-video-1",
                    rhTaskStatus: "running",
                    rhTaskStartedAt: 333,
                  },
                  {
                    id: "src-image-running",
                    type: "source-image",
                    model: "runninghub/2012862147813974018",
                    provider: "runninghubwf",
                    rhTaskId: "rh-src-image-1",
                    rhTaskStatus: "pending",
                    rhTaskStartedAt: 444,
                    rhTaskUseOpenapiQuery: false,
                  },
                  {
                    id: "src-audio-running",
                    type: "source-audio",
                    model: "runninghub/2047408096384917505",
                    provider: "runninghubwf",
                    rhTaskId: "rh-src-audio-1",
                    rhTaskStatus: "running",
                    rhTaskStartedAt: 555,
                    rhTaskUseOpenapiQuery: true,
                    audioSplitRole: "vocals",
                    audioSplitPeerId: "src-audio-peer",
                  },
                ],
                edges: [],
                viewport: { x: 0, y: 0, zoom: 1.1 },
                assets: [],
              },
            ],
          },
          v25 = createProjectLifecycle({
            store: {
              subscribeSelector() {},
              getStateRaw() {
                return { nodes: {} };
              },
              updateNodeData() {},
            },
            CanvasTabManager: {
              getMultiData() {
                return v24;
              },
              get _canvases() {
                return [];
              },
            },
            project: {
              resolveCanvasData(v26) {
                return v26;
              },
              async loadProject() {
                return { canvases: [], activeCanvasId: null };
              },
              async saveProject() {},
              async saveRemoteImageLocally() {
                return "/output/mock.png";
              },
            },
            loadCustomPresets() {},
            async migrateLegacyThumbnailsInMultiData(v27) {
              return { changed: false, multiData: v27 };
            },
            sanitizeMultiCanvasDataForPersistence(v28) {
              return v28;
            },
            commit() {},
            patchStoreSourceNodeNamesFromFileName() {},
            applySourceNamesFromFileNameToCanvas() {},
          });
        (v25["triggerLocalCacheSave"](),
          await new Promise((v29) => setTimeout(v29, 0)));
        const v30 = v22["dump"]()["get"]("tapnow_v2_dreamina_resume_backup");
        strict["ok"](v30);
        const v31 = JSON["parse"](v30);
        strict["equal"](v31["projectId"], "proj-rh");
        const v32 = Array["isArray"](v31["items"]) ? v31["items"] : [];
        strict["equal"](v32["length"], 5);
        const v33 = v32["find"]((v34) => v34["nodeId"] === "img-running"),
          v35 = v32["find"]((v36) => v36["nodeId"] === "aud-running"),
          v37 = v32["find"]((v38) => v38["nodeId"] === "src-video-running"),
          v39 = v32["find"]((v40) => v40["nodeId"] === "src-image-running"),
          v41 = v32["find"]((v42) => v42["nodeId"] === "src-audio-running");
        (strict["ok"](v33),
          strict["equal"](v33["kind"], "runninghub"),
          strict["equal"](v33["nodeType"], "ai-image"),
          strict["equal"](v33["rhTaskId"], "rh-img-1"),
          strict["ok"](v35),
          strict["equal"](v35["kind"], "runninghub"),
          strict["equal"](v35["nodeType"], "ai-audio"),
          strict["equal"](v35["rhTaskId"], "rh-aud-1"),
          strict["ok"](v37),
          strict["equal"](v37["kind"], "runninghub"),
          strict["equal"](v37["nodeType"], "source-video"),
          strict["equal"](v37["rhTaskId"], "rh-video-1"),
          strict["ok"](v39),
          strict["equal"](v39["kind"], "runninghub"),
          strict["equal"](v39["nodeType"], "source-image"),
          strict["equal"](v39["rhTaskId"], "rh-src-image-1"),
          strict["ok"](v41),
          strict["equal"](v41["kind"], "runninghub"),
          strict["equal"](v41["nodeType"], "source-audio"),
          strict["equal"](v41["rhTaskId"], "rh-src-audio-1"),
          strict["equal"](
            v32["some"]((v43) => v43["nodeId"] === "img-success"),
            false,
          ));
      } finally {
        ((console["warn"] = v21),
          (globalThis["window"] = v19),
          (globalThis["document"] = v20));
      }
    },
  ),
  test(
    "projectLifecycle: Dreamina 图片与 async 进行中任务会写入同步恢复备份",
    { concurrency: false },
    async () => {
      const v44 = globalThis["window"],
        v45 = globalThis["document"],
        v46 = console["warn"];
      try {
        console["warn"] = () => {};
        const v47 = createMemoryLocalStorage();
        ((globalThis["window"] = {
          localStorage: v47,
          currentProjectId: "proj-async",
          showToast: () => {},
        }),
          (globalThis["document"] = {
            getElementById(v48) {
              if (v48 === "projectNameText")
                return { textContent: "恢复测试2" };
              return null;
            },
            querySelector() {
              return null;
            },
          }));
        const v49 = {
            activeCanvasId: "c1",
            canvases: [
              {
                id: "c1",
                name: "画布1",
                nodes: [
                  {
                    id: "dreamina-img-running",
                    type: "ai-image",
                    model: "dreamina/4.5",
                    provider: "dreamina",
                    dreaminaSubmitId: "dm-submit-1",
                    dreaminaTaskStatus: "pending",
                    dreaminaTaskPhase: "generating",
                    dreaminaTaskStartedAt: 1001,
                  },
                  {
                    id: "dreamina-img-error-result",
                    type: "ai-image",
                    model: "dreamina/4.5",
                    provider: "dreamina",
                    dreaminaSubmitId: "dm-submit-error",
                    dreaminaTaskStatus: "pending",
                    dreaminaTaskPhase: "syncing",
                    dreaminaTaskStartedAt: 1007,
                    dreaminaTaskRecovering: true,
                    images: [
                      {
                        error:
                          "generation\x20failed:\x20final\x20generation\x20failed",
                        imageUrl: "",
                        thumbUrl: "",
                      },
                    ],
                  },
                  {
                    id: "async-video-running",
                    type: "ai-video",
                    model: "apimart/veo3-fast",
                    provider: "apimart",
                    asyncTaskProvider: "apimart",
                    asyncTaskKind: "video",
                    asyncTaskId: "async-video-1",
                    asyncTaskStatus: "running",
                    asyncTaskStartedAt: 1002,
                  },
                  {
                    id: "async-image-running",
                    type: "source-image",
                    model: "grsai/seedream-4.0",
                    provider: "grsai",
                    asyncTaskProvider: "grsai",
                    asyncTaskKind: "image",
                    asyncTaskId: "async-image-1",
                    asyncTaskStatus: "pending",
                    asyncTaskStartedAt: 1003,
                  },
                  {
                    id: "async-success",
                    type: "source-video",
                    model: "apimart/veo3-fast",
                    provider: "apimart",
                    asyncTaskProvider: "apimart",
                    asyncTaskKind: "video",
                    asyncTaskId: "async-video-success",
                    asyncTaskStatus: "success",
                  },
                  {
                    id: "async-ppio-model-only",
                    type: "ai-image",
                    model: "ppio/seedream-5.0-lite",
                    asyncTaskKind: "image",
                    asyncTaskId: "async-ppio-1",
                    asyncTaskStatus: "running",
                    asyncTaskStartedAt: 1004,
                  },
                  {
                    id: "async-ppio-model-with-stale-provider",
                    type: "ai-image",
                    model: "ppio/seedream-4.5",
                    provider: "grsai",
                    asyncTaskKind: "image",
                    asyncTaskId: "async-ppio-2",
                    asyncTaskStatus: "running",
                    asyncTaskStartedAt: 1005,
                  },
                  {
                    id: "async-grsai-bare-model-with-stale-provider",
                    type: "ai-image",
                    model: "nano-banana-pro-vt",
                    provider: "runninghubwf",
                    asyncTaskKind: "image",
                    asyncTaskId: "async-grsai-1",
                    asyncTaskStatus: "running",
                    asyncTaskStartedAt: 1006,
                  },
                ],
                edges: [],
                viewport: { x: 0, y: 0, zoom: 1.1 },
                assets: [],
              },
            ],
          },
          v50 = createProjectLifecycle({
            store: {
              subscribeSelector() {},
              getStateRaw() {
                return { nodes: {} };
              },
              updateNodeData() {},
            },
            CanvasTabManager: {
              getMultiData() {
                return v49;
              },
              get _canvases() {
                return [];
              },
            },
            project: {
              resolveCanvasData(v51) {
                return v51;
              },
              async loadProject() {
                return { canvases: [], activeCanvasId: null };
              },
              async saveProject() {},
              async saveRemoteImageLocally() {
                return "/output/mock.png";
              },
            },
            loadCustomPresets() {},
            async migrateLegacyThumbnailsInMultiData(v52) {
              return { changed: false, multiData: v52 };
            },
            sanitizeMultiCanvasDataForPersistence(v53) {
              return v53;
            },
            commit() {},
            patchStoreSourceNodeNamesFromFileName() {},
            applySourceNamesFromFileNameToCanvas() {},
          });
        (v50["triggerLocalCacheSave"](),
          await new Promise((v54) => setTimeout(v54, 0)));
        const v55 = v47["dump"]()["get"]("tapnow_v2_dreamina_resume_backup");
        strict["ok"](v55);
        const v56 = JSON["parse"](v55),
          v57 = Array["isArray"](v56["items"]) ? v56["items"] : [];
        strict["equal"](v57["length"], 6);
        const v58 = v57["find"](
            (v59) => v59["nodeId"] === "dreamina-img-running",
          ),
          v60 = v57["find"]((v61) => v61["nodeId"] === "async-video-running"),
          v62 = v57["find"]((v63) => v63["nodeId"] === "async-ppio-model-only"),
          v64 = v57["find"](
            (v65) => v65["nodeId"] === "async-ppio-model-with-stale-provider",
          ),
          v66 = v57["find"]((v67) => v67["nodeId"] === "async-image-running"),
          v68 = v57["find"](
            (v69) =>
              v69["nodeId"] === "async-grsai-bare-model-with-stale-provider",
          );
        (strict["ok"](v58),
          strict["equal"](v58["kind"], "dreamina"),
          strict["equal"](v58["dreaminaSubmitId"], "dm-submit-1"),
          strict["ok"](v60),
          strict["equal"](v60["kind"], "async"),
          strict["equal"](v60["asyncTaskProvider"], "apimart"),
          strict["equal"](v60["asyncTaskKind"], "video"),
          strict["equal"](v60["asyncTaskId"], "async-video-1"),
          strict["ok"](v62),
          strict["equal"](v62["kind"], "async"),
          strict["equal"](v62["asyncTaskProvider"], "ppio"),
          strict["equal"](v62["asyncTaskKind"], "image"),
          strict["equal"](v62["asyncTaskId"], "async-ppio-1"),
          strict["ok"](v64),
          strict["equal"](v64["kind"], "async"),
          strict["equal"](v64["asyncTaskProvider"], "ppio"),
          strict["equal"](v64["asyncTaskKind"], "image"),
          strict["equal"](v64["asyncTaskId"], "async-ppio-2"),
          strict["ok"](v66),
          strict["equal"](v66["kind"], "async"),
          strict["equal"](v66["asyncTaskProvider"], "grsai"),
          strict["equal"](v66["asyncTaskKind"], "image"),
          strict["equal"](v66["asyncTaskId"], "async-image-1"),
          strict["ok"](v68),
          strict["equal"](v68["kind"], "async"),
          strict["equal"](v68["asyncTaskProvider"], "grsai"),
          strict["equal"](v68["asyncTaskKind"], "image"),
          strict["equal"](v68["asyncTaskId"], "async-grsai-1"),
          strict["equal"](
            v57["some"]((v70) => v70["nodeId"] === "async-success"),
            false,
          ),
          strict["equal"](
            v57["some"]((v71) => v71["nodeId"] === "dreamina-img-error-result"),
            false,
          ));
      } finally {
        ((console["warn"] = v46),
          (globalThis["window"] = v44),
          (globalThis["document"] = v45));
      }
    },
  ));
