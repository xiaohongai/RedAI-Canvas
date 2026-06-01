const BACKGROUND_THROTTLE_SWITCHES = Object["freeze"]([
    "disable-background-timer-throttling",
    "disable-renderer-backgrounding",
    "disable-backgrounding-occluded-windows",
  ]),
  DISABLED_BACKGROUND_FEATURES =
    "CalculateNativeWinOcclusion,IntensiveWakeUpThrottling";
export function configureRendererResponsiveness(v0) {
  const v1 = v0?.["commandLine"];
  if (!v1?.["appendSwitch"]) return;
  for (const v2 of BACKGROUND_THROTTLE_SWITCHES) {
    try {
      v1["appendSwitch"](v2);
    } catch (v3) {
      console["warn"](
        "[electron] failed to append Chromium switch " + v2 + ":",
        v3,
      );
    }
  }
  try {
    v1["appendSwitch"]("disable-features", DISABLED_BACKGROUND_FEATURES);
  } catch (v4) {
    console["warn"](
      "[electron] failed to disable Chromium background features:",
      v4,
    );
  }
}
export const __rendererResponsivenessForTest = {
  BACKGROUND_THROTTLE_SWITCHES: BACKGROUND_THROTTLE_SWITCHES,
  DISABLED_BACKGROUND_FEATURES: DISABLED_BACKGROUND_FEATURES,
};
