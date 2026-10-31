import {api, node, toast, watchJob} from './api.js';

let lastSource = 'genshin.web_cn';
export class NewsPage {
  constructor(container) {
    this.container = container; this.selected = new Set(); this.items = []; this.generation = 0;
    const heading = node('div', 'section-heading'), title = node('div');
    title.append(node('h2', '', '网页活动'), node('p', 'field-note', '来源：HoyoNews 官方渠道 · 原神 / 绝区零：网页活动；崩铁：版本专题展示页。'));
    const sourceLink = node('a', 'button small', '查看 HoyoNews ↗'); sourceLink.href = 'https://news.hk4e.com'; sourceLink.target = '_blank'; sourceLink.rel = 'noopener';
    heading.append(title, sourceLink);
    const tools = node('div', 'news-tools');
    this.source = node('select'); this.source.setAttribute('aria-label', '新闻来源'); this.source.onchange = () => { lastSource = this.source.value; this.load(); };
    this.search = node('input'); this.search.type = 'search'; this.search.placeholder = '搜索活动标题'; this.search.setAttribute('aria-label', '搜索活动标题'); this.search.oninput = () => this.draw();
    this.refresh = node('button', '', '重新读取'); this.refresh.type = 'button'; this.refresh.onclick = () => this.load();
    this.count = node('span', 'muted'); tools.append(this.source, this.search, this.refresh, this.count);
    const actions = node('div', 'news-actions');
    const select = node('button', '', '选中当前结果'); select.onclick = () => { for (const item of this.filtered()) { if (this.selected.size >= 100) break; this.selected.add(item.key); } this.draw(); };
    const clear = node('button', '', '清空选择'); clear.onclick = () => { this.selected.clear(); this.draw(); };
    this.add = node('button', 'primary', '加入提取'); this.add.onclick = () => this.enqueue();
    actions.append(select, clear, this.add); this.list = node('div', 'news-list');
    this.container.replaceChildren(heading, tools, actions, node('p', 'field-note', '拖动卡片空白处框选；Ctrl / Shift 可追加选择。加入前会读取官方新闻正文中的活动链接。'), this.list); this.bindSelection(); this.initialize();
  }
  async initialize() {
    try {
      const sources = await api('/api/news/sources'); if (this.destroyed) return;
      for (const [key, label] of Object.entries(sources)) { const option = node('option', '', label); option.value = key; this.source.append(option); }
      this.source.value = lastSource; await this.load();
    } catch (error) { if (!this.destroyed) this.list.replaceChildren(node('p', 'detail-warning', error.message)); }
  }
  async load() {
    const generation = ++this.generation; this.refresh.disabled = true; this.selected.clear(); this.items = []; this.draw();
    this.list.replaceChildren(node('p', 'muted', '正在读取网页活动…'));
    try {
      const data = await api('/api/news?source=' + encodeURIComponent(this.source.value));
      if (this.destroyed || generation !== this.generation) return;
      this.items = data.items; this.draw();
    } catch (error) { if (!this.destroyed && generation === this.generation) this.list.replaceChildren(node('p', 'detail-warning', error.message)); }
    finally { if (generation === this.generation) this.refresh.disabled = false; }
  }
  filtered() { const query = this.search.value.trim().toLowerCase(); return this.items.filter(item => item.title.toLowerCase().includes(query)); }
  updateCount() { this.count.textContent = `${this.filtered().length} / ${this.items.length} 条活动`; this.add.textContent = `加入提取（${this.selected.size}）`; this.add.disabled = this.resolving || !this.selected.size; }
  draw() {
    this.list.replaceChildren(); const items = this.filtered(); this.updateCount();
    for (const item of items) {
      const row = node('article', 'news-row'), label = node('label', 'news-title'), input = node('input'); input.type = 'checkbox'; input.checked = this.selected.has(item.key);
      row.dataset.key = item.key; row.classList.toggle('selected', input.checked);
      input.onchange = () => { if (input.checked) { if (this.selected.size >= 100) { input.checked = false; toast('单次最多选择 100 条'); return; } this.selected.add(item.key); } else this.selected.delete(item.key); row.classList.toggle('selected', input.checked); this.updateCount(); };
      label.append(input, node('span', '', item.title));
      const meta = node('div', 'news-meta'); const article = node('a', '', '新闻原文 ↗'); article.href = item.article_url; article.target = '_blank'; article.rel = 'noopener';
      meta.append(node('time', '', item.published_at ? new Date(item.published_at).toLocaleDateString('zh-CN') : ''), node('span', 'badge', item.tags[0]), article);
      row.append(label, meta); this.list.append(row);
    }
    if (!items.length) this.list.append(node('p', 'empty-state', this.items.length ? '没有匹配的活动标题' : '该来源暂无符合指定标签的新闻'));
  }
  bindSelection() {
    let drag;
    this.list.onpointerdown = e => {
      if (e.button !== 0 || e.target.closest('a,input,button')) return;
      drag = {x: e.clientX, y: e.clientY, initial: new Set(e.ctrlKey || e.metaKey || e.shiftKey ? this.selected : [])};
    };
    this.moveSelection = e => {
      if (!drag || Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5) return;
      if (!drag.box) { drag.box=node('div','news-selection-box'); document.body.append(drag.box); }
      const left=Math.min(e.clientX,drag.x), top=Math.min(e.clientY,drag.y), right=Math.max(e.clientX,drag.x), bottom=Math.max(e.clientY,drag.y);
      Object.assign(drag.box.style,{left:left+'px',top:top+'px',width:right-left+'px',height:bottom-top+'px'});
      this.selected=new Set(drag.initial);
      for (const row of this.list.children) {
        if (!row.dataset.key) continue;
        const b=row.getBoundingClientRect();
        if (b.right>left && b.left<right && b.bottom>top && b.top<bottom && this.selected.size<100) this.selected.add(row.dataset.key);
        const checked=this.selected.has(row.dataset.key); row.classList.toggle('selected',checked); row.querySelector('input').checked=checked;
      }
      this.updateCount(); e.preventDefault();
    };
    this.endSelection = () => { if (drag?.box) { drag.box.remove(); this.suppressClick=true; setTimeout(()=>this.suppressClick=false,0); } drag=null; };
    this.list.addEventListener('click',e=>{ if(this.suppressClick){e.preventDefault();e.stopPropagation();} },true);
    window.addEventListener('pointermove',this.moveSelection); window.addEventListener('pointerup',this.endSelection); window.addEventListener('pointercancel',this.endSelection);
  }
  async enqueue() {
    if (this.resolving) return;
    this.resolving = true; this.add.disabled = true; this.source.disabled = true;
    const keys = [...this.selected];
    try {
      const job = await api('/api/news/resolve', {keys});
      const final = await watchJob(job.id, update => { if (!this.destroyed) this.add.textContent = update.logs.at(-1) || '正在读取官方新闻正文…'; });
      if (this.destroyed) return;
      if (final.status !== 'completed') throw new Error(final.error || '解析已停止');
      const result=final.result, urls=document.getElementById('urls');
      const combined=[...new Set([...urls.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean), ...result.urls])];
      if (combined.length>100) throw new Error('超过 100 个活动地址，请减少选择后重试');
      urls.value=combined.join('\n');
      if (result.errors.length) {
        this.list.prepend(node('p','detail-warning',result.errors.map(e=>e.key+'：'+e.error).join('\n')));
        toast(`已加入 ${result.urls.length} 个活动地址，${result.errors.length} 条解析失败；请查看提示后前往提取。`);
      } else { location.hash='#extract'; toast(`已加入 ${result.urls.length} 个活动网页地址`); }
    } catch(error) { if (!this.destroyed) toast(error.message); }
    finally { this.resolving=false; this.source.disabled=false; if(!this.destroyed) this.updateCount(); }
  }
  destroy() { this.endSelection(); window.removeEventListener('pointermove',this.moveSelection); window.removeEventListener('pointerup',this.endSelection); window.removeEventListener('pointercancel',this.endSelection); this.destroyed = true; this.generation++; this.container.replaceChildren(); }
}
