import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ApiKeyManager } from '../utils/apiKeyManager';

export interface OCRResult {
    originalText: string;
    translatedText: string;
    detectedLang: string;
}

export const useOCR = () => {
    const { t } = useTranslation();
    const [isProcessingOCR, setIsProcessingOCR] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const convertFileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const recognizeAndTranslateWithGemini = async (file: File, targetLang: string): Promise<OCRResult> => {
        const GEMINI_API_KEY = await ApiKeyManager.getApiKey();
        if (!GEMINI_API_KEY) {
            throw new Error(t('errors.missingGeminiKey'));
        }

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
        const GEMINI_MODEL = 'gemini-2.5-flash-lite';

        const prompt = `
        You are an expert OCR and translation system.
        1. Extract ALL text from the provided image exactly as it appears (originalText).
        2. Detect the language of the extracted text (detectedLang - ISO 639-1 code).
        3. Translate the extracted text to ${targetLang} (translatedText).

        STRICTLY RETURN ONLY A VALID JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS.
        Structure:
        {
            "originalText": "...",
            "translatedText": "...",
            "detectedLang": "..."
        }
        `;

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
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: mimeType,
                                        data: base64
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || t('errors.translationRequestFailed'));
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            throw new Error(t('errors.noTextFoundInImage'));
        }

        try {
            const parsed = JSON.parse(rawText);
            return {
                originalText: parsed.originalText || '',
                translatedText: parsed.translatedText || '',
                detectedLang: parsed.detectedLang || 'auto'
            };
        } catch (e) {
            console.error("Failed to parse OCR JSON", e);
            // Fallback if JSON parsing fails but we have text (unlikely with responseMimeType)
            return {
                originalText: rawText,
                translatedText: '',
                detectedLang: 'auto'
            };
        }
    };

    const processImage = async (
        file: File,
        targetLang: string,
        onSuccess: (result: OCRResult) => void
    ) => {
        if (!file.type.startsWith('image/')) {
            toast.error(t('errors.invalidImageFile'));
            return;
        }

        const base64DataUrl = await convertFileToBase64(file);
        setImagePreview(base64DataUrl);
        setIsProcessingOCR(true);

        try {
            const result = await recognizeAndTranslateWithGemini(file, targetLang);

            if (result.originalText) {
                setImagePreview(null);
                onSuccess(result);
            } else {
                toast.error(t('errors.noTextFoundInImage'));
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('errors.ocrFailure'));
        } finally {
            setIsProcessingOCR(false);
        }
    };

    return {
        isProcessingOCR,
        imagePreview,
        setImagePreview,
        processImage,
    };
};
