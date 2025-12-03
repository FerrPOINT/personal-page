import { LucideIcon } from 'lucide-react';

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
  achievements: string[];
  tech: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  fullDescription: string; // Detailed description from resume
  role: string;
  challenges: string[];
  results: string[];
  categories: string[]; // Multiple categories per project
  metrics: string[];
  stack: string[];
  imageUrl: string;
}

export interface BlogPost {
  id: string;
  title: string;
  date: string;
  readTime: string;
  excerpt: string;
  content: string; // Full content
  category: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface TechSkill {
  name: string;
  level: number; // 0-100
  category: 'Languages' | 'Frameworks' | 'Infrastructure' | 'AI';
}

