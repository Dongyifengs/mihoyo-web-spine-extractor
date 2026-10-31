/*! Derived from the user-supplied spine_mirror.zip.
 * Copyright (c) 2024-2026 Dayu Network Technology (大于网络科技).
 * Original authors retain all rights. See DAYU-NOTICE.txt.
 */
function H(_0xc8ea86) {
  ((_0xc8ea86["style"]["overflow"] = "hidden"),
    (_0xc8ea86["style"]["maxHeight"] = "0"),
    (_0xc8ea86["style"]["opacity"] = "0"),
    (_0xc8ea86["style"]["display"] = ""),
    _0xc8ea86["offsetHeight"]);

  const _0x1e4cf7 = () => {
    ((_0xc8ea86["style"]["maxHeight"] = ""),
      (_0xc8ea86["style"]["overflow"] = ""),
      (_0xc8ea86["style"]["transition"] = ""),
      (_0xc8ea86["style"]["opacity"] = ""),
      _0xc8ea86["removeEventListener"]("transitionend", _0x1e4cf7));
  };

  (_0xc8ea86["addEventListener"]("transitionend", _0x1e4cf7, { once: !0x0 }),
    (_0xc8ea86["style"]["transition"] =
      "max-height 0.3s ease-out, opacity 0.2s ease-out"),
    (_0xc8ea86["style"]["maxHeight"] = _0xc8ea86["scrollHeight"] + "px"),
    (_0xc8ea86["style"]["opacity"] = "1"));
}

function D(_0x58d4c8) {
  return new Promise((_0x5815a1) => {
    ((_0x58d4c8["style"]["overflow"] = "hidden"),
      (_0x58d4c8["style"]["maxHeight"] = _0x58d4c8["scrollHeight"] + "px"),
      _0x58d4c8["offsetHeight"]);

    const _0x2d9a0f = () => {
      ((_0x58d4c8["style"]["maxHeight"] = ""),
        (_0x58d4c8["style"]["overflow"] = ""),
        (_0x58d4c8["style"]["transition"] = ""),
        (_0x58d4c8["style"]["opacity"] = ""),
        (_0x58d4c8["style"]["display"] = "none"),
        _0x58d4c8["removeEventListener"]("transitionend", _0x2d9a0f),
        _0x5815a1());
    };

    (_0x58d4c8["addEventListener"]("transitionend", _0x2d9a0f, { once: !0x0 }),
      (_0x58d4c8["style"]["transition"] =
        "max-height 0.25s ease-in, opacity 0.15s ease-in"),
      (_0x58d4c8["style"]["maxHeight"] = "0"),
      (_0x58d4c8["style"]["opacity"] = "0"));
  });
}

function $(_0x1886b7, _0x34cc63) {
  return _0x34cc63 ? (D(_0x1886b7), !0x1) : (H(_0x1886b7), !0x0);
}

class j {
  constructor(_0x2bd4ed, _0x42e6a9, _0x5df836) {
    ((this["_dragging"] = !0x1),
      (this["_offsetX"] = 0x0),
      (this["_offsetY"] = 0x0),
      (this["_panel"] = _0x2bd4ed),
      (this["_handle"] = _0x42e6a9),
      (this["_state"] = { ..._0x5df836 }),
      (this["_boundMove"] = this["_onMove"]["bind"](this)),
      (this["_boundEnd"] = this["_onEnd"]["bind"](this)),
      this["_applyPosition"](),
      this["_handle"]["addEventListener"](
        "mousedown",

        this["_onStart"]["bind"](this),
      ));
  }

  get ["position"]() {
    return { x: this["_state"]["x"], y: this["_state"]["y"] };
  }

  ["destroy"]() {
    (document["removeEventListener"]("mousemove", this["_boundMove"]),
      document["removeEventListener"]("mouseup", this["_boundEnd"]));
  }

  ["_onStart"](_0xe4c4ed) {
    ((this["_dragging"] = !0x0),
      (this["_offsetX"] = _0xe4c4ed["clientX"] - this["_state"]["x"]),
      (this["_offsetY"] = _0xe4c4ed["clientY"] - this["_state"]["y"]),
      document["addEventListener"]("mousemove", this["_boundMove"]),
      document["addEventListener"]("mouseup", this["_boundEnd"]));
  }

  ["_onMove"](_0x1b23ce) {
    this["_dragging"] &&
      ((this["_state"]["x"] = Math["max"](
        0x0,

        _0x1b23ce["clientX"] - this["_offsetX"],
      )),
      (this["_state"]["y"] = Math["max"](
        0x0,

        _0x1b23ce["clientY"] - this["_offsetY"],
      )),
      this["_applyPosition"]());
  }

  ["_onEnd"]() {
    ((this["_dragging"] = !0x1),
      document["removeEventListener"]("mousemove", this["_boundMove"]),
      document["removeEventListener"]("mouseup", this["_boundEnd"]));
  }

  ["_applyPosition"]() {
    ((this["_panel"]["style"]["left"] = this["_state"]["x"] + "px"),
      (this["_panel"]["style"]["top"] = this["_state"]["y"] + "px"));
  }
}

const F = {
  0x0: "无",

  0x1: "正弦波动",

  0x2: "物理跟随",

  0x3: "随机抖动",

  0x4: "风力与重力",

  0x5: "弹性效果",

  0x6: "关键帧",
};

const V = {
  0x0: "#888",

  0x1: "#4ecdc4",

  0x2: "#ff9f43",

  0x3: "#a29bfe",

  0x4: "#fd79a8",

  0x5: "#00b894",

  0x6: "#6c5ce7",
};

const q = "大于 Spine 调试面板";

const K = "个网格";

const U = "个骨骼";

const W = "AutoBone 物理效果";

const J = "透明度";

const Q = "骨骼线粗细";

const Z = "等待骨骼网格数据...";

const G = "展开面板";

const ee = "折叠面板";

const te = "动画";

const ne = "速度X";

const ae = "速度Y";

const oe = "力X";

const re = "力Y";

const ie = "弹力X";

const se = "弹力Y";

const le = "旋转Δ";

const de = "模式";

const ce = "未知";

const he = "当前动画";

function fe(_0x3a9d4d, _0x121607) {
  const _0x336b51 = document["createElement"]("canvas");

  return (
    (_0x336b51["style"]["display"] = "block"),
    (_0x336b51["style"]["borderRadius"] = "3px"),
    (_0x336b51["style"]["flexShrink"] = "0"),
    (_0x336b51["style"]["width"] = _0x3a9d4d + "px"),
    (_0x336b51["style"]["height"] = _0x121607 + "px"),
    _0x336b51
  );
}

function ge(_0x1c043f, _0x2b496e) {
  const _0x53b667 = _0x1c043f["getContext"]("2d");

  if (!_0x53b667) return;

  const {
      values: _0x34b18a,

      width: _0x4a1b7d,

      height: _0x55cecb,

      color: _0x2ef2d2,

      warnThreshold: _0x2c2eab = 0x1 / 0x0,

      warnColor: _0x2f1991 = "#ff6b6b",
    } = _0x2b496e,
    _0x36a623 = window["devicePixelRatio"] || 0x1;

  if (
    ((_0x1c043f["width"] = _0x4a1b7d * _0x36a623),
    (_0x1c043f["height"] = _0x55cecb * _0x36a623),
    _0x53b667["scale"](_0x36a623, _0x36a623),
    _0x53b667["clearRect"](0x0, 0x0, _0x4a1b7d, _0x55cecb),
    (_0x53b667["fillStyle"] = "rgba(0, 0, 0, 0.2)"),
    _0x53b667["beginPath"](),
    _0x53b667["roundRect"](0x0, 0x0, _0x4a1b7d, _0x55cecb, 0x3),
    _0x53b667["fill"](),
    _0x34b18a["length"] < 0x2)
  )
    return;

  const _0x15d6e6 = Math["max"](
      ..._0x34b18a["map"](Math["abs"]),

      0.001,
    ),
    _0x35c939 = _0x55cecb / 0x2,
    _0x3b3ae1 = _0x4a1b7d / (_0x34b18a["length"] - 0x1);

  ((_0x53b667["strokeStyle"] = "rgba(255,255,255,0.08)"),
    (_0x53b667["lineWidth"] = 0.5),
    _0x53b667["beginPath"](),
    _0x53b667["moveTo"](0x0, _0x35c939),
    _0x53b667["lineTo"](_0x4a1b7d, _0x35c939),
    _0x53b667["stroke"](),
    _0x53b667["beginPath"](),
    (_0x53b667["lineWidth"] = 1.5),
    (_0x53b667["lineJoin"] = "round"));

  for (let _0x44387a = 0x0; _0x44387a < _0x34b18a["length"]; _0x44387a++) {
    const _0x575074 = _0x44387a * _0x3b3ae1,
      _0xa5ee9c =
        _0x35c939 - (_0x34b18a[_0x44387a] / _0x15d6e6) * (_0x35c939 - 0x2);

    0x0 === _0x44387a
      ? _0x53b667["moveTo"](_0x575074, _0xa5ee9c)
      : _0x53b667["lineTo"](_0x575074, _0xa5ee9c);
  }

  const _0x2db359 =
    Math["abs"](_0x34b18a[_0x34b18a["length"] - 0x1]) > _0x2c2eab
      ? _0x2f1991
      : _0x2ef2d2;

  ((_0x53b667["strokeStyle"] = _0x2db359), _0x53b667["stroke"]());

  const _0x12a1c0 = _0x53b667["createLinearGradient"](0x0, 0x0, 0x0, _0x55cecb);

  (_0x12a1c0["addColorStop"](
    0x0,

    _0x2db359["replace"](")", ", 0.15)")["replace"](
      "rgb",

      "rgba",
    ),
  ),
    _0x12a1c0["addColorStop"](0x1, "transparent"),
    _0x53b667["lineTo"](
      (_0x34b18a["length"] - 0x1) * _0x3b3ae1,

      _0x35c939,
    ),
    _0x53b667["lineTo"](0x0, _0x35c939),
    _0x53b667["closePath"](),
    (_0x53b667["fillStyle"] = _0x12a1c0),
    _0x53b667["fill"]());
}

const ye = "dayu-spine-debug-styles";

let ve = 0x0;

const xe =
  "\n/* ============================================================\n * 大于 Spine 调试面板 — 全局样式\n * Copyright (c) 2024-2026 Dayu Network Technology (大于网络科技)\n * ============================================================ */\n\n.dayu-panel {\n  position: fixed;\n  z-index: 99999;\n  width: 380px;\n  max-height: 85vh;\n  display: flex;\n  flex-direction: column;\n  border-radius: 10px;\n  overflow: hidden;\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.06);\n  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', 'Microsoft YaHei', monospace;\n  font-size: 12px;\n  color: #e0e0e0;\n  backdrop-filter: blur(16px);\n  background: rgba(22, 27, 34, 0.94);\n  user-select: none;\n}\n\n/* --- 顶部标题栏 --- */\n.dayu-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 8px 12px;\n  background: rgba(255, 255, 255, 0.04);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n  cursor: grab;\n}\n.dayu-header:active { cursor: grabbing; }\n\n.dayu-header-left {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n.dayu-header-icon {\n  width: 22px;\n  height: 22px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 5px;\n  background: linear-gradient(135deg, #4ecdc4, #556270);\n  color: #fff;\n}\n\n.dayu-header-title {\n  font-weight: 600;\n  font-size: 13px;\n  letter-spacing: 0.5px;\n  color: #fff;\n}\n\n.dayu-header-badge {\n  font-size: 10px;\n  padding: 1px 6px;\n  border-radius: 8px;\n  background: rgba(78, 205, 196, 0.15);\n  color: #4ecdc4;\n  white-space: nowrap;\n}\n\n.dayu-header-right {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n}\n\n.dayu-collapse-caret {\n  display: inline-block;\n  transition: transform 0.25s ease;\n}\n.dayu-collapse-caret.dayu-collapsed {\n  transform: rotate(-90deg);\n}\n\n.dayu-icon-btn {\n  width: 24px;\n  height: 24px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border: none;\n  background: rgba(255, 255, 255, 0.06);\n  color: #999;\n  border-radius: 5px;\n  cursor: pointer;\n  font-size: 10px;\n  transition: all 0.15s;\n}\n.dayu-icon-btn:hover {\n  background: rgba(255, 255, 255, 0.12);\n  color: #fff;\n}\n\n/* --- 页签栏 --- */\n.dayu-tab-bar {\n  display: flex;\n  gap: 0;\n  background: rgba(255, 255, 255, 0.02);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n}\n\n.dayu-tab-btn {\n  flex: 1;\n  padding: 7px 12px;\n  border: none;\n  background: transparent;\n  color: #888;\n  font-size: 12px;\n  font-weight: 500;\n  cursor: pointer;\n  border-bottom: 2px solid transparent;\n  transition: all 0.2s;\n  font-family: inherit;\n}\n.dayu-tab-btn:hover {\n  color: #ccc;\n  background: rgba(255, 255, 255, 0.03);\n}\n.dayu-tab-btn.dayu-tab-active {\n  color: #4ecdc4;\n  border-bottom-color: #4ecdc4;\n}\n\n.dayu-tab-host {\n  flex: 1;\n  overflow: hidden;\n  display: flex;\n  flex-direction: column;\n  min-height: 0;\n}\n\n/* --- 面板主体 --- */\n.dayu-body {\n  overflow-y: auto;\n  flex: 1;\n  padding-bottom: 6px;\n}\n.dayu-body::-webkit-scrollbar { width: 5px; }\n.dayu-body::-webkit-scrollbar-track { background: transparent; }\n.dayu-body::-webkit-scrollbar-thumb {\n  background: rgba(255, 255, 255, 0.1);\n  border-radius: 3px;\n}\n\n/* --- 工具栏 --- */\n.dayu-toolbar {\n  padding: 8px 12px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n\n.dayu-toolbar-row {\n  display: flex;\n  align-items: center;\n}\n\n.dayu-toggle-label {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  width: 100%;\n  cursor: pointer;\n}\n\n.dayu-toggle-text {\n  font-weight: 500;\n  font-size: 12px;\n}\n\n.dayu-toggle-btn {\n  position: relative;\n  width: 38px;\n  height: 20px;\n  border-radius: 10px;\n  border: none;\n  background: #444;\n  cursor: pointer;\n  transition: background 0.2s;\n  padding: 0;\n}\n.dayu-toggle-btn.dayu-active { background: #4ecdc4; }\n\n.dayu-toggle-knob {\n  position: absolute;\n  top: 2px;\n  left: 2px;\n  width: 16px;\n  height: 16px;\n  border-radius: 50%;\n  background: #fff;\n  transition: transform 0.2s;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);\n}\n.dayu-toggle-btn.dayu-active .dayu-toggle-knob {\n  transform: translateX(18px);\n}\n\n.dayu-slider-label {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  width: 100%;\n  gap: 10px;\n}\n\n.dayu-slider-text {\n  font-size: 11px;\n  color: #999;\n  flex-shrink: 0;\n}\n\n.dayu-scale-value {\n  font-size: 10px;\n  color: #aaa;\n  min-width: 28px;\n  text-align: right;\n  flex-shrink: 0;\n}\n\n.dayu-slider {\n  flex: 1;\n  height: 3px;\n  -webkit-appearance: none;\n  appearance: none;\n  background: rgba(255, 255, 255, 0.12);\n  border-radius: 2px;\n  outline: none;\n}\n.dayu-slider::-webkit-slider-thumb {\n  -webkit-appearance: none;\n  width: 12px;\n  height: 12px;\n  border-radius: 50%;\n  background: #4ecdc4;\n  cursor: pointer;\n}\n\n/* --- 空状态 --- */\n.dayu-empty {\n  padding: 24px;\n  text-align: center;\n  color: #666;\n  font-size: 11px;\n}\n\n/* --- 调试页签搜索栏（吸顶） --- */\n.dayu-debug-search-bar {\n  position: sticky;\n  top: 0;\n  z-index: 10;\n  padding: 6px 12px;\n  background: rgba(22, 27, 34, 0.96);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n  backdrop-filter: blur(8px);\n}\n\n.dayu-debug-search-input {\n  width: 100%;\n  box-sizing: border-box;\n  padding: 5px 10px;\n  font-size: 11px;\n  font-family: inherit;\n  color: #ddd;\n  background: rgba(0, 0, 0, 0.3);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 5px;\n  outline: none;\n  transition: border-color 0.2s, box-shadow 0.2s;\n}\n.dayu-debug-search-input::placeholder { color: #666; }\n.dayu-debug-search-input:focus {\n  border-color: #4ecdc4;\n  box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.15);\n}\n\n/* --- 已隐藏标记 --- */\n.dayu-hidden-badge {\n  font-size: 9px;\n  padding: 1px 5px;\n  border-radius: 4px;\n  background: rgba(255, 68, 68, 0.15);\n  color: #ff6b6b;\n  white-space: nowrap;\n  flex-shrink: 0;\n}\n\n/* --- 网格区段 --- */\n.dayu-mesh-section {\n  border-bottom: 1px solid rgba(255, 255, 255, 0.04);\n}\n\n.dayu-mesh-header {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  padding: 7px 12px;\n  cursor: pointer;\n  transition: background 0.1s;\n  position: sticky;\n  top: 35px;\n  z-index: 5;\n  background: rgba(22, 27, 34, 0.96);\n  backdrop-filter: blur(8px);\n}\n.dayu-mesh-header:hover { background: rgba(255, 255, 255, 0.03); }\n\n.dayu-caret {\n  display: inline-block;\n  font-size: 9px;\n  color: #666;\n  width: 12px;\n  transition: transform 0.25s ease;\n}\n.dayu-caret.dayu-expanded { transform: rotate(90deg); }\n.dayu-caret.dayu-small { font-size: 8px; width: 10px; }\n\n.dayu-mesh-name {\n  font-weight: 500;\n  color: #ddd;\n  font-size: 12px;\n}\n\n.dayu-mesh-badge {\n  margin-left: auto;\n  font-size: 10px;\n  color: #666;\n  white-space: nowrap;\n}\n\n.dayu-mesh-body { padding-left: 8px; }\n\n/* --- 动画切换下拉框 --- */\n.dayu-anim-row {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 5px 8px 6px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.04);\n}\n\n.dayu-anim-label {\n  font-size: 10px;\n  color: #888;\n  flex-shrink: 0;\n  white-space: nowrap;\n}\n\n.dayu-select-wrap {\n  position: relative;\n  flex: 1;\n  min-width: 0;\n}\n\n.dayu-anim-select {\n  width: 100%;\n  padding: 4px 22px 4px 8px;\n  font-size: 11px;\n  font-family: inherit;\n  color: #ddd;\n  background: rgba(0, 0, 0, 0.3);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 5px;\n  outline: none;\n  cursor: pointer;\n  appearance: none;\n  -webkit-appearance: none;\n  transition: border-color 0.2s, box-shadow 0.2s;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.dayu-anim-select:hover {\n  border-color: rgba(78, 205, 196, 0.4);\n}\n.dayu-anim-select:focus {\n  border-color: #4ecdc4;\n  box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.15);\n}\n.dayu-anim-select option {\n  background: #1e232c;\n  color: #ddd;\n  padding: 4px 8px;\n}\n\n.dayu-select-arrow {\n  position: absolute;\n  right: 6px;\n  top: 50%;\n  transform: translateY(-50%);\n  color: #666;\n  font-size: 10px;\n  pointer-events: none;\n  transition: color 0.2s;\n}\n.dayu-select-wrap:hover .dayu-select-arrow { color: #4ecdc4; }\n\n/* --- 骨骼区段 --- */\n.dayu-bone-section {\n  border-left: 2px solid rgba(255, 255, 255, 0.04);\n  margin-left: 10px;\n  transition: background 0.15s, border-color 0.15s;\n}\n.dayu-bone-section:hover {\n  background: rgba(255, 68, 68, 0.06);\n  border-left-color: rgba(255, 68, 68, 0.5);\n}\n\n.dayu-bone-header {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  padding: 5px 8px;\n  cursor: pointer;\n  transition: background 0.1s;\n}\n.dayu-bone-header:hover { background: rgba(255, 255, 255, 0.03); }\n\n.dayu-bone-name {\n  font-size: 11px;\n  color: #bbb;\n}\n\n.dayu-mode-tag {\n  font-size: 9px;\n  padding: 1px 6px;\n  border-radius: 6px;\n  color: #fff;\n  font-weight: 500;\n  white-space: nowrap;\n}\n\n.dayu-bone-body {\n  padding: 2px 8px 6px 18px;\n  display: flex;\n  flex-direction: column;\n  gap: 3px;\n}\n\n/* --- 数据行 --- */\n.dayu-stat-row {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  height: 26px;\n}\n\n.dayu-stat-label {\n  width: 52px;\n  font-size: 10px;\n  color: #777;\n  flex-shrink: 0;\n}\n\n.dayu-stat-value {\n  width: 64px;\n  font-size: 11px;\n  flex-shrink: 0;\n}\n.dayu-stat-value.dayu-mono {\n  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;\n  color: #ccc;\n}\n.dayu-stat-value.dayu-track {\n  color: #a29bfe;\n  font-weight: 500;\n}\n\n/* --- 迷你折线图 --- */\n.dayu-sparkline {\n  display: block;\n  border-radius: 3px;\n  flex-shrink: 0;\n}\n\n/* --- 编辑按钮 --- */\n.dayu-edit-btn {\n  margin-left: auto;\n  width: 22px;\n  height: 22px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border: none;\n  background: rgba(255, 255, 255, 0.06);\n  color: #888;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: all 0.15s;\n  flex-shrink: 0;\n}\n.dayu-edit-btn:hover {\n  background: rgba(78, 205, 196, 0.2);\n  color: #4ecdc4;\n}\n\n/* --- 参数编辑面板 --- */\n.dayu-param-editor {\n  margin: 4px 0 6px 0;\n  padding: 6px 8px;\n  background: rgba(255, 255, 255, 0.03);\n  border-radius: 6px;\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  transition: max-height 0.3s ease, opacity 0.2s ease;\n}\n\n.dayu-reset-btn {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 4px;\n  margin-top: 4px;\n  padding: 4px 10px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 4px;\n  background: rgba(255, 255, 255, 0.04);\n  color: #999;\n  font-size: 10px;\n  font-family: inherit;\n  cursor: pointer;\n  transition: all 0.15s;\n}\n.dayu-reset-btn:hover {\n  background: rgba(255, 168, 68, 0.15);\n  border-color: rgba(255, 168, 68, 0.4);\n  color: #ffa844;\n}\n\n.dayu-param-row {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  height: 24px;\n}\n\n.dayu-param-label {\n  width: 72px;\n  font-size: 10px;\n  color: #999;\n  flex-shrink: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.dayu-param-slider {\n  flex: 1;\n  height: 3px;\n  -webkit-appearance: none;\n  appearance: none;\n  background: rgba(255, 255, 255, 0.12);\n  border-radius: 2px;\n  outline: none;\n  min-width: 60px;\n}\n.dayu-param-slider::-webkit-slider-thumb {\n  -webkit-appearance: none;\n  width: 10px;\n  height: 10px;\n  border-radius: 50%;\n  background: #4ecdc4;\n  cursor: pointer;\n}\n.dayu-param-slider:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n\n.dayu-param-input {\n  width: 56px;\n  padding: 2px 4px;\n  font-size: 10px;\n  font-family: inherit;\n  color: #ddd;\n  background: rgba(0, 0, 0, 0.3);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 3px;\n  text-align: right;\n  outline: none;\n  cursor: ew-resize;\n  flex-shrink: 0;\n}\n.dayu-param-input:focus {\n  cursor: text;\n  border-color: #4ecdc4;\n}\n.dayu-param-input[readonly] {\n  opacity: 0.5;\n  cursor: default;\n}\n\n/* --- 模型管理 --- */\n.dayu-model-search-bar {\n  padding: 0 0 6px;\n  position: sticky;\n  top: 0;\n  z-index: 5;\n  background: inherit;\n}\n\n.dayu-model-mgr {\n  padding: 8px;\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  overflow-y: auto;\n  flex: 1;\n}\n.dayu-model-mgr::-webkit-scrollbar { width: 5px; }\n.dayu-model-mgr::-webkit-scrollbar-thumb {\n  background: rgba(255, 255, 255, 0.1);\n  border-radius: 3px;\n}\n\n.dayu-model-list {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.dayu-model-row {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 6px 8px;\n  background: rgba(255, 255, 255, 0.03);\n  border-radius: 6px;\n  border: 1px solid rgba(255, 255, 255, 0.04);\n  transition: background 0.15s;\n}\n.dayu-model-row:hover { background: rgba(255, 255, 255, 0.06); }\n\n.dayu-model-left {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  overflow: hidden;\n  flex: 1;\n  min-width: 0;\n}\n\n/* --- 可见性开关 --- */\n.dayu-visibility-toggle {\n  position: relative;\n  display: inline-block;\n  width: 32px;\n  height: 18px;\n  flex-shrink: 0;\n  cursor: pointer;\n}\n.dayu-visibility-toggle input {\n  opacity: 0;\n  width: 0;\n  height: 0;\n  position: absolute;\n}\n.dayu-toggle-slider {\n  position: absolute;\n  inset: 0;\n  background: rgba(255, 255, 255, 0.15);\n  border-radius: 9px;\n  transition: background 0.2s;\n}\n.dayu-toggle-slider::before {\n  content: '';\n  position: absolute;\n  width: 14px;\n  height: 14px;\n  left: 2px;\n  bottom: 2px;\n  background: #999;\n  border-radius: 50%;\n  transition: transform 0.2s, background 0.2s;\n}\n.dayu-visibility-toggle input:checked + .dayu-toggle-slider {\n  background: rgba(64, 158, 255, 0.5);\n}\n.dayu-visibility-toggle input:checked + .dayu-toggle-slider::before {\n  transform: translateX(14px);\n  background: #409eff;\n}\n\n.dayu-model-info {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  overflow: hidden;\n}\n\n.dayu-model-name {\n  font-size: 12px;\n  font-weight: 500;\n  color: #ddd;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.dayu-model-stats {\n  font-size: 10px;\n  color: #777;\n}\n\n.dayu-model-actions {\n  display: flex;\n  gap: 4px;\n  flex-shrink: 0;\n}\n\n.dayu-model-action-btn {\n  padding: 3px 8px;\n  font-size: 10px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 4px;\n  background: rgba(255, 255, 255, 0.04);\n  color: #bbb;\n  cursor: pointer;\n  transition: all 0.15s;\n  font-family: inherit;\n}\n.dayu-model-action-btn:hover {\n  background: rgba(255, 255, 255, 0.1);\n  color: #fff;\n}\n.dayu-btn-del:hover {\n  background: rgba(255, 68, 68, 0.2);\n  border-color: rgba(255, 68, 68, 0.4);\n  color: #ff6b6b;\n}\n.dayu-btn-active {\n  background: rgba(78, 205, 196, 0.2) !important;\n  border-color: rgba(78, 205, 196, 0.5) !important;\n  color: #4ecdc4 !important;\n}\n\n.dayu-model-row-wrapper {\n  display: flex;\n  flex-direction: column;\n  gap: 0;\n}\n\n/* When transform editor is shown, connect the row and editor visually */\n.dayu-model-row-wrapper:has(.dayu-transform-editor) > .dayu-model-row {\n  border-bottom-left-radius: 0;\n  border-bottom-right-radius: 0;\n  border-bottom-color: transparent;\n}\n\n.dayu-transform-editor {\n  margin: 0;\n  border-top: none;\n  border-top-left-radius: 0;\n  border-top-right-radius: 0;\n  padding-bottom: 8px;\n}\n\n.dayu-model-add-btn {\n  padding: 8px;\n  border: 1px dashed rgba(255, 255, 255, 0.15);\n  border-radius: 6px;\n  background: transparent;\n  color: #888;\n  font-size: 12px;\n  cursor: pointer;\n  transition: all 0.2s;\n  font-family: inherit;\n}\n.dayu-model-add-btn:hover {\n  border-color: #4ecdc4;\n  color: #4ecdc4;\n  background: rgba(78, 205, 196, 0.06);\n}\n\n/* --- 上传区域 --- */\n.dayu-upload-area {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.dayu-upload-label {\n  font-size: 11px;\n  font-weight: 500;\n  color: #ccc;\n}\n\n.dayu-upload-dropzone {\n  min-height: 48px;\n  border: 1px dashed rgba(255, 255, 255, 0.15);\n  border-radius: 6px;\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: center;\n  gap: 4px;\n  padding: 10px;\n  cursor: pointer;\n  transition: all 0.2s;\n}\n.dayu-upload-dropzone:hover,\n.dayu-upload-dragover {\n  border-color: #4ecdc4;\n  background: rgba(78, 205, 196, 0.06);\n}\n\n.dayu-upload-hint {\n  font-size: 11px;\n  color: #666;\n}\n\n.dayu-upload-filelist {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px;\n}\n\n.dayu-upload-file-tag {\n  padding: 2px 8px;\n  background: rgba(78, 205, 196, 0.12);\n  color: #4ecdc4;\n  border-radius: 4px;\n  font-size: 10px;\n  max-width: 160px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* --- 模态弹窗 --- */\n.dayu-modal-overlay {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  background: rgba(0, 0, 0, 0.5);\n  z-index: 100000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  opacity: 0;\n  transition: opacity 0.2s ease;\n}\n.dayu-modal-overlay.dayu-modal-visible { opacity: 1; }\n\n.dayu-modal-dialog {\n  background: rgba(30, 35, 44, 0.98);\n  border-radius: 10px;\n  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', 'Microsoft YaHei', monospace;\n  font-size: 12px;\n  color: #e0e0e0;\n  transform: scale(0.95);\n  transition: transform 0.2s ease;\n}\n.dayu-modal-visible .dayu-modal-dialog { transform: scale(1); }\n\n.dayu-modal-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 10px 16px;\n  background: rgba(255, 255, 255, 0.04);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n}\n\n.dayu-modal-title {\n  font-size: 14px;\n  font-weight: 600;\n  color: #fff;\n}\n\n.dayu-modal-close {\n  width: 28px;\n  height: 28px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border: none;\n  background: rgba(255, 255, 255, 0.06);\n  color: #999;\n  border-radius: 6px;\n  cursor: pointer;\n  font-size: 14px;\n  transition: all 0.15s;\n}\n.dayu-modal-close:hover {\n  background: rgba(255, 68, 68, 0.2);\n  color: #ff6b6b;\n}\n\n.dayu-modal-body {\n  flex: 1;\n  overflow-y: auto;\n  padding: 12px;\n}\n.dayu-modal-body::-webkit-scrollbar { width: 5px; }\n.dayu-modal-body::-webkit-scrollbar-thumb {\n  background: rgba(255, 255, 255, 0.1);\n  border-radius: 3px;\n}\n\n.dayu-modal-tab-content {\n  flex: 1;\n  padding: 8px;\n  overflow-y: auto;\n}\n.dayu-modal-tab-content::-webkit-scrollbar { width: 5px; }\n.dayu-modal-tab-content::-webkit-scrollbar-thumb {\n  background: rgba(255, 255, 255, 0.1);\n  border-radius: 3px;\n}\n\n/* --- JSON 树 --- */\n.dayu-tree { font-size: 11px; line-height: 1.6; }\n\n.dayu-tree-leaf { padding: 1px 0; }\n\n.dayu-tree-header {\n  cursor: pointer;\n  padding: 1px 0;\n  border-radius: 3px;\n  transition: background 0.1s;\n}\n.dayu-tree-header:hover { background: rgba(255, 255, 255, 0.05); }\n\n.dayu-tree-caret {\n  display: inline-block;\n  width: 12px;\n  font-size: 8px;\n  color: #666;\n  transition: transform 0.2s;\n  text-align: center;\n}\n.dayu-tree-caret-open { transform: rotate(90deg); }\n\n.dayu-tree-key { color: #e06c75; }\n.dayu-tree-type { color: #666; font-size: 10px; margin-left: 4px; }\n.dayu-tree-val { }\n.dayu-tree-str { color: #98c379; }\n.dayu-tree-num { color: #61afef; }\n.dayu-tree-bool { color: #d19a66; }\n.dayu-tree-null { color: #666; font-style: italic; }\n\n.dayu-tree-children { }\n\n/* --- Atlas 查看器 --- */\n.dayu-atlas-viewer {\n  display: flex;\n  gap: 12px;\n  height: 100%;\n  min-height: 300px;\n}\n\n.dayu-atlas-tree {\n  width: 240px;\n  flex-shrink: 0;\n  overflow-y: auto;\n  border-right: 1px solid rgba(255, 255, 255, 0.06);\n  padding-right: 8px;\n}\n.dayu-atlas-tree::-webkit-scrollbar { width: 4px; }\n.dayu-atlas-tree::-webkit-scrollbar-thumb {\n  background: rgba(255, 255, 255, 0.1);\n  border-radius: 2px;\n}\n\n.dayu-atlas-preview {\n  flex: 1;\n  position: relative;\n  overflow: auto;\n  display: flex;\n  align-items: flex-start;\n  justify-content: center;\n}\n\n.dayu-atlas-img {\n  max-width: 100%;\n  image-rendering: pixelated;\n}\n\n.dayu-atlas-canvas {\n  position: absolute;\n  top: 0;\n  left: 50%;\n  transform: translateX(-50%);\n  pointer-events: none;\n  max-width: 100%;\n}\n\n.dayu-atlas-page-header {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  cursor: pointer;\n  padding: 4px 4px;\n  border-radius: 4px;\n  font-weight: 500;\n  transition: background 0.1s;\n}\n.dayu-atlas-page-header:hover { background: rgba(255, 255, 255, 0.05); }\n\n.dayu-atlas-page-name { font-size: 11px; color: #ddd; }\n\n.dayu-atlas-region-list {\n  padding-left: 16px;\n}\n\n.dayu-atlas-region-item {\n  padding: 2px 6px;\n  font-size: 11px;\n  color: #aaa;\n  cursor: pointer;\n  border-radius: 3px;\n  transition: all 0.1s;\n}\n.dayu-atlas-region-item:hover {\n  background: rgba(255, 68, 68, 0.12);\n  color: #fff;\n}\n\n/* --- 图片网格 --- */\n.dayu-images-grid {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 10px;\n  padding: 8px;\n}\n\n.dayu-image-card {\n  width: 120px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 4px;\n}\n\n.dayu-image-thumb {\n  width: 120px;\n  height: 120px;\n  object-fit: contain;\n  background: rgba(0, 0, 0, 0.3);\n  border-radius: 6px;\n  cursor: pointer;\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  transition: border-color 0.15s;\n  image-rendering: pixelated;\n}\n.dayu-image-thumb:hover { border-color: #4ecdc4; }\n\n.dayu-image-label {\n  font-size: 10px;\n  color: #888;\n  text-align: center;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  width: 100%;\n}\n\n/* --- 导出弹窗 --- */\n.dayu-export-controls {\n  display: flex;\n  gap: 8px;\n  margin-bottom: 8px;\n}\n\n.dayu-export-ctrl-btn {\n  padding: 4px 10px;\n  font-size: 11px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 4px;\n  background: rgba(255, 255, 255, 0.04);\n  color: #bbb;\n  cursor: pointer;\n  transition: all 0.15s;\n  font-family: inherit;\n}\n.dayu-export-ctrl-btn:hover {\n  background: rgba(255, 255, 255, 0.1);\n  color: #fff;\n}\n\n.dayu-export-list {\n  max-height: 240px;\n  overflow-y: auto;\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  margin-bottom: 12px;\n}\n.dayu-export-list::-webkit-scrollbar { width: 4px; }\n.dayu-export-list::-webkit-scrollbar-thumb {\n  background: rgba(255, 255, 255, 0.1);\n  border-radius: 2px;\n}\n\n.dayu-export-row {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 6px 8px;\n  background: rgba(255, 255, 255, 0.03);\n  border-radius: 4px;\n  cursor: pointer;\n  transition: background 0.1s;\n}\n.dayu-export-row:hover { background: rgba(255, 255, 255, 0.06); }\n\n.dayu-export-detail {\n  font-size: 11px;\n  color: #ccc;\n}\n\n.dayu-export-progress {\n  margin-bottom: 10px;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n.dayu-export-progress-track {\n  flex: 1;\n  height: 6px;\n  background: rgba(255, 255, 255, 0.08);\n  border-radius: 3px;\n  overflow: hidden;\n}\n\n.dayu-export-progress-bar {\n  height: 100%;\n  background: linear-gradient(90deg, #4ecdc4, #556270);\n  border-radius: 3px;\n  transition: width 0.2s ease;\n  width: 0%;\n}\n\n.dayu-export-progress-text {\n  font-size: 10px;\n  color: #999;\n  min-width: 60px;\n  text-align: right;\n}\n\n.dayu-export-btn {\n  width: 100%;\n  padding: 8px;\n  border: none;\n  border-radius: 6px;\n  background: linear-gradient(135deg, #4ecdc4, #556270);\n  color: #fff;\n  font-size: 13px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: opacity 0.2s;\n  font-family: inherit;\n}\n.dayu-export-btn:hover { opacity: 0.9; }\n.dayu-export-btn:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n\n/* --- 确认弹窗按钮 --- */\n.dayu-confirm-cancel-btn,\n.dayu-confirm-ok-btn,\n.dayu-confirm-danger-btn {\n  flex: 1;\n  padding: 8px 16px;\n  border-radius: 6px;\n  border: none;\n  font-size: 12px;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.15s;\n  font-family: inherit;\n}\n\n.dayu-confirm-cancel-btn {\n  background: rgba(255, 255, 255, 0.08);\n  color: #aaa;\n}\n.dayu-confirm-cancel-btn:hover {\n  background: rgba(255, 255, 255, 0.14);\n  color: #fff;\n}\n\n.dayu-confirm-ok-btn {\n  background: linear-gradient(135deg, #4ecdc4, #556270);\n  color: #fff;\n}\n.dayu-confirm-ok-btn:hover { opacity: 0.9; }\n\n.dayu-confirm-danger-btn {\n  background: linear-gradient(135deg, #ff6b6b, #c44569);\n  color: #fff;\n}\n.dayu-confirm-danger-btn:hover { opacity: 0.9; }\n\n/* --- Toast 提示 --- */\n.dayu-toast {\n  position: fixed;\n  bottom: 32px;\n  left: 50%;\n  transform: translateX(-50%) translateY(20px);\n  padding: 8px 20px;\n  background: rgba(30, 35, 44, 0.95);\n  color: #fff;\n  border-radius: 8px;\n  font-size: 12px;\n  font-family: 'Microsoft YaHei', sans-serif;\n  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);\n  z-index: 100001;\n  opacity: 0;\n  transition: opacity 0.3s, transform 0.3s;\n  pointer-events: none;\n}\n.dayu-toast-visible {\n  opacity: 1;\n  transform: translateX(-50%) translateY(0);\n}\n\n/* --- 导出按钮（面板顶部） --- */\n.dayu-export-trigger {\n  padding: 3px 8px;\n  font-size: 10px;\n  border: 1px solid rgba(78, 205, 196, 0.3);\n  border-radius: 4px;\n  background: rgba(78, 205, 196, 0.1);\n  color: #4ecdc4;\n  cursor: pointer;\n  transition: all 0.15s;\n  font-family: inherit;\n}\n.dayu-export-trigger:hover {\n  background: rgba(78, 205, 196, 0.2);\n  border-color: #4ecdc4;\n}\n\n/* --- 全局滚动条美化（所有 dayu 容器） --- */\n.dayu-panel *::-webkit-scrollbar,\n.dayu-modal-overlay *::-webkit-scrollbar {\n  width: 5px;\n  height: 5px;\n}\n.dayu-panel *::-webkit-scrollbar-track,\n.dayu-modal-overlay *::-webkit-scrollbar-track {\n  background: transparent;\n}\n.dayu-panel *::-webkit-scrollbar-thumb,\n.dayu-modal-overlay *::-webkit-scrollbar-thumb {\n  background: rgba(255, 255, 255, 0.12);\n  border-radius: 3px;\n}\n.dayu-panel *::-webkit-scrollbar-thumb:hover,\n.dayu-modal-overlay *::-webkit-scrollbar-thumb:hover {\n  background: rgba(255, 255, 255, 0.22);\n}\n.dayu-panel *::-webkit-scrollbar-corner,\n.dayu-modal-overlay *::-webkit-scrollbar-corner {\n  background: transparent;\n}\n\n/* Firefox scrollbar */\n.dayu-panel *,\n.dayu-modal-overlay * {\n  scrollbar-width: thin;\n  scrollbar-color: rgba(255, 255, 255, 0.12) transparent;\n}\n\n/* --- 搜索高亮 --- */\n.dayu-search-match {\n  color: #4ecdc4;\n  font-weight: 700;\n  background: rgba(78, 205, 196, 0.15);\n  border-radius: 2px;\n  padding: 0 1px;\n}\n\n/* --- 删除骨骼按钮 --- */\n.dayu-bone-delete-btn {\n  width: 18px;\n  height: 18px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border: none;\n  background: transparent;\n  color: #666;\n  border-radius: 3px;\n  cursor: pointer;\n  font-size: 11px;\n  transition: all 0.15s;\n  flex-shrink: 0;\n  margin-left: 4px;\n}\n.dayu-bone-delete-btn:hover {\n  background: rgba(255, 68, 68, 0.2);\n  color: #ff6b6b;\n}\n";

function _e(_0x234e32, _0x59e9ad) {
  const _0x52fbd8 = document["createElement"]("div");

  _0x52fbd8["className"] = "dayu-param-row";

  const _0xdbe1a6 = document["createElement"]("span");

  ((_0xdbe1a6["className"] = "dayu-param-label"),
    (_0xdbe1a6["textContent"] = _0x234e32));

  const _0x110234 = document["createElement"]("input");

  ((_0x110234["type"] = "range"),
    (_0x110234["className"] = "dayu-param-slider"),
    (_0x110234["min"] = String(_0x59e9ad["min"])),
    (_0x110234["max"] = String(_0x59e9ad["max"])),
    (_0x110234["step"] = String(_0x59e9ad["step"])),
    (_0x110234["value"] = String(_0x59e9ad["value"])),
    _0x59e9ad["readOnly"] && (_0x110234["disabled"] = !0x0));

  const _0x191551 = document["createElement"]("input");

  ((_0x191551["type"] = "text"),
    (_0x191551["className"] = "dayu-param-input"),
    (_0x191551["value"] = we(_0x59e9ad["value"])),
    _0x59e9ad["readOnly"] && (_0x191551["readOnly"] = !0x0));

  let _0x29b076 = _0x59e9ad["value"];

  function _0x16f4ee(_0x3dff98, _0x195ae0 = !0x1) {
    ((_0x29b076 = (function (_0x2b8c10, _0x50ce56) {
      return Math["round"](_0x2b8c10 / _0x50ce56) * _0x50ce56;
    })(_0x3dff98, _0x59e9ad["step"])),
      (_0x191551["value"] = we(_0x29b076)),
      _0x195ae0 ||
        (_0x110234["value"] = String(
          Math["min"](
            _0x59e9ad["max"],

            Math["max"](_0x59e9ad["min"], _0x29b076),
          ),
        )),
      _0x59e9ad["onChange"](_0x29b076));
  }

  return (
    _0x110234["addEventListener"]("input", () => {
      _0x16f4ee(parseFloat(_0x110234["value"]), !0x0);
    }),
    _0x191551["addEventListener"]("keydown", (_0x21c86e) => {
      if ("Enter" === _0x21c86e["key"]) {
        const _0x1483da = parseFloat(_0x191551["value"]);

        (isNaN(_0x1483da) || _0x16f4ee(_0x1483da), _0x191551["blur"]());
      }
    }),
    _0x191551["addEventListener"]("blur", () => {
      const _0xd74d96 = parseFloat(_0x191551["value"]);

      isNaN(_0xd74d96)
        ? (_0x191551["value"] = we(_0x29b076))
        : _0x16f4ee(_0xd74d96);
    }),
    _0x59e9ad["readOnly"] ||
      (function (_0x31e72e, _0x30a0ec, _0x1a097a) {
        let _0x348440 = !0x1,
          _0x5bcf92 = 0x0,
          _0x34bd67 = 0x0;

        _0x31e72e["style"]["cursor"] = "ew-resize";

        const _0x4bd85e = (_0x3434b9) => {
            if (!_0x348440) return;

            const _0x56c0bd = _0x3434b9["clientX"] - _0x5bcf92;

            _0x5bcf92 = _0x3434b9["clientX"];

            const _0x421791 = _0x3434b9["shiftKey"] ? 0.1 : 0x1;

            if (
              ((_0x34bd67 += _0x56c0bd * _0x30a0ec * _0x421791),
              Math["abs"](_0x34bd67) >= _0x30a0ec)
            ) {
              const _0x2f4a4a = Math["trunc"](_0x34bd67 / _0x30a0ec);

              ((_0x34bd67 -= _0x2f4a4a * _0x30a0ec),
                _0x1a097a(_0x2f4a4a * _0x30a0ec));
            }
          },
          _0x48ab97 = () => {
            ((_0x348440 = !0x1),
              document["removeEventListener"]("mousemove", _0x4bd85e),
              document["removeEventListener"]("mouseup", _0x48ab97),
              (document["body"]["style"]["cursor"] = ""),
              (document["body"]["style"]["userSelect"] = ""));
          };

        _0x31e72e["addEventListener"]("mousedown", (_0x82c8b2) => {
          document["activeElement"] !== _0x31e72e &&
            (_0x82c8b2["preventDefault"](),
            (_0x348440 = !0x0),
            (_0x5bcf92 = _0x82c8b2["clientX"]),
            (_0x34bd67 = 0x0),
            (document["body"]["style"]["cursor"] = "ew-resize"),
            (document["body"]["style"]["userSelect"] = "none"),
            document["addEventListener"]("mousemove", _0x4bd85e),
            document["addEventListener"]("mouseup", _0x48ab97));
        });
      })(_0x191551, _0x59e9ad["step"], (_0xd4dc77) => {
        _0x16f4ee(_0x29b076 + _0xd4dc77);
      }),
    _0x52fbd8["append"](_0xdbe1a6, _0x110234, _0x191551),
    {
      row: _0x52fbd8,

      setValue: (_0x43b5db) => {
        // Live sampling must not overwrite an edit before Enter or blur commits it.
        if (document.activeElement === _0x191551 && !_0x191551.readOnly) return;
        ((_0x29b076 = _0x43b5db),
          (_0x191551["value"] = we(_0x43b5db)),
          (_0x110234["value"] = String(
            Math["min"](
              _0x59e9ad["max"],

              Math["max"](_0x59e9ad["min"], _0x43b5db),
            ),
          )));
      },
    }
  );
}

function we(_0x6f207e) {
  return Math["abs"](_0x6f207e) >= 0x64
    ? _0x6f207e["toFixed"](0x1)
    : Math["abs"](_0x6f207e) >= 0x1
      ? _0x6f207e["toFixed"](0x2)
      : _0x6f207e["toFixed"](0x3);
}

class Ee {
  constructor(_0x1fd8e3, _0x294340) {
    ((this["_panels"] = new Map()),
      (this["_provider"] = _0x1fd8e3),
      (this["_persistence"] = _0x294340));
  }

  ["_persistKey"](_0x243ea4, _0x5dcef1) {
    var _0x46026b, _0x31e7fc;

    return (
      (null == (_0x31e7fc = (_0x46026b = this["_provider"])["getModelHash"])
        ? void 0x0
        : _0x31e7fc["call"](_0x46026b, _0x243ea4)) || _0x5dcef1
    );
  }

  get ["supported"]() {
    return (
      "function" == typeof this["_provider"]["getExtraParams"] &&
      "function" == typeof this["_provider"]["setExtraParam"] &&
      "function" == typeof this["_provider"]["getParamMeta"]
    );
  }

  ["attachEditButton"](
    _0x22c962,

    _0x5b8696,

    _0x45a316,

    _0x295f93,

    _0x5096ec,

    _0x48d143,
  ) {
    if (!this["supported"]) return;

    const _0xc7b167 = document["createElement"]("button");

    ((_0xc7b167["className"] = "dayu-edit-btn"),
      (_0xc7b167["innerHTML"] =
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>'),
      (_0xc7b167["title"] = "编辑参数"),
      _0xc7b167["addEventListener"]("click", (_0x35755e) => {
        (_0x35755e["stopPropagation"](),
          this["_togglePanel"](
            _0x5b8696,

            _0x45a316,

            _0x295f93,

            _0x5096ec,

            _0x48d143,
          ));
      }),
      _0x22c962["appendChild"](_0xc7b167));
  }

  ["syncValues"](_0x27f32e, _0x519881, _0x14e720) {
    const _0xa2eab5 = _0x519881 + "__" + _0x14e720,
      _0x5e123c = this["_panels"]["get"](_0xa2eab5);

    if (!_0x5e123c || !_0x5e123c["expanded"]) return;

    const _0x24f7f3 = this["_provider"]["getExtraParams"](_0x27f32e, _0x14e720);

    if (_0x24f7f3) {
      for (const [_0x2c6cf3, _0x58bec7] of _0x5e123c["setters"])
        _0x2c6cf3 in _0x24f7f3 && _0x58bec7(_0x24f7f3[_0x2c6cf3]);
    }
  }

  ["destroy"]() {
    for (const [, _0x472904] of this["_panels"])
      _0x472904["container"]["remove"]();

    this["_panels"]["clear"]();
  }

  ["_restoreDefaults"](_0x268bd0, _0x3e23ef, _0x1e6e26, _0x2abc1d) {
    const _0x4ad064 = this["_panels"]["get"](_0x268bd0);

    if (_0x4ad064)
      for (const [_0x16872d, _0xd3572d] of _0x4ad064["defaults"]) {
        this["_provider"]["setExtraParam"](
          _0x3e23ef,

          _0x2abc1d,

          _0x16872d,

          _0xd3572d,
        );

        const _0x5e0091 = _0x4ad064["setters"]["get"](_0x16872d);

        (_0x5e0091 && _0x5e0091(_0xd3572d),
          this["_persistence"] &&
            this["_persistence"]["saveParam"](
              this["_persistKey"](_0x3e23ef, _0x1e6e26),

              _0x2abc1d,

              _0x16872d,

              _0xd3572d,
            ));
      }
  }

  ["_togglePanel"](_0x1c5f36, _0x19c9d9, _0x1a997d, _0x1c0bc4, _0x2f5e23) {
    const _0x299d81 = _0x1a997d + "__" + _0x1c0bc4,
      _0x453a8f = this["_panels"]["get"](_0x299d81);

    if (_0x453a8f)
      return (
        (_0x453a8f["expanded"] = !_0x453a8f["expanded"]),
        void (_0x453a8f["expanded"]
          ? H(_0x453a8f["container"])
          : D(_0x453a8f["container"]))
      );

    const _0x436028 = document["createElement"]("div");

    _0x436028["className"] = "dayu-param-editor";

    const _0x225b72 = this["_provider"]["getParamMeta"](_0x2f5e23),
      _0x28aaaa = this["_provider"]["getExtraParams"](
        _0x19c9d9,

        _0x1c0bc4,
      ),
      _0x1e88ea = new Map(),
      _0x46edd9 = new Map();

    for (const _0x40ef3f of _0x225b72) {
      const _0x2d7179 = _0x28aaaa ? (_0x28aaaa[_0x40ef3f["key"]] ?? 0x0) : 0x0;

      _0x46edd9["set"](_0x40ef3f["key"], _0x2d7179);

      const { row: _0x2c0296, setValue: _0x45517b } = _e(
        _0x40ef3f["label"],

        {
          value: _0x2d7179,

          min: _0x40ef3f["min"],

          max: _0x40ef3f["max"],

          step: _0x40ef3f["step"],

          readOnly: _0x40ef3f["readOnly"],

          onChange: (_0x2dc98c) => {
            _0x40ef3f["readOnly"] ||
              (this["_provider"]["setExtraParam"](
                _0x19c9d9,

                _0x1c0bc4,

                _0x40ef3f["key"],

                _0x2dc98c,
              ),
              this["_persistence"] &&
                this["_persistence"]["saveParam"](
                  this["_persistKey"](_0x19c9d9, _0x1a997d),

                  _0x1c0bc4,

                  _0x40ef3f["key"],

                  _0x2dc98c,
                ));
          },
        },
      );

      (_0x436028["appendChild"](_0x2c0296),
        _0x1e88ea["set"](_0x40ef3f["key"], _0x45517b));
    }

    const _0x2d0b7f = document["createElement"]("button");

    ((_0x2d0b7f["className"] = "dayu-reset-btn"),
      (_0x2d0b7f["innerHTML"] =
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg><span>恢复默认</span>'),
      _0x2d0b7f["addEventListener"]("click", (_0x2d35eb) => {
        (_0x2d35eb["stopPropagation"](),
          this["_restoreDefaults"](_0x299d81, _0x19c9d9, _0x1a997d, _0x1c0bc4));
      }),
      _0x436028["appendChild"](_0x2d0b7f),
      _0x1c5f36["appendChild"](_0x436028),
      this["_panels"]["set"](_0x299d81, {
        container: _0x436028,

        expanded: !0x0,

        setters: _0x1e88ea,

        defaults: _0x46edd9,
      }),
      (_0x436028["style"]["overflow"] = "hidden"),
      (_0x436028["style"]["maxHeight"] = "0"),
      (_0x436028["style"]["opacity"] = "0"),
      requestAnimationFrame(() => {
        H(_0x436028);
      }));
  }
}

const Le = "dayu-spine-debug";

class ke {
  constructor() {
    this["_data"] = this["_load"]();
  }

  ["saveParam"](_0x35b3e8, _0x117a02, _0x387465, _0x3031b9) {
    const _0x2cf60d = _0x35b3e8 + "__" + _0x117a02;

    (this["_data"]["params"][_0x2cf60d] ||
      (this["_data"]["params"][_0x2cf60d] = {}),
      (this["_data"]["params"][_0x2cf60d][_0x387465] = _0x3031b9),
      this["_save"]());
  }

  ["getAllParams"]() {
    return this["_data"]["params"];
  }

  ["getParamsForModel"](_0x116443, _0x413cb6) {
    const _0x4d74b9 = {},
      _0x29b6bf = [_0x116443, _0x413cb6]["filter"](Boolean);

    for (const [_0x149616, _0x3896b2] of Object["entries"](
      this["_data"]["params"],
    )) {
      const _0x44accf = _0x149616["split"]("__");

      _0x44accf["length"] < 0x2 ||
        (_0x29b6bf["includes"](_0x44accf[0x0]) &&
          (_0x4d74b9[_0x149616] = _0x3896b2));
    }

    return _0x4d74b9;
  }

  ["restoreParams"](_0x1770f8, _0x1ad123) {
    for (const [_0x4712b5, _0x1dfec4] of Object["entries"](
      this["_data"]["params"],
    )) {
      const _0x3f0c41 = _0x4712b5["split"]("__");

      if (_0x3f0c41["length"] < 0x2) continue;

      const _0x5ae33b = _0x3f0c41[0x0],
        _0x5a6d69 = parseInt(_0x3f0c41[0x1], 0xa);

      if (isNaN(_0x5a6d69)) continue;

      const _0xc014ee = _0x1ad123(_0x5ae33b);

      if (_0xc014ee) {
        for (const [_0xbdfe56, _0x187e82] of Object["entries"](_0x1dfec4))
          _0x1770f8(_0xc014ee, _0x5a6d69, _0xbdfe56, _0x187e82);
      }
    }
  }

  ["saveTransform"](_0xbf8c40, _0x593b83, _0xfb386c, _0x15c6f5) {
    ((this["_data"]["transforms"][_0xbf8c40] = {
      position: _0x593b83,

      scale: _0xfb386c,

      rotation: _0x15c6f5,
    }),
      this["_save"]());
  }

  ["getTransform"](_0xdff25e, _0xc13474) {
    return _0xdff25e && this["_data"]["transforms"][_0xdff25e]
      ? this["_data"]["transforms"][_0xdff25e]
      : (this["_data"]["transforms"][_0xc13474] ?? null);
  }

  ["getAllTransforms"]() {
    return this["_data"]["transforms"];
  }

  ["restoreTransforms"](_0x12bd58, _0x1b5aea, _0x2ee6e4) {
    for (const [_0x165943, _0x5a729d] of Object["entries"](
      this["_data"]["transforms"],
    )) {
      const _0x3d4e36 = _0x1b5aea(_0x165943);

      _0x3d4e36 &&
        (_0x12bd58(
          _0x3d4e36,

          _0x5a729d["position"],

          _0x5a729d["scale"],
        ),
        _0x2ee6e4 &&
          "number" == typeof _0x5a729d["rotation"] &&
          _0x2ee6e4(_0x3d4e36, _0x5a729d["rotation"]));
    }
  }

  ["saveCustomBone"](_0x4228cb, _0xa1348a, _0x4fd48c) {
    (this["_data"]["customBones"][_0x4228cb] ||
      (this["_data"]["customBones"][_0x4228cb] = {}),
      (this["_data"]["customBones"][_0x4228cb][_0xa1348a] = _0x4fd48c),
      this["_save"]());
  }

  ["removeCustomBone"](_0x1acd80, _0x280c3f) {
    this["_data"]["customBones"][_0x1acd80] &&
      (delete this["_data"]["customBones"][_0x1acd80][_0x280c3f],
      0x0 ===
        Object["keys"](this["_data"]["customBones"][_0x1acd80])["length"] &&
        delete this["_data"]["customBones"][_0x1acd80],
      this["_save"]());
  }

  ["removeParamsForBone"](_0x4bf4b0, _0x39440a) {
    const _0x2b10cd = _0x4bf4b0 + "__" + _0x39440a;

    this["_data"]["params"][_0x2b10cd] &&
      (delete this["_data"]["params"][_0x2b10cd], this["_save"]());
  }

  ["getCustomBones"](_0x3f8f72, _0x88b4f3) {
    const _0x5cfaf2 = {};

    return (
      _0x3f8f72 &&
        this["_data"]["customBones"][_0x3f8f72] &&
        Object["assign"](
          _0x5cfaf2,

          this["_data"]["customBones"][_0x3f8f72],
        ),
      this["_data"]["customBones"][_0x88b4f3] &&
        Object["assign"](
          _0x5cfaf2,

          this["_data"]["customBones"][_0x88b4f3],
        ),
      _0x5cfaf2
    );
  }

  ["clear"]() {
    ((this["_data"] = {
      version: 0x2,

      params: {},

      transforms: {},

      customBones: {},
    }),
      this["_save"]());
  }

  ["_load"]() {
    try {
      const _0x46ec98 = localStorage["getItem"](Le);

      if (!_0x46ec98)
        return { version: 0x2, params: {}, transforms: {}, customBones: {} };

      const _0x221eb0 = JSON["parse"](_0x46ec98);

      return (
        _0x221eb0["customBones"] || (_0x221eb0["customBones"] = {}),
        (_0x221eb0["version"] = 0x2),
        _0x221eb0
      );
    } catch {
      return { version: 0x2, params: {}, transforms: {}, customBones: {} };
    }
  }

  ["_save"]() {
    try {
      localStorage["setItem"](
        Le,

        JSON["stringify"](this["_data"]),
      );
    } catch {}
  }
}

function Re(_0x1e098d, _0x34a3e9) {
  return new Promise((_0x37eb40) => {
    const {
        title: _0x1ccc6c = "操作确认",

        confirmText: _0x16f7c0 = "确认",

        cancelText: _0x506343 = "取消",

        danger: _0x501757 = !0x1,
      } = _0x34a3e9 || {},
      _0x2f8838 = new Ce(_0x1ccc6c, 0x168, 0xc8),
      _0x32bb68 = _0x2f8838["body"];

    ((_0x32bb68["style"]["display"] = "flex"),
      (_0x32bb68["style"]["flexDirection"] = "column"),
      (_0x32bb68["style"]["alignItems"] = "center"),
      (_0x32bb68["style"]["justifyContent"] = "center"),
      (_0x32bb68["style"]["gap"] = "16px"),
      (_0x32bb68["style"]["padding"] = "20px"));

    const _0x5a8bc9 = document["createElement"]("div");

    ((_0x5a8bc9["style"]["cssText"] =
      "font-size: 13px; color: #ddd; text-align: center; line-height: 1.6;"),
      (_0x5a8bc9["textContent"] = _0x1e098d),
      _0x32bb68["appendChild"](_0x5a8bc9));

    const _0x3730b0 = document["createElement"]("div");

    _0x3730b0["style"]["cssText"] = "display: flex; gap: 10px; width: 100%;";

    const _0x412d16 = document["createElement"]("button");

    ((_0x412d16["className"] = "dayu-confirm-cancel-btn"),
      (_0x412d16["textContent"] = _0x506343),
      _0x412d16["addEventListener"]("click", () => {
        (_0x2f8838["hide"](), _0x37eb40(!0x1));
      }));

    const _0x3f91d8 = document["createElement"]("button");

    ((_0x3f91d8["className"] = _0x501757
      ? "dayu-confirm-danger-btn"
      : "dayu-confirm-ok-btn"),
      (_0x3f91d8["textContent"] = _0x16f7c0),
      _0x3f91d8["addEventListener"]("click", () => {
        (_0x2f8838["hide"](), _0x37eb40(!0x0));
      }),
      _0x3730b0["append"](_0x412d16, _0x3f91d8),
      _0x32bb68["appendChild"](_0x3730b0),
      _0x2f8838["show"]());
  });
}

class Ce {
  constructor(_0x45a3bf, _0x524cce = 0x2d0, _0x430f56 = 0x208) {
    ((this["_visible"] = !0x1),
      (this["_overlay"] = document["createElement"]("div")),
      (this["_overlay"]["className"] = "dayu-modal-overlay"),
      this["_overlay"]["addEventListener"]("click", (_0x2fa6a1) => {
        _0x2fa6a1["target"] === this["_overlay"] && this["hide"]();
      }),
      (this["_dialog"] = document["createElement"]("div")),
      (this["_dialog"]["className"] = "dayu-modal-dialog"),
      (this["_dialog"]["style"]["width"] = _0x524cce + "px"),
      (this["_dialog"]["style"]["maxHeight"] = _0x430f56 + "px"));

    const _0x133ebe = document["createElement"]("div");

    ((_0x133ebe["className"] = "dayu-modal-header"),
      (this["_titleEl"] = document["createElement"]("span")),
      (this["_titleEl"]["className"] = "dayu-modal-title"),
      (this["_titleEl"]["textContent"] = _0x45a3bf));

    const _0x1aadc7 = document["createElement"]("button");

    ((_0x1aadc7["className"] = "dayu-modal-close"),
      (_0x1aadc7["innerHTML"] = "✕"),
      _0x1aadc7["addEventListener"]("click", () => this["hide"]()),
      _0x133ebe["append"](this["_titleEl"], _0x1aadc7),
      (this["_bodyEl"] = document["createElement"]("div")),
      (this["_bodyEl"]["className"] = "dayu-modal-body"),
      this["_dialog"]["append"](
        _0x133ebe,

        this["_bodyEl"],
      ),
      this["_overlay"]["appendChild"](this["_dialog"]));
  }

  get ["body"]() {
    return this["_bodyEl"];
  }

  ["setTitle"](_0x51efca) {
    this["_titleEl"]["textContent"] = _0x51efca;
  }

  ["show"]() {
    this["_visible"] ||
      ((this["_visible"] = !0x0),
      (
        document.querySelector("dialog.detail-modal[open]") || document.body
      ).appendChild(this["_overlay"]),
      requestAnimationFrame(() => {
        this["_overlay"]["classList"]["add"]("dayu-modal-visible");
      }));
  }

  ["hide"]() {
    this["_visible"] &&
      ((this["_visible"] = !0x1),
      this["_overlay"]["classList"]["remove"]("dayu-modal-visible"),
      setTimeout(() => {
        this["_overlay"]["remove"]();
      }, 0xc8));
  }

  ["clearBody"]() {
    this["_bodyEl"]["innerHTML"] = "";
  }

  ["destroy"]() {
    (this["hide"](), this["_overlay"]["remove"]());
  }
}

const at = "添加骨骼";

const ot = "选择根骨骼";

const rt = "选择动画模式";

const it = "参数配置";

const st = "保存";

const lt = "取消";

const dt = "没有可添加的骨骼（所有骨骼均已配置）";

const ct = "不支持添加骨骼";

const pt = "搜索骨骼名称...";

const mt = "已配置";

class ut {
  constructor(_0x363cce, _0x4db5fb) {
    ((this["_onAdded"] = null),
      (this["_provider"] = _0x363cce),
      (this["_persistence"] = _0x4db5fb),
      (this["_modal"] = new Ce(at, 0x208, 0x280)));
  }

  ["show"](_0x3aaf1f, _0x31f85c, _0x28ca49) {
    if (
      ((this["_onAdded"] = _0x28ca49 ?? null),
      this["_modal"]["clearBody"](),
      !this["_provider"]["addExtraBone"] ||
        !this["_provider"]["getSkeletonBoneNames"] ||
        !this["_provider"]["getExtraBoneNames"])
    )
      return void this["_showError"](ct);

    const _0x21215a = this["_provider"]["getSkeletonBoneNames"](_0x3aaf1f),
      _0x4398b4 = new Set(this["_provider"]["getExtraBoneNames"](_0x3aaf1f));

    if (0x0 === _0x21215a["length"]) return void this["_showError"](dt);

    const _0x2843f6 = this["_modal"]["body"];

    ((_0x2843f6["style"]["display"] = "flex"),
      (_0x2843f6["style"]["flexDirection"] = "column"),
      (_0x2843f6["style"]["gap"] = "12px"),
      (_0x2843f6["style"]["padding"] = "16px"));

    const _0x3d2155 = this["_label"](ot);

    _0x2843f6["appendChild"](_0x3d2155);

    const _0x38b36c = document["createElement"]("input");

    ((_0x38b36c["type"] = "text"),
      (_0x38b36c["placeholder"] = pt),
      (_0x38b36c["className"] = "dayu-anim-select"),
      (_0x38b36c["style"]["cssText"] =
        "width: 100%; box-sizing: border-box; margin-bottom: 4px;"),
      _0x2843f6["appendChild"](_0x38b36c));

    const _0x7c860b = document["createElement"]("div");

    _0x7c860b["style"]["cssText"] =
      "max-height: 150px; overflow-y: auto; border: 1px solid #444; border-radius: 4px; background: #1e1e1e;";

    let _0x395702 = null,
      _0x4e91e0 = null;

    const _0x396337 = (_0x891094) => {
      _0x7c860b["innerHTML"] = "";

      const _0x32bf94 = _0x891094["toLowerCase"]();

      for (const _0x2af665 of _0x21215a) {
        if (_0x32bf94 && !_0x2af665["toLowerCase"]()["includes"](_0x32bf94))
          continue;

        const _0x51c99e = _0x4398b4["has"](_0x2af665),
          _0x1b9e57 = document["createElement"]("div");

        ((_0x1b9e57["dataset"]["bone"] = _0x2af665),
          (_0x1b9e57["style"]["cssText"] =
            "padding: 4px 8px; cursor: " +
            (_0x51c99e ? "not-allowed" : "pointer") +
            "; font-size: 12px; display: flex; align-items: center; gap: 6px; color: " +
            (_0x51c99e ? "#666" : "#ccc") +
            "; user-select: none;"));

        const _0x19ed77 = document["createElement"]("span");

        if (
          ((_0x19ed77["style"]["flex"] = "1"),
          _0x32bf94
            ? (_0x19ed77["innerHTML"] = this["_highlightMatch"](
                _0x2af665,

                _0x32bf94,
              ))
            : (_0x19ed77["textContent"] = _0x2af665),
          _0x1b9e57["appendChild"](_0x19ed77),
          _0x51c99e)
        ) {
          const _0x537d8d = document["createElement"]("span");

          ((_0x537d8d["textContent"] = mt),
            (_0x537d8d["style"]["cssText"] =
              "font-size: 10px; background: #333; color: #888; padding: 1px 5px; border-radius: 3px;"),
            _0x1b9e57["appendChild"](_0x537d8d));
        }

        (_0x51c99e ||
          (_0x1b9e57["addEventListener"]("mouseenter", () => {
            _0x395702 !== _0x2af665 &&
              (_0x1b9e57["style"]["background"] = "#2a2a2a");
          }),
          _0x1b9e57["addEventListener"]("mouseleave", () => {
            _0x395702 !== _0x2af665 && (_0x1b9e57["style"]["background"] = "");
          }),
          _0x1b9e57["addEventListener"]("click", () => {
            (_0x4e91e0 &&
              ((_0x4e91e0["style"]["background"] = ""),
              (_0x4e91e0["style"]["color"] = "#ccc")),
              (_0x395702 = _0x2af665),
              (_0x4e91e0 = _0x1b9e57),
              (_0x1b9e57["style"]["background"] = "#0066cc"),
              (_0x1b9e57["style"]["color"] = "#fff"));
          })),
          _0x7c860b["appendChild"](_0x1b9e57));
      }
    };

    (_0x396337(""),
      _0x38b36c["addEventListener"]("input", () => {
        const _0x2ea7c9 = _0x395702;

        if (
          ((_0x4e91e0 = null),
          _0x396337(_0x38b36c["value"]),
          _0x2ea7c9 && !_0x4398b4["has"](_0x2ea7c9))
        ) {
          const _0x59567a = _0x7c860b["children"];

          for (
            let _0x1f7538 = 0x0;
            _0x1f7538 < _0x59567a["length"];
            _0x1f7538++
          ) {
            const _0x1e3847 = _0x59567a[_0x1f7538];

            if (_0x1e3847["dataset"]["bone"] === _0x2ea7c9) {
              ((_0x395702 = _0x2ea7c9),
                (_0x4e91e0 = _0x1e3847),
                (_0x1e3847["style"]["background"] = "#0066cc"),
                (_0x1e3847["style"]["color"] = "#fff"));

              break;
            }
          }
        }
      }),
      _0x2843f6["appendChild"](_0x7c860b));

    const _0x224e6a = this["_label"](rt),
      _0x217e74 = document["createElement"]("select");

    ((_0x217e74["className"] = "dayu-anim-select"),
      (_0x217e74["style"]["width"] = "100%"));

    for (let _0xc58db4 = 0x1; _0xc58db4 <= 0x6; _0xc58db4++) {
      const _0x293b25 = document["createElement"]("option");

      ((_0x293b25["value"] = String(_0xc58db4)),
        (_0x293b25["textContent"] =
          _0xc58db4 + ": " + (F[_0xc58db4] || "未知")),
        _0x217e74["appendChild"](_0x293b25));
    }

    _0x2843f6["append"](_0x224e6a, this["_wrapSelect"](_0x217e74));

    const _0x1a4d04 = this["_label"](it);

    _0x2843f6["appendChild"](_0x1a4d04);

    const _0x130ec7 = document["createElement"]("div");

    ((_0x130ec7["className"] = "dayu-param-editor"),
      (_0x130ec7["style"]["maxHeight"] = "200px"),
      (_0x130ec7["style"]["overflow"] = "auto"),
      _0x2843f6["appendChild"](_0x130ec7));

    const _0x4983a9 = new Map(),
      _0x323cbd = (_0x5f308f) => {
        ((_0x130ec7["innerHTML"] = ""), _0x4983a9["clear"]());

        const _0x1726bb = this["_provider"]["getParamMeta"](_0x5f308f);

        for (const _0x52c3db of _0x1726bb) {
          if (_0x52c3db["readOnly"]) continue;

          const _0x2f0257 = this["_getDefaultForParam"](
            _0x52c3db["key"],
            _0x5f308f,
          );

          _0x4983a9["set"](_0x52c3db["key"], _0x2f0257);

          const { row: _0x51fa7a } = _e(_0x52c3db["label"], {
            value: _0x2f0257,

            min: _0x52c3db["min"],

            max: _0x52c3db["max"],

            step: _0x52c3db["step"],

            onChange: (_0x26a7db) => {
              _0x4983a9["set"](
                _0x52c3db["key"],

                _0x26a7db,
              );
            },
          });

          _0x130ec7["appendChild"](_0x51fa7a);
        }
      };

    (_0x323cbd(0x1),
      _0x217e74["addEventListener"]("change", () => {
        _0x323cbd(parseInt(_0x217e74["value"], 0xa));
      }));

    const _0x13d76d = document["createElement"]("div");

    ((_0x13d76d["style"]["cssText"] =
      "color: #ff6b6b; font-size: 11px; display: none;"),
      _0x2843f6["appendChild"](_0x13d76d));

    const _0x5e1b4d = document["createElement"]("div");

    _0x5e1b4d["style"]["cssText"] =
      "display: flex; gap: 10px; margin-top: 8px;";

    const _0x3d8830 = document["createElement"]("button");

    ((_0x3d8830["className"] = "dayu-confirm-cancel-btn"),
      (_0x3d8830["textContent"] = lt),
      _0x3d8830["addEventListener"]("click", () => this["_modal"]["hide"]()));

    const _0x5510ae = document["createElement"]("button");

    ((_0x5510ae["className"] = "dayu-confirm-ok-btn"),
      (_0x5510ae["textContent"] = st),
      _0x5510ae["addEventListener"]("click", () => {
        var _0x4a695b, _0x403e03, _0xd0ee25;

        if (((_0x13d76d["style"]["display"] = "none"), !_0x395702))
          return (
            (_0x13d76d["textContent"] = "请选择一个骨骼"),
            void (_0x13d76d["style"]["display"] = "")
          );

        const _0x28b55d = {
          name: "default",

          mode: parseInt(_0x217e74["value"], 0xa),
        };

        for (const [_0xde6eb5, _0x25bac3] of _0x4983a9)
          _0x28b55d[_0xde6eb5] = _0x25bac3;

        const _0x4832ac = {
          rootBoneName: _0x395702,

          endBoneName: [],

          animation: { default: _0x28b55d },
        };

        if (!this["_provider"]["addExtraBone"](_0x3aaf1f, _0x4832ac))
          return (
            (_0x13d76d["textContent"] = "添加失败，请检查骨骼名称是否有效"),
            void (_0x13d76d["style"]["display"] = "")
          );

        if (this["_persistence"]) {
          const _0x138c9a =
            (null ==
            (_0x403e03 = (_0x4a695b = this["_provider"])["getModelHash"])
              ? void 0x0
              : _0x403e03["call"](_0x4a695b, _0x3aaf1f)) ?? _0x31f85c;

          this["_persistence"]["saveCustomBone"](
            _0x138c9a,

            _0x395702,

            _0x4832ac,
          );
        }

        (this["_modal"]["hide"](),
          null == (_0xd0ee25 = this["_onAdded"]) || _0xd0ee25["call"](this));
      }),
      _0x5e1b4d["append"](_0x3d8830, _0x5510ae),
      _0x2843f6["appendChild"](_0x5e1b4d),
      this["_modal"]["show"]());
  }

  ["destroy"]() {
    this["_modal"]["destroy"]();
  }

  ["_showError"](_0x356efd) {
    const _0x237f8b = this["_modal"]["body"];

    ((_0x237f8b["style"]["padding"] = "24px"),
      (_0x237f8b["style"]["textAlign"] = "center"),
      (_0x237f8b["style"]["color"] = "#aaa"),
      (_0x237f8b["textContent"] = _0x356efd));

    const _0x31045d = document["createElement"]("button");

    ((_0x31045d["className"] = "dayu-confirm-cancel-btn"),
      (_0x31045d["textContent"] = "关闭"),
      (_0x31045d["style"]["marginTop"] = "16px"),
      _0x31045d["addEventListener"]("click", () => this["_modal"]["hide"]()),
      _0x237f8b["appendChild"](document["createElement"]("br")),
      _0x237f8b["appendChild"](_0x31045d),
      this["_modal"]["show"]());
  }

  ["_label"](_0x34788b) {
    const _0x8a1a82 = document["createElement"]("div");

    return (
      (_0x8a1a82["style"]["cssText"] =
        "font-size: 12px; color: #ccc; font-weight: 500;"),
      (_0x8a1a82["textContent"] = _0x34788b),
      _0x8a1a82
    );
  }

  ["_wrapSelect"](_0x19453f) {
    const _0x54dc6a = document["createElement"]("div");

    ((_0x54dc6a["className"] = "dayu-select-wrap"),
      (_0x54dc6a["style"]["width"] = "100%"));

    const _0x489667 = document["createElement"]("span");

    return (
      (_0x489667["className"] = "dayu-select-arrow"),
      (_0x489667["textContent"] = "▾"),
      _0x54dc6a["append"](_0x19453f, _0x489667),
      _0x54dc6a
    );
  }

  ["_highlightMatch"](_0x311372, _0x1b6fd8) {
    const _0x25e93d = _0x311372["toLowerCase"]()["indexOf"](_0x1b6fd8);

    if (-0x1 === _0x25e93d) return this["_escapeHtml"](_0x311372);

    const _0x3e7594 = _0x311372["slice"](0x0, _0x25e93d),
      _0x160b8c = _0x311372["slice"](
        _0x25e93d,

        _0x25e93d + _0x1b6fd8["length"],
      ),
      _0x279828 = _0x311372["slice"](_0x25e93d + _0x1b6fd8["length"]);

    return (
      this["_escapeHtml"](_0x3e7594) +
      '<span class="dayu-search-match">' +
      this["_escapeHtml"](_0x160b8c) +
      "</span>" +
      this["_escapeHtml"](_0x279828)
    );
  }

  ["_escapeHtml"](_0x971df9) {
    return _0x971df9["replace"](/&/g, "&amp;")

      ["replace"](/</g, "&lt;")

      ["replace"](/>/g, "&gt;");
  }

  ["_getDefaultForParam"](_0x237c45, _0x1e73f3) {
    return (
      {
        rotateTime: 0x2,

        rotateRange: 0xa,

        rotateCenter: 0x0,

        rotateOffset: 0x0,

        childOffset: 0.3,

        spring: 0.3,

        affectByLevel: 0.2,

        springLevel: 0.1,

        delay: 0.5,

        speed: 0.5,

        friction: 0.9,

        limitRange: 0x2d,

        moveXFreq: 0x1,

        moveXAmp: 0x5,

        moveXOctaves: 0x1,

        moveYFreq: 0x1,

        moveYAmp: 0x5,

        moveYOctaves: 0x1,

        scaleXFreq: 0x1,

        scaleXAmp: 0.1,

        scaleYFreq: 0x1,

        scaleYAmp: 0.1,

        elasticSpring: 0.5,

        elasticFriction: 0.9,

        elasticSoftness: 0x1,

        elasticSpringY: 0.5,

        elasticFrictionY: 0.9,

        elasticSoftnessY: 0x1,
      }[_0x237c45] ?? 0x0
    );
  }
}

class ht {
  constructor(_0x2ac0d6) {
    ((this["_head"] = 0x0),
      (this["_size"] = 0x0),
      (this["_data"] = new Float64Array(_0x2ac0d6)));
  }

  ["push"](_0x930c53) {
    ((this["_data"][this["_head"]] = _0x930c53),
      (this["_head"] = (this["_head"] + 0x1) % this["_data"]["length"]),
      this["_size"] < this["_data"]["length"] && this["_size"]++);
  }

  ["toArray"]() {
    if (0x0 === this["_size"]) return [];

    const _0x525e4f = new Array(this["_size"]),
      _0x49be75 =
        (this["_head"] - this["_size"] + this["_data"]["length"]) %
        this["_data"]["length"];

    for (let _0x3370b5 = 0x0; _0x3370b5 < this["_size"]; _0x3370b5++)
      _0x525e4f[_0x3370b5] =
        this["_data"][(_0x49be75 + _0x3370b5) % this["_data"]["length"]];

    return _0x525e4f;
  }
}

function ft(_0xae74eb, _0x1f7634, _0x52d25b) {
  const _0x26413b = document["createElement"](_0xae74eb);

  return (
    _0x1f7634 && (_0x26413b["className"] = _0x1f7634),
    void 0x0 !== _0x52d25b && (_0x26413b["textContent"] = _0x52d25b),
    _0x26413b
  );
}

function gt(_0x142d64) {
  return _0x142d64["toFixed"](0x3);
}

class yt {
  constructor(_0x3db3b4) {
    ((this["_collapsed"] = !0x1),
      (this["_boneLineScale"] = 0x1),
      (this["_debugSearchQuery"] = ""),
      (this["_debugSearchInput"] = null),
      (this["_rafId"] = 0x0),
      (this["_lastSample"] = 0x0),
      (this["_meshCaches"] = new Map()),
      (this["_historyMap"] = new Map()),
      (this["_destroyed"] = !0x1),
      (this["_tabSystem"] = null),
      (this["_modelManager"] = null),
      (this["_modelManagerProvider"] = null),
      (this["_exportDialog"] = null),
      (this["_addBoneDialog"] = null),
      (this["_tick"] = () => {
        if (this["_destroyed"]) return;

        this["_rafId"] = requestAnimationFrame(this["_tick"]);

        const _0x110311 = performance["now"]();

        if (
          _0x110311 - this["_lastSample"] < 0x64 ||
          ((this["_lastSample"] = _0x110311),
          this["_tabSystem"] && "debug" !== this["_tabSystem"]["activeId"])
        )
          return;

        const _0x28eb96 = this["_provider"]["getSnapshotsWithRefs"]();

        this["_updateDOM"](_0x28eb96);
      }));

    const {
      provider: _0x35019b,

      container: _0xdbdf07 = document["body"],

      initialOpacity: _0x184dc3 = 0.92,

      initialPosition: _0x1b3731,
    } = _0x3db3b4;

    ((this["_provider"] = _0x35019b),
      (this["_extraEnabled"] = _0x35019b["extraEnabled"]),
      (this["_opacity"] = _0x184dc3),
      (this["_persistence"] = new ke()),
      (this["_paramEditor"] = new Ee(_0x35019b, this["_persistence"])),
      (function () {
        if ((ve++, document["getElementById"](ye))) return;

        const _0x242b5f = document["createElement"]("style");

        ((_0x242b5f["id"] = ye),
          (_0x242b5f["textContent"] = xe),
          document["head"]["appendChild"](_0x242b5f));
      })(),
      (this["_root"] = ft("div", "dayu-panel")),
      (this["_root"]["style"]["opacity"] = String(this["_opacity"])));

    const _0x3b3a91 = ft("div", "dayu-header"),
      _0x18bca7 = ft("div", "dayu-header-left"),
      _0x287a20 = ft("div", "dayu-header-icon");

    _0x287a20["innerHTML"] =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L12 22M2 12L22 12M5 5L19 19M19 5L5 19"/></svg>';

    const _0x465a77 = ft("span", "dayu-header-title", q);

    ((this["_badgeEl"] = ft(
      "span",

      "dayu-header-badge",

      "0" + K + " / 0" + U,
    )),
      _0x18bca7["append"](_0x287a20, _0x465a77, this["_badgeEl"]));

    const _0x5f9f53 = ft("div", "dayu-header-right");

    ((this["_caretBtn"] = ft("button", "dayu-icon-btn")),
      (this["_caretBtn"]["title"] = ee),
      (this["_caretBtn"]["innerHTML"] =
        '<span class="dayu-collapse-caret">▼</span>'),
      this["_caretBtn"]["addEventListener"](
        "click",

        (_0x473028) => {
          (_0x473028["stopPropagation"](), this["_toggleCollapse"]());
        },
      ),
      _0x5f9f53["append"](this["_caretBtn"]),
      _0x3b3a91["append"](_0x18bca7, _0x5f9f53),
      (this["_body"] = ft("div", "dayu-body")));

    const _0x1e0b3f = ft("div", "dayu-toolbar"),
      _0x3b5868 = ft("div", "dayu-toolbar-row"),
      _0x3fe7a4 = ft("label", "dayu-toggle-label"),
      _0x1ea8d1 = ft("span", "dayu-toggle-text", W);

    this["_toggleBtn"] = ft(
      "button",

      "dayu-toggle-btn" + (this["_extraEnabled"] ? " dayu-active" : ""),
    );

    const _0x1477c0 = ft("span", "dayu-toggle-knob");

    (this["_toggleBtn"]["appendChild"](_0x1477c0),
      this["_toggleBtn"]["addEventListener"]("click", () =>
        this["_toggleExtra"](),
      ),
      _0x3fe7a4["append"](_0x1ea8d1, this["_toggleBtn"]),
      _0x3b5868["appendChild"](_0x3fe7a4));

    const _0x396ff0 = ft("div", "dayu-toolbar-row"),
      _0x37259e = ft("label", "dayu-slider-label"),
      _0x86389f = ft("span", "dayu-slider-text", J);

    ((this["_opacitySlider"] = document["createElement"]("input")),
      (this["_opacitySlider"]["type"] = "range"),
      (this["_opacitySlider"]["className"] = "dayu-slider"),
      (this["_opacitySlider"]["min"] = "0.2"),
      (this["_opacitySlider"]["max"] = "1"),
      (this["_opacitySlider"]["step"] = "0.05"),
      (this["_opacitySlider"]["value"] = String(this["_opacity"])),
      this["_opacitySlider"]["addEventListener"]("input", () => {
        ((this["_opacity"] = parseFloat(this["_opacitySlider"]["value"])),
          (this["_root"]["style"]["opacity"] = String(this["_opacity"])));
      }),
      _0x37259e["append"](_0x86389f, this["_opacitySlider"]),
      _0x396ff0["appendChild"](_0x37259e));

    const _0x26ac94 = ft("div", "dayu-toolbar-row"),
      _0x53eec5 = ft("label", "dayu-slider-label"),
      _0x376e93 = ft("span", "dayu-slider-text", Q);

    ((this["_scaleSlider"] = document["createElement"]("input")),
      (this["_scaleSlider"]["type"] = "range"),
      (this["_scaleSlider"]["className"] = "dayu-slider"),
      (this["_scaleSlider"]["min"] = "1"),
      (this["_scaleSlider"]["max"] = "4"),
      (this["_scaleSlider"]["step"] = "0.25"),
      (this["_scaleSlider"]["value"] = "1"),
      (this["_scaleValueEl"] = ft(
        "span",

        "dayu-scale-value",

        "1.0x",
      )),
      this["_scaleSlider"]["addEventListener"]("input", () => {
        ((this["_boneLineScale"] = parseFloat(this["_scaleSlider"]["value"])),
          (this["_provider"]["boneLineScale"] = this["_boneLineScale"]),
          (this["_scaleValueEl"]["textContent"] =
            this["_boneLineScale"]["toFixed"](0x1) + "x"));
      }),
      _0x53eec5["append"](
        _0x376e93,

        this["_scaleSlider"],

        this["_scaleValueEl"],
      ),
      _0x26ac94["appendChild"](_0x53eec5),
      _0x1e0b3f["append"](_0x3b5868, _0x396ff0, _0x26ac94));

    const _0x3a3014 = ft("div", "dayu-debug-search-bar");

    ((this["_debugSearchInput"] = document["createElement"]("input")),
      (this["_debugSearchInput"]["type"] = "text"),
      (this["_debugSearchInput"]["placeholder"] = "搜索骨骼名称..."),
      (this["_debugSearchInput"]["className"] = "dayu-debug-search-input"),
      this["_debugSearchInput"]["addEventListener"]("input", () => {
        ((this["_debugSearchQuery"] =
          this["_debugSearchInput"]["value"]["toLowerCase"]()),
          this["_applyDebugSearch"]());
      }),
      _0x3a3014["appendChild"](this["_debugSearchInput"]),
      (this["_emptyEl"] = ft("div", "dayu-empty", Z)),
      (this["_meshList"] = ft("div")),
      this["_body"]["append"](
        _0x1e0b3f,

        _0x3a3014,

        this["_emptyEl"],

        this["_meshList"],
      ),
      this["_root"]["append"](_0x3b3a91, this["_body"]),
      _0xdbdf07["appendChild"](this["_root"]));

    const _0x27b2f1 = _0x1b3731
        ? _0x1b3731["x"] < 0x0
          ? window["innerWidth"] + _0x1b3731["x"]
          : _0x1b3731["x"]
        : window["innerWidth"] - 0x190,
      _0x53371d = (null == _0x1b3731 ? void 0x0 : _0x1b3731["y"]) ?? 0x10;

    ((this["_drag"] = new j(this["_root"], _0x3b3a91, {
      x: _0x27b2f1,

      y: _0x53371d,
    })),
      _0x35019b["addExtraBone"] &&
        _0x35019b["getSkeletonBoneNames"] &&
        _0x35019b["getExtraBoneNames"] &&
        (this["_addBoneDialog"] = new ut(_0x35019b, this["_persistence"])),
      this["_provider"]["setDebugMode"](!0x0),
      this["_tick"](),
      this["_restoreFromPersistence"](),
      this["_modelManager"] && this["_modelManager"]["startAutoRefresh"]());
  }

  ["destroy"]() {
    var _0x4e250a, _0x43ce46, _0x2867cd;

    this["_destroyed"] ||
      ((this["_destroyed"] = !0x0),
      cancelAnimationFrame(this["_rafId"]),
      this["_provider"]["setDebugMode"](!0x1),
      this["_provider"]["setHighlightedMesh"](null, -0x1),
      this["_drag"]["destroy"](),
      this["_paramEditor"]["destroy"](),
      null == (_0x4e250a = this["_modelManager"]) || _0x4e250a["destroy"](),
      null == (_0x43ce46 = this["_exportDialog"]) || _0x43ce46["destroy"](),
      null == (_0x2867cd = this["_addBoneDialog"]) || _0x2867cd["destroy"](),
      this["_root"]["remove"](),
      this["_meshCaches"]["clear"](),
      this["_historyMap"]["clear"](),
      (function () {
        if ((ve--, ve > 0x0)) return;

        const _0x91f803 = document["getElementById"](ye);

        _0x91f803 && _0x91f803["remove"]();
      })());
  }

  ["_updateDOM"](_0xf2e134) {
    var _0x21ee37;

    const _0x1f07e3 = _0xf2e134["length"],
      _0x1d40ff = _0xf2e134["reduce"](
        (_0x182600, _0x201b46) =>
          _0x182600 + _0x201b46["data"]["autoBones"]["length"],

        0x0,
      );

    ((this["_badgeEl"]["textContent"] =
      "" + _0x1f07e3 + K + " / " + _0x1d40ff + U),
      (this["_emptyEl"]["style"]["display"] = 0x0 === _0x1f07e3 ? "" : "none"));

    const _0x166e3e = new Set();

    for (const _0x5e8e88 of _0xf2e134) {
      const _0xbd4804 = _0x5e8e88["data"]["spineId"];

      _0x166e3e["add"](_0xbd4804);

      let _0x424b60 = this["_meshCaches"]["get"](_0xbd4804);

      if (
        (_0x424b60 ||
          ((_0x424b60 = this["_createMeshSection"](
            _0xbd4804,

            _0x5e8e88["meshRef"],
          )),
          this["_meshCaches"]["set"](_0xbd4804, _0x424b60),
          this["_meshList"]["appendChild"](_0x424b60["section"])),
        (_0x424b60["meshRef"] = _0x5e8e88["meshRef"]),
        null == (_0x21ee37 = this["_modelManagerProvider"])
          ? void 0x0
          : _0x21ee37["isModelVisible"])
      ) {
        const _0x34fb38 = this["_modelManagerProvider"]["isModelVisible"](
          _0x5e8e88["meshRef"],
        );

        _0x424b60["hiddenBadge"]["style"]["display"] = _0x34fb38 ? "none" : "";
      }

      if (
        ((_0x424b60["badgeEl"]["textContent"] =
          _0x5e8e88["data"]["autoBones"]["length"] + " " + U),
        _0x424b60["animSelect"])
      ) {
        let _0x394826 = "";

        (_0x5e8e88["data"]["autoBones"]["length"] > 0x0 &&
          (_0x394826 = _0x5e8e88["data"]["autoBones"][0x0]["trackName"]),
          _0x394826 &&
            "none" !== _0x394826 &&
            _0x424b60["animSelect"]["value"] !== _0x394826 &&
            (_0x424b60["animSelect"]["value"] = _0x394826));
      }

      if (!_0x424b60["expanded"]) continue;

      const _0x470c76 = new Set();

      for (
        let _0x3abf94 = 0x0;
        _0x3abf94 < _0x5e8e88["data"]["autoBones"]["length"];
        _0x3abf94++
      ) {
        _0x470c76["add"](_0x3abf94);

        const _0x555a35 = _0x5e8e88["data"]["autoBones"][_0x3abf94];

        let _0x3a288a = _0x424b60["bones"]["get"](_0x3abf94);

        (_0x3a288a ||
          ((_0x3a288a = this["_createBoneSection"](
            _0xbd4804,

            _0x3abf94,

            _0x555a35,

            _0x5e8e88["meshRef"],
          )),
          _0x424b60["bones"]["set"](_0x3abf94, _0x3a288a),
          _0x424b60["body"]["appendChild"](_0x3a288a["section"])),
          this["_sampleBone"](_0xbd4804, _0x3abf94, _0x555a35),
          _0x3a288a["expanded"] &&
            this["_updateBoneMetrics"](
              _0xbd4804,
              _0x3abf94,
              _0x555a35,
              _0x3a288a,
            ),
          this["_paramEditor"]["syncValues"](
            _0x5e8e88["meshRef"],

            _0xbd4804,

            _0x3abf94,
          ));
      }

      for (const [_0x2d04f5, _0x4db94a] of _0x424b60["bones"])
        _0x470c76["has"](_0x2d04f5) ||
          (_0x4db94a["section"]["remove"](),
          _0x424b60["bones"]["delete"](_0x2d04f5));
    }

    for (const [_0x2ecd99, _0x440ec8] of this["_meshCaches"])
      _0x166e3e["has"](_0x2ecd99) ||
        (_0x440ec8["section"]["remove"](),
        this["_meshCaches"]["delete"](_0x2ecd99));
  }

  ["_createMeshSection"](_0x2151db, _0x213c97) {
    const _0x1272b8 = ft("div", "dayu-mesh-section"),
      _0x14b527 = ft("div", "dayu-mesh-header"),
      _0x2e7501 = ft("span", "dayu-caret dayu-expanded", "▶"),
      _0x3aaad6 = ft("span", "dayu-mesh-name", _0x2151db),
      _0x3995ca = ft("span", "dayu-hidden-badge");

    ((_0x3995ca["textContent"] = "已隐藏"),
      (_0x3995ca["style"]["display"] = "none"));

    const _0x18d6f5 = ft("span", "dayu-mesh-badge");

    _0x14b527["append"](_0x2e7501, _0x3aaad6, _0x3995ca, _0x18d6f5);

    const _0x4962a0 = ft("div", "dayu-mesh-body");

    let _0xccdace = null;

    if (
      this["_provider"]["getAnimationList"] &&
      this["_provider"]["setAnimation"]
    ) {
      const _0x53beb0 = ft("div", "dayu-anim-row"),
        _0x49d0fb = ft("span", "dayu-anim-label", he),
        _0x3393e4 = ft("div", "dayu-select-wrap");

      ((_0xccdace = document["createElement"]("select")),
        (_0xccdace["className"] = "dayu-anim-select"));

      const _0x4718e7 = this["_provider"]["getAnimationList"](_0x213c97);

      for (const _0x4ab9a3 of _0x4718e7) {
        const _0x4ecff0 = document["createElement"]("option");

        ((_0x4ecff0["value"] = _0x4ab9a3),
          (_0x4ecff0["textContent"] = _0x4ab9a3),
          _0xccdace["appendChild"](_0x4ecff0));
      }

      (_0xccdace["addEventListener"]("click", (_0x7afbd) =>
        _0x7afbd["stopPropagation"](),
      ),
        _0xccdace["addEventListener"]("mousedown", (_0x58ac86) =>
          _0x58ac86["stopPropagation"](),
        ),
        _0xccdace["addEventListener"]("change", () => {
          _0x5e74cc["meshRef"] &&
            this["_provider"]["setAnimation"](
              _0x5e74cc["meshRef"],

              _0xccdace["value"],

              !0x0,
            );
        }));

      const _0xb3794c = ft("span", "dayu-select-arrow", "▾");

      (_0x3393e4["append"](_0xccdace, _0xb3794c),
        _0x53beb0["append"](_0x49d0fb, _0x3393e4),
        _0x4962a0["appendChild"](_0x53beb0));
    }

    const _0x5e74cc = {
      section: _0x1272b8,

      header: _0x14b527,

      body: _0x4962a0,

      expanded: !0x0,

      nameEl: _0x3aaad6,

      badgeEl: _0x18d6f5,

      hiddenBadge: _0x3995ca,

      animSelect: _0xccdace,

      meshRef: _0x213c97,

      bones: new Map(),
    };

    if (this["_addBoneDialog"]) {
      const _0x46c24a = ft("button", "dayu-edit-btn");

      ((_0x46c24a["textContent"] = "＋"),
        (_0x46c24a["title"] = "添加骨骼"),
        (_0x46c24a["style"]["cssText"] =
          "margin-left: auto; font-size: 14px; width: 22px; height: 22px;"),
        _0x46c24a["addEventListener"]("click", (_0x4a8b69) => {
          (_0x4a8b69["stopPropagation"](),
            this["_addBoneDialog"]["show"](
              _0x5e74cc["meshRef"],

              _0x2151db,

              () => {
                for (const [, _0x548dfd] of _0x5e74cc["bones"])
                  _0x548dfd["section"]["remove"]();

                _0x5e74cc["bones"]["clear"]();
              },
            ));
        }),
        _0x14b527["appendChild"](_0x46c24a));
    }

    return (
      _0x14b527["addEventListener"]("click", () => {
        ((_0x5e74cc["expanded"] = $(
          _0x4962a0,

          _0x5e74cc["expanded"],
        )),
          _0x2e7501["classList"]["toggle"](
            "dayu-expanded",

            _0x5e74cc["expanded"],
          ));
      }),
      _0x1272b8["append"](_0x14b527, _0x4962a0),
      _0x5e74cc
    );
  }

  ["_createBoneSection"](_0x496ed1, _0x2b71d3, _0x2156c0, _0x54678c) {
    const _0x4e1227 = ft("div", "dayu-bone-section"),
      _0x5bb480 = ft("div", "dayu-bone-header"),
      _0x525dcd = ft("span", "dayu-caret dayu-small dayu-expanded", "▶"),
      _0x4b80e6 = ft(
        "span",

        "dayu-bone-name",

        _0x2156c0["rootBoneName"],
      );

    _0x4b80e6["dataset"]["boneName"] = _0x2156c0["rootBoneName"];

    const _0x368c48 = ft("span", "dayu-mode-tag");

    ((_0x368c48["style"]["background"] = V[_0x2156c0["mode"]] || "#888"),
      (_0x368c48["textContent"] =
        "" + de + _0x2156c0["mode"] + ": " + (F[_0x2156c0["mode"]] || ce)),
      _0x5bb480["append"](_0x525dcd, _0x4b80e6, _0x368c48));

    const _0x334e00 = ft("div", "dayu-bone-body");

    if (
      (this["_paramEditor"]["attachEditButton"](
        _0x5bb480,

        _0x334e00,

        _0x54678c,

        _0x496ed1,

        _0x2b71d3,

        _0x2156c0["mode"],
      ),
      this["_provider"]["removeExtraBone"])
    ) {
      const _0x37fdef = ft("button", "dayu-bone-delete-btn");

      ((_0x37fdef["textContent"] = "✕"),
        (_0x37fdef["title"] = "删除骨骼"),
        _0x37fdef["addEventListener"]("click", (_0x3b5816) => {
          (_0x3b5816["stopPropagation"](),
            this["_handleDeleteBone"](
              _0x496ed1,

              _0x2b71d3,

              _0x2156c0["rootBoneName"],

              _0x54678c,
            ));
        }),
        _0x5bb480["appendChild"](_0x37fdef));
    }

    const _0x1784ff = this["_createStatRow"](
      te,

      _0x2156c0["trackName"],

      "dayu-track",
    );

    _0x334e00["appendChild"](_0x1784ff);

    const _0x4eb475 = (function (_0x3fc6fd) {
        const _0x264988 = [];

        return (
          (0x2 === _0x3fc6fd || 0x4 === _0x3fc6fd) &&
            _0x264988["push"](
              {
                key: "speedX",

                histKey: "speedX",

                label: ne,

                color: "#ff9f43",

                warn: 0x5,
              },

              {
                key: "speedY",

                histKey: "speedY",

                label: ae,

                color: "#ff9f43",

                warn: 0x5,
              },
            ),
          0x4 === _0x3fc6fd &&
            _0x264988["push"](
              {
                key: "forceX",

                histKey: "forceX",

                label: oe,

                color: "#fd79a8",

                warn: 0xa,
              },

              {
                key: "forceY",

                histKey: "forceY",

                label: re,

                color: "#fd79a8",

                warn: 0xa,
              },
            ),
          0x5 === _0x3fc6fd &&
            _0x264988["push"](
              {
                key: "elasticSpeedX",

                histKey: "elasticX",

                label: ie,

                color: "#00b894",

                warn: 0x5,
              },

              {
                key: "elasticSpeedY",

                histKey: "elasticY",

                label: se,

                color: "#00b894",

                warn: 0x5,
              },
            ),
          _0x264988["push"]({
            key: "rotationDelta",

            histKey: "rotDelta",

            label: le,

            color: "#4ecdc4",

            warn: 0x1e,
          }),
          _0x264988
        );
      })(_0x2156c0["mode"]),
      _0x48bd1f = [];

    for (const _0x1218a0 of _0x4eb475) {
      const _0x22bce6 = ft("div", "dayu-stat-row"),
        _0x3126c1 = ft("span", "dayu-stat-label", _0x1218a0["label"]),
        _0x5bf839 = ft("span", "dayu-stat-value dayu-mono", "0.000"),
        _0x277b6e = fe(0x78, 0x18);

      (_0x277b6e["classList"]["add"]("dayu-sparkline"),
        _0x22bce6["append"](_0x3126c1, _0x5bf839, _0x277b6e),
        _0x334e00["appendChild"](_0x22bce6),
        _0x48bd1f["push"]({
          def: _0x1218a0,

          valueEl: _0x5bf839,

          canvas: _0x277b6e,

          history: this["_getOrCreateHistory"](
            _0x496ed1,

            _0x2b71d3,

            _0x1218a0["histKey"],
          ),
        }));
    }

    const _0x1febce = {
      section: _0x4e1227,

      header: _0x5bb480,

      body: _0x334e00,

      expanded: !0x0,

      meshRef: _0x54678c,

      metrics: _0x48bd1f,
    };

    return (
      _0x5bb480["addEventListener"]("click", () => {
        ((_0x1febce["expanded"] = $(_0x334e00, _0x1febce["expanded"])),
          _0x525dcd["classList"]["toggle"](
            "dayu-expanded",

            _0x1febce["expanded"],
          ));
      }),
      _0x4e1227["addEventListener"]("mouseenter", (_0x1c51fe) => {
        (_0x1c51fe["stopPropagation"](),
          this["_provider"]["setHighlightedMesh"](_0x54678c, _0x2b71d3));
      }),
      _0x4e1227["addEventListener"]("mouseleave", (_0x5bc3bf) => {
        (_0x5bc3bf["stopPropagation"](),
          this["_provider"]["setHighlightedMesh"](null, -0x1));
      }),
      _0x4e1227["append"](_0x5bb480, _0x334e00),
      _0x1febce
    );
  }

  async ["_handleDeleteBone"](_0x971af1, _0x79e0bd, _0x103558, _0x381f79) {
    var _0x35e5f4, _0x8700ae;

    if (
      !(await Re(
        "确定删除骨骼「" + _0x103558 + "」的 AutoBone 配置？此操作不可撤销。",
        {
          title: "删除骨骼",

          confirmText: "删除",

          cancelText: "取消",

          danger: !0x0,
        },
      )) ||
      !this["_provider"]["removeExtraBone"](_0x381f79, _0x79e0bd)
    )
      return;

    if (this["_persistence"]) {
      const _0x10255b =
        (null == (_0x8700ae = (_0x35e5f4 = this["_provider"])["getModelHash"])
          ? void 0x0
          : _0x8700ae["call"](_0x35e5f4, _0x381f79)) ?? _0x971af1;

      (this["_persistence"]["removeCustomBone"](_0x10255b, _0x103558),
        this["_persistence"]["removeParamsForBone"](_0x10255b, _0x79e0bd));
    }

    const _0x4e1eb1 = this["_meshCaches"]["get"](_0x971af1);

    if (_0x4e1eb1) {
      for (const [, _0x4d92be] of _0x4e1eb1["bones"])
        _0x4d92be["section"]["remove"]();

      _0x4e1eb1["bones"]["clear"]();
    }
  }

  ["_createStatRow"](_0x4cc0bb, _0x38faa1, _0x2172d0) {
    const _0xc39dce = ft("div", "dayu-stat-row"),
      _0x486c18 = ft("span", "dayu-stat-label", _0x4cc0bb),
      _0x553353 = ft("span", "dayu-stat-value " + _0x2172d0, _0x38faa1);

    return (_0xc39dce["append"](_0x486c18, _0x553353), _0xc39dce);
  }

  ["_getOrCreateHistory"](_0x557d47, _0x19e4ad, _0x160e91) {
    const _0x1b3424 = _0x557d47 + "_" + _0x19e4ad;

    let _0x5c978a = this["_historyMap"]["get"](_0x1b3424);

    _0x5c978a ||
      ((_0x5c978a = new Map()),
      this["_historyMap"]["set"](_0x1b3424, _0x5c978a));

    let _0x4fd71d = _0x5c978a["get"](_0x160e91);

    return (
      _0x4fd71d ||
        ((_0x4fd71d = new ht(0x3c)), _0x5c978a["set"](_0x160e91, _0x4fd71d)),
      _0x4fd71d
    );
  }

  ["_sampleBone"](_0x2116b8, _0x5373f2, _0xab218a) {
    const _0x490b8e = (_0x350865, _0x26e381) => {
      this["_getOrCreateHistory"](_0x2116b8, _0x5373f2, _0x350865)["push"](
        _0x26e381,
      );
    };

    (_0x490b8e("speedX", _0xab218a["speedX"]),
      _0x490b8e("speedY", _0xab218a["speedY"]),
      _0x490b8e("rotDelta", _0xab218a["rotationDelta"]),
      _0x490b8e("forceX", _0xab218a["forceX"]),
      _0x490b8e("forceY", _0xab218a["forceY"]),
      _0x490b8e("elasticX", _0xab218a["elasticSpeedX"]),
      _0x490b8e("elasticY", _0xab218a["elasticSpeedY"]));
  }

  ["_updateBoneMetrics"](_0x84e582, _0x27c033, _0x3057f1, _0x5b5027) {
    for (const _0x49f37a of _0x5b5027["metrics"]) {
      const _0x4fdd5d = _0x3057f1[_0x49f37a["def"]["key"]] ?? 0x0,
        _0x13f1a3 = "rotationDelta" === _0x49f37a["def"]["key"] ? "°" : "";

      ((_0x49f37a["valueEl"]["textContent"] = gt(_0x4fdd5d) + _0x13f1a3),
        ge(_0x49f37a["canvas"], {
          values: _0x49f37a["history"]["toArray"](),

          width: 0x78,

          height: 0x18,

          color: _0x49f37a["def"]["color"],

          warnThreshold: _0x49f37a["def"]["warn"],
        }));
    }
  }

  ["_toggleCollapse"]() {
    this["_collapsed"] = !this["_collapsed"];

    const _0xd59226 = this["_caretBtn"]["querySelector"](
      ".dayu-collapse-caret",
    );

    this["_collapsed"]
      ? (null == _0xd59226 || _0xd59226["classList"]["add"]("dayu-collapsed"),
        (this["_caretBtn"]["title"] = G),
        D(
          this["_tabSystem"] ? this["_tabSystem"]["barElement"] : this["_body"],
        ),
        this["_tabSystem"]
          ? D(this["_tabSystem"]["contentHost"])
          : D(this["_body"]))
      : (null == _0xd59226 ||
          _0xd59226["classList"]["remove"]("dayu-collapsed"),
        (this["_caretBtn"]["title"] = ee),
        this["_tabSystem"]
          ? (H(this["_tabSystem"]["barElement"]),
            H(this["_tabSystem"]["contentHost"]))
          : H(this["_body"]));
  }

  ["_toggleExtra"]() {
    ((this["_extraEnabled"] = !this["_extraEnabled"]),
      this["_provider"]["setExtraEnabled"](this["_extraEnabled"]),
      this["_toggleBtn"]["classList"]["toggle"](
        "dayu-active",

        this["_extraEnabled"],
      ));
  }

  ["_applyDebugSearch"]() {
    const _0x3fc3eb = this["_debugSearchQuery"];

    for (const [, _0x3ad237] of this["_meshCaches"]) {
      let _0x599c18 = !0x1;

      for (const [, _0x19abb9] of _0x3ad237["bones"]) {
        const _0x2feb12 =
          _0x19abb9["header"]["querySelector"](".dayu-bone-name");

        if (!_0x2feb12) continue;

        const _0x2012f1 =
          _0x2feb12["dataset"]["boneName"] || _0x2feb12["textContent"] || "";

        _0x3fc3eb
          ? _0x2012f1["toLowerCase"]()["includes"](_0x3fc3eb)
            ? ((_0x2feb12["innerHTML"] = this["_highlightText"](
                _0x2012f1,

                _0x3fc3eb,
              )),
              (_0x19abb9["section"]["style"]["display"] = ""),
              (_0x599c18 = !0x0))
            : ((_0x2feb12["innerHTML"] = ""),
              (_0x2feb12["textContent"] = _0x2012f1),
              (_0x19abb9["section"]["style"]["display"] = "none"))
          : ((_0x2feb12["innerHTML"] = ""),
            (_0x2feb12["textContent"] = _0x2012f1),
            (_0x19abb9["section"]["style"]["display"] = ""),
            (_0x599c18 = !0x0));
      }

      _0x3ad237["section"]["style"]["display"] =
        !_0x3fc3eb || _0x599c18 ? "" : "none";
    }
  }

  ["_highlightText"](_0x1671a1, _0x3161a4) {
    const _0x4c141a = _0x1671a1["toLowerCase"]()["indexOf"](_0x3161a4);

    if (-0x1 === _0x4c141a) return this["_escapeHtml"](_0x1671a1);

    const _0x58c6ef = _0x1671a1["slice"](0x0, _0x4c141a),
      _0x4a962b = _0x1671a1["slice"](
        _0x4c141a,

        _0x4c141a + _0x3161a4["length"],
      ),
      _0x249e2d = _0x1671a1["slice"](_0x4c141a + _0x3161a4["length"]);

    return (
      this["_escapeHtml"](_0x58c6ef) +
      '<span class="dayu-search-match">' +
      this["_escapeHtml"](_0x4a962b) +
      "</span>" +
      this["_escapeHtml"](_0x249e2d)
    );
  }

  ["_escapeHtml"](_0x3c796a) {
    return _0x3c796a["replace"](/&/g, "&amp;")

      ["replace"](/</g, "&lt;")

      ["replace"](/>/g, "&gt;");
  }

  ["_restoreFromPersistence"]() {
    const _0x926cf0 = this["_provider"]["setExtraParam"]
        ? this["_persistence"]["getAllParams"]()
        : {},
      _0x523f8d = Object["keys"](_0x926cf0);

    let _0xe62063 = 0x0;

    const _0x41addc = () => {
      var _0x11f028,
        _0x1e3f0a,
        _0xd9fc5d,
        _0x2dc93e,
        _0x565c07,
        _0x2e32b5,
        _0x13decb,
        _0x55ab32;

      if (this["_destroyed"]) return;

      _0xe62063++;

      const _0x4bf7d8 = this["_provider"]["getSnapshotsWithRefs"]();

      if (0x0 === _0x4bf7d8["length"] && _0xe62063 < 0x1e)
        return void setTimeout(_0x41addc, 0x1f4);

      if (
        !_0x4bf7d8["some"](
          (_0x24577f) => _0x24577f["data"]["autoBones"]["length"] > 0x0,
        ) &&
        _0xe62063 < 0x1e
      )
        return void setTimeout(_0x41addc, 0x1f4);

      const _0x12d076 = new Map(),
        _0x305e05 = new Map();

      for (const _0x53d19c of _0x4bf7d8) {
        _0x12d076["set"](
          _0x53d19c["data"]["spineId"],

          _0x53d19c["meshRef"],
        );

        const _0x590d8c =
          null == (_0x1e3f0a = (_0x11f028 = this["_provider"])["getModelHash"])
            ? void 0x0
            : _0x1e3f0a["call"](
                _0x11f028,

                _0x53d19c["meshRef"],
              );

        _0x590d8c && _0x305e05["set"](_0x590d8c, _0x53d19c["meshRef"]);
      }

      const _0x5ba299 = (_0x465d8c) =>
        _0x12d076["get"](_0x465d8c) ?? _0x305e05["get"](_0x465d8c) ?? null;

      if (this["_provider"]["addExtraBone"])
        for (const _0x4a1a41 of _0x4bf7d8) {
          const _0x7328b2 =
              (null ==
              (_0x2dc93e = (_0xd9fc5d = this["_provider"])["getModelHash"])
                ? void 0x0
                : _0x2dc93e["call"](_0xd9fc5d, _0x4a1a41["meshRef"])) ?? null,
            _0x4d9fe5 = this["_persistence"]["getCustomBones"](
              _0x7328b2,

              _0x4a1a41["data"]["spineId"],
            ),
            _0x33bb30 = new Set(
              (null ==
              (_0x2e32b5 = (_0x565c07 = this["_provider"])["getExtraBoneNames"])
                ? void 0x0
                : _0x2e32b5["call"](
                    _0x565c07,

                    _0x4a1a41["meshRef"],
                  )) ?? [],
            );

          for (const [_0x1c82ff, _0x4bbc9c] of Object["entries"](_0x4d9fe5))
            _0x33bb30["has"](_0x1c82ff) ||
              this["_provider"]["addExtraBone"](
                _0x4a1a41["meshRef"],

                _0x4bbc9c,
              );
        }

      let _0x5573af = 0x0;

      for (const _0x3b647d of _0x523f8d) {
        const _0x337a81 = _0x3b647d["split"]("__");

        if (_0x337a81["length"] < 0x2) continue;

        const _0x488972 = _0x337a81[0x0],
          _0x431a17 = parseInt(_0x337a81[0x1], 0xa);

        if (isNaN(_0x431a17)) continue;

        const _0x5763ce = _0x5ba299(_0x488972);

        if (!_0x5763ce) {
          _0x5573af++;

          continue;
        }

        if (
          !(null ==
          (_0x55ab32 = (_0x13decb = this["_provider"])["getExtraParams"])
            ? void 0x0
            : _0x55ab32["call"](_0x13decb, _0x5763ce, _0x431a17))
        ) {
          _0x5573af++;

          continue;
        }

        const _0x252bd4 = _0x926cf0[_0x3b647d];

        for (const [_0x52de51, _0x6f2e55] of Object["entries"](_0x252bd4))
          this["_provider"]["setExtraParam"](
            _0x5763ce,

            _0x431a17,

            _0x52de51,

            _0x6f2e55,
          );
      }

      if (_0x5573af > 0x0 && _0xe62063 < 0x1e) setTimeout(_0x41addc, 0x1f4);
      else {
        if (this["_modelManagerProvider"]) {
          const _0x4de4bd = this["_modelManagerProvider"]["setModelRotation"]
            ? (_0x522fa7, _0x9dfc67) =>
                this["_modelManagerProvider"]["setModelRotation"](
                  _0x522fa7,
                  _0x9dfc67,
                )
            : void 0x0;

          this["_persistence"]["restoreTransforms"](
            (_0x37745e, _0x490d9e, _0x11eebf) =>
              this["_modelManagerProvider"]["setModelTransform"](
                _0x37745e,

                _0x490d9e,

                _0x11eebf,
              ),

            _0x5ba299,

            _0x4de4bd,
          );
        }
      }
    };

    setTimeout(_0x41addc, 0x1f4);
  }
}
export { yt as ExtraDebugPanel };
