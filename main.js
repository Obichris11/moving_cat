'use strict';
const { app, BrowserWindow, Tray, Menu, screen, ipcMain, systemPreferences, dialog, shell } = require('electron');
const path = require('path');

let win;
let tray;
let moving = false;

function createWindow() {
  const { bounds } = screen.getPrimaryDisplay();

  win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    focusable: false,
    hasShadow: false,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    // 'panel' keeps the window above fullscreen spaces on macOS; ignored on other platforms
    ...(process.platform === 'darwin' ? { type: 'panel' } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  win.loadFile('index.html');
  win.setIgnoreMouseEvents(true, { forward: true });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', 'tray-icon.png'));
  tray.setToolTip('Nyan Cat');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Quit Nyan Cat', click: () => app.quit() },
    ])
  );
}

function startHooks() {
  const { uIOhook } = require('uiohook-napi');

  // Check Accessibility permission — prompt if missing
  if (process.platform === 'darwin' && !systemPreferences.isTrustedAccessibilityClient(false)) {
    systemPreferences.isTrustedAccessibilityClient(true); // triggers system dialog
    dialog.showMessageBox(win, {
      type: 'warning',
      title: 'Accessibility Permission Required',
      message: 'Nyan Cat needs Accessibility access to react to keystrokes and clicks.',
      detail: 'Enable it in System Settings → Privacy & Security → Accessibility, then relaunch.',
      buttons: ['Open System Settings', 'Quit'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
      }
      app.quit();
    });
    return;
  }

  function trigger() {
    if (moving) return;
    moving = true;
    win.webContents.send('trigger-move');
  }

  uIOhook.on('keydown', trigger);
  uIOhook.on('mouseclick', trigger);
  uIOhook.start();

  app.on('before-quit', () => uIOhook.stop());
}

app.whenReady().then(() => {
  if (app.dock) app.dock.hide();

  createWindow();
  createTray();

  win.webContents.once('did-finish-load', startHooks);
});

ipcMain.on('move-done', () => {
  moving = false;
});

app.on('window-all-closed', () => app.quit());
