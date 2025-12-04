export interface ElectronAPI {
  translate: (text: string, targetLang: string, sourceLang?: string) => Promise<{
    success: boolean;
    data?: {
      text: string;
      from: string;
      to: string;
      originalText: string;
    };
    error?: string;
  }>;
  getLanguages: () => Promise<Record<string, string>>;
  getAppVersion: () => Promise<string>;
  
  // Auto-updater APIs
  checkForUpdates: () => Promise<{ success: boolean; data?: any; error?: string }>;
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
  installUpdate: () => void;
  
  // Auto-updater event listeners
  onUpdateChecking: (callback: () => void) => () => void;
  onUpdateAvailable: (callback: (info: any) => void) => () => void;
  onUpdateNotAvailable: (callback: (info: any) => void) => () => void;
  onUpdateError: (callback: (error: any) => void) => () => void;
  onUpdateDownloadProgress: (callback: (progress: any) => void) => () => void;
  onUpdateDownloaded: (callback: (info: any) => void) => () => void;

  // Screen Capture APIs
  screenCapture: {
    getSize: () => Promise<{ width: number; height: number }>;
    captureFullScreen: () => Promise<Buffer>;
    captureRegion: (region: { x: number; y: number; width: number; height: number }) => Promise<Buffer>;
    selectDesktopRegion: () => Promise<Buffer | null>;
  };

  // Overlay result (for overlay window)
  overlayResult?: (result: any) => void;

  // System Tray APIs
  minimizeToTray: () => Promise<void>;
  showWindow: () => Promise<void>;
  quitApp: () => Promise<void>;
  
  // Tray event listeners
  onTriggerScreenCapture: (callback: () => void) => () => void;

  // Text Selection Popup APIs
  textSelectionPopup: {
    showPopup: () => Promise<void>;
    hidePopup: () => Promise<void>;
    startMonitoring: () => Promise<void>;
    stopMonitoring: () => Promise<void>;
    reloadIgnoreConfig: () => Promise<void>;
    onPopupClick: () => void;
  };

  // Text selection translate event listener
  onTextSelectionTranslate: (callback: (text: string) => void) => () => void;

  // Text Selection Ignore Config APIs
  getTextSelectionIgnoreConfig: () => Promise<{ ignoredApplications: string[]; enabled: boolean }>;
  saveTextSelectionIgnoreConfig: (config: { ignoredApplications: string[]; enabled: boolean }) => Promise<void>;

  // Features Config APIs
  getFeaturesConfig: () => Promise<{ quickCaptureEnabled: boolean; textSelectionEnabled: boolean; textSelectionIgnoreEnabled: boolean }>;
  saveFeaturesConfig: (config: { quickCaptureEnabled: boolean; textSelectionEnabled: boolean; textSelectionIgnoreEnabled: boolean }) => Promise<void>;
  applyFeaturesConfig: (config: { quickCaptureEnabled: boolean; textSelectionEnabled: boolean; textSelectionIgnoreEnabled: boolean }) => Promise<void>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    electronAPI: ElectronAPI;
  }
}

