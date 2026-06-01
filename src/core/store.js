import appStore, { createStore } from "./stores/appStore.js";
let hasWarnedLegacyEntry = false;
function warnLegacyEntryOnce() {
  if (hasWarnedLegacyEntry) return;
  hasWarnedLegacyEntry = true;
  try {
    console["warn"](
      "[store]\x20`src/core/store.js`\x20已进入兼容阶段，请迁移到\x20`src/core/stores/appStore.js`\x20或\x20graph/ui/workspace\x20分域入口。",
    );
  } catch {}
}
warnLegacyEntryOnce();
export default appStore;
export { createStore };
