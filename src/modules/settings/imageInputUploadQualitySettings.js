import {
  getImageInputUploadQualityMode,
  setImageInputUploadQualityMode,
} from "../../services/imageInputUploadQualityService.js";
export function initImageInputUploadQualitySettings() {
  const v0 = document["querySelectorAll"](
    "#imageInputUploadQualityGroup\x20.cursor-size-btn[data-upload-quality]",
  );
  if (!v0["length"]) return;
  const v1 = (v2) => {
    const v3 = setImageInputUploadQualityMode(v2);
    v0["forEach"]((v4) => {
      v4["classList"]["toggle"](
        "active",
        v4["dataset"]["uploadQuality"] === v3,
      );
    });
  };
  (v1(getImageInputUploadQualityMode()),
    v0["forEach"]((v5) => {
      v5["addEventListener"]("click", () => v1(v5["dataset"]["uploadQuality"]));
    }));
}
