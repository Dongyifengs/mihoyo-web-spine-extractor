import {ExtraMotion} from './extra.js';
import {FrameStats} from './performance.js';

const versions = {'3.8': '3.8', '4.0': '4.0.31', '4.1': '4.1.56', '4.2': '4.2.120'};
const runtimes = new Map();
export const runtimeVersion = group => (group.version || '').match(/^\d+\.\d+/)?.[0];
export const preferredAnimation = names => names?.find(name => /loop/i.test(name)) || names?.[0] || '';

export function loadRuntime(version) {
  const exact = String(version || '').match(/^\d+\.\d+(?:\.\d+)?/)?.[0];
  if (!exact) return Promise.reject(new Error('骨骼未提供可识别的 Spine 版本'));
  const minor = exact.split('.').slice(0, 2).join('.');
  if (!runtimes.has(minor)) {
    const cdn = v => `https://unpkg.com/@esotericsoftware/spine-player@${v}/dist/iife/spine-player.js`;
    const urls = [cdn(exact), cdn(minor + '.x')];
    if (versions[minor]) urls.push(`/static/vendor/spine-player-${versions[minor]}.js`);
    const loading = (async () => {
      for (const url of urls) {
        try {
          const response = await fetch(url, {signal: AbortSignal.timeout(8000)});
          if (!response.ok || /(?:text\/html|application\/json)/i.test(response.headers.get('content-type') || '')) continue;
          const source = await response.text();
          if (!source.trim() || /^\s*</.test(source)) continue;
          // Each official IIFE gets a separate lexical scope: 3.8 must never merge into 4.x.
          // Compile/execute failures and HTTP-200 error pages fall through to the next source.
          const runtime = new Function(source + '\nreturn typeof spine === "undefined" ? null : spine;\n//# sourceURL=' + url)();
          const webgl = runtime?.webgl || runtime;
          if (!['Skeleton', 'SkeletonJson', 'SkeletonBinary', 'AnimationState', 'AnimationStateData', 'AtlasAttachmentLoader', 'Vector2'].every(key => typeof runtime?.[key] === 'function') ||
              !['ManagedWebGLRenderingContext', 'SceneRenderer', 'AssetManager'].every(key => typeof webgl?.[key] === 'function')) continue;
          return runtime;
        } catch { /* Missing patch release, invalid code, CORS, timeout, or offline. */ }
      }
      throw new Error(`无法加载 Spine ${exact} / ${minor}.x 运行时，请检查网络后重试`);
    })();
    runtimes.set(minor, loading);
    loading.catch(() => { if (runtimes.get(minor) === loading) runtimes.delete(minor); });
  }
  return runtimes.get(minor);
}

export const debugOptions = [
  ['drawBones', '骨骼'], ['drawRegionAttachments', '区域'], ['drawMeshTriangles', '网格'],
  ['drawMeshHull', '网格外框'], ['drawBoundingBoxes', '边界框'], ['drawPaths', '路径'],
  ['drawClipping', '裁剪'], ['drawPoints', '点附件'],
];

class Surface {
  constructor(pool, group, canvas, state, callbacks) {
    Object.assign(this, {pool, group, canvas, state, callbacks});
    this.context = canvas.getContext('2d');
    this.view = {zoom: 1, x: 0, y: 0};
    this.debug = {}; this.elapsed = 0; this.dirty = true;
    this.ready = false; this.disposed = false;
  }
  async load() {
    const {runtime: r, webgl: w, context} = this.pool;
    this.assets = new w.AssetManager(context);
    this.loading = true;
    const results = await Promise.allSettled([
      new Promise((resolve, reject) => this.assets.loadTextureAtlas(this.group.atlas_url,
        (_path, data) => resolve(data), (_path, message) => reject(new Error(message)))),
      fetch(this.group.skeleton_url).then(response => {
        if (!response.ok) throw new Error(`骨骼读取失败：HTTP ${response.status}`);
        return this.group.skeleton_url.endsWith('.json') ? response.json() : response.arrayBuffer();
      }),
    ]);
    this.loading = false;
    if (this.disposed) { this.assets.dispose(); return; }
    const failed = results.find(result => result.status === 'rejected');
    if (failed) { this.assets.dispose(); throw failed.reason; }
    const [atlas, source] = results.map(result => result.value);
    const loader = new r.AtlasAttachmentLoader(atlas);
    const binary = source instanceof ArrayBuffer;
    const reader = binary ? new r.SkeletonBinary(loader) : new r.SkeletonJson(loader);
    const data = reader.readSkeletonData(binary ? new Uint8Array(source) : source);
    this.skeleton = new r.Skeleton(data);
    this.animationState = new r.AnimationState(new r.AnimationStateData(data));
    this.animationState.data.defaultMix = 0;
    const runtimeNames = data.animations.map(a => a.name), originalNames = this.group.animations || [];
    // JSON object enumeration moves numeric names (such as "0") to the front.
    // Keep the source order recorded by extraction when choosing the fallback animation.
    this.group.animations = [...originalNames.filter(name => runtimeNames.includes(name)), ...runtimeNames.filter(name => !originalNames.includes(name))];
    this.group.skins = data.skins.map(s => s.name);
    this.state.animation ||= preferredAnimation(this.group.animations);
    this.state.skin ||= this.group.initial_skin || this.group.skins.find(s => s !== 'default') || this.group.skins[0] || '';
    // The reference captures the setup pose before applying any animation.
    this.updateWorld();
    if (!binary && Object.hasOwn(source, 'extra')) {
      this.group.has_extra = true;
      this.extra = new ExtraMotion(source, this.skeleton, this.animationState, this.group.name, () => { this.dirty = true; });
      this.extra.provider.setAnimation = (_mesh, name, loop = true) => {
        this.state.animation = name; this.state.loop = loop; this.state.userAnimation = true;
        this.setState(true); this.callbacks.state?.();
      };
      this.callbacks.warning?.(this.extra.warnings.join('\n'));
    }
    this.setState(true);
    this.updateWorld();
    this.bounds = this.measureBounds();
    this.ready = true;
    this.callbacks.ready?.(this);
  }
  measureBounds() {
    const b = this.group.bounds;
    if (b && b.width > 0 && b.height > 0 && [b.width, b.height, b.x || 0, b.y || 0].every(Number.isFinite)) {
      return {x: b.x || 0, y: b.y || 0, width: b.width, height: b.height};
    }
    const offset = new this.pool.runtime.Vector2(), size = new this.pool.runtime.Vector2();
    this.skeleton.getBounds(offset, size, []);
    if (size.x > 0 && size.y > 0 && [offset.x, offset.y, size.x, size.y].every(Number.isFinite)) {
      return {x: offset.x, y: offset.y, width: size.x, height: size.y};
    }
    return {x: -100, y: -100, width: 200, height: 200};
  }
  setState(restart = false) {
    if (!this.skeleton) return;
    this.extra?.restore();
    const {state, skeleton, animationState} = this;
    if (state.skin && skeleton.skin?.name !== state.skin) {
      skeleton.setSkinByName(state.skin); skeleton.setSlotsToSetupPose();
    }
    const entry = animationState.getCurrent(0);
    if (state.animation && (restart || entry?.animation.name !== state.animation)) {
      skeleton.setToSetupPose();
      animationState.setAnimation(0, state.animation, state.loop);
      this.elapsed = 0; this.extra?.reset();
    }
    const current = animationState.getCurrent(0);
    if (current) current.loop = state.loop;
    animationState.apply(skeleton);
    this.dirty = true;
  }
  updateWorld() {
    if (this.pool.runtime.Physics) this.skeleton.updateWorldTransform(this.pool.runtime.Physics.update);
    else this.skeleton.updateWorldTransform();
  }
  update(delta) {
    if (!this.ready || (!this.state.playing && !this.dirty)) return;
    const dt = this.state.playing ? delta * this.state.speed : 0;
    this.extra?.restore();
    this.animationState.update(dt);
    this.animationState.apply(this.skeleton);
    this.elapsed += dt;
    this.extra?.apply(dt, this.elapsed);
    this.skeleton.update?.(dt);
    this.updateWorld(); this.dirty = false;
  }
  fit() { this.view = {zoom: 1, x: 0, y: 0}; this.callbacks.view?.(this.view); }
  worldPerPixel(width = this.canvas.width, height = this.canvas.height) {
    return Math.max(this.bounds.width / width, this.bounds.height / height) * 1.2 / this.view.zoom;
  }
  zoomBy(factor, x = this.canvas.width / 2, y = this.canvas.height / 2) {
    if (!this.ready) return;
    const before = this.worldPerPixel();
    this.view.zoom = Math.max(0.05, Math.min(30, this.view.zoom * factor));
    const after = this.worldPerPixel();
    this.view.x += (x - this.canvas.width / 2) * (before - after);
    this.view.y -= (y - this.canvas.height / 2) * (before - after);
    this.callbacks.view?.(this.view);
  }
  pan(dx, dy) {
    if (!this.ready) return;
    const scale = this.worldPerPixel();
    this.view.x -= dx * scale; this.view.y += dy * scale;
    this.callbacks.view?.(this.view);
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.extra?.dispose();
    // A late atlas callback can create textures, so dispose after all loads settle.
    if (!this.loading) this.assets?.dispose();
  }
}

/** One WebGL context per runtime; every loaded skeleton is rendered, including offscreen cards. */
class Pool {
  constructor(runtime, detail) {
    this.runtime = runtime; this.webgl = runtime.webgl || runtime; this.detail = detail;
    this.canvas = document.createElement('canvas'); this.canvas.className = 'render-buffer';
    this.context = new this.webgl.ManagedWebGLRenderingContext(this.canvas, {alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: true});
    this.gl = this.context.gl;
    this.renderer = new this.webgl.SceneRenderer(this.canvas, this.context);
    this.surfaces = []; this.disposed = false;
  }
  render(delta) {
    const active = this.surfaces.filter(s => s.ready && !s.disposed);
    if (!active.length) return 0;
    const width = this.detail ? active[0].canvas.width : 320;
    const height = this.detail ? active[0].canvas.height : 240;
    // Bounded backing sheet: even hundreds of cards use the same context and GPU buffer.
    const columns = this.detail ? 1 : Math.min(8, active.length);
    const rows = this.detail ? 1 : Math.min(8, Math.ceil(active.length / columns));
    const capacity = columns * rows;
    if (this.canvas.width !== columns * width) this.canvas.width = columns * width;
    if (this.canvas.height !== rows * height) this.canvas.height = rows * height;
    const {gl, renderer} = this;
    for (let start = 0; start < active.length; start += capacity) {
      gl.disable(gl.SCISSOR_TEST); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.SCISSOR_TEST);
      const batch = active.slice(start, start + capacity);
      batch.forEach((surface, index) => {
        try {
          surface.update(delta);
          const x = index % columns * width, y = Math.floor(index / columns) * height;
          gl.viewport(x, y, width, height); gl.scissor(x, y, width, height);
          const unit = surface.worldPerPixel(width, height), {bounds, view} = surface;
          renderer.camera.setViewport(width * unit, height * unit);
          renderer.camera.position.x = bounds.x + bounds.width / 2 + view.x;
          renderer.camera.position.y = bounds.y + bounds.height / 2 + view.y;
          renderer.camera.zoom = 1;
          renderer.begin();
          renderer.drawSkeleton(surface.skeleton, surface.group.premultiplied_alpha === true);
          const debug = renderer.skeletonDebugRenderer;
          for (const [key] of debugOptions) debug[key] = !!surface.debug[key];
          if (surface.extra?.provider._highlightedMesh) {
            debug.drawBones = true;
            debug.boneWidth = 2 * surface.extra.provider.boneLineScale;
          }
          if (debugOptions.some(([key]) => debug[key])) renderer.drawSkeletonDebug(surface.skeleton);
          renderer.end();
        } catch (error) {
          try { renderer.end(); } catch { /* A draw may have ended before the error. */ }
          surface.ready = false; surface.callbacks.error?.(error.message);
        }
      });
      // Copies are made after the whole batch is drawn to avoid flushing per skeleton.
      batch.forEach((surface, index) => {
        surface.context.clearRect(0, 0, surface.canvas.width, surface.canvas.height);
        surface.context.drawImage(this.canvas, index % columns * width,
          this.canvas.height - (Math.floor(index / columns) + 1) * height, width, height,
          0, 0, surface.canvas.width, surface.canvas.height);
      });
    }
    return active.length;
  }
  dispose() {
    this.disposed = true; this.surfaces.forEach(s => s.dispose());
    this.renderer.dispose(); this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

export class RenderHub {
  constructor({detail = false, fps = detail ? 60 : 30, afterFrame = null} = {}) {
    this.detail = detail; this.pools = new Map(); this.disposed = false; this.lastTime = 0;
    this.stats = new FrameStats(); this.frameListeners = new Set();
    const frame = this.frame = time => {
      if (this.disposed || this.suspended) return;
      this.raf = requestAnimationFrame(frame);
      if (time - this.lastTime < 1000 / fps - 1) return;
      const dt = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.1) : 0;
      this.lastTime = time;
      const start = performance.now(); let count = 0;
      for (const pending of this.pools.values()) if (pending.pool) count += pending.pool.render(dt);
      afterFrame?.();
      if (count || afterFrame) {
        this.stats.record(time, performance.now() - start, count);
        for (const listener of this.frameListeners) listener(time);
      }
    };
    this.raf = requestAnimationFrame(frame);
  }
  setSuspended(suspended) {
    if (this.disposed || this.suspended === suspended) return;
    this.suspended = suspended; cancelAnimationFrame(this.raf); this.lastTime = 0;
    this.stats.reset();
    if (!suspended) this.raf = requestAnimationFrame(this.frame);
  }
  async add(group, canvas, state, callbacks = {}) {
    const version = runtimeVersion(group);
    let surface;
    try {
      if (!this.pools.has(version)) {
        const pending = loadRuntime(group.version).then(runtime => {
          if (this.disposed) return null;
          const pool = new Pool(runtime, this.detail); pending.pool = pool; return pool;
        });
        this.pools.set(version, pending);
      }
      const pool = await this.pools.get(version);
      if (!pool || this.disposed) return null;
      surface = new Surface(pool, group, canvas, state, callbacks);
      pool.surfaces.push(surface);
      await surface.load();
      return surface;
    } catch (error) { surface?.dispose(); if (!this.disposed) callbacks.error?.(error.message); return null; }
  }
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.raf);
    this.frameListeners.clear();
    for (const pending of this.pools.values()) pending.pool?.dispose();
    this.pools.clear();
  }
}
