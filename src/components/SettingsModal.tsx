import React, { useState, useEffect } from 'react';
import { useApiKeySettings } from '../hooks/useApiKeySettings';
import { useUpdateSettings } from '../hooks/useUpdateSettings';
import SettingsModalHeader from './settings/SettingsModalHeader';
import ApiKeySection from './settings/ApiKeySection';
import UpdateSection from './settings/UpdateSection';
import ShortcutsSection from './settings/ShortcutsSection';
import TextSelectionIgnoreSection from './settings/TextSelectionIgnoreSection';
import FeaturesSection from './settings/FeaturesSection';
import SettingsActions from './settings/SettingsActions';
import { TabType, FeaturesConfig } from '../types/settings';
import '../styles/modal.css';
import '../styles/settings-modal.css';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

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

  // Text Selection Ignore state
  const [textSelectionConfig, setTextSelectionConfig] = useState({
    ignoredApplications: [] as string[],
    enabled: true,
  });
  const [isLoadingTextSelection, setIsLoadingTextSelection] = useState(true);

  // Features state
  const [featuresConfig, setFeaturesConfig] = useState<FeaturesConfig>({
    quickCaptureEnabled: true,
    textSelectionEnabled: true,
    textSelectionIgnoreEnabled: true,
  });
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(true);

  useEffect(() => {
    if (open) {
      loadMaskedKey();
      loadAppVersion();
      loadTextSelectionConfig();
      loadFeaturesConfig();
      setApiKey('');
      setShowKey(false);
    }
  }, [open, loadMaskedKey, loadAppVersion, setApiKey, setShowKey]);

  const loadTextSelectionConfig = async () => {
    try {
      const electronAPI = window.electronAPI as any;
      if (electronAPI?.getTextSelectionIgnoreConfig) {
        const data = await electronAPI.getTextSelectionIgnoreConfig();
        setTextSelectionConfig(data);
      }
    } catch (error) {
      console.error('Failed to load text selection ignore config:', error);
    } finally {
      setIsLoadingTextSelection(false);
    }
  };

  const loadFeaturesConfig = async () => {
    try {
      const electronAPI = window.electronAPI as any;
      if (electronAPI?.getFeaturesConfig) {
        const data = await electronAPI.getFeaturesConfig();
        setFeaturesConfig(data);
      }
    } catch (error) {
      console.error('Failed to load features config:', error);
    } finally {
      setIsLoadingFeatures(false);
    }
  };

  const handleSaveAndClose = async () => {
    const success = await handleSave();
    if (success) {
      setTimeout(() => onClose(), 1000);
    }
  };

  const handleSaveTextSelectionAndClose = async () => {
    try {
      const electronAPI = window.electronAPI as any;
      if (electronAPI?.saveTextSelectionIgnoreConfig) {
        await electronAPI.saveTextSelectionIgnoreConfig(textSelectionConfig);
        
        // Reload config in text selection monitoring
        if (electronAPI?.textSelectionPopup?.reloadIgnoreConfig) {
          await electronAPI.textSelectionPopup.reloadIgnoreConfig();
        }
        
        setTimeout(() => onClose(), 500);
      }
    } catch (error) {
      console.error('Failed to save text selection config:', error);
      alert('Failed to save configuration');
    }
  };

  const handleSaveFeaturesAndClose = async () => {
    try {
      const electronAPI = window.electronAPI as any;
      if (electronAPI?.saveFeaturesConfig) {
        await electronAPI.saveFeaturesConfig(featuresConfig);
        
        // Apply features config changes
        if (electronAPI?.applyFeaturesConfig) {
          await electronAPI.applyFeaturesConfig(featuresConfig);
        }
        
        setTimeout(() => onClose(), 500);
      }
    } catch (error) {
      console.error('Failed to save features config:', error);
      alert('Failed to save features configuration');
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

          {activeTab === 'textSelectionIgnore' && (
            <TextSelectionIgnoreSection
              config={textSelectionConfig}
              setConfig={setTextSelectionConfig}
              isLoading={isLoadingTextSelection}
            />
          )}

          {activeTab === 'features' && (
            <FeaturesSection
              config={featuresConfig}
              setConfig={setFeaturesConfig}
              isLoading={isLoadingFeatures}
            />
          )}
        </div>

        {/* Actions - Always at bottom */}
        <SettingsActions
          activeTab={activeTab}
          isLoading={
            activeTab === 'textSelectionIgnore' 
              ? isLoadingTextSelection 
              : activeTab === 'features'
              ? isLoadingFeatures
              : isLoading
          }
          apiKey={apiKey}
          updateReady={updateReady}
          updateAvailable={updateAvailable}
          downloading={downloading}
          checkingUpdate={checkingUpdate}
          updateInfo={updateInfo}
          onSave={
            activeTab === 'textSelectionIgnore' 
              ? handleSaveTextSelectionAndClose 
              : activeTab === 'features'
              ? handleSaveFeaturesAndClose
              : handleSaveAndClose
          }
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