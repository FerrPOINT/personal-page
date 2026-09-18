import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Github, Mail, MapPin, Phone, Send, FileText, Printer } from 'lucide-react';
import Modal from './Modal';
import ContactMethod from './ContactMethod';
import { useLanguage } from '../i18n/hooks/useLanguage';
import { getExperience, getSkills } from '../content';
import { ContactApiError, submitContact } from '../api/contact';

type FormData = {
  name: string;
  email: string;
  message: string;
};

const Contact: React.FC = () => {
  const { t, language } = useLanguage();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<FormData>();
  const [showResume, setShowResume] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const messageContent = watch('message', '');

  const experienceItems = useMemo(() => getExperience(language), [language]);
  const skills = useMemo(() => getSkills(language), [language]);

  const messageLength = messageContent.length;
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
      if (error.status === 400 || error.status === 409) setSubmitMessage(error.message);
      else if (error.status === 413) setSubmitMessage(t('contact.form.error413'));
      else if (error.status === 429) setSubmitMessage(t('contact.form.error429'));
      else if (error.status === 500) setSubmitMessage(t('contact.form.error500'));
      else if (error.message === 'REQUEST_TIMEOUT') setSubmitMessage(t('contact.form.errorTimeout'));
      else setSubmitMessage(t('contact.form.errorNetwork'));
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-resume');
    if (printContent) {
        const win = window.open('', '', 'width=800,height=900');
        if (win) {
            const pageTitle = t('contact.resume.pageTitle');
            win.document.write(`
                <html>
                    <head>
                        <title>${pageTitle}</title>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
                            h1 { margin-bottom: 5px; }
                            h2 { border-bottom: 2px solid #333; padding-bottom: 5px; margin-top: 20px; }
                            .header { margin-bottom: 20px; }
                            .job { margin-bottom: 15px; }
                            .job-header { display: flex; justify-content: space-between; font-weight: bold; }
                            .skills { display: flex; flex-wrap: wrap; gap: 5px; }
                            .skill-tag { background: #eee; padding: 2px 5px; border-radius: 3px; font-size: 0.9em; }
                        </style>
                    </head>
                    <body>
                        ${printContent.innerHTML}
                    </body>
                </html>
            `);
            win.document.close();
            win.focus();
            win.print();
            win.close();
        }
    }
  };

  return (
    <section id="contact" className="py-24 bg-surface border-t border-white/5 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-8">{t('contact.title')}<br /> <span className="text-accent-cyan">{t('contact.titleScalable')}</span></h2>
            <p className="text-secondary text-lg mb-12">
              {t('contact.description')}
            </p>

            <div className="space-y-6 mb-12">
              <ContactMethod
                href="mailto:ferruspoint@mail.ru"
                icon={Mail}
                label={t('contact.email')}
                value="ferruspoint@mail.ru"
                variant="email"
              />

              <ContactMethod
                href="tel:+79833209785"
                icon={Phone}
                label={t('contact.phone')}
                value="+7 (983) 320-97-85"
                variant="phone"
              />

              <ContactMethod
                href="https://t.me/azhukov7"
                icon={Send}
                label={t('contact.telegram.label')}
                value="@azhukov7"
                variant="telegram"
                external
              />

              <ContactMethod
                href="https://github.com/FerrPOINT"
                icon={Github}
                label={t('contact.github')}
                value="FerrPOINT"
                copyValue="https://github.com/FerrPOINT"
                variant="github"
                external
              />

              <a href="https://www.google.com/maps/search/?api=1&query=Novosibirsk,+Russia" target="_blank" rel="noopener noreferrer" className="flex items-center group cursor-pointer">
                 <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mr-4 group-hover:bg-white/20 transition-colors">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-secondary uppercase tracking-wider">{t('contact.location')}</p>
                  <p className="text-white font-medium group-hover:underline">{t('contact.locationValue')}</p>
                </div>
              </a>
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={() => setShowResume(true)}
                className="flex items-center px-6 py-3 bg-white/5 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors group"
              >
                <FileText className="w-5 h-5 mr-2 text-accent-cyan" />
                <span>{t('contact.resume.viewResume')}</span>
              </button>
            </div>
          </motion.div>

          {/* Email Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-background rounded-2xl p-8 border border-white/5 shadow-2xl"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-secondary mb-2">{t('contact.form.name')}</label>
                <input
                  id="contact-name" type="text" autoComplete="name" maxLength={255}
                  aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'contact-name-error' : undefined}
                  {...register("name", { required: true, maxLength: 255 })}
                  className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-colors"
                  placeholder={t('contact.form.namePlaceholder')}
                />
                {errors.name && <span id="contact-name-error" className="text-red-500 text-xs mt-1">{t('contact.form.nameRequired')}</span>}
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-secondary mb-2">{t('contact.form.email')}</label>
                <input
                  id="contact-email" type="email" autoComplete="email" maxLength={255}
                  aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'contact-email-error' : undefined}
                  {...register("email", { required: true, pattern: /^\S+@\S+$/i })}
                  className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-colors"
                  placeholder={t('contact.form.emailPlaceholder')}
                />
                {errors.email && <span id="contact-email-error" className="text-red-500 text-xs mt-1">{t('contact.form.emailRequired')}</span>}
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-secondary mb-2">{t('contact.form.message')}</label>
                <textarea
                  id="contact-message" autoComplete="off" maxLength={5000}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'contact-message-error contact-message-help' : 'contact-message-help'}
                  {...register("message", { required: true, maxLength: 5000 })}
                  rows={4}
                  className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-colors"
                  placeholder={t('contact.form.messagePlaceholder')}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.message && <span id="contact-message-error" className="text-red-500 text-xs">{t('contact.form.messageRequired')}</span>}
                  <span className={`text-xs ml-auto ${isSizeExceeded ? 'text-red-500' : isSizeWarning ? 'text-yellow-500' : 'text-secondary'}`}>
                    <span id="contact-message-help">{messageLength} / 5000</span>
                  </span>
                </div>
              </div>

              <div aria-live="polite" aria-atomic="true">
              {submitStatus === 'success' && (
                <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
                  {submitMessage}
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {submitMessage}
                </div>
              )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-accent-cyan to-accent-magenta text-white font-bold py-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50"
              >
                {isSubmitting ? (
                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>{t('contact.form.submit')} <Send className="w-4 h-4 ml-2" /></>
                )}
              </button>
            </form>
          </motion.div>

        </div>
      </div>

      {/* Resume Modal */}
      <Modal 
        isOpen={showResume} 
        onClose={() => setShowResume(false)}
        title={t('contact.resume.title')}
      >
        <div className="flex justify-end mb-4 no-print">
            <button 
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-accent-cyan text-black rounded hover:bg-white transition-colors text-sm font-bold"
            >
                <Printer className="w-4 h-4 mr-2" />
                {t('contact.resume.printResume')}
            </button>
        </div>

        {/* Printable Area */}
        <div id="printable-resume" className="bg-white text-black p-8 rounded-lg">
            <div className="header border-b-2 border-black pb-4 mb-6">
                <h1 className="text-3xl font-bold uppercase tracking-wider">{t('contact.resume.name')}</h1>
                <p className="text-lg text-gray-700">{t('contact.resume.position')}</p>
                <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-4">
                    <span>+7 (983) 320-97-85</span>
                    <span>ferruspoint@mail.ru</span>
                    <span>{t('contact.locationValue')}</span>
                </div>
            </div>

            <section className="mb-6">
                <h2 className="text-xl font-bold uppercase border-b border-gray-300 mb-4 pb-1">{t('contact.resume.professionalSummary')}</h2>
                <p className="text-sm text-gray-800 leading-relaxed">
                    {t('contact.resume.summaryText')}
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-bold uppercase border-b border-gray-300 mb-4 pb-1">{t('contact.resume.experience')}</h2>
                <div className="space-y-6">
                    {experienceItems.map(job => (
                        <div key={job.id} className="job">
                            <div className="job-header flex justify-between items-baseline mb-2">
                                <h3 className="font-bold text-lg">{job.role}</h3>
                                <span className="text-sm text-gray-600 italic">{job.period}</span>
                            </div>
                            <div className="text-sm font-semibold text-gray-700 mb-2">{job.company}</div>
                            <p className="text-sm mb-2">{job.description}</p>
                            <ul className="list-disc list-inside text-sm text-gray-800 pl-2">
                                {job.achievements.map((ach, i) => (
                                    <li key={i}>{ach}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-bold uppercase border-b border-gray-300 mb-4 pb-1">{t('contact.resume.technicalSkills')}</h2>
                <div className="skills flex flex-wrap gap-2">
                    {skills.map(skill => (
                        <span key={skill.name} className="skill-tag bg-gray-200 px-2 py-1 rounded text-sm font-medium">
                            {skill.name}
                        </span>
                    ))}
                    <span className="skill-tag bg-gray-200 px-2 py-1 rounded text-sm font-medium">PostgreSQL</span>
                    <span className="skill-tag bg-gray-200 px-2 py-1 rounded text-sm font-medium">Kafka</span>
                    <span className="skill-tag bg-gray-200 px-2 py-1 rounded text-sm font-medium">LangChain</span>
                    <span className="skill-tag bg-gray-200 px-2 py-1 rounded text-sm font-medium">Redis</span>
                    <span className="skill-tag bg-gray-200 px-2 py-1 rounded text-sm font-medium">Kubernetes</span>
                </div>
            </section>
        </div>
      </Modal>
    </section>
  );
};

export default Contact;

