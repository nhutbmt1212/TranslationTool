import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface TextSelectionIgnoreConfig {
  ignoredApplications: string[];
  enabled: boolean;
}

interface TextSelectionIgnoreSectionProps {
  config: TextSelectionIgnoreConfig;
  setConfig: React.Dispatch<React.SetStateAction<TextSelectionIgnoreConfig>>;
  isLoading: boolean;
}

const TextSelectionIgnoreSection: React.FC<TextSelectionIgnoreSectionProps> = ({
  config,
  setConfig,
}) => {
  const { t } = useTranslation();
  const [newApp, setNewApp] = useState('');

  const handleAddApp = () => {
    const trimmed = newApp.trim();
    if (trimmed && !config.ignoredApplications.includes(trimmed)) {
      setConfig({
        ...config,
        ignoredApplications: [...config.ignoredApplications, trimmed],
      });
      setNewApp('');
    }
  };

  const handleRemoveApp = (app: string) => {
    setConfig({
      ...config,
      ignoredApplications: config.ignoredApplications.filter((a) => a !== app),
    });
  };

  const handleToggleEnabled = () => {
    setConfig({
      ...config,
      enabled: !config.enabled,
    });
  };

  return (
    <div className="settings-section">
      <div className="settings-field">
        <label className="settings-label">
          {t('settings.textSelectionIgnore.addApp')}
        </label>
        <div className="text-selection-ignore-input-group">
          <input
            type="text"
            value={newApp}
            onChange={(e) => setNewApp(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddApp()}
            placeholder={t('settings.textSelectionIgnore.placeholder')}
            className="settings-input"
          />
          <button
            onClick={handleAddApp}
            className="settings-button-secondary"
            disabled={!newApp.trim()}
          >
            {t('settings.textSelectionIgnore.add')}
          </button>
        </div>
        <p className="settings-hint">
          {t('settings.textSelectionIgnore.hint')}
        </p>
      </div>

      <div className="settings-field">
        <label className="settings-label">
          {t('settings.textSelectionIgnore.ignoredApps')} ({config.ignoredApplications.length})
        </label>
        <div className="text-selection-ignore-list">
          {config.ignoredApplications.length === 0 ? (
            <div className="text-selection-ignore-empty">
              {t('settings.textSelectionIgnore.noApps')}
            </div>
          ) : (
            config.ignoredApplications.map((app) => (
              <div key={app} className="text-selection-ignore-item">
                <span className="text-selection-ignore-app-name">{app}</span>
                <button
                  onClick={() => handleRemoveApp(app)}
                  className="text-selection-ignore-remove"
                  title={t('settings.textSelectionIgnore.remove')}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TextSelectionIgnoreSection;
