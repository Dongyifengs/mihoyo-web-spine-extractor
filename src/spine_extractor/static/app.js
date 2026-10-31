import {api, boot, node, toast, watchJob} from './api.js';
import {Gallery} from './gallery.js';

const $ = id => document.getElementById(id);
let bootstrap, activities = [], gallery, activeJob, polling, routeGeneration = 0;

function applySettings(settings) {
  $('output-label').textContent = settings.output; $('output-label').title = settings.output;
  $('settings-output').value = settings.output; $('settings-spine').value = settings.spine_cli || '';
  $('settings-spine-version').value = settings.spine_version || ''; $('settings-spine-timeout').value = settings.spine_timeout;
  $('settings-proxy').value = settings.proxy || ''; $('mode').value = settings.mode; $('wait').value = settings.wait; $('feed-limit').value = settings.feed_limit;
  $('headed').checked = settings.headed; $('unpack').checked = settings.unpack;
  $('convert').checked = !!settings.spine_cli;
  $('convert-hint').textContent = settings.spine_cli ? '已配置 Spine CLI · 将拆分图片并生成工程' : '可在设置中配置正版 Spine CLI';
  $('detect-spine').disabled = !bootstrap.detected_spine;
}

async function loadLibrary() {
  activities = await api('/api/activities');
  $('library-count').textContent = activities.length;
  $('recent-activities').replaceChildren();
  for (const activity of activities.slice(0, 20)) {
    const link = node('a', '', activity.title); link.href = '#activity/' + activity.id; link.title = activity.title; link.dataset.activity = activity.id; $('recent-activities').append(link);
  }
  const grid = $('library-grid'); grid.replaceChildren();
  if (!activities.length) {
    const empty = node('div', 'empty-state'); empty.append(node('h3', '', '素材库还是空的'), node('p', '', '先提取一个活动，动画会出现在这里。'));
    const start = node('a', 'button primary', '开始提取 →'); start.href = '#extract'; empty.append(start); grid.append(empty);
  }
  for (const activity of activities) {
    const tile = node('a', 'activity-tile'); tile.href = '#activity/' + activity.id;
    tile.append(node('div', 'tile-icon', '▧'), node('h3', '', activity.title));
    const stats = node('div', 'tile-stat');
    for (const [number, label] of [[activity.group_count, '组动画素材'], [activity.complete_count, '组配套完整'], [activity.project_count, '个工程']]) {
      const stat = node('span'); stat.append(node('strong', '', number), document.createTextNode(label)); stats.append(stat);
    }
    const foot = node('div', 'tile-footer'); foot.append(node('span', '', activity.created_at ? new Date(activity.created_at).toLocaleDateString('zh-CN') : ''), node('span', '', '查看全部 →'));
    tile.append(stats, foot); grid.append(tile);
  }
}

async function route() {
  const generation = ++routeGeneration;
  const [section = 'extract', id] = location.hash.slice(1).split('/');
  const view = ['extract', 'library', 'settings', 'activity'].includes(section) ? section : 'extract';
  for (const element of document.querySelectorAll('.view')) element.hidden = element.id !== 'view-' + view;
  for (const link of document.querySelectorAll('[data-nav]')) link.classList.toggle('active', link.dataset.nav === (view === 'activity' ? 'library' : view));
  for (const link of document.querySelectorAll('[data-activity]')) link.classList.toggle('active', link.dataset.activity === id);
  $('page-title').textContent = {extract: '提取素材', library: '素材库', settings: '设置', activity: '活动素材'}[view];
  if (gallery) { gallery.destroy(); gallery = null; }
  if (view === 'library') await loadLibrary();
  if (view === 'activity' && id) {
    $('activity-gallery').replaceChildren(node('p', 'muted', '正在读取素材…'));
    try {
      const activity = await api('/api/activities/' + id);
      if (generation === routeGeneration) gallery = new Gallery($('activity-gallery'), activity);
    } catch (error) { toast(error.message); }
  }
}

function summarize(job) {
  if (job.status === 'running') return job.logs.at(-1) || '正在准备任务…';
  if (job.status === 'failed') return '任务失败：' + job.error;
  if (job.status === 'cancelled') return '任务已停止，已经完成的文件保留。';
  const result = job.result;
  if ('converted' in result) return `工程转换结束：${result.converted} 个成功，${result.failed} 个失败。`;
  const complete = result.activities.reduce((n, a) => n + a.complete, 0);
  const partial = result.activities.reduce((n, a) => n + a.partial, 0);
  const conversionFailures = result.activities.reduce((n, a) => n + (a.conversion_failed || 0), 0);
  const empty = result.activities.filter(a => !a.skeletons).length;
  return `处理结束：${result.activities.length} 个活动 · ${complete} 组齐全 · ${partial} 组待补齐 · ${empty} 个无骨骼活动 · ${result.errors.length} 个失败入口` + (conversionFailures ? ` · ${conversionFailures} 个工程转换失败` : '');
}

async function trackJob(job) {
  if (polling === job.id) return;
  polling = job.id; activeJob = job.id;
  $('job-panel').hidden = false; $('job-results').replaceChildren(); $('start-task').disabled = true;
  try {
    const final = await watchJob(job.id, update => {
      const running = update.status === 'running';
      $('job-title').textContent = update.label + (running ? ' · 运行中' : ' · 已结束');
      $('job-summary').textContent = summarize(update); $('cancel-task').hidden = !running;
      $('job-panel').classList.toggle('finished', !running);
      const atEnd = $('job-log').scrollTop + $('job-log').clientHeight >= $('job-log').scrollHeight - 35;
      $('job-log').textContent = update.logs.slice(-450).join('\n'); if (atEnd) $('job-log').scrollTop = $('job-log').scrollHeight;
      $('job-dock').hidden = !running; $('dock-title').textContent = update.label;
    });
    await loadLibrary();
    for (const activity of final.result?.activities || []) {
      const entry = activities.find(item => activity.folder.endsWith(item.folder_name));
      const row = node('div', 'job-result');
      const link = node('a', '', entry?.title || activity.url); link.href = entry ? '#activity/' + entry.id : '#library';
      row.append(link, node('span', 'muted', `${activity.complete} 组完整 · 查看动画 →`)); $('job-results').append(row);
    }
    for (const error of final.result?.errors || []) $('job-results').append(node('p', 'detail-warning', error.error));
    if (final.status === 'completed') toast(summarize(final));
  } catch (error) { toast('读取任务状态失败：' + error.message); }
  finally { $('start-task').disabled = false; polling = null; $('job-dock').hidden = true; }
}

$('extract-form').addEventListener('submit', async event => {
  event.preventDefault();
  if ($('convert').checked && !bootstrap.settings.spine_cli) { toast('请先在设置中配置正版 Spine CLI，或取消生成工程'); location.hash = '#settings'; return; }
  try {
    const job = await api('/api/jobs', {urls: $('urls').value, convert: $('convert').checked,
      options: {title: $('task-title').value, mode: $('mode').value, wait: Number($('wait').value), feed_limit: Number($('feed-limit').value), headed: $('headed').checked, unpack: $('unpack').checked}});
    trackJob(job);
  } catch (error) { toast(error.message); }
});
$('settings-form').addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const settings = await api('/api/settings', {output: $('settings-output').value, spine_cli: $('settings-spine').value,
      spine_version: $('settings-spine-version').value, spine_timeout: Number($('settings-spine-timeout').value), proxy: $('settings-proxy').value});
    bootstrap.settings = settings; applySettings(settings); await loadLibrary(); $('settings-saved').textContent = '设置已保存'; toast('设置已保存');
  } catch (error) { toast(error.message); }
});
$('detect-spine').onclick = () => { $('settings-spine').value = bootstrap.detected_spine || ''; toast('已填入检测到的路径，点击保存设置后生效'); };
$('cancel-task').onclick = async () => { try { await api('/api/jobs/' + activeJob + '/cancel', {}); $('cancel-task').disabled = true; setTimeout(() => $('cancel-task').disabled = false, 1500); } catch (error) { toast(error.message); } };
$('refresh-library').onclick = () => loadLibrary().then(() => toast('素材库已刷新'));
window.addEventListener('hashchange', route);
window.addEventListener('spine-job', event => trackJob(event.detail));
window.addEventListener('spine-library-updated', () => loadLibrary());

try {
  bootstrap = await boot(); $('app-version').textContent = 'v' + bootstrap.version; applySettings(bootstrap.settings);
  await loadLibrary(); await route();
  if (bootstrap.active_job) { const job = await api('/api/jobs/' + bootstrap.active_job); if (job.status === 'running') trackJob(job); }
} catch (error) { toast('工作台启动失败：' + error.message); }
