let bootstrap;
export async function boot(refresh = false) {
  if (!bootstrap || refresh) bootstrap = fetch('/api/bootstrap').then(r => r.json());
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
