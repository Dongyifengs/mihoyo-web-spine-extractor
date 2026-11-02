import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Run after npm run build and deployment: node scripts/verify-deployment.mjs https://example.com/
const target = process.argv[2];
if (!target) throw new Error('请提供已部署网站的根地址');
const base = new URL(target.endsWith('/') ? target : `${target}/`);
if (base.protocol !== 'https:') throw new Error('部署地址必须使用 HTTPS');

const projects = await readdir('dist/projects', { withFileTypes: true });
const assets = await readdir('dist/assets');
const files = [
  'index.html',
  ...projects.filter((entry) => entry.isDirectory()).map((entry) => `projects/${entry.name}/index.html`),
  ...assets.map((name) => `assets/${name}`),
];
const hash = (data) => createHash('sha256').update(data).digest('hex');
const failures = [];
for (const path of files) {
  try {
    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(12000) });
        break;
      } catch (error) {
        if (attempt === 2) throw error;
      }
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const [local, deployed] = await Promise.all([readFile(join('dist', path)), response.arrayBuffer()]);
    if (hash(local) !== hash(Buffer.from(deployed))) throw new Error('内容与本次构建不一致');
  } catch (error) {
    failures.push(`${path}: ${error.message}`);
  }
}
if (failures.length) {
  console.error(`部署检查失败：\n${failures.sort().join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`部署检查通过：${files.length} 个入口和构建资源与本地构建一致。`);
}
