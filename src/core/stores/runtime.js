import legacyKernelStore, {
  createLegacyKernelStore,
} from "./legacyKernelStore.js";
import { createFacadeStore, createFacadeStoreFromCore } from "./facadeStore.js";
const facadeStore = createFacadeStoreFromCore(legacyKernelStore),
  { graphStore, uiStore, workspaceStore } = facadeStore["getDomainStores"]();
function createStore() {
  return createFacadeStore();
}
function createDomainStores() {
  const v0 = createLegacyKernelStore(),
    v1 = createFacadeStoreFromCore(v0);
  return v1["getDomainStores"]();
}
export {
  facadeStore,
  graphStore,
  uiStore,
  workspaceStore,
  legacyKernelStore,
  createStore,
  createDomainStores,
  createLegacyKernelStore,
};
export default facadeStore;
