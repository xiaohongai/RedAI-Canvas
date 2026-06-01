import { resetGenerateButtonIdleUi as resetGenerateButtonIdleUiImpl } from "../../modules/previewGenerateButtonUi.js";
import {
  isDreaminaTaskTerminal,
  isTaskCancelled,
  isTaskFailed,
  isTaskRunning,
  isTaskTerminal,
} from "../../core/generationTaskUiState.js";
export function isTerminalGenerationUiState(v0) {
  return isTaskTerminal(v0) && !isTaskRunning(v0);
}
export function isFailureGenerationUiState(v1) {
  return isTaskFailed(v1) || isTaskCancelled(v1);
}
export function isDreaminaTerminalGenerationState(v2) {
  return isDreaminaTaskTerminal(v2);
}
export function resetGenerateButtonIdleUi(v3) {
  resetGenerateButtonIdleUiImpl(v3);
}
