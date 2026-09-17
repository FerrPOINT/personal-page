import {
  ARTICLE_DEFINITIONS,
  EXPERIENCE_DEFINITIONS,
  PROJECT_DEFINITIONS,
  SKILL_DEFINITIONS,
} from './definitions';
import type {
  ArticleSummary,
  BlogPost,
  ExperienceItem,
  Locale,
  Project,
  TechSkill,
} from './types';

const articleBodies: Record<string, Record<Locale, () => Promise<string>>> = {
  'multi-agent-production': {
    ru: () => import('./articles/multi-agent-production.ru.md?raw').then((module) => module.default),
    en: () => import('./articles/multi-agent-production.en.md?raw').then((module) => module.default),
  },
  'extreme-scale-adtech': {
    ru: () => import('./articles/extreme-scale-adtech.ru.md?raw').then((module) => module.default),
    en: () => import('./articles/extreme-scale-adtech.en.md?raw').then((module) => module.default),
  },
  'gost-fintech': {
    ru: () => import('./articles/gost-fintech.ru.md?raw').then((module) => module.default),
    en: () => import('./articles/gost-fintech.en.md?raw').then((module) => module.default),
  },
};

export function getProjects(locale: Locale): Project[] {
  return [...PROJECT_DEFINITIONS]
    .sort((left, right) => left.order - right.order)
    .map(({ locales, ...project }) => ({ ...project, ...locales[locale] }));
}

export function getExperience(locale: Locale): ExperienceItem[] {
  return [...EXPERIENCE_DEFINITIONS]
    .sort((left, right) => left.order - right.order)
    .map(({ locales, order: _order, ...experience }) => ({ ...experience, ...locales[locale] }));
}

export function getSkills(locale: Locale): TechSkill[] {
  return [...SKILL_DEFINITIONS]
    .sort((left, right) => left.order - right.order)
    .map(({ name, order: _order, ...skill }) => ({ ...skill, name: name[locale] }));
}

export function getArticles(locale: Locale): ArticleSummary[] {
  return [...ARTICLE_DEFINITIONS]
    .sort((left, right) => left.order - right.order)
    .map(({ locales, order: _order, ...article }) => ({ ...article, ...locales[locale] }));
}

export async function getArticle(locale: Locale, slug: string): Promise<BlogPost | null> {
  const summary = getArticles(locale).find((article) => article.slug === slug);
  const loader = articleBodies[slug]?.[locale];
  if (!summary || !loader) return null;
  return { ...summary, content: await loader() };
}
