import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Cpu,
  ExternalLink,
  Globe,
  Layers,
  Server,
  UserCheck,
} from 'lucide-react';
import { getProjects } from '../content';
import type { Project, ProjectCategory } from '../content';
import { useLanguage } from '../i18n/hooks/useLanguage';
import Modal from './Modal';
import ProjectImage from './ProjectImage';

type ProjectFilter = 'all' | ProjectCategory;

const usesCyanAccent = (project: Project): boolean => (
  project.categories.includes('ai') || project.categories.includes('devops')
);

const Projects: React.FC = () => {
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const projects = useMemo(() => getProjects(language), [language]);

  const categories: Array<{ key: ProjectFilter; label: string }> = [
    { key: 'all', label: t('projects.categories.all') },
    { key: 'ai', label: t('projects.categories.ai') },
    { key: 'devops', label: t('projects.categories.devops') },
    { key: 'fullstack', label: t('projects.categories.fullstack') },
  ];
  const categoryLabels: Record<ProjectCategory, string> = {
    ai: t('projects.categories.ai'),
    devops: t('projects.categories.devops'),
    fullstack: t('projects.categories.fullstack'),
  };
  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter((project) => project.categories.includes(filter));

  useEffect(() => {
    if (!selectedProject || selectedProject.media.length < 2) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setMediaIndex((index) => (index - 1 + selectedProject.media.length) % selectedProject.media.length);
      }
      if (event.key === 'ArrowRight') {
        setMediaIndex((index) => (index + 1) % selectedProject.media.length);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedProject]);

  const openProject = (project: Project) => {
    setMediaIndex(0);
    setSelectedProject(project);
  };
  const closeProject = () => setSelectedProject(null);
  const selectedMedia = selectedProject?.media[mediaIndex];

  return (
    <section id="projects" className="py-24 bg-background scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('projects.title')}</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-accent-cyan to-accent-magenta mb-4" />
            <p className="text-secondary max-w-xl">{t('projects.description')}</p>
          </div>

          <div className="flex flex-wrap gap-2" aria-label={t('projects.categories.all')}>
            {categories.map((category) => (
              <button
                key={category.key}
                type="button"
                aria-pressed={filter === category.key}
                onClick={() => setFilter(category.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  filter === category.key
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.slug}
                project={project}
                language={language}
                categoryLabels={categoryLabels}
                viewLabel={t('projects.viewCaseStudy')}
                onClick={() => openProject(project)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <Modal isOpen={!!selectedProject} onClose={closeProject} title={selectedProject?.title}>
        {selectedProject && selectedMedia && (
          <div className="space-y-8">
            <figure className="space-y-3">
              <div className="w-full aspect-video rounded-lg overflow-hidden relative group bg-black">
                <ProjectImage
                  media={selectedMedia}
                  locale={language}
                  title={selectedProject.title}
                  sizes="(min-width: 1024px) 56rem, 100vw"
                  className="w-full h-full object-cover transform group-hover:scale-[1.02] transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 pointer-events-none">
                  {selectedProject.categories.map((category) => (
                    <span key={category} className="px-3 py-1 bg-black/70 backdrop-blur-md text-xs font-mono border border-accent-cyan/50 text-accent-cyan rounded">
                      {categoryLabels[category]}
                    </span>
                  ))}
                </div>
                {selectedProject.media.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMediaIndex((mediaIndex - 1 + selectedProject.media.length) % selectedProject.media.length)}
                      aria-label={t('projects.previousImage')}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white hover:bg-black/90"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaIndex((mediaIndex + 1) % selectedProject.media.length)}
                      aria-label={t('projects.nextImage')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white hover:bg-black/90"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
                <span className="absolute bottom-4 right-4 rounded bg-black/70 px-2 py-1 text-xs font-mono text-white/80">
                  {t('projects.imageCounter', { current: String(mediaIndex + 1), total: String(selectedProject.media.length) })}
                </span>
              </div>
              {selectedMedia.caption?.[language] && (
                <figcaption className="text-sm text-secondary">{selectedMedia.caption[language]}</figcaption>
              )}
            </figure>

            <ProjectSection icon={<Globe className="w-5 h-5 text-accent-cyan" />} title={t('projects.context')}>
              <p className="text-gray-300 leading-relaxed">{selectedProject.context}</p>
            </ProjectSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProjectListSection icon={<UserCheck className="w-5 h-5 text-accent-cyan" />} title={t('projects.contribution')} items={selectedProject.contribution} accent="cyan" />
              <ProjectListSection icon={<Layers className="w-5 h-5 text-accent-magenta" />} title={t('projects.decisions')} items={selectedProject.decisions} accent="magenta" />
              <ProjectListSection icon={<Cpu className="w-5 h-5 text-accent-magenta" />} title={t('projects.challenges')} items={selectedProject.challenges} accent="magenta" />
              <ProjectListSection icon={<CheckCircle className="w-5 h-5 text-accent-cyan" />} title={t('projects.results')} items={selectedProject.results} accent="cyan" />
            </div>

            <ProjectSection icon={<Server className="w-5 h-5 text-accent-cyan" />} title={t('projects.stack')}>
              <div className="flex flex-wrap gap-2">
                {selectedProject.stack.map((technology) => (
                  <span key={technology} className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan">
                    {technology}
                  </span>
                ))}
              </div>
              {selectedProject.links && selectedProject.links.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">
                  {selectedProject.links.map((link) => (
                    <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-accent-cyan hover:underline">
                      {link.label[language]} <ExternalLink className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              )}
            </ProjectSection>
          </div>
        )}
      </Modal>
    </section>
  );
};

const ProjectSection: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <section className="bg-white/5 rounded-lg p-6 border border-white/10">
    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">{icon}{title}</h4>
    {children}
  </section>
);

const ProjectListSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  items: string[];
  accent: 'cyan' | 'magenta';
}> = ({ icon, title, items, accent }) => (
  <ProjectSection icon={icon} title={title}>
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start text-sm text-gray-300 leading-relaxed">
          <span className={`w-2 h-2 rounded-full mt-2 mr-3 shrink-0 ${accent === 'cyan' ? 'bg-accent-cyan' : 'bg-accent-magenta'}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </ProjectSection>
);

interface ProjectCardProps {
  project: Project;
  language: 'ru' | 'en';
  categoryLabels: Record<ProjectCategory, string>;
  viewLabel: string;
  onClick: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, language, categoryLabels, viewLabel, onClick }) => {
  const cyan = usesCyanAccent(project);
  const cover = project.media[0];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`group relative bg-surface border rounded-xl overflow-hidden transition-all duration-300 flex flex-col h-full md:last:odd:col-span-2 md:last:odd:w-[calc(50%-1rem)] md:last:odd:justify-self-center ${
        cyan
          ? 'border-white/10 hover:border-accent-cyan/40 hover:shadow-[0_0_40px_rgba(0,217,255,0.2)]'
          : 'border-white/10 hover:border-accent-magenta/40 hover:shadow-[0_0_40px_rgba(255,0,255,0.2)]'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90 z-10 pointer-events-none" />
      <div className="h-56 overflow-hidden relative bg-black">
        <ProjectImage
          media={cover}
          locale={language}
          title={project.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-60"
        />
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1">
          {project.categories.map((category) => (
            <span key={category} className={`px-3 py-1 bg-black/70 backdrop-blur-md text-xs font-mono border rounded ${
              category === 'ai' || category === 'devops'
                ? 'border-accent-cyan/50 text-accent-cyan'
                : 'border-accent-magenta/50 text-accent-magenta'
            }`}>
              {categoryLabels[category]}
            </span>
          ))}
        </div>
        <span className="absolute bottom-4 left-4 z-20 text-xs font-mono text-white/80 bg-black/50 px-2 py-1 rounded backdrop-blur-sm">{project.role}</span>
      </div>

      <div className="p-6 relative z-20 -mt-12 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-accent-cyan transition-colors">{project.title}</h3>
        <p className="text-gray-300 text-sm mb-6 min-h-[3rem] leading-relaxed">{project.summary}</p>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {project.metrics.map((metric) => (
            <div key={`${metric.value}-${metric.label ?? ''}`} className="flex items-center justify-center text-xs font-mono text-gray-300 bg-white/5 p-2 rounded border border-white/10 text-center">
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${cyan ? 'bg-accent-cyan' : 'bg-accent-magenta'}`} />
              <span className="truncate">{metric.label ? `${metric.value} ${metric.label}` : metric.value}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {project.stack.slice(0, 5).map((technology) => (
            <span key={technology} className="text-xs text-secondary border border-white/10 px-2 py-1 rounded bg-white/3 hover:bg-white/5 transition-colors">{technology}</span>
          ))}
          {project.stack.length > 5 && <span className="text-xs text-secondary border border-white/10 px-2 py-1 rounded bg-white/3">+{project.stack.length - 5}</span>}
        </div>
        <div className="mt-auto pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={onClick}
            className={`w-full flex items-center justify-center text-sm font-bold py-2.5 px-4 rounded-lg transition-all group/btn ${
              cyan
                ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/20'
                : 'bg-accent-magenta/10 text-accent-magenta border border-accent-magenta/30 hover:bg-accent-magenta/20'
            }`}
          >
            {viewLabel}
            <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default Projects;
