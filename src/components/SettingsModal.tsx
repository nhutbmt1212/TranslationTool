import React, { useState, useEffect } from 'react';
import { useApiKeySettings } from '../hooks/useApiKeySettings';
import { useUpdateSettings } from '../hooks/useUpdateSettings';
import SettingsModalHeader from './settings/SettingsModalHeader';
import ApiKeySection from './settings/ApiKeySection';
import UpdateSection from './settings/UpdateSection';
import ShortcutsSection from './settings/ShortcutsSection';
import SettingsActions from './settings/SettingsActions';
import '../styles/modal.css';
import '../styles/settings-modal.css';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

type TabType = 'apiKey' | 'update' | 'shortcuts';

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('apiKey');

  // API Key hook
  const {
    apiKey,
    setApiKey,
    maskedKey,
    showKey,
    setShowKey,
    isLoading,
    loadMaskedKey,
    handleSave,
    handleClear,
  } = useApiKeySettings();

  // Update hook
  const {
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
  } = useUpdateSettings();

  useEffect(() => {
    if (open) {
      loadMaskedKey();
      loadAppVersion();
      setApiKey('');
      setShowKey(false);
    }
  }, [open, loadMaskedKey, loadAppVersion, setApiKey, setShowKey]);

  const handleSaveAndClose = async () => {
    const success = await handleSave();
    if (success) {
      setTimeout(() => onClose(), 1000);
    }
  };

  if (!open) return null;

  return (
    <div className="language-picker-overlay" onClick={onClose}>
      <div className="language-picker" onClick={(e) => e.stopPropagation()}>
        <SettingsModalHeader 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        {/* Content - Scrollable */}
        <div className="settings-modal-content">
          {activeTab === 'apiKey' && (
            <ApiKeySection
              apiKey={apiKey}
              setApiKey={setApiKey}
              maskedKey={maskedKey}
              showKey={showKey}
              setShowKey={setShowKey}
              onClear={handleClear}
            />
          )}

          {activeTab === 'update' && (
            <UpdateSection
              appVersion={appVersion}
              updateAvailable={updateAvailable}
              updateInfo={updateInfo}
              downloading={downloading}
              downloadProgress={downloadProgress}
              updateReady={updateReady}
              updateError={updateError}
              downloadRetries={downloadRetries}
              isPaused={isPaused}
              onPauseResume={handlePauseResume}
              onCancelDownload={handleCancelDownload}
            />
          )}

          {activeTab === 'shortcuts' && <ShortcutsSection />}
        </div>

        {/* Actions - Always at bottom */}
        <SettingsActions
          activeTab={activeTab}
          isLoading={isLoading}
          apiKey={apiKey}
          updateReady={updateReady}
          updateAvailable={updateAvailable}
          downloading={downloading}
          checkingUpdate={checkingUpdate}
          updateInfo={updateInfo}
          onSave={handleSaveAndClose}
          onClose={onClose}
          onInstallUpdate={handleInstallUpdate}
          onDownloadUpdate={() => handleDownloadUpdate(false)}
          onCheckUpdate={handleCheckUpdate}
        />
      </div>
    </div>
  );
};

export default SettingsModal;