import React from 'react';
import { useTranslation } from 'react-i18next';
import { TabType } from '../../types/settings';

interface SettingsModalHeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const SettingsModalHeader: React.FC<SettingsModalHeaderProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="picker-header">
        <div>
          <p className="picker-eyebrow">{t('settings.eyebrow') || 'CONFIGURATION'}</p>
          <h3>{t('settings.title') || 'Settings'}</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'apiKey' ? 'active' : ''}`}
          onClick={() => onTabChange('apiKey')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
          {t('settings.tabs.apiKey') || 'API Key'}
        </button>
        <button
          className={`settings-tab ${activeTab === 'update' ? 'active' : ''}`}
          onClick={() => onTabChange('update')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t('settings.tabs.update') || 'Update'}
        </button>
        <button
          className={`settings-tab ${activeTab === 'shortcuts' ? 'active' : ''}`}
          onClick={() => onTabChange('shortcuts')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
            <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M6 16h12" />
          </svg>
          {t('settings.tabs.shortcuts') || 'Shortcuts'}
        </button>
        <button
          className={`settings-tab ${activeTab === 'textSelectionIgnore' ? 'active' : ''}`}
          onClick={() => onTabChange('textSelectionIgnore')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
          {t('settings.tabs.textSelectionIgnore') || 'Text Selection'}
        </button>
        <button
          className={`settings-tab ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => onTabChange('features')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          {t('settings.tabs.features') || 'Features'}
        </button>
      </div>
    </>
  );
};

export default SettingsModalHeader;