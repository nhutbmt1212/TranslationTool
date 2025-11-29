import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface HeaderBarProps {
  onOpenLanguagePicker: () => void;
  uiLanguageOptions: { code: string; label: string }[];
  currentUiLanguage: string;
  onUiLanguageChange: (code: string) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenLanguagePicker,
  uiLanguageOptions,
  currentUiLanguage,
  onUiLanguageChange,
  theme,
  onThemeToggle,
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
        <p className="brand-eyebrow">AI-first translation cockpit</p>
        <h1>{t('app.title')}</h1>
        <p className="subtitle">{t('app.subtitle')}</p>
      </div>
      <div className="hero-actions">
        <span className="hero-label">{t('header.uiLanguageLabel')}</span>
        <div className="hero-select-wrapper" ref={menuRef}>
          <button
            type="button"
            className={`hero-select${uiMenuOpen ? ' open' : ''}`}
            onClick={() => setUiMenuOpen((open) => !open)}
            aria-haspopup="listbox"
            aria-expanded={uiMenuOpen}
          >
            <span className="hero-select-icon" aria-hidden="true">
              🌐
            </span>
            <span className="hero-select-text">{currentLabel}</span>
            <span className="hero-select-caret" aria-hidden="true">
              ▾
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
            {theme === 'light' ? '🌙' : '☀️'}
          </span>
          <span>{theme === 'light' ? t('header.darkMode', 'Dark') : t('header.lightMode', 'Light')}</span>
        </button>
        {/* <button
          type="button"
          className="hero-button"
          onClick={onOpenLanguagePicker}
          aria-label={t('buttons.openLanguagePicker') ?? undefined}
        >
          <span className="hero-button-icon" aria-hidden="true">
            🔤
          </span>
          {t('buttons.openLanguagePicker')}
        </button> */}
      </div>
    </header>
  );
};

export default HeaderBar;

