import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyColorTheme,
  COLOR_THEME_STORAGE_KEY,
  colorThemes,
  DEFAULT_COLOR_THEME,
  getInitialColorTheme,
  themeRuntimeColor,
} from './palettes';
import { ColorThemeProvider, useColorTheme } from './ColorThemeContext';

const ThemeProbe = () => {
  const { theme, toggleTheme } = useColorTheme();
  return <button type="button" onClick={toggleTheme}>{theme}</button>;
};

describe('color themes', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-color-theme');
    document.documentElement.removeAttribute('style');
  });

  it('defaults to the original turquoise-purple palette', () => {
    expect(colorThemes.neon.accentPrimary).toBe('0 217 255');
    expect(colorThemes.neon.accentSecondary).toBe('255 0 255');
    expect(colorThemes.ember.accentPrimary).toBe('251 146 60');
    expect(colorThemes.ember.accentSecondary).toBe(colorThemes.neon.accentSecondary);
    expect(colorThemes.ember.accentSecondaryLight).toBe(colorThemes.neon.accentSecondaryLight);
    expect(colorThemes.ember.accentSecondaryDark).toBe(colorThemes.neon.accentSecondaryDark);
    expect(DEFAULT_COLOR_THEME).toBe('neon');
    expect(getInitialColorTheme()).toBe('neon');
  });

  it('applies semantic CSS variables and restores a saved theme', () => {
    applyColorTheme('neon');
    expect(document.documentElement).toHaveAttribute('data-color-theme', 'neon');
    expect(document.documentElement.style.getPropertyValue('--color-accent-primary')).toBe('0 217 255');
    expect(themeRuntimeColor('ember', 'accentSecondary')).toBe('rgb(255, 0, 255)');

    window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, 'ember');
    expect(getInitialColorTheme()).toBe('ember');
  });

  it('switches the theme and saves the choice', async () => {
    const user = userEvent.setup();
    render(
      <ColorThemeProvider initialTheme="neon">
        <ThemeProbe />
      </ColorThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'neon' }));

    expect(screen.getByRole('button', { name: 'ember' })).toBeInTheDocument();
    expect(window.localStorage.getItem(COLOR_THEME_STORAGE_KEY)).toBe('ember');
    expect(document.documentElement.style.getPropertyValue('--color-accent-secondary')).toBe('255 0 255');
  });
});
