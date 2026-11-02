import {node} from './ui.js';

const modes = ['无', '正弦波动', '物理跟随', '随机抖动', '风力与重力', '弹性效果', '关键帧'];
const check = (text, value, changed) => {
  const label = node('label', 'check'), input = node('input'); input.type = 'checkbox'; input.checked = value;
  input.onchange = () => changed(input.checked); label.append(input, document.createTextNode(text)); return label;
};

/** Native workbench controls; only the supplied physics/provider is shared with the reference UI. */
export class ExtraPanel {
  constructor(motion, container) {
    this.motion = motion; this.provider = motion.provider; this.mesh = motion.mesh;
    this.history = []; this.rows = [];
    this.root = node('div', 'extra-debug'); container.replaceChildren(this.root);
    const toggles = node('div', 'extra-toggles');
    toggles.append(check('启用飘动', this.provider.extraEnabled, value => this.provider.setExtraEnabled(value)),
      check('显示骨骼', false, value => { this.highlight = value; this.selectHighlight(); }));
    const search = node('input'); search.type = 'search'; search.placeholder = '搜索飘动骨骼'; search.setAttribute('aria-label', '搜索飘动骨骼');
    this.search = search; search.oninput = () => this.refreshBones();
    this.bones = node('select', 'extra-bone-list'); this.bones.setAttribute('aria-label', '飘动骨骼');
    this.bones.onchange = () => { this.selected = this.mesh.autoBone[Number(this.bones.value)]; this.showBone(); };
    this.count = node('p', 'field-note'); this.editor = node('div', 'extra-bone-editor');
    this.root.append(toggles, search, this.bones, this.count, this.editor,
      node('p', 'field-note', '参数只读。extra 仅用于网页渲染，不会写入 .spine 工程。'));
    this.refreshBones(); this.update();
    // Sampling the selected bone at 10 Hz is independent of animation rendering.
    this.timer = setInterval(() => { if (!document.hidden) this.update(); }, 100);
  }
  refreshBones() {
    const query = this.search.value.toLowerCase(); this.bones.replaceChildren();
    this.mesh.autoBone.forEach((bone, index) => {
      if (!bone.rootBoneName.toLowerCase().includes(query)) return;
      const option = node('option', '', `${bone.rootBoneName} · ${modes[bone.currentAnimation?.mode] || '未配置'}`); option.value = index; this.bones.append(option);
    });
    this.count.textContent = `${this.bones.options.length} / ${this.mesh.autoBone.length} 个飘动骨骼`;
    const current = this.mesh.autoBone.indexOf(this.selected);
    this.bones.value = String(current);
    if (this.bones.selectedIndex < 0 && this.bones.options.length) this.bones.selectedIndex = 0;
    this.selected = this.bones.value === '' ? null : this.mesh.autoBone[Number(this.bones.value)];
    this.showBone();
    this.trackName = this.motion.state.getCurrent(0)?.animation.name;
  }
  selectHighlight() {
    this.provider.setHighlightedMesh(this.highlight && this.selected ? this.mesh : null, this.mesh.autoBone.indexOf(this.selected));
    this.motion.changed();
  }
  showBone() {
    this.editor.replaceChildren(); this.rows = []; this.history = []; this.selectHighlight();
    const bone = this.selected;
    if (!bone) { this.editor.append(node('p', 'muted', '没有匹配的飘动骨骼')); return; }
    this.animation = bone.currentAnimation;
    const head = node('div', 'extra-bone-heading');
    head.append(node('strong', '', bone.rootBoneName), node('span', 'badge', modes[this.animation?.mode] || '未配置'));
    this.track = node('p', 'field-note'); this.metric = node('output', 'extra-metrics');
    this.graph = node('canvas', 'extra-curve'); this.graph.width = 580; this.graph.height = 112;
    this.graph.setAttribute('aria-label', '飘动实时曲线：旋转、X 速度、Y 速度');
    this.editor.append(head, this.track, this.metric, this.graph, node('p', 'extra-legend', '旋转（蓝） · X 速度（绿） · Y 速度（棕）'));
    const params = node('details', 'extra-params'); params.open = true; params.append(node('summary', '', '飘动参数 · 只读'));
    for (const meta of this.provider.getParamMeta(this.animation?.mode ?? 0)) {
      const row = node('label', 'extra-param-row'), name = node('span', '', meta.label);
      const range = node('input'); range.type = 'range'; range.min = meta.min; range.max = meta.max; range.step = meta.step;
      range.setAttribute('aria-label', meta.label + ' 滑块'); range.disabled = true;
      const input = node('input'); input.type = 'text'; input.setAttribute('aria-label', meta.label); input.readOnly = true;
      row.append(name, range, input); params.append(row); this.rows.push({meta, input, range});
    }
    if (!this.rows.length) params.append(node('p', 'field-note', '当前动作没有飘动参数。'));
    this.editor.append(params); this.updateInputs();
  }
  updateInputs() {
    const values = this.provider.getExtraParams(this.mesh, this.mesh.autoBone.indexOf(this.selected)) || {};
    for (const {meta, input, range} of this.rows) {
      const value = values[meta.key] ?? 0;
      input.value = Number(value.toFixed(4)); range.value = value;
    }
  }
  update() {
    if (!this.selected) return;
    if (this.animation !== this.selected.currentAnimation) this.showBone();
    const trackName = this.motion.state.getCurrent(0)?.animation.name;
    if (trackName !== this.trackName) {
      this.trackName = trackName;
      for (const option of this.bones.options) {
        const bone = this.mesh.autoBone[Number(option.value)];
        const label = `${bone.rootBoneName} · ${modes[bone.currentAnimation?.mode] || '未配置'}`;
        if (option.textContent !== label) option.textContent = label;
      }
    }
    const info = this.motion.boneSnapshot(this.selected);
    if (!info) return;
    const track = `当前动作：${info.trackName} · 模式 ${info.mode}`;
    if (this.track.textContent !== track) this.track.textContent = track;
    const values = [info.rotationDelta, info.speedX, info.speedY].map(v => Number.isFinite(v) ? v : 0);
    this.metric.textContent = `旋转 ${values[0].toFixed(2)}°　X ${values[1].toFixed(2)}　Y ${values[2].toFixed(2)}`;
    if (info.mode === 4) this.metric.textContent += `\n力 X ${info.forceX.toFixed(2)}　Y ${info.forceY.toFixed(2)}`;
    if (info.mode === 5) this.metric.textContent += `\n弹性速度 X ${info.elasticSpeedX.toFixed(2)}　Y ${info.elasticSpeedY.toFixed(2)}`;
    this.history.push(values); if (this.history.length > 120) this.history.shift();
    const ctx = this.graph.getContext('2d'), w = this.graph.width, h = this.graph.height;
    ctx.clearRect(0, 0, w, h); ctx.strokeStyle = '#dce0e4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
    const amplitude = Math.max(1, ...this.history.flat().map(Math.abs));
    ['#326ca5', '#3c8162', '#9b6637'].forEach((color, index) => {
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
      this.history.forEach((v, i) => { const x = i * w / 119, y = h / 2 - v[index] / amplitude * (h / 2 - 6); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke();
    });
  }
  destroy() { clearInterval(this.timer); this.provider.setHighlightedMesh(null); this.motion.changed(); this.root.remove(); }
}
