# 验证记录

验证日期：2026-10-31（会话日期）。环境：Windows、Python 3.12、Edge/Chromium。网站内容会变化，以下是本次实际获取的结果，不作为未来资源数量承诺。

## 真实活动页

| 页面 | 骨骼 | 图集 | 配套完整组 | 拆分区域图片 |
| --- | ---: | ---: | ---: | ---: |
| [2026 魔女尼可的茶会](https://act.mihoyo.com/ys/event/e20260520invite-19ccy4/index.html) | 30 | 30 | 30 | 401 |
| [2023 罪人舞步旋](https://act.mihoyo.com/ys/event/e20231028preview/index.html) | 17 | 17 | 17 | 875 |
| [2026 周年拾光册](https://act.mihoyo.com/ys/event/e20260928-review-kkmxf9/index.html) | 264 | 264 | 264 | 本次跳过 |
| [2026 至冬漫游手册](https://act.mihoyo.com/ys/event/e20260812winter-1npovj/index.html) | 14 | 14 | 14 | 本次跳过 |
| [2026 至冬将至](https://act.mihoyo.com/ys/event/e20260731reserve-y2xckt/index.html) | 32 | 32 | 32 | 本次跳过 |

以上 5 页合计 **357 组**。静态扫描即可配套全部已识别骨骼，部分普通运行库字符串探测产生 404，记录在清单中。两个执行拆图的页面均没有区域拆分警告。

周年活动首次扫描触及原先 500 请求的限制；默认值已调整为每活动 1500 请求，并重新完整验证 264/264。图集配对预先建立索引，避免在每个骨骼匹配时反复解析所有 atlas。

## 入口与浏览器

- 用户提供的 RSS 识别到 40 个不同活动入口，按原顺序选取前 3 项进行批量实测。
- [新闻页 164277](https://ys.mihoyo.com/main/news/detail/164277) 经浏览器展开，正确选择正文「点击参与活动」中的茶会地址；优先正文参与入口，排除导航中的其他活动。
- 茶会页的真实浏览器网络捕获成功，静态与网络发现合并去重后仍为 30 组完整资源。
- 本地模拟页通过 iframe 在 300 ms 后发出 fetch，浏览器集成测试捕获到了 JSON、atlas 和 PNG。

## 自动化验证

本机最终运行结果：**32 项测试全部通过**（含浏览器集成测试），Ruff 检查通过。

独立 Windows EXE 已实际启动，通过窗口粘贴茶会地址、选择输出目录并点击提取；静态扫描、浏览器捕获和区域拆分完整结束，窗口显示 30 组完整、0 组待补齐、0 个失败入口。

测试覆盖现代对象字面量、旧 JSON.parse、Unicode/JS 转义、静态模板字符串、webpack chunk 映射、二进制版本头、data URI、多页新旧 atlas、RSS/Atom/JSON Feed、新闻入口筛选、同名附件的尺寸配对、歧义保留、错误贴图、旋转与偏移、路径遍历拦截、重定向/HTML base、重复运行、缺图、大小限制、404 不重试和取消。

运行方式：

```powershell
$env:SPINE_BROWSER_TEST = "1"
python -m pytest -q
python -m ruff check .
```

未验证的项目：所有活动的每个交互分支、需登录才可见的资源、专有加密格式、全部动画的 Spine 运行时播放效果、所有版本编辑器的工程导入效果。Windows 以外平台的自动化检查由仓库 CI 配置覆盖，未在本机实际执行。
