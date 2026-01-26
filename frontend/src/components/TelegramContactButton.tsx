import React, { useState, useEffect } from 'react';
import { Clipboard, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/hooks/useLanguage';

// Telegram icon SVG component
const TelegramIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.608 7.592c-.12.54-.43.67-.87.42l-2.4-1.77-1.155 1.11c-.13.13-.24.24-.49.24l.175-2.49 4.44-4.01c.193-.17-.043-.265-.3-.095l-5.49 3.46-2.37-.74c-.51-.16-.52-.51.106-.76l9.18-3.54c.42-.16.79.1.65.65z"/>
  </svg>
);

interface TelegramContactButtonProps {
  username: string;
  className?: string;
}

const TelegramContactButton: React.FC<TelegramContactButtonProps> = ({ 
  username, 
  className = '' 
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  // Default username: azhukov7 (admin account)
  const defaultUsername = 'azhukov7';
  const [telegramUsername, setTelegramUsername] = useState<string>(username || defaultUsername);

  // Try to get Telegram username from backend API by user ID
  useEffect(() => {
    const fetchTelegramUsername = async () => {
      const API_URL = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== '' 
        ? import.meta.env.VITE_API_URL 
        : '/api';
      
      try {
        const response = await fetch(`${API_URL}/telegram/username`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.username) {
            setTelegramUsername(data.username);
            return;
          }
        }
      } catch (error) {
        // Silently fail - use fallback
        console.debug('Could not fetch Telegram username from API, using fallback');
      }
      
      // Fallback to env variable, provided username, or default
      const envUsername = import.meta.env.VITE_TELEGRAM_USERNAME;
      if (envUsername) {
        setTelegramUsername(envUsername);
      } else if (username) {
        setTelegramUsername(username);
      } else {
        setTelegramUsername(defaultUsername);
      }
    };

    fetchTelegramUsername();
  }, [username]);
  const telegramUrl = `https://t.me/${telegramUsername}`;
  const telegramDeepLink = `telegram://resolve?domain=${telegramUsername}`;

  // Detect platform for optimal deep link
  const getTelegramLink = (): string => {
    // Check if we're in Telegram Web App
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      return telegramUrl; // Web App will handle it
    }

    // Check user agent for mobile
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    if (isMobile) {
      return telegramDeepLink;
    }
    
    // Desktop fallback to web
    return telegramUrl;
  };

  const handleOpenTelegram = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If in Telegram Web App, use native API
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // For Web App, use openTelegramLink with the username directly
      window.Telegram.WebApp.openTelegramLink(`https://t.me/${telegramUsername}`);
    } else {
      // For regular browser, use the appropriate link
      const link = getTelegramLink();
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering main link action
    
    const textToCopy = `@${telegramUsername}`;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopied(true);
      setShowToast(true);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  
  return (
    <div 
      className={`flex items-center group cursor-pointer relative ${className}`} 
      data-testid="telegram-contact-section" 
      aria-label="Telegram contact"
      onClick={handleOpenTelegram}
    >
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mr-4 group-hover:bg-accent-cyan/20 transition-colors" aria-hidden="true">
        <TelegramIcon className="w-5 h-5 text-accent-cyan" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-secondary uppercase tracking-wider">{t('contact.telegram.label')}</p>
        <div className="flex items-center gap-2">
          <p className="text-white font-medium hover:text-accent-cyan transition-colors">@{telegramUsername}</p>
          
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-white/10 transition-colors flex items-center justify-center group/copy relative z-10"
            title={t('contact.telegram.copyTooltip')}
            aria-label={t('contact.telegram.copyTooltip')}
          >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Check className="w-4 h-4 text-green-400" />
              </motion.div>
            ) : (
              <motion.div
                key="clipboard"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Clipboard className="w-4 h-4 text-secondary group-hover/copy:text-white transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 px-3 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm whitespace-nowrap z-20"
          >
            {t('contact.telegram.copied')}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TelegramContactButton;

