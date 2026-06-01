import { createLegacyKernelStore } from "./legacyKernelStore.js";
import { createGraphStore } from "./graphStore.js";
import { createUiStore } from "./uiStore.js";
import { createWorkspaceStore } from "./workspaceStore.js";
function createFacadeStoreFromCore(v0) {
  if (!v0 || typeof v0 !== "object")
    throw new TypeError(
      "[facadeStore] createFacadeStoreFromCore() 需要传入有效的 coreStore",
    );
  const v1 = createGraphStore(v0),
    v2 = createUiStore(v0),
    v3 = createWorkspaceStore(v0);
  return {
    ...v0,
    graphStore: v1,
    uiStore: v2,
    workspaceStore: v3,
    getDomainStores() {
      return { graphStore: v1, uiStore: v2, workspaceStore: v3 };
    },
  };
}
function createFacadeStore() {
  const v4 = createLegacyKernelStore();
  return createFacadeStoreFromCore(v4);
}
export { createFacadeStore, createFacadeStoreFromCore };
