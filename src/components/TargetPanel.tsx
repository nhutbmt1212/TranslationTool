import React from 'react';
import { useTranslation } from 'react-i18next';
interface TargetPanelProps {
  targetLang: string;
  outputText: string;
  charCount: number;
  onCopy: () => void;
  onOpenLanguagePicker: () => void;
  targetLabel: string;
  copied: boolean;
}

const TargetPanel: React.FC<TargetPanelProps> = ({
  targetLang,
  outputText,
  charCount,
  onCopy,
  onOpenLanguagePicker,
  targetLabel,
  copied,
}) => {
  const { t } = useTranslation();

  return (
    <div className="translation-box target-box">
      <div className="panel-top simple-panel-header">
        <button type="button" className="simple-select-trigger" onClick={onOpenLanguagePicker}>
          <span className="select-label">{targetLabel}</span>
          <span className="select-caret" aria-hidden="true" />
        </button>
      </div>
      <textarea
        className="text-output simple-textarea"
        placeholder={t('target.placeholder') ?? ''}
        value={outputText}
        readOnly
        rows={8}
      />
      <div className="box-footer target-footer simple-footer">
        <div className="target-footer-left">
          <button
            type="button"
            className="icon-button simple-icon-button"
            onClick={onCopy}
            title={t('buttons.copy') ?? undefined}
            disabled={!outputText}
          >
            {copied ? '✓' : '📋'}
          </button>
        </div>
        <span className="char-count simple-char-count target-footer-right">
          {t('general.characters', { count: charCount })}
        </span>
      </div>
    </div>
  );
};

export default TargetPanel;
