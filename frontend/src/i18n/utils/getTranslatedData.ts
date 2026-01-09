import { ExperienceItem, Project, BlogPost, TechSkill } from '../../types';
import { Language } from './languageDetector';
import { translations } from '../translations';

/**
 * Получает переведенные данные опыта работы
 */
export const getTranslatedExperience = (language: Language): ExperienceItem[] => {
  const exp = translations[language].experience?.items;
  if (!exp) return [];
  
  return exp.map((item: any) => ({
    id: item.id,
    role: item.role,
    company: item.company,
    period: item.period,
    description: item.description,
    achievements: item.achievements || [],
    tech: item.tech || []
  }));
};

/**
 * Получает переведенные данные проектов
 */
export const getTranslatedProjects = (language: Language): Project[] => {
  const proj = translations[language].projects?.items;
  if (!proj) return [];
  
  return proj.map((item: any) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    fullDescription: item.fullDescription,
    role: item.role,
    challenges: item.challenges || [],
    results: item.results || [],
    categories: item.categories || [],
    metrics: item.metrics || [],
    stack: item.stack || [],
    imageUrl: item.imageUrl
  }));
};

/**
 * Получает переведенные данные блога
 */
export const getTranslatedBlogPosts = (language: Language): BlogPost[] => {
  const posts = translations[language].insights?.posts;
  if (!posts) return [];
  
  return posts.map((item: any) => ({
    id: item.id,
    title: item.title,
    date: item.date,
    readTime: item.readTime,
    excerpt: item.excerpt,
    content: item.content,
    category: item.category
  }));
};

/**
 * Получает переведенные категории
 */
export const getTranslatedCategories = (language: Language): Record<string, string> => {
  return translations[language].projects?.categories || {};
};

/**
 * Получает переведенные навыки
 */
export const getTranslatedSkills = (language: Language): TechSkill[] => {
  const skills = translations[language].techStack?.skills;
  if (!skills) return [];
  
  return skills.map((skill: any) => ({
    name: skill.name,
    level: skill.level,
    category: skill.category
  }));
};

/**
 * Получает маппинг категорий для отображения (для проектов и блога)
 */
export const getCategoryMap = (language: Language, t: (key: string) => string): Record<string, string> => {
  const categories = translations[language].projects?.categories || {};
  return {
    'AI': categories.ai || 'AI',
    'DevOps': categories.devops || 'DevOps',
    'FullStack': categories.fullstack || 'FullStack',
    'All': categories.all || t('projects.categories.all'),
    // Категории для блога
    'AI Architecture': language === 'ru' ? 'Архитектура ИИ' : 'AI Architecture',
    'High-Load': language === 'ru' ? 'Высокая нагрузка' : 'High-Load',
    'Security': language === 'ru' ? 'Безопасность' : 'Security'
  };
};

