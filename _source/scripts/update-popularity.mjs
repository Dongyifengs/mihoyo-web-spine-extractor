import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const siteHosts = new Set(['spine.moyijiangnan.cn', 'dongyifengs.github.io']);

function strings(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

export function countProjectViews(payload, projectIds) {
  const result = payload?.result;
  const dimensions = result?.items?.[0], metrics = result?.items?.[1];
  if (!Array.isArray(dimensions) || !Array.isArray(metrics) || dimensions.length !== metrics.length) {
    throw new Error('百度统计返回格式不符合预期，未更新排行');
  }
  const counts = Object.fromEntries(projectIds.map((id) => [id, 0]));
  const known = new Set(projectIds);
  let recognizedSitePage = false;
  for (let i = 0; i < dimensions.length; i++) {
    let id;
    for (const candidate of strings(dimensions[i])) {
      try {
        if (!candidate.startsWith('/') && !/^https?:\/\//i.test(candidate)) continue;
        const url = new URL(candidate, 'https://spine.moyijiangnan.cn/');
        if (!siteHosts.has(url.hostname)) continue;
        recognizedSitePage = true;
        const match = url.pathname.match(/\/projects\/([a-zA-Z0-9_-]+)(?:\/index\.html|\/)?$/);
        if (match && known.has(match[1])) { id = match[1]; break; }
      } catch { /* Ignore non-URL report fields. */ }
    }
    if (!id) continue;
    const value = Array.isArray(metrics[i]) ? metrics[i][0] : metrics[i];
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('浏览量无效，未更新排行');
    counts[id] += value;
    if (!Number.isSafeInteger(counts[id])) throw new Error('浏览量超出范围，未更新排行');
  }
  if (dimensions.length && !recognizedSitePage) throw new Error('无法识别百度统计报告中的页面地址，未更新排行');
  return counts;
}

async function update() {
  const token = process.env.BAIDU_TONGJI_ACCESS_TOKEN;
  const siteId = process.env.BAIDU_TONGJI_SITE_ID;
  const start = process.env.BAIDU_TONGJI_START_DATE || '20261102';
  if (!token || !siteId || !/^\d+$/.test(siteId) || !/^\d{8}$/.test(start)) throw new Error('缺少有效的百度统计授权、站点 ID 或开始日期');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).replaceAll('-', '');
  const catalog = JSON.parse(await readFile('catalog.json', 'utf8'));
  const endpoint = new URL('https://openapi.baidu.com/rest/2.0/tongji/report/getData');
  endpoint.search = new URLSearchParams({ access_token: token, site_id: siteId, method: 'visit/toppage/a', start_date: start, end_date: today, metrics: 'pv_count', max_results: '0' });
  let response;
  try { response = await fetch(endpoint, { signal: AbortSignal.timeout(25000), redirect: 'error' }); }
  catch { throw new Error('无法连接百度统计 API，未更新排行'); }
  if (!response.ok) throw new Error(`百度统计 API 返回 HTTP ${response.status}，未更新排行`);
  let payload;
  try { payload = await response.json(); } catch { throw new Error('百度统计返回的内容不是 JSON，未更新排行'); }
  const views = countProjectViews(payload, catalog.projects.map((project) => project.id));
  const previous = JSON.parse(await readFile('popularity.json', 'utf8'));
  const periodStart = `${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6, 8)}`;
  const periodEnd = `${today.slice(0, 4)}-${today.slice(4, 6)}-${today.slice(6, 8)}`;
  if (previous.updatedAt && previous.periodStart === periodStart && previous.periodEnd === periodEnd && JSON.stringify(previous.views) === JSON.stringify(views)) {
    console.log('百度统计数据没有变化'); return;
  }
  const data = { schemaVersion: 1, source: '百度统计', updatedAt: new Date().toISOString(), periodStart, periodEnd, views };
  await writeFile('popularity.json.tmp', JSON.stringify(data, null, 2) + '\n');
  await rename('popularity.json.tmp', 'popularity.json');
  console.log('已更新活动浏览量汇总');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await update(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
