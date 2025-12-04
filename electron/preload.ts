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

  // System Tray APIs
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  showWindow: () => ipcRenderer.invoke('show-window'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  
  // Listen for tray events
  onTriggerScreenCapture: (callback: () => void) => {
    ipcRenderer.on('trigger-screen-capture', callback);
    return () => ipcRenderer.removeListener('trigger-screen-capture', callback);
  },

  // Text Selection Popup APIs
  textSelectionPopup: {
    showPopup: () => ipcRenderer.invoke('text-selection:show-popup'),
    hidePopup: () => ipcRenderer.invoke('text-selection:hide-popup'),
    startMonitoring: () => ipcRenderer.invoke('text-selection:start-monitoring'),
    stopMonitoring: () => ipcRenderer.invoke('text-selection:stop-monitoring'),
    isMonitoring: () => ipcRenderer.invoke('text-selection:is-monitoring'),
    reloadIgnoreConfig: () => ipcRenderer.invoke('text-selection:reload-ignore-config'),
    onPopupClick: () => ipcRenderer.send('text-selection:popup-click'),
  },

  // Listen for text selection translate event
  onTextSelectionTranslate: (callback: (text: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, text: string) => callback(text);
    ipcRenderer.on('text-selection-translate', handler);
    return () => ipcRenderer.removeListener('text-selection-translate', handler);
  },

  // Text Selection Ignore Config APIs
  getTextSelectionIgnoreConfig: () => ipcRenderer.invoke('get-text-selection-ignore-config'),
  saveTextSelectionIgnoreConfig: (config: { ignoredApplications: string[]; enabled: boolean }) =>
    ipcRenderer.invoke('save-text-selection-ignore-config', config),

  // Features Config APIs
  getFeaturesConfig: () => ipcRenderer.invoke('get-features-config'),
  saveFeaturesConfig: (config: { quickCaptureEnabled: boolean; textSelectionEnabled: boolean; textSelectionIgnoreEnabled: boolean }) =>
    ipcRenderer.invoke('save-features-config', config),
  applyFeaturesConfig: (config: { quickCaptureEnabled: boolean; textSelectionEnabled: boolean; textSelectionIgnoreEnabled: boolean }) =>
    ipcRenderer.invoke('apply-features-config', config),
});

// Also expose as 'electron' for backward compatibility
contextBridge.exposeInMainWorld('electron', {
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

  // System Tray APIs
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  showWindow: () => ipcRenderer.invoke('show-window'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  
  // Listen for tray events
  onTriggerScreenCapture: (callback: () => void) => {
    ipcRenderer.on('trigger-screen-capture', callback);
    return () => ipcRenderer.removeListener('trigger-screen-capture', callback);
  },

  // Text Selection Popup APIs
  textSelectionPopup: {
    showPopup: () => ipcRenderer.invoke('text-selection:show-popup'),
    hidePopup: () => ipcRenderer.invoke('text-selection:hide-popup'),
    startMonitoring: () => ipcRenderer.invoke('text-selection:start-monitoring'),
    stopMonitoring: () => ipcRenderer.invoke('text-selection:stop-monitoring'),
    isMonitoring: () => ipcRenderer.invoke('text-selection:is-monitoring'),
    reloadIgnoreConfig: () => ipcRenderer.invoke('text-selection:reload-ignore-config'),
    onPopupClick: () => ipcRenderer.send('text-selection:popup-click'),
  },

  // Listen for text selection translate event
  onTextSelectionTranslate: (callback: (text: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, text: string) => callback(text);
    ipcRenderer.on('text-selection-translate', handler);
    return () => ipcRenderer.removeListener('text-selection-translate', handler);
  },

  // Text Selection Ignore Config APIs
  getTextSelectionIgnoreConfig: () => ipcRenderer.invoke('get-text-selection-ignore-config'),
  saveTextSelectionIgnoreConfig: (config: { ignoredApplications: string[]; enabled: boolean }) =>
    ipcRenderer.invoke('save-text-selection-ignore-config', config),

  // Features Config APIs
  getFeaturesConfig: () => ipcRenderer.invoke('get-features-config'),
  saveFeaturesConfig: (config: { quickCaptureEnabled: boolean; textSelectionEnabled: boolean; textSelectionIgnoreEnabled: boolean }) =>
    ipcRenderer.invoke('save-features-config', config),
  applyFeaturesConfig: (config: { quickCaptureEnabled: boolean; textSelectionEnabled: boolean; textSelectionIgnoreEnabled: boolean }) =>
    ipcRenderer.invoke('apply-features-config', config),
});

