import {ExtraBone, ExtraSlot, createDebugProvider} from './vendor/dayu-extra.js';
import {ExtraDebugPanel} from './vendor/dayu-debug.js';

const poseFields = ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'shearX', 'shearY'];

/** Adapter for the exact post-animation algorithms in the supplied reference. */
export class ExtraMotion {
  constructor(raw, skeleton, state, name, changed = () => {}) {
    this.skeleton = skeleton; this.state = state; this.warnings = []; this.basePose = null;
    // The reference adds this signed, hierarchical scale helper to Spine Bone.
    // Official runtimes only expose getWorldScaleX/Y (matrix magnitudes).
    for (const bone of skeleton.bones) bone.getWorldScale = function () {
      let x = this.scaleX, y = this.scaleY;
      for (let parent = this.parent; parent; parent = parent.parent) { x *= parent.scaleX; y *= parent.scaleY; }
      return {x, y};
    };
    this.timeScale = Number.isFinite(raw.extraConfig?.timeScale) ? raw.extraConfig.timeScale : 1;
    this.provider = createDebugProvider();
    for (const key of ['setExtraEnabled', 'setExtraParam', 'addExtraBone', 'removeExtraBone']) {
      const original = this.provider[key];
      this.provider[key] = (...args) => { const result = original.apply(this.provider, args); changed(); return result; };
    }
    this.mesh = {skeleton, state, name, autoBone: [], autoSlot: [], userData: {spineId: name}};
    const entries = raw.extra && typeof raw.extra === 'object' ? Object.entries(raw.extra) : [];
    if (raw.extra != null && typeof raw.extra !== 'object') this.warnings.push('extra 格式无效，保留原文件并播放基础动画。');
    for (const [key, entry] of entries) {
      try {
        if (!entry || !skeleton.findBone(entry.rootBoneName)) throw new Error('找不到根骨骼 ' + (entry?.rootBoneName || key));
        if (!entry.animation || typeof entry.animation !== 'object') throw new Error('缺少 animation 参数');
        this.mesh.autoBone.push(new ExtraBone(structuredClone(entry), this.mesh));
      } catch (error) { this.warnings.push(`extra ${key}：${error.message}`); }
    }
    for (const [key, entry] of Object.entries(raw.extraSlot || {})) {
      try {
        if (!entry || !skeleton.findSlot(entry.slotName)) throw new Error('找不到插槽 ' + (entry?.slotName || key));
        this.mesh.autoSlot.push(new ExtraSlot(structuredClone(entry), this.mesh));
      }
      catch (error) { this.warnings.push(`extraSlot ${key}：${error.message}`); }
    }
    this.provider._skeletonMeshes.add(this.mesh);
  }
  restore() {
    if (this.basePose) this.skeleton.bones.forEach((bone, index) => {
      poseFields.forEach((key, field) => { bone[key] = this.basePose[index][field]; });
    });
    this.basePose = null;
    if (this.baseAlpha) this.skeleton.slots.forEach((slot, index) => { slot.color.a = this.baseAlpha[index]; });
    this.baseAlpha = null;
  }
  reset() {
    for (const auto of this.mesh.autoBone) {
      auto.history.currentTrackName = '';
      auto.history.current = null; auto.history.previous = null;
    }
  }
  apply(delta, elapsed) {
    this.basePose = this.skeleton.bones.map(bone => poseFields.map(key => bone[key]));
    this.baseAlpha = this.skeleton.slots.map(slot => slot.color.a);
    if (this.provider.extraEnabled) {
      const current = this.state.getCurrent(0);
      const mix = current?.mixDuration ? Math.min(1, current.mixTime / current.mixDuration) : 1;
      const previous = mix < 1 ? current?.mixingFrom?.animation.name : null;
      const step = Math.min(2, Math.abs(delta * this.timeScale) / 0.0167);
      for (const bone of this.mesh.autoBone) if (bone.currentAnimation) bone.render(step, elapsed * this.timeScale, mix, previous);
      for (const slot of this.mesh.autoSlot) if (current && slot.currentAnimation) slot.render(elapsed * this.timeScale);
    }
    if (this.provider.debugMode) this.snapshot();
  }
  snapshot() {
    this.provider._frameData.set(this.mesh, {spineId: this.mesh.name, autoBones: this.mesh.autoBone.map(auto => {
      const animation = auto.currentAnimation, history = auto.history?.current, bone = auto.rootBone;
      return {rootBoneName: auto.rootBoneName, mode: animation?.mode ?? 0, trackName: auto.currentTrackName || 'none',
        speedX: history?.speedX ?? 0, speedY: history?.speedY ?? 0,
        forceX: animation?.forceX ?? 0, forceY: animation?.forceY ?? 0,
        rotationDelta: bone ? bone.rotation - (bone.initRotation ?? 0) : 0,
        elasticSpeedX: bone?.elasticSpeedX ?? 0, elasticSpeedY: bone?.elasticSpeedY ?? 0};
    })});
  }
  showPanel(container) {
    if (this.panel) return;
    this.snapshot();
    this.panel = new ExtraDebugPanel({provider: this.provider, container, initialOpacity: 0.97,
      initialPosition: {x: Math.max(12, Math.min(36, innerWidth - 380)), y: 90}});
  }
  hidePanel() { this.panel?.destroy(); this.panel = null; }
  dispose() { this.hidePanel(); this.provider._skeletonMeshes.clear(); this.provider._frameData.clear(); }
}
