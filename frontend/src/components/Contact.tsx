import { useState } from 'react';
import ContactForm from './ContactForm';
import ContactInfo from './ContactInfo';
import ResumeModal from './ResumeModal';

export default function Contact() {
  const [showResume, setShowResume] = useState(false);
  return (
    <section id="contact" className="py-24 bg-surface border-t border-white/5 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <ContactInfo onOpenResume={() => setShowResume(true)} />
          <ContactForm />
        </div>
      </div>
      <ResumeModal isOpen={showResume} onClose={() => setShowResume(false)} />
    </section>
  );
}
