import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface HeaderBarProps {
  onOpenLanguagePicker: () => void;
  uiLanguageOptions: { code: string; label: string }[];
  currentUiLanguage: string;
  onUiLanguageChange: (code: string) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onOpenSettings: () => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenLanguagePicker,
  uiLanguageOptions,
  currentUiLanguage,
  onUiLanguageChange,
  theme,
  onThemeToggle,
  onOpenSettings,
}) => {
  const { t } = useTranslation();
  const [uiMenuOpen, setUiMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUiMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentLabel =
    uiLanguageOptions.find((option) => option.code === currentUiLanguage)?.label ||
    currentUiLanguage;

  const handleUiMenuSelect = (code: string) => {
    onUiLanguageChange(code);
    setUiMenuOpen(false);
  };

  const themeToggleLabel =
    theme === 'light'
      ? t('header.switchDark', 'Switch to dark mode')
      : t('header.switchLight', 'Switch to light mode');

  return (
    <header className="header hero-banner">
      <div className="hero-text">
        <p className="brand-eyebrow">POWERED BY AI</p>
        <h1>{t('app.title')}</h1>
        <p className="subtitle">{t('app.subtitle')}</p>
      </div>
      <div className="hero-actions">
        <div className="hero-select-wrapper" ref={menuRef}>
          <button
            type="button"
            className={`hero-select${uiMenuOpen ? ' open' : ''}`}
            onClick={() => setUiMenuOpen((open) => !open)}
            aria-haspopup="listbox"
            aria-expanded={uiMenuOpen}
          >
            <span className="hero-select-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </span>
            <span className="hero-select-text">{currentLabel}</span>
            <span className="hero-select-caret" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </button>
          {uiMenuOpen && (
            <div className="hero-menu" role="listbox">
              {uiLanguageOptions.map((option) => (
                <button
                  type="button"
                  key={option.code}
                  role="option"
                  aria-selected={option.code === currentUiLanguage}
                  className={`hero-option${option.code === currentUiLanguage ? ' active' : ''}`}
                  onClick={() => handleUiMenuSelect(option.code)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="hero-toggle"
          onClick={onThemeToggle}
          aria-label={themeToggleLabel}
        >
          <span className="hero-toggle-icon" aria-hidden="true">
            {theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </span>
          <span>{theme === 'light' ? t('header.darkMode', 'Dark') : t('header.lightMode', 'Light')}</span>
        </button>
        <button
          type="button"
          className="hero-button"
          onClick={onOpenSettings}
          aria-label={t('header.settings', 'Settings')}
        >
          <span className="hero-button-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>
          <span>{t('header.settings', 'Settings')}</span>
        </button>
      </div>
    </header>
  );
};

export default HeaderBar;
