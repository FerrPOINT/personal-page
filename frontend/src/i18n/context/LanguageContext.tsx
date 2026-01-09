import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, detectLanguage, saveLanguage } from '../utils/languageDetector';
import { translations } from '../translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => detectLanguage());

  // Сохраняем язык в localStorage при изменении
  useEffect(() => {
    saveLanguage(language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Функция перевода с поддержкой вложенных ключей и интерполяции (например, 'hero.title', 'hero.description' с {years})
  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback на английский, если ключ не найден
        if (language !== 'en') {
          value = translations.en;
          for (const fallbackKey of keys) {
            if (value && typeof value === 'object' && fallbackKey in value) {
              value = value[fallbackKey];
            } else {
              console.warn(`Translation key not found: ${key}`);
              return key;
            }
          }
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
      }
    }

    let result = typeof value === 'string' ? value : key;
    
    // Интерполяция параметров (замена {param} на значения)
    if (params && typeof result === 'string') {
      Object.keys(params).forEach((param) => {
        result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
      });
    }

    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

