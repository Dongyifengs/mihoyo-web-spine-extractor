# 米哈游网页 Spine 素材工作台

输入米哈游活动网页、新闻链接或 RSS 地址，提取 Spine 骨骼、atlas 和贴图，按活动标题整理。在本地网页中浏览动画卡片、切换动作与皮肤；可选调用正版 Spine CLI 拆图并生成 `.spine` 工程。

**Python 3.11+，本地网页应用。** 启动服务后打开浏览器操作，默认地址 `http://127.0.0.1:8765`。不需要桌面窗口或 EXE。

## 启动

Windows 安装 Python 3.11 或更新版本，下载本仓库或 Actions 中的 `mihoyo-spine-web` 压缩包，解压后双击 **`启动网页.bat`**。首次启动会创建虚拟环境并安装依赖，然后打开浏览器。保持启动终端运行，关闭终端会停止服务。

也可以手动运行：

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -e .
.venv\Scripts\python -m spine_extractor serve
```

macOS/Linux 将 `.venv\Scripts\python` 换成 `.venv/bin/python`。安装后也可使用 `spine-web`。默认从 8765 开始选择空闲端口，也可用 `--port 8766` 指定；`--no-open` 禁用自动打开浏览器。更新后请使用新启动的地址。网页发现旧后端时会尝试跳转到同一素材目录的新版服务，找不到时明确提示重新启动，不会把接口版本问题误报为封面文件丢失。

浏览器捕获依次尝试 Playwright Chromium、系统 Edge、系统 Chrome。均未安装时可运行 `python -m playwright install chromium`，或使用静态模式。

## 网页操作

1. **提取素材**：粘贴活动、新闻或 RSS 地址，每行一个。默认静态扫描结合浏览器捕获；需要交互的活动可勾选显示浏览器、增加等待时间，再进入相应场景。
2. **素材库**：每个活动展示网页封面，点击封面进入动画网格。已有活动可「补全封面」，单张可「重拍封面」。只有一个皮肤时隐藏皮肤框；单动作显示名称，2–4 个动作直接按按钮切换，更多动作使用下拉框。支持播放、暂停、循环和重播。
3. **测试合并**：从活动素材页进入，按原网页的位置、缩放、透视和前后层级播放本地动画。没有布局时点击「读取原网页布局」；支持场景选择、图层显隐、动作切换、暂停、重播、拖拽缩放、全屏和原画面对照。
4. **设置**：修改输出目录、代理，以及可选的 Spine CLI 路径。设置保存在本机 `.spine-extractor/settings.json`。

预览先从 UNPKG 请求骨骼记录的完整版本：`https://unpkg.com/@esotericsoftware/spine-player@4.2.43/dist/iife/spine-player.js`。版本不存在、超时、返回错误页或无效代码时，依次尝试 `@4.2.x`（同主/次版本的最新补丁）和随包提供的本地运行时。不会改用其他主/次版本。随包包含 3.8 / 4.0 / 4.1 / 4.2；同版本并发加载共用一次请求，运行时命名空间彼此隔离。版本匹配依据见 [Spine 官方播放器文档](https://esotericsoftware.com/spine-player)。

进入活动后立即加载并持续渲染全部卡片，滚动和筛选不会卸载动画。同版本共享 WebGL 上下文，分批绘制后复制到卡片，避免大量播放器耗尽浏览器上下文。**打开详情时隐藏并停止后台卡片绘制，关闭后恢复各自的播放/暂停状态**，不会重新下载素材。

详情支持拖拽平移、滚轮或按钮缩放、双击复位、全屏、速度和背景切换。调试显示直接使用官方运行时的骨骼、区域、网格、边界框、路径、裁剪和点附件叠加层。

卡片页、详情和测试合并页提供可拖动的「帧率调试」浮窗，可关闭再打开。显示实际渲染批次 FPS、帧率曲线、绘制耗时、P95 帧间隔和波动；不是单独空跑一个动画计时器计算帧率。卡片/合并默认 30 FPS，详情上限 60 FPS。extra 只按 10 Hz 采样选中的骨骼，列表与只读参数仅在骨骼/动作变化时更新，避免展开原生下拉框时反复重建选项。

骨骼 JSON 含 `extra` 时标记「extra · 飘动」，在基础动画后应用参考代码的后处理。详情右侧「extra 飘动调试」使用工作台自身的控件，可折叠，随右侧栏滚动。骨骼下拉框显示「名称 · 类型」，支持搜索、选中骨骼的实时波动曲线、飘动开关和骨骼显示。**参数全部只读，不提供添加、删除、恢复或编辑操作。** 格式不支持或骨骼缺失时显示具体提示并保留原素材。

网页卡片、详情、合并页及新建工程均优先选取名称中包含 `loop` 的动作（忽略大小写，按原始顺序取首个）；没有匹配项时选择第一个动画。

合并布局来自已加载的 Vue/Three 场景图和实际渲染过程，包括遮罩内的独立场景；用骨骼 hash / 原资源名称匹配本地素材，静态背景按图层保存为透明 PNG。自动/浏览器提取会尝试一并记录布局，已有活动可单独捕获。只重播已捕获的场景，原网页的交互、镜头切换与自定义粒子着色器不在本地重演，静态部分保留捕获帧。其他引擎无法识别时会提示原因，不会把随机排布当作原网页布局；重拍失败保留旧布局。

封面在活动网页加载后等待 **20 秒**，隐藏进入活动、分享、登录等界面元素，再截取 1280 × 720 的当前画面，保存为活动目录的 `cover.jpg`。支持常见 DOM 控件和米哈游 Vue/Three 场景中命名为按钮的图层；人物、背景、标题保留。清理仅用于独立浏览器中的截图，不修改下载的素材，也不自动点击登录或参加活动。定制引擎中无法识别的画内 UI 可能仍会保留。

自动/浏览器模式复用捕获页面生成封面；静态模式会额外启动浏览器截图。无浏览器或截图失败不会丢弃提取结果，可稍后重拍；重拍失败会保留上一张封面。CLI 可用 `--no-cover` 跳过截图，配合 `--mode static` 完全不启动浏览器。

报告与素材库使用同样的动画卡片。从工作台打开报告；直接以 `file://` 双击 `report.html` 无法加载网页服务中的播放器和操作接口。

## HoyoNews 活动来源

左侧「网页活动」对接 [HoyoNews](https://news.hk4e.com) 使用的公共 API（`https://news-api.amarea.cn/news/{source}` 和 `/news/detail/{key}`），仅接入三款游戏官网来源，支持搜索、勾选和拖动框选（Ctrl / Shift 追加选择）。点击加入提取后先读取官方新闻正文，只把正文中的实际活动超链接放入输入框；缺少公开入口时保留失败原因，不导入新闻地址。

| 游戏 | 精确匹配的 tag |
| --- | --- |
| 原神 | 网页活动 |
| 崩坏：星穹铁道 | 版本专题展示页 |
| 绝区零 | 网页活动 |

只以 API 的 `tags` 数组判断，标题中提到活动不算命中；解析正文前再次校验详情标签；分别读取原神 `.article__content`、崩铁 `.detail-content .main-wrap`、绝区零 `.news-detail__content`，排除导航链接。正文中的活动链接进入原有提取流程，支持 `/event/` 和新的 `/puzzle/` 入口。同一活动链接去重。新闻列表缓存 5 分钟，每次最多加入 100 条，点击「开始提取」后才下载素材。

也可在输入框或 CLI 输入 HoyoNews 网站地址（默认原神官网）、上述 API 的列表/详情地址或已有 RSS 地址。列表入口受「订阅条数」/ `--feed-limit` 限制，默认解析最新 3 条匹配记录；直接选择的详情地址逐条处理。

## 可选：生成 Spine 工程

**需要自行安装并激活正版 Spine，工具不提供编辑器或许可证。** 不配置 CLI 时仍可提取、拆图；网页预览运行时的许可见下方第三方说明。

在「设置 → Spine CLI」填写安装目录中的 `spine.com`，例如 `D:\Program Files\Spine\spine.com`，也可点击检测路径。保存后：

- 新提取任务可勾选「生成 .spine 工程」。
- 已提取活动可点击「全部生成 .spine」，或在单个素材详情中生成。
- 成功后点击「在 Spine 中打开工程」，或直接双击项目目录里的 `.spine` 文件（需要系统已关联 Spine 编辑器）。

程序调用 CLI 解包 atlas，再导入骨骼；图片路径使用相对于工程的 `./regions/`。原始 JSON/二进制保持不变。二进制骨骼会先通过 CLI 转出用于导入的 JSON 副本。

新建工程按上述 `loop` 优先规则选中默认动画。写入选择状态前，用官方 CLI 分别回读原工程和候选工程，确认骨骼与动画数据一致；不识别的工程结构会保留原工程并提示手动选择。已有工程可能经过用户编辑，因此不会覆盖其选择状态。

Spine 编辑器双击打开工程时可能仍进入「设置」模式，切到「动画」模式即可显示已选动作。网页的「在 Spine 中打开」请求按保存版本启动，对 4.1+ 传入 `--animate-mode`。部分旧启动器会忽略独立实例参数、复用已打开的窗口；遇到版本或模式未切换时，先关闭该窗口再从网页打开。这不修改系统文件关联或编辑器的全局设置。

**extra 只在网页中渲染，不会烘焙或写入 `.spine`。** 转换前在网页提示，转换结果及日志保留说明。用于 CLI 的 `import.json` 会移除 `extra`、`extraSlot`、`extraConfig`；原始 `skeleton.json` 仍完整保留。

默认按骨骼版本选择编辑器，`4.0-from-4.1.24` 使用其来源版本 `4.1.24` 导入。也可以在设置中指定版本。首次使用某个版本时 Spine 可能需要下载更新，必要时增大超时。版本、授权或数据不兼容时会保留素材并显示失败原因，详见该组 `spine-cli.log`。

## 文件组织

```text
outputs/
  魔女尼可的茶会/
    report.html
    cover.jpg                        # 网页加载 20 秒后，隐藏界面控件的封面
    composition.json                 # 原网页场景、位置、图层与素材对应关系
    composition/                     # 合并页的透明静态图层与对照画面
    manifest.json                    # 来源、配对依据、完整性、版本、动画与工程状态
    spine/
      game_bei_a/
        skeleton.json 或 skeleton.skel
        skeleton.atlas
        原图集页面名.png              # 与 atlas 内的文件名一致，支持多页、子目录
        regions/                     # 拆分出的图片
        import.json                  # 相对图片路径的导入副本
        game_bei_a.spine              # 可选：正版 CLI 转换成功后生成
        spine-cli.log                # 可选：转换记录
        metadata.json
      game_bei_a-1/                  # 同名不同资源按顺序编号
    unpaired/                        # 缺少配套或配对有歧义的资源
    embedded-images/                 # 脚本内的辅助图片
  魔女尼可的茶会-1/                   # 再次提取保留上一次结果
  .spine-extractor/runs/              # 批量任务记录
```

活动名优先使用手动名称，其次使用网页标题和入口提供的标题。动态标题通过浏览器获取；确实没有标题时标为「未命名活动」，可手动填写。活动和项目目录均不添加随机摘要。遇到同名按 `-1`、`-2`、`-3` 编号；Windows 不允许的字符会替换。

`skeleton.json` 保留原始版本、缩放和图片目录，独立 JSON 保留原始字节。仅 `import.json` 使用 `./regions/`。未配置 CLI 时，Pillow 拆图保留原贴图像素和预乘 Alpha，不擅自改版本或修复画质。

## 命令行

```powershell
# 开启本地网页
spine-extract serve --port 8765

# 提取活动，默认静态扫描 + 12 秒浏览器捕获
spine-extract "https://act.mihoyo.com/ys/event/e20260520invite-19ccy4/index.html"

# 快速扫描；静态网页无标题时可指定名称
spine-extract "活动地址" --mode static --title "活动名称" -o outputs

# 显示浏览器以手动触发场景
spine-extract "活动地址" --headed --wait 120

# 可选工程转换
spine-extract "活动地址" --spine-cli "D:\Program Files\Spine\spine.com"

# 新闻正文中的参与入口
spine-extract "https://ys.mihoyo.com/main/news/detail/164277"

# RSS 默认按源顺序处理前 3 个不同活动
spine-extract "https://news-api.amarea.cn/news/feed/genshin.web_cn?whitelist=%E7%BD%91%E9%A1%B5%E6%B4%BB%E5%8A%A8" --feed-limit 3

# 只列出 RSS 活动入口
spine-extract "订阅地址" --list --feed-limit 10

# 批量地址文件；不拆图，只保存原始资源
spine-extract --urls-file urls.txt --mode static --no-unpack --json
```

未激活虚拟环境时用 `.venv\Scripts\python -m spine_extractor` 替代 `spine-extract`。更多设置见 `spine-extract --help`。CLI 配置来自命令参数，网页设置不会自动应用到独立的提取命令。

返回码：`0` 已发现资源组配套完整；`2` 有失败入口、不完整组、无骨骼或工程转换失败；`130` 用户取消；`1` 启动错误。无关探测的 404 会记入清单，不会使已配套资源失败。

## 发现与配对范围

支持旧 `JSON.parse` / 字符串与现代 JavaScript 内嵌对象、独立 JSON/atlas/skel、可识别版本头的 bin/bytes、HTML/CSS/iframe/ESM、静态可求值的 webpack 懒加载文件名、浏览器实际收到的网络响应、CDN/相对路径和 data URI。入口支持 RSS、Atom、JSON Feed、新闻正文的「点击参与活动」。

配对依靠文件名、附件路径、atlas 区域和附件尺寸；候选同样匹配时保留待核对。支持多页、新旧 atlas、90/180/270 度旋转、裁剪偏移和序列区域。

**仅能发现网页公开引用以及本次浏览器会话加载的资源。** 未触发的远端分支、需要登录才返回的地址、加密或自定义封装可能需要手动进入场景或新增适配。程序不自动登录或完成活动任务。

「资源齐全」表示骨骼、atlas 和贴图配套；具体动画是否可播放以播放器结果为准。默认并发 6、超时 25 秒、失败重试 2 次；每活动最多 1500 请求、单文件 48 MiB、总下载 512 MiB，命令行可调整。

## 开发与验证

```powershell
python -m pip install -e ".[dev]"
python -m ruff check .
python -m pytest -q

# 实际浏览器捕获和 WebGL 播放测试
$env:SPINE_BROWSER_TEST = "1"
python -m pytest -q

# 打包仓库跟踪的网页源码与运行时
python scripts/package_web.py
```

CI 在 Windows/Linux、Python 3.11/3.12 执行测试，并产生网页源码压缩包。真实活动、CLI 与网页验证记录见 [docs/validation.md](docs/validation.md)。

主要模块：`resolve` 入口解析，`javascript` 静态语法读取，`discovery` 发现，`browser` 网络捕获，`network` 有界下载，`matching` 配对，`atlas` 拆图，`export` 归档，`spine_cli` 工程转换，`server` 本地 API，`static` 网页界面与播放器。

## 许可与参考

本工具原创代码使用 MIT 许可；提取素材的权利归原作者。Spine Runtimes 与用户提供的 Dayu extra 参考代码 **不属于本项目 MIT 许可**，详见 [第三方说明](THIRD_PARTY_NOTICES.md)、[运行时许可全文](src/spine_extractor/static/vendor/SPINE-RUNTIMES-LICENSE.txt) 和 [extra 来源说明](src/spine_extractor/static/vendor/DAYU-NOTICE.txt)。

格式参考：[Spine atlas](https://esotericsoftware.com/spine-atlas-format)、[Spine JSON](https://esotericsoftware.com/spine-json-format)、[Spine Player](https://esotericsoftware.com/spine-player)。网络捕获使用 [Playwright](https://playwright.dev/python/docs/network)，脚本分析使用 [Tree-sitter](https://github.com/tree-sitter/py-tree-sitter)。参考了用户提供的 AutoSpineProTools / SpineAuto 的功能，本实现重新编写。
