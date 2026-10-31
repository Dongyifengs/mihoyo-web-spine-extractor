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

macOS/Linux 将 `.venv\Scripts\python` 换成 `.venv/bin/python`。安装后也可使用 `spine-web`。端口被占用时执行 `python -m spine_extractor serve --port 8766`；`--no-open` 禁用自动打开浏览器。

浏览器捕获依次尝试 Playwright Chromium、系统 Edge、系统 Chrome。均未安装时可运行 `python -m playwright install chromium`，或使用静态模式。

## 网页操作

1. **提取素材**：粘贴活动、新闻或 RSS 地址，每行一个。默认静态扫描结合浏览器捕获；需要交互的活动可勾选显示浏览器、增加等待时间，再进入相应场景。
2. **素材库**：选择活动，在网格中直接观看动画。每张卡片都有动作、皮肤、播放/暂停、循环和重播控制，详情提供大预览、速度选择和文件入口。
3. **设置**：修改输出目录、代理，以及可选的 Spine CLI 路径。设置保存在本机 `.spine-extractor/settings.json`。

预览按骨骼版本选择随包提供的 Spine 3.8 / 4.0 / 4.1 / 4.2 运行时，无需从 CDN 加载。当前视野最多启用 8 个卡片播放器，滚出视野后释放；详情使用独立播放器。其他版本或资源异常会显示具体错误，原始素材仍可下载。

报告与素材库使用同样的动画卡片。从工作台打开报告；直接以 `file://` 双击 `report.html` 无法加载网页服务中的播放器和操作接口。

## 可选：生成 Spine 工程

**需要自行安装并激活正版 Spine，工具不提供编辑器或许可证。** 不配置 CLI 时仍可提取、拆图；网页预览运行时的许可见下方第三方说明。

在「设置 → Spine CLI」填写安装目录中的 `spine.com`，例如 `D:\Program Files\Spine\spine.com`，也可点击检测路径。保存后：

- 新提取任务可勾选「生成 .spine 工程」。
- 已提取活动可点击「全部生成 .spine」，或在单个素材详情中生成。
- 成功后点击「在 Spine 中打开工程」，或直接双击项目目录里的 `.spine` 文件（需要系统已关联 Spine 编辑器）。

程序调用 CLI 解包 atlas，再导入骨骼；图片路径使用相对于工程的 `./regions/`。原始 JSON/二进制保持不变。二进制骨骼会先通过 CLI 转出用于导入的 JSON 副本。

默认按骨骼版本选择编辑器，`4.0-from-4.1.24` 使用其来源版本 `4.1.24` 导入。也可以在设置中指定版本。首次使用某个版本时 Spine 可能需要下载更新，必要时增大超时。版本、授权或数据不兼容时会保留素材并显示失败原因，详见该组 `spine-cli.log`。

## 文件组织

```text
outputs/
  魔女尼可的茶会/
    report.html
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

本工具原创代码使用 MIT 许可；提取素材的权利归原作者。随包提供的 Spine Runtimes **不属于 MIT 许可**，使用与再分发须遵守其独立许可，详见 [第三方说明](THIRD_PARTY_NOTICES.md) 与 [运行时许可全文](src/spine_extractor/static/vendor/SPINE-RUNTIMES-LICENSE.txt)。

格式参考：[Spine atlas](https://esotericsoftware.com/spine-atlas-format)、[Spine JSON](https://esotericsoftware.com/spine-json-format)、[Spine Player](https://esotericsoftware.com/spine-player)。网络捕获使用 [Playwright](https://playwright.dev/python/docs/network)，脚本分析使用 [Tree-sitter](https://github.com/tree-sitter/py-tree-sitter)。参考了用户提供的 AutoSpineProTools / SpineAuto 的功能，本实现重新编写。
