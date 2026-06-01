export const videoTaskOrchestrationMixin = {
  async _handleGenerateOrCancel(v0 = null) {
    return this["_handleGenerateOrCancelImpl"](v0);
  },
  async _cancelRunningHubWorkflowTask() {
    return this["_cancelRunningHubWorkflowTaskImpl"]();
  },
  async _onGenerate(v1 = null, v2 = {}) {
    return this["_onGenerateImpl"](v1, v2);
  },
  async _buildPayload(v3 = null) {
    return this["_buildPayloadImpl"](v3);
  },
};
