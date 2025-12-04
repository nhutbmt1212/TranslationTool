import React from 'react';
import { useTranslation } from 'react-i18next';
import { FeaturesConfig } from '../../types/settings';

interface FeaturesSectionProps {
  config: FeaturesConfig;
  setConfig: React.Dispatch<React.SetStateAction<FeaturesConfig>>;
  isLoading: boolean;
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  config,
  setConfig,
  isLoading,
}) => {
  const { t } = useTranslation();

  const handleToggle = (key: keyof FeaturesConfig) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (isLoading) {
    return (
      <div className="settings-section-loading">
        {t('settings.features.loading') || 'Loading...'}
      </div>
    );
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          {t('settings.features.title') || 'Features'}
        </h3>
        <p className="settings-section-description">
          {t('settings.features.description') || 'Enable or disable application features'}
        </p>
      </div>

      <div className="settings-field">
        <label className="settings-toggle-label">
          <input
            type="checkbox"
            className="settings-toggle"
            checked={config.quickCaptureEnabled}
            onChange={() => handleToggle('quickCaptureEnabled')}
          />
          <span>{t('settings.features.quickCapture') || 'Quick screen capture & translate (Ctrl+Shift+0)'}</span>
        </label>
        <p className="settings-hint">
          {t('settings.features.quickCaptureHint') || 'Enable quick screen capture and translate with Ctrl+Shift+0 shortcut'}
        </p>
      </div>

      <div className="settings-field">
        <label className="settings-toggle-label">
          <input
            type="checkbox"
            className="settings-toggle"
            checked={config.textSelectionEnabled}
            onChange={() => handleToggle('textSelectionEnabled')}
          />
          <span>{t('settings.features.textSelection') || 'Text selection popup'}</span>
        </label>
        <p className="settings-hint">
          {t('settings.features.textSelectionHint') || 'Show translate button when selecting text'}
        </p>
      </div>

      <div className="settings-field">
        <label className="settings-toggle-label">
          <input
            type="checkbox"
            className="settings-toggle"
            checked={config.textSelectionIgnoreEnabled}
            onChange={() => handleToggle('textSelectionIgnoreEnabled')}
          />
          <span>{t('settings.features.textSelectionIgnore') || 'Enable text selection ignore list'}</span>
        </label>
        <p className="settings-hint">
          {t('settings.features.textSelectionIgnoreHint') || 'Use ignore list to disable text selection popup in specific applications'}
        </p>
      </div>
    </div>
  );
};

export default FeaturesSection;
