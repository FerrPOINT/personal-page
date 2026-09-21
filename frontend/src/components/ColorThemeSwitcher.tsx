import React from 'react';
import { Palette } from 'lucide-react';
import { colorThemes } from '../theme/palettes';
import { useLanguage } from '../i18n/hooks/useLanguage';
import { useColorTheme } from '../theme/ColorThemeContext';

const ColorThemeSwitcher: React.FC = () => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useColorTheme();
  const nextTheme = theme === 'ember' ? 'neon' : 'ember';
  const nextPalette = colorThemes[nextTheme];
  const nextThemeLabel = t(`common.colorThemes.${nextTheme}`);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-secondary transition-all duration-200 hover:border-accent-primary/30 hover:bg-white/10 hover:text-white"
      aria-label={t('common.switchColorTheme', { theme: nextThemeLabel })}
      title={t('common.switchColorTheme', { theme: nextThemeLabel })}
    >
      <Palette className="h-4 w-4" aria-hidden="true" />
      <span className="flex gap-1" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `rgb(${nextPalette.accentPrimary})` }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `rgb(${nextPalette.accentSecondary})` }} />
      </span>
    </button>
  );
};

export default ColorThemeSwitcher;
