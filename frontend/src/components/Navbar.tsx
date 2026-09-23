import React, { useEffect, useRef, useState } from 'react';
import { Menu, Terminal, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '../i18n/hooks/useLanguage';
import LanguageSwitcher from './LanguageSwitcher';
import ColorThemeSwitcher from './ColorThemeSwitcher';

const Navbar: React.FC = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: t('navbar.about'), href: '#hero' },
    { label: t('navbar.experience'), href: '#experience' },
    { label: t('navbar.projects'), href: '#projects' },
    { label: t('navbar.skills'), href: '#skills' },
    { label: t('navbar.insights'), href: '#insights' },
  ];

  const closeMenu = (returnFocus = false) => {
    setIsOpen(false);
    if (returnFocus) requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu(true);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    mobilePanelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleScrollTo = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    const element = document.getElementById(href.slice(1));
    element?.scrollIntoView({ behavior: 'smooth' });
    closeMenu();
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled || isOpen
          ? 'border-white/10 bg-background/90 shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl'
          : 'border-transparent bg-background/35 backdrop-blur-sm'
      }`}
    >
      <nav aria-label={t('navbar.primaryNavigation')} className="mx-auto flex h-[68px] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <a
          href="#hero"
          onClick={(event) => handleScrollTo(event, '#hero')}
          className="group flex min-w-0 items-center gap-3 rounded-lg pr-2 focus-visible:outline-none"
        >
          <span className="accent-gradient-flow grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary shadow-glow-primary transition-transform duration-200 group-hover:scale-105">
            <Terminal className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold tracking-[0.14em] text-primary transition-colors group-hover:text-accent-primary sm:text-base">
              {t('navbar.logo.name')}
            </span>
            <span className="block truncate font-mono text-[10px] font-semibold tracking-[0.18em] text-accent-primary">
              {t('navbar.logo.title')}
            </span>
          </span>
        </a>

        <div className="ml-auto hidden min-w-0 items-center justify-center gap-1 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(event) => handleScrollTo(event, item.href)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-primary/80 transition-colors hover:bg-white/5 hover:text-primary focus-visible:outline-none"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <div className="flex items-center gap-2 [&>button]:min-h-10 [&>button]:min-w-10">
            <ColorThemeSwitcher />
            <LanguageSwitcher />
          </div>
          <a
            href="#contact"
            onClick={(event) => handleScrollTo(event, '#contact')}
            className="inline-flex min-h-10 items-center rounded-lg border border-accent-primary/40 bg-accent-primary/10 px-4 text-sm font-semibold text-accent-primary transition-colors hover:border-accent-primary hover:bg-accent-primary hover:text-background focus-visible:outline-none"
          >
            {t('navbar.letsTalk')}
          </a>
        </div>

        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <div className="flex items-center [&>button]:min-h-11 [&>button]:min-w-11 [&>button]:justify-center [&>button]:px-2">
            <ColorThemeSwitcher />
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-label={isOpen ? t('navbar.closeMenu') : t('navbar.openMenu')}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            className="grid h-11 w-11 place-items-center rounded-lg text-secondary transition-colors hover:bg-white/10 hover:text-primary focus-visible:outline-none"
          >
            {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-0 top-[69px] z-50 h-[calc(100dvh-69px)] w-full lg:hidden"
          >
            <button
              type="button"
              aria-label={t('navbar.closeMenu')}
              className="absolute inset-0 cursor-default bg-black/65"
              onClick={() => closeMenu(true)}
            />
            <motion.div
              id="mobile-navigation"
              ref={mobilePanelRef}
              role="dialog"
              aria-modal="true"
              aria-label={t('navbar.primaryNavigation')}
              tabIndex={-1}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              className="relative h-full overflow-y-auto border-t border-white/10 bg-background px-4 py-4 shadow-2xl sm:px-6"
            >
              <div className="mx-auto grid max-w-7xl gap-1">
                <div className="flex items-center justify-between border-b border-white/10 px-4 pb-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                    {t('navbar.primaryNavigation')}
                  </span>
                  <LanguageSwitcher />
                </div>
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(event) => handleScrollTo(event, item.href)}
                    className="rounded-lg px-4 py-3 text-base font-semibold text-primary/85 transition-colors hover:bg-white/5 hover:text-primary focus-visible:outline-none"
                  >
                    {item.label}
                  </a>
                ))}
                <a
                  href="#contact"
                  onClick={(event) => handleScrollTo(event, '#contact')}
                  className="mt-2 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent-primary px-4 text-sm font-bold text-background transition-colors hover:bg-accent-primary-light focus-visible:outline-none"
                >
                  {t('navbar.letsTalk')}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
