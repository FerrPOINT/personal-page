import React, { useState } from 'react';
import { Check, Clipboard, Phone } from 'lucide-react';
import { useLanguage } from '../i18n/hooks/useLanguage';

interface Props { phone: string; className?: string }

const PhoneContactButton: React.FC<Props> = ({ phone, className = '' }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(phone);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={`relative flex w-fit max-w-full items-center ${className}`}>
      <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="group flex min-w-0 items-center" aria-label={`Phone ${phone}`}>
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mr-4 group-hover:bg-accent-magenta/20 transition-colors" aria-hidden="true">
          <Phone className="w-5 h-5 text-accent-magenta" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-secondary uppercase tracking-wider">{t('contact.phone')}</p>
          <p className="text-white font-medium group-hover:text-accent-magenta transition-colors">{phone}</p>
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

export default PhoneContactButton;
