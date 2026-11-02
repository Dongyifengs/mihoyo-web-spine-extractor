import { readFile } from 'node:fs/promises';
import { readSource } from '../src/resources.js';

// Live data/parser check. GPU rendering and browser CORS are verified separately.
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const catalog = await json('catalog.json');
const selected = new Set(process.argv.slice(2));
const runtimes = new Map();
const failures = [];
let count = 0;
for (const project of catalog.projects.filter(p => !selected.size || selected.has(p.id))) {
  const {items} = await json(`projects/${project.id}/spine/index.json`);
  let passed = 0;
  for (const item of items) {
    try {
      const version = item.version.match(/^\d+\.\d+/)?.[0];
      if (!runtimes.has(version)) {
        const files = {'3.8': '3.8', '4.0': '4.0.31', '4.1': '4.1.56'};
        runtimes.set(version, version === '4.2' ? await import('@esotericsoftware/spine-webgl')
          : (await import(`../public/runtimes/spine-${files[version]}.js`)).default);
      }
      const r = runtimes.get(version);
      const [source, text] = await Promise.all([readSource(item.skeleton, items), readSource(item.atlas, items)]);
      const texture = {setFilters() {}, setWraps() {}, getImage: () => ({width: 1, height: 1})};
      const atlas = version === '3.8' ? new r.TextureAtlas(text, () => texture) : new r.TextureAtlas(text);
      if (version !== '3.8') for (const page of atlas.pages) page.setTexture(texture);
      const reader = new r[item.skeleton.format === 'skel' ? 'SkeletonBinary' : 'SkeletonJson'](new r.AtlasAttachmentLoader(atlas));
      const data = reader.readSkeletonData(source instanceof ArrayBuffer ? new Uint8Array(source) : source);
      const skeleton = new r.Skeleton(data);
      const state = new r.AnimationState(new r.AnimationStateData(data));
      for (const skin of data.skins) {
        skeleton.setSkin(skin); skeleton.setToSetupPose();
        for (const animation of data.animations) {
          state.setAnimation(0, animation.name, true);
          state.update(Math.min(animation.duration / 2, 1)); state.apply(skeleton);
          if (r.Physics) skeleton.updateWorldTransform(r.Physics.update); else skeleton.updateWorldTransform();
        }
      }
      passed++; count++;
    } catch (error) { failures.push(`${project.id}/${item.id}: ${error.message}`); }
  }
  console.log(`${project.id}: ${passed}/${items.length} 骨骼、皮肤、动作解析通过`);
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`实际在线资源验证通过：${count} 组 Spine。`);
