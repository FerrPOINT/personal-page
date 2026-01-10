import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
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

// Cache for compiled regex patterns for interpolation
const interpolationCache = new Map<string, RegExp>();

// Cache for translation lookups (key path -> value)
const translationCache = new Map<string, string>();

/**
 * Get or create regex pattern for interpolation parameter
 */
const getInterpolationRegex = (param: string): RegExp => {
  const cacheKey = `param:${param}`;
  if (!interpolationCache.has(cacheKey)) {
    interpolationCache.set(cacheKey, new RegExp(`\\{${param}\\}`, 'g'));
  }
  return interpolationCache.get(cacheKey)!;
};

/**
 * Optimized translation lookup with caching
 * Cache key includes language to avoid conflicts
 */
const getTranslationValue = (translationObj: any, keyPath: string[], language: Language): string | null => {
  const cacheKey = `${language}:${keyPath.join('.')}`;
  
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  let value: any = translationObj;
  for (const k of keyPath) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return null;
    }
  }

  const result = typeof value === 'string' ? value : null;
  if (result) {
    translationCache.set(cacheKey, result);
  }
  return result;
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => detectLanguage());

  // Memoize current translations object
  const currentTranslations = useMemo(() => translations[language], [language]);

  // Save language to localStorage when changed
  useEffect(() => {
    saveLanguage(language);
    // Clear translation cache when language changes
    translationCache.clear();
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  // Optimized translation function with caching and memoization
  const t = useCallback((key: string, params?: Record<string, string>): string => {
    const keyPath = key.split('.');
    
    // Try to get translation from current language
    let result = getTranslationValue(currentTranslations, keyPath, language);
    
    // Fallback to English if not found
    if (!result && language !== 'en') {
      result = getTranslationValue(translations.en, keyPath, 'en');
    }
    
    // If still not found, return key and warn
    if (!result) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Translation key not found: ${key}`);
      }
      return key;
    }
    
    // Optimized interpolation with cached regex patterns
    if (params && Object.keys(params).length > 0) {
      let interpolated = result;
      for (const [param, value] of Object.entries(params)) {
        const regex = getInterpolationRegex(param);
        interpolated = interpolated.replace(regex, value);
      }
      return interpolated;
    }
    
    return result;
  }, [language, currentTranslations]);

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

