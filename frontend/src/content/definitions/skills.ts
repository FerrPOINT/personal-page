import type { SkillDefinition } from '../types';

export const SKILL_DEFINITIONS = [
  {
    "id": "java-spring",
    "order": 1,
    "level": 98,
    "category": "languages",
    "name": {
      "ru": "Java / Spring",
      "en": "Java / Spring"
    }
  },
  {
    "id": "system-design",
    "order": 2,
    "level": 95,
    "category": "infrastructure",
    "name": {
      "ru": "Проектирование систем",
      "en": "System Design"
    }
  },
  {
    "id": "devops",
    "order": 3,
    "level": 92,
    "category": "infrastructure",
    "name": {
      "ru": "DevOps (K8s/Docker)",
      "en": "DevOps (K8s/Docker)"
    }
  },
  {
    "id": "python-ai",
    "order": 4,
    "level": 85,
    "category": "ai",
    "name": {
      "ru": "Python / ИИ",
      "en": "Python / AI"
    }
  },
  {
    "id": "rust-axum",
    "order": 5,
    "level": 82,
    "category": "languages",
    "name": {
      "ru": "Rust / Axum",
      "en": "Rust / Axum"
    }
  },
  {
    "id": "agentic-ai-mcp",
    "order": 6,
    "level": 90,
    "category": "ai",
    "name": {
      "ru": "Agentic AI / MCP",
      "en": "Agentic AI / MCP"
    }
  },
  {
    "id": "react-typescript",
    "order": 7,
    "level": 80,
    "category": "frameworks",
    "name": {
      "ru": "React / TS",
      "en": "React / TS"
    }
  },
  {
    "id": "high-load-aws",
    "order": 8,
    "level": 90,
    "category": "infrastructure",
    "name": {
      "ru": "Высоконагруженные системы / AWS",
      "en": "High-Load / AWS"
    }
  }
] satisfies readonly SkillDefinition[];
