import type { Locale } from './types';
import { getExperience, getProjects, getSkills } from './selectors';

export const CAREER_START_DATE = '2015-08-01' as const;

export const PROFILE_CONTACTS = {
  email: 'ferruspoint@mail.ru',
  phone: '+79833209785',
  phoneDisplay: '+7 (983) 320-97-85',
  telegramUrl: 'https://t.me/azhukov7',
  telegramDisplay: '@azhukov7',
  githubUrl: 'https://github.com/FerrPOINT',
  githubDisplay: 'FerrPOINT',
} as const;

interface ResumeHighlightDefinition {
  slug: string;
  href: string;
  stack: string[];
  locales: Record<Locale, {
    title: string;
    summary: string;
  }>;
}

const RESUME_HIGHLIGHT_DEFINITIONS = [
  {
    slug: 'java-agent',
    href: 'https://github.com/FerrPOINT/java-agent',
    stack: ['Java 25', 'Spring Boot 4.1', 'PostgreSQL', 'REST / SSE', 'MCP', 'Telegram'],
    locales: {
      ru: {
        title: 'Java Agent',
        summary: 'Self-hosted runtime для долгоживущих LLM-сессий с OpenAI-compatible API, CLI, управляемыми инструментами, MCP и Telegram gateway.',
      },
      en: {
        title: 'Java Agent',
        summary: 'A self-hosted runtime for long-lived LLM sessions with OpenAI-compatible APIs, CLI, governed tools, MCP, and a Telegram gateway.',
      },
    },
  },
] satisfies readonly ResumeHighlightDefinition[];

export function getYearsOfExperience(now = new Date()): number {
  const [startYear, startMonth, startDay] = CAREER_START_DATE.split('-').map(Number);
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const currentDay = now.getUTCDate();
  const anniversaryPassed = currentMonth > startMonth
    || (currentMonth === startMonth && currentDay >= startDay);

  return Math.max(0, currentYear - startYear - (anniversaryPassed ? 0 : 1));
}

export function formatYearsOfExperience(locale: Locale, now = new Date()): string {
  const years = getYearsOfExperience(now);
  if (locale === 'en') return `${years}+ ${years === 1 ? 'year' : 'years'}`;

  const suffix = {
    one: 'год',
    few: 'года',
    many: 'лет',
    other: 'лет',
  }[new Intl.PluralRules('ru').select(years)];

  return `${years}+ ${suffix}`;
}

export function getResumeHighlights(locale: Locale) {
  return RESUME_HIGHLIGHT_DEFINITIONS.map(({ locales, ...highlight }) => ({
    ...highlight,
    ...locales[locale],
  }));
}

const RESUME_PROJECT_SLUGS = new Set([
  'pdlc-platform', 'analytics-agent', 'adtech-bidder', 'fintech-crypto',
]);
const REDUNDANT_RESUME_SKILLS = new Set([
  'Java', 'Spring Boot', 'Rust', 'Python', 'React',
  'Frameworks', 'Enterprise Systems', 'Game Dev', 'Mobile Optimization',
]);

export function getResumeData(locale: Locale) {
  const experience = getExperience(locale);
  const skills = getSkills(locale);
  const highlights = getResumeHighlights(locale);
  const projects = getProjects(locale).filter((project) => RESUME_PROJECT_SLUGS.has(project.slug));
  const focusAreas = Array.from(new Set(experience.flatMap((item) => item.focusAreas))).slice(0, 12);
  const technicalSkills = Array.from(new Set([
    ...skills.map((skill) => skill.name),
    ...highlights.flatMap((project) => project.stack),
    ...projects.flatMap((project) => project.stack),
    ...experience.flatMap((item) => item.tech),
  ])).filter((skill) => !REDUNDANT_RESUME_SKILLS.has(skill));
  return { experience, highlights, projects, focusAreas, technicalSkills };
}
