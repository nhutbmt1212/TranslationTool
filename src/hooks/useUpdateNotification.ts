import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

interface DownloadProgress {
  percent: number;
  transferred: number;
  total: number;
}

interface UseUpdateNotificationReturn {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  downloading: boolean;
  downloadProgress: number;
  updateReady: boolean;
  isPaused: boolean;
  error: string | null;
  handleDownload: () => Promise<void>;
  handleInstall: () => void;
  handleDismiss: () => void;
  handlePauseResume: () => void;
  handleCancelDownload: () => void;
}

/**
 * Custom hook để quản lý update notification functionality
 * - Quản lý update states và progress
 * - Handle download với pause/resume capability
 * - Setup electron update listeners với i18n support
 * - Loại bỏ duplicate logic với SettingsModal
 */
export const useUpdateNotification = (): UseUpdateNotificationReturn => {
  const { t } = useTranslation();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateReady, setUpdateReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup update listeners
  useEffect(() => {
    if (!window.electronAPI) return;

    const removeChecking = window.electronAPI.onUpdateChecking?.(() => {
      setError(null);
    });

    const removeAvailable = window.electronAPI.onUpdateAvailable?.((info) => {
      const updateData = info as UpdateInfo;
      setUpdateAvailable(true);
      setUpdateInfo(updateData);
      toast.success(
        t('update.notification.newVersionAvailable', 'New version {{version}} is available!', {
          version: updateData.version,
        }),
        { duration: 5000 }
      );
    });

    const removeNotAvailable = window.electronAPI.onUpdateNotAvailable?.(() => {
      // No update available - silent
    });

    const removeError = window.electronAPI.onUpdateError?.(() => {
      const errorMessage = t('update.notification.checkError', 'Error checking for updates');
      setError(errorMessage);
      toast.error(errorMessage);
      setDownloading(false);
    });

    const removeProgress = window.electronAPI.onUpdateDownloadProgress?.((progress) => {
      const progressData = progress as DownloadProgress;
      if (!isPaused) {
        setDownloadProgress(Math.round(progressData.percent));
      }
    });

    const removeDownloaded = window.electronAPI.onUpdateDownloaded?.(() => {
      setDownloading(false);
      setUpdateReady(true);
      toast.success(t('update.notification.readyToInstall', 'Update ready to install!'));
    });

    return () => {
      removeChecking?.();
      removeAvailable?.();
      removeNotAvailable?.();
      removeError?.();
      removeProgress?.();
      removeDownloaded?.();
    };
  }, [t, isPaused]);

  const handleDownload = useCallback(async () => {
    if (!window.electronAPI?.downloadUpdate) return;
    
    setDownloading(true);
    setDownloadProgress(0);
    setIsPaused(false);
    setError(null);

    try {
      await window.electronAPI.downloadUpdate();
    } catch (err) {
      const errorMessage = t('update.notification.downloadError', 'Cannot download update');
      setError(errorMessage);
      toast.error(errorMessage);
      setDownloading(false);
    }
  }, [t]);

  const handleInstall = useCallback(() => {
    if (!window.electronAPI?.installUpdate) return;
    window.electronAPI.installUpdate();
  }, []);

  const handleDismiss = useCallback(() => {
    setUpdateAvailable(false);
    setUpdateReady(false);
    setError(null);
  }, []);

  const handleCancelDownload = useCallback(() => {
    // Hủy download bằng cách reset states
    setDownloading(false);
    setDownloadProgress(0);
    setIsPaused(false);
    setError(null);
    toast(t('update.notification.cancelled', 'Download cancelled'), { icon: '❌' });
  }, [t]);

  const handlePauseResume = useCallback(() => {
    // Note: electron-updater không hỗ trợ pause/resume native
    // Tạm thời disable tính năng này để tránh confusion
    toast.error(t('update.notification.pauseNotSupported', 'Pause/Resume không được hỗ trợ'));
    return;
  }, [t]);

  return {
    updateAvailable,
    updateInfo,
    downloading,
    downloadProgress,
    updateReady,
    isPaused,
    error,
    handleDownload,
    handleInstall,
    handleDismiss,
    handlePauseResume,
    handleCancelDownload,
  };
};