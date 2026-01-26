import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../i18n/hooks/useLanguage';

interface TelegramShareButtonProps {
  formData: {
    name: string;
    email: string;
    message: string;
  };
}

const TelegramShareButton: React.FC<TelegramShareButtonProps> = ({ formData }) => {
  const { t } = useLanguage();

  const handleShare = () => {
    const telegramUsername = import.meta.env.VITE_TELEGRAM_USERNAME || 'azhukov_dev';
    
    // Format message
    const message = t('contact.telegram.shareMessage', {
      name: formData.name,
      email: formData.email,
      message: formData.message
    });

    // Create Telegram share URL
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${telegramUsername}`)}&text=${encodeURIComponent(message)}`;
    
    // Check if we're in Telegram Web App
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="w-full flex items-center justify-center px-4 py-3 bg-accent-cyan/10 border border-accent-cyan/30 rounded-lg text-accent-cyan hover:bg-accent-cyan/20 transition-all group"
    >
      <MessageCircle className="w-5 h-5 mr-2" />
      <span className="font-medium">{t('contact.telegram.alsoWrite')}</span>
    </button>
  );
};

export default TelegramShareButton;

