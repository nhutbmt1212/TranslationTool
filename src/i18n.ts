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
        settings: 'Settings',
        darkMode: 'Dark',
        lightMode: 'Light',
        switchDark: 'Switch to dark mode',
        switchLight: 'Switch to light mode',
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
      settings: {
        title: 'Settings',
        save: 'Save',
        cancel: 'Cancel',
        saving: 'Saving...',
        apiKey: {
          title: 'Gemini API Key',
          description: 'Your API key is encrypted and stored securely in your browser session. It will be cleared when you close the app.',
          current: 'Current API Key:',
          enter: 'Enter API Key',
          update: 'Update API Key',
          clear: 'Clear API Key',
          hint: 'Get your API key from Google AI Studio',
          getKey: 'Get API Key',
          saved: 'API key saved successfully!',
        },
        errors: {
          emptyKey: 'API key cannot be empty',
        },
        security: {
          title: 'Security',
          encrypted: 'API key is encrypted using AES-GCM',
          session: 'Stored only in browser session (cleared on close)',
          device: 'Encryption key is device-specific',
          noServer: 'Never sent to any server except Google AI',
        },
      },
      general: {
        characters_one: '{{count}} character',
        characters_other: '{{count}} characters',
      },
      errors: {
        inputRequired: 'Please enter text to translate',
        missingGeminiKey: 'Please configure your API key in Settings',
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
        settings: 'Cài đặt',
        darkMode: 'Tối',
        lightMode: 'Sáng',
        switchDark: 'Chuyển sang chế độ tối',
        switchLight: 'Chuyển sang chế độ sáng',
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
      settings: {
        title: 'Cài đặt',
        save: 'Lưu',
        cancel: 'Hủy',
        saving: 'Đang lưu...',
        apiKey: {
          title: 'Khóa API Gemini',
          description: 'Khóa API của bạn được mã hóa và lưu trữ an toàn trong phiên trình duyệt. Nó sẽ bị xóa khi bạn đóng ứng dụng.',
          current: 'Khóa API hiện tại:',
          enter: 'Nhập khóa API',
          update: 'Cập nhật khóa API',
          clear: 'Xóa khóa API',
          hint: 'Lấy khóa API từ Google AI Studio',
          getKey: 'Lấy khóa API',
          saved: 'Đã lưu khóa API thành công!',
        },
        errors: {
          emptyKey: 'Khóa API không được để trống',
        },
        security: {
          title: 'Bảo mật',
          encrypted: 'Khóa API được mã hóa bằng AES-GCM',
          session: 'Chỉ lưu trong phiên trình duyệt (xóa khi đóng)',
          device: 'Khóa mã hóa dành riêng cho thiết bị',
          noServer: 'Không bao giờ gửi đến máy chủ nào trừ Google AI',
        },
      },
      general: {
        characters_one: '{{count}} ký tự',
        characters_other: '{{count}} ký tự',
      },
      errors: {
        inputRequired: 'Vui lòng nhập văn bản cần dịch',
        missingGeminiKey: 'Vui lòng cấu hình khóa API trong Cài đặt',
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

