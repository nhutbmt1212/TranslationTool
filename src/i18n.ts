import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import languagesMetadata from './data/languages.json';
import { LanguageMetadata } from './types/languages';

const metadataList = languagesMetadata as LanguageMetadata[];

const metadataMap = metadataList.reduce<Record<string, LanguageMetadata>>((acc, lang) => {
  acc[lang.code] = lang;
  return acc;
}, {});

const resources = {
  en: {
    translation: {
      app: {
        title: '🌍 Translate Tool',
        subtitle: 'Multi-language translation assistant',
      },
      header: {
        uiLanguageLabel: 'Interface language',
      },
      source: {
        autoDetect: 'Auto detect',
        placeholder: 'Enter text to translate...',
        captureTitle: 'Capture or pick an image to translate',
      },
      target: {
        placeholder: 'Translations will appear here...',
      },
      buttons: {
        openLanguagePicker: 'Choose language',
        swapLanguages: 'Swap languages',
        copy: 'Copy text',
        translate: 'Translate',
      },
      status: {
        ocrInProgress: 'Performing OCR…',
        translating: 'Translating…',
      },
      ocr: {
        badge: '✨ Gemini API (Free)',
      },
      languagePicker: {
        titleSource: 'Select source language',
        titleTarget: 'Select target language',
        tabSource: 'Source',
        tabTarget: 'Target',
        eyebrow: 'Language roster',
      },
      general: {
        characters_one: '{{count}} character',
        characters_other: '{{count}} characters',
      },
      errors: {
        inputRequired: 'Please enter text to translate',
        missingGeminiKey: 'Missing VITE_GEMINI_API_KEY in .env',
        invalidImageFile: 'Please pick a valid image file',
        noTextFoundInImage: 'No text found in the selected image',
        ocrFailure: 'Unable to recognise text from the image',
        noResponse: 'Empty response from Gemini',
        invalidTranslationResponse: 'Gemini response has invalid JSON format',
        noTranslationOutput: 'Gemini did not return the translated text',
        translationRequestFailed: 'Failed to call Gemini API',
        unknown: 'Something went wrong, please try again',
      },
    },
  },
  vi: {
    translation: {
      app: {
        title: '🌍 Translate Tool',
        subtitle: 'Ứng dụng dịch thuật đa ngôn ngữ',
      },
      header: {
        uiLanguageLabel: 'Ngôn ngữ giao diện',
      },
      source: {
        autoDetect: 'Tự động phát hiện',
        placeholder: 'Nhập văn bản cần dịch...',
        captureTitle: 'Chụp/Chọn ảnh để dịch',
      },
      target: {
        placeholder: 'Bản dịch sẽ hiển thị ở đây...',
      },
      buttons: {
        openLanguagePicker: 'Chọn ngôn ngữ',
        swapLanguages: 'Đổi ngôn ngữ',
        copy: 'Sao chép',
        translate: 'Dịch',
      },
      status: {
        ocrInProgress: 'Đang nhận diện văn bản...',
        translating: 'Đang dịch...',
      },
      ocr: {
        badge: '✨ Gemini API (Miễn phí)',
      },
      languagePicker: {
        titleSource: 'Chọn ngôn ngữ nguồn',
        titleTarget: 'Chọn ngôn ngữ đích',
        tabSource: 'Nguồn',
        tabTarget: 'Đích',
        eyebrow: 'Bộ sưu tập ngôn ngữ',
      },
      general: {
        characters_one: '{{count}} ký tự',
        characters_other: '{{count}} ký tự',
      },
      errors: {
        inputRequired: 'Vui lòng nhập văn bản cần dịch',
        missingGeminiKey: 'Thiếu VITE_GEMINI_API_KEY trong file .env',
        invalidImageFile: 'Vui lòng chọn file ảnh hợp lệ',
        noTextFoundInImage: 'Không tìm thấy văn bản trong hình ảnh',
        ocrFailure: 'Không thể nhận diện văn bản, hãy thử lại',
        noResponse: 'Không nhận được phản hồi từ Gemini',
        invalidTranslationResponse: 'Phản hồi Gemini không đúng định dạng JSON',
        noTranslationOutput: 'Gemini không trả về bản dịch',
        translationRequestFailed: 'Lỗi khi gọi Gemini API',
        unknown: 'Đã xảy ra lỗi, vui lòng thử lại',
      },
    },
  },
};

const uiLanguageCodes = ['en', 'vi'];

export const uiLanguageOptions = uiLanguageCodes.map((code) => {
  const metadata = metadataMap[code];
  const label = metadata
    ? code === 'vi'
      ? metadata.nameNative || metadata.nameEn
      : metadata.nameEn
    : code.toUpperCase();

  return { code, label };
});

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    fallbackLng: 'en',
    supportedLngs: uiLanguageCodes,
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;

