import { DB_CONFIG } from "../utils/constants.js";
const {
  name: DB_NAME,
  version: DB_VERSION,
  storeName: IMAGE_STORE_NAME,
  thumbnailStoreName: THUMBNAIL_STORE_NAME = "thumbnails",
} = DB_CONFIG;
let dbPromise = null;
function getDB() {
  return (
    !dbPromise &&
      (dbPromise = new Promise((v0, v1) => {
        const v2 = indexedDB["open"](DB_NAME, DB_VERSION);
        ((v2["onupgradeneeded"] = (v3) => {
          const v4 = v3["target"]["result"];
          (!v4["objectStoreNames"]["contains"](IMAGE_STORE_NAME) &&
            v4["createObjectStore"](IMAGE_STORE_NAME),
            !v4["objectStoreNames"]["contains"](THUMBNAIL_STORE_NAME) &&
              v4["createObjectStore"](THUMBNAIL_STORE_NAME));
        }),
          (v2["onsuccess"] = (v5) => v0(v5["target"]["result"])),
          (v2["onerror"] = (v6) => v1(v6["target"]["error"])));
      })),
    dbPromise
  );
}
async function putValue(v7, v8, v9) {
  const v10 = await getDB();
  return new Promise((v11, v12) => {
    const v13 = v10["transaction"](v7, "readwrite"),
      v14 = v13["objectStore"](v7),
      v15 = v14["put"](v9, v8);
    ((v15["onsuccess"] = () => v11(true)),
      (v15["onerror"] = (v16) => v12(v16["target"]["error"])));
  });
}
async function getValue(v17, v18) {
  const v19 = await getDB();
  return new Promise((v20, v21) => {
    const v22 = v19["transaction"](v17, "readonly"),
      v23 = v22["objectStore"](v17),
      v24 = v23["get"](v18);
    ((v24["onsuccess"] = (v25) => v20(v25["target"]["result"] ?? null)),
      (v24["onerror"] = (v26) => v21(v26["target"]["error"])));
  });
}
async function deleteValue(v27, v28) {
  const v29 = await getDB();
  return new Promise((v30, v31) => {
    const v32 = v29["transaction"](v27, "readwrite"),
      v33 = v32["objectStore"](v27),
      v34 = v33["delete"](v28);
    ((v34["onsuccess"] = () => v30(true)),
      (v34["onerror"] = (v35) => v31(v35["target"]["error"])));
  });
}
export async function saveImage(v36, v37) {
  return await putValue(IMAGE_STORE_NAME, v36, v37);
}
export async function getImage(v38) {
  return await getValue(IMAGE_STORE_NAME, v38);
}
export async function deleteImage(v39) {
  return await deleteValue(IMAGE_STORE_NAME, v39);
}
export async function saveThumbnailRecord(v40, v41) {
  return await putValue(THUMBNAIL_STORE_NAME, v40, v41);
}
export async function getThumbnailRecord(v42) {
  return await getValue(THUMBNAIL_STORE_NAME, v42);
}
export async function deleteThumbnailRecord(v43) {
  return await deleteValue(THUMBNAIL_STORE_NAME, v43);
}
