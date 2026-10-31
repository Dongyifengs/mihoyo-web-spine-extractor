import {api, node, toast, watchJob} from './api.js';

const initialAnimation = group => (group.animations || []).find(name => /idle|loop|stand/i.test(name)) || group.animations?.[0] || '';

export class Gallery {
  constructor(container, activity) {
    this.container = container; this.activity = activity; this.cards = []; this.live = new Map(); this.visible = new Set(); this.states = new Map(); this.destroyed = false;
    this.filter = 'all'; this.query = ''; this.limit = 8;
    this.messageHandler = event => this.receive(event);
    window.addEventListener('message', this.messageHandler);
    this.observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const index = Number(entry.target.dataset.index);
        if (entry.isIntersecting) this.visible.add(index); else this.visible.delete(index);
      }
      this.reconcile();
    }, {threshold: [0, 0.05, 0.25, 0.5, 0.75, 1]});
    this.render();
  }
  destroy() {
    this.destroyed = true; this.observer.disconnect(); window.removeEventListener('message', this.messageHandler);
    for (const index of [...this.live.keys()]) this.unmount(index);
    if (this.dialog) { this.closeDetail(); this.dialog.remove(); }
    this.container.replaceChildren();
  }
  reload(activity) {
    this.observer.disconnect();
    if (this.dialog) { this.closeDetail(); this.dialog.remove(); this.dialog = null; }
    for (const index of [...this.live.keys()]) this.unmount(index);
    this.cards = []; this.visible.clear(); this.activity = activity; this.filter = 'all'; this.query = '';
    this.render();
  }
  state(index) {
    if (!this.states.has(index)) {
      const group = this.activity.groups[index];
      this.states.set(index, {animation: initialAnimation(group), skin: group.initial_skin || group.skins?.[0] || '', playing: true, loop: true, speed: 1});
    }
    return this.states.get(index);
  }
  render() {
    const activity = this.activity;
    const heading = node('div', 'activity-heading');
    const text = node('div'); text.append(node('h2', '', activity.title), node('p', '', `${activity.groups.length} 组素材 · ${activity.complete_count} 组配套完整 · ${activity.groups.filter(g => g.spine_project?.status === 'success').length} 个 Spine 工程`));
    const actions = node('div', 'activity-actions');
    const folder = node('button', 'button small', '打开文件夹'); folder.onclick = () => this.action('open-folder');
    const convert = node('button', 'button small', '全部生成 .spine'); convert.onclick = () => this.convert();
    const report = node('a', 'button small', '报告 ↗'); report.href = activity.report_url; report.target = '_blank'; report.rel = 'noopener';
    const source = node('a', 'button small', '活动原网页 ↗'); source.href = activity.page_url; source.target = '_blank'; source.rel = 'noopener';
    actions.append(folder, convert, report, source); heading.append(text, actions);
    const toolbar = node('div', 'gallery-toolbar');
    const search = node('input'); search.placeholder = '搜索项目名称、版本或动作…'; search.setAttribute('aria-label', '搜索素材'); search.oninput = () => { this.query = search.value.toLowerCase(); this.applyFilter(); };
    const filters = node('div', 'gallery-filters');
    for (const [key, label] of [['all', '全部素材'], ['complete', '资源齐全'], ['partial', '待补齐'], ['project', '已有工程']]) {
      const button = node('button', 'button small' + (key === 'all' ? ' active' : ''), label);
      button.onclick = () => { this.filter = key; for (const other of filters.children) other.classList.toggle('active', other === button); this.applyFilter(); };
      filters.append(button);
    }
    const pauseAll = node('button', 'button small', '全部暂停');
    pauseAll.onclick = () => {
      const playing = pauseAll.dataset.paused === 'true'; pauseAll.dataset.paused = String(!playing); pauseAll.textContent = playing ? '全部暂停' : '全部播放';
      activity.groups.forEach((_, i) => { this.state(i).playing = playing; this.send(i); });
      for (const card of this.cards) card.sync?.();
    };
    filters.append(pauseAll); toolbar.append(search, filters);
    this.grid = node('div', 'gallery-grid');
    activity.groups.forEach((group, index) => this.grid.append(this.card(group, index)));
    const note = node('p', 'gallery-note', '动画按骨骼版本渲染；仅加载当前可见的卡片。点击详情可放大查看、切换动作与皮肤，或打开 Spine 工程。');
    this.container.replaceChildren(heading, toolbar, this.grid, note);
    if (!activity.groups.length) this.grid.append(node('div', 'empty-state', '没有识别到 Spine 资源，可打开浏览器并进入活动场景后重试。'));
    for (const card of this.cards) this.observer.observe(card.element);
  }
  card(group, index) {
    const element = node('article', 'asset-card'); element.dataset.index = index;
    const header = node('div', 'asset-header'); const name = node('span', 'asset-name', group.name); name.title = group.name;
    header.append(name, node('span', 'badge' + (group.status === 'complete' ? '' : ' amber'), group.spine_project?.status === 'success' ? '.spine' : group.status === 'complete' ? '齐全' : '待补齐'));
    const preview = node('div', 'asset-preview');
    const placeholder = node('div', 'placeholder');
    if (group.thumbnail) { const image = node('img'); image.src = group.thumbnail; image.loading = 'lazy'; image.alt = group.name + ' 图集'; placeholder.append(image); }
    placeholder.append(node('span', '', group.status === 'complete' ? '进入视野后加载动画' : '资源尚未配齐')); preview.append(placeholder);
    const controls = this.controls(index, false);
    element.append(header, preview, controls.element);
    this.cards[index] = {element, preview, placeholder, sync: controls.sync};
    return element;
  }
  controls(index, detail) {
    const group = this.activity.groups[index], state = this.state(index);
    const element = node('div', 'asset-controls');
    const selectors = node('div', 'control-selects');
    const makeSelect = (label, values, field, empty) => {
      const select = node('select'); select.setAttribute('aria-label', `${group.name} ${label}`); select.title = label;
      for (const value of values.length ? values : ['']) { const option = node('option', '', value || empty); option.value = value; select.append(option); }
      select.value = state[field]; select.onchange = () => { state[field] = select.value; if (field === 'animation') state.userAnimation = true; this.send(index, field === 'animation'); };
      return select;
    };
    const animation = makeSelect('动作', group.animations || [], 'animation', '静态姿态');
    const skin = makeSelect('皮肤', group.skins || [], 'skin', '默认皮肤');
    selectors.append(animation, skin);
    const buttons = node('div', 'control-buttons');
    const play = node('button'); play.title = '播放 / 暂停';
    const loop = node('button', '', '循环'); loop.title = '循环播放';
    const restart = node('button', '', '↺'); restart.title = '重新播放'; restart.setAttribute('aria-label', group.name + ' 重新播放');
    const sync = () => { play.textContent = state.playing ? 'Ⅱ 暂停' : '▶ 播放'; loop.classList.toggle('active', state.loop); loop.setAttribute('aria-pressed', String(state.loop)); animation.value = state.animation; skin.value = state.skin; };
    play.onclick = () => { state.playing = !state.playing; this.send(index); sync(); };
    loop.onclick = () => { state.loop = !state.loop; this.send(index); sync(); };
    restart.onclick = () => { state.playing = true; this.send(index, true); sync(); };
    buttons.append(play, loop, restart);
    if (!detail) {
      const open = node('button', 'detail-button', '详情 ↗'); open.onclick = () => this.openDetail(index); buttons.append(open);
    }
    element.append(selectors, buttons);
    if (detail) {
      const label = node('label', '', '播放速度'); const speed = node('select'); speed.setAttribute('aria-label', '播放速度');
      for (const value of [0.25, 0.5, 1, 1.5, 2]) { const option = node('option', '', value + ' ×'); option.value = value; speed.append(option); }
      speed.value = state.speed; speed.onchange = () => { state.speed = Number(speed.value); this.send(index); }; element.append(label, speed);
    }
    sync(); return {element, sync};
  }
  applyFilter() {
    this.activity.groups.forEach((group, index) => {
      const matches = !this.query || `${group.name} ${group.version} ${(group.animations || []).join(' ')}`.toLowerCase().includes(this.query);
      const category = this.filter === 'all' || group.status === this.filter || this.filter === 'project' && group.spine_project?.status === 'success';
      this.cards[index].element.hidden = !(matches && category);
      if (this.cards[index].element.hidden) { this.visible.delete(index); this.unmount(index); }
    });
    this.reconcile();
  }
  reconcile() {
    if (this.destroyed) return;
    const available = [...this.visible].filter(i => !this.cards[i].element.hidden && this.activity.groups[i].status === 'complete');
    const visibility = index => {
      const box = this.cards[index].preview.getBoundingClientRect();
      return {fraction: Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0)) / box.height,
        distance: Math.abs((box.top + box.bottom) / 2 - innerHeight / 2)};
    };
    const priorities = new Map(available.map(i => [i, visibility(i)]));
    available.sort((a, b) => priorities.get(b).fraction - priorities.get(a).fraction || priorities.get(a).distance - priorities.get(b).distance || a - b);
    const allowed = new Set(available.slice(0, this.limit));
    for (const index of this.live.keys()) if (!allowed.has(index) || index === this.detailIndex) this.unmount(index);
    for (const index of allowed) if (!this.live.has(index) && index !== this.detailIndex) this.mount(index);
  }
  iframe(index) {
    const iframe = node('iframe'); iframe.title = this.activity.groups[index].name + ' 动画预览';
    iframe.src = this.activity.groups[index].preview_url; iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.onload = () => this.send(index); return iframe;
  }
  mount(index) {
    const card = this.cards[index]; if (!card || card.error) return;
    delete card.element.dataset.preview;
    const iframe = this.iframe(index); this.live.set(index, iframe); card.preview.append(iframe);
  }
  unmount(index) {
    const iframe = this.live.get(index); if (!iframe) return;
    iframe.contentWindow?.postMessage({source: 'spine-gallery', type: 'dispose'}, location.origin); iframe.remove(); this.live.delete(index);
    this.cards[index].placeholder.hidden = false;
    delete this.cards[index].element.dataset.preview;
  }
  send(index, restart = false) {
    const state = {...this.state(index), restart};
    for (const iframe of [this.live.get(index), index === this.detailIndex ? this.detailFrame : null]) {
      iframe?.contentWindow?.postMessage({source: 'spine-gallery', type: 'state', state}, location.origin);
    }
  }
  receive(event) {
    if (event.origin !== location.origin || event.data?.source !== 'spine-preview') return;
    let index = [...this.live].find(([, frame]) => frame.contentWindow === event.source)?.[0];
    const isDetail = this.detailFrame?.contentWindow === event.source;
    if (isDetail) index = this.detailIndex;
    if (index === undefined) return;
    if (event.data.type === 'ready') {
      this.cards[index].element.dataset.preview = 'ready';
      if (!isDetail) this.cards[index].placeholder.hidden = true;
      const group = this.activity.groups[index];
      if (!this.state(index).userAnimation && event.data.defaultAnimation) this.state(index).animation = event.data.defaultAnimation;
      if (!group.animations?.length && event.data.animations?.length) {
        group.animations = event.data.animations; group.skins = event.data.skins;
        this.state(index).animation ||= initialAnimation(group); this.state(index).skin ||= group.skins[0] || '';
        const controls = this.controls(index, false); this.cards[index].element.lastElementChild.replaceWith(controls.element); this.cards[index].sync = controls.sync;
        if (isDetail) {
          const controls = this.controls(index, true); this.dialog.querySelector('.asset-controls').replaceWith(controls.element); this.detailSync = controls.sync;
        }
      }
      this.cards[index].sync(); if (isDetail) this.detailSync?.();
      this.send(index);
    }
    if (event.data.type === 'error') {
      this.cards[index].element.dataset.preview = 'error';
      const target = isDetail ? this.detailFrame.parentElement : this.cards[index].preview;
      target.querySelector('.preview-error')?.remove(); target.append(node('div', 'preview-error', event.data.message));
      if (!isDetail) { this.cards[index].error = event.data.message; this.unmount(index); this.cards[index].element.dataset.preview = 'error'; }
    }
  }
  openDetail(index) {
    if (this.dialog) { this.closeDetail(); this.dialog.remove(); }
    const group = this.activity.groups[index]; this.detailIndex = index; this.unmount(index);
    const dialog = node('dialog', 'detail-modal'); this.dialog = dialog;
    const top = node('div', 'detail-top'); const close = node('button', '', '×'); close.setAttribute('aria-label', '关闭详情'); close.onclick = () => dialog.close();
    top.append(node('h2', '', group.name), close);
    const body = node('div', 'detail-body'); const preview = node('div', 'detail-preview');
    this.detailFrame = this.iframe(index); preview.append(this.detailFrame);
    const side = node('aside', 'detail-side'); side.append(node('span', 'badge', 'Spine ' + (group.version || '未知')));
    side.append(node('p', 'detail-meta', `${group.textures?.length || 0} 张图集贴图 · ${group.region_images || 0} 张素材切片`));
    const controls = this.controls(index, true); this.detailSync = controls.sync; side.append(controls.element);
    if (group.spine_project?.status === 'success') {
      const open = node('button', 'button primary', '在 Spine 中打开工程 ↗'); open.onclick = () => this.action('open-project', {group: index}); side.append(open);
    } else {
      const convert = node('button', 'button primary', '生成 .spine 工程'); convert.onclick = () => this.convert([index]); side.append(convert);
      side.append(node('p', 'field-note', '可选功能，需要配置已激活的正版 Spine CLI。'));
    }
    const files = node('div', 'detail-files'); files.append(node('h4', '', '项目文件'));
    for (const file of group.file_links || []) { const link = node('a', '', file.name + ' ↗'); link.href = file.url; link.target = '_blank'; link.rel = 'noopener'; if (file.name.endsWith('.spine')) link.download = file.name; files.append(link); }
    side.append(files);
    side.append(node('p', 'detail-meta', group.pairing_reason || ''));
    for (const message of [...(group.warnings || []), ...(group.spine_project?.error ? [group.spine_project.error] : [])]) side.append(node('div', 'detail-warning', message));
    body.append(preview, side); dialog.append(top, body); document.body.append(dialog);
    dialog.addEventListener('close', () => this.closeDetail());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.showModal();
  }
  closeDetail() {
    if (this.detailFrame) { this.detailFrame.contentWindow?.postMessage({source: 'spine-gallery', type: 'dispose'}, location.origin); this.detailFrame.remove(); }
    if (this.detailIndex !== undefined) this.cards[this.detailIndex]?.sync();
    this.detailFrame = null; this.detailIndex = undefined; this.reconcile();
  }
  async action(name, payload = {}) {
    try { await api(`/api/activities/${this.activity.id}/${name}`, payload); } catch (error) { toast(error.message); }
  }
  async convert(groups) {
    try {
      const job = await api(`/api/activities/${this.activity.id}/convert`, groups ? {groups} : {});
      window.dispatchEvent(new CustomEvent('spine-job', {detail: job})); toast('正在生成工程，可继续浏览素材');
      const final = await watchJob(job.id, () => {});
      if (final.status === 'failed') throw new Error(final.error);
      toast(final.status === 'cancelled' ? '转换已停止' : `转换结束：${final.result.converted} 个成功，${final.result.failed} 个失败`);
      if (!this.destroyed) {
        const detail = await api('/api/activities/' + this.activity.id);
        this.reload(detail);
      }
      window.dispatchEvent(new Event('spine-library-updated'));
    } catch (error) { toast(error.message); }
  }
}
