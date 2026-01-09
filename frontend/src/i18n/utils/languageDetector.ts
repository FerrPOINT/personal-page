export type Language = 'ru' | 'en';

const LANGUAGE_STORAGE_KEY = 'language';
const DEFAULT_LANGUAGE: Language = 'en';

/**
 * Определяет язык пользователя:
 * 1. Проверяет localStorage
 * 2. Если нет - проверяет navigator.language
 * 3. Если navigator.language начинается с 'ru' - возвращает 'ru'
 * 4. Иначе возвращает 'en' (по умолчанию)
 */
export const detectLanguage = (): Language => {
  // Проверяем localStorage
  const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (storedLanguage === 'ru' || storedLanguage === 'en') {
    return storedLanguage as Language;
  }

  // Проверяем navigator.language
  if (typeof navigator !== 'undefined' && navigator.language) {
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith('ru')) {
      return 'ru';
    }
  }

  // Fallback на английский
  return DEFAULT_LANGUAGE;
};

/**
 * Сохраняет язык в localStorage
 */
export const saveLanguage = (language: Language): void => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn('Failed to save language to localStorage:', error);
  }
};

/**
 * Получает язык из localStorage
 */
export const getStoredLanguage = (): Language | null => {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'ru' || stored === 'en') {
      return stored as Language;
    }
  } catch (error) {
    console.warn('Failed to read language from localStorage:', error);
  }
  return null;
};

