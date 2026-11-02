export function missingResources(item) {
  const missing = new Set(item.missingFiles || []);
  if (!item.skeleton?.url) missing.add('skeleton');
  if (!item.atlas?.url) missing.add('atlas');
  if (!item.textures?.length || item.textures.some((texture) => !texture?.url)) missing.add('texture');
  return [...missing];
}

export function matchesResourceFilter(group, card, filter) {
  if (filter === 'all') return true;
  if (filter === 'extra') return !!group.has_extra;
  if (filter === 'error') return card.element.dataset.preview === 'error' || !!card.warning || group.status === 'error';
  if (filter === 'multi-animation') return (group.animations?.length || 0) > 1;
  if (filter === 'multi-skin') return (group.skins?.length || 0) > 1;
  if (filter.startsWith('version:')) return group.version === filter.slice(8);
  if (filter.startsWith('missing:')) return missingResources(group.sourceItem || group).includes(filter.slice(8));
  return false;
}
