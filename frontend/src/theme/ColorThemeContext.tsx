import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import {
  applyColorTheme,
  COLOR_THEME_STORAGE_KEY,
  type ColorTheme,
} from './palettes';

interface ColorThemeContextValue {
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
  toggleTheme: () => void;
}

const ColorThemeContext = createContext<ColorThemeContextValue | null>(null);

export const ColorThemeProvider: React.FC<React.PropsWithChildren<{ initialTheme: ColorTheme }>> = ({
  children,
  initialTheme,
}) => {
  const [theme, setThemeState] = useState<ColorTheme>(initialTheme);

  useLayoutEffect(() => {
    applyColorTheme(theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: ColorTheme) => {
    window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, nextTheme);
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'ember' ? 'neon' : 'ember');
  }, [setTheme, theme]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [setTheme, theme, toggleTheme]);

  return <ColorThemeContext.Provider value={value}>{children}</ColorThemeContext.Provider>;
};

export const useColorTheme = (): ColorThemeContextValue => {
  const value = useContext(ColorThemeContext);
  if (!value) throw new Error('useColorTheme must be used within ColorThemeProvider');
  return value;
};
