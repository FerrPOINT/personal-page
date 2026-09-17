import {
  ARTICLE_DEFINITIONS,
  EXPERIENCE_DEFINITIONS,
  PROJECT_DEFINITIONS,
  SKILL_DEFINITIONS,
} from './definitions';
import type { Locale } from './types';

const locales: Locale[] = ['ru', 'en'];
const allowedCategories = new Set(['ai', 'devops', 'fullstack']);

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} must be unique`);
}

function assertLocalizedRecord(record: Record<Locale, unknown>, label: string): void {
  for (const locale of locales) {
    if (!record[locale]) throw new Error(`${label} is missing locale ${locale}`);
  }
}

function assertText(value: string, label: string): void {
  if (!value.trim()) throw new Error(`${label} must not be empty`);
}

export function assertPortfolioContent(): void {
  assertUnique(PROJECT_DEFINITIONS.map((project) => project.slug), 'Project slugs');
  assertUnique(EXPERIENCE_DEFINITIONS.map((experience) => experience.id), 'Experience ids');
  assertUnique(SKILL_DEFINITIONS.map((skill) => skill.id), 'Skill ids');
  assertUnique(ARTICLE_DEFINITIONS.map((article) => article.slug), 'Article slugs');

  for (const project of PROJECT_DEFINITIONS) {
    assertLocalizedRecord(project.locales, `Project ${project.slug}`);
    if (project.media.length === 0) throw new Error(`Project ${project.slug} needs media`);
    if (project.categories.some((category) => !allowedCategories.has(category))) {
      throw new Error(`Project ${project.slug} has an invalid category`);
    }
    for (const media of project.media) {
      assertLocalizedRecord(media.alt, `Media alt for ${project.slug}`);
      const urls = [media.avif.small, media.avif.large, media.webp.small, media.webp.large];
      if (urls.some((url) => /^https?:\/\//i.test(url))) {
        throw new Error(`Project ${project.slug} must use local media`);
      }
    }
    for (const locale of locales) {
      const content = project.locales[locale];
      assertText(content.title, `Project ${project.slug} title (${locale})`);
      assertText(content.summary, `Project ${project.slug} summary (${locale})`);
      assertText(content.context, `Project ${project.slug} context (${locale})`);
      if ([content.contribution, content.challenges, content.decisions, content.results, content.metrics]
        .some((items) => items.length === 0)) {
        throw new Error(`Project ${project.slug} has incomplete content (${locale})`);
      }
    }
  }

  for (const experience of EXPERIENCE_DEFINITIONS) {
    assertLocalizedRecord(experience.locales, `Experience ${experience.id}`);
    for (const locale of locales) {
      const content = experience.locales[locale];
      assertText(content.role, `Experience ${experience.id} role (${locale})`);
      assertText(content.description, `Experience ${experience.id} description (${locale})`);
      if (content.achievements.length === 0 || content.achievements.some((item) => !item.trim())) {
        throw new Error(`Experience ${experience.id} has incomplete achievements (${locale})`);
      }
      if (content.focusAreas?.some((item) => !item.trim())) {
        throw new Error(`Experience ${experience.id} has incomplete focus areas (${locale})`);
      }
    }
  }
  for (const article of ARTICLE_DEFINITIONS) {
    assertLocalizedRecord(article.locales, `Article ${article.slug}`);
  }
  for (const skill of SKILL_DEFINITIONS) {
    if (skill.level < 0 || skill.level > 100) throw new Error(`Skill ${skill.id} has an invalid level`);
  }
}

assertPortfolioContent();
