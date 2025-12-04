import { ipcMain, app } from 'electron';
import { getMainWindow, setQuitting } from './windowManager.js';
import { reloadShortcuts } from './shortcuts.js';
import { startSelectionMonitoring, stopSelectionMonitoring } from './textSelectionPopup.js';
import * as fs from 'fs';
import * as path from 'path';

export function registerCoreIPC(): void {
  // Legacy handlers (kept for backward compatibility)
  ipcMain.handle('translate', async () => {
    return { success: false, error: 'Translation moved to renderer process' };
  });

  ipcMain.handle('get-languages', async () => {
    return {};
  });

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // System tray handlers
  ipcMain.handle('minimize-to-tray', () => {
    getMainWindow()?.hide();
  });

  ipcMain.handle('show-window', () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  ipcMain.handle('quit-app', () => {
    setQuitting(true);
    app.quit();
  });

  // Text Selection Ignore Config handlers
  ipcMain.handle('get-text-selection-ignore-config', async () => {
    try {
      const configPath = path.join(app.getPath('userData'), 'textSelectionIgnore.json');
      
      if (!fs.existsSync(configPath)) {
        // Return default config
        return {
          ignoredApplications: ['kiro.exe', 'code.exe', 'notepad.exe'],
          enabled: true,
        };
      }

      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load text selection ignore config:', error);
      return {
        ignoredApplications: ['kiro.exe', 'code.exe', 'notepad.exe'],
        enabled: true,
      };
    }
  });

  ipcMain.handle('save-text-selection-ignore-config', async (_event, config) => {
    try {
      const configPath = path.join(app.getPath('userData'), 'textSelectionIgnore.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      console.error('Failed to save text selection ignore config:', error);
      throw error;
    }
  });

  // Features Config handlers
  ipcMain.handle('get-features-config', async () => {
    try {
      const configPath = path.join(app.getPath('userData'), 'features.json');
      
      if (!fs.existsSync(configPath)) {
        // Return default config
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
  });

  ipcMain.handle('save-features-config', async (_event, config) => {
    try {
      const configPath = path.join(app.getPath('userData'), 'features.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      console.error('Failed to save features config:', error);
      throw error;
    }
  });

  ipcMain.handle('apply-features-config', async (_event, config) => {
    try {
      // Apply features config changes
      console.log('Applying features config:', config);
      
      // 1. Reload shortcuts based on new config (quick capture)
      reloadShortcuts();
      
      // 2. Apply text selection monitoring config
      if (config.textSelectionEnabled) {
        startSelectionMonitoring();
        console.log('Text selection monitoring enabled');
      } else {
        stopSelectionMonitoring();
        console.log('Text selection monitoring disabled');
      }
      
      console.log('Features config applied successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to apply features config:', error);
      throw error;
    }
  });
}
