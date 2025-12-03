import React from 'react';
import { useTranslation } from 'react-i18next';

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'global' | 'app';
}

const ShortcutsSection: React.FC = () => {
  const { t } = useTranslation();

  const shortcuts: ShortcutItem[] = [
    // Global shortcuts (work anywhere)
    {
      keys: ['Ctrl', 'Shift', '0'],
      description: t('settings.shortcuts.screenCapture') || 'Quick screen capture & translate',
      category: 'global',
    },
    {
      keys: ['Ctrl', 'Shift', 'C'],
      description: t('settings.shortcuts.translateSelection') || 'Translate selected text',
      category: 'global',
    },
    // App shortcuts (work inside app)
    {
      keys: ['Ctrl', 'Enter'],
      description: t('settings.shortcuts.translate') || 'Translate text',
      category: 'app',
    },
    {
      keys: ['Ctrl', 'V'],
      description: t('settings.shortcuts.pasteTranslate') || 'Paste and translate',
      category: 'app',
    },
  ];

  const globalShortcuts = shortcuts.filter(s => s.category === 'global');
  const appShortcuts = shortcuts.filter(s => s.category === 'app');

  const renderShortcut = (shortcut: ShortcutItem, index: number) => (
    <div key={index} className="shortcut-item">
      <div className="shortcut-keys">
        {shortcut.keys.map((key, i) => (
          <React.Fragment key={i}>
            <kbd className="shortcut-key">{key}</kbd>
            {i < shortcut.keys.length - 1 && <span className="key-separator">+</span>}
          </React.Fragment>
        ))}
      </div>
      <span className="shortcut-description">{shortcut.description}</span>
    </div>
  );

  return (
    <div className="shortcuts-section">
      {/* Global Shortcuts */}
      <div className="shortcut-category">
        <h4 className="shortcut-category-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          {t('settings.shortcuts.globalTitle') || 'Global Shortcuts'}
        </h4>
        <p className="shortcut-category-desc">
          {t('settings.shortcuts.globalDesc') || 'These shortcuts work anywhere on your system'}
        </p>
        <div className="shortcuts-list">
          {globalShortcuts.map(renderShortcut)}
        </div>
      </div>

      {/* App Shortcuts */}
      <div className="shortcut-category">
        <h4 className="shortcut-category-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          {t('settings.shortcuts.appTitle') || 'App Shortcuts'}
        </h4>
        <p className="shortcut-category-desc">
          {t('settings.shortcuts.appDesc') || 'These shortcuts work when the app is focused'}
        </p>
        <div className="shortcuts-list">
          {appShortcuts.map(renderShortcut)}
        </div>
      </div>

      {/* Tips */}
      <div className="shortcuts-tips">
        <div className="tip-icon">💡</div>
        <p>{t('settings.shortcuts.tip') || 'Tip: Select any text and a translate button will appear automatically!'}</p>
      </div>
    </div>
  );
};

export default ShortcutsSection;
