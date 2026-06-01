const GENERATION_ACTIVE_JOB_STATUSES = new Set([
  "running",
  "processing",
  "generating",
  "in_progress",
  "in-progress",
  "pending",
  "queued",
  "queueing",
  "waiting",
  "submitted",
  "submitting",
  "submit",
  "recovering",
]);
function isActiveGenerationJobStatus(v0) {
  return GENERATION_ACTIVE_JOB_STATUSES["has"](
    String(v0 || "")
      ["trim"]()
      ["toLowerCase"](),
  );
}
export function stripImageGenerationRuntimeState(v1) {
  const v2 = v1 && typeof v1 === "object" ? v1 : {};
  return (
    delete v2["isGenerating"],
    isActiveGenerationJobStatus(v2["jobStatus"]) && delete v2["jobStatus"],
    delete v2["taskCancellable"],
    delete v2["taskResumable"],
    delete v2["taskAdapterType"],
    delete v2["generationStartTime"],
    delete v2["generationDuration"],
    delete v2["rhTaskId"],
    delete v2["rhTaskStatus"],
    delete v2["rhTaskStartedAt"],
    delete v2["rhTaskRecovering"],
    delete v2["rhTaskUseOpenapiQuery"],
    delete v2["rhStatusMessage"],
    delete v2["rhStatusCode"],
    delete v2["dreaminaSubmitId"],
    delete v2["dreaminaTaskStatus"],
    delete v2["dreaminaTaskPhase"],
    delete v2["dreaminaTaskLabel"],
    delete v2["dreaminaTaskStartedAt"],
    delete v2["dreaminaTaskLastCheckedAt"],
    delete v2["dreaminaTaskRecovering"],
    delete v2["dreaminaTaskLastRaw"],
    delete v2["asyncTaskProvider"],
    delete v2["asyncTaskKind"],
    delete v2["asyncTaskId"],
    delete v2["asyncTaskStatus"],
    delete v2["asyncTaskStartedAt"],
    delete v2["asyncTaskRecovering"],
    delete v2["mediaTaskId"],
    delete v2["mediaTaskKind"],
    delete v2["mediaTaskStatus"],
    delete v2["mediaTaskProgress"],
    delete v2["mediaTaskError"],
    v2
  );
}
export function stripImageGenerationResultStateForDerivedNode(v3) {
  const v4 = stripImageGenerationRuntimeState(v3);
  return (
    delete v4["images"],
    delete v4["imageUrl"],
    delete v4["sourceUrl"],
    delete v4["thumbUrl"],
    delete v4["sourceId"],
    delete v4["thumbId"],
    delete v4["src"],
    delete v4["url"],
    delete v4["resultUrl"],
    delete v4["localPath"],
    delete v4["originalLocalPath"],
    delete v4["displayLocalPath"],
    delete v4["thumbLocalPath"],
    delete v4["fileName"],
    delete v4["isImagesExpanded"],
    delete v4["mainImageIndex"],
    delete v4["mask"],
    delete v4["maskPreview"],
    delete v4["maskPreviewUrl"],
    delete v4["maskPolarity"],
    delete v4["maskSaveToken"],
    delete v4["videos"],
    delete v4["isVideosExpanded"],
    delete v4["mainVideoIndex"],
    delete v4["videoUrl"],
    delete v4["videoMetaSrc"],
    delete v4["coverUrl"],
    delete v4["audioUrl"],
    delete v4["duration"],
    delete v4["taskId"],
    delete v4["status"],
    delete v4["progress"],
    delete v4["error"],
    v4
  );
}
