import { Languages } from './languages';

export interface TranslationResult {
  text: string;
  from: string;
  to: string;
  originalText: string;
}

export interface ElectronAPI {
  translate: (text: string, targetLang: string, sourceLang?: string) => Promise<{
    success: boolean;
    data?: TranslationResult;
    error?: string;
  }>;
  getLanguages: () => Promise<Languages>;
  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<{ success: boolean; data?: unknown; error?: string }>;
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
  installUpdate: () => void;
  onUpdateChecking: (callback: () => void) => () => void;
  onUpdateAvailable: (callback: (info: unknown) => void) => () => void;
  onUpdateNotAvailable: (callback: (info: unknown) => void) => () => void;
  onUpdateError: (callback: (error: unknown) => void) => () => void;
  onUpdateDownloadProgress: (callback: (progress: unknown) => void) => () => void;
  onUpdateDownloaded: (callback: (info: unknown) => void) => () => void;
  
  screenCapture?: {
    getSize: () => Promise<{ width: number; height: number }>;
    captureFullScreen: () => Promise<Buffer>;
    captureRegion: (region: { x: number; y: number; width: number; height: number }) => Promise<Buffer>;
    selectDesktopRegion: () => Promise<Buffer | null>;
  };
  
  onTriggerScreenCapture?: (callback: () => void) => () => void;

  // Text Selection Popup APIs
  textSelectionPopup?: {
    showPopup: () => Promise<void>;
    hidePopup: () => Promise<void>;
    startMonitoring: () => Promise<void>;
    stopMonitoring: () => Promise<void>;
    isMonitoring: () => Promise<boolean>;
    onPopupClick: () => void;
  };

  // Text selection translate event listener
  onTextSelectionTranslate?: (callback: (text: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
