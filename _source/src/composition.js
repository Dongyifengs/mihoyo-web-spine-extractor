import {node, toast} from './ui.js';
import {RenderHub, preferredAnimation} from './renderer.js';
import {FrameMonitor} from './performance.js';

const button = (label, action) => { const b = node('button', '', label); b.type = 'button'; b.onclick = action; return b; };

export class Composition {
  constructor(container, activity, data) {
    Object.assign(this, {container, activity, data}); this.playing = !matchMedia('(prefers-reduced-motion: reduce)').matches; this.loop = true; this.rows = [];
    this.render();
  }
  destroy() { this.destroyed = true; this.monitor?.destroy(); this.hub?.dispose(); this.observer?.disconnect(); this.generation++; this.container.replaceChildren(); }
  render() {
    const heading = node('div', 'activity-heading'), text = node('div');
    text.append(node('h2', '', this.activity.title + ' · 测试合并'), node('p', 'muted', '按原网页的位置、缩放和层级预览动画。'));
    heading.append(text); this.container.replaceChildren(heading);
    if (!this.data.scenes.length) {
      const empty = node('div', 'empty-state'); empty.append(node('h3', '', '暂无原网页场景布局'),
        node('p', '', '此活动尚未收录可用的原网页布局。'));
      this.container.append(empty); return;
    }
    const tools = node('div', 'composition-tools');
    this.tools = tools;
    const scenes = node('select'); scenes.setAttribute('aria-label', '原网页场景');
    this.data.scenes.forEach((scene, i) => { const option = node('option', '', scene.name); option.value = i; scenes.append(option); });
    scenes.value = this.data.default_scene || 0; scenes.onchange = () => this.showScene(Number(scenes.value));
    const play = button(this.playing ? '暂停' : '播放', () => { this.playing = !this.playing; play.textContent = this.playing ? '暂停' : '播放'; this.sync(); });
    const loop = button('循环', () => { this.loop = !this.loop; loop.classList.toggle('active', this.loop); this.sync(); }); loop.classList.add('active');
    const full = button('全屏', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await this.container.requestFullscreen(); } catch (e) { toast(e.message); } });
    this.status = node('span', 'muted');
    tools.append(scenes, play, loop, button('重播', () => this.sync(true)), button('复位视图', () => this.fit()), full, this.status);
    const body = node('div', 'composition-body'); this.viewport = node('div', 'composition-viewport'); this.canvas = node('canvas');
    this.canvas.width = this.data.width; this.canvas.height = this.data.height; this.canvas.setAttribute('aria-label', '合并动画预览'); this.viewport.append(this.canvas);
    this.side = node('aside', 'composition-side'); body.append(this.viewport, this.side); this.container.append(tools, body);
    const notes = ['动画位置与图层来自原网页实测；静态背景、画面对照、粒子和原网页交互尚未收录。'];
    this.container.append(node('p', 'field-note', notes.join('　')));
    this.context = this.canvas.getContext('2d'); this.view = {zoom: 1, x: 0, y: 0};
    let pointer;
    this.canvas.onpointerdown = e => { if (e.button !== 0) return; pointer = {x: e.clientX, y: e.clientY}; this.canvas.setPointerCapture(e.pointerId); };
    this.canvas.onpointermove = e => { if (!pointer) return; this.view.x += e.clientX - pointer.x; this.view.y += e.clientY - pointer.y; pointer = {x:e.clientX,y:e.clientY}; this.place(); };
    this.canvas.onpointerup = this.canvas.onpointercancel = () => { pointer = null; };
    this.viewport.onwheel = e => { e.preventDefault(); this.view.zoom = Math.max(.2, Math.min(5, this.view.zoom * Math.exp(-e.deltaY * .001))); this.place(); };
    this.canvas.ondblclick = () => this.fit();
    this.observer = new ResizeObserver(() => this.place()); this.observer.observe(this.viewport);
    this.showScene(Number(scenes.value));
  }
  place() {
    const box = this.viewport.getBoundingClientRect(), scale = Math.min(box.width / this.data.width, box.height / this.data.height) * this.view.zoom;
    this.canvas.style.width = this.data.width * scale + 'px'; this.canvas.style.height = this.data.height * scale + 'px';
    this.canvas.style.transform = `translate(calc(-50% + ${this.view.x}px), calc(-50% + ${this.view.y}px))`;
  }
  fit() { this.view = {zoom: 1, x: 0, y: 0}; this.place(); }
  showScene(index) {
    this.monitor?.destroy(); this.hub?.dispose(); this.reference = false; this.referenceImage = null; this.side.replaceChildren();
    this.rows = []; const generation = this.generation = (this.generation || 0) + 1, scene = this.data.scenes[index];
    this.hub = new RenderHub({detail: true, fps: 30, afterFrame: () => this.draw()});
    this.monitor = new FrameMonitor(this.hub, this.viewport); this.monitor.setVisible(false); this.tools.insertBefore(this.monitor.button, this.status);
    this.side.append(node('h3', '', '图层'), node('p', 'field-note', '从上到下为前景到背景；勾选控制显示。'));
    scene.layers.forEach(layer => {
      const row = {layer, visible: true, state: {playing: this.playing, loop: this.loop, speed: 1}}; this.rows.push(row);
      if (layer.kind === 'spine' && this.activity.groups[layer.group]) {
        const group = this.activity.groups[layer.group]; row.state.animation = group.animations.includes(layer.animation) ? layer.animation : preferredAnimation(group.animations); row.state.skin = layer.skin || group.initial_skin || '';
        row.canvas = document.createElement('canvas'); row.canvas.width = Math.min(2048, this.data.width); row.canvas.height = Math.round(row.canvas.width * this.data.height / this.data.width);
        this.hub.add(group, row.canvas, row.state, {
          ready: surface => { if (this.generation !== generation) return; row.surface = surface;
            surface.setState(true);
            for (const key of ['x', 'y', 'scaleX', 'scaleY']) if (Number.isFinite(layer.skeleton?.[key])) surface.skeleton[key] = layer.skeleton[key];
            surface.bounds = viewportBounds(layer.matrix) || surface.bounds;
            surface.updateWorld(); this.layerControls(row); this.updateStatus(); },
          error: error => { row.error = error; this.updateStatus(); },
        });
      }
    });
    this.rows.slice().reverse().forEach(row => { row.controls = node('div', 'composition-layer'); this.side.append(row.controls); this.layerControls(row); });
    this.updateStatus(); this.fit();
  }
  layerControls(row) {
    if (!row.controls) return;
    const label = node('label', 'check'), checkbox = node('input'); checkbox.type = 'checkbox'; checkbox.checked = row.visible;
    checkbox.onchange = () => { row.visible = checkbox.checked; };
    const title = node('span', '', row.layer.name); title.title = row.layer.name;
    label.append(checkbox, title, node('span', 'badge', row.layer.kind === 'spine' ? 'Spine' : '图像')); row.controls.replaceChildren(label);
    if (row.surface) {
      const names = row.surface.group.animations;
      if (names.length > 1) {
        const select = node('select'); select.setAttribute('aria-label', row.layer.name + ' 合并动作');
        names.forEach(name => { const option = node('option', '', name); option.value = name; select.append(option); }); select.value = row.state.animation;
        select.onchange = () => { row.state.animation = select.value; row.surface.setState(true); }; row.controls.append(select);
      } else row.controls.append(node('p', 'field-note', names[0] || '静态姿态'));
    }
  }
  sync(restart = false) { for (const row of this.rows) { Object.assign(row.state, {playing: this.playing, loop: this.loop}); row.surface?.setState(restart); } }
  updateStatus() {
    const spine = this.rows.filter(r => r.layer.kind === 'spine');
    this.status.textContent = `${spine.filter(r => r.surface).length} / ${spine.length} 个动画已加载`;
    for (const row of this.rows.filter(r => r.error)) { row.controls?.setAttribute('title', row.error); row.controls?.classList.add('layer-error'); }
  }
  draw() {
    const ctx = this.context, {width, height} = this.canvas; ctx.clearRect(0, 0, width, height);
    for (const row of this.rows) {
      if (!row.visible) continue;
      if (!row.surface?.ready) { if (row.image) ctx.drawImage(row.image, 0, 0, width, height); continue; }
      const surface = row.surface, m = row.layer.matrix, b = surface.bounds;
      const unit = surface.worldPerPixel(), left = b.x + b.width / 2 - row.canvas.width * unit / 2, top = b.y + b.height / 2 + row.canvas.height * unit / 2;
      const project = (u, v) => {
        const x = left + u * unit, y = top - v * unit, w = m[3] * x + m[7] * y + m[15];
        return [(1 + (m[0] * x + m[4] * y + m[12]) / w) * width / 2, (1 - (m[1] * x + m[5] * y + m[13]) / w) * height / 2];
      };
      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, row.layer.opacity ?? 1));
      // Flat planes use one draw; perspective planes are divided to preserve their projected placement.
      const steps = Math.abs(m[3]) + Math.abs(m[7]) > 1e-9 ? 6 : 1;
      for (let iy = 0; iy < steps; iy++) for (let ix = 0; ix < steps; ix++) {
        const x = ix * row.canvas.width / steps, y = iy * row.canvas.height / steps, w = row.canvas.width / steps, h = row.canvas.height / steps;
        const points = [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
        for (const ids of [[0,1,3],[1,2,3]]) drawTriangle(ctx, row.canvas, ids.map(i => points[i]), ids.map(i => project(...points[i])));
      }
      ctx.restore();
    }
  }

}

function viewportBounds(m) {
  // Render only the part of this skeleton that the original camera can see.
  // Fitting a very large skeleton first would blur the crop in the merged view.
  const points = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) {
    const a=m[0]-x*m[3], b=m[4]-x*m[7], c=m[1]-y*m[3], d=m[5]-y*m[7], ex=x*m[15]-m[12], ey=y*m[15]-m[13], det=a*d-b*c;
    if (Math.abs(det)<1e-12) return null;
    points.push([(ex*d-ey*b)/det, (ey*a-ex*c)/det]);
  }
  if (!points.flat().every(v => Number.isFinite(v) && Math.abs(v)<1e7)) return null;
  const xs=points.map(p=>p[0]), ys=points.map(p=>p[1]), x=Math.min(...xs), y=Math.min(...ys);
  return {x, y, width: Math.max(...xs)-x, height: Math.max(...ys)-y};
}

function drawTriangle(ctx, image, from, to) {
  const [s0,s1,s2] = from, [d0,d1,d2] = to, ux=s1[0]-s0[0], uy=s1[1]-s0[1], vx=s2[0]-s0[0], vy=s2[1]-s0[1], det=ux*vy-vx*uy;
  if (!Number.isFinite(det) || Math.abs(det)<1e-9 || !to.flat().every(Number.isFinite)) return;
  const ax=d1[0]-d0[0], ay=d1[1]-d0[1], bx=d2[0]-d0[0], by=d2[1]-d0[1];
  const a=(ax*vy-bx*uy)/det, c=(bx*ux-ax*vx)/det, b=(ay*vy-by*uy)/det, d=(by*ux-ay*vx)/det;
  ctx.save(); ctx.beginPath(); ctx.moveTo(...d0); ctx.lineTo(...d1); ctx.lineTo(...d2); ctx.closePath(); ctx.clip();
  ctx.transform(a,b,c,d,d0[0]-a*s0[0]-c*s0[1],d0[1]-b*s0[0]-d*s0[1]); ctx.drawImage(image,0,0); ctx.restore();
}
