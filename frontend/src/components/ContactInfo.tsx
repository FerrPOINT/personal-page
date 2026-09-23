import { motion } from 'framer-motion';
import { FileText, Github, Mail, MapPin, Phone, Send } from 'lucide-react';
import { PROFILE_CONTACTS, formatYearsOfExperience } from '../content';
import { useLanguage } from '../i18n/hooks/useLanguage';
import ContactMethod from './ContactMethod';

export default function ContactInfo({ onOpenResume }: { onOpenResume: () => void }) {
  const { t, language } = useLanguage();
  const yearsOfExperience = formatYearsOfExperience(language);
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-100px' }} animate={{ opacity: 1, x: 0 }}>
      <h2 className="text-4xl md:text-5xl font-bold mb-8">{t('contact.title')}<br /> <span className="text-accent-primary">{t('contact.titleScalable')}</span></h2>
      <p className="text-secondary text-lg mb-12">{t('contact.description', { years: yearsOfExperience })}</p>
      <div className="space-y-6 mb-12">
        <ContactMethod href={`mailto:${PROFILE_CONTACTS.email}`} icon={Mail} label={t('contact.email')}
          value={PROFILE_CONTACTS.email} variant="email" />
        <ContactMethod href={`tel:${PROFILE_CONTACTS.phone}`} icon={Phone} label={t('contact.phone')}
          value={PROFILE_CONTACTS.phoneDisplay} variant="phone" />
        <ContactMethod href={PROFILE_CONTACTS.telegramUrl} icon={Send} label={t('contact.telegram.label')}
          value={PROFILE_CONTACTS.telegramDisplay} variant="telegram" external />
        <ContactMethod href={PROFILE_CONTACTS.githubUrl} icon={Github} label={t('contact.github')}
          value={PROFILE_CONTACTS.githubDisplay} copyValue={PROFILE_CONTACTS.githubUrl} variant="github" external />
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
        <button onClick={onOpenResume}
          className="flex items-center px-6 py-3 bg-white/5 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors group">
          <FileText className="w-5 h-5 mr-2 text-accent-primary" />
          <span>{t('contact.resume.viewResume')}</span>
        </button>
      </div>
    </motion.div>
  );
}
