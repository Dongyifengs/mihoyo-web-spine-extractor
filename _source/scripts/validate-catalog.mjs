import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { remoteUrl } from '../src/resources.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const idPattern = /^[a-zA-Z0-9_-]+$/;

export function validateSource(ref, formats) {
  assert.ok(ref && typeof ref.url === 'string', '每个资源必须有 url');
  remoteUrl(ref.url);
  assert.ok(formats.includes(ref.format ?? 'image'), `不支持的资源格式：${ref.format}`);
  if (ref.format?.startsWith('embedded-')) assert.ok(typeof ref.key === 'string' && ref.key.length, '内嵌资源必须有定位键');
  if (ref.sizeBytes != null) assert.ok(Number.isSafeInteger(ref.sizeBytes) && ref.sizeBytes >= 0, '资源大小必须是非负整数字节');
}

export function validateItems(items) {
  assert.ok(Array.isArray(items) && items.length, 'Spine 索引必须包含资源');
  const ids = new Set();
  for (const item of items) {
    assert.ok(idPattern.test(item.id) && !ids.has(item.id), `资源 ID 无效或重复：${item.id}`);
    ids.add(item.id);
    const partial = item.status === 'partial';
    assert.ok(item.status === undefined || ['complete', 'partial'].includes(item.status), '资源状态无效');
    assert.ok(partial && !item.version || /^\d+\.\d+\.\d+/.test(item.version), '骨骼版本无效');
    assert.ok(Array.isArray(item.animations) && item.animations.every((v) => typeof v === 'string'));
    assert.ok(Array.isArray(item.skins) && item.skins.every((v) => typeof v === 'string'));
    if (item.initialSkin) assert.ok(item.skins.includes(item.initialSkin), '默认皮肤必须存在');
    if (item.skeleton) validateSource(item.skeleton, ['json', 'skel', 'embedded-json']); else assert.ok(partial, '缺少骨骼的资源必须标为 partial');
    if (item.atlas) validateSource(item.atlas, ['atlas', 'embedded-atlas']); else assert.ok(partial, '缺少 atlas 的资源必须标为 partial');
    assert.ok(Array.isArray(item.textures) && (item.textures.length || partial), '每组资源至少包含一张贴图，缺失时标为 partial');
    const pages = new Set();
    for (const texture of item.textures) {
      if (texture.url) validateSource(texture, ['image', 'embedded-image']); else assert.ok(partial && texture.status === 'missing', '缺失贴图必须标明 missing');
      assert.ok(typeof texture.page === 'string' && !texture.page.startsWith('/')
        && !texture.page.includes('\\') && !texture.page.split('/').includes('..') && !pages.has(texture.page), '图集页面名不合法或重复');
      pages.add(texture.page);
    }
    assert.ok(!('bones' in item) && !('slots' in item), '索引不能存入骨骼内容');
  }
}

export function validateComposition(composition, items) {
  assert.ok(Number.isFinite(composition.width) && composition.width > 0);
  assert.ok(Number.isFinite(composition.height) && composition.height > 0);
  assert.ok(composition.scenes.length, '场景数据不能为空');
  const groupIds = new Set(items.map((item) => item.id));
  const validCapture = (path) => /^captures\/(reference|layer-\d+)\.webp$/.test(path);
  for (const scene of composition.scenes) {
    if (scene.reference_url) assert.ok(validCapture(scene.reference_url), '原画面对照路径无效');
    for (const layer of scene.layers) {
      if (layer.kind === 'image') { assert.ok(validCapture(layer.image_url), '场景截图路径无效'); continue; }
      assert.ok(layer.kind === 'spine' && groupIds.has(layer.spine_id), '场景图层必须匹配已收录的 Spine');
      assert.ok(Array.isArray(layer.matrix) && layer.matrix.length === 16 && layer.matrix.every(Number.isFinite), '场景矩阵无效');
    }
  }
}

export async function validateCatalog() {
  const catalog = await json('catalog.json');
  assert.equal(catalog.schemaVersion, 1);
  const ids = new Set();
  let count = 0;
  for (const ref of catalog.projects) {
    assert.ok(idPattern.test(ref.id) && !ids.has(ref.id), '项目 ID 无效或重复');
    ids.add(ref.id);
    assert.equal(ref.manifest, `projects/${ref.id}/manifest.json`);
    const manifest = await json(ref.manifest);
    assert.equal(manifest.id, ref.id);
    assert.equal(manifest.schemaVersion, 1);
    remoteUrl(manifest.sourceUrl); remoteUrl(manifest.cover.url);
    if (manifest.cover.sizeBytes != null) assert.ok(Number.isSafeInteger(manifest.cover.sizeBytes) && manifest.cover.sizeBytes >= 0, '封面大小无效');
    assert.equal(manifest.spineIndex, 'spine/index.json');
    assert.deepEqual(await json(`projects/${ref.id}/cover.json`), manifest.cover);
    const index = await json(`projects/${ref.id}/spine/index.json`);
    assert.equal(index.projectId, ref.id);
    assert.equal(index.schemaVersion, 1);
    validateItems(index.items);
    assert.equal(manifest.spineCount, index.items.length);
    assert.equal(manifest.textureCount, index.items.reduce((n, item) => n + item.textures.length, 0));
    if (manifest.composition) {
      assert.equal(manifest.composition, 'composition.json');
      const composition = await json(`projects/${ref.id}/${manifest.composition}`);
      validateComposition(composition, index.items);
      for (const scene of composition.scenes) {
        const captures = [scene.reference_url, ...scene.layers.filter((layer) => layer.kind === 'image').map((layer) => layer.image_url)].filter(Boolean);
        for (const capture of captures) {
          const bytes = await readFile(resolve(root, `projects/${ref.id}/${capture}`));
          assert.ok(bytes.length <= 1024 * 1024 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP', '场景截图无效或超过 1 MiB');
        }
      }
    }
    const html = await readFile(resolve(root, `projects/${ref.id}/index.html`), 'utf8');
    assert.ok(html.includes(`data-project="${ref.id}"`));
    assert.ok(html.includes('data-root="../../"'));
    count += index.items.length;
  }
  assert.ok(ids.has(catalog.featuredProject));
  for (const path of await readdir(resolve(root, 'projects'), { recursive: true })) {
    const normalized = path.replaceAll('\\', '/');
    const capturedFrame = /^[a-zA-Z0-9_-]+\/captures\/(?:reference|layer-\d+)\.webp$/.test(normalized);
    assert.ok(capturedFrame || !/\.(?:png|jpe?g|webp|skel|atlas|spine)$/i.test(path), `项目目录不能保存活动资源：${path}`);
    if (path.endsWith('.json')) {
      const content = await readFile(resolve(root, 'projects', path), 'utf8');
      assert.ok(!content.includes('data:image') && !content.includes('base64,'), '资源只能记录在线来源');
    }
  }
  console.log(`目录验证通过：${ids.size} 个项目，${count} 组 Spine；Spine 素材仅存在线索引。`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await validateCatalog();
