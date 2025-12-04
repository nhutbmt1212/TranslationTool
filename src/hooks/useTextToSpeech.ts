import { useCallback, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { pythonTTS } from '../utils/pythonTTS';

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  speak: (text: string, language: string) => Promise<void>;
  triggerTTS: (text: string, sourceLang: string, detectedLang: string) => Promise<void>;
  stopTTS: () => void;
  isPythonTTSAvailable: boolean;
}

/**
 * Custom hook để quản lý Text-To-Speech functionality
 * Sử dụng Python TTS (edge-tts) - chất lượng cao, 40+ ngôn ngữ
 */
export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPythonTTSAvailable, setIsPythonTTSAvailable] = useState(false);

  // Check Python TTS availability on mount
  useEffect(() => {
    pythonTTS.checkAvailable().then(setIsPythonTTSAvailable);
  }, []);

  const stopTTS = useCallback(() => {
    pythonTTS.stop();
    setIsSpeaking(false);
  }, []);

  // Simple speak function
  const speak = useCallback(async (text: string, language: string) => {
    if (!text) return;

    if (isSpeaking) {
      stopTTS();
      return;
    }

    if (!isPythonTTSAvailable) {
      toast.error('Python TTS chưa được cài đặt. Vui lòng cài đặt Python OCR để sử dụng TTS.');
      return;
    }

    setIsSpeaking(true);
    
    try {
      await pythonTTS.speak(text, language);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsSpeaking(false);
    }
  }, [isSpeaking, stopTTS, isPythonTTSAvailable]);

  // Advanced triggerTTS function với auto-detect language
  const triggerTTS = useCallback(async (text: string, sourceLang: string, detectedLang: string) => {
    if (!text) return;

    if (isSpeaking) {
      stopTTS();
      return;
    }

    if (!isPythonTTSAvailable) {
      toast.error('Python TTS chưa được cài đặt. Vui lòng cài đặt Python OCR để sử dụng TTS.');
      return;
    }

    setIsSpeaking(true);
    
    try {
      const langToSpeak = sourceLang === 'auto' ? detectedLang : sourceLang;
      await pythonTTS.speak(text, langToSpeak);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsSpeaking(false);
    }
  }, [isSpeaking, stopTTS, isPythonTTSAvailable]);

  return {
    isSpeaking,
    speak,
    triggerTTS,
    stopTTS,
    isPythonTTSAvailable,
  };
};
