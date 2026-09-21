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

  it('preserves the original blue-purple palette and defaults to orange-purple', () => {
    expect(colorThemes.neon.accentPrimary).toBe('0 217 255');
    expect(colorThemes.neon.accentSecondary).toBe('255 0 255');
    expect(colorThemes.ember.accentPrimary).toBe('251 146 60');
    expect(colorThemes.ember.accentSecondary).toBe('192 132 252');
    expect(DEFAULT_COLOR_THEME).toBe('ember');
    expect(getInitialColorTheme()).toBe('ember');
  });

  it('applies semantic CSS variables and restores a saved theme', () => {
    applyColorTheme('neon');
    expect(document.documentElement).toHaveAttribute('data-color-theme', 'neon');
    expect(document.documentElement.style.getPropertyValue('--color-accent-primary')).toBe('0 217 255');
    expect(themeRuntimeColor('ember', 'accentSecondary')).toBe('rgb(192, 132, 252)');

    window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, 'neon');
    expect(getInitialColorTheme()).toBe('neon');
  });

  it('switches the theme and saves the choice', async () => {
    const user = userEvent.setup();
    render(
      <ColorThemeProvider initialTheme="ember">
        <ThemeProbe />
      </ColorThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'ember' }));

    expect(screen.getByRole('button', { name: 'neon' })).toBeInTheDocument();
    expect(window.localStorage.getItem(COLOR_THEME_STORAGE_KEY)).toBe('neon');
    expect(document.documentElement.style.getPropertyValue('--color-accent-secondary')).toBe('255 0 255');
  });
});
