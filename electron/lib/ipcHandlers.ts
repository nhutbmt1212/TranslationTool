import { ipcMain, app } from 'electron';
import { getMainWindow, setQuitting } from './windowManager.js';

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
}
