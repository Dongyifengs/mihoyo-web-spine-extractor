# 网页活动自动收录

新闻源：`GET https://news-api.amarea.cn/news/genshin.web_cn`，严格筛选 `网页活动` 标签。默认扫描所有符合条件的新闻，不设置条数上限。

## 本地运行

```powershell
python -m pip install -r scripts/importer/requirements.txt
python scripts/sync-news.py
npm run dev
```

## 通用批处理与定向诊断

```powershell
python scripts/sync-news.py                        # 全量检查，已完成且无变化的活动跳过解析
python scripts/sync-news.py --diagnose             # 离线汇总问题，不请求接口
python scripts/sync-news.py --retry-failed         # 只重试失败任务，复用队列和已取得的文章
python scripts/sync-news.py --retry-failed --category texture  # 只处理贴图问题
python scripts/sync-news.py --force                # 重新读取正文并解析，覆盖校验通过的项目
```

类别：`network` 网络、`entry` 入口、`atlas` 图集、`texture` 贴图、`version` 版本、`scan` 扫描、`metadata` 信息、`unknown` 其他。`sync-failures.json` 保存文章、活动链接、完整问题列表、扫描数量和失败请求，供集中分析；无需逐个手工请求。`--verbose` 才输出逐文件日志。

首次成功取得列表后，将完整队列写入 `sync-state.json`。失败重试优先读取文章缓存，素材仍从官方地址在线验证。同一轮重复活动链接只扫描一次；只有整组资源通过校验才加入项目索引。

打开 `http://127.0.0.1:5173/?view=sync` 查看进度。每篇文章都有“打开官方文章”链接；“无变化”“无活动链接”“未收录”不计入异常，“只看异常”可集中查看真正失败的任务。`--limit 4` 用于小批验证。`sync-state.json` 保存成功指纹和失败原因；失败任务可重试，不写入不完整的项目。

展开“重新获取”，勾选“强制重新获取并覆盖”后复制命令，在项目目录执行。静态页面本身不启动 Python。`--force` 绕过正文缓存和无变化判断，重新检查包括无链接、未收录在内的条目；失败时保留已有项目。

每次核对列表与文章正文指纹，正文单独更新也会触发重新解析。列表接口失败时复用保存的队列；旧版本没有队列时从进度报告恢复已知文章。连续三篇文章的聚合接口和官网正文均读取失败才停止本轮，保留已收录数据，并让 CI 报错。`.cache/` 只缓存已取得的新闻数据用于排查，不参与发布。

验证命令：`npm test`、`python -m unittest discover -s tests -p 'test_*.py'`、`npm run build`。`node scripts/verify-resources.mjs` 会真正请求全部已收录骨骼与图集，逐个检查运行时、皮肤和动画；可在命令后指定项目 ID。它不代替浏览器中的贴图跨域、WebGL 和响应式测试。

## 解析规则

- 从详情接口取得正文；请求失败、正文为空或显示“新闻加载失败”时，按 ID 打开 `https://ys.mihoyo.com/main/news/detail/<id>`。若该页只有动态外壳，再读取其使用的官方公开正文接口。不会直接把新闻文章当成活动扫描。
- 只处理正文真实的 `a[href]`；多个链接时优先选官方 `/event/` 活动地址，没有时再使用其他官方活动地址或短链接。无活动链接为普通结果，并保留原文供人工核对。
- 复用 `main-o` 的静态扫描器，递归扫描脚本、分包和资源清单；不执行活动脚本，不登录账号。
- 按骨骼附件与图集区域、官方模块注册关系、图片尺寸匹配素材；歧义结果进入待适配列表。
- 内嵌资源记录官方脚本 URL、UTF-8 字节位置和脚本 SHA-256；前端安全解析字面量。脚本内容变化时停止使用旧定位，避免错读资源。
- 仓库只保存索引，不保存下载的 JSON、SKEL、atlas、贴图或 base64 数据。第三方运行时保留其许可。

## 定时与发布

工作流 `.github/workflows/sync-news.yml` 按北京时间 12:30、13:00、14:30、18:00、00:00 检查。GitHub 的调度可能排队延迟。

启用前应在仓库 Settings → Pages 将构建来源设为 GitHub Actions，并在默认分支部署此工作流；本地文件存在并不代表定时任务已经启用。

手动运行 Actions 时可勾选 `force` 强制重新获取并覆盖；定时任务默认增量检查。

没有新增、变化或待重试任务时跳过解析和构建。产生已验证的新索引后，运行测试、目录校验和生产构建，复制整个构建目录，并提交中文日志；通过 Pages artifact 部署后校验线上文件内容。不会仅上传入口 JS。

远端布局为根目录发布文件、`_source/` 源码。工作流按此布局运行，保留 `CNAME`。扫描报告同时保存为 Actions artifact，便于定位未适配条目。
