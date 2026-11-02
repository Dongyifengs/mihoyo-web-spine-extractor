const bundles = new Map();

export function remoteUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('资源必须使用公开的 HTTPS 地址');
  return url.href;
}

export async function fetchResource(url, kind = 'text') {
  const response = await fetch(remoteUrl(url), { signal: AbortSignal.timeout(25000), credentials: 'omit' });
  if (!response.ok) throw new Error(`官方资源读取失败（HTTP ${response.status}）`);
  return kind === 'binary' ? response.arrayBuffer() : response.text();
}

export async function readSource(source, items) {
  if (!source.format?.startsWith('embedded-')) {
    const data = await fetchResource(source.url, source.format === 'skel' ? 'binary' : 'text');
    return source.format === 'json' ? JSON.parse(data) : data;
  }
  if (!bundles.has(source.url)) {
    const keys = [...new Set(items.flatMap((item) => [item.skeleton, item.atlas, ...item.textures])
      .filter((ref) => ref.url === source.url && ref.key).map((ref) => ref.key))];
    const promise = Promise.all([fetchResource(source.url), import('./source-decoder.js')])
      .then(([text, { decodeBundle }]) => decodeBundle(text, keys));
    bundles.set(source.url, promise);
    promise.catch(() => bundles.delete(source.url));
  }
  const values = await bundles.get(source.url);
  if (!values.has(source.key)) throw new Error('资源定位键与索引不匹配');
  return values.get(source.key);
}

// No activity file is written to disk. Atlas names map explicitly to official URLs.
export async function prepareAssets(item, items) {
  const [skeleton, atlas, textures] = await Promise.all([
    readSource(item.skeleton, items),
    readSource(item.atlas, items),
    Promise.all(item.textures.map(async (texture) => [texture.page, texture.format === 'embedded-image'
      ? await readSource(texture, items) : remoteUrl(texture.url)])),
  ]);
  return { atlas, textures: new Map(textures), source: skeleton };
}

export function loadImage(url, signal) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    const finish = (error) => {
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      image.onload = image.onerror = null;
      if (error) { image.removeAttribute('src'); reject(error); } else resolve(image);
    };
    const cancel = () => finish(new DOMException('预览已关闭', 'AbortError'));
    const timer = setTimeout(() => finish(new Error('官方贴图加载超时，请重试')), 25000);
    image.onload = () => finish();
    image.onerror = () => finish(new Error('官方贴图加载失败，请检查在线链接与跨域访问'));
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) cancel(); else image.src = url;
  });
}
