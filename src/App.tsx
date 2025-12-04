import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Components
import HeaderBar from './components/HeaderBar';
import SourcePanel from './components/SourcePanel';
import TargetPanel from './components/TargetPanel';
import LanguagePickerModal from './components/LanguagePickerModal';
import ImagePreview from './components/ImagePreview';
import SettingsModal from './components/SettingsModal';
import ImageTranslator from './components/ImageTranslator';
import QuickScreenCapture from './components/QuickScreenCapture';
import { TranslateIcon } from './components/icons';

// Hooks
import { useTheme } from './hooks/useTheme';
import { useLanguages } from './hooks/useLanguages';
import { useUiLanguage } from './hooks/useUiLanguage';
import { useCopyState } from './hooks/useCopyState';
import { useOCR } from './hooks/useOCR';
import { useTranslationLogic } from './hooks/useTranslationLogic';
import { useScreenCapture } from './hooks/useScreenCapture';
import { useGlobalPaste } from './hooks/useGlobalPaste';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';

// Config
import { uiLanguageOptions } from './i18n';
import './styles/screen-capture.css';

// Types
import './types/electron.d.ts';

const App: React.FC = () => {
  const { t } = useTranslation();

  // UI State
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [languagePickerMode, setLanguagePickerMode] = useState<'source' | 'target'>('source');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Custom Hooks
  const { theme, toggleTheme } = useTheme();
  const { currentUiLanguage, changeUiLanguage } = useUiLanguage();
  const { copyState, handleCopy } = useCopyState();
  const {
    languages,
    sourceLang,
    targetLang,
    detectedLang,
    setSourceLang,
    setTargetLang,
    setDetectedLang,
    swapLanguages,
  } = useLanguages();

  const { isProcessingOCR, imagePreview, setImagePreview, processImage, countdown } = useOCR();
  const { captureScreen } = useScreenCapture();
  const { isTranslating, handleTranslate } = useTranslationLogic(
    languages,
    sourceLang,
    targetLang,
    setSourceLang,
    setTargetLang,
    setDetectedLang,
    setOutputText
  );

  // OCR result handler
  const handleOCRResult = useCallback(
    (result: { originalText: string; translatedText: string; detectedLang: string }) => {
      setInputText(result.originalText);
      setOutputText(result.translatedText);
      if (result.detectedLang && result.detectedLang !== 'auto') {
        setDetectedLang(result.detectedLang);
        setSourceLang(result.detectedLang);
      }
    },
    [setDetectedLang, setSourceLang]
  );

  // Global event hooks
  useGlobalPaste({
    languagePickerOpen,
    targetLang,
    languages,
    processImage,
    handleTranslate,
    onTextPaste: setInputText,
    onImageResult: handleOCRResult,
  });

  useGlobalShortcuts({
    isTranslating,
    isProcessingOCR,
    captureScreen,
    onCaptureSuccess: setInputText,
    handleTranslate,
  });

  // Clear output when input is cleared
  useEffect(() => {
    if (inputText.trim() === '') setOutputText('');
  }, [inputText]);

  // Listen for text selection translate event from popup
  useEffect(() => {
    const cleanup = window.electronAPI?.onTextSelectionTranslate?.((text: string) => {
      if (text && text.trim()) {
        setInputText(text);
        // Auto translate after setting text
        handleTranslate(text, text);
      }
    });
    return () => cleanup?.();
  }, [handleTranslate]);

  // Handlers
  const openLanguagePicker = (mode: 'source' | 'target') => {
    setLanguagePickerMode(mode);
    setLanguagePickerOpen(true);
  };

  const handleSwapLanguages = () => {
    const result = swapLanguages(inputText, outputText);
    if (result) {
      setInputText(result.newInput);
      setOutputText(result.newOutput);
    }
  };

  const handleQuickCapture = (text: string) => {
    setInputText(text);
    handleTranslate(text, text);
  };

  // Derived values
  const sourceLabel =
    sourceLang === 'auto' ? t('source.autoDetect') : languages[sourceLang] || sourceLang.toUpperCase();
  const targetLabel = languages[targetLang] || targetLang.toUpperCase();
  const translateButtonLabel = isProcessingOCR
    ? t('status.ocrInProgress')
    : isTranslating
      ? t('status.translating')
      : t('buttons.translate');

  return (
    <div className="app-shell">
      {!settingsOpen && <ImageTranslator />}
      <div className="orb orb-one" aria-hidden="true" />
      <div className="orb orb-two" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />

      <div className="app-surface">
        <HeaderBar
          uiLanguageOptions={uiLanguageOptions}
          currentUiLanguage={currentUiLanguage}
          onUiLanguageChange={changeUiLanguage}
          theme={theme}
          onThemeToggle={toggleTheme}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <main className="main-content">
          <section className="translation-section">
            <SourcePanel
              sourceLang={sourceLang}
              inputText={inputText}
              detectedLang={detectedLang}
              charCount={inputText.length}
              onInputTextChange={setInputText}
              onCopy={() => handleCopy(inputText, 'source')}
              onOpenLanguagePicker={() => openLanguagePicker('source')}
              onTranslate={() => handleTranslate(inputText)}
              sourceLabel={sourceLabel}
              copied={copyState.source}
            />

            <div className="swap-panel">
              <button
                type="button"
                className="swap-button"
                onClick={handleSwapLanguages}
                title={t('buttons.swapLanguages')}
                aria-label={t('buttons.swapLanguages')}
                disabled={sourceLang === 'auto' && detectedLang === 'auto'}
              >
                ⇆
              </button>

              <QuickScreenCapture
                onImageCaptured={handleQuickCapture}
                disabled={isTranslating || isProcessingOCR}
              />
            </div>

            <TargetPanel
              targetLang={targetLang}
              outputText={outputText}
              charCount={outputText.length}
              onCopy={() => handleCopy(outputText, 'target')}
              onOpenLanguagePicker={() => openLanguagePicker('target')}
              targetLabel={targetLabel}
              copied={copyState.target}
            />
          </section>

          <section className="action-bar">
            <button
              type="button"
              className={`translate-button${isTranslating ? ' loading' : ''}`}
              onClick={() => handleTranslate(inputText)}
              disabled={isTranslating || isProcessingOCR || !inputText.trim()}
            >
              {isTranslating ? (
                <span className="button-spinner" aria-hidden="true" />
              ) : (
                <TranslateIcon size={24} className="translate-icon" />
              )}
              <span className="translate-button-label">{translateButtonLabel}</span>
            </button>
          </section>
        </main>

        <ImagePreview
          imagePreview={imagePreview}
          isProcessingOCR={isProcessingOCR}
          countdown={countdown}
          onClose={() => setImagePreview(null)}
        />

        <LanguagePickerModal
          open={languagePickerOpen}
          mode={languagePickerMode}
          languages={languages}
          sourceLang={sourceLang}
          targetLang={targetLang}
          onClose={() => setLanguagePickerOpen(false)}
          onModeChange={setLanguagePickerMode}
          onSelectSource={(code: string) => {
            setSourceLang(code);
            if (code === targetLang) {
              const alternative = Object.keys(languages).find((lang) => lang !== code) || 'en';
              setTargetLang(alternative);
            }
          }}
          onSelectTarget={(code: string) => {
            setTargetLang(code);
            if (sourceLang === code) setSourceLang('auto');
          }}
        />

        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>

      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{
          style: { background: '#333', color: '#fff', borderRadius: '8px', padding: '12px 16px' },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
    </div>
  );
};

export default App;
