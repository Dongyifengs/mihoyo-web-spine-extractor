import { node } from './ui.js';
import { syncStatus, isSyncError, syncCommand, officialArticleUrl } from './sync-model.js';
const labels = { queued: '等待处理', checking: '读取文章', parsing: '解析活动', complete: '已收录', unchanged: '无变化', 'no-link': '无活动链接', empty: '未收录', unavailable: '读取失败', 'needs-adapter': '待适配' };
export function watchSync(host, href) {
  let stopped = false;
  let timer, lastReport, renderedReport;
  const controls = node('details', 'sync-controls');
  controls.append(node('summary', '', '重新获取'));
  const label = node('label', 'sync-option'), force = node('input'); force.type = 'checkbox';
  label.append(force, document.createTextNode('强制重新获取并覆盖'));
  const command = node('code', 'sync-command', syncCommand(false));
  const copy = node('button', 'button small', '复制运行命令'); copy.type = 'button';
  const feedback = node('span', 'field-note'); feedback.setAttribute('role', 'status');
  force.onchange = () => { command.textContent = syncCommand(force.checked); feedback.textContent = ''; };
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(syncCommand(force.checked)); feedback.textContent = '已复制，在项目目录运行即可。'; }
    catch { feedback.textContent = '复制失败，请手动复制上方命令。'; }
  };
  controls.append(label, node('p', 'field-note', '在本机运行后，本页会自动更新进度。强制模式会重新检查无变化和未收录条目，仅覆盖校验通过的项目。'), command, copy, feedback);
  const filter = node('label', 'sync-option'), errorsOnly = node('input'); errorsOnly.type = 'checkbox';
  filter.append(errorsOnly, document.createTextNode('只看异常'));
  const panel = node('section');
  host.replaceChildren(controls, filter, panel);
  errorsOnly.onchange = () => { if (lastReport) render(lastReport); };
  panel.addEventListener('focusout', () => requestAnimationFrame(() => {
    if (!stopped && lastReport && lastReport !== renderedReport && !panel.contains(document.activeElement)) render(lastReport);
  }));
  function render(report) {
    renderedReport = report;
    const items = report.items || [];
    const heading = node('div', 'section-heading');
    heading.append(node('h2', '', report.running ? '正在同步网页活动' : '最近一次同步'), node('span', 'badge', `${report.done} / ${report.total} · ${items.filter(isSyncError).length} 项异常`));
    const note = node('p', 'field-note', report.notice || '无变化、无活动链接和未收录为普通状态，可打开官方文章核对。');
    if (report.error) { note.textContent = `本次同步中断：${report.error} 已收录活动仍可查看。`; note.setAttribute('role', 'alert'); }
    const list = node('div', 'sync-list');
    const visible = items.filter(item => !errorsOnly.checked || isSyncError(item));
    const order = item => ['checking', 'parsing'].includes(item.status) ? 0 : item.status === 'queued' ? 2 : 1;
    for (const item of [...visible].reverse().sort((a, b) => order(a) - order(b))) {
      const row = node('article', 'sync-row'); row.dataset.status = syncStatus(item);
      const header = node('div', 'sync-row-head');
      header.append(node('strong', '', item.title), node('span', 'badge', labels[syncStatus(item)] || item.status));
      row.append(header);
      if (item.message) row.append(node('p', 'field-note', item.message));
      const actions = node('div', 'sync-row-links'), article = officialArticleUrl(item);
      if (article) {
        const link = node('a', '', '打开官方文章 ↗'); link.href = article; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.setAttribute('aria-label', `打开官方文章：${item.title}（新标签页）`); actions.append(link);
      }
      for (const id of item.projectIds || []) {
        const link = node('a', '', '查看已收录活动 →'); link.href = new URL(`projects/${encodeURIComponent(id)}/index.html`, href).href; actions.append(link);
      }
      if (item.sourceType === 'official-page') actions.append(node('span', 'field-note', '正文来自官网'));
      row.append(actions); list.append(row);
    }
    panel.replaceChildren(heading, note, list);
    if (!visible.length) panel.append(node('p', 'muted', errorsOnly.checked ? '暂无异常。' : report.running ? '正在读取新闻列表…' : '本次没有待处理任务。'));
  }
  async function update() {
    try {
      const response = await fetch(href, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('尚无同步记录');
      const report = await response.json();
      if (!stopped) {
        if (JSON.stringify(lastReport) !== JSON.stringify(report)) lastReport = report;
        if (lastReport !== renderedReport && !panel.contains(document.activeElement)) render(lastReport);
      }
    } catch (error) {
      if (!stopped) { renderedReport = null; panel.textContent = `同步进度暂不可用：${error.message}，稍后自动重试。`; }
    } finally {
      if (!stopped) timer = setTimeout(update, 5000);
    }
  }
  window.addEventListener('pagehide', () => { stopped = true; clearTimeout(timer); }, { once: true });
  update();
}
