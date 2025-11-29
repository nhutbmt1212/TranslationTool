import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import languagesMetadata from './data/languages.json';
import HeaderBar from '././components/HeaderBar';
import SourcePanel from '././components/SourcePanel';
import TargetPanel from '././components/TargetPanel';
import LanguagePickerModal from '././components/LanguagePickerModal';
import { Languages, LanguageMetadata } from './types/languages';
import { uiLanguageOptions } from './i18n';

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

const convertFileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

declare global {
  interface Window {
    electronAPI?: {
      translate: (text: string, targetLang: string, sourceLang?: string) => Promise<{
        success: boolean;
        data?: TranslationResult;
        error?: string;
      }>;
      getLanguages: () => Promise<Languages>;
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
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [detectedLang, setDetectedLang] = useState('auto');
  const [languages, setLanguages] = useState<Languages>(fallbackLanguages);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [languagePickerMode, setLanguagePickerMode] = useState<'source' | 'target'>('source');
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const copyResetTimers = useRef<{ source?: number; target?: number }>({});
  const [copyState, setCopyState] = useState({ source: false, target: false });

  const openLanguagePicker = (mode: 'source' | 'target') => {
    setLanguagePickerMode(mode);
    setLanguagePickerOpen(true);
  };

  const inputChars = inputText.length;
  const outputChars = outputText.length;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
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
        console.error('Unable to load language list', err);
        setLanguages(fallbackLanguages);
      }
    };

    load();
  }, []);

  const translateWithGemini = async (
    text: string,
    targetLangCode: string,
    targetLabel: string,
    sourceLangCode?: string
  ): Promise<{ translatedText: string; detectedLang: string }> => {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (!GEMINI_API_KEY) {
      throw new Error(t('errors.missingGeminiKey'));
    }

    const GEMINI_MODEL = 'gemini-2.5-flash-lite';
    const sourceInstruction = sourceLangCode
      ? `Nguồn văn bản sử dụng mã ngôn ngữ ${sourceLangCode}.`
      : 'Hãy tự động phát hiện ngôn ngữ nguồn và trả về mã ISO 639-1.';

    const prompt = `Bạn là biên dịch viên bản ngữ, ưu tiên dịch tự nhiên và giàu ngữ cảnh.
${sourceInstruction}
Hãy truyền đạt ý chính, sắc thái cảm xúc và mức độ trang trọng giống bản gốc nhưng chọn từ ngữ đời thường như người bản xứ.
Không dịch word-by-word, tránh văn phong học thuật hoặc gượng gạo.
Dịch sang ${targetLabel} (mã ${targetLangCode}) và chỉ trả về JSON:
{"detectedLang":"<mã nguồn>","translatedText":"<bản dịch tự nhiên>"}
Giữ nguyên bố cục dòng, không thêm lời giải thích, ký hiệu hay đoạn thừa.

Văn bản cần dịch:
"""${text}"""`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => undefined);
      throw new Error(error?.error?.message || t('errors.translationRequestFailed'));
    }

    const data = await response.json();
    const rawText = (data.candidates?.[0]?.content?.parts || [])
      .map((part: { text?: string }) => part.text ?? '')
      .join('\n')
      .trim();

    if (!rawText) {
      throw new Error(t('errors.noResponse'));
    }

    // Extract JSON object from the response
    let cleaned = rawText.replace(/```json|```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    let parsed: { translatedText?: string; detectedLang?: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error('Failed to parse Gemini response:', rawText);
      throw new Error(t('errors.invalidTranslationResponse'));
    }

    if (!parsed.translatedText) {
      throw new Error(t('errors.noTranslationOutput'));
    }

    return {
      translatedText: parsed.translatedText.trim(),
      detectedLang: parsed.detectedLang?.trim() || sourceLangCode || 'auto',
    };
  };

  const handleTranslate = async (arg?: string | React.MouseEvent) => {
    const textOverride = typeof arg === 'string' ? arg : undefined;
    const textToTranslate = (textOverride ?? inputText).trim();

    if (!textToTranslate.trim()) {
      setError(t('errors.inputRequired'));
      return;
    }

    setIsTranslating(true);
    setError(null);
    setOutputText('');

    try {
      let currentTarget = targetLang;
      let targetLabel = languages[currentTarget] || currentTarget;

      // First translation attempt
      let { translatedText, detectedLang: detected } = await translateWithGemini(
        textToTranslate,
        currentTarget,
        targetLabel,
        sourceLang === 'auto' ? undefined : sourceLang
      );

      const detectedCode = detected || 'auto';

      // Smart Language Switching Logic
      if (detectedCode !== 'auto') {
        // Always update source language to what was detected
        setSourceLang(detectedCode);

        // If detected source language is the same as the current target language
        if (detectedCode === currentTarget) {
          const defaultTarget = 'en';

          // Switch target to English if it's not already English
          if (currentTarget !== defaultTarget) {
            currentTarget = defaultTarget;
            targetLabel = languages[currentTarget] || currentTarget;
            setTargetLang(currentTarget);

            // Re-translate with the new target language
            const retryResult = await translateWithGemini(
              textToTranslate,
              currentTarget,
              targetLabel,
              detectedCode
            );
            translatedText = retryResult.translatedText;
          }
        }
      }

      setOutputText(translatedText);
      setDetectedLang(detectedCode);

    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unknown'));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang !== 'auto') {
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
      setInputText(outputText);
      setOutputText(inputText);
    } else if (detectedLang !== 'auto') {
      setSourceLang(targetLang);
      setTargetLang(detectedLang);
      setInputText(outputText);
      setOutputText(inputText);
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

  const processImage = async (file: File) => {
    // Kiểm tra định dạng file
    if (!file.type.startsWith('image/')) {
      setError(t('errors.invalidImageFile'));
      return;
    }

    // Hiển thị preview
    const base64DataUrl = await convertFileToBase64(file);
    setImagePreview(base64DataUrl);

    // Xử lý OCR
    setIsProcessingOCR(true);
    setError(null);

    try {
      // Sử dụng Gemini API (miễn phí, không cần billing)
      const text = await recognizeWithGemini(file);

      // Làm sạch văn bản
      const cleanedText = text.trim();

      if (cleanedText) {
        setInputText(cleanedText);
        setImagePreview(null);
        // Tự động dịch sau khi nhận diện
        await handleTranslate(cleanedText);
      } else {
        setError(t('errors.noTextFoundInImage'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.ocrFailure'));
    } finally {
      setIsProcessingOCR(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processImage(file);
  };



  // OCR với Google Gemini API (miễn phí, không cần billing)
  const recognizeWithGemini = async (file: File): Promise<string> => {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (!GEMINI_API_KEY) {
      throw new Error(t('errors.missingGeminiKey'));
    }

    // Chuyển file thành base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const mimeType = file.type || 'image/png';

    // Model mới (Gemini 2.5 Flash) hỗ trợ generateContent hình ảnh
    const GEMINI_MODEL = 'gemini-2.5-flash-lite';

    // Gọi Gemini API với API key
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Extract all text from this image. Return only the text content, no explanations or additional text.'
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64
                  }
                }
              ]
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || t('errors.translationRequestFailed'));
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return '';
    }

    return text.trim();
  };

  const translateButtonLabel = isProcessingOCR
    ? `🔍 ${t('status.ocrInProgress')}`
    : isTranslating
      ? `🔄 ${t('status.translating')}`
      : `✨ ${t('buttons.translate')}`;

  const handleUiLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
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
          processImage(file);
          return;
        }
      }

      // Check for text
      const text = clipboardData.getData('text');
      if (text && text.trim()) {
        const activeElement = document.activeElement;
        const isInput = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;

        // If user is NOT typing in an input, OR if they are in the main source input,
        // we want to trigger the "Paste & Translate" flow.
        // However, if they are in the source input, we need to be careful not to double-paste.
        // For now, let's only hijack if they are NOT in an input, to allow normal editing.
        // BUT, the user requested "Ctrl+V ... api dịch luôn".
        // So if they paste into the source box, maybe they WANT it to translate immediately?
        // Let's implement: If not in an input, hijack.
        if (!isInput) {
          event.preventDefault();
          setInputText(text);
          handleTranslate(text);
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
                disabled={!inputText || !outputText}
              >
                ⇆
              </button>
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

          {imagePreview && (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button
                type="button"
                className="close-preview-button"
                onClick={() => {
                  setImagePreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                ✕
              </button>
            </div>
          )}

          <section className="action-bar">
            <div className="stat-group">
              <div className="stat-chip">
                <span>{t('languagePicker.tabSource')}</span>
                <strong>{t('general.characters', { count: inputChars })}</strong>
              </div>
              <div className="stat-chip">
                <span>{t('languagePicker.tabTarget')}</span>
                <strong>{t('general.characters', { count: outputChars })}</strong>
              </div>
            </div>
            <button
              type="button"
              className={`translate-button${isTranslating ? ' loading' : ''}`}
              onClick={handleTranslate}
              disabled={isTranslating || isProcessingOCR || !inputText.trim()}
            >
              {isTranslating && <span className="button-spinner" aria-hidden="true" />}
              <span className="translate-button-label">{translateButtonLabel}</span>
            </button>
          </section>

          {error && (
            <div className="error-banner" role="alert">
              ❌ {error}
            </div>
          )}
        </main>
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
      </div>
    </div>
  );
};

export default App;

