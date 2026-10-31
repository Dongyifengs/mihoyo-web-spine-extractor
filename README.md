# 米哈游网页 Spine 提取器

输入活动网页、官网新闻链接或 RSS 订阅地址，自动发现并下载 Spine 骨骼、图集和贴图，按 **活动 → 资源组** 整理，生成可直接打开的中文报告。

Python 3.11+，中文桌面窗口 + 命令行。Windows 可打包为独立 EXE；提取与拆分图片不需要安装 Spine 编辑器。

## 使用

### Windows 窗口

使用打包后的 `MihoyoSpineExtractor.exe`：双击运行，粘贴地址，选择目录，点击「开始提取」。无需 Python。浏览器捕获自动尝试 Chromium、系统 Edge、系统 Chrome。

从源码运行：安装 Python 3.11 或更新版本，双击 `安装依赖.bat`，完成后双击 `启动窗口.bat`。

也可手动安装：

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -e .
.venv\Scripts\python -m spine_extractor --gui
```

没有可用浏览器时，静态模式仍能工作。源码版可安装专用 Chromium：

```powershell
.venv\Scripts\python -m playwright install chromium
```

Linux 使用窗口需要系统的 Tk（如 `python3-tk`）；命令行不需要 Tk。Windows 构建产物也会出现在仓库 Actions 中成功的 `Tests and Windows build` 运行的 Artifacts 区域。

### 命令行

```powershell
# 默认：静态扫描 + 12 秒浏览器捕获
spine-extract "https://act.mihoyo.com/ys/event/e20260520invite-19ccy4/index.html"

# 快速静态扫描，保存到指定目录
spine-extract "活动地址" --mode static -o downloads

# 需要点击或切换场景的活动：显示浏览器，留 120 秒供手动操作
spine-extract "活动地址" --headed --wait 120

# 输入官网文章，自动展开并寻找“点击参与活动”
spine-extract "https://ys.mihoyo.com/main/news/detail/164277"

# RSS：默认处理前 3 个不同活动，按订阅源原始顺序
spine-extract "https://news-api.amarea.cn/news/feed/genshin.web_cn?whitelist=%E7%BD%91%E9%A1%B5%E6%B4%BB%E5%8A%A8" --feed-limit 3

# 只看订阅源中的入口，不提取活动素材
spine-extract "订阅地址" --list --feed-limit 10

# 批量输入：UTF-8 文件，每行一个地址，# 开头为注释
spine-extract --urls-file urls.txt --mode static --no-unpack --json

# 显式代理、浏览器和扫描上限
spine-extract "活动地址" --proxy http://127.0.0.1:7890 --browser msedge --max-files 2000 --max-total-mb 768
```

未激活虚拟环境时，可用 `.venv\Scripts\python -m spine_extractor` 替代 `spine-extract`。在 macOS/Linux 中改用 `.venv/bin/python`。

`--mode auto` 和 `browser` 都会做静态扫描与浏览器捕获；`browser` 模式捕获失败时命令行返回非零状态。`static` 不启动浏览器。`--no-unpack` 跳过图块拆分，适合大活动快速归档。所有选项见 `spine-extract --help`。

返回码：`0` 已发现的资源组均配套；`2` 存在失败入口、不完整资源或未发现骨骼；`130` 取消；`1` 参数之外的启动错误。默认保存请求失败诊断，但资源探测产生的无关 404 不会使完整的资源组失败。

## 输出结构

```text
downloads/时间戳/
  batch.json                         # 本次批量任务摘要
  活动名-地址摘要/
    report.html                      # 双击查看：完整/待补齐、版本、文件入口
    manifest.json                    # 来源、配对依据、SHA-256、缺图和请求失败
    spine/
      资源名-内容摘要/
        skeleton.json 或 skeleton.skel
        skeleton.atlas
        原图集页面名.png              # 与 atlas 内页面名称一致，支持多页和子目录
        regions/                     # 拆分后的区域图片，恢复旋转与裁剪偏移
        import.json                  # 拆分成功时生成的编辑器导入副本
        metadata.json
    unpaired/                        # 配对有歧义或缺少骨骼/图集，原样保留供核对
    embedded-images/                 # 脚本内的图片，可能含非 Spine 辅助素材
```

每次运行新建目录，保留以前的结果。文件内容重复会去重，文件夹附加内容摘要，避免同名覆盖。

`skeleton.json` 保留骨骼数据及原有版本、缩放、图片路径；独立下载的 JSON 保留原始字节，JS 内嵌数据转为合法 JSON。`import.json` 只将编辑器图片目录设为 `./regions/`。不会自动改版本号、缩放数值，也不会生成专有的 `.spine` 工程文件。

## 支持的资源形式

- 旧版 `JSON.parse(...)`、单/双引号和静态模板字符串中的骨骼与 atlas。
- 新版直接内嵌的 JavaScript 对象，包括当前样本使用的 Spine 4.2 数据。
- 独立 `.json`、`.atlas`、`.skel`；带可识别 Spine 版本头的 `.bin` / `.bytes`。
- HTML 脚本、CSS、iframe、ESM 资源引用、可静态求值的 webpack 懒加载 chunk 文件名。
- 浏览器实际收到的脚本、JSON、二进制、图片和延迟响应；显示浏览器后可手动触发场景。
- 哈希文件名、CDN/相对路径、`<base>`、重定向、URL 查询参数、内嵌 data URI 图片。
- 新旧 atlas 字段、多页贴图、90/180/270 度旋转、裁剪偏移与序列区域。
- RSS、Atom、JSON Feed；优先使用正文中的参与活动链接，动态新闻页用浏览器展开。

配对依据是文件名、骨骼附件路径与图集区域的对应关系，以及原始附件尺寸。不会依赖压缩变量名、固定的 `vendors.js` 文件名或字符串相邻位置。候选同样匹配时保留为待核对，不猜配。

## 实际验证

已验证提供的 2026 年茶会活动、2023 年 4.2 前瞻页及 RSS 中的新活动。详情和验证范围见 [测试记录](docs/validation.md)。离线测试使用自建素材与本地 HTTP 服务，不把网站素材提交到仓库。

## 适用范围

工具能提取静态引用可发现的资源和本次浏览器会话加载的资源。**网页未透露地址的远端资源、未触发的懒加载分支、登录后才返回的内容，不能保证全部发现。** 缺失时增加捕获时长，在显示的浏览器中进入相关场景后重试。程序不自动登录、执行活动任务或处理验证码。

动态表达式、加密/自定义封装数据、未知图集格式可能需要新增适配器。骨骼二进制会原样保存，不转换成 JSON。区域拆分保留原像素，包括原贴图的预乘 Alpha；不做自动反预乘或画质修复。

报告中的「资源齐全」表示骨骼、atlas、贴图及可检查的附件引用配套，**不表示已经用 Spine 运行时验证全部动画**。导入编辑器或播放器时仍需匹配资源版本。无 Spine 的网页会产生零资源报告，而不会把普通图片误报为骨骼。

默认并发 6、超时 25 秒、失败重试 2 次；每活动最多 1500 个请求、单文件 48 MiB、总下载 512 MiB。上限会记录到诊断中，可用命令行调整。批量活动依次处理，避免同时占用多个浏览器和大量内存。提取素材的权利归原作者，仓库的 MIT 许可仅适用于本工具代码。

## 开发与构建

```powershell
python -m pip install -e ".[dev]"
python -m ruff check .
python -m pytest -q

# 可选浏览器集成测试（需 Chromium / Edge / Chrome）
$env:SPINE_BROWSER_TEST = "1"
python -m pytest -q

# Windows 单文件 EXE；不把整套 Chromium 打包进去，默认复用 Edge/Chrome
./scripts/build_windows.ps1
```

模块职责：`resolve` 入口解析，`javascript` 安全的静态语法读取，`discovery` 资源发现，`browser` 网络捕获，`network` 有界并发下载，`matching` 配对，`atlas` 图集解析和裁切，`export` 导出与报告，`engine` 编排，`gui` / `cli` 两个入口。

格式依据：[Spine atlas 格式](https://esotericsoftware.com/spine-atlas-format)、[Spine JSON 格式](https://esotericsoftware.com/spine-json-format)。浏览器捕获使用 [Playwright 网络 API](https://playwright.dev/python/docs/network)，脚本语法读取使用 [Tree-sitter](https://github.com/tree-sitter/py-tree-sitter)。参考过用户提供的 AutoSpineProTools / SpineAuto 的功能需求，本实现重新编写，不依赖其中的 Spine 安装路径或代理配置。
