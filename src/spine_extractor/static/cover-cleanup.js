() => {
  // Only this isolated screenshot page is changed. Keep scene canvases and artwork.
  const hidden = [], canvasLayers = [], roots = [document], all = [];
  for (let i = 0; i < roots.length; i++) {
    for (const element of roots[i].querySelectorAll('*')) {
      all.push(element);
      if (element.shadowRoot) roots.push(element.shadowRoot);
    }
  }
  const area = Math.max(1, innerWidth * innerHeight);
  const scene = element => [...element.querySelectorAll('canvas,video')].some(canvas => {
    const box = canvas.getBoundingClientRect(); return box.width * box.height > area * 0.35;
  });
  const uiName = /(?:^|[\s_./-])(?:login|signin|share|enter|start|play-btn|start-btn|enter-btn|reward|gift|rule|music|audio|bgm|mute|qrcode|qr-code|topnav|top-nav|toolbar|nav-bar|popup|modal|dialog|cookie)(?:[\s_./-]|$)/i;
  const uiText = /^(?:点击|立即|前往)?(?:进入(?:网页|活动|游戏)?|开始(?:活动|游戏|体验)?|参与活动|登录|登出|退出登录|分享(?:活动)?|更多奖励|活动规则|领取奖励|登录领取|扫码参与|进入官网|返回官网|Enter|Start|Log ?in|Sign ?in|Share)(?:[\s>»→!！]*)$/i;
  for (const element of all) {
    if (['HTML', 'BODY', 'CANVAS', 'VIDEO', 'SCRIPT', 'STYLE', 'LINK'].includes(element.tagName)) continue;
    const box = element.getBoundingClientRect(), style = getComputedStyle(element);
    if (!box.width || !box.height || style.display === 'none' || style.visibility === 'hidden') continue;
    if (scene(element)) continue;
    const attributes = ['id', 'class', 'aria-label', 'title', 'alt', 'src'].map(key => element.getAttribute(key) || '').join(' ');
    const text = (element.innerText || '').trim();
    const control = element.matches('button, [role=button], .me-hover-btn, .m-audio-player, [role=dialog], [aria-modal=true]');
    const named = uiName.test(attributes) || (text.length < 40 && uiText.test(text));
    // Image-only event buttons often have hashed names and no accessible label.
    const clickable = style.cursor === 'pointer' && box.width * box.height < area * 0.45
      && !element.matches('a[href]') && !/logo|slogan/i.test(attributes);
    if (!control && !named && !clickable) continue;
    hidden.push([element, element.getAttribute('style')]);
    element.style.setProperty('visibility', 'hidden', 'important');
    element.style.setProperty('opacity', '0', 'important');
    element.style.setProperty('pointer-events', 'none', 'important');
  }
  // miHoYo's Vue/Three event renderer can draw a button plate in the same canvas
  // as the artwork. Hide named UI objects, never the canvas or an entire scene.
  const sceneRoots = new Set(), visited = new Set();
  for (const element of all) {
    const vm = element.__vue__;
    if (!vm) continue;
    const scenes = vm.player?.scenes;
    if (scenes && typeof scenes === 'object') {
      for (const value of scenes instanceof Map ? scenes.values() : Object.values(scenes)) sceneRoots.add(value);
    }
    if (vm.sceneUI) sceneRoots.add(vm.sceneUI);
  }
  const uiObject = /(?:^|[\s_-])(?:btn|button|login|share|start|enter|music|rule|reward|gift)(?:\d|[\s_-]|$)/i;
  const queue = [...sceneRoots];
  while (queue.length && visited.size < 20000) {
    const object = queue.pop();
    if (!object?.isObject3D || visited.has(object)) continue;
    visited.add(object);
    if (!object.isScene && object.visible === true && uiObject.test(object.name || '')) {
      canvasLayers.push([object, object.visible]); object.visible = false;
    } else if (Array.isArray(object.children)) queue.push(...object.children);
  }
  window.__spineCoverRestore = () => {
    for (const [element, style] of hidden) {
      if (style === null) element.removeAttribute('style'); else element.setAttribute('style', style);
    }
    for (const [object, visible] of canvasLayers) object.visible = visible;
    delete window.__spineCoverRestore;
  };
  return hidden.length + canvasLayers.length;
}
