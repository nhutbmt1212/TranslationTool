import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UpdateInfo {
  version: string;
  releaseDate?: string;
}

interface DownloadProgress {
  percent: number;
  transferred: number;
  total: number;
}

interface UseUpdateSettingsReturn {
  appVersion: string;
  checkingUpdate: boolean;
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  downloading: boolean;
  downloadProgress: number;
  updateReady: boolean;
  updateError: string | null;
  downloadRetries: number;
  isPaused: boolean;
  handleCheckUpdate: () => Promise<void>;
  handleDownloadUpdate: (isRetry?: boolean) => Promise<void>;
  handlePauseResume: () => void;
  handleCancelDownload: () => void;
  handleInstallUpdate: () => void;
  loadAppVersion: () => Promise<void>;
}

/**
 * Custom hook để quản lý App Update functionality
 * - Quản lý update states và progress
 * - Handle check/download/install operations
 * - Setup electron update listeners
 */
export const useUpdateSettings = (): UseUpdateSettingsReturn => {
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateReady, setUpdateReady] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [downloadRetries, setDownloadRetries] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const loadAppVersion = useCallback(async () => {
    if (window.electronAPI?.getAppVersion) {
      const version = await window.electronAPI.getAppVersion();
      setAppVersion(version);
    }
  }, []);

  // Setup update listeners
  useEffect(() => {
    if (!window.electronAPI) return;

    const removeChecking = window.electronAPI.onUpdateChecking?.(() => {
      setCheckingUpdate(true);
      setUpdateError(null);
    });

    const removeAvailable = window.electronAPI.onUpdateAvailable?.((info) => {
      const updateData = info as UpdateInfo;
      setCheckingUpdate(false);
      setUpdateAvailable(true);
      setUpdateInfo(updateData);
    });

    const removeNotAvailable = window.electronAPI.onUpdateNotAvailable?.(() => {
      setCheckingUpdate(false);
      setUpdateAvailable(false);
      toast.success('You are using the latest version');
    });

    const removeError = window.electronAPI.onUpdateError?.((error) => {
      const errorData = error as { message?: string } | null;
      setCheckingUpdate(false);
      setDownloading(false);
      setUpdateError(errorData?.message || 'Update check failed');
    });

    const removeProgress = window.electronAPI.onUpdateDownloadProgress?.((progress) => {
      const progressData = progress as DownloadProgress;
      setDownloadProgress(Math.round(progressData.percent));
    });

    const removeDownloaded = window.electronAPI.onUpdateDownloaded?.(() => {
      setDownloading(false);
      setUpdateReady(true);
      toast.success('Update ready to install!');
    });

    return () => {
      removeChecking?.();
      removeAvailable?.();
      removeNotAvailable?.();
      removeError?.();
      removeProgress?.();
      removeDownloaded?.();
    };
  }, []);

  const handleCheckUpdate = useCallback(async () => {
    if (!window.electronAPI?.checkForUpdates) {
      toast.error('Update not available in this environment');
      return;
    }
    
    setCheckingUpdate(true);
    setUpdateError(null);
    setUpdateAvailable(false);

    // Timeout sau 30 giây
    const timeoutId = setTimeout(() => {
      setCheckingUpdate(false);
      setUpdateError('Timeout: Cannot connect to update server');
      toast.error('Update check took too long, please try again');
    }, 30000);

    try {
      const result = await window.electronAPI.checkForUpdates();
      clearTimeout(timeoutId);
      if (!result.success) {
        setUpdateError(result.error || 'Update check failed');
        setCheckingUpdate(false);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      setUpdateError('Update check failed');
      setCheckingUpdate(false);
    }
  }, []);

  const handleDownloadUpdate = useCallback(async (isRetry = false) => {
    if (!window.electronAPI?.downloadUpdate) return;
    
    if (!isRetry) {
      setDownloadRetries(0);
    }
    
    setDownloading(true);
    setDownloadProgress(0);
    setIsPaused(false);
    setUpdateError(null);

    try {
      await window.electronAPI.downloadUpdate();
    } catch (error) {
      setDownloading(false);
      
      // Retry mechanism - tối đa 3 lần
      if (downloadRetries < 3) {
        const retryCount = downloadRetries + 1;
        setDownloadRetries(retryCount);
        toast.error(`Download failed. Retrying... (${retryCount}/3)`);
        
        // Đợi 2 giây trước khi retry
        setTimeout(() => {
          handleDownloadUpdate(true);
        }, 2000);
      } else {
        setUpdateError('Download failed after 3 attempts. Please check your network connection.');
        toast.error('Cannot download update. Please try again later.');
        setDownloadRetries(0);
      }
    }
  }, [downloadRetries]);

  const handleCancelDownload = useCallback(() => {
    // Hủy download bằng cách reset states
    setDownloading(false);
    setDownloadProgress(0);
    setIsPaused(false);
    setUpdateError(null);
    setDownloadRetries(0);
    toast('Download cancelled', { icon: '❌' });
  }, []);

  const handlePauseResume = useCallback(() => {
    // Note: electron-updater không hỗ trợ pause/resume native
    // Tạm thời disable tính năng này để tránh confusion
    toast.error('Pause/Resume không được hỗ trợ. Vui lòng hủy và tải lại nếu cần.');
    return;
  }, []);

  const handleInstallUpdate = useCallback(() => {
    if (!window.electronAPI?.installUpdate) return;
    window.electronAPI.installUpdate();
  }, []);

  return {
    appVersion,
    checkingUpdate,
    updateAvailable,
    updateInfo,
    downloading,
    downloadProgress,
    updateReady,
    updateError,
    downloadRetries,
    isPaused,
    handleCheckUpdate,
    handleDownloadUpdate,
    handlePauseResume,
    handleCancelDownload,
    handleInstallUpdate,
    loadAppVersion,
  };
};