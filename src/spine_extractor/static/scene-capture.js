async () => {
  // Read the event's live Three.js scene graph. No source-specific coordinates.
  const players = new Set();
  for (const element of document.querySelectorAll('*')) {
    const p = element.__vue__?.player;
    if (p?.renderer?.render && p.scenes) players.add(p);
  }
  const result = {width: 1280, height: 720, scenes: [], warnings: []};
  // Mask containers may keep their children outside scene.children and temporarily
  // attach them to a private render pass. Observe one frame to retain those roots.
  const observed = new Map(), restoreRenderers = [];
  for (const player of players) {
    const renderer = player.renderer, original = renderer.render, passes = new Map(), stack = [];
    observed.set(player, passes);
    renderer.render = function (scene, camera, ...args) {
      const roots = [...(scene.children || [])];
      const hasSpine = object => !!object.skeleton?.data || (object.children || []).some(hasSpine);
      if (roots.some(hasSpine)) {
        const key = scene.uuid + ':' + roots.map(root => root.uuid).join(',');
        passes.set(key, {scene, camera, roots, name: [...stack, scene.name].filter(Boolean).join(' / ')});
      }
      stack.push(scene.name);
      try { return original.call(this, scene, camera, ...args); } finally { stack.pop(); }
    };
    restoreRenderers.push(() => { renderer.render = original; });
  }
  try { await new Promise(resolve => setTimeout(resolve, 350)); }
  finally { restoreRenderers.forEach(restore => restore()); }
  const uiName = /(?:^|[_\s-])(btn|button|login|share|reward|gift|music|rule)(?:$|[_\s-])/i;
  const mul = (a, b) => {
    const out = Array(16).fill(0);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
    return out;
  };
  for (const player of players) {
    const renderer = player.renderer, canvas = renderer.domElement;
    const scenes = (player.scenes instanceof Map ? [...player.scenes.entries()] : Object.entries(player.scenes)).map(([name, scene]) => ({name, scene}));
    for (const pass of observed.get(player).values()) {
      if (scenes.some(entry => entry.scene === pass.scene) && pass.roots.every(root => pass.scene.children.includes(root))) continue;
      scenes.push({...pass, name: pass.name || '遮罩场景', privatePass: true});
    }
    for (const entry of scenes) {
      const {name} = entry;
      let scene = entry.scene, restoreRoots = () => {};
      if (entry.privatePass) {
        const parents = entry.roots.map(root => [root, root.parent]);
        scene = scene.clone(false); scene.camera = entry.camera;
        scene.buffer = entry.scene.buffer;
        entry.roots.forEach(root => scene.add(root));
        restoreRoots = () => parents.forEach(([root, parent]) => { scene.remove(root); parent?.add(root); });
      }
      try {
      if (!scene?.isScene || !scene.camera || (!entry.privatePass && /loading|buffer|common|scene_ui/i.test(name)) || result.scenes.length >= 8) continue;
      scene.updateMatrixWorld(true); scene.camera.updateMatrixWorld(true);
      const camera = scene.camera, list = [], all = [];
      const view = camera.matrixWorldInverse.elements, projection = camera.projectionMatrix.elements;
      const vp = mul(projection, view);
      function visit(object, parentVisible = true) {
        const visible = parentVisible && object.visible !== false && !uiName.test(object.name || '');
        const spine = object.skeleton?.data && object.state;
        if (spine || object.isMesh) {
          all.push(object);
          if (visible && object.material?.visible !== false) {
            const opacity = object.material?.uniforms?.opacity?.value ?? object.material?.opacity ?? 1;
            if (opacity > 0.001) {
              const matrix = mul(vp, object.matrixWorld.elements);
              const depth = matrix[14] / matrix[15];
              list.push({object, spine: !!spine, matrix, opacity, depth});
            }
          }
          if (spine) return; // Batches are part of this skeleton, not independent layers.
        }
        for (const child of object.children || []) visit(child, visible);
      }
      visit(scene);
      if (!list.some(row => row.spine)) continue;
      // Three's transparent ordering: explicit renderOrder, then far-to-near depth.
      list.sort((a, b) => (a.object.renderOrder - b.object.renderOrder) || b.depth - a.depth || a.object.id - b.object.id);
      const chunks = [];
      for (const row of list) {
        if (row.spine || !chunks.length || chunks.at(-1)[0].spine) chunks.push([row]);
        else chunks.at(-1).push(row);
      }
      if (chunks.length > 64) { result.warnings.push(`${name} 图层超过 64 个，未捕获`); continue; }
      const saved = {target: renderer.getRenderTarget(), autoClear: renderer.autoClear, background: scene.background,
        color: renderer.getClearColor({copy: color => color.clone()}), alpha: renderer.getClearAlpha()};
      const template = [scene.buffer, ...Object.values(player.buffers || {})].find(buffer => buffer?.isWebGLRenderTarget && buffer.clone);
      if (!template) { result.warnings.push(`${name} 不支持透明图层捕获`); continue; }
      const target = template.clone(); target.setSize(canvas.width, canvas.height);
      if ('encoding' in target.texture) target.texture.encoding = renderer.outputEncoding;
      const output = document.createElement('canvas'); output.width = canvas.width; output.height = canvas.height;
      const ctx = output.getContext('2d'), pixels = new Uint8Array(output.width * output.height * 4);
      const image = ctx.createImageData(output.width, output.height), stride = output.width * 4;
      const visibility = all.map(object => [object, object.visible]);
      const capture = chosen => {
        const selected = new Set(chosen.map(row => row.object));
        for (const object of all) object.visible = selected.has(object);
        renderer.setRenderTarget(target); renderer.autoClear = true; scene.background = null;
        renderer.setClearColor(0, 0); renderer.clear(true, true, true); renderer.render(scene, camera);
        renderer.readRenderTargetPixels(target, 0, 0, output.width, output.height, pixels);
        for (let y = 0; y < output.height; y++) image.data.set(pixels.subarray(y * stride, (y + 1) * stride), (output.height - y - 1) * stride);
        // WebGL blending stores premultiplied colors; ImageData expects straight alpha.
        for (let i = 0; i < image.data.length; i += 4) if (image.data[i + 3] > 0 && image.data[i + 3] < 255) {
          const scale = 255 / image.data[i + 3]; image.data[i] *= scale; image.data[i + 1] *= scale; image.data[i + 2] *= scale;
        }
        ctx.putImageData(image, 0, 0); return output.toDataURL('image/png');
      };
      try {
        const reference = capture(list), layers = [];
        result.width = canvas.width; result.height = canvas.height;
        for (const rows of chunks) {
          const first = rows[0], object = first.object;
          const layer = {kind: first.spine ? 'spine' : 'image', name: rows.map(r => r.object.name).filter(Boolean).join(' / ') || '背景', image: capture(rows)};
          if (first.spine) Object.assign(layer, {spine_id: object.userData?.spineId || '', hash: object.skeleton.data.hash || '',
            matrix: first.matrix, opacity: first.opacity, animation: object.state.getCurrent(0)?.animation?.name || '',
            skin: object.skeleton.skin?.name || '', time: object.state.getCurrent(0)?.trackTime || 0,
            skeleton: {x: object.skeleton.x, y: object.skeleton.y, scaleX: object.skeleton.scaleX, scaleY: object.skeleton.scaleY}});
          layers.push(layer);
        }
        result.scenes.push({name, reference, layers});
      } catch (error) { result.warnings.push(`${name}: ${error.message}`); }
      finally {
        for (const [object, visible] of visibility) object.visible = visible;
        scene.background = saved.background; renderer.setRenderTarget(saved.target); renderer.autoClear = saved.autoClear; renderer.setClearColor(saved.color, saved.alpha);
        target.dispose();
      }
      } finally { restoreRoots(); }
    }
  }
  if (!result.scenes.length) result.warnings.push('未找到可读取的已加载场景。此网页可能使用其他渲染引擎，或需要进入活动后再捕获。');
  result.default_scene = Math.max(0, result.scenes.findIndex(scene => /(?:^|\/\s*)(scene_)?main(?:$|\s*\/)/i.test(scene.name)));
  return result;
}
