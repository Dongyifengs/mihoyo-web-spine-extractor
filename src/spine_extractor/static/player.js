import {RenderHub} from './renderer.js';
const query = new URLSearchParams(location.search);
const notify = (type, data = {}) => parent.postMessage({source: 'spine-preview', type, ...data}, location.origin);
const hub = new RenderHub({detail: true});
let surface;
const state = {animation: '', skin: '', playing: true, loop: true, speed: 1};
const canvas = document.createElement('canvas');
document.getElementById('player').append(canvas);
const resize = new ResizeObserver(() => {canvas.width = Math.max(1, innerWidth); canvas.height = Math.max(1, innerHeight);});
resize.observe(document.body);
window.addEventListener('message', event => {
  if (event.source !== parent || event.origin !== location.origin || event.data?.source !== 'spine-gallery') return;
  if (event.data.type === 'dispose') {hub.dispose(); resize.disconnect();}
  if (event.data.type === 'state') {Object.assign(state, event.data.state); surface?.setState(event.data.state.restart);}
});
try {
  const response = await fetch(`/api/activities/${encodeURIComponent(query.get('activity'))}/preview/${Number(query.get('group'))}`);
  const group = await response.json();
  if (!response.ok) throw new Error(group.error);
  await hub.add(group, canvas, state, {
    ready: value => {surface = value; document.getElementById('loading').remove(); notify('ready', {animations: group.animations, skins: group.skins, defaultAnimation: state.animation});},
    error: message => {document.getElementById('loading').textContent = message; notify('error', {message});},
  });
} catch (error) {document.getElementById('loading').textContent = error.message; notify('error', {message: error.message});}
window.addEventListener('pagehide', () => {hub.dispose(); resize.disconnect();});
