// Lazy loading translations for better code splitting
export const loadTranslations = async (language: 'ru' | 'en') => {
  switch (language) {
    case 'ru':
      return (await import('./ru.json')).default;
    case 'en':
      return (await import('./en.json')).default;
    default:
      return (await import('./en.json')).default;
  }
};

// Synchronous imports for initial load (fallback)
import ruTranslations from './ru.json';
import enTranslations from './en.json';

export const translations = {
  ru: ruTranslations,
  en: enTranslations,
};

export type TranslationKey = keyof typeof ruTranslations;

