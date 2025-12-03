import { useEffect } from 'react';
import { OCRResult } from './useOCR';

interface UseGlobalPasteOptions {
  languagePickerOpen: boolean;
  targetLang: string;
  languages: Record<string, string>;
  processImage: (file: File, targetLang: string, onSuccess: (result: OCRResult) => void) => Promise<void>;
  handleTranslate: (text: string, textOverride?: string) => Promise<void>;
  onTextPaste: (text: string) => void;
  onImageResult: (result: OCRResult) => void;
}

export const useGlobalPaste = ({
  languagePickerOpen,
  targetLang,
  languages,
  processImage,
  handleTranslate,
  onTextPaste,
  onImageResult,
}: UseGlobalPasteOptions) => {
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (languagePickerOpen) return;

      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      // Check for files (Images)
      if (clipboardData.files && clipboardData.files.length > 0) {
        const file = clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          const currentTargetLabel = languages[targetLang] || targetLang;
          processImage(file, currentTargetLabel, onImageResult);
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
          onTextPaste(text);
          handleTranslate(text, text);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [languagePickerOpen, targetLang, languages, processImage, handleTranslate, onTextPaste, onImageResult]);
};
