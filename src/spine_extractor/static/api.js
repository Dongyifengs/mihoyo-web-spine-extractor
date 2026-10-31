let bootstrap;
const clientVersion = '0.6.2';
async function compatibleBoot() {
  const response = await fetch('/api/bootstrap');
  if (!response.ok) throw new Error('无法连接本地工作台，请重新运行启动网页.bat');
  const data = await response.json();
  if (data.version === clientVersion) return data;
  const candidates = await Promise.all(Array.from({length: 11}, async (_, index) => {
    const origin = `http://127.0.0.1:${8765 + index}`;
    if (origin === location.origin) return null;
    try {
      const r = await fetch(origin + '/api/instance', {signal: AbortSignal.timeout(1200)});
      if (!r.ok) return null;
      const instance = await r.json();
      return instance.version === clientVersion && instance.output === data.settings?.output ? origin : null;
    } catch { return null; }
  }));
  const current = candidates.find(Boolean);
  if (current) { location.replace(current + '/' + location.hash); await new Promise(() => {}); }
  throw new Error(`当前端口仍运行 v${data.version}，网页已更新到 v${clientVersion}。请重新运行「启动网页.bat」并使用新打开的地址。封面文件无需重新生成。`);
}
export async function boot(refresh = false) {
  if (!bootstrap || refresh) bootstrap = compatibleBoot().catch(error => { bootstrap = null; throw error; });
  return bootstrap;
}
export async function api(path, payload) {
  const options = payload === undefined ? {} : {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Spine-Token': (await boot()).csrf}, body: JSON.stringify(payload)};
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '请求失败');
  return data;
}
export function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
let toastTimer;
export function toast(message) {
  let element = document.getElementById('toast');
  if (!element) { element = node('div'); element.id = 'toast'; document.body.append(element); }
  element.textContent = message; element.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => element.classList.remove('visible'), 5500);
}
export async function watchJob(id, update) {
  for (;;) {
    const job = await api('/api/jobs/' + id);
    update(job);
    if (job.status !== 'running') return job;
    await new Promise(resolve => setTimeout(resolve, 900));
  }
}
