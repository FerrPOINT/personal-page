import React from 'react';
import { useLanguage } from '../i18n/hooks/useLanguage';
import { Language } from '../i18n/utils/languageDetector';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    const newLanguage: Language = language === 'ru' ? 'en' : 'ru';
    setLanguage(newLanguage);
  };

  // Вычисляем значения заранее, чтобы избежать проблем с минификацией
  const targetLangText = language === 'ru' ? t('common.english') : t('common.russian');
  const currentLangText = language === 'ru' ? t('common.russian') : t('common.english');
  const switchLabel = t('common.switchLanguage', { lang: targetLangText });

  return (
    <button
      onClick={toggleLanguage}
      className="flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-secondary transition-all duration-200 hover:border-accent-primary/30 hover:bg-white/10 hover:text-primary"
      aria-label={switchLabel}
      title={switchLabel}
    >
      <Globe className="h-4 w-4" aria-hidden="true" />
      <span className="text-xs font-semibold uppercase tracking-[0.12em]">{language === 'ru' ? 'RU' : 'EN'}</span>
      <span className="sr-only">{currentLangText}</span>
    </button>
  );
};

export default LanguageSwitcher;

