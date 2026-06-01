import test from "node:test";
import strict from "node:assert/strict";
import {
  getTaskMessage,
  isDreaminaTaskTerminal,
  isTaskCancelled,
  isTaskFailed,
  isTaskRunning,
  isTaskTerminal,
  resolveGenerationButtonMode,
  resolveGenerationUiState,
  shouldAllowCancel,
  shouldShowGenerationBusyUi,
  shouldShowGenerationResultLoadingUi,
} from "./generationTaskUiState.js";
(test("generationTaskUiState:\x20normalizes\x20legacy\x20running\x20states", () => {
  (strict["equal"](resolveGenerationUiState({ isGenerating: true }), "running"),
    strict["equal"](
      resolveGenerationUiState({ jobStatus: "running" }),
      "running",
    ),
    strict["equal"](
      resolveGenerationUiState({ rhTaskStatus: "pending" }),
      "queued",
    ),
    strict["equal"](
      resolveGenerationUiState({ dreaminaTaskPhase: "generating" }),
      "running",
    ),
    strict["equal"](
      resolveGenerationUiState({ asyncTaskStatus: "processing" }),
      "running",
    ),
    strict["equal"](resolveGenerationUiState({}), "idle"));
}),
  test("generationTaskUiState: recovering is a unified active state", () => {
    (strict["equal"](
      resolveGenerationUiState({
        rhTaskRecovering: true,
        rhTaskStatus: "pending",
      }),
      "recovering",
    ),
      strict["equal"](
        resolveGenerationUiState({ asyncTaskRecovering: true }),
        "recovering",
      ),
      strict["equal"](isTaskRunning({ dreaminaTaskRecovering: true }), true),
      strict["equal"](isTaskTerminal({ dreaminaTaskRecovering: true }), false));
  }),
  test("generationTaskUiState: terminal priority covers success, error, and cancel", () => {
    (strict["equal"](
      resolveGenerationUiState({ rhTaskStatus: "success" }),
      "success",
    ),
      strict["equal"](
        resolveGenerationUiState({ asyncTaskStatus: "failed" }),
        "error",
      ),
      strict["equal"](
        resolveGenerationUiState({ mediaTaskStatus: "complete" }),
        "success",
      ),
      strict["equal"](
        resolveGenerationUiState({ dreaminaTaskStatus: "cancelled" }),
        "cancelled",
      ),
      strict["equal"](isTaskTerminal({ jobStatus: "success" }), true),
      strict["equal"](isTaskFailed({ rhTaskStatus: "failed" }), true),
      strict["equal"](isTaskCancelled({ asyncTaskStatus: "canceled" }), true));
  }),
  test("generationTaskUiState: failure beats stale running flags", () => {
    const v0 = {
      isGenerating: true,
      jobStatus: "running",
      rhTaskStatus: "failed",
    };
    (strict["equal"](resolveGenerationUiState(v0), "error"),
      strict["equal"](isTaskTerminal(v0), true),
      strict["equal"](isTaskRunning(v0), false));
  }),
  test("generationTaskUiState: active task family ignores stale inactive provider fields", () => {
    const v1 = {
      isGenerating: true,
      jobStatus: "running",
      rhTaskStatus: "pending",
      dreaminaTaskStatus: "idle",
      dreaminaTaskPhase: "done",
      asyncTaskStatus: "idle",
    };
    (strict["equal"](resolveGenerationUiState(v1), "running"),
      strict["equal"](isTaskRunning(v1), true),
      strict["equal"](isTaskTerminal(v1), false));
  }),
  test("generationTaskUiState:\x20active\x20provider\x20task\x20ignores\x20stale\x20media\x20terminal\x20state", () => {
    const v2 = {
      isGenerating: true,
      jobStatus: "running",
      rhTaskStatus: "pending",
      mediaTaskStatus: "complete",
      generationStartTime: 1000,
      generationDuration: null,
    };
    (strict["equal"](resolveGenerationUiState(v2), "running"),
      strict["equal"](shouldShowGenerationBusyUi(v2), true),
      strict["deepEqual"](
        resolveGenerationButtonMode(v2, { cancellable: true }),
        {
          state: "running",
          busy: true,
          canCancel: true,
          disabled: false,
          cursor: "",
        },
      ));
  }),
  test("generationTaskUiState: Dreamina terminal only reads Dreamina fields", () => {
    (strict["equal"](
      isDreaminaTaskTerminal({
        jobStatus: "success",
        dreaminaTaskStatus: "pending",
        dreaminaTaskPhase: "generating",
      }),
      false,
    ),
      strict["equal"](
        isDreaminaTaskTerminal({ dreaminaTaskPhase: "done" }),
        true,
      ),
      strict["equal"](
        isDreaminaTaskTerminal({ dreaminaTaskStatus: "failed" }),
        true,
      ));
  }),
  test("generationTaskUiState: task message prefers explicit provider messages", () => {
    (strict["equal"](
      getTaskMessage({
        rhStatusMessage: "provider error",
        dreaminaTaskLabel: "queued",
      }),
      "provider error",
    ),
      strict["equal"](
        getTaskMessage({ dreaminaTaskLabel: "queued" }),
        "queued",
      ),
      strict["equal"](
        getTaskMessage({ asyncTaskError: "async\x20failed" }),
        "async\x20failed",
      ),
      strict["equal"](getTaskMessage({}), ""));
  }),
  test("generationTaskUiState: button helpers derive busy and cancel state", () => {
    const v3 = { rhTaskStatus: "running", rhTaskId: "rh-1" };
    (strict["equal"](shouldShowGenerationBusyUi(v3), true),
      strict["equal"](shouldAllowCancel(v3, { cancellable: true }), true),
      strict["deepEqual"](
        resolveGenerationButtonMode(v3, { cancellable: true }),
        {
          state: "running",
          busy: true,
          canCancel: true,
          disabled: false,
          cursor: "",
        },
      ),
      strict["deepEqual"](
        resolveGenerationButtonMode(v3, {
          cancellable: true,
          cancelInFlight: true,
        }),
        {
          state: "running",
          busy: true,
          canCancel: false,
          disabled: true,
          cursor: "var(--unavailable-cursor)",
        },
      ),
      strict["deepEqual"](
        resolveGenerationButtonMode({ jobStatus: "success" }),
        {
          state: "success",
          busy: false,
          canCancel: false,
          disabled: false,
          cursor: "",
        },
      ));
  }),
  test("generationTaskUiState: result loading helper requires active task without result", () => {
    (strict["equal"](
      shouldShowGenerationResultLoadingUi({
        rhTaskRecovering: true,
        rhTaskStatus: "pending",
      }),
      true,
    ),
      strict["equal"](
        shouldShowGenerationResultLoadingUi(
          { rhTaskStatus: "running", rhTaskId: "task-1" },
          { hasResult: true },
        ),
        false,
      ),
      strict["equal"](
        shouldShowGenerationResultLoadingUi({
          isGenerating: true,
          rhTaskStatus: "failed",
        }),
        false,
      ));
  }));
