'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nyan', {
  onMove:   (cb) => ipcRenderer.on('trigger-move', (_event) => cb()),
  moveDone: ()   => ipcRenderer.send('move-done'),
});
