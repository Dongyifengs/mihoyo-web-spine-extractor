/*! Derived from the user-supplied spine_mirror.zip.
 * Copyright (c) 2024-2026 Dayu Network Technology (大于网络科技).
 * Original authors retain all rights. See DAYU-NOTICE.txt.
 */
var t = Object["defineProperty"];

var e = (_0xe67b9e, _0x55f8e1, _0x58ad1f) => (
  ((_0x51f807, _0x6dce, _0x24db78) => {
    _0x6dce in _0x51f807
      ? t(_0x51f807, _0x6dce, {
          enumerable: !0x0,

          configurable: !0x0,

          writable: !0x0,

          value: _0x24db78,
        })
      : (_0x51f807[_0x6dce] = _0x24db78);
  })(
    _0xe67b9e,

    "symbol" != typeof _0x55f8e1 ? _0x55f8e1 + "" : _0x55f8e1,

    _0x58ad1f,
  ),
  _0x58ad1f
);

class Se {
  constructor() {
    (e(this, "current"),
      e(this, "previous"),
      e(this, "currentTrackName"),
      (this["current"] = null),
      (this["previous"] = null),
      (this["currentTrackName"] = ""));
  }

  ["check"](_0x15b709, _0x53b261) {
    _0x15b709 !== this["currentTrackName"] &&
      ((this["previous"] = this["current"]),
      (this["current"] = _0x53b261["createHistory"]()),
      (this["currentTrackName"] = _0x15b709));
  }
}

class _e {
  constructor(_0x24c06d) {
    (e(this, "mode", 0x0), (this["mode"] = _0x24c06d["mode"] ?? 0x0));
  }

  ["createHistory"]() {
    return { speedX: 0x0, speedY: 0x0, buffer: [] };
  }
}

class Ae extends _e {
  constructor(_0x322707) {
    (super(_0x322707),
      e(this, "rotateOffset", 0x0),
      e(this, "rotateTime", 0x2),
      e(this, "rotateRange", 0xa),
      e(this, "rotateCenter", 0x0),
      e(this, "childOffset", 0.25),
      e(this, "spring", 0x0),
      e(this, "affectByLevel", 0.1),
      e(this, "springLevel", 0x0),
      e(this, "scaleYRange", 0x0),
      e(this, "scaleYTime", 0x2),
      e(this, "scaleYCenter", 0x0),
      e(this, "scaleYOffset", 0x0),
      e(this, "scaleYChildOffset", 0.25),
      e(this, "scaleYSpring", 0x0),
      e(this, "scaleYAffectByLevel", 0.1),
      e(this, "scaleXRange", 0x0),
      e(this, "scaleXTime", 0x2),
      e(this, "scaleXCenter", 0x0),
      e(this, "scaleXOffset", 0x0),
      e(this, "scaleXChildOffset", 0.25),
      e(this, "scaleXSpring", 0x0),
      e(this, "scaleXAffectByLevel", 0.1),
      e(this, "sinScaleXSameAsY", !0x1),
      e(this, "moveXRange", 0x0),
      e(this, "moveXTime", 0x2),
      e(this, "moveXSpring", 0x0),
      e(this, "moveXChildOffset", 0.25),
      e(this, "moveXAffectByLevel", 0.1),
      e(this, "moveXOffset", 0x0),
      e(this, "moveXCenter", 0x0),
      e(this, "moveYRange", 0x0),
      e(this, "moveYTime", 0x2),
      e(this, "moveYSpring", 0x0),
      e(this, "moveYChildOffset", 0.25),
      e(this, "moveYAffectByLevel", 0.1),
      e(this, "moveYOffset", 0x0),
      e(this, "moveYCenter", 0x0),
      this["copy"](_0x322707));
  }

  ["copy"](_0x522e45) {
    (Object["entries"]({
      rotateOffset: 0x0,

      rotateTime: 0x2,

      rotateRange: 0xa,

      rotateCenter: 0x0,

      childOffset: 0.25,

      spring: 0x0,

      affectByLevel: 0.1,

      springLevel: 0x0,

      scaleYRange: 0x0,

      scaleYTime: 0x2,

      scaleYCenter: 0x0,

      scaleYOffset: 0x0,

      scaleYChildOffset: 0.25,

      scaleYSpring: 0x0,

      scaleYAffectByLevel: 0.1,

      scaleXRange: 0x0,

      scaleXTime: 0x2,

      scaleXCenter: 0x0,

      scaleXOffset: 0x0,

      scaleXChildOffset: 0.25,

      scaleXSpring: 0x0,

      scaleXAffectByLevel: 0.1,

      moveXRange: 0x0,

      moveXTime: 0x2,

      moveXSpring: 0x0,

      moveXChildOffset: 0.25,

      moveXAffectByLevel: 0.1,

      moveXOffset: 0x0,

      moveXCenter: 0x0,

      moveYRange: 0x0,

      moveYTime: 0x2,

      moveYSpring: 0x0,

      moveYChildOffset: 0.25,

      moveYAffectByLevel: 0.1,

      moveYOffset: 0x0,

      moveYCenter: 0x0,
    })["forEach"](([_0x2c5f29, _0x465ed0]) => {
      this[_0x2c5f29] = _0x522e45["hasOwnProperty"](_0x2c5f29)
        ? _0x522e45[_0x2c5f29]
        : _0x465ed0;
    }),
      (this["sinScaleXSameAsY"] =
        this["scaleXRange"] === this["scaleYRange"] &&
        this["scaleXCenter"] === this["scaleYCenter"] &&
        this["scaleXTime"] === this["scaleYTime"] &&
        this["scaleXOffset"] === this["scaleYOffset"] &&
        this["scaleXChildOffset"] === this["scaleYChildOffset"] &&
        this["scaleXSpring"] === this["scaleYSpring"] &&
        this["scaleXAffectByLevel"] === this["scaleYAffectByLevel"]));
  }
}

class Te extends _e {
  constructor(_0x360b7d) {
    (super(_0x360b7d),
      e(this, "moveXFreq", 0x1),
      e(this, "moveXAmp", 0x0),
      e(this, "moveXOctaves", 0x0),
      e(this, "moveXDelay", 0x0),
      e(this, "moveXCenter", 0x0),
      e(
        this,

        "moveXSeed",

        Math["floor"](0x2710 * Math["random"]()),
      ),
      e(this, "moveYFreq", 0x1),
      e(this, "moveYAmp", 0x0),
      e(this, "moveYOctaves", 0x0),
      e(this, "moveYDelay", 0x0),
      e(this, "moveYCenter", 0x0),
      e(this, "moveYSameAsX", !0x1),
      e(this, "scaleXFreq", 0x1),
      e(this, "scaleXAmp", 0x0),
      e(this, "scaleXOctaves", 0x0),
      e(this, "scaleXDelay", 0x0),
      e(this, "scaleXCenter", 0x0),
      e(this, "scaleYFreq", 0x1),
      e(this, "scaleYAmp", 0x0),
      e(this, "scaleYOctaves", 0x0),
      e(this, "scaleYDelay", 0x0),
      e(this, "scaleYCenter", 0x0),
      e(this, "scaleYSameAsX", !0x1),
      e(this, "rotateSpeed", 0x0),
      e(this, "rotateFreq", 0x1),
      e(this, "rotateAmp", 0x0),
      e(this, "rotateOctaves", 0x0),
      e(this, "rotateDelay", 0x0),
      e(this, "rotateCenter", 0x0),
      e(this, "rotateFollowEnable", !0x1),
      e(this, "rotateFollowLimit", 0x0),
      e(this, "rotateFollowSpeed", 0.1),
      e(this, "rotateFollowFlip", 0x0),
      e(this, "rotateFollowXMax", 0x14),
      e(this, "rotateFollowYMax", 0x14),
      this["copy"](_0x360b7d));
  }

  ["copy"](_0x32f732) {
    const {
      moveXFreq: _0x307e2f = 0x1,

      moveXAmp: _0x5bdd2f = 0x0,

      moveXOctaves: _0x252d48 = 0x0,

      moveXDelay: _0x34d805 = 0x0,

      moveXCenter: _0x29e175 = 0x0,

      moveXSeed: _0x5729ee = Math["floor"](0x2710 * Math["random"]()),

      moveYFreq: _0x46a5bf = _0x307e2f,

      moveYAmp: _0x2c798f = _0x5bdd2f,

      moveYOctaves: _0x5c4f54 = _0x252d48,

      moveYDelay: _0x4e291e = _0x34d805,

      moveYCenter: _0x31913a = _0x29e175,

      scaleXFreq: _0x1deeda = 0x1,

      scaleXAmp: _0x4d9d71 = 0x0,

      scaleXOctaves: _0xd48237 = 0x0,

      scaleXDelay: _0x5d9fd3 = 0x0,

      scaleXCenter: _0x4eeb84 = 0x0,

      scaleYFreq: _0xd6fe31 = _0x1deeda,

      scaleYAmp: _0x35bb3b = _0x4d9d71,

      scaleYOctaves: _0x26c823 = _0xd48237,

      scaleYDelay: _0x12e605 = _0x5d9fd3,

      scaleYCenter: _0x415dcf = _0x4eeb84,

      rotateSpeed: _0x2bd9f3 = 0x0,

      rotateFreq: _0x5dc8ed = 0x1,

      rotateAmp: _0x20f157 = 0x0,

      rotateOctaves: _0x2459f4 = 0x0,

      rotateDelay: _0x40c841 = 0x0,

      rotateCenter: _0x512cc1 = 0x0,

      rotateFollowLimit: _0x54f47c = 0x0,

      rotateFollowSpeed: _0x40b636 = 0.1,

      rotateFollowFlip: _0x5b4469 = 0x0,

      rotateFollowXMax: _0x12d0eb = 0x14,

      rotateFollowYMax: _0x1ad6f0 = 0x14,
    } = _0x32f732 || {};

    ((this["moveXFreq"] = _0x307e2f),
      (this["moveXAmp"] = _0x5bdd2f),
      (this["moveXOctaves"] = _0x252d48),
      (this["moveXDelay"] = _0x34d805),
      (this["moveXCenter"] = _0x29e175),
      (this["moveXSeed"] = _0x5729ee),
      (this["moveYFreq"] = _0x46a5bf),
      (this["moveYAmp"] = _0x2c798f),
      (this["moveYOctaves"] = _0x5c4f54),
      (this["moveYDelay"] = _0x4e291e),
      (this["moveYCenter"] = _0x31913a),
      (this["moveYSameAsX"] =
        _0x307e2f === _0x46a5bf &&
        _0x5bdd2f === _0x2c798f &&
        _0x252d48 === _0x5c4f54 &&
        _0x34d805 === _0x4e291e &&
        _0x29e175 === _0x31913a),
      (this["scaleXFreq"] = _0x1deeda),
      (this["scaleXAmp"] = _0x4d9d71),
      (this["scaleXOctaves"] = _0xd48237),
      (this["scaleXDelay"] = _0x5d9fd3),
      (this["scaleXCenter"] = _0x4eeb84),
      (this["scaleYFreq"] = _0xd6fe31),
      (this["scaleYAmp"] = _0x35bb3b),
      (this["scaleYOctaves"] = _0x26c823),
      (this["scaleYDelay"] = _0x12e605),
      (this["scaleYCenter"] = _0x415dcf),
      (this["scaleYSameAsX"] =
        _0x1deeda === _0xd6fe31 &&
        _0x4d9d71 === _0x35bb3b &&
        _0xd48237 === _0x26c823 &&
        _0x5d9fd3 === _0x12e605 &&
        _0x4eeb84 === _0x415dcf),
      (this["rotateSpeed"] = _0x2bd9f3),
      (this["rotateFreq"] = _0x5dc8ed),
      (this["rotateAmp"] = _0x20f157),
      (this["rotateOctaves"] = _0x2459f4),
      (this["rotateDelay"] = _0x40c841),
      (this["rotateCenter"] = _0x512cc1),
      (this["rotateFollowEnable"] = 0x0 !== _0x54f47c),
      (this["rotateFollowLimit"] = _0x54f47c),
      (this["rotateFollowSpeed"] = _0x40b636),
      (this["rotateFollowFlip"] = _0x5b4469),
      (this["rotateFollowXMax"] = _0x12d0eb),
      (this["rotateFollowYMax"] = _0x1ad6f0));
  }
}

class Ee extends _e {
  constructor(_0x104f6d) {
    (super(_0x104f6d),
      e(this, "delay", 0.1),
      e(this, "speed", 0.1),
      e(this, "spring", 0x0),
      e(this, "affectByRange", 0x1),
      e(this, "affectByX", 0x1),
      e(this, "affectByY", 0x1),
      e(this, "rotateMoveRange", 0x1),
      e(this, "affectByLevel", 0x0),
      e(this, "springLevel", 0x0),
      e(this, "limitRange", 0xa),
      this["copy"](_0x104f6d));
  }

  ["copy"](_0x2e029f = {}) {
    const {
      delay: _0x459854 = 0.1,

      speed: _0x46b4e5 = 0.1,

      spring: _0x2f2d58 = 0x0,

      affectByRange: _0x33441d = 0x1,

      affectByX: _0x190ddc = 0x1,

      affectByY: _0x5cda28 = 0x1,

      rotateMoveRange: _0x419049 = 0x1,

      affectByLevel: _0x56ce5b = 0x0,

      springLevel: _0x143fdd = 0x0,

      limitRange: _0x2ab2e3 = 0xa,
    } = _0x2e029f;

    ((this["delay"] = _0x459854),
      (this["speed"] = _0x46b4e5),
      (this["spring"] = _0x2f2d58),
      (this["affectByRange"] = _0x33441d),
      (this["affectByX"] = _0x190ddc),
      (this["affectByY"] = _0x5cda28),
      (this["rotateMoveRange"] = _0x419049),
      (this["affectByLevel"] = _0x56ce5b),
      (this["springLevel"] = _0x143fdd),
      (this["limitRange"] = _0x2ab2e3));
  }
}

class Me extends _e {
  constructor(_0x46c356) {
    (super(_0x46c356),
      e(this, "delay", 0.1),
      e(this, "speed", 0.1),
      e(this, "spring", 0x0),
      e(this, "springRot", 0x0),
      e(this, "affectByLevel", 0x0),
      e(this, "springLevel", 0x0),
      e(this, "limitRange", 0x50),
      e(this, "rotateOffset", 0x0),
      e(this, "friction", 0.7),
      e(this, "springUseTarget", !0x1),
      e(this, "windX", 0x0),
      e(this, "windY", 0x0),
      e(this, "windFreq", 0x1),
      e(this, "windAccel", 0x1),
      e(this, "windDelay", 0x0),
      e(this, "windOctaves", 0x0),
      e(this, "gravityX", 0x0),
      e(this, "gravityY", 0x0),
      e(this, "forceX", 0x0),
      e(this, "forceY", 0x0),
      e(this, "hasWindForce", !0x1),
      this["copy"](_0x46c356));
  }

  ["copy"](_0x29e66e = {}) {
    const {
      delay: _0x36d4cb = 0.1,

      speed: _0x484007 = 0.1,

      spring: _0x256db2 = 0x0,

      springRot: _0x47efcd = 0x0,

      affectByLevel: _0x7aaf6c = 0x0,

      springLevel: _0x4a20de = 0x0,

      limitRange: _0x3dfa2d = 0x50,

      rotateOffset: _0x1a9be1 = 0x0,

      friction: _0x1c2965 = 0.7,

      springUseTarget: _0x2e33b5 = !0x1,

      windX: _0x2433d9 = 0x0,

      windY: _0x4320a5 = 0x0,

      windFreq: _0x2c740a = 0x1,

      windAccel: _0x351fc5 = 0x1,

      windDelay: _0x529f67 = 0x0,

      windOctaves: _0x436f0e = 0x0,

      gravityX: _0x66dce8 = 0x0,

      gravityY: _0x21f3d8 = 0x0,

      forceX: _0xa9bc22 = 0x0,

      forceY: _0x3b2206 = 0x0,
    } = _0x29e66e;

    Object["assign"](this, {
      delay: _0x36d4cb,

      speed: _0x484007,

      spring: _0x256db2,

      springRot: _0x47efcd,

      affectByLevel: _0x7aaf6c,

      springLevel: _0x4a20de,

      limitRange: _0x3dfa2d,

      rotateOffset: _0x1a9be1,

      friction: _0x1c2965,

      springUseTarget: _0x2e33b5,

      windX: _0x2433d9,

      windY: _0x4320a5,

      windFreq: _0x2c740a,

      windAccel: _0x351fc5,

      windDelay: _0x529f67,

      windOctaves: _0x436f0e,

      gravityX: _0x66dce8,

      gravityY: _0x21f3d8,

      forceX: _0xa9bc22,

      forceY: _0x3b2206,

      hasWindForce: 0x0 !== _0x2433d9 || 0x0 !== _0x4320a5,
    });
  }
}

class Ce extends _e {
  constructor(_0x1b3aa0) {
    (super(_0x1b3aa0), e(this, "name"));

    const { mode: _0xa005a6 = 0x1, name: _0x378ca4 = "" } = _0x1b3aa0;

    ((this["mode"] = _0xa005a6), (this["name"] = _0x378ca4));
  }

  ["createHistory"]() {
    return null;
  }

  ["clone"]() {
    return Ce["create"]({
      mode: this["mode"],

      name: this["name"],
    });
  }

  static ["create"](_0x2a5789) {
    return new Ce(_0x2a5789);
  }
}

class Re extends _e {
  constructor(_0x34fd24) {
    (super(_0x34fd24),
      e(this, "elasticSpring", 0.4),
      e(this, "elasticFriction", 0.6),
      e(this, "elasticSoftness", 0x1),
      e(this, "elasticSpringY", this["elasticSpring"]),
      e(this, "elasticFrictionY", this["elasticFriction"]),
      e(this, "elasticSoftnessY", this["elasticSoftness"]),
      this["copy"](_0x34fd24));
  }

  ["copy"](_0x5e8f1e = {}) {
    const {
      elasticSpring: _0xabdc47 = 0.4,

      elasticFriction: _0x3941b4 = 0.6,

      elasticSoftness: _0x426f07 = 0x1,

      elasticSpringY: _0x58cc27 = _0xabdc47,

      elasticFrictionY: _0x9d702d = _0x3941b4,

      elasticSoftnessY: _0x5bd185 = _0x426f07,
    } = _0x5e8f1e;

    ((this["elasticSpring"] = _0xabdc47),
      (this["elasticFriction"] = _0x3941b4),
      (this["elasticSoftness"] = _0x426f07),
      (this["elasticSpringY"] = _0x58cc27),
      (this["elasticFrictionY"] = _0x9d702d),
      (this["elasticSoftnessY"] = _0x5bd185));
  }
}

class Ie extends _e {
  constructor(_0xb2793b) {
    (super(_0xb2793b),
      e(this, "delay", 0x0),
      e(this, "xFrames", []),
      e(this, "yFrames", []),
      e(this, "sxFrames", []),
      e(this, "syFrames", []),
      e(this, "xFramesEnd", 0x0),
      e(this, "yFramesEnd", 0x0),
      e(this, "sxFramesEnd", 0x0),
      e(this, "syFramesEnd", 0x0),
      e(this, "sYSameAsSX", !0x1),
      this["copy"](_0xb2793b));
  }

  ["copy"](_0xcb2fbc = {}) {
    const {
      delay: _0x4ef584 = 0x0,

      xFrames: _0x101ecd = [],

      yFrames: _0x3c7def = [],

      sxFrames: _0x280de5 = [],

      syFrames: _0xca639c = [],
    } = _0xcb2fbc;

    ((this["delay"] = _0x4ef584),
      (this["xFrames"] = _0x101ecd["map"]((_0x11978a) => new Ye(_0x11978a))),
      (this["xFramesEnd"] = this["xFrames"]["length"]
        ? this["xFrames"][this["xFrames"]["length"] - 0x1]["start"]
        : 0x0),
      (this["yFrames"] = _0x3c7def["map"]((_0x2d7339) => new Ye(_0x2d7339))),
      (this["yFramesEnd"] = this["yFrames"]["length"]
        ? this["yFrames"][this["yFrames"]["length"] - 0x1]["start"]
        : 0x0),
      (this["sxFrames"] = _0x280de5["map"]((_0xe905a9) => new Ye(_0xe905a9))),
      (this["sxFramesEnd"] = this["sxFrames"]["length"]
        ? this["sxFrames"][this["sxFrames"]["length"] - 0x1]["start"]
        : 0x0),
      (this["sYSameAsSX"] = 0x0 === _0xca639c["length"]),
      (this["syFrames"] = this["sYSameAsSX"]
        ? []
        : _0xca639c["map"]((_0x2bcbef) => new Ye(_0x2bcbef))),
      (this["syFramesEnd"] = this["syFrames"]["length"]
        ? this["syFrames"][this["syFrames"]["length"] - 0x1]["start"]
        : 0x0));
  }
}

class Ye {
  constructor(_0x24a97a = {}) {
    (e(this, "value"), e(this, "start"), e(this, "ease"));

    const {
      value: _0x4c011a = 0x1,

      start: _0x257485 = 0x0,

      ease: _0x2898ed = "linear",
    } = _0x24a97a;

    ((this["value"] = _0x4c011a),
      (this["start"] = _0x257485),
      (this["ease"] = _0x2898ed));
  }

  get ["easeFunc"]() {
    return Be[this["ease"]] || Be["linear"];
  }

  static ["getBlock"](_0x3e9b60, _0x3318d2) {
    for (
      let _0x3d81ef = _0x3e9b60["length"] - 0x1;
      _0x3d81ef > 0x0;
      _0x3d81ef--
    )
      if (
        _0x3e9b60[_0x3d81ef]["start"] >= _0x3318d2 &&
        _0x3e9b60[_0x3d81ef - 0x1]["start"] <= _0x3318d2
      )
        return { start: _0x3e9b60[_0x3d81ef - 0x1], end: _0x3e9b60[_0x3d81ef] };
  }
}

const Be = { linear: (_0x575a89) => _0x575a89 };

class Fe {
  constructor(_0xfab903, _0x3fce2c) {
    (e(this, "animation"),
      e(this, "rootMovement"),
      e(this, "rootBoneName"),
      e(this, "endBoneName"),
      e(this, "targetBoneName"),
      e(this, "targetEndBoneName"),
      e(this, "targetWeight"),
      e(this, "history"),
      e(this, "spineObj"),
      e(this, "rootBone"),
      e(this, "targetBone"));

    const {
      animation: _0xfbf30c = {},

      rootBoneName: _0x1a1418 = "",

      endBoneName: _0x2012bd = [],

      targetBoneName: _0x4d4de4 = "",

      targetEndBoneName: _0x3a2127 = "",

      targetWeight: _0x2e181a = 0x1,
    } = _0xfab903;

    ((this["animation"] = Object["fromEntries"](
      Object["entries"](_0xfbf30c)["map"](([_0x122c51, _0x52f6b8]) => [
        _0x122c51,

        Fe["createAnimation"](_0x52f6b8),
      ]),
    )),
      (this["rootMovement"] = 0x0),
      (this["rootBoneName"] = _0x1a1418),
      (this["endBoneName"] = Array["isArray"](_0x2012bd)
        ? _0x2012bd
        : [_0x2012bd]),
      (this["targetBoneName"] = _0x4d4de4),
      (this["targetEndBoneName"] = _0x3a2127),
      (this["targetWeight"] = _0x2e181a),
      (this["history"] = new Se()),
      (this["spineObj"] = _0x3fce2c),
      this["bind"](_0x3fce2c));
  }

  ["bind"](_0x5b5802) {
    ((this["spineObj"] = _0x5b5802),
      (this["rootBone"] = _0x5b5802["skeleton"]["findBone"](
        this["rootBoneName"],
      )),
      "" !== this["targetBoneName"] &&
        (this["targetBone"] = _0x5b5802["skeleton"]["findBone"](
          this["targetBoneName"],
        )),
      this["init"](this["rootBone"]));
  }

  ["init"](_0x4f5443, _0x51998a = 0x0) {
    ((_0x4f5443["initX"] = _0x4f5443["x"]),
      (_0x4f5443["initY"] = _0x4f5443["y"]),
      (_0x4f5443["initWorldX"] = _0x4f5443["worldX"]),
      (_0x4f5443["initWorldY"] = _0x4f5443["worldY"]),
      (_0x4f5443["initScaleX"] = _0x4f5443["scaleX"]),
      (_0x4f5443["initScaleY"] = _0x4f5443["scaleY"]),
      (_0x4f5443["initRotation"] = _0x4f5443["rotation"]),
      (_0x4f5443["autoMovePrevWorldX"] = _0x4f5443["worldX"]),
      (_0x4f5443["autoMovePrevWorldY"] = _0x4f5443["worldY"]),
      (_0x4f5443["autoMoveSpeedX"] = 0x0),
      (_0x4f5443["autoMoveSpeedY"] = 0x0),
      (_0x4f5443["autoMoveFriction"] = 0x0),
      (_0x4f5443["followRotation"] = 0x0),
      (_0x4f5443["elasticSpeedX"] = 0x0),
      (_0x4f5443["elasticSpeedY"] = 0x0),
      _0x4f5443["children"]["forEach"]((_0x1a6412) => {
        this["init"](_0x1a6412, _0x51998a + 0x1);
      }),
      0x0 === _0x4f5443["children"]["length"] &&
        ((_0x4f5443["tailAutoMovePrevWorldX"] =
          _0x4f5443["y"] * _0x4f5443["b"] + _0x4f5443["worldX"]),
        (_0x4f5443["tailAutoMovePrevWorldY"] =
          _0x4f5443["y"] * _0x4f5443["d"] + _0x4f5443["worldY"])));
  }

  ["reset"]() {
    ((this["rootMovement"] = 0x0), this["resetBone"]());
  }

  ["resetBone"](_0x44874f = this["rootBone"]) {
    ((_0x44874f["worldX"] = _0x44874f["initWorldX"]),
      (_0x44874f["worldY"] = _0x44874f["initWorldY"]),
      (_0x44874f["scaleX"] = _0x44874f["initScaleX"]),
      (_0x44874f["scaleY"] = _0x44874f["initScaleY"]),
      (_0x44874f["rotation"] = _0x44874f["initRotation"]),
      this["endBoneName"]["includes"](_0x44874f["data"]["name"]) ||
        _0x44874f["children"]["forEach"]((_0x2583f5) => {
          this["resetBone"](_0x2583f5);
        }));
  }

  ["render"](_0x5acd79, _0x2ef6ba, _0x119104, _0x2f21be) {
    let _0x5be395 = null,
      _0x76e4a9 = this["currentAnimation"],
      _0x5595e4 = this["currentTrackName"],
      _0x258a40 = 0x1;

    (this["history"]["current"] ||
      this["history"]["check"](_0x5595e4, _0x76e4a9),
      _0x2f21be &&
        _0x5595e4 !== _0x2f21be &&
        ((_0x5be395 = this["animation"][_0x2f21be] || this["defaultAnimation"]),
        this["history"]["check"](_0x5595e4, _0x76e4a9)),
      _0x5be395 &&
        0x1 !== _0x119104 &&
        ((_0x258a40 = _0x119104),
        this["renderAutoBone"](
          _0x5be395,

          this["history"]["previous"],

          _0x5acd79,

          _0x2ef6ba,

          0x1,
        )),
      this["renderAutoBone"](
        _0x76e4a9,

        this["history"]["current"],

        _0x5acd79,

        _0x2ef6ba,

        _0x258a40,
      ));
  }

  ["renderAutoBone"](_0x91b4b1, _0x3f9b01, _0x3322a0, _0x586fca, _0x47e163) {
    const { mode: _0x8f0e34 } = _0x91b4b1;

    if (0x1 === _0x8f0e34)
      this["updateSineMode"](
        _0x91b4b1,

        _0x586fca,

        this["rootBone"],

        this["targetBone"],

        0x0,

        _0x47e163,
      );
    else {
      if (0x2 === _0x8f0e34)
        this["updatePhysicMode"](
          _0x91b4b1,

          _0x3f9b01,

          this["rootBone"],

          _0x586fca,

          _0x3322a0,

          _0x47e163,
        );
      else {
        if (0x3 === _0x8f0e34) {
          const {
            moveXFreq: _0x1e7bba,

            moveXAmp: _0x436824,

            moveXOctaves: _0x4f3a8e,

            moveXDelay: _0x28c03e,

            moveXCenter: _0x441f86,

            moveYSameAsX: _0xe06207,

            moveXSeed: _0x19ec50,

            moveYFreq: _0xfd8f29,

            moveYAmp: _0x2f1aac,

            moveYOctaves: _0x17f55e,

            moveYDelay: _0x32e236,

            moveYCenter: _0x1dd9da,

            scaleXFreq: _0x316947,

            scaleXAmp: _0x2e7a14,

            scaleXOctaves: _0x19cac7,

            scaleXDelay: _0x47f33b,

            scaleXCenter: _0xf47134,

            scaleYSameAsX: _0x121727,

            scaleYFreq: _0x36bfef,

            scaleYAmp: _0x11db06,

            scaleYOctaves: _0x5fea4,

            scaleYDelay: _0x23332c,

            scaleYCenter: _0x34944b,

            rotateSpeed: _0x592f9e,

            rotateFreq: _0x142961,

            rotateAmp: _0x4d19a8,

            rotateOctaves: _0x5dcddc,

            rotateDelay: _0x3761e8,

            rotateCenter: _0x37744b,

            rotateFollowEnable: _0x7e3339,

            rotateFollowLimit: _0x300467,

            rotateFollowSpeed: _0x4b023c,

            rotateFollowFlip: _0x37b934,

            rotateFollowXMax: _0xc11617,

            rotateFollowYMax: _0x5401b1,
          } = _0x91b4b1;

          let _0x5e7a37,
            _0x1f27d5 =
              0x0 === _0x436824
                ? 0x0
                : this["updateWiggleMode"](
                    _0x1e7bba,

                    _0x436824,

                    _0x4f3a8e,

                    _0x586fca,

                    _0x28c03e,
                  ) + _0x441f86;

          ((this["rootBone"]["x"] = this["mixValue"](
            this["rootBone"]["x"],

            this["rootBone"]["initX"] + _0x1f27d5,

            _0x47e163,
          )),
            (_0x5e7a37 = _0xe06207
              ? 0x0 === _0x436824
                ? 0x0
                : this["updateWiggleMode"](
                    _0x1e7bba,

                    _0x436824,

                    _0x4f3a8e,

                    _0x586fca,

                    _0x28c03e + _0x19ec50,
                  ) + _0x441f86
              : 0x0 === _0x2f1aac
                ? 0x0
                : this["updateWiggleMode"](
                    _0xfd8f29,

                    _0x2f1aac,

                    _0x17f55e,

                    _0x586fca,

                    _0x32e236,
                  ) + _0x1dd9da),
            (this["rootBone"]["y"] = this["mixValue"](
              this["rootBone"]["y"],

              this["rootBone"]["initY"] + _0x5e7a37,

              _0x47e163,
            )));

          let _0x20e282,
            _0x23dd16 =
              0x0 === _0x2e7a14
                ? 0x0
                : this["updateWiggleMode"](
                    _0x316947,

                    _0x2e7a14,

                    _0x19cac7,

                    _0x586fca,

                    _0x47f33b,
                  ) + _0xf47134;

          ((this["rootBone"]["scaleX"] = this["mixValue"](
            this["rootBone"]["scaleX"],

            this["rootBone"]["initScaleX"] + _0x23dd16,

            _0x47e163,
          )),
            (_0x20e282 = _0x121727
              ? _0x23dd16
              : 0x0 === _0x11db06
                ? 0x0
                : this["updateWiggleMode"](
                    _0x36bfef,

                    _0x11db06,

                    _0x5fea4,

                    _0x586fca,

                    _0x23332c,
                  ) + _0x34944b),
            (this["rootBone"]["scaleY"] = this["mixValue"](
              this["rootBone"]["scaleY"],

              this["rootBone"]["initScaleY"] + _0x20e282,

              _0x47e163,
            )));

          let _0x3f3cf4 =
            this["rootBone"]["initRotation"] +
            _0x586fca * _0x592f9e * 0x168 +
            _0x37744b;

          if (
            ((_0x3f3cf4 +=
              0x0 === _0x4d19a8
                ? 0x0
                : this["updateWiggleMode"](
                    _0x142961,

                    _0x4d19a8,

                    _0x5dcddc,

                    _0x586fca,

                    _0x3761e8,
                  )),
            _0x7e3339)
          ) {
            const _0x504d03 =
                this["rootBone"]["worldX"] -
                this["rootBone"]["autoMovePrevWorldX"],
              _0x25ac17 =
                this["rootBone"]["worldY"] -
                this["rootBone"]["autoMovePrevWorldY"];

            let _0x40f920 = 0x0;

            _0x40f920 =
              0x1 === _0x37b934
                ? -_0x300467 *
                    Math["max"](
                      -0x1,

                      Math["min"](0x1, _0x504d03 / _0xc11617),
                    ) -
                  _0x300467 *
                    Math["max"](
                      -0x1,

                      Math["min"](0x1, _0x25ac17 / _0x5401b1),
                    )
                : (Math["atan2"](_0x25ac17, _0x504d03) * (0xb4 / Math["PI"]) +
                    0x168) %
                  0x168;

            let _0x5dd769 = _0x40f920 - this["rootBone"]["followRotation"];

            (_0x5dd769 >= 0xb4 && (_0x40f920 -= 0x168),
              _0x5dd769 <= -0xb4 && (_0x40f920 += 0x168),
              (this["rootBone"]["followRotation"] +=
                Math["min"](
                  _0x300467,

                  Math["max"](
                    -_0x300467,

                    _0x40f920 - this["rootBone"]["followRotation"],
                  ),
                ) * _0x4b023c),
              (this["rootBone"]["followRotation"] =
                (this["rootBone"]["followRotation"] + 0x168) % 0x168),
              (_0x3f3cf4 += this["rootBone"]["followRotation"]));
          }

          ((this["rootBone"]["autoMovePrevWorldX"] =
            this["rootBone"]["worldX"]),
            (this["rootBone"]["autoMovePrevWorldY"] =
              this["rootBone"]["worldY"]),
            (this["rootBone"]["rotation"] = this["mixValue"](
              this["rootBone"]["rotation"],

              _0x3f3cf4,

              _0x47e163,
            )));
        } else {
          if (0x4 === _0x8f0e34) {
            const _0x5c874d = this["rootBone"]["getWorldScale"](),
              _0x47cc6e = _0x5c874d["x"],
              _0x2fbc1e = _0x5c874d["y"],
              _0x13c6f4 = _0x91b4b1,
              _0x12bd3f = _0x13c6f4["hasWindForce"];

            let _0x3524d4 = -_0x13c6f4["gravityX"],
              _0x1ee6da = -_0x13c6f4["gravityY"];

            if (_0x12bd3f) {
              const _0x2be780 =
                0.5 +
                0.5 *
                  this["updateWiggleMode"](
                    _0x13c6f4["windFreq"],

                    0x1,

                    _0x13c6f4["windOctaves"],

                    _0x586fca,

                    _0x13c6f4["windDelay"],

                    0.8,
                  );

              ((_0x3524d4 += _0x13c6f4["windX"] * _0x2be780),
                (_0x1ee6da += _0x13c6f4["windY"] * _0x2be780));
            }

            ((_0x91b4b1["forceX"] = _0x3524d4),
              (_0x91b4b1["forceY"] = _0x1ee6da),
              this["updateSpringMagic"](
                _0x91b4b1,

                this["rootBone"],

                this["targetBone"],

                _0x586fca,

                _0x3322a0,

                0x0,

                _0x47e163,

                _0x47cc6e * _0x2fbc1e < 0x0 ? -0x1 : 0x1,
              ));
          } else
            0x5 === _0x8f0e34
              ? this["updateElastic"](
                  _0x91b4b1,

                  this["rootBone"],

                  _0x3322a0,

                  _0x47e163,
                )
              : 0x6 === _0x8f0e34 &&
                this["updateKeyFrameMode"](
                  _0x91b4b1,

                  this["rootBone"],

                  _0x586fca,

                  _0x47e163,
                );
        }
      }
    }
  }

  static ["createAnimation"](_0x87f861) {
    switch (_0x87f861["mode"]) {
      case 0x1:
        return new Ae(_0x87f861);

      case 0x2:
        return new Ee(_0x87f861);

      case 0x3:
        return new Te(_0x87f861);

      case 0x4:
        return new Me(_0x87f861);

      case 0x5:
        return new Re(_0x87f861);

      case 0x6:
        return new Ie(_0x87f861);

      default:
        return new Ce(_0x87f861);
    }
  }

  get ["currentTrackName"]() {
    return this["spineObj"]["state"]["tracks"]["length"]
      ? this["spineObj"]["state"]["tracks"][0x0]["animation"]["name"]
      : "";
  }

  get ["currentAnimation"]() {
    var _0x3d259c;

    const _0x3c998e =
      null == (_0x3d259c = this["spineObj"]["state"]["tracks"][0x0])
        ? void 0x0
        : _0x3d259c["animation"]["name"];

    return this["animation"][_0x3c998e] || this["defaultAnimation"];
  }

  get ["defaultAnimation"]() {
    return this["animation"]["default"];
  }

  ["mixValue"](_0x9bf308, _0x7bedda, _0x49ca4e) {
    return _0x9bf308 + (_0x7bedda - _0x9bf308) * _0x49ca4e;
  }

  ["updateSineMode"](
    _0x164ab4,

    _0x2f57a1,

    _0x449993 = this["rootBone"],

    _0x22ab49 = this["targetBone"],

    _0x313418 = 0x0,

    _0x313500,
  ) {
    if (!this["endBoneName"]["includes"](_0x449993["data"]["name"])) {
      const _0x309242 =
          _0x22ab49 && _0x22ab49["data"]["name"] !== this["targetEndBoneName"],
        _0x7c3fec = _0x309242
          ? this["mixValue"](
              _0x449993["initRotation"],

              _0x22ab49["rotation"],

              this["targetWeight"],
            )
          : _0x449993["initRotation"];

      _0x449993["rotation"] = this["mixValue"](
        _0x449993["rotation"],

        _0x7c3fec +
          Math["sin"](
            ((_0x164ab4["rotateOffset"] -
              Math["pow"](
                _0x164ab4["childOffset"] * _0x313418,

                0x1 + _0x164ab4["spring"],
              ) +
              _0x2f57a1) *
              Math["PI"] *
              0x2) /
              _0x164ab4["rotateTime"],
          ) *
            _0x164ab4["rotateRange"] *
            Math["pow"](
              0x1 + _0x313418 * _0x164ab4["affectByLevel"],

              0x1 + _0x164ab4["springLevel"],
            ) +
          _0x164ab4["rotateCenter"],

        _0x313500,
      );

      let _0x30d1fd = 0x0;

      if (0x0 !== _0x164ab4["scaleYRange"]) {
        const _0x1a5dd1 = _0x309242
          ? this["mixValue"](
              _0x449993["initScaleY"],

              _0x22ab49["scaleY"],

              this["targetWeight"],
            )
          : _0x449993["initScaleY"];

        if (
          ((_0x30d1fd =
            Math["sin"](
              ((_0x164ab4["scaleYOffset"] -
                Math["pow"](
                  _0x164ab4["scaleYChildOffset"] * _0x313418,

                  0x1 + _0x164ab4["scaleYSpring"],
                ) +
                _0x2f57a1) *
                Math["PI"] *
                0x2) /
                _0x164ab4["scaleYTime"],
            ) *
              _0x164ab4["scaleYRange"] *
              Math["pow"](
                0x1 + _0x313418 * _0x164ab4["scaleYAffectByLevel"],

                0x1 + _0x164ab4["springLevel"],
              ) +
            _0x164ab4["scaleYCenter"]),
          (_0x449993["scaleY"] = this["mixValue"](
            _0x449993["scaleY"],

            _0x1a5dd1 + _0x30d1fd,

            _0x313500,
          )),
          _0x164ab4["sinScaleXSameAsY"])
        ) {
          const _0xe8dac2 = _0x309242
            ? this["mixValue"](
                _0x449993["initScaleX"],

                _0x22ab49["scaleX"],

                this["targetWeight"],
              )
            : _0x449993["initScaleX"];

          _0x449993["scaleX"] = this["mixValue"](
            _0x449993["scaleX"],

            _0xe8dac2 + _0x30d1fd,

            _0x313500,
          );
        }
      }

      if (!_0x164ab4["sinScaleXSameAsY"] && 0x0 !== _0x164ab4["scaleXRange"]) {
        const _0x3c4ec7 = _0x309242
          ? this["mixValue"](
              _0x449993["initScaleX"],

              _0x22ab49["scaleX"],

              this["targetWeight"],
            )
          : _0x449993["initScaleX"];

        ((_0x30d1fd =
          Math["sin"](
            ((_0x164ab4["scaleXOffset"] -
              Math["pow"](
                _0x164ab4["scaleXChildOffset"] * _0x313418,

                0x1 + _0x164ab4["scaleXSpring"],
              ) +
              _0x2f57a1) *
              Math["PI"] *
              0x2) /
              _0x164ab4["scaleXTime"],
          ) *
            _0x164ab4["scaleXRange"] *
            Math["pow"](
              0x1 + _0x313418 * _0x164ab4["scaleXAffectByLevel"],

              0x1 + _0x164ab4["springLevel"],
            ) +
          _0x164ab4["scaleXCenter"]),
          (_0x449993["scaleX"] = this["mixValue"](
            _0x449993["scaleX"],

            _0x3c4ec7 + _0x30d1fd,

            _0x313500,
          )));
      }

      if (0x0 !== _0x164ab4["moveXRange"]) {
        const _0x456552 = _0x309242
            ? this["mixValue"](
                _0x449993["initX"],

                _0x22ab49["x"],

                this["targetWeight"],
              )
            : _0x449993["initX"],
          _0x44de2c =
            Math["sin"](
              ((_0x164ab4["moveXOffset"] -
                Math["pow"](
                  _0x164ab4["moveXChildOffset"] * _0x313418,

                  0x1 + _0x164ab4["moveXSpring"],
                ) +
                _0x2f57a1) *
                Math["PI"] *
                0x2) /
                _0x164ab4["moveXTime"],
            ) *
              _0x164ab4["moveXRange"] *
              Math["pow"](
                0x1 + _0x313418 * _0x164ab4["moveXAffectByLevel"],

                0x1 + _0x164ab4["springLevel"],
              ) +
            _0x164ab4["moveXCenter"];

        _0x449993["x"] = this["mixValue"](
          _0x449993["x"],

          _0x44de2c + _0x456552,

          _0x313500,
        );
      }

      if (0x0 !== _0x164ab4["moveYRange"]) {
        const _0x2ef1be = _0x309242
            ? this["mixValue"](
                _0x449993["initY"],

                _0x22ab49["y"],

                this["targetWeight"],
              )
            : _0x449993["initY"],
          _0x5d80a1 =
            Math["sin"](
              ((_0x164ab4["moveYOffset"] -
                Math["pow"](
                  _0x164ab4["moveYChildOffset"] * _0x313418,

                  0x1 + _0x164ab4["moveYSpring"],
                ) +
                _0x2f57a1) *
                Math["PI"] *
                0x2) /
                _0x164ab4["moveYTime"],
            ) *
              _0x164ab4["moveYRange"] *
              Math["pow"](
                0x1 + _0x313418 * _0x164ab4["moveYAffectByLevel"],

                0x1 + _0x164ab4["springLevel"],
              ) +
            _0x164ab4["moveYCenter"];

        _0x449993["y"] = this["mixValue"](
          _0x449993["y"],

          _0x5d80a1 + _0x2ef1be,

          _0x313500,
        );
      }

      _0x449993["children"]["forEach"]((_0x3112a4, _0x18ae18) => {
        const _0x2a5e60 = _0x309242 ? _0x22ab49["children"][_0x18ae18] : null;

        this["updateSineMode"](
          _0x164ab4,

          _0x2f57a1,

          _0x3112a4,

          _0x2a5e60,

          _0x313418 + 0x1,

          _0x313500,
        );
      });
    }
  }

  ["updateWiggleMode"](
    _0x3829a1,

    _0xb19f1a,

    _0x2d7062,

    _0x877ab2,

    _0x5314d1,

    _0x31b4ce = 0.5,
  ) {
    let _0x5a8d02 = 0x0,
      _0x4b79f6 = 0x1,
      _0x42f437 = _0x2d7062 + 0x1,
      _0x37a64f = 0x1 / (0x2 - 0x1 / Math["pow"](0x2, _0x42f437 - 0x1)),
      _0x5e10cc = _0x37a64f,
      _0x543cf5 = 0x0;

    for (let _0xa59768 = 0x0; _0xa59768 < _0x42f437; _0xa59768++)
      ((_0x5a8d02 +=
        _0x4b79f6 *
        Math["sin"](
          (_0x877ab2 * _0x5e10cc * Math["PI"] * 0x2) / _0x3829a1 + _0x5314d1,
        )),
        (_0x5e10cc = _0x37a64f * Math["pow"](1.5, _0xa59768 + 0x1)),
        (_0x543cf5 += _0x4b79f6),
        (_0x4b79f6 *= _0x31b4ce));

    return (_0x5a8d02 / _0x543cf5) * _0xb19f1a;
  }

  ["updatePhysicMode"](
    _0x5a86b3,

    _0x4cc381,

    _0xe9f0df,

    _0x58d4c6,

    _0x28fe04,

    _0x2e6494,
  ) {
    let _0x37a8ca = Math["min"](
        _0x5a86b3["limitRange"],

        Math["max"](
          -_0x5a86b3["limitRange"],

          _0xe9f0df["autoMovePrevWorldX"] - _0xe9f0df["worldX"],
        ),
      ),
      _0x15113c = Math["min"](
        _0x5a86b3["limitRange"],

        Math["max"](
          -_0x5a86b3["limitRange"],

          _0xe9f0df["autoMovePrevWorldY"] - _0xe9f0df["worldY"],
        ),
      );

    ((_0x4cc381["speedX"] +=
      (_0x5a86b3["affectByX"] * _0x37a8ca - _0x4cc381["speedX"]) *
      _0x5a86b3["speed"] *
      _0x58d4c6),
      (_0x4cc381["speedY"] +=
        (_0x5a86b3["affectByY"] * _0x15113c - _0x4cc381["speedY"]) *
        _0x5a86b3["speed"] *
        _0x58d4c6),
      (_0xe9f0df["autoMovePrevWorldX"] = _0xe9f0df["worldX"]),
      (_0xe9f0df["autoMovePrevWorldY"] = _0xe9f0df["worldY"]));

    let _0x15198a =
      _0x5a86b3["affectByRange"] *
      (-_0x4cc381["speedX"] * _0xe9f0df["c"] +
        _0x4cc381["speedY"] * _0xe9f0df["d"]);

    ((_0xe9f0df["rotation"] = this["mixValue"](
      _0xe9f0df["rotation"],

      _0x15198a + _0xe9f0df["initRotation"],

      _0x2e6494,
    )),
      _0x4cc381["buffer"]["push"]({
        time: _0x28fe04,

        delta: _0x15198a,
      }),
      _0x4cc381["buffer"]["length"] > 0x12c && _0x4cc381["buffer"]["shift"](),
      _0xe9f0df["children"]["forEach"]((_0x18cc72) => {
        this["updateFollowMode"](
          _0x5a86b3,

          _0x4cc381,

          _0x18cc72,

          _0x58d4c6,

          _0x28fe04,

          _0x2e6494,
        );
      }));
  }

  ["updateFollowMode"](
    _0x36cca4,

    _0x18a2c7,

    _0x2aa3da,

    _0x2cfeed,

    _0x383fe9,

    _0x9b3e8c,
  ) {
    if (!this["endBoneName"]["includes"](_0x2aa3da["data"]["name"])) {
      let _0x18d4d7 =
        this["getHistoryRotate"](
          _0x2cfeed -
            _0x36cca4["delay"] * (0x1 + _0x383fe9 * _0x36cca4["spring"]),

          _0x18a2c7["buffer"],
        ) *
        _0x36cca4["rotateMoveRange"] *
        Math["pow"](
          0x1 + _0x383fe9 * _0x36cca4["affectByLevel"],

          0x1 + _0x36cca4["springLevel"],
        );

      ((_0x2aa3da["rotation"] = this["mixValue"](
        _0x2aa3da["rotation"],

        _0x18d4d7 + _0x2aa3da["initRotation"],

        _0x9b3e8c,
      )),
        _0x2aa3da["children"]["forEach"]((_0x1cc06c) => {
          this["updateFollowMode"](
            _0x36cca4,

            _0x18a2c7,

            _0x1cc06c,

            _0x2cfeed,

            _0x383fe9 + 0x1,

            _0x9b3e8c,
          );
        }));
    }
  }

  ["updateSpringMagic"](
    _0x434c59,

    _0x4b9440,

    _0x1794c7,

    _0x49d43d,

    _0x5a4f71,

    _0x359984,

    _0x28a0a5,

    _0x33c2a2,
  ) {
    if (!this["endBoneName"]["includes"](_0x4b9440["data"]["name"])) {
      (_0x4b9440["updateWorldTransform"](),
        (_0x4b9440["autoMovePrevWorldX"] = _0x4b9440["worldX"]),
        (_0x4b9440["autoMovePrevWorldY"] = _0x4b9440["worldY"]));

      const _0x6b518d =
          _0x1794c7 && _0x1794c7["data"]["name"] !== this["targetEndBoneName"]
            ? this["mixValue"](
                _0x4b9440["initRotation"],

                _0x1794c7["rotation"],

                this["targetWeight"],
              )
            : _0x4b9440["initRotation"],
        _0x3d41da =
          _0x434c59["springUseTarget"] && _0x1794c7 ? _0x1794c7 : _0x4b9440,
        _0x24bfc6 = 0x1 + _0x359984 * _0x434c59["affectByLevel"],
        _0x2d817d = Math["pow"](
          _0x24bfc6,

          0x1 + _0x434c59["springLevel"],
        ),
        _0x50c027 =
          _0x434c59["delay"] *
          _0x2d817d *
          (0x1 + _0x434c59["springRot"] * _0x24bfc6) *
          _0x5a4f71 *
          (0x0 === _0x359984 ? 0x1 + _0x434c59["spring"] : 0x1),
        _0x1050f3 = _0x434c59["friction"],
        _0x84154f = _0x434c59["forceX"],
        _0x3c63c9 = _0x434c59["forceY"],
        _0xdf1f6c = 0x1 - _0x434c59["windAccel"];

      if (_0x4b9440["children"]["length"] > 0x0)
        _0x4b9440["children"]["forEach"]((_0x3184d3, _0x54d835) => {
          if (0x0 === _0x54d835) {
            const _0x20a086 =
                (_0x3184d3["x"] * _0x3d41da["a"] +
                  _0x3184d3["y"] * _0x3d41da["b"] +
                  _0x4b9440["worldX"] -
                  _0x3184d3["autoMovePrevWorldX"]) *
                _0x50c027,
              _0x409f91 =
                (_0x3184d3["x"] * _0x3d41da["c"] +
                  _0x3184d3["y"] * _0x3d41da["d"] +
                  _0x4b9440["worldY"] -
                  _0x3184d3["autoMovePrevWorldY"]) *
                _0x50c027;

            ((_0x4b9440["autoMoveSpeedX"] += _0x20a086),
              (_0x4b9440["autoMoveSpeedY"] += _0x409f91),
              (_0x4b9440["autoMoveSpeedX"] *= _0x1050f3),
              (_0x4b9440["autoMoveSpeedY"] *= _0x1050f3),
              (_0x4b9440["autoMoveSpeedX"] +=
                _0x84154f * _0x434c59["windAccel"]),
              (_0x4b9440["autoMoveSpeedY"] +=
                _0x3c63c9 * _0x434c59["windAccel"]));

            const _0xa03543 =
                _0x3184d3["autoMovePrevWorldX"] +
                _0x4b9440["autoMoveSpeedX"] +
                _0x84154f * _0xdf1f6c,
              _0x197639 =
                _0x3184d3["autoMovePrevWorldY"] +
                _0x4b9440["autoMoveSpeedY"] +
                _0x3c63c9 * _0xdf1f6c,
              _0xaadbdc = _0x4b9440["worldToLocalRotation"](
                (_0x33c2a2 *
                  Math["atan2"](
                    _0x197639 - _0x4b9440["worldY"],

                    _0x33c2a2 * (_0xa03543 - _0x4b9440["worldX"]),
                  ) *
                  0xb4) /
                  Math["PI"] +
                  (0x0 === _0x359984 ? _0x434c59["rotateOffset"] : 0x0),
              ),
              _0x354004 =
                Math["min"](
                  _0x434c59["limitRange"],

                  Math["max"](
                    -_0x434c59["limitRange"],

                    _0xaadbdc - _0x6b518d,
                  ),
                ) + _0x6b518d;

            ((_0x4b9440["rotation"] = this["mixValue"](
              _0x4b9440["rotation"],

              _0x6b518d * _0x434c59["speed"] +
                (0x1 - _0x434c59["speed"]) * _0x354004,

              _0x28a0a5 * _0x4b9440["autoMoveFriction"],
            )),
              _0x4b9440["updateWorldTransform"]());
          }

          const _0x27875c = _0x1794c7 ? _0x1794c7["children"][_0x54d835] : null;

          this["updateSpringMagic"](
            _0x434c59,

            _0x3184d3,

            _0x27875c,

            _0x49d43d,

            _0x5a4f71,

            _0x359984 + 0x1,

            _0x28a0a5,

            _0x33c2a2,
          );
        });
      else {
        const _0x306b41 =
            (_0x4b9440["x"] * _0x3d41da["a"] +
              _0x4b9440["y"] * _0x3d41da["b"] +
              _0x4b9440["worldX"] -
              _0x4b9440["tailAutoMovePrevWorldX"]) *
            _0x50c027,
          _0x4a01c4 =
            (_0x4b9440["x"] * _0x3d41da["c"] +
              _0x4b9440["y"] * _0x3d41da["d"] +
              _0x4b9440["worldY"] -
              _0x4b9440["tailAutoMovePrevWorldY"]) *
            _0x50c027;

        ((_0x4b9440["autoMoveSpeedX"] += _0x306b41),
          (_0x4b9440["autoMoveSpeedY"] += _0x4a01c4),
          (_0x4b9440["autoMoveSpeedX"] *= _0x1050f3),
          (_0x4b9440["autoMoveSpeedY"] *= _0x1050f3),
          (_0x4b9440["autoMoveSpeedX"] += _0x84154f * _0x434c59["windAccel"]),
          (_0x4b9440["autoMoveSpeedY"] += _0x3c63c9 * _0x434c59["windAccel"]));

        const _0x4c77c9 =
            _0x4b9440["tailAutoMovePrevWorldX"] +
            _0x4b9440["autoMoveSpeedX"] +
            _0x84154f * _0xdf1f6c,
          _0x3ce956 =
            _0x4b9440["tailAutoMovePrevWorldY"] +
            _0x4b9440["autoMoveSpeedY"] +
            _0x3c63c9 * _0xdf1f6c,
          _0x5dde61 = _0x4b9440["worldToLocalRotation"](
            (_0x33c2a2 *
              Math["atan2"](
                _0x3ce956 - _0x4b9440["worldY"],

                _0x33c2a2 * (_0x4c77c9 - _0x4b9440["worldX"]),
              ) *
              0xb4) /
              Math["PI"] +
              (0x0 === _0x359984 ? _0x434c59["rotateOffset"] : 0x0),
          ),
          _0xcc4c2b =
            Math["min"](
              _0x434c59["limitRange"],

              Math["max"](
                -_0x434c59["limitRange"],

                _0x5dde61 - _0x6b518d,
              ),
            ) + _0x6b518d;

        ((_0x4b9440["rotation"] = this["mixValue"](
          _0x4b9440["rotation"],

          _0x6b518d * _0x434c59["speed"] +
            (0x1 - _0x434c59["speed"]) * _0xcc4c2b,

          _0x28a0a5 * _0x4b9440["autoMoveFriction"],
        )),
          _0x4b9440["updateWorldTransform"](),
          (_0x4b9440["tailAutoMovePrevWorldX"] =
            _0x4b9440["x"] * _0x4b9440["a"] +
            _0x4b9440["y"] * _0x4b9440["b"] +
            _0x4b9440["worldX"]),
          (_0x4b9440["tailAutoMovePrevWorldY"] =
            _0x4b9440["x"] * _0x4b9440["c"] +
            _0x4b9440["y"] * _0x4b9440["d"] +
            _0x4b9440["worldY"]));
      }

      _0x4b9440["autoMoveFriction"] +=
        0.1 * (0x1 - _0x4b9440["autoMoveFriction"]) * _0x5a4f71;
    }
  }

  ["updateElastic"](_0x5bbe4c, _0x1b1888, _0x765580, _0x182391) {
    if (!this["endBoneName"]["includes"](_0x1b1888["data"]["name"])) {
      const _0x9b8d5e = _0x1b1888["parent"],
        _0x31aa5d = _0x1b1888["initX"],
        _0x5465c1 = _0x1b1888["initY"],
        _0x43d207 =
          _0x31aa5d * _0x9b8d5e["a"] +
          _0x5465c1 * _0x9b8d5e["b"] +
          _0x9b8d5e["worldX"],
        _0x1c282a =
          _0x31aa5d * _0x9b8d5e["c"] +
          _0x5465c1 * _0x9b8d5e["d"] +
          _0x9b8d5e["worldY"],
        _0x4388bb =
          (_0x43d207 - _0x1b1888["autoMovePrevWorldX"]) *
          _0x5bbe4c["elasticSpring"] *
          _0x765580,
        _0x131570 =
          (_0x1c282a - _0x1b1888["autoMovePrevWorldY"]) *
          _0x5bbe4c["elasticSpringY"] *
          _0x765580;

      ((_0x1b1888["elasticSpeedX"] += _0x4388bb),
        (_0x1b1888["elasticSpeedX"] *= _0x5bbe4c["elasticFriction"]),
        (_0x1b1888["elasticSpeedY"] += _0x131570),
        (_0x1b1888["elasticSpeedY"] *= _0x5bbe4c["elasticFrictionY"]),
        (_0x1b1888["autoMovePrevWorldX"] += _0x1b1888["elasticSpeedX"]),
        (_0x1b1888["autoMovePrevWorldY"] += _0x1b1888["elasticSpeedY"]));

      const _0x5d35ac = _0x9b8d5e["worldToLocal"]({
          x: _0x1b1888["autoMovePrevWorldX"],

          y: _0x1b1888["autoMovePrevWorldY"],
        }),
        _0x5a0871 = _0x5d35ac["x"],
        _0x8bae94 = _0x5d35ac["y"];

      isNaN(_0x5a0871) ||
        isNaN(_0x8bae94) ||
        ((_0x1b1888["x"] = this["mixValue"](
          _0x1b1888["x"],

          _0x5a0871 * _0x5bbe4c["elasticSoftness"] +
            (0x1 - _0x5bbe4c["elasticSoftness"]) * _0x31aa5d,

          _0x182391 * _0x1b1888["autoMoveFriction"],
        )),
        (_0x1b1888["y"] = this["mixValue"](
          _0x1b1888["y"],

          _0x8bae94 * _0x5bbe4c["elasticSoftnessY"] +
            (0x1 - _0x5bbe4c["elasticSoftnessY"]) * _0x5465c1,

          _0x182391 * _0x1b1888["autoMoveFriction"],
        )),
        (_0x1b1888["autoMoveFriction"] +=
          0.1 * (0x1 - _0x1b1888["autoMoveFriction"]) * _0x765580));
    }
  }

  ["updateKeyFrameMode"](_0x5a06c6, _0x4955f6, _0x404749, _0x2b3c02) {
    const _0x64e7f9 = _0x404749 + _0x5a06c6["delay"] + 0x3e8;

    if (_0x5a06c6["xFramesEnd"] > 0x0) {
      const _0x2fed51 = _0x64e7f9 % _0x5a06c6["xFramesEnd"],
        { start: _0x144ff4, end: _0xf115f9 } = Ye["getBlock"](
          _0x5a06c6["xFrames"],

          _0x2fed51,
        ),
        _0x3fc79d = _0x144ff4["value"],
        _0x4487d8 = _0x144ff4["start"],
        _0x1d39f8 = _0xf115f9["value"],
        _0x24b705 = _0xf115f9["start"],
        _0x3748cd = _0xf115f9["easeFunc"];

      _0x4955f6["x"] = this["mixValue"](
        _0x4955f6["x"],

        (_0x1d39f8 - _0x3fc79d) *
          _0x3748cd((_0x2fed51 - _0x4487d8) / (_0x24b705 - _0x4487d8)) +
          _0x3fc79d,

        _0x2b3c02,
      );
    }

    if (_0x5a06c6["yFramesEnd"] > 0x0) {
      const _0x322b9d = _0x64e7f9 % _0x5a06c6["yFramesEnd"],
        { start: _0x45040c, end: _0x360c4b } = Ye["getBlock"](
          _0x5a06c6["yFrames"],

          _0x322b9d,
        ),
        _0x38c2ac = _0x45040c["value"],
        _0x212c51 = _0x45040c["start"],
        _0x1fe6e6 = _0x360c4b["value"],
        _0x49b3a6 = _0x360c4b["start"],
        _0x3bfe13 = _0x360c4b["easeFunc"];

      _0x4955f6["y"] = this["mixValue"](
        _0x4955f6["y"],

        (_0x1fe6e6 - _0x38c2ac) *
          _0x3bfe13((_0x322b9d - _0x212c51) / (_0x49b3a6 - _0x212c51)) +
          _0x38c2ac,

        _0x2b3c02,
      );
    }

    if (_0x5a06c6["sxFramesEnd"] > 0x0) {
      const _0x349330 = _0x64e7f9 % _0x5a06c6["sxFramesEnd"],
        { start: _0x71f32b, end: _0x286b67 } = Ye["getBlock"](
          _0x5a06c6["sxFrames"],

          _0x349330,
        ),
        _0x42188b = _0x71f32b["value"],
        _0x548000 = _0x71f32b["start"],
        _0x50c34c = _0x286b67["value"],
        _0x5583e = _0x286b67["start"],
        _0x1e3dd5 = _0x286b67["easeFunc"];

      if (
        ((_0x4955f6["scaleX"] = this["mixValue"](
          _0x4955f6["scaleX"],

          (_0x50c34c - _0x42188b) *
            _0x1e3dd5((_0x349330 - _0x548000) / (_0x5583e - _0x548000)) +
            _0x42188b,

          _0x2b3c02,
        )),
        _0x5a06c6["sYSameAsSX"] && (_0x4955f6["scaleY"] = _0x4955f6["scaleX"]),
        _0x5a06c6["syFramesEnd"] > 0x0)
      ) {
        const _0x41bd67 = _0x64e7f9 % _0x5a06c6["syFramesEnd"],
          { start: _0x3b9a11, end: _0x139afb } = Ye["getBlock"](
            _0x5a06c6["syFrames"],

            _0x41bd67,
          ),
          _0x1c2275 = _0x3b9a11["value"],
          _0x4bfc8a = _0x3b9a11["start"],
          _0x36152a = _0x139afb["value"],
          _0xaeb5c0 = _0x139afb["start"],
          _0x376793 = _0x139afb["easeFunc"];

        _0x4955f6["scaleY"] = this["mixValue"](
          _0x4955f6["scaleY"],

          (_0x36152a - _0x1c2275) *
            _0x376793((_0x41bd67 - _0x4bfc8a) / (_0xaeb5c0 - _0x4bfc8a)) +
            _0x1c2275,

          _0x2b3c02,
        );
      }
    }
  }

  ["getHistoryRotate"](_0x1fc438, _0x591cb2) {
    for (
      var _0x366ff0 = _0x591cb2["length"] - 0x1;
      _0x366ff0 > -0x1;
      _0x366ff0--
    ) {
      var _0x3dcbef = _0x591cb2[_0x366ff0];

      if (_0x3dcbef["time"] > _0x1fc438) {
        for (var _0x319146 = _0x366ff0 - 0x1; _0x319146 > -0x1; _0x319146--) {
          var _0x2c9337 = _0x591cb2[_0x319146];

          if (_0x1fc438 >= _0x2c9337["time"])
            return (
              _0x2c9337["delta"] +
              ((_0x3dcbef["delta"] - _0x2c9337["delta"]) *
                (_0x1fc438 - _0x2c9337["time"])) /
                (_0x3dcbef["time"] - _0x2c9337["time"])
            );
        }

        return 0x0;
      }
    }

    return 0x0;
  }
}

class Xe {
  constructor(_0x465493 = {}) {
    (e(this, "mode"),
      e(this, "name"),
      e(this, "delay"),
      (this["mode"] = _0x465493["mode"] ?? 0x1),
      (this["name"] = _0x465493["name"] ?? ""),
      (this["delay"] = _0x465493["delay"] ?? 0x0));
  }

  ["createHistory"]() {
    return null;
  }

  ["clone"]() {
    return new Xe({
      mode: this["mode"],

      name: this["name"],

      delay: this["delay"],
    });
  }
}

class Oe extends Xe {
  constructor(_0xd452d6) {
    (super(_0xd452d6),
      e(this, "blinkTime"),
      e(this, "min"),
      e(this, "max"),
      (this["blinkTime"] = _0xd452d6["blinkTime"] ?? 0x1),
      (this["min"] = _0xd452d6["min"] ?? 0x0),
      (this["max"] = _0xd452d6["max"] ?? 0x1));
  }
}

class Pe extends Xe {
  constructor(_0x1708be) {
    (super(_0x1708be),
      e(this, "frames"),
      e(this, "framesEnd"),
      (this["frames"] = (_0x1708be["frames"] ?? [])["map"](
        (_0x51cc9c) => new Ye(_0x51cc9c),
      )),
      (this["framesEnd"] = this["frames"]["length"]
        ? this["frames"][this["frames"]["length"] - 0x1]["start"]
        : 0x0));
  }
}

class De {
  static ["fromEntries"](_0xa90030) {
    return Object["fromEntries"](_0xa90030);
  }
}

class Le {
  constructor(_0x11dd3b, _0x2ac489) {
    (e(this, "animation"),
      e(this, "slotName"),
      e(this, "spineObj"),
      e(this, "slot"));

    const { animation: _0x2a3701 = {}, slotName: _0x52d269 = "" } = _0x11dd3b;

    ((this["animation"] = De["fromEntries"](
      Object["entries"](_0x2a3701)["map"](([_0x2290b1, _0x48914f]) => [
        _0x2290b1,

        Le["createAnimation"](_0x48914f),
      ]),
    )),
      (this["spineObj"] = _0x2ac489),
      (this["slot"] = _0x2ac489["skeleton"]["slots"]["find"](
        (_0x40b938) => _0x40b938["data"]["name"] === _0x52d269,
      )));
  }

  static ["createAnimation"](_0x3fcce6) {
    switch (_0x3fcce6["mode"]) {
      case 0x1:
        return new Oe(_0x3fcce6);

      case 0x2:
        return new Pe(_0x3fcce6);

      default:
        return new Xe(_0x3fcce6);
    }
  }

  ["render"](_0x3d1a52) {
    const _0x5ad076 = this["currentAnimation"];

    0x1 === _0x5ad076["mode"]
      ? this["updateSineMode"](_0x5ad076, _0x3d1a52)
      : 0x2 === _0x5ad076["mode"] &&
        this["updateTweenMode"](_0x5ad076, _0x3d1a52);
  }

  ["updateSineMode"](_0x447f68, _0x143d47) {
    this["slot"]["color"]["a"] =
      (0.5 +
        0.5 *
          Math["sin"](
            ((_0x143d47 + _0x447f68["delay"]) * Math["PI"] * 0x2) /
              _0x447f68["blinkTime"],
          )) *
        (_0x447f68["max"] - _0x447f68["min"]) +
      _0x447f68["min"];
  }

  ["updateTweenMode"](_0x288bc8, _0x5e0275) {
    if (0x0 !== _0x288bc8["framesEnd"]) {
      const _0x4dea1e =
          (_0x5e0275 + _0x288bc8["delay"] + 0x3e8) % _0x288bc8["framesEnd"],
        { start: _0x2bc028, end: _0x1e7829 } = Ye["getBlock"](
          _0x288bc8["frames"],

          _0x4dea1e,
        ),
        _0x3f9d45 =
          ((_0x1e7829["value"] - _0x2bc028["value"]) *
            (_0x4dea1e - _0x2bc028["start"])) /
            (_0x1e7829["start"] - _0x2bc028["start"]) +
          _0x2bc028["value"];

      this["slot"]["color"]["a"] = _0x3f9d45;
    }
  }

  get ["currentAnimation"]() {
    const _0x2ed897 =
      this["spineObj"]["state"]["tracks"][0x0]["animation"]["name"];

    return this["animation"][_0x2ed897] || this["defaultAnimation"];
  }

  get ["defaultAnimation"]() {
    return this["animation"]["default"];
  }
}

class Fr {
  constructor(_0x34d2e2 = {}) {
    (e(this, "timeScale"), (this["timeScale"] = _0x34d2e2["timeScale"] ?? 0x1));
  }
}

const Xr = {
  extraEnabled: !0x0,

  debugMode: !0x1,

  _skeletonMeshes: new Set(),

  _frameData: new Map(),

  _highlightedMesh: null,

  _highlightedBoneIdx: -0x1,

  boneLineScale: 0x1,

  setExtraEnabled(_0xbb83f1) {
    this["extraEnabled"] = _0xbb83f1;
  },

  setDebugMode(_0x51b8c8) {
    this["debugMode"] = _0x51b8c8;
  },

  setHighlightedMesh(_0x521284, _0x176163 = -0x1) {
    (_0x521284 !== this["_highlightedMesh"] || this["_highlightedBoneIdx"],
      (this["_highlightedMesh"] = _0x521284),
      (this["_highlightedBoneIdx"] = _0x176163));
  },

  getSnapshots() {
    return Array["from"](this["_frameData"]["values"]());
  },

  getSnapshotsWithRefs() {
    return Array["from"](this["_frameData"]["entries"]())["map"](
      ([_0x39667b, _0x36ac8a]) => ({ meshRef: _0x39667b, data: _0x36ac8a }),
    );
  },

  getAllSkeletonMeshes() {
    return Array["from"](this["_skeletonMeshes"]);
  },

  getExtraParams(_0x5efa40, _0x1d7147) {
    if (
      !_0x5efa40 ||
      !_0x5efa40["autoBone"] ||
      _0x1d7147 < 0x0 ||
      _0x1d7147 >= _0x5efa40["autoBone"]["length"]
    )
      return null;

    const _0xa8f96c = _0x5efa40["autoBone"][_0x1d7147]["currentAnimation"];

    if (!_0xa8f96c) return null;

    const _0x2bee4f = this["getParamMeta"](_0xa8f96c["mode"] ?? 0x0),
      _0x252026 = {};

    for (const _0x2f6be7 of _0x2bee4f) {
      const _0x6d3ec1 = _0xa8f96c[_0x2f6be7["key"]];

      "number" == typeof _0x6d3ec1 && (_0x252026[_0x2f6be7["key"]] = _0x6d3ec1);
    }

    return _0x252026;
  },

  setExtraParam(_0x2befb6, _0x450f09, _0x58b554, _0x37b27b) {
    if (
      !_0x2befb6 ||
      !_0x2befb6["autoBone"] ||
      _0x450f09 < 0x0 ||
      _0x450f09 >= _0x2befb6["autoBone"]["length"]
    )
      return;

    const _0x45324e = _0x2befb6["autoBone"][_0x450f09]["currentAnimation"];

    _0x45324e && (_0x45324e[_0x58b554] = _0x37b27b);
  },

  getAnimationList(_0x10740b) {
    var _0x2013ac, _0xaedcb, _0x1a824d;

    return (
      null ==
      (_0x1a824d =
        null ==
        (_0xaedcb =
          null ==
          (_0x2013ac = null == _0x10740b ? void 0x0 : _0x10740b["state"])
            ? void 0x0
            : _0x2013ac["data"])
          ? void 0x0
          : _0xaedcb["skeletonData"])
        ? void 0x0
        : _0x1a824d["animations"]
    )
      ? _0x10740b["state"]["data"]["skeletonData"]["animations"]["map"](
          (_0x50a3ce) => _0x50a3ce["name"],
        )
      : [];
  },

  setAnimation(_0x19c19b, _0x2ab58d, _0x4ba71a = !0x0) {
    if (null == _0x19c19b ? void 0x0 : _0x19c19b["state"])
      try {
        _0x19c19b["state"]["setAnimation"](
          0x0,

          _0x2ab58d,

          _0x4ba71a,
        );
      } catch (_0x5b9393) {}
  },

  getModelHash(_0x48db6f) {
    var _0x34f145, _0x436a4f;

    return (
      (null ==
      (_0x436a4f =
        null ==
        (_0x34f145 = null == _0x48db6f ? void 0x0 : _0x48db6f["skeleton"])
          ? void 0x0
          : _0x34f145["data"])
        ? void 0x0
        : _0x436a4f["hash"]) ?? null
    );
  },

  getSkeletonBoneNames(_0x5adb49) {
    var _0x163640;

    return (
      null == (_0x163640 = null == _0x5adb49 ? void 0x0 : _0x5adb49["skeleton"])
        ? void 0x0
        : _0x163640["bones"]
    )
      ? _0x5adb49["skeleton"]["bones"]["map"](
          (_0x5a66c7) => _0x5a66c7["data"]["name"],
        )
      : [];
  },

  getExtraBoneNames: (_0x1b7dec) =>
    (null == _0x1b7dec ? void 0x0 : _0x1b7dec["autoBone"])
      ? _0x1b7dec["autoBone"]["map"]((_0x4a18ba) => _0x4a18ba["rootBoneName"])
      : [],

  addExtraBone(_0x199aec, _0x3430a7) {
    if (!(null == _0x199aec ? void 0x0 : _0x199aec["autoBone"])) return !0x1;

    try {
      const _0x2fcb1d = new Fe(_0x3430a7, _0x199aec);

      return (_0x199aec["autoBone"]["push"](_0x2fcb1d), !0x0);
    } catch {
      return !0x1;
    }
  },

  removeExtraBone: (_0xa5e8f1, _0x2b08b7) =>
    !(
      !(null == _0xa5e8f1 ? void 0x0 : _0xa5e8f1["autoBone"]) ||
      _0x2b08b7 < 0x0 ||
      _0x2b08b7 >= _0xa5e8f1["autoBone"]["length"]
    ) && (_0xa5e8f1["autoBone"]["splice"](_0x2b08b7, 0x1), !0x0),

  exportRuntimeExtra(_0x52b557) {
    if (!(null == _0x52b557 ? void 0x0 : _0x52b557["autoBone"])) return null;

    const _0x78c75c = {};

    for (const _0x691097 of _0x52b557["autoBone"]) {
      const _0x34a996 = {
        rootBoneName: _0x691097["rootBoneName"],

        endBoneName: _0x691097["endBoneName"],

        animation: {},
      };

      (_0x691097["targetBoneName"] &&
        (_0x34a996["targetBoneName"] = _0x691097["targetBoneName"]),
        _0x691097["targetEndBoneName"] &&
          (_0x34a996["targetEndBoneName"] = _0x691097["targetEndBoneName"]),
        0x1 !== _0x691097["targetWeight"] &&
          (_0x34a996["targetWeight"] = _0x691097["targetWeight"]));

      for (const [_0xf677e, _0x487eb7] of Object["entries"](
        _0x691097["animation"],
      )) {
        const _0x438a1e = _0x487eb7,
          _0x38f3f0 = {
            name: _0xf677e,

            mode: _0x438a1e["mode"] ?? 0x0,
          },
          _0x56c79b = this["getParamMeta"](_0x438a1e["mode"] ?? 0x0);

        for (const _0x1ab364 of _0x56c79b) {
          const _0x4c764c = _0x438a1e[_0x1ab364["key"]];

          "number" == typeof _0x4c764c &&
            (_0x38f3f0[_0x1ab364["key"]] = _0x4c764c);
        }

        for (const _0x3b5f77 of Object["keys"](_0x438a1e)) {
          if ("mode" === _0x3b5f77 || _0x3b5f77 in _0x38f3f0) continue;

          const _0x4e13d2 = _0x438a1e[_0x3b5f77];

          ("number" != typeof _0x4e13d2 &&
            "boolean" != typeof _0x4e13d2 &&
            "string" != typeof _0x4e13d2) ||
            (_0x38f3f0[_0x3b5f77] = _0x4e13d2);
        }

        _0x34a996["animation"][_0xf677e] = _0x38f3f0;
      }

      _0x78c75c[_0x691097["rootBoneName"]] = _0x34a996;
    }

    return _0x78c75c;
  },

  getParamMeta(_0xeb62b7) {
    switch (_0xeb62b7) {
      case 0x1:
        return [
          {
            key: "rotateOffset",

            label: "旋转偏移",

            min: -0x1,

            max: 0x1,

            step: 0.01,
          },

          {
            key: "rotateTime",

            label: "旋转周期",

            min: 0.1,

            max: 0xa,

            step: 0.1,
          },

          {
            key: "rotateRange",

            label: "旋转范围",

            min: 0x0,

            max: 0x5a,

            step: 0.5,
          },

          {
            key: "rotateCenter",

            label: "旋转中心",

            min: -0x5a,

            max: 0x5a,

            step: 0.5,
          },

          {
            key: "childOffset",

            label: "子级偏移",

            min: 0x0,

            max: 0x2,

            step: 0.05,
          },

          { key: "spring", label: "弹簧", min: 0x0, max: 0x1, step: 0.01 },

          {
            key: "affectByLevel",

            label: "层级影响",

            min: 0x0,

            max: 0x1,

            step: 0.01,
          },

          {
            key: "springLevel",

            label: "弹簧层级",

            min: 0x0,

            max: 0x1,

            step: 0.01,
          },

          {
            key: "scaleYRange",

            label: "Y缩放范围",

            min: 0x0,

            max: 0x2,

            step: 0.01,
          },

          {
            key: "scaleYTime",

            label: "Y缩放周期",

            min: 0.1,

            max: 0xa,

            step: 0.1,
          },

          {
            key: "scaleXRange",

            label: "X缩放范围",

            min: 0x0,

            max: 0x2,

            step: 0.01,
          },

          {
            key: "scaleXTime",

            label: "X缩放周期",

            min: 0.1,

            max: 0xa,

            step: 0.1,
          },

          {
            key: "moveXRange",

            label: "X移动范围",

            min: 0x0,

            max: 0x64,

            step: 0.5,
          },

          {
            key: "moveXTime",

            label: "X移动周期",

            min: 0.1,

            max: 0xa,

            step: 0.1,
          },

          {
            key: "moveYRange",

            label: "Y移动范围",

            min: 0x0,

            max: 0x64,

            step: 0.5,
          },

          {
            key: "moveYTime",

            label: "Y移动周期",

            min: 0.1,

            max: 0xa,

            step: 0.1,
          },
        ];

      case 0x2:
        return [
          { key: "delay", label: "延迟", min: 0x0, max: 0x2, step: 0.01 },

          { key: "speed", label: "速度", min: 0x0, max: 0x2, step: 0.01 },

          {
            key: "spring",

            label: "弹簧",

            min: 0x0,

            max: 0x1,

            step: 0.01,
          },

          {
            key: "affectByRange",

            label: "影响范围",

            min: 0x0,

            max: 0x5,

            step: 0.1,
          },

          {
            key: "affectByX",

            label: "X轴影响",

            min: 0x0,

            max: 0x5,

            step: 0.1,
          },

          {
            key: "affectByY",

            label: "Y轴影响",

            min: 0x0,

            max: 0x5,

            step: 0.1,
          },

          {
            key: "rotateMoveRange",

            label: "旋转移动范围",

            min: 0x0,

            max: 0x5,

            step: 0.1,
          },

          {
            key: "affectByLevel",

            label: "层级影响",

            min: 0x0,

            max: 0x1,

            step: 0.01,
          },

          {
            key: "springLevel",

            label: "弹簧层级",

            min: 0x0,

            max: 0x1,

            step: 0.01,
          },

          {
            key: "limitRange",

            label: "限制范围",

            min: 0x0,

            max: 0xb4,

            step: 0x1,
          },
        ];

      case 0x3:
        return [
          {
            key: "moveXFreq",

            label: "X移动频率",

            min: 0x0,

            max: 0xa,

            step: 0.1,
          },

          {
            key: "moveXAmp",

            label: "X移动振幅",

            min: 0x0,

            max: 0x32,

            step: 0.5,
          },

          {
            key: "moveXOctaves",

            label: "X移动倍频",

            min: 0x0,

            max: 0x5,

            step: 0x1,
          },

          {
            key: "moveXDelay",

            label: "X移动延迟",

            min: 0x0,

            max: 0x2,

            step: 0.01,
          },

          {
            key: "moveXCenter",

            label: "X移动中心",

            min: -0x32,

            max: 0x32,

            step: 0.5,
          },

          {
            key: "moveYFreq",

            label: "Y移动频率",

            min: 0x0,

            max: 0xa,

            step: 0.1,
          },

          {
            key: "moveYAmp",

            label: "Y移动振幅",

            min: 0x0,

            max: 0x32,

            step: 0.5,
          },

          {
            key: "moveYOctaves",

            label: "Y移动倍频",

            min: 0x0,

            max: 0x5,

            step: 0x1,
          },

          {
            key: "moveYDelay",

            label: "Y移动延迟",

            min: 0x0,

            max: 0x2,

            step: 0.01,
          },

          {
            key: "moveYCenter",

            label: "Y移动中心",

            min: -0x32,

            max: 0x32,

            step: 0.5,
          },

          {
            key: "rotateFreq",

            label: "旋转频率",

            min: 0x0,

            max: 0xa,

            step: 0.1,
          },

          {
            key: "rotateAmp",

            label: "旋转振幅",

            min: 0x0,

            max: 0x5a,

            step: 0.5,
          },

          {
            key: "rotateOctaves",

            label: "旋转倍频",

            min: 0x0,

            max: 0x5,

            step: 0x1,
          },

          {
            key: "rotateDelay",

            label: "旋转延迟",

            min: 0x0,

            max: 0x2,

            step: 0.01,
          },

          {
            key: "rotateCenter",

            label: "旋转中心",

            min: -0x5a,

            max: 0x5a,

            step: 0.5,
          },

          {
            key: "rotateSpeed",

            label: "旋转速度",

            min: 0x0,

            max: 0x5,

            step: 0.1,
          },

          {
            key: "rotateFollowLimit",

            label: "跟随限制",

            min: 0x0,

            max: 0x5a,

            step: 0x1,
          },

          {
            key: "rotateFollowSpeed",

            label: "跟随速度",

            min: 0x0,

            max: 0x2,

            step: 0.01,
          },

          {
            key: "scaleXFreq",

            label: "X缩放频率",

            min: 0x0,

            max: 0xa,

            step: 0.1,
          },

          {
            key: "scaleXAmp",

            label: "X缩放振幅",

            min: 0x0,

            max: 0x2,

            step: 0.01,
          },

          {
            key: "scaleYFreq",

            label: "Y缩放频率",

            min: 0x0,

            max: 0xa,

            step: 0.1,
          },

          {
            key: "scaleYAmp",

            label: "Y缩放振幅",

            min: 0x0,

            max: 0x2,

            step: 0.01,
          },
        ];

      case 0x4:
        return [
          {
            key: "delay",

            label: "延迟",

            min: 0x0,

            max: 0x2,

            step: 0.01,
          },

          {
            key: "speed",

            label: "速度",

            min: 0x0,

            max: 0x2,

            step: 0.01,
          },

          {
            key: "spring",

            label: "弹簧",

            min: 0x0,

            max: 0x1,

            step: 0.01,
          },

          {
            key: "springRot",

            label: "旋转弹簧",

            min: 0x0,

            max: 0x1,

            step: 0.01,
          },

          {
            key: "friction",

            label: "摩擦力",

            min: 0x0,

            max: 0x2,

            step: 0.01,
          },

          {
            key: "affectByLevel",

            label: "层级影响",

            min: 0x0,

            max: 0x1,

            step: 0.01,
          },

          {
            key: "springLevel",

            label: "弹簧层级",

            min: 0x0,

            max: 0x1,

            step: 0.01,
          },

          {
            key: "limitRange",

            label: "限制范围",

            min: 0x0,

            max: 0xb4,

            step: 0x1,
          },

          {
            key: "rotateOffset",

            label: "旋转偏移",

            min: -0x5a,

            max: 0x5a,

            step: 0.5,
          },

          {
            key: "windX",

            label: "风力X",

            min: -0xa,

            max: 0xa,

            step: 0.1,
          },

          {
            key: "windY",

            label: "风力Y",

            min: -0xa,

            max: 0xa,

            step: 0.1,
          },

          { key: "windFreq", label: "风力频率", min: 0x0, max: 0xa, step: 0.1 },

          {
            key: "windAccel",

            label: "风力加速",

            min: 0x0,

            max: 0x5,

            step: 0.1,
          },

          {
            key: "windDelay",

            label: "风力延迟",

            min: 0x0,

            max: 0x2,

            step: 0.01,
          },

          {
            key: "windOctaves",

            label: "风力倍频",

            min: 0x0,

            max: 0x5,

            step: 0x1,
          },

          {
            key: "gravityX",

            label: "重力X",

            min: -0x14,

            max: 0x14,

            step: 0.1,
          },

          {
            key: "gravityY",

            label: "重力Y",

            min: -0x14,

            max: 0x14,

            step: 0.1,
          },

          {
            key: "forceX",

            label: "力X",

            min: -0x32,

            max: 0x32,

            step: 0.1,

            readOnly: !0x0,
          },

          {
            key: "forceY",

            label: "力Y",

            min: -0x32,

            max: 0x32,

            step: 0.1,

            readOnly: !0x0,
          },
        ];

      case 0x5:
        return [
          {
            key: "elasticSpring",

            label: "弹性刚度X",

            min: 0x0,

            max: 0x2,

            step: 0.01,
          },

          {
            key: "elasticFriction",

            label: "弹性摩擦X",

            min: 0x0,

            max: 0x2,

            step: 0.01,
          },

          {
            key: "elasticSoftness",

            label: "弹性柔软度X",

            min: 0x0,

            max: 0x5,

            step: 0.1,
          },

          {
            key: "elasticSpringY",

            label: "弹性刚度Y",

            min: 0x0,

            max: 0x2,

            step: 0.01,
          },

          {
            key: "elasticFrictionY",

            label: "弹性摩擦Y",

            min: 0x0,

            max: 0x2,

            step: 0.01,
          },

          {
            key: "elasticSoftnessY",

            label: "弹性柔软度Y",

            min: 0x0,

            max: 0x5,

            step: 0.1,
          },
        ];

      case 0x6:
        return [
          { key: "delay", label: "延迟", min: 0x0, max: 0x5, step: 0.01 },
        ];

      default:
        return [];
    }
  },
};
export { Fe as ExtraBone, Le as ExtraSlot, Fr as ExtraConfig };
export function createDebugProvider() {
  return {
    ...Xr,
    _skeletonMeshes: new Set(),
    _frameData: new Map(),
    _highlightedMesh: null,
    _highlightedBoneIdx: -1,
  };
}
