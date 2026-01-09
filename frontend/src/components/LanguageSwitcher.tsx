import React from 'react';
import { useLanguage } from '../i18n/hooks/useLanguage';
import { Language } from '../i18n/utils/languageDetector';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLanguage: Language = language === 'ru' ? 'en' : 'ru';
    setLanguage(newLanguage);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-secondary hover:text-white transition-all duration-200 border border-white/10 hover:border-accent-cyan/30"
      aria-label={`Switch to ${language === 'ru' ? 'English' : 'Russian'}`}
      title={`Switch to ${language === 'ru' ? 'English' : 'Russian'}`}
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium uppercase">{language === 'ru' ? 'RU' : 'EN'}</span>
    </button>
  );
};

export default LanguageSwitcher;

