import React, { useState } from 'react';
import { Check, Clipboard, Mail } from 'lucide-react';
import { useLanguage } from '../i18n/hooks/useLanguage';

interface Props { email: string; className?: string }

const EmailContactButton: React.FC<Props> = ({ email, className = '' }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={`relative flex w-fit max-w-full items-center ${className}`}>
      <a href={`mailto:${email}`} className="group flex min-w-0 items-center" aria-label={`Email ${email}`}>
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mr-4 group-hover:bg-red-400/20 transition-colors" aria-hidden="true">
          <Mail className="w-5 h-5 text-red-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-secondary uppercase tracking-wider">{t('contact.email')}</p>
          <p className="text-white font-medium group-hover:text-red-400 transition-colors">{email}</p>
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

export default EmailContactButton;
