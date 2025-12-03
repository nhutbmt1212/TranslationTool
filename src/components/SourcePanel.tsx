import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CopyIcon, CheckIcon, SpeakerIcon, SpeakerOffIcon } from './icons';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface SourcePanelProps {
  sourceLang: string;
  inputText: string;
  detectedLang: string;
  charCount: number;
  onInputTextChange: (text: string) => void;
  onCopy: () => void;
  onOpenLanguagePicker: () => void;
  onTranslate?: () => void;
  sourceLabel: string;
  copied: boolean;
}

const SourcePanel: React.FC<SourcePanelProps> = ({
  sourceLang,
  inputText,
  detectedLang,
  charCount,
  onInputTextChange,
  onCopy,
  onOpenLanguagePicker,
  onTranslate,
  sourceLabel,
  copied,
}) => {
  const { t } = useTranslation();
  const { isSpeaking, triggerTTS } = useTextToSpeech();

  const handleSpeak = useCallback(async () => {
    await triggerTTS(inputText, sourceLang, detectedLang);
  }, [triggerTTS, inputText, sourceLang, detectedLang]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.ctrlKey && e.key === 'Enter' && onTranslate) {
        e.preventDefault();
        onTranslate();
      }
    },
    [onTranslate]
  );

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
      </div>
      <textarea
        className="text-input simple-textarea"
        placeholder={t('source.placeholder') ?? ''}
        value={inputText}
        onChange={(e) => onInputTextChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={8}
        spellCheck={false}
      />
      <div className="box-footer simple-footer source-footer">
        <div className="source-footer-left">
          <button
            type="button"
            className="icon-button simple-icon-button"
            onClick={handleSpeak}
            title={isSpeaking ? 'Stop' : 'Listen'}
            disabled={!inputText}
          >
            {isSpeaking ? <SpeakerOffIcon size={18} /> : <SpeakerIcon size={18} />}
          </button>
          <button
            type="button"
            className="icon-button simple-icon-button"
            onClick={onCopy}
            title={t('buttons.copy') ?? undefined}
            disabled={!inputText}
          >
            {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
          </button>
        </div>
        <span className="char-count simple-char-count source-footer-right">
          {t('general.characters', { count: charCount })}
        </span>
      </div>
    </div>
  );
};

export default SourcePanel;
