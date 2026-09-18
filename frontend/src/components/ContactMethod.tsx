import React, { useState } from 'react';
import { Check, Clipboard, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../i18n/hooks/useLanguage';

type ContactVariant = 'email' | 'phone' | 'telegram';

interface Props {
  href: string;
  icon: LucideIcon;
  label: string;
  value: string;
  variant: ContactVariant;
  copyValue?: string;
  external?: boolean;
  className?: string;
}

const variantStyles: Record<ContactVariant, {
  icon: string;
  iconContainer: string;
  value: string;
}> = {
  email: {
    icon: 'text-red-400',
    iconContainer: 'h-12 w-12 rounded-full bg-white/5',
    value: 'group-hover:text-red-400',
  },
  phone: {
    icon: 'text-accent-magenta',
    iconContainer: 'h-12 w-12 rounded-full bg-white/5',
    value: 'group-hover:text-accent-magenta',
  },
  telegram: {
    icon: 'text-accent-cyan',
    iconContainer: 'h-12 w-12',
    value: 'group-hover:text-accent-cyan',
  },
};

const ContactMethod: React.FC<Props> = ({
  href,
  icon: Icon,
  label,
  value,
  variant,
  copyValue = value,
  external = false,
  className = '',
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const styles = variantStyles[variant];

  const copy = async () => {
    await navigator.clipboard.writeText(copyValue);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative flex w-fit max-w-full items-center ${className}`}>
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className="group flex min-w-0 items-center"
        aria-label={`${label} ${value}`}
      >
        <div
          className={`mr-4 flex shrink-0 items-center justify-center transition-all ${styles.iconContainer}`}
          aria-hidden="true"
        >
          <Icon
            className={`h-5 w-5 transition-all duration-200 group-hover:scale-110 group-hover:brightness-125 group-hover:drop-shadow-[0_0_8px_currentColor] ${styles.icon}`}
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-secondary">{label}</p>
          <p className={`font-medium text-white transition-colors ${styles.value}`}>{value}</p>
        </div>
      </a>
      <button
        type="button"
        onClick={copy}
        className="ml-2 shrink-0 rounded p-2 transition-colors hover:bg-white/10"
        aria-label={t('contact.copy', { label })}
        title={t('contact.copy', { label })}
      >
        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Clipboard className="h-4 w-4 text-secondary" />}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? t('contact.copied', { label }) : ''}
      </span>
    </div>
  );
};

export default ContactMethod;
