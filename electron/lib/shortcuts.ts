import { globalShortcut } from 'electron';
import { SHORTCUTS } from './constants.js';
import { getMainWindow } from './windowManager.js';

export function registerGlobalShortcuts(): void {
  globalShortcut.register(SHORTCUTS.screenCapture, () => {
    getMainWindow()?.webContents.send('trigger-screen-capture');
  });
}

export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll();
}
