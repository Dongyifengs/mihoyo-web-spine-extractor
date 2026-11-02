# 开通百度统计热门活动排行

网站已经安装百度统计采集脚本。“热门活动”读取的是百度统计的**受访页面浏览量（PV）**；浏览器拦截统计脚本的访问不会被百度记录。静态页面不保存授权信息，公开的 `popularity.json` 只包含各活动的数字汇总。

当前未取得授权，因此先显示“暂无浏览统计”。以下流程适用于普通百度账号；商业账号接口不同，需另行适配。

## 1. 开通数据导出

1. 登录[百度统计](https://tongji.baidu.com/)，确认站点列表里有 `spine.moyijiangnan.cn`。
2. 进入“管理 → 数据导出服务”，开通服务，获得 API Key 和 Secret Key。
3. 按[百度账号接口说明](https://tongji.baidu.com/api/manual/Chapter2/openapi.html)完成授权，获取 `ACCESS_TOKEN`。该令牌并不是网页中的统计脚本 ID `942f...`。
4. 按[获取站点列表说明](https://tongji.baidu.com/api/manual/Chapter1/getSiteList.html)查询该域名对应的数字 `site_id`。也可在仓库 `_source/` 目录运行 `python scripts/baidu-sites.py`，在隐藏输入提示中输入令牌；脚本只输出匹配域名的站点 ID。

不要把 API Key、Secret Key、授权码或令牌发到聊天、提交到仓库或粘贴到 issue。通过 HTTPS 完成授权，具体页面以百度当前界面为准。

## 2. 配置 GitHub Secrets

打开仓库的 [Actions Secrets 设置](https://github.com/Dongyifengs/mihoyo-web-spine-extractor/settings/secrets/actions)，点击 **New repository secret**，分别创建：

| 名称 | 值 |
| --- | --- |
| `BAIDU_TONGJI_ACCESS_TOKEN` | 第一步获得的 Access Token |
| `BAIDU_TONGJI_SITE_ID` | 对应域名的数字 site_id |

确认仓库 Actions 允许工作流读写仓库内容。仓库 Settings → Actions → General 的 Workflow permissions 如有限制，应允许所需的写入权限。

## 3. 运行和检查

进入仓库 **Actions → 更新百度统计排行 → Run workflow**，选择 `main` 并运行。工作流也会每小时尝试一次；数据没有变化时不会创建提交。成功后网站从 `popularity.json` 读取汇总并按浏览量排序，页面缓存可能使更新延迟数分钟。

工作流调用百度统计[受访页面报告](https://tongji.baidu.com/api/manual/Chapter1/visit_toppage_a.html)，默认统计从 2026-11-02 到当前北京时间日期。接口失败或格式不符时不会覆盖上次成功结果。成功时会同时更新根目录和 `_source/` 中的汇总文件；后续部署前应先同步这些文件，避免用旧数据覆盖最新排行。真实接口授权尚未在此仓库完成，首次运行时请检查工作流结果。

根据百度文档，Access Token 有有效期；过期后按官方流程刷新，并在 GitHub Secrets 中更新 `BAIDU_TONGJI_ACCESS_TOKEN`。不要把 Refresh Token 放到网站中。

## 浏览器提示 `ERR_BLOCKED_BY_CLIENT`

这表示当前浏览器侧阻止了百度脚本请求，常见原因是广告拦截扩展、浏览器防追踪或安全过滤。可在自己信任的网站设置中允许 `hm.baidu.com`，或使用未拦截该脚本的浏览器验证。刷新后在开发者工具 Network 中检查 `hm.js` 请求；HTTP 200 说明脚本加载成功，统计后台展示可能延迟。
