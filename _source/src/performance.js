import {node} from './ui.js';

/** Timings of completed render batches, not an unrelated requestAnimationFrame loop. */
export class FrameStats {
  constructor() { this.reset(); }
  reset() { this.samples = []; this.frames = 0; }
  record(time, renderMs, count) {
    this.frames++; this.count = count;
    this.samples.push({time, renderMs});
    while (this.samples.length > 2 && (time - this.samples[0].time > 2000 || this.samples.length > 240)) this.samples.shift();
  }
  read() {
    const samples = this.samples, intervals = samples.slice(1).map((s, i) => s.time - samples[i].time);
    if (!intervals.length) return null;
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const sorted = intervals.slice().sort((a, b) => a - b);
    return {fps: 1000 / mean, p95: sorted[Math.floor(sorted.length * .95)],
      jitter: Math.sqrt(intervals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / intervals.length),
      renderMs: samples.reduce((sum, s) => sum + s.renderMs, 0) / samples.length, count: this.count};
  }
}

export class FrameMonitor {
  constructor(hub, host, {floating = false} = {}) {
    this.hub = hub; this.history = [];
    this.root = node('div', 'fps-monitor' + (floating ? ' fps-floating' : '')); this.root.setAttribute('aria-label', '帧率调试浮窗');
    const head = node('div', 'fps-head', '帧率调试'); head.title = '拖动浮窗';
    const close = node('button', '', '×'); close.type = 'button'; close.setAttribute('aria-label', '隐藏帧率调试'); close.onclick = () => this.setVisible(false); head.append(close);
    this.value = node('strong', 'fps-value', '—'); this.value.setAttribute('aria-label', '当前帧率');
    const number = node('div', 'fps-number'); number.append(this.value, node('span', '', 'FPS')); this.count = node('span'); number.append(this.count);
    this.graph = node('canvas'); this.graph.width = 352; this.graph.height = 68; this.graph.setAttribute('aria-label', '实时帧率波动曲线');
    this.metrics = node('div', 'fps-metrics', '等待动画渲染…');
    this.root.append(head, number, this.graph, this.metrics); host.append(this.root);
    this.button = node('button', '', '帧率调试'); this.button.type = 'button'; this.button.onclick = () => this.setVisible(this.root.hidden);
    this.setVisible(true);
    this.sample = time => { if (!this.root.hidden && (!this.last || time - this.last >= 250)) { this.last = time; this.update(); } };
    hub.frameListeners.add(this.sample);
    let pointer;
    head.onpointerdown = e => {
      if (e.button !== 0 || e.target.closest('button')) return;
      const box = this.root.getBoundingClientRect(), parent = floating ? {left: 0, top: 0} : host.getBoundingClientRect();
      pointer = {x: e.clientX, y: e.clientY, left: box.left - parent.left, top: box.top - parent.top}; head.setPointerCapture(e.pointerId);
    };
    head.onpointermove = e => {
      if (!pointer) return;
      const width = floating ? innerWidth : host.clientWidth, height = floating ? innerHeight : host.clientHeight;
      this.root.style.left = Math.max(0, Math.min(width - this.root.offsetWidth, pointer.left + e.clientX - pointer.x)) + 'px';
      this.root.style.top = Math.max(0, Math.min(height - this.root.offsetHeight, pointer.top + e.clientY - pointer.y)) + 'px';
      this.root.style.right = this.root.style.bottom = 'auto';
    };
    head.onpointerup = head.onpointercancel = () => { pointer = null; };
  }
  setVisible(value) { this.root.hidden = !value; this.button.setAttribute('aria-pressed', String(value)); this.last = 0; }
  update() {
    const stats = this.hub.stats.read(); if (!stats) return;
    this.value.textContent = stats.fps.toFixed(1); this.count.textContent = `${stats.count} 个预览`;
    this.metrics.textContent = `绘制 ${stats.renderMs.toFixed(1)} ms · P95 ${stats.p95.toFixed(1)} ms\n帧间隔波动 ±${stats.jitter.toFixed(1)} ms`;
    this.history.push(stats.fps); if (this.history.length > 64) this.history.shift();
    const ctx = this.graph.getContext('2d'), {width, height} = this.graph, maximum = Math.max(60, ...this.history);
    ctx.clearRect(0, 0, width, height); ctx.strokeStyle = '#d5dce2'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.stroke();
    ctx.strokeStyle = '#397da7'; ctx.lineWidth = 2; ctx.beginPath();
    this.history.forEach((fps, i) => { const x = i * width / 63, y = height - 3 - fps / maximum * (height - 6); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke();
  }
  destroy() { this.hub.frameListeners.delete(this.sample); this.root.remove(); this.button.remove(); }
}
