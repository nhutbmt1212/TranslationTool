import { globalShortcut, app } from 'electron';
import { SHORTCUTS } from './constants.js';
import { getMainWindow } from './windowManager.js';
import * as fs from 'fs';
import * as path from 'path';

interface FeaturesConfig {
  quickCaptureEnabled: boolean;
  textSelectionEnabled: boolean;
  textSelectionIgnoreEnabled: boolean;
}

let currentConfig: FeaturesConfig = {
  quickCaptureEnabled: true,
  textSelectionEnabled: true,
  textSelectionIgnoreEnabled: true,
};

function loadFeaturesConfig(): FeaturesConfig {
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

export function registerGlobalShortcuts(): void {
  // Load config first
  currentConfig = loadFeaturesConfig();
  
  // Only register quick capture shortcut if enabled
  if (currentConfig.quickCaptureEnabled) {
    try {
      globalShortcut.register(SHORTCUTS.screenCapture, () => {
        getMainWindow()?.webContents.send('trigger-screen-capture');
      });
      console.log('Quick capture shortcut registered');
    } catch (error) {
      console.error('Failed to register quick capture shortcut:', error);
    }
  } else {
    console.log('Quick capture shortcut disabled by config');
  }
}

export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll();
}

export function reloadShortcuts(): void {
  // Unregister all first
  unregisterAllShortcuts();
  
  // Re-register based on new config
  registerGlobalShortcuts();
}
