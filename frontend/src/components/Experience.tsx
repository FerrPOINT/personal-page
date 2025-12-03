import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Calendar, ChevronRight } from 'lucide-react';
import { EXPERIENCE } from '../constants';

const Experience: React.FC = () => {
  return (
    <section id="experience" className="py-24 bg-surface relative overflow-hidden scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Professional Journey</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-accent-cyan to-accent-magenta"></div>
        </motion.div>

        <div className="relative border-l border-white/10 ml-3 md:ml-6 space-y-12">
          {EXPERIENCE.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-8 md:pl-12 group"
            >
              {/* Timeline Dot */}
              <div className="absolute -left-[5px] md:-left-[8px] top-2 w-[10px] h-[10px] md:w-4 md:h-4 rounded-full bg-background border-2 border-accent-cyan group-hover:bg-accent-cyan transition-colors duration-300 shadow-[0_0_10px_rgba(0,217,255,0.5)]" />

              <div className="bg-white/5 border border-white/5 rounded-lg p-6 hover:border-accent-cyan/30 transition-all duration-300 hover:bg-white/[0.07]">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {job.role}
                      <span className="hidden md:inline text-secondary text-sm font-normal">@</span>
                      <span className="text-accent-cyan block md:inline">{job.company}</span>
                    </h3>
                  </div>
                  <div className="flex items-center text-sm text-secondary font-mono mt-2 md:mt-0">
                    <Calendar className="w-4 h-4 mr-2" />
                    {job.period}
                  </div>
                </div>

                <p className="text-gray-300 mb-6 max-w-3xl">{job.description}</p>

                <div className="space-y-2 mb-6">
                  {job.achievements.map((achievement, idx) => (
                    <div key={idx} className="flex items-start text-sm text-gray-400">
                      <ChevronRight className="w-4 h-4 mr-2 text-accent-magenta shrink-0 mt-0.5" />
                      <span>{achievement}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {job.tech.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-black/40 rounded-full text-xs font-medium text-accent-cyan border border-accent-cyan/10"
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

