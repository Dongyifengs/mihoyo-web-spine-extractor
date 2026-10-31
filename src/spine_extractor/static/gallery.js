import {api, node, toast, watchJob} from './api.js';
import {RenderHub, debugOptions} from './renderer.js';

const initialAnimation = group => (group.animations || []).find(name => /idle|loop|stand/i.test(name)) || group.animations?.[0] || '';
const button = (label, action, className = '') => {
  const result = node('button', className, label); result.type = 'button'; result.onclick = action; return result;
};

export class Gallery {
  constructor(container, activity) {
    this.container = container; this.activity = activity; this.states = new Map(); this.destroyed = false;
    this.render();
  }
  destroy() {
    this.destroyed = true; this.hub.dispose(); this.closeDetail(); this.dialog?.remove(); this.container.replaceChildren();
  }
  reload(activity) {
    this.hub.dispose(); this.closeDetail(); this.dialog?.remove(); this.dialog = null;
    this.activity = activity; this.render();
  }
  state(index) {
    if (!this.states.has(index)) {
      const group = this.activity.groups[index];
      this.states.set(index, {animation: initialAnimation(group), skin: group.initial_skin || group.skins?.[0] || '', playing: true, loop: true, speed: 1});
    }
    return this.states.get(index);
  }
  render() {
    this.hub = new RenderHub(); this.cards = []; this.filter = 'all'; this.query = '';
    const activity = this.activity, heading = node('div', 'activity-heading');
    const text = node('div'); text.append(node('h2', '', activity.title), node('p', 'muted', `${activity.groups.length} 组素材 · ${activity.complete_count} 组齐全 · ${activity.groups.filter(g => g.spine_project?.status === 'success').length} 个工程`));
    const actions = node('div', 'activity-actions');
    actions.append(button('打开文件夹', () => this.action('open-folder')), button('全部生成 .spine', () => this.convert()));
    for (const [label, url] of [['报告 ↗', activity.report_url], ['活动网页 ↗', activity.page_url]]) {
      const link = node('a', 'button', label); link.href = url; link.target = '_blank'; link.rel = 'noopener'; actions.append(link);
    }
    heading.append(text, actions);
    const toolbar = node('div', 'gallery-toolbar'), search = node('input');
    search.placeholder = '搜索名称、版本、动作'; search.setAttribute('aria-label', '搜索素材');
    search.oninput = () => { this.query = search.value.toLowerCase(); this.applyFilter(); };
    const filters = node('div', 'gallery-filters');
    for (const [key, label] of [['all', '全部'], ['complete', '齐全'], ['partial', '待补齐'], ['project', '工程'], ['extra', 'extra']]) {
      const item = button(label, () => {
        this.filter = key;
        for (const other of filters.querySelectorAll('[data-filter]')) other.classList.toggle('active', other === item);
        this.applyFilter();
      }, key === 'all' ? 'active' : ''); item.dataset.filter = key; filters.append(item);
    }
    const pauseAll = button('全部暂停', () => {
      const playing = pauseAll.dataset.paused === 'true'; pauseAll.dataset.paused = String(!playing);
      pauseAll.textContent = playing ? '全部暂停' : '全部播放';
      activity.groups.forEach((_, i) => { this.state(i).playing = playing; this.send(i); });
    });
    this.loadStatus = node('span', 'load-status', '正在加载全部预览…');
    toolbar.append(search, filters, this.loadStatus, pauseAll);
    this.grid = node('div', 'gallery-grid');
    activity.groups.forEach((group, index) => this.grid.append(this.card(group, index)));
    this.container.replaceChildren(heading, toolbar, this.grid);
    if (!activity.groups.length) this.grid.append(node('div', 'empty-state', '没有识别到 Spine 资源。可重新捕获，并进入活动场景。'));
    // Start every preview now; scrolling and filtering never create or destroy renderers.
    this.cards.forEach((card, index) => {
      const group = activity.groups[index];
      if (group.status !== 'complete') return;
      this.hub.add(group, card.canvas, this.state(index), {
        ready: surface => {
          if (this.destroyed) return;
          card.surface = surface;
          const animated = surface.skeleton.data.animations.filter(a => a.duration > 0);
          if (!this.state(index).userAnimation) {
            this.state(index).animation = (animated.find(a => /idle|loop|stand/i.test(a.name)) || animated[0])?.name || this.state(index).animation;
            surface.setState(true);
          }
          card.placeholder.hidden = true; card.element.dataset.preview = 'ready';
          this.refreshControls(index); this.addExtraTag(card.header, group); this.updateStatus(); this.applyFilter();
        },
        error: message => {
          card.element.dataset.preview = 'error'; card.placeholder.textContent = message;
          card.placeholder.classList.add('preview-error'); card.placeholder.hidden = false; this.updateStatus();
        },
        warning: message => { if (message) { card.warning = message; card.element.title = message; } },
      });
    });
  }
  updateStatus() {
    const ready = this.cards.filter(c => c.element.dataset.preview === 'ready').length;
    const failed = this.cards.filter(c => c.element.dataset.preview === 'error').length;
    this.loadStatus.textContent = `${ready} / ${this.activity.groups.filter(g => g.status === 'complete').length} 已加载${failed ? ` · ${failed} 个失败` : ''}`;
  }
  addExtraTag(target, group) {
    if (group.has_extra && !target.querySelector('.extra-tag')) target.append(node('span', 'badge extra-tag', 'extra · 飘动'));
  }
  card(group, index) {
    const element = node('article', 'asset-card'); element.dataset.index = index;
    const header = node('div', 'asset-header'), name = node('span', 'asset-name', group.name); name.title = group.name;
    header.append(name, node('span', 'asset-version', group.version || '未知版本')); this.addExtraTag(header, group);
    const preview = node('div', 'asset-preview'), canvas = node('canvas');
    canvas.width = 320; canvas.height = 240; canvas.setAttribute('aria-label', group.name + ' 动画预览');
    const placeholder = node('div', 'placeholder', group.status === 'complete' ? '加载中…' : '资源尚未配齐');
    preview.append(canvas, placeholder); canvas.ondblclick = () => this.openDetail(index);
    const controls = this.controls(index, false);
    element.append(header, preview, controls.element);
    this.cards[index] = {element, header, preview, canvas, placeholder, controls};
    return element;
  }
  refreshControls(index) {
    const card = this.cards[index], controls = this.controls(index, false);
    card.controls.element.replaceWith(controls.element); card.controls = controls;
  }
  controls(index, detail) {
    const group = this.activity.groups[index], state = this.state(index), element = node('div', 'asset-controls');
    const animationRow = node('div', 'animation-row'), animationButtons = [];
    let animationSelect, skinSelect;
    const choose = (field, value) => {
      state[field] = value; if (field === 'animation') state.userAnimation = true;
      this.send(index, field === 'animation');
    };
    const makeSelect = (label, values, field) => {
      const select = node('select'); select.setAttribute('aria-label', `${group.name} ${label}`);
      for (const value of values) { const option = node('option', '', value); option.value = value; select.append(option); }
      select.onchange = () => choose(field, select.value); return select;
    };
    const animations = group.animations || [];
    if (animations.length <= 1) {
      const name = node('span', 'current-animation', animations[0] || '静态姿态'); name.title = name.textContent; animationRow.append(name);
    } else if (animations.length <= 4) {
      animationRow.classList.add('animation-buttons');
      for (const name of animations) {
        const item = button(name, () => choose('animation', name)); item.title = name; item.dataset.animation = name;
        animationButtons.push(item); animationRow.append(item);
      }
    } else { animationSelect = makeSelect('动作', animations, 'animation'); animationRow.append(animationSelect); }
    element.append(animationRow);
    if (group.skins?.length > 1) { skinSelect = makeSelect('皮肤', group.skins, 'skin'); element.append(skinSelect); }
    const buttons = node('div', 'control-buttons');
    const play = button('', () => { state.playing = !state.playing; this.send(index); }); play.title = '播放 / 暂停';
    const loop = button('循环', () => { state.loop = !state.loop; this.send(index); }); loop.title = '循环播放';
    const restart = button('↺', () => { state.playing = true; this.send(index, true); }); restart.title = '重新播放'; restart.setAttribute('aria-label', group.name + ' 重新播放');
    buttons.append(play, loop, restart);
    if (!detail) buttons.append(button('详情 ↗', () => this.openDetail(index), 'detail-button'));
    element.append(buttons);
    if (detail) {
      const label = node('label', 'speed-control', '速度'), speed = node('select'); speed.setAttribute('aria-label', '播放速度');
      for (const value of [0.25, 0.5, 1, 1.5, 2]) { const option = node('option', '', value + ' ×'); option.value = value; speed.append(option); }
      speed.value = state.speed; speed.onchange = () => { state.speed = Number(speed.value); this.send(index); }; label.append(speed); element.append(label);
    }
    const sync = () => {
      play.textContent = state.playing ? 'Ⅱ 暂停' : '▶ 播放'; loop.classList.toggle('active', state.loop); loop.setAttribute('aria-pressed', String(state.loop));
      if (animationSelect) animationSelect.value = state.animation;
      if (skinSelect) skinSelect.value = state.skin;
      for (const item of animationButtons) { item.classList.toggle('active', item.dataset.animation === state.animation); item.setAttribute('aria-pressed', String(item.dataset.animation === state.animation)); }
    };
    sync(); return {element, sync};
  }
  applyFilter() {
    this.activity.groups.forEach((group, index) => {
      const matches = !this.query || `${group.name} ${group.version} ${(group.animations || []).join(' ')}`.toLowerCase().includes(this.query);
      const category = this.filter === 'all' || group.status === this.filter || this.filter === 'project' && group.spine_project?.status === 'success' || this.filter === 'extra' && group.has_extra;
      this.cards[index].element.hidden = !(matches && category);
    });
  }
  send(index, restart = false) {
    this.cards[index]?.surface?.setState(restart); this.cards[index]?.controls.sync();
    if (index === this.detailIndex) { this.detailSurface?.setState(restart); this.detailControls?.sync(); }
  }
  openDetail(index) {
    this.closeDetail(); this.dialog?.remove();
    const group = this.activity.groups[index]; this.detailIndex = index;
    const dialog = node('dialog', 'detail-modal'); this.dialog = dialog;
    const top = node('div', 'detail-top'), title = node('div', 'detail-title'); title.append(node('h2', '', group.name)); this.addExtraTag(title, group);
    const full = button('全屏', async () => {
      try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
      catch (error) { toast('无法进入全屏：' + error.message); }
    }); full.setAttribute('aria-label', '全屏观看');
    this.fullscreenChange = () => { full.textContent = document.fullscreenElement ? '退出全屏' : '全屏'; };
    document.addEventListener('fullscreenchange', this.fullscreenChange);
    const close = button('关闭 ×', () => dialog.close()); close.setAttribute('aria-label', '关闭详情'); top.append(title, full, close);
    const body = node('div', 'detail-body'), viewer = node('div', 'detail-viewer'), preview = node('div', 'detail-preview');
    const canvas = node('canvas'); canvas.setAttribute('aria-label', group.name + ' 详情预览');
    const loading = node('div', 'placeholder', '加载中…'); preview.append(canvas, loading);
    const tools = node('div', 'viewer-tools'), zoomLabel = node('output', 'zoom-value', '100%');
    tools.append(button('−', () => this.detailSurface?.zoomBy(1 / 1.2)), zoomLabel,
      button('＋', () => this.detailSurface?.zoomBy(1.2)), button('适应窗口', () => this.detailSurface?.fit()), node('span', 'muted', '拖拽移动 · 滚轮缩放 · 双击复位'));
    tools.children[0].setAttribute('aria-label', '缩小'); tools.children[2].setAttribute('aria-label', '放大');
    viewer.append(preview, tools);
    const side = node('aside', 'detail-side'); side.append(node('span', 'badge', 'Spine ' + (group.version || '未知')),
      node('p', 'detail-meta', `${group.textures?.length || 0} 张图集 · ${group.region_images || 0} 张切片`));
    this.detailControls = this.controls(index, true); side.append(this.detailControls.element);
    const debug = node('details', 'debug-settings'); debug.open = true; debug.append(node('summary', '', 'Spine 调试显示'));
    const debugChecks = node('div', 'debug-checks');
    for (const [key, label] of debugOptions) {
      const field = node('label', 'check'), input = node('input'); input.type = 'checkbox'; input.dataset.debug = key;
      input.onchange = () => { if (this.detailSurface) this.detailSurface.debug[key] = input.checked; };
      field.append(input, document.createTextNode(label)); debugChecks.append(field);
    }
    const background = node('select'); background.setAttribute('aria-label', '预览背景');
    for (const [value, text] of [['checker', '透明网格'], ['dark', '深色背景'], ['light', '浅色背景']]) { const option = node('option', '', text); option.value = value; background.append(option); }
    background.onchange = () => { preview.dataset.background = background.value; };
    debug.append(debugChecks, background); side.append(debug);
    const extra = button('extra 调试面板', () => {
      const motion = this.detailSurface?.extra; if (!motion) return;
      if (motion.panel) motion.hidePanel(); else motion.showPanel(dialog);
      extra.classList.toggle('active', !!motion.panel);
    }, 'extra-panel-button'); extra.hidden = !group.has_extra; side.append(extra);
    const warning = node('div', 'detail-warning'); warning.hidden = true; side.append(warning);
    if (group.spine_project?.status === 'success') side.append(button('在 Spine 中打开 ↗', () => this.action('open-project', {group: index}), 'primary'));
    else side.append(button('生成 .spine 工程', () => this.convert([index]), 'primary'), node('p', 'field-note', '可选，需要已激活的正版 Spine CLI。'));
    const extraNotice = node('p', 'detail-warning extra-export-notice', 'extra 飘动后处理仅支持网页预览，导出的 Spine 工程不包含此效果。');
    extraNotice.hidden = !group.has_extra; side.append(extraNotice);
    const files = node('details', 'detail-files'); files.append(node('summary', '', '项目文件'));
    for (const file of group.file_links || []) { const link = node('a', '', file.name + ' ↗'); link.href = file.url; link.target = '_blank'; link.rel = 'noopener'; if (file.name.endsWith('.spine')) link.download = file.name; files.append(link); }
    side.append(files);
    if (group.spine_project?.default_animation) side.append(node('p', 'field-note', `工程默认动作：${group.spine_project.default_animation}`));
    for (const message of [...(group.warnings || []), ...[group.spine_project?.error, group.spine_project?.selection_warning].filter(Boolean)]) side.append(node('p', 'detail-warning', message));
    body.append(viewer, side); dialog.append(top, body); document.body.append(dialog);
    dialog.addEventListener('close', () => this.closeDetail());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.showModal();
    const resize = () => {
      const box = preview.getBoundingClientRect(), scale = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.min(2048, Math.round(box.width * scale)));
      canvas.height = Math.max(1, Math.min(2048, Math.round(box.height * scale)));
    };
    this.resizeObserver = new ResizeObserver(resize); this.resizeObserver.observe(preview); resize();
    let pointer;
    canvas.onpointerdown = event => {
      if (event.button !== 0 && event.button !== 1) return;
      pointer = {id: event.pointerId, x: event.clientX, y: event.clientY}; canvas.setPointerCapture(event.pointerId); canvas.classList.add('dragging');
    };
    canvas.onpointermove = event => {
      if (!pointer || event.pointerId !== pointer.id) return;
      const box = canvas.getBoundingClientRect();
      this.detailSurface?.pan((event.clientX - pointer.x) * canvas.width / box.width, (event.clientY - pointer.y) * canvas.height / box.height);
      pointer.x = event.clientX; pointer.y = event.clientY;
    };
    canvas.onpointerup = canvas.onpointercancel = () => { pointer = null; canvas.classList.remove('dragging'); };
    canvas.addEventListener('wheel', event => {
      event.preventDefault(); const box = canvas.getBoundingClientRect();
      this.detailSurface?.zoomBy(Math.exp(-event.deltaY * 0.0015), (event.clientX - box.left) * canvas.width / box.width, (event.clientY - box.top) * canvas.height / box.height);
    }, {passive: false});
    canvas.ondblclick = () => this.detailSurface?.fit();
    this.detailHub = new RenderHub({detail: true});
    this.detailHub.add(group, canvas, this.state(index), {
      ready: surface => {
        if (!dialog.open) return;
        this.detailSurface = surface; loading.hidden = true; preview.dataset.preview = 'ready';
        this.detailControls.element.remove(); this.detailControls = this.controls(index, true); side.insertBefore(this.detailControls.element, debug);
        this.addExtraTag(title, group); extra.hidden = !surface.extra;
        extraNotice.hidden = !surface.extra;
      },
      error: message => { loading.hidden = false; loading.textContent = message; loading.classList.add('preview-error'); },
      warning: message => { warning.textContent = message; warning.hidden = !message; },
      view: view => { zoomLabel.textContent = Math.round(view.zoom * 100) + '%'; },
      state: () => this.send(index),
    });
  }
  closeDetail() {
    if (this.fullscreenChange) document.removeEventListener('fullscreenchange', this.fullscreenChange);
    if (this.detailIndex !== undefined && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    this.detailHub?.dispose(); this.resizeObserver?.disconnect(); this.detailHub = null; this.detailSurface = null;
    if (this.detailIndex !== undefined) this.cards[this.detailIndex]?.controls.sync();
    this.detailIndex = undefined;
  }
  async action(name, payload = {}) {
    try { await api(`/api/activities/${this.activity.id}/${name}`, payload); } catch (error) { toast(error.message); }
  }
  async convert(groups) {
    try {
      const selected = groups ? groups.map(index => this.activity.groups[index]) : this.activity.groups;
      if (selected.some(group => group.has_extra)) toast('extra 飘动后处理仅支持网页预览，导出的 Spine 工程不包含此效果。');
      const job = await api(`/api/activities/${this.activity.id}/convert`, groups ? {groups} : {});
      window.dispatchEvent(new CustomEvent('spine-job', {detail: job}));
      if (!selected.some(group => group.has_extra)) toast('正在生成工程，可继续浏览素材');
      const final = await watchJob(job.id, () => {});
      if (final.status === 'failed') throw new Error(final.error);
      toast(final.status === 'cancelled' ? '转换已停止' : `转换结束：${final.result.converted} 个成功，${final.result.failed} 个失败`);
      if (!this.destroyed) this.reload(await api('/api/activities/' + this.activity.id));
      window.dispatchEvent(new Event('spine-library-updated'));
    } catch (error) { toast(error.message); }
  }
}
