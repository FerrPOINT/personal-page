import { describe, expect, it } from 'vitest';
import { ARTICLE_DEFINITIONS, PROJECT_DEFINITIONS } from './definitions';
import { getArticle, getArticles, getExperience, getProjects } from './selectors';
import { assertPortfolioContent } from './validation';

describe('portfolio content', () => {
  it('passes the content contract', () => {
    expect(() => assertPortfolioContent()).not.toThrow();
  });

  it('keeps project identity and technical metadata stable across locales', () => {
    const ru = getProjects('ru');
    const en = getProjects('en');
    expect(ru.map((project) => project.slug)).toEqual(en.map((project) => project.slug));
    expect(ru.map((project) => project.categories)).toEqual(en.map((project) => project.categories));
    expect(ru.map((project) => project.stack)).toEqual(en.map((project) => project.stack));
  });

  it('uses complete local responsive media sets', () => {
    for (const project of PROJECT_DEFINITIONS) {
      expect(project.media.length).toBeGreaterThan(0);
      for (const media of project.media) {
        expect(media.avif.small).toMatch(/\.avif$/);
        expect(media.avif.large).toMatch(/\.avif$/);
        expect(media.webp.small).toMatch(/\.webp$/);
        expect(media.webp.large).toMatch(/\.webp$/);
        expect(Object.values(media.alt).every(Boolean)).toBe(true);
        expect(Object.values(media.avif).concat(Object.values(media.webp)).every((url) => !/^https?:\/\//.test(url))).toBe(true);
      }
    }
  });

  it('keeps the WMT multi-project focus localized', () => {
    expect(getExperience('ru')[0].focusAreas).toEqual([
      'Многопроектная работа',
      'Банковские системы',
      'Безопасность',
      'Performance Engineering',
    ]);
    expect(getExperience('en')[0].focusAreas).toEqual([
      'Multi-project Delivery',
      'Banking Systems',
      'Security',
      'Performance Engineering',
    ]);
  });

  it('loads article bodies separately from summaries', async () => {
    expect(getArticles('ru')).toHaveLength(ARTICLE_DEFINITIONS.length);
    const article = await getArticle('en', ARTICLE_DEFINITIONS[0].slug);
    expect(article?.content.length).toBeGreaterThan(500);
    expect(await getArticle('en', 'missing')).toBeNull();
  });
});
