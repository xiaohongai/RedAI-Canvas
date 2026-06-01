class CameraPromptMapper {
  constructor() {
    ((this["AZIMUTH_OPTIONS"] = [
      { key: "frontView", promptKey: "front view", value: 0 },
      {
        key: "frontRightQuarterView",
        promptKey: "front-right quarter view",
        value: -45,
      },
      { key: "rightSideView", promptKey: "right side view", value: -90 },
      {
        key: "backRightQuarterView",
        promptKey: "back-right quarter view",
        value: -135,
      },
      { key: "backView", promptKey: "back view", value: 180 },
      {
        key: "backLeftQuarterView",
        promptKey: "back-left quarter view",
        value: 135,
      },
      { key: "leftSideView", promptKey: "left side view", value: 90 },
      {
        key: "frontLeftQuarterView",
        promptKey: "front-left quarter view",
        value: 45,
      },
    ]),
      (this["ELEVATION_OPTIONS"] = [
        { key: "lowAngleShot", promptKey: "low-angle\x20shot", value: -30 },
        { key: "eyeLevelShot", promptKey: "eye-level shot", value: 0 },
        { key: "elevatedShot", promptKey: "elevated shot", value: 30 },
        { key: "highAngleShot", promptKey: "high-angle shot", value: 60 },
      ]),
      (this["ZOOM_RANGES"] = [
        {
          key: "wideShot",
          promptKey: "wide shot",
          min: 0.1,
          max: 0.85,
          centerValue: 0.5,
        },
        {
          key: "mediumShot",
          promptKey: "medium shot",
          min: 0.85,
          max: 1.5,
          centerValue: 1.2,
        },
        {
          key: "closeUp",
          promptKey: "close-up",
          min: 1.5,
          max: 2,
          centerValue: 1.8,
        },
      ]));
  }
  ["normalizeAzimuth"](v0) {
    let v1 = v0 % 360;
    if (v1 > 180) v1 -= 360;
    if (v1 <= -180) v1 += 360;
    return v1;
  }
  ["findClosestAzimuth"](v2) {
    const v3 = this["normalizeAzimuth"](v2);
    let v4 = this["AZIMUTH_OPTIONS"][0],
      v5 = Math["abs"](v3 - v4["value"]);
    for (const v6 of this["AZIMUTH_OPTIONS"]) {
      const v7 = Math["abs"](v3 - v6["value"]);
      v7 < v5 && ((v5 = v7), (v4 = v6));
    }
    return v4;
  }
  ["findClosestElevation"](v8) {
    let v9 = this["ELEVATION_OPTIONS"][0],
      v10 = Math["abs"](v8 - v9["value"]);
    for (const v11 of this["ELEVATION_OPTIONS"]) {
      const v12 = Math["abs"](v8 - v11["value"]);
      v12 < v10 && ((v10 = v12), (v9 = v11));
    }
    return v9;
  }
  ["findZoomRange"](v13) {
    for (const v14 of this["ZOOM_RANGES"]) {
      if (v13 >= v14["min"] && v13 < v14["max"]) return v14;
    }
    return this["ZOOM_RANGES"][this["ZOOM_RANGES"]["length"] - 1];
  }
  ["generatePrompt"](v15) {
    if (!v15) return "";
    const {
        rotation: rotation = 35,
        pitch: pitch = 20,
        scale: scale = 0.5,
      } = v15,
      v16 = this["findZoomRange"](scale)["promptKey"],
      v17 = this["findClosestAzimuth"](rotation)["promptKey"],
      v18 = this["findClosestElevation"](pitch)["promptKey"];
    return (
      "switch the camera perspective: " + v16 + ",\x20" + v17 + ",\x20" + v18
    );
  }
}
const cameraPromptMapper = new CameraPromptMapper();
export function applyCameraAngleToPrompt(v19, v20) {
  const v21 = String(v19 || "");
  if (!v20) return v21;
  const v22 = cameraPromptMapper["generatePrompt"](v20);
  if (!v22) return v21;
  return v22 + (v21 ? ",\x20" + v21 : "");
}
