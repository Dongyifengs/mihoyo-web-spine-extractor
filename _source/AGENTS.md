# 仓库贡献指南

## 项目结构与模块组织

本项目是浏览已手动整理 Spine 素材的 Vite 静态网站。`src/` 存放界面、渲染器、资源加载器和仅解析字面量的脚本解码器。`projects/<id>/` 包含项目的 `index.html`、`manifest.json`、`cover.json` 和 `spine/index.json`；`catalog.json` 登记项目。`public/` 存放图标与第三方声明，`scripts/` 存放目录校验脚本，`tests/` 存放 Node 测试，`dist/` 是构建产物。`docs/` 下的独立原型不参与根目录 Vite 构建。

远端发布仓库的根目录包含编译后的网页文件，`_source/` 保存源码快照。同步或修改发布文件前，先检查分支与部署配置；保留 `CNAME` 和无关改动。

## 构建、测试与开发命令

使用 Node.js 22 或更新版本：

- `npm ci`：按照锁文件安装依赖。
- `npm run dev`：启动本地 Vite 开发服务器。
- `npm test`：运行 Node 测试。
- `npm run build`：校验目录并构建到 `dist/`。
- `npm run preview`：在本地预览生产构建。

请通过 HTTP 访问页面，以便加载 JSON。保留 Vite 相对路径配置；修改路由或部署方式时，验证项目子路径。

## 代码风格与命名规范

遵循现有 JavaScript ES 模块风格：使用两个空格缩进、单引号、分号和含义明确的 camelCase 标识符。项目 ID 使用短横线命名，例如 `projects/nicoles-tea-party/`。保留原生无障碍控件和响应式布局。当前未配置格式化或 lint 工具，避免无关格式调整。

## 测试指南

使用 `node:test` 和 `node:assert/strict`，测试文件命名为 `*.test.mjs`。修改解析、资源加载或目录校验逻辑时，增加有针对性的测试。提交前运行 `npm test` 和 `npm run build`。修改界面或资源时，还需检查桌面和手机浏览器布局、真实在线加载及错误状态，并区分模拟测试与真实来源验证。当前没有覆盖率阈值。

## 提交与 Pull Request 规范

使用 `<type>(<scope>): <中文说明>` 格式，例如 `fix(player): 修复贴图加载失败`。`type` 使用 `feat`、`fix`、`docs` 等约定英文类型；提交标题的变更说明和正文均使用中文。标题保持简洁，不超过 50 个字符，不以句号结尾。必要时在正文说明修改原因、实现方式和风险。Pull Request 应说明行为变化、验证结果和限制；关联相关 issue，界面变化附截图。

## 资源、安全与智能体要求

Spine 只保存官方 HTTPS 资源地址和内嵌资源定位键，不提交下载的骨骼、图集、贴图或 base64 素材。测试合并所需的静态场景捕获帧可压缩保存，应记录来源并控制体积。禁止执行远程活动脚本；解码器只接受数据字面量。保留第三方许可声明，并说明跨域或源站可用性限制。每次新的本机 Codex 对话默认加载并遵循 `C:/Users/MoYi-Work/.codex/skills/dsh-ops/SKILL.md`，同时遵守更高优先级指令和当前任务权限。
