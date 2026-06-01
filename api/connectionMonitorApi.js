import appStore from "../src/core/stores/appStore.js";
import { buildApiUrl } from "./apiBase.js";
let evtSource = null,
  reconnectTimer = null,
  started = false;
function connect() {
  if (evtSource) evtSource["close"]();
  ((evtSource = new EventSource(buildApiUrl("/api/v2/heartbeat_stream"))),
    (evtSource["onopen"] = () => {
      (appStore["setServerConnection"](true),
        reconnectTimer &&
          (clearTimeout(reconnectTimer), (reconnectTimer = null)));
    }),
    (evtSource["onerror"] = () => {
      (appStore["setServerConnection"](false),
        evtSource["close"](),
        !reconnectTimer &&
          (reconnectTimer = setTimeout(() => {
            ((reconnectTimer = null), connect());
          }, 2000)));
    }));
}
export function startServerConnectionMonitor() {
  if (started) return;
  ((started = true), setTimeout(connect, 1000));
}
