import { post } from "./apiBase.js";
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
export async function fetchVideoMetaFromServer(v10) {
  const v11 = String(v10 || "")["trim"]();
  if (!v11) throw new Error("src 不能为空");
  const v12 = _inflight["get"](v11);
  if (v12) return v12;
  let v13;
  return (
    (v13 = _runLimited(async () => {
      const v14 = await post("/api/v2/video/meta", { src: v11 });
      if (!v14["success"]) throw new Error(v14["error"] || "请求失败");
      return v14["data"];
    })["finally"](() => {
      if (_inflight["get"](v11) === v13) _inflight["delete"](v11);
    })),
    _inflight["set"](v11, v13),
    v13
  );
}
