import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from '../types/languages';

interface SourcePanelProps {
  sourceLang: string;
  languages: Languages;
  inputText: string;
  detectedLang: string;
  isProcessingOCR: boolean;
  charCount: number;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onInputTextChange: (text: string) => void;
  onCaptureClick: () => void;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCopy: () => void;
  onOpenLanguagePicker: () => void;
  sourceLabel: string;
}

const SourcePanel: React.FC<SourcePanelProps> = ({
  sourceLang,
  languages,
  inputText,
  detectedLang,
  isProcessingOCR,
  charCount,
  fileInputRef,
  onInputTextChange,
  onCaptureClick,
  onImageSelect,
  onCopy,
  onOpenLanguagePicker,
  sourceLabel,
}) => {
  const { t } = useTranslation();

  const detectedLabel =
    sourceLang === 'auto' && detectedLang !== 'auto'
      ? languages[detectedLang] || detectedLang.toUpperCase()
      : null;

  return (
    <div className="translation-box source-box">
      <div className="panel-top simple-panel-header">
        <button
          type="button"
          className="simple-select-trigger"
          onClick={onOpenLanguagePicker}
        >
          <span className="select-label">{sourceLabel}</span>
          <span className="select-caret" aria-hidden="true" />
        </button>
        {detectedLabel && (
          <span className="detected-chip simple-detected">
            {t('source.autoDetect')}: {detectedLabel}
          </span>
        )}
      </div>
      <textarea
        className="text-input simple-textarea"
        placeholder={t('source.placeholder') ?? ''}
        value={inputText}
        onChange={(e) => onInputTextChange(e.target.value)}
        rows={8}
        spellCheck={false}
      />
      <div className="box-footer simple-footer">
        <div className="footer-left">
          <button
            type="button"
            className="icon-button simple-icon-button"
            onClick={onCaptureClick}
            title={t('source.captureTitle') ?? undefined}
            disabled={isProcessingOCR}
          >
            📷
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onImageSelect}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="icon-button simple-icon-button"
            onClick={onCopy}
            title={t('buttons.copy') ?? undefined}
            disabled={!inputText}
          >
            📋
          </button>
        </div>
        <span className="char-count simple-char-count">
          {t('general.characters', { count: charCount })}
        </span>
      </div>
    </div>
  );
};

export default SourcePanel;
