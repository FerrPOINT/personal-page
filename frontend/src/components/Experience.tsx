import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Calendar, ChevronRight } from 'lucide-react';
import { useLanguage } from '../i18n/hooks/useLanguage';
import { getExperience } from '../content';

const Experience: React.FC = () => {
  const { t, language } = useLanguage();
  
  const experienceItems = useMemo(() => getExperience(language), [language]);
  
  return (
    <section id="experience" className="py-24 bg-surface relative overflow-hidden scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('experience.title')}</h2>
          <div className="accent-gradient-flow w-20 h-1 bg-gradient-to-r from-accent-primary to-accent-secondary"></div>
        </motion.div>

        <div className="relative border-l border-white/10 ml-3 md:ml-6 space-y-12">
          {experienceItems.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-8 md:pl-12 group"
            >
              {/* Timeline Dot */}
              <div className="absolute -left-[5px] md:-left-[8px] top-2 w-[10px] h-[10px] md:w-4 md:h-4 rounded-full bg-background border-2 border-accent-primary group-hover:bg-accent-primary transition-colors duration-300 shadow-glow-primary" />

              <div className="bg-white/5 border border-white/5 rounded-lg p-6 hover:border-accent-primary/30 transition-all duration-300 hover:bg-white/[0.07]">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {job.role}
                      <span className="hidden md:inline text-secondary text-sm font-normal">@</span>
                      <span className="text-accent-primary block md:inline">{job.company}</span>
                    </h3>
                  </div>
                  <div className="flex items-center text-sm text-secondary font-mono mt-2 md:mt-0">
                    <Calendar className="w-4 h-4 mr-2" />
                    {job.period}
                  </div>
                </div>

                <p className="text-gray-300 mb-6 max-w-3xl">{job.description}</p>

                <div className="mb-6">
                  <p className="mb-2 text-xs font-mono uppercase tracking-[0.16em] text-secondary">
                    {t('experience.focusAreas')}
                  </p>
                  <ul className="flex flex-wrap gap-2" aria-label={t('experience.focusAreas')}>
                    {job.focusAreas.map((focusArea) => (
                      <li
                        key={focusArea}
                        className="rounded-md border border-accent-secondary/20 bg-accent-secondary/10 px-3 py-1.5 text-xs font-medium text-gray-200"
                      >
                        {focusArea}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 mb-6">
                  {job.achievements.map((achievement, idx) => (
                    <div key={idx} className="flex items-start text-sm text-gray-400">
                      <ChevronRight className="w-4 h-4 mr-2 text-accent-secondary shrink-0 mt-0.5" />
                      <span>{achievement}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {job.tech.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-black/40 rounded-full text-xs font-medium text-accent-primary border border-accent-primary/10"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;

