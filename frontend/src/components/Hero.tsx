import React, { Suspense, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail } from 'lucide-react';
import { useLanguage } from '../i18n/hooks/useLanguage';
import { lazyWithReload } from '../utils/lazyWithReload';
import { formatYearsOfExperience, getYearsOfExperience } from '../content';

const HeroScene = lazyWithReload('hero-scene', () => import('./HeroScene'));

const Hero: React.FC = () => {
  const { t, language } = useLanguage();
  const heroRef = useRef<HTMLElement>(null);
  const [showScene, setShowScene] = useState(false);
  const [sceneActive, setSceneActive] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const frame = requestAnimationFrame(() => setShowScene(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!showScene || !hero) return;

    const margin = 100;
    const bounds = hero.getBoundingClientRect();
    let isNearViewport = bounds.bottom >= -margin && bounds.top <= window.innerHeight + margin;
    const updateSceneActivity = () => {
      setSceneActive(isNearViewport && document.visibilityState === 'visible');
    };
    const observer = new IntersectionObserver(([entry]) => {
      isNearViewport = entry.isIntersecting;
      updateSceneActivity();
    }, { rootMargin: `${margin}px 0px` });

    observer.observe(hero);
    document.addEventListener('visibilitychange', updateSceneActivity);
    updateSceneActivity();

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', updateSceneActivity);
    };
  }, [showScene]);

  const scrollToSection = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const yearsOfExperience = getYearsOfExperience();
  const description = t('hero.description', {
    years: formatYearsOfExperience(language), java: t('hero.java'), highload: t('hero.highload'), ai: t('hero.ai'),
  });

  return (
    <section ref={heroRef} id="hero" className="relative w-full min-h-screen bg-background overflow-hidden selection:bg-accent-primary/30">
      <div className="absolute inset-0 z-0 pointer-events-none md:pointer-events-auto">
        {showScene && (
          <Suspense fallback={null}>
            <HeroScene labels={[
              t('hero.planets.pdlc'),
              t('hero.planets.automation'),
              t('hero.planets.reactTS'),
              t('hero.planets.javaSpring'),
              t('hero.planets.pythonAI'),
              t('hero.planets.kubernetes'),
              t('hero.planets.cloudAWS'),
            ]} active={sceneActive} />
          </Suspense>
        )}
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-screen flex flex-col justify-center pointer-events-none">
        <div className="w-full md:w-1/2 pt-[45vh] md:pt-0 pointer-events-auto">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }}>
            <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-accent-primary text-sm font-mono mb-6 backdrop-blur-sm shadow-glow-primary">{t('hero.badge')}</span>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6 tracking-tight">
              {t('hero.name')}<br /><span className="accent-gradient-flow text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary filter drop-shadow-accent-secondary">{t('hero.surname')}</span>
            </h1>
            <p className="hero-soft-backdrop hero-description-outline text-xl md:text-2xl text-secondary mb-8 leading-relaxed max-w-lg">{description}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#projects" onClick={(event) => scrollToSection(event, 'projects')}
                className="group flex items-center justify-center px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                {t('hero.viewProjects')}<ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#contact" onClick={(event) => scrollToSection(event, 'contact')}
                className="group flex items-center justify-center px-8 py-4 bg-transparent border border-white/20 text-white font-bold rounded-lg hover:bg-white/5 transition-all cursor-pointer backdrop-blur-sm">
                {t('hero.contactMe')}<Mail className="ml-2 w-5 h-5 group-hover:text-accent-primary transition-colors" />
              </a>
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }} className="hero-soft-backdrop mt-12 grid grid-cols-3 gap-8 border-t border-white/10 pt-8">
              <div><p className="text-3xl font-bold text-white">{yearsOfExperience}+</p><p className="text-xs text-secondary uppercase tracking-wider mt-1">{t('hero.stats.yearsExp')}</p></div>
              <div><p className="text-3xl font-bold text-white">1M+</p><p className="text-xs text-secondary uppercase tracking-wider mt-1">{t('hero.stats.rpsScaled')}</p></div>
              <div><p className="text-3xl font-bold text-white">{t('hero.stats.fullStackValue')}</p><p className="text-xs text-secondary uppercase tracking-wider mt-1">{t('hero.stats.fullStackCycle')}</p></div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
