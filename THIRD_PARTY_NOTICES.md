# Third-party components

Original application code is MIT licensed. Website assets downloaded by users remain the property of their respective owners and are not included in this repository.

## Spine Runtimes

The `spine-player-*.js` files in `src/spine_extractor/static/vendor/` are from Esoteric Software's official Spine Runtimes project. They are covered by the **Spine Runtimes License Agreement**, not this repository's MIT license. The complete agreement is included as `SPINE-RUNTIMES-LICENSE.txt`; copyright notices inside the distributed files are retained.

| Local file | Upstream source |
| --- | --- |
| `spine-player-3.8.js` | [Official spine-runtimes 3.8 branch build](https://github.com/EsotericSoftware/spine-runtimes/blob/3.8/spine-ts/build/spine-player.js) |
| `spine-player-4.0.31.js` | [@esotericsoftware/spine-player 4.0.31](https://www.npmjs.com/package/@esotericsoftware/spine-player/v/4.0.31), `dist/iife/spine-player.js` |
| `spine-player-4.1.56.js` | [@esotericsoftware/spine-player 4.1.56](https://www.npmjs.com/package/@esotericsoftware/spine-player/v/4.1.56), `dist/iife/spine-player.js` |
| `spine-player-4.2.120.js` | [@esotericsoftware/spine-player 4.2.120](https://www.npmjs.com/package/@esotericsoftware/spine-player/v/4.2.120), `dist/iife/spine-player.js` |

The license permits integration under Section 2 of the [Spine Editor License Agreement](https://esotericsoftware.com/spine-editor-license). Otherwise each user of the resulting product must obtain their own Spine Editor license. Redistribution must include the runtime license and copyright notice. See the full agreement for the exact terms.

The optional editor integration invokes a separately installed and licensed CLI. No editor binaries, activation details, user configuration, or extracted activity assets are distributed in the web source package.

Other Python dependencies are installed from their upstream distributions using the package metadata, retaining their respective licenses.

## Dayu extra reference

`dayu-extra.js` and `dayu-debug.js` adapt the postprocessing algorithms and DOM debug panel from the user-supplied `spine_mirror.zip`. The original copyright notice identifies Dayu Network Technology (大于网络科技), 2024–2026. The archive does not contain a separate license grant. These reference files retain their original rights and are **not relicensed under this project's MIT license**. See `static/vendor/DAYU-NOTICE.txt`.

The adapter excludes the reference application's model manager, hosting, and unrelated application bootstrap. The original algorithms are used only for browser preview, never baked into generated editor projects. The workbench now uses its own read-only `extra-panel.js`; the retained `dayu-debug.js` reference panel is not loaded.
