import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { ContactApiError, submitContact } from '../api/contact';
import { useLanguage } from '../i18n/hooks/useLanguage';

interface FormData { name: string; email: string; message: string }

export default function ContactForm() {
  const { t } = useLanguage();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<FormData>();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const messageLength = watch('message', '').length;
  const isSizeWarning = messageLength > 4000;
  const isSizeExceeded = messageLength > 5000;

  const onSubmit = async (data: FormData) => {
    setSubmitStatus('idle');
    setSubmitMessage('');
    try {
      await submitContact(data);
      setSubmitStatus('success');
      setSubmitMessage(t('contact.form.success'));
      reset();
    } catch (error) {
      setSubmitStatus('error');
      if (!(error instanceof ContactApiError)) return setSubmitMessage(t('contact.form.errorUnknown'));
      if (error.code === 'VALIDATION_ERROR') setSubmitMessage(t('contact.form.error400'));
      else if (error.code === 'DUPLICATE_MESSAGE') setSubmitMessage(t('contact.form.error409'));
      else if (error.status === 413) setSubmitMessage(t('contact.form.error413'));
      else if (error.status === 429) setSubmitMessage(t('contact.form.error429'));
      else if (error.status === 500) setSubmitMessage(t('contact.form.error500'));
      else if (error.code === 'REQUEST_TIMEOUT') setSubmitMessage(t('contact.form.errorTimeout'));
      else setSubmitMessage(t('contact.form.errorNetwork'));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="bg-background rounded-2xl p-8 border border-white/5 shadow-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-secondary mb-2">{t('contact.form.name')}</label>
          <input id="contact-name" type="text" autoComplete="name" maxLength={255}
            aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'contact-name-error' : undefined}
            {...register('name', { required: true, maxLength: 255 })}
            className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
            placeholder={t('contact.form.namePlaceholder')} />
          {errors.name && <span id="contact-name-error" className="text-red-500 text-xs mt-1">{t('contact.form.nameRequired')}</span>}
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-secondary mb-2">{t('contact.form.email')}</label>
          <input id="contact-email" type="email" autoComplete="email" maxLength={255}
            aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'contact-email-error' : undefined}
            {...register('email', { required: true, pattern: /^\S+@\S+$/i })}
            className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
            placeholder={t('contact.form.emailPlaceholder')} />
          {errors.email && <span id="contact-email-error" className="text-red-500 text-xs mt-1">{t('contact.form.emailRequired')}</span>}
        </div>
        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-secondary mb-2">{t('contact.form.message')}</label>
          <textarea id="contact-message" autoComplete="off" maxLength={5000}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? 'contact-message-error contact-message-help' : 'contact-message-help'}
            {...register('message', { required: true, maxLength: 5000 })} rows={4}
            className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
            placeholder={t('contact.form.messagePlaceholder')} />
          <div className="flex justify-between items-center mt-1">
            {errors.message && <span id="contact-message-error" className="text-red-500 text-xs">{t('contact.form.messageRequired')}</span>}
            <span className={`text-xs ml-auto ${isSizeExceeded ? 'text-red-500' : isSizeWarning ? 'text-yellow-500' : 'text-secondary'}`}>
              <span id="contact-message-help">{messageLength} / 5000</span>
            </span>
          </div>
        </div>
        <div aria-live="polite" aria-atomic="true">
          {submitStatus === 'success' && <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">{submitMessage}</div>}
          {submitStatus === 'error' && <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">{submitMessage}</div>}
        </div>
        <button type="submit" disabled={isSubmitting}
          className="accent-gradient-flow w-full bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-bold py-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50">
          {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <>{t('contact.form.submit')} <Send className="w-4 h-4 ml-2" /></>}
        </button>
      </form>
    </motion.div>
  );
}
