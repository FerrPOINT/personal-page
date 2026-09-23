import React from 'react';
import { useLanguage } from '../i18n/hooks/useLanguage';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-background py-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center text-center text-sm text-secondary">
        <p>&copy; {new Date().getFullYear()} Aleksandr Zhukov. {t('footer.copyright')}</p>
      </div>
    </footer>
  );
};

export default Footer;

