import { useMemo } from 'react';
import { Printer } from 'lucide-react';
import { PROFILE_CONTACTS, formatYearsOfExperience, getResumeData } from '../content';
import { useLanguage } from '../i18n/hooks/useLanguage';
import Modal from './Modal';

export default function ResumeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, language } = useLanguage();
  const resume = useMemo(() => getResumeData(language), [language]);
  const yearsOfExperience = formatYearsOfExperience(language);
  const handlePrint = () => {
    const printContent = document.getElementById('printable-resume');
    if (!printContent) return;
    const win = window.open('', '', 'width=800,height=900');
    if (!win) return;
    win.document.write(`
      <html><head><title>${t('contact.resume.pageTitle')}</title><style>
        @page { size: A4; margin: 12mm; }
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.42; color: #1f2937; max-width: 900px; margin: 0 auto; padding: 0; font-size: 10.5pt; }
        a { color: #0f5f78; text-decoration: none; }
        h1 { color: #111827; font-size: 24pt; line-height: 1.1; margin: 0 0 4px; }
        h2 { color: #111827; border-bottom: 1.5px solid #94a3b8; padding-bottom: 4px; margin: 18px 0 10px; font-size: 13pt; text-transform: uppercase; letter-spacing: .04em; }
        h3 { color: #111827; margin: 0; }
        p { margin: 0 0 6px; }
        .header { border-bottom: 2px solid #111827; margin-bottom: 14px; padding-bottom: 10px; }
        .contact-list, .focus-list, .skills { display: flex; flex-wrap: wrap; gap: 5px 12px; }
        .contact-list { color: #475569; font-size: 9pt; margin-top: 7px; }
        .summary { color: #334155; }
        .focus-tag, .skill-tag { background: #eef2f7; border-radius: 4px; padding: 3px 7px; font-size: 8.5pt; }
        .project, .job { break-inside: avoid; margin-bottom: 11px; }
        .project-header, .job-header { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; }
        .project-title, .job-title { font-size: 11pt; font-weight: 700; }
        .project-meta, .job-period, .company { color: #64748b; font-size: 9pt; }
        .project-summary, .job-description, .bullet-list { font-size: 9.3pt; }
        .bullet-list { margin: 5px 0 0; padding-left: 18px; }
        .bullet-list li { margin-bottom: 3px; }
        .tech-line { color: #475569; font-size: 8.5pt; margin-top: 4px; }
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
      </style></head><body>${printContent.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    win.setTimeout(() => { win.print(); win.close(); }, 200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('contact.resume.title')}>
      <div className="flex justify-end mb-4 no-print">
        <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-accent-primary text-black rounded hover:bg-white transition-colors text-sm font-bold">
          <Printer className="w-4 h-4 mr-2" />{t('contact.resume.printResume')}
        </button>
      </div>
      <div id="printable-resume" className="bg-white text-black p-8 rounded-lg">
        <div className="header border-b-2 border-black pb-4 mb-6">
          <h1 className="text-3xl font-bold uppercase tracking-wider">{t('contact.resume.name')}</h1>
          <p className="text-lg text-gray-700">{t('contact.resume.position')}</p>
          <div className="contact-list mt-2 text-sm text-gray-600 flex flex-wrap gap-4">
            <a href={`tel:${PROFILE_CONTACTS.phone}`}>{PROFILE_CONTACTS.phoneDisplay}</a>
            <a href={`mailto:${PROFILE_CONTACTS.email}`}>{PROFILE_CONTACTS.email}</a>
            <a href={PROFILE_CONTACTS.telegramUrl} target="_blank" rel="noopener noreferrer">{PROFILE_CONTACTS.telegramDisplay}</a>
            <a href={PROFILE_CONTACTS.githubUrl} target="_blank" rel="noopener noreferrer">github.com/{PROFILE_CONTACTS.githubDisplay}</a>
            <span>{t('contact.locationValue')}</span>
          </div>
        </div>
        <section className="mb-6">
          <h2 className="text-xl font-bold uppercase border-b border-gray-300 mb-4 pb-1">{t('contact.resume.professionalSummary')}</h2>
          <p className="summary text-sm text-gray-800 leading-relaxed">{t('contact.resume.summaryText', { years: yearsOfExperience })}</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold uppercase border-b border-gray-300 mb-4 pb-1">{t('contact.resume.keyExpertise')}</h2>
          <div className="focus-list flex flex-wrap gap-2">
            {resume.focusAreas.map((area) => <span key={area} className="focus-tag bg-gray-100 px-2 py-1 rounded text-sm font-medium">{area}</span>)}
          </div>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold uppercase border-b border-gray-300 mb-4 pb-1">{t('contact.resume.selectedProjects')}</h2>
          <div className="space-y-4">
            {resume.highlights.map((project) => (
              <div key={project.slug} className="project">
                <div className="project-header flex justify-between items-baseline gap-4">
                  <a className="project-title font-bold" href={project.href} target="_blank" rel="noopener noreferrer">{project.title}</a>
                  <span className="project-meta text-sm text-gray-600">Open Source</span>
                </div>
                <p className="project-summary text-sm text-gray-800">{project.summary}</p>
                <p className="tech-line text-xs text-gray-600">{project.stack.join(' · ')}</p>
              </div>
            ))}
            {resume.projects.map((project) => (
              <div key={project.slug} className="project">
                <div className="project-header flex justify-between items-baseline gap-4">
                  {project.links?.[0] ? <a className="project-title font-bold" href={project.links[0].href} target="_blank" rel="noopener noreferrer">{project.title}</a>
                    : <h3 className="project-title font-bold">{project.title}</h3>}
                  <span className="project-meta text-sm text-gray-600">{project.role}</span>
                </div>
                <p className="project-summary text-sm text-gray-800">{project.summary}</p>
                <p className="tech-line text-xs text-gray-600">{project.stack.slice(0, 7).join(' · ')}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold uppercase border-b border-gray-300 mb-4 pb-1">{t('contact.resume.experience')}</h2>
          <div className="space-y-6">
            {resume.experience.map((job) => (
              <div key={job.id} className="job">
                <div className="job-header flex justify-between items-baseline mb-2">
                  <h3 className="job-title font-bold text-lg">{job.role}</h3>
                  <span className="job-period text-sm text-gray-600 italic">{job.period}</span>
                </div>
                <div className="company text-sm font-semibold text-gray-700 mb-2">{job.company}</div>
                <p className="job-description text-sm mb-2">{job.description}</p>
                <ul className="bullet-list list-disc text-sm text-gray-800 pl-5">
                  {job.achievements.map((achievement, index) => <li key={index}>{achievement}</li>)}
                </ul>
                <p className="tech-line text-xs text-gray-600 mt-2">{job.tech.join(' · ')}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold uppercase border-b border-gray-300 mb-4 pb-1">{t('contact.resume.technicalSkills')}</h2>
          <div className="skills flex flex-wrap gap-2">
            {resume.technicalSkills.map((skill) => <span key={skill} className="skill-tag bg-gray-200 px-2 py-1 rounded text-sm font-medium">{skill}</span>)}
          </div>
        </section>
      </div>
    </Modal>
  );
}
