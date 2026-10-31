/* Each iframe isolates its runtime version. The gallery bounds the number of live contexts. */
(() => {
  const runtimes = {'3.8': '3.8', '4.0': '4.0.31', '4.1': '4.1.56', '4.2': '4.2.120'};
  let player, group, loaded = false, pendingState;
  const notify = (type, data = {}) => parent.postMessage({source: 'spine-preview', type, ...data}, location.origin);
  const fail = error => { document.getElementById('loading')?.remove(); notify('error', {message: String(error?.message || error)}); };
  function apply(state) {
    if (!loaded) { pendingState = state; return; }
    try {
      const previous = player.animationState?.getCurrent(0);
      if (state.animation && (state.restart || previous?.animation?.name !== state.animation)) {
        if (typeof player.setAnimation === 'function') player.setAnimation(state.animation, state.loop !== false);
        else player.animationState.setAnimation(0, state.animation, state.loop !== false);
      } else if (previous) previous.loop = state.loop !== false;
      if (state.skin && player.skeleton?.skin?.name !== state.skin) {
        player.skeleton.setSkinByName(state.skin);
        player.skeleton.setSlotsToSetupPose();
        player.animationState?.apply(player.skeleton);
      }
      player.speed = state.speed || 1;
      if (state.playing === false) player.pause(); else player.play();
    } catch (error) { fail(error); }
  }
  function dispose() {
    try {
      const gl = player?.context?.gl || player?.sceneRenderer?.context?.gl;
      player?.dispose?.();
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch (_) { /* An already-lost context has nothing left to release. */ }
    loaded = false;
  }
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== parent || event.data?.source !== 'spine-gallery') return;
    if (event.data.type === 'state') apply(event.data.state);
    if (event.data.type === 'dispose') dispose();
  });
  window.addEventListener('pagehide', dispose);
  async function start() {
    const parameters = new URLSearchParams(location.search);
    const response = await fetch('/api/activities/' + encodeURIComponent(parameters.get('activity')) + '/preview/' + Number(parameters.get('group')));
    if (!response.ok) throw new Error('找不到活动素材');
    group = await response.json();
    if (!group || group.status !== 'complete') throw new Error('素材未配齐，请先补齐骨骼、图集和贴图');
    const minor = /^(\d+\.\d+)/.exec(group.version || '')?.[1];
    if (!runtimes[minor]) throw new Error('暂不支持 Spine ' + (group.version || '未知') + ' 的网页预览，可生成工程后使用编辑器打开');
    await new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = '/static/vendor/spine-player-' + runtimes[minor] + '.js';
      script.onload = resolve; script.onerror = () => reject(new Error('运行时加载失败')); document.head.append(script);
    });
    const animations = group.animations || [];
    const animation = animations.find(name => /idle|loop|stand/i.test(name)) || animations[0];
    const config = {
      atlasUrl: group.atlas_url, showControls: false, alpha: true, backgroundColor: '#00000000',
      premultipliedAlpha: group.premultiplied_alpha === true, animation,
      viewport: {padLeft: '12%', padRight: '12%', padTop: '12%', padBottom: '12%', transitionTime: 0},
      preserveDrawingBuffer: true, showLoading: false,
      success: instance => {
        player = instance; loaded = true;
        document.getElementById('loading').remove();
        const data = player.skeleton.data;
        const animated = data.animations.filter(a => a.duration > 0).map(a => a.name);
        const defaultAnimation = animated.find(name => /idle|loop|stand/i.test(name)) || animated[0] || data.animations[0]?.name;
        notify('ready', {animations: data.animations.map(a => a.name), skins: data.skins.map(s => s.name), defaultAnimation});
        if (pendingState) apply(pendingState); else player.play();
      },
      error: (_instance, message) => fail(message),
    };
    if (group.initial_skin) config.skin = group.initial_skin;
    const bounds = group.bounds;
    if (bounds && Number.isFinite(bounds.width) && Number.isFinite(bounds.height) && bounds.width > 0 && bounds.height > 0) {
      // Exported setup bounds remain valid for invisible/reset animations and empty default skins.
      Object.assign(config.viewport, {x: bounds.x ?? -bounds.width / 2, y: bounds.y ?? -bounds.height / 2, width: bounds.width, height: bounds.height});
    }
    if (group.skeleton_url.endsWith('.json')) config.jsonUrl = group.skeleton_url;
    else config.binaryUrl = group.skeleton_url;
    player = new spine.SpinePlayer('player', config);
  }
  start().catch(fail);
})();
