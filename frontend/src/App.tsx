import React, { Suspense } from 'react';
import { LanguageProvider } from './i18n/context/LanguageContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Experience from './components/Experience';
import Projects from './components/Projects';
import TechStack from './components/TechStack';
import Insights from './components/Insights';
import Contact from './components/Contact';
import Footer from './components/Footer';

const LoadingFallback: React.FC = () => {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background text-white">
      Loading 3D Assets...
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background text-primary font-sans antialiased selection:bg-accent-cyan/30 selection:text-white">
        <Navbar />
        
        <main className="flex flex-col w-full">
          <Suspense fallback={<LoadingFallback />}>
            <Hero />
          </Suspense>
        
        <Experience />
        <Projects />
        <TechStack />
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

