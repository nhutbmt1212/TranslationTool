import React from 'react';
import { useTranslation } from 'react-i18next';
import { TabType } from '../../types/settings';

interface UpdateInfo {
  version: string;
  releaseDate?: string;
}

interface SettingsActionsProps {
  activeTab: TabType;
  isLoading: boolean;
  apiKey: string;
  updateReady: boolean;
  updateAvailable: boolean;
  downloading: boolean;
  checkingUpdate: boolean;
  updateInfo: UpdateInfo | null;
  onSave: () => Promise<void>;
  onClose: () => void;
  onInstallUpdate: () => void;
  onDownloadUpdate: () => Promise<void>;
  onCheckUpdate: () => Promise<void>;
}

const SettingsActions: React.FC<SettingsActionsProps> = ({
  activeTab,
  isLoading,
  apiKey,
  updateReady,
  updateAvailable,
  downloading,
  checkingUpdate,
  onSave,
  onClose,
  onInstallUpdate,
  onDownloadUpdate,
  onCheckUpdate,
}) => {
  const { t } = useTranslation();

  if (activeTab === 'apiKey') {
    return (
      <div className="settings-actions">
        <button
          type="button"
          className="settings-save-button"
          onClick={onSave}
          disabled={isLoading || !apiKey.trim()}
        >
          {isLoading ? (
            <>
              <span className="button-spinner" />
              {t('settings.saving') || 'Saving...'}
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {t('settings.save') || 'Save'}
            </>
          )}
        </button>
        <button
          type="button"
          className="settings-cancel-button"
          onClick={onClose}
          disabled={isLoading}
        >
          {t('settings.close') || 'Close'}
        </button>
      </div>
    );
  }

  if (activeTab === 'shortcuts') {
    return (
      <div className="settings-actions">
        <button
          type="button"
          className="settings-cancel-button"
          onClick={onClose}
          style={{ flex: 1 }}
        >
          {t('settings.close') || 'Close'}
        </button>
      </div>
    );
  }

  if (activeTab === 'textSelectionIgnore' || activeTab === 'features') {
    return (
      <div className="settings-actions">
        <button
          type="button"
          className="settings-save-button"
          onClick={onSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="button-spinner" />
              {t('settings.saving') || 'Saving...'}
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {t('settings.save') || 'Save'}
            </>
          )}
        </button>
        <button
          type="button"
          className="settings-cancel-button"
          onClick={onClose}
          disabled={isLoading}
        >
          {t('settings.close') || 'Close'}
        </button>
      </div>
    );
  }

  return (
    <div className="settings-actions">
      {updateReady ? (
        <button
          type="button"
          className="settings-save-button"
          onClick={onInstallUpdate}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t('settings.update.installNow') || 'Install now'}
        </button>
      ) : updateAvailable && !downloading ? (
        <button
          type="button"
          className="settings-save-button"
          onClick={onDownloadUpdate}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t('settings.update.download') || 'Download'}
        </button>
      ) : (
        <button
          type="button"
          className="settings-save-button"
          onClick={onCheckUpdate}
          disabled={checkingUpdate || downloading}
        >
          {checkingUpdate ? (
            <>
              <span className="button-spinner" />
              {t('settings.update.checking') || 'Checking...'}
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              {t('settings.update.checkUpdate') || 'Check for updates'}
            </>
          )}
        </button>
      )}
      <button
        type="button"
        className="settings-cancel-button"
        onClick={onClose}
      >
        {t('settings.close') || 'Close'}
      </button>
    </div>
  );
};

export default SettingsActions;