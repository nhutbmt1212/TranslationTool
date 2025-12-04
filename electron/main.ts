/// <reference types="electron" />
import { app, BrowserWindow } from 'electron';

// Modules
import { createMainWindow, getMainWindow, setQuitting } from './lib/windowManager.js';
import { createTray } from './lib/trayManager.js';
import { setupAutoUpdater, checkForUpdatesOnStartup, registerAutoUpdaterIPC } from './lib/autoUpdater.js';
import { registerScreenCaptureIPC } from './lib/screenCapture.js';
import { registerCoreIPC } from './lib/ipcHandlers.js';
import { registerGlobalShortcuts, unregisterAllShortcuts } from './lib/shortcuts.js';
import { registerTextSelectionIPC, startSelectionMonitoring } from './lib/textSelectionPopup.js';
import * as fs from 'fs';
import * as path from 'path';

// Initialize auto-updater
setupAutoUpdater();

// Load features config
function loadFeaturesConfig() {
  try {
    const configPath = path.join(app.getPath('userData'), 'features.json');
    
    if (!fs.existsSync(configPath)) {
      return {
        quickCaptureEnabled: true,
        textSelectionEnabled: true,
        textSelectionIgnoreEnabled: true,
      };
    }

    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load features config:', error);
    return {
      quickCaptureEnabled: true,
      textSelectionEnabled: true,
      textSelectionIgnoreEnabled: true,
    };
  }
}

// App lifecycle
app.whenReady().then(() => {
  createMainWindow();
  createTray();
  
  // Register IPC handlers
  registerCoreIPC();
  registerAutoUpdaterIPC();
  registerScreenCaptureIPC();
  registerTextSelectionIPC();
  
  // Load features config
  const featuresConfig = loadFeaturesConfig();
  console.log('Loaded features config on startup:', featuresConfig);
  
  // Register global shortcuts (will check config internally)
  registerGlobalShortcuts();
  
  // Start text selection monitoring only if enabled
  if (featuresConfig.textSelectionEnabled) {
    startSelectionMonitoring();
    console.log('Text selection monitoring started on startup');
  } else {
    console.log('Text selection monitoring disabled by config');
  }
  
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
