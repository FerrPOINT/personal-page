import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, Cell, YAxis, CartesianGrid } from 'recharts';
import { useLanguage } from '../i18n/hooks/useLanguage';
import { TechSkill } from '../types';
import { getTranslatedSkills } from '../i18n/utils/getTranslatedData';

const TechStack: React.FC = () => {
  const { t, language } = useLanguage();
  
  const skills = useMemo(() => getTranslatedSkills(language), [language]);
  
  return (
    <section id="skills" className="py-24 bg-surface border-y border-white/5 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          
          <div className="w-full lg:w-1/3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('techStack.title')}</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-accent-cyan to-accent-magenta mb-6"></div>
              <p className="text-secondary mb-8 leading-relaxed">
                {t('techStack.description')}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                    <h4 className="text-accent-cyan font-bold mb-1">{t('techStack.architecture.title')}</h4>
                    <p className="text-xs text-secondary">{t('techStack.architecture.description')}</p>
                 </div>
                 <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                    <h4 className="text-accent-magenta font-bold mb-1">{t('techStack.aiMl.title')}</h4>
                    <p className="text-xs text-secondary">{t('techStack.aiMl.description')}</p>
                 </div>
              </div>
            </motion.div>
          </div>

          <div className="w-full lg:w-2/3 h-[400px]">
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="w-full h-full"
             >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={skills}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={140} 
                    tick={{ fill: '#f0f0f0', fontSize: 12, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Bar dataKey="level" barSize={20} radius={[0, 4, 4, 0]}>
                    {skills.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index % 2 === 0 ? '#00d9ff' : '#ff00ff'} 
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default TechStack;

