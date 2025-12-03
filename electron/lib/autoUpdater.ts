import pkg from 'electron-updater';
import { ipcMain, app } from 'electron';
import { getMainWindow } from './windowManager.js';
import { IS_DEV } from './constants.js';

const { autoUpdater } = pkg;

export function setupAutoUpdater(): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    getMainWindow()?.webContents.send('update-checking');
  });

  autoUpdater.on('update-available', (info) => {
    getMainWindow()?.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    getMainWindow()?.webContents.send('update-not-available', info);
  });

  autoUpdater.on('error', (err) => {
    getMainWindow()?.webContents.send('update-error', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    getMainWindow()?.webContents.send('update-download-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', (info) => {
    getMainWindow()?.webContents.send('update-downloaded', info);
  });
}

export function checkForUpdatesOnStartup(): void {
  if (!IS_DEV) {
    setTimeout(() => autoUpdater.checkForUpdates(), 3000);
  }
}

export function registerAutoUpdaterIPC(): void {
  ipcMain.handle('check-for-updates', async () => {
    if (!app.isPackaged) {
      return { success: false, error: 'Auto-update chỉ hoạt động trong production build' };
    }
    try {
      const result = await autoUpdater.checkForUpdates();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Lỗi kiểm tra update' };
    }
  });

  ipcMain.handle('download-update', async () => {
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Lỗi tải update' };
    }
  });

  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall();
  });
}
