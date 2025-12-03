import React, { useState, useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import languagesMetadata from './data/languages.json';
import HeaderBar from './components/HeaderBar';
import SourcePanel from './components/SourcePanel';
import TargetPanel from './components/TargetPanel';
import LanguagePickerModal from './components/LanguagePickerModal';
import ImagePreview from './components/ImagePreview';
import SettingsModal from './components/SettingsModal';
import ImageTranslator from './components/ImageTranslator';
import QuickScreenCapture from './components/QuickScreenCapture';
import { TranslateIcon } from './components/icons';
import { Languages, LanguageMetadata } from './types/languages';
import { uiLanguageOptions } from './i18n';
import { useOCR } from './hooks/useOCR';
import { useTranslationLogic } from './hooks/useTranslationLogic';
import './styles/screen-capture.css';

interface TranslationResult {
  text: string;
  from: string;
  to: string;
  originalText: string;
}

const fallbackLanguages = (languagesMetadata as LanguageMetadata[]).reduce<Languages>(
  (acc, lang) => {
    const displayName =
      lang.nameNative && lang.nameNative !== lang.nameEn
        ? `${lang.nameEn} (${lang.nameNative})`
        : lang.nameEn;
    acc[lang.code] = displayName;
    return acc;
  },
  {}
);

declare global {
  interface Window {
    electronAPI?: {
      translate: (text: string, targetLang: string, sourceLang?: string) => Promise<{
        success: boolean;
        data?: TranslationResult;
        error?: string;
      }>;
      getLanguages: () => Promise<Languages>;
      getAppVersion: () => Promise<string>;
      checkForUpdates: () => Promise<{ success: boolean; data?: any; error?: string }>;
      downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
      installUpdate: () => void;
      onUpdateChecking: (callback: () => void) => () => void;
      onUpdateAvailable: (callback: (info: any) => void) => () => void;
      onUpdateNotAvailable: (callback: (info: any) => void) => () => void;
      onUpdateError: (callback: (error: any) => void) => () => void;
      onUpdateDownloadProgress: (callback: (progress: any) => void) => () => void;
      onUpdateDownloaded: (callback: (info: any) => void) => () => void;
      
      // Screen Capture APIs
      screenCapture?: {
        getSize: () => Promise<{ width: number; height: number }>;
        captureFullScreen: () => Promise<Buffer>;
        captureRegion: (region: { x: number; y: number; width: number; height: number }) => Promise<Buffer>;
        selectDesktopRegion: () => Promise<Buffer | null>;
      };
    };
  }
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = localStorage.getItem('app-theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [sourceLang, setSourceLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app-source-lang') || 'auto';
    }
    return 'auto';
  });
  const [targetLang, setTargetLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app-target-lang') || 'en';
    }
    return 'en';
  });
  const [detectedLang, setDetectedLang] = useState('auto');
  const [languages, setLanguages] = useState<Languages>(fallbackLanguages);

  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [languagePickerMode, setLanguagePickerMode] = useState<'source' | 'target'>('source');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const copyResetTimers = useRef<{ source?: number; target?: number }>({});
  const [copyState, setCopyState] = useState({ source: false, target: false });

  // Custom Hooks
  const {
    isProcessingOCR,
    imagePreview,
    setImagePreview,
    processImage,
    countdown
  } = useOCR();

  const {
    isTranslating,
    handleTranslate
  } = useTranslationLogic(
    languages,
    sourceLang,
    targetLang,
    setSourceLang,
    setTargetLang,
    setDetectedLang,
    setOutputText
  );

  const openLanguagePicker = (mode: 'source' | 'target') => {
    setLanguagePickerMode(mode);
    setLanguagePickerOpen(true);
  };

  const inputChars = inputText.length;
  const outputChars = outputText.length;

  // Clear output when input is cleared
  useEffect(() => {
    if (inputText.trim() === '') {
      setOutputText('');
    }
  }, [inputText]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-theme', theme);
    }
  }, [theme]);

  // Persist language selections
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-source-lang', sourceLang);
    }
  }, [sourceLang]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-target-lang', targetLang);
    }
  }, [targetLang]);

  useEffect(() => {
    // Initialize UI language from localStorage
    if (typeof window !== 'undefined') {
      const storedUiLang = localStorage.getItem('app-ui-lang');
      if (storedUiLang && i18n.language !== storedUiLang) {
        i18n.changeLanguage(storedUiLang);
      }
    }

    const api = window.electronAPI;
    if (!api?.getLanguages) {
      setLanguages(fallbackLanguages);
      return;
    }

    const load = async () => {
      try {
        const langs = await api.getLanguages();
        if (langs && Object.keys(langs).length > 0) {
          setLanguages(langs);
        } else {
          setLanguages(fallbackLanguages);
        }
      } catch (err) {
        setLanguages(fallbackLanguages);
      }
    };

    load();
  }, []); // Empty dependency array means this runs once on mount

  const handleSwapLanguages = () => {
    // Always allow swapping languages for convenience
    if (sourceLang !== 'auto') {
      // Normal swap when source is not auto
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
      // Swap text content if both exist
      if (inputText || outputText) {
        setInputText(outputText);
        setOutputText(inputText);
      }
    } else if (detectedLang !== 'auto') {
      // Swap using detected language when source is auto
      setSourceLang(targetLang);
      setTargetLang(detectedLang);
      if (inputText || outputText) {
        setInputText(outputText);
        setOutputText(inputText);
      }
    }
  };

  const handleCopy = (text: string, panel?: 'source' | 'target') => {
    if (!text) return;
    navigator.clipboard.writeText(text);

    if (panel) {
      setCopyState((prev) => ({ ...prev, [panel]: true }));
      if (copyResetTimers.current[panel]) {
        window.clearTimeout(copyResetTimers.current[panel]);
      }
      copyResetTimers.current[panel] = window.setTimeout(() => {
        setCopyState((prev) => ({ ...prev, [panel]: false }));
      }, 1200);
    }
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const currentTargetLabel = languages[targetLang] || targetLang;
    await processImage(file, currentTargetLabel, (result) => {
      setInputText(result.originalText);
      setOutputText(result.translatedText);
      if (result.detectedLang && result.detectedLang !== 'auto') {
        setDetectedLang(result.detectedLang);
        setSourceLang(result.detectedLang);
      }
    });
  };

  const translateButtonLabel = isProcessingOCR
    ? t('status.ocrInProgress')
    : isTranslating
      ? t('status.translating')
      : t('buttons.translate');

  const handleUiLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('app-ui-lang', code);
  };

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    return () => {
      if (copyResetTimers.current.source) {
        window.clearTimeout(copyResetTimers.current.source);
      }
      if (copyResetTimers.current.target) {
        window.clearTimeout(copyResetTimers.current.target);
      }
    };
  }, []);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      // Don't intercept if language picker is open
      if (languagePickerOpen) return;

      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      // Check for files (Images)
      if (clipboardData.files && clipboardData.files.length > 0) {
        const file = clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          const currentTargetLabel = languages[targetLang] || targetLang;
          processImage(file, currentTargetLabel, (result) => {
            setInputText(result.originalText);
            setOutputText(result.translatedText);
            if (result.detectedLang && result.detectedLang !== 'auto') {
              setDetectedLang(result.detectedLang);
              setSourceLang(result.detectedLang);
            }
          });
          return;
        }
      }

      // Check for text
      const text = clipboardData.getData('text');
      if (text && text.trim()) {
        const activeElement = document.activeElement;
        const isInput = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;

        if (!isInput) {
          event.preventDefault();
          setInputText(text);
          handleTranslate(text, text);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [processImage, languagePickerOpen, handleTranslate]);

  const resolvedLanguage = i18n.resolvedLanguage || i18n.language || 'en';
  const currentUiLanguage = resolvedLanguage.split('-')[0];
  const sourceLabel =
    sourceLang === 'auto' ? t('source.autoDetect') : languages[sourceLang] || sourceLang.toUpperCase();
  const targetLabel = languages[targetLang] || targetLang.toUpperCase();

  return (
    <div className="app-shell">
      <ImageTranslator />
      <div className="orb orb-one" aria-hidden="true" />
      <div className="orb orb-two" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />
      <div className="app-surface">
        <HeaderBar
          onOpenLanguagePicker={() => openLanguagePicker('source')}
          uiLanguageOptions={uiLanguageOptions}
          currentUiLanguage={currentUiLanguage}
          onUiLanguageChange={handleUiLanguageChange}
          theme={theme}
          onThemeToggle={handleThemeToggle}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <main className="main-content">
          <section className="translation-section">
            <SourcePanel
              sourceLang={sourceLang}
              languages={languages}
              inputText={inputText}
              detectedLang={detectedLang}
              charCount={inputChars}
              onInputTextChange={setInputText}
              onCopy={() => handleCopy(inputText, 'source')}
              onOpenLanguagePicker={() => openLanguagePicker('source')}
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
                onImageCaptured={(text) => {
                  setInputText(text);
                  // Auto translate after capturing
                  handleTranslate(text, text);
                }}
                disabled={isTranslating || isProcessingOCR}
              />
            </div>

            <TargetPanel
              targetLang={targetLang}
              outputText={outputText}
              charCount={outputChars}
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
            if (sourceLang === code) {
              setSourceLang('auto');
            }
          }}
        />
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
      <Toaster
        position="top-center"
        containerStyle={{
          zIndex: 99999,
        }}
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default App;

