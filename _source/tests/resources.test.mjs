import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeBundle, atlasPages } from '../src/source-decoder.js';
import { remoteUrl, loadImage } from '../src/resources.js';
import { validateItems, validateCatalog, validateComposition } from '../scripts/validate-catalog.mjs';
import { summarizeResources, formatBytes, formatMeasured } from '../src/project-info.js';
import { missingResources, matchesResourceFilter } from '../src/filters.js';

test('extracts embedded data without executing bundle code', () => {
  globalThis.bundleExecuted = false;
  const script = 'globalThis.bundleExecuted=true;const data={"hero.json":{skeleton:{spine:"4.2.43",x:-1},bones:[],enabled:!0},"hero.atlas":"hero.png\\nsize:10,10\\n", "other.json": JSON.parse("{\\"bones\\":[]}")};';
  const values = decodeBundle(script, ['hero.json', 'hero.atlas', 'other.json']);
  assert.equal(globalThis.bundleExecuted, false);
  assert.equal(values.get('hero.json').skeleton.x, -1);
  assert.equal(values.get('hero.json').enabled, true);
  assert.deepEqual(values.get('other.json'), { bones: [] });
  assert.deepEqual(atlasPages(values.get('hero.atlas')), ['hero.png']);
  delete globalThis.bundleExecuted;
});

test('rejects executable expressions, missing and ambiguous keys', () => {
  assert.throws(() => decodeBundle('const data={"x.json":fetch("/execute")}', ['x.json']), /动态表达式/);
  assert.throws(() => decodeBundle('const data={}', ['missing']), /未找到/);
  assert.throws(() => decodeBundle('const a={"x":1},b={"x":2}', ['x']), /不唯一/);
  assert.throws(() => decodeBundle('const data={"x":{get y(){return 1}}}', ['x']), /动态属性/);
});

test('preserves prototype-like data keys without prototype pollution', () => {
  const value = decodeBundle('const x={"data":{"__proto__":{polluted:true}}}', ['data']).get('data');
  assert.equal(Object.getPrototypeOf(value), null);
  assert.equal({}.polluted, undefined);
  assert.equal(value.__proto__.polluted, true);
});

test('supports multiple atlas pages and safe HTTPS links', () => {
  assert.deepEqual(atlasPages('\nfirst.png\r\nsize:1,1\r\n\r\nsub/second.png\nsize:2,2\n'), ['first.png', 'sub/second.png']);
  assert.equal(remoteUrl('https://act.mihoyo.com/a.png?v=1'), 'https://act.mihoyo.com/a.png?v=1');
  for (const url of ['./local.png', 'file:///x', 'http://example.com/a', 'javascript:alert(1)', 'https://user:pass@example.com/a']) assert.throws(() => remoteUrl(url));
});

test('validates direct SKEL sources and rejects duplicate atlas pages', () => {
  const item = { id: 'test', version: '4.2.43', animations: [], skins: [], skeleton: { url: 'https://example.com/a.skel', format: 'skel' }, atlas: { url: 'https://example.com/a.atlas', format: 'atlas' }, textures: [{ page: 'a.png', url: 'https://example.com/a.png' }] };
  validateItems([item]);
  item.textures.push({ ...item.textures[0] });
  assert.throws(() => validateItems([item]), /重复/);
});

test('all checked-in project indexes satisfy the online-only contract', validateCatalog);

test('resource sizes deduplicate identical references and report unknown values', () => {
  const item = { version: '4.2.43', skeleton: { url: 'https://example.com/a.js', key: 'a.json', sizeBytes: 10 }, atlas: { url: 'https://example.com/a.js', key: 'a.atlas', sizeBytes: 20 }, textures: [{ url: 'https://example.com/a.png', sizeBytes: 2048 }] };
  const stats = summarizeResources([item, item, { ...item, version: '4.2.42', textures: [{ url: 'https://example.com/b.png' }] }]);
  assert.deepEqual(stats.total, { count: 4, bytes: 2078, unknown: 1 });
  assert.deepEqual(stats.versions, ['4.2.42', '4.2.43']);
  assert.equal(formatBytes(1048576), '1.00 MB');
  assert.match(formatMeasured(stats.total), /至少.*1 项未知/);
});

test('resource filters distinguish versions, extra, errors, missing files and variants', () => {
  const item = { id: 'x', status: 'partial', version: '', animations: ['a', 'b'], skins: ['default', 'a'], skeleton: null, atlas: null, textures: [] };
  validateItems([item]);
  assert.deepEqual(missingResources(item), ['skeleton', 'atlas', 'texture']);
  assert.deepEqual(summarizeResources([item]).total, { count: 3, bytes: 0, unknown: 3 });
  const group = { ...item, version: '4.2.43', has_extra: true, sourceItem: item };
  const card = { element: { dataset: { preview: 'error' } } };
  for (const key of ['version:4.2.43', 'extra', 'error', 'missing:skeleton', 'missing:atlas', 'missing:texture', 'multi-animation', 'multi-skin']) assert.equal(matchesResourceFilter(group, card, key), true, key);
  assert.equal(matchesResourceFilter(group, card, 'version:4.2.42'), false);
});

test('composition references existing groups and finite projection matrices', () => {
  const composition = { width: 1280, height: 720, scenes: [{ layers: [{ kind: 'spine', spine_id: 'hero', matrix: Array(16).fill(1) }] }] };
  validateComposition(composition, [{ id: 'hero' }]);
  assert.throws(() => validateComposition(composition, [{ id: 'other' }]), /必须匹配/);
  composition.scenes[0].layers[0].matrix[4] = Infinity;
  assert.throws(() => validateComposition(composition, [{ id: 'hero' }]), /场景矩阵无效/);
  composition.scenes[0].layers = [{ kind: 'image', image_url: 'captures/layer-1.webp' }];
  validateComposition(composition, [{ id: 'hero' }]);
  composition.scenes[0].layers[0].image_url = '../outside.webp';
  assert.throws(() => validateComposition(composition, [{ id: 'hero' }]), /场景截图路径无效/);
});

test('failed or cancelled image loads settle and detach browser handlers', async () => {
  const original = globalThis.Image;
  const created = [];
  globalThis.Image = class {
    constructor() { created.push(this); }
    removeAttribute(name) { delete this[name]; }
  };
  try {
    const controller = new AbortController();
    const failed = loadImage('https://example.com/missing.png', controller.signal);
    created[0].onerror();
    await assert.rejects(failed, /贴图加载失败/);
    assert.equal(created[0].onload, null);
    assert.equal(created[0].src, undefined);
    const cancelled = loadImage('https://example.com/pending.png', controller.signal);
    controller.abort();
    await assert.rejects(cancelled, { name: 'AbortError' });
    assert.equal(created[1].onerror, null);
    const alreadyCancelled = loadImage('https://example.com/pending.png', controller.signal);
    await assert.rejects(alreadyCancelled, { name: 'AbortError' });
  } finally {
    if (original) globalThis.Image = original; else delete globalThis.Image;
  }
});
