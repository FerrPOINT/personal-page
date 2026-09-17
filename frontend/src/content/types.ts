export type Locale = 'ru' | 'en';
export type ProjectCategory = 'ai' | 'devops' | 'fullstack';
export type ArticleCategory = 'ai-architecture' | 'high-load' | 'security';

export interface ImageSourceSet {
  small: string;
  large: string;
}

export interface ProjectMedia {
  kind: 'cover' | 'architecture' | 'screen';
  avif: ImageSourceSet;
  webp: ImageSourceSet;
  alt: Record<Locale, string>;
  caption?: Record<Locale, string>;
  objectPosition?: string;
}

export interface ProjectLink {
  label: Record<Locale, string>;
  href: string;
}

export interface ProjectMetric {
  value: string;
  label?: string;
}

export interface ProjectLocaleContent {
  title: string;
  role: string;
  summary: string;
  context: string;
  contribution: string[];
  challenges: string[];
  decisions: string[];
  results: string[];
  metrics: ProjectMetric[];
}

export interface ProjectDefinition {
  slug: string;
  order: number;
  categories: ProjectCategory[];
  stack: string[];
  period?: string;
  links?: ProjectLink[];
  media: ProjectMedia[];
  locales: Record<Locale, ProjectLocaleContent>;
}

export interface Project extends Omit<ProjectDefinition, 'locales'>, ProjectLocaleContent {}

export interface ExperienceLocaleContent {
  role: string;
  period: string;
  description: string;
  focusAreas?: string[];
  achievements: string[];
}

export interface ExperienceDefinition {
  id: string;
  order: number;
  company: string;
  tech: string[];
  locales: Record<Locale, ExperienceLocaleContent>;
}

export interface ExperienceItem extends Omit<ExperienceDefinition, 'locales' | 'order'>, ExperienceLocaleContent {}

export interface SkillDefinition {
  id: string;
  order: number;
  level: number;
  category: 'languages' | 'frameworks' | 'infrastructure' | 'ai';
  name: Record<Locale, string>;
}

export interface TechSkill {
  id: string;
  name: string;
  level: number;
  category: SkillDefinition['category'];
}

export interface ArticleLocaleContent {
  title: string;
  date: string;
  readTime: string;
  excerpt: string;
}

export interface ArticleDefinition {
  slug: string;
  order: number;
  category: ArticleCategory;
  locales: Record<Locale, ArticleLocaleContent>;
}

export interface ArticleSummary extends Omit<ArticleDefinition, 'locales' | 'order'>, ArticleLocaleContent {}
export interface BlogPost extends ArticleSummary { content: string }
