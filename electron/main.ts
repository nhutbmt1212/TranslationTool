/// <reference types="electron" />
import { app, BrowserWindow } from 'electron';

// Modules
import { createMainWindow, getMainWindow, setQuitting } from './lib/windowManager.js';
import { createTray } from './lib/trayManager.js';
import { setupAutoUpdater, checkForUpdatesOnStartup, registerAutoUpdaterIPC } from './lib/autoUpdater.js';
import { registerScreenCaptureIPC } from './lib/screenCapture.js';
import { registerCoreIPC } from './lib/ipcHandlers.js';
import { registerGlobalShortcuts, unregisterAllShortcuts } from './lib/shortcuts.js';
import { registerTextSelectionIPC } from './lib/textSelectionPopup.js';

// Initialize auto-updater
setupAutoUpdater();

// App lifecycle
app.whenReady().then(() => {
  createMainWindow();
  createTray();
  
  // Register IPC handlers
  registerCoreIPC();
  registerAutoUpdaterIPC();
  registerScreenCaptureIPC();
  registerTextSelectionIPC();
  
  // Register global shortcuts
  registerGlobalShortcuts();
  
  // Check for updates on startup
  checkForUpdatesOnStartup();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      getMainWindow()?.show();
    }
  });
});

app.on('will-quit', () => {
  unregisterAllShortcuts();
});

app.on('before-quit', () => {
  setQuitting(true);
});

app.on('window-all-closed', () => {
  // App stays in tray on Windows/Linux
  // macOS: stays in dock
});
