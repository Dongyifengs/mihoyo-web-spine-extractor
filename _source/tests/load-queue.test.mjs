import test from 'node:test';
import assert from 'node:assert/strict';
import { createLoadQueue } from '../src/load-queue.js';

test('批量预览限制并发，任务失败后后续任务仍可执行', async () => {
  const queue = createLoadQueue(2), release = [];
  let active = 0, peak = 0, started = 0;
  const jobs = Array.from({ length: 5 }, (_, id) => queue.add(async () => {
    started++; active++; peak = Math.max(peak, active);
    await new Promise(resolve => release.push(resolve));
    active--;
    if (id === 1) throw new Error('读取失败');
    return id;
  }));
  const results = Promise.allSettled(jobs);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(started, 2);
  while (started < 5 || active) {
    release.splice(0).forEach(resolve => resolve());
    await new Promise(resolve => setImmediate(resolve));
  }
  assert.equal(peak, 2);
  assert.deepEqual((await results).map(r => r.status), ['fulfilled', 'rejected', 'fulfilled', 'fulfilled', 'fulfilled']);
});

test('关闭预览后清空等待队列，不再发起后续请求', async () => {
  const queue = createLoadQueue(1);
  let release, ran = false;
  const active = queue.add(() => new Promise(resolve => { release = resolve; }));
  const pending = queue.add(() => { ran = true; });
  await new Promise(resolve => setImmediate(resolve));
  queue.close();
  assert.equal(await pending, null);
  assert.equal(await queue.add(() => { ran = true; }), null);
  release('done');
  assert.equal(await active, 'done');
  assert.equal(ran, false);
});
