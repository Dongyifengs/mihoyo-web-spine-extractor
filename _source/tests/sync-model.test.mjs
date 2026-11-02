import test from 'node:test';
import assert from 'node:assert/strict';
import { syncStatus, isSyncError, syncCommand, officialArticleUrl } from '../src/sync-model.js';

test('普通同步结果不计入异常，兼容旧记录', () => {
  for (const status of ['no-link', 'empty', 'unchanged', 'complete', 'queued']) assert.equal(isSyncError({ status }), false);
  const legacy = { status: 'needs-adapter', message: '文章内没有官方活动超链接' };
  assert.equal(syncStatus(legacy), 'no-link');
  assert.equal(isSyncError(legacy), false);
  assert.equal(isSyncError({ status: 'needs-adapter', message: '图集匹配待适配' }), true);
  assert.equal(isSyncError({ status: 'unavailable' }), true);
});

test('原文链接只由有效的文章编号生成', () => {
  assert.equal(officialArticleUrl({ key: 'genshin.web_cn-117708' }), 'https://ys.mihoyo.com/main/news/detail/117708');
  assert.equal(officialArticleUrl({ key: 'invalid', articleUrl: 'javascript:alert(1)' }), null);
});

test('强制开关产生可运行的覆盖命令', () => {
  assert.equal(syncCommand(false), 'python scripts/sync-news.py');
  assert.equal(syncCommand(true), 'python scripts/sync-news.py --force');
});
