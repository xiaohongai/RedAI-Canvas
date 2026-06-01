export const videoStateSyncMixin = {
  _syncMuteBtnIcon() {
    return this["_syncMuteBtnIconImpl"]();
  },
  _syncBtnIconState() {
    return this["_syncBtnIconStateImpl"]();
  },
};
