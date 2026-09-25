import { describe, expect, it } from 'vitest';
import { translations } from '../i18n/translations';
import { getArticles, getExperience, getProjects } from './selectors';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key));
}

describe('localization completeness', () => {
  it('keeps the RU and EN interface translation contracts in sync', () => {
    expect(flattenKeys(translations.ru).sort()).toEqual(flattenKeys(translations.en).sort());
  });

  it('localizes human-readable portfolio fields while preserving technical names', () => {
    const ruExperience = getExperience('ru');
    const ruProjects = getProjects('ru');

    expect(ruExperience[0]).toMatchObject({
      company: 'Независимые проекты / Фриланс',
      role: 'Архитектор ПО / FullStack-инженер',
    });
    expect(ruExperience[1].focusAreas).toContain('Безопасность и производительность');
    expect(ruProjects.find(({ slug }) => slug === 'multi-agent-ai')?.metrics[0].value).toBe('10+ агентов');
    expect(ruProjects.find(({ slug }) => slug === 'hr-platform')?.metrics[0].value).toBe('4 модуля');
    expect(ruProjects.find(({ slug }) => slug === 'pdlc-platform')?.metrics[0].value).toBe('6 сервисов');
    expect(getArticles('ru')[0].title).toMatch(/^Мультиагентный AI/);
  });

  it('does not reintroduce confirmed English UI leaks into Russian content', () => {
    const russianContent = JSON.stringify({
      translations: translations.ru,
      projects: getProjects('ru'),
      experience: getExperience('ru'),
      articles: getArticles('ru'),
    });
    const leakedPhrases = [
      'Independent / Freelance',
      'Software Architect',
      'Software Developer',
      'Developer Infrastructure',
      'Full-Cycle Delivery',
      'Security & Performance',
      '10+ Agents',
      '4 Modules',
      '6 Services',
      'End-to-End PDLC',
      'Open Source',
    ];

    for (const phrase of leakedPhrases) expect(russianContent).not.toContain(phrase);
  });

  it('keeps localized English prose free of accidental Cyrillic text', () => {
    const englishContent = {
      translations: translations.en,
      projects: getProjects('en').map(({ title, role, summary, context, contribution, challenges, decisions, results, metrics }) =>
        ({ title, role, summary, context, contribution, challenges, decisions, results, metrics })),
      experience: getExperience('en').map(({ company, role, period, description, focusAreas, achievements }) =>
        ({ company, role, period, description, focusAreas, achievements })),
      articles: getArticles('en'),
    };

    expect(JSON.stringify(englishContent)).not.toMatch(/[А-Яа-яЁё]/);
  });
});
