import React, { useState } from 'react';
import { Check, Clipboard, Send } from 'lucide-react';
import { useLanguage } from '../i18n/hooks/useLanguage';

interface Props { username: string; className?: string }

const TelegramContactButton: React.FC<Props> = ({ username, className = '' }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const value = `@${username}`;
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={`relative flex w-fit max-w-full items-center ${className}`} data-testid="telegram-contact-section">
      <a href={`https://t.me/${username}`} target="_blank" rel="noopener noreferrer"
        className="group flex min-w-0 items-center" aria-label={`Telegram ${value}`}>
        <div className="w-12 flex items-center justify-center mr-4" aria-hidden="true">
          <Send className="w-5 h-5 text-accent-cyan" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-secondary uppercase tracking-wider">{t('contact.telegram.label')}</p>
          <p className="text-white font-medium group-hover:text-accent-cyan transition-colors">{value}</p>
        </div>
      </a>
      <button type="button" onClick={copy} className="ml-2 shrink-0 rounded p-2 transition-colors hover:bg-white/10"
        aria-label={t('contact.telegram.copyTooltip')} title={t('contact.telegram.copyTooltip')}>
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Clipboard className="w-4 h-4 text-secondary" />}
      </button>
      <span className="sr-only" aria-live="polite">{copied ? t('contact.telegram.copied') : ''}</span>
    </div>
  );
};

export default TelegramContactButton;
