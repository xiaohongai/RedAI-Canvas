import { THUMBNAIL, IMAGE_COMPRESSION } from "../utils/constants.js";
import { fetchRemoteBlob } from "../../api/projectsV2Api.js";
export async function generateThumbnail(
  v0,
  v1 = THUMBNAIL["maxWidth"],
  v2 = THUMBNAIL["maxHeight"],
) {
  if (!v0) return "";
  return new Promise((v3) => {
    const v4 = new Image();
    ((v4["crossOrigin"] = "anonymous"),
      (v4["onload"] = () => {
        const v5 = document["createElement"]("canvas"),
          v6 = v5["getContext"]("2d");
        let v7 = v4["naturalWidth"],
          v8 = v4["naturalHeight"];
        v7 > v8
          ? v7 > v1 && ((v8 *= v1 / v7), (v7 = v1))
          : v8 > v2 && ((v7 *= v2 / v8), (v8 = v2));
        ((v5["width"] = v7),
          (v5["height"] = v8),
          v6["drawImage"](v4, 0, 0, v7, v8));
        const v9 = v5["toDataURL"](THUMBNAIL["format"], THUMBNAIL["quality"]);
        ((v5["width"] = 0), (v5["height"] = 0), v3(v9));
      }),
      (v4["onerror"] = () => {
        v3("");
      }),
      (v4["src"] = v0));
  });
}
export async function compressImage(
  v10,
  v11 = IMAGE_COMPRESSION["maxDimension"],
  v12 = IMAGE_COMPRESSION["quality"],
) {
  return new Promise((v13, v14) => {
    const v15 = new Image();
    ((v15["crossOrigin"] = "Anonymous"),
      (v15["onload"] = () => {
        let { width: v16, height: v17 } = v15;
        (v16 > v11 || v17 > v11) &&
          (v16 > v17
            ? ((v17 = Math["round"]((v17 * v11) / v16)), (v16 = v11))
            : ((v16 = Math["round"]((v16 * v11) / v17)), (v17 = v11)));
        const v18 = document["createElement"]("canvas");
        ((v18["width"] = v16), (v18["height"] = v17));
        const v19 = v18["getContext"]("2d");
        (v19["drawImage"](v15, 0, 0, v16, v17),
          v18["toBlob"](
            (v20) => {
              v20 ? v13(v20) : v14(new Error("Canvas toBlob failed"));
            },
            IMAGE_COMPRESSION["format"],
            v12,
          ));
      }),
      (v15["onerror"] = (v21) => {
        (console["warn"]("[imageUtils.js] 跨域或加载失败，跳过本地压缩", v21),
          v14(v21));
      }),
      fetchRemoteBlob(v10)
        ["then"]((v22) => {
          v15["src"] = URL["createObjectURL"](v22);
        })
        ["catch"]((v23) => {
          v15["src"] = v10;
        }));
  });
}
