import {api, node, toast} from './api.js';

let lastSource = 'genshin.web_cn';
export class NewsPage {
  constructor(container) {
    this.container = container; this.selected = new Set(); this.items = []; this.generation = 0;
    const heading = node('div', 'section-heading'), title = node('div');
    title.append(node('h2', '', '网页活动'), node('p', 'field-note', '来源：HoyoNews · 原神 / 绝区零：网页活动；崩铁：版本专题展示页。'));
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
    this.container.replaceChildren(heading, tools, actions, this.list); this.initialize();
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
  updateCount() { this.count.textContent = `${this.filtered().length} / ${this.items.length} 条活动`; this.add.textContent = `加入提取（${this.selected.size}）`; this.add.disabled = !this.selected.size; }
  draw() {
    this.list.replaceChildren(); const items = this.filtered(); this.updateCount();
    for (const item of items) {
      const row = node('article', 'news-row'), label = node('label', 'news-title'), input = node('input'); input.type = 'checkbox'; input.checked = this.selected.has(item.key);
      input.onchange = () => { if (input.checked) { if (this.selected.size >= 100) { input.checked = false; toast('单次最多选择 100 条'); return; } this.selected.add(item.key); } else this.selected.delete(item.key); this.updateCount(); };
      label.append(input, node('span', '', item.title));
      const meta = node('div', 'news-meta'); const article = node('a', '', '新闻原文 ↗'); article.href = item.article_url; article.target = '_blank'; article.rel = 'noopener';
      meta.append(node('time', '', item.published_at ? new Date(item.published_at).toLocaleDateString('zh-CN') : ''), node('span', 'badge', item.tags[0]), article);
      row.append(label, meta); this.list.append(row);
    }
    if (!items.length) this.list.append(node('p', 'empty-state', this.items.length ? '没有匹配的活动标题' : '该来源暂无符合指定标签的新闻'));
  }
  enqueue() {
    const urls = document.getElementById('urls');
    const combined = [...new Set([...urls.value.split(/\r?\n/).map(url => url.trim()).filter(Boolean), ...this.items.filter(item => this.selected.has(item.key)).map(item => item.input_url)])];
    if (combined.length > 100) { toast('加上输入框中已有的地址超过 100 条，请减少选择或清空输入框'); return; }
    urls.value = combined.join('\n'); location.hash = '#extract'; toast(`已加入 ${this.selected.size} 条网页活动，点击「开始提取」运行`);
  }
  destroy() { this.destroyed = true; this.generation++; this.container.replaceChildren(); }
}
