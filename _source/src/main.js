import './styles.css';
import { node, toast } from './ui.js';
import { remoteUrl } from './resources.js';
import { summarizeResources, formatBytes, formatMeasured } from './project-info.js';
import { missingResources } from './filters.js';
import { watchSync } from './sync-view.js';
import { version as siteVersion } from '../package.json';

const root = new URL(document.documentElement.dataset.root, location.href);
const app = document.querySelector('#app');
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const url = (path) => new URL(path, root).href;
const projectUrl = (id) => url(`projects/${encodeURIComponent(id)}/index.html`);
let projects = [];
let favorites;
let gallery;
let catalog;
try { const stored = JSON.parse(localStorage.getItem('spine-favorites') || '[]'); favorites = new Set(Array.isArray(stored) ? stored : []); }
catch { favorites = new Set(); }

async function getJson(href) {
  const response = await fetch(href, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`索引加载失败（HTTP ${response.status}）`);
  return response.json();
}

function siteLinks() {
  return `<a href="${url('?view=sync')}">收录进度 →</a><a href="${url('SPINE-RUNTIMES-LICENSE.txt')}" target="_blank" rel="noopener">Spine 运行时许可 ↗</a>
    <a href="https://github.com/Dongyifengs/mihoyo-web-spine-extractor" target="_blank" rel="noopener noreferrer">Github 源码仓库 ↗</a>
    <a href="https://github.com/Dongyifengs/" target="_blank" rel="noopener noreferrer">作者 Github ↗</a>
    <a href="https://space.bilibili.com/454717281" target="_blank" rel="noopener noreferrer">作者 Bilibili ↗</a>
    <span>当前库的版本 ${escape(siteVersion)}</span><span>最后更新时间 ${escape(catalog.updatedAt || '未知')}</span>
    <a href="https://news.hk4e.com/" target="_blank" rel="noopener noreferrer">数据来源 ↗</a>
    <a href="https://spine.dayuweb.com/" target="_blank" rel="noopener noreferrer">Extra 技术支持 ↗</a>`;
}

function shell(title, content, active = 'library') {
  return `<aside class="sidebar">
    <a class="brand" href="${root.href}"><span>Spine 素材库</span><span class="badge demo-badge">Demo</span></a>
    <nav aria-label="主导航"><a href="${root.href}" class="${active === 'library' ? 'active' : ''}" ${active === 'library' ? 'aria-current="page"' : ''}>▦ <span>素材库</span><span class="nav-count">${projects.length}</span></a><a href="${url('?view=favorites')}" class="${active === 'favorites' ? 'active' : ''}" ${active === 'favorites' ? 'aria-current="page"' : ''}>♡ <span>我的收藏</span><span class="nav-count" id="favorite-count">${projects.filter((p) => favorites.has(p.id)).length}</span></a><a href="${url('?view=about')}" class="${active === 'about' ? 'active' : ''}" ${active === 'about' ? 'aria-current="page"' : ''}>ⓘ <span>收录说明</span></a></nav>
    <div class="nav-label recent-label">已收录活动</div><div class="recent-list" role="navigation" aria-label="已收录活动">${projects.map((p) => `<a href="${projectUrl(p.id)}" class="${document.documentElement.dataset.project === p.id ? 'active' : ''}" ${document.documentElement.dataset.project === p.id ? 'aria-current="page"' : ''} title="${escape(p.title)}"><span>${escape(p.title)}</span></a>`).join('')}</div>
    <div class="sidebar-foot">${siteLinks()}</div>
    </aside><div class="workspace"><header class="topbar"><h1>${escape(title)}</h1><a class="button subtle" href="${root.href}">查看素材库 <span>↗</span></a></header><main class="view" id="main" tabindex="-1">${content}</main><footer class="site-footer"><div class="mobile-sidebar-links">${siteLinks()}</div><span>手动整理的网页活动与在线资源 · 素材版权归原作者所有 · 非官方项目</span></footer></div>`;
}

function cover(project) {
  return `<img src="${escape(remoteUrl(project.cover.url))}" alt="${escape(project.cover.alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
}
function bindImages() {
  document.querySelectorAll('.activity-cover img, .project-info-cover img').forEach((img) => {
    img.onerror = () => { const fallback = node('div', 'cover-placeholder'); fallback.append(node('span', '', '▧'), node('span', '', '封面暂不可用')); img.replaceWith(fallback); };
  });
}
function toggleFavorite(id) {
  favorites.has(id) ? favorites.delete(id) : favorites.add(id);
  try { localStorage.setItem('spine-favorites', JSON.stringify([...favorites])); }
  catch { toast('浏览器未允许保存，收藏仅在本次浏览有效'); }
  document.querySelector('#favorite-count').textContent = projects.filter((p) => favorites.has(p.id)).length;
}

function projectInformation(project, items) {
  const stats = summarizeResources(items);
  const extra = project.captureStats || { count: 0, sizeBytes: 0 };
  const hasCoverSize = Number.isFinite(project.cover.sizeBytes);
  const total = {
    count: stats.total.count + extra.count + 1,
    bytes: stats.total.bytes + (extra.sizeBytes || 0) + (hasCoverSize ? project.cover.sizeBytes : 0),
    unknown: stats.total.unknown + (hasCoverSize ? 0 : 1),
  };
  const article = project.officialArticle;
  const published = article?.publishedAt && Number.isFinite(Date.parse(article.publishedAt))
    ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Shanghai' }).format(new Date(article.publishedAt)) + '（北京时间）' : '未知';
  const metric = (name, value) => `<div><dt>${name}</dt><dd>${escape(formatMeasured(value))}<small>${value.count} 个文件</small></dd></div>`;
  return `<div class="project-information-heading"><div><span class="badge">${escape(project.game)} · ${escape(project.kind)}</span><h2>${escape(project.title)}</h2><p>${escape(project.subtitle)}</p></div></div>
    <div class="project-info-layout"><div><h3>活动封面</h3><div class="project-info-cover">${cover(project)}</div><a href="${escape(remoteUrl(project.cover.url))}" target="_blank" rel="noopener noreferrer">查看原图 ↗</a></div>
    <div><h3>活动信息</h3><dl class="project-meta"><dt>标题</dt><dd>${escape(project.title)}</dd><dt>副标题</dt><dd>${escape(project.subtitle || '暂无')}</dd><dt>活动时间</dt><dd>${escape(project.activityPeriod || '暂未收录')}</dd><dt>参与条件</dt><dd>${escape(project.eligibility || '暂未收录')}</dd><dt>活动介绍</dt><dd>${escape(project.activitySummary || project.description || '暂无')}${project.activityHighlights?.length ? `<ul class="activity-highlights">${project.activityHighlights.map((line) => `<li>${escape(line)}</li>`).join('')}</ul>` : ''}</dd><dt>收录日期</dt><dd>${escape(project.indexedAt)}</dd><dt>原网页</dt><dd><a href="${escape(remoteUrl(project.sourceUrl))}" target="_blank" rel="noopener noreferrer">打开活动网页 ↗</a></dd><dt>官方文章</dt><dd>${article ? `<a href="${escape(remoteUrl(article.url))}" target="_blank" rel="noopener noreferrer">${escape(article.title)} ↗</a><small class="info-note">发布于 ${escape(published)}</small>` : '暂未收录'}</dd></dl></div></div>
    <section class="resource-summary"><h3>素材统计</h3><p class="field-note">${items.length} 组 Spine · 版本 ${escape(stats.versions.join('、') || '未知')} · 统计于 ${escape(project.sizeMeasuredOn || '未知')}</p><dl class="resource-metrics">
    ${metric('JSON 骨骼', stats.json)}${stats.skel.count ? metric('SKEL 骨骼', stats.skel) : ''}${metric('atlas 图集', stats.atlas)}${metric('PNG 贴图', stats.texture)}
    <div><dt>活动封面</dt><dd>${escape(formatBytes(project.cover.sizeBytes))}<small>1 个文件</small></dd></div><div><dt>场景截图</dt><dd>${escape(formatBytes(extra.sizeBytes))}<small>${extra.count} 个文件</small></dd></div><div class="total-metric"><dt>文件总大小</dt><dd>${escape(formatMeasured(total))}<small>${total.count} 个文件</small></dd></div></dl>
    <p class="field-note">同一资源去重。总计包含已索引的骨骼、atlas、PNG、封面和场景截图，不含网页代码及清单。内嵌 JSON 按解析后重新序列化估算，atlas 按解码文本计算；PNG 和封面为测量时的字节数，源站文件可能变化。</p></section>`;
}

function renderLibrary(onlyFavorites = false) {
  document.title = `${onlyFavorites ? '我的收藏' : '素材库'} · Spine 素材工作台`;
  app.innerHTML = shell(onlyFavorites ? '我的收藏' : '素材库', `<div class="section-heading"><p class="muted">${onlyFavorites ? '收藏的活动保存在当前浏览器。' : '浏览已手动解析的活动；骨骼、图集和贴图从官方在线来源读取。'}</p><div class="section-actions"><span class="badge">${projects.length} 个活动 · ${projects.reduce((n, p) => n + p.spineCount, 0)} 组素材</span><button id="refresh-library" class="button small">刷新</button></div></div>
    <div class="library-toolbar"><label class="sr-only" for="library-search">搜索活动名称、游戏或标签</label><input id="library-search" type="search" placeholder="搜索活动名称、游戏、标签" autocomplete="off"><label class="sr-only" for="library-game">游戏筛选</label><select id="library-game"><option value="all">全部游戏</option>${[...new Set(projects.map((p) => p.game))].map((game) => `<option>${escape(game)}</option>`).join('')}</select><label class="sr-only" for="library-sort">项目排序</label><select id="library-sort"><option value="new">活动日期：从新到旧</option><option value="old">活动日期：从旧到新</option><option value="name">活动名称</option></select><span class="muted library-results" role="status"></span></div><div id="library-grid" class="library-grid"></div>`, onlyFavorites ? 'favorites' : 'library');
  const update = () => {
    const query = document.querySelector('#library-search').value.trim().toLowerCase();
    const game = document.querySelector('#library-game').value;
    const sort = document.querySelector('#library-sort').value;
    const visible = projects.filter((p) => (!onlyFavorites || favorites.has(p.id)) && (game === 'all' || p.game === game)
      && `${p.title} ${p.game} ${p.tags.join(' ')}`.toLowerCase().includes(query))
      .sort((a, b) => sort === 'name' ? a.title.localeCompare(b.title, 'zh-CN') : (sort === 'new' ? -1 : 1) * a.eventDate.localeCompare(b.eventDate));
    document.querySelector('.library-results').textContent = `${visible.length} 个活动`;
    document.querySelector('#library-grid').innerHTML = visible.length ? visible.map((p) => `<article class="activity-tile"><a class="activity-cover" href="${projectUrl(p.id)}" tabindex="-1" aria-hidden="true">${cover(p)}</a><a class="activity-info" href="${projectUrl(p.id)}"><h2>${escape(p.title)}</h2><p class="activity-description">${escape(p.subtitle)}</p><div class="tile-stat"><span><strong>${p.spineCount}</strong>组素材</span><span><strong>${p.textureCount}</strong>张贴图</span><span>${escape(p.game)}</span></div><span class="muted">活动日期 ${p.eventDate}</span></a><div class="tile-footer"><span>${escape(p.kind)}</span><button data-favorite="${escape(p.id)}" aria-label="${favorites.has(p.id) ? '取消收藏' : '收藏'}${escape(p.title)}" aria-pressed="${favorites.has(p.id)}">${favorites.has(p.id) ? '♥ 已收藏' : '♡ 收藏'}</button></div></article>`).join('')
      : `<div class="empty-state"><h2>${onlyFavorites && !favorites.size ? '还没有收藏活动' : '没有匹配的活动'}</h2><p>${onlyFavorites && !favorites.size ? '在素材库点击收藏，将活动添加到这里。' : '尝试其他关键词，或清空筛选条件。'}</p><a class="button" href="${root.href}">查看全部活动</a></div>`;
    document.querySelectorAll('[data-favorite]').forEach((button) => button.onclick = () => {
      const id = button.dataset.favorite;
      toggleFavorite(id);
      update();
      const replacement = [...document.querySelectorAll('[data-favorite]')].find((item) => item.dataset.favorite === id);
      (replacement || document.querySelector('#library-search')).focus();
    });
    bindImages();
  };
  document.querySelector('#library-search').oninput = update;
  document.querySelector('#library-game').onchange = update;
  document.querySelector('#library-sort').onchange = update;
  document.querySelector('#refresh-library').onclick = () => location.reload();
  update();
}

async function renderProject(project) {
  document.title = `${project.title} · Spine 素材工作台`;
  const indexUrl = new URL(project.spineIndex, project.manifestUrl).href;
  const index = await getJson(indexUrl);
  app.innerHTML = shell(project.title, `<div class="project-navigation"><a href="${root.href}">← 返回素材库</a><div class="project-tabs" aria-label="项目内容"><button data-tab="spine" class="active" aria-pressed="true">Spine 资源</button><button data-tab="composition" aria-pressed="false">测试合并</button><button data-tab="manifest" aria-pressed="false">项目信息</button></div></div><section id="activity-gallery" aria-label="活动动画素材"><p class="muted" role="status">正在加载播放器…</p></section><section id="composition-view" hidden aria-label="测试合并"></section><section id="project-information" class="panel" hidden>${projectInformation(project, index.items)}</section>`, '');
  bindImages();
  const { Gallery } = await import('./gallery.js');
  const groups = index.items.map((item) => ({
    ...item,
    status: item.status === 'partial' || missingResources(item).length ? 'partial' : 'complete',
    has_extra: item.hasExtra,
    premultiplied_alpha: item.premultipliedAlpha,
    initial_skin: item.initialSkin || item.skins?.find((skin) => skin !== 'default') || item.skins?.[0],
    sourceItem: item,
    sourceItems: index.items,
  }));
  gallery = new Gallery(document.querySelector('#activity-gallery'), { ...project, groups, complete_count: groups.length });
  let composition;
  let navigation = 0;
  document.querySelectorAll('[data-tab]').forEach((button) => button.onclick = async () => {
    const current = ++navigation;
    const spine = button.dataset.tab === 'spine';
    const combined = button.dataset.tab === 'composition';
    document.querySelector('#activity-gallery').hidden = !spine;
    document.querySelector('#project-information').hidden = button.dataset.tab !== 'manifest';
    const host = document.querySelector('#composition-view');
    host.hidden = !combined;
    composition?.destroy(); composition = null;
    gallery.hub.setSuspended(!spine || document.hidden);
    gallery.informationVisible = !spine;
    document.querySelectorAll('[data-tab]').forEach((tab) => { tab.classList.toggle('active', tab === button); tab.setAttribute('aria-pressed', tab === button); });
    if (combined) {
      host.innerHTML = '<p class="muted" role="status">正在读取场景布局…</p>';
      try {
        const [{ Composition }, data] = await Promise.all([
          import('./composition.js'),
          project.composition ? getJson(new URL(project.composition, project.manifestUrl).href) : Promise.resolve({ scenes: [] }),
        ]);
        if (current !== navigation) return;
        for (const scene of data.scenes) {
          if (scene.reference_url) scene.reference_url = new URL(scene.reference_url, project.manifestUrl).href;
          for (const layer of scene.layers) {
            if (layer.kind === 'image') layer.image_url = new URL(layer.image_url, project.manifestUrl).href;
            else layer.group = groups.findIndex((group) => group.id === layer.spine_id);
          }
        }
        composition = new Composition(host, { ...project, groups }, data);
      } catch (error) {
        if (current === navigation) host.innerHTML = `<div class="empty-state">场景布局读取失败：${escape(error.message)}</div>`;
      }
    }
  });
  window.addEventListener('pagehide', () => { navigation++; composition?.destroy(); gallery.destroy(); }, { once: true });
  window.addEventListener('pageshow', (event) => { if (event.persisted) location.reload(); });
}

function renderAbout() {
  document.title = '收录说明 · Spine 素材工作台';
  app.innerHTML = shell('收录说明', `<section class="panel about-panel"><h2>静态版 Spine 素材库</h2><p>延续 main-o 的工作台布局，浏览已手动解析的网页活动。网站无需后端，可以部署在 GitHub Pages。</p><h3>每个活动都有什么？</h3><p>查看活动封面、项目介绍和原网页，浏览动画、动作与皮肤，也可复制资源来源。</p><h3>资源如何加载？</h3><p>JSON / SKEL、atlas 和 PNG 均使用官方 HTTPS 来源。部分资源被打包在官方 JavaScript 中，索引记录脚本 URL 与定位键；浏览器只解析数据，不执行官方活动脚本。仓库不保存活动骨骼、图集、贴图或 base64 内容。</p><h3>Demo 包含哪些功能？</h3><p>素材库搜索、筛选、收藏；动画卡片全部预览、动作与皮肤切换、播放暂停、循环；详情拖拽缩放、全屏、背景、骨骼调试、extra 飘动和帧率调试。单动作直接显示名称，2–4 个动作使用按钮，更多动作用下拉框。</p><p>当前三个样例均为 Spine 4.2，其他版本可记录链接，但此 demo 暂不播放。未移植自动提取、拆图和 Spine 工程导出。测试合并使用已收录的原网页动画图层布局。</p><h3>资源失效怎么办？</h3><p>源站更改 URL 或限制跨域访问时，预览会显示失败信息。可打开右侧官方链接核对，再手动更新索引。静态网站不提供绕过跨域限制的代理。</p><h3>许可与来源</h3><p>素材版权归原作者所有，本项目为非官方浏览工具。Spine 运行时与 extra 参考代码保留各自许可和版权说明。<a href="${url('SPINE-RUNTIMES-LICENSE.txt')}" target="_blank" rel="noopener">运行时许可 ↗</a> · <a href="${url('DAYU-NOTICE.txt')}" target="_blank" rel="noopener">extra 来源说明 ↗</a></p></section>`, 'about');
}

async function start() {
try {
  catalog = await getJson(url('catalog.json'));
  projects = await Promise.all(catalog.projects.map(async (ref) => {
    const manifestUrl = url(ref.manifest);
    return { ...await getJson(manifestUrl), manifestUrl };
  }));
  const id = document.documentElement.dataset.project;
  if (id) {
    const project = projects.find((p) => p.id === id);
    if (!project) throw new Error('项目未收录，请返回素材库');
    await renderProject(project);
  } else {
    const view = new URLSearchParams(location.search).get('view');
    if (view === 'sync') {
      document.title = '收录进度 · Spine 素材工作台';
      app.innerHTML = shell('收录进度', '<section class="panel" id="sync-progress">正在读取同步记录…</section>', '');
      watchSync(document.querySelector('#sync-progress'), url('sync-status.json'));
    } else if (view === 'about') renderAbout(); else renderLibrary(view === 'favorites');
  }
} catch (error) {
  app.innerHTML = `<main class="startup-error panel"><h1>素材库暂时无法打开</h1><p>${escape(error.message)}</p><button class="button primary" id="retry-app">重新加载</button> <a href="${root.href}">返回首页</a></main>`;
  document.querySelector('#retry-app').onclick = () => location.reload();
}
}
start();
