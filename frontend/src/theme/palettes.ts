export type ColorTheme = 'neon' | 'ember';

export const DEFAULT_COLOR_THEME: ColorTheme = 'neon';
export const COLOR_THEME_STORAGE_KEY = 'personal-page-color-theme-v2';

const sharedPurpleAccent = {
  accentSecondary: '255 0 255',
  accentSecondaryLight: '255 51 255',
  accentSecondaryDark: '204 0 204',
} as const;

export const colorThemes = {
  neon: {
    background: '10 10 10',
    surface: '18 18 18',
    textPrimary: '240 240 240',
    textSecondary: '136 136 136',
    accentPrimary: '0 217 255',
    accentPrimaryLight: '51 224 255',
    accentPrimaryDark: '0 184 217',
    ...sharedPurpleAccent,
  },
  ember: {
    background: '9 10 10',
    surface: '16 20 20',
    textPrimary: '244 247 246',
    textSecondary: '148 163 159',
    accentPrimary: '251 146 60',
    accentPrimaryLight: '253 186 116',
    accentPrimaryDark: '234 88 12',
    ...sharedPurpleAccent,
  },
} as const;

export type ThemeColorToken = keyof typeof colorThemes.neon;

const cssVariables: Record<ThemeColorToken, string> = {
  background: '--color-background',
  surface: '--color-surface',
  textPrimary: '--color-text-primary',
  textSecondary: '--color-text-secondary',
  accentPrimary: '--color-accent-primary',
  accentPrimaryLight: '--color-accent-primary-light',
  accentPrimaryDark: '--color-accent-primary-dark',
  accentSecondary: '--color-accent-secondary',
  accentSecondaryLight: '--color-accent-secondary-light',
  accentSecondaryDark: '--color-accent-secondary-dark',
};

export const themeCssTriplet = (token: ThemeColorToken): string => (
  `var(${cssVariables[token]}, ${colorThemes[DEFAULT_COLOR_THEME][token]})`
);

export const themeCssColor = (token: ThemeColorToken): string => (
  `rgb(${themeCssTriplet(token)} / <alpha-value>)`
);

export const themeRuntimeColor = (theme: ColorTheme, token: ThemeColorToken): string => (
  `rgb(${colorThemes[theme][token].replaceAll(' ', ', ')})`
);

export const isColorTheme = (value: unknown): value is ColorTheme => (
  value === 'neon' || value === 'ember'
);

export const getInitialColorTheme = (): ColorTheme => {
  if (typeof window === 'undefined') return DEFAULT_COLOR_THEME;
  const storedTheme = window.localStorage.getItem(COLOR_THEME_STORAGE_KEY);
  return isColorTheme(storedTheme) ? storedTheme : DEFAULT_COLOR_THEME;
};

export const applyColorTheme = (theme: ColorTheme, root: HTMLElement = document.documentElement): void => {
  const palette = colorThemes[theme];
  root.dataset.colorTheme = theme;
  for (const token of Object.keys(palette) as ThemeColorToken[]) {
    root.style.setProperty(cssVariables[token], palette[token]);
  }
};
