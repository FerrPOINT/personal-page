import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Layers, Server, Cpu, Globe, CheckCircle } from 'lucide-react';
import { Project } from '../types';
import Modal from './Modal';
import { useLanguage } from '../i18n/hooks/useLanguage';
import { getTranslatedProjects, getCategoryMap } from '../i18n/utils/getTranslatedData';

const Projects: React.FC = () => {
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Маппинг категорий для отображения
  const categoryMap = useMemo(() => getCategoryMap(language, t), [language, t]);

  const projects = useMemo(() => getTranslatedProjects(language), [language]);

  const categories = [
    { key: 'All', label: t('projects.categories.all') },
    { key: 'AI', label: t('projects.categories.ai') },
    { key: 'DevOps', label: t('projects.categories.devops') },
    { key: 'FullStack', label: t('projects.categories.fullstack') }
  ];

  const filteredProjects = projects.filter(
    (p) => {
      if (filter === 'All') return true;
      // Для фильтрации учитываем, что в ru.json категория AI может быть "ИИ"
      if (filter === 'AI') {
        return p.categories.includes('AI') || p.categories.includes('ИИ');
      }
      return p.categories.includes(filter);
    }
  );

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
            <div className="w-20 h-1 bg-gradient-to-r from-accent-cyan to-accent-magenta mb-4"></div>
            <p className="text-secondary max-w-xl">
              {t('projects.description')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setFilter(cat.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  filter === cat.key
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <Modal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title={selectedProject?.title}
      >
        {selectedProject && (
          <div className="space-y-8">
            <div className="w-full h-80 rounded-lg overflow-hidden relative group">
               <img 
                 src={selectedProject.imageUrl} 
                 alt={selectedProject.title} 
                 className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
               <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                 <div className="flex flex-wrap gap-2">
                   {selectedProject.categories.map((cat, idx) => {
                     const categoryKey = cat === 'ИИ' ? 'AI' : cat;
                     return (
                       <span key={idx} className={`px-4 py-2 bg-black/60 backdrop-blur-md text-sm font-mono border rounded-lg ${
                         categoryKey === 'DevOps' || categoryKey === 'AI'
                           ? 'border-accent-cyan/50 text-accent-cyan'
                           : 'border-accent-magenta/50 text-accent-magenta'
                       }`}>
                         {categoryMap[categoryKey] || cat}
                       </span>
                     );
                   })}
                   <p className="text-white/80 text-sm font-mono bg-black/40 px-3 py-1 rounded backdrop-blur-sm inline-block">
                     {selectedProject.role}
                   </p>
                 </div>
               </div>
               <div className="absolute bottom-6 left-6 right-6">
                 <div className="flex flex-wrap gap-2 mb-4">
                   {selectedProject.metrics.map((m, i) => {
                     const hasAI = selectedProject.categories.some(c => c === 'AI' || c === 'ИИ');
                     const hasDevOps = selectedProject.categories.includes('DevOps');
                     return (
                       <span key={i} className={`px-4 py-2 bg-black/60 backdrop-blur-md text-sm rounded-lg font-mono border ${
                         hasDevOps || hasAI
                           ? 'border-accent-cyan/40 text-accent-cyan'
                           : 'border-accent-magenta/40 text-accent-magenta'
                       }`}>
                         {m}
                       </span>
                     );
                   })}
                 </div>
               </div>
            </div>

            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-accent-cyan" />
                {t('projects.title')}
              </h4>
              <p className="text-gray-300 leading-relaxed text-base">
                {selectedProject.fullDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Cpu className="w-5 h-5 mr-2 text-accent-magenta" />
                  {t('projects.challenges')}
                </h4>
                <ul className="space-y-3">
                  {selectedProject.challenges.map((challenge, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-300 leading-relaxed">
                      <span className="w-2 h-2 bg-accent-magenta rounded-full mt-2 mr-3 shrink-0 flex-shrink-0"/>
                      <span>{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-accent-cyan" />
                  {t('projects.results')}
                </h4>
                <ul className="space-y-3">
                  {selectedProject.results.map((res, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-300 leading-relaxed">
                      <span className="w-2 h-2 bg-accent-cyan rounded-full mt-2 mr-3 shrink-0 flex-shrink-0"/>
                      <span>{res}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
               <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                 <Server className="w-5 h-5 mr-2 text-accent-cyan" />
                 {t('projects.stack')}
               </h4>
               <div className="flex flex-wrap gap-2 mb-6">
                 {selectedProject.stack.map(tech => {
                   const hasAI = selectedProject.categories.some(c => c === 'AI' || c === 'ИИ');
                   const hasDevOps = selectedProject.categories.includes('DevOps');
                   return (
                     <span key={tech} className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                       hasDevOps || hasAI
                         ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan'
                         : 'bg-accent-magenta/10 border-accent-magenta/30 text-accent-magenta'
                     }`}>
                       {tech}
                     </span>
                   );
                 })}
               </div>

               <div className="flex justify-end pt-4 border-t border-white/10">
                  <button 
                    onClick={() => setSelectedProject(null)}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                      (() => {
                        const hasAI = selectedProject.categories.some(c => c === 'AI' || c === 'ИИ');
                        const hasDevOps = selectedProject.categories.includes('DevOps');
                        return hasDevOps || hasAI;
                      })()
                        ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/20'
                        : 'bg-accent-magenta/10 text-accent-magenta border border-accent-magenta/30 hover:bg-accent-magenta/20'
                    }`}
                  >
                    {t('common.close')}
                  </button>
               </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};

const ProjectCard: React.FC<{ project: Project, onClick: () => void }> = ({ project, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`group relative bg-surface border rounded-xl overflow-hidden transition-all duration-300 flex flex-col h-full ${
        (() => {
          const hasAI = project.categories.some(c => c === 'AI' || c === 'ИИ');
          const hasDevOps = project.categories.includes('DevOps');
          return hasDevOps || hasAI;
        })()
          ? 'border-white/10 hover:border-accent-cyan/40 hover:shadow-[0_0_40px_rgba(0,217,255,0.2)]'
          : 'border-white/10 hover:border-accent-magenta/40 hover:shadow-[0_0_40px_rgba(255,0,255,0.2)]'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90 z-10 pointer-events-none" />
      
      <div className="h-56 overflow-hidden relative">
        <img
          src={project.imageUrl}
          alt={project.title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 opacity-70 group-hover:opacity-50"
        />
        <div className="absolute top-4 right-4 z-20">
          <div className="flex flex-col gap-1">
            {project.categories.map((cat, idx) => {
              // Определяем внутренний ключ категории для логики
              const categoryKey = cat === 'ИИ' ? 'AI' : cat;
              return (
                <span key={idx} className={`px-3 py-1 bg-black/70 backdrop-blur-md text-xs font-mono border rounded ${
                  categoryKey === 'DevOps' || categoryKey === 'AI'
                    ? 'border-accent-cyan/50 text-accent-cyan'
                    : 'border-accent-magenta/50 text-accent-magenta'
                }`}>
                  {categoryMap[categoryKey] || cat}
                </span>
              );
            })}
          </div>
        </div>
        <div className="absolute bottom-4 left-4 z-20">
          <span className="text-xs font-mono text-white/80 bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
            {project.role}
          </span>
        </div>
      </div>

      <div className="p-6 relative z-20 -mt-12 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-accent-cyan transition-colors">
          {project.title}
        </h3>
        <p className="text-gray-300 text-sm mb-6 min-h-[3rem] leading-relaxed">
          {project.description}
        </p>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {project.metrics.map((metric, i) => (
            <div key={i} className="flex items-center justify-center text-xs font-mono text-gray-300 bg-white/5 p-2 rounded border border-white/10 text-center">
              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${
                (() => {
                  const hasAI = project.categories.some(c => c === 'AI' || c === 'ИИ');
                  const hasDevOps = project.categories.includes('DevOps');
                  return hasDevOps || hasAI;
                })() ? 'bg-accent-cyan' : 'bg-accent-magenta'
              }`} />
              <span className="truncate">{metric}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {project.stack.slice(0, 5).map((tech) => (
            <span key={tech} className="text-xs text-secondary border border-white/10 px-2 py-1 rounded bg-white/3 hover:bg-white/5 transition-colors">
              {tech}
            </span>
          ))}
          {project.stack.length > 5 && (
             <span className="text-xs text-secondary border border-white/10 px-2 py-1 rounded bg-white/3">
               +{project.stack.length - 5}
             </span>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-white/5">
            <button 
                onClick={onClick}
                className={`w-full flex items-center justify-center text-sm font-bold py-2.5 px-4 rounded-lg transition-all group/btn ${
                  (() => {
                    const hasAI = project.categories.some(c => c === 'AI' || c === 'ИИ');
                    const hasDevOps = project.categories.includes('DevOps');
                    return hasDevOps || hasAI;
                  })()
                    ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/20'
                    : 'bg-accent-magenta/10 text-accent-magenta border border-accent-magenta/30 hover:bg-accent-magenta/20'
                }`}
            >
            {t('projects.viewCaseStudy')}
            <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Projects;

