import {
  fetchFileSavePathMigrationStatus,
  fetchUserSettingsFromServer,
  saveUserSettingsToServer,
  startFileSavePathMigration,
} from "../../../api/userSettingsApi.js";
import { showError, showSuccess } from "../../services/toastService.js";
const MIGRATION_POLL_INTERVAL_MS = 350,
  ROOT_FIELD_ID = "fileSaveRootDir",
  ROOT_BUTTON_ID = "btnFileSaveRootDirPick",
  FIELD_IDS = {
    canvasDir: "fileSaveCanvasDir",
    dataDir: "fileSaveDataDir",
    outputDir: "fileSaveOutputDir",
  },
  MANAGED_DIR_NAMES = {
    canvasDir: "projects",
    dataDir: "data",
    outputDir: "output",
  };
function getInput(v0) {
  return document["getElementById"](FIELD_IDS[v0]);
}
function getRootInput() {
  return document["getElementById"](ROOT_FIELD_ID);
}
function getRootPickButton() {
  return document["getElementById"](ROOT_BUTTON_ID);
}
function normalizeText(v1) {
  return String(v1 || "")["trim"]();
}
function trimTrailingPathSeparators(v2) {
  const v3 = normalizeText(v2);
  if (/^[a-zA-Z]:[\\/]*$/["test"](v3)) return v3["slice"](0, 2) + "\x5c";
  if (v3 === "/" || v3 === "\x5c") return v3;
  return v3["replace"](/[\\/]+$/g, "");
}
function getPathSeparator(v4) {
  const v5 = normalizeText(v4);
  return v5["includes"]("\x5c") && !v5["includes"]("/") ? "\x5c" : "/";
}
function joinPath(v6, v7) {
  const v8 = trimTrailingPathSeparators(v6);
  if (!v8) return "";
  if (v8 === "/" || v8 === "\x5c") return "" + v8 + v7;
  if (/^[a-zA-Z]:\\$/["test"](v8)) return "" + v8 + v7;
  return "" + v8 + getPathSeparator(v8) + v7;
}
function pathKey(v9) {
  return trimTrailingPathSeparators(v9)["replace"](/\\/g, "/")["toLowerCase"]();
}
function pathBasename(v10) {
  const v11 = trimTrailingPathSeparators(v10)["replace"](/\\/g, "/"),
    v12 = v11["split"]("/")["filter"](Boolean);
  return v12["at"](-1) || "";
}
function normalizeParentPath(v13) {
  const v14 = trimTrailingPathSeparators(v13),
    v15 = v14["match"](/^(.*)[\\/][^\\/]+$/);
  if (!v15) return "";
  const v16 = trimTrailingPathSeparators(v15[1]);
  return /^[a-zA-Z]:$/["test"](v16) ? v16 + "\x5c" : v16;
}
function buildManagedPaths(v17) {
  const v18 = trimTrailingPathSeparators(v17);
  return {
    canvasDir: joinPath(v18, MANAGED_DIR_NAMES["canvasDir"]),
    dataDir: joinPath(v18, MANAGED_DIR_NAMES["dataDir"]),
    outputDir: joinPath(v18, MANAGED_DIR_NAMES["outputDir"]),
  };
}
function inferManagedRoot(v19) {
  const v20 = normalizeFileSavePaths(v19),
    v21 = [];
  for (const [v22, v23] of Object["entries"](MANAGED_DIR_NAMES)) {
    const v24 = normalizeText(v20?.[v22]);
    if (!v24 || pathBasename(v24)["toLowerCase"]() !== v23["toLowerCase"]())
      return "";
    v21["push"](normalizeParentPath(v24));
  }
  const [v25] = v21;
  if (!v25) return "";
  return v21["every"]((v26) => pathKey(v26) === pathKey(v25)) ? v25 : "";
}
function inferDataDirFromTempDir(v27) {
  const v28 = normalizeText(v27)["replace"](/\\/g, "/");
  if (!v28) return "";
  return /\/uploads\/?$/i["test"](v28)
    ? v28["replace"](/\/uploads\/?$/i, "")
    : v28;
}
function normalizeFileSavePaths(v29) {
  return {
    ...(v29 || {}),
    dataDir:
      normalizeText(v29?.["dataDir"]) ||
      inferDataDirFromTempDir(v29?.["tempDir"]),
  };
}
function applyPathsToInputs(v30) {
  const v31 = normalizeFileSavePaths(v30),
    v32 = getRootInput();
  if (v32) v32["value"] = inferManagedRoot(v31);
  for (const v33 of Object["keys"](FIELD_IDS)) {
    const v34 = getInput(v33);
    if (v34) v34["value"] = normalizeText(v31?.[v33]);
  }
}
function setInputsDisabled(v35) {
  const v36 = getRootInput(),
    v37 = getRootPickButton();
  if (v36) v36["disabled"] = !!v35;
  if (v37) v37["disabled"] = !!v35;
  for (const v38 of Object["keys"](FIELD_IDS)) {
    const v39 = getInput(v38);
    if (v39) v39["disabled"] = !!v35;
  }
}
function readPathsFromInputs() {
  const v40 = normalizeText(getRootInput()?.["value"]);
  if (v40) return buildManagedPaths(v40);
  return {
    canvasDir: normalizeText(getInput("canvasDir")?.["value"]),
    dataDir: normalizeText(getInput("dataDir")?.["value"]),
    outputDir: normalizeText(getInput("outputDir")?.["value"]),
  };
}
function validateRequired(v41) {
  if (
    !normalizeText(getRootInput()?.["value"]) &&
    !v41["canvasDir"] &&
    !v41["dataDir"] &&
    !v41["outputDir"]
  )
    return "请选择保存根目录";
  if (!v41["canvasDir"]) return "请输入项目保存路径";
  if (!v41["dataDir"]) return "请输入数据文件保存路径";
  if (!v41["outputDir"]) return "请输入输出文件保存路径";
  return "";
}
function setSaving(v42, v43) {
  if (!v42) return;
  ((v42["disabled"] = !!v43),
    (v42["textContent"] = v43 ? "迁移中..." : "保存"));
}
function getDirectoryPicker() {
  return globalThis["window"]?.["electronAPI"]?.["selectDirectory"];
}
function readSelectedDirectory(v44) {
  if (!v44 || v44["canceled"]) return "";
  if (v44["success"] === false) return "";
  return normalizeText(v44["path"] || v44["filePath"] || v44["filePaths"]?.[0]);
}
function getPickButtonLabel(v45) {
  return normalizeText(
    v45?.["querySelector"]?.("span")?.["textContent"] ||
      v45?.["textContent"] ||
      "选择",
  );
}
function setPickButtonLabel(v46, v47) {
  const v48 = v46?.["querySelector"]?.("span");
  if (v48) v48["textContent"] = v47;
  else v46 && (v46["textContent"] = v47);
}
function syncDerivedInputsFromRoot() {
  const v49 = normalizeText(getRootInput()?.["value"]);
  if (!v49) return;
  applyPathsToInputs(buildManagedPaths(v49));
}
async function pickRootDirectory() {
  const v50 = getRootInput(),
    v51 = getDirectoryPicker();
  if (!v50 || typeof v51 !== "function") {
    showError("当前环境不支持选择目录");
    return;
  }
  const v52 = getRootPickButton(),
    v53 = getPickButtonLabel(v52);
  v52 && ((v52["disabled"] = true), setPickButtonLabel(v52, "选择中..."));
  try {
    const v54 = await v51({
        title: "选择保存根目录",
        defaultPath: normalizeText(v50["value"]),
      }),
      v55 = readSelectedDirectory(v54);
    v55 &&
      ((v50["value"] = v55), syncDerivedInputsFromRoot(), v50["focus"]?.());
  } catch (v56) {
    (console["error"]("[Settings] 选择保存目录失败:", v56),
      showError("选择目录失败：" + (v56?.["message"] || "未知错误")));
  } finally {
    v52 && ((v52["disabled"] = false), setPickButtonLabel(v52, v53));
  }
}
function bindDirectoryPickers() {
  const v57 = getRootInput();
  v57 &&
    !v57["__fileSaveRootInputBound"] &&
    ((v57["__fileSaveRootInputBound"] = true),
    v57["addEventListener"]("input", syncDerivedInputsFromRoot));
  const v58 = getRootPickButton();
  v58 &&
    !v58["__fileSaveDirectoryPickerBound"] &&
    ((v58["__fileSaveDirectoryPickerBound"] = true),
    v58["addEventListener"]("click", () => {
      void pickRootDirectory();
    }));
}
function sleep(v59) {
  return new Promise((v60) => setTimeout(v60, v59));
}
function getMigrationElements() {
  return {
    card: document["getElementById"]("fileSaveMigrationCard"),
    stage: document["getElementById"]("fileSaveMigrationStage"),
    percent: document["getElementById"]("fileSaveMigrationPercent"),
    bar: document["getElementById"]("fileSaveMigrationBar"),
    processed: document["getElementById"]("fileSaveMigrationProcessed"),
    copied: document["getElementById"]("fileSaveMigrationCopied"),
    skipped: document["getElementById"]("fileSaveMigrationSkipped"),
    failed: document["getElementById"]("fileSaveMigrationFailed"),
    current: document["getElementById"]("fileSaveMigrationCurrent"),
    errors: document["getElementById"]("fileSaveMigrationErrors"),
  };
}
function clampPercent(v61) {
  const v62 = Number(v61);
  if (!Number["isFinite"](v62)) return 0;
  return Math["max"](0, Math["min"](100, Math["round"](v62)));
}
function renderMigrationErrors(v63, v64) {
  if (!v63) return;
  const v65 = Array["isArray"](v64) ? v64 : [];
  (v63["replaceChildren"](), (v63["hidden"] = v65["length"] === 0));
  for (const v66 of v65["slice"](0, 20)) {
    const v67 = document["createElement"]("div");
    v67["className"] = "settings-file-migration-error";
    const v68 = normalizeText(v66?.["path"] || v66?.["localPath"] || ""),
      v69 = normalizeText(v66?.["error"] || "迁移失败");
    ((v67["textContent"] = v68 ? v68 + " · " + v69 : v69),
      v63["appendChild"](v67));
  }
}
function renderMigrationStatus(v70) {
  const v71 = getMigrationElements();
  if (!v71["card"]) return;
  v71["card"]["hidden"] = false;
  const v72 = clampPercent(v70?.["progress"]);
  if (v71["percent"]) v71["percent"]["textContent"] = v72 + "%";
  if (v71["bar"]) v71["bar"]["style"]["width"] = v72 + "%";
  v71["stage"] &&
    (v71["stage"]["textContent"] =
      normalizeText(v70?.["stage"]) || "正在迁移文件");
  const v73 = Number(v70?.["processedFiles"] || 0),
    v74 = Number(v70?.["totalFiles"] || 0);
  v71["processed"] &&
    (v71["processed"]["textContent"] = v73 + " / " + (v74 || v73));
  if (v71["copied"])
    v71["copied"]["textContent"] = String(Number(v70?.["copiedCount"] || 0));
  if (v71["skipped"])
    v71["skipped"]["textContent"] = String(Number(v70?.["skippedCount"] || 0));
  if (v71["failed"])
    v71["failed"]["textContent"] = String(Number(v70?.["failedCount"] || 0));
  const v75 = normalizeText(v70?.["currentFile"]);
  (v71["current"] &&
    ((v71["current"]["textContent"] = v75 ? "当前：" + v75 : ""),
    (v71["current"]["title"] = v75)),
    renderMigrationErrors(v71["errors"], v70?.["errors"]));
}
function resetMigrationStatus() {
  const v76 = getMigrationElements();
  if (v76["card"]) v76["card"]["hidden"] = true;
  if (v76["stage"]) v76["stage"]["textContent"] = "准备迁移文件";
  if (v76["percent"]) v76["percent"]["textContent"] = "0%";
  if (v76["bar"]) v76["bar"]["style"]["width"] = "0%";
  if (v76["processed"]) v76["processed"]["textContent"] = "0 / 0";
  if (v76["copied"]) v76["copied"]["textContent"] = "0";
  if (v76["skipped"]) v76["skipped"]["textContent"] = "0";
  if (v76["failed"]) v76["failed"]["textContent"] = "0";
  (v76["current"] &&
    ((v76["current"]["textContent"] = ""), (v76["current"]["title"] = "")),
    renderMigrationErrors(v76["errors"], []));
}
function isMigrationFinished(v77) {
  const v78 = normalizeText(v77?.["status"]);
  return v78 === "done" || v78 === "error";
}
async function pollMigrationUntilFinished(v79) {
  let v80 = null;
  while (true) {
    (await sleep(MIGRATION_POLL_INTERVAL_MS),
      (v80 = await fetchFileSavePathMigrationStatus(v79)),
      renderMigrationStatus(v80));
    if (isMigrationFinished(v80)) return v80;
  }
}
function buildMigrationSummary(v81) {
  const v82 = Number(v81?.["copiedCount"] || 0),
    v83 = Number(v81?.["skippedCount"] || 0),
    v84 = Number(v81?.["failedCount"] || 0);
  return (
    "迁移完成：复制\x20" +
    v82 +
    " 个，跳过 " +
    v83 +
    " 个，失败 " +
    v84 +
    "\x20个"
  );
}
async function saveSettingsWithMigration(v85) {
  try {
    renderMigrationStatus({
      status: "pending",
      stage: "正在创建迁移任务",
      progress: 0,
    });
    const v86 = await startFileSavePathMigration(v85);
    renderMigrationStatus(v86);
    const v87 = normalizeText(v86?.["jobId"]);
    if (!v87) throw new Error("迁移任务未返回 jobId");
    const v88 = await pollMigrationUntilFinished(v87);
    if (normalizeText(v88?.["status"]) !== "done")
      throw new Error(v88?.["error"] || "文件迁移失败");
    return v88;
  } catch (v89) {
    if (Number(v89?.["status"] || v89?.["statusCode"] || 0) === 404) {
      const v90 = await saveUserSettingsToServer(v85),
        v91 = {
          status: "done",
          progress: 100,
          copiedCount: 0,
          skippedCount: 0,
          failedCount: 0,
          settings: v90?.["settings"],
        };
      return (renderMigrationStatus(v91), v91);
    }
    throw v89;
  }
}
export function initFileSaveSettings() {
  const v92 = document["getElementById"]("btnFileSavePathsSave");
  if (!v92) return;
  (bindDirectoryPickers(),
    fetchUserSettingsFromServer()
      ["then"]((v93) => {
        applyPathsToInputs(v93?.["fileSavePaths"] || {});
      })
      ["catch"]((v94) => {
        (console["error"]("[Settings] 加载文件与保存路径失败:", v94),
          showError("加载文件与保存路径失败"));
      }),
    resetMigrationStatus(),
    v92["addEventListener"]("click", async () => {
      const v95 = readPathsFromInputs(),
        v96 = validateRequired(v95);
      if (v96) {
        showError(v96);
        return;
      }
      (setSaving(v92, true), setInputsDisabled(true), resetMigrationStatus());
      try {
        const v97 = await fetchUserSettingsFromServer()["catch"](() => ({})),
          v98 = await saveSettingsWithMigration({
            ...(v97 || {}),
            fileSavePaths: v95,
            fileSavePathsMeta: {
              ...(v97?.["fileSavePathsMeta"] || {}),
              source: "user",
              mode: normalizeText(getRootInput()?.["value"])
                ? "root"
                : "custom",
              rootDir: normalizeText(getRootInput()?.["value"]),
              updatedAt: Date["now"](),
            },
          }),
          v99 = v98?.["settings"] || (await fetchUserSettingsFromServer());
        (applyPathsToInputs(v99?.["fileSavePaths"] || v95),
          Number(v98?.["failedCount"] || 0) > 0
            ? showError(
                "保存位置已更新，但部分文件迁移失败。" +
                  buildMigrationSummary(v98),
              )
            : showSuccess(buildMigrationSummary(v98)));
      } catch (v100) {
        (console["error"]("[Settings] 保存文件与保存路径失败:", v100),
          showError("保存文件路径失败：" + (v100?.["message"] || "未知错误")));
      } finally {
        (setSaving(v92, false), setInputsDisabled(false));
      }
    }));
}
