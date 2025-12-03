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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

