const TIPS = [
    "💡 视图：滚轮可以缩放画布，右下角滑杆也能精细调整缩放比例。",
    "💡\x20视图：【Ctrl\x20+\x20+\x20/\x20-】能快速放大或缩小画布。",
    "💡 视图：按【F】会聚焦选中的节点；没选中时会适应整个画布。",
    "💡\x20视图：按【M】可以开启或关闭右下角小地图。",
    "💡\x20视图：按住【空格】再拖动鼠标左键，可以平移画布。",
    "💡 视图：按鼠标中键拖动，也能快速平移画布。",
    "💡\x20创建：双击画布空白处，可以打开节点创建菜单。",
    "💡\x20创建：点左侧加号，可以打开节点大全，也能上传本地素材。",
    "💡 创建：按【N】可以快速创建注释节点，用来写说明和待办。",
    "💡 创建：按【Q】创建生成文本节点，【W】创建生成图像节点。",
    "💡 创建：按【E】创建生成视频节点，【R】创建生成音频节点。",
    "💡 创建：把图片、视频或音频拖进画布，会自动生成对应的源节点。",
    "💡 编辑：【Ctrl + A】可以全选画布里的节点。",
    "💡\x20编辑：按住【Shift】点击节点，可以追加或取消多选。",
    "💡\x20编辑：在画布空白处拖拽，可以框选多个节点。",
    "💡\x20编辑：【Ctrl\x20+\x20C】复制节点，【Ctrl\x20+\x20V】粘贴节点。",
    "💡 编辑：【Ctrl + X】可以剪切当前选中的节点。",
    "💡 编辑：选中节点后按【D】、【Delete】或【Backspace】可以删除。",
    "💡 编辑：【Ctrl + Z】撤销，【Shift + Ctrl + Z】重做。",
    "💡 整理：多选节点后按【Ctrl + G】可以把它们打成组。",
    "💡 整理：多选节点后按【Tab】可以打开对齐面板。",
    "💡 整理：按【；】可以开启或关闭辅助线吸附。",
    "💡\x20整理：按【L】可以开启或关闭网格吸附。",
    "💡 整理：选中图片或视频节点后，按【Shift + R】可恢复默认大小。",
    "💡 连线：拖住节点边上的连接点，再松到另一个节点上就能建立连线。",
    "💡\x20连线：连错了可以按住【Ctrl】在连线上横划，快速切断连线。",
    "💡 连线：鼠标停在连线上一会儿，会出现剪刀按钮，点击即可删除连线。",
    "💡 节点：双击节点标题或标签名，可以给节点重命名。",
    "💡 图像：单选图像节点后，数字【1】到【0】可以触发遮罩、重绘、擦除等图像工具。",
    "💡 图像：【Ctrl + Shift + C】可以复制当前单选图像节点的图片。",
    "💡 视频：单选视频节点后，【1】裁剪，【2】抠像，【3】高清，【4】全屏，【5】下载。",
    "💡 视频：单选视频节点后，按【C】可以截取当前帧。",
    "💡\x20音频：单选音频节点后，【1】裁剪，【2】倍速，【3】下载。",
    "💡 文本：单选文本节点后，【1】复制内容，【2】全屏查看。",
    "💡 3D：进入 3D导演台后，【V】切换鼠标模式，【W/E/R】切换移动、缩放、旋转。",
    "💡 3D：进入 3D导演台后，按【C】可以截图。",
    "💡 项目：【Ctrl + S】可以保存当前画布项目。",
    "💡 项目：按【K】可以打开设置面板。",
    "💡 设置：键盘快捷键可以在设置里自定义，适合按自己的习惯调整。",
    "💡 提示：按【Esc】可以关闭菜单、弹窗或退出当前临时模式。",
  ],
  MascotManager = {
    _lastIdx: -1,
    _visible: false,
    _rotationTimer: null,
    _fabBtn: null,
    _mascotWrap: null,
    _mascotText: null,
    _mascotFigure: null,
    init() {
      ((this["_fabBtn"] = document["getElementById"]("fabBtn")),
        (this["_mascotWrap"] = document["getElementById"]("mascotWrap")),
        (this["_mascotText"] = document["getElementById"]("mascotText")),
        (this["_mascotFigure"] = document["getElementById"]("mascotFigure")));
      if (!this["_fabBtn"] || !this["_mascotWrap"] || !this["_mascotText"])
        return;
      this["_bindEvents"]();
    },
    _getRandTip() {
      let v0;
      do {
        v0 = Math["floor"](Math["random"]() * TIPS["length"]);
      } while (v0 === this["_lastIdx"] && TIPS["length"] > 1);
      return ((this["_lastIdx"] = v0), TIPS[v0]);
    },
    _updateTip() {
      if (!this["_mascotText"]) return;
      ((this["_mascotText"]["textContent"] = this["_getRandTip"]()),
        this["_mascotText"]["classList"]["remove"]("refresh"),
        void this["_mascotText"]["offsetHeight"],
        this["_mascotText"]["classList"]["add"]("refresh"),
        this["_triggerShake"]());
    },
    _showMascot() {
      if (this["_visible"] || !this["_mascotWrap"] || !this["_mascotText"])
        return;
      ((this["_mascotText"]["textContent"] = this["_getRandTip"]()),
        this["_mascotText"]["classList"]["remove"]("refresh"),
        void this["_mascotText"]["offsetHeight"],
        this["_mascotText"]["classList"]["add"]("refresh"),
        this["_mascotWrap"]["classList"]["add"]("visible"),
        (this["_visible"] = true),
        this["_restartIdle"](),
        clearInterval(this["_rotationTimer"]),
        (this["_rotationTimer"] = setInterval(() => {
          if (this["_visible"]) this["_updateTip"]();
        }, 8000)));
    },
    _hideMascot() {
      if (!this["_visible"] || !this["_mascotWrap"]) return;
      (this["_mascotWrap"]["classList"]["remove"]("visible"),
        (this["_visible"] = false),
        clearInterval(this["_rotationTimer"]));
    },
    _triggerShake() {
      if (!this["_mascotFigure"]) return;
      (this["_mascotFigure"]["classList"]["remove"]("shake", "idle"),
        void this["_mascotFigure"]["offsetHeight"],
        this["_mascotFigure"]["classList"]["add"]("shake"),
        this["_mascotFigure"]["addEventListener"](
          "animationend",
          () => {
            (this["_mascotFigure"]["classList"]["remove"]("shake"),
              this["_mascotFigure"]["classList"]["add"]("idle"));
          },
          { once: true },
        ));
    },
    _restartIdle() {
      if (!this["_mascotFigure"]) return;
      (this["_mascotFigure"]["classList"]["remove"]("shake"),
        void this["_mascotFigure"]["offsetHeight"],
        this["_mascotFigure"]["classList"]["add"]("idle"));
    },
    _bindEvents() {
      (this["_fabBtn"]["addEventListener"]("click", (v1) => {
        (v1["stopPropagation"](),
          !this["_visible"]
            ? this["_showMascot"]()
            : (this["_updateTip"](),
              clearInterval(this["_rotationTimer"]),
              (this["_rotationTimer"] = setInterval(() => {
                if (this["_visible"]) this["_updateTip"]();
              }, 8000))));
      }),
        this["_mascotWrap"]["addEventListener"]("click", (v2) => {
          (v2["stopPropagation"](), this["_hideMascot"]());
        }));
    },
    show() {
      this["_showMascot"]();
    },
    hide() {
      this["_hideMascot"]();
    },
    isVisible() {
      return this["_visible"];
    },
  };
export default MascotManager;
export { MascotManager };
