import React, { useState } from 'react';
import { Mail, Clipboard, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/hooks/useLanguage';

interface EmailContactButtonProps {
  email: string;
  className?: string;
}

const EmailContactButton: React.FC<EmailContactButtonProps> = ({ 
  email, 
  className = '' 
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = email;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopied(true);
      setShowToast(true);
      
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <a 
      href={`mailto:${email}`} 
      className={`flex items-center group cursor-pointer relative ${className}`}
      aria-label={`Email ${email}`}
    >
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mr-4 group-hover:bg-accent-cyan/20 transition-colors" aria-hidden="true">
        <Mail className="w-5 h-5 text-accent-cyan" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-secondary uppercase tracking-wider">{t('contact.email')}</p>
        <div className="flex items-center gap-2">
          <p className="text-white font-medium hover:text-accent-cyan transition-colors">{email}</p>
          
          {/* Copy button */}
          <button
            type="button"
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
    </a>
  );
};

export default EmailContactButton;

