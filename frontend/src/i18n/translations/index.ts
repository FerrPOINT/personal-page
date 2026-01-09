import ruTranslations from './ru.json';
import enTranslations from './en.json';

export const translations = {
  ru: ruTranslations,
  en: enTranslations,
};

export type TranslationKey = keyof typeof ruTranslations;

