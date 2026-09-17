import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '../../content/types';
import Projects from '../Projects';

const media = (name: string) => ({
  kind: 'cover' as const,
  avif: { small: `/${name}-800.avif`, large: `/${name}-1600.avif` },
  webp: { small: `/${name}-800.webp`, large: `/${name}-1600.webp` },
  alt: { ru: `Схема ${name}`, en: `Diagram ${name}` },
});

const project: Project = {
  slug: 'project',
  order: 1,
  categories: ['ai', 'devops'],
  stack: ['TypeScript', 'Docker'],
  media: [media('one'), { ...media('two'), kind: 'architecture' }],
  title: 'Проект',
  role: 'Архитектор',
  summary: 'Краткое описание',
  context: 'Контекст проекта',
  contribution: ['Мой вклад'],
  challenges: ['Сложность'],
  decisions: ['Решение'],
  results: ['Результат'],
  metrics: [{ value: '10+' }],
};

vi.mock('../../content', () => ({ getProjects: () => [project] }));
vi.mock('../../i18n/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'ru',
    t: (key: string, params?: Record<string, string>) => ({
      'projects.title': 'Проекты',
      'projects.description': 'Описание',
      'projects.categories.all': 'Все',
      'projects.categories.ai': 'ИИ',
      'projects.categories.devops': 'DevOps',
      'projects.categories.fullstack': 'FullStack',
      'projects.viewCaseStudy': 'Подробнее',
      'projects.previousImage': 'Предыдущее изображение',
      'projects.nextImage': 'Следующее изображение',
      'projects.context': 'Контекст',
      'projects.contribution': 'Мой вклад',
      'projects.decisions': 'Решения',
      'projects.challenges': 'Сложности',
      'projects.results': 'Результаты',
      'projects.stack': 'Стек',
      'projects.imageCounter': `Изображение ${params?.current} из ${params?.total}`,
    } as Record<string, string>)[key] ?? key,
  }),
}));

describe('Projects', () => {
  beforeEach(() => vi.clearAllMocks());

  it('filters by canonical category keys', () => {
    render(<Projects />);
    fireEvent.click(screen.getByRole('button', { name: 'ИИ' }));
    expect(screen.getByRole('heading', { name: 'Проект' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ИИ' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('navigates project media with controls and arrow keys', () => {
    render(<Projects />);
    fireEvent.click(screen.getByRole('button', { name: 'Подробнее' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('img', { name: 'Схема one' })).toBeInTheDocument();
    expect(screen.getByText('Изображение 1 из 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Следующее изображение' }));
    expect(within(dialog).getByRole('img', { name: 'Схема two' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(within(dialog).getByRole('img', { name: 'Схема one' })).toBeInTheDocument();
  });
});
