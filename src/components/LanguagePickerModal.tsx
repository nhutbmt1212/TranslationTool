import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from '../types/languages';

type PickerMode = 'source' | 'target';

interface LanguagePickerModalProps {
  open: boolean;
  mode: PickerMode;
  languages: Languages;
  sourceLang: string;
  targetLang: string;
  onClose: () => void;
  onModeChange: (mode: PickerMode) => void;
  onSelectSource: (code: string) => void;
  onSelectTarget: (code: string) => void;
}

const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({
  open,
  mode,
  languages,
  sourceLang,
  targetLang,
  onClose,
  onModeChange,
  onSelectSource,
  onSelectTarget,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (code: string) => {
    if (mode === 'source') {
      onSelectSource(code);
    } else {
      onSelectTarget(code);
    }
    onClose();
  };

  const isDisabled = (code: string) => {
    if (mode === 'source') {
      return code === targetLang;
    }
    return sourceLang !== 'auto' && code === sourceLang;
  };

  const titleKey = mode === 'source' ? 'languagePicker.titleSource' : 'languagePicker.titleTarget';

  const baseLanguageEntries = useMemo(() => {
    const entries = Object.entries(languages).sort((a, b) =>
      a[1].localeCompare(b[1], undefined, { sensitivity: 'base' })
    );

    if (mode === 'source') {
      const autoLabel = t('source.autoDetect', 'Auto detect');
      return [['auto', autoLabel], ...entries];
    }

    return entries;
  }, [languages, mode, t]);

  const filteredLanguages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return baseLanguageEntries;
    }

    return baseLanguageEntries.filter(([code, name]) => {
      const haystack = `${name} ${code}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [baseLanguageEntries, searchTerm]);

  const sanitizeInput = useCallback((value: string) => value.replace(/[^\p{L}]/gu, ''), []);

  const isLetterKey = useCallback((value: string) => /^\p{L}$/u.test(value), []);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      const target = event.target as HTMLElement | null;
      const isInputFocused = target && inputRef.current && inputRef.current.contains(target);
      if (isInputFocused) {
        return;
      }

      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      if (event.key.length === 1) {
        if (isLetterKey(event.key)) {
          event.preventDefault();
          inputRef.current?.focus();
          setSearchTerm((prev) => sanitizeInput(`${prev}${event.key}`));
        } else {
          event.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, isLetterKey, sanitizeInput]);

  if (!open) return null;

  return (
    <div className="language-picker-overlay" onClick={onClose}>
      <div className="language-picker" onClick={(e) => e.stopPropagation()}>
        <div className="picker-header">
          <div>
            <p className="picker-eyebrow">{t('languagePicker.eyebrow')}</p>
            <h3>{t(titleKey)}</h3>
          </div>
          <div className="picker-actions">
            <button className={mode === 'source' ? 'active' : ''} onClick={() => onModeChange('source')}>
              {t('languagePicker.tabSource')}
            </button>
            <button className={mode === 'target' ? 'active' : ''} onClick={() => onModeChange('target')}>
              {t('languagePicker.tabTarget')}
            </button>
          </div>
        </div>
        <div className="picker-search">
          <input
            type="text"
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('languagePicker.searchPlaceholder', 'Search languages...') ?? 'Search languages...'}
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm('')} aria-label={t('general.clear', 'Clear')}>
              ✕
            </button>
          )}
        </div>
        <div className="language-list">
          {filteredLanguages.map(([code, name]) => {
            const selected = mode === 'source' ? code === sourceLang : code === targetLang;
            return (
              <button
                key={code}
                className={`language-item${isDisabled(code) ? ' disabled' : ''}${selected ? ' selected' : ''}`}
                onClick={() => handleSelect(code)}
                disabled={isDisabled(code)}
              >
                <span className="language-name">{name}</span>
                <span className="language-code">{code}</span>
                {selected && <span className="language-check" aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LanguagePickerModal;
