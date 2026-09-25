import React from 'react';
import { Palette } from 'lucide-react';
import { useLanguage } from '../i18n/hooks/useLanguage';
import { useColorTheme } from '../theme/ColorThemeContext';

const ColorThemeSwitcher: React.FC = () => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useColorTheme();
  const nextTheme = theme === 'ember' ? 'neon' : 'ember';
  const nextThemeLabel = t(`common.colorThemes.${nextTheme}`);
  const switchLabel = t('common.switchColorTheme', { theme: nextThemeLabel });
  const currentThemeName = t(`common.colorThemeNames.${theme}`);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-secondary transition-all duration-200 hover:border-accent-primary/30 hover:bg-white/10 hover:text-primary"
      aria-label={switchLabel}
      title={switchLabel}
    >
      <Palette className="h-4 w-4" aria-hidden="true" />
      <span className="hidden text-xs font-semibold uppercase tracking-[0.12em] xl:inline">{currentThemeName}</span>
    </button>
  );
};

export default ColorThemeSwitcher;
