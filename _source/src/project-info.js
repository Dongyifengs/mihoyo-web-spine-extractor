export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '未知';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

export function summarizeResources(items) {
  const files = new Map();
  for (const item of items) {
    const textures = item.textures?.length ? item.textures : [undefined];
    for (const [type, ref] of [[item.skeleton?.format === 'skel' ? 'skel' : 'json', item.skeleton], ['atlas', item.atlas], ...textures.map((ref) => ['texture', ref])]) {
      const key = ref?.url ? `${type}\n${ref.url}\n${ref.key || ''}` : `missing\n${type}\n${item.id}\n${ref?.page || ''}`;
      if (!files.has(key)) files.set(key, { type, bytes: ref?.sizeBytes });
    }
  }
  const summarize = (type) => {
    const refs = [...files.values()].filter((item) => !type || item.type === type);
    return { count: refs.length, bytes: refs.reduce((n, item) => n + (Number.isFinite(item.bytes) ? item.bytes : 0), 0), unknown: refs.filter((item) => !Number.isFinite(item.bytes)).length };
  };
  return { json: summarize('json'), skel: summarize('skel'), atlas: summarize('atlas'), texture: summarize('texture'), total: summarize(), versions: [...new Set(items.map((item) => item.version).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })) };
}

export function formatMeasured(summary) {
  return `${summary.unknown ? '至少 ' : ''}${formatBytes(summary.bytes)}${summary.unknown ? `（${summary.unknown} 项未知）` : ''}`;
}
