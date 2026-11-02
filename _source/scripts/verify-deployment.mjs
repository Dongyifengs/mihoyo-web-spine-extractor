import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Run after npm run build and deployment: node scripts/verify-deployment.mjs https://example.com/
const target = process.argv[2];
if (!target) throw new Error('请提供已部署网站的根地址');
const base = new URL(target.endsWith('/') ? target : `${target}/`);
if (base.protocol !== 'https:') throw new Error('部署地址必须使用 HTTPS');

async function listFiles(prefix = '') {
  const result = [];
  for (const entry of await readdir(join('dist', prefix), { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const path = `${prefix}${entry.name}`;
    result.push(...(entry.isDirectory() ? await listFiles(`${path}/`) : [path]));
  }
  return result;
}
const files = await listFiles();
const hash = (data) => createHash('sha256').update(data).digest('hex');
const failures = [];
async function check(path) {
  try {
    const local = await readFile(join('dist', path));
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(12000), headers: {'Cache-Control': 'no-cache'} });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (hash(local) !== hash(Buffer.from(await response.arrayBuffer()))) throw new Error('内容与本次构建不一致');
        return;
      } catch (error) {
        if (attempt === 2) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  } catch (error) {
    failures.push(`${path}: ${error.message}`);
  }
}
let next = 0;
await Promise.all(Array.from({length: 4}, async () => {
  while (next < files.length) await check(files[next++]);
}));
if (failures.length) {
  console.error(`部署检查失败：\n${failures.sort().join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`部署检查通过：${files.length} 个入口和构建资源与本地构建一致。`);
}
