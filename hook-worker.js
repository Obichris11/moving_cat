'use strict';
// Runs under system Node.js (not Electron) so the prebuilt uiohook-napi binary works.
const { uIOhook } = require('uiohook-napi');

let lastTrigger = 0;
const DEBOUNCE_MS = 50;

function trigger() {
  const now = Date.now();
  if (now - lastTrigger < DEBOUNCE_MS) return;
  lastTrigger = now;
  process.send('trigger');
}

uIOhook.on('keydown', trigger);
uIOhook.on('mouseclick', trigger);

try {
  uIOhook.start();
} catch (err) {
  process.send({ error: 'accessibility_denied' });
  process.exit(1);
}

process.on('SIGTERM', () => {
  uIOhook.stop();
  process.exit(0);
});
