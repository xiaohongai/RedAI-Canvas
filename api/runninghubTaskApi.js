import { post } from "./apiBase.js";
export async function cancelRunningHubTask({ apiKey: v0, taskId: v1 }) {
  try {
    const v2 = await post(
      "/api/v2/runninghubwf/cancel",
      { apiKey: v0, taskId: v1 },
      60 * 1000,
    );
    if (!v2["success"]) {
      if (
        v2["error"] &&
        (v2["error"]["includes"]("<") ||
          v2["error"]["includes"]("DOCTYPE") ||
          v2["error"]["includes"]("html"))
      )
        throw new Error("取消失败：服务器返回了非预期的响应格式");
      throw new Error(v2["error"] || "取消失败");
    }
    return v2["data"];
  } catch (v3) {
    if (
      v3["message"] &&
      v3["message"]["includes"]("Unexpected token") &&
      (v3["message"]["includes"]("DOCTYPE") || v3["message"]["includes"]("<"))
    )
      throw new Error("取消失败：服务器返回了非预期的响应格式");
    if (
      v3["name"] === "AbortError" ||
      v3["message"]["includes"]("signal is aborted")
    )
      throw new Error("取消操作已执行");
    throw v3;
  }
}
