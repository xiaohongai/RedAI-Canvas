import {
  apimartImageModelApiExecutionManifests,
  apimartImageModelApiModelManifests,
} from "./apimartImageModelApiManifests.js";
import {
  grsaiImageModelApiExecutionManifests,
  grsaiImageModelApiModelManifests,
} from "./grsaiImageModelApiManifests.js";
import {
  ppioImageModelApiExecutionManifests,
  ppioImageModelApiModelManifests,
} from "./ppioImageModelApiManifests.js";
import {
  runningHubImageModelApiExecutionManifests,
  runningHubImageModelApiModelManifests,
} from "./runningHubImageModelApiManifests.js";
import {
  volcengineImageModelApiExecutionManifests,
  volcengineImageModelApiModelManifests,
} from "./volcengineImageModelApiManifests.js";
export * from "./apimartImageModelApiManifests.js";
export * from "./grsaiImageModelApiManifests.js";
export * from "./ppioImageModelApiManifests.js";
export * from "./runningHubImageModelApiManifests.js";
export * from "./sharedImageModelApiFields.js";
export * from "./volcengineImageModelApiManifests.js";
export const vendorImageModelApiModelManifests = Object["freeze"]([
  ...apimartImageModelApiModelManifests,
  ...grsaiImageModelApiModelManifests,
  ...ppioImageModelApiModelManifests,
  ...runningHubImageModelApiModelManifests,
  ...volcengineImageModelApiModelManifests,
]);
export const vendorImageModelApiExecutionManifests = Object["freeze"]([
  ...apimartImageModelApiExecutionManifests,
  ...grsaiImageModelApiExecutionManifests,
  ...ppioImageModelApiExecutionManifests,
  ...runningHubImageModelApiExecutionManifests,
  ...volcengineImageModelApiExecutionManifests,
]);
