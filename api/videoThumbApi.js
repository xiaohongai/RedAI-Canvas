import { post } from "./apiBase.js";
import {
  canUseElectronMediaTask,
  enqueueElectronMediaTask,
} from "./localMediaTaskApi.js";
function _createLimiter(v0) {
  let v1 = 0;
  const v2 = [];
  return function v3(v4) {
    return new Promise((v5, v6) => {
      const v7 = () => {
        (v1++,
          Promise["resolve"]()
            ["then"](v4)
            ["then"](
              (v8) => {
                v1--;
                if (v2["length"] && v1 < v0) v2["shift"]()();
                v5(v8);
              },
              (v9) => {
                v1--;
                if (v2["length"] && v1 < v0) v2["shift"]()();
                v6(v9);
              },
            ));
      };
      if (v1 < v0) v7();
      else v2["push"](v7);
    });
  };
}
const _runLimited = _createLimiter(2),
  _inflight = new Map();
function buildMediaTaskPayload(v10, v11 = {}) {
  const v12 = { kind: "videoFirstFrame", src: v10 },
    v13 = String(v11?.["nodeId"] || "")["trim"](),
    v14 = String(v11?.["assetId"] || "")["trim"]();
  if (v13) v12["nodeId"] = v13;
  if (v14) v12["assetId"] = v14;
  return v12;
}
export async function fetchVideoFirstFrameThumbFromServer(v15, v16 = {}) {
  const v17 = String(v15 || "")["trim"]();
  if (!v17) throw new Error("src 不能为空");
  if (canUseElectronMediaTask())
    return await enqueueElectronMediaTask(buildMediaTaskPayload(v17, v16), {
      wait: true,
      timeout: 120000,
    });
  const v18 = _inflight["get"](v17);
  if (v18) return v18;
  let v19;
  return (
    (v19 = _runLimited(async () => {
      const v20 = await post("/api/v2/video/first_frame", { src: v17 });
      if (!v20["success"]) throw new Error(v20["error"] || "请求失败");
      return v20["data"];
    })["finally"](() => {
      if (_inflight["get"](v17) === v19) _inflight["delete"](v17);
    })),
    _inflight["set"](v17, v19),
    v19
  );
}
