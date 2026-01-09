import React from 'react';
import { useLanguage } from '../i18n/hooks/useLanguage';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-background py-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-sm text-secondary">
        <p>&copy; {new Date().getFullYear()} Aleksandr Zhukov. {t('footer.copyright')}</p>
        <p className="mt-2 md:mt-0 font-mono">
          {t('footer.builtWith')}
        </p>
      </div>
    </footer>
  );
};

export default Footer;

