import React, { useState, useEffect, useRef } from 'react';
import languagesMetadata from './data/languages.json';

interface TranslationResult {
  text: string;
  from: string;
  to: string;
  originalText: string;
}

interface Languages {
  [key: string]: string;
}

type LanguageMetadata = {
  code: string;
  nameEn: string;
  nameNative: string;
};

const fallbackLanguages = (languagesMetadata as LanguageMetadata[]).reduce<Languages>(
  (acc, lang) => {
    const displayName =
      lang.nameNative && lang.nameNative !== lang.nameEn
        ? `${lang.nameEn}`
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

const App: React.FC = () => {   
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
  const [isPasting, setIsPasting] = useState(false);

  const findAlternativeLanguage = (excludeCode: string) => {
    const entries = Object.keys(languages);
    if (!entries.length) {
      return excludeCode === 'en' ? 'vi' : 'en';
    }
    const fallback = entries.find((code) => code !== excludeCode);
    return fallback || entries[0];
  };

  const currentSourceLabel =
    sourceLang === 'auto' ? 'Tự động phát hiện' : languages[sourceLang] || sourceLang;
  const currentTargetLabel = languages[targetLang] || targetLang;
  const detectedLabel =
    detectedLang === 'auto' ? 'Đang phát hiện...' : languages[detectedLang] || detectedLang;

  const inputChars = inputText.length;
  const outputChars = outputText.length;
  const inputWords = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const outputWords = outputText.trim() ? outputText.trim().split(/\s+/).length : 0;
  const estimatedReadSeconds = outputWords
    ? Math.max(5, Math.ceil((outputWords / 150) * 60))
    : 0;

  const isClearDisabled = !inputText && !outputText && !imagePreview;
  const showDetectedChip = detectedLang !== 'auto';

  const handleClearAll = () => {
    setInputText('');
    setOutputText('');
    setDetectedLang('auto');
    setImagePreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    const api = window.electronAPI;
    if (!api?.getLanguages) {
      setLanguages(fallbackLanguages);
      return;
    }

    try {
      const langs = await api.getLanguages();
      if (langs && Object.keys(langs).length > 0) {
        setLanguages(langs);
      } else {
        setLanguages(fallbackLanguages);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách ngôn ngữ:', err);
      setLanguages(fallbackLanguages);
    }
  };

  const translateWithGemini = async (
    text: string,
    targetLangCode: string,
    targetLabel: string,
    sourceLangCode?: string
  ): Promise<{ translatedText: string; detectedLang: string }> => {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (!GEMINI_API_KEY) {
      throw new Error('Thiếu VITE_GEMINI_API_KEY trong file .env');
    }

    const GEMINI_MODEL = 'gemini-2.5-flash-lite';
    const sourceInstruction = sourceLangCode
      ? `Nguồn văn bản sử dụng mã ngôn ngữ ${sourceLangCode}.`
      : 'Hãy tự động phát hiện ngôn ngữ nguồn và trả về mã ISO 639-1.';

    const prompt = `Bạn là công cụ dịch chính xác.
${sourceInstruction}
Dịch văn bản sang ${targetLabel} (mã ${targetLangCode}) và chỉ trả về JSON:
{"detectedLang":"<mã nguồn>","translatedText":"<bản dịch>"}
Giữ nguyên xuống dòng, không thêm giải thích hay ký hiệu.

Văn bản:
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
      throw new Error(error?.error?.message || 'Lỗi khi gọi Gemini API (dịch)');
    }

    const data = await response.json();
    const rawText = (data.candidates?.[0]?.content?.parts || [])
      .map((part: { text?: string }) => part.text ?? '')
      .join('\n')
      .trim();

    if (!rawText) {
      throw new Error('Không nhận được phản hồi từ Gemini');
    }

    const cleaned = rawText.replace(/```json|```/g, '').trim();
    let parsed: { translatedText?: string; detectedLang?: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      throw new Error('Phản hồi Gemini không đúng định dạng JSON yêu cầu');
    }

    if (!parsed.translatedText) {
      throw new Error('Gemini không trả về bản dịch');
    }

    return {
      translatedText: parsed.translatedText.trim(),
      detectedLang: parsed.detectedLang?.trim() || sourceLangCode || 'auto',
    };
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError('Vui lòng nhập văn bản cần dịch');
      return;
    }

    setIsTranslating(true);
    setError(null);
    setOutputText('');

    try {
      const targetLabel = languages[targetLang] || targetLang;
      const { translatedText, detectedLang: detected } = await translateWithGemini(
        inputText,
        targetLang,
        targetLabel,
        sourceLang === 'auto' ? undefined : sourceLang
      );

      setOutputText(translatedText);
      const detectedCode = detected || 'auto';
      setDetectedLang(detectedCode);

      if (sourceLang === 'auto' && detectedCode !== 'auto' && languages[detectedCode]) {
        if (detectedCode !== targetLang) {
          setSourceLang(detectedCode);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng file
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh hợp lệ');
      return;
    }

    // Hiển thị preview
    const base64DataUrl = await convertFileToBase64(file);
    setImagePreview(base64DataUrl);

    // Xử lý OCR
    setIsProcessingOCR(true);
    setError(null);

    try {
      let text = '';

      // Sử dụng Gemini API (miễn phí, không cần billing)
      text = await recognizeWithGemini(file);

      // Làm sạch văn bản
      const cleanedText = text.trim();
      
      if (cleanedText) {
        setInputText(cleanedText);
        setImagePreview(null);
        // Tự động dịch sau khi nhận diện
        setTimeout(() => {
          handleTranslate();
        }, 100);
      } else {
        setError('Không tìm thấy văn bản trong hình ảnh');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi nhận diện văn bản');
    } finally {
      setIsProcessingOCR(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCaptureClick = () => {
    fileInputRef.current?.click();
  };

  // OCR với Google Gemini API (miễn phí, không cần billing)
  const recognizeWithGemini = async (file: File): Promise<string> => {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (!GEMINI_API_KEY) {
      throw new Error('Thiếu VITE_GEMINI_API_KEY trong file .env');
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
      throw new Error(error.error?.message || 'Lỗi khi gọi Gemini API');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return '';
    }

    return text.trim();
  };


  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div>
            <h1>🌍 Translate Tool</h1>
            <p className="subtitle">Ứng dụng dịch thuật đa ngôn ngữ</p>
          </div>
          <button
            className="globe-button"
            aria-label="Chọn ngôn ngữ nhanh"
            onClick={() => {
              setLanguagePickerMode('source');
              setLanguagePickerOpen(true);
            }}
          >
            🌐
          </button>
        </div>
        <div className="ocr-settings">
          <span className="ocr-badge">✨ Gemini API (Miễn phí)</span>
        </div>
      </header>

      <main className="main-content">
        <div className="translation-container">
          {/* Input Section */}
          <div className="translation-box">
            <div className="box-header">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="lang-select"
              >
                <option value="auto">Tự động phát hiện</option>
                {Object.entries(languages).map(([code, name]) => (
                  <option
                    key={code}
                    value={code}
                    disabled={code === targetLang}
                  >
                    {name}
                  </option>
                ))}
              </select>
             
            </div>
            <textarea
              className="text-input"
              placeholder="Nhập văn bản cần dịch....."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={8}
            />
            <div className="box-footer">
              <div className="footer-left">
                <button
                  className="icon-button"
                  onClick={handleCaptureClick}
                  title="Chụp/Chọn ảnh để dịch"
                  disabled={isProcessingOCR}
                >
                  📷
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                <button
                  className="icon-button"
                  onClick={() => handleCopy(inputText)}
                  title="Sao chép"
                  disabled={!inputText}
                >
                  📋
                </button>
              </div>
              <span className="char-count">{inputText.length} ký tự</span>
            </div>
          </div>

          {/* Swap Button */}
          <div className="swap-container">
            <button
              className="swap-button"
              onClick={handleSwapLanguages}
              title="Đổi ngôn ngữ"
              disabled={!inputText || !outputText}
            >
              ⇅
            </button>
          </div>

          {/* Output Section */}
          <div className="translation-box">
            <div className="box-header">
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="lang-select"
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option
                    key={code}
                    value={code}
                    disabled={sourceLang !== 'auto' && code === sourceLang}
                  >
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              className="text-output"
              placeholder="Bản dịch sẽ hiển thị ở đây..."
              value={outputText}
              readOnly
              rows={8}
            />
            <div className="box-footer">
              <button
                className="icon-button"
                onClick={() => handleCopy(outputText)}
                title="Sao chép"
                disabled={!outputText}
              >
                📋
              </button>
              <span className="char-count">{outputText.length} ký tự</span>
            </div>
          </div>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="image-preview-container">
            <img src={imagePreview} alt="Preview" className="image-preview" />
            <button
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

        {/* Translate Button */}
        <button
          className="translate-button"
          onClick={handleTranslate}
          disabled={isTranslating || isProcessingOCR || !inputText.trim()}
        >
          {isProcessingOCR
            ? '🔍 Đang nhận diện văn bản...'
            : isTranslating
            ? '🔄 Đang dịch...'
            : '✨ Dịch'}
        </button>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}
      </main>
      {languagePickerOpen && (
        <div className="language-picker-overlay" onClick={() => setLanguagePickerOpen(false)}>
          <div className="language-picker" onClick={(e) => e.stopPropagation()}>
            <div className="picker-header">
              <h3>Chọn ngôn ngữ {languagePickerMode === 'source' ? 'nguồn' : 'đích'}</h3>
              <div className="picker-actions">
                <button
                  className={languagePickerMode === 'source' ? 'active' : ''}
                  onClick={() => setLanguagePickerMode('source')}
                >
                  Nguồn
                </button>
                <button
                  className={languagePickerMode === 'target' ? 'active' : ''}
                  onClick={() => setLanguagePickerMode('target')}
                >
                  Đích
                </button>
              </div>
            </div>
            <div className="language-list">
              {Object.entries(languages).map(([code, name]) => (
                <button
                  key={code}
                  className="language-item"
                  onClick={() => {
                    if (languagePickerMode === 'source') {
                      setSourceLang(code);
                      if (code === targetLang) {
                        setTargetLang('en');
                      }
                    } else {
                      setTargetLang(code);
                      if (sourceLang === code) {
                        setSourceLang('auto');
                      }
                    }
                    setLanguagePickerOpen(false);
                  }}
                >
                  <span className="language-name">{name}</span>
                  <span className="language-code">{code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

