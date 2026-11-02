export function syncStatus(item) {
  if (item.status === 'needs-adapter' && item.message?.includes('文章内没有官方活动超链接')) return 'no-link';
  if (item.status === 'needs-adapter' && item.message?.includes('尚未识别到可验证的 Spine')) return 'empty';
  return item.status;
}
export const isSyncError = item => ['needs-adapter', 'unavailable'].includes(syncStatus(item));
export const syncCommand = force => `python scripts/sync-news.py${force ? ' --force' : ''}`;
export const officialArticleUrl = item => /^genshin\.web_cn-\d+$/.test(item.key)
  ? `https://ys.mihoyo.com/main/news/detail/${item.key.split('-').at(-1)}` : null;
