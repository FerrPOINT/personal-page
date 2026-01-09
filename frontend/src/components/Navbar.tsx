import React, { useState, useEffect } from 'react';
import { Menu, X, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/hooks/useLanguage';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar: React.FC = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const navItems = [
    { label: t('navbar.about'), href: '#hero' },
    { label: t('navbar.experience'), href: '#experience' },
    { label: t('navbar.projects'), href: '#projects' },
    { label: t('navbar.skills'), href: '#skills' },
    { label: t('navbar.insights'), href: '#insights' },
    { label: t('navbar.contact'), href: '#contact' },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/80 backdrop-blur-md border-b border-white/5' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#hero" className="flex-shrink-0 flex items-center gap-2 cursor-pointer group" onClick={(e) => handleScrollTo(e, '#hero')}>
            <div className="bg-gradient-to-br from-accent-cyan to-accent-magenta p-2 rounded-lg group-hover:opacity-90 transition-opacity">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="block text-lg font-bold tracking-wider text-white group-hover:text-accent-cyan transition-colors">{t('navbar.logo.name')}</span>
              <span className="block text-xs text-accent-cyan font-mono tracking-widest">{t('navbar.logo.title')}</span>
            </div>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleScrollTo(e, item.href)}
                  className="text-sm font-medium text-secondary hover:text-accent-cyan transition-colors duration-200 relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent-cyan transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <a 
              href="#contact"
              onClick={(e) => handleScrollTo(e, '#contact')}
              className="px-6 py-2 rounded-full border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/10 transition-all duration-300 font-medium text-sm"
            >
              {t('navbar.letsTalk')}
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-surface border-b border-white/5 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleScrollTo(e, item.href)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5"
                >
                  {item.label}
                </a>
              ))}
              <div className="px-3 py-2">
                <a 
                  href="#contact"
                  onClick={(e) => handleScrollTo(e, '#contact')}
                  className="block w-full text-center px-4 py-2 rounded-full border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/10 transition-all duration-300 font-medium text-sm"
                >
                  {t('navbar.letsTalk')}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

