/// <reference types="electron" />
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  translate: (text: string, targetLang: string, sourceLang?: string) =>
    ipcRenderer.invoke('translate', text, targetLang, sourceLang),
  getLanguages: () => ipcRenderer.invoke('get-languages'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Auto-updater APIs
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  // Auto-updater event listeners
  onUpdateChecking: (callback: () => void) => {
    ipcRenderer.on('update-checking', callback);
    return () => ipcRenderer.removeListener('update-checking', callback);
  },
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info));
    return () => ipcRenderer.removeListener('update-available', callback);
  },
  onUpdateNotAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-not-available', (_event, info) => callback(info));
    return () => ipcRenderer.removeListener('update-not-available', callback);
  },
  onUpdateError: (callback: (error: any) => void) => {
    ipcRenderer.on('update-error', (_event, error) => callback(error));
    return () => ipcRenderer.removeListener('update-error', callback);
  },
  onUpdateDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('update-download-progress', (_event, progress) => callback(progress));
    return () => ipcRenderer.removeListener('update-download-progress', callback);
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_event, info) => callback(info));
    return () => ipcRenderer.removeListener('update-downloaded', callback);
  },

  // Screen Capture APIs
  screenCapture: {
    getSize: () => ipcRenderer.invoke('screen-capture:get-size'),
    captureFullScreen: () => ipcRenderer.invoke('screen-capture:capture-full-screen'),
    captureRegion: (region: { x: number; y: number; width: number; height: number }) =>
      ipcRenderer.invoke('screen-capture:capture-region', region),
    selectDesktopRegion: () => ipcRenderer.invoke('screen-capture:select-desktop-region'),
  },

  // Overlay result (for overlay window)
  overlayResult: (result: any) => ipcRenderer.send('overlay-result', result),
});

