import React, { Suspense, useEffect, useRef, useState } from 'react';
import { LanguageProvider } from './i18n/context/LanguageContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Insights from './components/Insights';
import Contact from './components/Contact';
import Footer from './components/Footer';
import { lazyWithReload } from './utils/lazyWithReload';

const TechStack = lazyWithReload('tech-stack', () => import('./components/TechStack'));

const DeferredTechStack: React.FC = () => {
  const boundary = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!boundary.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '400px' });
    observer.observe(boundary.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={boundary}>{visible
    ? <Suspense fallback={<div id="skills" className="min-h-[36rem] bg-surface" />}><TechStack /></Suspense>
    : <div id="skills" className="min-h-[36rem] bg-surface" aria-hidden="true" />}</div>;
};

function App() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background text-primary font-sans antialiased selection:bg-accent-cyan/30 selection:text-white">
        <Navbar />
        
        <main className="flex flex-col w-full">
          <Hero />
        
        <Experience />
        <Projects />
        <DeferredTechStack />
        <Insights />
        <Contact />
      </main>

        <Footer />
        
        {/* Background Grid Pattern */}
        <div className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.03]" 
             style={{ 
               backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
               backgroundSize: '50px 50px' 
             }} 
        />
      </div>
    </LanguageProvider>
  );
}

export default App;

