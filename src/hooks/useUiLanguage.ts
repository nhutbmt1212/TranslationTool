import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useUiLanguage = () => {
  const { i18n } = useTranslation();

  // Initialize UI language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUiLang = localStorage.getItem('app-ui-lang');
      if (storedUiLang && i18n.language !== storedUiLang) {
        i18n.changeLanguage(storedUiLang);
      }
    }
  }, [i18n]);

  const changeUiLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('app-ui-lang', code);
  };

  const resolvedLanguage = i18n.resolvedLanguage || i18n.language || 'en';
  const currentUiLanguage = resolvedLanguage.split('-')[0];

  return { currentUiLanguage, changeUiLanguage };
};
