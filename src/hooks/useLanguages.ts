import { useState, useEffect } from 'react';
import languagesMetadata from '../data/languages.json';
import { Languages, LanguageMetadata } from '../types/languages';

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

export const useLanguages = () => {
  const [languages, setLanguages] = useState<Languages>(fallbackLanguages);
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

  // Load languages from electron API
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
      } catch {
        setLanguages(fallbackLanguages);
      }
    };

    load();
  }, []);

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

  const swapLanguages = (inputText: string, outputText: string) => {
    if (sourceLang !== 'auto') {
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
      return { newInput: outputText, newOutput: inputText };
    } else if (detectedLang !== 'auto') {
      setSourceLang(targetLang);
      setTargetLang(detectedLang);
      return { newInput: outputText, newOutput: inputText };
    }
    return null;
  };

  return {
    languages,
    sourceLang,
    targetLang,
    detectedLang,
    setSourceLang,
    setTargetLang,
    setDetectedLang,
    swapLanguages,
  };
};
