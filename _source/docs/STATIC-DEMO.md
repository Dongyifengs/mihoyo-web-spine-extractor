# 静态工作台 Demo

根目录是当前实现，复用 `main-o` 的浅色工作台 UI、动画卡片、详情播放器、extra 面板和共享 WebGL 渲染。`docs/` 中原有的独立原型保留，当前构建与部署不包含它。

## 开发与预览

需要 Node.js 22 或更新版本。

```powershell
npm ci
npm run dev
```

打开命令输出的本地地址。生产构建与预览：

```powershell
npm test
npm run build
npm run preview
```

`dist/` 是完整静态站点，无 Python 后端、代理、账号或服务端 API。不要直接双击 HTML；通过 HTTP 服务访问。

## GitHub Pages

仓库 Settings → Pages → Build and deployment 选择 **GitHub Actions**。提交到 main 后，`.github/workflows/pages.yml` 执行测试、构建并发布 `dist/`。PR 只验证构建，不部署。

此轮仅制作并验证本地 demo，未提交、推送、修改远端设置或发布。配置采用 [GitHub Pages 官方工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

Vite 使用相对路径，多入口包含首页与各项目 `index.html`。实际验证过仓库子路径和项目深链接刷新，不需要 SPA 404 回退。

## 数据组织

```text
catalog.json
projects/
  nicoles-tea-party/
    index.html          # 独立项目总览入口
    cover.json          # 官方封面 URL 与描述
    manifest.json       # 项目基本信息
    spine/index.json    # 每组资源的在线 URL 与定位信息
  snezhnaya-travel-guide/
  snezhnaya-is-coming/
src/                    # 共用界面与播放器
public/                 # 站点图标与第三方许可
```

当前手动整理的实际样例：

| 活动 | Spine 组数 | 骨骼版本 |
| --- | ---: | --- |
| 魔女尼可的茶会 | 30 | 4.2.43 |
| 至冬漫游手册 | 14 | 4.2.43 |
| 至冬将至 | 32 | 4.2.42 / 4.2.43 |

封面使用 HoyoNews 活动新闻中的官方封面地址，不是重拍的网页画面。索引不保存 PNG、JSON 骨骼、SKEL、atlas 内容或 base64 贴图；构建时不下载这些活动资源。

## 添加项目

1. 复制一个 `projects/<id>/` 目录，更改 HTML 的 `data-project`，保留 `data-root="../../"`。
2. 更新 manifest、封面索引、Spine 索引；`spineCount` 和 `textureCount` 必须与索引一致。
3. 在 `catalog.json` 添加项目 ID 与 manifest 相对路径。
4. 执行 `npm test` 和 `npm run build`，再在浏览器检查真实播放。

独立资源使用如下引用：

```json
{
  "skeleton": { "url": "https://官方域名/资源.json", "format": "json" },
  "atlas": { "url": "https://官方域名/资源.atlas", "format": "atlas" },
  "textures": [{ "page": "atlas内的页面名.png", "url": "https://官方域名/实际贴图.png" }]
}
```

二进制骨骼使用 `format: "skel"`；不通过 URL 后缀猜格式。多页 atlas 必须逐项提供纹理映射，允许 CDN 文件名与 atlas 内页面名不同。`initialSkin` 可指定展示用默认皮肤。

本次真实样例的骨骼和 atlas 位于官方脚本中，少量 PNG 也内嵌其中：

```json
{
  "url": "https://官方域名/index_实际哈希.js",
  "format": "embedded-json",
  "key": "../../resources/images/effect/spine/资源.json"
}
```

图集和内嵌贴图分别使用 `embedded-atlas`、`embedded-image`。`key` 是脚本对象中的真实键，不是另一个可访问 URL。浏览器通过 Acorn 解析字面量；拒绝动态表达式、不执行 `eval` 或源站代码。单个脚本在当前页面只读取和解析一次。

## 功能与边界

- 素材库：封面、搜索、游戏筛选、日期排序、本地收藏、空状态、封面失败回退。
- 动画卡片：全部加载、共享 WebGL、动作和皮肤、循环、重播、全部暂停；默认优先包含 loop 的动作。
- 详情：拖拽、缩放、复位、全屏、速度、背景、骨骼/网格调试、extra 飘动只读面板、实际渲染帧率。
- 详情打开时暂停后台卡片，关闭后恢复；浏览器后台暂停渲染；页面离开释放上下文。系统减少动画偏好下默认暂停。
- 失败保留官方资源链接，支持重试。官方 URL 失效或跨域策略变更需要人工更新索引。
- 测试合并使用原网页的动画矩阵、皮肤和图层顺序。茶会收录 16 个 Spine 图层、9 个静态截图图层和一张原画面对照；其他两个活动暂无场景数据。静态截图为压缩后的 WebP 捕获帧，10 张合计约 426 KB，并非 Spine 骨骼或贴图。原网页的交互、镜头切换及动态粒子不在此重演。
- demo 运行时只支持 Spine 4.2，未实测真实 SKEL 来源。无在线提取、下载打包、拆图、`.spine` 导出或编辑器调用。

## 技术取舍

使用 Vite 多入口静态页面、原生 HTML 控件与本地可维护的旧版组件。运行依赖仅官方 `@esotericsoftware/spine-webgl` 和 Acorn；不为当前交互额外引入 React、状态库或相似 UI 库。运行时、解析器、画廊按需加载。

详情数据结构和渲染逻辑参考 `main-o`，活动素材权利归原作者。第三方声明见根目录 `THIRD_PARTY_NOTICES.md`。
